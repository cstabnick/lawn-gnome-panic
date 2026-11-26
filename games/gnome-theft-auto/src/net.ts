// Online free roam over @lawn/mp ('gnome-theft-auto': public town or ?room=CODE). Every player relays their own gnome and
// mower, and tells another player when their water hit them. The shared world (street events, flocks, sky traffic,
// hunting quarry, the Sling-Lift, emotes and activities) goes over the 'w' message to online/hub.ts, which uses the
// server's host (hostId) to rank players (docs/roadmaps/gta-online-sync.md). NPCs, traffic and the Hat Watch stay local.
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import { steadyInterval } from '@lawn/mp/background';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import { GAME_ID, WORLD_HALF } from './config';
import { parseWireMsg, type WireMsg } from './online/protocol';
import { parsePartyMsg, type PartyMsg } from './party/protocol';
import type { StationId } from './radio/content';
import type { VehicleKind } from './types';

/** Append only: a station's index is its code on the wire, so existing indices must never move. */
export const STATION_CODES: readonly StationId[] = ['blade', 'fpr', 'beats', 'under', 'adagio'];

/** Append only: a vehicle's index is its code on the wire, so existing indices must never move. */
export const VEHICLE_CODES: readonly VehicleKind[] = [
  'push-bike', 'ride-on', 'zero-turn', 'combine', 'whirligig', 'plane',
  'lowrider', 'boot-float', 'snail-coach', 'mulch-spreader', 'hoa-van',
  'walnut-dinghy', 'gravy-boat', 'clog-cruiser', 'watering-can-steamer', 'hoa-patrol-boat',
  'tessie', 'taxi',
  'pot-rod', 'lawn-roller', 'teacup-trundler', 'barrow-buggy',
  'golf-cart',
  'hedge-hopper', 'sycamore-copter', 'dandelion-drifter',
  'tow-tube',
  'euro-hatch', 'deux-pots', 'wespa', 'baguette-trike', 'crepe-van',
  'tow-ski', 'spoke-gondola',
  'tea-tray-sled', 'snow-skis', 'skateboard',
  'dirt-bike',
  'ranger-buggy', 'shell-camper', 'cone-van',
  'bin-lorry', 'fire-engine',
  'bubble-mobile',
];

/** A passenger's seat in someone else's vehicle: the driver's player id and the seat (1.. , see seats.ts). */
export interface Ride { host: number; seat: number }

/** What a player shows to others. veh = index in VEHICLE_CODES, or -1 on foot. chute = hanging under an open parachute. ride = riding as a passenger. */
export interface RemotePose {
  x: number; y: number; z: number; yaw: number;
  veh: number; tint: number;
  moving: boolean; aiming: boolean; hurt: boolean; chute: boolean;
  ride: Ride | null;
  /** Aim pitch in radians, + = up (0 = level; also what a pose from an older client without one reads as). */
  pitch: number;
  /** An aircraft's attitude while flying it (craft/model.ts AirState pitch and roll, radians), else absent. */
  tilt?: { pitch: number; roll: number };
}

/** Widest aircraft pitch / roll the wire carries, radians (one signed byte each). */
export const TILT_MAX = 1.6;
/**
 * Positions farther from the centre than this on either axis are not believed: the map's half size plus 50 (2800 square
 * since batch 3, so 1450). Off-map rooms (sites.ts OFF_MAP, interiors at x >= 5000) are outside it on purpose.
 */
export const POS_BOUND = WORLD_HALF + 50;
const tiltByte = (v: number): number => Math.round((Math.max(-TILT_MAX, Math.min(TILT_MAX, Number.isFinite(v) ? v : 0)) / TILT_MAX) * 127);

/** Widest aim pitch the wire carries, radians (gunHold.ts clamps the pose to the same). */
export const PITCH_MAX = 1.2;
/** One signed byte for the aim pitch: -127..127 over -PITCH_MAX..PITCH_MAX (about 0.5 degrees a step). */
export function encodePitch(pitch: number): number {
  const v = Number.isFinite(pitch) ? pitch : 0;
  return Math.round((Math.max(-PITCH_MAX, Math.min(PITCH_MAX, v)) / PITCH_MAX) * 127);
}
export function decodePitch(a: number | undefined): number {
  return a === undefined ? 0 : (a / 127) * PITCH_MAX;
}

/**
 * r = [pitch, roll] of the aircraft I fly as signed bytes over TILT_MAX (absent on foot and in ground vehicles).
 * a = aim pitch as encodePitch's signed byte, only while aiming; a field of its own rather than a 13th array element, so
 * older clients (which reject any other array length) still read the pose and just ignore it. Missing: level.
 * p = [x, y, z, yaw, veh, tint, moving, aiming, hurt, chute, host, seat] (9 or 10 elements from older clients: no ride;
 * chute then reads as false); host = -1 when not riding. t = sender's performance.now().
 * 'pos' = my pose. 'hit' = my water hit you. 'board' = may I ride with you? 'seat' = yes, seat s (-1: no room);
 * 'leave' = I am getting out of your vehicle.
 */
export type GtaMsg =
  | { k: 'pos'; p: number[]; t: number; a?: number; r?: number[] }
  | { k: 'hit' }
  | { k: 'board' }
  | { k: 'seat'; s: number }
  | { k: 'leave' }
  | { k: 'radio'; st: number }
  | { k: 'look'; c: string }
  | { k: 'gun'; c: string }
  | { k: 'banger'; st: number; song: number }
  /** Parties (party/protocol.ts). */
  | { k: 'pty'; d: PartyMsg }
  /** The shared world (online/protocol.ts). */
  | { k: 'w'; d: WireMsg };

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
  /** Another player changed the gun they hold or its mods: an encodeGunWire code (null: unknown, show the stock pistol). */
  onPeerGun?(id: number, code: string | null): void;
  /** Another player shouted out a banger on the radio. */
  onPeerBanger?(id: number, station: StationId, songIndex: number): void;
  /** A party message from another player (party/protocol.ts). */
  onParty?(from: number, d: PartyMsg): void;
  /** A world-sync message from another player (online/protocol.ts). */
  onWire?(from: number, d: WireMsg): void;
  /** The match host is now `hostId` (on joining, and when the host leaves). */
  onHost?(hostId: number): void;
  /** The link dropped: every peer is gone. A reconnect follows by itself. */
  onReset(): void;
}

export interface GtaNet {
  readonly myId: number | null;
  /** The match host (the server's pick; it moves on when the host leaves), or null offline. */
  readonly hostId: number | null;
  start(name: string, character: string, room: string | null): void;
  /** Call every frame; sends at 12 Hz while something changed, else once a second. */
  setPose(p: RemotePose): void;
  /** Broadcast my vehicle's tuned station (or null for off). */
  setRadio(station: StationId | null): void;
  /** Broadcast what my vehicle wears (an encodeLoadout code), or null for stock. Resent to each player who joins. */
  setLook(code: string | null): void;
  /** Broadcast the gun I hold with its mods (an encodeGunWire code). Resent to each player who joins. */
  setGun(code: string | null): void;
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
  /** Send a party message to one player, or to everyone (null). Dropped while offline. */
  sendParty(to: number | null, d: PartyMsg): void;
  /** Send a world-sync message to one player, or to everyone (null). Dropped while offline. */
  sendWire(to: number | null, d: WireMsg): void;
}

const RETRY_S = [3, 6, 12, 30, 60];
/** How long a seat request waits for the driver before it counts as refused. */
const BOARD_TIMEOUT_MS = 5000;
/** Fewest ms between two accepted water hits from the same player. */
const HIT_IN_MS = 80;
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
  if (o.k === 'gun' && typeof o.c === 'string' && /^\d{1,2}-[a-z0-9]{0,32}$/.test(o.c)) {
    return { k: 'gun', c: o.c };
  }
  if (
    o.k === 'banger' &&
    isNum(o.st) && Number.isInteger(o.st) && o.st >= 0 && o.st < STATION_CODES.length &&
    isNum(o.song) && Number.isInteger(o.song) && o.song >= 0 && o.song < 32
  ) {
    return { k: 'banger', st: o.st, song: o.song };
  }
  if (o.k === 'pty') {
    const d = parsePartyMsg(o.d);
    return d ? { k: 'pty', d } : null;
  }
  if (o.k === 'w') {
    const d = parseWireMsg(o.d);
    return d ? { k: 'w', d } : null;
  }
  if (o.k === 'pos' && Array.isArray(o.p) && (o.p.length === 9 || o.p.length === 10 || o.p.length === 12) && o.p.every(isNum) && isNum(o.t)) {
    const p = o.p as number[];
    // POS_BOUND is the map plus a margin (planes fly high, so the height bound is generous).
    if (Math.abs(p[0]) > POS_BOUND || Math.abs(p[2]) > POS_BOUND || p[1] < -5 || p[1] > 400) return null;
    // A vehicle code this client does not know (a newer client's kind; codes are append-only) shows the player on foot
    // instead of dropping the whole pose.
    if (!Number.isInteger(p[4]) || p[4] < -1 || p[4] >= VEHICLE_CODES.length) p[4] = -1;
    if (p.length === 12 && (p[10] < -1 || p[11] < 0 || p[11] > MAX_SEAT || p[11] % 1 !== 0 || p[10] % 1 !== 0)) return null;
    // A bad pitch is dropped (read as level), not the whole pose.
    const a = isNum(o.a) && Number.isInteger(o.a) && Math.abs(o.a) <= 127 ? o.a : undefined;
    // A bad aircraft attitude is dropped (read as level), like the pitch.
    const r = Array.isArray(o.r) && o.r.length === 2 && o.r.every((v) => isNum(v) && Number.isInteger(v) && Math.abs(v) <= 127)
      ? (o.r as number[]) : undefined;
    const msg: { k: 'pos'; p: number[]; t: number; a?: number; r?: number[] } = { k: 'pos', p, t: o.t };
    if (a !== undefined) msg.a = a;
    if (r !== undefined) msg.r = r;
    return msg;
  }
  return null;
}

export function poseFromArray(p: number[], a?: number, r?: number[]): RemotePose {
  const riding = p.length === 12 && p[10] >= 0;
  const pose: RemotePose = {
    x: p[0], y: p[1], z: p[2], yaw: p[3], veh: Math.round(p[4]), tint: p[5] >>> 0,
    moving: p[6] === 1, aiming: p[7] === 1, hurt: p[8] === 1, chute: p[9] === 1,
    ride: riding ? { host: p[10], seat: p[11] } : null,
    pitch: decodePitch(a),
  };
  if (r) pose.tilt = { pitch: (r[0] / 127) * TILT_MAX, roll: (r[1] / 127) * TILT_MAX };
  return pose;
}

const r2 = (v: number): number => Math.round(v * 100) / 100;

/** A pose as the 'pos' message carries it: the array, plus the pitch byte while aiming and the aircraft attitude while
 *  flying (poseFromArray reads them back). */
export function encodePose(p: RemotePose): { p: number[]; a?: number; r?: number[] } {
  const arr = [
    r2(p.x), r2(p.y), r2(p.z), r2(p.yaw), p.veh, p.tint,
    p.moving ? 1 : 0, p.aiming ? 1 : 0, p.hurt ? 1 : 0, p.chute ? 1 : 0,
    p.ride ? p.ride.host : -1, p.ride ? p.ride.seat : 0,
  ];
  const out: { p: number[]; a?: number; r?: number[] } = { p: arr };
  if (p.aiming) out.a = encodePitch(p.pitch);
  if (p.tilt) out.r = [tiltByte(p.tilt.pitch), tiltByte(p.tilt.roll)];
  return out;
}

export function createNet(ev: NetEvents): GtaNet {
  let client: NetClient<GtaMsg> | null = null;
  let started = false;
  let name = '';
  let character = '';
  let room: string | null = null;
  let myId: number | null = null;
  let hostId: number | null = null;
  const peers = new Set<number>();
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryIdx = 0;
  let latest: number[] | null = null;
  let sent: number[] | null = null;
  /** My aim pitch byte (encodePitch) while aiming, else undefined; and the one last sent. */
  let latestPitch: number | undefined;
  let sentPitch: number | undefined;
  /** My aircraft attitude bytes while flying, else undefined; and the ones last sent. */
  let latestTilt: number[] | undefined;
  let sentTilt: number[] | undefined;
  let lastSentAt = -Infinity;
  let myRadio: number = -1;
  let myLook: string | null = null;
  let myGun: string | null = null;
  let lastBangerAt = -Infinity;
  const lastHitAt = new Map<number, number>();
  /** When each peer's last water hit on me was accepted (inbound limit). */
  const lastHitFrom = new Map<number, number>();
  /** Seat requests I sent that the driver has not answered yet, by driver id. */
  const pendingBoard = new Map<number, ReturnType<typeof setTimeout>>();

  const report = (s: NetStatus): void => ev.onStatus(s, peers.size + 1);

  function sendPose(force: boolean): void {
    if (!client || !latest || myId === null) return;
    const now = performance.now();
    if (!force) {
      const changed = !sent || latest.some((v, i) => Math.abs(v - (sent as number[])[i]) > (i === 3 ? 0.02 : 0.01))
        || (latestPitch === undefined) !== (sentPitch === undefined)
        || (latestPitch !== undefined && sentPitch !== undefined && Math.abs(latestPitch - sentPitch) >= 2)
        || (latestTilt === undefined) !== (sentTilt === undefined)
        || (latestTilt !== undefined && sentTilt !== undefined
          && (Math.abs(latestTilt[0] - sentTilt[0]) >= 2 || Math.abs(latestTilt[1] - sentTilt[1]) >= 2));
      if (!(changed && now - lastSentAt >= 1000 / 12) && now - lastSentAt < 1000) return;
    }
    const msg: { k: 'pos'; p: number[]; t: number; a?: number; r?: number[] } = { k: 'pos', p: latest, t: now };
    if (latestPitch !== undefined) msg.a = latestPitch;
    if (latestTilt !== undefined) msg.r = latestTilt;
    client.send(null, msg);
    sent = latest.slice();
    sentPitch = latestPitch;
    sentTilt = latestTilt;
    lastSentAt = now;
  }

  function answer(to: number, s: number): void {
    client?.send(to, { k: 'seat', s });
  }

  function handleDrop(): void {
    if (!started || retryTimer !== null) return;
    myId = null;
    hostId = null;
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

  function setHost(id: number): void {
    hostId = id;
    ev.onHost?.(id);
  }

  function enterTown(you: number, players: PlayerInfo[], host: number): void {
    myId = you;
    setHost(host);
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
    if (client && myGun !== null) client.send(null, { k: 'gun', c: myGun });
  }

  function onMsg(m: ServerMsg<GtaMsg>): void {
    switch (m.t) {
      case 'welcome':
        if (m.resumed) enterTown(m.id, m.resumed.players, m.resumed.hostId);
        break;
      case 'match':
        enterTown(m.you, m.players, m.hostId);
        break;
      case 'joined':
        if (myId === null) break;
        peers.add(m.player.id);
        ev.onPeerJoin(m.player);
        report('online');
        sendPose(true);
        if (client && myRadio >= 0) client.send(m.player.id, { k: 'radio', st: myRadio });
        if (client && myLook !== null) client.send(m.player.id, { k: 'look', c: myLook });
        if (client && myGun !== null) client.send(m.player.id, { k: 'gun', c: myGun });
        break;
      case 'host':
        if (myId !== null) setHost(m.hostId);
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
        if (msg.k === 'pos') ev.onPeerPose(m.from, poseFromArray(msg.p, msg.a, msg.r), msg.t);
        else if (msg.k === 'hit') {
          // Inbound limit (an honest sender already waits 100 ms between hits): a flood cannot drain my health.
          const now = performance.now();
          if (now - (lastHitFrom.get(m.from) ?? -Infinity) < HIT_IN_MS) break;
          lastHitFrom.set(m.from, now);
          ev.onHit(m.from);
        }
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
        else if (msg.k === 'gun') ev.onPeerGun?.(m.from, msg.c === '' ? null : msg.c);
        else if (msg.k === 'banger') {
          const st = STATION_CODES[msg.st];
          if (st) ev.onPeerBanger?.(m.from, st, msg.song);
        } else if (msg.k === 'pty') ev.onParty?.(m.from, msg.d);
        else if (msg.k === 'w') ev.onWire?.(m.from, msg.d);
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
    get hostId() { return hostId; },
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
      const w = encodePose(p);
      latest = w.p;
      latestPitch = w.a;
      latestTilt = w.r;
    },
    setLook(code) {
      if (code === myLook) return;
      myLook = code;
      if (client && myId !== null) client.send(null, { k: 'look', c: code ?? '' });
    },
    setGun(code) {
      if (code === myGun) return;
      myGun = code;
      if (client && myId !== null) client.send(null, { k: 'gun', c: code ?? '' });
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
    sendParty(to, d) {
      if (!client || myId === null || (to !== null && !peers.has(to))) return;
      client.send(to, { k: 'pty', d });
    },
    sendWire(to, d) {
      if (!client || myId === null || (to !== null && !peers.has(to))) return;
      client.send(to, { k: 'w', d });
    },
  };
}
