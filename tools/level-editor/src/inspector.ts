// The floating details window: everything known about the selected item, read-only. describeItem is the pure part (tested);
// mountInspector draws the window and keeps it in step with the selection.
import type { MarkerDef } from '@lawn/level';
import { ENEMIES, OBJECTS, SPAWNS } from '@gnomomia/content';
import { objectModelPrefab } from '@gnomomia/objectModels';
import type { EditorContext, MutableZone } from './context';
import { contextDoorLinks, linksIn, type DoorLink } from './doorLinks';

/** A key/value row. The optional third element is a tooltip (shown on hover) for the key and value. */
export type InspectRow = [string, string] | [string, string, string];

export type InspectSection =
  | { title: string; rows: InspectRow[]; note?: string }
  | { title: string; raw: string };

/** Where the game's pack files live, named in the tooltips of the Pack definition rows. */
const PACK_FOLDER = 'games/gnomes-of-gnomomia/src/data/packs';
const PACK_NOTE = 'Pack values are set in code. Placement and spawn overrides are editable in the select panel.';

function packTip(id: string): string {
  return `From ${PACK_FOLDER} (pack file for id "${id}"): edit it there, not here.`;
}

/** The pack data an item's id points at. Defaults to the game's own tables; tests may pass their own. */
export interface PackLookup {
  object(id: string): (typeof OBJECTS)[string] | undefined;
  spawn(id: string): (typeof SPAWNS)[number] | undefined;
  enemy(id: string): (typeof ENEMIES)[string] | undefined;
  objectPrefab(model: (typeof OBJECTS)[string]['model']): string;
}

const DEFAULT_LOOKUP: PackLookup = {
  object: (id) => OBJECTS[id],
  spawn: (id) => SPAWNS.find((s) => s.id === id),
  enemy: (id) => ENEMIES[id],
  objectPrefab: (model) => objectModelPrefab(model),
};

export interface InspectInput {
  /** The collection id ('objects', 'spawns', ...) and its label. */
  collection: string;
  label: string;
  zone: string;
  index: number;
  item: Record<string, unknown>;
  /** The raw marker the item views, or null when the item is not a marker view. */
  marker: MarkerDef | null;
  /** For an exit: where it goes. Absent for other items. */
  destination?: DoorLink;
}

function hasFunction(v: unknown, depth = 0): boolean {
  if (typeof v === 'function') return true;
  if (depth > 20 || v === null || typeof v !== 'object') return false;
  return Object.values(v as Record<string, unknown>).some((x) => hasFunction(x, depth + 1));
}

/** A value as display text. Plain structures become JSON; anything holding a function reads as a condition. */
function formatValue(v: unknown): string {
  if (typeof v === 'function') return '(condition)';
  if (v === null || v === undefined) return String(v);
  if (typeof v !== 'object') return String(v);
  if (hasFunction(v)) return '(condition)';
  try {
    return JSON.stringify(v, null, 2) ?? '(none)';
  } catch {
    return '(condition)';
  }
}

function rawJson(item: Record<string, unknown>): string {
  try {
    return JSON.stringify(item, null, 2) ?? '(none)';
  } catch {
    return '(not serialisable)';
  }
}

/** The sections the window shows for one item. Every value stays a plain string: the caller must render it as text. */
export function describeItem(input: InspectInput, lookup: PackLookup = DEFAULT_LOOKUP): InspectSection[] {
  const sections: InspectSection[] = [];

  // Placement: the zone and either the raw marker or the item's own fields.
  const placement: InspectRow[] = [['zone', input.zone]];
  if (input.marker) {
    const m = input.marker;
    placement.push(['id', m.id], ['kind', m.kind], ['x', String(m.x)], ['z', String(m.z)]);
    placement.push(['data', m.data === undefined ? '(none)' : formatValue(m.data)]);
  } else {
    for (const key of Object.keys(input.item)) {
      const v = input.item[key];
      if (typeof v === 'function') continue;
      placement.push([key, formatValue(v)]);
    }
  }
  sections.push({ title: 'Placement', rows: placement });

  // Pack definition: only when the item's id is a known pack entry.
  const id = input.item.id;
  if (id !== undefined && id !== null) {
    const key = String(id);
    if (input.collection === 'objects') {
      const def = lookup.object(key);
      if (def) {
        const tip = packTip(key);
        const rows: InspectRow[] = [];
        for (const [k, v] of Object.entries(def)) {
          rows.push([k, formatValue(v), tip]);
          if (k === 'model') rows.push(['prefab', lookup.objectPrefab(def.model), tip]);
        }
        sections.push({ title: 'Pack definition', rows, note: PACK_NOTE });
      }
    } else if (input.collection === 'spawns') {
      const def = lookup.spawn(key);
      if (def) {
        const tip = packTip(key);
        const rows: InspectRow[] = [];
        for (const [k, v] of Object.entries(def)) {
          rows.push([k, formatValue(v), tip]);
          if (k === 'enemy') rows.push(['enemy name', lookup.enemy(def.enemy)?.name ?? '(unknown enemy)', tip]);
        }
        sections.push({ title: 'Pack definition', rows, note: PACK_NOTE });
      }
    }
  }

  // Destination: for an exit, the zone it leads to and where it arrives.
  const dest = input.destination;
  if (dest) {
    sections.push({
      title: 'Destination',
      rows: [
        ['to', dest.to],
        ['name', dest.toName],
        ['arrives at', `${dest.arrive.x.toFixed(1)}, ${dest.arrive.z.toFixed(1)}`],
        ['indoor', dest.destIndoor ? 'yes' : 'no'],
        ['known', dest.destKnown ? 'yes' : 'no'],
      ],
    });
  }

  sections.push({ title: 'Raw', raw: rawJson(input.item) });
  return sections;
}

// ---------------------------------------------------------------- the window

const STORE_KEY = 'le-inspector';

interface Stored { x?: number; y?: number; minimised?: boolean }

function loadStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const v: unknown = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as Stored) : null;
  } catch {
    return null;
  }
}

function saveStored(s: Stored): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    // No storage (private window, blocked site data): the window still works, it just forgets its place.
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Builds one section's DOM. Values are set with textContent only. */
function sectionElement(s: InspectSection, rawOpen: () => boolean, onRawToggle: (open: boolean) => void): HTMLElement {
  const wrap = document.createElement('section');
  wrap.className = 'le-inspector-section';
  const h = document.createElement('h3');
  h.textContent = s.title;
  wrap.append(h);
  if (!('raw' in s) && s.note) {
    const note = document.createElement('p');
    note.className = 'le-inspector-note';
    note.textContent = s.note;
    wrap.append(note);
  }
  if ('raw' in s) {
    const det = document.createElement('details');
    det.className = 'le-inspector-raw';
    det.open = rawOpen();
    det.addEventListener('toggle', () => onRawToggle(det.open));
    const sum = document.createElement('summary');
    sum.textContent = 'JSON';
    const pre = document.createElement('pre');
    pre.textContent = s.raw;
    det.append(sum, pre);
    wrap.append(det);
    return wrap;
  }
  const grid = document.createElement('dl');
  grid.className = 'le-inspector-kv';
  for (const [k, v, tip] of s.rows) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    if (v.includes('\n')) {
      const pre = document.createElement('pre');
      pre.textContent = v;
      dd.append(pre);
    } else {
      dd.textContent = v;
    }
    if (tip) {
      dt.title = tip;
      dd.title = tip;
    }
    grid.append(dt, dd);
  }
  wrap.append(grid);
  return wrap;
}

/** Mounts the inspector window on document.body. Call once, after the context exists. */
export function mountInspector(ctx: EditorContext): void {
  const win = document.createElement('div');
  win.className = 'le-inspector';
  win.hidden = true;

  const bar = document.createElement('div');
  bar.className = 'le-inspector-bar';
  const titleEl = document.createElement('span');
  titleEl.className = 'le-inspector-title';
  titleEl.textContent = 'Inspector';
  const minBtn = document.createElement('button');
  minBtn.type = 'button';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = 'x';
  closeBtn.title = 'Close (reopens on the next selection)';
  closeBtn.setAttribute('aria-label', 'Close');
  bar.append(titleEl, minBtn, closeBtn);

  const body = document.createElement('div');
  body.className = 'le-inspector-body';
  win.append(bar, body);
  document.body.append(win);

  let minimised = false;
  let rawOpen = false;
  let seen = false;

  const applyMin = (): void => {
    body.hidden = minimised;
    minBtn.textContent = minimised ? '+' : '_';
    minBtn.title = minimised ? 'Restore' : 'Minimise';
    minBtn.setAttribute('aria-label', minBtn.title);
  };

  /** Keeps the title bar on screen. */
  const place = (x: number, y: number): void => {
    const maxX = Math.max(0, window.innerWidth - 80);
    const maxY = Math.max(0, window.innerHeight - 30);
    win.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
    win.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
    win.style.right = 'auto';
  };

  const persist = (): void => {
    const r = win.getBoundingClientRect();
    saveStored({ x: Math.round(r.left), y: Math.round(r.top), minimised });
  };

  const stored = loadStored();
  if (stored) {
    minimised = stored.minimised === true;
    if (isNum(stored.x) && isNum(stored.y)) place(stored.x, stored.y);
  }
  applyMin();

  minBtn.addEventListener('click', () => {
    minimised = !minimised;
    applyMin();
    persist();
  });
  closeBtn.addEventListener('click', () => { win.hidden = true; });

  let drag: { dx: number; dy: number } | null = null;
  bar.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const r = win.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.preventDefault();
  });
  window.addEventListener('pointermove', (e) => {
    if (drag) place(e.clientX - drag.dx, e.clientY - drag.dy);
  });
  const endDrag = (): void => {
    if (!drag) return;
    drag = null;
    persist();
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  window.addEventListener('resize', () => {
    if (win.style.left) place(parseFloat(win.style.left), parseFloat(win.style.top));
  });

  const render = (): void => {
    const sel = ctx.selection;
    if (!sel) {
      titleEl.textContent = 'Inspector';
      body.replaceChildren(textNode('Nothing selected.'));
      return;
    }
    const coll = ctx.adapter.collections.find((c) => c.id === sel.collection);
    const def = ctx.zones[ctx.zone] as unknown as MutableZone & { markers?: MarkerDef[] };
    const items = coll ? coll.items(def) : [];
    const item = items[sel.index] as Record<string, unknown> | undefined;
    if (!coll || !item) {
      titleEl.textContent = 'Inspector';
      body.replaceChildren(textNode('This item no longer exists.'));
      return;
    }
    const kind = coll.id === 'objects' ? 'object' : coll.id === 'spawns' ? 'spawn' : null;
    const marker = kind ? ((def.markers ?? []).filter((m) => m.kind === kind)[sel.index] ?? null) : null;
    const label = item.name ?? item.id ?? `#${sel.index}`;
    titleEl.textContent = `${coll.label}: ${String(label)}`;
    const destination = coll.id === 'exits'
      ? linksIn(contextDoorLinks(ctx), ctx.zone).find((l) => l.index === sel.index)
      : undefined;
    const sections = describeItem({ collection: coll.id, label: coll.label, zone: ctx.zone, index: sel.index, item, marker, destination });
    body.replaceChildren(...sections.map((s) => sectionElement(s, () => rawOpen, (open) => { rawOpen = open; })));
  };

  function textNode(text: string): HTMLElement {
    const p = document.createElement('p');
    p.className = 'le-inspector-empty';
    p.textContent = text;
    return p;
  }

  // The window stays hidden until the first selection. A close hides it until the next selection of any kind.
  ctx.events.selection.on((sel) => {
    if (sel) seen = true;
    if (!seen) return;
    win.hidden = false;
    render();
  });
  ctx.events.changed.on(() => {
    if (!win.hidden) render();
  });
}
