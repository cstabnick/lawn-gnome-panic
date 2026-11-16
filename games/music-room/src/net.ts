// Room networking over the shared matchmaking server. Every client plays the notes it receives: no host logic.
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import {
  GAME_ID,
  HEARTBEAT_MS,
  isInstrument,
  isValidNote,
  type InstrumentId,
  type Member,
  type NetState,
  type RoomMsg,
} from './config';

export interface RoomNet {
  readonly state: NetState;
  /** False when this build has no server configured (serverUrl() === ''); then only offline play exists. */
  readonly available: boolean;
  /** Connect (if needed) and join the public room (code null) or a room code. */
  join(code: string | null, name: string, instrument: InstrumentId): void;
  /** Leave the room and close the connection; state goes back to 'offline'. */
  leave(): void;
  /** Tell everyone else in the room I played note n on i. No-op when not in a room. */
  sendNote(i: InstrumentId, n: number): void;
  /** I switched instrument: update my member entry and tell the room at once. */
  setInstrument(i: InstrumentId): void;
  /** Someone else played a note (already validated). */
  onNote(fn: (from: number, i: InstrumentId, n: number) => void): void;
  /** state changed (status, message, players or their instruments). */
  onChange(fn: () => void): void;
}

export function createRoomNet(): RoomNet {
  const url = serverUrl();
  const available = url !== '';
  const state: NetState = {
    status: 'offline',
    message: available ? 'Not in a room' : 'Offline build: playing solo',
    me: -1,
    code: null,
    players: [],
  };
  const changeListeners: (() => void)[] = [];
  const noteListeners: ((from: number, i: InstrumentId, n: number) => void)[] = [];
  let link: NetClient<RoomMsg> | null = null;
  let mine: InstrumentId = 'keys';
  let timer: ReturnType<typeof setInterval> | null = null;

  function changed(): void {
    for (const fn of changeListeners) fn();
  }

  function stopHeartbeat(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function here(c: NetClient<RoomMsg>): void {
    c.send(null, { k: 'here', i: mine });
  }

  function toMember(p: PlayerInfo, you: number): Member {
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      instrument: isInstrument(p.character) ? p.character : 'keys',
      me: p.id === you,
    };
  }

  /** Forget the current room and stop its heartbeat. Returns the old client (not yet dropped). */
  function detach(): NetClient<RoomMsg> | null {
    const c = link;
    link = null;
    stopHeartbeat();
    state.me = -1;
    state.code = null;
    state.players = [];
    return c;
  }

  function onServerMsg(c: NetClient<RoomMsg>, m: ServerMsg<RoomMsg>): void {
    if (c !== link) return;
    switch (m.t) {
      case 'match': {
        state.me = m.you;
        state.players = m.players.map((p) => toMember(p, m.you));
        state.status = 'in-room';
        state.message = state.code ? `Room ${state.code}` : 'Public room';
        here(c);
        stopHeartbeat();
        timer = setInterval(() => {
          if (link === c) here(c);
        }, HEARTBEAT_MS);
        changed();
        break;
      }
      case 'joined': {
        state.players = [...state.players.filter((p) => p.id !== m.player.id), toMember(m.player, state.me)];
        here(c);
        changed();
        break;
      }
      case 'left': {
        state.players = state.players.filter((p) => p.id !== m.id);
        changed();
        break;
      }
      case 'relay': {
        const d = m.d;
        if (d.k === 'here') {
          if (isInstrument(d.i)) {
            const p = state.players.find((x) => x.id === m.from);
            if (p && p.instrument !== d.i) {
              p.instrument = d.i;
              changed();
            }
          }
        } else if (d.k === 'note') {
          if (isInstrument(d.i) && isValidNote(d.i, d.n)) {
            for (const fn of noteListeners) fn(m.from, d.i, d.n);
          }
        }
        break;
      }
      case 'ended': {
        const old = detach();
        old?.drop();
        state.status = 'offline';
        state.message = `Room closed: ${m.reason}`;
        changed();
        break;
      }
      case 'error': {
        if (state.status === 'connecting') {
          const old = detach();
          old?.drop();
          state.status = 'error';
          state.message = m.message;
          changed();
        }
        break;
      }
      default:
        break;
    }
  }

  function onLinkClosed(c: NetClient<RoomMsg>): void {
    if (c !== link) return;
    if (state.status === 'in-room' || state.status === 'connecting') {
      detach();
      state.status = 'error';
      state.message = 'Connection lost';
      changed();
    }
  }

  function join(code: string | null, name: string, instrument: InstrumentId): void {
    if (!available) return;
    mine = instrument;
    const old = detach();
    old?.drop();
    const c = createNetClient<RoomMsg>(url, GAME_ID as 'music-room', { name, character: instrument });
    link = c;
    state.status = 'connecting';
    state.message = 'Connecting...';
    state.code = code;
    c.onMessage((m) => onServerMsg(c, m));
    c.onClose(() => onLinkClosed(c));
    changed();
    void (async () => {
      try {
        await c.connect();
      } catch (err) {
        if (link !== c) return;
        const failed = detach();
        failed?.drop();
        state.status = 'error';
        state.message = err instanceof Error ? err.message : String(err);
        changed();
        return;
      }
      if (link === c) c.queue(code, mine, name);
    })();
  }

  function leave(): void {
    const old = detach();
    if (old) {
      try {
        old.leave();
      } catch {
        // already closing
      }
      old.drop();
    }
    state.status = 'offline';
    state.message = 'Not in a room';
    changed();
  }

  function sendNote(i: InstrumentId, n: number): void {
    if (state.status === 'in-room' && link) link.send(null, { k: 'note', i, n });
  }

  function setInstrument(i: InstrumentId): void {
    mine = i;
    const me = state.players.find((p) => p.me);
    if (me) me.instrument = i;
    if (state.status === 'in-room' && link) here(link);
    changed();
  }

  return {
    state,
    available,
    join,
    leave,
    sendNote,
    setInstrument,
    onNote(fn) {
      noteListeners.push(fn);
    },
    onChange(fn) {
      changeListeners.push(fn);
    },
  };
}
