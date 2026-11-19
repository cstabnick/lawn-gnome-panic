// buildLevelProps: props land at their world x/z on the ground the caller gives, and an unknown prefab id is skipped with one warning.
import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PropDef } from '@lawn/level';
import { buildLevelProps } from './levelProps';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildLevelProps', () => {
  it('places each known prop at its x/z, on the ground, with its rotation', () => {
    const parent = new THREE.Group();
    const props: PropDef[] = [
      { prefab: 'wooden-chest', x: 3, z: -4, rot: 0.5 },
      { prefab: 'wooden-chest', x: -2, z: 6 },
    ];
    const groups = buildLevelProps(parent, props, (x, z) => x + z);
    expect(groups).toHaveLength(2);
    expect(parent.children).toHaveLength(2);
    expect(groups[0].position.x).toBe(3);
    expect(groups[0].position.z).toBe(-4);
    expect(groups[0].position.y).toBe(-1);
    expect(groups[0].rotation.y).toBe(0.5);
    expect(groups[1].position.x).toBe(-2);
    expect(groups[1].position.z).toBe(6);
    expect(groups[1].position.y).toBe(4);
    expect(groups[1].rotation.y).toBe(0);
  });

  it('skips an unknown prefab id and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const parent = new THREE.Group();
    const props: PropDef[] = [
      { prefab: 'no-such-prefab-for-levelprops', x: 0, z: 0 },
      { prefab: 'wooden-chest', x: 1, z: 1 },
      { prefab: 'no-such-prefab-for-levelprops', x: 2, z: 2 },
    ];
    const groups = buildLevelProps(parent, props, () => 0);
    expect(groups).toHaveLength(1);
    expect(parent.children).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
