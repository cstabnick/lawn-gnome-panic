// The online world-sync foundation: wire codecs, ranking, the publisher/mirror channel and the hub (no server).
import { describe, expect, it } from 'vitest';
import { computeLead, LEAD, outranks, pickOwner } from './authority';
import { createHub, type SyncAdapter, type SyncLink } from './hub';
import {
  ACT, decodeActivity, encodeActivity, MAX_RECS, parseWireMsg, qAngle, qPos, qSigned, SYS, uqAngle, uqPos, uqSigned,
  type RemoteActivity, type WireMsg,
} from './protocol';
import { createMirror, createPublisher, type EntMsg, type MirrorChanges, type OwnedEnt } from './replicate';
import { encodePose, parseMsg, poseFromArray, type RemotePose } from '../net';

describe('parseWireMsg', () => {
  it('accepts well-formed messages', () => {
    const ent = { o: 'ent', y: SYS.quarry, t: 12.5, e: [[1, 2, 3], [2, -5]], s: [[1, 'abc']], g: [7] };
    expect(parseWireMsg(ent)).toEqual(ent);
    expect(parseWireMsg({ o: 'cmd', y: SYS.event, i: 4, c: 1 })).toEqual({ o: 'cmd', y: SYS.event, i: 4, c: 1 });
    expect(parseWireMsg({ o: 'cmd', y: SYS.event, i: 4, c: 1, a: [3, 4] })).toEqual({ o: 'cmd', y: SYS.event, i: 4, c: 1, a: [3, 4] });
    expect(parseWireMsg({ o: 'pay', n: 40, r: 'Caught a thief' })).toEqual({ o: 'pay', n: 40, r: 'Caught a thief' });
  });
  it('rejects malformed ones', () => {
    expect(parseWireMsg(null)).toBeNull();
    expect(parseWireMsg({ o: 'ent', y: 99, t: 0, e: [] })).toBeNull();
    expect(parseWireMsg({ o: 'ent', y: 0, t: 0, e: [[1.5]] })).toBeNull();
    expect(parseWireMsg({ o: 'ent', y: 0, t: 0, e: [[]] })).toBeNull();
    expect(parseWireMsg({ o: 'ent', y: 0, t: 0, e: [['x']] })).toBeNull();
    expect(parseWireMsg({ o: 'ent', y: 0, t: 0, e: Array.from({ length: MAX_RECS + 1 }, () => [1]) })).toBeNull();
    expect(parseWireMsg({ o: 'ent', y: 0, t: 0, e: [], s: [[1, 'x'.repeat(500)]] })).toBeNull();
    expect(parseWireMsg({ o: 'cmd', y: 0, i: 1, c: 300 })).toBeNull();
    expect(parseWireMsg({ o: 'pay', n: 999999, r: 'x' })).toBeNull();
    expect(parseWireMsg({ o: 'pay', n: -1, r: 'x' })).toBeNull();
    expect(parseWireMsg({ o: 'nope' })).toBeNull();
  });
});

describe('quantizers', () => {
  it('round-trip within a step', () => {
    for (const v of [0, 1.234, -456.78, 899.99]) expect(Math.abs(uqPos(qPos(v)) - v)).toBeLessThanOrEqual(0.05);
    for (const a of [0, 1, -1, 3.1, -3.1]) {
      const d = Math.abs(Math.atan2(Math.sin(uqAngle(qAngle(a)) - a), Math.cos(uqAngle(qAngle(a)) - a)));
      expect(d).toBeLessThan(0.013);
    }
    expect(qAngle(Math.PI * 2)).toBe(0);
    expect(qAngle(NaN)).toBe(0);
    expect(uqSigned(qSigned(0.5, 1.5), 1.5)).toBeCloseTo(0.5, 1);
    expect(qSigned(99, 1)).toBe(127);
  });
});

describe('activity codec', () => {
  const a: RemoteActivity = {
    emote: 'wave', emoteSeq: 3, mode: ACT.rod, rod: 'fish-rod-moonline', phase: 'wait', phaseT: 0, charge: 0.6,
    bobber: { x: 10.2, y: 0.4, z: -30.5 }, lookYaw: 1, lookPitch: 0.2,
  };
  it('round-trips', () => {
    const { rec, str } = encodeActivity(a);
    const b = decodeActivity(rec, str)!;
    expect(b.emote).toBe('wave');
    expect(b.emoteSeq).toBe(3);
    expect(b.mode).toBe(ACT.rod);
    expect(b.rod).toBe('fish-rod-moonline');
    expect(b.phase).toBe('wait');
    expect(b.charge).toBeCloseTo(0.6);
    expect(b.bobber!.x).toBeCloseTo(10.2);
    expect(b.bobber!.z).toBeCloseTo(-30.5);
    expect(b.lookYaw).toBeCloseTo(1, 1);
  });
  it('reads lawn emotes, no emote and bad strings', () => {
    const { rec } = encodeActivity({ ...a, emote: null, bobber: null });
    expect(decodeActivity(rec, '|')!.emote).toBeNull();
    expect(decodeActivity(rec, 'lawn:floss|')!.emote).toBe('lawn:floss');
    expect(decodeActivity(rec, '<script>|')!.emote).toBeNull();
    expect(decodeActivity(rec, undefined)!.bobber).toBeNull();
    expect(decodeActivity([0, 1], 'x')).toBeNull();
  });
});

describe('ranking', () => {
  it('host first, then lower id', () => {
    expect(outranks(5, 2, 5)).toBe(true);
    expect(outranks(2, 5, 5)).toBe(false);
    expect(outranks(2, 3, null)).toBe(true);
    expect(outranks(3, 3, null)).toBe(false);
  });
  it('lead with hysteresis', () => {
    const me = { id: 2, x: 0, z: 0 };
    expect(computeLead(me, [], 1, true)).toBe(true);
    expect(computeLead(me, [{ id: 1, x: 100, z: 0 }], 1, true)).toBe(false);
    expect(computeLead(me, [{ id: 3, x: 10, z: 0 }], 1, true)).toBe(true);
    // Between near and far: a lead stays lead, a non-lead stays non-lead.
    const mid = (LEAD.near + LEAD.far) / 2;
    expect(computeLead(me, [{ id: 1, x: mid, z: 0 }], 1, true)).toBe(true);
    expect(computeLead(me, [{ id: 1, x: mid, z: 0 }], 1, false)).toBe(false);
    expect(computeLead(me, [{ id: 1, x: LEAD.far + 1, z: 0 }], 1, false)).toBe(true);
  });
  it('owner of a fixed entity', () => {
    const ps = [{ id: 1, x: 0, z: 0 }, { id: 2, x: 50, z: 0 }, { id: 3, x: 500, z: 0 }];
    expect(pickOwner(40, 0, ps, 2, null)).toBe(2);
    expect(pickOwner(40, 0, ps, null, null)).toBe(1);
    expect(pickOwner(500, 10, ps, 2, null)).toBe(3);
    expect(pickOwner(-900, 0, ps, 2, null)).toBeNull();
    // The current owner keeps it a little farther out.
    expect(pickOwner(250, 0, [{ id: 3, x: 0, z: 0 }], null, 3)).toBe(3);
    expect(pickOwner(250, 0, [{ id: 3, x: 0, z: 0 }], null, null)).toBeNull();
  });
});

describe('publisher and mirror', () => {
  const ent = (id: number, x: number, v: number): OwnedEnt => ({ id, x, z: 0, rec: [id, v], str: `s${id}` });
  it('sends new and changed records to peers in range, gone ids when they leave', () => {
    const pub = createPublisher(SYS.quarry, { radius: 100, keyframeMs: 2000 });
    const peers = [{ id: 7, x: 0, z: 0 }, { id: 8, x: 1000, z: 0 }];
    let out = pub.tick(0, [ent(1, 10, 0), ent(2, 990, 0)], peers);
    expect(out.map((o) => o.to).sort()).toEqual([7, 8]);
    const to7 = out.find((o) => o.to === 7)!.msg;
    expect(to7.e).toEqual([[1, 0]]);
    expect(to7.s).toEqual([[1, 's1']]);
    // Nothing changed: nothing sent.
    expect(pub.tick(100, [ent(1, 10, 0), ent(2, 990, 0)], peers)).toEqual([]);
    // A change goes out without the string again.
    out = pub.tick(200, [ent(1, 10, 1), ent(2, 990, 0)], peers);
    expect(out).toHaveLength(1);
    expect(out[0].msg.e).toEqual([[1, 1]]);
    expect(out[0].msg.s).toBeUndefined();
    // Keyframe: unchanged records (and strings) again.
    out = pub.tick(2100, [ent(1, 10, 1), ent(2, 990, 0)], peers);
    expect(out).toHaveLength(2);
    // Entity 1 is gone: peer 7 is told.
    out = pub.tick(2200, [ent(2, 990, 0)], peers);
    expect(out).toEqual([{ to: 7, msg: { o: 'ent', y: SYS.quarry, t: 2200, e: [], g: [1] } }]);
  });
  it('splits big updates', () => {
    const pub = createPublisher(SYS.flock, { radius: 1e9 });
    const ents = Array.from({ length: MAX_RECS * 2 + 3 }, (_, i) => ent(i, 0, 0));
    const out = pub.tick(0, ents, [{ id: 1, x: 0, z: 0 }]);
    expect(out).toHaveLength(3);
    for (const o of out) expect(parseWireMsg(o.msg)).not.toBeNull();
  });
  it('a peer coming back gets everything again', () => {
    const pub = createPublisher(SYS.flock, { radius: 1e9 });
    pub.tick(0, [ent(1, 0, 0)], [{ id: 1, x: 0, z: 0 }]);
    pub.dropPeer(1);
    expect(pub.tick(10, [ent(1, 0, 0)], [{ id: 1, x: 0, z: 0 }])).toHaveLength(1);
  });
  it('mirror adds, changes, removes, sweeps and drops by owner', () => {
    const m = createMirror(1000);
    const msg = (e: number[][], extra: Partial<EntMsg> = {}): EntMsg => ({ o: 'ent', y: SYS.sky, t: 5, e, ...extra });
    let ch: MirrorChanges = m.apply(3, msg([[1, 10]], { s: [[1, 'banner']] }), 0);
    expect(ch.added.map((e) => [e.id, e.str])).toEqual([[1, 'banner']]);
    ch = m.apply(3, msg([[1, 11]]), 100);
    expect(ch.changed[0].rec).toEqual([1, 11]);
    expect(ch.changed[0].str).toBe('banner');
    // A string before its record is kept for it.
    m.apply(3, msg([], { s: [[2, 'early']] }), 100);
    expect(m.apply(3, msg([[2, 0]]), 150).added[0].str).toBe('early');
    expect(m.apply(3, msg([], { g: [2] }), 200).removed.map((e) => e.id)).toEqual([2]);
    m.apply(4, msg([[9, 0]]), 900);
    expect(m.sweep(1500).map((e) => e.id)).toEqual([1]);
    expect(m.dropOwner(4).map((e) => e.id)).toEqual([9]);
    expect(m.size()).toBe(0);
  });
});

describe('net.ts additions', () => {
  it('carries world messages', () => {
    const d: WireMsg = { o: 'cmd', y: SYS.quarry, i: 3, c: 1 };
    expect(parseMsg({ k: 'w', d })).toEqual({ k: 'w', d });
    expect(parseMsg({ k: 'w', d: { o: 'bad' } })).toBeNull();
  });
  it('accepts positions across the whole 1800 m map', () => {
    expect(parseMsg({ k: 'pos', p: [880, 1, -880, 0, -1, 0, 0, 0, 0, 0, -1, 0], t: 1 })).not.toBeNull();
    expect(parseMsg({ k: 'pos', p: [2000, 1, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0], t: 1 })).toBeNull();
  });
  it('round-trips an aircraft attitude and ignores a bad one', () => {
    const pose: RemotePose = {
      x: 1, y: 40, z: 2, yaw: 0.5, veh: 23, tint: 0, moving: true, aiming: false, hurt: false, chute: false, ride: null, pitch: 0,
      tilt: { pitch: 0.3, roll: -0.8 },
    };
    const w = encodePose(pose);
    const m = parseMsg({ k: 'pos', p: w.p, t: 1, r: w.r });
    expect(m && m.k === 'pos' ? m.r : null).toEqual(w.r);
    const back = poseFromArray(w.p, w.a, w.r);
    expect(back.tilt!.pitch).toBeCloseTo(0.3, 1);
    expect(back.tilt!.roll).toBeCloseTo(-0.8, 1);
    const bad = parseMsg({ k: 'pos', p: w.p, t: 1, r: [999, 0] });
    expect(bad && bad.k === 'pos' ? bad.r : 'x').toBeUndefined();
    expect(poseFromArray(w.p).tilt).toBeUndefined();
  });
});

describe('hub', () => {
  function fakeAdapter(log: string[], owned: OwnedEnt[]): (link: SyncLink) => SyncAdapter & { link: SyncLink } {
    return (link) => ({
      link, sys: SYS.quarry, radius: 100, hz: 100,
      collect(out) { out.push(...owned); },
      receive(ch) { log.push(`recv +${ch.added.length} ~${ch.changed.length} -${ch.removed.length}`); },
      command(from, id, c) { log.push(`cmd ${from} ${id} ${c}`); },
      ownerGone(owner, ents, adopt) { log.push(`gone ${owner} ${ents.length} adopt=${ents.map((e) => adopt(0, 0)).join(',')}`); },
      update() {},
      reset() { log.push('reset'); },
    });
  }
  function setup(myId: number | null, hostId: number | null) {
    const sent: { to: number | null; d: WireMsg }[] = [];
    let t = 0;
    const net = { myId, hostId, sendWire: (to: number | null, d: WireMsg) => { sent.push({ to, d }); } };
    const paid: string[] = [];
    const hub = createHub({ net, onPay: (n, r) => paid.push(`${n} ${r}`), now: () => t });
    return { hub, sent, net, paid, tick: (ms: number) => { t += ms; } };
  }

  it('does nothing offline or alone', () => {
    const log: string[] = [];
    const { hub, sent } = setup(null, null);
    hub.register(SYS.quarry, fakeAdapter(log, [{ id: 1, x: 0, z: 0, rec: [1] }]));
    hub.update(0.016, 0, 0);
    expect(sent).toEqual([]);
    expect(hub.lead()).toBe(true);
    expect(hub.hitTest(0, 0, 0)).toBe(false);
  });

  it('publishes to near peers, routes commands and payments, gives up the lead near the host', () => {
    const log: string[] = [];
    const s = setup(2, 1);
    const a = s.hub.register(SYS.quarry, fakeAdapter(log, [{ id: 1, x: 0, z: 0, rec: [1] }])) as SyncAdapter & { link: SyncLink };
    s.hub.peerPose(1, 30, 0);
    s.hub.update(0.016, 0, 0);
    expect(s.sent.some((m) => m.to === 1 && m.d.o === 'ent')).toBe(true);
    expect(s.hub.lead()).toBe(false); // the host (1) is 30 m away
    s.hub.onWire(1, { o: 'cmd', y: SYS.quarry, i: 1, c: 2 });
    expect(log).toContain('cmd 1 1 2');
    s.hub.onWire(1, { o: 'pay', n: 25, r: 'Thanks' });
    expect(s.paid).toEqual(['25 Thanks']);
    a.link.command(1, 5, 3, [9]);
    expect(s.sent.at(-1)).toEqual({ to: 1, d: { o: 'cmd', y: SYS.quarry, i: 5, c: 3, a: [9] } });
    // Commands to a stranger are dropped.
    const before = s.sent.length;
    a.link.command(42, 5, 3);
    expect(s.sent.length).toBe(before);
  });

  it('mirrors, hands entities out after the owner leaves, and resets when going offline', () => {
    const log: string[] = [];
    const s = setup(2, 1);
    s.hub.register(SYS.quarry, fakeAdapter(log, []));
    s.hub.peerPose(1, 10, 0);
    s.hub.update(0.016, 0, 0);
    s.hub.onWire(1, { o: 'ent', y: SYS.quarry, t: 0, e: [[4, 1]] });
    expect(log.at(-1)).toBe('recv +1 ~0 -0');
    expect(s.hub.stats().mirrors[SYS.quarry]).toBe(1);
    s.hub.peerPose(3, 15, 0);
    s.hub.peerLeave(1);
    s.net.hostId = 2; // the server makes me host after the 'left'
    s.tick(500);
    s.hub.update(0.016, 0, 0);
    expect(log).toContain('gone 1 1 adopt=true');
    // The last peer leaves: back to local play.
    s.hub.peerLeave(3);
    s.hub.update(0.016, 0, 0);
    expect(log.at(-1)).toBe('reset');
  });
});
