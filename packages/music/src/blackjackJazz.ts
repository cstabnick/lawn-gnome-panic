/**
 * Jazzy cocktail-lounge music for Gnome Blackjack:
 * "Ritz-Carlton lobby mixed with Macy's during Christmas" — classy, but just not that classy.
 *
 * - Tempo 92-102 BPM, medium swing with occasional bouts of eighth-note & quarter-note triplets.
 * - Oriented around a warm cocktail felt piano (comping, cheeky melodies, cascading triplet runs)
 *   and a plucked upright string bass (2-feel into walking basslines with triplet pickups).
 * - Lightly backed by soft brushed drums/rim fills and a whisper of vibraphone chime on section turns.
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from './engine';
import { createFeltPiano, createSoftKit, createUprightBass, createVibraphone } from './instruments';
import { createFx } from './mix';
import { humanize, mulberry32, voiceLead } from './theory';

type ChordQuality = 'maj69' | 'maj9' | 'm9' | 'dom13' | 'dom7b9' | 'dim7';

const CHORD_INTERVALS: Record<ChordQuality, readonly number[]> = {
  maj69: [0, 4, 7, 9, 14],
  maj9: [0, 4, 7, 11, 14],
  m9: [0, 3, 7, 10, 14],
  dom13: [0, 4, 7, 10, 14, 21],
  dom7b9: [0, 4, 7, 10, 13],
  dim7: [0, 3, 6, 9],
};

type ChordStep = readonly [semitoneOffset: number, quality: ChordQuality];

const A_PROGRESSIONS: readonly (readonly ChordStep[])[] = [
  // Classic hotel-lobby I6/9 - vi9 - ii9 - V13 turnaround
  [
    [0, 'maj69'], [9, 'm9'], [2, 'm9'], [7, 'dom13'],
    [4, 'm9'], [9, 'dom13'], [2, 'm9'], [7, 'dom7b9'],
  ],
  // Macy's Christmas standard with cheeky #Idim7 passing chord
  [
    [0, 'maj69'], [1, 'dim7'], [2, 'm9'], [7, 'dom13'],
    [0, 'maj9'], [5, 'maj69'], [2, 'm9'], [7, 'dom13'],
  ],
  // Jaunty lounge stride
  [
    [0, 'maj9'], [5, 'dom13'], [4, 'm9'], [9, 'm9'],
    [2, 'm9'], [7, 'dom13'], [0, 'maj69'], [7, 'dom7b9'],
  ],
];

const B_PROGRESSIONS: readonly (readonly ChordStep[])[] = [
  // Classic IV -> iv -> bVII13 -> iii -> VI -> ii -> V bridge
  [
    [5, 'maj9'], [5, 'maj69'], [5, 'm9'], [10, 'dom13'],
    [4, 'm9'], [9, 'dom13'], [2, 'm9'], [7, 'dom13'],
  ],
  // Showtune bridge with #IVdim7 lift
  [
    [5, 'maj9'], [6, 'dim7'], [0, 'maj69'], [9, 'dom13'],
    [2, 'm9'], [7, 'dom13'], [0, 'maj69'], [7, 'dom7b9'],
  ],
];

const TONICS = [53, 55, 56, 58, 60] as const; // F3, G3, Ab3, Bb3, C4
const BARS_PER_SECTION = 8;
const FORM = ['A', 'A', 'B', 'A'] as const;
const TOTAL_BARS = FORM.length * BARS_PER_SECTION;
const CHORD_CENTER = 63; // Eb4 cocktail comping center
const SWING = 0.22; // medium jazz swing on offbeat 8ths

interface VoicedChord {
  root: number;
  notes: number[];
  tones: number[]; // pitch classes (semitones above tonic)
  quality: ChordQuality;
}

type Ev<V> = [number, V];

function normalizeBassRoot(midi: number): number {
  let r = midi;
  while (r > 47) r -= 12;
  while (r < 35) r += 12;
  return r;
}

export function buildBlackjackJazz(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rng = mulberry32(seed);
  const bpm = 92 + Math.floor(rng() * 11); // 92..102 BPM
  const tonic = TONICS[Math.floor(rng() * TONICS.length)];
  const progA = A_PROGRESSIONS[Math.floor(rng() * A_PROGRESSIONS.length)];
  const progB = B_PROGRESSIONS[Math.floor(rng() * B_PROGRESSIONS.length)];

  T.getTransport().bpm.value = bpm;
  const BAR = 240 / bpm;
  const BEAT = BAR / 4;
  const EIGHTH = BAR / 8;
  const TRIPLET_8 = BEAT / 3;
  const TRIPLET_4 = (2 * BEAT) / 3;
  const LOOP = TOTAL_BARS * BAR;

  const voiceProgression = (prog: readonly ChordStep[]): VoicedChord[] => {
    let prev: number[] | null = null;
    return prog.map(([semi, quality]) => {
      const intervals = CHORD_INTERVALS[quality];
      const abs = intervals.slice(0, 4).map((iv) => tonic + semi + iv);
      const notes = voiceLead(abs, CHORD_CENTER, prev);
      prev = notes;
      return {
        root: normalizeBassRoot(tonic + semi),
        notes,
        tones: intervals.map((iv) => (tonic + semi + iv) % 12),
        quality,
      };
    });
  };

  const chordsA = voiceProgression(progA);
  const chordsB = voiceProgression(progB);
  const chordAt = (bar: number): VoicedChord => {
    const idx = ((bar % TOTAL_BARS) + TOTAL_BARS) % TOTAL_BARS;
    const section = FORM[Math.floor(idx / BARS_PER_SECTION)];
    const sb = idx % BARS_PER_SECTION;
    return (section === 'A' ? chordsA : chordsB)[sb];
  };

  // Swung eighth-note time offset inside a bar (slot 0..7)
  const swungEighth = (slot: number): number =>
    slot * EIGHTH + (slot % 2 === 1 ? SWING * EIGHTH : 0);

  // Build an ascending or descending melody pool in [67..84] from the chord's tones
  const melodyPoolFor = (chord: VoicedChord, low = 67, high = 84): number[] => {
    const outNotes: number[] = [];
    for (let m = low; m <= high; m++) {
      if (chord.tones.includes(m % 12)) outNotes.push(m);
    }
    return outNotes.length > 0 ? outNotes : chord.notes.map((n) => n + 12);
  };

  const bassEv: Ev<{ midi: number; dur: number; vel: number }>[] = [];
  const compEv: Ev<{ midis: number[]; dur: number; vel: number }>[] = [];
  const leadEv: Ev<{ midi: number; dur: number; vel: number }>[] = [];
  const vibeEv: Ev<{ midis: number[]; dur: number; vel: number }>[] = [];
  const brushEv: Ev<{ vel: number }>[] = [];
  const rimEv: Ev<{ vel: number }>[] = [];
  const shakerEv: Ev<{ vel: number }>[] = [];

  for (let bar = 0; bar < TOTAL_BARS; bar++) {
    const chord = chordAt(bar);
    const nextChord = chordAt(bar + 1);
    const t0 = bar * BAR;
    const sb = bar % BARS_PER_SECTION;
    const section = FORM[Math.floor(bar / BARS_PER_SECTION)];
    const isTurnaround = sb === 3 || sb === 7;

    // ----- 1. Upright String Bass: 2-feel opening into walking 4-feel + occasional triplet skips -----
    if (bar < 4) {
      // Classy 2-feel opening
      bassEv.push([t0, { midi: chord.root, dur: 1.85 * BEAT, vel: 0.82 }]);
      const fifth = chord.root + 7 <= 50 ? chord.root + 7 : chord.root - 5;
      bassEv.push([t0 + 2 * BEAT, { midi: fifth, dur: 1.75 * BEAT, vel: 0.72 }]);
      if (bar === 3) {
        // Triplet pickup into bar 4 where walking starts
        const target = nextChord.root;
        bassEv.push([t0 + 3 * BEAT, { midi: target + 3, dur: TRIPLET_8 * 0.9, vel: 0.68 }]);
        bassEv.push([t0 + 3 * BEAT + TRIPLET_8, { midi: target + 2, dur: TRIPLET_8 * 0.9, vel: 0.72 }]);
        bassEv.push([t0 + 3 * BEAT + 2 * TRIPLET_8, { midi: target + 1, dur: TRIPLET_8 * 0.9, vel: 0.78 }]);
      }
    } else {
      const third = chord.root + (chord.quality === 'm9' || chord.quality === 'dim7' ? 3 : 4);
      const fifth = chord.root + (chord.quality === 'dim7' ? 6 : 7);
      const approach = nextChord.root + (rng() < 0.55 ? -1 : 1);

      bassEv.push([t0, { midi: chord.root, dur: 0.92 * BEAT, vel: 0.86 }]);
      bassEv.push([t0 + BEAT, { midi: rng() < 0.65 ? third : fifth, dur: 0.9 * BEAT, vel: 0.75 }]);
      bassEv.push([t0 + 2 * BEAT, { midi: rng() < 0.6 ? fifth : chord.root + 12, dur: 0.9 * BEAT, vel: 0.78 }]);

      // Occasional triplet pickup on beat 4
      if ((isTurnaround && rng() < 0.55) || rng() < 0.18) {
        const dir = approach < nextChord.root ? 1 : -1;
        bassEv.push([t0 + 3 * BEAT, { midi: approach - 2 * dir, dur: TRIPLET_8 * 0.88, vel: 0.7 }]);
        bassEv.push([t0 + 3 * BEAT + TRIPLET_8, { midi: approach - dir, dur: TRIPLET_8 * 0.88, vel: 0.74 }]);
        bassEv.push([t0 + 3 * BEAT + 2 * TRIPLET_8, { midi: approach, dur: TRIPLET_8 * 0.9, vel: 0.82 }]);
      } else {
        bassEv.push([t0 + 3 * BEAT, { midi: approach, dur: 0.9 * BEAT, vel: 0.76 }]);
      }
    }

    // ----- 2. Cocktail Piano Comping: Charleston & syncopated lounge voicings -----
    const voicing = chord.notes;
    if (sb === 0) {
      // Rolled chord feel on section downbeat
      voicing.forEach((m, i) => {
        leadEv.push([t0 + i * 0.022, { midi: m, dur: 1.6 * BEAT, vel: 0.56 + i * 0.04 }]);
      });
    } else if (rng() < 0.85) {
      // Beat 1 + swung '& of 2' (Charleston) or '& of 1' + beat 3
      if (rng() < 0.6) {
        compEv.push([t0, { midis: voicing, dur: 0.75 * BEAT, vel: 0.52 * humanize(bar, 0.1) }]);
        compEv.push([t0 + swungEighth(3), { midis: voicing, dur: 1.1 * BEAT, vel: 0.44 * humanize(bar + 3, 0.12) }]);
      } else {
        compEv.push([t0 + swungEighth(1), { midis: voicing, dur: 0.8 * BEAT, vel: 0.46 }]);
        compEv.push([t0 + 2 * BEAT, { midis: voicing, dur: 0.9 * BEAT, vel: 0.5 }]);
      }
    }
    if (rng() < 0.35) {
      compEv.push([t0 + swungEighth(7), { midis: voicing.slice(1), dur: 0.55 * BEAT, vel: 0.38 }]);
    }

    // ----- 3. Cocktail Piano Lead & Occasional Bouts of Triplets -----
    const pool = melodyPoolFor(chord, 67, 84);
    const doTripletBout = isTurnaround ? rng() < 0.72 : rng() < 0.28;

    if (doTripletBout) {
      // Occasional bout of triplets! Either an ascending/descending 8th-note triplet cascade
      // or a classy-corny quarter-note triplet phrase across 2 beats.
      const useQuarterTriplet = section === 'B' && rng() < 0.45;
      if (useQuarterTriplet) {
        const startIdx = Math.min(pool.length - 1, Math.floor(pool.length * 0.65));
        for (let k = 0; k < 3; k++) {
          const note = pool[Math.max(0, startIdx - k)];
          leadEv.push([t0 + BEAT + k * TRIPLET_4, {
            midi: note,
            dur: TRIPLET_4 * 0.88,
            vel: (0.66 - k * 0.04) * humanize(k, 0.08),
          }]);
        }
      } else {
        // 1-beat (3-note) or 2-beat (6-note) cascading eighth-note triplet flurry
        const count = isTurnaround || rng() < 0.55 ? 6 : 3;
        const startBeat = count === 6 ? 2 : (rng() < 0.5 ? 2 : 3);
        const ascending = rng() < 0.45;
        let idx = ascending
          ? Math.floor(rng() * Math.max(1, pool.length - count))
          : Math.min(pool.length - 1, count - 1 + Math.floor(rng() * Math.max(1, pool.length - count + 1)));

        for (let k = 0; k < count; k++) {
          const safeIdx = Math.max(0, Math.min(pool.length - 1, idx));
          const note = pool[safeIdx];
          leadEv.push([t0 + startBeat * BEAT + k * TRIPLET_8, {
            midi: note,
            dur: TRIPLET_8 * 1.15,
            vel: (0.58 + (k === 0 || k === 3 ? 0.1 : 0)) * humanize(k + bar, 0.08),
          }]);
          idx += ascending ? 1 : -1;
        }
      }
    } else if (rng() < 0.78) {
      // Playful swung cocktail melody phrase (2-4 notes)
      const slots = [0, 2, 3, 5, 6, 7].filter(() => rng() < 0.45).slice(0, 4);
      let prevIdx = Math.floor(pool.length * 0.5);
      for (const slot of slots) {
        const step = Math.floor(rng() * 3) - 1;
        prevIdx = Math.max(0, Math.min(pool.length - 1, prevIdx + step));
        leadEv.push([t0 + swungEighth(slot), {
          midi: pool[prevIdx],
          dur: 1.4 * EIGHTH,
          vel: (0.54 + 0.14 * rng()) * humanize(slot, 0.1),
        }]);
      }
    }

    // ----- 4. Subtle Macy's Holiday Chime (Vibraphone) on section starts -----
    if (sb === 0 && bar > 0) {
      const top = chord.notes.slice(-2).map((n) => n + 12);
      vibeEv.push([t0 + 0.03, { midis: top, dur: 2.4 * BEAT, vel: 0.42 }]);
    }

    // ----- 5. Soft Brush & Rim Percussion -----
    if (bar >= 2) {
      // Classic jazz ride/brush pulse on 2 & 4, plus swung '& of 2' and '& of 4'
      brushEv.push([t0 + BEAT, { vel: 0.34 }]);
      brushEv.push([t0 + 3 * BEAT, { vel: 0.36 }]);
      if (rng() < 0.75) shakerEv.push([t0 + swungEighth(3), { vel: 0.28 }]);
      if (rng() < 0.75) shakerEv.push([t0 + swungEighth(7), { vel: 0.26 }]);

      if (sb === 7) {
        // Soft triplet brush/rim fill at the end of every 8-bar section
        rimEv.push([t0 + 3 * BEAT, { vel: 0.24 }]);
        brushEv.push([t0 + 3 * BEAT + TRIPLET_8, { vel: 0.22 }]);
        rimEv.push([t0 + 3 * BEAT + 2 * TRIPLET_8, { vel: 0.3 }]);
      } else if (rng() < 0.3) {
        rimEv.push([t0 + swungEighth(3), { vel: 0.22 }]);
      }
    }
  }

  // ----- Instruments & Room Mix -----
  const fx = createFx(T, keep, out, {
    reverbDecay: 4.2,
    reverbHp: 280,
    echoTime: '8n.',
    echoFeedback: 0.22,
    echoLp: 3200,
    delayDry: 0.15,
    delayRevSend: 0.85,
  });

  const piano = createFeltPiano(T, keep, out, fx, {
    volumeDb: -7,
    revSend: 0.42,
    echoSend: 0.1,
    brightness: 3800,
  });
  const bass = createUprightBass(T, keep, out, { volumeDb: -6 });
  const vibes = createVibraphone(T, keep, out, fx, {
    volumeDb: -20,
    revSend: 0.72,
    echoSend: 0.22,
  });
  const kit = createSoftKit(T, keep, out, fx, {
    volumeDb: -13,
    revSend: 0.32,
  });

  // ----- Schedule Parts -----
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
  schedule(brushEv, (t, v) => kit.brush(t, v.vel));
  schedule(rimEv, (t, v) => kit.rim(t, v.vel));
  schedule(shakerEv, (t, v) => kit.shaker(t, v.vel));
}
