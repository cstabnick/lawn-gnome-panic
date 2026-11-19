// The gnome house: areas, each with build slots, each slot with 3 style variants.
// Coordinates are in the area's design space: AREA_W x AREA_H, origin top-left.

export const AREA_W = 1000;
export const AREA_H = 700;

export interface HouseVariant {
  name: string; // 'Toadstool Red'
  /** Palette handed to the slot's draw function: [main, second, accent]. 0xRRGGBB. */
  colors: [number, number, number];
}

export interface HouseSlot {
  id: string; // unique across all areas, e.g. 'yard-fence'
  name: string; // 'Picket Fence'
  /** Stars to build it the first time. Restyling a built item is free. */
  cost: number;
  /** Centre of the item in design space. */
  x: number;
  y: number;
  /** Rough size in design space (for the tap target and the "unbuilt" sparkle outline). */
  w: number;
  h: number;
  /** Where the "★ cost" badge and the build effects go, if not the centre (keeps badges apart on phones). */
  bx?: number;
  by?: number;
  /** Key of the draw function in houseArt.ts (DRAW). */
  art: string;
  variants: [HouseVariant, HouseVariant, HouseVariant];
}

export interface HouseArea {
  id: string; // 'yard'
  name: string; // 'Front Yard'
  /** The gnome who asked for the makeover, and what they say before / after. */
  client: string;
  before: string;
  after: string;
  /** Background art key in houseArt.ts (BACKDROP), drawn before the slots. */
  backdrop: string;
  /** Coins given when the last slot of the area is built. */
  reward: number;
  slots: HouseSlot[];
}

/** Home 1, Mossy Lane: the original four areas. */
const MOSSY_LANE: HouseArea[] = [
  {
    id: 'yard',
    name: 'Front Yard',
    client: 'Gnorbert',
    before: "My yard is a jungle! Can you tidy it up before the neighbours see?",
    after: "Gnome sweet gnome! The neighbours are SO jealous.",
    backdrop: 'yard',
    reward: 100,
    slots: [
      { id: 'yard-path', name: 'Garden Path', cost: 1, x: 500, y: 610, w: 300, h: 150, art: 'path', variants: [{ name: 'Cobblestone', colors: [0x9a9aa6, 0x6d6d78, 0xd9d9e3] }, { name: 'Mossy Brick', colors: [0xb5523b, 0x7a2f22, 0x6fbf4a] }, { name: 'Pebble Mosaic', colors: [0x5aa0d8, 0xe8e0c8, 0xffd23f] }] },
      { id: 'yard-fence', name: 'Picket Fence', cost: 2, x: 500, y: 440, w: 1000, h: 100, art: 'fence', variants: [{ name: 'Classic White', colors: [0xfaf6ee, 0xc9c1b0, 0xff5a5a] }, { name: 'Toadstool Red', colors: [0xe0393e, 0xfaf6ee, 0xffd23f] }, { name: 'Twig Rustic', colors: [0x8a5a2b, 0x5a3a1a, 0x6fbf4a] }] },
      { id: 'yard-flowers', name: 'Flower Bed', cost: 2, x: 170, y: 570, w: 260, h: 120, art: 'flowerbed', variants: [{ name: 'Tulips', colors: [0xff4d6d, 0x4fd65a, 0xffd23f] }, { name: 'Bluebells', colors: [0x4d7dff, 0x3fa64a, 0xffffff] }, { name: 'Sunflowers', colors: [0xffc21a, 0x3fa64a, 0x7a4a1a] }] },
      { id: 'yard-mailbox', name: 'Mailbox', cost: 3, x: 830, y: 520, w: 90, h: 170, art: 'mailbox', variants: [{ name: 'Post Red', colors: [0xe0393e, 0x6b4a2a, 0xffd23f] }, { name: 'Acorn', colors: [0xc8792b, 0x5a3a1a, 0x4fd65a] }, { name: 'Gem Blue', colors: [0x3fa9ff, 0xe8e0c8, 0xffffff] }] },
      { id: 'yard-tree', name: 'Shade Tree', cost: 3, x: 150, y: 270, w: 260, h: 360, art: 'tree', variants: [{ name: 'Oak', colors: [0x3fa64a, 0x7a4a1a, 0xff3b3b] }, { name: 'Cherry Blossom', colors: [0xffb3d1, 0x6b3a2a, 0xffffff] }, { name: 'Autumn Maple', colors: [0xff8a1a, 0x6b3a2a, 0xffd23f] }] },
    ],
  },
  {
    id: 'cottage',
    name: 'Mushroom Cottage',
    client: 'Granny Gnoma',
    before: "My poor mushroom house! The roof leaks and the door squeaks.",
    after: "Cosy as a teacup. Come in for tea, dearie!",
    backdrop: 'cottage',
    reward: 150,
    slots: [
      { id: 'cot-roof', name: 'Mushroom Cap Roof', cost: 2, x: 500, y: 210, w: 580, h: 250, art: 'roof', variants: [{ name: 'Fly Agaric', colors: [0xe0393e, 0xfaf6ee, 0xffffff] }, { name: 'Porcini', colors: [0xa0622d, 0xf0d9a8, 0xfff3d6] }, { name: 'Glowcap', colors: [0x8a4dff, 0x4dfff0, 0xffffff] }] },
      { id: 'cot-lanterns', name: 'Lanterns', cost: 3, x: 500, y: 500, w: 480, h: 120, bx: 720, by: 520, art: 'lanterns', variants: [{ name: 'Firefly Jars', colors: [0xfff27a, 0x8a5a2b, 0xffffff] }, { name: 'Paper Lanterns', colors: [0xff7a1a, 0xe0393e, 0xffd23f] }, { name: 'Crystal Lamps', colors: [0x7affff, 0x5a5aa6, 0xffffff] }] },
      { id: 'cot-windows', name: 'Windows', cost: 2, x: 500, y: 400, w: 380, h: 100, bx: 360, by: 400, art: 'windows', variants: [{ name: 'Round Panes', colors: [0xbfe8ff, 0x8a5a2b, 0xffd23f] }, { name: 'Stained Glass', colors: [0xff4dd2, 0x5a3a1a, 0x4dff8a] }, { name: 'Shuttered', colors: [0xbfe8ff, 0x4fa64a, 0xfaf6ee] }] },
      { id: 'cot-door', name: 'Round Door', cost: 1, x: 500, y: 520, w: 130, h: 180, art: 'door', variants: [{ name: 'Oak', colors: [0x8a5a2b, 0x5a3a1a, 0xffd23f] }, { name: 'Sky Blue', colors: [0x3fa9ff, 0x1f5a8a, 0xffffff] }, { name: 'Moss Green', colors: [0x4fa64a, 0x2a5a2a, 0xffd23f] }] },
      { id: 'cot-chimney', name: 'Chimney', cost: 3, x: 700, y: 100, w: 80, h: 150, art: 'chimney', variants: [{ name: 'Brick', colors: [0xb5523b, 0x7a2f22, 0xd9d9e3] }, { name: 'River Stone', colors: [0x9a9aa6, 0x5d5d68, 0xbfe8ff] }, { name: 'Teapot Spout', colors: [0xfaf6ee, 0x3fa9ff, 0xffd23f] }] },
    ],
  },
  {
    id: 'living',
    name: 'Cozy Living Room',
    client: 'Gnick',
    before: "I just moved in and all I have is a sad old crate.",
    after: "Best. Room. Ever. I'm never leaving this chair.",
    backdrop: 'living',
    reward: 200,
    slots: [
      { id: 'liv-rug', name: 'Rug', cost: 1, x: 500, y: 620, w: 440, h: 110, art: 'rug', variants: [{ name: 'Braided', colors: [0xd94a3a, 0xffd23f, 0x4a7dff] }, { name: 'Moss Mat', colors: [0x4fa64a, 0x2a6a2a, 0xbfff7a] }, { name: 'Starry', colors: [0x2a2a6a, 0xffd23f, 0xffffff] }] },
      { id: 'liv-chair', name: 'Armchair', cost: 2, x: 250, y: 490, w: 210, h: 230, art: 'armchair', variants: [{ name: 'Velvet Plum', colors: [0x8a2a8a, 0x5a1a5a, 0xffd23f] }, { name: 'Leaf Green', colors: [0x4fa64a, 0x2a6a2a, 0xfaf6ee] }, { name: 'Patchwork', colors: [0xff7a1a, 0x3fa9ff, 0xffd23f] }] },
      { id: 'liv-fireplace', name: 'Fireplace', cost: 2, x: 740, y: 430, w: 270, h: 310, art: 'fireplace', variants: [{ name: 'Stone Hearth', colors: [0x9a9aa6, 0x5d5d68, 0xff7a1a] }, { name: 'Brick Hearth', colors: [0xb5523b, 0x7a2f22, 0xffd23f] }, { name: 'Crystal Hearth', colors: [0x7ad9ff, 0x3a5aa6, 0x7affff] }] },
      { id: 'liv-shelf', name: 'Bookshelf', cost: 3, x: 450, y: 300, w: 200, h: 260, art: 'bookshelf', variants: [{ name: 'Oak', colors: [0x8a5a2b, 0xe0393e, 0x3fa9ff] }, { name: 'Birch', colors: [0xe8d8b0, 0x4fa64a, 0xff7a1a] }, { name: 'Painted Blue', colors: [0x3f6aff, 0xffd23f, 0xfaf6ee] }] },
      { id: 'liv-lamp', name: 'Floor Lamp', cost: 3, x: 110, y: 420, w: 100, h: 310, bx: 110, by: 330, art: 'lamp', variants: [{ name: 'Tulip Lamp', colors: [0xff4d6d, 0x5a3a1a, 0xfff27a] }, { name: 'Mushroom Lamp', colors: [0xe0393e, 0xfaf6ee, 0xfff27a] }, { name: 'Bluebell Lamp', colors: [0x4d7dff, 0x3a3a3a, 0xbfe8ff] }] },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    client: 'Chef Gnocchi',
    before: "How can I cook my famous stew in THIS kitchen?",
    after: "Mamma mia! Dinner is on me, every night!",
    backdrop: 'kitchen',
    reward: 300,
    slots: [
      { id: 'kit-table', name: 'Table', cost: 1, x: 480, y: 550, w: 330, h: 170, art: 'table', variants: [{ name: 'Farmhouse', colors: [0x8a5a2b, 0xff5a5a, 0xfaf6ee] }, { name: 'Tree Stump', colors: [0xa0622d, 0x6b3a1a, 0x4fd65a] }, { name: 'Picnic', colors: [0xe8d8b0, 0x3fa9ff, 0xfaf6ee] }] },
      { id: 'kit-stove', name: 'Stove', cost: 2, x: 810, y: 440, w: 230, h: 300, art: 'stove', variants: [{ name: 'Cast Iron', colors: [0x3a3a42, 0x6d6d78, 0xff7a1a] }, { name: 'Enamel Cream', colors: [0xfaf0d0, 0x3fa64a, 0xff5a5a] }, { name: 'Copper', colors: [0xd9823b, 0x7a4a1a, 0xffd23f] }] },
      { id: 'kit-cupboard', name: 'Cupboard', cost: 2, x: 200, y: 340, w: 250, h: 300, art: 'cupboard', variants: [{ name: 'Pine', colors: [0xd9a066, 0x8a5a2b, 0xffffff] }, { name: 'Mint', colors: [0x8ae0c0, 0x3a8a6a, 0xffd23f] }, { name: 'Barn Red', colors: [0xc0392b, 0x6b1a12, 0xfaf6ee] }] },
      { id: 'kit-curtains', name: 'Window & Curtains', cost: 3, x: 500, y: 230, w: 270, h: 210, art: 'curtains', variants: [{ name: 'Gingham', colors: [0xff5a5a, 0xfaf6ee, 0xbfe8ff] }, { name: 'Sunny', colors: [0xffd23f, 0xff7a1a, 0xbfe8ff] }, { name: 'Lace', colors: [0xfaf6ee, 0xd9d0e8, 0xbfe8ff] }] },
      { id: 'kit-stew', name: 'Stew Pot', cost: 3, x: 810, y: 255, w: 150, h: 100, art: 'pot', variants: [{ name: 'Iron Pot', colors: [0x3a3a42, 0xff7a1a, 0xfaf6ee] }, { name: 'Copper Pot', colors: [0xd9823b, 0x4fd65a, 0xfaf6ee] }, { name: 'Cauldron', colors: [0x2a2a2a, 0xb44dff, 0x7affff] }] },
    ],
  },
];


const v = (name: string, a: number, b: number, c: number): HouseVariant => ({ name, colors: [a, b, c] });

/** Home 2, Oakwood Treehouse: built up an old oak. Art in houseArtTreehouse.ts. */
const OAKWOOD: HouseArea[] = [
  {
    id: 'treedeck',
    name: 'Rope Deck',
    client: 'Twiggs',
    before: "My deck is all splinters and one wobbly plank. I can't even see the stars!",
    after: "Look at that view! I can see Mossy Lane from up here.",
    backdrop: 'treedeck',
    reward: 150,
    slots: [
      { id: 'td-ladder', name: 'Rope Ladder', cost: 1, x: 140, y: 500, w: 120, h: 360, art: 'ladder', variants: [v('Hemp Rope', 0xc8a26a, 0x8a5a2b, 0xe8d8b0), v('Vine Rope', 0x4fa64a, 0x2a6a2a, 0xffb3d1), v('Ribbon Rope', 0xff5a5a, 0x8a5a2b, 0xffd23f)] },
      { id: 'td-rail', name: 'Deck Railing', cost: 2, x: 540, y: 470, w: 760, h: 110, art: 'railing', variants: [v('Branch Rails', 0x8a5a2b, 0x5a3a1a, 0x6fbf4a), v('Painted Rails', 0xfaf6ee, 0x3fa9ff, 0xffd23f), v('Bamboo Rails', 0xd9c06a, 0x8a7a2a, 0x4fa64a)] },
      { id: 'td-hammock', name: 'Hammock', cost: 2, x: 520, y: 330, w: 340, h: 150, art: 'hammock', variants: [v('Striped', 0xe0393e, 0xfaf6ee, 0x8a5a2b), v('Leaf Weave', 0x4fa64a, 0xbfff7a, 0x5a3a1a), v('Sunset', 0xff8a1a, 0xffd23f, 0x8a2a8a)] },
      { id: 'td-birdhouse', name: 'Birdhouse', cost: 3, x: 860, y: 210, w: 140, h: 200, art: 'birdhouse', variants: [v('Robin Red', 0xe0393e, 0xfaf6ee, 0x8a5a2b), v('Bluebird', 0x3fa9ff, 0xffd23f, 0x5a3a1a), v('Acorn Cap', 0xc8792b, 0x5a3a1a, 0x4fd65a)] },
      { id: 'td-scope', name: 'Telescope', cost: 3, x: 800, y: 570, w: 170, h: 200, art: 'telescope', variants: [v('Brass', 0xd9a03b, 0x5a3a1a, 0xbfe8ff), v('Starry Navy', 0x2a2a6a, 0xffd23f, 0xffffff), v('Copper Leaf', 0xd9823b, 0x4fa64a, 0xbfe8ff)] },
    ],
  },
  {
    id: 'treebed',
    name: 'Treetop Bedroom',
    client: 'Hazel',
    before: "I sleep on a pile of leaves. Every time the wind blows, my bed blows away.",
    after: "Snug as an acorn. I'll sleep till noon!",
    backdrop: 'treebed',
    reward: 200,
    slots: [
      { id: 'tb-rug', name: 'Leaf Rug', cost: 2, x: 500, y: 630, w: 420, h: 100, art: 'rug', variants: [v('Maple', 0xff8a1a, 0xc0392b, 0xffd23f), v('Fern', 0x4fa64a, 0x2a6a2a, 0xbfff7a), v('Lavender', 0x9a7ad9, 0x5a3a8a, 0xfaf6ee)] },
      { id: 'tb-bed', name: 'Bed', cost: 2, x: 330, y: 500, w: 360, h: 220, art: 'bed', variants: [v('Patchwork Quilt', 0xff7a1a, 0x8a5a2b, 0x3fa9ff), v('Moss Duvet', 0x4fa64a, 0x5a3a1a, 0xfaf6ee), v('Moonlight', 0x2a2a6a, 0xd9d0e8, 0xffd23f)] },
      { id: 'tb-window', name: 'Knothole Window', cost: 3, x: 500, y: 210, w: 220, h: 220, art: 'knothole', variants: [v('Morning Sky', 0xbfe8ff, 0x8a5a2b, 0xffd23f), v('Starry Night', 0x2a2a6a, 0x5a3a1a, 0xffffff), v('Stained Leaf', 0x7affc0, 0x6b3a2a, 0xff4dd2)] },
      { id: 'tb-stand', name: 'Nightstand', cost: 3, x: 700, y: 540, w: 140, h: 190, art: 'nightstand', variants: [v('Oak & Candle', 0x8a5a2b, 0xfaf6ee, 0xfff27a), v('Mushroom & Glow', 0xe0393e, 0xfaf6ee, 0x7affff), v('Birch & Lantern', 0xe8d8b0, 0x4fa64a, 0xff7a1a)] },
      { id: 'tb-mobile', name: 'Acorn Mobile', cost: 3, x: 820, y: 200, w: 200, h: 220, art: 'mobile', variants: [v('Acorns', 0xc8792b, 0x5a3a1a, 0x4fd65a), v('Stars', 0xffd23f, 0xfaf6ee, 0x3fa9ff), v('Feathers', 0xff4d6d, 0x3fa9ff, 0xfaf6ee)] },
    ],
  },
  {
    id: 'treeshop',
    name: 'Acorn Workshop',
    client: 'Old Burl',
    before: "Sixty years of tinkering, and I still can't find my hammer in this mess.",
    after: "Everything in its place! Now, where did I put my spectacles...",
    backdrop: 'treeshop',
    reward: 250,
    slots: [
      { id: 'ts-bench', name: 'Workbench', cost: 2, x: 480, y: 540, w: 380, h: 190, art: 'workbench', variants: [v('Oak Top', 0x8a5a2b, 0x5a3a1a, 0x9a9aa6), v('Painted Green', 0x4fa64a, 0x2a5a2a, 0xffd23f), v('Stump Slab', 0xa0622d, 0x6b3a1a, 0xe8d8b0)] },
      { id: 'ts-tools', name: 'Tool Rack', cost: 2, x: 480, y: 250, w: 340, h: 170, art: 'toolrack', variants: [v('Pegboard', 0xd9a066, 0x6d6d78, 0xe0393e), v('Slate', 0x5d5d68, 0xd9d9e3, 0xffd23f), v('Bark Board', 0x6b3a2a, 0x9a9aa6, 0x4fd65a)] },
      { id: 'ts-lamp', name: 'Work Lamp', cost: 3, x: 110, y: 420, w: 100, h: 310, bx: 110, by: 330, art: 'lamp', variants: [v('Brass Lamp', 0xd9a03b, 0x3a3a3a, 0xfff27a), v('Toadstool Lamp', 0xe0393e, 0xfaf6ee, 0xfff27a), v('Firefly Lamp', 0x4fa64a, 0x3a3a3a, 0xbfff7a)] },
      { id: 'ts-barrels', name: 'Acorn Barrels', cost: 3, x: 830, y: 560, w: 220, h: 180, art: 'barrels', variants: [v('Oak Staves', 0x8a5a2b, 0x6d6d78, 0xc8792b), v('Red Hoops', 0xa0622d, 0xe0393e, 0xffd23f), v('Mossy', 0x6b5a3a, 0x4fa64a, 0xbfff7a)] },
      { id: 'ts-clock', name: 'Cuckoo Clock', cost: 3, x: 820, y: 220, w: 160, h: 230, art: 'cuckoo', variants: [v('Carved Walnut', 0x6b3a2a, 0xfaf6ee, 0xffd23f), v('Painted Chalet', 0xe0393e, 0xfaf6ee, 0x4fa64a), v('Birch Bark', 0xe8d8b0, 0x3a3a3a, 0x3fa9ff)] },
    ],
  },
];

/** Home 3, Shell Cove: a cottage by the sea. Art in houseArtCove.ts. */
const SHELL_COVE: HouseArea[] = [
  {
    id: 'covedock',
    name: 'Boat Dock',
    client: 'Captain Gnemo',
    before: "Arr, my dock is more hole than plank. My boat sank twice last week!",
    after: "Shipshape at last! The finest dock on seven ponds.",
    backdrop: 'covedock',
    reward: 200,
    slots: [
      { id: 'cd-pier', name: 'Pier', cost: 2, x: 420, y: 560, w: 640, h: 140, art: 'pier', variants: [v('Driftwood', 0xb8a080, 0x6b5a3a, 0xe8e0c8), v('Painted Planks', 0x3fa9ff, 0xfaf6ee, 0xe0393e), v('Weathered Grey', 0x9a9aa6, 0x5d5d68, 0xd9d9e3)] },
      { id: 'cd-boat', name: 'Rowboat', cost: 2, x: 780, y: 610, w: 260, h: 120, art: 'rowboat', variants: [v('Sailor Red', 0xe0393e, 0xfaf6ee, 0x8a5a2b), v('Sea Green', 0x3fa68a, 0xfaf6ee, 0xffd23f), v('Sunshine', 0xffd23f, 0x3fa9ff, 0xfaf6ee)] },
      { id: 'cd-lamp', name: 'Harbour Lamp', cost: 3, x: 140, y: 380, w: 110, h: 320, art: 'harbourlamp', variants: [v('Iron Post', 0x3a3a42, 0xfff27a, 0x9a9aa6), v('Brass Post', 0xd9a03b, 0xfff27a, 0x5a3a1a), v('Striped Post', 0xe0393e, 0xfaf6ee, 0xfff27a)] },
      { id: 'cd-nets', name: 'Fishing Nets', cost: 3, x: 480, y: 300, w: 320, h: 180, art: 'nets', variants: [v('Rope Net', 0xc8a26a, 0xe0393e, 0x3fa9ff), v('Blue Net', 0x3f6aff, 0xffd23f, 0xfaf6ee), v('Kelp Net', 0x4fa64a, 0xff7a1a, 0xe8e0c8)] },
      { id: 'cd-crates', name: 'Lobster Pots', cost: 3, x: 230, y: 590, w: 200, h: 140, art: 'lobsterpots', variants: [v('Wicker', 0xc8a26a, 0x8a5a2b, 0xe0393e), v('Painted Teal', 0x3fa68a, 0xfaf6ee, 0xff7a1a), v('Tar Black', 0x3a3a42, 0xc8a26a, 0xffd23f)] },
    ],
  },
  {
    id: 'covebath',
    name: 'Seashell Bathroom',
    client: 'Pearl',
    before: "My bath is a bucket. A BUCKET. A lady deserves bubbles!",
    after: "Bubbles for days! I may never come out.",
    backdrop: 'covebath',
    reward: 250,
    slots: [
      { id: 'cb-mat', name: 'Bath Mat', cost: 2, x: 500, y: 640, w: 380, h: 90, art: 'rug', variants: [v('Seafoam', 0x7ad9c0, 0x3a8a6a, 0xfaf6ee), v('Coral', 0xff7a6a, 0xc0392b, 0xffd23f), v('Sandy', 0xe8d8b0, 0xb8a080, 0x3fa9ff)] },
      { id: 'cb-tub', name: 'Clawfoot Tub', cost: 3, x: 420, y: 510, w: 400, h: 200, art: 'bathtub', variants: [v('Pearl White', 0xfaf6ee, 0xd9a03b, 0xbfe8ff), v('Ocean Blue', 0x3f6aff, 0xfaf6ee, 0xbfe8ff), v('Blush Pink', 0xffb3d1, 0xd9a03b, 0xbfe8ff)] },
      { id: 'cb-mirror', name: 'Shell Mirror', cost: 3, x: 420, y: 210, w: 220, h: 240, art: 'shellmirror', variants: [v('Scallop', 0xffc8a0, 0xd9823b, 0xbfe8ff), v('Conch Pink', 0xffb3d1, 0xd96a9a, 0xbfe8ff), v('Abalone', 0x7ad9ff, 0x8a4dff, 0xffffff)] },
      { id: 'cb-towels', name: 'Towel Rack', cost: 3, x: 800, y: 380, w: 180, h: 220, art: 'towelrack', variants: [v('Stripes', 0x3fa9ff, 0xfaf6ee, 0xd9a03b), v('Lemon', 0xffd23f, 0xfaf6ee, 0x9a9aa6), v('Fluffy Mint', 0x8ae0c0, 0xfaf6ee, 0xd9a03b)] },
      { id: 'cb-plant', name: 'Potted Fern', cost: 3, x: 800, y: 590, w: 150, h: 180, art: 'fern', variants: [v('Terracotta', 0x4fa64a, 0xc0623b, 0xffd23f), v('Shell Pot', 0x3fa64a, 0xffc8a0, 0xfaf6ee), v('Blue Glaze', 0x6fbf4a, 0x3f6aff, 0xfaf6ee)] },
    ],
  },
  {
    id: 'covebeach',
    name: 'Rock Pool Garden',
    client: 'Shelly',
    before: "The tide left seaweed everywhere and a crab moved into my chair.",
    after: "Sun, sand and not a single crab. Pure bliss!",
    backdrop: 'covebeach',
    reward: 300,
    slots: [
      { id: 'cg-path', name: 'Shell Path', cost: 2, x: 500, y: 620, w: 300, h: 150, art: 'path', variants: [v('Sea Glass', 0x7ad9c0, 0xe8e0c8, 0x3fa9ff), v('Cockle Shells', 0xffc8a0, 0xe8e0c8, 0xffb3d1), v('Pebbles', 0x9a9aa6, 0xe8e0c8, 0x5d5d68)] },
      { id: 'cg-pool', name: 'Rock Pool', cost: 3, x: 200, y: 540, w: 300, h: 160, art: 'rockpool', variants: [v('Starfish', 0x3fa9ff, 0x9a9aa6, 0xff7a1a), v('Anemones', 0x3fa68a, 0x7a6a5a, 0xff4dd2), v('Glowing Pool', 0x4dfff0, 0x5d5d68, 0xffd23f)] },
      { id: 'cg-chair', name: 'Deck Chair', cost: 3, x: 780, y: 540, w: 200, h: 180, art: 'deckchair', variants: [v('Red Stripe', 0xe0393e, 0xfaf6ee, 0x8a5a2b), v('Blue Stripe', 0x3fa9ff, 0xfaf6ee, 0xd9c06a), v('Lemon Stripe', 0xffd23f, 0x4fa64a, 0xfaf6ee)] },
      { id: 'cg-parasol', name: 'Parasol', cost: 3, x: 700, y: 320, w: 280, h: 340, bx: 760, by: 220, art: 'parasol', variants: [v('Circus', 0xe0393e, 0xfaf6ee, 0xffd23f), v('Lagoon', 0x3fa9ff, 0x7ad9c0, 0xfaf6ee), v('Palm Leaf', 0x4fa64a, 0xbfff7a, 0x8a5a2b)] },
      { id: 'cg-chime', name: 'Wind Chime', cost: 3, x: 260, y: 230, w: 160, h: 240, art: 'windchime', variants: [v('Shell Chime', 0xffc8a0, 0x8a5a2b, 0xfaf6ee), v('Sea Glass', 0x7ad9c0, 0x5a3a1a, 0x3fa9ff), v('Bamboo', 0xd9c06a, 0x8a7a2a, 0xe0393e)] },
    ],
  },
];

export interface Home {
  id: string; // 'mossy'
  name: string; // 'Mossy Lane'
  /** One line for the Homes map. */
  blurb: string;
  /** Card colour on the Homes map. 0xRRGGBB. */
  color: number;
  areas: HouseArea[];
}

/** The homes, in order. A home opens once every area of the one before it is built (Project Makeover style). */
export const HOMES: Home[] = [
  { id: 'mossy', name: 'Mossy Lane', blurb: 'A yard, a mushroom cottage and two cosy rooms.', color: 0x4fa64a, areas: MOSSY_LANE },
  { id: 'oakwood', name: 'Oakwood Treehouse', blurb: 'A deck, a bedroom and a workshop up an old oak.', color: 0xc8792b, areas: OAKWOOD },
  { id: 'cove', name: 'Shell Cove', blurb: 'A dock, a bathroom and a beach garden by the sea.', color: 0x3fa9ff, areas: SHELL_COVE },
];

/** Every area of every home, in play order. */
export const AREAS: HouseArea[] = HOMES.flatMap((h) => h.areas);

/** The home an area belongs to. */
export function homeOf(area: HouseArea): Home {
  return HOMES.find((h) => h.areas.includes(area)) ?? HOMES[0];
}

export function homeDone(home: Home, built: Record<string, number>): boolean {
  return home.areas.every((a) => areaDone(a, built));
}

/** A home is open when it is the first, or the home before it is done. */
export function homeOpen(index: number, built: Record<string, number>): boolean {
  return index <= 0 || homeDone(HOMES[index - 1], built);
}

/** The first area with an unbuilt slot, or null when the whole house is done. */
export function currentArea(built: Record<string, number>): HouseArea | null {
  return AREAS.find((a) => a.slots.some((s) => built[s.id] === undefined)) ?? null;
}

export function areaDone(area: HouseArea, built: Record<string, number>): boolean {
  return area.slots.every((s) => built[s.id] !== undefined);
}
