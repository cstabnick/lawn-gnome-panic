/**
 * Theme: The Front (4/4, 108-120 bpm). The score of Gnome Front: a toy drum corps playing a war that is
 * mostly about five lawn landmarks and a very large harvester.
 *
 * Motifs (all in one key, so they stack and trade places):
 * - THE CALL: a dotted bugle call (root, root, fifth, sixth, fifth, third...) on two horns. It is the Front itself
 *   and opens every verse. Its third decides the colour of the verse, see the factions below.
 * - THE STOMP (Red Caps): low, square, 8th-note stomping on horns and tuba, answered by the snare. Dorian.
 * - THE QUICKSTEP (Blue Caps): a skipping dotted fife tune up high with an oompah under it. Mixolydian.
 *   The two factions share the root, so the changeover between them is a single note (the third).
 * - THE PUSH: a rising sequence over a snare roll, the last four bars before a verse returns when the fight is hot.
 * - THE COMBINE: a slow, heavy tuba lumber on every beat with two braying horn notes falling a step. It replaces the
 *   march while a combine is near.
 *
 * Form (loops, the intro is played once): reveille (4 bars, fife and a tattoo) -> CALL (8) -> FACTION tune (8) ->
 * [PUSH (4) if the fight is hot] -> CALL ...
 *
 * It plays the match (all inputs optional, and a song built with none of them is a calm march):
 * - opts.lead(): the team holding more flags (0 Red Caps, 1 Blue Caps, null even). Picks whose tune the faction
 *   verse plays and the mode of the next verse, at the verse boundary.
 * - opts.intensity() 0..1: fight heat. Adds the fife counter-line (> 0.3), then busier snare, four-on-the-floor
 *   bass drum and offbeat brass (> 0.6), and the push before a verse.
 * - opts.combine(): a combine is near.
 * - opts.hooks.flag(mine): a flag changed hands: a bright bell and horn call if it is ours, a falling one if not.
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import { createFrenchHorn } from '../instruments';
import { createFx, createPanner } from '../mix';
import { MODES, chordTones, degreeToMidi, humanize, mulberry32, ornamentMotif, transposeMotif, voiceLead, type ModeName, type MotifNote } from '../theory';

export interface GnomeFrontHooks {
  /** A flag changed hands. mine = our team took it (a bright call), otherwise it was taken from us (a falling one). */
  flag(mine: boolean): void;
}

export interface GnomeFrontOptions {
  /** The team holding more flags: 0 Red Caps, 1 Blue Caps, null when even. */
  lead?: () => 0 | 1 | null;
  /** 0..1 fight heat. */
  intensity?: () => number;
  /** True while a combine is close. */
  combine?: () => boolean;
  /** Filled by the builder: call from the game. They do nothing until the music has loaded. */
  hooks?: Partial<GnomeFrontHooks>;
  /** The menu arrangement: bright major modes, a faster and bouncier step, a glockenspiel on the tune. */
  menu?: boolean;
}

type Section = 'reveille' | 'call' | 'faction' | 'push';
const SECTION_BARS: Record<Section, number> = { reveille: 4, call: 8, faction: 8, push: 4 };

/** Red Caps march in dorian, Blue Caps in mixolydian: same root, the third moves. */
export const FACTION_MODE: [ModeName, ModeName] = ['dorian', 'mixolydian'];
/** The menu plays both verses in bright major modes. */
const MENU_MODE: [ModeName, ModeName] = ['ionian', 'mixolydian'];

/** One chord (scale degree) per bar. Degree 5 (a diminished chord in dorian) is never used. */
const PROG: Record<Exclude<Section, 'reveille'>, number[]> = {
  call: [0, 6, 3, 0, 0, 6, 4, 0],
  faction: [0, 3, 0, 6, 0, 3, 4, 0],
  push: [3, 6, 4, 4],
};

/** THE CALL, 4 bars (the second two answer the first two). [bar, step, degree, length in 16ths, velocity] */
export const CALL: MotifNote[] = [
  { bar: 0, step: 0, deg: 0, len: 3, vel: 0.9 }, { bar: 0, step: 3, deg: 0, len: 1, vel: 0.7 }, { bar: 0, step: 4, deg: 4, len: 4, vel: 0.9 },
  { bar: 0, step: 8, deg: 5, len: 3, vel: 0.85 }, { bar: 0, step: 11, deg: 4, len: 1, vel: 0.7 }, { bar: 0, step: 12, deg: 2, len: 4, vel: 0.8 },
  { bar: 1, step: 0, deg: 3, len: 3, vel: 0.85 }, { bar: 1, step: 3, deg: 3, len: 1, vel: 0.7 }, { bar: 1, step: 4, deg: 2, len: 4, vel: 0.8 },
  { bar: 1, step: 8, deg: 1, len: 4, vel: 0.8 }, { bar: 1, step: 12, deg: 0, len: 4, vel: 0.85 },
  { bar: 2, step: 0, deg: 0, len: 3, vel: 0.9 }, { bar: 2, step: 3, deg: 0, len: 1, vel: 0.7 }, { bar: 2, step: 4, deg: 4, len: 4, vel: 0.9 },
  { bar: 2, step: 8, deg: 7, len: 3, vel: 0.95 }, { bar: 2, step: 11, deg: 6, len: 1, vel: 0.7 }, { bar: 2, step: 12, deg: 5, len: 4, vel: 0.85 },
  { bar: 3, step: 0, deg: 4, len: 4, vel: 0.85 }, { bar: 3, step: 4, deg: 2, len: 4, vel: 0.8 },
  { bar: 3, step: 8, deg: 1, len: 2, vel: 0.75 }, { bar: 3, step: 10, deg: 0, len: 6, vel: 0.9 },
];

/** THE STOMP (Red Caps), 4 bars, low brass. */
export const STOMP: MotifNote[] = [
  { bar: 0, step: 0, deg: 0, len: 2, vel: 0.95 }, { bar: 0, step: 3, deg: 0, len: 1, vel: 0.6 }, { bar: 0, step: 4, deg: 0, len: 2, vel: 0.8 },
  { bar: 0, step: 6, deg: 2, len: 2, vel: 0.8 }, { bar: 0, step: 8, deg: 0, len: 2, vel: 0.9 }, { bar: 0, step: 10, deg: 0, len: 2, vel: 0.75 },
  { bar: 0, step: 12, deg: 4, len: 2, vel: 0.9 }, { bar: 0, step: 14, deg: 3, len: 2, vel: 0.8 },
  { bar: 1, step: 0, deg: 3, len: 2, vel: 0.95 }, { bar: 1, step: 3, deg: 3, len: 1, vel: 0.6 }, { bar: 1, step: 4, deg: 3, len: 2, vel: 0.8 },
  { bar: 1, step: 6, deg: 4, len: 2, vel: 0.8 }, { bar: 1, step: 8, deg: 2, len: 2, vel: 0.9 }, { bar: 1, step: 10, deg: 1, len: 2, vel: 0.75 },
  { bar: 1, step: 12, deg: 0, len: 4, vel: 0.9 },
  { bar: 2, step: 0, deg: 0, len: 2, vel: 0.95 }, { bar: 2, step: 3, deg: 0, len: 1, vel: 0.6 }, { bar: 2, step: 4, deg: 0, len: 2, vel: 0.8 },
  { bar: 2, step: 6, deg: 2, len: 2, vel: 0.8 }, { bar: 2, step: 8, deg: 4, len: 2, vel: 0.9 }, { bar: 2, step: 10, deg: 4, len: 2, vel: 0.75 },
  { bar: 2, step: 12, deg: 5, len: 2, vel: 0.9 }, { bar: 2, step: 14, deg: 4, len: 2, vel: 0.8 },
  { bar: 3, step: 0, deg: 4, len: 2, vel: 0.9 }, { bar: 3, step: 2, deg: 3, len: 2, vel: 0.8 }, { bar: 3, step: 4, deg: 2, len: 2, vel: 0.8 },
  { bar: 3, step: 6, deg: 1, len: 2, vel: 0.75 }, { bar: 3, step: 8, deg: 0, len: 8, vel: 0.95 },
];

/** THE QUICKSTEP (Blue Caps), 4 bars, a fife tune (degrees are above the fife's base note). */
export const QUICKSTEP: MotifNote[] = [
  { bar: 0, step: 0, deg: 7, len: 3, vel: 0.9 }, { bar: 0, step: 3, deg: 8, len: 1, vel: 0.65 }, { bar: 0, step: 4, deg: 9, len: 3, vel: 0.9 },
  { bar: 0, step: 7, deg: 8, len: 1, vel: 0.65 }, { bar: 0, step: 8, deg: 7, len: 2, vel: 0.8 }, { bar: 0, step: 10, deg: 6, len: 2, vel: 0.75 },
  { bar: 0, step: 12, deg: 4, len: 4, vel: 0.85 },
  { bar: 1, step: 0, deg: 5, len: 3, vel: 0.85 }, { bar: 1, step: 3, deg: 6, len: 1, vel: 0.65 }, { bar: 1, step: 4, deg: 7, len: 3, vel: 0.9 },
  { bar: 1, step: 7, deg: 6, len: 1, vel: 0.65 }, { bar: 1, step: 8, deg: 5, len: 2, vel: 0.8 }, { bar: 1, step: 10, deg: 4, len: 2, vel: 0.75 },
  { bar: 1, step: 12, deg: 2, len: 4, vel: 0.85 },
  { bar: 2, step: 0, deg: 7, len: 3, vel: 0.9 }, { bar: 2, step: 3, deg: 8, len: 1, vel: 0.65 }, { bar: 2, step: 4, deg: 9, len: 3, vel: 0.9 },
  { bar: 2, step: 7, deg: 8, len: 1, vel: 0.65 }, { bar: 2, step: 8, deg: 9, len: 2, vel: 0.85 }, { bar: 2, step: 10, deg: 11, len: 2, vel: 0.85 },
  { bar: 2, step: 12, deg: 9, len: 4, vel: 0.9 },
  { bar: 3, step: 0, deg: 8, len: 4, vel: 0.85 }, { bar: 3, step: 4, deg: 7, len: 2, vel: 0.8 }, { bar: 3, step: 6, deg: 6, len: 2, vel: 0.75 },
  { bar: 3, step: 8, deg: 4, len: 4, vel: 0.8 }, { bar: 3, step: 12, deg: 7, len: 4, vel: 0.95 },
];

/** Snare patterns: [step, velocity], light to busy. */
const SNARE_LIGHT: [number, number][] = [[4, 0.7], [12, 0.7], [10, 0.25], [14, 0.25]];
const SNARE_MID: [number, number][] = [[0, 0.45], [2, 0.28], [4, 0.85], [6, 0.28], [8, 0.45], [10, 0.28], [12, 0.85], [14, 0.32], [15, 0.28]];
const SNARE_BUSY: [number, number][] = Array.from({ length: 16 }, (_, s) => [s, s === 4 || s === 12 ? 0.95 : s % 4 === 0 ? 0.75 : s % 2 === 0 ? 0.42 : 0.26] as [number, number]);

export function indexMotif(notes: readonly MotifNote[]): Map<number, MotifNote[]> {
  const m = new Map<number, MotifNote[]>();
  for (const n of notes) {
    const key = n.bar * 16 + n.step;
    const list = m.get(key) ?? [];
    list.push(n);
    m.set(key, list);
  }
  return m;
}

export function buildGnomeFrontTrack(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, opts: GnomeFrontOptions = {}): void {
  const rnd = mulberry32(seed);
  const pick = <V>(xs: readonly V[]): V => xs[Math.floor(rnd() * xs.length)];
  const transport = T.getTransport();
  const menu = opts.menu === true;
  const modes = menu ? MENU_MODE : FACTION_MODE;
  const bpm = (menu ? 122 : 108) + Math.floor(rnd() * 11);
  transport.bpm.value = bpm;
  const step16 = T.Time('16n').toSeconds();
  const hold = (steps: number): number => steps * step16 * 0.9;
  const root = pick([50, 52, 53, 55]); // D3, E3, F3, G3

  const fx = createFx(T, keep, out, { reverbDecay: 2.4, reverbHp: 300, snareSend: 0.1, echoTime: '8n.', echoFeedback: 0.22, echoLp: 3000 });
  const send = (amount: number, dest: ToneNS.ToneAudioNode): ToneNS.Gain => keep(new T.Gain(amount)).connect(dest);

  // ----- the drum corps
  const bassDrum = keep(new T.MembraneSynth({ pitchDecay: 0.045, octaves: 3, envelope: { attack: 0.001, decay: 0.38, sustain: 0, release: 0.08 } })).connect(out);
  bassDrum.volume.value = -7;
  const snareRev = send(0.16, fx.rev);
  const snareHp = keep(new T.Filter(1500, 'highpass')).fan(out, snareRev);
  const snareWires = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.085, sustain: 0, release: 0.02 } })).connect(snareHp);
  snareWires.volume.value = -17;
  const snareSkin = keep(new T.MembraneSynth({ pitchDecay: 0.008, octaves: 2, envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.02 } })).connect(out);
  snareSkin.volume.value = -19;
  const crashHp = keep(new T.Filter(4500, 'highpass')).fan(out, send(0.4, fx.rev));
  const crash = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 1.5, sustain: 0, release: 0.5 } })).connect(crashHp);
  crash.volume.value = -22;

  // The flam's grace note has voices of its own: a one-note voice cannot be retriggered a few ms after it started.
  const graceWires = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 } })).connect(snareHp);
  graceWires.volume.value = -21;
  const graceSkin = keep(new T.MembraneSynth({ pitchDecay: 0.008, octaves: 2, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 } })).connect(out);
  graceSkin.volume.value = -23;
  const snare = (time: number, vel: number): void => {
    snareWires.triggerAttackRelease(0.05, time, vel);
    snareSkin.triggerAttackRelease('A3', 0.05, time, vel * 0.7);
  };
  const flam = (time: number, vel: number): void => {
    graceWires.triggerAttackRelease(0.03, time - 0.03, vel * 0.5);
    graceSkin.triggerAttackRelease('A3', 0.03, time - 0.03, vel * 0.3);
    snare(time, vel);
  };
  const kickDrum = (time: number, vel: number): void => { bassDrum.triggerAttackRelease('D1', '8n', time, vel); };

  // ----- the brass and the tuba
  const hornLead = createFrenchHorn(T, keep, out, fx, { volumeDb: -9, revSend: 0.5, brightness: 2000, attack: 0.03 });
  const hornHarm = createFrenchHorn(T, keep, out, fx, { volumeDb: -13, revSend: 0.55, brightness: 1600, attack: 0.04 });
  const tubaLp = keep(new T.Filter({ frequency: 560, type: 'lowpass', rolloff: -12 })).connect(out);
  const tuba = keep(new T.MonoSynth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.012, decay: 0.2, sustain: 0.55, release: 0.12 },
    filter: { Q: 1.2, type: 'lowpass', rolloff: -12 },
    filterEnvelope: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.15, baseFrequency: 160, octaves: 1.8 },
  })).connect(tubaLp);
  tuba.volume.value = -9;
  // The "pah" of the oompah: short offbeat brass chords.
  const pahLp = keep(new T.Filter({ frequency: 1700, type: 'lowpass', rolloff: -12 })).fan(out, send(0.3, fx.rev));
  const pahHp = keep(new T.Filter(260, 'highpass')).connect(pahLp);
  const pah = keep(new T.PolySynth(T.Synth, { oscillator: { type: 'fatsawtooth', count: 2, spread: 14 }, envelope: { attack: 0.006, decay: 0.12, sustain: 0.08, release: 0.1 } })).connect(pahHp);
  pah.volume.value = -21;

  // ----- the fife: a thin square through a band, with a touch of vibrato, and a little breath
  const fifePan = createPanner(T, keep, 0.25, out);
  const fifeLp = keep(new T.Filter({ frequency: 3600, type: 'lowpass', rolloff: -12 })).fan(fifePan, send(0.35, fx.rev), send(0.2, fx.delay));
  const fifeHp = keep(new T.Filter(650, 'highpass')).connect(fifeLp);
  const fifeVib = keep(new T.Vibrato({ frequency: 5.2, depth: 0.05 })).connect(fifeHp);
  const fife = keep(new T.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.02, decay: 0.08, sustain: 0.7, release: 0.06 } })).connect(fifeVib);
  fife.volume.value = -22;
  const fifeNote = (midi: number, steps: number, time: number, vel: number): void => {
    fife.triggerAttackRelease(T.Frequency(midi, 'midi').toFrequency(), Math.max(0.06, hold(steps)), time, vel);
  };

  // ----- stingers: voices of their own (a voice must never get a start time earlier than one already scheduled,
  // and the sequencer schedules ahead)
  const bell = keep(new T.PolySynth(T.FMSynth, { harmonicity: 3.01, modulationIndex: 1.6, envelope: { attack: 0.002, decay: 0.9, sustain: 0, release: 0.5 }, modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.2 } })).fan(out, send(0.4, fx.rev));
  bell.volume.value = -15;
  const callHorn = createFrenchHorn(T, keep, out, fx, { volumeDb: -13, revSend: 0.5, brightness: 2100, attack: 0.02 });
  const callHornHi = createFrenchHorn(T, keep, out, fx, { volumeDb: -16, revSend: 0.5, brightness: 1900, attack: 0.02 });

  // ----- the state of the song
  const callMap = indexMotif(CALL);
  const callHarmMap = indexMotif(ornamentMotif(transposeMotif(CALL, 7, 0.7), rnd, 16));
  const stompMap = indexMotif(STOMP);
  const stepMap = indexMotif(QUICKSTEP);
  let faction: 0 | 1 = rnd() < 0.5 ? 0 : 1;
  let modeName: ModeName = modes[faction];
  let mode: readonly number[] = MODES[modeName];
  let chords: number[][] = [];
  let section: Section = 'reveille';
  let sectionBar = 0;
  let globalBar = 0;
  let heat = 0;

  const voiceProg = (degs: number[]): number[][] => {
    let prev: number[] | null = null;
    return degs.map((d) => (prev = voiceLead(chordTones(mode, d, 3), 14, prev)));
  };
  const beginSection = (s: Section): void => {
    section = s;
    sectionBar = 0;
    const lead = opts.lead?.();
    if (lead === 0 || lead === 1) faction = lead;
    modeName = modes[faction];
    mode = MODES[modeName];
    chords = voiceProg(s === 'reveille' ? PROG.call.slice(0, 4) : PROG[s]);
  };
  beginSection('reveille');

  if (opts.hooks) {
    opts.hooks.flag = (mine: boolean): void => {
      try {
        const t = T.now() + 0.06;
        const at = (deg: number, oct: number): number => degreeToMidi(root + oct, mode, deg);
        if (mine) {
          [0, 2, 4, 7].forEach((d, i) => bell.triggerAttackRelease(T.Frequency(at(d, 24), 'midi').toFrequency(), 0.5, t + i * 0.1, 0.7));
          callHorn.play(at(0, 12), 0.2, t, 0.8);
          callHorn.play(at(4, 12), 0.5, t + 0.2, 0.9);
          callHornHi.play(at(7, 12), 0.5, t + 0.2, 0.7);
        } else {
          [4, 2, 1, 0].forEach((d, i) => bell.triggerAttackRelease(T.Frequency(at(d, 12), 'midi').toFrequency(), 0.6, t + i * 0.13, 0.5));
          callHorn.play(at(4, 0), 0.25, t, 0.7);
          callHorn.play(at(0, 0), 0.7, t + 0.26, 0.8);
        }
      } catch {
        // Music must never break the game.
      }
    };
  }

  console.info(`[music] The Front in ${root} ${modeName}, ${bpm} bpm`);

  let step = 0;
  const loop = keep(new T.Loop((time) => {
    const pos = step % 16;
    const vel = humanize(step, 0.1);
    step++;

    if (pos === 0) {
      // Leaving a section: the next one is decided by the match.
      if (sectionBar >= SECTION_BARS[section]) {
        const hot = !menu && (opts.intensity?.() ?? 0) > 0.55;
        let next: Section;
        if (section === 'reveille' || section === 'push') next = 'call';
        else if (section === 'call') next = 'faction';
        else next = hot ? 'push' : 'call';
        beginSection(next);
        if (section === 'call' && globalBar > 0) crash.triggerAttackRelease(1.5, time, 0.7);
      }
      const target = menu ? 0.45 : Math.min(1, Math.max(0, opts.intensity?.() ?? 0));
      heat += (target - heat) * 0.6; // one bar of smoothing
    }
    const combine = !menu && (opts.combine?.() ?? false);
    const barLeft = SECTION_BARS[section] - sectionBar;
    const lastBar = barLeft === 1;
    const chordIdx = Math.min(sectionBar, chords.length - 1);
    const chord = chords[chordIdx].map((n) => root + n);
    const chordDeg = (section === 'reveille' ? PROG.call : PROG[section])[chordIdx];
    const bassMidi = root - 12 + mode[chordDeg % 7] + (chordDeg >= 7 ? 12 : 0);
    const fifth = bassMidi + 7;

    // ----- the lumber of THE COMBINE replaces the march
    if (combine && section !== 'reveille') {
      if (pos % 4 === 0) {
        tuba.triggerAttackRelease(T.Frequency(pos === 8 ? fifth : bassMidi, 'midi').toFrequency(), hold(3), time, 0.95 * vel);
        kickDrum(time, pos === 0 ? 1 : 0.8);
      }
      if (pos === 6 || pos === 14) pah.triggerAttackRelease(chord.slice(0, 3).map((n) => T.Frequency(n, 'midi').toFrequency()), hold(2), time, 0.7);
      // "Mind THE COMBINE": two braying notes, a step apart, falling.
      if (sectionBar % 2 === 0) {
        if (pos === 0) hornLead.play(degreeToMidi(root, mode, 1), hold(6), time, 0.9);
        if (pos === 8) hornLead.play(degreeToMidi(root, mode, 0), hold(8), time, 0.95);
        if (pos === 0 || pos === 8) hornHarm.play(degreeToMidi(root - 12, mode, pos === 0 ? 1 : 0), hold(6), time, 0.8);
      }
      if (pos === 15 && lastBar) snare(time, 0.5);
      if (pos === 15) { sectionBar++; globalBar++; }
      return;
    }

    // ----- bass: oompah in the tuba, kick on the strong beats
    const busyKick = heat > 0.6;
    // In the Stomp the tuba doubles the tune instead of playing oompah (one tuba, one note at a time).
    const tubaFree = !(section === 'faction' && faction === 0);
    if (section !== 'reveille') {
      if (!tubaFree) { /* the stomp has the tuba */ } else if (pos === 0) tuba.triggerAttackRelease(T.Frequency(bassMidi, 'midi').toFrequency(), hold(3), time, 0.9 * vel);
      else if (pos === 8) tuba.triggerAttackRelease(T.Frequency(fifth, 'midi').toFrequency(), hold(3), time, 0.78 * vel);
      else if (busyKick && (pos === 4 || pos === 12)) tuba.triggerAttackRelease(T.Frequency(bassMidi + 12, 'midi').toFrequency(), hold(2), time, 0.55 * vel);
      if (pos === 0 || pos === 8) kickDrum(time, (pos === 0 ? 0.95 : 0.7) * vel);
      else if (busyKick && (pos === 4 || pos === 12)) kickDrum(time, 0.55 * vel);
      if (pos === 4 || pos === 12) pah.triggerAttackRelease(chord.map((n) => T.Frequency(n + 12, 'midi').toFrequency()), hold(2), time, (heat > 0.3 ? 0.8 : 0.55) * vel);
      else if (heat > 0.6 && (pos === 6 || pos === 14)) pah.triggerAttackRelease(chord.map((n) => T.Frequency(n + 12, 'midi').toFrequency()), hold(1), time, 0.5 * vel);
    }

    // ----- snare
    const pattern = section === 'reveille' ? SNARE_LIGHT : heat > 0.6 || section === 'push' ? SNARE_BUSY : heat > 0.3 ? SNARE_MID : SNARE_LIGHT;
    const reveilleVel = section === 'reveille' ? 0.6 : 1;
    if (lastBar && pos >= 8) {
      // The roll into the next section: 16ths, getting louder.
      snare(time, (0.3 + 0.06 * (pos - 8)) * (section === 'push' ? 1.15 : 1));
    } else {
      for (const [s, v] of pattern) {
        if (s !== pos) continue;
        if (s === 12 && sectionBar % 4 === 3) flam(time, v * vel);
        else snare(time, v * vel * reveilleVel);
      }
    }

    // ----- melody
    const callPos = (sectionBar % 4) * 16 + pos;
    const playMotif = (map: Map<number, MotifNote[]>, rootNote: number, voice: 'lead' | 'harm' | 'fife', scale = 1): void => {
      const notes = map.get(callPos);
      if (!notes) return;
      for (const n of notes) {
        const m = degreeToMidi(rootNote, mode, n.deg);
        const v = (n.vel ?? 0.8) * scale * vel;
        if (menu && voice !== 'harm' && map !== stompMap) bell.triggerAttackRelease(T.Frequency(m + 12, 'midi').toFrequency(), Math.min(0.4, hold(n.len)), time, 0.4 * v);
        if (voice === 'fife') fifeNote(m, n.len, time, v);
        else if (voice === 'lead') hornLead.play(m, hold(n.len), time, v);
        else hornHarm.play(m, hold(n.len), time, v);
      }
    };
    const fifeBase = root + 12;
    switch (section) {
      case 'reveille':
        // The fife alone with the call, a tattoo under it.
        playMotif(callMap, root + 24, 'fife', 1.1);
        break;
      case 'call':
        playMotif(callMap, root, 'lead');
        if (sectionBar >= 4) playMotif(callMap, root - 12, 'harm', 0.85);
        if (heat > 0.3) playMotif(callHarmMap, root + 12, 'fife', 0.9);
        break;
      case 'faction':
        if (faction === 0) {
          // The Stomp: horns low and square, the tuba doubling it a gear down; the fife stays out.
          playMotif(stompMap, root, 'lead', 1);
          playMotif(stompMap, root - 12, 'harm', 0.9);
          const n = stompMap.get(callPos);
          if (n) for (const x of n) tuba.triggerAttackRelease(T.Frequency(degreeToMidi(root - 12, mode, x.deg), 'midi').toFrequency(), hold(x.len), time, 0.7 * vel);
          if (heat > 0.6) playMotif(callHarmMap, root + 12, 'fife', 0.7);
        } else {
          // The Quickstep: the fife leads a skipping tune; a horn holds the chord's third under it.
          playMotif(stepMap, fifeBase, 'fife', 1);
          if (pos === 0 && sectionBar % 2 === 0) hornHarm.play(chord[1], hold(14), time, 0.55 * vel);
          if (heat > 0.3) playMotif(stepMap, fifeBase - 12, 'lead', 0.5);
        }
        break;
      case 'push': {
        // The Push: the call's first figure climbing a rung a bar, with the horns in thirds.
        const d = [0, 2, 3, 4][sectionBar];
        if (pos === 0) { hornLead.play(degreeToMidi(root, mode, d), hold(3), time, 0.9); hornHarm.play(degreeToMidi(root, mode, d - 2), hold(3), time, 0.75); }
        if (pos === 3) hornLead.play(degreeToMidi(root, mode, d), hold(1), time, 0.7);
        if (pos === 4) { hornLead.play(degreeToMidi(root, mode, d + 2), hold(4), time, 0.9); hornHarm.play(degreeToMidi(root, mode, d), hold(4), time, 0.75); }
        if (pos === 8) { hornLead.play(degreeToMidi(root, mode, d + 4), hold(7), time, 0.95); hornHarm.play(degreeToMidi(root, mode, d + 2), hold(7), time, 0.8); }
        if (pos % 4 === 0) fifeNote(degreeToMidi(root + 24, mode, d + 2 * (pos / 4 % 3)), 2, time, 0.6 * vel);
        break;
      }
    }

    if (pos === 15) {
      sectionBar++;
      globalBar++;
    }
  }, '16n'));
  loop.start(0);
}

/** The title-screen march: the same call and tunes in bright major, with a glockenspiel. Fun, not grim. */
export function buildGnomeFrontMenu(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  buildGnomeFrontTrack(T, keep, out, seed, { menu: true });
}
