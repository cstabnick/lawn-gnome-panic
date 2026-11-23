// Plays a Turfton FM song (a SongSpec, composed by compose.ts) with Tone.js through the Subsoil Radio mix (the set in
// packages/music/src/themes/undergroundSet.ts): a master lowpass that opens as the song comes in, shared reverb and
// echo returns with the tonal layers high-passed before them, a compressed drum bus, every tonal layer through one
// duck gain that dips under each kick (the pump), one gain per layer ramped once a bar from the energy curve, and a
// crash and a riser into the drops.
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '@lawn/music';
import { createFx, midiToNote } from '@lawn/music';
import { compose, levelsAt, titleSeed } from './compose';
import type { Bus, Ev, Layer } from './compose';
import type { BassVoice, ChordVoice, DrumKit, LeadVoice, SongSpec, Texture } from './spec';

export interface BuildOpts {
  /** Where the broadcast is in this song, seconds (playSong starts the transport here; the song loops). */
  offsetSeconds?: number;
}

type Fx = ReturnType<typeof createFx>;
type TonalBus = 'chord' | 'pad' | 'lead';
const TONAL: readonly TonalBus[] = ['chord', 'pad', 'lead'];
const BUSES: readonly Bus[] = ['drums', 'bass', 'chord', 'pad', 'lead', 'texture'];

/** A voice that plays chords (several notes at once). `out` is the last node of its own chain (its own filter). */
interface PolyVoice { out: ToneNS.ToneAudioNode; play(time: number, notes: string[], dur: number, vel: number): void }
/** A voice that plays one note at a time. */
interface MonoVoice { out: ToneNS.ToneAudioNode; play(time: number, note: string, dur: number, vel: number): void }
interface Drums {
  kick(time: number, vel: number): void;
  snare(time: number, vel: number): void;
  hat(time: number, vel: number): void;
  open(time: number, vel: number): void;
}

/** A monophonic voice must not start a note before the last one started: nudge a late start forward. */
const monoClock = (): ((t: number) => number) => {
  let last = -1;
  return (t) => (last = t > last ? t : last + 0.001);
};

const lowpassHz = (level: number): number => Math.min(16000, 250 * 2 ** (level * 6));

export function buildRadioSong(T: Tone, keep: Keep, out: ToneNS.Volume, spec: SongSpec, opts: BuildOpts = {}): void {
  try {
    buildSong(T, keep, out, spec, opts);
  } catch (err) {
    // The music must never break the game.
    console.warn('[radio] could not build song', spec.title, err);
  }
}

function buildSong(T: Tone, keep: Keep, out: ToneNS.Volume, spec: SongSpec, opts: BuildOpts): void {
  const comp = compose(spec, titleSeed(spec.title));
  T.getTransport().bpm.value = comp.bpm;
  const six = 15 / comp.bpm; // one sixteenth, seconds
  const barS = six * comp.grid;
  const loopEnd = comp.bars * barS;
  const offset = opts.offsetSeconds ?? 0;
  const timeOf = (ev: Ev): number => ev.bar * barS + ev.pos * six + (ev.pos % 4 === 2 ? spec.swing * 2 * six : 0);
  const dur = (ev: Ev): number => ev.len * six * 0.92;
  const notes = (ev: Ev): string[] => ev.midi.map((m) => midiToNote(m));

  // ----- the bus: everything -> master lowpass (opens on the way in) -> out
  const masterLp = keep(new T.Filter({ frequency: 18000, type: 'lowpass', rolloff: -12, Q: 0.5 })).connect(out);
  const mix = keep(new T.Gain(1)).connect(masterLp);
  const fx = createFx(T, keep, mix, {
    reverbDecay: spec.reverb, reverbHp: 350, snareSend: 0.12, echoTime: spec.echo, echoFeedback: 0.38, echoLp: 3200,
    delayDry: 0.6, delayRevSend: 0.3,
  });
  const duck = keep(new T.Gain(1)).connect(mix); // every tonal bus goes through the pump
  const drumBus = keep(new T.Compressor({
    threshold: spec.kit === 'break' ? -20 : -16, ratio: spec.kit === 'break' ? 5 : 3.5, attack: 0.006, release: 0.12,
  })).connect(mix);
  const gains: Record<Bus, ToneNS.Gain> = {
    drums: keep(new T.Gain(0)).connect(drumBus),
    bass: keep(new T.Gain(0)).connect(duck),
    chord: keep(new T.Gain(0)).connect(duck),
    pad: keep(new T.Gain(0)).connect(duck),
    lead: keep(new T.Gain(0)).connect(duck),
    texture: keep(new T.Gain(0)).connect(mix),
  };
  const busLp = {} as Record<TonalBus, ToneNS.Filter>;
  for (const bus of TONAL) busLp[bus] = keep(new T.Filter({ frequency: 18000, type: 'lowpass', rolloff: -12 })).connect(gains[bus]);

  const send = (amount: number, to: ToneNS.InputNode): ToneNS.Gain => keep(new T.Gain(amount)).connect(to);
  /** A tonal voice: high-passed, then its bus lowpass, with reverb and delay sends taken after the voice's own filter. */
  const route = (src: ToneNS.ToneAudioNode, bus: TonalBus, hz: number, rev: number, dly: number): void => {
    const hp = keep(new T.Filter(hz, 'highpass'));
    hp.connect(busLp[bus]);
    const targets: ToneNS.InputNode[] = [hp];
    if (rev > 0) targets.push(send(rev, fx.rev));
    if (dly > 0) targets.push(send(dly, fx.delay));
    src.fan(...targets);
  };

  // ----- chords, pad, bass, lead
  const chord = makeChord(T, keep, spec.chord);
  route(chord.out, 'chord', spec.chord === 'crunch' ? 100 : 200, spec.chord === 'strings' ? 0.35 : 0.25, spec.chord === 'musicBox' ? 0.2 : 0);
  schedule('chord', (time, ev) => chord.play(time, notes(ev), dur(ev), ev.vel));
  if (spec.pad) {
    const pad = makePad(T, keep);
    route(pad.out, 'pad', 200, 0.5, 0);
    schedule('pad', (time, ev) => pad.play(time, notes(ev), dur(ev), ev.vel));
  }
  const bass = makeBass(T, keep, spec.bass);
  bass.out.connect(gains.bass);
  schedule('bass', (time, ev) => bass.play(time, notes(ev)[0], dur(ev), ev.vel));
  if (spec.lead !== 'none') {
    const lead = makeLead(T, keep, spec.lead);
    route(lead.out, 'lead', 200, 0.2, 0.2);
    schedule('lead', (time, ev) => lead.play(time, notes(ev)[0], dur(ev), ev.vel));
  }

  // ----- drums, kick pump, crash
  const crashHp = keep(new T.Filter(3500, 'highpass')).fan(mix, fx.rev);
  const crash = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 1.4, sustain: 0, release: 0.4 } })).connect(crashHp);
  crash.volume.value = -16;
  if (spec.kit !== 'none') {
    const drums = makeDrums(T, keep, spec.kit, gains.drums, fx);
    schedule('kick', (time, ev) => {
      drums.kick(time, ev.vel);
      if (spec.pump > 0) {
        duck.gain.setValueAtTime(1 - 0.5 * spec.pump, time);
        duck.gain.linearRampToValueAtTime(1, time + 0.17);
      }
    });
    schedule('snare', (time, ev) => drums.snare(time, ev.vel));
    schedule('hat', (time, ev) => drums.hat(time, ev.vel));
    schedule('open', (time, ev) => drums.open(time, ev.vel));
  }

  // ----- texture: one bed, started once
  makeTexture(T, keep, spec.texture, gains.texture);

  // ----- riser: noise up through a breakdown, a bandpass sweep into the drop
  const riserBp = keep(new T.Filter({ frequency: 600, type: 'bandpass', Q: 1.2 })).fan(mix, fx.rev);
  const riserGain = keep(new T.Gain(0)).connect(riserBp);
  const riser = keep(new T.Noise('white')).connect(riserGain);
  riser.volume.value = -8;
  riser.start();

  // ----- levels: once a bar, every bus ramps to the level for the next bar
  const levelPart = keep(new T.Part<[number, number]>((time, b) => {
    const lv = levelsAt(spec, comp, b + 1);
    for (const bus of BUSES) gains[bus].gain.rampTo(lv[bus], barS, time);
    for (const bus of TONAL) busLp[bus].frequency.rampTo(lowpassHz(lv[bus]), barS, time);
    if (spec.kit !== 'none' && b % 4 === 0 && b > 0 && comp.energy[b] > comp.energy[b - 1] + 0.03) {
      crash.triggerAttackRelease(1.2, time, 0.5);
    }
    if (comp.breakdown[b]) {
      const p = breakdownProgress(comp.breakdown, b);
      riserGain.gain.rampTo(0.03 + 0.05 * p, barS, time);
      riserBp.frequency.rampTo(500 + 4000 * p, barS, time);
    } else {
      riserGain.gain.rampTo(0, barS, time);
    }
  }, Array.from({ length: comp.bars }, (_, b): [number, number] => [b * barS, b])));
  levelPart.loop = true;
  levelPart.loopEnd = loopEnd;
  levelPart.start(0);

  // ----- start state: the levels of the bar the broadcast is in, and the master opening if the song is starting
  const startBar = Math.floor(offset / barS) % comp.bars;
  const lv0 = levelsAt(spec, comp, startBar);
  for (const bus of BUSES) gains[bus].gain.value = lv0[bus];
  for (const bus of TONAL) busLp[bus].frequency.value = lowpassHz(lv0[bus]);
  if (offset < barS) {
    masterLp.frequency.setValueAtTime(500, T.now());
    masterLp.frequency.exponentialRampToValueAtTime(18000, T.now() + barS * 2);
  }

  /** One looping Part per layer, timed from the composed events. */
  function schedule(layer: Layer, fn: (time: number, ev: Ev) => void): void {
    const pairs: [number, Ev][] = comp.events.filter((e) => e.layer === layer).map((e) => [timeOf(e), e]);
    if (pairs.length === 0) return;
    const part = keep(new T.Part<[number, Ev]>((time, ev) => {
      try { fn(time, ev); } catch { /* skip this note */ }
    }, pairs));
    part.loop = true;
    part.loopEnd = loopEnd;
    part.start(0);
  }
}

/** How far through a run of breakdown bars bar b is, 0..1. */
function breakdownProgress(brk: readonly boolean[], b: number): number {
  let s = b;
  while (s > 0 && brk[s - 1]) s--;
  let e = b;
  while (e < brk.length - 1 && brk[e + 1]) e++;
  return e === s ? 0.5 : (b - s) / (e - s);
}

function makeChord(T: Tone, keep: Keep, kind: ChordVoice): PolyVoice {
  const poly = (s: ToneNS.PolySynth, vol: number): ToneNS.PolySynth => {
    s.maxPolyphony = 10;
    s.volume.value = vol;
    return s;
  };
  switch (kind) {
    case 'crunch': {
      const lp = keep(new T.Filter(2800, 'lowpass'));
      const s = poly(keep(new T.PolySynth(T.Synth, { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.003, decay: 0.25, sustain: 0.3, release: 0.08 } })), -20);
      s.connect(keep(new T.Distortion(0.6)).connect(lp));
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, t, v) };
    }
    case 'brass': {
      const lp = keep(new T.Filter(3200, 'lowpass'));
      const s = poly(keep(new T.PolySynth(T.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 20 }, envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.12 } })), -18);
      s.connect(lp);
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, t, v) };
    }
    case 'organ': {
      const s = poly(keep(new T.PolySynth(T.Synth, { oscillator: { type: 'custom', partials: [1, 0.6, 0.35, 0, 0.25, 0, 0.12] }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.12 } })), -22);
      return { out: s, play: (t, n, d, v) => s.triggerAttackRelease(n, d, t, v) };
    }
    case 'rhodes': {
      const s = poly(keep(new T.PolySynth(T.FMSynth, { harmonicity: 2, modulationIndex: 1.4, envelope: { attack: 0.005, decay: 0.9, sustain: 0.1, release: 0.8 } })), -14);
      const trem = keep(new T.Tremolo(4, 0.3)).start();
      s.connect(trem);
      return { out: trem, play: (t, n, d, v) => s.triggerAttackRelease(n, d, t, v) };
    }
    case 'piano': {
      const s = poly(keep(new T.PolySynth(T.FMSynth, { harmonicity: 3, modulationIndex: 0.8, envelope: { attack: 0.005, decay: 1.2, sustain: 0.1, release: 0.8 } })), -14);
      return { out: s, play: (t, n, d, v) => s.triggerAttackRelease(n, d, t, v) };
    }
    case 'strings': {
      const lp = keep(new T.Filter(1800, 'lowpass'));
      const s = poly(keep(new T.PolySynth(T.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 25 }, envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.2 } })), -24);
      s.connect(lp);
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, t, v) };
    }
    case 'musicBox': {
      const lp = keep(new T.Filter(6000, 'lowpass'));
      const s = poly(keep(new T.PolySynth(T.FMSynth, { harmonicity: 4, modulationIndex: 2, envelope: { attack: 0.001, decay: 0.9, sustain: 0, release: 0.9 } })), -16);
      s.connect(lp);
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, t, v) };
    }
    case 'nylon': {
      const lp = keep(new T.Filter(2400, 'lowpass'));
      const s = poly(keep(new T.PolySynth(T.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.003, decay: 0.7, sustain: 0, release: 0.5 } })), -13);
      s.connect(lp);
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, t, v) };
    }
  }
}

/** A soft sustained pad, the Subsoil-style fill under quiet parts. */
function makePad(T: Tone, keep: Keep): PolyVoice {
  const lp = keep(new T.Filter(1300, 'lowpass'));
  const s = keep(new T.PolySynth(T.Synth, { oscillator: { type: 'fattriangle' }, envelope: { attack: 0.8, decay: 0.5, sustain: 0.8, release: 1.5 } }));
  s.maxPolyphony = 10;
  s.volume.value = -22;
  s.connect(lp);
  return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, t, v) };
}

function makeBass(T: Tone, keep: Keep, kind: BassVoice): MonoVoice {
  const clock = monoClock();
  switch (kind) {
    case 'sub': {
      const s = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.02, decay: 0.3, sustain: 0.8, release: 0.3 } }));
      s.volume.value = -10;
      return { out: s, play: (t, n, d, v) => s.triggerAttackRelease(n, d, clock(t), v) };
    }
    case 'upright': {
      const lp = keep(new T.Filter(700, 'lowpass'));
      const s = keep(new T.MonoSynth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.008, decay: 0.28, sustain: 0.15, release: 0.25 },
        filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.3, baseFrequency: 160, octaves: 1.8 },
      }));
      s.volume.value = -8;
      s.connect(lp);
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, clock(t), v) };
    }
    case 'picked': {
      const s = keep(new T.MonoSynth({
        oscillator: { type: 'sawtooth' },
        filter: { Q: 2, type: 'lowpass' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.5, release: 0.1 },
        filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.3, baseFrequency: 200, octaves: 2.5 },
      }));
      s.volume.value = -12;
      return { out: s, play: (t, n, d, v) => s.triggerAttackRelease(n, d, clock(t), v) };
    }
    case 'acid': {
      const drive = keep(new T.Distortion(0.25));
      const s = keep(new T.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.003, decay: 0.18, sustain: 0.35, release: 0.06 },
        filter: { Q: 8, type: 'lowpass', rolloff: -24 },
        filterEnvelope: { attack: 0.003, decay: 0.16, sustain: 0.15, release: 0.1, baseFrequency: 250, octaves: 3 },
        portamento: 0.04,
      }));
      s.volume.value = -15;
      s.connect(drive);
      return { out: drive, play: (t, n, d, v) => s.triggerAttackRelease(n, d, clock(t), v) };
    }
  }
}

function makeLead(T: Tone, keep: Keep, kind: Exclude<LeadVoice, 'none'>): MonoVoice {
  const clock = monoClock();
  const vibrato = (s: ToneNS.Synth, depth: number, rate: number): void => {
    keep(new T.LFO({ frequency: rate, min: -depth, max: depth })).connect(s.detune).start();
  };
  switch (kind) {
    case 'sax': {
      const lp = keep(new T.Filter(3200, 'lowpass'));
      const bp = keep(new T.Filter({ frequency: 1200, type: 'bandpass', Q: 1.2 })).connect(lp);
      const s = keep(new T.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.04, decay: 0.2, sustain: 0.7, release: 0.2 } }));
      s.volume.value = -12;
      s.connect(bp);
      vibrato(s, 12, 5);
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, clock(t), v) };
    }
    case 'vibes': {
      const lp = keep(new T.Filter(4200, 'lowpass'));
      const s = keep(new T.PolySynth(T.FMSynth, { harmonicity: 4, modulationIndex: 1.6, envelope: { attack: 0.002, decay: 1.5, sustain: 0, release: 1.6 } }));
      s.maxPolyphony = 10;
      s.volume.value = -12;
      s.connect(lp);
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, clock(t), v) };
    }
    case 'flute': {
      const lp = keep(new T.Filter(3600, 'lowpass'));
      const s = keep(new T.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.06, decay: 0.2, sustain: 0.7, release: 0.25 } }));
      s.volume.value = -12;
      s.connect(lp);
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, clock(t), v) };
    }
    case 'bell': {
      const lp = keep(new T.Filter(6000, 'lowpass'));
      const s = keep(new T.PolySynth(T.FMSynth, { harmonicity: 3.5, modulationIndex: 2.2, envelope: { attack: 0.002, decay: 0.8, sustain: 0, release: 0.8 } }));
      s.maxPolyphony = 10;
      s.volume.value = -11;
      s.connect(lp);
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, clock(t), v) };
    }
    case 'guitar': {
      const lp = keep(new T.Filter(3000, 'lowpass'));
      const dist = keep(new T.Distortion(0.5));
      const s = keep(new T.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.005, decay: 0.3, sustain: 0.6, release: 0.15 } }));
      s.volume.value = -18;
      s.connect(dist.connect(lp));
      vibrato(s, 15, 5.5);
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, clock(t), v) };
    }
    case 'whistle': {
      const lp = keep(new T.Filter(4800, 'lowpass'));
      const s = keep(new T.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.25 } }));
      s.volume.value = -14;
      s.connect(lp);
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, clock(t), v) };
    }
    case 'clarinet': {
      const lp = keep(new T.Filter({ frequency: 1800, type: 'lowpass', Q: 1 }));
      const s = keep(new T.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.03, decay: 0.1, sustain: 0.8, release: 0.15 } }));
      s.volume.value = -18;
      s.connect(lp);
      vibrato(s, 8, 4.5);
      return { out: lp, play: (t, n, d, v) => s.triggerAttackRelease(n, d, clock(t), v) };
    }
  }
}

/** The drum kit: one set of voices per kit, all into the drum bus. Each voice keeps its own monophonic clock. */
function makeDrums(T: Tone, keep: Keep, kit: Exclude<DrumKit, 'none'>, drums: ToneNS.Gain, fx: Fx): Drums {
  const kickM = monoClock();
  const snareM = monoClock();
  const snareBodyM = monoClock();
  const hatM = monoClock();
  const openM = monoClock();
  const membrane = (octaves: number, decay: number, vol: number, pitchDecay: number): ToneNS.MembraneSynth => {
    const m = keep(new T.MembraneSynth({ pitchDecay, octaves, envelope: { attack: 0.001, decay, sustain: 0, release: 0.05 } }));
    m.volume.value = vol;
    return m;
  };
  const noise = (type: 'white' | 'pink', decay: number, attack: number, vol: number, dest: ToneNS.InputNode): ToneNS.NoiseSynth => {
    const n = keep(new T.NoiseSynth({ noise: { type }, envelope: { attack, decay, sustain: 0, release: 0.02 } })).connect(dest);
    n.volume.value = vol;
    return n;
  };

  // kick
  let kick: ToneNS.MembraneSynth;
  switch (kit) {
    case 'break':
      kick = membrane(5, 0.3, -4, 0.05);
      kick.connect(keep(new T.Distortion(0.15)).connect(drums));
      break;
    case 'rock':
      kick = membrane(5, 0.35, -4, 0.05).connect(drums);
      break;
    case 'brush':
      kick = membrane(3, 0.25, -16, 0.05).connect(drums);
      break;
    case 'soft':
      kick = membrane(2, 0.2, -18, 0.05).connect(drums);
      break;
  }

  // snare: a noise snare (with a body under it on the funk and rock kits), a brushed snare or a rim
  let snareNoise: ToneNS.NoiseSynth;
  let snareBody: ToneNS.MembraneSynth | null = null;
  switch (kit) {
    case 'break':
    case 'rock': {
      const bp = keep(new T.Filter({ frequency: 1500, type: 'bandpass' })).fan(drums, fx.snareSend);
      snareNoise = noise('white', 0.16, 0.001, -6, bp);
      snareBody = membrane(2, 0.09, -12, 0.012).connect(drums);
      break;
    }
    case 'brush':
      snareNoise = noise('pink', 0.22, 0.012, -20, keep(new T.Filter({ frequency: 2500, type: 'bandpass' })).connect(drums));
      break;
    case 'soft':
      snareNoise = noise('white', 0.02, 0.001, -20, keep(new T.Filter({ frequency: 3000, type: 'bandpass', Q: 4 })).connect(drums));
      break;
  }

  // hat
  let hat: ToneNS.NoiseSynth;
  switch (kit) {
    case 'break':
    case 'rock':
      hat = noise('white', 0.03, 0.001, -11, keep(new T.Filter(8000, 'highpass')).connect(drums));
      break;
    case 'brush':
      hat = noise('pink', 0.12, 0.001, -24, keep(new T.Filter(5000, 'highpass')).connect(drums));
      break;
    case 'soft':
      hat = noise('white', 0.05, 0.001, -24, keep(new T.Filter({ frequency: 7500, type: 'bandpass' })).connect(drums));
      break;
  }

  // open hat (the ride on the brush kit, a crash-like wash on rock, a shaker on soft)
  let openPlay: (t: number, v: number) => void;
  switch (kit) {
    case 'break': {
      const hp = keep(new T.Filter(7000, 'highpass')).fan(drums, keep(new T.Gain(0.15)).connect(fx.delay));
      const n = noise('white', 0.18, 0.001, -12, hp);
      openPlay = (t, v) => n.triggerAttackRelease(0.12, openM(t), v);
      break;
    }
    case 'rock': {
      const n = noise('white', 0.5, 0.001, -12, keep(new T.Filter(5000, 'highpass')).connect(drums));
      openPlay = (t, v) => n.triggerAttackRelease(0.12, openM(t), v);
      break;
    }
    case 'brush': {
      const ride = keep(new T.MetalSynth({
        envelope: { attack: 0.001, decay: 0.6, release: 0.2 }, harmonicity: 5.1, modulationIndex: 16, resonance: 5000, octaves: 1.2,
      }));
      ride.volume.value = -32;
      ride.connect(drums);
      openPlay = (t, v) => ride.triggerAttackRelease(300, 0.3, openM(t), v);
      break;
    }
    case 'soft': {
      const n = noise('white', 0.12, 0.001, -24, keep(new T.Filter({ frequency: 7500, type: 'bandpass' })).connect(drums));
      openPlay = (t, v) => n.triggerAttackRelease(0.12, openM(t), v);
      break;
    }
  }

  return {
    kick: (t, v) => kick.triggerAttackRelease('C1', 0.3, kickM(t), v),
    snare: (t, v) => {
      snareNoise.triggerAttackRelease(0.16, snareM(t), v);
      snareBody?.triggerAttackRelease('E3', 0.1, snareBodyM(t), v);
    },
    hat: (t, v) => hat.triggerAttackRelease(0.03, hatM(t), v),
    open: (t, v) => openPlay(t, v),
  };
}

/** The bed under everything: vinyl crackle, tape hiss or moving air. */
function makeTexture(T: Tone, keep: Keep, kind: Texture, dest: ToneNS.Gain): void {
  switch (kind) {
    case 'vinyl': {
      const hp = keep(new T.Filter(900, 'highpass')).connect(dest);
      const hiss = keep(new T.Noise('brown')).connect(hp);
      hiss.volume.value = -30;
      hiss.start();
      const crackle = keep(new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.006, sustain: 0, release: 0.01 } })).connect(dest);
      crackle.volume.value = -26;
      keep(new T.Loop((time) => {
        if (Math.random() < 0.12) crackle.triggerAttackRelease(0.006, time, 0.6);
      }, '16n')).start(0);
      return;
    }
    case 'tape': {
      const hp = keep(new T.Filter(3000, 'highpass')).connect(dest);
      const hiss = keep(new T.Noise('pink')).connect(hp);
      hiss.volume.value = -34;
      hiss.start();
      return;
    }
    case 'air': {
      const sweep = keep(new T.AutoFilter({ frequency: 0.05, baseFrequency: 400, octaves: 3 })).connect(dest);
      sweep.start();
      const air = keep(new T.Noise('pink')).connect(sweep);
      air.volume.value = -30;
      air.start();
      return;
    }
    case 'none':
      return;
  }
}
