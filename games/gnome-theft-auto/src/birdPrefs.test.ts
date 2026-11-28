import { describe, expect, it } from 'vitest';
import { getOption } from './optionsRegistry';
import {
  BIRD_AMBIENCE_IDS, birdAlertSoundOn, getBirdAlerts, getBirdSounds, setBirdAlerts, setBirdSounds,
} from './birdPrefs';

describe('bird prefs', () => {
  it('defaults both on', () => {
    expect(getBirdAlerts()).toBe(true);
    expect(getBirdSounds()).toBe(true);
    expect(birdAlertSoundOn()).toBe(true);
  });

  it('setters flip the values and the alert chime needs both on', () => {
    setBirdAlerts(false);
    expect(getBirdAlerts()).toBe(false);
    expect(birdAlertSoundOn()).toBe(false);
    setBirdAlerts(true);
    setBirdSounds(false);
    expect(getBirdSounds()).toBe(false);
    expect(birdAlertSoundOn()).toBe(false);
    setBirdAlerts(false);
    expect(birdAlertSoundOn()).toBe(false);
    setBirdSounds(true);
    expect(birdAlertSoundOn()).toBe(false);
    setBirdAlerts(true);
    expect(birdAlertSoundOn()).toBe(true);
  });

  it('lists the bird ambience ids', () => {
    expect(BIRD_AMBIENCE_IDS).toEqual(['bird-chirp', 'bird-song', 'crow']);
  });

  it('registers both rows under Sound', () => {
    const alertRow = getOption('bird-alerts');
    const soundRow = getOption('bird-sounds');
    expect(alertRow?.section).toBe('audio');
    expect(alertRow?.kind).toBe('toggle');
    expect(soundRow?.section).toBe('audio');
    expect(soundRow?.kind).toBe('toggle');
  });
});
