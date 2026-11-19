import type { Tool } from '../context';

/** Plain camera navigation: left drag orbits, right drag pans, wheel zooms. main.ts turns left-orbit on for this tool. */
export const viewTool: Tool = {
  id: 'view',
  label: 'View',
  mount(_ctx, panel) {
    panel.innerHTML = '<p class="le-hint">Drag to orbit, right-drag or shift-drag to pan, wheel to zoom.<br>Pick a tool on the left to edit.</p>';
  },
  activate() {},
  deactivate() {},
};
