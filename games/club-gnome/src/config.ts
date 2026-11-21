// Club Gnome: shared types, constants and tuning. Every module imports from here; nothing here imports a module.
// Units: 1 world unit = about one gnome height. The ground is the plane y = 0. x grows to the right of the screen,
// z grows toward the camera (the camera looks from +z, above, toward -z).

export const GAME_ID = 'club-gnome' as const;

// ---------------------------------------------------------------- maps

export type MapId = 'town' | 'gnomecino' | 'arcade' | 'park';
export const MAP_IDS: readonly MapId[] = ['town', 'gnomecino', 'arcade', 'park'];
export const MAP_NAMES: Record<MapId, string> = {
  town: 'Town Square',
  gnomecino: 'The Gnomecino',
  arcade: 'The Arcade',
  park: 'Links Park',
};
/** Short line for the map picker. */
export const MAP_BLURBS: Record<MapId, string> = {
  town: 'The fountain, the shops, everyone',
  gnomecino: 'Blackjack, pool, slots and a bar',
  arcade: 'Cabinets of every game',
  park: 'Golf, the dock and the front',
};

export function isMapId(v: unknown): v is MapId {
  return typeof v === 'string' && (MAP_IDS as readonly string[]).includes(v);
}

/** An axis-aligned rectangle on the ground: centre (x, z), full width w (along x) and depth d (along z). */
export interface Rect {
  x: number;
  z: number;
  w: number;
  d: number;
}

/** A @lawn/prefabs item placed on the ground. rot is yaw in radians (0 = the prefab's front faces +z, the camera). */
export interface PropDef {
  prefab: string;
  x: number;
  z: number;
  rot?: number;
  scale?: number;
  /** A @lawn/prefabs colour name for the prefab's 'tint' parts. */
  tint?: string;
}

/**
 * A building: a box standing on the ground at rect (x, z, w, d), h tall, with a pitched roof (outdoor maps) and a
 * door in the middle of its front (+z) face. Buildings block walking. Clicking one acts like clicking `link`.
 */
export interface BuildingDef {
  id: string;
  /** Painted on a sign above the door. */
  label: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  /** Wall colour 0xRRGGBB. */
  color: number;
  /** Roof colour 0xRRGGBB. */
  roof: number;
  /** The id of a portal or spot in the same map that this building stands for (its door). */
  link?: string;
  /** Neon-style glowing sign (the Gnomecino). */
  neon?: boolean;
}

/** Walking within r of (x, z) takes you to map `to`, standing at (spawnX, spawnZ). */
export interface PortalDef {
  id: string;
  /** Shown on the action button: "Enter the Gnomecino", "To Links Park". */
  label: string;
  x: number;
  z: number;
  r: number;
  to: MapId;
  spawnX: number;
  spawnZ: number;
}

/** A place that opens one of the arcade's games: walk within r, then tap the action button (or click it to walk there). */
export interface SpotDef {
  id: string;
  /** Shown on the action button: "Play Blackjack". */
  label: string;
  x: number;
  z: number;
  r: number;
  game: GameKey;
}

/**
 * A place to sit down and chill (a bench, a stool, a picnic table's bench). Walk within r, then tap the action button
 * (or click it to walk there) and the gnome sits at (x, z), facing `facing` (yaw, 0 = +z), at seat height `y`.
 * Any walking gets you up again. Purely local: other players see you standing.
 */
export interface SeatDef {
  id: string;
  /** Shown on the action button: "Sit on the bench". */
  label: string;
  x: number;
  z: number;
  r: number;
  facing: number;
  /** Height of the seat's top surface (world units). */
  y: number;
}

/** A painted board standing on two posts, or hung on an interior wall (y is the board centre height). */
export interface SignDef {
  text: string;
  x: number;
  z: number;
  y?: number;
  rot?: number;
  color?: number;
}

export interface MapDef {
  id: MapId;
  /** Map bounds: x in [-w/2, w/2], z in [-d/2, d/2]. Walking is clamped to these, less WALK.edge. */
  w: number;
  d: number;
  /** Floor colour 0xRRGGBB (grass outdoors, carpet or boards indoors). */
  ground: number;
  /** Indoor maps get four walls (wallColor) and a ceiling-light look; outdoor maps get a hedge border and sky. */
  indoor: boolean;
  wallColor?: number;
  /** Where you stand when you arrive without a portal (first load, map picker). */
  spawn: { x: number; z: number };
  buildings: BuildingDef[];
  props: PropDef[];
  /** Extra rectangles you cannot walk through (tables, counters, the fountain, water). */
  blockers: Rect[];
  portals: PortalDef[];
  spots: SpotDef[];
  seats: SeatDef[];
  signs: SignDef[];
  /** Flat coloured patches drawn on the floor (paths, water, a dance floor): rect + colour. Purely visual. */
  patches?: { x: number; z: number; w: number; d: number; color: number }[];
}

// ---------------------------------------------------------------- games you can open

/** One of the arcade's games, opened in a full-screen frame over the town. */
export interface GameLink {
  /** Folder name under games/ (also the site path: ../<game>/). */
  game: string;
  title: string;
  /** Its dev-server port (vite.config.ts), used when the town runs on a dev server. */
  port: number;
  /** Extra query string without '?', e.g. 'room=HIGHROLL'. */
  query?: string;
}

export const GAME_LINKS = {
  blackjack: { game: 'gnome-blackjack', title: 'Gnome Blackjack', port: 5194 },
  blackjackHigh: { game: 'gnome-blackjack', title: 'Gnome Blackjack: High Rollers', port: 5194, query: 'room=HIGHROLL' },
  slots: { game: 'gnome-blackjack', title: 'Gnomecino Slots', port: 5194, query: 'slots=1&offline=1' },
  pulltabs: { game: 'gnome-blackjack', title: 'Gnomecino Pull-Tabs', port: 5194, query: 'pulltabs=1&offline=1' },
  bowling: { game: 'gnome-bowling', title: 'Gnome Bowling', port: 5185 },
  golf: { game: 'gnome-golf', title: 'Gnome Golf', port: 5184 },
  party: { game: 'gnome-party', title: 'Gnome Party', port: 5191 },
  music: { game: 'music-room', title: 'Music Room', port: 5192 },
  prix: { game: 'lawn-prix', title: 'Lawn Prix', port: 5193 },
  chain: { game: 'mower-chain', title: 'Mower Chain', port: 5190 },
  panic: { game: 'sample-3d', title: 'Lawn Gnome Panic', port: 5174 },
  sweet: { game: 'gnome-sweet-gnome', title: 'Gnome Sweet Gnome', port: 5180 },
  ftl: { game: 'faster-than-lawn', title: 'Faster Than Lawn', port: 5181 },
  aether: { game: 'aether-board', title: 'Aether Board', port: 5195 },
  billiards: { game: 'gnome-billiards', title: 'Gnome Billiards', port: 5201 },
  front: { game: 'gnome-front', title: 'Gnome Front', port: 5182 },
  gnaft: { game: 'gnaft', title: 'Gnaft', port: 5183 },
  pup: { game: 'giant-pup', title: 'Giant Pup', port: 5196 },
  gnomomia: { game: 'gnomes-of-gnomomia', title: 'Gnomes of Gnomomia', port: 5291 },
  creator: { game: 'gnome-creator', title: 'Gnome Creator', port: 5186 },
  me: { game: 'me', title: 'Your Gnome', port: 5199 },
} satisfies Record<string, GameLink>;
export type GameKey = keyof typeof GAME_LINKS;

// ---------------------------------------------------------------- avatars and net

/** The id avatars.ts and main.ts use for my own gnome (the server never hands out -1). */
export const ME = -1;

/** A gnome's pose as shown and as sent: feet position, yaw (0 = facing +z, toward the camera), walking, in a game. */
export interface AvatarPose {
  x: number;
  z: number;
  facing: number;
  moving: boolean;
  /** True while the player has a game open (shown as a 🎮 by their name). */
  busy: boolean;
  /** Seat height while sitting down on a seat (0 or missing = standing). Not sent to other players yet. */
  sit?: number;
}

export type EmoteId = 'wave' | 'dance' | 'heart' | 'laugh' | 'cards' | 'cool';
export const EMOTES: Record<EmoteId, string> = {
  wave: '👋',
  dance: '💃',
  heart: '💚',
  laugh: '😂',
  cards: '🃏',
  cool: '😎',
};
export const EMOTE_IDS = Object.keys(EMOTES) as EmoteId[];

export type NetStatus =
  /** This build has no server (serverUrl() === ''): the town is played alone. */
  | 'unavailable'
  | 'connecting'
  | 'online'
  /** The link dropped; a reconnect is scheduled. */
  | 'retrying';

/** Someone else in the town (from the server's PlayerInfo). */
export interface Peer {
  id: number;
  name: string;
  color: number;
  /** Their look code (g1.…) or 'gnorman'. */
  character: string;
  userId?: string;
}

// ---------------------------------------------------------------- tuning

export const WALK = {
  /** Walking speed, units per second. */
  speed: 4.2,
  /** Collision radius of a gnome against buildings and blockers. */
  radius: 0.35,
  /** Keep this far inside the map bounds. */
  edge: 0.8,
  /** Within this of the target counts as arrived. */
  arrive: 0.08,
  /** Turn rate toward the walking direction, radians per second. */
  turn: 12,
};

export const CAMERA = {
  fov: 40,
  /** Camera offset from the followed point (x, y, z). Phones in portrait use the far one. */
  offset: { x: 0, y: 15, z: 15 },
  portraitOffset: { x: 0, y: 22, z: 20 },
  /** The camera looks this far ahead of my gnome toward -z (the back of the map). */
  lookAhead: 2.5,
  /** Follow smoothing per second (higher = snappier). */
  follow: 6,
};

export const NET = {
  /** Pose sends per second while moving; while still, the last pose is re-sent this often (ms) as the keepalive. */
  movingHz: 10,
  idleResendMs: 1000,
  /** Reconnect delays (s) after the link drops; the last one repeats. */
  retryS: [3, 6, 12, 30, 60],
};

export const CHAT = {
  /** Speech bubble time: base seconds plus per character, capped. */
  bubbleBaseS: 4,
  bubblePerCharS: 0.06,
  bubbleMaxS: 10,
  /** Lines kept in the chat log. */
  logLines: 40,
};

/** localStorage / sessionStorage keys. */
export const STORAGE = {
  name: 'club-gnome.name',
  /** sessionStorage: the map you were on, so a reload (or coming back from sign-in) puts you back. */
  map: 'club-gnome.map',
  /** sessionStorage: '1' once the guest prompt was dismissed this visit. */
  guestDismissed: 'club-gnome.guest-dismissed',
  /** localStorage: JSON array of MapIds visited (achievements). */
  visited: 'club-gnome.visited',
};
