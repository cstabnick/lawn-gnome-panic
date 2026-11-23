// Pay 'n' Glaze shop panel: body: spoiler, seat, steering wheel, hood ornament and extras.
// STUB: filled by its own issue; the exported name and the Panel shape (glazeUi.ts) are final.
import type { Panel } from './glazeUi';

export const bodyPanel: Panel = {
  id: 'body',
  label: 'Body',
  icon: '🧩',
  build: () => document.createElement('div'),
};
