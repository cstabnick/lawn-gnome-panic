// The notice board panel (quests.md). Step 0 stub: a hidden #dayg-board container on the shared #ui element.
import { DOM_MORE } from '../config';
import type { InventorySystem, BoardPanel, PlayerState, SimHost } from '../game/types';
import type { Bus } from '../game/bus';

export function createBoardPanel(ui: HTMLElement, deps: { host: SimHost; inv: InventorySystem; bus: Bus; getPlayer: () => PlayerState }): BoardPanel {
  const root = document.createElement('div');
  root.id = DOM_MORE.board;
  root.hidden = true;
  ui.appendChild(root);
  return {
    root,
    open: (board): void => { /* roadmap 8.3 */ },
    close: (): void => { root.hidden = true; },
    isOpen: (): boolean => !root.hidden,
  };
}
