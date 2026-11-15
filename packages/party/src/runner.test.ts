import { describe, expect, it, vi } from 'vitest';
import type * as THREE from 'three';
import { COUNTDOWN_S, startMinigame, type RunnerOpts } from './runner';
import type { AnyMinigame, PadState, SeatInfo } from './types';

const FRAME = 1 / 60;
const COUNTDOWN_FRAMES_S = COUNTDOWN_S + 0.6;

const noPad = (): PadState => ({ x: 0, y: 0, a: false, aPressed: false, pointer: null });
const fakeUi = { appendChild() {}, removeChild() {} } as unknown as HTMLElement;
const fakeScene = { traverse() {}, clear() {} } as unknown as THREE.Scene;
const fakeCamera = {} as THREE.PerspectiveCamera;
const fakeRenderer = {} as THREE.WebGLRenderer;

function seatsOf(cpuSeats: number[]): SeatInfo[] {
  return [0, 1, 2, 3].map((k) => ({
    seat: k as SeatInfo['seat'],
    name: `s${k}`,
    look: {} as SeatInfo['look'],
    color: 0,
    cpu: cpuSeats.includes(k),
  }));
}

interface S { n: number }

/** A stub slice: each step adds 1 to n; the round ends at n >= finishAt with `places`, or at the time cap with [3,2,1,0]. */
function makeDef(finishAt: number, places: number[] = [0, 1, 2, 3], maxSeconds = 15) {
  return {
    meta: { id: 'test-slice', title: 'Test', game: 'test', goal: 'g', controls: 'c', maxSeconds },
    init: vi.fn((): S => ({ n: 0 })),
    step: vi.fn((s: S) => {
      s.n += 1;
    }),
    cpu: vi.fn((_s: S, seat: number) => ({ seat })),
    result: vi.fn((s: S, timeUp: boolean) => (timeUp ? [3, 2, 1, 0] : s.n >= finishAt ? places : null)),
    createView: () => ({ render() {}, input() { return 1; } }),
  };
}

function opts(def: ReturnType<typeof makeDef>, extra: Partial<RunnerOpts> = {}): RunnerOpts {
  return {
    def: def as unknown as AnyMinigame,
    scene: fakeScene,
    camera: fakeCamera,
    renderer: fakeRenderer,
    uiParent: fakeUi,
    seats: seatsOf([1, 2, 3]),
    mySeat: 0,
    isHost: true,
    seed: 7,
    pad: noPad,
    sendSnapshot: null,
    sendInput: null,
    onDone: () => {},
    ...extra,
  };
}

function run(r: { update(dt: number): void }, seconds: number): void {
  const n = Math.round(seconds / FRAME);
  for (let i = 0; i < n; i++) r.update(FRAME);
}

describe('startMinigame', () => {
  it('calls onDone once with the places from result', () => {
    const def = makeDef(30, [0, 1, 2, 3]);
    const onDone = vi.fn();
    const r = startMinigame(opts(def, { onDone }));
    run(r, COUNTDOWN_FRAMES_S + 2);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith([0, 1, 2, 3]);
    run(r, 3);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('ends at the time cap with result(s, true)', () => {
    const def = makeDef(Infinity, [0, 1, 2, 3], 15);
    const onDone = vi.fn();
    const r = startMinigame(opts(def, { onDone }));
    run(r, COUNTDOWN_FRAMES_S + 16);
    expect(def.result).toHaveBeenCalledWith(expect.anything(), true);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith([3, 2, 1, 0]);
  });

  it('does not step during the countdown', () => {
    const def = makeDef(Infinity);
    const r = startMinigame(opts(def));
    run(r, COUNTDOWN_S - 0.5);
    expect(def.step).not.toHaveBeenCalled();
  });

  it('asks cpu() only for cpu seats', () => {
    const def = makeDef(Infinity);
    const r = startMinigame(opts(def, { seats: seatsOf([1, 2, 3]), mySeat: 0 }));
    run(r, COUNTDOWN_FRAMES_S + 1);
    const seatsAsked = new Set(def.cpu.mock.calls.map((c) => c[1]));
    expect(seatsAsked.has(1)).toBe(true);
    expect(seatsAsked.has(0)).toBe(false);
    expect(seatsAsked.has(2) && seatsAsked.has(3)).toBe(true);
    r.dispose();
  });

  it('setCpu makes a human seat use cpu()', () => {
    const def = makeDef(Infinity);
    const r = startMinigame(opts(def, { seats: seatsOf([1, 2, 3]), mySeat: null }));
    run(r, COUNTDOWN_FRAMES_S + 0.5);
    expect(def.cpu.mock.calls.some((c) => c[1] === 0)).toBe(false);
    r.setCpu(0);
    run(r, 0.5);
    expect(def.cpu.mock.calls.some((c) => c[1] === 0)).toBe(true);
    r.dispose();
  });

  it('becomeHost during the countdown does not step until COUNTDOWN_S has passed', () => {
    const def = makeDef(Infinity);
    const r = startMinigame(opts(def, { isHost: false, mySeat: 0 }));
    run(r, 1);
    r.becomeHost();
    run(r, 1.5); // 2.5 s into the countdown
    expect(def.step).not.toHaveBeenCalled();
    run(r, 2); // 4.5 s: past the countdown and GO
    expect(def.step).toHaveBeenCalled();
    r.dispose();
  });

  it('becomeHost continues from the last snapshot', () => {
    const def = makeDef(Infinity);
    const sendSnapshot = vi.fn();
    const r = startMinigame(opts(def, { isHost: false, mySeat: 0, sendSnapshot, sendInput: vi.fn() }));
    r.receiveSnapshot(5, { n: 100 });
    r.becomeHost();
    run(r, 1);
    expect(def.step).toHaveBeenCalled();
    // Stepping started from n = 100, so it is well above a fresh init (0) after one second.
    const finalN = def.step.mock.calls[def.step.mock.calls.length - 1][0].n;
    expect(finalN).toBeGreaterThanOrEqual(150);
    expect(finalN).toBeLessThanOrEqual(161);
    expect(sendSnapshot.mock.calls.length).toBeGreaterThan(0);
    expect(sendSnapshot.mock.calls[0][0]).toBeGreaterThanOrEqual(5);
    r.dispose();
  });
});
