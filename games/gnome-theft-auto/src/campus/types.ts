// Rootwell (E13, docs/roadmaps/gta-batch-3/E13/roadmap.md): Rootwell University's campus, the Anthill with its
// observatory and Dean's Leap, Rootwell Field (the second runway) and the Pinwheel Ridge wind farm.
// Pure data and types only: no three.js, no DOM. World coordinates: +x east, +z south (north is -z), metres; yaw 0 faces
// +z, a facing vector is (sin yaw, cos yaw). Every place lies inside its E01 site (sites.ts): `campus` x 980..1300,
// z -350..-50 (flat); `observatory-mound` x 1120..1360, z 30..270 (natural, a 45 m hill); `runway-2` x 1200..1380,
// z 370..830 (flat); `wind-farm` x 700..1000, z -1245..-1155 (natural, on the ~24 m ridge crest). campus.test.ts checks it.
import type { Blip } from '../types';

// ---- Rootwell University ------------------------------------------------------------------------------------------

export type CampusBuildingId =
  | 'long-shelf' | 'crucible-block' | 'tilth-hall' | 'bedstraw-house' | 'trencher' | 'cold-frame-club' | 'cloche'
  | 'heap-barn' | 'bodgers-shed' | 'wicket-lodge' | 'the-clod' | 'plumbob-hall' | 'deans-lodge';

export interface CampusBuilding {
  id: CampusBuildingId;
  /** Lore name (docs/lore/entries/apocrypha/rootwell-university.md). */
  name: string;
  /** What it is, in plain words (library, lab block...). */
  role: string;
  /** The @lawn/prefabs id, authored life-size with its front door on local +z, footprint w (local x) by d (local z). */
  prefab: string;
  /** Centre of the footprint, on the ground. */
  x: number;
  z: number;
  /** The way the front door faces: 0 south (+z), PI north, PI/2 east (+x), -PI/2 west. Always a multiple of PI/2. */
  yaw: number;
  /** Width across the front (local x), depth (local z) and eaves height, metres. */
  w: number;
  d: number;
  h: number;
  /** Walkable spot 1.5 m outside the front door; yaw faces out (the way a gnome walks out). */
  door: { x: number; z: number; yaw: number };
  /** E05 interior entered at the door, if any. */
  interior?: string;
  /** E05 rooftop id on this building's roof, if any. */
  roof?: string;
  /** Counts for "First Class Honours" (the twelve lore buildings; the Dean's lodge does not count). */
  tour: boolean;
}

const N = Math.PI, E = Math.PI / 2, W = -Math.PI / 2;

/** The twelve buildings round the quad, plus the Dean's lodge. The front of each faces the quad or the drive. */
export const CAMPUS_BUILDINGS: readonly CampusBuilding[] = [
  { id: 'long-shelf', name: 'The Long Shelf', role: 'library', prefab: 'rootwell-library', x: 1110, z: -290, yaw: 0, w: 36, d: 22, h: 12,
    door: { x: 1110, z: -277.5, yaw: 0 }, interior: 'uni-library', tour: true },
  { id: 'plumbob-hall', name: 'Plumbob Hall', role: 'gnome-physics hall', prefab: 'rootwell-plumbob-hall', x: 1180, z: -292, yaw: 0, w: 28, d: 24, h: 10,
    door: { x: 1180, z: -278.5, yaw: 0 }, roof: 'plumbob-roof', tour: true },
  { id: 'tilth-hall', name: 'Tilth Hall', role: 'lecture hall', prefab: 'rootwell-lecture-hall', x: 1110, z: -112, yaw: N, w: 36, d: 24, h: 11,
    door: { x: 1110, z: -125.5, yaw: N }, interior: 'uni-lecture', roof: 'tilth-roof', tour: true },
  { id: 'crucible-block', name: 'the Crucible Block', role: 'lab block', prefab: 'rootwell-lab-block', x: 1180, z: -110, yaw: N, w: 28, d: 22, h: 10,
    door: { x: 1180, z: -122.5, yaw: N }, interior: 'uni-lab', tour: true },
  { id: 'trencher', name: 'the Trencher', role: 'refectory', prefab: 'rootwell-refectory', x: 1245, z: -215, yaw: W, w: 30, d: 24, h: 9,
    door: { x: 1231.5, z: -215, yaw: W }, tour: true },
  { id: 'cold-frame-club', name: 'the Cold Frame Club', role: 'faculty club', prefab: 'rootwell-faculty-club', x: 1250, z: -160, yaw: W, w: 14, d: 18, h: 7,
    door: { x: 1239.5, z: -160, yaw: W }, tour: true },
  { id: 'cloche', name: 'the Cloche', role: 'glasshouse', prefab: 'rootwell-glasshouse', x: 1285, z: -215, yaw: W, w: 26, d: 18, h: 8,
    door: { x: 1274.5, z: -215, yaw: W }, tour: true },
  { id: 'heap-barn', name: 'the Heap Barn', role: 'mulch-science barn', prefab: 'rootwell-heap-barn', x: 1265, z: -85, yaw: N, w: 22, d: 16, h: 9,
    door: { x: 1265, z: -94.5, yaw: N }, tour: true },
  { id: 'bodgers-shed', name: "Bodger's Shed", role: 'engineering shed', prefab: 'rootwell-bodgers-shed', x: 1262, z: -318, yaw: 0, w: 22, d: 16, h: 7,
    door: { x: 1262, z: -308.5, yaw: 0 }, tour: true },
  { id: 'bedstraw-house', name: 'Bedstraw House', role: 'dorm', prefab: 'rootwell-dorm', x: 1030, z: -315, yaw: 0, w: 36, d: 16, h: 12,
    door: { x: 1030, z: -305.5, yaw: 0 }, tour: true },
  { id: 'wicket-lodge', name: 'Wicket Lodge', role: 'gate lodge', prefab: 'rootwell-gate-lodge', x: 1000, z: -214, yaw: 0, w: 10, d: 8, h: 6,
    door: { x: 1000, z: -208.5, yaw: 0 }, tour: true },
  // The Clod is a pitch between two grandstands (prefab = one grandstand; buildings.ts places two, facing in).
  { id: 'the-clod', name: 'the Clod', role: 'stadium', prefab: 'rootwell-grandstand', x: 1040, z: -95, yaw: N, w: 60, d: 40, h: 8,
    door: { x: 1040, z: -116.5, yaw: N }, tour: true },
  { id: 'deans-lodge', name: "the Dean's lodge", role: "the Dean's house", prefab: 'rootwell-deans-lodge', x: 1055, z: -245, yaw: E, w: 12, d: 14, h: 7,
    door: { x: 1063.5, z: -245, yaw: E }, tour: false },
];

/** The campus as a whole. */
export const CAMPUS = {
  /** E01 site `campus`: x 980..1300, z -350..-50. */
  site: { minX: 980, maxX: 1300, minZ: -350, maxZ: -50 },
  /** The quad lawn (no buildings, no colliders except the centrepiece within 4 m of `quadCentre`). */
  quad: { minX: 1080, maxX: 1210, minZ: -265, maxZ: -140 },
  quadCentre: { x: 1145, z: -202 },
  /** The main gate (on the drive, at the site's west edge) and the drive from the east-band road (x ~945) to the quad. */
  gate: { x: 982, z: -200, yaw: E },
  drive: { from: { x: 946, z: -200 }, to: { x: 1080, z: -200 }, width: 8 },
  /** Car park south of the drive. */
  parking: { minX: 1000, maxX: 1060, minZ: -190, maxZ: -152 },
  /** The sugar store behind (east of) the Trencher: sacks on pallets, the ants' trail starts here (story + quest spot). */
  sugarStore: { x: 1265, z: -224 },
  /** The Clod's pitch centre (between its two grandstands). */
  pitch: { x: 1040, z: -95 },
} as const;

/**
 * Interior rooms (E05 defineInterior; local metres, origin at the room centre, +z = the room's south wall where the door
 * is). Quests visit these local spots with `interior: <id>`.
 */
export const ROOTWELL_ROOMS = {
  'uni-library': { size: { w: 24, d: 16, h: 6 }, door: [0, 7.8], librarian: [0, -4], essayDesk: [7, 3] },
  'uni-lab': { size: { w: 20, d: 14, h: 5 }, door: [0, 6.8], bench: [-5, -2] },
  'uni-lecture': { size: { w: 24, d: 18, h: 7 }, door: [0, 8.8], lectern: [0, -6], roofStairs: [-10, -7] },
  'anthill-observatory': { size: { w: 18, d: 18, h: 10 }, door: [0, 8.8], telescope: [0, -1], desk: [-5, 4] },
} as const;

/** Window event the observatory telescope fires when looked through: detail { night: boolean }. */
export const TELESCOPE_EVENT = 'gta:rootwell-telescope';

// ---- The Anthill, its observatory and Dean's Leap ---------------------------------------------------------------

export const OBSERVATORY = {
  /** E01 site `observatory-mound`: x 1120..1360, z 30..270. */
  site: { minX: 1120, maxX: 1360, minZ: 30, maxZ: 270 },
  /** The mound's top: macro hill/observatory-mound (r 120, h 45); the summit is flattened within `flatR` (blend to flatR + 12). */
  summit: { x: 1240, z: 150 },
  flatR: 30,
  /** The Anthill Observatory: a dome of radius r on the summit, door on its west side (spot 1.5 m out, facing west). */
  dome: { x: 1258, z: 158, r: 9 },
  door: { x: 1247.5, z: 158, yaw: -Math.PI / 2 },
  /** Where the telescope stands in the dome (world point at the dome centre). */
  telescope: { x: 1258, z: 158 },
  /** Dean's Leap: STUNT_RAMPS id, launching north toward the campus. Mirror of the stunts.ts entry. */
  rampId: 'deans-leap',
  /** The run-up across the summit to the ramp's entry: keep clear of props and colliders (4 m either side). */
  runUp: { from: { x: 1238, z: 182 }, to: { x: 1238, z: 135 } },
  /** Landing area north of the lip: no props, no colliders. */
  leapClear: { minX: 1212, maxX: 1264, minZ: 20, maxZ: 118 },
  /** Where the observatory trail (trail/anthill-road) ends on the summit, and where it starts at the east-band road. */
  roadStart: { x: 948, z: 110 },
  roadEnd: { x: 1238, z: 182 },
  /** The ants' doors round the foot of the mound (decor + quest spots); yaw faces out of the mound. */
  antDoors: [
    { id: 'north-door', x: 1172, z: 82, yaw: -2.36 },
    { id: 'east-door', x: 1338, z: 170, yaw: 1.77 },
    { id: 'south-door', x: 1236, z: 256, yaw: 0 },
  ],
} as const;

// ---- Rootwell Field (the second runway) -------------------------------------------------------------------------

export const ROOTWELL_FIELD = {
  id: 'rootwell-field',
  name: 'Rootwell Field',
  /** Mirror of the level marker `site/rootwell-field` (config.ts AIRFIELDS[1]): runway along z, take-off heading south. */
  runway: { x: 1300, z: 600, yaw: 0, length: 420, width: 24 },
  /** The apron west of the runway (paved; planes park here) and the taxiway joining it to the runway. */
  apron: { minX: 1215, maxX: 1262, minZ: 520, maxZ: 680 },
  taxiway: { minX: 1262, maxX: 1288, minZ: 588, maxZ: 612 },
  /** Access drive from the end of the runway-spur road (1180, 580) to the apron. */
  access: { from: { x: 1180, z: 580 }, to: { x: 1215, z: 590 }, width: 8 },
  hangar: { x: 1232, z: 668, yaw: Math.PI / 2 },
  tower: { x: 1228, z: 508, yaw: Math.PI / 2 },
  windsock: { x: 1330, z: 450 },
  /** A copter pad on the apron (also a charter landing pad). */
  pad: { x: 1245, z: 640, r: 7 },
} as const;

// ---- Pinwheel Ridge (the wind farm) -----------------------------------------------------------------------------

export interface Pinwheel {
  id: string;
  x: number;
  z: number;
  /** The way the rotor faces (into the wind): 0 = south. */
  yaw: number;
  /** Vane colour (lore: red, yellow and blue). */
  colour: 'red' | 'yellow' | 'blue';
}

/** Hub height above the ground and rotor radius, metres; rotor spin, radians per second (game time). */
export const PINWHEEL_SIZE = { hub: 24, rotorR: 9, spin: 0.9 } as const;

const RIDGE: [number, number][] = [[640, -1200], [850, -1205], [1060, -1195]];
function crestZ(x: number): number {
  const [a, b] = x <= RIDGE[1][0] ? [RIDGE[0], RIDGE[1]] : [RIDGE[1], RIDGE[2]];
  return a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
}
const COLOURS: Pinwheel['colour'][] = ['red', 'yellow', 'blue'];

export const WIND_FARM = {
  /** E01 site `wind-farm`: x 700..1000, z -1245..-1155, on landscape ridge/wind-farm (crest ~24 m). */
  site: { minX: 700, maxX: 1000, minZ: -1245, maxZ: -1155 },
  /** Ten giant garden pinwheels along the crest, 30 m apart. */
  pinwheels: Array.from({ length: 10 }, (_, i): Pinwheel => {
    const x = 715 + i * 30;
    return { id: `pinwheel-${i + 1}`, x, z: Math.round(crestZ(x) * 10) / 10, yaw: 0, colour: COLOURS[i % 3] };
  }),
  /** Ragwort Coilspring's control hut and the substation, on the north flank below the crest (facing the road); the
   *  service track from the north-band-east road (x 850, z ~-1297) up to the hut (trail/pinwheel-track in
   *  north-highlands.level.json). */
  hut: { x: 860, z: -1234, yaw: Math.PI },
  substation: { x: 905, z: -1236, yaw: Math.PI },
  trackStart: { x: 850, z: -1290 },
} as const;

// ---- Contracts other modules share -------------------------------------------------------------------------------

/** Interior ids (E05 defineInterior). */
export const ROOTWELL_INTERIORS = ['uni-library', 'uni-lab', 'uni-lecture', 'anthill-observatory'] as const;

/** Achievement ids (packages/achievements catalog). */
export const ROOTWELL_ACH = {
  deansLeap: 'gta-deans-leap',
  honours: 'gta-first-class-honours',
  stargazer: 'gta-stargazer',
  touchAndGo: 'gta-touch-and-go',
  windfall: 'gta-windfall',
} as const;

/** Side quests (docs/design/gnome-theft-auto/side-quest-schedule.md) and their givers. */
export const ROOTWELL_QUESTS = { lostEssay: 'sq-rootwell-lost-essay', anthillRent: 'sq-anthill-rent' } as const;

/** Sound ids added by E13 (sound/ids.ts REGION_SOUNDS, recipes/regions.ts). */
export const ROOTWELL_SOUNDS = { turbine: 'turbine-whoosh', ants: 'ant-skitter', telescope: 'telescope-whirr' } as const;

/** localStorage key of the campus tour (doors visited) and other Rootwell progress. */
export const ROOTWELL_SAVE_KEY = 'gta-rootwell-v1';

/** A runtime piece (index.ts combines them for app.ts). Every member is optional. */
export interface RootwellPart {
  /** Every frame, after the player and vehicles moved. t = game seconds since start (shared clock for animation). */
  update?(dt: number, t: number): void;
  blips?(): Blip[];
}

/** What app.ts calls (index.ts installRootwell). */
export interface Rootwell {
  update(dt: number): void;
  blips(): Blip[];
}
