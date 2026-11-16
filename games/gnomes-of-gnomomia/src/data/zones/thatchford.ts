// Thatchford Downs: the market town at the ford on the Hose (levels 6-11).
import type { ZoneDef } from '../../config';

export const ZONE: ZoneDef = {
  id: 'thatchford',
  name: 'Thatchford Downs',
  levels: [6, 11],
  half: 120,
  spawn: { x: -4, z: 104 },
  shrine: { x: 0, z: 0, name: 'the Thatchford fountain' },
  // Negative z is north.
  regions: [
    { id: 'thatchford-town', name: 'Thatchford', x: 0, z: 0, r: 28 },
    { id: 'hose-banks', name: 'The Hose banks', x: -40, z: 20, r: 22 },
    { id: 'spinning-fountains', name: 'The Spinning Fountains', x: -55, z: -35, r: 24 },
    { id: 'crowfoot-hill', name: 'Crowfoot Hill', x: 60, z: -40, r: 20 },
    { id: 'compost-heap', name: 'The Compost Heap', x: 65, z: 45, r: 18 },
    { id: 'neat-chapel', name: 'The Neat Chapel', x: 35, z: 10, r: 14 },
    { id: 'long-bank', name: 'The Long Bank', x: 35, z: -15, r: 10 },
    { id: 'tipsy-toadstool', name: 'The Tipsy Toadstool', x: -8, z: 6, r: 4 },
    { id: 'guildhall', name: 'Guildhall', x: 10, z: -10, r: 5 },
    { id: 'mill', name: 'The Mill', x: -15, z: -20, r: 5 },
  ],
  // The Hose: the river runs north-south. The dry gap at z≈0 is the ford.
  lakes: [
    { x: -6, z: -80, r: 10 },
    { x: -4, z: -50, r: 10 },
    { x: -2, z: -25, r: 9 },
    { x: 4, z: 30, r: 9 },
    { x: 8, z: 60, r: 10 },
    { x: 10, z: 95, r: 10 },
  ],
  // Thatch houses on both banks around the town. The ford corridor (|z| < 7, |x| < 14) and the
  // 8 m ring around the fountain stay clear. Named buildings sit at their region centres.
  houses: [
    // Named buildings.
    { x: -10, z: 14, r: 5, yaw: 2.9, style: 'thatch' },     // Tipsy Toadstool
    { x: 10, z: -17, r: 5, yaw: 0, style: 'stone' },   // guildhall
    { x: -19, z: -24, r: 4, yaw: 0.79, style: 'log' },     // mill
    { x: 41, z: 8, r: 4, yaw: -1.25, style: 'pot' },      // neat chapel
    // West bank.
    { x: -16, z: -6, r: 3.2, yaw: 0.6, style: 'thatch' },
    { x: -26, z: 6, r: 3.4, yaw: 1.2, style: 'thatch' },
    { x: -24, z: 16, r: 3.0, yaw: 2.0, style: 'thatch' },
    { x: -14, z: 14, r: 3.2, yaw: 2.6, style: 'thatch' },
    { x: -18, z: 26, r: 3.0, yaw: 2.2, style: 'thatch' },
    { x: -26, z: -14, r: 3.4, yaw: 0.9, style: 'thatch' },
    { x: -24, z: -28, r: 3.2, yaw: 0.3, style: 'thatch' },
    { x: -10, z: 24, r: 3.0, yaw: 2.8, style: 'thatch' },
    { x: -30, z: -4, r: 3.0, yaw: 1.6, style: 'thatch' },
    { x: -12, z: -34, r: 3.0, yaw: 0.2, style: 'thatch' },
    { x: -34, z: 8, r: 3.0, yaw: 1.4, style: 'thatch' },
    { x: -4, z: 16, r: 3.0, yaw: 2.9, style: 'thatch' },
    // East bank.
    { x: 18, z: -20, r: 3.2, yaw: -0.6, style: 'thatch' },
    { x: 22, z: -4, r: 3.4, yaw: -1.0, style: 'thatch' },
    { x: 22, z: 10, r: 3.0, yaw: -2.0, style: 'thatch' },
    { x: 12, z: 18, r: 3.2, yaw: -2.4, style: 'thatch' },
    { x: 12, z: -30, r: 3.0, yaw: -0.4, style: 'thatch' },
    { x: 24, z: 22, r: 3.4, yaw: -2.8, style: 'thatch' },
    { x: 30, z: 0, r: 3.0, yaw: -1.2, style: 'thatch' },
    { x: 28, z: -24, r: 3.0, yaw: -0.9, style: 'thatch' },
    { x: 16, z: 6, r: 3.0, yaw: -1.8, style: 'thatch' },
  ],
  theme: { ground: 0x7fa553, groundAlt: 0x96b866, flora: 'grass', floraDensity: 0.5, fog: 0xcfe3c0, sky: 0xbfdcf0, hilliness: 1.2 },
  exits: [
    { to: 'mossbottom', x: 0, z: 112, r: 4, arriveX: 10, arriveZ: -105, label: 'South road to Mossbottom' },
    { to: 'keep', x: 0, z: -112, r: 4, arriveX: 0, arriveZ: 70, label: 'North road to Birdbath Keep', when: { quest: { id: 'c2-letter-for-the-queen', status: 'done' } } },
  ],
};
