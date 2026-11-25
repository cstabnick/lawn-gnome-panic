// Post Sorting (E17 issue J2): a full-screen tap game. STUB: the J2 worker fills it.

export interface SortingResult { sorted: number; misses: number; seconds: number; quit: boolean }
export interface SortingOpts {
  /** Letters to sort. */
  letters: number;
  /** Seconds allowed. */
  seconds: number;
  /** 0..1 random source. */
  rand: () => number;
  onDone(r: SortingResult): void;
}

/** Opens the sorting game in a container appended to `ui` (never restyle `ui`). */
export function openSortingGame(_ui: HTMLElement, opts: SortingOpts): void {
  opts.onDone({ sorted: 0, misses: 0, seconds: 0, quit: true });
}

export function sortingOpen(): boolean {
  return false;
}
