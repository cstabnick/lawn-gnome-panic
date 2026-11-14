~~~~text
Epic: 2 Systems and the golf and bowling slices
Depends on: none

## Goal
In packages/party (@lawn/party): the minigame runner, the shared input pad, and playMinigame (a game playing its own slice by itself). The runner runs any MinigameDef: a 3-2-1 countdown, fixed 1/60 s steps on the host with CPU and remote inputs, snapshots to other screens, input from other screens to the host, the time cap, a host taking over mid-game, and cleanup. This is what makes a minigame need no netcode.

## Read first
- packages/party/src/types.ts: the whole contract (MinigameDef, MinigameView, ViewCtx, PadState, SeatInfo)
- packages/party/template/minigame.ts: a working slice to run
- packages/party/src/testkit.ts: runHeadless (the same stepping rules, without a view: match them)
- packages/party/src/rng.ts: mulberry32
- packages/party/src/runner.ts, pad.ts, standalone.ts: the stubs you replace

## Change
- packages/party/src/pad.ts: implement createPad.
- packages/party/src/runner.ts: implement startMinigame. Add `export const COUNTDOWN_S = 3;` at its top.
- packages/party/src/standalone.ts: implement playMinigame.
- packages/party/src/runner.test.ts (new): vitest, see Done when.

## Contract (keep these exports exactly)
// pad.ts
import type { PadState } from './types';
export interface Pad { read(): PadState; dispose(): void }
export function createPad(canvas: HTMLCanvasElement): Pad;
// read() is called once per frame by its owner (gnome-party's main.ts, or playMinigame) and returns a fresh object.
// Keys (window keydown/keyup, ignore when event.target is an input): WASD and arrows → x/y (-1, 0, 1 per axis, +y = W/Up);
// Space or Enter → a. Pointer (pointerdown/move/up/cancel on canvas, setPointerCapture on down):
// pointer = NDC of the last position ({ x: (cx/w)*2-1, y: -(cy/h)*2+1, down }); a is also true while a pointer is down;
// while down, the drag from the down point in CSS px, divided by 60 and clamped to -1..1, gives x/y when no key is held
// (+y = dragging up). aPressed = a is true now and was false on the previous read(). Clear keys on window blur.

// runner.ts
import type * as THREE from 'three';
import type { AnyMinigame, PadState, SeatIndex, SeatInfo } from './types';
export interface RunnerOpts {
  def: AnyMinigame;
  scene: THREE.Scene;                 // fresh and empty; the runner hands it to def.createView
  camera: THREE.PerspectiveCamera;
  uiParent: HTMLElement;              // the runner appends its own div here (the view's ctx.ui is a child div of that)
  seats: readonly SeatInfo[];
  mySeat: SeatIndex | null;
  isHost: boolean;
  seed: number;
  renderer: THREE.WebGLRenderer;      // passed through to ViewCtx
  pad: () => PadState;                // the owner's pad.read: call it at most once per update
  /** Host: broadcast a snapshot (t = seconds since GO, s = state). null when offline. */
  sendSnapshot: ((t: number, s: unknown) => void) | null;
  /** Client: send my latest input to the host. null when offline or host. */
  sendInput: ((i: unknown) => void) | null;
  /** Host only: the minigame is over (result returned places, or the time cap). Called once. */
  onDone(places: number[]): void;
}
export interface Runner {
  update(dt: number): void;
  /** Host: a remote seat's latest input. */
  receiveInput(seat: SeatIndex, i: unknown): void;
  /** Client: the host's latest snapshot. */
  receiveSnapshot(t: number, s: unknown): void;
  /** This screen just became host: continue from the last snapshot (or init if none came yet). */
  becomeHost(): void;
  /** A human left: their seat is now played by def.cpu. */
  setCpu(seat: SeatIndex): void;
  dispose(): void;
}
export function startMinigame(o: RunnerOpts): Runner;

// standalone.ts: how a game plays its own slice (games/<game>/#minigame), with no party and no server.
import type { AnyMinigame, SeatInfo } from './types';
export interface PlayOpts {
  canvas: HTMLCanvasElement;
  /** The game's #ui element: append your own div to it, never restyle it. */
  ui: HTMLElement;
  /** Default: me (getMyGnome()?.look ?? GNORMAN_LOOK from '@lawn/gnome', name getMyGnome()?.name ?? 'You') in seat 0 + 3 CPUs
   *  named Gnorbert, Gnelly, Gnash; seat colours 0xff5a5a, 0x4fd8ff, 0x5cff7a, 0xffd54f put on look.hat. */
  seats?: SeatInfo[];
  /** Default true: after the result card, play again with a new seed. */
  loop?: boolean;
  onDone?(places: number[]): void;
}
export function playMinigame(def: AnyMinigame, o: PlayOpts): { stop(): void };
// Creates a WebGLRenderer on canvas (antialias, pixel ratio min(dpr, 2), shadowMap enabled, PCFShadowMap), a
// PerspectiveCamera(55, aspect, 0.1, 5000) kept to the window size, createPad(canvas), and a requestAnimationFrame loop
// (dt clamped to 0.1). Cancels touchstart/touchend default (except on inputs) so phones do not zoom.
// Runs startMinigame({ isHost: true, mySeat: 0, sendSnapshot: null, sendInput: null, seed: Date.now() & 0x7fffffff, ... }).
// On done: a result card in its div ("1st Gnash", ... with seat colours) for 3 s, then (loop) dispose the runner and start again
// in a fresh scene. stop() ends the loop, disposes the runner, the pad and the renderer, and removes its div.

Behaviour:
- Start: rng = mulberry32(o.seed). Host: state = def.init(seats, rng). Client: state = null until the first snapshot.
  view = def.createView({ scene, camera, renderer, ui: <child div>, seats, mySeat }). Seats are copied; setCpu flips seat.cpu in the copy.
- Countdown: for COUNTDOWN_S, show a big centred "3", "2", "1", then "GO!" for 0.6 s in the runner's div; no steps, but
  render() runs (host renders init state; clients render once a snapshot exists, else nothing).
- After GO, host: accumulate dt, run fixed steps of 1/60 s (at most 8 per frame, drop the rest): before each step,
  inputs[seat] = cpu seats → def.cpu(state, seat, rng); my seat → my latest input; remote seats → latest received (null before).
  def.step(state, inputs, 1/60, rng); places = def.result(state, false); elapsed += 1/60; if elapsed >= meta.maxSeconds,
  places = def.result(state, true). On places: onDone(places) once, stop stepping, keep rendering, show "FINISH!".
  Snapshots: sendSnapshot(elapsed, state) every 1/15 s (state is plain JSON; send it as is), and one final one on finish.
- Every frame on every screen, when the game runs and mySeat !== null and state exists: myInput = view.input(pad(), state).
  Client: sendInput(myInput) every 1/15 s.
- Client: receiveSnapshot keeps the newest by t, and is what render() gets. Top-right timer: ceil(maxSeconds - t).
- becomeHost(): isHost = true; state = structuredClone(last snapshot) or def.init if none; elapsed = its t; carry on stepping.
- Rendering: view.render(state, dt) each frame. The hub's camera aspect is kept by main.ts; you never change it.
- dispose(): view.dispose?.(); traverse the scene disposing every Mesh/Sprite geometry, material (arrays too) and material.map;
  scene.clear(); remove the runner's div.
- Wrap view and def calls in try/catch; on an exception, console.error it and (host) end with every seat in place 0, so a
  broken minigame never freezes the party.

## Done when
- `npx tsc --noEmit -p packages/party` passes.
- `npx vitest run src/runner.test.ts` (from packages/party; environment 'jsdom' is NOT installed,
  so test only logic that needs no DOM by passing a uiParent of `{ appendChild() {}, removeChild() {} } as unknown as HTMLElement`
  and a stub def whose createView returns { render(){}, input(){ return 1 } }, and a fake scene `{ traverse(){}, clear(){} }`;
  if `document` is needed for the div, guard with `typeof document !== 'undefined'`) passes, testing: onDone is called once with the
  def's places; time cap calls result(s, true); cpu() is called only for cpu seats; setCpu switches a seat to cpu();
  becomeHost continues from the last snapshot's t.

## Out of scope
types.ts and testkit.ts (do not change the contract), index.ts, template/, games/gnome-party (its main.ts wires the runner), every game.
~~~~
