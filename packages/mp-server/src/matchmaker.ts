// Matchmaking and relay logic. No sockets and no timers here, so it can be tested directly:
// index.ts owns the sockets and calls tick() once a second.
// Every game (GAMES in packages/mp/src/protocol.ts) has its own queues, rooms and matches.
import {
  CHAT_RATE_COUNT, CHAT_RATE_WINDOW_S, DEFAULT_GAME, GAMES, IDLE_DISCONNECT_S, MATCH_SILENT_S, PLAYER_COLORS, PROTOCOL_VERSION, RESUME_S,
  ROOM_CODE_RE, isGameId,
} from '../../mp/src/protocol';
import type { AnyGameMsg, GameId, GameRules, PlayerInfo, ServerMsg } from '../../mp/src/protocol';
import { CHAT_MAX, censorText, checkName, tidyText } from '../../mp/src/textFilter';
import { randomUUID } from 'node:crypto';

export interface Conn { readonly id: number; send(msg: ServerMsg): void; close(): void }
export interface MatchmakerOptions {
  /** Upper limits on each game's fill waits (GameRules.publicWaitS / privateWaitS); tests use small values. */
  publicWaitS: number; privateWaitS: number; now: () => number /* ms */; random: () => number;
  /** Defaults to MATCH_SILENT_S. */
  matchSilentS?: number;
  /** Defaults to IDLE_DISCONNECT_S. */
  idleS?: number;
  /** Defaults to RESUME_S. */
  resumeS?: number;
  /** Called for each notable event. Fields never hold names or room codes. */
  onEvent?: (ev: string, fields: Record<string, unknown>) => void;
}

const MATCH_MAX_MS = 30 * 60 * 1000;

interface Player {
  id: number;
  conn: Conn;
  hello: boolean;
  game: GameId;
  name: string;
  character: string;
  userId: string | null; // hello.userId when well-formed (unverified; only used to look up a public gnome)
  group: string | null; // key of the waiting group, or null
  match: string | null; // matchId, or null
  color: number | null; // 0xRRGGBB from PLAYER_COLORS, set when queued; null when not queued
  chatTimes: number[];  // ms timestamps of recent chat lines (flood limit)
  lastRelayAt: number;  // ms; in a match, when this player last relayed anything
  busyAt: number;       // ms; last tick this player was queued or in a match (or connected)
  resumable: boolean;   // hello.resumable: keep the match seat for RESUME_S after a drop
  token: string | null; // secret for hello.resume (resumable players only)
  awayAt: number | null; // ms; dropped out of the match and holding the seat since then, else null
}

/** Stands in for the socket of a player who dropped and holds their seat: sends go nowhere. */
const NO_CONN: Conn = { id: -1, send() {}, close() {} };

interface Group {
  key: string;          // `${game}|${code ?? ''}`
  game: GameId;
  code: string | null;  // null = public
  firstAt: number;      // ms
  members: number[];    // player ids in join order
}

interface Match {
  id: string;
  game: GameId;
  key: string;          // the group key it started from (lateJoin games take newcomers through it)
  hostId: number;
  startedAt: number;    // ms
  members: number[];
  private: boolean;     // started from a room code
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const USER_ID_RE = /^u_[a-z0-9]{20}$/;

function cleanUserId(raw: unknown): string | null {
  return typeof raw === 'string' && USER_ID_RE.test(raw) ? raw : null;
}

function cleanCharacter(raw: unknown): string {
  return typeof raw === 'string' ? Array.from(raw).slice(0, 16).join('') : 'gnorman';
}

export class Matchmaker {
  private readonly opts: MatchmakerOptions;
  /** By player id. A player's id is the id of the socket it said hello on; a resumed seat keeps it. */
  private readonly players = new Map<number, Player>();
  /** Socket id -> player id (they differ once a seat is resumed on a new socket). */
  private readonly byConn = new Map<number, number>();
  /** hello.resume token -> player id. */
  private readonly tokens = new Map<string, number>();
  private readonly groups = new Map<string, Group>();
  private readonly matches = new Map<string, Match>();
  /** Group key -> running match, so lateJoin games can put newcomers into it. */
  private readonly running = new Map<string, string>();
  private draining = false;

  constructor(opts: MatchmakerOptions) {
    this.opts = opts;
  }

  connect(conn: Conn): void {
    this.players.set(conn.id, {
      id: conn.id, conn, hello: false, game: DEFAULT_GAME, name: '', character: 'gnorman', userId: null, group: null, match: null,
      color: null, chatTimes: [], lastRelayAt: 0, busyAt: this.opts.now(), resumable: false, token: null, awayAt: null,
    });
    this.byConn.set(conn.id, conn.id);
  }

  private ofConn(conn: Conn): Player | undefined {
    const id = this.byConn.get(conn.id);
    return id === undefined ? undefined : this.players.get(id);
  }

  handle(conn: Conn, msg: unknown): void {
    const p = this.ofConn(conn);
    if (!p || !isObj(msg) || typeof msg.t !== 'string') return;
    if (!p.hello) {
      if (msg.t === 'hello') this.hello(p, msg);
      return;
    }
    switch (msg.t) {
      case 'queue': this.queue(p, msg); break;
      case 'leave': this.leave(p); break;
      case 'relay': this.relay(p, msg); break;
      case 'chat': this.chat(p, msg); break;
    }
  }

  disconnect(conn: Conn): void {
    const p = this.ofConn(conn);
    this.byConn.delete(conn.id);
    if (!p || p.conn !== conn) return;
    if (p.resumable && p.match !== null) {
      this.away(p);
      return;
    }
    this.leave(p);
    this.forget(p);
  }

  tick(): void {
    const now = this.opts.now();
    for (const g of [...this.groups.values()]) {
      if (g.members.length < this.rules(g.game).minPlayers) {
        // A lone player keeps waiting; the countdown restarts when the second player arrives.
        g.firstAt = now;
        this.sendQueued(g);
      } else if (now - g.firstAt >= this.waitS(g) * 1000) this.start(g);
      else this.sendQueued(g);
    }
    // Idle connections (lobby tabs left open) keep the server machine awake: close them.
    const idleMs = (this.opts.idleS ?? IDLE_DISCONNECT_S) * 1000;
    for (const p of this.players.values()) {
      if (p.group !== null || p.match !== null) p.busyAt = now;
      else if (now - p.busyAt > idleMs) {
        this.emit('idle_close');
        p.conn.close();
        p.busyAt = now; // it stays listed until the socket finishes closing: do not count it again
      }
    }
    const silentMs = (this.opts.matchSilentS ?? MATCH_SILENT_S) * 1000;
    const resumeMs = (this.opts.resumeS ?? RESUME_S) * 1000;
    for (const m of [...this.matches.values()]) {
      for (const id of [...m.members]) {
        const p = this.players.get(id);
        if (!p) continue;
        if (p.awayAt !== null) {
          // A dropped player who did not come back in time gives up the seat.
          if (now - p.awayAt <= resumeMs) continue;
          this.emit('resume_expired', { game: m.game });
          this.leaveMatch(p, 'timeout');
          this.forget(p);
          continue;
        }
        if (now - p.lastRelayAt <= silentMs) continue;
        // Silent members are gone in all but name (dead connection, phone asleep). Resumable ones hold their seat
        // (their socket is closed so the client notices and reconnects); the rest are removed.
        if (p.resumable) {
          const c = p.conn;
          this.byConn.delete(c.id);
          this.away(p);
          c.close();
          continue;
        }
        this.leaveMatch(p, 'timeout');
        p.conn.send({ t: 'ended', reason: 'You stopped responding (bad connection, or the game went to sleep).' });
      }
      for (const id of m.members) this.sendTo(id, { t: 'beat' });
      if (now - m.startedAt <= MATCH_MAX_MS) continue;
      if (this.rules(m.game).lateJoin) continue; // drop-in games (co-op, conquest) run as long as people play
      this.emit('match_end', { game: m.game, matchId: m.id, durationS: Math.round((now - m.startedAt) / 1000), reason: 'too_long' });
      for (const id of m.members) {
        const p = this.players.get(id);
        if (p && p.match === m.id) p.match = null;
        this.sendTo(id, { t: 'ended', reason: 'This match ran for 30 minutes. That is enough lawn.' });
        if (p && p.awayAt !== null) this.forget(p);
      }
      this.endMatch(m);
    }
  }

  drain(): void {
    this.draining = true;
    for (const [key, g] of this.groups) {
      // Groups that already meet minPlayers will start on their own; smaller groups can
      // never fill once draining rejects new queues, so end them right away.
      if (g.members.length >= this.rules(g.game).minPlayers) continue;
      for (const id of g.members) {
        const p = this.players.get(id);
        if (p) p.group = null;
        this.sendTo(id, { t: 'ended', reason: 'The server is restarting for an update. Press PLAY again.' });
      }
      this.groups.delete(key);
    }
  }

  stats(): { players: number; queued: number; matches: number; draining: boolean } {
    let players = 0;
    for (const p of this.players.values()) if (p.hello) players++;
    let queued = 0;
    for (const g of this.groups.values()) queued += g.members.length;
    return { players, queued, matches: this.matches.size, draining: this.draining };
  }

  // ---------------------------------------------------------------- messages

  private hello(p: Player, msg: Record<string, unknown>): void {
    if (msg.v !== PROTOCOL_VERSION) {
      p.conn.send({ t: 'error', message: 'Your game is out of date. Refresh the page.' });
      p.conn.close();
      return;
    }
    if (msg.game !== undefined && !isGameId(msg.game)) {
      p.conn.send({ t: 'error', message: 'This server does not know that game.' });
      p.conn.close();
      return;
    }
    const game: GameId = msg.game ?? DEFAULT_GAME;
    if (typeof msg.resume === 'string' && this.resume(p, game, msg.resume)) return;
    p.hello = true;
    p.game = game;
    const c = checkName(msg.name);
    p.name = c.ok ? c.name : `Gnome${p.id}`;
    p.character = cleanCharacter(msg.character);
    p.userId = cleanUserId(msg.userId);
    if (msg.resumable === true) {
      p.resumable = true;
      p.token = randomUUID();
      this.tokens.set(p.token, p.id);
    }
    p.conn.send({ t: 'welcome', id: p.id, ...(p.token !== null ? { token: p.token } : {}) });
  }

  /**
   * hello.resume: the fresh player `fresh` takes back the match seat of the player who holds `token`, keeping that
   * player's id. Works while the seat is held (away) and also when the old socket still looks open (the client gave up
   * on it first). False = no such seat: carry on with a normal hello.
   */
  private resume(fresh: Player, game: GameId, token: string): boolean {
    const id = this.tokens.get(token);
    const p = id === undefined ? undefined : this.players.get(id);
    if (!p || p.game !== game || p.match === null) return false;
    const m = this.matches.get(p.match);
    if (!m) return false;
    const conn = fresh.conn;
    this.players.delete(fresh.id);
    this.byConn.set(conn.id, p.id);
    const old = p.conn;
    if (old !== NO_CONN) {
      this.byConn.delete(old.id);
      old.close();
    }
    p.conn = conn;
    p.awayAt = null;
    p.lastRelayAt = this.opts.now();
    // Nobody is hosting (everyone dropped, the host first): the first one back runs the world.
    const host = this.players.get(m.hostId);
    if (!host || host.awayAt !== null) {
      m.hostId = p.id;
      this.emit('host_change', { matchId: m.id });
      for (const o of m.members) if (o !== p.id) this.sendTo(o, { t: 'host', hostId: p.id });
    }
    this.emit('resume', { game: m.game });
    conn.send({ t: 'welcome', id: p.id, token, resumed: { matchId: m.id, hostId: m.hostId, players: this.infos(m) } });
    return true;
  }

  private queue(p: Player, msg: Record<string, unknown>): void {
    p.character = cleanCharacter(msg.character);
    if (this.draining) {
      p.conn.send({ t: 'error', message: 'The server is restarting for an update. Try again in a few seconds.' });
      return;
    }
    let code: string | null;
    if (msg.code === null) code = null;
    else if (typeof msg.code === 'string' && ROOM_CODE_RE.test(msg.code)) code = msg.code;
    else {
      p.conn.send({ t: 'error', message: 'Room codes are 4-8 letters or digits.' });
      return;
    }
    if (code === null && this.rules(p.game).roomCodeOnly) {
      p.conn.send({ t: 'error', message: 'This game is played by room code only.' });
      return;
    }
    const c = checkName(msg.name);
    if (!c.ok) {
      this.emit('bad_name');
      p.conn.send({ t: 'error', message: c.reason, code: 'bad-name' });
      return;
    }
    p.name = c.name;

    this.leave(p);
    const rules = this.rules(p.game);
    const key = `${p.game}|${code ?? ''}`;

    // Drop-in games: join the room's running match if there is space.
    const runningId = rules.lateJoin ? this.running.get(key) : undefined;
    const running = runningId !== undefined ? this.matches.get(runningId) : undefined;
    if (running && running.members.length < rules.maxPlayers) {
      this.joinRunning(running, p);
      return;
    }

    let group = this.groups.get(key);
    if (!group) {
      group = { key, game: p.game, code, firstAt: this.opts.now(), members: [] };
      this.groups.set(key, group);
    }
    group.members.push(p.id);
    p.group = key;
    p.color = this.pickColor(group.members, p);
    this.emit('queue', { game: p.game, private: code !== null });
    if (group.members.length === rules.minPlayers) group.firstAt = this.opts.now();
    if (group.members.length >= rules.maxPlayers || (group.members.length >= rules.minPlayers && this.waitS(group) <= 0)) {
      this.start(group);
    } else this.sendQueued(group);
  }

  /** Puts p into a match that is already running (lateJoin games): p gets 'match', the others 'joined'. */
  private joinRunning(m: Match, p: Player): void {
    p.color = this.pickColor(m.members, p);
    const info: PlayerInfo = { id: p.id, name: p.name, character: p.character, color: p.color, ...(p.userId !== null ? { userId: p.userId } : {}) };
    const infos = this.infos(m);
    infos.push(info);
    for (const id of m.members) this.sendTo(id, { t: 'joined', player: info });
    m.members.push(p.id);
    // Everyone in the room dropped and holds a seat: the newcomer hosts until they are back.
    const host = this.players.get(m.hostId);
    if (!host || host.awayAt !== null) {
      m.hostId = p.id;
      this.emit('host_change', { matchId: m.id });
      for (const id of m.members) if (id !== p.id) this.sendTo(id, { t: 'host', hostId: p.id });
    }
    p.match = m.id;
    p.lastRelayAt = this.opts.now();
    this.emit('player_joined', { game: m.game, matchId: m.id, players: m.members.length });
    p.conn.send({ t: 'match', matchId: m.id, seed: 0, hostId: m.hostId, you: p.id, players: infos });
  }

  private chat(p: Player, msg: Record<string, unknown>): void {
    if (typeof msg.text !== 'string') return;
    const text = censorText(Array.from(tidyText(msg.text)).slice(0, CHAT_MAX).join(''));
    if (text === '') return;
    let recipients: number[];
    if (p.match !== null) {
      recipients = this.matches.get(p.match)?.members ?? [];
    } else if (p.group !== null) {
      recipients = this.groups.get(p.group)?.members ?? [];
    } else {
      return;
    }
    const now = this.opts.now();
    const windowMs = CHAT_RATE_WINDOW_S * 1000;
    p.chatTimes = p.chatTimes.filter((t) => now - t < windowMs);
    if (p.chatTimes.length >= CHAT_RATE_COUNT) {
      this.emit('chat_rate');
      p.conn.send({
        t: 'error',
        message: `Slow down! Chat is limited to ${CHAT_RATE_COUNT} lines every ${CHAT_RATE_WINDOW_S} seconds.`,
        code: 'chat-rate',
      });
      return;
    }
    p.chatTimes.push(now);
    const out: ServerMsg = { t: 'chat', from: p.id, name: p.name, color: p.color ?? PLAYER_COLORS[0], text };
    for (const id of recipients) this.sendTo(id, out);
  }

  private relay(p: Player, msg: Record<string, unknown>): void {
    if (p.match === null) return;
    const m = this.matches.get(p.match);
    if (!m) return;
    const to = msg.to;
    if (!(to === null || typeof to === 'number') || !isObj(msg.d)) return;
    p.lastRelayAt = this.opts.now();
    const d = msg.d as AnyGameMsg;
    if (to === null) {
      for (const id of m.members) if (id !== p.id) this.sendTo(id, { t: 'relay', from: p.id, d });
    } else if (m.members.includes(to)) {
      this.sendTo(to, { t: 'relay', from: p.id, d });
    }
  }

  // ---------------------------------------------------------------- state changes

  /** Removes p from its queue or match (same as the 'leave' message). */
  private leave(p: Player): void {
    if (p.group !== null) {
      const g = this.groups.get(p.group);
      p.group = null;
      p.color = null;
      if (g) {
        g.members = g.members.filter((id) => id !== p.id);
        if (g.members.length === 0) this.groups.delete(g.key);
        else this.sendQueued(g);
      }
    }
    if (p.match !== null) this.leaveMatch(p, 'quit');
  }

  /** Removes p from its match. If p was the host, the next player in join order takes over. */
  private leaveMatch(p: Player, reason: 'quit' | 'timeout'): void {
    if (p.match === null) return;
    const m = this.matches.get(p.match);
    p.match = null;
    if (!m) return;
    const wasHost = m.hostId === p.id;
    m.members = m.members.filter((id) => id !== p.id);
    this.emit('player_left', { matchId: m.id, reason, wasHost, remaining: m.members.length });
    if (m.members.length === 0) {
      this.emit('match_end', { game: m.game, matchId: m.id, durationS: Math.round((this.opts.now() - m.startedAt) / 1000), reason: 'empty' });
      this.endMatch(m);
      return;
    }
    for (const id of m.members) this.sendTo(id, { t: 'left', id: p.id, reason });
    if (wasHost) {
      m.hostId = this.nextHost(m);
      this.emit('host_change', { matchId: m.id });
      for (const id of m.members) this.sendTo(id, { t: 'host', hostId: m.hostId });
    }
  }

  private start(g: Group): void {
    if (g.members.length < this.rules(g.game).minPlayers) return;
    this.groups.delete(g.key);
    const now = this.opts.now();
    const matchId = Array.from({ length: 8 }, () => Math.floor(this.opts.random() * 16).toString(16)).join('');
    const seed = Math.floor(this.opts.random() * 4294967296);
    const hostId = g.members[0];
    const infos: PlayerInfo[] = [];
    for (const id of g.members) {
      const p = this.players.get(id);
      if (p) infos.push({ id, name: p.name, character: p.character, color: p.color ?? PLAYER_COLORS[0], ...(p.userId !== null ? { userId: p.userId } : {}) });
    }
    this.matches.set(matchId, { id: matchId, game: g.game, key: g.key, hostId, startedAt: now, members: [...g.members], private: g.code !== null });
    if (this.rules(g.game).lateJoin) this.running.set(g.key, matchId);
    this.emit('match_start', { game: g.game, matchId, players: g.members.length, private: g.code !== null });
    for (const id of g.members) {
      const p = this.players.get(id);
      if (!p) continue;
      p.group = null;
      p.match = matchId;
      p.lastRelayAt = now;
      p.conn.send({ t: 'match', matchId, seed, hostId, you: id, players: infos });
    }
  }

  /** A resumable player dropped out of the match: hold the seat (tick() gives it up after RESUME_S). */
  private away(p: Player): void {
    p.conn = NO_CONN;
    p.awayAt = this.opts.now();
    const m = p.match === null ? undefined : this.matches.get(p.match);
    if (!m) return;
    this.emit('player_away', { game: m.game, matchId: m.id });
    if (m.hostId !== p.id) return;
    const next = this.nextHost(m);
    if (next === p.id) return; // nobody else is here; the first one back hosts (resume())
    m.hostId = next;
    this.emit('host_change', { matchId: m.id });
    for (const id of m.members) this.sendTo(id, { t: 'host', hostId: next });
  }

  /** The first member in join order who is connected (not holding a dropped seat), else the first member. */
  private nextHost(m: Match): number {
    for (const id of m.members) if (this.players.get(id)?.awayAt === null) return id;
    return m.members[0];
  }

  /** Drops p from the server's books (after it left its queue and match). */
  private forget(p: Player): void {
    this.players.delete(p.id);
    if (p.token !== null) this.tokens.delete(p.token);
  }

  // ---------------------------------------------------------------- helpers

  private infos(m: Match): PlayerInfo[] {
    const infos: PlayerInfo[] = [];
    for (const id of m.members) {
      const o = this.players.get(id);
      if (o) infos.push({ id, name: o.name, character: o.character, color: o.color ?? PLAYER_COLORS[0], ...(o.userId !== null ? { userId: o.userId } : {}) });
    }
    return infos;
  }

  private rules(game: GameId): GameRules {
    return GAMES[game];
  }

  private endMatch(m: Match): void {
    this.matches.delete(m.id);
    if (this.running.get(m.key) === m.id) this.running.delete(m.key);
  }

  /** A random colour no other member has; any random one when all are taken. */
  private pickColor(members: number[], p: Player): number {
    const taken = new Set<number>();
    for (const id of members) {
      if (id === p.id) continue;
      const o = this.players.get(id);
      if (o?.color != null) taken.add(o.color);
    }
    const free = PLAYER_COLORS.filter((c) => !taken.has(c));
    const pool = free.length > 0 ? free : PLAYER_COLORS;
    return pool[Math.min(pool.length - 1, Math.floor(this.opts.random() * pool.length))];
  }

  private waitS(g: Group): number {
    const r = this.rules(g.game);
    return g.code === null ? Math.min(r.publicWaitS, this.opts.publicWaitS) : Math.min(r.privateWaitS, this.opts.privateWaitS);
  }

  private sendQueued(g: Group): void {
    const elapsedS = (this.opts.now() - g.firstAt) / 1000;
    const startsInS = Math.max(0, Math.ceil(this.waitS(g) - elapsedS));
    for (const id of g.members) {
      this.sendTo(id, { t: 'queued', code: g.code, players: g.members.length, startsInS });
    }
  }

  private sendTo(id: number, msg: ServerMsg): void {
    this.players.get(id)?.conn.send(msg);
  }

  private emit(ev: string, fields: Record<string, unknown> = {}): void {
    this.opts.onEvent?.(ev, fields);
  }
}
