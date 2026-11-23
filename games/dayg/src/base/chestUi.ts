// Chest contents panel, a child of #ui. STUB (roadmap 9 step 0): hidden div #dayg-chest; issue 2.4 replaces it.
import type { InventorySystem } from '../game/types';
import type { ItemStack } from '../sim/types';
import { BASE_DOM } from './config';

export interface ChestUi { root: HTMLElement; open(title: string, getChest: () => ItemStack[], onChange: () => void): void; close(): void; isOpen(): boolean }

export function createChestUi(ui: HTMLElement, deps: { inv: InventorySystem; capacityBulk: number }): ChestUi {
  void deps;
  const root = document.createElement('div');
  root.id = BASE_DOM.chest;
  root.hidden = true;
  root.style.display = 'none';
  ui.appendChild(root);
  return {
    root,
    open: () => {},
    close: () => {},
    isOpen: () => false,
  };
}
