/**
 * Theme: Tricky Big Beat (4/4, 126-134 bpm). An original big-beat / breakbeat track in the spirit of early-2000s
 * snowboard games: a hard, gritty break, a sliding acid bass, brass stabs, vinyl scratches and a chopped "vocal" hook,
 * all synthesized (no samples, no borrowed melodies).
 *
 * It is also an instrument the game plays. Like those games, the music reacts to the run:
 * - opts.air(): while you are in the air the whole mix is muffled (lowpass + a little quieter);
 *   hooks.land(big) slams it back with a crash and a kick, bigger for big airs.
 * - hooks.scratch(): a quick scratch on top (call it when a trick lands or a combo banks).
 * - opts.boost(): the filter opens past normal and a riser hisses underneath.
 * - opts.hype() (0..1, e.g. the combo size): adds layers: stabs from 0.25, 16th hats and the vocal hook from 0.55.
 *
 * Form (8-bar sections, looping): intro (filtered break + scratches) → A (groove) → B (hype: vocal chops, stabs) →
 * breakdown (bass + vocal, riser) → drop (everything) → A → B → ...
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import { BREAKS, chopBar, createKit, withFill, type Slice } from '../drums';
import { createFx, createPanner, createStereoBus } from '../mix';
import { midiToNote, mulberry32 } from '../theory';

export interface TrickyHooks {
  /** Landed: unmuffle at once, with a crash + kick hit (big = a bigger hit). */
  land(big: boolean): void;
  /** A quick vinyl scratch over the beat. */
  scratch(): void;
}

export interface TrickyOptions {
  /** True while the rider is in the air (the mix muffles). */
  air?: () => boolean;
  /** True while boosting (the filter opens wide, a riser hisses). */
  boost?: () => boolean;
  /** 0..1: how hot the run is (combo size); adds layers. */
  hype?: () => number;
  /** Filled by the builder: call these from the game. They do nothing until the music has loaded. */
  hooks?: Partial<TrickyHooks>;
  /** Start playback at this offset in seconds (for live broadcast sync). */
  offsetSeconds?: number;
}

type Section = 'intro' | 'A' | 'B' | 'down' | 'drop';
const FORM: Section[] = ['intro', 'A', 'B', 'down', 'drop', 'A', 'B', 'drop'];
const LOOP_FROM = 1; // after the first pass the intro is skipped
const SECTION_BARS = 8;

/** Acid bass riffs: [step, semitone offset from the root, accent, slide-into]. */
const ACID: [number, number, 0 | 1, 0 | 1][][] = [
  [[0, 0, 1, 0], [3, 0, 0, 0], [6, 12, 1, 1], [8, 0, 0, 0], [10, 3, 0, 1], [11, 5, 1, 1], [14, 7, 0, 0]],
  [[0, 0, 1, 0], [2, 0, 0, 0], [4, 10, 0, 1], [6, 12, 1, 0], [9, 0, 0, 0], [12, 3, 1, 1], [14, 0, 0, 1]],
  [[0, 0, 1, 0], [4, 0, 0, 0], [7, 7, 1, 1], [8, 5, 0, 1], [10, 3, 0, 1], [12, 0, 1, 0], [15, 10, 0, 1]],
];

/** Stab chords (semitones from the root, minor): i, VI, VII, i over 2 bars each. */
const STAB_PROG: number[][] = [[0, 3, 7, 10], [-4, 0, 3, 7], [-2, 2, 5, 9], [0, 3, 7, 12]];
const STAB_RHYTHMS: number[][] = [[0, 3, 6], [2, 6, 10], [0, 6, 11, 14]];

/** Vocal syllables: [step, vowel, semitone above the root an octave up, length in 16ths]. */
type Vowel = 'a' | 'e' | 'o' | 'u';
const VOWELS: Record<Vowel, [number, number, number]> = { a: [800, 1150, 2900], e: [450, 2000, 2650], o: [480, 820, 2500], u: [350, 700, 2400] };
const HOOKS: [number, Vowel, number, number][][] = [
  [[0, 'e', 7, 2], [2, 'a', 3, 3], [8, 'u', 0, 1], [10, 'u', 0, 1], [12, 'o', 5, 4]], // "yeah-ah ... uh uh, go"
  [[0, 'o', 0, 1], [1, 'o', 0, 1], [4, 'e', 7, 4], [12, 'a', 10, 2], [14, 'a', 7, 2]],
];

export function buildTrickyTrack(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, opts: TrickyOptions = {}): void {
  const rnd = mulberry32(seed);
  const pick = <V>(xs: readonly V[]): V => xs[Math.floor(rnd() * xs.length)];
  const transport = T.getTransport();
  transport.bpm.value = 126 + Math.floor(rnd() * 9);
  const root = pick([28, 29, 31, 33]); // E1, F1, G1, A1: the bass root
  const step16 = T.Time('16n').toSeconds();

  // ----- the master chain the game plays: song → (air muffle / boost) lowpass → out
  const muffle = keep(new T.Filter({ frequency: 18000, type: 'lowpass', rolloff: -24, Q: 0.7 })).connect(out);
  const song = keep(new T.Gain(1)).connect(muffle);
  const fx = createFx(T, keep, song, { reverbDecay: 1.8, reverbHp: 380, snareSend: 0.12, echoFeedback: 0.3, echoLp: 4200, delayDry: 0.5, delayRevSend: 0.3 });

  // ----- drums: a hard break, gritty and squashed, plus a punch layer and a clap
  const drumBus = keep(new T.Gain(1)).connect(song);
  const kit = createKit(T, keep, drumBus, fx, { grit: 0.38, snarePitch: pick(['D3', 'E3']), snareLp: 6200, hatHp: 7200, hatVolume: -12, swing: 0.08 });
  const punch = keep(new T.MembraneSynth({ pitchDecay: 0.05, octaves: 4, envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.05 } })).connect(drumBus);
  punch.volume.value = -4;
  const clapHp = keep(new T.Filter(1100, 'highpass')).fan(drumBus, fx.snareSend);
  const clap = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.05 } })).connect(clapHp);
  clap.volume.value = -11;
  const crashHp = keep(new T.Filter(3500, 'highpass')).fan(song, fx.rev);
  const crash = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 1.4, sustain: 0, release: 0.4 } })).connect(crashHp);
  crash.volume.value = -14;
  // The game's landing slam has its own kick and crash (see the scratch note below).
  const slamKick = keep(new T.MembraneSynth({ pitchDecay: 0.05, octaves: 5, envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.05 } })).connect(drumBus);
  slamKick.volume.value = -3;
  const slamCrash = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 1.4, sustain: 0, release: 0.4 } })).connect(crashHp);
  slamCrash.volume.value = -14;
  let slamBusy = 0;

  // ----- everything tonal ducks under the kick
  const duck = keep(new T.Gain(1)).connect(song);

  // Acid bass: resonant saw with an accent-driven filter envelope and slides (portamento on slid notes).
  const acidDrive = keep(new T.Distortion(0.25)).connect(duck);
  const acid = keep(new T.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.003, decay: 0.18, sustain: 0.35, release: 0.06 },
    filter: { Q: 9, type: 'lowpass', rolloff: -24 },
    filterEnvelope: { attack: 0.003, decay: 0.16, sustain: 0.15, release: 0.1, baseFrequency: 180, octaves: 3.4 },
  })).connect(acidDrive);
  acid.volume.value = -13;
  const sub = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.12, sustain: 0.8, release: 0.08 } })).connect(duck);
  sub.volume.value = -9;

  // Brass stabs: bright fat saws, short, high-passed out of the bass's way, a touch of echo.
  const stabPan = createPanner(T, keep, 0.15, duck);
  const stabDelay = keep(new T.Gain(0.18)).connect(fx.delay);
  const stabLp = keep(new T.Filter(5200, 'lowpass')).fan(stabPan, stabDelay);
  const stabHp = keep(new T.Filter(260, 'highpass')).connect(stabLp);
  const stab = keep(new T.PolySynth(T.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 18 }, envelope: { attack: 0.004, decay: 0.16, sustain: 0.05, release: 0.12 } })).connect(stabHp);
  stab.volume.value = -14;

  // Vocal chops: a saw through three formant bandpasses (vowels), wide and a little echoed.
  const vox = keep(new T.Gain(1));
  const voxBus = createStereoBus(T, keep, duck, { width: 0.4, chorusFreq: 1.4, chorusDepth: 0.3, chorusWet: 0.25 });
  const voxEcho = keep(new T.Gain(0.22)).connect(fx.delay);
  const voxHp = keep(new T.Filter(220, 'highpass')).fan(voxBus, voxEcho);
  vox.connect(voxHp);
  const formants = [0, 1, 2].map((i) => keep(new T.Filter({ frequency: VOWELS.a[i], type: 'bandpass', Q: [7, 9, 11][i] })).connect(vox));
  const voxSrc = keep(new T.MonoSynth({ oscillator: { type: 'sawtooth' }, portamento: 0.04, envelope: { attack: 0.01, decay: 0.1, sustain: 0.85, release: 0.08 }, filterEnvelope: { baseFrequency: 6000, octaves: 0 } }));
  for (const f of formants) voxSrc.connect(f);
  voxSrc.volume.value = -2;
  const setVowel = (v: Vowel, time: number): void => {
    formants.forEach((f, i) => f.frequency.setValueAtTime(VOWELS[v][i], time));
  };

  // Scratches: a vinyl "wikka": bandpassed noise and a saw, both swept up and down fast. Two voices: one the sequencer
  // plays, one the game's hooks play (a voice must never get a start time earlier than one already scheduled, and the
  // sequencer schedules ahead).
  const makeScratch = (): ((time: number, strokes: number) => void) => {
    const bp = keep(new T.Filter({ frequency: 1200, type: 'bandpass', Q: 2.5 })).connect(song);
    const noise = keep(new T.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.005, decay: 0.05, sustain: 1, release: 0.03 } })).connect(bp);
    noise.volume.value = -10;
    const saw = keep(new T.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.005, decay: 0.05, sustain: 1, release: 0.03 } })).connect(bp);
    saw.volume.value = -20;
    let busyUntil = 0;
    return (time, strokes) => {
      const t = Math.max(time, busyUntil + 0.01);
      const len = strokes * step16 * 0.5;
      busyUntil = t + len;
      noise.triggerAttackRelease(len, t, 0.9);
      saw.triggerAttackRelease(220, len, t, 0.6);
      for (let i = 0; i < strokes; i++) {
        const t0 = t + i * step16 * 0.5;
        const up = i % 2 === 0;
        bp.frequency.setValueAtTime(up ? 500 : 3200, t0);
        bp.frequency.exponentialRampToValueAtTime(up ? 3200 : 500, t0 + step16 * 0.45);
        saw.frequency.setValueAtTime(up ? 140 : 520, t0);
        saw.frequency.exponentialRampToValueAtTime(up ? 520 : 140, t0 + step16 * 0.45);
      }
    };
  };
  const scratchAt = makeScratch();
  const hookScratch = makeScratch();

  // Riser for boost and breakdowns: filtered noise that opens up.
  const riserBp = keep(new T.Filter({ frequency: 600, type: 'bandpass', Q: 1.2 })).fan(song, fx.rev);
  const riser = keep(new T.Noise('white'));
  const riserGain = keep(new T.Gain(0)).connect(riserBp);
  riser.connect(riserGain);
  riser.start();

  // ----- material for this seed
  const breakIdx = pick([1, 2, 3]); // Think, Funky Drummer, Apache: the funkier breaks
  const brk = BREAKS[breakIdx].steps;
  const alt = BREAKS[(breakIdx % 3) + 1].steps;
  const drumsA: Slice[][] = [chopBar(rnd, brk, 0, 0.1), chopBar(rnd, brk, 1, 0.15), chopBar(rnd, brk, 0, 0.1), chopBar(rnd, brk, 1, 0.25)];
  const drumsB: Slice[][] = [chopBar(rnd, alt, 0, 0.3), chopBar(rnd, alt, 1, 0.35), chopBar(rnd, brk, 0, 0.3), chopBar(rnd, alt, 1, 0.45)];
  const fill = withFill(drumsA[3], 12);
  const acidRiff = pick(ACID);
  const acidRiffB = pick(ACID);
  const stabRhythm = pick(STAB_RHYTHMS);
  const hook = pick(HOOKS);
  console.info(`[music] tricky big beat in ${midiToNote(root)} minor, ${Math.round(transport.bpm.value)} bpm, break ${BREAKS[breakIdx].name}`);

  // ----- the game's hooks
  let slamUntil = 0;
  if (opts.hooks) {
    opts.hooks.land = (big: boolean) => {
      const t = T.now() + 0.01;
      muffle.frequency.cancelScheduledValues(t);
      muffle.frequency.setValueAtTime(18000, t);
      song.gain.cancelScheduledValues(t);
      song.gain.setValueAtTime(1, t);
      slamUntil = t + 0.3;
      if (t < slamBusy) return; // one slam at a time
      slamBusy = t + 0.25;
      slamKick.triggerAttackRelease('C1', '8n', t, big ? 1 : 0.7);
      slamCrash.triggerAttackRelease(big ? 1.6 : 0.8, t, big ? 0.9 : 0.5);
    };
    opts.hooks.scratch = () => hookScratch(T.now() + 0.02, 3 + Math.floor(Math.random() * 3));
  }

  // ----- the sequencer
  let step = opts.offsetSeconds ? Math.max(0, Math.floor(opts.offsetSeconds / step16)) : 0;
  let pattern: Slice[] = drumsA[0];
  let wasAir = false;
  const loop = keep(new T.Loop((time) => {
    const bar = Math.floor(step / 16);
    const pos = step % 16;
    step++;
    const sIdx = Math.floor(bar / SECTION_BARS);
    const sec: Section = FORM[sIdx < FORM.length ? sIdx : LOOP_FROM + ((sIdx - LOOP_FROM) % (FORM.length - LOOP_FROM))];
    const sb = bar % SECTION_BARS;
    const hype = Math.max(0, Math.min(1, opts.hype?.() ?? 0));
    const air = opts.air?.() ?? false;
    const boost = opts.boost?.() ?? false;

    // Air muffle / boost: driven every 16th (slams back instantly through hooks.land).
    if (time > slamUntil) {
      const want = air ? 700 : boost ? 20000 : 16000;
      if (air !== wasAir || pos % 4 === 0) muffle.frequency.rampTo(want, air ? 0.18 : 0.08, time);
      song.gain.rampTo(air ? 0.78 : 1, 0.15, time);
    }
    wasAir = air;
    riserGain.gain.rampTo(boost ? 0.07 : sec === 'down' && sb >= 4 ? 0.02 + 0.015 * (sb - 4) : 0, 0.2, time);
    riserBp.frequency.rampTo(boost ? 3500 : sec === 'down' ? 800 + 500 * sb : 600, 0.3, time);

    // Drums.
    if (pos === 0) {
      if (sec === 'down') pattern = sb < 6 ? [] : drumsA[sb % 2].map((s) => (s.h ? { h: 1 as const } : {}));
      else if (sb === SECTION_BARS - 1) pattern = fill;
      else if (sec === 'B' || sec === 'drop') pattern = drumsB[sb % 4];
      else pattern = drumsA[sb % 4];
    }
    let sl: Slice | undefined = pattern[pos];
    if (sl && hype > 0.55 && sec !== 'down' && !sl.h && !sl.o) sl = { ...sl, h: 1 }; // hot: 16th hats
    const introFiltered = sec === 'intro' && sb < 4;
    if (sl && kit.hit(sl, time, pos, introFiltered ? 0.6 : 1)) {
      duck.gain.setValueAtTime(0.45, time);
      duck.gain.linearRampToValueAtTime(1, time + 0.16);
      if (pos === 0 && sec !== 'intro') punch.triggerAttackRelease('C1', '8n', time, 0.8);
    }
    if ((pos === 4 || pos === 12) && sec !== 'intro' && sec !== 'down') clap.triggerAttackRelease('16n', time, 0.7);
    if (pos === 0 && sb === 0 && sec !== 'intro') crash.triggerAttackRelease(1.2, time, 0.6);
    // Dub throw on the last snare of every 4th bar.
    fx.throwSend.gain.setValueAtTime(pos === 12 && sb % 4 === 3 ? 0.3 : 0, time);

    // Chord of the moment (2 bars each).
    const ci = Math.floor(sb / 2) % 4;
    const chord = STAB_PROG[ci];
    const chordRoot = root + chord[0];

    // Acid bass: from A on; the breakdown holds long roots.
    if (sec !== 'intro' || sb >= 4) {
      if (sec === 'down') {
        if (pos === 0 && sb % 2 === 0) {
          acid.triggerAttackRelease(midiToNote(chordRoot + 12), 30 * step16, time, 0.5);
          sub.triggerAttackRelease(midiToNote(chordRoot), 30 * step16, time, 0.8);
        }
      } else {
        for (const [at, semi, accent, slide] of sec === 'B' ? acidRiffB : acidRiff) {
          if (at !== pos) continue;
          acid.portamento = slide ? 0.06 : 0;
          acid.triggerAttackRelease(midiToNote(chordRoot + 12 + semi), step16 * (slide ? 1.6 : 0.9), time, accent ? 1 : 0.6);
          if (semi === 0) sub.triggerAttackRelease(midiToNote(chordRoot), step16 * 1.8, time, 0.9);
        }
      }
    }

    // Stabs: B and the drop always; A when the run is warm.
    const stabsOn = sec === 'B' || sec === 'drop' || (sec === 'A' && hype > 0.25);
    if (stabsOn && stabRhythm.includes(pos)) {
      stab.triggerAttackRelease(chord.map((s) => midiToNote(root + 36 + s)), '16n', time, 0.75);
    }

    // Vocal hook: B, breakdown and drop, or anywhere when the run is hot; every other bar.
    const hookOn = sec === 'B' || sec === 'down' || sec === 'drop' || hype > 0.55;
    if (hookOn && sb % 2 === 0) {
      for (const [at, v, semi, len] of hook) {
        if (at !== pos) continue;
        setVowel(v, time);
        voxSrc.triggerAttackRelease(midiToNote(root + 36 + chord[0] + semi), step16 * len * 0.9, time, 0.8);
      }
    }

    // Scratches: the intro's lead, and a cut at the end of every other bar in A and the drop.
    if (sec === 'intro' && pos === 8 && sb % 2 === 1) scratchAt(time, 4);
    if ((sec === 'A' || sec === 'drop') && sb % 2 === 1 && pos === 14) scratchAt(time, 2);
  }, '16n'));
  loop.start(0);
}
