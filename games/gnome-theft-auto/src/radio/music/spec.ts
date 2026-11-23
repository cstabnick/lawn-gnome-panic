// What a Turfton FM song is, as data. Each song on The Blade, Fescue Public and Compliance Beats is one SongSpec in
// songs/<station>.ts; compose.ts turns it into notes (pure, tested), build.ts plays it with the Subsoil mix.
import type { ModeName } from '@lawn/music';

export type RadioStation = 'blade' | 'fpr' | 'beats';

/**
 * Chord voices.
 * - crunch: power chords on a driven, palm-muted saw guitar (root, fifth, octave only). The Blade.
 * - brass: short, bright brass stabs (big beat). The Blade.
 * - organ: a drawbar organ, held for the comp length. The Blade, Compliance Beats.
 * - rhodes: an electric piano (FM, bell-ish attack). Compliance Beats.
 * - piano: a soft FM piano. Fescue Public, Compliance Beats.
 * - strings: a slow string section (soft attack). Fescue Public.
 * - musicBox: a music box, best arpeggiated (`comp.arp`). Fescue Public.
 * - nylon: a plucked nylon guitar, best arpeggiated. Fescue Public, Compliance Beats.
 */
export type ChordVoice = 'crunch' | 'brass' | 'organ' | 'rhodes' | 'piano' | 'strings' | 'musicBox' | 'nylon';

/** Bass voices: a sine sub, a plucked upright (jazz), a picked electric (rock), a resonant acid saw (big beat). */
export type BassVoice = 'sub' | 'upright' | 'picked' | 'acid';

/** Lead (melody) voices. 'none' leaves the tune out (an instrumental bed). */
export type LeadVoice = 'sax' | 'vibes' | 'flute' | 'bell' | 'guitar' | 'whistle' | 'clarinet' | 'none';

/**
 * Drum kits. break: a hard, compressed funky breakbeat (big beat). rock: a straight rock kit. brush: brushes and a
 * ride (jazz). soft: a shaker, a rim and a felt kick (lullaby). none: no drums.
 */
export type DrumKit = 'break' | 'rock' | 'brush' | 'soft' | 'none';

/** A bed under everything: vinyl crackle, tape hiss, or soft moving air. */
export type Texture = 'vinyl' | 'tape' | 'air' | 'none';

/** One bar's harmony: a scale degree (0 = I .. 6 = VII), or two degrees (the first and second half of the bar). */
export type BarChord = number | readonly [number, number];

/**
 * One bass note per entry: [sixteenth in the bar, which note, length in sixteenths].
 * r = the chord's root, f = its fifth, o = the root an octave up, t = its third, a = a scale step next to the next
 * chord's root (a diatonic approach note).
 */
export type BassStep = readonly [pos: number, kind: 'r' | 'f' | 'o' | 't' | 'a', len: number];

/** Four bars of the song. */
export interface FormPart {
  /** Which progression plays (a key of SongSpec.progressions). */
  s: string;
  /**
   * Energy 0..1 the part heads for. The energy curve is continuous (it eases from the last part's value over the part)
   * and every layer reads it: drums come in around 0.3, the melody from 0.4, the pad fills the quiet parts.
   */
  e: number;
  /** A breakdown: no kick and no bass; the mix opens back up into the next part. */
  brk?: boolean;
  /** The melody plays an octave higher (when it fits the lead's range). */
  up?: boolean;
}

export interface SongSpec {
  title: string;
  artist: string;
  /** Tempo, beats per minute. One tempo per song. */
  bpm: number;
  /** The tonic as a MIDI note, 43..57 (G2..A3): this is the key. The melody sits an octave or two above it. */
  tonic: number;
  /** The scale: ionian (major), dorian, mixolydian, aeolian (natural minor), lydian, harmonic (harmonic minor), phrygian. */
  mode: ModeName;
  /** Beats per bar: 4 (16 sixteenths) or 3 (a waltz, 12 sixteenths). */
  meter: 3 | 4;
  /** 0..0.33: how late the off-beat sixteenths fall (0.33 is a triplet swing). */
  swing: number;
  /**
   * Four-bar chord progressions by name, in scale degrees. Every chord is built from the scale (diatonic), and no chord
   * may be diminished or augmented (checkSpec refuses them).
   */
  progressions: Readonly<Record<string, readonly [BarChord, BarChord, BarChord, BarChord]>>;
  /** The song, four bars per part, 6 to 12 parts. It loops, so the last part's last chord must be the tonic (0). */
  form: readonly FormPart[];
  /** Notes per chord: 3 (triads), 4 (sevenths) or 5 (ninths). */
  chordSize: 3 | 4 | 5;
  chord: ChordVoice;
  /** Chord hits: sixteenth positions in the bar and how long each rings. `arp` walks the chord tones one at a time. */
  comp: { readonly steps: readonly number[]; readonly len: number; readonly arp?: boolean };
  /** A soft sustained pad under the chords (it fills the quiet parts). */
  pad?: boolean;
  bass: BassVoice;
  bassPat: readonly BassStep[];
  lead: LeadVoice;
  /**
   * The melody: note lengths it may use (sixteenths), how often it rests (0..1), and its range in scale degrees above
   * the tonic an octave up (lo -3..hi 12).
   */
  melody: { readonly lens: readonly number[]; readonly rest: number; readonly lo: number; readonly hi: number };
  kit: DrumKit;
  /**
   * Drum grid, one character per sixteenth ('x' hit, 'o' soft hit, '.' rest), each string exactly as long as the bar
   * (16, or 12 in 3/4). k kick, s snare (or brush/rim), h closed hat (or shaker), o open hat (or ride).
   */
  drums: { readonly k?: string; readonly s?: string; readonly h?: string; readonly o?: string };
  texture: Texture;
  /** 0..1: how far the tonal layers dip under each kick (the Subsoil pump). 0 = no pump. */
  pump: number;
  /** Reverb length, seconds. */
  reverb: number;
  /** Echo time for the delay return. */
  echo: '8n' | '8n.' | '4n' | '4n.';
}
