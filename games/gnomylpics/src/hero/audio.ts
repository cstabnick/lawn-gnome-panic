// Gnome Hero's jam: a synthesized drum beat in time with the song clock, and a plucked note per hit, one
// instrument per seat, all from WebAudio oscillators and noise (no asset files). Use only inside createView.

export interface JamOpts {
  /** Beats per minute of the chart. */
  bpm: number;
  /** Song seconds before the first note (drums start at song time 0). */
  leadS: number;
  /** Song length in seconds; the drums stop here. */
  songS: number;
}

export interface Jam {
  /** Call every frame with the local song clock (seconds since the round started). Schedules the drums ahead. */
  tick(songT: number): void;
  /** A hit: lane 0..3 picks the pitch, seat 0..3 the instrument; mine = louder (my own hits). */
  note(lane: number, seat: number, mine: boolean): void;
  /** A wrong press: a short dull thud. */
  clunk(): void;
  dispose(): void;
}

/** A pentatonic A minor scale in semitones above A3 (220 Hz), one entry per lane. */
const LANE_SEMI = [0, 3, 5, 7];

type FilterSpec = { type: BiquadFilterType; freq: number; q?: number };

export function createJam(opts: JamOpts): Jam {
  if (typeof AudioContext === 'undefined') {
    return { tick() {}, note() {}, clunk() {}, dispose() {} };
  }

  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  // One second of white noise, shared by the snare and hats.
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;

  let dead = false;
  const resume = (): void => {
    ctx.resume().catch(() => {});
  };
  resume();
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', resume);
    window.addEventListener('pointerdown', resume);
  }

  const step = 60 / opts.bpm / 2;
  let anchor: number | null = null;
  let next = 0;

  const makeFilter = (spec: FilterSpec): BiquadFilterNode => {
    const f = ctx.createBiquadFilter();
    f.type = spec.type;
    f.frequency.value = spec.freq;
    if (spec.q !== undefined) f.Q.value = spec.q;
    return f;
  };

  /** An oscillator through an optional filter into the master, decaying from peak over dur seconds. */
  const voice = (
    type: OscillatorType,
    freq: number,
    t: number,
    dur: number,
    peak: number,
    filter?: FilterSpec,
  ): void => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    if (filter) {
      const f = makeFilter(filter);
      g.connect(f);
      f.connect(master);
    } else {
      g.connect(master);
    }
    osc.start(t);
    osc.stop(t + dur + 0.02);
  };

  /** A burst of the shared noise buffer through a filter, decaying from peak over dur seconds. */
  const noiseHit = (filter: FilterSpec, t: number, dur: number, peak: number): void => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = makeFilter(filter);
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.02);
  };

  const kick = (t: number): void => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.17);
  };

  const snare = (t: number): void => {
    noiseHit({ type: 'bandpass', freq: 1800, q: 0.8 }, t, 0.12, 0.5);
    voice('triangle', 190, t, 0.06, 0.2);
  };

  const hat = (t: number, odd: boolean): void => {
    noiseHit({ type: 'highpass', freq: 7000 }, t, 0.03, odd ? 0.08 : 0.15);
  };

  const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

  return {
    tick(songT: number): void {
      if (dead) return;
      try {
        if (anchor === null) {
          anchor = ctx.currentTime - songT;
        } else if (Math.abs(ctx.currentTime - songT - anchor) > 0.05) {
          anchor = ctx.currentTime - songT;
        }
        // The song clock jumped back (a restart or seek): resync the grid.
        if (songT < (next - 4) * step) next = Math.ceil(songT / step);

        const secondHalf = songT >= opts.songS / 2;
        while (next * step < songT + 0.15 && next * step < opts.songS) {
          const songTime = next * step;
          if (songTime >= songT - 0.05) {
            const t = anchor + songTime;
            const slot = next % 8;
            if (slot === 0 || slot === 4 || (slot === 6 && secondHalf)) kick(t);
            if (slot === 2 || slot === 6) snare(t);
            hat(t, next % 2 === 1);
          }
          next += 1;
        }
      } catch {
        // Audio is decoration: never let it break the view.
      }
    },

    note(lane: number, seat: number, mine: boolean): void {
      if (dead) return;
      try {
        const semi = LANE_SEMI[clamp(Math.floor(lane), 0, 3)] + (Math.random() < 0.25 ? 12 : 0);
        const base = 220 * Math.pow(2, semi / 12);
        const peak = mine ? 0.35 : 0.12;
        const t = ctx.currentTime;
        const s = clamp(Math.floor(seat), 0, 3);
        if (s === 0) {
          voice('sawtooth', base, t, 0.28, peak, { type: 'lowpass', freq: 2200 });
        } else if (s === 1) {
          voice('triangle', base / 2, t, 0.28, peak);
        } else if (s === 2) {
          voice('square', base, t, 0.28, peak, { type: 'lowpass', freq: 1600 });
        } else {
          voice('sine', base * 2, t, 0.28, peak);
        }
      } catch {
        // Audio is decoration: never let it break the view.
      }
    },

    clunk(): void {
      if (dead) return;
      try {
        voice('square', 80, ctx.currentTime, 0.08, 0.25, { type: 'lowpass', freq: 400 });
      } catch {
        // Audio is decoration: never let it break the view.
      }
    },

    dispose(): void {
      if (dead) return;
      dead = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', resume);
        window.removeEventListener('pointerdown', resume);
      }
      ctx.close().catch(() => {});
    },
  };
}
