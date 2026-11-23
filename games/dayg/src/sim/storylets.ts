// Storylets: the scripted side quests (quests.md "Hand-written storylets"). Each fires once per world, when the world fits it.
import { HAVENS, STORYLET_IDS, type DistrictId, type Faction, type HavenId, type NoticeBoard, type Quest,
  type QuestGoal, type RegionId, type StoryletId, type SubjectKey, type WorldState } from './types';
import type { Rng } from './rng';
import { HAVEN_REGION } from './regions';
import { havenHolder } from './factions';
import { standingOf } from './social';
import { mowingSoon } from './mowing';
import { postQuest, type NewQuest } from './quests';
import { formatDate } from './chronicle';

export const STORYLETS: readonly { id: StoryletId; title: string }[] = [
  { id: 'last-sexton', title: 'The Last Sexton' },
  { id: 'seeds-for-spring', title: 'Seeds for the Spring' },
  { id: 'greybearded-walk', title: 'The Greybearded Walk' },
  { id: 'who-rang-the-horn', title: 'Who Rang the Horn?' },
  { id: 'mower-rumbles', title: 'The Mower Rumbles' },
  { id: 'gate-book', title: 'The Gate Book' },
];

const TITLE: Record<StoryletId, string> = Object.fromEntries(STORYLETS.map((s) => [s.id, s.title])) as Record<StoryletId, string>;
const CHRONICLE: Record<StoryletId, string> = {
  'gate-book': 'A new arrival was copied into the gate book at the Tap.',
  'last-sexton': 'Yarrow Gravelpot asked for the grave lanterns to be lit along the Old Rows.',
  'seeds-for-spring': 'Word went round that the Crypt Holders hoard clover seed.',
  'greybearded-walk': 'The Greybearded led a walker through a herd, and nobody was hurt.',
  'who-rang-the-horn': 'The chapel bell rang out of hours, and the survivors want the one who rang it.',
  'mower-rumbles': 'A rumbling came up through the grass, and every faction in one district began to plan.',
};
const KEEPERS = 'yarrow-gravelpot';
const HAVEN_REGIONS: readonly RegionId[] = HAVENS.map((h) => HAVEN_REGION[h]);
const BELL_REGION: RegionId = 'the-spire';
const OLD_ROWS_FLAG = 'storylet:last-sexton:old-rows:';

function chronicle(w: WorldState, text: string): void {
  w.chronicle.push({ tick: w.tick, text: `${formatDate(w.tick, w.tuning)}. ${text}` });
}

function aliveFaction(w: WorldState, pred: (f: Faction) => boolean): Faction | null {
  return w.factions.find((f) => f.diedTick === null && pred(f)) ?? null;
}
const keepers = (w: WorldState): Faction | null => aliveFaction(w, (f) => f.founder === KEEPERS);
const greybearded = (w: WorldState): Faction | null => aliveFaction(w, (f) => /greybearded/i.test(f.name));
const holders = (w: WorldState): Faction | null => aliveFaction(w, (f) => /holder/i.test(f.name));

function oldRowsDensity(w: WorldState): number {
  let n = 0;
  for (const r of w.graph.regions) if (r.district === 'old-rows') n += w.horde.density[r.id] ?? 0;
  return n;
}

/** Nearest board to `region` by hops along the graph (breadth-first, ties by graph order). */
function nearestBoard(w: WorldState, region: RegionId): NoticeBoard | null {
  const seen = new Set<RegionId>([region]);
  let frontier: RegionId[] = [region];
  while (frontier.length > 0) {
    for (const r of frontier) {
      const b = w.boards.find((board) => board.region === r);
      if (b) return b;
    }
    const next: RegionId[] = [];
    for (const r of frontier) {
      for (const n of w.graph.neighbours[r] ?? []) {
        if (!seen.has(n.to)) { seen.add(n.to); next.push(n.to); }
      }
    }
    frontier = next;
  }
  return null;
}

/** Poster key: the faction when there is one, else the first living NPC. */
function posterOf(w: WorldState, f: Faction | null): SubjectKey {
  if (f) return `f:${f.id}`;
  const npc = w.npcs.find((n) => n.alive) ?? w.npcs[0];
  return `n:${npc ? npc.id : 0}`;
}

function holderOf(w: WorldState, haven: HavenId): Faction | null {
  const id = havenHolder(w, haven);
  return id === null ? null : (w.factions[id] ?? null);
}

function regionOfDistrict(w: WorldState, d: DistrictId, rng: Rng): RegionId {
  const list = w.graph.regions.filter((r) => r.district === d);
  return (list.length > 0 ? rng.pick(list) : w.graph.regions[0]).id;
}

/** Whether the storylet's condition holds right now. */
function fits(w: WorldState, id: StoryletId, every: number): boolean {
  const tpd = w.tuning.clock.ticksPerDay;
  switch (id) {
    case 'gate-book':
      return w.tick >= 1;
    case 'last-sexton': {
      const k = keepers(w);
      if (!k) return false;
      const first = k.leaders[0]?.npc ?? k.leader;
      return w.npcs[first]?.alive === true;
    }
    case 'seeds-for-spring':
      return w.lastSeason === 'winter' && w.market.stock.food < w.tuning.market.target.food / 2;
    case 'greybearded-walk': {
      const g = greybearded(w);
      if (!g) return false;
      return Object.values(w.players).some((p) => p.online && standingOf(w, g.id, p.key) >= 20);
    }
    case 'who-rang-the-horn': {
      if (w.bellTick !== null && w.tick - w.bellTick <= 3 * tpd) return true;
      return w.horde.herds.some((h) => h.movedTick > w.tick - every && HAVEN_REGIONS.includes(h.region));
    }
    case 'mower-rumbles':
      return mowingSoon(w) !== null;
  }
}

function fire(w: WorldState, rng: Rng, id: StoryletId): void {
  const deadline = w.tick + w.tuning.quests.expireDays.storylet * w.tuning.clock.ticksPerDay;
  const reward = { acorns: id === 'mower-rumbles' ? 10 : 6, items: [], trust: 0.15 };
  let region: RegionId;
  let goal: QuestGoal;
  let poster: SubjectKey;
  let board: NoticeBoard | null;

  switch (id) {
    case 'gate-book': {
      region = HAVEN_REGION.tap;
      goal = { kind: 'visit', region, item: 'red-book' };
      poster = posterOf(w, holderOf(w, 'waystation'));
      board = w.boards.find((b) => b.newcomer) ?? nearestBoard(w, HAVEN_REGION.waystation);
      break;
    }
    case 'last-sexton': {
      region = 'ivy-rows';
      goal = { kind: 'storylet', storylet: id, step: 10, region };
      poster = posterOf(w, keepers(w));
      board = nearestBoard(w, region);
      w.flags[`${OLD_ROWS_FLAG}${oldRowsDensity(w)}`] = true;
      break;
    }
    case 'seeds-for-spring': {
      const h = holders(w);
      region = h ? h.home : 'child-graves';
      goal = { kind: 'storylet', storylet: id, step: 1, region };
      poster = posterOf(w, holderOf(w, 'tap'));
      board = nearestBoard(w, region);
      break;
    }
    case 'greybearded-walk': {
      const g = greybearded(w);
      region = g ? g.home : 'child-graves';
      goal = { kind: 'storylet', storylet: id, step: 1, region };
      poster = posterOf(w, g);
      board = nearestBoard(w, region);
      break;
    }
    case 'who-rang-the-horn': {
      const herd = w.horde.herds.find((h) => h.movedTick > w.tick - w.tuning.storylets.checkEvery && HAVEN_REGIONS.includes(h.region));
      region = herd ? herd.region : BELL_REGION;
      const haven = HAVENS.find((h) => HAVEN_REGION[h] === region) ?? null;
      goal = { kind: 'storylet', storylet: id, step: 2, region };
      poster = posterOf(w, haven ? holderOf(w, haven) : null);
      board = nearestBoard(w, region);
      break;
    }
    case 'mower-rumbles': {
      const soon = mowingSoon(w);
      const d: DistrictId = soon ? soon.district : 'lawn-section';
      region = regionOfDistrict(w, d, rng);
      goal = { kind: 'storylet', storylet: id, step: 1, region };
      const owner = aliveFaction(w, (f) => w.graph.byId[f.home]?.district === d);
      poster = posterOf(w, owner);
      board = nearestBoard(w, region);
      break;
    }
  }

  const q: NewQuest = {
    template: 'storylet', title: TITLE[id], poster, board: board ? board.id : null, region, goal, reward,
    postedTick: w.tick, deadline, rival: null,
  };
  const qid = postQuest(w, q);
  w.storylets.push({ id, firedTick: w.tick, quest: qid, done: false });
  w.events.push({ kind: 'storylet', storylet: id, quest: qid });
  chronicle(w, CHRONICLE[id]);
}

/** Quests this storylet posted that are now done: apply their consequences once. */
function resolveDone(w: WorldState): void {
  for (const st of w.storylets) {
    if (st.done || st.quest === null) continue;
    const q: Quest | undefined = w.quests[st.quest];
    if (!q || q.state !== 'done') continue;
    st.done = true;
    if (st.id === 'last-sexton') {
      const k = keepers(w);
      const key = Object.keys(w.flags).find((f) => f.startsWith(OLD_ROWS_FLAG));
      if (k && key) {
        const fired = Number(key.slice(OLD_ROWS_FLAG.length));
        const fell = oldRowsDensity(w) < fired;
        k.norms = { ...k.norms, strangers: fell ? 'welcome' : 'question' };
      }
    } else if (st.id === 'greybearded-walk' && q.takenBy !== null) {
      w.flags[`greybearded-walk:${q.takenBy}`] = true;
    }
  }
}

export function stepStorylets(w: WorldState, rng: Rng): void {
  const every = w.tuning.storylets.checkEvery;
  // Checks run on the last tick of each block of `every` ticks, so the first check (gate-book) falls on day 1.
  if ((w.tick + 1) % every !== 0) return;
  resolveDone(w);
  for (const { id } of STORYLETS) {
    if (!STORYLET_IDS.includes(id) || w.storylets.some((s) => s.id === id)) continue;
    if (fits(w, id, every)) fire(w, rng, id);
  }
}
