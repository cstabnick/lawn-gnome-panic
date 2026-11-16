// Generative sea-shanty background music, synthesised with WebAudio (no files). M toggles it.
import type { Ctx, System } from './config';
import { KEYS } from './config';
import { getAudio } from './audio';
import { nightAmount, notify } from './rules';

const MUSIC_GAIN = 0.12;
const FADE_SECONDS = 0.5;
const BPM = 84;
const EIGHTH = 60 / BPM / 2;          // 6/8: one 8th at 84 BPM, in seconds
const EIGHTHS_PER_BAR = 6;
const LOOKAHEAD = 0.3;
const BASS_SECONDS = 0.35;
const BASS_PEAK = 0.25;
const MELODY_PEAK = 0.12;
const PAD_LEVEL = 0.02;

interface Chord { bass: number; pad: number }   // bass root and pad root in Hz
interface Key { chords: Chord[]; scale: number[] } // scale as MIDI notes, octave 5 range

// Bass roots: C2, F2, G2, A2, D2, E2. Pad roots: octave 3.
const C: Chord = { bass: 65.41, pad: 130.81 };
const F: Chord = { bass: 87.31, pad: 174.61 };
const G: Chord = { bass: 98.0, pad: 196.0 };
const Am: Chord = { bass: 110.0, pad: 220.0 };
const Dm: Chord = { bass: 73.42, pad: 146.83 };
const Em: Chord = { bass: 82.41, pad: 164.81 };

const DAY_KEY: Key = { chords: [C, F, G, C], scale: [72, 74, 76, 79, 81] };      // C D E G A
const RAIN_KEY: Key = { chords: [Am, Dm, Em, Am], scale: [69, 72, 74, 76, 79] }; // A C D E G

function mtof(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Stops and disconnects nodes once every source in the list has ended. */
function trackEnd(sources: AudioScheduledSourceNode[], nodes: AudioNode[]): void {
  let left = sources.length;
  for (const s of sources) {
    s.onended = () => {
      left--;
      if (left === 0) for (const n of nodes) n.disconnect();
    };
  }
}

/** One oscillator with an attack and exponential decay. */
function pluck(
  ac: AudioContext,
  out: AudioNode,
  type: OscillatorType,
  freq: number,
  t: number,
  dur: number,
  peak: number,
  lowpassHz?: number,
): void {
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const nodes: AudioNode[] = [osc, g];
  osc.connect(g);
  if (lowpassHz !== undefined) {
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = lowpassHz;
    g.connect(lp);
    lp.connect(out);
    nodes.push(lp);
  } else {
    g.connect(out);
  }
  osc.start(t);
  osc.stop(t + dur);
  trackEnd([osc], nodes);
}

/** Squeezebox-like pad: two detuned sawtooths through a 900 Hz lowpass, held for one bar. */
function playPad(ac: AudioContext, out: AudioNode, freq: number, t: number, dur: number): void {
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(PAD_LEVEL, t + 0.4);
  g.gain.setValueAtTime(PAD_LEVEL, t + dur - 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  lp.connect(g);
  g.connect(out);
  const oscs = [-7, 7].map((cents) => {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    o.detune.value = cents;
    o.connect(lp);
    o.start(t);
    o.stop(t + dur);
    return o;
  });
  trackEnd(oscs, [...oscs, lp, g]);
}

export function createMusic(ctx: Ctx): System {
  let musicGain: GainNode | null = null;
  let nextNoteTime = 0;
  let eighth = 0;          // global 8th index
  let scaleIdx = 2;        // position on the pentatonic scale for the melody random walk
  let muted = false;

  /** Schedules everything that starts on 8th `idx` at audio time `t`. */
  function scheduleEighth(ac: AudioContext, out: AudioNode, t: number, idx: number, key: Key, night: boolean): void {
    const step = idx % EIGHTHS_PER_BAR;
    const bar = Math.floor(idx / EIGHTHS_PER_BAR);
    const chord = key.chords[Math.floor(bar / 2) % key.chords.length];

    if (step === 0) {
      playPad(ac, out, chord.pad, t, EIGHTHS_PER_BAR * EIGHTH);
      pluck(ac, out, 'triangle', chord.bass, t, BASS_SECONDS, BASS_PEAK);
    }
    if (step === 3) pluck(ac, out, 'triangle', chord.bass * 1.5, t, BASS_SECONDS, BASS_PEAK);

    const density = night ? 0.3 : 0.6;
    if (Math.random() < density) {
      // Random walk, mostly steps (80% of moves are one step).
      const r = Math.random();
      const move = r < 0.4 ? -1 : r < 0.8 ? 1 : r < 0.9 ? -2 : 2;
      scaleIdx = Math.min(key.scale.length - 1, Math.max(0, scaleIdx + move));
      const midi = key.scale[scaleIdx] + (night ? -12 : 0);
      const dur = 0.2 + Math.random() * 0.2;
      pluck(ac, out, 'sine', mtof(midi), t, dur, MELODY_PEAK, 1200);
    }
  }

  return {
    update() {
      const audio = getAudio();
      if (!audio) return;
      const ac = audio.ctx;

      if (!musicGain) {
        musicGain = ac.createGain();
        musicGain.gain.value = MUSIC_GAIN;
        musicGain.connect(audio.master);
      }

      if (ctx.input.pressed(KEYS.music)) {
        muted = !muted;
        const g = musicGain.gain;
        const now = ac.currentTime;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(muted ? 0 : MUSIC_GAIN, now + FADE_SECONDS);
        notify(ctx.state, muted ? 'Music off (M)' : 'Music on (M)');
      }

      if (ctx.state.mode === 'title') return;

      const now = ac.currentTime;
      if (nextNoteTime < now) nextNoteTime = now + 0.05;

      const night = nightAmount(ctx.state) > 0.5;
      const key = ctx.state.raining ? RAIN_KEY : DAY_KEY;
      while (nextNoteTime < now + LOOKAHEAD) {
        scheduleEighth(ac, musicGain, nextNoteTime, eighth, key, night);
        nextNoteTime += EIGHTH;
        eighth++;
      }
    },
  };
}
