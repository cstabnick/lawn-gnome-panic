// Story phases for the economy sim (src/sim/economy.ts): the order a player meets the zones in, with the level band
// each phase is played at, and the rules that put every quest and spawn group into exactly one phase.
// Pure data and functions: no state, no DOM.
import type { OutdoorZoneId, QuestDef, SpawnGroup, ZoneId } from '../config';

/** The shipped phases, plus projected ones (`proj-<first level>`) from src/data/economyProjection.ts in `--cap=70` runs. */
export type PhaseId = 'mossbottom' | 'thatchford' | 'keep' | 'cloverfield' | 'hedgewood' | 'rockery' | 'verge' | `proj-${number}`;

export interface EconomyPhase {
  id: PhaseId;
  name: string;
  /** Outdoor zones whose content can fall in this phase (an interior counts as its outdoor parent). */
  zones: readonly OutdoorZoneId[];
  /** Character levels this phase is meant to be played at. */
  band: readonly [number, number];
  /** Level the player grinds to at the end of the phase when the activities fall short. Default band[1]. */
  grindTo?: number;
}

/** Seven phases in story and level order. Cloverfield (11-16) comes before the Hedgewood (15-20); the Drainpipe Deeps
 * and the Keep are split by level across three phases (upper wing, mid wing, lower wing + Chapter 6 Keep quests).
 * The lower wing and the Chapter 6 Keep quests (levels 21-25, no shop of their own) were a phase of their own
 * ('deeps', 1.4 h, which forced the short-phase floor down to 0.3); they are Chapter 6 content, so they now play
 * inside the Rockery phase. */
export const ECONOMY_PHASES: readonly EconomyPhase[] = [
  { id: 'mossbottom', name: 'Mossbottom Vale', zones: ['mossbottom'], band: [1, 6] },
  { id: 'thatchford', name: 'Thatchford Downs', zones: ['thatchford'], band: [6, 11] },
  { id: 'keep', name: 'Keep + upper Deeps', zones: ['keep', 'deeps'], band: [10, 14] },
  { id: 'cloverfield', name: 'Cloverfield', zones: ['cloverfield'], band: [11, 16] },
  { id: 'hedgewood', name: 'Hedgewood + mid Deeps', zones: ['hedgewood', 'deeps', 'keep'], band: [15, 20] },
  { id: 'rockery', name: 'Rockery + lower Deeps + Keep ch.6', zones: ['rockery', 'deeps', 'keep'], band: [19, 25] },
  { id: 'verge', name: 'The Verge', zones: ['verge'], band: [25, 30], grindTo: 30 },
];

/** A quest or spawn whose level is more than this many levels outside every band of the phases listing its zone is a
 * return visit (e.g. a level-24 errand back in Mossbottom): it goes to the first phase whose band holds its level. */
export const REVISIT_GAP = 5;

/** The outdoor zone of a zone id (an interior `<zone>/<house>` belongs to its outdoor parent). */
export function outdoorZone(zone: ZoneId): OutdoorZoneId {
  return zone.split('/')[0] as OutdoorZoneId;
}

function bandDistance(band: readonly [number, number], level: number): number {
  if (level < band[0]) return band[0] - level;
  if (level > band[1]) return level - band[1];
  return 0;
}

/** Index into ECONOMY_PHASES of the phase that content of this zone and level belongs to:
 * the first phase that lists the zone and whose band holds the level; else the nearest band among phases listing the
 * zone (earliest on a tie); else, for a return visit (see REVISIT_GAP), the first phase whose band holds the level. */
export function phaseIndexFor(zone: ZoneId, level: number): number {
  const z = outdoorZone(zone);
  let best = -1, bestD = Infinity;
  ECONOMY_PHASES.forEach((p, i) => {
    if (!p.zones.includes(z)) return;
    const d = bandDistance(p.band, level);
    if (d < bestD) { best = i; bestD = d; }
  });
  if (best >= 0 && bestD <= REVISIT_GAP) return best;
  const byLevel = ECONOMY_PHASES.findIndex((p) => bandDistance(p.band, level) === 0);
  if (byLevel >= 0) return byLevel;
  return best >= 0 ? best : ECONOMY_PHASES.length - 1;
}

export function questPhaseIndex(q: QuestDef): number {
  return phaseIndexFor(q.zone, q.level);
}

export function spawnPhaseIndex(g: SpawnGroup, enemyLevel: number): number {
  return phaseIndexFor(g.zone, enemyLevel);
}

/** Index of the phase whose shops a shopkeeper in this zone belongs to: the first phase that lists the zone. */
export function shopPhaseIndex(zone: ZoneId): number {
  const z = outdoorZone(zone);
  const i = ECONOMY_PHASES.findIndex((p) => p.zones.includes(z));
  return i >= 0 ? i : 0;
}
