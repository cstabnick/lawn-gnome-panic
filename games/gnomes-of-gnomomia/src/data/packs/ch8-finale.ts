// Content pack ch8-finale: the Battle of the Verge. The Mower's parts, the battle quest, the phase objects, the Kiln-fired rewards and the epilogue.
import type { Condition, ContentPack, DialogueOption, EnemyDef, ItemDef, QuestDef, WorldObjectDef, Greeting, DialogueNode, BossMoveDef } from '../../config';

// ---------------------------------------------------------------- the Mower's parts (canonical ids, unprefixed)

const finalEnemy = (
  id: string, name: string, def: Omit<EnemyDef, 'id' | 'name' | 'level' | 'rank' | 'aggressive' | 'loot' | 'gold' | 'respawnSeconds'>,
): EnemyDef => ({ id, name, level: 32, rank: 'final', aggressive: true, loot: [], gold: [0, 0], respawnSeconds: 0, ...def });

const DECK_MOVES: readonly BossMoveDef[] = [
  { id: 'blade-sweep', name: 'Blade Sweep', kind: 'ring', every: 9, telegraph: 2, radius: 9, damage: 2.2 },
  { id: 'chute-blast', name: 'Chute Blast', kind: 'cone', every: 12, telegraph: 1.5, radius: 12, damage: 1.1 },
  { id: 'belly-spill', name: 'Belly Spill', kind: 'summon', every: 25, telegraph: 2, summon: { enemy: 'grass-bag-moth', count: 4 } },
  { id: 'black-dew-cloud', name: 'Black Dew Cloud', kind: 'pool', every: 20, telegraph: 2, radius: 6, damage: 0.3, status: 'poisoned', statusSeconds: 10 },
  { id: 'rolling-charge', name: 'Rolling Charge', kind: 'lane', every: 15, telegraph: 3, length: 40, width: 6, damage: 3.7 },
];

const ENEMIES: Record<string, EnemyDef> = {
  'mower-wheel': finalEnemy('mower-wheel', 'Mower Wheel', {
    family: 'metal', damageType: 'crush', model: 'metal', color: 0x1a1a1a, scale: 2, hpOverride: 1500,
    wants: 'No want anyone can name. It rolls, and it cuts the grass in straight lines.',
    examine: 'A wheel as tall as a gnome, black with old oil. Rust blooms in the spokes, and the tread is still biting into the ground.',
  }),
  'mower-deck': finalEnemy('mower-deck', 'The Mower', {
    family: 'metal', damageType: 'crush', model: 'mower', color: 0xb32a20, scale: 12, hpOverride: 7500,
    wants: 'No want anyone can name. It breathes stink and it cuts. That is all it does.',
    examine: 'The red deck of the Mower, forty gnomes tall. The paint is faded, the plate rusted, and a gap in the blade shows where the Shard broke off 3,000 years ago.',
    moves: DECK_MOVES,
    lastWords: 'It does not say anything. It goes quiet.',
  }),
  'mower-heartspark': finalEnemy('mower-heartspark', 'The Heartspark', {
    family: 'metal', damageType: 'crush', model: 'metal', color: 0xffffff, scale: 1.5, hpOverride: 7200,
    wants: 'No want anyone can name. It hums, and it wants the Rope pulled tight.',
    examine: 'A white, cold knot of metal on top of the deck. It hums like a wire. Rain makes it shudder, and it does not like rain.',
  }),
  'mower-rope': finalEnemy('mower-rope', 'The Waking Rope', {
    family: 'plant', damageType: 'slash', model: 'straw', color: 0x9c8b4a, scale: 1, hpOverride: 1000,
    wants: 'No want anyone can name. Pull it, and the Mower wakes.',
    examine: 'A pull cord of twisted straw, as thick as an arm. It is pulled tight, and it trembles. Cut it before it is pulled again.',
  }),
};

// ---------------------------------------------------------------- Kiln-fired rewards (one per class; all three given to everyone)

const ITEMS: Record<string, ItemDef> = {
  'c8-blade-breaker': {
    id: 'c8-blade-breaker', name: 'Blade-Breaker', icon: '🔨', kind: 'weapon', slot: 'weapon',
    ilvl: 30, rarity: 'kilnfired', damageType: 'crush', hands: 2, weaponClass: 'melee',
    stats: { strength: 6, endurance: 3, critDamage: 15 },
    effect: 'Gnome Smash also Cracks for 12 s.',
    value: 7200,
    examine: 'A two-handed mattock with a shard of the Stopping Stone set in its head. Kiln-fired, so the glaze is still warm. It was made to break blades.',
  },
  'c8-heartspark-sling': {
    id: 'c8-heartspark-sling', name: 'Heartspark Sling', icon: '🎯', kind: 'weapon', slot: 'weapon',
    ilvl: 30, rarity: 'kilnfired', damageType: 'pierce', hands: 1, weaponClass: 'sling',
    stats: { agility: 6, accuracy: 4, critDamage: 15 },
    effect: 'Fires Rust-acorns that chain to a 2nd target.',
    value: 7200,
    examine: 'A sling strung with cord from the Waking Rope. Kiln-fired. It fires rust-coloured acorns, and they find a second gnome if the first one is close.',
  },
  'c8-spigot-staff': {
    id: 'c8-spigot-staff', name: 'Spigot Staff of the First Rain', icon: '🪄', kind: 'weapon', slot: 'weapon',
    ilvl: 30, rarity: 'kilnfired', damageType: 'rain', hands: 2, weaponClass: 'staff',
    stats: { intelligence: 6, endurance: 3, rainDamage: 15 },
    effect: 'Downpour follows you.',
    value: 7200,
    examine: 'A staff of Kiln-fired clay, with a brass tap for a head. Water still drips from it, even though nothing is connected to it.',
  },
};

// ---------------------------------------------------------------- phase objects (shown by flag c8-phase, which mower.ts sets)

const OBJECTS: Record<string, WorldObjectDef> = {
  'c8-valve-head': {
    id: 'c8-valve-head', zone: 'verge', name: 'Great Valve pipe-head', x: -20, z: -45, model: 'valve',
    verb: 'Open', examine: 'The pipe-head of the Great Valve, green with age. Ida\'s father had the only key.',
    text: 'The valve groans, and the water comes up through the Shorn in a rush.',
    when: { flag: { name: 'c8-phase', value: 'mud-open' } },
  },
  'c8-stone-socket': {
    id: 'c8-stone-socket', zone: 'verge', name: 'Stopping Stone socket', x: 0, z: -68, model: 'stone',
    verb: 'Jam the Stone', examine: 'A socket cut into the blade\'s housing. The grey dust of the Stopping Stone is packed in its edges.',
    text: 'The Stone sits in the socket, and the blade shudders to a stop.',
    when: { flag: { name: 'c8-phase', value: 'jam' } },
  },
  'c8-stake-point': {
    id: 'c8-stake-point', zone: 'verge', name: 'Heartwood Stake point', x: 0, z: -64, model: 'post',
    verb: 'Drive the Stake', examine: 'A post of soft wood on the deck, marked where the Heartwood Stake should go in.',
    text: 'The Stake goes in up to the hilt, and the Heartspark rings like a bell.',
    when: { flag: { name: 'c8-phase', value: 'heart' } },
  },
  'c8-barricade-left': {
    id: 'c8-barricade-left', zone: 'verge', name: 'Barricade', x: -15, z: -20, model: 'post',
    verb: 'Brace', examine: 'A barricade of hedge clippings and old planks, lashed together with string. It will not last.',
    text: 'You brace the barricade. It holds a little longer.',
  },
  'c8-barricade-mid': {
    id: 'c8-barricade-mid', zone: 'verge', name: 'Barricade', x: 0, z: -22, model: 'post',
    verb: 'Brace', examine: 'A barricade of hedge clippings and old planks, lashed together with string. It will not last.',
    text: 'You brace the barricade. It holds a little longer.',
  },
  'c8-barricade-right': {
    id: 'c8-barricade-right', zone: 'verge', name: 'Barricade', x: 15, z: -20, model: 'post',
    verb: 'Brace', examine: 'A barricade of hedge clippings and old planks, lashed together with string. It will not last.',
    text: 'You brace the barricade. It holds a little longer.',
  },
};

// ---------------------------------------------------------------- the battle quest

const QUESTS: Record<string, QuestDef> = {
  'c8-turning-blade': {
    id: 'c8-turning-blade', name: 'The Turning Blade', giver: 'c7-marigold', zone: 'verge', level: 30,
    tier: 'finale', chain: 'The Turning Blade',
    stages: [
      {
        text: 'The Mower rolls out of the Shed. Get to the Verge before its blade does.',
        objective: { type: 'reach', zone: 'verge', x: 0, z: -40, r: 20 },
      },
      {
        text: 'Open the Great Valve at the pipe-head. Ida\'s crew holds the line, and the water drowns the Mower\'s wheels in mud.',
        objective: { type: 'interact', object: 'c8-valve-head', count: 1 },
      },
      {
        text: 'Jam the Stopping Stone into the blade\'s socket. The Blade Sweep will stop for the rest of the fight.',
        objective: { type: 'interact', object: 'c8-stone-socket', count: 1 },
      },
      {
        text: 'Climb the deck and break the Heartspark. Rain hurts it most. Drive the Stake when the button comes up. Cut the Rope.',
        objective: { type: 'kill', enemy: 'mower-heartspark', count: 1 },
      },
      {
        text: 'Tell Marigold the Mower has stopped. Take the one that fits your hand.',
        objective: { type: 'talk', npc: 'c7-marigold' },
      },
    ],
    reward: {
      gold: 500,
      items: [
        { item: 'c8-blade-breaker', count: 1 },
        { item: 'c8-heartspark-sling', count: 1 },
        { item: 'c8-spigot-staff', count: 1 },
      ],
    },
  },
};

// ---------------------------------------------------------------- dialogue: Marigold (ch7 pack owns her), Fernwick (canon)

const marigoldStart: DialogueOption = {
  text: 'Marigold, how do we stop the Mower?',
  next: 'c8-start',
  action: { type: 'startQuest', quest: 'c8-turning-blade' },
  when: {
    quest: { id: 'c8-turning-blade', status: 'none' },
    not: { not: { quest: { id: 'c7-the-level', status: 'done' } } },
  },
};

const marigoldWait: DialogueOption = {
  text: 'Where do we go from here, Marigold?',
  next: 'c8-wait',
  when: { quest: { id: 'c8-turning-blade', status: 'active' } },
};

const marigoldTurnin: Greeting = { when: { questStage: { id: 'c8-turning-blade', stage: 4 } }, node: 'c8-turnin' };

const marigoldNodes: Record<string, DialogueNode> = {
  'c8-start': {
    text: 'The Mower. Old Rumble, the Turning Blade. It rolls out of the Shed and it cuts. Ida can open the Valve and drown its wheels, and the Stone can jam its blade. Then we go up on the deck. Will you come?',
    options: [{ text: 'Then I will go to the Verge.' }],
  },
  'c8-wait': {
    text: 'Get to the Verge. Open the valve, jam the Stone, and break the Heartspark. Then come back to me.',
    options: [{ text: 'Understood.' }],
  },
  'c8-turnin': {
    text: 'It has stopped. It is quiet. I have not heard it quiet in thirty years. Thank you, friend.',
    options: [{ text: 'Good.' }],
  },
};

const fernwickGreeting: Greeting = { when: { flag: { name: 'c8-phase', value: 'done' } }, node: 'c8-fernwick' };

const fernwickNodes: Record<string, DialogueNode> = {
  'c8-fernwick': {
    text: 'My knees have stopped hurting. First time in a month. Thought you should know.',
    options: [{ text: 'I am glad, Fernwick.' }],
  },
};

const TOPICS: Record<string, readonly DialogueOption[]> = {
  'c7-marigold': [marigoldStart, marigoldWait],
};

const GREETINGS_FIRST: Record<string, readonly Greeting[]> = {
  'c7-marigold': [marigoldTurnin],
  fernwick: [fernwickGreeting],
};

const EXTRA_NODES: Record<string, Record<string, DialogueNode>> = {
  'c7-marigold': marigoldNodes,
  fernwick: fernwickNodes,
};

// ---------------------------------------------------------------- epilogue (ui/epilogue.ts reads this)

const hedgePeace: Condition = { flag: { name: 'hedge', value: 'peace' } };
const hedgeFelled: Condition = { flag: { name: 'hedge', value: 'felled' } };
const antsPeace: Condition = { flag: { name: 'ants', value: 'peace' } };
const potsworthFate: Condition = { flagSet: 'potsworth' };

export const EPILOGUE: readonly { when?: Condition; text: string }[] = [
  { when: hedgePeace, text: 'The Wildlings and the Hedgewrights replant the ring around the Elder Privet together. Burdock says the Privet was never theirs to keep. Only to grow.' },
  { when: hedgeFelled, text: 'The Hedgewrights replant around the stump of the Elder Privet. The Wildlings do not come to the planting. They watch it from the far hedge, and they do not forget.' },
  { when: antsPeace, text: 'The Ant Thousand graze their herds beside the aphids in the meadow, and nobody counts the aphids any more.' },
  { text: 'Sodbury\'s bell rings out for a full class of gnomes, and the whole town comes to the green to hear it.' },
  { text: 'Ida Gromwell opens the Great Valve every spring, to keep it rusty. She says a valve that never turns goes stiff.' },
  { when: potsworthFate, text: 'Lord Potsworth sweeps the Pedestal steps himself, every morning, and does not look up when the gnomes pass.' },
  { text: 'Old Thistle sits on his bench at the end of the swept path. He has put the broom down. He looks at the Verge for a long time.' },
];

export const PACK: ContentPack = {
  id: 'ch8-finale',
  enemies: ENEMIES,
  items: ITEMS,
  objects: OBJECTS,
  quests: QUESTS,
  topics: TOPICS,
  greetingsFirst: GREETINGS_FIRST,
  extraNodes: EXTRA_NODES,
};
