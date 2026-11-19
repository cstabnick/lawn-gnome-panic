// STUB: a worker fills this in (docs/roadmaps/level-format.md, issue E6). Keep the exported name and its `Tool` shape.
import type { EditorContext, Tool } from '../context';

export const analyzeTool: Tool = {
  id: 'analyze',
  label: 'Analyze',
  mount(_ctx: EditorContext, panel: HTMLElement): void {
    panel.textContent = 'Analyze tool: not implemented yet.';
  },
  activate(): void {},
  deactivate(): void {},
};
