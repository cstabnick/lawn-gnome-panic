// Gnome Theft Auto: the five achievement reward gear items for the sky traffic (the banner tows, the aircraft over
// Turfton). Each one is worn or held by the gnome; the game unlocks it through packages/achievements catalog.ts.
import type { PrefabDef } from '../types';

export const GTA_SKY_TRAFFIC: PrefabDef[] = [
  {
    id: 'sky-sign-cap', name: 'Sky-Sign Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'pilot', 'banner', 'sign', 'sky', 'stripe', 'hat', 'head', 'reward'], emoji: [],
    tint: 'blue',
    about: 'Look Up!: a blue pilot cap with a black brim and a tiny orange-and-white banner trailing behind on a short pole. Achievement reward for Look Up!',
    examine: [
      'A blue pilot cap with a stiff black brim, and a little striped banner on a pole trailing from its back.',
      'Saying from the Verge: whoever looks up long enough will eventually be asked to pay for the view.',
      'Tip: wear the brim forward. Worn backwards, the banner flaps in your own face and you miss the aircraft.',
      'Joke: the banner says nothing useful, but the Hat Watch still asks gnomes to read it twice.',
      'The cap has been mended at the crown with a patch cut from an old advert, and the patch still says BUY.',
    ],
    parts: [
      { s: 'ball', d: [0.13], at: [0, 0.078, 0], c: 'tint', scale: [1, 0.6, 1], seg: 8 },
      { s: 'box', d: [0.2, 0.02, 0.1], at: [0, 0.01, 0.1], c: 'black' },
      { s: 'cyl', d: [0.008, 0.008, 0.1], at: [0, 0.1, -0.12], rot: [90, 0, 0], c: 'wood-dark', seg: 4 },
      { s: 'box', d: [0.12, 0.06, 0.01], at: [0, 0.1, -0.19], c: 'white' },
      { s: 'box', d: [0.12, 0.02, 0.012], at: [0, 0.1, -0.19], c: 'orange' },
    ],
  },
  {
    id: 'advert-roll-pack', name: 'Advert Roll Pack', category: 'armor', uses: ['wear-back'],
    tags: ['advert', 'banner', 'roll', 'pack', 'back', 'strap', 'cloth', 'sign', 'reward'], emoji: [],
    tint: 'orange',
    about: 'Captive Audience: a rolled-up orange cloth banner on a wooden pole, strapped across the back. Achievement reward for Captive Audience.',
    examine: [
      'A tightly rolled orange banner on a wooden pole, strapped across the back so it bumps against the shoulders.',
      'Saying from the Charters: a gnome who carries a sign will never lack for company, though the company will not be friendly.',
      'Tip: roll the banner from the bottom, or the message ends up upside down and everyone reads it as a warning.',
      'Joke: it weighs very little, but it always seems to be the one thing a gnome needs to get through a door.',
      'The strap is worn smooth in one place, where someone once tried to read the advert and walked into a hedge.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.04, 0.02], at: [0, 0.02, -0.03], c: 'leather-dark' },
      { s: 'cyl', d: [0.06, 0.06, 0.3], at: [0, 0.2, -0.06], rot: [0, 0, 90], c: 'tint', seg: 8 },
      { s: 'cyl', d: [0.012, 0.012, 0.36], at: [0, 0.2, -0.06], rot: [0, 0, 90], c: 'wood-dark', seg: 4 },
      { s: 'box', d: [0.12, 0.2, 0.01], at: [0.1, 0.1, -0.12], rot: [0, 0, -10], c: 'tint' },
    ],
  },
  {
    id: 'banner-scrap-flag', name: 'Banner Scrap Flag', category: 'trinket', uses: ['hold'],
    tags: ['banner', 'scrap', 'flag', 'cloth', 'torn', 'stick', 'pole', 'sign', 'reward'], emoji: [],
    tint: 'red',
    grip: [0, 0.06, 0],
    about: 'Ad Blocker: a torn scrap of red banner cloth with a white stripe, tied to a short stick. Achievement reward for Ad Blocker.',
    examine: [
      'A ragged scrap of red banner cloth with a white stripe, knotted to a short stick held by the handle.',
      'Saying from the Hedgewood: a torn advert means the sky has been asked a question and has said no.',
      'Tip: carry it point-up when you walk past a sign. Point-down, the spectators think you are surrendering.',
      'Joke: the scrap came off a banner that was already tearing, so the gnome who took it is not responsible for anything.',
      'The stick is cut from a fence rail, and a faint line of paint still shows the word KEEP OUT on one side.',
    ],
    parts: [
      { s: 'cyl', d: [0.012, 0.012, 0.4], at: [0, 0.2, 0], c: 'wood', seg: 4 },
      { s: 'box', d: [0.16, 0.14, 0.01], at: [0.06, 0.3, 0], c: 'tint' },
      { s: 'box', d: [0.16, 0.03, 0.012], at: [0.06, 0.28, 0], c: 'white' },
      { s: 'box', d: [0.06, 0.05, 0.01], at: [0.18, 0.22, 0], rot: [0, 0, 20], c: 'tint' },
    ],
  },
  {
    id: 'propeller-pendant', name: 'Propeller Pendant', category: 'trinket', uses: ['wear-neck'],
    tags: ['propeller', 'pendant', 'wood', 'cord', 'neck', 'charm', 'aircraft', 'necklace', 'reward'], emoji: [],
    about: 'Clear Skies: a small two-blade wooden propeller with a brass hub, hung on a cord at the neck. Achievement reward for Clear Skies.',
    examine: [
      'A small two-blade wooden propeller with a brass hub, dangling on a cord at the front of the neck.',
      'Saying from the Planting: a propeller that has stopped is only a stick, and a stick is only a sad thing to wear.',
      'Tip: give the blades a flick before a climb. A spinning pendant is said to bring the wind closer.',
      'Joke: it has never flown, and it has never once been asked to, which makes it the most sensible thing in the sky.',
      'One blade is chipped where it struck a low branch during a crash, and the chip is now treated as the charm.',
    ],
    parts: [
      { s: 'ring', d: [0.1, 0.006], at: [0, 0.025, 0], rot: [90, 0, 0], c: 'leather', seg: 12 },
      { s: 'cyl', d: [0.003, 0.003, 0.1], at: [0, 0.075, 0.11], c: 'leather-dark', seg: 4 },
      { s: 'box', d: [0.09, 0.02, 0.008], at: [0, 0.12, 0.125], c: 'wood' },
      { s: 'box', d: [0.02, 0.09, 0.008], at: [0, 0.12, 0.125], c: 'wood' },
      { s: 'ball', d: [0.014], at: [0, 0.12, 0.13], c: 'brass', seg: 6 },
    ],
  },
  {
    id: 'small-print-monocle', name: 'Small-Print Monocle', category: 'trinket', uses: ['wear-head'],
    tags: ['monocle', 'brass', 'lens', 'glass', 'small', 'print', 'eye', 'head', 'reward'], emoji: [],
    about: 'Read the Small Print: a brass monocle with a glass lens, on a headband with a short chain. Achievement reward for Read the Small Print.',
    examine: [
      'A brass monocle with a round glass lens, hanging from a thin headband in front of one eye.',
      'Saying from the Charters: the rarest advert is always written in the smallest print, and only the patient will find it.',
      'Tip: hold the lens close to the banner, then step back. The small print grows in the lens and shrinks everywhere else.',
      'Joke: the lens makes very small writing look important, which is how most gnome contracts were ever signed.',
      'The headband was once a hair ribbon, and its faded pattern still shows a tiny flower under the lens.',
    ],
    parts: [
      { s: 'ring', d: [0.13, 0.008], at: [0, 0.03, 0], rot: [90, 0, 0], c: 'brass', seg: 12 },
      { s: 'cyl', d: [0.004, 0.004, 0.11], at: [0, 0.085, 0.14], c: 'brass', seg: 4 },
      { s: 'ring', d: [0.035, 0.007], at: [0, 0.14, 0.15], c: 'brass', seg: 10 },
      { s: 'cyl', d: [0.03, 0.03, 0.004], at: [0, 0.14, 0.15], rot: [90, 0, 0], c: 'glass', alpha: 0.5, seg: 10 },
    ],
  },
];
