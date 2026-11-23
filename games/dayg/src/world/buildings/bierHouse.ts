// The Bier House (roadmap 10): a brick house on the Forecourt where the parish kept its bier. Hand-made layout, expanded by expandBuilding.
import type { BuildingDef } from '../buildingTypes';

export const BIER_HOUSE: BuildingDef = {
  id: 'bier-house', name: 'The Bier House', region: 'forecourt', style: 'brick',
  footprint: { x0: 364, x1: 394, z0: 424, z1: 460 }, storeys: [0, 12],
  shell: { thick: 1, height: 26, openings: [
    { id: 'door', side: 's', at: 13, width: 4, height: 16, door: true },     // one leaf of the double door stands open
    { id: 'window-e', side: 'e', at: 10, width: 4, height: 6, sill: 6 },
    { id: 'window-n', side: 'n', at: 12, width: 6, height: 5, sill: 15 },   // looks out from the loft
  ] },
  roof: { thick: 1, eaves: 0.8, ridge: 2 },
  walls: [{ id: 'tool-wall', x0: 384, x1: 385, z0: 448, z1: 459.1, y: 0, h: 10, openings: [{ id: 'gap', at: 3, width: 2.6, height: 4 }] }],
  floors: [{ storey: 1, rect: { x0: 364.9, x1: 393.1, z0: 424.95, z1: 436 }, thick: 0.6 }],   // the loft, north third
  stairs: [],
  boxes: [
    { id: 'bier', role: 'furniture', x0: 370, x1: 383, z0: 440, z1: 449, y: 0, h: 8 },
    { id: 'cupboards', role: 'furniture', x0: 364.9, x1: 369, z0: 446, z1: 458, y: 0, h: 14 },
    { id: 'loft-post', role: 'furniture', x0: 377, x1: 381, z0: 435.6, z1: 437, y: 0, h: 12.1 },
  ],
  routes: [
    { block: 'loft-post', side: 's', kind: 'ladder', at: 2 },
    { block: 'bier', side: 's', kind: 'ladder', at: 6.5 },
    { block: 'cupboards', side: 'e', kind: 'rope', at: 6 },
  ],
  containers: [
    { id: 'bier-box', type: 'chest', x: 376.5, y: 8, z: 444.5 },
    { id: 'cupboard-top', type: 'crate', x: 367, y: 14, z: 452 },
    { id: 'tool-1', type: 'crate', x: 389, y: 0, z: 456 },
    { id: 'tool-2', type: 'sack', x: 389, y: 0, z: 450.5 },
    { id: 'loft-chest', type: 'chest', x: 390, y: 12, z: 428 },
    { id: 'loft-cache', type: 'camp-cache', x: 368, y: 12, z: 429 },
  ],
  spots: [{ id: '1', kind: 'npc', x: 380, y: 12, z: 429 }, { id: '1', kind: 'hatless', x: 372, y: 0, z: 455 }],
  props: [{ prefab: 'candle', x: 383, y: 12, z: 427 }, { prefab: 'bedroll', x: 372, y: 12, z: 432 }],
};
