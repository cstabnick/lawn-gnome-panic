// Gnome Theft Auto: the Tessie side quest (Wild World Epic 7): Tessie the loch turtle, the sonar buoy, the egg clutch
// on its raft and the HOA dredger. Modelled by issue 7A; ids, categories, uses, tags and pivot names are final.
import type { PrefabDef } from '../types';

export const GTA_TESSIE: readonly PrefabDef[] = [
  {
    id: 'tessie', name: 'Tessie', category: 'prop', uses: ['place', 'sit'],
    tags: ['tessie', 'turtle', 'monster', 'loch', 'shell', 'moss', 'animal', 'critter', 'gta'], emoji: [],
    about: 'Tessie: a huge, ancient pond turtle with a mossy domed shell; the game rides her like a boat. 3 long (head at +z), about 2.3 wide, shell top at y 1.0 (the seat). Pivots head (neck and head), flipper-0..3 (front left, front right, rear left, rear right) and body. No tint parts.',
    examine: [
      'A huge pond turtle with a domed shell gone green with moss, a kindly old face at the front end, and a lily pad stuck on her back.',
      'Loch Moss saying: Tessie is older than any gnome can count, and most of Turfton is quite sure she is made up.',
      'Tip: climb aboard from the back and keep to the flat patch in the middle of the shell, or she will sulk for a week.',
      'Joke: the Turfton council has voted to deny her existence, and she has, politely, declined to attend the meeting.',
      'Someone has painted a small number seven on her shell, and nobody will say whether it counts years or visits.',
    ],
    seat: [0, 1.0, -0.2],
    pivots: {
      body: [0, 0.5, 0],
      head: [0, 0.55, 1.1],
      'flipper-0': [-0.95, 0.35, 0.7],
      'flipper-1': [0.95, 0.35, 0.7],
      'flipper-2': [-0.85, 0.3, -0.8],
      'flipper-3': [0.85, 0.3, -0.8],
    },
    parts: [
      { s: 'ball', d: [1.0], scale: [0.85, 0.4, 1.1], at: [0, 0.6, 0], c: 0x5b6b3a, group: 'body' },               // domed carapace (top y 1.0)
      { s: 'ball', d: [0.85], scale: [0.8, 0.2, 1.0], at: [0, 0.17, 0], c: 'shell', group: 'body' },              // pale plastron (min.y 0)
      { s: 'ball', d: [0.24], scale: [1, 0.22, 1], at: [0, 0.97, 0.25], c: 0x4f7a35, seg: 6, group: 'body' },     // moss patch
      { s: 'ball', d: [0.2], scale: [1, 0.22, 1], at: [-0.35, 0.93, -0.3], c: 0x6b8f3a, seg: 6, group: 'body' },   // moss patch
      { s: 'ball', d: [0.18], scale: [1, 0.22, 1], at: [0.4, 0.9, -0.5], c: 0x4f7a35, seg: 6, group: 'body' },     // moss patch
      { s: 'ball', d: [0.16], scale: [1, 0.22, 1], at: [-0.2, 0.92, 0.6], c: 0x6b8f3a, seg: 6, group: 'body' },    // moss patch
      { s: 'ball', d: [0.18], scale: [1, 0.35, 1], at: [-0.45, 0.86, 0.55], c: 0x4a3520, seg: 6, group: 'body' },  // raised scute plate
      { s: 'ball', d: [0.18], scale: [1, 0.35, 1], at: [0.5, 0.85, 0.5], c: 0x4a3520, seg: 6, group: 'body' },     // raised scute plate
      { s: 'ball', d: [0.16], scale: [1, 0.35, 1], at: [0, 0.87, -0.8], c: 0x4a3520, seg: 6, group: 'body' },      // raised scute plate
      { s: 'ball', d: [0.06], scale: [1, 0.7, 1], at: [-0.1, 0.92, -0.6], c: 'chalk', seg: 6, group: 'body' },     // barnacle crust
      { s: 'cyl', d: [0.2, 0.2, 0.02], at: [0.2, 1.0, -0.1], c: 'leaf', seg: 8, group: 'body' },                   // lily pad on the shell
      { s: 'cone', d: [0.05, 0.2], at: [-0.25, 1.08, -0.1], c: 'grass', seg: 5, group: 'body' },                   // tuft of grass
      { s: 'pill', d: [0.1, 0.2], rot: [90, 0, 0], at: [0, 0.4, -1.28], c: 0x5b6b3a, seg: 6, group: 'body' },      // tail
      { s: 'pill', d: [0.14, 0.3], rot: [50, 0, 0], at: [0, 0.55, 1.0], c: 0x6f7f4a, seg: 8, group: 'head' },      // neck
      { s: 'ball', d: [0.19], scale: [0.9, 0.85, 1.1], at: [0, 0.72, 1.29], c: 0x6f7f4a, seg: 8, group: 'head' },  // blunt kindly head
      { s: 'ball', d: [0.035], at: [0.09, 0.78, 1.38], c: 'black', seg: 6, mirror: true, group: 'head' },         // small dark eyes
      { s: 'box', d: [0.44, 0.07, 0.2], at: [-0.95, 0.3, 0.7], c: 0x6f7f4a, name: 'flipper-0', group: 'flipper-0' }, // front left flipper
      { s: 'box', d: [0.44, 0.07, 0.2], at: [0.95, 0.3, 0.7], c: 0x6f7f4a, name: 'flipper-1', group: 'flipper-1' },  // front right flipper
      { s: 'box', d: [0.4, 0.07, 0.2], at: [-0.85, 0.3, -0.8], c: 0x6f7f4a, name: 'flipper-2', group: 'flipper-2' }, // rear left flipper
      { s: 'box', d: [0.4, 0.07, 0.2], at: [0.85, 0.3, -0.8], c: 0x6f7f4a, name: 'flipper-3', group: 'flipper-3' },  // rear right flipper
    ],
  },
  {
    id: 'sonar-buoy', name: 'Sonar Buoy', category: 'prop', uses: ['place'],
    tags: ['sonar', 'buoy', 'float', 'listening', 'loch', 'gta'], emoji: [],
    about: 'Sonar buoy: a gnome-built listening float, red with a white band, about 0.5 across and 0.9 tall. A mast with a glowing lamp (glow) on top, a funnel horn facing down at the base and a coil of string. Static, no pivots.',
    examine: [
      'A listening float the width of a bread bin, red below and white at the band, with a lamp on a stick and a horn pointed at the ground.',
      'Gnome saying: a buoy that listens to the loch hears everything, and the loch, being polite, never mentions it.',
      'Tip: switch the lamp off before you set the buoy down, or it will flash at the moths and wake the frogs.',
      'Joke: the sonar has been fitted, adjusted and fitted again, and it still only ever hears the sound of its own horn.',
      'Someone has tied a little bell to the coil of string, and nobody can say who rang it last, only that it was rung at night.',
    ],
    parts: [
      { s: 'cyl', d: [0.25, 0.25, 0.2], at: [0, 0.24, 0], c: 'red', seg: 8 },                                     // red float body (y 0.14 to 0.34)
      { s: 'cyl', d: [0.255, 0.255, 0.08], at: [0, 0.38, 0], c: 'white', seg: 8 },                                // white band
      { s: 'cone', d: [0.12, 0.14], rot: [180, 0, 0], at: [0, 0.07, 0], c: 'iron-dark', seg: 8 },                  // funnel horn facing down (min.y 0)
      { s: 'cyl', d: [0.03, 0.03, 0.4], at: [0, 0.6, 0], c: 'iron', seg: 5 },                                      // mast
      { s: 'box', d: [0.12, 0.02, 0.02], at: [0, 0.7, 0], c: 'iron' },                                             // cross arm on the mast
      { s: 'ball', d: [0.06], at: [0, 0.84, 0], c: 'spark', glow: true, seg: 6 },                                  // lamp
      { s: 'ring', d: [0.14, 0.012], rot: [90, 0, 0], at: [0, 0.44, 0], c: 'cloth', seg: 8 },                      // coil of string
    ],
  },
  {
    id: 'turtle-egg-clutch', name: 'Egg Clutch Raft', category: 'prop', uses: ['place'],
    tags: ['egg', 'eggs', 'clutch', 'turtle', 'raft', 'nest', 'loch', 'gta'], emoji: [],
    about: 'Turtle egg clutch raft: 1.6 across, 0.5 tall. Five lashed sticks, two lashings, a moss nest and seven pale eggs (two faintly speckled). Static, no pivots.',
    examine: [
      'A small raft of lashed sticks with a nest of moss on top, and a heap of pale eggs, a couple of them faintly speckled.',
      'Saying: a clutch laid in the reeds is safe from the herons, but a clutch laid on a raft is safe from everything, mostly the raft.',
      'Tip: lift the raft by its corners, never by the eggs, which take great offence at being moved.',
      'Joke: the eggs have been sat on by three generations of gnome hats, and not one of the hats has been asked its opinion.',
      'Someone has propped a flat stone at one end that says do not disturb in charcoal, and the eggs have agreed to abide by it.',
    ],
    parts: [
      { s: 'box', d: [1.6, 0.08, 0.22], at: [0, 0.04, -0.68], c: 'wood' },                                        // stick 1 (min.y 0)
      { s: 'box', d: [1.6, 0.08, 0.22], at: [0, 0.04, -0.34], c: 'wood' },                                        // stick 2
      { s: 'box', d: [1.6, 0.08, 0.22], at: [0, 0.04, 0], c: 'wood' },                                            // stick 3
      { s: 'box', d: [1.6, 0.08, 0.22], at: [0, 0.04, 0.34], c: 'wood' },                                         // stick 4
      { s: 'box', d: [1.6, 0.08, 0.22], at: [0, 0.04, 0.68], c: 'wood' },                                         // stick 5
      { s: 'box', d: [0.05, 0.03, 1.6], at: [-0.5, 0.095, 0], c: 'leather-dark' },                               // lashing
      { s: 'box', d: [0.05, 0.03, 1.6], at: [0.5, 0.095, 0], c: 'leather-dark' },                                 // lashing
      { s: 'ball', d: [0.5], scale: [1, 0.3, 1], at: [0, 0.23, 0], c: 'moss', seg: 8 },                           // moss nest
      { s: 'ball', d: [0.12], at: [-0.2, 0.36, -0.1], c: 0xf2eee0, seg: 8 },                                      // egg
      { s: 'ball', d: [0.12], at: [0.15, 0.37, -0.15], c: 0xf2eee0, seg: 8 },                                     // egg
      { s: 'ball', d: [0.12], at: [0, 0.38, 0.1], c: 0xf2eee0, seg: 8 },                                          // egg
      { s: 'ball', d: [0.12], at: [-0.1, 0.33, 0.25], c: 0xf2eee0, seg: 8 },                                      // egg
      { s: 'ball', d: [0.12], at: [0.25, 0.31, 0.1], c: 0xf2eee0, seg: 8 },                                       // egg
      { s: 'ball', d: [0.12], at: [0.1, 0.3, -0.3], c: 0xf2eee0, seg: 8 },                                        // egg
      { s: 'ball', d: [0.12], at: [-0.3, 0.28, 0.2], c: 0xf2eee0, seg: 8 },                                       // egg
      { s: 'ball', d: [0.025], at: [0.23, 0.43, -0.07], c: 0xc8b8a0, seg: 4 },                                    // speckle
      { s: 'ball', d: [0.025], at: [0.2, 0.32, 0.03], c: 0xc8b8a0, seg: 4 },                                      // speckle
    ],
  },
  {
    id: 'hoa-dredger', name: 'HOA Dredger', category: 'prop', uses: ['place'],
    tags: ['hoa', 'dredger', 'barge', 'pump', 'golf', 'loch', 'gta'], emoji: [],
    about: 'HOA dredger: a beige barge about 3 long (bow at +z), 1.4 wide, 1.5 tall, with a black stripe, a pump house, a crane, a suction pipe sloping off the bow and a yellow sign panel. Static, no pivots.',
    examine: [
      'A flat beige barge with a black stripe along its side, a pump house on the deck, and a great pipe reaching off the bow.',
      'Commons saying: the loch was there first, but the HOA has a form for that, and the form is very thorough indeed.',
      'Tip: keep well clear of the suction pipe, which breathes in anything small and has not been told what the loch is for.',
      'Joke: the yellow panel on the stern carries a warning, and the warning has been ignored by everything that has ever floated past it.',
      'Someone has hung a small beige sock on the crane hook, and the HOA has spent a year trying to find out whose it is.',
    ],
    parts: [
      { s: 'box', d: [1.4, 0.28, 2.55], at: [0, 0.14, -0.125], c: 0xc9b99b },                                     // hull (min.y 0)
      { s: 'box', d: [1.42, 0.05, 2.3], at: [0, 0.12, -0.2], c: 0x18181e },                                        // black stripe
      { s: 'wedge', d: [1.4, 0.28, 0.4], rot: [0, 180, 0], at: [0, 0.14, 1.3], c: 0xc9b99b },                    // bow ramp, low at +z
      { s: 'box', d: [1.36, 0.06, 2.0], at: [0, 0.3, -0.35], c: 0x18181e },                                       // black deck
      { s: 'box', d: [0.6, 0.45, 0.55], at: [-0.3, 0.55, -0.6], c: 0xc9b99b },                                    // pump house
      { s: 'box', d: [0.3, 0.18, 0.02], at: [-0.3, 0.6, -0.32], c: 'glass' },                                     // pump house window
      { s: 'box', d: [0.66, 0.06, 0.6], at: [-0.3, 0.8, -0.6], c: 0x18181e },                                     // pump house roof
      { s: 'box', d: [0.06, 1.0, 0.06], at: [0.45, 0.8, -0.6], c: 0x18181e },                                     // crane mast
      { s: 'box', d: [0.05, 0.05, 0.9], rot: [25, 0, 0], at: [0.45, 1.2, -0.25], c: 0x18181e },                  // crane arm reaching over the bow
      { s: 'cyl', d: [0.09, 0.09, 0.5], rot: [116.6, 0, 0], at: [0, 0.2, 1.3], c: 0x50565c, seg: 8 },            // suction pipe sloping off the bow
      { s: 'box', d: [0.05, 0.15, 0.05], at: [0.3, 0.4, -1.3], c: 0x18181e },                                     // sign post
      { s: 'box', d: [0.5, 0.22, 0.04], at: [0.3, 0.46, -1.3], c: 'yellow' },                                     // sign panel
      { s: 'box', d: [0.02, 0.16, 0.22], at: [0.45, 1.36, -0.5], c: 'red' },                                      // pennant
    ],
  },
];
