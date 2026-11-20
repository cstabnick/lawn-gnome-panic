// Damage stages for the mowers (Gnome Theft Auto uses them; any game can). Each is two stages, mildest first:
// 'dented' (scuffed paint, a bent handle or column, a scorch mark) and 'wrecked' (a wheel off, bonnet popped, smoking, slumped).
// Stages are cumulative and only touch parts that are named (or in a named group) in the base prefab.
// Rules for authoring them: docs/roadmaps/prefab-library/_common.md ("Damage stages").
import type { DamageStage, Part } from '../types';

const SMOKE = 0x77716b;
const SOOT = 0x1a1816;
const TYRE = 0x222222;

/** A rising grey smoke column of three puffs starting at (x, y, z). `s` scales it. */
const smoke = (x: number, y: number, z: number, s = 1): Part[] => [
  { s: 'ball', d: [0.09 * s], at: [x, y, z], c: SMOKE, alpha: 0.6, seg: 6 },
  { s: 'ball', d: [0.12 * s], at: [x + 0.03 * s, y + 0.16 * s, z - 0.02 * s], c: SMOKE, alpha: 0.45, seg: 6 },
  { s: 'ball', d: [0.15 * s], at: [x - 0.02 * s, y + 0.34 * s, z + 0.03 * s], c: SMOKE, alpha: 0.3, seg: 6 },
];
/** A flat scorch mark lying on a horizontal surface at height y. */
const scorch = (x: number, y: number, z: number, w: number, d: number): Part => ({ s: 'box', d: [w, 0.012, d], at: [x, y, z], c: SOOT });
/** A tyre that came off and lies flat on the ground. */
const fallenTyre = (x: number, z: number, r: number, w: number): Part => ({ s: 'cyl', d: [r, r, w], at: [x, w / 2, z], c: TYRE, seg: 12 });
/** A dark dented plate sitting just proud of a surface. */
const dent = (x: number, y: number, z: number, w: number, d: number, tilt: number): Part => ({
  s: 'box', d: [w, 0.03, d], at: [x, y, z], rot: [0, 0, tilt], c: 0x3b3b3b,
});

export const RIDE_ON_DAMAGE: readonly DamageStage[] = [
  {
    name: 'dented', darken: 0.25,
    morph: { 'wheel-2': { rot: [0, 0, 5] } },
    add: [dent(0.15, 0.64, 0.95, 0.5, 0.28, -9), scorch(-0.3, 0.452, 0.2, 0.4, 0.5)],
  },
  {
    name: 'wrecked', darken: 0.6, sink: 0.05,
    hide: ['wheel-1'],
    morph: {
      hood: { rot: [-16, 0, 0], at: [0, 0.1, -0.1] }, grille: { rot: [0, 0, 24] }, steer: { rot: [0, 0, 22] },
      'wheel-2': { rot: [0, 0, 6] },
    },
    add: [fallenTyre(1.15, -0.9, 0.275, 0.2), scorch(0.2, 0.452, -0.4, 0.5, 0.4), ...smoke(0.1, 0.85, 0.9, 1.2)],
  },
];

export const PUSH_BIKE_DAMAGE: readonly DamageStage[] = [
  {
    name: 'dented', darken: 0.25,
    morph: { handle: { rot: [0, 0, 7] } },
    add: [dent(0.1, 0.53, 0.02, 0.2, 0.15, -12), scorch(0.12, 0.262, 0.12, 0.2, 0.2)],
  },
  {
    name: 'wrecked', darken: 0.6, sink: 0.03,
    hide: ['wheel-3'],
    morph: {
      handle: { rot: [0, 0, 18], at: [0, -0.08, 0.05] }, blade: { rot: [0, 0, 9] }, 'wheel-0': { rot: [0, 0, 8] },
    },
    add: [fallenTyre(0.55, -0.5, 0.1, 0.06), ...smoke(0, 0.7, 0.05, 0.8)],
  },
];

export const ZERO_TURN_DAMAGE: readonly DamageStage[] = [
  {
    name: 'dented', darken: 0.25,
    morph: { steer: { rot: [0, 0, 9] } },
    add: [dent(0.05, 0.71, -0.85, 0.3, 0.2, -10), scorch(0.2, 0.502, 0.3, 0.35, 0.6)],
  },
  {
    name: 'wrecked', darken: 0.6, sink: 0.04,
    hide: ['wheel-2'],
    morph: { steer: { rot: [0, 0, 26] }, 'wheel-3': { rot: [0, 0, 8] }, 'wheel-0': { rot: [0, 0, 5] } },
    add: [fallenTyre(-0.8, 1.2, 0.14, 0.12), scorch(-0.2, 0.502, -0.2, 0.4, 0.5), ...smoke(0, 0.85, -0.85, 1.1)],
  },
];

export const COMBINE_DAMAGE: readonly DamageStage[] = [
  {
    name: 'dented', darken: 0.2,
    morph: { reel: { rot: [0, 0, 3] } },
    add: [
      { s: 'box', d: [0.5, 0.02, 0.012], at: [0, 1.5, 0.475], rot: [0, 0, 25], c: 'black' },
      { s: 'box', d: [0.5, 0.02, 0.012], at: [0, 1.5, 0.475], rot: [0, 0, -35], c: 'black' },
      { s: 'box', d: [0.02, 0.3, 0.012], at: [0.1, 1.5, 0.475], c: 'black' },
      { s: 'box', d: [0.02, 0.3, 0.6], at: [0.66, 0.8, -0.2], c: 0x2e3a2a },
    ],
  },
  {
    name: 'wrecked', darken: 0.55, sink: 0.06,
    hide: ['wheel-0'],
    morph: { reel: { at: [0, 0.03, 0.05], rot: [0, 0, 6] } },
    add: [fallenTyre(-1.3, 0.6, 0.45, 0.25), scorch(0, 1.206, -0.3, 1.0, 1.2), ...smoke(-0.4, 1.65, -0.8, 1.6)],
  },
];
