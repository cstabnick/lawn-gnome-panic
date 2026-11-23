// Quests and notice boards (quests.md). Step 0: initBoards is real (one board per HAVEN region on the graph); the rest waits for roadmap 7.3.
import { HAVENS, type BoardId, type DailyRow, type ItemStack, type NoticeBoard, type Quest, type QuestId, type QuestReward, type RegionId, type PlayerKey, type Resource, type WorldState } from './types';
import { HAVEN_NAME, HAVEN_REGION } from './regions';
import type { Rng } from './rng';

export type NewQuest = Omit<Quest, 'id' | 'state' | 'takenBy' | 'takenTick' | 'doneTick' | 'progress'>;

export function initBoards(w: WorldState): void {
  const boards: NoticeBoard[] = [];
  for (const h of HAVENS) {
    const region: RegionId = HAVEN_REGION[h];
    if (!w.graph.byId[region]) continue;
    const id: BoardId = `board:${region}`;
    boards.push({ id, region, haven: h, name: `${HAVEN_NAME[h]} board`, newcomer: region === 'gate-roof' });
  }
  w.boards = boards;
}
export function stepQuests(w: WorldState, rng: Rng): void { /* roadmap 7.3 */ }
export function questsOn(w: WorldState, board: BoardId): Quest[] { return []; }
export function questsNear(w: WorldState, region: RegionId, hops: number): Quest[] { return []; }
export function takeQuest(w: WorldState, q: QuestId, player: PlayerKey): boolean { return false; }
export function progressQuest(w: WorldState, q: QuestId, player: PlayerKey, amount: number): void { /* roadmap 7.3 */ }
export function deliver(w: WorldState, q: QuestId, player: PlayerKey, resource: Resource, count: number): number { return 0; }
export function completeQuest(w: WorldState, q: QuestId, player: PlayerKey): QuestReward | null { return null; }
export function abandonQuest(w: WorldState, q: QuestId, player: PlayerKey): void { /* roadmap 7.3 */ }
/** Stores the quest with the next index as its id (offered). The posting rules are roadmap 7.3. */
export function postQuest(w: WorldState, q: NewQuest): QuestId {
  const id = w.quests.length;
  w.quests.push({ ...q, id, state: 'offered', takenBy: null, takenTick: null, doneTick: null, progress: 0 });
  w.nextId.quest = w.quests.length;
  return id;
}
export function questDaily(w: WorldState): Pick<DailyRow, 'marketInBand' | 'questsOpen' | 'questsDone' | 'templatesOffered' | 'outcomesMeasured' | 'outcomesReached'> {
  return { marketInBand: false, questsOpen: 0, questsDone: 0, templatesOffered: [], outcomesMeasured: 0, outcomesReached: 0 };
}
export function questStartItems(q: Quest): ItemStack[] { return []; }
export function questTitle(w: WorldState, q: Quest): string { return q.title; }
