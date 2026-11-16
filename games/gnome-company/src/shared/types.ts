export type ZoneId = 'shed' | 'yard' | 'deku' | 'house';

export type GamePhase = 'lobby' | 'yard' | 'day_summary' | 'game_over';

export type EnemyKind =
  | 'earthworm'
  | 'mower'
  | 'squirrel'
  | 'spider'
  | 'cultist'
  | 'pillbug'
  | 'dog';

export type ItemCategory = 'loot' | 'tool';

export type LootKind =
  | 'golden_acorn'
  | 'deku_sap'
  | 'mushroom_chalice'
  | 'blighted_twig'
  | 'cursed_truffle'
  | 'toaster_666'
  | 'porcelain_cat'
  | 'necro_gnomeicon'
  | 'grandpa_dentures'
  | 'cursed_flamingo'
  | 'golden_remote'
  | 'gnome_biblia'
  | 'lawn_ornament';

export type ToolKind =
  | 'flashlight'
  | 'trowel'
  | 'tennis_ball'
  | 'airhorn'
  | 'holy_dew';

export type ItemKind = LootKind | ToolKind;

export interface WorldItem {
  id: string;
  kind: ItemKind;
  name: string;
  category: ItemCategory;
  value: number;
  cursed: boolean;
  zone: ZoneId;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  holderId: string | null;
  tithed: boolean;
  /** Used when dog is fetching a thrown ball/twig */
  thrownAt?: number;
}

export type EnemyStateName =
  | 'wander'
  | 'patrol'
  | 'burrow'
  | 'warning'
  | 'erupt'
  | 'rev'
  | 'charge'
  | 'scurry'
  | 'windup'
  | 'lurk'
  | 'chase'
  | 'stalk'
  | 'roll'
  | 'excited'
  | 'fetch'
  | 'return';

export interface EnemyEntity {
  id: string;
  kind: EnemyKind;
  zone: ZoneId;
  x: number;
  y: number;
  z: number;
  yaw: number;
  state: EnemyStateName;
  stateTimer: number;
  targetPlayerId: string | null;
  targetItemId: string | null;
  hp: number;
  stunTimer: number;
  homeX: number;
  homeZ: number;
  /** Extra visual/audio pulse counter */
  actionSeq: number;
}

export interface ProjectileEntity {
  id: string;
  kind: 'acorn';
  zone: ZoneId;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ttl: number;
}

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  zone: ZoneId;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  alive: boolean;
  hp: number;
  maxHp: number;
  stamina: number;
  crouching: boolean;
  heldItemId: string | null;
  flashlightOn: boolean;
  prayTimer: number;
  blessingTimer: number;
  damageFlash: number;
}

export interface SermonEvent {
  seq: number;
  text: string;
  tone: 'holy' | 'spooky' | 'angry' | 'silly';
}

export interface SoundEvent {
  seq: number;
  kind:
    | 'sermon'
    | 'tithe'
    | 'pickup'
    | 'bonk'
    | 'airhorn'
    | 'bark'
    | 'acorn_throw'
    | 'worm_erupt'
    | 'mower_rev'
    | 'spider_hiss'
    | 'cultist_chant'
    | 'hurt'
    | 'die'
    | 'bell'
    | 'pray'
    | 'portal';
  zone: ZoneId;
  x: number;
  y: number;
  z: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  color: string;
  isSystem?: boolean;
}

export interface WorldSnapshot {
  roomCode: string;
  phase: GamePhase;
  day: number; // 1..3 within current quota cycle
  cycle: number; // 1, 2, ...
  quotaTarget: number;
  quotaProgress: number;
  gnomeBucks: number;
  dayTime: number; // 0 (morning) -> 1 (midnight)
  hostId: string;
  players: Record<string, PlayerState>;
  items: Record<string, WorldItem>;
  enemies: Record<string, EnemyEntity>;
  projectiles: Record<string, ProjectileEntity>;
  sermon: SermonEvent;
  recentSounds: SoundEvent[];
  summaryText: string;
}

// ---------------- Network Messages ----------------

export interface PlayerInputPacket {
  zone: ZoneId;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  crouching: boolean;
  flashlightOn: boolean;
}

export type ClientMessage =
  | { type: 'create_room'; name: string; color: string }
  | { type: 'join_room'; code: string; name: string; color: string }
  | { type: 'quick_join'; name: string; color: string }
  | { type: 'input'; input: PlayerInputPacket }
  | { type: 'interact' }
  | { type: 'drop_item' }
  | { type: 'use_item'; dirX: number; dirY: number; dirZ: number }
  | { type: 'buy_tool'; kind: ToolKind }
  | { type: 'pray' }
  | { type: 'pull_lever' }
  | { type: 'chat'; text: string };

export type ServerMessage =
  | { type: 'joined'; playerId: string; roomCode: string; snapshot: WorldSnapshot }
  | { type: 'snapshot'; snapshot: WorldSnapshot }
  | { type: 'chat'; message: ChatMessage }
  | { type: 'error'; message: string };
