// Pay 'n' Glaze mounts for Gnome Theft Auto's ground vehicles: where lamps, spoilers, decals and the steering grips go on each prefab,
// and the steering variants that bring the wheel within a seated gnome's reach. Hand-tuned data, nothing else.
// Numbers come from a probe of each built prefab (Box3 and pivot positions, prefab-local, before root scale).
// Ride height: every prefab uses the derived range (slam = 0.2 of the stock wheel radius, lift = RIDE_TRAVEL.up); add `ride: { down, up }`
// (prefab units) to a defineMounts entry below to give one model its own slider limits.
// Grip reach: a seated gnome's shoulder is at seat + (+-0.27, 0.62, 0) in root space; both grips must sit within 0.45 of it.
import { defineMounts, registerSteerVariant } from '@lawn/glaze';
import type { Vec3 } from '@lawn/prefabs';

/** Steering grips (left +x, right -x), prefab-local at steer 0. driveGrips.ts reads them too, so the hands and the markers agree. */
export const PUSH_BIKE_GRIPS: readonly [Vec3, Vec3] = [[0.25, 0.625, -0.25], [-0.25, 0.625, -0.25]];
export const RIDE_ON_GRIPS: readonly [Vec3, Vec3] = [[0.2, 0.56, -0.147], [-0.2, 0.56, -0.147]];
/** The lap bars run from z -0.28 to 0.08: the grips sit on their rear halves, 0.3 from a seated shoulder, so full lock stays in reach. */
export const ZERO_TURN_GRIPS: readonly [Vec3, Vec3] = [[0.32, 0.6, -0.2], [-0.32, 0.6, -0.2]];

let registered = false;

/** defineMounts + registerSteerVariant for every prefab a ground VEHICLES entry uses. Idempotent (a second call does nothing). */
export function registerGlazeMounts(): void {
  if (registered) return;
  registered = true;

  // Push-mower bike: the U-handle's arms are brought back to the rider's hands. Pivot 'handle' moves to (0, 0.275, -0.4) prefab-local.
  registerSteerVariant('push-mower-bike', { pivot: 'handle', dropParts: [], wheelAt: [0, 0.275, -0.4] });
  defineMounts('push-mower-bike', {
    width: 0.9,
    length: 1.0,
    height: 1.02,
    points: {
      hood: [0, 0.53, 0],
      front: [0, 0.26, 0.45],
      rear: [0, 0.26, -0.45],
      seat: [0, 0.285, -0.375],
      dash: [0, 0.4, 0.15],
      top: [0, 0.56, -0.1],
      side: [0.45, 0.2, 0],
    },
    // No flat front face: the round deck's rim, 0.26 x width out from the centre line.
    lamps: [[0.234, 0.2, 0.384], [-0.234, 0.2, 0.384]],
    steer: {
      pivot: 'handle',
      grips: PUSH_BIKE_GRIPS,
    },
    panels: [
      { id: 'left', at: [0.454, 0.2, 0], size: [0.5, 0.14], rot: [0, 90, 0] },
      { id: 'right', at: [-0.454, 0.2, 0], size: [0.5, 0.14], rot: [0, -90, 0] },
      { id: 'hood', at: [0, 0.529, 0], size: [0.3, 0.25], rot: [-90, 0, 0] },
      { id: 'rear', at: [0, 0.2, -0.454], size: [0.4, 0.14], rot: [0, 180, 0] },
    ],
  });

  // Ride-on mower (and the lowrider, which shares it): the stock wheel is high and ahead. The wheel lies flat in the gnome's lap
  // at seat + (0, 0.42, 0.30) root space, prefab-local /1.5; its column runs down from the deck. Dropped part 6 is the stock column.
  registerSteerVariant('ride-on-mower', {
    dropParts: [6],
    wheelAt: [0, 0.56, -0.147],
    columnBase: [0, 0.45, -0.05],
  });
  defineMounts('ride-on-mower', {
    width: 1.2,
    length: 2.05,
    height: 1.156,
    points: {
      hood: [0, 0.625, 0.95],
      front: [0, 0.45, 1.2],
      rear: [0, 0.45, -0.85],
      seat: [0, 0.48, -0.3467],
      dash: [0, 0.5, 0.2],
      top: [0, 0.975, -0.62],
      side: [0.6, 0.45, 0.2],
    },
    lamps: [[0.312, 0.52, 1.2], [-0.312, 0.52, 1.2]],
    steer: {
      pivot: 'steer',
      grips: RIDE_ON_GRIPS,
    },
    panels: [
      { id: 'left', at: [0.604, 0.35, 0], size: [1.6, 0.2], rot: [0, 90, 0] },
      { id: 'right', at: [-0.604, 0.35, 0], size: [1.6, 0.2], rot: [0, -90, 0] },
      { id: 'hood', at: [0, 0.629, 0.95], size: [1.0, 0.5], rot: [-90, 0, 0] },
      { id: 'rear', at: [0, 0.35, -0.854], size: [1.2, 0.2], rot: [0, 180, 0] },
    ],
  });

  // Zero-turn racer: two lap bars. The grips are on their rear halves: the front ends (z 0.08) sit 0.63 from a seated shoulder, out of reach.
  defineMounts('zero-turn-mower', {
    width: 0.9,
    length: 1.95,
    height: 1.1,
    points: {
      hood: [0, 0.5, 0.5],
      front: [0, 0.42, 0.95],
      rear: [0, 0.5, -1.0],
      seat: [0, 0.5, -0.3],
      dash: [0, 0.5, 0.1],
      top: [0, 1.1, -0.6],
      side: [0.45, 0.42, 0.15],
    },
    lamps: [[0.234, 0.44, 0.95], [-0.234, 0.44, 0.95]],
    steer: {
      pivot: 'steer',
      grips: ZERO_TURN_GRIPS,
    },
    panels: [
      { id: 'left', at: [0.454, 0.42, 0.15], size: [1.5, 0.16], rot: [0, 90, 0] },
      { id: 'right', at: [-0.454, 0.42, 0.15], size: [1.5, 0.16], rot: [0, -90, 0] },
      { id: 'hood', at: [0, 0.504, 0.45], size: [0.8, 0.9], rot: [-90, 0, 0] },
      { id: 'rear', at: [0, 0.55, -1.004], size: [0.5, 0.3], rot: [0, 180, 0] },
    ],
  });

  // Combine harvester: the driver sits in the glass cab, and the prefab has no steer pivot, so there is nothing to grip.
  defineMounts('combine-harvester', {
    width: 1.3,
    length: 2.6,
    height: 1.75,
    points: {
      hood: [0, 1.2, -0.3],
      front: [0, 0.6, 1.25],
      rear: [0, 0.75, -1.15],
      seat: [0, 1.2, 0.15],
      dash: [0, 1.4, 0.4],
      top: [0, 1.725, 0.15],
      side: [0.65, 0.75, -0.3],
    },
    lamps: [[0.338, 0.79, 0.55], [-0.338, 0.79, 0.55]],
    steer: null,
    panels: [
      { id: 'left', at: [0.654, 0.75, -0.3], size: [1.7, 0.9], rot: [0, 90, 0] },
      { id: 'right', at: [-0.654, 0.75, -0.3], size: [1.7, 0.9], rot: [0, -90, 0] },
      { id: 'hood', at: [0, 1.204, -0.65], size: [1.3, 1.0], rot: [-90, 0, 0] },
      { id: 'rear', at: [0, 0.75, -1.154], size: [1.3, 0.9], rot: [0, 180, 0] },
    ],
  });

  // Boot parade float: the open tractor seat is at the front. The prefab's wheel is not in a 'steer' group, so it cannot turn: no steer.
  defineMounts('boot-parade-float', {
    width: 0.975,
    length: 2.3,
    height: 2.225,
    points: {
      hood: [0, 0.875, -0.4],
      front: [0, 0.31, 1.17],
      rear: [0, 0.31, -1.125],
      seat: [0, 0.475, 0.825],
      dash: [0, 0.55, 1.0],
      top: [0, 2.225, -1.2],
      side: [0.4875, 0.31, -0.2],
    },
    // The flatbed front is the only front face at mid-height; the boot's toe sits above the lamp line.
    lamps: [[0.2535, 0.31, 1.17], [-0.2535, 0.31, 1.17]],
    steer: null,
    panels: [
      { id: 'left', at: [0.4915, 0.31, -0.1], size: [2.2, 0.3], rot: [0, 90, 0] },
      { id: 'right', at: [-0.4915, 0.31, -0.1], size: [2.2, 0.3], rot: [0, -90, 0] },
      { id: 'hood', at: [0, 0.879, -0.4], size: [0.6, 0.9], rot: [-90, 0, 0] },
      { id: 'rear', at: [0, 0.31, -1.1665], size: [0.975, 0.3], rot: [0, 180, 0] },
    ],
  });

  // Snail-coach: a closed bus, so no seat or dash point (the driver is inside the box). Its wheel is not a steer pivot: no steer.
  defineMounts('snail-coach', {
    width: 1.12,
    length: 2.5,
    height: 1.24,
    points: {
      hood: [0, 1.28, 0.3],
      front: [0, 0.56, 1.25],
      rear: [0, 0.56, -1.25],
      top: [0, 1.28, -0.5],
      side: [0.56, 0.56, -0.12],
    },
    lamps: [[0.291, 0.56, 1.24], [-0.291, 0.56, 1.24]],
    steer: null,
    panels: [
      { id: 'left', at: [0.61, 0.56, -0.12], size: [2.2, 0.45], rot: [0, 90, 0] },
      { id: 'right', at: [-0.61, 0.56, -0.12], size: [2.2, 0.45], rot: [0, -90, 0] },
      { id: 'hood', at: [0, 1.284, 0.3], size: [0.9, 2.0], rot: [-90, 0, 0] },
      { id: 'rear', at: [0, 0.56, -1.254], size: [1.0, 0.5], rot: [0, 180, 0] },
    ],
  });

  // Mulch-spreader mower: its steering ring is not in a 'steer' group (and there is no steer pivot), so it cannot turn: no steer.
  defineMounts('mulch-spreader-mower', {
    width: 0.88,
    length: 1.6,
    height: 1.12,
    points: {
      hood: [0, 0.715, 0.58],
      front: [0, 0.54, 0.88],
      rear: [0, 0.5, -0.84],
      seat: [0, 0.56, 0.05],
      dash: [0, 0.62, 0.3],
      top: [0, 1.12, -0.58],
      side: [0.44, 0.45, 0.05],
    },
    lamps: [[0.229, 0.5, 0.88], [-0.229, 0.5, 0.88]],
    steer: null,
    panels: [
      { id: 'left', at: [0.444, 0.45, 0], size: [1.2, 0.3], rot: [0, 90, 0] },
      { id: 'right', at: [-0.444, 0.45, 0], size: [1.2, 0.3], rot: [0, -90, 0] },
      { id: 'hood', at: [0, 0.719, 0.58], size: [0.7, 0.6], rot: [-90, 0, 0] },
      { id: 'rear', at: [0, 0.6, -0.796], size: [0.3, 0.3], rot: [0, 180, 0] },
    ],
  });

  // HOA van: a closed cab, so no seat or dash point. No steer pivot in the prefab: no steer.
  defineMounts('hoa-van', {
    width: 1.16,
    length: 2.26,
    height: 1.33,
    points: {
      hood: [0, 1.104, 0.6],
      front: [0, 0.54, 1.07],
      rear: [0, 0.7, -1.1],
      top: [0, 1.185, 0.45],
      side: [0.58, 0.55, -0.32],
    },
    lamps: [[0.302, 0.54, 1.075], [-0.302, 0.54, 1.075]],
    steer: null,
    panels: [
      { id: 'left', at: [0.584, 0.7, -0.3], size: [1.5, 0.5], rot: [0, 90, 0] },
      { id: 'right', at: [-0.584, 0.7, -0.3], size: [1.5, 0.5], rot: [0, -90, 0] },
      { id: 'hood', at: [0, 1.104, 0.6], size: [0.9, 0.42], rot: [-90, 0, 0] },
      { id: 'rear', at: [0, 0.7, -1.104], size: [1.0, 0.6], rot: [0, 180, 0] },
    ],
  });
}
