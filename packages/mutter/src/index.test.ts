import { describe, expect, it } from 'vitest';
import { createMutter, planMutter, resolveVoice } from './index';

const blipsOf = (toks: ReturnType<typeof planMutter>) => toks.filter((t) => t.k === 'blip');

describe('planMutter', () => {
  it('makes one blip per letter and a gap per space', () => {
    const toks = planMutter('hi you');
    expect(blipsOf(toks)).toHaveLength(5);
    expect(toks.filter((t) => t.k === 'gap')).toHaveLength(1);
  });

  it('caps the voiced letters', () => {
    expect(blipsOf(planMutter('a'.repeat(200), 30))).toHaveLength(30);
    expect(blipsOf(planMutter('a'.repeat(200)))).toHaveLength(48);
  });

  it('lifts the last letters of a question', () => {
    const blips = blipsOf(planMutter('are you ok?'));
    const last = blips[blips.length - 1];
    expect(last.k === 'blip' && last.mul).toBeGreaterThan(1);
  });

  it('gives letter blips length 1', () => {
    expect(blipsOf(planMutter('hi')).every((b) => b.k === 'blip' && b.len === 1)).toBe(true);
  });

  it('gives one blip per word in the words style', () => {
    const toks = planMutter('the quick fox', 48, 'words');
    expect(blipsOf(toks)).toHaveLength(3);
    expect(blipsOf(toks).every((b) => b.k === 'blip' && b.len === 2.2)).toBe(true);
  });

  it('gives fewer, longer blips in the syllables style', () => {
    const letters = blipsOf(planMutter('banana split'));
    const syllables = blipsOf(planMutter('banana split', 48, 'syllables'));
    expect(syllables.length).toBeLessThan(letters.length);
    expect(syllables.length).toBe(4);
    expect(syllables.every((b) => b.k === 'blip' && b.len === 1.6)).toBe(true);
  });

  it('gives a word with no vowel a single blip in the syllables style', () => {
    expect(blipsOf(planMutter('rhythm', 48, 'syllables'))).toHaveLength(1);
  });

  it('keeps the same gaps in every style', () => {
    const gaps = (toks: ReturnType<typeof planMutter>) => toks.filter((t) => t.k === 'gap').length;
    expect(gaps(planMutter('banana split!', 48, 'words'))).toBe(gaps(planMutter('banana split!')));
  });

  it('keeps blip count with a syllable set but changes the formants', () => {
    const plain = blipsOf(planMutter('banana'));
    const spoken = blipsOf(planMutter('banana', 48, 'letters', 'bo'));
    expect(spoken).toHaveLength(plain.length);
    const formants = (bs: typeof plain) => bs.map((b) => (b.k === 'blip' ? b.f.join(',') : '')).join(';');
    expect(formants(spoken)).not.toBe(formants(plain));
    // 'bo' has one vowel, so every blip takes the 'o' formants.
    expect(spoken.every((b) => b.k === 'blip' && b.f[0] === 460 && b.f[1] === 800)).toBe(true);
  });

  it('picks the same syllable for the same letters every time', () => {
    const a = blipsOf(planMutter('banana', 48, 'letters', 'bo ba bu mm'));
    const b = blipsOf(planMutter('banana', 48, 'letters', 'bo ba bu mm'));
    expect(a).toEqual(b);
  });
});

describe('resolveVoice', () => {
  it('fills the defaults and treats a bare pitch as { hz }', () => {
    expect(resolveVoice(88)).toEqual(resolveVoice({ hz: 88 }));
    const v = resolveVoice(88);
    expect(v).toMatchObject({ hz: 88, speed: 1, wave: 'saw', sub: 0.5, formant: 1, q: 5, breath: 0, wobble: 0, range: 1, glide: 0, style: 'letters', syllables: '', bright: 2600 });
  });

  it('keeps the fields it is given', () => {
    expect(resolveVoice({ hz: 120, wave: 'square', speed: 1.4, style: 'words' })).toMatchObject({
      hz: 120,
      wave: 'square',
      speed: 1.4,
      style: 'words',
    });
  });
});

describe('createMutter', () => {
  const voice = createMutter({ gain: () => 1 });

  it('estimates longer lines as longer', () => {
    expect(voice.estimate('Oh.')).toBeLessThan(voice.estimate('Oh, what a truly splendid little photograph.'));
  });

  it('estimates silence for text with no letters', () => {
    expect(voice.estimate('... !!')).toBe(0);
  });

  it('estimates shorter at speed 1.5 than at 0.7 for the same text', () => {
    const fast = voice.estimate('hello there friend', undefined, { hz: 88, speed: 1.5 });
    const slow = voice.estimate('hello there friend', undefined, { hz: 88, speed: 0.7 });
    expect(fast).toBeLessThan(slow);
  });

  it('estimates the default voice when none is given', () => {
    expect(voice.estimate('hello there')).toBe(voice.estimate('hello there', undefined, { hz: 88 }));
  });

  it('estimates the word style as shorter than the letter style for the same text', () => {
    expect(voice.estimate('banana split', undefined, { hz: 88, style: 'words' })).toBeLessThan(
      voice.estimate('banana split', undefined, { hz: 88 }),
    );
  });

  it('plays nothing (and does not throw) before audio is unlocked', () => {
    expect(voice.say('hello there', 88)).toBe(0);
    expect(voice.say('hello there', { hz: 88, speed: 1.4, wave: 'sine', breath: 0.3, wobble: 0.5 }, { phone: true, gain: 0.5, pan: -0.5 })).toBe(0);
  });
});
