// Story row 42 (docs/design/gnome-theft-auto/story-outline.md): Rutbottom Impound. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m42-rutbottom-impound.ts. Stages:
// quests/stages/story/s42-rutbottom-impound.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm42-rutbottom-impound',
    title: "Rutbottom Impound",
    giver: 'fells-basin',
    prereq: 'm41-pinwheel-ridge',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 42: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm42-rutbottom-impound': { 0: brief(['pip', 'Stub briefing for row 42.']) },
  },
  plans: {
    'm42-rutbottom-impound': { suite: 'story', expect: 'pass' },
  },
};
