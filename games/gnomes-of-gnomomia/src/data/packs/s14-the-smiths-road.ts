// Content pack s14-the-smiths-road (Storyline 14, Thatchford, the Keep and the Rockery; levels 6-24). Prefix for new ids: s14-.
// Canon ids referenced, not defined here: c2-word-to-the-reeve, c3-into-the-gutters, c5-heartwood, c6-brambles-old-master (quest 4 of the chain),
// NPCs bramble clementine puddleby tansy hammerclod cobalt; enemies muck-sprite gutter-rat rock-louse rockery-centipede earwig; canon item spigot-water.
// Quest 4 (Bramble's Old Master, ch6) turns in s14-shard-ore, s14-sobriety-tonic, s14-bramble-reply and s14-release-roll, all defined here.
import {
  look,
  type ContentPack,
  type DialogueNode,
  type DialogueOption,
  type Greeting,
  type ItemDef,
  type NpcDef,
  type QuestDef,
  type SpawnSpec,
  type WorldObjectDef,
} from '../../config';

// Quest ids in this chain.
const TAB = 's14-brambles-tab';
const ROLL = 's14-the-roll';
const SHELF = 's14-the-shard-shelf';
const QUENCH = 's14-a-quench-in-spigot-water';

// Canon quest ids this chain depends on (stage 99 in questAtLeast means done).
const DONE_REEVE = { id: 'c2-word-to-the-reeve', stage: 99 };
const DONE_GUTTERS = { id: 'c3-into-the-gutters', stage: 99 };
const DONE_HEARTWOOD = { id: 'c5-heartwood', stage: 99 };
const DONE_OLD_MASTER = { id: 'c6-brambles-old-master', stage: 99 };

// Start options added to canon NPCs (topics), and the choice options Sax shows at her choice stage.
const BRAMBLE_TAB: DialogueOption = {
  text: 'Your old master wrote to you. Let me carry the post.', next: 's14-bramble-tab-start',
  action: { type: 'startQuest', quest: TAB },
  when: { quest: { id: TAB, status: 'none' }, questAtLeast: DONE_REEVE },
};
const CLEM_PAY: DialogueOption = {
  text: 'Bramble sent me for the letters from Flintdelve.', next: 's14-clem-paid',
  action: { type: 'takeGold', amount: 12 },
  when: {
    quest: { id: TAB, status: 'active' }, questAtLeast: { id: TAB, stage: 1 },
    not: { hasItem: { item: 's14-cobalt-letters', count: 1 } }, flagUnset: 's14-letters',
  },
};
const SAX_SHELF: DialogueOption = {
  text: 'The Keep is short of Shard. Where is the shelf?', next: 's14-sax-shelf',
  action: { type: 'startQuest', quest: SHELF },
  when: { quest: { id: SHELF, status: 'none' }, questAtLeast: DONE_HEARTWOOD },
};
const SAX_REPORT: DialogueOption = {
  text: 'Tell the Keep the mine has stopped.',
  action: { type: 'setFlag', flag: 'sax', value: 'reported' },
  when: { questStage: { id: SHELF, stage: 2 } },
};
const SAX_SILENT: DialogueOption = {
  text: 'Say nothing. The Keep can wait.',
  action: { type: 'setFlag', flag: 'sax', value: 'silent' },
  when: { questStage: { id: SHELF, stage: 2 } },
};
const COBALT_QUENCH: DialogueOption = {
  text: 'Anvilroot, does the Spigot water really make Shard sing?', next: 's14-cobalt-quench-start',
  action: { type: 'startQuest', quest: QUENCH },
  when: { quest: { id: QUENCH, status: 'none' }, questAtLeast: DONE_OLD_MASTER },
};

// Cress Hayrake's start option, shown on her hub.
const CRESS_START: DialogueOption = {
  text: 'I am asking after a release page for Bramble the Smith.', next: 's14-cress-start',
  action: { type: 'startQuest', quest: ROLL },
  when: { quest: { id: ROLL, status: 'none' }, questAtLeast: DONE_GUTTERS },
};

// Dry-locker and seams: small world objects that carry quest 2 and quest 3.
function seam(i: number, x: number, z: number): WorldObjectDef {
  return {
    id: `s14-shard-seam-${i}`, zone: 'rockery', name: 'Shard seam', x, z, model: 'stone', verb: 'Chip',
    examine: 'A seam of Shard, humming a little under the pick. Nobody has chipped this one since the Keep stopped asking.',
    giveItem: { item: 's14-shard-ore', count: 1 }, once: true,
    when: { questStage: { id: SHELF, stage: 1 } },
  };
}

function byId<T extends { id: string }>(list: readonly T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const x of list) out[x.id] = x;
  return out;
}

const SEAMS = [seam(1, 34, -24), seam(2, 38, -28), seam(3, 40, -30), seam(4, 48, -20), seam(5, 42, -14), seam(6, 44, -10)];

const ITEM_LIST: ItemDef[] = [
  // Rewards and shop stock (Thatchford set, shopAdds on Bramble).
  { id: 's14-apprentice-mallet', name: 'Bramble\'s Apprentice Mallet', icon: '🔨', kind: 'weapon', slot: 'weapon', ilvl: 8, rarity: 'sprouted', damageType: 'crush', hands: 1, weaponClass: 'melee', value: 128, examine: 'Handle worn to a young gnome\'s grip. Bramble cut the thumb-groove himself, sober.' },
  { id: 's14-armoury-bucket-helm', name: 'Armoury Bucket Helm', icon: '🪣', kind: 'armor', slot: 'head', ilvl: 14, rarity: 'sprouted', armorType: 'plate', value: 392, examine: 'The Keep\'s crown is stamped on the front, and the crown is a bottle cap. Fits any opinion.' },
  { id: 's14-cobalt-gauntlets', name: 'Cobalt\'s Gauntlets', icon: '🧤', kind: 'armor', slot: 'hands', ilvl: 22, rarity: 'sprouted', armorType: 'plate', value: 968, examine: 'Thumbs shaped for quench tongs. Cobalt wore them for thirty years and never once burned a finger.' },
  { id: 's14-hand-fork', name: 'Hand fork', icon: '🍴', kind: 'weapon', slot: 'weapon', ilvl: 6, damageType: 'pierce', hands: 1, weaponClass: 'melee', value: 36, examine: 'A garden hand fork with the tines straightened. It still digs.' },
  { id: 's14-bricklayers-mallet', name: 'Bricklayer\'s mallet', icon: '🔨', kind: 'weapon', slot: 'weapon', ilvl: 7, damageType: 'crush', hands: 1, weaponClass: 'melee', value: 49, examine: 'Square head, short handle, a bit of brick dust in the grain.' },
  { id: 's14-bottlecap-plate', name: 'Bottlecap plate', icon: '🛡️', kind: 'armor', slot: 'body', ilvl: 6, armorType: 'plate', value: 36, examine: 'Thatchford bottlecaps, hammered flat and laced with wire. Turns a blow, mostly.' },
  // Shard-iron stock (the second shop, Bramble's new forge).
  { id: 's14-shard-iron-trowel', name: 'Shard-iron trowel', icon: '🥄', kind: 'weapon', slot: 'weapon', ilvl: 18, rarity: 'sprouted', damageType: 'pierce', hands: 1, weaponClass: 'melee', value: 648, examine: 'The Shard is in the edge. It hums when you dig, and the garden does not argue.' },
  { id: 's14-shard-iron-plate', name: 'Shard-iron plate', icon: '🛡️', kind: 'armor', slot: 'body', ilvl: 18, rarity: 'sprouted', armorType: 'plate', value: 648, examine: 'Honest plate, cold to the touch. Rockery iron, worked by a sober smith.' },
  { id: 's14-shard-iron-hand-plates', name: 'Shard-iron hand-plates', icon: '🧤', kind: 'armor', slot: 'hands', ilvl: 20, rarity: 'sprouted', armorType: 'plate', value: 800, examine: 'Two plates on a cord, shaped for a grip. Bramble and Cobalt both signed the rivets.' },
  // Quest items.
  { id: 's14-cobalt-letters', name: 'Cobalt\'s six letters', icon: '✉️', kind: 'misc', questItem: true, value: 0, examine: 'Six letters tied with string, dry as biscuit. Cobalt\'s hand on every front, one in most years.' },
  { id: 's14-bramble-reply', name: 'Bramble\'s reply', icon: '📨', kind: 'misc', questItem: true, value: 0, examine: 'Sealed, with Bramble\'s thumbprint in the wax. Do not open it on the road.' },
  { id: 's14-sobriety-tonic', name: 'Sobriety tonic', icon: '🧪', kind: 'misc', questItem: true, value: 0, examine: 'Tansy\'s bitter bark. Cork note: "Two spoons, not the bottle."' },
  { id: 's14-release-roll', name: 'Delvers\' release roll (copy)', icon: '📜', kind: 'misc', questItem: true, value: 0, examine: '"Released, for cause." Cobalt\'s hand, and regret underneath.' },
  { id: 's14-shard-ore', name: 'Shard ore', icon: '🪨', kind: 'misc', questItem: true, value: 0, examine: 'Dark grey, and humming very faintly. The Mower\'s blade, a long time ago.' },
];

const QUESTS_LIST: QuestDef[] = [
  {
    id: TAB, name: 'Bramble\'s Tab', giver: 'bramble', zone: 'mossbottom', level: 6, tier: 'side', chain: 'The Smith\'s Road',
    stages: [
      { text: 'Walk to Thatchford with Bramble\'s post.', objective: { type: 'reach', zone: 'thatchford', x: 0, z: 0, r: 40 } },
      { text: 'Pay Clementine Wick for Cobalt\'s six letters.', objective: { type: 'talk', npc: 'clementine' } },
      { text: 'Clear six muck sprites out of Dill\'s cellar.', objective: { type: 'kill', enemy: 'muck-sprite', count: 6 } },
      { text: 'Tell Dill Puddleby the cellar is clear.', objective: { type: 'talk', npc: 'puddleby' } },
      { text: 'Walk back to Mossbottom.', objective: { type: 'reach', zone: 'mossbottom', x: 0, z: 0, r: 40 } },
      { text: 'Hand Bramble the six letters.', objective: { type: 'talk', npc: 'bramble' }, takeItems: [{ item: 's14-cobalt-letters', count: 1 }] },
      { text: 'Take Tansy\'s tonic from Tansy the Herbalist.', objective: { type: 'talk', npc: 'tansy' } },
    ],
    reward: { gold: 40, items: [{ item: 's14-apprentice-mallet', count: 1 }, { item: 's14-bramble-reply', count: 1 }, { item: 's14-sobriety-tonic', count: 1 }] },
  },
  {
    id: ROLL, name: 'The Roll', giver: 's14-cress-hayrake', zone: 'keep', level: 9, tier: 'side', chain: 'The Smith\'s Road',
    stages: [
      { text: 'Go down the Drainpipe Gutters.', objective: { type: 'reach', zone: 'deeps', x: 0, z: 65, r: 25 } },
      { text: 'Clear six gutter rats from the Gutters.', objective: { type: 'kill', enemy: 'gutter-rat', count: 6 } },
      { text: 'Open the dry-locker off the Gutters.', objective: { type: 'interact', object: 's14-dry-locker', count: 1 } },
      { text: 'Tell Cress Hayrake what the dry-locker held.', objective: { type: 'talk', npc: 's14-cress-hayrake' } },
    ],
    reward: { gold: 80, items: [{ item: 's14-armoury-bucket-helm', count: 1 }, { item: 's14-release-roll', count: 1 }] },
  },
  {
    id: SHELF, name: 'The Shard Shelf', giver: 'hammerclod', zone: 'rockery', level: 14, tier: 'main', chain: 'The Smith\'s Road',
    stages: [
      { text: 'Find the Shard shelf in the Shard Mine.', objective: { type: 'reach', zone: 'rockery', x: 40, z: -20, r: 10 } },
      { text: 'Chip six Shard ore from the seams on the ledge.', objective: { type: 'collect', item: 's14-shard-ore', count: 6 } },
      { text: 'Decide what Sax tells the Keep.', objective: { type: 'choice', flag: 'sax' } },
      { text: 'Report back to Sax Hammerclod.', objective: { type: 'talk', npc: 'hammerclod' } },
    ],
    reward: { gold: 150, items: [] },
  },
  {
    id: QUENCH, name: 'A Quench in Spigot Water', giver: 'cobalt', zone: 'rockery', level: 22, tier: 'side', chain: 'The Smith\'s Road',
    stages: [
      { text: 'Walk to the Spigot.', objective: { type: 'reach', zone: 'rockery', x: -90, z: -60, r: 14 } },
      { text: 'Clear six earwigs from the Spigot.', objective: { type: 'kill', enemy: 'earwig', count: 6 } },
      { text: 'Fill four bottles with Spigot water.', objective: { type: 'collect', item: 'spigot-water', count: 4 } },
      { text: 'Quench a blade in the trough in Flintdelve.', objective: { type: 'interact', object: 's14-quench-trough', count: 1 } },
      { text: 'Tell Cobalt the quench is done.', objective: { type: 'talk', npc: 'cobalt' } },
    ],
    reward: { gold: 120, items: [{ item: 's14-cobalt-gauntlets', count: 1 }] },
  },
];

const CRESS: NpcDef = {
  id: 's14-cress-hayrake', name: 'Cress Hayrake', look: look(0x3a6b8a, 0xc9c2a8, 0xd8d8d8, { dress: true, glasses: true }),
  zone: 'keep', x: 20, z: 15, wander: 0.5,
  greetings: [
    { when: { questStage: { id: ROLL, stage: 3 } }, node: 's14-cress-turnin' },
    { node: 's14-cress-hub' },
  ],
  nodes: {
    's14-cress-hub': {
      hub: true,
      text: 'The Delvers\' roll. Every apprentice released from a Flintdelve forge, in order of release. Mind the wet corners.',
      options: [CRESS_START, { text: 'Goodbye.' }],
    },
    's14-cress-start': {
      text: 'Bramble. Released for cause, eleven years back. The page is not in the roll, which means it is somewhere I put it. Down the Gutters, in the dry-locker. Mind the rats.',
      options: [{ text: 'On my way.' }],
    },
    's14-cress-turnin': {
      text: 'You have the copy. Released, for cause. Keep it dry, and tell him the roll still has his name on it.',
      options: [{ text: 'I will.' }],
    },
  },
  examine: 'Roll-Weeder for the Pedestal Ward Delvers. Her roll is tidy. Her locker is not.',
};

const FORGE: NpcDef = {
  id: 's14-bramble-forge', name: 'Bramble\'s new forge', look: look(0x5a3a22, 0x6b6b6b, null),
  zone: 'mossbottom', x: -20, z: -4, wander: 0.5,
  hidden: { not: { questAtLeast: { id: QUENCH, stage: 99 } } },
  greetings: [{ node: 's14-forge-hub' }],
  nodes: {
    's14-forge-hub': {
      text: 'Shard iron, cold and honest. Bramble keeps the rack by the door, and the rack is never empty now.',
      options: [{ text: 'Show me the Shard-iron.', action: { type: 'openShop' } }, { text: 'Goodbye.' }],
    },
  },
  shop: ['s14-shard-iron-trowel', 's14-shard-iron-plate', 's14-shard-iron-hand-plates'],
  examine: 'A new forge beside Bramble\'s shop, with a Shard-iron rack by the door.',
};

const SPAWNS: SpawnSpec[] = [
  { id: 's14-spawn-1', zone: 'thatchford', enemy: 'muck-sprite', x: -3, z: 8, count: 6, spread: 3, when: { questStage: { id: TAB, stage: 2 } } },
  { id: 's14-spawn-2', zone: 'deeps', enemy: 'gutter-rat', x: 0, z: 52, count: 6, spread: 8, when: { questStage: { id: ROLL, stage: 1 } } },
  { id: 's14-spawn-3', zone: 'rockery', enemy: 'rock-louse', x: 40, z: -20, count: 4, spread: 5, when: { questStage: { id: SHELF, stage: 1 } } },
  { id: 's14-spawn-4', zone: 'rockery', enemy: 'rockery-centipede', x: 40, z: -20, count: 3, spread: 5, when: { questStage: { id: SHELF, stage: 1 } } },
  { id: 's14-spawn-5', zone: 'rockery', enemy: 'earwig', x: -90, z: -60, count: 6, spread: 6, when: { questStage: { id: QUENCH, stage: 1 } } },
];

const GREET_BRAMBLE: Greeting[] = [{ when: { questStage: { id: TAB, stage: 5 } }, node: 's14-bramble-letters' }];
const GREET_DILL: Greeting[] = [{ when: { questStage: { id: TAB, stage: 3 } }, node: 's14-dill-pint' }];
const GREET_TANSY: Greeting[] = [{ when: { questStage: { id: TAB, stage: 6 } }, node: 's14-tansy-tonic' }];
const GREET_SAX: Greeting[] = [
  { when: { questStage: { id: SHELF, stage: 3 }, flag: { name: 'sax', value: 'reported' } }, node: 's14-sax-reported' },
  { when: { questStage: { id: SHELF, stage: 3 } }, node: 's14-sax-silent' },
];
const GREET_COBALT: Greeting[] = [{ when: { questStage: { id: QUENCH, stage: 4 } }, node: 's14-cobalt-quench-turnin' }];

const EXTRA_CLEMENTINE: Record<string, DialogueNode> = {
  's14-clem-paid': {
    text: 'Six letters, twelve grams. I kept them dry, which is more than anyone asked of me.',
    options: [{ text: 'Take them.', action: { type: 'giveItem', item: 's14-cobalt-letters', count: 1 }, next: 's14-clem-given' }],
  },
  's14-clem-given': {
    text: 'Dry as biscuit, and Cobalt\'s hand on every front. Bramble should read them, not me.',
    options: [{ text: 'I will take them to him.', action: { type: 'setFlag', flag: 's14-letters', value: 'given' } }],
  },
};

export const PACK: ContentPack = {
  id: 's14-the-smiths-road',

  items: byId(ITEM_LIST),

  npcs: byId([CRESS, FORGE]),

  quests: byId(QUESTS_LIST),

  spawns: SPAWNS,

  objects: {
    's14-dry-locker': {
      id: 's14-dry-locker', zone: 'deeps', name: 'Dry-locker', x: -18, z: 70, model: 'chest', verb: 'Open',
      examine: 'A dry cistern off the Gutters, where the Delvers kept old rolls. Dry is rare down here.',
      text: 'Released, for cause. Cobalt wrote the cause in his own hand, then wrote regret underneath. He never writes that under anything.',
      when: { questStage: { id: ROLL, stage: 2 } },
    },
    ...byId(SEAMS),
    's14-quench-trough': {
      id: 's14-quench-trough', zone: 'rockery', name: 'Quench trough', x: 7, z: 24, model: 'trough', verb: 'Quench',
      examine: 'A washtub-sized quench bath in the lift-basket yard. Spigot water in, Shard in, and a note nobody likes.',
      text: 'The Shard hisses in the Spigot water and sings a shorter note than it should.',
      when: { questStage: { id: QUENCH, stage: 3 } },
    },
  },

  // Canon NPCs: Bramble, Dill, Clementine, Tansy, Sax Hammerclod and Cobalt. Their hub nodes show these topics.
  topics: {
    bramble: [BRAMBLE_TAB],
    clementine: [CLEM_PAY],
    hammerclod: [SAX_SHELF, SAX_REPORT, SAX_SILENT],
    cobalt: [COBALT_QUENCH],
  },

  greetingsFirst: {
    bramble: GREET_BRAMBLE,
    puddleby: GREET_DILL,
    tansy: GREET_TANSY,
    hammerclod: GREET_SAX,
    cobalt: GREET_COBALT,
  },

  extraNodes: {
    clementine: EXTRA_CLEMENTINE,
    bramble: {
      's14-bramble-letters': {
        text: 'Not in the shop. The bellows have heard enough about them. Tansy has your tonic, and my reply goes with it. Take them to Cobalt. Don\'t tell me what it says.',
        options: [{ text: 'I won\'t.' }],
      },
      's14-bramble-tab-start': {
        text: 'Cobalt\'s letters are with Clementine at the Thatchford post. Pay her the postage and bring them to me. Don\'t open them in the shop.',
        options: [{ text: 'On my way.' }],
      },
    },
    puddleby: {
      's14-dill-pint': {
        text: 'He paid for one pint and asked for a second. I gave him water. He said thank you, which was worse.',
        options: [{ text: 'Thanks, Dill.' }],
      },
    },
    tansy: {
      's14-tansy-tonic': {
        text: 'Bitter bark. Two spoons, not the bottle. He has never once taken a bottle from me. Take this one to him, and tell him it is from me, not from the Keep.',
        options: [{ text: 'Thank you, Tansy.' }],
      },
    },
    hammerclod: {
      's14-sax-shelf': {
        text: 'The shelf is down the Shard Mine, on the ledge off the main tunnel. Six seams. Bring the ore back, then decide what the Keep hears.',
        options: [{ text: 'On my way.' }],
      },
      's14-sax-reported': {
        text: 'You told the Keep. Tithe paid, and my crew stops digging for a month. Three stoppages I hid, and you are the first to make me stop. That is the honest cost, and I will carry it.',
        options: [{ text: 'Thanks, Sax.' }],
      },
      's14-sax-silent': {
        text: 'Nothing to the Keep. The mine keeps digging, and the three stoppages stay in my own head. That is mine to carry, not yours.',
        options: [{ text: 'Thanks, Sax.' }],
      },
    },
    cobalt: {
      's14-cobalt-quench-start': {
        text: 'Spigot water, from the tap at the Spigot. Nobody knows why it works. Six earwigs in the Spigot first, four bottles of water, then the trough in the lift-basket yard.',
        options: [{ text: 'On my way.' }],
      },
      's14-cobalt-quench-turnin': {
        text: 'That\'s his trowel-job for another day. Not until the Kiln Warden\'s finished with you. We don\'t touch that one yet.',
        options: [{ text: 'Understood.' }],
      },
    },
  },

  shopAdds: {
    // Stage 1 of Bramble's shop. shopAdds is not conditional, so only this stage goes here.
    bramble: ['s14-hand-fork', 's14-bricklayers-mallet', 's14-bottlecap-plate'],
  },
};
