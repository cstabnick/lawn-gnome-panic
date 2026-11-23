// The Angel Vault (roadmap 10): a sunken crypt under Angel Square. Door at ground level, railed landing, stair 8 gm
// down to the vault hall (coffin stack, altar) and an ossuary behind two arches. A Hatless lair (SACRED).
import type { BuildingDef } from '../buildingTypes';

export const ANGEL_VAULT: BuildingDef = {
  id: 'angel-vault', name: 'The Angel Vault', region: 'angel-square', style: 'stone',
  footprint: { x0: 160, x1: 188, z0: 188, z1: 212 }, storeys: [-8], sunk: 8,
  shell: { thick: 1, height: 14, openings: [{ id: 'door', side: 'n', at: 12, width: 3, height: 6, door: true }] },
  roof: { thick: 1, eaves: 0.5, ridge: 2 },
  walls: [{ id: 'ossuary-wall', x0: 161.1, x1: 186.9, z0: 204, z1: 205, y: -8, h: 10, openings: [
    { id: 'w-arch', at: 6, width: 3, height: 4 }, { id: 'e-arch', at: 18, width: 3, height: 4 },
  ] }],
  floors: [],
  stairs: [{ id: 'stair', rect: { x0: 170.5, x1: 176.5, z0: 193, z1: 203 }, up: 'n', fromY: -8, toY: -0.1 }],
  boxes: [
    { id: 'landing', role: 'furniture', x0: 170.5, x1: 176.5, z0: 189.1, z1: 193, y: -8, h: 7.9 },
    { id: 'rail-w', role: 'furniture', x0: 170.6, x1: 171, z0: 189.2, z1: 192.9, y: -0.1, h: 1.2 },
    { id: 'rail-e', role: 'furniture', x0: 176, x1: 176.4, z0: 189.2, z1: 192.9, y: -0.1, h: 1.2 },
    { id: 'c1', role: 'shelf', x0: 161.1, x1: 166, z0: 191, z1: 202, y: -8, h: 5 },
    { id: 'c2', role: 'shelf', x0: 161.15, x1: 164, z0: 192, z1: 201, y: -3, h: 5 },
    { id: 'altar', role: 'furniture', x0: 180, x1: 186, z0: 192, z1: 198, y: -8, h: 1.4 },
    { id: 'niche-w', role: 'shelf', x0: 163, x1: 168, z0: 208, z1: 210.9, y: -8, h: 1.4 },
    { id: 'niche-e', role: 'shelf', x0: 178, x1: 183, z0: 208, z1: 210.9, y: -8, h: 1.4 },
  ],
  routes: [{ block: 'c1', side: 'e', kind: 'letters', at: 5 }, { block: 'c2', side: 'e', kind: 'letters', at: 4 }],
  containers: [
    { id: 'altar-chest', type: 'chest', x: 183, y: -6.6, z: 195 },
    { id: 'shelf-remains', type: 'body', x: 165, y: -3, z: 196.5 },
    { id: 'upper-goods', type: 'grave-goods', x: 162.6, y: 2, z: 196.5 },
    { id: 'niche-vase-w', type: 'vase', x: 165.5, y: -6.6, z: 209.5 },
    { id: 'niche-vase-e', type: 'vase', x: 180.5, y: -6.6, z: 209.5 },
    { id: 'ossuary-cache', type: 'camp-cache', x: 173.5, y: -8, z: 207.5 },
  ],
  spots: [
    { id: '1', kind: 'hatless', x: 182, y: -8, z: 201 }, { id: '2', kind: 'hatless', x: 166, y: -8, z: 206.5 },
    { id: '3', kind: 'hatless', x: 184, y: -8, z: 207 },
  ],
  props: [{ prefab: 'candle', x: 181, y: -6.6, z: 193 }, { prefab: 'garden-rock', x: 185, y: -8, z: 202 }],
};
