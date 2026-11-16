// Birdbath Keep: the capital. The castle is cut into the birdbath pedestal (north), the Basin lake
// sits on its rim, Pedestal Ward is the town around the base (south), and the stairs go down to the Deeps.
// Negative z is north.
import type { ZoneDef } from '../../config';

export const ZONE: ZoneDef = {
  id: 'keep',
  name: 'Birdbath Keep',
  levels: [10, 14],
  half: 80,
  spawn: { x: 0, z: 62 },
  shrine: { x: 0, z: 20, name: 'the Pedestal Ward shrine' },
  regions: [
    { id: 'pedestal', name: 'The Pedestal', x: 0, z: -30, r: 22 },
    { id: 'pedestal-ward', name: 'Pedestal Ward', x: 0, z: 25, r: 24 },
    { id: 'archive', name: 'The Archive', x: -18, z: -28, r: 6 },
    { id: 'throne-hall', name: 'Throne Hall', x: 0, z: -34, r: 6 },
    { id: 'robin-roost', name: 'Robin Roost', x: 22, z: -46, r: 6 },
    { id: 'deeps-stairs', name: 'Deeps Stairs', x: -30, z: 30, r: 4 },
    { id: 'guild-halls', name: 'Guild Halls', x: 25, z: 25, r: 8 },
  ],
  // The Basin: the royal lake on the pedestal rim.
  lakes: [{ x: 0, z: -50, r: 10 }],
  // Door yaw points at the centre of each group (yaw 0 faces +z).
  houses: [
    // Guild halls of the three charters.
    { x: 21, z: 31, r: 5.5, yaw: 2.55, style: 'stone' },
    { x: 30, z: 21, r: 5, yaw: -0.9, style: 'stone' },
    { x: 29, z: 30, r: 5, yaw: -2.47, style: 'stone' },
    // The castle: the stone keep on the pedestal, ringed by five stone houses.
    { x: 0, z: -30, r: 10, yaw: 0, style: 'stone' },
    { x: 21, z: -30, r: 7, yaw: -1.57, style: 'stone' },
    { x: 13.2, z: -13.7, r: 6, yaw: -2.46, style: 'stone' },
    { x: -4.4, z: -9.5, r: 8, yaw: 2.93, style: 'stone' },
    { x: -18.7, z: -20.5, r: 6.5, yaw: 2.04, style: 'stone' },
    { x: -19.2, z: -38.5, r: 7, yaw: 1.15, style: 'stone' },
    // Pedestal Ward: fourteen stone and thatch houses, clear of the shrine.
    { x: 12, z: 25, r: 3.4, yaw: -1.57, style: 'stone' },
    { x: 10.6, z: 32.5, r: 3, yaw: -2.19, style: 'thatch' },
    { x: 11.4, z: 40.2, r: 3.4, yaw: -2.5, style: 'stone' },
    { x: 7.8, z: 47.7, r: 3, yaw: -2.81, style: 'thatch' },
    { x: 0, z: 37, r: 3.4, yaw: 3.14, style: 'stone' },
    { x: -5.9, z: 43.1, r: 3, yaw: 2.83, style: 'thatch' },
    { x: -13.5, z: 43.6, r: 3.4, yaw: 2.51, style: 'stone' },
    { x: -9.8, z: 31.9, r: 3, yaw: 2.18, style: 'thatch' },
    { x: -18.2, z: 30.6, r: 3.4, yaw: 1.87, style: 'stone' },
    { x: -23, z: 24.6, r: 3, yaw: 1.55, style: 'thatch' },
    { x: -13.2, z: 20.2, r: 3.4, yaw: 1.22, style: 'stone' },
    { x: -15.8, z: 12.7, r: 3, yaw: 0.91, style: 'thatch' },
    { x: -13.4, z: 5.1, r: 3.4, yaw: 0.59, style: 'stone' },
    { x: -4.7, z: 7.6, r: 3, yaw: 0.26, style: 'thatch' },
    // The Robin Roost, a tent on the Basin rim.
    { x: 22, z: -46, r: 3, yaw: -1.57, style: 'tent' },
  ],
  theme: { ground: 0x8c9a6e, groundAlt: 0xa2a48a, flora: 'grass', floraDensity: 0.15, fog: 0xd9dccf, sky: 0xc6dcef, hilliness: 0.4 },
  exits: [
    { to: 'thatchford', x: 0, z: 76, r: 4, arriveX: 0, arriveZ: -105, label: 'South road to Thatchford' },
    { to: 'deeps', x: -30, z: 32, r: 4, arriveX: 0, arriveZ: 92, label: 'Stairs down to the Drainpipe Deeps', when: { questAtLeast: { id: 'c3-into-the-gutters', stage: 0 } } },
    { to: 'cloverfield', x: -76, z: 0, r: 4, arriveX: 118, arriveZ: 0, label: 'West road to Cloverfield', when: { quest: { id: 'c3-ledger', status: 'done' } } },
    { to: 'hedgewood', x: 56, z: -56, r: 4, arriveX: -104, arriveZ: 104, label: 'Northeast road to the Hedgewood', when: { quest: { id: 'c4-great-haul', status: 'done' } } },
    { to: 'rockery', x: -56, z: -56, r: 4, arriveX: 104, arriveZ: 104, label: 'Northwest road to the Rockery', when: { quest: { id: 'c5-heartwood', status: 'done' } } },
  ],
};
