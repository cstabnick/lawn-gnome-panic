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

export const AREAS: HouseArea[] = [
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

/** The first area with an unbuilt slot, or null when the whole house is done. */
export function currentArea(built: Record<string, number>): HouseArea | null {
  return AREAS.find((a) => a.slots.some((s) => built[s.id] === undefined)) ?? null;
}

export function areaDone(area: HouseArea, built: Record<string, number>): boolean {
  return area.slots.every((s) => built[s.id] !== undefined);
}
