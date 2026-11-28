// Animal calls and wildlife. Cartoonish and garden-scale: soft, not shrill.
// info.param: 0.5 = calm call, 1 = alarmed (louder, higher, quicker). info.rand: +-10% pitch variation.
import { burst, env, noise, tone, voiced } from '../synth';
import type { CritterSoundId, Recipe, RecipeTable, SoundInfo } from '../ids';

/** Pitch multiplier: per-play random +-10%, plus a little lift when alarmed. */
function pitch(info: SoundInfo): number {
  return (1 + (info.rand - 0.5) * 0.2) * (1 + (info.param - 0.5) * 0.3);
}

/** Peak multiplier: calm 0.75, alarmed 1.25. */
function loud(info: SoundInfo, peak: number): number {
  return peak * (0.75 + 0.5 * info.param);
}

/** Cheap deterministic hash in 0..1, used to pick notes from a seed. */
function hash(x: number): number {
  const s = Math.sin(x) * 43758.5453;
  return s - Math.floor(s);
}

/** A short hoarse deer bark: a noisy sawtooth with a fast pitch drop. Also the countryside's 'country-deer-bark'. */
export const deerBark: Recipe = (c, out, t, info) => {
  const p = pitch(info);
  voiced(c, out, 'sawtooth', t, 0.3, 520 * p, 220 * p, loud(info, 0.18), 25, 0.05, 1500, 0.005);
  burst(c, out, t, 0.28, 'bandpass', 1200 * p, 600 * p, loud(info, 0.08), 1.5, 0.004);
  return 0.3;
};

/** A wobbly nasal goat "meh-eh-eh": three sawtooth notes with vibrato through a lowpass. Also 'country-goat-bleat'. */
export const goatBleat: Recipe = (c, out, t, info) => {
  const p = pitch(info);
  const gap = 0.2;
  for (let k = 0; k < 3; k++) {
    voiced(c, out, 'sawtooth', t + k * gap, 0.18, 380 * p, 320 * p, loud(info, 0.14), 9, 0.08, 1600, 0.01);
  }
  return 2 * gap + 0.18;
};

export const CRITTER_RECIPES: RecipeTable<CritterSoundId> = {
  moo: (c, out, t, info) => {
    const p = pitch(info);
    voiced(c, out, 'sawtooth', t, 0.9, 140 * p, 110 * p, loud(info, 0.25), 5, 0.02, 900, 0.1);
    return 0.9;
  },

  baa: (c, out, t, info) => {
    const p = pitch(info);
    voiced(c, out, 'square', t, 0.55, 420 * p, 400 * p, loud(info, 0.12), 18, 0.06, 1800, 0.01);
    return 0.55;
  },

  oink: (c, out, t, info) => {
    const p = pitch(info);
    const gap = 0.16;
    for (let k = 0; k < 2; k++) {
      voiced(c, out, 'sawtooth', t + k * gap, 0.12, 190 * p, 150 * p, loud(info, 0.22), 1, 0, 700, 0.01);
    }
    burst(c, out, t, 0.28, 'bandpass', 900, 700, loud(info, 0.05), 1.5, 0.01);
    return gap + 0.12;
  },

  cluck: (c, out, t, info) => {
    const p = pitch(info);
    const count = info.param > 0.5 ? 4 : 3;
    const step = 0.07;
    for (let k = 0; k < count; k++) {
      const tk = t + k * step;
      burst(c, out, tk, 0.03, 'bandpass', 1200 * p, 1200 * p, loud(info, 0.2), 4);
      tone(c, out, 'triangle', tk, 0.04, 700 * p, 500 * p, loud(info, 0.12));
    }
    let end = (count - 1) * step + 0.04;
    if (info.param > 0.7) {
      // Alarmed: a longer "bawk" after the clicks.
      const tb = t + count * step;
      voiced(c, out, 'triangle', tb, 0.35, 900 * p, 450 * p, loud(info, 0.2), 14, 0.02, 2400, 0.01);
      end = count * step + 0.35;
    }
    return end;
  },

  squirrel: (c, out, t, info) => {
    const p = pitch(info);
    const count = 6 + Math.floor(info.rand * 2.99);
    const step = 0.05;
    for (let k = 0; k < count; k++) {
      const f0 = (2400 + 250 * (k % 3)) * p;
      tone(c, out, 'sine', t + k * step, 0.03, f0, f0 * 1.15, loud(info, 0.22));
    }
    return (count - 1) * step + 0.03;
  },

  bear: (c, out, t, info) => {
    // A slow contented yawn: a soft voice rises a little, glides down an octave, then a breathy tail.
    const p = pitch(info);
    const dur = 1.4;
    tone(c, out, 'triangle', t, 0.5, 110 * p, 140 * p, loud(info, 0.16), 0.15);
    tone(c, out, 'triangle', t + 0.5, 0.9, 140 * p, 60 * p, loud(info, 0.18), 0.04);
    burst(c, out, t + 0.6, 0.8, 'lowpass', 500, 250, loud(info, 0.08), 1, 0.1);
    return dur;
  },

  'bee-buzz': (c, out, t, info) => {
    const p = pitch(info);
    voiced(c, out, 'sawtooth', t, 0.7, 220 * p, 220 * p, loud(info, 0.15), 30, 0.02, 1200, 0.2);
    return 0.7;
  },

  'bird-chirp': (c, out, t, info) => {
    const p = pitch(info);
    const gap = 0.1;
    for (let k = 0; k < 2; k++) {
      tone(c, out, 'sine', t + k * gap, 0.08, 2200 * p, 3200 * p, loud(info, 0.25));
    }
    return gap + 0.08;
  },

  'bird-song': (c, out, t, info) => {
    const p = pitch(info);
    const count = 4 + Math.floor(info.rand * 3);
    const step = 0.18;
    for (let k = 0; k < count; k++) {
      // Notes chosen from the play's seed (info.rand), 1800-3600 Hz.
      const f = (1800 + 1800 * hash(info.rand * 1000 + k * 7.31 + 1)) * p;
      tone(c, out, 'sine', t + k * step, 0.16, f, f * 1.1, loud(info, 0.22));
    }
    return (count - 1) * step + 0.16;
  },

  crow: (c, out, t, info) => {
    const p = pitch(info);
    const gap = 0.32;
    const dur = 0.25;
    for (let k = 0; k < 2; k++) {
      const tk = t + k * gap;
      voiced(c, out, 'sawtooth', tk, dur, 600 * p, 480 * p, loud(info, 0.2), 6, 0.01, 1400, 0.01);
      burst(c, out, tk, dur, 'bandpass', 900, 700, loud(info, 0.08), 2, 0.01);
    }
    return gap + dur;
  },

  owl: (c, out, t, info) => {
    const p = pitch(info);
    // "hoo" (0.35 s), pause 0.25 s, "hoo-o" (0.5 s).
    tone(c, out, 'sine', t, 0.35, 380 * p, 340 * p, loud(info, 0.25), 0.03);
    tone(c, out, 'sine', t + 0.6, 0.5, 380 * p, 340 * p, loud(info, 0.25), 0.03);
    return 1.1;
  },

  gull: (c, out, t, info) => {
    const p = pitch(info);
    const gap = 0.55;
    for (let k = 0; k < 2; k++) {
      voiced(c, out, 'triangle', t + k * gap, 0.45, 1400 * p, 900 * p, loud(info, 0.2), 12, 0.03, 3000, 0.02);
    }
    return gap + 0.45;
  },

  frog: (c, out, t, info) => {
    const p = pitch(info);
    const gap = 0.1;
    for (let k = 0; k < 2; k++) {
      voiced(c, out, 'square', t + k * gap, 0.08, 300 * p, 180 * p, loud(info, 0.15), 40, 0.03, 900, 0.005);
    }
    return gap + 0.08;
  },

  cricket: (c, out, t, info) => {
    const p = pitch(info);
    const step = 0.035 + 0.06;
    for (let k = 0; k < 3; k++) {
      tone(c, out, 'sine', t + k * step, 0.035, 4200 * p, 4200 * p, loud(info, 0.15), 0.003);
    }
    return 2 * step + 0.035;
  },

  cicada: (c, out, t, info) => {
    const dur = 1.5;
    const src = c.createBufferSource();
    src.buffer = noise(c);
    src.loop = true;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5000;
    // Amplitude tremolo: a 40 Hz LFO sweeps a 0..1 gain stage (base 0.5, depth 0.5).
    const trem = c.createGain();
    trem.gain.value = 0.5;
    const lfo = c.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 40;
    const lfoG = c.createGain();
    lfoG.gain.value = 0.5;
    lfo.connect(lfoG).connect(trem.gain);
    const g = c.createGain();
    env(g, loud(info, 0.08), t, dur, 0.3);
    const offset = Math.random() * 0.5;
    src.connect(hp).connect(trem).connect(g).connect(out);
    src.start(t, offset);
    src.stop(t + dur + 0.01);
    lfo.start(t);
    lfo.stop(t + dur + 0.01);
    src.onended = () => {
      src.disconnect();
      hp.disconnect();
      trem.disconnect();
      g.disconnect();
    };
    lfo.onended = () => {
      lfo.disconnect();
      lfoG.disconnect();
    };
    return dur;
  },

  'critter-thud': (c, out, t, info) => {
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.15, 110 * p, 50 * p, loud(info, 0.35));
    burst(c, out, t, 0.12, 'lowpass', 800, 200, loud(info, 0.25), 1);
    return 0.15;
  },

  'deer-bark': deerBark,
  'goat-bleat': goatBleat,
};
