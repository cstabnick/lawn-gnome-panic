// Gnome Theft Auto: Pardonlin's landmarks and achievement rewards (E30, docs/roadmaps/gta-batch-3/E30/): the Bean Tower,
// the Unknown Pigeon, the swan pedalo, and five wearable rewards.
import type { Part, PrefabDef } from '../types';

// ---- Bean Tower: six bamboo canes leaning in to a tie at 28.7 m, runner beans up the canes ------------------------------
const TOWER_R = 7;                          // ground ring radius
const CANE_LEN = 30;
const TOWER_H = Math.sqrt(CANE_LEN * CANE_LEN - TOWER_R * TOWER_R);   // height where the 30 m canes meet (about 29.2)
const CANE_TILT = Math.atan2(TOWER_R, TOWER_H) * 180 / Math.PI;      // degrees off vertical
const CANE_COS = TOWER_H / CANE_LEN;
const ringR = (h: number) => TOWER_R * (1 - h / TOWER_H);           // radius of the bundle at height h
const at = (h: number, deg: number, off = 0): [number, number, number] => {
  const r = ringR(h) + off;
  const a = deg * Math.PI / 180;
  return [r * Math.cos(a), h, r * Math.sin(a)];
};

const towerParts: Part[] = [];
// six canes: each leans from its ground point on the ring toward the centre (rot y = -azimuth, rot z = tilt)
for (let k = 0; k < 6; k++) {
  const phi = k * 60;
  const a = phi * Math.PI / 180;
  towerParts.push({
    s: 'cyl', d: [0.175, 0.175, CANE_LEN], at: [3.5 * Math.cos(a), TOWER_H / 2 + 0.045, 3.5 * Math.sin(a)], rot: [0, -phi, CANE_TILT],
    c: 'straw', seg: 6, name: `cane-${k}`,
  });
}
// twine tie-wraps round the bundle
for (const h of [5, 15, 20, 24]) {
  towerParts.push({ s: 'ring', d: [ringR(h), 0.1], at: [0, h, 0], rot: [90, 0, 0], c: 'burlap', seg: 8, name: `tie-${h}` });
}
// the twine knot where the canes meet
towerParts.push({ s: 'ball', d: [0.45], at: [0, TOWER_H, 0], c: 'burlap', seg: 8, name: 'knot' });

// runner beans: a vine spirals up every cane as a chain of overlapping leaf blobs, with flowers, pods and tendrils
const vineParts: Part[] = [];
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const spiral = (h: number, phi: number, turn: number, rad: number): [number, number, number] => {
  // a point on the vine round cane phi at height h: ringR(h) is the cane centre, the vine circles it
  const a = phi * Math.PI / 180;
  const r = ringR(h) + rad * Math.cos(turn), t = rad * Math.sin(turn);
  return [r * Math.cos(a) - t * Math.sin(a), h, r * Math.sin(a) + t * Math.cos(a)];
};
for (let k = 0; k < 6; k++) {
  const phi = k * 60;
  const top = 27 - (k % 3);
  let n = 0;
  for (let h = 1.2 + k * 0.2; h < top; h += 3.4 + rnd() * 0.6) {
    const turn = h * 0.9 + k * 1.1;
    const p = spiral(h, phi, turn, 0.32);
    const big = 1.1 + rnd() * 0.6 - h * 0.012;
    // a heart-ish leaf: a flattened blob plus a smaller lobe beside it, tilted at random
    vineParts.push({ s: 'ball', d: [big], at: p, scale: [1, 0.3, 0.85], rot: [rnd() * 40 - 20, rnd() * 360, rnd() * 40 - 20], c: n % 3 === 0 ? 'leaf-dark' : 'leaf', seg: 6, name: 'leaf' });
    const q = spiral(h + 0.55, phi, turn + 1.3, 0.5);
    vineParts.push({ s: 'ball', d: [big * 0.7], at: q, scale: [1, 0.3, 0.9], rot: [rnd() * 50 - 25, rnd() * 360, rnd() * 40 - 20], c: n % 2 ? 'leaf' : 'leaf-dark', seg: 6, name: 'leaf' });
    if (n % 2 === 1) { // a red flower cluster
      const f = spiral(h + 0.3, phi, turn + 2.4, 0.65);
      for (let j = 0; j < 2; j++) {
        vineParts.push({ s: 'ball', d: [0.2 + rnd() * 0.08], at: [f[0] + (rnd() - 0.5) * 0.4, f[1] + (rnd() - 0.5) * 0.4, f[2] + (rnd() - 0.5) * 0.4], c: 'red', seg: 5, name: 'flower' });
      }
    }
    if (h > 3 && n % 2 === 0) { // hanging pods, a pair on every other node
      const o = spiral(h - 0.2, phi, turn + 3.6, 0.7);
      const pairs = n % 4 === 0 ? 2 : 1;
      for (let j = 0; j < pairs; j++) {
        const len = 1.1 + rnd() * 0.9;
        vineParts.push({ s: 'pill', d: [0.07, len], at: [o[0] + j * 0.22, o[1] - len / 2 - 0.1, o[2] + j * 0.15], rot: [rnd() * 12 - 6, 0, rnd() * 12 - 6], c: 'leaf-dark', seg: 5, name: 'pod' });
      }
    }
    n++;
  }
  // tendrils curling off the canes near the top
  for (let j = 0; j < 1; j++) {
    const h = 22 + j * 3.5 + k * 0.3;
    const p = spiral(h, phi, j * 2 + k, 0.7);
    vineParts.push({ s: 'ring', d: [0.35, 0.04], at: p, rot: [rnd() * 180, rnd() * 180, 0], c: 'leaf', seg: 6, name: 'tendril' });
  }
}

// the viewing platform at 10 m, a wooden disc with a rail, and a ladder up the cane at 0 degrees
towerParts.push({ s: 'cyl', d: [4.4, 4.4, 0.3], at: [0, 10, 0], c: 'wood', seg: 12, name: 'platform' });
towerParts.push({ s: 'ring', d: [4.4, 0.12], at: [0, 10.2, 0], rot: [90, 0, 0], c: 'wood-light', seg: 12, name: 'rail' });
for (const z of [-0.14, 0.14]) {
  towerParts.push({
    s: 'box', d: [0.05, 10 / CANE_COS, 0.05], at: [ringR(5) + 0.3, 5.02, z], rot: [0, 0, CANE_TILT],
    c: 'wood-dark', name: 'ladder-rail',
  });
}
for (let r = 1; r < 10; r++) {
  towerParts.push({ s: 'box', d: [0.05, 0.05, 0.3], at: [ringR(r) + 0.3, r, 0], c: 'wood-dark', name: 'ladder-rung' });
}

/** The Bean Tower's vine prefabs: place every one of these at the tower's position and yaw. */
export const BEAN_VINE_IDS: readonly string[] = Array.from({ length: Math.ceil(vineParts.length / 39) }, (_, i) => `pl-bean-vines-${i + 1}`);

function vineChunks(): PrefabDef[] {
  return BEAN_VINE_IDS.map((id, i) => ({
    id, name: `Bean Tower Vines (${i + 1})`, category: 'prop', uses: ['place'],
    tags: ['bean', 'beans', 'vine', 'runner', 'flowers', 'pods', 'pardonlin', 'gta'], emoji: [],
    footprint: { r: 7, h: 30 },
    about: `Gnome Theft Auto: part ${i + 1} of the runner beans climbing the Bean Tower (leaves, red flowers, pods, tendrils). Place at the pl-bean-tower origin.`,
    examine: [
      'Runner beans climb the canes in a slow green spiral, leaf over leaf, as if they had somewhere to be by Tuesday.',
      'Saying: a bean never hurries and never stops, which is how it got to the top before the queue did.',
      'Tip: the red flowers are for the bees, the pods are for the soup, and the leaves are for looking at from a café.',
      'Joke: the beans have climbed higher than any gnome in Pardonlin and have still not been asked for a ticket.',
    ],
    // A soil mound at a cane foot (the bean planted there) keeps each piece standing on the ground.
    parts: [
      { s: 'ball', d: [0.7], at: [6.6 * Math.cos(i * Math.PI / 3), 0.21, 6.6 * Math.sin(i * Math.PI / 3)], scale: [1, 0.3, 1], c: 'dirt', seg: 6, name: 'mound' },
      ...vineParts.slice(i * 39, (i + 1) * 39),
    ],
  }));
}

// ---- Pigeon statue, swan pedalo and the wearable rewards -----------------------------------------------------------------

export const GTA_PARDONLIN_GEAR: readonly PrefabDef[] = [
  // ---- Bean Tower (landmark) -----------------------------------------------------------------------------------------
  {
    id: 'pl-bean-tower', name: 'Bean Tower', category: 'prop', uses: ['place'],
    tags: ['bean', 'beans', 'tower', 'wigwam', 'pole', 'poles', 'canes', 'landmark', 'runner', 'pardonlin', 'gta'], emoji: [],
    footprint: { r: 7, h: 30 },
    about: 'Gnome Theft Auto: the Bean Tower, Pardonlin landmark. Six bamboo canes lean in from a 7 m ring to meet at 28.7 m, wrapped in spiralling runner-bean vines (leaf chains, red flower clusters, long hanging pods, curling tendrils), with a viewing platform at 10 m and a ladder. Origin at the ground centre. About 16 x 16 x 30 m.',
    examine: [
      'Six bamboo canes lean together into a point the height of a church, hung about with runner beans and red flowers.',
      'Saying: the beans go up, the gnomes go up, and the Tall-Ones never once came back to see how it ended.',
      'Tip: the platform at ten metres is reached by the ladder, and the view is excellent, provided you do not look down.',
      'Joke: it is the tallest thing in Pardonlin and the only thing that has never once been asked to pay the rent.',
      'Someone has tied a very large twine knot at the top, and every few years a new knot is tied on top of the old one.',
    ],
    parts: towerParts,
  },
  // ---- The Bean Tower's runner beans: the vines in prefabs of at most 40 parts each (the catalog's cap), placed at the
  // tower's own origin (pl-bean-vines-1 .. BEAN_VINE_IDS.length) ---------------------------------------------------------
  ...vineChunks(),

  // ---- The Unknown Pigeon (statue) -----------------------------------------------------------------------------------
  {
    id: 'pl-pigeon-statue', name: 'The Unknown Pigeon', category: 'prop', uses: ['place'],
    tags: ['pigeon', 'bird', 'statue', 'bronze', 'plinth', 'laurel', 'monument', 'pardonlin', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Unknown Pigeon. A stone plinth with a bronze-green pigeon on top, one wing raised heroically and a small laurel wreath. About 1.6 x 1.6 x 2.6 m.',
    examine: [
      'A bronze-green pigeon on a stone plinth, one wing raised heroically and a laurel wreath round its head.',
      'Saying: it was unknown when it was made, and it is still unknown, and it has never once been asked to explain.',
      'Tip: rub the plinth for luck. The pigeons on the Grand Platz will rub you back, and they are not gentle.',
      'Joke: the plaque says the pigeon was a hero. It does not say of what, and the pigeon would rather not be asked.',
      'The laurel is real laurel, once, and has been replaced in bronze every spring by people who forget why.',
    ],
    parts: [
      { s: 'box', d: [1.6, 1.4, 1.6], at: [0, 0.7, 0], c: 'stone', name: 'plinth' },
      { s: 'ball', d: [0.4], at: [0, 1.9, 0], scale: [0.85, 1.3, 1.25], c: 0x4f7a6a, seg: 8, name: 'body' },
      { s: 'ball', d: [0.2], at: [0, 2.45, 0.22], c: 0x4f7a6a, seg: 8, name: 'head' },
      { s: 'box', d: [0.06, 0.05, 0.2], at: [0, 2.42, 0.42], c: 0x3a5a4e, name: 'beak' },
      { s: 'box', d: [0.1, 0.6, 0.45], at: [0.3, 2.1, -0.05], rot: [0, 0, -35], c: 0x4f7a6a, name: 'wing' },
      { s: 'box', d: [0.24, 0.04, 0.36], at: [0, 1.75, -0.5], c: 0x3a5a4e, name: 'tail' },
      { s: 'ring', d: [0.3, 0.05], at: [0, 2.6, 0], rot: [90, 0, 0], c: 'leaf', seg: 8, name: 'laurel' },
    ],
  },

  // ---- Swan pedalo (vehicle, sit) ----------------------------------------------------------------------------------------
  {
    id: 'pl-swan-pedalo', name: 'Swan Pedalo', category: 'prop', uses: ['place', 'sit'],
    tags: ['swan', 'pedalo', 'boat', 'pedal', 'water', 'white', 'lake', 'pardonlin', 'gta'], emoji: [],
    seat: [0, 0.68, -1.0],
    about: 'Gnome Theft Auto: the Swan Pedalo. A white swan pedal boat about 3 m long with a curved neck, an orange beak, a wing on each side, a pedal bar and one seat. Origin at the waterline.',
    examine: [
      'A white swan pedal boat with a long curved neck, an orange beak and a seat tucked under the wing.',
      'Saying: a swan that will not fly is a boat, and a boat that will not sink is a swan, and both are mostly pedals.',
      'Tip: the pedals go round, the swan goes forward, and the lake goes wherever the pedals last pointed it.',
      'Joke: it has a very dignified face for a vessel that cannot turn left without a long argument with itself.',
      'Someone has painted a small crown on the beak, and nobody on Pardonlin will say who was allowed to do it.',
    ],
    parts: [
      { s: 'ball', d: [0.8], at: [0, 0.28, 0], scale: [1, 0.35, 2], c: 'white', seg: 8, name: 'hull' },
      { s: 'ball', d: [0.45], at: [0, 0.75, 0.3], scale: [1, 0.8, 1.3], c: 'white', seg: 8, name: 'body' },
      { s: 'cyl', d: [0.08, 0.08, 0.9], at: [0, 1.2, 0.75], rot: [20, 0, 0], c: 'white', seg: 6, name: 'neck' },
      { s: 'ball', d: [0.14], at: [0, 1.7, 0.92], c: 'white', seg: 6, name: 'head' },
      { s: 'box', d: [0.06, 0.05, 0.22], at: [0, 1.66, 1.05], c: 'orange', name: 'beak' },
      { s: 'ball', d: [0.35], at: [0.25, 0.9, 0.3], scale: [0.35, 0.6, 1], rot: [0, 0, -20], c: 'white', seg: 6, mirror: true, name: 'wing' },
      { s: 'box', d: [0.6, 0.05, 0.05], at: [0, 0.35, -0.7], c: 'iron-dark', name: 'pedal-bar' },
      { s: 'box', d: [0.5, 0.1, 0.4], at: [0, 0.6, -1.0], c: 'orange', name: 'seat' },
    ],
  },

  // ---- Queue Ticket Lanyard (neck) -------------------------------------------------------------------------------------
  {
    id: 'queue-ticket-lanyard', name: 'Queue Ticket Lanyard', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.18, 0] },
    tags: ['lanyard', 'ticket', 'queue', 'number', 'paper', 'red', 'neck', 'pardonlin', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Queue Ticket Lanyard. A red cord round the neck with a big paper ticket numbered 0001 hanging on the chest. Neck slot.',
    examine: [
      'A red cord round the neck, and on it a big paper ticket with the number 0001 in heavy black ink.',
      'Saying: the first in the queue is always the first to be asked what they are queueing for.',
      'Tip: keep the ticket out of the rain. The numbers run, and then you are simply a gnome standing in a puddle.',
      'Joke: the ticket is valid for any queue in Pardonlin. Nobody has yet been able to find the end of one.',
      'On the back, in a handwriting nobody recognises, someone has written please wait here, and underlined it twice.',
    ],
    parts: [
      { s: 'ring', d: [0.11, 0.012], at: [0, 0.14, 0], rot: [90, 0, 0], c: 'red', seg: 8, name: 'cord' },
      { s: 'box', d: [0.03, 0.2, 0.012], at: [0, 0.1, 0.1], c: 'red', name: 'strap' },
      { s: 'box', d: [0.13, 0.12, 0.012], at: [0, 0.06, 0.12], c: 'paper', name: 'ticket' },
      { s: 'box', d: [0.08, 0.025, 0.004], at: [0, 0.08, 0.127], c: 'ink', name: 'number' },
    ],
  },

  // ---- Daily Baguette (hand) -------------------------------------------------------------------------------------------
  {
    id: 'daily-baguette', name: 'Daily Baguette', category: 'tool', uses: ['hold'],
    wear: { rot: [0, 0, 180] },
    tags: ['baguette', 'bread', 'loaf', 'sleeve', 'paper', 'food', 'daily', 'pardonlin', 'gta'], emoji: [],
    grip: [0, 0.08, 0],
    about: 'Gnome Theft Auto: the Daily Baguette. A long baguette standing upright in a paper sleeve, held by the sleeve, with three diagonal scores. Hand slot.',
    examine: [
      'A long golden baguette standing upright in a paper sleeve, with three diagonal scores across the crust.',
      'Saying: bread is the only thing in Pardonlin that is ever delivered on time, and it is never on time for anyone else.',
      'Tip: hold it by the sleeve. The crust is for the bread, and the bread is for the walk home.',
      'Joke: the baguette is the length of a gnome, which makes it a very long way to carry something you will eat in one go.',
      'The paper sleeve has a small stamp on it from a bakery that closed on the same day it opened.',
    ],
    parts: [
      { s: 'cyl', d: [0.045, 0.04, 0.16], at: [0, 0.08, 0], c: 'paper', seg: 8, name: 'sleeve' },
      { s: 'pill', d: [0.03, 0.4], at: [0, 0.3, 0], c: 0xd9a441, seg: 6, name: 'bread' },
      { s: 'box', d: [0.035, 0.012, 0.012], at: [0, 0.4, 0.02], rot: [0, 0, 20], c: 0xb07a2a, name: 'score-a' },
      { s: 'box', d: [0.035, 0.012, 0.012], at: [0, 0.3, 0.02], rot: [0, 0, -20], c: 0xb07a2a, name: 'score-b' },
      { s: 'box', d: [0.035, 0.012, 0.012], at: [0, 0.2, 0.02], rot: [0, 0, 20], c: 0xb07a2a, name: 'score-c' },
    ],
  },

  // ---- Painter's Beret (head) ---------------------------------------------------------------------------------------------
  {
    id: 'painters-beret', name: "Painter's Beret", category: 'armor', uses: ['wear-head'],
    tags: ['beret', 'hat', 'cap', 'black', 'felt', 'paint', 'brush', 'painter', 'artist', 'pardonlin', 'gta'], emoji: [],
    tint: 0x2a2a30,
    about: 'Gnome Theft Auto: the Painters Beret. A black felt beret (the tint) with a paint-smudged brim and a small brush tucked in the band. Head slot.',
    examine: [
      'A black felt beret with a smudge of red paint on the brim and a small brush tucked into the band.',
      'Saying: a painter is a gnome who has been told to hold still, and has decided to do it in colour.',
      'Tip: the smudges are not dirt. They are a record of every afternoon spent on the Grand Platz trying to look like art.',
      'Joke: the brush has never painted anything. It was taken from a portrait that was finished by somebody else.',
      'Inside the band someone has written a price, then crossed it out, then written a higher one, which is the artist\'s way.',
    ],
    parts: [
      { s: 'cyl', d: [0.115, 0.115, 0.03], at: [0, 0.015, 0], c: 'black', seg: 10, name: 'band' },
      { s: 'ball', d: [0.15], at: [0, 0.075, 0], rot: [0, 0, 6], scale: [1, 0.45, 1], c: 'tint', seg: 10, name: 'crown' },
      { s: 'cyl', d: [0.012, 0.014, 0.04], at: [0.01, 0.148, 0], c: 'tint', seg: 6, name: 'stalk' },
      { s: 'ball', d: [0.03], at: [0.09, 0.05, 0.12], scale: [1.4, 0.6, 1], c: 'red', seg: 6, name: 'smudge' },
      { s: 'box', d: [0.012, 0.14, 0.012], at: [0.1, 0.12, 0.07], rot: [0, 0, -30], c: 'wood', name: 'brush-handle' },
      { s: 'ball', d: [0.02], at: [0.13, 0.19, 0.07], c: 'orange', seg: 6, name: 'brush-tip' },
    ],
  },

  // ---- Cello Case (back) ---------------------------------------------------------------------------------------------------
  {
    id: 'cello-case', name: 'Cello Case', category: 'armor', uses: ['wear-back'],
    wear: { at: [0, 0, 0.03] },
    tags: ['cello', 'case', 'music', 'strap', 'back', 'sticker', 'instrument', 'pardonlin', 'gta'], emoji: [],
    tint: 0x5a3320,
    about: 'Gnome Theft Auto: the Cello Case. A wooden instrument case on the back (the tint), with two shoulder straps, a carry handle and a Bean Tower sticker. Back slot.',
    examine: [
      'A brown wooden cello case worn on the back, with two straps over the shoulders and a sticker of the Bean Tower.',
      'Saying: the cello is not inside. The cello is out on the Platz, and has been out there all week, playing to the pigeons.',
      'Tip: keep the case upright and the lid shut. A cello left on its side is a cello that has been asked to stay.',
      'Joke: it is the largest thing on the back of any gnome in Pardonlin, and the only thing that can be seen from behind.',
      'The sticker is from a festival on the far side of the river, where the Bean Tower was the main attraction and the only one.',
    ],
    parts: [
      { s: 'box', d: [0.22, 0.62, 0.1], at: [0, 0.31, 0], c: 'tint', name: 'case' },
      { s: 'box', d: [0.025, 0.6, 0.02], at: [0.07, 0.31, -0.06], c: 'leather-dark', mirror: true, name: 'strap' },
      { s: 'box', d: [0.08, 0.03, 0.03], at: [0, 0.6, 0.06], c: 'leather-dark', name: 'handle' },
      { s: 'box', d: [0.09, 0.1, 0.004], at: [0, 0.2, 0.052], c: 'leaf', name: 'sticker' },
      { s: 'ball', d: [0.02], at: [0, 0.23, 0.058], c: 'red', seg: 6, name: 'sticker-flower' },
    ],
  },

  // ---- Flaneur Cravat (neck) ---------------------------------------------------------------------------------------------
  {
    id: 'flaneur-cravat', name: 'Flaneur Cravat', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.1, 0] },
    tags: ['cravat', 'scarf', 'silk', 'neck', 'pin', 'tie', 'ascot', 'flaneur', 'pardonlin', 'gta'], emoji: [],
    tint: 0x7a2e4a,
    about: 'Gnome Theft Auto: the Flaneur Cravat. A loosely tied silk cravat (the tint) with two trailing ends and a small gold pin. Neck slot.',
    examine: [
      'A loosely tied silk cravat in plum, with two long ends trailing down and a small gold pin at the knot.',
      'Saying: a flaneur does not walk anywhere in particular, and the cravat does not need to know where it is going either.',
      'Tip: tie it without a mirror. The look is far more convincing when you are not sure how it turned out.',
      'Joke: the pin is said to be for holding the cravat in place, but in practice it holds the cravat up for the gossip.',
      'One end has a tiny stitched word, too faint to read, which the owner insists is the name of a particular bench.',
    ],
    parts: [
      { s: 'ring', d: [0.13, 0.04], at: [0, 0.04, 0], rot: [90, 0, 0], c: 'tint', seg: 10, name: 'wrap' },
      { s: 'ball', d: [0.05], at: [0, 0.07, 0.15], c: 'tint', seg: 6, name: 'knot' },
      { s: 'box', d: [0.06, 0.16, 0.02], at: [-0.03, 0.08, 0.2], rot: [0, 0, 8], c: 'tint', name: 'end-a' },
      { s: 'box', d: [0.06, 0.12, 0.02], at: [0.04, 0.06, 0.2], rot: [0, 0, -10], c: 'tint', name: 'end-b' },
      { s: 'ball', d: [0.02], at: [0, 0.095, 0.2], c: 'gold', seg: 6, name: 'pin' },
    ],
  },
];
