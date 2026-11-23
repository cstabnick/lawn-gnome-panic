// The elevated roads of Turfton (Epic H1, docs/roadmaps/gta-highways.md): plain data, no three.js, no DOM.
//
// A skyway is a deck on a centre-line polyline. Each control point says how high the deck top stands above the land
// (terrain.ts heightAt) right there; between control points the deck top runs in a straight grade. A control point with
// h 0 is a ramp foot: the deck meets the ground there and a car drives on. Where the deck stands less than
// SKYWAY.solidBelow above the land it is a solid embankment (walls down to the ground); higher up it is a viaduct on
// column bents, and anything shorter than the gap drives underneath.
//
// Rules the deck test (highways/deck.test.ts) checks:
//   - every solid (low) stretch lies on a leg along x or along z, so its side walls are tight axis-aligned boxes;
//   - nothing in world.boxes stands inside a solid stretch, or pokes up into a viaduct's underside.

export interface SkywayPoint {
  readonly x: number;
  readonly z: number;
  /** Deck top above the land at this point, metres. 0 = a ramp foot on the ground. */
  readonly h: number;
}

export interface SkywayDef {
  readonly id: string;
  /** Shown on the map and in toasts. */
  readonly name: string;
  /** Centre line, start to end. At least two points. */
  readonly points: readonly SkywayPoint[];
  /** Deck width between the rails, metres. */
  readonly width: number;
  /** True: the deck stops in mid-air at its last point (a stunt span, no ramp down). */
  readonly openEnd?: boolean;
}

/** Shared skyway tuning. */
export const SKYWAY = {
  /** A body's ground may step up onto a deck this far above it (groundAt, terrain.ts). */
  step: 0.6,
  /** Rail height above the deck top. */
  railHeight: 0.9,
  /** Deck slab thickness: a viaduct's underside is this far below its top. */
  slab: 1,
  /** Below this deck height above the land the deck is a solid embankment; at or above it, a viaduct. */
  solidBelow: 4,
  /** Column bents on a viaduct, at most this far apart along the centre line. */
  bentSpacing: 24,
  /** Column cross-section (square), metres. Columns stand just outside the rails. */
  columnSize: 1.2,
  /** Sample spacing along the centre line for meshes, walls and the map. */
  sample: 4,
  /** How tall a ground body counts as when it meets the side of a deck (wall test). */
  bodyHeight: 1.8,
} as const;

/**
 * The Turfton Skyway: up from the dead end of the z = -60 street at the city's east edge, over Ring Road North-East and
 * the airfield spur, down onto the east highway in the Dust Flats. The Unfinished Span: a stub that climbs north of
 * the east highway and stops in mid-air above it (Local 404 walked off the job).
 */
export const SKYWAYS: readonly SkywayDef[] = [
  {
    id: 'turfton-skyway',
    name: 'Turfton Skyway',
    width: 11,
    points: [
      { x: 192, z: -60, h: 0 },
      { x: 272, z: -60, h: 7.5 },
      { x: 360, z: -60, h: 7.5 },
      { x: 400, z: -46, h: 7.5 },
      { x: 480, z: -46, h: 7.5 },
      { x: 535, z: -46, h: 6 },
      { x: 550, z: -31, h: 4.6 },
      { x: 550, z: 20, h: 0 },
    ],
  },
  {
    id: 'unfinished-span',
    name: 'The Unfinished Span',
    width: 9,
    openEnd: true,
    points: [
      { x: 610, z: -56, h: 0 },
      { x: 610, z: 4, h: 6.5 },
    ],
  },
];
