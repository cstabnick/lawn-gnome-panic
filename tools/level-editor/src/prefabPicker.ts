// The prefab field of a prop: a text box that autocompletes from the catalog, flags an unknown id, and a Browse button that
// opens a searchable grid of icons. Picking commits through `onPick` (the Select tool turns that into one undo step).
import { allPrefabs, getPrefab, prefabIconElement } from '@lawn/prefabs';
import { searchPrefabs, type PrefabLite } from './prefabSearch';

const LIST_ID = 'le-prefab-ids';
const RESULTS = 48;

function lite(): PrefabLite[] {
  return allPrefabs().map((p) => ({ id: p.id, name: p.name, category: p.category, tags: p.tags, emoji: p.emoji }));
}

/** One shared <datalist> of every prefab id, for the browser's own autocomplete. */
function ensureDatalist(): void {
  if (document.getElementById(LIST_ID)) return;
  const dl = document.createElement('datalist');
  dl.id = LIST_ID;
  for (const p of allPrefabs()) {
    const o = document.createElement('option');
    o.value = p.id;
    o.label = `${p.name} (${p.category})`;
    dl.append(o);
  }
  document.body.append(dl);
}

export function createPrefabField(current: string, onPick: (id: string) => void): HTMLElement {
  ensureDatalist();
  const wrap = document.createElement('div');
  wrap.className = 'le-prefab';

  const row = document.createElement('div');
  row.className = 'le-prefab-row';
  const input = document.createElement('input');
  input.type = 'text';
  input.setAttribute('list', LIST_ID);
  input.value = current;
  input.spellcheck = false;
  const browse = document.createElement('button');
  browse.type = 'button';
  browse.textContent = 'Browse';
  row.append(input, browse);

  const note = document.createElement('div');
  note.className = 'le-prefab-note';
  const refreshNote = (): void => {
    const p = getPrefab(input.value.trim());
    input.classList.toggle('le-bad', !p);
    note.textContent = p ? `${p.name} · ${p.category}` : `Unknown prefab id "${input.value}": pick one from the list or Browse.`;
    note.classList.toggle('le-bad', !p);
  };
  refreshNote();
  input.addEventListener('input', refreshNote);
  input.addEventListener('change', () => {
    const v = input.value.trim();
    refreshNote();
    if (v !== current) onPick(v);
  });

  // ---- the browser panel
  const panel = document.createElement('div');
  panel.className = 'le-prefab-panel';
  panel.hidden = true;
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search: bench, lamp, tree, 🌳 ...';
  const cat = document.createElement('select');
  const everything = lite();
  for (const c of ['all', ...[...new Set(everything.map((p) => p.category))].sort()]) cat.add(new Option(c, c));
  cat.value = 'all';
  const grid = document.createElement('div');
  grid.className = 'le-prefab-grid';
  const count = document.createElement('div');
  count.className = 'le-hint';

  const render = (): void => {
    const found = searchPrefabs(everything, search.value, cat.value, RESULTS);
    grid.replaceChildren();
    for (const p of found) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'le-prefab-item';
      b.title = `${p.id} (${p.category})`;
      b.append(prefabIconElement(p.id, p.emoji[0] ?? '?', 32));
      const label = document.createElement('span');
      label.textContent = p.name;
      b.append(label);
      b.addEventListener('click', () => {
        input.value = p.id;
        refreshNote();
        panel.hidden = true;
        if (p.id !== current) onPick(p.id);
      });
      grid.append(b);
    }
    count.textContent = found.length === RESULTS ? `First ${RESULTS} matches: type to narrow.` : `${found.length} match${found.length === 1 ? '' : 'es'}.`;
  };
  search.addEventListener('input', render);
  cat.addEventListener('change', render);
  browse.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) { render(); search.focus(); }
  });
  panel.append(search, cat, count, grid);

  wrap.append(row, note, panel);
  return wrap;
}
