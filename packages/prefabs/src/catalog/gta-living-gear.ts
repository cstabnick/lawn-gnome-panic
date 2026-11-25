// Gnome Theft Auto: six wearable achievement rewards for the living world (E31).
// Rules: docs/roadmaps/prefab-library/_common.md. Life-size metres, front on +z.
import type { PrefabDef } from '../types';

export const GTA_LIVING_GEAR: readonly PrefabDef[] = [
  // ---- Ranger Campaign Hat (head) ------------------------------------------------------------------------------------
  {
    id: 'ranger-campaign-hat', name: 'Ranger Campaign Hat', category: 'armor', uses: ['wear-head'],
    tags: ['hat', 'ranger', 'campaign', 'brim', 'wide', 'olive', 'dandelion', 'unmown', 'gta', 'living'], emoji: [],
    tint: 0x5a6b2e, trim: 0xf2e36b,
    about: 'Gnome Theft Auto: the Ranger Campaign Hat. A wide-brimmed olive felt hat (the tint) with a dandelion pinned to the band (the trim). Head slot.',
    examine: [
      'A wide-brimmed olive felt hat with a stiff dandelion pinned to the band, the seed-head still on.',
      'Ranger saying: the Unmown was never lost, it was simply left alone, and so is the hat.',
      'Tip: turn the brim down in the rain and up for the birds. The birds are not impressed either way.',
      'Joke: the campaign was for a cause nobody could agree on, so the hat is wide enough to cover all of them.',
      'Inside the crown a patient ranger has written every species on the checklist, and crossed out the ones that came back.',
    ],
    parts: [
      { s: 'cyl', d: [0.21, 0.21, 0.012], at: [0, 0.0, 0], c: 'tint', seg: 14, name: 'brim' },
      { s: 'cyl', d: [0.11, 0.12, 0.09], at: [0, 0.06, 0], c: 'tint', seg: 12, name: 'crown' },
      { s: 'cyl', d: [0.122, 0.122, 0.02], at: [0, 0.03, 0], c: 0x3b4619, seg: 12, name: 'band' },
      { s: 'ball', d: [0.03], at: [0.085, 0.045, 0.06], scale: [1, 0.7, 1], c: 'trim', seg: 6, name: 'dandelion' },
      { s: 'cyl', d: [0.004, 0.004, 0.06], at: [0.085, 0.0, 0.06], c: 'bone', seg: 4, name: 'dandelion-stem' },
    ],
  },

  // ---- Reed Whistle (neck) -------------------------------------------------------------------------------------------
  {
    id: 'reed-whistle', name: 'Reed Whistle', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.1, 0] },
    tags: ['whistle', 'reed', 'pipe', 'cord', 'brass', 'ring', 'neck', 'boardwalk', 'reedmere', 'gta', 'living'], emoji: [],
    tint: 0x8a7a3c, trim: 0xc9a441,
    about: 'Gnome Theft Auto: the Reed Whistle. A cord (the tint) holding a short hollow reed pipe whistle and a small brass ring (the trim). Neck slot.',
    examine: [
      'A length of braided cord holding a short hollow reed pipe, with a small brass ring for the cord to pass through.',
      'Reedmere saying: a whistle that is never blown will still be heard by the herons.',
      'Tip: blow it gently, two short notes, to tell the boardwalk rangers you are still on it.',
      'Joke: it plays one note, and the note is mostly disappointment, but a heron has been known to look up.',
      'The reed is cut from the far bank, where nobody has been since the boardwalk was painted, which is also a joke.',
    ],
    parts: [
      { s: 'ring', d: [0.085, 0.006], rot: [90, 0, 0], at: [0, 0.04, 0], c: 'tint', seg: 10, name: 'cord' },
      { s: 'cyl', d: [0.012, 0.012, 0.09], at: [0, 0.03, 0.03], rot: [-40, 0, 0], c: 'tint', seg: 6, name: 'pipe-cord' },
      { s: 'cyl', d: [0.008, 0.008, 0.1], at: [0, 0.02, 0.05], rot: [-20, 0, 0], c: 0xb8a25a, seg: 6, name: 'reed' },
      { s: 'cyl', d: [0.014, 0.014, 0.008], at: [0, 0.04, 0], rot: [90, 0, 0], c: 'trim', seg: 10, name: 'ring-brass' },
      { s: 'ball', d: [0.016], at: [0, 0.0, 0.08], scale: [1, 1, 0.6], c: 'trim', seg: 6, name: 'mouthpiece' },
    ],
  },

  // ---- Hide Camo Cape (back) -----------------------------------------------------------------------------------------
  {
    id: 'hide-camo-cape', name: 'Hide Camo Cape', category: 'armor', uses: ['wear-back'],
    wear: { at: [0, 0, 0.03] },
    tags: ['cape', 'camo', 'hessian', 'grass', 'leaves', 'hide', 'camouflage', 'back', 'unmown', 'gta', 'living'], emoji: [],
    tint: 0x9c8a5e, trim: 0x4d6b2f,
    about: 'Gnome Theft Auto: the Hide Camo Cape. A short hessian cape (the tint) with tufts of grass and leaves stitched on (the trim). Back slot.',
    examine: [
      'A short cape of rough hessian, with tufts of grass and leaves stitched on at random, as if it had been left out.',
      'Hide saying: the best camouflage is the one you forgot you were wearing, which is the cape.',
      'Tip: sit very still in a hide and the cape will do the rest. Do not wave at the birds.',
      'Joke: the leaves are real, and the grass is also real, and nobody has yet explained the tuft that is growing out of the hem.',
      'It smells of the Unmown after rain, which the rangers say is how you know it is working.',
    ],
    parts: [
      { s: 'box', d: [0.26, 0.4, 0.02], at: [0, 0.2, -0.05], c: 'tint', name: 'cape' },
      { s: 'box', d: [0.28, 0.02, 0.03], at: [0, 0.4, -0.05], c: 'tint', name: 'collar' },
      { s: 'ball', d: [0.035], at: [-0.08, 0.02, -0.06], scale: [1, 0.5, 1], c: 'trim', seg: 6, name: 'tuft-a' },
      { s: 'ball', d: [0.03], at: [0.07, 0.12, -0.06], scale: [1, 0.5, 1], c: 'trim', seg: 6, name: 'tuft-b' },
      { s: 'ball', d: [0.028], at: [0.02, 0.28, -0.06], scale: [1, 0.4, 1], c: 'trim', seg: 6, name: 'tuft-c' },
      { s: 'ball', d: [0.02], at: [-0.05, 0.22, -0.065], scale: [1, 1, 0.3], c: 'trim', seg: 5, name: 'leaf' },
    ],
  },

  // ---- Bird-Call Whistle (hand) --------------------------------------------------------------------------------------
  {
    id: 'bird-call-whistle', name: 'Bird-Call Whistle', category: 'tool', uses: ['hold'],
    wear: { rot: [0, 0, 180] },
    tags: ['bird', 'call', 'whistle', 'wood', 'turned', 'brass', 'key', 'mouthpiece', 'hand', 'reward', 'birding', 'gta', 'living'], emoji: [],
    grip: [0, 0.05, 0],
    about: 'Gnome Theft Auto: the Bird-Call Whistle, a small turned wooden cylinder with a mouthpiece and a brass key. Reward for the Fresh Feathers achievement.',
    examine: [
      'A small turned wooden cylinder with a mouthpiece at one end and a brass key on the side.',
      'Birding saying: a bird will come to a call it does not recognise, out of pure politeness.',
      'Tip: press the key slowly. Pressing it fast brings the pigeons, and nobody needs the pigeons.',
      'Joke: the call sounds exactly like a bird, to another bird, which is the only review that matters.',
      'The turned wood has a row of tiny notches, one for each species the previous owner had fooled.',
    ],
    parts: [
      { s: 'cyl', d: [0.035, 0.035, 0.16], at: [0, 0.08, 0], c: 'leather', seg: 10, name: 'body' },
      { s: 'cyl', d: [0.024, 0.024, 0.04], at: [0, 0.2, 0], c: 'leather-dark', seg: 8, name: 'mouthpiece' },
      { s: 'box', d: [0.012, 0.02, 0.02], at: [0.035, 0.1, 0], c: 'gold', name: 'key' },
      { s: 'ring', d: [0.036, 0.004], rot: [90, 0, 0], at: [0, 0.14, 0], c: 'gold', seg: 10, name: 'brass-ring' },
    ],
  },

  // ---- Milestone Medal (neck) ----------------------------------------------------------------------------------------
  {
    id: 'milestone-medal', name: 'Milestone Medal', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.15, 0] },
    tags: ['medal', 'milestone', 'stone', 'ribbon', 'carved', 'one', 'lane', 'neck', 'gta', 'living'], emoji: [],
    tint: 0x3a6e9c, trim: 0xb8b2a4,
    about: 'Gnome Theft Auto: the Milestone Medal. A striped ribbon (the tint) with a little stone milestone medal (the trim) carved with a 1. Neck slot.',
    examine: [
      'A striped ribbon with a little stone milestone on it, carved with a single large 1 and a worn edge.',
      'Lane saying: one mile is a long way on a lane with no milestones, so the first one is the best.',
      'Tip: wear it on the outside of the coat, so the people you pass can see you have been somewhere off the main road.',
      'Joke: the milestone says 1, and the road it marks is not on any map, which is the sort of thing the medal is for.',
      'On the back, very small, someone has scratched and then crossed out the words almost there.',
    ],
    parts: [
      { s: 'ring', d: [0.11, 0.035], rot: [90, 0, 0], at: [0, 0.09, 0], c: 'tint', seg: 10, name: 'ribbon' },
      { s: 'box', d: [0.05, 0.005, 0.04], at: [0, 0.03, 0.12], c: 'tint', name: 'ribbon-tail' },
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [0, 0.06, 0.14], rot: [90, 0, 0], c: 'trim', seg: 8, name: 'medal-disc' },
      { s: 'box', d: [0.04, 0.05, 0.012], at: [0, 0.06, 0.155], c: 'trim', name: 'milestone' },
      { s: 'box', d: [0.008, 0.035, 0.01], at: [0, 0.06, 0.165], c: 'black', name: 'carved-one' },
    ],
  },

  // ---- Camping Roll (back) -------------------------------------------------------------------------------------------
  {
    id: 'camping-roll', name: 'Camping Roll', category: 'armor', uses: ['wear-back'],
    wear: { at: [0, 0, 0.03] },
    tags: ['camping', 'roll', 'mat', 'sleeping', 'straps', 'buckle', 'mug', 'tin', 'back', 'gta', 'living'], emoji: [],
    tint: 0x4f6b3a, trim: 0x8a8f96,
    about: 'Gnome Theft Auto: the Camping Roll. A rolled sleeping mat (the tint) strapped with two buckled straps (the trim), with a tin mug hanging off it. Back slot.',
    examine: [
      'A rolled sleeping mat, strapped twice with buckled straps, with a dented tin mug swinging off the end.',
      'Camping saying: the ground is only hard if you forget to bring the ground with you.',
      'Tip: roll the mat tight in the morning and loose at night. The buckles will thank you, and so will the hedgehog.',
      'Joke: the mug has been used for tea, soup, rainwater and once, by mistake, a snail, and it is still the favourite mug.',
      'The straps are cut from a sign that said KEEP OFF THE GRASS, which was on a lawn that is no longer there.',
    ],
    parts: [
      { s: 'cyl', d: [0.075, 0.075, 0.34], at: [0, 0.18, 0], c: 'tint', seg: 10, name: 'roll' },
      { s: 'ring', d: [0.078, 0.012], rot: [90, 0, 0], at: [0, 0.1, 0], c: 'trim', seg: 10, name: 'strap-low' },
      { s: 'ring', d: [0.078, 0.012], rot: [90, 0, 0], at: [0, 0.26, 0], c: 'trim', seg: 10, name: 'strap-high' },
      { s: 'box', d: [0.03, 0.04, 0.02], at: [0, 0.1, 0.085], c: 'gold', name: 'buckle' },
      { s: 'cyl', d: [0.035, 0.03, 0.07], at: [0.12, 0.06, 0], c: 'trim', seg: 8, name: 'mug' },
    ],
  },
];
