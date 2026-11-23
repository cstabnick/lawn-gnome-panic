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
const { QUESTS } = await import('../../quests/defs');

let worldBoxes: Box[] = [];

beforeAll(async () => {
  const { buildWorld } = await import('../../world');
  const scene = new THREE.Scene();
  worldBoxes = buildWorld(scene, null as unknown as THREE.WebGLRenderer).boxes;
  // The stage set dressing (stageSets.ts) is part of the live world too: the diner, benches, barrels.
  const { stageSetBoxes } = await import('../../quests/stages');
  worldBoxes = [...worldBoxes, ...stageSetBoxes()];
  // The Speedway's barriers, grandstands and podium are built by the game after the world (raceTrack/index.ts): its
  // race scenes are checked against them too.
  const { buildTrackDressing } = await import('../../raceTrack/trackDressing');
  buildTrackDressing(scene, worldBoxes);
}, 120_000);

describe('example scenes', () => {
  it.each(Object.entries(SCENES))('%s passes every shot and path', (id, script) => {
    expect(formatIssues(id, checkScript(script, worldBoxes))).toBe(`${id}: all shots pass`);
  }, 120_000);
});

describe('quest scenes', () => {
  it('every quest intro and outro script id is a SCENES entry', () => {
    const missing: string[] = [];
    for (const q of QUESTS) {
      for (const spec of [q.cutscene, q.outro]) {
        if (spec?.kind === 'script' && typeof spec.script === 'string' && !SCENES[spec.script]) missing.push(`${q.id}: ${spec.script}`);
      }
      for (const o of q.objectives) if (o.kind === 'visit' && o.scene && !SCENES[o.scene]) missing.push(`${q.id} visit: ${o.scene}`);
    }
    expect(missing).toEqual([]);
  });
});
