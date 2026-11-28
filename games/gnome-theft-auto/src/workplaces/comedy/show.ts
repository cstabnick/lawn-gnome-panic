// E24 comedy: the pure show clock. Walks a ComedySet beat by beat and emits ShowEvents with timing. No DOM, no timers:
// the caller feeds step(dt). Seeded, so the same seed gives the same set.
import { toStars, type Stars } from '../../jobs/workDefs';
import { CLUB, type ComedySet, type CrowdReaction, type Heckler, type ShowEvent } from './types';

export interface Show {
  /** Advance by dt seconds; returns the events that happened, in order. */
  step(dt: number): ShowEvent[];
  /** The player pressed Double Down: true when it was allowed now. */
  doubleDown(): boolean;
  /** Double Down is allowed now (right after a bad reaction, before the next line). */
  canDoubleDown(): boolean;
  cringe(): number;
  tomatoes(): number;
  doubleDowns(): number;
  done(): boolean;
  /** Stars for the set (commitment: finishing, doubling down, taking tomatoes). */
  stars(): Stars;
}

/** Cringe added by each reaction. */
const CRINGE: Record<CrowdReaction, number> = {
  silence: 4, cricket: 5, cough: 5, sigh: 6, groan: 8, boo: 10, heckle: 9, tomato: 14, walkout: 16, 'pity-clap': 12,
};

/** Reactions a Double Down can answer. */
const DD_KINDS: ReadonlySet<CrowdReaction> = new Set<CrowdReaction>([
  'groan', 'boo', 'heckle', 'sigh', 'silence', 'cricket', 'walkout',
]);

/** What a Double Down escalates a reaction into. */
const ESCALATE: Partial<Record<CrowdReaction, CrowdReaction>> = {
  groan: 'boo', silence: 'groan', cricket: 'groan', sigh: 'groan', boo: 'tomato', heckle: 'heckle', walkout: 'walkout',
};

/** Seconds of holds on the timeline. */
const HOLD_INTRO = 3.5;
const HOLD_REACT = 2.2;
const HOLD_HECKLE = 3;
const HOLD_DOUBLED = 3;
const HOLD_CLOSER = 3;

/** One scheduled action: runs at time `at` (scheduled time, not the step time). */
type Act =
  | { k: 'intro' }
  | { k: 'line'; i: number }
  | { k: 'react'; i: number }
  | { k: 'doubled'; i: number; from: CrowdReaction }
  | { k: 'escalated'; i: number; kind: CrowdReaction }
  | { k: 'closer' }
  | { k: 'end' };

interface Pending { at: number; act: Act }

/** mulberry32: a small seeded PRNG returning floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createShow(set: ComedySet, opts: { heckles: readonly string[]; hecklers: readonly Heckler[]; doubleDownLines: readonly string[]; seed: number }): Show {
  const rng = mulberry32(opts.seed);
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];

  let elapsed = 0;
  let pending: Pending | null = { at: 0, act: { k: 'intro' } };
  let buf: ShowEvent[] = [];
  let cringeNow = 10;
  let tomatoCount = 0;
  let ddCount = 0;
  let ended = false;
  let canDD = false;
  // The beat whose reaction was last shown, and that reaction (what a Double Down answers).
  let curIndex = 0;
  let curKind: CrowdReaction = 'silence';
  let lastHeckle: string | null = null;

  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  /** A heckler for a heckle event (a seeded pick, or a stand-in when none are set). */
  function pickWho(): Heckler {
    return opts.hecklers.length ? pick(opts.hecklers) : { name: 'Someone in row B', seat: 0 };
  }

  /** The heckle text: the beat's own line, else a seeded pick that is not the last one used. */
  function pickHeckleText(own: string | undefined): string {
    if (own) { lastHeckle = own; return own; }
    const fresh = opts.heckles.filter((h) => h !== lastHeckle);
    const pool = fresh.length ? fresh : opts.heckles;
    const text = pool.length ? pick(pool) : '...';
    lastHeckle = text;
    return text;
  }

  /** A seat for a tomato: a heckler's seat or a random one. */
  function pickSeat(): number {
    const seat = opts.hecklers.length && rng() < 0.5 ? pick(opts.hecklers).seat : Math.floor(rng() * CLUB.seats.length);
    return Math.max(0, Math.min(CLUB.seats.length - 1, seat));
  }

  /** Emit a reaction (and its heckle or tomato). Returns the hold before the next line. */
  function reaction(kind: CrowdReaction, own: string | undefined): number {
    buf.push({ t: 'react', kind });
    cringeNow = clamp(cringeNow + CRINGE[kind]);
    let hold = HOLD_REACT;
    if (kind === 'heckle') {
      buf.push({ t: 'heckle', who: pickWho(), text: pickHeckleText(own) });
      hold = HOLD_HECKLE;
    }
    if (kind === 'tomato') {
      buf.push({ t: 'tomato', seat: pickSeat() });
      tomatoCount++;
    }
    return hold;
  }

  /** What comes after beat i: the next line, or the closer. */
  function after(i: number): Act {
    return i + 1 < set.beats.length ? { k: 'line', i: i + 1 } : { k: 'closer' };
  }

  function run(p: Pending): void {
    const at = p.at;
    const a = p.act;
    switch (a.k) {
      case 'intro': {
        buf.push({ t: 'intro', text: set.intro });
        pending = { at: at + HOLD_INTRO, act: set.beats.length ? { k: 'line', i: 0 } : { k: 'closer' } };
        return;
      }
      case 'line': {
        const beat = set.beats[a.i];
        canDD = false;
        buf.push({ t: 'line', text: beat.line, anim: beat.anim, s: beat.s });
        pending = { at: at + beat.s, act: { k: 'react', i: a.i } };
        return;
      }
      case 'react': {
        const beat = set.beats[a.i];
        const hold = reaction(beat.react, beat.heckle);
        canDD = DD_KINDS.has(beat.react);
        curIndex = a.i;
        curKind = beat.react;
        pending = { at: at + hold, act: after(a.i) };
        return;
      }
      case 'doubled': {
        const lines = opts.doubleDownLines;
        buf.push({ t: 'doubled', text: lines.length ? lines[(ddCount - 1) % lines.length] : '' });
        const kind = ESCALATE[a.from] ?? a.from;
        pending = { at: at + HOLD_DOUBLED, act: { k: 'escalated', i: a.i, kind } };
        return;
      }
      case 'escalated': {
        // A Double Down is one per beat, so the escalated reaction does not re-open it.
        const hold = reaction(a.kind, undefined);
        canDD = false;
        pending = { at: at + hold, act: after(a.i) };
        return;
      }
      case 'closer': {
        buf.push({ t: 'closer', text: set.closer });
        pending = { at: at + HOLD_CLOSER, act: { k: 'end' } };
        return;
      }
      case 'end': {
        buf.push({ t: 'end' });
        ended = true;
        pending = null;
        canDD = false;
        return;
      }
    }
  }

  return {
    step(dt: number): ShowEvent[] {
      buf = [];
      if (ended) return buf;
      elapsed += Math.max(0, dt);
      while (pending && !ended && pending.at <= elapsed) run(pending);
      return buf;
    },

    doubleDown(): boolean {
      if (!canDD || ended) return false;
      // The Double Down replaces the scheduled next line; the doubled line plays on the next step.
      canDD = false;
      ddCount++;
      pending = { at: elapsed, act: { k: 'doubled', i: curIndex, from: curKind } };
      return true;
    },

    canDoubleDown(): boolean {
      return canDD && !ended;
    },

    cringe: () => cringeNow,
    tomatoes: () => tomatoCount,
    doubleDowns: () => ddCount,
    done: () => ended,

    stars(): Stars {
      const n = 1 + (ended ? 1 : 0) + (ddCount >= 2 ? 1 : 0) + (tomatoCount >= 2 ? 1 : 0) + (cringeNow >= 80 ? 1 : 0);
      return toStars(n);
    },
  };
}
