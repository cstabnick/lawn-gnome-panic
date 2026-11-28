import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

vi.mock('../../audio', () => ({ play: vi.fn(), setEngine: vi.fn(), setSkid: vi.fn(), unlockAudio: vi.fn() }));
import { worldChangeBuilder } from '../registry';
import './greenAndBarn';

describe('greenAndBarn world changes', () => {
  for (const id of ['W03', 'W04']) {
    it(`${id} builds props`, () => {
      const ctx = { scene: new THREE.Scene(), groundY: () => 0, night: () => 1, ending: () => 'A' as const };
      const out = worldChangeBuilder(id)!(ctx);
      expect(out.root.children.length).toBeGreaterThanOrEqual(3);
      expect(() => out.update?.(0.1, 1)).not.toThrow();
    });
  }
});
