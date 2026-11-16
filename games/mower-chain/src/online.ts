// Online session for Mower Chain, on the shared matchmaking server (packages/mp-server, game 'mower-chain').
//
// The first player in an arena hosts it: one browser runs the World at a fixed SIM_HZ step and broadcasts
// snapshots and events. Everyone else sends their input to the host and draws the host's latest snapshot.
// If the server is unreachable (or the match does not start in time, or the host goes silent) the same
// World runs locally, offline, with bots.
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import { checkName } from '@lawn/mp/textFilter';
import { HELLO_GAME, TUNING, type MowerInput, type MowerSnap, type Snapshot, type WorldEvent } from './config';
import type { GameMsg } from './net/protocol';
import { World } from './sim';

export type SessionStatus = 'connecting' | 'online' | 'offline';

export interface Session {
  readonly status: SessionStatus;
  /** My mower id, or null until known. */
  readonly myId: number | null;
  readonly isHost: boolean;
  /** Human players in the arena (including me). */
  readonly humans: number;
  /** Call every frame with the frame time in ms. Returns what to draw, or null before the first snapshot. */
  update(dtMs: number): Snapshot | null;
  setInput(input: MowerInput): void;
  /** Ask to play again after dying. */
  respawn(): void;
  /** Events since the last call, then clears them. */
  drainEvents(): WorldEvent[];
  destroy(): void;
}

const MATCH_WAIT_MS = 4000;     // no 'match' within this long: play offline
const SILENT_MS = 5000;         // a client with no snapshot for this long: play offline
const OFFLINE_ID = 1;
const OFFLINE_COLOR = 0x4fd8ff;
const SIM_DT = 1 / TUNING.SIM_HZ;
const SNAP_MS = 1000 / TUNING.SNAP_HZ;
const INPUT_MS = 1000 / TUNING.INPUT_HZ;
const MAX_STEPS = 5;            // sim steps per frame, so a stalled tab does not spiral
const MAX_EVENTS = 200;         // queued events kept when nobody drains them

// ---------------------------------------------------------------- validation of anything that came off the network

type Dict = Record<string, unknown>;

function isDict(v: unknown): v is Dict {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
function isNumArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every(isNum);
}
function isInput(v: unknown): v is MowerInput {
  return isDict(v) && isNum(v.angle) && typeof v.boost === 'boolean';
}
function isPlayer(v: unknown): v is PlayerInfo {
  return isDict(v) && isNum(v.id) && typeof v.name === 'string' && typeof v.character === 'string' && isNum(v.color);
}
function isMowerSnap(v: unknown): v is MowerSnap {
  return isDict(v) && isNum(v.id) && typeof v.name === 'string' && isNum(v.color)
    && typeof v.alive === 'boolean' && isNum(v.protectedS) && typeof v.boosting === 'boolean'
    && isNum(v.score) && isNumArray(v.segs) && v.segs.length % 2 === 0;
}
function isSnapshot(v: unknown): v is Snapshot {
  return isDict(v) && isNum(v.t) && Array.isArray(v.mowers) && v.mowers.every(isMowerSnap)
    && isNumArray(v.pellets) && v.pellets.length % 3 === 0;
}
function isWorldEvent(v: unknown): v is WorldEvent {
  return isDict(v) && (v.kind === 'kill' || v.kind === 'wall' || v.kind === 'spawn') && isNum(v.id)
    && typeof v.name === 'string' && (v.by === undefined || isNum(v.by))
    && (v.byName === undefined || typeof v.byName === 'string');
}

// ---------------------------------------------------------------- session

export function createSession(name: string): Session {
  const checked = checkName(name);
  const displayName = checked.ok ? checked.name : 'Mower';
  const url = serverUrl();

  let status: SessionStatus = 'connecting';
  let destroyed = false;
  let myId: number | null = null;
  let hostId: number | null = null;
  let isHost = false;
  let players: PlayerInfo[] = [];
  let world: World | null = null;
  let latestSnap: Snapshot | null = null;
  let events: WorldEvent[] = [];
  let lastInput: MowerInput | null = null;
  let simAcc = 0;                 // ms-based accumulator for fixed-step simulation (seconds)
  let snapAcc = 0;                // ms since the last snapshot
  let lastSnapAt = 0;             // performance.now() of the last snapshot heard (client)
  let lastInputSentAt = 0;        // performance.now() of the last input sent (client)
  let client: NetClient<GameMsg> | null = null;
  let matchTimer: ReturnType<typeof setTimeout> | null = null;

  function pushEvent(e: WorldEvent): void {
    if (events.length >= MAX_EVENTS) events.shift();
    events.push(e);
  }

  function clearMatchTimer(): void {
    if (matchTimer !== null) {
      clearTimeout(matchTimer);
      matchTimer = null;
    }
  }

  /** Drops the connection. Clears `client` first so the close listener does nothing. */
  function dropClient(): void {
    const c = client;
    client = null;
    c?.drop();
  }

  /** Becomes the host: a fresh World with every known human in it. */
  function startArena(seed: number): void {
    isHost = true;
    const w = new World(seed);
    world = w;
    for (const p of players) w.addMower(p.id, p.name, p.color);
    if (myId !== null && lastInput) w.setInput(myId, lastInput);
    simAcc = 0;
    snapAcc = SNAP_MS;            // first snapshot goes out on the next update
    latestSnap = w.snapshot(performance.now());
  }

  function goOffline(): void {
    if (destroyed || status === 'offline') return;
    clearMatchTimer();
    dropClient();
    status = 'offline';
    myId = OFFLINE_ID;
    hostId = OFFLINE_ID;
    players = [{ id: OFFLINE_ID, name: displayName, character: 'mower', color: OFFLINE_COLOR }];
    startArena(Date.now());
  }

  function onMatch(you: unknown, host: unknown, list: unknown, seed: unknown): void {
    if (status !== 'connecting') return;
    if (!isNum(you) || !isNum(host) || !Array.isArray(list) || !list.every(isPlayer)) {
      goOffline();
      return;
    }
    clearMatchTimer();
    status = 'online';
    myId = you;
    hostId = host;
    players = list;
    lastSnapAt = performance.now();
    lastInputSentAt = 0;
    if (you === host) {
      startArena(isNum(seed) ? seed : Date.now());
    } else {
      isHost = false;
      world = null;
    }
  }

  function onRelay(from: unknown, raw: unknown): void {
    if (status !== 'online' || !isNum(from) || !isDict(raw)) return;
    if (isHost) {
      // Host: the only messages that matter are a client's input and respawn request.
      const w = world;
      if (!w) return;
      if (raw.k === 'input' && isInput(raw.in)) w.setInput(from, raw.in);
      else if (raw.k === 'respawn') w.respawn(from);
      return;
    }
    // Client: only the current host may drive what I draw.
    if (from !== hostId) return;
    if (raw.k === 'snap') {
      if (isSnapshot(raw.s)) {
        latestSnap = raw.s;
        lastSnapAt = performance.now();
      }
    } else if (raw.k === 'events' && Array.isArray(raw.e)) {
      for (const e of raw.e) if (isWorldEvent(e)) pushEvent(e);
    }
  }

  function onServer(m: ServerMsg<GameMsg>): void {
    if (destroyed) return;
    switch (m.t) {
      case 'match':
        onMatch(m.you, m.hostId, m.players, m.seed);
        return;
      case 'joined': {
        if (status !== 'online' || !isPlayer(m.player)) return;
        const p = m.player;
        if (!players.some((q) => q.id === p.id)) players.push(p);
        if (isHost && world) world.addMower(p.id, p.name, p.color);
        return;
      }
      case 'left': {
        if (status !== 'online' || !isNum(m.id)) return;
        const id = m.id;
        players = players.filter((p) => p.id !== id);
        if (isHost && world) world.removeMower(id);
        return;
      }
      case 'host': {
        if (status !== 'online' || !isNum(m.hostId)) return;
        hostId = m.hostId;
        if (m.hostId === myId) {
          if (!isHost) startArena(Date.now());
        } else {
          isHost = false;
          world = null;
          lastSnapAt = performance.now();
        }
        return;
      }
      case 'relay':
        onRelay(m.from, m.d);
        return;
      case 'ended':
        goOffline();
        return;
      default:
        return;
    }
  }

  function update(dtMs: number): Snapshot | null {
    if (destroyed) return null;
    const now = performance.now();
    const dt = isNum(dtMs) && dtMs > 0 ? dtMs : 0;

    if (status === 'online' && !isHost && now - lastSnapAt > SILENT_MS) {
      goOffline();
      return latestSnap;
    }

    const w = world;
    if (w) {
      // Host (or offline): fixed-step simulation, capped per frame.
      simAcc += dt / 1000;
      let steps = 0;
      while (simAcc >= SIM_DT && steps < MAX_STEPS) {
        w.step(SIM_DT);
        simAcc -= SIM_DT;
        steps++;
      }
      if (simAcc >= SIM_DT) simAcc = 0;

      snapAcc += dt;
      if (snapAcc >= SNAP_MS) {
        snapAcc = Math.min(snapAcc - SNAP_MS, SNAP_MS);
        const snap = w.snapshot(now);
        latestSnap = snap;
        if (status === 'online' && client) client.send(null, { k: 'snap', s: snap });
      }

      const fresh = w.drainEvents();
      if (fresh.length > 0) {
        for (const e of fresh) pushEvent(e);
        if (status === 'online' && client) client.send(null, { k: 'events', e: fresh });
      }
    } else if (status === 'online' && client && hostId !== null && lastInput && now - lastInputSentAt >= INPUT_MS) {
      // Client: send my latest input to the host at INPUT_HZ.
      client.send(hostId, { k: 'input', in: lastInput });
      lastInputSentAt = now;
    }

    return latestSnap;
  }

  function setInput(input: MowerInput): void {
    if (destroyed || !isInput(input)) return;
    lastInput = { angle: input.angle, boost: input.boost };
    if (isHost && world && myId !== null) world.setInput(myId, lastInput);
  }

  function respawn(): void {
    if (destroyed || myId === null) return;
    if (isHost) {
      if (world) world.respawn(myId);
      return;
    }
    if (status === 'online' && client && hostId !== null) client.send(hostId, { k: 'respawn' });
  }

  function drainEvents(): WorldEvent[] {
    const out = events;
    events = [];
    return out;
  }

  function destroy(): void {
    destroyed = true;
    clearMatchTimer();
    dropClient();
    world = null;
    latestSnap = null;
    events = [];
    lastInput = null;
  }

  // Start: offline at once if no server is configured, else connect, queue, and wait for a match.
  if (!url) {
    goOffline();
  } else {
    const net = createNetClient<GameMsg>(url, HELLO_GAME, { name: displayName, character: 'mower' });
    client = net;
    net.onMessage(onServer);
    net.onClose(() => {
      if (client === net) {
        client = null;
        goOffline();
      }
    });
    matchTimer = setTimeout(() => {
      matchTimer = null;
      if (status === 'connecting') goOffline();
    }, MATCH_WAIT_MS);
    net.connect().then(
      () => {
        if (!destroyed && client === net && status === 'connecting') net.queue(null, 'mower', displayName);
      },
      () => goOffline(),
    );
  }

  return {
    get status() { return status; },
    get myId() { return myId; },
    get isHost() { return isHost; },
    get humans() { return players.length; },
    update,
    setInput,
    respawn,
    drainEvents,
    destroy,
  };
}
