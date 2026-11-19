// New prefabs for gnome-front. One owner (the gnome-front adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

export const GNOME_FRONT_BATTLE: readonly PrefabDef[] = [
  {
    id: 'pinecone-grenade', name: 'Pinecone Grenade', category: 'material', uses: ['throw'],
    tags: ['pinecone', 'grenade', 'throw', 'thrown', 'pine', 'wood', 'ammo', 'front'], emoji: ['🌲'],
    about: 'Gnome Front: a pinecone thrown as a grenade. A brown cone-shaped nut with a point at the top. Built at scale 2.4 in the game.',
    examine: [
      'A brown pinecone with its scales folded tight, small enough to hold in one hand and heavy enough to matter.',
      'Old saying: "Never throw a pinecone uphill, and never throw one at a friend who is also uphill."',
      'Thrown underarm, it flies in a neat arc. Thrown by a panicking gnome, it flies in any direction at all.',
      'Pinecones are the cheapest grenade on the Front, which is why every army on the Front has too many of them.',
      'The pointed end always lands first. Gnomes disagree about whether this is a design feature or bad luck.',
    ],
    parts: [
      { s: 'ball', d: [0.05], at: [0, 0.0625, 0], scale: [1, 1.25, 1], c: 0x6b4a2e, seg: 8 },
      { s: 'ball', d: [0.025], at: [0, 0.135, 0], scale: [1, 1.2, 1], c: 0x4f3a28, seg: 6 },
      { s: 'ball', d: [0.018], at: [0.03, 0.04, 0.01], scale: [1, 0.6, 1], c: 0x8a5e34, seg: 6 },
    ],
  },
];
