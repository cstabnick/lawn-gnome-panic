// Keeping an online game alive in a hidden tab.
//
// Browsers stop requestAnimationFrame in a background tab, so a game that sends its state from the frame loop goes
// silent and the server drops it after MATCH_SILENT_S. Plain setInterval is no fix on its own: a hidden tab holds it to
// once a second, and after about 5 minutes Chrome's intensive throttling holds chained timers to once a MINUTE. Timers
// inside a dedicated Worker are not throttled that way, so every timer here ticks from one shared Worker and falls back
// to setInterval where Workers are unavailable (tests, very old browsers).

type Tick = () => void;

let worker: Worker | null | undefined; // undefined = not tried yet, null = unavailable
let nextId = 1;
const ticks = new Map<number, Tick>();

const WORKER_SRC = `
const timers = new Map();
onmessage = (e) => {
  const { id, ms } = e.data;
  if (ms > 0) timers.set(id, setInterval(() => postMessage(id), ms));
  else { clearInterval(timers.get(id)); timers.delete(id); }
};`;

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  worker = null;
  try {
    if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return null;
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    const w = new Worker(url);
    w.onmessage = (e: MessageEvent<number>) => ticks.get(e.data)?.();
    worker = w;
  } catch {
    worker = null; // CSP without blob: workers, or no Worker support: use setInterval
  }
  return worker;
}

/**
 * Like setInterval(fn, ms), but keeps ticking at about that rate in a hidden tab. Use it for heartbeats and anything
 * else that must reach the server while the tab is in the background. Returns a function that stops it.
 */
export function steadyInterval(fn: () => void, ms: number): () => void {
  const w = getWorker();
  if (!w) {
    const h = setInterval(fn, ms);
    return () => clearInterval(h);
  }
  const id = nextId++;
  ticks.set(id, fn);
  w.postMessage({ id, ms: Math.max(1, ms) });
  return () => {
    if (!ticks.delete(id)) return;
    w.postMessage({ id, ms: 0 });
  };
}

/** Longest step handed to whileHidden callbacks, in seconds. A hidden tick can arrive late; sub-step past this. */
export const HIDDEN_MAX_DT = 0.1;

/**
 * Calls step(dt) about `hz` times a second, but only while the tab is hidden (when requestAnimationFrame does not run).
 * dt is in seconds. A late tick is split into steps of at most HIDDEN_MAX_DT (and at most 1 s in all), so physics never
 * sees one giant step. Drive the game's simulation and net sends from it, and skip rendering. Returns a stop function.
 *
 * Typical use, next to the frame loop:
 *   whileHidden((dt) => { if (online) tickSimAndNet(dt); });
 */
export function whileHidden(step: (dt: number) => void, hz = 15): () => void {
  let last = 0;
  const stop = steadyInterval(() => {
    if (typeof document === 'undefined' || !document.hidden) {
      last = 0;
      return;
    }
    const now = performance.now();
    if (last === 0) {
      last = now;
      return;
    }
    let left = Math.min((now - last) / 1000, 1);
    last = now;
    while (left > 1e-4) {
      const dt = Math.min(left, HIDDEN_MAX_DT);
      step(dt);
      left -= dt;
    }
  }, Math.round(1000 / hz));
  return stop;
}

/**
 * Calls fn whenever the tab goes from visible to hidden (tab switch, app switch, phone locked).
 * Single-player games use it to open their pause menu. Returns a function that removes the listener.
 */
export function onTabHidden(fn: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  const h = (): void => {
    if (document.hidden) fn();
  };
  document.addEventListener('visibilitychange', h);
  return () => document.removeEventListener('visibilitychange', h);
}
