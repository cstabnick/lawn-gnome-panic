// E25 Gnomazon: the packing station, a full-screen touch minigame: orders arrive, pick the items off the shelf grid,
// choose the box, tape it, pick the label, send; a quota bar and the shift clock. STUB: issue 16 fills it in.
import type { PackOpts, PackSession } from './types';

export function openPackStation(ui: HTMLElement, opts: PackOpts): PackSession {
  void ui;
  let open = true;
  return {
    update() {
      if (!open) return;
      open = false;
      opts.onEnd({ parcels: [], quota: opts.quota, quit: true, idle: false });
    },
    isOpen: () => open,
    close() { open = false; },
  };
}
