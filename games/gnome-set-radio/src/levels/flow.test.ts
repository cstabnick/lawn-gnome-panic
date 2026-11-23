import { describe, expect, it } from 'vitest';
import { auditLevelFlow, formatFlowReport } from './flowAudit';
import { LEVEL_ORDER, LEVELS } from './loader';

describe('Gnom Set Radio skate flow audit', () => {
  it('all 9 levels have continuous skate flow, zero dead ends, and clear spawn sightlines', () => {
    for (const id of LEVEL_ORDER) {
      const report = auditLevelFlow(LEVELS[id]);
      expect(report.spawnLeadInDist, formatFlowReport(report)).toBeLessThanOrEqual(28);
      expect(report.deadEnds, formatFlowReport(report)).toEqual([]);
      expect(report.isolatedObjectives, formatFlowReport(report)).toEqual([]);
      expect(report.flowScore, formatFlowReport(report)).toBeGreaterThanOrEqual(95);
    }
  });
});
