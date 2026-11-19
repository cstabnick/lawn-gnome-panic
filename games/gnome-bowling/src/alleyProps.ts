// Alley dressing built from @lawn/prefabs: ball returns, seating, scoring consoles, bar, shoe rental,
// vending machines, arcade cabinets and neon signs.
import * as THREE from 'three';
import { buildStaticPrefabs, type Swatch } from '@lawn/prefabs';
import { LOOK_COLORS } from './config';

export interface AlleyPlacement {
  id: string;
  x: number;
  y?: number;
  z: number;
  yaw?: number;
  scale?: number;
  tint?: Swatch | number;
  trim?: Swatch | number;
}

const PI = Math.PI;
const HALF_PI = Math.PI / 2;

export const ALLEY_PROPS: readonly AlleyPlacement[] = [
  // ---- Approach ball returns on the lane dividers ----
  { id: 'ball-return', x: -4.0, z: -2.2, yaw: PI },
  { id: 'ball-return', x: -2.4, z: -2.2, yaw: PI },
  { id: 'ball-return', x: -0.8, z: -2.2, yaw: PI },
  { id: 'ball-return', x: 0.8, z: -2.2, yaw: PI },
  { id: 'ball-return', x: 2.4, z: -2.2, yaw: PI },
  { id: 'ball-return', x: 4.0, z: -2.2, yaw: PI },

  // ---- Overhead scoreboards above the approach ----
  { id: 'overhead-scoreboard', x: -3.2, y: 3.2, z: -1.5, yaw: PI },
  { id: 'overhead-scoreboard', x: 0, y: 3.2, z: -1.5, yaw: PI },
  { id: 'overhead-scoreboard', x: 3.2, y: 3.2, z: -1.5, yaw: PI },

  // ---- Scoring consoles & retro benches behind the approach ----
  { id: 'scoring-console', x: -3.0, z: -5.4, yaw: PI },
  { id: 'scoring-console', x: -0.9, z: -5.4, yaw: PI },
  { id: 'scoring-console', x: 0.9, z: -5.4, yaw: PI },
  { id: 'scoring-console', x: 3.0, z: -5.4, yaw: PI },

  { id: 'bowling-bench', x: -4.2, z: -6.7, tint: 0xc8352f },
  { id: 'bowling-bench', x: -1.8, z: -6.7, tint: 0x3466b8 },
  { id: 'bowling-bench', x: 1.8, z: -6.7, tint: 0x3466b8 },
  { id: 'bowling-bench', x: 4.2, z: -6.7, tint: 0xc8352f },

  // ---- Cocktail tables & stools behind the benches ----
  { id: 'cocktail-table', x: -3.6, z: -8.1 },
  { id: 'stool', x: -4.2, z: -8.1 },
  { id: 'cocktail-table', x: -1.6, z: -8.1 },
  { id: 'stool', x: -1.0, z: -8.1 },
  { id: 'cocktail-table', x: 1.6, z: -8.1 },
  { id: 'stool', x: 1.0, z: -8.1 },
  { id: 'cocktail-table', x: 3.6, z: -8.1 },
  { id: 'stool', x: 4.2, z: -8.1 },

  // ---- Bar & lounge (back left) ----
  { id: 'bar-counter', x: -5.6, z: -10.3 },
  { id: 'bar-counter', x: -3.4, z: -10.3 },
  { id: 'bar-stool', x: -6.0, z: -9.3, tint: 0xc8352f },
  { id: 'bar-stool', x: -5.1, z: -9.3, tint: 0x3466b8 },
  { id: 'bar-stool', x: -3.9, z: -9.3, tint: 0xc8352f },
  { id: 'bar-stool', x: -3.0, z: -9.3, tint: 0x3466b8 },
  { id: 'cupboard', x: -5.8, z: -11.55, trim: 'wood-dark' },
  { id: 'barrel', x: -4.2, z: -11.55 },
  { id: 'barrel', x: -3.4, z: -11.55 },
  { id: 'rug', x: -4.5, y: 0.005, z: -9.0, scale: 1.5, tint: 0x4a2a6a },
  { id: 'neon-sign', x: -4.5, y: 2.2, z: -11.95, tint: LOOK_COLORS.neonPink, trim: LOOK_COLORS.neonCyan },

  // ---- Shoe rental desk & ball storage (back centre-right) ----
  { id: 'counter', x: 1.2, z: -10.2, tint: 0x3a2266, trim: 'wood-light' },
  { id: 'bowling-shoes', x: 0.85, y: 0.96, z: -10.15, tint: 'red', trim: 'blue' },
  { id: 'bowling-shoes', x: 1.55, y: 0.96, z: -10.15, tint: 'green', trim: 'yellow' },
  { id: 'shoe-rack', x: 0.4, z: -11.55 },
  { id: 'shoe-rack', x: 2.0, z: -11.55 },
  { id: 'ball-rack', x: -1.3, z: -11.4 },
  { id: 'ball-rack', x: 3.5, z: -11.4 },
  { id: 'neon-sign', x: 1.2, y: 2.2, z: -11.95, tint: LOOK_COLORS.neonCyan, trim: LOOK_COLORS.neonPink },

  // ---- Vending machines & arcade corner (back right & side walls) ----
  { id: 'vending-machine', x: 5.0, z: -11.4, tint: 0xc8352f },
  { id: 'vending-machine', x: 6.1, z: -11.4, tint: 0x3466b8 },
  { id: 'arcade-cabinet', x: 7.45, z: -9.5, yaw: -HALF_PI, tint: 0x3466b8, trim: LOOK_COLORS.neonPink },
  { id: 'arcade-cabinet', x: 7.45, z: -8.4, yaw: -HALF_PI, tint: 0x7d4bb0, trim: LOOK_COLORS.neonCyan },
  { id: 'arcade-cabinet', x: 7.45, z: -4.8, yaw: -HALF_PI, tint: 0xc8352f, trim: 0xffd54f },
  { id: 'arcade-cabinet', x: 7.45, z: -3.7, yaw: -HALF_PI, tint: 0x3466b8, trim: LOOK_COLORS.neonPink },

  // ---- Left wall dressing ----
  { id: 'vending-machine', x: -7.45, z: -7.2, yaw: HALF_PI, tint: 0x7d4bb0 },
  { id: 'ball-rack', x: -7.45, z: -5.4, yaw: HALF_PI },

  // ---- Corner plants & side wall neon ----
  { id: 'plant', x: -7.4, z: -11.4 },
  { id: 'plant', x: 7.4, z: -11.4 },
  { id: 'plant', x: -7.4, z: -2.8 },
  { id: 'plant', x: 7.4, z: -2.8 },
  { id: 'neon-sign', x: -7.95, y: 2.2, z: -6.0, yaw: HALF_PI, tint: LOOK_COLORS.neonPink, trim: LOOK_COLORS.neonCyan },
  { id: 'neon-sign', x: 7.95, y: 2.2, z: -6.0, yaw: -HALF_PI, tint: LOOK_COLORS.neonCyan, trim: LOOK_COLORS.neonPink },
];

/** Builds all alley furniture and props from @lawn/prefabs into `parent` as a single static batch. */
export function buildAlleyProps(parent: THREE.Object3D): void {
  parent.add(buildStaticPrefabs(ALLEY_PROPS, { name: 'alley-props' }));
}
