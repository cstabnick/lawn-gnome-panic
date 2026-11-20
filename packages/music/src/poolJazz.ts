/**
 * Upbeat casino jazz for Gnome Billiards (the Gnomecino pool table):
 * the blackjack lounge's warm piano, upright bass and vibes, pushed to a brisker swing with real jazz drums
 * (a ride on the swung offbeats, a feathered kick on 1 and 3, ghost snare on 2 and 4).
 *
 * - Tempo 118-128 BPM, swing 0.2-0.28.
 * - Walking bass in 4, comping stabs on the offbeats, short lead riffs from the chord tones.
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from './engine';
import { createKit } from './drums';
import { createFeltPiano, createUprightBass, createVibraphone } from './instruments';
import { createFx } from './mix';
import { humanize, mulberry32, voiceLead } from './theory';

type ChordQuality = 'maj7' | 'm7' | 'dom7' | 'm7b5' | 'dom9';

const CHORD_INTERVALS: Record<ChordQuality, readonly number[]> = {
  maj7: [0, 4, 7, 11, 14],
  m7: [0, 3, 7, 10, 14],
  dom7: [0, 4, 7, 10, 14],
  m7b5: [0, 3, 6, 10, 14],
  dom9: [0, 4, 7, 10, 14, 21],
};

type ChordStep = readonly [semitoneOffset: number, quality: ChordQuality];

// Eight-bar loops, each a swing-friendly ii-V-I casino turnaround in a different key colour.
const PROGRESSIONS: readonly (readonly ChordStep[])[] = [
  [[0, 'maj7'], [9, 'm7'], [2, 'm7b5'], [7, 'dom9'], [0, 'maj7'], [5, 'dom7'], [2, 'm7'], [7, 'dom9']],
  [[0, 'm7'], [5, 'dom7'], [8, 'maj7'], [7, 'dom9'], [0, 'm7'], [5, 'dom7'], [3, 'maj7'], [7, 'dom9']],
  [[0, 'maj7'], [4, 'm7'], [9, 'dom7'], [2, 'm7'], [7, 'dom9'], [0, 'maj7'], [7, 'm7b5'], [0, 'dom7']],
];

const TONICS = [53, 55, 56, 58, 60, 62] as const; // F3..D4
const CHORD_CENTER = 63;

interface VoicedChord {
  root: number;
  notes: number[];
  tones: number[];
}

type Ev<V> = [number, V];

function bassRoot(midi: number): number {
  let r = midi;
  while (r > 47) r -= 12;
  while (r < 36) r += 12;
  return r;
}

export function buildGnomecinoPool(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rng = mulberry32(seed);
  const bpm = 118 + Math.floor(rng() * 11); // 118..128 BPM
  const swing = 0.2 + rng() * 0.08;
  const tonic = TONICS[Math.floor(rng() * TONICS.length)];
  const prog = PROGRESSIONS[Math.floor(rng() * PROGRESSIONS.length)];
  const BARS = prog.length;

  T.getTransport().bpm.value = bpm;
  const BAR = 240 / bpm;
  const BEAT = BAR / 4;
  const EIGHTH = BAR / 8;
  const LOOP = BARS * BAR;
  const swungEighth = (slot: number): number => slot * EIGHTH + (slot % 2 === 1 ? swing * EIGHTH : 0);

  // Voice each chord once, leading smoothly from the one before.
  let prev: number[] | null = null;
  const chords: VoicedChord[] = prog.map(([semi, quality]) => {
    const intervals = CHORD_INTERVALS[quality];
    const abs = intervals.slice(0, 4).map((iv) => tonic + semi + iv);
    const notes = voiceLead(abs, CHORD_CENTER, prev);
    prev = notes;
    return { root: bassRoot(tonic + semi), notes, tones: intervals.map((iv) => (tonic + semi + iv) % 12) };
  });
  const chordAt = (bar: number): VoicedChord => chords[((bar % BARS) + BARS) % BARS];

  const bassEv: Ev<{ midi: number; dur: number; vel: number }>[] = [];
  const compEv: Ev<{ midis: number[]; dur: number; vel: number }>[] = [];
  const leadEv: Ev<{ midi: number; dur: number; vel: number }>[] = [];
  const vibeEv: Ev<{ midis: number[]; dur: number; vel: number }>[] = [];
  const rideEv: Ev<{ vel: number }>[] = [];
  const kickEv: Ev<{ vel: number }>[] = [];
  const snareEv: Ev<{ vel: number }>[] = [];

  for (let bar = 0; bar < BARS; bar++) {
    const chord = chordAt(bar);
    const next = chordAt(bar + 1);
    const t0 = bar * BAR;
    const pool: number[] = [];
    for (let m = 67; m <= 84; m++) if (chord.tones.includes(m % 12)) pool.push(m);

    // Walking bass: root, a chord tone, the fifth, then a chromatic approach into the next chord.
    const walk = [chord.root, chord.root + (chord.notes.length > 2 ? 4 : 3), chord.root + 7, next.root + (rng() < 0.5 ? -1 : 1)];
    walk.forEach((midi, beat) => bassEv.push([t0 + beat * BEAT, { midi, dur: 0.9 * BEAT, vel: 0.8 * humanize(bar + beat, 0.06) }]));

    // Ride cymbal on the swung offbeats, feathered kick on 1 and 3, ghost snare on 2 and 4.
    for (let beat = 0; beat < 4; beat++) {
      rideEv.push([t0 + beat * BEAT, { vel: 0.5 }]);
      rideEv.push([t0 + beat * BEAT + swing * EIGHTH * 2, { vel: 0.32 }]);
    }
    kickEv.push([t0, { vel: 0.62 }]);
    if (rng() < 0.6) kickEv.push([t0 + 2 * BEAT, { vel: 0.5 }]);
    snareEv.push([t0 + BEAT, { vel: 0.3 }]);
    snareEv.push([t0 + 3 * BEAT, { vel: 0.34 }]);
    if (rng() < 0.35) snareEv.push([t0 + swungEighth(7), { vel: 0.2 }]);

    // Comping stabs on the offbeats (Charleston-ish), with a bit of chance.
    if (rng() < 0.85) {
      compEv.push([t0 + swungEighth(1), { midis: chord.notes, dur: 0.6 * BEAT, vel: 0.5 * humanize(bar, 0.1) }]);
      compEv.push([t0 + swungEighth(5), { midis: chord.notes, dur: 0.6 * BEAT, vel: 0.46 * humanize(bar + 1, 0.1) }]);
    }

    // A short lead riff, 2-4 notes from the chord tones on swung eighths.
    if (rng() < 0.7) {
      let idx = Math.floor(pool.length * (0.35 + rng() * 0.3));
      for (const slot of [0, 2, 3, 5, 6].filter(() => rng() < 0.5).slice(0, 4)) {
        idx = Math.max(0, Math.min(pool.length - 1, idx + (Math.floor(rng() * 3) - 1)));
        leadEv.push([t0 + swungEighth(slot), { midi: pool[idx], dur: 1.2 * EIGHTH, vel: (0.56 + 0.12 * rng()) * humanize(slot, 0.08) }]);
      }
    }

    // Vibes chime on each new chord's first bar.
    if (bar === 0 || rng() < 0.2) {
      vibeEv.push([t0 + 0.03, { midis: chord.notes.slice(-2).map((n) => n + 12), dur: 2 * BEAT, vel: 0.36 }]);
    }
  }

  const fx = createFx(T, keep, out, {
    reverbDecay: 3.6,
    reverbHp: 280,
    echoTime: '8n.',
    echoFeedback: 0.2,
    echoLp: 3400,
    delayDry: 0.18,
    delayRevSend: 0.7,
  });
  const piano = createFeltPiano(T, keep, out, fx, { volumeDb: -8, revSend: 0.36, echoSend: 0.08, brightness: 4200 });
  const bass = createUprightBass(T, keep, out, { volumeDb: -6 });
  const vibes = createVibraphone(T, keep, out, fx, { volumeDb: -20, revSend: 0.6, echoSend: 0.18 });
  const kit = createKit(T, keep, out, fx, { hatVolume: -16, swing });

  const schedule = <V>(events: Ev<V>[], fn: (time: number, v: V) => void) => {
    if (events.length === 0) return;
    const part = keep(new T.Part((time, v) => fn(time, v as V), events as [number, unknown][]));
    part.loop = true;
    part.loopEnd = LOOP;
    part.start(0);
  };

  schedule(bassEv, (t, v) => bass.play(v.midi, v.dur, t, v.vel));
  schedule(compEv, (t, v) => piano.play(v.midis, v.dur, t, v.vel));
  schedule(leadEv, (t, v) => piano.play(v.midi, v.dur, t, v.vel));
  schedule(vibeEv, (t, v) => vibes.play(v.midis, v.dur, t, v.vel));
  schedule(rideEv, (t, v) => kit.hit({ o: 1 }, t, 0, v.vel));
  schedule(kickEv, (t, v) => kit.hit({ k: 1 }, t, 0, v.vel));
  schedule(snareEv, (t, v) => kit.snareHit(t, v.vel));
}
