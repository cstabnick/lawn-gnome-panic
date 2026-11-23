// Pay 'n' Glaze shop panel: paint finish, body colour, sprays and underglow.
// STUB: filled by its own issue; the exported name and the Panel shape (glazeUi.ts) are final.
import type { Panel } from './glazeUi';

export const paintPanel: Panel = {
  id: 'paint',
  label: 'Paint',
  icon: '🎨',
  build: () => document.createElement('div'),
};
