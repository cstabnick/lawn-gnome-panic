// Base building: every shared contract. Plain JSON-safe data. No DOM, no three.js.
import type { ItemStack, RegionId } from '../sim/types';
import type { Tag } from '../items/defs';

export type PieceKind = 'plank-wall' | 'barricade' | 'door' | 'ladder' | 'spike-line' | 'chest' | 'bed' | 'workbench' | 'fire-ring';
export const PIECE_KINDS: readonly PieceKind[] = ['plank-wall', 'barricade', 'door', 'ladder', 'spike-line', 'chest', 'bed', 'workbench', 'fire-ring'];
/** 'edge': a tile edge; 'cell': a tile; 'ladder': one side of an edge that holds a plank wall or a door. */
export type SlotKind = 'edge' | 'cell' | 'ladder';
/** 'x': the edge runs east-west (a line of constant z); 'z': it runs north-south (a line of constant x). */
export type EdgeAxis = 'x' | 'z';
/** -1 = the north side of an 'x' edge or the west side of a 'z' edge; +1 = south / east. */
export type EdgeSide = -1 | 1;
/** Edges `e:x:<i>:<j>` (i = column 0..T-1, j = line 0..T) and `e:z:<i>:<j>` (i = line 0..T, j = row 0..T-1);
 *  cells `c:<i>:<j>` (i = column, j = row, 0..T-1). T = PLOT.tiles. i grows east, j grows south. */
export type SlotKey = string;
export interface Cost { tag: Tag; count: number }
export interface PieceDef {
  kind: PieceKind; name: string; slot: SlotKind; prefab: string;
  cost: readonly Cost[]; tools: readonly Tag[];   // tools: one item with each tag must be in the inventory
  hp: number; seconds: number;                    // seconds: real seconds of building
  height: number;                                 // gm; the collider block's height (0 = no block)
  solid: boolean;                                 // gets a collider block (a door only while closed)
}
/** North-west corner and floor height. The plot is PLOT.tiles x PLOT.tile gm on each side. */
export interface PlotDef { x0: number; z0: number; y: number; region: RegionId }
export interface PieceState {
  id: string;                 // 'piece-<n>'; also the collider block id
  kind: PieceKind;
  slot: SlotKey;              // ladders use the edge key of the wall they lean on
  side: EdgeSide;             // ladders and barricades over a door: the side they are on; 1 for every other piece
  hp: number; maxHp: number;
  open: boolean;              // doors
  hasLock: boolean;           // doors
  locked: boolean;            // doors
  up: boolean;                // ladders: pulled up (no climb route)
  reinforced: boolean;        // barricades
  overDoor: boolean;          // barricades nailed over a closed door on the same edge
  items: ItemStack[];         // chests
}
export interface BaseState { version: 1; seed: number; plot: PlotDef; pieces: PieceState[]; nextId: number }
/** An axis-aligned box, same meaning as BlockDef: x0..x1, z0..z1, from y to y + h. */
export interface Box { x0: number; x1: number; z0: number; z1: number; y: number; h: number }
/** Where a piece's mesh root sits; rotY in radians (three.js rotation.y; 0 = the prefab's front faces +z). */
export interface Placement { x: number; y: number; z: number; rotY: number }
export type ClaimResult = { ok: true; plot: PlotDef } | { ok: false; why: string };
export interface Aim { slot: SlotKey; kind: SlotKind; side: EdgeSide }
export type DamageCause = 'push' | 'hit' | 'away';
