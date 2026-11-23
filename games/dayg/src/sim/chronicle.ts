// The chronicle: one plain, dry, past-tense line per notable event, dated "Year 1, autumn, day 4."
// Pure: no DOM, no Math.random, no clock reads. All randomness from the chronicle stream.
import type { Rng } from './rng';
import {
  SEASONS,
  type DeathCause, type Group, type Npc, type RegionId, type Resource, type Season, type SimEvent, type Tuning, type WorldState,
} from './types';
import { seasonOf } from './weather';
import { dayOf } from './world';

/** `Year ${y}, ${season}, day ${dayInSeason}`. Years turn at spring; the first year is year 1. */
export function formatDate(tick: number, t: Tuning): string {
  const day = dayOf(tick, t);
  const n = Math.floor((day - 1) / t.clock.daysPerSeason);          // seasons since the start
  const abs = SEASONS.indexOf(t.clock.startSeason) + n;
  const year = Math.floor(abs / 4) + 1;
  const dayInSeason = ((day - 1) % t.clock.daysPerSeason) + 1;
  return `Year ${year}, ${SEASONS[abs % 4]}, day ${dayInSeason}`;
}

// Region names that read without "the" in a sentence ("at Bin Corner").
const NO_ARTICLE = new Set<string>(['Bin Corner', 'Angel Square']);

function place(w: WorldState, r: RegionId): string {
  const name = w.graph.byId[r]?.name ?? r;
  if (name.startsWith('The ')) return `the ${name.slice(4)}`;
  return NO_ARTICLE.has(name) ? name : `the ${name}`;
}

function cap(s: string): string { return s.length ? s[0].toUpperCase() + s.slice(1) : s; }

function npcName(w: WorldState, id: number): string { return w.npcs[id]?.name ?? 'A gnome'; }

function groupById(w: WorldState, id: number): Group | undefined { return w.groups.find((g) => g.id === id); }

function groupLabel(g: Group | undefined): string {
  if (!g || !g.name) return 'their group';
  return g.name.startsWith('The ') ? `the ${g.name.slice(4)}` : g.name.startsWith('the ') ? g.name : `the ${g.name}`;
}

function ledGroup(w: WorldState, npc: Npc | undefined): Group | undefined {
  if (!npc) return undefined;
  return w.groups.find((g) => g.leader === npc.id);
}

function about10(n: number): number { return Math.max(10, Math.round(n / 10) * 10); }

const DEATH_PHRASES: Record<DeathCause, readonly string[]> = {
  hatless: ['was shattered by the Hatless in', 'was pulled down by the Hatless in', 'was broken by the Hatless in'],
  gnome: ['was shattered by another gnome in', 'was broken in a fight in', 'was struck down by a neighbour in'],
  hunger: ['starved in', 'went hungry too long in', 'ran out of food in'],
  thirst: ['died of thirst in', 'went dry in', 'ran out of water in'],
  cold: ['froze and cracked in', 'cracked in the cold in', 'was split by the frost in'],
  moss: ['was taken by the moss in', 'went grey with moss in', 'was walked off by the moss in'],
  fall: ['fell and shattered in', 'fell from a stone in', 'took a bad fall in'],
};

const RESOURCE_WORD: Record<Resource, string> = {
  food: 'food', water: 'water', medicine: 'medicine', fuel: 'fuel', tools: 'tools', materials: 'materials', valuables: 'valuables',
};

function sentenceFor(w: WorldState, e: SimEvent, rng: Rng, season: Season, year: number): string | null {
  const f = w.flags;
  switch (e.kind) {
    case 'npc-died': {
      const npc = w.npcs[e.npc];
      const g = ledGroup(w, npc);
      const verb = rng.pick(DEATH_PHRASES[e.cause]);
      if (g) return `${npcName(w, e.npc)} of ${groupLabel(g)} ${verb} ${place(w, e.region)}.`;
      const key = `chron:death:${e.cause}:${e.region}:${year}:${season}`;
      if (f[key]) return null;
      f[key] = true;
      return `${npcName(w, e.npc)} ${verb} ${place(w, e.region)}.`;
    }
    case 'npc-rose': {
      const g = ledGroup(w, w.npcs[e.npc]);
      if (!g) return null;
      return rng.pick([
        `${npcName(w, e.npc)}, who led ${groupLabel(g)}, got up again in ${place(w, e.region)} without a hat.`,
        `${npcName(w, e.npc)} of ${groupLabel(g)} rose as a Hatless in ${place(w, e.region)}.`,
        `The moss walked ${npcName(w, e.npc)}, once at the head of ${groupLabel(g)}, out of ${place(w, e.region)}.`,
      ]);
    }
    case 'group-formed': {
      if (e.size < 5) return null;
      const g = groupById(w, e.group);
      const lead = g ? npcName(w, g.leader) : 'A gnome';
      const label = groupLabel(g);
      return rng.pick([
        `${e.size} gnomes gathered under ${lead} in ${place(w, e.region)} and called themselves ${label}.`,
        `${lead} took up ${e.size} gnomes in ${place(w, e.region)}. They were ${label} after that.`,
        `${cap(label)} formed in ${place(w, e.region)}, ${e.size} strong, with ${lead} at the front.`,
      ]);
    }
    case 'group-split': {
      const a = groupLabel(groupById(w, e.group));
      const b = groupLabel(groupById(w, e.newGroup));
      return rng.pick([
        `${cap(a)} split in ${place(w, e.region)}. ${cap(b)} went their own way.`,
        `${cap(b)} broke off from ${a} in ${place(w, e.region)}.`,
        `${cap(a)} could not agree in ${place(w, e.region)}, and ${b} left them.`,
      ]);
    }
    case 'herd-formed': {
      if (e.size < 40) return null;
      const n = about10(e.size);
      return rng.pick([
        `A herd of about ${n} gathered at ${place(w, e.region)}.`,
        `About ${n} Hatless bunched up in ${place(w, e.region)} and became a herd.`,
        `A herd of about ${n} formed in ${place(w, e.region)}.`,
      ]);
    }
    case 'herd-moved': {
      const nearHaven = w.graph.neighbours[e.to]?.some((nb) => w.graph.byId[nb.to]?.traits.includes('HAVEN'));
      if (!nearHaven) return null;
      const key = `chron:herd:${e.herd}:${e.to}:${dayOf(w.tick, w.tuning)}`;
      if (f[key]) return null;
      f[key] = true;
      const n = about10(e.size);
      return rng.pick([
        `A herd of about ${n} left ${place(w, e.from)} and walked into ${place(w, e.to)}.`,
        `A herd of about ${n} came out of ${place(w, e.from)} into ${place(w, e.to)}.`,
        `About ${n} Hatless moved from ${place(w, e.from)} to ${place(w, e.to)}.`,
      ]);
    }
    case 'loot-low': {
      const key = `chron:loot-low:${e.region}:${e.resource}`;
      if (f[key]) return null;
      f[key] = true;
      const res = RESOURCE_WORD[e.resource];
      return rng.pick([
        `${cap(place(w, e.region))} ${w.graph.byId[e.region]?.name.endsWith('s') ? 'were' : 'was'} picked clean of ${res}.`,
        `Nobody found any more ${res} in ${place(w, e.region)}.`,
        `The last of the ${res} in ${place(w, e.region)} was gone.`,
      ]);
    }
    case 'price-spike': {
      const key = `chron:price:${e.resource}:${dayOf(w.tick, w.tuning)}`;
      if (f[key]) return null;
      f[key] = true;
      const res = cap(RESOURCE_WORD[e.resource]);
      const p = Math.round(e.price);
      return rng.pick([
        `${res} at ${place(w, w.market.region)} went up to ${p} acorns.`,
        `${res} cost ${p} acorns at ${place(w, w.market.region)}.`,
        `The price of ${RESOURCE_WORD[e.resource]} at ${place(w, w.market.region)} rose to ${p} acorns.`,
      ]);
    }
    case 'weather': {
      const key = `chron:weather:${e.weather}:${dayOf(w.tick, w.tuning)}`; // one line per kind per day
      if (f[key]) return null;
      f[key] = true;
      if (e.weather === 'storm') {
        return rng.pick(['A storm broke over Mossgrave.', 'A storm came in over the rows.', 'It stormed over Mossgrave.', 'The wind got up and a storm came.']);
      }
      if (e.weather === 'frost') {
        return rng.pick(['Frost came down on Mossgrave.', 'The ground froze.', 'A frost settled on the stones.']);
      }
      return null;
    }
    case 'season':
      return rng.pick([`${cap(e.season)} came.`, `It turned to ${e.season}.`, `${cap(e.season)} began.`]);
    default:
      return null;
  }
}

/** Once per region, when its food falls under 5% of its start, push a 'loot-low' event. */
function checkLootLow(w: WorldState): void {
  for (const r of w.graph.regions) {
    const start = w.regionLootStart[r.id]?.food ?? 0;
    if (start <= 0) continue;
    const key = `loot-low:${r.id}:food`;
    if (w.flags[key]) continue;
    if ((w.loot[r.id]?.food ?? 0) < start * 0.05) {
      w.flags[key] = true;
      w.events.push({ kind: 'loot-low', region: r.id, resource: 'food' });
    }
  }
}

export function writeChronicle(w: WorldState, rng: Rng): void {
  checkLootLow(w);
  const t = w.tuning;
  const date = formatDate(w.tick, t);
  const day = dayOf(w.tick, t);
  const season = seasonOf(day, t);
  const year = Math.floor((SEASONS.indexOf(t.clock.startSeason) + Math.floor((day - 1) / t.clock.daysPerSeason)) / 4) + 1;
  for (const e of w.events) {
    const s = sentenceFor(w, e, rng, season, year);
    if (s) w.chronicle.push({ tick: w.tick, text: `${date}. ${s}` });
  }
}
