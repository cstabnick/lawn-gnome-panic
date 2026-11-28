import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import './saucerCourt';
import { worldChangeBuilder } from '../registry';

describe('saucerCourt world changes', () => {
  for (const id of ['W01', 'W09']) {
    it(`${id} builds a root with props`, () => {
      const ctx = { scene: new THREE.Scene(), groundY: () => 0, night: () => 1, ending: () => 'A' as const };
      const built = worldChangeBuilder(id)!(ctx);
      expect(built.root.children.length).toBeGreaterThanOrEqual(3);
      expect(() => built.update?.(0.1, 1)).not.toThrow();
    });
  }
});
