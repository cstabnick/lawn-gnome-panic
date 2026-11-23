// Pay 'n' Glaze shop panel: wheels: tyres, rims, size, camber and ride height.
// STUB: filled by its own issue; the exported name and the Panel shape (glazeUi.ts) are final.
import type { Panel } from './glazeUi';

export const wheelsPanel: Panel = {
  id: 'wheels',
  label: 'Wheels',
  icon: '🛞',
  build: () => document.createElement('div'),
};
