import { describe, it, expect } from 'vitest';
import { compile, eventsBetween, sampleFrame, scenePaths } from './timeline';
import type { SceneScript, Step } from './script';

const timing = { charsPerSecond: 10, holdSeconds: () => 1 };
const env = { ground: () => 0 };

function scene(steps: Step[], extra: Partial<SceneScript> = {}): SceneScript {
  return { id: 'test', stage: { kind: 'world' }, steps, ...extra };
}

describe('compile', () => {
  it('places blocking steps one after another', () => {
    const tl = compile(scene([{ do: 'wait', s: 1 }, { do: 'wait', s: 2 }, { do: 'wait', s: 0.5 }]), timing);
    expect(tl.steps.map((s) => s.start)).toEqual([0, 1, 3]);
    expect(tl.duration).toBe(3.5);
  });

  it('starts async steps at the same moment as the next step', () => {
    const tl = compile(scene([{ do: 'wait', s: 5, async: true }, { do: 'wait', s: 1 }]), timing);
    expect(tl.steps.map((s) => s.start)).toEqual([0, 0]);
  });

  it('does not block on a cam move or a shake', () => {
    const tl = compile(scene([
      { do: 'cam', shot: { kind: 'dolly', from: [0, 1, 0], to: [1, 1, 0], look: [0, 1, 0], s: 2 } },
      { do: 'shake', amp: 0.1, s: 1 },
      { do: 'wait', s: 1 },
    ]), timing);
    const wait = tl.steps.find((s) => s.step.do === 'wait');
    expect(wait?.start).toBe(0);
  });

  it('gives a parallel step the length of its longest track', () => {
    const tl = compile(scene([
      { do: 'parallel', tracks: [[{ do: 'wait', s: 2 }], [{ do: 'wait', s: 3 }]] },
      { do: 'wait', s: 1 },
    ]), timing);
    const par = tl.steps.find((s) => s.step.do === 'parallel');
    expect(par?.dur).toBe(3);
    expect(tl.steps.find((s) => s.step.do === 'wait' && s.dur === 1)?.start).toBe(3);
  });

  it('types a say line at the text speed and holds it', () => {
    const tl = compile(scene([{ do: 'say', who: 'Narrator', text: '0123456789' }]), timing);
    expect(tl.steps[0].typeDur).toBe(1);
    expect(tl.steps[0].dur).toBe(2);
    expect(tl.steps[0].gate).toBe(true);
  });
});

describe('sampleFrame', () => {
  it('shows the typed part of a line halfway through typing', () => {
    const tl = compile(scene([{ do: 'say', who: 'Narrator', text: '0123456789' }]), timing);
    const mid = sampleFrame(tl, 0.5, env);
    expect(mid.say?.shown).toBe(5);
    expect(mid.say?.typing).toBe(true);
    const held = sampleFrame(tl, 1.5, env);
    expect(held.say?.shown).toBe(10);
    expect(held.say?.typing).toBe(false);
  });

  it('walks an actor along its path with a matching yaw', () => {
    const tl = compile(scene([
      { do: 'walk', who: 'a', path: [[10, 0]], speed: 2 },
    ], { actors: [{ id: 'a', at: [0, 0] }] }), timing);
    const f = sampleFrame(tl, 2.5, env);
    expect(f.actors.a.x).toBeCloseTo(5);
    expect(f.actors.a.z).toBeCloseTo(0);
    expect(f.actors.a.yaw).toBeCloseTo(Math.PI / 2);
    expect(f.actors.a.speed).toBe(2);
  });

  it('keeps a seated actor on a driven vehicle', () => {
    const tl = compile(scene([
      { do: 'enter', who: 'a', vehicle: 'car', s: 2 },
      { do: 'drive', vehicle: 'car', path: [[10, 0]], speed: 5 },
    ], {
      actors: [{ id: 'a', at: [-2, 0] }],
      vehicles: [{ id: 'car', kind: 'lowrider', at: [0, 0] }],
    }), timing);
    const entering = sampleFrame(tl, 1, env);
    expect(entering.actors.a.mount?.mode).toBe('enter');
    expect(entering.actors.a.seatedIn).toBeNull();

    const driving = sampleFrame(tl, 3, env);
    expect(driving.actors.a.seatedIn).toBe('car');
    expect(driving.actors.a.x).toBeCloseTo(driving.vehicles.car.x);
    expect(driving.actors.a.z).toBeCloseTo(driving.vehicles.car.z);
    expect(driving.vehicles.car.x).toBeGreaterThan(0);
  });

  it('eases a drive in and out of a stop', () => {
    const tl = compile(scene([
      { do: 'drive', vehicle: 'car', path: [[10, 0]], speed: 5 },
    ], { vehicles: [{ id: 'car', kind: 'lowrider', at: [0, 0] }] }), timing);
    expect(sampleFrame(tl, 0, env).vehicles.car.speed).toBe(0);
    const mid = sampleFrame(tl, 1, env).vehicles.car;
    expect(mid.speed).toBeGreaterThan(0);
    expect(mid.driving).toBe(true);
    const end = sampleFrame(tl, 2, env).vehicles.car;
    expect(end.speed).toBe(0);
    expect(end.driving).toBe(false);
    expect(end.x).toBeCloseTo(10);
  });

  it('follows a vehicle from behind', () => {
    const tl = compile(scene([
      { do: 'cam', shot: { kind: 'follow', who: 'car' } },
    ], { vehicles: [{ id: 'car', kind: 'lowrider', at: [0, 0], yaw: Math.PI / 2 }] }), timing);
    const cam = sampleFrame(tl, 0.5, env).camera;
    expect(cam.pos[0]).toBeCloseTo(-5.5);
    expect(cam.pos[1]).toBeCloseTo(2.2);
    expect(cam.pos[2]).toBeCloseTo(0);
    expect(cam.target).toBe('car');
  });

  it('orbits a point at the start of the shot', () => {
    const tl = compile(scene([
      { do: 'cam', shot: { kind: 'orbit', around: [0, 0, 0], radius: 4, height: 2, fromYaw: 0, toYaw: Math.PI, s: 4 } },
    ]), timing);
    const cam = sampleFrame(tl, 0, env).camera;
    expect(cam.pos[0]).toBeCloseTo(0);
    expect(cam.pos[1]).toBeCloseTo(2);
    expect(cam.pos[2]).toBeCloseTo(4);
    expect(cam.look).toEqual([0, 0, 0]);
  });
});

describe('eventsBetween and scenePaths', () => {
  it('lists the steps that start inside a window', () => {
    const tl = compile(scene([{ do: 'wait', s: 1 }, { do: 'wait', s: 1 }, { do: 'wait', s: 1 }]), timing);
    const events = eventsBetween(tl, 1, 2);
    expect(events).toHaveLength(1);
    expect(events[0].start).toBe(1);
  });

  it('densifies walk paths to points about every 0.5 m', () => {
    const tl = compile(scene([
      { do: 'walk', who: 'a', path: [[10, 0]], speed: 2 },
    ], { actors: [{ id: 'a', at: [0, 0] }] }), timing);
    const paths = scenePaths(tl, env);
    expect(paths).toHaveLength(1);
    expect(paths[0].kind).toBe('walk');
    expect(paths[0].who).toBe('a');
    const pts = paths[0].points;
    expect(pts[0][0]).toBeCloseTo(0);
    expect(pts[pts.length - 1][0]).toBeCloseTo(10);
    for (let i = 1; i < pts.length; i++) {
      expect(Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2])).toBeLessThanOrEqual(0.6);
    }
  });
});
