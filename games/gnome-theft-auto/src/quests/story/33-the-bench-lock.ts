// Story row 33 (docs/design/gnome-theft-auto/story-outline.md): The Bench Lock. Tansy wants a proper lock for the bench where
// the Golden Acorn sleeps. The player takes Cam along to carry the heavy parts and drives him to Hogweed at the Underspan, tests
// the new lock by hand (a Dewdrop rolls past again), and drives Cam home. At dusk Tansy sets the code at the bench with Cam at
// her elbow, broom in hand: the player sees nothing wrong with him. The Golden Acorn is never named on screen.
// Scenes: cutscene/scenes/story/m33-the-bench-lock.ts. Stages: quests/stages/story/s33-the-bench-lock.ts.
import { workOf } from '../../homes/data';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm33-the-bench-lock';

/** Side-Valve's bay (Cam's work spot is the bay's centre) and the yard under the Unfinished Span (Hogweed at 580, -18). */
const SIDE_VALVE: [number, number] = workOf('turncoat-cam')!.at as [number, number];
const UNDERSPAN_DROP: [number, number] = [574, -17];
const UNDERSPAN_PICKUP: [number, number] = [577.5, -16];

const QUEST: QuestDef = {
  id: ID,
  title: 'The Bench Lock',
  giver: 'side-valve',
  prereq: 'm32-driftwoods-chart',
  chapter: 2,
  rewardAcorns: 250,
  radioBulletin: ID,
  // Two gentle rides and a lock: nothing here is worth the Hat Watch's time.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm33-the-bench-lock-intro' },
  outro: { kind: 'script', script: 'm33-the-bench-lock-outro' },
  objectives: [
    {
      kind: 'passenger',
      text: "Take Cam from Side-Valve to Hogweed's yard under the Span",
      who: 'turncoat cam',
      name: 'Cam',
      pickup: SIDE_VALVE,
      dropAt: UNDERSPAN_DROP,
      radius: 8,
      hint: 'Side-Valve Salvage, then the Underspan',
      banter: [
        'Cam: "Is this one yours? Properly yours?"',
        'Cam: "Hogweed talks a lot. Does he stop for the lock?"',
        'Cam: "I will carry the heavy parts. I carry everything. It is fine."',
      ],
      onBoard: 'Cam: "Mind the broom. It has seen things."',
      onDrop: 'Cam: "Underspan. Bigger than I remembered. Everything is."',
    },
    {
      kind: 'inspect',
      text: "Test Hogweed's new lock on his bench",
      verb: 'Test',
      hint: "Hogweed's bench, outside the workshop door",
      scene: 'm33-the-bench-lock-mid',
      points: [
        {
          at: [582, -12.4],
          label: "Hogweed's bench lock",
          note: 'You turn the four wheels to any number you like. Two clicks and it forgets them. It is yours, and nobody else knows what it knows.',
          prop: 'bench-lock',
          radius: 3,
        },
      ],
    },
    {
      kind: 'passenger',
      text: 'Take Cam and the lock back to Side-Valve Salvage',
      who: 'turncoat cam',
      name: 'Cam',
      pickup: UNDERSPAN_PICKUP,
      dropAt: SIDE_VALVE,
      radius: 8,
      hint: 'Side-Valve Salvage',
      banter: [
        'Cam: "Four wheels. Does she pick the numbers alone?"',
        'Cam: "Nice lock. I would not know where to start."',
      ],
      onBoard: 'Cam: "I have the lock. You drive. That is how we work."',
      onDrop: 'Cam: "Home. I will sweep up. I always sweep up."',
    },
  ],
  doneText: 'The lock is on the bench and the code is Tansy\'s alone. Cam swept the apron twice afterwards, which is not unusual.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['tansy', 'Previously: Hogweed built our jammer. This time he builds a lock.'],
        ['tansy', 'A proper lock for the bench. Take the old one, and take Cam.'],
        ['tansy', 'Cam carries the heavy parts. Two hundred fifty acorns. Underspan.'],
      ),
      1: call(['hogweed', 'Test it by hand! Two clicks and it is yours. Do not tell Pip.']),
      2: call(['tansy', 'Bring it home, with Cam. The code is mine. Nobody else gets it.']),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: Underspan inventor Hogweed Sprocket reports a successful lock test, a successful ball test and, separately, a successful test of how long a ball can roll before somebody notices.',
      'Side-Valve Salvage has bought a proper lock for its bench. A spokesgnome said the bench had no comment, and the lock had none either.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
