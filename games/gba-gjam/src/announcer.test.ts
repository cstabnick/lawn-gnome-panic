import { describe, expect, it } from 'vitest';
import {
  classifyAnnouncerProfile,
  createStadiumCrunchCurve,
  evaluateEnvelope,
  formatAnnouncerSpeech,
  stackGainMultiplier,
  synthesizeSpeechPcm,
  type EnvelopeShape,
} from './announcer';

describe('formatAnnouncerSpeech', () => {
  it('normalizes score deltas and scores for natural speech', () => {
    expect(
      formatAnnouncerSpeech({ text: 'FROM DOWNTOWN!', subtext: 'Barnaby +3', color: '#44ff88', big: true }),
    ).toBe('FROM DOWNTOWN');

    expect(
      formatAnnouncerSpeech({ text: 'END OF QUARTER 1', subtext: '14 - 10', color: '#ffd21f' }),
    ).toBe('END OF QUARTER 1 14 to 10');
  });
});

describe('classifyAnnouncerProfile', () => {
  it('assigns pitched-down male delivery and distinct envelope shapes per callout', () => {
    const fire = classifyAnnouncerProfile({ text: "HE'S ON FIRE!!", color: '#ff5500', big: true });
    expect(fire.shape).toBe('epic');
    expect(fire.playbackRate).toBeLessThan(1.0);
    expect(fire.samPitch).toBeGreaterThan(70);
    expect(fire.reverbMix).toBeGreaterThan(0.5);
    expect(fire.crunchDrive).toBeGreaterThan(0.5);

    const block = classifyAnnouncerProfile({ text: 'REJECTED!', color: '#44ccff', big: true });
    expect(block.shape).toBe('punchy');
    expect(block.playbackRate).toBeLessThan(1.0);

    const steal = classifyAnnouncerProfile({ text: 'PICKPOCKET!', color: '#44ff88' });
    expect(steal.shape).toBe('staccato');

    const quarter = classifyAnnouncerProfile({ text: 'QUARTER 2', subtext: 'TIP-OFF!', color: '#ffd21f' });
    expect(quarter.shape).toBe('swell');
  });
});

describe('synthesizeSpeechPcm', () => {
  it('renders non-empty Float32Array PCM audio via SamJs without external models', () => {
    const profile = classifyAnnouncerProfile({ text: 'REJECTED!', color: '#44ccff', big: true });
    const pcm = synthesizeSpeechPcm('REJECTED!', profile);
    expect(pcm).toBeInstanceOf(Float32Array);
    expect(pcm!.length).toBeGreaterThan(2000);
  });
});

describe('evaluateEnvelope', () => {
  const shapes: EnvelopeShape[] = ['punchy', 'swell', 'staccato', 'epic'];

  it('keeps all envelope outputs bounded in [0, 1] and produces distinct shapes', () => {
    for (const shape of shapes) {
      for (let i = 0; i <= 10; i++) {
        const s = evaluateEnvelope(shape, i / 10);
        expect(s.amp).toBeGreaterThanOrEqual(0);
        expect(s.amp).toBeLessThanOrEqual(1);
        expect(s.crunch).toBeGreaterThanOrEqual(0);
        expect(s.crunch).toBeLessThanOrEqual(1);
        expect(s.reverb).toBeGreaterThanOrEqual(0);
        expect(s.reverb).toBeLessThanOrEqual(1);
        expect(s.filterNorm).toBeGreaterThanOrEqual(0);
        expect(s.filterNorm).toBeLessThanOrEqual(1);
      }
    }

    expect(evaluateEnvelope('punchy', 0.08).amp).toBeGreaterThan(evaluateEnvelope('punchy', 0.85).amp);
    expect(evaluateEnvelope('swell', 0.5).amp).toBeGreaterThan(evaluateEnvelope('swell', 0.02).amp);
    expect(evaluateEnvelope('epic', 0.7).reverb).toBeGreaterThan(evaluateEnvelope('staccato', 0.7).reverb);
  });
});

describe('createStadiumCrunchCurve', () => {
  it('produces an asymmetric waveshaper curve bounded within [-1.1, 1.1]', () => {
    const curve = createStadiumCrunchCurve(0.8);
    expect(curve.length).toBe(1024);
    expect(curve[0]).toBeLessThan(0);
    expect(curve[curve.length - 1]).toBeGreaterThan(0);
    expect(Math.abs(curve[curve.length - 1])).not.toBeCloseTo(Math.abs(curve[0]), 3);
  });
});

describe('stackGainMultiplier', () => {
  it('attenuates output progressively when multiple announcer lines stack', () => {
    expect(stackGainMultiplier(0)).toBe(1);
    expect(stackGainMultiplier(1)).toBe(1);
    expect(stackGainMultiplier(2)).toBeLessThan(0.7);
    expect(stackGainMultiplier(3)).toBeLessThan(stackGainMultiplier(2));
  });
});
