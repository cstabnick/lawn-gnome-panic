// The cartoon contract. A cartoon is one short animated gag played on a vintage bowling-alley score monitor
// (a low-res CRT) instead of the result card. celebrate.ts plays it; index.ts picks which one.
import type { ResultKind } from '../config';

/** The monitor's canvas size in pixels. Draw in these units; it is scaled up with crisp pixels. */
export const CRT_W = 160;
export const CRT_H = 120;

export interface CartoonInfo {
  kind: ResultKind;
  /** The bowler's name (may be up to 16 chars). */
  name: string;
  /** The bowler's colour as a CSS colour, e.g. '#ff5a5a'. */
  color: string;
  /** Strikes in a row ending with this ball (0 if not a strike). turkey = 3, hambone = 4+. */
  streak: number;
  /** Pins knocked by this ball. */
  count: number;
  /** Seconds the cartoon is on screen. Finish the gag (and hold the last pose) by then. */
  duration: number;
  /** Stable per-result number, for any randomness (use rng(seed) from crt.ts, never Math.random). */
  seed: number;
}

export interface Cartoon {
  /** Unique, kebab-case; `#cartoon=<id>` in the URL forces it. */
  id: string;
  /** Results it may play for. */
  kinds: readonly ResultKind[];
  /** Relative chance against the other cartoons for the same kind (default 1). */
  weight?: number;
  /**
   * Draws the whole frame for time t (seconds since the start, 0..info.duration) on a CRT_W x CRT_H canvas.
   * Called every frame; must not keep state between calls (the same t always draws the same picture).
   */
  draw(g: CanvasRenderingContext2D, t: number, info: CartoonInfo): void;
}
