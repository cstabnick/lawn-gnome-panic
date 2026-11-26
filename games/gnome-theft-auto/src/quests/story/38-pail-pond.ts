// Story row 38 (docs/design/gnome-theft-auto/story-outline.md): Pail Pond. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m38-pail-pond.ts. Stages:
// quests/stages/story/s38-pail-pond.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm38-pail-pond',
    title: "Pail Pond",
    giver: 'fells-basin',
    prereq: 'm37-snowdrop-slope',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 38: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm38-pail-pond': { 0: brief(['pip', 'Stub briefing for row 38.']) },
  },
  plans: {
    'm38-pail-pond': { suite: 'story', expect: 'pass' },
  },
};
