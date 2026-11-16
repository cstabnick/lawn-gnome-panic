// Mossbottom Vale: the starting valley (levels 1-6).
import type { ZoneDef } from '../../config';

export const ZONE: ZoneDef = {
  id: 'mossbottom',
  name: 'Mossbottom Vale',
  levels: [1, 6],
  half: 120,
  spawn: { x: 3, z: 3 },
  shrine: { x: 0, z: 0, name: 'the well in Mossbottom' },
  // Negative z is north. The world builds a dirt road from the shrine to each region.
  regions: [
    { id: 'village', name: 'Mossbottom', x: 0, z: 0, r: 24 },
    { id: 'meadow', name: 'Dewdrop Meadow', x: 45, z: 18, r: 26 },
    { id: 'camp', name: 'Feral Camp', x: -55, z: 20, r: 18 },
    { id: 'barrows', name: 'Beetle Barrows', x: -45, z: -60, r: 20 },
    { id: 'burrow', name: 'Grubthorn\'s Burrow', x: 10, z: -88, r: 14 },
  ],
  // Puddlemere.
  lakes: [{ x: 50, z: -45, r: 20 }],
  // Door faces +z at yaw 0.
  houses: [
    { x: -14, z: -10, r: 3.2, yaw: 0.8, style: 'mushroom' },
    { id: 'schoolroom', x: 13, z: -12, r: 3.6, yaw: -0.7, style: 'mushroom',
      interior: { template: 'library', name: 'The Mossbottom Schoolroom', books: ['lmt-young-gnomes-primer', 'lmt-harvest-songbook'] } },
    { x: -16, z: 10, r: 3.0, yaw: 2.2, style: 'mushroom' },
    { x: 15, z: 11, r: 3.4, yaw: -2.3, style: 'mushroom' },
    { id: 'fernwick-house', x: 0, z: -18, r: 4.0, yaw: 0, style: 'mushroom',
      interior: { template: 'mushroom-home', name: 'Elder Fernwick\'s House', books: ['lmt-fernwick-journal', 'lmt-complaint-to-reeve'] } },
  ],
  // The Mossbottom watchtower: a wood lookout south-east of the well, ramp down to the south.
  decks: [{ x: 6, z: 22, w: 4, d: 4, y: 7, stair: 's', style: 'wood' }],
  theme: { ground: 0x5f9e3f, groundAlt: 0x67a745, flora: 'mushroom', floraDensity: 1, fog: 0x9fd0f0, sky: 0x9fd0f0, hilliness: 1 },
  exits: [
    { to: 'thatchford', x: 10, z: -112, r: 4, arriveX: 0, arriveZ: 105, label: 'North road to Thatchford', when: { quest: { id: 'mole-king', status: 'done' } } },
  ],
};
