// Pebblecross: the ids, types and tuning numbers every module shares. Edit numbers here, not in gameplay code.
// Nothing in this file touches the DOM or three.js.
import type { Look } from '@lawn/gnome';

// ---- Clock ----

/** Real seconds per in-game day. 480 means one game hour takes 20 seconds. */
export const DAY_SECONDS = 480;
/** Game minutes in one day. */
export const MINUTES_PER_DAY = 1440;
/** The clock starts at this hour on day 0 (day 0 is a Monday). */
export const START_HOUR = 7;
/** Day names, Monday first. Day index 0 is Monday. Saturday and Sunday are the weekend. */
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

// ---- Walking and reach ----

/** Player walk speed, metres per second. */
export const PLAYER_SPEED = 3.2;
/** Resident walk speed, metres per second. */
export const RESIDENT_SPEED = 1.5;
/** Radius of the gnome for path planning, metres. Obstacles are grown by this much. */
export const AGENT_RADIUS = 0.45;
/** Path-planning grid cell size, metres. */
export const NAV_CELL = 0.5;
/** How close the player must be to a resident, forage patch or place to use it, metres. */
export const INTERACT_RANGE = 2.2;

// ---- Foraging ----

/** Seconds of real time a forage patch takes to pick. */
export const FORAGE_SECONDS = 2;
/** Game minutes before a picked forage patch has something on it again. */
export const FORAGE_RESPAWN_MINUTES = 90;

// ---- Friendship ----

/** Points for a first talk with a resident each day. */
export const TALK_POINTS = 5;
/** Points for giving a resident their favourite gift (one gift per resident per day). */
export const GIFT_FAVOURITE_POINTS = 15;
/** Points for giving any other gift (one gift per resident per day). */
export const GIFT_OTHER_POINTS = 5;
/** Friendship points run from 0 to this. */
export const MAX_POINTS = 100;
/** Friendship levels, lowest first. A resident's level is the last one whose `min` they have reached. */
export const FRIEND_LEVELS = [
  { min: 0, name: 'Stranger' },
  { min: 20, name: 'Acquaintance' },
  { min: 50, name: 'Friend' },
  { min: 80, name: 'Close friend' },
  { min: 100, name: 'Best friend' },
] as const;
/** The level at which a resident counts as a friend (achievements, the friends list). */
export const FRIEND_MIN_POINTS = 50;

/** Where the save lives (localStorage, one key per browser). */
export const SAVE_KEY = 'pebblecross.save.v1';

// ---- Gifts ----

export type GiftId = 'acorn' | 'dandelion' | 'pebble' | 'clover' | 'mushroom' | 'bottlecap' | 'crumb';

/** Every gift a player can carry. `icon` is an emoji shown in the bag until a prefab icon is wired in. */
export const GIFTS: Record<GiftId, { label: string; icon: string }> = {
  acorn: { label: 'Acorn', icon: '🌰' },
  dandelion: { label: 'Dandelion', icon: '🌼' },
  pebble: { label: 'Pebble', icon: '🪨' },
  clover: { label: 'Four-leaf clover', icon: '🍀' },
  mushroom: { label: 'Mushroom', icon: '🍄' },
  bottlecap: { label: 'Bottle cap', icon: '🪙' },
  crumb: { label: 'Bread crumb', icon: '🍞' },
};

export const GIFT_IDS = Object.keys(GIFTS) as GiftId[];

// ---- Residents and places ----

/** The nine residents of Pebblecross. Ids are short and stable: they are save keys. */
export type ResidentId = 'nettle' | 'fernwick' | 'tansy' | 'hollis' | 'lou' | 'marjory' | 'clem' | 'doris' | 'gertrude';

export const RESIDENT_IDS: ResidentId[] = [
  'nettle', 'fernwick', 'tansy', 'hollis', 'lou', 'marjory', 'clem', 'doris', 'gertrude',
];

/** Every named spot in the town: a shop or building, a green spot, or a home. Each one is a `place` marker in
 * `src/data/levels/pebblecross.level.json` with this id. Residents' schedules refer to them. */
export type PlaceId =
  | 'bakery'
  | 'post-office'
  | 'potting-shed'
  | 'yard-shed'
  | 'school'
  | 'inn'
  | 'green'
  | 'green-bench'
  | 'pond'
  | 'oak'
  | 'home-nettle'
  | 'home-fernwick'
  | 'home-tansy'
  | 'home-hollis'
  | 'home-lou'
  | 'home-marjory'
  | 'home-clem'
  | 'home-doris'
  | 'home-gertrude';

/** One block of a resident's day. Hours are 0 to 24. `from` greater than `to` wraps past midnight. `doing` is shown
 * to the player, and `asleep` is the one that hides the resident (use it only for the night at home). */
export interface ScheduleSlot {
  from: number;
  to: number;
  at: PlaceId;
  doing: string;
}

/** Lines a resident says, grouped by when and how. Each list has at least one line. */
export interface ResidentLines {
  morning: string[];
  day: string[];
  evening: string[];
  night: string[];
  /** Said once the resident is a friend (FRIEND_MIN_POINTS or more). */
  close: string[];
  /** Said when given their favourite gift. */
  favourite: string[];
  /** Said when given any other gift. */
  gift: string[];
}

export interface Resident {
  id: ResidentId;
  name: string;
  role: string;
  /** One line on the friends list, for example "Bakes the bread for the whole green." */
  blurb: string;
  home: PlaceId;
  favourite: GiftId;
  /** The gnome's colours (hat, coat, skin, beard and so on), worn through `createGnomeModel`. */
  look: Look;
  /** Monday to Friday. */
  weekday: ScheduleSlot[];
  /** Saturday and Sunday. */
  weekend: ScheduleSlot[];
  lines: ResidentLines;
}

// ---- Save ----

export interface Save {
  v: 1;
  /** Total game minutes since day 0, 00:00. Starts at START_HOUR on day 0. */
  clock: number;
  /** How many of each gift the player carries. */
  bag: Partial<Record<GiftId, number>>;
  /** Friendship points per resident. */
  points: Partial<Record<ResidentId, number>>;
  /** The day index of the last talk with each resident (one talk-point per resident per day). */
  talkedDay: Partial<Record<ResidentId, number>>;
  /** The day index of the last gift to each resident (one gift per resident per day). */
  giftedDay: Partial<Record<ResidentId, number>>;
  /** Gifts given in total, for an achievement. */
  giftsGiven: number;
}
