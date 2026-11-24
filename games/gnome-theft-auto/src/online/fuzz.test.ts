// Robustness of the online code (docs/roadmaps/gta-multiplayer-audit.md): garbage, truncated and hostile messages never
// throw, the inbound limits hold, and values from a newer or older client degrade gracefully. Seeded, so a failure
// reproduces.
import { describe, expect, it } from 'vitest';
import { createHub, INBOUND, type SyncAdapter } from './hub';
import { MIRROR_MAX_PER_OWNER } from './replicate';
import { decodeActivity, MAX_RECS, MAX_REC_LEN, parseWireMsg, SYS, SYS_COUNT, type SysCode, type WireMsg } from './protocol';
import { decodeSea } from './seaSync';
import { decodePark } from './parkSync';
import { decodeCab, decodeDropArgs, decodePax, decodeTow } from '../jobs/protocol';
import { parsePartyMsg } from '../party/protocol';
import { encodePose, parseMsg, VEHICLE_CODES, type RemotePose } from '../net';

// ---- Seeded generators ----

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
type Rng = () => number;
function pick<T>(r: Rng, xs: readonly T[]): T {
  return xs[Math.floor(r() * xs.length)];
}

const NUMBERS = [NaN, Infinity, -Infinity, -0, 0, 1, -1, 0.5, 2 ** 31, -(2 ** 31), 1e300, 2 ** 31 - 1, 7, 3.25];
const STRINGS = ['', 'a', 'x'.repeat(5000), 'gnome \u{1F331} üïcode 漢字', '|', 'lawn:floss|', 'BCDF', 'a|b|c', '\u0000', '<script>'];
const KEYS = ['k', 'o', 'y', 't', 'e', 's', 'g', 'i', 'c', 'a', 'n', 'r', 'p', 'd', 'st', 'song'];
const INT_POOL = [NaN, Infinity, -Infinity, 2 ** 31, -(2 ** 31), 2 ** 53, 1e300, -0, 0, 1, -1, 2 ** 31 - 1, 255, 256, 9, 10];

function randomString(r: Rng): string {
  if (r() < 0.5) return pick(r, STRINGS);
  const alphabet = [...'ab|-:0123456789 '];
  return Array.from({ length: Math.floor(r() * 41) }, () => pick(r, alphabet)).join('');
}

function randomValue(r: Rng, depth: number): unknown {
  const k = Math.floor(r() * (depth > 2 ? 6 : 9));
  switch (k) {
    case 0: return pick(r, NUMBERS);
    case 1: return randomString(r);
    case 2: return r() < 0.5;
    case 3: return null;
    case 4: return undefined;
    case 5: return Math.floor((r() * 2 - 1) * 2 ** 31);
    case 6: {
      const n = Math.floor(r() * (depth === 0 ? 61 : 8));
      return Array.from({ length: n }, () => randomValue(r, depth + 1));
    }
    default: {
      const o: Record<string, unknown> = {};
      const n = Math.floor(r() * 5);
      for (let i = 0; i < n; i++) o[pick(r, KEYS)] = randomValue(r, depth + 1);
      return o;
    }
  }
}

function randomIntArray(r: Rng): number[] {
  const n = Math.floor(r() * 31);
  return Array.from({ length: n }, () => (r() < 0.5 ? Math.floor((r() * 2 - 1) * 1000) : pick(r, INT_POOL)));
}

/** A wire message shaped like the honest ones (it may still fail parseWireMsg: the caller filters). */
function randomWire(r: Rng, t: number): WireMsg {
  const y = Math.floor(r() * SYS_COUNT) as SysCode;
  const roll = r();
  if (roll < 0.6) {
    const n = 1 + Math.floor(r() * MAX_RECS);
    const e = Array.from({ length: n }, () => {
      const len = 1 + Math.floor(r() * MAX_REC_LEN);
      return Array.from({ length: len }, (_, i) => (i === 0 ? Math.floor(r() * 200) : Math.floor((r() * 2 - 1) * 2 ** 31)));
    });
    const msg: WireMsg = { o: 'ent', y, t, e };
    if (r() < 0.5) msg.s = Array.from({ length: Math.floor(r() * 5) }, () => [Math.floor(r() * 200), pick(r, STRINGS.slice(0, 4))] as [number, string]);
    if (r() < 0.3) msg.g = Array.from({ length: Math.floor(r() * 6) }, () => Math.floor(r() * 200));
    return msg;
  }
  if (roll < 0.9) return { o: 'cmd', y, i: Math.floor(r() * 1000), c: Math.floor(r() * 256), a: r() < 0.5 ? [Math.floor(r() * 9)] : undefined };
  return { o: 'pay', n: 1 + Math.floor(r() * 5000), r: 'x' };
}

function clone(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(clone);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)]));
  return v;
}

/** Clone and corrupt one field: replace a value, delete a key, or truncate an array. */
function mutate(r: Rng, base: unknown): unknown {
  const v = clone(base);
  const spots: { c: any; k: string | number }[] = [];
  const walk = (x: any): void => {
    if (x === null || typeof x !== 'object') return;
    for (const k of Object.keys(x)) {
      spots.push({ c: x, k: Array.isArray(x) ? Number(k) : k });
      walk(x[k]);
    }
  };
  walk(v);
  if (spots.length === 0) return v;
  const { c, k } = pick(r, spots);
  if (Array.isArray(c[k]) && r() < 0.3) c[k] = c[k].slice(0, Math.floor(r() * c[k].length));
  else if (r() < 0.2) delete c[k];
  else c[k] = randomValue(r, 1);
  return v;
}

// ---- Parsers and decoders: no throws ----

describe('fuzz: no throws on garbage', () => {
  it('parseMsg, parseWireMsg and parsePartyMsg survive random values', () => {
    const r = mulberry32(0x5eed01);
    for (let i = 0; i < 5000; i++) {
      const v = randomValue(r, 0);
      expect(() => parseMsg(v)).not.toThrow();
      expect(() => parseWireMsg(v)).not.toThrow();
      expect(() => parsePartyMsg(v)).not.toThrow();
    }
  });

  it('the decoders survive random integer arrays and strings', () => {
    const r = mulberry32(0x5eed02);
    for (let i = 0; i < 5000; i++) {
      const a = randomIntArray(r);
      const s = randomString(r);
      const str = r() < 0.5 ? undefined : s;
      expect(() => decodeActivity(a, s)).not.toThrow();
      expect(() => decodeSea(a)).not.toThrow();
      expect(() => decodePark(a)).not.toThrow();
      expect(() => decodeCab(a, str)).not.toThrow();
      expect(() => decodePax(a)).not.toThrow();
      expect(() => decodeTow(a)).not.toThrow();
      expect(() => decodeDropArgs(a)).not.toThrow();
    }
  });
});

// ---- Mutated valid messages ----

describe('fuzz: mutated valid messages', () => {
  const pose: RemotePose = {
    x: 1, y: 40, z: 2, yaw: 0.5, veh: 23, tint: 0, moving: true, aiming: false, hurt: false, chute: false, ride: null, pitch: 0,
    tilt: { pitch: 0.3, roll: -0.8 },
  };
  const w = encodePose(pose);
  const bases: [unknown, (x: unknown) => unknown][] = [
    [{ k: 'pos', p: w.p, t: 1, r: w.r }, parseMsg],
    [{ o: 'ent', y: SYS.quarry, t: 12.5, e: [[1, 2, 3], [2, -5]], s: [[1, 'abc']], g: [7] }, parseWireMsg],
    [{ o: 'cmd', y: SYS.event, i: 4, c: 1, a: [3, 4] }, parseWireMsg],
    [{ o: 'pay', n: 40, r: 'Caught a thief' }, parseWireMsg],
    [{ o: 'say', m: 'hello there' }, parsePartyMsg],
  ];

  it('never throws, and a parsed result parses again to itself', () => {
    const r = mulberry32(0x5eed03);
    for (let i = 0; i < 2000; i++) {
      const [base, parse] = bases[i % bases.length];
      const m = mutate(r, base);
      let res: unknown = null;
      expect(() => { res = parse(m); }).not.toThrow();
      if (res !== null) expect(parse(res)).toEqual(res);
    }
  });
});

// ---- Forward compatibility ----

describe('fuzz: newer and older clients', () => {
  it('an unknown vehicle code shows the player on foot', () => {
    const m = parseMsg({ k: 'pos', p: [0, 1, 0, 0, VEHICLE_CODES.length + 5, 0, 0, 0, 0, 0, -1, 0], t: 1 });
    expect(m).not.toBeNull();
    expect(m && m.k === 'pos' ? m.p[4] : null).toBe(-1);
  });
  it('a system this client does not know is refused', () => {
    expect(parseWireMsg({ o: 'ent', y: SYS_COUNT, t: 0, e: [[1]] })).toBeNull();
    expect(parseWireMsg({ o: 'cmd', y: SYS_COUNT, i: 1, c: 1 })).toBeNull();
  });
  it('an unknown message kind is refused', () => {
    expect(parseMsg({ k: 'future-kind' })).toBeNull();
  });
});

// ---- Hub: the inbound limits and routing ----

describe('fuzz: hub', () => {
  /** A recording adapter for one system; every call is logged as `${sys}:${kind}`. */
  function recorder(sys: SysCode, log: string[]): () => SyncAdapter {
    return () => ({
      sys, radius: 1e9, hz: 100,
      collect() { /* owns nothing */ },
      receive() { log.push(`${sys}:recv`); },
      command() { log.push(`${sys}:cmd`); },
      ownerGone() { /* nothing */ },
      update() { /* nothing */ },
      reset() { /* nothing */ },
    });
  }
  function setup(myId: number, hostId: number) {
    let t = 0;
    const paid: number[] = [];
    const net = { myId, hostId, sendWire: () => { /* dropped */ } };
    const hub = createHub({ net, onPay: (n) => paid.push(n), now: () => t });
    return { hub, paid, advance: (ms: number) => { t += ms; } };
  }

  it('random valid traffic never throws and mirrors stay capped', () => {
    const r = mulberry32(0x5eed04);
    const log: string[] = [];
    const { hub, advance } = setup(2, 1);
    for (const sys of Object.values(SYS)) hub.register(sys, recorder(sys, log));
    hub.peerPose(1, 0, 0);
    let fed = 0;
    for (let i = 0; i < 3000; i++) {
      advance(20);
      const msg = randomWire(r, 0);
      if (parseWireMsg(msg) === null) continue;
      fed++;
      expect(() => hub.onWire(1, msg)).not.toThrow();
      if (i % 10 === 0) expect(() => hub.update(0.016, 0, 0)).not.toThrow();
    }
    expect(fed).toBeGreaterThan(1000);
    const st = hub.stats();
    for (const sys of Object.values(SYS)) expect(st.mirrors[sys]).toBeLessThanOrEqual(MIRROR_MAX_PER_OWNER);
  });

  it('the rate limit caps commands from one sender', () => {
    const log: string[] = [];
    const { hub } = setup(2, 1);
    hub.register(SYS.quarry, recorder(SYS.quarry, log));
    for (let i = 0; i < 1000; i++) hub.onWire(3, { o: 'cmd', y: SYS.quarry, i: 1, c: 1 });
    expect(log.filter((l) => l.endsWith(':cmd')).length).toBeLessThanOrEqual(INBOUND.burst);
    expect(hub.stats().dropped).toBeGreaterThan(0);
  });

  it('the pay cap holds within a minute', () => {
    const { hub, paid, advance } = setup(2, 1);
    hub.register(SYS.quarry, recorder(SYS.quarry, []));
    for (let i = 0; i < 100; i++) {
      advance(100);
      hub.onWire(4, { o: 'pay', n: 5000, r: 'x' });
    }
    expect(paid.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(INBOUND.payPerMin);
  });

  it('a message from my own id never reaches an adapter', () => {
    const log: string[] = [];
    const { hub } = setup(2, 1);
    hub.register(SYS.quarry, recorder(SYS.quarry, log));
    hub.onWire(2, { o: 'cmd', y: SYS.quarry, i: 1, c: 1 });
    hub.onWire(2, { o: 'ent', y: SYS.quarry, t: 0, e: [[1, 1]] });
    expect(log).toEqual([]);
  });

  it('a system with no adapter is ignored', () => {
    const log: string[] = [];
    const { hub } = setup(2, 1);
    hub.register(SYS.quarry, recorder(SYS.quarry, log));
    expect(() => hub.onWire(1, { o: 'cmd', y: SYS.sky, i: 1, c: 1 })).not.toThrow();
    expect(() => hub.onWire(1, { o: 'ent', y: SYS.park, t: 0, e: [[1, 2]] })).not.toThrow();
    expect(log).toEqual([]);
  });
});
