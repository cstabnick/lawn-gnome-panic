import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import './lights';
import { worldChangeBuilder } from '../registry';

describe('lights rows (W10, W12)', () => {
  for (const id of ['W10', 'W12']) {
    it(`${id} builds props and updates`, () => {
      const ctx = { scene: new THREE.Scene(), groundY: () => 0, night: () => 1, ending: () => 'A' as const };
      const built = worldChangeBuilder(id)!(ctx);
      expect(built.root.children.length).toBeGreaterThanOrEqual(3);
      expect(() => built.update?.(0.1, 1)).not.toThrow();
    });
  }
});
