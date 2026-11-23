import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createStageActor, gesturePose, poseActor, setHeld } from './actors';
import type { ActorSample } from './script';
import { DEFAULT_LOOK } from '../config';
import { voiceFor } from '../voice/voices';

const cast = { look: DEFAULT_LOOK, hz: 100, held: 'gta-rifle', scale: 1, name: 'X', voice: voiceFor('X', 100) };

function sample(over: Partial<ActorSample> = {}): ActorSample {
  return {
    id: 'x', visible: true, x: 0, y: 0, z: 0, yaw: 0, speed: 0, head: 0.9, gesture: null, gestureT: 0,
    sitting: false, talking: false, held: null, seatedIn: null, seat: 0, mount: null, ...over,
  };
}

describe('held props', () => {
  it('marks a gun held as a gun, and a broom as not', () => {
    const a = createStageActor(new THREE.Group(), { id: 'x', at: [0, 0] } as never, cast);
    expect(a.gun).toBe(true);
    setHeld(a, 'broom');
    expect(a.gun).toBe(false);
    setHeld(a, null);
    expect(a.gun).toBe(false);
  });

  it('point gesture with a gun raises the left arm onto the rifle support', () => {
    const a = createStageActor(new THREE.Group(), { id: 'x', at: [0, 0] } as never, cast);
    poseActor(a, sample({ gesture: 'point', gestureT: 0.6 }), 1 / 60, 0);
    expect(a.model.arms.left.scale.y).not.toBeCloseTo(1, 3);
  });
});

describe('gesturePose', () => {
  it('is all zero at the start of a gesture (eased in)', () => {
    const p = gesturePose('wave', 0, 1.2);
    expect(p.right[0]).toBeCloseTo(0, 9);
    expect(p.right[2]).toBeCloseTo(0, 9);
    expect(p.left).toEqual([0, 0, 0]);
    expect(p.pitch).toBeCloseTo(0, 9);
    expect(p.bob).toBeCloseTo(0, 9);
  });

  it('holds the point pose mid-gesture', () => {
    const p = gesturePose('point', 0.6, 1.2);
    expect(p.right[0]).toBeCloseTo(-1.55, 6);
    expect(p.right[1]).toBeCloseTo(0, 6);
    expect(p.right[2]).toBeCloseTo(0, 6);
  });

  it('bows most at the middle of the gesture', () => {
    const mid = gesturePose('bow', 0.6, 1.2).pitch;
    const early = gesturePose('bow', 0.1, 1.2).pitch;
    expect(mid).toBeGreaterThan(early);
    expect(mid).toBeCloseTo(0.6, 6);
  });

  it('is all zero for sit and stand', () => {
    for (const name of ['sit', 'stand'] as const) {
      const p = gesturePose(name, 0.6, 1.2);
      expect(p.left).toEqual([0, 0, 0]);
      expect(p.right).toEqual([0, 0, 0]);
      expect(p.pitch).toBe(0);
      expect(p.bob).toBe(0);
    }
  });
});
