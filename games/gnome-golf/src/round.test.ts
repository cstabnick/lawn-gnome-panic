import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { HOLES, type GameState } from './config';
import { clubFor, defaultClub } from './round';

describe('round club rules', () => {
  it('clubFor gives the putter on the green, and the same club defaultClub picks for a fairway ball 150 yd out', () => {
    expect(clubFor('green', 30)).toBe('PT');
    const hole = HOLES[0];
    const ball = new THREE.Vector3(hole.pin.x - 150, 0, hole.pin.z);
    const state = { lie: 'fairway', holeIndex: 0, ball } as unknown as GameState;
    expect(clubFor('fairway', 150)).toBe(defaultClub(state));
  });
});
