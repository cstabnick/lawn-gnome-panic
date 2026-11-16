/**
 * Sector tracks: chiptune space-roguelike music in the FTL manner, built from the pattern banks
 * in sectorThemes.ts.
 *
 * Design decisions, and why:
 *
 * - Explore and Battle are one song. As in FTL, each theme has an explore and a battle arrangement
 *   with the same tempo, key, chords and melody, playing in sync on two buses. When combat starts
 *   the battle bus crossfades in and the explore bus out, so the music turns into a fight without a
 *   cut or a restart. A core bus (pad, arp) plays in both.
 *   - Explore: triangle bass, a soft triangle "bell" lead with long echoes, optional noise ticks.
 *   - Battle: square bass driving 8ths, a nasal pulse lead with vibrato, chip drums, and a 32nd-note
 *     chord trill in B sections.
 *
 * - Procedural, not random. Nothing picks a random note. A seeded arranger picks *patterns* from the
 *   theme's banks under rules:
 *   - Form: intro 8 | A 16 | B 16 | A 16 | breakdown 8, then it loops from A. Each pass through the
 *     loop re-picks, so the song evolves but is still recognisably the same theme.
 *   - A sections always play the theme's home progression, and their melody form starts on the
 *     signature motif. That is the theme's identity.
 *   - B sections take a new progression from the bank each pass, with motifs other than the signature.
 *   - Picks never repeat the previous choice from the same bank (a shuffle-bag rule), so it varies
 *     without lurching.
 *   - Melody phrases follow forms like "aaba" or "abaA" (uppercase = repeat with a changed ending),
 *     with rests ('.') so the melody breathes.
 *   - Patterns are relative to the chord, so motifs become sequences of themselves as chords move.
 *
 * - Chiptune: pulse waves at 12.5/25/50% width, triangle bass, noise drums and hats, a pitch-swept
 *   triangle kick, and fast chord arps. The pad (soft detuned saws) and long echoes are the
 *   Ben Prunty-style warmth on top.
 *
 * - CPU: a bus that has been silent for over a bar skips triggering its instruments.
 * - Timing: all triggers use the Loop's `time`, never Tone.now().
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from './engine';
import { createFx } from './mix';
import { DRUM_FILL, DRUM_HALF, FORMS_A, FORMS_B, SECTOR_THEMES, type DrumKit, type Motif, type SectorTheme } from './sectorThemes';
import { MODES, NOTE_NAMES, chordTones, midiToNote, mulberry32, voiceLead } from './theory';

type SectionId = 'intro' | 'A' | 'B' | 'break';
const FORM: { id: SectionId; bars: number }[] = [
  { id: 'intro', bars: 8 }, { id: 'A', bars: 16 }, { id: 'B', bars: 16 }, { id: 'A', bars: 16 }, { id: 'break', bars: 8 },
];
const LOOP_FROM = 1;
const LOOP_BARS = FORM.slice(LOOP_FROM).reduce((n, s) => n + s.bars, 0);
const INTRO_BARS = FORM[0].bars;

/** Where a bar falls: section, its index in FORM, the bar within it, and the pass through the loop. */
function locate(bar: number): { id: SectionId; idx: number; sb: number; bars: number; pass: number } {
  let pass = 0;
  let b = bar;
  if (b >= INTRO_BARS) {
    b -= INTRO_BARS;
    pass = Math.floor(b / LOOP_BARS);
    b = (b % LOOP_BARS) + INTRO_BARS;
  }
  for (let i = 0; i < FORM.length; i++) {
    if (b < FORM[i].bars) return { id: FORM[i].id, idx: i, sb: b, bars: FORM[i].bars, pass };
    b -= FORM[i].bars;
  }
  return { id: 'A', idx: 1, sb: 0, bars: 16, pass };
}

export interface SectorOptions {
  /** Theme index; by default the seed picks one. */
  theme?: number;
  /** Read every 16th: true crossfades to the battle arrangement. */
  battle: () => boolean;
}

export function themeForSeed(seed: number, forced?: number): SectorTheme {
  const i = forced !== undefined && forced >= 0 ? forced % SECTOR_THEMES.length : mulberry32((seed ^ 0x3c6ef372) >>> 0)() * SECTOR_THEMES.length | 0;
  return SECTOR_THEMES[i];
}

/** A note pattern string parsed into [step, chord tone index, length] events. */
type NoteEv = [number, number, number];
function parsePattern(p: string): NoteEv[] {
  const out: NoteEv[] = [];
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    const idx = c >= '0' && c <= '9' ? Number(c) : c === 'v' ? -2 : c === 'u' ? -1 : null;
    if (idx === null) continue;
    let len = 1;
    while (p[i + len] === '-') len++;
    out.push([i, idx, len]);
  }
  return out;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

export function buildSectorTrack(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, opts: SectorOptions): SectorTheme {
  const theme = themeForSeed(seed, opts.theme);
  const mode = MODES[theme.mode];
  const rnd = mulberry32(seed);
  const transport = T.getTransport();
  transport.bpm.value = theme.bpm;
  transport.swing = 0;
  console.info(`[music] sector theme "${theme.name}": ${NOTE_NAMES[theme.tonic % 12]} ${theme.mode}, ${theme.bpm} bpm`);

  // ----- buses -----
  const fx = createFx(T, keep, out, { reverbDecay: 4.5, snareSend: 0 });
  const tame = keep(new T.Filter(7500, 'lowpass')).connect(out); // pulse waves alias up top; keep them warm
  const bus = (level: number, send: number) => {
    const dry = keep(new T.Gain(level)).connect(tame);
    const wet = keep(new T.Gain(level * send)).connect(fx.delay);
    return { dry, wet, send, input: keep(new T.Gain(1)).fan(dry, wet) };
  };
  const core = bus(1, 0.22);
  const explore = bus(1, 0.5);
  const battle = bus(0, 0.12);

  // ----- core: pad and arp -----
  const padLp = keep(new T.Filter(1300, 'lowpass'));
  const padRev = keep(new T.Gain(0.5)).connect(fx.rev);
  padLp.fan(core.dry, padRev);
  keep(new T.LFO(0.05 + rnd() * 0.05, 700, 2000)).connect(padLp.frequency).start();
  const pad = keep(new T.PolySynth(T.Synth, { oscillator: { type: 'fatsawtooth', count: 2, spread: 16 }, envelope: { attack: 1.4, decay: 1, sustain: 0.6, release: 2.5 } })).connect(padLp);
  pad.volume.value = -27;
  const arp = keep(new T.Synth({ oscillator: { type: 'pulse', width: theme.arpWidth }, envelope: { attack: 0.002, decay: 0.12, sustain: 0.12, release: 0.08 } })).connect(core.input);
  arp.volume.value = -24;

  // ----- explore: triangle bass, bell lead, ticks -----
  const bassE = keep(new T.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.25 } })).connect(explore.dry);
  bassE.volume.value = -7;
  const leadE = keep(new T.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.4, sustain: 0.35, release: 0.8 } })).connect(explore.input);
  leadE.volume.value = -13;
  const tickHp = keep(new T.Filter(8000, 'highpass')).connect(explore.dry);
  const tick = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.02, sustain: 0 } })).connect(tickHp);
  tick.volume.value = -32;

  // ----- battle: square bass, pulse lead, chip drums, trill -----
  const bassLp = keep(new T.Filter(1200, 'lowpass')).connect(battle.dry);
  const bassB = keep(new T.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.003, decay: 0.12, sustain: 0.55, release: 0.05 } })).connect(bassLp);
  bassB.volume.value = -8;
  const leadB = keep(new T.Synth({ oscillator: { type: 'pulse', width: theme.leadWidth }, portamento: 0.012, envelope: { attack: 0.004, decay: 0.15, sustain: 0.6, release: 0.15 } })).connect(battle.input);
  leadB.volume.value = -15;
  keep(new T.LFO(5.5, -14, 14)).connect(leadB.detune).start();
  const trill = keep(new T.Synth({ oscillator: { type: 'pulse', width: 0.5 }, envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 } })).connect(battle.dry);
  trill.volume.value = -26;
  const kick = keep(new T.MembraneSynth({ pitchDecay: 0.035, octaves: 5, oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.05 } })).connect(battle.dry);
  kick.volume.value = -1;
  const snareHp = keep(new T.Filter(900, 'highpass')).connect(battle.input);
  const snare = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.13, sustain: 0 } })).connect(snareHp);
  snare.volume.value = -11;
  const hatHp = keep(new T.Filter(7000, 'highpass')).connect(battle.dry);
  const hat = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0 } })).connect(hatHp);
  hat.volume.value = -23;

  // ----- the arranger -----
  /** Shuffle-bag pick: any index of the bank except the last one taken from it. */
  const lastPick = new Map<unknown, number>();
  const pickIdx = (bank: readonly unknown[], exclude: number[] = []): number => {
    const prev = lastPick.get(bank);
    let options = bank.map((_, i) => i).filter((i) => i !== prev && !exclude.includes(i));
    if (options.length === 0) options = bank.map((_, i) => i);
    const i = options[Math.floor(rnd() * options.length)];
    lastPick.set(bank, i);
    return i;
  };

  interface SectionPlan { prog: number[]; arp: NoteEv[]; bassE: NoteEv[]; bassB: NoteEv[]; kit: DrumKit; motifA: number; trill: boolean }
  interface Chord { deg: number; rel: number[]; bassRoot: number; arpRoot: number; pad: number[] }
  interface PhrasePlan { chords: Chord[]; melody: Map<number, [number, number]> }

  let firstA = true;
  const planSection = (id: SectionId): SectionPlan => {
    const isA = id === 'A' || id === 'intro' || id === 'break';
    const prog = id === 'B' ? theme.progressions[pickIdx(theme.progressions)] : theme.home;
    const arpI = id === 'intro' || (id === 'A' && firstA) ? 0 : pickIdx(theme.arps);
    if (id === 'A') firstA = false;
    return {
      prog,
      arp: parsePattern(theme.arps[arpI]),
      bassE: parsePattern(theme.bassExplore[id === 'break' ? 0 : pickIdx(theme.bassExplore)]),
      bassB: parsePattern(theme.bassBattle[pickIdx(theme.bassBattle)]),
      kit: theme.drums[pickIdx(theme.drums)],
      motifA: isA ? 0 : pickIdx(theme.motifs, [0]),
      trill: id === 'B' || (id === 'A' && rnd() < 0.3),
    };
  };

  let prevPad: number[] | null = null;
  let prevLead = theme.tonic + 28;
  const scale = (i: number) => mode[mod(i, 7)] + 12 * Math.floor(i / 7);
  const fold = (x: number, lo: number) => (x > lo + 11 ? x - 12 : x);

  const planPhrase = (id: SectionId, sp: SectionPlan): PhrasePlan => {
    const chords: Chord[] = sp.prog.map((deg) => {
      const tones = chordTones(mode, deg, 4);
      prevPad = voiceLead(tones, 7, prevPad);
      return {
        deg,
        rel: tones.map((t) => t - tones[0]),
        bassRoot: theme.tonic + fold(mode[deg], -5),
        arpRoot: theme.tonic + 24 + fold(mode[deg], -4),
        pad: prevPad.map((t) => t + theme.tonic + 12),
      };
    });
    // Melody: a phrase form binds letters to motifs. 'a' in A sections is the signature.
    const melody = new Map<number, [number, number]>();
    if (id !== 'intro') {
      const form = id === 'break' ? 'a.A.' : id === 'B' ? FORMS_B[pickIdx(FORMS_B)] : FORMS_A[pickIdx(FORMS_A)];
      // The form's first letter is the section's motif (the signature in A); other letters take
      // any other motif from the bank.
      const bind = new Map<string, number>([[id === 'B' ? 'b' : 'a', sp.motifA]]);
      for (const ch of form.toLowerCase()) {
        if (ch !== '.' && !bind.has(ch)) bind.set(ch, pickIdx(theme.motifs, [0, ...bind.values()]));
      }
      [...form].forEach((ch, slot) => {
        if (ch === '.') return;
        const motif: Motif = theme.motifs[bind.get(ch.toLowerCase()) ?? 0];
        const varied = ch !== ch.toLowerCase();
        const c = chords[slot];
        const raw = motif.map(([st, rel, len], k) => {
          const r = varied && k === motif.length - 1 ? rel + 2 : rel; // varied repeat: the ending lifts
          return [st, theme.tonic + 24 + scale(c.deg + r), len] as const;
        });
        // Octave-fit the whole motif so it starts near where the last one ended.
        const first = raw[0][1];
        const shift = 12 * Math.round((prevLead - first) / 12);
        for (const [st, n, len] of raw) melody.set(slot * 32 + st, [n + shift, len]);
        prevLead = raw[raw.length - 1][1] + shift;
        // Keep the lead in a sane register.
        if (prevLead > theme.tonic + 40) prevLead -= 12;
        if (prevLead < theme.tonic + 20) prevLead += 12;
      });
    }
    return { chords, melody };
  };

  const toneAt = (c: Chord, i: number) => c.rel[mod(i, c.rel.length)] + 12 * Math.floor(i / c.rel.length);
  const hum = (s: number) => 0.85 + 0.15 * (((s * 2654435761) >>> 0) % 1000) / 1000;

  // ----- crossfade -----
  let battleOn = false;
  let switchedAt = -1000;
  const FADE_S = 1.2;
  const fadeTo = (b: { dry: ToneNS.Gain; wet: ToneNS.Gain; send: number }, v: number, time: number) => {
    b.dry.gain.rampTo(v, FADE_S, time);
    b.wet.gain.rampTo(v * b.send, FADE_S, time);
  };

  const step16 = T.Time('16n').toSeconds();
  let step = 0;
  let section: SectionPlan | null = null;
  let phrase: PhrasePlan | null = null;
  const loop = keep(new T.Loop((time) => {
    const s = step++;
    const bar = Math.floor(s / 16);
    const pos = s % 16;
    const loc = locate(bar);

    const want = opts.battle();
    if (want !== battleOn) {
      battleOn = want;
      switchedAt = s;
      fadeTo(battle, want ? 1 : 0, time);
      fadeTo(explore, want ? 0 : 1, time);
    }
    const settled = s - switchedAt > 32;
    const playBattle = battleOn || !settled;
    const playExplore = !battleOn || !settled;

    if (pos === 0 && loc.sb === 0) section = planSection(loc.id);
    if (pos === 0 && loc.sb % 8 === 0 && section) phrase = planPhrase(loc.id, section);
    if (!section || !phrase) return;

    const pstep = (loc.sb % 8) * 16 + pos; // 0-127 within the phrase
    const chord = phrase.chords[Math.floor(pstep / 32)];
    const cstep = pstep % 32; // within the chord
    const intro = loc.id === 'intro';
    const brk = loc.id === 'break';
    const lastBar = loc.sb === loc.bars - 1;

    // Pad: every chord, softer once the band is in.
    if (cstep === 0) pad.triggerAttackRelease(chord.pad.map(midiToNote), 30 * step16, time, intro || brk ? 0.7 : 0.45);

    // Arp: not in the breakdown; the intro brings it in after 2 bars.
    if (!brk && !(intro && loc.sb < 2)) {
      for (const [at, idx] of section.arp) {
        if (at !== pos) continue;
        arp.triggerAttackRelease(midiToNote(chord.arpRoot + toneAt(chord, idx)), step16 * 0.9, time, (intro ? 0.55 : 0.8) * hum(s));
      }
    }

    // Melody: both leads read the same phrase; the buses decide which one you hear.
    const m = phrase.melody.get(pstep);
    if (m) {
      const [n, len] = m;
      // The explore bell plays an octave up, unless that gets shrill.
      if (playExplore) leadE.triggerAttackRelease(midiToNote(n < 74 ? n + 12 : n), len * step16 * 0.95, time, 0.8 * hum(s));
      if (playBattle) leadB.triggerAttackRelease(midiToNote(n), len * step16 * 0.9, time, 0.85 * hum(s));
    }

    // Bass.
    const bassIn = !(intro && loc.sb < 4);
    if (bassIn && playExplore) {
      for (const [at, idx, len] of section.bassE) {
        if (at !== pos) continue;
        bassE.triggerAttackRelease(midiToNote(chord.bassRoot + toneAt(chord, idx)), len * step16 * 0.95, time, 0.9);
      }
    }
    if (bassIn && playBattle) {
      const pat = brk ? section.bassE : section.bassB;
      for (const [at, idx, len] of pat) {
        if (at !== pos) continue;
        bassB.triggerAttackRelease(midiToNote(chord.bassRoot + toneAt(chord, idx)), len * step16 * 0.9, time, at % 4 === 0 ? 0.95 : 0.75);
      }
    }

    // Explore ticks.
    if (playExplore && theme.ticks && !intro && !brk && theme.ticks[pos] === 'x') tick.triggerAttackRelease(0.02, time, 0.6 * hum(s));

    // Battle drums and trill.
    if (playBattle) {
      const kit = lastBar && !intro ? DRUM_FILL : brk ? DRUM_HALF : section.kit;
      const hatsOnly = intro && loc.sb < 4;
      const [k, sn, h] = kit;
      if (!hatsOnly && k[pos] !== '.') kick.triggerAttackRelease('C2', 0.2, time, 1);
      if (!hatsOnly && sn[pos] !== '.') snare.triggerAttackRelease(0.12, time, sn[pos] === 'X' ? 1 : 0.6);
      if (h[pos] !== '.') hat.triggerAttackRelease(0.03, time, (pos % 4 === 0 ? 0.9 : 0.55) * hum(s));
      if (section.trill && !intro && !brk) {
        const half = step16 / 2;
        for (let k2 = 0; k2 < 2; k2++) {
          const idx = (s * 2 + k2) % 3; // root, third, fifth, round and round: the chip "chord"
          trill.triggerAttackRelease(midiToNote(chord.arpRoot - 12 + toneAt(chord, idx)), half * 0.8, time + k2 * half, 0.6);
        }
      }
    }
  }, '16n'));
  loop.start(0);
  return theme;
}
