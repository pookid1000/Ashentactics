// ASHEN TACTICS — NPC questlines (CONTRACT.md §4.9). All dialogue is original writing.

window.DS = window.DS || {};

(function () {
  DS.QUESTS = [
    {
      id: 'q_solaire', npc: 'Solaire of Astora', name: 'A Sun of One\'s Own', icon: '☀',
      summary: 'Solaire seeks his own sun — help him look in the places suns are least likely to be.',
      steps: [
        { type: 'dialogue', lines: [
          { speaker: 'Solaire', text: 'Ah! A fellow traveler. Tell me — when you look at the sky here, do you see it? A sun that is... mine?' },
          { speaker: 'You', text: 'The sky here is mostly smoke.' },
          { speaker: 'Solaire', text: 'Precisely! Which means my sun is elsewhere. Marvelous. The search narrows by the hour. Will you help an earnest man look?' },
        ] },
        { type: 'battle', encounter: { spawns: [{ id: 'hollow_soldier', level: 8 }, { id: 'hollow_archer', level: 8 }, { id: 'hollow_soldier', level: 8 }], background: 'burg' },
          intro: 'Something shuffles between you and the ridge Solaire wants to search.' },
        { type: 'dialogue', lines: [
          { speaker: 'Solaire', text: 'Splendid work! You fight like a sunrise — sudden, and very hard to argue with.' },
          { speaker: 'Solaire', text: 'I have heard tell of medals given for aid rendered. Would you gather a couple? Proof, you see, that cooperation is its own light.' },
        ] },
        { type: 'collect', itemId: 'sunlight_medal', count: 2, hint: 'Sunlight Medals drop from Anor Londo stages (World 4) and the Belfry.' },
        { type: 'dialogue', lines: [
          { speaker: 'Solaire', text: 'Two medals! Warm to the touch, both of them. You know what I feel when I hold these?' },
          { speaker: 'You', text: 'The sun?' },
          { speaker: 'Solaire', text: 'Friendship. Which is, I begin to suspect, the same thing wearing better armor. Take this — I insist. Praise it with me, just once.' },
        ] },
      ],
      rewards: { humanity: 320, signs: 2, souls: 20000, items: { sunlight_medal: 3 } },
    },
    {
      id: 'q_siegmeyer', npc: 'Siegmeyer of Catarina', name: 'Perpetually Stuck', icon: '🧅',
      summary: 'Siegmeyer is stuck. Again. In several places, sequentially.',
      steps: [
        { type: 'dialogue', lines: [
          { speaker: 'Siegmeyer', text: 'Hmmm. Hm-hm-hmmm. Zzz... oh! Beg pardon. I was strategizing with my eyes closed.' },
          { speaker: 'You', text: 'The gate ahead is full of hollows.' },
          { speaker: 'Siegmeyer', text: 'Yes, that is chapter one of my predicament. There are also chapters two and three. Might you... no, no, I couldn\'t possibly — well, if you\'re offering.' },
        ] },
        { type: 'battle', encounter: { spawns: [{ id: 'hollow_soldier', level: 14 }, { id: 'hollow_soldier', level: 14 }, { id: 'balder_knight', level: 15 }], background: 'burg' },
          intro: 'Chapter one: the gate guard.' },
        { type: 'dialogue', lines: [
          { speaker: 'Siegmeyer', text: 'Remarkable! While you fought I devised four separate plans, each of which was you, doing that.' },
          { speaker: 'Siegmeyer', text: 'Chapter two involves... rather more legs. I shall need a moment of honest napping first. Meet me below?' },
        ] },
        { type: 'battle', encounter: { spawns: [{ id: 'rat_swarm', level: 18 }, { id: 'rat_swarm', level: 18 }, { id: 'rat_swarm', level: 17 }], background: 'depths' },
          intro: 'Chapter two: rather more legs.' },
        { type: 'dialogue', lines: [
          { speaker: 'Siegmeyer', text: 'And so the onion rolls ever onward! You have taught me something, friend: a predicament shared is a predicament halved.' },
          { speaker: 'Siegmeyer', text: 'Which means, mathematically, I owe you half of everything I am carrying. I have done the sums twice. Catarina honor allows no less!' },
        ] },
      ],
      rewards: { humanity: 280, souls: 24000, items: { titanite_large: 3, estus_shard: 1 } },
    },
    {
      id: 'q_lautrec', npc: 'Lautrec of Carim', name: 'A Favor, With Interest', icon: '🗡',
      summary: 'Lautrec offers a bargain with suspiciously good terms. Read the fine print with a sword.',
      steps: [
        { type: 'dialogue', lines: [
          { speaker: 'Lautrec', text: 'You look capable. I loathe capable people — they\'re so rarely for hire. A moment of your competence, and I\'ll pay in gold and honesty.' },
          { speaker: 'You', text: 'Honesty?' },
          { speaker: 'Lautrec', text: 'One of the two, at minimum. There is a shrine below the parish. Its occupants have something of my goddess\'s. Retrieve it, and don\'t ask which part of that sentence is true.' },
        ] },
        { type: 'battle', encounter: { spawns: [{ id: 'channeler', level: 22 }, { id: 'necromancer', level: 22 }, { id: 'skeleton', level: 21 }], background: 'depths' },
          intro: 'The shrine\'s occupants object to the withdrawal.' },
        { type: 'collect', itemId: 'ring_of_sacrifice', count: 1, hint: 'Rings of Sacrifice can be crafted, or drop from the Soul Vessel domain.' },
        { type: 'dialogue', lines: [
          { speaker: 'Lautrec', text: 'The ring. Good. My goddess values sacrifice — other people\'s, ideally.' },
          { speaker: 'You', text: 'And the honesty you promised?' },
          { speaker: 'Lautrec', text: 'Here it is, then, free of charge: keep the gold, keep your distance, and never trust a man whose armor smiles. That is the truest thing I own.' },
        ] },
      ],
      rewards: { humanity: 300, souls: 30000, items: { ring_of_sacrifice: 2, soul_hero: 1 } },
    },
    {
      id: 'q_logan', npc: 'Big Hat Logan', name: 'The Archive Key', icon: '🎩',
      summary: 'Logan wants into the Duke\'s Archives. The Archives, historically, want people to stay.',
      steps: [
        { type: 'dialogue', lines: [
          { speaker: 'Logan', text: 'The Archives. Every sorcery I have ever cast is a footnote to what molders on those shelves.' },
          { speaker: 'You', text: 'People who go in describe the shelves as "hungry."' },
          { speaker: 'Logan', text: 'Yes — peer review at its finest. The key is held by things of grown crystal. I require the key. The things are negotiable. With force.' },
        ] },
        { type: 'battle', encounter: { spawns: [{ id: 'crystal_golem', level: 40 }, { id: 'crystal_golem', level: 40 }], background: 'anor' },
          intro: 'The keyholders negotiate poorly.' },
        { type: 'clearStage', stageId: 'w4s4', hint: 'Clear "Archive Stacks" in World 4 to escort Logan inside.' },
        { type: 'dialogue', lines: [
          { speaker: 'Logan', text: 'The stacks. The STACKS. Do you smell it? Vellum and lightning and other people\'s life\'s work.' },
          { speaker: 'You', text: 'Don\'t get shelved.' },
          { speaker: 'Logan', text: 'A scholar accepts the risk of becoming a primary source. Take this — I annotated it. The margins are worth more than the spell.' },
        ] },
      ],
      rewards: { humanity: 300, souls: 32000, items: { titanite_chunk: 2, ember_asc_3: 2 } },
    },
    {
      id: 'q_anastacia', npc: 'Anastacia of Astora', name: 'A Voice, Returned', icon: '🕊',
      summary: 'The firekeeper cannot speak. The fire remembers what her voice sounded like.',
      steps: [
        { type: 'dialogue', lines: [
          { speaker: 'Firekeeper', text: '...' },
          { speaker: 'You', text: 'You keep this fire alive. Is there nothing that can be done for you?' },
          { speaker: 'Firekeeper', text: '... (she traces a word in the ash: "BELOW.")' },
        ] },
        { type: 'battle', encounter: { spawns: [{ id: 'darkwraith', level: 50 }, { id: 'darkwraith', level: 50 }], background: 'abyss' },
          intro: 'Below, something wears a stolen voice like a trophy.' },
        { type: 'collect', itemId: 'humanity_sprite', count: 3, hint: 'Humanity drifts from most stages, and answers most rites of summoning.' },
        { type: 'dialogue', lines: [
          { speaker: 'Firekeeper', text: '... thank you. (The words arrive small and rusted, but they arrive.)' },
          { speaker: 'Firekeeper', text: 'The fire told me your name every time you rested. It says it kindly. I wished you to know that.' },
        ] },
      ],
      rewards: { humanity: 400, signs: 3, souls: 26000, items: { estus_shard: 1 } },
    },
  ];
})();
