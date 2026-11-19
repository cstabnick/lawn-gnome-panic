// STUB: a worker fills this in (docs/roadmaps/level-format.md, issue E1). Keep the exported signatures.
import type { ZoneDef, ZoneId } from '@gnomomia/config';
import type { Terrain } from '@gnomomia/terrainCore';
import type { Viewport } from './context';

export interface ViewportDeps {
  terrain: Terrain;
  zones: Record<ZoneId, ZoneDef>;
}

/** Creates the renderer, camera, orbit controls and terrain meshes inside `container`, and starts the render loop. */
export function createViewport(_container: HTMLElement, _deps: ViewportDeps): Viewport {
  throw new Error('viewport.ts is not implemented yet');
}
