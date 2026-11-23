// Chicory Waymark, the guide by the fountain: three short answers for new players. STUB: issue 2H fills it in.
import type { PanelCtx } from './panel';

/** Opens the guide's panel. */
export function openGuide(ctx: PanelCtx): void {
  ctx.system('The guide is not here yet.');
}

/**
 * Call once at startup, after the first map loaded. Until the player has opened the guide once, the guide calls out
 * to them (a bubble now and then) and a "?" help button on the HUD opens the guide from anywhere.
 */
export function initGuide(ctx: PanelCtx, addTopControl: (el: HTMLElement) => void): void {
  void ctx;
  void addTopControl;
}
