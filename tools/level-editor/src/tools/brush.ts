// STUB: a worker fills this in (docs/roadmaps/level-format.md, issue E3). Keep the exported name and its `Tool` shape.
import type { EditorContext, Tool } from '../context';

export const brushTool: Tool = {
  id: 'brush',
  label: 'Brush',
  mount(_ctx: EditorContext, panel: HTMLElement): void {
    panel.textContent = 'Brush tool: not implemented yet.';
  },
  activate(): void {},
  deactivate(): void {},
};
