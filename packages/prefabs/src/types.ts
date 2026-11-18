// The prefab format. A prefab is plain data: a list of primitive parts, each a shape, a size, a place and a colour.
// buildPrefab() turns it into a THREE.Group; prefabIcon() renders it to a picture for UI slots.
//
// Units: 1 = one gnome's height. A gnome's hand is a 0.06-radius ball. A dagger is about 0.3 long, a sword 0.55,
// a potion 0.2 tall, a shield 0.45 across, a chest 0.5 wide.
// Origin: every prefab stands on the ground at y = 0, centred on x and z. Its front faces +z (a chair's seat opens
// toward +z, a chest's lock is on +z, a hearth's fire faces +z). Long hand-held things stand upright
// (handle at the bottom, +y up the blade or shaft) and give `grip`, the point a hand holds.

import type { Swatch } from './palette';

export type Vec3 = readonly [number, number, number];

/**
 * Shapes and what `d` (dimensions) means for each:
 * - box:   [width x, height y, depth z]
 * - cyl:   [radius top, radius bottom, height]            upright along y
 * - cone:  [radius, height]                                point up (+y)
 * - ball:  [radius]                                        use `scale` to squash it
 * - ring:  [radius, tube radius, arc degrees?]             a torus lying in the x-y plane (a hoop facing +z)
 * - pill:  [radius, length]                                a capsule upright along y (length excludes the end caps)
 * - wedge: [width x, height y, depth z]                    a ramp: full height at +z, zero at -z (centred like a box)
 */
export type ShapeKind = 'box' | 'cyl' | 'cone' | 'ball' | 'ring' | 'pill' | 'wedge';

export interface Part {
  s: ShapeKind;
  d: readonly number[];
  /** Optional part identifier set on the built mesh (`mesh.name` and `mesh.userData.part`). */
  name?: string;
  /** Optional group/pivot name under the prefab root (see `PrefabDef.pivots`). */
  group?: string;
  /** Centre of the shape in prefab-local coordinates. Default [0, 0, 0]. */
  at?: Vec3;
  /** Rotation in DEGREES, applied x then y then z. */
  rot?: Vec3;
  /** Non-uniform scale after the shape is built (squash a ball into an egg). */
  scale?: Vec3;
  /**
   * A palette name, a 0xRRGGBB number, 'tint' (the build's main colour; falls back to the prefab's `tint`)
   * or 'trim' (the build's second colour; falls back to the prefab's `trim`).
   */
  c: Swatch | number | 'tint' | 'trim';
  /** Unlit and slightly bright: gems, glows, flames, magic. */
  glow?: boolean;
  /** Opacity 0..1 for see-through parts. Parts coloured 'glass' default to 0.35 so the liquid inside shows. */
  alpha?: number;
  /** Radial segments for round shapes. Default 10 (8 for balls). Keep it low: the look is chunky and flat-shaded. */
  seg?: number;
  /** Also add a copy mirrored across x = 0 (at.x and rot.y/rot.z flipped). For pairs: boots, gloves, eyes, horns. */
  mirror?: boolean;
}

export type Category =
  | 'weapon'      // swung, thrown or shot
  | 'shield'
  | 'armor'       // worn: head, body, hands, feet, neck
  | 'tool'        // a job, not a fight: trowel, rake, bucket, lantern
  | 'consumable'  // potions, tonics, oils
  | 'food'
  | 'material'    // crafting stuff, drops, ore, wood
  | 'trinket'     // rings, amulets, charms
  | 'document'    // letters, scrolls, books, maps
  | 'key'
  | 'container'   // chests, sacks, jars, barrels
  | 'furniture'   // indoors: beds, tables, hearths, shelves
  | 'prop'        // outdoor world dressing: signs, lamps, fences, rocks
  | 'gnomeokemon'; // Gnomokemon creatures themed off Gnomomia lore

/** What a game can do with it. A prefab can have several. */
export type Use =
  | 'hold'        // in a hand (has `grip`)
  | 'swing' | 'throw' | 'shoot' | 'cast' | 'block'
  | 'wear-head' | 'wear-body' | 'wear-legs' | 'wear-hands' | 'wear-feet' | 'wear-neck' | 'wear-finger' | 'wear-back'
  | 'drink' | 'eat' | 'read' | 'open' | 'unlock' | 'light' | 'dig' | 'chop' | 'mine' | 'fish' | 'craft'
  | 'place'       // stands in the world
  | 'sit' | 'collect';

export interface PrefabDef {
  /** kebab-case, unique across the whole library. */
  id: string;
  name: string;
  category: Category;
  uses: readonly Use[];
  /** Free words for search and for matching item names: 'iron', 'blade', 'magic', 'garden'. */
  tags: readonly string[];
  /** Emoji this prefab can stand in for (a game's emoji item gets this model). Without the U+FE0F selector. */
  emoji: readonly string[];
  /** Default colour for parts with c: 'tint'. */
  tint?: Swatch | number;
  /** Default colour for parts with c: 'trim'. */
  trim?: Swatch | number;
  /** 'wall': hangs on a wall at its own height (a painting, a shelf), so it does not stand at y = 0. Default 'floor'. */
  mount?: 'floor' | 'wall';
  /** Where a hand holds it, in the prefab's own coordinates. Required when uses includes 'hold'. */
  grip?: Vec3;
  /** Where a gnome sits on it (top of the seat, facing +z), in prefab-local coordinates. Required when uses includes 'sit'. */
  seat?: Vec3;
  /** Where a gnome sits to rest near it (e.g. a hearth or campfire), in prefab-local coordinates. */
  rest?: {
    /** Fixed local [x, y, z] spot to sit (e.g. in front of a hearth). Omit for 360-degree fires like a campfire. */
    at?: Vec3;
    /** Local distance from the prefab centre to sit (when `at` is omitted) and warmth radius. */
    radius: number;
  };
  /** Named pivot points in prefab-local coordinates for articulated sub-assemblies (e.g. levers, reels, doors). */
  pivots?: Readonly<Record<string, Vec3>>;
  /** Where a gnome stands and where a close-up camera frames it when operating/using this prefab. */
  interact?: PrefabInteract;
  /** One plain line for developers: what it is and how to use it. Shown in the gallery. */
  about: string;
  /**
   * In-world examine lines, 4 or more, each one sentence or two (at most 160 characters). A game shows one at random,
   * or cycles them on repeated examines. Mix: what it looks like up close, a saying or half-remembered myth about it,
   * a practical tip, and a dry joke. Gnomes never know what a garden object really is (a thimble is just a helm).
   */
  examine: readonly string[];
  parts: readonly Part[];
  /** Point lights (a hearth's fire, a lamp). Skipped in icons and when BuildOptions.lights is false. */
  lights?: readonly PrefabLight[];
}

export interface PrefabInteract {
  /** Local [x, y, z] spot where a gnome stands to use this prefab. */
  stand?: Vec3;
  /** Local [x, y, z] point the gnome and camera look at. */
  lookAt?: Vec3;
  /** Local [x, y, z] camera position when focusing on this prefab. */
  camera?: Vec3;
}

export interface PrefabLight {
  at: Vec3;
  c: Swatch | number;
  intensity: number;
  /** Range in units. */
  distance: number;
}

export interface BuildOptions {
  /** Colour for 'tint' parts: a rarity colour, a team colour, a dye. */
  tint?: Swatch | number;
  /** Colour for 'trim' parts. */
  trim?: Swatch | number;
  /** Uniform scale. Default 1. */
  scale?: number;
  /** Cast shadows. Default true. */
  shadows?: boolean;
  /** Add the prefab's point lights. Default true. */
  lights?: boolean;
}
