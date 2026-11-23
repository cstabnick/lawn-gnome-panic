// DayG base building: material and tool item prefabs (plank, nails, hinges, mallet, saw). Empty until roadmap 9 issue 1.6.
import type { PrefabDef } from '../types';

// DayG base building: the plank, nails, iron hinge (carried and built with) and the fire ring (placed in a base).
// Setting: Mossgrave, a cemetery at gnome height. Place names used: the Old Rows, the Lychgate, the Tap, the Leaning Rows.
export const DAYG_BASE_ITEMS: readonly PrefabDef[] = [
  {
    id: 'plank', name: 'Plank', category: 'material', uses: ['hold', 'collect', 'craft'],
    tags: ['plank', 'board', 'wood', 'timber'], emoji: ['🪵'],
    about: 'An upright wooden plank 0.6 tall, 0.12 wide and 0.04 thick, with a dark knot and a sawn top end. Held by the lower third. No tint.',
    examine: [
      'A board of grey-brown wood, straight and square, with a dark knot near the middle that looks like a watching eye.',
      'Charter saying: a plank laid on the mud is a bridge, and a plank stood on end is a fence someone will regret.',
      'Hold it low, a third of the way up, or it swings about like a bad idea.',
      'The top end is cut straight across. Nobody in the Old Rows remembers doing that, and it is too neat to be a chew.',
      'Gnome law: a plank on the path is for walking, a plank on the ground is for being walked on, and a plank in a hand is for arguments.',
    ],
    grip: [0, 0.12, 0],
    parts: [
      { s: 'box', d: [0.12, 0.6, 0.04], at: [0, 0.3, 0], c: 'wood' },
      { s: 'box', d: [0.12, 0.01, 0.042], at: [0, 0.605, 0], c: 'wood-light' },
      { s: 'box', d: [0.022, 0.03, 0.006], at: [0.025, 0.36, 0.022], c: 'wood-dark' },
    ],
  },
  {
    id: 'nails', name: 'Nails', category: 'material', uses: ['collect', 'craft'],
    tags: ['nails', 'nail', 'iron', 'pins'], emoji: ['🔩'],
    about: 'A loose pile of six thin iron nails with flat heads, about 0.12 across, lying on the ground. No tint.',
    examine: [
      'A little heap of iron pins, each with a flat head, cold and grey and very easy to step on in the dark.',
      'Hearth saying: a nail is a small promise that holds a big thing to the wall.',
      'Keep them in a dry clay jar. Wet nails go brown overnight and bite the hand that picks them up.',
      'Five nails, six nails, a pocketful, and always one more under the bench that nobody can find.',
      'Someone has straightened every one of them. Nobody remembers who had that much patience.',
    ],
    parts: [
      { s: 'cyl', d: [0.0045, 0.0045, 0.05], at: [-0.02, 0.0045, -0.01], rot: [0, 20, 90], c: 'iron', seg: 5 },
      { s: 'cyl', d: [0.0085, 0.0085, 0.003], at: [0.0049, 0.0085, -0.0191], rot: [0, 20, 90], c: 'iron', seg: 6 },
      { s: 'cyl', d: [0.0045, 0.0045, 0.05], at: [0.02, 0.0045, -0.02], rot: [0, -35, 90], c: 'iron', seg: 5 },
      { s: 'cyl', d: [0.0085, 0.0085, 0.003], at: [0.0417, 0.0085, -0.0048], rot: [0, -35, 90], c: 'iron', seg: 6 },
      { s: 'cyl', d: [0.0045, 0.0045, 0.05], at: [0.01, 0.0045, 0.02], rot: [0, 70, 90], c: 'iron', seg: 5 },
      { s: 'cyl', d: [0.0085, 0.0085, 0.003], at: [0.0191, 0.0085, -0.0049], rot: [0, 70, 90], c: 'iron', seg: 6 },
      { s: 'cyl', d: [0.0045, 0.0045, 0.05], at: [-0.03, 0.0045, 0.02], rot: [0, -10, 90], c: 'iron', seg: 5 },
      { s: 'cyl', d: [0.0085, 0.0085, 0.003], at: [-0.0039, 0.0085, 0.0246], rot: [0, -10, 90], c: 'iron', seg: 6 },
      { s: 'cyl', d: [0.0045, 0.0045, 0.05], at: [0.035, 0.0045, 0], rot: [0, 110, 90], c: 'iron', seg: 5 },
      { s: 'cyl', d: [0.0085, 0.0085, 0.003], at: [0.0259, 0.0085, -0.0249], rot: [0, 110, 90], c: 'iron', seg: 6 },
      { s: 'cyl', d: [0.0045, 0.0045, 0.05], at: [0, 0.0045, -0.035], rot: [0, 40, 90], c: 'iron', seg: 5 },
      { s: 'cyl', d: [0.0085, 0.0085, 0.003], at: [0.0203, 0.0085, -0.052], rot: [0, 40, 90], c: 'iron', seg: 6 },
    ],
  },
  {
    id: 'iron-hinge', name: 'Iron Hinge', category: 'material', uses: ['collect', 'craft'],
    tags: ['hinge', 'iron', 'strap', 'pin'], emoji: ['🔩'],
    about: 'Two upright iron-dark leaves joined by a round iron pin, 0.15 tall and 0.12 wide, with three screw heads on each leaf. No tint.',
    examine: [
      'Two flat iron leaves joined by a round pin, with three tiny screw heads on each leaf like a row of buttons.',
      'Gate saying: a door that cannot swing is only a wall that has got ideas.',
      'Oil the pin before you fit it, or the hinge will shriek at every visitor from the Lychgate onward.',
      'It is built to turn one way only. Gnomes have tried the other way, and the other way has a long history.',
      'The pin has been taken out and put back so often that the knuckle wears a shine like a well-loved spoon.',
    ],
    parts: [
      { s: 'box', d: [0.056, 0.15, 0.008], at: [-0.032, 0.075, 0], c: 'iron-dark', mirror: true },
      { s: 'cyl', d: [0.007, 0.007, 0.15], at: [0, 0.075, 0], c: 'iron', seg: 6 },
      { s: 'ball', d: [0.005], at: [-0.045, 0.02, 0.006], c: 'iron', seg: 4, mirror: true },
      { s: 'ball', d: [0.005], at: [-0.045, 0.075, 0.006], c: 'iron', seg: 4, mirror: true },
      { s: 'ball', d: [0.005], at: [-0.045, 0.13, 0.006], c: 'iron', seg: 4, mirror: true },
    ],
  },
  {
    id: 'fire-ring', name: 'Fire Ring', category: 'prop', uses: ['place', 'light'],
    tags: ['fire', 'ring', 'stones', 'hearth', 'pit'], emoji: [],
    about: 'A ring of eight squashed grey stones, radius 0.3 (about 0.75 across), with an empty middle and a few charcoal lumps. No tint.',
    examine: [
      'A ring of eight rounded grey stones with an empty middle, black with old soot on the side that faces the wind.',
      'Yard saying: a fire is a circle that keeps the dark on the outside and the gnomes on the inside.',
      'Stones hold the heat long after the flame is gone, so sit close, and mind your beard on the way in.',
      'It is the one place in the Old Rows where everybody agrees to stop arguing, at least until the soup is cold.',
      'The charcoal lumps inside were not put there by the wind. Somebody sat here last night and did not say why.',
    ],
    parts: [
      { s: 'ball', d: [0.075], at: [0, 0.045, 0.3], scale: [1, 0.6, 1], c: 'stone', seg: 6 },
      { s: 'ball', d: [0.075], at: [0.212, 0.045, 0.212], scale: [1, 0.6, 1], c: 'stone-dark', seg: 6 },
      { s: 'ball', d: [0.075], at: [0.3, 0.045, 0], scale: [1, 0.6, 1], c: 'stone', seg: 6 },
      { s: 'ball', d: [0.075], at: [0.212, 0.045, -0.212], scale: [1, 0.6, 1], c: 'stone-dark', seg: 6 },
      { s: 'ball', d: [0.075], at: [0, 0.045, -0.3], scale: [1, 0.6, 1], c: 'stone', seg: 6 },
      { s: 'ball', d: [0.075], at: [-0.212, 0.045, -0.212], scale: [1, 0.6, 1], c: 'stone-dark', seg: 6 },
      { s: 'ball', d: [0.075], at: [-0.3, 0.045, 0], scale: [1, 0.6, 1], c: 'stone', seg: 6 },
      { s: 'ball', d: [0.075], at: [-0.212, 0.045, 0.212], scale: [1, 0.6, 1], c: 'stone-dark', seg: 6 },
      { s: 'ball', d: [0.025], at: [0.05, 0.0125, 0.02], scale: [1, 0.5, 1], c: 0x2b2723, seg: 5 },
      { s: 'ball', d: [0.022], at: [-0.06, 0.011, 0.05], scale: [1, 0.5, 1], c: 0x2b2723, seg: 5 },
      { s: 'ball', d: [0.024], at: [0.02, 0.012, -0.07], scale: [1, 0.5, 1], c: 0x2b2723, seg: 5 },
      { s: 'ball', d: [0.02], at: [-0.03, 0.01, -0.02], scale: [1, 0.5, 1], c: 0x2b2723, seg: 5 },
    ],
  },
];
