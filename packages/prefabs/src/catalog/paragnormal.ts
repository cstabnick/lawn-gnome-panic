// New prefabs for paragnormal. One owner (the paragnormal adoption issue): add entries here and nowhere else.
//
// The five Gnome-Soul monsters are authored at half size (K) so the tallest kind (the Hush, about 4.4 game units with
// its hat) fits the 3-unit cap on a prefab. games/paragnormal/src/view/monsters.ts builds them with scale 2, which
// gives back the game's own dimensions. The three props are authored at their real game size.
import type { Part, PrefabDef, Vec3 } from '../types';

const K = 0.5;
const k = (n: number): number => n * K;
const v = (x: number, y: number, z: number): Vec3 => [k(x), k(y), k(z)];

interface MonsterShape {
  id: string;
  name: string;
  about: string;
  examine: readonly string[];
  cloak: number;
  porcelain: number;
  cloakR: number;
  cloakH: number;
  coreY: number;
  low: boolean;
  shoulderY: number;
  headY: number;
  headZ: number;
  hatR: number;
  hatH: number;
  hatY: number;
  beard: boolean;
  hush: boolean;
  lamp: boolean;
}

function monsterDef(s: MonsterShape): PrefabDef {
  const hp = (x: number, y: number, z: number): Vec3 => v(x, s.headY + y, s.headZ + z);
  const parts: Part[] = [];

  // Tattered cloak, void core and hunched shoulders (game units in the comments, halved by k())
  parts.push({ s: 'cone', d: [k(s.cloakR), k(s.cloakH)], at: v(0, s.cloakH / 2, 0), c: 'tint', seg: 9 });
  parts.push({
    s: 'cyl', d: [k(0.32), k(0.55), k(2.2)], at: v(0, s.coreY, 0), c: 0x050608, glow: true, seg: 8,
    ...(s.low ? { scale: [1.3, 0.55, 1.3] as Vec3 } : {}),
  });
  parts.push({ s: 'ball', d: [k(0.56)], at: v(0, s.shoulderY, 0), scale: [1.25, 0.75, 0.85], c: 'tint' });

  // Head: a pivot group named 'head' that the game tilts. Children are placed at absolute coordinates; buildPrefab
  // subtracts the pivot for them.
  parts.push({ s: 'ball', d: [k(0.4)], at: hp(0, 0, 0), scale: [0.92, 1.08, 0.88], c: 'trim', group: 'head' });
  if (s.beard) {
    parts.push({ s: 'cone', d: [k(0.38), k(0.9)], at: hp(0, -0.45, 0.16), rot: [180, 0, 0], c: 0x454852, group: 'head', seg: 7 });
  } else {
    parts.push({ s: 'box', d: [k(0.07), k(0.3), k(0.07)], at: hp(0, -0.14, 0.4), c: 'trim', group: 'head' });
  }
  if (s.hush) {
    parts.push({ s: 'box', d: [k(0.16), k(0.025), k(0.04)], at: hp(0.14, 0.06, 0.36), c: 0xffffff, glow: true, name: 'eye', mirror: true, group: 'head' });
  } else {
    parts.push({ s: 'ball', d: [k(0.07)], at: hp(0.14, 0.06, 0.34), c: 0xffffff, glow: true, name: 'eye', mirror: true, group: 'head', seg: 6 });
  }
  parts.push({ s: 'cone', d: [k(s.hatR), k(s.hatH)], at: hp(0, s.hatY, -0.04), rot: [-4.6, 0, 8.0], c: 0x2c1b24, group: 'head', seg: 9 });

  if (s.lamp) {
    // A long brass snuffer pole with a cup on the end, held out to one side
    parts.push({ s: 'cyl', d: [k(0.03), k(0.03), k(2.4)], at: v(0.72, 1.45, 0.2), rot: [0, 0, -4.6], c: 'brass', seg: 6 });
    parts.push({ s: 'cone', d: [k(0.14), k(0.22)], at: v(0.72, 2.7, 0.2), c: 'brass', seg: 8 });
  }

  if (s.low) {
    // Four jointed legs that splay out under the cloak. Each is a named part; monsters.ts swings the mesh itself.
    const legs: readonly (readonly [number, number, number])[] = [
      [-0.55, 0.45, 40.1], [0.55, 0.45, -40.1], [-0.6, -0.4, 45.8], [0.6, -0.4, -45.8],
    ];
    legs.forEach(([x, z, rz], i) => {
      parts.push({ s: 'cyl', d: [k(0.045), k(0.03), k(1.1)], at: v(x, 0.45, z), rot: [0, 0, rz], c: 'trim', name: `leg-${i}`, seg: 5 });
    });
  }

  return {
    id: s.id,
    name: s.name,
    category: 'prop',
    uses: ['place'],
    tags: ['paragnormal', 'gnome-soul', 'monster', 'creature'],
    emoji: [],
    tint: s.cloak,
    trim: s.porcelain,
    about: s.about,
    examine: s.examine,
    pivots: { head: v(0, s.headY, s.headZ) },
    parts,
  };
}

const MONSTERS: readonly PrefabDef[] = [
  monsterDef({
    id: 'monster-hollow-gardener', name: 'The Hollow Gardener',
    about: 'A Gnome-Soul monster: tattered cloak, porcelain face, cyan soul-eyes. Built at half size; monsters.ts scales it by 2.',
    examine: [
      'A towering figure in a tattered cloak, with a hollow porcelain face and a crooked gnome hat pulled down over it.',
      'Its cyan soul-eyes glow under the hat brim, and a dark beard of wisps hangs from its chin.',
      'Gnomes say it tends the gardens of the house. Nobody has ever seen it plant anything.',
      'It listens for small boots under the table, and it does not stop listening until the lantern goes out.',
    ],
    cloak: 0x1b1e26, porcelain: 0x8f8a82, cloakR: 0.82, cloakH: 2.5, coreY: 1.15, low: false,
    shoulderY: 2.25, headY: 2.72, headZ: 0.08, hatR: 0.54, hatH: 1.35, hatY: 0.78,
    beard: true, hush: false, lamp: false,
  }),
  monsterDef({
    id: 'monster-porcelain-watcher', name: 'The Porcelain Watcher',
    about: 'A Gnome-Soul monster that watches from its place: the same frame as the Hollow Gardener, with a steadier stare.',
    examine: [
      'The same tattered cloak and hunched shoulders as its cousins, but the porcelain face is turned toward you.',
      'Its soul-eyes are the cool cyan of a lit bell, and they do not blink, because it has no eyelids to close.',
      'Old rhyme: "Three bells, and the third one counts you." Gnomes do not finish the rhyme.',
      'Its hat sits a little crooked, as if it was set down in a hurry and never straightened.',
    ],
    cloak: 0x1b1e26, porcelain: 0x8f8a82, cloakR: 0.82, cloakH: 2.5, coreY: 1.15, low: false,
    shoulderY: 2.25, headY: 2.72, headZ: 0.08, hatR: 0.54, hatH: 1.35, hatY: 0.78,
    beard: true, hush: false, lamp: false,
  }),
  monsterDef({
    id: 'monster-the-lamplighter', name: 'The Lamplighter',
    about: 'A Gnome-Soul monster, tall and thin, with a brass snuffer pole held out to one side. Amber eyes.',
    examine: [
      'A tall, thin shape in a dark cloak, with a brass snuffer pole held out to one side like a long unlit taper.',
      'Its tall snuffer cap sits on a porcelain face, and its amber eyes watch the flame in your lantern.',
      'It cannot keep a flame lit, so it carries the brass cup and tries anyway. Gnomes find this sad, then frightening.',
      'Pretty flame, let it gutter, it says in a voice like a dropped match. Do not answer it.',
    ],
    cloak: 0x2a1f1a, porcelain: 0x9a8a72, cloakR: 0.62, cloakH: 2.8, coreY: 1.15, low: false,
    shoulderY: 2.25, headY: 2.95, headZ: 0.08, hatR: 0.42, hatH: 1.7, hatY: 0.95,
    beard: true, hush: false, lamp: true,
  }),
  monsterDef({
    id: 'monster-dripping-nanny', name: 'The Dripping Nanny',
    about: 'A low Gnome-Soul monster that crawls on four jointed legs under the furniture. Built with named leg parts.',
    examine: [
      'A wide, low cloak of wet clay and dark cloth, held up on four jointed legs that scrape the floor.',
      'Its porcelain head hangs close to the boards, and its soul-eyes glow green under the sofa edge.',
      'Gnomes say it is the house\'s nanny. It drips where it has been, and the drips never dry.',
      'Drip... drip... under the bed, it says. Keep your boots under you and do not stop to listen.',
    ],
    cloak: 0x161d1b, porcelain: 0x6f7a72, cloakR: 1.0, cloakH: 1.7, coreY: 0.7, low: true,
    shoulderY: 1.25, headY: 1.6, headZ: 0.45, hatR: 0.54, hatH: 1.35, hatY: 0.78,
    beard: true, hush: false, lamp: false,
  }),
  monsterDef({
    id: 'monster-the-hush', name: 'The Hush',
    about: 'A pale, very still Gnome-Soul monster with its eyes shut and one finger at its lips. Slit eyes.',
    examine: [
      'A pale, tall figure in a dark cloak, very still, with one long porcelain finger held to where the lips would be.',
      'Its eyes are shut to thin slits, and a pale light comes off the porcelain like frost on a window.',
      'The Hush silences the house around it. Gnomes say that the clock stops first, then the creaks, then the gnome.',
      'Hush... hush... no one is here, it breathes. Nobody has ever checked.',
    ],
    cloak: 0x23293a, porcelain: 0xc8d4de, cloakR: 0.5, cloakH: 2.7, coreY: 1.15, low: false,
    shoulderY: 2.25, headY: 2.95, headZ: 0.08, hatR: 0.54, hatH: 1.35, hatY: 0.78,
    beard: false, hush: true, lamp: false,
  }),
];

const PROPS: readonly PrefabDef[] = [
  {
    id: 'snare-bridge',
    name: 'Giant Brass Snare-Trap',
    category: 'prop',
    uses: ['place'],
    tags: ['paragnormal', 'trap', 'snare', 'brass', 'wood'],
    emoji: [],
    about: 'A wooden trap base with a raised brass jaw bar on a pivot. The jaw named "jaw" drops when the trap springs.',
    examine: [
      'A flat plank of old wood with a brass jaw bar raised above it, cocked and waiting for a small boot.',
      'The jaw is hinged at one end. When it springs, it drops flat with a ring that carries through the whole room.',
      'Gnomes have learned to step over the plank rather than on it, which is the only lesson the house teaches cheaply.',
      'Someone scratched a tally of near misses into the wood, and the tally is longer than the plank.',
    ],
    parts: [
      { s: 'box', d: [2.6, 0.14, 1.3], at: [0, 0.07, 0], c: 0x6b4726 },
      { s: 'box', d: [2.4, 0.12, 0.12], at: [0, 0.67, 0], c: 0xd4a438, group: 'jaw' },
    ],
    pivots: { jaw: [0, 0.67, 0] },
  },
  {
    id: 'soul-bell',
    name: 'Porcelain Soul-Bell',
    category: 'prop',
    uses: ['place'],
    tags: ['paragnormal', 'bell', 'porcelain', 'soul', 'sound'],
    emoji: [],
    about: 'A porcelain bell on a dark wooden stand. Its bell cone sits at the top; the game lights it from above.',
    examine: [
      'A tall dark stand topped with a flared porcelain bell, pale in the lantern light and cold to the touch.',
      'Nobody rings it. It rings itself when a soul is near, a single note that hangs in the air a long time.',
      'Gnomes say three bells in a ring are a warning. One bell is only a bell, and that is the worrying part.',
      'The bell is hollow and a little too thin. Tapping it with a fingernail makes a noise like a far-off apology.',
    ],
    parts: [
      { s: 'cyl', d: [0.06, 0.12, 0.9], at: [0, 0.45, 0], c: 0x3b2d26 },
      { s: 'cone', d: [0.26, 0.38], at: [0, 0.88, 0], c: 0xc8d8e8, seg: 10 },
    ],
  },
  {
    id: 'pet-door',
    name: 'Garden Pet-Door',
    category: 'prop',
    uses: ['place'],
    tags: ['paragnormal', 'door', 'pet-door', 'wood', 'exit'],
    emoji: [],
    about: 'A tall wooden door frame with a dark flap named "flap" that the game can light up when it opens.',
    examine: [
      'A tall wooden frame with a flap of dark cloth cut into the lower half, just big enough for a small gnome to crawl through.',
      'The flap is weighted at the bottom, and it sways a little whenever a draught finds the house.',
      'Garden pet-doors lead out, or so the gnomes tell each other, and the house has never corrected them.',
      'Once the bells are quiet, the flap glows a cool blue. Gnomes do not agree on whether that means safety.',
    ],
    parts: [
      { s: 'box', d: [1.7, 1.9, 0.18], at: [0, 0.95, 0], c: 0x3a2818 },
      { s: 'box', d: [1.35, 1.55, 0.08], at: [0, 0.85, 0], c: 0x1b2638, glow: true, name: 'flap' },
    ],
  },
];

export const PARAGNORMAL: readonly PrefabDef[] = [...MONSTERS, ...PROPS];
