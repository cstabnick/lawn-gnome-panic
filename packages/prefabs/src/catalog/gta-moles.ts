// Gnome Theft Auto: the Burrowfolk (E17): mole figures for Loamdeep and the Burrow Door, DJ Moleman and his decks.
// Rules: docs/roadmaps/prefab-library/_common.md. Life-size metres, front on +z.
// Figures share one body plan (scaled by height `k`): pivots 'body', 'head', 'arm-l', 'arm-r'. Parts and pivots are absolute.
// Velvet grey is the figure's tint; the pink nose, paws and trim are the trim colour (pink).
import type { Part, PrefabDef, Vec3 } from '../types';

type Pt = (x: number, y: number, z: number) => Vec3;
interface Scale {
  /** Height scale: 1 is the 0.75 m burrowfolk mole. */
  k: number;
  /** Width scale for the body and shoulders. */
  w: number;
  /** Point-to-metres scaler for coordinates (scaled by k). */
  v: Pt;
  /** Radii and lengths (scaled by k). */
  r: (...d: number[]) => number[];
}

const scaler = (k: number, w: number): Scale => ({
  k,
  w,
  v: (x, y, z) => [x * k, y * k, z * k],
  r: (...d) => d.map((n) => n * k),
});

/** Shared mole body: pear body, two legs, round head with a pointed pink nose, tiny eyes, two arms with big paws. */
function moleBody(s: Scale, paw: number): Part[] {
  const { v, r, w } = s;
  return [
    { s: 'ball', d: r(0.22), scale: [w, 1.2, 0.92], at: v(0, 0.3, 0), c: 'tint', seg: 8, group: 'body' },
    { s: 'cyl', d: r(0.05, 0.045, 0.12), at: v(0.07 * w, 0.06, 0), c: 'tint', seg: 6, mirror: true, group: 'body' },
    { s: 'ball', d: r(0.15), at: v(0, 0.6, 0), c: 'tint', seg: 8, group: 'head' },
    { s: 'cone', d: r(0.035, 0.07), rot: [90, 0, 0], at: v(0, 0.585, 0.16), c: 'trim', seg: 6, group: 'head' },
    { s: 'ball', d: r(0.018), at: v(0.055, 0.63, 0.135), c: 'black', seg: 6, mirror: true, group: 'head' },
    { s: 'cyl', d: r(0.045, 0.038, 0.18), at: v(-0.23 * w, 0.25, 0), c: 'tint', seg: 6, group: 'arm-l' },
    { s: 'ball', d: r(0.06 * paw), at: v(-0.23 * w, 0.14, 0.03), c: 'trim', seg: 6, group: 'arm-l' },
    { s: 'cyl', d: r(0.045, 0.038, 0.18), at: v(0.23 * w, 0.25, 0), c: 'tint', seg: 6, group: 'arm-r' },
    { s: 'ball', d: r(0.06 * paw), at: v(0.23 * w, 0.14, 0.03), c: 'trim', seg: 6, group: 'arm-r' },
  ];
}

function moleFigure(k: number, w: number, paw: number, extra: (s: Scale) => Part[] = () => []): Pick<PrefabDef, 'pivots' | 'parts'> {
  const s = scaler(k, w);
  return {
    pivots: {
      body: s.v(0, 0.3, 0),
      head: s.v(0, 0.6, 0),
      'arm-l': s.v(-0.23 * w, 0.34, 0),
      'arm-r': s.v(0.23 * w, 0.34, 0),
    },
    parts: [...moleBody(s, paw), ...extra(s)],
  };
}

const MOLE_TINT = 0x8a8c92; // velvet grey
const SILVER_MOLE = 0xb3b7bd; // silver-grey fur

export const GTA_MOLES: readonly PrefabDef[] = [
  {
    id: 'burrowfolk-mole', name: 'Burrowfolk Mole', category: 'prop', uses: ['place'],
    tags: ['mole', 'burrowfolk', 'animal', 'critter', 'velvet', 'grey', 'loamdeep', 'gta'], emoji: [],
    tint: MOLE_TINT, trim: 'pink',
    about: 'Burrowfolk mole: 0.75 m, velvet-grey pear body, pink nose and paws, no hat. Pivots: body, head, arm-l, arm-r.',
    examine: [
      'A velvet-grey mole about the height of a gnome\'s knee, with a pointed pink nose and paws that look far too big to be polite.',
      'Burrowfolk saying: "If it pleases you, the grub is yours; if it does not, the grub has already gone down the hall."',
      'Tip: a mole will bow to you before it says anything. Bow back. It is considered the start of a conversation.',
      'Joke: the Tall Ones blamed the moles for every lump in the lawn. The moles say the lumps are the grubs, and the grubs are not talking.',
      'It keeps its tiny dark eyes half shut in the lamplight, the better to appear to be listening to something under the floor.',
    ],
    ...moleFigure(1, 0.9, 1),
  },
  {
    id: 'mole-nubbin', name: 'Nubbin', category: 'prop', uses: ['place'],
    tags: ['mole', 'burrowfolk', 'young', 'pup', 'satchel', 'spectacles', 'animal', 'critter', 'loamdeep', 'gta'], emoji: [],
    tint: MOLE_TINT, trim: 'pink',
    about: 'Nubbin: a young mole, 0.6 m, with an oversized satchel across one shoulder (brass buckle) and tiny round spectacles. Pivots: body, head, arm-l, arm-r.',
    examine: [
      'A young mole with a satchel far too big for him, strapped across one shoulder and bumping against his knees on every step.',
      'Burrowfolk saying: "Carry what you can reach, and the rest will be carried by someone with longer arms."',
      'Tip: ask Nubbin for the post. He will know which hall it is in, and he will tell you at length.',
      'Joke: the satchel has never been emptied, only renamed. It is now called "the important bag", which Nubbin does not think is a joke.',
      'Round brass-rimmed spectacles sit on his nose. They make him look very clever, and very surprised, in about equal parts.',
    ],
    ...moleFigure(0.8, 1, 1, (s) => {
      const { v, r } = s;
      return [
        { s: 'box', d: r(0.26, 0.22, 0.14), at: v(0.14, 0.22, 0.2), c: 'leather', group: 'body' },
        { s: 'box', d: r(0.03, 0.46, 0.02), rot: [0, 0, -40], at: v(0.02, 0.36, 0.17), c: 'leather-dark', group: 'body' },
        { s: 'box', d: r(0.04, 0.03, 0.012), at: v(0.14, 0.26, 0.28), c: 'brass', group: 'body' },
        { s: 'ring', d: r(0.035, 0.006), at: v(0.055, 0.63, 0.16), c: 'silver', mirror: true, seg: 8, group: 'head' },
      ];
    }),
  },
  {
    id: 'mole-tumblesoil', name: 'Old Mother Tumblesoil', category: 'prop', uses: ['place'],
    tags: ['mole', 'burrowfolk', 'elder', 'matriarch', 'shawl', 'lamp', 'cane', 'animal', 'critter', 'loamdeep', 'gta'], emoji: [],
    tint: SILVER_MOLE, trim: 'pink',
    about: 'Old Mother Tumblesoil: 0.8 m, stout, silver-grey fur, lace shawl with a glowing brass lamp brooch, thick spectacles, a root cane. Pivots: body, head, arm-l, arm-r.',
    examine: [
      'Silver-grey and stout, with a lace shawl pinned at the throat by a brass lamp brooch that glows faintly, even at noon.',
      'Burrowfolk saying: "The oldest root is the one that bends the most, and the one that holds up the Mother\'s Hall."',
      'Tip: speak slowly to the Mother. She hears perfectly well. She simply prefers you to arrive at your point at the pace of a root.',
      'Joke: she has ruled the Mother\'s Hall for longer than the gnomes have had a Lawn Society, and has no intention of telling them how long.',
      'Her spectacles are thick enough to read a root through. Her cane is twisted root, and it is not for walking, mostly.',
    ],
    ...moleFigure(1.07, 1.25, 1, (s) => {
      const { v, r, w } = s;
      return [
        { s: 'ball', d: r(0.2), scale: [1.3, 0.45, 1.0], at: v(0, 0.42, 0.04), c: 'cloth', seg: 8, group: 'body' },
        { s: 'ball', d: r(0.022), at: v(-0.05, 0.4, 0.2), c: 'gold', glow: true, seg: 6, group: 'body' },
        { s: 'ring', d: r(0.05, 0.012), at: v(0.06, 0.62, 0.155), c: 'black', mirror: true, seg: 8, group: 'head' },
        { s: 'cyl', d: r(0.014, 0.014, 0.6), at: v(0.23 * w + 0.05, 0.3, 0.1), c: 'bark', seg: 5, group: 'arm-r' },
      ];
    }),
  },
  {
    id: 'dj-moleman', name: 'DJ Moleman', category: 'prop', uses: ['place'],
    tags: ['mole', 'burrowfolk', 'dj', 'radio', 'headphones', 'antenna', 'trilby', 'hat', 'animal', 'critter', 'loamdeep', 'gta'], emoji: [],
    tint: MOLE_TINT, trim: 'pink',
    about: 'DJ Moleman: 0.8 m mole in no costume, a wire antenna up his back to 1.6 m with a brown trilby on top (the only hat in Loamdeep), padded headphones at the neck. Pivots: body, head, arm-l, arm-r.',
    examine: [
      'A velvet-grey mole with padded headphones round his neck and a wire antenna strapped up his back, taller than most of the hall.',
      'Burrowfolk saying: "A signal wants a height, and a height wants a hat, and so the hat sits on the antenna and not the mole."',
      'Tip: 108.0 Subsoil Radio plays best when you hold the aerial up. If he asks you to, do it, and do not ask why the hall hums.',
      'Joke: he calls the bass "seat", as in "give me the seat", which the family finds exciting and the rest of the hall finds unsettling.',
      'His family would be very glad to see him at the Mother\'s Hall for supper. He is always just about to come, after one more track.',
    ],
    ...moleFigure(1.07, 1, 1, (s) => {
      const { v, r } = s;
      return [
        { s: 'cyl', d: [0.008, 0.008, 1.4], at: [0, 0.9, -0.14], c: 'silver', seg: 4, group: 'body' },
        { s: 'box', d: r(0.1, 0.5, 0.025), at: v(0, 0.35, -0.2), c: 'leather-dark', group: 'body' },
        { s: 'cyl', d: [0.13, 0.13, 0.02], at: [0, 1.6, -0.14], c: 'leather', seg: 10, group: 'head' },
        { s: 'cyl', d: [0.07, 0.075, 0.1], at: [0, 1.65, -0.14], c: 'leather', seg: 8, group: 'head' },
        { s: 'ring', d: r(0.2, 0.025), rot: [90, 0, 0], at: v(0, 0.46, 0), c: 'black', seg: 8, group: 'head' },
        { s: 'ball', d: r(0.05), scale: [0.8, 1, 1], at: v(0.21, 0.46, 0), c: 'black', seg: 6, mirror: true, group: 'head' },
      ];
    }),
  },
  {
    id: 'moleman-decks', name: "DJ Moleman's Decks", category: 'prop', uses: ['place'],
    tags: ['decks', 'turntable', 'record', 'mixer', 'radio', 'music', 'cable', 'burrowfolk', 'loamdeep', 'gta'], emoji: [],
    about: 'DJ Moleman\'s decks: 1.4 m wide, two turntables (one with a record), a small mixer on a root-wood crate, a thick cable down into the floor. No pivots.',
    examine: [
      'Two black turntables on a crate of pale root wood, with a little silver mixer between them that has more knobs than it needs.',
      'Burrowfolk saying: "Every record is a root, and every root is a record, and the Under-Chorus hums them both."',
      'Tip: do not touch the left platter while it is spinning. It is not dangerous. It simply has opinions about being touched.',
      'Joke: the mixer has a fader marked "LOUD" and a second one marked "LOUDER", and nobody has ever found the fader marked "QUIET".',
      'The cable runs down through a hole in the floor into the hum below. The hum is very pleased about it, and says so.',
    ],
    parts: [
      { s: 'box', d: [1.4, 0.4, 0.6], at: [0, 0.2, 0], c: 'wood-light' },
      { s: 'cyl', d: [0.2, 0.2, 0.03], at: [-0.36, 0.425, 0.05], c: 'black', seg: 12 },
      { s: 'cyl', d: [0.19, 0.19, 0.006], at: [-0.36, 0.446, 0.05], c: 'white', seg: 12 },
      { s: 'cyl', d: [0.05, 0.05, 0.008], at: [-0.36, 0.45, 0.05], c: 'pink', seg: 8 },
      { s: 'cyl', d: [0.2, 0.2, 0.03], at: [0.36, 0.425, 0.05], c: 'black', seg: 12 },
      { s: 'box', d: [0.012, 0.012, 0.2], rot: [0, -30, 0], at: [0.44, 0.5, -0.06], c: 'silver' },
      { s: 'box', d: [0.3, 0.04, 0.36], at: [0, 0.44, 0.02], c: 'silver' },
      { s: 'ball', d: [0.02], at: [-0.08, 0.475, 0.1], c: 'black', seg: 6 },
      { s: 'ball', d: [0.02], at: [0.08, 0.475, 0.1], c: 'black', seg: 6 },
      { s: 'box', d: [0.02, 0.01, 0.12], at: [0, 0.465, -0.04], c: 'black' },
      { s: 'cyl', d: [0.018, 0.018, 0.5], at: [0, 0.25, -0.33], c: 'black', seg: 6 },
    ],
  },
  {
    id: 'mole-pup', name: 'Mole Pup', category: 'prop', uses: ['place'],
    tags: ['mole', 'burrowfolk', 'pup', 'baby', 'young', 'twins', 'animal', 'critter', 'loamdeep', 'gta'], emoji: [],
    tint: MOLE_TINT, trim: 'pink',
    about: 'Mole pup: 0.42 m, a very small mole (the Tunnel twins) with oversized pink paws. Pivots: body, head, arm-l, arm-r.',
    examine: [
      'A mole pup no bigger than a teacup of soil, with paws so large it has to sit down to wave them.',
      'Burrowfolk saying: "A pup with big paws will dig the best tunnel, and then sleep in the first one it dug."',
      'Tip: the twins will try to swap places with you when you are not looking. Keep one hand on your hat and one on your pup.',
      'Joke: they are not allowed to dig past the Hearth Hall, so they dig down, which the Hearth Hall says is the same thing.',
      'They squeak at the edge of hearing, and the Tall Ones are said to have been unable to hear them at all, which made them very cross.',
    ],
    ...moleFigure(0.56, 0.85, 2.2),
  },
];
