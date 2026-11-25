// The loading screen (L87). STUB: the E07 loading-screen issue fills it in. index.html draws the loader before any
// script; main.ts reports stages with loadingProgress; app.ts calls hideLoading once the first frame is drawn.

/** Shows the named stages (no-op if the loader is not in the page). */
export function showLoading(_steps: readonly string[]): void {}

/** Marks stage `n` (0-based) as started, with its label. */
export function loadingProgress(_n: number, _label: string): void {}

/** Removes the loader from the page (fades it out). Safe to call more than once. */
export function hideLoading(): void {
  document.getElementById('gta-loader')?.remove();
}
