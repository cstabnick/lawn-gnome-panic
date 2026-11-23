// The online session: rooms, players and the relay (roadmap 8.6). The host sequences every player's actions and runs the
// ticks; a joiner gets a snapshot and catches up; guests resend what the host has not acknowledged; when the host leaves,
// the next host carries on from its own copy.
import type { Bus } from '../game/bus';
import type { Clock, NetPlayer, NetSession, NetStatus, RoomChoice, SimHost } from '../game/types';
import type { ActionEnvelope, PlayerKey, SimAction } from '../sim/types';
import { LOCAL_PLAYER } from '../sim/world';
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import { whileHidden } from '@lawn/mp/background';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import { getMyGnome } from '@lawn/gnome';
import { NET } from '../config';
import { interestedPlayers } from './interest';
import { packSnapshot, unpackSnapshot, toBase64, fromBase64, chunk } from './snapshot';
import type { DaygMsg, Pose, Snapshot } from './protocol';

export interface SessionDeps { host: SimHost; bus: Bus; clock: Clock; getPose: () => Pose; client?: NetClient<DaygMsg> }

type HiMsg = Extract<DaygMsg, { t: 'hi' }>;
type ActMsg = Extract<DaygMsg, { t: 'act' }>;
type EnvMsg = Extract<DaygMsg, { t: 'env' }>;
type TickMsg = Extract<DaygMsg, { t: 'tick' }>;
type SnapMsg = Extract<DaygMsg, { t: 'snap' }>;
type Match = Extract<ServerMsg<DaygMsg>, { t: 'match' }>;

/** Waits before each reconnect attempt after the socket closed; after the last one the session is 'lost'. */
const RECONNECT_DELAYS_MS = [1000, 2000, 4000];
const ROOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

interface SnapStream { id: string; of: number; parts: string[]; got: number; buffered: DaygMsg[] }

/** A fresh room code for 'create': the server refuses a queue with no code for DayG. */
function randomCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  return s;
}

export function createNetSession(deps: SessionDeps): NetSession {
  const { host, bus, clock } = deps;
  let status: NetStatus = 'offline';
  let code: string | null = null;
  let myId: number | null = null;
  let hostId: number | null = null;
  let myKey: PlayerKey = '';
  let myName = '';
  let myCharacter = '';
  let myUserId: string | null = null;
  let myLook = '';
  let client: NetClient<DaygMsg> | null = null;
  let gen = 0;                       // bumps on every teardown: stale async work checks it and stops
  let leaving = false;               // set by leave() and 'ended': no reconnects
  const roster = new Map<number, PlayerInfo>();
  const keys = new Map<number, PlayerKey>();
  const statusFns = new Set<(s: NetStatus) => void>();
  const msgFns = new Set<(from: number, m: DaygMsg) => void>();

  // guest
  const pending: { n: number; a: SimAction }[] = [];   // my acts the host has not acknowledged, oldest first
  let actN = 0;
  let awaiting = false;              // sent hi, no snapshot chunk yet: env and tick are dropped (the snapshot holds them)
  let stream: SnapStream | null = null;  // the snapshot being received: env and tick are buffered
  let remoteSun: number | null = null;
  let departedKey: PlayerKey | null = null; // the host that just left: its leave is applied if I take over
  let resendT = 0;

  // host
  const lastN = new Map<PlayerKey, number>();           // highest act n applied per guest key
  let curAck: { key: PlayerKey; n: number } | null = null;  // the guest act being applied right now
  let outAck: { key: PlayerKey; n: number } | null = null;  // the ack that goes with the next env batch
  let batch: ActionEnvelope[] = [];
  let busy = false;                  // a snapshot is being packed: broadcasts wait in `deferred`
  let deferred: DaygMsg[] = [];
  const hiQueue: number[] = [];
  let sunT = 0;

  let poseT = 0;
  let stopHidden: (() => void) | null = null;
  let reconnectT: ReturnType<typeof setTimeout> | null = null;

  function setStatus(s: NetStatus): void {
    if (status === s) return;
    status = s;
    for (const fn of statusFns) fn(s);
    bus.emit('net-status', { status: s });
  }

  function transmit(to: number | null, m: DaygMsg): void {
    client?.send(to, m);
  }

  /** Host broadcast: keeps the order of env, tick and sun while a snapshot is being packed. */
  function emitAll(m: DaygMsg): void {
    if (busy) deferred.push(m);
    else transmit(null, m);
  }

  function flushEnv(): void {
    if (batch.length === 0) return;
    emitAll({ t: 'env', e: batch, ack: outAck });
    batch = [];
    outAck = null;
  }

  function addRoster(p: PlayerInfo): void {
    roster.set(p.id, p);
    keys.set(p.id, p.userId ? 'u:' + p.userId : 'g:' + p.id);
  }

  function keyFor(id: number): PlayerKey | null {
    return keys.get(id) ?? null;
  }

  function idFor(key: PlayerKey): number | null {
    for (const [id, k] of keys) if (k === key) return id;
    return null;
  }

  // ---------------------------------------------------------------- host side

  function onHi(from: number, d: HiMsg): void {
    if (host.role !== 'host') return;
    keys.set(from, d.key);
    if (!host.world.players[d.key]?.online) {
      host.applyFor(d.key, { kind: 'player-join', name: d.name, look: d.look, userId: d.userId, region: null });
    }
    hiQueue.push(from);
    pump();
  }

  function onAct(from: number, d: ActMsg): void {
    if (host.role !== 'host') return;
    const key = keys.get(from);
    if (key === undefined) return;
    const last = lastN.get(key) ?? 0;
    if (d.n <= last) return;
    lastN.set(key, d.n);
    curAck = { key, n: d.n };
    host.applyFor(key, d.a);
    curAck = null;
  }

  /** Serves queued joiners one at a time, each with a snapshot taken after the broadcasts before it. */
  function pump(): void {
    if (busy) return;
    if (deferred.length > 0) {
      const d = deferred;
      deferred = [];
      for (const m of d) transmit(null, m);
    }
    const id = hiQueue.shift();
    if (id === undefined) return;
    serveSnapshot(id);
  }

  function serveSnapshot(id: number): void {
    const g = gen;
    flushEnv();
    busy = true;
    const snap = host.snapshot();
    packSnapshot(snap).then((bytes) => {
      if (g !== gen) return;
      const parts = chunk(toBase64(bytes), NET.chunkChars);
      const sid = `${Date.now().toString(36)}-${id}-${Math.random().toString(36).slice(2, 8)}`;
      parts.forEach((d, i) => transmit(id, { t: 'snap', id: sid, i, of: parts.length, d }));
      busy = false;
      pump();
    });
  }

  // ---------------------------------------------------------------- guest side

  function sendHi(): void {
    if (!client || hostId === null || hostId === myId) return;
    awaiting = true;
    stream = null;
    transmit(hostId, { t: 'hi', key: myKey, name: myName, look: myLook, userId: myUserId, snap: -1 });
  }

  function dropPending(n: number): void {
    while (pending.length > 0 && pending[0].n <= n) pending.shift();
  }

  function applyGuest(m: EnvMsg | TickMsg): void {
    if (m.t === 'env') {
      for (const e of m.e) host.receive(e);
    } else {
      host.receiveTick(m.tick, m.hash);
      remoteSun = m.sun;
    }
  }

  function onGuestStream(m: EnvMsg | TickMsg): void {
    if (m.t === 'env' && m.ack && m.ack.key === myKey) dropPending(m.ack.n);
    if (stream) stream.buffered.push(m);
    else if (!awaiting) applyGuest(m);
  }

  function onSnap(d: SnapMsg): void {
    if (!stream) {
      if (!awaiting) return;
      stream = { id: d.id, of: d.of, parts: [], got: 0, buffered: [] };
    }
    if (stream.id !== d.id) return;
    if (stream.parts[d.i] === undefined) stream.got += 1;
    stream.parts[d.i] = d.d;
    if (stream.got === stream.of) void finishStream(stream);
  }

  async function finishStream(s: SnapStream): Promise<void> {
    const g = gen;
    const snap: Snapshot = await unpackSnapshot(fromBase64(s.parts.join('')));
    if (g !== gen) return;
    host.load(snap);
    stream = null;
    awaiting = false;
    bus.emit('world-loaded', { tick: snap.tick });
    for (const m of s.buffered) applyGuest(m as EnvMsg | TickMsg);
  }

  /** The host found my copy out of step: ask for a fresh snapshot. */
  function resync(tick: number): void {
    bus.emit('desync', { tick });
    sendHi();
  }

  // ---------------------------------------------------------------- roles

  /** Takes over the world as host: my own player joins it, and the players who left the old host go. */
  function takeHostWorld(): void {
    if (myKey !== LOCAL_PLAYER && host.world.players[LOCAL_PLAYER]?.online) {
      host.applyFor(LOCAL_PLAYER, { kind: 'player-leave' });
    }
    if (departedKey && departedKey !== myKey && host.world.players[departedKey]?.online) {
      host.applyFor(departedKey, { kind: 'player-leave' });
    }
    departedKey = null;
    if (!host.world.players[myKey]?.online) {
      host.applyFor(myKey, { kind: 'player-join', name: myName, look: myLook, userId: myUserId, region: null });
    }
  }

  function becomeHost(handOff: boolean): void {
    host.setRole('host', myKey);
    setStatus('host');
    awaiting = false;
    stream = null;
    takeHostWorld();
    if (handOff) {
      const mine = pending.splice(0);
      for (const p of mine) host.apply(p.a);
      bus.emit('host-changed', { me: true });
    }
  }

  function becomeGuest(): void {
    host.setRole('guest', myKey);
    setStatus('guest');
    sendHi();
  }

  function onMatch(m: Match): void {
    myId = m.you;
    hostId = m.hostId;
    roster.clear();
    keys.clear();
    for (const p of m.players) addRoster(p);
    keys.set(m.you, myKey);
    lastN.clear();
    if (hostId === myId) becomeHost(false);
    else becomeGuest();
  }

  function onHostChange(newHost: number): void {
    hostId = newHost;
    if (newHost === myId) {
      becomeHost(true);
      return;
    }
    host.setRole('guest', myKey);
    setStatus('guest');
    bus.emit('host-changed', { me: false });
    for (const p of pending) transmit(hostId, { t: 'act', n: p.n, a: p.a });
    sendHi();
  }

  function onLeft(id: number): void {
    const key = keys.get(id) ?? null;
    if (id === hostId && host.role !== 'host') departedKey = key;
    if (host.role === 'host' && key && host.world.players[key]?.online) {
      host.applyFor(key, { kind: 'player-leave' });
    }
    roster.delete(id);
    keys.delete(id);
  }

  // ---------------------------------------------------------------- server messages

  function onRelay(from: number, d: DaygMsg): void {
    switch (d.t) {
      case 'hi': onHi(from, d); break;
      case 'act': onAct(from, d); break;
      case 'snap': if (from === hostId) onSnap(d); break;
      case 'env': if (from === hostId) onGuestStream(d); break;
      case 'tick': if (from === hostId) onGuestStream(d); break;
      case 'sun': if (from === hostId) remoteSun = d.sun; break;
      default: break;
    }
    for (const fn of [...msgFns]) fn(from, d);
  }

  function onServer(m: ServerMsg<DaygMsg>): void {
    switch (m.t) {
      case 'welcome':
        if (m.resumed) {
          myId = m.id;
          hostId = m.resumed.hostId;
          roster.clear();
          keys.clear();
          for (const p of m.resumed.players) addRoster(p);
          keys.set(m.id, myKey);
        }
        break;
      case 'match': onMatch(m); break;
      case 'joined': addRoster(m.player); break;
      case 'left': onLeft(m.id); break;
      case 'host': onHostChange(m.hostId); break;
      case 'relay': onRelay(m.from, m.d); break;
      case 'ended': leaving = true; teardown('offline'); break;
      default: break;
    }
  }

  function onClose(): void {
    if (leaving || !client || status === 'offline' || status === 'lost' || status === 'connecting') return;
    retry(0, gen);
  }

  function retry(attempt: number, g: number): void {
    reconnectT = setTimeout(async () => {
      reconnectT = null;
      const c = client;
      if (g !== gen || !c) return;
      try {
        const kept = await c.connect();
        if (g !== gen) return;
        if (!kept) {
          setStatus('lost');
          return;
        }
        if (hostId === myId) {
          setStatus('host');
        } else {
          host.setRole('guest', myKey);
          setStatus('guest');
          for (const p of pending) transmit(hostId, { t: 'act', n: p.n, a: p.a });
          sendHi();
        }
      } catch {
        if (attempt + 1 < RECONNECT_DELAYS_MS.length) retry(attempt + 1, g);
        else setStatus('lost');
      }
    }, RECONNECT_DELAYS_MS[attempt]);
  }

  function teardown(next: NetStatus): void {
    gen += 1;
    if (reconnectT !== null) {
      clearTimeout(reconnectT);
      reconnectT = null;
    }
    stopHidden?.();
    stopHidden = null;
    hostId = null;
    myId = null;
    code = null;
    roster.clear();
    keys.clear();
    pending.length = 0;
    lastN.clear();
    batch = [];
    outAck = null;
    curAck = null;
    busy = false;
    deferred = [];
    hiQueue.length = 0;
    awaiting = false;
    stream = null;
    remoteSun = null;
    departedKey = null;
    setStatus(next);
  }

  // ---------------------------------------------------------------- per frame

  function update(dt: number): void {
    if (!client || status === 'offline' || status === 'lost' || status === 'connecting') return;
    if (host.role === 'host') {
      flushEnv();
      sunT += dt;
      if (sunT >= NET.sunEverySec) {
        sunT = 0;
        emitAll({ t: 'sun', sun: clock.sunHours });
      }
    } else if (remoteSun !== null) {
      const diff = remoteSun - clock.sunHours;
      if (Math.abs(diff) > 0.05) clock.sunHours += diff * Math.min(1, dt * 2);
    }
    if (host.role === 'guest' && hostId !== null && pending.length > 0) {
      resendT += dt;
      if (resendT >= NET.resendSec) {
        resendT = 0;
        for (const p of pending) transmit(hostId, { t: 'act', n: p.n, a: p.a });
      }
    }
    poseT += dt;
    if (poseT >= 1 / NET.poseHz) {
      poseT = 0;
      const p = deps.getPose();
      for (const key of interestedPlayers(host.world, myKey)) {
        const id = idFor(key);
        if (id !== null) transmit(id, { t: 'pose', p });
      }
    }
  }

  // ---------------------------------------------------------------- wiring

  host.onAction((env: ActionEnvelope) => {
    if (host.role !== 'host') return;
    batch.push(env);
    if (curAck) outAck = curAck;
  });
  host.onTick((r) => {
    if (r.desync) {
      if (host.role === 'guest') resync(r.tick);
      return;
    }
    if (host.role !== 'host') return;
    flushEnv();
    emitAll({ t: 'tick', tick: r.tick, hash: r.hash, sun: clock.sunHours });
  });
  /** Guest: my actions wait in `pending` until the host acknowledges them, and go to the host now. */
  function outbox(a: SimAction): void {
    actN += 1;
    const n = actN;
    pending.push({ n, a });
    if (hostId !== null && hostId !== myId) transmit(hostId, { t: 'act', n, a });
  }

  return {
    get status() { return status; },
    get code() { return code; },
    get myId() { return myId; },
    players(): NetPlayer[] {
      return [...roster.values()].map((p) => ({
        id: p.id,
        key: keyFor(p.id) ?? (p.userId ? 'u:' + p.userId : 'g:' + p.id),
        name: p.name,
        character: p.character,
        userId: p.userId ?? null,
        color: p.color,
      }));
    },
    start: async (c: RoomChoice, me: { name: string; character: string }): Promise<void> => {
      if (c.mode === 'solo') return;
      if (client) leave();
      myName = me.name;
      myCharacter = me.character;
      myUserId = getMyGnome()?.userId ?? null;
      myLook = getMyGnome()?.code ?? '';
      myKey = myUserId ? 'u:' + myUserId : '';
      leaving = false;
      code = c.code ?? randomCode();
      setStatus('connecting');
      const sock = deps.client ?? createNetClient<DaygMsg>(serverUrl(), 'dayg', { name: myName, character: myCharacter, resumable: true });
      client = sock;
      sock.onMessage(onServer);
      sock.onClose(onClose);
      stopHidden = whileHidden((dt) => update(dt));
      try {
        await sock.connect();
      } catch (err) {
        client = null;
        teardown('offline');
        throw err;
      }
      if (client !== sock) return;
      host.setOutbox(outbox);
      myId = sock.id;
      if (myId !== null) {
        myKey = myUserId ? 'u:' + myUserId : 'g:' + myId;
      }
      sock.queue(code, myCharacter, myName);
    },
    leave: (): void => leave(),
    update,
    send: (to: number | null, m: DaygMsg): void => transmit(to, m),
    onStatus: (fn: (s: NetStatus) => void): (() => void) => {
      statusFns.add(fn);
      return () => { statusFns.delete(fn); };
    },
    onMessage: (fn: (from: number, m: DaygMsg) => void): (() => void) => {
      msgFns.add(fn);
      return () => { msgFns.delete(fn); };
    },
    keyOf: (id: number): PlayerKey | null => keyFor(id),
    idOf: (key: PlayerKey): number | null => idFor(key),
  };

  function leave(): void {
    if (client) {
      transmit(null, { t: 'bye' });
      client.leave();
    }
    client = null;
    leaving = true;
    host.setOutbox(null);
    teardown('offline');
    host.setRole('solo', LOCAL_PLAYER);
  }
}
