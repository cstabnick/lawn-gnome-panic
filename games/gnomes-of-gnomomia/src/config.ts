// Gnomes of Gnomomia: every shared type and tuning number. No data tables (those live in src/data/, merged by content.ts) and no logic.
import type * as THREE from 'three';
import type { GnomeLook } from '@lawn/gnome';
import type { MarkerDef, PathDef, PropDef, Stamp } from '@lawn/level';

// ---------------------------------------------------------------- tuning

export const TUNING = {
  /** Default map half-size for zones that don't set `half`: the map is a square from -worldHalf to +worldHalf. */
  worldHalf: 120,
  /** Water surface height; ground below it is lake (blocked). */
  waterLevel: -0.6,
  walkSpeed: 4.2,
  /** Cost of walking on a road relative to open ground for click-to-move: 1 = no preference (the default), 0.8 = prefer roads. */
  roadPathBias: 1,
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

/** Open world: one coordinate space for every zone (see src/data/layout.ts and src/terrain.ts). */
export const WORLD = {
  /** Terrain chunk edge (m). Chunk (ci, cj) covers x in [ci*chunk, (ci+1)*chunk), z likewise. */
  chunk: 64,
  /** Terrain is drawn out to this distance from the camera target (m). */
  viewRadius: 640,
  /** Chunks closer than this get full-resolution terrain (2 m cells) and flora; farther ones 8 m cells, no flora. */
  nearRadius: 192,
  /** Fog: starts and ends (m). */
  fogNear: 260,
  fogFar: 640,
  /** Camera far plane (m). */
  cameraFar: 1400,
  /** NPCs, enemies and objects of a zone are spawned while the player is within this distance of the zone's rect (m)... */
  activeRadius: 200,
  /** ...and despawned when farther than this (m). */
  inactiveRadius: 260,
  /** Other players are drawn within this distance (m); their name plates within plateRadius. */
  remoteViewRadius: 450,
  plateRadius: 60,
  /** Neighbouring zone heights blend over this many metres outside a zone's rect. */
  blend: 40,
  /** Height of the ridge that separates zones; roads cut passes through it. */
  ridge: 9,
  /** Half-width (m) of the walkable strip along a road between zones. */
  roadHalfWidth: 3.5,
  /** A walker may step up or down at most this much between two samples (m). */
  step: 0.6,
  /** Ground colliders (houses, trees, rocks) only block walkers within this height of the ground (m). */
  groundBand: 2.5,
  /** Instances (indoor zones) are parked this far south of the overworld, out of sight. */
  instanceZ: 3000,
} as const;

/** What surface paint can lay on the ground (PaintGrid ids; 0 is unpainted). The colour is the ground colour there. */
export const PAINT_SURFACES: readonly { id: number; name: string; color: number }[] = [
  { id: 1, name: 'Dirt', color: 0x9b7a4c },
  { id: 2, name: 'Sand', color: 0xd8c78a },
  { id: 3, name: 'Mud', color: 0x6b5038 },
  { id: 4, name: 'Stone', color: 0x8f8f88 },
  { id: 5, name: 'Moss', color: 0x4f7a3a },
];

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

export type OutdoorZoneId = 'mossbottom' | 'thatchford' | 'keep' | 'deeps' | 'cloverfield' | 'hedgewood' | 'rockery' | 'verge';
/** A map: one of the eight hand-made zones, or a building interior generated from a house (`<zone>/<house id>`, see
 * src/data/interiors.ts). Interiors are instances parked beyond the Deeps (content.ts gives each an origin). */
export type ZoneId = OutdoorZoneId | `${OutdoorZoneId}/${string}`;
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
export type StatusId = 'chipped' | 'poisoned' | 'burning' | 'soaked' | 'slowed' | 'rooted' | 'staggered' | 'stunned' | 'cracked' | 'glazed' | 'marked' | 'smoking' | 'tipsy';
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
  prefab?: string;                              // @lawn/prefabs id for its picture; else picked from icon + name
  gate?: Gate;                                  // shops will not sell it until gate.when holds (src/gates.ts)
}

/** A quest gate on gear or a talent: locked until `when` holds; `why` is the in-world reason shown while locked. */
export interface Gate { when: Condition; why: string }

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
export interface TalentDef { id: string; classId: ClassId; branch: string; tier: 1 | 2 | 3 | 4 | 5 | 6; maxRank: number; name: string; about: string; grants?: string /* ability id */; gate?: Gate /* cannot be learned until gate.when holds */ }

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

/** Circular leash boundary (world or zone-local metres depending on phase). */
export interface LeashArea { x: number; z: number; r: number }

/** stable id; the level file's spawn marker refers to it */
export interface SpawnGroup {
  id?: string; zone: ZoneId; enemy: string; x: number; z: number; count: number; spread: number; when?: Condition; leash?: LeashArea;
  /** A called fight: a quest starts it on purpose inside a town, so the Bound-Peace (src/towns.ts) does not apply to its
   * members. Must have a quest or questStage `when`. */
  townFight?: boolean;
}
/** A spawn as a pack writes it: x and z may be left out when a spawn marker in the zone file gives them. */
export type SpawnSpec = Omit<SpawnGroup, 'x' | 'z'> & { x?: number; z?: number };

// ---------------------------------------------------------------- world objects and zones

export interface WorldObjectDef {
  id: string; zone: ZoneId; name: string; x: number; z: number;
  model: 'valve' | 'statue' | 'book' | 'cart' | 'chest' | 'sign' | 'stone' | 'grave' | 'post' | 'trough' | 'generic'
    | 'bookshelf' | 'lectern' | 'scroll' | 'plaque';
  color?: number; scale?: number;
  yaw?: number;                 // radians about y; 0 faces +z (south)
  book?: string;                // BOOKS id: using the object opens it in the reader (and records it in the lore journal)
  verb: string;                 // right-click label, e.g. 'Turn', 'Read', 'Lasso'
  examine: string;
  text?: string;                // shown in chat when used
  when?: Condition;             // hidden unless this holds
  once?: boolean;               // can be used once per save
  giveItem?: { item: string; count: number };
  takeItem?: { item: string; count: number };   // consumed on use; the object refuses to work without them
  setFlag?: { flag: string; value: string };
}

/** A world object as packs write it. x and z may be left out when a level file's `object` marker places it (see placement.ts). */
export type WorldObjectSpec = Omit<WorldObjectDef, 'x' | 'z'> & { x?: number; z?: number };

export interface ZoneExit {
  to: ZoneId; x: number; z: number; r: number; arriveX: number; arriveZ: number; label: string; when?: Condition;
  door?: boolean;               // a house door (drawn as a doormat, no ring or sign); generated by content.ts
}

/** One building on a zone map. Every house can be entered unless interior is false. */
export interface HouseDef {
  x: number; z: number; r: number; yaw: number; style: 'mushroom' | 'thatch' | 'stone' | 'log' | 'tent' | 'pot';
  /** Stable id inside its zone; the interior's zone id is `<zone>/<id>`. Default `h<index>` (so never reorder the houses list). */
  id?: string;
  /** false = not enterable. Absent = the style's default template with seeded variation. */
  interior?: InteriorSpec | false;
  /** Set by content.ts when it turns a door or shuts a house with no clear side; never written to a level file. */
  authored?: { yaw: number; turnedYaw?: number; autoShut?: boolean };
}

// ---------------------------------------------------------------- interiors

export type InteriorTemplateId = 'cottage' | 'mushroom-home' | 'hall' | 'workshop' | 'chapel' | 'tent' | 'tavern' | 'library' | 'shop';
export type FurnitureKind =
  | 'bed' | 'bedroll' | 'table' | 'chair' | 'stool' | 'bench' | 'hearth' | 'barrel' | 'crate' | 'sack' | 'rug' | 'pot'
  | 'lamp' | 'counter' | 'altar' | 'pew' | 'workbench' | 'anvil' | 'loom' | 'cauldron' | 'plant' | 'painting'
  | 'wardrobe' | 'cupboard' | 'millstone'
  | 'bookshelf' | 'lectern';   // these two become clickable WorldObjects (model of the same name) holding a book
/** A piece of furniture in room coordinates: (0, 0) is the room centre, the door is at (0, +hd). yaw 0 faces +z (the door). */
export interface FurniturePlacement { kind: FurnitureKind; x: number; z: number; yaw?: number; color?: number; scale?: number }

/** Per-house overrides of the generated interior. Everything is optional. */
export interface InteriorSpec {
  template?: InteriorTemplateId;            // default: by house style (thatch->cottage, mushroom->mushroom-home, stone->hall, log->workshop, pot->chapel, tent->tent)
  name?: string;                            // shown on arrival and in the HUD, e.g. 'The Tipsy Toadstool'
  seed?: number;                            // change to reroll the variation
  palette?: { floor?: number; wall?: number; trim?: number };
  add?: readonly FurniturePlacement[];      // extra furniture, placed as given (not checked for overlap)
  remove?: readonly FurnitureKind[];        // generated furniture of these kinds is dropped
  books?: readonly string[];                // BOOKS ids put on this room's shelves and lecterns first (in order), before random common books
}

/** Filled in by content.ts on every generated interior ZoneDef. */
export interface InteriorInfo {
  parent: OutdoorZoneId; houseId: string; template: InteriorTemplateId;
  hw: number; hd: number;                   // room half-width (x) and half-depth (z); walls stand at |x| = hw and |z| = hd (room-local)
  palette: { floor: number; wall: number; trim: number };
  light: number;                            // colour of the room's warm light
  /** Decorative furniture in ROOM-LOCAL coordinates (add the zone's origin for world). Bookshelves and lecterns are in
   * OBJECTS instead, with ids `<zone>#shelf<n>` / `<zone>#lectern<n>` (world positions, like every object). */
  layout: readonly FurniturePlacement[];
}

// ---------------------------------------------------------------- books and lore

/** Anything readable: a book, a pinned note, a letter, a plaque or gravestone, a diary, a scroll. */
export interface BookDef {
  id: string; title: string;
  author?: string;                          // as written on it; omit when unknown
  kind: 'book' | 'note' | 'letter' | 'plaque' | 'journal' | 'scroll';
  /** Each string is one page (plain text; blank lines separate paragraphs). Keep a page under ~600 characters. */
  pages: readonly string[];
  /** May turn up on any generated bookshelf or lectern. With `where`, only in interiors of those zones. */
  common?: boolean;
  where?: readonly OutdoorZoneId[];
}
export interface Region { id: string; name: string; x: number; z: number; r: number }
/** A raised outdoor floor on posts (a tower top, a balcony, a wall-walk), axis-aligned, with one ramp down to the ground.
 * x, z: centre; w: size along x; d: size along z; y: height of the floor above the ground at its centre.
 * stair: the side the ramp leaves from ('n' = -z, 's' = +z, 'e' = +x, 'w' = -x); the ramp is 2.4 m wide and 2*y long. */
export interface Deck { x: number; z: number; w: number; d: number; y: number; stair: 'n' | 's' | 'e' | 'w'; style?: 'wood' | 'stone' }
export interface ZoneDef {
  id: ZoneId; name: string; levels: readonly [number, number];
  /** World position of the zone's centre. Zone files leave it out (they are authored around 0,0); content.ts sets it
   * from src/data/layout.ts and moves every other position in the zone by it, so at runtime all positions are world. */
  origin?: { x: number; z: number };
  half: number;                                        // map is -half..+half
  spawn: { x: number; z: number };                     // arrival when no exit applies
  shrine: { x: number; z: number; name: string };      // respawn point
  regions: readonly Region[];
  lakes: readonly { x: number; z: number; r: number }[];
  houses: readonly HouseDef[];
  theme: { ground: number; groundAlt: number; flora: 'mushroom' | 'grass' | 'clover' | 'hedge' | 'rock' | 'pipe' | 'stubble'; floraDensity: number; fog: number; sky: number; hilliness: number };
  exits: readonly ZoneExit[];
  indoor?: boolean;                                     // Drainpipe Deeps: walls, no sky
  walls?: readonly { x1: number; z1: number; x2: number; z2: number }[];  // blocking wall segments (Deeps wings)
  decks?: readonly Deck[];                              // raised walkable floors outdoors
  interior?: InteriorInfo;                              // set on generated building interiors only
  /** Level-file layers (src/data/levels/<zone>.level.json). Authored zone-local like the rest; content.ts moves them by the origin. */
  stamps?: readonly Stamp[];                            // ground edits on top of the zone's own ground (see @lawn/level)
  paths?: readonly PathDef[];                           // extra roads (kind 'road'); other kinds are ignored for now
  props?: readonly PropDef[];                           // prefab decorations; solidR > 0 makes one a collider
  /** 'derived' (default): dirt roads run from the shrine to every region and exit. 'authored': only `paths` are roads. */
  roadMode?: 'derived' | 'authored';
  /** Named points from the level file (`object` markers place world objects). Zone-local like the rest. */
  markers?: MarkerDef[];
}
// An exit may point to its own zone (to: same id): it's a hatch that teleports inside the map.
// Open world: an exit between two outdoor zones is not a teleport any more. It marks where the road between them
// leaves this zone; terrain.ts builds the road (and its pass through the ridge) from it. Its `when` gates the road.
// Exits into or out of an instance (an indoor zone) still teleport, to (arriveX, arriveZ).

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
  spawns?: readonly SpawnSpec[];
  objects?: Record<string, WorldObjectSpec>;
  topics?: Record<string, readonly DialogueOption[]>;          // npcId -> options added to its hub nodes
  greetingsFirst?: Record<string, readonly Greeting[]>;         // npcId -> greetings checked before its own
  extraNodes?: Record<string, Record<string, DialogueNode>>;   // npcId -> nodes merged into its node map
  shopAdds?: Record<string, readonly string[]>;                // npcId -> extra stock
  allies?: readonly AllyDef[];
  books?: Record<string, BookDef>;
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
  /** Optional authored leash area (world metres); falls back to TUNING.leashRange around home. */
  leash?: LeashArea;
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
