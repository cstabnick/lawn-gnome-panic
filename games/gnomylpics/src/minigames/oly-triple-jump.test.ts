import { describe, expect, it } from 'vitest';
import { runHeadless, testMinigame } from '@lawn/party/testkit';
import def from './oly-triple-jump';

testMinigame(def);

describe('oly-triple-jump', () => {
  it('the four CPUs finish before the time cap', () => {
    const run = runHeadless(def, 1);
    expect(run.timeUp).toBe(false);
  });
});
