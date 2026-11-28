// Coast signs print both faces on a post (D58). Pure scene-graph checks, no DOM.
import { describe, expect, it } from 'vitest';
import type * as THREE from 'three';
import { coastSign } from './sign';

function plates(g: THREE.Group): THREE.Object3D[] {
  return g.children.filter((c) => c.name === 'home-plate');
}

describe('coastSign faces', () => {
  it('prints both faces on a post (back defaults to true)', () => {
    const ps = plates(coastSign('A\nB', { post: 1 }));
    expect(ps).toHaveLength(2);
    const front = ps.find((p) => p.rotation.y === 0);
    const back = ps.find((p) => Math.abs(p.rotation.y - Math.PI) < 1e-9);
    expect(front).toBeDefined();
    expect(back).toBeDefined();
    expect(front!.position.z).toBeGreaterThan(0.04);
    expect(back!.position.z).toBeLessThan(-0.04);
  });

  it('prints only the front on a sign fixed to something (post 0)', () => {
    expect(plates(coastSign('A', { post: 0 }))).toHaveLength(1);
  });

  it('leaves the plain board when back is false', () => {
    expect(plates(coastSign('A', { post: 1, back: false }))).toHaveLength(1);
  });

  it('prints a second joke on the back when back is a string', () => {
    expect(plates(coastSign('A', { post: 0, back: 'B' }))).toHaveLength(2);
  });
});
