import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import './party';
import { worldChangeBuilder } from '../registry';

describe('party world change', () => {
  for (const ending of ['A', 'B'] as const) {
    it(`W07 builds the bunting, poster and pie table (ending ${ending})`, () => {
      const ctx = { scene: new THREE.Scene(), groundY: () => 0, night: () => 1, ending: () => ending };
      const built = worldChangeBuilder('W07')!(ctx);
      expect(built.root.children.length).toBeGreaterThanOrEqual(5);
      expect(() => built.update?.(0.1, 1)).not.toThrow();
    });
  }
});
