// Online layer over @lawn/mp: joins the one shared town room ('gnome-town', public queue or ?room=CODE), relays my
// pose and emotes, and reports everyone else's. No host logic: every player owns their own gnome. Chat goes through
// the server's chat (censored there). Which map each player is on travels in their pose message.
// STUB: replaced by the net issue; keep the export names and signatures.
import type { AvatarPose, EmoteId, MapId, NetStatus, Peer } from './config';

/** Relayed game messages. p = [x, z, facing, moving 0/1, busy 0/1]; t = sender's performance.now(). */
export type TownMsg =
  | { k: 'pos'; m: MapId; p: [number, number, number, number, number]; t: number }
  | { k: 'emo'; e: EmoteId };

export interface NetEvents {
  /** Connection state changed, or the number of players in the town changed (me included). */
  onStatus(status: NetStatus, playersInTown: number): void;
  /** Someone is in the town (on match: everyone already there; later: each newcomer). Never me. */
  onPeerJoin(p: Peer): void;
  onPeerLeave(id: number): void;
  onPeerPose(id: number, map: MapId, pose: AvatarPose, sentAt: number): void;
  /** A chat line; id === myId for my own line (the server echoes it). */
  onChat(id: number, name: string, color: number, text: string): void;
  onEmote(id: number, e: EmoteId): void;
  /** The server dropped my line for flooding. */
  onChatRate(): void;
  /** The link dropped: every peer is gone (main.ts removes their avatars). A reconnect follows by itself. */
  onReset(): void;
}

export interface TownNet {
  /** My server id while online, else null. */
  readonly myId: number | null;
  /** My colour from the server while online, else null. */
  readonly myColor: number | null;
  /**
   * Remembers my name, then connects and joins (room null = the public town). When offline is true or serverUrl() is
   * '', it only reports status 'unavailable' (the town is played alone; chat and emotes still echo locally).
   */
  start(name: string, character: string, room: string | null, offline?: boolean): void;
  /** Call every frame (and while hidden): sends at NET.movingHz when the pose or map changed, else re-sends every NET.idleResendMs. */
  setPose(map: MapId, pose: AvatarPose): void;
  /** Online: sends through the server's chat (the server echoes it back with my id). Offline: ev.onChat(ME, myName, 0xffffff, text). */
  chat(text: string): void;
  /** Relays it to everyone else and calls ev.onEmote(ME, e) at once (the relay does not echo to the sender). */
  emote(e: EmoteId): void;
}

/** Never calls an ev handler synchronously from inside createNet (main.ts is still assigning the result). */
export function createNet(ev: NetEvents): TownNet {
  queueMicrotask(() => ev.onStatus('unavailable', 1));
  return {
    myId: null,
    myColor: null,
    start() {},
    setPose() {},
    chat(text) { ev.onChat(-1, 'You', 0xffffff, text); }, // -1 = ME
    emote(e) { ev.onEmote(-1, e); },
  };
}
