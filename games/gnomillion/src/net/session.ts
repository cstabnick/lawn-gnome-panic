// Online session of Once in a Gnomillion. The HOST's browser owns the Room (engine.ts) and saves it to localStorage
// after every change, then sends everyone a PublicRoom. Guests send intents ('join', 'answer') through @lawn/mp and keep
// the last state they were sent, so the UI still shows something while the host is away. Every member sends a
// heartbeat, because the relay drops a member that relays nothing for 8 s.
// Trust: this is a game for friends. The relay does not say who a message came from, so a guest could forge a state.
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import { steadyInterval } from '@lawn/mp/background';
import { ROOM_CODE_RE } from '@lawn/mp/protocol';
import { DEFAULT_WINDOW_MS, GAME_ID, MAX_ANSWER_LEN, MAX_PLAYERS, ROUNDS_PER_GAME } from '../config';
import { addPlayer, closeRound, isGameOver, newRoom, openRound, shouldClose, submitAnswer, type Player, type Room } from '../engine';
import { PROMPTS, shufflePromptOrder } from '../prompts';
import { toPublic, type GuestMsg, type Msg, type PendingAnswer, type PublicRoom } from './protocol';
import * as store from './store';

/** Everything that goes through the relay: the game messages plus the heartbeat (the relay's silence check). */
type Wire = Msg | { t: 'hb' };

const HEARTBEAT_MS = 2_500;
const HOST_TICK_MS = 5_000;
const RETRY_MS = 10_000;
const ROOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
/** Ack reasons after which a guest drops its pending answer (the host will never take it). */
const FINAL_WHY = new Set(['closed', 'no-round', 'stale', 'empty']);

export interface Session {
  readonly code: string;
  readonly isHost: boolean;
  readonly me: { pid: string; name: string };
  /** Latest room as this player sees it (host: its own, converted with toPublic). */
  readonly room: PublicRoom;
  /** Submit (or replace) my answer for the open round; queued on this device if the host is unreachable. */
  answer(text: string): void;
  /** Host only: open the next round now (uses Room.promptOrder). */
  nextRound(): void;
  /** True while connected to the room's relay. */
  readonly online: boolean;
  onChange(fn: () => void): void;
  leave(): void;
}

interface Build {
  session: Session;
  /** Connects (if needed), then queues the room code, or takes back my seat if the relay still holds it. */
  reconnect(): Promise<void>;
}

interface Start {
  code: string;
  me: Player;
  net: NetClient<Wire>;
  /** Host: the room this browser owns. */
  host: Room | null;
  /** Guest: the last state seen (or null before the first one). */
  guest: PublicRoom | null;
}

function requireServer(): string {
  const url = serverUrl();
  if (!url) throw new Error('Online play is not set up for this build');
  return url;
}

function newId(): string {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  return Array.from(c.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

function cleanName(raw: string): string {
  return raw.trim().slice(0, 20) || 'Gnome';
}

/** My identity: the pid is kept on this device, the name is what I typed last. */
function identify(name: string): Player {
  const me = { pid: store.loadMe()?.pid ?? newId(), name: cleanName(name) };
  store.saveMe(me);
  return me;
}

function makeCode(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(5));
  return Array.from(bytes, (b) => ROOM_CHARS[b % ROOM_CHARS.length]).join('');
}

function makeNet(url: string, me: Player): NetClient<Wire> {
  return createNetClient<Wire>(url, GAME_ID, { name: me.name, character: '', resumable: true });
}

function promptAt(r: Room, i: number): string {
  const idx = r.promptOrder[i] ?? i;
  return PROMPTS[idx % PROMPTS.length];
}

function build(s: Start): Build {
  const { code, me, net } = s;
  const isHost = s.host !== null;
  let room: Room | null = s.host;
  let guest: PublicRoom = s.guest ?? {
    code, hostPid: '', players: [{ ...me }], windowMs: DEFAULT_WINDOW_MS, totalRounds: ROUNDS_PER_GAME, current: null, history: [],
  };
  let joined = false;
  let stopped = false;
  let retry: ReturnType<typeof setTimeout> | null = null;
  const listeners: Array<() => void> = [];
  const emit = (): void => {
    for (const fn of listeners) fn();
  };

  // ---------------------------------------------------------------- host

  /** Host: close a round that is due, then open the next one at once. True if the room changed. */
  function settle(now: number): boolean {
    const r = room;
    if (!r) return false;
    let changed = false;
    if (r.current && shouldClose(r, now)) {
      closeRound(r);
      changed = true;
    }
    if (!r.current && r.history.length > 0 && !isGameOver(r) && openRound(r, promptAt(r, r.history.length), now)) changed = true;
    return changed;
  }

  function broadcast(): void {
    if (room) net.send(null, { t: 'state', room: toPublic(room) });
  }

  /** Host: save the room, send it to everyone, and redraw this browser. */
  function commit(): void {
    if (room) {
      store.saveHostRoom(room);
      broadcast();
    }
    emit();
  }

  function onGuestIntent(r: Room, d: GuestMsg): void {
    if (d.t === 'join') {
      const known = r.players.some((p) => p.pid === d.pid);
      if (known || r.players.length < MAX_PLAYERS) addPlayer(r, { pid: d.pid, name: cleanName(d.name) });
      commit();
      return;
    }
    const why = r.current?.n === d.round ? submitAnswer(r, d.pid, d.text, Date.now()) : 'stale';
    net.send(null, { t: 'ack', pid: d.pid, round: d.round, ok: why === 'ok', why });
    const changed = settle(Date.now());
    if (why === 'ok' || changed) commit();
  }

  // ---------------------------------------------------------------- guest

  function sendJoin(): void {
    net.send(null, { t: 'join', pid: me.pid, name: me.name });
    for (const p of store.listPending(code)) {
      net.send(null, { t: 'answer', pid: p.pid, round: p.round, text: p.text, at: p.at });
    }
  }

  function onState(d: PublicRoom): void {
    if (d.code !== code) return;
    guest = d;
    store.saveGuestRoom(guest);
    store.prunePending(code, guest.current ? guest.current.n : guest.history.length + 1);
    emit();
  }

  function onAck(d: { pid: string; round: number; ok: boolean; why?: string }): void {
    if (d.pid !== me.pid) return;
    if (d.ok || (d.why !== undefined && FINAL_WHY.has(d.why))) store.removePending(code, d.pid, d.round);
    emit();
  }

  function onWire(d: Wire): void {
    if (d.t === 'join' || d.t === 'answer') {
      if (room) onGuestIntent(room, d);
    } else if (d.t === 'state') {
      if (!room) onState(d.room);
    } else if (d.t === 'ack') {
      if (!room) onAck(d);
    }
  }

  // ---------------------------------------------------------------- relay

  net.onMessage((m) => {
    if (m.t === 'relay') {
      onWire(m.d);
    } else if (m.t === 'match') {
      // I am in the room's match (queued, or joined it in progress). A guest says hello and resends its answers.
      joined = true;
      if (!room) sendJoin();
      emit();
    } else if (m.t === 'ended') {
      // My match was closed under me (I went quiet for too long): queue for the room again.
      joined = false;
      emit();
      if (!stopped) net.queue(code, '', me.name);
    }
  });

  net.onClose(() => {
    joined = false;
    emit();
    scheduleRetry();
  });

  function scheduleRetry(): void {
    if (stopped || retry !== null) return;
    retry = setTimeout(() => {
      retry = null;
      void reconnect();
    }, RETRY_MS);
  }

  async function reconnect(): Promise<void> {
    if (stopped) return;
    try {
      const resumed = await net.connect();
      if (stopped) return;
      if (resumed) {
        // The relay still holds my seat in the match: carry on where I was.
        joined = true;
        if (room) {
          settle(Date.now());
          commit();
        } else {
          sendJoin();
        }
      } else {
        net.queue(code, '', me.name);
      }
    } catch {
      scheduleRetry();
    }
    emit();
  }

  // ---------------------------------------------------------------- timers

  const stopHeartbeat = steadyInterval(() => {
    if (net.connected) net.send(null, { t: 'hb' });
  }, HEARTBEAT_MS);
  const stopTick = isHost
    ? steadyInterval(() => {
      // Host: close overdue rounds and resend the state, so a guest who missed a message catches up.
      if (settle(Date.now())) commit();
      else broadcast();
    }, HOST_TICK_MS)
    : () => {};

  const session: Session = {
    get code() { return code; },
    get isHost() { return isHost; },
    get me() { return me; },
    get room(): PublicRoom { return room ? toPublic(room) : guest; },
    get online() { return joined && net.connected; },
    answer(text: string): void {
      const clean = text.trim().slice(0, MAX_ANSWER_LEN);
      if (!clean) return;
      const now = Date.now();
      if (room) {
        const why = submitAnswer(room, me.pid, clean, now);
        const changed = settle(now);
        if (why === 'ok' || changed) commit();
        return;
      }
      const round = guest.current?.n;
      if (round === undefined) return;
      const p: PendingAnswer = { code, pid: me.pid, round, text: clean, at: now };
      store.addPending(p);
      if (joined && net.connected) net.send(null, { t: 'answer', pid: me.pid, round, text: clean, at: now });
      emit();
    },
    nextRound(): void {
      const r = room;
      if (!r || r.current) return;
      if (openRound(r, promptAt(r, r.history.length), Date.now())) commit();
    },
    onChange(fn: () => void): void {
      listeners.push(fn);
    },
    leave(): void {
      if (stopped) return;
      stopped = true;
      if (retry !== null) clearTimeout(retry);
      stopHeartbeat();
      stopTick();
      if (net.connected) net.leave();
      net.drop();
      if (store.loadLast()?.code === code) store.clearLast();
    },
  };

  return { session, reconnect };
}

/** Host a new room: a fresh code, the room saved on this device, and the host queued for it. */
export async function hostRoom(name: string, windowMs: number): Promise<Session> {
  const url = requireServer();
  const me = identify(name);
  const net = makeNet(url, me);
  await net.connect();
  const code = makeCode();
  const room = newRoom(code, me, windowMs, shufflePromptOrder());
  store.saveHostRoom(room);
  const b = build({ code, me, net, host: room, guest: null });
  await b.reconnect();
  return b.session;
}

/** Join an open room by its code. Throws if the code is malformed or the relay cannot be reached. */
export async function joinRoom(code: string, name: string): Promise<Session> {
  const url = requireServer();
  const clean = code.trim().toUpperCase();
  if (!ROOM_CODE_RE.test(clean)) throw new Error('Room codes are 4 to 8 letters and numbers');
  const me = identify(name);
  const net = makeNet(url, me);
  await net.connect();
  store.saveLast({ code: clean, host: false });
  const b = build({ code: clean, me, net, host: null, guest: store.loadGuestRoom(clean) });
  await b.reconnect();
  return b.session;
}

/**
 * Reopen the last room from localStorage (host re-hosts its saved room; guest rejoins). null if none, or if online
 * play is not set up. Unlike joinRoom this does not throw when the relay is unreachable: the session opens offline
 * with its saved state and keeps retrying.
 */
export async function resumeLastRoom(): Promise<Session | null> {
  if (!serverUrl()) return null;
  const last = store.loadLast();
  const me = store.loadMe();
  if (!last || !me) return null;
  const net = makeNet(serverUrl(), me);
  let b: Build;
  if (last.host) {
    const room = store.loadHostRoom(last.code);
    if (!room) return null;
    b = build({ code: last.code, me, net, host: room, guest: null });
  } else {
    b = build({ code: last.code, me, net, host: null, guest: store.loadGuestRoom(last.code) });
  }
  void b.reconnect();
  return b.session;
}
