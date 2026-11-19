import './style.css';
import type { EditorContext, Tool } from './context';
import { createEntityView } from './entityView';
import { createObjectView } from './objectView';
import { applyDraft, installDraft, readDraft, writeDraft } from './draft';
import { saveAll } from './persist';
import { createContext } from './state';
import { analyzeTool } from './tools/analyze';
import { brushTool } from './tools/brush';
import { roadTool } from './tools/road';
import { selectTool } from './tools/select';
import { viewTool } from './tools/view';
import { createViewport } from './viewport';
import { createWorld } from './world';

const app = document.getElementById('app')!;
app.innerHTML = `
  <div id="le-root">
    <div id="le-head">
      <strong>Level Editor</strong>
      <label>Zone <select id="le-zone"></select></label>
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

const world = createWorld();
const ctx: EditorContext = createContext(world);
const viewport = createViewport($('le-view'), { terrain: world.terrain, zones: world.zones });
ctx.viewport = viewport;
createObjectView(ctx);
createEntityView(ctx);

const tools: Tool[] = [viewTool, brushTool, selectTool, roadTool, analyzeTool];
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

const zoneSel = $<HTMLSelectElement>('le-zone');
for (const id of ctx.outdoorZones) zoneSel.add(new Option(world.zones[id].name, id));
function focusZone(): void {
  const o = world.zones[ctx.zone].origin ?? { x: 0, z: 0 };
  viewport.focus(o.x, o.z, 180);
}
zoneSel.onchange = () => ctx.setZone(zoneSel.value as typeof ctx.zone);
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
  dirtyEl.textContent = parts.length ? `unsaved: ${parts.join(', ')}` : savedAt ? `saved ${savedAt}` : '';
};
ctx.events.changed.on(syncDirty);

let savedAt = '';
async function save(): Promise<void> {
  try {
    ctx.status('Saving...');
    const r = await saveAll(ctx);
    drafts.sync();
    if (r.files.length) {
      const d = new Date();
      savedAt = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      ctx.status(`Saved ${r.files.join(', ')}`, 'ok');
    } else {
      ctx.status('Nothing to save.');
    }
    syncDirty();
  } catch (e) {
    ctx.status(`Save failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
  }
}
$('le-save').onclick = () => void save();

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
  if (!leaving && (ctx.dirty.zones.size > 0 || ctx.dirty.deltas)) {
    e.preventDefault();
    e.returnValue = '';
  }
});
const recovered = readDraft();
if (recovered) {
  applyDraft(ctx, recovered);
  syncDirty();
  const banner = document.createElement('div');
  banner.id = 'le-banner';
  const what = [...Object.keys(recovered.zones), ...(recovered.deltas ? ['terrain brush'] : [])].join(', ');
  banner.append(`Recovered unsaved edits (${what}) from ${new Date(recovered.at).toLocaleTimeString()}. Save to keep them.`);
  const keep = document.createElement('button');
  keep.textContent = 'OK';
  keep.onclick = () => banner.remove();
  const discard = document.createElement('button');
  discard.textContent = 'Discard them';
  discard.onclick = () => { writeDraft(null); leaving = true; location.reload(); };
  banner.append(keep, discard);
  $('le-view').append(banner);
}

zoneSel.value = ctx.zone;
focusZone();
activate(viewTool);

// Handy for poking at the editor from the console and for scripted checks.
(window as unknown as { editor: EditorContext }).editor = ctx;
