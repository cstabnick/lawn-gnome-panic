// Gnome Theft Auto (E16): Windfall Croft crops: radish and carrot stages, their produce.
import type { Swatch } from '../palette';
import type { Part, PrefabDef } from '../types';

const SOIL = 0x4a3424;
const RADISH = 0xc8283c;
const RADISH_TOP = 0xe0508a;
const CARROT = 0xe8731c;
const CARROT_RING = 0xb85a14;
const PALE_LEAF = 0xa8d88a;

/** A soil mound 0.3 wide and 0.06 tall, its lowest point on y = 0. */
const mound: Part = { s: 'ball', d: [0.15], at: [0, 0.03, 0], scale: [1, 0.2, 1], c: SOIL, seg: 8 };

/** A thin frond from the soil at (0, y0, 0), leaning `lean` degrees toward azimuth `az` (0 = +x, 90 = +z). */
function frond(len: number, r: number, y0: number, az: number, lean: number): Part {
  const a = (az * Math.PI) / 180;
  const l = (lean * Math.PI) / 180;
  const half = len / 2;
  return {
    s: 'cyl', d: [r, r, len], seg: 4, c: 'leaf',
    at: [half * Math.sin(l) * Math.cos(a), y0 + half * Math.cos(l), half * Math.sin(l) * Math.sin(a)],
    rot: [lean * Math.sin(a), 0, -lean * Math.cos(a)],
  };
}

/** A flat leaf blade, `len` long, lifted `tilt` degrees, pointing outward at azimuth `az` from (x, y, z). */
function blade(x: number, y: number, z: number, az: number, tilt: number, len: number, c: Swatch | number): Part {
  return { s: 'ball', d: [len / 2], at: [x, y, z], rot: [0, -az, tilt], scale: [1, 0.12, 0.4], c, seg: 6 };
}

/** A ring of `count` blades around a crown at height y0. */
function rosette(count: number, y0: number, len: number, tilt: number, c: Swatch | number): Part[] {
  const parts: Part[] = [];
  for (let i = 0; i < count; i++) {
    const az = (i * 360) / count + 15;
    const off = len * 0.45;
    const a = (az * Math.PI) / 180;
    parts.push(blade(off * Math.cos(a), y0, off * Math.sin(a), az, tilt, len, c));
  }
  return parts;
}

/** A ring of `count` fronds fanned out from the soil. */
function fan(count: number, len: number, r: number, y0: number, lean: number): Part[] {
  const parts: Part[] = [];
  for (let i = 0; i < count; i++) parts.push(frond(len, r, y0, (i * 360) / count + 10, lean));
  return parts;
}

export const GTA_COUNTRY_CROPS: readonly PrefabDef[] = [
  {
    id: 'crop-radish-0', name: 'Radish Sprout', category: 'prop', uses: ['place'],
    tags: ['radish', 'sprout', 'crop', 'farm', 'croft', 'garden', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a radish just up, two pale seed leaves on a stalk over a soil mound. Place it in a bed.',
    examine: [
      'Two pale seed leaves on a stalk no thicker than a straw, poking up out of a little mound of dark soil.',
      'Saying: a radish is ready the day after you stop checking on it. Gnomes have tested this and not stopped checking.',
      'Tip: water it in the morning. Watering at night lets the slugs read the instructions.',
      'Joke: it is the smallest thing in the Croft that the last owner planted on purpose.',
      'The seed leaves are the only part of a radish that is sure of itself. The rest comes later.',
    ],
    parts: [
      mound,
      { s: 'cyl', d: [0.005, 0.005, 0.06], at: [0, 0.09, 0], c: 'leaf', seg: 4 },
      blade(0.022, 0.125, 0, -90, 20, 0.05, PALE_LEAF),
      blade(-0.022, 0.125, 0, 90, -20, 0.05, PALE_LEAF),
    ],
  },
  {
    id: 'crop-radish-1', name: 'Radish Growing', category: 'prop', uses: ['place'],
    tags: ['radish', 'leaves', 'crop', 'farm', 'croft', 'garden', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a young radish, a rosette of six green leaves on a short stalk. Place it in a bed.',
    examine: [
      'A ring of six green leaves standing round a short stalk, like a gnome who has found the good seat at the Planting.',
      'Old rhyme: "Leaves up to the sky, root down to the mole." The mole is not consulted.',
      'Tip: the leaves are the edible part until the root is ready. Nobody has ever been pleased by this.',
      'Joke: a radish spends its whole youth looking like a salad and is still expected to be a snack.',
      'Pull one up too early and the root comes out pale and furious. Leave it alone and it sulks in the dirt.',
    ],
    parts: [
      mound,
      { s: 'cyl', d: [0.012, 0.012, 0.2], at: [0, 0.16, 0], c: 'leaf-dark', seg: 5 },
      ...rosette(6, 0.27, 0.24, 40, 'leaf'),
    ],
  },
  {
    id: 'crop-radish-2', name: 'Radish Ripe', category: 'prop', uses: ['place'],
    tags: ['radish', 'ripe', 'crop', 'farm', 'croft', 'garden', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a ripe radish, a bushy rosette of leaves over a red root half out of the soil. Place it in a bed.',
    examine: [
      'A bushy crown of leaves over a round red radish, the top of it pushed up out of the soil like a shy red egg.',
      'Saying: a radish left too long goes woody, and then it is only good for arguing about.',
      'Tip: pull it by the leaves, not the root. The root is a radish. The leaves are the handle.',
      'Joke: the radish is the only crop in the Croft that is redder than the last owner was when the apples fell.',
      'A thin tail hangs from the root. Gnomes have a theory about the tail. The theory is a long one.',
    ],
    parts: [
      mound,
      { s: 'ball', d: [0.06], at: [0, 0.07, 0], scale: [1, 0.9, 1], c: RADISH, seg: 8 },
      { s: 'ball', d: [0.03], at: [0, 0.12, 0], scale: [1, 0.35, 1], c: RADISH_TOP, seg: 6 },
      { s: 'cyl', d: [0.014, 0.014, 0.27], at: [0, 0.235, 0], c: 'leaf-dark', seg: 5 },
      { s: 'cyl', d: [0.004, 0.004, 0.05], at: [0, 0.03, -0.08], rot: [90, 0, 0], c: 'dirt', seg: 4 },
      ...rosette(7, 0.37, 0.3, 35, 'leaf'),
    ],
  },
  {
    id: 'crop-carrot-0', name: 'Carrot Sprout', category: 'prop', uses: ['place'],
    tags: ['carrot', 'sprout', 'crop', 'farm', 'croft', 'garden', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a carrot just up, three thin feathery shoots on a soil mound. Place it in a bed.',
    examine: [
      'Three thin feathery shoots poking out of a soil mound, each one about as wide as a gnome\'s whisker.',
      'Saying: a carrot planted in a hurry grows crooked, and so do the people who planted it.',
      'Tip: thin the shoots out early, or they will crowd each other into a tangle that no one will untangle.',
      'Joke: the shoots look delicate. The rabbits have been watching them very carefully indeed.',
      'The orange part is all under the soil, where the real work happens, and where nobody can see it sulking.',
    ],
    parts: [
      mound,
      ...fan(3, 0.09, 0.005, 0.06, 15),
    ],
  },
  {
    id: 'crop-carrot-1', name: 'Carrot Growing', category: 'prop', uses: ['place'],
    tags: ['carrot', 'fronds', 'crop', 'farm', 'croft', 'garden', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a young carrot, a feathery fan of seven green fronds on a soil mound. Place it in a bed.',
    examine: [
      'A feathery fan of green fronds, all leaning the same way, as if they heard a rumour about the sun.',
      'Old rhyme: "Carrot tops and carrot sense: both grow from the fuss at the fence."',
      'Tip: the fronds are good for soup. The soup will not be good for the carrot, but nobody asks the carrot.',
      'Joke: a carrot is the only vegetable that looks more impressive above the soil than below it.',
      'The fronds keep growing even when the carrot is not looking. Gnomes have tried to catch them at it.',
    ],
    parts: [
      mound,
      ...fan(7, 0.4, 0.004, 0.06, 20),
    ],
  },
  {
    id: 'crop-carrot-2', name: 'Carrot Ripe', category: 'prop', uses: ['place'],
    tags: ['carrot', 'ripe', 'crop', 'farm', 'croft', 'garden', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a ripe carrot, a tall feathery fan over the orange shoulder of the root. Place it in a bed.',
    examine: [
      'A tall feathery fan of fronds over an orange shoulder that is pushing up out of the soil to see who is coming.',
      'Saying: the carrot that shows its shoulder is ready. The one that hides it is only shy, or very clever.',
      'Tip: twist gently and pull straight up. A sideways pull leaves half the carrot in the Croft for the next gnome.',
      'Joke: the Croft\'s last owner said it was the finest carrot on the hill. He was not in a position to check.',
      'Every carrot here is a cutting of one old carrot, and the old one is still in the press-house wall. Probably.',
    ],
    parts: [
      mound,
      { s: 'ball', d: [0.045], at: [0, 0.065, 0], scale: [1, 0.8, 1], c: CARROT, seg: 6 },
      ...fan(8, 0.52, 0.005, 0.07, 14),
    ],
  },
  {
    id: 'produce-radish', name: 'Radish', category: 'food', uses: ['eat', 'collect'],
    tags: ['radish', 'vegetable', 'root', 'red', 'crop', 'farm', 'croft', 'food', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a harvested radish with a short leafy top and a thin root tail. Small food, lies on the ground.',
    examine: [
      'A round red radish with a short leafy top, sitting on the ground like it has been waiting for someone to pick it up.',
      'Saying: a radish is the only root that is sharp on the outside and sweet on the inside, and gnomes approve.',
      'Tip: eat it fresh, with a pinch of salt. A radish that has been left out goes soft and philosophical.',
      'Joke: the leaves are more than the radish, and the radish is more than the leaves, and both are lunch.',
      'The little tail is the root\'s last word. The radish has had the last word all its life, and it is still talking.',
    ],
    parts: [
      { s: 'ball', d: [0.07], at: [0, 0.063, 0], scale: [1, 0.9, 1], c: RADISH, seg: 8 },
      { s: 'ball', d: [0.025], at: [0, 0.118, 0], scale: [1, 0.5, 1], c: RADISH_TOP, seg: 6 },
      { s: 'cyl', d: [0.004, 0.004, 0.06], at: [0, 0.012, -0.11], rot: [90, 0, 0], c: 'dirt', seg: 4 },
      blade(0.06, 0.17, 0, 0, 25, 0.18, 'leaf'),
      blade(-0.06, 0.17, 0, 180, -25, 0.18, 'leaf'),
      blade(0, 0.2, 0, 90, 0, 0.16, 'leaf-dark'),
    ],
  },
  {
    id: 'produce-carrot', name: 'Carrot', category: 'food', uses: ['eat', 'collect'],
    tags: ['carrot', 'vegetable', 'orange', 'root', 'crop', 'farm', 'croft', 'food', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a harvested carrot, a long orange cone with ring grooves and a green leafy top. Small food, lies on the ground.',
    examine: [
      'A long orange carrot lying on the ground, its ridges marked by rings, and a green top sticking out the back like an afterthought.',
      'Old rhyme: "Orange for the eyes, and orange for the cook; the cook is fond of orange, and the eyes are in the book."',
      'Tip: the top is the bit that goes in the bin. The bin does not thank you for the fronds either.',
      'Joke: a carrot is the only root that has its own fan club, and the fan club is mostly rabbits.',
      'Count the rings. Every ring is a year the carrot spent under the soil, thinking about what it would say.',
    ],
    parts: [
      { s: 'cone', d: [0.035, 0.27], at: [0, 0.035, 0], rot: [90, 0, 0], c: CARROT, seg: 6 },
      { s: 'cyl', d: [0.0319, 0.0319, 0.004], at: [0, 0.035, -0.08], rot: [90, 0, 0], c: CARROT_RING, seg: 6 },
      { s: 'cyl', d: [0.0254, 0.0254, 0.004], at: [0, 0.035, -0.03], rot: [90, 0, 0], c: CARROT_RING, seg: 6 },
      { s: 'cyl', d: [0.0189, 0.0189, 0.004], at: [0, 0.035, 0.02], rot: [90, 0, 0], c: CARROT_RING, seg: 6 },
      { s: 'ball', d: [0.03], at: [0.018, 0.045, -0.18], rot: [0, -20, 0], scale: [0.6, 0.25, 1.4], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.03], at: [-0.018, 0.045, -0.18], rot: [0, 20, 0], scale: [0.6, 0.25, 1.4], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.03], at: [0, 0.05, -0.2], scale: [0.6, 0.25, 1.4], c: 'leaf-dark', seg: 6 },
    ],
  },
];
