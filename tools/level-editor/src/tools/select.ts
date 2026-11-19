// STUB: a worker fills this in (docs/roadmaps/level-format.md, issue E4). Keep the exported name and its `Tool` shape.
import type { EditorContext, Tool } from '../context';

export const selectTool: Tool = {
  id: 'select',
  label: 'Select',
  mount(_ctx: EditorContext, panel: HTMLElement): void {
    panel.textContent = 'Select tool: not implemented yet.';
  },
  activate(): void {},
  deactivate(): void {},
};
