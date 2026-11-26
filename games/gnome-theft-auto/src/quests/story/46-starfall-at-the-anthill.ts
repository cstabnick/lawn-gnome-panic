// Story row 46 (docs/design/gnome-theft-auto/story-outline.md): Starfall at the Anthill. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m46-starfall-at-the-anthill.ts. Stages:
// quests/stages/story/s46-starfall-at-the-anthill.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm46-starfall-at-the-anthill-p1',
    title: "Starfall at the Anthill: Night Class",
    giver: 'fells-basin',
    prereq: 'm45-rootwell-admissions',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 46: replaced by the E21 quest writer.',
  },
  {
    id: 'm46-starfall-at-the-anthill-p2',
    title: "Starfall at the Anthill: The Sugar Toll",
    giver: 'fells-basin',
    prereq: 'm46-starfall-at-the-anthill-p1',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 46: replaced by the E21 quest writer.',
  },
  {
    id: 'm46-starfall-at-the-anthill-p3',
    title: "Starfall at the Anthill: The Lens",
    giver: 'fells-basin',
    prereq: 'm46-starfall-at-the-anthill-p2',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 46: replaced by the E21 quest writer.',
  },
  {
    id: 'm46-starfall-at-the-anthill',
    title: "Starfall at the Anthill: Dean's Leap",
    giver: 'fells-basin',
    prereq: 'm46-starfall-at-the-anthill-p3',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 46: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm46-starfall-at-the-anthill-p1': { 0: brief(['pip', 'Stub briefing for row 46.']) },
    'm46-starfall-at-the-anthill-p2': { 0: brief(['pip', 'Stub briefing for row 46.']) },
    'm46-starfall-at-the-anthill-p3': { 0: brief(['pip', 'Stub briefing for row 46.']) },
    'm46-starfall-at-the-anthill': { 0: brief(['pip', 'Stub briefing for row 46.']) },
  },
  plans: {
    'm46-starfall-at-the-anthill-p1': { suite: 'story', expect: 'pass' },
    'm46-starfall-at-the-anthill-p2': { suite: 'story', expect: 'pass' },
    'm46-starfall-at-the-anthill-p3': { suite: 'story', expect: 'pass' },
    'm46-starfall-at-the-anthill': { suite: 'story', expect: 'pass' },
  },
};
