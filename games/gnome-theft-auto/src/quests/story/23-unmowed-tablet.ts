// Story row 23 "The Cracked Tablet" (rewrite, keeps its id; docs/design/gnome-theft-auto/story-outline.md). The def moved
// here from quests/chapter2.ts: prereq is now m22-off-air; objectives, count and order are unchanged. Its scenes
// (tablet-intro, tablet-outro) stay in cutscene/scenes/story/ch2d.ts. Sorrel never says "mower".
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

const UNMOWED_TABLET: QuestDef = {
  id: 'ch2-unmowed-tablet',
  title: 'The Cracked Tablet',
  giver: 'unmowed-hollow',
  prereq: 'm22-off-air',
  chapter: 2,
  rewardAcorns: 800,
  radioBulletin: 'ch2-unmowed-tablet',
  cutscene: { kind: 'script', script: 'tablet-intro' },
  outro: { kind: 'script', script: 'tablet-outro' },
  objectives: [
    {
      kind: 'visit',
      text: 'Scout the Compost Heap armor forge',
      at: [-255, -60],
      scene: 'compost-forge',
      radius: 14,
      hint: 'The Compost Heap',
    },
    {
      kind: 'crack',
      text: 'Crack the HOA welders armoring the Combine plates',
      targets: [
        { id: 'heap-welder-1', name: 'HOA Welder Slag', near: [-250, -55], hint: 'Compost Heap', look: HOA_LOOK },
        { id: 'heap-welder-2', name: 'HOA Welder Cinder', near: [-260, -65], hint: 'Compost Heap', look: HOA_LOOK },
      ],
    },
    {
      kind: 'steal-deliver',
      text: 'Hijack the HOA armor-plate Ride-On from the Compost Heap to Unmowed Hollow',
      vehicleKind: 'ride-on',
      spawnAt: [-255, -52, Math.PI],
      dropAt: [-345, 34],
      radius: 12,
      hint: 'Unmowed Hollow',
      heatOnEnter: 2,
    },
  ],
  doneText: 'The Unmowed confirm it: only an ancient Fescue Stopping Stone can jam Vesper\'s Grand Combine.',
};

export const STORY: StoryFile = {
  quests: [UNMOWED_TABLET],
  comms: {
    'ch2-unmowed-tablet': {
      0: brief(
        ['sorrel', 'The Unmowed are the gnomes who never let the blades in.'],
        ['sorrel', 'Vesper\'s welders are plating his Grand Combine at the Compost Heap.'],
        ['sorrel', 'The Elder wants their plates. He says they are his to melt.'],
      ),
      2: call(['bracken', 'The plate rig. Bring it to the hollow. Do not drive on the moss.']),
    },
  },
  plans: { 'ch2-unmowed-tablet': { suite: 'story', expect: 'pass' } },
};
