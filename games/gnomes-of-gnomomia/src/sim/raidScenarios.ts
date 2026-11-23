// Raid scenarios for the combat arena: one per raid and class, with helpers (scripts/sim-raid.mjs).
import type { ClassId } from '../config';
import { RAIDS } from '../content';
import { RAID_TUNING } from '../data/raidTuning';
import { mulberry32 } from '../rules';
import { seatRaid } from '../raidRoster';
import type { RaidDef } from '../raidTypes';
import { TacticalPlayer } from './agents';
import { runMonteCarlo } from './runner';
import type { AgentPolicy, LoadoutSpec, ScenarioSpec } from './types';

export interface RaidSimRow { raidId: string; classId: ClassId; runs: number; winRate: number; medianSeconds: number; inBand: boolean }

const RAID_BUILD: Record<string, string> = { warden: 'shieldwall', slinger: 'deadeye', mage: 'sunburst' };

export function raidScenario(raid: RaidDef, classId: ClassId): ScenarioSpec {
  const seats = seatRaidForSim(raid, classId);
  return {
    id: `${raid.id}-${classId}`,
    name: `Raid: ${raid.name} (L${raid.level}, ${classId})`,
    kind: 'boss',
    zone: raid.zone,
    waves: [
      { enemyId: raid.boss, count: 1, distance: 8, spawnAtSeconds: 0 },
      ...raid.waves.map((w) => ({
        enemyId: w.enemy,
        count: w.count,
        distance: 10,
        angleSpread: Math.PI * 1.2,
        spawnAtSeconds: w.at,
      })),
    ],
    maxSeconds: RAID_TUNING.maxSeconds,
    helpers: seats.filter((s) => s.kind === 'helper'),
    raidBoss: raid.boss,
  };
}

export function raidLoadout(raid: RaidDef, classId: ClassId): LoadoutSpec {
  return {
    level: raid.level,
    classId,
    build: RAID_BUILD[classId] as LoadoutSpec['build'],
    gearTier: 'zone-sprouted',
  };
}

export function runRaidSims(
  seeds: number,
  raidIds?: readonly string[],
  classes: readonly ClassId[] = ['warden', 'slinger', 'mage'],
): RaidSimRow[] {
  const policy: AgentPolicy = TacticalPlayer;
  const [lo, hi] = RAID_TUNING.targetSeconds;
  const rows: RaidSimRow[] = [];
  for (const raid of Object.values(RAIDS)) {
    if (raidIds && !raidIds.includes(raid.id)) continue;
    for (const classId of classes) {
      const summary = runMonteCarlo(raidScenario(raid, classId), raidLoadout(raid, classId), policy, { seeds });
      const medianSeconds = summary.medianTtkSeconds;
      rows.push({
        raidId: raid.id,
        classId,
        runs: seeds,
        winRate: summary.winRate,
        medianSeconds,
        inBand: summary.winRate >= 0.8 && medianSeconds >= lo && medianSeconds <= hi,
      });
    }
  }
  return rows;
}

/** Seats for the arena: the player is the scenario's gnome, the rest are helpers (raidRoster.seatRaid, no party). */
function seatRaidForSim(raid: RaidDef, classId: ClassId) {
  return seatRaid(RAID_TUNING.seats, { name: 'Sim', classId, level: raid.level }, [], mulberry32(1));
}
