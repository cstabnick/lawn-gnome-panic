/* eslint-disable @typescript-eslint/no-explicit-any */
// The minigame runner: plays any MinigameDef (countdown, host stepping with CPU and remote inputs, snapshots,
// time cap, host takeover, cleanup).
import type * as THREE from 'three';
import { buildReport, type MinigameReport } from './report';
import { mulberry32 } from './rng';
import {
  SEND_HZ,
  STEP_S,
  type AnyMinigame,
  type MinigameView,
  type PadState,
  type SeatIndex,
  type SeatInfo,
} from './types';

export const COUNTDOWN_S = 3;
const GO_S = 0.6;
const MAX_STEPS_PER_FRAME = 8;
const SEND_EVERY_S = 1 / SEND_HZ;
const EPS = 1e-9;

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
  /** Host only: the minigame is over (result returned places, or the time cap). Called once. `report` describes
   *  the round (see report.ts); it is always there, with only places and links when the slice has no report(). */
  onDone(places: number[], report: MinigameReport): void;
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

type Phase = 'count' | 'go' | 'play' | 'finished';

// A plain div, or (outside a browser, in tests) a stub with the few members the runner touches.
function makeEl(): HTMLElement {
  if (typeof document !== 'undefined') return document.createElement('div');
  const stub = { style: {} as Record<string, string>, textContent: '', appendChild() {}, removeChild() {} };
  return stub as unknown as HTMLElement;
}

function cloneState<T>(v: T): T {
  return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}

type DisposableMaterial = { dispose(): void; map?: { dispose(): void } | null };

// Scene traverse callback. Materials and textures are disposed for any object that has one (Mesh, Sprite, Line,
// Points). Geometry is disposed for everything with one except a Sprite: every Sprite shares one module-level
// geometry, so disposing it would break every sprite on the page. Disposing twice is harmless in three.js.
function disposeObject(obj: unknown): void {
  const m = obj as {
    isSprite?: boolean;
    geometry?: { dispose(): void };
    material?: DisposableMaterial | DisposableMaterial[] | null;
  };
  if (!m.isSprite) m.geometry?.dispose();
  const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
  for (const mat of mats) {
    mat.map?.dispose();
    mat.dispose();
  }
}

export function startMinigame(o: RunnerOpts): Runner {
  const def = o.def;
  const rng = mulberry32(o.seed);
  const seats: SeatInfo[] = o.seats.map((s) => ({ ...s }));
  let isHost = o.isHost;
  let state: any = null;
  let snap: { t: number; s: unknown } | null = null;
  let elapsed = 0;
  let phase: Phase = 'count';
  let countT = 0;
  let goT = 0;
  let acc = 0;
  let snapTimer = 0;
  let inputTimer = 0;
  let myInput: unknown = null;
  const remote: unknown[] = [null, null, null, null];
  let done = false;
  let broken = false;
  let disposed = false;
  let view: MinigameView<any, any> | null = null;

  // DOM: root div in uiParent, the view's ui inside it, then the countdown label and the timer.
  const root = makeEl();
  root.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  o.uiParent.appendChild(root);
  const viewUi = makeEl();
  viewUi.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  root.appendChild(viewUi);
  const label = makeEl();
  label.style.cssText =
    'position:absolute;left:0;right:0;top:38%;text-align:center;font:800 min(18vw,96px) system-ui;color:#fff;text-shadow:0 4px 8px #000';
  root.appendChild(label);
  const timer = makeEl();
  timer.style.cssText = 'position:absolute;top:12px;right:76px;font:700 28px system-ui;color:#fff;text-shadow:0 2px 4px #000';
  root.appendChild(timer);

  function fail(e: unknown): void {
    if (broken) return;
    broken = true;
    console.error(`[party] slice ${def.meta.id} threw; ending it`, e);
    // The host ends the slice with every seat in place 0, so a broken slice never freezes the party.
    if (isHost && !done) finish([0, 0, 0, 0], false);
  }

  function guard<T>(fn: () => T): T | undefined {
    if (broken || disposed) return undefined;
    try {
      return fn();
    } catch (e) {
      fail(e);
      return undefined;
    }
  }

  /** The report for the final places. A slice whose report() throws still gets the places-only report. */
  function makeReport(places: number[], timeUp: boolean): MinigameReport {
    let slice = null;
    if (!broken && state != null && def.report) {
      try {
        slice = def.report(state, places);
      } catch (e) {
        console.error(`[party] slice ${def.meta.id} report threw; showing places only`, e);
      }
    }
    return buildReport(def.meta, seats, places, timeUp, slice);
  }

  function finish(places: number[], sendFinal = true, timeUp = false): void {
    if (done) return;
    done = true;
    phase = 'finished';
    label.textContent = 'FINISH!';
    o.onDone(places, makeReport(places, timeUp));
    if (sendFinal && state != null) o.sendSnapshot?.(elapsed, state);
  }

  function stepOnce(): void {
    const inputs = seats.map((seat) => {
      if (seat.cpu) return guard(() => def.cpu(state, seat.seat, rng)) ?? null;
      if (seat.seat === o.mySeat) return myInput;
      return remote[seat.seat] ?? null;
    });
    if (broken) return;

    guard(() => def.step(state, inputs, STEP_S, rng));
    if (broken) return;
    const places0 = guard(() => def.result(state, false));
    if (broken) return;
    elapsed += STEP_S;

    let places: number[] | null = places0 ?? null;
    let timeUp = false;
    if (elapsed >= def.meta.maxSeconds - EPS) {
      timeUp = places0 == null;
      places = guard(() => def.result(state, true)) ?? null;
      if (broken) return;
      if (!places) {
        fail(new Error(`${def.meta.id}: result(s, true) returned null at the time cap`));
        return;
      }
    }

    snapTimer += STEP_S;
    if (snapTimer >= SEND_EVERY_S - EPS) {
      snapTimer = 0;
      o.sendSnapshot?.(elapsed, state);
    }
    if (places) finish(places, true, timeUp);
  }

  function advancePhase(dt: number): void {
    if (phase === 'count') {
      countT += dt;
      if (countT >= COUNTDOWN_S) {
        phase = 'go';
        goT = 0;
        label.textContent = 'GO!';
      } else {
        label.textContent = String(Math.ceil(COUNTDOWN_S - countT));
      }
    } else if (phase === 'go') {
      goT += dt;
      if (goT >= GO_S) {
        phase = 'play';
        label.textContent = '';
      }
    }
  }

  // Start: init the host's state, then the view.
  if (isHost) state = guard(() => def.init(seats, rng)) ?? null;
  view =
    guard(() =>
      def.createView({
        scene: o.scene,
        camera: o.camera,
        renderer: o.renderer,
        ui: viewUi,
        seats,
        mySeat: o.mySeat,
      }),
    ) ?? null;

  function update(dt: number): void {
    if (disposed || broken) return;
    const p = guard(() => o.pad()) as PadState | undefined;
    if (broken) return;

    advancePhase(dt);

    // Input: every frame while the game runs and I have a seat.
    if (phase === 'play' && o.mySeat !== null && state != null && p !== undefined && view) {
      const v = guard(() => view!.input(p, state));
      if (broken) return;
      myInput = v;
      if (!isHost && o.sendInput) {
        inputTimer += dt;
        if (inputTimer >= SEND_EVERY_S - EPS) {
          inputTimer = 0;
          o.sendInput(myInput);
        }
      }
    }

    // Host: fixed steps, at most MAX_STEPS_PER_FRAME per frame, the rest of the time is dropped.
    if (phase === 'play' && isHost && state != null && !done) {
      acc += dt;
      let n = 0;
      while (acc >= STEP_S - EPS && n < MAX_STEPS_PER_FRAME && !done && !broken) {
        acc -= STEP_S;
        n++;
        stepOnce();
      }
      if (acc >= STEP_S) acc = 0;
      if (broken) return;
    }

    if (state != null && view) {
      guard(() => view!.render(state, dt));
      if (broken) return;
    }

    const t = isHost ? elapsed : (snap?.t ?? 0);
    timer.textContent = String(Math.max(0, Math.ceil(def.meta.maxSeconds - t)));
  }

  function receiveSnapshot(t: number, s: unknown): void {
    if (disposed) return;
    if (snap && t < snap.t) return;
    snap = { t, s };
    if (!isHost) state = s;
  }

  function becomeHost(): void {
    if (disposed || broken || isHost) return;
    isHost = true;
    if (snap) {
      state = guard(() => cloneState(snap!.s)) ?? null;
      elapsed = snap.t;
    } else {
      state = guard(() => def.init(seats, rng)) ?? null;
      elapsed = 0;
    }
    acc = 0;
    snapTimer = 0;
    // Still in the countdown and nothing was played yet: keep counting down (the screen keeps showing 3/2/1/GO);
    // stepping starts at GO through advancePhase.
    if (!snap && (phase === 'count' || phase === 'go')) return;
    phase = 'play';
    label.textContent = '';
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    try {
      view?.dispose?.();
    } catch (e) {
      console.error(`[party] slice ${def.meta.id} dispose threw`, e);
    }
    try {
      o.scene.traverse(disposeObject);
      o.scene.clear();
    } catch (e) {
      console.error(`[party] slice ${def.meta.id} scene cleanup threw`, e);
    }
    try {
      o.uiParent.removeChild(root);
    } catch {
      // Already detached.
    }
  }

  return {
    update,
    receiveInput(seat, i) {
      if (!disposed) remote[seat] = i;
    },
    receiveSnapshot,
    becomeHost,
    setCpu(seat) {
      if (!disposed) seats[seat].cpu = true;
    },
    dispose,
  };
}
