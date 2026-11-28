// The Gutter Bowls (batch 3 E19, source items L61/L62): the public skate park in Founders' Green, made from old Tall-One
// roof gutters, and the skateboard you can ride anywhere. Shared constants and types for skate/*.ts. Pure: no three.js.
//
// Tricks and scoring are Aether Board's (@lawn/trickboard: BOARD_TRICKS, GRABS, GRINDS, AIR_GESTURES, zoneOf, grabFor,
// grindFor, createCombo); the board controller is GTA's own (skate/board.ts on winter/slideRider.ts stepSlide).
//
// Park frame: (u, v) metres from SKATE_ORIGIN, u along +x (east), v along +z (south). The site rect is u, v in -20..20;
// the north side (v = -20) is open to Gnorwin Clayfoot Park. Every ridable shape is a SkatePiece; skate/park.ts turns
// them into one height function and the rails, skate/build.ts into meshes. Heights are metres above the park's ground.
import type { PhysEvent } from '@lawn/trickboard';
import type { Blip, InputState, Vehicle } from '../types';

export const SKATE_ORIGIN = { x: -30, z: 90 } as const;
export const SKATE_SITE = { minX: -50, maxX: -10, minZ: 70, maxZ: 110 } as const;

/**
 * A ridable shape. Profiles (all heights above ground):
 * - halfpipe: a trough along u from u0 to u1, centred on v. |dv| <= flat: 0. Then a circular transition of `radius`:
 *   h = radius - sqrt(radius^2 - d^2) with d = |dv| - flat, until h reaches `height` (at d = sqrt(radius^2 - (radius -
 *   height)^2)); then a flat deck at `height`, `deck` metres wide. Outside: no piece. The coping is at the lip.
 * - bowl: the same profile turned round (u, v) by the radial distance (a round bowl, decked all round).
 * - wedge: a straight slope, low end at (u, v), rising along yaw (forward = (sin yaw, cos yaw)) to `height` at
 *   `length`, `width` across. A bank when its high end meets a deck, a kicker when it ends in the air (a lip).
 * - box: a flat-topped block (ledge, platform, deck), vertical sides; `prefab` names its look (else plain concrete).
 * - stairs: `steps` steps going down along yaw from (u, v) (the top edge, at `top`): step i (1-based) covers
 *   along [(i-1) * run, i * run) at height top - i * rise.
 * Overlaps take the highest piece.
 */
export type SkatePiece =
  | { kind: 'halfpipe'; id: string; u0: number; u1: number; v: number; flat: number; radius: number; height: number; deck: number }
  | { kind: 'bowl'; id: string; u: number; v: number; flat: number; radius: number; height: number; deck: number }
  | { kind: 'wedge'; id: string; u: number; v: number; yaw: number; length: number; width: number; height: number }
  | { kind: 'box'; id: string; u: number; v: number; hw: number; hd: number; height: number; prefab?: string }
  | { kind: 'stairs'; id: string; u: number; v: number; yaw: number; width: number; steps: number; rise: number; run: number; top: number };

/** The transition reaches 2.0 m at d = sqrt(2.5^2 - 0.5^2) = 2.449 m from the flat. */
const TRANS = Math.sqrt(2.5 * 2.5 - 0.5 * 0.5);
/** Bowl outer radius: flat 2.5 + transition + deck 1.5. */
export const BOWL_OUTER = 2.5 + TRANS + 1.5;

export const SKATE_PIECES: readonly SkatePiece[] = [
  // The Long Gutter: a 28 m half-pipe of Tall-One roof gutter along the south side.
  { kind: 'halfpipe', id: 'long-gutter', u0: -16, u1: 12, v: 12, flat: 1.5, radius: 2.5, height: 2, deck: 1.5 },
  // Fennel's deck: a plank platform on legs at the Long Gutter's west end (drop in from it). Fennel's hammock is
  // slung under it (skate/life.ts), so its look is a prefab.
  { kind: 'box', id: 'fennel-deck', u: -17.75, v: 12, hw: 1.75, hd: 5.5, height: 2, prefab: 'gutter-deck-platform' },
  // The Gutter Bowl: round, in the north-west, reached up the bank from the east.
  { kind: 'bowl', id: 'gutter-bowl', u: -10, v: -8, flat: 2.5, radius: 2.5, height: 2, deck: 1.5 },
  { kind: 'wedge', id: 'bowl-bank', u: 4.5, v: -8, yaw: -Math.PI / 2, length: 8.45, width: 3, height: 2 },
  // The street section (north-east): a kicker, a flat rail, a ledge, a platform with a bank and stairs, a downspout.
  { kind: 'wedge', id: 'kicker', u: 2, v: 0, yaw: Math.PI / 2, length: 2, width: 2, height: 0.6 },
  { kind: 'box', id: 'ledge', u: 9, v: -4, hw: 2.5, hd: 0.3, height: 0.45, prefab: 'skate-ledge' },
  { kind: 'box', id: 'platform', u: 16, v: -13, hw: 2.5, hd: 3, height: 0.9 },
  { kind: 'wedge', id: 'platform-bank', u: 16, v: -19.5, yaw: 0, length: 3.6, width: 4, height: 0.9 },
  { kind: 'stairs', id: 'stairs', u: 13.5, v: -13, yaw: -Math.PI / 2, width: 4, steps: 3, rise: 0.3, run: 0.8, top: 0.9 },
];

/** A grindable rail: a straight segment from a to b, heights above ground. `look` says what skate/build.ts draws:
 *  'prefab' = a placed prefab (`prefab`, centred between a and b, facing along it), 'coping' and 'handrail' = a steel
 *  pipe built along the segment, 'edge' = nothing (the steel edge of a ledge prefab). */
export interface SkateRailDef {
  id: string;
  a: { u: number; v: number; y: number };
  b: { u: number; v: number; y: number };
  look: 'prefab' | 'coping' | 'handrail' | 'edge';
  prefab?: string;
}

const GUTTER_LIP = 1.5 + TRANS; // |dv| of the Long Gutter's coping from its centre line
const BOWL_LIP = 2.5 + TRANS;   // radius of the Gutter Bowl's coping

function bowlCoping(): SkateRailDef[] {
  const out: SkateRailDef[] = [];
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    out.push({
      id: `bowl-coping-${i}`, look: 'coping',
      a: { u: -10 + Math.sin(a0) * BOWL_LIP, v: -8 + Math.cos(a0) * BOWL_LIP, y: 2 },
      b: { u: -10 + Math.sin(a1) * BOWL_LIP, v: -8 + Math.cos(a1) * BOWL_LIP, y: 2 },
    });
  }
  return out;
}

export const SKATE_RAILS: readonly SkateRailDef[] = [
  { id: 'flat-rail', a: { u: 7, v: 0, y: 0.47 }, b: { u: 11, v: 0, y: 0.47 }, look: 'prefab', prefab: 'grind-rail' },
  { id: 'ledge-n', a: { u: 6.5, v: -4.3, y: 0.45 }, b: { u: 11.5, v: -4.3, y: 0.45 }, look: 'edge' },
  { id: 'ledge-s', a: { u: 6.5, v: -3.7, y: 0.45 }, b: { u: 11.5, v: -3.7, y: 0.45 }, look: 'edge' },
  { id: 'handrail', a: { u: 13.7, v: -11.2, y: 1.55 }, b: { u: 11.1, v: -11.2, y: 0.6 }, look: 'handrail' },
  // A Tall-One downspout lying on two brackets: round, low, the park's oldest rail.
  { id: 'downspout', a: { u: 2, v: -16, y: 0.5 }, b: { u: 2, v: -10, y: 0.5 }, look: 'prefab', prefab: 'downspout-rail' },
  { id: 'gutter-coping-n', a: { u: -16, v: 12 - GUTTER_LIP, y: 2 }, b: { u: 12, v: 12 - GUTTER_LIP, y: 2 }, look: 'coping' },
  { id: 'gutter-coping-s', a: { u: -16, v: 12 + GUTTER_LIP, y: 2 }, b: { u: 12, v: 12 + GUTTER_LIP, y: 2 }, look: 'coping' },
  ...bowlCoping(),
];

/** A rail in world coordinates (skate/park.ts skateGround().rails): y is absolute world height. */
export interface SkateRail { id: string; ax: number; ay: number; az: number; bx: number; by: number; bz: number }

// ---- The board (skate/board.ts) -------------------------------------------------------------------------------------

/** Push, brake, ollie and grind tuning in one block (feel lives here). */
export const SKATE = {
  gravity: 18,
  /** Rolling friction on paved ground (park, road, pavement) and on anything else (grass, dirt: you slow fast). */
  muPaved: 0.02,
  muRough: 0.35,
  drag: 0.004,
  carve: 2.6,
  carveSpeed: 2,
  grip: 8,
  brakeMu: 0.5,
  /** Push: accel while below pushMax (a push is slower than any vehicle). */
  pushAccel: 5,
  pushMax: 7.5,
  maxSpeed: 16,
  /** Ollie: the pop's vertical speed (apex ~0.75 m), and the hop off a rail. */
  ollieV: 5.2,
  railHopV: 3.6,
  airSpin: 7,
  /** A step up taller than this is a wall: the board stops there (bails above bailWallSpeed). */
  stepUp: 0.12,
  bailWallSpeed: 6,
  /** Landing: more than this between the board's heading and its travel (or its reverse, a switch landing) bails. */
  landYawTol: 0.7,
  /** Leaving a transition steeper than this gradient turns the uphill speed into vertical speed (vert air). */
  vertGradient: 1.5,
  /** Grind snap: horizontal reach to a rail, height window above it, minimum speed. */
  railReach: 0.35,
  railAbove: 0.4,
  railMinSpeed: 2,
  /** Grind friction m/s^2 and the speed it never drops below while on a rail. */
  grindFriction: 0.6,
  grindMinSpeed: 1.5,
  /** A full rail: entered within this of one end and left within it of the other. */
  fullRailEnd: 0.6,
  /** Seconds lying on the ground after a bail before the board can be ridden again. */
  bailS: 1.2,
  maxStep: 1 / 60,
  probe: 0.3,
  normalRate: 14,
} as const;

/** What the board controller reads from the ground (skate/park.ts skateGround()). */
export interface SkateGround {
  /** Absolute world height of the ridable surface (terrain plus the park's pieces). */
  height(x: number, z: number): number;
  /** True on smooth ground (the park, roads, pavements, plazas): low rolling friction. */
  paved(x: number, z: number): boolean;
  rails: readonly SkateRail[];
}

/** One frame of skateboard control (skate/hud.ts skateInput builds it from the keys, pad and touch buttons). */
export interface SkateInput {
  /** -1..1, right positive. Carve on the ground; spin in the air. */
  steer: number;
  /** 0..1 push (stick forward), 0..1 brake (stick back). */
  push: number;
  brake: number;
  /** Edge: ollie now (on the ground) or hop off a rail. */
  ollie: boolean;
  /** Edge: a flip trick (in the air), picked by `stick` through @lawn/trickboard AIR_GESTURES (centre: kickflip). */
  flip: boolean;
  /** Held: grab (in the air), picked by grabFor(1, stick). */
  grab: boolean;
  /** The trick direction: unit disc, x right, y up = forward (the move stick while flip/grab is held). */
  stick: { x: number; y: number };
}

export type BoardMode = 'ground' | 'air' | 'grind' | 'bail';

export interface BoardState {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  /** Board heading (0 faces +z). */
  yaw: number;
  mode: BoardMode;
  /** Seconds in the air this jump; degrees spun since take-off (signed). */
  airT: number;
  spin: number;
  /** Riding backwards (flips on a 180 landing). */
  switchStance: boolean;
  /** The board trick running in the air (BoardTrick id from @lawn/trickboard), its clock, or null. */
  trick: { id: string; t: number } | null;
  /** The grab held in the air (GrabKind id), its clock, or null. */
  grab: { id: string; t: number } | null;
  /** The rail being ground (index into ground.rails), position along it 0..1, direction, speed, grind kind, clock. */
  grind: { rail: number; s: number; dir: 1 | -1; speed: number; kind: string; t: number; fromEnd: boolean } | null;
  /** Seconds left lying down after a bail. */
  bailT: number;
  /** Ground normal (smoothed), and the shown lean -1..1. */
  nx: number; ny: number; nz: number;
  lean: number;
  /** Seconds since the board was made (the combo's clock). */
  t: number;
}

/** What stepBoard reports: @lawn/trickboard PhysEvents (fed straight to createCombo) plus GTA's own. */
export type SkateEvent =
  | PhysEvent
  | { e: 'wall'; speed: number }
  | { e: 'push' }
  | { e: 'fullRail'; rail: number };

// ---- Lines (skate/lines.ts) ------------------------------------------------------------------------------------------

/** A gate of a line: pass within r metres (park frame) of (u, v), in the state `need` asks for. */
export interface LineGate { u: number; v: number; r: number; need: 'any' | 'air' | 'grind' }

export type LineId = 'first-push' | 'bowl-line' | 'long-gutter-line' | 'asphalt-line';

export interface SkateLine {
  id: LineId;
  /** Fennel's name for it (the list of lines nobody has skated). */
  name: string;
  gates: readonly LineGate[];
  /** Seconds from the first gate to the last. A bail or getting off ends the attempt. */
  timeLimit: number;
}

export const SKATE_LINES: readonly SkateLine[] = [
  { id: 'first-push', name: 'First Push', timeLimit: 25, gates: [
    { u: -1, v: 0, r: 2.5, need: 'any' }, { u: 4.3, v: 0, r: 2, need: 'air' }, { u: 9, v: 0, r: 2, need: 'grind' },
  ] },
  { id: 'bowl-line', name: 'Round the Kidney', timeLimit: 30, gates: [
    { u: 2, v: -8, r: 2.5, need: 'any' }, { u: -4.2, v: -8, r: 2, need: 'any' }, { u: -10, v: -8, r: 2.5, need: 'any' },
    { u: -10, v: -13.2, r: 2.5, need: 'air' },
  ] },
  { id: 'long-gutter-line', name: 'The Long Gutter', timeLimit: 35, gates: [
    { u: -17.5, v: 12, r: 2, need: 'any' }, { u: -6, v: 12, r: 2.5, need: 'any' }, { u: 4, v: 15.4, r: 2.5, need: 'air' },
    { u: 9, v: 12 - GUTTER_LIP, r: 2, need: 'grind' },
  ] },
  // Story quest #9 (m09-where-asphalt-sleeps): down the stairs, the ledge, the flat rail.
  { id: 'asphalt-line', name: "Asphalt's Way Down", timeLimit: 30, gates: [
    { u: 16, v: -13, r: 2.5, need: 'any' }, { u: 12.3, v: -11.5, r: 2, need: 'any' }, { u: 9, v: -4, r: 2, need: 'grind' },
    { u: 9, v: 0, r: 2.5, need: 'any' },
  ] },
];

export type LineEvent =
  | { kind: 'gate'; index: number; of: number }
  | { kind: 'done'; time: number }
  | { kind: 'fail'; reason: 'time' | 'bail' | 'off' }
  | null;

// ---- Places, people, runtime -----------------------------------------------------------------------------------------

export interface Spot { x: number; z: number; yaw: number }

/** The Board Library: a rack of spare boards at the north entrance ("take one, leave one"). E here takes a board. */
export const BOARD_LIBRARY: Spot = { x: -36, z: 71.5, yaw: 0 };
export const SKATE_RANGE = 2.5;

export type SkatePersonId = 'fennel' | 'moss' | 'pebble';
export interface SkatePerson { id: SkatePersonId; name: string; spot: Spot }
export const SKATE_PEOPLE: Record<SkatePersonId, SkatePerson> = {
  fennel: { id: 'fennel', name: 'Fennel Gripwax', spot: { x: -48, z: 94.5, yaw: Math.PI / 2 } }, // by his deck
  // Squeegees the bowls dry after rain.
  moss: { id: 'moss', name: 'Moss Squeegee', spot: { x: -41.5, z: 80.5, yaw: Math.PI / 4 } }, // on the bowl floor
  // Films every session on her Gnomlet; has never once stood on a board.
  pebble: { id: 'pebble', name: 'Pebble Nollie', spot: { x: -17, z: 84, yaw: -Math.PI / 2 } },
};

/** The inventory item for the player's own board (bag: "Use" drops it and rides). */
export const SKATEBOARD_ITEM = 'skateboard';

export const SKATE_ACH = {
  firstOllie: 'gta-first-ollie',
  fiveCombo: 'gta-five-trick-combo',
  fullRail: 'gta-full-rail',
} as const;

/** Quest probe names (city/probes.ts, read from the gta-sports-v1 save). Line probes: `skate-line-<LineId>`. */
export const SKATE_PROBES = {
  boardOwned: 'skate-board-owned',
  ollies: 'skate-ollies',
  bestCombo: 'skate-best-combo',
  lines: 'skate-lines',
  fullRails: 'skate-full-rails',
} as const;

export type SkateSoundId = 'skate-roll' | 'skate-pop' | 'skate-land' | 'skate-grind' | 'skate-bail' | 'skate-push';

export const SKATE_QUEST = 'sq-gutter-bowls-sessions';

export interface SkateLineResult { id: LineId; ok: boolean; time: number }

/** Hooks for story quests (E20 #9 m09-where-asphalt-sleeps: startLine('asphalt-line')) and the Gnomlet app. */
export interface SkateApi {
  /** The player owns a board (it is in the bag). */
  boardOwned(): boolean;
  /** Put a board in the player's bag (Fennel's gift, the Board Library). */
  giveBoard(): void;
  /** Drop the owned board at the player's feet and stand on it. Null on success, else why not. */
  dropBoard(): string | null;
  /** Put the player on a board at the line's first gate and arm it. Null when started, else why not. */
  startLine(id: LineId): string | null;
  onLine(cb: (r: SkateLineResult) => void): () => void;
}

/** What app.ts calls. */
export interface Skate {
  /** True when `v` is a skateboard the player rides: app.ts must not step it (stepRider does). */
  drives(v: Vehicle): boolean;
  /** In the vehicle-step slot: `inp` is the frame's input, `raw` the raw input (fire/aim are tricks on a board). */
  stepRider(v: Vehicle, inp: InputState, dt: number, raw: InputState): void;
  /** Every frame: HUD, lines, rentals, people. */
  update(dt: number, raw: InputState): void;
  /** True while the player rides a board: app.ts holds back fire and aim (they are flip and grab). */
  riding(): boolean;
  prompt(x: number, z: number): string | null;
  interact(x: number, z: number): boolean;
  blips(): Blip[];
  api: SkateApi;
  debug(): unknown;
}
