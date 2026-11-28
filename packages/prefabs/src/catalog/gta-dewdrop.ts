// Gnome Theft Auto: the Dewdrop (E18, L54), Hogweed Sprocket's clear hamster ball, and its Roll With It reward.
// Rules: docs/roadmaps/prefab-library/_common.md. Life-size metres, front on +z. Group 'ball' rolls; the seat frame stays upright.
import type { PrefabDef } from '../types';

const GLASS = 0xbfe4f5;
const BRASS = 0xc9a23f;
const FRAME = 0x6b4a2e;
const BALL_Y = 0.75;

export const GTA_DEWDROP: readonly PrefabDef[] = [
  // ---- The Dewdrop: a clear hamster ball with a gnome-sized seat inside ----------------------------------------------
  {
    id: 'gta-dewdrop', name: 'The Dewdrop', category: 'prop', uses: ['place', 'sit'],
    tags: ['dewdrop', 'bubble', 'hamster', 'ball', 'clear', 'sphere', 'hogweed', 'vehicle', 'seat', 'ride', 'gta'], emoji: [],
    tint: GLASS,
    seat: [0, 0.3, 0],
    pivots: { ball: [0, BALL_Y, 0] },
    about: "Gnome Theft Auto: the Dewdrop. Hogweed Sprocket's clear hamster ball (the tint, alpha 0.25), about 1.5 m across (radius 0.73) before the vehicle scale: seams and a brass seal-ring (group ball, it rolls) around a small seat and harness frame that stays upright. Nose +z.",
    examine: [
      'A clear ball the size of a small shed, with a seat inside that stays the right way up while everything else does not.',
      'Hogweed Sprocket built it from a hamster ball, a bicycle seat and a lot of optimism.',
      'Tip: it is slow to turn and rebounds off kerbs, so steer early and let the walls do some of the work.',
      'Joke: the brass ring is the seal. Hogweed says it keeps the air in. Nobody has asked which air.',
      "Hogweed's approval form says \"Permission is a prototype nobody tested\", and the Dewdrop is the prototype.",
    ],
    parts: [
      { s: 'ball', d: [0.73], at: [0, BALL_Y, 0], c: 'tint', alpha: 0.25, seg: 20, name: 'shell', group: 'ball' },
      { s: 'ring', d: [0.73, 0.012], rot: [0, 90, 0], at: [0, BALL_Y, 0], c: BRASS, seg: 20, name: 'seal-ring', group: 'ball' },
      { s: 'ring', d: [0.73, 0.008], at: [0, BALL_Y, 0], c: GLASS, seg: 20, name: 'seam-a', group: 'ball' },
      { s: 'ring', d: [0.73, 0.008], rot: [90, 0, 0], at: [0, BALL_Y, 0], c: GLASS, seg: 20, name: 'seam-b', group: 'ball' },
      { s: 'ring', d: [0.52, 0.008], rot: [90, 0, 0], at: [0, BALL_Y + 0.5, 0], c: GLASS, seg: 16, name: 'seam-c', group: 'ball' },
      { s: 'box', d: [0.5, 0.05, 0.5], at: [0, 0.2, 0], c: FRAME, name: 'seat-base' },
      { s: 'box', d: [0.4, 0.06, 0.34], at: [0, 0.28, 0], c: 'wood', name: 'seat' },
      { s: 'box', d: [0.4, 0.32, 0.05], at: [0, 0.45, -0.19], c: FRAME, name: 'seat-back' },
      { s: 'box', d: [0.04, 0.3, 0.04], at: [-0.22, 0.4, 0.2], c: BRASS, name: 'bar-left' },
      { s: 'box', d: [0.04, 0.3, 0.04], at: [0.22, 0.4, 0.2], c: BRASS, name: 'bar-right' },
      { s: 'box', d: [0.48, 0.03, 0.03], at: [0, 0.56, 0.2], c: BRASS, name: 'bar-top' },
    ],
  },

  // ---- Bubble Visor (head): the Roll With It reward -------------------------------------------------------------------
  {
    id: 'gta-bubble-visor', name: 'Bubble Visor', category: 'armor', uses: ['wear-head'],
    wear: { at: [0, 0.05, 0.02] },
    tags: ['visor', 'bubble', 'clear', 'brass', 'dewdrop', 'hogweed', 'head', 'gta'], emoji: [],
    tint: GLASS, trim: BRASS,
    about: 'Gnome Theft Auto: the Bubble Visor. A clear half-bubble (the tint, alpha 0.3) over the brow with a brass rim (the trim). Head slot. Roll With It reward.',
    examine: [
      'A clear half-bubble on a brass rim, cut from the same stock as the Dewdrop and polished to match.',
      'Hogweed Sprocket says it is for the wind. It has never once been windy inside the Dewdrop.',
      'Tip: wear it while rolling. It does nothing, but it does it with great confidence.',
      'Joke: the rim is genuine brass, the bubble is genuine bubble, and the warranty is genuine Hogweed.',
      'A gnome who wears the visor has rolled a long way and owes the walls an apology.',
    ],
    parts: [
      { s: 'ball', d: [0.1], at: [0, 0.08, 0.04], scale: [1, 0.8, 1], c: 'tint', alpha: 0.3, seg: 12, name: 'bubble' },
      { s: 'ring', d: [0.095, 0.01], rot: [90, 0, 0], at: [0, 0.07, 0.04], c: 'trim', seg: 12, name: 'rim' },
    ],
  },

  // ---- Hamster Wheel Medal (neck): the Hamster Hour reward ------------------------------------------------------------
  {
    id: 'gta-hamster-medal', name: 'Hamster Wheel Medal', category: 'trinket', uses: ['wear-neck'],
    wear: { at: [0, -0.07, 0.05] },
    tags: ['medal', 'wheel', 'hamster', 'brass', 'ribbon', 'dewdrop', 'neck', 'reward', 'gta'], emoji: [],
    tint: BRASS,
    about: 'Gnome Theft Auto: the Hamster Wheel Medal, a little brass wheel (the tint) on a blue ribbon collar. Neck slot. Hamster Hour reward.',
    examine: [
      'A small brass wheel with six spokes, hung on a blue ribbon. It turns if you blow on it.',
      'Hogweed Sprocket awards it to anyone who stays in the Dewdrop for a whole minute, and has never stayed in one himself.',
      'Tip: it spins when you run. It has never yet made anyone run faster.',
      'Joke: the medal is the only part of the Dewdrop programme that has passed an inspection, and it was inspected by Hogweed.',
      'The back is engraved "ONE MINUTE" in capitals, then "approx." in very small letters.',
    ],
    parts: [
      { s: 'ring', d: [0.11, 0.008], at: [0, 0.02, 0], rot: [90, 0, 0], c: 'blue', seg: 12, name: 'ribbon' },
      { s: 'ring', d: [0.03, 0.005], at: [0, 0.032, 0.11], c: 'tint', seg: 12, name: 'wheel' },
      { s: 'box', d: [0.056, 0.004, 0.004], at: [0, 0.032, 0.11], c: 'tint', name: 'spoke-a' },
      { s: 'box', d: [0.004, 0.056, 0.004], at: [0, 0.032, 0.11], c: 'tint', name: 'spoke-b' },
      { s: 'box', d: [0.006, 0.03, 0.004], at: [0, 0.06, 0.11], c: 'blue', name: 'tab' },
    ],
  },

  // ---- Newcomer's Lanyard (neck): the Rod, Comb and Notebook reward (the three hobby intros) --------------------------
  {
    id: 'gta-newcomer-lanyard', name: "Newcomer's Lanyard", category: 'trinket', uses: ['wear-neck'],
    wear: { at: [0, -0.07, 0.05] },
    tags: ['lanyard', 'card', 'stamp', 'newcomer', 'fishing', 'hunting', 'birding', 'hobby', 'neck', 'reward', 'gta'], emoji: [],
    tint: 0xf2c200,
    about: "Gnome Theft Auto: the Newcomer's Lanyard, a yellow cord (the tint) with a card holder showing three hobby stamps: a hook, a comb and a feather. Neck slot. Rod, Comb and Notebook reward.",
    examine: [
      "A yellow cord with a clear card holder. Inside, a Newcomers' Card with three stamps: a hook, a comb and a feather.",
      'Wenna, Hazel and Dunnock each signed their stamp. Only Dunnock signed it quietly.',
      'Tip: show it at the Bent Pin, the lodge or the hide. Nobody will give you anything for it, but they will nod.',
      'Joke: the card says "Newcomer" in large letters, which is how every gnome in Turfton still feels.',
      'There is room for more stamps on the back, and Mabel has opinions about which ones.',
    ],
    parts: [
      { s: 'ring', d: [0.11, 0.006], at: [0, 0.02, 0], rot: [90, 0, 0], c: 'tint', seg: 12, name: 'cord' },
      { s: 'box', d: [0.06, 0.04, 0.004], at: [0, 0.022, 0.11], c: 'white', name: 'card' },
      { s: 'ball', d: [0.008], at: [-0.018, 0.022, 0.113], c: 'blue', seg: 6, name: 'stamp-hook' },
      { s: 'ball', d: [0.008], at: [0, 0.022, 0.113], c: 'green', seg: 6, name: 'stamp-comb' },
      { s: 'ball', d: [0.008], at: [0.018, 0.022, 0.113], c: 'red', seg: 6, name: 'stamp-feather' },
    ],
  },
];
