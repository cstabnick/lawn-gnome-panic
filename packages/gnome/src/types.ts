// Shared types of @lawn/gnome. Two looks exist on purpose:
//  - `Look`: the stored and transmitted look, shaped like the JSON of the planned platform service's
//    `gnome.user.v1.GnomeLook` (docs/design/gnome-platform.md, PR 38; fields are camelCase because that is
//    protobuf's JSON mapping). Colours are always palette colours (see look.ts) so a look fits in a short code.
//  - `GnomeLook`: what the 3D model is built from (model.ts). Every game already uses this shape.
import type * as THREE from 'three';

// ------------------------------------------------------------------ stored look and profile

/** A gnome's colours and features. All colours are 0xRRGGBB. Optional fields are absent for "none". */
export interface Look {
  hatRgb: number;
  /** The shirt (a dress skirt, too). Named like the planned service. */
  coatRgb: number;
  pantsRgb: number;
  bootsRgb: number;
  skinRgb: number;
  /** Beard colour; absent = no beard. */
  beardRgb?: number;
  /** Pigtail hair colour; absent = no hair showing under the hat. */
  hairRgb?: number;
  freckles: boolean;
  dress: boolean;
  glasses: boolean;
}

/**
 * The player's gnome: the JSON of the planned service's `gnome.user.v1.Gnome` (same field names).
 * `look` is absent until the player saves a look in the Gnome Creator; games keep their own gnome until then.
 */
export interface Gnome {
  /** Opaque and stable. Local profiles use `local-<random>`; the real service will assign its own. */
  userId: string;
  displayName: string;
  look?: Look;
  /** RFC 3339, like protobuf's JSON for Timestamp. */
  createdAt: string;
}

/**
 * The seam between the games and wherever the gnome lives. Today: localStorage (store.ts). Later: a Connect client
 * of the platform service's UserService, written to this same interface. Everything is async so that swap needs no
 * change in any caller. Method names follow the service's RPCs.
 */
export interface GnomeStore {
  /** GetMe (and CreateGuest on first use): the caller's gnome. Creates it when none exists yet. */
  getMe(): Promise<Gnome>;
  /** UpdateGnome. Rejects with GnomeStoreError('INVALID_ARGUMENT') when displayName fails checkName(). Returns the new gnome. */
  updateGnome(patch: { displayName?: string; look?: Look }): Promise<Gnome>;
  /** BatchGetGnomes. Unknown ids are left out. The local store knows only the caller's own gnome. */
  batchGetGnomes(userIds: string[]): Promise<Gnome[]>;
}

export class GnomeStoreError extends Error {
  readonly code: 'INVALID_ARGUMENT' | 'UNAVAILABLE';
  constructor(code: 'INVALID_ARGUMENT' | 'UNAVAILABLE', message: string) {
    super(message);
    this.name = 'GnomeStoreError';
    this.code = code;
  }
}

// ------------------------------------------------------------------ what games use

/** The player's own gnome, ready for a game. */
export interface MyGnome {
  name: string;
  /** Model look of the palette-snapped look, so it matches exactly what other players see. */
  look: GnomeLook;
  /** The look code (`g1.…`, 11 characters) to send as the `character` of the matchmaking hello/queue. */
  code: string;
}

/** Another player as the matchmaking server describes them (the fields of PlayerInfo that matter here). */
export interface PlayerRef {
  id: number;
  /** PlayerInfo.character: a look code (`g1.…`) or the game's own look id. */
  character: string;
  /** Reserved for the platform service: when set, looks come from BatchGetGnomes. Not sent by anything yet. */
  userId?: string;
}

// ------------------------------------------------------------------ the gnome model (moved from the games)

export const COLORS = {
  gnomeHat: 0xd93636,
  gnomeShirt: 0x2f64c9,
  mowerDark: 0x222222,
} as const;

/** Only moveSpeed is read (the gnome's run animation reference speed). */
export const TUNING = { moveSpeed: 5.5 } as const;

/** How a gnome model looks. The games' CHARACTERS and bots are all built from one of these. */
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
  /** Bowl-cut hair colour (bowling), or null/absent for none. Use it instead of `hair`. */
  bowlCut?: number | null;
}

export const GNORMAN_LOOK: GnomeLook = {
  hat: 0xd93636, shirt: 0x2f64c9, pants: 0x6b4a2e, skin: 0xf1c27d, boots: 0x222222, beard: 0xf4f4f4,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};

/** The pose a gnome model is animated from. */
export interface PlayerState {
  position: THREE.Vector3; // feet
  velocity: THREE.Vector3;
  facing: number;          // yaw; the model faces +z at yaw 0
  grounded: boolean;
  jumpsUsed: number;
  // The model never reads these; games that track stamina have them, others (gnaft) do not.
  stamina?: number;
  staminaDelay?: number;
  sprinting?: boolean;
  exhausted?: boolean;
}

export interface GnomeModel {
  object: THREE.Group;
  /** Arm pivots at the shoulders (rotation.x swings the arm forward/back; 0 = hanging down). */
  arms: { left: THREE.Group; right: THREE.Group };
  /** The body rig under object (twist it with rotation.y for a backswing). */
  rig: THREE.Group;
  update(p: PlayerState, dt: number): void;
  setDead(dead: boolean): void;
}
