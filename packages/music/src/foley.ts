/**
 * Procedural background foley & spatial effects bed (no samples).
 *
 * Designed for ambient tracks that want rare, occasional organic textures in the background—
 * each event is panned in stereo and routed into a different effect bus (cavernous reverb,
 * ping-pong echo, sweeping bandpass filter, or stereo chorus) so no two moments sound identical.
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from './engine';
import type { AmbientFx } from './mix';
import { midiToNote, mulberry32 } from './theory';

export type FoleyKind = 'glassChime' | 'hvacSigh' | 'distantKnock' | 'waterDrop' | 'elevatorBell';
export type FoleyEffect = 'reverb' | 'echo' | 'sweep' | 'chorus';

const ALL_FOLEYS: readonly FoleyKind[] = [
  'glassChime',
  'hvacSigh',
  'distantKnock',
  'waterDrop',
  'elevatorBell',
];

const ALL_EFFECTS: readonly FoleyEffect[] = ['reverb', 'echo', 'sweep', 'chorus'];

interface FoleyRouter {
  input: ToneNS.Gain;
  route(time: number, pan: number, effect: FoleyEffect, wet?: number): void;
}

function createFoleyRouter(
  T: Tone,
  keep: Keep,
  out: ToneNS.InputNode,
  fx: AmbientFx,
): FoleyRouter {
  const input = keep(new T.Gain(1));
  const panner = keep(new T.Panner(0));
  input.connect(panner);

  const dry = keep(new T.Gain(0.12)).connect(out);
  const toRev = keep(new T.Gain(0)).connect(fx.rev);
  const toDelay = keep(new T.Gain(0)).connect(fx.delay);
  const toSweep = keep(new T.Gain(0)).connect(fx.sweepSend);
  const toChorus = keep(new T.Gain(0)).connect(fx.chorusSend);

  panner.fan(dry, toRev, toDelay, toSweep, toChorus);

  const buses: Record<FoleyEffect, ToneNS.Gain> = {
    reverb: toRev,
    echo: toDelay,
    sweep: toSweep,
    chorus: toChorus,
  };

  return {
    input,
    route(time, pan, effect, wet = 0.85) {
      panner.pan.setValueAtTime(Math.max(-0.85, Math.min(0.85, pan)), time);
      for (const key of ALL_EFFECTS) {
        buses[key].gain.setValueAtTime(key === effect ? wet : 0, time);
      }
    },
  };
}

export interface FoleyRack {
  trigger(kind: FoleyKind, time: number, opts?: { pan?: number; effect?: FoleyEffect; vel?: number; pitchMidi?: number }): void;
}

/** Builds a set of quiet, synthesized foley voices with per-trigger stereo pan & effect routing. */
export function createFoleyRack(
  T: Tone,
  keep: Keep,
  out: ToneNS.InputNode,
  fx: AmbientFx,
  opts: { volumeDb?: number } = {},
): FoleyRack {
  const bus = keep(new T.Volume(opts.volumeDb ?? -24)).connect(out);

  // 1. Glass chime: delicate high FM shimmer.
  const chimeRouter = createFoleyRouter(T, keep, bus, fx);
  const chime = keep(new T.FMSynth({
    harmonicity: 5.4,
    modulationIndex: 2.2,
    oscillator: { type: 'sine' },
    modulation: { type: 'sine' },
    envelope: { attack: 0.015, decay: 1.4, sustain: 0, release: 0.9 },
    modulationEnvelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.4 },
  })).connect(chimeRouter.input);
  chime.volume.value = -2;

  // 2. HVAC / distant air sigh: soft pink noise through a warm bandpass filter.
  const sighRouter = createFoleyRouter(T, keep, bus, fx);
  const sighBp = keep(new T.Filter({ frequency: 680, type: 'bandpass', Q: 1.8 })).connect(sighRouter.input);
  const sigh = keep(new T.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.9, decay: 1.2, sustain: 0.1, release: 1.4 },
  })).connect(sighBp);
  sigh.volume.value = -4;

  // 3. Distant wooden knock / alley thud: soft low-passed membrane tap.
  const knockRouter = createFoleyRouter(T, keep, bus, fx);
  const knockLp = keep(new T.Filter({ frequency: 520, type: 'lowpass' })).connect(knockRouter.input);
  const knock = keep(new T.MembraneSynth({
    pitchDecay: 0.03,
    octaves: 2.2,
    envelope: { attack: 0.004, decay: 0.16, sustain: 0, release: 0.08 },
  })).connect(knockLp);
  knock.volume.value = 0;

  // 4. Water drop / resonant plink: quick sine chirp.
  const dropRouter = createFoleyRouter(T, keep, bus, fx);
  const drop = keep(new T.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.002, decay: 0.14, sustain: 0, release: 0.1 },
  })).connect(dropRouter.input);
  drop.volume.value = -2;

  // 5. Distant elevator bell harmonic: soft pure bell overtone.
  const bellRouter = createFoleyRouter(T, keep, bus, fx);
  const bell = keep(new T.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.006, decay: 1.8, sustain: 0, release: 1.1 },
  })).connect(bellRouter.input);
  bell.volume.value = -5;

  return {
    trigger(kind, time, o = {}) {
      const pan = o.pan ?? 0;
      const effect = o.effect ?? 'reverb';
      const vel = o.vel ?? 0.55;
      switch (kind) {
        case 'glassChime': {
          chimeRouter.route(time, pan, effect, 0.9);
          chime.triggerAttackRelease(midiToNote(o.pitchMidi ?? 88), 0.9, time, vel);
          break;
        }
        case 'hvacSigh': {
          sighRouter.route(time, pan, effect, 0.75);
          sighBp.frequency.setValueAtTime(420 + Math.abs(pan) * 380, time);
          sigh.triggerAttackRelease(1.8, time, vel * 0.7);
          break;
        }
        case 'distantKnock': {
          knockRouter.route(time, pan, effect, 0.85);
          knock.triggerAttackRelease(midiToNote(o.pitchMidi ?? 43), '16n', time, vel);
          break;
        }
        case 'waterDrop': {
          dropRouter.route(time, pan, effect, 0.95);
          const baseFreq = 580 + ((o.pitchMidi ?? 72) - 60) * 24;
          drop.frequency.setValueAtTime(baseFreq, time);
          drop.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, time + 0.07);
          drop.triggerAttackRelease(baseFreq, 0.12, time, vel * 0.75);
          break;
        }
        case 'elevatorBell': {
          bellRouter.route(time, pan, effect, 0.9);
          bell.triggerAttackRelease(midiToNote(o.pitchMidi ?? 84), 1.4, time, vel * 0.65);
          break;
        }
      }
    },
  };
}

export interface FoleyBedOpts {
  /** Seed for deterministic event choices. */
  seed?: number;
  /** How often the scheduler rolls to spawn a foley (Tone time, e.g. '2m'). */
  interval?: ToneNS.Unit.Time;
  /** Probability (0..1) of spawning a foley on each tick when cooled down. */
  chance?: number;
  /** Minimum seconds between foley events so they stay rare. */
  minGapSec?: number;
  /** Subset of foley kinds to draw from. */
  kinds?: readonly FoleyKind[];
  /** Scale MIDI notes used for pitched foleys (chime, bell). */
  scaleMidis?: readonly number[];
}

/**
 * Schedules rare, occasional background foleys on the Transport, rotating through
 * different effect buses (reverb, echo, sweep, chorus) and stereo positions.
 */
export function scheduleFoleyBed(
  T: Tone,
  keep: Keep,
  rack: FoleyRack,
  opts: FoleyBedOpts = {},
): void {
  const rng = mulberry32(opts.seed ?? 0x464f4c45);
  const kinds = opts.kinds ?? ALL_FOLEYS;
  const chance = opts.chance ?? 0.3;
  const minGap = opts.minGapSec ?? 9;
  const scaleMidis = opts.scaleMidis ?? [72, 74, 76, 79, 81, 84, 86, 88];
  let lastTime = -minGap;
  let lastEffect: FoleyEffect | null = null;

  const loop = keep(new T.Loop((time) => {
    if (time - lastTime < minGap) return;
    if (rng() > chance) return;
    lastTime = time;

    const kind = kinds[Math.floor(rng() * kinds.length)];
    // Avoid repeating the exact same effect twice in a row so textures stay varied.
    const pool = lastEffect ? ALL_EFFECTS.filter((e) => e !== lastEffect) : ALL_EFFECTS;
    const effect = pool[Math.floor(rng() * pool.length)];
    lastEffect = effect;

    const pan = (rng() * 2 - 1) * 0.78;
    const vel = 0.32 + rng() * 0.33;
    const pitchMidi = kind === 'distantKnock'
      ? 38 + Math.floor(rng() * 10)
      : scaleMidis[Math.floor(rng() * scaleMidis.length)];

    // Slight timing humanization inside the bar so it never feels quantized.
    const offset = rng() * 1.4;
    rack.trigger(kind, time + offset, { pan, effect, vel, pitchMidi });
  }, opts.interval ?? '2m'));

  loop.start('2m');
}
