// All sound is synthesized with WebAudio: no sample files.
import { HOLES } from './config';
import type { Ctx, FlightEvent, SfxName, ShotResult, System } from './config';

const MASTER_GAIN = 0.8;

let actx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = false;
let keyListening = false;

interface Engine {
  saw: OscillatorNode;
  sub: OscillatorNode;
  gain: GainNode;
}
let engine: Engine | null = null;

function rand(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

/** Pitch jitter so repeated sounds do not sound identical. */
function jit(f: number): number {
  return f * rand(0.95, 1.05);
}

function whiteNoise(c: AudioContext): AudioBuffer {
  if (!noiseBuf) {
    const len = Math.floor(c.sampleRate * 2);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = buf;
  }
  return noiseBuf;
}

function brownBuffer(c: AudioContext): AudioBuffer {
  const len = Math.floor(c.sampleRate * 4);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  return buf;
}

/** Attack then exponential decay to silence. */
function envelope(g: GainNode, t0: number, dur: number, peak: number, attack = 0.004): void {
  const p = g.gain;
  p.setValueAtTime(0.0001, t0);
  p.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + Math.min(attack, dur * 0.5));
  p.exponentialRampToValueAtTime(0.0001, t0 + dur);
}

/** Schedule a frequency curve: points are [seconds after t0, Hz]. Frequencies must be > 0. */
function sweep(param: AudioParam, t0: number, pts: [number, number][]): void {
  pts.forEach(([off, f], i) => {
    if (i === 0) param.setValueAtTime(f, t0 + off);
    else param.exponentialRampToValueAtTime(f, t0 + off);
  });
}

function tone(type: OscillatorType, pts: [number, number][], t0: number, dur: number, peak: number, attack?: number): void {
  const c = actx;
  const m = master;
  if (!c || !m) return;
  const osc = c.createOscillator();
  osc.type = type;
  sweep(osc.frequency, t0, pts);
  const g = c.createGain();
  envelope(g, t0, dur, peak, attack);
  osc.connect(g).connect(m);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(filter: BiquadFilterType, pts: [number, number][], q: number, t0: number, dur: number, peak: number, attack?: number): void {
  const c = actx;
  const m = master;
  if (!c || !m) return;
  const buf = whiteNoise(c);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = filter;
  f.Q.value = q;
  sweep(f.frequency, t0, pts);
  const g = c.createGain();
  envelope(g, t0, dur, peak, attack);
  src.connect(f).connect(g).connect(m);
  const offset = Math.random() * Math.max(0, buf.duration - dur - 0.05);
  src.start(t0, offset);
  src.stop(t0 + dur + 0.05);
}

/** Create/resume the AudioContext. Call from a user gesture (the title button, the first swing tap). */
export function startAudio(): void {
  if (!actx) {
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return;
    let c: AudioContext;
    try {
      c = new Ctor();
    } catch {
      return;
    }
    const m = c.createGain();
    m.gain.value = muted ? 0 : MASTER_GAIN;
    m.connect(c.destination);
    actx = c;
    master = m;
    startAmbience(c, m);
  }
  if (actx.state === 'suspended') {
    actx.resume().catch(() => {});
  }
  if (!keyListening) {
    keyListening = true;
    window.addEventListener('keydown', onKey);
  }
}

function onKey(e: KeyboardEvent): void {
  if (e.repeat || (e.key !== 'm' && e.key !== 'M')) return;
  muted = !muted;
  if (actx && master) master.gain.setTargetAtTime(muted ? 0 : MASTER_GAIN, actx.currentTime, 0.02);
}

/** Looping sea: brown noise through a low-pass whose cutoff and level swell every ~7 s. */
function startAmbience(c: AudioContext, m: GainNode): void {
  const src = c.createBufferSource();
  src.buffer = brownBuffer(c);
  src.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 500;
  lp.Q.value = 0.7;
  const g = c.createGain();
  g.gain.value = 0.05;
  src.connect(lp).connect(g).connect(m);

  const lfo = c.createOscillator();
  lfo.frequency.value = 1 / 7;
  const lfoCut = c.createGain();
  lfoCut.gain.value = 300;
  lfo.connect(lfoCut).connect(lp.frequency);
  const lfoLevel = c.createGain();
  lfoLevel.gain.value = 0.025;
  lfo.connect(lfoLevel).connect(g.gain);

  src.start();
  lfo.start();
}

/** Two short downward chirps: a gull's "kee-ow". */
function gull(c: AudioContext): void {
  const t = c.currentTime + 0.01;
  const j = rand(0.95, 1.05);
  tone('triangle', [[0, 1800 * j], [0.14, 1300 * j]], t, 0.16, 0.06, 0.01);
  tone('triangle', [[0, 1700 * j], [0.3, 1000 * j]], t + 0.22, 0.34, 0.05, 0.02);
}

function ensureEngine(c: AudioContext, m: GainNode): Engine {
  if (engine) return engine;
  const saw = c.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.value = 55;
  const sub = c.createOscillator();
  sub.type = 'square';
  sub.frequency.value = 27.5;
  const subGain = c.createGain();
  subGain.gain.value = 0.5;
  const mix = c.createGain();
  mix.gain.value = 0.35;
  saw.connect(mix);
  sub.connect(subGain).connect(mix);

  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 500;
  lp.Q.value = 0.7;
  const gain = c.createGain();
  gain.gain.value = 0;
  mix.connect(lp).connect(gain).connect(m);

  // Slight wobble on the engine's cutoff.
  const lfo = c.createOscillator();
  lfo.frequency.value = 4.2;
  const lfoDepth = c.createGain();
  lfoDepth.gain.value = 60;
  lfo.connect(lfoDepth).connect(lp.frequency);

  saw.start();
  sub.start();
  lfo.start();
  engine = { saw, sub, gain };
  return engine;
}

/** One-shot sound effect. volume 0..1 (default 1). Does nothing before startAudio. */
export function sfx(name: SfxName, volume = 1): void {
  const c = actx;
  if (!c || !master) return;
  const v = Math.max(0, Math.min(1, volume));
  const t = c.currentTime + 0.01;
  switch (name) {
    case 'swing':
      noise('bandpass', [[0, 400], [0.25, 2000]], 1.2, t, 0.25, 0.35 * v, 0.04);
      break;
    case 'hit':
      noise('highpass', [[0, 2000]], 0.7, t, 0.03, 0.5 * v, 0.001);
      tone('triangle', [[0, jit(900)]], t, 0.12, 0.4 * v, 0.002);
      break;
    case 'putt':
      tone('sine', [[0, jit(1400)]], t, 0.06, 0.3 * v, 0.002);
      noise('highpass', [[0, 3000]], 0.7, t, 0.02, 0.08 * v, 0.001);
      break;
    case 'bounce': {
      const f = jit(180);
      tone('sine', [[0, f], [0.08, f / 2]], t, 0.08, 0.6 * v, 0.003);
      noise('lowpass', [[0, 400]], 0.7, t, 0.08, 0.25 * v, 0.003);
      break;
    }
    case 'sand':
      noise('lowpass', [[0, jit(900)], [0.15, jit(500)]], 0.8, t, 0.15, 0.35 * v, 0.01);
      break;
    case 'splash':
      noise('lowpass', [[0, 300], [0.15, 2200], [0.6, 400]], 0.9, t, 0.6, 0.45 * v, 0.02);
      for (let i = 0; i < 4; i++) {
        const off = rand(0.1, 0.5);
        const f = rand(400, 900);
        tone('sine', [[0, f], [0.05, f * 1.4]], t + off, 0.05, 0.12 * v, 0.005);
      }
      break;
    case 'cup':
      for (let i = 0; i < 4; i++) {
        tone('sine', [[0, rand(600, 800)]], t + i * 0.04, 0.05, 0.5 * v * Math.pow(0.75, i), 0.002);
      }
      break;
    case 'tick':
      tone('square', [[0, jit(1200)]], t, 0.025, 0.08 * v, 0.002);
      break;
    case 'click':
      tone('square', [[0, jit(800)]], t, 0.035, 0.1 * v, 0.002);
      break;
    case 'cheer': {
      const bus = c.createBiquadFilter();
      bus.type = 'lowpass';
      bus.frequency.value = 2500;
      bus.Q.value = 0.5;
      const env = c.createGain();
      envelope(env, t, 0.8, 0.18 * v, 0.1);
      bus.connect(env).connect(master);
      for (const semi of [0, 4, 7, 9, 12]) {
        const f = 300 * Math.pow(2, semi / 12) * rand(0.98, 1.02);
        const osc = c.createOscillator();
        osc.type = 'sawtooth';
        sweep(osc.frequency, t, [[0, f], [0.8, f * 1.3]]);
        const vg = c.createGain();
        vg.gain.value = 0.15;
        osc.connect(vg).connect(bus);
        osc.start(t);
        osc.stop(t + 0.85);
      }
      break;
    }
  }
}

/** The audio system: flight event sounds, mower engine during 'drive', ambient sea and birds. */
export function createAudioSystem(ctx: Ctx): System {
  const state = ctx.state;
  let lastFlight: ShotResult | null = null;
  let nextEvent = 0;
  let prevPhase = state.phase;
  let nextGull = -1;

  function playEvent(ev: FlightEvent): void {
    if (ev.kind === 'bounce') {
      if (ev.lie === 'sand') sfx('sand');
      else sfx('bounce', Math.min(1, ev.speed / 40));
    } else if (ev.kind === 'water') {
      sfx('splash');
    } else if (ev.kind === 'cup') {
      sfx('cup');
    }
  }

  return {
    update(): void {
      // Flight events: each one plays once as the ball's clock passes it.
      const flight = state.flight;
      if (flight !== lastFlight) {
        lastFlight = flight;
        nextEvent = 0;
      }
      if (state.phase === 'flight' && flight) {
        while (nextEvent < flight.events.length && flight.events[nextEvent].t <= state.phaseTime) {
          playEvent(flight.events[nextEvent]);
          nextEvent++;
        }
      }

      // Cheer once on entering 'holed' for a birdie or better.
      if (state.phase === 'holed' && prevPhase !== 'holed') {
        const hole = HOLES[state.holeIndex];
        const score = state.scores[state.holeIndex];
        if (hole && score != null && score <= hole.par - 1) sfx('cheer');
      }
      prevPhase = state.phase;

      const c = actx;
      const m = master;
      if (!c || !m) return;

      // Mower engine: ramps up during 'drive', pitch rises then falls over the ride.
      const eng = ensureEngine(c, m);
      const drive = state.drive;
      const now = c.currentTime;
      let target = 0;
      let mult = 1;
      if (state.phase === 'drive' && drive) {
        target = 0.12;
        const p = Math.max(0, Math.min(1, state.phaseTime / Math.max(0.01, drive.duration)));
        mult = 1 + 0.12 * Math.sin(p * Math.PI);
      }
      eng.gain.gain.setTargetAtTime(target, now, 0.15);
      eng.saw.frequency.setTargetAtTime(55 * mult, now, 0.2);
      eng.sub.frequency.setTargetAtTime(27.5 * mult, now, 0.2);

      // Gulls every 8 to 20 s.
      if (nextGull < 0) nextGull = state.time + rand(3, 8);
      if (state.time >= nextGull) {
        gull(c);
        nextGull = state.time + rand(8, 20);
      }
    },
  };
}
