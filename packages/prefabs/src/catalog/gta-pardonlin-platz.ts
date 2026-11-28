// Gnome Theft Auto: Pardonlin, the Grand Platz core (carousel, flower stalls, toy boats, Le Petit Groan's cellar door) (FX09, docs/roadmaps/gta-batch-3/review/fix/FX09/).
import type { Part, PrefabDef } from '../types';
import type { Swatch } from '../palette';

const DEG = Math.PI / 180;

// ---- The carousel: a round platform, a pole, a striped tent roof and six horses on poles -------------------------------
const HORSE_COATS: readonly Swatch[] = ['white', 'honey', 'pink', 'glaze-blue', 'wool', 'terracotta'];
const carouselParts = (): Part[] => {
  const parts: Part[] = [
    { s: 'cyl', d: [2.62, 2.62, 0.14], at: [0, 0.07, 0], c: 'trim', seg: 16 },                    // skirt
    { s: 'cyl', d: [2.5, 2.5, 0.2], at: [0, 0.24, 0], c: 'wood-light', seg: 16 },                 // deck 0.14..0.34
    { s: 'cyl', d: [0.2, 0.28, 2.95], at: [0, 1.82, 0], c: 'brass', seg: 8 },                     // centre pole 0.34..3.3
    { s: 'cyl', d: [0.55, 0.55, 0.16], at: [0, 3.32, 0], c: 'trim', seg: 12 },                    // hub
    { s: 'cone', d: [3.05, 0.85], at: [0, 3.78, 0], c: 'tint', seg: 16 },                         // tent roof 3.35..4.2
    { s: 'ring', d: [3.0, 0.07], at: [0, 3.38, 0], rot: [90, 0, 0], c: 'trim', seg: 16 },         // valance hoop
    { s: 'ball', d: [0.16], at: [0, 4.3, 0], c: 'gold', seg: 8 },                                 // finial
    { s: 'cone', d: [0.08, 0.3], at: [0, 4.5, 0], c: 'red', seg: 6 },
  ];
  // Eight cream stripes down the roof (tilt about z first, then turn about y).
  for (let k = 0; k < 8; k++) {
    const a = k * 45;
    const r = 1.5, rad = a * DEG;
    parts.push({
      s: 'box', d: [3.1, 0.035, 0.7], at: [r * Math.cos(rad), 3.83, -r * Math.sin(rad)], rot: [0, a, -15.3], c: 'trim',
    });
  }
  // Six horses: a pole, a barrel body, a head on a neck, standing high or low in turn.
  for (let k = 0; k < 6; k++) {
    const a = k * 60 + 15;
    const rad = a * DEG;
    const px = 1.75 * Math.cos(rad), pz = -1.75 * Math.sin(rad);
    const y = k % 2 === 0 ? 1.0 : 1.4;
    const coat = HORSE_COATS[k];
    parts.push({ s: 'cyl', d: [0.03, 0.03, 2.9], at: [px, 1.79, pz], c: 'brass', seg: 6 });
    parts.push({ s: 'ball', d: [0.3], at: [px, y, pz], rot: [0, a, 0], scale: [0.75, 0.75, 1.55], c: coat, seg: 8 });
    // head: forward (+z of the horse = tangent) and up.
    const sy = Math.sin(a * DEG), cy = Math.cos(a * DEG);
    parts.push({ s: 'box', d: [0.16, 0.34, 0.2], at: [px + sy * 0.38, y + 0.26, pz + cy * 0.38], rot: [0, a, 0], c: coat });
  }
  return parts;
};

// ---- A bucket of flowers: a zinc pail, green stems, a bunch of blooms ------------------------------------------------
const flowerBucketParts = (): Part[] => [
  { s: 'cyl', d: [0.17, 0.13, 0.3], at: [0, 0.15, 0], c: 'iron', seg: 10 },
  { s: 'ring', d: [0.17, 0.014], at: [0, 0.3, 0], rot: [90, 0, 0], c: 'steel', seg: 10 },
  { s: 'cyl', d: [0.13, 0.15, 0.2], at: [0, 0.38, 0], c: 'leaf-dark', seg: 8 },
  { s: 'ball', d: [0.16], at: [-0.06, 0.62, 0.02], c: 'tint', seg: 6 },
  { s: 'ball', d: [0.15], at: [0.07, 0.58, -0.03], c: 'trim', seg: 6 },
  { s: 'ball', d: [0.15], at: [0.0, 0.7, -0.04], c: 'tint', seg: 6 },
  { s: 'ball', d: [0.13], at: [0.04, 0.54, 0.09], c: 'yellow', seg: 6 },
  { s: 'ball', d: [0.13], at: [-0.1, 0.52, -0.05], c: 'white', seg: 6 },
];

// ---- The flower stall: awning, counter, buckets of blooms, a back shelf -----------------------------------------------
const BLOOMS: readonly Swatch[] = ['pink', 'yellow', 'red', 'purple', 'orange', 'white'];
const flowerStallParts = (): Part[] => {
  const parts: Part[] = [
    { s: 'box', d: [0.07, 2.35, 0.07], at: [-1.3, 1.175, -0.7], c: 'wood-dark' },                 // back posts
    { s: 'box', d: [0.07, 2.35, 0.07], at: [1.3, 1.175, -0.7], c: 'wood-dark' },
    { s: 'box', d: [0.07, 1.9, 0.07], at: [-1.3, 0.95, 0.85], c: 'wood-dark' },                   // front posts
    { s: 'box', d: [0.07, 1.9, 0.07], at: [1.3, 0.95, 0.85], c: 'wood-dark' },
    { s: 'box', d: [2.9, 0.05, 1.8], at: [0, 2.14, 0.0], rot: [14, 0, 0], c: 'tint' },            // awning
    { s: 'box', d: [2.9, 0.12, 0.03], at: [0, 1.86, 0.88], c: 'trim' },                           // valance
    { s: 'box', d: [2.5, 0.07, 0.6], at: [0, 0.78, 0.4], c: 'wood' },                              // counter top
    { s: 'box', d: [2.4, 0.74, 0.5], at: [0, 0.37, 0.4], c: 'wood-dark' },                         // counter body
    { s: 'box', d: [2.5, 1.7, 0.05], at: [0, 0.85, -0.74], c: 'wood' },                            // back board
    { s: 'box', d: [2.4, 0.05, 0.3], at: [0, 1.25, -0.58], c: 'wood-light' },                      // back shelf
  ];
  for (const x of [-1.0, -0.5, 0, 0.5, 1.0]) {
    parts.push({ s: 'box', d: [0.2, 0.02, 1.8], at: [x, 2.18, 0.0], rot: [14, 0, 0], c: 'trim' }); // awning stripes
  }
  // Four pails on the counter, two on the ground in front, three on the shelf.
  const pail = (x: number, y: number, z: number, c: Swatch): void => {
    parts.push({ s: 'cyl', d: [0.15, 0.11, 0.26], at: [x, y + 0.13, z], c: 'iron', seg: 8 });
    parts.push({ s: 'ball', d: [0.27], at: [x, y + 0.38, z], scale: [1, 0.8, 1], c, seg: 7 });
  };
  [-0.9, -0.3, 0.3, 0.9].forEach((x, i) => pail(x, 0.815, 0.38, BLOOMS[i]));
  [-0.75, 0.55].forEach((x, i) => pail(x, 0, 1.05, BLOOMS[i + 4]));
  [-0.8, 0, 0.8].forEach((x, i) => pail(x, 1.28, -0.58, BLOOMS[(i + 2) % 6]));
  return parts;
};

// ---- A toy sailboat for the fountain ---------------------------------------------------------------------------------
const toyBoatParts = (): Part[] => [
  { s: 'box', d: [0.13, 0.06, 0.3], at: [0, 0.03, -0.02], c: 'wood-dark' },                       // hull
  { s: 'box', d: [0.09, 0.06, 0.09], at: [0, 0.03, 0.19], rot: [0, 45, 0], c: 'wood-dark' },       // bow
  { s: 'box', d: [0.14, 0.012, 0.31], at: [0, 0.063, -0.02], c: 'trim' },                           // deck
  { s: 'cyl', d: [0.008, 0.008, 0.5], at: [0, 0.31, 0.0], c: 'wood-light', seg: 5 },               // mast
  { s: 'wedge', d: [0.012, 0.4, 0.26], at: [0, 0.27, -0.14], c: 'tint' },                           // mainsail
  { s: 'wedge', d: [0.01, 0.3, 0.2], at: [0, 0.21, 0.11], rot: [0, 180, 0], c: 'white' },           // jib
  { s: 'box', d: [0.012, 0.05, 0.09], at: [0, 0.54, -0.04], c: 'red' },                              // pennant
];

// ---- Le Petit Groan's cellar door: stone arch in a wall, red door, a hatch, a lantern, a bill board ---------------------
const cellarDoorParts = (): Part[] => [
  // The arch, set against the wall (the wall face is at z = 0, the street is +z).
  { s: 'box', d: [0.5, 2.5, 0.34], at: [-0.95, 1.25, 0.17], c: 'stone' },                          // jambs
  { s: 'box', d: [0.5, 2.5, 0.34], at: [0.95, 1.25, 0.17], c: 'stone' },
  { s: 'box', d: [2.4, 0.4, 0.38], at: [0, 2.45, 0.19], c: 'stone' },                              // lintel
  { s: 'box', d: [0.36, 0.5, 0.42], at: [0, 2.58, 0.21], c: 'stone-dark' },                        // keystone
  { s: 'box', d: [0.5, 0.18, 0.42], at: [-0.95, 0.09, 0.2], c: 'stone-dark' },                     // jamb feet
  { s: 'box', d: [0.5, 0.18, 0.42], at: [0.95, 0.09, 0.2], c: 'stone-dark' },
  // The doorway: a dark recess, the red door standing in it, a brass handle and a plate.
  { s: 'box', d: [1.4, 2.25, 0.05], at: [0, 1.125, 0.04], c: 'black' },
  { s: 'box', d: [1.3, 2.1, 0.08], at: [0, 1.05, 0.1], c: 'red' },
  { s: 'box', d: [0.5, 0.9, 0.02], at: [-0.32, 1.3, 0.15], c: 'wax' },                              // door panels
  { s: 'box', d: [0.5, 0.9, 0.02], at: [0.32, 1.3, 0.15], c: 'wax' },
  { s: 'box', d: [0.5, 0.5, 0.02], at: [-0.32, 0.45, 0.15], c: 'wax' },
  { s: 'box', d: [0.5, 0.5, 0.02], at: [0.32, 0.45, 0.15], c: 'wax' },
  { s: 'ball', d: [0.05], at: [0.1, 1.05, 0.2], c: 'brass', seg: 6 },
  { s: 'box', d: [0.5, 0.14, 0.02], at: [0, 1.82, 0.15], c: 'brass' },                              // little brass plate
  // Two worn steps and a mat.
  { s: 'box', d: [1.9, 0.1, 0.5], at: [0, 0.05, 0.6], c: 'stone-dark' },
  { s: 'box', d: [1.5, 0.02, 0.4], at: [0, 0.11, 0.62], c: 'burlap' },
  // A lantern on an iron arm over the door.
  { s: 'box', d: [0.04, 0.04, 0.6], at: [1.3, 2.7, 0.3], c: 'iron-dark' },
  { s: 'cyl', d: [0.015, 0.015, 0.2], at: [1.3, 2.58, 0.55], c: 'iron-dark', seg: 5 },
  { s: 'box', d: [0.16, 0.22, 0.16], at: [1.3, 2.38, 0.55], c: 'honey', glow: true },
  // The cellar hatch beside the door: a stone kerb frame, two sloping leaves, iron bands, a chain.
  { s: 'box', d: [1.9, 0.16, 0.14], at: [-2.2, 0.08, 0.1], c: 'stone-dark' },                       // back kerb (on the wall)
  { s: 'box', d: [1.9, 0.12, 0.14], at: [-2.2, 0.06, 1.1], c: 'stone-dark' },                       // front kerb
  { s: 'box', d: [0.14, 0.14, 1.14], at: [-3.18, 0.07, 0.6], c: 'stone-dark' },                     // side kerbs
  { s: 'box', d: [0.14, 0.14, 1.14], at: [-1.22, 0.07, 0.6], c: 'stone-dark' },
  { s: 'box', d: [0.9, 0.05, 0.95], at: [-2.65, 0.15, 0.6], rot: [-4, 0, 0], c: 'wood-dark' },       // leaves
  { s: 'box', d: [0.9, 0.05, 0.95], at: [-1.75, 0.15, 0.6], rot: [-4, 0, 0], c: 'wood-dark' },
  { s: 'box', d: [1.8, 0.02, 0.07], at: [-2.2, 0.19, 0.4], c: 'iron-dark' },                          // iron bands
  { s: 'box', d: [1.8, 0.02, 0.07], at: [-2.2, 0.19, 0.85], c: 'iron-dark' },
  { s: 'ring', d: [0.07, 0.012], at: [-2.2, 0.19, 0.62], rot: [90, 0, 0], c: 'iron', seg: 8 },       // ring pull
  // A barrel on the other side, and a boot scraper.
  { s: 'cyl', d: [0.3, 0.26, 0.7], at: [2.0, 0.35, 0.55], c: 'wood', seg: 10 },
  { s: 'ring', d: [0.3, 0.015], at: [2.0, 0.5, 0.55], rot: [90, 0, 0], c: 'iron-dark', seg: 10 },
  { s: 'ring', d: [0.28, 0.015], at: [2.0, 0.2, 0.55], rot: [90, 0, 0], c: 'iron-dark', seg: 10 },
];

export const GTA_PARDONLIN_PLATZ: readonly PrefabDef[] = [
  {
    id: 'pl-carousel', name: 'Platz Carousel', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'carousel', 'merry-go-round', 'roundabout', 'horses', 'fairground', 'funfair', 'platz', 'ride'], emoji: [],
    tint: 0xb8322f, trim: 0xf3e6c3,
    footprint: { r: 2.8, h: 4.3 },
    about: 'Gnome Theft Auto: the Grand Platz carousel. 5.2 m round deck, brass pole, striped tent roof and six painted horses on poles, 4.7 m tall. Tint is the roof, trim the stripes and valance.',
    examine: [
      'A round wooden deck under a striped tent roof, with six painted horses hanging on brass poles. None of them has ever gone anywhere.',
      'Saying: a ride is only as good as the round you come back to, and this one is exactly as good as the last one.',
      'Tip: take the horse that rides high. The low ones go round just as fast, but the view is mostly of other gnomes\' boots.',
      'Joke: the carousel is the only vehicle in Pardonlin with a queue, a timetable and no destination, so it fits right in.',
      'The tallest horse has a small dent in its ear, from a gnome who insisted on one more ride and a bit of a lean.',
    ],
    parts: carouselParts(),
  },
  {
    id: 'pl-flower-bucket', name: 'Bucket of Blooms', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'flowers', 'bucket', 'pail', 'bunch', 'bouquet', 'florist', 'market', 'platz'], emoji: [],
    tint: 0xe58fb0, trim: 0xf0c63a,
    about: 'Gnome Theft Auto: a zinc pail of cut flowers, 0.8 m tall. Tint is the main blooms, trim the second bunch.',
    examine: [
      'A tin pail packed with cut flowers, green stems at the bottom and a round, untidy crown of petals on top.',
      'Saying: a bunch is only fresh until somebody asks how fresh, and the pail has been asked a great many times.',
      'Tip: carry it by the rim, never by the flowers. The flowers will let go first and then look at you.',
      'Joke: every bucket at the market is the last bucket of the day, and has been since the market opened.',
      'A tiny paper tag is tied round one stem. It says SORRY in very small writing, and nobody knows to whom.',
    ],
    parts: flowerBucketParts(),
  },
  {
    id: 'pl-flower-stall', name: 'Flower Market Stall', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'flower', 'stall', 'market', 'florist', 'awning', 'counter', 'blooms', 'platz'], emoji: [],
    tint: 0x4f9a3c, trim: 0xf4f4f0,
    footprint: { r: 1.6, h: 2.4 },
    about: 'Gnome Theft Auto: a flower stall, 2.9 x 2.4 x 2.4 m. Striped awning (tint and trim), counter with four pails, two on the ground and three on a back shelf.',
    examine: [
      'A wooden stall under a striped awning, with a counter of pails and a back shelf with more pails, all of them overflowing.',
      'Saying: every bunch is the last bunch, and tomorrow there will be another last bunch, slightly more last than this one.',
      'Tip: pick from the back shelf. The front ones have been sniffed by every passing gnome, and the sniffing shows.',
      'Joke: the stall has no prices, only a small sign that says what are you offering, and the sign has never once been satisfied.',
      'A pair of green gloves hangs from the left post, still holding the shape of someone who stopped working to argue.',
    ],
    parts: flowerStallParts(),
  },
  {
    id: 'pl-toy-sailboat', name: 'Toy Sailboat', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'boat', 'toy', 'sailboat', 'sail', 'model', 'fountain', 'platz', 'child'], emoji: [],
    tint: 0xc8352f, trim: 0xc89b62,
    about: 'Gnome Theft Auto: a toy sailboat, 0.4 m long and 0.55 m tall, for floating in the Platz fountain. Tint is the mainsail. Place it with y at the water surface.',
    examine: [
      'A little wooden boat with a tall mast, a big sail and a small one, made for a basin and entirely convinced it is for the sea.',
      'Saying: a boat that has never left the pond has never sunk, and that is a record most captains would envy.',
      'Tip: push it from behind with a stick. Push from the front and it will sail straight back and hit you, politely.',
      'Joke: the boat has been round the fountain four hundred times and still insists the fountain is the harbour.',
      'A tiny flag at the top says nothing at all. Its owner was told to put a name on it and has been thinking ever since.',
    ],
    parts: toyBoatParts(),
  },
  {
    id: 'pl-cellar-door', name: 'Le Petit Groan Cellar Door', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'cellar', 'door', 'arch', 'hatch', 'entrance', 'groan', 'club', 'comedy', 'platz', 'lantern'], emoji: [],
    footprint: { r: 1.6, h: 3.0 },
    about: 'Gnome Theft Auto: the stone arch and red door of Le Petit Groan, with a cellar hatch on one side and a barrel on the other, 6 m wide. The back is the wall face (z = 0); the street side is +z.',
    examine: [
      'A stone arch in a wall with a deep red door, a brass plate, a lantern on an iron arm, and a wooden cellar hatch at its foot.',
      'Saying: the stair goes down so the joke has further to fall, and the laughter, when it comes, has further to climb.',
      'Tip: knock twice and wait. The door opens when the room has finished deciding whether you are funny.',
      'Joke: the hatch is for the barrels and the door is for the comedians, and the barrels are generally better received.',
      'The brass plate is polished only in the middle, where a hundred nervous thumbs have rubbed it for luck before going in.',
    ],
    parts: cellarDoorParts(),
  },
];
