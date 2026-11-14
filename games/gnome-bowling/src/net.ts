// Online play over the shared matchmaking server (@lawn/mp): quick match or a room code, bowlers take turns
// in order, and every throw is relayed so every screen replays it. See _common.md and epic2-11-net.md.
import { LOOKS, type Ctx, type LookId, type NetApi, type NetStatus, type System, type ThrowInput } from './config';
import { hooks, makePlayer, newGame, queueRemoteThrow, removePlayer, toLobby, toTitle } from './game';
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import type { ServerMsg } from '@lawn/mp/protocol';

/** Relay payloads between the bowlers of one match. */
type BowlMsg =
  | { k: 'throw'; turn: number; input: ThrowInput; down: number } // the bowler -> everyone, once per ball
  | { k: 'ping' };                                                 // everyone -> everyone, every 2 s

/** Keeps us inside the server's MATCH_SILENT_S (8 s) silence limit. */
const PING_EVERY_S = 2;
/** After a lost connection during a game, the scoreboard stays up this long, then the title menu. */
const LOST_TO_TITLE_S = 4;

const isLookId = (v: string): v is LookId => Object.prototype.hasOwnProperty.call(LOOKS, v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const OFF: NetStatus = { status: 'off', message: '', code: null, waiting: 0, startsInS: 0 };

/** Checks the shape of a relayed throw; returns null for anything junk. */
function parseThrow(d: unknown): { turn: number; input: ThrowInput; down: number } | null {
  if (typeof d !== 'object' || d === null) return null;
  const o = d as Record<string, unknown>;
  if (o.k !== 'throw') return null;
  const i = o.input;
  if (typeof i !== 'object' || i === null) return null;
  const inp = i as Record<string, unknown>;
  const turn = o.turn;
  const down = o.down;
  const x = inp.x;
  const aim = inp.aim;
  const speed = inp.speed;
  const spin = inp.spin;
  if (!isNum(turn) || !Number.isInteger(turn) || turn < 0) return null;
  if (!isNum(down) || !Number.isInteger(down) || down < 0 || down > 1023) return null;
  if (!isNum(x) || !isNum(aim) || !isNum(speed) || !isNum(spin)) return null;
  return { turn, down, input: { x, aim, speed, spin } };
}

export function createNet(ctx: Ctx): System & NetApi {
  const { state } = ctx;

  let client: NetClient<BowlMsg> | null = null;
  /** True from quickMatch/joinRoom until leave(), a failed connection or a lost one. Messages are ignored otherwise. */
  let active = false;
  /** True once the server has started a match for us (we are bowling online). */
  let playing = false;
  /** True while connect() is in progress (a socket close then belongs to the connect call, not to a lost match). */
  let opening = false;
  let pingAcc = 0;
  let lostTimer: ReturnType<typeof setTimeout> | null = null;

  function clearLost(): void {
    if (lostTimer !== null) {
      clearTimeout(lostTimer);
      lostTimer = null;
    }
  }

  /** The shared client; created on first use. The hello name and look are only a default: queue() sends the real ones. */
  function getClient(name: string, look: LookId): NetClient<BowlMsg> {
    if (!client) {
      const c = createNetClient<BowlMsg>(serverUrl(), 'gnome-bowling', { name, character: look });
      c.onMessage(handle);
      c.onClose(() => {
        if (!opening) lost();
      });
      client = c;
    }
    return client;
  }

  function leave(): void {
    clearLost();
    active = false;
    playing = false;
    hooks.onLocalThrow = null;
    client?.leave();
    state.net = { ...OFF };
  }

  /** The connection died (or the server ended our match). A running game shows "Connection lost", then returns to the title. */
  function lost(): void {
    if (!active) return;
    const wasPlaying = playing;
    active = false;
    playing = false;
    hooks.onLocalThrow = null;
    state.net = { status: 'error', message: 'Connection lost', code: state.net.code, waiting: 0, startsInS: 0 };
    client?.drop(); // runs our close listener again; active is already false, so it does nothing
    clearLost();
    if (wasPlaying) {
      lostTimer = setTimeout(() => {
        lostTimer = null;
        if (state.phase !== 'title') toTitle(state);
        state.net = { ...OFF };
      }, LOST_TO_TITLE_S * 1000);
    }
  }

  function handle(m: ServerMsg<BowlMsg>): void {
    if (!active) return;
    switch (m.t) {
      case 'queued':
        if (playing) return;
        state.net = { ...state.net, status: 'queued', message: 'Waiting for bowlers…', waiting: m.players, startsInS: m.startsInS };
        return;
      case 'match': {
        // Everyone gets the same order: sorted by server id.
        const players = [...m.players]
          .sort((a, b) => a.id - b.id)
          .map((p) => makePlayer(p.name, isLookId(p.character) ? p.character : 'gnorman', p.color, p.id === m.you, p.id));
        playing = true;
        const c = client;
        hooks.onLocalThrow = (turn, input, down) => c?.send(null, { k: 'throw', turn, input, down });
        newGame(state, players, 'online');
        state.net = { ...state.net, status: 'playing', message: '', waiting: players.length, startsInS: 0 };
        return;
      }
      case 'relay': {
        const t = parseThrow(m.d);
        if (!t) return;
        // Only accept throws from someone who is in this match.
        if (!state.players.some((p) => p.netId === m.from)) return;
        queueRemoteThrow(state, m.from, t.turn, t.input, t.down);
        return;
      }
      case 'left':
        removePlayer(state, m.id);
        return;
      case 'ended':
        lost();
        return;
      case 'error':
        if (playing) return; // chat-rate and similar: not a reason to leave the game
        active = false;
        state.net = { status: 'error', message: m.message, code: state.net.code, waiting: 0, startsInS: 0 };
        return;
      default:
        return; // welcome, joined, host, beat, chat
    }
  }

  async function start(code: string | null, name: string, look: LookId): Promise<void> {
    if (active) return;
    clearLost();
    active = true;
    playing = false;
    state.net = { status: 'connecting', message: 'Connecting…', code, waiting: 0, startsInS: 0 };
    toLobby(state);
    const c = getClient(name, look);
    opening = true;
    try {
      await c.connect();
    } catch {
      opening = false;
      if (!active) return;
      active = false;
      state.net = { status: 'error', message: 'Could not reach the server', code, waiting: 0, startsInS: 0 };
      return;
    }
    opening = false;
    if (!active) return; // left while connecting
    c.queue(code, look, name);
  }

  // Coming back to a backgrounded tab: send a ping straight away instead of waiting for the next 2 s tick.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && playing && client) {
      pingAcc = 0;
      client.send(null, { k: 'ping' });
    }
  });

  return {
    update(dt: number): void {
      // The HUD's MENU button goes to the title: drop out of the queue or match.
      if (state.phase === 'title' && state.net.status !== 'off') leave();
      if (state.net.status === 'queued' && state.net.startsInS > 0) {
        state.net.startsInS = Math.max(0, state.net.startsInS - dt);
      }
      if (playing && client) {
        pingAcc += dt;
        if (pingAcc >= PING_EVERY_S) {
          pingAcc = 0;
          client.send(null, { k: 'ping' });
        }
      }
    },
    available: () => serverUrl() !== '',
    quickMatch(name: string, look: LookId): void {
      void start(null, name, look);
    },
    joinRoom(code: string, name: string, look: LookId): void {
      void start(code.trim().toUpperCase(), name, look);
    },
    leave,
  };
}
