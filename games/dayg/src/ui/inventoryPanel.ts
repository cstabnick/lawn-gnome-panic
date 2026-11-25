// The pack screen, Tarkov/DayZ style: unified theme, live 3D rotating player gnome preview, equipment grid,
// backpack grid, right-side loot column with full drag-and-drop (loot <-> pack <-> hands <-> worn), and item inspector.
import { prefabIconElement } from '@lawn/prefabs';
import { DOM } from '../config';
import { getItem } from '../items/defs';
import type { WornSlot } from '../items/defs';
import type { ItemStack } from '../sim/types';
import type { InventoryPanel, InventorySystem, RecipeDef, StackRef, UseAction, UseApi } from '../game/types';
import { createPlayerPreview } from './playerPreview';

const WORN: readonly WornSlot[] = ['head', 'back', 'neck', 'body'];
const WORN_LABEL: Record<WornSlot, string> = { head: 'Head', back: 'Back', neck: 'Neck', body: 'Body' };
const CELL_PX = 64;
const DRAG_PX = 6;
const FALLBACK_ICON = '📦';

const CSS = `
#${DOM.inv}{position:fixed;inset:0;z-index:50;display:none;flex-direction:column;background:var(--dg-bg);color:var(--dg-text);pointer-events:auto;
  font:14px var(--dg-font);cursor:default;user-select:none;-webkit-user-select:none;box-sizing:border-box;backdrop-filter:blur(6px);
  padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)}
#${DOM.inv}.iv-open{display:flex}
#${DOM.inv} .iv-top{display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid var(--dg-border);background:var(--dg-surface);min-height:58px;box-sizing:border-box}
#${DOM.inv} .iv-title{font-weight:700;font-size:18px;letter-spacing:.02em;white-space:nowrap;color:var(--dg-accent)}
#${DOM.inv} .iv-meters{flex:1;display:flex;gap:14px;min-width:0}
#${DOM.inv} .iv-meter{flex:1;max-width:240px;min-width:0}
#${DOM.inv} .iv-meter-label{font-size:12px;color:var(--dg-muted);margin-bottom:3px;white-space:nowrap}
#${DOM.inv} .iv-track{height:8px;background:var(--dg-surface-2);border:1px solid var(--dg-border);border-radius:4px;overflow:hidden}
#${DOM.inv} .iv-fill{height:100%;width:0;background:var(--dg-ok);transition:width .15s ease}
#${DOM.inv} .iv-close{width:48px;height:48px;border:1px solid var(--dg-border);border-radius:var(--dg-radius);background:var(--dg-surface-2);color:var(--dg-text);font:22px var(--dg-font);cursor:pointer;touch-action:manipulation;flex:none}
#${DOM.inv} .iv-close:hover{background:var(--dg-surface-hover);border-color:var(--dg-border-strong)}
#${DOM.inv} .iv-body{flex:1;min-height:0;display:grid;grid-template-columns:270px minmax(0,1fr) 300px;gap:12px;padding:12px;box-sizing:border-box}
#${DOM.inv} .iv-col{min-height:0;min-width:0;overflow:auto;display:flex;flex-direction:column;gap:12px;background:var(--dg-surface);border:1px solid var(--dg-border);border-radius:var(--dg-radius);padding:12px;box-sizing:border-box}
#${DOM.inv} .iv-preview{position:relative;height:200px;border-radius:var(--dg-radius);border:1px solid var(--dg-border);background:radial-gradient(circle at 50% 45%,#283424 0%,#151b13 100%);overflow:hidden;flex:none}
#${DOM.inv} .iv-h{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--dg-muted);margin-bottom:6px}
#${DOM.inv} .iv-equip-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
#${DOM.inv} .iv-equip{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px;border-radius:8px;background:rgba(0,0,0,0.18);border:1px solid rgba(72,86,64,0.45)}
#${DOM.inv} .iv-equip-label{font-size:11px;color:var(--dg-muted);text-align:center}
#${DOM.inv} .iv-grid{display:grid;grid-template-columns:repeat(auto-fill,${CELL_PX}px);gap:7px;align-content:start}
#${DOM.inv} .iv-cell{position:relative;width:${CELL_PX}px;height:${CELL_PX}px;min-width:44px;min-height:44px;box-sizing:border-box;border-radius:8px;
  border:2px solid var(--dg-border);background:var(--dg-surface-2);display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none;cursor:pointer;transition:border-color .12s ease,background-color .12s ease}
#${DOM.inv} .iv-cell:hover{border-color:var(--dg-border-strong);background:var(--dg-surface-hover)}
#${DOM.inv} .iv-cell.iv-empty{border-style:dashed;opacity:.75}
#${DOM.inv} .iv-cell.iv-sel{border-color:var(--dg-accent);box-shadow:0 0 0 1px var(--dg-accent) inset,0 0 12px var(--dg-accent-dim)}
#${DOM.inv} .iv-cell.iv-over{border-color:#8fd3ff;background:#23324a}
#${DOM.inv} .iv-count{position:absolute;top:2px;right:4px;font:bold 12px var(--dg-font);text-shadow:0 1px 3px #000}
#${DOM.inv} .iv-litres{position:absolute;top:2px;left:4px;font:bold 11px var(--dg-font);text-shadow:0 1px 3px #000}
#${DOM.inv} .iv-cond{position:absolute;left:3px;right:3px;bottom:2px;height:4px;background:#111;border-radius:2px;overflow:hidden}
#${DOM.inv} .iv-loot-card{padding:10px;border-radius:8px;background:rgba(232,195,90,0.06);border:1px solid var(--dg-border-strong);display:flex;flex-direction:column;gap:8px}
#${DOM.inv} .iv-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#${DOM.inv} .iv-btn{min-height:44px;min-width:44px;padding:8px 12px;border-radius:8px;border:1px solid var(--dg-border);background:var(--dg-surface-2);color:var(--dg-text);
  font:14px var(--dg-font);cursor:pointer;touch-action:manipulation}
#${DOM.inv} .iv-btn:hover:not(:disabled){background:var(--dg-surface-hover);border-color:var(--dg-border-strong)}
#${DOM.inv} .iv-btn:disabled{opacity:.45;cursor:default}
#${DOM.inv} .iv-pack-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:4px}
#${DOM.inv} .iv-tab{min-height:44px;min-width:44px;padding:6px 10px;border-radius:8px;border:1px solid var(--dg-border);
  background:var(--dg-surface-2);color:var(--dg-muted);font:600 12px var(--dg-font);cursor:pointer;touch-action:manipulation}
#${DOM.inv} .iv-tab:hover{background:var(--dg-surface-hover);color:var(--dg-text);border-color:var(--dg-border-strong)}
#${DOM.inv} .iv-tab.iv-tab-on{background:var(--dg-accent-dim);border-color:var(--dg-accent);color:var(--dg-accent)}
#${DOM.inv} .iv-stats{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;font-size:12px;color:var(--dg-muted)}
#${DOM.inv} .iv-info{border-top:1px solid var(--dg-border);background:var(--dg-surface);padding:10px 14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;min-height:74px;box-sizing:border-box}
#${DOM.inv} .iv-info-text{flex:1 1 220px;min-width:0}
#${DOM.inv} .iv-info-actions{display:flex;gap:8px;flex-wrap:wrap}
#${DOM.inv} .iv-busy{flex:1 1 200px;min-width:160px;display:none}
#${DOM.inv} .iv-ghost{position:fixed;width:56px;height:56px;transform:translate(-50%,-50%);pointer-events:none;z-index:60;opacity:.9;
  border-radius:8px;background:var(--dg-surface);border:2px solid var(--dg-accent);box-shadow:var(--dg-shadow);display:flex;align-items:center;justify-content:center;overflow:hidden}
@media (max-width:820px){
  #${DOM.inv} .iv-body{grid-template-columns:minmax(0,1fr);overflow:auto}
  #${DOM.inv} .iv-col{overflow:visible}
  #${DOM.inv} .iv-preview{height:170px}
  #${DOM.inv} .iv-meter-label{font-size:11px}
}`;

type Loot = { title: string; items: ItemStack[]; onTake: (index: number) => void };
type PackFilter = 'all' | 'food' | 'tools' | 'materials' | 'gear';

const PACK_FILTERS: readonly { id: PackFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'tools', label: 'Tools' },
  { id: 'materials', label: 'Materials' },
  { id: 'gear', label: 'Gear' },
];

function categoryOf(def: ReturnType<typeof getItem>): Exclude<PackFilter, 'all'> {
  if (def.wear !== undefined || def.tags.includes('WEAR')) return 'gear';
  if (def.resource === 'food' || def.resource === 'water' || def.resource === 'medicine') return 'food';
  if (def.resource === 'tools') return 'tools';
  return 'materials';
}

const CAT_ORDER: Record<Exclude<PackFilter, 'all'>, number> = { gear: 0, tools: 1, food: 2, materials: 3 };

function itemStatList(stack: ItemStack): string[] {
  const def = getItem(stack.def);
  const p = def.props ?? {};
  const stats: string[] = [
    `${fmt(def.weight * stack.count)} kg`,
    `${fmt(def.bulk * stack.count)} L`,
    `${Math.round(stack.condition * 100)}% cond`,
  ];
  if (stack.liquid) stats.push(`${fmt(stack.liquid.litres)} L ${stack.liquid.kind}`);
  if (p.damage !== undefined) stats.push(`⚔ ${p.damage} dmg`);
  if (p.reach !== undefined) stats.push(`Reach ${p.reach}m`);
  if (p.food !== undefined) stats.push(`+${p.food} food`);
  if (p.water !== undefined) stats.push(`+${p.water} water`);
  if (p.burnHours !== undefined) stats.push(`${p.burnHours}h burn`);
  if (p.warmth !== undefined) stats.push(`+${p.warmth} warmth`);
  if (p.armour !== undefined) stats.push(`${Math.round(p.armour * 100)}% armour`);
  if (p.light !== undefined) stats.push(`${p.light}m light`);
  if (p.capacity !== undefined) stats.push(`+${p.capacity}L cap`);
  if (p.liquidCap !== undefined) stats.push(`${p.liquidCap}L vessel`);
  return stats;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function fmt(n: number): string { return String(Number(n.toFixed(1))); }

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
    (cell.lastElementChild as HTMLElement).style.cssText = 'font-size:11px;color:var(--dg-muted);text-align:center;padding:2px';
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
  bar.style.cssText = `height:100%;width:${c * 100}%;background:${c > 0.5 ? 'var(--dg-ok)' : c > 0.2 ? 'var(--dg-warn)' : 'var(--dg-danger)'}`;
  cond.append(bar);
  cell.append(cond);
  return cell;
}

function lootCell(stack: ItemStack, index: number, selected: boolean): HTMLDivElement {
  const cell = stackCell(stack, `loot:${index}`, '', selected);
  delete cell.dataset.drop;   // loot is taken or dragged out, never dropped onto
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

  // Top bar: title, weight and bulk meters, close.
  const top = el('div', 'iv-top');
  const title = el('div', 'iv-title', 'Pack & Gear');
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
  const previewBox = el('div', 'iv-preview');
  const preview = createPlayerPreview(previewBox);
  const equipWrap = el('div');
  equipCol.append(previewBox, equipWrap);

  const packCol = el('div', 'iv-col');
  const sideCol = el('div', 'iv-col');
  body.append(equipCol, packCol, sideCol);

  // Info bar: selected item details and action buttons.
  const info = el('div', 'iv-info');
  const infoText = el('div', 'iv-info-text');
  const infoActions = el('div', 'iv-info-actions');
  const busyWrap = el('div', 'iv-busy');
  const busyLabel = el('div', '', '');
  busyLabel.style.cssText = 'font-size:13px;margin-bottom:4px';
  const busyTrack = el('div', 'iv-track');
  const busyFill = el('div', 'iv-fill');
  busyFill.style.background = 'var(--dg-accent)';
  busyTrack.append(busyFill);
  busyWrap.append(busyLabel, busyTrack);
  info.append(infoText, infoActions, busyWrap);

  root.append(top, body, info);
  root.addEventListener('mousedown', (e) => e.stopPropagation());
  ui.appendChild(root);

  let open = false;
  let selKey: string | null = null;
  let loot: Loot | null = null;
  let packFilter: PackFilter = 'all';
  let drag: { key: string; from: StackRef | null; lootIdx: number | null; x: number; y: number; active: boolean; ghost: HTMLElement | null } | null = null;
  let suppressClick = false;

  function selectedStack(): { stack: ItemStack; ref: StackRef } | null {
    if (!selKey || selKey.startsWith('loot:')) return null;
    const ref = keyRef(selKey);
    const stack = inv.get(ref);
    return stack ? { stack, ref } : null;
  }

  function renderEquip(): void {
    equipWrap.replaceChildren();
    equipWrap.append(el('div', 'iv-h', 'Hands & Worn'));
    const grid = el('div', 'iv-equip-grid');
    for (let i = 0; i < 2; i++) {
      const key = `hand:${i}`;
      const card = el('div', 'iv-equip');
      card.append(el('div', 'iv-equip-label', i === 0 ? 'Main Hand' : 'Off Hand'), stackCell(inv.get({ where: 'hand', index: i as 0 | 1 }), key, '', selKey === key));
      grid.append(card);
    }
    for (const slotName of WORN) {
      const key = `worn:${slotName}`;
      const card = el('div', 'iv-equip');
      card.append(el('div', 'iv-equip-label', WORN_LABEL[slotName]),
        stackCell(inv.get({ where: 'worn', slot: slotName }), key, WORN_LABEL[slotName], selKey === key));
      grid.append(card);
    }
    equipWrap.append(grid);
  }

  function sortPack(): void {
    inv.state.pack.sort((a, b) => {
      const da = getItem(a.def);
      const db = getItem(b.def);
      const ca = CAT_ORDER[categoryOf(da)];
      const cb = CAT_ORDER[categoryOf(db)];
      if (ca !== cb) return ca - cb;
      return da.name.localeCompare(db.name);
    });
    selKey = null;
    deps.onSound?.('stack');
    render();
  }

  function quickTransfer(key: string): boolean {
    if (key.startsWith('loot:') && loot) {
      const idx = Number(key.split(':')[1]);
      if (!loot.items[idx]) return false;
      loot.onTake(idx);
      deps.onSound?.('drop');
      selKey = null;
      render();
      return true;
    }
    if (key.startsWith('pack:')) {
      const ref = keyRef(key);
      const stack = inv.get(ref);
      if (!stack) return false;
      const def = getItem(stack.def);
      let moved = false;
      if (def.wear) {
        moved = inv.move(ref, { where: 'worn', slot: def.wear });
      } else {
        const targetHand: 0 | 1 = inv.get({ where: 'hand', index: 0 }) === null ? 0 : inv.get({ where: 'hand', index: 1 }) === null ? 1 : 0;
        moved = inv.move(ref, { where: 'hand', index: targetHand });
      }
      if (moved) {
        deps.onSound?.('drop');
        selKey = null;
        render();
      }
      return moved;
    }
    if (key.startsWith('hand:') || key.startsWith('worn:')) {
      const ref = keyRef(key);
      if (!inv.get(ref)) return false;
      const moved = inv.move(ref, { where: 'pack', index: inv.state.pack.length });
      if (moved) {
        deps.onSound?.('drop');
        selKey = null;
        render();
      }
      return moved;
    }
    return false;
  }

  function renderPack(): void {
    packCol.replaceChildren();
    const count = inv.state.pack.length;
    packCol.append(el('div', 'iv-h', `Backpack · ${count} ${count === 1 ? 'item' : 'items'}`));
    const bar = el('div', 'iv-pack-bar');
    for (const f of PACK_FILTERS) {
      const btn = el('button', `iv-tab${packFilter === f.id ? ' iv-tab-on' : ''}`, f.label);
      btn.type = 'button';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        packFilter = f.id;
        renderPack();
      });
      bar.append(btn);
    }
    const sortBtn = textButton('Sort', () => sortPack(), count < 2);
    sortBtn.style.marginLeft = 'auto';
    bar.append(sortBtn);
    packCol.append(bar);

    const grid = el('div', 'iv-grid');
    inv.state.pack.forEach((stack, index) => {
      if (packFilter !== 'all' && categoryOf(getItem(stack.def)) !== packFilter) return;
      grid.append(stackCell(stack, `pack:${index}`, '', selKey === `pack:${index}`));
    });
    grid.append(stackCell(null, `pack:${count}`, 'Drop here', false));
    packCol.append(grid);
  }

  function renderSide(): void {
    sideCol.replaceChildren();
    if (loot) {
      const card = el('div', 'iv-loot-card');
      card.append(el('div', 'iv-h', `Loot: ${loot.title}`));
      const grid = el('div', 'iv-grid');
      if (loot.items.length === 0) grid.append(el('div', '', 'Nothing left.'));
      loot.items.forEach((stack, index) => grid.append(lootCell(stack, index, selKey === `loot:${index}`)));
      card.append(grid);
      if (loot.items.length > 0) {
        card.append(textButton('Take all', () => {
          for (let i = (loot?.items.length ?? 0) - 1; i >= 0; i--) loot?.onTake(i);
          selKey = null;
          render();
        }));
      }
      sideCol.append(card);
    }
    sideCol.append(el('div', 'iv-h', 'Recipes'));
    for (const r of use.recipes()) {
      const row = el('div', '');
      row.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-bottom:6px';
      row.append(textButton(r.def.name, () => startRecipe(r.def), !r.ok || use.busy() !== null));
      if (!r.ok && r.why) {
        const why = el('span', '', r.why);
        why.style.cssText = 'font-size:12px;color:var(--dg-muted)';
        row.append(why);
      }
      sideCol.append(row);
    }
  }

  function renderStats(stack: ItemStack): void {
    const statsRow = el('div', 'iv-stats');
    for (const s of itemStatList(stack)) {
      const pill = el('span', 'dg-pill', s);
      statsRow.append(pill);
    }
    infoText.append(statsRow);
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
      renderStats(sel.stack);
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
        infoText.append(el('div', '', `${def.name}${stack.count > 1 ? ` ×${stack.count}` : ''} · drag or Shift/double-click to take`));
        (infoText.lastElementChild as HTMLElement).style.cssText = 'font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
        renderStats(stack);
        infoActions.append(textButton('Take', () => {
          loot?.onTake(index);
          selKey = null;
          render();
        }));
        return;
      }
    }
    infoText.append(el('div', '', 'Drag, Shift+Click, or double-click to transfer items between Loot, Pack, Hands & Worn.'));
    (infoText.lastElementChild as HTMLElement).style.cssText = 'font-size:13px;color:var(--dg-muted)';
  }

  function render(): void {
    if (!open) return;
    weight.label.textContent = `${fmt(inv.weight())} / ${fmt(inv.carryCapacity())} kg`;
    weight.fill.style.width = `${Math.min(100, inv.carryCapacity() > 0 ? (inv.weight() / inv.carryCapacity()) * 100 : 0)}%`;
    weight.fill.style.background = inv.weight() > inv.carryCapacity() ? 'var(--dg-danger)' : 'var(--dg-ok)';
    bulk.label.textContent = `${fmt(inv.bulkUsed())} / ${fmt(inv.bulkCapacity())} L`;
    bulk.fill.style.width = `${Math.min(100, inv.bulkCapacity() > 0 ? (inv.bulkUsed() / inv.bulkCapacity()) * 100 : 0)}%`;
    bulk.fill.style.background = inv.bulkUsed() > inv.bulkCapacity() ? 'var(--dg-danger)' : 'var(--dg-ok)';
    preview.sync({
      held: inv.state.hands[0]?.def ?? null,
      back: inv.state.worn.back?.def ?? null,
      head: inv.state.worn.head?.def ?? null,
    });
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

  function cellAt(x: number, y: number): HTMLElement | null {
    const node = document.elementFromPoint(x, y);
    return node instanceof HTMLElement ? node.closest<HTMLElement>('[data-key]') : null;
  }

  function dragStackOf(d: NonNullable<typeof drag>): ItemStack | null {
    if (d.lootIdx !== null && loot) return loot.items[d.lootIdx] ?? null;
    return d.from ? inv.get(d.from) : null;
  }

  root.addEventListener('pointerdown', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-key]');
    if (!cell || !cell.dataset.key) return;
    const key = cell.dataset.key;
    if (key.startsWith('loot:')) {
      const idx = Number(key.split(':')[1]);
      drag = { key, from: null, lootIdx: idx, x: e.clientX, y: e.clientY, active: false, ghost: null };
      if (loot?.items[idx]) e.preventDefault();
      return;
    }
    const ref = keyRef(key);
    drag = { key, from: ref, lootIdx: null, x: e.clientX, y: e.clientY, active: false, ghost: null };
    if (inv.get(ref)) e.preventDefault();
  });

  window.addEventListener('pointermove', (e) => {
    if (!drag || !open) return;
    if (!drag.active && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > DRAG_PX) {
      const stack = dragStackOf(drag);
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
    for (const c of root.querySelectorAll('.iv-over')) c.classList.remove('iv-over');
    if (d.active) {
      suppressClick = true;
      const target = cellAt(e.clientX, e.clientY);
      const dropKey = target?.dataset.drop;
      if (dropKey && dropKey !== d.key) {
        if (d.lootIdx !== null && loot) {
          const itemDef = loot.items[d.lootIdx]?.def;
          const targetRef = keyRef(dropKey);
          loot.onTake(d.lootIdx);
          if (itemDef && targetRef.where !== 'pack') {
            const idx = inv.state.pack.map((s) => s.def).lastIndexOf(itemDef);
            if (idx >= 0) inv.move({ where: 'pack', index: idx }, targetRef);
          }
          deps.onSound?.('drop');
        } else if (d.from) {
          const moving = inv.get(d.from);
          const onto = inv.get(keyRef(dropKey));
          if (inv.move(d.from, keyRef(dropKey))) {
            deps.onSound?.(moving && onto && moving.def === onto.def ? 'stack' : 'drop');
          }
        }
      }
      selKey = null;
      render();
      return;
    }
    if (suppressClick) { suppressClick = false; return; }
    if (e.shiftKey && quickTransfer(d.key)) return;
    if (d.key === selKey) selKey = null;
    else selKey = d.key;
    render();
  });

  root.addEventListener('dblclick', (e) => {
    if (!open) return;
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-key]');
    if (!cell || !cell.dataset.key) return;
    e.stopPropagation();
    quickTransfer(cell.dataset.key);
  });

  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(false); });

  window.addEventListener('keydown', (e) => {
    if (open && e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  });

  inv.onChange(() => { if (open) render(); });

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
    preview.setActive(on);
    if (on) {
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
