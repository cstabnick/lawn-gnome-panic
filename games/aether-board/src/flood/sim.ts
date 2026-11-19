// Shallow-water flood on the mountain: virtual pipes (Mei et al. 2007) on one grid per run. Each run has a source at
// its top (a steady stream plus a surge every few seconds), water flows downhill over the real ground height, pools
// in dips, climbs and spills over lips when a surge is deep, drains off rims, and hands its tail to the next run.
// Only the runs near the rider are simulated; the rest are reset dry. Pure.
import { runY, type Island, type World } from '../world';
import { FLOOD, makeRng, type Flood, type FlowSample, type RunGrid } from './types';

const HOLE_BED = -60;
const THIN = 0.004;

/**
 * Priority-flood (Barnes et al. 2014): the water level each cell would settle at if every dip were filled to its spill
 * point, with the grid's edge and the holes as outlets. Returns depth per cell: the ponds the mountain starts with, so
 * a stream runs through straight away instead of spending its first minute filling dips.
 */
function fillDips(bed: Float32Array, hole: Uint8Array, nu: number, nv: number): Float32Array {
  const n = nu * nv;
  const level = new Float64Array(n).fill(Infinity);
  const heapKey: number[] = [];
  const heapIdx: number[] = [];
  const push = (key: number, idx: number): void => {
    let i = heapKey.length;
    heapKey.push(key);
    heapIdx.push(idx);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heapKey[p] <= key) break;
      heapKey[i] = heapKey[p];
      heapIdx[i] = heapIdx[p];
      i = p;
    }
    heapKey[i] = key;
    heapIdx[i] = idx;
  };
  const pop = (): number => {
    const top = heapIdx[0];
    const key = heapKey.pop() as number;
    const idx = heapIdx.pop() as number;
    const len = heapKey.length;
    if (len > 0) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= len) break;
        if (c + 1 < len && heapKey[c + 1] < heapKey[c]) c++;
        if (heapKey[c] >= key) break;
        heapKey[i] = heapKey[c];
        heapIdx[i] = heapIdx[c];
        i = c;
      }
      heapKey[i] = key;
      heapIdx[i] = idx;
    }
    return top;
  };
  for (let j = 0; j < nv; j++) {
    for (let k = 0; k < nu; k++) {
      const i = j * nu + k;
      // outlets: holes, the downhill end and the sides (the top end is a wall)
      if (hole[i] || k === nu - 1 || j === 0 || j === nv - 1) {
        level[i] = bed[i];
        push(bed[i], i);
      }
    }
  }
  while (heapKey.length > 0) {
    const i = pop();
    const k = i % nu;
    const j = (i - k) / nu;
    const nb = [k > 0 ? i - 1 : -1, k < nu - 1 ? i + 1 : -1, j > 0 ? i - nu : -1, j < nv - 1 ? i + nu : -1];
    for (const m of nb) {
      if (m < 0 || level[m] !== Infinity) continue;
      level[m] = Math.max(bed[m], level[i]);
      push(level[m], m);
    }
  }
  const depth = new Float32Array(n);
  // ponds in the dips, plus a thin wet film everywhere so the stream is already running when a run comes into view
  for (let i = 0; i < n; i++) if (!hole[i]) depth[i] = Math.max(FLOOD.film, level[i] - bed[i]);
  return depth;
}

interface RunSim extends RunGrid {
  built: boolean;
  isl: Island;
  /** Depth the run starts with when it enters the window (filled dips). */
  prefill: Float32Array;
  /** Outflow (m³/s) toward +k (downhill), -k, +j, -j, per cell. */
  fA: Float32Array;
  fB: Float32Array;
  fC: Float32Array;
  fD: Float32Array;
  /** Source: period, phase and peak scale of this run's surges. */
  period: number;
  phase: number;
  peak: number;
  /** Water drained off the downhill end (m³ per column j) since the last hand-over. */
  tail: Float32Array;
}

interface Handover {
  at: number;
  to: number;
  /** 0..1 across the run. */
  frac: number;
  vol: number;
}

/** Source flow (m³/s) of a run at time t: a base stream plus a surge with a sharp front and a long ebb. */
export function sourceFlow(period: number, phase: number, peak: number, t: number): number {
  const s = (((t + phase) % period) + period) % period / period;
  const front = Math.min(1, Math.max(0, s / 0.05));
  const rise = front * front * (3 - 2 * front);
  return FLOOD.baseFlow + peak * rise * Math.exp(-Math.max(0, s - 0.05) * 7);
}

export function createFlood(world: World, seed = 1): Flood {
  const rnd = makeRng(seed * 7919 + 13);
  const C = FLOOD.cell;
  const emptyF = new Float32Array(0);
  // Grids are only allocated and filled (ground height, holes, filled dips) the first time a run is simulated.
  const runs: RunSim[] = world.islands.map((isl, i) => {
    const ra = isl.r * isl.stretch;
    const nu = Math.max(4, Math.ceil((2 * ra) / C));
    const nv = Math.max(4, Math.ceil((2 * isl.r) / C));
    const fx = isl.dx;
    const fz = isl.dz;
    const sx = -isl.dz;
    const sz = isl.dx;
    return {
      island: i, isl, built: false, nu, nv,
      ox: isl.cx + fx * (-ra + C / 2) + sx * (-isl.r + C / 2),
      oz: isl.cz + fz * (-ra + C / 2) + sz * (-isl.r + C / 2),
      fx, fz, sx, sz, cell: C,
      bed: emptyF, depth: emptyF, speed: emptyF, prefill: emptyF, hole: new Uint8Array(0),
      fA: emptyF, fB: emptyF, fC: emptyF, fD: emptyF,
      active: false, lo: 0, hi: -1,
      period: FLOOD.periodMin + (FLOOD.periodMax - FLOOD.periodMin) * rnd(),
      phase: rnd() * FLOOD.periodMax,
      peak: FLOOD.surgePeak * (0.7 + 0.6 * rnd()),
      tail: new Float32Array(nv),
    };
  });

  function build(r: RunSim): void {
    if (r.built) return;
    const { nu, nv, isl } = r;
    const n = nu * nv;
    const bed = new Float32Array(n);
    const hole = new Uint8Array(n);
    for (let j = 0; j < nv; j++) {
      for (let k = 0; k < nu; k++) {
        const y = runY(world, isl, r.ox + r.fx * k * C + r.sx * j * C, r.oz + r.fz * k * C + r.sz * j * C);
        const idx = j * nu + k;
        if (y === null) {
          bed[idx] = HOLE_BED;
          hole[idx] = 1;
        } else bed[idx] = y;
      }
    }
    r.bed = bed;
    r.hole = hole;
    r.prefill = fillDips(bed, hole, nu, nv);
    r.depth = new Float32Array(n);
    r.speed = new Float32Array(n);
    r.fA = new Float32Array(n);
    r.fB = new Float32Array(n);
    r.fC = new Float32Array(n);
    r.fD = new Float32Array(n);
    r.built = true;
  }

  const queue: Handover[] = [];
  let focusRun = 0;
  let anchorPos: { x: number; z: number; island: number } | null = null;
  let acc = 0;
  let time = 0;
  let stepCount = 0;
  const STEP = 1 / FLOOD.simHz;

  /** Rows k1..k2 (inclusive) take the run's starting water (ponds and the wet film). */
  function initRows(r: RunSim, k1: number, k2: number): void {
    for (let j = 0; j < r.nv; j++) {
      for (let k = k1; k <= k2; k++) {
        const i = j * r.nu + k;
        r.depth[i] = r.prefill[i];
        r.fA[i] = r.fB[i] = r.fC[i] = r.fD[i] = 0;
        r.speed[i] = 0;
      }
    }
  }

  /** Rows k1..k2 go dry (the rider has left them behind). */
  function clearRows(r: RunSim, k1: number, k2: number): void {
    for (let j = 0; j < r.nv; j++) {
      for (let k = k1; k <= k2; k++) {
        const i = j * r.nu + k;
        r.depth[i] = 0;
        r.fA[i] = r.fB[i] = r.fC[i] = r.fD[i] = 0;
        r.speed[i] = 0;
      }
    }
  }

  function clearRun(r: RunSim): void {
    if (!r.built) return;
    r.depth.fill(0);
    r.fA.fill(0);
    r.fB.fill(0);
    r.fC.fill(0);
    r.fD.fill(0);
    r.speed.fill(0);
    r.tail.fill(0);
  }

  /** Cell coordinates of (x, z) in run r (float k, j), or null outside its grid. */
  function locate(r: RunSim, x: number, z: number): { k: number; j: number } | null {
    const dx = x - r.ox;
    const dz = z - r.oz;
    const k = (dx * r.fx + dz * r.fz) / C;
    const j = (dx * r.sx + dz * r.sz) / C;
    if (k < -0.5 || j < -0.5 || k > r.nu - 0.5 || j > r.nv - 0.5) return null;
    return { k: Math.min(r.nu - 1, Math.max(0, k)), j: Math.min(r.nv - 1, Math.max(0, j)) };
  }

  /**
   * Only a band of rows around the rider is simulated: FLOOD.windowBackM behind to FLOOD.windowAheadM ahead, and the top
   * of the next run if the band reaches past this run's end. Rows entering the band start with the run's ponds and film;
   * rows left behind go dry.
   */
  function updateWindows(): void {
    const want = new Map<number, [number, number]>();
    const a = anchorPos ? anchorPos.island : focusRun;
    const ra = runs[a];
    let kA = 0;
    if (anchorPos && ra) {
      const loc = locate(ra, anchorPos.x, anchorPos.z);
      if (loc) kA = Math.round(loc.k);
    }
    if (ra) {
      const back = Math.round(FLOOD.windowBackM / C);
      const ahead = Math.round(FLOOD.windowAheadM / C);
      want.set(a, [Math.max(0, kA - back), Math.min(ra.nu - 1, kA + ahead)]);
      const over = kA + ahead - (ra.nu - 1);
      const next = runs[a + 1];
      if (over > 0 && next) want.set(a + 1, [0, Math.min(next.nu - 1, over + Math.round(20 / C))]);
    }
    for (const r of runs) {
      const w = want.get(r.island);
      if (!w) {
        if (r.active) {
          clearRun(r);
          r.active = false;
          r.hi = -1;
        }
        continue;
      }
      build(r);
      const [lo, hi] = w;
      if (!r.active) {
        r.depth.fill(0);
        initRows(r, lo, hi);
        r.active = true;
      } else {
        if (lo > r.lo) clearRows(r, r.lo, Math.min(lo - 1, r.hi));
        if (hi > r.hi) initRows(r, Math.max(lo, r.hi + 1), hi);
      }
      r.lo = lo;
      r.hi = hi;
    }
  }

  function stepRun(r: RunSim, dt: number): void {
    const { nu, nv, bed, depth, hole, fA, fB, fC, fD, lo, hi } = r;
    const g = FLOOD.gravity;
    const area = C * C;

    // 1. outflow fluxes from the height differences
    for (let j = 0; j < nv; j++) {
      for (let k = lo; k <= hi; k++) {
        const idx = j * nu + k;
        if (hole[idx]) {
          fA[idx] = fB[idx] = fC[idx] = fD[idx] = 0;
          continue;
        }
        const b = bed[idx];
        const d = depth[idx];
        const H = b + d;
        const dm = Math.max(d, 0.1);
        const dpow = Math.pow(dm, 4 / 3);
        const flux = (old: number, nb: number, nd: number): number => {
          const Hn = nb + nd;
          const open = Math.max(0, Math.max(H, Hn) - Math.max(b, nb));
          const f0 = Math.max(0, old + dt * g * open * (H - Hn));
          // Manning-style friction (rough snow-melt channel), implicit so it can never reverse the flow
          const fr = FLOOD.friction + (g * FLOOD.manning2 * (f0 / (C * dm))) / dpow;
          const f = f0 / (1 + dt * fr);
          return d < THIN && f < 1e-4 ? 0 : f;
        };
        // downhill: past the band's lower edge (or the run's end) is a drain; only the run's end hands water on
        fA[idx] = k < hi ? flux(fA[idx], bed[idx + 1], depth[idx + 1]) : flux(fA[idx], HOLE_BED, 0);
        // nothing flows uphill out of the band
        fB[idx] = k > lo ? flux(fB[idx], bed[idx - 1], depth[idx - 1]) : 0;
        fC[idx] = j < nv - 1 ? flux(fC[idx], bed[idx + nu], depth[idx + nu]) : flux(fC[idx], HOLE_BED, 0);
        fD[idx] = j > 0 ? flux(fD[idx], bed[idx - nu], depth[idx - nu]) : flux(fD[idx], HOLE_BED, 0);
        const out = fA[idx] + fB[idx] + fC[idx] + fD[idx];
        const have = d * area;
        if (out * dt > have) {
          const s = have / (out * dt);
          fA[idx] *= s;
          fB[idx] *= s;
          fC[idx] *= s;
          fD[idx] *= s;
        }
      }
    }

    // 2. volumes: gather what neighbours send, subtract what we send. Holes just absorb.
    for (let j = 0; j < nv; j++) {
      for (let k = lo; k <= hi; k++) {
        const idx = j * nu + k;
        if (hole[idx]) {
          depth[idx] = 0;
          continue;
        }
        let dv = -(fA[idx] + fB[idx] + fC[idx] + fD[idx]);
        if (k > lo) dv += fA[idx - 1];
        if (k < hi) dv += fB[idx + 1];
        if (j > 0) dv += fC[idx - nu];
        if (j < nv - 1) dv += fD[idx + nu];
        if (k === nu - 1) r.tail[j] += fA[idx] * dt;
        depth[idx] = Math.max(0, depth[idx] + (dv * dt) / area);
      }
    }
  }

  /** Flow rates through a cell (m³/s along +k and +j), averaged over its two faces on each axis. */
  function cellFlow(r: RunSim, k: number, j: number): { wu: number; wv: number } {
    const i = j * r.nu + k;
    const inA = k > r.lo ? r.fA[i - 1] : 0;
    const inB = k < r.hi ? r.fB[i + 1] : 0;
    const inC = j > 0 ? r.fC[i - r.nu] : 0;
    const inD = j < r.nv - 1 ? r.fD[i + r.nu] : 0;
    return { wu: 0.5 * (inA - r.fB[i] + r.fA[i] - inB), wv: 0.5 * (inC - r.fD[i] + r.fC[i] - inD) };
  }

  function refreshSpeed(r: RunSim): void {
    for (let j = 0; j < r.nv; j++) {
      for (let k = r.lo; k <= r.hi; k++) {
        const i = j * r.nu + k;
        const d = r.depth[i];
        if (d < 0.02) {
          r.speed[i] = 0;
          continue;
        }
        const f = cellFlow(r, k, j);
        r.speed[i] = Math.min(FLOOD.maxFlowSpeed, Math.hypot(f.wu, f.wv) / (Math.max(d, 0.3) * C));
      }
    }
  }

  /** Pour `vol` m³ over columns jc ± half and rows k0..k0+rows-1 (clamped to the simulated band). */
  function addToRun(r: RunSim, frac: number, vol: number, half = 2, k0 = 0, rows = 3): void {
    const jc = Math.min(r.nv - 1, Math.max(0, Math.round(frac * (r.nv - 1))));
    const ka = Math.max(r.lo, k0);
    const kb = Math.min(r.hi, k0 + rows - 1);
    let n = 0;
    for (let jj = -half; jj <= half; jj++) for (let k = ka; k <= kb; k++) {
      const j = jc + jj;
      if (j >= 0 && j < r.nv && !r.hole[j * r.nu + k]) n++;
    }
    if (n === 0) return;
    const dd = vol / (n * C * C);
    for (let jj = -half; jj <= half; jj++) for (let k = ka; k <= kb; k++) {
      const j = jc + jj;
      if (j >= 0 && j < r.nv && !r.hole[j * r.nu + k]) r.depth[j * r.nu + k] += dd;
    }
  }

  function tick(dt: number): void {
    time += dt;
    stepCount++;
    updateWindows();
    // sources and hand-overs
    for (const r of runs) {
      if (!r.active) continue;
      const q = sourceFlow(r.period, r.phase, r.peak, time) * dt;
      if (anchorPos && r.island === anchorPos.island) {
        // the rider's run: a long spring travels with the rider, from FLOOD.anchorBehind m uphill of them to
        // FLOOD.anchorAhead m downhill, so they ride the tail of a wave whose front is ahead
        const loc = locate(r, anchorPos.x, anchorPos.z);
        if (loc) {
          const k0 = Math.round(loc.k) - Math.round(FLOOD.anchorBehind / C);
          const rows = Math.round((FLOOD.anchorBehind + FLOOD.anchorAhead) / C) + 3;
          // a steady carpet deep enough to float on, with the surge on top at a fraction of its usual size
          const qa = (FLOOD.baseFlow + (q / dt - FLOOD.baseFlow) * FLOOD.anchorSurge) * FLOOD.anchorFlowScale * dt;
          addToRun(r, loc.j / Math.max(1, r.nv - 1), qa, Math.floor(r.nv * FLOOD.anchorHalf), k0, rows);
          continue;
        }
      }
      // any other run in the band is fed from its top
      if (r.lo === 0) addToRun(r, 0.5, q, Math.floor(r.nv * FLOOD.sourceHalfWidth), 0, 3);
    }
    for (let i = queue.length - 1; i >= 0; i--) {
      const h = queue[i];
      if (h.at > time) continue;
      queue.splice(i, 1);
      const r = runs[h.to];
      if (r && r.active && r.lo === 0) addToRun(r, h.frac, h.vol);
    }
    for (const r of runs) {
      if (!r.active) continue;
      stepRun(r, dt);
      if (stepCount % 2 === 0) refreshSpeed(r);
      // hand the drained tail to the next run
      const next = r.island + 1;
      if (next < runs.length) {
        const delay = FLOOD.linkDelay[world.links[r.island] ?? 'jump'];
        for (let j = 0; j < r.nv; j++) {
          if (r.tail[j] > 1e-3) {
            queue.push({ at: time + delay, to: next, frac: j / Math.max(1, r.nv - 1), vol: r.tail[j] });
            r.tail[j] = 0;
          }
        }
      } else r.tail.fill(0);
    }
  }

  function sampleRun(r: RunSim, x: number, z: number, out: FlowSample): boolean {
    if (!r.active) return false;
    const loc = locate(r, x, z);
    if (!loc || loc.k < r.lo || loc.k > r.hi || r.hi - r.lo < 1) return false;
    const k0 = Math.min(r.hi - 1, Math.floor(loc.k));
    const j0 = Math.min(r.nv - 2, Math.floor(loc.j));
    const tk = Math.min(1, Math.max(0, loc.k - k0));
    const tj = loc.j - j0;
    let depth = 0;
    let bed = 0;
    let wu = 0;
    let wv = 0;
    let wsum = 0;
    for (let dj = 0; dj < 2; dj++) {
      for (let dk = 0; dk < 2; dk++) {
        const w = (dk ? tk : 1 - tk) * (dj ? tj : 1 - tj);
        const k = k0 + dk;
        const j = j0 + dj;
        const i = j * r.nu + k;
        if (r.hole[i]) continue;
        depth += w * r.depth[i];
        bed += w * r.bed[i];
        wsum += w;
        if (r.depth[i] > 0.02) {
          const f = cellFlow(r, k, j);
          const dm = Math.max(r.depth[i], 0.3) * C;
          wu += (w * f.wu) / dm;
          wv += (w * f.wv) / dm;
        }
      }
    }
    if (wsum < 0.5) return false;
    depth /= wsum;
    bed /= wsum;
    if (depth < 0.01) return false;
    out.depth = depth;
    out.bedY = bed;
    out.surfaceY = bed + depth;
    let vx = (wu * r.fx + wv * r.sx) / wsum;
    let vz = (wu * r.fz + wv * r.sz) / wsum;
    const sp = Math.hypot(vx, vz);
    if (sp > FLOOD.maxFlowSpeed) {
      vx *= FLOOD.maxFlowSpeed / sp;
      vz *= FLOOD.maxFlowSpeed / sp;
    }
    out.vx = vx;
    out.vz = vz;
    return true;
  }

  return {
    get time() {
      return time;
    },
    runs,
    step(dt: number): void {
      acc += Math.min(dt, 0.1);
      while (acc >= STEP) {
        tick(STEP);
        acc -= STEP;
      }
    },
    restart(firstSurgeIn: number): void {
      time = 0;
      acc = 0;
      stepCount = 0;
      queue.length = 0;
      anchorPos = null;
      for (const r of runs) {
        clearRun(r);
        r.active = false;
        r.hi = -1;
      }
      // run 0's surge front is born firstSurgeIn seconds from now
      runs[0].phase = runs[0].period - firstSurgeIn;
    },
    anchor(x: number, z: number, island: number): void {
      anchorPos = { x, z, island };
    },
    focus(island: number): void {
      focusRun = Math.max(0, Math.min(runs.length - 1, island));
    },
    sample(x: number, z: number, hint: number, out: FlowSample): boolean {
      for (const i of [hint, hint + 1, hint - 1, hint + 2]) {
        const r = runs[i];
        if (r && sampleRun(r, x, z, out)) return true;
      }
      out.depth = out.vx = out.vz = out.bedY = out.surfaceY = 0;
      return false;
    },
    volume(): number {
      let v = 0;
      for (const r of runs) if (r.active) for (let i = 0; i < r.depth.length; i++) v += r.depth[i];
      return v * C * C;
    },
  };
}
