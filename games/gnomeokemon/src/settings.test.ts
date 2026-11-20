import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, onSettingsChanged, updateSettings } from './settings';

describe('settings', () => {
  it('starts from the defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('merges a change, remembers it and tells listeners', () => {
    let seen = 0;
    const off = onSettingsChanged(() => seen++);
    const next = updateSettings({ invertY: true, mouseSens: 1.5 });
    expect(next.invertY).toBe(true);
    expect(loadSettings().mouseSens).toBe(1.5);
    expect(seen).toBe(1);
    off();
    updateSettings({ invertY: false });
    expect(seen).toBe(1);
  });
});
