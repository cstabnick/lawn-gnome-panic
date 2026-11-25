// E24 chef: the kitchen screen, ticket rail and cooking flow (STUB: filled by its E24 issue). DOM only.
import type { KitchenOpts, KitchenSession } from './types';

/** Open the kitchen over the game (appended to ui). */
export function openKitchen(ui: HTMLElement, opts: KitchenOpts): KitchenSession {
  void ui;
  let open = true;
  return {
    update() {},
    isOpen: () => open,
    close() { if (!open) return; open = false; opts.onEnd({ served: [], walkouts: 0, quit: true, rush: opts.rush }); },
  };
}
