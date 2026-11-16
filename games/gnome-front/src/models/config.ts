// src/models/config.ts: the subset of games/sample-3d/src/config.ts that the copied
// gnome.ts and mowerModels.ts need, so both files stay byte-for-byte copies of Lawn Gnome Panic's.
import type * as THREE from 'three';

export const COLORS = {
  gnomeHat: 0xd93636,
  gnomeShirt: 0x2f64c9,
  mowerDark: 0x222222,
  mowerGreen: 0x3fa34d,
  mowerYellow: 0xf2c230,
  mowerRed: 0xd8342c,
  reelWood: 0x9c6b3c,
  reelMetal: 0x8a9399,
  combineBody: 0x2e8b3a,
  combineAccent: 0xf2c230,
  combineGlass: 0x9fd8ff,
} as const;

/** Only moveSpeed is read (the gnome's run animation reference speed). */
export const TUNING = { moveSpeed: 5.5 } as const;

/** How a gnome looks. */
export interface GnomeLook {
  hat: number;
  shirt: number;
  pants: number;
  skin: number;
  boots: number;
  beard: number | null;
  hair: { color: number; style: 'pigtails' } | null;
  freckles: boolean;
  dress: boolean;
  glasses: boolean;
}

export type CharacterId = 'gnorman' | 'gnancy';

export const CHARACTERS: Record<CharacterId, { id: CharacterId; name: string; look: GnomeLook }> = {
  gnorman: {
    id: 'gnorman', name: 'GNORMAN',
    look: { hat: 0xd93636, shirt: 0x2f64c9, pants: 0x6b4a2e, skin: 0xf1c27d, boots: 0x222222, beard: 0xf4f4f4, hair: null, freckles: false, dress: false, glasses: false },
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

export interface GnomeModel {
  object: THREE.Group;
  update(p: PlayerState, dt: number): void;
  setDead(dead: boolean): void;
}

export type MowerTier = 'reel' | 'green' | 'yellow' | 'red' | 'combine';

export interface MowerModel {
  /** 0 = day (headlights off) .. 1 = night (headlights fully on). */
  setNight(night01: number): void;
  group: THREE.Group;           // built facing +z, base at y = 0
  setFlash(on: boolean): void;  // white hit flash
  animate(dt: number, speed: number): void; // wheels, reels, vibration
}
