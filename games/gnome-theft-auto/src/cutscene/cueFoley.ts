// Batch-3 cutscene foley (script.ts FoleySfx) and the character intro stinger. Procedural WebAudio only, built from the
// helpers in cueSynth.ts. cueAudio.ts plays them through a pan and gain per call; each synth must finish within 2.4 s
// (cueAudio disconnects the per-call nodes after 2.5 s).
import type { FoleySfx } from './script';

/** Schedule one sound into `out` at AudioContext time `t`. Peak gain about 0.1..0.6. */
export type Synth = (c: AudioContext, out: AudioNode, t: number) => void;

/** One synth per FoleySfx. Stubs until E09 issue 05 fills them: each is silent. */
export const FOLEY: Record<FoleySfx, Synth> = {
  cloth: () => {},
  paper: () => {},
  pour: () => {},
  clink: () => {},
  chair: () => {},
  keys: () => {},
  zip: () => {},
  bell: () => {},
  crunch: () => {},
  creak: () => {},
  thunder: () => {},
  gulp: () => {},
  tap: () => {},
  pop: () => {},
  clatter: () => {},
  latch: () => {},
  squeak: () => {},
  shovel: () => {},
  flutter: () => {},
  static: () => {},
  snap: () => {},
  rustle: () => {},
};

/** The 'intro' stinger (a character intro card): stub until E09 issue 05. */
export const INTRO_STINGER: Synth = () => {};
