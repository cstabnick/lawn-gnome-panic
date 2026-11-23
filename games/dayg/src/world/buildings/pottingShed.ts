// The Potting Shed (roadmap 10). Step 0 draft: the layout is authored in issue 1.1.
import type { BuildingDef } from '../buildingTypes';

export const POTTING_SHED: BuildingDef = {
  id: 'potting-shed', name: 'The Potting Shed', region: 'bin-corner', style: 'plank', draft: true,
  footprint: { x0: 446, x1: 474, z0: 452, z1: 484 }, storeys: [0],
  shell: { thick: 0.6, height: 24, openings: [] },
  roof: { thick: 0.8, eaves: 0.6, ridge: 1.5 },
  walls: [], floors: [], stairs: [], boxes: [],
  routes: [], containers: [], spots: [], props: [],
};
