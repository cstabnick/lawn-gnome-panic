// Chest contents panel, a child of #ui. Two lists: the pack and the chest. Tap a stack to move it across.
import { prefabIconElement } from '@lawn/prefabs';
import type { InventorySystem } from '../game/types';
import type { ItemStack } from '../sim/types';
import { getItem } from '../items/defs';
import { BASE_DOM } from './config';

export interface ChestUi { root: HTMLElement; open(title: string, getChest: () => ItemStack[], onChange: () => void): void; close(): void; isOpen(): boolean }

const FALLBACK_ICON = '📦';
const ROW_PX = 52;
const ICON_PX = 32;
const CLOSE_PX = 48;
const FULL_MSG = 'The chest is full.';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (css) node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

function fmt(n: number): string { return String(Number(n.toFixed(1))); }

function bulkOf(stacks: readonly ItemStack[]): number {
  let total = 0;
  for (const s of stacks) total += getItem(s.def).bulk * s.count;
  return total;
}

function row(stack: ItemStack, onTap: () => void): HTMLButtonElement {
  const def = getItem(stack.def);
  const b = el('button', `display:flex;align-items:center;gap:8px;width:100%;min-height:${ROW_PX}px;box-sizing:border-box;` +
    'padding:6px 8px;margin-bottom:6px;border-radius:8px;border:1px solid #56614a;background:#2d3a25;color:#eee;' +
    'font:14px system-ui,sans-serif;text-align:left;cursor:pointer;touch-action:manipulation');
  b.type = 'button';
  b.title = def.name;
  const icon = prefabIconElement(def.prefab, FALLBACK_ICON, ICON_PX);
  icon.style.pointerEvents = 'none';
  icon.style.flex = `0 0 ${ICON_PX}px`;
  const name = el('span', 'flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', def.name);
  const count = el('span', 'flex:0 0 auto;opacity:0.85;font-variant-numeric:tabular-nums', `×${stack.count}`);
  b.append(icon, name, count);
  b.addEventListener('click', (e) => { e.stopPropagation(); onTap(); });
  return b;
}

function column(title: string, subtitle: string): { col: HTMLElement; list: HTMLElement } {
  const col = el('div', 'min-width:0');
  const head = el('div', 'display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px');
  head.append(el('div', 'font-weight:bold;font-size:16px', title), el('div', 'opacity:0.85;font-size:13px', subtitle));
  const list = el('div', 'max-height:50vh;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-right:2px');
  col.append(head, list);
  return { col, list };
}

export function createChestUi(ui: HTMLElement, deps: { inv: InventorySystem; capacityBulk: number }): ChestUi {
  const { inv, capacityBulk } = deps;
  const root = document.createElement('div');
  root.id = BASE_DOM.chest;
  root.hidden = true;
  root.style.cssText = 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:30;display:none;align-items:center;' +
    'justify-content:center;box-sizing:border-box;background:rgba(0,0,0,0.55);pointer-events:auto;' +
    'padding:max(env(safe-area-inset-top), 16px) max(env(safe-area-inset-right), 16px) ' +
    'max(env(safe-area-inset-bottom), 16px) max(env(safe-area-inset-left), 16px);font:14px system-ui,sans-serif;color:#eee';

  const style = el('style');
  style.textContent =
    `#${BASE_DOM.chest} .dayg-chest-cols{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}` +
    `@media (min-width:600px){#${BASE_DOM.chest} .dayg-chest-cols{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}`;

  const panel = el('div', `position:relative;box-sizing:border-box;width:100%;min-width:0;max-width:560px;overflow-x:hidden;` +
    `max-height:calc(100% - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));overflow-y:auto;` +
    '-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:14px 14px 16px;border-radius:14px;' +
    'background:rgba(18,22,16,0.97);box-shadow:0 8px 28px rgba(0,0,0,0.5)');

  const titleEl = el('div', `font-size:18px;font-weight:bold;padding-right:${CLOSE_PX + 8}px;margin-bottom:12px;min-height:${CLOSE_PX}px;` +
    'display:flex;align-items:center');
  const cols = el('div', '');
  cols.className = 'dayg-chest-cols';
  const status = el('div', 'min-height:20px;margin-top:10px;font-size:13px;color:#e8c35a');
  status.setAttribute('role', 'status');

  const closeBtn = el('button', `position:absolute;top:8px;right:8px;width:${CLOSE_PX}px;height:${CLOSE_PX}px;border:none;` +
    'border-radius:8px;background:#2d3a25;color:#eee;font:22px system-ui,sans-serif;cursor:pointer;touch-action:manipulation', '✕');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close chest');

  panel.append(titleEl, cols, status, closeBtn);
  root.append(style, panel);

  let openState: { title: string; getChest: () => ItemStack[]; onChange: () => void } | null = null;
  let message = '';

  function setMessage(text: string): void { message = text; status.textContent = text; }

  // Pack stack -> chest. Moves the whole stack when it fits the chest's bulk limit.
  function movePackToChest(index: number, chest: ItemStack[]): void {
    const stack = inv.state.pack[index];
    if (!stack) return;
    const bulk = getItem(stack.def).bulk * stack.count;
    if (bulkOf(chest) + bulk > capacityBulk + 1e-9) { setMessage(FULL_MSG); return; }
    const taken = inv.take({ where: 'pack', index }, stack.count);
    if (!taken) return;
    const max = getItem(taken.def).stack;
    let remaining = taken.count;
    if (!taken.liquid) {
      for (const s of chest) {
        if (remaining <= 0) break;
        if (s.def !== taken.def || s.condition !== taken.condition || s.liquid) continue;
        const space = max - s.count;
        if (space <= 0) continue;
        const add = Math.min(space, remaining);
        s.count += add;
        remaining -= add;
      }
    }
    while (remaining > 0) {
      const n = taken.liquid ? remaining : Math.min(max, remaining);
      if (taken.liquid) {
        chest.push({ ...taken, count: n });
        remaining = 0;
      } else {
        chest.push({ def: taken.def, count: n, condition: taken.condition });
        remaining -= n;
      }
    }
    setMessage('');
    openState?.onChange();
    render();
  }

  // Chest stack -> pack. Whatever does not fit stays in the chest at the same index.
  function moveChestToPack(index: number, chest: ItemStack[]): void {
    const stack = chest[index];
    if (!stack) return;
    const leftover = inv.add({ ...stack });
    if (leftover && leftover.count > 0) {
      chest[index] = leftover;
      setMessage('Your pack is full.');
    } else {
      chest.splice(index, 1);
      setMessage('');
    }
    openState?.onChange();
    render();
  }

  function render(): void {
    if (!openState) return;
    const chest = openState.getChest();
    titleEl.textContent = openState.title;
    cols.replaceChildren();

    const packStacks = inv.state.pack.filter((s): s is ItemStack => !!s);
    const pack = column('Your pack', `${fmt(bulkOf(packStacks))} bulk`);
    if (packStacks.length === 0) pack.list.append(el('div', 'opacity:0.6;padding:8px 0', 'Empty.'));
    inv.state.pack.forEach((stack, index) => {
      if (!stack) return;
      pack.list.append(row(stack, () => movePackToChest(index, openState ? openState.getChest() : [])));
    });

    const used = bulkOf(chest);
    const chestCol = column('Chest', `${fmt(used)} / ${fmt(capacityBulk)} bulk`);
    if (chest.length === 0) chestCol.list.append(el('div', 'opacity:0.6;padding:8px 0', 'Empty.'));
    chest.forEach((stack, index) => {
      chestCol.list.append(row(stack, () => moveChestToPack(index, openState ? openState.getChest() : [])));
    });

    cols.append(pack.col, chestCol.col);
    status.textContent = message;
  }

  function close(): void {
    openState = null;
    message = '';
    status.textContent = '';
    root.style.display = 'none';
    root.hidden = true;
    cols.replaceChildren();
  }

  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
  // Swallow taps on the dim backdrop so they do not reach the game underneath.
  root.addEventListener('click', (e) => { e.stopPropagation(); });
  window.addEventListener('keydown', (e) => { if (openState && e.key === 'Escape') close(); });
  inv.onChange(() => { if (openState) render(); });

  ui.appendChild(root);

  return {
    root,
    open(title: string, getChest: () => ItemStack[], onChange: () => void) {
      openState = { title, getChest, onChange };
      message = '';
      root.hidden = false;
      root.style.display = 'flex';
      render();
    },
    close,
    isOpen: () => openState !== null,
  };
}
