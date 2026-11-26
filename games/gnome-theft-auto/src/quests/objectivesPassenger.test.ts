// The pure parts of the 'passenger' runner: boarding condition, damage check, banter timing, look.
import { describe, expect, it } from 'vitest';
import { CAST } from '../cutscene/cast';
import { randomTownLook } from '../gnomes';
import { BANTER_FIRST, BANTER_GAP, STOP_SPEED, banterDue, canStopFor, isGroundSpec, passengerLook, rescueLine, tooRough } from './objectivesPassenger';

describe('passenger runner helpers', () => {
  it('only ground vehicles carry a passenger', () => {
    expect(isGroundSpec({ flies: false })).toBe(true);
    expect(isGroundSpec({ flies: true })).toBe(false);
    expect(isGroundSpec({ flies: false, boat: true })).toBe(false);
    expect(isGroundSpec({ flies: false, air: {} as never })).toBe(false);
  });

  it('boards when a ground vehicle stops inside the radius', () => {
    expect(canStopFor({ ground: true, dist: 3, radius: 6, speed: 0.5 })).toBe(true);
    expect(canStopFor({ ground: true, dist: 3, radius: 6, speed: -0.5 })).toBe(true);
    expect(canStopFor({ ground: true, dist: 3, radius: 6, speed: STOP_SPEED + 0.1 })).toBe(false);
    expect(canStopFor({ ground: true, dist: 7, radius: 6, speed: 0 })).toBe(false);
    expect(canStopFor({ ground: false, dist: 1, radius: 6, speed: 0 })).toBe(false);
  });

  it('refuses only past maxDamage', () => {
    expect(tooRough(1, 0.5, undefined)).toBe(false);
    expect(tooRough(1, 0.8, 0.3)).toBe(false);
    expect(tooRough(1, 0.6, 0.3)).toBe(true);
    expect(tooRough(0.7, 0.5, 0.3)).toBe(false);
  });

  it('spaces banter: first after BANTER_FIRST, then every BANTER_GAP', () => {
    expect(banterDue(0, 3)).toBe(0);
    expect(banterDue(BANTER_FIRST - 0.1, 3)).toBe(0);
    expect(banterDue(BANTER_FIRST, 3)).toBe(1);
    expect(banterDue(BANTER_FIRST + BANTER_GAP - 0.1, 3)).toBe(1);
    expect(banterDue(BANTER_FIRST + BANTER_GAP, 3)).toBe(2);
    expect(banterDue(1000, 3)).toBe(3);
    expect(banterDue(1000, 0)).toBe(0);
  });

  it('names the passenger in the rescue-ride toast', () => {
    expect(rescueLine('Pip')).toBe("Pip: There's a mower round the side. Take that.");
  });

  it('wears the CAST look, with the objective override on top', () => {
    const base = randomTownLook();
    const l = passengerLook('pip', { hat: 0x123456 }, base);
    expect(l.hat).toBe(0x123456);
    expect(l.shirt).toBe(CAST.pip.look.shirt);
    expect(passengerLook('nobody-here', undefined, base)).toEqual(base);
  });
});
