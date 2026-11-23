import { beforeAll, describe, expect, it } from 'vitest';
import type { Box } from '../types';
import { groundHeight } from '../collide';
import { checkFrame, checkPath, pointBlocked, segmentHit, type LosWorld } from './los';
import type { ActorSample, CameraSample, SceneFrame, ScenePath } from './script';

// One box, footprint -1..1 on x and z, 3 m tall. Built once: collide.ts caches its grid per array object.
const boxes: Box[] = [{ minX: -1, maxX: 1, minZ: -1, maxZ: 1, h: 3 }];
const world: LosWorld = { boxes, ground: () => 0 };

// The first groundHeight call builds the terrain grid, which is slow on a busy machine: pay for it once up front.
beforeAll(() => { groundHeight(0, 0, 0.2, boxes, 0); }, 60000);

const actor = (over: Partial<ActorSample> & { id: string }): ActorSample => ({
  visible: true, x: 0, y: 0, z: 0, yaw: 0, speed: 0, head: 1.6, gesture: null, gestureT: 0,
  sitting: false, talking: false, held: null, seatedIn: null, seat: 0, mount: null, ...over,
});

const camera = (over: Partial<CameraSample> = {}): CameraSample => ({
  pos: [5, 2, 5], look: [0, 1, 0], fov: 52, step: 3, target: null, shake: 0, ...over,
});

const frame = (over: Partial<SceneFrame> = {}): SceneFrame => ({
  t: 1.5, actors: {}, vehicles: {}, props: {}, camera: camera(), say: null, title: null, caption: null, fade: 0,
  ...over,
});

const walkPath = (points: [number, number, number][]): ScenePath => ({ who: 'pip', kind: 'walk', step: 7, points });

describe('segmentHit', () => {
  it('hits the box when the segment runs through it', () => {
    const hit = segmentHit([-5, 1, 0], [5, 1, 0], world);
    expect(hit?.by).toBe('box');
  });

  it('is clear when the segment passes over the box', () => {
    expect(segmentHit([-5, 4, 0], [5, 4, 0], world)).toBeNull();
  });

  it('hits the terrain when the segment dips into the ground', () => {
    const hit = segmentHit([-5, 1, 5], [5, -1, 5], world);
    expect(hit?.by).toBe('terrain');
  });
});

describe('pointBlocked', () => {
  it('flags a point inside a box', () => {
    expect(pointBlocked([0, 1, 0], world)).toBe('box');
  });

  it('flags a point near the wall once a margin is given', () => {
    expect(pointBlocked([1.2, 1, 0], world)).toBeNull();
    expect(pointBlocked([1.2, 1, 0], world, 0.3)).toBe('box');
  });

  it('flags a point below the ground', () => {
    expect(pointBlocked([5, -0.5, 5], world)).toBe('terrain');
  });
});

describe('checkFrame', () => {
  it('flags a camera inside a box', () => {
    const issues = checkFrame(frame({ camera: camera({ pos: [0, 1, 0], look: [5, 1, 5] }) }), world);
    expect(issues.map((i) => i.kind)).toContain('camera-inside');
  });

  it('flags a target hidden behind a box', () => {
    const f = frame({
      actors: { pip: actor({ id: 'pip', x: 6, y: 0, z: 0 }) },
      camera: camera({ pos: [-6, 1.5, 0], look: [6, 1, 0], target: 'pip' }),
    });
    const issues = checkFrame(f, world);
    const hidden = issues.find((i) => i.kind === 'target-hidden');
    expect(hidden?.who).toBe('pip');
  });

  it('flags an actor floating in the air', () => {
    const f = frame({
      actors: { pip: actor({ id: 'pip', x: 5, y: 1, z: 5 }) },
      camera: camera({ pos: [8, 2, 8], look: [5, 1, 5], target: 'pip' }),
    });
    expect(checkFrame(f, world).map((i) => i.kind)).toContain('actor-floating');
  });

  it('accepts an actor standing on top of the box', () => {
    const f = frame({
      actors: { pip: actor({ id: 'pip', x: 0, y: 3, z: 0 }) },
      camera: camera({ pos: [6, 5, 6], look: [0, 3, 0], target: 'pip' }),
    });
    const kinds = checkFrame(f, world).map((i) => i.kind);
    expect(kinds).not.toContain('actor-floating');
    expect(kinds).not.toContain('actor-in-wall');
  });
});

describe('checkPath', () => {
  it('reports one blocked issue for a walk through the box', () => {
    const points: [number, number, number][] = [];
    for (let x = -4; x <= 4; x += 0.5) points.push([x, 0, 0]);
    const issues = checkPath(walkPath(points), world);
    expect(issues.filter((i) => i.kind === 'path-blocked')).toHaveLength(1);
  });

  it('flags a dinghy drive with no water', () => {
    const vehicle: ScenePath = {
      who: 'dinghy', kind: 'drive', vehicleKind: 'walnut-dinghy', step: 2,
      points: [[0, 0, 0], [3, 0, 0]],
    };
    const noWater: LosWorld = { ...world, water: () => null };
    expect(checkPath(vehicle, noWater).map((i) => i.kind)).toContain('boat-off-water');
  });
});
