// Gnome Theft Auto: Hedgeworth Links (batch 3 E15): the giant plants that line the course (soft: you drive through
// them), and small course props (sprinkler heads, molehills, lost-ball buckets...).
import type { Part, PrefabDef, Vec3 } from '../types';

const DEG = Math.PI / 180;

/** Rotation (degrees) that points a part's local +z along the radial direction at `yaw` and tips its tip down by `tilt`.
 * Three.js builds rotations in XYZ order, so this solves the Euler angles of Ry(yaw) * Rx(tilt). */
function radialRot(yaw: number, tilt: number): Vec3 {
  const sa = Math.sin(yaw * DEG), ca = Math.cos(yaw * DEG);
  const st = Math.sin(tilt * DEG), ct = Math.cos(tilt * DEG);
  const x = Math.atan2(st, ca * ct);
  const y = Math.asin(sa * ct);
  const z = Math.atan2(-sa * st, ca);
  return [x / DEG, y / DEG, z / DEG];
}

const hostaParts: Part[] = [
  // crown at the ground: the lowest point of the plant
  { s: 'cyl', d: [0.12, 0.14, 0.08], at: [0, 0.04, 0], c: 'leaf-dark', seg: 8 },
];
// Nine broad leaves fanning out, the outer ones drooping more. Each has a pale rim (trim) just outside its outline.
for (let i = 0; i < 9; i++) {
  const a = i * 40 + 10;
  const tilt = 15 + (i % 3) * 15;
  const y = 0.85 + (i % 3) * 0.15;
  const at: Vec3 = [0.55 * Math.sin(a * DEG), y, 0.55 * Math.cos(a * DEG)];
  const rot = radialRot(a, tilt);
  hostaParts.push({ s: 'ball', d: [0.5], at, rot, scale: [1, 0.08, 1.3], c: 'tint', seg: 8 });
  hostaParts.push({ s: 'ball', d: [0.5], at, rot, scale: [1.04, 0.03, 1.34], c: 'trim', seg: 8 });
}
// Three tall flower spikes with lilac bells.
for (const a of [0, 120, 240]) {
  const x = 0.25 * Math.sin(a * DEG), z = 0.25 * Math.cos(a * DEG);
  hostaParts.push({ s: 'cyl', d: [0.025, 0.015, 1.6], at: [x, 1.6, z], c: 'leaf-dark', seg: 6 });
  for (const y of [1.5, 1.8, 2.1, 2.3]) {
    hostaParts.push({ s: 'ball', d: [0.05], at: [x * 1.1, y, z * 1.1], scale: [1, 1.2, 1], c: 0xb9a3e3, seg: 6 });
  }
}

const FERN_ELEVATIONS = [85, 60, 30];
const FERN_LENGTH = 0.95;
const fernParts: Part[] = [
  { s: 'cyl', d: [0.1, 0.12, 0.06], at: [0, 0.03, 0], c: 'leaf-dark', seg: 8 },
  { s: 'ball', d: [0.07], at: [0, 0.25, 0], scale: [1, 1.3, 1], c: 'leaf', seg: 6 },
];
// Six fronds, each three segments arching outward and down, with a leaflet plate across every segment.
for (let f = 0; f < 6; f++) {
  const a = f * 60;
  let cur: Vec3 = [0, 0.06, 0];
  for (const el of FERN_ELEVATIONS) {
    const dir: Vec3 = [Math.sin(a * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), Math.cos(a * DEG) * Math.cos(el * DEG)];
    const mid: Vec3 = [
      cur[0] + (dir[0] * FERN_LENGTH) / 2,
      cur[1] + (dir[1] * FERN_LENGTH) / 2,
      cur[2] + (dir[2] * FERN_LENGTH) / 2,
    ];
    const rot = radialRot(a, -el);
    fernParts.push({ s: 'box', d: [0.05, 0.02, FERN_LENGTH], at: mid, rot, c: 'tint' });
    fernParts.push({ s: 'box', d: [0.22, 0.015, 0.14], at: mid, rot, c: 'leaf-dark' });
    cur = [cur[0] + dir[0] * FERN_LENGTH, cur[1] + dir[1] * FERN_LENGTH, cur[2] + dir[2] * FERN_LENGTH];
  }
}

const foxgloveParts: Part[] = [
  { s: 'cyl', d: [0.08, 0.1, 0.04], at: [0, 0.02, 0], c: 'leaf-dark', seg: 8 },
  { s: 'cyl', d: [0.015, 0.012, 2.7], at: [0, 1.4, 0], c: 'leaf', seg: 5 },
];
// Basal rosette: six flat leaves, tipped out.
for (let i = 0; i < 6; i++) {
  const a = i * 60;
  foxgloveParts.push({
    s: 'ball', d: [0.2], at: [0.2 * Math.sin(a * DEG), 0.12, 0.2 * Math.cos(a * DEG)], rot: radialRot(a, 12),
    scale: [1, 0.06, 1.5], c: 'leaf', seg: 6,
  });
}
// Twelve bell flowers up the spire, getting smaller toward the top. Each mouth has a speckled inside.
for (let i = 0; i < 12; i++) {
  const y = 0.7 + i * 0.17;
  const r = 0.07 * (1 - i / 16);
  const a = i * 137.5;
  const x = 0.05 * Math.sin(a * DEG), z = 0.05 * Math.cos(a * DEG);
  foxgloveParts.push({ s: 'cone', d: [r, 0.13], at: [x, y, z], c: 'tint', seg: 8 });
  foxgloveParts.push({ s: 'ball', d: [r * 0.3], at: [x, y - 0.055, z], c: 'purple', seg: 4 });
}

export const GTA_GOLF_PLANTS: readonly PrefabDef[] = [
  {
    id: 'giant-hosta', name: 'Giant Hosta', category: 'prop', uses: ['place'],
    tags: ['hosta', 'plant', 'leaf', 'leaves', 'giant', 'garden', 'flower', 'gta'], emoji: [],
    tint: 0x5f8f6a, trim: 0xc9dcb0,
    about: 'Giant hosta: nine broad ribbed leaves fanned from a crown, three tall flower spikes of lilac bells. Tint is the leaf colour, trim the pale edge. No pivots or named parts, so buildPrefabInstances can bake it.',
    examine: [
      'A fountain of broad, heart-shaped leaves with pale edges, taller than a gnome, and three spikes of lilac bells on top.',
      'It is not a tree, it insists, and it has never been asked to stop anyone.',
      'Tip: the leaves are soft and wide. A gnome can drive straight through them and only the bells will complain.',
      'Joke: every leaf is large enough to be a tablecloth, and has been used as one by the Hedgeworth picnic club.',
      'Gnome saying: "The hosta keeps its leaves in the shade and its opinions in the sun."',
    ],
    parts: hostaParts,
  },
  {
    id: 'giant-fern', name: 'Giant Fern', category: 'prop', uses: ['place'],
    tags: ['fern', 'frond', 'plant', 'leaves', 'giant', 'garden', 'green', 'gta'], emoji: [],
    tint: 'green',
    about: 'Giant fern: six arching fronds of three segments each, leaflet plates across each segment, and a curled fiddlehead in the crown. Tint is the frond colour.',
    examine: [
      'Six long fronds rise from one crown and arch outward, each one dotted with leaflets the size of a gnome shield.',
      'Gnome rhyme: "Ferns were here before the lawn, and will be here when it goes. Mind the crown."',
      'Tip: a frond is a fine place to rest in the shade, but do not sit on the fiddlehead. It is not a cushion.',
      'Joke: it is the only plant in Hedgeworth that has never needed watering, which is a sore point with Thrift.',
      'The fiddlehead in the middle is always curled tight. Nobody has seen it open, and the gnomes have stopped checking.',
    ],
    parts: fernParts,
  },
  {
    id: 'giant-foxglove', name: 'Giant Foxglove', category: 'prop', uses: ['place'],
    tags: ['foxglove', 'flower', 'bell', 'spire', 'plant', 'giant', 'garden', 'gta'], emoji: [],
    tint: 0xd36aa8,
    about: 'Giant foxglove: a basal rosette of six leaves and one tall spire hung with twelve pink bell flowers, getting smaller toward the top. Tint is the bell colour.',
    examine: [
      'A tall spire hung with pink bells, each one speckled inside, and a rosette of leaves at its foot.',
      'The foxglove rings for nobody, but it rings all the same, and the bells are always a little out of tune.',
      'Tip: the leaves are not for eating. The bells are not for ringing. Gnomes who try both are usually very sorry.',
      'Joke: the bells are shaped exactly like a gnome hat, which is why every hat in Hedgeworth has been checked for pollen.',
      'Gnome myth: the speckles are the spots of a small clay toad who once fell asleep inside a bell and was never seen again.',
    ],
    parts: foxgloveParts,
  },
  {
    id: 'sprinkler-head', name: 'Sprinkler Head', category: 'prop', uses: ['place'],
    tags: ['sprinkler', 'lawn', 'water', 'spray', 'nozzle', 'pop-up', 'garden', 'gta'], emoji: [],
    tint: 'leaf-dark',
    about: 'Pop-up lawn sprinkler: a green body flush with the ground, a cap, and a brass nozzle head named head so a game can spin it. Tint is the cap colour.',
    examine: [
      'A squat green post that sits flush with the grass, with a brass nozzle on top that looks ready to do something rude.',
      'Gnome saying: "The head that rises at dawn is the head that gets wet." It has never explained who wrote this.',
      'Tip: the head goes down when nobody is watching. Step on the grass around it and you will find it very quickly.',
      'Joke: it spits a fine, cold rain at regular intervals, and the Hedgeworth gnomes say it is the only one who keeps time.',
      'Its cap is loose. Someone has tied a piece of string to it, and the string goes into the Kicked Board.',
    ],
    parts: [
      { s: 'cyl', d: [0.05, 0.055, 0.115], at: [0, 0.0575, 0], c: 'green', seg: 8, name: 'body' },
      { s: 'cyl', d: [0.065, 0.065, 0.02], at: [0, 0.13, 0], c: 'tint', seg: 8 },
      { s: 'cyl', d: [0.02, 0.02, 0.05], at: [0, 0.165, 0], c: 'brass', seg: 6, name: 'head' },
      { s: 'ball', d: [0.03], at: [0, 0.195, 0], c: 'brass', seg: 6, name: 'head' },
    ],
  },
  {
    id: 'mole-hill', name: 'Mole Hill', category: 'prop', uses: ['place'],
    tags: ['mole', 'molehill', 'hill', 'soil', 'dirt', 'mound', 'garden', 'gta'], emoji: [],
    about: 'Fresh molehill: a dome of brown soil with crumbs, a pebble and a tuft of grass knocked over on top. No pivots, no colliders.',
    examine: [
      'A fresh dome of brown soil, still crumbly at the edges, with a tuft of grass knocked sideways on its crown.',
      'It is not a mole-hill, says Thrift, it is the green breathing. Nobody has asked him to explain.',
      'Tip: a mole-hill is a good place to leave a ball, because a mole will always move it somewhere worse.',
      'Joke: moles are very polite and always knock before they come up. Basil has never believed this.',
      'The tuft on top was there yesterday, and is still there today, and nobody has been able to say who put it there.',
    ],
    parts: [
      { s: 'ball', d: [0.45], at: [0, 0.1755, 0], scale: [1, 0.39, 1], c: 'dirt', seg: 8 },
      { s: 'ball', d: [0.03], at: [-0.25, 0.03, 0.15], c: 'dirt', seg: 4 },
      { s: 'ball', d: [0.025], at: [0.3, 0.025, 0.2], c: 'stone', seg: 4 },
      { s: 'box', d: [0.12, 0.06, 0.03], at: [0.2, 0.36, 0], rot: [0, 0, -30], c: 'grass', seg: 4 },
    ],
  },
  {
    id: 'lost-ball-bucket', name: 'Lost Ball Bucket', category: 'container', uses: ['place'],
    tags: ['bucket', 'golf', 'ball', 'balls', 'lost', 'metal', 'tin', 'gta'], emoji: [],
    about: 'Lost-ball bucket: a dented metal bucket heaped with white golf balls above the rim, and a blank label board leaning on it.',
    examine: [
      'A dented metal bucket, heaped with white balls above the rim, as if every ball on the course has come home at once.',
      'Lost balls are found again, eventually. The gnomes of Hedgeworth say the bucket knows the way.',
      'Tip: take one ball and the bucket will not notice. Take the bucket and Basil will notice, and he will make a speech.',
      'Joke: the label board is blank because nobody has ever agreed what to call a ball that has been lost for eleven years.',
      'It is always full. Nobody has ever seen a ball go in, and nobody has ever seen one come out.',
    ],
    parts: [
      { s: 'cyl', d: [0.14, 0.11, 0.3], at: [0, 0.15, 0], c: 'iron', seg: 8 },
      { s: 'ball', d: [0.045], at: [0, 0.34, 0], c: 'white', seg: 6 },
      { s: 'ball', d: [0.045], at: [0.05, 0.33, 0.03], c: 'white', seg: 6 },
      { s: 'ball', d: [0.045], at: [-0.05, 0.33, -0.02], c: 'white', seg: 6 },
      { s: 'ball', d: [0.045], at: [0.02, 0.38, -0.03], c: 'white', seg: 6 },
      { s: 'box', d: [0.2, 0.14, 0.02], at: [0.2, 0.072, 0.17], rot: [10, 0, 0], c: 'paper' },
    ],
  },
  {
    id: 'ball-washer', name: 'Ball Washer', category: 'prop', uses: ['place'],
    tags: ['washer', 'ball', 'golf', 'towel', 'crank', 'post', 'course', 'gta'], emoji: [],
    tint: 'green',
    about: 'Course ball washer: an iron post, a box head with a crank paddle on top and a green-and-white towel hanging on its front. Tint is the towel colour.',
    examine: [
      'An iron post with a box head, a crank paddle on top, and a towel hanging off the front in green and white stripes.',
      'Course saying: "Wash the ball before you blame the wind." It is printed on the washer and nobody reads it.',
      'Tip: turn the crank and the head will drip for a while. Do not put your own ball in: it will come out smaller.',
      'Joke: the towel has been green and white for so long that the Hedgeworth gnomes are no longer sure which colour it started as.',
      'It squeaks when nobody is near it. Basil says this is a superstition, and he is careful never to be near it.',
    ],
    parts: [
      { s: 'cyl', d: [0.15, 0.15, 0.04], at: [0, 0.02, 0], c: 'iron-dark', seg: 8 },
      { s: 'cyl', d: [0.04, 0.04, 0.86], at: [0, 0.47, 0], c: 'iron', seg: 6 },
      { s: 'box', d: [0.22, 0.2, 0.2], at: [0, 1.0, 0], c: 'iron-dark' },
      { s: 'box', d: [0.18, 0.03, 0.07], at: [0, 1.12, 0], c: 'steel' },
      { s: 'box', d: [0.12, 0.2, 0.01], at: [0.1, 0.68, 0.125], c: 'tint' },
      { s: 'box', d: [0.12, 0.06, 0.012], at: [0.1, 0.6, 0.136], c: 'white' },
    ],
  },
  {
    id: 'bunker-rake', name: 'Bunker Rake', category: 'tool', uses: ['place'],
    tags: ['rake', 'bunker', 'sand', 'wooden', 'handle', 'golf', 'course', 'gta'], emoji: [],
    about: 'Bunker rake: a wooden-handled sand rake lying flat, its head just touching the ground. The game lays it at bunker edges.',
    examine: [
      'A wooden-handled rake lying flat on the sand, with its metal head turned up as if it has just finished a job.',
      'Course rule: leave the rake where you found it, face down, teeth up, as the pro has asked on a small card.',
      'Tip: the handle is smooth from a great many hands. Do not hold it unless you are ready to rake something.',
      'Joke: nobody in Hedgeworth has ever raked a bunker. They just keep the rake there, in case the sand changes its mind.',
      'The footprints in the sand lead to the rake and then stop, as if whoever made them has decided to stay.',
    ],
    parts: [
      { s: 'cyl', d: [0.018, 0.018, 1.2], at: [0.1, 0.018, 0], rot: [0, 0, 90], c: 'wood', seg: 6 },
      { s: 'box', d: [0.22, 0.02, 0.12], at: [-0.5, 0.01, 0], c: 'iron' },
    ],
  },
];
