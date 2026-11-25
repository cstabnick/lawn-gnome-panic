import { describe, expect, it } from 'vitest';
import { createSkateScore } from './score';
import type { BoardState } from './types';

function board(mode: BoardState['mode'], t = 0): BoardState {
  return {
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, mode, airT: 0, spin: 0, switchStance: false,
    trick: null, grab: null, grind: null, bailT: 0, nx: 0, ny: 1, nz: 0, lean: 0, t,
  };
}

describe('createSkateScore', () => {
  it('banks an ollie, kickflip and perfect landing once, after 2 s on the ground, with 3 tricks', () => {
    const s = createSkateScore();
    s.event({ e: 'takeoff', speed: 5, ollie: true }, board('air'));
    s.event({ e: 'pop', trick: 'ollie' }, board('air'));
    s.event({ e: 'pop', trick: 'kickflip' }, board('air'));
    s.event({ e: 'trickDone', trick: 'kickflip' }, board('air'));
    s.event({ e: 'land', perfect: true, spin: 0, flips: 0, airT: 0.8, impact: 1, switchLand: false }, board('ground'));
    expect(s.takeBanked()).toBeNull();
    expect(s.view().lines.length).toBe(3);

    for (let i = 0; i < 20; i++) s.tick(0.1, board('ground', 1 + i * 0.1));
    const banked = s.takeBanked();
    expect(banked).not.toBeNull();
    expect(banked!.tricks).toBe(3);
    expect(banked!.points).toBeGreaterThan(0);
    expect(s.takeBanked()).toBeNull();
  });

  it('gives no bank on a bail', () => {
    const s = createSkateScore();
    s.event({ e: 'takeoff', speed: 5, ollie: true }, board('air'));
    s.event({ e: 'pop', trick: 'ollie' }, board('air'));
    s.event({ e: 'bail', reason: 'test' }, board('bail'));
    for (let i = 0; i < 30; i++) s.tick(0.1, board('ground'));
    expect(s.view().last?.kind).toBe('bailed');
    expect(s.takeBanked()).toBeNull();
  });

  it('ignores wall, push and fullRail events', () => {
    const s = createSkateScore();
    s.event({ e: 'wall', speed: 9 }, board('ground'));
    s.event({ e: 'push' }, board('ground'));
    s.event({ e: 'fullRail', rail: 0 }, board('grind'));
    expect(s.view().lines.length).toBe(0);
    expect(s.takeBanked()).toBeNull();
  });
});
