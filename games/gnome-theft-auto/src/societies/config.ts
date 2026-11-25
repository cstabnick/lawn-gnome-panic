// E17 Underground societies (docs/roadmaps/gta-batch-3/E17/roadmap.md): the Underspan (Hogweed Sprocket's radical
// inventors beside the Skyway's Unfinished Span), Wader's Rest (the Flock of the One Leg and the Standing Lady) and
// Loamdeep (the Burrowfolk's halls under the Burrow Door, mole jobs, DJ Moleman's burrow).
// Pure data and types only: no three.js, no DOM. World coordinates: +x east, +z south (north is -z), metres; yaw 0 faces
// +z, yaw PI faces north, PI/2 faces east. Interior positions are LOCAL (metres from the room centre, on the floor).
// Every surface place lies inside its E01 site (sites.ts): `skyway-under` x 560..600, z -51..-1 (flat, ground 0);
// `cult-camp` x -1220..-1040, z -730..-550 (flat, ground 1.3); `mole-entrance` x -1015..-985, z 285..315 (a gentle slope).
// The lead owns this file: workers read it, never edit it.
import type { Blip } from '../types';
import type { JobsDeps } from '../jobs/types';

const N = Math.PI, E = Math.PI / 2, W = -Math.PI / 2;

/** An axis-aligned rectangle (world or local, as the owner says). */
export interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }
export interface Pose { x: number; z: number; yaw: number }
export type XZ = readonly [number, number];

// ---- Interiors (E05 defineInterior ids) ----------------------------------------------------------------------------

export const SOCIETY_INTERIORS = {
  workshop: 'underspan-workshop',
  tent: 'flock-tent',
  loamdeep: 'loamdeep',
  moleman: 'moleman-burrow',
} as const;

// ---- The Underspan --------------------------------------------------------------------------------------------------

export const UNDERSPAN = {
  /** E01 site `skyway-under`. Nothing of ours may leave it (the Unfinished Span's deck starts at x 605.5). */
  site: { minX: 560, maxX: 600, minZ: -51, maxZ: -1 } as Rect,
  /** The workshop shed (a walk-in: SOCIETY_INTERIORS.workshop), footprint; door on its west face. */
  shed: { minX: 586, maxX: 598, minZ: -22, maxZ: -6 } as Rect,
  shedHeight: 5,
  /** World door spot (where "Enter Hogweed's Workshop" shows) and where the player is put on leaving. */
  workshopDoor: { x: 584.5, z: -14, yaw: W } as Pose,
  workshopExit: { x: 583, z: -14, yaw: W } as Pose,
  /** Hogweed Sprocket stands here (quest giver `hogweed`), facing the player coming from the west. */
  hogweed: { x: 580, z: -18, yaw: E } as Pose,
  /**
   * The Roost: a scaffold deck on the north half, a walkable E05 rooftop (`addRooftop`, solid: false). The Updraft (in
   * the workshop) shoots the player up onto it; the Chute (an interact spot on the deck, at `chuteTop`) slides them down
   * to `chuteBottom` on the ground.
   */
  roost: { id: 'underspan-roost', minX: 564, maxX: 584, minZ: -46, maxZ: -32 } as Rect & { id: string },
  roostY: 6,
  roostArrive: { x: 574, z: -39, yaw: N } as Pose,
  chuteTop: { x: 583, z: -34 } as const,
  chuteBottom: { x: 588, z: -30, yaw: E } as Pose,
  /** The scrap heap at the workshop's back door. */
  scrapHeap: { x: 596, z: -3 } as const,
  /** The manifesto wall (a long board of posters) along the west edge, facing west to the road. */
  manifestoWall: { x: 561.5, z: -20, yaw: W } as Pose,
} as const;

/** Local layout of Hogweed's Workshop (SOCIETY_INTERIORS.workshop): door on the west wall. */
export const WORKSHOP_ROOM = {
  size: { w: 22, d: 16, h: 6 },
  door: [-10.8, 0] as XZ,
  doorYaw: E,
  /** The Updraft: a hose-and-umbrella lift in the north-east corner; its spot is `kit.stairsTo(..., roost point)`. */
  updraft: [8, -5] as XZ,
  /** Hogweed's bench where quest parts are handed in. */
  bench: [2, -6] as XZ,
  /** The Dewdrop's empty cradle (E18 fills it). */
  dewdropCradle: [6, 4] as XZ,
} as const;

// ---- Wader's Rest -------------------------------------------------------------------------------------------------

export const WADERS_REST = {
  /** E01 site `cult-camp` (flat ground at y 1.3). */
  site: { minX: -1220, maxX: -1040, minZ: -730, maxZ: -550 } as Rect,
  centre: { x: -1130, z: -640 },
  /** The Standing Lady (giant pink plastic flamingo) on her sand mound, facing west (nobody knows why). */
  lady: { x: -1130, z: -668, yaw: W } as Pose,
  ladyMoundR: 7,
  /** The ritual circle of one-leg stones between the tent and the Lady: stand here for a sermon. */
  circle: { x: -1130, z: -645, r: 8 },
  /** The big tent (Saxifrage's; walk-in SOCIETY_INTERIORS.tent), door on its north side facing the Lady. */
  bigTent: { x: -1130, z: -608, r: 9 },
  tentDoor: { x: -1130, z: -618.5, yaw: N } as Pose,
  tentExit: { x: -1130, z: -620.5, yaw: N } as Pose,
  /** Mother Saxifrage Wader (quest giver `saxifrage`), beside the circle. */
  saxifrage: { x: -1121, z: -634, yaw: W } as Pose,
  /** The camp gate on the east side (the track in from the loch road). */
  gate: { x: -1046, z: -640, yaw: E } as Pose,
  /** Small tents on a ring round the centre (radius) and how many. */
  tentRing: { r: 42, count: 9 },
  washingLine: { x: -1092, z: -602 },
  teaUrn: { x: -1166, z: -616 },
  rotaBoard: { x: -1108, z: -598 },
  /** The bench that nobody sits on on Tuesdays. */
  tuesdayBench: { x: -1150, z: -598 },
} as const;

/** Local layout of the big tent (SOCIETY_INTERIORS.tent): door on the north wall. */
export const TENT_ROOM = {
  size: { w: 16, d: 16, h: 5 },
  door: [0, -7.8] as XZ,
  doorYaw: 0,
  /** A shrine to the Lady (a small pink-free model of her) on the south side. */
  shrine: [0, 6] as XZ,
} as const;

// ---- The Burrow Door (surface) ------------------------------------------------------------------------------------

export const BURROW_DOOR = {
  /** E01 site `mole-entrance` (gentle slope falling to the east: ground ~0.5 west .. ~-1.0 east). */
  site: { minX: -1015, maxX: -985, minZ: 285, maxZ: 315 } as Rect,
  /** The grassy mound, centre and radius; the round door is on its east face (toward Mossy Wood). */
  mound: { x: -1000, z: 300, r: 5.5, h: 2.6 },
  door: { x: -993.5, z: 300, yaw: E } as Pose,
  exit: { x: -992, z: 300, yaw: E } as Pose,
  /** Nubbin waits here (quest giver `nubbin`), beside the door, facing east. */
  nubbin: { x: -993, z: 303.5, yaw: E } as Pose,
  /** Molehills round the mound. */
  molehills: [[-1008, 292], [-1006, 309], [-996, 290], [-1010, 302], [-992, 311]] as readonly XZ[],
} as const;

// ---- Loamdeep (the mole halls: one large interior) ------------------------------------------------------------------

export type HallId = 'mothers' | 'rootway' | 'lamplight' | 'postern' | 'hearth' | 'underChorus';
export const HALL_IDS: readonly HallId[] = ['mothers', 'rootway', 'lamplight', 'postern', 'hearth', 'underChorus'];
export const HALL_NAMES: Readonly<Record<HallId, string>> = {
  mothers: "the Mother's Hall",
  rootway: 'Rootway Hall',
  lamplight: 'Lamplight Hall',
  postern: 'Postern Hall',
  hearth: 'Hearth Hall',
  underChorus: 'Under-Chorus Hall',
};
export type TunnelId = 'entry' | 'westGallery' | 'eastGallery' | 'westRise' | 'eastRise' | 'northWest' | 'northEast' | 'mothersNorth';
/** The three lamp tunnels (the Lamplighter job lights one of them per shift). */
export type LampTunnelId = 'westRise' | 'eastRise' | 'mothersNorth';
export const LAMP_TUNNELS: readonly LampTunnelId[] = ['westRise', 'eastRise', 'mothersNorth'];

export const LOAMDEEP = {
  /** Interior size: x -52..52, z -45..45, ceiling 4 m (low for a gnome, right for a mole). */
  size: { w: 104, d: 90, h: 4 },
  /** World door at the Burrow Door. */
  door: BURROW_DOOR.door,
  exit: BURROW_DOOR.exit,
  /** The way out: on the south wall at the end of the entry tunnel, facing north into the halls. */
  exitDoor: [0, 44.6] as XZ,
  exitDoorYaw: N,
  /** Open floor: every hall and tunnel. Everything else in the cell is packed earth (loamdeep/earth.ts fills it). */
  halls: {
    mothers: { minX: -12, maxX: 12, minZ: 6, maxZ: 26 },
    rootway: { minX: -50, maxX: -30, minZ: 12, maxZ: 28 },
    lamplight: { minX: 30, maxX: 50, minZ: 12, maxZ: 28 },
    postern: { minX: -50, maxX: -30, minZ: -38, maxZ: -22 },
    hearth: { minX: 30, maxX: 50, minZ: -38, maxZ: -22 },
    underChorus: { minX: -14, maxX: 14, minZ: -42, maxZ: -18 },
  } as Readonly<Record<HallId, Rect>>,
  tunnels: {
    entry: { minX: -2, maxX: 2, minZ: 26, maxZ: 45 },
    westGallery: { minX: -30, maxX: -12, minZ: 16, maxZ: 20 },
    eastGallery: { minX: 12, maxX: 30, minZ: 16, maxZ: 20 },
    westRise: { minX: -42, maxX: -38, minZ: -22, maxZ: 12 },
    eastRise: { minX: 38, maxX: 42, minZ: -22, maxZ: 12 },
    northWest: { minX: -30, maxX: -14, minZ: -32, maxZ: -28 },
    northEast: { minX: 14, maxX: 30, minZ: -32, maxZ: -28 },
    mothersNorth: { minX: -2, maxX: 2, minZ: -18, maxZ: 6 },
  } as Readonly<Record<TunnelId, Rect>>,
  /** Lamps along the three lamp tunnels: 4 each, fixed to the tunnel's west/east wall at these local points. */
  lamps: {
    westRise: [[-41.6, 8], [-41.6, 0], [-41.6, -8], [-41.6, -16]],
    eastRise: [[41.6, 8], [41.6, 0], [41.6, -8], [41.6, -16]],
    mothersNorth: [[1.6, 2], [1.6, -4], [1.6, -10], [1.6, -15]],
  } as Readonly<Record<LampTunnelId, readonly XZ[]>>,
  /** Interact spots (local). */
  spots: {
    /** Old Mother Tumblesoil's chair (quest giver `tumblesoil`, interior). She faces south toward the entry. */
    tumblesoil: [0, 12] as XZ,
    /** Where the player stands to talk to her. */
    tumblesoilFront: [0, 15] as XZ,
    /** Root Run: take a bundle of roots here. */
    rootPickup: [-40, 24] as XZ,
    /** Root Run drop points, one per hall the roots can go to. */
    rootDrops: {
      mothers: [8, 22], lamplight: [40, 24], postern: [-40, -26], hearth: [40, -26], underChorus: [8, -22],
    } as Readonly<Record<Exclude<HallId, 'rootway'>, XZ>>,
    /** Lamplighter: take a taper here. */
    taper: [46, 24] as XZ,
    /** Post Sorting: the pigeonhole desk (opens the sorting minigame). */
    sortingDesk: [-40, -34] as XZ,
    /** Dig a Nook: three dig faces on Hearth Hall's north wall. */
    digFaces: [[34, -37], [40, -37], [46, -37]] as readonly XZ[],
    /** Under-Chorus: DJ Moleman's decks (when he visits), the dance floor centre, two dug-in speakers. */
    decks: [0, -39] as XZ,
    danceFloor: [0, -29] as XZ,
    speakers: [[-11, -40], [11, -40]] as readonly XZ[],
    /** The Long Tunnel down to DJ Moleman's burrow (kit.stairsTo to SOCIETY_INTERIORS.moleman). */
    longTunnel: [-12, -40] as XZ,
    /** Where the player appears when they come back up the Long Tunnel. */
    longTunnelArrive: [-9, -37] as XZ,
  },
} as const;

/** DJ Moleman's own burrow (SOCIETY_INTERIORS.moleman): hidden (no world door), reached only by the Long Tunnel. */
export const MOLEMAN_BURROW = {
  size: { w: 18, d: 14, h: 3.6 },
  /** The way back up (kit.stairsTo to 'loamdeep'), on the south wall. */
  stairsBack: [0, 6] as XZ,
  arrive: [0, 4] as XZ,
  /** His decks against the north wall, him behind them facing south. */
  decks: [0, -4.5] as XZ,
  moleman: [0, -5.6] as XZ,
} as const;

// ---- Mole jobs ------------------------------------------------------------------------------------------------------

export type MoleJobId = 'roots' | 'lamps' | 'post' | 'dig';
export const MOLE_JOB_IDS: readonly MoleJobId[] = ['roots', 'lamps', 'post', 'dig'];
export const MOLE_JOB_NAMES: Readonly<Record<MoleJobId, string>> = {
  roots: 'Root Run', lamps: 'Lamplighter', post: 'Post Sorting', dig: 'Dig a Nook',
};

// ---- Cast (names the builders, quests and lore use) -------------------------------------------------------------

export const SOCIETY_CAST = {
  // The Underspanners
  hogweed: 'Hogweed Sprocket',
  teasel: 'Teasel Gimbal',       // welds, never lifts the visor
  burdock: 'Burdock Flywheel',   // pedals the generator all day; the lights depend on him
  vetch: 'Vetch Cantilever',     // writes the manifesto on the columns in chalk
  nettle: 'Nettle Rivet',        // reads in a hammock slung from the scaffold, upside down
  // The Flock of the One Leg
  saxifrage: 'Mother Saxifrage Wader',
  sedge: 'Sister Sedge',         // keeps the reed tea
  bulrush: 'Brother Bulrush',    // the grey washing
  plover: 'Sister Plover',       // the rota board
  godwit: 'Brother Godwit',      // always wobbling, always owes tea
  pipit: 'Novice Pipit',         // new; still learning which leg
  // The Burrowfolk
  nubbin: 'Nubbin',
  tumblesoil: 'Old Mother Tumblesoil',
  moleman: 'DJ Moleman',
  tamp: 'Old Tamp',              // Rootway Hall, sorts roots by smell
  delve: 'Mistress Delve',       // Lamplight Hall, keeper of the lamps
  sift: 'Mister Sift',           // Postern Hall, the postmaster
  crumb: 'Auntie Crumb',         // Hearth Hall, grub bread and supper
  pim: 'Pim',                    // the Tunnel twins, very small
  pod: 'Pod',
} as const;

// ---- Achievements, quests, probes, save ---------------------------------------------------------------------------

/** Achievement ids (packages/achievements/src/catalog.ts, block "E17 underground societies"). */
export const SOCIETY_ACH = {
  honestDirt: 'gta-honest-dirt',             // finish your first mole job          -> back  post-satchel
  everyHall: 'gta-every-hall',               // finish all four kinds of mole job   -> head  loamdeep-lamp-cap
  seat: 'gta-seat',                          // be in the Under-Chorus when Moleman plays -> neck subsoil-headphones
  verticality: 'gta-unauthorised-verticality', // ride the Updraft onto the Roost    -> head  underspan-goggles
  birdsOfAFeather: 'gta-birds-of-a-feather', // join the Flock (finish Errands for the Flock) -> head flock-hood
  satDown: 'gta-sat-down',                   // sit down at the Long Vigil (leave the Flock) -> hand reed-tea-cup
} as const;

/** Side quest ids (quests/loamdeepQuests.ts and quests/societyQuests.ts). */
export const SOCIETY_QUESTS = {
  burrowPost: 'sq-burrow-post',
  lamps: 'sq-loamdeep-lamps',
  underChorus: 'sq-loamdeep-under-chorus',
  verticality: 'sq-underspan-verticality',
  scrapRun: 'sq-underspan-scrap-run',
  flockErrands: 'sq-flock-errands',
  flockVigil: 'sq-flock-vigil',
} as const;

/**
 * Probe ids (city/probes.ts registerProbe; quests watch them with `{ kind: 'probe', probe, count }`). Each reads a
 * running total from the societies save, so "count: 1" means "do it once more after the step starts".
 */
export const SOCIETY_PROBES = {
  moleRoots: 'mole-job-roots',     // Root Run shifts finished
  moleLamps: 'mole-job-lamps',     // Lamplighter shifts finished (one tunnel each)
  molePost: 'mole-job-post',       // Post Sorting shifts finished
  moleDig: 'mole-job-dig',         // Dig a Nook shifts finished
  moleAny: 'mole-job-any',         // any mole job finished
  molemanMet: 'moleman-met',       // times the player has stood at DJ Moleman's decks in his burrow
  updraft: 'underspan-updraft',    // rides of the Updraft onto the Roost
  sermon: 'flock-sermon-stood',    // sermons stood through on one leg in the ritual circle
} as const;

export const SOCIETY_SAVE_KEY = 'gta-societies-v1';

/** The societies save (societies/save.ts). Every count is a non-negative integer. */
export interface SocietySave {
  v: 1;
  /** Finished shifts per mole job. */
  moleJobs: Record<MoleJobId, number>;
  /** Best stars (0..5) per mole job. */
  moleBest: Record<MoleJobId, number>;
  /** DJ Moleman has come up to play the Under-Chorus (set when sq-loamdeep-under-chorus is done). */
  molemanVisits: boolean;
  molemanMet: number;
  updraftRides: number;
  sermonsStood: number;
}

/** Window event names (CustomEvent detail shown). */
export const SOCIETY_EVENTS = {
  /** A mole job shift ended: detail { job: MoleJobId, stars: number, pay: number }. */
  moleJobDone: 'gta:mole-job-done',
  /** The player rode the Updraft onto the Roost: no detail. */
  updraft: 'gta:underspan-updraft',
  /** The player stood a whole sermon on one leg: detail { long: boolean }. */
  sermon: 'gta:flock-sermon',
} as const;

// ---- What each living part gives index.ts ----------------------------------------------------------------------

/** What installSocieties hands every part: the jobs deps plus a teleport (player.respawn on foot at x, z facing yaw). */
export type SocietyDeps = JobsDeps & { teleport(x: number, z: number, yaw: number): void };

/** A living part (life, runtime, achievements). Every member is optional. */
export interface SocietyPart {
  /** Every frame, after the player and vehicles moved. t = seconds since install. */
  update?(dt: number, t: number): void;
  blips?(): Blip[];
  /** A full-screen job UI (post sorting, digging, the sermon hold) is up: app.ts holds the player's controls. */
  isOpen?(): boolean;
  /** A loudspeaker near the player playing a radio station (Loamdeep's Under-Chorus plays Subsoil 'under'), world coords. */
  speaker?(x: number, z: number): { x: number; y: number; z: number; station: 'under' } | null;
}
