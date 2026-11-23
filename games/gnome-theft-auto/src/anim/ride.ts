// Seated riding poses (batch 2): helicopter and plane passengers, rowing and paddling, the golf cart. All loop; the
// vehicle seat places the gnome, so no lift. Legs sit at -1.57 like model.update's own sitting pose. Axis notes in types.ts.
import type { AnimDef, RideAnimId, Vec3 } from './types';

const TAU = Math.PI * 2;
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);
const SIT: Vec3 = [-1.57, 0, 0];

const row = (r: Omit<AnimDef<RideAnimId>, 'category' | 'loop' | 'emote' | 'parts'>): AnimDef<RideAnimId> => ({
  category: 'ride', loop: true, emote: true, parts: ['armL', 'armR', 'legL', 'legR', 'body'], ...r,
});

export const RIDE_ANIMS: readonly AnimDef<RideAnimId>[] = [
  row({
    id: 'heli-passenger', label: 'Heli Seat', icon: '🚁', duration: 3.0,
    pose: (t) => ({ armL: [-0.9, 0, 0.1], armR: [-0.9, 0, -0.1], legL: SIT, legR: SIT, body: [0.05, 0, 0.02 * sn(t, 3, 6)] }),
  }),
  row({
    id: 'plane-passenger', label: 'Plane Seat', icon: '✈️', duration: 4.0,
    pose: (t) => ({ armL: [-0.5, 0, 0.35], armR: [-0.5, 0, -0.35], legL: SIT, legR: SIT, body: [-0.15, 0, 0.03 * sn(t, 4)] }),
  }),
  row({
    id: 'hang-out-door', label: 'Hang Out', icon: '🪂', duration: 2.0,
    pose: (t) => ({
      armL: [-2.8, 0, 0.3], armR: [-1.0, 0, -1.2 + 0.1 * sn(t, 2, 4)],
      legL: [-1.57 + 0.2 * sn(t, 2), 0, 0], legR: [-1.57 - 0.2 * sn(t, 2), 0, 0], body: [0, 0, -0.35],
    }),
  }),
  row({
    id: 'boat-row', label: 'Row', icon: '🚣', duration: 2.0,
    pose: (t) => {
      const s = sn(t, 2);
      return {
        armL: [-1.1 - 0.7 * s, 0, 0.3], armR: [-1.1 - 0.7 * s, 0, -0.3],
        legL: [-1.46 + 0.11 * s, 0, 0], legR: [-1.46 + 0.11 * s, 0, 0], body: [0.05 + 0.3 * s, 0, 0],
      };
    },
  }),
  row({
    id: 'boat-paddle', label: 'Paddle', icon: '🛶', duration: 1.6,
    pose: (t) => {
      const side = sn(t, 1.6);
      const x = -0.85 - 0.35 * Math.abs(side);
      return { armL: [x, 0, 0.5 * side], armR: [x, 0, 0.5 * side], legL: SIT, legR: SIT, body: [0.1, 0.3 * side, 0] };
    },
  }),
  row({
    id: 'boat-lookout', label: 'Lookout', icon: '🔭', duration: 4.0,
    pose: (t) => ({ armL: [-0.6, 0, 0.4], armR: [-2.3, 0, 0.6], legL: SIT, legR: SIT, body: [0.1, 0.4 * sn(t, 4), 0] }),
  }),
  row({
    id: 'golf-cart-drive', label: 'Cart Driver', icon: '🛺', duration: 3.0,
    pose: (t) => {
      const steer = sn(t, 3);
      return {
        armL: [-1.2, 0.2 * steer, -0.25], armR: [-1.2, 0.2 * steer, 0.25],
        legL: SIT, legR: [-1.4, 0, 0], body: [0, 0, 0.05 * steer],
      };
    },
  }),
  row({
    id: 'golf-cart-passenger', label: 'Cart Rider', icon: '⛳', duration: 3.0,
    pose: (t) => ({ armL: [0.4, 0, 0.8], armR: [-0.9, 0, -0.1], legL: SIT, legR: SIT, body: [0.03 * sn(t, 3, 2), 0.2, 0] }),
  }),
  row({
    id: 'hold-on', label: 'Hold On', icon: '😬', duration: 0.6,
    pose: (t) => ({ armL: [-1.5, 0, -0.2], armR: [-1.5, 0, 0.2], legL: SIT, legR: SIT, body: [0.3, 0, 0.04 * sn(t, 0.6, 2)] }),
  }),
  row({
    id: 'seasick', label: 'Seasick', icon: '🤢', duration: 3.0,
    pose: (t) => ({ armL: [-0.8, 0, -0.5], armR: [-1.0, 0, -0.6], legL: SIT, legR: SIT, body: [0.45 + 0.08 * sn(t, 3), 0, -0.25 + 0.08 * sn(t, 3, 1, 1)] }),
  }),
  row({
    id: 'wave-from-seat', label: 'Seat Wave', icon: '👋', duration: 1.6,
    pose: (t) => ({ armL: [-0.9, 0, 0.1], armR: [-2.6, 0, -0.3 + 0.35 * sn(t, 1.6, 2)], legL: SIT, legR: SIT, body: [0, 0.15, 0] }),
  }),
  row({
    id: 'sleep-seated', label: 'Doze', icon: '💤', duration: 4.0,
    pose: (t) => ({ armL: [-0.7, 0, 0.15], armR: [-0.7, 0, -0.15], legL: SIT, legR: SIT, body: [0.25 + 0.05 * sn(t, 4), 0, 0.12] }),
  }),
];
