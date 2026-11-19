// The Island tab (Gnome Golf): the numbers that shape the coastline and the ground away from the holes.
import type { EditorContext, Tool } from '../context';
import type { GolfLevel } from '../adapters/golfLevel';

let ctx: EditorContext;
let box: HTMLElement;

const FIELDS: { key: keyof GolfLevel['island']; label: string; step: number; hint: string }[] = [
  { key: 'rx', label: 'East-west radius (yd)', step: 10, hint: 'How far the island reaches east and west. Changing it does not extend the area this view draws.' },
  { key: 'rz', label: 'North-south radius (yd)', step: 10, hint: 'How far it reaches north and south.' },
  { key: 'beach', label: 'Beach width (yd)', step: 1, hint: 'The sandy band inside the coast.' },
  { key: 'inland', label: 'Inland height (yd)', step: 0.5, hint: 'How high the plateau stands above the sea.' },
  { key: 'roll', label: 'Rolling (yd)', step: 0.1, hint: 'How much the ground undulates away from greens and tees.' },
  { key: 'seaFloor', label: 'Sea floor (yd, negative)', step: 0.5, hint: 'How deep the sea gets.' },
];

function render(): void {
  box.replaceChildren();
  const island = (ctx.zones[ctx.zone] as unknown as GolfLevel).island;
  for (const f of FIELDS) {
    const row = document.createElement('label');
    row.className = 'le-field';
    row.textContent = f.label;
    row.title = f.hint;
    const i = document.createElement('input');
    i.type = 'number';
    i.step = String(f.step);
    i.value = String(island[f.key]);
    i.addEventListener('change', () => {
      const v = Number(i.value);
      if (Number.isNaN(v)) return;
      ctx.editZone(`Island ${f.label}`, ctx.zone, (def) => { (def as unknown as GolfLevel).island[f.key] = v; });
    });
    row.append(i);
    box.append(row);
  }
}

export const islandTool: Tool = {
  id: 'island',
  label: 'Island',
  mount(editor: EditorContext, panel: HTMLElement): void {
    ctx = editor;
    const hint = document.createElement('p');
    hint.className = 'le-hint';
    hint.textContent = 'The island\'s coastline and ground. The holes (tees, greens, bunkers, ponds) are edited with the Select tool.';
    box = document.createElement('div');
    panel.append(hint, box);
    ctx.events.changed.on(render);
    render();
  },
  activate(): void {
    ctx.viewport.setLeftOrbit(true);
    render();
  },
  deactivate(): void {},
};
