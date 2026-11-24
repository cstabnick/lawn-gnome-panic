// Gnome Theft Auto: street furniture B (docs/roadmaps/gta-parks-and-fringe.md). Life-size metres, standing on y = 0, centred on
// x and z, front on +z. Sizes are width x depth x height (x, z, y).
import type { PrefabDef } from '../types';

export const GTA_STREET_KIT_B: readonly PrefabDef[] = [
  {
    id: 'bus-shelter', name: 'Bus Shelter', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'bus'], emoji: [],
    tint: 0x2f5d46,
    footprint: { r: 1.9, h: 2.7 },
    about: 'Gnome Theft Auto: the Bus Shelter. Glass-backed street shelter with a bench inside, 3.8 x 1.6 x 2.7 m; the frame takes the tint.',
    examine: [
      'A glass-backed hut on a stone floor, with a slatted bench inside and a green roof that the rain has learned to respect.',
      'Saying: the Snail Coach never comes when you are looking at it, which is why the gnomes sit inside and look at it anyway.',
      'Tip: sit on the inner bench with your back to the glass. The glass has opinions about draughts and will tell you so.',
      'Joke: the bench inside is so polite that it has never once asked anyone to move along, which is more than can be said for the gnomes.',
      'Above one end hangs a green board with SNAIL COACH painted on it, and a painted shell beside the words that nobody can explain.',
    ],
    parts: [
      { s: 'box', d: [3.8, 0.08, 1.6], at: [0, 0.04, 0], c: 'stone' },                 // floor slab
      { s: 'box', d: [3.6, 2.1, 0.06], at: [0, 1.13, -0.76], c: 'glass' },            // back glass
      { s: 'box', d: [0.06, 2.1, 1.6], at: [-1.87, 1.13, 0], c: 'glass' },            // end panels
      { s: 'box', d: [0.06, 2.1, 1.6], at: [1.87, 1.13, 0], c: 'glass' },
      { s: 'box', d: [3.9, 0.12, 1.8], at: [0, 2.64, 0], c: 'tint' },                 // roof slab
      { s: 'box', d: [0.08, 2.56, 0.08], at: [-1.86, 1.28, 0.78], c: 'tint' },        // corner posts
      { s: 'box', d: [0.08, 2.56, 0.08], at: [1.86, 1.28, 0.78], c: 'tint' },
      { s: 'box', d: [0.08, 2.56, 0.08], at: [-1.86, 1.28, -0.78], c: 'tint' },
      { s: 'box', d: [0.08, 2.56, 0.08], at: [1.86, 1.28, -0.78], c: 'tint' },
      { s: 'box', d: [3.0, 0.08, 0.4], at: [0, 0.41, -0.45], c: 'wood-light' },         // bench seat, top at 0.45
      { s: 'box', d: [0.1, 0.37, 0.36], at: [-1.3, 0.185, -0.45], c: 'iron-dark' },     // bench legs
      { s: 'box', d: [0.1, 0.37, 0.36], at: [1.3, 0.185, -0.45], c: 'iron-dark' },
      { s: 'box', d: [0.04, 0.4, 1.2], at: [1.76, 2.3, 0], c: 'green' },                // sign board inside one end
      { s: 'box', d: [0.02, 0.12, 1.0], at: [1.795, 2.3, 0], c: 'chalk' },            // sign lettering
      { s: 'ball', d: [0.12], at: [1.72, 2.05, 0.4], scale: [0.6, 1, 1], c: 'shell', seg: 8 }, // painted shell
    ],
  },
  {
    id: 'phone-box', name: 'Phone Box', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'phone'], emoji: [],
    tint: 'red',
    footprint: { r: 0.5, h: 2.4 },
    about: 'Gnome Theft Auto: the Phone Box. Red panelled kiosk with a glass door on +z, 1 x 1 x 2.4 m; the body takes the tint.',
    examine: [
      'A tall red kiosk of panelled walls with small square panes in its door, topped by a crown-shaped cap.',
      'Saying: go inside the red box and close the door, and the outside world goes quiet for a while, which is the whole point of it.',
      'Tip: the door is heavy and sticks in wet weather. Lean on it with your shoulder, not with your hat.',
      'Joke: the black box on the wall inside has been ringing for three hundred years, and it is still waiting for someone to answer.',
      'Someone has scratched a little ladder of notches into the inside of the door, and the notches stop halfway down as if the climber left in a hurry.',
    ],
    parts: [
      { s: 'box', d: [0.96, 0.06, 0.96], at: [0, 0.03, 0], c: 'stone-dark' },           // base
      { s: 'box', d: [0.9, 2.1, 0.9], at: [0, 1.11, 0], c: 'tint' },                   // body 0.06..2.16
      { s: 'box', d: [0.56, 1.8, 0.03], at: [0, 1.2, 0.465], c: 'glass' },             // front glass door
      { s: 'box', d: [0.56, 0.04, 0.02], at: [0, 0.9, 0.48], c: 'black' },              // door window bars
      { s: 'box', d: [0.56, 0.04, 0.02], at: [0, 1.5, 0.48], c: 'black' },
      { s: 'box', d: [0.04, 1.8, 0.02], at: [0, 1.2, 0.48], c: 'black' },
      { s: 'box', d: [0.02, 1.5, 0.6], at: [0.46, 1.25, 0], c: 'glass', mirror: true },  // side panes
      { s: 'box', d: [0.03, 0.04, 0.6], at: [0.475, 1.25, 0], c: 'black', mirror: true }, // side bars
      { s: 'box', d: [0.03, 1.5, 0.03], at: [0.475, 1.25, 0], c: 'black', mirror: true },
      { s: 'box', d: [1.0, 0.08, 1.0], at: [0, 2.2, 0], c: 'tint' },                    // cornice
      { s: 'cyl', d: [0.62, 0.5, 0.18], at: [0, 2.34, 0], c: 'tint', seg: 8 },          // crown roof
      { s: 'cone', d: [0.12, 0.12], at: [0, 2.5, 0], c: 'tint', seg: 8 },               // crown tip
    ],
  },
  {
    id: 'sandwich-board', name: 'Sandwich Board', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'sandwich'], emoji: [],
    tint: 'wood',
    footprint: { r: 0.3, h: 0.9 },
    about: 'Gnome Theft Auto: the Sandwich Board. A-frame chalkboard on a wooden frame, 0.6 x 0.5 x 0.9 m; the frame takes the tint.',
    examine: [
      'Two leaning chalk boards hinged at the top, with a wooden frame and bits of old chalk still clinging to the edges.',
      'Saying: a board that stands on two legs is always going somewhere, even if it is only as far as the next gutter.',
      'Tip: read the board from the side. From the front the chalk is all backwards and makes no sense at all.',
      'Joke: the board has been wiped clean so many times that it now only remembers the word special and insists on it.',
      'On the back of the left board somebody has drawn a small gnome with a very long beard and written not me underneath.',
    ],
    parts: [
      { s: 'box', d: [0.52, 0.8, 0.03], at: [0, 0.38, 0.08], rot: [-22, 0, 0], c: 'slate' },    // front board
      { s: 'box', d: [0.52, 0.8, 0.03], at: [0, 0.38, -0.08], rot: [22, 0, 0], c: 'slate' },   // back board
      { s: 'box', d: [0.3, 0.05, 0.01], at: [0, 0.484, 0.0703], rot: [-22, 0, 0], c: 'chalk' }, // chalk lines
      { s: 'box', d: [0.22, 0.04, 0.01], at: [0, 0.206, 0.183], rot: [-22, 0, 0], c: 'chalk' },
      { s: 'box', d: [0.04, 0.8, 0.04], at: [-0.28, 0.38, 0.08], rot: [-22, 0, 0], c: 'tint' }, // frame edges
      { s: 'box', d: [0.04, 0.8, 0.04], at: [0.28, 0.38, 0.08], rot: [-22, 0, 0], c: 'tint' },
      { s: 'box', d: [0.04, 0.8, 0.04], at: [-0.28, 0.38, -0.08], rot: [22, 0, 0], c: 'tint' },
      { s: 'box', d: [0.04, 0.8, 0.04], at: [0.28, 0.38, -0.08], rot: [22, 0, 0], c: 'tint' },
      { s: 'box', d: [0.6, 0.06, 0.06], at: [0, 0.8, 0], c: 'tint' },                       // hinge bar at the top
      { s: 'box', d: [0.6, 0.05, 0.06], at: [0, 0.025, 0.22], c: 'tint' },                  // foot rails
      { s: 'box', d: [0.6, 0.05, 0.06], at: [0, 0.025, -0.22], c: 'tint' },
    ],
  },
  {
    id: 'food-cart', name: 'Food Cart', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'food'], emoji: [],
    tint: 'red',
    trim: 'yellow',
    footprint: { r: 1.1, h: 2.2 },
    about: 'Gnome Theft Auto: the Food Cart. Steel cart on two wheels with a striped umbrella, 2.2 x 1.2 x 2.2 m; the umbrella takes the tint.',
    examine: [
      'A steel cart on two fat wheels, with a hatch on the front, a counter that folds out, and a big striped umbrella on a pole.',
      'Saying: the smell arrives long before the cart does, and the gnomes follow it the way geese follow a leader who is not sure of the way.',
      'Tip: stand well back from the hatch when the hot fat hisses. It spits further than you expect and never apologises.',
      'Joke: the cart has been pushed up and down the same street so often that its wheels have learned to hum a tune.',
      'A small tin plate is bolted to the handle, and on it someone has scratched a sum that adds up to exactly one more than anybody owes.',
    ],
    parts: [
      { s: 'box', d: [1.6, 0.2, 1.0], at: [0, 0.4, 0], c: 'iron-dark' },                 // chassis
      { s: 'box', d: [1.6, 0.6, 1.0], at: [0, 0.8, 0], c: 'steel' },                    // body 0.5..1.1
      { s: 'box', d: [1.1, 0.4, 0.04], at: [0, 0.85, 0.52], c: 'iron-dark' },           // hatch
      { s: 'box', d: [1.3, 0.05, 0.16], at: [0, 0.7, 0.56], c: 'steel' },                // counter ledge
      { s: 'cyl', d: [0.25, 0.25, 0.12], at: [0.85, 0.25, 0], rot: [0, 0, 90], c: 'iron-dark', seg: 8, mirror: true }, // wheels
      { s: 'cyl', d: [0.03, 0.03, 0.6], at: [0, 1.4, 0], c: 'steel', seg: 6 },           // umbrella pole 1.1..1.7
      { s: 'cone', d: [1.0, 0.4], at: [0, 1.9, 0], c: 'tint', seg: 8 },                  // striped umbrella, top at 2.1
      { s: 'ring', d: [1.0, 0.04], at: [0, 1.7, 0], rot: [90, 0, 0], c: 'trim' },        // umbrella edge band
      { s: 'cyl', d: [0.03, 0.03, 1.2], at: [0, 1.1, -0.6], rot: [0, 0, 90], c: 'steel', seg: 6 }, // handle bar
      { s: 'cyl', d: [0.03, 0.03, 0.6], at: [0.55, 0.8, -0.6], c: 'steel', seg: 6 },     // handle posts
      { s: 'cyl', d: [0.03, 0.03, 0.6], at: [-0.55, 0.8, -0.6], c: 'steel', seg: 6 },
    ],
  },
  {
    id: 'news-kiosk', name: 'News Kiosk', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'news'], emoji: [],
    tint: 'cloth',
    trim: 'white',
    footprint: { r: 1.3, h: 2.8 },
    about: 'Gnome Theft Auto: the News Kiosk. Small walk-up booth with a front hatch, awning and roof sign, 2.6 x 2 x 2.8 m; the walls take the tint.',
    examine: [
      'A small booth with a black hatch on the front, a crooked counter ledge, and a rack of coloured papers hanging beside the door.',
      'Saying: the paper in the rack is always a day old and always the most important thing a gnome has ever read.',
      'Tip: buy one sheet, never a bundle. The bundle is the only thing in the kiosk that really wants to be lifted.',
      'Joke: the sign on the roof says NEWS in letters so large that the kiosk is the only place in Turfton that has never needed to shout.',
      'Through the little side window you can just see a shelf of lost gloves, every pair folded in half and tied up with string.',
    ],
    parts: [
      { s: 'box', d: [2.6, 0.1, 2.0], at: [0, 0.05, 0], c: 'stone-dark' },                  // plinth
      { s: 'box', d: [2.6, 2.4, 0.12], at: [0, 1.3, -0.94], c: 'tint' },                    // back wall 0.1..2.5
      { s: 'box', d: [0.12, 2.4, 2.0], at: [-1.24, 1.3, 0], c: 'tint' },                   // side walls
      { s: 'box', d: [0.12, 2.4, 2.0], at: [1.24, 1.3, 0], c: 'tint' },
      { s: 'box', d: [0.03, 0.8, 1.0], at: [-1.31, 1.5, 0], c: 'glass' },                  // side windows
      { s: 'box', d: [0.03, 0.8, 1.0], at: [1.31, 1.5, 0], c: 'glass' },
      { s: 'box', d: [2.6, 0.7, 0.12], at: [0, 2.15, 0.94], c: 'tint' },                    // front panel above the hatch
      { s: 'box', d: [0.5, 1.7, 0.12], at: [-1.05, 0.95, 0.94], c: 'tint' },                // front panels either side
      { s: 'box', d: [0.5, 1.7, 0.12], at: [1.05, 0.95, 0.94], c: 'tint' },
      { s: 'box', d: [1.6, 1.7, 0.05], at: [0, 0.95, 0.975], c: 'black' },                 // hatch opening
      { s: 'box', d: [1.7, 0.08, 0.16], at: [0, 1.0, 1.01], c: 'wood' },                   // counter ledge
      { s: 'box', d: [1.9, 0.04, 0.36], at: [0, 1.85, 0.9], rot: [15, 0, 0], c: 'trim' },   // awning
      { s: 'box', d: [0.44, 0.7, 0.14], at: [-1.05, 0.55, 1.02], c: 'wood' },              // magazine rack
      { s: 'box', d: [0.12, 0.45, 0.02], at: [-1.22, 0.55, 1.09], c: 'red' },              // magazines
      { s: 'box', d: [0.12, 0.45, 0.02], at: [-1.05, 0.55, 1.09], c: 'yellow' },
      { s: 'box', d: [0.12, 0.45, 0.02], at: [-0.88, 0.55, 1.09], c: 'blue' },
      { s: 'box', d: [2.7, 0.12, 2.2], at: [0, 2.56, 0], c: 'slate' },                      // roof
      { s: 'box', d: [2.0, 0.3, 0.12], at: [0, 2.77, 0], c: 'yellow' },                     // roof sign
      { s: 'box', d: [1.6, 0.14, 0.13], at: [0, 2.77, 0], c: 'ink' },                      // sign lettering band
    ],
  },
  {
    id: 'street-banner-pole', name: 'Street Banner Pole', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'street'], emoji: [],
    tint: 'blue',
    trim: 'yellow',
    footprint: { r: 0.45, h: 4.5 },
    about: 'Gnome Theft Auto: the Street Banner Pole. Iron pole with a crossarm and a hanging cloth banner, 0.3 x 0.9 x 4.5 m; the banner takes the tint.',
    examine: [
      'A tall iron pole with a crossbar at the top and a long cloth banner hanging from one side, with a yellow stripe down the middle.',
      'Saying: a pole that flies a cloth is telling the whole town that somebody is in charge, even when nobody is.',
      'Tip: the banner catches the wind like a sail. Tie a loose end to the pole in a gale, or it will take you for a ride.',
      'Joke: the banner has been reading the same word for years, and the word is still being argued over at City Hall.',
      'A tiny brass hook is screwed into the foot of the pole, and somebody has hung a small clay bell from it that has never once rung.',
    ],
    parts: [
      { s: 'cyl', d: [0.1, 0.12, 0.3], at: [0, 0.15, 0], c: 'iron-dark', seg: 8 },        // foot
      { s: 'cyl', d: [0.03, 0.03, 4.4], at: [0, 2.2, 0], c: 'iron', seg: 6 },            // pole
      { s: 'box', d: [0.05, 0.05, 0.9], at: [0, 4.4, 0], c: 'iron' },                    // crossarm along z
      { s: 'box', d: [0.05, 2.0, 0.8], at: [0.1, 3.35, 0], c: 'tint' },                  // banner
      { s: 'box', d: [0.07, 0.4, 0.5], at: [0.1, 3.2, 0], c: 'trim' },                   // banner stripe
      { s: 'ball', d: [0.05], at: [0, 4.42, 0.42], c: 'iron', seg: 6 },                  // arm ends
      { s: 'ball', d: [0.05], at: [0, 4.42, -0.42], c: 'iron', seg: 6 },
      { s: 'ball', d: [0.05], at: [0, 4.47, 0], c: 'iron', seg: 6 },                     // finial
    ],
  },
  {
    id: 'dumpster', name: 'Dumpster', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'dumpster'], emoji: [],
    tint: 0x2f6e3a,
    footprint: { r: 1, h: 1.3 },
    about: 'Gnome Theft Auto: the Dumpster. Steel bin with a sloped lid and four small wheels, 2 x 1.2 x 1.3 m; the body takes the tint.',
    examine: [
      'A big green steel bin with a sloped lid on a hinge at the back, two lifting pockets on each end, and four small wheels.',
      'Saying: what goes in the big green bin stays in the big green bin, and so does everything else nearby that smells of it.',
      'Tip: lift the lid from the back, not the front. The front edge pinches, and the lid is heavier than it looks.',
      'Joke: the bin has been so full for so long that the lid has grown a moss beard, and the beard is more organised than the gnomes.',
      'Scratched into the lid is a row of small clay marks, like a counting game that somebody lost track of halfway through.',
    ],
    parts: [
      { s: 'box', d: [1.9, 0.9, 1.1], at: [0, 0.6, 0], c: 'tint' },                       // body 0.15..1.05
      { s: 'box', d: [1.92, 0.1, 1.12], at: [0, 1.13, 0], rot: [-6, 0, 0], c: 'tint' },   // sloped lid
      { s: 'cyl', d: [0.03, 0.03, 1.9], at: [0, 1.12, -0.56], rot: [0, 0, 90], c: 'steel', seg: 6 }, // hinge
      { s: 'box', d: [0.5, 0.3, 0.1], at: [0.55, 0.45, 0.6], c: 'iron-dark', mirror: true },    // front lift pockets
      { s: 'box', d: [0.5, 0.3, 0.1], at: [0.55, 0.45, -0.6], c: 'iron-dark', mirror: true },   // back lift pockets
      { s: 'cyl', d: [0.08, 0.08, 0.08], at: [0.8, 0.08, 0.45], rot: [0, 0, 90], c: 'iron-dark', seg: 8, mirror: true }, // wheels
      { s: 'cyl', d: [0.08, 0.08, 0.08], at: [0.8, 0.08, -0.45], rot: [0, 0, 90], c: 'iron-dark', seg: 8, mirror: true },
    ],
  },
  {
    id: 'bunting-span', name: 'Bunting Span', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'bunting'], emoji: [],
    tint: 'red',
    trim: 'yellow',
    footprint: { r: 7.6, h: 5.8 },
    about: 'Gnome Theft Auto: the Bunting Span. Two poles with a sagging string of triangle flags across the street, 15.2 x 0.3 x 5.8 m.',
    examine: [
      'Two thin poles with a long string hung between them, and a row of small triangle flags in red and yellow dangling below it.',
      'Saying: when the flags are up the street is having a party, and when they come down the street has had a long drought of parties.',
      'Tip: walk under the flags, not round them. The gnomes who walk round the flags are the ones who sneeze the most.',
      'Joke: the flags have been claimed as town property by three separate committees, and each one insists that the others are wrong.',
      'One flag is a slightly different yellow, and nobody will say which committee put it up or why it has not faded like the rest.',
    ],
    parts: [
      { s: 'box', d: [0.12, 5.8, 0.12], at: [7.45, 2.9, 0], c: 'iron', mirror: true },    // poles at x = +-7.45
      { s: 'box', d: [3.7403, 0.03, 0.03], at: [-5.5875, 5.43125, 0], rot: [0, 0, -5.18], c: 'bark' }, // string, 4 straight segments
      { s: 'box', d: [3.7267, 0.03, 0.03], at: [-1.8625, 5.20625, 0], rot: [0, 0, -1.73], c: 'bark' },
      { s: 'box', d: [3.7267, 0.03, 0.03], at: [1.8625, 5.20625, 0], rot: [0, 0, 1.73], c: 'bark' },
      { s: 'box', d: [3.7403, 0.03, 0.03], at: [5.5875, 5.43125, 0], rot: [0, 0, 5.18], c: 'bark' },
      { s: 'cone', d: [0.08, 0.18], at: [-6.6, 5.4133, 0], rot: [180, 0, 0], c: 'tint', seg: 6 },   // flags, tint and trim alternating
      { s: 'cone', d: [0.08, 0.18], at: [-5.4, 5.2965, 0], rot: [180, 0, 0], c: 'trim', seg: 6 },
      { s: 'cone', d: [0.08, 0.18], at: [-4.2, 5.2031, 0], rot: [180, 0, 0], c: 'tint', seg: 6 },
      { s: 'cone', d: [0.08, 0.18], at: [-3.0, 5.133, 0], rot: [180, 0, 0], c: 'trim', seg: 6 },
      { s: 'cone', d: [0.08, 0.18], at: [-1.8, 5.0863, 0], rot: [180, 0, 0], c: 'tint', seg: 6 },
      { s: 'cone', d: [0.08, 0.18], at: [-0.6, 5.0629, 0], rot: [180, 0, 0], c: 'trim', seg: 6 },
      { s: 'cone', d: [0.08, 0.18], at: [0.6, 5.0629, 0], rot: [180, 0, 0], c: 'tint', seg: 6 },
      { s: 'cone', d: [0.08, 0.18], at: [1.8, 5.0863, 0], rot: [180, 0, 0], c: 'trim', seg: 6 },
      { s: 'cone', d: [0.08, 0.18], at: [3.0, 5.133, 0], rot: [180, 0, 0], c: 'tint', seg: 6 },
      { s: 'cone', d: [0.08, 0.18], at: [4.2, 5.2031, 0], rot: [180, 0, 0], c: 'trim', seg: 6 },
      { s: 'cone', d: [0.08, 0.18], at: [5.4, 5.2965, 0], rot: [180, 0, 0], c: 'tint', seg: 6 },
      { s: 'cone', d: [0.08, 0.18], at: [6.6, 5.4133, 0], rot: [180, 0, 0], c: 'trim', seg: 6 },
    ],
  },
];
