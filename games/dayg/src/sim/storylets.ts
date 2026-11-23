// Storylets: the scripted side quests (quests.md). Step 0 stub: ids and titles; roadmap 7.18 fills the behaviour.
import type { StoryletId, WorldState } from './types';
import type { Rng } from './rng';

export const STORYLETS: readonly { id: StoryletId; title: string }[] = [
  { id: 'last-sexton', title: 'The Last Sexton' },
  { id: 'seeds-for-spring', title: 'Seeds for the Spring' },
  { id: 'greybearded-walk', title: 'The Greybearded Walk' },
  { id: 'who-rang-the-horn', title: 'Who Rang the Horn?' },
  { id: 'mower-rumbles', title: 'The Mower Rumbles' },
  { id: 'gate-book', title: 'The Gate Book' },
];
export function stepStorylets(w: WorldState, rng: Rng): void { /* roadmap 7.18 */ }
