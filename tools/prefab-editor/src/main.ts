// Prefab Editor: a local tool for fixing how @lawn/prefabs items look and sit on a gnome.
// Left: every prefab (gear first) with review status, creator-reward and usage badges.
// Middle: the gnome wearing the item, with a gizmo. Right: the numbers, review notes and Save.
// Saves go through the dev server (vite.config.ts) straight into packages/prefabs/src/catalog/*.ts.
import './style.css';
import {
  EQUIP_ANCHORS, GNORMAN_LOOK, gearClearance, gearSlotFor, getMyGnome, loadMyGnome, MIN_GEAR_GAP,
  type EquipSlot, type GnomeLook,
} from '@lawn/gnome';
import { equipmentCatalog } from '@lawn/achievements';
import {
  PALETTE, allPrefabs, getPrefab, prefabIconElement,
  type Part, type PrefabDef, type PrefabWear, type ShapeKind, type Swatch, type Vec3,
} from '@lawn/prefabs';
import { Stage, type GizmoMode, type GizmoTarget, type Pose, type ViewSlot } from './stage';
import { centreOf, deltaAbout, transformParts } from './partmath';

await loadMyGnome();

// ------------------------------------------------------------------ types and server

type Status = 'ok' | 'todo' | 'broken';
interface ReviewEntry { status?: Status; note?: string; updated?: string }
interface SourceInfo { file: string; abs: string; line: number; partsEditable: boolean; reason?: string }

/** A part being edited, remembering which part of the file it came from. */
type DraftPart = Part & { __orig: number | null };
interface Draft {
  id: string;
  parts: DraftPart[];
  grip?: Vec3;
  wear?: PrefabWear;
}

async function api<T>(path: string, data?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, data === undefined ? {} : {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? res.statusText);
  return json as T;
}

const SLOTS: readonly EquipSlot[] = ['head', 'back', 'neck', 'hand'];
const VIEW_SLOTS: readonly ViewSlot[] = ['model', ...SLOTS];
const SHAPES: readonly ShapeKind[] = ['box', 'cyl', 'cone', 'ball', 'ring', 'pill', 'wedge'];
const DIMS: Record<ShapeKind, string[]> = {
  box: ['w x', 'h y', 'd z'], cyl: ['r top', 'r bot', 'h'], cone: ['r', 'h'], ball: ['r'],
  ring: ['r', 'tube', 'arc°'], pill: ['r', 'len'], wedge: ['w x', 'h y', 'd z'],
};
const rewards = new Map(equipmentCatalog().map((a) => [a.reward!.prefabId, a]));
const all = allPrefabs();
const ids = all.map((p) => p.id);

let review: Record<string, ReviewEntry> = {};
let sources: Record<string, SourceInfo | null> = {};
let usage: Record<string, string[]> = {};

// ------------------------------------------------------------------ session state (survives the reload after a save)

interface Session {
  id: string; slot: ViewSlot | null; slotFor: string; filter: string; search: string; pose: Pose; look: 'mine' | 'gnorman';
  beard: boolean; hair: boolean; bowl: boolean; glasses: boolean; dress: boolean; spheres: boolean; turntable: boolean;
  target: GizmoTarget; mode: GizmoMode; tint: string;
}
const SESSION_KEY = 'prefab-editor.session';
const session: Session = {
  id: 'pointy-hat', slot: null, slotFor: '', filter: 'gear', search: '', pose: 'idle', look: 'mine', beard: true, hair: false,
  bowl: false, glasses: false, dress: false, spheres: false, turntable: false, target: 'part', mode: 'translate', tint: '',
};
try { Object.assign(session, JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '{}')); } catch { /* fresh */ }
const fromUrl = new URLSearchParams(location.search).get('id');
if (fromUrl && getPrefab(fromUrl)) session.id = fromUrl;
if (!getPrefab(session.id)) session.id = all[0].id;
const persist = (): void => {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* private mode */ }
};

// ------------------------------------------------------------------ DOM helpers

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else e.setAttribute(k, v);
  }
  e.append(...kids);
  return e;
}
function button(label: string, onClick: () => void, cls = ''): HTMLButtonElement {
  const b = h('button', { class: `btn ${cls}`, type: 'button' }, label);
  b.onclick = onClick;
  return b;
}
function numberInput(value: number, step: number, onInput: (v: number) => void, label?: string): HTMLElement {
  const inp = h('input', { type: 'number', step: String(step), class: 'num' });
  inp.value = String(value);
  inp.oninput = () => {
    const v = parseFloat(inp.value);
    if (Number.isFinite(v)) onInput(v);
  };
  inp.onchange = () => commit();
  return label ? h('label', { class: 'numl' }, h('span', {}, label), inp) : inp;
}
function vecRow(label: string, v: readonly number[], step: number, onInput: (v: Vec3) => void, names = ['x', 'y', 'z']): HTMLElement {
  const cur = [...v] as [number, number, number];
  return h('div', { class: 'row' }, h('span', { class: 'lbl' }, label),
    ...cur.map((x, i) => numberInput(x, step, (n) => { cur[i] = n; onInput([...cur] as Vec3); }, names[i])));
}
function section(title: string, ...kids: Node[]): HTMLElement {
  return h('section', {}, h('h3', {}, title), ...kids);
}
const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

// ------------------------------------------------------------------ layout

const ui = document.getElementById('ui')!;
const root = h('div', { id: 'editor' });
ui.append(root);
const listPane = h('aside', { id: 'list' });
const middle = h('main', { id: 'middle' });
const inspector = h('aside', { id: 'inspector' });
root.append(listPane, middle, inspector);

const stage = new Stage({
  onPick(i, additive) {
    if (additive) {
      if (i !== null) toggleSelected(i);
    } else selectParts(i === null ? [] : [i]);
  },
  onParts(poses, done) {
    if (!draft) return;
    for (const [i, pose] of poses) {
      const p = draft.parts[i];
      if (!p) continue;
      p.at = pose.at;
      if (pose.rot) p.rot = pose.rot; else delete p.rot;
      if (pose.scale) p.scale = pose.scale; else delete p.scale;
    }
    if (done) {
      commit();
      renderInspector();
    }
    refreshGear(done);
  },
  onGizmo(c, done) {
    if (!draft) return;
    if (c.target === 'wear') {
      draft.wear = { ...draft.wear, at: c.at, rot: c.rot, scale: c.scale[0] };
    } else if (c.target === 'grip') {
      draft.grip = c.at;
    }
    if (done) {
      commit();
      renderInspector();
    }
    refreshGear(done);
  },
});
const toolbar = h('div', { id: 'toolbar' });
middle.append(toolbar, stage.canvas, h('div', { id: 'hint' },
  'Click a part to select it; Shift/Ctrl+click adds or removes parts. Drag to orbit, wheel/pinch to zoom, right-drag to pan. W/E/R: move/rotate/scale. Ctrl+A: all parts. Ctrl+Z: undo.'));

// ------------------------------------------------------------------ the edited prefab

let draft: Draft | null = null;
let original: PrefabDef = getPrefab(session.id)!;
/** Selected part indices, in the order they were picked. */
let selected: number[] = [];
/** The last part clicked in the list, for Shift+click ranges. */
let anchorPart: number | null = null;
let slot: ViewSlot = 'head';
let gizmoMode: GizmoMode = session.mode;
let undo: string[] = [];
let redo: string[] = [];
let lastSnapshot = '';

const snapshot = (): string => JSON.stringify(draft);
/** Records an undo step if the draft changed since the last one. */
function commit(): void {
  const s = snapshot();
  if (s === lastSnapshot) return;
  undo.push(lastSnapshot);
  if (undo.length > 200) undo.shift();
  redo = [];
  lastSnapshot = s;
  renderHeader();
}

function toDraft(def: PrefabDef): Draft {
  return {
    id: def.id,
    parts: def.parts.map((p, i) => ({ ...structuredClone(p), __orig: i }) as DraftPart),
    grip: def.grip ? [...def.grip] as Vec3 : undefined,
    wear: def.wear ? structuredClone(def.wear) : undefined,
  };
}
function plainPart(p: DraftPart): Part {
  const { __orig: _o, ...rest } = p;
  return rest;
}
/** The prefab as it would be with the draft applied. */
function draftDef(): PrefabDef {
  return { ...original, parts: draft!.parts.map(plainPart), grip: draft!.grip, wear: draft!.wear };
}
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
function partChanged(p: DraftPart): boolean {
  return p.__orig === null || !same(plainPart(p), original.parts[p.__orig]);
}
function partsDirty(): boolean {
  if (!draft) return false;
  return draft.parts.length !== original.parts.length || draft.parts.some((p, i) => p.__orig !== i || partChanged(p));
}
const wearDirty = (): boolean => !!draft && !same(cleanWear(draft.wear), cleanWear(original.wear));
const gripDirty = (): boolean => !!draft && !same(draft.grip, original.grip);
const anchorsDirty = (): boolean => !same(EQUIP_ANCHORS, savedAnchors);
const dirty = (): boolean => partsDirty() || wearDirty() || gripDirty();

function cleanWear(w?: PrefabWear): PrefabWear | undefined {
  if (!w) return undefined;
  const out: PrefabWear = {};
  if (w.at && w.at.some((x) => x !== 0)) out.at = w.at;
  if (w.rot && w.rot.some((x) => x !== 0)) out.rot = w.rot;
  if (w.scale !== undefined && w.scale !== 1) out.scale = w.scale;
  return Object.keys(out).length ? out : undefined;
}

const savedAnchors = structuredClone(EQUIP_ANCHORS);
const anchors = EQUIP_ANCHORS as unknown as Record<EquipSlot, { at: Vec3; rot: Vec3 }>;

function open(id: string): void {
  if (draft && dirty() && id !== draft.id && !confirm(`Discard unsaved changes to ${draft.id}?`)) return;
  const def = getPrefab(id);
  if (!def) return;
  original = def;
  draft = toDraft(def);
  undo = [];
  redo = [];
  lastSnapshot = snapshot();
  selected = [];
  anchorPart = null;
  const natural = gearSlotFor(def);
  slot = session.slotFor === id && session.slot ? session.slot : natural ?? 'model';
  session.id = id;
  session.slot = slot;
  session.slotFor = id;
  persist();
  history.replaceState(null, '', `?id=${id}`);
  stage.select([]);
  refreshGear(true);
  stage.frame('item');
  renderToolbar();
  renderList();
  renderInspector();
}

let clearanceEl: HTMLElement | null = null;
function refreshGear(full: boolean): void {
  if (!draft) return;
  const tint = session.tint ? (session.tint.startsWith('#') ? parseInt(session.tint.slice(1), 16) : session.tint as Swatch) : undefined;
  stage.setGear(slot, draftDef(), tint);
  if (full) stage.select(selected);
  updateClearance();
  renderHeader();
}

function updateClearance(): void {
  if (!clearanceEl || !draft) return;
  if (slot === 'model') {
    clearanceEl.textContent = '';
    return;
  }
  if (slot === 'hand') {
    clearanceEl.textContent = 'Clearance: not measured for the hand slot (it swings with the arm).';
    clearanceEl.className = 'clear dim';
    return;
  }
  const { gap, against } = gearClearance(draftDef(), slot);
  const ok = gap >= MIN_GEAR_GAP;
  clearanceEl.textContent = `Clearance to head/face: ${gap.toFixed(3)} (closest: ${against}). ${ok ? 'Clear.' : gap < 0 ? 'Clips INTO the gnome.' : 'Touching.'}`;
  clearanceEl.className = `clear ${ok ? 'good' : 'bad'}`;
}

function selectParts(indices: readonly number[]): void {
  selected = [...new Set(indices)].filter((i) => !!draft?.parts[i]);
  if (selected.length === 1) anchorPart = selected[0];
  stage.select(selected);
  if (selected.length && session.target !== 'part') setTarget('part');
  renderInspector();
  inspector.querySelector('.part.sel')?.scrollIntoView({ block: 'nearest' });
}
/** Ctrl/Cmd+click (list) or Shift/Ctrl+click (view): add the part, or take it out if it is in. */
function toggleSelected(i: number): void {
  anchorPart = i;
  selectParts(selected.includes(i) ? selected.filter((j) => j !== i) : [...selected, i]);
}
/** Shift+click in the list: every part from the last clicked one to this one. */
function selectRange(i: number): void {
  if (anchorPart === null) return selectParts([i]);
  const [a, b] = anchorPart < i ? [anchorPart, i] : [i, anchorPart];
  const range = Array.from({ length: b - a + 1 }, (_, k) => a + k);
  selectParts([...selected, ...range]);
}

function setTarget(t: GizmoTarget): void {
  session.target = t;
  persist();
  stage.setGizmo(t, gizmoMode);
  renderToolbar();
}

function setMode(m: GizmoMode): void {
  gizmoMode = m;
  session.mode = m;
  persist();
  stage.setGizmo(session.target, m);
  renderToolbar();
}

function restore(s: string): void {
  draft = JSON.parse(s) as Draft;
  lastSnapshot = s;
  selected = selected.filter((i) => i < draft!.parts.length);
  stage.select(selected);
  refreshGear(true);
  renderInspector();
}

// ------------------------------------------------------------------ look and toolbar

function currentLook(): GnomeLook {
  const base = session.look === 'mine' ? getMyGnome()?.look ?? GNORMAN_LOOK : GNORMAN_LOOK;
  return {
    ...base,
    beard: session.beard ? base.beard ?? 0xf4f4f4 : null,
    hair: session.hair ? base.hair ?? { color: 0xc07030, style: 'pigtails' } : null,
    bowlCut: session.bowl ? base.bowlCut ?? 0x6b4a2e : null,
    glasses: session.glasses,
    dress: session.dress,
  };
}
function applyLook(): void {
  persist();
  stage.setLook(currentLook());
  refreshGear(true);
}

function renderToolbar(): void {
  const seg = <T extends string>(values: readonly T[], cur: T, set: (v: T) => void, labels?: Record<string, string>): HTMLElement =>
    h('div', { class: 'seg' }, ...values.map((v) => button(labels?.[v] ?? v, () => set(v), v === cur ? 'on' : '')));
  const toggle = (label: string, key: 'beard' | 'hair' | 'bowl' | 'glasses' | 'dress' | 'spheres' | 'turntable'): HTMLElement =>
    button(label, () => {
      session[key] = !session[key];
      if (key === 'spheres') stage.setSpheres(session.spheres);
      else if (key === 'turntable') stage.setTurntable(session.turntable);
      else applyLook();
      persist();
      renderToolbar();
    }, session[key] ? 'on' : '');
  toolbar.replaceChildren(
    h('div', { class: 'group' }, h('span', { class: 'cap' }, 'Show'),
      seg(VIEW_SLOTS, slot, (s) => { slot = s; session.slot = s; session.slotFor = original.id; persist(); if (s === 'model' && session.target === 'wear') setTarget('part'); refreshGear(true); stage.frame('item'); renderToolbar(); renderInspector(); })),
    h('div', { class: 'group' }, h('span', { class: 'cap' }, 'Gizmo'),
      seg((slot === 'model' ? ['part', 'grip', 'off'] : ['part', 'wear', 'grip', 'off']) as GizmoTarget[], session.target, setTarget, { wear: 'worn offset' }),
      seg(['translate', 'rotate', 'scale'] as const, gizmoMode, setMode, { translate: 'move' })),
    h('div', { class: 'group' }, h('span', { class: 'cap' }, 'Pose'),
      seg(['idle', 'walk', 'jump', 'sit'] as const, session.pose, (p) => { session.pose = p; persist(); stage.setPose(p); renderToolbar(); })),
    h('div', { class: 'group' }, h('span', { class: 'cap' }, 'Gnome'),
      seg(['mine', 'gnorman'] as const, session.look, (l) => { session.look = l; applyLook(); renderToolbar(); }, { mine: getMyGnome() ? 'my gnome' : 'my gnome (none saved)' }),
      toggle('beard', 'beard'), toggle('pigtails', 'hair'), toggle('bowl cut', 'bowl'), toggle('glasses', 'glasses'),
      toggle('dress', 'dress')),
    h('div', { class: 'group' }, h('span', { class: 'cap' }, 'View'),
      button('item', () => stage.frame('item')), button('gnome', () => stage.frame('gnome')),
      button('front', () => stage.view('front')), button('side', () => stage.view('side')),
      button('back', () => stage.view('back')), button('top', () => stage.view('top')),
      toggle('head spheres', 'spheres'), toggle('spin', 'turntable')),
  );
}

// ------------------------------------------------------------------ the list

const search = h('input', { type: 'search', placeholder: 'Search id, name, tag…', class: 'search' });
search.value = session.search;
search.oninput = () => { session.search = search.value; persist(); renderList(); };
const filters = h('div', { class: 'filters' });
const listEl = h('div', { class: 'items' });
listPane.append(h('h1', {}, 'Prefab Editor'), search, filters, listEl);

const FILTERS: Record<string, (p: PrefabDef) => boolean> = {
  gear: (p) => gearSlotFor(p) !== null,
  head: (p) => p.uses.includes('wear-head'),
  back: (p) => p.uses.includes('wear-back'),
  neck: (p) => p.uses.includes('wear-neck'),
  hand: (p) => p.uses.includes('hold'),
  creator: (p) => rewards.has(p.id),
  flagged: (p) => !!review[p.id]?.status && review[p.id].status !== 'ok',
  unused: (p) => !usage[p.id]?.length,
  all: () => true,
};

function renderList(): void {
  filters.replaceChildren(...Object.keys(FILTERS).map((f) => {
    const n = all.filter(FILTERS[f]).length;
    return button(`${f} ${n}`, () => { session.filter = f; persist(); renderList(); }, session.filter === f ? 'on' : '');
  }));
  const q = session.search.trim().toLowerCase();
  const rows: HTMLElement[] = [];
  for (const p of all) {
    if (!(FILTERS[session.filter] ?? FILTERS.all)(p)) continue;
    if (q && !`${p.id} ${p.name} ${p.tags.join(' ')} ${p.uses.join(' ')}`.toLowerCase().includes(q)) continue;
    const st = review[p.id]?.status;
    const badges = h('span', { class: 'badges' });
    const sl = gearSlotFor(p);
    if (sl) badges.append(h('span', { class: 'b slot' }, sl));
    if (rewards.has(p.id)) badges.append(h('span', { class: 'b star', title: `Gnome Creator reward: ${rewards.get(p.id)!.title}` }, '★'));
    const n = usage[p.id]?.length ?? 0;
    badges.append(h('span', { class: `b use ${n ? '' : 'none'}`, title: (usage[p.id] ?? ['not named in any game']).join('\n') }, String(n)));
    const row = h('button', { class: `item ${p.id === session.id ? 'sel' : ''}`, type: 'button', 'data-id': p.id },
      h('span', { class: `dot ${st ?? ''}`, title: st ?? 'not reviewed' }),
      prefabIconElement(p.id, '?', 32),
      h('span', { class: 'nm' }, h('b', {}, p.name), h('small', {}, p.id)),
      badges);
    row.onclick = () => open(p.id);
    rows.push(row);
  }
  listEl.replaceChildren(...(rows.length ? rows : [h('div', { class: 'dim pad' }, 'Nothing matches.')]));
  listEl.querySelector('.item.sel')?.scrollIntoView({ block: 'nearest' });
}

// ------------------------------------------------------------------ inspector

const header = h('div', { class: 'head' });
const body = h('div', { class: 'body' });
inspector.append(header, body);

function renderHeader(): void {
  if (!draft) return;
  const src = sources[draft.id];
  const changes = [partsDirty() && 'parts', wearDirty() && 'worn offset', gripDirty() && 'grip'].filter(Boolean);
  header.replaceChildren(
    h('div', { class: 'title' }, h('b', {}, original.name), h('small', {}, ` ${original.id} · ${original.category}`)),
    src ? h('a', { href: `vscode://file/${src.abs}:${src.line}`, class: 'src' }, `${src.file}:${src.line}`) : h('span', { class: 'dim' }, 'source: not a literal id (built by a helper)'),
    h('div', { class: 'actions' },
      button(changes.length ? `Save (${changes.join(', ')})` : 'Saved', save, changes.length ? 'primary' : ''),
      button('Revert', () => { if (draft) { undo.push(lastSnapshot); restore(JSON.stringify(toDraft(original))); } }),
      button('Undo', doUndo), button('Copy report', copyReport)),
    h('div', { id: 'status', class: 'status' }, statusText),
  );
}
let statusText = '';
function say(t: string): void {
  statusText = t;
  const el = document.getElementById('status');
  if (el) el.textContent = t;
}

function doUndo(): void {
  const s = undo.pop();
  if (s === undefined) return;
  redo.push(lastSnapshot);
  restore(s);
}
function doRedo(): void {
  const s = redo.pop();
  if (s === undefined) return;
  undo.push(lastSnapshot);
  restore(s);
}

function renderInspector(): void {
  if (!draft) return;
  renderHeader();
  const d = draft;
  const src = sources[d.id];
  const kids: Node[] = [];

  // Review
  const rev = review[d.id] ?? {};
  const note = h('textarea', { rows: '3', placeholder: 'What is wrong with it? (saved to tools/prefab-editor/review.json)' });
  note.value = rev.note ?? '';
  note.oninput = () => setReview({ note: note.value });
  kids.push(section('Review',
    h('div', { class: 'seg' }, ...(['ok', 'todo', 'broken'] as const).map((s) =>
      button(s === 'todo' ? 'needs work' : s, () => { setReview({ status: rev.status === s ? undefined : s }); renderInspector(); }, rev.status === s ? `on ${s}` : ''))),
    note));

  // Worn offset
  clearanceEl = h('div', { class: 'clear' });
  const w = d.wear ?? {};
  const setWear = (patch: PrefabWear): void => { d.wear = { ...d.wear, ...patch }; refreshGear(false); };
  if (slot !== 'model') kids.push(section(`Worn on the ${slot}`,
    h('p', { class: 'dim' }, 'Fine-tunes this item only when a gnome wears or holds it. Icons and world copies are unchanged.'),
    vecRow('offset', w.at ?? [0, 0, 0], 0.005, (v) => setWear({ at: v })),
    vecRow('rotate°', w.rot ?? [0, 0, 0], 1, (v) => setWear({ rot: v })),
    h('div', { class: 'row' }, h('span', { class: 'lbl' }, 'scale'), numberInput(w.scale ?? 1, 0.01, (v) => setWear({ scale: v }))),
    h('div', { class: 'row' }, button('Reset offset', () => { d.wear = undefined; commit(); refreshGear(false); renderInspector(); }),
      button('Gizmo on it', () => setTarget('wear'))),
    clearanceEl));
  updateClearance();

  // Grip
  if (original.uses.includes('hold') || d.grip) {
    kids.push(section('Grip (where the hand holds it)',
      vecRow('grip', d.grip ?? [0, 0, 0], 0.005, (v) => { d.grip = v; refreshGear(false); }),
      h('div', { class: 'row' }, button('Gizmo on it', () => { if (slot !== 'hand' && slot !== 'model') { slot = 'hand'; refreshGear(true); renderToolbar(); } setTarget('grip'); }),
        d.grip ? button('Remove grip', () => { d.grip = undefined; commit(); refreshGear(false); renderInspector(); }) : h('span')),
    ));
  }

  // Parts
  const editable = src?.partsEditable ?? false;
  const partRows = d.parts.map((p, i) => {
    const sw = typeof p.c === 'number' ? hex(p.c) : p.c in PALETTE ? hex(PALETTE[p.c as Swatch]) : 'transparent';
    const row = h('button', { class: `part ${selected.includes(i) ? 'sel' : ''} ${partChanged(p) ? 'changed' : ''}`, type: 'button', title: 'Ctrl+click: add/remove. Shift+click: range.' },
      h('span', { class: 'sw', style: `background:${sw}` }), `#${i} ${p.s}`, h('small', {}, ` ${typeof p.c === 'number' ? hex(p.c) : p.c}${p.mirror ? ' ⇄' : ''}${p.name ? ` (${p.name})` : ''}`));
    row.onclick = (e) => {
      if (e.ctrlKey || e.metaKey) toggleSelected(i);
      else if (e.shiftKey) selectRange(i);
      else selectParts(selected.length === 1 && selected[0] === i ? [] : [i]);
    };
    return row;
  });
  const partTools = h('div', { class: 'row wrap' },
    button('+ box', () => addPart({ s: 'box', d: [0.05, 0.05, 0.05], at: [0, 0.05, 0], c: 'white', __orig: null })),
    button('+ ball', () => addPart({ s: 'ball', d: [0.03], at: [0, 0.05, 0], c: 'white', __orig: null })),
    button('Select all', () => selectParts(d.parts.map((_, i) => i))),
    selected.length ? button(selected.length > 1 ? `Duplicate ${selected.length}` : 'Duplicate', duplicateSelected) : h('span'),
    selected.length ? button(selected.length > 1 ? `Delete ${selected.length}` : 'Delete', deleteSelected, 'danger') : h('span'),
  );
  kids.push(section(`Parts (${d.parts.length})`,
    editable ? h('span') : h('p', { class: 'warn' }, `Parts are read-only here: ${src?.reason ?? 'source not found'}. Edits still preview; use "Copy parts" and paste by hand.`),
    h('div', { class: 'parts' }, ...partRows), partTools,
    selected.length === 1 && d.parts[selected[0]] ? partEditor(d.parts[selected[0]])
      : selected.length > 1 ? groupEditor()
      : h('p', { class: 'dim' }, 'Select a part (here or by clicking it) to edit it. Shift/Ctrl+click to select several.')));

  // All parts at once
  const shift: [number, number, number] = [0, 0, 0];
  let factor = 1;
  kids.push(section('Move or scale every part',
    h('p', { class: 'dim' }, 'Changes the prefab everywhere (icons, world, worn). For "only when worn", use the worn offset.'),
    vecRow('shift', shift, 0.005, (v) => { shift[0] = v[0]; shift[1] = v[1]; shift[2] = v[2]; }),
    h('div', { class: 'row' }, h('span', { class: 'lbl' }, 'scale ×'), numberInput(1, 0.05, (v) => { factor = v; }),
      button('Apply', () => { transformAll(shift, factor); }))));

  // Usage
  const used = usage[d.id] ?? [];
  const reward = rewards.get(d.id);
  kids.push(section('Used by',
    reward ? h('p', {}, `★ Gnome Creator reward (${reward.reward!.slot}): "${reward.title}" in ${reward.gameTitle}`) : h('span'),
    used.length ? h('ul', {}, ...used.map((f) => h('li', {}, f))) : h('p', { class: 'dim' }, 'No game names this id in a string. (Items picked by emoji, e.g. in Gnomomia, are not counted.)')));

  // Slot anchors
  if (slot !== 'model') {
  const a = anchors[slot];
  kids.push(section(`Slot anchor: ${slot} (moves EVERY ${slot} item)`,
    h('p', { class: 'dim' }, slot === 'hand' ? 'In the right arm\'s space (the arm hangs down -y).' : 'In the gnome\'s space: feet at y 0, face toward +z.'),
    vecRow('at', a.at, 0.005, (v) => { a.at = v; refreshGear(false); }),
    vecRow('rot°', a.rot, 1, (v) => { a.rot = v; refreshGear(false); }),
    h('div', { class: 'row' },
      button(anchorsDirty() ? 'Save anchors to anatomy.ts' : 'Anchors saved', saveAnchors, anchorsDirty() ? 'primary' : ''),
      button('Reset', () => { Object.assign(anchors, structuredClone(savedAnchors)); refreshGear(false); renderInspector(); }))));
  }

  // About
  kids.push(section('About',
    h('p', {}, original.about),
    h('p', { class: 'dim' }, `uses: ${original.uses.join(', ')} · tags: ${original.tags.join(', ')}`),
    original.parts.some((p) => p.c === 'tint') ? tintPicker() : h('span')));

  body.replaceChildren(...kids);
}

function tintPicker(): HTMLElement {
  const names: Swatch[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black', 'white', 'gold'];
  return h('div', { class: 'row wrap' }, h('span', { class: 'lbl' }, 'preview tint'),
    button('default', () => { session.tint = ''; persist(); refreshGear(false); renderInspector(); }, session.tint ? '' : 'on'),
    ...names.filter((n) => n in PALETTE).map((n) => {
      const b = button('', () => { session.tint = n; persist(); refreshGear(false); renderInspector(); }, `swatch ${session.tint === n ? 'on' : ''}`);
      b.style.background = hex(PALETTE[n]);
      b.title = n;
      return b;
    }));
}

function partEditor(p: DraftPart): HTMLElement {
  const upd = (): void => refreshGear(false);
  const shape = h('select', {}, ...SHAPES.map((s) => h('option', { value: s }, s)));
  shape.value = p.s;
  shape.onchange = () => {
    p.s = shape.value as ShapeKind;
    const need = DIMS[p.s].length;
    const dd = [...p.d];
    while (dd.length < need - (p.s === 'ring' ? 1 : 0)) dd.push(0.05);
    p.d = dd.slice(0, need);
    commit();
    refreshGear(true);
    renderInspector();
  };
  const colour = h('select', {}, h('option', { value: 'tint' }, 'tint'), h('option', { value: 'trim' }, 'trim'),
    h('option', { value: '#' }, 'custom hex…'),
    ...Object.keys(PALETTE).map((k) => h('option', { value: k }, k)));
  colour.value = typeof p.c === 'number' ? '#' : p.c;
  const picker = h('input', { type: 'color' });
  picker.value = typeof p.c === 'number' ? hex(p.c) : p.c in PALETTE ? hex(PALETTE[p.c as Swatch]) : '#ffffff';
  colour.onchange = () => {
    p.c = colour.value === '#' ? parseInt(picker.value.slice(1), 16) : colour.value as Swatch;
    commit(); refreshGear(true); renderInspector();
  };
  picker.oninput = () => { p.c = parseInt(picker.value.slice(1), 16); upd(); };
  picker.onchange = () => { commit(); renderInspector(); };

  const dims = DIMS[p.s];
  const d = [...p.d];
  const check = (label: string, on: boolean, set: (v: boolean) => void): HTMLElement => {
    const c = h('input', { type: 'checkbox' });
    c.checked = on;
    c.onchange = () => { set(c.checked); commit(); refreshGear(true); renderInspector(); };
    return h('label', { class: 'chk' }, c, label);
  };
  return h('div', { class: 'parted' },
    h('div', { class: 'row' }, h('span', { class: 'lbl' }, 'shape'), shape,
      p.name || p.group ? h('small', { class: 'dim' }, ` name ${p.name ?? '-'} / group ${p.group ?? '-'}`) : h('span')),
    h('div', { class: 'row' }, h('span', { class: 'lbl' }, 'size'),
      ...dims.map((label, i) => numberInput(d[i] ?? (p.s === 'ring' && i === 2 ? 360 : 0), i === 2 && p.s === 'ring' ? 5 : 0.005, (v) => { d[i] = v; p.d = [...d]; upd(); }, label))),
    vecRow('at', p.at ?? [0, 0, 0], 0.005, (v) => { p.at = v; upd(); }),
    vecRow('rot°', p.rot ?? [0, 0, 0], 1, (v) => { p.rot = v; upd(); }),
    vecRow('scale', p.scale ?? [1, 1, 1], 0.01, (v) => { p.scale = v; upd(); }),
    h('div', { class: 'row' }, h('span', { class: 'lbl' }, 'colour'), colour, picker),
    h('div', { class: 'row wrap' },
      check('mirror (x)', !!p.mirror, (v) => { if (v) p.mirror = true; else delete p.mirror; }),
      check('glow', !!p.glow, (v) => { if (v) p.glow = true; else delete p.glow; }),
      numberInput(p.alpha ?? 1, 0.05, (v) => { if (v >= 1) delete p.alpha; else p.alpha = v; upd(); }, 'alpha'),
      numberInput(p.seg ?? (p.s === 'ball' ? 8 : 10), 1, (v) => { p.seg = Math.max(3, Math.round(v)); upd(); }, 'seg')),
  );
}

function addPart(p: DraftPart): void {
  draft!.parts.push(p);
  selected = [draft!.parts.length - 1];
  commit();
  refreshGear(true);
  renderInspector();
}

/** Copies of the selected parts go on the end of the list and become the selection. */
function duplicateSelected(): void {
  if (!draft || !selected.length) return;
  const start = draft.parts.length;
  for (const i of selected) draft.parts.push({ ...structuredClone(draft.parts[i]), __orig: null });
  selected = selected.map((_, k) => start + k);
  commit();
  refreshGear(true);
  renderInspector();
}

function deleteSelected(): void {
  if (!draft || !selected.length) return;
  const gone = new Set(selected);
  draft.parts = draft.parts.filter((_, i) => !gone.has(i));
  selected = [];
  commit();
  refreshGear(true);
  renderInspector();
}

/** Several parts selected: move, turn or scale them together about their centre. */
function groupEditor(): HTMLElement {
  const move: [number, number, number] = [0, 0, 0];
  const turn: [number, number, number] = [0, 0, 0];
  let factor = 1;
  const apply = (): void => {
    if (!draft) return;
    const delta = deltaAbout(centreOf(draft.parts, selected), move, turn, factor);
    for (const [i, pose] of transformParts(draft.parts, selected, delta)) {
      const p = draft.parts[i];
      p.at = pose.at;
      if (pose.rot) p.rot = pose.rot; else delete p.rot;
      if (pose.scale) p.scale = pose.scale; else delete p.scale;
    }
    commit();
    refreshGear(true);
    renderInspector();
  };
  const c = draft ? centreOf(draft.parts, selected) : null;
  return h('div', { class: 'parted' },
    h('p', {}, h('b', {}, `${selected.length} parts selected`), ` (#${selected.join(', #')})`),
    h('p', { class: 'dim' }, `Drag the gizmo to move or turn them as one, about their centre${c ? ` [${c.toArray().map((x) => Math.round(x * 1000) / 1000).join(', ')}]` : ''}. Or type amounts and Apply.`),
    vecRow('move', move, 0.005, (v) => { move[0] = v[0]; move[1] = v[1]; move[2] = v[2]; }),
    vecRow('turn°', turn, 1, (v) => { turn[0] = v[0]; turn[1] = v[1]; turn[2] = v[2]; }),
    h('div', { class: 'row' }, h('span', { class: 'lbl' }, 'scale ×'), numberInput(1, 0.05, (v) => { factor = v; }),
      button('Apply', apply, 'primary')));
}

function transformAll(shift: Vec3, factor: number): void {
  if (!draft) return;
  for (const p of draft.parts) {
    const at = p.at ?? [0, 0, 0];
    p.at = at.map((x, i) => Math.round((x * factor + shift[i]) * 10000) / 10000) as unknown as Vec3;
    if (factor !== 1) p.d = p.s === 'ring' && p.d.length > 2 ? [p.d[0] * factor, p.d[1] * factor, p.d[2]] : p.d.map((x) => x * factor);
  }
  if (draft.grip) draft.grip = draft.grip.map((x, i) => Math.round((x * factor + shift[i]) * 10000) / 10000) as unknown as Vec3;
  commit();
  refreshGear(true);
  renderInspector();
}

// ------------------------------------------------------------------ saving

async function save(): Promise<void> {
  if (!draft || !dirty()) return;
  const src = sources[draft.id];
  const req: Record<string, unknown> = { id: draft.id };
  if (partsDirty()) {
    if (!src?.partsEditable) {
      say(`Parts not saved: ${src?.reason ?? 'source not found'}. Use Copy report and paste the parts by hand.`);
      if (!wearDirty() && !gripDirty()) return;
    } else {
      req.parts = draft.parts.map((p) => ({ part: plainPart(p), orig: p.__orig, changed: partChanged(p) }));
    }
  }
  if (gripDirty()) req.grip = draft.grip ?? null;
  if (wearDirty()) req.wear = cleanWear(draft.wear) ?? null;
  try {
    const r = await api<{ file: string }>('/save', req);
    say(`Saved to ${r.file}. Reloading…`);
    // The dev server reloads the page when the catalog changes; the session keeps the item, slot and view.
  } catch (e) {
    say(`Save failed: ${(e as Error).message}`);
  }
}

async function saveAnchors(): Promise<void> {
  const changed = Object.fromEntries(SLOTS.filter((s) => !same(anchors[s], savedAnchors[s])).map((s) => [s, anchors[s]]));
  try {
    await api('/anchors', changed);
    say('Saved slot anchors to packages/gnome/src/anatomy.ts. Reloading…');
  } catch (e) {
    say(`Anchor save failed: ${(e as Error).message}`);
  }
}

let reviewTimer = 0;
function setReview(patch: Partial<ReviewEntry>): void {
  if (!draft) return;
  const next: ReviewEntry = { ...review[draft.id], ...patch, updated: new Date().toISOString().slice(0, 10) };
  if (!next.status) delete next.status;
  if (!next.note) delete next.note;
  if (!next.status && !next.note) delete review[draft.id];
  else review[draft.id] = next;
  clearTimeout(reviewTimer);
  reviewTimer = window.setTimeout(async () => {
    try { await api('/review', review); say('Review saved.'); } catch (e) { say(`Review not saved: ${(e as Error).message}`); }
    renderList();
  }, 400);
}

function fmtVec(v?: readonly number[]): string {
  return v ? `[${v.map((x) => Math.round(x * 10000) / 10000).join(', ')}]` : '—';
}

/** A plain-text description of the item and what was changed, for pasting into a chat or an issue. */
function copyReport(): void {
  if (!draft) return;
  const src = sources[draft.id];
  const rev = review[draft.id];
  const lines = [
    `Prefab: ${original.id} (${original.name}) — ${src ? `${src.file}:${src.line}` : 'source not found'}`,
    `Viewed in slot: ${slot}${gearSlotFor(original) !== slot ? ` (its natural slot is ${gearSlotFor(original) ?? 'none'})` : ''}`,
  ];
  if (rev?.status || rev?.note) lines.push(`Review: ${rev.status ?? '-'}${rev.note ? ` — ${rev.note}` : ''}`);
  if (slot !== 'hand' && slot !== 'model') {
    const c = gearClearance(draftDef(), slot);
    lines.push(`Clearance: ${c.gap.toFixed(3)} against ${c.against} (min ${MIN_GEAR_GAP})`);
  }
  if (slot !== 'model') lines.push(`Slot anchor (${slot}): at ${fmtVec(anchors[slot].at)} rot ${fmtVec(anchors[slot].rot)}`);
  lines.push(`Worn offset: saved ${JSON.stringify(cleanWear(original.wear) ?? {})}${wearDirty() ? `, edited ${JSON.stringify(cleanWear(draft.wear) ?? {})}` : ''}`);
  if (original.grip || draft.grip) lines.push(`Grip: saved ${fmtVec(original.grip)}${gripDirty() ? `, edited ${fmtVec(draft.grip)}` : ''}`);
  if (partsDirty()) {
    lines.push('', 'Edited parts (not all saved yet):', 'parts: [');
    for (const p of draft.parts) lines.push(`  ${JSON.stringify(plainPart(p)).replace(/"(\w+)":/g, '$1: ').replace(/"/g, '\'')},${partChanged(p) ? ` // ${p.__orig === null ? 'new' : `was #${p.__orig}`}` : ''}`);
    lines.push('],');
    const removed = original.parts.map((_, i) => i).filter((i) => !draft!.parts.some((p) => p.__orig === i));
    if (removed.length) lines.push(`Removed parts: ${removed.map((i) => `#${i}`).join(', ')}`);
  }
  for (const i of selected) lines.push(`Selected part: #${i} ${JSON.stringify(plainPart(draft.parts[i]))}`);
  const text = lines.join('\n');
  navigator.clipboard.writeText(text).then(() => say('Report copied to the clipboard.'), () => {
    say('Clipboard blocked: the report is printed in the console.');
    console.log(text);
  });
}

// ------------------------------------------------------------------ keys

addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); doRedo(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void save(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); if (draft) selectParts(draft.parts.map((_, i) => i)); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selected.length) { e.preventDefault(); deleteSelected(); return; }
  if (e.key === 'w') setMode('translate');
  else if (e.key === 'e') setMode('rotate');
  else if (e.key === 'r') setMode('scale');
  else if (e.key === 'Escape') selectParts([]);
  else if (e.key === 'f') stage.frame('item');
});
addEventListener('beforeunload', (e) => {
  if (draft && dirty() && !statusText.startsWith('Saved')) e.preventDefault();
});

// ------------------------------------------------------------------ start

stage.setPose(session.pose);
stage.setSpheres(session.spheres);
stage.setTurntable(session.turntable);
stage.setLook(currentLook());
stage.setGizmo(session.target, gizmoMode);
renderToolbar();
open(session.id);

// Server data arrives after the first paint; each part shows as soon as it lands (the usage scan is the slow one).
const failed = (e: unknown): void => say(`Dev server API not reachable: ${(e as Error).message}`);
api<Record<string, SourceInfo | null>>('/source', { ids }).then((r) => { sources = r; renderInspector(); }, failed);
api<Record<string, ReviewEntry>>('/review').then((r) => { review = r; renderList(); renderInspector(); }, failed);
api<Record<string, string[]>>('/usage', { ids }).then((r) => { usage = r; renderList(); renderInspector(); }, failed);
