// The generic owner -> mirror channel (docs/roadmaps/gta-online-sync.md). Pure: no net, no three.js; the clock is passed in.
//
// Publisher (owner side, one per system): each tick it gets every entity this client owns and the peers' positions,
// and works out per peer what to send: records of entities within `radius` of that peer that changed since last sent
// (or every `keyframeMs`, so a mirror never goes stale), strings the peer has not had yet, and the ids that left the
// peer's interest or stopped existing ('gone'). Late joiners and players walking into range get everything at once,
// because their "sent" book starts empty.
//
// Mirror (guest side, one per system): the entities other owners publish, by owner and id, with the last record and
// string. Entities an owner stops refreshing for `staleMs` are swept away.
import { MAX_RECS, type SysCode, type WireMsg } from './protocol';

export type EntMsg = Extract<WireMsg, { o: 'ent' }>;

/** One entity this client owns, as the adapter hands it to the publisher. rec[0] must be `id`. */
export interface OwnedEnt {
  id: number;
  /** Flat position, for interest management. */
  x: number;
  z: number;
  /** The quantized record (integers only; see protocol.ts quantizers). */
  rec: number[];
  /** A string the mirror needs once (a look code, a prefab id, an emote id). Sent when new or changed, and on keyframes. */
  str?: string;
}

export interface PeerPos { id: number; x: number; z: number }

export interface Outgoing { to: number; msg: EntMsg }

export interface PublisherOpts {
  /** Flat interest radius, m: an entity goes to a peer this close to it. */
  radius: number;
  /** Resend unchanged records this often (ms). Default 2000. */
  keyframeMs?: number;
}

export interface Publisher {
  /** Work out what to send now. `now` is the sender's clock (ms); it goes out as the message's t. */
  tick(now: number, ents: readonly OwnedEnt[], peers: readonly PeerPos[]): Outgoing[];
  /** A peer left: forget what it was sent. */
  dropPeer(id: number): void;
  /** Forget everything (went offline). */
  reset(): void;
}

interface SentRec { rec: number[]; at: number; str: string | undefined }

const sameRec = (a: readonly number[], b: readonly number[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

export function createPublisher(sys: SysCode, opts: PublisherOpts): Publisher {
  const radius = opts.radius;
  const keyframe = opts.keyframeMs ?? 2000;
  /** Per peer: what it holds of mine, by entity id. */
  const books = new Map<number, Map<number, SentRec>>();

  return {
    tick(now, ents, peers) {
      const out: Outgoing[] = [];
      for (const peer of peers) {
        let book = books.get(peer.id);
        if (!book) { book = new Map(); books.set(peer.id, book); }
        const recs: number[][] = [];
        const strs: [number, string][] = [];
        const seen = new Set<number>();
        for (const e of ents) {
          if (Math.hypot(e.x - peer.x, e.z - peer.z) > radius) continue;
          seen.add(e.id);
          const prev = book.get(e.id);
          const key = !prev || now - prev.at >= keyframe;
          if (key || !sameRec(prev.rec, e.rec)) {
            recs.push(e.rec);
            if (e.str !== undefined && (key || prev.str !== e.str)) strs.push([e.id, e.str]);
            book.set(e.id, { rec: e.rec.slice(), at: key ? now : prev.at, str: e.str });
          } else if (e.str !== undefined && prev.str !== e.str) {
            strs.push([e.id, e.str]);
            prev.str = e.str;
          }
        }
        const gone: number[] = [];
        for (const id of book.keys()) if (!seen.has(id)) gone.push(id);
        for (const id of gone) book.delete(id);
        if (recs.length === 0 && strs.length === 0 && gone.length === 0) continue;
        // Split into messages of at most MAX_RECS records (strings and gone ids ride on the first ones).
        let ri = 0, si = 0, gi = 0;
        while (ri < recs.length || si < strs.length || gi < gone.length) {
          const msg: EntMsg = { o: 'ent', y: sys, t: now, e: recs.slice(ri, ri + MAX_RECS) };
          ri += MAX_RECS;
          if (si < strs.length) { msg.s = strs.slice(si, si + MAX_RECS); si += MAX_RECS; }
          if (gi < gone.length) { msg.g = gone.slice(gi, gi + MAX_RECS * 4); gi += MAX_RECS * 4; }
          out.push({ to: peer.id, msg });
        }
      }
      return out;
    },
    dropPeer(id) {
      books.delete(id);
    },
    reset() {
      books.clear();
    },
  };
}

/** One mirrored entity. The adapter may hang its own view off it (`view`). */
export interface MirrorEnt {
  readonly owner: number;
  readonly id: number;
  rec: number[];
  str: string | undefined;
  /** Receiver clock (ms) of the last record. */
  seenAt: number;
  /** Owner clock (ms) of the last record (for Interp.push). */
  sentAt: number;
  /** Anything the adapter keeps for this entity (a mesh, an Interp). */
  view?: unknown;
}

export interface MirrorChanges {
  added: MirrorEnt[];
  changed: MirrorEnt[];
  removed: MirrorEnt[];
}

export interface Mirror {
  /** Apply one 'ent' message from `owner`, received at `now` (receiver clock, ms). */
  apply(owner: number, msg: EntMsg, now: number): MirrorChanges;
  /** Remove entities not refreshed for staleMs. */
  sweep(now: number): MirrorEnt[];
  /** Remove (and return) everything from `owner`. */
  dropOwner(owner: number): MirrorEnt[];
  get(owner: number, id: number): MirrorEnt | undefined;
  all(): IterableIterator<MirrorEnt>;
  size(): number;
  /** Remove (and return) everything. */
  clear(): MirrorEnt[];
}

/** Most entities one owner may hold in one system's mirror: a hostile or broken client cannot flood memory. */
export const MIRROR_MAX_PER_OWNER = 256;

export function createMirror(staleMs = 6000, maxPerOwner = MIRROR_MAX_PER_OWNER): Mirror {
  const byOwner = new Map<number, Map<number, MirrorEnt>>();
  /** Strings that arrived before their record, by owner then id. */
  const early = new Map<number, Map<number, string>>();

  function* iterAll(): IterableIterator<MirrorEnt> {
    for (const m of byOwner.values()) yield* m.values();
  }

  return {
    apply(owner, msg, now) {
      const ch: MirrorChanges = { added: [], changed: [], removed: [] };
      let m = byOwner.get(owner);
      if (!m) { m = new Map(); byOwner.set(owner, m); }
      const strs = new Map<number, string>(msg.s ?? []);
      for (const rec of msg.e) {
        const id = rec[0];
        let e = m.get(id);
        const str = strs.get(id) ?? early.get(owner)?.get(id);
        early.get(owner)?.delete(id);
        strs.delete(id);
        if (!e) {
          if (m.size >= maxPerOwner) continue;
          e = { owner, id, rec, str, seenAt: now, sentAt: msg.t };
          m.set(id, e);
          ch.added.push(e);
        } else {
          e.rec = rec;
          if (str !== undefined) e.str = str;
          e.seenAt = now;
          e.sentAt = msg.t;
          ch.changed.push(e);
        }
      }
      // A string with no record in this message: update a known entity, or keep it for when its record comes.
      for (const [id, s] of strs) {
        const e = m.get(id);
        if (e) {
          if (e.str !== s) { e.str = s; if (!ch.changed.includes(e)) ch.changed.push(e); }
        } else {
          let em = early.get(owner);
          if (!em) { em = new Map(); early.set(owner, em); }
          if (em.size < maxPerOwner) em.set(id, s);
        }
      }
      for (const id of msg.g ?? []) {
        const e = m.get(id);
        if (!e) continue;
        m.delete(id);
        ch.removed.push(e);
      }
      return ch;
    },
    sweep(now) {
      const out: MirrorEnt[] = [];
      for (const m of byOwner.values()) {
        for (const [id, e] of m) {
          if (now - e.seenAt > staleMs) { m.delete(id); out.push(e); }
        }
      }
      return out;
    },
    dropOwner(owner) {
      const m = byOwner.get(owner);
      byOwner.delete(owner);
      early.delete(owner);
      return m ? [...m.values()] : [];
    },
    get(owner, id) {
      return byOwner.get(owner)?.get(id);
    },
    all: iterAll,
    size() {
      let n = 0;
      for (const m of byOwner.values()) n += m.size;
      return n;
    },
    clear() {
      const out = [...iterAll()];
      byOwner.clear();
      early.clear();
      return out;
    },
  };
}
