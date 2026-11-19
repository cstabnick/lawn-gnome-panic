// src/models/config.ts: golf's data for the gnome and mower models. The gnome model, its look type, its colours
// and its tuning come from @lawn/gnome (shared by every game); what is left here is golf's own.
import type * as THREE from 'three';
import { COLORS as GNOME_COLORS, GNORMAN_LOOK, TUNING as GNOME_TUNING, type GnomeLook, type GnomeModel } from '@lawn/gnome';
export type { GnomeLook, GnomeModel };

export const COLORS = {
  ...GNOME_COLORS,
  mowerGreen: 0x3fa34d,
  mowerYellow: 0xf2c230,
  mowerRed: 0xd8342c,
  reelWood: 0x9c6b3c,
  reelMetal: 0x8a9399,
  combineBody: 0x2e8b3a,
  combineAccent: 0xf2c230,
  combineGlass: 0x9fd8ff,
} as const;

export const TUNING = GNOME_TUNING;

export type CharacterId = 'gnorman' | 'gnancy';

export const CHARACTERS: Record<CharacterId, { id: CharacterId; name: string; look: GnomeLook }> = {
  gnorman: {
    id: 'gnorman', name: 'GNORMAN',
    look: GNORMAN_LOOK,
  },
  gnancy: {
    id: 'gnancy', name: 'GNANCY',
    look: { hat: 0x7e57c2, shirt: 0x2e8b57, pants: 0x5d4037, skin: 0xf8dcc8, boots: 0x6d4c41, beard: null, hair: { color: 0xe2571e, style: 'pigtails' }, freckles: true, dress: true, glasses: true },
  },
};

/** The pose a gnome model is animated from. */
export interface PlayerState {
  position: THREE.Vector3; // feet
  velocity: THREE.Vector3;
  facing: number;          // yaw; the model faces +z at yaw 0
  grounded: boolean;
  jumpsUsed: number;
  stamina: number;
  staminaDelay: number;
  sprinting: boolean;
  exhausted: boolean;
}

export type MowerTier = 'reel' | 'green' | 'yellow' | 'red' | 'combine';

export interface MowerModel {
  /** 0 = day (headlights off) .. 1 = night (headlights fully on). */
  setNight(night01: number): void;
  group: THREE.Group;           // built facing +z, base at y = 0
  setFlash(on: boolean): void;  // white hit flash
  animate(dt: number, speed: number): void; // wheels, reels, vibration
}
