// Gnomes of Gnomomia: every shared type, tuning number and data table. Systems import from here; nothing here has logic.
import type * as THREE from 'three';
import type { GnomeLook } from '@lawn/gnome';

// ---------------------------------------------------------------- tuning

export const TUNING = {
  /** The world is a square from -worldHalf to +worldHalf on x and z. */
  worldHalf: 120,
  /** Water surface height; ground below it is lake (blocked). */
  waterLevel: -0.6,
  walkSpeed: 4.2,
  /** Distance from the player at which these actions happen. */
  meleeRange: 1.7,
  talkRange: 2.4,
  takeRange: 1.4,
  spellRange: 12,
  /** Seconds between the player's melee swings. */
  playerAttackSeconds: 2.4,
  /** Seconds between spell casts. */
  spellCooldownSeconds: 1.8,
  /** Hit points regained: 1 every hpRegenSeconds. Mana: 1 every mpRegenSeconds. */
  hpRegenSeconds: 3,
  mpRegenSeconds: 1.5,
  /** Enemy AI. */
  aggroRange: 7,
  leashRange: 22,
  enemyWalkSpeed: 3.2,
  wanderRadius: 6,
  /** Seconds a loot pile lies on the ground before it vanishes. */
  lootSeconds: 90,
  /** Camera (RuneScape style orbit around the player). Pitch in radians above the horizon. */
  cameraDistanceDefault: 15,
  cameraDistanceMin: 6,
  cameraDistanceMax: 30,
  cameraPitchDefault: 0.75,
  cameraPitchMin: 0.25,
  cameraPitchMax: 1.35,
  /** Radians per second while an arrow key is held. */
  cameraKeySpeed: 1.8,
  /** Skill increases needed for the next character level. */
  skillUpsPerLevel: 10,
  /** Seconds between autosaves. */
  autosaveSeconds: 15,
} as const;

/** Where the player starts and wakes up after dying (the village well). */
export const SPAWN = { x: 3, z: 3 } as const;

export const SAVE_KEY = 'gnomomia.save.v1';
export const INVENTORY_SIZE = 28;

/** UI palette (old-school brown and gold). Every UI module uses these. */
export const UI = {
  font: '"Trebuchet MS", Georgia, serif',
  panelBg: 'rgba(62, 53, 41, 0.94)',
  panelBgDark: 'rgba(40, 33, 25, 0.96)',
  border: '#1e1912',
  borderLight: '#6e5f49',
  text: '#ffde9e',
  textDim: '#c9b48a',
  textWhite: '#ffffff',
  good: '#36d636',
  bad: '#e03a3a',
  mana: '#3a8ce0',
  gold: '#ffd700',
  quest: '#00e5ff',
} as const;

// ---------------------------------------------------------------- stats

export type Attribute = 'strength' | 'endurance' | 'agility' | 'intelligence';
export const ATTRIBUTES: readonly Attribute[] = ['strength', 'endurance', 'agility', 'intelligence'];

export type SkillId = 'blade' | 'blunt' | 'block' | 'armor' | 'destruction' | 'restoration';
export const SKILLS: readonly { id: SkillId; name: string; about: string }[] = [
  { id: 'blade', name: 'Blade', about: 'Hit more often with trowels, shears and claws.' },
  { id: 'blunt', name: 'Blunt', about: 'Hit more often with mallets, picks and fists.' },
  { id: 'block', name: 'Block', about: 'With a shield equipped, enemies miss more often.' },
  { id: 'armor', name: 'Armor', about: 'Enemies miss more often. Rises when you are hit.' },
  { id: 'destruction', name: 'Destruction', about: 'Flare hits harder.' },
  { id: 'restoration', name: 'Restoration', about: 'Mend heals more.' },
];

export const START_ATTRIBUTE = 10;
export const START_SKILL = 5;

// ---------------------------------------------------------------- items

export type EquipSlot = 'weapon' | 'shield' | 'head' | 'body';
export const EQUIP_SLOTS: readonly EquipSlot[] = ['head', 'body', 'weapon', 'shield'];

export interface ItemDef {
  id: string;
  name: string;
  /** One emoji, drawn as the inventory icon. */
  icon: string;
  kind: 'weapon' | 'shield' | 'armor' | 'potion' | 'misc';
  slot?: EquipSlot;
  /** Weapon damage dice: [count, sides], e.g. [1, 6] = 1d6. */
  damage?: readonly [number, number];
  /** Which skill a weapon trains and uses. */
  skill?: 'blade' | 'blunt';
  /** Armor rating added while equipped. */
  armor?: number;
  /** Potions: hit points / mana restored. */
  heal?: number;
  mana?: number;
  /** Many fit in one inventory slot. */
  stackable?: boolean;
  /** Shop price in gold; shops buy for half. */
  value: number;
  examine: string;
}

export const ITEMS: Record<string, ItemDef> = {
  'rusty-trowel': { id: 'rusty-trowel', name: 'Rusty trowel', icon: '🗡️', kind: 'weapon', slot: 'weapon', damage: [1, 6], skill: 'blade', value: 5, examine: 'It has dug a thousand flowerbeds.' },
  'bronze-shears': { id: 'bronze-shears', name: 'Bronze shears', icon: '✂️', kind: 'weapon', slot: 'weapon', damage: [1, 8], skill: 'blade', value: 45, examine: 'Sharp enough to trim a hedge or a beetle.' },
  'garden-mallet': { id: 'garden-mallet', name: 'Garden mallet', icon: '🔨', kind: 'weapon', slot: 'weapon', damage: [1, 8], skill: 'blunt', value: 35, examine: 'For croquet, and for disagreements.' },
  'iron-pick': { id: 'iron-pick', name: 'Iron pick', icon: '⛏️', kind: 'weapon', slot: 'weapon', damage: [2, 6], skill: 'blunt', value: 140, examine: 'Heavy. Very heavy.' },
  'mole-claw': { id: 'mole-claw', name: 'Mole King claw', icon: '🦴', kind: 'weapon', slot: 'weapon', damage: [2, 8], skill: 'blade', value: 260, examine: 'Torn from Grubthorn himself.' },
  'pot-lid': { id: 'pot-lid', name: 'Pot lid', icon: '🍳', kind: 'shield', slot: 'shield', armor: 2, value: 10, examine: 'Someone is missing their soup lid.' },
  'oak-shield': { id: 'oak-shield', name: 'Oak shield', icon: '🛡️', kind: 'shield', slot: 'shield', armor: 4, value: 70, examine: 'Carved from a fallen acorn tree.' },
  'acorn-cap': { id: 'acorn-cap', name: 'Acorn cap', icon: '🌰', kind: 'armor', slot: 'head', armor: 1, value: 8, examine: 'A snug, nutty helmet.' },
  'thimble-helm': { id: 'thimble-helm', name: 'Thimble helm', icon: '🪖', kind: 'armor', slot: 'head', armor: 3, value: 80, examine: 'A giant\'s thimble, polished to a shine.' },
  'moss-tunic': { id: 'moss-tunic', name: 'Moss tunic', icon: '👕', kind: 'armor', slot: 'body', armor: 1, value: 12, examine: 'Soft, green and a bit damp.' },
  'bark-vest': { id: 'bark-vest', name: 'Bark vest', icon: '🦺', kind: 'armor', slot: 'body', armor: 3, value: 60, examine: 'Stiff, but it turns a blade.' },
  'beetle-plate': { id: 'beetle-plate', name: 'Beetle plate', icon: '🥋', kind: 'armor', slot: 'body', armor: 5, value: 180, examine: 'Shell plates riveted on leather.' },
  'red-potion': { id: 'red-potion', name: 'Red potion', icon: '🧪', kind: 'potion', heal: 14, stackable: true, value: 15, examine: 'Restores 14 hit points.' },
  'blue-potion': { id: 'blue-potion', name: 'Blue potion', icon: '🫙', kind: 'potion', mana: 15, stackable: true, value: 20, examine: 'Restores 15 mana.' },
  mushroom: { id: 'mushroom', name: 'Mushroom', icon: '🍄', kind: 'potion', heal: 4, stackable: true, value: 3, examine: 'Probably edible. Restores 4 hit points.' },
  'slug-slime': { id: 'slug-slime', name: 'Slug slime', icon: '🟢', kind: 'misc', stackable: true, value: 2, examine: 'Sticky. Elder Fernwick wants it for some reason.' },
  'beetle-shell': { id: 'beetle-shell', name: 'Beetle shell', icon: '🐚', kind: 'misc', stackable: true, value: 6, examine: 'Glossy and hard. Tansy grinds these into potions.' },
  'mole-crown': { id: 'mole-crown', name: 'Mole crown', icon: '👑', kind: 'misc', value: 300, examine: 'The muddy crown of the Mole King.' },
};

/** What a new game starts with. Equipped items are not also in the inventory. */
export const START_EQUIPMENT: Record<EquipSlot, string | null> = { weapon: 'rusty-trowel', shield: null, head: null, body: 'moss-tunic' };
export const START_INVENTORY: readonly { item: string; count: number }[] = [{ item: 'red-potion', count: 2 }];
export const START_GOLD = 10;

// ---------------------------------------------------------------- spells

export type SpellId = 'flare' | 'mend';
export interface SpellDef {
  id: SpellId;
  name: string;
  icon: string;
  /** Hotkey shown in the spellbook. */
  key: string;
  cost: number;
  skill: 'destruction' | 'restoration';
  /** Base dice; add skillBonus(skill level) to the roll. */
  dice: readonly [number, number];
  /** Needs an enemy target in TUNING.spellRange. */
  needsTarget: boolean;
  about: string;
}
export const SPELLS: Record<SpellId, SpellDef> = {
  flare: { id: 'flare', name: 'Flare', icon: '🔥', key: '1', cost: 8, skill: 'destruction', dice: [2, 6], needsTarget: true, about: 'Hurl a ball of fire at your target. Never misses.' },
  mend: { id: 'mend', name: 'Mend', icon: '✨', key: '2', cost: 10, skill: 'restoration', dice: [2, 8], needsTarget: false, about: 'Heal your own wounds.' },
};

// ---------------------------------------------------------------- enemies

export type CreatureModel = 'gnome' | 'slug' | 'beetle' | 'mole';

export interface LootDrop {
  item: string;
  /** 0..1 chance this drop happens. */
  chance: number;
  count?: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  level: number;
  hp: number;
  /** Armor rating: the player hits on d20 + bonus >= 10 + armor. */
  armor: number;
  /** Added to the enemy's d20 attack roll. */
  attack: number;
  damage: readonly [number, number];
  /** Seconds between attacks. */
  attackSeconds: number;
  /** Attacks the player on sight (within TUNING.aggroRange). Passive ones only fight back. */
  aggressive: boolean;
  loot: readonly LootDrop[];
  gold: readonly [number, number];
  model: CreatureModel;
  /** Main body colour; for 'gnome' models, the hat and shirt colour. */
  color: number;
  scale: number;
  respawnSeconds: number;
  examine: string;
}

export const ENEMIES: Record<string, EnemyDef> = {
  slug: { id: 'slug', name: 'Garden slug', level: 1, hp: 6, armor: 0, attack: 0, damage: [1, 3], attackSeconds: 3, aggressive: false, loot: [{ item: 'slug-slime', chance: 0.85 }, { item: 'mushroom', chance: 0.2 }], gold: [0, 2], model: 'slug', color: 0x9bb06a, scale: 1, respawnSeconds: 20, examine: 'Slow, slimy and surprisingly bitey.' },
  mole: { id: 'mole', name: 'Mole', level: 2, hp: 10, armor: 1, attack: 1, damage: [1, 4], attackSeconds: 2.6, aggressive: false, loot: [{ item: 'mushroom', chance: 0.5 }, { item: 'acorn-cap', chance: 0.1 }], gold: [1, 4], model: 'mole', color: 0x4a3b33, scale: 1, respawnSeconds: 25, examine: 'It digs up the meadow for fun.' },
  'feral-gnome': { id: 'feral-gnome', name: 'Feral gnome', level: 3, hp: 14, armor: 2, attack: 2, damage: [1, 6], attackSeconds: 2.4, aggressive: true, loot: [{ item: 'red-potion', chance: 0.3 }, { item: 'acorn-cap', chance: 0.12 }, { item: 'pot-lid', chance: 0.12 }, { item: 'garden-mallet', chance: 0.06 }], gold: [3, 12], model: 'gnome', color: 0x3b3b3b, scale: 1, respawnSeconds: 30, examine: 'A gnome who left the garden and never came back.' },
  beetle: { id: 'beetle', name: 'Stag beetle', level: 4, hp: 18, armor: 4, attack: 3, damage: [1, 6], attackSeconds: 2.4, aggressive: true, loot: [{ item: 'beetle-shell', chance: 0.9 }, { item: 'blue-potion', chance: 0.15 }, { item: 'bark-vest', chance: 0.05 }], gold: [0, 6], model: 'beetle', color: 0x5a2e14, scale: 1.2, respawnSeconds: 30, examine: 'Its jaws could snip a trowel in half.' },
  'mole-king': { id: 'mole-king', name: 'Grubthorn the Mole King', level: 8, hp: 60, armor: 6, attack: 5, damage: [2, 6], attackSeconds: 2.8, aggressive: true, loot: [{ item: 'mole-crown', chance: 1 }, { item: 'mole-claw', chance: 1 }, { item: 'red-potion', chance: 1, count: 2 }], gold: [50, 80], model: 'mole', color: 0x2b211c, scale: 2.4, respawnSeconds: 120, examine: 'The king beneath the hill. He wears a muddy crown.' },
};

/** Enemy spawn groups: `count` enemies placed at random within `spread` of (x, z), each keeping that spot as home. */
export const SPAWN_GROUPS: readonly { enemy: string; x: number; z: number; count: number; spread: number }[] = [
  { enemy: 'slug', x: 45, z: 12, count: 6, spread: 14 },
  { enemy: 'mole', x: 52, z: 28, count: 3, spread: 10 },
  { enemy: 'slug', x: 30, z: 40, count: 3, spread: 8 },
  { enemy: 'feral-gnome', x: -55, z: 20, count: 5, spread: 12 },
  { enemy: 'beetle', x: -45, z: -60, count: 5, spread: 14 },
  { enemy: 'mole-king', x: 10, z: -88, count: 1, spread: 0 },
];

// ---------------------------------------------------------------- map

export interface Region {
  id: string;
  name: string;
  x: number;
  z: number;
  /** Radius kept flat and free of trees. */
  r: number;
}

/** Named places. The world builds a dirt road from the village to each of the others. Negative z is north. */
export const REGIONS: readonly Region[] = [
  { id: 'village', name: 'Mossbottom', x: 0, z: 0, r: 24 },
  { id: 'meadow', name: 'Dewdrop Meadow', x: 45, z: 18, r: 26 },
  { id: 'camp', name: 'Feral Camp', x: -55, z: 20, r: 18 },
  { id: 'barrows', name: 'Beetle Barrows', x: -45, z: -60, r: 20 },
  { id: 'burrow', name: 'Grubthorn\'s Burrow', x: 10, z: -88, r: 14 },
];

/** The lake (water fills where the ground dips below TUNING.waterLevel). */
export const LAKE = { x: 50, z: -45, r: 20 } as const;

/** Mushroom houses in Mossbottom: position, cap radius, and yaw of the door (door faces +z at yaw 0). */
export const HOUSES: readonly { x: number; z: number; r: number; yaw: number }[] = [
  { x: -14, z: -10, r: 3.2, yaw: 0.8 },
  { x: 13, z: -12, r: 3.6, yaw: -0.7 },
  { x: -16, z: 10, r: 3.0, yaw: 2.2 },
  { x: 15, z: 11, r: 3.4, yaw: -2.3 },
  { x: 0, z: -18, r: 4.0, yaw: 0 },
];
/** The village well (a blocked circle). */
export const WELL = { x: 0, z: 0, r: 1.2 } as const;

// ---------------------------------------------------------------- NPCs, dialogue, quests

/** A test on game state. All given fields must hold. */
export interface Condition {
  /** Quest status: 'none' = never started, 'active', or 'done'. */
  quest?: { id: string; status: 'none' | 'active' | 'done' };
  /** The active quest is on this stage index (only checked if the quest is active). */
  questStage?: { id: string; stage: number };
}

export type DialogueAction =
  | { type: 'startQuest'; quest: string }
  | { type: 'openShop' }
  | { type: 'heal' }
  | { type: 'close' };

export interface DialogueOption {
  text: string;
  /** Node to go to; absent = close the dialogue (after running the action). */
  next?: string;
  action?: DialogueAction;
  /** Option only shows when this holds. */
  when?: Condition;
}

export interface DialogueNode {
  /** What the NPC says. */
  text: string;
  options: readonly DialogueOption[];
}

export interface NpcDef {
  id: string;
  name: string;
  look: GnomeLook;
  x: number;
  z: number;
  /** Wander this far from (x, z); 0 = stand still. */
  wander: number;
  /** The first greeting whose `when` holds (or has no `when`) names the opening node. */
  greetings: readonly { when?: Condition; node: string }[];
  nodes: Record<string, DialogueNode>;
  /** Item ids sold here (the shop buys anything for half its value). */
  shop?: readonly string[];
  examine: string;
}

const look = (hat: number, shirt: number, beard: number | null, extra: Partial<GnomeLook> = {}): GnomeLook => ({
  hat, shirt, pants: 0x5a4632, skin: 0xf1c27d, boots: 0x2a2018, beard, hair: null, freckles: false, dress: false, glasses: false, bowlCut: null, ...extra,
});

/** The player's own look when they never used the Gnome Creator. */
export const PLAYER_LOOK: GnomeLook = look(0x2f8f4e, 0x8a6a3a, 0xc9a26b);

export const NPCS: Record<string, NpcDef> = {
  fernwick: {
    id: 'fernwick', name: 'Elder Fernwick', look: look(0x7b3fb0, 0x4b2a6e, 0xf4f4f4, { glasses: true }), x: 0, z: 6, wander: 0,
    examine: 'The oldest gnome in Mossbottom. His beard has its own postcode.',
    greetings: [
      { when: { questStage: { id: 'slime-time', stage: 1 } }, node: 'slimeTurnIn' },
      { when: { questStage: { id: 'mole-king', stage: 1 } }, node: 'kingTurnIn' },
      { when: { quest: { id: 'mole-king', status: 'done' } }, node: 'hero' },
      { when: { quest: { id: 'mole-king', status: 'active' } }, node: 'kingWaiting' },
      { when: { quest: { id: 'slime-time', status: 'done' } }, node: 'offerKing' },
      { when: { quest: { id: 'slime-time', status: 'active' } }, node: 'slimeWaiting' },
      { node: 'intro' },
    ],
    nodes: {
      intro: {
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
        ],
      },
      kingWaiting: { text: 'Grubthorn\'s burrow lies far to the north. Bring potions. Bring friends, if you have any.', options: [{ text: 'I will be back.' }] },
      kingTurnIn: {
        text: 'The crown of Grubthorn! Mossbottom is safe. From this day you are the Hero of Gnomomia.',
        options: [{ text: 'It was nothing.' }],
      },
      hero: { text: 'Our hero returns! The children have started calling you "Gnomezilla".', options: [{ text: 'Goodbye.' }] },
    },
  },
  bramble: {
    id: 'bramble', name: 'Bramble the Smith', look: look(0x9a3324, 0x3c3c3c, 0x8b4513), x: -9, z: -4, wander: 1.5,
    examine: 'His apron is more burn mark than apron.',
    greetings: [{ node: 'hello' }],
    nodes: {
      hello: {
        text: 'Need a blade? A lid to hide behind? I forge it all, for a fair price.',
        options: [{ text: 'Show me your wares.', action: { type: 'openShop' } }, { text: 'Goodbye.' }],
      },
    },
    shop: ['bronze-shears', 'garden-mallet', 'iron-pick', 'pot-lid', 'oak-shield', 'acorn-cap', 'bark-vest'],
  },
  tansy: {
    id: 'tansy', name: 'Tansy the Herbalist', look: look(0xe86fb0, 0x4fae5a, null, { hair: { color: 0xd8902f, style: 'pigtails' }, dress: true, freckles: true }), x: 9, z: -3, wander: 1.5,
    examine: 'She smells of mint and something you cannot place.',
    greetings: [
      { when: { questStage: { id: 'shells', stage: 1 } }, node: 'turnIn' },
      { when: { quest: { id: 'shells', status: 'active' } }, node: 'waiting' },
      { when: { quest: { id: 'shells', status: 'done' } }, node: 'shop' },
      { node: 'hello' },
    ],
    nodes: {
      hello: {
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
    shop: ['red-potion', 'blue-potion', 'mushroom'],
  },
  pip: {
    id: 'pip', name: 'Captain Pip', look: look(0x2a4fa8, 0x8a8a8a, 0x222222), x: -20, z: 2, wander: 2,
    examine: 'Captain of the Mossbottom guard. The guard is him.',
    greetings: [
      { when: { questStage: { id: 'feral-trouble', stage: 1 } }, node: 'turnIn' },
      { when: { quest: { id: 'feral-trouble', status: 'active' } }, node: 'waiting' },
      { when: { quest: { id: 'feral-trouble', status: 'done' } }, node: 'done' },
      { node: 'hello' },
    ],
    nodes: {
      hello: {
        text: 'Halt! Oh, it is you. Feral gnomes have made a camp to the west and they keep stealing our garden furniture. I could use a sword arm.',
        options: [
          { text: 'I will drive them off.', action: { type: 'startQuest', quest: 'feral-trouble' } },
          { text: 'Not my problem.' },
        ],
      },
      waiting: { text: 'Five ferals should teach the rest a lesson. The camp is due west.', options: [{ text: 'Understood.' }] },
      turnIn: { text: 'Five ferals! The garden furniture is safe. Take my old shield, it served me well.', options: [{ text: 'Thanks, Captain.' }] },
      done: { text: 'The west is quiet. Mostly. Good work, recruit.', options: [{ text: 'Goodbye.' }] },
    },
  },
  thistle: {
    id: 'thistle', name: 'Old Thistle', look: look(0x8f8f2a, 0x6b4a2e, 0xbbbbbb), x: 6, z: 14, wander: 5,
    examine: 'He has been sweeping the same path for forty years.',
    greetings: [{ node: 'hello' }],
    nodes: {
      hello: {
        text: 'Hrm? In my day we fought slugs with our bare hands. Uphill. Both ways.',
        options: [{ text: 'Any advice?', next: 'advice' }, { text: 'Goodbye.' }],
      },
      advice: {
        text: 'Skills grow when you use them, youngster. Swing a blade, get better with blades. Get hit a lot, your armor skill grows. Ten skill-ups and you level. Simple!',
        options: [{ text: 'Thanks, Thistle.' }],
      },
    },
  },
};

export type Objective =
  | { type: 'kill'; enemy: string; count: number }
  | { type: 'collect'; item: string; count: number }
  | { type: 'talk'; npc: string };

export interface QuestStage {
  /** Journal text for this stage. */
  text: string;
  objective: Objective;
  /** Items removed from the inventory when this stage completes (a turn-in). */
  takeItems?: readonly { item: string; count: number }[];
}

export interface QuestDef {
  id: string;
  name: string;
  giver: string;
  stages: readonly QuestStage[];
  reward: { gold: number; items: readonly { item: string; count: number }[] };
}

export const QUESTS: Record<string, QuestDef> = {
  'slime-time': {
    id: 'slime-time', name: 'Slime Time', giver: 'fernwick',
    stages: [
      { text: 'Gather 5 slug slime from the garden slugs in Dewdrop Meadow, east of Mossbottom.', objective: { type: 'collect', item: 'slug-slime', count: 5 } },
      { text: 'Bring the slime to Elder Fernwick.', objective: { type: 'talk', npc: 'fernwick' }, takeItems: [{ item: 'slug-slime', count: 5 }] },
    ],
    reward: { gold: 30, items: [{ item: 'red-potion', count: 3 }] },
  },
  'feral-trouble': {
    id: 'feral-trouble', name: 'Feral Trouble', giver: 'pip',
    stages: [
      { text: 'Defeat 5 feral gnomes at the camp west of Mossbottom.', objective: { type: 'kill', enemy: 'feral-gnome', count: 5 } },
      { text: 'Report back to Captain Pip.', objective: { type: 'talk', npc: 'pip' } },
    ],
    reward: { gold: 80, items: [{ item: 'oak-shield', count: 1 }] },
  },
  shells: {
    id: 'shells', name: 'Shells for Tansy', giver: 'tansy',
    stages: [
      { text: 'Collect 4 beetle shells from the stag beetles in Beetle Barrows, south-west of Mossbottom.', objective: { type: 'collect', item: 'beetle-shell', count: 4 } },
      { text: 'Bring the shells to Tansy the Herbalist.', objective: { type: 'talk', npc: 'tansy' }, takeItems: [{ item: 'beetle-shell', count: 4 }] },
    ],
    reward: { gold: 60, items: [{ item: 'thimble-helm', count: 1 }, { item: 'blue-potion', count: 2 }] },
  },
  'mole-king': {
    id: 'mole-king', name: 'The Mole King', giver: 'fernwick',
    stages: [
      { text: 'Defeat Grubthorn the Mole King in his burrow, far to the north.', objective: { type: 'kill', enemy: 'mole-king', count: 1 } },
      { text: 'Bring news of your victory to Elder Fernwick.', objective: { type: 'talk', npc: 'fernwick' } },
    ],
    reward: { gold: 300, items: [{ item: 'beetle-plate', count: 1 }] },
  },
};

// ---------------------------------------------------------------- runtime shapes

export interface InvSlot {
  item: string;
  count: number;
}

/** Anything in the world the player can click: an NPC, an enemy or a loot pile. */
export interface Entity {
  id: number;
  kind: 'npc' | 'enemy' | 'loot';
  /** Key into NPCS or ENEMIES; 'loot' for loot piles. */
  defId: string;
  name: string;
  /** Enemy level (0 for NPCs and loot). */
  level: number;
  /** Feet position; y follows the ground. */
  position: THREE.Vector3;
  /** Spawn point (enemies return here; NPCs wander around it). */
  home: THREE.Vector3;
  facing: number;
  /** Root of the model; it and every child mesh has userData.entityId = id (for raycast picking). */
  object: THREE.Object3D;
  hp: number;
  maxHp: number;
  /** Dead enemies stay in the list (hidden) until they respawn. */
  dead: boolean;
  /** Enemy is chasing or fighting the player. */
  inCombat: boolean;
  /** Seconds until this enemy may attack again. */
  attackTimer: number;
  /** Seconds since this entity was last hit (Infinity if never); the HUD shows an overhead HP bar for 6 s. */
  sinceHit: number;
  /** Loot piles only. */
  loot: InvSlot[];
  gold: number;
}

/** Id used in events for the player (entity ids start at 1). */
export const PLAYER_ID = 0;
