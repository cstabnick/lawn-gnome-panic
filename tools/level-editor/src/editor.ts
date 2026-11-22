import type { EditorContext, Tool } from './context';
import { installAgentApi } from './agent/api';
import { mountProblems } from './agent/problemsPanel';
import { ADAPTERS, pickAdapter } from './adapters';
import { createEntityView } from './entityView';
import { mountInspector } from './inspector';
import { applyDraft, draftKey, installDraft, readDraft, writeDraft } from './draft';
import { saveAll } from './persist';
import { createContext } from './state';
import { analyzeTool } from './tools/analyze';
import { brushTool } from './tools/brush';
import { coverTool } from './tools/cover';
import { islandTool } from './tools/island';
import { paintTool } from './tools/paint';
import { roadTool } from './tools/road';
import { railTool } from './tools/rail';
import { selectTool } from './tools/select';
import { viewTool } from './tools/view';
import { createViewport } from './viewport';

const app = document.getElementById('app')!;
app.innerHTML = `
  <div id="le-root">
    <div id="le-head">
      <strong>Level Editor</strong>
      <label>Game <select id="le-game"></select></label>
      <label><span id="le-level-label">Zone</span> <select id="le-zone"></select></label>
      <button id="le-undo" title="Ctrl+Z">Undo</button>
      <button id="le-redo" title="Ctrl+Shift+Z">Redo</button>
      <button id="le-save" title="Ctrl+S">Save</button>
      <label><input type="checkbox" id="le-gates" checked /> gates open</label>
      <label>Snap <select id="le-snap"><option value="0">off (0.1 m)</option><option value="0.5">0.5 m</option><option value="1">1 m</option><option value="2">2 m</option></select></label>
      <span id="le-dirty" class="le-hint"></span>
      <span class="grow"></span>
      <span id="le-readout"></span>
    </div>
    <div id="le-tools"></div>
    <div id="le-view"></div>
    <div id="le-toast" hidden></div>
    <div id="le-panel"></div>
    <div id="le-status">Ready.</div>
  </div>`;
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const adapter = pickAdapter(location.search);
const query = new URLSearchParams(location.search);
const world = adapter.createWorld(query.get('level') ?? undefined);
const ctx: EditorContext = createContext(world, adapter);
const viewport = createViewport($('le-view'), { terrain: world.terrain, zones: world.zones });
ctx.viewport = viewport;
adapter.createObjectView(ctx);
createEntityView(ctx);
mountInspector(ctx);
const problems = mountProblems(ctx, $('le-head'));

// Flat games have no water: hide the plane (the View tab's checkbox starts unticked).
if (adapter.singleLevel) { const w = viewport.scene.getObjectByName('water'); if (w) w.visible = false; }

const tools: Tool[] = [viewTool, brushTool, paintTool, selectTool, roadTool, analyzeTool, coverTool, islandTool, railTool].filter((t) => adapter.tools.includes(t.id));
const panels = new Map<string, HTMLElement>();
const buttons = new Map<string, HTMLButtonElement>();
let active: Tool | null = null;

function activate(tool: Tool): void {
  if (active === tool) return;
  active?.deactivate();
  active = tool;
  for (const t of tools) {
    panels.get(t.id)!.hidden = t !== tool;
    buttons.get(t.id)!.classList.toggle('on', t === tool);
  }
  viewport.setLeftOrbit(tool.id === 'view');
  tool.activate();
}

for (const tool of tools) {
  const b = document.createElement('button');
  b.textContent = tool.label;
  b.onclick = () => activate(tool);
  $('le-tools').append(b);
  buttons.set(tool.id, b);
  const p = document.createElement('div');
  p.className = 'le-panel';
  p.hidden = true;
  $('le-panel').append(p);
  panels.set(tool.id, p);
  tool.mount(ctx, p);
}

// The game and level selectors. Games whose levels each have their own coordinate space load one level per page.
const gameSel = $<HTMLSelectElement>('le-game');
for (const a of Object.values(ADAPTERS)) gameSel.add(new Option(a.label, a.id));
gameSel.value = adapter.id;
gameSel.onchange = () => { location.search = `?game=${gameSel.value}`; };
$('le-level-label').textContent = adapter.singleLevel ? 'Map' : 'Zone';
const zoneSel = $<HTMLSelectElement>('le-zone');
for (const l of adapter.levels()) zoneSel.add(new Option(l.name, l.id));
function focusZone(): void {
  const o = world.zones[ctx.zone].origin ?? { x: 0, z: 0 };
  // Gnomomia's zones are 240 m across; a flat map is a few tens of metres, so frame it from a distance that fits it.
  const half = world.zones[ctx.zone].half;
  viewport.focus(o.x, o.z, adapter.singleLevel ? Math.min(1300, Math.max(24, half * 2.6)) : 180);
}
zoneSel.onchange = () => {
  if (adapter.singleLevel) location.search = `?game=${adapter.id}&level=${zoneSel.value}`;
  else ctx.setZone(zoneSel.value as typeof ctx.zone);
};
ctx.events.zone.on(() => { zoneSel.value = ctx.zone; focusZone(); });

const undoBtn = $<HTMLButtonElement>('le-undo');
const redoBtn = $<HTMLButtonElement>('le-redo');
const syncHistory = (): void => {
  undoBtn.disabled = !ctx.history.canUndo;
  redoBtn.disabled = !ctx.history.canRedo;
  undoBtn.title = ctx.history.nextUndo ? `Undo: ${ctx.history.nextUndo}` : 'Ctrl+Z';
};
ctx.history.onChange.on(syncHistory);
undoBtn.onclick = () => ctx.history.undo();
redoBtn.onclick = () => ctx.history.redo();
syncHistory();

const dirtyEl = $('le-dirty');
const syncDirty = (): void => {
  const parts: string[] = [...ctx.dirty.zones];
  if (ctx.dirty.deltas) parts.push('terrain brush');
  if (ctx.dirty.paint) parts.push('ground paint');
  dirtyEl.textContent = parts.length ? `unsaved: ${parts.join(', ')}` : savedAt ? `saved ${savedAt}` : '';
};
ctx.events.changed.on(syncDirty);

let savedAt = '';
// Writes the dirty levels and returns the files written. Throws on failure; the caller reports it.
async function saveFiles(): Promise<string[]> {
  const r = await saveAll(ctx);
  drafts.sync();
  if (r.files.length) {
    const d = new Date();
    savedAt = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  syncDirty();
  return r.files;
}
async function save(): Promise<void> {
  try {
    ctx.status('Saving...');
    const files = await saveFiles();
    if (files.length) {
      ctx.status(`Saved ${files.join(', ')}`, 'ok');
    } else {
      ctx.status('Nothing to save.');
    }
  } catch (e) {
    ctx.status(`Save failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
  }
}
$('le-save').onclick = () => void save();

if (!adapter.tools.includes('analyze')) $('le-gates').parentElement!.hidden = true;
$<HTMLInputElement>('le-gates').onchange = (e) => ctx.setGatesOpen((e.target as HTMLInputElement).checked);

window.addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement | null;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) ctx.history.redo(); else ctx.history.undo(); }
  else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); ctx.history.redo(); }
  else if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); void save(); }
});

const statusEl = $('le-status');
const toastEl = $('le-toast');
let toastTimer: ReturnType<typeof setTimeout> | undefined;
ctx.events.status.on(({ msg, kind }) => {
  statusEl.textContent = msg;
  statusEl.className = kind === 'info' ? '' : kind;
  // Saves and failures also pop up where you are looking: the status bar alone is easy to miss.
  if (kind !== 'info') {
    toastEl.textContent = msg;
    toastEl.className = kind === 'error' ? 'error' : '';
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, kind === 'error' ? 9000 : 3500);
  }
});
toastEl.addEventListener('click', () => { toastEl.hidden = true; });

const snapSel = $<HTMLSelectElement>('le-snap');
snapSel.onchange = () => { ctx.snap = Number(snapSel.value); };

// Where the pointer is: world x, z, height and the region name.
const readout = $('le-readout');
let readoutBusy = false;
viewport.dom.addEventListener('pointermove', (ev) => {
  if (readoutBusy) return;
  readoutBusy = true;
  setTimeout(() => {
    readoutBusy = false;
    const h = viewport.pick(ev);
    readout.textContent = h ? `x ${h.x.toFixed(1)}  z ${h.z.toFixed(1)}  y ${h.y.toFixed(2)}  ${world.terrain.regionNameAt(h.x, h.z)}` : '';
  }, 60);
});

// Unsaved work: mirrored to localStorage, offered back after a reload, and guarded when you leave.
const drafts = installDraft(ctx);
let leaving = false;
window.addEventListener('beforeunload', (e) => {
  if (!leaving && (ctx.dirty.zones.size > 0 || ctx.dirty.deltas || ctx.dirty.paint)) {
    e.preventDefault();
    e.returnValue = '';
  }
});
const draftStore = draftKey(ctx);
const recovered = readDraft(draftStore);
if (recovered) {
  const dropped = applyDraft(ctx, recovered);
  syncDirty();
  const banner = document.createElement('div');
  banner.id = 'le-banner';
  const what = [...Object.keys(recovered.zones), ...(recovered.deltas ? ['terrain brush'] : []), ...(recovered.paint ? ['ground paint'] : [])].join(', ');
  // Never restore silently: say which markers were left out because they no longer exist in the packs.
  const dropNote = dropped.length > 0
    ? ` Dropped ${dropped.length} marker(s) that no longer exist: ${dropped.slice(0, 5).join(', ')}${dropped.length > 5 ? ', ...' : ''}.`
    : '';
  banner.append(`Recovered unsaved edits (${what}) from ${new Date(recovered.at).toLocaleTimeString()}. Save to keep them.${dropNote}`);
  if (dropNote) ctx.status(dropNote.trim(), 'error');
  const keep = document.createElement('button');
  keep.textContent = 'OK';
  keep.onclick = () => banner.remove();
  const discard = document.createElement('button');
  discard.textContent = 'Discard them';
  discard.onclick = () => { writeDraft(draftStore, null); leaving = true; location.reload(); };
  banner.append(keep, discard);
  $('le-view').append(banner);
}

zoneSel.value = ctx.zone;
focusZone();
activate(viewTool);

// Handy for poking at the editor from the console and for scripted checks.
(window as unknown as { editor: EditorContext }).editor = ctx;
// window.le: the same editor as commands and queries, for agents and scripts.
installAgentApi(ctx, {
  save: saveFiles,
  activateTool: (id) => {
    const t = tools.find((x) => x.id === id);
    if (!t) return false;
    activate(t);
    return true;
  },
  refreshProblems: (r) => problems.refresh(r),
});
