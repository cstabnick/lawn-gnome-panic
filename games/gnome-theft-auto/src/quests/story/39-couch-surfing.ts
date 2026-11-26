// Story row 39 (docs/design/gnome-theft-auto/story-outline.md): Couch Surfing. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m39-couch-surfing.ts. Stages:
// quests/stages/story/s39-couch-surfing.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm39-couch-surfing',
    title: "Couch Surfing",
    giver: 'fells-basin',
    prereq: 'm38-pail-pond',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 39: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm39-couch-surfing': { 0: brief(['pip', 'Stub briefing for row 39.']) },
  },
  plans: {
    'm39-couch-surfing': { suite: 'story', expect: 'pass' },
  },
};
