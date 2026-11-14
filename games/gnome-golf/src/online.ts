// Online play for Gnome Golf and Gnome Disc, on the shared matchmaking server (packages/mp-server, game
// 'gnome-golf'). The server only relays; one browser per match is the host.
//
// Flow: the title's ONLINE panel calls join(). The first player opens a lobby and hosts it; others join it,
// even mid-round (the host sends them a 'sync'). The host picks the game (golf / disc) and the format, then
// START sends 'start' and everyone begins hole 1.
//
// Together (one group): the host decides whose ball is played next ('turn': farthest from the pin, then fewer
// strokes, then join order), and every client drives the convoy to that ball. The shooter relays aim and
// swing ('aim'), the shot inputs ('shot', 'flail') and the authoritative result ('rest'); everyone else replays
// the shot with the same deterministic physics. When everyone is done the host shows the card ('card') and
// starts the next hole ('hole').
//
// Race (GNOME W FRIENDS): everyone plays their own round at once; each client relays its pose ('pose') a few
// times a second for remotes.ts to draw, and its scores for the card.
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import { Interp } from '@lawn/mp/interp';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import { checkName } from '@lawn/mp/textFilter';
import {
  CLUBS,
  HOLES,
  NET,
  ROUND,
  type ClubId,
  type Ctx,
  type Format,
  type GameMode,
  type GameState,
  type Golfer,
  type Lie,
  type OnlineApi,
  type OnlineView,
  type RacePose,
  type Shot,
  type SwingState,
  type System,
  type XYZ,
} from './config';
import { beginTurn, flailThrow, forcePhase, hooks, mowerPose, newRound, nextHole, setAim, startHole, takeShot, takeThrow } from './round';

// ---------------------------------------------------------------- game messages (the `d` of a relay)

interface GolferWire {
  id: number;
  name: string;
  color: number;
  ball: XYZ;
  lie: Lie;
  strokes: number;
  holed: boolean;
  scores: (number | null)[];
  joinedHole: number;
  left: boolean;
}

type GolfMsg =
  /** Keeps me from being dropped as silent (the server removes members silent for 8 s). */
  | { k: 'hb' }
  /** Host, in the lobby: the chosen game and format. */
  | { k: 'setup'; game: GameMode; format: Format }
  /** Host: the round starts at hole 1. */
  | { k: 'start'; game: GameMode; format: Format; seed: number }
  /** Host to a newcomer: everything they need to join in. */
  | { k: 'sync'; game: GameMode; format: Format; seed: number; started: boolean; hole: number; turn: number | null; phase: GameState['phase']; golfers: GolferWire[] }
  /** Host, together: `id` plays next on `hole`. */
  | { k: 'turn'; hole: number; id: number }
  /** Host, together: everyone starts `hole`. */
  | { k: 'hole'; hole: number }
  /** Host, together: the hole is over (final = it was the last one). */
  | { k: 'card'; final: boolean }
  /** Host: back to the lobby. */
  | { k: 'lobby' }
  /** Together, the shooter while aiming and swinging. */
  | { k: 'aim'; hole: number; yaw: number; club: ClubId; tilt: number; swinging: boolean; swing: SwingState; held: number; orbit: number; ms?: number }
  /** Together, the shooter: the shot's inputs (strokes = before this shot). */
  | { k: 'shot'; hole: number; from: XYZ; lie: Lie; strokes: number; yaw: number; tilt: number; golf: Shot | null; disc: { power: number; releaseError: number; dizzy: boolean } | null }
  /** Together, the shooter: a mid-air flail at flight time t (disc). */
  | { k: 'flail'; t: number }
  /** Together, the shooter: where the ball ended up (authoritative). */
  | { k: 'rest'; hole: number; ball: XYZ; lie: Lie; strokes: number; holed: boolean; scores: (number | null)[] }
  /** Race: my game right now. */
  | { k: 'pose'; pose: RacePose; strokes: number; holed: boolean; scores: (number | null)[] };

const NAME_KEY = 'gnome-golf.name';
const CHARACTER = 'golfer';

function loadName(): string {
  try {
    const saved = localStorage.getItem(NAME_KEY);
    if (saved && checkName(saved).ok) return saved;
  } catch {
    // storage blocked
  }
  return `Gnome${100 + Math.floor(Math.random() * 900)}`;
}

function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // storage blocked
  }
}

const xyz = (v: XYZ): XYZ => ({ x: v.x, y: v.y, z: v.z });

// Together mode: the shooter's aim and swing meter are played back from a short buffer, a little in the past, so
// the 10 Hz 'aim' messages turn into smooth motion on everyone else's screen (camera, meter, aim line).
// Sample layout: [yaw, marker, power, tilt, stage, swinging, club]; tilt, stage, swinging and club switch, never blend.
const CLUB_IDS = Object.keys(CLUBS) as ClubId[];
const STAGES: SwingState['stage'][] = ['idle', 'power', 'accuracy'];
const aimOut = [0, 0, 0, 0, 0, 0, 0];
const now = (): number => performance.now() / 1000;

export function createOnline(ctx: Ctx): System & OnlineApi {
  const state = ctx.state;
  const url = serverUrl();
  let net: NetClient<GolfMsg> | null = null;
  let status: OnlineApi['status'] = 'off';
  let message = '';
  let name = loadName();
  let game: GameMode = 'golf';
  let format: Format = 'together';
  let pendingCode: string | null = null;

  // Heartbeat on its own timer, not the frame loop: a slow device (long frames) must not look silent.
  setInterval(() => {
    if (net && state.online) send({ k: 'hb' });
  }, NET.heartbeatS * 1000);
  let aimT = 0;
  /** Together: the current shooter's aim playback (cleared on each turn and shot). */
  const aimBuf = new Interp({ angles: [0], steps: [3, 4, 5, 6], minDelayMs: 60 });
  let poseT = 0;
  /** Host, together: when to decide the next turn (seconds, now()), or null. */
  let decideAt: number | null = null;
  /** Race: when my round started, and when I finished. */
  let raceStart = 0;
  let finishedS: number | null = null;

  const o = (): OnlineView | null => state.online;
  const isHost = (): boolean => !!state.online && state.online.me === state.online.hostId;
  const golfer = (id: number): Golfer | undefined => state.online?.golfers.find((g) => g.id === id);
  const send = (d: GolfMsg, to: number | null = null): void => net?.send(to, d);

  function teeBall(hole: number): XYZ {
    const t = HOLES[hole].tee;
    return { x: t.x, y: 0, z: t.z };
  }

  function newGolfer(p: PlayerInfo, joinedHole: number): Golfer {
    const hole = state.online?.started ? state.holeIndex : 0;
    return {
      id: p.id, name: p.name, color: p.color,
      ball: teeBall(hole), lie: 'tee', strokes: 0, holed: false,
      scores: HOLES.map(() => null), joinedHole, left: false, race: null,
    };
  }

  function wire(g: Golfer): GolferWire {
    return { id: g.id, name: g.name, color: g.color, ball: xyz(g.ball), lie: g.lie, strokes: g.strokes, holed: g.holed, scores: g.scores.slice(), joinedHole: g.joinedHole, left: g.left };
  }

  /** Back to solo: the title screen, with an optional message for the online panel. */
  function goSolo(msg: string): void {
    const n = net;
    net = null;
    n?.drop();
    state.online = null;
    status = 'off';
    message = msg;
    decideAt = null;
    newRound(state, state.mode);
    forcePhase(state, 'title');
  }

  /** Everyone back at the first tee in the lobby, round not started. */
  function toLobby(): void {
    const v = o();
    if (!v) return;
    v.started = false;
    v.turn = null;
    decideAt = null;
    finishedS = null;
    for (const g of v.golfers) {
      g.ball = teeBall(0);
      g.lie = 'tee';
      g.strokes = 0;
      g.holed = false;
      g.scores = HOLES.map(() => null);
      g.joinedHole = 0;
      g.race = null;
    }
    v.golfers = v.golfers.filter((g) => !g.left);
    newRound(state, game);
    forcePhase(state, 'title');
    status = 'lobby';
  }

  /** Every golfer's per-hole state back to the tee of `hole`. */
  function resetHole(hole: number): void {
    const v = o();
    if (!v) return;
    for (const g of v.golfers) {
      g.ball = teeBall(hole);
      g.lie = 'tee';
      g.strokes = 0;
      g.holed = false;
    }
  }

  function applyStart(d: { game: GameMode; format: Format; seed: number }): void {
    const v = o();
    if (!v) return;
    game = d.game;
    format = d.format;
    v.format = d.format;
    v.seed = d.seed;
    v.started = true;
    v.turn = null;
    for (const g of v.golfers) {
      g.scores = HOLES.map(() => null);
      g.joinedHole = 0;
      g.race = null;
    }
    resetHole(0);
    finishedS = null;
    raceStart = now();
    newRound(state, d.game);
    status = 'playing';
    if (isHost() && v.format === 'together') decide();
  }

  function applyHole(hole: number): void {
    const v = o();
    if (!v) return;
    v.turn = null;
    resetHole(hole);
    startHole(state, hole);
    if (isHost()) decide();
  }

  function applyTurn(id: number, hole: number): void {
    const v = o();
    const g = golfer(id);
    if (!v || !g) return;
    if (hole !== state.holeIndex) startHole(state, hole);
    v.turn = id;
    aimBuf.clear();
    beginTurn(state, g);
  }

  function applyCard(final: boolean): void {
    const v = o();
    if (!v) return;
    v.turn = null;
    decideAt = null;
    forcePhase(state, final ? 'final' : 'card');
  }

  /** Host, together: next turn, or the card when everyone is done. */
  function decide(): void {
    const v = o();
    if (!v || !isHost() || !v.started || v.format !== 'together') return;
    decideAt = null;
    const pin = HOLES[state.holeIndex].pin;
    const live = v.golfers.filter((g) => !g.left && !g.holed);
    if (live.length === 0) {
      const final = state.holeIndex + 1 >= HOLES.length;
      send({ k: 'card', final });
      applyCard(final);
      return;
    }
    const dist = (g: Golfer): number => Math.hypot(g.ball.x - pin.x, g.ball.z - pin.z);
    live.sort((a, b) => {
      const da = dist(a);
      const db = dist(b);
      if (Math.abs(da - db) > 0.5) return db - da;
      return a.strokes - b.strokes;
    });
    const next = live[0];
    send({ k: 'turn', hole: state.holeIndex, id: next.id });
    applyTurn(next.id, state.holeIndex);
  }

  function applySync(d: Extract<GolfMsg, { k: 'sync' }>): void {
    const v = o();
    if (!v) return;
    game = d.game;
    format = d.format;
    v.format = d.format;
    v.seed = d.seed;
    for (const w of d.golfers) {
      let g = golfer(w.id);
      if (!g) {
        g = { ...w, ball: xyz(w.ball), race: null };
        v.golfers.push(g);
      } else {
        Object.assign(g, { ball: xyz(w.ball), lie: w.lie, strokes: w.strokes, holed: w.holed, scores: w.scores.slice(), joinedHole: w.joinedHole, left: w.left });
      }
    }
    // Keep the host's join order.
    const order = new Map(d.golfers.map((w, i) => [w.id, i]));
    v.golfers.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
    v.started = d.started;
    if (!d.started) {
      status = 'lobby';
      return;
    }
    status = 'playing';
    raceStart = now();
    finishedS = null;
    newRound(state, d.game);
    if (d.hole > 0) startHole(state, Math.min(d.hole, HOLES.length - 1));
    const mine = golfer(v.me);
    if (mine) state.scores = mine.scores.slice();
    if (d.format === 'together') {
      if (d.phase === 'card' || d.phase === 'final') applyCard(d.phase === 'final');
      else if (d.turn !== null) applyTurn(d.turn, d.hole);
    }
  }

  // ---------------------------------------------------------------- server messages

  function onServer(m: ServerMsg<GolfMsg>): void {
    switch (m.t) {
      case 'match': {
        const v: OnlineView = {
          format, me: m.you, hostId: m.hostId, code: pendingCode, seed: m.seed,
          started: false, golfers: [], turn: null,
        };
        state.online = v;
        v.golfers = m.players.map((p) => newGolfer(p, 0));
        status = 'lobby';
        message = '';
        newRound(state, game);
        forcePhase(state, 'title');
        break;
      }
      case 'joined': {
        const v = o();
        if (!v || golfer(m.player.id)) break;
        const inCard = state.phase === 'card' || state.phase === 'final';
        const joinedHole = v.started ? Math.min(HOLES.length - 1, state.holeIndex + (inCard && v.format === 'together' ? 1 : 0)) : 0;
        v.golfers.push(newGolfer(m.player, joinedHole));
        if (isHost()) {
          send({
            k: 'sync', game, format, seed: v.seed, started: v.started, hole: state.holeIndex, turn: v.turn,
            phase: state.phase, golfers: v.golfers.map(wire),
          }, m.player.id);
        }
        break;
      }
      case 'left': {
        const g = golfer(m.id);
        if (!g) break;
        g.left = true;
        const v = o();
        if (v && !v.started) v.golfers = v.golfers.filter((x) => x.id !== m.id);
        if (v && isHost() && v.started && v.format === 'together' && v.turn === m.id) decideAt = now() + 0.5;
        break;
      }
      case 'host': {
        const v = o();
        if (!v) break;
        v.hostId = m.hostId;
        if (isHost() && v.started && v.format === 'together') {
          const turnGone = v.turn === null || !!golfer(v.turn)?.left;
          const waiting = state.phase === 'result' || state.phase === 'holed';
          if ((turnGone && state.phase !== 'card' && state.phase !== 'final') || waiting) decideAt = now() + 1.5;
        }
        break;
      }
      case 'relay':
        onRelay(m.from, m.d);
        break;
      case 'error':
        if (m.code === 'chat-rate') break;
        goSolo(m.message);
        break;
      case 'ended':
        goSolo(m.reason);
        break;
      default:
        break;
    }
  }

  function onRelay(from: number, d: GolfMsg): void {
    const v = o();
    if (!v || !d || typeof d !== 'object') return;
    const fromHost = from === v.hostId;
    switch (d.k) {
      case 'setup':
        if (fromHost && !v.started) {
          game = d.game;
          format = d.format;
          v.format = d.format;
        }
        break;
      case 'start':
        if (fromHost) applyStart(d);
        break;
      case 'sync':
        if (fromHost) applySync(d);
        break;
      case 'turn':
        if (fromHost && v.format === 'together') applyTurn(d.id, d.hole);
        break;
      case 'hole':
        if (fromHost && v.format === 'together') applyHole(d.hole);
        break;
      case 'card':
        if (fromHost) applyCard(d.final);
        break;
      case 'lobby':
        if (fromHost) toLobby();
        break;
      case 'aim':
        if (v.format !== 'together' || from !== v.turn || d.hole !== state.holeIndex) break;
        if (state.phase !== 'aim' && state.phase !== 'swing') break;
        // Aim, club and meter go into the playback buffer; update() shows them. The disc whirl (held, orbit) runs
        // locally in disc.ts, so it is only nudged toward the shooter's here.
        aimBuf.push([
          d.yaw, d.swing.marker, d.swing.power, d.tilt,
          Math.max(0, STAGES.indexOf(d.swing.stage)), d.swinging ? 1 : 0, Math.max(0, CLUB_IDS.indexOf(d.club)),
        ], d.ms);
        if (Math.abs(state.disc.held - d.held) > 0.15) state.disc.held = d.held;
        state.disc.orbit = d.orbit + (state.disc.orbit - d.orbit) * 0.5;
        break;
      case 'shot':
        if (v.format !== 'together' || from !== v.turn || d.hole !== state.holeIndex) break;
        aimBuf.clear();
        state.ball.set(d.from.x, d.from.y, d.from.z);
        state.lie = d.lie;
        state.strokes = d.strokes;
        state.aimYaw = d.yaw;
        state.disc.tilt = d.tilt;
        if (d.golf) {
          state.club = d.golf.club;
          takeShot(state, d.golf, true);
        } else if (d.disc) {
          takeThrow(state, d.disc.power, d.disc.releaseError, d.disc.dizzy, true);
        }
        break;
      case 'flail':
        if (v.format === 'together' && from === v.turn) flailThrow(state, d.t);
        break;
      case 'rest': {
        const g = golfer(from);
        if (!g || d.hole !== state.holeIndex) break;
        g.ball = xyz(d.ball);
        g.lie = d.lie;
        g.strokes = d.strokes;
        g.holed = d.holed;
        g.scores = d.scores.slice();
        if (isHost() && v.format === 'together' && v.turn === from) decideAt = now() + (d.holed ? ROUND.holedSeconds : ROUND.resultSeconds);
        break;
      }
      case 'pose': {
        const g = golfer(from);
        if (!g) break;
        g.race = d.pose;
        g.ball = xyz(d.pose.ball);
        g.strokes = d.strokes;
        g.holed = d.holed;
        g.scores = d.scores.slice();
        break;
      }
      default:
        break;
    }
  }

  // ---------------------------------------------------------------- local hooks (round.ts calls these)

  hooks.onShot = (s, shot) => {
    const v = s.online;
    if (!v || !v.started || v.format !== 'together' || v.turn !== v.me) return;
    send({
      k: 'shot', hole: s.holeIndex, from: xyz(s.ball), lie: s.lie, strokes: s.strokes, yaw: s.aimYaw, tilt: s.disc.tilt,
      golf: shot.kind === 'golf' ? shot.shot : null,
      disc: shot.kind === 'disc' ? { power: shot.power, releaseError: shot.releaseError, dizzy: shot.dizzy } : null,
    });
  };
  hooks.onFlail = (s, t) => {
    const v = s.online;
    if (v && v.started && v.format === 'together' && v.turn === v.me) send({ k: 'flail', t });
  };
  hooks.onFlightDone = (s) => {
    const v = s.online;
    if (!v || !v.started) return;
    const me = golfer(v.me);
    if (!me) return;
    if (v.format === 'race') {
      me.ball = xyz(s.ball);
      me.strokes = s.strokes;
      me.holed = s.phase === 'holed';
      me.scores = s.scores.slice();
      poseT = 0; // send a pose right away
      return;
    }
    if (v.turn !== v.me) return;
    me.ball = xyz(s.ball);
    me.lie = s.lie;
    me.strokes = s.strokes;
    me.holed = s.phase === 'holed';
    me.scores = s.scores.slice();
    send({ k: 'rest', hole: s.holeIndex, ball: xyz(s.ball), lie: s.lie, strokes: s.strokes, holed: me.holed, scores: me.scores.slice() });
    if (isHost()) decideAt = now() + (me.holed ? ROUND.holedSeconds : ROUND.resultSeconds);
  };

  // ---------------------------------------------------------------- race pose

  function myPose(): RacePose {
    const cart = mowerPose(state);
    const f = state.flight;
    let ball: XYZ = xyz(state.ball);
    if (f && state.phase === 'flight' && f.points.length > 0) {
      const i = Math.min(f.points.length - 1, Math.max(0, Math.floor(state.phaseTime / f.sampleDt)));
      ball = xyz(f.points[i]);
    }
    const gs = state.party.golfer;
    return {
      hole: state.holeIndex, phase: state.phase, mode: state.mode,
      cart: { x: cart.x, y: cart.y, z: cart.z, facing: cart.facing, speed: cart.speed },
      riding: state.phase === 'drive',
      golfer: { x: gs.x, y: gs.y, z: gs.z, facing: gs.facing },
      ball, finishedS,
    };
  }

  // ---------------------------------------------------------------- API

  const api: System & OnlineApi = {
    get available() { return url !== ''; },
    get status() { return status; },
    get message() { return message; },
    get isHost() { return isHost(); },
    get game() { return game; },
    get format() { return format; },
    get name() { return name; },

    checkName(n: string): string | null {
      const c = checkName(n);
      return c.ok ? null : c.reason;
    },

    join(code: string | null, rawName: string): void {
      if (status !== 'off' || url === '') return;
      const c = checkName(rawName);
      if (!c.ok) {
        message = c.reason;
        return;
      }
      name = c.name;
      saveName(name);
      const roomCode = code === null ? null : code.trim().toUpperCase();
      if (roomCode !== null && !/^[A-Z0-9]{4,8}$/.test(roomCode)) {
        message = 'Room codes are 4 to 8 letters or numbers.';
        return;
      }
      pendingCode = roomCode;
      message = '';
      status = 'connecting';
      const client = createNetClient<GolfMsg>(url, 'gnome-golf', { name, character: CHARACTER });
      net = client;
      client.onMessage((m) => {
        if (net === client) onServer(m);
      });
      client.onClose(() => {
        if (net === client) goSolo(status === 'connecting' ? 'Could not reach the server.' : 'Lost connection to the course.');
      });
      client.connect().then(
        () => {
          if (net === client) client.queue(roomCode, CHARACTER, name);
        },
        () => {
          if (net === client) goSolo('Could not reach the server.');
        },
      );
    },

    leave(): void {
      if (status === 'off') return;
      net?.leave();
      goSolo('');
    },

    configure(g: GameMode, f: Format): void {
      const v = o();
      if (!v || !isHost() || v.started) return;
      game = g;
      format = f;
      v.format = f;
      send({ k: 'setup', game: g, format: f });
    },

    start(): void {
      const v = o();
      if (!v || !isHost() || v.started) return;
      const seed = Math.floor(Math.random() * 4294967296);
      send({ k: 'start', game, format, seed });
      applyStart({ game, format, seed });
    },

    next(): void {
      const v = o();
      if (!v || !v.started) return;
      if (v.format === 'together') {
        if (!isHost()) return;
        if (state.phase === 'card') {
          const hole = state.holeIndex + 1;
          send({ k: 'hole', hole });
          applyHole(hole);
        } else if (state.phase === 'final') {
          send({ k: 'lobby' });
          toLobby();
        }
        return;
      }
      if (state.phase === 'card') nextHole(state);
      else if (state.phase === 'final' && isHost()) {
        send({ k: 'lobby' });
        toLobby();
      }
    },

    canNext(): boolean {
      const v = o();
      if (!v || !v.started) return false;
      if (v.format === 'together') return isHost() && (state.phase === 'card' || state.phase === 'final');
      if (state.phase === 'card') return true;
      return state.phase === 'final' && isHost();
    },

    update(dt: number): void {
      const v = o();
      if (!net || !v) return;
      // A silent socket (phone asleep, network gone) shows up as no beats from the server.
      if (net.connected && net.lastHeardAt > 0 && performance.now() - net.lastHeardAt > NET.stallS * 1000) {
        goSolo('Lost connection to the course.');
        return;
      }
      if (!v.started) return;

      if (decideAt !== null && now() >= decideAt) decide();

      if (v.format === 'together' && v.turn === v.me && (state.phase === 'aim' || state.phase === 'swing')) {
        aimT += dt;
        if (aimT >= 1 / NET.aimHz) {
          aimT = 0;
          send({
            k: 'aim', hole: state.holeIndex, yaw: state.aimYaw, club: state.club, tilt: state.disc.tilt,
            swinging: state.phase === 'swing', swing: { ...state.swing }, held: state.disc.held, orbit: state.disc.orbit,
            ms: Math.round(performance.now()),
          });
        }
      }

      // Watching someone else's turn: show their aim and meter from the playback buffer.
      if (v.format === 'together' && v.turn !== v.me && (state.phase === 'aim' || state.phase === 'swing') && aimBuf.sample(aimOut)) {
        setAim(state, aimOut[0]);
        state.club = CLUB_IDS[aimOut[6]] ?? state.club;
        state.disc.tilt = aimOut[3];
        const swinging = aimOut[5] === 1;
        if (swinging && state.phase === 'aim') forcePhase(state, 'swing');
        if (!swinging && state.phase === 'swing') forcePhase(state, 'aim');
        state.swing = { stage: STAGES[aimOut[4]] ?? 'idle', marker: aimOut[1], power: aimOut[2] };
      }

      if (v.format === 'race') {
        if (state.phase === 'final' && finishedS === null) finishedS = Math.round((now() - raceStart) * 10) / 10;
        poseT -= dt;
        if (poseT <= 0) {
          poseT = 1 / NET.poseHz;
          const me = golfer(v.me);
          const pose = myPose();
          if (me) {
            me.race = pose;
            me.ball = xyz(pose.ball);
            me.strokes = state.strokes;
            me.holed = state.phase === 'holed' || state.phase === 'card' || state.phase === 'final';
            me.scores = state.scores.slice();
          }
          pose.ms = Math.round(performance.now());
          send({ k: 'pose', pose, strokes: state.strokes, holed: me?.holed ?? false, scores: state.scores.slice() });
        }
      }
    },
  };
  return api;
}
