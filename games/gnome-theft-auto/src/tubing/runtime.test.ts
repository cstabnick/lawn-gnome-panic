import { describe, expect, it } from 'vitest';
import { TOW_EMPTY, TOW_NPC } from '../jobs/protocol';
import { boatSpeedFrom, freeSlot } from './runtime';

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
