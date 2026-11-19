export type RoomKind = 'foyer' | 'parlor' | 'dining' | 'study' | 'pantry' | 'conservatory';

export interface RoomDef {
  id: number;
  kind: RoomKind;
  name: string;
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  wallH: number;
  floorTint: number;
  wallTint: number;
  hearthX?: number;
  hearthZ?: number;
}

export interface Doorway {
  id: string;
  x: number;
  z: number;
  axis: 'x' | 'z'; // 'z' means passage runs along Z (wall runs along X)
  width: number;
  roomA: number;
  roomB: number;
  blockedBy?: 'kiln_ward' | 'snare_bridge';
}

export interface FurniturePlacement {
  id: string;
  prefabId: string;
  roomId: number;
  x: number;
  z: number;
  rotY: number;
  scale: number;
  tint?: number;
  halfW: number;
  halfD: number;
  height: number;
  hideable: boolean;
  solid: boolean;
}

export type InteractableKind =
  | 'glaze_shard'
  | 'kiln_ward'
  | 'heavy_acorn'
  | 'snare_bridge'
  | 'soul_bell'
  | 'exit_door';

export interface Interactable {
  id: string;
  kind: InteractableKind;
  roomId: number;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  activated: boolean;
  label: string;
}

export type MonsterAlertState = 'patrol' | 'investigate' | 'chase';

export type MonsterKind = 'gardener' | 'watcher' | 'lamplighter' | 'crawler' | 'hush';

export interface MonsterState {
  id: number;
  kind: MonsterKind;
  name: string;
  x: number;
  z: number;
  yaw: number;
  state: MonsterAlertState;
  targetX: number;
  targetZ: number;
  waypointIdx: number;
  roomId: number;
  alert: number; // 0..1
  baseSpeed: number;
  speed: number;
  investigateTimer: number;
  cooldownTimer: number;
  brushTimer: number; // Hush only: seconds before it can brush past the same hiding gnome again
}

export type DirectorPhase = 'calm' | 'build' | 'peak' | 'relief';

export interface DirectorState {
  phase: DirectorPhase;
  tension: number; // 0..1
  dreamDrag: number; // 0..0.72 sluggishness multiplier during nightmare peaks
  phaseTimer: number;
  peakDuration: number;
  reliefCooldown: number;
  heartbeatRate: number;
  peakCount: number;
}

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  vx: number;
  vz: number;
  crouching: boolean;
  hiding: boolean;
  lanternOn: boolean; // the switch (F)
  lanternLit: boolean; // the flame itself: false while it gutters or sputters back on
  relightTimer: number; // seconds left before a gutted lantern catches again
  wickWear: number; // 0..1: grows with each gutter, dries out slowly while the lantern is off
  lanternGutters: number; // gutters this run
  stamina: number; // 0..1
  hp: number;
  maxHp: number;
  stepPhase: number;
  shards: number;
  shardsNeeded: number;
  hasAcorn: boolean;
  bellsRung: number;
  bellsNeeded: number;
  obstaclesCleared: number;
  escaped: boolean;
  caught: boolean;
  roomId: number;
  invulnTimer: number;
}

export interface ObstacleStatus {
  kilnCleared: boolean;
  bridgeCleared: boolean;
  bellsCleared: boolean;
}

export type SimEventKind =
  | 'shard_pickup'
  | 'kiln_shatter'
  | 'acorn_pickup'
  | 'snare_sprung'
  | 'snare_hurt'
  | 'bell_rung'
  | 'exit_unlocked'
  | 'escaped'
  | 'caught'
  | 'monster_alert'
  | 'phase_change'
  | 'hurt'
  | 'lantern_toggle'
  | 'lantern_gutter'
  | 'lantern_relit'
  | 'hush_brush';

export interface SimEvent {
  kind: SimEventKind;
  x: number;
  z: number;
  detail?: string;
}

export interface Waypoint {
  x: number;
  z: number;
  roomId: number;
}

export interface SimInput {
  moveForward: number; // -1..1
  moveRight: number; // -1..1
  yawDelta: number;
  pitchDelta: number;
  sprint: boolean;
  crouch: boolean;
  interact: boolean;
  toggleLantern: boolean;
}

export interface SimState {
  seed: number;
  time: number;
  rooms: RoomDef[];
  doorways: Doorway[];
  furniture: FurniturePlacement[];
  interactables: Interactable[];
  waypoints: Waypoint[];
  monsters: MonsterState[];
  director: DirectorState;
  rng: () => number; // seeded per house, so one seed gutters the lantern at the same moments every time
  player: PlayerState;
  obstacleStatus: ObstacleStatus;
  message: string;
  messageTimer: number;
  events: SimEvent[];
}
