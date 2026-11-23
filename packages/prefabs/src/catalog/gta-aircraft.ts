// Gnome Theft Auto: the three flying craft (Air and Sea) and the two achievement gear items for them.
// Vehicles are modelled life-size in game metres, nose +z, lowest point at y = 0. The game spins the groups by name
// (prop, rotor, tail-rotor, wheel-0..3).
import type { DamageStage, PrefabDef } from '../types';

const HEDGE_RED = 0xc8342c;
const SEED_OLIVE = 0x8a9a3c;
const DANDELION_WHITE = 0xf4f1e6;

const HEDGE_HOPPER_DAMAGE: readonly DamageStage[] = [
  {
    name: 'dented', darken: 0.25,
    morph: { wing: { rot: [0, 0, 6] } },
    add: [{ s: 'box', d: [0.3, 0.2, 0.02], at: [0.455, 0.7, -1.7], c: 'black' }],
  },
  {
    name: 'wrecked', darken: 0.6, sink: 0.02,
    hide: ['wheel-1'],
    morph: { fin: { rot: [0, 0, -12] } },
    add: [
      { s: 'ball', d: [0.2], at: [0.3, 1.35, -0.6], c: 'slate', alpha: 0.6, seg: 6 },
      { s: 'ball', d: [0.26], at: [0.45, 1.6, -0.9], c: 'slate', alpha: 0.6, seg: 6 },
    ],
  },
];

const SYCAMORE_COPTER_DAMAGE: readonly DamageStage[] = [
  {
    name: 'dented', darken: 0.25,
    morph: { boom: { rot: [0, 0, 3] } },
    add: [{ s: 'ball', d: [0.12], at: [0.85, 1.25, 0.2], c: 'black', seg: 6 }],
  },
  {
    name: 'wrecked', darken: 0.6, sink: 0.02,
    hide: ['tail-rotor'],
    morph: { boom: { rot: [0, 0, 14] } },
    add: [
      { s: 'ball', d: [0.2], at: [0.3, 2.2, 0.3], c: 'slate', alpha: 0.6, seg: 6 },
      { s: 'ball', d: [0.26], at: [0.5, 2.5, 0.1], c: 'slate', alpha: 0.6, seg: 6 },
    ],
  },
];

const DANDELION_DRIFTER_DAMAGE: readonly DamageStage[] = [
  {
    name: 'dented', darken: 0.25,
    add: [{ s: 'ball', d: [0.35], at: [1.2, 4.0, 1.5], scale: [1, 0.35, 1], c: 'stone-dark', seg: 6 }],
  },
  {
    name: 'wrecked', darken: 0.6, sink: 0.02,
    hide: ['flame', 'burner'],
    morph: { envelope: { at: [0, -0.4, 0], scale: [1, 0.9, 1] } },
    add: [
      { s: 'ball', d: [0.3], at: [1.6, 6.9, 0.8], c: 'slate', alpha: 0.6, seg: 6 },
      { s: 'ball', d: [0.22], at: [2.2, 7.4, 0.4], c: 'slate', alpha: 0.6, seg: 6 },
    ],
  },
];

export const GTA_AIRCRAFT: readonly PrefabDef[] = [
  {
    id: 'hedge-hopper', name: 'Hedge-Hopper', category: 'prop', uses: ['place', 'sit'],
    damage: HEDGE_HOPPER_DAMAGE,
    tags: ['plane', 'aircraft', 'monoplane', 'sport', 'red', 'propeller', 'flying', 'hedge', 'cockpit', 'seat'], emoji: [],
    tint: HEDGE_RED,
    seat: [0, 0.75, -0.2],
    pivots: {
      prop: [0, 0.7, 2.1],
      'wheel-0': [-0.9, 0.25, 0.4], 'wheel-1': [0.9, 0.25, 0.4],
      'wheel-2': [-0.15, 0.1, -2.3], 'wheel-3': [0.15, 0.1, -2.3],
    },
    about: 'Gnome Theft Auto: the Hedge-Hopper. A small red two-seat low-wing sport monoplane with a cream stripe, an open cockpit, a propeller on the nose (group prop), two main wheels (wheel-0, wheel-1) and two small tail wheels (wheel-2, wheel-3). Nose toward +z, lowest point at y 0. Span 6 at scale 1. Tint sets the body, wing and tail. Seat top at [0, 0.75, -0.2].',
    examine: [
      'A small red plane with a cream stripe down its side, two open seats behind a low wing, and a propeller that never quite stops humming.',
      'Saying from the Verge: a plane that hops hedges has never once been asked to clear a fence, and the fence has never once asked why.',
      'Tip: stall it over the top of the hedge, not over the Spigot. The Spigot is tall, and the splash is not forgiving.',
      'Joke: the pilot says it flies very quickly, and the mechanic says that is only because it is falling in a very organised way.',
      'Someone has painted a small white hedge on the tail, with a tiny gate in the middle. Nobody has worked out which side is in.',
    ],
    parts: [
      { s: 'box', d: [0.9, 0.8, 1.4], at: [0, 0.7, -1.9], c: 'tint', name: 'body' },                     // rear fuselage (y 0.3 to 1.1)
      { s: 'box', d: [0.9, 0.2, 2.2], at: [0, 0.4, -0.1], c: 'tint' },                                   // cockpit floor (top 0.5)
      { s: 'box', d: [0.08, 0.6, 2.2], at: [0.41, 0.8, -0.1], c: 'tint', mirror: true },                 // cockpit side walls
      { s: 'cyl', d: [0.36, 0.44, 1.0], rot: [90, 0, 0], at: [0, 0.7, 1.5], c: 'tint', seg: 10 },        // nose (z 1.0 to 2.0)
      { s: 'box', d: [0.5, 0.25, 0.45], at: [0, 0.625, -0.2], c: 'black' },                              // seat (top 0.75)
      { s: 'box', d: [0.5, 0.25, 0.45], at: [0, 0.625, -0.95], c: 'black' },                             // rear seat (top 0.75)
      { s: 'box', d: [0.7, 0.3, 0.03], at: [0, 1.1, 0.8], rot: [-25, 0, 0], c: 'glass', alpha: 0.5 },    // small windscreen
      { s: 'box', d: [6.0, 0.08, 1.1], at: [0, 0.4, 0], c: 'tint', name: 'wing' },                       // low wing, span 6 (top 0.44, clear of the cockpit floor and walls)
      { s: 'box', d: [0.02, 0.1, 1.4], at: [0.475, 0.6, -1.9], c: 'cloth', mirror: true },               // cream stripe (proud of the body side by 2 cm)
      { s: 'box', d: [0.06, 0.5, 0.8], at: [0, 1.35, -2.4], c: 'tint', name: 'fin' },                     // fin
      { s: 'box', d: [2.0, 0.05, 0.5], at: [0, 0.95, -2.4], c: 'tint' },                                  // tail plane, span 2
      { s: 'box', d: [1.9, 0.06, 0.08], at: [0, 0.3, 0.4], c: 'iron-dark' },                              // landing gear beam
      { s: 'cyl', d: [0.25, 0.25, 0.14], rot: [0, 0, 90], at: [-0.9, 0.25, 0.4], c: 'black', seg: 12, group: 'wheel-0' }, // main wheel, left
      { s: 'cyl', d: [0.25, 0.25, 0.14], rot: [0, 0, 90], at: [0.9, 0.25, 0.4], c: 'black', seg: 12, group: 'wheel-1' },  // main wheel, right
      { s: 'box', d: [0.04, 0.2, 0.04], at: [0.15, 0.2, -2.3], c: 'iron-dark', mirror: true },            // tail wheel strut
      { s: 'cyl', d: [0.1, 0.1, 0.06], rot: [0, 0, 90], at: [-0.15, 0.1, -2.3], c: 'black', seg: 8, group: 'wheel-2' }, // tail wheel, left
      { s: 'cyl', d: [0.1, 0.1, 0.06], rot: [0, 0, 90], at: [0.15, 0.1, -2.3], c: 'black', seg: 8, group: 'wheel-3' },  // tail wheel, right
      { s: 'box', d: [0.08, 0.62, 0.05], at: [0, 1.01, 2.1], c: 'iron-dark', group: 'prop' },             // propeller blade, upper
      { s: 'box', d: [0.08, 0.62, 0.05], at: [0, 0.39, 2.1], c: 'iron-dark', group: 'prop' },             // propeller blade, lower
      { s: 'ball', d: [0.06], at: [0, 0.7, 2.1], c: 'iron', seg: 6, group: 'prop' },                      // propeller hub
    ],
  },
  {
    id: 'sycamore-copter', name: 'Sycamore Copter', category: 'prop', uses: ['place', 'sit'],
    damage: SYCAMORE_COPTER_DAMAGE,
    tags: ['helicopter', 'copter', 'sycamore', 'seed', 'pod', 'rotor', 'flying', 'hover', 'skid', 'seat'], emoji: [],
    tint: SEED_OLIVE,
    seat: [0.35, 0.6, 0.2],
    pivots: { rotor: [0, 2.25, 0], 'tail-rotor': [0.12, 1.3, -3.4] },
    about: 'Gnome Theft Auto: the Sycamore Copter. A helicopter whose cabin is a fat sycamore seed pod on two skids, with a glass bubble at the front, a bench seat for two, a mast with a two-blade samara rotor (group rotor) and a tail boom with a tail rotor (group tail-rotor). Tint sets the pod and boom. Nose toward +z, lowest point at y 0. Seat top at [0.35, 0.6, 0.2].',
    examine: [
      'A helicopter whose cabin is a fat green seed pod, set on two long skids, with a glass bubble at the front and two pale blades on top.',
      'Saying from the Planting: a sycamore seed falls spinning, and a gnome who spins well enough comes down the same way, slowly and in the right direction.',
      'Tip: lift off slowly. A copter that climbs in a hurry tends to lean back into the Fence, and the Fence leans back.',
      'Joke: it hovers beautifully over the Verge and then stops to think about it, which the gnomes call a very confident pause.',
      'The pod has a faint ridge down its back where the two halves were glued together, and one small seed is stuck in the glue, still turning.',
    ],
    parts: [
      { s: 'ball', d: [0.9], at: [0, 1.15, 0], scale: [1, 0.89, 1.33], c: 'tint', alpha: 0.8, seg: 10, name: 'pod' }, // seed-pod cabin (floor 0.35 to top 1.95)
      { s: 'cyl', d: [0.03, 0.03, 0.46], at: [0.4, 0.27, 0.2], c: 'iron-dark', seg: 6, mirror: true },      // cabin struts
      { s: 'cyl', d: [0.04, 0.04, 2.6], rot: [90, 0, 0], at: [0.5, 0.04, 0], c: 'iron-dark', seg: 6, mirror: true }, // skids
      { s: 'ball', d: [0.6], at: [0, 1.2, 0.95], scale: [1, 0.85, 0.9], c: 'glass', alpha: 0.5, seg: 8 },    // glass bubble, front
      { s: 'box', d: [0.6, 0.2, 0.5], at: [0.35, 0.5, 0.2], c: 'leather', mirror: true },                    // bench seats (top 0.6)
      { s: 'cyl', d: [0.04, 0.04, 0.3], at: [0, 2.1, 0], c: 'iron', seg: 6 },                                // mast (top 2.25)
      { s: 'box', d: [1.7, 0.04, 0.5], at: [0.85, 2.25, 0], c: 'cloth', group: 'rotor', mirror: true, name: 'blade' }, // samara blades
      { s: 'box', d: [1.5, 0.16, 0.04], at: [0.85, 2.25, 0], c: 'bark', group: 'rotor', mirror: true },      // blade vein, a rib standing 6 cm clear of the blade faces, ends 10 cm in from the tips
      { s: 'ball', d: [0.07], at: [0, 2.25, 0], c: 'iron-dark', seg: 6, group: 'rotor' },                    // rotor hub
      { s: 'box', d: [0.12, 0.12, 2.2], at: [0, 1.2, -2.3], c: 'tint', name: 'boom' },                       // tail boom (z -1.2 to -3.4)
      { s: 'box', d: [0.04, 0.5, 0.4], at: [0, 1.45, -3.1], c: 'tint' },                                     // tail fin
      { s: 'box', d: [0.02, 0.4, 0.05], at: [0.12, 1.3, -3.4], c: 'iron-dark', group: 'tail-rotor' },       // tail blade, upright
      { s: 'box', d: [0.4, 0.02, 0.05], at: [0.12, 1.3, -3.4], c: 'iron-dark', group: 'tail-rotor' },       // tail blade, level
    ],
  },
  {
    id: 'dandelion-drifter', name: 'Dandelion Drifter', category: 'prop', uses: ['place', 'sit'],
    damage: DANDELION_DRIFTER_DAMAGE,
    tags: ['balloon', 'hot-air', 'dandelion', 'clock', 'basket', 'wicker', 'burner', 'drift', 'flying', 'seat'], emoji: [],
    tint: DANDELION_WHITE,
    seat: [0, 0.15, 0.25],
    about: 'Gnome Theft Auto: the Dandelion Drifter. A hot-air balloon: a wicker basket with a burner on four struts and a glowing flame, under a huge dandelion-clock envelope dotted with white seed tufts. Tint sets the envelope. Lowest point at y 0 (the basket floor). Floor top at y 0.15, seat at [0, 0.15, 0.25].',
    examine: [
      'A wicker basket hung under a very large dandelion clock, white and fluffy, and somewhat bigger than the basket has any right to be.',
      'Saying from the Planting: a dandelion clock tells the time by how many seeds are left, and a balloon tells it by how far it has drifted.',
      'Tip: keep the burner low and the ropes short. The envelope forgives most things, except the Hedge in a stiff breeze.',
      'Joke: the burner roars in a way the gnomes say is the balloon clearing its throat before it sings.',
      'Dandelion seeds are dotted all over the envelope, each a little tuft that the gnomes are told to count. Nobody has yet finished.',
    ],
    parts: [
      { s: 'ring', d: [0.7, 0.05], at: [0, 0.06, 0], rot: [90, 0, 0], c: 'wood', seg: 12 },                // basket hoop, bottom
      { s: 'ring', d: [0.7, 0.05], at: [0, 0.45, 0], rot: [90, 0, 0], c: 'wood', seg: 12 },               // basket hoop, middle
      { s: 'ring', d: [0.7, 0.05], at: [0, 0.85, 0], rot: [90, 0, 0], c: 'wood', seg: 12 },               // basket rim
      { s: 'cyl', d: [0.7, 0.7, 0.15], at: [0, 0.075, 0], c: 'wood-light', seg: 12 },                     // basket floor (top 0.15)
      { s: 'cyl', d: [0.01, 0.01, 2.15], rot: [0, 0, -21.8], at: [1.1, 1.9, 0], c: 'leather', seg: 4, mirror: true }, // ropes, east and west
      { s: 'cyl', d: [0.01, 0.01, 2.15], rot: [21.8, 0, 0], at: [0, 1.9, 1.1], c: 'leather', seg: 4 },    // rope, north
      { s: 'cyl', d: [0.01, 0.01, 2.15], rot: [-21.8, 0, 0], at: [0, 1.9, -1.1], c: 'leather', seg: 4 },   // rope, south
      { s: 'cyl', d: [0.015, 0.015, 1.1], at: [0.25, 1.4, 0.25], c: 'iron-dark', seg: 4, mirror: true },   // burner struts, front
      { s: 'cyl', d: [0.015, 0.015, 1.1], at: [0.25, 1.4, -0.25], c: 'iron-dark', seg: 4, mirror: true },  // burner struts, back
      { s: 'box', d: [0.3, 0.2, 0.3], at: [0, 2.0, 0], c: 'iron-dark', name: 'burner' },                 // burner
      { s: 'ball', d: [0.12], at: [0, 2.3, 0], scale: [1, 1.5, 1], c: 'flame', glow: true, seg: 6, name: 'flame' }, // flame
      { s: 'ball', d: [2.2], at: [0, 4.6, 0], c: 'tint', alpha: 0.9, seg: 10, name: 'envelope' },           // dandelion-clock envelope
      { s: 'ball', d: [0.1], at: [1.447, 6.324, 0], c: 'white', seg: 6 },                                   // seed tuft
      { s: 'ball', d: [0.1], at: [0.447, 6.324, 1.376], c: 'white', seg: 6 },                               // seed tuft
      { s: 'ball', d: [0.1], at: [-1.171, 6.324, 0.851], c: 'white', seg: 6 },                              // seed tuft
      { s: 'ball', d: [0.1], at: [-1.171, 6.324, -0.851], c: 'white', seg: 6 },                             // seed tuft
      { s: 'ball', d: [0.1], at: [0.447, 6.324, -1.376], c: 'white', seg: 6 },                              // seed tuft
      { s: 'ball', d: [0.1], at: [1.812, 4.796, 1.317], c: 'white', seg: 6 },                               // seed tuft
      { s: 'ball', d: [0.1], at: [-0.692, 4.796, 2.13], c: 'white', seg: 6 },                               // seed tuft
      { s: 'ball', d: [0.1], at: [-2.24, 4.796, 0], c: 'white', seg: 6 },                                   // seed tuft
      { s: 'ball', d: [0.1], at: [-0.692, 4.796, -2.13], c: 'white', seg: 6 },                              // seed tuft
      { s: 'ball', d: [0.1], at: [1.812, 4.796, -1.317], c: 'white', seg: 6 },                              // seed tuft
    ],
  },
  {
    id: 'windsock-scarf', name: 'Windsock Scarf', category: 'trinket', uses: ['wear-neck'],
    tags: ['windsock', 'wind', 'sock', 'scarf', 'stripe', 'orange', 'white', 'cord', 'neck', 'reward'], emoji: [],
    about: 'Three Ways Up: a white neck band with an orange stripe and a striped orange-and-white windsock hung forward on the chest, its wide mouth toward +z. Achievement reward for Three Ways Up.',
    examine: [
      'A striped orange-and-white windsock hung on a short band at the neck, its wide mouth turned forward where the wind can read it.',
      'Saying from the Verge: when the sock hangs limp, the wind has gone to lunch, and a gnome should go with it.',
      'Tip: point the wide end into the breeze. Pointed backward, it fills with your own hair and nothing else.',
      'Joke: the Hat Watch once used one to tell which way the Fence was leaning, and the Fence has never forgiven them.',
      'The white mouth has a mended tear stitched in orange thread, so the wind still gets in whenever it likes.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.025], at: [0, 0.025, -0.04], rot: [90, 0, 0], c: 'white', seg: 12 },          // neck band (min.y = 0)
      { s: 'ring', d: [0.205, 0.012], at: [0, 0.052, -0.04], rot: [90, 0, 0], c: 'orange', seg: 12 },      // orange stripe on the band
      { s: 'cone', d: [0.07, 0.14], at: [0, 0.09, 0.25], rot: [-80, 0, 0], c: 'orange', seg: 8 },           // sock, narrow end at the neck
      { s: 'cone', d: [0.074, 0.04], at: [0, 0.09, 0.34], rot: [-80, 0, 0], c: 'white', seg: 8 },           // white mouth stripe
    ],
  },
  {
    id: 'sycamore-seed-wings', name: 'Sycamore Seed Wings', category: 'armor', uses: ['wear-back'],
    tags: ['sycamore', 'seed', 'wings', 'samara', 'propeller', 'back', 'pack', 'green', 'reward'], emoji: [],
    about: 'Slipway Regular: two pale green samara wings fanned from a small hub on a strap across the back. Achievement reward for Slipway Regular.',
    examine: [
      'Two pale green wings like a sycamore seed, fanned out from a small wooden hub and strapped across the back.',
      'Saying from the Charters: a seed that turns on the way down is one that wants to see the view. A gnome may wish the same.',
      'Tip: strap them on before the climb. Once aloft, nobody gets to fiddle with a strap and remain dignified.',
      'Joke: the wings spin very nicely when the wind is behind you, and very badly when it is in front, which is most of the time.',
      'A row of thin veins runs along each wing, counted by a gnome who was told they were a map. They are not a map.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.04, 0.02], at: [0, 0.02, -0.03], c: 'leather-dark' },                         // strap (min.y = 0)
      { s: 'cyl', d: [0.012, 0.012, 0.3], at: [0, 0.19, -0.05], c: 'wood-dark', seg: 4 },                  // stem
      { s: 'ball', d: [0.03], at: [0, 0.34, -0.05], c: 'wood-dark', seg: 6 },                              // hub
      { s: 'box', d: [0.03, 0.3, 0.12], at: [0.1, 0.36, -0.05], rot: [0, 0, -25], c: 'leaf', mirror: true }, // samara wings
    ],
  },
];
