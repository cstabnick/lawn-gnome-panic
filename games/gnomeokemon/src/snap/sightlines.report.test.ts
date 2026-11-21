// Record of the lawn sight-line tuning: how much of the lawn ride the camera sees with the hedges in place.
// The curve is the lawn rail from its level document (src/data/levels/lawn.level.json).

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildSightBlockers } from './occluders';
import { buildRailCurve, groundHeight } from './levels';
import { traceSightlines, visibleFraction } from './sightlines';

describe('lawn sight-line report', () => {
  it('reports how much of the lawn ride is visible past the blockers', () => {
    const curve = buildRailCurve('lawn');
    const scene = new THREE.Scene();
    const blockers = buildSightBlockers(scene, curve, (x, z) => groundHeight('lawn', x, z));
    const report = traceSightlines(curve, blockers, { lookAhead: 0.15 });
    const fraction = visibleFraction(report);

    const counts: Record<string, number> = {};
    for (const block of blockers) counts[block.name] = (counts[block.name] ?? 0) + 1;
    console.log(`lawn sight lines visible (lookAhead 0.15): ${fraction.toFixed(3)}`);
    console.log(`blocks per type: ${JSON.stringify(counts)}`);
    console.log(`samples blocked per type: ${JSON.stringify(report.blockedBy)}`);

    expect(fraction).toBeGreaterThanOrEqual(0.35);
    expect(fraction).toBeLessThanOrEqual(0.6);
  });
});
