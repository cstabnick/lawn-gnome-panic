// Gnome Theft Auto: Hedgeworth Links to nine holes (batch 3 E32): the Bottom Garden's structures (thin hedge walls, the Turn Gate).
import type { Part, PrefabDef } from '../types';

// A clipped hedge wall, 4 m long (x), 3.2 m tall, 1.2 m deep (z): a dark base, a body in two greens and an uneven top.
const hedgeWallParts: Part[] = [
  { s: 'box', d: [4.0, 0.8, 1.2], at: [0, 0.4, 0], c: 0x1f4d20 },                       // darker base
  { s: 'box', d: [3.94, 1.9, 1.12], at: [0, 1.7, 0], c: 'leaf-dark' },                  // clipped body
  { s: 'box', d: [1.5, 0.45, 1.0], at: [-1.2, 2.97, 0], c: 'leaf-dark' },               // uneven top, three blocks
  { s: 'box', d: [1.4, 0.38, 1.04], at: [0.25, 2.94, 0], c: 'leaf' },
  { s: 'box', d: [1.0, 0.5, 0.98], at: [1.45, 2.95, 0], c: 'leaf-dark' },
  { s: 'box', d: [1.3, 0.7, 0.04], at: [-1.2, 1.5, 0.575], c: 'leaf' },                 // lighter patches, front
  { s: 'box', d: [1.1, 0.8, 0.04], at: [1.0, 2.1, 0.575], c: 'leaf' },
  { s: 'box', d: [0.9, 0.6, 0.04], at: [0.1, 1.2, 0.575], c: 0x3f8a33 },
  { s: 'box', d: [1.2, 0.7, 0.04], at: [0.8, 1.6, -0.575], c: 'leaf' },                 // and back
  { s: 'box', d: [1.0, 0.6, 0.04], at: [-1.1, 2.2, -0.575], c: 0x3f8a33 },
];
// Leaf-clump bumps on the top and both faces.
for (const [x, y, z] of [[-1.6, 3.0, 0.1], [-0.4, 3.0, -0.15], [0.7, 2.98, 0.2], [1.6, 3.0, -0.1], [-0.9, 2.98, 0.25]] as const) {
  hedgeWallParts.push({ s: 'ball', d: [0.26], at: [x, y, z], scale: [1.2, 0.65, 1], c: (x + z) > 0.4 ? 'leaf' : 'leaf-dark', seg: 8 });
}
for (const [x, y, z, c] of [[-1.5, 2.2, 0.56, 'leaf'], [-0.3, 2.5, 0.56, 'leaf-dark'], [1.4, 1.4, 0.56, 'leaf'],
  [0.9, 2.4, -0.56, 'leaf'], [-1.3, 1.1, -0.56, 'leaf-dark'], [0.1, 1.9, -0.56, 'leaf']] as const) {
  hedgeWallParts.push({ s: 'ball', d: [0.22], at: [x, y, z], scale: [1.2, 0.9, 0.5], c, seg: 8 });
}

// The Turn Gate: two posts 6.2 m apart, the arch board across them, one gate leaf swung open against the west post.
const turnGateParts: Part[] = [
  { s: 'box', d: [0.3, 2.2, 0.3], at: [3.1, 1.1, 0], c: 'tint', mirror: true },          // posts
  { s: 'box', d: [0.4, 0.1, 0.4], at: [3.1, 2.25, 0], c: 'wood-dark', mirror: true },    // post caps
  { s: 'box', d: [6.5, 0.5, 0.16], at: [0, 2.5, 0], c: 'tint' },                         // arch board (no text; added in code)
  { s: 'box', d: [6.5, 0.07, 0.24], at: [0, 2.78, 0], c: 'wood-dark' },                  // its cap rail
  { s: 'box', d: [0.12, 0.35, 0.26], at: [2.2, 2.2, 0], c: 'wood-dark', rot: [0, 0, 45], mirror: true },  // brace
  // The open leaf: hinged at the west post, swung to lie along z (pointing south), a metre of garden between it and the way through.
  { s: 'box', d: [0.07, 0.12, 2.9], at: [-2.78, 0.4, 1.6], c: 'wood-dark' },              // rails
  { s: 'box', d: [0.07, 0.12, 2.9], at: [-2.78, 1.3, 1.6], c: 'wood-dark' },
  { s: 'box', d: [0.09, 0.14, 2.9], at: [-2.78, 0.85, 1.6], c: 'wood-dark' },
  { s: 'box', d: [0.07, 0.1, 3.3], at: [-2.76, 0.85, 1.6], c: 'wood-dark', rot: [-18, 0, 0] },  // diagonal brace
  { s: 'box', d: [0.2, 0.06, 0.06], at: [-2.9, 1.3, 0.12], c: 'wood-dark' },              // hinges
  { s: 'box', d: [0.2, 0.06, 0.06], at: [-2.9, 0.4, 0.12], c: 'wood-dark' },
];
for (let i = 0; i < 9; i++) {
  turnGateParts.push({ s: 'box', d: [0.05, 1.3 + (i % 2) * 0.08, 0.2], at: [-2.72, 0.85, 0.35 + i * 0.32], c: 'tint' });  // pickets
}

export const GTA_GOLF_NINE_GARDEN: readonly PrefabDef[] = [
  {
    id: 'hedge-wall', name: 'Hedge Wall', category: 'prop', uses: ['place'],
    tags: ['hedge', 'wall', 'clipped', 'maze', 'garden', 'leaf', 'green', 'gta', 'golf', 'hedgeworth'], emoji: [],
    footprint: { r: 2.1, h: 3.2 },
    about: 'Gnome Theft Auto: the Hedge Wall. Life-size metres, 4 m long (x), 3.2 m tall and 1.2 m deep (z). A clipped garden hedge in two greens with a darker base and leafy bumps on the top. Hedgeworth\'s walls and the maze are made of it.',
    examine: [
      'A clipped hedge as thin as the Tall One\'s patience, cut so square that a spirit level would apologise to it.',
      'Saying: a hedge is a wall that has agreed to be polite about it.',
      'Tip: you cannot see through it, over it or, with a golf ball, usually round it. Try the gap at the end.',
      'Joke: the hedge was trimmed at dawn, at noon and again at dusk, and still it grew back out of spite.',
      'A single leaf at head height has been left uncut. The Tall One calls it "character". The hedge calls it a hostage.',
    ],
    parts: hedgeWallParts,
  },
  {
    id: 'turn-gate', name: 'Turn Gate', category: 'prop', uses: ['place'],
    tags: ['gate', 'garden', 'wood', 'open', 'arch', 'turn', 'gta', 'golf', 'hedgeworth', 'boundary'], emoji: [],
    tint: 0x8a6a48,
    footprint: { r: 3.4, h: 2.8 },
    about: 'Gnome Theft Auto: the Turn Gate. Life-size metres: two wooden posts 2.2 m tall, 6.2 m apart, an arch board across the top (no text; the game adds the name plates) and one gate leaf swung open against the west post. Wood takes the tint.',
    examine: [
      'A wide garden gate left standing open, its one leaf swung back against the post, so long that the hinges have stopped hoping to be asked to close it.',
      'Saying: a gate that is always open is just two posts with an opinion.',
      'Tip: it is wide enough for a golf cart and two gnomes arguing about the shortcut.',
      'Joke: the Tall One had the gate widened for the carts, and then had the carts widened, and nobody has measured since.',
      'The arch board used to say something. The weather, in its way, has had the last word.',
    ],
    parts: turnGateParts,
  },
];
