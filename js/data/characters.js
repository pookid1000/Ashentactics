// ASHEN TACTICS — playable roster (CONTRACT.md §4.1). Original writing throughout.
// Buff convention: additive `mult` (+0.20 = +20%, -0.15 = -15%). heal/dot magnitudes read user.stats.

window.DS = window.DS || {};

(function () {
  const C = {
    PHYS: '#b8b3a4', FIRE: '#e2662c', FROST: '#7ec8e3', LTN: '#e8c840',
    MAG: '#7a86e8', DARK: '#8b5fbf', HOLY: '#e8dc9a',
  };
  const atkOf = (u, m) => Math.max(1, Math.round(((u.stats && u.stats.atk) || 100) * m));
  const hpOf = (u, m) => Math.max(1, Math.round(((u.stats && u.stats.hp) || 1000) * m));

  DS.CHARACTERS = [

    // ════════════════════════════ STARTERS ════════════════════════════
    {
      id: 'chosen_undead', name: 'The Chosen Undead', title: 'Bearer of the Darksign',
      element: 'Physical', path: 'Warrior', rarity: 4,
      base: { hp: 940, atk: 132, def: 88, spd: 102 }, growth: { hp: 47, atk: 5.1, def: 3.1 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 100,
      art: { palette: ['#1a1712', '#4a4034', '#c9a84c'], icon: '🛡', aura: 'ember' },
      lore: 'An undead of no name and no pedigree, pulled from a cell by a dying knight\'s kindness. Prophecies argue about what they are. Their sword does not.',
      basic: { name: 'Worn Longsword', desc: 'A plain cut, honed by ten thousand deaths and one stubborn refusal.', target: 'singleEnemy', power: 1.0, hits: 1, toughnessDmg: 12, energyGain: 20, anim: { type: 'slash', color: C.PHYS } },
      skill: {
        name: 'Lunging Riposte', desc: 'A committed counter-thrust. Deals heavy damage and steels the Chosen\'s resolve, granting bonus Energy.',
        target: 'singleEnemy', power: 1.65, hits: 1, toughnessDmg: 18, energyGain: 30, anim: { type: 'pierce', color: C.PHYS },
        extra(ctx, user) { ctx.gainEnergy(user, 12); },
      },
      ult: {
        name: 'Undying Resolve', desc: 'Everything the curse could not take, put into one swing. Massive damage, then a swallow of Estus restores 18% Max HP.',
        target: 'singleEnemy', power: 2.3, hits: 1, toughnessDmg: 28, energyCost: 100, anim: { type: 'nova', color: '#f0d98a' },
        cutin: { title: 'UNDYING RESOLVE', line: 'Die enough times, and even fate flinches first.' },
        extra(ctx, user) { ctx.heal(user, hpOf(user, 0.18)); },
      },
      talent: {
        name: 'Grit of the Graveless', desc: 'Each time the Chosen Undead takes a hit, ATK rises 4% until battle\'s end (stacks up to 5 times).',
        on: 'damageTaken',
        effect(ctx, unit) {
          unit._grit = Math.min((unit._grit || 0) + 1, 5);
          const b = unit.buffs.find((x) => x.name === 'Grit');
          if (b) b.mult = 0.04 * unit._grit;
          else ctx.buff(unit, { stat: 'atk', mult: 0.04, duration: 99, name: 'Grit', quiet: true });
        },
      },
      technique: { name: 'Bonfire Kindled', desc: 'Begin battle with 20 extra Energy.', effect(ctx, unit) { ctx.gainEnergy(unit, 20); } },
      remembrance: [
        { level: 1, name: 'First Death', desc: 'ATK +6%.', fx: { key: 'atkPct', params: { pct: 0.06 } } },
        { level: 2, name: 'Ring the First Bell', desc: 'Basic attack damage +15%.', fx: { key: 'basicDmgPct', params: { pct: 0.15 } } },
        { level: 3, name: 'Ring the Second Bell', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 4, name: 'Lordvessel Borne', desc: 'Ultimate damage +12%.', fx: { key: 'ultDmgPct', params: { pct: 0.12 } } },
        { level: 5, name: 'Four Souls Gathered', desc: 'CRIT Rate +5%.', fx: { key: 'critRate', params: { pct: 0.05 } } },
        { level: 6, name: 'Inheritor of Fire', desc: 'ATK +10%.', fx: { key: 'atkPct', params: { pct: 0.10 } } },
      ],
    },
    {
      id: 'oscar', name: 'Oscar of Astora', title: 'The Knight Who Opened the Door',
      element: 'Holy', path: 'Sentinel', rarity: 3,
      base: { hp: 1050, atk: 105, def: 108, spd: 94 }, growth: { hp: 52, atk: 3.9, def: 3.9 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 100,
      art: { palette: ['#1c1a14', '#4a4a5a', '#dcd3bd'], icon: '⚜', aura: 'holy' },
      lore: 'An elite knight of Astora who spent his last strength freeing a stranger. In this telling, the kindness was repaid — and he stands again, shield first.',
      basic: { name: 'Astoran Straight Sword', desc: 'Textbook form from a knight who read every textbook.', target: 'singleEnemy', power: 1.0, hits: 1, toughnessDmg: 10, energyGain: 20, anim: { type: 'slash', color: C.HOLY } },
      skill: {
        name: 'Elite Bulwark', desc: 'Raises his crest shield over an ally, granting a shield equal to 18% of their Max HP and DEF +25% for 2 turns.',
        target: 'singleAlly', power: 0, hits: 0, toughnessDmg: 0, energyGain: 30, anim: { type: 'buff', color: C.HOLY },
        extra(ctx, user, targets) { targets.forEach((t) => { ctx.shield(t, hpOf(t, 0.18)); ctx.buff(t, { stat: 'def', mult: 0.25, duration: 2, name: 'Elite Bulwark' }); }); },
      },
      ult: {
        name: 'Oath of the Undead Mission', desc: 'A rallying strike for every ally he could not save. Damages all enemies and shields the whole party for 10% of their Max HP.',
        target: 'allEnemies', power: 1.15, hits: 1, toughnessDmg: 18, energyCost: 100, anim: { type: 'nova', color: C.HOLY },
        cutin: { title: 'OATH OF THE MISSION', line: 'One of us had to matter. Let it be you.' },
        extra(ctx, user, targets, allies) { allies.forEach((a) => ctx.shield(a, hpOf(a, 0.10))); },
      },
      talent: { name: 'Warden\'s Comfort', desc: 'Whenever any ally gains a shield, Oscar recovers 5 Energy.', on: 'allyShielded', effect(ctx, unit) { ctx.gainEnergy(unit, 5); } },
      technique: { name: 'Last Kindness', desc: 'Before battle, shield the whole party for 10% of their Max HP.', effect(ctx, unit, party) { party.forEach((p) => ctx.shield(p, hpOf(p, 0.10))); } },
      remembrance: [
        { level: 1, name: 'Cell Key', desc: 'Max HP +6%.', fx: { key: 'hpPct', params: { pct: 0.06 } } },
        { level: 2, name: 'Crest Polished', desc: 'DEF +10%.', fx: { key: 'defPct', params: { pct: 0.10 } } },
        { level: 3, name: 'Estus Shared', desc: 'Healing given +10%.', fx: { key: 'healBoost', params: { pct: 0.10 } } },
        { level: 4, name: 'Purpose Found', desc: 'Begin battle with 15 Energy.', fx: { key: 'battleStartEnergy', params: { amount: 15 } } },
        { level: 5, name: 'Unbroken Vigil', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 6, name: 'The Door Stays Open', desc: 'Begin battle with a shield equal to 12% of Max HP.', fx: { key: 'battleStartShieldPct', params: { pct: 0.12 } } },
      ],
    },

    // ════════════════════════════ 5★ ════════════════════════════
    {
      id: 'solaire', name: 'Solaire of Astora', title: 'Knight of Sunlight',
      element: 'Holy', path: 'Cleric', rarity: 5,
      base: { hp: 1020, atk: 138, def: 96, spd: 104 }, growth: { hp: 51, atk: 5.3, def: 3.4 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 110,
      art: { palette: ['#1f1a10', '#6a5a2a', '#f0d98a'], icon: '☀', aura: 'holy' },
      lore: 'A warm laugh in a cold land, hunting a sun of his very own. Wherever he plants his feet, despair loses a little ground.',
      basic: { name: 'Sunlight Straight Sword', desc: 'A clean, practiced arc that catches the light even where there is none.', target: 'singleEnemy', power: 1.0, hits: 1, toughnessDmg: 10, energyGain: 20, anim: { type: 'slash', color: C.HOLY } },
      skill: {
        name: 'Warmth of Cooperation', desc: 'Mends an ally for 20% of their Max HP and lifts their ATK by 15% for 2 turns.',
        target: 'singleAlly', power: 0, hits: 0, toughnessDmg: 0, energyGain: 30, anim: { type: 'buff', color: C.HOLY },
        extra(ctx, user, targets) {
          targets.forEach((t) => { ctx.heal(t, hpOf(t, 0.20), user); ctx.buff(t, { stat: 'atk', mult: 0.15, duration: 2, name: 'Warmth' }); });
        },
      },
      ult: {
        name: 'Praise the Sun!', desc: 'A radiant salute that restores 22% Max HP to all allies and raises their ATK by 20% for 3 turns.',
        target: 'allAllies', power: 0, hits: 0, toughnessDmg: 0, energyCost: 110, anim: { type: 'nova', color: '#f0d98a' },
        cutin: { title: 'PRAISE THE SUN', line: 'If the sun will not rise for us — then rise WITH me!' },
        extra(ctx, user, targets) {
          targets.forEach((t) => { ctx.heal(t, hpOf(t, 0.22), user); ctx.buff(t, { stat: 'atk', mult: 0.20, duration: 3, name: 'Praise the Sun' }); });
        },
      },
      talent: {
        name: 'Jolly Cooperation', desc: 'Whenever an ally Breaks an enemy, Solaire gains 12 Energy and the party heals 4% Max HP.',
        on: 'allyBreak',
        effect(ctx, unit, data, allies) { ctx.gainEnergy(unit, 12); allies.forEach((a) => ctx.heal(a, hpOf(a, 0.04), unit)); },
      },
      technique: { name: 'Sunbro\'s Blessing', desc: 'Before battle, shield the most wounded ally for 15% of their Max HP.', effect(ctx, unit, party) { const low = party.reduce((a, b) => (a.hp / a.stats.hp < b.hp / b.stats.hp ? a : b)); ctx.shield(low, hpOf(low, 0.15)); } },
      remembrance: [
        { level: 1, name: 'Medal Given Freely', desc: 'Healing given +10%.', fx: { key: 'healBoost', params: { pct: 0.10 } } },
        { level: 2, name: 'Co-Operator\'s Sign', desc: 'Energy Regeneration +8%.', fx: { key: 'energyRegen', params: { pct: 0.08 } } },
        { level: 3, name: 'Sun-Seeker', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 4, name: 'Radiant Oath', desc: 'Ultimate use heals Solaire 10% of Max HP.', fx: { key: 'healOnUltPct', params: { pct: 0.10 } } },
        { level: 5, name: 'Grossly Incandescent', desc: 'Holy damage +12%.', fx: { key: 'dmgBoostElement', params: { element: 'Holy', pct: 0.12 } } },
        { level: 6, name: 'His Own Sun', desc: 'Healing given +15%.', fx: { key: 'healBoost', params: { pct: 0.15 } } },
      ],
    },
    {
      id: 'ornstein', name: 'Ornstein', title: 'Dragonslayer, First of the Four',
      element: 'Lightning', path: 'Assassin', rarity: 5,
      base: { hp: 930, atk: 168, def: 92, spd: 118 }, growth: { hp: 44, atk: 6.4, def: 3.2 },
      critRate: 0.08, critDmg: 0.55, maxEnergy: 110,
      art: { palette: ['#1a1408', '#7a5a1f', '#e8c840'], icon: '⚡', aura: 'storm' },
      lore: 'Captain of Gwyn\'s knights, honed on the necks of dragons. His spear arrives a heartbeat before its thunder — and long before regret.',
      basic: { name: 'Cross Spear Thrust', desc: 'A lunge fast enough to make lightning look punctual.', target: 'singleEnemy', power: 1.1, hits: 1, toughnessDmg: 12, energyGain: 22, anim: { type: 'pierce', color: C.LTN } },
      skill: {
        name: 'Leo Piercer', desc: 'A charged skewer with +25% CRIT Rate that shreds the target\'s guard.',
        target: 'singleEnemy', power: 1.9, hits: 1, toughnessDmg: 20, energyGain: 30, critChanceBonus: 0.25, anim: { type: 'pierce', color: C.LTN },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.debuff(t, { stat: 'def', mult: -0.15, duration: 2, name: 'Pierced Guard' })); },
      },
      ult: {
        name: 'Storm of the Dragonslayer', desc: 'Leaps beyond sight and falls as four heavy Lightning bolts, dealing damage scattered across random enemies.',
        target: 'randomEnemies', power: 1.0, hits: 4, toughnessDmg: 14, energyCost: 110, anim: { type: 'volley', color: C.LTN },
        cutin: { title: 'DRAGONSLAYER\'S STORM', line: 'The sky owed me four deaths. Collect.' },
      },
      talent: {
        name: 'Captain\'s Tempo', desc: 'At the start of each of his turns, Ornstein\'s SPD rises 5% (stacks up to 5 times).',
        on: 'turnStart',
        effect(ctx, unit) {
          unit._tempo = Math.min((unit._tempo || 0) + 1, 5);
          const b = unit.buffs.find((x) => x.name === 'Captain\'s Tempo');
          if (b) b.mult = 0.05 * unit._tempo;
          else ctx.buff(unit, { stat: 'spd', mult: 0.05, duration: 99, name: 'Captain\'s Tempo', quiet: true });
        },
      },
      technique: { name: 'Vanguard\'s Instinct', desc: 'Begin battle with his action 30% advanced.', effect(ctx, unit) { ctx.actionAdvance(unit, 0.30); } },
      remembrance: [
        { level: 1, name: 'First Knight\'s Plume', desc: 'CRIT Rate +5%.', fx: { key: 'critRate', params: { pct: 0.05 } } },
        { level: 2, name: 'Wyvern Trophy', desc: 'Lightning damage +10%.', fx: { key: 'dmgBoostElement', params: { element: 'Lightning', pct: 0.10 } } },
        { level: 3, name: 'Spear Unbroken', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 4, name: 'Stormcaller', desc: 'Ultimate damage +15%.', fx: { key: 'ultDmgPct', params: { pct: 0.15 } } },
        { level: 5, name: 'Hunter of Giants', desc: 'CRIT DMG +12%.', fx: { key: 'critDmg', params: { pct: 0.12 } } },
        { level: 6, name: 'Loyal to the Last', desc: 'ATK +12%.', fx: { key: 'atkPct', params: { pct: 0.12 } } },
      ],
    },
    {
      id: 'smough', name: 'Smough', title: 'Royal Executioner',
      element: 'Physical', path: 'Warrior', rarity: 5,
      base: { hp: 1380, atk: 162, def: 122, spd: 80 }, growth: { hp: 66, atk: 6.2, def: 4.2 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 100,
      art: { palette: ['#171310', '#6a5a4a', '#dcd3bd'], icon: '🔨', aura: 'ember' },
      lore: 'The last knight to hold Anor Londo, refused sainthood for his table manners. His hammer forgives nothing, least of all posture.',
      basic: { name: 'Hammer Toll', desc: 'The bell of Anor Londo rings once for every sentence carried out.', target: 'singleEnemy', power: 1.1, hits: 1, toughnessDmg: 22, energyGain: 20, anim: { type: 'blast', color: C.PHYS } },
      skill: {
        name: 'Wrecking Circuit', desc: 'A wide, gleeful sweep that batters all enemies\' toughness.',
        target: 'allEnemies', power: 0.9, hits: 1, toughnessDmg: 26, energyGain: 30, anim: { type: 'nova', color: C.PHYS },
      },
      ult: {
        name: 'Crushing Judgment', desc: 'Both fists on the haft, whole weight behind it. Deals colossal damage — +60% against Broken enemies.',
        target: 'singleEnemy', power: 2.8, hits: 1, toughnessDmg: 34, energyCost: 100, bonusVsBroken: 0.6, anim: { type: 'blast', color: '#f0d98a' },
        cutin: { title: 'CRUSHING JUDGMENT', line: 'Court is adjourned.' },
      },
      talent: { name: 'Executioner\'s Eye', desc: 'Deals 25% more damage to Broken enemies.', on: 'passive', passiveDamageBonusVsBroken: 0.25, effect() {} },
      technique: { name: 'Gilded Wall', desc: 'Before battle, Smough taunts enemies for 1 turn and shields himself for 12% Max HP.', effect(ctx, unit) { ctx.taunt(unit, 1); ctx.shield(unit, hpOf(unit, 0.12)); } },
      remembrance: [
        { level: 1, name: 'Gold-Chased Plate', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 2, name: 'Grinder of Bones', desc: 'Break Effect +12%.', fx: { key: 'breakEffect', params: { pct: 0.12 } } },
        { level: 3, name: 'Heavier Verdicts', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 4, name: 'No Appeals', desc: 'Damage to Broken enemies +15%.', fx: { key: 'dmgVsBrokenPct', params: { pct: 0.15 } } },
        { level: 5, name: 'Cathedral\'s Burden', desc: 'DEF +12%.', fx: { key: 'defPct', params: { pct: 0.12 } } },
        { level: 6, name: 'Last Knight Standing', desc: 'ATK +12%.', fx: { key: 'atkPct', params: { pct: 0.12 } } },
      ],
    },
    {
      id: 'gwyn', name: 'Gwyn', title: 'Lord of Cinder',
      element: 'Fire', path: 'Warrior', rarity: 5,
      base: { hp: 1080, atk: 178, def: 100, spd: 105 }, growth: { hp: 51, atk: 6.8, def: 3.5 },
      critRate: 0.06, critDmg: 0.55, maxEnergy: 120,
      art: { palette: ['#1a0f08', '#7a3a1a', '#ff9d5c'], icon: '🔥', aura: 'ember' },
      lore: 'The lord who fed himself to the flame to buy the world one more age. What returned from the kiln wears his crown, and his grief, and very little else.',
      basic: { name: 'Cinder Greatsword', desc: 'A blade that burned so long it forgot how to be metal.', target: 'singleEnemy', power: 1.15, hits: 1, toughnessDmg: 14, energyGain: 20, anim: { type: 'slash', color: C.FIRE } },
      skill: {
        name: 'Kiln Combo', desc: 'Three relentless strikes that never let the target settle.',
        target: 'singleEnemy', power: 0.78, hits: 3, toughnessDmg: 8, energyGain: 30, anim: { type: 'slash', color: C.FIRE },
      },
      ult: {
        name: 'First Flame\'s Last Light', desc: 'The kiln opens. All enemies take heavy Fire damage and Burn for 2 turns.',
        target: 'allEnemies', power: 1.7, hits: 1, toughnessDmg: 26, energyCost: 120, anim: { type: 'nova', color: C.FIRE },
        cutin: { title: 'THE FIRST FLAME', line: 'I gave everything. You will give a little more.' },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.25), duration: 2 })); },
      },
      talent: {
        name: 'Link the Fire', desc: 'When an ally falls, Gwyn\'s ATK rises 12% permanently and he gains 20 Energy.',
        on: 'allyDown',
        effect(ctx, unit) { ctx.buff(unit, { stat: 'atk', mult: 0.12, duration: 99, name: 'Link the Fire' }); ctx.gainEnergy(unit, 20); },
      },
      technique: { name: 'Age of Fire', desc: 'Before battle, ATK +15% for the first 3 turns.', effect(ctx, unit) { ctx.buff(unit, { stat: 'atk', mult: 0.15, duration: 3, name: 'Age of Fire' }); } },
      remembrance: [
        { level: 1, name: 'Crown of Embers', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 2, name: 'Firstborn\'s Regret', desc: 'Fire damage +10%.', fx: { key: 'dmgBoostElement', params: { element: 'Fire', pct: 0.10 } } },
        { level: 3, name: 'Kiln-Warmed Bones', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 4, name: 'Sacrificial Rite', desc: 'Ultimate damage +15%.', fx: { key: 'ultDmgPct', params: { pct: 0.15 } } },
        { level: 5, name: 'Sunlight\'s Memory', desc: 'CRIT DMG +15%.', fx: { key: 'critDmg', params: { pct: 0.15 } } },
        { level: 6, name: 'Lord of Cinder', desc: 'Fire damage +15%.', fx: { key: 'dmgBoostElement', params: { element: 'Fire', pct: 0.15 } } },
      ],
    },
    {
      id: 'artorias', name: 'Artorias', title: 'The Abysswalker',
      element: 'Dark', path: 'Warrior', rarity: 5,
      base: { hp: 1010, atk: 172, def: 98, spd: 106 }, growth: { hp: 48, atk: 6.6, def: 3.4 },
      critRate: 0.06, critDmg: 0.55, maxEnergy: 100,
      art: { palette: ['#12101a', '#3a3a5a', '#8b5fbf'], icon: '🐺', aura: 'void' },
      lore: 'The knight who walked into the Abyss so no one else would have to. He came back carrying some of it — and it carries him, on the bad days.',
      basic: { name: 'Greatsword of the Wolf', desc: 'A ragged arc from a left hand that learned the right hand\'s work.', target: 'singleEnemy', power: 1.1, hits: 1, toughnessDmg: 14, energyGain: 20, anim: { type: 'slash', color: C.DARK } },
      skill: {
        name: 'Wolf\'s Descent', desc: 'A somersaulting leap that slams into every enemy and steels his own arm (+10% ATK, 2 turns).',
        target: 'allEnemies', power: 0.85, hits: 1, toughnessDmg: 16, energyGain: 30, anim: { type: 'blast', color: C.DARK },
        extra(ctx, user) { ctx.buff(user, { stat: 'atk', mult: 0.10, duration: 2, name: 'Wolf\'s Blood' }); },
      },
      ult: {
        name: 'Abyss Unleashed', desc: 'He stops holding it back. Massive Dark damage, Corruption (DoT for 3 turns), and the target takes 15% more damage.',
        target: 'singleEnemy', power: 2.4, hits: 1, toughnessDmg: 30, energyCost: 100, anim: { type: 'ritual', color: C.DARK },
        cutin: { title: 'ABYSS UNLEASHED', line: 'Forgive me. I can only save you from everything else.' },
        extra(ctx, user, targets) {
          targets.forEach((t) => {
            ctx.dot(t, { name: 'Corruption', dmgPerTurn: atkOf(user, 0.28), duration: 3 });
            ctx.addStatus(t, 'vulnerability', { duration: 3 });
          });
        },
      },
      talent: { name: 'Feral Abyss', desc: 'While below half health, Artorias deals 25% more damage.', on: 'passive', passiveHpThresholdBuff: { thresholdHpPct: 0.5, stat: 'atk', mult: 0.25 }, effect() {} },
      technique: { name: 'Abysswalker\'s Shadow', desc: 'Before battle, delay all enemies\' first actions by 15%.', effect(ctx, unit, party, enemies) { enemies.forEach((e) => ctx.actionDelay(e, 0.15)); } },
      remembrance: [
        { level: 1, name: 'Oath to Gwyn', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 2, name: 'Sif\'s Vigil', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 3, name: 'Left-Hand Legend', desc: 'CRIT Rate +5%.', fx: { key: 'critRate', params: { pct: 0.05 } } },
        { level: 4, name: 'Cover the Retreat', desc: 'Dark damage +12%.', fx: { key: 'dmgBoostElement', params: { element: 'Dark', pct: 0.12 } } },
        { level: 5, name: 'Broken Pendant', desc: 'Ultimate damage +15%.', fx: { key: 'ultDmgPct', params: { pct: 0.15 } } },
        { level: 6, name: 'Legend Never Dies', desc: 'ATK +12%.', fx: { key: 'atkPct', params: { pct: 0.12 } } },
      ],
    },
    {
      id: 'quelaag', name: 'Quelaag', title: 'Chaos Witch',
      element: 'Fire', path: 'Mage', rarity: 5,
      base: { hp: 1120, atk: 158, def: 90, spd: 92 }, growth: { hp: 53, atk: 6.1, def: 3.1 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 110,
      art: { palette: ['#1a0d08', '#6a2a1a', '#e2662c'], icon: '🕷', aura: 'ember' },
      lore: 'Daughter of the Witch of Izalith, fused to a nightmare of chitin and lava, guarding a sister the world forgot. Everything she burns, she burns for family.',
      basic: { name: 'Furysword Swipe', desc: 'A molten crescent; the air scars where it passes. Splashes fire onto another enemy.', target: 'singleEnemy', power: 1.0, hits: 1, toughnessDmg: 12, energyGain: 20, splash: 0.4, anim: { type: 'slash', color: C.FIRE } },
      skill: {
        name: 'Bed of Lava', desc: 'Vents the earth beneath every enemy, dealing Fire damage and Burning for 2 turns.',
        target: 'allEnemies', power: 0.7, hits: 1, toughnessDmg: 14, energyGain: 30, anim: { type: 'nova', color: C.FIRE },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.20), duration: 2 })); },
      },
      ult: {
        name: 'Chaos Eruption', desc: 'Izalith answers. Heavy Fire damage to all enemies, refreshing and worsening every Burn.',
        target: 'allEnemies', power: 1.55, hits: 1, toughnessDmg: 24, energyCost: 110, anim: { type: 'nova', color: '#ff9d5c' },
        cutin: { title: 'CHAOS ERUPTION', line: 'My mother made a sun below the world. Meet it.' },
        extra(ctx, user, targets) {
          targets.forEach((t) => { ctx.refreshDots(t); ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.25), duration: 2 }); });
        },
      },
      talent: { name: 'Mother of Chaos', desc: 'Deals 20% more damage to enemies below half health.', on: 'passive', passiveDamageBonusVsLowHp: { thresholdHpPct: 0.5, bonus: 0.20 }, effect() {} },
      technique: { name: 'Chaos Seed', desc: 'Before battle, all enemies begin Burning.', effect(ctx, unit, party, enemies) { enemies.forEach((e) => ctx.dot(e, { name: 'Burn', dmgPerTurn: atkOf(unit, 0.12), duration: 2 })); } },
      remembrance: [
        { level: 1, name: 'Sister\'s Keeper', desc: 'Fire damage +10%.', fx: { key: 'dmgBoostElement', params: { element: 'Fire', pct: 0.10 } } },
        { level: 2, name: 'Chitin Plating', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 3, name: 'Slow Boil', desc: 'Damage over time dealt +15%.', fx: { key: 'dotDmgPct', params: { pct: 0.15 } } },
        { level: 4, name: 'Witchfire Lineage', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 5, name: 'Furysword\'s Hunger', desc: 'Skill damage +15%.', fx: { key: 'skillDmgPct', params: { pct: 0.15 } } },
        { level: 6, name: 'Daughter of Izalith', desc: 'Damage over time dealt +25%.', fx: { key: 'dotDmgPct', params: { pct: 0.25 } } },
      ],
    },
    {
      id: 'seath', name: 'Seath the Scaleless', title: 'The Paledrake',
      element: 'Magic', path: 'Mage', rarity: 5,
      base: { hp: 1060, atk: 166, def: 92, spd: 88 }, growth: { hp: 50, atk: 6.4, def: 3.2 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 110,
      art: { palette: ['#101418', '#3a5a6a', '#9fe8d8'], icon: '💎', aura: 'soul' },
      lore: 'The dragon born without the one thing dragons are. He traded his kin for a library and calls it a fair bargain, on the days he remembers what fairness was.',
      basic: { name: 'Crystal Ray', desc: 'A lance of light bent through grown crystal until it forgets mercy.', target: 'singleEnemy', power: 1.05, hits: 1, toughnessDmg: 12, energyGain: 20, anim: { type: 'beam', color: C.MAG } },
      skill: {
        name: 'Crystal Breath', desc: 'A shearing exhalation over all enemies with a 60% chance to Blind each for 2 turns.',
        target: 'allEnemies', power: 0.9, hits: 1, toughnessDmg: 16, energyGain: 30, anim: { type: 'beam', color: '#9fe8d8' },
        extra(ctx, user, targets) { targets.forEach((t) => { if (ctx.rng() < 0.6) ctx.addStatus(t, 'blind', { duration: 2 }); }); },
      },
      ult: {
        name: 'Moonlight Cataclysm', desc: 'The archive\'s prize theorem, proven on flesh: heavy Magic damage to all enemies that ignores 40% of DEF.',
        target: 'allEnemies', power: 1.45, hits: 1, toughnessDmg: 24, energyCost: 110, defPierce: 0.4, anim: { type: 'nova', color: '#9fe8d8' },
        cutin: { title: 'MOONLIGHT CATACLYSM', line: 'Immortality was the control group. You are the experiment.' },
      },
      talent: { name: 'Primordial Crystal', desc: 'Deals 20% more damage to Blinded enemies.', on: 'passive', passiveDamageBonusVsDebuff: { debuffName: 'blind', bonus: 0.20 }, effect() {} },
      technique: { name: 'Paledrake\'s Gaze', desc: 'Before battle, Blind a random enemy for 2 turns.', effect(ctx, unit, party, enemies) { const t = enemies[Math.floor(Math.random() * enemies.length)]; if (t) ctx.addStatus(t, 'blind', { duration: 2 }); } },
      remembrance: [
        { level: 1, name: 'Archive Key', desc: 'Magic damage +10%.', fx: { key: 'dmgBoostElement', params: { element: 'Magic', pct: 0.10 } } },
        { level: 2, name: 'Scale of Nothing', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 3, name: 'Grant of Tenure', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 4, name: 'Peer Review', desc: 'Damage to debuffed enemies +12%.', fx: { key: 'dmgVsDebuffedPct', params: { pct: 0.12 } } },
        { level: 5, name: 'Crystalline Thesis', desc: 'Ultimate damage +15%.', fx: { key: 'ultDmgPct', params: { pct: 0.15 } } },
        { level: 6, name: 'Grandfather of Sorcery', desc: 'Magic damage +15%.', fx: { key: 'dmgBoostElement', params: { element: 'Magic', pct: 0.15 } } },
      ],
    },
    {
      id: 'nito', name: 'Nito', title: 'First of the Dead',
      element: 'Dark', path: 'Occultist', rarity: 5,
      base: { hp: 1180, atk: 154, def: 104, spd: 84 }, growth: { hp: 56, atk: 5.9, def: 3.6 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 100,
      art: { palette: ['#0d0d0d', '#3a3a34', '#8a8070'], icon: '💀', aura: 'void' },
      lore: 'A congregation of skeletons wearing one great soul like a shroud. He does not hate the living; he simply files them under "pending."',
      basic: {
        name: 'Grave Scythe', desc: 'A slow, patient sweep that leaves Poison in the wound.',
        target: 'singleEnemy', power: 0.95, hits: 1, toughnessDmg: 12, energyGain: 20, anim: { type: 'slash', color: C.DARK },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.dot(t, { name: 'Poison', dmgPerTurn: atkOf(user, 0.12), duration: 99, stacking: true })); },
      },
      skill: {
        name: 'Grave Miasma', desc: 'Exhales the breath of every tomb at once, Poisoning all enemies (stacks, never expires).',
        target: 'allEnemies', power: 0.65, hits: 1, toughnessDmg: 14, energyGain: 30, anim: { type: 'ritual', color: C.DARK },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.dot(t, { name: 'Poison', dmgPerTurn: atkOf(user, 0.12), duration: 99, stacking: true })); },
      },
      ult: {
        name: 'Rigor Mortis', desc: 'Death files its claim: heavy damage plus bonus true damage per Poison stack. Enemies under 12% HP are taken outright.',
        target: 'singleEnemy', power: 1.4, hits: 1, toughnessDmg: 26, energyCost: 100, anim: { type: 'ritual', color: '#8a8070' },
        cutin: { title: 'RIGOR MORTIS', line: 'You were always going to arrive here. I merely kept your appointment.' },
        extra(ctx, user, targets) {
          targets.forEach((t) => {
            const stacks = ctx.getDotStacks(t, 'Poison');
            if (stacks > 0) ctx.dealBonusTrueDamage(user, t, atkOf(user, 0.35) * stacks);
            if (t.alive && t.hp / t.stats.hp < 0.12) ctx.execute(t);
          });
        },
      },
      talent: {
        name: 'Gravelord\'s Toll', desc: 'At the start of his turn, a random enemy gains a Poison stack.',
        on: 'turnStart',
        effect(ctx, unit) {
          const foes = ctx.foes(unit).filter((f) => f.alive);
          if (foes.length) ctx.dot(foes[Math.floor(Math.random() * foes.length)], { name: 'Poison', dmgPerTurn: atkOf(unit, 0.10), duration: 99, stacking: true });
        },
      },
      technique: { name: 'Miasma of the Grave', desc: 'Before battle, all enemies gain one Poison stack.', effect(ctx, unit, party, enemies) { enemies.forEach((e) => ctx.dot(e, { name: 'Poison', dmgPerTurn: atkOf(unit, 0.12), duration: 99, stacking: true })); } },
      remembrance: [
        { level: 1, name: 'Coffin Splinter', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 2, name: 'Congregation Grows', desc: 'Damage over time dealt +15%.', fx: { key: 'dotDmgPct', params: { pct: 0.15 } } },
        { level: 3, name: 'Old Bones', desc: 'Max HP +10%.', fx: { key: 'hpPct', params: { pct: 0.10 } } },
        { level: 4, name: 'Ledger of Names', desc: 'Effect Hit Rate +10%.', fx: { key: 'effectHitRate', params: { pct: 0.10 } } },
        { level: 5, name: 'Deathbed Companion', desc: 'Ultimate damage +15%.', fx: { key: 'ultDmgPct', params: { pct: 0.15 } } },
        { level: 6, name: 'First of the Dead', desc: 'Damage over time dealt +25%.', fx: { key: 'dotDmgPct', params: { pct: 0.25 } } },
      ],
    },
    {
      id: 'manus', name: 'Manus', title: 'Father of the Abyss',
      element: 'Dark', path: 'Warrior', rarity: 5,
      base: { hp: 1260, atk: 184, def: 88, spd: 96 }, growth: { hp: 60, atk: 7.1, def: 3.1 },
      critRate: 0.06, critDmg: 0.5, maxEnergy: 120,
      art: { palette: ['#0a0810', '#2a1f3a', '#8b5fbf'], icon: '🕳', aura: 'void' },
      lore: 'Once a man; the grave could not make that stick. What clawed back up wants one small keepsake returned — and will unmake a country per hour until it is.',
      basic: { name: 'Abyssal Claw', desc: 'A hand the size of a doorway closes like a verdict.', target: 'singleEnemy', power: 1.15, hits: 1, toughnessDmg: 14, energyGain: 22, anim: { type: 'slash', color: C.DARK } },
      skill: {
        name: 'Catalyst Toll', desc: 'His broken catalyst rings once: heavy damage and 15 bonus toughness shred.',
        target: 'singleEnemy', power: 1.6, hits: 1, toughnessDmg: 30, energyGain: 30, anim: { type: 'blast', color: C.DARK },
      },
      ult: {
        name: 'Great Feast of the Abyss', desc: 'The dark opens its mouth. One enemy takes catastrophic damage that ignores ALL defense.',
        target: 'singleEnemy', power: 2.7, hits: 1, toughnessDmg: 30, energyCost: 120, defPierce: 1.0, anim: { type: 'ritual', color: '#2a1f3a' },
        cutin: { title: 'THE GREAT FEAST', line: 'Give it back. GIVE. IT. BACK.' },
      },
      talent: { name: 'Ravenous Dark', desc: 'Whenever Manus takes damage, he gains 8 bonus Energy.', on: 'damageTaken', effect(ctx, unit) { ctx.gainEnergy(unit, 8); } },
      technique: { name: 'Humanity Incarnate', desc: 'Begin battle with 30 extra Energy.', effect(ctx, unit) { ctx.gainEnergy(unit, 30); } },
      remembrance: [
        { level: 1, name: 'Amber Keepsake', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 2, name: 'Depths Below Depths', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 3, name: 'Grasp of the Father', desc: 'CRIT DMG +12%.', fx: { key: 'critDmg', params: { pct: 0.12 } } },
        { level: 4, name: 'Sorrow Made Solid', desc: 'Dark damage +12%.', fx: { key: 'dmgBoostElement', params: { element: 'Dark', pct: 0.12 } } },
        { level: 5, name: 'Oolacile\'s Lesson', desc: 'Ultimate damage +18%.', fx: { key: 'ultDmgPct', params: { pct: 0.18 } } },
        { level: 6, name: 'Origin of the Abyss', desc: 'ATK +14%.', fx: { key: 'atkPct', params: { pct: 0.14 } } },
      ],
    },

    // ════════════════════════════ 4★ ════════════════════════════
    {
      id: 'priscilla', name: 'Priscilla', title: 'The Crossbreed',
      element: 'Frost', path: 'Herald', rarity: 4,
      base: { hp: 920, atk: 136, def: 88, spd: 110 }, growth: { hp: 45, atk: 5.2, def: 3.0 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 110,
      art: { palette: ['#141418', '#4a5a6a', '#dcd3bd'], icon: '❄', aura: 'frost' },
      lore: 'Half dragon, half god, wholly unwanted by a world that painted her a prison and called it mercy. She asks you to leave. Once.',
      basic: { name: 'Lifehunt Graze', desc: 'The scythe barely touches — which is precisely as much as it needs.', target: 'singleEnemy', power: 1.0, hits: 1, toughnessDmg: 10, energyGain: 20, anim: { type: 'slash', color: C.FROST } },
      skill: {
        name: 'Painted Veil', desc: 'Snow thickens around the party: allies gain +20% Evasion for 2 turns, and one enemy is slowed 15%.',
        target: 'singleEnemy', power: 0.7, hits: 1, toughnessDmg: 10, energyGain: 30, anim: { type: 'buff', color: C.FROST },
        extra(ctx, user, targets, allies) {
          allies.forEach((a) => ctx.buff(a, { stat: 'evasion', mult: 0.20, duration: 2, name: 'Painted Veil' }));
          targets.forEach((t) => ctx.debuff(t, { stat: 'spd', mult: -0.15, duration: 2, name: 'Chilled' }));
        },
      },
      ult: {
        name: 'Silence of the Painting', desc: 'The world goes white and very quiet. All enemies take Frost damage and are Frozen, skipping their next action.',
        target: 'allEnemies', power: 1.25, hits: 1, toughnessDmg: 22, energyCost: 110, anim: { type: 'nova', color: C.FROST },
        cutin: { title: 'PAINTED SILENCE', line: 'I asked you kindly. The snow will not.' },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.addStatus(t, 'freeze', { duration: 1 })); },
      },
      talent: {
        name: 'Unseen Daughter', desc: 'At the start of her turn, the slowest ally\'s action advances 15%.',
        on: 'turnStart',
        effect(ctx, unit, data, allies) {
          const alive = allies.filter((a) => a.alive && a !== unit);
          if (!alive.length) return;
          const slowest = alive.reduce((a, b) => (a.stats.spd < b.stats.spd ? a : b));
          ctx.actionAdvance(slowest, 0.15);
        },
      },
      technique: { name: 'Cloak of Fog', desc: 'Before battle, Blind all enemies for 1 turn.', effect(ctx, unit, party, enemies) { enemies.forEach((e) => ctx.addStatus(e, 'blind', { duration: 1 })); } },
      remembrance: [
        { level: 1, name: 'Snowfield Solitude', desc: 'SPD +4%.', fx: { key: 'spdPct', params: { pct: 0.04 } } },
        { level: 2, name: 'Soft-Spoken Warning', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 3, name: 'Lifehunt\'s Whisper', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 4, name: 'Guardian of the Frame', desc: 'Energy Regeneration +8%.', fx: { key: 'energyRegen', params: { pct: 0.08 } } },
        { level: 5, name: 'Frost That Forgives', desc: 'Frost damage +12%.', fx: { key: 'dmgBoostElement', params: { element: 'Frost', pct: 0.12 } } },
        { level: 6, name: 'The Painting Endures', desc: 'ATK +10%.', fx: { key: 'atkPct', params: { pct: 0.10 } } },
      ],
    },
    {
      id: 'fourkings', name: 'The Four Kings', title: 'Drowned Monarchs of New Londo',
      element: 'Dark', path: 'Mage', rarity: 4,
      base: { hp: 1040, atk: 152, def: 84, spd: 94 }, growth: { hp: 49, atk: 5.8, def: 2.9 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 100,
      art: { palette: ['#0d1014', '#2a3a4a', '#8b5fbf'], icon: '👑', aura: 'void' },
      lore: 'Four crowns, one hunger. New Londo drowned to keep them in; they consider the flood a minor inconvenience and the dark a fair trade.',
      basic: { name: 'Sovereign Claw', desc: 'One king reaches out. The others watch, jealous.', target: 'singleEnemy', power: 1.05, hits: 1, toughnessDmg: 12, energyGain: 20, anim: { type: 'slash', color: C.DARK } },
      skill: {
        name: 'Twin Regicide', desc: 'Two kings strike random enemies at once.',
        target: 'randomEnemies', power: 0.95, hits: 2, toughnessDmg: 12, energyGain: 30, anim: { type: 'volley', color: C.DARK },
      },
      ult: {
        name: 'Convergence of Kings', desc: 'All four strike as one court — four heavy blows across random enemies.',
        target: 'randomEnemies', power: 1.05, hits: 4, toughnessDmg: 16, energyCost: 100, anim: { type: 'volley', color: '#2a3a4a' },
        cutin: { title: 'CONVERGENCE OF KINGS', line: 'Kneel once, for all four of us. It saves time.' },
      },
      talent: {
        name: 'They Keep Coming', desc: 'Each of their turns adds +5% ATK permanently (stacks all battle).',
        on: 'turnStart',
        effect(ctx, unit) { ctx.buff(unit, { stat: 'atk', mult: 0.05, duration: 99, name: 'They Keep Coming', quiet: true }); },
      },
      technique: { name: 'Absorbed Souls', desc: 'Begin battle with 1 extra Skill Point.', effect(ctx) { ctx.gainSp(1); } },
      remembrance: [
        { level: 1, name: 'First Crown', desc: 'ATK +6%.', fx: { key: 'atkPct', params: { pct: 0.06 } } },
        { level: 2, name: 'Second Crown', desc: 'Dark damage +8%.', fx: { key: 'dmgBoostElement', params: { element: 'Dark', pct: 0.08 } } },
        { level: 3, name: 'Third Crown', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 4, name: 'Fourth Crown', desc: 'Ultimate damage +12%.', fx: { key: 'ultDmgPct', params: { pct: 0.12 } } },
        { level: 5, name: 'Council in the Dark', desc: 'CRIT Rate +5%.', fx: { key: 'critRate', params: { pct: 0.05 } } },
        { level: 6, name: 'The Court Entire', desc: 'ATK +12%.', fx: { key: 'atkPct', params: { pct: 0.12 } } },
      ],
    },
    {
      id: 'havel', name: 'Havel', title: 'The Rock',
      element: 'Physical', path: 'Sentinel', rarity: 4,
      base: { hp: 1420, atk: 108, def: 158, spd: 82 }, growth: { hp: 68, atk: 4.2, def: 5.2 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 110,
      art: { palette: ['#14120e', '#4a443a', '#8a8070'], icon: '🗿', aura: 'ember' },
      lore: 'A bishop-warrior who decided armor should be quarried, not forged. Dragons learned to go around him. So did armies.',
      basic: { name: 'Dragon Tooth', desc: 'A club cut from something that used to bite back.', target: 'singleEnemy', power: 1.0, hits: 1, toughnessDmg: 18, energyGain: 20, anim: { type: 'blast', color: C.PHYS } },
      skill: {
        name: 'Havel\'s Bulwark', desc: 'Plants his feet: taunts all enemies for 2 turns, DEF +40%, and shields himself for 15% Max HP.',
        target: 'self', power: 0, hits: 0, toughnessDmg: 0, energyGain: 30, anim: { type: 'buff', color: C.PHYS },
        extra(ctx, user) { ctx.taunt(user, 2); ctx.buff(user, { stat: 'def', mult: 0.40, duration: 2, name: 'Bulwark' }); ctx.shield(user, hpOf(user, 0.15)); },
      },
      ult: {
        name: 'Unmovable Faith', desc: 'The mountain sermon: heavy damage and toughness shred to all enemies, and Havel mends 15% of his Max HP.',
        target: 'allEnemies', power: 1.25, hits: 1, toughnessDmg: 30, energyCost: 110, anim: { type: 'blast', color: C.PHYS },
        cutin: { title: 'UNMOVABLE FAITH', line: 'The rock does not argue. It concludes.' },
        extra(ctx, user) { ctx.heal(user, hpOf(user, 0.15)); },
      },
      talent: { name: 'Stoneskin', desc: 'Below half health, Havel takes 20% less damage.', on: 'passive', passiveDamageReduction: { thresholdHpPct: 0.5, reduction: 0.20 }, effect() {} },
      technique: { name: 'Pillar of Stone', desc: 'Before battle, shield himself for 25% Max HP.', effect(ctx, unit) { ctx.shield(unit, hpOf(unit, 0.25)); } },
      remembrance: [
        { level: 1, name: 'Quarried Greaves', desc: 'DEF +10%.', fx: { key: 'defPct', params: { pct: 0.10 } } },
        { level: 2, name: 'Warden of the Tower', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 3, name: 'Dragon\'s Due', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 4, name: 'Faith Like Granite', desc: 'While below 50% HP, damage taken −10%.', fx: { key: 'lowHpDmgReduction', params: { threshold: 0.5, pct: 0.10 } } },
        { level: 5, name: 'Old Grudges', desc: 'Break Effect +12%.', fx: { key: 'breakEffect', params: { pct: 0.12 } } },
        { level: 6, name: 'The Rock Eternal', desc: 'Max HP +12%.', fx: { key: 'hpPct', params: { pct: 0.12 } } },
      ],
    },
    {
      id: 'siegmeyer', name: 'Siegmeyer of Catarina', title: 'The Onion Knight',
      element: 'Physical', path: 'Sentinel', rarity: 4,
      base: { hp: 1240, atk: 122, def: 128, spd: 92 }, growth: { hp: 59, atk: 4.7, def: 4.4 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 100,
      art: { palette: ['#16130c', '#5a4a2a', '#c9a84c'], icon: '🧅', aura: 'ember' },
      lore: 'Perpetually stuck, perpetually cheerful, and — when the moment finally comes — perpetually underestimated. Catarina steel has layers.',
      basic: { name: 'Zweihander Swing', desc: 'A hearty, whole-shoulder swing, followed by a satisfied hum.', target: 'singleEnemy', power: 1.05, hits: 1, toughnessDmg: 14, energyGain: 20, anim: { type: 'slash', color: C.PHYS } },
      skill: {
        name: 'Onion Resolve', desc: 'Peels an ally\'s troubles away: cleanses their debuffs and grants a 15% Max HP shield.',
        target: 'singleAlly', power: 0, hits: 0, toughnessDmg: 0, energyGain: 30, anim: { type: 'buff', color: C.PHYS },
        extra(ctx, user, targets) { targets.forEach((t) => { ctx.cleanse(t); ctx.shield(t, hpOf(t, 0.15)); }); },
      },
      ult: {
        name: 'Catarina\'s Pledge', desc: 'The nap ends. A tremendous blow to one enemy, and the whole party gains a 12% Max HP shield.',
        target: 'singleEnemy', power: 2.2, hits: 1, toughnessDmg: 28, energyCost: 100, anim: { type: 'blast', color: C.PHYS },
        cutin: { title: 'CATARINA\'S PLEDGE', line: 'Hmm. Yes. NOW it is my moment!' },
        extra(ctx, user, targets, allies) { allies.forEach((a) => ctx.shield(a, hpOf(a, 0.12))); },
      },
      talent: { name: 'Hm, A Predicament', desc: 'Whenever any ally is shielded, Siegmeyer gains 8 Energy.', on: 'allyShielded', effect(ctx, unit) { ctx.gainEnergy(unit, 8); } },
      technique: { name: 'Well-Rested', desc: 'Before battle, cleanse the whole party.', effect(ctx, unit, party) { party.forEach((p) => ctx.cleanse(p)); } },
      remembrance: [
        { level: 1, name: 'First Layer', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 2, name: 'Second Layer', desc: 'DEF +10%.', fx: { key: 'defPct', params: { pct: 0.10 } } },
        { level: 3, name: 'Sitting Vigil', desc: 'Begin battle with 15 Energy.', fx: { key: 'battleStartEnergy', params: { amount: 15 } } },
        { level: 4, name: 'Debt of Honor', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 5, name: 'Fourth Layer', desc: 'Begin battle with a shield equal to 10% of Max HP.', fx: { key: 'battleStartShieldPct', params: { pct: 0.10 } } },
        { level: 6, name: 'Catarina\'s Finest Hour', desc: 'Ultimate damage +18%.', fx: { key: 'ultDmgPct', params: { pct: 0.18 } } },
      ],
    },
    {
      id: 'lautrec', name: 'Lautrec of Carim', title: 'Knight of Favor',
      element: 'Dark', path: 'Assassin', rarity: 4,
      base: { hp: 860, atk: 150, def: 82, spd: 112 }, growth: { hp: 41, atk: 5.8, def: 2.8 },
      critRate: 0.08, critDmg: 0.55, maxEnergy: 90,
      art: { palette: ['#141008', '#6a5a1f', '#e8c840'], icon: '🗡', aura: 'ember' },
      lore: 'Gold-armored, silver-tongued, and loyal to exactly one goddess and zero people. He will absolutely watch your back. That is the problem.',
      basic: {
        name: 'Shotel Slip', desc: 'A hooked blade that finds the gap between courtesy and ribs, feeding him a quarter of the harm.',
        target: 'singleEnemy', power: 1.05, hits: 1, toughnessDmg: 10, energyGain: 20, anim: { type: 'slash', color: C.LTN },
        extra(ctx, user, targets, allies, dmg) { ctx.heal(user, Math.round(dmg * 0.25)); },
      },
      skill: {
        name: 'Favor Repaid in Kind', desc: 'Strikes a debuffed target 40% harder and drinks a third of the damage as health.',
        target: 'singleEnemy', power: 1.5, hits: 1, toughnessDmg: 14, energyGain: 30, bonusVsDebuffed: 0.4, anim: { type: 'pierce', color: C.LTN },
        extra(ctx, user, targets, allies, dmg) { ctx.heal(user, Math.round(dmg * 0.33)); },
      },
      ult: {
        name: 'Embraced Fury', desc: 'Three savage strikes on one enemy, restoring health equal to 35% of the total damage.',
        target: 'singleEnemy', power: 1.0, hits: 3, toughnessDmg: 12, energyCost: 90, anim: { type: 'slash', color: '#e8c840' },
        cutin: { title: 'EMBRACED FURY', line: 'My goddess asks so little. You, unfortunately, are on the list.' },
        extra(ctx, user, targets, allies, dmg) { ctx.heal(user, Math.round(dmg * 0.35)); },
      },
      talent: { name: 'Opportunist', desc: 'Whenever Lautrec lands a critical hit, the whole party heals a little.', on: 'selfCrit', effect(ctx, unit, data, allies) { allies.forEach((a) => ctx.heal(a, atkOf(unit, 0.10), unit)); } },
      technique: { name: 'Knife Before the Bow', desc: 'His first attack of battle is a guaranteed critical hit.', effect(ctx, unit) { ctx.buff(unit, { stat: 'guaranteedCrit', mult: 1, duration: 2, name: 'Ambush', quiet: true }); } },
      remembrance: [
        { level: 1, name: 'Ring of Favor', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 2, name: 'Gilded Conscience', desc: 'CRIT Rate +5%.', fx: { key: 'critRate', params: { pct: 0.05 } } },
        { level: 3, name: 'Debt Collector', desc: 'Damage to debuffed enemies +12%.', fx: { key: 'dmgVsDebuffedPct', params: { pct: 0.12 } } },
        { level: 4, name: 'Freed From the Cell', desc: 'SPD +4%.', fx: { key: 'spdPct', params: { pct: 0.04 } } },
        { level: 5, name: 'Goddess\'s Chosen', desc: 'CRIT DMG +12%.', fx: { key: 'critDmg', params: { pct: 0.12 } } },
        { level: 6, name: 'Favor and Protection', desc: 'ATK +12%.', fx: { key: 'atkPct', params: { pct: 0.12 } } },
      ],
    },
    {
      id: 'gwyndolin', name: 'Gwyndolin', title: 'Dark Sun',
      element: 'Magic', path: 'Occultist', rarity: 4,
      base: { hp: 840, atk: 148, def: 80, spd: 100 }, growth: { hp: 40, atk: 5.7, def: 2.8 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 100,
      art: { palette: ['#101018', '#3a3a5a', '#7a86e8'], icon: '🌙', aura: 'soul' },
      lore: 'Last god left in Anor Londo, keeping an empty city convincing with moonlight and stagecraft. The illusions are art. The arrows are not illusions.',
      basic: { name: 'Moonlight Arrow', desc: 'Loosed from a bow taller than its archer, and colder.', target: 'singleEnemy', power: 1.05, hits: 1, toughnessDmg: 12, energyGain: 20, anim: { type: 'pierce', color: C.MAG } },
      skill: {
        name: 'Stagecraft of the Gods', desc: 'A humiliating unveiling: one enemy loses 20% ATK and 15% DEF for 2 turns.',
        target: 'singleEnemy', power: 0.9, hits: 1, toughnessDmg: 12, energyGain: 30, anim: { type: 'ritual', color: C.MAG },
        extra(ctx, user, targets) {
          targets.forEach((t) => {
            ctx.debuff(t, { stat: 'atk', mult: -0.20, duration: 2, name: 'Unveiled' });
            ctx.debuff(t, { stat: 'def', mult: -0.15, duration: 2, name: 'Unveiled Guard' });
          });
        },
      },
      ult: {
        name: 'Curtain of the Dark Sun', desc: 'The false sky splits: two waves of heavy moonfire damage strike all enemies and leave them Vulnerable for 2 turns.',
        target: 'allEnemies', power: 0.85, hits: 2, toughnessDmg: 16, energyCost: 100, anim: { type: 'volley', color: C.MAG },
        cutin: { title: 'CURTAIN CALL', line: 'You were meant to applaud and leave. Now stay forever.' },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.addStatus(t, 'vulnerability', { duration: 2 })); },
      },
      talent: { name: 'Director\'s Cut', desc: 'Whenever any enemy is debuffed, Gwyndolin gains 8 Energy.', on: 'enemyDebuffed', effect(ctx, unit) { ctx.gainEnergy(unit, 8); } },
      technique: { name: 'Opening Illusion', desc: 'Before battle, all enemies\' ATK −10% for 2 turns.', effect(ctx, unit, party, enemies) { enemies.forEach((e) => ctx.debuff(e, { stat: 'atk', mult: -0.10, duration: 2, name: 'Illusion' })); } },
      remembrance: [
        { level: 1, name: 'Reared by Moonlight', desc: 'Magic damage +8%.', fx: { key: 'dmgBoostElement', params: { element: 'Magic', pct: 0.08 } } },
        { level: 2, name: 'Keeper of the Set', desc: 'Effect Hit Rate +8%.', fx: { key: 'effectHitRate', params: { pct: 0.08 } } },
        { level: 3, name: 'Understudy No More', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 4, name: 'Faithful Stagehands', desc: 'Skill damage +12%.', fx: { key: 'skillDmgPct', params: { pct: 0.12 } } },
        { level: 5, name: 'Standing Ovation', desc: 'Damage to debuffed enemies +12%.', fx: { key: 'dmgVsDebuffedPct', params: { pct: 0.12 } } },
        { level: 6, name: 'The Show Goes On', desc: 'ATK +10%.', fx: { key: 'atkPct', params: { pct: 0.10 } } },
      ],
    },
    {
      id: 'logan', name: 'Big Hat Logan', title: 'The Great Sage',
      element: 'Magic', path: 'Mage', rarity: 4,
      base: { hp: 800, atk: 160, def: 74, spd: 94 }, growth: { hp: 38, atk: 6.2, def: 2.6 },
      critRate: 0.06, critDmg: 0.55, maxEnergy: 110,
      art: { palette: ['#12100a', '#4a3a2a', '#7a86e8'], icon: '🎩', aura: 'soul' },
      lore: 'The finest sorcerer of his age, one archive away from the finest of any age. The hat is not a joke. The hat has tenure.',
      basic: { name: 'Soul Spear', desc: 'The old reliable: a lance of will, peer-reviewed by casualties.', target: 'singleEnemy', power: 1.15, hits: 1, toughnessDmg: 14, energyGain: 20, anim: { type: 'beam', color: C.MAG } },
      skill: {
        name: 'Crystal Soul Spear', desc: 'A crystalline refinement that shatters on impact, cutting DEF by 20% for 2 turns.',
        target: 'singleEnemy', power: 1.7, hits: 1, toughnessDmg: 20, energyGain: 30, anim: { type: 'beam', color: '#9fe8d8' },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.debuff(t, { stat: 'def', mult: -0.20, duration: 2, name: 'Crystal Shatter' })); },
      },
      ult: {
        name: 'White Dragon Thesis', desc: 'Forbidden chapters read aloud: heavy Magic damage to all enemies, ignoring 30% of DEF.',
        target: 'allEnemies', power: 1.3, hits: 1, toughnessDmg: 20, energyCost: 110, defPierce: 0.3, anim: { type: 'nova', color: C.MAG },
        cutin: { title: 'THE WHITE THESIS', line: 'Knowledge wants a body count. Footnotes to follow.' },
      },
      talent: {
        name: 'Archive Secrets', desc: 'After Logan uses his Skill, the whole party\'s ATK rises 10% for 2 turns.',
        on: 'selfSkill',
        effect(ctx, unit, data, allies) { allies.forEach((a) => ctx.buff(a, { stat: 'atk', mult: 0.10, duration: 2, name: 'Archive Secrets' })); },
      },
      technique: { name: 'Forbidden Reading', desc: 'Before battle, all enemies\' DEF −15% for 2 turns.', effect(ctx, unit, party, enemies) { enemies.forEach((e) => ctx.debuff(e, { stat: 'def', mult: -0.15, duration: 2, name: 'Forbidden Reading' })); } },
      remembrance: [
        { level: 1, name: 'Borrowed Quill', desc: 'Magic damage +8%.', fx: { key: 'dmgBoostElement', params: { element: 'Magic', pct: 0.08 } } },
        { level: 2, name: 'Wider Brim', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 3, name: 'Marginalia', desc: 'Skill damage +12%.', fx: { key: 'skillDmgPct', params: { pct: 0.12 } } },
        { level: 4, name: 'Sabbatical in Sen\'s', desc: 'CRIT Rate +5%.', fx: { key: 'critRate', params: { pct: 0.05 } } },
        { level: 5, name: 'Full Professorship', desc: 'Ultimate damage +15%.', fx: { key: 'ultDmgPct', params: { pct: 0.15 } } },
        { level: 6, name: 'The Archive Reads Back', desc: 'Magic damage +12%.', fx: { key: 'dmgBoostElement', params: { element: 'Magic', pct: 0.12 } } },
      ],
    },
    {
      id: 'sif', name: 'Sif', title: 'The Great Grey Wolf',
      element: 'Physical', path: 'Assassin', rarity: 4,
      base: { hp: 980, atk: 146, def: 92, spd: 116 }, growth: { hp: 47, atk: 5.6, def: 3.2 },
      critRate: 0.07, critDmg: 0.5, maxEnergy: 90,
      art: { palette: ['#12120f', '#4a4a44', '#b8b3a4'], icon: '🐺', aura: 'frost' },
      lore: 'A wolf grown great on grief, keeping a promise its master can no longer remember making. The sword in her jaws was a gift. So was the loyalty.',
      basic: { name: 'Carried Blade', desc: 'A greatsword wielded by neck and conviction alone.', target: 'singleEnemy', power: 1.05, hits: 1, toughnessDmg: 12, energyGain: 20, anim: { type: 'slash', color: C.PHYS } },
      skill: {
        name: 'Mourning Stance', desc: 'A low, grieving howl. Sif gains +25% Evasion for 2 turns and will counter the next attack against her.',
        target: 'self', power: 0, hits: 0, toughnessDmg: 0, energyGain: 25, anim: { type: 'buff', color: C.PHYS },
        extra(ctx, user) {
          ctx.buff(user, { stat: 'evasion', mult: 0.25, duration: 2, name: 'Mourning Veil' });
          ctx.buff(user, { stat: 'counterStance', mult: 1, duration: 2, name: 'Grave Guard', quiet: true });
        },
      },
      ult: {
        name: 'Grief of the Grave', desc: 'A desperate, wheeling flurry — six damaging strikes scattered across the enemy line.',
        target: 'randomEnemies', power: 0.78, hits: 6, toughnessDmg: 10, energyCost: 90, anim: { type: 'volley', color: C.PHYS },
        cutin: { title: 'GRIEF OF THE GRAVE', line: 'She still guards him. She always will.' },
      },
      talent: { name: 'Wolf\'s Instinct', desc: 'When an attack misses Sif, she gains 15 Energy and her action advances 10%.', on: 'selfEvaded', effect(ctx, unit) { ctx.gainEnergy(unit, 15); ctx.actionAdvance(unit, 0.10); } },
      technique: { name: 'Guardian\'s Vigil', desc: 'Before battle, gain +20% Evasion for 2 turns.', effect(ctx, unit) { ctx.buff(unit, { stat: 'evasion', mult: 0.20, duration: 2, name: 'Vigil' }); } },
      remembrance: [
        { level: 1, name: 'Pup of the Vale', desc: 'SPD +4%.', fx: { key: 'spdPct', params: { pct: 0.04 } } },
        { level: 2, name: 'Grave-Sworn', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 3, name: 'Ghostly Paths', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 4, name: 'Fang and Memory', desc: 'CRIT Rate +5%.', fx: { key: 'critRate', params: { pct: 0.05 } } },
        { level: 5, name: 'Loyal Beyond Death', desc: 'Ultimate damage +12%.', fx: { key: 'ultDmgPct', params: { pct: 0.12 } } },
        { level: 6, name: 'The Vow Keeps Her', desc: 'ATK +12%.', fx: { key: 'atkPct', params: { pct: 0.12 } } },
      ],
    },
    {
      id: 'quelana', name: 'Quelana of Izalith', title: 'Mother of Pyromancy',
      element: 'Fire', path: 'Mage', rarity: 4,
      base: { hp: 880, atk: 154, def: 78, spd: 98 }, growth: { hp: 42, atk: 5.9, def: 2.7 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 110,
      art: { palette: ['#170d08', '#5a2a1a', '#ff9d5c'], icon: '🔥', aura: 'ember' },
      lore: 'The one daughter who walked away before Izalith cooked itself into legend. She teaches fire the way survivors teach anything: carefully, and to very few.',
      basic: { name: 'Fireball', desc: 'The first lesson. It has ended more lineages than most final ones.', target: 'singleEnemy', power: 1.0, hits: 1, toughnessDmg: 12, energyGain: 20, anim: { type: 'blast', color: C.FIRE } },
      skill: {
        name: 'Firestorm Lesson', desc: 'Pillars of flame erupt beneath all enemies, Burning them for 2 turns.',
        target: 'allEnemies', power: 0.75, hits: 1, toughnessDmg: 14, energyGain: 30, anim: { type: 'nova', color: C.FIRE },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.18), duration: 2 })); },
      },
      ult: {
        name: 'Fire Tempest', desc: 'The graduation exam. Massive Fire damage to one enemy, plus bonus true damage for every DoT afflicting it.',
        target: 'singleEnemy', power: 2.2, hits: 1, toughnessDmg: 26, energyCost: 110, anim: { type: 'nova', color: '#ff9d5c' },
        cutin: { title: 'FIRE TEMPEST', line: 'I fled one inferno. I kept the recipe.' },
        extra(ctx, user, targets) {
          targets.forEach((t) => {
            const n = (t.dots || []).length;
            if (n > 0) ctx.dealBonusTrueDamage(user, t, atkOf(user, 0.30) * n);
          });
        },
      },
      talent: { name: 'Ashes Remember', desc: 'When any enemy dies, Quelana gains 20 Energy.', on: 'enemyDown', effect(ctx, unit) { ctx.gainEnergy(unit, 20); } },
      technique: { name: 'Pilot Light', desc: 'Before battle, Burn all enemies lightly.', effect(ctx, unit, party, enemies) { enemies.forEach((e) => ctx.dot(e, { name: 'Burn', dmgPerTurn: atkOf(unit, 0.10), duration: 2 })); } },
      remembrance: [
        { level: 1, name: 'First Pupil', desc: 'Fire damage +8%.', fx: { key: 'dmgBoostElement', params: { element: 'Fire', pct: 0.08 } } },
        { level: 2, name: 'Careful Hands', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 3, name: 'Controlled Burn', desc: 'Damage over time dealt +15%.', fx: { key: 'dotDmgPct', params: { pct: 0.15 } } },
        { level: 4, name: 'Survivor\'s Guilt', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 5, name: 'Final Lesson', desc: 'Ultimate damage +15%.', fx: { key: 'ultDmgPct', params: { pct: 0.15 } } },
        { level: 6, name: 'Mother of the Craft', desc: 'Fire damage +12%.', fx: { key: 'dmgBoostElement', params: { element: 'Fire', pct: 0.12 } } },
      ],
    },
    {
      id: 'gwynevere', name: 'Gwynevere', title: 'Princess of Sunlight',
      element: 'Holy', path: 'Herald', rarity: 4,
      base: { hp: 1000, atk: 128, def: 90, spd: 100 }, growth: { hp: 50, atk: 4.9, def: 3.1 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 120,
      art: { palette: ['#1a160c', '#7a6a3a', '#f0d98a'], icon: '🌅', aura: 'holy' },
      lore: 'The warmth Anor Londo remembers being. Whether she is truly here or a beautiful argument for staying — soldiers fight harder under her light either way.',
      basic: { name: 'Sunbeam', desc: 'Gentle until it is asked not to be.', target: 'singleEnemy', power: 0.95, hits: 1, toughnessDmg: 10, energyGain: 20, anim: { type: 'beam', color: C.HOLY } },
      skill: {
        name: 'Blessing of the Princess', desc: 'One ally is bathed in dawn: healed 12% Max HP and granted +20% ATK for 2 turns.',
        target: 'singleAlly', power: 0, hits: 0, toughnessDmg: 0, energyGain: 30, anim: { type: 'buff', color: C.HOLY },
        extra(ctx, user, targets) { targets.forEach((t) => { ctx.heal(t, hpOf(t, 0.12), user); ctx.buff(t, { stat: 'atk', mult: 0.20, duration: 2, name: 'Blessing' }); }); },
      },
      ult: {
        name: 'Bountiful Light', desc: 'The whole party is healed 15% Max HP, gains +25% ATK for 2 turns, and recovers 10 Energy.',
        target: 'allAllies', power: 0, hits: 0, toughnessDmg: 0, energyCost: 120, anim: { type: 'nova', color: '#f0d98a' },
        cutin: { title: 'BOUNTIFUL LIGHT', line: 'While the sun holds, so do we.' },
        extra(ctx, user, targets) {
          targets.forEach((t) => { ctx.heal(t, hpOf(t, 0.15), user); ctx.buff(t, { stat: 'atk', mult: 0.25, duration: 2, name: 'Bountiful Light' }); ctx.gainEnergy(t, 10); });
        },
      },
      talent: { name: 'Hearthlight', desc: 'When an ally Breaks an enemy, the party heals 5% Max HP.', on: 'allyBreak', effect(ctx, unit, data, allies) { allies.forEach((a) => ctx.heal(a, hpOf(a, 0.05), unit)); } },
      technique: { name: 'Dawn Chorus', desc: 'Before battle, party ATK +12% for 2 turns.', effect(ctx, unit, party) { party.forEach((p) => ctx.buff(p, { stat: 'atk', mult: 0.12, duration: 2, name: 'Dawn Chorus' })); } },
      remembrance: [
        { level: 1, name: 'Warm Welcome', desc: 'Healing given +10%.', fx: { key: 'healBoost', params: { pct: 0.10 } } },
        { level: 2, name: 'Princess\'s Guard', desc: 'Max HP +8%.', fx: { key: 'hpPct', params: { pct: 0.08 } } },
        { level: 3, name: 'Illusory or Not', desc: 'Energy Regeneration +8%.', fx: { key: 'energyRegen', params: { pct: 0.08 } } },
        { level: 4, name: 'Sunlight Spillover', desc: 'ATK +8%.', fx: { key: 'atkPct', params: { pct: 0.08 } } },
        { level: 5, name: 'Court of Warmth', desc: 'Healing given +12%.', fx: { key: 'healBoost', params: { pct: 0.12 } } },
        { level: 6, name: 'The Sun Remains', desc: 'Begin battle with 25 Energy.', fx: { key: 'battleStartEnergy', params: { amount: 25 } } },
      ],
    },

    // ════════════════════════════ 3★ ════════════════════════════
    {
      id: 'ciaran', name: 'Ciaran', title: 'Lord\'s Blade',
      element: 'Frost', path: 'Assassin', rarity: 3,
      base: { hp: 780, atk: 138, def: 76, spd: 114 }, growth: { hp: 37, atk: 5.3, def: 2.6 },
      critRate: 0.08, critDmg: 0.5, maxEnergy: 90,
      art: { palette: ['#101014', '#3a3a44', '#dcd3bd'], icon: '🎭', aura: 'frost' },
      lore: 'The Four Knights\' quiet answer to loud problems. She mourns exactly one person, and sharpens both blades while she does it.',
      basic: { name: 'Tracer Cross', desc: 'Gold and silver cross once; something falls.', target: 'singleEnemy', power: 1.1, hits: 1, toughnessDmg: 10, energyGain: 20, anim: { type: 'slash', color: C.FROST } },
      skill: {
        name: 'Silver Tracer Art', desc: 'A spinning bleed-cut: heavy damage and Bleed for 2 turns.',
        target: 'singleEnemy', power: 1.55, hits: 1, toughnessDmg: 14, energyGain: 30, anim: { type: 'slash', color: '#dcd3bd' },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.addStatus(t, 'bleed', { duration: 2 })); },
      },
      ult: {
        name: 'Lord\'s Blade Protocol', desc: 'Two flawless, frost-edged strikes delivered as one motion — devastating damage to a single foe.',
        target: 'singleEnemy', power: 1.15, hits: 2, toughnessDmg: 16, energyCost: 90, anim: { type: 'slash', color: C.FROST },
        cutin: { title: 'LORD\'S BLADE', line: 'Grief steadies the hand. Watch.' },
      },
      talent: { name: 'Clean Work', desc: 'Critical hits restore 10 Energy to Ciaran.', on: 'selfCrit', effect(ctx, unit) { ctx.gainEnergy(unit, 10); } },
      technique: { name: 'Silent Approach', desc: 'Before battle, gain +15% SPD for 2 turns.', effect(ctx, unit) { ctx.buff(unit, { stat: 'spd', mult: 0.15, duration: 2, name: 'Silent Approach' }); } },
      remembrance: [
        { level: 1, name: 'Twin Sheaths', desc: 'CRIT Rate +4%.', fx: { key: 'critRate', params: { pct: 0.04 } } },
        { level: 2, name: 'Mask of the Mother', desc: 'ATK +6%.', fx: { key: 'atkPct', params: { pct: 0.06 } } },
        { level: 3, name: 'Vigil at the Grave', desc: 'SPD +4%.', fx: { key: 'spdPct', params: { pct: 0.04 } } },
        { level: 4, name: 'Knife in the Snow', desc: 'Frost damage +10%.', fx: { key: 'dmgBoostElement', params: { element: 'Frost', pct: 0.10 } } },
        { level: 5, name: 'Unrecorded Missions', desc: 'CRIT DMG +10%.', fx: { key: 'critDmg', params: { pct: 0.10 } } },
        { level: 6, name: 'The Lord\'s Own Edge', desc: 'ATK +10%.', fx: { key: 'atkPct', params: { pct: 0.10 } } },
      ],
    },
    {
      id: 'gough', name: 'Gough', title: 'Hawkeye of the Four',
      element: 'Physical', path: 'Warrior', rarity: 3,
      base: { hp: 1100, atk: 130, def: 104, spd: 86 }, growth: { hp: 52, atk: 5.0, def: 3.6 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 100,
      art: { palette: ['#14120c', '#4a4434', '#c9a84c'], icon: '🏹', aura: 'ember' },
      lore: 'A giant who shot a dragon out of the sky without the courtesy of eyesight. He whittles between wars and apologizes to the wood.',
      basic: { name: 'Greatbow Loose', desc: 'An arrow the size of a fencepost, aimed by ear and certainty.', target: 'singleEnemy', power: 1.05, hits: 1, toughnessDmg: 14, energyGain: 20, anim: { type: 'pierce', color: C.PHYS } },
      skill: {
        name: 'Pinning Shot', desc: 'A shaft through the foot, staggering the target and delaying its action 20%.',
        target: 'singleEnemy', power: 1.5, hits: 1, toughnessDmg: 20, energyGain: 30, anim: { type: 'pierce', color: C.PHYS },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.actionDelay(t, 0.20)); },
      },
      ult: {
        name: 'Dragonfell Volley', desc: 'The sky remembers: a rain of great arrows deals heavy damage across all enemies.',
        target: 'allEnemies', power: 1.3, hits: 1, toughnessDmg: 22, energyCost: 100, anim: { type: 'volley', color: C.PHYS },
        cutin: { title: 'DRAGONFELL VOLLEY', line: 'I do not need to see you. The arrow does.' },
      },
      talent: { name: 'Hunter\'s Cadence', desc: 'When any enemy falls, the whole party gains 5 Energy.', on: 'enemyDown', effect(ctx, unit, data, allies) { allies.forEach((a) => ctx.gainEnergy(a, 5)); } },
      technique: { name: 'Ranging Shot', desc: 'Before battle, delay all enemies\' actions 10%.', effect(ctx, unit, party, enemies) { enemies.forEach((e) => ctx.actionDelay(e, 0.10)); } },
      remembrance: [
        { level: 1, name: 'Carved Whistle', desc: 'ATK +6%.', fx: { key: 'atkPct', params: { pct: 0.06 } } },
        { level: 2, name: 'Steady Ear', desc: 'Max HP +6%.', fx: { key: 'hpPct', params: { pct: 0.06 } } },
        { level: 3, name: 'Obsidian Practice', desc: 'Break Effect +10%.', fx: { key: 'breakEffect', params: { pct: 0.10 } } },
        { level: 4, name: 'Giant\'s Patience', desc: 'DEF +8%.', fx: { key: 'defPct', params: { pct: 0.08 } } },
        { level: 5, name: 'One Shot, One Wyvern', desc: 'Ultimate damage +12%.', fx: { key: 'ultDmgPct', params: { pct: 0.12 } } },
        { level: 6, name: 'Hawkeye Forever', desc: 'ATK +10%.', fx: { key: 'atkPct', params: { pct: 0.10 } } },
      ],
    },
    {
      id: 'laurentius', name: 'Laurentius', title: 'Of the Great Swamp',
      element: 'Fire', path: 'Mage', rarity: 3,
      base: { hp: 820, atk: 142, def: 74, spd: 96 }, growth: { hp: 39, atk: 5.4, def: 2.6 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 100,
      art: { palette: ['#141008', '#4a3a1f', '#e2662c'], icon: '🫴', aura: 'ember' },
      lore: 'A swamp-taught pyromancer with mud on his boots and honesty in his flame. He owes a stranger his life and pays it forward in fire lessons.',
      basic: { name: 'Swamp Fireball', desc: 'Unrefined, unpretentious, unsurvivable.', target: 'singleEnemy', power: 1.0, hits: 1, toughnessDmg: 12, energyGain: 20, anim: { type: 'blast', color: C.FIRE } },
      skill: {
        name: 'Combustion Wave', desc: 'A close burst that rolls over all enemies and Burns them.',
        target: 'allEnemies', power: 0.7, hits: 1, toughnessDmg: 12, energyGain: 30, anim: { type: 'nova', color: C.FIRE },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.15), duration: 2 })); },
      },
      ult: {
        name: 'Great Fireball', desc: 'The swamp\'s masterpiece: one enormous sphere, one regret-free detonation, and a fresh Burn.',
        target: 'singleEnemy', power: 1.95, hits: 1, toughnessDmg: 24, energyCost: 100, anim: { type: 'blast', color: '#ff9d5c' },
        cutin: { title: 'GREAT FIREBALL', line: 'From the Great Swamp, with sincerity.' },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.20), duration: 2 })); },
      },
      talent: {
        name: 'Kindled Gratitude', desc: 'At the start of his turn, if any enemy is Burning, Laurentius gains 8 Energy.',
        on: 'turnStart',
        effect(ctx, unit) {
          const burning = ctx.foes(unit).some((f) => f.alive && (f.dots || []).some((d) => d.name === 'Burn'));
          if (burning) ctx.gainEnergy(unit, 8);
        },
      },
      technique: { name: 'Tinder Toss', desc: 'Before battle, Burn one random enemy.', effect(ctx, unit, party, enemies) { const t = enemies[Math.floor(Math.random() * enemies.length)]; if (t) ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(unit, 0.15), duration: 2 }); } },
      remembrance: [
        { level: 1, name: 'Swamp Manners', desc: 'Fire damage +8%.', fx: { key: 'dmgBoostElement', params: { element: 'Fire', pct: 0.08 } } },
        { level: 2, name: 'Honest Craft', desc: 'ATK +6%.', fx: { key: 'atkPct', params: { pct: 0.06 } } },
        { level: 3, name: 'Slow-Cooked', desc: 'Damage over time dealt +12%.', fx: { key: 'dotDmgPct', params: { pct: 0.12 } } },
        { level: 4, name: 'Debt Remembered', desc: 'Max HP +6%.', fx: { key: 'hpPct', params: { pct: 0.06 } } },
        { level: 5, name: 'Teacher\'s Pride', desc: 'Skill damage +12%.', fx: { key: 'skillDmgPct', params: { pct: 0.12 } } },
        { level: 6, name: 'Flame of the Swamp', desc: 'ATK +10%.', fx: { key: 'atkPct', params: { pct: 0.10 } } },
      ],
    },
    {
      id: 'petrus', name: 'Petrus of Thorolund', title: 'Way of White Emissary',
      element: 'Holy', path: 'Cleric', rarity: 3,
      base: { hp: 900, atk: 118, def: 92, spd: 92 }, growth: { hp: 44, atk: 4.5, def: 3.2 },
      critRate: 0.05, critDmg: 0.5, maxEnergy: 100,
      art: { palette: ['#14130e', '#4a4434', '#dcd3bd'], icon: '📿', aura: 'holy' },
      lore: 'A cleric with immaculate doctrine and negotiable loyalty. His miracles are real; count your companions anyway.',
      basic: { name: 'Mace of Office', desc: 'Blunt instrument, blunter sermon.', target: 'singleEnemy', power: 0.95, hits: 1, toughnessDmg: 12, energyGain: 20, anim: { type: 'blast', color: C.HOLY } },
      skill: {
        name: 'Heal', desc: 'A textbook miracle restoring 18% of an ally\'s Max HP.',
        target: 'singleAlly', power: 0, hits: 0, toughnessDmg: 0, energyGain: 30, anim: { type: 'buff', color: C.HOLY },
        extra(ctx, user, targets) { targets.forEach((t) => ctx.heal(t, hpOf(t, 0.18), user)); },
      },
      ult: {
        name: 'Rite of Thorolund', desc: 'The full liturgy: the party is healed 16% Max HP and cleansed of debuffs.',
        target: 'allAllies', power: 0, hits: 0, toughnessDmg: 0, energyCost: 100, anim: { type: 'nova', color: C.HOLY },
        cutin: { title: 'RITE OF THOROLUND', line: 'The Way provides. Mind the fine print.' },
        extra(ctx, user, targets) { targets.forEach((t) => { ctx.heal(t, hpOf(t, 0.16), user); ctx.cleanse(t); }); },
      },
      talent: { name: 'Shepherd\'s Arithmetic', desc: 'When an ally falls, Petrus gains 30 Energy. He counts quickly.', on: 'allyDown', effect(ctx, unit) { ctx.gainEnergy(unit, 30); } },
      technique: { name: 'Traveling Blessing', desc: 'Before battle, heal the party 8% Max HP.', effect(ctx, unit, party) { party.forEach((p) => ctx.heal(p, hpOf(p, 0.08), unit)); } },
      remembrance: [
        { level: 1, name: 'Polished Talisman', desc: 'Healing given +8%.', fx: { key: 'healBoost', params: { pct: 0.08 } } },
        { level: 2, name: 'Donations Welcome', desc: 'Max HP +6%.', fx: { key: 'hpPct', params: { pct: 0.06 } } },
        { level: 3, name: 'Doctrinal Armor', desc: 'DEF +8%.', fx: { key: 'defPct', params: { pct: 0.08 } } },
        { level: 4, name: 'Mission Funding', desc: 'Energy Regeneration +6%.', fx: { key: 'energyRegen', params: { pct: 0.06 } } },
        { level: 5, name: 'Senior Emissary', desc: 'Healing given +10%.', fx: { key: 'healBoost', params: { pct: 0.10 } } },
        { level: 6, name: 'The Way Provides', desc: 'Max HP +10%.', fx: { key: 'hpPct', params: { pct: 0.10 } } },
      ],
    },
  ];
})();
