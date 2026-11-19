// Online layer over @lawn/mp: joins the one shared town room ('gnome-town', public queue or ?room=CODE), relays my
// pose and emotes, and reports everyone else's. No host logic: every player owns their own gnome. Chat goes through
// the server's chat (censored there). Which map each player is on travels in their pose message.
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import { steadyInterval } from '@lawn/mp/background';
import type { ServerMsg, PlayerInfo } from '@lawn/mp/protocol';
import { EMOTES, GAME_ID, isMapId, ME, NET, type AvatarPose, type EmoteId, type MapId, type NetStatus, type Peer } from './config';

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

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isFiniteNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Accepts only well-formed town messages; returns a clean copy, or null for anything else. */
export function parseTownMsg(d: unknown): TownMsg | null {
  if (!isObj(d)) return null;
  if (d.k === 'pos') {
    if (!isMapId(d.m)) return null;
    const p = d.p;
    if (!Array.isArray(p) || p.length !== 5) return null;
    if (!p.every(isFiniteNum)) return null;
    const [x, z, facing, moving, busy] = p as [number, number, number, number, number];
    if (Math.abs(x) >= 500 || Math.abs(z) >= 500) return null;
    if (!isFiniteNum(d.t)) return null;
    return { k: 'pos', m: d.m, p: [x, z, facing, moving, busy], t: d.t };
  }
  if (d.k === 'emo') {
    if (typeof d.e !== 'string' || !Object.prototype.hasOwnProperty.call(EMOTES, d.e)) return null;
    return { k: 'emo', e: d.e as EmoteId };
  }
  return null;
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

/** Never calls an ev handler synchronously from inside createNet (main.ts is still assigning the result). */
export function createNet(ev: NetEvents): TownNet {
  let client: NetClient<TownMsg> | null = null;
  let started = false;
  let name = '';
  let character = '';
  let room: string | null = null;
  let myIdVal: number | null = null;
  let myColorVal: number | null = null;
  let status: NetStatus = 'unavailable';
  const peers = new Map<number, Peer>();
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryIdx = 0;
  let badNameRetried = false;

  // Latest pose from the game (setPose), and what was last sent.
  let latestMap: MapId | null = null;
  let latest: AvatarPose | null = null;
  let sent: { m: MapId; x: number; z: number; f: number; mv: number; bz: number } | null = null;
  let lastSentAt = -Infinity;

  const playersInTown = (): number => peers.size + 1;
  const report = (s: NetStatus): void => {
    status = s;
    ev.onStatus(s, playersInTown());
  };

  const online = (): boolean => client !== null && myIdVal !== null;

  const toPeer = (p: PlayerInfo): Peer => ({
    id: p.id,
    name: p.name,
    color: p.color,
    character: p.character,
    ...(p.userId !== undefined ? { userId: p.userId } : {}),
  });

  function sendPose(force: boolean): void {
    if (!client || !latest || latestMap === null || myIdVal === null) return;
    const now = performance.now();
    const x = round2(latest.x);
    const z = round2(latest.z);
    const f = round2(latest.facing);
    const mv = latest.moving ? 1 : 0;
    const bz = latest.busy ? 1 : 0;
    const map = latestMap;
    if (!force) {
      const changed = !sent || sent.m !== map || sent.mv !== mv || sent.bz !== bz
        || Math.abs(x - sent.x) > 0.01 || Math.abs(z - sent.z) > 0.01 || Math.abs(f - sent.f) > 0.02;
      const dueMoving = changed && now - lastSentAt >= 1000 / NET.movingHz;
      const dueIdle = now - lastSentAt >= NET.idleResendMs;
      if (!dueMoving && !dueIdle) return;
    }
    client.send(null, { k: 'pos', m: map, p: [x, z, f, mv, bz], t: now });
    sent = { m: map, x, z, f, mv, bz };
    lastSentAt = now;
  }

  function tick(): void {
    sendPose(false);
  }

  /** The link dropped (or never opened): forget everyone, then retry after a delay. Only one retry is ever pending. */
  function handleDrop(): void {
    if (!started || retryTimer !== null) return;
    myIdVal = null;
    myColorVal = null;
    peers.clear();
    sent = null;
    ev.onReset();
    report('retrying');
    const delay = NET.retryS[Math.min(retryIdx, NET.retryS.length - 1)] ?? 60;
    retryIdx++;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      attempt();
    }, delay * 1000);
  }

  function attempt(): void {
    if (!client) return;
    const c = client;
    report('connecting');
    c.connect()
      .then(() => {
        c.queue(room, character, name);
      })
      .catch(() => handleDrop());
  }

  function onServerMsg(m: ServerMsg<TownMsg>): void {
    switch (m.t) {
      case 'match': {
        myIdVal = m.you;
        const keep = new Set<number>();
        for (const p of m.players) {
          if (p.id === m.you) {
            myColorVal = p.color;
            continue;
          }
          keep.add(p.id);
          peers.set(p.id, toPeer(p));
          ev.onPeerJoin(toPeer(p));
        }
        // Anyone left over from an earlier match is gone.
        for (const id of [...peers.keys()]) {
          if (!keep.has(id)) {
            peers.delete(id);
            ev.onPeerLeave(id);
          }
        }
        retryIdx = 0;
        report('online');
        sendPose(true);
        break;
      }
      case 'joined': {
        if (!online()) break;
        const peer = toPeer(m.player);
        peers.set(peer.id, peer);
        ev.onPeerJoin(peer);
        report('online');
        sendPose(true);
        break;
      }
      case 'left': {
        if (peers.delete(m.id)) {
          ev.onPeerLeave(m.id);
          report(status);
        }
        break;
      }
      case 'relay': {
        const msg = parseTownMsg(m.d);
        if (!msg) break;
        if (msg.k === 'pos') {
          ev.onPeerPose(
            m.from,
            msg.m,
            { x: msg.p[0], z: msg.p[1], facing: msg.p[2], moving: msg.p[3] === 1, busy: msg.p[4] === 1 },
            msg.t,
          );
        } else {
          ev.onEmote(m.from, msg.e);
        }
        break;
      }
      case 'chat':
        ev.onChat(m.from, m.name, m.color, m.text);
        break;
      case 'error': {
        if (m.code === 'chat-rate') {
          ev.onChatRate();
        } else if (m.code === 'bad-name' && !badNameRetried && client) {
          badNameRetried = true;
          name = `Gnome${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
          client.queue(room, character, name);
        }
        break;
      }
      case 'ended': {
        if (client) client.drop(); // its close listener calls handleDrop; the call below is then a no-op
        handleDrop();
        break;
      }
      default:
        break; // welcome, queued, host, beat: nothing to show
    }
  }

  return {
    get myId() { return myIdVal; },
    get myColor() { return myColorVal; },
    start(n, ch, r, offline) {
      name = n;
      character = ch;
      room = r;
      if (started) return;
      started = true;
      steadyInterval(tick, 50);
      if (offline || serverUrl() === '') {
        queueMicrotask(() => ev.onStatus('unavailable', 1));
        return;
      }
      const c = createNetClient<TownMsg>(serverUrl(), GAME_ID, { name, character });
      client = c;
      c.onMessage(onServerMsg);
      c.onClose(handleDrop);
      attempt();
    },
    setPose(map, pose) {
      latestMap = map;
      latest = { x: pose.x, z: pose.z, facing: pose.facing, moving: pose.moving, busy: pose.busy };
    },
    chat(text) {
      if (online() && client) client.chat(text);
      else ev.onChat(ME, name, 0xffffff, text);
    },
    emote(e) {
      if (online() && client) client.send(null, { k: 'emo', e });
      ev.onEmote(ME, e);
    },
  };
}
