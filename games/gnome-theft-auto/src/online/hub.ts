// The online world-sync hub (docs/roadmaps/gta-online-sync.md): one per game. It knows the peers' positions and the
// host, decides whether this client is the spawning lead, runs one publisher + mirror per system adapter, routes 'ent',
// 'cmd' and 'pay' messages, and hands an owner's entities to the adapters when that owner leaves (so the new lead can
// adopt them). Offline (no id, or no peers) update() returns at once: zero cost, and every adapter is reset to local play.
import { computeLead, outranks, pickOwner, type RankedPlayer } from './authority';
import type { SysCode, WireMsg } from './protocol';
import { createMirror, createPublisher, type Mirror, type MirrorChanges, type MirrorEnt, type OwnedEnt, type Publisher } from './replicate';

export type { OwnedEnt, MirrorEnt, MirrorChanges };

/** What the hub tells the adapters each frame while online. */
export interface SyncFrame {
  /** Receiver clock, ms (performance.now()). */
  now: number;
  myId: number;
  hostId: number | null;
  isHost: boolean;
  /** I may spawn new street events, flocks and sky traffic here (authority.ts computeLead). */
  lead: boolean;
  me: RankedPlayer;
  peers: readonly RankedPlayer[];
  /** The owner of a fixed entity at (x, z) (authority.ts pickOwner over me + peers); `current` = its owner last frame. */
  ownerOf(x: number, z: number, current: number | null): number | null;
}

/** What an adapter can do back through the hub. */
export interface SyncLink {
  /** Ask `owner` to do command c to its entity id (a shot, a comb...). No-op offline. */
  command(owner: number, id: number, c: number, a?: number[]): void;
  /** Pay another player n Acorns for `reason` (they resolved something on my world). No-op offline. */
  pay(to: number, n: number, reason: string): void;
  /** Online with at least one peer. */
  online(): boolean;
  myId(): number | null;
}

export interface SyncAdapter {
  readonly sys: SysCode;
  /** Interest radius, m. */
  readonly radius: number;
  /** Publish rate, Hz (the hub never publishes faster than the frame rate). */
  readonly hz: number;
  /** Resend unchanged records this often, ms (default 2000). Slow-changing systems (parked vehicles) use more. */
  readonly keyframeMs?: number;
  /** Mirror entities not refreshed for this long are swept, ms (default 6000; must be well above keyframeMs). */
  readonly staleMs?: number;
  /** Owner side: push every entity I own that others may see (only called online, at `hz`). */
  collect(out: OwnedEnt[], f: SyncFrame): void;
  /** Mirror side: entities from other owners were added, changed or removed (removed views must be disposed). */
  receive(ch: MirrorChanges, f: SyncFrame | null): void;
  /** Owner side: peer `from` asks me to do command c to my entity id. */
  command?(from: number, id: number, c: number, a: readonly number[]): void;
  /**
   * An owner left the game: `ents` were its mirrored entities here (already out of the mirror). Adopt (turn into my own,
   * simulated and published from now on) those where adopt(x, z) is true; dispose the rest.
   */
  ownerGone(owner: number, ents: readonly MirrorEnt[], adopt: (x: number, z: number) => boolean): void;
  /** Every frame while online: draw mirrors, gate local spawning on f.lead. */
  update(dt: number, f: SyncFrame): void;
  /** A player bullet at (x, y, z): true when it hit one of my mirrors (the adapter sends the command itself). */
  hitTest?(x: number, y: number, z: number): boolean;
  /** Back to local play: dispose every mirror, spawn locally again. Called when the link drops or the last peer leaves. */
  reset(): void;
}

/** What the hub needs from net.ts (GtaNet satisfies it). */
export interface HubNet {
  readonly myId: number | null;
  readonly hostId: number | null;
  sendWire(to: number | null, d: WireMsg): void;
}

export interface Hub {
  readonly link: SyncLink;
  /** Add a system: make() gets a link whose command() goes to this system. Returns the adapter. */
  register(sys: SysCode, make: (link: SyncLink) => SyncAdapter): SyncAdapter;
  /**
   * Every frame. (x, z) = where I am (my vehicle's position when driving). away = I am in a cutscene or the portal: my
   * world is frozen, so nothing of mine is published (peers' mirrors of it lapse) and I do not lead; mirrors still apply.
   */
  update(dt: number, x: number, z: number, away?: boolean): void;
  peerPose(id: number, x: number, z: number): void;
  peerLeave(id: number): void;
  /** A world message from a peer (net.ts onWire). */
  onWire(from: number, d: WireMsg): void;
  /** The link dropped: back to local play. */
  reset(): void;
  /** A bullet: true when it hit a mirrored entity. */
  hitTest(x: number, y: number, z: number): boolean;
  /** Am I the spawning lead (always true offline)? */
  lead(): boolean;
  /** Debug: entity counts and bytes sent. */
  stats(): {
    online: boolean; lead: boolean; peers: number; mirrors: Record<number, number>; sentBytes: number; sentMsgs: number;
    /** Bytes sent per system (same estimate as sentBytes), and inbound messages dropped by the rate limits. */
    bySys: Record<number, number>; dropped: number;
  };
}

export interface HubDeps {
  net: HubNet;
  /** Someone paid me (a street event I resolved on their world). */
  onPay(n: number, reason: string): void;
  now?: () => number;
}

/** How long after a peer leaves its entities are handed out (the server's 'host' message follows the 'left'). */
const GONE_DELAY_MS = 400;
/** Lead is recomputed this often. */
const LEAD_EVERY_MS = 250;
/**
 * Inbound limits per sender (docs/roadmaps/gta-multiplayer-audit.md, protocol safety): a token bucket of world
 * messages (an honest client sends well under 30 a second even with every system busy), and at most PAY_PER_MIN Acorns
 * a minute from any one player, so a hostile or broken client cannot flood the hub or print money.
 */
export const INBOUND = { burst: 120, perSec: 60, payPerMin: 2000 } as const;

interface Inbound { tokens: number; at: number; paid: number; payAt: number }

interface Slot {
  a: SyncAdapter;
  pub: Publisher;
  mirror: Mirror;
  nextAt: number;
}

export function createHub(deps: HubDeps): Hub {
  const now = deps.now ?? (() => performance.now());
  const slots = new Map<SysCode, Slot>();
  const peers = new Map<number, RankedPlayer>();
  const me: RankedPlayer = { id: -1, x: 0, z: 0 };
  let wasOnline = false;
  let lead = true;
  let leadAt = -Infinity;
  let sentBytes = 0;
  let sentMsgs = 0;
  let dropped = 0;
  const bySys: Record<number, number> = {};
  const inbound = new Map<number, Inbound>();
  const pendingGone: { id: number; at: number }[] = [];
  const owned: OwnedEnt[] = [];

  const isOnline = (): boolean => deps.net.myId !== null && peers.size > 0;

  function send(to: number | null, d: WireMsg): void {
    if (!isOnline()) return;
    deps.net.sendWire(to, d);
    sentMsgs++;
    // A cheap size estimate (the client stringifies anyway): ~4 characters a number.
    let n = 40;
    if (d.o === 'ent') {
      n = 30;
      for (const r of d.e) n += r.length * 4 + 2;
      for (const s of d.s ?? []) n += s[1].length + 10;
      n += (d.g?.length ?? 0) * 4;
    }
    sentBytes += n;
    if (d.o !== 'pay') bySys[d.y] = (bySys[d.y] ?? 0) + n;
  }

  /** Spend one inbound token for `from`; false = over the limit, drop the message. */
  function admit(from: number, t: number): boolean {
    let b = inbound.get(from);
    if (!b) { b = { tokens: INBOUND.burst, at: t, paid: 0, payAt: t }; inbound.set(from, b); }
    b.tokens = Math.min(INBOUND.burst, b.tokens + ((t - b.at) / 1000) * INBOUND.perSec);
    b.at = t;
    if (b.tokens < 1) { dropped++; return false; }
    b.tokens -= 1;
    return true;
  }

  /** How much of a payment of n from `from` to accept under the per-minute cap. */
  function payAllowance(from: number, n: number, t: number): number {
    const b = inbound.get(from);
    if (!b) return 0;
    if (t - b.payAt >= 60000) { b.paid = 0; b.payAt = t; }
    const ok = Math.max(0, Math.min(n, INBOUND.payPerMin - b.paid));
    b.paid += ok;
    if (ok < n) dropped++;
    return ok;
  }

  function frame(t: number): SyncFrame {
    const list = [...peers.values()];
    const hostId = deps.net.hostId;
    const all = [me, ...list];
    return {
      now: t, myId: me.id, hostId, isHost: hostId === me.id, lead, me, peers: list,
      ownerOf: (x, z, current) => pickOwner(x, z, all, hostId, current),
    };
  }

  function resetAll(): void {
    for (const s of slots.values()) {
      s.pub.reset();
      const gone = s.mirror.clear();
      if (gone.length) s.a.receive({ added: [], changed: [], removed: gone }, null);
      s.a.reset();
    }
    lead = true;
    leadAt = -Infinity;
    pendingGone.length = 0;
  }

  function linkFor(sys: SysCode | null): SyncLink {
    return {
      command(owner, id, c, args) {
        if (sys === null || !peers.has(owner)) return;
        send(owner, args && args.length ? { o: 'cmd', y: sys, i: id, c, a: args } : { o: 'cmd', y: sys, i: id, c });
      },
      pay(to, n, reason) {
        if (!peers.has(to)) return;
        send(to, { o: 'pay', n: Math.max(1, Math.min(5000, Math.round(n))), r: reason.slice(0, 60) });
      },
      online: isOnline,
      myId: () => deps.net.myId,
    };
  }
  const link = linkFor(null);

  return {
    link,
    register(sys, make) {
      const a = make(linkFor(sys));
      slots.set(sys, {
        a, pub: createPublisher(sys, { radius: a.radius, keyframeMs: a.keyframeMs }), mirror: createMirror(a.staleMs), nextAt: 0,
      });
      return a;
    },
    update(dt, x, z, away = false) {
      const online = isOnline();
      if (!online) {
        if (wasOnline) {
          wasOnline = false;
          // Still connected but the last peer left: I am the world now, so I adopt what they had near me.
          if (deps.net.myId !== null) {
            for (const g of pendingGone) for (const s of slots.values()) s.a.ownerGone(g.id, s.mirror.dropOwner(g.id), () => true);
          }
          resetAll();
        }
        return;
      }
      wasOnline = true;
      const t = now();
      me.id = deps.net.myId as number;
      me.x = x;
      me.z = z;
      if (away) lead = false;
      else if (t - leadAt >= LEAD_EVERY_MS) {
        leadAt = t;
        lead = computeLead(me, [...peers.values()], deps.net.hostId, lead);
      }
      const f = frame(t);
      // Entities of players who left, once the new host is known.
      for (let i = pendingGone.length - 1; i >= 0; i--) {
        const g = pendingGone[i];
        if (t - g.at < GONE_DELAY_MS) continue;
        pendingGone.splice(i, 1);
        const others = [...peers.values()];
        const adopt = (ax: number, az: number): boolean => {
          // Mine when I am its owner among the players still here, or nobody is near it and nobody still here outranks me.
          const owner = pickOwner(ax, az, [me, ...others], deps.net.hostId, null);
          return owner === me.id || (owner === null && !others.some((o) => outranks(o.id, me.id, deps.net.hostId)));
        };
        for (const s of slots.values()) {
          const ents = s.mirror.dropOwner(g.id);
          s.a.ownerGone(g.id, ents, adopt);
        }
      }
      const list = [...peers.values()];
      for (const s of slots.values()) {
        const stale = s.mirror.sweep(t);
        if (stale.length) s.a.receive({ added: [], changed: [], removed: stale }, f);
        if (!away && t >= s.nextAt) {
          s.nextAt = t + 1000 / Math.max(0.5, s.a.hz);
          owned.length = 0;
          s.a.collect(owned, f);
          for (const o of s.pub.tick(t, owned, list)) send(o.to, o.msg);
        }
        s.a.update(dt, f);
      }
    },
    peerPose(id, x, z) {
      const p = peers.get(id);
      if (p) { p.x = x; p.z = z; } else peers.set(id, { id, x, z });
    },
    peerLeave(id) {
      inbound.delete(id);
      if (!peers.delete(id)) return;
      for (const s of slots.values()) s.pub.dropPeer(id);
      pendingGone.push({ id, at: now() });
    },
    onWire(from, d) {
      if (deps.net.myId === null || from === deps.net.myId) return;
      const t0 = now();
      if (!admit(from, t0)) return;
      if (d.o === 'pay') {
        const n = payAllowance(from, d.n, t0);
        if (n > 0) deps.onPay(n, d.r);
        return;
      }
      const s = slots.get(d.y);
      if (!s) return;
      if (d.o === 'cmd') { s.a.command?.(from, d.i, d.c, d.a ?? []); return; }
      const ch = s.mirror.apply(from, d, now());
      if (ch.added.length || ch.changed.length || ch.removed.length) s.a.receive(ch, isOnline() ? frame(now()) : null);
    },
    reset() {
      peers.clear();
      wasOnline = false;
      resetAll();
    },
    hitTest(x, y, z) {
      if (!wasOnline) return false;
      for (const s of slots.values()) if (s.a.hitTest?.(x, y, z)) return true;
      return false;
    },
    lead: () => lead,
    stats() {
      const mirrors: Record<number, number> = {};
      for (const [sys, s] of slots) mirrors[sys] = s.mirror.size();
      return { online: isOnline(), lead, peers: peers.size, mirrors, sentBytes, sentMsgs, bySys: { ...bySys }, dropped };
    },
  };
}
