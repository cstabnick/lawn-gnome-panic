// Gnome Theft Auto: European kit, street furniture B (E29, docs/roadmaps/gta-batch-3/E29/). Cafe furniture, a bike rack
// and three signs with a blank text face (`name: 'sign-face'`, drawn on by the game from SIGN_FACE in eurokit/signs.ts).
// Life-size metres, standing on y = 0, centred on x and z, front on +z.
import type { PrefabDef } from '../types';

export const GTA_EURO_STREET_B: readonly PrefabDef[] = [
  {
    id: 'euro-bike-rack', name: 'Bike Rack', category: 'prop', uses: ['place'],
    tags: ['gta', 'euro', 'bike', 'rack', 'steel', 'scenery'], emoji: [],
    footprint: { r: 0.3, h: 1 },
    about: 'Gnome Theft Auto (European kit): the Bike Rack. Three grey steel hoops on a low rail, with one old step-through bicycle leaned in the middle. Front faces +z. 1.8 x 1.0 x 0.6 m.',
    examine: [
      'Three grey steel hoops stand in a row, and the old bicycle leaning in the middle one has been leaning there since spring.',
      'Saying: a bicycle locked to the rack is a bicycle that is staying, whatever the bicycle thinks about it.',
      'Tip: lock the front wheel as well as the back one, or the wheel will be gone before you finish your coffee.',
      'Joke: the rack has room for twelve bicycles, and in a whole year it has been used by one, who is still deciding.',
      'The wicker basket holds two baguettes that nobody has claimed, and they are now harder than the rack itself.',
    ],
    parts: [
      { s: 'box', d: [1.8, 0.04, 0.04], at: [0, 0.04, 0], c: 'iron' },                                 // low rail
      { s: 'ring', d: [0.35, 0.025, 180], at: [-0.6, 0.025, 0], c: 'iron', seg: 8 },                  // three hoops
      { s: 'ring', d: [0.35, 0.025, 180], at: [0, 0.025, 0], c: 'iron', seg: 8 },
      { s: 'ring', d: [0.35, 0.025, 180], at: [0.6, 0.025, 0], c: 'iron', seg: 8 },
      { s: 'ring', d: [0.28, 0.02], at: [-0.6, 0.3, 0.28], c: 'iron-dark', seg: 8 },                 // bicycle wheels
      { s: 'ring', d: [0.28, 0.02], at: [-0.6, 0.3, -0.28], c: 'iron-dark', seg: 8 },
      { s: 'pill', d: [0.02, 0.5], at: [-0.6, 0.55, 0], rot: [90, 0, 0], c: 'black' },                // top tube
      { s: 'pill', d: [0.02, 0.29], at: [-0.6, 0.425, 0.11], rot: [41, 0, 0], c: 'black' },          // down tube
      { s: 'pill', d: [0.015, 0.3], at: [-0.6, 0.45, 0.28], c: 'black' },                            // front fork
      { s: 'box', d: [0.16, 0.04, 0.1], at: [-0.6, 0.58, -0.2], c: 'black' },                        // saddle
      { s: 'box', d: [0.3, 0.02, 0.02], at: [-0.6, 0.62, 0.28], c: 'black' },                        // handlebar
      { s: 'box', d: [0.26, 0.14, 0.2], at: [-0.6, 0.6, 0.4], c: 'burlap' },                         // basket
      { s: 'pill', d: [0.02, 0.22], at: [-0.64, 0.72, 0.4], rot: [12, 0, 8], c: 'wood-light' },      // baguettes
      { s: 'pill', d: [0.02, 0.22], at: [-0.56, 0.71, 0.4], rot: [12, 0, -8], c: 'wood-light' },
    ],
  },
  {
    id: 'euro-cafe-chair', name: 'Cafe Chair', category: 'prop', uses: ['place', 'sit'],
    tags: ['gta', 'euro', 'chair', 'cafe', 'iron', 'woven'], emoji: [],
    tint: 0xc23b3b,
    trim: 0xf3efe6,
    seat: [0, 0.46, 0],
    about: 'Gnome Theft Auto (European kit): the Cafe Chair. Bent dark iron legs, a round woven seat (tint = red, trim = cream) and a curved back. Faces +z. 0.45 x 0.92 x 0.45 m.',
    examine: [
      'A dark iron chair with a round woven seat in red and cream, and a curved back that is a little too high for comfort.',
      'Saying: sit down and you have ordered something, even if you only meant to wait for the bell.',
      'Tip: the chairs are never in a line, so move one into the sun and somebody will move it back out of spite.',
      'Joke: the seat is good for an hour, and the waiter is good for an hour and a half, so plan accordingly.',
      'Under the seat someone has scratched a small drawing of a fish, and nobody will say who sat there or why they were hungry.',
    ],
    parts: [
      { s: 'pill', d: [0.015, 0.42], at: [0.15, 0.225, 0.15], c: 'iron-dark', mirror: true, seg: 6 },   // front legs
      { s: 'pill', d: [0.015, 0.42], at: [0.15, 0.225, -0.15], c: 'iron-dark', mirror: true, seg: 6 },  // rear legs
      { s: 'pill', d: [0.015, 0.44], at: [0.18, 0.68, -0.18], c: 'iron-dark', mirror: true, seg: 6 },  // back uprights
      { s: 'ring', d: [0.18, 0.02, 180], at: [0, 0.72, -0.18], c: 'iron-dark', seg: 6 },                // curved back
      { s: 'cyl', d: [0.22, 0.22, 0.04], at: [0, 0.44, 0], c: 'tint' },                                // seat base
      { s: 'box', d: [0.4, 0.014, 0.05], at: [0, 0.468, 0], c: 'trim' },                              // woven top, one way
      { s: 'box', d: [0.05, 0.04, 0.4], at: [0, 0.474, 0], c: 'tint' },                              // woven top, other way
    ],
  },
  {
    id: 'euro-cafe-table', name: 'Cafe Table', category: 'prop', uses: ['place'],
    tags: ['gta', 'euro', 'table', 'cafe', 'marble', 'iron'], emoji: [],
    about: 'Gnome Theft Auto (European kit): the Cafe Table. Round white marble top on one dark cast-iron pedestal, with a cup, saucer and ashtray dish on top. 0.7 x 0.77 x 0.7 m.',
    examine: [
      'A round white marble top sits on one dark cast-iron pedestal, with a cup, a saucer and a small dish that is always half full.',
      'Saying: a table for two is a table for one who has kept the other chair warm.',
      'Tip: the pedestal is heavy for a reason, so do not try to move the table while the coffee is still hot.',
      'Joke: the coffee comes in a cup that is smaller than its saucer, which is the way the gnomes like it.',
      'The dish holds one sugar cube that has been there since the strike, and it is still not going anywhere.',
    ],
    parts: [
      { s: 'cyl', d: [0.22, 0.22, 0.03], at: [0, 0.015, 0], c: 'iron-dark' },                       // cast-iron foot
      { s: 'cyl', d: [0.04, 0.04, 0.7], at: [0, 0.38, 0], c: 'iron-dark' },                          // pedestal
      { s: 'cyl', d: [0.35, 0.35, 0.03], at: [0, 0.735, 0], c: 'chalk' },                            // marble top
      { s: 'cyl', d: [0.06, 0.06, 0.014], at: [0.12, 0.758, 0.1], c: 'white' },                      // saucer
      { s: 'cyl', d: [0.03, 0.025, 0.05], at: [0.12, 0.79, 0.1], c: 'white' },                       // cup
      { s: 'cyl', d: [0.05, 0.04, 0.02], at: [-0.14, 0.762, -0.08], c: 'terracotta' },              // ashtray dish
    ],
  },
  {
    id: 'euro-chalkboard-sign', name: 'Chalkboard Menu', category: 'prop', uses: ['place'],
    tags: ['gta', 'euro', 'sign', 'chalkboard', 'menu', 'wood'], emoji: [],
    about: 'Gnome Theft Auto (European kit): the Chalkboard Menu. An A-frame of two black boards in wooden frames, a blank sign-face on the front board for the specials. 0.6 x 1.0 x 0.5 m.',
    examine: [
      'An A-frame of two black boards in wooden frames, with the specials chalked up in a hand that has given up on neatness.',
      'Saying: the special is always the one that is not left, and that is always the soup.',
      'Tip: read it before you sit down, because the list changes while you read and it never gets any shorter.',
      'Joke: the menu says soup of the day, the day is yesterday, and the soup is still yesterday\'s soup.',
      'A small chalk drawing of a gnome in a beret has been rubbed out twice, and the ghost of it is still there.',
    ],
    parts: [
      { s: 'box', d: [0.5, 0.7, 0.02], at: [0, 0.62, 0.12], rot: [-12, 0, 0], c: 'black', name: 'sign-face' },  // blank face
      { s: 'box', d: [0.6, 0.05, 0.08], at: [0, 0.9916, 0.041], rot: [-12, 0, 0], c: 'wood' },           // front frame
      { s: 'box', d: [0.6, 0.05, 0.08], at: [0, 0.2484, 0.199], rot: [-12, 0, 0], c: 'wood' },
      { s: 'box', d: [0.05, 0.8, 0.08], at: [0.28, 0.62, 0.12], rot: [-12, 0, 0], c: 'wood', mirror: true },
      { s: 'box', d: [0.56, 0.78, 0.03], at: [0, 0.62, -0.04], rot: [12, 0, 0], c: 'black' },            // back board
      { s: 'pill', d: [0.02, 0.19], at: [0.2, 0.115, 0.2], c: 'wood-dark', mirror: true, seg: 6 },      // front legs
      { s: 'pill', d: [0.02, 0.19], at: [0.2, 0.115, -0.12], c: 'wood-dark', mirror: true, seg: 6 },   // back legs
      { s: 'box', d: [0.3, 0.015, 0.015], at: [-0.04, 0.8, 0.102], rot: [-12, 0, 0], c: 'white' },   // chalk scribbles
      { s: 'box', d: [0.22, 0.015, 0.015], at: [0.06, 0.6044, 0.1438], rot: [-12, 0, 0], c: 'white' },
      { s: 'box', d: [0.12, 0.015, 0.015], at: [-0.02, 0.409, 0.185], rot: [-12, 0, 0], c: 'white' },
    ],
  },
  {
    id: 'euro-poster-board', name: 'Poster Board', category: 'prop', uses: ['place'],
    tags: ['gta', 'euro', 'poster', 'board', 'notice', 'iron'], emoji: [],
    footprint: { r: 0.3, h: 2.3 },
    about: 'Gnome Theft Auto (European kit): the Poster Board. Dark green iron frame on two legs with a little roof; a blank paper sign-face for notices, and a torn older poster in one corner. Front faces +z. 1.4 x 2.3 x 0.2 m.',
    examine: [
      'A dark green iron frame with a little roof holds a large paper poster, and one torn corner of an older poster peeks out underneath.',
      'Saying: a notice on a board is a rule that has been given a window.',
      'Tip: read the dates before you go, because the event was on Tuesday and the strike has moved it to Wednesday.',
      'Joke: the poster announces a concert, the concert is announced on a poster, and that is as far as it has got.',
      'The torn corner shows an older notice about a lost umbrella, and a note underneath says it was found and then lost again.',
    ],
    parts: [
      { s: 'box', d: [1.2, 1.6, 0.02], at: [0, 1.4, 0.06], c: 'paper', name: 'sign-face' },            // poster area
      { s: 'box', d: [1.42, 0.1, 0.1], at: [0, 2.26, 0.06], c: 'leaf-dark' },                          // frame, top
      { s: 'box', d: [1.42, 0.1, 0.1], at: [0, 0.57, 0.06], c: 'leaf-dark' },                         // frame, bottom
      { s: 'box', d: [0.1, 1.8, 0.1], at: [0.66, 1.42, 0.06], c: 'leaf-dark', mirror: true },          // frame, sides
      { s: 'box', d: [0.06, 0.54, 0.06], at: [0.5, 0.27, 0.06], c: 'leaf-dark', mirror: true },        // legs
      { s: 'box', d: [1.5, 0.06, 0.3], at: [0, 2.37, 0.06], c: 'slate' },                              // little roof
      { s: 'box', d: [0.3, 0.25, 0.012], at: [0.38, 0.9, 0.085], c: 'red' },                           // torn older poster
    ],
  },
  {
    id: 'euro-street-sign', name: 'Street Name Sign', category: 'prop', uses: ['place'],
    tags: ['gta', 'euro', 'sign', 'street', 'enamel', 'iron'], emoji: [],
    about: 'Gnome Theft Auto (European kit): the Street Name Sign. Black post with a ball top and a blue enamel plaque (sign-face) with a white border. 0.7 x 2.4 x 0.1 m.',
    examine: [
      'A black iron post with a ball on top holds a blue enamel plaque with a white border, and the name is spelled out in careful capitals.',
      'Saying: a street is only as long as the walk to the end of it, and nobody has ever measured it.',
      'Tip: the name is the only useful thing on the street, so check it before you ask a gnome for directions.',
      'Joke: the name changes every time the council votes, and the council votes every time it is asked.',
      'Someone has scratched a tiny queue under the plaque, and the queue is still waiting for the street to open.',
    ],
    parts: [
      { s: 'cyl', d: [0.035, 0.035, 2.2], at: [0, 1.1, 0], c: 'iron-dark' },                          // post
      { s: 'ball', d: [0.06], at: [0, 2.24, 0], c: 'iron-dark' },                                       // ball top
      { s: 'box', d: [0.6, 0.3, 0.02], at: [0, 2.2, 0.03], c: 0x1f4f9a, name: 'sign-face' },           // blue enamel plaque
      { s: 'box', d: [0.64, 0.03, 0.03], at: [0, 2.36, 0.06], c: 'white' },                            // white border, top
      { s: 'box', d: [0.64, 0.03, 0.03], at: [0, 2.04, 0.06], c: 'white' },                            // white border, bottom
      { s: 'box', d: [0.02, 0.32, 0.03], at: [0.315, 2.2, 0.06], c: 'white', mirror: true },           // white border, sides
    ],
  },
];
