// Gnome Theft Auto winter sports achievement cosmetics (E12): each is the reward of one achievement in
// packages/achievements/src/catalog.ts.
import type { PrefabDef } from '../types';

export const GTA_WINTER_GEAR: readonly PrefabDef[] = [
  {
    id: 'bobble-beanie', name: 'Bobble Beanie', category: 'armor', uses: ['wear-head'],
    tags: ['beanie', 'bobble', 'hat', 'knit', 'stripes', 'winter', 'head', 'reward', 'gta'], emoji: [],
    about: 'Tea-Tray Run: a knitted beanie with red and white stripes in three bands, a folded white brim and a fat white bobble on top. Plain colours, no tint.',
    examine: [
      'A knitted beanie with red and white stripes in three bands, a folded brim at the bottom and a fat white bobble on top.',
      'Snowcap saying: the bobble is for holding on to, and nobody on the slope has ever once been seen to hold on to anything.',
      'Tip: fold the brim up before a run. A brim that falls down over the eyes is the most common cause of a tea tray going the wrong way.',
      'Joke: the bobble bounces on every jump, which tells you how high the gnome went, and never where it landed.',
      'Knitted by Gentian Bootlace, who says so every time anybody tugs the bobble, and who has been tugged more than most.',
    ],
    parts: [
      { s: 'cyl', d: [0.15, 0.15, 0.05], at: [0, 0.025, 0], c: 'white', seg: 10 },          // folded brim (min.y = 0)
      { s: 'cyl', d: [0.148, 0.148, 0.05], at: [0, 0.075, 0], c: 'red', seg: 10 },          // stripe 1
      { s: 'cyl', d: [0.147, 0.147, 0.04], at: [0, 0.12, 0], c: 'white', seg: 10 },         // stripe 2
      { s: 'cyl', d: [0.146, 0.14, 0.05], at: [0, 0.165, 0], c: 'red', seg: 10 },           // stripe 3
      { s: 'ball', d: [0.14], at: [0, 0.19, 0], scale: [1, 0.5, 1], c: 'red', seg: 8 },     // crown
      { s: 'ball', d: [0.06], at: [0, 0.3, 0], c: 'white', seg: 8 },                        // bobble
    ],
  },
  {
    id: 'ear-flap-hat', name: 'Ear-Flap Hat', category: 'armor', uses: ['wear-head'],
    tags: ['hat', 'trapper', 'earflap', 'ear', 'flap', 'woolly', 'winter', 'head', 'reward', 'gta'], emoji: [],
    about: 'First Tracks: a woolly trapper hat in mustard with brown cuffs, two ear flaps hanging at the sides, a top pompom and tie strings. Plain colours, no tint.',
    examine: [
      'A woolly trapper hat in mustard with brown cuffs, two ear flaps hanging down at the sides and a small pompom on the top.',
      'Snowcap saying: the flaps keep the wind out of the ears, and the ears are for hearing the wind say so.',
      'Tip: tie the strings under the chin, not under the nose. A nose-tied hat is a hat that is only ever half on.',
      'Joke: the ear flaps match on both sides, which is more than can be said for most of the gnome.',
      'The pompom is knitted from the spare wool of a sock that is still out on the Fells looking for its partner.',
    ],
    parts: [
      { s: 'cyl', d: [0.15, 0.16, 0.18], at: [0, 0.09, 0], c: 0xd9a62b, seg: 10 }, // crown (min.y = 0)
      { s: 'cyl', d: [0.163, 0.163, 0.05], at: [0, 0.04, 0], c: 'dirt', seg: 10 },                 // brown cuff
      { s: 'ball', d: [0.05], at: [0, 0.2, 0], c: 'wool', seg: 8 },                                // top pompom
      { s: 'box', d: [0.05, 0.16, 0.1], at: [0.15, 0.08, 0], c: 'dirt', mirror: true },            // ear flap
      { s: 'cyl', d: [0.006, 0.006, 0.1], at: [0.15, 0.055, 0.058], c: 'dirt', seg: 6, mirror: true }, // tie string
    ],
  },
  {
    id: 'crossed-skis-pack', name: 'Crossed Skis Pack', category: 'armor', uses: ['wear-back'],
    tags: ['skis', 'ski', 'pack', 'strap', 'back', 'winter', 'reward', 'wood'], emoji: [],
    about: 'Black Diamond: a strap-on pack with two short wooden skis crossed in an X behind it, their tips curled up and a brass buckle on the strap. Plain colours, no tint.',
    examine: [
      'A strap-on pack with two short wooden skis crossed behind it in an X, their tips curled up and a brass buckle on the strap.',
      'Saying of the Slope: a gnome who carries its skis down the hill has learned something, and one who carries them up has learned it the hard way.',
      'Tip: cross the skis the right way. Crossed the wrong way they are not an X at all, just two sticks that have fallen out.',
      'Joke: the pack has never once carried a ski. It has carried a lunch, a second lunch and a small and suspicious pinecone.',
      'The skis were shaped from a tea-tray lid that nobody ever got back, and the curl at each tip still has a bit of rim on it.',
    ],
    parts: [
      { s: 'box', d: [0.04, 0.6, 0.01], at: [0, 0.28, 0], rot: [0, 0, 30], c: 'wood' },            // ski A
      { s: 'box', d: [0.04, 0.6, 0.01], at: [0, 0.28, -0.015], rot: [0, 0, -30], c: 'wood-light' }, // ski B
      { s: 'ring', d: [0.03, 0.007, 180], at: [-0.17, 0.55, 0], c: 'wood-light', seg: 8 },       // ski A tip curl
      { s: 'ring', d: [0.03, 0.007, 180], at: [0.17, 0.55, -0.015], c: 'wood', seg: 8 },          // ski B tip curl
      { s: 'box', d: [0.22, 0.04, 0.02], at: [0, 0.2, 0.02], c: 'leather' },                     // strap
      { s: 'box', d: [0.04, 0.05, 0.01], at: [0, 0.2, 0.035], c: 'brass' },                     // buckle
    ],
  },
  {
    id: 'woolly-sock-scarf', name: 'Woolly Sock Scarf', category: 'armor', uses: ['wear-neck'],
    tags: ['scarf', 'sock', 'woolly', 'knit', 'wool', 'neck', 'winter', 'reward', 'cream'], emoji: [],
    about: 'Ice Station: a cream knitted scarf made from a very long sock, wound round the neck with a hanging end that finishes in a heel and a red toe. Plain colours, no tint.',
    examine: [
      'A cream knitted scarf wound twice round the neck, with a long hanging end that finishes in a heel and a red toe, like a very long sock.',
      'Snowcap saying: a sock is only as long as its owner is willing to lose it, and this one was lost for a whole winter.',
      'Tip: keep the toe at the front. A toe at the back means the sock has been put on the wrong gnome, and the gnome will feel it.',
      'Joke: the heel sits exactly where a scarf end should, which proves nobody ever knitted this thing on a foot.',
      'The wool was left in a bale at the Woolly Sock Lodge and never asked about, and it still smells faintly of wet boots.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.05], at: [0, 0.05, 0], rot: [90, 0, 0], c: 'wool', seg: 12 },         // wound ring (min.y = 0)
      { s: 'box', d: [0.1, 0.2, 0.05], at: [0.03, 0.12, 0.2], rot: [-10, 0, 0], c: 'wool' },      // hanging leg
      { s: 'box', d: [0.1, 0.07, 0.07], at: [0.03, 0.035, 0.235], c: 'wool' },                    // heel
      { s: 'box', d: [0.1, 0.045, 0.04], at: [0.03, 0.025, 0.285], c: 'red' },                    // red toe
    ],
  },
];
