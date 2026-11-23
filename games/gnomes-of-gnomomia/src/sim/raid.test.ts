// Keeps every raid x class inside the 2-3 minute band (RAID_TUNING.targetSeconds) with an 80% win rate.
// The CLI (npm run sim:raid -- --check) uses 30 seeds; this uses 8 for speed, so the median band is looser.
import { describe, expect, it } from 'vitest';
import { RAIDS } from '../content';
import type { ClassId } from '../config';
import { runRaidSims } from './raidScenarios';

const CLASSES: readonly ClassId[] = ['warden', 'slinger', 'mage'];

describe('raid clear times', () => {
  for (const raidId of Object.keys(RAIDS)) {
    for (const classId of CLASSES) {
      it(`${raidId} / ${classId} clears in band and is won`, () => {
        const [row] = runRaidSims(8, [raidId], [classId]);
        expect(row).toBeDefined();
        expect(row.winRate).toBeGreaterThanOrEqual(0.75);
        expect(row.medianSeconds).toBeGreaterThanOrEqual(110);
        expect(row.medianSeconds).toBeLessThanOrEqual(190);
      }, 120_000);
    }
  }
});
