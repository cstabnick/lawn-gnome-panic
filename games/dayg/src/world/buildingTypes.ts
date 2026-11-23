// Building interiors: what an author writes (BuildingDef) and what it expands into (BuildingParts).
// Units gm (1 three.js unit); x grows east, z grows south. Every rect is axis-aligned. Pure data: no three.js.
import type { ContainerDef, ContainerType, ItemId, Rect, RegionId } from '../sim/types';
import type { BlockDef, ClimbRouteDef, PitDef, PropDef, RouteKind, Side, SpotDef, SpotKind } from './types';

export type BuildingStyle = 'plank' | 'brick' | 'marble' | 'stone' | 'cottage';
export type BuildingRole = 'wall' | 'inner' | 'lintel' | 'floor' | 'roof' | 'stair' | 'shelf' | 'furniture';

/** A gap in a wall. `at` = gm along the wall from its start (shell: the footprint's x0 for n/s walls, z0 for e/w walls;
 *  inner wall: its own x0 or z0) to the gap's near edge. The gap runs from the wall's base + sill up `height` gm. */
export interface OpeningDef { id: string; at: number; width: number; height: number; sill?: number }
/** A gap in the shell. door: true = a way in (sill 0, at least DOOR.minWidth x DOOR.minHeight). */
export interface ShellOpeningDef extends OpeningDef { side: Side; door?: boolean }
/** An inner wall: one box from y to y + h, long along x when (x1 - x0) >= (z1 - z0), else along z. */
export interface WallDef { id: string; x0: number; x1: number; z0: number; z1: number; y: number; h: number; openings: OpeningDef[] }
/** A floor slab whose top is storeys[storey] (storey >= 1). holes: stairwells, cut out of rect. thick default 0.4. */
export interface FloorDef { storey: number; rect: Rect; holes?: Rect[]; thick?: number }
/** A flight of solid steps over rect, rising toward side `up`, from fromY to toY (the top step's top is toY - 0.1). */
export interface StairDef { id: string; rect: Rect; up: Side; fromY: number; toY: number }
/** Furniture and shelves: one solid box each. */
export interface BoxDef { id: string; role: 'shelf' | 'furniture'; x0: number; x1: number; z0: number; z1: number; y: number; h: number }
/** A fixed climb route on one of this building's blocks, by local id (a box id, `${stair.id}-${k}`, `${wall.id}-${i}`). */
export interface RouteSpec { block: string; side: Side; kind: RouteKind; at: number }
export interface BuildingContainerDef { id: string; type: ContainerType; x: number; y: number; z: number; guaranteed?: ItemId[] }
export interface BuildingSpotDef { id: string; kind: SpotKind; x: number; y: number; z: number }

export interface BuildingDef {
  id: string; name: string; region: RegionId; style: BuildingStyle;
  /** true while the layout is not authored yet: expands to nothing and is not checked. */
  draft?: boolean;
  footprint: Rect;                 // outer faces of the shell
  storeys: number[];               // floor tops, ascending; storeys[0] is the ground floor (0, or -sunk)
  sunk?: number;                   // the ground floor is a pit this deep, cut to the interior inset 0.2
  shell: { thick: number; height: number; openings: ShellOpeningDef[] };
  roof: { thick: number; eaves: number; ridge?: number };
  walls: WallDef[]; floors: FloorDef[]; stairs: StairDef[]; boxes: BoxDef[];
  routes: RouteSpec[]; containers: BuildingContainerDef[]; spots: BuildingSpotDef[]; props: PropDef[];
}

export interface DoorInfo {
  id: string; building: string; side: Side;
  x: number; z: number; y: number;          // gap centre on the wall's mid-line; y = the gap's bottom
  width: number; height: number;
  rect: Rect;                               // the gap through the wall (opening width x wall thickness)
  inX: number; inZ: number; outX: number; outZ: number; // DOOR.approach gm inside / outside the wall faces
}
export interface StairInfo { id: string; rect: Rect; fromY: number; toY: number; footX: number; footZ: number; topX: number; topZ: number }

export interface BuildingParts {
  def: BuildingDef;
  blocks: BlockDef[];                       // ids start with `${BUILDING_PREFIX}${def.id}-`
  role: Record<string, BuildingRole>;       // block id -> role
  layer: Record<string, number>;            // block id -> storey index; roof blocks = storeys.length
  routes: ClimbRouteDef[]; pits: PitDef[]; containers: ContainerDef[]; spots: SpotDef[]; props: PropDef[];
  interior: Rect;                           // footprint inset by shell.thick
  roofY: number;                            // bottom of the roof (shell.height - 0.2)
  doors: DoorInfo[]; stairs: StairInfo[];
  cut: string[][];                          // cut[s]: ids hidden while the player is inside on storey s (floors above s, roof)
}
