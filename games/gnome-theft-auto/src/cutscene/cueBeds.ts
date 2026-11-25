// The batch-3 cutscene ambience beds (script.ts ExtraBed): snow, shore, cave, market, meadow, storm, office, garden.
// cueAudio.ts startBed hands each builder a BedKit; the builder wires looping layers into kit.gain and may schedule
// spot sounds with kit.every. Procedural WebAudio only (no files). The sound bible (docs/design/gnome-theft-auto/
// sound-design.md) says which place uses which bed.
import type { ExtraBed } from './script';

/** What a bed builder gets: its output gain and small helpers that register every node, so the bed halts cleanly. */
export interface BedKit {
  c: AudioContext;
  /** The bed's output (cueAudio fades it in and out). Connect the last node of each layer here. */
  gain: GainNode;
  /** A looping white-noise source, already started. */
  loop(): AudioBufferSourceNode;
  /** A biquad filter. */
  filt(type: BiquadFilterType, f: number, q?: number): BiquadFilterNode;
  /** A gain node at a fixed level. */
  level(v: number): GainNode;
  /** A sine LFO of `rate` Hz and `depth` added to `target` (a filter frequency or a gain). */
  lfo(rate: number, depth: number, target: AudioParam): void;
  /** Connect nodes in a chain: link(a, b, c) = a -> b -> c. */
  link(...ns: AudioNode[]): void;
  /**
   * Call `fn(t)` again and again at random gaps of minS..maxS seconds (the first after one gap) until the bed stops;
   * `t` is the AudioContext time to schedule at. Use for spot sounds: a drip, a gull, a cup clink, far thunder.
   */
  every(minS: number, maxS: number, fn: (t: number) => void): void;
}

export type BedBuilder = (k: BedKit) => void;

/** One builder per ExtraBed. Stubs until E09 issue 06 fills them: each is silent. */
export const EXTRA_BED_BUILDERS: Record<ExtraBed, BedBuilder> = {
  snow: () => {},
  shore: () => {},
  cave: () => {},
  market: () => {},
  meadow: () => {},
  storm: () => {},
  office: () => {},
  garden: () => {},
};
