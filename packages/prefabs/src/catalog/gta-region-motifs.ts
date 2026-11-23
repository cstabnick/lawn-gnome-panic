// Gnome Theft Auto: regional motif pieces (walls, fences, borders, signature props) for the terrain pass. Life-size metres.
// Each region has its own look (issue 3B): Dust Flats (adobe), Mossy Wood (split rails, logs), Frostbite Fells (snowcapped
// stone, cairns), Loch Moss (reeds, wattle, cairns), Tallgrass Commons (wattle, wildflowers, skeps), Turfton (civic railings,
// paving). Life-size metres, 1 unit = 1 metre, standing on y = 0, centred on x and z, front on +z.
import type { PrefabDef } from '../types';

export const GTA_REGION_MOTIFS: readonly PrefabDef[] = [
  {
    id: 'adobe-wall', name: 'Adobe Wall', category: 'prop', uses: ['place'],
    tags: ['adobe', 'clay', 'wall', 'mud', 'desert', 'dust', 'niche', 'landscaping'], emoji: [],
    tint: 'clay',
    footprint: { r: 2, h: 1.2 },
    about: 'Gnome Theft Auto: the Adobe Wall. A 4 m clay wall, 0.5 thick and 1.1 tall, with a rounded top, two darker patches and a niche. Life-size metres, for Gnome Theft Auto regional landscaping (Dust Flats).',
    examine: [
      'A low wall of sun-dried clay with a rounded top, smoothed by hands and weather until it looks more like a loaf than a barrier.',
      'Saying: the desert does not build walls, it only waits for them to fall down, and the clay has made a habit of disappointing it.',
      'Tip: lean on the wall in the shade. The clay keeps the cool of the night until well past breakfast, which is the only thing it gives away freely.',
      'Joke: the wall is so warm to the touch that the gnomes use it to dry their socks, and then complain that the socks taste of dust.',
      'A small niche in the face holds a clay pot with a single dead flower, which somebody has refilled with water every year without fail.',
    ],
    parts: [
      { s: 'box', d: [4.0, 0.85, 0.5], at: [0, 0.425, 0], c: 'tint' },                     // wall body
      { s: 'cyl', d: [0.25, 0.25, 4.0], at: [0, 0.85, 0], rot: [0, 0, 90], c: 'tint', seg: 8 }, // rounded top
      { s: 'box', d: [0.9, 0.4, 0.04], at: [-1.0, 0.5, 0.27], c: 'clay-dark' },           // darker patches
      { s: 'box', d: [0.7, 0.3, 0.04], at: [0.9, 0.3, -0.27], c: 'clay-dark' },
      { s: 'box', d: [0.36, 0.36, 0.08], at: [1.2, 0.5, 0.26], c: 'black' },              // niche
      { s: 'box', d: [0.2, 0.14, 0.1], at: [1.2, 0.3, 0.3], c: 'clay' },                   // pot in the niche
    ],
  },
  {
    id: 'split-rail-fence', name: 'Split-Rail Fence', category: 'prop', uses: ['place'],
    tags: ['fence', 'rail', 'split', 'wood', 'bark', 'post', 'moss', 'landscaping'], emoji: [],
    footprint: { r: 2, h: 1.1 },
    about: 'Gnome Theft Auto: the Split-Rail Fence. A 4 m fence of two rough posts and three split rails, with a moss patch. Life-size metres, for Gnome Theft Auto regional landscaping (Mossy Wood).',
    examine: [
      'Three split rails lean between rough posts, each one split down the middle with an axe and then left to think about what it has done.',
      'Saying: a rail fence keeps nothing in and nothing out, but it does a very good job of telling everyone where the wood begins.',
      'Tip: climb over at the posts, not between the rails. The rails are only pinned in place, and they swing like a bridge when they are in the mood.',
      'Joke: the fence has been painted by squirrels so often that its bottom rail is now the colour of an extremely untidy nut.',
      'Carved on the middle post is a row of tally marks, one for every gnome who has leaned on it and claimed it was only resting.',
    ],
    parts: [
      { s: 'box', d: [0.14, 1.1, 0.14], at: [-1.8, 0.55, 0], c: 'bark' },                   // posts
      { s: 'box', d: [0.14, 1.1, 0.14], at: [0.0, 0.55, 0], c: 'bark' },
      { s: 'box', d: [0.14, 1.1, 0.14], at: [1.8, 0.55, 0], c: 'bark' },
      { s: 'box', d: [4.0, 0.12, 0.08], at: [0, 0.3, 0.03], rot: [0, 0, 3], c: 'wood' },    // three rails, offset
      { s: 'box', d: [4.0, 0.12, 0.08], at: [0, 0.6, -0.03], rot: [0, 0, -2], c: 'wood-light' },
      { s: 'box', d: [4.0, 0.12, 0.08], at: [0, 0.9, 0.03], rot: [0, 0, 2], c: 'wood' },
      { s: 'ball', d: [0.4], scale: [1.2, 0.3, 0.7], at: [1.0, 0.1, 0.35], c: 'moss', seg: 8 },                  // moss patch
    ],
  },
  {
    id: 'log-border', name: 'Log Border', category: 'prop', uses: ['place'],
    tags: ['log', 'border', 'wood', 'moss', 'mushroom', 'edging', 'forest', 'landscaping'], emoji: [],
    footprint: { r: 1.5, h: 0.45 },
    about: 'Gnome Theft Auto: the Log Border. Two logs laid end to end 3 m long, with moss tops and a tiny mushroom. Life-size metres, for Gnome Theft Auto regional landscaping (Mossy Wood).',
    examine: [
      'Two fallen logs lie side by side with their bark gone soft and green, making a border that has never once been planted by anybody.',
      'Saying: a log that falls in the wood is never really gone; it only changes its mind about being a log and becomes a path instead.',
      'Tip: step up on the logs carefully. They are rounder than they look, and a gnome who slips on one will not be the first to go down that way.',
      'Joke: the moss on the logs is so thick that the local frogs have started charging rent, and the logs are too polite to say no.',
      'A small brown mushroom has pushed up between the logs, and it watches anyone who passes with the air of a gnome who owns the place.',
    ],
    parts: [
      { s: 'cyl', d: [0.17, 0.17, 3.0], at: [0, 0.17, 0.25], rot: [0, 0, 90], c: 'wood', seg: 8 },  // log 1
      { s: 'cyl', d: [0.17, 0.17, 3.0], at: [0, 0.17, -0.25], rot: [0, 0, 90], c: 'bark', seg: 8 }, // log 2
      { s: 'box', d: [3.0, 0.05, 0.34], at: [0, 0.345, 0.25], c: 'moss' },                       // moss tops
      { s: 'box', d: [3.0, 0.05, 0.34], at: [0, 0.345, -0.25], c: 'moss' },
      { s: 'cyl', d: [0.015, 0.015, 0.05], at: [0.9, 0.36, 0.25], c: 'mushroom-stem', seg: 5 }, // tiny mushroom
      { s: 'ball', d: [0.05], at: [0.9, 0.4, 0.25], scale: [1, 0.6, 1], c: 'mushroom-cap', seg: 6 },
    ],
  },
  {
    id: 'snowcap-stone-wall', name: 'Snowcap Stone Wall', category: 'prop', uses: ['place'],
    tags: ['wall', 'stone', 'snow', 'snowcap', 'dry', 'frost', 'fell', 'winter', 'landscaping'], emoji: [],
    footprint: { r: 2, h: 1.15 },
    about: 'Gnome Theft Auto: the Snowcap Stone Wall. A 4 m dry-stone wall, 0.6 thick and 1 tall, with a white snow layer along the top and a drift at one foot. Life-size metres, for Gnome Theft Auto regional landscaping (Frostbite Fells).',
    examine: [
      'Grey stones stacked without mortar, with a crust of snow along the top that has been there so long it has become part of the wall.',
      'Saying: a fell wall is built once in summer and then rebuilt by winter, and the wall never complains about the weather, only about the builders.',
      'Tip: knock on the snow before you lean. A gnome who leans on a snowcap usually leaves with a snowcap of their own, down the back of the tunic.',
      'Joke: the snow has been left on the wall so long that it has started paying its taxes, and the sheep respect it for that.',
      'A little drift has piled against one foot of the wall, and under the snow there is a stone with a carved face that is always, somehow, looking the other way.',
    ],
    parts: [
      { s: 'box', d: [1.0, 0.3, 0.6], at: [-1.5, 0.15, 0], c: 'stone' },                    // course 1
      { s: 'box', d: [1.0, 0.3, 0.6], at: [-0.5, 0.15, 0], c: 'stone-dark' },
      { s: 'box', d: [1.0, 0.3, 0.6], at: [0.5, 0.15, 0], c: 'stone' },
      { s: 'box', d: [1.0, 0.3, 0.6], at: [1.5, 0.15, 0], c: 'stone-dark' },
      { s: 'box', d: [1.0, 0.3, 0.56], at: [-1.0, 0.45, 0], c: 'stone-dark' },               // course 2, staggered
      { s: 'box', d: [1.0, 0.3, 0.56], at: [0.0, 0.45, 0], c: 'stone' },
      { s: 'box', d: [1.0, 0.3, 0.56], at: [1.0, 0.45, 0], c: 'stone-dark' },
      { s: 'box', d: [1.0, 0.25, 0.6], at: [-1.5, 0.725, 0], c: 'stone' },                  // course 3
      { s: 'box', d: [1.0, 0.25, 0.6], at: [-0.5, 0.725, 0], c: 'stone-dark' },
      { s: 'box', d: [1.0, 0.25, 0.6], at: [0.5, 0.725, 0], c: 'stone' },
      { s: 'box', d: [1.0, 0.25, 0.6], at: [1.5, 0.725, 0], c: 'stone-dark' },
      { s: 'ball', d: [0.3], at: [-1.5, 0.9, 0], scale: [1.1, 0.35, 1], c: 'white', seg: 6 }, // snow cap
      { s: 'ball', d: [0.3], at: [-0.5, 0.9, 0], scale: [1.1, 0.35, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.3], at: [0.5, 0.9, 0], scale: [1.1, 0.35, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.3], at: [1.5, 0.9, 0], scale: [1.1, 0.35, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.35], at: [-1.8, 0.125, 0.45], scale: [1.5, 0.35, 1], c: 'white', seg: 6 }, // drift at the foot
    ],
  },
  {
    id: 'stone-cairn', name: 'Stone Cairn', category: 'prop', uses: ['place'],
    tags: ['cairn', 'stone', 'stack', 'rock', 'snow', 'trail', 'marker', 'frost', 'landscaping'], emoji: [],
    footprint: { r: 0.6, h: 1.6 },
    about: 'Gnome Theft Auto: the Stone Cairn. A stack of six flat stones getting smaller to 1.5 tall, with a snow cap and two loose stones at the foot. Life-size metres, for Gnome Theft Auto regional landscaping (Frostbite Fells, Loch Moss).',
    examine: [
      'Six flat stones piled one on another, each a little smaller than the last, until the top one is about the size of a gnome\'s loaf.',
      'Saying: a cairn is a way of saying someone was here before you, and that they were kind enough to leave a stone so you would know.',
      'Tip: add a stone when you pass, but only if it is flat. A round stone on a cairn is a bet, and the cairn always collects.',
      'Joke: the cairn is the only thing on the fell that has ever been called a good listener, mostly because it is too heavy to walk away.',
      'Under the bottom stone, someone has left a small tin plate with a sprig of heather on it, and the heather is still green.',
    ],
    parts: [
      { s: 'box', d: [0.7, 0.25, 0.6], at: [0, 0.125, 0], c: 'stone-dark' },                 // stack, bottom up
      { s: 'box', d: [0.6, 0.24, 0.5], at: [0.02, 0.37, 0], rot: [0, 12, 0], c: 'stone' },
      { s: 'box', d: [0.5, 0.22, 0.42], at: [-0.02, 0.6, 0], rot: [0, -8, 0], c: 'stone-dark' },
      { s: 'box', d: [0.42, 0.22, 0.36], at: [0.02, 0.82, 0], rot: [0, -15, 0], c: 'stone' },
      { s: 'box', d: [0.34, 0.2, 0.3], at: [0, 1.03, 0], rot: [0, 20, 0], c: 'stone-dark' },
      { s: 'box', d: [0.26, 0.18, 0.24], at: [0, 1.22, 0], rot: [0, -8, 0], c: 'stone' },
      { s: 'ball', d: [0.22], at: [0, 1.4, 0], scale: [1, 0.4, 1], c: 'white', seg: 8 },        // snow cap
      { s: 'ball', d: [0.1], at: [0.55, 0.07, 0.2], scale: [1, 0.7, 1], c: 'stone', seg: 6 },  // loose stones
      { s: 'ball', d: [0.1], at: [-0.45, 0.07, -0.2], scale: [1, 0.7, 1], c: 'stone-dark', seg: 6 },
    ],
  },
  {
    id: 'reed-bed', name: 'Reed Bed', category: 'prop', uses: ['place'],
    tags: ['reed', 'reeds', 'cattail', 'marsh', 'loch', 'water', 'plant', 'bulrush', 'landscaping'], emoji: [],
    footprint: { r: 1.25, h: 1.5 },
    about: 'Gnome Theft Auto: the Reed Bed. A clump about 2.5 m across of fourteen reeds up to 1.5 tall, with four brown cattail heads and a patch of mud. Life-size metres, for Gnome Theft Auto regional landscaping (Loch Moss).',
    examine: [
      'A clump of tall reeds leans this way and that in the wind, rattling softly like a crowd that has heard a rumour and is not sure it is true.',
      'Saying: the reeds were here before the loch, and they will be here after it, and they have never once been asked which one they prefer.',
      'Tip: the brown heads are the cattails, and they are full of fluff. Do not stick your face in them unless you enjoy sneezing for a week.',
      'Joke: the frogs use the reed bed as a meeting hall, and the minutes of every meeting are written on the nearest leaf and then blown away.',
      'In the thickest part of the bed there is a clear round pool, no bigger than a hat, and a small clay bell sits at the bottom of it.',
    ],
    parts: [
      { s: 'ball', d: [1.2], scale: [1, 0.15, 0.85], at: [0, 0.16, 0], c: 'dirt', seg: 10 },                       // mud
      { s: 'cyl', d: [0.02, 0.02, 1.4], at: [0.0, 0.7, 0], c: 'leaf', seg: 5 },              // reeds
      { s: 'cyl', d: [0.02, 0.02, 1.2], at: [0.3, 0.6, 0.2], rot: [3, 0, -3], c: 'moss', seg: 5 },
      { s: 'cyl', d: [0.02, 0.02, 1.3], at: [-0.3, 0.65, 0.25], rot: [-3, 0, 3], c: 'leaf', seg: 5 },
      { s: 'cyl', d: [0.02, 0.02, 1.0], at: [0.5, 0.5, -0.1], rot: [3, 0, 3], c: 'moss', seg: 5 },
      { s: 'cyl', d: [0.02, 0.02, 1.1], at: [-0.5, 0.55, -0.15], rot: [-3, 0, -3], c: 'leaf', seg: 5 },
      { s: 'cyl', d: [0.02, 0.02, 1.25], at: [0.15, 0.625, -0.45], rot: [3, 0, 2], c: 'moss', seg: 5 },
      { s: 'cyl', d: [0.02, 0.02, 0.95], at: [-0.2, 0.475, -0.5], rot: [-3, 0, -2], c: 'leaf', seg: 5 },
      { s: 'cyl', d: [0.02, 0.02, 0.9], at: [0.8, 0.45, 0.3], rot: [2, 0, -3], c: 'moss', seg: 5 },
      { s: 'cyl', d: [0.02, 0.02, 0.85], at: [0.6, 0.425, 0.6], rot: [-2, 0, 3], c: 'leaf', seg: 5 },
      { s: 'cyl', d: [0.02, 0.02, 1.0], at: [-0.8, 0.5, 0.1], rot: [3, 0, 3], c: 'moss', seg: 5 },
      { s: 'cyl', d: [0.02, 0.02, 1.2], at: [-0.6, 0.6, 0.55], rot: [-3, 0, 2], c: 'leaf', seg: 5 },
      { s: 'cyl', d: [0.02, 0.02, 0.8], at: [0.1, 0.4, 0.9], rot: [3, 0, -2], c: 'moss', seg: 5 },
      { s: 'cyl', d: [0.02, 0.02, 0.9], at: [-0.3, 0.45, -0.9], rot: [-2, 0, 3], c: 'leaf', seg: 5 },
      { s: 'cyl', d: [0.02, 0.02, 1.05], at: [0.9, 0.525, -0.5], rot: [2, 0, 3], c: 'moss', seg: 5 },
      { s: 'pill', d: [0.035, 0.12], at: [0.3, 1.1, 0.2], c: 'bark', seg: 6 },                  // cattails
      { s: 'pill', d: [0.035, 0.12], at: [-0.5, 1.0, -0.15], c: 'bark', seg: 6 },
      { s: 'pill', d: [0.035, 0.12], at: [0.15, 1.15, -0.45], c: 'bark', seg: 6 },
      { s: 'pill', d: [0.035, 0.12], at: [-0.6, 1.05, 0.55], c: 'bark', seg: 6 },
    ],
  },
  {
    id: 'wattle-fence', name: 'Wattle Fence', category: 'prop', uses: ['place'],
    tags: ['wattle', 'hurdle', 'fence', 'woven', 'wicker', 'stake', 'straw', 'landscaping'], emoji: [],
    footprint: { r: 1.5, h: 1.05 },
    about: 'Gnome Theft Auto: the Wattle Fence. A 3 m woven hurdle with five upright stakes and alternating horizontal bands. Life-size metres, for Gnome Theft Auto regional landscaping (Loch Moss, Tallgrass Commons).',
    examine: [
      'A woven hurdle of willow bands going in and out between upright stakes, a pattern that looks simple until you try to find where it starts.',
      'Saying: a wattle fence has no nails, no glue and no opinions, only a great deal of patience and a hand that knows when to stop.',
      'Tip: a hurdle can be lifted out of the way in one piece, which the commons use to close a gap in the field and open it again after harvest.',
      'Joke: the fence was woven by a gnome who wanted to keep the goats in, and the goats have been reading the weave ever since.',
      'Someone has pushed a feather through one of the bands, and it has stayed there so long that the band has begun to grow a new colour around it.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 1.0], at: [-1.4, 0.5, 0], c: 'wood-dark', seg: 5 },          // five stakes
      { s: 'cyl', d: [0.03, 0.03, 1.0], at: [-0.7, 0.5, 0], c: 'wood-dark', seg: 5 },
      { s: 'cyl', d: [0.03, 0.03, 1.0], at: [0.0, 0.5, 0], c: 'wood-dark', seg: 5 },
      { s: 'cyl', d: [0.03, 0.03, 1.0], at: [0.7, 0.5, 0], c: 'wood-dark', seg: 5 },
      { s: 'cyl', d: [0.03, 0.03, 1.0], at: [1.4, 0.5, 0], c: 'wood-dark', seg: 5 },
      { s: 'box', d: [3.0, 0.1, 0.08], at: [0, 0.15, 0.05], c: 'wood-light' },                 // woven bands, in and out
      { s: 'box', d: [3.0, 0.1, 0.08], at: [0, 0.35, -0.05], c: 'straw' },
      { s: 'box', d: [3.0, 0.1, 0.08], at: [0, 0.55, 0.05], c: 'wood-light' },
      { s: 'box', d: [3.0, 0.1, 0.08], at: [0, 0.75, -0.05], c: 'straw' },
      { s: 'box', d: [3.0, 0.1, 0.08], at: [0, 0.92, 0.05], c: 'wood-light' },
    ],
  },
  {
    id: 'wildflower-patch', name: 'Wildflower Patch', category: 'prop', uses: ['place'],
    tags: ['wildflower', 'flower', 'flowers', 'meadow', 'grass', 'patch', 'mound', 'petal', 'landscaping'], emoji: [],
    footprint: { r: 1, h: 0.65 },
    about: 'Gnome Theft Auto: the Wildflower Patch. A low grassy mound about 2 by 1.5 m with eleven flowers of mixed colours on stems. Life-size metres, for Gnome Theft Auto regional landscaping (Tallgrass Commons).',
    examine: [
      'A low hump of grass with flowers poking up through it in pink, yellow, white and a blue that looks almost too bright to be real.',
      'Saying: a meadow is only a garden that has forgotten its manners, and the flowers are the first to say so, loudly and in every colour.',
      'Tip: pick the blue ones for a wish and the yellow ones for a headache. The white ones are for bees, and the bees will tell you so.',
      'Joke: the patch is so full of blossom that a gnome who sits in it comes out with a new hat, a new coat and a note from the bees.',
      'In the middle of the patch there is a flower that is always a day behind the rest, and it has been called late for longer than anyone remembers.',
    ],
    parts: [
      { s: 'ball', d: [1.0], at: [0, 0.2, 0], scale: [1, 0.2, 0.75], c: 'leaf', seg: 8 },       // mound
      { s: 'cone', d: [0.1, 0.2], at: [-0.5, 0.3, -0.2], c: 'leaf-dark', seg: 5 },              // grass tufts
      { s: 'cone', d: [0.1, 0.2], at: [0.4, 0.3, 0.1], c: 'leaf-dark', seg: 5 },
      { s: 'cone', d: [0.1, 0.2], at: [0.0, 0.3, 0.0], c: 'moss', seg: 5 },
      { s: 'cone', d: [0.1, 0.2], at: [-0.2, 0.3, 0.35], c: 'leaf-dark', seg: 5 },
      { s: 'cone', d: [0.1, 0.2], at: [0.7, 0.3, -0.2], c: 'moss', seg: 5 },
      { s: 'cyl', d: [0.01, 0.01, 0.2], at: [-0.6, 0.4, 0.0], c: 'leaf', seg: 4 },              // stems and heads
      { s: 'ball', d: [0.06], at: [-0.6, 0.6, 0.0], c: 'pink', seg: 6 },
      { s: 'cyl', d: [0.01, 0.01, 0.3], at: [-0.3, 0.45, 0.3], c: 'leaf', seg: 4 },
      { s: 'ball', d: [0.06], at: [-0.3, 0.75, 0.3], c: 'yellow', seg: 6 },
      { s: 'cyl', d: [0.01, 0.01, 0.25], at: [0.0, 0.425, -0.25], c: 'leaf', seg: 4 },
      { s: 'ball', d: [0.06], at: [0.0, 0.675, -0.25], c: 'white', seg: 6 },
      { s: 'cyl', d: [0.01, 0.01, 0.35], at: [0.3, 0.475, 0.25], c: 'leaf', seg: 4 },
      { s: 'ball', d: [0.06], at: [0.3, 0.825, 0.25], c: 'sapphire', seg: 6 },
      { s: 'cyl', d: [0.01, 0.01, 0.2], at: [0.55, 0.4, -0.1], c: 'leaf', seg: 4 },
      { s: 'ball', d: [0.06], at: [0.55, 0.6, -0.1], c: 'pink', seg: 6 },
      { s: 'cyl', d: [0.01, 0.01, 0.3], at: [-0.5, 0.45, -0.25], c: 'leaf', seg: 4 },
      { s: 'ball', d: [0.06], at: [-0.5, 0.75, -0.25], c: 'yellow', seg: 6 },
      { s: 'cyl', d: [0.01, 0.01, 0.25], at: [0.1, 0.425, 0.45], c: 'leaf', seg: 4 },
      { s: 'ball', d: [0.06], at: [0.1, 0.675, 0.45], c: 'white', seg: 6 },
      { s: 'cyl', d: [0.01, 0.01, 0.3], at: [-0.7, 0.45, 0.2], c: 'leaf', seg: 4 },
      { s: 'ball', d: [0.06], at: [-0.7, 0.75, 0.2], c: 'sapphire', seg: 6 },
      { s: 'cyl', d: [0.01, 0.01, 0.2], at: [0.45, 0.4, 0.3], c: 'leaf', seg: 4 },
      { s: 'ball', d: [0.06], at: [0.45, 0.6, 0.3], c: 'pink', seg: 6 },
      { s: 'cyl', d: [0.01, 0.01, 0.28], at: [-0.1, 0.44, -0.4], c: 'leaf', seg: 4 },
      { s: 'ball', d: [0.06], at: [-0.1, 0.72, -0.4], c: 'sapphire', seg: 6 },
      { s: 'cyl', d: [0.01, 0.01, 0.22], at: [0.2, 0.41, 0.0], c: 'leaf', seg: 4 },
      { s: 'ball', d: [0.06], at: [0.2, 0.63, 0.0], c: 'white', seg: 6 },
    ],
  },
  {
    id: 'bee-skep', name: 'Bee Skep', category: 'prop', uses: ['place'],
    tags: ['skep', 'beehive', 'hive', 'bee', 'bees', 'straw', 'honey', 'dome', 'meadow', 'landscaping'], emoji: [],
    footprint: { r: 0.5, h: 1.15 },
    about: 'Gnome Theft Auto: the Bee Skep. A straw dome hive with burlap bands on a small wooden stand, 1.1 tall, with two bees. Life-size metres, for Gnome Theft Auto regional landscaping (Tallgrass Commons).',
    examine: [
      'A dome of coiled straw bound in burlap bands, sitting on a wooden stand with a dark hole at the front where the bees come and go.',
      'Saying: the bees do not care what the hive is made of, only that it is dry, dark and the right way up, which is more than most gnomes ask.',
      'Tip: approach a skep from the side and move slowly. The bees take a dim view of anything that seems to be in a hurry to be stung.',
      'Joke: the honey inside is so sweet that the gnome who keeps the skep has a permanent smile and no teeth left for anything else.',
      'Scratched into the stand is a small drawing of a bee wearing a helm, and nobody has ever been able to say who drew it or why.',
    ],
    parts: [
      { s: 'box', d: [0.6, 0.1, 0.6], at: [0, 0.05, 0], c: 'wood' },                            // base board
      { s: 'box', d: [0.4, 0.2, 0.4], at: [0, 0.2, 0], c: 'wood-dark' },                         // stand
      { s: 'ball', d: [0.42], at: [0, 0.66, 0], scale: [1, 0.9, 1], c: 'straw', seg: 8 },       // dome
      { s: 'ring', d: [0.37, 0.03], at: [0, 0.5, 0], rot: [90, 0, 0], c: 'burlap', seg: 8 },    // burlap bands
      { s: 'ring', d: [0.41, 0.03], at: [0, 0.8, 0], rot: [90, 0, 0], c: 'burlap', seg: 8 },
      { s: 'box', d: [0.16, 0.18, 0.08], at: [0, 0.45, 0.32], c: 'black' },                       // entrance hole
      { s: 'ball', d: [0.06], at: [0, 1.05, 0], scale: [1, 0.6, 1], c: 'honey', seg: 6 },       // knob
      { s: 'ball', d: [0.035], at: [0.45, 0.85, 0.2], c: 'black', seg: 5 },                      // bees
      { s: 'ball', d: [0.035], at: [-0.35, 0.95, 0.35], c: 'honey', seg: 5 },
    ],
  },
  {
    id: 'civic-railing', name: 'Civic Railing', category: 'prop', uses: ['place'],
    tags: ['railing', 'railings', 'iron', 'kerb', 'curb', 'fence', 'civic', 'garden', 'turfton', 'landscaping'], emoji: [],
    footprint: { r: 1.5, h: 1.0 },
    about: 'Gnome Theft Auto: the Civic Railing. A 3 m stone kerb with seven black iron railings, ball finials and a top rail. Life-size metres, for Gnome Theft Auto regional landscaping (Turfton).',
    examine: [
      'A low stone kerb carries a row of black iron railings, each one ending in a little ball, as if the railings were guarding a set of very small heads.',
      'Saying: a railing keeps out what the city does not want in and keeps in what the city does not want to lose, and the balls are for decoration.',
      'Tip: the gaps between the railings are exactly the width of a gnome. This was not an accident, and the city has a very long memory for those who tested it.',
      'Joke: the railings were painted black so often that the paint has grown a second layer of black on top of the first, just to be sure.',
      'One finial near the end has been polished bright by years of hands, and it is the only thing in the whole street that anyone has ever bothered to shine.',
    ],
    parts: [
      { s: 'box', d: [3.0, 0.25, 0.4], at: [0, 0.125, 0], c: 'stone' },                          // kerb
      { s: 'cyl', d: [0.022, 0.022, 0.77], at: [-1.5, 0.635, 0], c: 'iron-dark', seg: 6 },      // uprights
      { s: 'cyl', d: [0.022, 0.022, 0.77], at: [-1.0, 0.635, 0], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.022, 0.022, 0.77], at: [-0.5, 0.635, 0], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.022, 0.022, 0.77], at: [0.0, 0.635, 0], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.022, 0.022, 0.77], at: [0.5, 0.635, 0], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.022, 0.022, 0.77], at: [1.0, 0.635, 0], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.022, 0.022, 0.77], at: [1.5, 0.635, 0], c: 'iron-dark', seg: 6 },
      { s: 'box', d: [3.0, 0.04, 0.035], at: [0, 0.98, 0], c: 'iron-dark' },                    // top rail
      { s: 'ball', d: [0.04], at: [-1.5, 1.04, 0], c: 'iron-dark', seg: 6 },                    // finials
      { s: 'ball', d: [0.04], at: [-1.0, 1.04, 0], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.04], at: [-0.5, 1.04, 0], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.04], at: [0.0, 1.04, 0], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.04], at: [0.5, 1.04, 0], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.04], at: [1.0, 1.04, 0], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.04], at: [1.5, 1.04, 0], c: 'iron-dark', seg: 6 },
    ],
  },
  {
    id: 'paver-drive', name: 'Paver Drive', category: 'prop', uses: ['place'],
    tags: ['driveway', 'drive', 'paver', 'pavers', 'paving', 'slab', 'stone', 'gravel', 'path', 'landscaping'], emoji: [],
    footprint: { r: 1.5, h: 0.12 },
    about: 'Gnome Theft Auto: the Paver Drive. A driveway strip 3 m wide and 6 m long of ten paving slabs with gravel edges. Life-size metres, for Gnome Theft Auto regional landscaping (everywhere).',
    examine: [
      'Flat grey slabs laid in two neat columns, with thin gaps of soil between them where the grass has started to try its luck.',
      'Saying: a drive is the only road a house is allowed to build for itself, and it is laid slab by slab so the house can always find its way home.',
      'Tip: walk on the slabs, not the gravel. The gravel is for the wheels and the wheels have strong opinions about gnome feet.',
      'Joke: the slabs were laid by a gnome who counted them three times, and then found one more slab in the cart and laid it wrong on purpose.',
      'One slab near the house has a small hand pressed into it, and whoever made the hand wrote a name underneath that has since worn away.',
    ],
    parts: [
      { s: 'box', d: [1.36, 0.12, 1.1], at: [-0.74, 0.06, -2.4], c: 'stone' },                  // slabs, two columns
      { s: 'box', d: [1.36, 0.12, 1.1], at: [0.74, 0.06, -2.4], c: 'stone-dark' },
      { s: 'box', d: [1.36, 0.12, 1.1], at: [-0.74, 0.06, -1.2], c: 'stone-dark' },
      { s: 'box', d: [1.36, 0.12, 1.1], at: [0.74, 0.06, -1.2], c: 'stone' },
      { s: 'box', d: [1.36, 0.12, 1.1], at: [-0.74, 0.06, 0], c: 'stone' },
      { s: 'box', d: [1.36, 0.12, 1.1], at: [0.74, 0.06, 0], c: 'stone-dark' },
      { s: 'box', d: [1.36, 0.12, 1.1], at: [-0.74, 0.06, 1.2], c: 'stone-dark' },
      { s: 'box', d: [1.36, 0.12, 1.1], at: [0.74, 0.06, 1.2], c: 'stone' },
      { s: 'box', d: [1.36, 0.12, 1.1], at: [-0.74, 0.06, 2.4], c: 'stone' },
      { s: 'box', d: [1.36, 0.12, 1.1], at: [0.74, 0.06, 2.4], c: 'stone-dark' },
      { s: 'box', d: [0.2, 0.1, 6.0], at: [-1.45, 0.05, 0], c: 'sand' },                       // gravel edges
      { s: 'box', d: [0.2, 0.1, 6.0], at: [1.45, 0.05, 0], c: 'sand' },
    ],
  },
];
