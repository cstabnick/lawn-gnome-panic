// Gnome Theft Auto: the Unmown's trail furniture and marsh plants (E31): waymarkers, fingerposts, rules boards, panels, reeds.
// Rules: docs/roadmaps/prefab-library/_common.md. Life-size metres, front on +z.
import type { PrefabDef } from '../types';

export const GTA_PRESERVE_TRAIL: readonly PrefabDef[] = [
  {
    id: 'trail-waymarker', name: 'Trail Waymarker', category: 'prop', uses: ['place'],
    tags: ['waymarker', 'marker', 'post', 'trail', 'arrow', 'band', 'wood', 'unmown', 'gta', 'preserve'], emoji: [],
    tint: 'leaf',
    footprint: { r: 0.1, h: 1.1 },
    about: 'Gnome Theft Auto: a squat wooden trail waymarker in the Unmown, 1.1 m tall, 0.15 m square. A green band (tint, meadow green by default) near the top and a carved arrow on the front.',
    examine: [
      'A squat wooden post with a green band near the top and a small carved arrow on its front, pointing somewhere the gnomes have agreed on.',
      'Saying: follow the green band and you will never be lost, only pleasantly relocated.',
      'Tip: the arrow points the way the post was facing when it was carved, which may not be the way the path goes now.',
      'Joke: the waymarker is the only sign in the Unmown that has never once been wrong about being green.',
      'Its base is sunk deep in the mud, which is why it has pointed north for three hundred years without moving an inch.',
    ],
    parts: [
      { s: 'box', d: [0.15, 1.1, 0.15], at: [0, 0.55, 0], c: 'wood' },                          // post
      { s: 'box', d: [0.17, 0.1, 0.17], at: [0, 0.95, 0], c: 'tint' },                          // band
      { s: 'box', d: [0.1, 0.03, 0.01], at: [-0.02, 0.6, 0.08], c: 'wood-dark' },               // carved arrow shaft
      { s: 'box', d: [0.06, 0.06, 0.01], at: [0.05, 0.6, 0.08], rot: [0, 0, 45], c: 'wood-dark' }, // arrow head
    ],
  },
  {
    id: 'trail-fingerpost', name: 'Trail Fingerpost', category: 'prop', uses: ['place'],
    tags: ['fingerpost', 'signpost', 'post', 'arms', 'trail', 'board', 'wood', 'unmown', 'gta', 'preserve'], emoji: [],
    footprint: { r: 0.15, h: 2.4 },
    about: 'Gnome Theft Auto: a 2.4 m trail fingerpost in the Unmown. Three blank wooden arms at different heights and angles, pointed ends, and a little cap on top. No text.',
    examine: [
      'A tall post with three blank arms at different heights and angles, each ending in a point, and a little cap on the top.',
      'Saying: a fingerpost with no words on it points equally well at everywhere, which is why the gnomes go in circles.',
      'Tip: read the arms from the bottom up. The highest one is the most confident and the least likely to be right.',
      'Joke: the boards are blank because the gnomes could never agree on the spelling of Mossbottom.',
      'Someone has carved a tiny hole in the cap, and nobody will say whether it was for rain or for a message.',
    ],
    parts: [
      { s: 'box', d: [0.12, 2.4, 0.12], at: [0, 1.2, 0], c: 'wood' },                          // post
      { s: 'box', d: [0.2, 0.06, 0.2], at: [0, 2.42, 0], c: 'wood-dark' },                      // cap
      { s: 'box', d: [0.9, 0.14, 0.03], at: [0.2, 2.0, 0.08], c: 'wood-light' },                // arm, high
      { s: 'cone', d: [0.07, 0.12], at: [0.68, 2.0, 0.08], rot: [0, 0, -90], c: 'wood-light', seg: 4 },
      { s: 'box', d: [0.8, 0.14, 0.03], at: [-0.2, 1.6, 0.08], rot: [0, 0, 6], c: 'wood-light' }, // arm, middle
      { s: 'cone', d: [0.07, 0.12], at: [-0.64, 1.56, 0.08], rot: [0, 0, 90], c: 'wood-light', seg: 4 },
      { s: 'box', d: [0.9, 0.14, 0.03], at: [0.15, 1.2, 0.08], rot: [0, 0, -8], c: 'wood-light' }, // arm, low
      { s: 'cone', d: [0.07, 0.12], at: [0.66, 1.14, 0.08], rot: [0, 0, -90], c: 'wood-light', seg: 4 },
    ],
  },
  {
    id: 'rules-board', name: 'Rules Board', category: 'prop', uses: ['place'],
    tags: ['rules', 'board', 'notice', 'sign', 'roof', 'posts', 'frame', 'wood', 'unmown', 'gta', 'preserve'], emoji: [],
    tint: 'wood-light', trim: 'wood',
    footprint: { r: 0.8, h: 2.25 },
    about: 'Gnome Theft Auto: the Unmown rules board on two posts under a small pitched roof, about 2.25 m total. Board 1.4 x 0.9 m (tint), frame trim (wood). Front face centre at (0, 1.45, 0.05); the game mounts a text plate at z 0.08.',
    examine: [
      'A notice board on two posts under a pitched roof, with a wooden frame and a list of rules in neat, ambitious letters.',
      'Saying: the rules of the Unmown are short, gentle and absurd, and the rangers read them aloud at every bend.',
      'Tip: read the rules before you step off the path. Reading them after is also allowed, but is considered rude.',
      'Joke: the first rule is do not mow, and the second rule is a reminder about the first.',
      'The board is always freshly painted. Nobody has seen the painter, but the paint is still wet in the corners.',
    ],
    parts: [
      { s: 'cyl', d: [0.04, 0.04, 1.9], at: [-0.5, 0.95, -0.03], c: 'trim', seg: 6 },        // posts
      { s: 'cyl', d: [0.04, 0.04, 1.9], at: [0.5, 0.95, -0.03], c: 'trim', seg: 6 },
      { s: 'box', d: [1.4, 0.9, 0.06], at: [0, 1.45, 0.02], c: 'tint' },                       // board, front face at z 0.05
      { s: 'box', d: [1.5, 0.04, 0.08], at: [0, 1.915, 0.02], c: 'trim' },                     // frame top
      { s: 'box', d: [1.5, 0.04, 0.08], at: [0, 0.985, 0.02], c: 'trim' },                     // frame bottom
      { s: 'box', d: [0.04, 0.9, 0.08], at: [-0.74, 1.45, 0.02], c: 'trim' },                  // frame sides
      { s: 'box', d: [0.04, 0.9, 0.08], at: [0.74, 1.45, 0.02], c: 'trim' },
      { s: 'box', d: [1.0, 0.05, 0.9], at: [0.42, 2.05, -0.05], rot: [0, 0, -20], c: 'trim' }, // roof, right slope
      { s: 'box', d: [1.0, 0.05, 0.9], at: [-0.42, 2.05, -0.05], rot: [0, 0, 20], c: 'trim' }, // roof, left slope
    ],
  },
  {
    id: 'interpretive-panel', name: 'Interpretive Panel', category: 'prop', uses: ['place'],
    tags: ['panel', 'interpretive', 'lectern', 'bird', 'board', 'post', 'information', 'wood', 'unmown', 'gta', 'preserve'], emoji: [],
    footprint: { r: 0.5, h: 1.45 },
    about: 'Gnome Theft Auto: a lectern-style interpretive panel in the Unmown, 1.0 x 0.6 m, tilted back 30 degrees at about 1.0 m on one post. A painted bird silhouette and coloured blocks for text.',
    examine: [
      'A sloping lectern panel on a single post, with a painted bird in dark ink and little coloured blocks where the words would go.',
      'Saying: a bird that is painted on a panel will never fly away, which is why the panels are so popular in the Unmown.',
      'Tip: stand a little below the panel, the way a bird would, and the bird becomes easier to see.',
      'Joke: the blocks are coloured instead of lettered, because the rangers ran out of words somewhere around the second blue.',
      'Someone has leaned against the panel for so long that the wood has taken on the shape of a patient gnome.',
    ],
    parts: [
      { s: 'box', d: [0.4, 0.04, 0.3], at: [0, 0.02, 0.05], c: 'wood-dark' },                 // foot
      { s: 'cyl', d: [0.05, 0.05, 1.05], at: [0, 0.525, 0.075], c: 'wood', seg: 8 },           // post
      { s: 'box', d: [1.0, 0.6, 0.04], at: [0, 1.15, 0], rot: [-30, 0, 0], c: 'wood-light' },  // panel, tilted back
      // bird silhouette on the panel face (positions worked out for the -30 degree tilt)
      { s: 'ball', d: [0.09], at: [0, 1.208, 0.001], rot: [-30, 0, 0], scale: [1, 0.7, 0.3], c: 'ink', seg: 8 },
      { s: 'ball', d: [0.04], at: [0.08, 1.252, -0.024], rot: [-30, 0, 0], scale: [1, 1, 0.3], c: 'ink', seg: 8 },
      { s: 'box', d: [0.14, 0.03, 0.01], at: [-0.1, 1.191, 0.011], rot: [-30, 0, 0], c: 'ink' }, // wing
      { s: 'box', d: [0.08, 0.03, 0.01], at: [0.13, 1.113, 0.056], rot: [-30, 0, 0], c: 'ink' }, // tail
      // coloured blocks for text
      { s: 'box', d: [0.4, 0.04, 0.01], at: [-0.3, 1.338, -0.074], rot: [-30, 0, 0], c: 'blue' },
      { s: 'box', d: [0.36, 0.04, 0.01], at: [-0.28, 1.252, -0.024], rot: [-30, 0, 0], c: 'red' },
      { s: 'box', d: [0.4, 0.04, 0.01], at: [-0.3, 1.165, 0.026], rot: [-30, 0, 0], c: 'green' },
      { s: 'box', d: [0.24, 0.04, 0.01], at: [-0.3, 1.078, 0.076], rot: [-30, 0, 0], c: 'yellow' },
    ],
  },
  {
    id: 'log-bench', name: 'Log Bench', category: 'furniture', uses: ['place', 'sit'],
    tags: ['bench', 'log', 'seat', 'stump', 'wood', 'rest', 'trail', 'unmown', 'gta', 'preserve'], emoji: [],
    footprint: { r: 0.9, h: 0.45 },
    seat: [0, 0.45, 0],
    about: 'Gnome Theft Auto: a split-log bench on the Unmown trail, 1.8 m long, seat at 0.45 m, on two stump legs. Life-size metres, front on +z.',
    examine: [
      'A long bench made from a split log, its flat side up, on two short stump legs and worn smooth by generations of rest.',
      'Saying: a log has only one good side, and the bench has been designed so that a gnome may rest on it.',
      'Tip: sit in the middle. The ends are for the bark, and the bark is not for sitting, however comfortable it looks.',
      'Joke: the bench is firm, honest and entirely unforgiving, rather like the rangers who built it.',
      'Carved into the seat is a row of small notches, one for each gnome who has sat here and admitted it.',
    ],
    parts: [
      { s: 'cyl', d: [0.18, 0.18, 1.8], at: [0, 0.27, 0], rot: [0, 0, 90], c: 'wood', seg: 8 },  // seat log
      { s: 'cyl', d: [0.16, 0.14, 0.2], at: [-0.6, 0.1, 0], c: 'bark', seg: 8 },                // stump legs
      { s: 'cyl', d: [0.16, 0.14, 0.2], at: [0.6, 0.1, 0], c: 'bark', seg: 8 },
    ],
  },
  {
    id: 'reed-clump', name: 'Reed Clump', category: 'prop', uses: ['place'],
    tags: ['reed', 'reeds', 'plant', 'marsh', 'grass', 'water', 'clump', 'unmown', 'gta', 'preserve'], emoji: [],
    about: 'Gnome Theft Auto: a clump of eleven marsh reeds, 1.6-2.2 m tall, greens and straw, some leaning. Walk-through, no collider.',
    examine: [
      'A clump of tall green and straw reeds, some leaning on their neighbours, all of them rustling a little even when there is no wind.',
      'Saying: a reed bends in the storm and does not break, which is more than can be said for the gnome who laughed at it.',
      'Tip: wade in slowly. The reeds will hide you well, though they will also hide whatever is standing next to you.',
      'Joke: the reeds whisper constantly, and the gnomes of Thatchford have never once been able to hear what they say.',
      'Among the stalks there is a faint trail of footprints, all of them going in and none coming out, which the rangers call a good sign.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.012, 2.0], at: [0, 0.99, 0], c: 'moss', seg: 6 },
      { s: 'cyl', d: [0.02, 0.012, 1.8], at: [0.08, 0.89, 0.05], rot: [0, 0, 4], c: 'leaf-dark', seg: 6 },
      { s: 'cyl', d: [0.02, 0.012, 2.2], at: [-0.07, 1.09, 0.06], rot: [0, 0, -5], c: 'moss', seg: 6 },
      { s: 'cyl', d: [0.02, 0.012, 1.7], at: [0.12, 0.84, -0.06], rot: [0, 0, -8], c: 'straw', seg: 6 },
      { s: 'cyl', d: [0.02, 0.012, 1.9], at: [-0.12, 0.94, -0.04], rot: [0, 0, 6], c: 'leaf-dark', seg: 6 },
      { s: 'cyl', d: [0.02, 0.012, 2.1], at: [0.04, 1.04, -0.12], rot: [4, 0, 0], c: 'moss', seg: 6 },
      { s: 'cyl', d: [0.02, 0.012, 1.6], at: [-0.05, 0.79, -0.14], rot: [-5, 0, 0], c: 'straw', seg: 6 },
      { s: 'cyl', d: [0.02, 0.012, 1.85], at: [0.2, 0.915, 0.1], rot: [0, 0, -6], c: 'leaf', seg: 6 },
      { s: 'cyl', d: [0.02, 0.012, 2.0], at: [-0.2, 0.99, 0.08], rot: [0, 0, 7], c: 'moss', seg: 6 },
      { s: 'cyl', d: [0.02, 0.012, 1.75], at: [0.15, 0.865, 0.16], rot: [5, 0, 0], c: 'straw', seg: 6 },
      { s: 'cyl', d: [0.02, 0.012, 2.15], at: [-0.16, 1.065, -0.12], rot: [0, 0, -4], c: 'leaf-dark', seg: 6 },
    ],
  },
  {
    id: 'bulrush-clump', name: 'Bulrush Clump', category: 'prop', uses: ['place'],
    tags: ['bulrush', 'bulrushes', 'cattail', 'plant', 'marsh', 'reed', 'stems', 'heads', 'unmown', 'gta', 'preserve'], emoji: [],
    about: 'Gnome Theft Auto: a clump of six bulrush stems, 1.4-1.7 m tall, with brown sausage heads and a few flat blades. Walk-through, no collider.',
    examine: [
      'A knot of stiff stems with brown sausage-shaped heads, and a few flat blades sticking out where the heads do not reach.',
      'Saying: the bulrush heads are for poking at your neighbours, and the stems are for holding the heads up while you do.',
      'Tip: the heads come apart into fluff. Keep the fluff dry, or it will be a long time before it is any use to anyone.',
      'Joke: the brown heads look like sausages, which is why the gnomes of Mossbottom will not eat them, though they are very tempted.',
      'Somebody once made a bulrush crown with three heads, and it was the only hat the Unmown has ever had.',
    ],
    parts: [
      { s: 'cyl', d: [0.012, 0.012, 1.5], at: [0, 0.75, 0], c: 'leaf', seg: 6 },
      { s: 'pill', d: [0.035, 0.1], at: [0, 1.39, 0], c: 'leather', seg: 8 },
      { s: 'cyl', d: [0.012, 0.012, 1.4], at: [0.06, 0.7, 0.05], c: 'leaf', seg: 6 },
      { s: 'pill', d: [0.035, 0.1], at: [0.06, 1.29, 0.05], c: 'leather', seg: 8 },
      { s: 'cyl', d: [0.012, 0.012, 1.7], at: [-0.06, 0.85, 0.04], c: 'leaf', seg: 6 },
      { s: 'pill', d: [0.035, 0.1], at: [-0.06, 1.59, 0.04], c: 'leather', seg: 8 },
      { s: 'cyl', d: [0.012, 0.012, 1.45], at: [0.1, 0.725, -0.05], c: 'leaf', seg: 6 },
      { s: 'pill', d: [0.035, 0.1], at: [0.1, 1.34, -0.05], c: 'leather', seg: 8 },
      { s: 'cyl', d: [0.012, 0.012, 1.6], at: [-0.1, 0.8, -0.06], c: 'leaf', seg: 6 },
      { s: 'pill', d: [0.035, 0.1], at: [-0.1, 1.49, -0.06], c: 'leather', seg: 8 },
      { s: 'cyl', d: [0.012, 0.012, 1.55], at: [0.03, 0.775, -0.12], c: 'leaf', seg: 6 },
      { s: 'pill', d: [0.035, 0.1], at: [0.03, 1.44, -0.12], c: 'leather', seg: 8 },
      { s: 'box', d: [0.025, 0.6, 0.008], at: [0.15, 0.3, 0.1], rot: [0, 0, -8], c: 'leaf-dark' },
      { s: 'box', d: [0.025, 0.6, 0.008], at: [-0.15, 0.3, -0.02], rot: [0, 0, 8], c: 'leaf-dark' },
      { s: 'box', d: [0.025, 0.6, 0.008], at: [0, 0.3, -0.2], rot: [0, 0, 4], c: 'leaf-dark' },
    ],
  },
  {
    id: 'bird-box', name: 'Bird Box', category: 'prop', uses: ['place'],
    tags: ['bird', 'birdbox', 'nest', 'box', 'hole', 'pole', 'wood', 'unmown', 'gta', 'preserve'], emoji: [],
    footprint: { r: 0.3, h: 2.5 },
    about: 'Gnome Theft Auto: a nest box on a 2.2 m pole in the Unmown. A little wooden box with a round front hole and a sloped lid.',
    examine: [
      'A small wooden nest box with a round hole in the front and a sloped lid, tacked to the top of a tall pole.',
      'Saying: the bird who moves in first owns the box, and every other bird must be polite about it.',
      'Tip: do not poke your head in the hole. The occupant is nearly always a sparrow, and the sparrow is nearly always cross.',
      'Joke: the box has been empty for three years, and the rangers are still waiting for the tenant to read the notice.',
      'Below the hole, faint scratches in the wood show where some small resident has been checking the door every morning.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 2.25], at: [0, 1.125, 0], c: 'wood', seg: 6 },          // pole
      { s: 'box', d: [0.4, 0.3, 0.35], at: [0, 2.35, 0], c: 'wood-light' },                // box
      { s: 'cyl', d: [0.045, 0.045, 0.03], at: [0, 2.4, 0.19], rot: [90, 0, 0], c: 'black', seg: 10 }, // hole
      { s: 'box', d: [0.46, 0.04, 0.42], at: [0, 2.51, 0], rot: [-12, 0, 0], c: 'wood-dark' }, // sloped lid
    ],
  },
  {
    id: 'insect-hotel', name: 'Insect Hotel', category: 'prop', uses: ['place'],
    tags: ['insect', 'hotel', 'bug', 'bee', 'frame', 'cells', 'straw', 'wood', 'unmown', 'gta', 'preserve'], emoji: [],
    footprint: { r: 0.4, h: 1.2 },
    about: 'Gnome Theft Auto: a 1.2 m wooden insect hotel in the Unmown. A frame with a pitched roof, nine stuffed cells (log ends, cones, straw) and a sign plank at the bottom.',
    examine: [
      'A tall wooden frame with a pitched roof, its many small cells filled with log ends, cones and bundles of straw.',
      'Saying: every beetle is welcome, and so is every spider, though the spiders must bring their own straw.',
      'Tip: the cells are full of hiding places. Leave them undisturbed, and the guests will stay until the frost.',
      'Joke: the hotel has no rooms with a view, which is the only thing the bees have ever complained about.',
      'The sign plank at the bottom has a list of rules, mostly about not sweeping, which the rangers wrote in a hurry.',
    ],
    parts: [
      { s: 'box', d: [0.72, 1.0, 0.36], at: [0, 0.5, 0], c: 'wood-light' },                  // frame
      { s: 'box', d: [0.5, 0.05, 0.8], at: [0.2, 1.08, 0], rot: [0, 0, -20], c: 'wood-dark' }, // roof, right
      { s: 'box', d: [0.5, 0.05, 0.8], at: [-0.2, 1.08, 0], rot: [0, 0, 20], c: 'wood-dark' }, // roof, left
      { s: 'cyl', d: [0.06, 0.06, 0.04], at: [-0.2, 0.35, 0.2], rot: [90, 0, 0], c: 'wood', seg: 8 }, // log ends
      { s: 'cyl', d: [0.06, 0.06, 0.04], at: [0, 0.35, 0.2], rot: [90, 0, 0], c: 'wood', seg: 8 },
      { s: 'cyl', d: [0.06, 0.06, 0.04], at: [0.2, 0.35, 0.2], rot: [90, 0, 0], c: 'wood', seg: 8 },
      { s: 'cone', d: [0.06, 0.12], at: [-0.2, 0.6, 0.2], rot: [90, 0, 0], c: 'bark', seg: 8 }, // cones
      { s: 'cone', d: [0.06, 0.12], at: [0, 0.6, 0.2], rot: [90, 0, 0], c: 'bark', seg: 8 },
      { s: 'cone', d: [0.06, 0.12], at: [0.2, 0.6, 0.2], rot: [90, 0, 0], c: 'bark', seg: 8 },
      { s: 'box', d: [0.16, 0.18, 0.03], at: [-0.2, 0.85, 0.21], c: 'straw' },            // straw bundles
      { s: 'box', d: [0.16, 0.18, 0.03], at: [0, 0.85, 0.21], c: 'straw' },
      { s: 'box', d: [0.16, 0.18, 0.03], at: [0.2, 0.85, 0.21], c: 'straw' },
      { s: 'box', d: [0.6, 0.14, 0.02], at: [0, 0.1, 0.21], c: 'wood-light' },              // sign plank
    ],
  },
  {
    id: 'last-dandelion', name: 'The Last Dandelion', category: 'prop', uses: ['place'],
    tags: ['dandelion', 'flower', 'plant', 'stones', 'ring', 'stake', 'famous', 'unmown', 'gta', 'preserve'], emoji: [],
    footprint: { r: 0.7, h: 0.1 },
    about: 'Gnome Theft Auto: the famous last dandelion of the Unmown, 0.7 m tall with a yellow head, in a ring of eight grey stones (radius 0.6 m), with a tiny PLEASE DO NOT stake. Walk-through, no collider.',
    examine: [
      'A single dandelion, seventy centimetres tall, with a bright yellow head, standing alone in a ring of grey stones.',
      'Saying: the last dandelion in the Unmown was planted by no one and kept alive by everyone, which is the best kind of garden.',
      'Tip: do not pick it. The stones are arranged in a circle for a reason, and the reason is that picking is forbidden.',
      'Joke: it has been declared the last dandelion so many times that the dandelion has stopped arguing and started enjoying itself.',
      'The tiny stake says PLEASE DO NOT in careful letters, and the rangers have never been able to explain what should not be done.',
    ],
    parts: [
      { s: 'cyl', d: [0.012, 0.012, 0.62], at: [0, 0.31, 0], c: 'leaf', seg: 6 },                    // stem
      { s: 'ball', d: [0.08], at: [0, 0.66, 0], c: 'yellow', seg: 8 },                              // head
      { s: 'ball', d: [0.08], at: [0.6, 0.04, 0], scale: [1, 0.5, 1], c: 'stone', seg: 8 },        // ring of stones
      { s: 'ball', d: [0.08], at: [0.42, 0.04, 0.42], scale: [1, 0.5, 1], c: 'stone-dark', seg: 8 },
      { s: 'ball', d: [0.08], at: [0, 0.04, 0.6], scale: [1, 0.5, 1], c: 'stone', seg: 8 },
      { s: 'ball', d: [0.08], at: [-0.42, 0.04, 0.42], scale: [1, 0.5, 1], c: 'stone-dark', seg: 8 },
      { s: 'ball', d: [0.08], at: [-0.6, 0.04, 0], scale: [1, 0.5, 1], c: 'stone', seg: 8 },
      { s: 'ball', d: [0.08], at: [-0.42, 0.04, -0.42], scale: [1, 0.5, 1], c: 'stone-dark', seg: 8 },
      { s: 'ball', d: [0.08], at: [0, 0.04, -0.6], scale: [1, 0.5, 1], c: 'stone', seg: 8 },
      { s: 'ball', d: [0.08], at: [0.42, 0.04, -0.42], scale: [1, 0.5, 1], c: 'stone-dark', seg: 8 },
      { s: 'box', d: [0.03, 0.3, 0.03], at: [0, 0.15, 0.32], c: 'wood' },                          // stake
      { s: 'box', d: [0.22, 0.08, 0.015], at: [0, 0.22, 0.335], c: 'wood-light' },                 // stake plank
    ],
  },
];
