/**
 * Composable EffectHandler system for @lawn/music.
 *
 * Supports timed (bar/step-synced LFOs & sweeps), structured (section-driven
 * transitions like intro/intermission/outro), and event-driven (air, grinding,
 * boss, or imperative dub throws) modulation—or hybrid combinations of all three.
 */
import type * as ToneNS from 'tone';

export type EffectTriggerFormat = 'timed' | 'structured' | 'event' | 'hybrid';

export interface MusicEffectContext {
  time: number;
  stepIdx: number;
  step: number;
  bar: number;
  barInSection: number;
  sectionLen: number;
  section: string;
  events: Readonly<Record<string, boolean | number>>;
}

export interface MusicEffectHandler {
  readonly id: string;
  readonly format: EffectTriggerFormat;
  onStep(ctx: MusicEffectContext): void;
  onEvent?(eventName: string, time: number, payload?: number): void;
}

export interface MusicEffectRack {
  readonly handlers: readonly MusicEffectHandler[];
  step(ctx: MusicEffectContext): void;
  emit(eventName: string, time: number, payload?: number): void;
  add(handler: MusicEffectHandler): void;
}

export function createEffectRack(initial: MusicEffectHandler[] = []): MusicEffectRack {
  const list: MusicEffectHandler[] = [...initial];
  return {
    get handlers() {
      return list;
    },
    step(ctx) {
      for (const h of list) h.onStep(ctx);
    },
    emit(eventName, time, payload) {
      for (const h of list) h.onEvent?.(eventName, time, payload);
    },
    add(handler) {
      list.push(handler);
    },
  };
}

export interface FilterSweepHandlerOpts {
  id: string;
  format?: EffectTriggerFormat;
  filter: ToneNS.Filter;
  initialHz?: number;
  rampS?: number;
  thresholdHz?: number;
  evaluate: (ctx: MusicEffectContext) => number;
}

/**
 * Wraps a Tone.Filter with debounced `rampTo` sweeps driven by timed,
 * structured, or event-driven rules.
 */
export function createFilterSweepHandler(opts: FilterSweepHandlerOpts): MusicEffectHandler {
  let lastHz = opts.initialHz ?? 18000;
  const rampS = opts.rampS ?? 0.12;
  const threshold = opts.thresholdHz ?? 180;
  return {
    id: opts.id,
    format: opts.format ?? 'hybrid',
    onStep(ctx) {
      const targetHz = opts.evaluate(ctx);
      if (Math.abs(targetHz - lastHz) > threshold) {
        opts.filter.frequency.rampTo(targetHz, rampS, ctx.time);
        lastHz = targetHz;
      }
    },
    onEvent(eventName, time, payload) {
      if (eventName === `${opts.id}:sweep` && typeof payload === 'number') {
        opts.filter.frequency.rampTo(payload, rampS, time);
        lastHz = payload;
      }
    },
  };
}

export interface DubThrowHandlerOpts {
  id: string;
  format?: EffectTriggerFormat;
  sendGain: ToneNS.Gain;
  throwGain?: number;
  shouldThrow: (ctx: MusicEffectContext) => boolean;
  /** When false, skips zeroing gain (e.g., to let a prior throw ring out). */
  shouldReset?: (ctx: MusicEffectContext) => boolean;
}

/**
 * Wraps a dub delay/reverb throw `Tone.Gain`, pulsing it open on matching
 * timed/structured steps or imperative `dubThrow` events.
 */
export function createDubThrowHandler(opts: DubThrowHandlerOpts): MusicEffectHandler {
  const level = opts.throwGain ?? 0.72;
  return {
    id: opts.id,
    format: opts.format ?? 'hybrid',
    onStep(ctx) {
      if (opts.shouldThrow(ctx)) {
        opts.sendGain.gain.setValueAtTime(level, ctx.time);
      } else if (!opts.shouldReset || opts.shouldReset(ctx)) {
        opts.sendGain.gain.setValueAtTime(0, ctx.time);
      }
    },
    onEvent(eventName, time, payload) {
      if (eventName === 'dubThrow' || eventName === `${opts.id}:throw`) {
        opts.sendGain.gain.setValueAtTime(payload ?? level, time);
      }
    },
  };
}

export interface PolyrhythmFilterHandlerOpts {
  id: string;
  format?: EffectTriggerFormat;
  filter: ToneNS.Filter;
  throwGain?: ToneNS.Gain;
  accents: readonly boolean[];
  initialHz?: number;
  rampS?: number;
  thresholdHz?: number;
  maxHz?: number;
  isActive?: (ctx: MusicEffectContext) => boolean;
  evaluateBaseHz: (ctx: MusicEffectContext) => number;
  accentBoostHz?: number;
  shouldThrow?: (ctx: MusicEffectContext, isAccent: boolean) => boolean;
  throwLevel?: number;
}

/**
 * Combines a polyrhythmic accent cycle, bar-synced cutoff sweep, structured
 * section attenuation, and optional dub throw send into one reusable handler.
 */
export function createPolyrhythmFilterHandler(opts: PolyrhythmFilterHandlerOpts): MusicEffectHandler {
  let lastHz = opts.initialHz ?? 680;
  const rampS = opts.rampS ?? 0.04;
  const threshold = opts.thresholdHz ?? 80;
  const maxHz = opts.maxHz ?? 4200;
  const accentBoost = opts.accentBoostHz ?? 950;
  const throwLevel = opts.throwLevel ?? 0.65;

  return {
    id: opts.id,
    format: opts.format ?? 'hybrid',
    onStep(ctx) {
      if (opts.isActive && !opts.isActive(ctx)) return;
      const isAccent = opts.accents[ctx.stepIdx % opts.accents.length] ?? false;
      const targetHz = Math.min(maxHz, opts.evaluateBaseHz(ctx) + (isAccent ? accentBoost : 0));
      if (Math.abs(targetHz - lastHz) > threshold) {
        opts.filter.frequency.rampTo(targetHz, rampS, ctx.time);
        lastHz = targetHz;
      }
      if (opts.throwGain) {
        const doThrow = opts.shouldThrow ? opts.shouldThrow(ctx, isAccent) : isAccent;
        opts.throwGain.gain.setValueAtTime(doThrow ? throwLevel : 0, ctx.time);
      }
    },
    onEvent(eventName, time, payload) {
      if (eventName === `${opts.id}:spike`) {
        const hz = Math.min(maxHz, payload ?? lastHz + accentBoost);
        opts.filter.frequency.rampTo(hz, rampS, time);
        lastHz = hz;
      }
    },
  };
}
