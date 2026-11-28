import { describe, expect, it } from 'vitest';
import { TOW_EMPTY, TOW_NPC } from '../jobs/protocol';
import { boatSpeedFrom, followLoop, freeSlot, loopLength } from './runtime';

describe('freeSlot', () => {
  it('returns the first empty slot', () => {
    expect(freeSlot([TOW_EMPTY, TOW_EMPTY, TOW_EMPTY])).toBe(0);
    expect(freeSlot([5, TOW_EMPTY, TOW_NPC])).toBe(1);
  });

  it('returns -1 when every slot is taken', () => {
    expect(freeSlot([5, TOW_NPC, 9])).toBe(-1);
  });
});

describe('boatSpeedFrom', () => {
  it('is the forward component of the move per second', () => {
    // yaw 0 faces +z.
    expect(boatSpeedFrom(0, 0, 0, 2, 0, 0.5)).toBeCloseTo(4);
    // yaw pi/2 faces +x.
    expect(boatSpeedFrom(0, 0, 3, 0, Math.PI / 2, 1)).toBeCloseTo(3);
  });

  it('ignores sideways motion', () => {
    expect(boatSpeedFrom(0, 0, 2, 0, 0, 1)).toBeCloseTo(0);
  });

  it('is negative when reversing and zero for dt <= 0', () => {
    expect(boatSpeedFrom(0, 0, 0, -1, 0, 1)).toBeCloseTo(-1);
    expect(boatSpeedFrom(0, 0, 0, 1, 0, 0)).toBe(0);
  });
});

describe('followLoop', () => {
  // A 10 x 10 square: east, south, west, north (+z is south, yaw 0 faces +z, yaw pi/2 faces +x).
  const sq: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];

  it('measures the closed loop', () => {
    expect(loopLength(sq)).toBeCloseTo(40);
  });

  it('moves along the first segment facing it', () => {
    const p = followLoop(sq, 0, 4);
    expect(p.x).toBeCloseTo(4);
    expect(p.z).toBeCloseTo(0);
    expect(p.yaw).toBeCloseTo(Math.PI / 2);
    expect(p.s).toBeCloseTo(4);
  });

  it('turns the corner and heads south', () => {
    const p = followLoop(sq, 8, 5);
    expect(p.x).toBeCloseTo(10);
    expect(p.z).toBeCloseTo(3);
    expect(p.yaw).toBeCloseTo(0);
  });

  it('wraps past the end, and backwards', () => {
    const p = followLoop(sq, 38, 5);
    expect(p.s).toBeCloseTo(3);
    expect(p.x).toBeCloseTo(3);
    expect(p.z).toBeCloseTo(0);
    const q = followLoop(sq, 2, -4);
    expect(q.s).toBeCloseTo(38);
    expect(q.x).toBeCloseTo(0);
    expect(q.z).toBeCloseTo(2);
  });
});
