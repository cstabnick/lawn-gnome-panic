// Story row 52 (docs/design/gnome-theft-auto/story-outline.md): The Test Cut. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m52-the-test-cut.ts. Stages:
// quests/stages/story/s52-the-test-cut.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm52-the-test-cut-p1',
    title: "The Test Cut: Tee Time",
    giver: 'fells-basin',
    prereq: 'm51-the-flock-stands',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 52: replaced by the E21 quest writer.',
  },
  {
    id: 'm52-the-test-cut-p2',
    title: "The Test Cut: Mow Line",
    giver: 'fells-basin',
    prereq: 'm52-the-test-cut-p1',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 52: replaced by the E21 quest writer.',
  },
  {
    id: 'm52-the-test-cut-p3',
    title: "The Test Cut: Against the Deck",
    giver: 'fells-basin',
    prereq: 'm52-the-test-cut-p2',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 52: replaced by the E21 quest writer.',
  },
  {
    id: 'm52-the-test-cut',
    title: "The Test Cut: Through the Hedge",
    giver: 'fells-basin',
    prereq: 'm52-the-test-cut-p3',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 52: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm52-the-test-cut-p1': { 0: brief(['pip', 'Stub briefing for row 52.']) },
    'm52-the-test-cut-p2': { 0: brief(['pip', 'Stub briefing for row 52.']) },
    'm52-the-test-cut-p3': { 0: brief(['pip', 'Stub briefing for row 52.']) },
    'm52-the-test-cut': { 0: brief(['pip', 'Stub briefing for row 52.']) },
  },
  plans: {
    'm52-the-test-cut-p1': { suite: 'story', expect: 'pass' },
    'm52-the-test-cut-p2': { suite: 'story', expect: 'pass' },
    'm52-the-test-cut-p3': { suite: 'story', expect: 'pass' },
    'm52-the-test-cut': { suite: 'story', expect: 'pass' },
  },
};
