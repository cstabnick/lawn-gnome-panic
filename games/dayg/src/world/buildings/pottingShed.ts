// The Potting Shed (roadmap 10): a one-room plank shed in the Bin Corner. Hand-made layout, expanded by expandBuilding.
import type { BuildingDef } from '../buildingTypes';

export const POTTING_SHED: BuildingDef = {
  id: 'potting-shed', name: 'The Potting Shed', region: 'bin-corner', style: 'plank',
  footprint: { x0: 446, x1: 474, z0: 452, z1: 484 }, storeys: [0],
  shell: { thick: 0.6, height: 24, openings: [
    { id: 'door', side: 'w', at: 8.5, width: 3, height: 20, door: true },          // the door hangs open a hand's width
    { id: 'window-e', side: 'e', at: 12, width: 6, height: 5, sill: 13 },
  ] },
  roof: { thick: 0.8, eaves: 0.6, ridge: 1.5 },
  walls: [{ id: 'trays', x0: 446.5, x1: 458, z0: 474, z1: 475, y: 0, h: 3, openings: [{ id: 'gap', at: 7, width: 2.5, height: 3 }] }],
  floors: [], stairs: [],
  boxes: [
    { id: 'shelf-low', role: 'shelf', x0: 466, x1: 473.5, z0: 456, z1: 480, y: 0, h: 5.5 },
    { id: 'shelf-high', role: 'shelf', x0: 469.5, x1: 473.6, z0: 458, z1: 478, y: 5.5, h: 5.5 },
    { id: 'bench', role: 'furniture', x0: 452, x1: 464, z0: 452.5, z1: 456, y: 0, h: 9 },
    { id: 'sacks', role: 'furniture', x0: 446.5, x1: 452, z0: 479, z1: 483.45, y: 0, h: 1.2 },
    { id: 'paint-tins', role: 'furniture', x0: 455, x1: 457.5, z0: 480.5, z1: 483.45, y: 0, h: 2.5 },
  ],
  routes: [
    { block: 'shelf-low', side: 'w', kind: 'rope', at: 12 },
    { block: 'shelf-high', side: 'w', kind: 'rope', at: 4 },
    { block: 'bench', side: 's', kind: 'ladder', at: 6 },
  ],
  containers: [
    { id: 'crate-1', type: 'crate', x: 461, y: 0, z: 470 },
    { id: 'sacks', type: 'sack', x: 449, y: 1.2, z: 481.5 },
    { id: 'bench-chest', type: 'chest', x: 455, y: 9, z: 454.2 },
    { id: 'high-shelf', type: 'camp-cache', x: 471.5, y: 11, z: 470 },
    { id: 'paint-crate', type: 'crate', x: 450, y: 0, z: 476.8 },
  ],
  spots: [{ id: '1', kind: 'npc', x: 471.5, y: 11, z: 475 }, { id: '1', kind: 'hatless', x: 462, y: 0, z: 478 }],
  props: [{ prefab: 'flower-pot', x: 461, y: 9, z: 454 }, { prefab: 'candle', x: 449, y: 1.2, z: 480 }, { prefab: 'garden-rock', x: 468, y: 0, z: 482 }],
};
