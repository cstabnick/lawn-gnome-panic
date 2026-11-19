// STUB: a worker fills this in (docs/roadmaps/level-format.md, issue E5). Keep the exported name and its `Tool` shape.
import type { EditorContext, Tool } from '../context';

export const roadTool: Tool = {
  id: 'road',
  label: 'Road',
  mount(_ctx: EditorContext, panel: HTMLElement): void {
    panel.textContent = 'Road tool: not implemented yet.';
  },
  activate(): void {},
  deactivate(): void {},
};
