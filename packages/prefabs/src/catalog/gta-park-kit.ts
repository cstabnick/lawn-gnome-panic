// Gnome Theft Auto: park kit A (bandstand, play and sport) (docs/roadmaps/gta-parks-and-fringe.md). Life-size metres, standing on
// y = 0, centred on x and z, front on +z. Each one is a chunky low-poly model at its contract size (w x d x h).
import type { PrefabDef } from '../types';

export const GTA_PARK_KIT: readonly PrefabDef[] = [
  {
    id: 'bandstand', name: 'Bandstand', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'bandstand', 'stone', 'roof', 'iron', 'music', 'park'], emoji: [],
    tint: 0x2f6e5a, trim: 'white',
    footprint: { r: 4, h: 6 },
    about: 'Gnome Theft Auto: the Bandstand. An octagonal stone floor with eight iron posts, an octagonal roof, a railing and three steps on +z. Tint = roof, trim = posts and railing. Life-size metres, for Gnome Theft Auto parks.',
    examine: [
      'A round stone floor with eight thin iron posts under a pointed roof, and a brass ball on top that the rain has never got off.',
      'Saying: whoever climbs the three front steps is expected to say something, and whoever says something is expected to be heard by the gulls.',
      'Tip: use the three front steps. The gap beside them is wide enough for a gnome, and the rails on either side are only there to be leaned on.',
      'Joke: the stone floor has heard every speech ever made on it, and has never once agreed with any of them, which is why it stays so quiet.',
      'Under the roof someone has scratched a row of tiny clay notes into a post, and each one is a tune nobody has been able to hum.',
    ],
    parts: [
      { s: 'cyl', d: [3.7, 3.7, 0.8], at: [0, 0.4, 0], c: 'stone', seg: 8 },                  // octagonal floor
      { s: 'cyl', d: [0.05, 0.05, 3.2], at: [0, 2.4, 3.2], c: 'trim', seg: 6 },                // eight posts
      { s: 'cyl', d: [0.05, 0.05, 3.2], at: [2.26, 2.4, 2.26], c: 'trim', seg: 6 },
      { s: 'cyl', d: [0.05, 0.05, 3.2], at: [3.2, 2.4, 0], c: 'trim', seg: 6 },
      { s: 'cyl', d: [0.05, 0.05, 3.2], at: [2.26, 2.4, -2.26], c: 'trim', seg: 6 },
      { s: 'cyl', d: [0.05, 0.05, 3.2], at: [0, 2.4, -3.2], c: 'trim', seg: 6 },
      { s: 'cyl', d: [0.05, 0.05, 3.2], at: [-2.26, 2.4, -2.26], c: 'trim', seg: 6 },
      { s: 'cyl', d: [0.05, 0.05, 3.2], at: [-3.2, 2.4, 0], c: 'trim', seg: 6 },
      { s: 'cyl', d: [0.05, 0.05, 3.2], at: [-2.26, 2.4, 2.26], c: 'trim', seg: 6 },
      { s: 'cyl', d: [0.3, 4.0, 1.8], at: [0, 4.9, 0], c: 'tint', seg: 8 },                   // octagonal roof, 4.0 to 5.8
      { s: 'ball', d: [0.1], at: [0, 5.9, 0], c: 'gold', seg: 6 },                              // finial
      { s: 'box', d: [2.45, 0.05, 0.06], at: [2.26, 1.8, 2.26], rot: [0, 45, 0], c: 'trim' },  // railing, gap on +z
      { s: 'box', d: [2.45, 0.05, 0.06], at: [3.2, 1.8, 0], rot: [0, 90, 0], c: 'trim' },
      { s: 'box', d: [2.45, 0.05, 0.06], at: [2.26, 1.8, -2.26], rot: [0, 135, 0], c: 'trim' },
      { s: 'box', d: [2.45, 0.05, 0.06], at: [0, 1.8, -3.2], rot: [0, 180, 0], c: 'trim' },
      { s: 'box', d: [2.45, 0.05, 0.06], at: [-2.26, 1.8, -2.26], rot: [0, 225, 0], c: 'trim' },
      { s: 'box', d: [2.45, 0.05, 0.06], at: [-3.2, 1.8, 0], rot: [0, 270, 0], c: 'trim' },
      { s: 'box', d: [2.45, 0.05, 0.06], at: [-2.26, 1.8, 2.26], rot: [0, 315, 0], c: 'trim' },
      { s: 'box', d: [2.4, 0.6, 0.83], at: [0, 0.3, 3.615], c: 'stone' },                       // three steps
      { s: 'box', d: [2.4, 0.4, 0.34], at: [0, 0.2, 4.195], c: 'stone' },
      { s: 'box', d: [2.4, 0.2, 0.34], at: [0, 0.1, 4.535], c: 'stone' },
    ],
  },
  {
    id: 'swing-set', name: 'Swing Set', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'swing', 'iron', 'chain', 'wood', 'play', 'park'], emoji: [],
    footprint: { r: 2, h: 2.4 },
    about: 'Gnome Theft Auto: the Swing Set. Two A-frame iron ends, a top bar, and two wooden swings on chains. Life-size metres, for Gnome Theft Auto parks.',
    examine: [
      'Two bench seats hang on chains from a bar across an A-frame of iron, the chains the colour of old rain and the seats worn down to the wood.',
      'Saying: a swing goes up, a swing comes down, and a gnome who has gone too high has been warned by the bar itself.',
      'Tip: hold the chains with both hands and push off with your feet. Letting go at the top is how gnomes end up in the hedge.',
      'Joke: the swings were built to go higher than the highest hedge, and the hedge has never forgiven anybody for trying.',
      'Carved into the left-hand leg is a small flat stone shape, and nobody can say whether it is a bird, a wheel or a clay gnome being dropped.',
    ],
    parts: [
      { s: 'box', d: [0.1, 2.47, 0.1], at: [1.9, 1.165, 0.45], rot: [-21.3, 0, 0], c: 'iron-dark' },  // A-frame legs
      { s: 'box', d: [0.1, 2.47, 0.1], at: [1.9, 1.165, -0.45], rot: [21.3, 0, 0], c: 'iron-dark' },
      { s: 'box', d: [0.1, 2.47, 0.1], at: [-1.9, 1.165, 0.45], rot: [-21.3, 0, 0], c: 'iron-dark' },
      { s: 'box', d: [0.1, 2.47, 0.1], at: [-1.9, 1.165, -0.45], rot: [21.3, 0, 0], c: 'iron-dark' },
      { s: 'box', d: [4.0, 0.1, 0.1], at: [0, 2.35, 0], c: 'iron-dark' },                       // top bar
      { s: 'box', d: [0.02, 1.68, 0.02], at: [-1.0, 1.46, 0], c: 'iron' },                       // chains
      { s: 'box', d: [0.02, 1.68, 0.02], at: [-0.6, 1.46, 0], c: 'iron' },
      { s: 'box', d: [0.02, 1.68, 0.02], at: [0.6, 1.46, 0], c: 'iron' },
      { s: 'box', d: [0.02, 1.68, 0.02], at: [1.0, 1.46, 0], c: 'iron' },
      { s: 'box', d: [0.4, 0.05, 0.25], at: [-0.8, 0.6, 0], c: 'wood' },                        // seats
      { s: 'box', d: [0.4, 0.05, 0.25], at: [0.8, 0.6, 0], c: 'wood' },
    ],
  },
  {
    id: 'play-slide', name: 'Play Slide', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'play', 'slide', 'ladder', 'wood', 'iron', 'park'], emoji: [],
    tint: 'yellow',
    footprint: { r: 2, h: 2.4 },
    about: 'Gnome Theft Auto: the Play Slide. A rung ladder on -z up to a 2.2 m platform with side rails, and a yellow chute down to +z. Tint = chute. Life-size metres, for Gnome Theft Auto parks.',
    examine: [
      'A short ladder climbs to a little platform with rails, and a smooth yellow chute runs down the far side to the grass.',
      'Saying: the one who goes down first is the one who gets the sit at the bottom, and the chute has never once asked who that is.',
      'Tip: go down sitting, not standing. The chute is slippery at the top and it is in no hurry to let anyone off.',
      'Joke: the chute is the only slide in Turfton ever described as eager, and the grass at the bottom has been trying to catch up ever since.',
      'Scratched on the platform rail is a row of marks like a counted list, and each one is a gnome who was sure they could reach the top in one go.',
    ],
    parts: [
      { s: 'box', d: [0.05, 2.35, 0.05], at: [-0.35, 1.1, -1.6], rot: [20, 0, 0], c: 'iron-dark' }, // ladder rails
      { s: 'box', d: [0.05, 2.35, 0.05], at: [0.35, 1.1, -1.6], rot: [20, 0, 0], c: 'iron-dark' },
      { s: 'box', d: [0.7, 0.04, 0.05], at: [0, 0.55, -1.8], c: 'iron-dark' },                  // rungs
      { s: 'box', d: [0.7, 0.04, 0.05], at: [0, 1.1, -1.6], c: 'iron-dark' },
      { s: 'box', d: [0.7, 0.04, 0.05], at: [0, 1.65, -1.4], c: 'iron-dark' },
      { s: 'box', d: [1.0, 0.1, 1.0], at: [0, 2.15, -0.7], c: 'wood' },                        // platform
      { s: 'box', d: [0.04, 0.2, 1.0], at: [-0.48, 2.3, -0.7], c: 'wood' },                    // side rails
      { s: 'box', d: [0.04, 0.2, 1.0], at: [0.48, 2.3, -0.7], c: 'wood' },
      { s: 'wedge', d: [0.8, 2.2, 2.2], at: [0, 1.1, 0.9], rot: [0, 180, 0], c: 'tint' },       // chute, high at -z
    ],
  },
  {
    id: 'climbing-frame', name: 'Climbing Frame', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'climbing', 'bars', 'frame', 'iron', 'park'], emoji: [],
    tint: 'orange',
    footprint: { r: 1.5, h: 2.2 },
    about: 'Gnome Theft Auto: the Climbing Frame. A 3 m cube of bars with middle rungs and a flat roof canopy. Tint = bars. Life-size metres, for Gnome Theft Auto parks.',
    examine: [
      'A cube of painted bars, three metres each way, with a flat roof on top and a grid of rungs in every face.',
      'Saying: a gnome who can climb the cube can climb anything, though the cube has never said what it is climbing toward.',
      'Tip: grip the corner posts first. The middle rungs are for resting, and the top bars are for pretending you did not need to rest.',
      'Joke: the frame is the only thing in the park that has been asked to hold up its own roof, and it has never once complained about the work.',
      'At the very centre of the cube someone has tied a red string to a bar and left it there, and the string has never been used for anything.',
    ],
    parts: [
      { s: 'box', d: [0.08, 2.2, 0.08], at: [-1.46, 1.1, -1.46], c: 'tint' },                  // corner posts
      { s: 'box', d: [0.08, 2.2, 0.08], at: [1.46, 1.1, -1.46], c: 'tint' },
      { s: 'box', d: [0.08, 2.2, 0.08], at: [-1.46, 1.1, 1.46], c: 'tint' },
      { s: 'box', d: [0.08, 2.2, 0.08], at: [1.46, 1.1, 1.46], c: 'tint' },
      { s: 'box', d: [3.0, 0.08, 0.08], at: [0, 2.16, -1.46], c: 'tint' },                     // top edges
      { s: 'box', d: [3.0, 0.08, 0.08], at: [0, 2.16, 1.46], c: 'tint' },
      { s: 'box', d: [0.08, 0.08, 3.0], at: [-1.46, 2.16, 0], c: 'tint' },
      { s: 'box', d: [0.08, 0.08, 3.0], at: [1.46, 2.16, 0], c: 'tint' },
      { s: 'box', d: [3.0, 0.08, 0.08], at: [0, 0.16, -1.46], c: 'tint' },                     // bottom edges
      { s: 'box', d: [3.0, 0.08, 0.08], at: [0, 0.16, 1.46], c: 'tint' },
      { s: 'box', d: [0.08, 0.08, 3.0], at: [-1.46, 0.16, 0], c: 'tint' },
      { s: 'box', d: [0.08, 0.08, 3.0], at: [1.46, 0.16, 0], c: 'tint' },
      { s: 'box', d: [3.0, 0.08, 0.08], at: [0, 1.1, -1.46], c: 'tint' },                     // middle rungs
      { s: 'box', d: [3.0, 0.08, 0.08], at: [0, 1.1, 1.46], c: 'tint' },
      { s: 'box', d: [0.08, 0.08, 3.0], at: [-1.46, 1.1, 0], c: 'tint' },
      { s: 'box', d: [0.08, 0.08, 3.0], at: [1.46, 1.1, 0], c: 'tint' },
      { s: 'box', d: [3.0, 0.06, 3.0], at: [0, 2.23, 0], c: 'wood' },                         // roof canopy
    ],
  },
  {
    id: 'see-saw', name: 'See-Saw', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'see', 'saw', 'plank', 'wood', 'park'], emoji: [],
    footprint: { r: 1.8, h: 0.9 },
    about: 'Gnome Theft Auto: the See-Saw. A wooden plank on a centre pivot, tilted a little, with a handle at each end. Life-size metres, for Gnome Theft Auto parks.',
    examine: [
      'A long plank on a short post, with a handle at each end and a flat wooden base, tipped a little toward one side.',
      'Saying: what goes up must come down, and on the see-saw it has to do it in turns, which the gnomes say is the fairest thing in Turfton.',
      'Tip: sit on the lower end and let the other gnome do the lifting. The plank is heavier than it looks, and the lighter gnome always ends up high.',
      'Joke: the see-saw is the only piece of park furniture that has ever been properly balanced, and it was balanced in a rage that lasted for years.',
      'Under the plank a dent the size of a thumb was made by a gnome who decided the see-saw needed a second opinion.',
    ],
    parts: [
      { s: 'box', d: [0.9, 0.05, 0.6], at: [0, 0.025, 0], c: 'wood-dark' },                  // base
      { s: 'box', d: [0.3, 0.42, 0.3], at: [0, 0.21, 0], c: 'iron-dark' },                    // pivot post
      { s: 'box', d: [0.3, 0.42, 0.06], at: [0, 0.21, 0.22], c: 'iron-dark' },               // pivot brackets
      { s: 'box', d: [0.3, 0.42, 0.06], at: [0, 0.21, -0.22], c: 'iron-dark' },
      { s: 'box', d: [3.4, 0.08, 0.56], at: [0, 0.46, 0], rot: [0, 0, 6], c: 'wood' },        // tilted plank
      { s: 'box', d: [0.06, 0.2, 0.06], at: [1.62, 0.77, 0], c: 'iron-dark' },                 // handles
      { s: 'box', d: [0.06, 0.2, 0.06], at: [-1.62, 0.43, 0], c: 'iron-dark' },
    ],
  },
  {
    id: 'skate-quarter-pipe', name: 'Skate Quarter Pipe', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'skate', 'ramp', 'concrete', 'park'], emoji: [],
    footprint: { r: 2, h: 1.6 },
    about: 'Gnome Theft Auto: the Skate Quarter Pipe. A concrete curved ramp rising toward -z to a deck and a steel coping rail. Life-size metres, for Gnome Theft Auto parks.',
    examine: [
      'A concrete ramp, grey and flat, curving up to a deck on the far side with a steel coping rail along the top edge.',
      'Saying: the ramp that is steepest at the top is the one that teaches the most, and the deck at the back is where the teaching is done.',
      'Tip: roll up slowly from the front, and do not look at the coping until you are on it. Looking at it early is how the lesson goes wrong.',
      'Joke: the ramp was built by a gnome who had only heard of ramps, and the deck was added once the gnome realised it had nowhere else to stand.',
      'Chalked on the lowest slab is a small square drawing of a gnome going up, with an arrow pointing the other way, which is either a warning or a sum.',
    ],
    parts: [
      { s: 'box', d: [4.0, 0.064, 0.46], at: [0, 0.032, 1.27], c: 'stone' },                 // stepped curve, low at +z
      { s: 'box', d: [4.0, 0.256, 0.46], at: [0, 0.128, 0.81], c: 'stone' },
      { s: 'box', d: [4.0, 0.576, 0.46], at: [0, 0.288, 0.35], c: 'stone' },
      { s: 'box', d: [4.0, 1.024, 0.46], at: [0, 0.512, -0.11], c: 'stone' },
      { s: 'box', d: [4.0, 1.6, 0.46], at: [0, 0.8, -0.57], c: 'stone' },
      { s: 'box', d: [4.0, 1.6, 0.7], at: [0, 0.8, -1.15], c: 'stone' },                       // deck at the back
      { s: 'cyl', d: [0.05, 0.05, 4.0], at: [0, 1.56, -0.8], rot: [0, 0, 90], c: 'steel', seg: 6 }, // coping rail
    ],
  },
  {
    id: 'grind-rail', name: 'Grind Rail', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'grind', 'rail', 'steel', 'skate', 'park'], emoji: [],
    footprint: { r: 2, h: 0.5 },
    about: 'Gnome Theft Auto: the Grind Rail. A steel rail along x on two square feet, with rounded end caps. Life-size metres, for Gnome Theft Auto parks.',
    examine: [
      'A steel rail as long as a bench and as low as a knee, set on two square feet of iron and polished on top by a great deal of sliding.',
      'Saying: a rail that is only ever slid along is a rail that gets to stay the same height, and the rail has never once been asked to change.',
      'Tip: keep your feet wide and slide with your weight low. The rail does not mind who uses it, but it does mind being hit from the side.',
      'Joke: the rail is so smooth on top that the local pigeons have started charging to sit on it, and the rail has been happy to let them.',
      'Under one foot is a tin star, pressed flat into the iron by somebody who wanted it known they had been there first.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.06, 0.4], at: [-1.6, 0.03, 0], c: 'iron-dark' },                // feet
      { s: 'box', d: [0.3, 0.06, 0.4], at: [1.6, 0.03, 0], c: 'iron-dark' },
      { s: 'box', d: [0.1, 0.38, 0.1], at: [-1.6, 0.25, 0], c: 'iron-dark' },                // stubs
      { s: 'box', d: [0.1, 0.38, 0.1], at: [1.6, 0.25, 0], c: 'iron-dark' },
      { s: 'cyl', d: [0.03, 0.03, 4.0], at: [0, 0.47, 0], rot: [0, 0, 90], c: 'steel', seg: 8 }, // rail
      { s: 'ball', d: [0.035], at: [-2.0, 0.47, 0], c: 'steel', seg: 6 },                    // end caps
      { s: 'ball', d: [0.035], at: [2.0, 0.47, 0], c: 'steel', seg: 6 },
    ],
  },
  {
    id: 'football-goal', name: 'Football Goal', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'football', 'goal', 'net', 'white', 'park'], emoji: [],
    footprint: { r: 2.5, h: 2.2 },
    about: 'Gnome Theft Auto: the Football Goal. Two white posts and a crossbar on +z, with a sloping grey net that drops to the grass at -z. Life-size metres, for Gnome Theft Auto parks.',
    examine: [
      'Two white posts and a crossbar at the front, with a sloping grey net that drops from the top back down to the grass.',
      'Saying: a goal is only a goal if somebody else is standing on the wrong side of it, and the posts have been very clear about which side that is.',
      'Tip: stand in the middle of the goal when the ball comes, and the net will catch whatever you do. It is the only net in Turfton that keeps its promises.',
      'Joke: the net has caught so many balls that it now sags in the middle like an old sofa, and it has grown rather proud of the sag.',
      'Painted on the back bar is a row of numbers that count the goals scored by gnomes who were not there, and the count is always high.',
    ],
    parts: [
      { s: 'cyl', d: [0.05, 0.05, 2.2], at: [-2.4, 1.1, 0.8], c: 'white', seg: 6 },              // front posts
      { s: 'cyl', d: [0.05, 0.05, 2.2], at: [2.4, 1.1, 0.8], c: 'white', seg: 6 },
      { s: 'cyl', d: [0.05, 0.05, 4.8], at: [0, 2.2, 0.8], rot: [0, 0, 90], c: 'white', seg: 6 }, // crossbar
      { s: 'cyl', d: [0.04, 0.04, 2.72], at: [-2.4, 1.1, 0], rot: [36, 0, 0], c: 'white', seg: 6 }, // side bars, sloping back
      { s: 'cyl', d: [0.04, 0.04, 2.72], at: [2.4, 1.1, 0], rot: [36, 0, 0], c: 'white', seg: 6 },
      { s: 'box', d: [4.9, 0.06, 0.06], at: [0, 0.03, 0.8], c: 'white' },                        // base bars
      { s: 'box', d: [4.9, 0.06, 0.06], at: [0, 0.03, -0.8], c: 'white' },
      { s: 'box', d: [4.8, 2.72, 0.03], at: [0, 1.1, 0], rot: [36, 0, 0], c: 'silver' },        // net
      { s: 'box', d: [4.8, 0.03, 0.04], at: [0, 1.65, 0.4], rot: [36, 0, 0], c: 'silver' },    // net strands
      { s: 'box', d: [4.8, 0.03, 0.04], at: [0, 0.55, -0.4], rot: [36, 0, 0], c: 'silver' },
    ],
  },
];
