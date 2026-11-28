// The stage set builder builds one placement per set prop, adds exactly the solid props' colliders, and the
// ?stagemarks overlay has a shape for every actor mark. GR3 (FX05): story sets are quest-scoped (hidden and not solid
// outside their quest's window) and no solid story set prop stands on a road unless it is marked `overRoad`.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from './testing/fakeDom';
import type { Box } from './types';
import type { QuestSave } from './quests/types';

installFakeDom();
const { buildStageMarks, buildStageSets, stageWindows, storyStages, windowOpen } = await import('./stageSets');
const { STAGES, stageSetBoxes, setPropBox } = await import('./quests/stages');
const { QUESTS } = await import('./quests/defs');
const { SCENES } = await import('./cutscene/scenes/index');
const { highways } = await import('./levels');
const { CITY_HALF, ROAD_LINES, ROAD_WIDTH } = await import('./config');

const ROADS = highways();
/** On the carriageway itself (no kerb margin): the city grid and every highway. */
function onRoad(x: number, z: number): boolean {
  if (Math.abs(x) <= CITY_HALF && Math.abs(z) <= CITY_HALF) {
    for (const r of ROAD_LINES) if (Math.abs(x - r) < ROAD_WIDTH / 2 || Math.abs(z - r) < ROAD_WIDTH / 2) return true;
  }
  for (const h of ROADS) {
    for (let i = 0; i < h.points.length - 1; i++) {
      const [ax, az] = h.points[i];
      const [bx, bz] = h.points[i + 1];
      const dx = bx - ax, dz = bz - az;
      const l = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (l || 1)));
      if (Math.hypot(x - (ax + t * dx), z - (az + t * dz)) < h.width / 2) return true;
    }
  }
  return false;
}

const journal = (saves: Record<string, Partial<QuestSave>> = {}, activeId: string | null = null) => ({ activeId, saves: saves as Record<string, QuestSave> });

describe('stage sets', () => {
  it('builds every set prop and adds the solid colliders of the permanent ones only', () => {
    const boxes: Box[] = [];
    const sets = buildStageSets(new THREE.Scene(), boxes, QUESTS);
    expect(sets.count).toBe(STAGES.reduce((n, s) => n + s.set.length, 0));
    const windows = stageWindows(QUESTS);
    const permanent = STAGES.flatMap((s) => s.set.filter((p) => p.solid && (!windows.has(s.id) || p.always)));
    expect(boxes.length).toBe(permanent.length);
    expect(stageSetBoxes().length).toBeGreaterThanOrEqual(boxes.length);
  });

  it('?stagesets=all builds every collider at once', () => {
    const boxes: Box[] = [];
    buildStageSets(new THREE.Scene(), boxes, QUESTS, { all: true });
    expect(boxes.length).toBe(stageSetBoxes().length);
  });

  it('marks overlay has a shape per actor mark', () => {
    const g = buildStageMarks(new THREE.Scene());
    expect(g.children.length).toBeGreaterThanOrEqual(STAGES.reduce((n, s) => n + s.marks.length, 0));
  });
});

describe('GR3: quest-scoped story sets', () => {
  const windows = stageWindows(QUESTS);

  it('every story stage with a set and a quest has a window, and its scenes are real scenes', () => {
    const bad: string[] = [];
    for (const s of storyStages()) {
      if (!s.set.some((p) => !p.always)) continue;
      const w = windows.get(s.id);
      if (!w) { bad.push(`${s.id}: no quest in usedBy [${s.usedBy.join(', ')}]`); continue; }
      if (![...w.scenes].some((id) => SCENES[id])) bad.push(`${s.id}: none of its quests names a scene`);
    }
    expect(bad).toEqual([]);
  });

  it("Cam's lockup (#62) is hidden before #62, shown while it runs and in its scenes, hidden after it", () => {
    const scene = new THREE.Scene();
    const boxes: Box[] = [];
    let j = journal();
    const sets = buildStageSets(scene, boxes, QUESTS);
    sets.bind(() => j);
    const before = boxes.length;
    expect(sets.shown()).not.toContain('cams-lockup');
    const group = scene.getObjectByName('stage-set:cams-lockup');
    expect(group?.visible).toBe(false);

    // The intro plays before the quest is taken: the set is there for it, and gone again after.
    sets.scene('cams-cell-intro');
    expect(sets.shown()).toContain('cams-lockup');
    expect(group?.visible).toBe(true);
    sets.scene(null);
    expect(sets.shown()).not.toContain('cams-lockup');

    j = journal({ 'm62-cams-cell': { state: 'active', step: 1, cracked: [] } }, 'm62-cams-cell');
    sets.update(1);
    expect(sets.shown()).toContain('cams-lockup');
    expect(boxes.length).toBeGreaterThan(before);

    // Done: the outro still has it (it plays after the save says done), then it is cleared away.
    j = journal({ 'm62-cams-cell': { state: 'done', step: 4, cracked: [] } });
    sets.scene('cams-cell-outro');
    expect(sets.shown()).toContain('cams-lockup');
    sets.scene(null);
    expect(sets.shown()).not.toContain('cams-lockup');
    expect(boxes.length).toBe(before);
    expect(group?.visible).toBe(false);
  });

  it('a setStays stage keeps its set once its quest is done', () => {
    const w = { quests: ['q'], scenes: new Set<string>(), stays: true };
    expect(windowOpen(w, journal(), null)).toBe(false);
    expect(windowOpen(w, journal({ q: { state: 'done' } }), null)).toBe(true);
    expect(windowOpen({ ...w, stays: false }, journal({ q: { state: 'done' } }), null)).toBe(false);
  });

  it('no solid story set prop stands on a road unless it is overRoad (and then it is quest-scoped)', () => {
    const bad: string[] = [];
    for (const s of storyStages()) {
      for (const p of s.set) {
        const b = setPropBox(p);
        // A prop lifted onto a roof or a deck over the road (the Double Pot slab is 9 m up) is not in the traffic.
        if (!b || !p.solid || (p.lift ?? 0) > 3) continue;
        // Sample the turned footprint every quarter of its half-extents.
        const [hw, hd] = p.solid;
        const c = Math.cos(p.yaw), sn = Math.sin(p.yaw);
        let hit = false;
        for (let u = -1; u <= 1 && !hit; u += 0.25) {
          for (let v = -1; v <= 1 && !hit; v += 0.25) {
            const lx = u * hw, lz = v * hd;
            if (onRoad(p.at[0] + lx * c + lz * sn, p.at[1] - lx * sn + lz * c)) hit = true;
          }
        }
        if (!hit) continue;
        if (p.overRoad && !p.always && windows.has(s.id)) continue;
        bad.push(`${s.id}: ${p.prefab} at [${p.at.join(', ')}] stands on a road${p.overRoad ? ' (overRoad, but not quest-scoped)' : ''}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
