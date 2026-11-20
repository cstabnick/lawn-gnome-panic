// Wire protocol of the shared matchmaking + relay server (packages/mp-server), used by every online game.
// Imports nothing, so the Node server and the browser games can both use it.
//
// Shape: the server does matchmaking and relays messages; it does not simulate any game.
// One player's browser per match is the HOST and runs the world. Game messages (the `d` of a relay)
// are opaque to the server: each game defines its own (see GameRules and each game's src/net).
// All messages are JSON text frames.

export const PROTOCOL_VERSION = 3;

/** Games the server knows. A hello without `game` is Lawn Gnome Panic (older clients never sent one). */
export type GameId = 'lawn-gnome-panic' | 'gnome-front' | 'gnaft' | 'gnome-golf' | 'gnome-bowling' | 'mower-chain' | 'gnome-party' | 'music-room' | 'gnomomia' | 'gnome-blackjack' | 'club-gnome' | 'gnome-theft-auto' | 'gnome-billiards';
export const DEFAULT_GAME: GameId = 'lawn-gnome-panic';

/** Per-game matchmaking rules. Queues, rooms and matches never mix games. */
export interface GameRules {
  /** A match never starts with fewer players than this; fewer keep waiting. */
  minPlayers: number;
  maxPlayers: number;
  /** A public match starts this long after its first player queued (or as soon as it is full). */
  publicWaitS: number;
  /** Same for a private room code; longer, so friends have time to type the code. */
  privateWaitS: number;
  /**
   * Join in progress: queueing for a room whose match is already running (and not full) joins that match:
   * the newcomer gets 'match' and everyone else gets 'joined'.
   */
  lateJoin: boolean;
}

export const GAMES: Record<GameId, GameRules> = {
  // Online royale: humans only, everyone starts together.
  'lawn-gnome-panic': { minPlayers: 2, maxPlayers: 20, publicWaitS: 15, privateWaitS: 45, lateJoin: false },
  // Conquest FPS: 12 a side, bots fill the rest, so one player is enough to start; later players (public or room code)
  // drop into the running match.
  'gnome-front': { minPlayers: 1, maxPlayers: 24, publicWaitS: 15, privateWaitS: 45, lateJoin: true },
  // Co-op raft: the first player starts the raft at once (and hosts it), friends join with the room code.
  'gnaft': { minPlayers: 1, maxPlayers: 8, publicWaitS: 0, privateWaitS: 0, lateJoin: true },
  // Golf and Gnome Disc: the first player opens a lobby at once (and hosts it); others join it, even mid-round.
  'gnome-golf': { minPlayers: 1, maxPlayers: 12, publicWaitS: 0, privateWaitS: 0, lateJoin: true },
  // Bowling: 2-4 bowlers take turns; everyone starts together, nobody joins mid-game.
  'gnome-bowling': { minPlayers: 2, maxPlayers: 4, publicWaitS: 10, privateWaitS: 20, lateJoin: false },
  // Mower Chain (snake.io style): the first player opens the arena at once (and hosts it, bots fill in); anyone joins any time.
  'mower-chain': { minPlayers: 1, maxPlayers: 20, publicWaitS: 0, privateWaitS: 0, lateJoin: true },
  // Gnome Party: a board party for 4. Alone in the public queue, the party starts after 20 s with 3 CPUs; nobody joins mid-party.
  'gnome-party': { minPlayers: 1, maxPlayers: 4, publicWaitS: 20, privateWaitS: 60, lateJoin: false },
  // Jam room: no host logic, notes are relayed to everyone. Opens at once; anyone drops in (public or room code).
  'music-room': { minPlayers: 1, maxPlayers: 16, publicWaitS: 0, privateWaitS: 0, lateJoin: true },
  // Gnomes of Gnomomia (MMO): one shared world room. Opens at once, everyone drops in; when it is full the next player opens
  // a new shard. No host logic: each player owns their own character and relays it (games/gnomes-of-gnomomia/src/net).
  'gnomomia': { minPlayers: 1, maxPlayers: 40, publicWaitS: 0, privateWaitS: 0, lateJoin: true },
  // Gnome Blackjack: the first player opens a table at once (and hosts it, CPU gnomes fill the seats); up to 5 humans
  // drop in any time and take a CPU's seat.
  'gnome-blackjack': { minPlayers: 1, maxPlayers: 5, publicWaitS: 0, privateWaitS: 0, lateJoin: true },
  // Club Gnome (hub world): one shared town room. Opens at once, everyone drops in; a full room opens a new one. No host
  // logic: each player relays their own gnome (games/club-gnome/src/net.ts).
  'club-gnome': { minPlayers: 1, maxPlayers: 40, publicWaitS: 0, privateWaitS: 0, lateJoin: true },
  // Gnome Theft Auto: free roam in Turfton. Opens at once, everyone drops in. No host: each player relays their own
  // gnome and mower, and tells a player when their water hits them (games/gnome-theft-auto/src/net.ts).
  'gnome-theft-auto': { minPlayers: 1, maxPlayers: 16, publicWaitS: 0, privateWaitS: 0, lateJoin: true },
  // Gnome Billiards: 8-ball for two. Public queue waits 10 s, a room code 20 s; nobody joins mid-game. The shooter's
  // browser plays each shot and relays the settled table (games/gnome-billiards/src/net.ts).
  'gnome-billiards': { minPlayers: 2, maxPlayers: 2, publicWaitS: 10, privateWaitS: 20, lateJoin: false },
};

export function isGameId(v: unknown): v is GameId {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(GAMES, v);
}

/** Lawn Gnome Panic's rules, kept as constants for its code. */
export const MAX_PLAYERS = GAMES['lawn-gnome-panic'].maxPlayers;
export const MIN_PLAYERS = GAMES['lawn-gnome-panic'].minPlayers;
export const PUBLIC_FILL_WAIT_S = GAMES['lawn-gnome-panic'].publicWaitS;
export const PRIVATE_FILL_WAIT_S = GAMES['lawn-gnome-panic'].privateWaitS;

/**
 * Player colours (0xRRGGBB). The server gives each player a random one, unique within their queue group,
 * when they queue; it is kept into the match.
 * All are light enough to read on a dark backing.
 */
export const PLAYER_COLORS: readonly number[] = [
  0xff5a5a, 0xff9a3c, 0xffd54f, 0xc6ff4a, 0x5cff7a, 0x3df5c8, 0x4fd8ff, 0x6fa8ff, 0xa98bff, 0xe07cff,
  0xff6fd0, 0xff8fa3, 0xffb38a, 0xe8e070, 0x9be08a, 0x8ae6e6, 0xb0c8ff, 0xd9b3ff, 0xffffff, 0xc9a27a,
];
/** How often clients usually send their own state and the host sends snapshots. */
export const NET_SEND_HZ = 15;
/** A match member who relays nothing for this long is removed (bad connection, or the game went to sleep).
 *  If it was the host, the next player in join order becomes host. */
export const MATCH_SILENT_S = 8;
/**
 * Resumable players (hello.resumable) who drop out of a match (socket closed, or silent for MATCH_SILENT_S) keep their
 * seat this long: a new socket that says hello with the welcome's token gets the same id and seat back. Others in the
 * match see nothing until the seat is given up ('left', reason 'timeout'); a host who drops hands hosting over at once.
 */
export const RESUME_S = 45;
/** The server closes connections that are neither queued nor in a match for this long (idle lobby tabs). */
export const IDLE_DISCONNECT_S = 180;
/** Chat flood limit: at most this many lines per player per window. */
export const CHAT_RATE_COUNT = 5;
export const CHAT_RATE_WINDOW_S = 5;
/** Room codes: 4-8 characters of A-Z and 0-9 (the client upper-cases input). */
export const ROOM_CODE_RE = /^[A-Z0-9]{4,8}$/;

export interface PlayerInfo {
  id: number;        // assigned by the server, unique while it runs
  name: string;      // display name, passed checkName() in textFilter.ts
  character: string; // game-specific look id (at most 16 characters)
  color: number;     // one of PLAYER_COLORS, unique within the match
  /** Platform account id (`u_…`) the player said they play as. NOT verified: only use it to fetch their public gnome (gear). */
  userId?: string;
}

/** Any game message: a JSON object. Each game narrows this with its own union. */
export type AnyGameMsg = Record<string, unknown>;

// ---------------------------------------------------------------- client -> server
export type ClientMsg<G = AnyGameMsg> =
  /** game: which game's queues to use (default DEFAULT_GAME).
   *  userId: my platform account id, so other players can fetch my gnome's gear (not verified). resumable: keep my match seat for RESUME_S if I drop. resume: the token of an earlier welcome, to take that seat back. */
  | { t: 'hello'; v: number; name: string; character: string; game?: GameId; resumable?: boolean; resume?: string; userId?: string }
  /** Join matchmaking. code null = public queue; else a private room code matching ROOM_CODE_RE. name and character replace hello's. */
  | { t: 'queue'; code: string | null; character: string; name: string }
  /** Leave the queue or the current match. */
  | { t: 'leave' }
  /** Forward d to one player of my match (to = their id) or to every other player (to = null). */
  | { t: 'relay'; to: number | null; d: G }
  /** Chat to everyone in my queue group or match. The server tidies, cuts to CHAT_MAX and censors it. */
  | { t: 'chat'; text: string };

// ---------------------------------------------------------------- server -> client
export type ServerMsg<G = AnyGameMsg> =
  /** token: (resumable hellos) secret for hello.resume. resumed: that hello took its old seat back; id is the old id. */
  | { t: 'welcome'; id: number; token?: string; resumed?: { matchId: string; hostId: number; players: PlayerInfo[] } }
  /** Sent on queue and whenever the waiting group changes, and once a second while waiting. */
  | { t: 'queued'; code: string | null; players: number; startsInS: number }
  /** The match starts now (or you joined it in progress). players includes you; hostId is one of them. */
  | { t: 'match'; matchId: string; seed: number; hostId: number; you: number; players: PlayerInfo[] }
  /** Someone joined your running match (lateJoin games only). */
  | { t: 'joined'; player: PlayerInfo }
  | { t: 'relay'; from: number; d: G }
  /** A player left the match: 'quit' = closed the tab or sent leave, 'timeout' = silent for MATCH_SILENT_S. */
  | { t: 'left'; id: number; reason?: 'quit' | 'timeout' }
  /** The host left: hostId now runs the world (sent after the 'left'). */
  | { t: 'host'; hostId: number }
  /** Keepalive, once a second to every match member, so clients can tell a dead connection from a quiet match. */
  | { t: 'beat' }
  /** Your match or queue is over: you stopped responding, the match ran too long, or the server is restarting. */
  | { t: 'ended'; reason: string }
  /** A chat line from someone in my queue group or match (my own lines come back too). Already censored. */
  | { t: 'chat'; from: number; name: string; color: number; text: string }
  /** code 'bad-name': the name failed checkName(); the player was not queued.
   *  code 'chat-rate': more than CHAT_RATE_COUNT lines in CHAT_RATE_WINDOW_S; that line was dropped (show it in chat, not as a failure). */
  | { t: 'error'; message: string; code?: 'bad-name' | 'chat-rate' };

// ---------------------------------------------------------------- telemetry (HTTP, not the WebSocket)
// Games POST batches to the server's TELEMETRY_PATH with navigator.sendBeacon
// (Content-Type text/plain, so no CORS preflight). The server validates them and writes one structured
// log record per event (whale-net JSON on stdout, see packages/mp-server/src/log.ts). Anonymous: cid is a random id per
// browser, sid per page load; no names, chat text or IP addresses are logged.

export const TELEMETRY_PATH = '/t';
export const TELEMETRY_MAX_BYTES = 8192;
export const TELEMETRY_MAX_EVENTS = 50;

export type ClientEventName =
  | 'load'          // page loaded: touch, w, h (window size rounded to 100)
  | 'run_start'     // mode ('solo' | 'royale' | 'online'), level
  | 'run_end'       // mode, victory, timeS, level, kills, cause
  | 'online_queue'  // private (room code used)
  | 'online_match'  // players, host (am I host)
  | 'online_end'    // reason: 'over' | 'net_lost' | 'background' | 'ended' | 'quit'
  | 'host_change'   // me (did I become host)
  | 'error';        // msg, src, line (uncaught errors and rejections; at most 5 per page load)

export const CLIENT_EVENT_NAMES: readonly ClientEventName[] = [
  'load', 'run_start', 'run_end', 'online_queue', 'online_match', 'online_end', 'host_change', 'error',
];

/** One event: ev, at (ms since page load), and up to 12 more fields of string (<= 200 chars), number or boolean. */
export type ClientEvent = { ev: ClientEventName; at: number } & Record<string, string | number | boolean>;

export interface TelemetryBatch {
  cid: string; // random per browser (localStorage), 1-40 chars of [A-Za-z0-9_-]
  sid: string; // random per page load, same rules
  events: ClientEvent[];
}
