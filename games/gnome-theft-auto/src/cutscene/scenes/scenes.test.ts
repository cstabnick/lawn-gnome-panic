// Every example scene passes the line-of-sight and collision check against the real world (or its room set).
import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../../testing/fakeDom';
import type { Box } from '../../types';

// The fake DOM goes in before any game module loads (audio.ts reads window at import time).
installFakeDom();
// Some modules in the import chain (audio.ts, via vehicles.ts) listen on `window` when they load: a bare stand-in.
const g = globalThis as Record<string, unknown>;
if (!g.window) g.window = { addEventListener: () => {}, removeEventListener: () => {} };
const { checkScript, formatIssues } = await import('../check');
const { SCENES } = await import('./index');

let worldBoxes: Box[] = [];

beforeAll(async () => {
  const { buildWorld } = await import('../../world');
  const scene = new THREE.Scene();
  worldBoxes = buildWorld(scene, null as unknown as THREE.WebGLRenderer).boxes;
}, 120_000);

describe('example scenes', () => {
  it.each(Object.entries(SCENES))('%s passes every shot and path', (id, script) => {
    expect(formatIssues(id, checkScript(script, worldBoxes))).toBe(`${id}: all shots pass`);
  }, 120_000);
});
