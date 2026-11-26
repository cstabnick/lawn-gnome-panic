// Story row 14 (docs/design/gnome-theft-auto/story-outline.md): Drainpipe Court. Pip lost his toolbox to Cardoon "Swish"
// Trowelly on a bet; the player wins it back in a game to seven (E19's pickup game: a `probe` on the wins counter), and on
// the bench Pip says why he left Fescue. Scenes: cutscene/scenes/story/m14-drainpipe-court.ts.
import { COURT_PROBES, OLD_BENCH, SCOREBOARD } from '../../court/types';
import { brief, call, type StoryFile } from './kit';

const BOARD: [number, number] = [SCOREBOARD.x, SCOREBOARD.z];

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm14-drainpipe-court',
      title: 'Drainpipe Court',
      giver: 'drainpipe-pip',
      prereq: 'm13-diner-on-route-south',
      chapter: 1,
      rewardAcorns: 300,
      radioBulletin: 'm14-drainpipe-court',
      // A pickup game and a bench: nobody at the court is the Hat Watch's business.
      hoa: 'off',
      cutscene: { kind: 'script', script: 'drainpipe-court-intro' },
      outro: { kind: 'script', script: 'drainpipe-court-outro' },
      achievement: 'gta-swish-seven',
      objectives: [
        {
          kind: 'visit',
          text: 'Walk out to Swish at the east hoop',
          at: [-85.5, 30.5],
          radius: 5,
          scene: 'drainpipe-court-mid',
          hint: 'Swish at the east hoop',
        },
        {
          kind: 'probe',
          text: 'Beat Swish to seven at the chalk scoreboard',
          probe: COURT_PROBES.wins,
          count: 1,
          at: BOARD,
          hint: 'E at the chalk scoreboard',
        },
        {
          kind: 'visit',
          text: "Take Pip's toolbox from the old bench",
          at: [OLD_BENCH.x + 0.8, OLD_BENCH.z + 2],
          radius: 3.5,
          hint: 'The old bench',
        },
      ],
      doneText: "Pip's toolbox is back on the bench, where it was. He did not say thank you. He said something else.",
    },
  ],
  comms: {
    'm14-drainpipe-court': {
      0: brief(
        ['pip', 'Okay, hear me out. I lost my toolbox on a bet at Drainpipe Court.'],
        ['pip', 'Cardoon Trowelly has it. Beat him to seven points and I get it back.'],
        ['pip', 'Three hundred acorns for you. Okay, Tansy pays. Do not tell her.'],
      ),
      1: call(['pip', 'Swish says seven points, and he will go easy. He never goes easy.']),
      2: call(['pip', 'You did it! It is on the bench. Come sit. I will say something.']),
    },
  },
  plans: {
    'm14-drainpipe-court': { suite: 'story', expect: 'pass' },
  },
  givers: {
    'drainpipe-pip': {
      id: 'drainpipe-pip',
      name: 'Drainpipe Court',
      label: 'Sit with Pip',
      x: -92.6,
      z: 24.6,
      exit: { x: -91, z: 26, yaw: 0 },
      room: 'street',
      letter: 'P',
    },
  },
  bulletins: {
    'm14-drainpipe-court': [
      "Drainpipe Court reports a game to seven ended with the loser dusting the prize. Witnesses call it the politest upset in Founders' Green.",
      "Court notice: a red toolbox has changed benches. Old Burdock kept the score, out loud, twice.",
    ],
  },
};
