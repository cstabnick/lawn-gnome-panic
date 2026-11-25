// Gnome Theft Auto (E13): Rootwell University's street and story props (founder's statue, sundial, banner, chalk board,
// lab bench, lecture bench, books, essay, paper plane, ornithopter). Scenery for games/gnome-theft-auto campus/.
import type { PrefabDef } from '../types';

export const GTA_CAMPUS_PROPS: readonly PrefabDef[] = [
  {
    id: 'founder-statue', name: 'Founder Statue', category: 'prop', uses: ['place'],
    tags: ['statue', 'founder', 'bronze', 'plumb', 'gnome', 'plinth', 'rootwell', 'campus', 'gta'], emoji: [],
    tint: 0x8a6a3a,
    footprint: { r: 0.8, h: 3.2 },
    about: 'Gnome Theft Auto: the Founder Statue. A bronze gnome in a gown and mortarboard holding a plumb bob out at arm\'s length, on a stone plinth about 3.2 m tall. Life-size metres, plaque on the plinth front (+z) left blank for the game to write on.',
    examine: [
      'A bronze gnome in a gown and mortarboard, holding a plumb bob out at arm\'s length as if the world might be slightly out of true.',
      'Saying: a level line begins with a plumb bob, and a plumb bob begins with a founder who does not trust the ground.',
      'Tip: the plumb bob always points straight down, so the statue always points at the lowest point in the yard.',
      'Joke: the bronze has gone green in exactly the places the founder stood still to wait for a grant.',
      'The plaque is blank. The Rootwell office says the wording is under review, pending a ruling from the Dean.',
    ],
    parts: [
      { s: 'box', d: [1.4, 1.2, 1.4], at: [0, 0.6, 0], c: 'stone' },                                       // plinth
      { s: 'box', d: [0.8, 0.5, 0.03], at: [0, 0.6, 0.715], c: 'tint' },                                   // plaque, 0.03 proud
      { s: 'cyl', d: [0.22, 0.32, 1.0], at: [0, 1.7, 0], c: 'tint', seg: 8 },                            // gown
      { s: 'box', d: [0.5, 0.45, 0.32], at: [0, 2.42, 0], c: 'tint' },                                    // shoulders
      { s: 'box', d: [0.1, 0.1, 0.55], at: [0.2, 2.42, 0.4], c: 'tint' },                                 // arm, held out
      { s: 'ball', d: [0.06], at: [0.2, 2.42, 0.7], c: 'tint', seg: 6 },                                  // hand
      { s: 'box', d: [0.01, 0.44, 0.01], at: [0.2, 2.14, 0.7], c: 'iron' },                               // plumb string
      { s: 'cone', d: [0.04, 0.08], at: [0.2, 1.88, 0.7], rot: [180, 0, 0], c: 'tint', seg: 6 },          // plumb bob
      { s: 'ball', d: [0.19], at: [0, 2.9, 0], c: 'tint', seg: 8 },                                       // head
      { s: 'box', d: [0.6, 0.04, 0.6], at: [0, 3.11, 0], c: 'tint' },                                     // mortarboard
    ],
  },
  {
    id: 'quad-sundial', name: 'Quad Sundial', category: 'prop', uses: ['place'],
    tags: ['sundial', 'dial', 'gnomon', 'stone', 'bronze', 'time', 'shadow', 'column', 'rootwell', 'campus'], emoji: [],
    footprint: { r: 0.4, h: 1.1 },
    about: 'Gnome Theft Auto: the Quad Sundial. A stone baluster column about 1.1 m tall, a round bronze dial plate with tick marks and a triangular gnomon (a wedge) standing up from it. Life-size metres.',
    examine: [
      'A stone column with a round bronze dial on top, and a triangular blade standing up from the middle to throw a shadow across the numbers.',
      'Saying: the shadow tells the time, but only in the sunshine, which is why the Rootwell clock is kept in the sun.',
      'Tip: the blade is called the gnomon. Stand in the shadow it throws and you will know the hour, and very little else.',
      'Joke: the gnomon is the only part of the sundial that does any work. The dial is for looking pleased about it.',
      'The numbers are carved in the wrong order on purpose. Professor Sextant says the shadow goes that way, and nobody has checked.',
    ],
    parts: [
      { s: 'cyl', d: [0.25, 0.25, 0.1], at: [0, 0.05, 0], c: 'stone-dark', seg: 8 },                        // plinth
      { s: 'cyl', d: [0.1, 0.14, 0.8], at: [0, 0.5, 0], c: 'stone', seg: 8 },                              // baluster column
      { s: 'cyl', d: [0.35, 0.35, 0.04], at: [0, 0.82, 0], c: 'brass', seg: 12 },                         // dial plate
      { s: 'box', d: [0.02, 0.02, 0.06], at: [0.28, 0.845, 0], c: 'iron-dark' },                          // tick mark, east
      { s: 'box', d: [0.02, 0.02, 0.06], at: [-0.28, 0.845, 0], c: 'iron-dark' },                         // tick mark, west
      { s: 'box', d: [0.02, 0.02, 0.06], at: [0, 0.845, 0.28], c: 'iron-dark' },                          // tick mark, south
      { s: 'wedge', d: [0.04, 0.3, 0.3], at: [0, 0.99, 0], c: 'brass' },                                  // gnomon
    ],
  },
  {
    id: 'college-banner', name: 'College Banner', category: 'prop', uses: ['place'],
    tags: ['banner', 'flag', 'college', 'pole', 'crest', 'shield', 'cloth', 'rootwell', 'campus', 'gta'], emoji: [],
    tint: 'red', trim: 'gold',
    footprint: { r: 0.5, h: 4.0 },
    about: 'Gnome Theft Auto: the College Banner. A pole about 4 m tall with a cross-bar and a hanging cloth banner (red, takes the tint) with a gold stripe (trim) and a small white crest. Life-size metres.',
    examine: [
      'A tall iron pole with a cross-bar at the top, and a red cloth hanging from it with a gold stripe and a small crest of two shields.',
      'Saying: a banner is a cloth that has been told it is important, and it hangs very seriously for the entire term.',
      'Tip: the crest is a small shield with a white field and a point. The point is the bit that shows, so do not put anything on it.',
      'Joke: the college motto is printed on the banner, and it is so long that the wind has given up reading it.',
      'The gold stripe is made of the same thread as the Dean\'s ledger, which is why the cloth looks slightly sad in the rain.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 4.0], at: [0, 2.0, 0], c: 'iron-dark', seg: 6 },                         // pole
      { s: 'ball', d: [0.05], at: [0, 4.02, 0], c: 'gold', seg: 6 },                                       // pole finial
      { s: 'box', d: [0.9, 0.05, 0.05], at: [0, 3.9, 0], c: 'iron-dark' },                                // cross-bar
      { s: 'box', d: [0.55, 1.62, 0.02], at: [0, 3.06, 0], c: 'tint' },                                   // cloth
      { s: 'box', d: [0.55, 0.14, 0.02], at: [0, 2.6, 0.01], c: 'trim' },                                 // gold stripe, 0.02 proud
      { s: 'box', d: [0.2, 0.2, 0.02], at: [0, 3.35, 0.02], c: 'white' },                                 // crest, top
      { s: 'box', d: [0.14, 0.14, 0.02], at: [0, 3.2, 0.02], rot: [0, 0, 45], c: 'white' },               // crest, point
    ],
  },
  {
    id: 'chalk-equation-board', name: 'Chalk Equation Board', category: 'prop', uses: ['place'],
    tags: ['chalkboard', 'blackboard', 'board', 'easel', 'chalk', 'equation', 'sums', 'lecture', 'rootwell', 'campus'], emoji: [],
    footprint: { r: 0.9, h: 1.8 },
    about: 'Gnome Theft Auto: the Chalk Equation Board. A dark green blackboard on an easel about 1.8 m tall, in a wooden frame, with a chalk ledge, white scribbles and a duster on the ledge. Life-size metres.',
    examine: [
      'A dark green board on a pair of splayed legs, with white chalk scribbles that look like sums someone was very sure about.',
      'Saying: a sum on the board is only finished when the chalk runs out, and the chalk at Rootwell has never once run out.',
      'Tip: rub it with the duster before you write. Yesterday\'s equation is still there, underneath, and it is not finished.',
      'Joke: the answer at the bottom is circled twice. Nobody has checked the working, and the working is in pencil on the ceiling.',
      'The duster on the ledge has been used so often it is now just a grey cloud on a stick, and it still does the job.',
    ],
    parts: [
      { s: 'box', d: [0.05, 1.46, 0.05], at: [-0.6, 0.7, -0.25], rot: [15.9, 0, 0], c: 'wood-dark', mirror: true },  // easel legs
      { s: 'box', d: [1.6, 1.0, 0.04], at: [0, 1.3, 0], c: 0x23392b },                                       // board
      { s: 'box', d: [1.7, 0.08, 0.08], at: [0, 1.84, 0], c: 'wood' },                                        // frame, top
      { s: 'box', d: [1.7, 0.08, 0.08], at: [0, 0.76, 0], c: 'wood' },                                        // frame, bottom
      { s: 'box', d: [0.08, 1.12, 0.08], at: [0.84, 1.3, 0], c: 'wood', mirror: true },                       // frame, sides
      { s: 'box', d: [1.5, 0.04, 0.1], at: [0, 0.72, 0.09], c: 'wood-light' },                                // chalk ledge
      { s: 'box', d: [0.5, 0.03, 0.02], at: [-0.2, 1.55, 0.03], rot: [0, 0, 4], c: 'chalk' },                 // scribble, sum
      { s: 'box', d: [0.3, 0.03, 0.02], at: [0.3, 1.3, 0.03], rot: [0, 0, -6], c: 'chalk' },                  // scribble, line
      { s: 'box', d: [0.4, 0.03, 0.02], at: [-0.3, 1.1, 0.03], rot: [0, 0, 2], c: 'chalk' },                  // scribble, line
      { s: 'box', d: [0.2, 0.03, 0.02], at: [0.25, 1.55, 0.03], c: 'chalk' },                                 // scribble, equals sign
      { s: 'box', d: [0.2, 0.08, 0.08], at: [0.6, 0.78, 0.13], c: 'wool' },                                   // duster
    ],
  },
  {
    id: 'lab-bench', name: 'Lab Bench', category: 'prop', uses: ['place'],
    tags: ['lab', 'bench', 'table', 'flask', 'burner', 'science', 'tap', 'cupboard', 'crucible', 'rootwell', 'campus'], emoji: [],
    footprint: { r: 1.2, h: 0.95 },
    about: 'Gnome Theft Auto: the Lab Bench. A wooden cupboard bench about 2.4 m long with a black top, a brass-tap sink, three glowing glass flasks and a burner. Life-size metres, cupboard doors on +z.',
    examine: [
      'A long wooden cupboard with a black top, a tap at the back and three flasks glowing green, blue and pink, each one bubbling politely.',
      'Saying: a good experiment is one that fails in a colour you can describe, and the Crucible Block has had a great many colours.',
      'Tip: turn the tap slowly. The pipes at Rootwell are old, and they sing when they are rushed.',
      'Joke: the burner is kept lit at all times so that nobody has to remember how to light it, which is the whole of the lab\'s safety plan.',
      'Every drawer is labelled. Several are labelled "do not open" and the labels have been opened.',
    ],
    parts: [
      { s: 'box', d: [2.36, 0.88, 0.84], at: [0, 0.44, 0], c: 'wood' },                                     // cupboard body
      { s: 'box', d: [2.4, 0.06, 0.9], at: [0, 0.91, 0], c: 'black' },                                        // black top
      { s: 'box', d: [1.1, 0.8, 0.02], at: [0.6, 0.44, 0.43], c: 'wood-dark', mirror: true },                // cupboard doors
      { s: 'box', d: [0.03, 0.12, 0.03], at: [0.1, 0.6, 0.45], c: 'steel', mirror: true },                   // door handles
      { s: 'cyl', d: [0.025, 0.025, 0.22], at: [0.9, 1.05, -0.32], c: 'steel', seg: 6 },                     // tap riser
      { s: 'box', d: [0.02, 0.02, 0.2], at: [0.9, 1.15, -0.22], c: 'steel' },                                 // tap spout
      { s: 'ball', d: [0.07], at: [-0.7, 1.01, 0.1], c: 'emerald', glow: true, seg: 8 },                     // green flask
      { s: 'cyl', d: [0.02, 0.025, 0.1], at: [-0.7, 1.1, 0.1], c: 'emerald', glow: true, seg: 6 },           // green flask neck
      { s: 'ball', d: [0.07], at: [-0.25, 1.01, 0.1], c: 'sapphire', glow: true, seg: 8 },                  // blue flask
      { s: 'cyl', d: [0.02, 0.025, 0.1], at: [-0.25, 1.1, 0.1], c: 'sapphire', glow: true, seg: 6 },        // blue flask neck
      { s: 'ball', d: [0.07], at: [0.2, 1.01, 0.1], c: 'pink', glow: true, seg: 8 },                         // pink flask
      { s: 'cyl', d: [0.02, 0.025, 0.1], at: [0.2, 1.1, 0.1], c: 'pink', glow: true, seg: 6 },               // pink flask neck
      { s: 'cyl', d: [0.06, 0.06, 0.08], at: [-0.1, 0.98, 0.25], c: 'iron-dark', seg: 8 },                   // burner base
      { s: 'cone', d: [0.03, 0.08], at: [-0.1, 1.06, 0.25], c: 'flame', glow: true, seg: 6 },                // burner flame
    ],
  },
  {
    id: 'lecture-bench-row', name: 'Lecture Bench Row', category: 'prop', uses: ['place'],
    tags: ['lecture', 'bench', 'seat', 'seats', 'row', 'desk', 'ledge', 'hall', 'tier', 'wood', 'rootwell', 'campus'], emoji: [],
    tint: 'wood',
    footprint: { r: 2.0, h: 1.0 },
    about: 'Gnome Theft Auto: the Lecture Bench Row. One row of lecture seating about 4 m wide: a long wooden bench with a backrest, a writing ledge in front on shared end panels. Life-size metres, sitters face +z.',
    examine: [
      'A long wooden bench with a high back and a writing ledge in front of it, both held up by two end panels worn pale by elbows.',
      'Saying: the back row hears everything and writes nothing, and the front row writes everything and hears nothing.',
      'Tip: sit in the middle. The ends are for the late, and the late are seated on the ends by the Dean personally.',
      'Joke: the ledge is exactly the height of a gnome\'s chin when reading, which is why every lecture ends with a nap.',
      'Someone has carved a tiny ant into the ledge. Nobody remembers carving it, and it is always facing the door.',
    ],
    parts: [
      { s: 'box', d: [0.08, 0.92, 0.85], at: [1.96, 0.46, 0], c: 'tint', mirror: true },                       // end panels
      { s: 'box', d: [3.84, 0.06, 0.38], at: [0, 0.45, -0.1], c: 'wood-light' },                              // bench seat
      { s: 'box', d: [3.84, 0.45, 0.05], at: [0, 0.7, -0.3], c: 'wood' },                                    // backrest
      { s: 'box', d: [3.84, 0.05, 0.3], at: [0, 0.72, 0.2], c: 'wood-light' },                               // writing ledge
      { s: 'box', d: [3.84, 0.2, 0.03], at: [0, 0.56, 0.35], c: 'wood' },                                     // ledge front panel
      { s: 'box', d: [3.84, 0.12, 0.08], at: [0, 0.2, -0.1], c: 'wood-dark' },                               // stretcher
    ],
  },
  {
    id: 'book-pile', name: 'Book Pile', category: 'prop', uses: ['place'],
    tags: ['books', 'book', 'pile', 'stack', 'tomes', 'library', 'reading', 'volumes', 'rootwell', 'campus'], emoji: [],
    about: 'Gnome Theft Auto: the Book Pile. A messy stack of seven books in different colours, slightly turned, about 0.5 m tall. Life-size metres, stands on the ground.',
    examine: [
      'Seven books stacked in no particular order, some slightly turned, as if each was pulled out of the wrong place in a hurry.',
      'Saying: a book is a room you can carry, and a stack of books is a whole house that has been put down for a moment.',
      'Tip: take the top book first. The bottom book is the one that holds the rest up, and it is never, ever the one you wanted.',
      'Joke: the spines are all the same height on the outside and very different on the inside, which is the Long Shelf in a nutshell.',
      'A cream bookmark sticks out of the pile at an angle. It was put there by someone who meant to come back, and has not.',
    ],
    parts: [
      { s: 'box', d: [0.22, 0.068, 0.16], at: [0, 0.034, 0], rot: [0, 8, 0], c: 'red' },                          // book 1
      { s: 'box', d: [0.22, 0.068, 0.16], at: [0.01, 0.104, -0.01], rot: [0, -5, 0], c: 'blue' },               // book 2
      { s: 'box', d: [0.2, 0.068, 0.16], at: [-0.01, 0.174, 0.01], rot: [0, 12, 0], c: 'green' },               // book 3
      { s: 'box', d: [0.22, 0.068, 0.17], at: [0.015, 0.244, 0], rot: [0, -10, 0], c: 'yellow' },               // book 4
      { s: 'box', d: [0.21, 0.068, 0.16], at: [-0.005, 0.314, -0.01], rot: [0, 4, 0], c: 'purple' },            // book 5
      { s: 'box', d: [0.22, 0.068, 0.16], at: [0.01, 0.384, 0.01], rot: [0, -3, 0], c: 'orange' },              // book 6
      { s: 'box', d: [0.2, 0.068, 0.15], at: [0, 0.454, 0], rot: [0, 9, 0], c: 'leather' },                     // book 7
      { s: 'box', d: [0.02, 0.005, 0.1], at: [0.09, 0.4, 0.02], rot: [0, 25, 0], c: 'paper' },                  // bookmark
    ],
  },
  {
    id: 'essay-page', name: 'Essay Page', category: 'document', uses: ['place', 'hold'],
    tags: ['essay', 'page', 'paper', 'sheet', 'homework', 'writing', 'document', 'grade', 'rootwell', 'campus'], emoji: ['📄'],
    grip: [0, 0.01, 0.1],
    about: 'Gnome Theft Auto: the Essay Page. A single handwritten page lying flat: cream paper with grey ruled lines and a red C- mark. About 0.3 x 0.21 m. Hold it by the bottom edge.',
    examine: [
      'A single cream page covered in neat grey lines of handwriting, with a red C- circled in the corner like a small angry bird.',
      'Saying: an essay is a plan for a place you have not been yet, written down before the walk gets too long.',
      'Tip: read the margin first. The margin is where the grade is decided, and it is usually written in red by a gnome in a hurry.',
      'Joke: the C- is generous. The first line reads "In the beginning there was the Yard", which has not been marked down since.',
      'The last line is smudged with what might be sugar. The landlords have been asking for their share of the essay fee.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.01, 0.21], at: [0, 0.005, 0], c: 'paper' },                                      // page
      { s: 'box', d: [0.24, 0.002, 0.004], at: [0, 0.0115, -0.08], c: 'slate' },                              // ruled line
      { s: 'box', d: [0.24, 0.002, 0.004], at: [0, 0.0115, -0.04], c: 'slate' },                             // ruled line
      { s: 'box', d: [0.24, 0.002, 0.004], at: [0, 0.0115, 0], c: 'slate' },                                  // ruled line
      { s: 'box', d: [0.24, 0.002, 0.004], at: [0, 0.0115, 0.04], c: 'slate' },                              // ruled line
      { s: 'box', d: [0.24, 0.002, 0.004], at: [0, 0.0115, 0.08], c: 'slate' },                              // ruled line
      { s: 'box', d: [0.04, 0.002, 0.01], at: [0.1, 0.0135, -0.05], c: 'red' },                              // red C, top
      { s: 'box', d: [0.01, 0.002, 0.04], at: [0.075, 0.0135, -0.025], c: 'red' },                           // red C, stroke
      { s: 'box', d: [0.04, 0.002, 0.01], at: [0.1, 0.0135, 0], c: 'red' },                                  // red C, bottom
      { s: 'box', d: [0.02, 0.002, 0.01], at: [0.145, 0.0135, -0.025], c: 'red' },                           // red dash
    ],
  },
  {
    id: 'paper-plane', name: 'Paper Plane', category: 'prop', uses: ['place', 'hold', 'throw'],
    tags: ['plane', 'aeroplane', 'paper', 'glider', 'dart', 'toy', 'fold', 'throw', 'rootwell', 'campus'], emoji: ['✈'],
    grip: [0, 0.012, -0.05],
    about: 'Gnome Theft Auto: the Paper Plane. A folded paper aeroplane about 0.35 m long: a fuselage, two angled wings and a tail fin, all white. Hold it by the fuselage and throw it.',
    examine: [
      'A folded paper aeroplane with two crisp wings and a tail fin, folded so tightly that the crease along the middle is sharp enough to cut a thumb.',
      'Saying: a paper plane flies as far as its last fold, and the Rootwell physicists have spent a term on that single sentence.',
      'Tip: throw it gently. The wind over the Field is stronger than it looks, and the Field is a very long way to walk back.',
      'Joke: the plane is marked "Department of Aeronautics, one working plane", which is a different plane and a different department.',
      'It has a small pencilled name on one wing. The name is smudged, and the plane is still going round the Quad.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.024, 0.34], at: [0, 0.012, 0], c: 'white' },                                    // fuselage
      { s: 'box', d: [0.18, 0.004, 0.12], at: [0.12, 0.022, 0.02], rot: [0, 0, -10], c: 'white', mirror: true }, // wings
      { s: 'box', d: [0.005, 0.02, 0.06], at: [0, 0.034, -0.15], c: 'white' },                                 // tail fin
    ],
  },
  {
    id: 'ornithopter-frame', name: 'Ornithopter Frame', category: 'prop', uses: ['place'],
    tags: ['ornithopter', 'flying', 'machine', 'wings', 'frame', 'aeroplane', 'pedal', 'contraption', 'rootwell', 'campus'], emoji: [],
    footprint: { r: 1.5, h: 2.0 },
    about: 'Gnome Theft Auto: the Ornithopter Frame. A half-built flapping-wing flying machine about 4 m across: a wooden seat frame on two little wheels, one canvas wing fixed on ribs, the other wing bare ribs, and a pedal crank at the front.',
    examine: [
      'A wooden seat on two little wheels with a pair of wings on struts, one wing covered in canvas and the other left as bare ribs.',
      'Saying: a machine that flaps its wings is a machine that expects to fly, and the expectation has been the hardest part to build.',
      'Tip: pedal the crank gently, the way the bicycle-makers in Bodger\'s Shed suggest. Hard pedalling is what breaks the struts.',
      'Joke: the bare wing is the one that works, because nobody has managed to hang a canvas on it without it falling off.',
      'The seat has a cushion of straw and a sign reading "Do not sit: frame not yet approved by the Dean". Someone sat anyway.',
    ],
    parts: [
      { s: 'cyl', d: [0.25, 0.25, 0.05], at: [0.6, 0.25, -0.4], rot: [0, 0, 90], c: 'black', seg: 8, mirror: true },  // wheels
      { s: 'box', d: [0.06, 0.06, 2.2], at: [0.5, 0.45, 0], c: 'wood', mirror: true },                              // seat rails
      { s: 'box', d: [1.0, 0.05, 0.5], at: [0, 0.5, -0.4], c: 'wood-light' },                                       // seat
      { s: 'box', d: [0.9, 0.5, 0.05], at: [0, 0.75, -0.67], c: 'wood' },                                            // seat back
      { s: 'box', d: [1.6, 0.04, 0.05], at: [1.3, 0.46, 0], c: 'wood-dark', mirror: true },                          // outrigger
      { s: 'box', d: [0.03, 1.13, 0.03], at: [0.9, 1.045, 0], c: 'wood', mirror: true },                             // strut, inner
      { s: 'box', d: [0.03, 1.27, 0.03], at: [1.7, 1.115, 0], c: 'wood', mirror: true },                             // strut, outer
      { s: 'box', d: [1.6, 0.02, 0.9], at: [1.3, 1.7, 0], rot: [0, 0, 10], c: 'cloth' },                             // canvas wing
      { s: 'box', d: [0.03, 0.03, 0.9], at: [0.9, 1.605, 0], rot: [0, 0, 10], c: 'wood', mirror: true },             // wing ribs
      { s: 'box', d: [0.03, 0.03, 0.9], at: [1.3, 1.675, 0], rot: [0, 0, 10], c: 'wood', mirror: true },
      { s: 'box', d: [0.03, 0.03, 0.9], at: [1.7, 1.745, 0], rot: [0, 0, 10], c: 'wood', mirror: true },
      { s: 'cyl', d: [0.14, 0.14, 0.03], at: [0.1, 0.45, 0.8], rot: [0, 0, 90], c: 'iron', seg: 8 },                  // crank disc
      { s: 'box', d: [0.03, 0.32, 0.03], at: [0.13, 0.45, 0.8], c: 'iron-dark' },                                     // crank arm
      { s: 'box', d: [0.1, 0.02, 0.06], at: [0.13, 0.28, 0.8], c: 'black' },                                          // pedal
    ],
  },
];
