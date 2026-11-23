// Birding: synth calls. Each species' CallRecipe (data, types.ts) becomes a world-sound recipe on the bus, registered
// as birdSoundId(id); plus the three BIRD_SFX (flush, shutter, tick). Built from sound/synth.ts, same approach as
// hunting/sounds.ts. info.param: 0.5 = calm, 1 = alarmed. info.rand: a little pitch variation per play.
// Peaks never go above 0.25.
import { hasSound, registerSound } from '../sound/bus';
import { burst, tone, voiced } from '../sound/synth';
import type { Recipe, SoundInfo } from '../sound/ids';
import { BIRD_SFX, birdSoundId } from './types';
import type { BirdSpecies, CallRecipe } from './types';

const PEAK_MAX = 0.25;

/** Pitch multiplier: per-play random +-6%, plus a little lift when alarmed. */
function pitchOf(info: SoundInfo): number {
  return (1 + (info.rand - 0.5) * 0.12) * (1 + (info.param - 0.5) * 0.2);
}

/** Peak: calm 0.75x, alarmed 1.25x of the base, never above PEAK_MAX. */
function lvl(info: SoundInfo, base: number): number {
  return Math.min(PEAK_MAX, base * (0.75 + 0.5 * info.param));
}

/** Notes per call, kept to 1..12. */
function notesOf(call: CallRecipe): number {
  return Math.max(1, Math.min(12, Math.round(call.notes)));
}

/** Seconds a call lasts: the last note's end, plus a 0.3 s tail for a chime. */
export function callDuration(call: CallRecipe): number {
  const n = notesOf(call);
  return (n - 1) * call.gap + call.note + (call.kind === 'chime' ? 0.3 : 0);
}

/** The world-sound recipe for a call. */
export function recipeFor(call: CallRecipe): Recipe {
  const n = notesOf(call);
  const dur = callDuration(call);
  return (c, out, t, info) => {
    const p = pitchOf(info);
    const hz = call.hz * p;
    for (let k = 0; k < n; k++) {
      const st = t + k * call.gap;
      const f0 = hz;
      const f1 = hz * call.slide;
      const note = call.note;
      switch (call.kind) {
        case 'whistle':
          tone(c, out, 'sine', st, note, f0, f1, lvl(info, 0.14));
          break;
        case 'chirp':
          tone(c, out, 'triangle', st, Math.min(note, 0.06), f0, f1, lvl(info, 0.12));
          break;
        case 'trill': {
          const m = k % 2 === 1 ? 1.08 : 1;
          tone(c, out, 'sine', st, note, f0 * m, f1 * m, lvl(info, 0.11));
          break;
        }
        case 'warble':
          voiced(c, out, 'triangle', st, note, f0, f1, lvl(info, 0.12), 18, 0.06, 6000);
          break;
        case 'coo':
          voiced(c, out, 'sine', st, note, f0, f1, lvl(info, 0.16), 6, 0.04, 900);
          break;
        case 'hoot':
          voiced(c, out, 'sine', st, note, f0, f1, lvl(info, 0.18), 4, 0.03, 700, 0.06);
          break;
        case 'screech':
          voiced(c, out, 'sawtooth', st, note, f0, f1, lvl(info, 0.12), 30, 0.05, 3500);
          burst(c, out, st, note, 'bandpass', hz * 1.5, hz * 1.5 * call.slide, lvl(info, 0.06), 1);
          break;
        case 'kek':
          tone(c, out, 'square', st, Math.min(note, 0.07), f0, f1, lvl(info, 0.07));
          break;
        case 'quack':
          voiced(c, out, 'sawtooth', st, note, f0, f1, lvl(info, 0.15), 28, 0.04, 1400);
          break;
        case 'honk':
          voiced(c, out, 'sawtooth', st, note, f0, f1, lvl(info, 0.15), 10, 0.03, 1100);
          break;
        case 'croak':
          voiced(c, out, 'sawtooth', st, note, f0, f1, lvl(info, 0.15), 40, 0.08, 800);
          break;
        case 'chime':
          tone(c, out, 'sine', st, note + 0.3, f0, f1, lvl(info, 0.12));
          tone(c, out, 'sine', st, note + 0.3, f0 * 2.01, f1 * 2.01, lvl(info, 0.06));
          break;
      }
    }
    return dur;
  };
}

const SFX: Record<string, Recipe> = {
  [BIRD_SFX.flush]: (c, out, t, info) => {
    // A clatter of small wings, about half a second.
    const count = 8;
    const step = 0.06;
    for (let k = 0; k < count; k++) {
      burst(c, out, t + k * step, 0.04, 'bandpass', 2200, 2200, lvl(info, 0.1), 1.5, 0.004);
    }
    return (count - 1) * step + 0.04;
  },
  [BIRD_SFX.shutter]: (c, out, t, info) => {
    // A click: a bright snap, then a dull thump.
    burst(c, out, t, 0.02, 'highpass', 4000, 4000, lvl(info, 0.15), 1, 0.002);
    burst(c, out, t + 0.02, 0.05, 'lowpass', 900, 900, lvl(info, 0.15), 1, 0.003);
    return 0.02 + 0.05;
  },
  [BIRD_SFX.tick]: (c, out, t, info) => {
    // Two bright notes: a new species on the life list.
    tone(c, out, 'sine', t, 0.12, 1320, 1320, lvl(info, 0.12));
    tone(c, out, 'sine', t + 0.1, 0.12, 1760, 1760, lvl(info, 0.12));
    return 0.1 + 0.12;
  },
};

/** Register birdSoundId(s.id) for every species, plus the BIRD_SFX ids. Later calls register only ids not yet registered. */
export function registerBirdSounds(birds: readonly BirdSpecies[]): void {
  for (const s of birds) {
    const id = birdSoundId(s.id);
    if (!hasSound(id)) registerSound(id, recipeFor(s.call));
  }
  for (const id of Object.keys(SFX)) {
    if (!hasSound(id)) registerSound(id, SFX[id]);
  }
}
