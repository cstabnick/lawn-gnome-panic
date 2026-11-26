// Story row 53 "Volatile on Ice" (rewrite, keeps its id; docs/design/gnome-theft-auto/story-outline.md). The def and its
// comms moved here from quests/chapter3.ts and comms.ts (E21 setup); objectives, count and order are unchanged. Its
// scenes (tundra-intro, tundra-outro) stay in cutscene/scenes/story/ch3c.ts.
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
  doneText: 'You made the Dust Flats intact. Time to take the sky from Fort Sandpit.',
};

export const STORY: StoryFile = {
  quests: [TUNDRA],
  comms: {
    'ch3-tundra-drift-run': {
      0: brief(
        ['pip', 'Tansy\'s hiding in the Dust Flats, at the overlook. She\'s got the Stone!'],
        ['pip', 'Loam packed the barrels in ice. Very volatile. Drive like it\'s soup.'],
      ),
      1: call(['tansy', 'HOA spotters on the ridge. Crack them before they phone it in.']),
    },
  },
};
