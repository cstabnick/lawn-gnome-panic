// Dig a Nook (E17 issue J3): a full-screen hold-and-release game. STUB: the J3 worker fills it.

export interface DigResult { good: boolean; quit: boolean }
export interface DigOpts {
  /** Which nook (0..2), for the title. */
  nook: number;
  /** 0..1 random source. */
  rand: () => number;
  onDone(r: DigResult): void;
}

/** Opens the dig game for one nook in a container appended to `ui` (never restyle `ui`). */
export function openDigGame(_ui: HTMLElement, opts: DigOpts): void {
  opts.onDone({ good: false, quit: true });
}

export function digOpen(): boolean {
  return false;
}
