// Combat rules: commands the player/AI issue, and the per-frame step. Pure, no Phaser.
// STUB: bodies below are placeholders; signatures are final.
import type { CombatState, ShipState, SystemId } from './types';

export function createCombat(player: ShipState, enemy: ShipState): CombatState {
  return { player, enemy, projectiles: [], jumpChargeMs: 0, elapsedMs: 0, nextId: 1, log: [], outcome: 'ongoing' };
}

/** Set a non-weapons system's allocated power. Returns true if it changed. */
export function setSystemPower(_ship: ShipState, _id: Exclude<SystemId, 'weapons'>, _power: number): boolean {
  return false;
}

/** Power or unpower weapon `index`. Returns true if it changed. */
export function toggleWeaponPower(_ship: ShipState, _index: number): boolean {
  return false;
}

/** Aim weapon `index` at a room on the opposing ship, or null to hold fire. */
export function setWeaponTarget(_ship: ShipState, _index: number, _roomId: number | null): void {}

/** Send a crew member walking to a room on their own ship. */
export function moveCrew(_ship: ShipState, _crewId: number, _roomId: number): void {}

/** Player escape-jump. Sets outcome 'fled' and returns true if the jump was ready. */
export function jumpAway(_state: CombatState): boolean {
  return false;
}

/** Advance the fight by dtMs. Mutates state and appends to state.log. Does nothing once outcome !== 'ongoing'. */
export function stepCombat(_state: CombatState, _dtMs: number, _rng: () => number = Math.random): void {}
