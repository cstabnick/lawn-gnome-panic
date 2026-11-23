// Gnome Theft Auto: the Lost & Found Speedway. Grandstands built from the Great Spill's giant Tall-One junk, barriers,
// the start gantry, floodlights, sponsor boards, pit garages and the podium.
import type { Part, PrefabDef } from '../types';

const STEEL = 0x8a9097;
const DARK_STEEL = 0x5a5f66;
const CREAM = 0xf3ead2;
const GOLD = 0xd4af37;
const RAIL = 0x3a3a3a;
const TIMBER = 0xa0784a;
const WHITE = 0xf4f4f4;
const BLACK = 0x111111;
const SPEEDWAY_TINT = 0xffd21f;
const GREEN_HOSE = 0x3f9d3a;
const BRASS = 0xc9a227;

// Each deck is a top surface that crowds stand on: keep parts off it, except the front rail.
const BOOK_STAND: PrefabDef = {
  id: 'speedway-book-stand', name: 'Book Stack Grandstand', category: 'prop', uses: ['place'],
  tags: ['book', 'stand', 'grandstand', 'bleacher', 'speedway', 'giant', 'landmark'], emoji: [],
  tint: SPEEDWAY_TINT,
  footprint: { r: 12, h: 15 },
  about: 'Gnome Theft Auto: the Book Stack Grandstand. Three giant hardbacks stacked as steps, front +z. Decks at y 3, 6 and 9 hold the crowd. Tint recolours the bookmark ribbon.',
  examine: [
    'Three giant Tall-One books stacked like steps, red at the bottom, blue in the middle and green on top, all smelling of old paper.',
    'Gnome saying: "Read the cover before you sit on the cover", which is about the only advice the grandstand has ever given.',
    'Tip: the top step is the best seat at the Lost & Found Speedway, provided you can climb three books without losing your hat.',
    'Joke: Buck-Iron tried to read the bottom book, and it took him until after the Great Spill to get through the first chapter.',
    'A yellow ribbon hangs from the top book, marking the page where the last Tall One stopped reading.',
  ],
  parts: [
    { s: 'box', d: [24, 3, 16], at: [0, 1.5, 0], c: 0x8b1e2b },
    { s: 'box', d: [23, 2.4, 0.1], at: [0, 1.5, 8], c: CREAM },
    { s: 'box', d: [22, 2.2, 0.2], at: [0, 1.5, -8.05], c: GOLD },
    { s: 'box', d: [23, 0.1, 0.1], at: [0, 4, 7.95], c: RAIL },
    { s: 'box', d: [24, 3, 11], at: [0, 4.5, -2.5], c: 0x1f4e79 },
    { s: 'box', d: [23, 2.4, 0.1], at: [0, 4.5, 3], c: CREAM },
    { s: 'box', d: [22, 2.2, 0.2], at: [0, 4.5, -8.05], c: GOLD },
    { s: 'box', d: [23, 0.1, 0.1], at: [0, 7, 2.95], c: RAIL },
    { s: 'box', d: [24, 3, 6], at: [0, 7.5, -5], c: 0x2e6b3a },
    { s: 'box', d: [23, 2.4, 0.1], at: [0, 7.5, -2], c: CREAM },
    { s: 'box', d: [22, 2.2, 0.2], at: [0, 7.5, -8.05], c: GOLD },
    { s: 'box', d: [23, 0.1, 0.1], at: [0, 10, -2.05], c: RAIL },
    { s: 'box', d: [0.3, 6, 0.1], at: [10, 12, -8.05], c: 'tint' },
  ],
};

const SNEAKER_STAND: PrefabDef = {
  id: 'speedway-sneaker-stand', name: 'Sneaker Grandstand', category: 'prop', uses: ['place'],
  tags: ['sneaker', 'shoe', 'trainer', 'bleacher', 'grandstand', 'speedway', 'giant', 'landmark'], emoji: [],
  footprint: { r: 14, h: 9.5 },
  about: 'Gnome Theft Auto: the Sneaker Grandstand. A giant red-and-white Tall-One sneaker lying along x, toe at +x, with a timber bleacher against its +z side. Decks: the four tier tops and the upper at y 9 near the heel.',
  examine: [
    'A red-and-white Tall-One shoe lying on its side, laces across the top, big enough to hide a gnome village in its heel.',
    'Dandelion Fizz says a shoe this size has walked a thousand miles, though nobody has seen where it went.',
    'Tip: the bleacher benches are timber and splintery, so bring a cushion of moss before you climb the tiers.',
    'Joke: the Hat Watch gave up searching the toe for stolen hats after one of its own got lost in the laces.',
    'Gnome law: whoever sits in the collar gets first pick of the peanuts, and last pick of the dry seats.',
  ],
  parts: [
    { s: 'box', d: [23, 1.5, 10], at: [-2.5, 0.75, 0], c: WHITE },
    { s: 'cyl', d: [5, 5, 1.48], at: [9, 0.74, 0], c: WHITE, seg: 10 },
    { s: 'box', d: [20, 7.5, 9], at: [-4, 5.25, 0], c: 0xd8342c },
    { s: 'box', d: [8, 3, 9], at: [10, 3, 0], c: 0xd8342c },
    { s: 'box', d: [0.4, 0.2, 6], at: [-1, 9.1, 0], c: WHITE },
    { s: 'box', d: [0.4, 0.2, 6], at: [1, 9.1, 0], c: WHITE },
    { s: 'box', d: [0.4, 0.2, 6], at: [3, 9.1, 0], c: WHITE },
    { s: 'box', d: [0.4, 0.2, 6], at: [5, 9.1, 0], c: WHITE },
    { s: 'box', d: [1.8, 0.5, 7], at: [-13.1, 9.25, 0], c: 0x222222 },
    { s: 'box', d: [20, 1, 1.5], at: [0, 0.5, 10.25], c: TIMBER },
    { s: 'box', d: [20, 2, 1.5], at: [0, 1, 8.75], c: TIMBER },
    { s: 'box', d: [20, 3, 1.5], at: [0, 1.5, 7.25], c: TIMBER },
    { s: 'box', d: [20, 4, 1.5], at: [0, 2, 5.75], c: TIMBER },
  ],
};

const COOLER_STAND: PrefabDef = {
  id: 'speedway-cooler-stand', name: 'Cooler Grandstand', category: 'prop', uses: ['place'],
  tags: ['cooler', 'box', 'stand', 'grandstand', 'picnic', 'speedway', 'giant', 'landmark'], emoji: [],
  footprint: { r: 8.5, h: 12 },
  about: 'Gnome Theft Auto: the Cooler Grandstand. A giant blue picnic cooler with a white stripe, a lid that is the deck (y 11.5), and a timber ladder on the +z face.',
  examine: [
    'A blue box the size of a garden shed, with a white stripe around its middle and a lid wide enough for a gnome picnic.',
    'Saying: "What is cold in the box stays cold in the box", repeated by anyone who has ever opened it in the Dust Flats.',
    'Tip: the timber ladder leans on the side. Do not lift the lid while someone is standing on top of it.',
    'Joke: the ice inside melted during the Great Spill, so now the cooler only keeps opinions cold.',
    'Two grey handles on the ends are too high for a gnome to reach, which is the Tall-One way of saying keep out.',
  ],
  parts: [
    { s: 'box', d: [16, 10, 10], at: [0, 5, 0], c: 0x2f7fd1 },
    { s: 'box', d: [16.4, 1.5, 10.4], at: [0, 10.75, 0], c: WHITE },
    { s: 'box', d: [0.4, 0.4, 6], at: [-8.4, 10.8, 0], c: 0x9a9a9a },
    { s: 'box', d: [0.4, 0.4, 6], at: [8.4, 10.8, 0], c: 0x9a9a9a },
    { s: 'box', d: [16.2, 1, 0.2], at: [0, 6, 5.1], c: WHITE },
    { s: 'box', d: [16.2, 1, 0.2], at: [0, 6, -5.1], c: WHITE },
    { s: 'box', d: [0.2, 1, 10.2], at: [-8.1, 6, 0], c: WHITE },
    { s: 'box', d: [0.2, 1, 10.2], at: [8.1, 6, 0], c: WHITE },
    { s: 'box', d: [0.15, 10, 0.15], at: [5.6, 5, 5.3], c: TIMBER },
    { s: 'box', d: [0.15, 10, 0.15], at: [6.4, 5, 5.3], c: TIMBER },
    ...[1.2, 2.4, 3.6, 4.8, 6, 7.2, 8.4, 9.6].map((y, i): Part => (
      { s: 'box', d: [1, 0.12, 0.12], at: [6, y, 5.3], c: TIMBER }
    )),
  ],
};

// Twelve alternating black and white squares on one face of the beam (at least 12 per face).
const chequer = (z: number, name: string): Part[] =>
  Array.from({ length: 12 }, (_, i): Part => ({
    s: 'box', d: [2, 1, 0.03], at: [-11 + 2 * i, 8.9, z],
    c: i % 2 === 0 ? BLACK : WHITE,
  }));

const lamps = [-4, -2, 0, 2, 4];

const START_GANTRY: PrefabDef = {
  id: 'speedway-gantry', name: 'Start Gantry', category: 'prop', uses: ['place'],
  tags: ['gantry', 'start', 'arch', 'chequered', 'lamp', 'speedway', 'giant', 'landmark'], emoji: [],
  tint: SPEEDWAY_TINT,
  footprint: { r: 12, h: 11 },
  about: 'Gnome Theft Auto: the Start Gantry. A 24 m steel arch over the road, cars drive along z underneath. Lamps lens-named lamp-0..4 (front) and lamp-back-0..4; the banner is tint.',
  examine: [
    'A grey arch over the track with five red lamps under its beam and a chequered panel on both faces.',
    'Racing lore: the lamps go from red to green, and no gnome has ever agreed on which colour means go.',
    'Tip: count the lamps before the start. Any lamp that goes out early means somebody has cheated.',
    'Joke: the first gnome under the gantry always claims he was there first, which is also how the finish line works.',
    'Someone has scratched a tally of wins into the left pillar, and the tally goes up or down depending on who is looking.',
  ],
  parts: [
    { s: 'box', d: [0.9, 8.6, 0.9], at: [-11.4, 4.3, 0], c: DARK_STEEL },
    { s: 'box', d: [0.9, 8.6, 0.9], at: [11.4, 4.3, 0], c: DARK_STEEL },
    { s: 'box', d: [24, 1.8, 1.2], at: [0, 8.9, 0], c: STEEL },
    { s: 'box', d: [24, 1.2, 0.2], at: [0, 10.45, 0], c: 'tint' },
    { s: 'box', d: [9, 1.2, 0.4], at: [0, 7.4, 0.8], c: BLACK },
    { s: 'box', d: [9, 1.2, 0.4], at: [0, 7.4, -0.8], c: BLACK },
    ...lamps.map((x, i): Part => (
      { s: 'cyl', d: [0.3, 0.3, 0.06], rot: [90, 0, 0], at: [x, 7.4, 1.02], c: 0xff2a1a, glow: true, seg: 10 }
    )),
    ...lamps.map((x, i): Part => (
      { s: 'cyl', d: [0.3, 0.3, 0.06], rot: [90, 0, 0], at: [x, 7.4, -1.02], c: 0xff2a1a, glow: true, seg: 10 }
    )),
    ...chequer(0.632, 'chequer-front'),
    ...chequer(-0.632, 'chequer-back'),
  ],
};

const TYRE_STACK: PrefabDef = {
  id: 'speedway-tyre-stack', name: 'Tyre Stack', category: 'prop', uses: ['place'],
  tags: ['tyre', 'tire', 'wheel', 'stack', 'barrier', 'speedway', 'giant'], emoji: [],
  tint: WHITE,
  footprint: { r: 0.6, h: 0.9 },
  about: 'Gnome Theft Auto: the Tyre Stack. Two stacked black tyres, each with a painted band ring. Tint recolours the bands.',
  examine: [
    'Two black Tall-One wheels stacked on each other, each with a painted white ring around its middle.',
    'Saying: "Stack the rounds and the road stays where it is", said by gnomes who have never seen a road.',
    'Tip: they make a decent barrier, but the stack will roll downhill if somebody kicks the bottom one.',
    'Joke: Razor-Back is sure there is a whole village inside the stack, but he has been wrong about the village before.',
    'Scratched into the top tyre: a tally of races run and tyres stolen, with the second number larger.',
  ],
  parts: [
    { s: 'cyl', d: [0.6, 0.6, 0.45], at: [0, 0.225, 0], c: 0x1b1b1b, seg: 12 },
    { s: 'cyl', d: [0.6, 0.6, 0.45], at: [0, 0.675, 0], c: 0x1b1b1b, seg: 12 },
    { s: 'ring', d: [0.61, 0.03], rot: [90, 0, 0], at: [0, 0.225, 0], c: 'tint' },
    { s: 'ring', d: [0.61, 0.03], rot: [90, 0, 0], at: [0, 0.675, 0], c: 'tint' },
  ],
};

const HOSE_BARRIER: PrefabDef = {
  id: 'speedway-hose-run', name: 'Hose Barrier', category: 'prop', uses: ['place'],
  tags: ['hose', 'barrier', 'green', 'coil', 'garden', 'speedway', 'giant'], emoji: [],
  footprint: { r: 5, h: 1.4 },
  about: 'Gnome Theft Auto: the Hose Barrier. A straight 10 m green coil lying along x on the ground, with four darker bands. Lowest point y = 0.',
  examine: [
    'A long green coil lying on the ground, ribbed with darker bands, as thick as a gnome and about ten gnomes long.',
    'Saying: "Green is the colour of the Planting, and this one never stops being green."',
    'Tip: step over it instead of through it. The coil is wet, and the last gnome who walked the ring has not come back.',
    'Joke: it blocks the road better than any Hat Watch barricade, and at least it does not charge for the privilege.',
    'A brass fitting is tied to one end, and the gnomes of Thatchford still argue whether it is a crown or a funnel.',
  ],
  parts: [
    { s: 'cyl', d: [0.7, 0.7, 10], rot: [0, 0, 90], at: [0, 0.7, 0], c: GREEN_HOSE, seg: 10 },
    ...[-3, -1, 1, 3].map((x, i): Part => (
      { s: 'cyl', d: [0.73, 0.73, 0.3], rot: [0, 0, 90], at: [x, 0.7, 0], c: 0x2b7a28, seg: 10 }
    )),
  ],
};

const HOSE_ARCH: PrefabDef = {
  id: 'speedway-hose-arch', name: 'Hose Loop', category: 'prop', uses: ['place'],
  tags: ['hose', 'arch', 'loop', 'green', 'nozzle', 'speedway', 'giant', 'landmark'], emoji: [],
  footprint: { r: 12.5, h: 12 },
  about: 'Gnome Theft Auto: the Hose Loop. A giant green coil rising in a half arch over the road (top at y 12, feet on the ground at x +-10.6), with a brass nozzle at the -x foot.',
  examine: [
    'The green coil rises over the road in one great arch, with a brass nozzle lying at its foot like a dropped trumpet.',
    'Saying: "Under the arch, one lap. Over the arch, two laps. Through the arch, somebody has called the Hat Watch."',
    'Tip: the brass nozzle drips cold water on passing drivers, which is the nearest thing to a pit stop out here.',
    'Joke: the arch was built in one afternoon, and it has been defending that same afternoon ever since.',
    'The Tall Ones left no notes, so the gnomes guess the arch is for hanging laundry, or for holding up a rainbow.',
  ],
  parts: [
    { s: 'ring', d: [10.6, 0.7, 180], at: [0, 0.7, 0], c: GREEN_HOSE, seg: 10 },
    { s: 'cyl', d: [0.45, 0.45, 0.8], rot: [0, 0, 90], at: [-12.3, 0.45, 0], c: BRASS, seg: 10 },
    { s: 'cone', d: [0.45, 0.5], rot: [0, 0, 90], at: [-11.65, 0.45, 0], c: BRASS, seg: 10 },
  ],
};

const LIGHT_TOWER: PrefabDef = {
  id: 'speedway-light-tower', name: 'Floodlight Tower', category: 'prop', uses: ['place'],
  tags: ['floodlight', 'light', 'tower', 'lamp', 'steel', 'speedway', 'giant', 'landmark'], emoji: [],
  footprint: { r: 1.2, h: 17 },
  about: 'Gnome Theft Auto: the Floodlight Tower. A 16 m grey steel lattice tower with a platform at y 15 and six glowing flood lamps facing +z (flood-0..flood-5).',
  examine: [
    'A grey steel tower sixteen gnomes high, with a platform up top and six pale lamps that face the track.',
    'Saying: "A lamp on a pole is a sun that did not go to bed", said by the Turfton night shift, who have never slept.',
    'Tip: climb it only in daylight. The lamps are hot enough to make a gnome sulk for a week.',
    'Joke: the lamps shine so bright that the Hat Watch cannot find its own hats at night.',
    'Someone has painted a small gnome face on the back post, and the face looks more worried the longer you look at it.',
  ],
  parts: [
    ...[[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].map(([x, z], i): Part => (
      { s: 'cyl', d: [0.15, 0.15, 16], at: [x, 8, z], c: DARK_STEEL, seg: 6 }
    )),
    { s: 'box', d: [2, 0.2, 2], at: [0, 15.1, 0], c: STEEL },
    ...[5, 10].flatMap((y, row): Part[] => [
      { s: 'box', d: [1.6, 0.08, 0.08], at: [0, y, 0.8], c: STEEL },
      { s: 'box', d: [1.6, 0.08, 0.08], at: [0, y, -0.8], c: STEEL },
      { s: 'box', d: [0.08, 0.08, 1.6], at: [0.8, y, 0], c: STEEL },
      { s: 'box', d: [0.08, 0.08, 1.6], at: [-0.8, y, 0], c: STEEL },
    ]),
    ...[15.5, 16.1].flatMap((y, row): Part[] =>
      [-0.85, 0, 0.85].map((x, col): Part => (
        { s: 'box', d: [0.8, 0.6, 0.2], at: [x, y, 1.1], c: 0xfff6d8, glow: true }
      )),
    ),
  ],
};

const SPONSOR_BOARD: PrefabDef = {
  id: 'speedway-banner', name: 'Sponsor Board', category: 'prop', uses: ['place'],
  tags: ['banner', 'sponsor', 'board', 'sign', 'speedway', 'giant'], emoji: [],
  tint: SPEEDWAY_TINT,
  trim: 0x1d1d1d,
  footprint: { r: 3, h: 2.7 },
  about: 'Gnome Theft Auto: the Sponsor Board. A 6 x 2 yellow board on two posts, with black trim stripes along the top and bottom. Tint recolours the face; trim the stripes.',
  examine: [
    'A yellow sponsor board, six gnomes wide, with black stripes across its top and bottom and two thin legs.',
    'Saying: "Whose name is on the board is whoever paid for the race."',
    'Tip: read the board from the grandstand, not the infield. The letters are big enough for a Tall-One eye.',
    'Joke: the sponsor is Razor-Back, who has paid for the same board three times and still has not read it.',
    'The board is painted gold and black, which means it is official, or at least loud.',
  ],
  parts: [
    { s: 'box', d: [6, 2, 0.2], at: [0, 1.6, 0], c: 'tint' },
    { s: 'box', d: [6.1, 0.14, 0.44], at: [0, 2.62, 0], c: 'trim' },
    { s: 'box', d: [6.1, 0.14, 0.44], at: [0, 0.58, 0], c: 'trim' },
    { s: 'box', d: [0.2, 0.6, 0.2], at: [-2, 0.3, 0], c: 0x6b6b6b },
    { s: 'box', d: [0.2, 0.6, 0.2], at: [2, 0.3, 0], c: 0x6b6b6b },
  ],
};

const PIT_GARAGE: PrefabDef = {
  id: 'speedway-pit-garage', name: 'Pit Garage', category: 'prop', uses: ['place'],
  tags: ['pit', 'garage', 'shed', 'box', 'tool', 'tyre', 'speedway'], emoji: [],
  tint: SPEEDWAY_TINT,
  footprint: { r: 4, h: 4.6 },
  about: 'Gnome Theft Auto: the Pit Garage. An 8 x 8 m grey box with an open +z front, a tint stripe across the roof front, a tool board on the back wall and a tyre stack inside.',
  examine: [
    'A grey pit box eight gnomes wide, open at the front, with a yellow stripe across its roof and a tool board on the back wall.',
    'Saying: "The pit is where a car goes to be fixed, and the mechanic goes to be paid."',
    'Tip: the tyres are all the same size, which is the only fair thing about the Lost & Found Speedway.',
    'Joke: nobody has ever found the mechanic, so the garage is mostly used for storing what the mechanic left behind.',
    'Outlines are painted around each tool on the board, so the gnomes know exactly what has gone missing.',
  ],
  parts: [
    { s: 'box', d: [7.4, 4.2, 0.3], at: [0, 2.1, -3.85], c: 0xcfd3d6 },
    { s: 'box', d: [0.3, 4.2, 8], at: [-3.85, 2.1, 0], c: 0xcfd3d6 },
    { s: 'box', d: [0.3, 4.2, 8], at: [3.85, 2.1, 0], c: 0xcfd3d6 },
    { s: 'box', d: [8, 0.3, 8], at: [0, 4.35, 0], c: 0xcfd3d6 },
    { s: 'box', d: [8, 0.3, 0.1], at: [0, 4.35, 4.05], c: 'tint' },
    { s: 'box', d: [2, 1.2, 0.1], at: [-1, 2, -3.65], c: 0x9c6b3c },
    ...[0.2, 0.6, 1.0].map((y, i): Part => (
      { s: 'cyl', d: [0.5, 0.5, 0.4], at: [2.4, y, -2.4], c: 0x1b1b1b, seg: 10 }
    )),
  ],
};

const PODIUM: PrefabDef = {
  id: 'speedway-podium', name: 'Podium', category: 'prop', uses: ['place'],
  tags: ['podium', 'winner', 'stand', 'step', 'speedway', 'gold'], emoji: [],
  footprint: { r: 3, h: 1.5 },
  about: 'Gnome Theft Auto: the Podium. Three white blocks side by side (1.5, 1.0 and 0.7 tall), with gold, silver and bronze number plates on +z.',
  examine: [
    'Three white steps side by side: gold in the middle, silver to the left, bronze to the right, each with a number on its front.',
    'Saying: "Gold for the one who finished first, silver for the one who saw it, and bronze for the one who cried."',
    'Tip: stand on the gold step only if you have won at least one lap, or the other gnomes will push you off.',
    'Joke: the bronze step is the only one a gnome can climb without a ladder, which is why it is always full.',
    'The plates say one, two and three, though no gnome has agreed which way round they should go.',
  ],
  parts: [
    { s: 'box', d: [2, 1.5, 2], at: [0, 0.75, 0], c: WHITE },
    { s: 'box', d: [2, 1.0, 2], at: [-2, 0.5, 0], c: WHITE },
    { s: 'box', d: [2, 0.7, 2], at: [2, 0.35, 0], c: WHITE },
    { s: 'box', d: [0.8, 0.3, 0.05], at: [0, 0.95, 1.025], c: GOLD },
    { s: 'box', d: [0.8, 0.3, 0.05], at: [-2, 0.7, 1.025], c: 0xc0c0c0 },
    { s: 'box', d: [0.8, 0.3, 0.05], at: [2, 0.45, 1.025], c: 0xcd7f32 },
  ],
};

const RULER_WALL: PrefabDef = {
  id: 'speedway-ruler-wall', name: 'Ruler Pit Wall', category: 'prop', uses: ['place'],
  tags: ['ruler', 'wall', 'pit', 'measure', 'yellow', 'tall-one', 'speedway', 'giant'], emoji: [],
  footprint: { r: 15, h: 1.4 },
  about: 'Gnome Theft Auto: the Ruler Pit Wall. A 29.9 m yellow Tall-One ruler on its long edge along x, with a black tick every unit (every fifth one taller) cut through both faces.',
  examine: [
    'A yellow Tall-One stick standing on its edge, with a black tick mark for every unit, and longer ticks at every fifth.',
    'Saying: "Measure twice, cut once, and never ask what a cut is."',
    'Tip: the marks are for measuring gnomes. Stand against the wall and your head will show which tick you are.',
    'Joke: the gnomes of Thatchford have measured the wall four times and got five different answers.',
    'Someone has scratched a small pit beside one of the ticks, and nobody remembers who did it or why.',
  ],
  parts: [
    { s: 'box', d: [29.9, 1.4, 0.5], at: [0, 0.7, 0], c: 0xf2c230 },
    ...Array.from({ length: 29 }, (_, i): Part => {
      const k = i - 14;
      const major = k % 5 === 0;
      return {
        s: 'box', d: [0.12, major ? 1.2 : 0.5, 0.6], at: [k, 0.7, 0], c: BLACK,
      };
    }),
  ],
};

const FRISBEE: PrefabDef = {
  id: 'speedway-frisbee', name: 'Giant Frisbee', category: 'prop', uses: ['place'],
  tags: ['frisbee', 'disc', 'plate', 'flying', 'orange', 'giant', 'speedway'], emoji: [],
  footprint: { r: 7.2, h: 1.2 },
  about: 'Gnome Theft Auto: the Giant Frisbee. A flat bright orange disc, 14 m across, lying on the ground with a darker rim and a pale centre ring.',
  examine: [
    'A flat orange disc as wide as a gnome village square, with a darker rim and a pale ring around its middle.',
    'Saying: "What flies round in the sky comes down in the Dust Flats."',
    'Tip: do not throw it near the grandstand. The Hat Watch will try to catch it and will lose a helmet doing so.',
    'Joke: the first gnome to ride it claimed it was a new kind of boat, which is also how the second gnome sank.',
    'Underneath it is hollow, so a gnome could hide a whole picnic beneath it, provided the picnic is very quiet.',
  ],
  parts: [
    { s: 'cyl', d: [7, 7, 0.8], at: [0, 0.4, 0], c: 0xff5a36, seg: 16 },
    { s: 'ring', d: [6.8, 0.35], rot: [90, 0, 0], at: [0, 0.4, 0], c: 0xc23a1f },
    { s: 'ring', d: [3.5, 0.25], rot: [90, 0, 0], at: [0, 0.8, 0], c: 0xffb08a },
  ],
};

const RAKE: PrefabDef = {
  id: 'speedway-rake', name: 'Giant Rake', category: 'prop', uses: ['place'],
  tags: ['rake', 'garden', 'tool', 'tines', 'handle', 'giant', 'speedway'], emoji: [],
  footprint: { r: 15, h: 1.0 },
  about: 'Gnome Theft Auto: the Giant Rake. A Tall-One garden rake lying flat along x: a timber handle, a green metal head and twelve long tines pointing +x.',
  examine: [
    'A giant Tall-One comb lying flat, with a long wooden handle, a green metal head and twelve long grey tines pointing out.',
    'Saying: "Rake the leaves and the leaves come back, but the rake stays where you left it."',
    'Tip: the tines are the only part that catches gnomes, so walk around the head rather than into it.',
    'Joke: Buck-Iron once tried to sweep the whole track with it and only managed to sweep Buck-Iron.',
    'Scratches along the handle spell a name nobody can read, though the gnomes of Turfton have a guess.',
  ],
  parts: [
    { s: 'cyl', d: [0.45, 0.45, 22], rot: [0, 0, 90], at: [-3, 0.45, 0], c: TIMBER, seg: 8 },
    { s: 'box', d: [1, 0.5, 8], at: [8.5, 0.25, 0], c: 0x4a8a4a },
    ...Array.from({ length: 12 }, (_, i): Part => (
      { s: 'box', d: [5, 0.2, 0.12], at: [11.5, 0.25, -3.5 + (i * 7) / 11], c: 0x8a8f94 }
    )),
  ],
};

export const GTA_RACE_TRACK: readonly PrefabDef[] = [
  BOOK_STAND,
  SNEAKER_STAND,
  COOLER_STAND,
  START_GANTRY,
  TYRE_STACK,
  HOSE_BARRIER,
  HOSE_ARCH,
  LIGHT_TOWER,
  SPONSOR_BOARD,
  PIT_GARAGE,
  PODIUM,
  RULER_WALL,
  FRISBEE,
  RAKE,
];
