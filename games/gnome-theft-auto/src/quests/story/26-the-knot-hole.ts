// Story row 26 "The Knot-Hole" (docs/design/gnome-theft-auto/story-outline.md): Pip, quiet since the tablet, asks to be driven
// to the Fence gap in Mossy Wood where Sorrel records the rain. He looks through the knot-hole, opens the vial of Fescue
// soil and does not pour it. The scene at the knot is silent. The drive home has the laugh (the next sincere scene, row 31,
// needs one before it). Scenes: cutscene/scenes/story/m26-the-knot-hole.ts. The vial holds Fescue soil and nothing more is
// said; nobody says what lies beyond the Fence.
import { homeDoor } from '../../homes/data';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

/** The old west fence at the glowing knot, and the spot a pace in front of it where Pip stands (stage `knot-hole-recording`). */
const FENCE_GAP: [number, number] = [-583.5, -119];
const KNOT_FOOT: [number, number] = [-589.8, -122];

const KNOT_HOLE: QuestDef = {
  id: 'm26-the-knot-hole',
  title: 'The Knot-Hole',
  giver: 'side-valve',
  prereq: 'm25-one-leg-to-stand-on',
  chapter: 2,
  rewardAcorns: 250,
  radioBulletin: 'm26-the-knot-hole',
  // A gentle quest: a lift out and a lift back. No Hat Watch on the road.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm26-the-knot-hole-intro' },
  outro: { kind: 'script', script: 'm26-the-knot-hole-outro' },
  objectives: [
    {
      kind: 'passenger',
      text: 'Pick up Pip at Side-Valve Salvage and drive him to the Fence gap in Mossy Wood',
      who: 'pip',
      name: 'Pip',
      pickup: [-136, 74],
      dropAt: FENCE_GAP,
      radius: 10,
      hint: 'Pip, at Side-Valve Salvage',
      vehicle: { kind: 'ride-on', at: [-141, 78, Math.PI] },
      maxDamage: 0.6,
      banter: [
        'Pip says nothing. The toolbox sits on his knees and he holds it with both hands.',
        'Pip does not mention a single engine. You notice it the way you notice a clock stopping.',
        'Pip watches the trees go by. Once, he starts to say something, and does not.',
      ],
      onBoard: 'Pip climbs in and holds his toolbox on his knees.',
      onDrop: 'Pip gets out and walks to the fence. He does not look back.',
    },
    {
      kind: 'inspect',
      text: 'Stand with Pip at the knot-hole, and look with him',
      verb: 'Look',
      holdSeconds: 6,
      hint: 'The knot-hole in the old fence',
      points: [
        {
          at: KNOT_FOOT,
          label: 'The knot-hole',
          note: 'You stand beside Pip. Neither of you says anything for a long time.',
          radius: 3.5,
        },
      ],
      scene: 'm26-the-knot-hole-mid',
    },
    {
      kind: 'passenger',
      text: 'Take Pip home to Side-Valve Salvage',
      who: 'pip',
      name: 'Pip',
      pickup: [-587, -122.5],
      dropAt: homeDoor('pip'),
      radius: 10,
      hint: 'Pip, at the Fence gap',
      vehicle: { kind: 'ride-on', at: [-577, -124, Math.PI / 2] },
      maxDamage: 0.6,
      banter: [
        'Pip: "Is that a Husky-Blade? It is! Listen to it cough. Gorgeous. Wheezy. Gorgeous!"',
        'Pip: "A carburettor is a fussy little lung. Fussy! Little! Lung!"',
        'Pip: "Two-stroke, four-stroke, no-stroke. I know which one I am. I will not say."',
      ],
      onBoard: 'Pip climbs in. He is already talking again.',
      onDrop: 'Pip walks into the bay, still explaining the carburettor to nobody in particular.',
    },
  ],
  doneText: 'Pip is home, talking, and the toolbox is shut. Nobody at Side-Valve asks where you went.',
};

export const STORY: StoryFile = {
  quests: [KNOT_HOLE],
  comms: {
    'm26-the-knot-hole': {
      0: brief(
        ['pip', 'Could you drive me to the Fence gap? Sorrel is recording the rain there tonight.'],
        ['pip', 'I will not talk. Probably. Tansy says the lift is worth two hundred fifty acorns.'],
      ),
      1: call(['sorrel', 'Come and stand beside him, quietly. Hold the button, and look when he looks.']),
      2: call(['pip', 'Okay, hear me out. Your engine has opinions. Listen. Wheeze, cough, wheeze. Gorgeous.']),
    },
  },
  plans: { 'm26-the-knot-hole': { suite: 'story', expect: 'pass' } },
  bulletins: {
    'm26-the-knot-hole': [
      'Mossy Wood reports a quiet night at the old west fence. Sorrel Tillbrook of 88.7 Fescue Public recorded eleven minutes of rain and nothing else of note.',
      'A Side-Valve Salvage ride-on was seen driving slowly through the wood with a passenger who, witnesses say, said nothing at all. Local gnomes call it unprecedented.',
    ],
  },
};
