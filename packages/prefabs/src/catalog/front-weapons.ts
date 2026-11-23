// Gnome Front guns. Held in the first-person viewmodel (games/gnome-front/src/player.ts) with buildHeld: the muzzle is
// up (+y), the grip is the gun's origin, and the iron sights sit at the same height as the game's SIGHT_Y.
import type { PrefabDef } from '../types';

export const FRONT_WEAPONS: readonly PrefabDef[] = [
  {
    id: 'acorn-rifle', name: 'Acorn Rifle', category: 'weapon', uses: ['hold', 'shoot'],
    wear: { rot: [180, 0, 0] },
    tags: ['acorn', 'rifle', 'gun', 'ranged', 'shoot', 'wood', 'sight', 'front'], emoji: [],
    grip: [0, 0.25, 0],
    about: 'Gnome Front: the Acorn Rifle. Wooden stock, black barrel, golden acorn on the side, orange front post and black rear notch.',
    examine: [
      'A wooden stock with a black barrel, and a golden acorn hanging off the side where it stays out of the aim.',
      'The front sight is a bead of orange paint on a post. Line the bead up in the notch and the target will not argue.',
      'A tight string of twisted fibre drives each acorn down the barrel. Gnomes trust string more than most things.',
      'Old saying: "An acorn is only a small oak that has not been argued with yet."',
      'The stock is worn pale where many gnomes have cradled it. Every one of them said it was lucky.',
    ],
    parts: [
      { s: 'box', d: [0.08, 0.5, 0.1], at: [0, 0.25, 0], c: 0x8b5a2b },                               // stock
      { s: 'cyl', d: [0.025, 0.025, 0.5], at: [0, 0.75, 0.02], c: 0x2b2b2b, seg: 8 },                 // barrel
      { s: 'ball', d: [0.035], at: [0.065, 0.55, -0.06], c: 0xd4a017, seg: 8 },                      // acorn
      { s: 'cyl', d: [0.038, 0.038, 0.022], at: [0.065, 0.55, -0.03], rot: [90, 0, 0], c: 0x6b4a2e, seg: 10 }, // acorn cap
      { s: 'box', d: [0.01, 0.02, 0.05], at: [0, 0.97, 0.075], c: 0xff7a1a },                        // front sight post
      { s: 'box', d: [0.014, 0.02, 0.05], at: [-0.022, 0.37, 0.075], c: 0x1a1a1a },                  // rear notch, left
      { s: 'box', d: [0.014, 0.02, 0.05], at: [0.022, 0.37, 0.075], c: 0x1a1a1a },                   // rear notch, right
    ],
  },
  {
    id: 'seed-sprayer', name: 'Seed Sprayer', category: 'weapon', uses: ['hold', 'shoot'],
    wear: { rot: [180, 0, 0] },
    tags: ['seed', 'sprayer', 'gun', 'ranged', 'shoot', 'drum', 'green', 'sight'], emoji: [],
    grip: [0, 0.175, 0],
    about: 'Gnome Front: the Seed Sprayer. Chunky green body, long barrel, round seed drum underneath and a hopper on the back.',
    examine: [
      'A chunky green body, a round drum of seeds slung underneath, and a little black hopper at the back for loading.',
      'Water pressure pushes the seeds out of the drum. Gnomes call it pressure and do not ask it to explain itself.',
      'Old saying: "Plant the seed before you fire the seed, or the garden will sulk."',
      'Load the drum full, not half full. A half-full drum jams and sprays the gnome holding it.',
      'The drum clicks once for every shot. Gnomes count the clicks for luck, and lose count at about four.',
    ],
    parts: [
      { s: 'box', d: [0.12, 0.45, 0.12], at: [0, 0.225, 0], c: 0x3f7d3a },                            // body
      { s: 'cyl', d: [0.03, 0.03, 0.6], at: [0, 0.775, 0.02], c: 0x2b2b2b, seg: 8 },                  // barrel
      { s: 'cyl', d: [0.075, 0.075, 0.12], at: [0, 0.275, -0.12], c: 0xd9c24a, seg: 12 },            // seed drum
      { s: 'box', d: [0.05, 0.06, 0.1], at: [0, 0.055, -0.09], c: 0x2b2b2b },                        // hopper
      { s: 'box', d: [0.01, 0.02, 0.05], at: [0, 1.035, 0.085], c: 0xff7a1a },                       // front sight post
      { s: 'box', d: [0.014, 0.02, 0.05], at: [-0.022, 0.355, 0.085], c: 0x1a1a1a },                 // rear notch, left
      { s: 'box', d: [0.014, 0.02, 0.05], at: [0.022, 0.355, 0.085], c: 0x1a1a1a },                  // rear notch, right
    ],
  },
  {
    id: 'pea-shooter', name: 'Pea Shooter', category: 'weapon', uses: ['hold', 'shoot'],
    wear: { rot: [180, 0, 0] },
    tags: ['pea', 'shooter', 'peashooter', 'gun', 'ranged', 'shoot', 'scope', 'green'], emoji: [],
    grip: [0, 0.25, 0],
    about: 'Gnome Front: the Pea Shooter. Long thin barrel, a scope tube with a pale blue lens, and a green pea at the muzzle.',
    examine: [
      'A long thin barrel with a scope tube on top. The lens is a glass marble, a Tall-eye, polished until it hums.',
      'Through the scope the target looks very large and very far away. That is the scope doing its job, not the target.',
      'Peas are sprung out of a bent willow strip. Keep the strip dry, or the pea goes sideways.',
      'Old saying: "A pea that knows where it is going rarely arrives there."',
      'Made by a gnome who only ever wanted to shoot peas. That is still all it does, and it does it well.',
    ],
    parts: [
      { s: 'box', d: [0.08, 0.5, 0.1], at: [0, 0.25, 0], c: 0x8b5a2b },                               // stock
      { s: 'cyl', d: [0.02, 0.02, 1], at: [0, 1, 0.02], c: 0x2b2b2b, seg: 8 },                        // barrel
      { s: 'cyl', d: [0.03, 0.03, 0.3], at: [0, 0.35, 0.11], c: 0x1a1a1a, seg: 10 },                 // scope tube
      { s: 'cyl', d: [0.028, 0.028, 0.01], at: [0, 0.19, 0.11], c: 0x9fd8ff, glow: true, seg: 12 }, // scope lens
      { s: 'ball', d: [0.03], at: [0, 1.52, 0.02], c: 0x7fc23a, seg: 8 },                           // pea
    ],
  },
  {
    id: 'pinecone-blunderbuss', name: 'Pinecone Blunderbuss', category: 'weapon', uses: ['hold', 'shoot'],
    wear: { rot: [180, 0, 0] },
    tags: ['pinecone', 'blunderbuss', 'gun', 'ranged', 'shoot', 'wide', 'wood', 'sight'], emoji: [],
    grip: [0, 0.18, 0],
    about: 'Gnome Front: the Pinecone Blunderbuss. Short wooden stock, a wide barrel that flares to the muzzle, a pinecone packed in the end.',
    examine: [
      'A short wooden stock on a wide barrel that flares out toward the muzzle. A pinecone is packed into the end.',
      'The barrel is wider at the front than at the back, so whatever comes out of it spreads like gossip.',
      'A spring of bent cane is wound by hand before each shot. Wind it slowly, or it will not take.',
      'Old saying: "A pinecone is only a seed that has given up on being small."',
      'Heavy for its size and it kicks. Hold it with both hands and with the consequences in mind.',
    ],
    parts: [
      { s: 'box', d: [0.1, 0.32, 0.12], at: [0, 0.16, -0.01], c: 0x6b4a2e },                            // stock
      { s: 'cyl', d: [0.07, 0.035, 0.5], at: [0, 0.58, 0.02], c: 0x2b2b2b, seg: 12 },                 // flared barrel
      { s: 'ball', d: [0.07], at: [0, 0.86, 0.02], c: 0x7a4e24, seg: 8 },                             // pinecone
      { s: 'box', d: [0.01, 0.02, 0.09], at: [0, 0.78, 0.095], c: 0xff7a1a },                        // front sight post
      { s: 'box', d: [0.014, 0.02, 0.09], at: [-0.022, 0.26, 0.095], c: 0x1a1a1a },                  // rear notch, left
      { s: 'box', d: [0.014, 0.02, 0.09], at: [0.022, 0.26, 0.095], c: 0x1a1a1a },                   // rear notch, right
    ],
  },
];
