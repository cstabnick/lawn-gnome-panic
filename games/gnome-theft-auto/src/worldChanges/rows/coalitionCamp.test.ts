import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
vi.mock('../../audio', () => ({}));
import './coalitionCamp';
import { CAMP } from './coalitionCamp';
import { worldChangeBuilder } from '../registry';
import { STAGES } from '../../quests/stages';

const ctx = { scene: new THREE.Scene(), groundY: () => 0, night: () => 1, ending: () => 'A' as const };

describe('the coalition camp (W16)', () => {
  it('builds the camp and the moored Queen', () => {
    const out = worldChangeBuilder('W16')!(ctx);
    expect(out.root.children.length).toBeGreaterThanOrEqual(30);
    expect(() => out.update?.(0.1, 1)).not.toThrow();
  });

  it('keeps every prop 3 m or more from a dust-safehouse mark', () => {
    const stage = STAGES.find((s) => s.id === 'dust-safehouse')!;
    const out = worldChangeBuilder('W16')!(ctx);
    out.root.updateMatrixWorld(true);
    const p = new THREE.Vector3();
    for (const o of out.root.children) {
      o.getWorldPosition(p);
      // The Queen is at New Puddle, nowhere near the safehouse; the camp props are what the marks guard.
      for (const m of stage.marks) {
        expect(Math.hypot(p.x - m.at[0], p.z - m.at[1])).toBeGreaterThan(3);
      }
    }
    expect(Math.hypot(CAMP.x - stage.center[0], CAMP.z - stage.center[1])).toBeGreaterThan(stage.radius);
  });
});
