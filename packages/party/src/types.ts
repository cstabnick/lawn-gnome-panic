// The party minigame contract. A game surfaces party-sized slices of itself by exporting
//   export const minigames: AnyMinigame[]   from games/<game>/src/minigames/index.ts
// built from the game's OWN modules (not copies). The runner does everything else: seats, CPUs, net sync,
// countdown, time cap, cleanup. Size rules: packages/party/README.md.
import type * as THREE from 'three';
import type { GnomeLook } from '@lawn/gnome';
import type { SliceReport } from './report';

export type SeatIndex = 0 | 1 | 2 | 3;
export const SEAT_COUNT = 4;

export interface SeatInfo {
  seat: SeatIndex;
  name: string;
  /** Model look, hat already in the seat colour. Pass to createGnomeModel. */
  look: GnomeLook;
  /** 0xRRGGBB, the seat's colour everywhere. */
  color: number;
  cpu: boolean;
}

export interface MinigameMeta {
  /** Unique across all games, kebab-case: '<short game>-<slice>' reads best ('golf-hole'). */
  id: string;
  title: string;
  /** The game folder that surfaces it ('gnome-golf'). */
  game: string;
  /** One sentence: how you win. */
  goal: string;
  /** One sentence: the controls, for touch and keyboard. */
  controls: string;
  /** Hard time cap, 15..90. The runner ends the slice here with result(s, true). */
  maxSeconds: number;
}

/** The input device every slice reads; filled from keyboard, mouse and touch. */
export interface PadState {
  /** Stick, -1..1 each, +x right, +y up (WASD / arrows, or a touch drag from where the finger went down). */
  x: number;
  y: number;
  /** Primary button held: Space, Enter, or a pointer held on the canvas. */
  a: boolean;
  /** True only on the frame a went down. */
  aPressed: boolean;
  /** Pointer in normalised device coordinates (-1..1, +y up), or null if none seen yet. */
  pointer: { x: number; y: number; down: boolean } | null;
}

export interface ViewCtx {
  /** A fresh, empty scene. Add your own lights and sky. Every geometry, material and texture in it is disposed afterwards. */
  scene: THREE.Scene;
  /** Its aspect is kept right for you; you place and aim it. */
  camera: THREE.PerspectiveCamera;
  /** For capabilities (anisotropy, max texture size) and shadow settings. Never resize it or change its target. */
  renderer: THREE.WebGLRenderer;
  /** An empty div for your overlay. Removed afterwards. */
  ui: HTMLElement;
  seats: readonly SeatInfo[];
  /** My seat, or null when watching. */
  mySeat: SeatIndex | null;
}

export interface MinigameView<S, I> {
  /** Every frame on every screen. s is the host's live state, or the latest snapshot (15 a second) elsewhere:
   *  smooth movement yourself (obj.position.lerp(target, 1 - Math.exp(-dt * 15))), or replay a deterministic
   *  simulation from data in s (a shot's inputs and start time). */
  render(s: Readonly<S>, dt: number): void;
  /** Every frame while mySeat !== null and the slice runs. Input is a LEVEL sampled 15 times a second online:
   *  for a one-off action use a counter (shots: number) incremented here, never a one-frame true. */
  input(pad: Readonly<PadState>, s: Readonly<S>): I;
  dispose?(): void;
}

/** S and I are plain JSON (numbers, strings, booleans, null, arrays, objects). S stays under 2 KB. */
export interface MinigameDef<S, I> {
  meta: MinigameMeta;
  /** Host only. Use rng, never Math.random, in init, step and cpu. */
  init(seats: readonly SeatInfo[], rng: () => number): S;
  /** Host only, fixed steps of 1/60 s. inputs[seat] = that seat's latest input, null until it sends one. Mutate s. */
  step(s: S, inputs: readonly (I | null)[], dt: number, rng: () => number): void;
  /** Host only, once per step for each CPU seat. Memory a CPU needs lives in S, updated by step. */
  cpu(s: Readonly<S>, seat: SeatIndex, rng: () => number): I;
  /** Host only, after every step: null while playing, else places[seat] (0 = 1st, ties share).
   *  Must return places when timeUp is true. */
  result(s: Readonly<S>, timeUp: boolean): number[] | null;
  /** Host only, once, right after result returned places: what happened, as self-describing stats per seat
   *  (strokes, pins, metres) plus a headline and notes. The party shows it on its results card. Optional: without
   *  it the card shows places only. `seats` gives the names for a headline ('Gnina holed out in 2!'). See report.ts. */
  report?(s: Readonly<S>, places: readonly number[], seats: readonly SeatInfo[]): SliceReport;
  /** Never called by init/step/cpu/result, so a headless test needs no WebGL. */
  createView(ctx: ViewCtx): MinigameView<S, I>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyMinigame = MinigameDef<any, any>;

/** Fixed simulation step of every slice, seconds. */
export const STEP_S = 1 / 60;
/** How often snapshots (host) and inputs (clients) are sent online. */
export const SEND_HZ = 15;
