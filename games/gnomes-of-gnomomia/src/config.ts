// Gnomes of Gnomomia: every shared type and tuning number. No data tables (those live in src/data/, merged by content.ts) and no logic.
import type * as THREE from 'three';
import type { GnomeLook } from '@lawn/gnome';

// ---------------------------------------------------------------- tuning

export const TUNING = {
  /** Default map half-size for zones that don't set `half`: the map is a square from -worldHalf to +worldHalf. */
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
  playerAttackSeconds: 2.0,
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
  /** Skill increases needed for the next character level (old rule; progression.ts replaces it in epic 2). */
  skillUpsPerLevel: 10,
  /** Seconds between autosaves. */
  autosaveSeconds: 15,
} as const;

/** Where a new game starts in Mossbottom (by the well). */
export const SPAWN = { x: 3, z: 3 } as const;

export const SAVE_KEY = 'gnomomia.save.v2';
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

export const START_ATTRIBUTE = 10;
export const START_SKILL = 5;
export const START_GOLD = 10;

// ---------------------------------------------------------------- core enums

export type ZoneId = 'mossbottom' | 'thatchford' | 'keep' | 'deeps' | 'cloverfield' | 'hedgewood' | 'rockery' | 'verge';
export type ClassId = 'warden' | 'slinger' | 'mage';
export type Attribute = 'strength' | 'endurance' | 'agility' | 'intelligence';
export type SkillId = 'blade' | 'blunt' | 'marksmanship' | 'block' | 'toughness' | 'sun' | 'rain' | 'bloom';
export type School = 'sun' | 'rain' | 'bloom';
export type DamageType = 'slash' | 'crush' | 'pierce' | School;
export type Family = 'soft' | 'shelled' | 'furred' | 'winged' | 'plant' | 'fired' | 'unfired' | 'metal';
export type Rank = 'trivial' | 'normal' | 'elite' | 'miniboss' | 'boss' | 'worldboss' | 'final';
export type Rarity = 'plain' | 'sprouted' | 'blooming' | 'heirloom' | 'kilnfired';
export type EquipSlot = 'head' | 'body' | 'legs' | 'hands' | 'feet' | 'weapon' | 'offhand' | 'trinket';
export const EQUIP_SLOTS: readonly EquipSlot[] = ['head', 'body', 'legs', 'hands', 'feet', 'weapon', 'offhand', 'trinket'];
export type StatusId = 'chipped' | 'poisoned' | 'burning' | 'soaked' | 'slowed' | 'rooted' | 'staggered' | 'stunned' | 'cracked' | 'glazed' | 'marked';
export type StatKey = Attribute | 'accuracy' | 'defense' | 'critDamage' | 'moveSpeed' | 'sunDamage' | 'rainDamage' | 'bloomHealing';

// ---------------------------------------------------------------- items

export interface ItemDef {
  id: string; name: string; icon: string;
  kind: 'weapon' | 'offhand' | 'armor' | 'trinket' | 'potion' | 'misc';
  slot?: EquipSlot;
  ilvl?: number;                       // weapons, armor, offhands, trinkets
  rarity?: Rarity;                     // default 'plain'
  damageType?: DamageType;             // weapons; ammo pouches set the ranged type
  hands?: 1 | 2;
  weaponClass?: 'melee' | 'sling' | 'blowpipe' | 'thrown' | 'staff' | 'wand';
  armorType?: 'cloth' | 'leather' | 'plate' | 'shield';
  damageOverride?: readonly [number, number];   // min, max; else rules.weaponRange()
  armor?: number;                               // else rules.armorValue()
  stats?: Partial<Record<StatKey, number>>;
  effect?: string;                              // tooltip text for Heirloom/Kiln-fired specials
  heal?: number; mana?: number; stackable?: boolean;
  value: number; examine: string;
  questItem?: boolean;                          // cannot be sold or dropped
}

// ---------------------------------------------------------------- spells, classes, talents

export type SpellId = 'flare' | 'mend';
export interface SpellDef {
  id: SpellId; name: string; icon: string; school: School;
  cost: number; cooldown: number; castTime: number; needsTarget: boolean;
  ranks: readonly number[];   // levels at which each rank is learned
  heal?: boolean; about: string;
}

export interface ClassDef { id: ClassId; name: string; primary: Attribute; resource: 'grit' | 'focus' | 'mana'; armor: readonly ('cloth' | 'leather' | 'plate' | 'shield')[]; abilities: readonly AbilityDef[] }
export interface AbilityDef { id: string; name: string; icon: string; level: number; cost: number; cooldown: number; castTime: number; kind: 'attack' | 'spell' | 'buff' | 'heal' | 'move' | 'summon' | 'trap' | 'passive'; damageType?: DamageType; power?: number; radius?: number; status?: StatusId; statusSeconds?: number; about: string; fromTalent?: string }
export interface TalentDef { id: string; classId: ClassId; branch: string; tier: 1 | 2 | 3 | 4 | 5 | 6; maxRank: number; name: string; about: string; grants?: string /* ability id */ }

// ---------------------------------------------------------------- enemies

export interface LootDrop {
  item: string;
  /** 0..1 chance this drop happens. */
  chance: number;
  count?: number;
}

export interface BossMoveDef {
  id: string; name: string;
  kind: 'ring' | 'cone' | 'lane' | 'summon' | 'pull' | 'pool' | 'vanish' | 'buff';
  every: number;            // seconds between uses
  telegraph: number;        // seconds of warning
  radius?: number; length?: number; width?: number;
  damage?: number;          // multiplier of the enemy's normal hit
  status?: StatusId; statusSeconds?: number;
  summon?: { enemy: string; count: number };
  belowHpPct?: number;      // only used when HP is below this fraction
}

export type CreatureModel = 'gnome' | 'slug' | 'beetle' | 'mole' | 'rat' | 'frog' | 'worm' | 'leech' | 'ant' | 'aphid' | 'snail'
  | 'crow' | 'wasp' | 'moth' | 'spider' | 'cricket' | 'earwig' | 'centipede' | 'straw' | 'clay' | 'metal' | 'mower';

export interface EnemyDef {
  id: string; name: string; level: number; rank: Rank; family: Family;
  damageType: DamageType; aggressive: boolean;
  attackSeconds?: number;                      // default 2.4
  hpOverride?: number; damageOverride?: readonly [number, number];
  defense?: number;                             // +2 for winged is applied automatically
  ward?: Partial<Record<School, number>>;      // 0..1 extra on top of family
  loot: readonly LootDrop[]; gold: readonly [number, number];
  model: CreatureModel; color: number; scale: number;
  respawnSeconds: number; examine: string;
  wants: string;                                // lore rule 6, shown on Examine
  moves?: readonly BossMoveDef[];
  lastWords?: string;                           // said on death
  onDeathFlag?: { flag: string; value: string };   // set when this enemy dies
}

export interface SpawnGroup { zone: ZoneId; enemy: string; x: number; z: number; count: number; spread: number; when?: Condition }

// ---------------------------------------------------------------- world objects and zones

export interface WorldObjectDef {
  id: string; zone: ZoneId; name: string; x: number; z: number;
  model: 'valve' | 'statue' | 'book' | 'cart' | 'chest' | 'sign' | 'stone' | 'grave' | 'post' | 'trough' | 'generic';
  color?: number; scale?: number;
  verb: string;                 // right-click label, e.g. 'Turn', 'Read', 'Lasso'
  examine: string;
  text?: string;                // shown in chat when used
  when?: Condition;             // hidden unless this holds
  once?: boolean;               // can be used once per save
  giveItem?: { item: string; count: number };
  takeItem?: { item: string; count: number };   // consumed on use; the object refuses to work without them
  setFlag?: { flag: string; value: string };
}

export interface ZoneExit { to: ZoneId; x: number; z: number; r: number; arriveX: number; arriveZ: number; label: string; when?: Condition }
export interface Region { id: string; name: string; x: number; z: number; r: number }
export interface ZoneDef {
  id: ZoneId; name: string; levels: readonly [number, number];
  half: number;                                        // map is -half..+half
  spawn: { x: number; z: number };                     // arrival when no exit applies
  shrine: { x: number; z: number; name: string };      // respawn point
  regions: readonly Region[];
  lakes: readonly { x: number; z: number; r: number }[];
  houses: readonly { x: number; z: number; r: number; yaw: number; style: 'mushroom' | 'thatch' | 'stone' | 'log' | 'tent' | 'pot' }[];
  theme: { ground: number; groundAlt: number; flora: 'mushroom' | 'grass' | 'clover' | 'hedge' | 'rock' | 'pipe' | 'stubble'; floraDensity: number; fog: number; sky: number; hilliness: number };
  exits: readonly ZoneExit[];
  indoor?: boolean;                                     // Drainpipe Deeps: walls, no sky
  walls?: readonly { x1: number; z1: number; x2: number; z2: number }[];  // blocking wall segments (Deeps wings)
}
// An exit may point to its own zone (to: same id): it's a hatch that teleports inside the map.

// ---------------------------------------------------------------- NPCs, dialogue, quests

/** A test on game state. All given fields must hold. */
export interface Condition {
  quest?: { id: string; status: 'none' | 'active' | 'done' };
  questStage?: { id: string; stage: number };
  flag?: { name: string; value: string };       // state.flags[name] === value
  flagSet?: string;                              // state.flags[name] !== undefined
  flagUnset?: string;
  minLevel?: number;
  classId?: ClassId | 'none';
  hasItem?: { item: string; count: number };
  questAtLeast?: { id: string; stage: number };  // quest done, or active on this stage or later
  not?: Condition;                               // true when the inner condition is false
}

export type DialogueAction =
  | { type: 'startQuest'; quest: string }
  | { type: 'openShop' } | { type: 'heal' } | { type: 'close' }
  | { type: 'setFlag'; flag: string; value: string }
  | { type: 'chooseClass'; classId: ClassId }
  | { type: 'respec' }
  | { type: 'travel'; zone: ZoneId; x: number; z: number }
  | { type: 'giveItem'; item: string; count: number }
  | { type: 'takeItem'; item: string; count: number }
  | { type: 'giveGold'; amount: number } | { type: 'takeGold'; amount: number };

/** `next` absent = close the dialogue (after running the action). */
export interface DialogueOption { text: string; next?: string; action?: DialogueAction; when?: Condition }
export interface DialogueNode { text: string; options: readonly DialogueOption[]; hub?: boolean }  // hub: pack topics appear here
export interface Greeting { when?: Condition; node: string }

export interface NpcDef {
  id: string; name: string; look: GnomeLook; zone: ZoneId; x: number; z: number; wander: number;
  placements?: readonly { zone: ZoneId; x: number; z: number; when: Condition }[];  // first match wins, else zone/x/z
  hidden?: Condition;            // not spawned while this holds
  greetings: readonly Greeting[]; nodes: Record<string, DialogueNode>;
  shop?: readonly string[]; trainer?: ClassId; examine: string;
  model?: CreatureModel;         // non-gnome NPCs (ants, moles, the Gleaner); default 'gnome'
  scale?: number;                // model scale, default 1
}

export type Objective =
  | { type: 'kill'; enemy: string; count: number }
  | { type: 'collect'; item: string; count: number }
  | { type: 'talk'; npc: string }
  | { type: 'reach'; zone: ZoneId; x: number; z: number; r: number }
  | { type: 'interact'; object: string; count: number }
  | { type: 'escort'; npc: string; zone: ZoneId; x: number; z: number; r: number }
  | { type: 'defend'; zone: ZoneId; x: number; z: number; r: number; seconds: number; waves: readonly { enemy: string; count: number; at: number }[] }
  | { type: 'choice'; flag: string };

export interface QuestStage { text: string; objective: Objective; takeItems?: readonly { item: string; count: number }[] }
export interface QuestDef {
  id: string; name: string; giver: string; zone: ZoneId; level: number;
  tier: 'side' | 'main' | 'finale';
  chain?: string;                // storyline or chapter id, for the journal
  stages: readonly QuestStage[];
  reward: { gold: number; items: readonly { item: string; count: number }[] };
}

export interface AllyDef { id: string; name: string; when: Condition; effect: string }   // Battle of the Verge (effect id read by mower.ts)

/** One content file's worth of data. content.ts merges every pack; a duplicate id throws on load. */
export interface ContentPack {
  id: string;
  items?: Record<string, ItemDef>;
  enemies?: Record<string, EnemyDef>;
  npcs?: Record<string, NpcDef>;
  quests?: Record<string, QuestDef>;
  spawns?: readonly SpawnGroup[];
  objects?: Record<string, WorldObjectDef>;
  topics?: Record<string, readonly DialogueOption[]>;          // npcId -> options added to its hub nodes
  greetingsFirst?: Record<string, readonly Greeting[]>;         // npcId -> greetings checked before its own
  extraNodes?: Record<string, Record<string, DialogueNode>>;   // npcId -> nodes merged into its node map
  shopAdds?: Record<string, readonly string[]>;                // npcId -> extra stock
  allies?: readonly AllyDef[];
}

// ---------------------------------------------------------------- looks

/** A gnome look with the common defaults (brown trousers, light skin, dark boots). */
export const look = (hat: number, shirt: number, beard: number | null, extra: Partial<GnomeLook> = {}): GnomeLook => ({
  hat, shirt, pants: 0x5a4632, skin: 0xf1c27d, boots: 0x2a2018, beard, hair: null, freckles: false, dress: false, glasses: false, bowlCut: null, ...extra,
});

/** The player's own look when they never used the Gnome Creator. */
export const PLAYER_LOOK: GnomeLook = look(0x2f8f4e, 0x8a6a3a, 0xc9a26b);

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
