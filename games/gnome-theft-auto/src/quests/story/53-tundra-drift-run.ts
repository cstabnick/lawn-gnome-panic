// Story row 53 "Volatile on Ice" (rewrite, keeps its id; docs/design/gnome-theft-auto/story-outline.md). The def and its
// comms moved here from quests/chapter3.ts and comms.ts (E21 setup); objectives, count and order are unchanged. Its
// scenes (tundra-intro, tundra-outro) stay in cutscene/scenes/story/ch3c.ts, rewritten in E21: Bracken lends the Stopping
// Stone, and Tansy's ridge call points the crew at the Dust Flats for air power.
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

const TUNDRA: QuestDef = {
  id: 'ch3-tundra-drift-run',
  title: 'Volatile on Ice',
  giver: 'fells-basin',
  prereq: 'm52-the-test-cut',
  chapter: 3,
  rewardAcorns: 850,
  radioBulletin: 'ch3-tundra-drift-run',
  cutscene: { kind: 'script', script: 'tundra-intro' },
  outro: { kind: 'script', script: 'tundra-outro' },
  objectives: [
    {
      kind: 'steal-deliver',
      text: 'Run the ice-packed Zero-Turn across the ring road to the Dust Flats Overlook',
      vehicleKind: 'zero-turn',
      spawnAt: [10, -335, Math.PI / 2],
      dropAt: [280, 40],
      radius: 16,
      hint: 'Dust Flats Overlook',
      heatOnEnter: 2,
      maxDamage: 0.35,
    },
    {
      kind: 'crack',
      text: 'Clear the HOA spotters watching the Dust Flats Overlook',
      targets: [
        { id: 'overlook-hoa-1', name: 'HOA Spotter Dust', near: [275, 45], hint: 'Dust Flats Overlook', look: HOA_LOOK },
        { id: 'overlook-hoa-2', name: 'HOA Spotter Grit', near: [285, 35], hint: 'Dust Flats Overlook', look: HOA_LOOK },
      ],
    },
  ],
  doneText: 'The Stopping Stone reached the Dust Flats uncracked. Tansy wants air power, and the air is at Fort Sandpit.',
};

export const STORY: StoryFile = {
  quests: [TUNDRA],
  comms: {
    'ch3-tundra-drift-run': {
      0: brief(
        ['loam', 'The Combine cut its test line and Vesper named the day. Bracken lent the Stone.'],
        ['loam', 'Drive it east across the Ring Road to the Dust Flats Overlook. Gently.'],
        ['loam', 'Eight hundred and fifty acorns, and an elder\'s trust.'],
      ),
      1: call(['loam', 'HOA spotters on the overlook, my child. Crack them before they report.']),
    },
  },
  bulletins: {
    'ch3-tundra-drift-run': [
      'Turfton FM: a Zero-Turn crossed the Ring Road at dusk with a very large rock strapped in the seat, travelling carefully and at almost no speed. Witnesses called it the politest getaway on record.',
      'HOA spotters at the Dust Flats Overlook failed to file tonight\'s report. Headquarters says it was mislaid, along with two spotters.',
    ],
  },
  plans: {
    'ch3-tundra-drift-run': { suite: 'story', expect: 'pass' },
  },
};
