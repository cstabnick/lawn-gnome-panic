// Remote boats settle on the local waves. A boat whose pose comes from another player (remotes.ts) has no hull step
// here, so its pitch and roll are eased toward the wave attitude at its spot, sampled from the same field the water uses.
import { waveAttitude, waveTime } from './waves';
import type { Vehicle } from './types';

const scratch = { heave: 0, pitch: 0, roll: 0 };

/** Eases a boat's pitch / roll toward the wave attitude at its position. No-op for a vehicle that is not a boat. */
export function settleOnWaves(v: Vehicle, dt: number): void {
  const b = v.boat;
  if (!b) return;
  waveAttitude(v.x, v.z, v.yaw, v.spec.radius * 0.8, v.spec.radius * 0.4, waveTime(), scratch);
  const k = 1 - Math.exp(-4 * dt);
  b.pitch += (scratch.pitch - b.pitch) * k;
  b.roll += (scratch.roll - b.roll) * k;
}
