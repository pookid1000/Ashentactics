// ASHEN TACTICS — enemy definitions (CONTRACT.md §4.6). Owner: data-world.
// All prose is original writing. Fan project; names only are borrowed.

window.DS = window.DS || {};

(function () {
  const PHYS = '#b8b3a4';
  const FIRE = '#e2662c';
  const FROST = '#7ec8e3';
  const LTN = '#e8c840';
  const MAG = '#7a86e8';
  const DARK = '#8b5fbf';
  const HOLY = '#e8dc9a';

  // Ability builder with sane defaults (final objects are plain data).
  function A(o) {
    return Object.assign({
      target: 'singleEnemy',
      power: 1.0,
      hits: 1,
      toughnessDmg: 0,
      energyGain: 15,
      anim: { type: 'slash', color: PHYS },
    }, o);
  }
  function M(weight, o) {
    return { ability: A(o), weight: weight };
  }
  function atkOf(user, mult) {
    const atk = (user && user.stats && user.stats.atk) ? user.stats.atk : 100;
    return Math.max(1, Math.round(atk * mult));
  }

  // Nito's Abyss Shriek: every 25% HP lost he puts down his own dead and lashes out.
  function abyssShriek(ctx, unit) {
    ctx.party(unit).filter(function (e) { return e.alive && e.defId === 'skeleton'; }).forEach(function (s) { ctx.execute(s); });
    ctx.foes(unit).forEach(function (t) {
      ctx.dealBonusTrueDamage(unit, t, atkOf(unit, 1.4));
      ctx.dot(t, { name: 'Plague', dmgPerTurn: atkOf(unit, 0.2), duration: 99 });
      ctx.addStatus(t, 'poison', { duration: 99 });
    });
    ctx.log('Nito shrieks, and the grave itself answers.');
  }

  DS.ENEMIES = [
    // ============================== FODDER ==============================
    {
      id: 'hollow_soldier',
      name: 'Hollow Soldier',
      title: 'Emptied Watchman',
      element: 'Physical',
      tier: 'fodder',
      base: { hp: 380, atk: 58, def: 34, spd: 92 },
      toughness: 70,
      weak: ['Fire', 'Holy'],
      art: { palette: ['#241f19', '#6b5f4a', '#b8b3a4'], icon: '🧟', aura: 'soul' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Rusted Slash',
            desc: 'A dull blade swung with the memory of drills long forgotten.',
            power: 1.0,
            energyGain: 15,
            anim: { type: 'slash', color: PHYS },
          }),
          M(2, {
            name: 'Shield Shove',
            desc: 'Slams its split shield forward, rattling the target\'s grip.',
            power: 0.7,
            energyGain: 20,
            anim: { type: 'blast', color: PHYS },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.debuff(t, { stat: 'atk', mult: -0.12, duration: 2, name: 'Rattled Grip' });
              });
            },
          }),
        ],
      },
    },
    {
      id: 'hollow_archer',
      name: 'Hollow Archer',
      title: 'Eyeless Bowman',
      element: 'Physical',
      tier: 'fodder',
      base: { hp: 320, atk: 64, def: 26, spd: 100 },
      toughness: 60,
      weak: ['Lightning', 'Frost'],
      art: { palette: ['#241f19', '#5c5342', '#c9bfa5'], icon: '🏹', aura: 'soul' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Loosed Shaft',
            desc: 'An arrow released by habit, not by sight — and no less deadly for it.',
            power: 1.05,
            anim: { type: 'pierce', color: PHYS },
          }),
          M(2, {
            name: 'Pinning Volley',
            desc: 'Empties its quiver skyward and lets the wind pick the graves.',
            target: 'randomEnemies',
            hits: 3,
            power: 0.45,
            energyGain: 20,
            anim: { type: 'volley', color: PHYS },
          }),
        ],
      },
    },
    {
      id: 'skeleton',
      name: 'Skeleton Warder',
      title: 'Rattling Sentence',
      element: 'Dark',
      tier: 'fodder',
      base: { hp: 350, atk: 60, def: 40, spd: 104 },
      toughness: 80,
      weak: ['Holy', 'Fire'],
      art: { palette: ['#17141a', '#4d4657', '#d8d3c4'], icon: '💀', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Curved Blade',
            desc: 'A bowed scimitar wheeled in wide, patient arcs.',
            power: 1.0,
            element: 'Dark',
            anim: { type: 'slash', color: DARK },
          }),
          M(2, {
            name: 'Grave Chill',
            desc: 'The cold of the tomb clings where its fingers pass.',
            power: 0.75,
            element: 'Dark',
            energyGain: 20,
            anim: { type: 'blast', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.5)) ctx.debuff(t, { stat: 'spd', mult: -0.15, duration: 2, name: 'Grave Chill' });
              });
            },
          }),
        ],
      },
    },
    {
      id: 'rat_swarm',
      name: 'Rat Swarm',
      title: 'Vermin Tide',
      element: 'Physical',
      tier: 'fodder',
      base: { hp: 420, atk: 55, def: 22, spd: 96 },
      toughness: 60,
      weak: ['Fire', 'Frost'],
      art: { palette: ['#1a1712', '#4a3f33', '#8c7a5e'], icon: '🐀', aura: 'soul' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(3, {
            name: 'Gnawing Flood',
            desc: 'The floor itself seems to move, and everything it touches bleeds.',
            target: 'splash',
            splash: 0.5,
            power: 0.7,
            energyGain: 20,
            anim: { type: 'nova', color: PHYS },
          }),
          M(3, {
            name: 'Filth Bite',
            desc: 'One bite among hundreds finds an ankle — and festers.',
            power: 0.9,
            anim: { type: 'pierce', color: PHYS },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.4)) {
                  ctx.addStatus(t, 'poison', { duration: 2 });
                  ctx.dot(t, { name: 'Poison', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
                }
              });
            },
          }),
        ],
      },
    },
    {
      id: 'painting_guardian',
      name: 'Painting Guardian',
      title: 'Silent Curator',
      element: 'Physical',
      tier: 'fodder',
      base: { hp: 440, atk: 66, def: 38, spd: 110 },
      toughness: 90,
      weak: ['Magic', 'Dark'],
      art: { palette: ['#1c1c22', '#5a5e6e', '#e8e4da'], icon: '🗡', aura: 'frost' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Twin Shivs',
            desc: 'Two short blades, one breath, no sound at all.',
            hits: 2,
            power: 0.55,
            anim: { type: 'slash', color: FROST },
          }),
          M(2, {
            name: 'Veiled Step',
            desc: 'Slips behind its own shadow, daring the eye to follow.',
            target: 'self',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: FROST },
            extra(ctx, user) {
              ctx.addStatus(user, 'evasionUp', { duration: 2 });
              ctx.buff(user, { stat: 'spd', mult: 0.15, duration: 2, name: 'Veiled Step' });
            },
          }),
        ],
      },
    },

    // ============================== ELITES ==============================
    {
      id: 'balder_knight',
      name: 'Balder Knight',
      title: 'Errant of a Lost Land',
      element: 'Physical',
      tier: 'elite',
      base: { hp: 820, atk: 82, def: 62, spd: 98 },
      toughness: 130,
      weak: ['Lightning', 'Fire'],
      art: { palette: ['#21201d', '#6e6a5f', '#cfc7b0'], icon: '⚔', aura: 'soul' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Side Sword Flurry',
            desc: 'Court fencing, practiced past death and into perfection.',
            hits: 2,
            power: 0.6,
            anim: { type: 'slash', color: PHYS },
          }),
          M(3, {
            name: 'Rapier Lunge',
            desc: 'A single thread of steel aimed where armor forgets to be.',
            power: 1.3,
            defPierce: 0.2,
            energyGain: 20,
            anim: { type: 'pierce', color: PHYS },
          }),
          M(2, {
            name: 'Heater Guard',
            desc: 'Sets its small shield and remembers what discipline was.',
            target: 'self',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: PHYS },
            extra(ctx, user) {
              ctx.buff(user, { stat: 'def', mult: 0.3, duration: 2, name: 'Heater Guard' });
            },
          }),
        ],
      },
      ult: A({
        name: 'Duelist\'s Answer',
        desc: 'A salute, a step, and a thrust that ends the conversation.',
        power: 2.0,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'pierce', color: PHYS },
        extra(ctx, user) {
          ctx.addStatus(user, 'counterStance', { duration: 2 });
        },
      }),
    },
    {
      id: 'silver_knight',
      name: 'Silver Knight',
      title: 'Watcher of the Gilded Halls',
      element: 'Lightning',
      tier: 'elite',
      base: { hp: 900, atk: 88, def: 68, spd: 100 },
      toughness: 150,
      weak: ['Dark', 'Magic'],
      art: { palette: ['#1b1f2a', '#5f6b85', '#dfe4ee'], icon: '🛡', aura: 'storm' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Storm Spear Thrust',
            desc: 'A spear that still carries a splinter of its lord\'s first sky.',
            power: 1.2,
            anim: { type: 'pierce', color: LTN },
          }),
          M(3, {
            name: 'Sweeping Halberd',
            desc: 'One long arc to remind trespassers the hall was built for giants.',
            target: 'splash',
            splash: 0.5,
            power: 0.9,
            energyGain: 20,
            anim: { type: 'slash', color: LTN },
          }),
          M(2, {
            name: 'Greatbow Loose',
            desc: 'A dragonslaying shaft loosed flat and screaming.',
            power: 1.45,
            energyGain: 20,
            anim: { type: 'pierce', color: LTN },
          }),
        ],
      },
      ult: A({
        name: 'Storm of the Silver Order',
        desc: 'The watch answers as one, and the ceiling forgets it is indoors.',
        target: 'allEnemies',
        power: 1.0,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'nova', color: LTN },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            if (DS.RNG.chance(0.35)) {
              ctx.addStatus(t, 'shock', { duration: 2 });
              ctx.dot(t, { name: 'Shock', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
            }
          });
        },
      }),
    },
    {
      id: 'channeler',
      name: 'Channeler',
      title: 'Six-Eyed Herald of the Wyrm',
      element: 'Magic',
      tier: 'elite',
      base: { hp: 760, atk: 92, def: 50, spd: 108 },
      toughness: 120,
      weak: ['Physical', 'Holy'],
      art: { palette: ['#141425', '#3d3d78', '#8a8ae8'], icon: '🔱', aura: 'soul' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Soul Dart Fan',
            desc: 'Splinters of pale thought, flung wide and hungry.',
            target: 'randomEnemies',
            hits: 3,
            power: 0.5,
            anim: { type: 'volley', color: MAG },
          }),
          M(3, {
            name: 'Trident Dance',
            desc: 'A jig for its masters — obscene, and worse, effective.',
            target: 'allAllies',
            power: 0,
            energyGain: 25,
            anim: { type: 'ritual', color: MAG },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.buff(t, { stat: 'atk', mult: 0.2, duration: 2, name: 'Channeled Fervor' });
              });
            },
          }),
          M(2, {
            name: 'Piercing Gaze',
            desc: 'Six eyes agree on a single seam in your defense.',
            power: 1.2,
            defPierce: 0.15,
            anim: { type: 'beam', color: MAG },
          }),
        ],
      },
      ult: A({
        name: 'Chorus of Stolen Souls',
        desc: 'Every soul it has ferried cries out at once.',
        target: 'allEnemies',
        power: 0.9,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'nova', color: MAG },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            if (DS.RNG.chance(0.3)) ctx.addStatus(t, 'hex', { duration: 2 });
          });
        },
      }),
    },
    {
      id: 'darkwraith',
      name: 'Darkwraith',
      title: 'Reaper of the Drowned City',
      element: 'Dark',
      tier: 'elite',
      base: { hp: 950, atk: 96, def: 60, spd: 102 },
      toughness: 150,
      weak: ['Holy', 'Fire'],
      art: { palette: ['#100d16', '#3a2d4d', '#8b5fbf'], icon: '🜏', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Dark Hand',
            desc: 'An open palm that takes more than blood.',
            power: 1.1,
            anim: { type: 'blast', color: DARK },
            extra(ctx, user, targets, allies, dmgDealt) {
              if (dmgDealt > 0) ctx.heal(user, Math.round(dmgDealt * 0.4));
            },
          }),
          M(3, {
            name: 'Sword Dance of New Londo',
            desc: 'Three cuts taught by drowning men.',
            hits: 3,
            power: 0.45,
            energyGain: 20,
            anim: { type: 'slash', color: DARK },
          }),
        ],
      },
      ult: A({
        name: 'Humanity Wrest',
        desc: 'It squeezes, and something dearer than life comes loose.',
        power: 1.8,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'ritual', color: DARK },
        extra(ctx, user, targets, allies, dmgDealt) {
          targets.forEach(function (t) {
            ctx.drainEnergy(t, 20);
          });
          if (dmgDealt > 0) ctx.heal(user, Math.round(dmgDealt * 0.5));
        },
      }),
    },
    {
      id: 'crystal_golem',
      name: 'Crystal Golem',
      title: 'Hollow Lattice',
      element: 'Magic',
      tier: 'elite',
      base: { hp: 1150, atk: 84, def: 82, spd: 84 },
      toughness: 180,
      weak: ['Physical', 'Fire'],
      art: { palette: ['#0f1b24', '#2f5d78', '#9fdcf0'], icon: '💠', aura: 'frost' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Crystal Fist',
            desc: 'A fist of facets, each edge a small regret.',
            power: 1.2,
            anim: { type: 'blast', color: MAG },
          }),
          M(3, {
            name: 'Shard Burst',
            desc: 'It sheds a layer of itself, all at once, in every direction that matters.',
            target: 'splash',
            splash: 0.5,
            power: 0.8,
            energyGain: 20,
            anim: { type: 'nova', color: MAG },
          }),
          M(2, {
            name: 'Refract',
            desc: 'Light bends around the lattice; so do blades.',
            target: 'self',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: MAG },
            extra(ctx, user) {
              ctx.buff(user, { stat: 'def', mult: 0.35, duration: 2, name: 'Refraction' });
            },
          }),
        ],
      },
      ult: A({
        name: 'Resonant Collapse',
        desc: 'The lattice sings one clear note, and the note is a landslide.',
        target: 'allEnemies',
        power: 1.1,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'nova', color: MAG },
      }),
    },
    {
      id: 'royal_sentinel',
      name: 'Royal Sentinel',
      title: 'Bulwark of the Forsaken Court',
      element: 'Holy',
      tier: 'elite',
      base: { hp: 1250, atk: 80, def: 88, spd: 82 },
      toughness: 180,
      weak: ['Dark', 'Lightning'],
      art: { palette: ['#26221a', '#8a7a52', '#f0e3b0'], icon: '🛡', aura: 'holy' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Halberd Arc',
            desc: 'A giant\'s polearm describing a lazy, lethal circle.',
            target: 'splash',
            splash: 0.5,
            power: 1.0,
            anim: { type: 'slash', color: HOLY },
          }),
          M(2, {
            name: 'Ward of the Court',
            desc: 'It plants its shield, and the old oath holds for everyone behind it.',
            target: 'allAllies',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: HOLY },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.shield(t, atkOf(user, 1.5));
              });
            },
          }),
          M(3, {
            name: 'Judging Blow',
            desc: 'It weighs you, finds you wanting, and swings.',
            power: 1.3,
            energyGain: 20,
            anim: { type: 'blast', color: HOLY },
          }),
        ],
      },
      ult: A({
        name: 'Oath Unbroken',
        desc: 'The court is dust, the throne is empty — the sentinel stands regardless.',
        target: 'self',
        power: 0,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'ritual', color: HOLY },
        extra(ctx, user) {
          ctx.taunt(user, 2);
          ctx.shield(user, atkOf(user, 3));
          ctx.buff(user, { stat: 'def', mult: 0.4, duration: 2, name: 'Oath Unbroken' });
        },
      }),
    },
    {
      id: 'necromancer',
      name: 'Necromancer',
      title: 'Lantern of the Catacombs',
      element: 'Dark',
      tier: 'elite',
      base: { hp: 700, atk: 86, def: 48, spd: 94 },
      toughness: 120,
      weak: ['Holy', 'Fire'],
      art: { palette: ['#15111c', '#463a5c', '#a68bd6'], icon: '🕯', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Grave Flame',
            desc: 'A candleflame the color of a closed eye.',
            power: 1.0,
            anim: { type: 'blast', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.35)) ctx.addStatus(t, 'curse', { duration: 2 });
              });
            },
          }),
          M(2, {
            name: 'Marrow Mend',
            desc: 'It stitches its servants together with borrowed years.',
            target: 'allyLowestHp',
            power: 0,
            energyGain: 25,
            anim: { type: 'ritual', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.heal(t, Math.round(((t.stats && t.stats.hp) || 500) * 0.25));
              });
            },
          }),
          M(3, {
            name: 'Deadman\'s Toll',
            desc: 'It rings a bell only the buried can hear, and they answer angrily.',
            target: 'randomEnemies',
            hits: 2,
            power: 0.6,
            anim: { type: 'volley', color: DARK },
          }),
        ],
      },
      ult: A({
        name: 'Rise, Rattling Kin',
        desc: 'The lantern swings, and the dark fills with grinning bone.',
        target: 'allAllies',
        power: 0,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'ritual', color: DARK },
        extra(ctx, user, targets) {
          if (ctx.summonReinforcement) ctx.summonReinforcement(user, { id: 'skeleton', level: user.level });
          targets.forEach(function (t) {
            ctx.buff(t, { stat: 'atk', mult: 0.25, duration: 2, name: 'Deathly Vigor' });
          });
        },
      }),
    },

    // ============================== WORLD BOSSES ==============================
    {
      id: 'asylum_demon',
      name: 'Asylum Demon',
      title: 'Warden of the Forlorn',
      element: 'Physical',
      tier: 'boss',
      base: { hp: 2800, atk: 100, def: 60, spd: 88 },
      toughness: 240,
      weak: ['Fire', 'Holy'],
      art: { palette: ['#1c1712', '#584838', '#a08868'], icon: '👹', aura: 'soul' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Hammer Drive',
            desc: 'A stone maul dropped like a verdict.',
            power: 1.2,
            anim: { type: 'blast', color: PHYS },
          }),
          M(3, {
            name: 'Haunch Slam',
            desc: 'The whole vast bulk arrives at once, uninvited.',
            target: 'splash',
            splash: 0.6,
            power: 0.9,
            energyGain: 20,
            anim: { type: 'blast', color: PHYS },
          }),
          M(2, {
            name: 'Wing Gust',
            desc: 'Rotten wings beat once; the courtyard rearranges itself.',
            target: 'allEnemies',
            power: 0.6,
            energyGain: 20,
            anim: { type: 'nova', color: PHYS },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.25)) ctx.debuff(t, { stat: 'spd', mult: -0.15, duration: 2, name: 'Buffeted' });
              });
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Plunging Bulk',
            desc: 'It has remembered that falling is a weapon.',
            target: 'allEnemies',
            power: 1.0,
            energyGain: 20,
            anim: { type: 'nova', color: PHYS },
          }),
          M(3, {
            name: 'Hammer Cyclone',
            desc: 'The maul spins until the wind itself bruises.',
            hits: 2,
            power: 0.8,
            anim: { type: 'slash', color: PHYS },
          }),
          M(2, {
            name: 'Wing Gust',
            desc: 'Rotten wings beat once; the courtyard rearranges itself.',
            target: 'allEnemies',
            power: 0.6,
            energyGain: 20,
            anim: { type: 'nova', color: PHYS },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.5,
          name: 'Wings of the Warden',
          banner: 'The warden remembers how to fly, and the cell grows very small.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.25, duration: 99, name: 'Warden\'s Fury' });
            ctx.actionAdvance(unit, 0.3);
            ctx.log('The Asylum Demon heaves itself skyward on ragged wings.');
          },
        },
      ],
      ult: A({
        name: 'Cellbreaker',
        desc: 'The asylum keeps what it is given.',
        target: 'allEnemies',
        power: 1.4,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'nova', color: PHYS },
        cutin: { title: 'Cellbreaker', line: 'This asylum keeps what it is given.' },
      }),
    },
    {
      id: 'taurus_demon',
      name: 'Taurus Demon',
      title: 'Bull of the Broken Wall',
      element: 'Physical',
      tier: 'boss',
      base: { hp: 3000, atk: 112, def: 64, spd: 92 },
      toughness: 260,
      weak: ['Magic', 'Frost'],
      art: { palette: ['#191410', '#4f3d2c', '#9c7b52'], icon: '🐂', aura: 'ember' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Greataxe Cleave',
            desc: 'An axe the length of a drawbridge, swung like a switch.',
            power: 1.25,
            anim: { type: 'slash', color: PHYS },
          }),
          M(3, {
            name: 'Rampart Charge',
            desc: 'It runs through battlements the way rumor runs through a town.',
            power: 1.1,
            defPierce: 0.2,
            energyGain: 20,
            anim: { type: 'pierce', color: PHYS },
          }),
          M(2, {
            name: 'Bellow',
            desc: 'A roar that loosens mortar and nerve alike.',
            target: 'allEnemies',
            power: 0.4,
            energyGain: 25,
            anim: { type: 'nova', color: PHYS },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.debuff(t, { stat: 'atk', mult: -0.12, duration: 2, name: 'Shaken' });
              });
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Wallbreaker Swing',
            desc: 'The wall was in the way. The wall is no longer a factor.',
            target: 'splash',
            splash: 0.6,
            power: 1.15,
            anim: { type: 'blast', color: PHYS },
          }),
          M(3, {
            name: 'Greataxe Cleave',
            desc: 'An axe the length of a drawbridge, swung like a switch.',
            power: 1.25,
            anim: { type: 'slash', color: PHYS },
          }),
          M(2, {
            name: 'Trampling Fit',
            desc: 'It forgets weapons entirely and simply insists with its heels.',
            target: 'randomEnemies',
            hits: 3,
            power: 0.55,
            energyGain: 20,
            anim: { type: 'volley', color: PHYS },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.5,
          name: 'Cornered Fury',
          banner: 'A bull on a bridge has nowhere to go but through you.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.3, duration: 99, name: 'Cornered Fury' });
            ctx.log('The Taurus Demon paws the stones and lowers its horns.');
          },
        },
      ],
      ult: A({
        name: 'Wallbreaker Leap',
        desc: 'It goes up. Everything else goes down.',
        target: 'allEnemies',
        power: 1.3,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'nova', color: PHYS },
        cutin: { title: 'Wallbreaker Leap', line: 'The wall breaks before the bull does.' },
      }),
    },
    {
      id: 'capra_demon_hound',
      name: 'Capra Demon\'s Hound',
      title: 'Blade-Trained Cur',
      element: 'Physical',
      tier: 'fodder',
      base: { hp: 300, atk: 62, def: 24, spd: 118 },
      toughness: 60,
      weak: ['Fire', 'Magic'],
      art: { palette: ['#161310', '#463d30', '#8f7a5e'], icon: '🐕', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Snapping Bite',
            desc: 'It was starved for this narrow stair long before you arrived.',
            power: 0.9,
            anim: { type: 'pierce', color: PHYS },
          }),
          M(2, {
            name: 'Pack Snarl',
            desc: 'Its yellow teeth promise the next lunge will be worse.',
            power: 0.6,
            energyGain: 20,
            anim: { type: 'slash', color: PHYS },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.3)) ctx.debuff(t, { stat: 'def', mult: -0.1, duration: 2, name: 'Hound\'s Snarl' });
              });
            },
          }),
        ],
      },
    },
    {
      id: 'capra_demon',
      name: 'Capra Demon',
      title: 'Butcher of the Narrow Stair',
      element: 'Physical',
      tier: 'boss',
      base: { hp: 2900, atk: 118, def: 58, spd: 106 },
      toughness: 240,
      weak: ['Fire', 'Magic'],
      art: { palette: ['#14120f', '#403a30', '#8f8574'], icon: '🐐', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Twin Machete Cross',
            desc: 'Two cleavers scissoring shut like a door you should not have opened.',
            hits: 2,
            power: 0.65,
            anim: { type: 'slash', color: PHYS },
          }),
          M(3, {
            name: 'Stairway Ambush',
            desc: 'It was above you the whole time. It usually is.',
            power: 1.5,
            bonusVsBroken: 0.5,
            energyGain: 20,
            anim: { type: 'pierce', color: PHYS },
          }),
          M(2, {
            name: 'Goat-Skull Rush',
            desc: 'A headlong butt that treats shields as suggestions.',
            target: 'splash',
            splash: 0.5,
            power: 0.9,
            anim: { type: 'blast', color: PHYS },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Frenzied Cleaving',
            desc: 'No technique now. Only arithmetic — two blades, many swings.',
            hits: 3,
            power: 0.55,
            anim: { type: 'slash', color: PHYS },
          }),
          M(3, {
            name: 'Stairway Ambush',
            desc: 'It was above you the whole time. It usually is.',
            power: 1.5,
            bonusVsBroken: 0.5,
            energyGain: 20,
            anim: { type: 'pierce', color: PHYS },
          }),
          M(2, {
            name: 'Goat-Skull Rush',
            desc: 'A headlong butt that treats shields as suggestions.',
            target: 'splash',
            splash: 0.5,
            power: 0.9,
            anim: { type: 'blast', color: PHYS },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.45,
          name: 'No Room to Breathe',
          banner: 'The stairwell narrows. The blades do not.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'spd', mult: 0.2, duration: 99, name: 'Butcher\'s Pace' });
            ctx.actionAdvance(unit, 0.5);
            ctx.log('The Capra Demon vaults the railing, blades first.');
          },
        },
      ],
      ult: A({
        name: 'Slaughter in the Stairwell',
        desc: 'In a space this small, every swing hits someone.',
        target: 'randomEnemies',
        hits: 4,
        power: 0.6,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'volley', color: PHYS },
        cutin: { title: 'Slaughter in the Stairwell', line: 'No room to run. Good.' },
      }),
    },
    {
      id: 'bell_gargoyle',
      name: 'Bell Gargoyle',
      title: 'Bronze-Perched Twin',
      element: 'Fire',
      tier: 'boss',
      base: { hp: 3200, atk: 108, def: 70, spd: 100 },
      toughness: 280,
      weak: ['Lightning', 'Frost'],
      art: { palette: ['#1a1c1a', '#4a5548', '#9aa88f'], icon: '🦇', aura: 'ember' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Halberd Swoop',
            desc: 'It dives with the patience of a thing that has guarded one bell for an age.',
            power: 1.1,
            anim: { type: 'slash', color: PHYS },
          }),
          M(3, {
            name: 'Tail Axe',
            desc: 'The tail ends in a blade. Everything about it is a weapon, or a lie.',
            target: 'splash',
            splash: 0.5,
            power: 0.85,
            energyGain: 20,
            anim: { type: 'slash', color: PHYS },
          }),
          M(2, {
            name: 'Stone Wings',
            desc: 'It folds into itself, a statue again — briefly, conveniently.',
            target: 'self',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: PHYS },
            extra(ctx, user) {
              ctx.buff(user, { stat: 'def', mult: 0.3, duration: 2, name: 'Stone Wings' });
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Fire Breath',
            desc: 'The rooftop becomes a chimney, and you are the soot.',
            target: 'allEnemies',
            power: 0.9,
            energyGain: 20,
            anim: { type: 'beam', color: FIRE },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.4)) {
                  ctx.addStatus(t, 'burn', { duration: 2 });
                  ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
                }
              });
            },
          }),
          M(3, {
            name: 'Halberd Swoop',
            desc: 'It dives with the patience of a thing that has guarded one bell for an age.',
            power: 1.1,
            anim: { type: 'slash', color: PHYS },
          }),
          M(2, {
            name: 'Diving Talon',
            desc: 'Claws close around a shoulder and remember the height of the tower.',
            power: 1.4,
            energyGain: 20,
            anim: { type: 'pierce', color: FIRE },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.5,
          name: 'The Bell Tolls Twice',
          banner: 'Half its tail is gone; in exchange, it has decided to burn everything — and call its twin.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.25, duration: 99, name: 'Kindled Wrath' });
            ctx.log('The gargoyle\'s throat glows like a forge door.');
            // Only the original ever calls its twin — a summoned reinforcement is flagged
            // below so its own half-health crossing can never chain into a third, fourth, etc.
            if (!unit.isReinforcement) {
              const nu = ctx.summonReinforcement(unit, { id: 'bell_gargoyle', level: unit.level, statMult: 0.5 });
              if (nu) {
                nu.isReinforcement = true;
                ctx.log('A second shape drops from the rafters, wings still folded.');
              }
            }
          },
        },
      ],
      ult: A({
        name: 'Twin Descent',
        desc: 'Where one perches, another waits. They dive together.',
        target: 'allEnemies',
        power: 1.2,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'nova', color: FIRE },
        cutin: { title: 'Twin Descent', line: 'The bell tolls for the climbers.' },
      }),
    },
    {
      id: 'gaping_dragon',
      name: 'Gaping Dragon',
      title: 'Hunger Given Wings',
      element: 'Physical',
      tier: 'boss',
      // It senses weakness and feeds — heals off any foe running low, on top
      // of its half-HP phase transition.
      onTurnStart(ctx, unit) {
        const weakFoe = ctx.foes(unit).some(function (f) { return f.alive && f.hp / f.stats.hp < 0.5; });
        if (weakFoe) {
          ctx.heal(unit, Math.round(unit.stats.hp * 0.04));
          ctx.log('The Gaping Dragon feeds on the faltering, and grows fuller for it.');
        }
      },
      base: { hp: 4200, atk: 105, def: 66, spd: 80 },
      toughness: 320,
      weak: ['Lightning', 'Holy'],
      art: { palette: ['#121710', '#3c4d33', '#7e9b64'], icon: '🐉', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Grinding Maw',
            desc: 'A ribcage of teeth closes; what it keeps, it keeps.',
            power: 1.3,
            anim: { type: 'blast', color: PHYS },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.35)) {
                  ctx.addStatus(t, 'bleed', { duration: 2 });
                  ctx.dot(t, { name: 'Bleed', dmgPerTurn: atkOf(user, 0.35), duration: 2 });
                }
              });
            },
          }),
          M(3, {
            name: 'Tail Sweep',
            desc: 'The far end of it arrives late and angry.',
            target: 'allEnemies',
            power: 0.7,
            energyGain: 20,
            anim: { type: 'slash', color: PHYS },
          }),
          M(2, {
            name: 'Corrosive Sluice',
            desc: 'What it cannot eat, it dissolves for later.',
            target: 'allEnemies',
            power: 0.5,
            energyGain: 20,
            anim: { type: 'nova', color: '#7e9b64' },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.debuff(t, { stat: 'def', mult: -0.2, duration: 2, name: 'Corroded' });
              });
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Devouring Charge',
            desc: 'It becomes a mouth with momentum.',
            power: 1.8,
            energyGain: 20,
            anim: { type: 'pierce', color: PHYS },
          }),
          M(3, {
            name: 'Grinding Maw',
            desc: 'A ribcage of teeth closes; what it keeps, it keeps.',
            power: 1.3,
            anim: { type: 'blast', color: PHYS },
          }),
          M(2, {
            name: 'Tail Sweep',
            desc: 'The far end of it arrives late and angry.',
            target: 'allEnemies',
            power: 0.7,
            energyGain: 20,
            anim: { type: 'slash', color: PHYS },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.5,
          name: 'The Stomach Opens',
          banner: 'Armor, ember, bone — all of it, into the endless gullet.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.3, duration: 99, name: 'Bottomless Hunger' });
            ctx.log('The dragon\'s torso unhinges into a second, vaster mouth.');
          },
        },
      ],
      ult: A({
        name: 'Gluttonous Cascade',
        desc: 'It vomits the channel itself across the field.',
        target: 'allEnemies',
        power: 1.1,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'nova', color: '#7e9b64' },
        cutin: { title: 'Gluttonous Cascade', line: 'Everything, eventually, is food.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            if (DS.RNG.chance(0.4)) {
              ctx.addStatus(t, 'poison', { duration: 2 });
              ctx.dot(t, { name: 'Poison', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
            }
          });
        },
      }),
    },
    {
      id: 'ceaseless_discharge',
      name: 'Ceaseless Discharge',
      title: 'Grief That Burns',
      element: 'Fire',
      tier: 'boss',
      // Grief boiling hotter the longer it burns — a small permanent ATK
      // stack every one of its own turns, capped at 10 so it plateaus
      // (+30% ATK) rather than growing forever.
      onTurnStart(ctx, unit) {
        unit._griefStacks = unit._griefStacks || 0;
        if (unit._griefStacks < 10) {
          unit._griefStacks++;
          ctx.buff(unit, { stat: 'atk', mult: 0.03, duration: 99, name: 'Boiling Grief', quiet: unit._griefStacks > 1 });
        }
      },
      base: { hp: 4000, atk: 120, def: 62, spd: 86 },
      toughness: 300,
      weak: ['Frost', 'Magic'],
      art: { palette: ['#1c0e08', '#6e2c12', '#f07830'], icon: '🌋', aura: 'ember' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Magma Lash',
            desc: 'An arm like a river deciding to be a whip.',
            power: 1.2,
            anim: { type: 'slash', color: FIRE },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.4)) {
                  ctx.addStatus(t, 'burn', { duration: 2 });
                  ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.35), duration: 2 });
                }
              });
            },
          }),
          M(3, {
            name: 'Cinder Rain',
            desc: 'The sky forgets water was ever an option.',
            target: 'allEnemies',
            power: 0.6,
            energyGain: 20,
            anim: { type: 'volley', color: FIRE },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.25)) {
                  ctx.addStatus(t, 'burn', { duration: 2 });
                  ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.25), duration: 2 });
                }
              });
            },
          }),
          M(2, {
            name: 'Grieving Wail',
            desc: 'It mourns loudly enough to crack stone.',
            target: 'self',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: FIRE },
            extra(ctx, user) {
              ctx.buff(user, { stat: 'atk', mult: 0.2, duration: 2, name: 'Boiling Grief' });
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Tide of Magma',
            desc: 'The floor takes its side.',
            target: 'allEnemies',
            power: 0.95,
            energyGain: 20,
            anim: { type: 'nova', color: FIRE },
          }),
          M(3, {
            name: 'Magma Lash',
            desc: 'An arm like a river deciding to be a whip.',
            power: 1.2,
            anim: { type: 'slash', color: FIRE },
          }),
          M(2, {
            name: 'Molten Fist',
            desc: 'It reaches across the gorge and closes its hand.',
            power: 1.6,
            energyGain: 20,
            anim: { type: 'blast', color: FIRE },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.4,
          name: 'Grief Boils Over',
          banner: 'It stops weeping. That is worse.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.3, duration: 99, name: 'Grief Unbound' });
            ctx.foes(unit).forEach(function (t) {
              ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(unit, 0.2), duration: 2 });
            });
            ctx.log('Magma climbs the gorge walls as the last son of the Witch rises.');
          },
        },
      ],
      ult: A({
        name: 'The Wound That Weeps Fire',
        desc: 'Every sorrow it ever swallowed comes back up at once.',
        target: 'allEnemies',
        power: 1.3,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'nova', color: FIRE },
        cutin: { title: 'The Wound That Weeps Fire', line: 'Grief burns longer than any flame.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            if (DS.RNG.chance(0.5)) {
              ctx.addStatus(t, 'burn', { duration: 2 });
              ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.35), duration: 2 });
            }
          });
        },
      }),
    },
    {
      id: 'kalameet',
      name: 'Black Dragon Kalameet',
      title: 'Calamity on the Wind',
      element: 'Dark',
      tier: 'boss',
      // Misfortune finds you on a schedule, not just by chance — every 3rd
      // turn, an extra vulnerability curse lands outside its normal moveset.
      onTurnStart(ctx, unit) {
        unit._calamityTicks = (unit._calamityTicks || 0) + 1;
        if (unit._calamityTicks % 3 === 0) {
          const alive = ctx.foes(unit).filter(function (f) { return f.alive; });
          if (alive.length) {
            const t = DS.RNG.pick(alive);
            ctx.addStatus(t, 'vulnerability', { duration: 2 });
            ctx.log('Misfortune finds ' + t.name + ', unasked.');
          }
        }
      },
      base: { hp: 5200, atk: 132, def: 78, spd: 112 },
      toughness: 360,
      weak: ['Holy', 'Frost'],
      art: { palette: ['#0b0b10', '#26262e', '#c23a2a'], icon: '🐲', aura: 'void' },
      maxEnergy: 120,
      movesets: {
        default: [
          M(4, {
            name: 'Hellfire Strafe',
            desc: 'A low pass, a black exhalation, and a valley redrawn.',
            target: 'allEnemies',
            power: 0.8,
            energyGain: 20,
            anim: { type: 'beam', color: DARK },
          }),
          M(3, {
            name: 'Mark of Calamity',
            desc: 'One eye opens, and misfortune learns your name.',
            power: 0.6,
            anim: { type: 'beam', color: '#c23a2a' },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.addStatus(t, 'vulnerability', { duration: 3 });
              });
            },
          }),
          M(3, {
            name: 'Tail Lash',
            desc: 'The whole sky snaps like a whip.',
            target: 'splash',
            splash: 0.5,
            power: 1.0,
            anim: { type: 'slash', color: PHYS },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Onyx Breath',
            desc: 'Fire so dark it casts shadows on the night.',
            target: 'allEnemies',
            power: 1.0,
            energyGain: 20,
            anim: { type: 'beam', color: DARK },
          }),
          M(3, {
            name: 'Seizing Talons',
            desc: 'It carries one of you up to explain the view.',
            power: 1.7,
            energyGain: 20,
            anim: { type: 'pierce', color: PHYS },
          }),
          M(2, {
            name: 'Mark of Calamity',
            desc: 'One eye opens, and misfortune learns your name.',
            power: 0.6,
            anim: { type: 'beam', color: '#c23a2a' },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.addStatus(t, 'vulnerability', { duration: 3 });
              });
            },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.5,
          name: 'The Eye Opens',
          banner: 'One eye opens, and misfortune finds every seam in every shield.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.25, duration: 99, name: 'Calamity\'s Gaze' });
            ctx.foes(unit).forEach(function (t) {
              if (DS.RNG.chance(0.5)) ctx.addStatus(t, 'vulnerability', { duration: 2 });
            });
            ctx.log('Kalameet banks against the moon, hateful eye burning red.');
          },
        },
      ],
      ult: A({
        name: 'Calamity Unbound',
        desc: 'It does not need to aim. Misfortune aims for it.',
        target: 'allEnemies',
        power: 1.25,
        energyCost: 120,
        energyGain: 0,
        anim: { type: 'nova', color: DARK },
        cutin: { title: 'Calamity Unbound', line: 'Misfortune has found you.' },
      }),
    },
    {
      id: 'bed_of_chaos_left_arm',
      name: 'Bed of Chaos — Left Arm',
      title: 'Splintered Guardian',
      element: 'Fire',
      tier: 'elite',
      base: { hp: 1400, atk: 90, def: 60, spd: 70 },
      toughness: 150,
      weak: ['Frost', 'Magic', 'Holy', 'Physical'],
      art: { palette: ['#170d05', '#5c3a14', '#e8922c'], icon: '🌿', aura: 'ember' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Grasping Bough',
            desc: 'One arm of the tree, still convinced it can hold something back.',
            power: 1.0,
            anim: { type: 'slash', color: '#5c3a14' },
          }),
          M(2, {
            name: 'Root Lash',
            desc: 'A whip of burning bark, cracked low across the ankles.',
            target: 'splash',
            splash: 0.4,
            power: 0.7,
            anim: { type: 'slash', color: FIRE },
          }),
        ],
      },
    },
    {
      id: 'bed_of_chaos_right_arm',
      name: 'Bed of Chaos — Right Arm',
      title: 'Splintered Guardian',
      element: 'Fire',
      tier: 'elite',
      base: { hp: 1400, atk: 90, def: 60, spd: 72 },
      toughness: 150,
      weak: ['Frost', 'Magic', 'Holy', 'Physical'],
      art: { palette: ['#170d05', '#5c3a14', '#e8922c'], icon: '🌿', aura: 'ember' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Grasping Bough',
            desc: 'One arm of the tree, still convinced it can hold something back.',
            power: 1.0,
            anim: { type: 'slash', color: '#5c3a14' },
          }),
          M(2, {
            name: 'Cinder Shower',
            desc: 'It shakes, and the air fills with something that used to be leaves.',
            target: 'allEnemies',
            power: 0.5,
            anim: { type: 'nova', color: FIRE },
          }),
        ],
      },
    },
    {
      id: 'bed_of_chaos',
      name: 'Bed of Chaos',
      title: 'Root of All Flame',
      element: 'Fire',
      tier: 'boss',
      // Gimmick: towering DEF, but a shallow toughness bar and many weaknesses —
      // break it to strip its guard, and its phases splinter the armor further.
      // The core is warded until both flanking arms are destroyed.
      base: { hp: 5000, atk: 115, def: 160, spd: 78 },
      toughness: 200,
      weak: ['Frost', 'Magic', 'Holy', 'Physical'],
      invulnerableWhileAlive: ['bed_of_chaos_left_arm', 'bed_of_chaos_right_arm'],
      art: { palette: ['#170d05', '#5c3a14', '#e8922c'], icon: '🌳', aura: 'ember' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Clawing Boughs',
            desc: 'Branches that remember being fingers.',
            target: 'splash',
            splash: 0.5,
            power: 0.8,
            anim: { type: 'slash', color: '#5c3a14' },
          }),
          M(3, {
            name: 'Sweep of the Garden',
            desc: 'A slow arm clears the floor the way a gardener clears leaves.',
            target: 'allEnemies',
            power: 0.6,
            energyGain: 20,
            anim: { type: 'nova', color: FIRE },
          }),
          M(3, {
            name: 'Chaos Bloom',
            desc: 'A flower opens. It is made of fire and it is looking at you.',
            power: 1.2,
            anim: { type: 'blast', color: FIRE },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.35)) {
                  ctx.addStatus(t, 'burn', { duration: 2 });
                  ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
                }
              });
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Firestorm Seed',
            desc: 'It sows. The harvest is immediate.',
            target: 'allEnemies',
            power: 0.8,
            energyGain: 20,
            anim: { type: 'volley', color: FIRE },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.3)) {
                  ctx.addStatus(t, 'burn', { duration: 2 });
                  ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.25), duration: 2 });
                }
              });
            },
          }),
          M(3, {
            name: 'Clawing Boughs',
            desc: 'Branches that remember being fingers.',
            target: 'splash',
            splash: 0.5,
            power: 0.8,
            anim: { type: 'slash', color: '#5c3a14' },
          }),
          M(2, {
            name: 'Chaos Bloom',
            desc: 'A flower opens. It is made of fire and it is looking at you.',
            power: 1.2,
            anim: { type: 'blast', color: FIRE },
          }),
        ],
        phase3: [
          M(4, {
            name: 'Desperate Conflagration',
            desc: 'The little thing at the heart of the tree flails, and the world catches.',
            target: 'allEnemies',
            power: 1.1,
            energyGain: 20,
            anim: { type: 'nova', color: FIRE },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.35)) {
                  ctx.addStatus(t, 'burn', { duration: 2 });
                  ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
                }
              });
            },
          }),
          M(3, {
            name: 'Clawing Boughs',
            desc: 'Branches that remember being fingers.',
            target: 'splash',
            splash: 0.5,
            power: 0.8,
            anim: { type: 'slash', color: '#5c3a14' },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.66,
          name: 'The First Root Splinters',
          banner: 'A root gives way, and the great trunk sags toward the fire below.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.debuff(unit, { stat: 'def', mult: -0.35, duration: 99, name: 'Splintered Root' });
            ctx.log('Bark sloughs from the Bed of Chaos in burning sheets.');
          },
        },
        {
          hpPct: 0.33,
          name: 'The Heart Exposed',
          banner: 'At the center of all that burning wood: something small, and very afraid.',
          moveset: 'phase3',
          onEnter(ctx, unit) {
            ctx.debuff(unit, { stat: 'def', mult: -0.35, duration: 99, name: 'Heart Exposed' });
            ctx.buff(unit, { stat: 'atk', mult: 0.3, duration: 99, name: 'Last Flailing' });
            ctx.log('The last ember of the Witch\'s ambition writhes in its cage of roots.');
          },
        },
      ],
      ult: A({
        name: 'Garden of Cinders',
        desc: 'Everything that ever grew here burns in a single breath — and the roots close around whoever it catches.',
        target: 'allEnemies',
        power: 1.2,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'nova', color: FIRE },
        cutin: { title: 'Garden of Cinders', line: 'All life crawled from this fire. Return to it.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.25), duration: 2 });
            ctx.addStatus(t, 'burn', { duration: 2 });
          });
          if (targets.length) {
            const t = targets[Math.floor(Math.random() * targets.length)];
            ctx.addStatus(t, 'immobilize', { duration: 2 });
          }
        },
      }),
    },

    // ====================== LEGEND BOSSES (character variants) ======================
    {
      id: 'ornstein_boss',
      name: 'Ornstein',
      title: 'Dragonslayer of the Sunless Court',
      element: 'Lightning',
      tier: 'boss',
      base: { hp: 3600, atk: 126, def: 72, spd: 118 },
      toughness: 300,
      weak: ['Dark', 'Frost'],
      art: { palette: ['#1c1408', '#7a5a1c', '#f0c040'], icon: '🦁', aura: 'storm' },
      maxEnergy: 120,
      movesets: {
        default: [
          M(4, {
            name: 'Lion Lance Thrust',
            desc: 'The lance that ended dragons finds knights disappointingly soft.',
            power: 1.2,
            anim: { type: 'pierce', color: LTN },
          }),
          M(3, {
            name: 'Skyward Bolt',
            desc: 'He flicks the lance upward and the storm does his bookkeeping.',
            target: 'randomEnemies',
            hits: 2,
            power: 0.7,
            energyGain: 20,
            anim: { type: 'volley', color: LTN },
          }),
          M(3, {
            name: 'Crossing Dash',
            desc: 'He is on the far side of you before the thunder catches up.',
            power: 1.4,
            defPierce: 0.15,
            energyGain: 20,
            anim: { type: 'pierce', color: LTN },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Lightning Storm',
            desc: 'The hall\'s golden ceiling turns witness to a private tempest.',
            target: 'allEnemies',
            power: 0.9,
            energyGain: 20,
            anim: { type: 'nova', color: LTN },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.3)) {
                  ctx.addStatus(t, 'shock', { duration: 2 });
                  ctx.dot(t, { name: 'Shock', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
                }
              });
            },
          }),
          M(3, {
            name: 'Impaling Arc',
            desc: 'A leap, a fall, and a spear-point where your shadow was.',
            power: 1.7,
            energyGain: 20,
            anim: { type: 'pierce', color: LTN },
          }),
          M(2, {
            name: 'Skyward Bolt',
            desc: 'He flicks the lance upward and the storm does his bookkeeping.',
            target: 'randomEnemies',
            hits: 2,
            power: 0.7,
            anim: { type: 'volley', color: LTN },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.5,
          name: 'The Lion Unchained',
          banner: 'The captain of four knights remembers why he was made captain.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.25, duration: 99, name: 'Lion\'s Pride' });
            ctx.buff(unit, { stat: 'spd', mult: 0.15, duration: 99, name: 'Storm Stride' });
            ctx.log('Ornstein plants the lance and the air itself begins to hum.');
          },
        },
      ],
      onAllyDeath(ctx, unit, fallen) {
        if (fallen && fallen.defId && fallen.defId !== 'smough_boss') return;
        ctx.heal(unit, unit.stats.hp);
        unit.moveset = 'phase2';
        unit.toughness = unit.maxToughness;
        unit.broken = false;
        ctx.buff(unit, { stat: 'dmg', mult: 0.1, duration: 99, name: 'Borrowed Thunder' });
        ctx.gainEnergy(unit, 40);
        ctx.log('Ornstein rises whole, wreathed in stolen storm-light, lightning answering his every step.');
      },
      ult: A({
        name: 'Heaven-Rending Lance',
        desc: 'The lance goes through you on its way to somewhere more important.',
        power: 2.2,
        energyCost: 120,
        energyGain: 0,
        anim: { type: 'pierce', color: LTN },
        cutin: { title: 'Heaven-Rending Lance', line: 'The hunt outlives the gods.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            ctx.addStatus(t, 'shock', { duration: 2 });
            ctx.dot(t, { name: 'Shock', dmgPerTurn: atkOf(user, 0.35), duration: 2 });
          });
        },
      }),
    },
    {
      id: 'smough_boss',
      name: 'Smough',
      title: 'Executioner of the Gilded Hall',
      element: 'Physical',
      tier: 'boss',
      base: { hp: 4400, atk: 130, def: 85, spd: 88 },
      toughness: 340,
      weak: ['Magic', 'Lightning'],
      art: { palette: ['#1f1a10', '#8a7228', '#f2d066'], icon: '🔨', aura: 'holy' },
      maxEnergy: 120,
      movesets: {
        default: [
          M(4, {
            name: 'Hammer Avalanche',
            desc: 'The head of the hammer is wider than a door. It is also faster than one.',
            power: 1.3,
            anim: { type: 'blast', color: HOLY },
          }),
          M(3, {
            name: 'Rolling Bulk',
            desc: 'He tucks, rolls, and the marble floor files a complaint.',
            target: 'splash',
            splash: 0.7,
            power: 1.0,
            energyGain: 20,
            anim: { type: 'blast', color: PHYS },
          }),
          M(2, {
            name: 'Executioner\'s Appetite',
            desc: 'He steadies himself with a breath that empties the room.',
            target: 'self',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: HOLY },
            extra(ctx, user) {
              ctx.buff(user, { stat: 'def', mult: 0.25, duration: 2, name: 'Set Stance' });
              ctx.heal(user, Math.round(((user.stats && user.stats.hp) || 3000) * 0.06));
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Butcher\'s Leap',
            desc: 'For one horrible moment, all of him is airborne.',
            target: 'allEnemies',
            power: 0.9,
            energyGain: 20,
            anim: { type: 'nova', color: HOLY },
          }),
          M(3, {
            name: 'Hammer Avalanche',
            desc: 'The head of the hammer is wider than a door. It is also faster than one.',
            power: 1.3,
            anim: { type: 'blast', color: HOLY },
          }),
          M(2, {
            name: 'Crushing Verdict',
            desc: 'The sentence is passed, carried out, and swept up, all in one motion.',
            power: 1.8,
            energyGain: 20,
            anim: { type: 'blast', color: PHYS },
          }),
          M(2, {
            name: 'Stolen Storm',
            desc: 'He swings the hammer as lightning remembers a friend.',
            target: 'allEnemies',
            power: 0.95,
            energyGain: 20,
            anim: { type: 'nova', color: LTN },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.3)) {
                  ctx.addStatus(t, 'shock', { duration: 2 });
                  ctx.dot(t, { name: 'Shock', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
                }
              });
            },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.5,
          name: 'Appetite Whetted',
          banner: 'He laughs behind the golden mask, and the hall shakes with it.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.3, duration: 99, name: 'Whetted Appetite' });
            ctx.log('Smough drags the great hammer through the marble as if through snow.');
          },
        },
      ],
      onAllyDeath(ctx, unit, fallen) {
        if (fallen && fallen.defId && fallen.defId !== 'ornstein_boss') return;
        ctx.heal(unit, unit.stats.hp);
        unit.moveset = 'phase2';
        unit.toughness = unit.maxToughness;
        unit.broken = false;
        ctx.log('Smough grinds the lion-helm beneath his heel and swells with stolen storm-light.');
      },
      ult: A({
        name: 'Golden Crater',
        desc: 'Where the hammer lands, the architecture surrenders.',
        target: 'allEnemies',
        power: 1.3,
        energyCost: 120,
        energyGain: 0,
        anim: { type: 'nova', color: HOLY },
        cutin: { title: 'Golden Crater', line: 'Every floor is my chopping block.' },
        extra(ctx, user) {
          ctx.shield(user, atkOf(user, 2));
        },
      }),
    },
    {
      id: 'gwyn_boss',
      name: 'Gwyn',
      title: 'Lord of Cinder',
      element: 'Fire',
      tier: 'boss',
      base: { hp: 6200, atk: 142, def: 88, spd: 110 },
      toughness: 400,
      weak: ['Dark', 'Frost', 'Physical'],
      parryChance: 0.05,
      art: { palette: ['#191007', '#6e4a1a', '#f0a83c'], icon: '👑', aura: 'ember' },
      maxEnergy: 140,
      movesets: {
        default: [
          M(4, {
            name: 'Cindered Greatsword',
            desc: 'A blade of sunlight, burnt down to its wick.',
            power: 1.3,
            anim: { type: 'slash', color: FIRE },
          }),
          M(3, {
            name: 'Grasp of the Lord',
            desc: 'The hand that held the First Flame closes around your throat.',
            power: 0.9,
            energyGain: 20,
            anim: { type: 'blast', color: FIRE },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.drainEnergy(t, 15);
              });
            },
          }),
          M(3, {
            name: 'Ember Wave',
            desc: 'He sweeps the sword low, and the kiln\'s ash rises like a tide.',
            target: 'allEnemies',
            power: 0.7,
            energyGain: 20,
            anim: { type: 'nova', color: FIRE },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Blazing Combination',
            desc: 'Three cuts from a swordsmanship older than kingdoms.',
            hits: 3,
            power: 0.55,
            anim: { type: 'slash', color: FIRE },
          }),
          M(3, {
            name: 'Cindered Greatsword',
            desc: 'A blade of sunlight, burnt down to its wick.',
            power: 1.3,
            anim: { type: 'slash', color: FIRE },
          }),
          M(2, {
            name: 'Ember Wave',
            desc: 'He sweeps the sword low, and the kiln\'s ash rises like a tide.',
            target: 'allEnemies',
            power: 0.7,
            energyGain: 20,
            anim: { type: 'nova', color: FIRE },
          }),
        ],
        phase3: [
          M(4, {
            name: 'Last Radiance',
            desc: 'For a heartbeat he is the Lord of Sunlight again. Then the heartbeat ends.',
            target: 'allEnemies',
            power: 1.0,
            energyGain: 20,
            anim: { type: 'nova', color: FIRE },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.35)) {
                  ctx.addStatus(t, 'burn', { duration: 2 });
                  ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
                }
              });
            },
          }),
          M(3, {
            name: 'Desperate Cinders',
            desc: 'Two ragged swings; the form is gone, the strength is not.',
            hits: 2,
            power: 0.8,
            anim: { type: 'slash', color: FIRE },
          }),
          M(2, {
            name: 'Grasp of the Lord',
            desc: 'The hand that held the First Flame closes around your throat.',
            power: 0.9,
            energyGain: 20,
            anim: { type: 'blast', color: FIRE },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.drainEnergy(t, 15);
              });
            },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.75,
          name: 'The Fire Still Answers',
          banner: 'A quarter of him is gone. The rest is furious about it.',
          moveset: 'default',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'dmg', mult: 0.1, duration: 99, name: 'Cinder\'s Wrath' });
            ctx.log('Gwyn\'s blade catches, just slightly, brighter.');
          },
        },
        {
          hpPct: 0.66,
          name: 'What Remains of Sunlight',
          banner: 'Beneath the char, something bright still refuses to go out.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.2, duration: 99, name: 'Stirring Cinders' });
            ctx.log('Gwyn straightens, and for a moment the kiln is a throne room again.');
          },
        },
        {
          hpPct: 0.5,
          name: 'The Last Light Sharpens',
          banner: 'Half of him has burned away. What is left cuts cleaner for it.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'critRate', mult: 0.15, duration: 99, name: 'Sunlight\'s Edge' });
            ctx.buff(unit, { stat: 'dmg', mult: 0.15, duration: 99, name: 'Sunlight\'s Edge' });
            ctx.log('Gwyn\'s strikes narrow to a single, merciless point of light.');
          },
        },
        {
          hpPct: 0.33,
          name: 'A Kingdom of Ash',
          banner: 'He fed everything he loved to the fire. You are merely next.',
          moveset: 'phase3',
          onEnter(ctx, unit) {
            ctx.cleanse(unit);
            ctx.buff(unit, { stat: 'atk', mult: 0.35, duration: 99, name: 'Final Cinders' });
            ctx.actionAdvance(unit, 0.4);
            // Everything he has left, spent at once — his ultimate is
            // guaranteed to fire on his very next action.
            ctx.gainEnergy(unit, unit.maxEnergy);
            ctx.log('The Lord of Cinder abandons dignity. What is left is only fire.');
          },
        },
      ],
      ult: A({
        name: 'Light That Devours',
        desc: 'The last sunrise anyone in this kiln will see.',
        target: 'allEnemies',
        power: 1.5,
        energyCost: 140,
        energyGain: 0,
        anim: { type: 'nova', color: FIRE },
        cutin: { title: 'Light That Devours', line: 'I gave it everything. Still it hungers.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            if (DS.RNG.chance(0.5)) {
              ctx.addStatus(t, 'burn', { duration: 2 });
              ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.35), duration: 2 });
            }
          });
        },
      }),
    },
    {
      id: 'quelaag_boss',
      name: 'Quelaag',
      title: 'Bride of Chaos',
      element: 'Fire',
      tier: 'boss',
      // Fighting hardest when cornered, for her sister's sake — refreshes a
      // strong buff every turn while below 30% HP, on top of her existing
      // half-HP phase.
      onTurnStart(ctx, unit) {
        if (unit.hp / unit.stats.hp < 0.3) {
          ctx.buff(unit, { stat: 'atk', mult: 0.15, duration: 2, name: 'Cornered for Her Sake', quiet: true });
          ctx.buff(unit, { stat: 'critDmg', mult: 0.2, duration: 2, name: 'Cornered for Her Sake', quiet: true });
        }
      },
      base: { hp: 3400, atk: 122, def: 68, spd: 104 },
      toughness: 300,
      weak: ['Frost', 'Magic'],
      art: { palette: ['#1a0d0d', '#6b1f1f', '#f05838'], icon: '🕷', aura: 'ember' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Chaos Blade Sweep',
            desc: 'A sword drawn from her own burning flesh, still soft at the edges.',
            target: 'splash',
            splash: 0.6,
            power: 1.1,
            anim: { type: 'slash', color: FIRE },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.3)) {
                  ctx.addStatus(t, 'burn', { duration: 2 });
                  ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
                }
              });
            },
          }),
          M(3, {
            name: 'Lava Spit',
            desc: 'The spider-half votes, loudly, in molten dissent.',
            target: 'randomEnemies',
            hits: 2,
            power: 0.65,
            energyGain: 20,
            anim: { type: 'volley', color: FIRE },
          }),
          M(3, {
            name: 'Spider Lunge',
            desc: 'Eight legs agree on a direction: yours.',
            power: 1.3,
            anim: { type: 'pierce', color: FIRE },
          }),
          M(3, {
            name: 'Chaos Spittle',
            desc: 'A gout of burning ichor, spat wherever her hatred happens to be looking.',
            target: 'randomEnemies',
            hits: 1,
            power: 0.8,
            energyGain: 20,
            anim: { type: 'volley', color: FIRE },
            // 'randomEnemies' extra() receives every alive foe, not just the one hit —
            // pick a single one here so the burn lands on one target, not the whole party.
            extra(ctx, user, targets) {
              if (!targets.length) return;
              const t = targets[Math.floor(Math.random() * targets.length)];
              ctx.addStatus(t, 'burn', { duration: 3 });
              ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.3), duration: 3 });
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Molten Eruption',
            desc: 'The dome floor cracks, and the fire below accepts the invitation.',
            target: 'allEnemies',
            power: 0.9,
            energyGain: 20,
            anim: { type: 'nova', color: FIRE },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.35)) {
                  ctx.addStatus(t, 'burn', { duration: 2 });
                  ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
                }
              });
            },
          }),
          M(3, {
            name: 'Chaos Blade Sweep',
            desc: 'A sword drawn from her own burning flesh, still soft at the edges.',
            target: 'splash',
            splash: 0.6,
            power: 1.1,
            anim: { type: 'slash', color: FIRE },
          }),
          M(2, {
            name: 'Fury for the Fair Lady',
            desc: 'Everything she does, she does for the sister you cannot see.',
            power: 1.7,
            energyGain: 20,
            anim: { type: 'blast', color: FIRE },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.5,
          name: 'The Fire Below Screams',
          banner: 'She fights harder for someone else\'s sake than you ever will for your own.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.3, duration: 99, name: 'Sister\'s Keeper' });
            ctx.log('Quelaag shrieks, and magma wells up between the dome\'s ribs.');
            ctx.log('Her chitin splits and the chaos beneath erupts outward!');
            ctx.foes(unit).forEach(function (t) {
              ctx.dealBonusTrueDamage(unit, t, atkOf(unit, 1.6));
            });
          },
        },
      ],
      ult: A({
        name: 'Chaos Made Flesh',
        desc: 'For one breath, she is what her mother tried to become.',
        target: 'allEnemies',
        power: 1.25,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'nova', color: FIRE },
        cutin: { title: 'Chaos Made Flesh', line: 'For her, I would burn the world twice.' },
      }),
    },
    {
      id: 'nito_boss',
      name: 'Nito',
      title: 'First of the Dead',
      element: 'Dark',
      tier: 'boss',
      base: { hp: 4600, atk: 118, def: 76, spd: 90 },
      toughness: 340,
      weak: ['Holy', 'Fire'],
      art: { palette: ['#0d0d12', '#33333f', '#9a94b8'], icon: '☠', aura: 'void' },
      maxEnergy: 120,
      movesets: {
        default: [
          M(4, {
            name: 'Gravelord Sword',
            desc: 'A blade of fused spines, heavy with everyone it has ever been.',
            power: 1.2,
            anim: { type: 'slash', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.3)) ctx.addStatus(t, 'curse', { duration: 2 });
              });
            },
          }),
          M(3, {
            name: 'Miasma of Death',
            desc: 'The air remembers every plague it has ever carried.',
            target: 'allEnemies',
            power: 0.55,
            energyGain: 20,
            anim: { type: 'nova', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.4)) {
                  ctx.addStatus(t, 'poison', { duration: 2 });
                  ctx.dot(t, { name: 'Poison', dmgPerTurn: atkOf(user, 0.25), duration: 2 });
                }
              });
            },
          }),
          M(2, {
            name: 'Bone Chorus',
            desc: 'The dead sing low, and their shepherd stands taller.',
            target: 'allAllies',
            power: 0,
            energyGain: 25,
            anim: { type: 'ritual', color: DARK },
            extra(ctx, user, targets) {
              ctx.summonReinforcement(user, { id: 'skeleton', level: user.level });
              ctx.summonReinforcement(user, { id: 'skeleton', level: user.level });
              targets.forEach(function (t) {
                ctx.buff(t, { stat: 'atk', mult: 0.15, duration: 2, name: 'Bone Chorus' });
                ctx.shield(t, atkOf(user, 1));
              });
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Deathwave',
            desc: 'He exhales, and the idea of dying travels outward at speed.',
            target: 'allEnemies',
            power: 0.95,
            energyGain: 20,
            anim: { type: 'nova', color: DARK },
          }),
          M(3, {
            name: 'Gravelord Sword',
            desc: 'A blade of fused spines, heavy with everyone it has ever been.',
            power: 1.2,
            anim: { type: 'slash', color: DARK },
          }),
          M(2, {
            name: 'Entombing Grip',
            desc: 'A hand of many hands drags you halfway into the floor.',
            power: 1.5,
            energyGain: 20,
            anim: { type: 'blast', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.debuff(t, { stat: 'spd', mult: -0.2, duration: 2, name: 'Entombed' });
              });
            },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.75,
          name: 'Abyss Shriek',
          banner: 'A sound with no throat behind it tears through the sepulcher.',
          moveset: 'default',
          onEnter: abyssShriek,
        },
        {
          hpPct: 0.5,
          name: 'The Grave Breathes In',
          banner: 'Every death you have ever dealt is remembered here, and tallied.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.25, duration: 99, name: 'Gravelord\'s Due' });
            ctx.log('Coffins shift in the dark as the First of the Dead rises to his full height.');
            abyssShriek(ctx, unit);
          },
        },
        {
          hpPct: 0.25,
          name: 'Abyss Shriek',
          banner: 'A sound with no throat behind it tears through the sepulcher.',
          moveset: 'phase2',
          onEnter: abyssShriek,
        },
      ],
      ult: A({
        name: 'Procession of the Dead',
        desc: 'They come when he calls, and then he sends them back down — all of them, all at once.',
        target: 'allEnemies',
        power: 1.2,
        energyCost: 120,
        energyGain: 0,
        anim: { type: 'ritual', color: DARK },
        cutin: { title: 'Procession of the Dead', line: 'All rivers of blood run to my sea.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            if (DS.RNG.chance(0.4)) ctx.addStatus(t, 'curse', { duration: 2 });
            ctx.addStatus(t, 'poison', { duration: 99 });
            ctx.dot(t, { name: 'Plague', dmgPerTurn: atkOf(user, 0.2), duration: 99 });
          });
          ctx.party(user).filter(function (e) { return e.alive && e.defId === 'skeleton'; }).forEach(function (s) { ctx.execute(s); });
          ctx.log('Nito calls his dead home — the skeletons collapse to dust, and the plague spreads.');
        },
      }),
    },
    {
      id: 'manus_boss',
      name: 'Manus',
      title: 'Father of the Abyss',
      element: 'Dark',
      tier: 'boss',
      // The Abyss reaching out on its own — every 4th turn, a free hex pulse
      // lands outside his normal moveset, unprompted by any roll.
      onTurnStart(ctx, unit) {
        unit._abyssTicks = (unit._abyssTicks || 0) + 1;
        if (unit._abyssTicks % 4 === 0) {
          const alive = ctx.foes(unit).filter(function (f) { return f.alive; });
          if (alive.length) {
            const t = DS.RNG.pick(alive);
            ctx.addStatus(t, 'hex', { duration: 2 });
            ctx.log('The Abyss reaches out on its own, and finds ' + t.name + '.');
          }
        }
      },
      base: { hp: 5600, atk: 138, def: 80, spd: 108 },
      toughness: 380,
      weak: ['Holy', 'Lightning'],
      art: { palette: ['#0a0710', '#2e2244', '#7a4fd0'], icon: '🜄', aura: 'void' },
      maxEnergy: 130,
      movesets: {
        default: [
          M(4, {
            name: 'Catalyst Smash',
            desc: 'A staff of gnarled dark, used with no sorcery at all — just hate.',
            power: 1.25,
            anim: { type: 'blast', color: DARK },
          }),
          M(3, {
            name: 'Abyssal Barrage',
            desc: 'Ten fingers of dark, and every one of them an opinion.',
            target: 'randomEnemies',
            hits: 10,
            power: 0.22,
            energyGain: 20,
            anim: { type: 'volley', color: DARK },
          }),
          M(3, {
            name: 'Grasping Dark',
            desc: 'Something older than fear closes around your ankles.',
            power: 1.0,
            anim: { type: 'blast', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.4)) ctx.addStatus(t, 'curse', { duration: 2 });
              });
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Dark Orb Tempest',
            desc: 'A sky\'s worth of black stars, all falling at once.',
            target: 'allEnemies',
            power: 0.9,
            energyGain: 20,
            anim: { type: 'nova', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.25)) ctx.addStatus(t, 'hex', { duration: 2 });
              });
            },
          }),
          M(3, {
            name: 'Catalyst Smash',
            desc: 'A staff of gnarled dark, used with no sorcery at all — just hate.',
            power: 1.25,
            anim: { type: 'blast', color: DARK },
          }),
          M(3, {
            name: 'Rake of the Father',
            desc: 'Two long arms, two long regrets, dragged across the field.',
            hits: 2,
            power: 0.75,
            anim: { type: 'slash', color: DARK },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.5,
          name: 'Humanity Runs Wild',
          banner: 'What was taken from him was small. What grew back is not.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.3, duration: 99, name: 'Wild Humanity' });
            ctx.foes(unit).forEach(function (t) {
              if (DS.RNG.chance(0.3)) ctx.addStatus(t, 'hex', { duration: 2 });
            });
            ctx.log('The Abyss pours out of Manus like blood from a wound that never shut.');
          },
        },
      ],
      ult: A({
        name: 'The Abyss Remembers',
        desc: 'Every hurt done to him, returned with interest, in the dark — six times over.',
        target: 'randomEnemies',
        hits: 6,
        power: 0.5,
        energyCost: 130,
        energyGain: 0,
        anim: { type: 'volley', color: DARK },
        cutin: { title: 'The Abyss Remembers', line: 'You took the smallest piece of me. I will take all of you.' },
        // 'randomEnemies' extra() receives every alive foe, not just the ones hit —
        // pick a single one so the curse chance lands on one target, not the whole party.
        extra(ctx, user, targets) {
          if (!targets.length) return;
          const t = targets[Math.floor(Math.random() * targets.length)];
          if (DS.RNG.chance(0.5)) ctx.addStatus(t, 'curse', { duration: 2 });
        },
      }),
    },
    {
      id: 'seath_boss',
      name: 'Seath the Scaleless',
      title: 'Traitor Wyrm of the Archives',
      element: 'Magic',
      tier: 'boss',
      // The crystal hide keeps mending until you actually break it — a fresh
      // shield every turn he isn't Broken, on top of his half-HP phase.
      onTurnStart(ctx, unit) {
        if (!unit.broken) {
          ctx.shield(unit, atkOf(unit, 0.8));
          ctx.log('Crystal knits back over Seath\'s hide, unasked.');
        }
      },
      base: { hp: 4800, atk: 128, def: 70, spd: 94 },
      toughness: 340,
      weak: ['Physical', 'Fire'],
      art: { palette: ['#101822', '#3c5a74', '#cfeaf8'], icon: '🐍', aura: 'frost' },
      maxEnergy: 120,
      movesets: {
        default: [
          M(4, {
            name: 'Crystal Breath',
            desc: 'A fog that turns thought brittle and skin to glass.',
            target: 'allEnemies',
            power: 0.75,
            energyGain: 20,
            anim: { type: 'beam', color: MAG },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.25)) ctx.addStatus(t, 'hex', { duration: 2 });
                if (DS.RNG.chance(0.2)) ctx.addStatus(t, 'curseToken', { duration: 99, stack: true });
              });
            },
          }),
          M(3, {
            name: 'Tail Spike Volley',
            desc: 'Six blind tails, each certain it knows where you are.',
            target: 'randomEnemies',
            hits: 3,
            power: 0.5,
            anim: { type: 'volley', color: MAG },
            // 'randomEnemies' extra() receives every alive foe, not just the ones hit —
            // pick a single one so the curse chance lands on one target, not the whole party.
            extra(ctx, user, targets) {
              if (!targets.length || !DS.RNG.chance(0.05)) return;
              const t = targets[Math.floor(Math.random() * targets.length)];
              ctx.addStatus(t, 'curseToken', { duration: 99, stack: true });
            },
          }),
          M(3, {
            name: 'Moonlight Rend',
            desc: 'A wing-blade of pale light, honed on centuries of spite.',
            power: 1.4,
            energyGain: 20,
            anim: { type: 'slash', color: MAG },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Maddened Thrash',
            desc: 'Immortality gone, the wyrm discovers panic — and shares it generously.',
            target: 'allEnemies',
            power: 1.0,
            energyGain: 20,
            anim: { type: 'nova', color: MAG },
          }),
          M(3, {
            name: 'Curseglass Breath',
            desc: 'The fog thickens with something that outlives its victims.',
            target: 'allEnemies',
            power: 0.7,
            anim: { type: 'beam', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.3)) ctx.addStatus(t, 'curse', { duration: 2 });
              });
            },
          }),
          M(3, {
            name: 'Moonlight Rend',
            desc: 'A wing-blade of pale light, honed on centuries of spite.',
            power: 1.4,
            energyGain: 20,
            anim: { type: 'slash', color: MAG },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.5,
          name: 'Immortality Undone',
          banner: 'The crystal cracks — and with it, the last of the wyrm\'s reason.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.debuff(unit, { stat: 'def', mult: -0.25, duration: 99, name: 'Shattered Crystal' });
            ctx.buff(unit, { stat: 'atk', mult: 0.4, duration: 99, name: 'Scaleless Fury' });
            ctx.log('The Primordial Crystal bursts, and Seath screams in six directions at once.');
          },
        },
      ],
      ult: A({
        name: 'Crystalline Apotheosis',
        desc: 'He shows you the perfection he traded his scales for.',
        target: 'allEnemies',
        power: 1.3,
        energyCost: 120,
        energyGain: 0,
        anim: { type: 'nova', color: MAG },
        cutin: { title: 'Crystalline Apotheosis', line: 'Immortality is never given. It is taken.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            if (DS.RNG.chance(0.35)) ctx.addStatus(t, 'hex', { duration: 2 });
          });
        },
      }),
    },
    {
      id: 'fourkings_boss',
      name: 'The Four Kings',
      title: 'Crowns Adrift in the Dark',
      element: 'Dark',
      tier: 'boss',
      base: { hp: 5000, atk: 125, def: 72, spd: 100 },
      toughness: 320,
      weak: ['Holy', 'Magic'],
      art: { palette: ['#08080e', '#232338', '#6a6ab0'], icon: '♛', aura: 'void' },
      maxEnergy: 120,
      // Every ~3 turns another king unfolds from the dark, capping at 4 total, each a touch
      // weaker. Counts every king ever spawned (not just those still alive) so killing one
      // doesn't free up a slot for a 5th to take its place.
      onTurnStart(ctx, unit) {
        const totalKings = ctx.party(unit).filter(function (e) { return e.defId === 'fourkings_boss'; }).length;
        const due = Math.min(4, Math.floor(ctx.turnCount() / 3) + 1);
        if (totalKings < due && totalKings < 4) {
          ctx.summonReinforcement(unit, { id: 'fourkings_boss', level: unit.level, statMult: 0.4 });
          ctx.log('Another king unfolds out of the featureless dark.');
        }
      },
      movesets: {
        default: [
          M(4, {
            name: 'Greatsword of the Drowned',
            desc: 'A blade that ruled a city, now ruling only the dark it sank into.',
            power: 1.3,
            anim: { type: 'slash', color: DARK },
          }),
          M(3, {
            name: 'Wraith Volley',
            desc: 'Loyal spirits, flung like stones by kings with nothing left to govern.',
            target: 'randomEnemies',
            hits: 4,
            power: 0.45,
            energyGain: 20,
            anim: { type: 'volley', color: DARK },
          }),
          M(3, {
            name: 'Lifedrain Grasp',
            desc: 'A king\'s prerogative: to take, and to keep taking.',
            power: 1.0,
            anim: { type: 'blast', color: DARK },
            extra(ctx, user, targets, allies, dmgDealt) {
              if (dmgDealt > 0) ctx.heal(user, Math.round(dmgDealt * 0.5));
            },
          }),
          M(3, {
            name: 'Grasp of the Drowned Crown',
            desc: 'A hand of light-purple flame closes around one soul and simply squeezes.',
            power: 1.2,
            energyGain: 20,
            anim: { type: 'blast', color: '#c9a0ff' },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.dealBonusTrueDamage(user, t, atkOf(user, 0.3));
              });
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Convergence of Kings',
            desc: 'Four verdicts, delivered simultaneously, none of them merciful.',
            target: 'allEnemies',
            power: 1.0,
            energyGain: 20,
            anim: { type: 'nova', color: DARK },
          }),
          M(3, {
            name: 'Abyssal Halo',
            desc: 'A ring of cold light — the last shape of a drowned city\'s crown.',
            target: 'allEnemies',
            power: 0.6,
            anim: { type: 'nova', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                ctx.debuff(t, { stat: 'def', mult: -0.2, duration: 2, name: 'Abyssal Halo' });
              });
            },
          }),
          M(3, {
            name: 'Greatsword of the Drowned',
            desc: 'A blade that ruled a city, now ruling only the dark it sank into.',
            power: 1.3,
            anim: { type: 'slash', color: DARK },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.5,
          name: 'Another Crown Rises',
          banner: 'Count the crowns again. The dark keeps making more.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.3, duration: 99, name: 'Convocation' });
            ctx.gainEnergy(unit, 40);
            ctx.actionAdvance(unit, 0.5);
            ctx.log('Out of the featureless dark, another king unfolds — then another.');
          },
        },
      ],
      ult: A({
        name: 'Four Crowns, One Hunger',
        desc: 'They ruled together. They starve together.',
        target: 'randomEnemies',
        hits: 4,
        power: 0.75,
        energyCost: 120,
        energyGain: 0,
        anim: { type: 'volley', color: DARK },
        cutin: { title: 'Four Crowns, One Hunger', line: 'A drowned kingdom still demands its tithe.' },
      }),
    },
    {
      id: 'artorias_boss',
      name: 'Artorias',
      title: 'The Abysswalker, Fallen',
      element: 'Dark',
      tier: 'boss',
      // The Abyss empowering him even as it corrodes him — a small permanent
      // ATK/DEF trade every turn, capped so the corruption plateaus.
      onTurnStart(ctx, unit) {
        unit._corruption = unit._corruption || 0;
        if (unit._corruption < 8) {
          unit._corruption++;
          ctx.buff(unit, { stat: 'atk', mult: 0.025, duration: 99, name: 'Abyssal Corruption', quiet: unit._corruption > 1 });
          ctx.debuff(unit, { stat: 'def', mult: -0.02, duration: 99, name: 'Abyssal Corruption', quiet: true });
        }
      },
      base: { hp: 4000, atk: 134, def: 74, spd: 116 },
      toughness: 320,
      weak: ['Holy', 'Fire'],
      art: { palette: ['#0e1014', '#2e3644', '#8fa3c8'], icon: '🐺', aura: 'void' },
      maxEnergy: 120,
      movesets: {
        default: [
          M(4, {
            name: 'Wolf Blade Arc',
            desc: 'The greatsword still moves with a knight\'s grace. The arm does not.',
            power: 1.25,
            anim: { type: 'slash', color: DARK },
          }),
          M(3, {
            name: 'Somersault Slam',
            desc: 'He turns the whole of himself into the swing.',
            target: 'splash',
            splash: 0.65,
            power: 1.05,
            energyGain: 20,
            anim: { type: 'blast', color: DARK },
          }),
          M(2, {
            name: 'Abyssal Surge',
            desc: 'The corruption feeds him. He no longer refuses it.',
            target: 'self',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: DARK },
            extra(ctx, user) {
              ctx.buff(user, { stat: 'atk', mult: 0.25, duration: 2, name: 'Abyssal Surge' });
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Blade of Ruin',
            desc: 'One cut, carrying everything the Abyss has left of him.',
            power: 1.8,
            energyGain: 20,
            anim: { type: 'slash', color: DARK },
          }),
          M(3, {
            name: 'Cartwheel Flurry',
            desc: 'A dance learned in a better age, performed by what remains.',
            hits: 3,
            power: 0.6,
            anim: { type: 'slash', color: DARK },
          }),
          M(3, {
            name: 'Wolf Blade Arc',
            desc: 'The greatsword still moves with a knight\'s grace. The arm does not.',
            power: 1.25,
            anim: { type: 'slash', color: DARK },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.45,
          name: 'The Abyss Drinks Deep',
          banner: 'The knight\'s good arm hangs dead. The Abyss lends him another.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.4, duration: 99, name: 'Drowned Oath' });
            ctx.buff(unit, { stat: 'spd', mult: 0.15, duration: 99, name: 'Drowned Oath' });
            ctx.log('Dark wells from Artorias\'s cracked helm like breath on a cold morning.');
          },
        },
      ],
      ult: A({
        name: 'Oath Devoured',
        desc: 'The last promise he ever made, broken across your shoulders.',
        power: 2.3,
        energyCost: 120,
        energyGain: 0,
        anim: { type: 'slash', color: DARK },
        cutin: { title: 'Oath Devoured', line: 'The wolf... does not... kneel.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            if (DS.RNG.chance(0.5)) ctx.addStatus(t, 'curse', { duration: 2 });
          });
        },
      }),
    },
    {
      id: 'priscilla_boss',
      name: 'Priscilla',
      title: 'Keeper of the Painted Winter',
      element: 'Frost',
      tier: 'boss',
      // She fades from sight a moment — every 3rd turn, a strong evasion and
      // speed burst outside her normal moveset.
      onTurnStart(ctx, unit) {
        unit._vanishTicks = (unit._vanishTicks || 0) + 1;
        if (unit._vanishTicks % 3 === 0) {
          ctx.addStatus(unit, 'evasionUp', { duration: 1 });
          ctx.buff(unit, { stat: 'spd', mult: 0.25, duration: 1, name: 'Painted Fade' });
          ctx.log('Priscilla fades from sight a moment, and the snow forgets her outline.');
        }
      },
      base: { hp: 3300, atk: 116, def: 66, spd: 112 },
      toughness: 280,
      weak: ['Fire', 'Dark'],
      art: { palette: ['#171a1f', '#5e6b7a', '#f2f4f0'], icon: '❄', aura: 'frost' },
      maxEnergy: 110,
      movesets: {
        default: [
          M(4, {
            name: 'Lifehunt Scythe',
            desc: 'A crescent that harvests something the body only borrows.',
            power: 1.2,
            anim: { type: 'slash', color: FROST },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.35)) {
                  ctx.addStatus(t, 'bleed', { duration: 2 });
                  ctx.dot(t, { name: 'Bleed', dmgPerTurn: atkOf(user, 0.35), duration: 2 });
                }
              });
            },
          }),
          M(3, {
            name: 'Breath of Winter',
            desc: 'The painting\'s season arrives all at once.',
            target: 'allEnemies',
            power: 0.6,
            energyGain: 20,
            anim: { type: 'nova', color: FROST },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.2)) ctx.addStatus(t, 'freeze', { duration: 1 });
              });
            },
          }),
          M(2, {
            name: 'Vanish',
            desc: 'She was asked politely to be left alone. This is her answer.',
            target: 'self',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: FROST },
            extra(ctx, user) {
              ctx.addStatus(user, 'evasionUp', { duration: 2 });
              ctx.buff(user, { stat: 'spd', mult: 0.15, duration: 2, name: 'Snowveil' });
            },
          }),
        ],
        phase2: [
          M(4, {
            name: 'Unseen Reaping',
            desc: 'The snow writes her footsteps a heartbeat too late.',
            power: 1.6,
            energyGain: 20,
            anim: { type: 'slash', color: FROST },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.5)) {
                  ctx.addStatus(t, 'bleed', { duration: 2 });
                  ctx.dot(t, { name: 'Bleed', dmgPerTurn: atkOf(user, 0.4), duration: 2 });
                }
              });
            },
          }),
          M(3, {
            name: 'Blizzard Veil',
            desc: 'White above, white below, and somewhere in it, a scythe.',
            target: 'allEnemies',
            power: 0.7,
            anim: { type: 'nova', color: FROST },
          }),
          M(3, {
            name: 'Lifehunt Scythe',
            desc: 'A crescent that harvests something the body only borrows.',
            power: 1.2,
            anim: { type: 'slash', color: FROST },
          }),
        ],
      },
      phases: [
        {
          hpPct: 0.5,
          name: 'Snowfall Hides the Scythe',
          banner: 'The snow thickens, and the scythe writes in it, unseen.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.addStatus(unit, 'evasionUp', { duration: 2 });
            ctx.buff(unit, { stat: 'spd', mult: 0.2, duration: 99, name: 'Painted Blizzard' });
            ctx.log('Priscilla fades into the whiteout, leaving only falling snow.');
          },
        },
      ],
      ult: A({
        name: 'Lifehunt',
        desc: 'The one power the gods feared enough to imprison in a painting.',
        power: 2.0,
        energyCost: 110,
        energyGain: 0,
        anim: { type: 'slash', color: FROST },
        cutin: { title: 'Lifehunt', line: 'You were told to leave the painting.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            ctx.addStatus(t, 'bleed', { duration: 3 });
            ctx.dot(t, { name: 'Bleed', dmgPerTurn: atkOf(user, 0.45), duration: 3 });
          });
        },
      }),
    },

    // ====================== COVENANT GUARDIANS (new boss art batch) ======================
    {
  id: 'everlasting_dragon',
  name: 'The Everlasting Dragon',
  title: 'Warden of the Petrified Archive',
  element: 'Lightning',
  tier: 'boss',
  // Ancient armor finally giving out over a long fight — a small permanent
  // DEF stack lost every turn, independent of its phase, capped so the hide
  // doesn't dissolve entirely.
  onTurnStart(ctx, unit) {
    unit._wornStacks = unit._wornStacks || 0;
    if (unit._wornStacks < 8) {
      unit._wornStacks++;
      ctx.debuff(unit, { stat: 'def', mult: -0.025, duration: 99, name: 'Worn Scale', quiet: unit._wornStacks > 1 });
    }
  },
  base: { hp: 4700, atk: 126, def: 80, spd: 82 },
  toughness: 350,
  weak: ['Dark', 'Frost'],
  art: { palette: ['#2b2f26', '#5c6b53', '#e8c840'], icon: '🐉', aura: 'storm' },
  maxEnergy: 120,
  movesets: {
    default: [
      M(4, { name: 'Fossil Claw', desc: 'A limb unhurried by a thousand collapsed roofs, closing all the same.', power: 1.2, energyGain: 15, anim: { type: 'slash', color: PHYS } }),
      M(3, { name: 'Archivist\'s Tail', desc: 'Stone remembers every shelf it has ever emptied.', power: 1.5, toughnessDmg: 25, defPierce: 0.1, energyGain: 20, anim: { type: 'slash', color: PHYS } }),
      M(3, { name: 'Ledger-Crushing Bite', desc: 'Jaws that have outlasted the names of those who built this hall.', power: 1.35, bonusVsBroken: 0.25, energyGain: 18, anim: { type: 'pierce', color: PHYS } }),
      M(2, { name: 'Scaled Bulwark', desc: 'Settles its bulk and lets the centuries do the arguing.', target: 'self', power: 0, energyGain: 25, anim: { type: 'buff', color: PHYS },
        extra(ctx, user) { ctx.buff(user, { stat: 'def', mult: 0.4, duration: 2, name: 'Scaled Bulwark' }); ctx.log('The dragon settles, and its hide forgets it was ever soft.'); } }),
    ],
    phase2: [
      M(4, { name: 'Storm Vent', desc: 'What the scales once held, the cracks now confess.', target: 'allEnemies', power: 0.85, energyGain: 20, anim: { type: 'nova', color: LTN },
        extra(ctx, user, targets) { targets.forEach(t => { ctx.addStatus(t, 'shock', { duration: 2 }); ctx.dot(t, { name: 'Storm Vent', dmgPerTurn: atkOf(user, 0.25), duration: 2 }); }); } }),
      M(3, { name: 'Fulgurite Breath', desc: 'A held breath, centuries long, spent all at once.', target: 'splash', splash: 0.5, power: 1.3, defPierce: 0.15, energyGain: 20, anim: { type: 'beam', color: LTN },
        extra(ctx, user, targets) { targets.forEach(t => { ctx.addStatus(t, 'shock', { duration: 2 }); ctx.dot(t, { name: 'Fulgurite Breath', dmgPerTurn: atkOf(user, 0.2), duration: 2 }); }); } }),
      M(3, { name: 'Thunderhead Roar', desc: 'A sound the library was never built to survive.', target: 'allEnemies', power: 0.4, energyGain: 15, anim: { type: 'blast', color: LTN },
        extra(ctx, user, targets) { targets.forEach(t => ctx.debuff(t, { stat: 'atk', mult: -0.15, duration: 2, name: 'Thunderhead Roar' })); } }),
    ],
  },
  phases: [
    { hpPct: 0.5, name: 'The Hide Splits', banner: 'Centuries of scale give way; the storm inside remembers itself.', moveset: 'phase2',
      onEnter(ctx, unit) {
        ctx.buff(unit, { stat: 'atk', mult: 0.5, duration: 99, name: 'Unbound Storm' });
        ctx.debuff(unit, { stat: 'def', mult: -0.25, duration: 99, name: 'Fractured Scale' });
        ctx.gainEnergy(unit, 30);
        ctx.log('The Everlasting Dragon\'s hide cracks along a seam older than the archive around it, and the lightning it swallowed long ago comes looking for a way out.');
      } },
  ],
  ult: A({ name: 'Elder Cataclysm', desc: 'Every year it stood still, spent in a single instant of weather.', target: 'allEnemies', power: 2.1, energyCost: 120, energyGain: 0, anim: { type: 'nova', color: LTN },
    cutin: { title: 'The Everlasting Dragon', line: 'What the stone kept, the sky reclaims.' },
    extra(ctx, user, targets) { targets.forEach(t => { ctx.addStatus(t, 'shock', { duration: 2 }); ctx.dot(t, { name: 'Elder Cataclysm', dmgPerTurn: atkOf(user, 0.3), duration: 2 }); }); } }),
},
    {
  id: 'witch_of_izalith',
  name: 'Witch of Izalith',
  title: 'Weaver of the Flame of Chaos',
  element: 'Fire',
  tier: 'boss',
  base: { hp: 3500, atk: 122, def: 62, spd: 88 },
  toughness: 280,
  weak: ['Frost', 'Magic'],
  art: { palette: ['#170a05', '#7a2410', '#f4c542'], icon: '🧵', aura: 'ember' },
  maxEnergy: 110,
  // Once the threads have snapped (see phases), the untended flame licks every foe at the start of her turn.
  onTurnStart(ctx, unit) {
    if (!unit.chaosUnbound) return;
    ctx.foes(unit).forEach(function (t) {
      if (!t.alive) return;
      ctx.addStatus(t, 'burn', { duration: 1 });
      ctx.dot(t, { name: 'Loose Chaos', dmgPerTurn: atkOf(unit, 0.1), duration: 1 });
    });
    ctx.log('Untended, the chaos flame gutters against whoever stands nearest.');
  },
  movesets: {
    default: [
      M(4, {
        name: 'Igniting Reach',
        desc: 'Flame drawn thin as thread, and just as precise.',
        power: 1.1,
        anim: { type: 'blast', color: FIRE },
      }),
      M(3, {
        name: 'Cinderspill',
        desc: 'The pit answers her gesture, and molten light spills toward the nearest breath.',
        target: 'splash',
        splash: 0.5,
        power: 0.85,
        energyGain: 20,
        anim: { type: 'nova', color: FIRE },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            if (DS.RNG.chance(0.3)) {
              ctx.addStatus(t, 'burn', { duration: 2 });
              ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
            }
          });
        },
      }),
      M(3, {
        name: 'Molten Thread',
        desc: 'A single filament, drawn white-hot and drawn straight through armor.',
        power: 1.3,
        defPierce: 0.15,
        anim: { type: 'pierce', color: FIRE },
      }),
      M(3, {
        name: 'Weave the Chaos Flame',
        desc: 'Threads of light spool from her fingers into the pit below; the fire remembers being given a shape, and grows fonder of it.',
        target: 'self',
        power: 0,
        energyGain: 30,
        anim: { type: 'ritual', color: FIRE },
        extra(ctx, user) {
          ctx.buff(user, { stat: 'dmg', mult: 0.12, duration: 99, name: 'Chaos Thread' });
          ctx.log('Another thread draws taut. The flame in the pit answers her a little more.');
        },
      }),
    ],
    phase2: [
      M(4, {
        name: 'Unbound Cinderspill',
        desc: 'The pit no longer waits for her gesture. It simply spills.',
        target: 'allEnemies',
        power: 0.9,
        energyGain: 20,
        anim: { type: 'nova', color: FIRE },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            if (DS.RNG.chance(0.35)) {
              ctx.addStatus(t, 'burn', { duration: 2 });
              ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
            }
          });
        },
      }),
      M(3, {
        name: 'Molten Thread',
        desc: 'A single filament, drawn white-hot and drawn straight through armor.',
        power: 1.3,
        defPierce: 0.15,
        anim: { type: 'pierce', color: FIRE },
      }),
      M(3, {
        name: 'Last Pattern',
        desc: 'She still remembers the shape, even as her hold on it burns away.',
        power: 1.5,
        energyGain: 20,
        anim: { type: 'blast', color: FIRE },
      }),
    ],
  },
  phases: [
    {
      hpPct: 0.5,
      name: 'The Threads Slip Her Hands',
      banner: 'What she wove to kneel forgets, all at once, how to be told.',
      moveset: 'phase2',
      onEnter(ctx, unit) {
        ctx.cleanse(unit);
        ctx.buff(unit, { stat: 'atk', mult: 0.3, duration: 99, name: 'Unbound Flame' });
        ctx.buff(unit, { stat: 'dmg', mult: 0.2, duration: 99, name: 'Unbound Flame' });
        unit.chaosUnbound = true;
        ctx.log('The luminous threads snap between her fingers. The pit needs no permission now.');
      },
    },
  ],
  ult: A({
    name: 'A Shape Remembered',
    desc: 'For one breath the chaos is not hunger. It is her hand again, and the fire remembers being held.',
    target: 'allEnemies',
    power: 1.4,
    energyCost: 110,
    energyGain: 0,
    anim: { type: 'nova', color: FIRE },
    cutin: { title: 'A Shape Remembered', line: 'Once, I gave it a shape it wanted to keep.' },
    extra(ctx, user, targets) {
      targets.forEach(function (t) {
        if (DS.RNG.chance(0.4)) {
          ctx.addStatus(t, 'burn', { duration: 2 });
          ctx.dot(t, { name: 'Burn', dmgPerTurn: atkOf(user, 0.3), duration: 2 });
        }
      });
    },
  }),
},
    {
  id: 'way_of_white_knights',
  name: 'White Vow Knight',
  title: 'Nameless Shield of the Faithful',
  element: 'Holy',
  tier: 'elite',
  base: { hp: 620, atk: 74, def: 52, spd: 98 },
  toughness: 100,
  weak: ['Dark', 'Magic'],
  art: { palette: ['#f2ecd9', '#c9a24b', '#8f8367'], icon: '🛡', aura: 'holy' },
  maxEnergy: 100,
  movesets: {
    default: [
      M(4, { name: 'Sunlight Blade', desc: 'A vow made steel, swung the way old prayers are said: from memory, not thought.', hits: 1, power: 0.85, anim: { type: 'slash', color: HOLY } }),
      M(3, { name: 'Judgment Thrust', desc: 'The oath finds the seam the armor forgot to cover. It always does.', power: 1.25, defPierce: 0.15, bonusVsDebuffed: 0.15, energyGain: 20, anim: { type: 'pierce', color: HOLY } }),
      M(3, { name: 'Blessed Ward', desc: 'A murmured rite passed knight to knight, older than any one of them standing here.', target: 'allAllies', power: 0, energyGain: 20, anim: { type: 'buff', color: HOLY },
        extra(ctx, user, targets) {
          targets.forEach(t => { ctx.heal(t, atkOf(user, 0.45), user); ctx.shield(t, atkOf(user, 0.35)); });
        } }),
    ],
  },
  onAllyDeath(ctx, unit, fallen) {
    if (!fallen || fallen.defId !== 'way_of_white_knights') return;
    ctx.buff(unit, { stat: 'atk', mult: 0.15, duration: 99, name: 'Closing Ranks' });
    ctx.buff(unit, { stat: 'def', mult: 0.2, duration: 99, name: 'Closing Ranks' });
    ctx.shield(unit, Math.round(unit.stats.hp * 0.15));
    ctx.log('The remaining knights close ranks, faith drawn tighter over the gap where a brother stood.');
  },
  ult: A({ name: 'Vow Unbroken', desc: 'Three vows spoken as one; the light does not ask whose hand carried it.', power: 1.8, energyCost: 100, energyGain: 0, bonusVsDebuffed: 0.2, anim: { type: 'beam', color: HOLY },
    extra(ctx, user) {
      ctx.buff(user, { stat: 'def', mult: 0.15, duration: 2, name: 'Vow Unbroken' });
    } }),
},
    {
  id: 'hollowed_solaire',
  name: 'Hollowed Solaire',
  title: 'The Knight Who Outlived His Sun',
  element: 'Lightning',
  tier: 'boss',
  // Hollowing costs him, and he spends it anyway — every 3rd turn, a small
  // self-inflicted wound in exchange for a real ATK buff.
  onTurnStart(ctx, unit) {
    unit._hollowTicks = (unit._hollowTicks || 0) + 1;
    if (unit._hollowTicks % 3 === 0) {
      ctx.dealBonusTrueDamage(unit, unit, Math.round(unit.stats.hp * 0.04));
      if (unit.alive) {
        ctx.buff(unit, { stat: 'atk', mult: 0.2, duration: 2, name: 'Hollow Toll' });
        ctx.log('Hollowed Solaire tears at his own hollowing flesh for the strength beneath it.');
      }
    }
  },
  base: { hp: 3900, atk: 130, def: 66, spd: 102 },
  toughness: 300,
  weak: ['Frost', 'Dark'],
  art: { palette: ['#1c1408', '#e2662c', '#e8c840'], icon: '☀', aura: 'storm' },
  maxEnergy: 120,
  movesets: {
    default: [
      M(4, { name: 'Molten Greatsword Arc', desc: 'A sword that once blessed now only scorches; the swing remembers a duty it can no longer name.', hits: 1, power: 1.15, anim: { type: 'slash', color: FIRE } }),
      M(3, { name: "Judgment's Echo", desc: 'Two strikes, one memory: a knight who judged himself first, and found no mercy waiting there.', hits: 2, power: 0.65, anim: { type: 'slash', color: LTN } }),
      M(2, { name: 'Storm-Wracked Lunge', desc: "He falls the way lightning falls — without asking the ground's permission.", power: 1.4, defPierce: 0.15, energyGain: 20, anim: { type: 'pierce', color: LTN } }),
      M(2, { name: 'Sunburst Ruin', desc: 'A burst meant for gathering friends, spent now on strangers who will not stay to share the warmth.', target: 'allEnemies', power: 0.55, energyGain: 20, anim: { type: 'nova', color: FIRE } }),
      M(2, { name: 'Praise the Sun (Broken)', desc: "An old oath, shouted at a sky gone dark, fists raised to a sun that isn't there. His arm remembers the gesture before his mind remembers why.", target: 'self', power: 0, energyGain: 10, anim: { type: 'buff', color: FIRE },
        extra(ctx, user) {
          ctx.buff(user, { stat: 'atk', mult: 0.5, duration: 2, name: 'Hollow Communion' });
          ctx.log('Hollowed Solaire throws back his head and howls a greeting to no one.');
        } }),
    ],
    phase2: [
      M(4, { name: 'Feral Lightning Cleave', desc: 'The blade no longer cuts so much as convulses — grief, made kinetic.', hits: 1, power: 1.5, anim: { type: 'slash', color: LTN } }),
      M(3, { name: 'Mountaintop Convulsion', desc: 'The peak shudders with him now; stone and storm have forgotten which of them he is.', target: 'allEnemies', power: 0.75, energyGain: 25, anim: { type: 'nova', color: FIRE } }),
      M(3, { name: 'Screaming Bolt', desc: 'A cry given voltage, aimed at whatever still resembles company.', power: 1.7, defPierce: 0.25, energyGain: 25, anim: { type: 'beam', color: LTN } }),
      M(2, { name: 'Ashen Frenzy', desc: 'Three wild cuts where one would have done. He has stopped counting. He has stopped aiming. He has stopped hoping.', hits: 3, power: 0.55, energyGain: 20, anim: { type: 'slash', color: FIRE } }),
    ],
  },
  phases: [
    { hpPct: 0.5, name: 'The Search Ends', banner: 'He Stops Looking For His Sun', moveset: 'phase2',
      onEnter(ctx, unit) {
        ctx.buff(unit, { stat: 'atk', mult: 0.5, duration: 99, name: 'Hollow Zeal' });
        ctx.debuff(unit, { stat: 'def', mult: -0.2, duration: 99, name: 'Abandoned Guard' });
        ctx.log('Something in him finally lets go. He stops guarding, stops searching, and simply burns.');
      } },
  ],
  ult: A({ name: "Solaire's Last Ember", desc: 'A final, furious cast of everything left in him — warmth turned to weapon, one more time, for no one in particular.', target: 'splash', splash: 0.35, power: 2.2, defPierce: 0.2, energyCost: 120, energyGain: 0, anim: { type: 'blast', color: FIRE },
    cutin: { title: 'Hollowed Solaire, Sun\'s Cast-Off', line: "He still calls it praise — the word outlived the man who meant it, and outlives him now." },
    extra(ctx, user, targets) {
      targets.forEach(t => {
        ctx.addStatus(t, 'burn', { duration: 2 });
        ctx.addStatus(t, 'shock', { duration: 2 });
        ctx.dot(t, { name: 'Molten Ruin', dmgPerTurn: atkOf(user, 0.35), duration: 2 });
      });
    } }),
},
    {
  id: 'gwyndolin_boss',
  name: 'Gwyndolin',
  title: 'The Borrowed Sun, Judge of the Blue Moon',
  element: 'Magic',
  tier: 'boss',
  base: { hp: 4100, atk: 132, def: 68, spd: 94 },
  toughness: 310,
  weak: ['Physical', 'Fire'],
  art: { palette: ['#161a2e', '#c9a86a', '#dce6f2'], icon: '🌙', aura: 'moonlight' },
  maxEnergy: 120,
  movesets: {
    default: [
      M(4, { name: 'Crescent Bolt', desc: 'A sliver of moonlight, thrown like an afterthought that still finds the throat.', power: 0.9, toughnessDmg: 8, anim: { type: 'blast', color: MAG } }),
      M(3, { name: 'Conjure Darkmoon Blade', desc: 'He was never truly alone in this hall; the blue moon lends its knights to the faithful and the feared alike.', target: 'self', power: 0, energyGain: 20, anim: { type: 'ritual', color: MAG },
        extra(ctx, user) {
          ctx.summonReinforcement(user, { id: 'silver_knight', level: user.level, statMult: 0.45 });
          ctx.log('A second moon-pale knight steps from the shadow of a pillar, summoned rather than sworn.');
        } }),
      M(3, { name: 'Veil of Illusions', desc: 'The golden mask tilts, and the shape beneath it becomes a rumor.', target: 'self', power: 0, energyGain: 25, anim: { type: 'buff', color: MAG },
        extra(ctx, user) { ctx.addStatus(user, 'evasionUp', { duration: 3 }); } }),
      M(2, { name: 'Lingering Moonlight', desc: 'Old light takes its time arriving, and takes its time leaving.', target: 'splash', splash: 0.35, power: 0.75, toughnessDmg: 6, anim: { type: 'nova', color: MAG } }),
    ],
    phase2: [
      M(4, { name: 'Moonlight Judgment', desc: 'No longer hidden, no longer merciful — the truth of him is a wound that reads like scripture.', power: 1.3, toughnessDmg: 15, bonusVsDebuffed: 0.15, anim: { type: 'beam', color: MAG },
        extra(ctx, user, targets) { const t = targets[0]; if (t) ctx.addStatus(t, 'hex', { duration: 2 }); } }),
      M(3, { name: 'Blinding Crescent', desc: 'A last kindness withheld: the world goes white before it goes dark.', target: 'allEnemies', power: 0.6, anim: { type: 'nova', color: MAG },
        extra(ctx, user, targets) { targets.forEach(t => ctx.addStatus(t, 'blind', { duration: 2 })); } }),
      M(3, { name: "Serpent's Truth", desc: 'The serpents at his feet were never just stone; neither, it turns out, was he.', power: 1.5, defPierce: 0.25, toughnessDmg: 12, anim: { type: 'pierce', color: MAG } }),
    ],
  },
  phases: [
    { hpPct: 0.5, name: 'The Mask Cracks', banner: 'The Borrowed Sun Slips',
      moveset: 'phase2',
      onEnter(ctx, unit) {
        ctx.cleanse(unit);
        ctx.buff(unit, { stat: 'atk', mult: 0.35, duration: 99, name: 'Unveiled Judgment' });
        ctx.buff(unit, { stat: 'critRate', mult: 0.3, duration: 99, name: 'Unveiled Judgment' });
        ctx.log('Gold cracks and falls away; beneath, a colder light judges without a face left to hide behind.');
      } },
    // The mask's last, quiet trick — one more illusion held in reserve, spent
    // only once he's truly cornered.
    { hpPct: 0.25, name: 'One Last Illusion', banner: 'Even judgment lies, when it is desperate enough.',
      moveset: 'phase2',
      onEnter(ctx, unit) {
        ctx.shield(unit, atkOf(unit, 1.2));
        ctx.addStatus(unit, 'evasionUp', { duration: 2 });
        ctx.log('One last illusion folds over him, thin and cornered as it is.');
      } },
  ],
  ult: A({ name: 'Twilight Verdict', desc: 'The mask tilts skyward; the moon does not forgive twice.', target: 'allEnemies', power: 1.6, energyCost: 120, energyGain: 0, anim: { type: 'nova', color: MAG },
    cutin: { title: 'Gwyndolin, Dark Sun', line: 'Judgment falls where the moonlight cannot lie.' },
    extra(ctx, user, targets) { targets.forEach(t => ctx.addStatus(t, 'hex', { duration: 2 })); } }),
},
    {
  id: 'darkwraith_knights',
  name: 'Darkwraith Knight',
  title: 'Exile of the Drowned Court',
  element: 'Dark',
  tier: 'elite',
  base: { hp: 880, atk: 106, def: 62, spd: 106 },
  toughness: 160,
  weak: ['Holy', 'Fire'],
  art: { palette: ['#100e14', '#3d1f42', '#8b2035'], icon: '⚔', aura: 'dark' },
  maxEnergy: 100,
  movesets: {
    default: [
      M(5, { name: 'Dark Hand', desc: "The exile's first sacrament: a grip that takes, and does not give back.", power: 1.0, energyGain: 15, anim: { type: 'slash', color: DARK },
        extra(ctx, user, targets, allies, dmgDealt) {
          if (dmgDealt > 0) ctx.heal(user, Math.round(dmgDealt * (0.3 + (user.lifestealBonus || 0))));
        } }),
      M(3, { name: 'Crimson Cross', desc: 'Two strokes of stolen steel, crossed like a vow none of them kept.', hits: 2, power: 0.65, defPierce: 0.15, energyGain: 18, anim: { type: 'slash', color: DARK },
        extra(ctx, user, targets) {
          const t = targets[Math.floor(Math.random() * targets.length)];
          if (t) ctx.addStatus(t, 'curse', { duration: 2 });
        } }),
      M(2, { name: 'Drowned Oath', desc: 'A pact renewed in black water, binding blade to blade to bone.', target: 'allAllies', power: 0, energyGain: 20, anim: { type: 'buff', color: DARK },
        extra(ctx, user, targets) {
          targets.forEach(t => ctx.buff(t, { stat: 'atk', mult: 0.12, duration: 2, name: 'Drowned Oath' }));
          ctx.log(`${user.name} renews the exiles' oath; the water remembers every name spoken into it.`);
        } }),
    ],
  },
  onAllyDeath(ctx, unit, fallen) {
    if (!fallen || fallen.defId !== 'darkwraith_knights') return;
    unit.lifestealBonus = (unit.lifestealBonus || 0) + 0.15;
    ctx.buff(unit, { stat: 'atk', mult: 0.2, duration: 99, name: 'Vengeance of the Exiled' });
    ctx.gainEnergy(unit, 20);
    ctx.log(`${unit.name} tastes a brother's ending in the black water, and answers it with more of the dark.`);
  },
  ult: A({ name: 'Black Water Reckoning', desc: 'The three make an end of it together; the flood closes over a single drowning name.', power: 2.2, defPierce: 0.2, energyCost: 100, energyGain: 0, anim: { type: 'beam', color: DARK },
    extra(ctx, user, targets, allies, dmgDealt) {
      if (dmgDealt > 0) ctx.heal(user, Math.round(dmgDealt * (0.3 + (user.lifestealBonus || 0))));
      if (targets[0]) ctx.addStatus(targets[0], 'curse', { duration: 3 });
    },
    cutin: { title: 'Exiles of New Londo', line: 'Three oaths, one blade, and the water rising still.' } }),
},
    // Fortress-only special encounter — the 'A Sleeping Giant' event's 50%
    // "wake him" outcome (see DS.FORTRESS_EVENTS/resolveEvent in
    // js/engine/fortress.js). Groggy and slow while under half HP, then
    // fully awake and dangerous past it.
    {
      id: 'sleeping_giant',
      name: 'The Sleeping Giant',
      title: 'Cairn-Bound Titan',
      element: 'Physical',
      tier: 'boss',
      // Literally still half-asleep, not just narratively — a 20% chance,
      // only while still groggy (default moveset), that its breathing slows
      // and its next action is lost entirely.
      onTurnStart(ctx, unit) {
        if (unit.moveset === 'default' && DS.RNG.chance(0.2)) {
          ctx.addStatus(unit, 'freeze', { duration: 1 });
          ctx.log('The Sleeping Giant\'s breathing slows. Perhaps it never really woke at all.');
        }
      },
      base: { hp: 3400, atk: 92, def: 78, spd: 68 },
      toughness: 260,
      weak: ['Lightning', 'Fire'],
      art: { palette: ['#14130f', '#4a4438', '#8f9a7c'], icon: '🗿', aura: 'soul' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, { name: 'Drowsy Backhand', desc: 'Half-woken, the blow still lands like a falling wall.', power: 0.85, anim: { type: 'blast', color: PHYS } }),
          M(3, { name: 'Slumbering Exhale', desc: 'Even unwaked, its breath alone is enough to crack the floor tiles underfoot.', target: 'allEnemies', power: 0.45, energyGain: 20, anim: { type: 'nova', color: PHYS },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { if (DS.RNG.chance(0.3)) ctx.debuff(t, { stat: 'spd', mult: -0.15, duration: 2, name: 'Rattled' }); });
            } }),
          M(2, { name: 'Restless Turn', desc: 'It only shifts where it lies — and something was in the way.', power: 0.6, anim: { type: 'slash', color: PHYS } }),
        ],
        phase2: [
          M(4, { name: 'Wakened Fury', desc: 'Two hundred years of sleep, spent all at once.', power: 1.3, anim: { type: 'blast', color: PHYS } }),
          M(3, { name: 'Earthshatter Stomp', desc: 'The floor of the world files a complaint.', target: 'allEnemies', power: 1.0, energyGain: 20, anim: { type: 'nova', color: PHYS } }),
          M(2, { name: 'Boulder Fling', desc: 'He was using that as a pillow.', power: 1.15, defPierce: 0.1, anim: { type: 'slash', color: PHYS } }),
        ],
      },
      phases: [
        {
          hpPct: 0.55,
          name: 'Fully Woken',
          banner: 'The giant\'s eyes open at last — and he is furious about it.',
          moveset: 'phase2',
          onEnter(ctx, unit) {
            ctx.buff(unit, { stat: 'atk', mult: 0.3, duration: 99, name: 'Wakened Fury' });
            ctx.buff(unit, { stat: 'spd', mult: 0.25, duration: 99, name: 'Wakened Fury' });
            ctx.actionAdvance(unit, 0.3);
            ctx.log('The Sleeping Giant is sleeping no longer.');
          },
        },
      ],
      ult: A({ name: 'Titanfall', desc: 'He remembers, briefly, being worshipped — and acts accordingly.', target: 'allEnemies', power: 1.5, energyCost: 100, energyGain: 0, anim: { type: 'nova', color: PHYS },
        cutin: { title: 'TITANFALL', line: 'Two hundred years of sleep. He is not in a good mood.' } }),
    },

    {
      id: 'star_eater',
      name: 'The Star-Eater',
      title: 'Husk of a Dead Comet',
      element: 'Frost',
      tier: 'boss',
      // The cold thickening around whatever it's already touched — a DEF
      // buff each turn, scaled to how many foes are currently debuffed.
      onTurnStart(ctx, unit) {
        const debuffedCount = ctx.foes(unit).filter(function (f) {
          return f.alive && ((f.buffs || []).some(function (b) { return b.mult < 0; }) || (f.statuses || []).some(function (s) { return (DS.STATUS[s.id] || {}).kind !== 'buff'; }));
        }).length;
        if (debuffedCount > 0) {
          ctx.buff(unit, { stat: 'def', mult: 0.08 * debuffedCount, duration: 1, name: 'Deepening Cold', quiet: true });
        }
      },
      base: { hp: 2800, atk: 112, def: 58, spd: 98 },
      toughness: 240,
      weak: ['Fire', 'Holy'],
      art: { palette: ['#05070c', '#1c2c38', '#8fd8e8'], icon: '🐍', aura: 'frost' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Glassfang Bite',
            desc: 'Its teeth are cracked crystal, and no less sharp for it.',
            power: 1.0,
            anim: { type: 'pierce', color: FROST },
          }),
          M(3, {
            name: 'Comet\'s Wake',
            desc: 'It passes low, and the cold trailing behind it settles straight into the bone.',
            target: 'allEnemies',
            power: 0.5,
            energyGain: 20,
            anim: { type: 'nova', color: FROST },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.25)) ctx.addStatus(t, 'freeze', { duration: 1 });
              });
            },
          }),
          M(2, {
            name: 'Fractured Coil',
            desc: 'It draws itself tight, and the cracks along its hide flare a colder white.',
            target: 'self',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: FROST },
            extra(ctx, user) {
              ctx.buff(user, { stat: 'def', mult: 0.3, duration: 2, name: 'Fractured Coil' });
            },
          }),
        ],
      },
      ult: A({
        name: 'The Long Cold',
        desc: 'Everything it has swallowed since its own sky went dark, given back at once.',
        target: 'allEnemies',
        power: 1.35,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'serpent_bite', color: FROST },
        cutin: { title: 'THE LONG COLD', line: 'It remembers being warm. It remembers being fed.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) {
            ctx.debuff(t, { stat: 'spd', mult: -0.15, duration: 2, name: 'Deep Chill' });
          });
        },
      }),
    },

    // ==================== Crown of the Cosmos bosses ====================
    // Five bosses for the new "Crown of the Cosmos" gauntlet (see DS.BOSS_RUSHES.cosmos,
    // js/data/encounters.js) — tier:'boss' like every entry above, so they also join the
    // same shared Fortress boss-floor pool automatically, exactly like Crown of Cinders'
    // own roster already does.
    {
      id: 'unblinking_choir',
      name: 'The Unblinking Choir',
      title: 'A Thousand Eyes That Never Sleep',
      element: 'Holy',
      tier: 'boss',
      // Permanently more precise the longer the fight runs (capped), and every
      // turn it marks whichever foe is weakest — a congregation that judges
      // rather than prays.
      onTurnStart(ctx, unit) {
        unit._gazeStacks = unit._gazeStacks || 0;
        if (unit._gazeStacks < 8) {
          unit._gazeStacks++;
          ctx.buff(unit, { stat: 'critRate', mult: 0.035, duration: 99, name: 'Unbroken Gaze', quiet: unit._gazeStacks > 1 });
        }
        const alive = ctx.foes(unit).filter(function (f) { return f.alive; });
        if (alive.length) {
          const watched = alive.reduce(function (a, b) { return (a.hp / a.stats.hp < b.hp / b.stats.hp) ? a : b; });
          ctx.addStatus(watched, 'vulnerability', { duration: 2 });
        }
      },
      base: { hp: 3400, atk: 108, def: 68, spd: 90 },
      toughness: 260,
      weak: ['Dark', 'Physical'],
      art: { palette: ['#0d0a14', '#241b30', '#e8dc9a'], icon: '👁', aura: 'holy' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Thousand-Lidded Stare',
            desc: 'Every eye opens at once, and there is nowhere left that isn\'t being watched.',
            power: 0.95,
            anim: { type: 'blast', color: HOLY },
          }),
          M(3, {
            name: 'Chorus of Judgment',
            desc: 'A hundred mouths that were never meant for speech recite the same verdict together.',
            target: 'allEnemies',
            power: 0.55,
            anim: { type: 'nova', color: HOLY },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.addStatus(t, 'judgment', { duration: 2 }); });
            },
          }),
          M(2, {
            name: 'Every Eye at Once',
            desc: 'It does not blink, and it does not choose — it simply looks, and the looking is enough.',
            power: 1.2,
            energyGain: 20,
            anim: { type: 'pierce', color: HOLY },
          }),
        ],
      },
      ult: A({
        name: 'The Congregation Opens',
        desc: 'Every eye it has ever grown opens at once, and for one moment the whole of it is looking at you alone.',
        target: 'allEnemies',
        power: 1.5,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'ritual', color: HOLY },
        cutin: { title: 'THE CONGREGATION OPENS', line: 'A thousand eyes, and not one of them merciful.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) { ctx.addStatus(t, 'judgment', { duration: 2 }); });
        },
      }),
    },
    {
      id: 'maw_of_the_deep_dark',
      name: 'Maw of the Deep Dark',
      title: 'Where Light Goes to Starve',
      element: 'Dark',
      tier: 'boss',
      // Every one of its own turns it siphons Energy from every foe still
      // standing and converts a share of it into its own — it takes what it
      // needs, and it always needs more.
      onTurnStart(ctx, unit) {
        const alive = ctx.foes(unit).filter(function (f) { return f.alive; });
        let drained = 0;
        alive.forEach(function (f) {
          const before = f.energy;
          ctx.drainEnergy(f, 8);
          drained += Math.max(0, before - f.energy);
        });
        if (drained > 0) ctx.gainEnergy(unit, Math.round(drained * 0.5));
      },
      base: { hp: 3800, atk: 105, def: 70, spd: 80 },
      toughness: 300,
      weak: ['Holy', 'Fire'],
      art: { palette: ['#050505', '#2a2a30', '#8a8a94'], icon: '🕳', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Starved Reach',
            desc: 'Something closes around you that was never quite a hand.',
            power: 1.0,
            anim: { type: 'pierce', color: DARK },
          }),
          M(3, {
            name: 'Event Horizon',
            desc: 'The space between you and it simply stops being a safe distance.',
            target: 'allEnemies',
            power: 0.6,
            anim: { type: 'nova', color: DARK },
            extra(ctx, user, targets, allies, dmgDealt) {
              if (dmgDealt > 0) ctx.heal(user, Math.round(dmgDealt * 0.25));
            },
          }),
          M(2, {
            name: 'Last Light In',
            desc: 'Whatever brightness you were holding onto, it wants that too.',
            power: 1.15,
            energyGain: 18,
            anim: { type: 'blast', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.drainEnergy(t, 15); });
            },
          }),
        ],
      },
      ult: A({
        name: 'Where Light Goes to Starve',
        desc: 'Everything you were saving for later, it takes now, all at once.',
        target: 'allEnemies',
        power: 1.6,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'ritual', color: DARK },
        cutin: { title: 'WHERE LIGHT GOES TO STARVE', line: 'It was always going to be hungry again.' },
        extra(ctx, user, targets, allies, dmgDealt) {
          if (dmgDealt > 0) ctx.heal(user, Math.round(dmgDealt * 0.4));
          targets.forEach(function (t) { ctx.drainEnergy(t, 20); });
        },
      }),
    },
    {
      id: 'withered_bloom',
      name: 'The Withered Bloom',
      title: 'A Garden That Forgot the Sun',
      element: 'Dark',
      tier: 'boss',
      // Spreads its own signature blight to every foe each turn and feeds on
      // however many are currently rotting — a garden that grows by spending
      // what's near it, not by reaching for the sun.
      onTurnStart(ctx, unit) {
        const alive = ctx.foes(unit).filter(function (f) { return f.alive; });
        alive.forEach(function (f) { ctx.dot(f, { name: 'Withering', dmgPerTurn: Math.round(atkOf(unit, 0.1)), duration: 3 }); });
        const blighted = alive.filter(function (f) { return (f.dots || []).some(function (d) { return d.name === 'Withering'; }); }).length;
        if (blighted > 0) ctx.heal(unit, Math.round(unit.stats.hp * 0.015 * blighted));
      },
      base: { hp: 3200, atk: 106, def: 62, spd: 82 },
      toughness: 240,
      weak: ['Fire', 'Lightning'],
      art: { palette: ['#0a0806', '#241f1a', '#e2662c'], icon: '🥀', aura: 'dark' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Thornfall',
            desc: 'Thorns rain down like something that used to be petals.',
            power: 1.0,
            anim: { type: 'pierce', color: DARK },
          }),
          M(3, {
            name: 'Root-Bound Grasp',
            desc: 'Roots close around your ankles, patient as everything else about it.',
            power: 0.85,
            anim: { type: 'slash', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.debuff(t, { stat: 'spd', mult: -0.2, duration: 2, name: 'Root-Bound' }); });
            },
          }),
          M(2, {
            name: 'Bloom of Rot',
            desc: 'Something opens where a flower should be, and it is not petals that come out.',
            target: 'allEnemies',
            power: 0.6,
            energyGain: 15,
            anim: { type: 'nova', color: DARK },
          }),
        ],
      },
      ult: A({
        name: 'A Garden That Forgot the Sun',
        desc: 'Every root it has ever grown closes in at once, and there is no more warmth left to reach for.',
        target: 'allEnemies',
        power: 1.4,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'ritual', color: DARK },
        cutin: { title: 'A GARDEN THAT FORGOT THE SUN', line: 'It only wanted to grow. It just forgot what growing was for.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) { ctx.dot(t, { name: 'Withering', dmgPerTurn: Math.round(atkOf(user, 0.15)), duration: 3 }); });
        },
      }),
    },
    {
      id: 'thousandfold',
      name: 'The Thousandfold',
      title: 'One Hunger, Wearing Many Wings',
      element: 'Lightning',
      tier: 'boss',
      // Reactive rather than scheduled — if it took a heavy hit since its last
      // turn, it comes apart into a scattering burst of evasion and speed
      // before reforming, rather than following any fixed timer.
      onTurnStart(ctx, unit) {
        const lastHp = (unit._lastHpSeen === undefined) ? unit.hp : unit._lastHpSeen;
        const dmgTaken = Math.max(0, lastHp - unit.hp);
        if (dmgTaken > unit.stats.hp * 0.12) {
          ctx.addStatus(unit, 'evasionUp', { duration: 2 });
          ctx.buff(unit, { stat: 'spd', mult: 0.3, duration: 2, name: 'Scattered Wings' });
          ctx.log('It comes apart into a thousand pieces, and every piece is still moving.');
        }
        unit._lastHpSeen = unit.hp;
      },
      base: { hp: 2800, atk: 112, def: 56, spd: 118 },
      toughness: 210,
      weak: ['Frost', 'Physical'],
      art: { palette: ['#16181c', '#2e3238', '#c8c8d0'], icon: '🦋', aura: 'storm' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Wingbeat Storm',
            desc: 'It is not one thing hitting you. It was never going to be one thing.',
            target: 'allEnemies',
            power: 0.5,
            hits: 3,
            anim: { type: 'slash', color: LTN },
          }),
          M(3, {
            name: 'Too Many to Watch',
            desc: 'Pick a wing to follow. There will be another where you weren\'t looking.',
            power: 0.9,
            anim: { type: 'pierce', color: LTN },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.addStatus(t, 'blind', { duration: 2 }); });
            },
          }),
          M(2, {
            name: 'Scatter and Reform',
            desc: 'It falls apart to avoid you, then remembers to be one thing again, right on top of you.',
            power: 1.15,
            energyGain: 18,
            anim: { type: 'blast', color: LTN },
          }),
        ],
      },
      ult: A({
        name: 'One Hunger, Wearing Many Wings',
        desc: 'Every wing it owns beats at once, and for a moment there is no telling how many of it there really are.',
        target: 'allEnemies',
        power: 1.45,
        hits: 2,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'ritual', color: LTN },
        cutin: { title: 'ONE HUNGER, WEARING MANY WINGS', line: 'Count them if you can. Nobody has, yet.' },
      }),
    },
    {
      id: 'cooling_heart',
      name: 'The Cooling Heart',
      title: 'What\'s Left When a Star Stops Burning',
      element: 'Fire',
      tier: 'boss',
      // Should be dying down over the course of the fight and isn't — every
      // turn it steals a little warmth (Energy) from a random foe and turns
      // it into a small permanent ATK stack (capped) instead.
      onTurnStart(ctx, unit) {
        unit._reheatStacks = unit._reheatStacks || 0;
        if (unit._reheatStacks < 8) {
          const alive = ctx.foes(unit).filter(function (f) { return f.alive; });
          if (alive.length) {
            const t = DS.RNG.pick(alive);
            ctx.drainEnergy(t, 10);
            unit._reheatStacks++;
            ctx.buff(unit, { stat: 'atk', mult: 0.03, duration: 99, name: 'Stolen Warmth', quiet: unit._reheatStacks > 1 });
            ctx.log('It was never going to cool, not while there was still warmth nearby to take.');
          }
        }
      },
      base: { hp: 3000, atk: 114, def: 66, spd: 88 },
      toughness: 250,
      weak: ['Frost', 'Holy'],
      art: { palette: ['#0a0908', '#1c1a18', '#e2662c'], icon: '☄', aura: 'ember' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Cracked Radiance',
            desc: 'Light spills from the fractures in it, the kind that used to mean something was alive.',
            power: 1.0,
            anim: { type: 'blast', color: FIRE },
          }),
          M(3, {
            name: 'Ember-Choked Grasp',
            desc: 'What closes around you was a hand once, back when it had a reason to be.',
            power: 0.85,
            anim: { type: 'slash', color: FIRE },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.addStatus(t, 'burn', { duration: 2 }); });
            },
          }),
          M(2, {
            name: 'Collapsing Heat',
            desc: 'It draws inward like something about to go out, and then it doesn\'t.',
            target: 'allEnemies',
            power: 0.55,
            energyGain: 15,
            anim: { type: 'nova', color: FIRE },
          }),
        ],
      },
      ult: A({
        name: 'What\'s Left When a Star Stops Burning',
        desc: 'It takes just enough warmth from everyone nearby to keep from having to finish dying.',
        target: 'allEnemies',
        power: 1.4,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'ritual', color: FIRE },
        cutin: { title: 'WHAT\'S LEFT WHEN A STAR STOPS BURNING', line: 'Dying was supposed to be the easy part.' },
        extra(ctx, user, targets, allies, dmgDealt) {
          targets.forEach(function (t) { ctx.drainEnergy(t, 15); });
          if (dmgDealt > 0) ctx.heal(user, Math.round(dmgDealt * 0.2));
        },
      }),
    },

    // A late-run fodder entry — minFloor gates it out of the shallow floors
    // entirely (see rollNodeData's node.kind==='normal' branch, js/engine/
    // fortress.js), so it only starts turning up once a descent is already
    // deep enough that "a piece of someone" walking around unattended reads
    // as ominous rather than just another early hollow.
    {
      id: 'humanity',
      name: 'Humanity',
      title: 'A Piece That Remembers Being Whole',
      element: 'Dark',
      tier: 'fodder',
      minFloor: 12,
      base: { hp: 340, atk: 60, def: 28, spd: 98 },
      toughness: 65,
      weak: ['Holy', 'Fire'],
      art: { palette: ['#0a0908', '#221f1c', '#efe8d4'], icon: '🖤', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(3, {
            name: 'Grasping Reach',
            desc: 'It remembers having hands for this, once.',
            power: 0.85,
            anim: { type: 'pierce', color: DARK },
          }),
          M(2, {
            name: 'Hollow Whisper',
            desc: 'It says something. There is no throat behind the voice.',
            power: 0.6,
            energyGain: 20,
            anim: { type: 'blast', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.debuff(t, { stat: 'atk', mult: -0.1, duration: 2, name: 'Unnerved' }); });
            },
          }),
        ],
      },
    },

    // ==================== Fortress finale — grounded fodder ====================
    // Non-cosmic "normal" enemies for the same late-floor expansion — the
    // fortress's own guards, beasts, and thralls, twisted but still mundane
    // (see js/engine/fortress.js rollNodeData's tier==='fodder' branch, gated
    // by minFloor same as Humanity above).
    {
      id: 'rotguard_sentinel',
      name: 'Rotguard Sentinel',
      title: 'Loyalty That Outlasted the Body',
      element: 'Physical',
      tier: 'fodder',
      minFloor: 8,
      base: { hp: 420, atk: 58, def: 42, spd: 88 },
      toughness: 85,
      weak: ['Fire', 'Holy'],
      art: { palette: ['#1c1a17', '#4a4238', '#8a7a5c'], icon: '🛡', aura: 'none' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(3, {
            name: 'Rusted Thrust',
            desc: 'The spear remembers its reach, even if the arm behind it has forgotten most everything else.',
            power: 0.9,
            anim: { type: 'pierce', color: PHYS },
          }),
          M(2, {
            name: 'Hollow Bulwark',
            desc: 'It braces behind a broken shield-arm — the line was never supposed to break, and some part of it still believes that.',
            power: 0,
            energyGain: 10,
            anim: { type: 'slash', color: PHYS },
            extra(ctx, user) {
              ctx.buff(user, { stat: 'def', mult: 0.2, duration: 2, name: 'Hollow Bulwark' });
            },
          }),
        ],
      },
    },
    {
      id: 'rustbound_archer',
      name: 'Rustbound Archer',
      title: 'A Bowstring That Forgot How to Let Go',
      element: 'Physical',
      tier: 'fodder',
      minFloor: 8,
      base: { hp: 300, atk: 64, def: 24, spd: 100 },
      toughness: 58,
      weak: ['Lightning', 'Frost'],
      art: { palette: ['#17171a', '#3c3a3f', '#9aa0a8'], icon: '🏹', aura: 'none' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(3, {
            name: 'Rusted Volley',
            desc: 'A loosed bolt, fired by fingers that fossilized around the trigger long ago.',
            power: 0.85,
            anim: { type: 'pierce', color: PHYS },
          }),
          M(2, {
            name: 'Fossilized Aim',
            desc: 'It has held this shot so long that it no longer misses.',
            power: 0.7,
            energyGain: 18,
            anim: { type: 'pierce', color: PHYS },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.addStatus(t, 'vulnerability', { duration: 2 }); });
            },
          }),
        ],
      },
    },
    {
      id: 'bloomfed_hound',
      name: 'Bloomfed Hound',
      title: 'Something Fed It, and It Grew Wrong',
      element: 'Dark',
      tier: 'fodder',
      minFloor: 10,
      base: { hp: 300, atk: 68, def: 20, spd: 122 },
      toughness: 55,
      weak: ['Holy', 'Fire'],
      art: { palette: ['#14100a', '#3a3226', '#7a8f5c'], icon: '🐾', aura: 'none' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(3, {
            name: 'Fungal Snap',
            desc: 'Its jaw has split wider than it should, and something pale is growing in the wound.',
            power: 0.95,
            anim: { type: 'slash', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.dot(t, { name: 'Blight', dmgPerTurn: Math.round(atkOf(user, 0.12)), duration: 2 }); });
            },
          }),
          M(2, {
            name: 'Ravenous Lunge',
            desc: 'Whatever is growing inside it is hungrier than the animal ever was.',
            power: 1.1,
            energyGain: 12,
            anim: { type: 'slash', color: DARK },
          }),
        ],
      },
    },
    {
      id: 'barrow_gnawer',
      name: 'Barrow-Gnawer',
      title: 'A Rat Grown Fat on Things It Shouldn\'t Eat',
      element: 'Physical',
      tier: 'fodder',
      minFloor: 6,
      base: { hp: 380, atk: 60, def: 30, spd: 104 },
      toughness: 70,
      weak: ['Fire', 'Frost'],
      art: { palette: ['#100c08', '#4a3c28', '#8a7448'], icon: '🐀', aura: 'none' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(3, {
            name: 'Stone-Worn Bite',
            desc: 'Its incisors have gone yellow from years of gnawing at things far harder than bone.',
            power: 0.9,
            anim: { type: 'slash', color: PHYS },
          }),
          M(2, {
            name: 'Tunneling Frenzy',
            desc: 'It has grown fat down here for a reason, and it isn\'t done feeding.',
            power: 0.8,
            energyGain: 15,
            anim: { type: 'slash', color: PHYS },
            extra(ctx, user, targets, allies, dmgDealt) {
              ctx.heal(user, Math.round((dmgDealt || 0) * 0.3));
            },
          }),
        ],
      },
    },

    // ==================== FORTRESS finale bosses ====================
    // Four new tier:'boss' entries, added to the same shared pool every
    // Fortress boss floor (10/17/21) rolls from (see rollNodeData's
    // node.kind==='boss' branch, js/engine/fortress.js) — no floor-specific
    // wiring needed, DS.BOSS_DIFFICULTY_MULT/DS.BOSS_HP_MULT already apply
    // uniformly to every tier:'boss' entry at spawn time.
    {
      id: 'devourer',
      name: 'The Devourer',
      title: 'Hunger Coiled in the Dark',
      element: 'Dark',
      tier: 'boss',
      // Growing more armored the longer it feeds — a small permanent DEF
      // stack every one of its own turns, capped so it plateaus.
      onTurnStart(ctx, unit) {
        unit._satiation = unit._satiation || 0;
        if (unit._satiation < 8) {
          unit._satiation++;
          ctx.buff(unit, { stat: 'def', mult: 0.03, duration: 99, name: 'Growing Satiation', quiet: unit._satiation > 1 });
        }
      },
      base: { hp: 3600, atk: 110, def: 65, spd: 85 },
      toughness: 280,
      weak: ['Holy', 'Lightning'],
      art: { palette: ['#0d0b12', '#241f30', '#e8b866'], icon: '🪱', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Starless Coil',
            desc: 'It wraps tighter, and the light nearby simply stops arriving.',
            power: 1.0,
            anim: { type: 'blast', color: DARK },
          }),
          M(3, {
            name: 'Maw Unhinged',
            desc: 'Its jaw splits wider than its own skull should allow.',
            power: 0.85,
            hits: 2,
            energyGain: 18,
            anim: { type: 'pierce', color: DARK },
          }),
          M(2, {
            name: 'Swallowed Sky',
            desc: 'It breathes in, and a patch of stars simply isn\'t there anymore.',
            target: 'allEnemies',
            power: 0.5,
            anim: { type: 'nova', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.drainEnergy(t, 10); });
            },
          }),
        ],
      },
      ult: A({
        name: 'The Long Hunger',
        desc: 'Everything within reach goes toward filling a hole that was never going to close.',
        target: 'allEnemies',
        power: 1.4,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'ritual', color: DARK },
        cutin: { title: 'THE LONG HUNGER', line: 'It was never going to stop at the stars.' },
        extra(ctx, user, targets, allies, dmgDealt) {
          if (dmgDealt > 0) ctx.heal(user, Math.round(dmgDealt * 0.3));
        },
      }),
    },
    {
      id: 'twin_horned_wretch',
      name: 'The Twin-Horned Wretch',
      title: 'Grief Grown a Second Head',
      element: 'Dark',
      tier: 'boss',
      // Both heads growing desperate together — once below half HP, it
      // advances its own action gauge every turn, acting more and more often.
      onTurnStart(ctx, unit) {
        if (unit.hp / unit.stats.hp < 0.5) {
          ctx.actionAdvance(unit, 0.15);
        }
      },
      base: { hp: 3000, atk: 102, def: 74, spd: 78 },
      toughness: 260,
      weak: ['Holy', 'Fire'],
      art: { palette: ['#100d0a', '#3a3226', '#e0645c'], icon: '👹', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Twinned Claw',
            desc: 'Two heads, two minds, one grudge — both act on it at once.',
            power: 0.65,
            hits: 2,
            anim: { type: 'slash', color: DARK },
          }),
          M(3, {
            name: 'Mourner\'s Wail',
            desc: 'A grief older than language, and it wants company.',
            target: 'allEnemies',
            power: 0.55,
            energyGain: 18,
            anim: { type: 'nova', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.debuff(t, { stat: 'atk', mult: -0.14, duration: 2, name: 'Mourned' }); });
            },
          }),
          M(2, {
            name: 'Antlered Charge',
            desc: 'It lowers both heads at once and simply stops being patient.',
            power: 1.2,
            toughnessDmg: 20,
            anim: { type: 'slash', color: DARK },
          }),
        ],
      },
      ult: A({
        name: 'Two Voices, One Grief',
        desc: 'Both heads speak the same word, and the ground around it forgets how to hold anything up.',
        target: 'allEnemies',
        power: 1.5,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'nova', color: DARK },
        cutin: { title: 'TWO VOICES, ONE GRIEF', line: 'It has been mourning itself since before it had a name.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) { ctx.debuff(t, { stat: 'def', mult: -0.15, duration: 2, name: 'Unmade' }); });
        },
      }),
    },
    {
      id: 'sky_strung_wraith',
      name: 'The Sky-Strung Wraith',
      title: 'A Puppet With No Hand Above It',
      element: 'Magic',
      tier: 'boss',
      // The threads jerking it without its consent — every 4th turn, a small
      // self-inflicted convulsion in exchange for a burst of energy.
      onTurnStart(ctx, unit) {
        unit._threadTicks = (unit._threadTicks || 0) + 1;
        if (unit._threadTicks % 4 === 0) {
          ctx.dealBonusTrueDamage(unit, unit, Math.round(unit.stats.hp * 0.03));
          if (unit.alive) {
            ctx.gainEnergy(unit, 25);
            ctx.log('The threads jerk it upright without its consent.');
          }
        }
      },
      base: { hp: 2600, atk: 116, def: 54, spd: 104 },
      toughness: 220,
      weak: ['Physical', 'Holy'],
      art: { palette: ['#14120f', '#4a4238', '#e2662c'], icon: '🕸', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Threadbound Lash',
            desc: 'A hundred thin cords snap forward as one.',
            power: 0.95,
            anim: { type: 'pierce', color: MAG },
          }),
          M(3, {
            name: 'Skyrend Snare',
            desc: 'The threads catch a limb and simply refuse the idea of moving quickly.',
            target: 'allEnemies',
            power: 0.55,
            energyGain: 18,
            anim: { type: 'nova', color: MAG },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.debuff(t, { stat: 'spd', mult: -0.16, duration: 2, name: 'Snared' }); });
            },
          }),
          M(2, {
            name: 'Ember-Core Surge',
            desc: 'The coal at its chest flares, and every thread pulls taut at once.',
            power: 1.1,
            energyGain: 25,
            anim: { type: 'blast', color: FIRE },
          }),
        ],
      },
      ult: A({
        name: 'Constellation Unraveled',
        desc: 'Every thread it has ever strung goes taut, then comes apart at once.',
        target: 'allEnemies',
        power: 1.45,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'ritual', color: MAG },
        cutin: { title: 'CONSTELLATION UNRAVELED', line: 'Something was always holding the other end of those threads.' },
        extra(ctx, user, targets) {
          targets.forEach(function (t) { ctx.drainEnergy(t, 15); });
        },
      }),
    },
    {
      id: 'shroud_bat',
      name: 'The Shroud-Bat',
      title: 'A Stain That Learned to Fly',
      element: 'Dark',
      tier: 'boss',
      // Vampiric ink, feeding its own bleed and poison — heals a slice of
      // whatever damage-over-time it currently has ticking on its foes.
      onTurnStart(ctx, unit) {
        let totalDot = 0;
        ctx.foes(unit).forEach(function (f) {
          (f.dots || []).forEach(function (d) { totalDot += (d.dmgPerTurn || 0) * (d.stacks || 1); });
        });
        if (totalDot > 0) {
          ctx.heal(unit, Math.round(totalDot * 0.5));
          ctx.log('The stain drinks back what it has already spilled.');
        }
      },
      base: { hp: 2400, atk: 108, def: 52, spd: 112 },
      toughness: 200,
      weak: ['Lightning', 'Holy'],
      art: { palette: ['#0a0a0c', '#2c2c30', '#9ecbd6'], icon: '🦇', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Ink-Drip Fangs',
            desc: 'What it bites doesn\'t stop bleeding just because the wound looks small.',
            power: 0.9,
            anim: { type: 'pierce', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) {
                if (DS.RNG.chance(0.4)) {
                  ctx.addStatus(t, 'bleed', { duration: 2 });
                  ctx.dot(t, { name: 'Ink-Stain', dmgPerTurn: atkOf(user, 0.28), duration: 2 });
                }
              });
            },
          }),
          M(3, {
            name: 'Web-Veined Wings',
            desc: 'Its wings unfold into something more like a net than a shape.',
            target: 'allEnemies',
            power: 0.5,
            energyGain: 18,
            anim: { type: 'nova', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.debuff(t, { stat: 'def', mult: -0.12, duration: 2, name: 'Web-Caught' }); });
            },
          }),
          M(2, {
            name: 'Shrieking Dive',
            desc: 'A single point of pale light, closing fast.',
            power: 1.15,
            toughnessDmg: 22,
            anim: { type: 'slash', color: DARK },
          }),
        ],
      },
      ult: A({
        name: 'Midnight\'s Web',
        desc: 'It spreads itself thin across the whole company, and every thread finds a vein.',
        target: 'allEnemies',
        power: 1.3,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'ritual', color: DARK },
        cutin: { title: 'MIDNIGHT\'S WEB', line: 'One eye, and all of it watching.' },
        extra(ctx, user, targets, allies, dmgDealt) {
          targets.forEach(function (t) {
            ctx.addStatus(t, 'poison', { duration: 3 });
            ctx.dot(t, { name: 'Web-Poison', dmgPerTurn: atkOf(user, 0.22), duration: 3 });
          });
          if (dmgDealt > 0) ctx.heal(user, Math.round(dmgDealt * 0.25));
        },
      }),
    },

    // ==================== Portal of Oolacile ====================
    // A golden sunlight sanctuary being consumed from below by the Abyss —
    // Holy-aligned guardians still running on old light, against Dark-aligned
    // corruption climbing up from underneath. Original creatures only; no
    // reused Dark Souls character names (Artorias/Manus/Kalameet/Priscilla/Sif
    // already exist elsewhere in this game).
    {
      id: 'sun_blind_thrall',
      name: 'Sun-Blind Thrall',
      title: 'One Who Still Faces the Light',
      element: 'Dark',
      tier: 'fodder',
      base: { hp: 400, atk: 64, def: 32, spd: 94 },
      toughness: 72,
      weak: ['Holy', 'Fire'],
      art: { palette: ['#0d0a06', '#4a3a1c', '#8a6a2c'], icon: '🧎', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Grasping Prayer',
            desc: 'Its hands still lift toward a sun it can no longer see, and the gesture is close enough to a strike.',
            power: 0.9,
            anim: { type: 'slash', color: DARK },
          }),
          M(3, {
            name: 'Radiant Scarring',
            desc: 'What is left of its faith comes out as light, and light like this only burns.',
            power: 0.6,
            energyGain: 20,
            anim: { type: 'blast', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.addStatus(t, 'blind', { duration: 2 }); });
            },
          }),
          M(2, {
            name: 'Huddled Chant',
            desc: 'The chant was never for protection. It was only ever so it would not be alone in the dark.',
            target: 'self',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: DARK },
            extra(ctx, user) {
              ctx.buff(user, { stat: 'atk', mult: 0.18, duration: 2, name: 'Huddled Chant' });
            },
          }),
        ],
      },
    },
    {
      id: 'rootling_husk',
      name: 'Rootling Husk',
      title: 'A Sapling That Forgot the Sun',
      element: 'Dark',
      tier: 'fodder',
      base: { hp: 340, atk: 60, def: 28, spd: 100 },
      toughness: 64,
      weak: ['Fire', 'Holy'],
      art: { palette: ['#0a0805', '#3a2f14', '#5a3f8a'], icon: '🌱', aura: 'void' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Grasping Root',
            desc: 'It remembers reaching for water. Now it just reaches.',
            power: 0.85,
            anim: { type: 'pierce', color: DARK },
          }),
          M(3, {
            name: 'Bramble Snare',
            desc: 'Thin black tendrils, patient as anything that used to grow slowly.',
            power: 0.5,
            energyGain: 20,
            anim: { type: 'pierce', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.debuff(t, { stat: 'spd', mult: -0.15, duration: 2, name: 'Bramble Snare' }); });
            },
          }),
          M(2, {
            name: 'Withering Bloom',
            desc: 'It flowers once, briefly, in a color no garden ever asked for.',
            target: 'allEnemies',
            power: 0.5,
            energyGain: 20,
            anim: { type: 'nova', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.dot(t, { name: 'Withering', dmgPerTurn: atkOf(user, 0.2), duration: 2 }); });
            },
          }),
        ],
      },
    },
    {
      id: 'gilded_sentinel',
      name: 'Gilded Sentinel',
      title: 'A Vow Carved in Gold',
      element: 'Holy',
      tier: 'elite',
      base: { hp: 1300, atk: 88, def: 96, spd: 78 },
      toughness: 210,
      weak: ['Dark', 'Frost'],
      art: { palette: ['#241c0a', '#8a6a1e', '#f2d878'], icon: '🗿', aura: 'holy' },
      maxEnergy: 100,
      movesets: {
        default: [
          M(4, {
            name: 'Sunlit Warhammer',
            desc: 'Gold does not rust, and neither, it seems, does duty.',
            power: 1.15,
            anim: { type: 'blast', color: HOLY },
          }),
          M(3, {
            name: 'Judgment of the Threshold',
            desc: 'It was built to guard a door. It has never once asked what waits on the other side.',
            target: 'singleEnemy',
            power: 1.3,
            energyGain: 20,
            anim: { type: 'slash', color: HOLY },
          }),
          M(2, {
            name: 'Radiant Bulwark',
            desc: 'It plants itself in the old light, and for a moment the corruption cannot find a way in.',
            target: 'self',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: HOLY },
            extra(ctx, user) {
              ctx.shield(user, atkOf(user, 1.2));
              ctx.buff(user, { stat: 'def', mult: 0.3, duration: 2, name: 'Radiant Bulwark' });
            },
          }),
        ],
      },
      ult: A({
        name: 'Last Light of the Vow',
        desc: 'Every promise it was built to keep, spent at once, in a single blinding stand.',
        target: 'allEnemies',
        power: 1.1,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'nova', color: HOLY },
        cutin: { title: 'LAST LIGHT OF THE VOW', line: 'It was built to guard a door. It has never once asked what waits on the other side.' },
        extra(ctx, user) {
          ctx.buff(user, { stat: 'def', mult: 0.25, duration: 2, name: 'Last Light of the Vow' });
        },
      }),
    },
    {
      id: 'vigil_unsleeping',
      name: 'The Vigil Unsleeping',
      title: 'It Has Not Blinked Since the Light Began to Fail',
      element: 'Holy',
      tier: 'boss',
      // Every third turn it takes a little of a foe's own strength and hoards
      // it as permanent Defense — a watch that's outlasting the thing it swore
      // to protect.
      onTurnStart(ctx, unit) {
        unit._vigilTicks = (unit._vigilTicks || 0) + 1;
        if (unit._vigilTicks % 3 === 0) {
          const alive = ctx.foes(unit).filter(function (f) { return f.alive; });
          if (alive.length) {
            const t = DS.RNG.pick(alive);
            ctx.debuff(t, { stat: 'atk', mult: -0.12, duration: 2, name: 'Light Taken' });
            ctx.buff(unit, { stat: 'def', mult: 0.08, duration: 99, name: 'Hoarded Radiance', quiet: unit._vigilTicks > 3 });
            ctx.log('It has not blinked since the light began to fail, and it will not start now.');
          }
        }
      },
      base: { hp: 3600, atk: 108, def: 74, spd: 92 },
      toughness: 280,
      weak: ['Dark', 'Frost'],
      art: { palette: ['#1c1508', '#5c431a', '#e8b23c'], icon: '🕯', aura: 'ember' },
      maxEnergy: 115,
      movesets: {
        default: [
          M(4, {
            name: 'Halberd of the Old Watch',
            desc: 'A weapon kept sharp for a relief that was never going to arrive.',
            power: 1.1,
            anim: { type: 'pierce', color: HOLY },
          }),
          M(3, {
            name: 'Widening Gaze',
            desc: 'It has learned to watch every door at once, whether or not anything is left to guard.',
            target: 'allEnemies',
            power: 0.6,
            energyGain: 20,
            anim: { type: 'blast', color: HOLY },
          }),
          M(2, {
            name: 'Kindle the Duty',
            desc: 'It stokes what little is left of the old flame, because someone still has to.',
            target: 'self',
            power: 0,
            energyGain: 25,
            anim: { type: 'buff', color: HOLY },
            extra(ctx, user) {
              ctx.shield(user, atkOf(user, 1.4));
            },
          }),
        ],
      },
      ult: A({
        name: 'It Has Not Blinked Since the Light Began to Fail',
        desc: 'Someone swore to keep this watch. No one swore for how long.',
        target: 'allEnemies',
        power: 1.3,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'blast', color: HOLY },
        cutin: { title: 'IT HAS NOT BLINKED SINCE THE LIGHT BEGAN TO FAIL', line: 'Someone swore to keep this watch. No one swore for how long.' },
      }),
    },
    {
      id: 'what_the_roots_found',
      name: 'What the Roots Found',
      title: 'The Abyss, Wearing Gold a While Longer',
      element: 'Dark',
      tier: 'boss',
      // Every third turn something reaches up through the gilding from
      // underneath — the sanctuary's real foundation finally introducing itself.
      onTurnStart(ctx, unit) {
        unit._rootTicks = (unit._rootTicks || 0) + 1;
        if (unit._rootTicks % 3 === 0) {
          const alive = ctx.foes(unit).filter(function (f) { return f.alive; });
          if (alive.length) {
            const t = DS.RNG.pick(alive);
            ctx.addStatus(t, 'curse', { duration: 3 });
            ctx.dot(t, { name: 'Root-Bound', dmgPerTurn: atkOf(unit, 0.22), duration: 3 });
            ctx.log('Something reaches up through the gold and finds purchase.');
          }
        }
      },
      base: { hp: 7000, atk: 148, def: 88, spd: 108 },
      toughness: 440,
      weak: ['Holy', 'Fire'],
      art: { palette: ['#0a0710', '#241a38', '#c9a24b'], icon: '🌑', aura: 'void' },
      maxEnergy: 140,
      movesets: {
        default: [
          M(4, {
            name: 'Grasp From Below',
            desc: 'The floor was never really floor. It was only ever waiting.',
            power: 1.15,
            anim: { type: 'pierce', color: DARK },
          }),
          M(3, {
            name: 'The Gold Gives Way',
            desc: 'Gilding was always going to be the thinnest part of the sanctuary.',
            target: 'allEnemies',
            power: 0.75,
            energyGain: 15,
            anim: { type: 'nova', color: DARK },
            extra(ctx, user, targets) {
              targets.forEach(function (t) { ctx.addStatus(t, 'vulnerability', { duration: 2 }); });
            },
          }),
          M(3, {
            name: 'What Little Light Is Left',
            desc: 'It drinks what the sanctuary has not yet finished losing.',
            power: 0.8,
            energyGain: 20,
            anim: { type: 'blast', color: DARK },
            extra(ctx, user, targets, allies, dmgDealt) {
              if (dmgDealt > 0) ctx.heal(user, Math.round(dmgDealt * 0.2));
            },
          }),
        ],
      },
      ult: A({
        name: 'The Abyss, Wearing Gold a While Longer',
        desc: 'Every sanctuary has a foundation, and every foundation, eventually, is soil.',
        target: 'allEnemies',
        power: 1.5,
        energyCost: 100,
        energyGain: 0,
        anim: { type: 'ritual', color: DARK },
        cutin: { title: 'THE ABYSS, WEARING GOLD A WHILE LONGER', line: 'Every sanctuary has a foundation, and every foundation, eventually, is soil.' },
        extra(ctx, user, targets, allies, dmgDealt) {
          if (dmgDealt > 0) ctx.heal(user, Math.round(dmgDealt * 0.25));
        },
      }),
    },
  ];
})();
