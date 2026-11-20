/**
 * Theme: The Front, in the field (jungle, 148-158 bpm). The in-game score of Gnome Front.
 *
 * It is jungle in the rhythm (a chopped break, war toms, a sub and a growling tuba-reese), but it is not built like
 * the run track of Lawn Gnome Panic (runTrack.ts): that one is a seeded A B A C song with random chords. This one has no
 * fixed form. It is made of 4-bar cells, and the match picks the next cell's PHASE, so the music is the state of the
 * battle:
 *
 * - recon (quiet): a war-tom heartbeat, a held sub and a far-off fragment of the call. The first cell is always this.
 * - skirmish: the chopped break, the faction's bass riff, offbeat brass.
 * - assault (hot): the break with double-time hats, the full bugle call over it, and the leading faction's tune
 *   (Red Caps: the stomp in the brass; Blue Caps: the quickstep on the fife). A snare-corps roll ends every cell.
 * - combine: a combine is near. The break drops to half-time and a tuba lumbers on the beat while two horns bray.
 *
 * The motifs are the ones in gnomeFront.ts (the call, the stomp, the quickstep), so the menu and the battle are one
 * score. The key is dorian when Red Caps lead and mixolydian when Blue Caps lead (the third moves, the root stays).
 *
 * Inputs (all optional): lead(), intensity(), combine() as in gnomeFront.ts, and hooks.flag(mine) for a bell stinger.
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import { BREAKS, chopBar, createKit, type Slice } from '../drums';
import { createFrenchHorn } from '../instruments';
import { createFx, createPanner } from '../mix';
import { MODES, degreeToMidi, humanize, midiToNote, mulberry32 } from '../theory';
import { CALL, FACTION_MODE, QUICKSTEP, STOMP, indexMotif, type GnomeFrontOptions } from './gnomeFront';

type Phase = 'recon' | 'skirmish' | 'assault' | 'combine';
const CELL_BARS = 4;

/** The break behind each phase: Apache rolls like war drums, Think is busier. */
const BREAK_FOR = ['Apache', 'Think'] as const;

export function buildGnomeFrontBattle(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, opts: GnomeFrontOptions = {}): void {
  const rnd = mulberry32(seed);
  const pick = <V>(xs: readonly V[]): V => xs[Math.floor(rnd() * xs.length)];
  const transport = T.getTransport();
  const bpm = 148 + Math.floor(rnd() * 11);
  transport.bpm.value = bpm;
  const step16 = T.Time('16n').toSeconds();
  const hold = (steps: number): number => steps * step16 * 0.9;
  const root = pick([38, 40, 41, 43]); // D2, E2, F2, G2: the sub's root; horns play an octave or two up
  const hz = (midi: number): number => T.Frequency(midi, 'midi').toFrequency();

  const fx = createFx(T, keep, out, { reverbDecay: 1.9, reverbHp: 400, snareSend: 0.1, echoFeedback: 0.26, echoLp: 3600, delayDry: 0.5, delayRevSend: 0.3 });
  const send = (amount: number, dest: ToneNS.ToneAudioNode): ToneNS.Gain => keep(new T.Gain(amount)).connect(dest);
  const kit = createKit(T, keep, out, fx, { grit: 0.16, snarePitch: pick(['D3', 'E3']), snareLp: 5400, hatHp: 6800, hatVolume: -12.5, swing: 0.05 + rnd() * 0.06 });

  // Tonal parts duck under the kick.
  const duck = keep(new T.Gain(1)).connect(out);

  // War toms: three membranes, the tribal part of the jungle.
  const tomLp = keep(new T.Filter(1800, 'lowpass')).fan(duck, send(0.22, fx.rev));
  const toms = [0, 1, 2].map((i) => {
    const t = keep(new T.MembraneSynth({ pitchDecay: 0.04, octaves: 2.2, envelope: { attack: 0.001, decay: 0.2 + 0.05 * i, sustain: 0, release: 0.05 } })).connect(tomLp);
    t.volume.value = -11;
    return t;
  });
  const tomNotes = ['D2', 'G2', 'A2'];
  const tom = (i: number, time: number, vel: number): void => { toms[i].triggerAttackRelease(tomNotes[i], '16n', time, vel); };

  // Sub and the tuba-reese: a growling saw, high-passed so the sine owns the floor.
  const sub = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.1 } })).connect(duck);
  sub.volume.value = -6;
  const reeseHp = keep(new T.Filter(100, 'highpass')).connect(duck);
  const reeseLp = keep(new T.Filter(620, 'lowpass')).connect(reeseHp);
  keep(new T.LFO(0.12 + rnd() * 0.1, 320, 1000)).connect(reeseLp.frequency).start();
  const reese = keep(new T.MonoSynth({ oscillator: { type: 'fatsquare', count: 2, spread: 22 }, envelope: { attack: 0.015, decay: 0.2, sustain: 0.8, release: 0.12 }, filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 1, release: 0.2, baseFrequency: 2000, octaves: 0 } })).connect(reeseLp);
  reese.volume.value = -15;

  // Brass: the call and the stomp on horns, short offbeat chords, and the fife.
  const horn = createFrenchHorn(T, keep, duck, fx, { volumeDb: -12, revSend: 0.4, brightness: 2300, attack: 0.025 });
  const hornLow = createFrenchHorn(T, keep, duck, fx, { volumeDb: -15, revSend: 0.4, brightness: 1700, attack: 0.03 });
  const pahLp = keep(new T.Filter({ frequency: 2200, type: 'lowpass', rolloff: -12 })).fan(duck, send(0.2, fx.delay), send(0.15, fx.rev));
  const pahHp = keep(new T.Filter(320, 'highpass')).connect(pahLp);
  const pah = keep(new T.PolySynth(T.Synth, { oscillator: { type: 'fatsawtooth', count: 2, spread: 16 }, envelope: { attack: 0.004, decay: 0.1, sustain: 0, release: 0.08 } })).connect(pahHp);
  pah.volume.value = -22;
  const fifePan = createPanner(T, keep, 0.25, duck);
  const fifeLp = keep(new T.Filter({ frequency: 3600, type: 'lowpass', rolloff: -12 })).fan(fifePan, send(0.3, fx.rev), send(0.22, fx.delay));
  const fifeHp = keep(new T.Filter(650, 'highpass')).connect(fifeLp);
  const fife = keep(new T.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.015, decay: 0.07, sustain: 0.7, release: 0.05 } })).connect(keep(new T.Vibrato({ frequency: 5.4, depth: 0.05 })).connect(fifeHp));
  fife.volume.value = -26;

  const crashHp = keep(new T.Filter(4200, 'highpass')).fan(out, send(0.4, fx.rev));
  const crash = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 1.3, sustain: 0, release: 0.4 } })).connect(crashHp);
  crash.volume.value = -21;

  // Stinger voices of their own (the sequencer schedules ahead of the clock).
  const bell = keep(new T.PolySynth(T.FMSynth, { harmonicity: 3.01, modulationIndex: 1.6, envelope: { attack: 0.002, decay: 0.9, sustain: 0, release: 0.5 }, modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.2 } })).fan(out, send(0.4, fx.rev));
  bell.volume.value = -18;
  const callHorn = createFrenchHorn(T, keep, out, fx, { volumeDb: -13, revSend: 0.5, brightness: 2100, attack: 0.02 });

  // ----- material
  const callMap = indexMotif(CALL);
  const stompMap = indexMotif(STOMP);
  const stepMap = indexMotif(QUICKSTEP);
  const brk = BREAKS.find((b) => b.name === BREAK_FOR[0]) ?? BREAKS[0];
  const brk2 = BREAKS.find((b) => b.name === BREAK_FOR[1]) ?? BREAKS[1];
  const cells: Record<'skirmish' | 'assault', Slice[][]> = {
    skirmish: [0, 1, 0, 1].map((b, i) => chopBar(rnd, brk.steps, b as 0 | 1, 0.1 + 0.05 * i)),
    assault: [0, 1, 0, 1].map((b, i) => chopBar(rnd, brk2.steps, b as 0 | 1, 0.25 + 0.08 * i)),
  };
  let faction: 0 | 1 = rnd() < 0.5 ? 0 : 1;
  let mode: readonly number[] = MODES[FACTION_MODE[faction]];
  let phase: Phase = 'recon';
  let prevPhase: Phase = 'recon';
  let heat = 0;
  let cellCount = 0;

  const choosePhase = (): Phase => {
    if (opts.combine?.()) return 'combine';
    if (cellCount === 0) return 'recon';
    const h = heat;
    // Hysteresis: it takes more heat to climb into a phase than to stay in it.
    if (h > (phase === 'assault' ? 0.5 : 0.68)) return 'assault';
    if (h > (phase === 'recon' ? 0.3 : 0.18)) return 'skirmish';
    return 'recon';
  };

  if (opts.hooks) {
    opts.hooks.flag = (mine: boolean): void => {
      try {
        const t = T.now() + 0.06;
        const at = (deg: number, oct: number): number => degreeToMidi(root + oct, mode, deg);
        if (mine) {
          [0, 2, 4, 7].forEach((d, i) => bell.triggerAttackRelease(hz(at(d, 36)), 0.5, t + i * 0.09, 0.7));
          callHorn.play(at(0, 24), 0.2, t, 0.8);
          callHorn.play(at(4, 24), 0.5, t + 0.18, 0.9);
        } else {
          [4, 2, 1, 0].forEach((d, i) => bell.triggerAttackRelease(hz(at(d, 24)), 0.6, t + i * 0.12, 0.5));
          callHorn.play(at(0, 12), 0.7, t + 0.2, 0.8);
        }
      } catch {
        // Music must never break the game.
      }
    };
  }
  console.info(`[music] The Front (battle) in ${midiToNote(root)}, ${bpm} bpm`);

  let step = 0;
  const loop = keep(new T.Loop((time) => {
    const bar = Math.floor(step / 16);
    const pos = step % 16;
    const cellBar = bar % CELL_BARS;
    const vel = humanize(step, 0.1);
    step++;

    if (pos === 0) {
      const target = Math.min(1, Math.max(0, opts.intensity?.() ?? 0));
      heat += (target - heat) * 0.5;
      if (cellBar === 0) {
        prevPhase = phase;
        const lead = opts.lead?.();
        if (lead === 0 || lead === 1) faction = lead;
        mode = MODES[FACTION_MODE[faction]];
        phase = choosePhase();
        if (bar > 0 && (phase !== prevPhase || phase === 'assault')) crash.triggerAttackRelease(1.2, time, 0.7);
        cellCount++;
      }
    }
    const lastBar = cellBar === CELL_BARS - 1;
    const cellPos = cellBar * 16 + pos;
    const rootAt = (deg: number, oct: number): number => degreeToMidi(root + oct, mode, deg);

    // Dub throw on the last snare of every cell.
    if (pos === 12) fx.throwSend.gain.setValueAtTime(lastBar && phase !== 'recon' ? 0.3 : 0, time);
    if (pos === 0) fx.throwSend.gain.setValueAtTime(0, time);

    // ----- drums
    const kicked = (sl: Slice): void => {
      if (kit.hit(sl, time, pos)) {
        duck.gain.setValueAtTime(0.55, time);
        duck.gain.linearRampToValueAtTime(1, time + 0.14);
      }
    };
    if (phase === 'recon') {
      // A heartbeat on the toms and a thin hat.
      if (pos === 0) tom(0, time, 0.8 * vel);
      if (pos === 3 || pos === 10) tom(1, time, 0.5 * vel);
      if (pos === 6) tom(2, time, 0.45 * vel);
      if (pos % 4 === 2) kit.hit({ h: 1 }, time, pos, 0.7);
    } else if (phase === 'combine') {
      // Half-time: kick on 1, snare on 3, the hats keep rolling.
      kicked({ k: pos === 0 ? 1 : undefined, s: pos === 8 ? 1 : undefined, h: pos % 2 === 0 ? 1 : undefined });
      if (pos === 0 || pos === 8) tom(0, time, 0.9);
    } else {
      const bars = cells[phase];
      const sl = bars[cellBar][pos];
      // On the last beat of a cell the corps roll replaces the break's snare.
      const rolling = lastBar && pos >= 12;
      const base: Slice = rolling ? { ...sl, s: undefined, g: undefined } : sl;
      kicked(phase === 'assault' ? { ...base, h: base.h ?? (pos % 2 === 1 ? 1 : undefined) } : base);
      // Toms ghost the gaps of the break.
      if (!sl.k && !sl.s && (pos === 7 || pos === 14) && phase === 'assault') tom(pos === 7 ? 1 : 2, time, 0.4 * vel);
    }
    // The snare corps roll ends a cell (and tells you the next cell is coming).
    if (lastBar && pos >= 12 && phase !== 'recon') kit.snareHit(time, 0.3 + 0.1 * (pos - 12));

    // ----- bass: the faction's riff (stomp rhythm for Red Caps, quickstep rhythm for Blue Caps), roots only
    const riff = faction === 0 ? stompMap : stepMap;
    if (phase === 'skirmish' || phase === 'assault') {
      const notes = riff.get(cellPos);
      if (notes) {
        for (const n of notes) {
          const m = rootAt(n.deg % 7, 0);
          const d = hold(Math.min(n.len, 4));
          reese.triggerAttackRelease(midiToNote(m), d, time, (n.vel ?? 0.8) * 0.85);
          sub.triggerAttackRelease(midiToNote(m - 12), d, time, 0.9);
        }
      }
    } else if (phase === 'recon') {
      if (pos === 0) sub.triggerAttackRelease(midiToNote(rootAt(cellBar % 2 === 0 ? 0 : 4, -12)), hold(15), time, 0.7);
    } else if (pos % 4 === 0) {
      // The Combine: a tuba lumber on every beat, root then fifth.
      const m = rootAt(pos === 8 ? 4 : 0, 0);
      reese.triggerAttackRelease(midiToNote(m), hold(3), time, 0.95);
      sub.triggerAttackRelease(midiToNote(m - 12), hold(3), time, 0.95);
    }

    // ----- brass and fife
    if (phase === 'recon') {
      // Far off: the first two bars of the call, soft, every other cell.
      if (cellCount % 2 === 0 && cellBar < 2) {
        for (const n of callMap.get(cellPos) ?? []) hornLow.play(rootAt(n.deg, 24), hold(n.len), time, (n.vel ?? 0.8) * 0.45);
      }
    } else if (phase === 'skirmish') {
      if (pos === 6 || pos === 14) pah.triggerAttackRelease([0, 2, 4].map((d) => hz(rootAt(d, 36))), hold(1), time, 0.6);
      if (cellBar === 0 && pos === 0) hornLow.play(rootAt(0, 24), hold(8), time, 0.5);
    } else if (phase === 'assault') {
      // The full call on top, the leading faction's tune with it.
      for (const n of callMap.get(cellPos) ?? []) horn.play(rootAt(n.deg, 24), hold(n.len), time, (n.vel ?? 0.8) * vel);
      if (faction === 0) {
        for (const n of stompMap.get(cellPos) ?? []) hornLow.play(rootAt(n.deg, 12), hold(n.len), time, (n.vel ?? 0.8) * 0.8 * vel);
      } else {
        for (const n of stepMap.get(cellPos) ?? []) fife.triggerAttackRelease(hz(rootAt(n.deg, 36)), Math.max(0.06, hold(n.len)), time, (n.vel ?? 0.8) * vel);
      }
      if (pos === 4 || pos === 12) pah.triggerAttackRelease([0, 2, 4].map((d) => hz(rootAt(d, 36))), hold(1), time, 0.6 * vel);
    } else if (cellBar % 2 === 0) {
      // "Mind THE COMBINE": two braying horns a step apart, falling.
      if (pos === 0) { horn.play(rootAt(1, 24), hold(6), time, 0.9); hornLow.play(rootAt(1, 12), hold(6), time, 0.8); }
      if (pos === 8) { horn.play(rootAt(0, 24), hold(8), time, 0.95); hornLow.play(rootAt(0, 12), hold(8), time, 0.8); }
    }
  }, '16n'));
  loop.start(0);
}
