// Online free roam over @lawn/mp ('gnome-theft-auto': public town or ?room=CODE). No host: every player relays their
// own gnome and mower, and tells another player when their water hit them. NPCs, traffic and the Hat Watch stay local.
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import { steadyInterval } from '@lawn/mp/background';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import { GAME_ID } from './config';
import type { StationId } from './radio/content';
import type { VehicleKind } from './types';

/** Append only: a station's index is its code on the wire, so existing indices must never move. */
export const STATION_CODES: readonly StationId[] = ['blade', 'fpr', 'beats', 'under'];

/** Append only: a vehicle's index is its code on the wire, so existing indices must never move. */
export const VEHICLE_CODES: readonly VehicleKind[] = [
  'push-bike', 'ride-on', 'zero-turn', 'combine', 'whirligig', 'plane',
  'lowrider', 'boot-float', 'snail-coach', 'mulch-spreader', 'hoa-van',
  'walnut-dinghy', 'gravy-boat', 'clog-cruiser', 'watering-can-steamer', 'hoa-patrol-boat',
  'tessie', 'taxi',
];

/** A passenger's seat in someone else's vehicle: the driver's player id and the seat (1.. , see seats.ts). */
export interface Ride { host: number; seat: number }

/** What a player shows to others. veh = index in VEHICLE_CODES, or -1 on foot. chute = hanging under an open parachute. ride = riding as a passenger. */
export interface RemotePose {
  x: number; y: number; z: number; yaw: number;
  veh: number; tint: number;
  moving: boolean; aiming: boolean; hurt: boolean; chute: boolean;
  ride: Ride | null;
}

/**
 * p = [x, y, z, yaw, veh, tint, moving, aiming, hurt, chute, host, seat] (9 or 10 elements from older clients: no ride;
 * chute then reads as false); host = -1 when not riding. t = sender's performance.now().
 * 'pos' = my pose. 'hit' = my water hit you. 'board' = may I ride with you? 'seat' = yes, seat s (-1: no room);
 * 'leave' = I am getting out of your vehicle.
 */
export type GtaMsg =
  | { k: 'pos'; p: number[]; t: number }
  | { k: 'hit' }
  | { k: 'board' }
  | { k: 'seat'; s: number }
  | { k: 'leave' }
  | { k: 'radio'; st: number }
  | { k: 'look'; c: string }
  | { k: 'banger'; st: number; song: number };

export type NetStatus = 'unavailable' | 'connecting' | 'online' | 'retrying';

export interface NetEvents {
  onStatus(status: NetStatus, players: number): void;
  onPeerJoin(p: PlayerInfo): void;
  onPeerLeave(id: number): void;
  onPeerPose(id: number, pose: RemotePose, sentAt: number): void;
  /** Someone's water hit me. */
  onHit(from: number): void;
  /** Someone asks to ride with me. Return the seat to give them (1..), or -1 when I am not driving or it is full. */
  onBoard(from: number): number;
  /** A rider I asked answered (seat -1: no room, or no answer in time). */
  onSeat(host: number, seat: number): void;
  /** A passenger got out of my vehicle. */
  onLeave(from: number): void;
  /** Another player changed their vehicle's radio station (or turned it off). */
  onPeerRadio?(id: number, station: StationId | null): void;
  /** Another player changed what their vehicle wears at Pay 'n' Glaze: a @lawn/glaze loadout code (null: stock). */
  onPeerLook?(id: number, code: string | null): void;
  /** Another player shouted out a banger on the radio. */
  onPeerBanger?(id: number, station: StationId, songIndex: number): void;
  /** The link dropped: every peer is gone. A reconnect follows by itself. */
  onReset(): void;
}

export interface GtaNet {
  readonly myId: number | null;
  start(name: string, character: string, room: string | null): void;
  /** Call every frame; sends at 12 Hz while something changed, else once a second. */
  setPose(p: RemotePose): void;
  /** Broadcast my vehicle's tuned station (or null for off). */
  setRadio(station: StationId | null): void;
  /** Broadcast what my vehicle wears (an encodeLoadout code), or null for stock. Resent to each player who joins. */
  setLook(code: string | null): void;
  /** Shout out the current banger to all peers (rate-limited to once per 5 s). */
  sendBanger(station: StationId, songIndex: number): boolean;
  /** Tell player `id` my water hit them (rate-limited per target). */
  hit(id: number): void;
  /** Ask player `host` for a seat in their vehicle. Answered by onSeat. */
  requestSeat(host: number): void;
  /** Tell player `host` I am getting out of their vehicle. */
  leaveSeat(host: number): void;
  /** Answer a rider's request: seat s (1..), or -1 for no room. */
  answerBoard(to: number, s: number): void;
}

const RETRY_S = [3, 6, 12, 30, 60];
/** How long a seat request waits for the driver before it counts as refused. */
const BOARD_TIMEOUT_MS = 5000;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Highest passenger seat index a message may carry (the biggest vehicle has 4 passenger seats). */
const MAX_SEAT = 7;

export function parseMsg(d: unknown): GtaMsg | null {
  if (typeof d !== 'object' || d === null) return null;
  const o = d as Record<string, unknown>;
  if (o.k === 'hit') return { k: 'hit' };
  if (o.k === 'board') return { k: 'board' };
  if (o.k === 'leave') return { k: 'leave' };
  if (o.k === 'seat' && isNum(o.s) && Number.isInteger(o.s) && o.s >= -1 && o.s <= MAX_SEAT) return { k: 'seat', s: o.s };
  if (o.k === 'radio' && isNum(o.st) && Number.isInteger(o.st) && o.st >= -1 && o.st < STATION_CODES.length) {
    return { k: 'radio', st: o.st };
  }
  if (o.k === 'look' && typeof o.c === 'string' && o.c.length <= 120 && /^[A-Za-z0-9._-]*$/.test(o.c)) {
    return { k: 'look', c: o.c };
  }
  if (
    o.k === 'banger' &&
    isNum(o.st) && Number.isInteger(o.st) && o.st >= 0 && o.st < STATION_CODES.length &&
    isNum(o.song) && Number.isInteger(o.song) && o.song >= 0 && o.song < 32
  ) {
    return { k: 'banger', st: o.st, song: o.song };
  }
  if (o.k === 'pos' && Array.isArray(o.p) && (o.p.length === 9 || o.p.length === 10 || o.p.length === 12) && o.p.every(isNum) && isNum(o.t)) {
    const p = o.p as number[];
    // The world is 1200 units square and planes fly high, so the bounds are wider than the city.
    if (Math.abs(p[0]) > 700 || Math.abs(p[2]) > 700 || p[1] < -5 || p[1] > 400) return null;
    if (p[4] < -1 || p[4] >= VEHICLE_CODES.length) return null;
    if (p.length === 12 && (p[10] < -1 || p[11] < 0 || p[11] > MAX_SEAT || p[11] % 1 !== 0 || p[10] % 1 !== 0)) return null;
    return { k: 'pos', p, t: o.t };
  }
  return null;
}

export function poseFromArray(p: number[]): RemotePose {
  const riding = p.length === 12 && p[10] >= 0;
  return {
    x: p[0], y: p[1], z: p[2], yaw: p[3], veh: Math.round(p[4]), tint: p[5] >>> 0,
    moving: p[6] === 1, aiming: p[7] === 1, hurt: p[8] === 1, chute: p[9] === 1,
    ride: riding ? { host: p[10], seat: p[11] } : null,
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
  let myRadio: number = -1;
  let myLook: string | null = null;
  let lastBangerAt = -Infinity;
  const lastHitAt = new Map<number, number>();
  /** Seat requests I sent that the driver has not answered yet, by driver id. */
  const pendingBoard = new Map<number, ReturnType<typeof setTimeout>>();

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

  function answer(to: number, s: number): void {
    client?.send(to, { k: 'seat', s });
  }

  function handleDrop(): void {
    if (!started || retryTimer !== null) return;
    myId = null;
    peers.clear();
    sent = null;
    for (const t of pendingBoard.values()) clearTimeout(t);
    pendingBoard.clear();
    ev.onReset();
    report('retrying');
    const delay = RETRY_S[Math.min(retryIdx, RETRY_S.length - 1)];
    retryIdx++;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      attempt();
      // Coming back to the tab (or the phone app): reconnect now instead of waiting out the retry delay.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible' || retryTimer === null) return;
        clearTimeout(retryTimer);
        retryTimer = null;
        retryIdx = 0;
        attempt();
      });
    }, delay * 1000);
  }

  function attempt(): void {
    if (!client) return;
    const c = client;
    report('connecting');
    // resumable: after a drop (a phone app switch), connect() gets my old seat back if it is still held; then the
    // welcome carries the roster and there is nothing to queue for.
    c.connect().then((resumed) => { if (!resumed) c.queue(room, character, name); }).catch(() => handleDrop());
  }

  function enterTown(you: number, players: PlayerInfo[]): void {
    myId = you;
    for (const id of [...peers]) ev.onPeerLeave(id);
    peers.clear();
    for (const p of players) {
      if (p.id === you) continue;
      peers.add(p.id);
      ev.onPeerJoin(p);
    }
    retryIdx = 0;
    report('online');
    sendPose(true);
    if (client && myRadio >= 0) client.send(null, { k: 'radio', st: myRadio });
    if (client && myLook !== null) client.send(null, { k: 'look', c: myLook });
  }

  function onMsg(m: ServerMsg<GtaMsg>): void {
    switch (m.t) {
      case 'welcome':
        if (m.resumed) enterTown(m.id, m.resumed.players);
        break;
      case 'match':
        enterTown(m.you, m.players);
        break;
      case 'joined':
        if (myId === null) break;
        peers.add(m.player.id);
        ev.onPeerJoin(m.player);
        report('online');
        sendPose(true);
        if (client && myRadio >= 0) client.send(m.player.id, { k: 'radio', st: myRadio });
        if (client && myLook !== null) client.send(m.player.id, { k: 'look', c: myLook });
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
        else if (msg.k === 'hit') ev.onHit(m.from);
        else if (msg.k === 'board') {
          // Only a driver answers; the reply is the seat (or -1 for none), and the rider's pose then shows it to everyone.
          if (myId !== null) answer(m.from, ev.onBoard(m.from));
        } else if (msg.k === 'seat') {
          const t = pendingBoard.get(m.from);
          if (t === undefined) break;
          clearTimeout(t);
          pendingBoard.delete(m.from);
          ev.onSeat(m.from, msg.s);
        } else if (msg.k === 'leave') ev.onLeave(m.from);
        else if (msg.k === 'radio') ev.onPeerRadio?.(m.from, msg.st >= 0 ? (STATION_CODES[msg.st] ?? null) : null);
        else if (msg.k === 'look') ev.onPeerLook?.(m.from, msg.c === '' ? null : msg.c);
        else if (msg.k === 'banger') {
          const st = STATION_CODES[msg.st];
          if (st) ev.onPeerBanger?.(m.from, st, msg.song);
        }
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
      const c = createNetClient<GtaMsg>(serverUrl(), GAME_ID, { name, character, resumable: true });
      client = c;
      c.onMessage(onMsg);
      c.onClose(handleDrop);
      attempt();
    },
    setPose(p) {
      // A change of chute is a 0/1 change in the array, so sendPose sends it at once like any other change.
      latest = [
        r2(p.x), r2(p.y), r2(p.z), r2(p.yaw), p.veh, p.tint,
        p.moving ? 1 : 0, p.aiming ? 1 : 0, p.hurt ? 1 : 0, p.chute ? 1 : 0,
        p.ride ? p.ride.host : -1, p.ride ? p.ride.seat : 0,
      ];
    },
    setLook(code) {
      if (code === myLook) return;
      myLook = code;
      if (client && myId !== null) client.send(null, { k: 'look', c: code ?? '' });
    },
    setRadio(station) {
      const code = station ? STATION_CODES.indexOf(station) : -1;
      if (code === myRadio) return;
      myRadio = code;
      if (client && myId !== null) client.send(null, { k: 'radio', st: code });
    },
    sendBanger(station, songIndex) {
      const now = performance.now();
      if (now - lastBangerAt < 5000) return false;
      const code = STATION_CODES.indexOf(station);
      if (code < 0) return false;
      lastBangerAt = now;
      if (client && myId !== null) client.send(null, { k: 'banger', st: code, song: songIndex });
      return true;
    },
    hit(id) {
      if (!client || myId === null || !peers.has(id)) return;
      const now = performance.now();
      if (now - (lastHitAt.get(id) ?? -Infinity) < 100) return;
      lastHitAt.set(id, now);
      client.send(id, { k: 'hit' });
    },
    requestSeat(host) {
      if (!client || myId === null || !peers.has(host)) {
        queueMicrotask(() => ev.onSeat(host, -1));
        return;
      }
      if (pendingBoard.has(host)) return; // already asked: the answer is on its way
      client.send(host, { k: 'board' });
      pendingBoard.set(host, setTimeout(() => {
        pendingBoard.delete(host);
        ev.onSeat(host, -1);
      }, BOARD_TIMEOUT_MS));
    },
    leaveSeat(host) {
      if (client && myId !== null && peers.has(host)) client.send(host, { k: 'leave' });
    },
    answerBoard(to, s) {
      answer(to, s);
    },
  };
}
