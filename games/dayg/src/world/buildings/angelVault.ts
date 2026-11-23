// The Angel Vault (roadmap 10). Step 0 draft: the layout is authored later in roadmap 10.
import type { BuildingDef } from '../buildingTypes';

export const ANGEL_VAULT: BuildingDef = {
  id: 'angel-vault', name: 'The Angel Vault', region: 'angel-square', style: 'stone', draft: true,
  footprint: { x0: 160, x1: 188, z0: 188, z1: 212 }, storeys: [-8], sunk: 8,
  shell: { thick: 1, height: 14, openings: [] },
  roof: { thick: 1, eaves: 0.5, ridge: 2 },
  walls: [], floors: [], stairs: [], boxes: [],
  routes: [], containers: [], spots: [], props: [],
};
