// Pay 'n' Glaze prefabs (mirror). One owner: the issue that fills this file. Starts empty.
import type { PrefabDef } from '../types';

// Mirrors: ONE mirror on its stalk on the +x side, base on y = 0, up to 0.3 tall, glass facing +z and a little -x.
export const GTA_GLAZE_MIRROR: readonly PrefabDef[] = [
  {
    id: 'glaze-mirror-wing', name: 'Wing Mirrors', category: 'prop', uses: ['place'],
    tags: ['glaze', 'mirror', 'wing', 'stalk', 'chrome', 'classic'],
    emoji: [],
    about: 'A classic wing mirror: a black stalk and a rectangular chrome mirror. Slot: mirror (Pay \'n\' Glaze), one on the left, mirrored to the right by the code.',
    examine: [
      'A square chrome mirror on a short black arm, big and sensible, with a glass face that looks slightly to the side of whatever it is asked about.',
      'Saying: a wing mirror shows you what is behind you, and the gnomes say that is the only useful thing a mirror has ever done.',
      'Tip: adjust it before you leave the shop. Once you are on the lawn, it is too late to be sensible.',
      'Joke: the mirror shows everything backwards, which is why every gnome who looks in it swears the paint job is the other way round.',
      'The black stalk is bent a little, from a gnome who tried to fold it in for a tight gate and was not told the gate was a bridge.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.025, 0.2], at: [0.05, 0.1, 0], c: 'black', seg: 6 },
      { s: 'box', d: [0.22, 0.12, 0.02], at: [0.05, 0.24, 0.02], c: 'steel' },
      { s: 'box', d: [0.18, 0.08, 0.01], at: [0.05, 0.24, 0.035], c: 'silver' },
    ],
  },
  {
    id: 'glaze-mirror-spoon', name: 'Spoon Mirrors', category: 'prop', uses: ['place'],
    tags: ['glaze', 'mirror', 'spoon', 'silver', 'curved', 'handle'],
    emoji: [],
    about: 'A silver spoon bowl used as the mirror, on a short handle stalk. Slot: mirror (Pay \'n\' Glaze), one on the left, mirrored to the right by the code.',
    examine: [
      'A silver spoon bowl, polished until it bulges, on a short handle that clearly used to belong to a much larger kitchen.',
      'Saying: a spoon mirror gives you a bigger head and a smaller car, which is the way most gnomes prefer to be seen.',
      'Tip: do not lick the bowl. It is shiny, which is not the same as clean, and the shop has been asked to explain the difference.',
      'Joke: the bowl was once stolen from a picnic, and it has been looking for the picnic ever since.',
      'Everything in it is curved and cheerful, and the driver behind you looks at least twice as tall as you, which is the point.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.02, 0.16], at: [0.05, 0.08, 0], c: 'steel', seg: 6 },
      { s: 'ball', d: [0.07], scale: [1.1, 1.2, 0.3], at: [0.05, 0.21, 0.01], c: 'silver', seg: 10 },
    ],
  },
  {
    id: 'glaze-mirror-stalks', name: 'Snail-Eye Stalks', category: 'prop', uses: ['place'],
    tags: ['glaze', 'mirror', 'stalk', 'snail', 'eye', 'glass', 'ball'],
    emoji: [],
    about: 'A snail-eye mirror: a thin stalk with a ball eye on top and a shiny glass ball on the stalk. Slot: mirror (Pay \'n\' Glaze), one on the left, mirrored to the right by the code.',
    examine: [
      'A thin green stalk, bent a little, with a white ball eye on top and a shiny glass ball halfway up that catches the whole lawn in one drop.',
      'Saying: a snail sees everything with its eyes on sticks, and the gnomes say a car with eyes on sticks sees everything twice.',
      'Tip: the stalk wobbles at speed. That is the eye looking for hedgehogs, not a fault in the mounting.',
      'Joke: the eye is painted, the shop says, but it blinks on Thursdays, and nobody on the lawn has ever caught it doing it.',
      'The glass ball is cool to the touch, unless a gnome has been looking at it for too long, in which case it is warm with embarrassment.',
    ],
    parts: [
      { s: 'cyl', d: [0.012, 0.02, 0.22], at: [0.05, 0.11, 0], c: 'leaf-dark', seg: 6 },
      { s: 'ball', d: [0.06], at: [0.05, 0.2, 0.04], c: 'silver', seg: 8 },
      { s: 'ball', d: [0.035], at: [0.05, 0.255, 0], c: 'white', seg: 8 },
      { s: 'ball', d: [0.018], at: [0.05, 0.255, 0.028], c: 'black', seg: 6 },
    ],
  },
  {
    id: 'glaze-mirror-periscope', name: 'Periscope', category: 'prop', uses: ['place'],
    tags: ['glaze', 'mirror', 'periscope', 'tube', 'steel', 'submarine'],
    emoji: [],
    about: 'A little periscope tube with two angled mirror blocks, one at each end. Slot: mirror (Pay \'n\' Glaze), one on the left, mirrored to the right by the code.',
    examine: [
      'A short dark tube with a tilted chrome block on top and another on the bottom, like a submarine that has got lost in the hedge.',
      'Saying: a periscope lets you see over the hedge and under the gate, which is two more places than most gnomes ever look.',
      'Tip: keep the top mirror clean. A periscope full of greasy fingerprints sees nothing but fingers.',
      'Joke: somewhere on the Greenhouse Strip there is a submarine that has been looking for this periscope for years.',
      'The angled blocks are set so the driver can see behind himself without turning round, which he finds more unsettling than helpful.',
    ],
    parts: [
      { s: 'cyl', d: [0.035, 0.035, 0.24], at: [0.05, 0.12, 0], c: 'iron-dark', seg: 8 },
      { s: 'box', d: [0.09, 0.05, 0.04], rot: [35, 0, 0], at: [0.05, 0.225, 0.02], c: 'steel' },
      { s: 'box', d: [0.09, 0.05, 0.04], rot: [-35, 0, 0], at: [0.05, 0.04, 0.02], c: 'steel' },
    ],
  },
];
