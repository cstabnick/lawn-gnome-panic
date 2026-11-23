// The Rowkeepers' House (roadmap 10): a gnome-built two-storey cottage in Yew Edge. Hand-made layout, expanded by expandBuilding.
import type { BuildingDef } from '../buildingTypes';

export const ROWKEEPERS_HOUSE: BuildingDef = {
  id: 'rowkeepers-house', name: "The Rowkeepers' House", region: 'yew-edge', style: 'cottage',
  footprint: { x0: 170, x1: 186, z0: 80, z1: 94 }, storeys: [0, 3.6],
  shell: { thick: 0.5, height: 7.6, openings: [
    { id: 'front', side: 's', at: 3, width: 2.4, height: 2.8, door: true },
    { id: 'back', side: 'n', at: 12, width: 2.4, height: 2.8, door: true },
    { id: 'w-west', side: 'w', at: 4.2, width: 2, height: 1.4, sill: 1.2 },
    { id: 'w-east-up', side: 'e', at: 4.2, width: 2, height: 1.2, sill: 4.8 },
    { id: 'w-south-up', side: 's', at: 9, width: 2, height: 1.2, sill: 4.8 },
  ] },
  roof: { thick: 0.5, eaves: 0.5, ridge: 1.2 },
  walls: [
    { id: 'mid', x0: 178, x1: 178.4, z0: 80.4, z1: 93.6, y: 0, h: 3.3, openings: [{ id: 'kitchen', at: 7, width: 2.2, height: 2.6 }] },
    { id: 'pantry', x0: 170.4, x1: 178.1, z0: 86, z1: 86.4, y: 0, h: 3.25, openings: [{ id: 'pantry', at: 4, width: 2.2, height: 2.6 }] },
    { id: 'up-mid', x0: 178, x1: 178.4, z0: 80.4, z1: 93.6, y: 3.6, h: 3.9, openings: [{ id: 'door', at: 3, width: 2.2, height: 7.5 }] },
  ],
  floors: [{ storey: 1, rect: { x0: 170.45, x1: 185.55, z0: 80.45, z1: 93.55 }, holes: [{ x0: 183, x1: 185.6, z0: 84, z1: 92 }], thick: 0.4 }],
  stairs: [{ id: 'stair', rect: { x0: 183, x1: 185.6, z0: 84, z1: 92 }, up: 'n', fromY: 0, toY: 3.6 }],
  boxes: [
    { id: 'table', role: 'furniture', x0: 179.5, x1: 181.5, z0: 90.5, z1: 92.5, y: 0, h: 1.2 },
    { id: 'settle', role: 'furniture', x0: 170.4, x1: 172, z0: 88.5, z1: 92, y: 0, h: 1.0 },
    { id: 'pantry-shelf', role: 'shelf', x0: 171, x1: 177, z0: 80.4, z1: 81.5, y: 0, h: 1.4 },
    { id: 'bed', role: 'furniture', x0: 179, x1: 181.5, z0: 90.5, z1: 93.5, y: 3.6, h: 0.8 },
  ],
  routes: [],
  containers: [
    { id: 'pantry-sack', type: 'sack', x: 172.5, y: 0, z: 83 },
    { id: 'pantry-shelf', type: 'crate', x: 176, y: 1.4, z: 81 },
    { id: 'parlour-chest', type: 'chest', x: 171.2, y: 1.0, z: 90 },
    { id: 'kitchen-crate', type: 'crate', x: 180.5, y: 0, z: 82 },
    { id: 'bed-chest', type: 'chest', x: 180.25, y: 3.6, z: 89.5 },
    { id: 'loft-cache', type: 'camp-cache', x: 172.5, y: 3.6, z: 90 },
  ],
  spots: [
    { id: '1', kind: 'npc', x: 181, y: 3.6, z: 86 }, { id: '2', kind: 'npc', x: 174, y: 3.6, z: 83.5 },
    { id: '1', kind: 'hatless', x: 174, y: 0, z: 83.5 },
  ],
  props: [{ prefab: 'candle', x: 180.5, y: 1.2, z: 91.5 }, { prefab: 'flower-pot', x: 176, y: 3.6, z: 92.5 }],
};
