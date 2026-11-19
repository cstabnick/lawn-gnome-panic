// New prefabs for peak-climb. One owner (the peak-climb adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

export const PEAK_CLIMB: readonly PrefabDef[] = [
  {
    id: 'piton',
    name: 'Piton',
    category: 'prop',
    uses: ['place'],
    tags: ['piton', 'anchor', 'spike', 'climb', 'rock', 'gold'],
    emoji: [],
    about: 'A gold spike with a glowing ring at its head, stuck out from the rock. Spike points along +z, so look-at the wall normal to place it.',
    examine: [
      'A short gold spike with a bright ring at its head, hammered into the rock until only the ring shows.',
      'Saying: "Hammer it with a stone, and trust the stone more than the hammer."',
      'Tip: rest your weight on it for a moment, and your legs will thank you for the favour.',
      'Gnomes say the gold is thin leaf over iron, and the rock never asks which.',
      'Nobody remembers who put the first one in. Every climber swears it was someone else.',
    ],
    parts: [
      { s: 'ring', d: [0.12, 0.02], at: [0, 0.14, 0], c: 'spark', glow: true },
      { s: 'cyl', d: [0.05, 0.02, 0.45], at: [0, 0.14, 0.225], rot: [90, 0, 0], c: 'gold', glow: true, seg: 6 },
    ],
  },
  {
    id: 'ping-marker',
    name: 'Ping Marker',
    category: 'prop',
    uses: ['place'],
    tags: ['ping', 'marker', 'beacon', 'signal', 'light', 'climb'],
    emoji: [],
    tint: 'gold',
    about: 'A glowing diamond on a thin beam of light, placed by a climber to mark a spot. Diamond and beam take the tint (the climber colour).',
    examine: [
      'A bright diamond of light on a thin pillar of glow, the sort you can see from the next ledge.',
      'Saying: "Where the light stands up, a friend is waiting for you."',
      'Tip: a ping is only a shout made of light. Shout only when you mean it.',
      'It hums quietly to itself, which is more than most gnome companions do on a long climb.',
      'The beam is not heavy. Gnomes have tried to climb it, and come down rather quickly.',
    ],
    parts: [
      { s: 'ball', d: [0.32], at: [0, 0.32, 0], c: 'tint', glow: true, seg: 4 },
      { s: 'cyl', d: [0.06, 0.06, 2.8], at: [0, 1.4, 0], c: 'tint', glow: true, alpha: 0.45, seg: 8 },
    ],
  },
];
