// Pay 'n' Glaze shop panel: headlights: lamp style and beam colour.
// STUB: filled by its own issue; the exported name and the Panel shape (glazeUi.ts) are final.
import type { Panel } from './glazeUi';

export const lightsPanel: Panel = {
  id: 'lights',
  label: 'Lights',
  icon: '💡',
  build: () => document.createElement('div'),
};
