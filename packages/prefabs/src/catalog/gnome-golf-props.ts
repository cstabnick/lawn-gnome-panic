// New prefabs for gnome-golf. One owner (the gnome-golf adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

export const GNOME_GOLF_PROPS: readonly PrefabDef[] = [
  {
    id: 'golf-ball', name: 'Golf Ball', category: 'prop', uses: ['place', 'throw'],
    tags: ['golf', 'ball', 'dimpled', 'white', 'sport', 'putt', 'drive'], emoji: [],
    about: 'A white golf ball, drawn at its natural size. The game scales it up when several balls must read from one camera.',
    examine: [
      'A small white ball with a pattern of dimples, which is the only reason it flies straight at all.',
      'Gnomes say a ball with no dimples goes where it likes. Gnomes say a lot of things.',
      'Keep your eye on it. It does not keep its eye on you.',
      'Four or five of these in a bag, and somehow always one that has been in the lake.',
    ],
    parts: [
      { s: 'ball', d: [0.016], at: [0, 0.016, 0], c: 0xffffff, seg: 12 },
    ],
  },
  {
    id: 'golf-tee', name: 'Golf Tee', category: 'prop', uses: ['place'],
    tags: ['golf', 'tee', 'peg', 'stick', 'ball', 'drive'], emoji: [],
    about: 'The short white peg a golf ball sits on for the first shot of a hole.',
    examine: [
      'A white peg, no taller than a finger, that holds the ball up off the grass for the first shot.',
      'Gnome tip: the tee is for the drive only. Putts stay on the grass where they belong.',
      'Put it in too deep and the ball rides too low. Put it in too shallow and the ball falls off.',
      'Nobody has ever found a tee that was not already in the pocket of someone else.',
    ],
    parts: [
      { s: 'cyl', d: [0.015, 0.015, 0.06], at: [0, 0.03, 0], c: 0xffffff, seg: 8 },
    ],
  },
];
