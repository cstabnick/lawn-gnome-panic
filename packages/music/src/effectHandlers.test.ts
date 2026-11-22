import type * as ToneNS from 'tone';
import { describe, expect, it, vi } from 'vitest';
import {
  createDubThrowHandler,
  createEffectRack,
  createFilterSweepHandler,
  createPolyrhythmFilterHandler,
  type MusicEffectContext,
} from './effectHandlers';

function makeMockFilter() {
  return {
    frequency: { rampTo: vi.fn() },
  } as unknown as ToneNS.Filter & { frequency: { rampTo: ReturnType<typeof vi.fn> } };
}

function makeMockGain() {
  return {
    gain: { setValueAtTime: vi.fn() },
  } as unknown as ToneNS.Gain & { gain: { setValueAtTime: ReturnType<typeof vi.fn> } };
}

function makeCtx(overrides: Partial<MusicEffectContext> = {}): MusicEffectContext {
  return {
    time: 1.0,
    stepIdx: 0,
    step: 0,
    bar: 0,
    barInSection: 0,
    sectionLen: 8,
    section: 'grooveA',
    events: {},
    ...overrides,
  };
}

describe('music effectHandlers', () => {
  it('createEffectRack dispatches step, emit, and supports dynamic add()', () => {
    const onStep = vi.fn();
    const onEvent = vi.fn();
    const rack = createEffectRack([
      { id: 'a', format: 'timed', onStep, onEvent },
    ]);
    rack.add({ id: 'b', format: 'event', onStep, onEvent });
    expect(rack.handlers).toHaveLength(2);

    const ctx = makeCtx();
    rack.step(ctx);
    expect(onStep).toHaveBeenCalledTimes(2);
    expect(onStep).toHaveBeenCalledWith(ctx);

    rack.emit('dubThrow', 2.5, 0.8);
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenCalledWith('dubThrow', 2.5, 0.8);
  });

  it('createFilterSweepHandler debounces small deltas and ramps on threshold crossings', () => {
    const filter = makeMockFilter();
    const handler = createFilterSweepHandler({
      id: 'master',
      filter,
      initialHz: 14500,
      thresholdHz: 180,
      rampS: 0.12,
      evaluate: (ctx) => (ctx.events.air ? 1600 : 14550),
    });

    // Delta = 50 <= 180 -> debounced
    handler.onStep(makeCtx({ events: { air: false } }));
    expect(filter.frequency.rampTo).not.toHaveBeenCalled();

    // Air event -> drops to 1600
    handler.onStep(makeCtx({ time: 2.0, events: { air: true } }));
    expect(filter.frequency.rampTo).toHaveBeenCalledWith(1600, 0.12, 2.0);
  });

  it('createDubThrowHandler pulses gain on matching steps and imperative events', () => {
    const sendGain = makeMockGain();
    const handler = createDubThrowHandler({
      id: 'dub',
      sendGain,
      throwGain: 0.72,
      shouldThrow: (ctx) => ctx.step === 4 && ctx.barInSection % 2 === 1,
    });

    handler.onStep(makeCtx({ time: 1.0, step: 0, barInSection: 1 }));
    expect(sendGain.gain.setValueAtTime).toHaveBeenCalledWith(0, 1.0);

    handler.onStep(makeCtx({ time: 1.5, step: 4, barInSection: 1 }));
    expect(sendGain.gain.setValueAtTime).toHaveBeenCalledWith(0.72, 1.5);

    handler.onEvent?.('dubThrow', 2.0, 0.9);
    expect(sendGain.gain.setValueAtTime).toHaveBeenCalledWith(0.9, 2.0);
  });

  it('createPolyrhythmFilterHandler applies polyrhythmic accent spikes and throw gain', () => {
    const filter = makeMockFilter();
    const throwGain = makeMockGain();
    const handler = createPolyrhythmFilterHandler({
      id: 'acid',
      filter,
      throwGain,
      accents: [true, false, false],
      initialHz: 300,
      thresholdHz: 50,
      evaluateBaseHz: () => 500,
      accentBoostHz: 900,
      shouldThrow: (ctx, isAccent) => isAccent && ctx.step % 4 === 2,
      throwLevel: 0.65,
    });

    // stepIdx 0 -> accent true -> 500 + 900 = 1400 Hz; step 0 -> throw 0
    handler.onStep(makeCtx({ time: 1.0, stepIdx: 0, step: 0 }));
    expect(filter.frequency.rampTo).toHaveBeenCalledWith(1400, 0.04, 1.0);
    expect(throwGain.gain.setValueAtTime).toHaveBeenCalledWith(0, 1.0);

    // stepIdx 3 -> accent true, step 2 -> throw 0.65
    handler.onStep(makeCtx({ time: 1.25, stepIdx: 3, step: 2 }));
    expect(throwGain.gain.setValueAtTime).toHaveBeenCalledWith(0.65, 1.25);
  });
});
