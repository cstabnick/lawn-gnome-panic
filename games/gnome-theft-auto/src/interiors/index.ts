// Interiors and rooftops (E05, L36 + L75). Contract: docs/roadmaps/gta-batch-3/E05/contracts.md.
// Content epics: defineInterior (registry.ts), addRooftop (rooftops.ts), enterInterior / currentInterior (runtime.ts).
export * from './types';
export { INTERIOR_MIN_X, INTERIOR_FLOOR_Y, isInteriorPoint } from './space';
export {
  INTERIOR_THEMES, defineInterior, interiorById, listInteriors, onInteriorDefined, interiorToWorld, interiorAt,
  pocketOrigin, type PlacedInterior,
} from './registry';
export { ROOFTOPS, addRooftop, rooftopById, rooftopSurfaceBelow, rooftopAt, landingPads } from './rooftops';
export {
  createInteriors, enterInterior, leaveInterior, currentInterior, onInteriorChange, type Interiors, type InteriorDeps,
} from './runtime';
export { buildRooftops } from './rooftopsBuild';
export { createRoofLife, type RoofLife } from './roofLife';
// The showcase interiors register themselves on import.
import './showcase/bodega';
import './showcase/mulchClub';
import './showcase/flat3b';
import './showcase/doublePot';
