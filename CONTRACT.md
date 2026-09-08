# ASHEN TACTICS: EMBERS OF LORDRAN — Architecture Contract v1
This file is the single source of truth for every module builder. Deviating from a schema or API
signature here breaks another agent's module. If you must deviate, record it in your report.

## 0. Ground rules
- Plain JavaScript (ES2020), NO modules/imports/exports, NO build step, NO external libraries.
  Each file is an IIFE that attaches to the global `window.DS` namespace: `window.DS = window.DS || {};`.
- 2-space indent, single quotes.
- Fan project: real Dark Souls character/place NAMES are allowed, but ALL prose (descriptions,
  flavor text, dialogue) must be ORIGINAL writing — never copy text from the games. All art is
  original (CSS/SVG/emoji/canvas) — never reference or embed ripped game assets.
- Every file you own must parse standalone (no syntax errors) and only reference other DS.* APIs
  defined in this contract.
- Absolute project root: `C:\Users\brand\OneDrive\Desktop\Warriors Rampage\AshenTactics2\`

## 1. Script load order (index.html — owned by the coordinator)
```
js/core/constants.js   js/core/rng.js   js/core/sfx.js   js/core/save.js
js/data/characters.js  js/data/traces.js
js/data/weapons.js     js/data/relics.js   js/data/items.js
js/data/enemies.js     js/data/encounters.js
js/data/banners.js     js/data/quests.js   js/data/events_mail.js
js/engine/formulas.js  js/engine/battle.js js/engine/ai.js
js/engine/progression.js js/engine/inventory.js js/engine/gacha.js
js/engine/questlog.js  js/engine/meta.js
js/ui/components.js    js/ui/vfx.js
js/ui/battle-ui.js     js/ui/gacha-ui.js
js/ui/character-ui.js  js/ui/inventory-ui.js
js/ui/hub-ui.js        js/ui/quest-ui.js
js/ui/app.js           (boots last)
```
CSS: `css/theme.css` (tokens/shared — coordinator), `css/battle.css`, `css/gacha.css`,
`css/character.css`, `css/hub.css`.

## 2. Constants (js/core/constants.js — ALREADY WRITTEN by coordinator; read it)
- `DS.ELEMENTS` = ['Physical','Fire','Frost','Lightning','Magic','Dark','Holy']
- `DS.ELEMENT_META[el]` = { color, icon }
- `DS.PATHS` = { Warrior, Sentinel, Assassin, Mage, Cleric, Herald, Occultist } (HSR-path
  analogs: Destruction, Preservation, Hunt, Erudition, Abundance, Harmony, Nihility). Each
  { icon, desc }.
- `DS.RARITY_META[1..5]` = { name, color }
- `DS.STATUS[id]` = { name, kind:'buff'|'debuff'|'dot'|'control', icon } for ids:
  burn, bleed, poison, shock, curse, blind, freeze, hex, atkUp, atkDown, defUp, defDown,
  spdUp, spdDown, vulnerability, dmgUp, evasionUp, taunt, counterStance, judgment
- `DS.BREAK_EFFECTS[element]` = { status, desc } — applied on toughness break:
  Physical→bleed, Fire→burn, Frost→freeze, Lightning→shock, Dark→curse, Holy→judgment
  (instant bonus dmg + drain 20 enemy "energy"), Magic→hex (extra 25% action delay).
- `DS.SLOTS` = ['helm','armor','ring','talisman']
- `DS.RELIC_MAINSTATS[slot]` = allowed main stats; `DS.RELIC_SUBSTATS` = pool
  Stat keys: hpPct, atkPct, defPct, hpFlat, atkFlat, defFlat, spd, critRate, critDmg,
  breakEffect, effectHitRate, effectRes, healBoost, energyRegen
- `DS.EFFECT_KEYS` (the ONLY allowed effect hooks for weapon passives / relic 4pc / remembrance):
  Stat-time: atkPct, hpPct, defPct, spdPct, critRate, critDmg, breakEffect, healBoost, energyRegen,
  dmgBoostElement{element,pct}
  Battle-time: battleStartEnergy{amount}, battleStartShieldPct{pct}, spOnBattleStart{amount},
  dmgVsBrokenPct{pct}, dmgVsDebuffedPct{pct}, ultDmgPct{pct}, skillDmgPct{pct}, basicDmgPct{pct},
  followUpDmgPct{pct}, onBreakEnergy{amount}, onKillAtkPct{pct,turns}, lowHpDmgReduction{threshold,pct},
  dotDmgPct{pct}, healOnUltPct{pct}, energyOnHitTaken{amount}
- `DS.LEVEL_CAPS` = [20,30,40,50,60,70,80] (index = ascension rank 0..6)
- `DS.CURVES` = { charXp(level), playerXp(level), weaponXp(level), enemyHp(base,level),
  enemyAtk(base,level), enemyDef(base,level), breakBaseDmg(level) }

## 3. Persistent state (js/core/save.js — ALREADY WRITTEN by coordinator; read it)
`DS.State` (live object, persisted to localStorage via `DS.Save.persist()` — call after mutations):
```
{
  player: { name, level, exp, estus, estusMax, lastEstusTs },
  currencies: { souls, humanity, signs },        // signs = summon tickets
  roster: { [charId]: { level, exp, asc, remembrance, traces:{[nodeId]:true},
                        weaponUid|null, relics:{helm,armor,ring,talisman → uid|null} } },
  inventory: { items: {[itemId]:count},
               weapons: {[uid]: {uid, defId, level, exp, refine, locked, equippedBy|null}},
               relics:  {[uid]: {uid, defId, setId, slot, rarity, level, mainStat:{key,value},
                                 subStats:[{key,value}], locked, equippedBy|null}} },
  gacha: { [bannerId]: {pity5, pity4, guaranteed} , history: [{ts,bannerId,rarity,type,id}] },
  progress: { stages: {[stageId]: {clears, stars}}, quests: {[questId]: {step, done}},
              mail: {[mailId]: 'read'|'claimed'}, events: {[eventId]: {claimed:{}}},
              dailies: {date, done:{}}, tutorialSeen: {} },
  settings: { sfx:true, reduceMotion:false, battleSpeed:1 },
}
```
API: `DS.Save.load()`, `DS.Save.persist()`, `DS.Save.reset()`, `DS.Save.grant(rewards)` where
rewards = `{souls?, humanity?, signs?, estus?, items?:{id:count}, weapons?:[defId], characters?:[charId], playerExp?}`
(grant handles dupes → remembrance/shards, returns a summary array for toasts).

## 4. Data schemas
### 4.1 Characters (js/data/characters.js → `DS.CHARACTERS` array) — owner: data-characters
```
{ id, name, title, element, path, rarity(3|4|5),
  base: { hp, atk, def, spd },            // level-1 values
  growth: { hp, atk, def },               // added PER LEVEL (linear)
  critRate: 0.05, critDmg: 0.50, maxEnergy,
  art: { palette:[dark,mid,accent], icon:'⚔️', aura:'ember'|'frost'|'void'|'holy'|'storm'|'soul' },
  lore: '2-3 original sentences',
  basic:  Ability, skill: Ability, ult: UltAbility, talent: Talent, technique: Technique,
  remembrance: [ {level:1..6, name, desc, fx:{key,params}} ]   // 6 entries, EFFECT_KEYS only
}
Ability = { name, desc, target:'singleEnemy'|'allEnemies'|'randomEnemies'|'splash'|'self'|
            'singleAlly'|'allAllies'|'allyLowestHp', power, hits, toughnessDmg, energyGain,
            element?(defaults char element), critChanceBonus?, defPierce?, splash?,
            bonusVsBroken?, bonusVsDebuffed?,
            anim: { type:'slash'|'pierce'|'blast'|'beam'|'nova'|'buff'|'ritual'|'volley', color },
            extra?(ctx, user, targets, allies, dmgDealt) }
UltAbility = Ability + { energyCost, cutin: { title, line } }   // line = short original battle cry
Talent = { name, desc, on:'allyBreak'|'enemyDebuffed'|'allyShielded'|'damageTaken'|'selfCrit'|
           'selfEvaded'|'turnStart'|'selfSkill'|'selfAction'|'allyDown'|'enemyDown'|'passive',
           effect(ctx, unit, data, allies), passive fields (see §5.2 passives) }
Technique = { name, desc, effect(ctx, unit, party, enemies) }
```
REQUIRED ids (referenced elsewhere): chosen_undead (4★ starter, Physical/Warrior),
oscar (3★ starter), solaire, ornstein, smough, gwyn, artorias, quelaag, sif, seath, nito, manus,
fourkings, havel, siegmeyer, lautrec, gwyndolin, priscilla, logan. Add ~4 more (e.g. quelana,
ciaran, gough, laurentius) → 23-24 total. Rarity spread ≈ 5★×9, 4★×9, 3★×5.

### 4.2 Traces (js/data/traces.js → `DS.TRACES[charId] = { nodes:[...] }`) — owner: data-characters
```
node = { id:'<charId>_t1', name, desc, kind:'stat'|'abilityUp'|'bonus',
         stat?{key,value}, ability?('basic'|'skill'|'ult')+powerPct, bonus?{key,params},
         cost: { souls, items:{itemId:count} }, requires:[nodeId], tier:1..3 }
```
8-10 nodes per character. Use only EFFECT_KEYS for 'bonus' kind. Item ids from §4.5.

### 4.3 Weapons (js/data/weapons.js → `DS.WEAPONS`) — owner: data-equipment
```
{ id, name, rarity(1..5), path,          // equippable only by matching path
  baseAtk, baseHp, baseDef,              // level-1; scale linearly ×(1+0.08×(level-1))
  maxLevel: 60/70/80 by rarity,
  art: { icon, palette:[c1,c2] }, lore,
  passive: { name, desc, fx: [ {key, params, perRefine} ] }   // EFFECT_KEYS; perRefine = added per refine rank beyond 1 (refine 1..5)
}
```
≈30 weapons: 5★×6, 4★×10, 3★×8, 2★×4, 1★×2 (low-rarity = gacha filler, still usable).

### 4.4 Relics (js/data/relics.js → `DS.RELIC_SETS`) — owner: data-equipment
```
{ id, name, lore, art:{icon,palette},
  pieces: { helm:{name}, armor:{name}, ring:{name}, talisman:{name} },
  bonus2: { desc, fx:{key,params} }, bonus4: { desc, fx:{key,params} } }
```
8 sets themed on DS lore (e.g. 'Way of White', 'Chaos Servant', 'Darkwraith', 'Dragon Remnants',
'Princess Guard', 'Warrior of Sunlight', 'Path of the Dragon', 'Gravelord Servant').
Relic instances are GENERATED by DS.Inventory (engine-meta) using DS.RELIC_MAINSTATS/SUBSTATS.

### 4.5 Items (js/data/items.js → `DS.ITEMS`) — owner: data-equipment
```
{ id, name, rarity, kind:'material'|'exp'|'consumable'|'currencyPack'|'weaponPart',
  icon, lore, use?:{...} }
```
REQUIRED ids: soul_small, soul_large, soul_hero (char EXP: 500/2k/8k),
titanite_shard, titanite_large, titanite_chunk, titanite_slab (weapon xp / ascend mats),
ember_asc_1..ember_asc_3 (character ascension tiers), demon_core, boss_soul_fragment,
green_blossom, estus_shard (restores 60 estus), humanity_sprite (→ 40 humanity),
relic_dust (relic crafting), sign_fragment (10 → 1 sign). ~24 items total.
Also `DS.RECIPES` array here: { id, out:{type:'item'|'weapon'|'relic', id?, setId?, slot?, count},
inputs:{itemId:count}, souls } — ~10 recipes (craft weapons, relics of chosen set, consumables).

### 4.6 Enemies (js/data/enemies.js → `DS.ENEMIES`) — owner: data-world
```
{ id, name, title, element, tier:'fodder'|'elite'|'boss',
  base:{hp,atk,def,spd}, toughness, weak:[elements≥2 for bosses],
  art:{palette, icon, aura}, maxEnergy(enemy ult meter),
  movesets: { default: [ {ability:Ability, weight} ], phase2?: [...] },
  ult?: UltAbility(no cutin required),
  phases?: [ { hpPct, name, banner:'original one-liner', moveset:'phase2',
               onEnter?(ctx, unit) } ],
  onAllyDeath?(ctx, unit, fallen)   // e.g. Smough powers up when Ornstein falls
}
```
Keep v1 roster ids where sensible; add skeletons, crystal golem, sentinel, darkwraith,
painting guardian, kalameet, bed_of_chaos(gimmick: high def, weak after breaks). Bosses used in
encounters MUST have 2 phases minimum for world-final stages.

### 4.7 Encounters (js/data/encounters.js → `DS.WORLDS`) — owner: data-world
```
DS.WORLDS = [ { id, name, desc, background:'asylum'|'burg'|'depths'|'anor'|'abyss'|'kiln',
                unlockPlayerLevel, stages:[ Stage ] } ]
Stage = { id, name, subtitle, estusCost, recLevel, spawns:[{id, level, statMult?}],
          firstClear:Rewards, repeat:Rewards, boss?:true }
```
5 worlds ≈ 4-6 stages each (last stage of each world = multi-phase boss), plus:
`DS.DOMAINS` (3 daily material stages: souls / titanite / ember mats) and
`DS.BOSS_RUSH` = { id, name, sequence:[stageId-like spawn groups], rewards }.

### 4.8 Banners (js/data/banners.js → `DS.BANNERS`) — owner: data-world
```
{ id, name, kind:'limited'|'standard'|'beginner'|'weapon', featured5?, featured4:[],
  pool5:[charIds or weaponIds], pool4:[...], pool3:[...], pool2:[itemIds], pool1:[itemIds],
  art:{palette, icon, tagline(original)}, costSigns:1 }
Rates (all banners): 5★ 0.6% (soft pity from 74: +6%/roll, hard 90), 4★ 5.1% (pity 10),
3★ 33%, 2★ 28%, remainder 1★. Limited: 50/50 → guaranteed. Beginner: 5★ guaranteed ≤ 50, 20% off.
```

### 4.9 Quests (js/data/quests.js → `DS.QUESTS`) — owner: data-world
```
{ id, npc, name, icon, summary, steps: [
    { type:'dialogue', lines:[{speaker, text(original!)}] } |
    { type:'battle', encounter:{spawns:[...], background} } |
    { type:'collect', itemId, count } |
    { type:'clearStage', stageId } ],
  rewards: Rewards }
```
4-5 questlines (Solaire's sun-search, Siegmeyer's stuck-again saga, Lautrec's bargain,
Logan's archive key, Anastacia) × 4-6 steps. All dialogue ORIGINAL writing in-voice.

### 4.10 Events & Mail (js/data/events_mail.js → `DS.EVENTS`, `DS.MAIL`) — owner: data-world
```
Event = { id, name, tagline, icon, palette, kind:'login'|'bossRush'|'boost',
          tiers:[{req, desc, rewards}] }   // login: day count; bossRush: clears
Mail  = { id, from, subject, body(original), rewards?:Rewards, icon }
```
3 events, 5+ starter mails (welcome mail grants humanity 3200 + signs 10 etc.).

## 5. Engine APIs
### 5.1 Formulas (js/engine/formulas.js → `DS.Formulas`) — owner: engine-battle
`dmg({atk, power, dmgBoost, critMult, defender:{def,level}, attackerLevel, resPct, brokenMult,
vulnMult, defPierce})`, `critRoll(rate)`, `hitRoll(acc,eva)`, `breakDmg(level, breakEffect, element)`.
HSR-like def curve: `defMult = 1 - def / (def + 200 + 10*attackerLevel)`.

### 5.2 Battle (js/engine/battle.js → `DS.Battle` class) — owner: engine-battle
Constructor: `new DS.Battle({ party:[BattleUnitSpec], spawns:[{id,level,statMult?}],
background, onEvent(evt) })`. BattleUnitSpec (produced by DS.Progression.buildBattleUnit):
```
{ uid, defId, name, element, path, rarity, art, level,
  stats: { hp, atk, def, spd, critRate, critDmg, breakEffect, effectHitRate, effectRes,
           healBoost, energyRegen, dmgBoost:{[element]:pct} },
  maxEnergy, abilities:{ basic, skill, ult, talent, technique },   // powers pre-multiplied by traces
  fx: [ {key, params} ]    // merged weapon+relic+remembrance battle-time effects
}
```
- AV timeline: baseAV = 10000/spd; `previewTimeline(n)` → [{uid, av}]. Action advance/delay in ctx.
- SP: shared party pool max 5, start 3 (+techniques). basic +1 / skill −1 (party only).
- Energy: gains — basic 20, skill 30, hit taken 5-10, kill +10, ally break +5 for breaker;
  after ult → energy = 5. Enemies also charge an "ult meter" for their ult if defined.
- Toughness: ONLY enemies have it. Only hits of an element in enemy.weak reduce toughness.
  On break: 25%-of-bar action delay, +25% dmg taken while broken, apply DS.BREAK_EFFECTS +
  `DS.Formulas.breakDmg`. Recovers to full at unit's next turn start.
- ULT INTERRUPT: `castUlt(uid, targetUid?)` legal whenever `!over` and that unit's energy is full —
  resolves immediately (even during another unit's awaited input), does NOT consume the caster's
  timeline turn.
- `playerAct(slot:'basic'|'skill', targetUid?)`, `advance()` (runs AI turns until player input
  needed / battle over), `awaitingInput`, `currentActor`, `over`, `result`, `teamSp`, `turnCount`.
- Multi-phase: on hp crossing phase.hpPct → switch moveset, emit 'phase' event, run onEnter,
  refill toughness, clear debuffs from the boss.
- EVENTS: engine pushes to an internal queue; UI consumes via `drainEvents()` →
  `{t:'turnStart'|'ability'|'hit'|'heal'|'shield'|'status'|'dot'|'break'|'phase'|'cutin'|'death'|
     'sp'|'energy'|'victory'|'defeat'|'log', ...payload with uids, amounts, crit/weak flags, text}`.
  Also call `onEvent(evt)` synchronously if provided. Every visible number/effect must emit.
- ctx API (passed to ability extra/talents — superset of v1): log, buff(unit,{stat,mult,duration,name}),
  debuff, heal, shield, dot(unit,{name,dmgPerTurn,duration,stacking?}), addStatus(unit,statusId,
  {duration,potency?}), hasStatus, cleanse, taunt(unit,turns), actionAdvance(unit,pct),
  actionDelay(unit,pct), gainEnergy, drainEnergy, gainSp, execute, dealBonusTrueDamage,
  getDotStacks, refreshDots, summonReinforcement?(no-op ok), party(unit), foes(unit), rng.
- Passive talent fields honored: passiveDamageReduction{thresholdHpPct,reduction},
  passiveHpThresholdBuff{thresholdHpPct,stat,mult}, passiveDamageBonusVsBroken,
  passiveDamageBonusVsLowHp{thresholdHpPct,bonus}, passiveDamageBonusVsDebuff{debuffName,bonus}.
- All EFFECT_KEYS battle-time hooks implemented here (read unit.fx).

### 5.3 AI (js/engine/ai.js → `DS.AI.takeTurn(battle, unit)`) — owner: engine-battle
Weighted moveset selection, ult when charged, focus-fire lowest HP% 65% / random else,
respect taunt, don't waste AoE on single target when single-target move available.

### 5.4 Progression (js/engine/progression.js → `DS.Progression`) — owner: engine-meta
`computeStats(charId)` (base+growth×level, asc mult ×(1+0.12×asc), traces stat nodes, weapon,
relics incl. set bonuses, remembrance stat fx) → full stats block;
`buildBattleUnit(charId)` → BattleUnitSpec (§5.2); `gainCharExp(charId, amount)` (multi-level,
respects cap), `canAscend/ascend(charId)` (consumes items per §4.5 tiers),
`unlockTrace(charId, nodeId)`, `charPower(charId)` (display number),
`gainPlayerExp(amount)` (bonfire level; raises estusMax +5/level, refills estus),
`spendEstus(n)`/`estusTick()` (regen 1 per 6 min via lastEstusTs).

### 5.5 Inventory (js/engine/inventory.js → `DS.Inventory`) — owner: engine-meta
`addItem/removeItem/has`, `createWeapon(defId)`, `weaponGainExp(uid, itemIds)` (consume titanite),
`refineWeapon(uid)` (dupe or slab), `equipWeapon(charId, uid)`,
`rollRelic(setId?, slot?, rarity)` (random main/substats per constants pools),
`enhanceRelic(uid, dustCount)` (+1 lvl per feed; new/boosted substat every 3 levels, max +15),
`equipRelic(charId, uid)`, `salvage(uids)` → dust, `craft(recipeId)`, `useConsumable(itemId)`.

### 5.6 Gacha (js/engine/gacha.js → `DS.Gacha`) — owner: engine-meta
`roll(bannerId, count:1|10)` → array of `{rarity, type:'character'|'weapon'|'item', id, isNew,
dupeConverted?:{remembrance?|refine?|shards}}`; implements §4.8 rates/pity/50-50/guarantee,
converts sign cost (auto-buys signs with humanity ×160 if short), records history + pity in State.
`getPity(bannerId)`, `canAfford(bannerId, count)`.

### 5.7 Quest log (js/engine/questlog.js → `DS.QuestLog`) — owner: engine-meta
`activeQuests()`, `questState(id)`, `advance(questId)` (for dialogue/collect/reward steps),
`completeBattleStep(questId)` (called by battle-ui on victory of a quest battle),
`claimRewards(questId)`. Dailies: `dailyTasks()` (3 static: 1 stage clear, 1 enhance, 1 pull),
`checkDaily(taskId)`.

### 5.8 Meta (js/engine/meta.js → `DS.Meta`) — owner: engine-meta
Mail: `mailList()`, `readMail(id)`, `claimMail(id)`. Events: `eventProgress(id)`,
`claimEventTier(id, tierIdx)`. Login tracking `tickLogin()`. Stage completion:
`completeStage(stageId, {stars})` → grants rewards (first clear vs repeat), player exp, drops.
Boss rush progress. `notifBadges()` → {mail:n, quests:n, events:n} for hub badges.

## 6. UI layer
### 6.1 App shell (js/ui/app.js — coordinator-owned)
`DS.UI.registerScreen(name, { render(params) → HTMLElement, onEnter?, onLeave? })`;
`DS.UI.navigate(name, params?)`, `DS.UI.rerender()`, `DS.UI.current`. Screens to register:
title, home, map, battle, gacha, characters, characterDetail, inventory, crafting, quests,
events, mail, settings. Top bar (currencies, estus, back button) is drawn by app.js for all
screens except title/battle/gacha-ritual.
### 6.2 Components (js/ui/components.js — coordinator-owned): `DS.C` =
el(tag, cls, children|text), icon(name), portrait(artOrUnit, {size, rarity, element}),
statBar({cls, cur, max, label}), itemCard(itemId|instance, {count, onClick, selected}),
charCard(charId, {onClick, showPower}), weaponCard(uid|defId), relicCard(uid),
modal({title, body, actions}) → close(), toast(text, {icon}), confirm(text) → Promise,
tabs(list, onPick), rewardsPopup(summaryArray), starRating(n), emptyState(text).
### 6.3 VFX (js/ui/vfx.js) — owner: ui-battle
Canvas overlay API: `DS.VFX.attach(container)`, `burst(x,y,{color,count,type:'ember'|'soul'|'shard'})`,
`beam(x1,y1,x2,y2,color)`, `slash(x,y,color,angle)`, `nova(x,y,color)`, `screenShake(intensity)`,
`flash(color,ms)`, `ambient(background)` (looping embers/motes/snow per battle background),
`floatText(x,y,text,{cls})` (damage numbers: crit=big gold, weak=amber tag, heal=green),
`cutIn(unit, ult, done)` (full-screen ult cinematic: dark wash, palette rays, portrait slide,
title+line, then done()). Respect `DS.State.settings.reduceMotion` and `battleSpeed`.
### 6.4 Screen owners
- ui-battle: 'battle' screen. Party bottom (portrait cards w/ HP/energy/ult-ready glow +
  clickable ULT buttons anytime charged), enemies top w/ toughness bars + weakness icons +
  phase banners, AV timeline strip (from previewTimeline), SP pips, ability bar w/ SP costs,
  target picking, event-queue playback with animations/floating numbers/SFX, speed toggle,
  auto-battle toggle (uses DS.AI for party), victory screen (rewards via DS.Meta.completeStage
  or quest callback, star rating: 3 stars = no deaths), defeat screen.
- ui-gacha: 'gacha' screen. Banner carousel, pity counters, rates detail modal, history modal,
  1×/10× buttons w/ cost + auto-convert confirm. RITUAL: full-screen canvas sequence — bonfire
  ignition ritual whose intensity tier = best rarity in batch (1★ sputtering grey ember →
  5★ extended: darkness, gathering humanity sprites, coiled sword strike, ring of white-gold
  fire, silhouette reveal). Skippable after 1s. Then results reveal (cards flip one by one,
  rarity-colored bursts, NEW badge, dupe→conversion note), 10-pull summary grid.
- ui-character: 'characters' roster grid (filter by element/path/rarity); 'characterDetail'
  tabs: Stats (+power), Level (feed soul items w/ preview), Ascend, Traces (tree layout,
  unlock flow), Abilities (numbers incl. trace boosts), Weapon (equip/level/refine),
  Relics (4 slots, equip picker, enhance, set bonus display), Remembrance.
- ui-inventory: 'inventory' (tabs: materials/consumables/weapons/relics, use/salvage/lock)
  and 'crafting' (recipe list, requirements, craft w/ result popup).
- ui-hub: 'title' (cinematic: slow ember drift, logo, "touch to begin"), 'home' (HSR-style hub:
  big menu tiles w/ notif badges — Battle, Summon, Characters, Inventory, Crafting, Quests,
  Events, Mail, Settings; player card w/ bonfire level + estus), 'map' (world select →
  stage list w/ stars/cost/rewards; domains + boss rush entries), 'settings' (sfx, reduce
  motion, battle speed, save reset w/ confirm, credits/disclaimer).
- ui-quest: 'quests' (questline list w/ NPC portraits, step tracker, dialogue player screen
  w/ typewriter text + speaker portraits, launch quest battles via battle screen params,
  dailies panel), 'events' (event cards, tier claim UI), 'mail' (inbox list, read pane,
  claim attachments, claim-all).
### 6.5 Battle launch contract (hub/map/quest → battle):
`DS.UI.navigate('battle', { spawns, background, source: {kind:'stage'|'quest'|'bossRush'|'domain',
stageId?|questId?}, partyOverride? })`. battle-ui builds party from a team-select modal
(remembers last team in State.progress.lastTeam), calls DS.Progression.buildBattleUnit per member.
On victory routes rewards by source kind (Meta.completeStage / QuestLog.completeBattleStep / etc).

## 7. Balance targets
Player chars lv1 HP≈700-1400, ATK≈90-190. Enemy fodder lv-scaled via DS.CURVES. A well-built
lv40 team should clear world 3; world 5 boss expects lv60+. Ten-pull ≈ 1600 humanity. Starter
grants ≈ 40 pulls total across mail/quests/events. First-clear stage rewards 60-150 humanity.

## 8. Reporting
Each agent returns JSON: { filesWritten:[paths], publicApi:[names], deviations:[strings],
notes:string }. List EVERY deviation from this contract.
