// Quest tracking: starting, counting kills and items, turn-ins and rewards.
import { QUESTS, ITEMS, UI, type Condition } from './config';
import { bus, say } from './events';
import { addItem, removeItem, countItem } from './inventory';
import { state } from './state';

/** 'none' = never started, 'done' = finished, otherwise 'active'. */
export function questStatus(id: string): 'none' | 'active' | 'done' {
  const q = state.quests[id];
  if (!q) return 'none';
  return q.done ? 'done' : 'active';
}

/** True when every field given in the condition holds. */
export function checkCondition(c: Condition | undefined): boolean {
  if (!c) return true;
  if (c.quest && questStatus(c.quest.id) !== c.quest.status) return false;
  if (c.questStage) {
    const q = state.quests[c.questStage.id];
    if (!q || q.done || q.stage !== c.questStage.stage) return false;
  }
  return true;
}

/** Ids of quests that are started and not yet finished. */
function activeQuestIds(): string[] {
  return Object.keys(state.quests).filter((id) => QUESTS[id] && questStatus(id) === 'active');
}

export function startQuest(id: string): void {
  const def = QUESTS[id];
  if (!def || state.quests[id]) return;
  state.quests[id] = { stage: 0, count: 0, done: false };
  say(`Quest started: ${def.name}`, UI.quest);
  bus.emit('quest-updated', { questId: id });
  bus.emit('changed', {});
  checkStage(id);
}

/** If the current stage's objective is met, move on. */
function checkStage(id: string): void {
  const q = state.quests[id];
  const def = QUESTS[id];
  if (!q || q.done || !def) return;
  const stage = def.stages[q.stage];
  if (!stage) return;
  const o = stage.objective;
  let met = false;
  if (o.type === 'collect') met = countItem(o.item) >= o.count;
  else if (o.type === 'kill') met = q.count >= o.count;
  // 'talk' is only met by a talk event (see initQuests).
  if (met) advance(id);
}

function advance(id: string): void {
  const q = state.quests[id];
  const def = QUESTS[id];
  if (!q || q.done || !def) return;
  const stage = def.stages[q.stage];
  if (!stage) return;

  // A turn-in takes its items before the next stage starts.
  for (const t of stage.takeItems ?? []) removeItem(t.item, t.count);

  q.stage += 1;
  q.count = 0;

  if (q.stage >= def.stages.length) {
    complete(id);
    return;
  }
  const next = def.stages[q.stage];
  say(`Quest updated: ${next.text}`, UI.quest);
  bus.emit('quest-updated', { questId: id });
  bus.emit('changed', {});
  checkStage(id);
}

function complete(id: string): void {
  const q = state.quests[id];
  const def = QUESTS[id];
  if (!q || !def) return;
  q.done = true;
  state.gold += def.reward.gold;
  for (const r of def.reward.items) addItem(r.item, r.count);

  const itemNames = def.reward.items.map((r) => `${r.count} x ${ITEMS[r.item]?.name ?? r.item}`);
  say(`Quest complete: ${def.name}!`, UI.gold);
  say(`Reward: ${[`${def.reward.gold} gold`, ...itemNames].join(', ')}.`, UI.gold);
  bus.emit('quest-updated', { questId: id });
  bus.emit('changed', {});
}

/** Subscribes to game events. Call once, AFTER createDialogue so the dialogue sees the state before a turn-in. */
export function initQuests(): void {
  // Talking to an NPC can advance a 'talk' stage (or be blocked by missing turn-in items).
  bus.on('talk', ({ npcId }) => {
    for (const id of activeQuestIds()) {
      const q = state.quests[id];
      const def = QUESTS[id];
      const stage = def.stages[q.stage];
      if (!stage || stage.objective.type !== 'talk' || stage.objective.npc !== npcId) continue;
      const short = (stage.takeItems ?? []).find((t) => countItem(t.item) < t.count);
      if (short) {
        say(`You still need ${short.count} x ${ITEMS[short.item]?.name ?? short.item}.`, UI.bad);
        continue;
      }
      advance(id);
    }
  });

  // Each kill counts toward a matching 'kill' stage.
  bus.on('enemy-killed', ({ defId }) => {
    for (const id of activeQuestIds()) {
      const q = state.quests[id];
      const def = QUESTS[id];
      const stage = def.stages[q.stage];
      if (!stage || stage.objective.type !== 'kill' || stage.objective.enemy !== defId) continue;
      q.count += 1;
      say(`${def.name}: ${q.count}/${stage.objective.count}`, UI.quest);
      checkStage(id);
    }
  });

  // Picking up items may complete a 'collect' stage.
  bus.on('item-added', () => {
    for (const id of activeQuestIds()) checkStage(id);
  });
}
