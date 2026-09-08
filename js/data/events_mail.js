// ASHEN TACTICS — events + mail (CONTRACT.md §4.10). All writing original.

window.DS = window.DS || {};

(function () {
  DS.EVENTS = [
    {
      id: 'ev_login', name: 'Kindling the First Week', tagline: 'Seven days of tending the same small flame.',
      icon: '🕯', palette: ['#2a2018', '#f0d98a'], kind: 'login',
      desc: 'Return each day and the bonfire remembers you a little better. Rewards escalate across your first seven days.',
      tiers: [
        { req: 1, desc: 'Day 1 — A stranger arrives', rewards: { humanity: 160, souls: 5000 } },
        { req: 2, desc: 'Day 2 — The fire nods', rewards: { signs: 1, souls: 5000 } },
        { req: 3, desc: 'Day 3 — A seat by the flame', rewards: { humanity: 160, items: { titanite_large: 2 } } },
        { req: 4, desc: 'Day 4 — Regular company', rewards: { signs: 1, items: { ember_asc_2: 2 } } },
        { req: 5, desc: 'Day 5 — The fire asks after you', rewards: { humanity: 240, items: { soul_hero: 1 } } },
        { req: 6, desc: 'Day 6 — Practically family', rewards: { signs: 2, items: { relic_dust: 20 } } },
        { req: 7, desc: 'Day 7 — Keeper in your own right', rewards: { humanity: 400, signs: 3, items: { boss_soul_fragment: 1 } } },
      ],
    },
    {
      id: 'ev_bossrush', name: 'Crown of Cinders', tagline: 'Five thrones. No bonfires between.',
      icon: '👑', palette: ['#3a1a0a', '#ff9d5c'], kind: 'bossRush',
      desc: 'Climb the Crown of Cinders gauntlet (find it in the Lands of Lordran). Each wave conquered here pays tribute.',
      tiers: [
        { req: 1, desc: 'Topple Wave I', rewards: { humanity: 100, souls: 8000 } },
        { req: 2, desc: 'Topple Wave II', rewards: { humanity: 120, items: { titanite_large: 3 } } },
        { req: 3, desc: 'Topple Wave III', rewards: { signs: 2, items: { ember_asc_3: 2 } } },
        { req: 4, desc: 'Topple Wave IV', rewards: { humanity: 200, items: { boss_soul_fragment: 1 } } },
        { req: 5, desc: 'Claim the Crown', rewards: { humanity: 320, signs: 3, items: { titanite_slab: 1 } } },
      ],
    },
    {
      id: 'ev_embertide', name: 'Ember Tide', tagline: 'The grove burns generous this season.',
      icon: '🔶', palette: ['#2a1408', '#e2662c'], kind: 'boost',
      desc: 'A one-time bounty from the Ember Grove\'s keepers, to speed new companies on their way. Claim it while the tide is high.',
      tiers: [
        { req: 0, desc: 'Welcome bounty', rewards: { souls: 15000, items: { ember_asc_1: 6, ember_asc_2: 3, titanite_shard: 8 } } },
      ],
    },
  ];

  DS.MAIL = [
    {
      id: 'm_welcome', from: 'The Firekeeper', subject: 'The fire knows your name now', icon: '🔥',
      body: 'You rested once, and that was enough — the flame keeps a seat for you. What follows is everything a keeper may give a stranger without the fire objecting: coin for summons, and signs to call good company. Spend them without guilt. The dark spends without guilt; so must we.',
      rewards: { humanity: 3200, signs: 10, souls: 30000 },
    },
    {
      id: 'm_devnote', from: 'The Chronicler', subject: 'On the keeping of this chronicle', icon: '🪶',
      body: 'A note tucked under your bedroll: "This world is a labor of love by people who died to the same bosses you did. Names and places are borrowed with reverence from the old tales; everything else — every stroke, sound, and sentence — was made new for this chronicle. Go kindly. Or at least, go well-armed."',
      rewards: { items: { estus_shard: 1 } },
    },
    {
      id: 'm_tips', from: 'Crestfallen Warrior', subject: 'Free advice, worth every penny', icon: '😔',
      body: 'You want wisdom? Fine. One: break their toughness before you spend your biggest hits — everything falls harder when it\'s already stumbling. Two: ultimates don\'t wait for turns; loose them the instant they\'re lit. Three: don\'t bother hoping. Hope is just disappointment with better posture. ...Take the flask. I wasn\'t using it.',
      rewards: { items: { estus_shard: 1, green_blossom: 3 } },
    },
    {
      id: 'm_gwyn_herald', from: 'Herald of the Kiln', subject: 'The Lord of Cinder walks the signs', icon: '🔥',
      body: 'Word from the deep kiln: the Lord himself has been seen answering white signs, greatsword still smoldering. The rite "Lord of Cinder" runs while his mood holds. Summoners are advised to bring reverence, or at least a bucket.',
      rewards: { signs: 1 },
    },
    {
      id: 'm_abyss_herald', from: 'A Scratched Missive', subject: 'the wolf knight answers (do not be afraid)', icon: '🐺',
      body: 'the handwriting is bad because sif is holding the pen. the abysswalker hears the signs again. the rite is called THE ABYSSWALKER. he is trying his best. he is always trying his best. bring him home if you can. — s.',
      rewards: { signs: 1 },
    },
    {
      id: 'm_patch', from: 'Trusty Patches', subject: 'Totally legitimate business opportunity', icon: '💰',
      body: 'Friend! Word is you\'ve been collecting things. I too collect things — mostly from people who\'ve recently stopped needing them. No no, this isn\'t THAT kind of letter. Consider this free sample a gesture of goodwill between honest entrepreneurs. Do visit me sometime. Preferably somewhere with a ledge.',
      rewards: { souls: 8000, items: { firebomb: 2 } },
    },
    // Hidden until Bonfire Level 2 (see requiresLevel — filtered in
    // DS.Meta.mailList()). Its attachment is the Trial Key that unlocks the
    // Covenant Trials screen (js/ui/hub-ui.js's lock/unlock-animation flow).
    {
      id: 'm_trial_key', from: 'The Firekeeper', subject: 'A trust, proven twice over', icon: '🗝',
      requiresLevel: 2,
      body: 'You\'ve kept the flame a second time now — that\'s no accident, and the covenants have taken notice. Enclosed is a key older than either of us. It opens the trials the eight covenants set for those they might one day call their own. Bring it to the lock yourself; some doors only open for the hand that was given the key.',
      rewards: { items: { trial_key: 1 } },
    },
  ];
})();
