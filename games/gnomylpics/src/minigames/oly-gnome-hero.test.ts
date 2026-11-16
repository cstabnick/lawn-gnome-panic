import { describe, expect, it } from 'vitest';
import { checkPlaces, runHeadless, testMinigame } from '@lawn/party/testkit';
import def from './oly-gnome-hero';

testMinigame(def);

describe('oly-gnome-hero', () => {
  it('a headless CPU round ends by its own end condition with valid places', () => {
    const run = runHeadless(def, 1);
    expect(run.timeUp).toBe(false);
    expect(checkPlaces(run.places)).toBeNull();
  });
});
