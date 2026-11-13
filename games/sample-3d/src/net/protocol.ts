// Wire protocol for online battle royale. Shared by the browser client and the Node server
// (games/sample-3d/server), so this file imports nothing.
//
// Shape: the server does matchmaking and relays messages; it does not simulate the game.
// One player's browser per match is the HOST and runs the world (mowers, bots, zone clock).
// Everyone runs their own gnome and weapons and reports hits on mowers to the host.
// All messages are JSON text frames.

export const PROTOCOL_VERSION = 3;

/** Gnomes per match. Online matches are humans only (no bots). */
export const MAX_PLAYERS = 20;
/** A match never starts with fewer players than this; a lone player keeps waiting. */
export const MIN_PLAYERS = 2;
/**
 * Player colours (0xRRGGBB). The server gives each player a random one, unique within their queue group,
 * when they queue; it is kept into the match.
 * All are light enough to read on a dark backing; names and chat are always drawn on one
 * (see src/ui/nameStyle.ts), so they stay readable over any part of the world.
 */
export const PLAYER_COLORS: readonly number[] = [
  0xff5a5a, 0xff9a3c, 0xffd54f, 0xc6ff4a, 0x5cff7a, 0x3df5c8, 0x4fd8ff, 0x6fa8ff, 0xa98bff, 0xe07cff,
  0xff6fd0, 0xff8fa3, 0xffb38a, 0xe8e070, 0x9be08a, 0x8ae6e6, 0xb0c8ff, 0xd9b3ff, 0xffffff, 0xc9a27a,
];
/** A public match starts this long after its first player queued, or as soon as it is full. */
export const PUBLIC_FILL_WAIT_S = 15;
/** A private (room code) match waits longer, so friends have time to type the code. */
export const PRIVATE_FILL_WAIT_S = 45;
/** How often clients send 'me' and the host sends 'snap'. */
export const NET_SEND_HZ = 15;
/** A match member who relays nothing for this long is removed (bad connection, or the game went to sleep).
 *  If it was the host, the next player in join order becomes host. */
export const MATCH_SILENT_S = 8;
/** The server closes connections that are neither queued nor in a match for this long (idle lobby tabs). */
export const IDLE_DISCONNECT_S = 180;
/** Chat flood limit: at most this many lines per player per window. */
export const CHAT_RATE_COUNT = 5;
export const CHAT_RATE_WINDOW_S = 5;
/** Room codes: 4-8 characters of A-Z and 0-9 (the client upper-cases input). */
export const ROOM_CODE_RE = /^[A-Z0-9]{4,8}$/;

export interface PlayerInfo {
  id: number;        // assigned by the server, unique while it runs
  name: string;      // display name, passed checkName() in src/net/textFilter.ts
  character: string; // CharacterId ('gnorman' | 'gnancy'); unknown values render as gnorman
  color: number;     // one of PLAYER_COLORS, unique within the match
}

// ---------------------------------------------------------------- client -> server
export type ClientMsg =
  | { t: 'hello'; v: number; name: string; character: string }
  /** Join matchmaking. code null = public queue; else a private room code matching ROOM_CODE_RE. name and character replace hello's. */
  | { t: 'queue'; code: string | null; character: string; name: string }
  /** Leave the queue or the current match. */
  | { t: 'leave' }
  /** Forward d to one player of my match (to = their id) or to every other player (to = null). */
  | { t: 'relay'; to: number | null; d: GameMsg }
  /** Chat to everyone in my queue group or match. The server tidies, cuts to CHAT_MAX and censors it. */
  | { t: 'chat'; text: string };

// ---------------------------------------------------------------- server -> client
export type ServerMsg =
  | { t: 'welcome'; id: number }
  /** Sent on queue and whenever the waiting group changes, and once a second while waiting. */
  | { t: 'queued'; code: string | null; players: number; startsInS: number }
  /** The match starts now. players includes you; hostId is one of them. */
  | { t: 'match'; matchId: string; seed: number; hostId: number; you: number; players: PlayerInfo[] }
  | { t: 'relay'; from: number; d: GameMsg }
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

// ---------------------------------------------------------------- game messages (opaque to the server)
/** [id, tier, x, y, z, heading, hp, maxHp]. Numbers rounded to 2 decimals. tier is a MowerTier string. */
export type MowerSnap = [number, string, number, number, number, number, number, number];
/** [botId, name, x, y, z, alive 1|0]. Unused since online went humans-only (bots stays []). */
export type BotSnap = [number, string, number, number, number, 0 | 1];
/** [x, z, tier, by]: a mower died. by = id of the player whose hit killed it, -1 for a bot or unknown. */
export type KillSnap = [number, number, string, number];

export type GameMsg =
  /** Host -> all, NET_SEND_HZ. t = match clock (s). kills and feed hold only what happened since the last snap. */
  | {
      k: 'snap'; t: number; mowers: MowerSnap[]; bots: BotSnap[]; kills: KillSnap[];
      feed: { victim: string; cause: string; color?: number }[]; alive: number; total: number;
    }
  /** Every player -> all, NET_SEND_HZ: where my gnome is. */
  | { k: 'me'; x: number; y: number; z: number; facing: number; alive: boolean }
  /** Client -> host, at most NET_SEND_HZ: my weapons' hits since the last send. Each is [mowerId, damage, slowFactor, slowSeconds]; slowSeconds 0 = no slow. */
  | { k: 'hits'; list: [number, number, number, number][] }
  /** Client -> host: I died. cause is a KillEvent cause string. */
  | { k: 'died'; cause: string }
  /** Host -> all: the match is over. winner = player id, or -1 when nobody survived. */
  | { k: 'over'; winner: number; winnerName: string };

// ---------------------------------------------------------------- telemetry (HTTP, not the WebSocket)
// The game POSTs batches to the matchmaking server's TELEMETRY_PATH with navigator.sendBeacon
// (Content-Type text/plain, so no CORS preflight). The server validates them and writes one JSON
// log line per event (read with `fly logs`). Anonymous: cid is a random id per browser, sid per page
// load; no names, chat text or IP addresses are logged.

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
