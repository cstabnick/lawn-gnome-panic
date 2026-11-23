// The Mausoleum (roadmap 10): a Tall family crypt in Yew Edge with a shut iron door and a broken lower panel.
import type { BuildingDef } from '../buildingTypes';

export const MAUSOLEUM: BuildingDef = {
  id: 'mausoleum', name: 'The Mausoleum', region: 'yew-edge', style: 'marble',
  footprint: { x0: 224, x1: 254, z0: 38, z1: 74 }, storeys: [0],
  shell: { thick: 1.5, height: 44, openings: [{ id: 'panel', side: 'n', at: 13, width: 3, height: 3.2, door: true }] },
  roof: { thick: 2, eaves: 1, ridge: 4 },
  walls: [{ id: 'screen', x0: 225.4, x1: 252.6, z0: 50, z1: 51, y: 0, h: 12, openings: [{ id: 'arch', at: 12, width: 3.5, height: 12 }] }],
  floors: [], stairs: [],
  boxes: [
    { id: 'w1', role: 'shelf', x0: 225.4, x1: 231, z0: 53, z1: 71, y: 0, h: 7 },
    { id: 'w2', role: 'shelf', x0: 225.3, x1: 229.5, z0: 54, z1: 70, y: 7, h: 7 },
    { id: 'w3', role: 'shelf', x0: 225.2, x1: 228, z0: 55, z1: 69, y: 14, h: 7 },
    { id: 'e1', role: 'shelf', x0: 247, x1: 252.6, z0: 53, z1: 71, y: 0, h: 7 },
    { id: 'e2', role: 'shelf', x0: 248.5, x1: 252.7, z0: 54, z1: 70, y: 7, h: 7 },
    { id: 'e3', role: 'shelf', x0: 250, x1: 252.8, z0: 55, z1: 69, y: 14, h: 7 },
    { id: 'altar', role: 'furniture', x0: 234, x1: 244, z0: 68, z1: 72.6, y: 0, h: 6 },
    { id: 'rubble-1', role: 'furniture', x0: 246, x1: 252.6, z0: 39.45, z1: 45, y: 0, h: 2.2 },
    { id: 'rubble-2', role: 'furniture', x0: 248, x1: 252.6, z0: 45, z1: 48, y: 0, h: 1.2 },
  ],
  routes: [
    { block: 'w1', side: 'e', kind: 'letters', at: 9 }, { block: 'w2', side: 'e', kind: 'letters', at: 8 },
    { block: 'w3', side: 'e', kind: 'letters', at: 7 }, { block: 'e1', side: 'w', kind: 'letters', at: 9 },
    { block: 'e2', side: 'w', kind: 'letters', at: 8 }, { block: 'e3', side: 'w', kind: 'letters', at: 7 },
    { block: 'altar', side: 'n', kind: 'letters', at: 5 },
  ],
  containers: [
    { id: 'ante-vase', type: 'vase', x: 230, y: 0, z: 44 },
    { id: 'shelf-remains', type: 'body', x: 230.25, y: 7, z: 66 },
    { id: 'top-chest', type: 'chest', x: 226.6, y: 21, z: 62 },
    { id: 'east-goods', type: 'grave-goods', x: 249.25, y: 14, z: 62 },
    { id: 'east-cache', type: 'camp-cache', x: 251.4, y: 21, z: 58 },
    { id: 'altar-goods', type: 'grave-goods', x: 239, y: 6, z: 70 },
  ],
  spots: [
    { id: '1', kind: 'hatless', x: 239, y: 0, z: 60 }, { id: '2', kind: 'hatless', x: 233, y: 0, z: 62 },
    { id: '1', kind: 'npc', x: 226.6, y: 21, z: 66 },
  ],
  props: [{ prefab: 'candle', x: 236, y: 6, z: 70 }, { prefab: 'flower-pot', x: 241, y: 6, z: 70 }],
};
