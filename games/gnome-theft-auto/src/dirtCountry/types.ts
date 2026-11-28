// E14 "dirt country": the Rutbottom Dirt Bowl, Capwood (the toadstool forest) and the Capwood Run's dressing. Each
// area module builds its scenery once and returns an Area the app updates every frame. Contract shared by
// rutbottom/index.ts, capwood/forest.ts and capwood/run.ts; dirtCountry/index.ts composes them for app.ts.
import type { Blip } from '../types';

export interface AreaDeps {
  /** Short toast on the HUD. */
  toast(text: string, ms?: number): void;
  /** Unlock an achievement (packages/achievements catalog id). */
  unlock(id: string): void;
  /** Add to a counting achievement. */
  increment(id: string, by?: number): void;
}

export interface Area {
  /** px, pz: the player (or their vehicle). night: 0 day .. 1 night. */
  update(dt: number, px: number, pz: number, night: number): void;
  /** Map blips for the area (labels shown on the big map). */
  blips(): Blip[];
}

/** An area that does nothing (a stub until its epic fills it in). */
export const EMPTY_AREA: Area = { update: () => undefined, blips: () => [] };
