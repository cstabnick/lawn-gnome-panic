// Serializable simulation types for Gnome Souls.
import type { AttackId, EnemyKind } from './config';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type PlayerActionState =
  | 'idle'
  | 'roll'
  | 'attack'
  | 'guard'
  | 'flask'
  | 'stagger'
  | 'dead';

export type BufferedAction = 'roll' | 'r1' | 'r2' | 'flask' | null;

export interface PlayerEntity {
  id: number;
  name: string;
  character: string;
  color: number;
  userId?: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  facing: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  staminaDelay: number;
  flasks: number;
  flasksUsed: number;
  action: PlayerActionState;
  actionTimer: number;
  attackId: AttackId | null;
  hitIds: number[];
  rollDirX: number;
  rollDirZ: number;
  sprinting: boolean;
  guarding: boolean;
  buffered: BufferedAction;
  bufferTimer: number;
  respawnTimer: number;
  deaths: number;
  shrineRested: boolean;
}

export type EnemyState = 'idle' | 'chase' | 'windup' | 'active' | 'recovery' | 'stagger' | 'dead';

export interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  name: string;
  x: number;
  z: number;
  facing: number;
  hp: number;
  maxHp: number;
  poise: number;
  maxPoise: number;
  state: EnemyState;
  timer: number;
  targetId: number | null;
  didHit: boolean;
}

export type BossAttackId =
  | 'prowl'
  | 'whip_left'
  | 'whip_right'
  | 'nozzle_slam'
  | 'double_lash'
  | 'coil_burst'
  | 'phase_transition'
  | 'water_jet'
  | 'frenzy_combo'
  | 'stagger';

export interface BossTelegraph {
  kind: 'circle' | 'sweep' | 'beam';
  x: number;
  z: number;
  radius: number;
  angle: number;
  alpha: number;
}

export interface BossEntity {
  active: boolean;
  alive: boolean;
  hp: number;
  maxHp: number;
  poise: number;
  maxPoise: number;
  phase: 1 | 2;
  attack: BossAttackId;
  timer: number;
  cooldown: number;
  targetId: number | null;
  aimAngle: number;
  slamX: number;
  slamZ: number;
  didHitSubstep: number;
  segments: Vec3[];
  telegraph: BossTelegraph | null;
}

export interface PlayerActionInput {
  moveX: number;
  moveZ: number;
  sprint: boolean;
  guard: boolean;
  rollPressed: boolean;
  r1Pressed: boolean;
  r2Pressed: boolean;
  flaskPressed: boolean;
  interactPressed: boolean;
}

export const EMPTY_INPUT: PlayerActionInput = {
  moveX: 0,
  moveZ: 0,
  sprint: false,
  guard: false,
  rollPressed: false,
  r1Pressed: false,
  r2Pressed: false,
  flaskPressed: false,
  interactPressed: false,
};

export type SimEventKind =
  | 'swing'
  | 'hit_enemy'
  | 'hit_boss'
  | 'player_hit'
  | 'guard'
  | 'guard_break'
  | 'roll'
  | 'flask'
  | 'poise_break'
  | 'shrine_rest'
  | 'fog_gate'
  | 'boss_whip'
  | 'boss_slam'
  | 'boss_jet'
  | 'phase2'
  | 'player_death'
  | 'boss_death';

export interface SimEvent {
  kind: SimEventKind;
  x: number;
  y: number;
  z: number;
  playerId?: number;
  value?: number;
}

export interface WorldState {
  tick: number;
  time: number;
  fogOpen: boolean;
  bossStarted: boolean;
  victory: boolean;
  players: PlayerEntity[];
  enemies: EnemyEntity[];
  boss: BossEntity;
  events: SimEvent[];
}
