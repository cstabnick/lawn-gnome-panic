// Cloverfield: the flattest land in Fescue, a farm country of Sodbury, ranches and anthills (levels 11-16).
import type { ZoneDef } from '../../config';

export const ZONE: ZoneDef = {
  id: 'cloverfield',
  name: 'Cloverfield',
  levels: [11, 16],
  half: 130,
  spawn: { x: 0, z: 10 },
  shrine: { x: 0, z: 0, name: 'the Sodbury pump' },
  // Negative z is north.
  regions: [
    { id: 'sodbury', name: 'Sodbury', x: 0, z: 0, r: 26 },
    { id: 'granary', name: 'The Granary', x: 10, z: -16, r: 6 },
    { id: 'honeydew-ranch', name: 'Honeydew Ranch', x: -60, z: -40, r: 22 },
    { id: 'snail-pens', name: 'The Snail Pens', x: 25, z: 30, r: 12 },
    { id: 'pettigrew-ranch', name: 'Pettigrew Ranch', x: -70, z: 40, r: 18 },
    { id: 'red-anthills', name: 'The Red Anthills', x: 50, z: 60, r: 24 },
    { id: 'scarecrow-rise', name: 'Scarecrow Rise', x: -60, z: 95, r: 18 },
    { id: 'crows-perch', name: "Crow's Perch", x: 80, z: -70, r: 16 },
  ],
  lakes: [
    { x: 30, z: -60, r: 10 },
  ],
  // Sodbury: a ring of thatch houses round the pump, with the granary kept clear on the north-east.
  // Farmhouses: logs at the two ranches, tents at the snail pens.
  houses: [
    // Sodbury ring.
    { x: 15.7, z: 3.2, r: 3.2, yaw: 0.4, style: 'thatch', id: 'seed-packet', interior: { template: 'shop', name: 'The Seed Packet', books: ['lch-seed-order-book'], add: [{ kind: 'bookshelf', x: -4.4, z: 0, yaw: Math.PI / 2 }] } },
    { x: 12.7, z: 9.7, r: 3.2, yaw: 1.0, style: 'thatch' },
    { x: 7.3, z: 14.2, r: 3.2, yaw: 1.6, style: 'thatch' },
    { x: 0.4, z: 16, r: 3.2, yaw: 2.2, style: 'thatch' },
    { x: -6.6, z: 14.6, r: 3.2, yaw: 2.6, style: 'thatch' },
    { x: -12.3, z: 10.3, r: 3.2, yaw: 2.9, style: 'thatch' },
    { x: -15.5, z: 3.9, r: 3.2, yaw: -2.9, style: 'thatch' },
    { x: -15.7, z: -3.2, r: 3.2, yaw: -2.4, style: 'thatch' },
    { x: -12.7, z: -9.7, r: 3.2, yaw: -1.9, style: 'thatch' },
    { x: -7.3, z: -14.2, r: 3.2, yaw: -1.4, style: 'thatch' },
    { x: -0.4, z: -16, r: 3.2, yaw: -0.9, style: 'thatch' },
    { x: 15.5, z: -3.9, r: 3.2, yaw: -0.4, style: 'thatch' },
    // Sodbury outskirts.
    { x: 11.5, z: 19.9, r: 3.2, yaw: 1.2, style: 'thatch', id: 'schoolhouse', interior: { template: 'hall', name: 'Sodbury Schoolhouse', books: ['lch-young-gnome-primer'] } },
    { x: -19.9, z: 11.5, r: 3.2, yaw: 2.4, style: 'thatch' },
    // The granary.
    { x: 10, z: -16, r: 5, yaw: 0.3, style: 'pot' },
    // Honeydew Ranch: four logs.
    { x: -68, z: -46, r: 3.0, yaw: 0.6, style: 'log' },
    { x: -52, z: -46, r: 3.0, yaw: -0.6, style: 'log' },
    { x: -66, z: -32, r: 3.0, yaw: 1.4, style: 'log' },
    { x: -54, z: -34, r: 3.0, yaw: -1.4, style: 'log' },
    // Pettigrew Ranch: three logs.
    { x: -78, z: 34, r: 3.0, yaw: 0.8, style: 'log' },
    { x: -62, z: 40, r: 3.0, yaw: 2.0, style: 'log', id: 'pettigrew-farmhouse', interior: { template: 'cottage', name: 'Pettigrew Farmhouse', books: ['lch-pettigrew-diary'] } },
    { x: -72, z: 50, r: 3.0, yaw: -1.0, style: 'log' },
    // Snail Pens: two tents.
    { x: 20, z: 27, r: 2.6, yaw: 0.5, style: 'tent' },
    { x: 30, z: 34, r: 2.6, yaw: -2.2, style: 'tent' },
  ],
  theme: { ground: 0x8fb85a, groundAlt: 0xa6c86e, flora: 'clover', floraDensity: 0.7, fog: 0xe8eccf, sky: 0xcfe6f5, hilliness: 0.15 },
  exits: [
    { to: 'keep', x: 126, z: 50, r: 4, arriveX: -70, arriveZ: 0, label: 'East road to Birdbath Keep' },
  ],
};
