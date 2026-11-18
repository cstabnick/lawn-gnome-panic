// Props: world dressing at gnome scale. Signs, lamps, fences, rocks, garden junk. Bigger: 0.3 to 2 tall.
import type { Part, PrefabDef } from '../types';

// Disc golf basket helpers: 12 slats around the tray and 18 hanging chains (the "chains" group sways in-game).
const BASKET_SLATS: Part[] = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return { s: 'box', d: [0.12, 0.26, 0.02], at: [Math.cos(a) * 0.66, 0.56, Math.sin(a) * 0.66], rot: [0, -(a * 180) / Math.PI - 90, 0], c: 'steel' } as Part;
});
const BASKET_CHAINS: Part[] = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2;
  const r = i % 2 === 0 ? 0.58 : 0.4;
  const dr = r - 0.06;
  const dy = 0.86;
  const mid = (0.06 + r) / 2;
  return {
    s: 'cyl', d: [0.012, 0.012, Math.hypot(dr, dy)], at: [Math.cos(a) * mid, 0.78 + dy / 2, Math.sin(a) * mid],
    rot: [0, 180 - (a * 180) / Math.PI, (Math.atan2(dr, dy) * 180) / Math.PI], c: 'silver', seg: 4, group: 'chains',
  } as Part;
});


// Tumbleweed: 16 twig rings at fixed tilts (no randomness). Ring 0 lies flat on the ground.
const TUMBLE_TILTS: readonly (readonly [number, number, number])[] = [
  [90, 0, 0], [30, 70, 10], [120, 15, 60], [60, 150, 35], [150, 80, 110], [15, 40, 140], [100, 165, 20], [45, 110, 95],
  [135, 30, 150], [75, 125, 60], [10, 90, 125], [160, 55, 15], [50, 20, 80], [115, 140, 170], [25, 100, 45], [85, 60, 115],
];
/** Half the height of a ring (radius a, tube t) after an XYZ Euler tilt in degrees, measured over its bounding box. */
function ringHalfHeight(tilt: readonly number[], a: number, t: number): number {
  const [al, be, ga] = tilt.map((d) => (d * Math.PI) / 180);
  const [ca, sa, cb, sb, cg, sg] = [Math.cos(al), Math.sin(al), Math.cos(be), Math.sin(be), Math.cos(ga), Math.sin(ga)];
  // Row y of Rx * Ry * Rz.
  const m10 = ca * sg + sa * sb * cg;
  const m11 = ca * cg - sa * sb * sg;
  const m12 = -sa * cb;
  return a * (Math.abs(m10) + Math.abs(m11)) + t * Math.abs(m12);
}
const TUMBLEWEED_RINGS: Part[] = TUMBLE_TILTS.map((tilt, i) => {
  const R = [0.2, 0.17, 0.14][i % 3];
  const a = (i / TUMBLE_TILTS.length) * Math.PI * 2;
  const tube = 0.018;
  // Centre at its own half-height so every ring's bounding box starts at y = 0 (the test measures bounding boxes).
  const cy = ringHalfHeight(tilt, R + tube, tube);
  return {
    s: 'ring', d: [R, tube], at: [Math.cos(a) * 0.04, cy, Math.sin(a) * 0.04], rot: tilt, c: i % 2 ? 0x8a6a3e : 0xa07a4a, seg: 6,
  } as Part;
});

export const PROPS: PrefabDef[] = [
  {
    id: 'mushroom-lamp', name: 'Mushroom Lamp', category: 'prop', uses: ['place', 'light'],
    tags: ['lamp', 'light', 'mushroom', 'village', 'glow'], emoji: ['🏮'],
    about: 'A street lamp grown from a mushroom, a glowing bulb under the cap.',
    examine: [
      'A tall mushroom coaxed into a street lamp, with a glowing bulb hung under the cap.',
      'The glow is a fat beetle-larva that eats the cap from inside and does not mind the job.',
      'Lampwardens trim the caps every spring so the light falls on the path and not the neighbours.',
      'Moths love it. Gnomes put up with the moths.',
      'It hums very quietly at night. Children say it is singing. The lampwardens say nothing.',
    ],
    parts: [
      { s: 'cyl', d: [0.05, 0.07, 0.9], at: [0, 0.45, 0], c: 'mushroom-stem' },
      { s: 'ball', d: [0.26], at: [0, 0.95, 0], scale: [1, 0.5, 1], c: 'mushroom-cap', seg: 12 },
      { s: 'ball', d: [0.07], at: [0, 0.86, 0], c: 'spark', glow: true },
    ],
  },
  {
    id: 'signpost', name: 'Signpost', category: 'prop', uses: ['place'],
    tags: ['sign', 'signpost', 'post', 'arrow', 'board', 'direction'], emoji: ['🪧'],
    about: 'A wooden post with two arrow boards pointing opposite ways.',
    examine: [
      'A stout post with two arrow boards nailed on, pointing opposite ways, both sure they are right.',
      'Gnome law: the arrow points to where the sign-painter was going, not to where you are going.',
      'Read the top board first. The bottom board is for the lost.',
      'Half the arrows have been painted over at least once. The bottom one has been painted over three times.',
      'A small carving on the post reads "Mossbottom, one hour, or two if you go by the Verge".',
    ],
    parts: [
      { s: 'cyl', d: [0.025, 0.03, 1.0], at: [0, 0.5, 0], c: 'wood-dark', seg: 6 },
      { s: 'box', d: [0.28, 0.09, 0.02], at: [0.1, 0.8, 0.035], c: 'wood-light' },
      { s: 'cone', d: [0.06, 0.08], at: [0.27, 0.8, 0.035], rot: [0, 0, -90], c: 'wood-light', seg: 4 },
      { s: 'box', d: [0.28, 0.09, 0.02], at: [-0.1, 0.6, 0.035], c: 'wood' },
      { s: 'cone', d: [0.06, 0.08], at: [-0.27, 0.6, 0.035], rot: [0, 0, 90], c: 'wood', seg: 4 },
    ],
  },
  {
    id: 'picket-fence', name: 'Picket Fence', category: 'prop', uses: ['place'],
    tags: ['fence', 'picket', 'pickets', 'rail', 'white', 'garden'], emoji: [],
    about: 'A 1.0 wide section of white picket fence: three pickets on two rails.',
    examine: [
      'A short section of white picket fence: three pointed pickets fixed to two rails, scrubbed clean.',
      'The Fence is the oldest thing in the world, the songs say, and every gnome knows where its gaps are.',
      'Climb it at the post, not the picket, or the picket will tell the whole Verge.',
      'It keeps the slugs out, the neighbours out, and in a windy year the wind out too, depending on the wind.',
      'One picket is a slightly different white from the others. It was patched with something that might once have been a hat.',
    ],
    parts: [
      { s: 'box', d: [1.0, 0.05, 0.02], at: [0, 0.15, 0], c: 'white' },
      { s: 'box', d: [1.0, 0.05, 0.02], at: [0, 0.45, 0], c: 'white' },
      { s: 'box', d: [0.07, 0.6, 0.02], at: [-0.45, 0.3, 0], c: 'white' },
      { s: 'cone', d: [0.05, 0.12], at: [-0.45, 0.66, 0], scale: [1, 1, 0.4], c: 'white', seg: 4 },
      { s: 'box', d: [0.07, 0.6, 0.02], at: [0, 0.3, 0], c: 'white' },
      { s: 'cone', d: [0.05, 0.12], at: [0, 0.66, 0], scale: [1, 1, 0.4], c: 'white', seg: 4 },
      { s: 'box', d: [0.07, 0.6, 0.02], at: [0.45, 0.3, 0], c: 'white' },
      { s: 'cone', d: [0.05, 0.12], at: [0.45, 0.66, 0], scale: [1, 1, 0.4], c: 'white', seg: 4 },
    ],
  },
  {
    id: 'stepping-stone', name: 'Stepping Stone', category: 'prop', uses: ['place'],
    tags: ['stone', 'step', 'path', 'slab', 'flat', 'grey'], emoji: [],
    about: 'A flat round grey stone slab set in the path, with a chipped corner.',
    examine: [
      'A flat round grey slab sunk a little into the grass, with a chipped corner facing the path.',
      'Old rhyme: "Step on the stone and never the grass, or the path will not let you pass."',
      'Step on it with both feet, or it wobbles and tells the whole path.',
      'Someone has painted a small white dot on it. Everyone agrees the dot means "here", but nobody agrees what for.',
      'It has been stood on so often it has a hollow in the middle, shaped like a gnome who is never there.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.13, 0.05], at: [0, 0.025, 0], c: 'stone', seg: 9 },
      { s: 'ball', d: [0.03], at: [0.05, 0.05, 0.03], scale: [1, 0.5, 1], c: 'stone-dark', seg: 6 },
    ],
  },
  {
    id: 'flower-pot', name: 'Flower Pot', category: 'prop', uses: ['place'],
    tags: ['pot', 'flower', 'planter', 'terracotta', 'flowerpot', 'bloom'], emoji: ['🪴'],
    about: 'A terracotta pot with a red flower, a green stem and two leaves.',
    examine: [
      'A terracotta pot with a red bloom on a green stem, and two leaves that look like they were added later.',
      'Tall flowers look kind. Short flowers look sensible. Gnome gardeners plant both and hope.',
      'Water from below the rim, not onto the petals, unless you enjoy losing the petals.',
      'Gnome saying: "A pot with a flower is a pot with a secret, and the secret is usually a bee."',
      'A crack in the side is filled with blue glaze, which shines in the sun. It is the only blue thing in the yard.',
    ],
    parts: [
      { s: 'cyl', d: [0.09, 0.07, 0.13], at: [0, 0.065, 0], c: 'terracotta', seg: 10 },
      { s: 'ring', d: [0.09, 0.012], at: [0, 0.13, 0], rot: [90, 0, 0], c: 'clay-dark', seg: 10 },
      { s: 'cyl', d: [0.085, 0.085, 0.01], at: [0, 0.125, 0], c: 'dirt', seg: 10 },
      { s: 'cyl', d: [0.008, 0.008, 0.14], at: [0, 0.2, 0], c: 'leaf-dark', seg: 5 },
      { s: 'ball', d: [0.04], at: [0.04, 0.19, 0], scale: [1.6, 0.4, 0.9], c: 'leaf', mirror: true, seg: 6 },
      { s: 'ball', d: [0.05], at: [0, 0.3, 0], scale: [1, 0.7, 1], c: 'red', seg: 6 },
      { s: 'ball', d: [0.015], at: [0, 0.31, 0.03], c: 'yellow', seg: 5 },
    ],
  },
  {
    id: 'garden-rock', name: 'Garden Rock', category: 'prop', uses: ['place'],
    tags: ['rock', 'boulder', 'stone', 'moss', 'garden'], emoji: [],
    about: 'A big rounded boulder with a patch of moss on top and a pebble at its foot.',
    examine: [
      'A big rounded boulder with a patch of moss on top and a small grey pebble fallen at its foot.',
      'Old saying: "The rock was here before the garden, and it will be here after the garden has gone."',
      'Sit on it for a rest, but mind the moss. Moss is slippery, and so is a gnome who has just eaten.',
      'It makes a good hiding place, and a better place for a fight. Gnome parents have opinions on both.',
      'Tap it with a spoon and it rings like a bell. The bell is said to be very old, and very much not a bell.',
    ],
    parts: [
      { s: 'ball', d: [0.35], at: [0, 0.2625, 0], scale: [1, 0.75, 0.9], c: 'stone', seg: 10 },
      { s: 'ball', d: [0.2], at: [0.06, 0.47, 0.04], scale: [1, 0.3, 1], c: 'moss', seg: 8 },
      { s: 'ball', d: [0.09], at: [-0.33, 0.072, 0.15], scale: [1, 0.8, 1], c: 'stone-dark', seg: 7 },
    ],
  },
  {
    id: 'tree-stump', name: 'Tree Stump', category: 'prop', uses: ['place', 'sit'],
    tags: ['stump', 'tree', 'wood', 'log', 'ring', 'roots'], emoji: [],
    seat: [0, 0.32, 0],
    about: 'A short stump with roots spreading over the soil and rings on its top.',
    examine: [
      'A short stump with rings on its flat top, and roots spreading over the soil like the fingers of a hand.',
      'Counting the rings tells you how old the tree was. Counting them again tells you how old you are.',
      'Sit on it for a rest. It is firm, flat, and nobody will say it is too low.',
      'Old saying: "Every stump remembers the tree, and no stump will say which tree."',
      'Someone has pushed a little paper boat into a crack in the wood. It is still there. Nobody knows who.',
    ],
    parts: [
      { s: 'cyl', d: [0.18, 0.2, 0.3], at: [0, 0.15, 0], c: 'bark', seg: 10 },
      { s: 'cyl', d: [0.18, 0.18, 0.02], at: [0, 0.31, 0], c: 'wood-light', seg: 10 },
      { s: 'ring', d: [0.12, 0.008], at: [0, 0.322, 0], rot: [90, 0, 0], c: 'wood-dark', seg: 8 },
      { s: 'ring', d: [0.06, 0.006], at: [0, 0.322, 0], rot: [90, 0, 0], c: 'wood-dark', seg: 6 },
      { s: 'box', d: [0.09, 0.05, 0.12], at: [0.19, 0.025, 0.05], c: 'bark' },
      { s: 'box', d: [0.12, 0.05, 0.09], at: [-0.05, 0.025, -0.19], c: 'bark' },
      { s: 'box', d: [0.1, 0.05, 0.09], at: [-0.18, 0.025, 0.07], c: 'bark' },
    ],
  },
  {
    id: 'village-well', name: 'Well', category: 'prop', uses: ['place'],
    tags: ['well', 'water', 'bucket', 'rope', 'stone', 'village', 'roof'], emoji: [],
    about: 'A round stone well with a little peaked roof, a rope and a bucket.',
    examine: [
      'A round stone well with a little peaked roof on two posts, and a bucket hanging down into the dark.',
      'The water is cold even in summer, the old women say, and it is the same water as the well at Birdbath Keep.',
      'Lower the bucket slowly, let it fill, then haul hand over hand. Do not look down while hauling.',
      'Gnome saying: "Never drop a coin in the well unless you want the well to come asking for it."',
      'Scratched inside the rim is a row of tally marks, one for every bucket hauled and a big one for every spill.',
    ],
    parts: [
      { s: 'cyl', d: [0.26, 0.26, 0.45], at: [0, 0.225, 0], c: 'stone', seg: 12 },
      { s: 'ring', d: [0.25, 0.03], at: [0, 0.45, 0], rot: [90, 0, 0], c: 'stone-dark', seg: 12 },
      { s: 'cyl', d: [0.2, 0.2, 0.01], at: [0, 0.455, 0], c: 'slate', seg: 12 },
      { s: 'cyl', d: [0.02, 0.02, 0.5], at: [0.22, 0.705, 0], c: 'wood-dark', seg: 6, mirror: true },
      { s: 'cyl', d: [0.012, 0.012, 0.44], at: [0, 0.9, 0], rot: [0, 0, 90], c: 'wood', seg: 6 },
      { s: 'cyl', d: [0.005, 0.005, 0.3], at: [0, 0.75, 0], c: 'burlap', seg: 4 },
      { s: 'cyl', d: [0.05, 0.04, 0.07], at: [0, 0.55, 0], c: 'wood', seg: 8 },
      { s: 'cone', d: [0.3, 0.12], at: [0, 1.015, 0], c: 'wood-dark', seg: 4 },
    ],
  },
  {
    id: 'glaze-shrine', name: 'Glaze Shrine', category: 'prop', uses: ['place', 'light'],
    tags: ['shrine', 'glaze', 'basin', 'pedestal', 'blue', 'light', 'glow'], emoji: ['⛲'],
    about: 'A small stone basin on a pedestal holding glowing blue glaze. Gives light.',
    examine: [
      'A small stone basin on a pedestal, full of blue glaze that gives off a steady, even light.',
      'Glaze mends cracks, the songs say. The first shrine was raised where someone poured glaze over a broken pot.',
      'Dip a cracked gnome in the basin and hold it there. The crack closes, slow as a sigh.',
      'Do not drink it. It mends cracks on the inside too, and nobody wants to hear the details.',
      'The light never flickers. Moths circle it all night and never once land, as if it were a rumour.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.06, 0.3], at: [0, 0.03, 0], c: 'stone-dark' },
      { s: 'cyl', d: [0.06, 0.09, 0.45], at: [0, 0.285, 0], c: 'stone', seg: 8 },
      { s: 'cyl', d: [0.22, 0.14, 0.1], at: [0, 0.56, 0], c: 'stone', seg: 10 },
      { s: 'cyl', d: [0.19, 0.19, 0.02], at: [0, 0.615, 0], c: 'glaze-blue', glow: true, seg: 10 },
    ],
    lights: [{ at: [0, 0.7, 0], c: 'glaze-blue', intensity: 1.0, distance: 3 }],
  },
  {
    id: 'campfire', name: 'Campfire', category: 'prop', uses: ['place', 'light'],
    tags: ['campfire', 'fire', 'flame', 'logs', 'ring', 'light', 'camp'], emoji: ['🔥'],
    rest: { radius: 0.75 },
    about: 'A ring of stones around crossed logs, with flames. Gives light.',
    examine: [
      'A ring of stones around crossed logs, with orange flames licking up into the dark.',
      'Old rhyme: "Fire in the ring, the dark keeps its distance, and the storytellers keep the rest."',
      'Keep the logs in the middle and the children outside the ring. Both rules get broken every year.',
      'It smells of burnt sap and burnt toast, which is how every good camp should smell.',
      'The flames change colour when a secret is told. Nobody has seen it happen, but everyone has seen them change.',
    ],
    parts: [
      { s: 'ball', d: [0.07], at: [0.2, 0.035, 0], scale: [1, 0.5, 1], c: 'stone', seg: 7 },
      { s: 'ball', d: [0.07], at: [0.1, 0.035, 0.173], scale: [1, 0.5, 1], c: 'stone-dark', seg: 7 },
      { s: 'ball', d: [0.07], at: [-0.1, 0.035, 0.173], scale: [1, 0.5, 1], c: 'stone', seg: 7 },
      { s: 'ball', d: [0.07], at: [-0.2, 0.035, 0], scale: [1, 0.5, 1], c: 'stone-dark', seg: 7 },
      { s: 'ball', d: [0.07], at: [-0.1, 0.035, -0.173], scale: [1, 0.5, 1], c: 'stone', seg: 7 },
      { s: 'ball', d: [0.07], at: [0.1, 0.035, -0.173], scale: [1, 0.5, 1], c: 'stone-dark', seg: 7 },
      { s: 'cyl', d: [0.035, 0.035, 0.34], at: [0, 0.035, 0], rot: [0, 0, 90], c: 'wood-dark', seg: 6 },
      { s: 'cyl', d: [0.035, 0.035, 0.34], at: [0, 0.105, 0], rot: [90, 0, 0], c: 'bark', seg: 6 },
      { s: 'ball', d: [0.07], at: [0, 0.18, 0], scale: [1, 1.8, 1], c: 'flame', glow: true, seg: 6 },
      { s: 'ball', d: [0.035], at: [-0.035, 0.15, 0.02], scale: [1, 1.7, 1], c: 'flame', glow: true, seg: 5 },
      { s: 'ball', d: [0.04], at: [0, 0.16, 0], scale: [1, 1.6, 1], c: 'spark', glow: true, seg: 6 },
    ],
    lights: [{ at: [0, 0.45, 0], c: 'flame', intensity: 1.8, distance: 5 }],
  },
  {
    id: 'mailbox', name: 'Mailbox', category: 'prop', uses: ['place'],
    tags: ['mailbox', 'post', 'letter', 'box', 'flag', 'mail'], emoji: ['📫'],
    about: 'A wooden letterbox on a post, with a little red flag on the side.',
    examine: [
      'A wooden letterbox on a post, with a small red flag on the side that goes up when a letter is inside.',
      'Gnome law: a letter in the box belongs to the person whose name is on it, and the name is always spelt wrong.',
      'Put the flag down after you take your post, or the next gnome will think you have been wronged.',
      'Letters arrive from far off, sealed in wax and smelling of the Verge. Nobody has yet read one all the way through.',
      'Someone has written on the lid in chalk: "BEWARE THE SLUGS". The slugs have not complained.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 0.6], at: [0, 0.3, 0], c: 'wood-dark', seg: 6 },
      { s: 'box', d: [0.2, 0.16, 0.3], at: [0, 0.68, 0], c: 'wood' },
      { s: 'box', d: [0.22, 0.02, 0.32], at: [0, 0.77, 0], c: 'wood-dark' },
      { s: 'box', d: [0.14, 0.1, 0.005], at: [0, 0.7, 0.1525], c: 'bark' },
      { s: 'box', d: [0.02, 0.02, 0.12], at: [0.11, 0.68, -0.1], c: 'wood-dark' },
      { s: 'box', d: [0.01, 0.08, 0.05], at: [0.11, 0.74, -0.14], c: 'red' },
    ],
  },
  {
    id: 'toadstool-seat', name: 'Toadstool Seat', category: 'prop', uses: ['place', 'sit'],
    tags: ['toadstool', 'mushroom', 'seat', 'stool', 'sit', 'cap'], emoji: [],
    seat: [0, 0.4, 0],
    about: 'A squat red-capped toadstool with a flat top and white spots, sized to sit on.',
    examine: [
      'A squat red-capped toadstool with a flat top and white spots, sized for a gnome to sit on.',
      'Gnome saying: "Sit on the mushroom and the mushroom sits on you."',
      'Sit gently. The cap has held many gnomes and at least one large beetle, who did not leave.',
      'The spots are said to be the last of a Rain-school spell. The spell has worn off. The spots have not.',
      'It is slightly damp, slightly warm, and always a little too comfortable to get up from.',
    ],
    parts: [
      { s: 'cyl', d: [0.09, 0.11, 0.3], at: [0, 0.15, 0], c: 'mushroom-stem', seg: 9 },
      { s: 'cyl', d: [0.2, 0.22, 0.1], at: [0, 0.35, 0], c: 'mushroom-cap', seg: 10 },
      { s: 'ball', d: [0.025], at: [0.1, 0.4, 0.03], scale: [1, 0.4, 1], c: 'white', seg: 5 },
      { s: 'ball', d: [0.025], at: [-0.06, 0.4, 0.09], scale: [1, 0.4, 1], c: 'white', seg: 5 },
      { s: 'ball', d: [0.02], at: [0.0, 0.4, -0.1], scale: [1, 0.4, 1], c: 'white', seg: 5 },
    ],
  },
  {
    id: 'hay-bale', name: 'Hay Bale', category: 'prop', uses: ['place'],
    tags: ['hay', 'straw', 'bale', 'bundle', 'farm'], emoji: [],
    about: 'A square block of straw tied with two dark bands.',
    examine: [
      'A square block of golden straw bound tight with two dark bands, sweet-smelling and faintly itchy.',
      'Old rhyme: "One bale for the cold, one for the spring, one for the gnome who forgot everything."',
      'Cut the bands with a sharp blade, not a tooth. The bands are tighter than they look, and angrier.',
      'Mice live in it, the gnomes say, and pay their rent by eating the rest of it.',
      'Someone has tucked a red ribbon under one band. It was meant as a gift, but the gift never arrived.',
    ],
    parts: [
      { s: 'box', d: [0.5, 0.35, 0.35], at: [0, 0.175, 0], c: 'straw' },
      { s: 'box', d: [0.03, 0.36, 0.36], at: [0.14, 0.175, 0], c: 'leather-dark', mirror: true },
    ],
  },
  {
    id: 'wheelbarrow', name: 'Wheelbarrow', category: 'prop', uses: ['place'],
    tags: ['wheelbarrow', 'barrow', 'wheel', 'tray', 'cart'], emoji: [],
    about: 'A wooden tray on one front wheel, with two long handles at the back.',
    examine: [
      'A wooden tray on one fat front wheel, with two long handles at the back and two stubby legs to hold it level.',
      'Gnome saying: "A barrow carries more than a gnome, but a gnome carries more than a barrow."',
      'Load it evenly, or the wheel will sulk and the tray will spill its opinion onto the path.',
      'The wheel squeaks in a voice that children learn to copy. Mothers do not thank them for this.',
      'It was painted bright green once. Most of the paint is now on the gnome who painted it.',
    ],
    parts: [
      { s: 'box', d: [0.4, 0.16, 0.5], at: [0, 0.3, 0.05], c: 'wood' },
      { s: 'cyl', d: [0.14, 0.14, 0.04], at: [0, 0.14, 0.36], rot: [0, 0, 90], c: 'wood-dark', seg: 10 },
      { s: 'cyl', d: [0.03, 0.03, 0.05], at: [0, 0.14, 0.36], rot: [0, 0, 90], c: 'iron-dark', seg: 6 },
      { s: 'box', d: [0.03, 0.22, 0.03], at: [0.15, 0.11, -0.2], c: 'wood-dark', mirror: true },
      { s: 'box', d: [0.03, 0.03, 0.5], at: [0.15, 0.3, -0.45], c: 'wood-dark', mirror: true },
    ],
  },
  {
    id: 'market-stall', name: 'Market Stall', category: 'prop', uses: ['place'],
    tags: ['market', 'stall', 'awning', 'counter', 'stand', 'shop', 'striped'], emoji: [],
    about: 'A wooden counter under a striped red-and-white awning on four posts, about 1.5 tall.',
    examine: [
      'A wooden counter under a striped red-and-white awning on four posts, a gnome and a half tall.',
      'Old saying: "Never trust a stall with no prices, and never trust a stall with prices."',
      'Haggle politely. The stallholder has a longer memory than the awning.',
      'The Mower has never come to the market. Everyone agrees this is because the stalls are too close together.',
      'The awning has been mended with three colours of thread, and two gnomes will argue about which was the original.',
    ],
    parts: [
      { s: 'box', d: [0.9, 0.5, 0.4], at: [0, 0.25, 0], c: 'wood' },
      { s: 'box', d: [0.94, 0.04, 0.44], at: [0, 0.52, 0], c: 'wood-light' },
      { s: 'cyl', d: [0.025, 0.025, 1.45], at: [0.46, 0.725, 0.22], c: 'wood-dark', seg: 6, mirror: true },
      { s: 'cyl', d: [0.025, 0.025, 1.45], at: [0.46, 0.725, -0.22], c: 'wood-dark', seg: 6, mirror: true },
      { s: 'box', d: [0.22, 0.04, 0.6], at: [-0.44, 1.45, 0], c: 'red' },
      { s: 'box', d: [0.22, 0.04, 0.6], at: [-0.22, 1.45, 0], c: 'white' },
      { s: 'box', d: [0.22, 0.04, 0.6], at: [0, 1.45, 0], c: 'red' },
      { s: 'box', d: [0.22, 0.04, 0.6], at: [0.22, 1.45, 0], c: 'white' },
      { s: 'box', d: [0.22, 0.04, 0.6], at: [0.44, 1.45, 0], c: 'red' },
    ],
  },
  {
    id: 'lawn-flamingo', name: 'Lawn Flamingo', category: 'prop', uses: ['place', 'collect'],
    tags: ['flamingo', 'lawn', 'pink', 'bird', 'ornament'], emoji: ['🦩'],
    tint: 'pink',
    about: 'A bright pink plastic lawn flamingo standing on two thin wire legs. Tint is the plumage.',
    examine: [
      'A bright pink long-necked bird on two thin wire legs, staring across the turf with painted eyes.',
      'Nobody knows if the Tall Ones kept them for luck, for company, or to confuse the crows.',
      'Push the wire legs deep into soft soil, or the first gust of wind sends it beak-first into the clover.',
      'Gnomes treat them with polite suspicion, as they never blink and never leave.',
      'One leg is bent slightly where a mower clipped it and thought better of a second pass.',
    ],
    parts: [
      { s: 'cyl', d: [0.008, 0.008, 0.34], at: [0.035, 0.17, 0], c: 'iron-dark', seg: 6, mirror: true },
      { s: 'ball', d: [0.11], at: [0, 0.38, 0], scale: [0.8, 0.75, 1.35], c: 'tint', seg: 10 },
      { s: 'cyl', d: [0.022, 0.026, 0.24], at: [0, 0.52, 0.1], rot: [16, 0, 0], c: 'tint', seg: 8 },
      { s: 'ball', d: [0.045], at: [0, 0.64, 0.14], c: 'tint', seg: 8 },
      { s: 'cone', d: [0.018, 0.07], at: [0, 0.625, 0.2], rot: [108, 0, 0], c: 'black', seg: 6 },
      { s: 'ball', d: [0.008], at: [0.028, 0.65, 0.16], c: 'black', seg: 5, mirror: true },
    ],
  },
  {
    id: 'rubber-duck', name: 'Rubber Duck', category: 'prop', uses: ['place', 'collect'],
    tags: ['duck', 'rubber', 'bath', 'yellow', 'toy', 'squeak'], emoji: ['🦆'],
    tint: 'yellow',
    about: 'A cheerful yellow rubber duck with an orange bill. Tint is the body.',
    examine: [
      'A plump yellow duck with a wide orange bill and painted eyes that look perpetually surprised.',
      'Found floating in puddles, birdbaths, and occasionally the middle of the sea after a storm.',
      'Squeeze it in the middle and it gives a high, indignant squeak that startles frogs.',
      'Gnome sailors keep one on the bowsprit because it refuses to sink.',
      'A faint stamp on the belly has been worn smooth by a thousand baths.',
    ],
    parts: [
      { s: 'ball', d: [0.09], at: [0, 0.075, -0.01], scale: [0.95, 0.8, 1.2], c: 'tint', seg: 10 },
      { s: 'cone', d: [0.035, 0.06], at: [0, 0.11, -0.11], rot: [-70, 0, 0], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.055], at: [0, 0.17, 0.06], c: 'tint', seg: 10 },
      { s: 'cone', d: [0.024, 0.055], at: [0, 0.165, 0.125], rot: [95, 0, 0], c: 'orange', seg: 6 },
      { s: 'ball', d: [0.009], at: [0.032, 0.185, 0.1], c: 'black', seg: 6, mirror: true },
    ],
  },
  {
    id: 'gnome-statue', name: 'Gnome Statue', category: 'prop', uses: ['place'],
    tags: ['statue', 'gnome', 'plinth', 'stone', 'garden', 'monument'], emoji: ['🗿'],
    tint: 'red',
    about: 'A painted garden gnome statue on a stone plinth. Tint is the pointed hat.',
    examine: [
      'A stout stone gnome standing on a square plinth with a white beard and a tall pointed hat.',
      'Old saying: "A statue is just a gnome who waited too long for the kettle to boil."',
      'Gnomes tip their hats to it when passing, just in case it is only pretending to be stone.',
      'The plinth is weathered by rain, though the hat paint stays stubbornly bright.',
      'Someone has tucked a single clover leaf under its boot.',
    ],
    parts: [
      { s: 'box', d: [0.34, 0.12, 0.34], at: [0, 0.06, 0], c: 'stone-dark' },
      { s: 'cyl', d: [0.1, 0.13, 0.34], at: [0, 0.29, 0], c: 'blue', seg: 10 },
      { s: 'ball', d: [0.095], at: [0, 0.53, 0], c: 'sand', seg: 10 },
      { s: 'cone', d: [0.075, 0.16], at: [0, 0.43, 0.055], rot: [170, 0, 0], c: 'white', seg: 8 },
      { s: 'cone', d: [0.11, 0.28], at: [0, 0.72, 0], c: 'tint', seg: 10 },
    ],
  },
  {
    id: 'birdbath', name: 'Birdbath', category: 'prop', uses: ['place'],
    tags: ['birdbath', 'bath', 'stone', 'basin', 'water', 'fountain'], emoji: [],
    about: 'A carved stone pedestal supporting a shallow water-filled basin.',
    examine: [
      'A fluted stone pedestal topped with a wide, shallow basin brimming with rainwater.',
      'To a gnome, a birdbath is a watchtower, a swimming pool, and a border fort all at once.',
      'The rim is wide enough to walk around if your boots are dry and your nerve holds.',
      'Sparrows argue over it at dawn; gnomes argue near it at noon.',
      'Moss clings to the foot of the column where the sprinklers reach.',
    ],
    parts: [
      { s: 'cyl', d: [0.22, 0.26, 0.08], at: [0, 0.04, 0], c: 'stone-dark', seg: 10 },
      { s: 'cyl', d: [0.09, 0.12, 0.52], at: [0, 0.34, 0], c: 'stone', seg: 10 },
      { s: 'cyl', d: [0.38, 0.16, 0.14], at: [0, 0.67, 0], c: 'stone', seg: 12 },
      { s: 'cyl', d: [0.33, 0.33, 0.02], at: [0, 0.735, 0], c: 'water', seg: 12 },
    ],
  },
  {
    id: 'gravestone', name: 'Gravestone', category: 'prop', uses: ['place'],
    tags: ['grave', 'gravestone', 'tombstone', 'headstone', 'stone', 'memorial'], emoji: ['🪦'],
    about: 'A weathered grey headstone set into a low stone base.',
    examine: [
      'A weathered grey headstone with a rounded top, tilted slightly in its stone base.',
      'The letters are worn too smooth to read, though gnomes still bring fresh dandelions.',
      'Old saying: "Do not whistle past the stones after dusk, or the moss will answer."',
      'A patch of pale lichen grows across the face like a map of nowhere.',
      'It is sturdy enough to lean a spade against, though polite gnomes never do.',
    ],
    parts: [
      { s: 'box', d: [0.38, 0.08, 0.22], at: [0, 0.04, 0], c: 'stone-dark' },
      { s: 'box', d: [0.28, 0.36, 0.1], at: [0, 0.26, 0], c: 'stone' },
      { s: 'cyl', d: [0.14, 0.14, 0.1], at: [0, 0.44, 0], rot: [90, 0, 0], c: 'stone', seg: 10 },
    ],
  },
  {
    id: 'lawn-sprinkler', name: 'Lawn Sprinkler', category: 'prop', uses: ['place'],
    tags: ['sprinkler', 'water', 'irrigation', 'hose', 'spinner'], emoji: [],
    tint: 'green',
    about: 'A metal lawn sprinkler on a round base with spinning brass spray arms. Tint is the base.',
    examine: [
      'A heavy painted base with an upright brass neck and two bent spray arms that spin in the sun.',
      'When the spigot turns, it hisses like a goose and flings cold rain in a tidy circle.',
      'Gnomes time their sprints between the sweeps; getting soaked is poor form.',
      'The brass nozzles whistle a single high note just before the pressure drops.',
      'Left on the clover, it turns an ordinary afternoon into a Rain-school festival.',
    ],
    parts: [
      { s: 'cyl', d: [0.16, 0.18, 0.05], at: [0, 0.025, 0], c: 'tint', seg: 10 },
      { s: 'cyl', d: [0.035, 0.04, 0.14], at: [0, 0.12, 0], c: 'brass', seg: 8 },
      { s: 'cyl', d: [0.045, 0.045, 0.05], at: [0, 0.21, 0], c: 'brass', seg: 8 },
      { s: 'box', d: [0.34, 0.022, 0.022], at: [0, 0.21, 0], c: 'steel' },
      { s: 'cyl', d: [0.015, 0.015, 0.04], at: [0.16, 0.23, 0], c: 'brass', seg: 6, mirror: true },
    ],
  },
  {
    id: 'disc-golf-basket', name: 'Disc Golf Basket', category: 'prop', uses: ['place'],
    tags: ['basket', 'disc', 'golf', 'chains', 'target', 'hole', 'pole'], emoji: [],
    about: 'A disc golf target: pole, slatted tray, yellow band and a skirt of 18 chains in a part named "chains" (sway it for a hit). 1.75 tall.',
    examine: [
      'A tall pole with a slatted tray at its waist and a skirt of chains hanging from a bright yellow band.',
      'The chains catch a flying disc and let it fall into the tray. Gnomes call it the Catching Bell, though it never rings.',
      'Throw at the chains, not the pole. The pole has never once been grateful.',
      'It is said a disc that lands inside is a disc that was always meant to.',
      'Small birds nest in the tray when nobody is looking. Nobody is always looking.',
    ],
    parts: [
      { s: 'cyl', d: [0.045, 0.045, 1.75], at: [0, 0.875, 0], c: 'steel', seg: 10 },
      { s: 'cyl', d: [0.62, 0.62, 0.04], at: [0, 0.43, 0], c: 'steel', seg: 24 },
      { s: 'ring', d: [0.68, 0.025], at: [0, 0.7, 0], rot: [90, 0, 0], c: 'steel', seg: 24 },
      { s: 'ring', d: [0.62, 0.05], at: [0, 1.65, 0], rot: [90, 0, 0], c: 'yellow', seg: 28 },
      ...BASKET_SLATS,
      ...BASKET_CHAINS,
    ],
  },
  {
    id: 'tennis-ball', name: 'Tennis Ball', category: 'prop', uses: ['collect', 'throw'],
    tags: ['tennis', 'ball', 'fuzz', 'felt', 'toy', 'dog'], emoji: ['🎾'],
    about: 'A fuzzy yellow-green ball with a white seam. Gnome-sized, so it is nearly a boulder.',
    examine: [
      'A round, fuzzy, yellow-green boulder with a curved white seam that runs all the way around.',
      'Old saying: a thing that bounces is a thing that has opinions.',
      'It does not roll straight. Push it uphill and it will argue with you about it.',
      'Gnomes use them as pillows in the Verge. The dog thinks this is theft.',
      'There are chew marks in it that look like a tiny, very determined smile.',
    ],
    parts: [
      { s: 'ball', d: [0.07], at: [0, 0.07, 0], c: 0xc8e63a, seg: 10 },
      { s: 'ring', d: [0.072, 0.007], at: [0, 0.07, 0], rot: [0, 90, 0], c: 'white', seg: 12 },
    ],
  },
  {
    id: 'cursed-toaster', name: 'Cursed Toaster', category: 'prop', uses: ['collect'],
    tags: ['toaster', 'cursed', 'bread', 'kitchen', 'junk', 'slot'], emoji: ['🍞'],
    about: 'A chrome slab with two slots, a black lever and two small glowing red eyes. Always a bit warm.',
    examine: [
      'A silver slab with two slots in the top, a black lever on the side and two red glints at the front.',
      'It is always warm, even in the Shed, even in winter, even when nobody has plugged it into anything.',
      'Do not put bread in it. Do not put anything in it. Do not stand in front of it.',
      'Numbers are scratched into its base. Gnomes counted: all of them are sixes.',
      'It pops, now and then, with nothing in it. It sounds pleased.',
    ],
    parts: [
      { s: 'box', d: [0.2, 0.14, 0.12], at: [0, 0.07, 0], c: 'silver' },
      { s: 'box', d: [0.07, 0.012, 0.09], at: [-0.045, 0.141, 0], c: 'iron-dark' },
      { s: 'box', d: [0.07, 0.012, 0.09], at: [0.045, 0.141, 0], c: 'iron-dark' },
      { s: 'box', d: [0.03, 0.025, 0.02], at: [0.11, 0.1, 0], c: 'black' },
      { s: 'ball', d: [0.012], at: [0.03, 0.1, 0.062], c: 'ruby', glow: true, mirror: true },
    ],
  },
  {
    id: 'porcelain-cat', name: 'Porcelain Cat', category: 'prop', uses: ['place', 'collect'],
    tags: ['cat', 'porcelain', 'china', 'figurine', 'ornament', 'mantel'], emoji: ['🐱'],
    tint: 'white',
    about: 'A seated glazed cat figurine with pricked ears and a curled tail. Tint is the glaze (default white).',
    examine: [
      'A sleek seated cat, glazed and cold, with two pricked ears and a tail curled round its feet.',
      'Its painted eyes follow you if you walk past slowly. Walk past quickly and they follow you anyway.',
      'Gnome law: never leave a cat on a shelf facing a door.',
      'Whiskers painted on in blue. One of them is chipped. The chip is shaped like a bite.',
      'It is the only cat in Mossbottom that has never once knocked something off a table. Yet.',
    ],
    parts: [
      { s: 'cyl', d: [0.045, 0.06, 0.12], at: [0, 0.06, 0], c: 'tint', seg: 10 },
      { s: 'ball', d: [0.05], at: [0, 0.15, 0.01], c: 'tint', seg: 10 },
      { s: 'cone', d: [0.018, 0.04], at: [0.028, 0.2, 0.01], c: 'tint', seg: 4, mirror: true },
      { s: 'ball', d: [0.008], at: [0.018, 0.155, 0.055], c: 'glaze-blue', seg: 6, mirror: true },
      { s: 'pill', d: [0.014, 0.1], at: [0.06, 0.06, 0.04], rot: [90, 0, 0], c: 'tint', seg: 6 },
    ],
  },
  {
    id: 'grandpa-dentures', name: 'Grandpa Dentures', category: 'prop', uses: ['collect'],
    tags: ['dentures', 'teeth', 'false', 'grandpa', 'mouth', 'gums'], emoji: ['🦷'],
    about: 'A horseshoe of pink gum with a row of white teeth, lying flat on the ground.',
    examine: [
      'A pink horseshoe of gum with a neat row of white teeth set along the top.',
      "Nobody in the Rockery can say whose they were. Everybody agrees they were grandfather's.",
      'Tip: do not leave them near the water bowl. They have been seen to chatter at night.',
      'The teeth are too many and too even for a gnome, and a little too eager.',
      'They click, very softly, when no one is holding them.',
    ],
    parts: [
      { s: 'ring', d: [0.07, 0.022, 240], at: [0, 0.022, 0], rot: [90, 0, 0], c: 'pink', seg: 10 },
      { s: 'ring', d: [0.07, 0.012, 240], at: [0, 0.052, 0], rot: [90, 0, 0], c: 'white', seg: 12 },
    ],
  },
  {
    id: 'golden-remote', name: 'Golden Remote', category: 'prop', uses: ['collect'],
    tags: ['remote', 'golden', 'buttons', 'clicker', 'control', 'junk'], emoji: ['📺'],
    about: 'A gold slab of a clicker with a grid of red buttons and a black eye at the front end.',
    examine: [
      'A long flat slab of gold, with rows of small red buttons and a black eye at one end.',
      'The buttons are marked with signs nobody in the Charters can read. Pressing them does nothing. So far.',
      'Gnome sense: a shiny thing with no purpose is the one worth keeping close.',
      'It is the shape of an ancient wand, if the wand were bored.',
      'Far off, on a still night, something clicks back.',
    ],
    parts: [
      { s: 'box', d: [0.06, 0.02, 0.2], at: [0, 0.01, 0], c: 'gold' },
      { s: 'ball', d: [0.011], at: [-0.015, 0.02, -0.02], c: 'red', seg: 6, mirror: true },
      { s: 'ball', d: [0.011], at: [-0.015, 0.02, -0.055], c: 'red', seg: 6, mirror: true },
      { s: 'ball', d: [0.011], at: [-0.015, 0.02, 0.015], c: 'red', seg: 6, mirror: true },
      { s: 'box', d: [0.03, 0.006, 0.012], at: [0, 0.021, 0.095], c: 'black' },
    ],
  },
  {
    id: 'brick-stack', name: 'Brick Stack', category: 'prop', uses: ['place'],
    tags: ['brick', 'bricks', 'stack', 'wall', 'clay', 'edging'], emoji: [],
    about: 'Three clay-red bricks stacked, the middle one turned a little. A low edging for a bed.',
    examine: [
      'Three clay bricks stacked one on another, the middle one turned a little, as if it had heard something.',
      'Gnome saying: "A wall is only a stack that has been told to stay."',
      'Use the top brick first. The bottom brick is for the things that come up through the soil.',
      'Every brick is fired in the Kiln, and every brick keeps a faint thumbprint of the one who made it.',
      'Gnome joke: three bricks make a wall for a gnome and a doorstep for anyone taller.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.085, 0.15], at: [0, 0.0425, 0], c: 0xa0522d },
      { s: 'box', d: [0.3, 0.085, 0.15], at: [0, 0.1275, 0], rot: [0, 15, 0], c: 0xa0522d },
      { s: 'box', d: [0.3, 0.085, 0.15], at: [0, 0.2125, 0], c: 0xa0522d },
    ],
  },
  {
    id: 'flowering-bush', name: 'Flowering Bush', category: 'prop', uses: ['place'],
    tags: ['bush', 'shrub', 'flower', 'flowering', 'hedge', 'green'], emoji: [],
    about: 'A round green bush of five overlapping balls, with pink and white flowers on top.',
    examine: [
      'A round green bush, bunched like a fistful of cabbages, with pink and white flowers dotted over the top.',
      'Old rhyme: "Bloom in the spring and bloom in the rain, the bush will bloom whether you like it or no."',
      'Sit on the bush and it sighs. Do not sit on it twice in one day, or the flowers will complain.',
      'The white flowers are for the bees. The pink ones are for the gnomes who like to be noticed.',
      'A bird built a nest in here once. The bird has long gone. The nest still gives the bush a little pride.',
    ],
    parts: [
      { s: 'ball', d: [0.3], at: [0, 0.24, 0], scale: [1.3, 0.8, 1.2], c: 0x2e6b2e, seg: 10 },
      { s: 'ball', d: [0.22], at: [0.25, 0.22, 0.1], c: 0x3d8f3d, seg: 8 },
      { s: 'ball', d: [0.2], at: [-0.3, 0.2, -0.05], c: 0x3d8f3d, seg: 8 },
      { s: 'ball', d: [0.2], at: [0.05, 0.2, -0.25], c: 0x2e6b2e, seg: 8 },
      { s: 'ball', d: [0.18], at: [-0.1, 0.18, 0.25], c: 0x2e6b2e, seg: 8 },
      { s: 'ball', d: [0.05], at: [0.195, 0.41, 0.18], c: 0xff7eb6, seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.23, 0.38, 0.18], c: 'white', seg: 6 },
      { s: 'ball', d: [0.05], at: [0, 0.41, -0.25], c: 0xff7eb6, seg: 6 },
      { s: 'ball', d: [0.05], at: [0.23, 0.36, -0.22], c: 'white', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.2, 0.36, -0.25], c: 0xff7eb6, seg: 6 },
    ],
  },
  {
    id: 'giant-flower', name: 'Giant Flower', category: 'prop', uses: ['place'],
    tags: ['flower', 'giant', 'tall', 'bloom', 'stem', 'petal', 'sunflower'], emoji: [],
    tint: 'pink',
    about: 'A tall flower on a green stem, two leaves, eight petals round a yellow middle. Tint is the petal colour (default pink).',
    examine: [
      'A green stem taller than three gnomes, two broad leaves, and a bloom of eight petals round a yellow middle.',
      'Gnome saying: "A bloom that turns to the sun is the only bloom that will turn to you."',
      'Tip: plant them by the wall. They grow toward the light, and so should you.',
      'Each morning it has turned a little further toward the Shed. Nobody has asked why.',
      'The petals smell of toffee and old rain. Bees swear by it. Snails have opinions.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.025, 1.0], at: [0, 0.5, 0], c: 'leaf-dark', seg: 6 },
      { s: 'ball', d: [0.13], at: [0.12, 0.45, 0], rot: [0, 0, -15], scale: [1.5, 0.1, 0.7], c: 'leaf', mirror: true, seg: 6 },
      { s: 'ball', d: [0.06], at: [0, 1.1, 0], c: 'yellow', seg: 8 },
      // Eight petals at 45 degree steps. Each points outward (its long z axis turned to the angle) and the +z side droops a little.
      { s: 'ball', d: [0.1], at: [0.2, 1.1, 0], rot: [0, 90, 0], scale: [0.6, 0.25, 1.2], c: 'tint', seg: 8 },
      { s: 'ball', d: [0.1], at: [0.1414, 1.0646, 0.1414], rot: [0, 45, 0], scale: [0.6, 0.25, 1.2], c: 'tint', seg: 8 },
      { s: 'ball', d: [0.1], at: [0, 1.05, 0.2], rot: [0, 0, 0], scale: [0.6, 0.25, 1.2], c: 'tint', seg: 8 },
      { s: 'ball', d: [0.1], at: [-0.1414, 1.0646, 0.1414], rot: [0, -45, 0], scale: [0.6, 0.25, 1.2], c: 'tint', seg: 8 },
      { s: 'ball', d: [0.1], at: [-0.2, 1.1, 0], rot: [0, -90, 0], scale: [0.6, 0.25, 1.2], c: 'tint', seg: 8 },
      { s: 'ball', d: [0.1], at: [-0.1414, 1.1354, -0.1414], rot: [0, -135, 0], scale: [0.6, 0.25, 1.2], c: 'tint', seg: 8 },
      { s: 'ball', d: [0.1], at: [0, 1.15, -0.2], rot: [0, 180, 0], scale: [0.6, 0.25, 1.2], c: 'tint', seg: 8 },
      { s: 'ball', d: [0.1], at: [0.1414, 1.1354, -0.1414], rot: [0, 135, 0], scale: [0.6, 0.25, 1.2], c: 'tint', seg: 8 },
    ],
  },
  {
    id: 'saguaro', name: 'Saguaro', category: 'prop', uses: ['place'],
    tags: ['cactus', 'saguaro', 'desert', 'tall', 'spines', 'arms'], emoji: [],
    about: 'A tall ribbed green cactus with two arms and a few pale spines, about 1.5 tall.',
    examine: [
      'A tall ribbed cactus with two arms, the upper one bent as if waving at someone very far away.',
      'Gnome rhyme: "Count the arms and count the ribs, and you will know which way the sun is by the spines."',
      'Do not hug it. Gnomes have tried. The spines do not care that you meant well.',
      'It drinks once a year and talks about it for the rest of the year.',
      'The spines are the colour of old teeth. Nobody in the Rockery will say where they came from.',
    ],
    parts: [
      { s: 'cyl', d: [0.09, 0.1, 1.4], at: [0, 0.7, 0], c: 0x4f8f4a, seg: 8 },
      { s: 'ball', d: [0.09], at: [0, 1.4, 0], c: 0x4f8f4a, seg: 8 },
      { s: 'box', d: [0.025, 1.2, 0.025], at: [0.093, 0.7, 0], c: 0x3f7a3d },
      { s: 'box', d: [0.025, 1.2, 0.025], at: [-0.093, 0.7, 0], c: 0x3f7a3d },
      { s: 'box', d: [0.025, 1.2, 0.025], at: [0, 0.7, 0.093], c: 0x3f7a3d },
      { s: 'box', d: [0.025, 1.2, 0.025], at: [0, 0.7, -0.093], c: 0x3f7a3d },
      { s: 'cyl', d: [0.05, 0.05, 0.25], at: [0.2, 0.75, 0], rot: [0, 0, 90], c: 0x4f8f4a, seg: 8 },
      { s: 'ball', d: [0.05], at: [0.325, 0.75, 0], c: 0x4f8f4a, seg: 8 },
      { s: 'cyl', d: [0.05, 0.05, 0.36], at: [0.325, 0.93, 0], c: 0x4f8f4a, seg: 8 },
      { s: 'ball', d: [0.05], at: [0.325, 1.11, 0], c: 0x4f8f4a, seg: 8 },
      { s: 'cyl', d: [0.05, 0.05, 0.25], at: [-0.2, 0.5, 0], rot: [0, 0, 90], c: 0x4f8f4a, seg: 8 },
      { s: 'ball', d: [0.05], at: [-0.325, 0.5, 0], c: 0x4f8f4a, seg: 8 },
      { s: 'cyl', d: [0.05, 0.05, 0.36], at: [-0.325, 0.68, 0], c: 0x4f8f4a, seg: 8 },
      { s: 'ball', d: [0.05], at: [-0.325, 0.86, 0], c: 0x4f8f4a, seg: 8 },
      { s: 'cone', d: [0.012, 0.05], at: [0.11, 0.3, 0], rot: [0, 0, -90], c: 'bone', seg: 4 },
      { s: 'cone', d: [0.012, 0.05], at: [-0.11, 0.25, 0], rot: [0, 0, 90], c: 'bone', seg: 4 },
      { s: 'cone', d: [0.012, 0.05], at: [0, 0.55, 0.11], rot: [90, 0, 0], c: 'bone', seg: 4 },
      { s: 'cone', d: [0.012, 0.05], at: [0, 0.95, -0.11], rot: [-90, 0, 0], c: 'bone', seg: 4 },
    ],
  },
  {
    id: 'barrel-cactus', name: 'Barrel Cactus', category: 'prop', uses: ['place'],
    tags: ['cactus', 'barrel', 'desert', 'round', 'flower', 'squat'], emoji: [],
    about: 'A squat ribbed green cactus, wider than it is tall, with four small flowers on top.',
    examine: [
      'A squat, ribbed ball of green with four small yellow and pink flowers crowning the top.',
      'Old saying: "Round is the shape that rolls away from trouble."',
      'Good for a seat if you have nowhere else. Good for a fight if you have no seat. Good for neither if you are a gnome.',
      'It sits very still. Once a summer it opens all four flowers at once, and the whole Verge comes to look.',
      'Its ribs are good for counting. Gnomes have counted to thirty-two, then given up and had a sit down.',
    ],
    parts: [
      { s: 'ball', d: [0.2], at: [0, 0.16, 0], scale: [1, 0.8, 1], c: 0x4f8f4a, seg: 12 },
      { s: 'cyl', d: [0.02, 0.02, 0.14], at: [0.19, 0.16, 0], c: 0x3f7a3d, seg: 4 },
      { s: 'cyl', d: [0.02, 0.02, 0.14], at: [0.1344, 0.16, 0.1344], c: 0x3f7a3d, seg: 4 },
      { s: 'cyl', d: [0.02, 0.02, 0.14], at: [0, 0.16, 0.19], c: 0x3f7a3d, seg: 4 },
      { s: 'cyl', d: [0.02, 0.02, 0.14], at: [-0.1344, 0.16, 0.1344], c: 0x3f7a3d, seg: 4 },
      { s: 'cyl', d: [0.02, 0.02, 0.14], at: [-0.19, 0.16, 0], c: 0x3f7a3d, seg: 4 },
      { s: 'cyl', d: [0.02, 0.02, 0.14], at: [-0.1344, 0.16, -0.1344], c: 0x3f7a3d, seg: 4 },
      { s: 'cyl', d: [0.02, 0.02, 0.14], at: [0, 0.16, -0.19], c: 0x3f7a3d, seg: 4 },
      { s: 'cyl', d: [0.02, 0.02, 0.14], at: [0.1344, 0.16, -0.1344], c: 0x3f7a3d, seg: 4 },
      { s: 'ball', d: [0.03], at: [0.08, 0.317, 0], c: 'yellow', seg: 6 },
      { s: 'ball', d: [0.03], at: [0, 0.317, 0.08], c: 'pink', seg: 6 },
      { s: 'ball', d: [0.03], at: [-0.08, 0.317, 0], c: 'yellow', seg: 6 },
      { s: 'ball', d: [0.03], at: [0, 0.317, -0.08], c: 'pink', seg: 6 },
    ],
  },
  {
    id: 'tumbleweed', name: 'Tumbleweed', category: 'prop', uses: ['place'],
    tags: ['tumbleweed', 'twigs', 'desert', 'ball', 'weed', 'dry', 'brown'], emoji: [],
    about: 'A loose ball of dry brown twigs, about half a unit across. Fixed layout, no randomness.',
    examine: [
      'A loose ball of dry brown twigs, bound by nothing but habit, sitting on the spot as if it is thinking.',
      'Gnome saying: "What rolls, rolls on. Nothing stays but the stone and the stubborn."',
      'Keep your eyes on it. A tumbleweed that has stopped moving is usually about to start again.',
      'Gnome law: do not chase a tumbleweed. Let it come to you, then wish you had chased it.',
      'Caught inside one: three buttons, a teaspoon, and a letter that begins "Dear Gnome" and then stops.',
    ],
    parts: TUMBLEWEED_RINGS,
  },
];
