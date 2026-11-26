import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import './sideValve';
import { worldChangeBuilder } from '../registry';

describe('side-valve world changes', () => {
  for (const id of ['W08', 'W17']) {
    for (const ending of ['A', 'B'] as const) {
      it(`${id} builds props (ending ${ending})`, () => {
        const ctx = { scene: new THREE.Scene(), groundY: () => 0, night: () => 1, ending: () => ending };
        const built = worldChangeBuilder(id)!(ctx);
        expect(built.root.children.length).toBeGreaterThanOrEqual(3);
        expect(() => built.update?.(0.1, 1)).not.toThrow();
      });
    }
  }
});
