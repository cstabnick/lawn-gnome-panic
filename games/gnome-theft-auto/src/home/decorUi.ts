// The Decorate panel for the player's flat (E10-A2): a touch-first floor plan (tap, drag, rotate), a storage strip, a
// furniture shop and wall / floor colours. Inside the flat the 3D room moves live; from the tablet it edits the plan only.
import { prefabIconElement } from '@lawn/prefabs';
import type { Economy } from '../economy';
import { currentInterior, refreshInterior } from '../interiors/runtime';
import {
  addStored, clampPose, commitLayout, fits, halfSize, loadLayout, movePiece, onHomeChange, pieceById, pieceObject,
  placeFromStore, rotatePiece, setColours, stockOf, storedList, storePiece,
} from './layout';
import { FLAT_ID, FLAT_ROOM, FLOOR_COLOURS, FURNITURE_SHOP, WALL_COLOURS, type HomeLayout } from './types';

export type DecorTab = 'room' | 'shop' | 'colours';
export interface DecorDeps {
  ui: HTMLElement;
  economy: Pick<Economy, 'spend' | 'state'>;
  toast(text: string): void;
}
export interface DecorPanel { open(tab?: DecorTab): void; close(): void; isOpen(): boolean }

const CSS = `
.gta-decor{position:fixed;display:none;z-index:37;box-sizing:border-box;pointer-events:auto;font-family:system-ui,-apple-system,sans-serif;
  color:#f4f6f8;background:#181c20;border:2px solid rgba(255,255,255,0.22);box-shadow:0 12px 32px rgba(0,0,0,0.65);
  left:0;right:0;bottom:0;max-height:62vh;overflow-y:auto;-webkit-overflow-scrolling:touch;border-radius:14px 14px 0 0;
  padding:10px 12px calc(env(safe-area-inset-bottom,0px) + 10px);flex-direction:column;gap:8px;}
.gta-decor.gta-decor-open{display:flex;}
@media (min-aspect-ratio:1/1){.gta-decor{left:auto;top:0;bottom:0;right:0;width:min(420px,40vw);max-height:none;border-radius:14px 0 0 14px;
  padding-right:calc(env(safe-area-inset-right,0px) + 12px);padding-top:calc(env(safe-area-inset-top,0px) + 10px);}}
.gta-decor button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation;min-width:44px;min-height:44px;border-radius:10px;
  border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.08);padding:0 10px;}
.gta-decor button:disabled{opacity:0.4;cursor:default;}
.gta-decor button.gta-decor-on{border:2px solid #ffd23f;color:#ffd23f;background:rgba(255,210,63,0.16);}
.gta-decor-head{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.gta-decor-title{font-size:18px;font-weight:800;color:#ffd23f;margin-right:auto;}
.gta-decor-acorns{font-size:14px;font-weight:800;}
.gta-decor-tabs{display:flex;gap:6px;}
.gta-decor-tabs button{flex:1;font-weight:800;}
.gta-decor-note{font-size:12px;opacity:0.8;}
.gta-decor-plan{width:100%;aspect-ratio:6/5;min-height:250px;display:block;touch-action:none;border-radius:8px;background:#0e1114;}
.gta-decor-tools{display:flex;flex-wrap:wrap;gap:6px;}
.gta-decor-store{display:flex;flex-wrap:wrap;gap:6px;}
.gta-decor-tile{display:flex;align-items:center;gap:6px;font-size:13px;}
.gta-decor-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.18);}
.gta-decor-row .gta-decor-info{flex:1;min-width:0;font-size:14px;font-weight:700;}
.gta-decor-row .gta-decor-meta{font-size:12px;opacity:0.75;font-weight:400;}
.gta-decor-swatches{display:flex;flex-wrap:wrap;gap:10px;}
.gta-decor-sw{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;width:64px;text-align:center;}
.gta-decor-sw button{width:44px;height:44px;border-radius:50%;padding:0;border:2px solid rgba(255,255,255,0.3);}
.gta-decor-sw button.gta-decor-on{border:3px solid #ffd23f;box-shadow:0 0 0 2px #181c20 inset;}
`;

const hex = (c: number): string => '#' + c.toString(16).padStart(6, '0');
const colourOf = (list: readonly { id: string; color: number }[], id: string): number => (list.find((c) => c.id === id) ?? list[0]).color;
const layer = (prefab: string): number => (stockOf(prefab)?.flat ? 0 : stockOf(prefab)?.wall ? 2 : 1);

type Kid = HTMLElement | string | null;
function h(tag: string, cls: string, ...kids: Kid[]): HTMLElement {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  for (const k of kids) {
    if (k === null) continue;
    el.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
  }
  return el;
}
function icon(prefab: string, px = 28): HTMLElement {
  try {
    return prefabIconElement(prefab, '🪑', px);
  } catch {
    return h('span', '', '🪑');
  }
}
function clear(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

interface Drag {
  uid: string; dx: number; dz: number; startX: number; startY: number; moved: boolean;
  ghost: { x: number; z: number; yaw: number } | null; ok: boolean;
}

export function createDecorPanel(deps: DecorDeps): DecorPanel {
  const style = document.createElement('style');
  style.textContent = CSS;
  (document.head ?? deps.ui).appendChild(style);

  const root = h('div', 'gta-decor');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Decorate');
  deps.ui.appendChild(root);

  let opened = false;
  let tab: DecorTab = 'room';
  let layout: HomeLayout = loadLayout();
  let selected: string | null = null;
  let unsub: (() => void) | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let drag: Drag | null = null;

  const inside = (): boolean => currentInterior() === FLAT_ID;
  const apply = (): void => {
    commitLayout(layout);
    if (inside()) refreshInterior();
  };
  const stopEvt = (e: Event): void => e.stopPropagation();

  // ---- Floor plan ------------------------------------------------------------------------------------------------

  function drawPlan(): void {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const k = canvas.width / FLAT_ROOM.w;
    const W = FLAT_ROOM.w, D = FLAT_ROOM.d;
    const X = (x: number): number => (x + W / 2) * k;
    const Z = (z: number): number => (z + D / 2) * k;

    const drawPiece = (prefab: string, x: number, z: number, yaw: number, outline: string | null, alpha: number, label: string): void => {
      const s = stockOf(prefab);
      const { hx, hz } = halfSize(prefab, yaw);
      const wallBar = !!s?.wall;
      const rw = (wallBar ? Math.max(hx, 0.08) : hx) * 2 * k, rh = (wallBar ? Math.max(hz, 0.08) : hz) * 2 * k;
      const cx = X(x), cz = Z(z);
      ctx.globalAlpha = s?.flat ? Math.min(alpha, 0.55) : alpha;
      ctx.fillStyle = s?.flat ? '#b25a5a' : wallBar ? '#d6c47a' : '#6d5a46';
      ctx.fillRect(cx - rw / 2, cz - rh / 2, rw, rh);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = outline ?? 'rgba(255,255,255,0.45)';
      ctx.lineWidth = (outline ? 3 : 1) * dpr;
      ctx.strokeRect(cx - rw / 2, cz - rh / 2, rw, rh);
      // Front tick on the side the piece faces.
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(cx + fx * rw / 2, cz + fz * rh / 2);
      ctx.lineTo(cx + fx * (rw / 2 + 6 * dpr), cz + fz * (rh / 2 + 6 * dpr));
      ctx.stroke();
      if (label && !wallBar) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(9, 0.32 * k / dpr) * dpr}px system-ui,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label.split(' ')[0], cx, cz, rw - 2);
      }
    };

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = hex(colourOf(FLOOR_COLOURS, layout.floor));
    ctx.fillRect(0, 0, W * k, D * k);
    // The door square nothing may stand in (hatched).
    const dc = FLAT_ROOM.doorClear;
    const dx0 = X(FLAT_ROOM.door.x - dc / 2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx0, Z(D / 2 - dc), dc * k, dc * k);
    ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5 * dpr;
    for (let i = -dc * k; i < dc * k; i += 8 * dpr) {
      ctx.beginPath();
      ctx.moveTo(dx0 + i, Z(D / 2));
      ctx.lineTo(dx0 + i + dc * k, Z(D / 2 - dc));
      ctx.stroke();
    }
    ctx.restore();
    // Rugs first (semi-transparent), then solids, then wall hangings.
    const sorted = [...layout.items].sort((a, b) => layer(a.prefab) - layer(b.prefab));
    for (const it of sorted) {
      const faded = drag?.moved && drag.uid === it.uid;
      drawPiece(it.prefab, it.x, it.z, it.yaw, it.uid === selected ? '#ff9a2e' : null, faded ? 0.35 : 1, stockOf(it.prefab)?.name ?? '');
    }
    if (drag?.moved && drag.ghost) {
      const it = pieceById(layout, drag.uid);
      if (it) drawPiece(it.prefab, drag.ghost.x, drag.ghost.z, drag.ghost.yaw, drag.ok ? '#3ddc6a' : '#ff4a4a', 0.85, '');
    }
    // Walls, with the door gap on the south wall.
    ctx.strokeStyle = hex(colourOf(WALL_COLOURS, layout.wall));
    ctx.lineWidth = 0.3 * k;
    const t = 0.15 * k;
    ctx.beginPath();
    ctx.moveTo(X(FLAT_ROOM.door.x - 0.6), D * k - t);
    ctx.lineTo(t, D * k - t);
    ctx.lineTo(t, t);
    ctx.lineTo(W * k - t, t);
    ctx.lineTo(W * k - t, D * k - t);
    ctx.lineTo(X(FLAT_ROOM.door.x + 0.6), D * k - t);
    ctx.stroke();
  }

  function roomPoint(e: PointerEvent): { x: number; z: number } {
    const r = canvas!.getBoundingClientRect();
    const k = (r.width || 360) / FLAT_ROOM.w;
    return { x: (e.clientX - r.left) / k - FLAT_ROOM.w / 2, z: (e.clientY - r.top) / k - FLAT_ROOM.d / 2 };
  }

  function pieceAt(x: number, z: number): string | null {
    const hit = [...layout.items].sort((a, b) => layer(b.prefab) - layer(a.prefab)).find((it) => {
      const { hx, hz } = halfSize(it.prefab, it.yaw);
      return Math.abs(x - it.x) <= Math.max(hx, 0.15) + 0.1 && Math.abs(z - it.z) <= Math.max(hz, 0.15) + 0.1;
    });
    return hit?.uid ?? null;
  }

  function onDown(e: PointerEvent): void {
    stopEvt(e);
    const p = roomPoint(e);
    const uid = pieceAt(p.x, p.z);
    selected = uid;
    drag = null;
    if (uid) {
      const it = pieceById(layout, uid)!;
      drag = { uid, dx: it.x - p.x, dz: it.z - p.z, startX: e.clientX, startY: e.clientY, moved: false, ghost: null, ok: true };
      try { canvas!.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    }
    render();
  }

  function onMove(e: PointerEvent): void {
    if (!drag) return;
    stopEvt(e);
    if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 6) return;
    drag.moved = true;
    const it = pieceById(layout, drag.uid);
    if (!it) return;
    const p = roomPoint(e);
    const g = clampPose(it.prefab, p.x + drag.dx, p.z + drag.dz, it.yaw);
    drag.ghost = g;
    drag.ok = fits(layout, it.prefab, g.x, g.z, g.yaw, it.uid);
    if (inside()) {
      const o = pieceObject(it.uid);
      if (o) { o.position.x = g.x; o.position.z = g.z; }
    }
    drawPlan();
  }

  function onUp(e: PointerEvent): void {
    if (!drag) return;
    stopEvt(e);
    const d = drag;
    drag = null;
    try { canvas!.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    const it = pieceById(layout, d.uid);
    if (d.moved && d.ghost && it) {
      if (movePiece(layout, d.uid, d.ghost.x, d.ghost.z)) {
        apply();
      } else {
        if (!d.ok) deps.toast('No room there.');
        const o = inside() ? pieceObject(it.uid) : undefined;
        if (o) { o.position.x = it.x; o.position.z = it.z; }
      }
    }
    render();
  }

  // ---- Tabs ------------------------------------------------------------------------------------------------------

  function toolButton(label: string, title: string, onClick: () => void): HTMLElement {
    const b = h('button', '', label);
    b.setAttribute('aria-label', title);
    if (selected === null) b.setAttribute('disabled', 'true');
    b.addEventListener('click', onClick);
    return b;
  }

  function change(ok: boolean): void {
    if (ok) apply();
    render();
  }

  function nudge(dx: number, dz: number): void {
    const it = selected ? pieceById(layout, selected) : undefined;
    if (!it) return;
    const g = FLAT_ROOM.grid;
    if (!movePiece(layout, it.uid, it.x + dx * g, it.z + dz * g)) deps.toast('No room there.');
    else apply();
    render();
  }

  function storeSelected(): void {
    if (selected && storePiece(layout, selected)) {
      selected = null;
      change(true);
    }
  }

  function roomTab(body: HTMLElement): void {
    if (!inside()) body.appendChild(h('div', 'gta-decor-note', 'Arranging from afar: you will see it next time you are home.'));
    const c = document.createElement('canvas');
    canvas = c;
    c.className = 'gta-decor-plan';
    const cssW = Math.min(600, Math.max(300, root.clientWidth ? root.clientWidth - 24 : 360));
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(cssW * dpr);
    c.height = Math.round(cssW * dpr * (FLAT_ROOM.d / FLAT_ROOM.w));
    c.addEventListener('pointerdown', onDown);
    c.addEventListener('pointermove', onMove);
    c.addEventListener('pointerup', onUp);
    c.addEventListener('pointercancel', onUp);
    body.appendChild(c);

    const tools = h('div', 'gta-decor-tools');
    tools.appendChild(toolButton('⟳', 'Rotate', () => { if (selected) change(rotatePiece(layout, selected)); }));
    tools.appendChild(toolButton('◀', 'Nudge west', () => nudge(-1, 0)));
    tools.appendChild(toolButton('▲', 'Nudge north', () => nudge(0, -1)));
    tools.appendChild(toolButton('▼', 'Nudge south', () => nudge(0, 1)));
    tools.appendChild(toolButton('▶', 'Nudge east', () => nudge(1, 0)));
    tools.appendChild(toolButton('Store', 'Store', storeSelected));
    body.appendChild(tools);

    body.appendChild(h('div', 'gta-decor-note', 'Storage'));
    const store = h('div', 'gta-decor-store');
    const stored = storedList(layout);
    if (!stored.length) store.appendChild(h('div', 'gta-decor-note', 'Nothing in storage. Buy furniture in the Shop tab.'));
    for (const s of stored) {
      const t = h('button', 'gta-decor-tile', icon(s.prefab, 24), `${s.name} ×${s.count}`);
      t.addEventListener('click', () => {
        const piece = placeFromStore(layout, s.prefab, 0, 0, 0);
        if (!piece) { deps.toast('No free floor for that. Store something first.'); return; }
        selected = piece.uid;
        apply();
        render();
      });
      store.appendChild(t);
    }
    body.appendChild(store);
    drawPlan();
  }

  function owned(prefab: string): number {
    return layout.items.filter((i) => i.prefab === prefab).length + (layout.stored[prefab] ?? 0);
  }

  function shopTab(body: HTMLElement): void {
    body.appendChild(h('div', 'gta-decor-note', 'Gnome & Garden Furnishings. Delivery to Saucer Court, stairs extra (free).'));
    const acorns = deps.economy.state().acorns;
    for (const s of FURNITURE_SHOP) {
      const buy = h('button', '', 'Buy');
      if (acorns < s.price) buy.setAttribute('disabled', 'true');
      buy.addEventListener('click', () => {
        if (!deps.economy.spend(s.price, 'Furniture')) return;
        addStored(layout, s.prefab, 1);
        commitLayout(layout);
        deps.toast(`${s.name} delivered to your storage.`);
        render();
      });
      body.appendChild(h('div', 'gta-decor-row', icon(s.prefab, 32),
        h('div', 'gta-decor-info', s.name, h('div', 'gta-decor-meta', `🌰 ${s.price}  ·  you own ${owned(s.prefab)}`)), buy));
    }
  }

  function swatchRow(title: string, list: readonly { id: string; name: string; color: number }[], current: string, pick: (id: string) => void): HTMLElement {
    const row = h('div', 'gta-decor-swatches');
    for (const c of list) {
      const b = h('button', c.id === current ? 'gta-decor-on' : '');
      b.style.background = hex(c.color);
      b.setAttribute('aria-label', c.name);
      b.addEventListener('click', () => pick(c.id));
      row.appendChild(h('div', 'gta-decor-sw', b, c.name));
    }
    return h('div', '', h('div', 'gta-decor-note', title), row);
  }

  function coloursTab(body: HTMLElement): void {
    body.appendChild(swatchRow('Walls', WALL_COLOURS, layout.wall, (id) => change(setColours(layout, id))));
    body.appendChild(swatchRow('Floor', FLOOR_COLOURS, layout.floor, (id) => change(setColours(layout, undefined, id))));
  }

  // ---- Frame -----------------------------------------------------------------------------------------------------

  function render(): void {
    clear(root);
    canvas = null;
    const close = h('button', '', '✕');
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => api.close());
    root.appendChild(h('div', 'gta-decor-head', h('div', 'gta-decor-title', 'Flat 3B'),
      h('div', 'gta-decor-acorns', `🌰 ${deps.economy.state().acorns}`), close));
    const tabs = h('div', 'gta-decor-tabs');
    for (const [id, label] of [['room', 'Room'], ['shop', 'Shop'], ['colours', 'Colours']] as const) {
      const b = h('button', id === tab ? 'gta-decor-on' : '', label);
      b.addEventListener('click', () => { tab = id; render(); });
      tabs.appendChild(b);
    }
    root.appendChild(tabs);
    const body = h('div', 'gta-decor-body');
    root.appendChild(body);
    if (tab === 'room') roomTab(body);
    else if (tab === 'shop') shopTab(body);
    else coloursTab(body);
  }

  function onKey(e: KeyboardEvent): void {
    if (!opened) return;
    const k = e.key;
    let used = true;
    if (k === 'Escape') api.close();
    else if (tab !== 'room') used = false;
    else if (k === 'ArrowLeft') nudge(-1, 0);
    else if (k === 'ArrowRight') nudge(1, 0);
    else if (k === 'ArrowUp') nudge(0, -1);
    else if (k === 'ArrowDown') nudge(0, 1);
    else if (k === 'r' || k === 'R') { if (selected) change(rotatePiece(layout, selected)); }
    else if (k === 'Delete') storeSelected();
    else used = false;
    if (used) { e.preventDefault(); e.stopPropagation(); }
  }

  // Touches on the sheet must not start the stick or camera underneath.
  for (const t of ['pointerdown', 'touchstart', 'mousedown', 'wheel']) root.addEventListener(t, stopEvt);

  const api: DecorPanel = {
    open(t?: DecorTab) {
      layout = loadLayout();
      if (t) tab = t;
      if (selected && !pieceById(layout, selected)) selected = null;
      if (!opened) {
        opened = true;
        unsub = onHomeChange((l) => { layout = l; if (!drag?.moved) render(); });
        window.addEventListener('keydown', onKey, true);
        document.body?.setAttribute('data-decor', 'open');
        root.classList.add('gta-decor-open');
      }
      render();
    },
    close() {
      if (!opened) return;
      opened = false;
      drag = null;
      unsub?.();
      unsub = null;
      window.removeEventListener('keydown', onKey, true);
      document.body?.removeAttribute('data-decor');
      root.classList.remove('gta-decor-open');
    },
    isOpen: () => opened,
  };
  return api;
}
