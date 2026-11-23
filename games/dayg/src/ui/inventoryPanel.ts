// The pack screen, Tarkov/DayZ style: a full-screen inventory with an equipment column, a backpack grid, a loot column
// while searching, drag and drop between every slot, and an info bar with the selected item's actions.
// Opening it releases the pointer lock so the cursor shows and clicks reach the grid.
import { prefabIconElement } from '@lawn/prefabs';
import { DOM } from '../config';
import { getItem } from '../items/defs';
import type { WornSlot } from '../items/defs';
import type { ItemStack } from '../sim/types';
import type { InventoryPanel, InventorySystem, RecipeDef, StackRef, UseAction, UseApi } from '../game/types';

const WORN: readonly WornSlot[] = ['head', 'back', 'neck', 'body'];
const WORN_LABEL: Record<WornSlot, string> = { head: 'Head', back: 'Back', neck: 'Neck', body: 'Body' };
const CELL_PX = 64;
const DRAG_PX = 6;
const FALLBACK_ICON = '📦';

const CSS = `
#${DOM.inv}{position:fixed;inset:0;z-index:50;display:none;flex-direction:column;background:#12160f;color:#eee;
  font:14px system-ui,sans-serif;cursor:default;user-select:none;-webkit-user-select:none;box-sizing:border-box;
  padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)}
#${DOM.inv}.iv-open{display:flex}
#${DOM.inv} .iv-top{display:flex;align-items:center;gap:12px;padding:8px 12px;border-bottom:1px solid #2f3a28;min-height:56px;box-sizing:border-box}
#${DOM.inv} .iv-title{font-weight:700;font-size:18px;white-space:nowrap}
#${DOM.inv} .iv-meters{flex:1;display:flex;gap:12px;min-width:0}
#${DOM.inv} .iv-meter{flex:1;max-width:240px;min-width:0}
#${DOM.inv} .iv-meter-label{font-size:12px;opacity:.85;white-space:nowrap}
#${DOM.inv} .iv-track{height:8px;background:#333;border-radius:4px;overflow:hidden}
#${DOM.inv} .iv-fill{height:100%;width:0;background:#7fa35a}
#${DOM.inv} .iv-close{width:48px;height:48px;border:none;border-radius:8px;background:#2d3a25;color:#eee;font:22px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;flex:none}
#${DOM.inv} .iv-body{flex:1;min-height:0;display:grid;grid-template-columns:230px minmax(0,1fr) 280px;gap:12px;padding:12px;box-sizing:border-box}
#${DOM.inv} .iv-col{min-height:0;min-width:0;overflow:auto;display:flex;flex-direction:column;gap:14px}
#${DOM.inv} .iv-h{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin-bottom:6px}
#${DOM.inv} .iv-equip{display:flex;align-items:center;gap:10px;margin-bottom:8px}
#${DOM.inv} .iv-equip-label{width:58px;font-size:13px;opacity:.85}
#${DOM.inv} .iv-grid{display:grid;grid-template-columns:repeat(auto-fill,${CELL_PX}px);gap:6px;align-content:start}
#${DOM.inv} .iv-cell{position:relative;width:${CELL_PX}px;height:${CELL_PX}px;min-width:44px;min-height:44px;box-sizing:border-box;border-radius:8px;
  border:2px solid #56614a;background:#1d241a;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none;cursor:pointer}
#${DOM.inv} .iv-cell.iv-empty{border-style:dashed;opacity:.7}
#${DOM.inv} .iv-cell.iv-sel{border-color:#e8c35a;box-shadow:0 0 0 1px #e8c35a inset}
#${DOM.inv} .iv-cell.iv-over{border-color:#8fd3ff;background:#23324a}
#${DOM.inv} .iv-count{position:absolute;top:2px;right:4px;font:bold 12px system-ui,sans-serif;text-shadow:0 0 3px #000}
#${DOM.inv} .iv-litres{position:absolute;top:2px;left:4px;font:bold 11px system-ui,sans-serif;text-shadow:0 0 3px #000}
#${DOM.inv} .iv-cond{position:absolute;left:3px;right:3px;bottom:2px;height:4px;background:#222;border-radius:2px;overflow:hidden}
#${DOM.inv} .iv-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#${DOM.inv} .iv-btn{min-height:44px;min-width:44px;padding:8px 12px;border-radius:8px;border:1px solid #56614a;background:#2d3a25;color:#eee;
  font:14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation}
#${DOM.inv} .iv-btn:disabled{opacity:.45;cursor:default}
#${DOM.inv} .iv-info{border-top:1px solid #2f3a28;padding:10px 12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;min-height:72px;box-sizing:border-box}
#${DOM.inv} .iv-info-text{flex:1 1 220px;min-width:0}
#${DOM.inv} .iv-info-actions{display:flex;gap:8px;flex-wrap:wrap}
#${DOM.inv} .iv-busy{flex:1 1 200px;min-width:160px;display:none}
#${DOM.inv} .iv-ghost{position:fixed;width:56px;height:56px;transform:translate(-50%,-50%);pointer-events:none;z-index:60;opacity:.85;
  border-radius:8px;background:#2d3a25;border:2px solid #e8c35a;display:flex;align-items:center;justify-content:center;overflow:hidden}
@media (max-width:820px){
  #${DOM.inv} .iv-body{grid-template-columns:minmax(0,1fr);overflow:auto}
  #${DOM.inv} .iv-col{overflow:visible}
  #${DOM.inv} .iv-meter-label{font-size:11px}
}`;

type Loot = { title: string; items: ItemStack[]; onTake: (index: number) => void };

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function fmt(n: number): string { return String(Number(n.toFixed(1))); }

function refKey(r: StackRef): string {
  if (r.where === 'hand') return `hand:${r.index}`;
  if (r.where === 'worn') return `worn:${r.slot}`;
  return `pack:${r.index}`;
}

function keyRef(k: string): StackRef {
  const [where, v] = k.split(':');
  if (where === 'hand') return { where: 'hand', index: Number(v) as 0 | 1 };
  if (where === 'worn') return { where: 'worn', slot: v as WornSlot };
  return { where: 'pack', index: Number(v) };
}

function stackCell(stack: ItemStack | null, key: string, label: string, selected: boolean): HTMLDivElement {
  const cell = el('div', `iv-cell${stack ? '' : ' iv-empty'}${selected ? ' iv-sel' : ''}`);
  cell.dataset.key = key;
  cell.dataset.drop = key;
  cell.title = stack ? getItem(stack.def).name : label;
  if (!stack) {
    cell.append(el('span', '', label));
    (cell.lastElementChild as HTMLElement).style.cssText = 'font-size:12px;opacity:.6;text-align:center;padding:2px';
    return cell;
  }
  const def = getItem(stack.def);
  const icon = prefabIconElement(def.prefab, FALLBACK_ICON, 40);
  icon.style.pointerEvents = 'none';
  cell.append(icon);
  if (stack.count > 1) cell.append(el('span', 'iv-count', String(stack.count)));
  if (stack.liquid) cell.append(el('span', 'iv-litres', `${fmt(stack.liquid.litres)} L`));
  const cond = el('div', 'iv-cond');
  const c = Math.max(0, Math.min(1, stack.condition));
  const bar = el('div');
  bar.style.cssText = `height:100%;width:${c * 100}%;background:${c > 0.5 ? '#7fa35a' : c > 0.2 ? '#d9a441' : '#c0623a'}`;
  cond.append(bar);
  cell.append(cond);
  return cell;
}

function lootCell(stack: ItemStack, index: number, selected: boolean): HTMLDivElement {
  const cell = stackCell(stack, `loot:${index}`, '', selected);
  delete cell.dataset.drop;   // loot is taken, never dropped onto
  return cell;
}

function textButton(text: string, onClick: () => void, disabled = false): HTMLButtonElement {
  const b = el('button', 'iv-btn', text);
  b.type = 'button';
  b.disabled = disabled;
  b.addEventListener('click', (e) => { e.stopPropagation(); if (!b.disabled) onClick(); });
  return b;
}

function meterEl(): { wrap: HTMLElement; label: HTMLElement; fill: HTMLElement } {
  const wrap = el('div', 'iv-meter');
  const label = el('div', 'iv-meter-label');
  const track = el('div', 'iv-track');
  const fill = el('div', 'iv-fill');
  track.append(fill);
  wrap.append(label, track);
  return { wrap, label, fill };
}

export function createInventoryPanel(ui: HTMLElement, deps: { inv: InventorySystem; use: UseApi; onSound?: (kind: 'grab' | 'drop' | 'stack') => void }): InventoryPanel {
  const { inv, use } = deps;

  if (!document.getElementById('dayg-inv-style')) {
    const style = el('style');
    style.id = 'dayg-inv-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const root = el('div');
  root.id = DOM.inv;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Pack');

  // Top bar, built once: title, weight and bulk meters, close.
  const top = el('div', 'iv-top');
  const title = el('div', 'iv-title', 'Pack');
  const meters = el('div', 'iv-meters');
  const weight = meterEl();
  const bulk = meterEl();
  meters.append(weight.wrap, bulk.wrap);
  const closeBtn = el('button', 'iv-close', '✕');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close pack');
  top.append(title, meters, closeBtn);

  const body = el('div', 'iv-body');
  const equipCol = el('div', 'iv-col');
  const packCol = el('div', 'iv-col');
  const sideCol = el('div', 'iv-col');
  body.append(equipCol, packCol, sideCol);

  // Info bar, built once; its contents are refilled on render. The busy bar is updated by the ticker.
  const info = el('div', 'iv-info');
  const infoText = el('div', 'iv-info-text');
  const infoActions = el('div', 'iv-info-actions');
  const busyWrap = el('div', 'iv-busy');
  const busyLabel = el('div', '', '');
  busyLabel.style.cssText = 'font-size:13px;margin-bottom:4px';
  const busyTrack = el('div', 'iv-track');
  const busyFill = el('div', 'iv-fill');
  busyFill.style.background = '#e8c35a';
  busyTrack.append(busyFill);
  busyWrap.append(busyLabel, busyTrack);
  info.append(infoText, infoActions, busyWrap);

  root.append(top, body, info);
  ui.appendChild(root);

  let open = false;
  let selKey: string | null = null;
  let loot: Loot | null = null;
  let drag: { key: string; from: StackRef; x: number; y: number; active: boolean; ghost: HTMLElement | null } | null = null;
  let suppressClick = false;

  function selectedStack(): { stack: ItemStack; ref: StackRef } | null {
    if (!selKey || selKey.startsWith('loot:')) return null;
    const ref = keyRef(selKey);
    const stack = inv.get(ref);
    return stack ? { stack, ref } : null;
  }

  function renderEquip(): void {
    equipCol.replaceChildren();
    equipCol.append(el('div', 'iv-h', 'Hands'));
    for (let i = 0; i < 2; i++) {
      const key = `hand:${i}`;
      const row = el('div', 'iv-equip');
      row.append(el('div', 'iv-equip-label', i === 0 ? 'Hand' : 'Hand 2'), stackCell(inv.get({ where: 'hand', index: i as 0 | 1 }), key, '', selKey === key));
      equipCol.append(row);
    }
    equipCol.append(el('div', 'iv-h', 'Worn'));
    for (const slotName of WORN) {
      const key = `worn:${slotName}`;
      const row = el('div', 'iv-equip');
      row.append(el('div', 'iv-equip-label', WORN_LABEL[slotName]),
        stackCell(inv.get({ where: 'worn', slot: slotName }), key, WORN_LABEL[slotName], selKey === key));
      equipCol.append(row);
    }
  }

  function renderPack(): void {
    packCol.replaceChildren();
    const count = inv.state.pack.length;
    packCol.append(el('div', 'iv-h', `Backpack · ${count} ${count === 1 ? 'item' : 'items'}`));
    const grid = el('div', 'iv-grid');
    inv.state.pack.forEach((stack, index) => {
      grid.append(stackCell(stack, `pack:${index}`, '', selKey === `pack:${index}`));
    });
    grid.append(stackCell(null, `pack:${count}`, 'Drop here', false));   // empty end cell: a drop target that appends
    packCol.append(grid);
  }

  function renderSide(): void {
    sideCol.replaceChildren();
    if (loot) {
      sideCol.append(el('div', 'iv-h', `Searching: ${loot.title}`));
      const grid = el('div', 'iv-grid');
      if (loot.items.length === 0) grid.append(el('div', '', 'Nothing left.'));
      loot.items.forEach((stack, index) => grid.append(lootCell(stack, index, selKey === `loot:${index}`)));
      sideCol.append(grid);
      if (loot.items.length > 0) {
        sideCol.append(textButton('Take all', () => {
          for (let i = (loot?.items.length ?? 0) - 1; i >= 0; i--) loot?.onTake(i);
          selKey = null;
          render();
        }));
      }
    }
    sideCol.append(el('div', 'iv-h', 'Recipes'));
    for (const r of use.recipes()) {
      const row = el('div', '');
      row.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-bottom:6px';
      row.append(textButton(r.def.name, () => startRecipe(r.def), !r.ok || use.busy() !== null));
      if (!r.ok && r.why) {
        const why = el('span', '', r.why);
        why.style.cssText = 'font-size:12px;opacity:.75';
        row.append(why);
      }
      sideCol.append(row);
    }
  }

  function renderInfo(): void {
    infoText.replaceChildren();
    infoActions.replaceChildren();
    const sel = selectedStack();
    if (sel) {
      const def = getItem(sel.stack.def);
      const extra = sel.stack.count > 1 ? ` ×${sel.stack.count}` : '';
      infoText.append(el('div', 'iv-name', `${def.name}${extra}`));
      (infoText.lastElementChild as HTMLElement).style.cssText = 'font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      infoText.append(el('div', '', `${fmt(def.weight * sel.stack.count)} kg · ${fmt(def.bulk * sel.stack.count)} L · ${Math.round(sel.stack.condition * 100)}% condition`));
      (infoText.lastElementChild as HTMLElement).style.cssText = 'font-size:12px;opacity:.8';
      const ref = sel.ref;
      for (const action of use.actionsFor(ref)) {
        infoActions.append(textButton(action.label, () => run(action)));
      }
      return;
    }
    if (selKey?.startsWith('loot:') && loot) {
      const index = Number(selKey.split(':')[1]);
      const stack = loot.items[index];
      if (stack) {
        const def = getItem(stack.def);
        infoText.append(el('div', '', `${def.name}${stack.count > 1 ? ` ×${stack.count}` : ''} · on the ground`));
        (infoText.lastElementChild as HTMLElement).style.cssText = 'font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
        infoActions.append(textButton('Take', () => {
          loot?.onTake(index);
          selKey = null;
          render();
        }));
        return;
      }
    }
    infoText.append(el('div', '', 'Select an item. Drag items between slots, or tap one for its actions.'));
    (infoText.lastElementChild as HTMLElement).style.cssText = 'font-size:13px;opacity:.7';
  }

  function render(): void {
    if (!open) return;
    weight.label.textContent = `${fmt(inv.weight())} / ${fmt(inv.carryCapacity())} kg`;
    weight.fill.style.width = `${Math.min(100, inv.carryCapacity() > 0 ? (inv.weight() / inv.carryCapacity()) * 100 : 0)}%`;
    weight.fill.style.background = inv.weight() > inv.carryCapacity() ? '#c0623a' : '#7fa35a';
    bulk.label.textContent = `${fmt(inv.bulkUsed())} / ${fmt(inv.bulkCapacity())} L`;
    bulk.fill.style.width = `${Math.min(100, inv.bulkCapacity() > 0 ? (inv.bulkUsed() / inv.bulkCapacity()) * 100 : 0)}%`;
    bulk.fill.style.background = inv.bulkUsed() > inv.bulkCapacity() ? '#c0623a' : '#7fa35a';
    renderEquip();
    renderPack();
    renderSide();
    renderInfo();
    updateBusy();
  }

  function updateBusy(): void {
    const b = use.busy();
    if (!b) { busyWrap.style.display = 'none'; return; }
    busyWrap.style.display = 'block';
    busyLabel.textContent = b.label;
    busyFill.style.width = `${Math.round(Math.max(0, Math.min(1, b.progress)) * 100)}%`;
  }

  function run(action: UseAction): void {
    use.start(action);
    selKey = null;
    render();
  }

  function startRecipe(def: RecipeDef): void {
    use.start({ id: `recipe-${def.id}`, label: def.name, seconds: def.seconds, kind: 'recipe', recipe: def.id });
    render();
  }

  // Pointer handling: a short press selects; a press that moves past DRAG_PX drags the stack to the cell under the pointer.
  function cellAt(x: number, y: number): HTMLElement | null {
    const node = document.elementFromPoint(x, y);
    return node instanceof HTMLElement ? node.closest<HTMLElement>('[data-key]') : null;
  }

  root.addEventListener('pointerdown', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-key]');
    if (!cell || !cell.dataset.key) return;
    const key = cell.dataset.key;
    drag = { key, from: keyRef(key), x: e.clientX, y: e.clientY, active: false, ghost: null };
    if (key.startsWith('loot:') || !inv.get(keyRef(key))) return;   // only stacks can be dragged; loot is tapped
    e.preventDefault();
  });

  window.addEventListener('pointermove', (e) => {
    if (!drag || !open) return;
    if (!drag.active && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > DRAG_PX && !drag.key.startsWith('loot:')) {
      const stack = inv.get(drag.from);
      if (!stack) return;
      drag.active = true;
      deps.onSound?.('grab');
      const ghost = el('div', 'iv-ghost');
      ghost.append(prefabIconElement(getItem(stack.def).prefab, FALLBACK_ICON, 40));
      drag.ghost = ghost;
      root.append(ghost);
    }
    if (drag?.active && drag.ghost) {
      drag.ghost.style.left = `${e.clientX}px`;
      drag.ghost.style.top = `${e.clientY}px`;
      for (const c of root.querySelectorAll('.iv-over')) c.classList.remove('iv-over');
      cellAt(e.clientX, e.clientY)?.classList.add('iv-over');
    }
  });

  window.addEventListener('pointerup', (e) => {
    const d = drag;
    drag = null;
    if (!d || !open) return;
    if (d.ghost) d.ghost.remove();
    if (d.active) {
      suppressClick = true;
      const target = cellAt(e.clientX, e.clientY);
      const dropKey = target?.dataset.drop;
      if (dropKey && dropKey !== d.key) {
        const moving = inv.get(d.from);
        const onto = inv.get(keyRef(dropKey));
        if (inv.move(d.from, keyRef(dropKey))) {
          deps.onSound?.(moving && onto && moving.def === onto.def ? 'stack' : 'drop');
        }
      }
      selKey = null;
      render();
      return;
    }
    // A tap: select the cell (or deselect it when tapped twice).
    if (suppressClick) { suppressClick = false; return; }
    if (d.key === selKey) selKey = null;
    else selKey = d.key;
    render();
  });

  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(false); });

  window.addEventListener('keydown', (e) => {
    if (open && e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  });

  inv.onChange(() => { if (open) render(); });

  // Keeps the busy bar moving while a timed use runs, and rebuilds once when it finishes.
  let wasBusy = false;
  setInterval(() => {
    if (!open) return;
    const busy = use.busy() !== null;
    if (!busy && wasBusy) { wasBusy = false; render(); return; }
    wasBusy = busy;
    updateBusy();
  }, 200);

  function setOpen(on: boolean): void {
    open = on;
    root.classList.toggle('iv-open', on);
    if (on) {
      // The game captures the mouse for looking; release it so the cursor shows over the pack.
      if (document.pointerLockElement) document.exitPointerLock();
      render();
    } else {
      loot = null;
      selKey = null;
      drag = null;
    }
  }

  if (new URLSearchParams(window.location.search).get('inv') === '1') setOpen(true);

  return {
    root,
    toggle() { setOpen(!open); },
    open() { setOpen(true); },
    close() { setOpen(false); },
    isOpen: () => open,
    showLoot(titleText: string, items: ItemStack[], onTake: (index: number) => void) {
      loot = { title: titleText, items, onTake };
      setOpen(true);
    },
  };
}
