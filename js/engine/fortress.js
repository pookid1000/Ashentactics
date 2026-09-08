// ASHEN TACTICS — Fortress roguelike mode: run engine (DS.Fortress).
// Owns everything about a live run: map generation, node resolution, perk/
// run-weapon application onto battle units, and win/loss finalization. Every
// mutating call ends in DS.Save.persist(), same convention as every other
// engine module. See js/data/fortress.js for the static pools this reads.
//
// No changes are made anywhere in js/engine/battle.js or js/engine/progression.js
// — perks/run-weapons are spliced onto an already-built battle unit spec from
// the outside (see applyRunModifiers), exactly the way js/engine/battle.js's
// fxSum()/fxEntries() already read a unit's .fx array generically by key.

window.DS = window.DS || {};

(function () {
  function activeRun() { return DS.State.fortress && DS.State.fortress.active; }
  function hasActiveRun() { return !!activeRun(); }
  function getRecords() { return DS.State.fortress.records; }

  // ---------- map generation ----------

  // Spreads n points across a [lo, hi] range (in 0-100 viewBox units).
  function positionsInRange(n, lo, hi) {
    if (n <= 1) return [(lo + hi) / 2];
    const out = [];
    for (let i = 0; i < n; i++) out.push(lo + i * (hi - lo) / (n - 1));
    return out;
  }

  // How many non-boss floors share one visual row, snaking left-to-right
  // then right-to-left down the screen. A lone floor-per-row (the original
  // design) forced an extremely tall, narrow viewBox the instant the map
  // went full-width — this is what actually lets the graph use the screen's
  // real (landscape) shape: several floors visible side by side, far fewer
  // rows needed overall, so much more of a run is visible without scrolling.
  // Dropped from 3 to 2 so each floor's 3 nodes get half the row's width
  // instead of a third — branches read as clearly spread apart again rather
  // than crowded together, at the cost of more rows (the wrap already scrolls
  // to accommodate that).
  const FLOORS_PER_ROW = 2;

  function weightBandForFloor(floor) {
    if (floor <= 9) return 'early';
    if (floor <= 16) return 'mid';
    return 'late';
  }

  // Rolls a kind per node on a floor, with a small repair pass so economy/
  // utility nodes don't cluster too heavily on one floor. Cap scales with
  // floor width (rather than a flat "1") so a wider floor still gets
  // proportionally as much variety instead of being squeezed to just one of
  // each. Capped kinds are the "opt-in utility" ones whose weight a Boon can
  // multiply well past normal (shop/forge/wager/altar) — normal/elite/trap/
  // event/rest are left uncapped since nothing pushes those anywhere near as
  // hard.
  const CAPPED_KINDS = ['shop', 'forge', 'wager', 'altar'];
  function rollFloorKinds(floor, count, boon) {
    const table = applyBoonWeights(DS.FORTRESS_CONFIG.nodeWeights[weightBandForFloor(floor)], boon);
    const cap = Math.max(1, Math.ceil(count / 3));
    let kinds = [];
    for (let attempt = 0; attempt < 6; attempt++) {
      kinds = [];
      for (let i = 0; i < count; i++) kinds.push(DS.RNG.weighted(table).kind);
      const overCap = CAPPED_KINDS.some((k) => kinds.filter((x) => x === k).length > cap);
      if (!overCap) break;
    }
    return kinds;
  }

  // Multiplies specific kinds' weights per the active Boon (see
  // queueBoonChoice/chooseBoon) — pure, never mutates DS.FORTRESS_CONFIG's
  // own table, since every floor's roll re-reads it every run.
  function applyBoonWeights(table, boon) {
    if (!boon || !boon.weightMods) return table;
    return table.map((entry) => {
      const mod = boon.weightMods[entry.kind];
      return mod ? Object.assign({}, entry, { weight: Math.max(1, Math.round(entry.weight * mod)) }) : entry;
    });
  }

  // Buckets floor numbers 1..totalFloors into visual rows: every boss floor
  // gets its own single-column row (the checkpoint "waist" everything funnels
  // through), and every run of non-boss floors between checkpoints gets
  // packed FLOORS_PER_ROW-at-a-time into rows that alternate direction
  // (serpentine), so consecutive floors' rows visually connect edge-to-edge
  // instead of each new row starting back at the far side. Purely a layout
  // detail — nodeState()'s forward-lock logic only ever compares floor
  // NUMBERS, never row/column, so none of the reachability logic below cares
  // that several floors now share a row.
  function assignRows(cfg) {
    const rowOf = {};
    let row = 0;
    let band = [];
    function flushBand() {
      for (let i = 0; i < band.length; i += FLOORS_PER_ROW) {
        const rowFloors = band.slice(i, i + FLOORS_PER_ROW);
        const reversed = row % 2 === 1;
        rowFloors.forEach((floorNum, idx) => {
          const col = reversed ? (rowFloors.length - 1 - idx) : idx;
          rowOf[floorNum] = { row, col, colsInRow: rowFloors.length };
        });
        row++;
      }
      band = [];
    }
    for (let f = 1; f <= cfg.totalFloors; f++) {
      if (cfg.bossFloors.indexOf(f) >= 0) {
        flushBand();
        rowOf[f] = { row, col: 0, colsInRow: 1 };
        row++;
      } else {
        band.push(f);
      }
    }
    flushBand();
    return { rowOf, totalRows: row };
  }

  function generateGraph(boon) {
    const cfg = DS.FORTRESS_CONFIG;
    const nodes = {};
    const edges = [];
    const floors = [];
    let counter = 0;
    const { rowOf, totalRows } = assignRows(cfg);

    for (let f = 1; f <= cfg.totalFloors; f++) {
      const isBoss = cfg.bossFloors.indexOf(f) >= 0;
      const count = isBoss ? 1 : cfg.floorNodeCount;
      const kinds = isBoss ? ['boss'] : rollFloorKinds(f, count, boon);
      const { col, colsInRow } = rowOf[f];
      const colWidth = 100 / colsInRow;
      const margin = colWidth * 0.15;
      const xs = positionsInRange(count, col * colWidth + margin, (col + 1) * colWidth - margin);
      const ids = [];
      for (let i = 0; i < count; i++) {
        const id = 'n' + (++counter);
        nodes[id] = {
          id, floor: f, kind: kinds[i], x: xs[i], y: 0,
          resolved: false, data: null, isFinal: f === cfg.finalFloor,
        };
        ids.push(id);
      }
      floors.push(ids);
    }

    // y positions: one step per ROW (several floors can share a row — see
    // assignRows above). Nodes themselves render at 75% scale (see the
    // translate+scale on .map-node in js/ui/fortress-ui.js) specifically so
    // rows can sit this close without visually crowding — the viewBox now
    // works out close to a 1:1 square instead of a tall, narrow column, so
    // the graph reads as "a map" rather than "a list to scroll through."
    const stepY = 10;
    const topPad = 6;
    Object.keys(nodes).forEach((id) => { nodes[id].y = topPad + rowOf[nodes[id].floor].row * stepY; });
    const height = topPad + (totalRows - 1) * stepY + 8;

    // 'ember' is a virtual, not-a-real-node source — every floor-1 node is fed
    // from it, standing in for "the world's own entry point" the Expedition
    // map's algorithm already treats as always-unlocked (see nodeState below).
    floors[0].forEach((id) => edges.push(['ember', id]));

    for (let i = 0; i < floors.length - 1; i++) {
      const a = floors[i];
      const b = floors[i + 1];
      if (b.length === 1) {
        a.forEach((id) => edges.push([id, b[0]]));
      } else if (a.length === 1) {
        b.forEach((id) => edges.push([a[0], id]));
      } else {
        // Always at least 2 outgoing edges (never just 1) whenever the next
        // floor actually has room for it — a real fork every time a node
        // clears, not a coin-flip that sometimes collapses to a single
        // forced path. That's what makes the map a strategic choice rather
        // than the game just deciding where you go next.
        const fed = {};
        a.forEach((id) => {
          const k = Math.min(b.length, DS.RNG.int(2, 3));
          DS.RNG.shuffle(b).slice(0, k).forEach((toId) => { edges.push([id, toId]); fed[toId] = true; });
        });
        b.forEach((toId) => { if (!fed[toId]) edges.push([DS.RNG.pick(a), toId]); });
      }
    }

    placeSecretNodes(nodes, floors, cfg);

    return { nodes, edges, height };
  }

  // Overwrites 1 node's kind on 2-3 non-boss, non-boss-adjacent floors (f≥4)
  // to 'secret' — a deliberate post-pass, not a weighted nodeWeights roll,
  // since these need to be rare and not diluted by a Boon. Safe to overwrite
  // whatever kind rollFloorKinds() already picked there: node.data hasn't
  // been lazily rolled yet, so nothing is wasted. See isSecretRevealed/
  // displayNodeState for how these stay indistinguishable from a normal
  // locked node until found.
  function placeSecretNodes(nodes, floors, cfg) {
    const bossFloors = cfg.bossFloors;
    const eligible = [];
    for (let f = 4; f <= cfg.totalFloors; f++) {
      if (bossFloors.indexOf(f) >= 0) continue;
      if (bossFloors.indexOf(f - 1) >= 0 || bossFloors.indexOf(f + 1) >= 0) continue;
      eligible.push(f);
    }
    DS.RNG.shuffle(eligible).slice(0, Math.min(3, eligible.length)).forEach((f) => {
      const ids = floors[f - 1];
      if (!ids || !ids.length) return;
      const recipes = DS.FORTRESS_SECRETS.filter((s) => f >= s.floorRange[0] && f <= s.floorRange[1]);
      if (!recipes.length) return;
      const recipe = DS.RNG.pick(recipes);
      const targetId = DS.RNG.pick(ids);
      nodes[targetId].kind = 'secret';
      nodes[targetId].secretRecipeId = recipe.id;
    });
  }

  // A not-yet-revealed secret still needs normal reachability (an incoming
  // edge from a visited node) — this only gates whether it's ENTERABLE once
  // reachable, scaled down by a Seeker's Instinct Boon if active.
  function isSecretRevealed(nodeId) {
    const active = activeRun();
    const node = active && active.graph && active.graph.nodes[nodeId];
    const recipe = node && DS.FORTRESS_SECRETS.find((s) => s.id === node.secretRecipeId);
    if (!recipe) return false;
    const bias = (active.boon && active.boon.secretRevealBias) || 1;
    const need = recipe.reveal.value * bias;
    if (recipe.reveal.type === 'cinders') return active.cinders >= need;
    if (recipe.reveal.type === 'perks') return active.perks.length >= need;
    if (recipe.reveal.type === 'squad') return active.squad.length >= need;
    return false;
  }

  function startRun() {
    const owned = Object.keys(DS.State.roster);
    DS.State.fortress.active = {
      floorIndex: 0, totalFloors: DS.FORTRESS_CONFIG.totalFloors,
      // Built once a Boon is chosen (see chooseBoon) rather than here — the
      // Boon needs to bias generateGraph()'s weighted kind-rolls, and it
      // isn't picked until after the starter is. js/ui/fortress-ui.js's
      // render() shows a placeholder in the graph's place until this exists.
      graph: null,
      currentNodeId: null,
      visited: {},
      // Rolled once, here, rather than every time the starter-pick screen
      // renders — otherwise the 3 offered characters would reshuffle under
      // the player mid-decision on any incidental rerender.
      starterOptions: DS.RNG.shuffle(owned).slice(0, 3),
      squad: [], wounded: {}, woundsCuredCount: 0,
      // charId -> fraction of Max HP they ended their last fight at (see
      // getHpFraction/recordHpFractions) — absence means full HP. Damage no
      // longer fully resets between fights; only a shop's Cure Wounds
      // (see cureWounds) or a fresh recruit starts anyone back at full.
      hpFractions: {},
      perks: [], cinders: 0,
      runWeapons: {}, equippedRunWeapon: {},
      // Rest-node progression — charId -> in-run level (see levelUpChar/
      // buildFortressUnit), and charId -> {helm,armor,ring,talisman}/weapon
      // uid referencing the player's REAL owned relics/weapons (see
      // equipRunRelic/equipRunRealWeapon). Purely virtual: nothing here ever
      // writes back to DS.State.inventory or DS.State.roster, so it costs
      // nothing real to use and grants nothing real when the run ends.
      charLevels: {}, equippedRelics: {}, equippedRealWeapon: {},
      // Run-wide, never-curable debuffs taken at an Altar node (see
      // chooseAltarBargain/applyRunModifiers) — unlike wounds these aren't
      // per-character and can't be cleared at a shop.
      curses: [],
      // The once-per-run pick from queueBoonChoice/chooseBoon that reshapes
      // this run's node-kind odds (see generateGraph/rollFloorKinds).
      boon: null,
      log: [],
      pendingChoice: null, choiceQueue: [],
      reviveUsed: false,
    };
    DS.Save.persist();
  }

  // Reachability mirrors js/ui/hub-ui.js's mapNodeState() exactly (a node is
  // reachable once ANY incoming edge's source is cleared), with one addition:
  // that algorithm was built for a PERMANENT, always-revisitable world map —
  // a Fortress run is forward-only, so an untaken sibling on a floor you've
  // already moved past must lock out for good rather than staying eternally
  // "unlocked but never entered."
  function nodeState(nodeId) {
    const active = activeRun();
    if (!active) return 'locked';
    if (!active.graph) return 'locked'; // no graph yet — still choosing a Boon
    if (active.visited[nodeId]) return 'cleared';
    const node = active.graph.nodes[nodeId];
    if (!node) return 'locked';
    const currentFloor = active.currentNodeId ? active.graph.nodes[active.currentNodeId].floor : 0;
    if (node.floor <= currentFloor) return 'locked';
    const incoming = active.graph.edges.filter((e) => e[1] === nodeId);
    const ready = incoming.some((e) => (e[0] === 'ember' ? active.currentNodeId === null : !!active.visited[e[0]]));
    return ready ? 'unlocked' : 'locked';
  }

  function currentOptions() {
    const active = activeRun();
    if (!active) return [];
    return Object.keys(active.graph.nodes).filter((id) => nodeState(id) === 'unlocked');
  }

  function completeNode(nodeId) {
    const active = activeRun();
    if (!active) return;
    active.visited[nodeId] = true;
    active.currentNodeId = nodeId;
    const node = active.graph.nodes[nodeId];
    if (node) active.floorIndex = node.floor;
    // A node's own interaction (shop, event, altar, etc.) may have queued a
    // choice mid-flow (e.g. an equip-relic prompt from a relic grant) — this
    // is the one place every node kind's resolution passes through, so it's
    // the natural spot to surface it rather than adding a presentNextChoice()
    // call at every individual "Leave"/"Continue" button in the UI.
    presentNextChoice();
    DS.Save.persist();
  }

  // ---------- perk offers ----------

  function pickPerkOptions(context, count) {
    count = count || 3;
    const table = DS.FORTRESS_CONFIG.perkRarityWeights[context] || DS.FORTRESS_CONFIG.perkRarityWeights.normalEarly;
    const chosen = [];
    const used = {};
    let guard = 0;
    while (chosen.length < count && guard < 60) {
      guard++;
      const rarity = DS.RNG.weighted(table).rarity;
      const pool = DS.FORTRESS_PERKS.filter((p) => p.rarity === rarity && !used[p.id]);
      if (!pool.length) continue;
      const perk = DS.RNG.pick(pool);
      used[perk.id] = true;
      chosen.push(perk);
    }
    if (chosen.length < count) {
      DS.RNG.shuffle(DS.FORTRESS_PERKS.filter((p) => !used[p.id])).slice(0, count - chosen.length).forEach((p) => {
        used[p.id] = true; chosen.push(p);
      });
    }
    return chosen;
  }

  function presentNextChoice() {
    const active = activeRun();
    if (!active || active.pendingChoice) return;
    if (active.choiceQueue.length) active.pendingChoice = active.choiceQueue.shift();
    DS.Save.persist();
  }

  function queuePerkChoice(context) {
    const active = activeRun();
    if (!active) return;
    active.choiceQueue.push({ type: 'perk', perkOptions: pickPerkOptions(context, 3) });
  }

  function queueRecruitChoice() {
    const active = activeRun();
    if (!active) return;
    const owned = Object.keys(DS.State.roster).filter((id) => active.squad.indexOf(id) < 0);
    active.choiceQueue.push({ type: 'recruit', recruitOptions: DS.RNG.shuffle(owned).slice(0, 3) });
  }

  // Corvane's boss-clear cameo — a single line + "Continue," queued after
  // the perk/recruit choices so it shows last (see onNodeBattleWon).
  function queueCompanionChoice(context) {
    const active = activeRun();
    if (!active) return;
    const pool = DS.FORTRESS_COMPANION[context + 'Lines'];
    if (!pool || !pool.length) return;
    active.choiceQueue.push({ type: 'companion', context, line: DS.RNG.pick(pool) });
  }

  function dismissCompanion() {
    const active = activeRun();
    if (!active || !active.pendingChoice || active.pendingChoice.type !== 'companion') return;
    active.pendingChoice = null;
    presentNextChoice();
    DS.Save.persist();
  }

  // The rest node's companion choice — layered inside that node's own modal
  // (see openRestModal), not a queued pendingChoice, since the node itself
  // isn't completed until "Leave" is clicked there regardless.
  function chooseCompanionRestOption(nodeId, idx) {
    const active = activeRun();
    const node = active && active.graph.nodes[nodeId];
    if (!node || node.kind !== 'rest' || !node.data || node.data.companionChoiceMade) return { ok: false };
    const choice = DS.FORTRESS_COMPANION.restChoices[idx];
    if (!choice) return { ok: false };
    if (choice.grantPerk) active.perks.push(Object.assign({}, choice.grantPerk, { instanceId: DS.RNG.uuid() }));
    if (typeof choice.cinders === 'number') active.cinders += choice.cinders;
    node.data.companionChoiceMade = true;
    DS.Save.persist();
    return { ok: true };
  }

  function queueBoonChoice() {
    const active = activeRun();
    if (!active) return;
    active.choiceQueue.push({ type: 'boon', boonOptions: DS.RNG.shuffle(DS.FORTRESS_BOONS.slice()) });
  }

  // Builds the graph now that a Boon exists to bias its weighted kind-rolls
  // (see generateGraph/applyBoonWeights) — this is why generateGraph() isn't
  // called inside startRun() itself; see the 'graph: null' comment there.
  function chooseBoon(idx) {
    const active = activeRun();
    if (!active || !active.pendingChoice || active.pendingChoice.type !== 'boon') return;
    const boon = active.pendingChoice.boonOptions[idx];
    if (!boon) return;
    active.boon = boon;
    active.graph = generateGraph(boon);
    active.pendingChoice = null;
    presentNextChoice();
    DS.Save.persist();
  }

  function chooseStarter(charId) {
    const active = activeRun();
    if (!active || active.squad.length) return;
    active.squad = [charId];
    queueBoonChoice();
    queuePerkChoice('start');
    presentNextChoice();
    DS.Save.persist();
  }

  function choosePerkOffer(idx) {
    const active = activeRun();
    if (!active || !active.pendingChoice || active.pendingChoice.type !== 'perk') return;
    const perk = active.pendingChoice.perkOptions[idx];
    if (perk) active.perks.push(Object.assign({}, perk, { instanceId: DS.RNG.uuid() }));
    active.pendingChoice = null;
    presentNextChoice();
    DS.Save.persist();
  }

  function chooseRecruit(charId) {
    const active = activeRun();
    if (!active || !active.pendingChoice || active.pendingChoice.type !== 'recruit') return;
    if (charId && active.squad.length < 4 && active.squad.indexOf(charId) < 0) active.squad.push(charId);
    active.pendingChoice = null;
    presentNextChoice();
    DS.Save.persist();
  }

  // ---------- lazy node content ----------

  function rollShopStock(active, node) {
    const paths = active.squad.map((id) => { const c = DS.C.findChar(id); return c && c.path; }).filter(Boolean);
    let pool = (DS.WEAPONS || []).filter((w) => paths.indexOf(w.path) >= 0);
    if (!pool.length) pool = DS.WEAPONS || [];
    const weaponDef = pool.length ? DS.RNG.pick(pool) : null;
    // Decided now (for display) but only actually rolled into a real relic
    // instance on purchase (see buyShopRelic) — nothing is created just by
    // the offer existing.
    const relicSet = DS.RNG.pick(DS.RELIC_SETS || []);
    const relicSlot = DS.RNG.pick(DS.SLOTS || ['helm', 'armor', 'ring', 'talisman']);
    const shop = {
      perkOffers: pickPerkOptions('normalLate', 2),
      weaponOfferDefId: weaponDef ? weaponDef.id : null,
      relicOffer: relicSet ? { setId: relicSet.id, slot: relicSlot, rarity: 4 } : null,
      bought: {},
    };
    // Mirelle reacts to run state — priority order: a curse taken beats
    // wounds cured beats a heavy perk count beats plain depth-based flavor.
    const merch = DS.FORTRESS_MERCHANT;
    if ((active.curses || []).length) shop.merchantLine = DS.RNG.pick(merch.linesCurseTaken);
    else if ((active.woundsCuredCount || 0) >= 2) shop.merchantLine = DS.RNG.pick(merch.linesWoundsCured);
    else if (active.perks.length >= 8) shop.merchantLine = DS.RNG.pick(merch.linesManyPerks);
    else shop.merchantLine = DS.RNG.pick(merch.linesByDepth[weightBandForFloor(node.floor)]);
    if ((active.curses || []).length >= merch.bonusOffer.requiresCurses) {
      const bonusPool = DS.FORTRESS_PERKS.filter((p) => (p.rarity || 0) >= merch.bonusOffer.perkRarityFloor);
      if (bonusPool.length) shop.bonusPerkOffer = DS.RNG.pick(bonusPool);
    }
    return shop;
  }

  function rollNodeData(node, active) {
    const cfg = DS.FORTRESS_CONFIG;
    const level = cfg.enemyLevelForFloor(node.floor);
    if (node.kind === 'normal') {
      // minFloor is optional (defaults to 1, i.e. no gate) — lets a fodder
      // entry hold back from appearing until deeper into a run (see the
      // 'humanity' enemy, js/data/enemies.js) without needing a separate
      // per-floor spawn table.
      const pool = (DS.ENEMIES || []).filter((e) => e.tier === 'fodder' && (e.minFloor || 1) <= node.floor);
      // The first several floors only ever have 1-2 squad members (recruits
      // are still rare this early) — facing 2-3 enemies at once with a
      // fresh, underleveled company is brutal, so the earliest fights stay
      // small (extended from floor<=3 per user feedback that the opening
      // stretch still ran too hard even after the level-curve nerf below).
      const count = node.floor <= 5 ? DS.RNG.int(1, 2) : DS.RNG.int(2, 3);
      const spawns = [];
      for (let i = 0; i < count && pool.length; i++) spawns.push({ id: DS.RNG.pick(pool).id, level });
      return { spawns };
    }
    if (node.kind === 'elite') {
      const pool = (DS.ENEMIES || []).filter((e) => e.tier === 'elite');
      const count = DS.RNG.int(1, 2);
      const spawns = [];
      for (let i = 0; i < count && pool.length; i++) spawns.push({ id: DS.RNG.pick(pool).id, level });
      return { spawns };
    }
    if (node.kind === 'boss') {
      const pool = (DS.ENEMIES || []).filter((e) => e.tier === 'boss');
      return { spawns: pool.length ? [{ id: DS.RNG.pick(pool).id, level }] : [] };
    }
    if (node.kind === 'trap') return { trap: DS.RNG.pick(DS.FORTRESS_TRAPS) };
    if (node.kind === 'event') return { event: DS.RNG.pick(DS.FORTRESS_EVENTS) };
    if (node.kind === 'shop') return { shop: rollShopStock(active, node) };
    if (node.kind === 'rest') {
      // A rest node also offers a free recruit — 3 owned-but-not-in-squad
      // characters, rolled once on first entry same as every other lazy
      // node roll, one pick per node (see recruitAtRest below).
      const owned = Object.keys(DS.State.roster).filter((id) => active.squad.indexOf(id) < 0);
      // Corvane doesn't show up at every single rest node (they can appear
      // 4-8 times a run) — a 60% chance keeps his cameo feeling occasional
      // rather than spammy.
      const companionLine = DS.RNG.chance(0.6) ? DS.RNG.pick(DS.FORTRESS_COMPANION.restLines) : null;
      return {
        recruitOptions: DS.RNG.shuffle(owned).slice(0, 3), recruited: false,
        companionLine, companionChoiceMade: false,
      };
    }
    if (node.kind === 'altar') {
      // 3 curse/perk pairs to CHOOSE from — a deliberate trade-off, not a
      // random roll. See DS.Fortress.chooseAltarBargain.
      return { altar: { options: DS.RNG.shuffle(DS.FORTRESS_CURSES.slice()).slice(0, 3), chosen: false } };
    }
    if (node.kind === 'secret') {
      // Only ever reached once the node is both reachable AND revealed (see
      // isSecretRevealed/displayNodeState) — the recipe itself was decided
      // at placeSecretNodes() generation time, see node.secretRecipeId.
      const recipe = DS.FORTRESS_SECRETS.find((s) => s.id === node.secretRecipeId);
      const data = { recipe, claimed: false };
      if (recipe && recipe.reward.kind === 'cinders_recruit') {
        const owned = Object.keys(DS.State.roster).filter((id) => active.squad.indexOf(id) < 0);
        data.recruitOptions = DS.RNG.shuffle(owned).slice(0, 3);
      }
      return { secret: data };
    }
    // 'forge' and 'wager' need no rolled data — forge reads live off
    // active.runWeapons/active.equippedRunWeapon, wager off the static
    // DS.FORTRESS_WAGER tier table, both straight from js/ui/fortress-ui.js's
    // openForgeModal()/openWagerModal().
    return {};
  }

  // Rolls a node's actual contents the instant it's first entered (not at
  // generation time) — a node's kind/position is fixed at startRun() since the
  // map needs to draw it, but what's actually inside stays unrolled until the
  // player reaches it, so branches never taken never waste a roll.
  function ensureNodeData(nodeId) {
    const active = activeRun();
    if (!active) return null;
    const node = active.graph.nodes[nodeId];
    if (!node) return null;
    if (!node.data) node.data = rollNodeData(node, active);
    return node;
  }

  // ---------- shop ----------

  // idx === 'bonus' buys Mirelle's curse-gated bonus offer instead of one of
  // the 2 normal perkOffers — same shape/flow, just a different price and
  // source list (see rollShopStock's bonusPerkOffer).
  function buyShopPerk(nodeId, idx) {
    const active = activeRun();
    const node = active && active.graph.nodes[nodeId];
    const shop = node && node.data && node.data.shop;
    if (!shop) return { ok: false };
    const key = 'perk' + idx;
    if (shop.bought[key]) return { ok: false, reason: 'Already bought.' };
    const perk = idx === 'bonus' ? shop.bonusPerkOffer : shop.perkOffers[idx];
    if (!perk) return { ok: false };
    const cost = idx === 'bonus'
      ? Math.round((DS.FORTRESS_CONFIG.shopPerkPriceByRarity[perk.rarity] || 999) * DS.FORTRESS_MERCHANT.bonusOffer.priceMult)
      : DS.FORTRESS_CONFIG.shopPerkPriceByRarity[perk.rarity] || 999;
    if (active.cinders < cost) return { ok: false, reason: 'Not enough Cinders.' };
    active.cinders -= cost;
    active.perks.push(Object.assign({}, perk, { instanceId: DS.RNG.uuid() }));
    shop.bought[key] = true;
    DS.Save.persist();
    return { ok: true };
  }

  function buyShopWeapon(nodeId) {
    const active = activeRun();
    const node = active && active.graph.nodes[nodeId];
    const shop = node && node.data && node.data.shop;
    if (!shop || !shop.weaponOfferDefId || shop.bought.weapon) return { ok: false };
    const uid = DS.RNG.uuid();
    active.runWeapons[uid] = { defId: shop.weaponOfferDefId, level: 1, refine: 1 };
    shop.bought.weapon = true;
    DS.Save.persist();
    return { ok: true, uid };
  }

  // A real, persistent relic — unlike the weapon offer above (a temporary
  // active.runWeapons entry), this creates an actual DS.State.inventory.relics
  // record via DS.Inventory.rollRelic, spending real Cinders for it.
  function buyShopRelic(nodeId) {
    const active = activeRun();
    const node = active && active.graph.nodes[nodeId];
    const shop = node && node.data && node.data.shop;
    if (!shop || !shop.relicOffer || shop.bought.relic) return { ok: false };
    const cost = DS.FORTRESS_CONFIG.shopRelicCost;
    if (active.cinders < cost) return { ok: false, reason: 'Not enough Cinders.' };
    const { setId, slot, rarity } = shop.relicOffer;
    const uid = DS.Inventory && DS.Inventory.rollRelic ? DS.Inventory.rollRelic(setId, slot, rarity) : null;
    if (!uid) return { ok: false };
    active.cinders -= cost;
    shop.bought.relic = true;
    queueEquipRelicChoice(uid);
    DS.Save.persist();
    return { ok: true, uid };
  }

  // A full heal, not just a wound cure — clears the wound debuff AND tops
  // every squad member back up to full HP (see hpFractions/getHpFraction).
  // Buyable whenever either is actually needed, not only when wounded.
  function cureWounds(nodeId) {
    const active = activeRun();
    if (!active) return { ok: false };
    const cost = DS.FORTRESS_CONFIG.shopCureWoundsCost;
    const anyWounded = Object.keys(active.wounded).length > 0;
    const anyHurt = active.squad.some((id) => getHpFraction(id) < 1);
    if (!anyWounded && !anyHurt) return { ok: false, reason: 'The company is already at full strength.' };
    if (active.cinders < cost) return { ok: false, reason: 'Not enough Cinders.' };
    active.cinders -= cost;
    active.wounded = {};
    active.squad.forEach((id) => { delete active.hpFractions[id]; });
    active.woundsCuredCount = (active.woundsCuredCount || 0) + 1;
    DS.Save.persist();
    return { ok: true };
  }

  // ---------- forge ----------

  function equipRunWeapon(charId, uid) {
    const active = activeRun();
    if (!active || !active.runWeapons[uid]) return;
    active.equippedRunWeapon[charId] = uid;
    DS.Save.persist();
  }

  function upgradeRunWeapon(uid) {
    const active = activeRun();
    const w = active && active.runWeapons[uid];
    if (!w) return { ok: false };
    const cfg = DS.FORTRESS_CONFIG;
    if (w.level >= cfg.forgeMaxLevel) return { ok: false, reason: 'Already at its peak.' };
    const cost = cfg.forgeBaseCost + w.level * cfg.forgeCostPerLevel;
    if (active.cinders < cost) return { ok: false, reason: 'Not enough Cinders.' };
    active.cinders -= cost;
    w.level += 1;
    DS.Save.persist();
    return { ok: true };
  }

  // ---------- wager ----------

  // stakedInstanceId is optional — staking a held perk raises the payout on a
  // win (perkStakeMultBonus) but the perk is actually removed from
  // active.perks on a loss. Cost is always paid up front regardless of
  // outcome, same as every other Cinders spend in this file.
  function resolveWager(nodeId, tierId, stakedInstanceId) {
    const active = activeRun();
    const node = active && active.graph.nodes[nodeId];
    if (!node) return { ok: false };
    const cfg = DS.FORTRESS_WAGER;
    const tier = cfg.tiers.find((t) => t.id === tierId);
    if (!tier) return { ok: false };
    if (active.cinders < tier.cost) return { ok: false, reason: 'Not enough Cinders.' };
    const staked = stakedInstanceId ? active.perks.find((p) => p.instanceId === stakedInstanceId) : null;
    active.cinders -= tier.cost;
    const roll = DS.RNG.int(1, 20);
    const threshold = Math.round(tier.winChance * 20);
    const win = roll <= threshold;
    let result;
    if (win) {
      const mult = tier.payoutMult * (active.boon && active.boon.wagerPayoutMult ? active.boon.wagerPayoutMult : 1) * (staked ? cfg.perkStakeMultBonus : 1);
      const payout = Math.round(tier.cost * mult);
      active.cinders += payout;
      result = { win: true, roll, threshold, payout, staked: !!staked };
    } else {
      if (staked) active.perks = active.perks.filter((p) => p.instanceId !== stakedInstanceId);
      result = { win: false, roll, threshold, staked: !!staked, perkLost: staked ? staked.name : null };
    }
    node.data.result = result;
    completeNode(nodeId);
    return result;
  }

  // ---------- trap ----------

  function resolveTrap(nodeId) {
    const active = activeRun();
    const node = active && active.graph.nodes[nodeId];
    if (!node || !node.data) return null;
    const cfg = DS.FORTRESS_CONFIG;
    const roll = DS.RNG.int(1, 20);
    let outcome;
    if (roll <= 8) {
      const victim = DS.RNG.pick(active.squad);
      active.wounded[victim] = true;
      active.cinders = Math.max(0, active.cinders - cfg.trapCinderLossHeavy);
      outcome = { tier: 'heavy', victim, cindersDelta: -cfg.trapCinderLossHeavy };
    } else if (roll <= 12) {
      active.cinders = Math.max(0, active.cinders - cfg.trapCinderLossLight);
      outcome = { tier: 'light', cindersDelta: -cfg.trapCinderLossLight };
    } else {
      active.cinders += cfg.trapCinderGainSafe;
      outcome = { tier: 'safe', cindersDelta: cfg.trapCinderGainSafe };
    }
    node.data.result = { roll, outcome };
    completeNode(nodeId);
    return { roll, outcome };
  }

  // ---------- event ----------

  // 'A Sleeping Giant' isn't a normal good/bad roll — Investigate is a coin
  // flip between a real fight and a quiet payout. Doesn't completeNode() on
  // the "awake" branch: that happens via onNodeBattleWon/onNodeBattleLost
  // once the fight actually resolves, same as every other battle node. See
  // js/ui/fortress-ui.js's openEventModal for the battle hand-off.
  function resolveSpecialEvent(nodeId, node, ev, investigate) {
    const active = activeRun();
    if (!investigate) {
      node.data.result = { investigated: false };
      completeNode(nodeId);
      return { investigated: false };
    }
    const awake = DS.RNG.chance(ev.wakeChance);
    if (awake) {
      node.data.result = { investigated: true, awake: true };
      DS.Save.persist();
      return { investigated: true, awake: true, bossId: ev.bossId };
    }
    active.cinders += ev.cindersIfAsleep;
    node.data.result = { investigated: true, awake: false, cindersDelta: ev.cindersIfAsleep };
    completeNode(nodeId);
    return { investigated: true, awake: false, cindersDelta: ev.cindersIfAsleep };
  }

  function resolveEvent(nodeId, investigate) {
    const active = activeRun();
    const node = active && active.graph.nodes[nodeId];
    const ev = node && node.data && node.data.event;
    if (!ev) return null;
    if (ev.special === 'wake_or_cinders') return resolveSpecialEvent(nodeId, node, ev, investigate);
    const result = { investigated: !!investigate, good: null };
    if (investigate) {
      const good = DS.RNG.chance(ev.goodChance);
      result.good = good;
      if (good) {
        if (ev.good.perkMinRarity) {
          const context = ev.good.perkMinRarity >= 3 ? 'elite' : 'normalLate';
          const candidates = pickPerkOptions(context, 5).filter((p) => p.rarity >= ev.good.perkMinRarity);
          const perk = candidates[0] || DS.RNG.pick(DS.FORTRESS_PERKS.filter((p) => p.rarity >= ev.good.perkMinRarity));
          active.perks.push(Object.assign({}, perk, { instanceId: DS.RNG.uuid() }));
          result.perk = perk;
        } else if (ev.good.gear) {
          // A real, persistent weapon-or-relic — straight into the player's
          // actual inventory (see grantRealWeapon/grantRealRelic), not a
          // temporary active.runWeapons entry like everything else here.
          if (DS.RNG.chance(0.5)) {
            const gearSummary = [];
            grantRealWeapon(active, gearSummary);
            if (gearSummary.length) { result.weaponGranted = gearSummary[0]; }
          } else {
            const gearSummary = [];
            grantRealRelic(active, gearSummary, 1, 4);
            if (gearSummary.length) { result.relicGranted = gearSummary[0]; }
          }
        } else if (typeof ev.good.cinders === 'number') {
          active.cinders += ev.good.cinders;
          result.cindersDelta = ev.good.cinders;
        }
      } else if (ev.bad.wound) {
        const victim = DS.RNG.pick(active.squad);
        active.wounded[victim] = true;
        result.victim = victim;
      } else if (typeof ev.bad.cinders === 'number') {
        active.cinders = Math.max(0, active.cinders + ev.bad.cinders);
        result.cindersDelta = ev.bad.cinders;
      }
    }
    node.data.result = result;
    completeNode(nodeId);
    return result;
  }

  // ---------- fresh-start unit build ----------
  // Fortress is meant to start every character from nothing regardless of
  // their real progress in the main save — otherwise a maxed-out Lv.80
  // character would enter a run wildly stronger than one just unlocked,
  // which defeats the whole "everyone's equal, perks are what make you
  // stronger" roguelike point. DS.Progression.buildBattleUnit() always reads
  // the character's REAL roster entry (level/ascension/traces/equipped
  // weapon/relics), so rather than duplicating its stat math, this
  // temporarily swaps in a brand-new Lv.1/Asc.0/no-traces/no-gear entry (the
  // exact same shape DS.Save.newRosterEntry() hands out to a freshly-pulled
  // character), builds through the real function, then restores the actual
  // entry — synchronous, so there's no window where anything else could see
  // the swapped-out state.
  // ---------- HP carry-over between battles ----------

  // Absence means full HP — brand-new recruits and anyone freshly healed at
  // a shop (see cureWounds) simply have no entry here.
  function getHpFraction(charId) {
    const active = activeRun();
    const frac = active && active.hpFractions && active.hpFractions[charId];
    return typeof frac === 'number' ? frac : 1;
  }

  // Called from js/ui/battle-ui.js's onBattleEnd() right after a Fortress
  // win, reading the just-finished live Battle party units directly (each
  // has .defId === the character id, .hp, .stats.hp === max). A squad member
  // who actually died mid-fight but the company still won overall comes
  // back at a modest sliver rather than 0 — 0 would mean instantly re-dying
  // at the very start of the next fight with no recourse, which reads as
  // broken rather than tense.
  function recordHpFractions(partyUnits) {
    const active = activeRun();
    if (!active || !partyUnits) return;
    partyUnits.forEach((u) => {
      if (!u || !u.defId) return;
      const maxHp = u.stats && u.stats.hp;
      const frac = !u.alive ? 0.25 : maxHp ? Math.max(0, Math.min(1, u.hp / maxHp)) : 1;
      active.hpFractions[u.defId] = frac;
    });
    DS.Save.persist();
  }

  function buildFortressUnit(charId) {
    const active = activeRun();
    const realEntry = DS.State.roster[charId];
    if (!realEntry) return null;
    const temp = DS.Save.newRosterEntry();
    // Rest-node progress enriches the otherwise-fresh temp entry: an in-run
    // level (real growth-curve math via DS.Progression, just fed a different
    // level than the character's real one) and references to real owned
    // relics/weapon (still read straight out of DS.State.inventory by
    // computeStats() — see equipRunRelic/equipRunRealWeapon below).
    if (active) {
      temp.level = (active.charLevels && active.charLevels[charId]) || 1;
      if (active.equippedRelics && active.equippedRelics[charId]) {
        temp.relics = Object.assign({ helm: null, armor: null, ring: null, talisman: null }, active.equippedRelics[charId]);
      }
      if (active.equippedRealWeapon && active.equippedRealWeapon[charId]) {
        temp.weaponUid = active.equippedRealWeapon[charId];
      }
    }
    DS.State.roster[charId] = temp;
    let spec;
    try {
      spec = DS.Progression.buildBattleUnit(charId);
    } finally {
      DS.State.roster[charId] = realEntry;
    }
    return spec;
  }

  // ---------- rest node: in-run leveling + real relic/weapon loadout ----------

  function levelUpChar(charId) {
    const active = activeRun();
    if (!active || active.squad.indexOf(charId) < 0) return { ok: false };
    const cfg = DS.FORTRESS_CONFIG;
    const level = active.charLevels[charId] || 1;
    if (level >= cfg.restLevelCap) return { ok: false, reason: 'Already at their peak for this run.' };
    const cost = cfg.restLevelBaseCost + (level - 1) * cfg.restLevelCostPerLevel;
    if (active.cinders < cost) return { ok: false, reason: 'Not enough Cinders.' };
    active.cinders -= cost;
    active.charLevels[charId] = level + 1;
    DS.Save.persist();
    return { ok: true };
  }

  // Both free — nothing is consumed from the real inventory, just referenced
  // by uid for the run (see buildFortressUnit above). uid === null unequips.
  function equipRunRelic(charId, slot, uid) {
    const active = activeRun();
    if (!active || active.squad.indexOf(charId) < 0 || DS.SLOTS.indexOf(slot) < 0) return { ok: false };
    if (uid && !DS.State.inventory.relics[uid]) return { ok: false };
    active.equippedRelics[charId] = active.equippedRelics[charId] || {};
    active.equippedRelics[charId][slot] = uid || null;
    DS.Save.persist();
    return { ok: true };
  }

  function equipRunRealWeapon(charId, uid) {
    const active = activeRun();
    if (!active || active.squad.indexOf(charId) < 0) return { ok: false };
    if (uid && !DS.State.inventory.weapons[uid]) return { ok: false };
    active.equippedRealWeapon[charId] = uid || null;
    DS.Save.persist();
    return { ok: true };
  }

  // One free recruit per rest node — pick one of that node's 3 rolled
  // recruitOptions (see rollNodeData above). Squad cap is still 4; once
  // used, the node won't offer another (matches the boss-recruit's
  // one-pick-of-three feel, just far more often).
  function recruitAtRest(nodeId, charId) {
    const active = activeRun();
    const node = active && active.graph.nodes[nodeId];
    if (!node || node.kind !== 'rest' || !node.data) return { ok: false };
    if (node.data.recruited) return { ok: false, reason: 'You’ve already welcomed someone here.' };
    if (active.squad.length >= 4) return { ok: false, reason: 'The company is full.' };
    if ((node.data.recruitOptions || []).indexOf(charId) < 0) return { ok: false };
    active.squad.push(charId);
    node.data.recruited = true;
    DS.Save.persist();
    return { ok: true };
  }

  // ---------- altar (curse-for-power) ----------

  function chooseAltarBargain(nodeId, idx) {
    const active = activeRun();
    const node = active && active.graph.nodes[nodeId];
    const altar = node && node.data && node.data.altar;
    if (!altar || altar.chosen) return { ok: false };
    const curse = altar.options[idx];
    if (!curse) return { ok: false };
    active.curses.push(Object.assign({}, curse, { instanceId: DS.RNG.uuid() }));
    const perk = DS.FORTRESS_PERKS.find((p) => p.id === curse.pairedPerkId);
    if (perk) active.perks.push(Object.assign({}, perk, { instanceId: DS.RNG.uuid() }));
    altar.chosen = true;
    completeNode(nodeId);
    return { ok: true, curse, perk };
  }

  // ---------- secret vault ----------

  // recruitCharId is only meaningful for a 'cinders_recruit' reward (must be
  // one of node.data.secret.recruitOptions) — ignored otherwise.
  function claimSecretVault(nodeId, recruitCharId) {
    const active = activeRun();
    const node = active && active.graph.nodes[nodeId];
    const secret = node && node.data && node.data.secret;
    if (!secret || secret.claimed || !secret.recipe) return { ok: false };
    const reward = secret.recipe.reward;
    const granted = { perks: [], cinders: 0, recruit: null };
    if (typeof reward.cinders === 'number') {
      active.cinders += reward.cinders;
      granted.cinders = reward.cinders;
    }
    if (reward.kind === 'perks' || reward.kind === 'perks_and_cinders') {
      const pool = DS.FORTRESS_PERKS.filter((p) => (p.rarity || 0) >= reward.minRarity);
      for (let i = 0; i < reward.count && pool.length; i++) {
        const perk = DS.RNG.pick(pool);
        active.perks.push(Object.assign({}, perk, { instanceId: DS.RNG.uuid() }));
        granted.perks.push(perk.name);
      }
    }
    if (reward.kind === 'cinders_recruit' && recruitCharId && active.squad.length < 4
      && (secret.recruitOptions || []).indexOf(recruitCharId) >= 0) {
      active.squad.push(recruitCharId);
      granted.recruit = recruitCharId;
    }
    secret.claimed = true;
    completeNode(nodeId);
    return { ok: true, granted };
  }

  // ---------- battle-unit modifier splice ----------
  // Called from js/ui/battle-ui.js's startBattle(), right after
  // DS.Progression.buildBattleUnit(charId) and before `new DS.Battle(...)`.
  // Battle-time fx keys get pushed straight onto spec.fx — js/engine/battle.js's
  // fxSum()/fxEntries() already read that array generically by key, so this
  // needs zero engine changes. Stat-time keys are summed across every source
  // (perks + the equipped run-weapon's own passive) and applied once directly
  // onto the already-built spec.stats, mirroring computeStats()'s own tail math
  // (js/engine/progression.js) — kept as a small local re-implementation here
  // since progression.js doesn't export those internal accumulator helpers.
  function applyRunModifiers(spec, charId) {
    const active = activeRun();
    if (!active || !spec) return;
    const acc = {
      pct: { atk: 0, hp: 0, def: 0, spd: 0 },
      flat: { critRate: 0, critDmg: 0, breakEffect: 0, healBoost: 0, energyRegen: 0 },
      dmgBoost: {},
    };
    function applyKey(key, params) {
      const num = (params && (params.pct !== undefined ? params.pct : params.amount !== undefined ? params.amount : params.value)) || 0;
      switch (key) {
        case 'atkPct': acc.pct.atk += num; break;
        case 'hpPct': acc.pct.hp += num; break;
        case 'defPct': acc.pct.def += num; break;
        case 'spdPct': acc.pct.spd += num; break;
        case 'critRate': acc.flat.critRate += num; break;
        case 'critDmg': acc.flat.critDmg += num; break;
        case 'breakEffect': acc.flat.breakEffect += num; break;
        case 'healBoost': acc.flat.healBoost += num; break;
        case 'energyRegen': acc.flat.energyRegen += num; break;
        case 'dmgBoostElement': {
          const elKey = params && params.element;
          if (elKey) acc.dmgBoost[elKey] = (acc.dmgBoost[elKey] || 0) + num;
          break;
        }
        default:
          spec.fx = spec.fx || [];
          spec.fx.push({ key, params });
      }
    }
    active.perks.forEach((perk) => { (perk.fx || []).forEach((f) => applyKey(f.key, f.params)); });
    // Curses are run-wide (not per-character) — every squad member takes
    // every curse taken this run, same splice mechanism as perks.
    (active.curses || []).forEach((curse) => { (curse.fx || []).forEach((f) => applyKey(f.key, f.params)); });
    const wUid = active.equippedRunWeapon[charId];
    const w = wUid && active.runWeapons[wUid];
    if (w) {
      const wdef = DS.C.findWeaponDef(w.defId);
      if (wdef) {
        const scale = 1 + 0.08 * (Math.max(1, w.level || 1) - 1);
        spec.stats.hp += Math.round((wdef.baseHp || 0) * scale);
        spec.stats.atk += Math.round((wdef.baseAtk || 0) * scale);
        spec.stats.def += Math.round((wdef.baseDef || 0) * scale);
        ((wdef.passive && wdef.passive.fx) || []).forEach((f) => applyKey(f.key, f.params));
      }
    }
    spec.stats.atk = Math.max(1, Math.round(spec.stats.atk * (1 + acc.pct.atk)));
    spec.stats.hp = Math.max(1, Math.round(spec.stats.hp * (1 + acc.pct.hp)));
    spec.stats.def = Math.max(0, Math.round(spec.stats.def * (1 + acc.pct.def)));
    spec.stats.spd = Math.round(spec.stats.spd * (1 + acc.pct.spd) * 10) / 10;
    spec.stats.critRate = (spec.stats.critRate || 0) + acc.flat.critRate;
    spec.stats.critDmg = (spec.stats.critDmg || 0) + acc.flat.critDmg;
    spec.stats.breakEffect = (spec.stats.breakEffect || 0) + acc.flat.breakEffect;
    spec.stats.healBoost = (spec.stats.healBoost || 0) + acc.flat.healBoost;
    spec.stats.energyRegen = (spec.stats.energyRegen || 0) + acc.flat.energyRegen;
    spec.stats.dmgBoost = spec.stats.dmgBoost || {};
    Object.keys(acc.dmgBoost).forEach((k) => { spec.stats.dmgBoost[k] = (spec.stats.dmgBoost[k] || 0) + acc.dmgBoost[k]; });

    if (active.wounded[charId]) {
      const wd = DS.FORTRESS_CONFIG.woundDebuff;
      spec.stats.atk = Math.max(1, Math.round(spec.stats.atk * wd.atkMult));
      spec.stats.def = Math.max(0, Math.round(spec.stats.def * wd.defMult));
    }
  }

  // "The Last Ember" perk (rarity 5) has no fx-key equivalent ("revive on
  // wipe"), so it's resolved directly in js/ui/battle-ui.js's onBattleEnd()
  // rather than adding a new engine hook for one perk — these two just track
  // whether it's available/spent this run.
  function hasUnusedRevive() {
    const active = activeRun();
    return !!(active && !active.reviveUsed && active.perks.some((p) => p.id === 'p_last_ember'));
  }
  function consumeRevive() {
    const active = activeRun();
    if (active) active.reviveUsed = true;
    DS.Save.persist();
  }

  // ---------- battle outcomes ----------

  // Rolls a real, persistent relic straight into DS.State.inventory.relics
  // (via DS.Inventory.rollRelic — random set/slot) and appends a summary
  // line if one dropped. chance === 1 always drops (used for bosses).
  function grantRealRelic(active, summary, chance, rarity) {
    if (!DS.RNG.chance(chance)) return;
    const uid = DS.Inventory && DS.Inventory.rollRelic ? DS.Inventory.rollRelic(null, null, rarity) : null;
    if (!uid) return;
    const rel = DS.State.inventory.relics[uid];
    const set = (DS.RELIC_SETS || []).find((s) => s.id === rel.setId);
    const url = DS.Assets && set ? DS.Assets.relicPiece(set.id, rel.slot) : null;
    summary.push({ icon: (set && set.art && set.art.icon) || '💍', img: url, text: (set ? set.name : 'A relic') + ' — kept for good' });
    queueEquipRelicChoice(uid);
  }

  // Every relic grant (this function, buyShopRelic) queues a "who wears
  // this" pick — surfaced via the ordinary pendingChoice queue the instant
  // the current node's own interaction concludes (see completeNode).
  function queueEquipRelicChoice(uid) {
    const active = activeRun();
    const rel = active && DS.State.inventory.relics[uid];
    if (!active || !rel) return;
    active.choiceQueue.push({ type: 'equipRelic', uid, setId: rel.setId, slot: rel.slot });
  }

  // charId === null/undefined leaves the relic unequipped for now (still
  // real and kept — just not worn by anyone this instant). Equips it for
  // real (DS.Inventory.equipRelic, survives the run) AND references it in
  // active.equippedRelics so it actually contributes to that character's
  // stats for the REST of this run too, same as a Rest-node borrow.
  function chooseRelicEquip(charId) {
    const active = activeRun();
    if (!active || !active.pendingChoice || active.pendingChoice.type !== 'equipRelic') return { ok: false };
    const { uid, slot } = active.pendingChoice;
    if (charId) {
      if (DS.Inventory && DS.Inventory.equipRelic) DS.Inventory.equipRelic(charId, uid);
      active.equippedRelics[charId] = active.equippedRelics[charId] || {};
      active.equippedRelics[charId][slot] = uid;
    }
    active.pendingChoice = null;
    presentNextChoice();
    DS.Save.persist();
    return { ok: true };
  }

  // Rolls a real, persistent weapon straight into DS.State.inventory.weapons
  // (via DS.Inventory.createWeapon), path-matched to the squad the same way
  // rollShopStock() already picks a shop's weapon offer.
  function grantRealWeapon(active, summary) {
    const paths = active.squad.map((id) => { const c = DS.C.findChar(id); return c && c.path; }).filter(Boolean);
    let pool = (DS.WEAPONS || []).filter((w) => paths.indexOf(w.path) >= 0);
    if (!pool.length) pool = DS.WEAPONS || [];
    const def = pool.length ? DS.RNG.pick(pool) : null;
    if (!def || !DS.Inventory || !DS.Inventory.createWeapon) return;
    DS.Inventory.createWeapon(def.id);
    const url = DS.Assets ? DS.Assets.weapon(def.id) : null;
    summary.push({ icon: (def.art && def.art.icon) || '🗡', img: url, text: def.name + ' — kept for good' });
  }

  function onNodeBattleWon(nodeId, stars) {
    const active = activeRun();
    if (!active) return { summary: [] };
    const node = active.graph.nodes[nodeId];
    if (!node) return { summary: [] };
    completeNode(nodeId);
    active.squad.forEach((id) => { delete active.wounded[id]; });

    if (node.kind === 'boss' && node.isFinal) return finalizeVictory();

    // Waking (and beating) the Sleeping Giant is a genuine boss fight
    // wearing an 'event' node's clothes — reward it like one rather than
    // like a normal encounter.
    const wasSleepingGiant = node.kind === 'event' && node.data && node.data.event
      && node.data.event.special === 'wake_or_cinders' && node.data.result && node.data.result.awake;

    const cfg = DS.FORTRESS_CONFIG;
    const cindersGain = (node.kind === 'elite' || wasSleepingGiant) ? cfg.eliteCindersReward : node.kind === 'boss' ? cfg.bossCindersReward : cfg.normalCindersReward;
    active.cinders += cindersGain;
    const summary = [{ icon: '🔥', text: 'Cinders +' + cindersGain }];

    // Real, persistent gear — unlike perks/run-weapons/Cinders, these are
    // granted straight into the player's actual inventory via
    // DS.Inventory.rollRelic/createWeapon and survive the run regardless of
    // how it ends. Elites (and the Sleeping Giant) have a chance at a relic;
    // non-final bosses guarantee one and have a further chance at a weapon,
    // since they're rarer and harder than an elite fight.
    if (node.kind === 'elite' || wasSleepingGiant) {
      grantRealRelic(active, summary, 0.35, 4);
    } else if (node.kind === 'boss') {
      grantRealRelic(active, summary, 1, 5);
      if (DS.RNG.chance(0.5)) grantRealWeapon(active, summary);
    }

    if (node.kind === 'boss') {
      queuePerkChoice('boss');
      if (active.squad.length < 4) queueRecruitChoice(); else queuePerkChoice('boss');
      queueCompanionChoice('bossClear');
    } else {
      const context = (node.kind === 'elite' || wasSleepingGiant) ? 'elite' : (node.floor <= 10 ? 'normalEarly' : 'normalLate');
      queuePerkChoice(context);
    }
    presentNextChoice();
    DS.Save.persist();
    return { summary };
  }

  function onNodeBattleLost() {
    const active = activeRun();
    const rec = DS.State.fortress.records;
    rec.runsAttempted += 1;
    if (active) rec.bestDepth = Math.max(rec.bestDepth, active.floorIndex);
    DS.State.fortress.active = null;
    DS.Save.persist();
    return { summary: [], defeated: true };
  }

  function abandonRun() { return onNodeBattleLost(); }

  function finalizeVictory() {
    const active = activeRun();
    const cfg = DS.FORTRESS_CONFIG;
    const rec = DS.State.fortress.records;
    const perkCount = active.perks.length;
    const raritySum = active.perks.reduce((s, p) => s + (p.rarity || 0), 0);

    const rewards = {
      souls: cfg.victoryBase.souls + active.cinders * cfg.victoryCindersSoulsMult + perkCount * cfg.victoryPerksSoulsMult + raritySum * cfg.victoryRaritySoulsMult,
      humanity: cfg.victoryBase.humanity + active.perks.filter((p) => p.rarity >= 4).length * 40,
    };
    const goodWeapons = (DS.WEAPONS || []).filter((w) => w.rarity >= 4);
    if (goodWeapons.length) rewards.weapons = [DS.RNG.pick(goodWeapons).id];
    if (DS.RNG.chance(cfg.victoryBonusDupeChance)) {
      const ownedIds = Object.keys(DS.State.roster);
      if (ownedIds.length) rewards.characters = [DS.RNG.pick(ownedIds)];
    }
    const summary = DS.Save.grant(rewards);
    summary.push({ icon: '🕯', text: '"' + DS.FORTRESS_COMPANION.victoryLine + '" — Corvane' });

    const floorsCleared = active.totalFloors;
    const expEach = cfg.victoryCharExpPerFloor * floorsCleared;
    active.squad.forEach((charId) => { if (DS.Progression && DS.Progression.gainCharExp) DS.Progression.gainCharExp(charId, expEach); });

    rec.runsCompleted += 1;
    rec.bestDepth = active.totalFloors;
    DS.State.fortress.active = null;
    DS.Save.persist();
    return { summary, victory: true, floorsCleared };
  }

  DS.Fortress = {
    hasActiveRun, getRecords,
    startRun, chooseStarter, chooseBoon,
    nodeState, currentOptions, ensureNodeData, completeNode, isSecretRevealed, claimSecretVault,
    choosePerkOffer, chooseRecruit,
    buyShopPerk, buyShopWeapon, buyShopRelic, cureWounds,
    equipRunWeapon, upgradeRunWeapon,
    resolveTrap, resolveEvent, resolveWager,
    levelUpChar, equipRunRelic, equipRunRealWeapon, recruitAtRest, chooseAltarBargain,
    dismissCompanion, chooseCompanionRestOption, chooseRelicEquip,
    buildFortressUnit, applyRunModifiers, getHpFraction, recordHpFractions,
    hasUnusedRevive, consumeRevive,
    onNodeBattleWon, onNodeBattleLost, abandonRun,
  };
})();
