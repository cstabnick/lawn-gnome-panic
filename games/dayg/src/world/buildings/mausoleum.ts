// The Mausoleum (roadmap 10). Step 0 draft: the layout is authored later in roadmap 10.
import type { BuildingDef } from '../buildingTypes';

export const MAUSOLEUM: BuildingDef = {
  id: 'mausoleum', name: 'The Mausoleum', region: 'yew-edge', style: 'marble', draft: true,
  footprint: { x0: 224, x1: 254, z0: 38, z1: 74 }, storeys: [0],
  shell: { thick: 1.5, height: 44, openings: [] },
  roof: { thick: 2, eaves: 1, ridge: 4 },
  walls: [], floors: [], stairs: [], boxes: [],
  routes: [], containers: [], spots: [], props: [],
};
