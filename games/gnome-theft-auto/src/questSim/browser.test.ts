import './globals';
import { describe, expect, it } from 'vitest';
import { parseCheats, walkInput } from './browser';
import { ALL_CHEATS, NO_CHEATS } from './types';

describe('parseCheats', () => {
  it("'none' gives no cheats", () => {
    expect(parseCheats('none')).toEqual(NO_CHEATS);
  });

  it("'all' and a missing value give every cheat", () => {
    expect(parseCheats('all')).toEqual(ALL_CHEATS);
    expect(parseCheats(null)).toEqual(ALL_CHEATS);
  });

  it('a comma list turns on only those cheats', () => {
    expect(parseCheats('godMode,noHeat')).toEqual({ ...NO_CHEATS, godMode: true, noHeat: true });
  });
});

describe('walkInput', () => {
  it('walking along the camera is straight forward', () => {
    const r = walkInput(0.7, 0.7);
    expect(r.moveY).toBeCloseTo(1);
    expect(r.moveX).toBeCloseTo(0);
  });

  it('walking at 90 degrees to the right of the camera is a full right step', () => {
    const cam = 0.7;
    const r = walkInput(cam - Math.PI / 2, cam);
    expect(r.moveX).toBeCloseTo(1);
    expect(r.moveY).toBeCloseTo(0);
  });
});
