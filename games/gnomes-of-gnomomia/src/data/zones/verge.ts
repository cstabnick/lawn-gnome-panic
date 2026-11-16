// The Verge: a windswept strip of mown stubble by the Fence. The Last Tuft war camp (south), the Shorn
// (the Even Cut's stubble desert, west), the King's cart, the Level (the Even Cut's square fort, east),
// the Battlefield and the Fence line (north), and the Shed at the far north end.
// Negative z is north. Houses are kept clear of every region centre (edge at least 4 m away).
// The Mower battle area (x -30..30, z -125..-15) holds no houses except the Shed.
import type { ZoneDef } from '../../config';

export const ZONE: ZoneDef = {
  id: 'verge',
  name: 'The Verge',
  levels: [25, 30],
  half: 140,
  // Arrival from the Hedgewood or Rockery roads (no exit applies): the south edge, by the Last Tuft.
  spawn: { x: 60, z: 100 },
  shrine: { x: 0, z: 80, name: 'the Last Tuft banner' },
  regions: [
    { id: 'last-tuft', name: 'Last Tuft', x: 0, z: 80, r: 24 },
    { id: 'shorn', name: 'The Shorn', x: -40, z: 20, r: 40 },
    { id: 'kings-cart', name: "The King's Cart", x: -60, z: -10, r: 8 },
    { id: 'the-level', name: 'The Level', x: 60, z: 0, r: 22 },
    { id: 'battlefield', name: 'The Battlefield', x: 0, z: -60, r: 35 },
    { id: 'fence-line', name: 'The Fence Line', x: 0, z: -100, r: 30 },
    { id: 'the-shed', name: 'The Shed', x: 0, z: -125, r: 14 },
  ],
  lakes: [],
  houses: [
    // The Shed: one huge log house at the far north end (its own region centre is the exception to the 4 m rule).
    { x: 0, z: -125, r: 14, yaw: 0, style: 'log' },
    // Last Tuft: eight tents in a ring round the banner, clear of the shrine.
    { x: 14, z: 80, r: 3, yaw: 0, style: 'tent', id: 'field-hospital', interior: { template: 'tent', name: 'The Glazing Tent', books: ['lrv-glazing-records'], add: [{ kind: 'lectern', x: -1.4, z: 0.8 }] } },
    { x: 9.9, z: 89.9, r: 3, yaw: 0.8, style: 'tent' },
    { x: 0, z: 94, r: 3, yaw: 1.6, style: 'tent' },
    { x: -9.9, z: 89.9, r: 3, yaw: 2.4, style: 'tent' },
    { x: -14, z: 80, r: 3, yaw: 3.14, style: 'tent' },
    { x: -9.9, z: 70.1, r: 3, yaw: -2.4, style: 'tent', id: 'even-cut-chapel', interior: { template: 'chapel', name: 'The Even Cut Chapel', books: ['lrv-even-cut-catechism'] } },
    { x: 0, z: 66, r: 3, yaw: -1.6, style: 'tent', id: 'quartermaster-tent', interior: { template: 'tent', name: "The Quartermaster's Tent", books: ['lrv-quartermaster-roll'], add: [{ kind: 'lectern', x: 1.4, z: -0.4 }] } },
    { x: 9.9, z: 70.1, r: 3, yaw: -0.8, style: 'tent' },
    // Last Tuft: four thatch clumps of tall grass, between the tents.
    { x: 16.63, z: 86.89, r: 2, yaw: 0.4, style: 'thatch' },
    { x: -6.89, z: 96.63, r: 2, yaw: 1.2, style: 'thatch' },
    { x: -16.63, z: 73.11, r: 2, yaw: 2.0, style: 'thatch' },
    { x: 6.89, z: 63.37, r: 2, yaw: -0.4, style: 'thatch' },
    // The Level: four stone houses inside the square fort, clear of the south gap.
    { x: 52, z: -8, r: 3, yaw: 0, style: 'stone' },
    { x: 68, z: -8, r: 3, yaw: 0, style: 'stone' },
    { x: 52, z: 8, r: 3, yaw: 0, style: 'stone' },
    { x: 68, z: 8, r: 3, yaw: 0, style: 'stone' },
  ],
  // The Fence (north edge), and the Level: a square of four walls round (60,0), side 36, with a 6 m gap on its south side.
  walls: [
    { x1: -140, z1: -138, x2: 140, z2: -138 },
    { x1: 42, z1: -18, x2: 78, z2: -18 },
    { x1: 42, z1: -18, x2: 42, z2: 18 },
    { x1: 78, z1: -18, x2: 78, z2: 18 },
    { x1: 42, z1: 18, x2: 57, z2: 18 },
    { x1: 63, z1: 18, x2: 78, z2: 18 },
  ],
  // The Last Tuft lookout: a wood tower on the camp's east side, ramp down to the east.
  decks: [{ x: 16, z: 74, w: 4, d: 4, y: 9, stair: 'e', style: 'wood' }],
  theme: { ground: 0xb8a868, groundAlt: 0xc9b97a, flora: 'stubble', floraDensity: 0.6, fog: 0xd8cfa8, sky: 0xbfc7cf, hilliness: 0.2 },
  exits: [
    // South to Hedgewood.
    { to: 'hedgewood', x: 60, z: 136, r: 4, arriveX: 0, arriveZ: -108, label: 'South road to Hedgewood' },
    // South-west to the Rockery.
    { to: 'rockery', x: -80, z: 136, r: 4, arriveX: -60, arriveZ: -108, label: 'South road to the Rockery' },
  ],
};
