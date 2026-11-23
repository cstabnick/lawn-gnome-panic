// Online play over @lawn/mp: quick match or a room code. The host's browser runs the table; this file only carries messages.
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import { steadyInterval } from '@lawn/mp/background';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import { SEAT_COUNT, type Action, type NetStatus, type TableInput, type TableState } from './config';

export type NetMsg = { k: 'snap'; s: TableState } | { k: 'in'; i: TableInput } | { k: 'ping' };

export interface NetHandlers {
  onMatch(you: number, hostId: number, players: PlayerInfo[]): void;
  onJoined(p: PlayerInfo): void;
  onLeft(id: number): void;
  onHost(hostId: number): void;
  onSnapshot(s: TableState): void;
  onInput(from: number, i: TableInput): void;
  onChat(from: number, text: string): void;
  onLost(): void;
}

export interface Net {
  readonly status: NetStatus;
  available(): boolean;
  start(code: string | null, name: string, character: string): void;
  leave(): void;
  sendSnapshot(s: TableState): void;
  sendInput(i: TableInput): void;
  chat(text: string): void;
  update(dt: number): void;
}

/** Keeps us inside the server's MATCH_SILENT_S (8 s) silence limit. */
const PING_EVERY_S = 2;
const ACTIONS: readonly string[] = ['hit', 'stand', 'double', 'split'];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Checks that a snapshot looks like a table; junk is dropped. */
function parseTable(v: unknown): TableState | null {
  if (!isObj(v)) return null;
  if (!Array.isArray(v.seats) || v.seats.length !== SEAT_COUNT) return null;
  if (typeof v.phase !== 'string' || !Array.isArray(v.bubbles) || !Array.isArray(v.dealer)) return null;
  return v as unknown as TableState;
}

/** Checks a client's click and returns a clean copy of it, or null. */
function parseInput(v: unknown): TableInput | null {
  if (!isObj(v)) return null;
  if (v.k === 'bet' && isNum(v.amount)) return { k: 'bet', amount: v.amount };
  if (v.k === 'ready') return { k: 'ready' };
  if (v.k === 'act' && typeof v.a === 'string' && ACTIONS.includes(v.a)) return { k: 'act', a: v.a as Action };
  if (v.k === 'shoot') return { k: 'shoot' };
  if (v.k === 'wallet' && isNum(v.chips)) return { k: 'wallet', chips: v.chips };
  if (v.k === 'look' && isNum(v.yaw) && isNum(v.pitch)) return { k: 'look', yaw: v.yaw, pitch: v.pitch };
  return null;
}

function parseMsg(d: unknown): NetMsg | null {
  if (!isObj(d)) return null;
  if (d.k === 'ping') return { k: 'ping' };
  if (d.k === 'snap') {
    const s = parseTable(d.s);
    return s ? { k: 'snap', s } : null;
  }
  if (d.k === 'in') {
    const i = parseInput(d.i);
    return i ? { k: 'in', i } : null;
  }
  return null;
}

const OFF: NetStatus = { status: 'off', message: 'Offline', code: null, humans: 1 };

export function createNet(h: NetHandlers): Net {
  let client: NetClient<NetMsg> | null = null;
  let status: NetStatus = OFF;
  /** True from start() until leave(), a failed connection or a lost one. */
  let active = false;
  /** True once the server has started (or joined us into) a match. */
  let inMatch = false;
  /** True while connect() is in progress; a socket close then belongs to the connect call. */
  let opening = false;
  /** Bumped on every start and leave, so a late connect() result from an old attempt is ignored. */
  let session = 0;
  let roomCode: string | null = null;
  let myId = -1;
  let hostId = -1;
  let members = new Set<number>();
  let lastPing = 0;
  /** Pings on wall-clock time, from a timer rather than the frame loop, so a slow device or a hidden tab
   *  (where requestAnimationFrame stops) still talks inside the server's 8 s silence limit. */
  function ping(force: boolean): void {
    if (!inMatch || !client) return;
    const now = performance.now();
    if (!force && now - lastPing < PING_EVERY_S * 1000) return;
    lastPing = now;
    client.send(null, { k: 'ping' });
  }
  steadyInterval(() => ping(false), 1000);

  function available(): boolean {
    return serverUrl() !== '';
  }

  /** Our match ended from our side (leave) or the other side (connection lost). */
  function leave(): void {
    const wasInMatch = inMatch;
    session++;
    client?.leave();
    active = false;
    inMatch = false;
    opening = false;
    members = new Set<number>();
    status = OFF;
    if (wasInMatch) h.onLost();
  }

  /** The connection died or the server ended us. Playing offline from here. */
  function lost(): void {
    if (!active || opening) return;
    const wasInMatch = inMatch;
    session++;
    active = false;
    inMatch = false;
    members = new Set<number>();
    status = { status: 'error', message: 'Connection lost: playing offline', code: null, humans: 1 };
    const c = client;
    client = null;
    c?.drop(); // runs our close listener again; active is already false, so it does nothing
    if (wasInMatch) h.onLost();
  }

  function handle(m: ServerMsg<NetMsg>): void {
    switch (m.t) {
      case 'queued':
        if (!active || inMatch) return;
        status = { status: 'connecting', message: 'Finding a table…', code: roomCode, humans: 1 };
        return;
      case 'match':
        if (!active) return;
        members = new Set(m.players.map((p) => p.id));
        myId = m.you;
        hostId = m.hostId;
        inMatch = true;
        lastPing = performance.now();
        status = {
          status: 'online',
          message: roomCode ? 'Private table' : 'Online table',
          code: roomCode,
          humans: m.players.length,
        };
        h.onMatch(m.you, m.hostId, m.players);
        return;
      case 'joined':
        if (!inMatch) return;
        members.add(m.player.id);
        status = { ...status, humans: status.humans + 1 };
        h.onJoined(m.player);
        return;
      case 'relay': {
        if (!inMatch || !members.has(m.from)) return;
        const d = parseMsg(m.d);
        if (!d) return;
        if (d.k === 'snap') {
          if (m.from === hostId) h.onSnapshot(d.s);
        } else if (d.k === 'in') {
          h.onInput(m.from, d.i);
        }
        return; // ping: nothing to do
      }
      case 'left':
        if (!inMatch) return;
        if (members.delete(m.id)) status = { ...status, humans: Math.max(1, status.humans - 1) };
        h.onLeft(m.id);
        return;
      case 'host':
        if (!inMatch) return;
        hostId = m.hostId;
        h.onHost(m.hostId);
        return;
      case 'chat':
        if (!inMatch) return;
        h.onChat(m.from, m.text);
        return;
      case 'ended':
        lost();
        return;
      case 'error':
        if (inMatch) return; // chat-rate and similar: not a reason to leave the table
        active = false;
        status = { status: 'error', message: m.message, code: null, humans: 1 };
        return;
      default:
        return; // welcome, beat
    }
  }

  function start(code: string | null, name: string, character: string): void {
    if (!available()) return;
    leave();
    const my = session;
    active = true;
    roomCode = code;
    status = { status: 'connecting', message: 'Connecting…', code, humans: 1 };
    if (!client) {
      const c = createNetClient<NetMsg>(serverUrl(), 'gnome-blackjack', { name, character });
      c.onMessage(handle);
      c.onClose(lost);
      client = c;
    }
    const c = client;
    opening = true;
    c.connect().then(
      () => {
        if (my !== session) return; // left or restarted while connecting
        opening = false;
        c.queue(code, character, name);
      },
      () => {
        if (my !== session) return;
        opening = false;
        active = false;
        status = { status: 'error', message: 'Offline: could not reach the server', code: null, humans: 1 };
      },
    );
  }

  // Coming back to a backgrounded tab: ping straight away instead of waiting for the next tick.
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && inMatch && client) {
        lastPing = performance.now();
        client.send(null, { k: 'ping' });
      }
    });
  }

  return {
    get status() { return status; },
    available,
    start,
    leave,
    sendSnapshot(s: TableState): void {
      if (inMatch) client?.send(null, { k: 'snap', s });
    },
    sendInput(i: TableInput): void {
      if (inMatch && hostId >= 0 && hostId !== myId) client?.send(hostId, { k: 'in', i });
    },
    chat(text: string): void {
      if (inMatch) client?.chat(text);
    },
    update(_dt: number): void {
      ping(false);
    },
  };
}
