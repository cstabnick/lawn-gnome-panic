// W19 (E22): Cam's epilogue follows row 62's choice.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { worldChangeBuilder } from '../registry';
import './epilogue';

describe('W19 Cam\'s broom', () => {
  for (const choice of ['A', 'B'] as const) {
    it(`builds for choice ${choice}`, () => {
      const ctx = { scene: new THREE.Scene(), groundY: () => 0, night: () => 0, ending: () => 'A' as const, choiceOf: () => choice };
      const built = worldChangeBuilder('W19')!(ctx);
      expect(built.root.children.length).toBeGreaterThan(choice === 'A' ? 2 : 1);
      expect(typeof built.update === 'function').toBe(choice === 'A');
    });
  }
});
