import { prefetchLooks } from '@lawn/gnome';
import { steadyInterval } from '@lawn/mp/background';
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import type { ServerMsg } from '@lawn/mp/protocol';
import type { GsrLevelId } from '../levels/loader';
import type { SkaterState, TrickAnimKind } from '../sim/skater';
import { parseGsrNetMsg, toGsrPeer, type GsrNetMsg, type GsrPeer } from './protocol';

export type GsrNetStatus = 'unavailable' | 'connecting' | 'online' | 'retrying';

export interface GsrNetEvents {
  onStatus(status: GsrNetStatus, playerCount: number, roomCode: string | null): void;
  onPeerJoin(peer: GsrPeer): void;
  onPeerLeave(id: number): void;
  onPeerPose(
    id: number,
    area: GsrLevelId,
    p: [number, number, number, number, number, number, number, number],
    sentAt: number,
  ): void;
  onPeerTrick(id: number, area: GsrLevelId, kind: TrickAnimKind, name: string): void;
  onPeerSpray(id: number, area: GsrLevelId, x: number, y: number, z: number, tagId: string, bbId?: string): void;
  onReset(): void;
}

export interface GsrNet {
  readonly myId: number | null;
  readonly status: GsrNetStatus;
  readonly roomCode: string | null;
  readonly playerCount: number;
  start(name: string, character: string, room: string | null, offline?: boolean): void;
  switchRoom(room: string | null): void;
  setPose(area: GsrLevelId, s: SkaterState): void;
  sendTrick(area: GsrLevelId, kind: TrickAnimKind, name: string): void;
  sendSpray(area: GsrLevelId, x: number, y: number, z: number, tagId: string, bbId?: string): void;
  dispose(): void;
}

const SEND_HZ = 15;
const IDLE_RESEND_MS = 1000;
const RETRY_S = [2, 5, 10, 20, 30];
const round2 = (v: number): number => Math.round(v * 100) / 100;

export function createGsrNet(ev: GsrNetEvents): GsrNet {
  let client: NetClient<GsrNetMsg> | null = null;
  let started = false;
  let disposed = false;
  let name = 'Runner';
  let character = 'gnorman';
  let room: string | null = null;
  let myIdVal: number | null = null;
  let status: GsrNetStatus = 'unavailable';
  const peers = new Map<number, GsrPeer>();
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryIdx = 0;
  let badNameRetried = false;
  let stopInterval: (() => void) | null = null;

  let latestArea: GsrLevelId | null = null;
  let latestPose: [number, number, number, number, number, number, number, number] | null = null;
  let lastSentPose: [number, number, number, number, number, number, number, number] | null = null;
  let lastSentArea: GsrLevelId | null = null;
  let lastSentAt = -Infinity;

  const online = (): boolean => client !== null && myIdVal !== null;
  const playerCount = (): number => peers.size + 1;
  const report = (next: GsrNetStatus): void => {
    status = next;
    ev.onStatus(next, playerCount(), room);
  };

  function sendPose(force: boolean): void {
    if (!client || myIdVal === null || latestArea === null || !latestPose) return;
    const now = performance.now();
    if (!force && lastSentPose && lastSentArea === latestArea) {
      const changed =
        Math.abs(latestPose[0] - lastSentPose[0]) > 0.02 ||
        Math.abs(latestPose[1] - lastSentPose[1]) > 0.02 ||
        Math.abs(latestPose[2] - lastSentPose[2]) > 0.02 ||
        Math.abs(latestPose[3] - lastSentPose[3]) > 0.03 ||
        latestPose[7] !== lastSentPose[7];
      const dueMoving = changed && now - lastSentAt >= 1000 / SEND_HZ;
      const dueIdle = now - lastSentAt >= IDLE_RESEND_MS;
      if (!dueMoving && !dueIdle) return;
    }
    client.send(null, { k: 'pos', area: latestArea, p: latestPose, t: now });
    lastSentArea = latestArea;
    lastSentPose = latestPose.slice() as [number, number, number, number, number, number, number, number];
    lastSentAt = now;
  }

  function handleDrop(): void {
    if (!started || disposed || retryTimer !== null) return;
    myIdVal = null;
    peers.clear();
    lastSentPose = null;
    ev.onReset();
    report('retrying');
    const delay = RETRY_S[Math.min(retryIdx, RETRY_S.length - 1)] ?? 30;
    retryIdx++;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      attempt();
    }, delay * 1000);
  }

  function attempt(): void {
    if (!client || disposed) return;
    const c = client;
    report('connecting');
    c.connect()
      .then(() => {
        c.queue(room, character, name);
      })
      .catch(() => handleDrop());
  }

  function onServerMsg(m: ServerMsg<GsrNetMsg>): void {
    switch (m.t) {
      case 'match': {
        myIdVal = m.you;
        void prefetchLooks(m.players);
        const keep = new Set<number>();
        for (const p of m.players) {
          if (p.id === m.you) continue;
          keep.add(p.id);
          const peer = toGsrPeer(p);
          peers.set(p.id, peer);
          ev.onPeerJoin(peer);
        }
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
        void prefetchLooks([m.player]);
        const peer = toGsrPeer(m.player);
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
        const msg = parseGsrNetMsg(m.d);
        if (!msg) break;
        if (msg.k === 'pos') {
          ev.onPeerPose(m.from, msg.area, msg.p, msg.t);
        } else if (msg.k === 'trick') {
          ev.onPeerTrick(m.from, msg.area, msg.kind, msg.name);
        } else if (msg.k === 'spray') {
          ev.onPeerSpray(m.from, msg.area, msg.x, msg.y, msg.z, msg.tagId, msg.bbId);
        }
        break;
      }
      case 'error': {
        if (m.code === 'bad-name' && !badNameRetried && client) {
          badNameRetried = true;
          name = `Skater${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
          client.queue(room, character, name);
        }
        break;
      }
      case 'ended': {
        if (client) client.drop();
        handleDrop();
        break;
      }
      default:
        break;
    }
  }

  return {
    get myId() {
      return myIdVal;
    },
    get status() {
      return status;
    },
    get roomCode() {
      return room;
    },
    get playerCount() {
      return playerCount();
    },
    start(n, ch, r, offline) {
      name = n;
      character = ch;
      room = r;
      if (started || disposed) return;
      started = true;
      stopInterval = steadyInterval(() => sendPose(false), 50);
      if (offline || serverUrl() === '') {
        queueMicrotask(() => report('unavailable'));
        return;
      }
      const c = createNetClient<GsrNetMsg>(serverUrl(), 'gnome-set-radio', {
        name,
        character,
        resumable: true,
      });
      client = c;
      c.onMessage(onServerMsg);
      c.onClose(handleDrop);
      attempt();
    },
    switchRoom(nextRoom) {
      room = nextRoom;
      if (retryTimer !== null) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      retryIdx = 0;
      myIdVal = null;
      peers.clear();
      lastSentPose = null;
      ev.onReset();
      if (!client) {
        if (serverUrl() === '') {
          report('unavailable');
          return;
        }
        const c = createNetClient<GsrNetMsg>(serverUrl(), 'gnome-set-radio', {
          name,
          character,
          resumable: true,
        });
        client = c;
        c.onMessage(onServerMsg);
        c.onClose(handleDrop);
      } else {
        client.drop();
      }
      attempt();
    },
    setPose(area, s) {
      latestArea = area;
      const flags =
        (s.grounded ? 1 : 0) |
        (s.grinding ? 2 : 0) |
        (s.boosting ? 4 : 0) |
        (s.wallRiding ? 8 : 0);
      latestPose = [
        round2(s.x),
        round2(s.y),
        round2(s.z),
        round2(s.yaw),
        round2(s.vx),
        round2(s.vy),
        round2(s.vz),
        flags,
      ];
    },
    sendTrick(area, kind, trickName) {
      if (online() && client) {
        client.send(null, { k: 'trick', area, kind, name: trickName.slice(0, 48) });
      }
    },
    sendSpray(area, x, y, z, tagId, bbId) {
      if (online() && client) {
        client.send(null, {
          k: 'spray',
          area,
          x: round2(x),
          y: round2(y),
          z: round2(z),
          tagId,
          ...(bbId ? { bbId } : {}),
        });
      }
    },
    dispose() {
      disposed = true;
      if (retryTimer !== null) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      stopInterval?.();
      stopInterval = null;
      client?.drop();
      client = null;
      peers.clear();
    },
  };
}
