// Online free roam over @lawn/mp ('gnome-theft-auto': public town or ?room=CODE). No host: every player relays their
// own gnome and mower, and tells another player when their water hit them. NPCs, traffic and the Hat Watch stay local.
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import { steadyInterval } from '@lawn/mp/background';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import { GAME_ID } from './config';
import type { VehicleKind } from './types';

export const VEHICLE_CODES: readonly VehicleKind[] = ['push-bike', 'ride-on', 'zero-turn', 'combine', 'whirligig'];

/** What a player shows to others. veh = index in VEHICLE_CODES, or -1 on foot. */
export interface RemotePose {
  x: number; y: number; z: number; yaw: number;
  veh: number; tint: number;
  moving: boolean; aiming: boolean; soaked: boolean;
}

/** p = [x, y, z, yaw, veh, tint, moving, aiming, soaked]; t = sender's performance.now(). 'hit' = my water hit you. */
export type GtaMsg =
  | { k: 'pos'; p: number[]; t: number }
  | { k: 'hit' };

export type NetStatus = 'unavailable' | 'connecting' | 'online' | 'retrying';

export interface NetEvents {
  onStatus(status: NetStatus, players: number): void;
  onPeerJoin(p: PlayerInfo): void;
  onPeerLeave(id: number): void;
  onPeerPose(id: number, pose: RemotePose, sentAt: number): void;
  /** Someone's water hit me. */
  onHit(from: number): void;
  /** The link dropped: every peer is gone. A reconnect follows by itself. */
  onReset(): void;
}

export interface GtaNet {
  readonly myId: number | null;
  start(name: string, character: string, room: string | null): void;
  /** Call every frame; sends at 12 Hz while something changed, else once a second. */
  setPose(p: RemotePose): void;
  /** Tell player `id` my water hit them (rate-limited per target). */
  hit(id: number): void;
}

const RETRY_S = [3, 6, 12, 30, 60];
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function parseMsg(d: unknown): GtaMsg | null {
  if (typeof d !== 'object' || d === null) return null;
  const o = d as Record<string, unknown>;
  if (o.k === 'hit') return { k: 'hit' };
  if (o.k === 'pos' && Array.isArray(o.p) && o.p.length === 9 && o.p.every(isNum) && isNum(o.t)) {
    const p = o.p as number[];
    if (Math.abs(p[0]) > 500 || Math.abs(p[2]) > 500 || p[1] < -5 || p[1] > 200) return null;
    if (p[4] < -1 || p[4] >= VEHICLE_CODES.length) return null;
    return { k: 'pos', p, t: o.t };
  }
  return null;
}

export function poseFromArray(p: number[]): RemotePose {
  return {
    x: p[0], y: p[1], z: p[2], yaw: p[3], veh: Math.round(p[4]), tint: p[5] >>> 0,
    moving: p[6] === 1, aiming: p[7] === 1, soaked: p[8] === 1,
  };
}

const r2 = (v: number): number => Math.round(v * 100) / 100;

export function createNet(ev: NetEvents): GtaNet {
  let client: NetClient<GtaMsg> | null = null;
  let started = false;
  let name = '';
  let character = '';
  let room: string | null = null;
  let myId: number | null = null;
  const peers = new Set<number>();
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryIdx = 0;
  let latest: number[] | null = null;
  let sent: number[] | null = null;
  let lastSentAt = -Infinity;
  const lastHitAt = new Map<number, number>();

  const report = (s: NetStatus): void => ev.onStatus(s, peers.size + 1);

  function sendPose(force: boolean): void {
    if (!client || !latest || myId === null) return;
    const now = performance.now();
    if (!force) {
      const changed = !sent || latest.some((v, i) => Math.abs(v - (sent as number[])[i]) > (i === 3 ? 0.02 : 0.01));
      if (!(changed && now - lastSentAt >= 1000 / 12) && now - lastSentAt < 1000) return;
    }
    client.send(null, { k: 'pos', p: latest, t: now });
    sent = latest.slice();
    lastSentAt = now;
  }

  function handleDrop(): void {
    if (!started || retryTimer !== null) return;
    myId = null;
    peers.clear();
    sent = null;
    ev.onReset();
    report('retrying');
    const delay = RETRY_S[Math.min(retryIdx, RETRY_S.length - 1)];
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
    c.connect().then(() => c.queue(room, character, name)).catch(() => handleDrop());
  }

  function onMsg(m: ServerMsg<GtaMsg>): void {
    switch (m.t) {
      case 'match': {
        myId = m.you;
        for (const id of [...peers]) ev.onPeerLeave(id);
        peers.clear();
        for (const p of m.players) {
          if (p.id === m.you) continue;
          peers.add(p.id);
          ev.onPeerJoin(p);
        }
        retryIdx = 0;
        report('online');
        sendPose(true);
        break;
      }
      case 'joined':
        if (myId === null) break;
        peers.add(m.player.id);
        ev.onPeerJoin(m.player);
        report('online');
        sendPose(true);
        break;
      case 'left':
        if (peers.delete(m.id)) {
          ev.onPeerLeave(m.id);
          report('online');
        }
        break;
      case 'relay': {
        const msg = parseMsg(m.d);
        if (!msg || !peers.has(m.from)) break;
        if (msg.k === 'pos') ev.onPeerPose(m.from, poseFromArray(msg.p), msg.t);
        else ev.onHit(m.from);
        break;
      }
      case 'error':
        if (m.code === 'bad-name' && client) {
          name = `Gnome${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
          client.queue(room, character, name);
        }
        break;
      case 'ended':
        if (client) client.drop();
        handleDrop();
        break;
      default:
        break;
    }
  }

  return {
    get myId() { return myId; },
    start(n, ch, r) {
      name = n;
      character = ch;
      room = r;
      if (started) return;
      started = true;
      if (serverUrl() === '') {
        queueMicrotask(() => ev.onStatus('unavailable', 1));
        return;
      }
      steadyInterval(() => sendPose(false), 50);
      const c = createNetClient<GtaMsg>(serverUrl(), GAME_ID, { name, character });
      client = c;
      c.onMessage(onMsg);
      c.onClose(handleDrop);
      attempt();
    },
    setPose(p) {
      latest = [r2(p.x), r2(p.y), r2(p.z), r2(p.yaw), p.veh, p.tint, p.moving ? 1 : 0, p.aiming ? 1 : 0, p.soaked ? 1 : 0];
    },
    hit(id) {
      if (!client || myId === null || !peers.has(id)) return;
      const now = performance.now();
      if (now - (lastHitAt.get(id) ?? -Infinity) < 100) return;
      lastHitAt.set(id, now);
      client.send(id, { k: 'hit' });
    },
  };
}
