// Gnome Theft Auto, Rootwell University (E13): the working buildings (dorm, refectory, club, glasshouse, barn, shed,
// grandstand). Scenery for games/gnome-theft-auto campus. Authored at HALF size: the game places each with scale 2.
import type { PrefabDef } from '../types';

const DARK_GLASS = 0x2b3a4a;
const PALE_GLASS = 0xbfe3d8;
const ROOF_SLATE = 0x3d4650;

export const GTA_CAMPUS_BUILDINGS: readonly PrefabDef[] = [
  {
    id: 'rootwell-dorm', name: 'Bedstraw House', category: 'prop', uses: ['place'],
    tags: ['dorm', 'dormitory', 'student', 'brick', 'slate', 'university', 'rootwell', 'campus', 'sock', 'house'], emoji: [],
    tint: 'clay',
    footprint: { r: 9.8, h: 8.6 },
    about: 'Gnome Theft Auto: Bedstraw House, the Rootwell dorm. Half-size (game 36 x 16 m, placed at scale 2), front door on +z. A three-storey brick block with a slate roof, three dormers, 12 framed windows and one sock hanging out.',
    examine: [
      'A long brick block of three storeys under a slate roof with three dormers poking out of it like sleepy eyebrows.',
      'Saying: a student who can see the lawn from the window has already decided not to revise.',
      'Tip: the front door sticks in damp weather. Lift it by the handle and push, in that order, as the porter suggests.',
      'Joke: the rent is paid in sugar to the ants under the cellar, so the porter can afford his own dinner first.',
      'One window has a red sock hung out of it on a string, which is the dorm signal for not to be disturbed.',
    ],
    parts: [
      { s: 'box', d: [18, 6, 8], at: [0, 3, 0], c: 'tint' },                                            // walls
      { s: 'box', d: [18.1, 1.0, 8.1], at: [0, 0.5, 0], c: 'stone' },                                    // plinth
      { s: 'box', d: [18.4, 0.2, 4.9], at: [0, 7.35, 2], rot: [32, 0, 0], c: ROOF_SLATE },               // roof, front slope
      { s: 'box', d: [18.4, 0.2, 4.9], at: [0, 7.35, -2], rot: [-32, 0, 0], c: ROOF_SLATE },             // roof, back slope
      { s: 'box', d: [1.6, 1.4, 1.6], at: [0, 7.2, 2.8], c: 'tint' },                                    // dormer
      { s: 'box', d: [1.6, 1.4, 1.6], at: [4.5, 7.2, 2.8], c: 'tint', mirror: true },                    // dormers, pair
      { s: 'box', d: [0.8, 0.6, 0.03], at: [0, 7.2, 3.615], c: DARK_GLASS },                             // dormer window
      { s: 'box', d: [0.8, 0.6, 0.03], at: [4.5, 7.2, 3.615], c: DARK_GLASS, mirror: true },
      { s: 'box', d: [1.0, 1.1, 0.03], at: [2.5, 1.6, 4.015], c: 'white', mirror: true },                // window frames
      { s: 'box', d: [0.8, 0.9, 0.04], at: [2.5, 1.6, 4.02], c: DARK_GLASS, mirror: true },              // window panes
      { s: 'box', d: [1.0, 1.1, 0.03], at: [6.5, 1.6, 4.015], c: 'white', mirror: true },
      { s: 'box', d: [0.8, 0.9, 0.04], at: [6.5, 1.6, 4.02], c: DARK_GLASS, mirror: true },
      { s: 'box', d: [1.0, 1.1, 0.03], at: [2.5, 3.2, 4.015], c: 'white', mirror: true },
      { s: 'box', d: [0.8, 0.9, 0.04], at: [2.5, 3.2, 4.02], c: DARK_GLASS, mirror: true },
      { s: 'box', d: [1.0, 1.1, 0.03], at: [6.5, 3.2, 4.015], c: 'white', mirror: true },
      { s: 'box', d: [0.8, 0.9, 0.04], at: [6.5, 3.2, 4.02], c: DARK_GLASS, mirror: true },
      { s: 'box', d: [1.0, 1.1, 0.03], at: [2.5, 4.8, 4.015], c: 'white', mirror: true },
      { s: 'box', d: [0.8, 0.9, 0.04], at: [2.5, 4.8, 4.02], c: DARK_GLASS, mirror: true },
      { s: 'box', d: [1.0, 1.1, 0.03], at: [6.5, 4.8, 4.015], c: 'white', mirror: true },
      { s: 'box', d: [0.8, 0.9, 0.04], at: [6.5, 4.8, 4.02], c: DARK_GLASS, mirror: true },
      { s: 'box', d: [1.4, 2.2, 0.05], at: [0, 1.1, 4.025], c: 'wood-dark' },                            // front door
      { s: 'box', d: [1.2, 0.5, 0.04], at: [0, 2.45, 4.02], c: 'glass' },                                // fanlight
      { s: 'box', d: [0.22, 0.5, 0.08], at: [2.5, 2.35, 4.06], c: 'red' },                               // sock, leg
      { s: 'box', d: [0.3, 0.14, 0.1], at: [2.56, 2.1, 4.06], c: 'red' },                                // sock, foot
    ],
  },
  {
    id: 'rootwell-refectory', name: 'The Trencher', category: 'prop', uses: ['place'],
    tags: ['refectory', 'hall', 'dining', 'canteen', 'sugar', 'slate', 'lantern', 'university', 'rootwell', 'campus'], emoji: [],
    tint: 'clay',
    footprint: { r: 9.6, h: 11.8 },
    about: 'Gnome Theft Auto: the Trencher, the Rootwell refectory. Half-size (game 30 x 24 m, placed at scale 2), double door on +z. A great brick hall under a steep slate roof with a glazed lantern on the ridge, and a low stone lean-to at the back with a cellar hatch.',
    examine: [
      'A great brick hall under a steep slate roof, with a glazed lantern on the ridge that is lit even in the middle of the day.',
      'Saying: the Trencher feeds everyone, and the one who pays for the sugar is the one who is never invited to eat.',
      'Tip: the double doors open both ways, so stand well back before you push, or you will be carried in by the queue.',
      'Joke: the cellar hatches at the back are left open on purpose, so the landlord can check his sugar without asking.',
      'A row of tall windows looks down on the lawn, and every window has a little brass plate reading Do Not Feed The Ants.',
    ],
    parts: [
      { s: 'box', d: [15, 4.5, 12], at: [0, 2.25, 0], c: 'tint' },                                       // hall walls
      { s: 'box', d: [15.4, 0.2, 8.3], at: [0, 7.3, 3], rot: [42, 0, 0], c: ROOF_SLATE },                // roof, front slope
      { s: 'box', d: [15.4, 0.2, 8.3], at: [0, 7.3, -3], rot: [-42, 0, 0], c: ROOF_SLATE },              // roof, back slope
      { s: 'box', d: [2.0, 1.4, 2.0], at: [0, 10.6, 0], c: 'glass', alpha: 0.6, glow: true },           // lantern
      { s: 'box', d: [2.4, 0.25, 2.4], at: [0, 11.42, 0], c: ROOF_SLATE },                              // lantern cap
      { s: 'box', d: [0.9, 2.6, 0.04], at: [3.5, 2.6, 6.02], c: DARK_GLASS, mirror: true },              // tall windows
      { s: 'box', d: [0.9, 2.6, 0.04], at: [6.0, 2.6, 6.02], c: DARK_GLASS, mirror: true },
      { s: 'box', d: [2.4, 2.8, 0.05], at: [0, 1.4, 6.025], c: 'wood-dark' },                            // double door
      { s: 'box', d: [9, 2.4, 3.5], at: [0, 1.2, -7.75], c: 'stone' },                                   // lean-to store
      { s: 'box', d: [9.2, 0.2, 3.8], at: [0, 2.5, -7.75], rot: [-15, 0, 0], c: ROOF_SLATE },           // lean-to roof
      { s: 'box', d: [1.1, 0.1, 1.2], at: [1.15, 0.45, -10.4], rot: [-30, 0, 0], c: 'wood-dark', mirror: true }, // cellar hatch
      { s: 'box', d: [0.04, 2.0, 1.2], at: [7.52, 2.4, 0], c: DARK_GLASS, mirror: true },                // side windows
    ],
  },
  {
    id: 'rootwell-faculty-club', name: 'The Cold Frame Club', category: 'prop', uses: ['place'],
    tags: ['club', 'faculty', 'clay', 'bay', 'awning', 'cosy', 'university', 'rootwell', 'campus', 'brass'], emoji: [],
    tint: 'clay',
    footprint: { r: 5.7, h: 6.2 },
    about: 'Gnome Theft Auto: the Cold Frame Club, the faculty club. Half-size (game 14 x 18 m, placed at scale 2), door on +z. Clay walls, a slate gable roof and chimney, a bay window with three panes beside the door, a green awning and a brass plate.',
    examine: [
      'A cosy clay-walled club with a slate roof, a bay window of three small panes, and a green awning over the door.',
      'Saying: a frame made of cold glass is still a warm room, as long as the professors are inside arguing about it.',
      'Tip: the brass plate says Members Only. Only members are allowed to read it, and the plate has never been read aloud.',
      'Joke: the club was founded to keep the faculty out of the rain, and has since kept the faculty out of everything else.',
      'Through the bay window the chairs are all facing the same way, toward a fire nobody has lit since the spring term.',
    ],
    parts: [
      { s: 'box', d: [7, 3.5, 9], at: [0, 1.75, 0], c: 'tint' },                                          // walls
      { s: 'box', d: [4.45, 0.2, 9.3], at: [1.85, 4.85, 0], rot: [0, 0, -35], c: ROOF_SLATE, mirror: true }, // roof, both slopes
      { s: 'box', d: [0.7, 2.2, 0.7], at: [2.0, 5.0, -2.5], c: 'clay-dark' },                           // chimney
      { s: 'box', d: [2.0, 1.6, 0.6], at: [-2.2, 1.3, 4.8], c: 'wood-light' },                          // bay window
      { s: 'box', d: [0.55, 1.1, 0.03], at: [-3.0, 1.3, 5.115], c: DARK_GLASS },                        // bay panes
      { s: 'box', d: [0.55, 1.1, 0.03], at: [-2.2, 1.3, 5.115], c: DARK_GLASS },
      { s: 'box', d: [0.55, 1.1, 0.03], at: [-1.4, 1.3, 5.115], c: DARK_GLASS },
      { s: 'box', d: [1.0, 2.0, 0.05], at: [0, 1.0, 4.525], c: 'wood-dark' },                            // door
      { s: 'box', d: [2.2, 0.08, 1.3], at: [0, 2.5, 4.95], rot: [20, 0, 0], c: 'green' },              // awning
      { s: 'box', d: [0.6, 0.4, 0.04], at: [1.8, 1.6, 4.52], c: 'brass' },                              // brass plate
      { s: 'box', d: [0.04, 1.0, 1.2], at: [3.52, 1.8, -1.5], c: DARK_GLASS, mirror: true },            // side window
    ],
  },
  {
    id: 'rootwell-glasshouse', name: 'The Cloche', category: 'prop', uses: ['place'],
    tags: ['glasshouse', 'greenhouse', 'glass', 'victorian', 'plants', 'cupola', 'university', 'rootwell', 'campus', 'brick'], emoji: [],
    tint: 'clay',
    footprint: { r: 7.9, h: 8.6 },
    about: 'Gnome Theft Auto: the Cloche, the Rootwell glasshouse. Half-size (game 26 x 18 m, placed at scale 2), doors on +z. A low brick plinth, pale glass walls and roof on white ribs, mullions, and a little cupola on the ridge.',
    examine: [
      'A Victorian glasshouse on a low brick plinth, with pale glass walls, a pitched glass roof and white ribs holding it up.',
      'Saying: a plant grown under glass has nothing to hide from, which is a comfort to the plant and an embarrassment to the gardener.',
      'Tip: keep the doors shut once the sun is up. The glass gets hot enough to cook a biscuit and the cacti resent it.',
      'Joke: the cupola is for watching the weather, and the weather has been watching the cupola for a great deal longer.',
      'Tall pots of ferns and tomatoes stand in rows inside, and one pot is labelled simply: do not touch, it is thinking.',
    ],
    parts: [
      { s: 'box', d: [13, 1.2, 9], at: [0, 0.6, 0], c: 'tint' },                                          // brick plinth
      { s: 'box', d: [12.8, 2.8, 0.1], at: [0, 2.6, 4.5], c: PALE_GLASS, alpha: 0.6 },                  // front glass
      { s: 'box', d: [12.8, 2.8, 0.1], at: [0, 2.6, -4.5], c: PALE_GLASS, alpha: 0.6 },                 // back glass
      { s: 'box', d: [0.1, 2.8, 8.8], at: [6.45, 2.6, 0], c: PALE_GLASS, alpha: 0.6, mirror: true },    // side glass
      { s: 'box', d: [1.6, 2.4, 0.06], at: [0, 2.4, 4.58], c: 'wood-dark' },                            // door
      { s: 'box', d: [0.12, 2.8, 0.06], at: [1.8, 2.6, 4.58], c: 'white', mirror: true },                // mullions
      { s: 'box', d: [0.12, 2.8, 0.06], at: [4.2, 2.6, 4.58], c: 'white', mirror: true },
      { s: 'box', d: [7.1, 0.15, 9.1], at: [3.25, 5.28, 0], rot: [0, 0, -20], c: PALE_GLASS, alpha: 0.6, mirror: true }, // roof glass
      { s: 'box', d: [7.0, 0.12, 0.12], at: [3.25, 5.36, -3], rot: [0, 0, -20], c: 'white', mirror: true }, // roof ribs
      { s: 'box', d: [7.0, 0.12, 0.12], at: [3.25, 5.36, 0], rot: [0, 0, -20], c: 'white', mirror: true },
      { s: 'box', d: [7.0, 0.12, 0.12], at: [3.25, 5.36, 3], rot: [0, 0, -20], c: 'white', mirror: true },
      { s: 'box', d: [0.2, 0.2, 9.2], at: [0, 6.4, 0], c: 'white' },                                     // ridge cap
      { s: 'box', d: [1.6, 1.4, 1.6], at: [0, 7.0, -1.0], c: PALE_GLASS, alpha: 0.6 },                  // cupola
      { s: 'cone', d: [1.2, 0.9], at: [0, 8.15, -1.0], c: 'white', seg: 6 },                           // cupola roof
    ],
  },
  {
    id: 'rootwell-heap-barn', name: 'The Heap Barn', category: 'prop', uses: ['place'],
    tags: ['barn', 'heap', 'compost', 'mulch', 'timber', 'gambrel', 'science', 'university', 'rootwell', 'campus'], emoji: [],
    tint: 'wood',
    footprint: { r: 9.2, h: 6.3 },
    about: 'Gnome Theft Auto: the Heap Barn, mulch science. Half-size (game 22 x 16 m, placed at scale 2), sliding door on +z. A timber barn with a gambrel roof, a big sliding door, and a steaming compost bay of squashed mounds against one side.',
    examine: [
      'A timber barn with a gambrel roof that bends in the middle, and a sliding door that has been stuck halfway for a decade.',
      'Saying: good heap, good barn. A heap left alone long enough becomes the best soil the gnomes have ever been unable to explain.',
      'Tip: stand upwind of the compost bay. The steam is warm, the smell is not, and the science is mostly about the smell.',
      'Joke: the mulch science department has a very good reason for keeping the heap, and the reason is that nobody has asked.',
      'The steam rises in a neat pale cone, and the gnomes say it is the barn breathing out, which is also what the barn looks like.',
    ],
    parts: [
      { s: 'box', d: [11, 3.5, 8], at: [0, 1.75, 0], c: 'tint' },                                          // timber walls
      { s: 'box', d: [2.95, 0.15, 8.4], at: [4.5, 4.57, 0], rot: [0, 0, -45], c: ROOF_SLATE, mirror: true }, // gambrel, steep lower slopes
      { s: 'box', d: [3.6, 0.15, 8.4], at: [1.75, 5.95, 0], rot: [0, 0, -11.3], c: ROOF_SLATE, mirror: true }, // gambrel, shallow upper slopes
      { s: 'box', d: [4.0, 2.8, 0.1], at: [0, 1.4, 4.05], c: 'wood-dark' },                              // sliding door
      { s: 'box', d: [4.4, 0.06, 0.06], at: [0, 2.95, 4.12], c: 'iron' },                                // door rail
      { s: 'ball', d: [1.6], at: [-7.4, 0.8, 0], scale: [1, 0.5, 1.1], c: 'dirt', seg: 8 },            // compost mound
      { s: 'ball', d: [1.2], at: [-7.6, 0.6, 1.8], scale: [1, 0.5, 1], c: 'dirt', seg: 8 },
      { s: 'ball', d: [0.9], at: [-6.6, 0.45, -1.5], scale: [1, 0.5, 1], c: 'clay-dark', seg: 8 },
      { s: 'cone', d: [0.7, 1.6], at: [-7.4, 2.4, 0], c: 'white', alpha: 0.35, glow: true, seg: 6 },   // steam
      { s: 'box', d: [0.04, 0.8, 1.0], at: [5.52, 2.2, -2.0], c: 'glass' },                             // side window
    ],
  },
  {
    id: 'rootwell-bodgers-shed', name: "Bodger's Shed", category: 'prop', uses: ['place'],
    tags: ['shed', 'workshop', 'engineering', 'corrugated', 'crane', 'propeller', 'bodger', 'university', 'rootwell', 'campus'], emoji: [],
    tint: 'iron',
    footprint: { r: 8.6, h: 4.9 },
    about: 'Gnome Theft Auto: Bodger\'s Shed, engineering. Half-size (game 22 x 16 m, placed at scale 2), roller door on +z. A corrugated workshop with a saw-tooth roof, a small crane jib on one gable, and a propeller nailed over the door as a sign.',
    examine: [
      'A corrugated workshop with a saw-tooth roof, a crane jib on one gable, and a roller door that has never once rolled all the way.',
      'Saying: whatever a bodger cannot fix, he will make into a useful fixture, and the crane is the proof of it.',
      'Tip: the roller door goes up with a clank and down with a bigger clank. Duck when it changes direction, and always.',
      'Joke: the propeller over the door is the shed sign, and it has been turning gently ever since the sign was nailed up.',
      'A row of tally marks on the inside wall counts the number of things the crane has dropped, and the tally has no end.',
    ],
    parts: [
      { s: 'box', d: [11, 3.5, 8], at: [0, 1.75, 0], c: 'tint' },                                          // corrugated walls
      { s: 'box', d: [3.8, 0.12, 8.2], at: [-3.6, 3.9, 0], rot: [0, 0, 20], c: 'iron-dark' },            // saw-tooth roof
      { s: 'box', d: [3.8, 0.12, 8.2], at: [0, 3.9, 0], rot: [0, 0, 20], c: 'iron-dark' },
      { s: 'box', d: [3.8, 0.12, 8.2], at: [3.6, 3.9, 0], rot: [0, 0, 20], c: 'iron-dark' },
      { s: 'box', d: [5.0, 2.8, 0.1], at: [0, 1.4, 4.05], c: 'iron-dark' },                               // roller door
      { s: 'box', d: [5.0, 0.04, 0.03], at: [0, 0.6, 4.115], c: 'steel' },                               // door ribs
      { s: 'box', d: [5.0, 0.04, 0.03], at: [0, 1.2, 4.115], c: 'steel' },
      { s: 'box', d: [5.0, 0.04, 0.03], at: [0, 1.8, 4.115], c: 'steel' },
      { s: 'box', d: [5.0, 0.04, 0.03], at: [0, 2.4, 4.115], c: 'steel' },
      { s: 'box', d: [0.24, 4.2, 0.24], at: [5.6, 2.1, 0], c: 'rust' },                                  // crane post
      { s: 'box', d: [3.2, 0.16, 0.16], at: [7.2, 4.05, 0], c: 'rust' },                                  // crane jib
      { s: 'cyl', d: [0.02, 0.02, 1.2], at: [8.2, 3.45, 0], c: 'iron-dark', seg: 4 },                     // hook cable
      { s: 'cyl', d: [0.04, 0.04, 0.2], at: [0, 3.3, 4.1], rot: [90, 0, 0], c: 'iron-dark', seg: 6 },    // propeller standoff
      { s: 'box', d: [1.4, 0.12, 0.04], at: [0, 3.3, 4.22], rot: [0, 0, 15], c: 'wood-light' },          // propeller blade
      { s: 'box', d: [1.4, 0.12, 0.04], at: [0, 3.3, 4.22], rot: [0, 0, 105], c: 'wood-light' },         // propeller blade
      { s: 'ball', d: [0.09], at: [0, 3.3, 4.22], c: 'iron-dark', seg: 6 },                              // propeller hub
      { s: 'box', d: [0.04, 0.8, 1.0], at: [-5.52, 2.2, -2.0], c: 'glass' },                            // side window
    ],
  },
  {
    id: 'rootwell-grandstand', name: 'Clod Grandstand', category: 'prop', uses: ['place'],
    tags: ['grandstand', 'stadium', 'seats', 'stand', 'tiers', 'press', 'clod', 'sport', 'university', 'rootwell'], emoji: [],
    tint: 'stone',
    footprint: { r: 12.6, h: 3.4 },
    about: 'Gnome Theft Auto: the Clod grandstand, one side of the Clod stadium. Half-size (game 50 x 8 x 8 m, placed at scale 2), front (lowest tier) on +z. Four stepped stone tiers with red and cream seat strips, a back wall, a cantilevered roof on thin posts and a press box.',
    examine: [
      'Four stone tiers of seats climb toward the back, with red and cream strips along the edges and a roof over the top two.',
      'Saying: the best seat in the Clod is the one in the back row, and it is also the one nearest to the roof when it rains.',
      'Tip: the seats are numbered from the front, and the numbers go up toward the back, which is the only thing about the Clod that is orderly.',
      'Joke: the press box at the top is for the reporters, and the reporters are the only gnomes in the stand who can see the referee.',
      'A small brass bell hangs under the press box roof, and it is rung every time the Clod scores, which is once a decade.',
    ],
    parts: [
      { s: 'box', d: [25, 0.5, 1.2], at: [0, 0.25, 1.5], c: 'stone' },                                   // tier, front (lowest)
      { s: 'box', d: [25, 1.0, 1.2], at: [0, 0.5, 0.5], c: 'stone' },                                    // tier
      { s: 'box', d: [25, 1.5, 1.2], at: [0, 0.75, -0.5], c: 'stone' },                                  // tier
      { s: 'box', d: [25, 2.0, 1.2], at: [0, 1.0, -1.5], c: 'stone' },                                   // tier, back (highest)
      { s: 'box', d: [24.5, 0.04, 0.5], at: [0, 0.55, 1.75], c: 'red' },                                 // seat strip
      { s: 'box', d: [24.5, 0.04, 0.5], at: [0, 1.05, 0.75], c: 'wool' },                                // seat strip
      { s: 'box', d: [24.5, 0.04, 0.5], at: [0, 1.55, -0.25], c: 'red' },                                // seat strip
      { s: 'box', d: [24.5, 0.04, 0.2], at: [0, 2.05, -1.0], c: 'wool' },                                // seat strip
      { s: 'box', d: [25, 3.0, 0.3], at: [0, 1.5, -2.15], c: 'stone-dark' },                             // back wall
      { s: 'box', d: [25.2, 0.2, 2.6], at: [0, 3.15, -0.9], rot: [-6, 0, 0], c: 'slate' },               // cantilevered roof
      { s: 'cyl', d: [0.06, 0.06, 2.2], at: [11.5, 2.05, 0.2], c: 'iron', seg: 6, mirror: true },        // roof posts
      { s: 'box', d: [2.6, 0.9, 0.9], at: [0, 2.45, -1.6], c: 'wood' },                                  // press box
      { s: 'box', d: [1.6, 0.4, 0.03], at: [0, 2.5, -1.14], c: DARK_GLASS },                             // press box window
      { s: 'box', d: [2.8, 0.12, 1.1], at: [0, 2.95, -1.6], c: 'red' },                                  // press box roof
    ],
  },
];
