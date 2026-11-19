import type { EditorContext, Tool } from '../context';

/** Plain camera navigation plus what is drawn: left drag orbits, right drag pans, wheel zooms; layer toggles and the shortcuts. */
const LAYERS: { label: string; find: (ctx: EditorContext) => { visible: boolean } | null | undefined }[] = [
  { label: 'Buildings, decks and props', find: (c) => c.viewport.scene.getObjectByName('object-view')?.children[0] },
  { label: 'Trees, rocks and hedges', find: (c) => c.viewport.scene.getObjectByName('object-view')?.children[1] },
  { label: 'Picking rings and outlines', find: (c) => c.viewport.scene.getObjectByName('entity-view') },
  { label: 'Water', find: (c) => c.viewport.scene.getObjectByName('water') },
];

export const viewTool: Tool = {
  id: 'view',
  label: 'View',
  mount(ctx, panel) {
    panel.innerHTML = '<p class="le-hint">Drag to orbit, right-drag or shift-drag to pan, wheel to zoom. Pick a tool on the left to edit.</p><h3>Show</h3>';
    for (const layer of LAYERS) {
      const row = document.createElement('label');
      row.className = 'le-check';
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = layer.find(ctx)?.visible ?? true;
      box.addEventListener('change', () => {
        const o = layer.find(ctx);
        if (o) o.visible = box.checked;
      });
      row.append(box, ` ${layer.label}`);
      panel.append(row);
    }
    const help = document.createElement('div');
    help.className = 'le-help';
    help.innerHTML = `<h3>Shortcuts</h3>
      <div><b>Ctrl+Z</b> / <b>Ctrl+Shift+Z</b> undo, redo</div>
      <div><b>Ctrl+S</b> save</div>
      <div><b>Select:</b> arrows nudge (Shift 5 m), <b>Q</b>/<b>E</b> rotate, <b>Ctrl+D</b> duplicate, <b>Delete</b> remove, <b>Esc</b> deselect</div>
      <div><b>Brush:</b> Shift inverts, <b>[</b> <b>]</b> radius, Alt-click sets the flatten height</div>
      <div><b>Road:</b> Enter finishes, Esc cancels, Shift-click adds a point</div>
      <div>The <b>Snap</b> box in the header rounds placing and dragging to a grid.</div>`;
    panel.append(help);
  },
  activate() {},
  deactivate() {},
};
