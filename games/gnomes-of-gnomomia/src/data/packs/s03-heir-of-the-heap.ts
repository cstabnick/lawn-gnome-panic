// Content pack s03-heir-of-the-heap (Storyline 03, Thatchford Downs, levels 9-11). Prefix for new ids: s03-.
// Canon ids referenced, not defined here: c2-the-heap, puddleby (Dill), burlap (Reeve), heap-rat, red-potion.
import { look, type ContentPack, type DialogueOption } from '../../config';

// Start options added to canon NPCs (topics). Stage 99 in questAtLeast means "done".
const DILL_CELLAR: DialogueOption = {
  text: 'Rats in your cellar? Tell me more.', next: 's03-dill-cellar',
  action: { type: 'startQuest', quest: 's03-cellar-dwellers' },
  when: { quest: { id: 's03-cellar-dwellers', status: 'none' }, questAtLeast: { id: 'c2-the-heap', stage: 99 } },
};
const DILL_RENT: DialogueOption = {
  text: 'Who has been taking your cheese?', next: 's03-dill-rent',
  action: { type: 'startQuest', quest: 's03-cheese-rent' },
  when: { quest: { id: 's03-cheese-rent', status: 'none' }, questAtLeast: { id: 's03-cellar-dwellers', stage: 99 } },
};
const BURLAP_BINS: DialogueOption = {
  text: 'Dock wants the Thatchford bins sent up the Heap.', next: 's03-burlap-bins',
  action: { type: 'startQuest', quest: 's03-bins-for-the-heap' },
  when: { quest: { id: 's03-bins-for-the-heap', status: 'none' }, flag: { name: 'heap', value: 'truce' }, questAtLeast: { id: 's03-the-peel-throne', stage: 99 } },
};
const BURLAP_HATCH: DialogueOption = {
  text: 'Somebody has to hold the cellar hatch.', next: 's03-burlap-hatch',
  action: { type: 'startQuest', quest: 's03-hold-the-cellar-hatch' },
  when: { quest: { id: 's03-hold-the-cellar-hatch', status: 'none' }, flag: { name: 'heap', value: 'war' }, questAtLeast: { id: 's03-the-peel-throne', stage: 99 } },
};

export const PACK: ContentPack = {
  id: 's03-heir-of-the-heap',

  items: {
    's03-fresh-peelings': { id: 's03-fresh-peelings', name: 'Fresh peelings', icon: '🥬', kind: 'misc', questItem: true, value: 0, examine: 'Kitchen waste, still fresh. Dock\'s litter eats it first.' },
    's03-cheese-list': { id: 's03-cheese-list', name: 'Cheese ledger list', icon: '🧀', kind: 'misc', questItem: true, value: 0, examine: 'Dill\'s ledger: every cheese the raiders took, and the price of each.' },
    's03-rat-tail': { id: 's03-rat-tail', name: 'Rat tail', icon: '🐀', kind: 'misc', stackable: true, value: 2, examine: 'Proof of a cellar rat. The Reeve is said to pay for these.' },
    's03-bin-lid': { id: 's03-bin-lid', name: 'Bin lid', icon: '🗑️', kind: 'offhand', slot: 'offhand', ilvl: 10, rarity: 'sprouted', armorType: 'shield', value: 200, examine: 'A Thatchford dustbin lid, scrubbed. Blocks well and smells of it.' },
    's03-peel-cloak': { id: 's03-peel-cloak', name: 'Dock\'s peel-cloak', icon: '🧥', kind: 'armor', slot: 'body', ilvl: 10, rarity: 'blooming', armorType: 'leather', stats: { endurance: 2 }, effect: 'Ward vs Rain +5%', value: 400, examine: 'Keeps the damp out. That\'s all it\'s for.' },
    's03-cheese-chain': { id: 's03-cheese-chain', name: 'Gristle\'s cheese-chain', icon: '🧀', kind: 'trinket', slot: 'trinket', ilvl: 11, rarity: 'blooming', stats: { moveSpeed: 5, strength: 2 }, value: 484, examine: 'He hoards it. He\'ll sell you a bit.' },
    's03-crumbtins-ladle': { id: 's03-crumbtins-ladle', name: 'Crumbtin\'s ladle', icon: '🥄', kind: 'weapon', slot: 'weapon', ilvl: 11, rarity: 'blooming', damageType: 'crush', hands: 1, weaponClass: 'melee', value: 484, examine: 'Dock\'s soup ladle, dented. Cracks shells as well as soup.' },
  },

  enemies: {
    's03-cellar-rat': {
      id: 's03-cellar-rat', name: 'Cellar rat', level: 10, rank: 'normal', family: 'furred', damageType: 'slash', aggressive: true,
      loot: [{ item: 's03-rat-tail', chance: 0.7 }], gold: [2, 6], model: 'rat', color: 0x6b5a4a, scale: 1, respawnSeconds: 30,
      examine: 'Packs of three, up from the drains, with cheese on their minds.', wants: 'Warm cellars and cheese larders.',
    },
    's03-gristle-heir': {
      id: 's03-gristle-heir', name: 'Gristle, Rat Heir', level: 11, rank: 'miniboss', family: 'furred', damageType: 'slash', aggressive: true,
      loot: [{ item: 's03-rat-tail', chance: 1 }], gold: [30, 50], model: 'rat', color: 0x4a3a2c, scale: 1.6, respawnSeconds: 0,
      examine: 'Rotgut\'s nephew, sitting on a pile of peel as if it were a throne. It is a little bit of a throne.',
      wants: 'A dry cellar with a lock on the door.',
      moves: [
        { id: 's03-rat-pack', name: 'Rat Pack', kind: 'summon', every: 25, telegraph: 1, summon: { enemy: 's03-cellar-rat', count: 2 } },
        { id: 's03-cheese-snare', name: 'Cheese Snare', kind: 'pool', every: 12, telegraph: 1, radius: 2.5, damage: 0.4, status: 'slowed', statusSeconds: 3 },
        { id: 's03-shove', name: 'Shove', kind: 'cone', every: 15, telegraph: 1, length: 3, width: 2, damage: 0.6 },
      ],
      lastWords: 'Warm cellar. Shame.',
    },
  },

  spawns: [
    // Cellar rats come up out of the Tipsy Toadstool cellars onto the Hose bank west of the square (outside town, so
    // the Bound-Peace holds in the square). War adds a second pack.
    { id: 's03-spawn-1', zone: 'thatchford', enemy: 's03-cellar-rat', count: 3, spread: 3 },
    { id: 's03-spawn-2', zone: 'thatchford', enemy: 's03-cellar-rat', count: 3, spread: 3, when: { flag: { name: 'heap', value: 'war' } } },
    // Heap rats (canon) on the Compost Heap.
    { id: 's03-spawn-3', zone: 'thatchford', enemy: 'heap-rat', count: 4, spread: 8 },
    // Cellar rats on the war escort route, from the Peel Throne to the sluice.
    { id: 's03-spawn-4', zone: 'thatchford', enemy: 's03-cellar-rat', count: 3, spread: 3, when: { quest: { id: 's03-dock-goes-south', status: 'active' } } },
    // Gristle, Rat Heir, only during the truce's final fight.
    { id: 's03-spawn-5', zone: 'thatchford', enemy: 's03-gristle-heir', count: 1, spread: 0, when: { quest: { id: 's03-the-last-heir', status: 'active' } } },
  ],

  objects: {
    's03-bin-toadstool': {
      id: 's03-bin-toadstool', zone: 'thatchford', name: 'Waste bin (Tipsy Toadstool)', model: 'generic',
      verb: 'Search', examine: 'A dented waste bin behind the Tipsy Toadstool. It smells of last week.',
      text: 'You dig out a handful of fresh peelings.', giveItem: { item: 's03-fresh-peelings', count: 1 },
    },
    's03-bin-general': {
      id: 's03-bin-general', zone: 'thatchford', name: 'Waste bin (the General)', model: 'generic',
      verb: 'Search', examine: 'A waste bin behind the General. Thatchford\'s peel goes in here, by law.',
      text: 'You dig out a handful of fresh peelings.', giveItem: { item: 's03-fresh-peelings', count: 1 },
    },
    's03-bin-mill': {
      id: 's03-bin-mill', zone: 'thatchford', name: 'Waste bin (the mill)', model: 'generic',
      verb: 'Search', examine: 'A waste bin behind the mill. The mill wheel drips into it.',
      text: 'You dig out a handful of fresh peelings.', giveItem: { item: 's03-fresh-peelings', count: 1 },
    },
    's03-bin-guildhall': {
      id: 's03-bin-guildhall', zone: 'thatchford', name: 'Waste bin (the guildhall)', model: 'generic',
      verb: 'Search', examine: 'A waste bin behind the guildhall, with a lid that has seen better days.',
      text: 'You dig out a handful of fresh peelings.', giveItem: { item: 's03-fresh-peelings', count: 1 },
    },
    's03-dill-ledger': {
      id: 's03-dill-ledger', zone: 'thatchford', name: 'Dill\'s ledger', model: 'book',
      verb: 'Read', examine: 'Dill\'s cheese ledger, open on the bar of the Tipsy Toadstool.',
      text: 'Every cheese the raiders took, with a price beside each. The total is not small.',
      when: { quest: { id: 's03-cheese-rent', status: 'active' } }, once: true, giveItem: { item: 's03-cheese-list', count: 1 },
    },
    's03-nest-scratches': {
      id: 's03-nest-scratches', zone: 'thatchford', name: 'Nest scratches', model: 'stone',
      verb: 'Count', examine: 'Dock\'s count of the nests the floods have taken, scratched into the cave wall.',
      text: 'Scratches in rows, one for each nest the floods took, back to the spring after the Backflow. At the end of one row there is a gap.',
      when: { quest: { id: 's03-docks-count', status: 'active' } }, once: true,
    },
  },

  npcs: {
    's03-dock': {
      id: 's03-dock', name: 'Dock Crumbtin', look: look(0x6b4a2e, 0x8a7a5a, 0xb9b0a0), zone: 'thatchford', x: 64, z: 40, wander: 0,
      // After the war route she lives in the Hose banks.
      placements: [{ zone: 'thatchford', x: -40, z: 20, when: { quest: { id: 's03-dock-goes-south', status: 'done' } } }],
      examine: 'An old rat in a sacking shawl, counting something on her paws. Rotgut\'s aunt.',
      greetings: [
        { when: { questStage: { id: 's03-heir-apparent', stage: 1 } }, node: 's03-dock-heir-talk' },
        { when: { questStage: { id: 's03-heir-apparent', stage: 3 } }, node: 's03-dock-heir-turnin' },
        { when: { questStage: { id: 's03-the-peel-throne', stage: 2 } }, node: 's03-dock-throne' },
        { when: { questStage: { id: 's03-bins-for-the-heap', stage: 5 } }, node: 's03-dock-bins-turnin' },
        { when: { questStage: { id: 's03-the-last-heir', stage: 2 } }, node: 's03-dock-last-turnin' },
        { when: { questStage: { id: 's03-dock-goes-south', stage: 1 } }, node: 's03-dock-south-turnin' },
        { when: { quest: { id: 's03-the-last-heir', status: 'done' } }, node: 's03-dock-epilogue-truce' },
        { when: { quest: { id: 's03-dock-goes-south', status: 'done' } }, node: 's03-dock-epilogue-war' },
        { node: 's03-dock-hello' },
      ],
      nodes: {
        's03-dock-hello': {
          text: 'Mind the peel, it\'s slippery. I\'m Dock Crumbtin. Rotgut was my nephew, and I\'m the only one of us who ever did the sums.',
          options: [
            { text: 'What is the Heap?', next: 's03-dock-about' },
            {
              text: 'Rotgut\'s throne is empty. Who is sitting on it?', next: 's03-dock-heir-start',
              action: { type: 'startQuest', quest: 's03-heir-apparent' },
              when: { quest: { id: 's03-heir-apparent', status: 'none' }, questAtLeast: { id: 'c2-the-heap', stage: 99 } },
            },
            {
              text: 'Who is at the throne with you?', next: 's03-dock-throne-start',
              action: { type: 'startQuest', quest: 's03-the-peel-throne' },
              when: { quest: { id: 's03-the-peel-throne', status: 'none' }, questAtLeast: { id: 's03-heir-apparent', stage: 99 } },
            },
            {
              text: 'Can I see your count?', next: 's03-dock-count-start',
              action: { type: 'startQuest', quest: 's03-docks-count' },
              when: { quest: { id: 's03-docks-count', status: 'none' }, questAtLeast: { id: 's03-heir-apparent', stage: 99 } },
            },
            {
              text: 'Gristle has the throne. Get him off it.', next: 's03-dock-last-start',
              action: { type: 'startQuest', quest: 's03-the-last-heir' },
              when: { quest: { id: 's03-the-last-heir', status: 'none' }, flag: { name: 'heap', value: 'truce' }, questAtLeast: { id: 's03-bins-for-the-heap', stage: 99 } },
            },
            {
              text: 'Walk you to the sluice, then.', next: 's03-dock-south-start',
              action: { type: 'startQuest', quest: 's03-dock-goes-south' },
              when: { quest: { id: 's03-dock-goes-south', status: 'none' }, flag: { name: 'heap', value: 'war' }, questAtLeast: { id: 's03-hold-the-cellar-hatch', stage: 99 } },
            },
            { text: 'Goodbye.' },
          ],
        },
        's03-dock-about': {
          text: 'We\'re not a kingdom. We\'re a compost heap that got ideas. Gristle wants a cellar. I want a pile that feeds the lawn and doesn\'t drown.',
          options: [{ text: 'Goodbye.' }],
        },
        's03-dock-heir-start': {
          text: 'Somebody is sitting on the peel and calling it a throne. Go up and see who. Then come and tell me, and bring fresh peelings from the Thatchford bins while you\'re about it.',
          options: [{ text: 'Right.' }],
        },
        's03-dock-heir-talk': {
          text: 'Rotgut\'s dead, and the throne is a pile of peel with nobody on it. Gristle thinks it\'s his. The Heap needs feeding. Six fresh peelings, from the bins in town.',
          options: [{ text: 'Six peelings. Fine.' }],
        },
        's03-dock-heir-turnin': {
          text: 'Six fresh peelings. The litter ate the first lot before it ate my patience. Here, a bin lid for your trouble. Keeps the drips off.',
          options: [{ text: 'Thank you, Dock.' }],
        },
        's03-dock-throne-start': {
          text: 'Gristle is up there saying the throne is his, and he\'s not wrong that it\'s warm. Go up and hear him out. Then hear me.',
          options: [{ text: 'Going up.' }],
        },
        's03-dock-throne': {
          text: 'Gristle has said his piece and so have I. The throne is a pile of peel, and somebody has to sit on it and feed the lawn. You choose.',
          options: [
            {
              text: 'Back Dock Crumbtin. Keep the bins open and the cellars shut.', next: 's03-dock-truce',
              action: { type: 'setFlag', flag: 'heap', value: 'truce' },
            },
            {
              text: 'Back Gristle. Let him have his warm cellar.', next: 's03-dock-war',
              action: { type: 'setFlag', flag: 'heap', value: 'war' },
            },
          ],
        },
        's03-dock-truce': {
          text: 'Bins to the Heap, cellars shut. Gristle won\'t stop, he\'ll only wait. Take my peel-cloak. It keeps the damp out. That\'s all it\'s for.',
          options: [{ text: 'Take the peel-cloak.', action: { type: 'giveItem', item: 's03-peel-cloak', count: 1 } }],
        },
        's03-dock-war': {
          text: 'Gristle takes the throne and sends his raiders up the drains. I take the road south. Gristle will want you to have his chain, so you\'re to take it.',
          options: [{ text: 'Take Gristle\'s cheese-chain.', action: { type: 'giveItem', item: 's03-cheese-chain', count: 1 } }],
        },
        's03-dock-bins-turnin': {
          text: 'Four bins, and the Heap is fed, and the cellars are shut. Burlap grumbles and pays his share. Good work, Gnome.',
          options: [{ text: 'Goodbye, Dock.' }],
        },
        's03-dock-last-start': {
          text: 'Gristle has never once left that throne. Reach the top and deal with him. He\'s a rat, but he\'s the heir.',
          options: [{ text: 'I will take the throne.' }],
        },
        's03-dock-last-turnin': {
          text: 'Warm cellar. Shame. It doesn\'t mend anything, nothing does. Take the ladle. It cracks shells as well as soup.',
          options: [{ text: 'Thank you, Dock.' }],
        },
        's03-dock-south-start': {
          text: 'Gristle\'s raiders have the drains, and I\'m no use to anyone up here. Walk me to the Heap sluice and I\'ll be out of his road.',
          options: [{ text: 'Lead the way.' }],
        },
        's03-dock-south-turnin': {
          text: 'Keep the bins open, Gnome. Somebody has to eat what you don\'t.',
          options: [{ text: 'Goodbye, Dock.' }],
        },
        's03-dock-count-start': {
          text: 'You want to see my count? Nobody has asked. It\'s on the back cave wall, one scratch per nest the floods took.',
          options: [{ text: 'Show me the count.' }, { text: 'Not today.' }],
        },
        's03-dock-epilogue-truce': {
          text: 'The bins feed the Heap again, and the cellars stay shut. The count is the same as it was. It doesn\'t go down.',
          options: [{ text: 'Goodbye, Dock.' }],
        },
        's03-dock-epilogue-war': {
          text: 'I live in the Hose banks now. The Heap is under a lid. Don\'t come by unless you\'re bringing peel.',
          options: [{ text: 'Goodbye, Dock.' }],
        },
      },
    },

    's03-gristle': {
      id: 's03-gristle', name: 'Gristle', look: look(0x3a3a3a, 0x5a3a2a, null), zone: 'thatchford', x: 68, z: 46, wander: 0,
      // Hidden once the final fight starts: he is the enemy then, and dead after.
      hidden: { questAtLeast: { id: 's03-the-last-heir', stage: 0 } },
      examine: 'A lean, grubby rat with a cellar\'s worth of grievance and a cheese rind round his neck.',
      greetings: [
        { when: { questStage: { id: 's03-the-peel-throne', stage: 1 } }, node: 's03-gristle-throne' },
        { when: { flag: { name: 'heap', value: 'war' } }, node: 's03-gristle-war' },
        { when: { flag: { name: 'heap', value: 'truce' } }, node: 's03-gristle-truce' },
        { node: 's03-gristle-hello' },
      ],
      nodes: {
        's03-gristle-hello': {
          text: 'Rotgut kept me at the foot of the peel-throne for eleven years and called me "the spare". Now I\'m sitting on it.',
          options: [{ text: 'What do you want?', next: 's03-gristle-want' }, { text: 'Goodbye.' }],
        },
        's03-gristle-want': {
          text: 'A dry cellar with a lock on the door. Is that so much?',
          options: [{ text: 'Goodbye.' }],
        },
        's03-gristle-throne': {
          text: 'Rotgut had a throne. I had a bin, and he kept the lid on. Go and ask Dock what she\'s selling.',
          options: [{ text: 'I will ask her.' }],
        },
        's03-gristle-war': {
          text: 'Hatch open, cellar warm, and Dock out in the drains. Hold your hatch, Gnome, or I\'ll have it.',
          options: [{ text: 'Goodbye.' }],
        },
        's03-gristle-truce': {
          text: 'Dock\'s bins, Dock\'s rules. Fine. I\'ll wait, and then I\'ll have the cellar.',
          options: [{ text: 'Goodbye.' }],
        },
      },
    },
  },

  // Canon NPCs: Dill (puddleby) and Reeve Burlap (burlap). Their hub nodes show the topics below.
  topics: {
    puddleby: [DILL_CELLAR, DILL_RENT],
    burlap: [BURLAP_BINS, BURLAP_HATCH],
  },

  greetingsFirst: {
    puddleby: [
      { when: { questStage: { id: 's03-cellar-dwellers', stage: 0 } }, node: 's03-dill-cellar-return' },
      { when: { questStage: { id: 's03-cellar-dwellers', stage: 3 } }, node: 's03-dill-cellar-turnin' },
    ],
    burlap: [
      { when: { questStage: { id: 's03-bins-for-the-heap', stage: 0 } }, node: 's03-burlap-bins-talk' },
      { when: { questStage: { id: 's03-cheese-rent', stage: 1 } }, node: 's03-burlap-rent-turnin' },
      { when: { questStage: { id: 's03-hold-the-cellar-hatch', stage: 1 } }, node: 's03-burlap-hatch-turnin' },
    ],
  },

  extraNodes: {
    puddleby: {
      's03-dill-cellar': {
        text: 'They\'ve been in my cellar a month, and now they\'re charging me rent. Go down the Toadstool hatch and send four of them packing. Then come and tell me.',
        options: [{ text: 'Right.' }],
      },
      's03-dill-cellar-return': {
        text: 'Still here? The hatch is behind the Toadstool. They are down there this minute.',
        options: [{ text: 'On my way.' }],
      },
      's03-dill-cellar-turnin': {
        text: 'They\'re gone? Good. I don\'t want to know what they did with the cheese. Here\'s some gold and two potions for the trouble.',
        options: [{ text: 'Glad it\'s over.' }],
      },
      's03-dill-rent': {
        text: 'Cheese, Gnome. Every cheese they took, I wrote down. Read the ledger, copy out the list, and take it to the Reeve. He\'ll pay a fee for it. He won\'t pay me.',
        options: [{ text: 'I will read the ledger.' }],
      },
    },
    burlap: {
      's03-burlap-bins': {
        text: 'Dock wants her bins. Four of them: behind the Toadstool, the General, the mill and the guildhall. Cheapest bin I ever sold, and now I\'m sharing it.',
        options: [{ text: 'Right.' }],
      },
      's03-burlap-bins-talk': {
        text: 'Four bins, four stops. Behind the Toadstool, the General, the mill and the guildhall. Off you go.',
        options: [{ text: 'On my way.' }],
      },
      's03-burlap-rent-turnin': {
        text: 'Dill\'s list. Twenty-five gold for the fee. Don\'t expect thanks. You\'ll get complaints instead.',
        options: [{ text: 'Thanks, Reeve.' }],
      },
      's03-burlap-hatch': {
        text: 'Rats in the cellars? Burn the Heap. Hold the Toadstool hatch for a minute, three waves of them. Cheapest bin I ever sold.',
        options: [{ text: 'Right.' }],
      },
      's03-burlap-hatch-turnin': {
        text: 'The hatch held. Burn the Heap, I said. Here\'s the coin. Don\'t tell Dock I paid it.',
        options: [{ text: 'My lips are sealed.' }],
      },
    },
  },

  quests: {
    's03-cellar-dwellers': {
      id: 's03-cellar-dwellers', name: 'Cellar Dwellers', giver: 'puddleby', zone: 'thatchford', level: 9, tier: 'side', chain: 'Heir of the Heap',
      stages: [
        { text: 'Go back to Dill Puddleby at the Tipsy Toadstool.', objective: { type: 'talk', npc: 'puddleby' } },
        { text: 'Go down the cellar hatch behind the Tipsy Toadstool.', objective: { type: 'reach', zone: 'thatchford', x: -8, z: 6, r: 4 } },
        { text: 'Kill 4 cellar rats. They come up out of the cellars onto the Hose bank west of the square.', objective: { type: 'kill', enemy: 's03-cellar-rat', count: 4 } },
        { text: 'Tell Dill Puddleby the cellars are clear.', objective: { type: 'talk', npc: 'puddleby' } },
      ],
      reward: { gold: 40, items: [{ item: 'red-potion', count: 2 }] },
    },
    's03-heir-apparent': {
      id: 's03-heir-apparent', name: 'Heir Apparent', giver: 's03-dock', zone: 'thatchford', level: 9, tier: 'side', chain: 'Heir of the Heap',
      stages: [
        { text: 'Climb the Compost Heap.', objective: { type: 'reach', zone: 'thatchford', x: 65, z: 45, r: 18 } },
        { text: 'Talk to Dock Crumbtin on the Heap.', objective: { type: 'talk', npc: 's03-dock' } },
        { text: 'Collect 6 fresh peelings from the Thatchford bins.', objective: { type: 'collect', item: 's03-fresh-peelings', count: 6 } },
        { text: 'Bring the fresh peelings to Dock Crumbtin.', objective: { type: 'talk', npc: 's03-dock' }, takeItems: [{ item: 's03-fresh-peelings', count: 6 }] },
      ],
      reward: { gold: 60, items: [{ item: 's03-bin-lid', count: 1 }] },
    },
    's03-the-peel-throne': {
      id: 's03-the-peel-throne', name: 'The Peel Throne', giver: 's03-dock', zone: 'thatchford', level: 10, tier: 'main', chain: 'Heir of the Heap',
      stages: [
        { text: 'Go up to the Peel Throne at the top of the Compost Heap.', objective: { type: 'reach', zone: 'thatchford', x: 65, z: 45, r: 6 } },
        { text: 'Hear Gristle out at the throne.', objective: { type: 'talk', npc: 's03-gristle' } },
        { text: 'Hear Dock Crumbtin out at the throne.', objective: { type: 'talk', npc: 's03-dock' } },
        { text: 'Choose who backs the throne: Dock Crumbtin or Gristle.', objective: { type: 'choice', flag: 'heap' } },
      ],
      reward: { gold: 150, items: [] },
    },
    's03-bins-for-the-heap': {
      id: 's03-bins-for-the-heap', name: 'Bins for the Heap', giver: 'burlap', zone: 'thatchford', level: 10, tier: 'main', chain: 'Heir of the Heap',
      stages: [
        { text: 'Take Dock\'s order to Reeve Burlap.', objective: { type: 'talk', npc: 'burlap' } },
        { text: 'Turn the waste bin behind the Tipsy Toadstool.', objective: { type: 'interact', object: 's03-bin-toadstool', count: 1 } },
        { text: 'Turn the waste bin behind the General.', objective: { type: 'interact', object: 's03-bin-general', count: 1 } },
        { text: 'Turn the waste bin behind the mill.', objective: { type: 'interact', object: 's03-bin-mill', count: 1 } },
        { text: 'Turn the waste bin behind the guildhall.', objective: { type: 'interact', object: 's03-bin-guildhall', count: 1 } },
        { text: 'Tell Dock Crumbtin the bins are sent to the Heap.', objective: { type: 'talk', npc: 's03-dock' } },
      ],
      reward: { gold: 80, items: [] },
    },
    's03-hold-the-cellar-hatch': {
      id: 's03-hold-the-cellar-hatch', name: 'Hold the Cellar Hatch', giver: 'burlap', zone: 'thatchford', level: 10, tier: 'main', chain: 'Heir of the Heap',
      stages: [
        {
          text: 'Hold the Tipsy Toadstool cellar hatch for 60 seconds against three waves of cellar rats.',
          objective: {
            type: 'defend', zone: 'thatchford', x: -8, z: 6, r: 6, seconds: 60,
            waves: [{ enemy: 's03-cellar-rat', count: 3, at: 0 }, { enemy: 's03-cellar-rat', count: 3, at: 20 }, { enemy: 's03-cellar-rat', count: 4, at: 40 }],
          },
        },
        { text: 'Report the held hatch to Reeve Burlap.', objective: { type: 'talk', npc: 'burlap' } },
      ],
      reward: { gold: 80, items: [] },
    },
    's03-the-last-heir': {
      id: 's03-the-last-heir', name: 'The Last Heir', giver: 's03-dock', zone: 'thatchford', level: 11, tier: 'finale', chain: 'Heir of the Heap',
      stages: [
        { text: 'Go up to the Peel Throne.', objective: { type: 'reach', zone: 'thatchford', x: 65, z: 45, r: 6 } },
        { text: 'Kill Gristle, Rat Heir, on the Peel Throne.', objective: { type: 'kill', enemy: 's03-gristle-heir', count: 1 } },
        { text: 'Tell Dock Crumbtin the throne is empty.', objective: { type: 'talk', npc: 's03-dock' } },
      ],
      reward: { gold: 200, items: [{ item: 's03-crumbtins-ladle', count: 1 }] },
    },
    's03-dock-goes-south': {
      id: 's03-dock-goes-south', name: 'Dock Goes South', giver: 's03-dock', zone: 'thatchford', level: 11, tier: 'finale', chain: 'Heir of the Heap',
      stages: [
        { text: 'Escort Dock Crumbtin from the Peel Throne to the Heap sluice, past the cellar rats.', objective: { type: 'escort', npc: 's03-dock', zone: 'thatchford', x: 48, z: 45, r: 4 } },
        { text: 'Say goodbye to Dock Crumbtin at the sluice.', objective: { type: 'talk', npc: 's03-dock' } },
      ],
      reward: { gold: 200, items: [{ item: 's03-crumbtins-ladle', count: 1 }] },
    },
    's03-cheese-rent': {
      id: 's03-cheese-rent', name: 'Cheese Rent', giver: 'puddleby', zone: 'thatchford', level: 9, tier: 'side', chain: 'Heir of the Heap',
      stages: [
        { text: 'Read Dill\'s cheese ledger in the Tipsy Toadstool.', objective: { type: 'interact', object: 's03-dill-ledger', count: 1 } },
        { text: 'Bring the cheese list to Reeve Burlap for the fee.', objective: { type: 'talk', npc: 'burlap' }, takeItems: [{ item: 's03-cheese-list', count: 1 }] },
      ],
      reward: { gold: 25, items: [] },
    },
    's03-docks-count': {
      id: 's03-docks-count', name: 'Dock\'s Count', giver: 's03-dock', zone: 'thatchford', level: 10, tier: 'side', chain: 'Heir of the Heap',
      stages: [
        { text: 'Count the nest scratches in Dock\'s back cave, behind the Peel Throne.', objective: { type: 'interact', object: 's03-nest-scratches', count: 1 } },
      ],
      reward: { gold: 0, items: [] },
    },
  },

  allies: [
    { id: 's03-heap-diggers', name: 'Heap diggers', when: { flag: { name: 'heap', value: 'truce' } }, effect: 'ramp-faster' },
  ],
};
