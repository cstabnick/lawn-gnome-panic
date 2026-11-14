// Snapshot interpolation for remote players: keeps a short buffer of timestamped samples and shows the remote
// a little in the past, blending between the two samples either side of that moment. Movement plays back at the
// sender's real pace, so packets that arrive bunched up or late (relay jitter) no longer show as stutter.
//
// A sample is a fixed-length array of numbers (say [x, y, z, yaw]). Indexes listed in `angles` blend along the
// shortest arc; indexes in `steps` switch at the sample's moment instead (flags, stages). Pass the sender's own clock (sentMs, e.g. its performance.now()) when the message carries it:
// the buffer then spaces samples by when they were taken, not by when they arrived. Without it, arrival time is used.
//
// The delay adapts: about one send interval plus the recent worst lateness, kept within minDelayMs..maxDelayMs.

export interface InterpOptions {
  /** Indexes of values that are angles in radians. */
  angles?: readonly number[];
  /** Indexes of values that are discrete (a flag, a stage, a list index): they switch over, never blend. */
  steps?: readonly number[];
  /** Indexes of values that form a position; a jump farther than snapDist between samples snaps instead of sliding. */
  pos?: readonly number[];
  /** Distance that counts as a teleport (respawn, new hole). Default Infinity (never snap). */
  snapDist?: number;
  /** Bounds on the playback delay (ms). Defaults 50 and 350. */
  minDelayMs?: number;
  maxDelayMs?: number;
  /** When the next sample is late, keep moving along the last velocity for at most this long (ms). Default 120. */
  maxExtrapolateMs?: number;
}

interface Sample { t: number; v: number[] }

const MAX_SAMPLES = 32;
const TWO_PI = Math.PI * 2;

function wrap(a: number): number {
  return ((a + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
}

export class Interp {
  private samples: Sample[] = [];
  /** Local time minus sender time, as low as it has been seen (the fastest delivery), drifting up slowly. */
  private offset: number | null = null;
  /** Recent worst lateness behind `offset` (ms), decaying. */
  private jitter = 0;
  /** Smoothed gap between samples (ms). */
  private interval = 66;
  private delay: number;
  private readonly angles: readonly number[];
  private readonly steps: readonly number[];
  private readonly pos: readonly number[];
  private readonly snapDist: number;
  private readonly minDelay: number;
  private readonly maxDelay: number;
  private readonly maxExtrap: number;

  constructor(opts: InterpOptions = {}) {
    this.angles = opts.angles ?? [];
    this.steps = opts.steps ?? [];
    this.pos = opts.pos ?? [];
    this.snapDist = opts.snapDist ?? Infinity;
    this.minDelay = opts.minDelayMs ?? 50;
    this.maxDelay = opts.maxDelayMs ?? 350;
    this.maxExtrap = opts.maxExtrapolateMs ?? 120;
    this.delay = Math.min(this.maxDelay, Math.max(this.minDelay, 100));
  }

  /** True once a sample has been pushed (and not cleared). */
  get ready(): boolean {
    return this.samples.length > 0;
  }

  /** Forget the buffer, so the next push shows at once (respawn, teleport, new round). Timing estimates are kept. */
  clear(): void {
    this.samples.length = 0;
    this.prev = null;
  }

  /** Add a sample. sentMs: the sender's clock when it was taken, if the message carries one. */
  push(values: readonly number[], sentMs?: number, nowMs: number = performance.now()): void {
    const sent = sentMs ?? nowMs;
    const o = nowMs - sent;
    if (this.offset === null || o < this.offset) this.offset = o;
    else this.offset += (o - this.offset) * 0.002; // follow slow clock drift
    const late = o - this.offset;
    this.jitter = late > this.jitter ? late : this.jitter * 0.97 + late * 0.03;

    const t = sent + this.offset;
    const last = this.samples[this.samples.length - 1];
    if (last && t <= last.t) return; // out of order or duplicate
    if (last) {
      const gap = Math.min(t - last.t, 1000);
      this.interval += (gap - this.interval) * 0.1;
      if (this.isJump(last.v, values)) this.clear();
    }
    this.samples.push({ t, v: values.slice() });
    if (this.samples.length > MAX_SAMPLES) this.samples.shift();

    const target = Math.min(this.maxDelay, Math.max(this.minDelay, this.interval * 1.1 + this.jitter + 10));
    this.delay += (target - this.delay) * 0.1;
  }

  /** Writes the value to show now into out (same length as the samples). False when there is nothing yet. */
  sample(out: number[], nowMs: number = performance.now()): boolean {
    const s = this.samples;
    if (s.length === 0) return false;
    const rt = nowMs - this.delay;
    // Drop samples fully behind the playback time, keeping the one at or before it (and the one dropped last,
    // for extrapolation).
    while (s.length >= 2 && s[1].t <= rt) this.prev = s.shift() ?? null;
    const a = s[0];
    if (rt <= a.t) {
      copy(out, a.v);
      return true;
    }
    if (s.length >= 2) {
      const b = s[1];
      this.blend(out, a.v, b.v, (rt - a.t) / (b.t - a.t));
      return true;
    }
    // Past the newest sample (the next one is late): carry on along the last segment for a moment, then hold.
    const p = this.prev;
    if (p && a.t > p.t && a.t - p.t < 1000) {
      const ahead = Math.min(rt - a.t, this.maxExtrap);
      this.blend(out, p.v, a.v, 1 + ahead / (a.t - p.t));
    } else {
      copy(out, a.v);
    }
    return true;
  }

  /** The newest sample already dropped from the buffer, for extrapolation. */
  private prev: Sample | null = null;

  private isJump(a: readonly number[], b: readonly number[]): boolean {
    if (this.pos.length === 0 || this.snapDist === Infinity) return false;
    let d2 = 0;
    for (const i of this.pos) d2 += (b[i] - a[i]) ** 2;
    return d2 > this.snapDist * this.snapDist;
  }

  private blend(out: number[], a: readonly number[], b: readonly number[], f: number): void {
    for (let i = 0; i < a.length; i++) out[i] = a[i] + (b[i] - a[i]) * f;
    for (const i of this.angles) out[i] = a[i] + wrap(b[i] - a[i]) * f;
    for (const i of this.steps) out[i] = f >= 1 ? b[i] : a[i];
  }
}

function copy(out: number[], v: readonly number[]): void {
  for (let i = 0; i < v.length; i++) out[i] = v[i];
}
