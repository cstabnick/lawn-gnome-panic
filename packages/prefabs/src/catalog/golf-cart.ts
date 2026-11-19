// Gnome Golf riding-mower golf carts.
import type { PrefabDef } from '../types';

export const GOLF_CART: readonly PrefabDef[] = [
  {
    id: 'golf-cart', name: 'Golf Cart', category: 'prop', uses: ['place', 'sit'],
    footprint: { r: 1.15, h: 0.9 },
    tags: ['cart', 'golf', 'buggy', 'mower', 'vehicle', 'seat', 'two-seat'], emoji: [],
    tint: 0xd8342c, seat: [0.32, 0.75, -0.1],
    about: 'The two-seat golf cart: a riding mower with a red tub, cream hood, bench seat, canopy and a golf bag behind the seat. Tint sets the body colour.',
    examine: [
      'A red tub on four fat wheels, with a cream hood and a canopy that keeps off the worst of the sky.',
      'Gnomes call it a chariot. The Tall Ones called it something else, and the Charters do not say what.',
      'The wheel with the yellow stripe is the one that always leads.',
      'Hold on to the wheel, not the golf bag. The bag does not steer.',
      'Someone has tucked three clubs into the bag and nobody will admit to losing a fourth.',
    ],
    parts: [
      { s: 'box', d: [1.3, 0.4, 1.2], at: [0, 0.4, -0.5], c: 'tint' },                 // rear tub
      { s: 'box', d: [1.3, 0.3, 0.3], at: [0, 0.35, 0.25], c: 'tint' },                // front connector
      { s: 'box', d: [1.0, 0.2, 0.8], at: [0, 0.45, 0.75], c: 0xf3e6c4 },              // cream hood
      { s: 'box', d: [1.1, 0.14, 1.0], at: [0, 0.12, 0.1], c: 0x222222 },              // mower deck
      { s: 'box', d: [1.1, 0.12, 0.6], at: [0, 0.69, -0.25], c: 0x3a3a3a },            // bench seat
      { s: 'box', d: [1.2, 0.55, 0.1], at: [0, 0.99, -0.6], c: 0x3a3a3a },             // backrest
      { s: 'cyl', d: [0.03, 0.03, 0.39], rot: [25.78, 0, 0], at: [0.32, 0.925, 0.035], c: 0x8a9399, seg: 8 }, // steering column
      { s: 'ring', d: [0.16, 0.025], rot: [-25.78, 0, 0], at: [0.32, 1.1, 0.12], c: 0x222222 }, // steering wheel
      { s: 'box', d: [1.5, 0.08, 1.6], at: [0, 2.06, -0.25], c: 0xffffff },            // canopy
      { s: 'cyl', d: [0.025, 0.025, 1.35], at: [-0.7, 1.425, -1.0], c: 0x8a9399, seg: 6 }, // canopy posts
      { s: 'cyl', d: [0.025, 0.025, 1.35], at: [0.7, 1.425, -1.0], c: 0x8a9399, seg: 6 },
      { s: 'cyl', d: [0.025, 0.025, 1.35], at: [-0.7, 1.425, 0.5], c: 0x8a9399, seg: 6 },
      { s: 'cyl', d: [0.025, 0.025, 1.35], at: [0.7, 1.425, 0.5], c: 0x8a9399, seg: 6 },
      { s: 'cyl', d: [0.14, 0.14, 0.8], at: [-0.3, 1.0, -0.85], c: 0x9c6b3c },           // golf bag
      { s: 'cyl', d: [0.012, 0.012, 0.7], at: [-0.36, 1.45, -0.88], c: 0x8a9399, seg: 6 }, // club 1
      { s: 'box', d: [0.06, 0.04, 0.12], at: [-0.36, 1.82, -0.88], c: 0x444444 },
      { s: 'cyl', d: [0.012, 0.012, 0.7], at: [-0.28, 1.45, -0.8], c: 0x8a9399, seg: 6 }, // club 2
      { s: 'box', d: [0.06, 0.04, 0.12], at: [-0.28, 1.82, -0.8], c: 0x444444 },
      { s: 'cyl', d: [0.012, 0.012, 0.7], at: [-0.23, 1.45, -0.87], c: 0x8a9399, seg: 6 }, // club 3
      { s: 'box', d: [0.06, 0.04, 0.12], at: [-0.23, 1.82, -0.87], c: 0x444444 },
      // Wheels: rear pair (r 0.3), front pair (r 0.2). Each wheel is a pivot at its centre.
      { s: 'cyl', d: [0.3, 0.3, 0.18], rot: [0, 0, 90], at: [-0.7, 0.3, -0.85], c: 0x1a1a1a, seg: 14, group: 'wheel-0' },
      { s: 'box', d: [0.2, 0.05, 0.05], at: [-0.7, 0.3, -0.61], c: 0xf2c230, group: 'wheel-0' },
      { s: 'cyl', d: [0.3, 0.3, 0.18], rot: [0, 0, 90], at: [0.7, 0.3, -0.85], c: 0x1a1a1a, seg: 14, group: 'wheel-1' },
      { s: 'box', d: [0.2, 0.05, 0.05], at: [0.7, 0.3, -0.61], c: 0xf2c230, group: 'wheel-1' },
      { s: 'cyl', d: [0.2, 0.2, 0.16], rot: [0, 0, 90], at: [-0.68, 0.2, 0.85], c: 0x1a1a1a, seg: 14, group: 'wheel-2' },
      { s: 'box', d: [0.18, 0.05, 0.05], at: [-0.68, 0.2, 1.01], c: 0xf2c230, group: 'wheel-2' },
      { s: 'cyl', d: [0.2, 0.2, 0.16], rot: [0, 0, 90], at: [0.68, 0.2, 0.85], c: 0x1a1a1a, seg: 14, group: 'wheel-3' },
      { s: 'box', d: [0.18, 0.05, 0.05], at: [0.68, 0.2, 1.01], c: 0xf2c230, group: 'wheel-3' },
    ],
    pivots: {
      'wheel-0': [-0.7, 0.3, -0.85],
      'wheel-1': [0.7, 0.3, -0.85],
      'wheel-2': [-0.68, 0.2, 0.85],
      'wheel-3': [0.68, 0.2, 0.85],
    },
  },
  {
    id: 'golf-cart-4', name: 'Four-seat Golf Cart', category: 'prop', uses: ['place', 'sit'],
    tags: ['cart', 'golf', 'buggy', 'mower', 'vehicle', 'seat', 'four-seat', 'convoy'], emoji: [],
    tint: 0xd8342c, seat: [0.33, 0.75, -0.2],
    about: 'The four-seat golf cart: a longer red tub with a front bench, a backward-facing rear bench, a long canopy and golf bags on both sides. Tint sets the body colour.',
    examine: [
      'Twice the seats of the small cart and twice the arguments about who gets the front.',
      'The rear bench faces backwards, so the passengers there can watch where they have been.',
      'Old saying: a cart with four seats is a cart with four opinions.',
      'The canopy is long enough for four gnomes and one very large hat.',
      'Each side carries a golf bag. The left bag is always heavier, and nobody knows why.',
    ],
    parts: [
      { s: 'box', d: [1.3, 0.4, 1.0], at: [0, 0.4, -1.0], c: 'tint' },                 // rear tub
      { s: 'box', d: [1.3, 0.4, 0.6], at: [0, 0.4, -0.2], c: 'tint' },                 // middle tub
      { s: 'box', d: [1.3, 0.3, 0.3], at: [0, 0.35, 0.3], c: 'tint' },                 // front connector
      { s: 'box', d: [1.1, 0.2, 0.6], at: [0, 0.45, 0.85], c: 0xf3e6c4 },              // cream hood
      { s: 'box', d: [1.2, 0.14, 1.0], at: [0, 0.12, 0], c: 0x222222 },                // mower deck
      { s: 'box', d: [1.2, 0.12, 0.5], at: [0, 0.69, -0.2], c: 0x3a3a3a },             // front bench
      { s: 'box', d: [1.2, 0.55, 0.1], at: [0, 0.99, -0.52], c: 0x3a3a3a },            // backrest
      { s: 'box', d: [1.2, 0.12, 0.5], at: [0, 0.69, -0.95], c: 0x3a3a3a },            // rear bench
      { s: 'box', d: [1.1, 0.05, 0.24], at: [0, 0.63, -1.37], c: 0x222222 },           // footrest
      { s: 'cyl', d: [0.03, 0.03, 0.39], rot: [25.78, 0, 0], at: [0.33, 0.925, 0.185], c: 0x8a9399, seg: 8 }, // steering column
      { s: 'ring', d: [0.16, 0.025], rot: [-25.78, 0, 0], at: [0.33, 1.1, 0.265], c: 0x222222 }, // steering wheel
      { s: 'box', d: [1.5, 0.08, 2.1], at: [0, 2.06, -0.4], c: 0xffffff },             // canopy
      { s: 'cyl', d: [0.025, 0.025, 1.35], at: [-0.68, 1.425, -1.3], c: 0x8a9399, seg: 6 }, // canopy posts
      { s: 'cyl', d: [0.025, 0.025, 1.35], at: [0.68, 1.425, -1.3], c: 0x8a9399, seg: 6 },
      { s: 'cyl', d: [0.025, 0.025, 1.35], at: [-0.68, 1.425, 0.5], c: 0x8a9399, seg: 6 },
      { s: 'cyl', d: [0.025, 0.025, 1.35], at: [0.68, 1.425, 0.5], c: 0x8a9399, seg: 6 },
      { s: 'cyl', d: [0.1, 0.1, 0.8], at: [-0.7, 0.9, -0.6], c: 0x9c6b3c },            // left golf bag
      { s: 'cyl', d: [0.012, 0.012, 0.6], at: [-0.7, 1.45, -0.6], c: 0x8a9399, seg: 6 }, // left club
      { s: 'cyl', d: [0.1, 0.1, 0.8], at: [0.7, 0.9, -0.6], c: 0x9c6b3c },             // right golf bag
      { s: 'cyl', d: [0.012, 0.012, 0.6], at: [0.7, 1.45, -0.6], c: 0x8a9399, seg: 6 }, // right club
      // Wheels: rear pair (r 0.3), front pair (r 0.2). Each wheel is a pivot at its centre.
      { s: 'cyl', d: [0.3, 0.3, 0.18], rot: [0, 0, 90], at: [-0.68, 0.3, -1.05], c: 0x1a1a1a, seg: 14, group: 'wheel-0' },
      { s: 'box', d: [0.2, 0.05, 0.05], at: [-0.68, 0.3, -0.81], c: 0xf2c230, group: 'wheel-0' },
      { s: 'cyl', d: [0.3, 0.3, 0.18], rot: [0, 0, 90], at: [0.68, 0.3, -1.05], c: 0x1a1a1a, seg: 14, group: 'wheel-1' },
      { s: 'box', d: [0.2, 0.05, 0.05], at: [0.68, 0.3, -0.81], c: 0xf2c230, group: 'wheel-1' },
      { s: 'cyl', d: [0.2, 0.2, 0.16], rot: [0, 0, 90], at: [-0.66, 0.2, 0.9], c: 0x1a1a1a, seg: 14, group: 'wheel-2' },
      { s: 'box', d: [0.18, 0.05, 0.05], at: [-0.66, 0.2, 1.06], c: 0xf2c230, group: 'wheel-2' },
      { s: 'cyl', d: [0.2, 0.2, 0.16], rot: [0, 0, 90], at: [0.66, 0.2, 0.9], c: 0x1a1a1a, seg: 14, group: 'wheel-3' },
      { s: 'box', d: [0.18, 0.05, 0.05], at: [0.66, 0.2, 1.06], c: 0xf2c230, group: 'wheel-3' },
    ],
    pivots: {
      'wheel-0': [-0.68, 0.3, -1.05],
      'wheel-1': [0.68, 0.3, -1.05],
      'wheel-2': [-0.66, 0.2, 0.9],
      'wheel-3': [0.66, 0.2, 0.9],
    },
  },
];
