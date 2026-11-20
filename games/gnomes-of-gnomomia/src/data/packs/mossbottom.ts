// Content pack: Mossbottom Vale (Chapter 1, levels 1-6). Prefix for new ids: mb-.
import { look, type ContentPack, type DialogueOption } from '../../config';

// Side-quest start options, shared by the NPCs that give them (Fernwick and Pip are owned by this pack).
const ASK_STATUE: DialogueOption = {
  text: 'Who is the statue at the well?', next: 'statueTalk',
  action: { type: 'startQuest', quest: 'mb-trowel-like-yours' },
  when: { quest: { id: 'mb-trowel-like-yours', status: 'none' } },
};
const ASK_MOLES: DialogueOption = {
  text: 'What else is out there?', next: 'molesTalk',
  action: { type: 'startQuest', quest: 'mb-what-moles-know' },
  when: { quest: { id: 'mb-what-moles-know', status: 'none' } },
};
const ASK_TOTEM: DialogueOption = {
  text: 'Have you heard of a feral totem?', next: 'totemTalk',
  action: { type: 'startQuest', quest: 'mb-feral-totem' },
  when: { quest: { id: 'mb-feral-totem', status: 'none' } },
};
const ASK_CHEST: DialogueOption = {
  text: 'Anything odd down by the shore?', next: 'chestTalk',
  action: { type: 'startQuest', quest: 'mb-puddlemere-chest' },
  when: { quest: { id: 'mb-puddlemere-chest', status: 'none' } },
};

export const PACK: ContentPack = {
  id: 'mossbottom',

  items: {
    'rusty-trowel': { id: 'rusty-trowel', name: 'Rusty trowel', icon: '🗡️', kind: 'weapon', slot: 'weapon', ilvl: 1, damageType: 'slash', hands: 1, weaponClass: 'melee', value: 5, examine: 'It has dug a thousand flowerbeds.' },
    'bronze-shears': { id: 'bronze-shears', name: 'Bronze shears', icon: '✂️', kind: 'weapon', slot: 'weapon', ilvl: 3, damageType: 'slash', hands: 1, weaponClass: 'melee', value: 45, examine: 'Sharp enough to trim a hedge or a beetle.' },
    'garden-mallet': { id: 'garden-mallet', name: 'Garden mallet', icon: '🔨', kind: 'weapon', slot: 'weapon', ilvl: 3, damageType: 'crush', hands: 1, weaponClass: 'melee', value: 35, examine: 'For croquet, and for disagreements.' },
    'iron-pick': { id: 'iron-pick', name: 'Iron pick', icon: '⛏️', kind: 'weapon', slot: 'weapon', ilvl: 5, damageType: 'crush', hands: 2, weaponClass: 'melee', value: 140, examine: 'Heavy. Very heavy.' },
    'mole-claw': { id: 'mole-claw', name: 'Mole King claw', icon: '🦴', kind: 'weapon', slot: 'weapon', ilvl: 7, rarity: 'heirloom', damageType: 'slash', hands: 1, weaponClass: 'melee', value: 260, examine: 'Torn from Grubthorn himself.' },
    'pot-lid': { id: 'pot-lid', name: 'Pot lid', icon: '🍳', kind: 'offhand', slot: 'offhand', ilvl: 1, armorType: 'shield', value: 10, examine: 'Someone is missing their soup lid.' },
    'oak-shield': { id: 'oak-shield', name: 'Oak shield', icon: '🛡️', kind: 'offhand', slot: 'offhand', ilvl: 4, armorType: 'shield', value: 70, examine: 'Carved from a fallen acorn tree.' },
    'acorn-cap': { id: 'acorn-cap', name: 'Acorn cap', icon: '🌰', kind: 'armor', slot: 'head', ilvl: 1, armorType: 'leather', value: 8, examine: 'A snug, nutty helmet.' },
    'thimble-helm': { id: 'thimble-helm', name: 'Thimble helm', icon: '🪖', kind: 'armor', slot: 'head', ilvl: 4, armorType: 'plate', value: 80, examine: 'A giant\'s thimble, polished to a shine.' },
    'moss-tunic': { id: 'moss-tunic', name: 'Moss tunic', icon: '👕', kind: 'armor', slot: 'body', ilvl: 1, armorType: 'cloth', value: 12, examine: 'Soft, green and a bit damp.' },
    'bark-vest': { id: 'bark-vest', name: 'Bark vest', icon: '🦺', kind: 'armor', slot: 'body', ilvl: 3, armorType: 'leather', value: 60, examine: 'Stiff, but it turns a blade.' },
    'beetle-plate': { id: 'beetle-plate', name: 'Beetle plate', icon: '🥋', kind: 'armor', slot: 'body', ilvl: 6, armorType: 'plate', value: 180, examine: 'Shell plates riveted on leather.' },
    'red-potion': { id: 'red-potion', name: 'Red potion', icon: '🧪', kind: 'potion', heal: 14, stackable: true, value: 15, examine: 'Restores 14 hit points.' },
    'blue-potion': { id: 'blue-potion', name: 'Blue potion', icon: '🫙', kind: 'potion', mana: 15, stackable: true, value: 20, examine: 'Restores 15 mana.' },
    mushroom: { id: 'mushroom', name: 'Mushroom', icon: '🍄', kind: 'potion', heal: 4, stackable: true, value: 3, examine: 'Probably edible. Restores 4 hit points.' },
    cigs: { id: 'cigs', name: 'Pack of cigs', icon: '🚬', prefab: 'clover-cig', kind: 'potion', stackable: true, value: 8, examine: 'Rolled dried clover and dandelion fluff. Mildly focusing (+1 Accuracy), mostly a look.' },
    beer: { id: 'beer', name: 'Dandelion beer', icon: '🍺', prefab: 'stout-tankard', kind: 'potion', heal: 2, stackable: true, value: 6, examine: 'Foamy, amber, and brewed behind the well. Restores 2 HP and makes you Tipsy (+1 Strength, -1 Accuracy).' },
    'slug-slime': { id: 'slug-slime', name: 'Slug slime', icon: '🟢', kind: 'misc', stackable: true, value: 2, examine: 'Sticky. Elder Fernwick wants it for some reason.' },
    'beetle-shell': { id: 'beetle-shell', name: 'Beetle shell', icon: '🐚', kind: 'misc', stackable: true, value: 6, examine: 'Glossy and hard. Tansy grinds these into potions.' },
    'mole-crown': { id: 'mole-crown', name: 'Mole crown', icon: '👑', kind: 'misc', value: 300, examine: 'The muddy crown of the Mole King.' },

    // Starter class items (plain, sold by Bramble).
    'mb-forked-twig-sling': { id: 'mb-forked-twig-sling', name: 'Forked twig sling', icon: '🪃', kind: 'weapon', slot: 'weapon', ilvl: 2, damageType: 'pierce', hands: 1, weaponClass: 'sling', value: 4, examine: 'A bit of bark, a bit of string, and an opinion.' },
    'mb-reed-blowpipe': { id: 'mb-reed-blowpipe', name: 'Reed blowpipe', icon: '🎋', kind: 'weapon', slot: 'weapon', ilvl: 2, damageType: 'pierce', hands: 1, weaponClass: 'blowpipe', value: 4, examine: 'Blow hard, aim harder.' },
    'mb-willow-switch': { id: 'mb-willow-switch', name: 'Willow switch', icon: '🌿', kind: 'weapon', slot: 'weapon', ilvl: 2, damageType: 'crush', hands: 2, weaponClass: 'staff', value: 4, examine: 'Bendy, and it stings.' },
    'mb-mushroom-hood': { id: 'mb-mushroom-hood', name: 'Mushroom hood', icon: '🧢', kind: 'armor', slot: 'head', ilvl: 2, armorType: 'cloth', value: 4, examine: 'Damp, pale and surprisingly warm.' },
    'mb-bark-leggings': { id: 'mb-bark-leggings', name: 'Bark leggings', icon: '🪵', kind: 'armor', slot: 'legs', ilvl: 3, armorType: 'leather', value: 9, examine: 'Stiff at the knee, which is where it counts.' },

    // Quest rewards and drops.
    'mb-sprouted-acorn-cap': { id: 'mb-sprouted-acorn-cap', name: 'Sprouted acorn cap', icon: '🌰', kind: 'armor', slot: 'head', ilvl: 2, rarity: 'sprouted', armorType: 'leather', value: 8, examine: 'The acorn has put down roots. The cap is not going anywhere.' },
    'mb-tin-ring': { id: 'mb-tin-ring', name: 'Tin ring', icon: '💍', kind: 'trinket', slot: 'trinket', ilvl: 3, rarity: 'sprouted', stats: { endurance: 1 }, value: 18, examine: 'Stamped inside with a name somebody scraped off.' },
    'mb-soggy-letter': { id: 'mb-soggy-letter', name: 'Soggy letter', icon: '✉️', kind: 'misc', questItem: true, value: 0, examine: 'To the Keep, from a Pipewright, 31 years ago.' },
    'mb-feral-totem': { id: 'mb-feral-totem', name: 'Feral totem', icon: '🗿', kind: 'misc', questItem: true, value: 0, examine: 'A dandelion carved in wood, with a face that is not happy about it.' },
  },

  enemies: {
    slug: { id: 'slug', name: 'Garden slug', level: 1, rank: 'trivial', family: 'soft', damageType: 'crush', attackSeconds: 3, aggressive: false, loot: [{ item: 'slug-slime', chance: 0.85 }, { item: 'mushroom', chance: 0.2 }], gold: [0, 2], model: 'slug', color: 0x9bb06a, scale: 1, respawnSeconds: 20, examine: 'Slow, slimy and surprisingly bitey.', wants: 'Wet lettuce, shade.' },
    mole: { id: 'mole', name: 'Mole', level: 2, rank: 'normal', family: 'furred', damageType: 'slash', attackSeconds: 2.6, aggressive: false, loot: [{ item: 'mushroom', chance: 0.5 }, { item: 'acorn-cap', chance: 0.1 }], gold: [1, 4], model: 'mole', color: 0x4a3b33, scale: 1, respawnSeconds: 25, examine: 'It digs up the meadow for fun.', wants: 'To get away. They\'re digging south.' },
    'pond-frog': { id: 'pond-frog', name: 'Pond frog', level: 2, rank: 'normal', family: 'soft', damageType: 'crush', attackSeconds: 2.6, aggressive: false, loot: [], gold: [1, 3], model: 'frog', color: 0x4f9a3a, scale: 0.9, respawnSeconds: 25, examine: 'It sits very still and watches you think about it.', wants: 'Flies; to be left alone.' },
    'feral-gnome': { id: 'feral-gnome', name: 'Feral gnome', level: 3, rank: 'normal', family: 'fired', damageType: 'crush', attackSeconds: 2.4, aggressive: true, loot: [{ item: 'red-potion', chance: 0.3 }, { item: 'acorn-cap', chance: 0.12 }, { item: 'pot-lid', chance: 0.12 }, { item: 'garden-mallet', chance: 0.06 }], gold: [3, 12], model: 'gnome', color: 0x3b3b3b, scale: 1, respawnSeconds: 30, examine: 'A gnome who left the garden and never came back.', wants: 'Everything you own.' },
    'feral-brute': { id: 'feral-brute', name: 'Feral brute', level: 4, rank: 'elite', family: 'fired', damageType: 'crush', attackSeconds: 2.4, aggressive: true, loot: [{ item: 'mb-feral-totem', chance: 0.25 }], gold: [5, 15], model: 'gnome', color: 0x5a3a2a, scale: 1.3, respawnSeconds: 120, examine: 'Twice the size of a feral gnome and half as polite.', wants: 'Everything you own, louder.' },
    beetle: { id: 'beetle', name: 'Stag beetle', level: 4, rank: 'normal', family: 'shelled', damageType: 'slash', attackSeconds: 2.4, aggressive: true, loot: [{ item: 'beetle-shell', chance: 0.9 }, { item: 'blue-potion', chance: 0.15 }, { item: 'bark-vest', chance: 0.05 }], gold: [0, 6], model: 'beetle', color: 0x5a2e14, scale: 1.2, respawnSeconds: 30, examine: 'Its jaws could snip a trowel in half.', wants: 'To protect their grubs in the log mounds.' },
    'mole-king': {
      id: 'mole-king', name: 'Grubthorn the Mole King', level: 6, rank: 'boss', family: 'furred', damageType: 'slash', attackSeconds: 2.8, aggressive: true,
      loot: [{ item: 'mole-crown', chance: 1 }, { item: 'mole-claw', chance: 1 }, { item: 'red-potion', chance: 1, count: 2 }],
      gold: [50, 80], model: 'mole', color: 0x2b211c, scale: 2.4, respawnSeconds: 0, examine: 'The king beneath the hill. He wears a muddy crown.', wants: 'To lead his clan south, away from the shaking.',
      moves: [
        { id: 'burrow', name: 'Burrow', kind: 'vanish', every: 14, telegraph: 1.5, radius: 3, damage: 1.5 },
        { id: 'mudsling', name: 'Mudsling', kind: 'pool', every: 9, telegraph: 1, radius: 2.5, damage: 0.4, status: 'slowed', statusSeconds: 3 },
        { id: 'call-the-clan', name: 'Call the Clan', kind: 'summon', every: 30, telegraph: 1, belowHpPct: 0.5, summon: { enemy: 'mole', count: 2 } },
      ],
      lastWords: 'We weren\'t attacking. We were running.',
    },
  },

  spawns: [
    { id: 'mb-spawn-1', zone: 'mossbottom', enemy: 'slug', count: 6, spread: 14 },
    { id: 'mb-spawn-2', zone: 'mossbottom', enemy: 'mole', count: 3, spread: 10 },
    { id: 'mb-spawn-3', zone: 'mossbottom', enemy: 'slug', count: 3, spread: 8 },
    { id: 'mb-spawn-4', zone: 'mossbottom', enemy: 'pond-frog', count: 2, spread: 2 },
    { id: 'mb-spawn-5', zone: 'mossbottom', enemy: 'feral-gnome', count: 5, spread: 12 },
    { id: 'mb-spawn-6', zone: 'mossbottom', enemy: 'feral-brute', count: 1, spread: 2 },
    { id: 'mb-spawn-7', zone: 'mossbottom', enemy: 'beetle', count: 5, spread: 14 },
    { id: 'mb-spawn-8', zone: 'mossbottom', enemy: 'mole-king', count: 1, spread: 0 },
  ],

  objects: {
    'mb-moss-statue': {
      id: 'mb-moss-statue', zone: 'mossbottom', name: 'Moss kiln-daughter', model: 'statue',
      verb: 'Examine', examine: 'A stone gnome-woman by the well, worn smooth by the rain.',
      text: 'Her face is worn smooth. She is holding a trowel just like yours.',
      setFlag: { flag: 'mb-statue-seen', value: 'yes' },
    },
    'mb-drowned-cart': {
      id: 'mb-drowned-cart', zone: 'mossbottom', name: 'Drowned cart', model: 'cart',
      verb: 'Search', examine: 'A cart sunk to its axles. Nobody has moved it in years.',
      text: 'Under the wet sacking you find a soggy letter and a tin ring.',
      once: true, giveItem: { item: 'mb-soggy-letter', count: 1 },
    },
  },

  npcs: {
    fernwick: {
      id: 'fernwick', name: 'Elder Fernwick', look: look(0x7b3fb0, 0x4b2a6e, 0xf4f4f4, { glasses: true }), zone: 'mossbottom', x: 0, z: 6, wander: 0,
      examine: 'The oldest gnome in Mossbottom. His beard has its own postcode.',
      greetings: [
        { when: { questStage: { id: 'slime-time', stage: 1 } }, node: 'slimeTurnIn' },
        { when: { questStage: { id: 'mole-king', stage: 1 } }, node: 'kingTurnIn' },
        { when: { questStage: { id: 'mb-trowel-like-yours', stage: 1 } }, node: 'statueTurnIn' },
        { when: { questStage: { id: 'mb-what-moles-know', stage: 0 } }, node: 'moleTalk' },
        { when: { quest: { id: 'mole-king', status: 'done' } }, node: 'hero' },
        { when: { quest: { id: 'mole-king', status: 'active' } }, node: 'kingWaiting' },
        { when: { quest: { id: 'slime-time', status: 'done' } }, node: 'offerKing' },
        { when: { quest: { id: 'slime-time', status: 'active' } }, node: 'slimeWaiting' },
        { node: 'intro' },
      ],
      nodes: {
        intro: {
          hub: true,
          text: 'Ah, you are awake at last! Welcome to Mossbottom, in the land of Gnomomia. You washed up in the brook three days ago, clutching that trowel.',
          options: [
            { text: 'Where am I, exactly?', next: 'where' },
            { text: 'Is there any work for me?', next: 'offerSlime' },
            { text: 'Goodbye.' },
          ],
        },
        where: {
          text: 'Mossbottom! Slugs to the east in Dewdrop Meadow, feral gnomes camped to the west, beetles in the barrows to the south-west, and in the north... Grubthorn. Best not to think about him yet.',
          options: [{ text: 'Is there any work for me?', next: 'offerSlime' }, { text: 'Goodbye.' }],
        },
        offerSlime: {
          text: 'Work? Splendid. My knees need slug slime, for the ointment. Bring me 5 and I will make it worth your while.',
          options: [
            { text: 'I will gather the slime.', action: { type: 'startQuest', quest: 'slime-time' } },
            { text: 'Maybe later.' },
          ],
        },
        slimeWaiting: { text: 'Five slug slimes, from Dewdrop Meadow to the east. My knees are counting on you.', options: [{ text: 'On my way.' }] },
        slimeTurnIn: {
          text: 'Is that... yes! Lovely, sticky slime. Here, take these potions and a few coins.',
          options: [{ text: 'Glad to help.' }],
        },
        offerKing: {
          text: 'My knees are young again. But I have a bigger worry: Grubthorn the Mole King is tunnelling under the village from his burrow up north. Will you face him?',
          options: [
            { text: 'I will deal with the Mole King.', action: { type: 'startQuest', quest: 'mole-king' } },
            { text: 'I am not ready yet.' },
            ASK_STATUE,
          ],
        },
        kingWaiting: {
          text: 'Grubthorn\'s burrow lies far to the north. Bring potions. Bring friends, if you have any.',
          options: [{ text: 'I will be back.' }, ASK_STATUE],
        },
        kingTurnIn: {
          text: 'The crown of Grubthorn! Mossbottom is safe. From this day you are the Hero of Gnomomia.',
          options: [{ text: 'It was nothing.' }],
        },
        hero: {
          text: 'Our hero returns! The children have started calling you "Gnomezilla".',
          options: [{ text: 'Goodbye.' }, ASK_STATUE, ASK_MOLES],
        },
        statueTalk: {
          text: 'That is the Moss kiln-daughter, one of the seven, so they say. Look at her closely, then come back and tell me what you saw.',
          options: [{ text: 'I will take a look.' }],
        },
        statueTurnIn: {
          text: 'Moss was one of the seven, so they say. You\'ve the same trowel. Odd, that.',
          options: [{ text: 'Odd indeed.' }],
        },
        molesTalk: {
          text: 'Give me a moment to think about what Grubthorn said. Come back and I will tell you what I make of it.',
          options: [{ text: 'I will be back.' }],
        },
        moleTalk: {
          text: 'Moles feel the ground before we do. If they are running, something is coming. Tell the Reeve in Thatchford.',
          options: [{ text: 'I will tell the Reeve.' }],
        },
      },
    },
    bramble: {
      id: 'bramble', name: 'Bramble the Smith', look: look(0x9a3324, 0x3c3c3c, 0x8b4513), zone: 'mossbottom', x: -9, z: -4, wander: 1.5,
      examine: 'His apron is more burn mark than apron.',
      greetings: [{ node: 'hello' }],
      nodes: {
        hello: {
          hub: true,
          text: 'Need a blade? A lid to hide behind? I forge it all, for a fair price.',
          options: [{ text: 'Show me your wares.', action: { type: 'openShop' } }, { text: 'Goodbye.' }],
        },
      },
      shop: ['bronze-shears', 'garden-mallet', 'iron-pick', 'pot-lid', 'oak-shield', 'acorn-cap', 'bark-vest', 'mb-forked-twig-sling', 'mb-reed-blowpipe', 'mb-willow-switch', 'mb-mushroom-hood', 'mb-bark-leggings'],
    },
    tansy: {
      id: 'tansy', name: 'Tansy the Herbalist', look: look(0xe86fb0, 0x4fae5a, null, { hair: { color: 0xd8902f, style: 'pigtails' }, dress: true, freckles: true }), zone: 'mossbottom', x: 9, z: -3, wander: 1.5,
      examine: 'She smells of mint and something you cannot place.',
      greetings: [
        { when: { questStage: { id: 'shells', stage: 1 } }, node: 'turnIn' },
        { when: { quest: { id: 'shells', status: 'active' } }, node: 'waiting' },
        { when: { quest: { id: 'shells', status: 'done' } }, node: 'shop' },
        { node: 'hello' },
      ],
      nodes: {
        hello: {
          hub: true,
          text: 'Potions! Remedies! Mushrooms of questionable origin! Also, I need beetle shells, if you are the brave type.',
          options: [
            { text: 'Let me see your potions.', action: { type: 'openShop' } },
            { text: 'Beetle shells?', next: 'offer' },
            { text: 'Could you patch me up?', action: { type: 'heal' } },
            { text: 'Goodbye.' },
          ],
        },
        offer: {
          text: 'The stag beetles in Beetle Barrows, to the south-west. Their shells grind into the best mana tonic. Bring me 4.',
          options: [{ text: 'I will bring 4 shells.', action: { type: 'startQuest', quest: 'shells' } }, { text: 'Too scary.' }],
        },
        waiting: {
          text: 'Four beetle shells, from the barrows. Mind the jaws!',
          options: [{ text: 'Let me see your potions.', action: { type: 'openShop' } }, { text: 'Could you patch me up?', action: { type: 'heal' } }, { text: 'Goodbye.' }],
        },
        turnIn: { text: 'Oh, beautiful shells! Here, a helm I took in trade, some tonic and a little gold.', options: [{ text: 'Thank you!' }] },
        shop: {
          text: 'My favourite shell hunter! What do you need?',
          options: [{ text: 'Let me see your potions.', action: { type: 'openShop' } }, { text: 'Could you patch me up?', action: { type: 'heal' } }, { text: 'Goodbye.' }],
        },
      },
      shop: ['red-potion', 'blue-potion', 'mushroom', 'cigs', 'beer'],
    },
    pip: {
      id: 'pip', name: 'Captain Pip', look: look(0x2a4fa8, 0x8a8a8a, 0x222222), zone: 'mossbottom', x: -20, z: 2, wander: 2,
      examine: 'Captain of the Mossbottom guard. The guard is him.',
      greetings: [
        { when: { questStage: { id: 'feral-trouble', stage: 1 } }, node: 'turnIn' },
        { when: { quest: { id: 'feral-trouble', status: 'active' } }, node: 'waiting' },
        { when: { questStage: { id: 'mb-feral-totem', stage: 1 } }, node: 'totemTurnIn' },
        { when: { quest: { id: 'mb-feral-totem', status: 'active' } }, node: 'totemWaiting' },
        { when: { quest: { id: 'feral-trouble', status: 'done' } }, node: 'done' },
        { node: 'hello' },
      ],
      nodes: {
        hello: {
          hub: true,
          text: 'Halt! Oh, it is you. Feral gnomes have made a camp to the west and they keep stealing our garden furniture. I could use a sword arm.',
          options: [
            { text: 'I will drive them off.', action: { type: 'startQuest', quest: 'feral-trouble' } },
            ASK_TOTEM,
            ASK_CHEST,
            { text: 'Not my problem.' },
          ],
        },
        waiting: { text: 'Five ferals should teach the rest a lesson. The camp is due west.', options: [{ text: 'Understood.' }] },
        turnIn: { text: 'Five ferals! The garden furniture is safe. Take my old shield, it served me well.', options: [{ text: 'Thanks, Captain.' }] },
        done: {
          text: 'The west is quiet. Mostly. Good work, recruit.',
          options: [{ text: 'Goodbye.' }, ASK_TOTEM, ASK_CHEST],
        },
        totemTalk: {
          text: 'A carved dandelion on a stick. The brutes at the camp carry them. Bring me one.',
          options: [{ text: 'I will find one.' }],
        },
        totemWaiting: { text: 'That totem from the feral brute at the camp. Then we will talk about dandelions.', options: [{ text: 'On my way.' }] },
        totemTurnIn: {
          text: 'Dandelions. The Wildlings carve those, but Wildlings don\'t steal.',
          options: [{ text: 'Wildlings?' }],
        },
        chestTalk: {
          text: 'Puddlemere? The lake took a cart years ago. Mind the mud, and do not go in the water.',
          options: [{ text: 'Thanks, Captain.' }],
        },
      },
    },
    thistle: {
      id: 'thistle', name: 'Old Thistle', look: look(0x8f8f2a, 0x6b4a2e, 0xbbbbbb), zone: 'mossbottom', x: 6, z: 14, wander: 5,
      examine: 'He has been sweeping the same path for forty years.',
      greetings: [{ node: 'hello' }],
      nodes: {
        hello: {
          hub: true,
          text: 'Hrm? In my day we fought slugs with our bare hands. Uphill. Both ways.',
          options: [{ text: 'Any advice?', next: 'advice' }, { text: 'Goodbye.' }],
        },
        advice: {
          text: 'Skills grow when you use them, youngster. Swing a blade, get better with blades. Get hit a lot, your armor skill grows. Ten skill-ups and you level. Simple!',
          options: [{ text: 'Thanks, Thistle.' }],
        },
      },
    },
  },

  quests: {
    'slime-time': {
      id: 'slime-time', name: 'Slime Time', giver: 'fernwick', zone: 'mossbottom', level: 2, tier: 'side', chain: 'Chapter 1: Mossbottom',
      stages: [
        { text: 'Gather 5 slug slime from the garden slugs in Dewdrop Meadow, east of Mossbottom.', objective: { type: 'collect', item: 'slug-slime', count: 5 } },
        { text: 'Bring the slime to Elder Fernwick.', objective: { type: 'talk', npc: 'fernwick' }, takeItems: [{ item: 'slug-slime', count: 5 }] },
      ],
      reward: { gold: 30, items: [{ item: 'red-potion', count: 3 }] },
    },
    'feral-trouble': {
      id: 'feral-trouble', name: 'Feral Trouble', giver: 'pip', zone: 'mossbottom', level: 4, tier: 'side', chain: 'Chapter 1: Mossbottom',
      stages: [
        { text: 'Defeat 5 feral gnomes at the camp west of Mossbottom.', objective: { type: 'kill', enemy: 'feral-gnome', count: 5 } },
        { text: 'Report back to Captain Pip.', objective: { type: 'talk', npc: 'pip' } },
      ],
      reward: { gold: 80, items: [{ item: 'oak-shield', count: 1 }] },
    },
    shells: {
      id: 'shells', name: 'Shells for Tansy', giver: 'tansy', zone: 'mossbottom', level: 5, tier: 'side', chain: 'Chapter 1: Mossbottom',
      stages: [
        { text: 'Collect 4 beetle shells from the stag beetles in Beetle Barrows, south-west of Mossbottom.', objective: { type: 'collect', item: 'beetle-shell', count: 4 } },
        { text: 'Bring the shells to Tansy the Herbalist.', objective: { type: 'talk', npc: 'tansy' }, takeItems: [{ item: 'beetle-shell', count: 4 }] },
      ],
      reward: { gold: 60, items: [{ item: 'thimble-helm', count: 1 }, { item: 'blue-potion', count: 2 }] },
    },
    'mole-king': {
      id: 'mole-king', name: 'The Mole King', giver: 'fernwick', zone: 'mossbottom', level: 6, tier: 'finale', chain: 'Chapter 1: Mossbottom',
      stages: [
        { text: 'Defeat Grubthorn the Mole King in his burrow, far to the north.', objective: { type: 'kill', enemy: 'mole-king', count: 1 } },
        { text: 'Bring news of your victory to Elder Fernwick.', objective: { type: 'talk', npc: 'fernwick' } },
      ],
      reward: { gold: 300, items: [{ item: 'beetle-plate', count: 1 }] },
    },
    'mb-trowel-like-yours': {
      id: 'mb-trowel-like-yours', name: 'A Trowel Like Yours', giver: 'fernwick', zone: 'mossbottom', level: 3, tier: 'side', chain: 'Chapter 1: Mossbottom',
      stages: [
        { text: 'Examine the moss kiln-daughter statue beside the well.', objective: { type: 'interact', object: 'mb-moss-statue', count: 1 } },
        { text: 'Tell Elder Fernwick what you saw.', objective: { type: 'talk', npc: 'fernwick' } },
      ],
      reward: { gold: 0, items: [{ item: 'mb-sprouted-acorn-cap', count: 1 }] },
    },
    'mb-what-moles-know': {
      id: 'mb-what-moles-know', name: 'What Moles Know', giver: 'fernwick', zone: 'mossbottom', level: 6, tier: 'main', chain: 'Chapter 1: Mossbottom',
      stages: [
        { text: 'Tell Elder Fernwick what Grubthorn said as he died.', objective: { type: 'talk', npc: 'fernwick' } },
        { text: 'Follow the running moles north to Grubthorn\'s burrow, now open to the north.', objective: { type: 'reach', zone: 'mossbottom', x: 10, z: -100, r: 6 } },
        { text: 'Take the north road to Thatchford and tell the Reeve.', objective: { type: 'reach', zone: 'thatchford', x: 0, z: 100, r: 10 } },
      ],
      reward: { gold: 50, items: [] },
    },
    'mb-puddlemere-chest': {
      id: 'mb-puddlemere-chest', name: 'Puddlemere\'s Chest', giver: 'pip', zone: 'mossbottom', level: 3, tier: 'side', chain: 'Chapter 1: Mossbottom',
      stages: [
        { text: 'Search the drowned cart on the Puddlemere shore.', objective: { type: 'interact', object: 'mb-drowned-cart', count: 1 } },
      ],
      reward: { gold: 0, items: [{ item: 'mb-tin-ring', count: 1 }] },
    },
    'mb-feral-totem': {
      id: 'mb-feral-totem', name: 'The Feral Totem', giver: 'pip', zone: 'mossbottom', level: 4, tier: 'side', chain: 'Chapter 1: Mossbottom',
      stages: [
        { text: 'Take the feral totem from a feral brute at the camp west of Mossbottom.', objective: { type: 'collect', item: 'mb-feral-totem', count: 1 } },
        { text: 'Show the feral totem to Captain Pip.', objective: { type: 'talk', npc: 'pip' }, takeItems: [{ item: 'mb-feral-totem', count: 1 }] },
      ],
      reward: { gold: 0, items: [] },
    },
  },
};
