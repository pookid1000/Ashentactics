// ASHEN TACTICS — battle screen (CONTRACT.md §6.4/§6.5).
// Plays the engine's event queue as timed animations; handles input, targeting,
// ult interrupts, auto-battle, and reward routing on victory.

window.DS = window.DS || {};

(function () {
  const el = (...a) => DS.C.el(...a);

  const S = {
    battle: null,
    source: null,
    pendingSlot: null,   // 'basic' | 'skill' awaiting a target click
    pendingUltUid: null, // ult awaiting a target click
    playing: false,
    auto: false,
    root: null,
    ended: false,
    logLines: [], // persists across the full stage re-renders that would otherwise wipe the log div
    lastPos: {}, // uid -> last known {x,y}, so a VFX event for an already-removed card doesn't jump to a fixed corner
    // uid -> Date.now() when its 'dying' animation started. render() does a full
    // root.innerHTML wipe+rebuild on practically every event (ability casts, turn
    // starts, etc.) — without this, ANY such render firing during the 2s death
    // animation would rebuild the enemy row from current `alive` state (already
    // false) and instantly cut the dying card, even though its own death event
    // is still awaiting its own timers. render() re-creates a still-dying card
    // with a negative animation-delay matching real elapsed time so it keeps
    // looking continuous no matter how many unrelated renders happen meanwhile.
    dyingEnemies: {},
  };

  function speed() { return (DS.State.settings.battleSpeed || 1); }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms / speed())); }

  // ─────────────────── team select ───────────────────

  function teamSelectModal(onStart) {
    const owned = Object.keys(DS.State.roster)
      .sort((a, b) => (DS.Progression.charPower(b) || 0) - (DS.Progression.charPower(a) || 0));
    let picked = (DS.State.progress.lastTeam || []).filter((id) => owned.includes(id));
    const body = el('div');
    const info = el('div', 'small text-dim', 'Choose up to 4 warriors.');
    body.appendChild(info);
    const grid = el('div', 'row');
    grid.style.marginTop = '0.6em';

    function refresh() {
      grid.innerHTML = '';
      owned.forEach((id) => {
        const card = DS.C.charCard(id, {
          width: '116px', portraitSize: 64, showPower: true,
          selected: picked.includes(id),
          onClick: () => {
            if (picked.includes(id)) picked = picked.filter((x) => x !== id);
            else if (picked.length < 4) picked.push(id);
            refresh();
          },
        });
        grid.appendChild(card);
      });
      info.textContent = 'Chosen: ' + picked.length + ' / 4';
    }
    refresh();
    body.appendChild(grid);

    DS.C.modal({
      title: 'Assemble the Company', body, blocking: true, wide: true, hideClose: true,
      actions: [
        { label: 'Retreat', cls: 'ghost', onClick: () => { DS.UI.navigate('map'); } },
        {
          label: 'To Battle', cls: 'primary',
          onClick: () => {
            if (!picked.length) { DS.C.toast('The company needs at least one warrior.', { icon: '⚠' }); return true; }
            DS.State.progress.lastTeam = picked.slice();
            DS.Save.persist();
            onStart(picked);
          },
        },
      ],
    });
  }

  // Fortress's own pre-battle gate — no picking (the squad is whatever's been
  // recruited so far this run, shown via DS.C.charCard same as
  // teamSelectModal above, just non-selectable with a wound badge instead),
  // just a "Descend" confirm and a "Flee the Fortress" escape hatch. Lives
  // here (not in js/ui/fortress-ui.js) because it has to close over the
  // private startBattle() below.
  function fortressSquadModal(params, onStart) {
    const active = DS.State.fortress.active;
    const body = el('div');
    body.appendChild(el('p', 'small text-dim', 'The company descends as it stands.'));
    const grid = el('div', 'row');
    grid.style.marginTop = '0.6em';
    (active.squad || []).forEach((id) => {
      const card = DS.C.charCard(id, { width: '116px', portraitSize: 64 });
      if (active.wounded[id]) card.appendChild(el('div', 'small text-danger', '🩸 Wounded'));
      const hpFrac = DS.Fortress.getHpFraction(id);
      // Damage no longer resets between fights — surface it here too, not
      // just on the map HUD, since this is the last screen before a fight.
      if (hpFrac < 1) card.appendChild(el('div', 'small text-dim', '♥ ' + Math.round(hpFrac * 100) + '% HP'));
      grid.appendChild(card);
    });
    body.appendChild(grid);

    // Same rarity-colored, hover-for-details perk chips as the Fortress map's
    // own HUD (see perkChip() in js/ui/fortress-ui.js) — duplicated here
    // rather than shared since this modal has to live in battle-ui.js (it
    // closes over the private startBattle() below).
    if (active.perks && active.perks.length) {
      const perksRow = el('div', 'row fortress-perks-row');
      perksRow.style.marginTop = '0.8em';
      perksRow.appendChild(el('span', 'small text-dim fortress-perks-label', 'Perks:'));
      active.perks.forEach((p) => {
        const chip = el('div', 'fortress-perk-chip r' + p.rarity + ' card-tooltip', [
          el('span', 'fortress-perk-chip-icon', p.icon || '✦'),
          el('span', 'fortress-perk-chip-name', p.name),
        ]);
        chip.setAttribute('data-tooltip', p.name + ' (' + p.rarity + '★) — ' + p.desc);
        perksRow.appendChild(chip);
      });
      body.appendChild(perksRow);
    }

    DS.C.modal({
      title: 'Assemble the Company', body, blocking: true, wide: true, hideClose: true,
      actions: [
        {
          label: 'Flee the Fortress', cls: 'ghost',
          onClick: () => {
            DS.C.confirm('Abandon this Fortress run? Your squad, perks, and everything found this run will be lost.', { title: 'Abandon Run?', okLabel: 'Abandon', danger: true })
              .then((ok) => { if (ok) { DS.Fortress.abandonRun(); DS.UI.navigate('fortressMap'); } });
            return true; // keep the squad modal open until the confirm resolves
          },
        },
        { label: 'Descend', cls: 'primary', onClick: () => { onStart(active.squad.slice()); } },
      ],
    });
  }

  // ─────────────────── battle lifecycle ───────────────────

  function startBattle(params) {
    const isFortress = !!(params.source && params.source.kind === 'fortress' && DS.Fortress);
    const specs = params.team.map((id) => {
      // Fortress always builds from a fresh Lv.1/no-gear state (see
      // DS.Fortress.buildFortressUnit) — real roster progress never carries
      // into a run, only perks/run-weapons earned this run do. Everywhere
      // else, build from the character's real, permanent progress as usual.
      const spec = isFortress ? DS.Fortress.buildFortressUnit(id) : DS.Progression.buildBattleUnit(id);
      // Fortress perks/run-weapons are spliced onto an already-built unit spec
      // from outside progression.js/battle.js entirely — see
      // DS.Fortress.applyRunModifiers (js/engine/fortress.js) for why that's
      // safe (battle.js already reads a unit's .fx array generically by key).
      if (spec && isFortress) DS.Fortress.applyRunModifiers(spec, id);
      return spec;
    }).filter(Boolean);
    S.battle = new DS.Battle({ party: specs, spawns: params.spawns, background: params.background });
    // HP no longer fully resets between Fortress fights — direct live-field
    // write on the just-built party units, same pattern already used for The
    // Last Ember's revive below (battle.js always starts a unit at full HP;
    // this overrides that right after construction, before the first turn).
    if (isFortress) {
      S.battle.party.forEach((u) => {
        const frac = DS.Fortress.getHpFraction(u.defId);
        if (frac < 1) u.hp = Math.max(1, Math.round(u.stats.hp * frac));
      });
    }
    S.source = params.source || { kind: 'free' };
    DS.Music.play(DS.Music.stageKey(S.source.stageId));
    S.pendingSlot = null;
    S.pendingUltUid = null;
    S.auto = false;
    S.ended = false;
    S.logLines = [];
    S.lastPos = {};
    S.dyingEnemies = {};
    S.battle.advance();
    render();
    playQueue();
  }

  // ─────────────────── event playback ───────────────────

  function unitCardEl(uid) { return S.root ? S.root.querySelector('[data-uid="' + uid + '"]') : null; }

  function posOf(uid) {
    const card = unitCardEl(uid);
    if (!card || !S.root) {
      // A unit's card is removed from the DOM once its 'death' event's own
      // render() has fired (see the 'death' case below) — but a later VFX event
      // can still target that same uid afterward (e.g. a splash hit resolving
      // against a target that already died earlier in the same swing). Reuse
      // that unit's last real on-screen position instead of snapping to a fixed
      // top-left corner, so effects stay put where the card actually died.
      return S.lastPos[uid] || { x: 200, y: 200 };
    }
    const stage = S.root.querySelector('.battle-stage');
    const r = card.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    // #stage (the whole game frame) is CSS-scaled to fit the real window at
    // whatever size/aspect ratio it is (see js/core/resolution.js) — that scale is
    // rarely exactly 1. getBoundingClientRect() reports POST-scale (real screen)
    // pixels, but the VFX canvas sizes itself from clientWidth/clientHeight (PRE-
    // scale layout pixels — clientWidth ignores transforms entirely), and
    // floatText's DOM nodes resolve their left/top the same pre-scale way since
    // they're just absolutely-positioned inside this same scaled subtree. Divide
    // the raw pixel offset by the current scale so effects land on the card
    // regardless of window size/aspect ratio or which resolution preset is active.
    const scale = sr.width / stage.clientWidth || 1;
    const pos = {
      x: (r.left - sr.left + r.width / 2) / scale,
      y: (r.top - sr.top + r.height / 2) / scale,
    };
    S.lastPos[uid] = pos;
    return pos;
  }

  async function playQueue() {
    if (S.playing) return;
    S.playing = true;
    // Re-render immediately so the action buttons (gated on !S.playing — see
    // renderControls) actually disappear the instant playback starts, instead
    // of the previous render's buttons sitting there looking clickable for the
    // whole queue (they'd silently no-op in tryAct/tryUlt if clicked meanwhile).
    render();
    while (true) {
      const evts = S.battle.drainEvents();
      if (!evts.length) break;
      for (const e of evts) await playEvent(e);
      refreshBars();
    }
    S.playing = false;
    refreshBars();
    render();
    if (S.battle.over && !S.ended) { S.ended = true; onBattleEnd(); return; }
    if (!S.battle.over && S.auto && S.battle.awaitingInput) {
      await wait(350);
      autoAct();
    }
  }

  async function playEvent(e) {
    const B = S.battle;
    switch (e.t) {
      case 'turnStart': {
        highlight(e.uid);
        const turnUnit = B.unitByUid(e.uid);
        pushLog(turnUnit && turnUnit.isEnemy ? '▶ The enemy moves — ' + e.name : '▶ ' + e.name + '\'s move');
        await wait(160);
        break;
      }
      case 'ability': {
        const u = B.unitByUid(e.uid);
        banner((u ? u.name : '') + ' — ' + e.name, u && u.isEnemy ? 'enemy' : 'ally');
        pushLog((u ? u.name : 'Something') + ' uses ' + e.name + '.');
        const p = posOf(e.uid);
        const anim = e.anim || { type: 'slash', color: '#dcd3bd' };
        if (anim.type === 'buff' || anim.type === 'ritual') DS.VFX.burst(p.x, p.y, { color: anim.color, count: 20, type: 'soul' });
        DS.SFX.playAttack(u, e.name);
        await wait(280);
        break;
      }
      case 'hit': {
        // posOf() is the card's true center — every effect/number below originates
        // exactly there and works outward, no ad-hoc offsets.
        const p = posOf(e.uid);
        if (e.miss) {
          DS.VFX.floatText(p.x, p.y - 6, 'MISS', { cls: 'miss' });
        } else {
          const srcU = B.unitByUid(e.src);
          const anim = srcU && !srcU.isEnemy ? null : null;
          DS.VFX.slash(p.x, p.y, e.crit ? '#ff2b2b' : '#dcd3bd', e.crit ? { scale: 3, sizeMult: 2.5 } : { scale: 3 });
          DS.VFX.burst(p.x, p.y, { color: e.crit ? '#ff2b2b' : (DS.ELEMENT_META[e.element] || {}).color || '#dcd3bd', count: e.crit ? 26 : 12, type: 'shard' });
          DS.VFX.floatText(p.x + (Math.random() * 30 - 15), p.y - 4, String(e.amount), { cls: (e.crit ? 'crit' : '') + (e.isTrue ? ' true-dmg' : '') });
          if (e.weak) DS.VFX.floatText(p.x, p.y + 14, 'WEAK', { cls: 'weak-tag' });
          DS.SFX.play(e.crit ? 'crit' : (e.absorbed > 0 ? 'hitShield' : 'hit'));
          if (e.crit) { DS.VFX.screenShake(5); DS.VFX.bloodSplat(p.x, p.y); }
          hurtFlash(e.uid);
        }
        refreshBars();
        await wait(e.miss ? 200 : 260);
        break;
      }
      case 'dot': {
        const p = posOf(e.uid);
        DS.VFX.floatText(p.x, p.y - 16, e.name + ' ' + e.amount, { cls: 'dot-dmg' });
        refreshBars();
        await wait(220);
        break;
      }
      case 'heal': {
        const p = posOf(e.uid);
        DS.VFX.healPulse(p.x, p.y);
        DS.VFX.floatText(p.x, p.y - 4, '+' + e.amount, { cls: 'heal' });
        DS.SFX.play('heal');
        refreshBars();
        await wait(240);
        break;
      }
      case 'shield': {
        // No standalone pop VFX any more — the gained shield shows as the blue
        // overlay bar on the HP bar itself (see refreshBars), which reads better
        // as a persistent, depleting resource than a one-off animation.
        const p = posOf(e.uid);
        DS.VFX.floatText(p.x, p.y - 4, '🛡 ' + e.amount, { cls: 'shield-txt' });
        DS.SFX.play('shield');
        refreshBars();
        await wait(200);
        break;
      }
      case 'status': {
        const p = posOf(e.uid);
        DS.VFX.floatText(p.x, p.y - 34, e.name, { cls: e.kind === 'buff' ? 'buff-tag' : 'debuff-tag' });
        if (e.kind === 'debuff' && e.id) DS.VFX.debuffEffect(e.id, p.x, p.y, e.potency);
        if (e.kind === 'debuff') {
          const su = B.unitByUid(e.uid);
          pushLog((su ? su.name : 'A foe') + ' is afflicted by ' + e.name + '.');
        }
        DS.SFX.play(e.kind === 'buff' ? 'buff' : 'debuff');
        await wait(160);
        break;
      }
      case 'parry': {
        const p = posOf(e.uid);
        DS.VFX.floatText(p.x, p.y - 40, 'PARRY!', { cls: 'break-tag' });
        DS.SFX.play('parry');
        await wait(260);
        break;
      }
      case 'break': {
        const p = posOf(e.uid);
        DS.VFX.nova(p.x, p.y, '#f0d98a');
        DS.VFX.screenShake(9);
        DS.VFX.floatText(p.x, p.y - 40, 'BREAK!', { cls: 'break-tag' });
        DS.VFX.floatText(p.x, p.y - 14, String(e.amount), { cls: 'crit' });
        DS.SFX.play('break');
        refreshBars();
        await wait(420);
        break;
      }
      case 'cutin': {
        const u = B.unitByUid(e.uid);
        await new Promise((resolve) => DS.VFX.cutIn(u || { art: e.art, rarity: 4 }, { name: e.name, cutin: e.cutin, enemy: e.enemy, anim: e.anim }, resolve));
        break;
      }
      case 'phase': {
        const u = B.unitByUid(e.uid);
        phaseBanner(u ? u.name : '', e.name, e.banner);
        DS.VFX.screenShake(10);
        DS.SFX.play('roar');
        render();
        await wait(1400);
        break;
      }
      case 'death': {
        // render() self-starts S.dyingEnemies[uid]'s clock the first time it
        // notices a unit went alive→dead (see render() above) — the engine
        // flips `alive` false synchronously, long before this 'death' event
        // even reaches the front of the queue, and render() gets called
        // constantly for unrelated reasons in between (ability casts, turn
        // starts, practically anything), so that clock has usually already
        // started by the time we get here. Calling render() right now
        // guarantees the dying animation is showing immediately regardless —
        // no more depending on some future incidental render to notice.
        render();
        const card = unitCardEl(e.uid);
        DS.SFX.play('death');
        if (card) {
          // .bunit.dying plays a 2s grey-fade → shake/break → collapse
          // sequence (see @keyframes dieFade). Let the grey-fade beat finish
          // first, then burst the embers/ash right as the card starts to
          // shake apart — the burst sells the "breaking" moment instead of
          // firing instantly at the kill.
          await wait(700);
          const p = posOf(e.uid);
          DS.VFX.burst(p.x, p.y, { color: '#e2662c', count: 30, type: 'ember' });
          DS.VFX.burst(p.x, p.y, { color: '#8a8070', count: 16, type: 'shard' });
          await wait(1300);
        } else {
          await wait(2000);
        }
        // A multi-target/multi-hit attack kills several units in one engine
        // pass (it all runs synchronously — every target's `alive` flips
        // before the UI has animated even the first hit), but the UI still
        // plays each hit/death back one at a time. render() is safe to call
        // here even while OTHER enemies are still mid-death: it re-checks
        // S.dyingEnemies per-uid and keeps drawing anyone whose own 2s hasn't
        // really elapsed yet (mid-animation, via negative animation-delay),
        // so one enemy finishing never cuts off another still-pending corpse.
        // Allies stay on screen greyed out (.bunit.dead) rather than removed
        // — renderAlly() bakes that straight into a fresh element, replacing
        // the old node whose 'dying' animation would otherwise leave it stuck
        // fully transparent (animations win over a plain opacity rule).
        render();
        break;
      }
      case 'summon': { render(); await wait(220); break; }
      case 'sp': case 'energy': { refreshBars(); break; }
      case 'log': { pushLog(e.text); break; }
      case 'victory': case 'defeat': break;
      default: break;
    }
  }

  // ─────────────────── end of battle ───────────────────

  // Full-screen fog wipe between Crown of Cinders waves — covers the screen,
  // plays the transition cue, swaps in the next battle while fully obscured
  // (via onCovered, called at peak opacity), then clears. Appended to <body>
  // rather than the battle stage so it survives startBattle()'s own render()
  // tearing everything under it down and rebuilding for the new wave.
  function playFogTransition(onCovered) {
    const reduce = DS.State.settings.reduceMotion;
    const overlay = el('div', 'fog-transition-overlay');
    overlay.appendChild(el('div', 'fog-layer a'));
    overlay.appendChild(el('div', 'fog-layer b'));
    overlay.appendChild(el('div', 'fog-layer c'));
    document.body.appendChild(overlay);
    DS.SFX.play('fogTransition');
    const inDur = reduce ? 80 : 650;
    const hold = reduce ? 60 : 350;
    const outDur = reduce ? 80 : 750;
    requestAnimationFrame(() => overlay.classList.add('covering'));
    setTimeout(() => {
      onCovered();
      setTimeout(() => {
        overlay.classList.add('clearing');
        setTimeout(() => overlay.remove(), outDur);
      }, hold);
    }, inDur);
  }

  function onBattleEnd() {
    const B = S.battle;
    // "The Last Ember" (a Fortress-only perk) intercepts what would otherwise
    // be a defeat, once per run — resolved here directly rather than as a new
    // engine hook (see DS.Fortress.hasUnusedRevive/consumeRevive in
    // js/engine/fortress.js), since it just needs to flip a couple of live
    // fields on the already-finished Battle instance and resume play, the same
    // kind of direct field write refreshBars() already does elsewhere.
    if (B.result === 'defeat' && S.source && S.source.kind === 'fortress' && DS.Fortress && DS.Fortress.hasUnusedRevive()) {
      const fallen = B.party.find((u) => !u.alive);
      if (fallen) {
        fallen.alive = true;
        fallen.hp = Math.max(1, Math.round(fallen.stats.hp * 0.15));
        B.over = false;
        B.result = null;
        DS.Fortress.consumeRevive();
        DS.C.toast('The dying ember catches once more...', { icon: '🔥' });
        B.advance();
        render();
        playQueue();
        return;
      }
    }

    const win = B.result === 'victory';
    const src = S.source || {};
    let summary = [];
    let stars = B.deaths === 0 ? 3 : B.deaths === 1 ? 2 : 1;

    if (win) {
      // Victory means every enemy in this fight is dead (that's the engine's own
      // win condition) — record each one as defeated for the bestiary challenges,
      // regardless of how the battle was sourced (free fight, stage, domain, etc).
      B.enemies.forEach((u) => { if (u.defId) DS.State.progress.defeated[u.defId] = true; });
      DS.Save.persist();

      if (src.kind === 'stage' || src.kind === 'domain') {
        const res = DS.Meta.completeStage(src.stageId, { stars });
        summary = res.summary;
      } else if (src.kind === 'quest') {
        DS.QuestLog.completeBattleStep(src.questId);
        summary = [{ icon: '📜', text: 'Quest advanced' }];
      } else if (src.kind === 'bossRush') {
        const res = DS.Meta.completeBossRush(src.wave, src.gauntletId);
        summary = res.summary.length ? res.summary : [{ icon: '👑', text: 'Wave ' + src.wave + ' bested' }];
      } else if (src.kind === 'fortress') {
        // Snapshot ending HP before processing rewards — a no-op if this was
        // the final boss (onNodeBattleWon already cleared the run by then,
        // and there's no "next fight" to carry HP into anyway).
        DS.Fortress.recordHpFractions(B.party);
        const res = DS.Fortress.onNodeBattleWon(src.nodeId, stars);
        summary = res.summary || [];
      }
      DS.SFX.play('legendary');
    } else {
      DS.SFX.play('death');
      // A Fortress wipe ends the whole run right here — everything about it
      // (squad, perks, Cinders, run-weapons) is discarded inside this call, so
      // by the time the player clicks back to 'fortressMap' it already shows
      // the no-active-run state. See js/engine/fortress.js's onNodeBattleLost.
      if (src.kind === 'fortress' && DS.Fortress) DS.Fortress.onNodeBattleLost(src.nodeId);
    }

    const overlay = el('div', 'battle-end-overlay ' + (win ? 'win' : 'lose'));
    overlay.appendChild(el('h1', 'display', win ? 'VICTORY' : 'YOU DIED'));
    if (win) {
      const starBox = el('div', 'end-stars', '★'.repeat(stars) + '☆'.repeat(3 - stars));
      overlay.appendChild(starBox);
      if (summary && summary.length) {
        const grid = el('div', 'rewards-grid');
        summary.forEach((s, i) => {
          const chip = el('div', 'reward-chip', [DS.C.rewardIcon(s), el('span', null, s.text)]);
          chip.style.animationDelay = (0.3 + i * 0.08) + 's';
          grid.appendChild(chip);
        });
        overlay.appendChild(grid);
      }
    } else {
      overlay.appendChild(el('div', 'text-dim italic', src.kind === 'fortress'
        ? 'The Fortress claims another. Everything found this run is lost.'
        : 'The bonfire remembers you. Rise, and try again.'));
    }
    const btns = el('div', 'row');
    btns.style.justifyContent = 'center';
    const rushBR = S.source && S.source.kind === 'bossRush' && DS.BOSS_RUSHES && DS.BOSS_RUSHES[S.source.gauntletId];
    const next = rushBR && win && S.source.wave < (rushBR.sequence || []).length;
    if (next) {
      const cont = el('button', 'primary big', 'Next Wave ▶');
      cont.onclick = () => {
        const wave = S.source.wave + 1;
        const seq = rushBR.sequence[wave - 1];
        playFogTransition(() => {
          startBattle({
            team: DS.State.progress.lastTeam, spawns: seq.spawns, background: rushBR.background,
            source: { kind: 'bossRush', gauntletId: S.source.gauntletId, wave },
          });
        });
      };
      btns.appendChild(cont);
    }
    const back = el('button', next ? '' : 'primary big', win ? 'Return' : 'Withdraw');
    back.onclick = () => {
      DS.VFX.detach();
      const ret = DS.UI.battleReturn();
      DS.UI.navigate(ret.screen, ret.params);
    };
    btns.appendChild(back);
    if (!win && src.kind !== 'fortress') {
      const retry = el('button', 'big', 'Try Again');
      retry.onclick = () => {
        if (S.source && S.source.estusCost) {
          const spend = DS.Progression.spendEstus(S.source.estusCost);
          if (!spend.ok) { DS.C.toast(spend.reason, { icon: '🧪', img: DS.Assets && DS.Assets.currency('estus') }); return; }
        }
        startBattle({ team: DS.State.progress.lastTeam, spawns: S.source.spawns || [], background: S.battle.background, source: S.source });
      };
      btns.appendChild(retry);
    }
    overlay.appendChild(btns);
    const stage = S.root.querySelector('.battle-stage');
    (stage || S.root).appendChild(overlay);
  }

  // ─────────────────── DOM helpers ───────────────────

  function banner(text, side) {
    const stage = S.root && S.root.querySelector('.battle-stage');
    if (!stage) return;
    const b = el('div', 'action-banner ' + (side || ''), text);
    stage.appendChild(b);
    setTimeout(() => b.remove(), 1100 / speed());
  }

  function phaseBanner(name, phase, line) {
    const stage = S.root && S.root.querySelector('.battle-stage');
    if (!stage) return;
    const b = el('div', 'phase-banner', [
      el('div', 'phase-name', name + ' — ' + phase),
      line ? el('div', 'phase-line', line) : null,
    ]);
    stage.appendChild(b);
    setTimeout(() => b.remove(), 2400 / speed());
  }

  function highlight(uid) {
    if (!S.root) return;
    S.root.querySelectorAll('.bunit').forEach((c) => c.classList.remove('acting'));
    const card = unitCardEl(uid);
    if (card) card.classList.add('acting');
  }

  function hurtFlash(uid) {
    const card = unitCardEl(uid);
    if (!card) return;
    card.classList.remove('hurt');
    void card.offsetWidth;
    card.classList.add('hurt');
  }

  function pushLog(text) {
    S.logLines.push(text);
    while (S.logLines.length > 80) S.logLines.shift();
    const logBox = S.root && S.root.querySelector('.battle-log');
    if (!logBox) return;
    logBox.appendChild(el('div', null, text));
    while (logBox.children.length > 80) logBox.removeChild(logBox.firstChild);
    logBox.scrollTop = 99999;
  }

  function refreshBars() {
    if (!S.root || !S.battle) return;
    S.battle.units().forEach((u) => {
      const card = unitCardEl(u.uid);
      if (!card) return;
      const hpFill = card.querySelector('.fill.hp');
      if (hpFill) hpFill.style.width = Math.max(0, (u.hp / u.stats.hp) * 100) + '%';
      const hpLabel = card.querySelector('.hp-label');
      if (hpLabel) hpLabel.textContent = Math.max(0, Math.round(u.hp)) + '/' + u.stats.hp;
      // Shield shows as a blue outlined overlay on the HP bar itself (width tracks
      // shieldHp/maxHp), not a number in the corner — see .hp-ds .fill.shield-overlay.
      const shieldFill = card.querySelector('.fill.shield-overlay');
      if (shieldFill) {
        shieldFill.style.width = Math.min(100, Math.max(0, (u.shieldHp / u.stats.hp) * 100)) + '%';
        shieldFill.style.display = u.shieldHp > 0 ? '' : 'none';
      }
      const tFill = card.querySelector('.fill.toughness');
      if (tFill) tFill.style.width = Math.max(0, (u.toughness / Math.max(1, u.maxToughness)) * 100) + '%';
      const brk = card.querySelector('.broken-tag');
      if (brk) brk.style.display = u.broken ? 'block' : 'none';
      const ultFill = card.querySelector('.ult-fill');
      if (ultFill) {
        const pct = Math.max(0, Math.min(1, u.energy / u.maxEnergy));
        ultFill.style.clipPath = `inset(${(1 - pct) * 100}% 0 0 0)`;
      }
      const ultBtn = card.querySelector('.ult-btn');
      if (ultBtn) ultBtn.classList.toggle('ready', u.alive && u.energy >= u.maxEnergy && !S.battle.over);
      // Allies stay on screen greyed out when they fall (see .bunit.dead). Enemies
      // don't — they get their own 'dying' collapse/ember animation (see the
      // 'death' case) and then disappear entirely. refreshBars() runs at the end
      // of the very 'hit' event that kills them (unit.alive already flips false
      // synchronously inside the engine before ANY of that hit's UI animation has
      // even started), so unconditionally adding 'dead' here used to instantly
      // grey/fade the card out well before the death event's own animation got a
      // chance to play — the intended crumble read as an instant vanish.
      if (!u.alive && !u.isEnemy) card.classList.add('dead');
      const statusRow = card.querySelector('.bstatus');
      if (statusRow) {
        statusRow.innerHTML = '';
        // Buffs/debuffs and dots show a compact icon badge (▲/▼/◆), not spelled-out
        // names — the full name + duration is available on hover via the title.
        (u.buffs || []).slice(0, 4).forEach((b) => {
          const isBuff = b.mult >= 0;
          const chip = el('span', 'status-chip ' + (isBuff ? 'buff' : 'debuff'), isBuff ? '▲' : '▼');
          chip.title = b.name + (b.duration != null ? ' — ' + b.duration + ' turn' + (b.duration === 1 ? '' : 's') + ' left' : '');
          statusRow.appendChild(chip);
        });
        (u.statuses || []).slice(0, 3).forEach((s) => {
          const meta = DS.STATUS[s.id] || {};
          const artUrl = DS.Assets ? DS.Assets.status(s.id) : null;
          const isBuff = meta.kind === 'buff';
          let content;
          if (artUrl) {
            const img = document.createElement('img');
            img.className = 'status-chip-art';
            img.src = artUrl;
            img.alt = '';
            content = img;
          } else {
            content = isBuff ? '▲' : '▼';
          }
          const chip = el('span', 'status-chip ' + (isBuff ? 'buff' : 'debuff') + (artUrl ? ' has-art' : ''), content);
          chip.title = (meta.name || s.id) + (s.duration != null ? ' — ' + s.duration + ' turn' + (s.duration === 1 ? '' : 's') + ' left' : '');
          statusRow.appendChild(chip);
        });
        (u.dots || []).slice(0, 3).forEach((d) => {
          const chip = el('span', 'status-chip dot', '◆' + (d.stacks > 1 ? '×' + d.stacks : ''));
          chip.title = d.name + (d.stacks > 1 ? ' ×' + d.stacks : '') + (d.duration != null ? ' — ' + d.duration + ' turn' + (d.duration === 1 ? '' : 's') + ' left' : '');
          statusRow.appendChild(chip);
        });
      }
    });
    // SP pips
    const spRow = S.root.querySelector('.sp-pips');
    if (spRow) {
      spRow.innerHTML = '';
      for (let i = 0; i < S.battle.maxSp; i++) spRow.appendChild(el('div', 'sp-pip' + (i < S.battle.teamSp ? ' filled' : '')));
    }
    // Turn-order list — vertical, top-to-bottom in acting order (see .timeline-strip
    // in battle.css), rather than a horizontal row of round chips.
    const tl = S.root.querySelector('.timeline-strip');
    if (tl) {
      tl.innerHTML = '';
      S.battle.previewTimeline(9).forEach((o, i) => {
        const chip = el('div', 'tl-chip' + (o.isEnemy ? ' enemy' : '') + (i === 0 ? ' now' : ''));
        chip.appendChild(DS.C.portrait({ art: o.art, defId: o.defId }, { size: i === 0 ? 34 : 26, element: o.element }));
        chip.appendChild(el('div', 'tl-name', o.name));
        tl.appendChild(chip);
      });
    }
  }

  // ─────────────────── actions ───────────────────

  function tryAct(slot, targetUid) {
    if (!S.battle.awaitingInput || S.playing) return;
    if (S.battle.playerAct(slot, targetUid)) {
      S.pendingSlot = null;
      S.battle.advance();
      render();
      playQueue();
    }
  }

  function tryUlt(uid, targetUid) {
    if (S.playing) return;
    if (S.battle.castUlt(uid, targetUid)) {
      S.pendingUltUid = null;
      if (!S.battle.awaitingInput && !S.battle.over) S.battle.advance();
      render();
      playQueue();
    }
  }

  function autoAct() {
    if (!S.battle.awaitingInput || S.battle.over) return;
    // Auto: fire any ready ults first.
    const ready = S.battle.party.find((u) => u.alive && u.energy >= u.maxEnergy);
    if (ready) { tryUlt(ready.uid, null); return; }
    DS.AI.takeTurn(S.battle, S.battle.currentActor);
    S.battle.advance();
    render();
    playQueue();
  }

  function needsTarget(ability) {
    return ability && (ability.target === 'singleEnemy' || ability.target === 'singleAlly');
  }

  // ─────────────────── render ───────────────────

  function render() {
    if (DS.UI.current !== 'battle' || !S.root) return;
    const B = S.battle;
    if (!B) return;
    const root = S.root;

    // render() rebuilds the whole stage from scratch on nearly every action —
    // ability clicks, turn starts, auto-play, all of it — which used to also
    // blow away any damage number / status text still mid-animation (each is a
    // plain DOM node with its own ~2.9s CSS fade, see floatText() in vfx.js),
    // cutting them off instead of letting them finish. Player turns go through
    // several of these renders in quick succession (pending-target selection,
    // then the actual action) where an enemy's fully-automated turn only hits
    // one, which is why the numbers looked like they "worked for enemies but
    // not allies." Carrying the still-live nodes over into the new stage (a
    // reparent, which does not restart an in-progress CSS animation) fixes it
    // for both.
    const oldStage = root.querySelector('.battle-stage');
    const carryOverText = oldStage ? Array.from(oldStage.children).filter((n) => n.classList.contains('float-text')) : [];

    root.innerHTML = '';

    const stage = el('div', 'battle-stage bg-' + B.background);

    // Battle has no shared topbar (see app.js's NO_TOPBAR) — same Elemental
    // Affinities + Settings buttons as every other screen's topbar, just in
    // their own small corner cluster here.
    if (DS.UI.buildQuickActionButtons) {
      const topActions = el('div', 'battle-top-actions');
      DS.UI.buildQuickActionButtons().forEach((b) => topActions.appendChild(b));
      stage.appendChild(topActions);
    }

    // Left-hand sidebar (first child, in the stage's row layout): the turn-order
    // queue stacked over the log, both long-ways down the side (see
    // .battle-sidebar in battle.css). Log is rebuilt from the persisted line
    // history so a full stage re-render (which happens constantly, e.g. every
    // ability click) doesn't wipe it out.
    const sidebar = el('div', 'battle-sidebar');
    const tlWrap = el('div', 'timeline-wrap', [el('div', 'tl-label', 'ACTION ORDER'), el('div', 'timeline-strip')]);
    sidebar.appendChild(tlWrap);
    const log = el('div', 'battle-log');
    S.logLines.forEach((text) => log.appendChild(el('div', null, text)));
    log.scrollTop = 99999;
    sidebar.appendChild(log);
    stage.appendChild(sidebar);

    // Everything else lives in the right-hand column, controls pinned to its
    // bottom (see .battle-main / .control-bar's margin-top:auto in battle.css).
    const main = el('div', 'battle-main');

    // Enemies row. Every original enemy keeps its own fixed column (see
    // .enemy-row's grid + --enemy-count in battle.css) so a fallen enemy's slot
    // stays put as empty space rather than the survivors re-centering into it.
    // The engine flips `alive` to false synchronously, well before the 'death'
    // event even reaches the front of the queue — and render() itself gets
    // called constantly for unrelated reasons (ability casts, turn starts,
    // practically anything), often BEFORE that unit's own 'death' event has
    // run at all. So render() can't wait to be told a death animation should
    // start; it has to notice for itself. The FIRST time it sees a given enemy
    // alive→dead, it self-starts that uid's clock in S.dyingEnemies right then
    // — whatever triggered this particular render — and every render after
    // that (from any cause) keeps re-drawing it mid-animation via a negative
    // animation-delay matching real elapsed time, so it reads as one
    // continuous 2s death no matter how many renders land in between, then
    // finally clears to an empty slot once that real time has actually passed.
    const foeRow = el('div', 'enemy-row');
    foeRow.style.setProperty('--enemy-count', B.enemies.length);
    B.enemies.forEach((u) => {
      if (u.alive) { foeRow.appendChild(renderEnemy(u)); return; }
      if (S.dyingEnemies[u.uid] === undefined) S.dyingEnemies[u.uid] = Date.now();
      const elapsed = Date.now() - S.dyingEnemies[u.uid];
      if (elapsed < 2000) {
        const card = renderEnemy(u);
        card.classList.add('dying');
        card.style.animationDelay = '-' + Math.min(elapsed, 1999) + 'ms';
        foeRow.appendChild(card);
      } else {
        // Leave S.dyingEnemies[u.uid] set (never delete it) — render() re-runs on
        // practically every later event in the fight, and if this were deleted the
        // very next such render would see `undefined` again and re-arm the clock,
        // replaying the whole 2s death animation from scratch (the corpse would
        // keep reappearing and dying over and over for the rest of the battle).
        // Keeping the old timestamp around keeps `elapsed` permanently past 2000,
        // so this branch — and only this branch — is ever taken again for this uid.
        foeRow.appendChild(el('div', 'enemy-slot-empty'));
      }
    });
    main.appendChild(foeRow);

    // Party row.
    const partyRow = el('div', 'party-row');
    B.party.forEach((u) => partyRow.appendChild(renderAlly(u)));
    main.appendChild(partyRow);

    // Control bar.
    main.appendChild(renderControls());

    stage.appendChild(main);
    root.appendChild(stage);
    DS.VFX.attach(stage);
    carryOverText.forEach((n) => stage.appendChild(n));
    DS.VFX.ambient(B.background);
    refreshBars();
    if (B.currentActor) highlight(B.currentActor.uid);

    // Warm S.lastPos for every unit right after their cards actually land in the
    // live DOM. Without this, a unit whose card is later missing when an event
    // fires (e.g. a later hit in a multi-hit ability resolving against a target
    // that already died and was removed earlier in that same swing) had NO cached
    // position to fall back to the very first time posOf() ever ran for it, so it
    // snapped to the hardcoded top-left default instead of staying at the card.
    B.enemies.concat(B.party).forEach((u) => { if (u.alive) posOf(u.uid); });
  }

  // Compiles a readable "moves and mechanics" summary for an enemy/boss hover
  // tooltip: every ability in its CURRENT moveset (phase-aware — a boss mid-fight
  // shows its phase-2 kit, not the moves it opened with), its ultimate, and the
  // banner text for any HP-threshold phase transitions. All drawn straight from
  // the enemy's own def (u.def, set in buildEnemyUnit) — no separate data to keep in sync.
  // e.g. "Wraith Volley (130% ATK × 3 hits) — Loyal spirits, flung like stones..."
  // power is the game's own damage multiplier (dealt damage = power × the
  // attacker's ATK stat), so "N% ATK" is the literal, accurate answer to "what
  // % of damage does this do" rather than a guess relative to any one target's HP.
  function abilityDmgTag(ab) {
    if (!ab || !ab.power) return '';
    const pct = Math.round(ab.power * 100) + '% ATK';
    return ' (' + pct + (ab.hits > 1 ? ' × ' + ab.hits + ' hits' : '') + ')';
  }

  function enemyMechanicsText(u) {
    const def = u.def;
    if (!def) return '';
    const lines = [];
    const moveset = (def.movesets && def.movesets[u.moveset || 'default']) || [];
    const seen = new Set();
    moveset.forEach((entry) => {
      const ab = entry && entry.ability;
      if (ab && ab.name && !seen.has(ab.name)) { seen.add(ab.name); lines.push(ab.name + abilityDmgTag(ab) + ' — ' + (ab.desc || '')); }
    });
    if (def.ult && def.ult.name) lines.push('ULT: ' + def.ult.name + abilityDmgTag(def.ult) + ' — ' + (def.ult.desc || ''));
    if (Array.isArray(def.phases)) {
      def.phases.forEach((ph) => {
        if (ph && ph.banner) lines.push('At ' + Math.round((ph.hpPct || 0) * 100) + '% HP: ' + ph.banner);
      });
    }
    // Scripted mechanics that aren't otherwise explained by a phase banner above
    // (e.g. periodic reinforcement spawns) — see DS.ENEMY_MECHANIC_NOTES.
    const note = DS.ENEMY_MECHANIC_NOTES && DS.ENEMY_MECHANIC_NOTES[def.id];
    if (note) lines.push('MECHANIC: ' + note);
    return lines.join('\n');
  }

  function renderEnemy(u) {
    const card = el('div', 'bunit enemy' + (u.rarity === 5 ? ' r5' : '') + (u.alive ? '' : ' dead'));
    card.dataset.uid = u.uid;
    if (u.rarity === 5) card.appendChild(el('div', 'r5-sheen'));
    const mechanicsText = enemyMechanicsText(u);
    if (mechanicsText) {
      card.classList.add('card-tooltip');
      card.setAttribute('data-tooltip', mechanicsText);
    }

    // Full-bleed art fills the whole card, edge to edge — the frame overlay (below) sits
    // on top of it and visually covers its outer band.
    card.appendChild(DS.C.portrait(u, { size: 160, rarity: u.rarity, element: u.element }));
    card.appendChild(el('div', 'card-frame'));

    card.appendChild(el('div', 'card-top-scrim'));
    const brk = el('div', 'broken-tag', 'BROKEN');
    brk.style.display = u.broken ? 'block' : 'none';
    card.appendChild(brk);

    const nameRow = el('div', 'bname', u.name + ' ');
    nameRow.appendChild(el('span', 'small text-faint', 'Lv.' + u.level));
    card.appendChild(nameRow);

    // Weakness icons.
    const weak = el('div', 'weak-row');
    (u.weak || []).forEach((w) => {
      const wIcon = el('span', 'weak-icon', (DS.ELEMENT_META[w] || {}).icon || w);
      wIcon.style.color = (DS.ELEMENT_META[w] || {}).color || '#fff';
      wIcon.title = 'Weak to ' + w;
      weak.appendChild(wIcon);
    });
    card.appendChild(weak);

    // Bottom overlay: status row, toughness bar, HP bar — all pinned to the card's base.
    card.appendChild(el('div', 'card-bottom-scrim'));
    const bottom = el('div', 'card-bottom');
    bottom.appendChild(el('div', 'bstatus'));
    if (u.maxToughness > 0) {
      bottom.appendChild(el('div', 'ds-bar tough-bar', [el('div', 'fill toughness')]));
    }
    const hpFillEl = el('div', 'fill hp');
    hpFillEl.style.width = Math.max(0, (u.hp / u.stats.hp) * 100) + '%';
    const shieldFillEl = el('div', 'fill shield-overlay');
    shieldFillEl.style.width = Math.min(100, Math.max(0, (u.shieldHp / u.stats.hp) * 100)) + '%';
    shieldFillEl.style.display = u.shieldHp > 0 ? '' : 'none';
    const hpPlate = el('div', 'hp-plate', [
      el('div', 'ds-bar hp-ds', [hpFillEl, shieldFillEl]),
      el('div', 'hp-label small', ''),
    ]);
    bottom.appendChild(hpPlate);
    card.appendChild(bottom);

    // Initialize toughness fill to its current value too, so a full DOM rebuild
    // (which happens after nearly every action) never visibly resets/re-animates it.
    const toughFillEl = card.querySelector('.fill.toughness');
    if (toughFillEl) toughFillEl.style.width = Math.max(0, (u.toughness / Math.max(1, u.maxToughness)) * 100) + '%';

    card.onclick = () => {
      if (S.pendingSlot) {
        const ability = S.battle.currentActor && S.battle.currentActor.abilities[S.pendingSlot];
        if (ability && ability.target === 'singleEnemy' && u.alive) tryAct(S.pendingSlot, u.uid);
      } else if (S.pendingUltUid) {
        const caster = S.battle.party.find((p) => p.uid === S.pendingUltUid);
        if (caster && caster.abilities.ult.target === 'singleEnemy' && u.alive) tryUlt(S.pendingUltUid, u.uid);
      }
    };
    return card;
  }

  function renderAlly(u) {
    const card = el('div', 'bunit ally' + (u.rarity === 5 ? ' r5' : '') + (u.alive ? '' : ' dead'));
    card.dataset.uid = u.uid;
    if (u.rarity === 5) card.appendChild(el('div', 'r5-sheen'));

    // Full-bleed art fills the whole card, edge to edge — the frame overlay (below) sits
    // on top of it and visually covers its outer band.
    card.appendChild(DS.C.portrait(u, { size: 160, rarity: u.rarity, element: u.element }));
    card.appendChild(el('div', 'card-frame'));

    card.appendChild(el('div', 'card-top-scrim'));
    card.appendChild(el('div', 'bname', u.name.split(',')[0].split(' of ')[0]));

    // Bottom overlay: status row + HP bar, pinned to the card's base.
    card.appendChild(el('div', 'card-bottom-scrim'));
    const bottom = el('div', 'card-bottom');
    bottom.appendChild(el('div', 'bstatus'));
    const hpFillEl = el('div', 'fill hp');
    hpFillEl.style.width = Math.max(0, (u.hp / u.stats.hp) * 100) + '%';
    const shieldFillEl = el('div', 'fill shield-overlay');
    shieldFillEl.style.width = Math.min(100, Math.max(0, (u.shieldHp / u.stats.hp) * 100)) + '%';
    shieldFillEl.style.display = u.shieldHp > 0 ? '' : 'none';
    const hpPlate = el('div', 'hp-plate', [
      el('div', 'ds-bar hp-ds', [hpFillEl, shieldFillEl]),
      el('div', 'hp-label small', ''),
    ]);
    bottom.appendChild(hpPlate);
    card.appendChild(bottom);

    // Ult icon — usable ANY time it's charged; fills upward as Energy charges instead of a separate bar.
    // Initialized to the unit's CURRENT charge immediately (not the CSS default of empty) so a full
    // DOM rebuild — which happens after nearly every action — never visibly resets/re-animates it.
    const ultPct = Math.max(0, Math.min(1, u.energy / u.maxEnergy));
    const ultFillEl = el('span', 'ult-fill');
    ultFillEl.style.clipPath = `inset(${(1 - ultPct) * 100}% 0 0 0)`;
    const ultReady = u.alive && u.energy >= u.maxEnergy && !S.battle.over && !S.playing;
    const ultMask = el('span', 'ult-btn-mask', [ultFillEl, el('span', 'ult-glyph', '✦')]);
    const ult = el('button', 'ult-btn' + (ultReady ? ' ready' : ''), [ultMask]);
    if (u.abilities.ult) {
      ult.setAttribute('data-tooltip', u.abilities.ult.name + abilityDmgTag(u.abilities.ult) + ' — ' + (u.abilities.ult.desc || 'Unleash the instant it is charged.'));
    }
    ult.onclick = (ev) => {
      ev.stopPropagation();
      if (!u.alive || u.energy < u.maxEnergy || S.playing || S.battle.over) return;
      const ultAb = u.abilities.ult;
      if (needsTarget(ultAb)) {
        S.pendingUltUid = u.uid;
        S.pendingSlot = null;
        DS.C.toast('Choose a target for ' + ultAb.name, { icon: '🎯' });
        markTargets(ultAb);
      } else {
        tryUlt(u.uid, null);
      }
    };
    card.appendChild(ult);
    card.onclick = () => {
      if (S.pendingSlot) {
        const ability = S.battle.currentActor && S.battle.currentActor.abilities[S.pendingSlot];
        if (ability && ability.target === 'singleAlly' && u.alive) tryAct(S.pendingSlot, u.uid);
      } else if (S.pendingUltUid) {
        const caster = S.battle.party.find((p) => p.uid === S.pendingUltUid);
        if (caster && caster.abilities.ult.target === 'singleAlly' && u.alive) tryUlt(S.pendingUltUid, u.uid);
      }
    };
    return card;
  }

  function markTargets(ability) {
    if (!S.root) return;
    S.root.querySelectorAll('.bunit').forEach((c) => c.classList.remove('targetable'));
    const wantEnemy = ability.target === 'singleEnemy';
    S.battle.units().forEach((u) => {
      if (!u.alive) return;
      if ((wantEnemy && u.isEnemy) || (!wantEnemy && !u.isEnemy)) {
        const c = unitCardEl(u.uid);
        if (c) c.classList.add('targetable');
      }
    });
  }

  function renderControls() {
    const B = S.battle;
    const bar = el('div', 'control-bar');

    // Three sections so SP stays pinned far left, the action buttons stay
    // centered in whatever room is left, and Auto/Speed/Flee stay pinned far
    // right — regardless of how many ability buttons are showing right now.
    const left = el('div', 'control-left');
    const center = el('div', 'control-center');
    const right = el('div', 'control-right');

    // SP pips.
    const spWrap = el('div', 'sp-wrap', [el('span', 'small text-dim', 'SP'), el('div', 'sp-pips')]);
    left.appendChild(spWrap);

    // Gating on !S.playing too (not just B.awaitingInput) matters: the battle
    // engine can already consider itself "awaiting input" while the UI is still
    // animating the previous action's hit/log/VFX queue (playQueue()). Without
    // this, the buttons render as if clickable and any click during that window
    // silently no-ops in tryAct/tryUlt — which reads as the battle being "stuck"
    // (this was especially visible in Covenant Trials, where several party
    // members' battle-start techniques queue up back to back, stretching out
    // the window where input looked available but wasn't).
    if (B.awaitingInput && !S.playing && B.currentActor && !B.currentActor.isEnemy && !B.over) {
      const actor = B.currentActor;
      const abilityBtn = (slot, label) => {
        const ab = actor.abilities[slot];
        if (!ab) return null;
        const b = el('button', 'ability-btn' + (S.pendingSlot === slot ? ' pending' : ''), [
          el('div', 'ab-label', label + ' · ' + ab.name),
        ]);
        // Full description now lives in a hover tooltip (see [data-tooltip] in
        // battle.css) instead of inline text, so the button's size no longer
        // swings with how long each ability's flavor text happens to be.
        if (ab.desc) b.setAttribute('data-tooltip', ab.desc);
        if (slot === 'skill' && B.teamSp < 1) b.disabled = true;
        b.onclick = () => {
          if (S.pendingSlot === slot) { S.pendingSlot = null; render(); return; }
          if (needsTarget(ab)) {
            S.pendingSlot = slot;
            S.pendingUltUid = null;
            render();
            markTargets(ab);
          } else {
            tryAct(slot, null);
          }
        };
        return b;
      };
      // Whose turn it is now lives in the battle log below (see the 'turnStart' log
      // line) plus the acting card's own highlight — the control bar stays action-only.
      center.appendChild(abilityBtn('basic', 'Basic'));
      center.appendChild(abilityBtn('skill', 'Skill −1 SP'));
    }

    // Expedition stages (source.kind 'stage') are meant to be played by hand —
    // Auto stays available for domains/trials/boss rush/free battles.
    if (!(S.source && S.source.kind === 'stage')) {
      const autoBtn = el('button', S.auto ? 'primary' : 'ghost', S.auto ? 'AUTO ✓' : 'AUTO');
      autoBtn.onclick = () => { S.auto = !S.auto; render(); if (S.auto && B.awaitingInput && !S.playing) autoAct(); };
      right.appendChild(autoBtn);
    }

    const spdBtn = el('button', 'ghost', '×' + speed());
    spdBtn.onclick = () => {
      DS.State.settings.battleSpeed = speed() >= 2 ? 1 : speed() + 0.5;
      DS.Save.persist();
      render();
    };
    right.appendChild(spdBtn);

    const flee = el('button', 'danger', 'Flee');
    flee.onclick = async () => {
      const yes = await DS.C.confirm('Abandon this fight? Estus spent is not returned.', { danger: true, okLabel: 'Flee' });
      if (yes) { DS.VFX.detach(); const ret = DS.UI.battleReturn(); DS.UI.navigate(ret.screen, ret.params); }
    };
    right.appendChild(flee);

    bar.appendChild(left);
    bar.appendChild(center);
    bar.appendChild(right);
    return bar;
  }

  // ─────────────────── screen registration ───────────────────

  DS.UI.registerScreen('battle', {
    render(params) {
      const wrap = el('div', 'screen battle-screen');
      S.root = wrap;
      if (params && params.spawns) {
        const onStart = (team) => startBattle({
          team,
          spawns: params.spawns,
          background: params.background || 'burg',
          source: Object.assign({ spawns: params.spawns, estusCost: params.estusCost }, params.source || {}),
        });
        if (params.source && params.source.kind === 'fortress') fortressSquadModal(params, onStart);
        else teamSelectModal(onStart);
      } else if (S.battle) {
        setTimeout(() => { render(); playQueue(); }, 0);
      } else {
        wrap.appendChild(el('div', 'empty-state', 'No battle underway. Choose a stage from the world map.'));
      }
      return wrap;
    },
    onLeave() { DS.VFX.detach(); S.battle = null; S.root = null; DS.Music.play('hub'); },
  });
})();
