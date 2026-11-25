// The radio voice option and the 160-character cut. Run: npx vitest run src/radio
import { beforeEach, describe, expect, it } from 'vitest';

const store = new Map<string, string>();
const g = globalThis as unknown as Record<string, unknown>;
g.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};
g.window = { dispatchEvent: () => true, addEventListener: () => {} };

const { getRadioVoice, setRadioVoice, speakRadio, radioCut } = await import('./radioVoice');

describe('radio voice', () => {
  beforeEach(() => store.clear());

  it('defaults on and round-trips', () => {
    expect(getRadioVoice()).toBe(true);
    setRadioVoice(false);
    expect(getRadioVoice()).toBe(false);
    expect(store.get('gta.radioVoice')).toBe('off');
    setRadioVoice(true);
    expect(getRadioVoice()).toBe(true);
  });

  it('speaks nothing when off', () => {
    setRadioVoice(false);
    expect(speakRadio({ who: 'DOCK', text: 'Hello Turfton.' }, 'dock')).toBe(0);
  });

  it('cuts a long line at a word boundary', () => {
    const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
    const cut = radioCut(long);
    expect(cut.length).toBeLessThanOrEqual(160);
    expect(long.startsWith(cut)).toBe(true);
    expect(long[cut.length]).toBe(' ');
    expect(radioCut('short line')).toBe('short line');
  });
});
