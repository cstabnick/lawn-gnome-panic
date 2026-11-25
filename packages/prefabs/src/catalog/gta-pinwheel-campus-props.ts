// Gnome Theft Auto (E13): Pinwheel Ridge's giant pinwheels, control hut, substation and cable drum. Filled by E13 issue A04a.
import type { PrefabDef } from '../types';

export const GTA_PINWHEEL_CAMPUS_PROPS: readonly PrefabDef[] = [
  {
    id: 'giant-pinwheel-mast', name: 'Giant Pinwheel Mast', category: 'prop', uses: ['place'],
    tags: ['gta', 'pinwheel', 'wind', 'ridge', 'mast', 'pole', 'tower', 'giant', 'garden', 'ladder'], emoji: [],
    footprint: { r: 1.0, h: 12.5 },
    about: 'Gnome Theft Auto: the Giant Pinwheel Mast, authored at half size (the game places it at scale 2). A white pole with red bands on a square plinth, a maintenance door, a ladder up one side and a hub housing at the top (centre y 12). The rotor is a separate prefab.',
    examine: [
      'A white pole with red bands rising from a square plinth, with a ladder up one side and a fat hub at the top, like a clock that has given up.',
      'Saying: a pinwheel never asks which way the wind is blowing. It turns, and the wind, being polite, follows.',
      'Tip: the little door at the foot is for Ridge engineers only. Ragwort Coilspring says so, and he says it naturally.',
      'Joke: the HOA re-cabled the Ridge and sent a letter about the ladder. Nobody has climbed the ladder since, out of respect.',
      'Ragwort Coilspring has named this one Big Red. The hub has been asked to keep the name in mind.',
    ],
    parts: [
      { s: 'box', d: [2.0, 0.5, 2.0], at: [0, 0.25, 0], c: 'stone' },                                      // plinth
      { s: 'cyl', d: [0.3, 0.35, 6.0], at: [0, 3.5, 0], c: 'white', seg: 8 },                              // pole, lower
      { s: 'cyl', d: [0.2, 0.3, 5.5], at: [0, 9.25, 0], c: 'white', seg: 8 },                              // pole, upper
      { s: 'cyl', d: [0.37, 0.37, 0.3], at: [0, 2.0, 0], c: 'red', seg: 8 },                               // red band
      { s: 'cyl', d: [0.37, 0.37, 0.3], at: [0, 4.5, 0], c: 'red', seg: 8 },                               // red band
      { s: 'cyl', d: [0.29, 0.29, 0.3], at: [0, 9.0, 0], c: 'red', seg: 8 },                               // red band, upper
      { s: 'box', d: [0.45, 0.9, 0.04], at: [0, 0.95, 0.36], c: 'iron-dark' },                             // maintenance door
      { s: 'box', d: [0.05, 5.5, 0.05], at: [0.5, 3.25, 0.15], c: 'iron' },                               // ladder rail
      { s: 'box', d: [0.05, 5.5, 0.05], at: [0.5, 3.25, -0.15], c: 'iron' },                              // ladder rail
      { s: 'box', d: [0.2, 0.04, 0.36], at: [0.5, 1.5, 0], c: 'iron' },                                    // ladder rung
      { s: 'box', d: [0.2, 0.04, 0.36], at: [0.5, 2.5, 0], c: 'iron' },                                    // ladder rung
      { s: 'box', d: [0.2, 0.04, 0.36], at: [0.5, 3.5, 0], c: 'iron' },                                    // ladder rung
      { s: 'box', d: [0.2, 0.04, 0.36], at: [0.5, 4.5, 0], c: 'iron' },                                    // ladder rung
      { s: 'box', d: [0.2, 0.04, 0.36], at: [0.5, 5.5, 0], c: 'iron' },                                    // ladder rung
      { s: 'cyl', d: [0.5, 0.5, 1.0], at: [0, 12, 0.1], rot: [90, 0, 0], c: 'white', seg: 10 },            // hub housing, front face z 0.6
      { s: 'cyl', d: [0.3, 0.3, 0.06], at: [0, 12, 0.63], rot: [90, 0, 0], c: 'red', seg: 8 },             // hub cap
    ],
  },
  {
    id: 'giant-pinwheel-rotor', name: 'Giant Pinwheel Rotor', category: 'prop', uses: ['place'],
    tags: ['gta', 'pinwheel', 'wind', 'ridge', 'rotor', 'vane', 'blade', 'spin', 'giant', 'garden', 'windmill'], emoji: [],
    tint: 'red', trim: 'yellow',
    pivots: { hub: [0, 4.5, 0] },
    about: 'Gnome Theft Auto: the Giant Pinwheel Rotor, authored at half size (the game uses radius 9 at scale 2). Four curled vanes in the x-y plane facing +z, alternating tint and trim, around a white pin. Its centre is the pivot `hub` at local (0, 4.5, 0); the game spins it about that point.',
    examine: [
      'Four curled vanes of painted tin, red and yellow in turn, folded like a paper windmill and wide enough to shade a shed.',
      'Saying: a pinwheel does not hurry. It goes round exactly as often as the wind insists, and a little more when it is watched.',
      'Tip: when the wind picks up, the rotor goes round faster than it looks from below. Stand well back and count the vanes.',
      'Joke: the rotor lights Turfton\'s lamps and neon, and Turfton has never once thanked it, which the rotor has taken very calmly.',
      'Ragwort Coilspring has named every vane. Red One is the bossiest, and Yellow Two is not on speaking terms with it.',
    ],
    parts: [
      { s: 'box', d: [2.4, 0.8, 0.3], at: [1.2, 4.5, 0], rot: [0, 0, 25], c: 'tint', group: 'hub' },     // vane 1, root
      { s: 'box', d: [1.6, 0.7, 0.3], at: [3.64, 4.5, 0], rot: [0, 0, -35], c: 'tint', group: 'hub' },   // vane 1, curled tip
      { s: 'box', d: [2.4, 0.8, 0.3], at: [0, 5.7, 0.05], rot: [0, 0, 115], c: 'trim', group: 'hub' },     // vane 2, root
      { s: 'box', d: [1.6, 0.7, 0.3], at: [0, 8.14, 0.05], rot: [0, 0, 55], c: 'trim', group: 'hub' },     // vane 2, curled tip
      { s: 'box', d: [2.4, 0.8, 0.3], at: [-1.2, 4.5, 0], rot: [0, 0, 205], c: 'tint', group: 'hub' },  // vane 3, root
      { s: 'box', d: [1.6, 0.7, 0.3], at: [-3.64, 4.5, 0], rot: [0, 0, 145], c: 'tint', group: 'hub' }, // vane 3, curled tip
      { s: 'box', d: [2.4, 0.8, 0.3], at: [0, 3.3, 0.05], rot: [0, 0, 295], c: 'trim', group: 'hub' },     // vane 4, root
      { s: 'box', d: [1.6, 0.7, 0.3], at: [0, 0.86, 0.05], rot: [0, 0, 235], c: 'trim', group: 'hub' },    // vane 4, curled tip (lowest point y 0)
      { s: 'ball', d: [0.14], at: [0, 4.5, 0.12], c: 'white', seg: 8, group: 'hub' },                   // pin cap
    ],
  },
  {
    id: 'pinwheel-control-hut', name: 'Pinwheel Control Hut', category: 'prop', uses: ['place'],
    tags: ['gta', 'pinwheel', 'wind', 'ridge', 'hut', 'control', 'shed', 'tin', 'dial', 'cable'], emoji: [],
    tint: 'iron', trim: 'red',
    footprint: { r: 1.5, h: 2.6 },
    about: 'Gnome Theft Auto: the Pinwheel Control Hut. Life-size metres, about 3 x 3 x 2.6, door and window on +z. A tin hut with a pent roof, a window showing a panel of coloured dials, a tiny pinwheel on the roof corner and a cable conduit out of the back wall into the ground.',
    examine: [
      'A little tin hut under a pent roof, with one window of grey glass, a panel of coloured dials behind it and a tiny pinwheel on the corner.',
      'Saying: a hut with a pinwheel on its roof has been asked to keep an eye on the wind, and it takes the job very seriously.',
      'Tip: the red dial goes up when the wind does. The other dials are labelled in a language nobody reads, which is fine by the dials.',
      'Joke: Ragwort Coilspring keeps one chair in the hut, with a card that says Mine. Nobody else has been brave enough to sit in it.',
      'The cable leaves the back wall and goes down into the ground, as if it had been told to go underground and went very literally.',
    ],
    parts: [
      { s: 'box', d: [2.8, 2.3, 2.8], at: [0, 1.15, 0], c: 'tint' },                                    // walls
      { s: 'box', d: [0.7, 1.5, 0.04], at: [-0.5, 0.75, 1.42], c: 'iron-dark' },                         // door
      { s: 'box', d: [0.9, 0.7, 0.02], at: [0.7, 1.4, 1.43], c: 'glass' },                               // window pane
      { s: 'cyl', d: [0.07, 0.07, 0.03], at: [0.55, 1.45, 1.46], rot: [90, 0, 0], c: 'red', seg: 8 },     // dial, behind the pane
      { s: 'cyl', d: [0.07, 0.07, 0.03], at: [0.85, 1.3, 1.46], rot: [90, 0, 0], c: 'green', seg: 8 },    // dial, behind the pane
      { s: 'box', d: [3.2, 0.12, 3.2], at: [0, 2.35, 0], rot: [-8, 0, 0], c: 'trim' },                    // pent roof
      { s: 'box', d: [2.9, 0.4, 0.08], at: [0, 2.3, -1.4], c: 'trim' },                                   // roof fascia, back
      { s: 'cyl', d: [0.02, 0.02, 0.4], at: [1.2, 2.7, -1.2], c: 'steel', seg: 6 },                       // roof pinwheel pole
      { s: 'box', d: [0.3, 0.05, 0.02], at: [1.2, 2.92, -1.2], rot: [0, 0, 45], c: 'red' },               // roof pinwheel, vane
      { s: 'box', d: [0.3, 0.05, 0.02], at: [1.2, 2.92, -1.2], rot: [0, 0, -45], c: 'yellow' },           // roof pinwheel, vane
      { s: 'ball', d: [0.03], at: [1.2, 2.92, -1.2], c: 'white', seg: 6 },                                // roof pinwheel, pin
      { s: 'cyl', d: [0.05, 0.05, 1.0], at: [0, 0.3, -1.9], rot: [90, 0, 0], c: 'iron-dark', seg: 6 },    // conduit out of the back wall
      { s: 'cyl', d: [0.05, 0.05, 0.3], at: [0, 0.15, -2.4], c: 'iron-dark', seg: 6 },                    // conduit into the ground
    ],
  },
  {
    id: 'pinwheel-substation', name: 'Pinwheel Substation', category: 'prop', uses: ['place'],
    tags: ['gta', 'pinwheel', 'wind', 'ridge', 'substation', 'fence', 'transformer', 'insulator', 'grid', 'cable'], emoji: [],
    footprint: { r: 2.0, h: 2.0 },
    about: 'Gnome Theft Auto: the Pinwheel Substation. Life-size metres, about 4 x 3 x 3. A grey transformer box with cooling fins, three white insulators on top, a chain-link fence with no panels and a blank yellow warning plate on the front.',
    examine: [
      'A grey box with cooling fins down both sides, three white stands on its lid, and a chain-link fence around the lot with a yellow plate on the front.',
      'Saying: the box hums while the Ridge is working and goes quiet when the rent is late. Nobody has found the connection yet.',
      'Tip: keep outside the fence. Ragwort Coilspring says the fence is not there to keep gnomes out, but to keep the cable from getting ideas.',
      'Joke: the yellow plate is blank because the HOA has not yet decided what it should warn about, and has been deciding since spring.',
      'The white stands are empty, and a neat row of pebbles is laid under each one, as if somebody is expecting a delivery.',
    ],
    parts: [
      { s: 'box', d: [1.8, 1.6, 1.4], at: [0, 0.8, 0], c: 'stone' },                                      // transformer box
      { s: 'box', d: [0.03, 1.2, 0.08], at: [0.915, 0.8, -0.4], c: 'stone-dark', mirror: true },          // cooling fin
      { s: 'box', d: [0.03, 1.2, 0.08], at: [0.915, 0.8, 0], c: 'stone-dark', mirror: true },              // cooling fin
      { s: 'box', d: [0.03, 1.2, 0.08], at: [0.915, 0.8, 0.4], c: 'stone-dark', mirror: true },            // cooling fin
      { s: 'cyl', d: [0.05, 0.05, 0.2], at: [-0.6, 1.7, 0], c: 'white', seg: 6 },                         // insulator 1, stem
      { s: 'cyl', d: [0.1, 0.1, 0.04], at: [-0.6, 1.82, 0], c: 'white', seg: 8 },                         // insulator 1, disc
      { s: 'cyl', d: [0.1, 0.1, 0.04], at: [-0.6, 1.88, 0], c: 'white', seg: 8 },                         // insulator 1, disc
      { s: 'cyl', d: [0.05, 0.05, 0.2], at: [0, 1.7, 0], c: 'white', seg: 6 },                            // insulator 2, stem
      { s: 'cyl', d: [0.1, 0.1, 0.04], at: [0, 1.82, 0], c: 'white', seg: 8 },                            // insulator 2, disc
      { s: 'cyl', d: [0.1, 0.1, 0.04], at: [0, 1.88, 0], c: 'white', seg: 8 },                            // insulator 2, disc
      { s: 'cyl', d: [0.05, 0.05, 0.2], at: [0.6, 1.7, 0], c: 'white', seg: 6 },                          // insulator 3, stem
      { s: 'cyl', d: [0.1, 0.1, 0.04], at: [0.6, 1.82, 0], c: 'white', seg: 8 },                          // insulator 3, disc
      { s: 'cyl', d: [0.1, 0.1, 0.04], at: [0.6, 1.88, 0], c: 'white', seg: 8 },                          // insulator 3, disc
      { s: 'cyl', d: [0.03, 0.03, 1.6], at: [2.0, 0.8, 1.5], c: 'iron', seg: 6, mirror: true },           // fence post
      { s: 'cyl', d: [0.03, 0.03, 1.6], at: [2.0, 0.8, -1.5], c: 'iron', seg: 6, mirror: true },          // fence post
      { s: 'box', d: [4.0, 0.03, 0.03], at: [0, 0.45, 1.5], c: 'iron' },                                  // fence rail, front
      { s: 'box', d: [4.0, 0.03, 0.03], at: [0, 1.25, 1.5], c: 'iron' },                                  // fence rail, front
      { s: 'box', d: [4.0, 0.03, 0.03], at: [0, 0.45, -1.5], c: 'iron' },                                 // fence rail, back
      { s: 'box', d: [4.0, 0.03, 0.03], at: [0, 1.25, -1.5], c: 'iron' },                                 // fence rail, back
      { s: 'box', d: [0.03, 0.03, 3.0], at: [2.0, 0.45, 0], c: 'iron', mirror: true },                    // fence rail, side
      { s: 'box', d: [0.03, 0.03, 3.0], at: [2.0, 1.25, 0], c: 'iron', mirror: true },                    // fence rail, side
      { s: 'box', d: [0.9, 0.5, 0.02], at: [0, 0.85, 1.52], c: 'yellow' },                                // blank warning plate
    ],
  },
  {
    id: 'cable-drum', name: 'Cable Drum', category: 'prop', uses: ['place'],
    tags: ['gta', 'pinwheel', 'wind', 'ridge', 'cable', 'drum', 'spool', 'wood', 'wire', 'reel'], emoji: [],
    footprint: { r: 0.6, h: 1.3 },
    about: 'Gnome Theft Auto: the Cable Drum. Life-size metres, a wooden cable spool about 1.3 m tall standing on its lower flange, wound with black cable, one loose end trailing across the ground.',
    examine: [
      'A wooden spool as tall as a gnome, wound with black cable, its flanges worn grey at the edges, with one loose end trailing across the grass.',
      'Saying: a cable wound onto a drum is a promise that it will be unwound, and the drum does not care when.',
      'Tip: a drum makes a fine lookout, but never sit on the loose end. Ragwort Coilspring keeps count of every gnome who has tried.',
      'Joke: the tag says Do Not Pull, and it is the only cable on the Ridge that has been pulled by absolutely everyone at least once.',
      'Someone has carved a row of tally marks into the top flange. The count stops halfway, which the gnomes agree is a suspicious place to stop.',
    ],
    parts: [
      { s: 'cyl', d: [0.6, 0.6, 0.08], at: [0, 0.04, 0], c: 'wood-light', seg: 10 },                       // lower flange
      { s: 'cyl', d: [0.6, 0.6, 0.08], at: [0, 1.26, 0], c: 'wood-light', seg: 10 },                       // upper flange
      { s: 'cyl', d: [0.35, 0.35, 1.14], at: [0, 0.65, 0], c: 'wood', seg: 8 },                           // core
      { s: 'cyl', d: [0.45, 0.45, 1.0], at: [0, 0.65, 0], c: 'black', seg: 8 },                           // wound cable
      { s: 'cyl', d: [0.02, 0.02, 0.5], at: [0.7, 0.02, 0.2], rot: [0, 0, 90], c: 'black', seg: 4 },      // loose end
    ],
  },
];
