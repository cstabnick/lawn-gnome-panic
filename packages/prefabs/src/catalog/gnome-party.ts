// New prefabs for gnome-party. One owner (the gnome-party adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

export const GNOME_PARTY: readonly PrefabDef[] = [
  {
    id: 'party-board-space', name: 'Party Board Space', category: 'prop', uses: ['place'],
    tags: ['board', 'space', 'tile', 'disc', 'step', 'party'], emoji: [], tint: 0x3d7bff,
    about: 'A flat round board tile, 1.1 across and 0.12 high. Default blue; pass tint for red spaces.',
    examine: [
      'A flat round tile, painted in one bright colour, set into the board so its edge just shows.',
      'Gnome rule: a space is a space. What happens on it is the board\'s business, not the tile\'s.',
      'Stand on the tile with both feet. The paint is only a coat, and it comes off on wet boots.',
      'Someone scratched a tally into the rim. Nobody remembers whose, or what it was counting.',
      'Every tile is the same height, which is the one thing the gnomes agree on about the board.',
    ],
    parts: [
      { s: 'cyl', d: [0.55, 0.55, 0.12], at: [0, 0.06, 0], c: 'tint', seg: 12 },
    ],
  },
  {
    id: 'party-star', name: 'Party Star', category: 'prop', uses: ['place'],
    tags: ['star', 'gold', 'marker', 'bonus', 'party', 'octahedron'], emoji: [],
    about: 'A gold octahedron star, 0.9 tall and wide, built from two square pyramids. Origin at the bottom point.',
    examine: [
      'A gold star with eight faces and six points, which is two more points than a gnome thinks a star needs.',
      'Old party saying: "Buy a star, and the board will remember you, if nobody else does."',
      'Hold it up to the light. The glow is real, but it is only the paint catching the sun.',
      'It spins on the board to show it is for sale. A star that stops spinning has been bought, or dropped.',
      'Somebody carved a small smiling face into one point. The other five points have never forgiven them.',
    ],
    parts: [
      { s: 'cone', d: [0.45, 0.45], at: [0, 0.225, 0], rot: [180, 0, 0], c: 0xffd54f, glow: true, seg: 4 },
      { s: 'cone', d: [0.45, 0.45], at: [0, 0.675, 0], c: 0xffd54f, glow: true, seg: 4 },
    ],
  },
];
