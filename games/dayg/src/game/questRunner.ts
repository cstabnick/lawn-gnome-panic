// Runs the quests the player has taken (quests.md). Step 0 stub: no active quests.
import type { Bus } from './bus';
import type { InventorySystem, PlayerState, QuestRunner, SimHost } from './types';
import type { Quest, QuestId } from '../sim/types';

export function createQuestRunner(deps: { host: SimHost; bus: Bus; inv: InventorySystem; getPlayer: () => PlayerState }): QuestRunner {
  return {
    update: (dt: number): void => { /* roadmap 8.4 */ },
    active: (): Quest[] => [],
    tracked: (): Quest | null => null,
    track: (id: QuestId | null): void => { /* roadmap 8.4 */ },
  };
}
