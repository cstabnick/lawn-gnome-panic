// The Rowkeepers' House (roadmap 10). Step 0 draft: the layout is authored later in roadmap 10.
import type { BuildingDef } from '../buildingTypes';

export const ROWKEEPERS_HOUSE: BuildingDef = {
  id: 'rowkeepers-house', name: "The Rowkeepers' House", region: 'yew-edge', style: 'cottage', draft: true,
  footprint: { x0: 170, x1: 186, z0: 80, z1: 94 }, storeys: [0, 3.6],
  shell: { thick: 0.5, height: 7.6, openings: [] },
  roof: { thick: 0.5, eaves: 0.5, ridge: 1.2 },
  walls: [], floors: [], stairs: [], boxes: [],
  routes: [], containers: [], spots: [], props: [],
};
