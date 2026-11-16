// Content pack ch5-hedgewood: Bough (chapter 5, Hedgewood, levels 15-20, plus the Drainpipe Cistern). Prefix for new ids: c5-.
import { look, type ContentPack, type DialogueNode, type DialogueOption, type EnemyDef, type Greeting, type ItemDef, type WorldObjectDef, type QuestDef, type NpcDef, type SpawnGroup } from '../../config';

const items: Record<string, ItemDef> = {
  // Clippings smith: the Hedgewood row (ilvl 16-19, plain).
  'c5-hedge-shears': { id: 'c5-hedge-shears', name: 'Hedge shears', icon: '✂️', kind: 'weapon', slot: 'weapon', ilvl: 16, damageType: 'slash', hands: 2, weaponClass: 'melee', value: 256, examine: 'Two blades that were made to trim a hedge, and have since been made to trim other things.' },
  'c5-woodsman-hatchet': { id: 'c5-woodsman-hatchet', name: 'Woodsman\'s hatchet', icon: '🪓', kind: 'weapon', slot: 'weapon', ilvl: 17, damageType: 'slash', hands: 1, weaponClass: 'melee', value: 289, examine: 'Chips the bark, then the wood, then whatever was standing behind the wood.' },
  'c5-bark-shell-plate': { id: 'c5-bark-shell-plate', name: 'Bark-and-shell plate', icon: '🐚', kind: 'armor', slot: 'body', ilvl: 17, armorType: 'plate', value: 289, examine: 'Bark nailed over a beetle shell. Smells of the hedge, and of the Hedgewrights who cut it.' },
  'c5-yew-slingshot': { id: 'c5-yew-slingshot', name: 'Yew slingshot', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 18, damageType: 'pierce', hands: 1, weaponClass: 'sling', value: 324, examine: 'Yew, which the Wildlings would call a crime. The Hedgewrights call it a bargain.' },
  'c5-elder-blowpipe': { id: 'c5-elder-blowpipe', name: 'Elder-pipe blowpipe', icon: '🎋', kind: 'weapon', slot: 'weapon', ilvl: 18, damageType: 'pierce', hands: 1, weaponClass: 'blowpipe', value: 324, examine: 'Hollow elder, sanded smooth. Blows a dart further than seems polite.' },
  'c5-privet-staff': { id: 'c5-privet-staff', name: 'Privet staff', icon: '🪵', kind: 'weapon', slot: 'weapon', ilvl: 19, damageType: 'bloom', hands: 2, weaponClass: 'staff', value: 361, examine: 'Cut from the outer hedge, not the Privet itself. The Wildlings were very clear about the difference.' },
  // Barkhollow tanner: the Hedgewood armour (ilvl 18-19, plain).
  'c5-wasp-paper-jerkin': { id: 'c5-wasp-paper-jerkin', name: 'Wasp-paper jerkin', icon: '🐝', kind: 'armor', slot: 'body', ilvl: 18, armorType: 'leather', value: 324, examine: 'Layers of paper from a wasp nest, stiffened and stitched. The wasps have asked for it back.' },
  'c5-spider-silk-smock': { id: 'c5-spider-silk-smock', name: 'Spider-silk smock', icon: '🕸️', kind: 'armor', slot: 'body', ilvl: 19, armorType: 'cloth', value: 361, examine: 'Light, fine and faintly sticky. Pick it up and the room gets a little quieter.' },

  // Named drops and rewards.
  'c5-vespas-stinger': { id: 'c5-vespas-stinger', name: 'Vespa\'s Stinger', icon: '🗡️', kind: 'weapon', slot: 'weapon', ilvl: 20, rarity: 'heirloom', damageType: 'pierce', hands: 1, weaponClass: 'blowpipe', value: 3200, effect: 'Poison stacks +1.', examine: 'The sting of a queen who never once had to say please. Still warm. Burdock will want to see it.' },
  'c5-weavers-shawl': { id: 'c5-weavers-shawl', name: 'Weaver\'s Shawl', icon: '🧣', kind: 'armor', slot: 'body', ilvl: 18, rarity: 'heirloom', armorType: 'cloth', stats: { rainDamage: 10 }, value: 2592, effect: 'Slows attackers.', examine: 'Spun from the Weaver\'s own silk. Anything that touches it wants a lie down.' },
  'c5-vesh-teeth': { id: 'c5-vesh-teeth', name: 'Mother Vesh\'s Teeth', icon: '🦷', kind: 'trinket', slot: 'trinket', ilvl: 20, rarity: 'heirloom', value: 3200, effect: 'Heals 2% of damage dealt.', examine: 'A necklace of small, white, pointed things. The leeches did not give them up willingly.' },
  'c5-tamed-beetle': { id: 'c5-tamed-beetle', name: 'Tamed stag beetle', icon: '🪲', kind: 'trinket', slot: 'trinket', ilvl: 15, rarity: 'sprouted', value: 450, examine: 'A young stag beetle on a cord collar. Slingers get a companion for it. Everyone else gets a beetle that follows them about.' },

  // Quest items.
  'heartwood-stake': { id: 'heartwood-stake', name: 'Heartwood Stake', icon: '🪵', kind: 'misc', questItem: true, value: 0, examine: 'A stake cut from the Heartwood, the length of a gnome\'s arm. It is warm to hold. It was not cut for you.' },
  'valve-maps': { id: 'valve-maps', name: 'Valve Maps', icon: '🗺️', kind: 'misc', questItem: true, value: 0, examine: 'Water-stained maps of the Drainpipe. Each valve is drawn as a little star, and one of the stars has been crossed out.' },
  'c5-cricket-leg': { id: 'c5-cricket-leg', name: 'Cricket leg', icon: '🦵', kind: 'misc', questItem: true, stackable: true, value: 0, examine: 'Still twitching a little. Good bait, and Juniper says it is never wise to ask why.' },
  'c5-hazels-letter': { id: 'c5-hazels-letter', name: 'Hazel\'s letter', icon: '✉️', kind: 'misc', questItem: true, value: 0, examine: 'Sealed twice, with a thumbprint in the wax. Addressed to "J., at the lodge, if you still are".' },
};

const enemies: Record<string, EnemyDef> = {
  cricket: {
    id: 'cricket', name: 'Cricket', level: 15, rank: 'normal', family: 'shelled', damageType: 'crush', aggressive: false,
    loot: [{ item: 'c5-cricket-leg', chance: 0.6 }], gold: [1, 4],
    model: 'cricket', color: 0x5a7a2a, scale: 1, respawnSeconds: 30,
    examine: 'Sings all night from the hedge, and stops the moment you come near. Most of the hedge has learned not to mind.', wants: 'Song, at night.',
  },
  centipede: {
    id: 'centipede', name: 'Centipede', level: 16, rank: 'normal', family: 'shelled', damageType: 'pierce', aggressive: true,
    loot: [], gold: [2, 6],
    model: 'centipede', color: 0x7a3a2a, scale: 1.2, respawnSeconds: 30,
    examine: 'Too many legs, and every one of them has an opinion about you.', wants: 'Dark and damp, and nobody standing on it.',
  },
  'wildling-scout': {
    id: 'wildling-scout', name: 'Wildling scout', level: 16, rank: 'normal', family: 'fired', damageType: 'slash', aggressive: true,
    loot: [], gold: [2, 6],
    model: 'gnome', color: 0x6a8a4a, scale: 1, respawnSeconds: 30,
    examine: 'Bark-brown and green-grey, with a bow made from a branch that was alive last spring.', wants: 'The loggers gone from the hedge.',
  },
  'hedgewright-thug': {
    id: 'hedgewright-thug', name: 'Hedgewright thug', level: 16, rank: 'normal', family: 'fired', damageType: 'crush', aggressive: true,
    loot: [], gold: [2, 6],
    model: 'gnome', color: 0x5a4a3a, scale: 1, respawnSeconds: 30,
    examine: 'A Crown logger with a grudge and a double-bladed axe. He has been paid to swing it at things that are not trees.', wants: 'The Wildlings gone, and his pay on time.',
  },
  'web-spider': {
    id: 'web-spider', name: 'Web spider', level: 17, rank: 'normal', family: 'shelled', damageType: 'pierce', aggressive: true,
    loot: [], gold: [2, 6],
    model: 'spider', color: 0x3a3a3a, scale: 1, respawnSeconds: 30,
    examine: 'Drops from the canopy on a thread and tests whether you are food. The thread is slow. The spider is not.', wants: 'Food in the web.',
  },
  'weaver-below': {
    id: 'weaver-below', name: 'The Weaver Below', level: 18, rank: 'elite', family: 'shelled', damageType: 'pierce', aggressive: true,
    loot: [{ item: 'c5-weavers-shawl', chance: 1 }], gold: [40, 60],
    model: 'spider', color: 0x2a2a2a, scale: 2, respawnSeconds: 120,
    examine: 'A spider the size of a wheelbarrow, in the dark of Webhollow. Her silk hangs in sheets, and in the sheets, cocoons.', wants: 'Her egg-sac, safe until it hatches.',
    moves: [
      { id: 'web-wrap', name: 'Web Wrap', kind: 'ring', every: 12, telegraph: 1.2, radius: 5, damage: 1, status: 'rooted', statusSeconds: 3 },
      { id: 'egg-sacs', name: 'Egg-sacs', kind: 'summon', every: 30, telegraph: 2, summon: { enemy: 'web-spider', count: 2 } },
    ],
    lastWords: 'The egg-sac will hatch without me. Somebody will have to tell it.',
  },
  'paper-wasp': {
    id: 'paper-wasp', name: 'Paper wasp', level: 18, rank: 'normal', family: 'winged', damageType: 'pierce', aggressive: true,
    loot: [], gold: [2, 6],
    model: 'wasp', color: 0xc8a040, scale: 0.9, respawnSeconds: 30,
    examine: 'Grey-gold, papery, and quick to take offence at anyone near the Spire.', wants: 'Their Spire safe.',
  },
  'wasp-drone': {
    id: 'wasp-drone', name: 'Wasp drone', level: 19, rank: 'elite', family: 'winged', damageType: 'pierce', aggressive: true,
    loot: [], gold: [6, 12],
    model: 'wasp', color: 0xb08a30, scale: 1.1, respawnSeconds: 120,
    examine: 'Bigger than a paper wasp and far less interested in talking. It guards the Queen as if the Queen could not guard herself.', wants: 'Her Spire, safe.',
  },
  'queen-vespa': {
    id: 'queen-vespa', name: 'Queen Vespa', level: 20, rank: 'boss', family: 'winged', damageType: 'pierce', aggressive: true,
    loot: [{ item: 'c5-vespas-stinger', chance: 1 }], gold: [120, 180],
    model: 'wasp', color: 0xd8b050, scale: 2.4, respawnSeconds: 0,
    examine: 'A queen wasp, nested high in a tower she built from the hedge\'s own paper. The loggers keep cutting toward her, and she keeps building higher.', wants: 'Her Spire, which the loggers keep cutting toward.',
    moves: [
      { id: 'sting-rain', name: 'Sting Rain', kind: 'ring', every: 14, telegraph: 2, radius: 8, damage: 0.8, status: 'poisoned', statusSeconds: 6 },
      { id: 'royal-guard', name: 'Royal Guard', kind: 'summon', every: 30, telegraph: 1.5, summon: { enemy: 'wasp-drone', count: 2 } },
      { id: 'paper-wall', name: 'Paper Wall', kind: 'buff', every: 40, telegraph: 1.5 },
    ],
    lastWords: 'Then the hedge will have a new queen. It always does.',
  },
  'cistern-eel': {
    id: 'cistern-eel', name: 'Cistern eel', level: 18, rank: 'normal', family: 'soft', damageType: 'slash', aggressive: true,
    loot: [], gold: [2, 6],
    model: 'worm', color: 0x1e4a4a, scale: 1.4, respawnSeconds: 30,
    examine: 'Lives in the dark water of the Cistern. You see the ripples before you see the eel.', wants: 'Its dark water, undisturbed.',
  },
  'drowned-toad': {
    id: 'drowned-toad', name: 'Drowned toad', level: 19, rank: 'elite', family: 'soft', damageType: 'pierce', aggressive: false,
    loot: [], gold: [6, 12],
    model: 'frog', color: 0x3a5a3a, scale: 1.2, respawnSeconds: 120,
    examine: 'Sits at the edge of the pool, quiet, until something comes close enough to be a snack.', wants: 'Quiet, and the Cistern to itself.',
  },
  'mother-vesh': {
    id: 'mother-vesh', name: 'Mother Vesh', level: 20, rank: 'boss', family: 'soft', damageType: 'pierce', aggressive: true,
    loot: [{ item: 'c5-vesh-teeth', chance: 1 }, { item: 'valve-maps', chance: 1 }], gold: [120, 180],
    model: 'leech', color: 0x3a2a4a, scale: 2.2, respawnSeconds: 0,
    examine: 'A giant leech queen in her pool, with a brood that never stops hatching. The Pipewrights drew her as a warning, and then drew the valve maps under her.', wants: 'Her brood fed.',
    moves: [
      { id: 'brood-tide', name: 'Brood Tide', kind: 'summon', every: 20, telegraph: 1.5, summon: { enemy: 'c5-brood-leech', count: 2 } },
      { id: 'undertow', name: 'Undertow', kind: 'pool', every: 16, telegraph: 2, radius: 6, damage: 1, status: 'soaked', statusSeconds: 4 },
    ],
    lastWords: 'Good. Good. The water will go down now, and so will you.',
  },
  'c5-brood-leech': {
    id: 'c5-brood-leech', name: 'Brood leech', level: 19, rank: 'trivial', family: 'soft', damageType: 'pierce', aggressive: true,
    loot: [], gold: [0, 1],
    model: 'leech', color: 0x2a1a2a, scale: 0.5, respawnSeconds: 0,
    examine: 'A small one, the size of a thumb. There are a lot of them, and they all want to reach the pool.', wants: 'Mother Vesh.',
  },
  'c5-feral-raider': {
    id: 'c5-feral-raider', name: 'Feral raider', level: 16, rank: 'normal', family: 'fired', damageType: 'slash', aggressive: true,
    loot: [], gold: [2, 6],
    model: 'gnome', color: 0x8a8a8a, scale: 1, respawnSeconds: 30,
    examine: 'Grey clay, no hat, and not a Wildling. Ferals were thrown out of the hedge years ago, and they still know the way in.', wants: 'The sacks at the mill, and a home that is not the drains.',
  },
};

const npcs: Record<string, NpcDef> = {
  splitwell: {
    id: 'splitwell', name: 'Boss Alder Splitwell', look: look(0x6a4a1a, 0x5a3a2a, 0x9a7a4a), zone: 'hedgewood', x: 46, z: 34, wander: 0.2,
    examine: 'Foreman of the Hedgewrights. His axe is always over one shoulder, and his son is always over the hedge.',
    greetings: [
      { when: { questStage: { id: 'c5-elder-privet', stage: 0 } }, node: 'privetAgain' },
      { when: { questStage: { id: 'c5-fens-two-families', stage: 1 } }, node: 'fenCame' },
      { node: 'hub' },
    ],
    nodes: {
      hub: {
        hub: true,
        text: 'Trees grow back. Gnomes don\'t. The Privet is the oldest hedge in Fescue, and the Wildlings sleep in it. What do you want?',
        options: [
          { text: 'The Heartwood. How do we get it?', next: 'privetStart', action: { type: 'startQuest', quest: 'c5-elder-privet' }, when: { quest: { id: 'c5-elder-privet', status: 'none' }, questAtLeast: { id: 'c4-great-haul', stage: 99 } } },
          { text: 'Who can talk to the Wildlings?', next: 'neutralStart', action: { type: 'startQuest', quest: 'c5-neutral-ground' }, when: { quest: { id: 'c5-neutral-ground', status: 'none' }, questAtLeast: { id: 'c5-elder-privet', stage: 99 } } },
          { text: 'The Sawdust Mill is under raid. Help.', next: 'millStart', action: { type: 'startQuest', quest: 'c5-mill-raid' }, when: { quest: { id: 'c5-mill-raid', status: 'none' }, questAtLeast: { id: 'c5-elder-privet', stage: 99 } } },
          { text: 'Queen Vespa has to go. What do you need?', next: 'spireStart', action: { type: 'startQuest', quest: 'c5-paper-spire' }, when: { quest: { id: 'c5-paper-spire', status: 'none' }, questAtLeast: { id: 'c5-neutral-ground', stage: 99 } } },
          { text: 'What do we do about the Heartwood itself?', next: 'heartStart', action: { type: 'startQuest', quest: 'c5-heartwood' }, when: { quest: { id: 'c5-heartwood', status: 'none' }, questAtLeast: { id: 'c5-paper-spire', stage: 99 } } },
          { text: 'We fell the Privet. Let the Hedgewrights work.', next: 'fell', action: { type: 'setFlag', flag: 'hedge', value: 'felled' }, when: { quest: { id: 'c5-heartwood', status: 'active' }, flagUnset: 'hedge' } },
          { text: 'Goodbye.' },
        ],
      },
      privetStart: { text: 'Heartwood? Easy. Fell the Privet and take it. The Wildlings live in it, so mind the children\'s names on the bark. Talk to me again when you are ready.', options: [{ text: 'I will go and look.' }] },
      privetAgain: { text: 'Still here? Good. The Privet is the old hedge at the middle of the wood, and the children\'s names are carved all over it. Go and see what it is worth.', options: [{ text: 'Goodbye, Splitwell.' }] },
      neutralStart: { text: 'Juniper Quickstring keeps the hunters\' lodge at Barkhollow. Both sides listen to her, which is more than they do to me.', options: [{ text: 'Then I will find her.' }] },
      millStart: { text: 'Raiders at the Sawdust Mill, bareheaded, hitting it like it owes them money. Hold it for ninety seconds. Blame the Wildlings afterwards, as is the custom.', options: [{ text: 'I will hold the mill.' }] },
      spireStart: { text: 'Queen Vespa\'s Spire is on the wasp hedge, past the web-spiders. Kill her. Burdock wants her gone as badly as I do. Don\'t tell her I said so.', options: [{ text: 'I will find the Spire.' }] },
      heartStart: { text: 'You can have the Heartwood two ways. Fell the Privet with my Hedgewrights, or get a branch from Burdock, if she will still speak to you. Choose before the sun goes down.', options: [{ text: 'I will think on it.' }] },
      fell: { text: 'Then the axes go in at dawn, and the Wildlings will come to the Privet to stop us. Stand with the Hedgewrights. It will be done by the bell.', options: [{ text: 'Goodbye, Splitwell.' }] },
      fenCame: { text: 'Fen came to you? Fen walked out of here at fourteen and never looked back. Burdock is the one who should hear it from you. Go on, then.', options: [{ text: 'I will tell her.' }] },
    },
  },

  juniper: {
    id: 'juniper', name: 'Juniper Quickstring', look: look(0x2a4a2a, 0x6a5a3a, null, { hair: { color: 0x6a3a1a, style: 'pigtails' } }), zone: 'hedgewood', x: 72, z: -22, wander: 0.3, trainer: 'slinger',
    examine: 'Huntmaster of Barkhollow. Trains Slingers in beast taming and in saying no. She is very good at both.',
    greetings: [
      { when: { questStage: { id: 'c5-neutral-ground', stage: 1 } }, node: 'neutralTalk' },
      { when: { questStage: { id: 'c5-twitchett-and-quickstring', stage: 0 } }, node: 'letterIn' },
      { node: 'hub' },
    ],
    nodes: {
      hub: {
        hub: true,
        text: 'I hunt what\'s hungry before it hunts what\'s mine. You look like you want to hunt something. What is it?',
        options: [
          { text: 'Something spinning in Webhollow. What is it?', next: 'weaverStart', action: { type: 'startQuest', quest: 'c5-weaver-below' }, when: { quest: { id: 'c5-weaver-below', status: 'none' }, questAtLeast: { id: 'c5-neutral-ground', stage: 99 } } },
          { text: 'Teach me to tame a beetle.', next: 'beetleStart', action: { type: 'startQuest', quest: 'c5-beetle-of-your-own' }, when: { quest: { id: 'c5-beetle-of-your-own', status: 'none' }, questAtLeast: { id: 'c5-neutral-ground', stage: 99 } } },
          { text: 'Goodbye.' },
        ],
      },
      neutralTalk: { text: 'Mother Burdock will see you at the edge of the tangle, if you come unarmed. Tell her Splitwell sent you. She will hate that. Then she will listen.', options: [{ text: 'I will go now.' }] },
      letterIn: { text: 'Hazel\'s letter? Hm. Give me a moment. Well. Tell her I read it twice, and I am not writing back in front of a stranger.', options: [{ text: 'I will tell her.' }] },
      weaverStart: { text: 'Webhollow, in the dark hedge. The Weaver Below has three gnomes wrapped in her silk. Get there, kill her, and cut them free. Mind the webs.', options: [{ text: 'I am going.' }] },
      beetleStart: { text: 'Five cricket legs for bait, then a young stag beetle in the hedge will take you on, if you are patient. Slingers get a companion for it. Everyone else gets a beetle that follows them about.', options: [{ text: 'Show me.' }] },
    },
  },

  burdock: {
    id: 'burdock', name: 'Mother Burdock', look: look(0x3a5a1a, 0x5a4a2a, 0x8a8a7a), zone: 'hedgewood', x: -36, z: -16, wander: 0.2,
    examine: 'Chieftain of the Wildlings, half-hidden in her own tangle. She exiled the Ferals herself, and she has not forgiven anyone who asked why.',
    greetings: [
      { when: { questStage: { id: 'c5-fens-two-families', stage: 2 } }, node: 'fenDone' },
      { node: 'hub' },
    ],
    nodes: {
      hub: {
        hub: true,
        text: 'You cut, you call it tending. We grow, you call it wild. Nobody asked us about the King\'s Fall. What do you want?',
        options: [
          { text: 'Vespa. Both sides want her gone.', next: 'spireStart', action: { type: 'startQuest', quest: 'c5-paper-spire' }, when: { quest: { id: 'c5-paper-spire', status: 'none' }, questAtLeast: { id: 'c5-neutral-ground', stage: 99 } } },
          { text: 'The Heartwood. What is the price?', next: 'heartStart', action: { type: 'startQuest', quest: 'c5-heartwood' }, when: { quest: { id: 'c5-heartwood', status: 'none' }, questAtLeast: { id: 'c5-paper-spire', stage: 99 } } },
          { text: 'Here is Vespa\'s stinger. Give us the branch in peace.', next: 'peace', action: { type: 'setFlag', flag: 'hedge', value: 'peace' }, when: { quest: { id: 'c5-heartwood', status: 'active' }, flagUnset: 'hedge', hasItem: { item: 'c5-vespas-stinger', count: 1 } } },
          { text: 'Goodbye.' },
        ],
      },
      spireStart: { text: 'Queen Vespa\'s Spire is on the wasp hedge, past the web-spiders. Kill her. Splitwell will hate that I said so, and I will hate that he is right.', options: [{ text: 'I will find the Spire.' }] },
      heartStart: { text: 'The Heartwood is the Privet\'s core. Splitwell will fell it with or without you. I would rather give you a branch, if you bring me Vespa\'s stinger to cut it with.', options: [{ text: 'I will bring the stinger.' }] },
      peace: { text: 'Cut here, with ceremony, and the Privet will grow back over the wound. Peace, for now. The branch is yours. Do not make me sorry.', options: [{ text: 'Thank you, Mother.' }] },
      fenDone: { text: 'Alder\'s boy came home. Walked in, walked out, and sat down at a table with his father. Fen says you put us there. Hm. We will see what it is worth.', options: [{ text: 'Goodbye, Mother.' }] },
    },
  },

  fen: {
    id: 'fen', name: 'Fen Splitwell', look: look(0x3a6a4a, 0x7a5a3a, null), zone: 'hedgewood', x: -30, z: -10, wander: 0.4,
    examine: 'Alder Splitwell\'s son, and Burdock\'s adopted one. Walked out of the Clippings at fourteen. Hasn\'t stopped walking between the two camps since.',
    greetings: [
      { when: { questStage: { id: 'c5-fens-two-families', stage: 0 } }, node: 'nudge' },
      { node: 'hub' },
    ],
    nodes: {
      hub: {
        hub: true,
        text: 'Da thinks I was stolen. I walked. Mum\'s in the hedge and Da is at the Clippings, and nobody sits at the same table. What do you want?',
        options: [
          { text: 'Help me get your families to one table.', next: 'start', action: { type: 'startQuest', quest: 'c5-fens-two-families' }, when: { quest: { id: 'c5-fens-two-families', status: 'none' }, questAtLeast: { id: 'c5-neutral-ground', stage: 99 } } },
          { text: 'Goodbye.' },
        ],
      },
      start: { text: 'Then start with me. I am the bit of this you can talk to. Then Da. Then Mum.', options: [{ text: 'Fine.' }] },
      nudge: { text: 'You came back. Good. I am listening. Now go and talk to Da, then to Mum. Make them sit down.', options: [{ text: 'I will.' }] },
    },
  },

  lichen: {
    id: 'lichen', name: 'Old Lichen', look: look(0x5a7a3a, 0x4a6a3a, 0x9aaa8a), zone: 'hedgewood', x: -46, z: -48, wander: 0.1,
    examine: 'Wildling elder, half moss. Has sat under the same root for so long that the root has started to sit under him.',
    greetings: [
      { when: { questStage: { id: 'c5-old-lichens-guest', stage: 1 } }, node: 'grave' },
      { node: 'hub' },
    ],
    nodes: {
      hub: {
        hub: true,
        text: 'Slow down, sapling. The hedge has been here longer than your worry. What do you want?',
        options: [
          { text: 'Is anyone hiding in the hedge?', next: 'start', action: { type: 'startQuest', quest: 'c5-old-lichens-guest' }, when: { quest: { id: 'c5-old-lichens-guest', status: 'none' }, questAtLeast: { id: 'c5-neutral-ground', stage: 99 } } },
          { text: 'Goodbye.' },
        ],
      },
      start: { text: 'One of the forty Pipewrights came up here after the Backflow. I hid him. He is under a stone in the hedge. Find it. He wrote one more page before he cracked.', options: [{ text: 'I will look for the stone.' }] },
      grave: { text: 'You found him. Did he write? He always did. Keep the page, if there is one. Thank you, sapling.', options: [{ text: 'You are welcome, Lichen.' }] },
    },
  },

  // Non-canon NPCs owned by this pack.
  'c5-clippings-smith': {
    id: 'c5-clippings-smith', name: 'Rook Axehandle', look: look(0x3a3a3a, 0x7a3a2a, 0x6a5a4a), zone: 'hedgewood', x: 34, z: 44, wander: 0,
    examine: 'Smith of the Clippings camp. Sharpens everything the Hedgewrights cut, and some of what they should not have.',
    shop: ['c5-hedge-shears', 'c5-woodsman-hatchet', 'c5-bark-shell-plate', 'c5-yew-slingshot', 'c5-elder-blowpipe', 'c5-privet-staff'],
    greetings: [{ node: 'hub' }],
    nodes: {
      hub: {
        hub: true,
        text: 'Everything I sell came out of the hedge. The hedge would like it back, but it has not asked nicely.',
        options: [{ text: 'Show me your wares.', action: { type: 'openShop' } }, { text: 'Goodbye.' }],
      },
    },
  },

  'c5-barkhollow-tanner': {
    id: 'c5-barkhollow-tanner', name: 'Pelt Ashwick', look: look(0x6a4a1a, 0x8a6a3a, null), zone: 'hedgewood', x: 74, z: -10, wander: 0,
    examine: 'Tanner at Barkhollow. Cures hides, wasp paper and spider silk, and asks no questions about where they came from.',
    shop: ['c5-wasp-paper-jerkin', 'c5-spider-silk-smock'],
    greetings: [{ node: 'hub' }],
    nodes: {
      hub: {
        hub: true,
        text: 'Wasp paper, spider silk. Don\'t ask which of them is still wriggling. It is cured now, mostly.',
        options: [{ text: 'Show me your wares.', action: { type: 'openShop' } }, { text: 'Goodbye.' }],
      },
    },
  },

  'c5-mill-survivor': {
    id: 'c5-mill-survivor', name: 'Tuck Sawdust', look: look(0x8a8a8a, 0x4a4a4a, 0xaaaaaa), zone: 'hedgewood', x: -14, z: 58, wander: 0.1,
    hidden: { not: { questStage: { id: 'c5-mill-raid', stage: 1 } } },
    examine: 'Miller of the Sawdust Mill. Dented, bruised, and still counting the sacks.',
    greetings: [{ node: 'hub' }],
    nodes: {
      hub: {
        text: 'They weren\'t Wildlings. I saw them close. Bareheaded, grey as clay, and they knew where the sacks were kept. Ferals. The Hedgewrights will say otherwise.',
        options: [{ text: 'Ferals? Are you sure?' , next: 'sure' }, { text: 'Thank you.' }],
      },
      sure: { text: 'I\'ve seen the Ferals in the drains, and I\'ve seen them here. Same grey, same walk. Nobody believes a miller. Believe me.', options: [{ text: 'I believe you.' }] },
    },
  },
};

const quests: Record<string, QuestDef> = {
  'c5-elder-privet': {
    id: 'c5-elder-privet', name: 'The Elder Privet', giver: 'splitwell', zone: 'hedgewood', level: 15, tier: 'main', chain: 'Bough',
    stages: [{ text: 'Ask Boss Splitwell about the Heartwood, then talk to him again.', objective: { type: 'talk', npc: 'splitwell' } }],
    reward: { gold: 60, items: [] },
  },
  'c5-neutral-ground': {
    id: 'c5-neutral-ground', name: 'Neutral Ground', giver: 'juniper', zone: 'hedgewood', level: 15, tier: 'main', chain: 'Bough',
    stages: [
      { text: 'Reach Barkhollow, the hunters\' lodge.', objective: { type: 'reach', zone: 'hedgewood', x: 80, z: -20, r: 12 } },
      { text: 'Talk to Juniper Quickstring.', objective: { type: 'talk', npc: 'juniper' } },
    ],
    reward: { gold: 80, items: [] },
  },
  'c5-mill-raid': {
    id: 'c5-mill-raid', name: 'The Mill Raid', giver: 'splitwell', zone: 'hedgewood', level: 16, tier: 'main', chain: 'Bough',
    stages: [
      {
        text: 'Hold the Sawdust Mill for ninety seconds against the bareheaded raiders.',
        objective: { type: 'defend', zone: 'hedgewood', x: 0, z: 60, r: 10, seconds: 90, waves: [
          { enemy: 'c5-feral-raider', count: 3, at: 0 },
          { enemy: 'c5-feral-raider', count: 3, at: 30 },
          { enemy: 'c5-feral-raider', count: 3, at: 60 },
        ] },
      },
      { text: 'Talk to the miller who survived the raid.', objective: { type: 'talk', npc: 'c5-mill-survivor' } },
    ],
    reward: { gold: 90, items: [] },
  },
  'c5-weaver-below': {
    id: 'c5-weaver-below', name: 'The Weaver Below', giver: 'juniper', zone: 'hedgewood', level: 18, tier: 'main', chain: 'Bough',
    stages: [
      { text: 'Reach Webhollow, in the dark hedge.', objective: { type: 'reach', zone: 'hedgewood', x: 60, z: -70, r: 10 } },
      { text: 'Kill the Weaver Below.', objective: { type: 'kill', enemy: 'weaver-below', count: 1 } },
      { text: 'Cut the three cocooned gnomes free.', objective: { type: 'interact', object: 'c5-cocoon', count: 3 } },
    ],
    reward: { gold: 120, items: [] },
  },
  'c5-fens-two-families': {
    id: 'c5-fens-two-families', name: 'Fen\'s Two Families', giver: 'fen', zone: 'hedgewood', level: 17, tier: 'main', chain: 'Bough',
    stages: [
      { text: 'Talk to Fen again, so that Fen can point you at Da.', objective: { type: 'talk', npc: 'fen' } },
      { text: 'Talk to Alder Splitwell.', objective: { type: 'talk', npc: 'splitwell' } },
      { text: 'Talk to Mother Burdock.', objective: { type: 'talk', npc: 'burdock' } },
    ],
    reward: { gold: 100, items: [] },
  },
  'c5-paper-spire': {
    id: 'c5-paper-spire', name: 'The Paper Spire', giver: 'burdock', zone: 'hedgewood', level: 19, tier: 'main', chain: 'Bough',
    stages: [
      { text: 'Reach the Paper Spire, the wasp tower on the wasp hedge.', objective: { type: 'reach', zone: 'hedgewood', x: -80, z: 40, r: 12 } },
      { text: 'Kill Queen Vespa.', objective: { type: 'kill', enemy: 'queen-vespa', count: 1 } },
    ],
    reward: { gold: 150, items: [] },
  },
  'c5-heartwood': {
    id: 'c5-heartwood', name: 'The Heartwood', giver: 'burdock', zone: 'hedgewood', level: 20, tier: 'finale', chain: 'Bough',
    stages: [
      { text: 'Choose: Burdock gives you a branch in peace, or Splitwell\'s axes fell the Privet.', objective: { type: 'choice', flag: 'hedge' } },
    ],
    reward: { gold: 200, items: [{ item: 'heartwood-stake', count: 1 }] },
  },
  'c5-valve-maps': {
    id: 'c5-valve-maps', name: 'The Valve Maps', giver: 'ida', zone: 'deeps', level: 19, tier: 'main', chain: 'Bough',
    stages: [
      { text: 'Reach the Drainpipe Cistern, down through the hatch.', objective: { type: 'reach', zone: 'deeps', x: 0, z: 24, r: 8 } },
      { text: 'Kill Mother Vesh in her pool.', objective: { type: 'kill', enemy: 'mother-vesh', count: 1 } },
      { text: 'Collect the Valve Maps from her pool.', objective: { type: 'collect', item: 'valve-maps', count: 1 } },
    ],
    reward: { gold: 150, items: [] },
  },

  'c5-beetle-of-your-own': {
    id: 'c5-beetle-of-your-own', name: 'A Beetle of Your Own', giver: 'juniper', zone: 'hedgewood', level: 15, tier: 'side', chain: 'Bough',
    stages: [
      { text: 'Collect 5 cricket legs as bait.', objective: { type: 'collect', item: 'c5-cricket-leg', count: 5 }, takeItems: [{ item: 'c5-cricket-leg', count: 5 }] },
      { text: 'Find a young stag beetle in the hedge and tame it.', objective: { type: 'interact', object: 'c5-young-stag-beetle', count: 1 } },
    ],
    reward: { gold: 40, items: [{ item: 'c5-tamed-beetle', count: 1 }] },
  },
  'c5-old-lichens-guest': {
    id: 'c5-old-lichens-guest', name: 'Old Lichen\'s Guest', giver: 'lichen', zone: 'hedgewood', level: 16, tier: 'side', chain: 'Bough',
    stages: [
      { text: 'Find the Pipewright\'s grave under the stone in the hedge.', objective: { type: 'interact', object: 'c5-pipewright-grave', count: 1 } },
      { text: 'Tell Old Lichen what you found.', objective: { type: 'talk', npc: 'lichen' } },
    ],
    reward: { gold: 50, items: [] },
  },
  'c5-twitchett-and-quickstring': {
    id: 'c5-twitchett-and-quickstring', name: 'Twitchett and Quickstring', giver: 'twitchett', zone: 'hedgewood', level: 15, tier: 'side', chain: 'Bough',
    stages: [
      { text: 'Carry Hazel\'s letter to Juniper Quickstring.', objective: { type: 'talk', npc: 'juniper' }, takeItems: [{ item: 'c5-hazels-letter', count: 1 }] },
    ],
    reward: { gold: 30, items: [] },
  },
};

const objects: Record<string, WorldObjectDef> = {
  'c5-young-stag-beetle': {
    id: 'c5-young-stag-beetle', zone: 'hedgewood', name: 'Young stag beetle', x: -46, z: -34, model: 'generic', verb: 'Tame',
    examine: 'A young stag beetle with a bad temper and a good jaw. It has been eating cricket legs and is not sorry.',
    text: 'The beetle lets you put a cord collar on it. It looks very pleased with itself.',
    when: { questStage: { id: 'c5-beetle-of-your-own', stage: 1 } },
  },
  'c5-pipewright-grave': {
    id: 'c5-pipewright-grave', zone: 'hedgewood', name: 'Pipewright\'s grave', x: -44, z: -66, model: 'grave', verb: 'Dig',
    examine: 'A small mound with a flat stone on it, half hidden by the hedge. Someone has tucked a cricket leg under the edge, as an offering.',
    text: 'Under the stone is a cracked clay tile, scratched with a Pipewright\'s hand: "Still holding. Tell the Keep I held."',
    once: true,
    when: { questStage: { id: 'c5-old-lichens-guest', stage: 0 } },
  },
  'c5-cocoon': {
    id: 'c5-cocoon', zone: 'hedgewood', name: 'Silk cocoon', x: 56, z: -74, model: 'generic', verb: 'Cut',
    examine: 'A silk cocoon the size of a barrel, with a gnome inside. The gnome is still breathing, which is more than the silk ought to allow.',
    text: 'You cut the silk. A gnome falls out, coughing, and says thanks in a voice that has not been used for some time.',
    when: { questStage: { id: 'c5-weaver-below', stage: 2 } },
  },
};

const spawns: SpawnGroup[] = [
  // Hedgewood.
  { zone: 'hedgewood', enemy: 'cricket', x: 20, z: -40, count: 4, spread: 6 },
  { zone: 'hedgewood', enemy: 'centipede', x: 56, z: -70, count: 3, spread: 4 },
  { zone: 'hedgewood', enemy: 'web-spider', x: 60, z: -70, count: 4, spread: 6 },
  { zone: 'hedgewood', enemy: 'weaver-below', x: 60, z: -70, count: 1, spread: 0, when: { questStage: { id: 'c5-weaver-below', stage: 1 } } },
  { zone: 'hedgewood', enemy: 'wildling-scout', x: -40, z: -20, count: 3, spread: 5, when: { flag: { name: 'hedge', value: 'felled' } } },
  { zone: 'hedgewood', enemy: 'hedgewright-thug', x: 44, z: 46, count: 3, spread: 3, when: { flag: { name: 'hedge', value: 'peace' } } },
  { zone: 'hedgewood', enemy: 'paper-wasp', x: -72, z: 40, count: 4, spread: 6 },
  { zone: 'hedgewood', enemy: 'wasp-drone', x: -72, z: 40, count: 2, spread: 5 },
  { zone: 'hedgewood', enemy: 'queen-vespa', x: -74, z: 38, count: 1, spread: 0, when: { questStage: { id: 'c5-paper-spire', stage: 1 } } },
  // Storyline 01's extra wave, as a fourth spawn at the mill.
  { zone: 'hedgewood', enemy: 'c5-feral-raider', x: 0, z: 60, count: 4, spread: 10, when: { flag: { name: 'feral', value: 'turned_away' }, questStage: { id: 'c5-mill-raid', stage: 0 } } },
  // Drainpipe Cistern (zone deeps): only once the hatch has opened.
  { zone: 'deeps', enemy: 'cistern-eel', x: 0, z: 22, count: 3, spread: 4, when: { not: { quest: { id: 'c5-valve-maps', status: 'none' } } } },
  { zone: 'deeps', enemy: 'drowned-toad', x: 14, z: -2, count: 2, spread: 3, when: { not: { quest: { id: 'c5-valve-maps', status: 'none' } } } },
  { zone: 'deeps', enemy: 'mother-vesh', x: 0, z: -14, count: 1, spread: 0, when: { questStage: { id: 'c5-valve-maps', stage: 1 } } },
];

const topics: Record<string, DialogueOption[]> = {
  ida: [
    { text: 'The Valve Maps. Do you know where they are?', next: 'c5-ida-maps', action: { type: 'startQuest', quest: 'c5-valve-maps' }, when: { quest: { id: 'c5-valve-maps', status: 'none' }, questAtLeast: { id: 'c5-elder-privet', stage: 99 } } },
  ],
  twitchett: [
    { text: 'Is there anything to carry for Juniper Quickstring?', next: 'c5-hazel-letter', action: { type: 'startQuest', quest: 'c5-twitchett-and-quickstring' }, when: { quest: { id: 'c5-twitchett-and-quickstring', status: 'none' }, questAtLeast: { id: 'c5-elder-privet', stage: 99 } } },
  ],
};

const extraNodes: Record<string, Record<string, DialogueNode>> = {
  ida: {
    'c5-ida-maps': { text: 'My father had the only key to the Great Valve, and he put the maps down the Cistern before he went up the drain. The valve can bog the whole Shorn in mud, if anyone can open it. Find the maps.', options: [{ text: 'I will go down.' }] },
    'c5-ida-thanks': { text: 'The maps. Mother Vesh\'s pool, and the valve paths under it. The Great Valve can bog the whole Shorn in mud, if anyone can open it. My father had the only key.', options: [{ text: 'You are welcome, Ida.', action: { type: 'setFlag', flag: 'c5-ida-thanked', value: 'yes' } }] },
  },
  twitchett: {
    'c5-hazel-letter': { text: 'Hazel\'s letter to Juniper, sealed twice. Two old hunters, one long-overdue reply. Carry it, and do not read it.', options: [{ text: 'Take the letter.', action: { type: 'giveItem', item: 'c5-hazels-letter', count: 1 } }] },
  },
};

const greetingsFirst: Record<string, Greeting[]> = {
  ida: [{ when: { quest: { id: 'c5-valve-maps', status: 'done' }, flagUnset: 'c5-ida-thanked' }, node: 'c5-ida-thanks' }],
};

export const PACK: ContentPack = {
  id: 'ch5-hedgewood',
  items,
  enemies,
  npcs,
  quests,
  objects,
  spawns,
  topics,
  extraNodes,
  greetingsFirst,
};
