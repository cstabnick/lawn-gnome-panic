import type { ContainerDef, HavenId, ItemId, Rect, RegionId } from '../sim/types';
export type Side = 'n' | 's' | 'e' | 'w';   // n = face at z0 (faces -z), s = face at z1, w = face at x0, e = face at x1
export type BlockKind = 'headstone' | 'kerb' | 'wall' | 'hedge' | 'gatehouse' | 'roof' | 'bin' | 'angel' | 'plinth' | 'stone' | 'beam' | 'standpipe' | 'piece';
/** An axis-aligned solid box from y to y + h. */
export interface BlockDef { id: string; kind: BlockKind; x0: number; x1: number; z0: number; z1: number; y: number; h: number }
export type RouteKind = 'ladder' | 'rope' | 'ivy' | 'letters';
/** A way up one face of a block (or out of a pit: block = the pit id). `at` = metres along the face from its west (n/s faces) or north (e/w faces) end. */
export interface ClimbRouteDef { id: string; block: string; side: Side; kind: RouteKind; at: number }
export interface PitDef { id: string; rect: Rect; depth: number }        // ground inside the rect is at -depth
export type SpotKind = 'hatless' | 'npc' | 'fire' | 'bed';
export interface SpotDef { id: string; kind: SpotKind; region: RegionId; x: number; y: number; z: number }
export interface HavenDef { id: HavenId; name: string; region: RegionId; rect: Rect; minY: number } // safe while inside rect and y >= minY
export interface WaterDef { id: string; kind: 'standpipe' | 'puddle' | 'rain-catcher'; clean: boolean; x: number; y: number; z: number }
export interface PathDef { id: string; kind: 'gravel' | 'grass'; points: [number, number][]; width: number }
export interface PropDef { prefab: string; x: number; y: number; z: number; rotY?: number; scale?: number } // scale default PREFAB_SCALE (1.7)
export interface BlockoutMap {
  bounds: Rect;
  blocks: BlockDef[]; routes: ClimbRouteDef[]; pits: PitDef[]; spots: SpotDef[];
  havens: HavenDef[]; water: WaterDef[]; paths: PathDef[]; props: PropDef[];
  containers: ContainerDef[];
  playerSpawn: { x: number; y: number; z: number };
}
export type { ItemId };
