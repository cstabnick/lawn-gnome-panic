// Gnome Theft Auto E24 jobs II: Le Petit Groan comedy cellar (comedy job): stage props, the cellar entrance, the tomato and the comedian rewards.
// Plan: docs/roadmaps/gta-batch-3/E24/roadmap.md. Rules: docs/roadmaps/prefab-library/_common.md.
import type { Part, PrefabDef } from '../types';

// ---- Stage and room ------------------------------------------------------------------------------------------------------

// The brick wall: 13 courses of 0.18 m bricks, each course shifted a little so the bond looks laid by hand, with pale mortar seams.
const brickParts: Part[] = [];
for (let i = 0; i < 13; i++) {
  const shift = i % 2 === 0 ? 0.08 : -0.08;
  brickParts.push({ s: 'box', d: [3.9, 0.18, 0.1], at: [shift, 0.09 + i * 0.2, 0], c: i % 3 === 0 ? 'clay-dark' : 0x6e2a22, name: `brick-${i}` });
}
for (let i = 0; i < 12; i++) {
  brickParts.push({ s: 'box', d: [4, 0.02, 0.11], at: [0, 0.19 + i * 0.2, 0], c: 'stone', name: `mortar-${i}` });
}

// The cellar stairwell: stone walls on three sides, a dark pit, a few steps going down on the open +z side, railings and a lamp.
const cellarParts: Part[] = [
  { s: 'box', d: [2.4, 0.9, 0.15], at: [0, 0.45, -0.725], c: 'stone', name: 'back-wall' },
  { s: 'box', d: [0.15, 0.9, 1.6], at: [-1.125, 0.45, 0], c: 'stone', name: 'left-wall' },
  { s: 'box', d: [0.15, 0.9, 1.6], at: [1.125, 0.45, 0], c: 'stone', name: 'right-wall' },
  { s: 'box', d: [2.1, 0.02, 1.0], at: [0, 0.022, -0.17], c: 'slate', name: 'pit' },
  { s: 'box', d: [2.1, 0.12, 0.3], at: [0, 0.06, 0.6], c: 'stone-dark', name: 'step-top' },
  { s: 'box', d: [2.1, 0.06, 0.25], at: [0, 0.03, 0.85], c: 'stone-dark', name: 'step-bottom' },
];
// railings: rails and posts along the back and both sides at the top of the wall
for (const [x, z, len, rot] of [[0, -0.72, 2.4, 0], [-1.125, 0, 1.6, 90], [1.125, 0, 1.6, 90]] as const) {
  const along = rot === 0 ? 'x' : 'z';
  cellarParts.push({
    s: 'box', d: along === 'x' ? [len, 0.025, 0.025] : [0.025, 0.025, len], at: [x, 1.1, z], c: 'iron-dark', name: 'rail',
  });
  const posts = rot === 0 ? [-1.1, 0, 1.1] : [-0.75, 0.75];
  for (const p of posts) {
    const px = rot === 0 ? x + p : x;
    const pz = rot === 0 ? z : z + p;
    cellarParts.push({ s: 'cyl', d: [0.015, 0.015, 0.55], at: [px, 0.825, pz], c: 'iron-dark', seg: 6, name: 'railing-post' });
  }
}
// the little lamp on the back-left corner
cellarParts.push({ s: 'cyl', d: [0.02, 0.02, 0.5], at: [-1.1, 0.25, -0.6], c: 'iron-dark', seg: 6, name: 'lamp-post' });
cellarParts.push({ s: 'ball', d: [0.07], at: [-1.1, 0.6, -0.6], c: 'honey', glow: true, seg: 6, name: 'lamp-glass' });

// A-frame chalkboard, two boards leaning on each other, feet on the ground.
const chalkParts: Part[] = [
  { s: 'box', d: [0.6, 0.95, 0.03], at: [0, 0.468, 0.099], rot: [-12, 0, 0], c: 'slate', name: 'board-front' },
  { s: 'box', d: [0.6, 0.95, 0.03], at: [0, 0.468, -0.099], rot: [12, 0, 0], c: 'slate', name: 'board-back' },
  { s: 'box', d: [0.62, 0.04, 0.05], at: [0, 0.94, 0], c: 'wood', name: 'hinge' },
  { s: 'box', d: [0.4, 0.03, 0.01], at: [0, 0.7, 0.112], rot: [-12, 0, 0], c: 'chalk', name: 'chalk-line-1' },
  { s: 'box', d: [0.3, 0.03, 0.01], at: [0, 0.6, 0.112], rot: [-12, 0, 0], c: 'chalk', name: 'chalk-line-2' },
];

const posterParts: Part[] = [
  { s: 'cyl', d: [0.3, 0.3, 2.4], at: [0, 1.2, 0], c: 'stone', seg: 10, name: 'column' },
  { s: 'cyl', d: [0.33, 0.33, 0.08], at: [0, 2.44, 0], c: 'stone-dark', seg: 10, name: 'cap' },
  { s: 'cyl', d: [0.33, 0.33, 0.08], at: [0, 0.04, 0], c: 'stone-dark', seg: 10, name: 'plinth' },
];
const posterColours = ['red', 'yellow', 'pink', 'blue', 'green', 'orange'] as const;
for (let k = 0; k < 6; k++) {
  const a = k * 60 * Math.PI / 180;
  posterParts.push({
    s: 'box', d: [0.02, 0.8, 0.26], at: [0.315 * Math.cos(a), 1.3 + (k % 2) * 0.08, 0.315 * Math.sin(a)], rot: [0, -k * 60, 0],
    c: posterColours[k], name: `poster-${k}`,
  });
}

// ---- Tables, mic, rope, jar, setlist -----------------------------------------------------------------------------------

const micParts: Part[] = [
  { s: 'cyl', d: [0.18, 0.18, 0.03], at: [0, 0.015, 0], c: 'steel', seg: 10, name: 'base' },
  { s: 'cyl', d: [0.015, 0.015, 1.35], at: [0, 0.705, 0], c: 'steel', seg: 6, name: 'pole' },
  { s: 'ball', d: [0.05], at: [0, 1.43, 0], c: 'silver', seg: 8, name: 'mic-head' },
];

const stoolParts: Part[] = [
  { s: 'cyl', d: [0.15, 0.15, 0.04], at: [0, 0.78, 0], c: 'leather', seg: 10, name: 'seat' },
  { s: 'cyl', d: [0.02, 0.02, 0.76], at: [0.1, 0.38, 0.08], rot: [4, 0, 0], c: 'iron-dark', seg: 6, name: 'leg' },
  { s: 'cyl', d: [0.02, 0.02, 0.76], at: [-0.1, 0.38, 0.06], rot: [-3, 0, 4], c: 'iron-dark', seg: 6, name: 'leg' },
  { s: 'cyl', d: [0.02, 0.02, 0.76], at: [0, 0.38, -0.12], rot: [0, 0, 5], c: 'iron-dark', seg: 6, name: 'leg' },
  { s: 'ring', d: [0.11, 0.01], at: [0, 0.3, 0], rot: [90, 0, 0], c: 'iron', seg: 8, name: 'foot-ring' },
];

const spotParts: Part[] = [
  { s: 'cyl', d: [0.12, 0.12, 0.02], at: [0, 0.01, 0], c: 'iron-dark', seg: 10, name: 'base' },
  { s: 'cyl', d: [0.02, 0.02, 0.18], at: [0, 0.11, 0], c: 'iron-dark', seg: 6, name: 'pole' },
  { s: 'cyl', d: [0.09, 0.11, 0.2], at: [0, 0.3, 0], c: 'steel', seg: 10, name: 'can' },
  { s: 'cyl', d: [0.085, 0.085, 0.01], at: [0, 0.2, 0], c: 'spark', glow: true, seg: 10, name: 'lens' },
];

const tableParts: Part[] = [
  { s: 'cyl', d: [0.2, 0.2, 0.02], at: [0, 0.01, 0], c: 'iron-dark', seg: 10, name: 'foot' },
  { s: 'cyl', d: [0.02, 0.02, 0.56], at: [0, 0.3, 0], c: 'wood-dark', seg: 6, name: 'stem' },
  { s: 'cyl', d: [0.3, 0.3, 0.03], at: [0, 0.585, 0], c: 'wood', seg: 12, name: 'top' },
  { s: 'cyl', d: [0.04, 0.04, 0.15], at: [0, 0.675, 0], c: 'glass', seg: 8, name: 'bottle' },
  { s: 'cyl', d: [0.018, 0.018, 0.08], at: [0, 0.64, 0], c: 'wax', seg: 6, name: 'candle' },
  { s: 'ball', d: [0.014], at: [0, 0.7, 0], c: 'spark', glow: true, seg: 5, name: 'flame' },
];

// Two brass posts and a red rope that sags in the middle.
const ropeParts: Part[] = [
  { s: 'cyl', d: [0.2, 0.2, 0.04], at: [-0.7, 0.02, 0], c: 'brass', seg: 8, name: 'foot-l' },
  { s: 'cyl', d: [0.2, 0.2, 0.04], at: [0.7, 0.02, 0], c: 'brass', seg: 8, name: 'foot-r' },
  { s: 'cyl', d: [0.025, 0.025, 1.0], at: [-0.7, 0.5, 0], c: 'brass', seg: 6, name: 'post-l' },
  { s: 'cyl', d: [0.025, 0.025, 1.0], at: [0.7, 0.5, 0], c: 'brass', seg: 6, name: 'post-r' },
  { s: 'ball', d: [0.04], at: [-0.7, 1.02, 0], c: 'brass', seg: 6, name: 'knob-l' },
  { s: 'ball', d: [0.04], at: [0.7, 1.02, 0], c: 'brass', seg: 6, name: 'knob-r' },
  { s: 'box', d: [0.72, 0.03, 0.03], at: [-0.35, 0.925, 0], rot: [0, 0, -12], c: 'red', name: 'rope-l' },
  { s: 'box', d: [0.72, 0.03, 0.03], at: [0.35, 0.925, 0], rot: [0, 0, 12], c: 'red', name: 'rope-r' },
];

const jarParts: Part[] = [
  { s: 'cyl', d: [0.1, 0.1, 0.22], at: [0, 0.11, 0], c: 'glass', seg: 10, name: 'jar' },
  { s: 'cyl', d: [0.105, 0.105, 0.03], at: [0, 0.235, 0], c: 'iron', seg: 10, name: 'lid' },
  { s: 'box', d: [0.08, 0.06, 0.005], at: [0, 0.11, 0.1], c: 'paper', name: 'label' },
  { s: 'ball', d: [0.02], scale: [1, 1, 0.4], at: [0, 0.03, 0], c: 'brass', seg: 6, name: 'button' },
];

// A setlist: a crumpled sheet lifted 0.01 m off the floor, with a couple of balls of paper beside it.
const setlistParts: Part[] = [
  { s: 'box', d: [0.2, 0.004, 0.2], at: [0, 0.012, 0], rot: [0, 12, 0], c: 'paper', name: 'sheet' },
  { s: 'ball', d: [0.025], scale: [1, 0.4, 1], at: [0.14, 0.01, 0.1], c: 'paper', seg: 6, name: 'crumple' },
  { s: 'ball', d: [0.02], scale: [1, 0.4, 1], at: [-0.12, 0.008, -0.08], c: 'paper', seg: 6, name: 'crumple' },
];

// ---- The prefabs ----------------------------------------------------------------------------------------------------------

export const GTA_COMEDY: readonly PrefabDef[] = [
  {
    id: 'groan-mic-stand', name: 'Le Petit Groan Mic Stand', category: 'prop', uses: ['place'],
    tags: ['mic', 'microphone', 'stand', 'stage', 'comedy', 'chrome', 'groan', 'pardonlin', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a chrome microphone stand with an old ball mic, 1.5 m. Le Petit Groan stage prop.',
    examine: [
      'A chrome stand with a ball microphone on top, the kind that has been tapped by a great many nervous gnomes.',
      'Comedian saying: the mic is only as good as the joke, and the stand is only as good as the floor it is bolted to.',
      'Tip: lean on the stand for a moment before the set, because the audience can see the nerves and it helps to look relaxed.',
      'Joke: the ball on top has been tapped so often that the crowd now assumes it is the punchline.',
      'Someone has wound gaffer tape round the base in the shape of a question mark, and nobody has yet answered it.',
    ],
    parts: micParts,
  },
  {
    id: 'groan-stage-stool', name: 'Stage Stool', category: 'furniture', uses: ['sit', 'place'], seat: [0, 0.8, 0],
    tags: ['stool', 'bar', 'stage', 'seat', 'chair', 'tall', 'wobbly', 'groan', 'pardonlin', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a tall wobbly bar stool for the stage at Le Petit Groan, 0.8 m to the seat. Sit point at the seat top.',
    examine: [
      'A tall stool with a leather seat and three thin iron legs, one of which has been wedged with a folded beer mat.',
      'Stage saying: the stool is for the one who is about to be funny, and the floor is for the one who was.',
      'Tip: keep your weight central, because the stool rocks at the best possible moment and the crowd always notices.',
      'Joke: the stool has been wobbling for longer than the club has been open, and it is the only act that has never once been booed.',
      'Under the seat someone has written, in chalk, a single word that is too rude for a stool and too true for a club.',
    ],
    parts: stoolParts,
  },
  {
    id: 'groan-brick-backdrop', name: 'Brick Backdrop', category: 'prop', uses: ['place'],
    tags: ['brick', 'bricks', 'wall', 'backdrop', 'stage', 'comedy', 'groan', 'pardonlin', 'gta'], emoji: [],
    footprint: { r: 2, h: 2.6 },
    about: 'Gnome Theft Auto: the classic comedy brick wall panel, 4 x 2.6 m, 0.1 m thick, dark red bricks with pale mortar. Origin at the ground centre, front faces +z.',
    examine: [
      'A wall of dark red bricks with pale mortar lines, the sort of wall that every comedy club in Pardonlin has been built around.',
      'Saying: a brick wall has heard every joke and laughed at none, which is why it is still standing.',
      'Tip: lean on it during a pause, because the wall is the only thing on stage that is guaranteed to hold still.',
      'Joke: the bricks have been painted so often that the mortar is now the only part of the wall with an opinion.',
      'A small chalk tally runs along the bottom course, one mark for every heckler, and the last few marks are very neat.',
    ],
    parts: brickParts,
  },
  {
    id: 'groan-spotlight', name: 'Stage Spotlight', category: 'prop', uses: ['place'],
    tags: ['spotlight', 'spot', 'light', 'lamp', 'stage', 'can', 'comedy', 'groan', 'pardonlin', 'gta'], emoji: [],
    lights: [{ at: [0, 0.3, 0.1], c: 'spark', intensity: 0.5, distance: 3 }],
    about: 'Gnome Theft Auto: a stage can light on a short stand, 0.4 m tall with its lens glowing. Le Petit Groan prop. Fixed to a ceiling in the club.',
    examine: [
      'A steel can light with a glowing lens, the sort that makes a gnome look far more interesting than he has any right to.',
      'Stage saying: the light finds the one who is ready, and it finds the one who is not, and it does not care which.',
      'Tip: stand just inside the circle, because the edge of the light is where the nerves are hiding.',
      'Joke: it is the hottest thing in the room, and the only one that has never once been asked to say something funny.',
      'The lens has a crack in one corner shaped like a small smile, and the club insists it was put there on purpose.',
    ],
    parts: spotParts,
  },
  {
    id: 'groan-cafe-table-small', name: 'Tiny Cafe Table', category: 'furniture', uses: ['place'],
    tags: ['table', 'cafe', 'small', 'round', 'candle', 'bottle', 'groan', 'pardonlin', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a tiny round cafe table, 0.6 m, with a candle standing in an empty bottle. Le Petit Groan furniture.',
    examine: [
      'A round wooden table no wider than a dinner plate, with a candle standing in an empty wine bottle for a holder.',
      'Cafe saying: a table for two is a table for one who has been stood up, and a candle in a bottle is the only company it needs.',
      'Tip: order the cheapest thing on the menu and then drink it slowly, because the club does not serve gnomes who hurry.',
      'Joke: the bottle is empty, which is the only honest thing about the evening, and the candle is not even sure it is lit.',
      'Someone has carved the word booked into the top of the table, and nobody has ever said who was booked for what.',
    ],
    parts: tableParts,
  },
  {
    id: 'groan-velvet-rope', name: 'Velvet Rope', category: 'prop', uses: ['place'],
    tags: ['rope', 'velvet', 'barrier', 'queue', 'posts', 'brass', 'groan', 'pardonlin', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: two brass posts and a sagging red velvet rope, 1.4 m across. Le Petit Groan queue barrier.',
    examine: [
      'Two brass posts with a red velvet rope hung between them, sagging a little in the middle from years of being leaned on.',
      'Doorman saying: the rope is for those who are not on the list, and the list is for those who are not on the rope.',
      'Tip: a gnome who looks as if he belongs will usually be let past, provided he does not try to unhook the rope.',
      'Joke: the velvet is the only soft thing at the Groan, and the audience is not allowed to touch it either.',
      'A small brass plate on the left post reads reserved, and the plate has been reserved for a long time.',
    ],
    parts: ropeParts,
  },
  {
    id: 'groan-tip-jar', name: 'Tip Jar', category: 'container', uses: ['place'],
    tags: ['jar', 'tip', 'tips', 'glass', 'button', 'busker', 'comedy', 'groan', 'pardonlin', 'gta'], emoji: ['🫙'],
    about: 'Gnome Theft Auto: an empty glass tip jar with a blank label and one button in the bottom. Le Petit Groan prop.',
    examine: [
      'A glass jar with a blank paper label, a tin lid and, in the bottom, one lonely brass button.',
      'Comedian saying: a tip jar that is empty is a tip jar that is honest, and the honest jar is always the first to go.',
      'Tip: put a button in the jar before the set, so the audience knows it is a jar and not a hat.',
      'Joke: the label has been left blank on purpose, because the club wants you to tip for whatever you think it says.',
      'There is a tiny pencil mark on the lid, a tally of the nights the jar has been looked at and not touched.',
    ],
    parts: jarParts,
  },
  {
    id: 'groan-setlist', name: 'Crumpled Setlist', category: 'document', uses: ['read', 'place'],
    tags: ['setlist', 'list', 'paper', 'sheet', 'crumpled', 'set', 'script', 'groan', 'pardonlin', 'gta'], emoji: ['📜'],
    about: 'Gnome Theft Auto: a crumpled comedy setlist on the floor, flat 0.2 m, lifted 0.01 m off the ground. Le Petit Groan prop.',
    examine: [
      'A crumpled sheet of paper with a list of jokes on it, most of them crossed out and one of them underlined twice.',
      'Comedian saying: a setlist is only a promise, and the audience is never told which promise is being broken first.',
      'Tip: read the list before going on, because the crossed-out jokes are the ones the club hopes you will forget.',
      'Joke: the last line says end strong, which it has underlined, and then it has been crossed out too.',
      'In the margin someone has written a single word in very small letters, and it is either a name or a warning.',
    ],
    parts: setlistParts,
  },
  {
    id: 'groan-cellar-entrance', name: 'Cellar Entrance', category: 'prop', uses: ['place'],
    tags: ['cellar', 'stairs', 'stairwell', 'entrance', 'door', 'basement', 'railings', 'groan', 'pardonlin', 'gta'], emoji: [],
    footprint: { r: 1.3, h: 0.9 },
    about: 'Gnome Theft Auto: the stone stairwell down to Le Petit Groan, 2.4 x 1.6 m, 0.9 m of stone surround, iron railings on three sides and a little lamp. Open side faces +z.',
    examine: [
      'A stone surround sinking into the pavement, with iron railings on three sides and a lamp on the corner that is always on.',
      'Saying: the stairs go down to the Groan, and the Groan goes down to the stairs, and nobody has yet come back up with a joke.',
      'Tip: take the steps slowly, because the bottom one has a small sign that says mind the step, and it means it.',
      'Joke: the cellar is so far below the street that the only thing that reaches it is the sound of the audience not laughing.',
      'Someone has scratched a row of tally marks into the railing, and the last one is a small crooked smile.',
    ],
    parts: cellarParts,
  },
  {
    id: 'groan-chalkboard-sign', name: 'Chalkboard Sign', category: 'prop', uses: ['place'],
    tags: ['chalkboard', 'sign', 'board', 'a-frame', 'menu', 'advert', 'groan', 'pardonlin', 'gta'], emoji: ['🪧'],
    about: 'Gnome Theft Auto: an A-frame chalkboard sign, 1.1 m tall, advertising the night\'s acts outside Le Petit Groan.',
    examine: [
      'An A-frame board with a slate face, and a few chalk lines on it that once said tonight only and now say tonight, again.',
      'Sign saying: the board lists the acts, and the acts list the excuses, and the excuses are all written in the same chalk.',
      'Tip: read it from the street before you go down, because the board is always more honest than the poster.',
      'Joke: the board says doors open at eight, which is true, and the doors have never once been opened by anyone at eight.',
      'The bottom corner has a chalk drawing of a gnome with a question mark, and nobody admits to drawing it.',
    ],
    parts: chalkParts,
  },
  {
    id: 'groan-poster-column', name: 'Poster Column', category: 'prop', uses: ['place'],
    tags: ['poster', 'posters', 'column', 'pillar', 'advert', 'advertising', 'round', 'groan', 'pardonlin', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a short round Pardonlin poster column, 2.4 m, its posters drawn as coloured panels. Le Petit Groan street prop.',
    examine: [
      'A round stone column papered in overlapping posters, most of them for shows that have already been cancelled.',
      'Pardonlin saying: a poster is a promise that someone once wanted to be remembered, and the column is where the promises go to fade.',
      'Tip: read the posters from the bottom up, because the ones at the top are the ones the club wants you to forget.',
      'Joke: every poster on the column says tonight only, and the column has been standing there since the first night.',
      'A torn corner shows a faded face that might be the booker, and nobody has the nerve to peel the rest of it back.',
    ],
    parts: posterParts,
  },
  {
    id: 'comedy-tomato', name: 'Ripe Tomato', category: 'consumable', uses: ['hold', 'throw', 'eat'], grip: [0, 0.045, 0],
    tags: ['tomato', 'tomatoes', 'produce', 'fruit', 'throw', 'splat', 'heckle', 'groan', 'pardonlin', 'gta'], emoji: ['🍅'],
    about: 'Gnome Theft Auto: a ripe tomato, 0.09 m, red with a green calyx. Thrown at the stage, or thrown at a comedian. Category consumable.',
    examine: [
      'A ripe red tomato with a green calyx on top, the sort that has been waiting in a crate for exactly this evening.',
      'Heckler saying: a tomato is the only review a comedian can see coming, and it is always right on time.',
      'Tip: throw it low and early, because a tomato lobbed at the spotlight will only land on the bar.',
      'Joke: the tomato has been on the stage more often than the comedians, and it has the better reviews.',
      'Someone has written a small rating on the skin in marker, and the rating is always the same.',
    ],
    parts: [
      { s: 'ball', d: [0.045], at: [0, 0.045, 0], c: 'red', seg: 8, name: 'fruit' },
      { s: 'ball', d: [0.03], scale: [1, 0.25, 1], at: [0, 0.085, 0], c: 'leaf', seg: 6, name: 'calyx' },
      { s: 'cyl', d: [0.005, 0.005, 0.02], at: [0, 0.1, 0], c: 'leaf-dark', seg: 5, name: 'stem' },
    ],
  },
  // ---- Rewards (wearables) --------------------------------------------------------------------------------------------
  {
    id: 'open-mic-bowtie', name: 'Open Mic Bow Tie', category: 'trinket', uses: ['wear-neck'],
    wear: { at: [0, -0.07, 0.05] },
    tags: ['bowtie', 'bow', 'tie', 'neck', 'sparkly', 'sparkle', 'open', 'mic', 'comedy', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: an oversized sparkly bow tie, the Open Mic reward for the Tough Room achievement.',
    examine: [
      'An enormous bow tie with two sparkly wings and a little knot in the middle, the kind of tie that is worn to be noticed.',
      'Open mic saying: a bow tie says you are ready, and a sparkly one says you are ready to be heckled by the front row.',
      'Tip: tie it before the set and not after, because a bow tie tied in the dressing room always looks smarter than one tied on stage.',
      'Joke: the wings are so large that the knot is mostly for show, which is the only part of comedy the gnomes fully understand.',
      'The inside of the knot has a tiny card with the words tough room written on it, and the handwriting is very proud.',
    ],
    parts: [
      { s: 'ball', d: [0.05], scale: [1.4, 0.6, 0.35], at: [-0.08, 0.035, 0], c: 'purple', seg: 6, name: 'wing-l' },
      { s: 'ball', d: [0.05], scale: [1.4, 0.6, 0.35], at: [0.08, 0.035, 0], c: 'purple', seg: 6, name: 'wing-r' },
      { s: 'ball', d: [0.02], at: [0, 0.035, 0], c: 'gold', seg: 6, name: 'knot' },
      { s: 'ball', d: [0.012], at: [-0.1, 0.08, 0.02], c: 'spark', glow: true, seg: 5, name: 'glitter' },
      { s: 'ball', d: [0.012], at: [0.1, 0.02, 0.02], c: 'spark', glow: true, seg: 5, name: 'glitter' },
    ],
  },
  {
    id: 'tomato-splat-beret', name: 'Tomato-Splat Beret', category: 'armor', uses: ['wear-head'],
    tags: ['beret', 'hat', 'cap', 'head', 'black', 'tomato', 'splat', 'pardonlin', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a black Pardonlin beret with a tomato splat on the front, the reward for the Fresh Produce achievement.',
    examine: [
      'A black beret with a little stalk on top and a bright red tomato splat across the front, which nobody has ever tried to wash out.',
      'Pardonlin saying: a beret is worn for thinking, and a beret with a splat is worn for thinking about the splat.',
      'Tip: keep the splat facing the audience, because it is the only thing about you that they will remember on the way out.',
      'Joke: the beret was black when it was bought, and the tomato has been making sure it stays interesting ever since.',
      'The lining has a small ticket stub stuck inside, from a night where the tomato was not the only thing thrown.',
    ],
    parts: [
      { s: 'ball', d: [0.12], scale: [1, 0.35, 1], at: [0, 0.05, 0], c: 'black', seg: 8, name: 'beret' },
      { s: 'cyl', d: [0.01, 0.01, 0.03], at: [0, 0.11, 0], c: 'black', seg: 5, name: 'stalk' },
      { s: 'ball', d: [0.04], scale: [1, 0.6, 0.3], at: [0.05, 0.06, 0.11], c: 'red', seg: 6, name: 'splat' },
      { s: 'ball', d: [0.012], at: [0.03, 0.09, 0.12], c: 'leaf-dark', seg: 5, name: 'splat-seed' },
    ],
  },
  {
    id: 'squeaky-rubber-chicken', name: 'Squeaky Rubber Chicken', category: 'tool', uses: ['hold'], grip: [0, 0.05, 0],
    wear: { rot: [90, 0, 0] },
    tags: ['chicken', 'rubber', 'squeaky', 'toy', 'prop', 'hand', 'comedy', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a squeaky rubber chicken held by its legs. The reward for the Double Down achievement.',
    examine: [
      'A yellow rubber chicken with a red comb, two stubby legs and a beak that has been chewed by a great many audiences.',
      'Comedian saying: when the joke falls flat, the chicken is there to squeak at it, and nobody has ever once asked why.',
      'Tip: squeeze before the punchline, because the squeak is the punchline and it lands every time.',
      'Joke: the chicken has been squeezed more often than any gnome in Pardonlin, and it has never once complained.',
      'Someone has tied a tiny bow round its neck with string, and the string is the only thing that has ever been properly rehearsed.',
    ],
    parts: [
      { s: 'cyl', d: [0.012, 0.012, 0.1], at: [0, 0.05, 0], c: 'orange', seg: 6, name: 'legs' },
      { s: 'ball', d: [0.07], scale: [1, 0.85, 1.2], at: [0, 0.16, 0], c: 'wool', seg: 8, name: 'body' },
      { s: 'ball', d: [0.05], scale: [0.4, 0.6, 1], at: [0.07, 0.17, 0], c: 'wool', seg: 6, mirror: true, name: 'wing' },
      { s: 'cyl', d: [0.02, 0.025, 0.1], at: [0, 0.27, 0], c: 'wool', seg: 6, name: 'neck' },
      { s: 'ball', d: [0.04], at: [0, 0.34, 0], c: 'wool', seg: 6, name: 'head' },
      { s: 'cone', d: [0.018, 0.04], at: [0, 0.34, 0.05], rot: [90, 0, 0], c: 'orange', seg: 6, name: 'beak' },
      { s: 'ball', d: [0.025], at: [0, 0.38, 0], c: 'red', seg: 6, name: 'comb' },
      { s: 'ball', d: [0.008], at: [0.02, 0.35, 0.03], c: 'black', seg: 4, mirror: true, name: 'eye' },
    ],
  },
];
