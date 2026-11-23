// The quest runner (quests.md, roadmap 8.4): the player's taken quests advance from play and finish when their goal is met.
// It reads the host's replica and sends `complete-quest` / `quest-progress` through the host, so a solo or host world stays exact.
import type { Bus } from './bus';
import type { InventorySystem, PlayerState, QuestRunner, SimHost } from './types';
import type { ItemId, ItemStack, Quest, QuestId } from '../sim/types';
import { SKILL } from '../config';

/** Level for an XP total: level L needs base * (growth^L - 1) / (growth - 1) XP in all (100, 250, 475, ...). */
function levelOf(xp: number): number {
  let level = 0;
  while (level < SKILL.maxLevel && xp >= SKILL.base * (SKILL.growth ** (level + 1) - 1) / (SKILL.growth - 1)) level++;
  return level;
}

/** The count a progress hint shows against ("3 of 5"); null for goals that are met by place, not by a count. */
function totalOf(q: Quest): number | null {
  const g = q.goal;
  switch (g.kind) {
    case 'deliver': case 'clear': return g.count;
    case 'find': case 'target': case 'steer': return 1;
    case 'teach': return g.hours;
    case 'storylet': return g.step;
    default: return null;
  }
}

export function createQuestRunner(deps: { host: SimHost; bus: Bus; inv: InventorySystem; getPlayer: () => PlayerState }): QuestRunner {
  const { host, bus, inv } = deps;
  let tracking: QuestId | null = null;
  let prev = new Map<QuestId, Quest>();          // active quests at the last sync
  const lastProgress = new Map<QuestId, number>();
  const pending = new Set<QuestId>();            // complete-quest sent, not yet answered
  const announced = new Set<QuestId>();          // done or failed already reported
  let checking = false;

  const mine = (): Quest[] => {
    const rec = host.world.players[host.me];
    if (!rec) return [];
    return rec.quests.map((id) => host.world.quests[id]).filter((q): q is Quest => q !== undefined);
  };

  const holds = (id: ItemId): boolean => {
    const s = inv.state;
    return s.hands.some((h) => h?.def === id) || s.pack.some((x) => x.def === id);
  };

  /** Removes one of the item from the hands, then the pack. */
  const takeItem = (id: ItemId): ItemStack | null => {
    const s = inv.state;
    for (let i = 0; i < 2; i++) {
      if (s.hands[i]?.def === id) return inv.take({ where: 'hand', index: i as 0 | 1 }, 1);
    }
    const idx = s.pack.findIndex((x) => x.def === id);
    return idx >= 0 ? inv.take({ where: 'pack', index: idx }, 1) : null;
  };

  const goalMet = (q: Quest): boolean => {
    const rec = host.world.players[host.me];
    if (!rec) return false;
    const g = q.goal;
    switch (g.kind) {
      case 'visit': return rec.region === g.region;
      case 'escort': return rec.region === g.to;
      case 'clear': case 'deliver': return q.progress >= g.count;
      case 'find': case 'target': case 'steer': return q.progress >= 1;
      case 'teach': return q.progress >= g.hours;
      case 'storylet': return q.progress >= g.step;
      default: return false;
    }
  };

  /** A completed quest: reward items to the pack, the item of a visit goal taken, done events. */
  const finish = (id: QuestId, items: ItemStack[] | undefined): void => {
    const q = host.world.quests[id];
    if (!q || announced.has(id)) return;
    announced.add(id);
    if (q.goal.kind === 'visit' && q.goal.item !== null) takeItem(q.goal.item);
    for (const stack of items ?? []) inv.add(stack);
    bus.emit('quest-done', { quest: id, template: q.template });
    bus.emit('hint', { text: `Done: ${q.title}.` });
  };

  const tryComplete = (q: Quest): void => {
    if (pending.has(q.id) || q.state !== 'taken' || !goalMet(q)) return;
    if (q.goal.kind === 'visit' && q.goal.item !== null && !holds(q.goal.item)) return;
    pending.add(q.id);
    host.apply({ kind: 'complete-quest', quest: q.id });   // solo/host: onAction answers; guest: the host answers later
  };

  const checkAll = (): void => {
    if (checking) return;
    checking = true;
    try { for (const q of mine()) tryComplete(q); } finally { checking = false; }
  };

  /** Reports quests that left the active list failed or expired, and progress hints for the tracked quest. */
  const sync = (): void => {
    const cur = mine();
    const curIds = new Set(cur.map((q) => q.id));
    for (const [id, q] of prev) {
      if (curIds.has(id) || announced.has(id)) continue;
      const now = host.world.quests[id];
      if (now && (now.state === 'failed' || now.state === 'expired')) {
        announced.add(id);
        bus.emit('quest-failed', { quest: id });
        bus.emit('hint', { text: `${q.title}: too late.` });
      }
    }
    prev = new Map(cur.map((q) => [q.id, q]));
    const t = tracked();
    for (const q of cur) {
      const before = lastProgress.get(q.id);
      lastProgress.set(q.id, q.progress);
      const total = totalOf(q);
      if (q.id === t?.id && before !== undefined && before !== q.progress && total !== null) {
        bus.emit('hint', { text: `${q.title}: ${q.progress} of ${total}` });
      }
    }
  };

  function tracked(): Quest | null {
    const list = mine();
    if (tracking !== null) {
      const q = list.find((x) => x.id === tracking);
      if (q) return q;
    }
    return list.length > 0 ? list[list.length - 1] : null;
  }

  // The host answers every envelope of mine: a complete-quest result pays out; anything else may have met a goal.
  host.onAction((env, r) => {
    if (env.player !== host.me) return;
    if (env.action.kind === 'complete-quest') {
      pending.delete(env.action.quest);
      if (r.ok) finish(env.action.quest, r.items);
      sync();
      return;
    }
    checkAll();
    sync();
  });

  bus.on('entered-region', () => { checkAll(); sync(); });

  bus.on('sim-tick', () => {
    const rec = host.world.players[host.me];
    if (rec) {
      for (const q of mine()) {
        const g = q.goal;
        if (g.kind !== 'teach') continue;
        const group = host.world.groups.find((x) => x.id === g.group);
        if (!group || rec.region !== group.region) continue;
        if (levelOf(rec.skills[g.skill] ?? 0) < g.level) continue;
        host.apply({ kind: 'quest-progress', quest: q.id, amount: 1 });
      }
    }
    checkAll();
    sync();
  });

  return {
    update: (dt: number): void => { void dt; sync(); },
    active: (): Quest[] => mine(),
    tracked,
    track: (id: QuestId | null): void => { tracking = id; },
  };
}
