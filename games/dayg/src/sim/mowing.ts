// The mower and the districts it cuts (world.md). The Mowing is never seen: it is a rumble, then a night of flat grass.
import { DISTRICTS, RESOURCES, type DistrictId, type RegionId, type Trait, type WorldState } from './types';
import type { Rng } from './rng';
import { formatDate } from './chronicle';

const DISTRICT_NAME: Record<DistrictId, string> = {
  lychgate: 'the Lychgate', 'old-rows': 'the Old Rows', 'yew-walk': 'the Yew Walk', 'gnome-garden': 'the Gnome Garden',
  wreathwood: 'Wreathwood', compost: 'the Compost Heaps', columbarium: 'the Columbarium', 'bell-chapel': 'the Bell Chapel',
  'mausoleum-hill': 'Mausoleum Hill', 'lawn-section': 'the Lawn Section', 'drowned-corner': 'the Drowned Corner', shed: 'the Shed',
};

function chronicle(w: WorldState, text: string): void {
  w.chronicle.push({ tick: w.tick, text: `${formatDate(w.tick, w.tuning)}. ${text}` });
}

/** Districts that have at least one region on the current graph, in DISTRICTS order. */
function presentDistricts(w: WorldState): DistrictId[] {
  const present = new Set<DistrictId>(w.graph.regions.map((r) => r.district));
  return DISTRICTS.filter((d) => present.has(d));
}

function pickDistrict(w: WorldState, rng: Rng): DistrictId {
  return rng.weighted(presentDistricts(w), (d) => (d === 'lawn-section' ? 3 : 1));
}

function nextGap(w: WorldState, rng: Rng): number {
  const [lo, hi] = w.tuning.mowing.everyDays;
  return rng.int(lo, hi) * w.tuning.clock.ticksPerDay;
}

export function initMowing(w: WorldState, rng: Rng): void {
  w.mowing.next = w.tick + nextGap(w, rng);
}

export function stepMowing(w: WorldState, rng: Rng): void {
  const m = w.mowing;
  const tpd = w.tuning.clock.ticksPerDay;
  const t = w.tuning.mowing;

  if (!m.warned && m.next - w.tick <= t.warnDays * tpd) {
    m.district = pickDistrict(w, rng);
    m.warned = true;
    w.events.push({ kind: 'mowing-soon', district: m.district });
    chronicle(w, `The ground shook in the night, somewhere toward ${DISTRICT_NAME[m.district]}.`);
  }
  if (w.tick < m.next) return;

  const d = m.district ?? pickDistrict(w, rng);
  m.mownUntil[d] = w.tick + t.coverDays * tpd;
  const inD = (r: RegionId): boolean => w.graph.byId[r].district === d;

  // Herds in the district scatter: a share of each herd's size settles as loose Hatless in a neighbour outside d.
  for (const herd of w.horde.herds) {
    if (!inD(herd.region)) continue;
    const moved = Math.min(herd.size, rng.round(herd.size * t.herdScatter));
    if (moved <= 0) continue;
    const outside = w.graph.neighbours[herd.region].filter((n) => !inD(n.to));
    if (outside.length === 0) continue;
    const to = rng.pick(outside).to;
    herd.size -= moved;
    w.horde.density[to] = (w.horde.density[to] ?? 0) + moved;
  }

  // Loot in the district spills: a share of each region's stock moves to one random neighbour (conserved).
  for (const r of w.graph.regions) {
    if (!inD(r.id)) continue;
    const nbs = w.graph.neighbours[r.id];
    if (nbs.length === 0) continue;
    const to = rng.pick(nbs).to;
    for (const res of RESOURCES) {
      const stock = w.loot[r.id][res];
      const amt = Math.min(stock, rng.round(stock * t.spillShare));
      if (amt <= 0) continue;
      w.loot[r.id][res] = stock - amt;
      w.loot[to][res] += amt;
    }
  }

  w.events.push({ kind: 'mowing', district: d });
  chronicle(w, `In one night the grass of ${DISTRICT_NAME[d]} was cut flat.`);
  m.lastTick = w.tick;
  m.next = w.tick + nextGap(w, rng);
  m.warned = false;
  m.district = null;
}

export function isMown(w: WorldState, d: DistrictId): boolean { return (w.mowing.mownUntil[d] ?? -1) > w.tick; }

export function mowingSoon(w: WorldState): { district: DistrictId; inTicks: number } | null {
  if (!w.mowing.warned || w.mowing.district === null) return null;
  return { district: w.mowing.district, inTicks: w.mowing.next - w.tick };
}

export function regionTraits(w: WorldState, r: RegionId): readonly Trait[] {
  const def = w.graph.byId[r];
  if (!isMown(w, def.district)) return def.traits;
  return [...def.traits.filter((t) => t !== 'COVER' && t !== 'OPEN'), 'OPEN'];
}
