// The Lost & Found Speedway: the race circuit on the Dust Flats' alkali pan, north-east of the airfield.
// Pure data and geometry (no three.js, no DOM, no game imports): the centre line, its height profile (rises, banked
// corners, jumps), the checkpoint gates, the start grid, the pit lane and where things stand. terrain.ts reads
// applyTrackRelief() to raise the ground under the track; everything else (meshes, timing, races) reads the samples.
//
// Coordinates are world metres, x east, z south; yaw 0 faces +z and yaw = atan2(dx, dz), like the rest of the game.
// `s` is the distance along the centre line from the start/finish line, in the direction of racing, 0..TRACK_LENGTH.

import {
  TrackGateTracker, createTrack, crossedGate, type Gate, type Track, type TrackControl, type TrackDef, type TrackJump,
  type TrackSample, type TrackSpot,
} from './trackDef';

export { crossedGate };
export type { Gate, TrackControl, TrackJump, TrackSample, TrackSpot };

/** The pit lane: a lane inside the main straight, entered after the last corner and left before turn 1. */
export const PIT_LANE: readonly [number, number][] = [[688, -368], [710, -384], [805, -384], [826, -369]];
export const PIT_LANE_WIDTH = 8;

export const TRACK = {
  id: 'lost-and-found',
  name: 'Lost & Found Speedway',
  /** Road width (m). */
  width: 14,
  /** Flat run-off each side of the road before the ground starts to fall away (m). */
  shoulder: 4,
  /** Where raised ground blends back to the pan, beyond the shoulder (m). Kept under half the closest gap between two parts of the track. */
  fade: 9,
  /** Barriers stand this far from the centre line (m). */
  barrierOffset: 12.5,
  /**
   * The centre line, in racing order (clockwise on the map, north up). Closed: the last point joins the first.
   * Index 0 sits on the main straight, before the start line (the start line is at START_OFFSET along it).
   */
  control: [
    { x: 650, z: -362 }, { x: 760, z: -362 }, { x: 835, z: -366 },
    { x: 860, z: -395, bank: 1.2 }, { x: 862, z: -450, lift: 1.5 }, { x: 850, z: -520, lift: 3 },
    { x: 862, z: -562, lift: 3.5, bank: 1.5 }, { x: 838, z: -584, lift: 3.5, bank: 2.2 }, { x: 800, z: -572, lift: 3 },
    { x: 760, z: -560, lift: 2.5 }, { x: 715, z: -575, lift: 2 }, { x: 672, z: -562, lift: 1.5 },
    { x: 638, z: -578, lift: 1.2, bank: 1.5 }, { x: 617, z: -552, lift: 1, bank: 1.8 }, { x: 622, z: -500, lift: 0.5 },
    { x: 648, z: -468, bank: 1 }, { x: 700, z: -474 }, { x: 742, z: -515, lift: 1.5 },
    { x: 795, z: -512, lift: 2.5, bank: 1 }, { x: 821, z: -472, lift: 2.5, bank: 1.8 }, { x: 790, z: -436, lift: 1.5, bank: 1 },
    { x: 720, z: -426, lift: 0.5 }, { x: 662, z: -420 }, { x: 628, z: -405, bank: 1.6 }, { x: 625, z: -378, bank: 1.2 },
  ] as readonly TrackControl[],
  /** Jumps, by distance from the start line (negative: back from the line). track.test.ts checks each one is a real kicker. */
  jumps: [
    { id: 'rake-hop', name: 'Rake-Handle Hop', s: 405, rise: 1.4, up: 9, down: 4 },
    { id: 'frisbee-crest', name: 'Frisbee Crest', s: -224, rise: 1.0, up: 8, down: 5 },
  ] as readonly TrackJump[],
  /** The flat site the track sits on: a `reserve` marker in dust-flats.level.json with the same centre and half sizes. */
  reserve: { x: 741, z: -467, hw: 143, hd: 149 },
  /** Gates (checkpoints) per lap, evenly spaced; gate 0 is the start/finish line. */
  gates: 12,
  closed: true,
  startOffset: 85,
  surface: 'asphalt',
  relief: 'raise',
  extraRoads: [{ points: PIT_LANE, width: PIT_LANE_WIDTH }],
} as const satisfies TrackDef;

/** Distance along the centre line from control point 0 to the start/finish line (m). */
export const START_OFFSET = TRACK.startOffset;

/** The Speedway as a Track (trackDef.ts). The free functions below are the Speedway's, kept for the older importers. */
export const SPEEDWAY: Track = createTrack(TRACK);

export const SAMPLE_STEP = 1;

/** Every centre-line sample, from the start line round to just before it again. Built once. */
export const trackSamples = (): readonly TrackSample[] => SPEEDWAY.samples();
/** Lap length (m). */
export const trackLength = (): number => SPEEDWAY.length();
/** The sample at distance `s` (wrapped into the lap, nearest sample). */
export const sampleAt = (s: number): TrackSample => SPEEDWAY.sampleAt(s);
/** A point `lat` metres left of the centre line (negative = right) at distance `s`, and the direction of travel there. */
export const trackFrame = (s: number, lat = 0): { x: number; z: number; yaw: number } => SPEEDWAY.frame(s, lat);
/** Height of the road surface above the pan at lateral offset `lat` from sample `p`. */
export const roadLiftAt = (p: TrackSample, lat: number): number => SPEEDWAY.roadLiftAt(p, lat);
/** The nearest centre-line sample to (x, z), within `reach` metres (null if none). See Track.locate. */
export const locate = (x: number, z: number, reach = 40, hint = -1, window = 60): TrackSpot | null => SPEEDWAY.locate(x, z, reach, hint, window);
/** True when (x, z) is on the paved road or the pit lane. */
export const onTrackRoad = (x: number, z: number): boolean => SPEEDWAY.onRoad(x, z);
/** True when (x, z) is on the road or its run-off (within the barriers). */
export const onTrack = (x: number, z: number): boolean => SPEEDWAY.onTrack(x, z);
/** The checkpoint gates: TRACK.gates of them, evenly spaced; gates()[0] is the start/finish line. */
export const gates = (): readonly Gate[] => SPEEDWAY.gates();

/** Lap counting through a track's gates (the Speedway's unless another track is given). */
export class GateTracker extends TrackGateTracker {
  constructor(track: Track = SPEEDWAY) {
    super(track);
  }
}

/** Raise the terrain grid under the Speedway (terrain.ts now applies every registered track: tracks.ts). */
export const applyTrackRelief = (g: Float32Array, N: number, H: number, S: number): void => SPEEDWAY.applyRelief(g, N, H, S);

// ---- Places around the track ------------------------------------------------------------------------------------------
/**
 * A flat rectangle spectators stand on (a grandstand tier, a cooler lid...), world coordinates: centre (x, z), the
 * surface height y (absolute), the yaw the crowd faces (towards the track), w across that facing and d front to back.
 */
export interface Deck { x: number; z: number; y: number; yaw: number; w: number; d: number }

/** The start grid: slot 0 is pole. Two columns, 8 m apart in rows, staggered. */
export const gridSlot = (slot: number): { x: number; z: number; yaw: number } => SPEEDWAY.gridSlot(slot);

/**
 * Pay 'n' Glaze (Speedway branch): the same drive-through building as Turfton's (prefab gta-pay-n-glaze, open along z),
 * entered from the pit lane. The bay is the building's centre, like Turfton's.
 */
export const SPEEDWAY_GLAZE = { x: 800, z: -399, footprint: 16, yaw: 0, bay: { x: 800, z: -399, radius: 7 } } as const;

/** Where the race director stands (the 'speedway' quest giver; giver/speedway marker in dust-flats.level.json). */
export const RACE_DESK = { x: 742, z: -393 } as const;

/** The podium behind the race desk, facing the pit lane (+z): steps 1.5 (centre), 1.0 (x - 2) and 0.7 (x + 2) high, 2 m square. */
export const PODIUM = { x: 742, z: -400 } as const;

/** A distance along the lap; a negative one counts back from the line (so places late in the lap survive a longer lap). */
export const wrapS = (s: number): number => ((s % trackLength()) + trackLength()) % trackLength();

/**
 * Gaps in the barriers, as distance ranges along the lap (0..length, written back from the line where negative).
 * `side`: 'left' is +n (the outside of the main straight, south), 'right' is -n. The right-hand barrier along the main
 * straight doubles as the pit wall.
 */
export interface BarrierGap { from: number; to: number; side: 'left' | 'right'; why: string }
export const BARRIER_GAPS: readonly BarrierGap[] = ([
  { from: -58, to: -32, side: 'right', why: 'pit lane entry' },
  { from: 78, to: 98, side: 'right', why: 'pit lane exit' },
  { from: 40, to: 58, side: 'left', why: 'the access road from the east-outer highway' },
] as BarrierGap[]).map((g) => ({ ...g, from: wrapS(g.from), to: wrapS(g.to) }));
