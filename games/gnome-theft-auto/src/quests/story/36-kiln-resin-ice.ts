// Story row 36 "Kiln-Resin & Black Ice" (rewrite, keeps its id; docs/design/gnome-theft-auto/story-outline.md). The def
// and its comms moved here from quests/chapter3.ts and comms.ts (E21 setup); objectives, count and order are unchanged.
// Its scenes (kiln-resin-intro, kiln-resin-outro) stay in cutscene/scenes/story/ch3b.ts.
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

const KILN_RESIN: QuestDef = {
  id: 'ch3-kiln-resin-ice',
  title: 'Kiln-Resin & Black Ice',
  giver: 'fells-basin',
  prereq: 'ch3-salvage-raid',
  chapter: 3,
  rewardAcorns: 900,
  radioBulletin: 'ch3-kiln-resin-ice',
  cutscene: { kind: 'script', script: 'kiln-resin-intro' },
  outro: { kind: 'script', script: 'kiln-resin-outro' },
  objectives: [
    {
      kind: 'visit',
      text: 'Fetch Kiln-Resin from the northern shrine',
      at: [-30, -520],
      radius: 12,
      hint: 'Kiln-Resin Shrine',
    },
    {
      kind: 'crack',
      text: 'Crack the HOA salt-plow crew blocking the Frozen Birdbath approach',
      targets: [
        { id: 'plow-hoa-1', name: 'Salt-Plow Driver Grit', near: [-12, -390], hint: 'North Basin Approach', look: HOA_LOOK },
        { id: 'plow-hoa-2', name: 'Salt-Plow Driver Frost', near: [12, -390], hint: 'North Basin Approach', look: HOA_LOOK },
      ],
    },
    {
      kind: 'survive-derby',
      text: 'Survive the 90-second Frozen Birdbath Derby against HOA snow-pursuit mowers',
      arena: [0, -350],
      radius: 42,
      seconds: 90,
      attackers: 8,
      hint: 'Frozen Birdbath Basin',
    },
    {
      kind: 'visit',
      text: 'Pick up the snail-mail scroll from Shelldon\'s courier snail by Thermos Theo\'s barrel',
      at: [40, -330],
      radius: 10,
      hint: 'Thermos Theo\'s Bend',
    },
  ],
  doneText: 'Pip\'s clay arm is glued tight with Kiln-Resin—just as one of Shelldon\'s snails delivers a scroll from Tansy.',
};

export const STORY: StoryFile = {
  quests: [KILN_RESIN],
  comms: {
    'ch3-kiln-resin-ice': {
      0: brief(
        ['loam', 'Kiln-Resin, from the northern shrine. Without it, the boy\'s arm stays in a sack.'],
        ['loam', 'The HOA salts the road to keep pilgrims off it. Crack the plow crew.'],
      ),
      2: call(['loam', 'Ninety seconds while it sets. Keep them off the basin, my child.']),
      3: call(['pip', 'It set! Arm\'s on! Thermos Theo says there\'s post for us. Snail post!']),
    },
  },
};
