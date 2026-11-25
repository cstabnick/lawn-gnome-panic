// The player's home (E10, L21 + L22): Flat 3B at Saucer Court, loaned by the First Kiln Bank and furnished by the
// player. Shared types and tables only (no DOM, no three.js). Contract: docs/roadmaps/gta-batch-3/E10/contracts.md.
// The layout model is home/layout.ts; the room is built by interiors/showcase/flat3b.ts; the decorate panel is
// home/decorUi.ts; the runtime (property, bank counter, sleep, Gnomlet app, probes) is home/runtime.ts.
import type { PropertyDef } from '../ownership';

/** Save key (saveIO.ts GTA_SAVE_KEYS, cloudSave.ts MERGES: newer side wins). */
export const HOME_KEY = 'gta-home-v1';

/** The interior id of the flat (interiors/showcase/flat3b.ts FLAT_3B_INTERIOR) and its property id (ownership.ts). */
export const FLAT_ID = 'flat-3b';

/** The flat's property (ownership.ts registerProperty). All on loan, booked beside Kiln-Debt (lore R-166, R-169). */
export const FLAT_PROPERTY: PropertyDef = {
  id: FLAT_ID,
  name: 'Flat 3B, Saucer Court',
  price: 1500,
  down: 0,
  blurb: 'One room, two windows, the bank\'s walls. Loaned by the First Kiln Bank.',
  buyHint: 'Signed for at the First Kiln Bank counter.',
};

/**
 * Which kind of home a layout belongs to. Only 'flat' is built now; 'cabin' (a home out in the field, L22) is reserved
 * so the save and the decorate panel already carry the kind.
 */
export type HomeKindId = 'flat' | 'cabin';

/** One placed piece of furniture. Local metres from the room centre (x east, z south), yaw radians (0 faces +z). */
export interface PlacedPiece {
  uid: string;
  prefab: string;
  x: number;
  z: number;
  yaw: number;
}

/** The saved home (HOME_KEY). */
export interface HomeLayout {
  v: 1;
  kind: HomeKindId;
  /** Furniture standing in the room. */
  items: PlacedPiece[];
  /** Pieces owned but not placed: prefab id -> count. */
  stored: Record<string, number>;
  /** WALL_COLOURS / FLOOR_COLOURS ids. */
  wall: string;
  floor: string;
  /** Next uid number (uids are `p<n>`). */
  next: number;
  /** Pieces ever placed (the Interior Decorator achievement counts these; moving a piece does not count again). */
  placedEver: number;
}

/** A piece the furniture shop sells. `w` x `d` is its footprint in metres at yaw 0 (measured from the prefab). */
export interface FurnitureStock {
  prefab: string;
  name: string;
  /** Acorns. */
  price: number;
  w: number;
  d: number;
  /** Hangs on a wall (snapped to the nearest wall, facing into the room, at `wallY` metres up). */
  wall?: boolean;
  wallY?: number;
  /** Has a "Sleep" spot (bed, bedroll). */
  sleep?: boolean;
  /** Walk-over (a rug): no collider, never blocks other pieces. */
  flat?: boolean;
}

/** The shop's stock (footprints measured from @lawn/prefabs). Order = shop order. */
export const FURNITURE_SHOP: readonly FurnitureStock[] = [
  { prefab: 'bed', name: 'Bed', price: 120, w: 1.0, d: 2.0, sleep: true },
  { prefab: 'bedroll', name: 'Bedroll', price: 15, w: 0.8, d: 1.8, sleep: true },
  { prefab: 'couch', name: 'Couch', price: 150, w: 2.6, d: 1.0 },
  { prefab: 'armchair', name: 'Armchair', price: 90, w: 0.9, d: 0.6 },
  { prefab: 'rocking-chair', name: 'Rocking Chair', price: 65, w: 0.6, d: 0.7 },
  { prefab: 'chair', name: 'Chair', price: 25, w: 0.5, d: 0.5 },
  { prefab: 'stool', name: 'Stool', price: 15, w: 0.45, d: 0.45 },
  { prefab: 'table', name: 'Table', price: 60, w: 1.2, d: 0.8 },
  { prefab: 'side-table', name: 'Side Table', price: 30, w: 0.5, d: 0.5 },
  { prefab: 'rug', name: 'Rug', price: 40, w: 2.2, d: 1.5, flat: true },
  { prefab: 'lamp', name: 'Lamp', price: 30, w: 0.35, d: 0.35 },
  { prefab: 'plant', name: 'Pot Plant', price: 20, w: 0.55, d: 0.45 },
  { prefab: 'painting', name: 'Painting', price: 45, w: 0.9, d: 0.15, wall: true, wallY: 1.2 },
  { prefab: 'wardrobe', name: 'Wardrobe', price: 110, w: 1.2, d: 0.7 },
  { prefab: 'cupboard', name: 'Cupboard', price: 85, w: 1.2, d: 0.55 },
  { prefab: 'bookshelf', name: 'Bookshelf', price: 80, w: 1.2, d: 0.45 },
  { prefab: 'chest-of-drawers', name: 'Chest of Drawers', price: 70, w: 1.0, d: 0.6 },
  { prefab: 'grandfather-clock', name: 'Grandfather Clock', price: 200, w: 0.5, d: 0.4 },
  { prefab: 'coat-rack', name: 'Coat Rack', price: 25, w: 0.85, d: 0.55 },
  { prefab: 'tv-set', name: 'Television', price: 160, w: 1.4, d: 0.8 },
  { prefab: 'fridge', name: 'Fridge', price: 140, w: 1.1, d: 1.1 },
  { prefab: 'stove', name: 'Stove', price: 130, w: 0.9, d: 0.9 },
  { prefab: 'sink', name: 'Sink', price: 60, w: 0.65, d: 0.5 },
  { prefab: 'crate', name: 'Crate', price: 5, w: 0.65, d: 0.65 },
];

/** Wall paint (the room's wall and trim colours). The first is the bank's beige. */
export const WALL_COLOURS: readonly { id: string; name: string; color: number }[] = [
  { id: 'bank-beige', name: 'Bank Beige', color: 0xe8dcc4 },
  { id: 'sage', name: 'Sage', color: 0xb9c9a7 },
  { id: 'duck-egg', name: 'Duck Egg', color: 0xbfdcd8 },
  { id: 'terracotta', name: 'Terracotta', color: 0xd99a76 },
  { id: 'hat-red', name: 'Hat Red', color: 0xc85a54 },
  { id: 'night-blue', name: 'Night Blue', color: 0x5b6f99 },
];

/** Floor finish. The first is the bank's bare boards. */
export const FLOOR_COLOURS: readonly { id: string; name: string; color: number }[] = [
  { id: 'bare-boards', name: 'Bare Boards', color: 0x9c7a55 },
  { id: 'oak', name: 'Oak', color: 0xb98b56 },
  { id: 'walnut', name: 'Walnut', color: 0x6d4c35 },
  { id: 'lino', name: 'Lino', color: 0x9fb3a0 },
  { id: 'tiles', name: 'Kitchen Tiles', color: 0xd8d4cc },
];

/**
 * The flat's room (must match flat3b.ts: size 12 x 10, door on the south wall at local (0, 4.8)). Pieces stay
 * `margin` m inside the walls and out of the doorway (a `doorClear` square in front of the door). Positions snap to
 * `grid` metres; yaw snaps to quarter turns.
 */
export const FLAT_ROOM = { w: 12, d: 10, margin: 0.15, door: { x: 0, z: 4.8 }, doorClear: 1.6, grid: 0.25 } as const;

/** What a new flat holds on move-in day: the bank's bedroll, a lamp, a chair turned to the window, a crate for a table. */
export const STARTER_ITEMS: readonly Omit<PlacedPiece, 'uid'>[] = [
  { prefab: 'bedroll', x: -3.75, z: -2.5, yaw: Math.PI / 2 },
  { prefab: 'lamp', x: -2.5, z: -3.5, yaw: 0 },
  { prefab: 'chair', x: 1.5, z: -2.5, yaw: Math.PI },
  { prefab: 'crate', x: -0.5, z: 0.75, yaw: 0 },
];
