// src/net/protocol.ts: Gnome Front's relay messages (the `d` of a matchmaking-server relay), and the event encoding.
// All positions are rounded with r2(). Ids are soldier ids (game.soldiers[i].id === i) and vehicle ids
// (game.vehicles[i].id === i). -1 means "none" wherever an id may be missing.
import type * as THREE from 'three';
import { CLASS_ORDER, type ClassId, type DamageCause, type GameEvent, type WeaponId } from '../config';
import { r2 } from './state';

/** Wire indexes for string ids. */
export const WEAPON_IDS: readonly WeaponId[] = ['acornRifle', 'seedSprayer', 'peaShooter', 'blunderbuss'];
export const CAUSES: readonly DamageCause[] = ['gun', 'grenade', 'roadkill', 'wreck'];
export const CLASS_IDS: readonly ClassId[] = CLASS_ORDER;

/** Host snapshot rate and guest 'me' rate (Hz). */
export const SNAP_HZ = 15;
export const ME_HZ = 15;

/**
 * One soldier in a snapshot, in game.soldiers order:
 * [x, y, z, yaw, pitch, hp, alive 0|1, vehicleId|-1, classIdx, kills, deaths, bits]
 * bits: 1 = sprinting, 2 = grounded, 4 = ads (aiming)
 */
export type SoldierSnap = [number, number, number, number, number, number, number, number, number, number, number, number];

/** One vehicle, in game.vehicles order: [x, z, yaw, speed, hp, alive 0|1, driverId|-1, team] */
export type VehicleSnap = [number, number, number, number, number, number, number, number];

/** One flag, in game.flags order: [progress, owner -1|0|1, contested 0|1] */
export type FlagSnap = [number, number, number];

/**
 * A game event on the wire. Tuples, first element is the kind:
 * ['shot', shooterId, weaponIdx, fromX, fromY, fromZ, toX, toY, toZ]
 * ['hit', shooterId|-1, victimId, damage, headshot 0|1]
 * ['vhit', shooterId|-1, vehicleId, damage]
 * ['kill', killerId|-1, victimId, causeIdx, weaponIdx|-1, headshot 0|1]
 * ['spawn', soldierId, x, y, z, yaw, classIdx, life]        life: see SoldierLife below
 * ['gren', throwerId, posX, posY, posZ, velX, velY, velZ]
 * ['vdead', vehicleId, byId|-1]
 * ['enter', soldierId, vehicleId]
 * ['exit', soldierId, vehicleId]
 * ['flag', flagIdx, team, captured 1 | lost 0]
 * ['over', winner]
 */
export type NetEvent =
  | ['shot', number, number, number, number, number, number, number, number]
  | ['hit', number, number, number, number]
  | ['vhit', number, number, number]
  | ['kill', number, number, number, number, number]
  | ['spawn', number, number, number, number, number, number, number]
  | ['gren', number, number, number, number, number, number, number]
  | ['vdead', number, number]
  | ['enter', number, number]
  | ['exit', number, number]
  | ['flag', number, number, number]
  | ['over', number];

/**
 * Host -> everyone, SNAP_HZ times a second.
 * hu: the human slots, [soldierId, playerId, name][] (see netState.humans).
 * ev: every encodable event emitted on the host since the previous snap, in order.
 */
export interface SnapMsg {
  k: 'snap';
  t: number;                    // game.time
  ms?: number;                  // the host's performance.now() when sent, for interpolation timing
  tk: [number, number];         // tickets
  over: 0 | 1;
  win: -1 | 0 | 1;              // game.winner, -1 = none
  hu: [number, number, string][];
  s: SoldierSnap[];
  v: VehicleSnap[];
  f: FlagSnap[];
  ev: NetEvent[];
}

/**
 * Guest -> host, ME_HZ times a second: the guest's own soldier.
 * life: the life number of the guest's last 'spawn' event (0 before the first). The host ignores 'me' whose life
 *   is not the soldier's current life, so positions from before a respawn never drag the new life back.
 * a: 1 if the guest thinks it is alive. The host ignores the position while a = 0.
 * p: [x, y, z, yaw, pitch, bits] (bits as in SoldierSnap)
 * cls: classIdx of the class picked for the next respawn (Soldier.nextClassId)
 * veh: the vehicle the guest drives, or -1. vp: that vehicle's [x, z, yaw, speed] (present when veh >= 0)
 * sh: shots fired since the last 'me', flattened: fromX, fromY, fromZ, toX, toY, toZ per pellet
 */
export interface MeMsg {
  k: 'me';
  life: number;
  a: 0 | 1;
  p: [number, number, number, number, number, number];
  cls: number;
  veh: number;
  vp?: [number, number, number, number];
  sh: number[];
  ms?: number;                  // the guest's performance.now() when sent, for interpolation timing
}

/** Guest -> host messages besides 'me'. The attacker / thrower / driver is always the sender's soldier. */
export type GuestOnlyMsg =
  | { k: 'dmg'; v: number; d: number; c: number; w: number; h: 0 | 1 } // victim soldierId, damage, causeIdx, weaponIdx|-1, headshot
  | { k: 'vdmg'; v: number; d: number }                               // vehicleId, damage
  | { k: 'enter'; v: number }                                         // vehicleId
  | { k: 'exit' }
  | { k: 'gren'; p: [number, number, number]; vel: [number, number, number] };

export type GuestMsg = MeMsg | GuestOnlyMsg;
export type HostMsg = SnapMsg;
export type FrontMsg = HostMsg | GuestMsg;

/** Bits for SoldierSnap[11] and MeMsg.p[5]. */
export const BIT_SPRINT = 1;
export const BIT_GROUNDED = 2;
export const BIT_ADS = 4;

function v3(v: THREE.Vector3): [number, number, number] {
  return [r2(v.x), r2(v.y), r2(v.z)];
}

/** Life numbers (netState.lives): host.ts passes `(id) => netState.lives.get(id) ?? 0` to encodeEvent. */
export type SoldierLife = number;

/** Encodes one game event for the wire, or null for events that are not sent (reload, jump, explosion, gameOver is 'over'). */
export function encodeEvent(e: GameEvent, life: (soldierId: number) => SoldierLife): NetEvent | null {
  switch (e.type) {
    case 'shot':
      return ['shot', e.shooter.id, WEAPON_IDS.indexOf(e.weapon), ...v3(e.from), ...v3(e.to)];
    case 'hit':
      return ['hit', e.shooter ? e.shooter.id : -1, e.victim.id, r2(e.damage), e.headshot ? 1 : 0];
    case 'vehicleHit':
      return ['vhit', e.shooter ? e.shooter.id : -1, e.vehicle.id, r2(e.damage)];
    case 'kill':
      return ['kill', e.killer ? e.killer.id : -1, e.victim.id, CAUSES.indexOf(e.cause), e.weapon ? WEAPON_IDS.indexOf(e.weapon) : -1, e.headshot ? 1 : 0];
    case 'spawn': {
      const s = e.soldier;
      return ['spawn', s.id, r2(s.pos.x), r2(s.pos.y), r2(s.pos.z), r2(s.yaw), CLASS_IDS.indexOf(s.classId), life(s.id)];
    }
    case 'grenadeThrown':
      return ['gren', e.thrower.id, ...v3(e.pos), ...v3(e.vel)];
    case 'vehicleDestroyed':
      return ['vdead', e.vehicle.id, e.by ? e.by.id : -1];
    case 'enterVehicle':
      return ['enter', e.soldier.id, e.vehicle.id];
    case 'exitVehicle':
      return ['exit', e.soldier.id, e.vehicle.id];
    case 'flagCaptured':
    case 'flagLost':
      return ['flag', FLAG_INDEX(e.flag.def.id), e.team, e.type === 'flagCaptured' ? 1 : 0];
    case 'gameOver':
      return ['over', e.winner];
    default:
      return null;
  }
}

function FLAG_INDEX(id: string): number {
  return 'ABCDE'.indexOf(id);
}
