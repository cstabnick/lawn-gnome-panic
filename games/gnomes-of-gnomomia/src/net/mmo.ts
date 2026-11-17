// The MMO layer: joins the one shared Gnomomia world on the relay server, tells it about my character, shows the
// other players within 450 m of me (any zone, on the ground or on a deck), and syncs enemies per zone using
// deterministic zone authority so players share the same enemies and compete for kills and loot.
import * as THREE from 'three';
import { createGnomeModel, getMyGnome, resolveLook, type GnomeModel } from '@lawn/gnome';
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import { Interp } from '@lawn/mp/interp';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import { checkName } from '@lawn/mp/textFilter';
import { PLAYER_LOOK, UI, WORLD, look, type ZoneId } from '../config';
import { ENEMIES } from '../content';
import { applyStatus } from '../combat';
import { companionPoses } from '../companions';
import {
  applyRemoteEnemyAttack, applyRemoteEnemyHit, applyRemoteEnemyKill, applyZoneEnemySync,
  entityIdBySyncKey, exportZoneEnemies, setEnemyNet, spawnRemoteEnemy, zoneHasActiveEnemies,
  type RemoteTarget,
} from '../entities';
import { bus, say } from '../events';
import { player } from '../player';
import { state } from '../state';
import { zoneRectDistance } from '../terrain';
import { activeZones } from '../zones';
import {
  CARD_CHECK_S, GAME_ID, POS_HZ_IDLE, POS_HZ_MOVING, characterCard, isZoneId, readCard, readCompanionList,
  readDamageType, readEnemySyncList, readPose, readStatusId,
  type CharacterCard, type GnoMsg, type Pose,
} from './protocol';

const NAME_KEY = 'gnomomia.name';
const CID_KEY = 'gnomomia.cid';
/** Reconnect delays (s) after the link drops; the last one repeats. */
const RETRY_S = [3, 6, 12, 30, 60];
/** A remote that moves farther than this between samples teleported (hatch, respawn): snap, don't slide. */
const SNAP_DIST = 6;
const SWING_SECONDS = 0.35;
const scratchVelocity = new THREE.Vector3();
/** How long a speech bubble stays over a speaker's head: a base plus a little per character, capped. */
const BUBBLE_BASE_S = 4;
const BUBBLE_PER_CHAR_S = 0.06;
const BUBBLE_MAX_S = 10;
/** Touch screens have no Enter key; the hint names the chat button instead. */
const CHAT_HINT = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 'Tap 💬 to chat.' : 'Press Enter to chat.';

/** The line a player said last, shown over their head until `until` (performance.now() ms). */
export interface ChatBubble {
  text: string;
  at: number;
  until: number;
}

export type MmoStatus =
  /** This build has no server (serverUrl() === ''). */
  | 'unavailable'
  | 'connecting'
  | 'online'
  /** The player chose to play offline. */
  | 'offline'
  /** The link dropped; a reconnect is scheduled. */
  | 'retrying';

export interface RemoteCompanion {
  key: string;
  slot: number;
  ownerId: number;
  ownerName: string;
  color: number;
  level: number | null;
  name: string;
  zone: ZoneId | null;
  position: THREE.Vector3;
  model: GnomeModel | null;
  hatColor: number;
  shirtColor: number;
  interp: Interp;
  shown: number[];
  lastSwings: number;
  swing: number;
}

export interface RemotePlayer {
  id: number;
  name: string;
  /** 0xRRGGBB from the server, unique in the room. */
  color: number;
  card: CharacterCard | null;
  /** Zone from their last position, or null before one arrived. */
  zone: ZoneId | null;
  /** Feet position as shown now (only meaningful while `model` exists). */
  position: THREE.Vector3;
  model: GnomeModel | null;
  character: string;
  interp: Interp;
  /** Pose being shown: x, z, facing, dead, swings, y. */
  shown: number[];
  lastSwings: number;
  swing: number;
  companions: Map<number, RemoteCompanion>;
}

let sceneRef: THREE.Scene | null = null;
const url = serverUrl();
let status: MmoStatus = url === '' ? 'unavailable' : 'offline';
let link: NetClient<GnoMsg> | null = null;
let me = -1;
let myName = '';
const remotes = new Map<number, RemotePlayer>();
/** Speech bubbles by player id (mine under my own id). */
const bubbles = new Map<number, ChatBubble>();
const listeners: (() => void)[] = [];
let retryIndex = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let sendTimer: ReturnType<typeof setInterval> | null = null;
/** Swings counted from player.swing jumping up (combat.ts sets it on each swing or cast). */
let mySwings = 0;
let lastSwingValue = 0;
let lastSent: Pose | null = null;
let lastSentAt = 0;
let lastSentZone: ZoneId | null = null;
let lastCardJson = '';
let cardTimer = 0;
const lastZoneAuth = new Map<ZoneId, number>();
const lastZoneSyncAt = new Map<ZoneId, number>();

function changed(): void {
  for (const fn of listeners) fn();
}

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable: not remembered
  }
}

/** This browser's character id: random, made once. The key the future server would save the character under. */
function characterId(): string {
  let id = storageGet(CID_KEY);
  if (!id || !/^[A-Za-z0-9_-]{8,40}$/.test(id)) {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    storageSet(CID_KEY, id);
  }
  return id;
}
const cid = characterId();

function randomName(): string {
  return `Gnome${1000 + Math.floor(Math.random() * 9000)}`;
}

function startingName(): string {
  const saved = checkName(storageGet(NAME_KEY) ?? '');
  if (saved.ok) return saved.name;
  const gnome = getMyGnome()?.name;
  if (gnome && gnome !== 'Gnome') {
    const c = checkName(gnome);
    if (c.ok) return c.name;
  }
  return randomName();
}

function cssColor(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

// ---------------------------------------------------------------- remote players

function addRemote(p: PlayerInfo): void {
  if (p.id === me) return;
  const old = remotes.get(p.id);
  if (old) dropModel(old);
  remotes.set(p.id, {
    id: p.id, name: p.name, color: p.color, character: p.character, card: null, zone: null,
    position: new THREE.Vector3(), model: null,
    interp: new Interp({ angles: [2], steps: [3, 4], pos: [0, 1, 5], snapDist: SNAP_DIST }),
    shown: [0, 0, 0, 0, 0, 0], lastSwings: -1, swing: 0,
    companions: new Map(),
  });
}

function disposeGnomeModel(model: GnomeModel): void {
  sceneRef?.remove(model.object);
  model.object.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    }
  });
}

function dropCompanionModel(c: RemoteCompanion): void {
  if (!c.model) return;
  disposeGnomeModel(c.model);
  c.model = null;
}

function dropModel(r: RemotePlayer): void {
  if (!r.model) return;
  disposeGnomeModel(r.model);
  r.model = null;
}

function removeRemote(id: number): void {
  const r = remotes.get(id);
  if (!r) return;
  dropModel(r);
  for (const c of r.companions.values()) dropCompanionModel(c);
  r.companions.clear();
  remotes.delete(id);
  bubbles.delete(id);
}

function clearRemotes(): void {
  for (const id of [...remotes.keys()]) removeRemote(id);
}

function ensureModel(r: RemotePlayer): GnomeModel {
  if (r.model) return r.model;
  const model = createGnomeModel(resolveLook({ id: r.id, character: r.character }) ?? PLAYER_LOOK);
  model.object.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  sceneRef?.add(model.object);
  r.model = model;
  return model;
}

function ensureCompanionModel(c: RemoteCompanion): GnomeModel {
  if (c.model) return c.model;
  const model = createGnomeModel(look(c.hatColor, c.shirtColor, 0xd8c8a8));
  model.object.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  sceneRef?.add(model.object);
  c.model = model;
  return model;
}

// ---------------------------------------------------------------- sending

function myPose(): Pose {
  const round = (v: number): number => Math.round(v * 100) / 100;
  return [
    round(player.position.x), round(player.position.z), round(player.facing), player.dead ? 1 : 0, mySwings,
    round(player.position.y),
  ];
}

function sendCard(to: number | null): void {
  const c = link;
  if (!c || status !== 'online') return;
  const card = characterCard(cid, state);
  lastCardJson = JSON.stringify(card);
  c.send(to, { k: 'card', c: card });
}

function sendPose(force: boolean): void {
  const c = link;
  if (!c || status !== 'online') return;
  const now = performance.now();
  const pose = myPose();
  const moved = lastSent === null || lastSentZone !== state.zone || pose.some((v, i) => v !== lastSent![i]);
  const gap = 1000 / (moved ? POS_HZ_MOVING : POS_HZ_IDLE);
  if (!force && now - lastSentAt < gap - 5) return;
  lastSent = pose;
  lastSentAt = now;
  lastSentZone = state.zone;
  c.send(null, { k: 'pos', z: state.zone, p: pose, t: Math.round(now) });
  c.send(null, { k: 'comp', z: state.zone, l: companionPoses(), t: Math.round(now) });
}

/** Deterministic authority for a zone: lowest player id inside the zone, or lowest id within inactiveRadius. */
function zoneAuthority(zone: ZoneId): number | null {
  if (status !== 'online' || me < 0) return null;
  let bestInZone = state.zone === zone ? me : Infinity;
  for (const r of remotes.values()) {
    if (r.zone === zone && r.id < bestInZone) bestInZone = r.id;
  }
  if (bestInZone < Infinity) return bestInZone;

  let bestNear = zoneRectDistance(zone, player.position.x, player.position.z) < WORLD.inactiveRadius ? me : Infinity;
  for (const r of remotes.values()) {
    if (r.zone === null) continue;
    const x = r.interp.ready ? r.shown[0] : r.position.x;
    const z = r.interp.ready ? r.shown[1] : r.position.z;
    if (zoneRectDistance(zone, x, z) < WORLD.inactiveRadius && r.id < bestNear) bestNear = r.id;
  }
  return bestNear < Infinity ? bestNear : me;
}

function isZoneAuthority(zone: ZoneId): boolean {
  const auth = zoneAuthority(zone);
  return auth === null || auth === me;
}

function checkAuthorityHandoffs(): void {
  if (!link || status !== 'online' || me < 0) return;
  for (const z of activeZones()) {
    const prev = lastZoneAuth.get(z);
    const curr = zoneAuthority(z);
    if (curr !== null) {
      if (prev === me && curr !== me) {
        const list = exportZoneEnemies(z);
        if (list.length > 0) link.send(curr, { k: 'ehand', z, l: list });
      }
      lastZoneAuth.set(z, curr);
    }
  }
}

function sendZoneEnemies(zone: ZoneId, to: number | null, now: number): void {
  if (!link || status !== 'online') return;
  const list = exportZoneEnemies(zone);
  if (list.length === 0) return;
  lastZoneSyncAt.set(zone, now);
  link.send(to, { k: 'esync', z: zone, l: list, t: Math.round(now) });
}

/** Runs on a timer, not the frame loop, so a hidden tab (no frames) still keeps its place in the room. */
function tick(): void {
  sendPose(false);
  checkAuthorityHandoffs();
  const now = performance.now();
  for (const z of activeZones()) {
    if (!isZoneAuthority(z)) continue;
    const gap = zoneHasActiveEnemies(z) ? 100 : 1000;
    const lastAt = lastZoneSyncAt.get(z) ?? 0;
    if (now - lastAt >= gap - 5) sendZoneEnemies(z, null, now);
  }
  cardTimer += 0.1;
  if (cardTimer >= CARD_CHECK_S) {
    cardTimer = 0;
    if (JSON.stringify(characterCard(cid, state)) !== lastCardJson) sendCard(null);
  }
}

// ---------------------------------------------------------------- connection

function stopTimers(): void {
  if (sendTimer !== null) clearInterval(sendTimer);
  sendTimer = null;
  if (retryTimer !== null) clearTimeout(retryTimer);
  retryTimer = null;
}

function detach(): NetClient<GnoMsg> | null {
  const c = link;
  link = null;
  me = -1;
  stopTimers();
  clearRemotes();
  lastZoneAuth.clear();
  lastZoneSyncAt.clear();
  bubbles.clear();
  return c;
}

function scheduleRetry(why: string): void {
  detach()?.drop();
  status = 'retrying';
  const s = RETRY_S[Math.min(retryIndex, RETRY_S.length - 1)];
  retryIndex++;
  say(`${why} Reconnecting in ${s} s.`, UI.textDim);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (status === 'retrying') connect();
  }, s * 1000);
  changed();
}

function onServer(c: NetClient<GnoMsg>, m: ServerMsg<GnoMsg>): void {
  if (c !== link) return;
  switch (m.t) {
    case 'match': {
      me = m.you;
      clearRemotes();
      for (const p of m.players) addRemote(p);
      status = 'online';
      retryIndex = 0;
      lastSent = null;
      sendCard(null);
      sendPose(true);
      if (sendTimer !== null) clearInterval(sendTimer);
      sendTimer = setInterval(tick, 100);
      const others = m.players.length - 1;
      say(`You are online as ${myName}. ${others === 0 ? 'No other gnomes are about yet.' : `${others} other gnome${others === 1 ? ' is' : 's are'} in the world.`} ${CHAT_HINT}`, UI.good);
      changed();
      break;
    }
    case 'joined': {
      addRemote(m.player);
      sendCard(m.player.id);
      sendPose(true);
      say(`${m.player.name} has entered Gnomomia.`, UI.textDim);
      changed();
      break;
    }
    case 'left': {
      const r = remotes.get(m.id);
      if (r) say(`${r.name} has left Gnomomia.`, UI.textDim);
      removeRemote(m.id);
      checkAuthorityHandoffs();
      changed();
      break;
    }
    case 'relay': {
      const r = remotes.get(m.from);
      if (!r) break;
      const d = m.d;
      if (d.k === 'card') {
        const card = readCard(d.c);
        if (card) {
          r.card = card;
          changed();
        }
      } else if (d.k === 'pos') {
        const pose = readPose(d.p);
        if (!pose || !isZoneId(d.z)) break;
        const wasNull = r.zone === null;
        if (r.zone !== d.z) {
          // A zone change is a walk across the world, not a teleport, unless they moved far in one step.
          const teleported = r.interp.ready && Math.hypot(pose[0] - r.shown[0], pose[1] - r.shown[1]) > 50;
          r.zone = d.z;
          if (teleported) r.interp.clear();
          changed();
        }
        r.interp.push(pose, typeof d.t === 'number' && Number.isFinite(d.t) ? d.t : undefined);
        checkAuthorityHandoffs();
        if (wasNull && isZoneAuthority(d.z)) sendZoneEnemies(d.z, r.id, performance.now());
      } else if (d.k === 'esync') {
        if (!isZoneId(d.z) || isZoneAuthority(d.z)) break;
        const list = readEnemySyncList(d.l);
        if (list) applyZoneEnemySync(d.z, list, typeof d.t === 'number' && Number.isFinite(d.t) ? d.t : undefined, false);
      } else if (d.k === 'ehand') {
        if (!isZoneId(d.z)) break;
        const list = readEnemySyncList(d.l);
        checkAuthorityHandoffs();
        if (list && isZoneAuthority(d.z)) applyZoneEnemySync(d.z, list, undefined, true);
      } else if (d.k === 'ehit') {
        if (!isZoneId(d.z) || !isZoneAuthority(d.z) || typeof d.e !== 'string') break;
        if (typeof d.d !== 'number' || !Number.isFinite(d.d) || d.d <= 0 || d.d >= 1e6) break;
        const dt = d.dt !== undefined ? readDamageType(d.dt) : 'crush';
        if (dt) applyRemoteEnemyHit(d.e, m.from, d.d, dt, Boolean(d.c), Boolean(d.sp));
      } else if (d.k === 'estat') {
        if (!isZoneId(d.z) || !isZoneAuthority(d.z) || typeof d.e !== 'string') break;
        const st = readStatusId(d.s);
        if (!st || typeof d.sec !== 'number' || !Number.isFinite(d.sec) || d.sec <= 0 || d.sec > 120) break;
        if (typeof d.p !== 'number' || !Number.isFinite(d.p) || d.p < 0 || d.p >= 1e6) break;
        const eid = entityIdBySyncKey(d.e);
        if (eid !== undefined) applyStatus(eid, st, d.sec, d.p);
      } else if (d.k === 'ekill') {
        if (!isZoneId(d.z) || typeof d.e !== 'string' || typeof d.by !== 'number' || !Number.isFinite(d.by)) break;
        applyRemoteEnemyKill(d.e, d.by);
      } else if (d.k === 'eatk') {
        if (!isZoneId(d.z) || typeof d.e !== 'string') break;
        applyRemoteEnemyAttack(d.e);
      } else if (d.k === 'espawn') {
        if (
          !isZoneId(d.z) || typeof d.e !== 'string' || d.e.length === 0 || d.e.length > 32 ||
          typeof d.def !== 'string' || !Object.prototype.hasOwnProperty.call(ENEMIES, d.def) ||
          typeof d.x !== 'number' || !Number.isFinite(d.x) || typeof d.zp !== 'number' || !Number.isFinite(d.zp)
        ) break;
        spawnRemoteEnemy(d.e, d.def, d.x, d.zp, d.z);
      } else if (d.k === 'comp') {
        const list = readCompanionList(d.l);
        if (!list || !isZoneId(d.z)) break;
        const t = typeof d.t === 'number' && Number.isFinite(d.t) ? d.t : undefined;
        const seenSlots = new Set<number>();
        for (const [slot, cname, cx, cz, cf, cdead, cswings, cy, hatColor, shirtColor] of list) {
          seenSlots.add(slot);
          let comp = r.companions.get(slot);
          if (!comp) {
            comp = {
              key: `${r.id}_${slot}`,
              slot,
              ownerId: r.id,
              ownerName: r.name,
              color: r.color,
              level: r.card?.level ?? null,
              name: cname,
              zone: d.z,
              position: new THREE.Vector3(cx, cy, cz),
              model: null,
              hatColor,
              shirtColor,
              interp: new Interp({ angles: [2], steps: [3, 4], pos: [0, 1, 5], snapDist: SNAP_DIST }),
              shown: [cx, cz, cf, cdead, cswings, cy],
              lastSwings: -1,
              swing: 0,
            };
            r.companions.set(slot, comp);
          } else {
            comp.name = cname;
            comp.ownerName = r.name;
            comp.color = r.color;
            comp.level = r.card?.level ?? null;
            if (comp.zone !== d.z) {
              const teleported = comp.interp.ready && Math.hypot(cx - comp.shown[0], cz - comp.shown[1]) > 50;
              comp.zone = d.z;
              if (teleported) comp.interp.clear();
            }
          }
          comp.interp.push([cx, cz, cf, cdead, cswings, cy], t);
        }
        for (const [slot, comp] of r.companions) {
          if (!seenSlots.has(slot)) {
            dropCompanionModel(comp);
            r.companions.delete(slot);
          }
        }
      }
      break;
    }
    case 'chat': {
      const mine = m.from === me;
      say(`${mine ? 'You' : m.name}: ${m.text}`, mine ? UI.textWhite : cssColor(m.color));
      const now = performance.now();
      const life = Math.min(BUBBLE_MAX_S, BUBBLE_BASE_S + m.text.length * BUBBLE_PER_CHAR_S);
      bubbles.set(m.from, { text: m.text, at: now, until: now + life * 1000 });
      break;
    }
    case 'ended': {
      scheduleRetry(`The world closed (${m.reason}).`);
      break;
    }
    case 'error': {
      if (m.code === 'chat-rate') say('You are chatting too fast; that line was not sent.', UI.bad);
      else if (m.code === 'bad-name') {
        say(`The name "${myName}" was refused; you are ${(myName = randomName())} for now. Use /name to pick another.`, UI.bad);
        c.queue(null, character(), myName);
      } else say(m.message, UI.bad);
      break;
    }
    default:
      break;
  }
}

function character(): string {
  return getMyGnome()?.code ?? GAME_ID;
}

function connect(): void {
  if (url === '') return;
  detach()?.drop();
  const c = createNetClient<GnoMsg>(url, GAME_ID, { name: myName, character: character() });
  link = c;
  status = 'connecting';
  changed();
  c.onMessage((m) => onServer(c, m));
  c.onClose(() => {
    if (c === link && (status === 'online' || status === 'connecting')) scheduleRetry('Lost the connection to the world.');
  });
  void c.connect().then(
    () => {
      if (link === c) c.queue(null, character(), myName);
    },
    () => {
      if (link === c) scheduleRetry('Could not reach the world server.');
    },
  );
}

// ---------------------------------------------------------------- public API

/** Call once with the scene remote gnomes are added to. */
export function initMmo(scene: THREE.Scene): void {
  sceneRef = scene;
  myName = startingName();
  setEnemyNet({
    isOnline: () => status === 'online' && link !== null && me >= 0,
    myId: () => me,
    isZoneAuthority,
    *remoteTargets(): Iterable<RemoteTarget> {
      for (const r of remotes.values()) {
        if (r.zone === null) continue;
        const x = r.interp.ready ? r.shown[0] : r.position.x;
        const z = r.interp.ready ? r.shown[1] : r.position.z;
        const dead = r.interp.ready ? r.shown[3] >= 0.5 : false;
        yield { id: r.id, x, z, zone: r.zone, dead };
      }
    },
    sendEnemyHit(zone, syncKey, damage, damageType, crit, spell) {
      if (!link || status !== 'online') return;
      const auth = zoneAuthority(zone);
      if (auth === null || auth === me) return;
      link.send(auth, { k: 'ehit', z: zone, e: syncKey, d: Math.round(damage), dt: damageType, c: crit, sp: spell });
    },
    sendEnemyStatus(zone, syncKey, st, seconds, power) {
      if (!link || status !== 'online') return;
      const auth = zoneAuthority(zone);
      if (auth === null || auth === me) return;
      link.send(auth, { k: 'estat', z: zone, e: syncKey, s: st, sec: seconds, p: power });
    },
    sendEnemyAttack(toPlayerId, zone, syncKey) {
      if (!link || status !== 'online') return;
      link.send(toPlayerId, { k: 'eatk', z: zone, e: syncKey });
    },
    sendEnemyKill(zone, syncKey, killerId) {
      if (!link || status !== 'online') return;
      link.send(null, { k: 'ekill', z: zone, e: syncKey, by: killerId });
    },
    sendDynamicSpawn(zone, syncKey, defId, x, z) {
      if (!link || status !== 'online') return;
      link.send(null, { k: 'espawn', z: zone, e: syncKey, def: defId, x, zp: z });
    },
  });
  // My zone changed: gnomes left behind disappear, gnomes already in the new zone appear on the next frame.
  bus.on('zone-changed', () => {
    sendPose(true);
    checkAuthorityHandoffs();
    changed();
  });
  window.addEventListener('pagehide', () => {
    try {
      link?.leave();
    } catch {
      // closing
    }
  });
}

/** Join the shared world (and keep rejoining after drops) until goOffline. */
export function goOnline(): void {
  if (status === 'unavailable' || status === 'online' || status === 'connecting') return;
  retryIndex = 0;
  connect();
}

export function goOffline(): void {
  const c = detach();
  if (c) {
    try {
      c.leave();
    } catch {
      // closing
    }
    c.drop();
  }
  if (status !== 'unavailable') status = 'offline';
  say('You are playing offline. Type /online to rejoin the world.', UI.textDim);
  changed();
}

/** Changes my name (remembered). Returns an error to show, or null when it was accepted locally. */
export function setName(raw: string): string | null {
  const c = checkName(raw);
  if (!c.ok) return c.reason;
  myName = c.name;
  storageSet(NAME_KEY, myName);
  if (link && status === 'online') {
    // The server takes names on queue: rejoin the world under the new name.
    link.queue(null, character(), myName);
  }
  changed();
  return null;
}

export function sendChat(text: string): void {
  if (link && status === 'online') link.chat(text);
  else say('You are not online, so nobody hears you.', UI.textDim);
}

export function mmoStatus(): MmoStatus {
  return status;
}

export function myOnlineName(): string {
  return myName;
}

/** The speech bubble over a player's head right now (my own when id is myOnlineId()), or null. */
export function chatBubble(id: number): ChatBubble | null {
  const b = bubbles.get(id);
  if (!b) return null;
  if (performance.now() >= b.until) {
    bubbles.delete(id);
    return null;
  }
  return b;
}

/** My player id in the room, or -1 when not online. */
export function myOnlineId(): number {
  return me;
}

export function remotePlayers(): Iterable<RemotePlayer> {
  return remotes.values();
}

export function* remoteCompanions(): Iterable<RemoteCompanion> {
  for (const r of remotes.values()) {
    for (const c of r.companions.values()) yield c;
  }
}

/** Status, roster, cards or zones changed. */
export function onMmoChange(fn: () => void): void {
  listeners.push(fn);
}

/** Per frame: count my swings, and move and animate the remote gnomes within WORLD.remoteViewRadius of me. */
export function updateMmo(dt: number): void {
  if (player.swing > lastSwingValue + 0.05) mySwings++;
  lastSwingValue = player.swing;

  for (const r of remotes.values()) {
    if (!r.interp.ready || !r.interp.sample(r.shown)) {
      dropModel(r);
      continue;
    }
    const prevX = r.shown[0];
    const prevZ = r.shown[1];
    const hadModel = r.model !== null;
    const [x, z, facing, dead, swings, y] = r.shown;
    if (Math.hypot(x - player.position.x, z - player.position.z) > WORLD.remoteViewRadius) {
      dropModel(r);
      continue;
    }
    const model = ensureModel(r);
    const vx = hadModel && dt > 0 ? (x - prevX) / dt : 0;
    const vz = hadModel && dt > 0 ? (z - prevZ) / dt : 0;
    r.position.set(x, y, z);
    if (r.lastSwings >= 0 && swings !== r.lastSwings) r.swing = SWING_SECONDS;
    r.lastSwings = swings;
    model.setDead(dead >= 0.5);
    model.update({ position: r.position, velocity: scratchVelocity.set(vx, 0, vz), facing, grounded: true, jumpsUsed: 0 }, dt);
    if (r.swing > 0) {
      r.swing -= dt;
      model.arms.right.rotation.x = -2.4 * Math.sin(Math.PI * (1 - Math.max(0, r.swing) / SWING_SECONDS));
    }

    for (const c of r.companions.values()) {
      if (!c.interp.ready || !c.interp.sample(c.shown)) {
        dropCompanionModel(c);
        continue;
      }
      const cPrevX = c.shown[0];
      const cPrevZ = c.shown[1];
      const cHadModel = c.model !== null;
      const [cx, cz, cfacing, cdead, cswings, cy] = c.shown;
      if (Math.hypot(cx - player.position.x, cz - player.position.z) > WORLD.remoteViewRadius) {
        dropCompanionModel(c);
        continue;
      }
      const cModel = ensureCompanionModel(c);
      const cvx = cHadModel && dt > 0 ? (cx - cPrevX) / dt : 0;
      const cvz = cHadModel && dt > 0 ? (cz - cPrevZ) / dt : 0;
      c.position.set(cx, cy, cz);
      if (c.lastSwings >= 0 && cswings !== c.lastSwings) c.swing = SWING_SECONDS;
      c.lastSwings = cswings;
      cModel.setDead(cdead >= 0.5);
      cModel.update({ position: c.position, velocity: scratchVelocity.set(cvx, 0, cvz), facing: cfacing, grounded: true, jumpsUsed: 0 }, dt);
      if (c.swing > 0) {
        c.swing -= dt;
        cModel.arms.right.rotation.x = -2.4 * Math.sin(Math.PI * (1 - Math.max(0, c.swing) / SWING_SECONDS));
      }
    }
  }
}
