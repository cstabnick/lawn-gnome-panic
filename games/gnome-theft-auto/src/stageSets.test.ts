// The stage set builder builds one placement per set prop, adds exactly the solid props' colliders, and the
// ?stagemarks overlay has a shape for every actor mark.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from './testing/fakeDom';
import type { Box } from './types';

installFakeDom();
const { buildStageMarks, buildStageSets } = await import('./stageSets');
const { STAGES, stageSetBoxes } = await import('./quests/stages');

describe('stage sets', () => {
  it('builds every set prop and adds the solid colliders', () => {
    const boxes: Box[] = [];
    const { count } = buildStageSets(new THREE.Scene(), boxes);
    expect(count).toBe(STAGES.reduce((n, s) => n + s.set.length, 0));
    expect(boxes.length).toBe(stageSetBoxes().length);
  });

  it('marks overlay has a shape per actor mark', () => {
    const g = buildStageMarks(new THREE.Scene());
    expect(g.children.length).toBeGreaterThanOrEqual(STAGES.reduce((n, s) => n + s.marks.length, 0));
  });
});
