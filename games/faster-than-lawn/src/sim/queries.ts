// Read-only helpers over ShipState / CombatState. Pure, no Phaser.
import { TUNING } from '../config';
import { WEAPONS } from './data';
import type { CombatState, Crew, ShipState, SystemId, SystemState, WeaponState } from './types';

/** Bars that actually work: allocated power, capped by undamaged bars. */
export function effectivePower(sys: SystemState): number {
  return Math.max(0, Math.min(sys.power, sys.level - sys.damage));
}

/** Reactor bars currently allocated across all systems. */
export function powerUsed(ship: ShipState): number {
  let total = 0;
  for (const s of Object.values(ship.systems)) total += s.power;
  return total;
}

export function freePower(ship: ShipState): number {
  return ship.reactor - powerUsed(ship);
}

/** Crew standing (not walking) in a room. */
export function crewInRoom(ship: ShipState, roomId: number): Crew[] {
  return ship.crew.filter((c) => c.roomId === roomId && c.moveMsLeft <= 0 && c.hp > 0);
}

export function roomIdOfSystem(ship: ShipState, id: SystemId): number {
  const room = ship.rooms.find((r) => r.system === id);
  return room ? room.id : -1;
}

/** A system is manned when at least one standing crew is in its room. */
export function isManned(ship: ShipState, id: SystemId): boolean {
  const roomId = roomIdOfSystem(ship, id);
  return roomId >= 0 && crewInRoom(ship, roomId).length > 0;
}

/** Max shield layers: one per 2 effective shield bars. */
export function shieldMax(ship: ShipState): number {
  return Math.floor(effectivePower(ship.systems.shields) / 2);
}

/** Chance (0..evasionMax) that an incoming shot misses this ship. Needs a manned, powered seat. */
export function evasion(ship: ShipState): number {
  if (!isManned(ship, 'pilot') || effectivePower(ship.systems.pilot) < 1) return 0;
  const engines = effectivePower(ship.systems.engines);
  if (engines < 1) return 0;
  let e = engines * TUNING.evasionPerEnginePower;
  if (isManned(ship, 'engines')) e += TUNING.evasionMannedBonus;
  return Math.min(TUNING.evasionMax, e);
}

/** Time this weapon needs to charge a full volley, including the manning bonus. */
export function weaponChargeTime(ship: ShipState, weapon: WeaponState): number {
  const base = WEAPONS[weapon.defId].chargeMs;
  return isManned(ship, 'weapons') ? base * TUNING.weaponMannedChargeMult : base;
}

/** Can the player escape-jump right now? */
export function jumpReady(state: CombatState): boolean {
  return state.jumpChargeMs >= TUNING.jumpChargeMs;
}

export function aliveCrew(ship: ShipState): Crew[] {
  return ship.crew.filter((c) => c.hp > 0);
}
