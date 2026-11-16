// Named colours for prefab parts. Use a name when one fits, so the library reads as one set and a palette tweak
// recolours everything. Raw 0xRRGGBB numbers are fine for one-offs.

export const PALETTE = {
  // wood
  'wood': 0x9a6b3f, 'wood-dark': 0x5e3d22, 'wood-light': 0xc89b62, 'bark': 0x4f3a28, 'straw': 0xe0c56e,
  // metal
  'iron': 0x8a9097, 'iron-dark': 0x50565c, 'steel': 0xc3cbd3, 'rust': 0x9c4a22, 'copper': 0xc4703a,
  'brass': 0xc9a23f, 'gold': 0xffcc33, 'silver': 0xdfe6ec,
  // earth and stone
  'clay': 0xc4673e, 'clay-dark': 0x8f4428, 'terracotta': 0xd9814f, 'stone': 0x9a958c, 'stone-dark': 0x615d57,
  'slate': 0x4d5866, 'dirt': 0x6b4a2f, 'sand': 0xdcc79a, 'chalk': 0xeee9dc,
  // cloth and leather
  'leather': 0x7a4b2a, 'leather-dark': 0x4a2c18, 'cloth': 0xd8cfb8, 'burlap': 0xb0915e, 'wool': 0xefe6d6,
  'red': 0xc8352f, 'blue': 0x3466b8, 'green': 0x4f9a3c, 'yellow': 0xf0c63a, 'purple': 0x7d4bb0, 'orange': 0xe8822e,
  'pink': 0xe58fb0, 'black': 0x1d1d22, 'white': 0xf4f4f0,
  // garden
  'leaf': 0x5ca844, 'leaf-dark': 0x2f6e2a, 'moss': 0x6f8f3a, 'grass': 0x7cc44f, 'petal': 0xf2a3c4,
  'mushroom-cap': 0xc8402e, 'mushroom-stem': 0xf0e6d0, 'honey': 0xf1a81e,
  // magic and glass
  'glass': 0xbfe6ef, 'glaze-blue': 0x2f8fd0, 'glaze-green': 0x3fbf8a, 'ruby': 0xe0245e, 'emerald': 0x2fd07a,
  'sapphire': 0x3a6bff, 'amethyst': 0xa65cff, 'spark': 0xfff2a0, 'flame': 0xff7a1a, 'water': 0x4aa8e8,
  // paper
  'paper': 0xf3ead2, 'parchment': 0xe2cc98, 'ink': 0x26283a, 'wax': 0xb3202a,
  // creature bits
  'bone': 0xece3c8, 'shell': 0xd9c3a0, 'chitin': 0x2f3a2c, 'fur': 0x8c7a66, 'feather': 0xf0ece4,
} as const;

export type Swatch = keyof typeof PALETTE;

export function colorOf(c: Swatch | number): number {
  return typeof c === 'number' ? c : PALETTE[c];
}
