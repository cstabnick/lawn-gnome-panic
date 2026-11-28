// Gnome Theft Auto: wearable achievement rewards for the underground societies (E17).
// Rules: docs/roadmaps/prefab-library/_common.md. Life-size metres, front on +z.
import type { PrefabDef } from '../types';

export const GTA_SOCIETIES_GEAR: readonly PrefabDef[] = [
  // ---- Post Satchel (back) -------------------------------------------------------------------------------------------
  {
    id: 'post-satchel', name: 'Post Satchel', category: 'armor', uses: ['wear-back'],
    wear: { at: [0, 0, 0.03] },
    tags: ['satchel', 'post', 'canvas', 'bag', 'letter', 'buckle', 'brass', 'mole', 'postern', 'loamdeep', 'back', 'gta', 'societies'], emoji: [],
    tint: 0xb8a27a, trim: 0xc9a23f,
    about: 'Gnome Theft Auto: the Post Satchel. A canvas mole post-runner\'s satchel (the tint) with a brass buckle (the trim) and a letter poking out of the top. Back slot.',
    examine: [
      'A canvas satchel worn across the back, with a brass buckle on the flap and a letter poking out of the top.',
      'Postern saying: a letter is only late once it has been opened and read, so the satchel is never opened.',
      'Tip: sling it across the back, not the front. The letter will not fall out if you do not look at it.',
      'Joke: the letter is addressed to a gnome who has never been home, and the postage is paid in worms.',
      'The buckle is stamped with a small mole footprint, which the Postern Hall says is a signature and the gnomes say is a smudge.',
    ],
    parts: [
      { s: 'box', d: [0.2, 0.22, 0.07], at: [0, 0.11, -0.05], c: 'tint', name: 'satchel' },
      { s: 'box', d: [0.21, 0.07, 0.075], at: [0, 0.18, -0.05], c: 'leather', name: 'flap' },
      { s: 'box', d: [0.03, 0.03, 0.01], at: [0, 0.14, -0.095], c: 'trim', name: 'buckle' },
      { s: 'box', d: [0.12, 0.012, 0.004], at: [0.02, 0.27, -0.05], rot: [0, 0, 5], c: 'white', name: 'letter' },
    ],
  },

  // ---- Subsoil Headphones (neck) -------------------------------------------------------------------------------------
  {
    id: 'subsoil-headphones', name: 'Subsoil Headphones', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.17, 0] },
    tags: ['headphones', 'radio', 'padded', 'cable', 'plug', 'dj', 'moleman', 'subsoil', 'neck', 'gta', 'societies'], emoji: [],
    tint: 0x2a2a30, trim: 0xefe6d6,
    about: 'Gnome Theft Auto: the Subsoil Headphones. Big padded headphones (the tint) round the neck with a coiled cable and a tiny plug, and 108.0 painted on one cup (the trim). Neck slot.',
    examine: [
      'Big padded headphones resting round the neck, with a coiled cable that ends in a tiny plug.',
      'Under-Chorus saying: a tune you can feel in your feet is a tune you are already dancing to.',
      'Tip: keep the cups on your neck, not your ears. DJ Moleman says the bass comes up through the collar, which is the point.',
      'Joke: the cable is long enough to reach the Under-Chorus and short enough that nobody has ever found the plug.',
      'On the left cup, in cream paint, a small 108.0. The dial is not on any gnome radio. It is under the floor.',
    ],
    parts: [
      { s: 'ring', d: [0.1, 0.014], rot: [90, 0, 0], at: [0, 0.12, 0], c: 'tint', seg: 12, name: 'band' },
      { s: 'ball', d: [0.045], at: [0.11, 0.08, 0], scale: [0.7, 1.2, 1], c: 'tint', seg: 8, name: 'cup-right' },
      { s: 'ball', d: [0.045], at: [-0.11, 0.08, 0], scale: [0.7, 1.2, 1], c: 'tint', seg: 8, name: 'cup-left' },
      { s: 'ring', d: [0.03, 0.006], rot: [90, 0, 0], at: [-0.11, 0.08, 0], c: 'trim', seg: 8, name: 'cup-ring' },
      { s: 'box', d: [0.02, 0.012, 0.004], at: [-0.11, 0.1, 0.046], c: 'trim', name: 'paint-108' },
      { s: 'ring', d: [0.012, 0.003], at: [-0.11, 0.05, 0.02], rot: [90, 0, 0], c: 'black', seg: 6, name: 'coil-a' },
      { s: 'cyl', d: [0.003, 0.003, 0.06], at: [-0.11, 0.04, 0.02], c: 'black', seg: 4, name: 'cable' },
      { s: 'box', d: [0.012, 0.02, 0.012], at: [-0.11, 0.01, 0.02], c: 'black', name: 'plug' },
    ],
  },

  // ---- Underspan Goggles (head) --------------------------------------------------------------------------------------
  {
    id: 'underspan-goggles', name: 'Underspan Goggles', category: 'armor', uses: ['wear-head'],
    tags: ['goggles', 'welding', 'smoked', 'lens', 'strap', 'leather', 'spanner', 'underspan', 'workshop', 'head', 'gta', 'societies'], emoji: [],
    tint: 0x4a2c18, trim: 0x2a2a30,
    about: 'Gnome Theft Auto: the Underspan Goggles. Welding goggles with round smoked lenses (the trim) on a leather strap (the tint), pushed up on the hat, with a tiny spanner clipped to the strap. Head slot.',
    examine: [
      'Welding goggles with round smoked lenses, on a leather strap, pushed up as if the wearer has only just stopped looking through them.',
      'Underspan saying: a rule is only a prototype nobody tested, and the goggles are how you test it.',
      'Tip: wear them up on the hat, not down over the eyes. The lenses are for the sparks, and the sparks are for later.',
      'Joke: the spanner is the only permit the Underspan has ever been issued, and the HOA has cited it for unauthorised verticality.',
      'Hogweed Sprocket says the lenses are the only part that was not salvaged from the Span, which is why they are so clean.',
    ],
    parts: [
      { s: 'ring', d: [0.085, 0.008], rot: [90, 0, 0], at: [0, 0.07, 0], c: 'tint', seg: 12, name: 'strap' },
      { s: 'cyl', d: [0.04, 0.04, 0.012], at: [-0.04, 0.09, 0.075], rot: [90, 0, 0], c: 'trim', seg: 10, name: 'lens-left' },
      { s: 'cyl', d: [0.04, 0.04, 0.012], at: [0.04, 0.09, 0.075], rot: [90, 0, 0], c: 'trim', seg: 10, name: 'lens-right' },
      { s: 'box', d: [0.03, 0.012, 0.012], at: [0, 0.095, 0.08], c: 'trim', name: 'bridge' },
      { s: 'box', d: [0.008, 0.035, 0.008], at: [0.0, 0.05, -0.085], c: 'tint', name: 'strap-clip' },
      { s: 'box', d: [0.008, 0.05, 0.008], at: [0.088, 0.04, 0.0], rot: [0, 0, 0], c: 'gold', name: 'spanner-handle' },
      { s: 'box', d: [0.02, 0.012, 0.008], at: [0.088, 0.07, 0.0], c: 'gold', name: 'spanner-head' },
    ],
  },

  // ---- Flock Hood (head) ---------------------------------------------------------------------------------------------
  {
    id: 'flock-hood', name: 'Flock Hood', category: 'armor', uses: ['wear-head'],
    tags: ['hood', 'soft', 'grey', 'feather', 'flock', 'wader', 'one-leg', 'wobble', 'head', 'gta', 'societies'], emoji: [],
    tint: 0x8d9096, trim: 0x9aa0a8,
    about: 'Gnome Theft Auto: the Flock Hood. A soft grey hood (the tint) with one small grey feather tucked in the band (the trim). Grey, not pink: pink is for the Lady only. Head slot.',
    examine: [
      'A soft grey hood, knitted to sit close, with one small grey feather tucked into the band.',
      'Flock saying: one leg for the sermon, one leg for the thought, and the hood for the wobble.',
      'Tip: pull it up before you stand on one leg. The Flock does not say why. It is simply expected.',
      'Joke: the hood is grey because the camp\'s washing is grey, and the washing is grey because the Lady is the only one allowed pink.',
      'Mother Saxifrage Wader says a gnome who wears the hood has had a thought, and owes the Flock a cup of reed tea, so it is stood.',
    ],
    parts: [
      { s: 'ball', d: [0.1], at: [0, 0.07, -0.01], scale: [1, 0.9, 1.05], c: 'tint', seg: 12, name: 'hood' },
      { s: 'ball', d: [0.062], at: [0, 0.02, 0.05], scale: [1, 0.6, 0.7], c: 'tint', seg: 10, name: 'hood-front' },
      { s: 'ring', d: [0.082, 0.01], rot: [90, 0, 0], at: [0, 0.06, 0.03], c: 'tint', seg: 12, name: 'hood-rim' },
      { s: 'cone', d: [0.007, 0.08], at: [0.06, 0.14, -0.03], rot: [0, 0, -20], c: 'trim', seg: 4, name: 'feather' },
    ],
  },

  // ---- Lamplighter's Cap (head) --------------------------------------------------------------------------------------
  {
    id: 'loamdeep-lamp-cap', name: 'Loamdeep Lamp Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'lamp', 'lamplight', 'brass', 'mole', 'loamdeep', 'burrowfolk', 'head', 'gta', 'societies'], emoji: [],
    tint: 0x6b4a2e, trim: 0xc9a23f,
    about: "Gnome Theft Auto: the Loamdeep Lamp Cap. A soft brown felt cap (the tint) with a tiny brass mole lamp (the trim) on the front, made for a gnome by Loamdeep's lamp keepers. Head slot.",
    examine: [
      'A soft brown felt cap, a little small for a gnome, with a tiny brass lamp fixed to the front where a badge would go.',
      'Loamdeep saying: every hall thanks you, and every hall means it, which is why the cap took six moles to knit.',
      'Tip: the lamp is not lit. The Burrowfolk would never light a lamp on a gnome without asking the gnome first.',
      'Joke: the moles made it one size too small on purpose, so that a gnome would have to take the hat off to wear it.',
      'A paper tag inside the band reads, in very tidy writing: FOR THE ONE WHO DID ALL FOUR. MOST KIND.',
    ],
    parts: [
      { s: 'ball', d: [0.1], at: [0, 0.06, 0], scale: [1, 0.55, 1.05], c: 'tint', seg: 12, name: 'cap' },
      { s: 'cyl', d: [0.1, 0.1, 0.012], at: [0, 0.03, 0.03], scale: [1, 1, 1.25], c: 'tint', seg: 12, name: 'peak' },
      { s: 'cyl', d: [0.018, 0.016, 0.03], at: [0, 0.075, 0.1], c: 'trim', seg: 8, name: 'lamp-base' },
      { s: 'cyl', d: [0.016, 0.016, 0.03], at: [0, 0.1, 0.1], c: 0xffd27a, glow: true, seg: 6, name: 'lamp-glass' },
      { s: 'cone', d: [0.02, 0.016], at: [0, 0.123, 0.1], c: 'trim', seg: 6, name: 'lamp-top' },
    ],
  },

  // ---- Reed Tea Cup (hand) -------------------------------------------------------------------------------------------
  {
    id: 'reed-tea-cup', name: 'Reed Tea Cup', category: 'tool', uses: ['hold'],
    wear: { rot: [90, 0, 0] },
    tags: ['tea', 'cup', 'tin', 'dented', 'reed', 'mug', 'drink', 'flock', 'wader', 'hand', 'gta', 'societies'], emoji: [],
    grip: [0.09, 0.05, 0],
    about: 'Gnome Theft Auto: the Reed Tea Cup. A dented tin cup of reed tea with a reed sticking out of the top and a small handle ring. The Flock\'s payment for a wobble. Hand slot.',
    examine: [
      'A dented tin cup of reed tea, the surface a little green, with a single reed sticking out of the top.',
      'Flock saying: a gnome who wobbles owes the Flock a cup of reed tea, and the cup is always the same cup.',
      'Tip: drink it standing on one leg, or the tea will be considered a wobble and the debt will double.',
      'Joke: the reed is the sign of the Flock, the tea is the price of a thought, and the tin is the only thing that has never been paid for.',
      'It tastes of the bank, the reeds and a faint, polite apology, which the Flock says is exactly right.',
    ],
    parts: [
      { s: 'cyl', d: [0.04, 0.035, 0.08], at: [0, 0.04, 0], c: 'stone', seg: 10, name: 'tin' },
      { s: 'cyl', d: [0.037, 0.037, 0.008], at: [0, 0.08, 0], c: 'leather', seg: 10, name: 'tea' },
      { s: 'ring', d: [0.028, 0.008], at: [0.06, 0.05, 0], c: 'stone', seg: 6, name: 'handle' },
      { s: 'box', d: [0.014, 0.01, 0.01], at: [0.005, 0.02, 0.03], c: 'stone-dark', name: 'dent' },
      { s: 'cyl', d: [0.004, 0.004, 0.12], at: [0.01, 0.15, 0.01], rot: [0, 0, -10], c: 0xb8a25a, seg: 4, name: 'reed' },
    ],
  },
];
