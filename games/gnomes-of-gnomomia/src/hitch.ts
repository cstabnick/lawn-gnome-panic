// Hitch profiler, on with ?hitches (?hitches=<ms> sets the threshold; default 80 ms). Times each system in the main
// loop and logs a console warning for any frame or long task over the threshold, naming the systems that took the time.
// Off, it costs one boolean check per system.
const params = typeof location === 'undefined' ? null : new URLSearchParams(location.search);
export const hitchesOn = !!params && params.has('hitches');
const THRESHOLD_MS = Number(params?.get('hitches')) || 80;

const times = new Map<string, number>();
let frameStart = 0;

/** Runs `fn` and adds its time under `name` for this frame. */
export function timed<T>(name: string, fn: () => T): T {
  if (!hitchesOn) return fn();
  const t0 = performance.now();
  try {
    return fn();
  } finally {
    times.set(name, (times.get(name) ?? 0) + performance.now() - t0);
  }
}

export function beginFrame(): void {
  if (!hitchesOn) return;
  times.clear();
  frameStart = performance.now();
}

export function endFrame(): void {
  if (!hitchesOn) return;
  const total = performance.now() - frameStart;
  if (total < THRESHOLD_MS) return;
  const parts = [...times].filter(([, ms]) => ms >= 2).sort((a, b) => b[1] - a[1]).map(([n, ms]) => `${n} ${ms.toFixed(0)}ms`);
  console.warn(`[hitch] frame ${total.toFixed(0)}ms: ${parts.join(', ') || '(nothing timed)'}`);
}

// Long tasks outside the frame (timers, network messages, promise callbacks such as a music rebuild).
if (hitchesOn && typeof PerformanceObserver !== 'undefined') {
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.duration >= THRESHOLD_MS) console.warn(`[hitch] long task ${e.duration.toFixed(0)}ms at ${e.startTime.toFixed(0)}`);
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch { /* not supported */ }
}
