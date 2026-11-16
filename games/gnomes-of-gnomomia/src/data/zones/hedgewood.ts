// Hedgewood: dark hedge forest. The Clippings sawpit (north-east) is a lumber camp with cabins and a mill,
// the hunters' lodge sits in a hollow root at Barkhollow, the Wildlings' tangle surrounds the Elder Privet,
// spider tunnels run under Webhollow, and the paper wasps raise a spire to the west.
// Negative z is north. Houses are kept clear of every region centre.
import type { ZoneDef } from '../../config';

export const ZONE: ZoneDef = {
  id: 'hedgewood',
  name: 'Hedgewood',
  levels: [15, 20],
  half: 120,
  // Arrival from the Birdbath Keep road (no exit applies).
  spawn: { x: -104, z: 104 },
  shrine: { x: 40, z: 40, name: 'the Clippings sawpit' },
  regions: [
    { id: 'clippings', name: 'Clippings', x: 40, z: 40, r: 22 },
    { id: 'barkhollow', name: 'Barkhollow', x: 80, z: -20, r: 16 },
    { id: 'sawdust-mill', name: 'Sawdust Mill', x: 0, z: 60, r: 16 },
    { id: 'webhollow', name: 'Webhollow', x: 60, z: -70, r: 20 },
    { id: 'burdocks-tangle', name: "Burdock's Tangle", x: -40, z: -20, r: 22 },
    { id: 'elder-privet', name: 'The Elder Privet', x: -50, z: -55, r: 14 },
    { id: 'paper-spire', name: 'The Paper Spire', x: -80, z: 40, r: 16 },
    { id: 'cricket-hedge', name: 'Cricket Hedge', x: 20, z: -40, r: 12 },
  ],
  lakes: [],
  houses: [
    // Clippings: ten log cabins in a ring around the sawpit.
    { x: 53.3, z: 44.3, r: 3.5, yaw: -1.88, style: 'log' },
    { x: 48.2, z: 51.3, r: 3.5, yaw: -2.51, style: 'log' },
    { x: 40, z: 54, r: 3.5, yaw: 3.14, style: 'log', id: 'tally-house', interior: { template: 'workshop', name: 'The Tally House', books: ['lch-sawyers-tally-book', 'lch-sawyers-letter'], add: [{ kind: 'bookshelf', x: -5.4, z: 0, yaw: Math.PI / 2 }] } },
    { x: 31.8, z: 51.3, r: 3.5, yaw: 2.51, style: 'log' },
    { x: 26.7, z: 44.3, r: 3.5, yaw: 1.88, style: 'log' },
    { x: 26.7, z: 35.7, r: 3.5, yaw: 1.26, style: 'log' },
    { x: 31.8, z: 28.7, r: 3.5, yaw: 0.63, style: 'log' },
    { x: 40, z: 26, r: 3.5, yaw: 0, style: 'log' },
    { x: 48.2, z: 28.7, r: 3.5, yaw: -0.63, style: 'log' },
    { x: 53.3, z: 35.7, r: 3.5, yaw: -1.26, style: 'log' },
    // Sawdust Mill: three log cabins.
    { x: 7, z: 60, r: 3.5, yaw: -1.57, style: 'log' },
    { x: -3.5, z: 66.1, r: 3.5, yaw: 2.62, style: 'log' },
    { x: -3.5, z: 53.9, r: 3.5, yaw: 0.52, style: 'log' },
    // Barkhollow: the hunters' lodge in a hollow root, with four tents around it.
    { x: 80, z: -30, r: 6, yaw: 0, style: 'log', id: 'hunters-lodge', interior: { template: 'hall', name: "The Hunters' Lodge", books: ['lch-lodge-rules'] } },
    { x: 70, z: -14, r: 3, yaw: 2.11, style: 'tent' },
    { x: 90, z: -12, r: 3, yaw: -2.25, style: 'tent' },
    { x: 66, z: -24, r: 3, yaw: 1.29, style: 'tent' },
    { x: 94, z: -26, r: 3, yaw: -1.17, style: 'tent' },
    // Burdock's Tangle: six tents in a ring.
    { x: -30, z: -20, r: 3, yaw: -1.57, style: 'tent' },
    { x: -35, z: -11.3, r: 3, yaw: -2.62, style: 'tent' },
    { x: -45, z: -11.3, r: 3, yaw: 2.62, style: 'tent' },
    { x: -50, z: -20, r: 3, yaw: 1.57, style: 'tent', id: 'bramble-tent', interior: { template: 'cottage', name: "The Bindweed Tent", books: ['lch-growing-songs', 'lch-bramble-tent-prayer'], add: [{ kind: 'bookshelf', x: -4.4, z: 0, yaw: Math.PI / 2 }] } },
    { x: -45, z: -28.7, r: 3, yaw: 0.52, style: 'tent' },
    { x: -35, z: -28.7, r: 3, yaw: -0.52, style: 'tent' },
    // The Paper Spire: one tall pot.
    { x: -80, z: 52, r: 6, yaw: 3.14, style: 'pot' },
  ],
  theme: { ground: 0x4d6b37, groundAlt: 0x5d7d42, flora: 'hedge', floraDensity: 0.9, fog: 0x6f8a5a, sky: 0x9fb88f, hilliness: 0.8 },
  exits: [
    // Back to the Birdbath Keep (open from the start; the Keep road itself is gated).
    { to: 'keep', x: -110, z: 110, r: 4, arriveX: 52, arriveZ: -52, label: 'Southwest road to Birdbath Keep' },
    // North to the Last Tuft.
    { to: 'verge', x: 0, z: -115, r: 4, arriveX: 60, arriveZ: 100, label: 'North road to the Last Tuft', when: { quest: { id: 'c6-who-holds-the-valve', status: 'done' } } },
  ],
};
