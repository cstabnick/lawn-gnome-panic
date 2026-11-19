// The Cover tab (Gnome Front): the rules for the scattered cover (bushes, rocks, flower pots, stumps, pines). The game generates it
// from a seed each time, in order, so changing a count, a size or the seed changes where things end up; the view rebuilds
// with the game's own generator after every edit. Positions are not edited by hand: use "Re-roll" to try another layout.
import { createPrefabField } from '../prefabPicker';
import type { EditorContext, Tool } from '../context';
import type { FrontLevel } from '../adapters/frontLevel';

let ctx: EditorContext;
let box: HTMLElement;

const level = (): FrontLevel => ctx.zones[ctx.zone] as unknown as FrontLevel;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  return n;
};

function numberField(label: string, value: number, step: number, min: number, onChange: (v: number) => void): HTMLElement {
  const row = el('label', label);
  row.className = 'le-field';
  const i = el('input');
  i.type = 'number';
  i.step = String(step);
  i.min = String(min);
  i.value = String(value);
  i.addEventListener('change', () => { const n = Number(i.value); if (!Number.isNaN(n)) onChange(n); });
  row.append(i);
  return row;
}

function edit(label: string, fn: (c: FrontLevel['cover']) => void): void {
  ctx.editZone(label, ctx.zone, (def) => fn((def as unknown as FrontLevel).cover));
}

function render(): void {
  box.replaceChildren();
  const c = level().cover;
  const head = el('h3', 'Scatter');
  box.append(head);
  box.append(numberField('Seed', c.seed, 1, 0, (v) => edit('Cover seed', (k) => { k.seed = Math.floor(v); })));
  const reroll = el('button', 'Re-roll the layout');
  reroll.title = 'Picks a new random seed: the same rules, a different arrangement';
  reroll.addEventListener('click', () => edit('Re-roll cover', (k) => { k.seed = Math.floor(Math.random() * 1_000_000); }));
  box.append(reroll);
  box.append(el('h3', 'Keep clear of'));
  for (const [key, label] of [['flag', 'Flags (m)'], ['base', 'Bases (m)'], ['slot', 'Vehicle slots (m)'], ['cover', 'Other cover (m)']] as const) {
    box.append(numberField(label, c.avoid[key], 1, 0, (v) => edit(`Cover keep-clear ${key}`, (k) => { k.avoid[key] = v; })));
  }
  box.append(numberField('Fence margin (m)', c.edge, 1, 0, (v) => edit('Cover fence margin', (k) => { k.edge = v; })));

  box.append(el('h3', `Layers (${c.layers.length})`));
  c.layers.forEach((layer, i) => {
    const card = el('div');
    card.className = 'le-card';
    const title = el('div', `Layer ${i + 1}`);
    title.className = 'le-card-title';
    card.append(title);
    const pf = el('label', 'Prefab');
    pf.className = 'le-field';
    pf.append(createPrefabField(layer.prefab, (id) => edit('Cover prefab', (k) => { k.layers[i].prefab = id; })));
    card.append(pf);
    card.append(numberField('How many', layer.count, 1, 0, (v) => edit('Cover count', (k) => { k.layers[i].count = Math.floor(v); })));
    card.append(numberField('Scale', layer.scale, 0.1, 0.1, (v) => edit('Cover scale', (k) => { k.layers[i].scale = v; })));
    card.append(numberField('Sunk into turf (m)', layer.sink ?? 0, 0.05, 0, (v) => edit('Cover sink', (k) => { if (v > 0) k.layers[i].sink = v; else delete k.layers[i].sink; })));
    card.append(numberField('Blocks within (m)', layer.obstacle.r, 0.1, 0.1, (v) => edit('Cover obstacle size', (k) => { k.layers[i].obstacle = { ...k.layers[i].obstacle, r: v }; })));
    card.append(numberField('Blocks up to (m)', layer.obstacle.h, 0.1, 0.1, (v) => edit('Cover obstacle height', (k) => { k.layers[i].obstacle = { ...k.layers[i].obstacle, h: v }; })));
    const spinRow = el('label', 'Random turn ');
    spinRow.className = 'le-field';
    const spin = el('input');
    spin.type = 'checkbox';
    spin.checked = layer.spin === true;
    spin.addEventListener('change', () => edit('Cover random turn', (k) => { if (spin.checked) k.layers[i].spin = true; else delete k.layers[i].spin; }));
    spinRow.append(spin);
    card.append(spinRow);
    const del = el('button', 'Remove layer');
    del.addEventListener('click', () => edit('Remove cover layer', (k) => { k.layers.splice(i, 1); }));
    card.append(del);
    box.append(card);
  });
  const add = el('button', 'Add a layer');
  add.addEventListener('click', () => edit('Add cover layer', (k) => { k.layers.push({ prefab: 'garden-rock', count: 10, scale: 3, obstacle: { r: 1.2, h: 1.4 } }); }));
  box.append(add);
}

export const coverTool: Tool = {
  id: 'cover',
  label: 'Cover',
  mount(editor: EditorContext, panel: HTMLElement): void {
    ctx = editor;
    box = el('div');
    panel.append(el('p', 'Rules for the scattered cover. The game builds it from a seed, in order, so every change reshuffles it: Re-roll for a new arrangement.'), box);
    panel.firstElementChild!.className = 'le-hint';
    ctx.events.changed.on(render);
    render();
  },
  activate(): void {
    ctx.viewport.setLeftOrbit(true);
    render();
  },
  deactivate(): void {},
};
