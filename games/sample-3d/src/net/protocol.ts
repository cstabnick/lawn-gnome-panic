// Lawn Gnome Panic's online royale messages. The server protocol itself (hello, queue, relay, chat,
// telemetry, colours, timing) is shared by every game and lives in packages/mp (@lawn/mp); this file
// re-exports it with the relay payload narrowed to this game's GameMsg, so the rest of the game
// imports everything from here as before.
import type { ClientMsg as SharedClientMsg, ServerMsg as SharedServerMsg } from '@lawn/mp/protocol';

export {
  PROTOCOL_VERSION, MAX_PLAYERS, MIN_PLAYERS, PLAYER_COLORS, PUBLIC_FILL_WAIT_S, PRIVATE_FILL_WAIT_S, NET_SEND_HZ,
  MATCH_SILENT_S, IDLE_DISCONNECT_S, CHAT_RATE_COUNT, CHAT_RATE_WINDOW_S, ROOM_CODE_RE,
  TELEMETRY_PATH, TELEMETRY_MAX_BYTES, TELEMETRY_MAX_EVENTS, CLIENT_EVENT_NAMES,
} from '@lawn/mp/protocol';
export type { PlayerInfo, ClientEventName, ClientEvent, TelemetryBatch } from '@lawn/mp/protocol';

/** Shape: one player's browser per match is the HOST and runs the world (mowers, zone clock).
 *  Everyone runs their own gnome and weapons and reports hits on mowers to the host. */
export type ClientMsg = SharedClientMsg<GameMsg>;
export type ServerMsg = SharedServerMsg<GameMsg>;

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
