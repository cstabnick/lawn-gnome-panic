// Winter sports (E12): a timed run down Snowdrop Slope (start line, slalom gates, finish line). Pure.
import type { RunDef, RunEvent, RunState } from './types';

/** A run waiting at its start line. */
export function newRun(run: RunDef): RunState {
  return { run, phase: 'ready', t: 0, next: 0, passed: 0, missed: 0 };
}

/** Crossing of the line z = lineZ heading south (+z) during the move (px, pz) -> (x, z); null if not crossed. */
function southCross(px: number, pz: number, x: number, z: number, lineZ: number): number | null {
  if (!(pz < lineZ && lineZ <= z)) return null;
  return px + (x - px) * ((lineZ - pz) / (z - pz));
}

/** Advance the run: the rider moved from (px, pz) to (x, z) over dt seconds. */
export function stepRun(r: RunState, px: number, pz: number, x: number, z: number, dt: number): RunEvent {
  const { run } = r;
  if (r.phase === 'ready') {
    const cx = southCross(px, pz, x, z, run.start.z);
    if (cx === null || Math.abs(cx - run.start.x) > run.start.half) return null;
    r.phase = 'running';
    r.t = 0;
    r.next = 0;
    return { t: 'start' };
  }
  if (r.phase === 'running') {
    r.t += dt;
    if (r.next < run.gates.length) {
      const g = run.gates[r.next];
      const cx = southCross(px, pz, x, z, g.z);
      if (cx !== null) {
        const index = r.next;
        const ok = Math.abs(cx - g.x) <= g.half;
        if (ok) r.passed++;
        else r.missed++;
        r.next++;
        return { t: 'gate', index, ok };
      }
    }
    const fx = southCross(px, pz, x, z, run.finish.z);
    if (fx === null || Math.abs(fx - run.finish.x) > run.finish.half) return null;
    r.missed += run.gates.length - r.next;
    r.next = run.gates.length;
    r.phase = 'done';
    const seconds = r.t + r.missed * run.penalty;
    return { t: 'finish', result: { id: run.id, seconds, missed: r.missed, clean: r.missed === 0 } };
  }
  return null;
}

/** "0:31.4" (m:ss.t). */
export function formatTime(seconds: number): string {
  const tenths = Math.round(seconds * 10);
  const m = Math.floor(tenths / 600);
  const s = Math.floor((tenths % 600) / 10);
  const d = tenths % 10;
  return `${m}:${String(s).padStart(2, '0')}.${d}`;
}
