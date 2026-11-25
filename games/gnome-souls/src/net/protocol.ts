// @lawn/mp wire messages for Gnome Souls co-op.
import type { BossAttackId, BossTelegraph, EnemyState, PlayerActionInput, PlayerActionState, Vec3 } from '../sim/types';
import type { AttackId, EnemyKind } from '../sim/config';

export interface PlayerSnap {
  id: number;
  name: string;
  character: string;
  color: number;
  userId?: string;
  x: number;
  z: number;
  facing: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  flasks: number;
  action: PlayerActionState;
  actionTimer: number;
  attackId: AttackId | null;
}

export interface EnemySnap {
  id: number;
  kind: EnemyKind;
  x: number;
  z: number;
  facing: number;
  hp: number;
  maxHp: number;
  state: EnemyState;
  timer: number;
}

export interface BossSnap {
  active: boolean;
  alive: boolean;
  hp: number;
  maxHp: number;
  phase: 1 | 2;
  attack: BossAttackId;
  timer: number;
  aimAngle: number;
  segments: Vec3[];
  telegraph: BossTelegraph | null;
}

export interface WorldSnapshotMsg {
  t: 'snap';
  tick: number;
  time: number;
  fogOpen: boolean;
  victory: boolean;
  players: PlayerSnap[];
  enemies: EnemySnap[];
  boss: BossSnap;
}

export interface GuestInputMsg {
  t: 'inp';
  inp: PlayerActionInput;
}

export type GameNetMsg = WorldSnapshotMsg | GuestInputMsg;
