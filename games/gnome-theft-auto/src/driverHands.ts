// Driver hands: a seated gnome's arms reach the steering grips of the vehicle (and turn with the wheel) instead of resting on the lap.
// STUB: the driver-hands issue fills it. Called by player.ts (the player), traffic.ts (NPC riders) and remotes.ts (online drivers), each AFTER that gnome model's own update().
import type { GnomeModel } from '@lawn/gnome';
import type { Vehicle } from './types';

/**
 * Point `model`'s arms at `v.rig.grips` when the vehicle has them and the gnome is the DRIVER (seat 0): reachArm both hands, ease between reaching and resting so entering and leaving does not snap,
 * and leave the arms to the model otherwise (passengers, vehicles without grips, wrecks). Safe to call every frame for any vehicle. `dt` (seconds) paces the ease in and out.
 */
export function poseHands(_model: GnomeModel, _v: Vehicle, _seat = 0, _dt = 1 / 60): void {
  /* stub */
}

/** Forget a gnome's hand blend and put both arm scales back to 1 (it left the vehicle, was yanked out, or respawned). STUB: filled by the driver-hands issue. */
export function clearHands(_model: GnomeModel): void {
  /* stub */
}
