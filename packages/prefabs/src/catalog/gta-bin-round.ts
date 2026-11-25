// Gnome Theft Auto E25 jobs III: the bin round (garbage job): wheelie bins, bags, litter, the Turfton Bin Depot and the bin-crew rewards.
// Plan: docs/roadmaps/gta-batch-3/E25/roadmap.md. Rules: docs/roadmaps/prefab-library/_common.md.
import type { Part, PrefabDef } from '../types';

// The green, black, blue and brown bins of the depot row.
const BIN_GREEN = 0x3f7a3a;
const BIN_BLACK = 0x2b2b2b;
const BIN_BLUE = 0x2f5fa0;
const BIN_BROWN = 0x6b4a2e;

// One wheelie bin: 0.55 wide, 0.5 deep, 0.9 tall, its front on +z, two wheels at the back.
// `lidGroup` puts the lid parts in a pivot group (the wheelie bin's hinged lid); the row bins keep a fixed lid.
function binParts(c: Part['c'], x: number, z: number, lidGroup?: string): Part[] {
  return [
    { s: 'box', d: [0.55, 0.79, 0.5], at: [x, 0.505, z], c },
    { s: 'box', d: [0.56, 0.03, 0.5], at: [x, 0.92, z], c, ...(lidGroup ? { group: lidGroup } : {}) },
    { s: 'box', d: [0.4, 0.04, 0.03], at: [x, 0.85, z - 0.27], c: 'black' },
    { s: 'cyl', d: [0.05, 0.05, 0.04], at: [x - 0.2, 0.05, z - 0.2], rot: [0, 0, 90], c: 'black', seg: 8 },
    { s: 'cyl', d: [0.05, 0.05, 0.04], at: [x + 0.2, 0.05, z - 0.2], rot: [0, 0, 90], c: 'black', seg: 8 },
  ];
}

// A bin bag: a squashed black ball with a knot, about 0.4 m tall.
const BAG: readonly Part[] = [
  { s: 'ball', d: [0.18], scale: [1, 1.1, 0.9], at: [0, 0.198, 0], c: 'black', seg: 8 },
  { s: 'ball', d: [0.04], at: [0, 0.4, 0], c: 'black', seg: 6 },
];

export const GTA_BIN_ROUND: readonly PrefabDef[] = [
  // ---- the bin and its litter ----
  {
    id: 'gta-wheelie-bin', name: 'Wheelie Bin', category: 'container', uses: ['place', 'open'],
    tags: ['bin', 'wheelie', 'wheely', 'dustbin', 'garbage', 'rubbish', 'trash', 'lid', 'green', 'gta'], emoji: ['🗑'],
    tint: 0x3f7a3a, pivots: { lid: [0, 0.9, -0.25] },
    about: 'Gnome Theft Auto: a wheelie bin on two back wheels with a hinged lid and a handle bar. The body tints green, black, blue or brown.',
    examine: [
      'A wheelie bin on two fat back wheels, its lid hinged at the back and a handle bar across the top, smelling of a long week.',
      'Bin Day saying: the bins go out on Bin Day and come back in by teatime, and a bin left out is a bin asking to be noticed.',
      'Tip: open the lid from the back, because the front is where the Hat Watch like to stand and the lid is heavier than it looks.',
      'Joke: the wheels have only ever gone in one direction, which the depot calls a commitment to the route.',
      'Stuck to the lid is a sticker from the Turfton Bin Depot, which says Mags Wheelie is watching, in a font that is watching too.',
    ],
    parts: binParts('tint', 0, 0, 'lid'),
  },
  {
    id: 'bin-bag', name: 'Bin Bag', category: 'prop', uses: ['place'],
    tags: ['bag', 'bin', 'bags', 'black', 'knot', 'rubbish', 'garbage', 'litter', 'trash', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a knotted black bin bag about 0.4 m tall, with a tight knot on top.',
    examine: [
      'A black bin bag swollen with whatever the gnomes of Turfton could not face keeping, tied off at the top in a tight knot.',
      'Bin saying: a bag that is knotted is a bag that is finished, and a bag that is not knotted is a bag with a story to tell.',
      'Tip: lift it by the knot, because the bottom has been known to give way in the hands of a gnome who was feeling confident.',
      'Joke: the knot has been tied so many times it has its own small reputation in the Verge and a letter from the HOA.',
      'Someone has written on the side in marker: NOT MINE, and the marker has since been written over by a second, more honest hand.',
    ],
    parts: [...BAG],
  },
  {
    id: 'bin-bag-pile', name: 'Heap of Bin Bags', category: 'prop', uses: ['place'],
    tags: ['bags', 'pile', 'heap', 'rubbish', 'garbage', 'litter', 'bin', 'trash', 'black', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: five black bin bags heaped in a pile about 1 m across, for the kerb on Bin Day.',
    examine: [
      'Five black bin bags heaped on each other in a sagging pile, each one knotted and each one trying to be the one at the top.',
      'Bin saying: a heap of bags is only a heap until someone looks at it, and then it becomes a problem for the Bin Crew.',
      'Tip: count the bags before you lift the pile, because one of them is always sitting on another one that has been waiting.',
      'Joke: the pile has been on the same kerb since the last Bin Day, and the kerb has started to call it a neighbour.',
      'A tag on the top bag reads, in neat letters, not my fault, and the handwriting on the next tag down is identical.',
    ],
    parts: [
      { s: 'ball', d: [0.18], scale: [1, 0.9, 1], at: [0, 0.162, 0], c: 'black', seg: 8 },
      { s: 'ball', d: [0.18], scale: [1, 0.9, 1], at: [-0.3, 0.162, 0.12], c: 'black', seg: 8 },
      { s: 'ball', d: [0.18], scale: [1, 0.9, 1], at: [0.3, 0.162, -0.05], c: 'black', seg: 8 },
      { s: 'ball', d: [0.18], scale: [1, 0.9, 1], at: [-0.12, 0.162, -0.3], c: 'black', seg: 8 },
      { s: 'ball', d: [0.18], scale: [1, 0.9, 1], at: [0.05, 0.4, 0.05], c: 'black', seg: 8 },
    ],
  },
  {
    id: 'bin-litter-scatter', name: 'Litter Scatter', category: 'prop', uses: ['place'],
    tags: ['litter', 'rubbish', 'paper', 'peel', 'can', 'scatter', 'spill', 'trash', 'garbage', 'bin', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a flat 1.4 x 1.0 m spill of paper, peel and crumbs with one crumpled can standing up. The game lays it on a draw layer.',
    examine: [
      'A spill of paper scraps, orange peel and crumbs, all lying flat, with one crumpled can standing up in the middle like a sentry.',
      'Bin saying: litter is only litter once it has left the bin, and it has always left the bin with a very good reason.',
      'Tip: sweep it toward the kerb rather than the drain, because the drain has its own opinions and no sense of humour about them.',
      'Joke: the HOA has fined the wind for this spill three times, and the wind has paid in full with more paper.',
      'The can has a dent shaped like a gnome thumb, and a note stuck to its side that says the thumb was not the one who did it.',
    ],
    parts: [
      { s: 'box', d: [0.14, 0.004, 0.1], at: [-0.4, 0.002, -0.2], rot: [0, 20, 0], c: 'paper' },
      { s: 'box', d: [0.12, 0.004, 0.09], at: [0.1, 0.002, -0.3], rot: [0, -35, 0], c: 'paper' },
      { s: 'box', d: [0.1, 0.004, 0.08], at: [-0.1, 0.002, 0.2], rot: [0, 10, 0], c: 'paper' },
      { s: 'box', d: [0.12, 0.004, 0.1], at: [0.4, 0.002, 0.25], rot: [0, -15, 0], c: 'paper' },
      { s: 'ring', d: [0.07, 0.01], at: [-0.5, 0.01, 0.3], rot: [90, 0, 0], c: 'orange', seg: 8 },
      { s: 'box', d: [0.08, 0.004, 0.06], at: [0.5, 0.002, -0.4], c: 'leaf' },
      { s: 'cyl', d: [0.03, 0.03, 0.11], at: [0.25, 0.055, 0.0], c: 'slate', seg: 8 },
    ],
  },

  // ---- the depot ----
  {
    id: 'bin-depot-shed', name: 'Turfton Bin Depot Shed', category: 'prop', uses: ['place'],
    tags: ['depot', 'shed', 'garage', 'bin', 'corrugated', 'green', 'bay', 'fascia', 'building', 'gta'], emoji: [],
    footprint: { r: 5, h: 4 },
    about: 'Gnome Theft Auto: the Turfton Bin Depot shed, a 10 x 6 x 4 m corrugated green garage with an open bay on +z and a fascia board.',
    examine: [
      'A long green corrugated garage with a wide open bay at the front, a fascia board over it and one small office window at the side.',
      'Depot saying: every bin that leaves the Turfton Bin Depot comes back, and every bin that comes back has a story it will not tell.',
      'Tip: go in through the bay in daylight, because the inside is dark and full of wheelie bins with their lids open for the night.',
      'Joke: the shed was built to hold six lorries, and holds one lorry, four bins and a very large opinion about the Compost Heap.',
      'Scratched into the doorframe is a row of ticks, each one a Bin Day the depot made it out the front gate on time.',
    ],
    parts: [
      { s: 'box', d: [10, 3.5, 6], at: [0, 1.75, 0], c: 0x3f7a3a },
      { s: 'box', d: [10.3, 0.2, 6.3], at: [0, 3.59, 0], c: 'slate' },
      { s: 'box', d: [6, 2.8, 0.05], at: [-1.5, 1.4, 3.01], c: 'iron-dark' },
      { s: 'box', d: [6, 0.5, 0.08], at: [-1.5, 3.15, 3.04], c: 'white' },
      { s: 'box', d: [1.2, 0.8, 0.05], at: [3.5, 2.0, 3.01], c: 'glass' },
    ],
  },
  {
    id: 'bin-depot-office', name: 'Depot Office Cabin', category: 'prop', uses: ['place'],
    tags: ['office', 'cabin', 'portable', 'depot', 'mug', 'door', 'window', 'bin', 'gta'], emoji: [],
    footprint: { r: 1.8, h: 2.6 },
    about: 'Gnome Theft Auto: a 3 x 2.5 x 2.6 m portable depot cabin with a door, a window and a mug on the sill.',
    examine: [
      'A small white portable cabin on blocks, with a door, a window and a sill that has a mug on it going cold.',
      'Depot saying: the office is where the bins are counted, and the count is always one bin higher than the cabin remembers.',
      'Tip: knock before you enter, because the office has a counter, a kettle and a clipboard, and it has very strong feelings about all three.',
      'Joke: the cabin has the only chair in the depot, and it is kept for the person who is about to be told off.',
      'The mug on the sill says MAGS in faded letters, and the mug has never once been seen to be empty.',
    ],
    parts: [
      { s: 'box', d: [3, 2.38, 2.5], at: [0, 1.19, 0], c: 'white' },
      { s: 'box', d: [3.1, 0.2, 2.6], at: [0, 2.45, 0], c: 'slate' },
      { s: 'box', d: [0.8, 1.8, 0.05], at: [-0.8, 0.9, 1.27], c: 'wood-dark' },
      { s: 'box', d: [0.8, 0.6, 0.05], at: [0.8, 1.6, 1.27], c: 'glass' },
      { s: 'box', d: [0.9, 0.04, 0.2], at: [0.8, 1.3, 1.36], c: 'wood-light' },
      { s: 'cyl', d: [0.04, 0.04, 0.09], at: [1.0, 1.365, 1.36], c: 'white', seg: 8 },
    ],
  },
  {
    id: 'bin-wash-rack', name: 'Bin Wash Rack', category: 'prop', uses: ['place'],
    tags: ['rack', 'wash', 'washing', 'drying', 'hose', 'bin', 'depot', 'frame', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a bin-wash rack, a frame about 2.5 m wide with a coiled hose and three upside-down bins drying.',
    examine: [
      'A tall frame with a bar across the top, a coiled green pipe hanging from one post and three bins drying upside down on the rail.',
      'Depot saying: a bin dried upside down will never fill with rain, and a bin that fills with rain is a bin with an attitude.',
      'Tip: turn the bin over before you hang it, because a bin hung the right way up becomes a pond and the pond becomes a complaint.',
      'Joke: the pipe has been sprayed at every bin in the depot, and the bins have never once asked it to stop.',
      'The rail is worn bright in three places where three bins have hung for three hundred Bin Days, which the depot calls a tradition.',
    ],
    parts: [
      { s: 'box', d: [0.05, 1.8, 0.05], at: [-1.2, 0.9, 0], c: 'steel' },
      { s: 'box', d: [0.05, 1.8, 0.05], at: [1.2, 0.9, 0], c: 'steel' },
      { s: 'box', d: [2.5, 0.05, 0.05], at: [0, 1.8, 0], c: 'steel' },
      { s: 'ring', d: [0.14, 0.02], at: [-0.98, 1.0, 0.1], c: 'leaf', seg: 8 },
      { s: 'cyl', d: [0.2, 0.22, 0.5], at: [-0.8, 2.085, 0], c: BIN_GREEN, seg: 8 },
      { s: 'cyl', d: [0.2, 0.22, 0.5], at: [0, 2.085, 0], c: BIN_BLACK, seg: 8 },
      { s: 'cyl', d: [0.2, 0.22, 0.5], at: [0.8, 2.085, 0], c: BIN_BLUE, seg: 8 },
    ],
  },
  {
    id: 'bin-row-depot', name: 'Row of Depot Bins', category: 'prop', uses: ['place'],
    tags: ['bins', 'row', 'wheelie', 'depot', 'green', 'black', 'blue', 'brown', 'line', 'gta'], emoji: [],
    footprint: { r: 2.5, h: 0.9 },
    about: 'Gnome Theft Auto: eight empty wheelie bins in a neat row, about 4.5 m long, coloured green, black, blue and brown.',
    examine: [
      'Eight empty wheelie bins stand in a neat row, each one lined up with the next and each lid shut as tight as a clam.',
      'Depot saying: a row of bins is a promise made to the street, and the depot keeps it every Bin Day without fail.',
      'Tip: take the bins from the end of the row, because the middle ones have been arranged by somebody with a ruler and a grudge.',
      'Joke: the bins come in four colours so that the Hat Watch can tell them apart, and the Hat Watch still cannot tell them apart.',
      'A little chalk arrow on the kerb points at the third bin from the left, with the words not that one underlined twice.',
    ],
    parts: [
      ...binParts(BIN_GREEN, -1.995, 0),
      ...binParts(BIN_BLACK, -1.425, 0),
      ...binParts(BIN_BLUE, -0.855, 0),
      ...binParts(BIN_BROWN, -0.285, 0),
      ...binParts(BIN_GREEN, 0.285, 0),
      ...binParts(BIN_BLACK, 0.855, 0),
      ...binParts(BIN_BLUE, 1.425, 0),
      ...binParts(BIN_BROWN, 1.995, 0),
    ],
  },
  {
    id: 'bin-tipping-ramp', name: 'Tipping Ramp', category: 'prop', uses: ['place'],
    tags: ['ramp', 'tipping', 'concrete', 'kerb', 'stop', 'slope', 'depot', 'bin', 'gta'], emoji: [],
    footprint: { r: 2, h: 0.9 },
    about: 'Gnome Theft Auto: a 4 x 3 m concrete tipping ramp, with a yellow-striped kerb stop at the high end, up to 0.9 m tall.',
    examine: [
      'A broad concrete ramp that rises gently to a yellow kerb with black stripes, so the bins know exactly where to stop and tip.',
      'Depot saying: a bin that is tipped at the ramp is a bin that has done its job, and a bin tipped anywhere else is a bin in trouble.',
      'Tip: approach the ramp slowly, because the concrete is slippery with the day\'s drips and the bins have never once forgiven a fast approach.',
      'Joke: the ramp was built by the depot to save on lifting, and has saved so much lifting that the depot has forgotten what lifting is.',
      'Scratched in the corner of the concrete is a small drawing of a bin with a face, looking very pleased with the stop.',
    ],
    parts: [
      { s: 'wedge', d: [4, 0.9, 3], at: [0, 0.45, 0], c: 'slate' },
      { s: 'box', d: [4, 0.12, 0.2], at: [0, 0.835, 1.3], c: 'yellow' },
      { s: 'box', d: [0.5, 0.122, 0.21], at: [-1.5, 0.835, 1.3], c: 'black' },
      { s: 'box', d: [0.5, 0.122, 0.21], at: [-0.5, 0.835, 1.3], c: 'black' },
      { s: 'box', d: [0.5, 0.122, 0.21], at: [0.5, 0.835, 1.3], c: 'black' },
      { s: 'box', d: [0.5, 0.122, 0.21], at: [1.5, 0.835, 1.3], c: 'black' },
    ],
  },
  {
    id: 'bin-round-board', name: 'Bin Round Board', category: 'furniture', uses: ['place'], mount: 'wall',
    tags: ['board', 'whiteboard', 'bin', 'round', 'street', 'list', 'depot', 'day', 'wall', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a 1.2 x 0.8 m wall whiteboard with street list lines and a red BIN DAY header.',
    examine: [
      'A whiteboard on the depot wall with a red BIN DAY header across the top and a list of streets written underneath in neat marker.',
      'Depot saying: a street that is not on the board is a street that has not been told, and a street that has been told will be ready.',
      'Tip: check the board before you leave, because the list changes on Tuesdays and the Tuesday list has the best streets on it.',
      'Joke: every street on the board has been crossed out at least once, and the crossing out is the only part the depot keeps up to date.',
      'In the bottom corner, in a much smaller hand, someone has written the word please, and nobody has yet admitted to it.',
    ],
    parts: [
      { s: 'box', d: [1.24, 0.84, 0.02], at: [0, 1.3, -0.01], c: 'wood-dark' },
      { s: 'box', d: [1.2, 0.8, 0.02], at: [0, 1.3, 0.015], c: 'paper' },
      { s: 'box', d: [0.6, 0.1, 0.01], at: [0, 1.56, 0.032], c: 'red' },
      { s: 'box', d: [1.0, 0.01, 0.01], at: [0, 1.42, 0.032], c: 'slate' },
      { s: 'box', d: [0.8, 0.01, 0.01], at: [-0.1, 1.33, 0.032], c: 'slate' },
      { s: 'box', d: [0.9, 0.01, 0.01], at: [0, 1.24, 0.032], c: 'slate' },
      { s: 'box', d: [0.6, 0.01, 0.01], at: [-0.2, 1.15, 0.032], c: 'slate' },
    ],
  },
  {
    id: 'lost-property-bin', name: 'Lost Property Bin', category: 'prop', uses: ['place'],
    tags: ['bin', 'lost', 'property', 'overflowing', 'junk', 'shoe', 'hat', 'trophy', 'garbage', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a green bin overflowing with odd things gnomes threw away: a shoe, a hat and a trophy.',
    examine: [
      'A green bin overflowing with odd things: a single leather shoe, a battered hat and a little gold trophy that has seen better days.',
      'Bin saying: what is thrown away is not lost, it is only waiting for someone to notice it, and the bin is very patient about that.',
      'Tip: check the lost property bin before you tip the main one, because the best things in the depot have all been in here first.',
      'Joke: the trophy says Best Bin of the Year on a plate, and the plate has been crossed out and rewritten as Best Lid.',
      'The shoe has no partner, and the hat has no owner, and the depot has kept both in case somebody comes looking for a set.',
    ],
    parts: [
      { s: 'box', d: [0.55, 0.75, 0.5], at: [0, 0.375, 0], c: BIN_GREEN },
      { s: 'box', d: [0.18, 0.1, 0.1], at: [-0.08, 0.79, 0.02], c: 'leather' },
      { s: 'cyl', d: [0.12, 0.14, 0.08], at: [0.12, 0.78, -0.04], c: 'leather-dark', seg: 10 },
      { s: 'cyl', d: [0.06, 0.06, 0.02], at: [-0.14, 0.755, -0.1], c: 'brass', seg: 8 },
      { s: 'cyl', d: [0.04, 0.02, 0.07], at: [-0.14, 0.8, -0.1], c: 'gold', seg: 8 },
    ],
  },

  // ---- the bin-crew rewards (wearables) ----
  {
    id: 'bin-crew-cap', name: 'Bin Crew Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'hat', 'hi-vis', 'hivis', 'yellow', 'bin', 'crew', 'badge', 'peak', 'head', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Bin Crew Cap, a hi-vis yellow baseball cap with a green bin badge. Reward for the Bin Day achievement.',
    examine: [
      'A bright yellow baseball cap you can see from three streets off, with a green bin badge stitched on the front and a stiff little peak.',
      'Crew saying: the cap goes on before the bins come out, and the bins come out before anybody is ready for them.',
      'Tip: wear it on the street, not in the depot, because the depot has no need to be seen and the street has every reason to look.',
      'Joke: the cap is so bright that the Hat Watch have asked for a second one, which the crew has refused on grounds of visibility.',
      'Inside the band, in tiny print: Bin Day is sacred, and below it a tick for every Tuesday the cap has been worn without a complaint.',
    ],
    parts: [
      { s: 'cyl', d: [0.11, 0.12, 0.1], at: [0, 0.05, 0], c: 'yellow', seg: 10 },
      { s: 'box', d: [0.22, 0.012, 0.1], at: [0, 0.02, 0.11], c: 'yellow' },
      { s: 'ring', d: [0.115, 0.008], at: [0, 0.03, 0], rot: [90, 0, 0], c: 'leaf', seg: 12 },
      { s: 'box', d: [0.06, 0.05, 0.01], at: [0, 0.07, 0.125], c: 'leaf-dark' },
    ],
  },
  {
    id: 'golden-bin-lid', name: 'Golden Bin Lid', category: 'shield', uses: ['hold', 'block'], grip: [0, 0.11, 0],
    wear: { rot: [90, 0, 0] },
    tags: ['lid', 'bin', 'gold', 'golden', 'shield', 'tray', 'hand', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Golden Bin Lid, a small gold wheelie-bin lid held up like a shield on a short handle. Reward for the Not a Drop achievement.',
    examine: [
      'A small disc of gold shaped like a wheelie-bin lid, held up on a short iron handle with a gold knob in the middle of its face.',
      'Lid saying: a lid that closes well keeps the rain out, and a lid that is gold keeps the rain out with style.',
      'Tip: hold it by the handle and never by the rim, because the rim is sharp and the gold has never once been polished for a bruise.',
      'Joke: the lid is the only thing at the depot that has never been emptied, which the crew say is because it is too shiny to put anything in.',
      'Engraved on the back is Not a Drop, and under it, scratched by a smaller hand, a plea to leave the tap running for the next gnome.',
    ],
    parts: [
      { s: 'cyl', d: [0.012, 0.012, 0.22], at: [0, 0.11, 0], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.12, 0.12, 0.015], at: [0, 0.3, 0], rot: [90, 0, 0], c: 'gold', seg: 12 },
      { s: 'ball', d: [0.02], at: [0, 0.3, 0.012], c: 'gold', seg: 6 },
    ],
  },
  {
    id: 'bin-bag-backpack', name: 'Bin-Bag Backpack', category: 'armor', uses: ['wear-back'],
    tags: ['backpack', 'bag', 'bin', 'pack', 'strap', 'straps', 'black', 'yellow', 'back', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Bin-Bag Backpack, a black bin bag tied up as a backpack with yellow straps. Reward for the Kerb Appeal achievement.',
    examine: [
      'A black bin bag tied at the top with a knot the size of a fist, worn on the back with two yellow straps that pull tight at the chest.',
      'Crew saying: a bag on the back is a bag on the way, and a bag tied tight is a bag that will not spill its contents on the street.',
      'Tip: tie the knot twice before you set off, because one knot is a suggestion and the second is a promise to the kerb.',
      'Joke: the bag holds more than any gnome in the Verge would believe, and the crew have stopped asking what is in the bottom.',
      'A yellow tag on one strap reads kerb appeal, and below it, in the same ink, a note that says the bag is the appeal.',
    ],
    parts: [
      { s: 'ball', d: [0.12], scale: [1, 1.3, 0.6], at: [0, 0.17, 0], c: 'black', seg: 8 },
      { s: 'ball', d: [0.03], at: [0, 0.33, 0], c: 'black', seg: 6 },
      { s: 'box', d: [0.02, 0.22, 0.02], at: [-0.06, 0.17, 0.08], c: 'yellow', mirror: true },
    ],
  },
];
