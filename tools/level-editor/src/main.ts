import './style.css';
import type { EditorContext, Tool } from './context';
import { createEntityView } from './entityView';
import { createObjectView } from './objectView';
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
      <span id="le-dirty" class="le-hint"></span>
    </div>
    <div id="le-tools"></div>
    <div id="le-view"></div>
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
  dirtyEl.textContent = parts.length ? `unsaved: ${parts.join(', ')}` : '';
};
ctx.events.changed.on(syncDirty);

async function save(): Promise<void> {
  try {
    ctx.status('Saving...');
    const r = await saveAll(ctx);
    syncDirty();
    ctx.status(r.files.length ? `Saved ${r.files.join(', ')}` : 'Nothing to save.');
  } catch (e) {
    ctx.status(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
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
ctx.events.status.on((m) => { statusEl.textContent = m; });

zoneSel.value = ctx.zone;
focusZone();
activate(viewTool);

// Handy for poking at the editor from the console and for scripted checks.
(window as unknown as { editor: EditorContext }).editor = ctx;
