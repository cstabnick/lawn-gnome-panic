// DayG: achievement gear (oath token, pebble crown, gate token cord, lamplighter cap, waystation medal, herder's satchel).
import type { PrefabDef } from '../types';

export const DAYG_GEAR: readonly PrefabDef[] = [
  {
    id: 'oath-token', name: 'Oath Token', category: 'trinket', uses: ['wear-neck', 'collect'],
    tags: ['token', 'oath', 'name', 'brass', 'sworn', 'pendant', 'cord'], emoji: ['📛'],
    about: 'A brass disc on a leather cord worn round the neck, the disc resting on the chest (+z). No tint.',
    examine: [
      'A round brass disc on a leather cord, stamped with a mark that is nearly worn away.',
      'Old saying: a gnome is only as sworn as the token that says so, and tokens get lost in the Mowing.',
      'Wear it under the coat so the rain does not turn the stamp green. The stamp is the only thing that matters.',
      'It was given for a promise. Nobody remembers the promise, only that it was kept.',
      'The back of the disc has a thumbnail scratch, and beside it a second, fainter name that was scraped off.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.008], at: [0, 0.008, -0.04], rot: [90, 0, 0], c: 'leather', seg: 12 }, // cord round the neck (min.y = 0)
      { s: 'cyl', d: [0.03, 0.03, 0.012], at: [0, 0.045, 0.165], rot: [90, 0, 0], c: 'brass', seg: 8 },   // the disc, on the chest
      { s: 'box', d: [0.02, 0.006, 0.004], at: [0, 0.045, 0.173], c: 'brass' },
    ],
  },
  {
    id: 'pebble-crown', name: 'Pebble Crown', category: 'armor', uses: ['wear-head'],
    tags: ['crown', 'king', 'kingmaker', 'pebble', 'stone', 'band', 'head'], emoji: ['👑'],
    about: 'A band of grey slate with four pebbles set around it and four small peaks, worn on the head. No tint.',
    examine: [
      'A ring of grey slate, with pebbles pressed into it at the front, the back and both sides.',
      'Charter saying: a crown is only a rock that everyone agreed to stand on.',
      'Wear it level. A tilted crown tells the whole yard which way you have been leaning.',
      'It was made by a gnome who had never seen a crown, and has been copied by every gnome since.',
      'Two of the peaks are chipped, so the crown has been voted king twice and has had to explain itself both times.',
    ],
    parts: [
      { s: 'ring', d: [0.1, 0.02], at: [0, 0.02, 0], rot: [90, 0, 0], c: 'slate', seg: 8 },
      { s: 'ball', d: [0.025], at: [0, 0.05, 0.1], c: 'slate', seg: 6 },
      { s: 'ball', d: [0.025], at: [0, 0.05, -0.1], c: 'slate', seg: 6 },
      { s: 'ball', d: [0.025], at: [0.1, 0.05, 0], c: 'slate', seg: 6 },
      { s: 'ball', d: [0.025], at: [-0.1, 0.05, 0], c: 'slate', seg: 6 },
      { s: 'cone', d: [0.03, 0.08], at: [0.07, 0.06, 0.07], c: 'slate', seg: 5 },
      { s: 'cone', d: [0.03, 0.08], at: [-0.07, 0.06, -0.07], c: 'slate', seg: 5 },
    ],
  },
  {
    id: 'gate-token-cord', name: 'Gate Token Cord', category: 'trinket', uses: ['wear-neck', 'collect'],
    tags: ['token', 'tokens', 'gate', 'four', 'cord', 'brass', 'necklace'], emoji: ['🪙'],
    about: 'A thin cord round the neck hung with four small brass tokens along its front (+z). No tint.',
    examine: [
      'A loop of cord with four small brass tokens strung along the bottom of it, each one nicked at the edge.',
      'Gate saying: four gnomes at the gate is a fair crowd, and five is an argument.',
      'Keep the tokens apart when you wear them, or they clink on the fence and wake the whole row.',
      'Each token was cut from the same brass pot, and none of them agree on which pot that was.',
      'The cord is tied twice. The first knot was for the gate, and the second was for whoever came after.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.006], at: [0, 0.008, -0.04], rot: [90, 0, 0], c: 'leather', seg: 12 }, // cord round the neck (min.y = 0)
      { s: 'cyl', d: [0.018, 0.018, 0.006], at: [-0.11, 0.03, 0.115], rot: [90, -40, 0], c: 'brass', seg: 8 }, // four tokens along the front of the cord
      { s: 'cyl', d: [0.018, 0.018, 0.006], at: [-0.04, 0.03, 0.155], rot: [90, -12, 0], c: 'brass', seg: 8 },
      { s: 'cyl', d: [0.018, 0.018, 0.006], at: [0.04, 0.03, 0.155], rot: [90, 12, 0], c: 'brass', seg: 8 },
      { s: 'cyl', d: [0.018, 0.018, 0.006], at: [0.11, 0.03, 0.115], rot: [90, 40, 0], c: 'brass', seg: 8 },
    ],
  },
  {
    id: 'lamplighter-cap', name: 'Lamplighter Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'hat', 'lamp', 'lamplighter', 'keeper', 'leather', 'head'], emoji: ['🧢'],
    about: 'A close-fitting leather cap with a flat brim and a small brass lamp pinned on top, about 0.25 wide. No tint.',
    examine: [
      'A close leather cap with a flat brim, and a brass lamp pinned to the crown that is always a little warm.',
      'Lamp saying: a light kept lit in the Old Rows is a promise that the next gnome will find the way.',
      'Trim the wick every dusk. A lamp that smokes is a lamp that gets blamed for the trouble after.',
      'It keeps the rain off the head and the moths off the brass, which is more than most hats manage.',
      'The lamp has been relit so many times that the brass has gone soft and a little bent, like a hopeful spoon.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.12, 0.012], at: [0, 0.006, 0], c: 'leather', seg: 10 },
      { s: 'cyl', d: [0.085, 0.095, 0.1], at: [0, 0.062, 0], c: 'leather', seg: 10 },
      { s: 'cyl', d: [0.03, 0.03, 0.02], at: [0, 0.122, 0], c: 'brass', seg: 8 },
      { s: 'ball', d: [0.02], at: [0, 0.15, 0], c: 'brass', glow: true, seg: 6 },
    ],
  },
  {
    id: 'waystation-medal', name: 'Waystation Medal', category: 'trinket', uses: ['wear-neck', 'collect'],
    tags: ['medal', 'badge', 'waystation', 'gate', 'slate', 'brass', 'gatekeeper'], emoji: ['🏅'],
    about: 'A six-sided slate medal with a brass bar inlaid across it, on a cord round the neck, the medal resting on the chest (+z). No tint.',
    examine: [
      'A six-sided slate medal with a brass bar set into it, on a cord that has been mended twice.',
      'Gatekeeper saying: a waystation is only as good as the gnome who stands at its door all season.',
      'Hang it outside the coat in the rain. It is meant to be seen, and to be seen from a long way off.',
      'It is heavier than it looks, and a sensible gnome uses the weight to decide which way to fall.',
      'Someone has scratched a tally into the back, seven strokes, and then stopped, as if they had gone home.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.008], at: [0, 0.008, -0.04], rot: [90, 0, 0], c: 'leather', seg: 12 }, // cord round the neck (min.y = 0)
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [0, 0.045, 0.165], rot: [90, 0, 0], c: 'slate', seg: 6 }, // the medal, on the chest
      { s: 'box', d: [0.05, 0.01, 0.006], at: [0, 0.045, 0.173], c: 'brass' },
    ],
  },
  {
    id: 'herder-satchel', name: "Herder's Satchel", category: 'armor', uses: ['wear-back'],
    tags: ['satchel', 'bag', 'herder', 'herd', 'leather', 'crook', 'back', 'pack'], emoji: ['🎒'],
    about: 'A leather satchel with a buckled flap and a short herding crook strapped to its side, worn on the back, about 0.3 tall. No tint.',
    examine: [
      'A leather satchel with a buckled flap, and a short wooden crook strapped to one side for turning stray herds.',
      'Herder saying: a herd goes where it is led, and the herder goes where the herd does not object to.',
      'Buckle the flap before you whistle. A satchel that opens on a stampede gives away every biscuit you own.',
      'The crook has been used to hook a great many bootlaces, and only occasionally a herd.',
      'Inside, folded very small, is a map with every pit marked in the same careful hand, and a note saying "not this one".',
    ],
    parts: [
      { s: 'box', d: [0.12, 0.14, 0.05], at: [0, 0.07, 0], c: 'leather' },
      { s: 'box', d: [0.13, 0.04, 0.012], at: [0, 0.12, 0.032], c: 'leather' },
      { s: 'box', d: [0.03, 0.03, 0.01], at: [0, 0.1, 0.04], c: 'brass' },
      { s: 'cyl', d: [0.008, 0.008, 0.22], at: [0.07, 0.2, -0.04], rot: [20, 0, 0], c: 'wood', seg: 6 },
    ],
  },
];
