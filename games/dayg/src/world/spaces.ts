// Spaces: who is inside which building, on which storey, and walking waypoints. Step 0 stub (roadmap 10, issue 1.3 fills it).
import type { BuildingParts, DoorInfo } from './buildingTypes';
import type { Vec3 } from './collide';

export interface Space { building: string | null; storey: number; doorway: string | null }
export interface BuildingIndex {
  readonly parts: readonly BuildingParts[];
  byId(id: string): BuildingParts | undefined;
  insideAt(x: number, y: number, z: number, inset?: number): BuildingParts | null;  // interior rect shrunk by inset (strict)
  footprintAt(x: number, y: number, z: number, pad?: number): BuildingParts | null; // footprint grown by pad (inclusive)
  storeyAt(b: BuildingParts, y: number): number;        // highest i with storeys[i] <= y + 0.5, else 0
  ceilingAt(b: BuildingParts, storey: number): number | null; // lowest y of the floor blocks of storey + 1; null on the top storey
  doorAt(x: number, z: number): DoorInfo | null;        // inside a door's rect grown by 0.5 across the wall
  spaceOf(x: number, y: number, z: number): Space;      // building = insideAt(x,y,z)?.def.id ?? null; doorway = doorAt id
  nextWaypoint(from: Vec3, to: Vec3): { x: number; z: number } | null;
}

export function createBuildingIndex(parts: readonly BuildingParts[]): BuildingIndex {
  return {
    parts,
    byId: (id) => parts.find((p) => p.def.id === id),
    insideAt: () => null,
    footprintAt: () => null,
    storeyAt: () => 0,
    ceilingAt: () => null,
    doorAt: () => null,
    spaceOf: () => ({ building: null, storey: 0, doorway: null }),
    nextWaypoint: () => null,
  };
}
