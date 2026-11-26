// Story row 12 (docs/design/gnome-theft-auto/story-outline.md): Quarter-Inch at Home. Juniper cannot ask her brother
// Reginald why he signed the Even-Estates permits, so the player swaps his calipers for a pair that read a quarter-inch
// long: past Gate-Guard Gary on a forged pass, into townhouse 404 (E10's walk-in interior), one photograph on the wall,
// and out by the back fence. Scenes: cutscene/scenes/story/m12-quarter-inch-at-home.ts. Stages: stages/story/s12-*.ts.
import { TOWNHOUSE_404_INTERIOR } from '../../homes/interiors';
import { homeDoor } from '../../homes/data';
import { brief, call, type StoryFile } from './kit';

const TERRACE = homeDoor('juniper');

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm12-quarter-inch-at-home',
      title: 'Quarter-Inch at Home',
      giver: 'juniper-terrace',
      prereq: 'm11-the-dons-cigars',
      chapter: 1,
      rewardAcorns: 250,
      radioBulletin: 'm12-quarter-inch-at-home',
      achievement: 'gta-off-by-a-quarter-inch',
      // A quiet job: nobody is to be hunted, and the achievement is for an alarm that never goes off.
      hoa: 'off',
      cutscene: { kind: 'script', script: 'quarter-inch-intro' },
      outro: { kind: 'script', script: 'quarter-inch-outro' },
      objectives: [
        {
          kind: 'visit',
          text: "Show Juniper's forged resident's pass to Gate-Guard Gary at the Patio Gate",
          at: [150, -127],
          radius: 7,
          hint: 'The Patio Gate',
          scene: 'quarter-inch-gate',
        },
        {
          kind: 'inspect',
          text: "Swap the calipers on Reginald's desk, and look at the one photograph on his wall",
          verb: 'Swap',
          hint: 'Townhouse 404, Patio Heights',
          points: [
            {
              at: [3.9, -1.5],
              interior: TOWNHOUSE_404_INTERIOR,
              label: "Reginald's calipers, on his desk",
              radius: 2.4,
              note: "Swapped. His calipers are in your coat; Juniper's pair lies where his lay, a quarter-inch longer than the truth.",
            },
            {
              at: [-5.0, -3.2],
              interior: TOWNHOUSE_404_INTERIOR,
              label: 'The one photograph on the wall',
              prop: 'framed-photograph',
              radius: 2.2,
              note: 'Two children on a stepladder. The taller holds a pencil, the other a ruler. "J. and R.", in pencil, on the frame.',
            },
          ],
        },
        {
          kind: 'visit',
          text: "Leave by the back fence, behind Reginald's townhouse",
          at: [95, -165.8],
          radius: 3.5,
          hint: "Back fence, Reginald's townhouse",
          scene: 'quarter-inch-mid',
        },
      ],
      doneText: "The calipers are swapped. Reginald will measure everything twice from now on, and that was always going to be Juniper's point.",
    },
  ],
  comms: {
    'm12-quarter-inch-at-home': {
      0: brief(
        ['juniper', 'My brother signed the Even-Estates permits. We speak only in notices.'],
        ['juniper', 'Swap his calipers for mine. Townhouse four-oh-four, in Patio Heights.'],
        ['juniper', 'Yours is a pass with his handwriting on it, and two hundred fifty Acorns.'],
      ),
      1: call(['juniper', 'Through the gate. The desk by the lamp. Then look at the wall.']),
      2: call(['juniper', 'He will not notice. He will measure it twice. Out by the back fence.']),
    },
  },
  givers: {
    'juniper-terrace': {
      id: 'juniper-terrace',
      name: "Juniper's terrace",
      label: 'Talk to Juniper Vance',
      x: TERRACE[0],
      z: TERRACE[1] - 1.8,
      exit: { x: TERRACE[0], z: TERRACE[1] - 4.4, yaw: Math.PI },
      room: 'street',
      letter: '!',
    },
  },
  bulletins: {
    'm12-quarter-inch-at-home': [
      'Patio Heights reports a gate guard who "checked the pass thoroughly" and was shown a forgery. The guard says the handwriting was very neat.',
      'A resident of townhouse 404 has asked the council whether a door can be both ajar and in order. The council has asked him to measure it twice.',
    ],
  },
  plans: {
    'm12-quarter-inch-at-home': { suite: 'story', expect: 'pass' },
  },
};
