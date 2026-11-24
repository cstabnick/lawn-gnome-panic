// Sim jobs and tubing (docs/roadmaps/gta-sim-jobs-and-tubing.md): a fare hailing a cab at the kerb, a courier carrying
// a parcel, a rider sitting in a tow tube and cheering on one. Axis notes in types.ts.
import type { AnimDef, JobAnimId } from './types';

const TAU = Math.PI * 2;
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);

export const JOB_ANIMS: readonly AnimDef<JobAnimId>[] = [
  {
    id: 'hail-cab', label: 'Hail Cab', icon: '🙋', category: 'bit', emote: true, duration: 2, loop: true, parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-2.7 + 0.12 * sn(t, 2, 2), 0, -0.25], body: [0, 0.08 * sn(t, 2), -0.05] }),
  },
  {
    id: 'carry-parcel', label: 'Carry Box', icon: '📦', category: 'bit', emote: false, duration: 1, loop: true, parts: ['armL', 'armR'],
    onMove: true, prop: 'parcel-box',
    pose: () => ({ armL: [-1.3, 0, -0.3], armR: [-1.3, 0, 0.3] }),
  },
  {
    id: 'tube-ride', label: 'Tube Ride', icon: '🛟', category: 'ride', emote: false, duration: 2, loop: true,
    parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => ({
      armL: [-0.4, 0, 0.7], armR: [-0.4, 0, -0.7], legL: [-1.4, 0, 0.2], legR: [-1.4, 0, -0.2],
      body: [-0.35 + 0.05 * sn(t, 2), 0, 0.06 * sn(t, 2, 1, 1)], lift: -0.22,
    }),
  },
  {
    id: 'tube-cheer', label: 'Tube Cheer', icon: '🙌', category: 'ride', emote: false, duration: 1.2, loop: true,
    parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => ({
      armL: [-2.8 + 0.2 * sn(t, 1.2, 2), 0, 0.4], armR: [-2.8 - 0.2 * sn(t, 1.2, 2), 0, -0.4],
      legL: [-1.4, 0, 0.2], legR: [-1.4, 0, -0.2], body: [-0.3, 0, 0], lift: -0.22,
    }),
  },
];
