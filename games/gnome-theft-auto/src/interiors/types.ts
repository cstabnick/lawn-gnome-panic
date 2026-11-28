// Interiors and rooftops (E05): the shared types. Contract doc: docs/roadmaps/gta-batch-3/E05/contracts.md.
// Coordinates: world metres, +x east, +z south. "Local" = inside one interior: origin at the room centre on the floor.
import type * as THREE from 'three';
import type { GnomeLook } from '@lawn/gnome';
import type { BiomeId } from '../types';

/** A position and facing (yaw 0 faces +z, as everywhere in the game). */
export interface Pose { x: number; z: number; yaw: number }

/** Room colours, 0xRRGGBB. `light` tints the indoor hemisphere light while the player is inside. */
export interface InteriorTheme { floor: number; wall: number; trim: number; ceiling: number; light: number }

/** Named themes (INTERIOR_THEMES in registry.ts). */
export type InteriorThemeId = 'shop' | 'club' | 'flat' | 'office' | 'burrow';

/**
 * One interior. `door` is the world spot outside the building where "Enter <name>" shows; `exit` is where the player is
 * put (world) on leaving. `size` is the room's inner size in metres (w along x, d along z, h height). Up to 180 x 180
 * is a normal pocket; anything larger (up to 600 x 600, e.g. E17's mole halls) gets a large pocket automatically.
 */
export interface InteriorDef {
  id: string;
  name: string;
  door: Pose;
  exit: Pose;
  size: { w: number; d: number; h: number };
  theme: InteriorThemeId | InteriorTheme;
  /** The door prompt; default `Enter <name>`. */
  prompt?: string;
  /** Builds the room with the kit (local coordinates). Called on every entry: the room is built on entry, disposed on leaving. */
  build(kit: InteriorKit): void;
  /** Return a reason (shown as a toast) to keep the door shut, or null to let the player in. */
  locked?(): string | null;
  /** Called after the player is inside / just after they left. */
  onEnter?(): void;
  onLeave?(): void;
  /** The ambience bed while inside (sound/bus.ts setAmbienceOverride): a biome's bed heard through the walls, or 'silent' (default). */
  ambience?: BiomeId | 'silent';
  /** No world door prompt (the interior is only reached by enterInterior(id), e.g. from a lift or a quest). */
  hiddenDoor?: boolean;
}

/** An in-room action (a bed, a counter, a lift). Local x, z. */
export interface InteriorSpot { id: string; x: number; z: number; prompt: string; run(): void }

/** A resident standing or sitting in the room. Local x, z. `line` is said (toast) when the player talks to them. */
export interface InteriorNpc {
  id: string; x: number; z: number; yaw: number;
  name?: string; look?: Partial<GnomeLook>; line?: string; sit?: boolean;
}

/** Options for kit.put. */
export interface PutOpts {
  /** Add a box collider from the prefab's bounds (default true). Rugs, posters and small things: false. */
  solid?: boolean;
  /** Scale so the widest side (by 'w', default) or the height (by 'h') is `size` metres. Default: prefab's own size. */
  size?: number;
  by?: 'w' | 'h';
  /** Lift above the floor (on a counter top), metres. */
  y?: number;
  /** Multiply the prefab's colours by this tint (buildPrefab's tint option). */
  tint?: number;
}

/**
 * What a def's build() gets. Every position is local (metres from the room centre on the floor). Objects (furniture,
 * props, items) must be prefabs from @lawn/prefabs (kit.put); kit.block is for architecture only (counter tops, a dais).
 */
export interface InteriorKit {
  readonly id: string;
  readonly name: string;
  /** Every mesh of the room goes in here (the runtime places it at the pocket origin). */
  readonly group: THREE.Group;
  readonly theme: InteriorTheme;
  readonly size: { w: number; d: number; h: number };
  /** Floor, four walls (colliders), ceiling and skirting. Defaults: the def's size and theme. Call it first. */
  room(opts?: { w?: number; d?: number; h?: number; theme?: InteriorThemeId | InteriorTheme }): void;
  /** The way out: a door frame against the wall at local (x, z), facing yaw (into the room). Adds the "Leave <name>" spot and the default spawn 1.5 m in front of it. */
  door(x: number, z: number, yaw: number): void;
  /** Where the player appears on entering (default: in front of kit.door). */
  spawn(x: number, z: number, yaw: number): void;
  /** A prefab stood on the floor at local (x, z), turned yaw. */
  put(prefabId: string, x: number, z: number, yaw?: number, opts?: PutOpts): THREE.Object3D;
  /** A plain coloured box for architecture: centre x, z, bottom at opts.y (0), solid (default true) adds a collider. */
  block(w: number, h: number, d: number, x: number, z: number, opts?: { y?: number; color?: number; solid?: boolean; emissive?: number }): THREE.Mesh;
  /** A window on a wall: a pane w x h with its sill at y, centre (x, z), facing yaw (into the room). Glows warm at night, sky blue by day. */
  window(x: number, z: number, yaw: number, w?: number, h?: number, y?: number): void;
  /** A sign or poster: text drawn on a canvas, on a plane w x h centred at (x, y, z), facing yaw. '\n' breaks lines. */
  sign(text: string, x: number, y: number, z: number, yaw: number, opts?: { w?: number; h?: number; bg?: number; fg?: number }): void;
  /** An in-room action, shown within interact range. */
  spot(s: InteriorSpot): void;
  /** A resident (built with makeGnome). With `line`, they get a "Talk to <name>" spot. */
  npc(n: InteriorNpc): void;
  /** Stairs or a lift at (x, z) to another interior (`to` an interior id) or out to a world point (`to` a {x, y, z, yaw}). */
  stairsTo(x: number, z: number, to: string | { x: number; y: number; z: number; yaw: number }, prompt?: string): void;
}

/** What the kit collected while building (the runtime reads it). Local coordinates. */
export interface InteriorBuild {
  boxes: { minX: number; maxX: number; minZ: number; maxZ: number; h: number }[];
  spots: InteriorSpot[];
  npcs: InteriorNpc[];
  spawn: Pose | null;
  exitDoor: Pose | null;
  /** Window panes (the runtime re-tints their material by the night factor). */
  windows: THREE.Mesh[];
}

/**
 * A walkable roof. `y` is the walking surface. `solid`: a box collider already holds the roof up (towers), so only
 * aircraft need this entry; false: this entry IS the floor (the Double Pot slab) and terrain.ts groundAt stands bodies
 * on it. `parapet`: true = a 1.1 m wall round the whole rim, or the sides to wall ('n' = minZ edge, 's' = maxZ, 'w' =
 * minX, 'e' = maxX). `pad`: a clear landing circle (no parapet across it, no crown gear inside it).
 */
export interface Rooftop {
  id: string;
  name?: string;
  minX: number; maxX: number; minZ: number; maxZ: number;
  y: number;
  solid: boolean;
  parapet: boolean | ('n' | 's' | 'e' | 'w')[];
  pad?: { x: number; z: number; r: number };
}
