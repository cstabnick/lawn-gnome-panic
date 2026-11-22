// Quest tracking: starting, counting kills and items, turn-ins, spatial objectives and rewards.
import { UI, type Condition, type ZoneId } from './config';
import { ITEMS, QUESTS } from './content';
import { bus, say } from './events';
import { addItem, removeItem, countItem } from './inventory';
import { state } from './state';
import { allEntities, spawnEnemyAt } from './entities';
import { player } from './player';
import { questGold } from './economy';

/** Seconds between the spatial checks (reach, escort, defend). */
const SPATIAL_SECONDS = 0.25;
/** A defender may wander this far past the defend radius before the timer counts against them. */
const DEFEND_LEEWAY = 6;
/** Seconds the player may stay outside the defend area before the stage resets. */
const DEFEND_OUTSIDE_SECONDS = 5;
/** Wave enemies appear this far (metres) from the defend point. */
const WAVE_MIN = 8;
const WAVE_SPREAD = 4;

/** Runtime progress of a 'defend' stage. Not saved: a reload starts the stage again. */
interface DefendRun {
  stage: number;
  zone: ZoneId;
  elapsed: number;
  outside: number;
  fired: Set<number>;
}

const defendRuns = new Map<string, DefendRun>();
let spatialPending = 0;

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
  if (c.flag && state.flags[c.flag.name] !== c.flag.value) return false;
  if (c.flagSet !== undefined && state.flags[c.flagSet] === undefined) return false;
  if (c.flagUnset !== undefined && state.flags[c.flagUnset] !== undefined) return false;
  if (c.minLevel !== undefined && state.level < c.minLevel) return false;
  if (c.classId !== undefined) {
    if (c.classId === 'none') {
      if (state.classId !== null) return false;
    } else if (state.classId !== c.classId) return false;
  }
  if (c.hasItem && countItem(c.hasItem.item) < c.hasItem.count) return false;
  if (c.questAtLeast) {
    const q = state.quests[c.questAtLeast.id];
    if (!q) return false;
    if (!q.done && q.stage < c.questAtLeast.stage) return false;
  }
  if (c.not && checkCondition(c.not)) return false;
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

/** Distance from the player to a point on the current zone's map. */
function playerDistance(x: number, z: number): number {
  return Math.hypot(player.position.x - x, player.position.z - z);
}

/** If the current stage's objective is met, move on. Spatial objectives are checked in updateQuests. */
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
  else if (o.type === 'interact') met = q.count >= o.count;
  else if (o.type === 'choice') met = state.flags[o.flag] !== undefined;
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

  defendRuns.delete(id);
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
  const gold = questGold(def);
  state.gold += gold;
  for (const r of def.reward.items) addItem(r.item, r.count);

  const itemNames = def.reward.items.map((r) => `${r.count} x ${ITEMS[r.item]?.name ?? r.item}`);
  say(`Quest complete: ${def.name}!`, UI.gold);
  say(`Reward: ${[`${gold} gold`,...itemNames].join(', ')}.`, UI.gold);
  bus.emit('quest-completed', { questId: id });
  bus.emit('quest-updated', { questId: id });
  bus.emit('changed', {});
}

/** Reach and escort: met when the player (or the escorted NPC) is in the zone within r of the point. */
function checkSpatial(): void {
  for (const id of activeQuestIds()) {
    const q = state.quests[id];
    const def = QUESTS[id];
    const stage = def.stages[q.stage];
    if (!stage) continue;
    const o = stage.objective;
    if (o.type === 'reach') {
      if (state.zone === o.zone && playerDistance(o.x, o.z) <= o.r) advance(id);
    } else if (o.type === 'escort') {
      if (state.zone !== o.zone) continue;
      const npc = allEntities().find((e) => e.defId === o.npc);
      if (!npc) continue;
      if (Math.hypot(npc.position.x - o.x, npc.position.z - o.z) <= o.r) advance(id);
    }
  }
}

/** Drops a defend run and, when asked, tells the player the defence starts again. */
function resetDefend(id: string, tell: boolean): void {
  if (!defendRuns.has(id)) return;
  defendRuns.delete(id);
  if (tell) say('You fell back. The defence starts again when you return.', UI.bad);
}

/** Runs the timer, waves and range check of a 'defend' stage. */
function tickDefend(id: string, step: number): void {
  const q = state.quests[id];
  const def = QUESTS[id];
  const stage = def.stages[q.stage];
  if (!stage || stage.objective.type !== 'defend') {
    defendRuns.delete(id);
    return;
  }
  const o = stage.objective;
  if (state.zone !== o.zone) return;

  let run = defendRuns.get(id);
  if (!run || run.stage !== q.stage) {
    run = { stage: q.stage, zone: o.zone, elapsed: 0, outside: 0, fired: new Set<number>() };
    defendRuns.set(id, run);
  }

  run.elapsed += step;

  // Range: a player who strays too far for too long fails the stage.
  if (playerDistance(o.x, o.z) > o.r + DEFEND_LEEWAY) run.outside += step;
  else run.outside = 0;
  if (run.outside >= DEFEND_OUTSIDE_SECONDS) {
    resetDefend(id, true);
    return;
  }

  o.waves.forEach((w, i) => {
    if (run.fired.has(i) || run.elapsed < w.at) return;
    run.fired.add(i);
    for (let n = 0; n < w.count; n++) {
      const a = Math.random() * Math.PI * 2;
      const d = WAVE_MIN + Math.random() * WAVE_SPREAD;
      spawnEnemyAt(w.enemy, o.x + Math.cos(a) * d, o.z + Math.sin(a) * d, { townFight: true });
    }
  });

  if (run.elapsed >= o.seconds) advance(id);
}

/** Per-frame quest work. Spatial checks run every SPATIAL_SECONDS. */
export function updateQuests(dt: number): void {
  spatialPending += dt;
  if (spatialPending < SPATIAL_SECONDS) return;
  const step = spatialPending;
  spatialPending = 0;

  checkSpatial();
  for (const id of activeQuestIds()) tickDefend(id, step);
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

  // Each use of a matching world object counts toward an 'interact' stage.
  bus.on('interacted', ({ objectId }) => {
    for (const id of activeQuestIds()) {
      const q = state.quests[id];
      const def = QUESTS[id];
      const stage = def.stages[q.stage];
      if (!stage || stage.objective.type !== 'interact' || stage.objective.object !== objectId) continue;
      q.count += 1;
      say(`${def.name}: ${q.count}/${stage.objective.count}`, UI.quest);
      checkStage(id);
    }
  });

  // A story flag may complete a 'choice' stage.
  bus.on('flag-set', () => {
    for (const id of activeQuestIds()) checkStage(id);
  });

  // Picking up items may complete a 'collect' stage.
  bus.on('item-added', () => {
    for (const id of activeQuestIds()) checkStage(id);
  });

  // Leaving a zone pauses a defend stage (it starts again on return); reach and escort are checked at once.
  bus.on('zone-changed', () => {
    for (const [id, run] of [...defendRuns]) {
      if (run.zone !== state.zone) defendRuns.delete(id);
    }
    checkSpatial();
  });

  // Dying fails a defend stage.
  bus.on('player-died', () => {
    for (const id of [...defendRuns.keys()]) resetDefend(id, true);
  });
}
