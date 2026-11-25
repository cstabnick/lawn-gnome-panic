// Gnome Theft Auto E24 jobs II: the Pay 'n' Glaze client lot (mechanic job): work-order board, client props and the mechanic rewards.
// Plan: docs/roadmaps/gta-batch-3/E24/roadmap.md. Rules: docs/roadmaps/prefab-library/_common.md.
import type { PrefabDef } from '../types';

// Pay 'n' Glaze house style: hot pink and chrome. The palette has no chrome, so chrome parts use 'silver' or 'steel'.
const GLAZE_PINK = 0xff7eb6;
const GLAZE_TEAL = 0x2fb5a8;

export const GTA_MECHANIC: readonly PrefabDef[] = [
  {
    id: 'glaze-work-order-board', name: 'Work-Order Board', category: 'prop', uses: ['place'],
    tags: ['board', 'pegboard', 'work', 'order', 'orders', 'slip', 'clipboard', 'pink', 'chrome', 'glaze', 'gta', 'mechanic'], emoji: [],
    about: 'Pay \'n\' Glaze: a pink pegboard on two legs, 1.6 m wide, with clipped order slips and a chrome WORK ORDERS plate. No tint.',
    examine: [
      'A hot pink pegboard on two legs, hung with clipped order slips and a chrome plate that says WORK ORDERS in raised letters.',
      'Foreman saying: a job that is written down on pink is a job that will be finished in pink, and nobody argues with pink.',
      'Tip: clip your slip on the top row. The gnomes at the bottom only read the slips that have already been read by someone else.',
      'Joke: the order slips are all for the same car, and every slip has a different spelling of the word urgent.',
      'One slip has a gnome-sized thumbprint in mud, and a note in the margin that reads: client is always right, mostly.',
    ],
    parts: [
      { s: 'box', d: [0.07, 0.95, 0.06], at: [-0.6, 0.475, -0.06], c: 'silver' },                    // left leg
      { s: 'box', d: [0.07, 0.95, 0.06], at: [0.6, 0.475, -0.06], c: 'silver' },                     // right leg
      { s: 'box', d: [1.6, 1.0, 0.04], at: [0, 1.4, 0], c: GLAZE_PINK },                              // pegboard (1.9 m top)
      { s: 'box', d: [0.2, 0.14, 0.006], at: [-0.5, 1.6, 0.026], rot: [0, 0, -4], c: 'white' },       // order slips
      { s: 'box', d: [0.2, 0.14, 0.006], at: [-0.18, 1.72, 0.026], rot: [0, 0, 3], c: 'cloth' },
      { s: 'box', d: [0.2, 0.14, 0.006], at: [0.2, 1.48, 0.026], rot: [0, 0, 6], c: 'white' },
      { s: 'box', d: [0.2, 0.14, 0.006], at: [0.5, 1.68, 0.026], rot: [0, 0, -2], c: 'cloth' },
      { s: 'box', d: [0.03, 0.03, 0.012], at: [-0.5, 1.68, 0.032], c: 'silver' },                    // clips
      { s: 'box', d: [0.03, 0.03, 0.012], at: [0.2, 1.56, 0.032], c: 'silver' },
      { s: 'box', d: [0.7, 0.12, 0.008], at: [0, 1.8, 0.034], c: 'silver' },                         // WORK ORDERS plate
      { s: 'box', d: [0.5, 0.04, 0.006], at: [0, 1.8, 0.042], c: 'slate' },                          // raised lettering
    ],
  },
  {
    id: 'glaze-client-bench', name: 'Client Bench', category: 'furniture', uses: ['place', 'sit'],
    seat: [0, 0.49, 0],
    tags: ['bench', 'seat', 'waiting', 'chrome', 'pink', 'client', 'glaze', 'gta', 'mechanic'], emoji: [],
    about: 'Pay \'n\' Glaze: a chrome-and-pink waiting bench, 1.6 m wide, with a chrome frame and a pink seat and back. No tint.',
    examine: [
      'A waiting bench with a pink seat and a pink back, held up on a chrome frame that has been polished until it hurts to look at.',
      'Saying from the Rockery: sit on the pink and wait for the shine, because the shine always arrives after the cars.',
      'Tip: sit at the left end. The right end is reserved for clients who arrived early and are still waiting to feel important.',
      'Joke: the bench is so clean that a gnome sitting down leaves a faint outline, which the foreman has asked to be framed.',
      'A small dent in the chrome leg was made by a client who sat down too quickly and too sure of himself.',
    ],
    parts: [
      { s: 'box', d: [0.06, 0.42, 0.42], at: [-0.7, 0.21, 0], c: 'silver' },                      // legs
      { s: 'box', d: [0.06, 0.42, 0.42], at: [0.7, 0.21, 0], c: 'silver' },
      { s: 'box', d: [1.6, 0.08, 0.45], at: [0, 0.45, 0], c: GLAZE_PINK },                           // seat (top 0.49)
      { s: 'box', d: [1.6, 0.5, 0.05], at: [0, 0.7, -0.2], c: GLAZE_PINK },                         // back (0.45 to 0.95)
      { s: 'box', d: [0.04, 0.5, 0.04], at: [-0.7, 0.7, -0.2], c: 'silver' },                       // back posts
      { s: 'box', d: [0.04, 0.5, 0.04], at: [0.7, 0.7, -0.2], c: 'silver' },
      { s: 'box', d: [1.6, 0.03, 0.03], at: [0, 0.2, 0.2], c: 'silver' },                           // front rail
    ],
  },
  {
    id: 'glaze-tyre-stack', name: 'Tyre Stack', category: 'prop', uses: ['place'],
    tags: ['tyre', 'tire', 'tyres', 'stack', 'wheel', 'rim', 'pink', 'glaze', 'gta', 'mechanic'], emoji: [],
    about: 'Pay \'n\' Glaze: three black tyres stacked, the top one with a pink rim and a chrome hub. No tint.',
    examine: [
      'Three black tyres stacked on top of each other, with a pink rim round the top one and a chrome hub in the middle.',
      'Saying: a tyre has no front and no back, which is why the gnomes at the Glaze never agree which way to roll one.',
      'Tip: roll the tyres from the bottom of the stack. Pulling the top one off first is how the stack came to be in a heap.',
      'Joke: the tyres are called Stock Rubber, Pudgy Puffers and Skinny Sprinters, and all three are the same tyre with a different mood.',
      'The pink rim was fitted in a hurry. One of the bolts still has a little pink thumb print, which nobody has washed off.',
    ],
    parts: [
      { s: 'cyl', d: [0.3, 0.3, 0.2], at: [0, 0.1, 0], c: 'black', seg: 12 },                     // bottom tyre
      { s: 'cyl', d: [0.3, 0.3, 0.2], at: [0, 0.3, 0], c: 'black', seg: 12 },                     // middle tyre
      { s: 'cyl', d: [0.3, 0.3, 0.2], at: [0, 0.5, 0], c: 'black', seg: 12 },                     // top tyre
      { s: 'ring', d: [0.17, 0.03], at: [0, 0.605, 0], rot: [90, 0, 0], c: GLAZE_PINK, seg: 12 }, // pink rim
      { s: 'cyl', d: [0.12, 0.12, 0.02], at: [0, 0.61, 0], c: 'silver', seg: 10 },                // chrome hub
    ],
  },
  {
    id: 'glaze-swatch-wall', name: 'Swatch Wall', category: 'prop', uses: ['place'],
    tags: ['swatch', 'swatches', 'paint', 'chips', 'colour', 'color', 'board', 'wall', 'pink', 'glaze', 'gta', 'mechanic'], emoji: [],
    about: 'Pay \'n\' Glaze: a 1.2 m board of painted colour chips on two short legs. No tint.',
    examine: [
      'A board of painted colour chips in a grid, pink and teal and yellow and violet, each one with a tiny name nobody can read.',
      'Saying: a chip is a promise, and a gnome who paints the wrong chip on the car has broken the promise and the wall.',
      'Tip: hold the chip against the car door before you say yes. Daylight and the Glaze lamp never agree on what colour anything is.',
      'Joke: four of the chips are called Sensible Grey, and the gnome who named them has never once been asked to choose.',
      'The bottom right chip has been rubbed so often that it is now the colour of the wall behind it, which the foreman calls a win.',
    ],
    parts: [
      { s: 'box', d: [0.06, 0.34, 0.06], at: [-0.5, 0.17, -0.05], c: 'silver' },                  // legs
      { s: 'box', d: [0.06, 0.34, 0.06], at: [0.5, 0.17, -0.05], c: 'silver' },
      { s: 'box', d: [1.2, 1.2, 0.04], at: [0, 0.9, 0], c: 'white' },                              // board (0.3 to 1.5)
      { s: 'box', d: [0.22, 0.2, 0.01], at: [-0.3, 0.52, 0.027], c: GLAZE_PINK },                  // chips, 4 by 4
      { s: 'box', d: [0.22, 0.2, 0.01], at: [-0.1, 0.52, 0.027], c: GLAZE_TEAL },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [0.1, 0.52, 0.027], c: 'yellow' },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [0.3, 0.52, 0.027], c: 'purple' },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [-0.3, 0.76, 0.027], c: 'orange' },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [-0.1, 0.76, 0.027], c: 'red' },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [0.1, 0.76, 0.027], c: 'blue' },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [0.3, 0.76, 0.027], c: 'green' },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [-0.3, 1.0, 0.027], c: 'yellow' },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [-0.1, 1.0, 0.027], c: 'pink' },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [0.1, 1.0, 0.027], c: GLAZE_TEAL },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [0.3, 1.0, 0.027], c: 'red' },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [-0.3, 1.24, 0.027], c: 'blue' },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [-0.1, 1.24, 0.027], c: 'green' },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [0.1, 1.24, 0.027], c: 'white' },
      { s: 'box', d: [0.22, 0.2, 0.01], at: [0.3, 1.24, 0.027], c: 'orange' },
    ],
  },
  {
    id: 'glaze-key-hook-board', name: 'Key Hook Board', category: 'prop', uses: ['place'], mount: 'wall',
    tags: ['keys', 'key', 'hooks', 'hook', 'board', 'rack', 'wall', 'pink', 'chrome', 'glaze', 'gta', 'mechanic'], emoji: [],
    about: 'Pay \'n\' Glaze: a pink wall board, 0.6 m wide, with four chrome hooks and car keys hanging from them. Hangs on a wall.',
    examine: [
      'A small pink board on the wall with four chrome hooks, and a set of brass and silver car keys hanging from them.',
      'Saying: the key that is on the hook is the car that is going home, and the key that is in the pocket is the one that is late.',
      'Tip: hang the key by its bow, not its teeth. A key that has been hung by the teeth will not open a car, only the gnome.',
      'Joke: each key has a paper tag, and every tag says the same thing in a different hand: do not lose this one, you will not get another.',
      'The copper key on the end is the spare, and nobody can remember which car it belongs to, so it opens all of them, politely.',
    ],
    parts: [
      { s: 'box', d: [0.6, 0.45, 0.03], at: [0, 0.225, 0], c: GLAZE_PINK },                       // board (bottom at 0)
      { s: 'box', d: [0.02, 0.02, 0.09], at: [-0.22, 0.33, 0.045], c: 'silver' },                  // hooks
      { s: 'box', d: [0.02, 0.02, 0.09], at: [-0.07, 0.33, 0.045], c: 'silver' },
      { s: 'box', d: [0.02, 0.02, 0.09], at: [0.08, 0.33, 0.045], c: 'silver' },
      { s: 'box', d: [0.02, 0.02, 0.09], at: [0.23, 0.33, 0.045], c: 'silver' },
      { s: 'box', d: [0.012, 0.1, 0.008], at: [-0.22, 0.26, 0.09], c: 'brass' },                    // keys
      { s: 'box', d: [0.012, 0.1, 0.008], at: [-0.07, 0.26, 0.09], c: 'silver' },
      { s: 'box', d: [0.012, 0.1, 0.008], at: [0.08, 0.26, 0.09], c: 'brass' },
      { s: 'box', d: [0.012, 0.1, 0.008], at: [0.23, 0.26, 0.09], c: 'copper' },
      { s: 'ring', d: [0.02, 0.005], at: [-0.22, 0.32, 0.094], c: 'brass', seg: 8 },                   // key bows
      { s: 'ring', d: [0.02, 0.005], at: [-0.07, 0.32, 0.094], c: 'silver', seg: 8 },
      { s: 'ring', d: [0.02, 0.005], at: [0.08, 0.32, 0.094], c: 'brass', seg: 8 },
      { s: 'ring', d: [0.02, 0.005], at: [0.23, 0.32, 0.094], c: 'copper', seg: 8 },
    ],
  },
  {
    id: 'glaze-mud-bucket', name: 'Mud Bucket', category: 'container', uses: ['place'],
    tags: ['bucket', 'mud', 'mop', 'water', 'cleaning', 'pail', 'pink', 'glaze', 'gta', 'mechanic'], emoji: [],
    about: 'Pay \'n\' Glaze: a pink bucket of mud-brown water with a mop standing in it. No tint.',
    examine: [
      'A pink bucket full of water the colour of strong tea, with a grey mop standing in it like a gnome waiting to be called.',
      'Saying: the water is changed every Tuesday, and every Tuesday it is the same water, only darker.',
      'Tip: wring the mop over the edge, not into the bucket. The water stays cleaner if the mud does not know where it is going.',
      'Joke: the bucket has a sign saying CLEAN WATER, and the sign has been dipped in the bucket so many times it now says CLEAN.',
      'A mud ring on the rim marks the height the water reached the day the Spigot burst, and nobody has been brave enough to scrub it.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.17, 0.34], at: [0, 0.17, 0], c: GLAZE_PINK, seg: 10 },                // bucket (0 to 0.34)
      { s: 'cyl', d: [0.185, 0.185, 0.01], at: [0, 0.34, 0], c: 'dirt', seg: 10 },                 // mud water surface
      { s: 'cyl', d: [0.015, 0.015, 0.9], at: [0.05, 0.82, 0], c: 'wood', seg: 6 },              // mop handle (0.37 to 1.27)
      { s: 'ball', d: [0.07], at: [0.05, 0.4, 0], scale: [1, 0.6, 1], c: 'cloth', seg: 8 },       // mop head
    ],
  },
  {
    id: 'glaze-traffic-cone-pink', name: 'Pink Traffic Cone', category: 'prop', uses: ['place'],
    tags: ['cone', 'traffic', 'pink', 'marker', 'warning', 'road', 'glaze', 'gta', 'mechanic'], emoji: [],
    about: 'Pay \'n\' Glaze: a pink traffic cone, 0.5 m tall, on a chrome base with a white stripe. No tint.',
    examine: [
      'A pink traffic cone on a chrome base, with a single white stripe round the middle, standing very straight for something so small.',
      'Saying: a cone on the Glaze forecourt says stop, and a cone on the Glaze forecourt says it in pink, which is somehow worse.',
      'Tip: put the cone on the left of the car, where the client will see it first and pay for the scratch they are already expecting.',
      'Joke: the cone has been moved so many times that it now claims to be the forecourt, and the forecourt has not yet objected.',
      'Someone has written a small name in the white stripe in marker. It is not a name any gnome in the Verge has ever been called.',
    ],
    parts: [
      { s: 'box', d: [0.36, 0.03, 0.36], at: [0, 0.015, 0], c: 'silver' },                      // chrome base
      { s: 'cone', d: [0.15, 0.46], at: [0, 0.26, 0], c: GLAZE_PINK, seg: 10 },                 // cone (0.03 to 0.49)
      { s: 'cyl', d: [0.1, 0.1, 0.06], at: [0, 0.2, 0], c: 'white', seg: 10 },                   // white stripe
    ],
  },
  {
    id: 'glaze-oil-drum', name: 'Oil Drum', category: 'container', uses: ['place'],
    tags: ['drum', 'barrel', 'oil', 'chrome', 'pink', 'stripe', 'steel', 'glaze', 'gta', 'mechanic'], emoji: [],
    about: 'Pay \'n\' Glaze: a chrome oil drum, 0.9 m tall, with a hot pink stripe round the middle. No tint.',
    examine: [
      'A steel drum with a hot pink stripe round the middle and a chrome lid, polished on the side where the gnomes stand.',
      'Saying: the oil is for the wheels, the drum is for the wheels that have not yet been found, and the stripe is for the foreman.',
      'Tip: do not sit on the drum. The lid is only fixed on by hope, and hope has been known to give way under a gnome.',
      'Joke: the drum is labelled OIL, and underneath, in a smaller hand, it says some oil, possibly, depending on the week.',
      'A row of dents runs down one side, and each one has a tiny pink paint mark beside it, as if the drum keeps count of its visitors.',
    ],
    parts: [
      { s: 'cyl', d: [0.3, 0.3, 0.9], at: [0, 0.45, 0], c: 'steel', seg: 12 },                   // drum (0 to 0.9)
      { s: 'cyl', d: [0.31, 0.31, 0.1], at: [0, 0.6, 0], c: GLAZE_PINK, seg: 12 },                // pink stripe
      { s: 'cyl', d: [0.26, 0.26, 0.02], at: [0, 0.91, 0], c: 'silver', seg: 12 },               // chrome lid
    ],
  },
  {
    id: 'glaze-shop-overalls-cap', name: 'Glaze Shop Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'hat', 'mechanic', 'shop', 'spanner', 'pink', 'chrome', 'glaze', 'head', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Glaze Shop Cap, a pink-and-chrome mechanic\'s cap with a spanner badge. Reward for the Customer Is Always Right achievement.',
    examine: [
      'A pink mechanic\'s cap with a chrome band round the bottom, a stiff peak to the front and a small chrome spanner stitched above it.',
      'Foreman saying: the customer is always right, and the cap is always pink, and the gnome under the cap is the one who has to explain both.',
      'Tip: keep the peak clean. A grimy peak tells the client the car will be just as grimy when it comes back.',
      'Joke: the spanner on the badge has never once tightened anything, but it has frightened three clients into paying in full.',
      'The chrome button on the crown was polished by Chrome-Knuckle Cass herself, who swears it was the only thing she has ever finished.',
    ],
    parts: [
      { s: 'cyl', d: [0.16, 0.16, 0.03], at: [0, 0.015, 0], c: 'silver', seg: 10 },              // chrome band (min.y = 0)
      { s: 'ball', d: [0.16], at: [0, 0.1, 0], scale: [1, 0.55, 1.02], c: GLAZE_PINK, seg: 10 }, // crown dome
      { s: 'ball', d: [0.015], at: [0, 0.195, 0], c: 'silver', seg: 6 },                          // chrome button
      { s: 'box', d: [0.2, 0.012, 0.08], at: [0, 0.035, 0.18], c: GLAZE_PINK },                   // stiff peak (+z)
      { s: 'box', d: [0.13, 0.02, 0.012], at: [0, 0.1, 0.172], c: 'silver' },                     // spanner badge handle
      { s: 'ball', d: [0.025], at: [0.065, 0.1, 0.178], c: 'silver', seg: 6, mirror: true },      // spanner jaws
    ],
  },
  {
    id: 'torque-wrench-chrome', name: 'Chrome Torque Wrench', category: 'tool', uses: ['hold'],
    tags: ['wrench', 'torque', 'spanner', 'tool', 'chrome', 'socket', 'pink', 'glaze', 'hand', 'reward', 'gta'], emoji: [],
    wear: { rot: [90, 0, 0] },
    grip: [0, 0.09, 0],
    about: 'Gnome Theft Auto: the Chrome Torque Wrench, a long chrome wrench with a pink grip band and a socket head. Reward for the Nailed the Brief achievement.',
    examine: [
      'A long chrome torque wrench with a pink grip band near the bottom and a socket at the top, polished until it reflects every gnome in the yard.',
      'Mechanic saying: tighten to the figure on the brief, not to the figure in your head, because the figure in your head is always too tight.',
      'Tip: click the wrench once you reach the number. A wrench that has not clicked has not finished, and neither has the gnome holding it.',
      'Joke: the dial on the handle reads in acorns, a unit that has been abolished twice and still turns up on every bill.',
      'The socket has a scratch in the shape of a tiny gnome, and Chrome-Knuckle Cass says it was there before she bought the wrench.',
    ],
    parts: [
      { s: 'cyl', d: [0.018, 0.018, 0.42], at: [0, 0.21, 0], c: 'silver', seg: 8 },                 // shaft (0 to 0.42)
      { s: 'cyl', d: [0.024, 0.024, 0.12], at: [0, 0.09, 0], c: GLAZE_PINK, seg: 8 },              // pink grip band
      { s: 'cyl', d: [0.035, 0.035, 0.05], at: [0, 0.445, 0], c: 'steel', seg: 8 },               // socket head
    ],
  },
  {
    id: 'paint-swatch-fan', name: 'Paint Swatch Fan', category: 'tool', uses: ['hold'],
    tags: ['swatch', 'swatches', 'fan', 'paint', 'cards', 'colour', 'color', 'deck', 'pink', 'glaze', 'hand', 'reward', 'gta'], emoji: [],
    wear: { rot: [90, 0, 0] },
    grip: [0, 0.05, 0],
    about: 'Gnome Theft Auto: the Paint Swatch Fan, a fanned deck of paint cards in clashing colours on a short wooden handle. Reward for the Creative Differences achievement.',
    examine: [
      'A fan of paint swatch cards on a short wooden handle, in pink and teal and yellow and violet, none of which were ever meant to meet.',
      'Saying: a fan of colours is a promise that the car will be one of them, and the client always asks for the one that is not on the fan.',
      'Tip: flick the fan open before you show the client. Closed cards look like a single colour, and single colours are much harder to argue with.',
      'Joke: every card has a name, and every name is more confident than the paint it describes, which is the Glaze way of doing business.',
      'The violet card has a thumbprint on the corner and a smear of teal across the middle, which the gnome insists is the real colour.',
    ],
    parts: [
      { s: 'cyl', d: [0.015, 0.015, 0.1], at: [0, 0.05, 0], c: 'wood', seg: 6 },                  // handle (0 to 0.1)
      { s: 'box', d: [0.12, 0.2, 0.004], at: [-0.1 * 0.5, 0.1 + 0.1 * 0.866, 0.0], rot: [0, 0, 30], c: GLAZE_PINK },
      { s: 'box', d: [0.12, 0.2, 0.004], at: [-0.1 * 0.259, 0.1 + 0.1 * 0.966, 0.006], rot: [0, 0, 15], c: GLAZE_TEAL },
      { s: 'box', d: [0.12, 0.2, 0.004], at: [0, 0.2, 0.012], c: 'yellow' },
      { s: 'box', d: [0.12, 0.2, 0.004], at: [0.1 * 0.259, 0.1 + 0.1 * 0.966, 0.018], rot: [0, 0, -15], c: 'purple' },
      { s: 'box', d: [0.12, 0.2, 0.004], at: [0.1 * 0.5, 0.1 + 0.1 * 0.866, 0.024], rot: [0, 0, -30], c: 'orange' },
      { s: 'ball', d: [0.02], at: [0, 0.1, 0.03], c: 'silver', seg: 6 },                          // rivet
    ],
  },
];
