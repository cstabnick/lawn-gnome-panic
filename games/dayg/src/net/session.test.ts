// Net session tests (roadmap 8.6): several clients on an in-memory relay hub, one host, guests that join and follow.
import { describe, it, expect } from 'vitest';
import type { NetClient } from '@lawn/mp/client';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import type { Clock, RoomChoice } from '../game/types';
import type { RegionId, SimAction } from '../sim/types';
import { createBus } from '../game/bus';
import { createWorld, hashWorld } from '../sim/world';
import { createSimHost } from './simHost';
import { createNetSession } from './session';
import type { DaygMsg } from './protocol';

const CHOICE: RoomChoice = { mode: 'create', code: 'ROOM1', title: 'Test', pace: 'standard', roomMode: 'co-op' };
const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 40));

/** An in-memory relay: one match, the first member hosts; relays go to one player or everyone else. */
class FakeHub {
  members: FakeClient[] = [];
  hostId: number | null = null;
  private nextId = 1;
  /** Return true to drop a relayed message (from, to, d). */
  dropRelay: ((from: number, to: number | null, d: DaygMsg) => boolean) | null = null;

  newClient(): FakeClient {
    return new FakeClient(this);
  }

  allocId(): number {
    return this.nextId++;
  }

  join(c: FakeClient, character: string, name: string): void {
    if (c.id === null) c.id = this.allocId();
    const info: PlayerInfo = { id: c.id, name, character, color: 0xff5a5a + c.id };
    c.info = info;
    if (this.members.length === 0) this.hostId = c.id;
    this.members.push(c);
    const players = this.members.map((m) => m.info as PlayerInfo);
    c.deliver({ t: 'match', matchId: 'm1', seed: 1, hostId: this.hostId as number, you: c.id, players });
    for (const m of this.members) if (m !== c) m.deliver({ t: 'joined', player: info });
  }

  relay(from: number, to: number | null, d: DaygMsg): void {
    if (this.dropRelay?.(from, to, d)) return;
    const targets = to === null ? this.members.filter((m) => m.id !== from) : this.members.filter((m) => m.id === to);
    for (const t of targets) t.deliver({ t: 'relay', from, d });
  }

  leave(c: FakeClient): void {
    const i = this.members.indexOf(c);
    if (i < 0) return;
    this.members.splice(i, 1);
    for (const m of this.members) m.deliver({ t: 'left', id: c.id as number, reason: 'quit' });
    if (this.hostId === c.id && this.members.length > 0) {
      this.hostId = this.members[0].id as number;
      for (const m of this.members) m.deliver({ t: 'host', hostId: this.hostId });
    }
  }
}

class FakeClient implements NetClient<DaygMsg> {
  id: number | null = null;
  info: PlayerInfo | null = null;
  connected = false;
  lastHeardAt = 0;
  private listeners: ((m: ServerMsg<DaygMsg>) => void)[] = [];
  private closers: (() => void)[] = [];

  constructor(private hub: FakeHub) {}

  deliver(m: ServerMsg<DaygMsg>): void {
    for (const fn of this.listeners) fn(m);
  }

  connect(): Promise<boolean> {
    if (this.id === null) this.id = this.hub.allocId();
    this.connected = true;
    return Promise.resolve(false);
  }
  queue(_code: string | null, character: string, name: string): void {
    this.hub.join(this, character, name);
  }
  leave(): void {
    this.connected = false;
    this.hub.leave(this);
  }
  send(to: number | null, d: DaygMsg): void {
    this.hub.relay(this.id as number, to, d);
  }
  chat(): void {}
  drop(): void {
    this.leave();
  }
  onMessage(fn: (m: ServerMsg<DaygMsg>) => void): void {
    this.listeners.push(fn);
  }
  onClose(fn: () => void): void {
    this.closers.push(fn);
  }
}

function clockStub(): Clock {
  return { sunHours: 0, hourOfDay: 0, day: 0, night: false, light: 1, season: 'spring', rate: 1, update: () => 0, setRate: () => {} } as unknown as Clock;
}

interface Node {
  client: FakeClient;
  host: ReturnType<typeof createSimHost>;
  session: ReturnType<typeof createNetSession>;
  bus: ReturnType<typeof createBus>;
  clock: Clock;
  world: ReturnType<typeof createWorld>['world'];
  streams: ReturnType<typeof createWorld>['streams'];
}

function makeNode(hub: FakeHub): Node {
  const { world, streams } = createWorld(7);
  const host = createSimHost({ world, streams, worker: false, me: 'local' });
  const bus = createBus();
  const clock = clockStub();
  const client = hub.newClient();
  const session = createNetSession({
    host, bus, clock, getPose: () => ({ x: 0, y: 0, z: 0, f: 0, a: 0, r: null, held: null }), client,
  });
  return { client, host, session, bus, clock, world, streams };
}

const ACT: SimAction = { kind: 'noise', region: 'leaning-rows' as RegionId, amount: 1 };

describe('net session', () => {
  it('host and two guests stay equal after 30 actions and 24 ticks', async () => {
    const hub = new FakeHub();
    const a = makeNode(hub);
    const b = makeNode(hub);
    const c = makeNode(hub);
    await a.session.start(CHOICE, { name: 'A', character: '' });
    await b.session.start(CHOICE, { name: 'B', character: '' });
    await c.session.start(CHOICE, { name: 'C', character: '' });
    await settle();
    const nodes = [a, b, c];
    const before = hashWorld(a.world);
    for (let i = 0; i < 30; i++) {
      const n = nodes[i % 3];
      n.host.apply(ACT);
      a.session.update(0.1);
      await settle();
    }
    a.host.update(24);
    for (const n of nodes) n.session.update(0.1);
    await settle();
    expect(hashWorld(b.world)).toBe(hashWorld(a.world));
    expect(hashWorld(c.world)).toBe(hashWorld(a.world));
    expect(hashWorld(a.world)).not.toBe(before);
  }, 60_000);

  it('a late joiner gets the snapshot while envelopes keep flowing and ends equal', async () => {
    const hub = new FakeHub();
    const a = makeNode(hub);
    const b = makeNode(hub);
    await a.session.start(CHOICE, { name: 'A', character: '' });
    await b.session.start(CHOICE, { name: 'B', character: '' });
    await settle();
    for (let i = 0; i < 5; i++) {
      b.host.apply(ACT);
      a.session.update(0.1);
    }
    const late = makeNode(hub);
    const starting = late.session.start(CHOICE, { name: 'L', character: '' });
    for (let i = 0; i < 5; i++) {
      a.host.apply(ACT);
      a.session.update(0.1);
    }
    await starting;
    await settle();
    a.host.update(12);
    a.session.update(0.1);
    await settle();
    expect(hashWorld(late.world)).toBe(hashWorld(a.world));
    expect(hashWorld(b.world)).toBe(hashWorld(a.world));
  }, 60_000);

  it('the host leaves, a guest becomes host, actions continue and the remaining copies stay equal', async () => {
    const hub = new FakeHub();
    const a = makeNode(hub);
    const b = makeNode(hub);
    const c = makeNode(hub);
    await a.session.start(CHOICE, { name: 'A', character: '' });
    await b.session.start(CHOICE, { name: 'B', character: '' });
    await c.session.start(CHOICE, { name: 'C', character: '' });
    await settle();
    a.host.update(4);
    a.session.update(0.1);
    a.session.leave();
    for (let i = 0; i < 50 && hashWorld(c.world) !== hashWorld(b.world); i++) await settle();
    expect(b.host.role).toBe('host');
    expect(c.host.role).toBe('guest');
    c.host.apply(ACT);
    b.host.apply(ACT);
    b.host.update(10);
    b.session.update(0.1);
    await settle();
    expect(hashWorld(c.world)).toBe(hashWorld(b.world));
  }, 60_000);

  it('a dropped act is resent and applied once', async () => {
    const hub = new FakeHub();
    const a = makeNode(hub);
    const b = makeNode(hub);
    await a.session.start(CHOICE, { name: 'A', character: '' });
    await b.session.start(CHOICE, { name: 'B', character: '' });
    await settle();
    let applied = 0;
    a.host.onAction(() => { applied += 1; });
    let drops = 1;
    hub.dropRelay = (_from, _to, d) => {
      if (d.t === 'act' && drops > 0) { drops -= 1; return true; }
      return false;
    };
    b.host.apply(ACT);
    await settle();
    expect(applied).toBe(0);
    b.session.update(2.1);
    await settle();
    expect(applied).toBe(1);
    b.session.update(2.1);
    await settle();
    expect(applied).toBe(1);
  });
});
