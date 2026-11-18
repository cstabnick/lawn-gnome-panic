// Tuning and shared constants for Giant Pup. Tweak numbers here, not in gameplay code.

/** The yard is a square lawn from -YARD_HALF to +YARD_HALF on x and z (y up, ground at y = 0). */
export const YARD_HALF = 16;

/** Where things stand in the yard (x, z). The camera looks at the dog from the +z side. */
export const GNOME_POS = { x: 0, z: 7 } as const;
export const FOOD_BOWL_POS = { x: -5, z: 2 } as const;
export const WATER_BOWL_POS = { x: 5, z: 2 } as const;
export const DOGHOUSE_POS = { x: 0, z: -9 } as const;

/** Whole-dog scale applied to the dog rig root (the Gnome Company dog is ~2.6 units tall; a gnome is ~1.4). */
export const DOG_SCALE = 1.35;
/** Dog body radius for keeping it off the gnome and inside the fence. */
export const DOG_RADIUS = 1.8;
export const DOG_WALK_SPEED = 3.2;
export const DOG_RUN_SPEED = 8.5;
export const DOG_TURN_RATE = 5; // rad/s

/** Need levels are 0..100. Units lost per real minute while the game is open. */
export const DECAY_PER_MIN = {
  hunger: 2.2,
  thirst: 3.0,
  fun: 2.6,
  clean: 0.9,
  energy: 1.2,
};
/** While away, needs fall at this fraction of the open rate, and never below AWAY_FLOOR. The dog never dies. */
export const AWAY_RATE = 0.15;
export const AWAY_FLOOR = 15;

export const FEED_AMOUNT = 45;
export const WATER_AMOUNT = 50;
export const PET_PER_PIXEL = 0.035; // fun gained per pixel of stroking
export const PET_AFFECTION_PER_PIXEL = 0.004;
export const SCRUB_PER_PIXEL = 0.06;
export const FETCH_FUN = 14;
export const FETCH_ENERGY_COST = 6;
export const NAP_ENERGY_PER_SEC = 6;

/** Trick skill is 0..1. Success chance = TRICK_BASE + (1 - TRICK_BASE) * skill, scaled by mood. */
export const TRICK_BASE = 0.25;
export const TRICK_GAIN_SUCCESS = 0.14;
export const TRICK_GAIN_FAIL = 0.04;
/** Petting within this many seconds of a successful trick counts as praise. */
export const PRAISE_WINDOW = 3;
export const PRAISE_GAIN = 0.08;

export const TRICKS = ['sit', 'lie', 'shake', 'spin', 'roll'] as const;
export type TrickId = (typeof TRICKS)[number];
export const TRICK_LABEL: Record<TrickId, string> = {
  sit: 'Sit',
  lie: 'Lie down',
  shake: 'Shake',
  spin: 'Spin',
  roll: 'Roll over',
};
/** Seconds each trick pose is held. */
export const TRICK_SECONDS: Record<TrickId, number> = { sit: 2.2, lie: 2.4, shake: 2.2, spin: 1.6, roll: 2.0 };

export const BALL_RADIUS = 0.35;
export const BALL_GRAVITY = 18;
export const BALL_MAX_SPEED = 26;

export const SAVE_KEY = 'giant-pup.save.v1';
export const DEFAULT_DOG_NAME = 'Biscuit';
