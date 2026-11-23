// The Bier House (roadmap 10). Step 0 draft: the layout is authored later in roadmap 10.
import type { BuildingDef } from '../buildingTypes';

export const BIER_HOUSE: BuildingDef = {
  id: 'bier-house', name: 'The Bier House', region: 'forecourt', style: 'brick', draft: true,
  footprint: { x0: 364, x1: 394, z0: 424, z1: 460 }, storeys: [0, 12],
  shell: { thick: 1, height: 26, openings: [] },
  roof: { thick: 1, eaves: 0.8, ridge: 2 },
  walls: [], floors: [], stairs: [], boxes: [],
  routes: [], containers: [], spots: [], props: [],
};
