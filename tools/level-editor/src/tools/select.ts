// The select tool: place, pick, drag, edit and delete the things in a zone (regions, lakes, houses, decks, props, stamps).
// Every change goes through ctx.editZone so that one gesture is one undo step. A drag previews through ctx.touch and only
// records its undo entry on release, so the live object is put back to where the drag started first.
import type { CollectionDef, EditorContext, FieldDef, GroundHit, Item, MutableZone, Tool } from '../context';
import { COLLECTIONS, collection } from '../profile';
import { zoneRect } from '../state';
import { pickItem } from './selectMath';

type Zone = EditorContext['zone'];
type Pick = { collection: string; index: number };
type Drag = {
  zone: Zone;
  c: CollectionDef;
  index: number;
  startX: number;
  startZ: number;
  offX: number;
  offZ: number;
  moved: boolean;
};

// The tool is a single module-level object, mounted once, so its state lives here.
let ctx: EditorContext;
let armed: CollectionDef | null = null;
let drag: Drag | null = null;
const addButtons = new Map<string, HTMLButtonElement>();
let hint: HTMLElement;
let itemsBox: HTMLElement;
let inspector: HTMLElement;

const POSITION: readonly FieldDef[] = [
  { key: 'x', label: 'X', type: 'number', step: 0.1 },
  { key: 'z', label: 'Z', type: 'number', step: 0.1 },
];

function zoneDef(): MutableZone {
  return ctx.zones[ctx.zone] as MutableZone;
}

function liveItem(sel: Pick): Item | undefined {
  return collection(sel.collection).items(zoneDef())[sel.index];
}

// Stamps of two ops share one array; a collection only shows the entries it accepts.
function visible(c: CollectionDef, def: MutableZone): { item: Item; index: number }[] {
  const out: { item: Item; index: number }[] = [];
  c.items(def).forEach((item, index) => {
    if (!c.accepts || c.accepts(item)) out.push({ item, index });
  });
  return out;
}

// Typing in a field must not be taken as a shortcut (Delete would otherwise remove the selected item).
function isTyping(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;
}

function renderAddButtons(): void {
  for (const [id, b] of addButtons) b.classList.toggle('on', armed?.id === id);
  hint.hidden = armed === null;
}

function renderItems(): void {
  itemsBox.replaceChildren();
  const def = zoneDef();
  const sel = ctx.selection;
  for (const c of COLLECTIONS) {
    const rows = visible(c, def);
    const h = document.createElement('h3');
    h.textContent = `${c.label} (${rows.length})`;
    itemsBox.append(h);
    for (const { item, index } of rows) {
      const b = document.createElement('button');
      const name = item.name ?? item.id ?? item.prefab;
      b.textContent = `${name ? String(name) : String(index)}  (${item.x.toFixed(1)}, ${item.z.toFixed(1)})`;
      b.classList.toggle('on', sel !== null && sel.collection === c.id && sel.index === index);
      b.addEventListener('click', () => {
        ctx.select({ collection: c.id, index });
        ctx.viewport.focus(item.x, item.z);
      });
      itemsBox.append(b);
    }
  }
}

// A field edit: one undo step. `numeric` parses the input; NaN is ignored.
function commitField(c: CollectionDef, index: number, f: FieldDef, raw: string): void {
  let value: unknown = raw;
  if (f.type === 'number') {
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    value = n;
  }
  ctx.editZone(`Edit ${c.label} ${f.label}`, ctx.zone, (def) => {
    c.items(def)[index][f.key] = value;
  });
}

function fieldRow(c: CollectionDef, index: number, f: FieldDef, item: Item): HTMLElement {
  const row = document.createElement('label');
  row.textContent = f.label;
  const current = item[f.key];
  if (f.type === 'enum') {
    const s = document.createElement('select');
    for (const o of f.options) {
      const op = document.createElement('option');
      op.value = o;
      op.textContent = o;
      s.append(op);
    }
    s.value = String(current ?? '');
    s.addEventListener('change', () => commitField(c, index, f, s.value));
    row.append(s);
  } else {
    const i = document.createElement('input');
    i.type = f.type === 'number' ? 'number' : 'text';
    if (f.type === 'number') {
      if (f.step !== undefined) i.step = String(f.step);
      if (f.min !== undefined) i.min = String(f.min);
      if (f.max !== undefined) i.max = String(f.max);
    }
    i.value = String(current ?? '');
    i.addEventListener('change', () => commitField(c, index, f, i.value));
    row.append(i);
  }
  return row;
}

function renderInspector(): void {
  inspector.replaceChildren();
  const sel = ctx.selection;
  if (sel === null) return;
  const item = liveItem(sel);
  if (!item) return;
  const c = collection(sel.collection);

  const h = document.createElement('h3');
  h.textContent = c.label;
  inspector.append(h);
  for (const f of c.fields) inspector.append(fieldRow(c, sel.index, f, item));
  for (const f of POSITION) inspector.append(fieldRow(c, sel.index, f, item));

  const del = document.createElement('button');
  del.textContent = `Delete ${c.label}`;
  del.addEventListener('click', () => deleteSelected());
  inspector.append(del);
}

function renderAll(): void {
  renderAddButtons();
  renderItems();
  renderInspector();
}

function deleteSelected(): void {
  const sel = ctx.selection;
  if (sel === null) return;
  const c = collection(sel.collection);
  const blocked = c.deleteBlocked?.(zoneDef(), sel.index);
  if (typeof blocked === 'string') {
    ctx.status(blocked);
    return;
  }
  ctx.editZone(`Delete ${c.label}`, ctx.zone, (def) => {
    c.items(def).splice(sel.index, 1);
  });
  ctx.select(null);
}

function placeAt(c: CollectionDef, hit: GroundHit): void {
  ctx.editZone(`Add ${c.label}`, ctx.zone, (def) => {
    c.items(def).push(c.make(Math.round(hit.x * 10) / 10, Math.round(hit.z * 10) / 10, hit.y));
  });
  // Read the index after the edit: it is the position the new item was pushed to in the raw array.
  const list = c.items(zoneDef());
  ctx.select({ collection: c.id, index: list.length - 1 });
  armed = null;
  renderAddButtons();
}

function startDrag(pick: Pick, hit: GroundHit): void {
  const c = collection(pick.collection);
  const item = c.items(zoneDef())[pick.index];
  drag = {
    zone: ctx.zone,
    c,
    index: pick.index,
    startX: item.x,
    startZ: item.z,
    offX: hit.x - item.x,
    offZ: hit.z - item.z,
    moved: false,
  };
}

// Ends the drag. commit=true records one 'Move' undo step; commit=false (cancel) puts the item back.
function endDrag(commit: boolean): void {
  const d = drag;
  if (d === null) return;
  drag = null;
  if (!d.moved) return;
  const item = d.c.items(ctx.zones[d.zone] as MutableZone)[d.index];
  // Whole decimetres, so the saved level JSON stays readable and diffable (roads are rounded the same way).
  const x = Math.round(item.x * 10) / 10;
  const z = Math.round(item.z * 10) / 10;
  item.x = d.startX;
  item.z = d.startZ;
  if (commit && (x !== d.startX || z !== d.startZ)) {
    ctx.editZone(`Move ${d.c.label}`, d.zone, (def) => {
      const it = d.c.items(def)[d.index];
      it.x = x;
      it.z = z;
    });
  } else {
    ctx.touch(zoneRect(ctx.zones[d.zone]));
  }
}

function onPointerDown(ev: PointerEvent): void {
  if (ev.button !== 0) return;
  const hit = ctx.viewport.pick(ev);
  if (armed !== null) {
    if (hit) placeAt(armed, hit);
    return;
  }
  if (hit === null) {
    ctx.select(null);
    return;
  }
  const pick = pickItem(zoneDef(), COLLECTIONS, hit.x, hit.z);
  const sel = ctx.selection;
  if (pick !== null && sel !== null && pick.collection === sel.collection && pick.index === sel.index) {
    startDrag(pick, hit);
    return;
  }
  ctx.select(pick);
}

function onPointerMove(ev: PointerEvent): void {
  const d = drag;
  if (d === null) return;
  const hit = ctx.viewport.pick(ev);
  if (hit === null) return;
  const item = d.c.items(ctx.zones[d.zone] as MutableZone)[d.index];
  item.x = hit.x - d.offX;
  item.z = hit.z - d.offZ;
  d.moved = true;
  ctx.touch(zoneRect(ctx.zones[d.zone]));
}

function onPointerUp(): void {
  endDrag(true);
}

function onPointerCancel(): void {
  endDrag(false);
}

function onKeyDown(ev: KeyboardEvent): void {
  if (ev.key === 'Escape') {
    endDrag(false);
    armed = null;
    ctx.select(null);
    renderAddButtons();
    return;
  }
  if ((ev.key === 'Delete' || ev.key === 'Backspace') && ctx.selection !== null && !isTyping()) {
    ev.preventDefault();
    deleteSelected();
  }
}

export const selectTool: Tool = {
  id: 'select',
  label: 'Select',
  mount(editor: EditorContext, panel: HTMLElement): void {
    ctx = editor;
    panel.replaceChildren();

    const addRow = document.createElement('div');
    for (const c of COLLECTIONS) {
      const b = document.createElement('button');
      b.textContent = `Add ${c.label}`;
      b.addEventListener('click', () => {
        armed = armed === c ? null : c;
        renderAddButtons();
      });
      addButtons.set(c.id, b);
      addRow.append(b);
    }

    hint = document.createElement('p');
    hint.textContent = 'Click the ground to place. Esc cancels.';
    hint.hidden = true;

    itemsBox = document.createElement('div');
    inspector = document.createElement('div');
    panel.append(addRow, hint, itemsBox, inspector);

    ctx.events.changed.on(renderAll);
    ctx.events.selection.on(renderAll);
    ctx.events.zone.on(renderAll);
    renderAll();
  },
  activate(): void {
    // Left drag belongs to this tool (drag moves items); the view tool turns orbit back on.
    ctx.viewport.setLeftOrbit(false);
    ctx.viewport.dom.addEventListener('pointerdown', onPointerDown);
    ctx.viewport.dom.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('keydown', onKeyDown);
  },
  deactivate(): void {
    ctx.viewport.dom.removeEventListener('pointerdown', onPointerDown);
    ctx.viewport.dom.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    window.removeEventListener('keydown', onKeyDown);
    endDrag(false);
    armed = null;
    renderAddButtons();
  },
};
