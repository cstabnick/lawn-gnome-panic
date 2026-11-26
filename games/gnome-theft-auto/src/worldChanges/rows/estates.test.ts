import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
vi.mock('../../audio', () => ({ play: vi.fn(), setEngine: vi.fn(), setSkid: vi.fn(), unlockAudio: vi.fn() }));
import './estates';
import { worldChangeBuilder } from '../registry';

describe('estates world changes', () => {
  for (const id of ['W02', 'W18', 'W05']) {
    it(`${id} builds props`, () => {
      const ctx = { scene: new THREE.Scene(), groundY: () => 0, night: () => 1, ending: () => 'A' as const };
      const built = worldChangeBuilder(id)!(ctx);
      expect(built.root.children.length).toBeGreaterThanOrEqual(3);
      expect(() => built.update?.(0.1, 1)).not.toThrow();
    });
  }
});
