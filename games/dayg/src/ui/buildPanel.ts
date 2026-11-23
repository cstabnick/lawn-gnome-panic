// The build panel: pick a piece to place (roadmap 9.1). Step 0 stub: a hidden #dayg-build container on the shared #ui element.
import { DOM_MORE } from '../config';
import type { BuildPanel, BuildSystem, InventorySystem } from '../game/types';

export function createBuildPanel(ui: HTMLElement, deps: { build: BuildSystem; inv: InventorySystem }): BuildPanel {
  const root = document.createElement('div');
  root.id = DOM_MORE.build;
  root.hidden = true;
  ui.appendChild(root);
  return {
    root,
    open: (): void => { /* roadmap 9.1 */ },
    close: (): void => { root.hidden = true; },
    toggle: (): void => { /* roadmap 9.1 */ },
    isOpen: (): boolean => !root.hidden,
  };
}
