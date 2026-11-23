// The pack screen: hands, worn slots, pack contents, recipes, and the search-loot column.
import { prefabIconElement } from '@lawn/prefabs';
import { DOM } from '../config';
import { getItem } from '../items/defs';
import type { ItemStack } from '../sim/types';
import type { InventoryPanel, InventorySystem, RecipeDef, StackRef, UseAction, UseApi } from '../game/types';
import type { WornSlot } from '../items/defs';

const WORN: readonly WornSlot[] = ['head', 'back', 'neck', 'body'];
const WORN_LABEL: Record<WornSlot, string> = { head: 'Head', back: 'Back', neck: 'Neck', body: 'Body' };
const SLOT_PX = 56;
const FALLBACK_ICON = '📦';

type Loot = { title: string; items: ItemStack[]; onTake: (index: number) => void };

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (css) node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

function fmt(n: number): string { return String(Number(n.toFixed(1))); }

function sameRef(a: StackRef | null, b: StackRef): boolean {
  if (!a || a.where !== b.where) return false;
  if (a.where === 'hand' && b.where === 'hand') return a.index === b.index;
  if (a.where === 'worn' && b.where === 'worn') return a.slot === b.slot;
  if (a.where === 'pack' && b.where === 'pack') return a.index === b.index;
  return false;
}

function button(text: string, onClick: () => void, disabled = false): HTMLButtonElement {
  const b = el('button', 'min-height:44px;min-width:44px;padding:8px 12px;border-radius:8px;border:1px solid #56614a;' +
    'background:#2d3a25;color:#eee;font:14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;' +
    (disabled ? 'opacity:0.45;cursor:default;' : ''), text);
  b.type = 'button';
  b.disabled = disabled;
  b.addEventListener('click', (e) => { e.stopPropagation(); if (!b.disabled) onClick(); });
  return b;
}

function meter(label: string, value: number, max: number): HTMLElement {
  const wrap = el('div', 'margin:6px 0');
  wrap.append(el('div', 'font:13px system-ui,sans-serif;opacity:0.85', label));
  const track = el('div', 'height:10px;border-radius:5px;background:#333;overflow:hidden');
  const fill = el('div', `height:100%;width:${Math.min(100, max > 0 ? (value / max) * 100 : 0)}%;` +
    `background:${value > max ? '#c0623a' : '#7fa35a'}`);
  track.append(fill);
  wrap.append(track);
  return wrap;
}

function slot(stack: ItemStack | null, label: string, selected: boolean, onTap: () => void): HTMLButtonElement {
  const b = el('button', `position:relative;width:${SLOT_PX}px;height:${SLOT_PX}px;min-width:44px;min-height:44px;` +
    'padding:0;border-radius:8px;overflow:hidden;cursor:pointer;touch-action:manipulation;' +
    `border:2px solid ${selected ? '#e8c35a' : '#56614a'};background:${stack ? '#2d3a25' : '#1d241a'};color:#eee;` +
    'display:flex;align-items:center;justify-content:center;font:12px system-ui,sans-serif');
  b.type = 'button';
  b.title = stack ? getItem(stack.def).name : label;
  if (!stack) {
    b.append(el('span', 'opacity:0.5;text-align:center;padding:2px', label));
  } else {
    const def = getItem(stack.def);
    const icon = prefabIconElement(def.prefab, FALLBACK_ICON, 40);
    icon.style.pointerEvents = 'none';
    b.append(icon);
    if (stack.count > 1) {
      b.append(el('span', 'position:absolute;top:1px;right:3px;font:bold 12px system-ui,sans-serif;text-shadow:0 0 3px #000', String(stack.count)));
    }
    const cond = el('div', 'position:absolute;left:3px;right:3px;bottom:2px;height:4px;background:#222;border-radius:2px;overflow:hidden');
    const c = Math.max(0, Math.min(1, stack.condition));
    cond.append(el('div', `height:100%;width:${c * 100}%;background:${c > 0.5 ? '#7fa35a' : c > 0.2 ? '#d9a441' : '#c0623a'}`));
    b.append(cond);
  }
  b.addEventListener('click', (e) => { e.stopPropagation(); onTap(); });
  return b;
}

export function createInventoryPanel(ui: HTMLElement, deps: { inv: InventorySystem; use: UseApi }): InventoryPanel {
  const { inv, use } = deps;
  const root = el('div');
  root.id = DOM.inv;
  root.style.cssText = 'position:fixed;box-sizing:border-box;background:rgba(18,22,16,0.95);color:#eee;' +
    'font:14px system-ui,sans-serif;overflow-y:auto;overflow-x:hidden;z-index:50;touch-action:pan-y;' +
    'pointer-events:auto;display:none;-webkit-overflow-scrolling:touch';

  const closeBtn = el('button', 'position:absolute;top:max(env(safe-area-inset-top), 8px);' +
    'right:max(env(safe-area-inset-right), 8px);width:48px;height:48px;border:none;border-radius:8px;' +
    'background:#2d3a25;color:#eee;font:22px system-ui,sans-serif;cursor:pointer;touch-action:manipulation', '✕');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close pack');
  const content = el('div', 'padding-top:4px');
  root.append(content, closeBtn);

  // Progress bar for a timed use, kept outside render() so the ticker can move it without rebuilding buttons.
  const progressWrap = el('div', 'margin:0 0 10px;display:none');
  const progressLabel = el('div', 'font:13px system-ui,sans-serif;margin-bottom:4px');
  const progressTrack = el('div', 'height:10px;border-radius:5px;background:#333;overflow:hidden');
  const progressFill = el('div', 'height:100%;width:0;background:#e8c35a');
  progressTrack.append(progressFill);
  progressWrap.append(progressLabel, progressTrack);

  let open = false;
  let selected: StackRef | null = null;
  let loot: Loot | null = null;
  let wasBusy = false;

  // Portrait: a bottom sheet (72% of the height) whose Close bar is sticky at the bottom, within thumb reach.
  // Landscape: the right 62% of the screen, Close in the top-right corner, the left stays open.
  function applyLayout(): void {
    const portrait = window.innerHeight > window.innerWidth;
    const s = root.style;
    s.left = portrait ? '0' : 'auto';
    s.right = '0';
    s.top = portrait ? 'auto' : '0';
    s.bottom = '0';
    s.width = portrait ? '100%' : `${Math.round(window.innerWidth * 0.62)}px`;
    s.height = portrait ? `${Math.round(window.innerHeight * 0.72)}px` : '100%';
    s.borderRadius = portrait ? '14px 14px 0 0' : '0';
    s.padding = 'max(env(safe-area-inset-top), 12px) max(env(safe-area-inset-right), 12px) ' +
      'max(env(safe-area-inset-bottom), 8px) max(env(safe-area-inset-left), 12px)';
    const c = closeBtn.style;
    if (portrait) {
      c.position = 'sticky';
      c.bottom = 'max(env(safe-area-inset-bottom), 8px)';
      c.top = 'auto';
      c.right = 'auto';
      c.width = '100%';
      c.height = '48px';
      c.margin = '8px 0 0';
      c.display = 'block';
    } else {
      c.position = 'absolute';
      c.bottom = 'auto';
      c.top = 'max(env(safe-area-inset-top), 8px)';
      c.right = 'max(env(safe-area-inset-right), 8px)';
      c.width = '48px';
      c.height = '48px';
      c.margin = '0';
      c.display = '';
    }
  }

  function handsSection(): HTMLElement {
    const sec = el('div', 'margin-bottom:12px');
    sec.append(el('div', 'font-weight:bold;margin-bottom:6px', 'Hands'));
    const row = el('div', 'display:flex;gap:8px');
    for (let i = 0; i < 2; i++) {
      const ref: StackRef = { where: 'hand', index: i as 0 | 1 };
      const stack = inv.get(ref);
      row.append(slot(stack, i === 0 ? 'Hand' : 'Hand 2', sameRef(selected, ref), () => select(ref, stack)));
    }
    sec.append(row);
    return sec;
  }

  function wornSection(): HTMLElement {
    const sec = el('div', 'margin-bottom:12px');
    sec.append(el('div', 'font-weight:bold;margin-bottom:6px', 'Worn'));
    const row = el('div', 'display:flex;gap:8px;flex-wrap:wrap');
    for (const slotName of WORN) {
      const ref: StackRef = { where: 'worn', slot: slotName };
      const stack = inv.get(ref);
      row.append(slot(stack, WORN_LABEL[slotName], sameRef(selected, ref), () => select(ref, stack)));
    }
    sec.append(row);
    return sec;
  }

  function packSection(): HTMLElement {
    const sec = el('div', 'margin-bottom:12px');
    sec.append(el('div', 'font-weight:bold;margin-bottom:6px', 'Pack'));
    const grid = el('div', `display:grid;grid-template-columns:repeat(auto-fill,${SLOT_PX}px);gap:6px`);
    inv.state.pack.forEach((stack, index) => {
      const ref: StackRef = { where: 'pack', index };
      grid.append(slot(stack, '', sameRef(selected, ref), () => select(ref, stack)));
    });
    if (inv.state.pack.length === 0) grid.append(el('div', 'opacity:0.6', 'Empty.'));
    sec.append(grid);
    return sec;
  }

  function weightSection(): HTMLElement {
    const sec = el('div', 'margin-bottom:12px');
    sec.append(meter(`${fmt(inv.weight())} / ${fmt(inv.carryCapacity())} kg`, inv.weight(), inv.carryCapacity()));
    sec.append(meter(`${fmt(inv.bulkUsed())} / ${fmt(inv.bulkCapacity())} L`, inv.bulkUsed(), inv.bulkCapacity()));
    return sec;
  }

  function actionsSection(): HTMLElement | null {
    if (!selected) return null;
    const stack = inv.get(selected);
    if (!stack) return null;
    const ref = selected;
    const sec = el('div', 'margin-bottom:12px');
    sec.append(el('div', 'font-weight:bold;margin-bottom:6px', getItem(stack.def).name));
    const row = el('div', 'display:flex;gap:8px;flex-wrap:wrap');
    for (const action of use.actionsFor(ref)) {
      row.append(button(action.label, () => run(action)));
    }
    sec.append(row);
    return sec;
  }

  function recipesSection(): HTMLElement {
    const sec = el('div', 'margin-bottom:12px');
    sec.append(el('div', 'font-weight:bold;margin-bottom:6px', 'Recipes'));
    for (const r of use.recipes()) {
      const row = el('div', 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px');
      row.append(button(r.def.name, () => startRecipe(r.def), !r.ok || use.busy() !== null));
      if (!r.ok && r.why) row.append(el('span', 'opacity:0.75;font-size:13px', r.why));
      sec.append(row);
    }
    return sec;
  }

  function lootSection(l: Loot): HTMLElement {
    const sec = el('div', 'flex:1 1 240px;min-width:240px;margin-bottom:12px;border-left:2px solid #56614a;padding-left:10px');
    sec.append(el('div', 'font-weight:bold;margin-bottom:6px', `Searching: ${l.title}`));
    if (l.items.length === 0) sec.append(el('div', 'opacity:0.6;margin-bottom:8px', 'Nothing left.'));
    l.items.forEach((stack, index) => {
      const def = getItem(stack.def);
      const row = el('div', 'display:flex;align-items:center;gap:8px;margin-bottom:6px');
      const icon = prefabIconElement(def.prefab, FALLBACK_ICON, 40);
      icon.style.cssText += ';width:40px;height:40px;flex:0 0 40px';
      row.append(icon, el('span', 'flex:1', `${def.name}${stack.count > 1 ? ` ×${stack.count}` : ''}`));
      row.append(button('Take', () => { l.onTake(index); render(); }));
      sec.append(row);
    });
    if (l.items.length > 0) {
      sec.append(button('Take all', () => {
        for (let i = l.items.length - 1; i >= 0; i--) l.onTake(i);
        render();
      }));
    }
    return sec;
  }

  function render(): void {
    applyLayout();
    content.replaceChildren();
    const portrait = window.innerHeight > window.innerWidth;
    const head = el('div', 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;' +
      `padding-right:${portrait ? 0 : 56}px`);
    head.append(el('div', 'font-size:18px;font-weight:bold', 'Pack'));
    content.append(head, progressWrap);
    const cols = el('div', 'display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start;max-width:100%;box-sizing:border-box');
    if (loot) cols.append(lootSection(loot));
    const main = el('div', 'flex:1 1 260px;min-width:0;max-width:100%;box-sizing:border-box');
    main.append(handsSection(), wornSection(), packSection(), weightSection());
    const actions = actionsSection();
    if (actions) main.append(actions);
    main.append(recipesSection());
    cols.append(main);
    content.append(cols);
    updateProgress();
  }

  function updateProgress(): void {
    const b = use.busy();
    wasBusy = b !== null;
    if (!b) { progressWrap.style.display = 'none'; return; }
    progressWrap.style.display = 'block';
    progressLabel.textContent = b.label;
    progressFill.style.width = `${Math.round(b.progress * 100)}%`;
  }

  function select(ref: StackRef, stack: ItemStack | null): void {
    selected = stack && !sameRef(selected, ref) ? ref : null;
    render();
  }

  function run(action: UseAction): void {
    use.start(action);
    selected = null;
    render();
  }

  function startRecipe(def: RecipeDef): void {
    use.start({ id: `recipe-${def.id}`, label: def.name, seconds: def.seconds, kind: 'recipe', recipe: def.id });
    render();
  }

  function setOpen(on: boolean): void {
    open = on;
    root.style.display = on ? 'block' : 'none';
    root.style.pointerEvents = on ? 'auto' : 'none';
    if (on) { applyLayout(); render(); }
    else { loot = null; selected = null; }
  }

  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(false); });
  window.addEventListener('resize', () => { if (open) applyLayout(); });
  inv.onChange(() => { if (open) render(); });

  // Keeps the progress bar moving while a timed use runs, and rebuilds once when it finishes.
  setInterval(() => {
    if (!open) return;
    const busy = use.busy() !== null;
    if (busy || wasBusy) {
      if (!busy && wasBusy) { render(); return; }
      updateProgress();
    }
  }, 200);

  ui.appendChild(root);
  if (new URLSearchParams(window.location.search).get('inv') === '1') setOpen(true);

  return {
    root,
    toggle() { setOpen(!open); },
    open() { setOpen(true); },
    close() { setOpen(false); },
    isOpen: () => open,
    showLoot(title: string, items: ItemStack[], onTake: (index: number) => void) {
      loot = { title, items, onTake };
      setOpen(true);
    },
  };
}

