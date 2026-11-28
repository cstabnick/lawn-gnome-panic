// Gnome Theft Auto: the Gutter Bowls (batch 3 E19): the skateboard, ledge, deck platform, downspout rail, Board Library and dressing props.
import type { PrefabDef } from '../types';

export const GTA_GUTTER_BOWLS: readonly PrefabDef[] = [
  {
    id: 'gta-skateboard', name: 'Skateboard', category: 'prop', uses: ['place'],
    tags: ['gta', 'skate', 'skateboard', 'board', 'deck', 'wood', 'wheels', 'trucks'], emoji: [],
    footprint: { r: 0.4, h: 0.16 },
    about: 'Gnome Theft Auto: a wooden skateboard for a gnome. Nose and tail kicked up, grip tape on top, steel trucks and four cream wheels. Life-size metres, nose +z, wheel bottoms at y 0.',
    examine: [
      'A wooden plank with both ends kicked up, black grip tape on top, and four cream wheels hung from two steel trucks underneath.',
      'Skating saying: a board that rolls is a board that goes somewhere, and a board that stops is a board that is being sat on.',
      'Tip: keep your back foot on the tail and your front foot over the trucks. The board will go wherever your feet have already decided.',
      'Joke: the wheels are made from a Tall One bottle cork set in a clay hoop, which is why the board only ever goes in straight lines.',
      'A painted acorn on the underside of the deck marks the board as belonging to the Founders Green crew, who will not say what the crew does.',
    ],
    parts: [
      { s: 'box', d: [0.2, 0.025, 0.5], at: [0, 0.0975, 0], c: 'wood' },                              // flat middle of the deck, top at 0.11
      { s: 'box', d: [0.2, 0.025, 0.135], at: [0, 0.1155, 0.2975], rot: [-15, 0, 0], c: 'wood' },   // nose kicked up
      { s: 'box', d: [0.2, 0.025, 0.135], at: [0, 0.1155, -0.2975], rot: [15, 0, 0], c: 'wood' },  // tail kicked up
      { s: 'box', d: [0.2, 0.003, 0.5], at: [0, 0.1115, 0], c: 'black' },                             // grip tape
      { s: 'box', d: [0.12, 0.02, 0.03], at: [0, 0.07, 0.24], c: 'steel' },                           // trucks
      { s: 'box', d: [0.12, 0.02, 0.03], at: [0, 0.07, -0.24], c: 'steel' },
      { s: 'cyl', d: [0.03, 0.03, 0.025], at: [0.1, 0.03, 0.24], rot: [0, 0, 90], c: 'bone', seg: 8, mirror: true },   // wheels
      { s: 'cyl', d: [0.03, 0.03, 0.025], at: [0.1, 0.03, -0.24], rot: [0, 0, 90], c: 'bone', seg: 8, mirror: true },
      { s: 'ball', d: [0.02], at: [0, 0.075, 0], scale: [1, 1.2, 1], c: 'orange', seg: 6 },        // painted acorn on the underside
    ],
  },
  {
    id: 'skate-ledge', name: 'Skate Ledge', category: 'prop', uses: ['place'],
    tags: ['gta', 'skate', 'ledge', 'concrete', 'steel', 'grind', 'wax', 'park'], emoji: [],
    footprint: { r: 2.5, h: 0.45 },
    about: 'Gnome Theft Auto: the Skate Ledge. A concrete block 5.0 long, 0.6 deep and 0.45 tall, with steel angle edges on both top edges and wax smears on top. Origin at the bottom centre. Life-size metres.',
    examine: [
      'A concrete block as long as a cart, with a steel strip bolted along each top edge so that the board has something to scrape on.',
      'Saying: the ledge does not care how you got on it, only how you get off, and the wax on the top says most gnomes never did.',
      'Tip: approach it straight on and keep your weight over the back wheels. A ledge taken sideways has ended more careers than the Mower.',
      'Joke: the top is so smooth with wax that it has been used as a bench, a stage and an argument, and it has been all three at once.',
      'One corner has chipped away to show a little white grit inside, and someone has drawn a neat circle around it with chalk.',
    ],
    parts: [
      { s: 'box', d: [5.0, 0.45, 0.6], at: [0, 0.225, 0], c: 'stone' },                            // block, top at 0.45
      { s: 'box', d: [5.0, 0.05, 0.02], at: [0, 0.425, 0.3], c: 'steel' },                          // steel angle edges on the top long edges
      { s: 'box', d: [5.0, 0.05, 0.02], at: [0, 0.425, -0.3], c: 'steel' },
      { s: 'box', d: [1.2, 0.006, 0.3], at: [-1.0, 0.453, 0], c: 'stone-dark' },                   // wax smears on top
      { s: 'box', d: [0.8, 0.006, 0.25], at: [1.3, 0.453, 0.05], c: 'stone-dark' },
      { s: 'box', d: [0.12, 0.06, 0.12], at: [2.44, 0.42, -0.27], c: 'chalk' },                     // chipped corner, grit showing
    ],
  },
  {
    id: 'gutter-deck-platform', name: 'Gutter Deck Platform', category: 'prop', uses: ['place'],
    tags: ['gta', 'skate', 'platform', 'deck', 'wood', 'ladder', 'posts', 'gutter'], emoji: [],
    footprint: { r: 1.8, h: 2.1 },
    about: 'Gnome Theft Auto: the Gutter Deck Platform. A wooden deck 3.5 wide (x) by 11.0 long (z), top at y 2.0, on posts, with a short ladder on -x and open space underneath. Origin at the bottom centre.',
    examine: [
      'A wooden deck up on posts, with planks laid in long strips and a little ladder up one side, which is the only way to get on it.',
      'Saying: the deck is high enough to see the whole half-pipe from, and that is the whole reason gnomes climb it, and the reason they fall off.',
      'Tip: take the ladder one rung at a time and do not look down. The planks are sound, but the view is a lot more than a gnome asked for.',
      'Joke: somebody once tried to put a bench on the deck and the deck has been pretending it did not notice ever since.',
      'Carved on the nearest post, under the ladder, is a row of notches, one for each gnome who said they would only be a minute.',
    ],
    parts: [
      { s: 'box', d: [0.5, 0.08, 11.0], at: [-1.5, 1.96, 0], c: 'wood' },                            // plank top, six strips, top at 2.0
      { s: 'box', d: [0.5, 0.08, 11.0], at: [-0.9, 1.96, 0], c: 'wood-light' },
      { s: 'box', d: [0.5, 0.08, 11.0], at: [-0.3, 1.96, 0], c: 'wood' },
      { s: 'box', d: [0.5, 0.08, 11.0], at: [0.3, 1.96, 0], c: 'wood-light' },
      { s: 'box', d: [0.5, 0.08, 11.0], at: [0.9, 1.96, 0], c: 'wood' },
      { s: 'box', d: [0.5, 0.08, 11.0], at: [1.5, 1.96, 0], c: 'wood-light' },
      { s: 'box', d: [0.14, 1.92, 0.14], at: [-1.5, 0.96, -4.5], c: 'wood-dark' },                  // six posts
      { s: 'box', d: [0.14, 1.92, 0.14], at: [1.5, 0.96, -4.5], c: 'wood-dark' },
      { s: 'box', d: [0.14, 1.92, 0.14], at: [-1.5, 0.96, 0], c: 'wood-dark' },
      { s: 'box', d: [0.14, 1.92, 0.14], at: [1.5, 0.96, 0], c: 'wood-dark' },
      { s: 'box', d: [0.14, 1.92, 0.14], at: [-1.5, 0.96, 4.5], c: 'wood-dark' },
      { s: 'box', d: [0.14, 1.92, 0.14], at: [1.5, 0.96, 4.5], c: 'wood-dark' },
      { s: 'box', d: [3.0, 0.1, 0.1], at: [0, 0.8, -4.5], c: 'wood-dark' },                         // cross braces
      { s: 'box', d: [3.0, 0.1, 0.1], at: [0, 0.8, 4.5], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.1, 9.0], at: [-1.5, 0.8, 0], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.1, 9.0], at: [1.5, 0.8, 0], c: 'wood-dark' },
      { s: 'box', d: [0.05, 2.0, 0.05], at: [-1.95, 1.0, -0.25], c: 'wood' },                      // ladder on -x
      { s: 'box', d: [0.05, 2.0, 0.05], at: [-1.95, 1.0, 0.25], c: 'wood' },
      { s: 'box', d: [0.04, 0.04, 0.5], at: [-1.95, 0.4, 0], c: 'wood-dark' },                    // rungs
      { s: 'box', d: [0.04, 0.04, 0.5], at: [-1.95, 0.8, 0], c: 'wood-dark' },
      { s: 'box', d: [0.04, 0.04, 0.5], at: [-1.95, 1.2, 0], c: 'wood-dark' },
      { s: 'box', d: [0.04, 0.04, 0.5], at: [-1.95, 1.6, 0], c: 'wood-dark' },
    ],
  },
  {
    id: 'fennel-hammock', name: "Fennel's Hammock", category: 'prop', uses: ['place'],
    tags: ['gta', 'skate', 'hammock', 'canvas', 'rope', 'cat', 'fennel', 'pillow', 'stripes'], emoji: [],
    about: 'Gnome Theft Auto: Fennel\'s Hammock. A striped canvas hammock on two ropes tied at x +-0.95, y 1.1, with a pillow, a tin bowl and a bag of cat biscuits on the ground. Life-size metres.',
    examine: [
      'A striped canvas hammock, red and cloth, slung on two ropes that run up to a point that is nowhere near the ground.',
      'Saying: a cat that is asleep in a hammock is not lazy, it is simply waiting for the wind to finish the job.',
      'Tip: lie down in the middle with your head on the pillow. The cat will want the other end, and the cat has always got it.',
      'Joke: the bag beside it says biscuits, and the bowl beside that says the same, and only one of them has ever been used for biscuits.',
      'Fennel has scratched a small notch in the rope with a claw, and every notch is a day the hammock was not used by anyone else.',
    ],
    parts: [
      { s: 'box', d: [0.18, 0.03, 0.8], at: [-0.3, 0.6, 0], c: 'red' },                              // striped canvas bed, top near 0.615
      { s: 'box', d: [0.18, 0.03, 0.8], at: [-0.1, 0.6, 0], c: 'cloth' },
      { s: 'box', d: [0.18, 0.03, 0.8], at: [0.1, 0.6, 0], c: 'red' },
      { s: 'box', d: [0.18, 0.03, 0.8], at: [0.3, 0.6, 0], c: 'cloth' },
      { s: 'box', d: [0.4, 0.03, 0.8], at: [-0.8, 0.66, 0], rot: [0, 0, -20], c: 'red' },          // ends rising to the ropes
      { s: 'box', d: [0.4, 0.03, 0.8], at: [0.8, 0.66, 0], rot: [0, 0, 20], c: 'red' },
      { s: 'box', d: [0.02, 0.38, 0.02], at: [-0.95, 0.91, -0.35], c: 'bark' },                     // ropes up to the tie points
      { s: 'box', d: [0.02, 0.38, 0.02], at: [-0.95, 0.91, 0.35], c: 'bark' },
      { s: 'box', d: [0.02, 0.38, 0.02], at: [0.95, 0.91, -0.35], c: 'bark' },
      { s: 'box', d: [0.02, 0.38, 0.02], at: [0.95, 0.91, 0.35], c: 'bark' },
      { s: 'ball', d: [0.12], at: [-0.55, 0.69, 0], scale: [1.4, 0.6, 1], c: 'white', seg: 6 },    // pillow
      { s: 'cyl', d: [0.14, 0.09, 0.07], at: [1.2, 0.035, 0.55], c: 'steel', seg: 8 },             // tin bowl
      { s: 'box', d: [0.16, 0.12, 0.1], at: [-1.2, 0.06, 0.55], c: 'burlap' },                       // biscuit bag
    ],
  },
  {
    id: 'downspout-rail', name: 'Downspout Rail', category: 'prop', uses: ['place'],
    tags: ['gta', 'skate', 'rail', 'downspout', 'pipe', 'galvanised', 'steel', 'gutter', 'grind'], emoji: [],
    footprint: { r: 0.3, h: 0.5 },
    about: 'Gnome Theft Auto: the Downspout Rail. A galvanised square pipe 6.0 long along x, 0.16 square, top at y 0.5, on two brackets, with an elbow at +x and a rust streak. Origin at the middle on the ground.',
    examine: [
      'A galvanised pipe as long as a garden path and as square as a gnome can manage, lying across two iron brackets at the height of a knee.',
      'Saying: a pipe that carries water carries it downhill, and a pipe that carries gnomes carries them somewhere else entirely.',
      'Tip: grind it from the middle and keep your weight low. The elbow at the end is not a rail, and it will tell you so.',
      'Joke: it has been waiting for rain for so long that the rust has started to look like the rain has already been, which it has not.',
      'Scratched into the top is a tiny sketch of a gnome upside down on a pipe, with a question mark, which nobody has yet answered.',
    ],
    parts: [
      { s: 'box', d: [6.0, 0.16, 0.16], at: [0, 0.42, 0], c: 'steel' },                             // pipe, top at 0.5
      { s: 'box', d: [0.05, 0.36, 0.05], at: [-2.0, 0.18, 0], c: 'iron-dark' },                      // two brackets
      { s: 'box', d: [0.05, 0.36, 0.05], at: [2.0, 0.18, 0], c: 'iron-dark' },
      { s: 'box', d: [0.2, 0.03, 0.2], at: [-2.0, 0.015, 0], c: 'iron-dark' },                       // bracket feet
      { s: 'box', d: [0.2, 0.03, 0.2], at: [2.0, 0.015, 0], c: 'iron-dark' },
      { s: 'box', d: [0.15, 0.36, 0.15], at: [2.915, 0.18, 0], c: 'steel' },                         // elbow bend at +x
      { s: 'box', d: [0.6, 0.12, 0.01], at: [-1.0, 0.42, 0.085], c: 'rust' },                       // rust streak on the front
    ],
  },
  {
    id: 'gutter-bracket', name: 'Gutter Bracket', category: 'prop', uses: ['place'],
    tags: ['gta', 'skate', 'bracket', 'gutter', 'hook', 'steel', 'green', 'rust', 'decoration'], emoji: [],
    about: 'Gnome Theft Auto: a giant gutter bracket, a green-painted steel hook on a back plate, rusty at the joints, bolted to the outside of the half-pipe walls. Front faces +z. Life-size metres.',
    examine: [
      'A curved steel hook painted green, with the paint worn through at the bend where the rust has been having its way.',
      'Saying: the hook holds up the gutter, the gutter holds up the rain, and the rain, as everyone knows, holds up nothing at all.',
      'Tip: the bolts are the only part you can trust, so climb on those and leave the paint alone.',
      'Joke: it is the only decoration in the bowls that was not meant to be decoration, and it is very proud of that.',
      'Someone has painted a small green face on the back plate, with a wide smile and one eye slightly higher than the other.',
    ],
    parts: [
      { s: 'box', d: [0.1, 0.6, 0.02], at: [0, 0.3, -0.01], c: 'green' },                             // back plate
      { s: 'box', d: [0.05, 0.05, 0.3], at: [0, 0.5, 0.1], c: 'green' },                              // arm out to +z
      { s: 'box', d: [0.05, 0.16, 0.05], at: [0, 0.42, 0.25], rot: [-20, 0, 0], c: 'green' },        // curled down
      { s: 'box', d: [0.05, 0.05, 0.08], at: [0, 0.35, 0.27], c: 'green' },                           // tip
      { s: 'ball', d: [0.02], at: [0, 0.3, 0.0], c: 'iron', seg: 6 },                                 // bolt
      { s: 'box', d: [0.03, 0.06, 0.005], at: [0.03, 0.22, 0.012], c: 'rust' },                       // rust streaks
      { s: 'box', d: [0.03, 0.1, 0.005], at: [-0.03, 0.42, 0.012], c: 'rust' },
    ],
  },
  {
    id: 'board-library-rack', name: 'Board Library Rack', category: 'prop', uses: ['place'],
    tags: ['gta', 'skate', 'rack', 'library', 'board', 'timber', 'sign', 'skateboard'], emoji: [],
    about: 'Gnome Theft Auto: the Board Library, a timber rack 1.6 wide and 1.1 tall holding three skateboards on end, a painted header and a take-one sign. Front faces +z. Life-size metres.',
    examine: [
      'A timber rack with three skateboards standing on end, a painted header across the top, and a small sign at the foot of the stand.',
      'Saying: a board on the shelf is a board that is waiting, and a board that is waiting is a board that has not yet been borrowed.',
      'Tip: take one, leave one. The rack has been keeping an exact count since it was built, and the count is still exact.',
      'Joke: the library has never lent out a book, but it has lent out eleven boards and a bucket, and it considers all of them overdue.',
      'Under the header, somebody has drawn a tiny board with a line through it and a second, smaller board, which is the only overdue notice ever posted.',
    ],
    parts: [
      { s: 'box', d: [0.05, 1.1, 0.05], at: [-0.78, 0.55, 0.15], c: 'wood-dark' },                  // uprights
      { s: 'box', d: [0.05, 1.1, 0.05], at: [0.78, 0.55, 0.15], c: 'wood-dark' },
      { s: 'box', d: [1.6, 0.04, 0.4], at: [0, 0.1, 0], c: 'wood' },                                 // base shelf, top at 0.12
      { s: 'box', d: [1.6, 0.16, 0.04], at: [0, 1.02, 0], c: 'wood-light' },                         // header board, top at 1.1
      { s: 'box', d: [0.2, 0.72, 0.025], at: [-0.55, 0.48, 0], c: 'wood' },                          // three boards on end
      { s: 'box', d: [0.2, 0.72, 0.025], at: [0, 0.48, 0], c: 'wood' },
      { s: 'box', d: [0.2, 0.72, 0.025], at: [0.55, 0.48, 0], c: 'wood' },
      { s: 'cyl', d: [0.03, 0.03, 0.025], at: [-0.61, 0.15, 0.02], rot: [90, 0, 0], c: 'bone', seg: 8 }, // wheels
      { s: 'cyl', d: [0.03, 0.03, 0.025], at: [-0.49, 0.15, 0.02], rot: [90, 0, 0], c: 'bone', seg: 8 },
      { s: 'cyl', d: [0.03, 0.03, 0.025], at: [-0.06, 0.15, 0.02], rot: [90, 0, 0], c: 'bone', seg: 8 },
      { s: 'cyl', d: [0.03, 0.03, 0.025], at: [0.06, 0.15, 0.02], rot: [90, 0, 0], c: 'bone', seg: 8 },
      { s: 'cyl', d: [0.03, 0.03, 0.025], at: [0.49, 0.15, 0.02], rot: [90, 0, 0], c: 'bone', seg: 8 },
      { s: 'cyl', d: [0.03, 0.03, 0.025], at: [0.61, 0.15, 0.02], rot: [90, 0, 0], c: 'bone', seg: 8 },
      { s: 'box', d: [0.05, 0.1, 0.01], at: [-0.66, 1.02, 0.025], c: 'ink' },                       // BOARD LIBRARY as thin letter blocks
      { s: 'box', d: [0.05, 0.1, 0.01], at: [-0.54, 1.02, 0.025], c: 'ink' },
      { s: 'box', d: [0.05, 0.1, 0.01], at: [-0.42, 1.02, 0.025], c: 'ink' },
      { s: 'box', d: [0.05, 0.1, 0.01], at: [-0.30, 1.02, 0.025], c: 'ink' },
      { s: 'box', d: [0.05, 0.1, 0.01], at: [-0.18, 1.02, 0.025], c: 'ink' },
      { s: 'box', d: [0.05, 0.1, 0.01], at: [-0.06, 1.02, 0.025], c: 'ink' },
      { s: 'box', d: [0.05, 0.1, 0.01], at: [0.06, 1.02, 0.025], c: 'ink' },
      { s: 'box', d: [0.05, 0.1, 0.01], at: [0.18, 1.02, 0.025], c: 'ink' },
      { s: 'box', d: [0.05, 0.1, 0.01], at: [0.30, 1.02, 0.025], c: 'ink' },
      { s: 'box', d: [0.05, 0.1, 0.01], at: [0.42, 1.02, 0.025], c: 'ink' },
      { s: 'box', d: [0.05, 0.1, 0.01], at: [0.54, 1.02, 0.025], c: 'ink' },
      { s: 'box', d: [0.05, 0.1, 0.01], at: [0.66, 1.02, 0.025], c: 'ink' },
      { s: 'box', d: [0.6, 0.1, 0.02], at: [0, 0.05, 0.22], c: 'white' },                             // take one, leave one sign
      { s: 'box', d: [0.1, 0.015, 0.01], at: [0.36, 0.05, 0.235], c: 'red' },                        // arrow
      { s: 'box', d: [0.04, 0.04, 0.01], at: [0.42, 0.05, 0.235], rot: [0, 0, 45], c: 'red' },
    ],
  },
  {
    id: 'squeegee-bucket', name: 'Squeegee Bucket', category: 'prop', uses: ['place'],
    tags: ['gta', 'skate', 'squeegee', 'bucket', 'mop', 'water', 'yellow', 'puddle', 'cleaning'], emoji: [],
    about: 'Gnome Theft Auto: a yellow bucket with a long-handled floor squeegee leaning in it, a dark puddle mat underneath. Front faces +z. Life-size metres.',
    examine: [
      'A yellow bucket, half full of grey water, with a long handle leaning out of it and a rubber blade hidden at the bottom.',
      'Saying: the squeegee is for the floor and the bucket is for the squeegee, and the floor, as ever, has the last word.',
      'Tip: push the blade away from you and pull it back toward the bucket. Pushing it toward you only moves the puddle closer to your boots.',
      'Joke: the water in the bucket has been there so long it has its own opinions, and none of them are clean.',
      'A tiny cloth is folded over the rim with a neat little note pinned to it that reads "back in a minute", dated for the spring before last.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.16, 0.3], at: [0, 0.15, 0], c: 'yellow', seg: 10 },                    // bucket, top at 0.3
      { s: 'cyl', d: [0.16, 0.16, 0.01], at: [0, 0.25, 0], c: 'water', seg: 10 },                    // water inside
      { s: 'ring', d: [0.2, 0.015], at: [0, 0.3, 0], rot: [90, 0, 0], c: 'yellow', seg: 10 },        // rim
      { s: 'cyl', d: [0.4, 0.4, 0.008], at: [0, 0.004, 0.02], c: 'slate', seg: 12 },                  // puddle mat
      { s: 'box', d: [0.3, 0.025, 0.05], at: [0, 0.13, 0], c: 'black' },                              // rubber blade at the foot
      { s: 'cyl', d: [0.015, 0.015, 1.1], at: [0, 0.6815, 0.0955], rot: [10, 0, 0], c: 'wood', seg: 6 }, // long handle
    ],
  },
  {
    id: 'gutter-leaf-pile', name: 'Gutter Leaf Pile', category: 'prop', uses: ['place'],
    tags: ['gta', 'skate', 'leaves', 'leaf', 'pile', 'gutter', 'hubcap', 'autumn', 'orange'], emoji: [],
    about: 'Gnome Theft Auto: a heap of dead leaves in browns and oranges, with a lost hubcap half under them. Flattened balls on the ground. Life-size metres.',
    examine: [
      'A heap of dead leaves in browns and oranges, pressed flat by the rain, with a grey metal disc poking out of one side.',
      'Saying: every leaf in the gutter fell for a reason, and every reason was a gust of wind that nobody saw coming.',
      'Tip: rake the heap toward the bin, not away from it. The leaves always come back, but the bin has no opinions on the matter.',
      'Joke: the hubcap has been in the gutter so long that the gnomes now count it as a plate, which it is, if you have very large dinners.',
      'Under the top layer is a small cardboard box of pinecones that somebody meant to collect in the autumn and never quite got around to.',
    ],
    parts: [
      { s: 'ball', d: [0.14], at: [-0.12, 0.07, 0.05], scale: [1, 0.5, 1], c: 'orange', seg: 6 },   // flattened leaves
      { s: 'ball', d: [0.12], at: [0.1, 0.06, 0.1], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.13], at: [0.0, 0.065, -0.1], scale: [1, 0.5, 1], c: 'leather', seg: 6 },
      { s: 'ball', d: [0.11], at: [-0.2, 0.055, -0.08], scale: [1, 0.5, 1], c: 'honey', seg: 6 },
      { s: 'ball', d: [0.12], at: [0.18, 0.06, -0.12], scale: [1, 0.5, 1], c: 'rust', seg: 6 },
      { s: 'ball', d: [0.1], at: [-0.05, 0.1, 0.0], scale: [1, 0.5, 1], c: 'orange', seg: 6 },
      { s: 'ball', d: [0.1], at: [0.06, 0.1, 0.02], scale: [1, 0.5, 1], c: 'wood-light', seg: 6 },
      { s: 'cyl', d: [0.14, 0.14, 0.02], at: [0.25, 0.039, 0.1], rot: [0, 0, 12], c: 'iron', seg: 12 }, // lost hubcap, tilted
    ],
  },
];
