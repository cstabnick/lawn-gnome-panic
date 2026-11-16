// Breaks and the synthesized drum kit.
//
// No samples: the classic breaks are not CC0, which repo rules forbid (docs/assets.md). They are
// used only as rhythm templates, 2-bar 16th-note grids transcribed by hand (approximate).
import type * as ToneNS from 'tone';
import type { Keep, Tone } from './engine';
import type { Fx } from './mix';

/** One 16th-note slice of a break. g = ghost snare, o = open hat. */
export interface Slice { k?: 1; s?: 1; g?: 1; h?: 1; o?: 1 }

/**
 * A 2-bar break from text rows, 32 steps each ('x' = hit). Rows: k kick, s snare, g ghost snare,
 * h closed hat/ride, o open hat. Spaces and '|' are ignored.
 */
export function grid(rows: Partial<Record<keyof Slice, string>>): Slice[] {
  const out: Slice[] = Array.from({ length: 32 }, () => ({}));
  for (const [key, row] of Object.entries(rows) as [keyof Slice, string][]) {
    const r = row.replace(/[ |]/g, '');
    for (let i = 0; i < 32; i++) if (r[i] === 'x') out[i][key] = 1;
  }
  return out;
}

/** Each break is 2 bars: an A bar and a variation bar that is good chop material. */
export interface Break { name: string; steps: Slice[] }
export const BREAKS: Break[] = [
  { name: 'Amen', steps: grid({ // The Winstons: bars 1 and 4
    k: 'x.x.......xx.... | x.x........x..x.',
    s: '....x..x.x..x..x | ....x..x.x...x..',
    g: '................ | ...............x',
    h: 'x.x.x.x.x.x.x.x. | x.x.x.x.x.x.x.x.',
    o: '................ | ..........x.....',
  }) },
  { name: 'Think', steps: grid({ // Lyn Collins: busy kick, open hat lifts
    k: 'x......x..x..... | x..x..x...x.....',
    s: '....x.......x... | ....x..x....x...',
    g: '..........x....x | .........x.....x',
    h: 'x.x.x.x.x.x.x.x. | x.x.x.x.x.x.x...',
    o: '......x......... | ..............x.',
  }) },
  { name: 'Funky Drummer', steps: grid({ // James Brown: 16th hats, ghost-note shuffle
    k: 'x.x.......x..x.. | x.x.......x.....',
    s: '....x.......x... | ....x.......x...',
    g: '.......x.x.....x | .x.....x.x.x...x',
    h: 'xxxxxx.xxxxxxxxx | xxxxxx.xxxxxxx.x',
    o: '......x......... | ......x.......x.',
  }) },
  { name: 'Apache', steps: grid({ // Incredible Bongo Band: rolling, swung feel
    k: 'x.....x...x..... | x.....x.x.x.....',
    s: '....x.......x... | ....x.......x.x.',
    g: '..x.......x..... | .......x.......x',
    h: 'x.x.x.x.x.x.x.x. | x.x.x.x.x.x.x.x.',
  }) },
];
export const breakByName = (name: string): Break => BREAKS.find((b) => b.name === name) ?? BREAKS[0];

/** One bar of a 2-bar break, unchopped. */
export const barOf = (b: Break, bar: 0 | 1): Slice[] => b.steps.slice(bar * 16, bar * 16 + 16);

/**
 * One chopped bar from a 2-bar source. `amount` is the chance each 8th gets swapped (0 = straight).
 * Swaps only take a slice from the same spot in another beat, so the groove keeps its shape.
 */
export function chopBar(rnd: () => number, source: Slice[], sourceBar: 0 | 1, amount: number): Slice[] {
  const out: Slice[] = [];
  for (let eighth = 0; eighth < 8; eighth++) {
    let src = eighth + sourceBar * 8;
    // Downbeat and backbeat stay put; elsewhere swap with the same 8th of a random beat.
    if (eighth !== 0 && eighth !== 2 && rnd() < amount) src = (eighth % 2) + 2 * Math.floor(rnd() * 8);
    const a = source[src * 2];
    const b = source[src * 2 + 1];
    if (eighth >= 6 && rnd() < amount * 0.3) out.push(a, a); // occasional stutter, late in the bar
    else out.push(a, b);
  }
  return out;
}

/** The bar with a snare roll over its last 4 (or 8) steps. */
export function withFill(bar: Slice[], from: 8 | 12 = 12): Slice[] {
  const out = bar.slice();
  for (let i = from; i < 16; i++) out[i] = i % 2 === 0 || i > 13 ? { s: 1 } : { g: 1 };
  return out;
}

/** Fills for the last bar of a section (into the next one). */
export type TransitionFill = 'roll' | 'cut' | 'stutter' | 'syncopated';
export const TRANSITION_FILLS: TransitionFill[] = ['roll', 'cut', 'stutter', 'syncopated'];

/**
 * A section-ending fill over the last beat or two of `bar`. Deliberately small, so the
 * groove stays recognisable:
 * - roll: snare roll over the last beat.
 * - cut: the drums drop out on the last beat, leaving one ghost note (a breath before the drop).
 * - stutter: the beat-3 snare slice repeated across the last beat.
 * - syncopated: snare/ghost pushes on the off-16ths of the last 6 steps.
 */
export function transitionFill(bar: Slice[], kind: TransitionFill): Slice[] {
  const out = bar.slice();
  switch (kind) {
    case 'roll': return withFill(bar, 12);
    case 'cut':
      for (let i = 12; i < 16; i++) out[i] = {};
      out[15] = { g: 1 };
      return out;
    case 'stutter': {
      const hit: Slice = { ...(bar[8].s ? bar[8] : { s: 1 }), k: undefined };
      for (let i = 12; i < 16; i++) out[i] = i % 2 === 0 ? hit : { g: 1 };
      return out;
    }
    case 'syncopated':
      out[10] = { s: 1 }; out[11] = {}; out[12] = { g: 1 }; out[13] = { s: 1 }; out[14] = { g: 1 }; out[15] = { s: 1 };
      return out;
  }
}

export interface Kit {
  /** Plays one slice. Returns true if it had a kick (for sidechain ducking). */
  hit(sl: Slice, time: number, pos: number, vel?: number): boolean;
  /** A snare hit on its own (builds, rolls). */
  snareHit(time: number, vel: number): void;
}

/**
 * The kit: MembraneSynth kick, pink-noise snare band-limited to 900 Hz-4.5 kHz (white noise was
 * too bright) with a membrane body, high-passed noise hats. Drums go through a gritty compressed bus.
 */
export function createKit(T: Tone, keep: Keep, dest: ToneNS.InputNode, fx: Fx, opts: { grit?: number; snarePitch?: string; swing?: number } = {}): Kit {
  const drumBus = keep(new T.Compressor({ threshold: -18, ratio: 4, attack: 0.005, release: 0.1 })).connect(dest);
  const grit = keep(new T.Distortion(opts.grit ?? 0.2)).connect(drumBus);
  const kick = keep(new T.MembraneSynth({ pitchDecay: 0.03, octaves: 6, envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.05 } })).connect(grit);
  const snareBody = keep(new T.MembraneSynth({ pitchDecay: 0.01, octaves: 2, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 } })).connect(grit);
  snareBody.volume.value = -9;
  const snareHp = keep(new T.Filter(900, 'highpass')).fan(grit, fx.snareSend, fx.throwSend);
  const snareLp = keep(new T.Filter(4500, 'lowpass')).connect(snareHp);
  const snare = keep(new T.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.14, sustain: 0, release: 0.03 } })).connect(snareLp);
  snare.volume.value = -7;
  const hatHp = keep(new T.Filter(7000, 'highpass')).connect(drumBus);
  const hat = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.035, sustain: 0, release: 0.01 } })).connect(hatHp);
  hat.volume.value = -14;
  const snarePitch = opts.snarePitch ?? 'E3';
  // Swing pushes off-beat 16th hats late by this fraction of a 16th.
  const swingS = (opts.swing ?? 0) * T.Time('16n').toSeconds();

  const snareHit = (time: number, vel: number): void => {
    snare.triggerAttackRelease('16n', time, vel);
    snareBody.triggerAttackRelease(snarePitch, '32n', time, vel * 0.75);
  };
  return {
    hit(sl, time, pos, vel = 1) {
      if (sl.k) kick.triggerAttackRelease('C1', '8n', time, 0.95 * vel);
      if (sl.s) snareHit(time, 0.8 * vel);
      else if (sl.g) snare.triggerAttackRelease('32n', time, 0.25 * vel);
      const hatTime = pos % 2 === 1 ? time + swingS : time;
      if (sl.o) hat.triggerAttackRelease('8n', hatTime, 0.5 * vel);
      else if (sl.h) hat.triggerAttackRelease('32n', hatTime, (pos % 4 === 0 ? 0.6 : 0.35) * vel);
      return !!sl.k;
    },
    snareHit,
  };
}
