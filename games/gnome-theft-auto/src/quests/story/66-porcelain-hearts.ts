// Story row 66 (docs/design/gnome-theft-auto/story-outline.md): Porcelain Hearts. The sincere low of act IV (tension 3). Clara, who has
// not crossed her old porch since she sealed it, asks the player to cross it with her: past the HOA's new seal tape, to a
// photograph she has not looked at in years. Two gnomes on a step; the one in the hat has a crack as fine as a hair under the
// brim. "He was one of us on the porch." She asks that he be stopped, not broken, and gives the player the photograph.
// No gag on top: the next row opens with Hedda's. Clara says "the porch", never the Tall House.
// What I chose: the outline's "cross the porch with her" is a visit whose scene walks Clara and the player through the tape
// together (a passenger needs a vehicle, and the porch is on foot); the outline's probe is an inspect (verb Look, hold).
// Scenes: cutscene/scenes/story/m66-porcelain-hearts.ts. Stages: quests/stages/story/s66-porcelain-hearts.ts.
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm66-porcelain-hearts';

/** Past the seal tape, against the house wall: the photograph stands on the boards here (the inspect's own prop). */
const PAST_TAPE: [number, number] = [-552.4, 42.4];
const PHOTOGRAPH: [number, number] = [-552.6, 40.6];
/** The porch steps, where Clara waits at the end. */
const STEPS: [number, number] = [-547.2, 38.8];

const QUEST: QuestDef = {
  id: ID,
  title: 'Porcelain Hearts',
  giver: 'strangers-porch',
  prereq: 'm65-the-countess-relents',
  chapter: 4,
  rewardAcorns: 300,
  radioBulletin: ID,
  achievement: 'gta-hairline',
  // Nobody is chasing anyone here: the tape is the only thing on the porch that belongs to the Association.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm66-porcelain-hearts-intro' },
  outro: { kind: 'script', script: 'm66-porcelain-hearts-outro' },
  objectives: [
    {
      kind: 'visit',
      text: "Cross the porch with Clara, past the HOA's seal tape",
      at: PAST_TAPE,
      radius: 1.3,
      hint: 'The sealed door on the porch, Mossy Wood: duck under the yellow tape',
      scene: 'm66-porcelain-hearts-mid',
    },
    {
      kind: 'inspect',
      text: 'Look at the old photograph in its frame',
      verb: 'Look',
      holdSeconds: 2.5,
      points: [
        {
          at: PHOTOGRAPH,
          label: 'The photograph on the porch boards',
          note: 'Two gnomes on a step. The one in the top hat has a crack under the brim, fine as a hair.',
          prop: 'porch-photograph',
          radius: 2.8,
        },
      ],
      hint: 'Hold the button by the framed photograph, past the tape',
    },
    {
      kind: 'visit',
      text: 'Go back out to Clara on the porch steps',
      at: STEPS,
      radius: 2.5,
      hint: 'Clara, on the porch steps',
    },
  ],
  doneText: 'Clara has put the photograph in your hands. A hairline, under a hat. Stop him, she says. Do not break him.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['clara', 'Previously: the Countess has relented. The Combine has a face. I know the face.'],
        ['clara', 'Come to the porch, in Mossy Wood. I have something to show you.'],
        ['clara', 'Mind the tape. It is new. I can pay three hundred acorns. Not more.'],
      ),
      1: call(['clara', 'That is him. Look under the hat. Please.']),
      2: call(['clara', 'Come out to the steps. Slowly. The boards are old.']),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: the Association has sealed a porch in Mossy Wood for structural sentiment. Neighbours say the porch is fine and the tape is the only new thing on it.',
      'A soft-spoken refuge keeper was seen crossing a sealed porch at dusk. The Association has declined to cite her. A source says nobody had the heart.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
