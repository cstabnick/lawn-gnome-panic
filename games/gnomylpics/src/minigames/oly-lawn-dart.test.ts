import { describe, expect, it } from 'vitest';
import { runHeadless, testMinigame } from '@lawn/party/testkit';
import def, { angleFromHold } from './oly-lawn-dart';

testMinigame(def);

describe('oly-lawn-dart', () => {
  it('maps the hold time to the aim angle, clamped to 15..75', () => {
    expect(angleFromHold(0)).toBe(15);
    expect(angleFromHold(10)).toBe(75);
  });

  it('CPUs finish before the time cap', () => {
    expect(runHeadless(def, 1).timeUp).toBe(false);
  });
});
