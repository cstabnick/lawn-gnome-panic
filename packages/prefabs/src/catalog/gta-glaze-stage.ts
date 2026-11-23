// Pay 'n' Glaze showroom set dressing: the tilted pot the shop lives in, the spray-can rack, a giant wrench, and small workshop props.
// Placed by games/gnome-theft-auto/src/glazeStage.ts on the off-map stage the shop warps the player to. Real-world sized (a prop is metres, not gnome-hands).
import type { Part, PrefabDef } from '../types';

const DEG = Math.PI / 180;

/** Tilt parts about the z axis through the origin by `deg` (positive = top goes toward -x), then lift them so the lowest point sits on y = 0. */
function tilt(parts: readonly Part[], deg: number, lift: number): Part[] {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return parts.map((p) => {
    const [x, y, z] = p.at ?? [0, 0, 0];
    const [rx, ry, rz] = p.rot ?? [0, 0, 0];
    return { ...p, at: [x * c - y * s, x * s + y * c + lift, z], rot: [rx, ry, rz + deg] };
  });
}

const CLAY = 0xc4673e;
const CLAY_DARK = 0x8f4428;
const PINK = 0xff5fa8;
const CHROME = 0xdfe6ec;

// ---- the pot: body 3 tall, bottom radius 1.5, rim radius 2.2, leaned 22 degrees ----
const POT_TILT = -22;
const POT_LIFT = 1.5 * Math.sin(22 * DEG);
const potParts: Part[] = [
  { s: 'cyl', d: [2.1, 1.5, 3.0], at: [0, 1.5, 0], c: CLAY, seg: 14 },                      // body
  { s: 'cyl', d: [2.3, 2.2, 0.45], at: [0, 3.2, 0], c: CLAY_DARK, seg: 14 },                // rim band
  { s: 'cyl', d: [2.0, 2.0, 0.08], at: [0, 3.38, 0], c: 'dirt', seg: 14 },                   // soil inside the lip
  { s: 'cyl', d: [0.06, 0.06, 1.3], at: [0.2, 4.0, 0], c: 'leaf-dark', seg: 6 },            // a flower growing out of the pot
  { s: 'ball', d: [0.42], at: [0.2, 4.75, 0], c: PINK, seg: 8 },                              // its bloom
  { s: 'box', d: [1.4, 1.7, 0.2], at: [0, 1.0, 2.05], c: 'black' },                          // round-topped doorway (box part)
  { s: 'ball', d: [0.7], at: [0, 1.85, 2.05], scale: [1, 1, 0.3], c: 'black', seg: 10 },     // arch of the doorway
  { s: 'box', d: [1.7, 0.15, 0.25], at: [0, 0.1, 2.15], c: 'stone' },                        // doorstep
  { s: 'cyl', d: [0.12, 0.12, 0.4], rot: [90, 0, 0], at: [-1.1, 2.3, 2.1], c: 'brass', seg: 8 }, // lamp bracket
  { s: 'ball', d: [0.2], at: [-1.1, 2.3, 2.35], c: 'spark', glow: true, seg: 8 },            // doorway lamp
];
const POT: Part[] = [
  ...tilt(potParts, POT_TILT, POT_LIFT),
  // Pink glaze that has spilled over the low lip (+x) and pooled on the ground (not tilted).
  { s: 'box', d: [0.5, 0.9, 0.5], at: [3.0, 1.9, 0], rot: [0, 0, -12], c: PINK },
  { s: 'ball', d: [1.6], scale: [1.9, 0.06, 1.3], at: [4.1, 0.1, 0], c: PINK, seg: 10 },
];

// ---- the giant wrench: leaned 16 degrees against the pot ----
const wrenchParts: Part[] = [
  { s: 'box', d: [0.55, 5.4, 0.22], at: [0, 2.7, 0], c: CHROME },                            // handle
  { s: 'box', d: [0.3, 3.6, 0.24], at: [0, 2.6, 0], c: 'steel' },                            // lighter inner stripe
  { s: 'ring', d: [0.85, 0.3, 290], at: [0, 6.1, 0], rot: [0, 0, 115], c: CHROME, seg: 8 }, // open jaw (a torus with a gap)
  { s: 'cyl', d: [0.9, 0.9, 0.24], rot: [90, 0, 0], at: [0, 0.35, 0], c: CHROME, seg: 6 },   // box end (hex)
  { s: 'cyl', d: [0.4, 0.4, 0.26], rot: [90, 0, 0], at: [0, 0.35, 0], c: 'iron-dark', seg: 6 }, // hex hole
  { s: 'box', d: [0.12, 1.2, 0.26], at: [0.12, 4.2, 0], c: PINK },                          // a pink paint-splash stripe
];
const WRENCH = tilt(wrenchParts, 16, 0.564);

// ---- the spray-can rack: 6 wide, 3.4 tall, three shelves of cans (each can mirrored across x = 0) ----
function shelfCans(y: number, colours: readonly number[]): Part[] {
  const out: Part[] = [];
  colours.forEach((col, i) => {
    const x = 0.45 + i * 0.85;
    out.push({ s: 'cyl', d: [0.2, 0.2, 0.62], at: [x, y + 0.31, 0], c: col, seg: 8, mirror: true });
    out.push({ s: 'cyl', d: [0.1, 0.18, 0.1], at: [x, y + 0.67, 0], c: CHROME, seg: 8, mirror: true });
  });
  return out;
}
const RACK: Part[] = [
  { s: 'box', d: [0.22, 3.4, 0.5], at: [-3.0, 1.7, 0], c: 'wood-dark' },                      // posts
  { s: 'box', d: [0.22, 3.4, 0.5], at: [3.0, 1.7, 0], c: 'wood-dark' },
  { s: 'box', d: [6.2, 0.14, 0.6], at: [0, 0.9, 0], c: 'wood' },                              // shelves
  { s: 'box', d: [6.2, 0.14, 0.6], at: [0, 1.85, 0], c: 'wood' },
  { s: 'box', d: [6.2, 0.14, 0.6], at: [0, 2.8, 0], c: 'wood' },
  { s: 'box', d: [6.2, 3.3, 0.08], at: [0, 1.7, -0.26], c: 'wood-light' },                    // back board
  { s: 'box', d: [5.4, 0.55, 0.1], at: [0, 3.65, 0.1], c: PINK },                            // the header plank
  ...shelfCans(0.97, [0xff5fa8, 0x2fb5a8, 0xf2c230]),
  ...shelfCans(1.92, [0x8e44ad, 0xf05a24, 0x3a6bff]),
  ...shelfCans(2.87, [0x7dff6a, 0xd8342c, 0xf4f4f0]),
];

export const GTA_GLAZE_STAGE: readonly PrefabDef[] = [
  {
    id: 'glaze-stage-pot', name: "Pay 'n' Glaze Pot", category: 'prop', uses: ['place'], footprint: { r: 3, h: 5 },
    tags: ['glaze', 'stage', 'pot', 'garage', 'clay', 'shop'],
    emoji: [],
    about: "Pay 'n' Glaze's showroom: a huge clay pot tipped on its side in the dirt, with a lit doorway, a flower and a spill of pink glaze. Real-world sized; set dressing for the shop stage.",
    examine: [
      'A great clay pot, tipped over long ago and moved into, with a round doorway cut in its belly and a lamp that never goes out.',
      'Gnome saying: a pot on its side is a house, a pot upright is a problem, and a pot with a flower in it is a landlord.',
      'Tip: knock before you go in. The pot echoes, and the echo has opinions about your paint job.',
      'Joke: the flower has never been watered. It does not need to be. The glaze runs off the lip every time somebody sneezes.',
      'The doorstep is worn smooth on one side, by decades of gnomes shuffling in to ask if the paint is dry yet.',
    ],
    parts: POT,
  },
  {
    id: 'glaze-stage-wrench', name: 'Giant Wrench', category: 'prop', uses: ['place'], footprint: { r: 0.8, h: 6 },
    tags: ['glaze', 'stage', 'wrench', 'spanner', 'tool', 'chrome'],
    emoji: [],
    about: "A gnome-tall wrench with an open jaw and a hex box end, leaned on the wall of the Pay 'n' Glaze pot. Real-world sized; stage set dressing.",
    examine: [
      'A long chrome tool with a gaping jaw at one end and a six-sided hole at the other, taller than any gnome who has stood next to it.',
      'Saying: every mower comes apart with the right bite, and the biggest bite is kept at Pay \'n\' Glaze, just in case.',
      'Tip: do not lean on it while it is leaning on the pot. They have an arrangement.',
      'Joke: it is used for tightening exactly one nut, which belongs to the sign and which nobody has dared loosen.',
      'There is a pink thumbprint near the jaw. Glaze never really comes off.',
    ],
    parts: WRENCH,
  },
  {
    id: 'glaze-stage-rack', name: 'Spray-Can Rack', category: 'prop', uses: ['place'], footprint: { r: 3.2, h: 4 },
    tags: ['glaze', 'stage', 'rack', 'shelf', 'spray', 'cans', 'paint'],
    emoji: [],
    about: "A wooden rack with three shelves of coloured spray cans under a pink header plank. Real-world sized; the back wall of the Pay 'n' Glaze stage.",
    examine: [
      'A tall wooden rack of upright tins in every colour, each with a silver cap and a hissing little nozzle, stood in rows like soldiers.',
      'Saying: a gnome with one can paints a fender, a gnome with the whole rack paints the town and answers for it later.',
      'Tip: shake before use. The rattle is the paint saying it is ready, and also a good way to know who is in the shop.',
      'Joke: the colours are in a very careful order that nobody can explain, and the one marked Primer Grey is always empty.',
      'The top shelf is out of reach of every gnome, so the white cans up there are probably decorative, or probably haunted.',
    ],
    parts: RACK,
  },
  {
    id: 'glaze-stage-bucket', name: 'Paint Bucket', category: 'prop', uses: ['place'], footprint: { r: 0.5, h: 1 },
    tags: ['glaze', 'stage', 'bucket', 'paint', 'brush'],
    emoji: [],
    about: 'A pink paint bucket with drips down the side and a brush resting across the top. Stage set dressing.',
    examine: [
      'A round tin pail brimming with pink glaze, with long drips down one side and a wide brush laid across the top.',
      'Saying: never stir with a finger, never taste with a tongue, and never, ever call it salmon.',
      'Tip: wipe the brush on the rim, not on the gnome next to you. They notice.',
      'Joke: the bucket is always full, no matter how much is used. Nobody at the shop will say who refills it at night.',
      'The brush has a tiny chip in the handle, in the exact shape of a gnome bite.',
    ],
    parts: [
      { s: 'cyl', d: [0.52, 0.44, 0.75], at: [0, 0.375, 0], c: 'iron', seg: 12 },
      { s: 'cyl', d: [0.46, 0.46, 0.04], at: [0, 0.74, 0], c: PINK, seg: 12 },
      { s: 'ring', d: [0.5, 0.03], rot: [90, 0, 0], at: [0, 0.76, 0], c: 'iron-dark', seg: 10 },
      { s: 'box', d: [0.12, 0.5, 0.06], at: [0.4, 0.4, 0.1], c: PINK },
      { s: 'box', d: [0.07, 0.3, 0.05], at: [-0.3, 0.45, 0.28], c: PINK },
      { s: 'box', d: [1.1, 0.08, 0.1], rot: [0, 0, 8], at: [0, 0.82, 0], c: 'wood' },
      { s: 'box', d: [0.28, 0.08, 0.14], rot: [0, 0, 8], at: [-0.62, 0.78, 0], c: PINK },
    ],
  },
  {
    id: 'glaze-stage-tyres', name: 'Tyre Stack', category: 'prop', uses: ['place'], footprint: { r: 0.9, h: 1.1 },
    tags: ['glaze', 'stage', 'tyres', 'stack', 'rubber'],
    emoji: [],
    about: 'Three fat black tyres stacked in a tower, the top one with a hubcap on its face. Stage set dressing.',
    examine: [
      'Three black rings of rubber stacked like pancakes, the top one propped crooked and wearing a shiny hubcap like a hat.',
      'Saying: a stack of tyres is a seat, a table and a bed, and a gnome who sits on it is a landlord of nothing.',
      'Tip: roll it, do not carry it. The tower has already fallen over twice this week.',
      'Joke: they are all spares, for a mower that has never needed one, because it has never left the shop.',
      'The middle tyre has a small gnome-shaped dent in it, and an apology painted on in pink.',
    ],
    parts: [
      { s: 'cyl', d: [0.9, 0.9, 0.36], at: [0, 0.18, 0], c: 0x1d1d22, seg: 14 },
      { s: 'cyl', d: [0.9, 0.9, 0.36], at: [0.05, 0.54, 0.02], c: 0x25252b, seg: 14 },
      { s: 'cyl', d: [0.9, 0.9, 0.36], at: [-0.04, 0.9, -0.03], c: 0x1d1d22, seg: 14 },
      { s: 'cyl', d: [0.45, 0.45, 0.06], at: [-0.04, 1.1, -0.03], c: CHROME, seg: 12 },
      { s: 'cyl', d: [0.12, 0.12, 0.08], at: [-0.04, 1.16, -0.03], c: 'brass', seg: 8 },
    ],
  },
  {
    id: 'glaze-stage-cans', name: 'Spray Cans, Spilled', category: 'prop', uses: ['place'], footprint: { r: 0.8, h: 0.6 },
    tags: ['glaze', 'stage', 'cans', 'spray', 'litter'],
    emoji: [],
    about: 'A scatter of coloured spray cans, some standing and some rolled onto their sides. Stage set dressing for the dirt floor.',
    examine: [
      'A handful of coloured tins left on the dirt, a couple lying on their sides with their caps off and their nozzles crusted over.',
      'Saying: a can on its side has said everything it ever had to say, and a can still standing is lying.',
      'Tip: do not kick them. They rattle, and a rattle in the shop means somebody is about to be asked to leave.',
      'Joke: every one of them is empty, and every one of them is still somehow warm.',
      'One can has a tiny sticker on it that says Sorry in thick pink letters.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.2, 0.62], at: [-0.5, 0.31, 0.1], c: 0x2fb5a8, seg: 8 },
      { s: 'cyl', d: [0.1, 0.18, 0.1], at: [-0.5, 0.67, 0.1], c: CHROME, seg: 8 },
      { s: 'cyl', d: [0.2, 0.2, 0.62], rot: [0, 0, 90], at: [0.1, 0.2, -0.2], c: 0xf2c230, seg: 8 },
      { s: 'cyl', d: [0.2, 0.2, 0.62], rot: [0, 40, 90], at: [0.3, 0.2, 0.45], c: 0xff5fa8, seg: 8 },
      { s: 'cyl', d: [0.2, 0.2, 0.62], at: [0.62, 0.31, -0.1], c: 0x8e44ad, seg: 8 },
    ],
  },
  {
    id: 'glaze-stage-sign', name: "Pay 'n' Glaze Sign", category: 'prop', uses: ['place'], footprint: { r: 2.5, h: 3 },
    tags: ['glaze', 'stage', 'sign', 'plank', 'neon'],
    emoji: [],
    about: "A big pink plank on two posts with a glowing neon tube along the top: the blank board the stage paints the Pay 'n' Glaze name onto. Stage set dressing.",
    examine: [
      'A great pink plank on two stout posts, with a thin glowing tube of light along its top edge, buzzing like a trapped wasp.',
      'Saying: if the sign flickers in dashes and dots, somebody on the Greenhouse Strip is trying to tell you something.',
      'Tip: the tube is warm. Do not lick it, and do not ask what it is filled with.',
      'Joke: the slogan has been repainted so often that the board is now two fingers thicker than the day it went up.',
      'There are old drips down the bottom edge, in every colour the shop has ever sold, all of them pink on top.',
    ],
    parts: [
      { s: 'box', d: [0.3, 3.2, 0.3], at: [-2.2, 1.6, 0], c: 'wood-dark' },
      { s: 'box', d: [0.3, 3.2, 0.3], at: [2.2, 1.6, 0], c: 'wood-dark' },
      { s: 'box', d: [5.2, 1.5, 0.22], at: [0, 2.6, 0], c: PINK },
      { s: 'box', d: [5.2, 0.12, 0.3], at: [0, 3.42, 0], c: 'iron-dark' },
      { s: 'box', d: [4.9, 0.1, 0.1], at: [0, 3.5, 0.13], c: 'spark', glow: true },
      { s: 'box', d: [0.14, 0.5, 0.06], at: [-1.4, 1.65, 0.12], c: 0xe0245e },
      { s: 'box', d: [0.14, 0.9, 0.06], at: [0.2, 1.45, 0.12], c: 0xe0245e },
      { s: 'box', d: [0.14, 0.35, 0.06], at: [1.7, 1.72, 0.12], c: 0xe0245e },
    ],
  },
  {
    id: 'glaze-stage-dirt', name: 'Dirt Heap', category: 'prop', uses: ['place'], footprint: { r: 1.2, h: 0.6 },
    tags: ['glaze', 'stage', 'dirt', 'heap', 'soil', 'mound'],
    emoji: [],
    about: 'A low heap of dark soil with a few pebbles and a sprig, scattered about the stage floor. Stage set dressing.',
    examine: [
      'A low brown heap of loose soil with pebbles in it and one stubborn green sprig leaning out of the top.',
      'Saying: where a pot has tipped, the dirt always spills to the left, and the left is where the gnomes gather.',
      'Tip: it is only dirt. It is also, officially, a mountain, if you ask anyone small enough.',
      'Joke: the sprig has been trying to grow into a tree for years. The shop leans on it to keep the sign up.',
      'Somebody has drawn a very small door in the side of the heap, with a very small welcome mat.',
    ],
    parts: [
      { s: 'ball', d: [0.9], scale: [1.5, 0.4, 1.3], at: [0, 0.36, 0], c: 'dirt', seg: 8 },
      { s: 'ball', d: [0.5], scale: [1.4, 0.5, 1.1], at: [0.9, 0.25, 0.5], c: 0x5a3f27, seg: 8 },
      { s: 'ball', d: [0.15], at: [-0.5, 0.15, 0.8], c: 'stone', seg: 6 },
      { s: 'cyl', d: [0.03, 0.03, 0.4], at: [0.1, 0.8, 0], c: 'leaf-dark', seg: 5 },
      { s: 'ball', d: [0.12], scale: [1.4, 0.5, 1], at: [0.18, 1.02, 0], c: 'leaf', seg: 6 },
    ],
  },
  {
    id: 'glaze-stage-lamp', name: 'Work Lamp', category: 'prop', uses: ['place'], footprint: { r: 0.6, h: 2.4 },
    tags: ['glaze', 'stage', 'lamp', 'work', 'light', 'tripod'],
    emoji: [],
    about: 'A three-legged work lamp with a big warm bulb in a dented shade. The stage adds the real light; this is the stand.',
    examine: [
      'A tall tripod holding a dented tin shade with a fat bulb inside, aimed squarely at wherever the work is.',
      'Saying: a gnome can paint in the dark, but only a lamp will tell him which fender it was.',
      'Tip: angle it low and slightly left, or the shiny paint throws the glare straight back into your eyes.',
      'Joke: it buzzes the first three notes of a song nobody can quite place, and then gives up.',
      'One leg is a little shorter than the others, and has been propped with a flat acorn cup for years.',
    ],
    parts: [
      { s: 'cyl', d: [0.05, 0.06, 2.0], rot: [0, 0, 14], at: [0.28, 1.0, 0], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.05, 0.06, 2.0], rot: [14, 0, -7], at: [-0.14, 1.0, 0.25], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.05, 0.06, 2.0], rot: [-14, 0, -7], at: [-0.14, 1.0, -0.25], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.45, 0.2, 0.5], rot: [0, 0, -50], at: [0.0, 2.1, 0], c: 'iron', seg: 10 },
      { s: 'ball', d: [0.2], at: [0.18, 2.0, 0], c: 'spark', glow: true, seg: 8 },
    ],
  },
];
