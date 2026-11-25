// Gnome Theft Auto: Local 404's work sites beside the Skyway (site dressing, cracks, the Hard Hat Area reward).
import type { PrefabDef } from '../types';

export const GTA_SKYWAY_WORKS: readonly PrefabDef[] = [
  {
    id: 'site-cement-mixer', name: 'Cement Mixer', category: 'prop', uses: ['place'],
    tags: ['cement', 'mixer', 'concrete', 'drum', 'barrel', 'lorry', 'site', 'works', 'skyway', 'gta'], emoji: [],
    footprint: { r: 1.1, h: 1.6 },
    about: 'Gnome Theft Auto: a Local 404 cement mixer. A drum on a small chassis with two wheels, parked on the works yard. Plain colours.',
    examine: [
      'A big iron drum on a little cart, turning slowly on its axle, as though it is still making its mind up.',
      'Local 404 saying: the concrete sets fast, the cement sets slow, and the foreman sets off for lunch.',
      'Tip: do not lean on the drum. It has been rotating since the Skyway was poured, and it does not care who is holding on.',
      'Joke: the drum is labelled MIXER, which is the only thing about it that has ever been mixed up.',
      'Someone has chalked a number on the side. It is the number of loads poured, and it is only half right.',
    ],
    parts: [
      { s: 'box', d: [1.7, 0.25, 0.8], at: [0, 0.45, 0], c: 'iron-dark' },                                 // chassis
      { s: 'cyl', d: [0.3, 0.3, 0.2], at: [0.6, 0.3, 0.45], rot: [0, 0, 90], c: 'slate', seg: 10, mirror: true }, // wheels
      { s: 'cyl', d: [0.5, 0.4, 1.4], at: [0, 0.95, 0], rot: [0, 0, 90], c: 'steel', seg: 10 },          // drum
      { s: 'box', d: [0.4, 0.2, 0.5], at: [0.55, 0.9, 0.0], c: 'iron' },                                // hopper
    ],
  },
  {
    id: 'site-portaloo', name: 'Site Portaloo', category: 'prop', uses: ['place'],
    tags: ['portaloo', 'loo', 'toilet', 'portable', 'cabin', 'site', 'works', 'door', 'blue', 'gta'], emoji: [],
    footprint: { r: 0.9, h: 2.3 },
    about: 'Gnome Theft Auto: a Local 404 site portaloo. A blue plastic box 1.3 wide and 2.3 tall with a door on +z, a roof vent and a small sign.',
    examine: [
      'A tall blue box with a door and a vent in the roof, and it smells of exactly what you would expect.',
      'Site saying: the portaloo is the only room on the works where nobody has to be the foreman.',
      'Tip: knock first. There is always someone inside, and they are always pretending they were not.',
      'Joke: the door has a bolt on the inside and a sign on the outside that says OCCUPIED, which is the most honest thing on the site.',
      'The vent in the roof has never once been open. Nobody knows what it is for, and nobody has asked the portaloo.',
    ],
    parts: [
      { s: 'box', d: [1.3, 2.3, 1.3], at: [0, 1.15, 0], c: 'blue' },                                     // cabin
      { s: 'box', d: [1.4, 0.1, 1.4], at: [0, 2.35, 0], c: 'slate' },                                     // roof
      { s: 'box', d: [0.5, 1.8, 0.04], at: [0, 0.9, 0.67], c: 'steel' },                                  // door
      { s: 'box', d: [0.3, 0.1, 0.04], at: [0, 2.0, 0.67], c: 'black' },                                  // sign
      { s: 'box', d: [0.3, 0.1, 0.3], at: [0, 2.46, 0], c: 'black' },                                     // roof vent
    ],
  },
  {
    id: 'site-office', name: 'Site Office', category: 'prop', uses: ['place'],
    tags: ['office', 'cabin', 'hut', 'site', 'works', 'window', 'door', 'foreman', 'gta'], emoji: [],
    footprint: { r: 3, h: 3 },
    about: 'Gnome Theft Auto: the Local 404 site office. A white cabin 5 long, 2.8 deep and 2.4 tall with a slate roof, one window, a door and two steps on +z.',
    examine: [
      'A white cabin on blocks, with one window, one door and a roof that has been patched by someone who was not very tall.',
      'Foreman saying: the office is where the plans are kept, and the plans are kept where nobody can find them.',
      'Tip: the steps stick out at the front. Mind them on the way in, or the foreman will hear about it before you reach the desk.',
      'Joke: the window was put in so the foreman could watch the work. It has been watching the same empty yard since the job stopped.',
      'Somebody has pinned a rota to the door, and the rota has been wrong for so long it has become a sort of map.',
    ],
    parts: [
      { s: 'box', d: [5, 2.4, 2.8], at: [0, 1.2, 0], c: 'white' },                                       // cabin
      { s: 'box', d: [5.2, 0.2, 3.0], at: [0, 2.5, 0], c: 'slate' },                                       // roof
      { s: 'box', d: [1.0, 0.7, 0.04], at: [-1.2, 1.5, 1.42], c: 'glass' },                                // window
      { s: 'box', d: [0.9, 2.0, 0.04], at: [1.5, 1.0, 1.42], c: 'wood' },                                  // door
      { s: 'box', d: [1.0, 0.25, 0.5], at: [1.5, 0.125, 1.65], c: 'iron-dark' },                           // step
    ],
  },
  {
    id: 'site-tower-crane', name: 'Tower Crane', category: 'prop', uses: ['place'],
    tags: ['crane', 'tower', 'mast', 'jib', 'lattice', 'site', 'works', 'skyway', 'counterweight', 'gta'], emoji: [],
    footprint: { r: 1.2, h: 14 },
    about: 'Gnome Theft Auto: a Local 404 tower crane. A lattice mast about 14 tall with a jib, a counterweight and a small cab, on a square concrete base.',
    examine: [
      'A tall grey mast of criss-crossed bars, with a long arm out at the top and nothing hanging from it.',
      'Crane saying: the higher the arm, the less anybody can hear the foreman, which is why the cab is at the top.',
      'Tip: do not climb the mast to see the view. The view is of the Skyway, and the Skyway is already looking back.',
      'Joke: the counterweight is the heaviest thing on the site, and it is the only part of the crane that has ever been on time.',
      'The jib points at the Unfinished Span. Nobody has told the crane that the span was left unfinished.',
    ],
    parts: [
      { s: 'box', d: [1.6, 0.5, 1.6], at: [0, 0.25, 0], c: 'slate' },                                     // base
      { s: 'box', d: [0.1, 13, 0.1], at: [0.5, 7, 0.5], c: 'iron', mirror: true },                        // mast corner
      { s: 'box', d: [0.1, 13, 0.1], at: [0.5, 7, -0.5], c: 'iron', mirror: true },                       // mast corner
      { s: 'box', d: [0.08, 0.08, 1.4], at: [0, 6.5, 0.5], c: 'iron-dark' },                              // brace
      { s: 'box', d: [0.5, 0.5, 0.5], at: [0, 13.25, 0], c: 'iron-dark' },                                // slewing head
      { s: 'box', d: [0.8, 0.8, 1.0], at: [0, 13.4, -0.8], c: 'yellow' },                                 // cab
      { s: 'box', d: [0.3, 0.3, 4.0], at: [0, 13.2, 1.9], c: 'iron' },                                    // counterweight arm
      { s: 'box', d: [0.5, 0.5, 0.5], at: [0, 13.25, 3.7], c: 'slate' },                                  // counterweight
      { s: 'box', d: [0.3, 0.3, 9.0], at: [0, 13.2, -4.5], c: 'iron' },                                   // jib
    ],
  },
  {
    id: 'site-barrier', name: 'Road Barrier', category: 'prop', uses: ['place'],
    tags: ['barrier', 'striped', 'a-frame', 'red', 'white', 'site', 'works', 'board', 'warning', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a Local 404 road barrier. A red and white striped A-frame board on two splayed legs, 1.8 wide and 1 tall. Plain colours.',
    examine: [
      'A board on two splayed legs, painted in red and white stripes, the way all warnings on the Skyway are painted.',
      'Site saying: a barrier that is taller than the gnome is a barrier. A barrier shorter than the gnome is a suggestion.',
      'Tip: the barrier does not stop anybody. It only tells them they should have been stopped, and that is the most useful kind of wall.',
      'Joke: the stripes are red and white because nobody on the works could agree on a third colour, and two was the most they could afford.',
      'The board says KEEP OUT on the back, which is the side the gnome always sees last.',
    ],
    parts: [
      { s: 'box', d: [0.08, 0.95, 0.08], at: [-0.4, 0.475, 0], rot: [0, 0, 20], c: 'iron' },          // left leg
      { s: 'box', d: [0.08, 0.95, 0.08], at: [0.4, 0.475, 0], rot: [0, 0, -20], c: 'iron' },            // right leg
      { s: 'box', d: [0.25, 0.3, 0.05], at: [-0.375, 0.6, 0], c: 'red' },                                 // stripe
      { s: 'box', d: [0.25, 0.3, 0.05], at: [-0.125, 0.6, 0], c: 'white' },                              // stripe
      { s: 'box', d: [0.25, 0.3, 0.05], at: [0.125, 0.6, 0], c: 'red' },                                 // stripe
      { s: 'box', d: [0.25, 0.3, 0.05], at: [0.375, 0.6, 0], c: 'white' },                               // stripe
    ],
  },
  {
    id: 'site-sign-local-404', name: 'Local 404 Sign', category: 'prop', uses: ['place'],
    tags: ['sign', 'board', 'site', 'works', 'local', 'warning', 'yellow', 'black', 'notice', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Local 404 works sign. A yellow board with a black frame and a white bar, on two wooden posts about 2 tall. The name is implied by the colours, not written.',
    examine: [
      'A yellow board with a black frame, on two posts, and the sort of colours that make a gnome stand a little straighter.',
      'Local 404 saying: the sign says what the works are, and the works say what the sign was for, and both have been quiet since the job stopped.',
      'Tip: read it from the road, not from the yard. From the yard it is only a yellow board, which is the same thing the foreman says.',
      'Joke: the name on the sign was written in the top corner, but the corner has been rubbed off by generations of gnomes leaning on it.',
      'Someone has tied a small brass bell to one post. Nobody remembers why. It rings when the Skyway trembles, which is often.',
    ],
    parts: [
      { s: 'box', d: [0.1, 2.0, 0.1], at: [-0.6, 1.0, 0], c: 'wood-dark' },                                // left post
      { s: 'box', d: [0.1, 2.0, 0.1], at: [0.6, 1.0, 0], c: 'wood-dark' },                                 // right post
      { s: 'box', d: [1.6, 0.7, 0.08], at: [0, 1.6, 0], c: 'yellow' },                                     // board
      { s: 'box', d: [1.6, 0.06, 0.1], at: [0, 1.95, 0], c: 'black' },                                     // top frame
      { s: 'box', d: [1.6, 0.06, 0.1], at: [0, 1.25, 0], c: 'black' },                                     // bottom frame
      { s: 'box', d: [0.06, 0.7, 0.1], at: [-0.77, 1.6, 0], c: 'black', mirror: true },                    // side frames
      { s: 'box', d: [1.4, 0.16, 0.1], at: [0, 1.6, 0], c: 'white' },                                      // white bar
    ],
  },
  {
    id: 'site-rubble', name: 'Broken Concrete', category: 'prop', uses: ['place'],
    tags: ['rubble', 'concrete', 'chunks', 'rebar', 'broken', 'debris', 'stone', 'skyway', 'crack', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a pile of broken concrete from a crack in the Skyway, with rebar sticking out. Scatter only. Plain colours.',
    examine: [
      'Chunks of grey concrete with a bent iron rod poking out of the top, as if the Skyway had tried to sneeze.',
      'Local 404 saying: concrete breaks where it is weakest, and that is always where the foreman just stood.',
      'Tip: step round the rubble, not over it. The rebar catches a boot as well as a cart wheel.',
      'Joke: the pile is labelled for recycling. Nobody has ever worked out how to recycle a hole.',
      'One of the chunks has a neat round dent in it, the exact size of a gnome hat. Nobody admits to making it.',
    ],
    parts: [
      { s: 'box', d: [0.5, 0.3, 0.4], at: [0, 0.15, 0], c: 'stone' },                                       // chunk
      { s: 'box', d: [0.35, 0.25, 0.3], at: [0.45, 0.125, 0.2], rot: [0, 20, 0], c: 'stone-dark' },        // chunk
      { s: 'box', d: [0.3, 0.2, 0.3], at: [-0.4, 0.1, -0.25], rot: [0, -15, 0], c: 'stone' },              // chunk
      { s: 'cyl', d: [0.02, 0.02, 0.9], at: [-0.1, 0.43, -0.1], rot: [0, 0, 70], c: 'iron-dark', seg: 6 }, // rebar
    ],
  },
  {
    id: 'site-hazard-tape', name: 'Hazard Tape Posts', category: 'prop', uses: ['place'],
    tags: ['tape', 'hazard', 'posts', 'stripe', 'yellow', 'black', 'barrier', 'site', 'works', 'crack', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: two hazard tape posts with a yellow and black tape strip between them, 1 wide. Posts stand on the ground, the tape hangs at 0.85. Plain colours.',
    examine: [
      'Two thin posts with a strip of yellow and black tape strung between them, flapping at the height of a gnome.',
      'Site saying: tape keeps the gnomes out, and the gnomes keep the tape, and it is hard to say which is more useful.',
      'Tip: the tape only means keep out. It does not mean keep out for ever, and it does not mean keep out of the gap.',
      'Joke: the tape has been run beside the crack, not across it, because the foreman said a crack is not a door.',
      'Someone has written DO NOT CROSS on the tape in marker. It has been crossed so many times the marker has worn off.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 1.0], at: [-0.5, 0.5, 0], c: 'iron-dark', seg: 6 },                       // left post
      { s: 'cyl', d: [0.03, 0.03, 1.0], at: [0.5, 0.5, 0], c: 'iron-dark', seg: 6 },                        // right post
      { s: 'box', d: [0.2, 0.12, 0.02], at: [-0.4, 0.85, 0], c: 'yellow' },                               // tape
      { s: 'box', d: [0.2, 0.12, 0.02], at: [-0.2, 0.85, 0], c: 'black' },                                // tape
      { s: 'box', d: [0.2, 0.12, 0.02], at: [0.0, 0.85, 0], c: 'yellow' },                                // tape
      { s: 'box', d: [0.2, 0.12, 0.02], at: [0.2, 0.85, 0], c: 'black' },                                 // tape
      { s: 'box', d: [0.2, 0.12, 0.02], at: [0.4, 0.85, 0], c: 'yellow' },                                // tape
    ],
  },
  {
    id: 'site-plank-stack', name: 'Plank Stack', category: 'prop', uses: ['place'],
    tags: ['planks', 'plank', 'wood', 'stack', 'timber', 'wood-light', 'site', 'works', 'ramp', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a stack of six timber planks for the Local 404 plank ramps. Plain wood, no tint.',
    examine: [
      'Six planks of pale timber stacked neatly, which is more than can be said for anything else on the site.',
      'Carpenter saying: a plank laid on the trestle is a ramp, and a plank laid on the ground is a path, and a plank in the air is a story.',
      'Tip: count the planks before you take one. The stack is always one short, and the short one is always the good one.',
      'Joke: the planks are stacked by length, but the length is only guessed, so the stack is also guessed.',
      'Someone has scratched a gnome-sized notch into the top plank. It fits nothing, and nobody has tried very hard to make it fit.',
    ],
    parts: [
      { s: 'box', d: [2.2, 0.08, 0.28], at: [0, 0.04, 0], c: 'wood-light' },                              // plank 1
      { s: 'box', d: [2.2, 0.08, 0.28], at: [0, 0.125, 0], c: 'wood' },                                    // plank 2
      { s: 'box', d: [2.2, 0.08, 0.28], at: [0, 0.21, 0], c: 'wood-light' },                              // plank 3
      { s: 'box', d: [2.2, 0.08, 0.28], at: [0, 0.295, 0], c: 'wood' },                                   // plank 4
      { s: 'box', d: [2.2, 0.08, 0.28], at: [0, 0.38, 0], c: 'wood-light' },                              // plank 5
      { s: 'box', d: [2.2, 0.08, 0.28], at: [0, 0.465, 0], c: 'wood' },                                   // plank 6
    ],
  },
  {
    id: 'site-cone', name: 'Traffic Cone', category: 'prop', uses: ['place'],
    tags: ['cone', 'traffic', 'orange', 'site', 'works', 'warning', 'marker', 'skyway', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a Local 404 traffic cone. An orange cone with a white band on a black square base, 0.6 tall. Used by the work sites and the cracks.',
    examine: [
      'An orange cone with a white band round its middle and a black base, which is the best a traffic cone can hope for.',
      'Works saying: the cone is there to be walked round. A cone that is walked into is a cone that has done its job.',
      'Tip: put the cone where the gnome will see it. A cone that is hidden behind a barrier is only a rumour.',
      'Joke: the cones on the Skyway are counted every morning, and every morning the count goes up, which nobody can explain.',
      'The white band is repainted each week. The orange has never been repainted, because it has never once come off.',
    ],
    parts: [
      { s: 'box', d: [0.5, 0.04, 0.5], at: [0, 0.02, 0], c: 'black' },                                     // base
      { s: 'cone', d: [0.2, 0.55], at: [0, 0.3, 0], c: 'orange', seg: 8 },                                  // cone
      { s: 'cyl', d: [0.12, 0.13, 0.08], at: [0, 0.3, 0], c: 'white', seg: 8 },                             // white band
    ],
  },
  {
    id: 'hazard-tape-scarf', name: 'Hazard Tape Scarf', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, 0, 0.01] },
    tags: ['scarf', 'hazard', 'tape', 'yellow', 'black', 'stripe', 'neck', 'site', 'works', 'skyway', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Hazard Tape Scarf, a yellow and black striped scarf with a tail, from the Local 404 work sites and the cracks. Plain colours.',
    examine: [
      'A scarf of yellow and black stripes, the colours of a hazard warning and of a very bad afternoon on the Skyway.',
      'Local 404 saying: a scarf that can be seen in the dark is worth two that cannot, and three that are only orange.',
      'Tip: knot it at the back. A tail that flaps in your face at the edge of a crack is a poor way to find out the drop is there.',
      'Joke: the tape goes round the scarf because the tape came first and the gnome came second, and the scarf has never been asked.',
      'Someone has stitched a small yellow tag inside the collar. It reads CAUTION, and the last wearer swears it said BOLD.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.035], at: [0, 0.04, -0.05], rot: [90, 0, 0], c: 'yellow', seg: 10 },           // scarf loop
      { s: 'ring', d: [0.203, 0.012], at: [0, 0.04, -0.05], rot: [90, 0, 0], c: 'black', seg: 10 },          // black stripe
      { s: 'box', d: [0.09, 0.2, 0.025], at: [0.03, 0.12, 0.19], c: 'yellow' },                             // tail
      { s: 'box', d: [0.09, 0.03, 0.03], at: [0.03, 0.09, 0.2], c: 'black' },                               // tail stripe
      { s: 'box', d: [0.09, 0.03, 0.03], at: [0.03, 0.15, 0.2], c: 'black' },                               // tail stripe
    ],
  },
];
