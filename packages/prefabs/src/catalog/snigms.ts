// Snigms household furniture: the bathroom and kitchen fittings and the telly. Gnome-made from garden scraps.
// Front faces +z. Footprints at scale 1 are in the `about` of each entry and checked by games/snigms/src/furniture.test.ts.
import type { PrefabDef } from '../types';

export const SNIGMS: PrefabDef[] = [
  {
    id: 'toilet', name: 'Toilet', category: 'furniture', uses: ['place', 'sit'],
    tags: ['toilet', 'loo', 'bathroom', 'snigms', 'cistern', 'flush', 'porcelain', 'seat'], emoji: [],
    tint: 'white', trim: 'steel',
    seat: [0, 0.445, 0.06],
    about: 'A porcelain toilet with a tall cistern and a flush handle. Tint is the porcelain, trim is the fittings.',
    examine: [
      'A bowl of glazed clay on a squat base, with a lidded cistern up against the back wall. The lid has a crack, mended with tar.',
      'Saying: "The bowl knows what you did. The cistern just makes it official."',
      'The flush handle is a bent spoon handle. It works best with two hands and a hopeful face.',
      'Sit down with your back to the cistern. The cistern is the only thing in the room that does not judge you.',
      'Gnomes swear it is the warmest seat in the house. Nobody has ever sat on it long enough to check.',
      'Someone scratched a tiny rowing boat into the seat. Nobody remembers who, and the boat is still not going anywhere.',
    ],
    parts: [
      { s: 'box', d: [0.4, 0.4, 0.46], at: [0, 0.2, 0.05], c: 'tint' },             // bowl
      { s: 'box', d: [0.42, 0.05, 0.42], at: [0, 0.42, 0.06], c: 'tint' },          // seat ring
      { s: 'box', d: [0.4, 0.75, 0.16], at: [0, 0.375, -0.32], c: 'tint' },         // cistern
      { s: 'box', d: [0.42, 0.06, 0.18], at: [0, 0.78, -0.32], c: 'trim' },         // cistern lid
      { s: 'box', d: [0.08, 0.03, 0.04], at: [0.14, 0.8, -0.32], c: 'trim' },       // flush handle
    ],
  },
  {
    id: 'sink', name: 'Sink', category: 'furniture', uses: ['place'],
    tags: ['sink', 'basin', 'bathroom', 'snigms', 'tap', 'pedestal', 'wash', 'porcelain'], emoji: [],
    tint: 'white', trim: 'steel',
    about: 'A pedestal basin at counter height with a tap on the back. Tint is the porcelain, trim is the tap.',
    examine: [
      'A round stem of white clay holds up a shallow basin with a dark plug-hole. The whole thing wobbles when leaned on.',
      'Old saying: "Wash the face before the mirror asks."',
      'The tap runs cold for a long time before it runs anything else. Patience is the gnome way with taps.',
      'The basin is exactly the height of a gnome who has stopped growing. Taller gnomes have to bend, and they complain.',
      'A bar of green soap sits in a dish at the back, worn to the shape of one thumb.',
      'There is a crack in the glaze that looks like a river. Gnomes have named the river, and it is not the Thatch.',
    ],
    parts: [
      { s: 'cyl', d: [0.08, 0.12, 0.6], at: [0, 0.3, 0.02], c: 'tint', seg: 8 },     // pedestal
      { s: 'box', d: [0.62, 0.12, 0.5], at: [0, 0.66, 0.02], c: 'tint' },           // basin
      { s: 'box', d: [0.46, 0.02, 0.36], at: [0, 0.72, 0.02], c: 'iron-dark' },     // basin hollow
      { s: 'cyl', d: [0.025, 0.025, 0.16], at: [0, 0.8, -0.2], c: 'trim', seg: 8 }, // tap stem
      { s: 'box', d: [0.03, 0.03, 0.14], at: [0, 0.88, -0.14], c: 'trim' },         // tap spout
    ],
  },
  {
    id: 'bathtub', name: 'Bathtub', category: 'furniture', uses: ['place'],
    tags: ['bathtub', 'bath', 'tub', 'bathroom', 'snigms', 'soak', 'water', 'saucer', 'enamel'], emoji: [],
    tint: 'white', trim: 'steel',
    about: 'A long enamel tub made from a plant saucer, with a tap at one end and water in the bottom. Tint is the enamel, trim is the tap.',
    examine: [
      'A deep saucer from the potting shed, sealed with tar and painted white. It has held water every day since it was found.',
      'Saying: "A bath is a small sea for one gnome, and the sea is always cold by the second kettle."',
      'The water in the bottom is kept a little bit blue with a drop of cornflower dye. It does not help with the cold.',
      'The tap at the end drips in a pattern. Gnomes who are good at counting say the pattern is a song.',
      'Mind the rim. It is smooth on the inside and very rough on the outside, which is how a bath is meant to be.',
      'Someone left a rubber duck in the corner. It is not a duck. It is a pebble with ambitions, and it floats anyway.',
    ],
    parts: [
      { s: 'box', d: [0.1, 0.5, 1.86], at: [-0.41, 0.25, 0], c: 'tint' },           // long wall
      { s: 'box', d: [0.1, 0.5, 1.86], at: [0.41, 0.25, 0], c: 'tint' },            // long wall
      { s: 'box', d: [0.82, 0.5, 0.1], at: [0, 0.25, -0.88], c: 'tint' },           // end wall
      { s: 'box', d: [0.82, 0.5, 0.1], at: [0, 0.25, 0.88], c: 'tint' },            // end wall
      { s: 'box', d: [0.82, 0.08, 1.66], at: [0, 0.04, 0], c: 'tint' },             // floor
      { s: 'box', d: [0.78, 0.02, 1.62], at: [0, 0.4, 0], c: 'glaze-blue', alpha: 0.6 }, // water
      { s: 'cyl', d: [0.025, 0.025, 0.12], at: [0, 0.56, -0.8], c: 'trim', seg: 8 }, // tap stem
      { s: 'box', d: [0.03, 0.03, 0.12], at: [0, 0.6, -0.76], c: 'trim' },          // tap spout
    ],
  },
  {
    id: 'shower', name: 'Shower', category: 'furniture', uses: ['place'],
    tags: ['shower', 'bathroom', 'snigms', 'glass', 'tray', 'head', 'pipe', 'spray', 'rain'], emoji: [],
    tint: 'white', trim: 'steel',
    about: 'A corner shower with a tray, glass panels on two sides and a rose head on a pipe. Tint is the tray, trim is the frame.',
    examine: [
      'A shallow tray of white clay with two panes of old window glass, held up by four steel posts that were once a bed frame.',
      'Saying: "Rain falls from the sky, but a shower falls from the wall, which is a much smaller sky."',
      'The head is a sieve from the kitchen, bolted to a pipe. It sprays in every direction except the one you are facing.',
      'Stand in the middle of the tray. The glass keeps the water in and the gnome out, which is what glass is for.',
      'The drain is a ring of holes bored with a hot nail. It clogs with leaves every autumn, and every autumn it is a surprise.',
      'When the pipe knocks, it is the sign that the water is warm. When it stops knocking, go and find the boiler gnome.',
    ],
    parts: [
      { s: 'box', d: [0.9, 0.06, 0.9], at: [0, 0.03, 0], c: 'tint' },              // tray
      { s: 'box', d: [0.9, 1.9, 0.03], at: [0, 0.95, -0.42], c: 'glass', alpha: 0.35 }, // back glass
      { s: 'box', d: [0.03, 1.9, 0.9], at: [-0.42, 0.95, 0], c: 'glass', alpha: 0.35 }, // side glass
      { s: 'box', d: [0.04, 1.9, 0.04], at: [0.43, 0.95, -0.43], c: 'trim' },       // post
      { s: 'box', d: [0.04, 1.9, 0.04], at: [-0.43, 0.95, -0.43], c: 'trim' },      // post
      { s: 'box', d: [0.04, 1.9, 0.04], at: [0.43, 0.95, 0.43], c: 'trim' },        // post
      { s: 'box', d: [0.04, 1.9, 0.04], at: [-0.43, 0.95, 0.43], c: 'trim' },       // post
      { s: 'box', d: [0.03, 0.03, 0.16], at: [0, 1.8, -0.33], c: 'trim' },          // pipe
      { s: 'box', d: [0.16, 0.04, 0.16], at: [0, 1.72, -0.25], c: 'trim' },         // rose head
    ],
  },
  {
    id: 'stove', name: 'Stove', category: 'furniture', uses: ['place'],
    tags: ['stove', 'cooker', 'range', 'hob', 'oven', 'kitchen', 'snigms', 'burner', 'cook', 'fire'], emoji: [],
    tint: 'iron-dark', trim: 'steel',
    about: 'A squat iron range with four burner rings, an oven door and a row of knobs. Tint is the iron, trim is the knobs and handle.',
    examine: [
      'A black iron box with four round burners on top and an oven door at the front. It was once a boiler for a much larger gnome.',
      'Saying: "The stove never lies about the heat. It only lies about how long the stew will take."',
      'The knobs are carved from old cork stoppers. Turn them slowly, or the flame will do the turning for you.',
      'Keep the oven door shut while the stew is on. Open it and the whole kitchen goes quiet, which is worse than a shout.',
      'Two burners glow orange long after they are switched off. Gnomes call this the stove remembering.',
      'Somebody scratched a face into the oven door. It looks hungry, and it is always, always right about dinner.',
    ],
    parts: [
      { s: 'box', d: [0.9, 0.84, 0.8], at: [0, 0.42, 0], c: 'tint' },              // body
      { s: 'box', d: [0.9, 0.03, 0.8], at: [0, 0.845, 0], c: 'tint' },              // hob
      { s: 'ring', d: [0.07, 0.015], at: [-0.22, 0.87, -0.18], rot: [90, 0, 0], c: 'trim', seg: 8 },
      { s: 'ring', d: [0.07, 0.015], at: [0.22, 0.87, -0.18], rot: [90, 0, 0], c: 'trim', seg: 8 },
      { s: 'ring', d: [0.07, 0.015], at: [-0.22, 0.87, 0.18], rot: [90, 0, 0], c: 'trim', seg: 8 },
      { s: 'ring', d: [0.07, 0.015], at: [0.22, 0.87, 0.18], rot: [90, 0, 0], c: 'trim', seg: 8 },
      { s: 'box', d: [0.8, 0.5, 0.03], at: [0, 0.3, 0.415], c: 'iron-dark' },        // oven door
      { s: 'box', d: [0.5, 0.25, 0.01], at: [0, 0.32, 0.43], c: 'glass', alpha: 0.35 }, // oven window
      { s: 'box', d: [0.5, 0.06, 0.01], at: [0, 0.14, 0.43], c: 'orange', glow: true }, // embers
      { s: 'box', d: [0.7, 0.03, 0.04], at: [0, 0.56, 0.44], c: 'trim' },           // door handle
      { s: 'cyl', d: [0.025, 0.025, 0.04], at: [-0.3, 0.72, 0.42], rot: [90, 0, 0], c: 'trim', seg: 8 },
      { s: 'cyl', d: [0.025, 0.025, 0.04], at: [-0.15, 0.72, 0.42], rot: [90, 0, 0], c: 'trim', seg: 8 },
      { s: 'cyl', d: [0.025, 0.025, 0.04], at: [0.15, 0.72, 0.42], rot: [90, 0, 0], c: 'trim', seg: 8 },
      { s: 'cyl', d: [0.025, 0.025, 0.04], at: [0.3, 0.72, 0.42], rot: [90, 0, 0], c: 'trim', seg: 8 },
    ],
  },
  {
    id: 'tv', name: 'Telly', category: 'furniture', uses: ['place'],
    tags: ['tv', 'telly', 'television', 'screen', 'box', 'living', 'snigms', 'antenna', 'stand', 'glow'], emoji: [],
    tint: 'iron-dark', trim: 'yellow',
    about: 'A boxy telly on a stand, with two bent antenna wires and a glowing screen. Tint is the case, trim is the stand and bezel.',
    examine: [
      'A wooden box with a glass screen, mounted on a stand made from a seed-packet frame. The frame still says "Radish" on one side.',
      'Saying: "The telly shows you the world, and the world, sadly, is mostly weather."',
      'The antennae are two bent coat hangers. Turn them toward the Fence for the clearest picture of the neighbours.',
      'The screen glows blue even when nothing is on. Gnomes say it is waiting for something worth showing.',
      'Do not sit too close. The picture is very small when you are a gnome, and the sound is very large.',
      'The back of the box has a sticker that reads "Mossbottom Cable Co." It has never been connected to any cable.',
    ],
    parts: [
      { s: 'box', d: [0.8, 0.06, 0.3], at: [0, 0.03, 0], c: 'trim' },              // stand base
      { s: 'box', d: [0.08, 0.12, 0.06], at: [0, 0.12, 0], c: 'trim' },             // stand neck
      { s: 'box', d: [0.78, 0.44, 0.14], at: [0, 0.4, 0], c: 'tint' },              // case
      { s: 'box', d: [0.66, 0.34, 0.02], at: [0, 0.4, 0.08], c: 'glaze-blue', glow: true }, // screen
      { s: 'box', d: [0.02, 0.2, 0.02], at: [0.13, 0.7, 0], rot: [0, 0, -25], c: 'trim' },  // antenna
      { s: 'box', d: [0.02, 0.2, 0.02], at: [-0.13, 0.7, 0], rot: [0, 0, 25], c: 'trim' },  // antenna
    ],
  },
];
