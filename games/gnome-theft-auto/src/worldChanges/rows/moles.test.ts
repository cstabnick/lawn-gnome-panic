import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import './moles';
import { worldChangeBuilder } from '../registry';

describe('mole world changes', () => {
  for (const id of ['W06', 'W13']) {
    it(`${id} builds props`, () => {
      const ctx = { scene: new THREE.Scene(), groundY: () => 0, night: () => 1, ending: () => 'A' as const };
      const built = worldChangeBuilder(id)!(ctx);
      expect(built.root.children.length).toBeGreaterThanOrEqual(3);
      expect(() => built.update?.(0.1, 1)).not.toThrow();
    });
  }
});
