// Job idles for townsgnomes with a role (batch 2): traffic, guards, vendors, mechanics, buskers. All loop. Axis notes in types.ts.
import type { AnimDef, RoleAnimId } from './types';

const TAU = Math.PI * 2;
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);
const cs = (t: number, d: number, k = 1): number => Math.cos((TAU * k * t) / d);

const row = (r: Omit<AnimDef<RoleAnimId>, 'category' | 'loop' | 'emote'>): AnimDef<RoleAnimId> => ({ category: 'role', loop: true, emote: true, ...r });

export const ROLE_ANIMS: readonly AnimDef<RoleAnimId>[] = [
  row({
    id: 'direct-traffic', label: 'Traffic Cop', icon: '🚦', duration: 2.0, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.57, 0, 1.0], armR: [-1.7 + 0.5 * sn(t, 2, 2), 0, -1.2], body: [0, 0.15 * sn(t, 2), 0] }),
  }),
  row({
    id: 'guard-stand', label: 'Guard', icon: '💂', duration: 4.0, prop: 'royal-spear', parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [0, 0, 0.05], armR: [-0.3, 0, -0.1], body: [-0.05 + 0.01 * sn(t, 4), 0, 0] }),
  }),
  row({
    id: 'vendor-call', label: 'Vendor', icon: '📣', duration: 2.0, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.3, 0, 0.7 + 0.3 * sn(t, 2)], armR: [-2.2, 0, 0.5], body: [0, 0.3 * sn(t, 2), 0] }),
  }),
  row({
    id: 'wrench-fix', label: 'Fix It', icon: '🔧', duration: 1.0, prop: 'brass-wrench', parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.2, 0, -0.2], armR: [-1.0 + 0.35 * sn(t, 1, 2), 0, 0], body: [0.45, 0, 0] }),
  }),
  row({
    id: 'stir-pot', label: 'Stir Pot', icon: '🍲', duration: 1.6, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-0.9, 0, -0.4], armR: [-1.1 + 0.2 * sn(t, 1.6), 0, -0.2 + 0.2 * cs(t, 1.6)], body: [0.15, 0, 0] }),
  }),
  row({
    id: 'paint-wall', label: 'Paint', icon: '🖌️', duration: 1.2, parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-1.9 + 0.5 * sn(t, 1.2), 0, -0.1], body: [0.05, 0, 0] }),
  }),
  row({
    id: 'juggle', label: 'Juggle', icon: '🤹', duration: 0.8, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.3 + 0.35 * sn(t, 0.8), 0, -0.1], armR: [-1.3 - 0.35 * sn(t, 0.8), 0, 0.1], body: [-0.08, 0, 0] }),
  }),
  row({
    id: 'busk-guitar', label: 'Busk', icon: '🎸', duration: 2.0, prop: 'guitar', parts: ['armL', 'armR', 'body', 'legR'],
    pose: (t) => ({
      armL: [-1.2, 0, 0.5], armR: [-0.9, 0, 0.25 * sn(t, 2, 4)], body: [0.05, 0, 0.03 * sn(t, 2)],
      legR: [-0.1 - 0.1 * cs(t, 2, 2), 0, 0],
    }),
  }),
  row({
    id: 'phone-call', label: 'Phone Call', icon: '📞', duration: 3.0, prop: 'tin-can-phone', parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.05 + 0.25 * sn(t, 3, 2), 0, 0.3], armR: [-2.5, 0, 0.65], body: [0, 0.2 * sn(t, 3), 0] }),
  }),
  row({
    id: 'take-notes', label: 'Take Notes', icon: '📝', duration: 2.0, prop: 'scribbled-note', parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.2, 0, -0.3 + 0.1 * sn(t, 2, 6)], armR: [-1.3, 0, 0.3], body: [0.15, 0, 0] }),
  }),
  row({
    id: 'torch-patrol', label: 'Torch', icon: '🔦', duration: 4.0, prop: 'torch', parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-1.8, 0, -0.1], body: [0, 0.5 * sn(t, 4), 0] }),
  }),
  row({
    id: 'measure', label: 'Measure', icon: '📏', duration: 3.0, prop: 'ruler-stick', parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.4, 0, -0.3], armR: [-1.4, 0, 0.3], body: [0.1, 0, 0.06 * sn(t, 3)] }),
  }),
];
