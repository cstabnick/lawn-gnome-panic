// Authoritative world for Mower Chain. Pure TypeScript: no Phaser, no DOM. Runs in the host's browser (and offline).
import { TUNING } from './config';
import type { MowerInput, MowerSnap, Snapshot, WorldEvent } from './config';
import { botInput } from './bot';

const T = TUNING;
const SAMPLE = 2;            // trail sampling distance, world units
const GOLD_TTL = 60;         // seconds before an uneaten gold pellet vanishes
const DROP_EVERY = 0.25;     // a boosting mower drops a grass pellet this often (s)
const BOT_RESPAWN_S = 2;     // dead bots come back after this long
const BOT_THINK_S = 0.1;     // bots re-decide this often (s)
const MAX_GOLD_SPILL = 60;

const BOT_NAMES = [
  'Mulchy', 'Clippy', 'Edgar', 'Trimble', 'Sprout', 'Bristle', 'Hedgie', 'Dandy', 'Clover', 'Thatch',
  'Rake Rick', 'Weedy', 'Pruner', 'Shrubbs', 'Mowgli', 'Turfy', 'Grassper', 'Crabgrass', 'Topsoil', 'Shears',
];
const BOT_COLORS = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xc77dff, 0xff9f1c, 0x2ec4b6, 0xf15bb5];

interface Pellet {
  x: number;
  y: number;
  kind: number;   // 0 grass, 1 gold
  value: number;
  born: number;   // sim time, seconds
}

interface Mower {
  id: number;
  name: string;
  color: number;
  alive: boolean;
  protectedS: number;
  boosting: boolean;
  score: number;
  x: number;
  y: number;
  heading: number;
  input: MowerInput;
  /** Flat [x, y, ...] of sampled head positions, oldest first, newest last. Body segments are read back along it. */
  trail: number[];
  /** Flat [x, y, ...] of body segment positions, front to back. Rebuilt every step. */
  body: number[];
  dropT: number;
  nextThink: number;
  deathTime: number;
}

/** Small seeded PRNG (mulberry32). Returns values in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wrapAngle(a: number): number {
  const t = Math.PI * 2;
  return ((((a + Math.PI) % t) + t) % t) - Math.PI;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}

function segCountFor(score: number): number {
  return Math.min(T.MAX_SEGS, T.START_SEGS + Math.floor(score / T.SCORE_PER_SEG));
}

/** The authoritative game world. Runs in the host's browser (and offline). No Phaser, no DOM: pure TypeScript. */
export class World {
  private rng: () => number;
  private time = 0;
  private mowers = new Map<number, Mower>();
  private pellets: Pellet[] = [];
  private events: WorldEvent[] = [];

  constructor(seed: number) {
    this.rng = mulberry32(seed);
    this.topUpPellets();
  }

  /** Spawn a mower (alive, spawn-protected) at a random free spot. Replaces an existing mower with that id. */
  addMower(id: number, name: string, color: number): void {
    this.createMower(id, name, color);
    this.events.push({ kind: 'spawn', id, name });
  }

  removeMower(id: number): void {
    this.mowers.delete(id);
  }

  setInput(id: number, input: MowerInput): void {
    const m = this.mowers.get(id);
    if (m) m.input = { angle: input.angle, boost: input.boost };
  }

  /** If that mower is dead, spawn it again (score reset). */
  respawn(id: number): void {
    const m = this.mowers.get(id);
    if (m && !m.alive) this.revive(m);
  }

  /** Advance the world by dt seconds (use fixed dt = 1 / TUNING.SIM_HZ). Also drives bots and tops up pellets. */
  step(dt: number): void {
    this.time += dt;
    this.manageBots();
    for (const m of this.mowers.values()) if (m.alive) this.move(m, dt);
    for (const m of this.mowers.values()) if (m.alive) this.rebuildBody(m);
    this.eatPellets();
    this.resolveDeaths();
    this.thinkBots();
    this.topUpPellets();
  }

  /** now = host performance.now() in ms. */
  snapshot(now: number): Snapshot {
    return { t: now, mowers: this.liveSnaps(), pellets: this.pelletFlat() };
  }

  /** Events since the last call, then clears them. */
  drainEvents(): WorldEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  // ---- mowers ----

  private createMower(id: number, name: string, color: number): Mower {
    const m: Mower = {
      id, name, color,
      alive: false, protectedS: 0, boosting: false, score: 0,
      x: 0, y: 0, heading: 0,
      input: { angle: 0, boost: false },
      trail: [], body: [],
      dropT: 0, nextThink: 0, deathTime: 0,
    };
    this.mowers.set(id, m);
    this.placeAndLive(m);
    return m;
  }

  private revive(m: Mower): void {
    this.placeAndLive(m);
    this.events.push({ kind: 'spawn', id: m.id, name: m.name });
  }

  /** Puts a mower at a random spot far from the edge, away from other live heads, with a straight body behind it. */
  private placeAndLive(m: Mower): void {
    const M = T.SPAWN_MARGIN;
    const span = T.WORLD_SIZE - 2 * M;
    let bx = M + span / 2;
    let by = M + span / 2;
    let bestD = -1;
    for (let k = 0; k < 12; k++) {
      const x = M + this.rng() * span;
      const y = M + this.rng() * span;
      let d = Infinity;
      for (const o of this.mowers.values()) {
        if (o === m || !o.alive) continue;
        d = Math.min(d, Math.hypot(o.x - x, o.y - y));
      }
      if (d > bestD) { bestD = d; bx = x; by = y; }
    }
    m.x = bx;
    m.y = by;
    m.heading = this.rng() * Math.PI * 2;
    m.alive = true;
    m.protectedS = T.RESPAWN_PROTECT_S;
    m.boosting = false;
    m.score = 0;
    m.dropT = 0;
    m.nextThink = this.time;
    m.input = { angle: m.heading, boost: false };
    // Lay the trail straight behind the head so the start body is already in place.
    const c = Math.cos(m.heading);
    const s = Math.sin(m.heading);
    m.trail.length = 0;
    const lead = Math.ceil(((T.START_SEGS + 2) * T.SEG_SPACING) / SAMPLE);
    for (let k = lead; k >= 1; k--) m.trail.push(bx - c * k * SAMPLE, by - s * k * SAMPLE);
    m.trail.push(bx, by);
    this.rebuildBody(m);
  }

  private move(m: Mower, dt: number): void {
    if (m.protectedS > 0) m.protectedS = Math.max(0, m.protectedS - dt);

    const diff = wrapAngle(m.input.angle - m.heading);
    const maxTurn = T.TURN_RATE * dt;
    m.heading = wrapAngle(m.heading + clamp(diff, -maxTurn, maxTurn));

    m.boosting = m.input.boost && m.score >= T.MIN_BOOST_SCORE;
    const speed = m.boosting ? T.BOOST_SPEED : T.SPEED;
    m.x += Math.cos(m.heading) * speed * dt;
    m.y += Math.sin(m.heading) * speed * dt;

    if (m.boosting) {
      m.score = Math.max(0, m.score - T.BOOST_COST * dt);
      m.dropT += dt;
      while (m.dropT >= DROP_EVERY) {
        m.dropT -= DROP_EVERY;
        const n = m.body.length;
        const tx = n >= 2 ? m.body[n - 2] : m.x;
        const ty = n >= 2 ? m.body[n - 1] : m.y;
        this.pellets.push({ x: tx, y: ty, kind: 0, value: T.GRASS_VALUE, born: this.time });
      }
    } else {
      m.dropT = 0;
    }

    const t = m.trail;
    const lx = t[t.length - 2];
    const ly = t[t.length - 1];
    if (Math.hypot(m.x - lx, m.y - ly) >= SAMPLE) t.push(m.x, m.y);
    const maxNums = Math.ceil(((T.MAX_SEGS + 4) * T.SEG_SPACING) / SAMPLE) * 2;
    if (t.length > maxNums + 400) t.splice(0, t.length - maxNums);
  }

  /** Body segment i sits (i+1)*SEG_SPACING back along the trail. One walk back along the trail places them all. */
  private rebuildBody(m: Mower): void {
    const n = segCountFor(m.score);
    const out = m.body;
    out.length = 0;
    const t = m.trail;
    let cx = m.x;
    let cy = m.y;
    let travelled = 0;
    let j = t.length - 2;
    for (let i = 0; i < n; i++) {
      const want = (i + 1) * T.SEG_SPACING;
      while (travelled < want && j >= 0) {
        const px = t[j];
        const py = t[j + 1];
        const seg = Math.hypot(px - cx, py - cy);
        if (travelled + seg >= want) {
          const f = (want - travelled) / seg;
          cx += (px - cx) * f;
          cy += (py - cy) * f;
          travelled = want;
        } else {
          travelled += seg;
          cx = px;
          cy = py;
          j -= 2;
        }
      }
      // Past the start of the trail: the segment stays on its last known point.
      out.push(cx, cy);
    }
  }

  private eatPellets(): void {
    const r2 = (T.HEAD_R + T.PELLET_R) ** 2;
    let w = 0;
    for (const p of this.pellets) {
      let eater: Mower | undefined;
      for (const m of this.mowers.values()) {
        if (!m.alive) continue;
        const dx = p.x - m.x;
        const dy = p.y - m.y;
        if (dx * dx + dy * dy < r2) { eater = m; break; }
      }
      if (eater) eater.score += p.value;
      else this.pellets[w++] = p;
    }
    this.pellets.length = w;
  }

  /** A head touching another live mower's body dies. Spawn-protected mowers cannot be killed and their bodies do not kill. */
  private resolveDeaths(): void {
    const W = T.WORLD_SIZE;
    const alive = [...this.mowers.values()].filter((m) => m.alive);
    const r2 = (T.HEAD_R + T.SEG_R) ** 2;
    const deaths: { m: Mower; by?: Mower }[] = [];
    for (const a of alive) {
      if (a.protectedS > 0) continue;
      if (a.x < 0 || a.y < 0 || a.x > W || a.y > W) {
        deaths.push({ m: a });
        continue;
      }
      let hit: Mower | undefined;
      search: for (const b of alive) {
        if (b === a || b.protectedS > 0) continue;
        const bb = b.body;
        for (let i = 0; i < bb.length; i += 2) {
          const dx = bb[i] - a.x;
          const dy = bb[i + 1] - a.y;
          if (dx * dx + dy * dy < r2) { hit = b; break search; }
        }
      }
      if (hit) deaths.push({ m: a, by: hit });
    }
    for (const d of deaths) this.kill(d.m, d.by);
  }

  private kill(m: Mower, by?: Mower): void {
    m.alive = false;
    m.boosting = false;
    m.deathTime = this.time;
    if (by) this.events.push({ kind: 'kill', id: m.id, by: by.id, name: m.name, byName: by.name });
    else this.events.push({ kind: 'wall', id: m.id, name: m.name });

    const W = T.WORLD_SIZE;
    const gold = Math.min(MAX_GOLD_SPILL, Math.floor((m.score * T.DEATH_DROP_FRACTION) / T.GOLD_VALUE));
    const n = m.body.length / 2;
    for (let i = 0; i < gold; i++) {
      let x = m.x;
      let y = m.y;
      if (n > 0) {
        const k = Math.floor(this.rng() * n) * 2;
        x = m.body[k];
        y = m.body[k + 1];
      }
      this.pellets.push({
        x: clamp(x, 0, W), y: clamp(y, 0, W), kind: 1, value: T.GOLD_VALUE, born: this.time,
      });
    }
  }

  // ---- pellets ----

  /** Keeps PELLET_COUNT grass pellets and removes gold pellets older than GOLD_TTL. */
  private topUpPellets(): void {
    let w = 0;
    for (const p of this.pellets) {
      if (p.kind === 1 && this.time - p.born > GOLD_TTL) continue;
      this.pellets[w++] = p;
    }
    this.pellets.length = w;
    let grass = 0;
    for (const p of this.pellets) if (p.kind === 0) grass++;
    for (; grass < T.PELLET_COUNT; grass++) {
      this.pellets.push({
        x: this.rng() * T.WORLD_SIZE,
        y: this.rng() * T.WORLD_SIZE,
        kind: 0,
        value: T.GRASS_VALUE,
        born: this.time,
      });
    }
  }

  private pelletFlat(): number[] {
    const out: number[] = [];
    for (const p of this.pellets) out.push(r1(p.x), r1(p.y), p.kind);
    return out;
  }

  // ---- snapshots ----

  private snapOf(m: Mower): MowerSnap {
    const segs: number[] = [r1(m.x), r1(m.y)];
    for (const v of m.body) segs.push(r1(v));
    return {
      id: m.id,
      name: m.name,
      color: m.color,
      alive: m.alive,
      protectedS: Math.round(m.protectedS * 100) / 100,
      boosting: m.boosting,
      score: Math.round(m.score),
      segs,
    };
  }

  private liveSnaps(): MowerSnap[] {
    const out: MowerSnap[] = [];
    for (const m of this.mowers.values()) if (m.alive) out.push(this.snapOf(m));
    return out;
  }

  // ---- bots ----

  /** Keeps max(0, BOT_TARGET - humans) bots, respawns dead bots after a delay. */
  private manageBots(): void {
    let humans = 0;
    const bots: Mower[] = [];
    for (const m of this.mowers.values()) {
      if (m.id > 0) humans++;
      else bots.push(m);
    }
    const want = Math.max(0, T.BOT_TARGET - humans);

    for (const b of bots) {
      if (!b.alive && this.time - b.deathTime >= BOT_RESPAWN_S) this.revive(b);
    }

    for (let k = 1; bots.length < want; k++) {
      if (this.mowers.has(-k)) continue;
      const name = BOT_NAMES[(k - 1) % BOT_NAMES.length];
      const color = BOT_COLORS[Math.floor(this.rng() * BOT_COLORS.length)];
      bots.push(this.createMower(-k, name, color));
      this.events.push({ kind: 'spawn', id: -k, name });
    }

    if (bots.length > want) {
      // Remove dead bots first, then the most recently added (most negative id).
      bots.sort((a, b) => (Number(a.alive) - Number(b.alive)) || (a.id - b.id));
      for (let i = 0; i < bots.length - want; i++) this.mowers.delete(bots[i].id);
    }
  }

  /** Every BOT_THINK_S each live bot asks botInput for a new input. */
  private thinkBots(): void {
    let ctx: { snaps: MowerSnap[]; pel: number[] } | null = null;
    for (const m of this.mowers.values()) {
      if (m.id >= 0 || !m.alive || this.time < m.nextThink) continue;
      m.nextThink = this.time + BOT_THINK_S;
      if (!ctx) ctx = { snaps: this.liveSnaps(), pel: this.pelletFlat() };
      m.input = botInput(this.snapOf(m), ctx.snaps, ctx.pel, this.rng);
    }
  }
}
