import { describe, expect, it } from 'vitest';
import { runHeadless, testMinigame } from '@lawn/party/testkit';
import def from './oly-mower-toss';

testMinigame(def);

describe('oly-mower-toss', () => {
  it('ends by places, not the time cap, for seed 1', () => {
    expect(runHeadless(def, 1).timeUp).toBe(false);
  });
});
