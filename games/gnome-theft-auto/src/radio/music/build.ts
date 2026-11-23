// Plays a Turfton FM song (a SongSpec, composed by compose.ts) with Tone.js. STUB: a plain chord loop until the
// Subsoil-style mix lands. The exported signature is final.
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '@lawn/music';
import { midiToNote } from '@lawn/music';
import { compose, titleSeed } from './compose';
import type { SongSpec } from './spec';

export interface BuildOpts {
  /** Where the broadcast is in this song, seconds (playSong starts the transport here; the song loops). */
  offsetSeconds?: number;
}

export function buildRadioSong(T: Tone, keep: Keep, out: ToneNS.Volume, spec: SongSpec, opts: BuildOpts = {}): void {
  void opts;
  const comp = compose(spec, titleSeed(spec.title));
  T.getTransport().bpm.value = comp.bpm;
  const six = 15 / comp.bpm;
  const bar = six * comp.grid;
  const synth = keep(new T.PolySynth(T.Synth)).connect(out);
  synth.volume.value = -18;
  const part = keep(new T.Part<[number, { midi: readonly number[]; len: number; vel: number }]>((time, ev) => {
    try { synth.triggerAttackRelease(ev.midi.map(midiToNote), ev.len * six, time, ev.vel); } catch { /* skip */ }
  }, comp.events.filter((e) => e.layer === 'chord').map((e) => [e.bar * bar + e.pos * six, e])));
  part.loop = true;
  part.loopEnd = comp.bars * bar;
  part.start(0);
}
