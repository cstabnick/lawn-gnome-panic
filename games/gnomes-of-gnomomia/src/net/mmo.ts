// The MMO layer: joins the one shared Gnomomia world on the relay server, tells it about my character, and shows the
// other players who are in my zone. Enemies, loot and quests stay per player (each world copy is my own); only
// players are shared. See protocol.ts for who owns what.
import * as THREE from 'three';
import { createGnomeModel, getMyGnome, resolveLook, type GnomeModel } from '@lawn/gnome';
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import { Interp } from '@lawn/mp/interp';
import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';
import { checkName } from '@lawn/mp/textFilter';
import { PLAYER_LOOK, UI, type ZoneId } from '../config';
import { bus, say } from '../events';
import { player } from '../player';
import { state } from '../state';
import { heightAt } from '../world';
import {
  CARD_CHECK_S, GAME_ID, POS_HZ_IDLE, POS_HZ_MOVING, characterCard, isZoneId, readCard, readPose,
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

export type MmoStatus =
  /** This build has no server (serverUrl() === ''). */
  | 'unavailable'
  | 'connecting'
  | 'online'
  /** The player chose to play offline. */
  | 'offline'
  /** The link dropped; a reconnect is scheduled. */
  | 'retrying';

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
  /** Pose being shown: x, z, facing, dead, swings. */
  shown: number[];
  lastSwings: number;
  swing: number;
}

let sceneRef: THREE.Scene | null = null;
const url = serverUrl();
let status: MmoStatus = url === '' ? 'unavailable' : 'offline';
let link: NetClient<GnoMsg> | null = null;
let me = -1;
let myName = '';
const remotes = new Map<number, RemotePlayer>();
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
    interp: new Interp({ angles: [2], steps: [3, 4], pos: [0, 1], snapDist: SNAP_DIST }),
    shown: [0, 0, 0, 0, 0], lastSwings: -1, swing: 0,
  });
}

function dropModel(r: RemotePlayer): void {
  if (!r.model) return;
  sceneRef?.remove(r.model.object);
  r.model.object.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    }
  });
  r.model = null;
}

function removeRemote(id: number): void {
  const r = remotes.get(id);
  if (!r) return;
  dropModel(r);
  remotes.delete(id);
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

// ---------------------------------------------------------------- sending

function myPose(): Pose {
  const round = (v: number): number => Math.round(v * 100) / 100;
  return [round(player.position.x), round(player.position.z), round(player.facing), player.dead ? 1 : 0, mySwings];
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
}

/** Runs on a timer, not the frame loop, so a hidden tab (no frames) still keeps its place in the room. */
function tick(): void {
  sendPose(false);
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
      say(`You are online as ${myName}. ${others === 0 ? 'No other gnomes are about yet.' : `${others} other gnome${others === 1 ? ' is' : 's are'} in the world.`} Press Enter to chat.`, UI.good);
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
        if (r.zone !== d.z) {
          r.zone = d.z;
          r.interp.clear();
          if (d.z !== state.zone) dropModel(r);
          changed();
        }
        r.interp.push(pose, typeof d.t === 'number' && Number.isFinite(d.t) ? d.t : undefined);
      }
      break;
    }
    case 'chat': {
      const mine = m.from === me;
      say(`${mine ? 'You' : m.name}: ${m.text}`, mine ? UI.textWhite : cssColor(m.color));
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
  // My zone changed: gnomes left behind disappear, gnomes already in the new zone appear on the next frame.
  bus.on('zone-changed', ({ zone }) => {
    for (const r of remotes.values()) if (r.zone !== zone) dropModel(r);
    sendPose(true);
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

export function remotePlayers(): Iterable<RemotePlayer> {
  return remotes.values();
}

/** Status, roster, cards or zones changed. */
export function onMmoChange(fn: () => void): void {
  listeners.push(fn);
}

/** Per frame: count my swings, and move and animate the remote gnomes in my zone. */
export function updateMmo(dt: number): void {
  if (player.swing > lastSwingValue + 0.05) mySwings++;
  lastSwingValue = player.swing;

  for (const r of remotes.values()) {
    if (r.zone !== state.zone || !r.interp.ready) {
      dropModel(r);
      continue;
    }
    const prevX = r.shown[0];
    const prevZ = r.shown[1];
    const hadModel = r.model !== null;
    if (!r.interp.sample(r.shown)) continue;
    const model = ensureModel(r);
    const [x, z, facing, dead, swings] = r.shown;
    const vx = hadModel && dt > 0 ? (x - prevX) / dt : 0;
    const vz = hadModel && dt > 0 ? (z - prevZ) / dt : 0;
    r.position.set(x, heightAt(x, z), z);
    if (r.lastSwings >= 0 && swings !== r.lastSwings) r.swing = SWING_SECONDS;
    r.lastSwings = swings;
    model.setDead(dead >= 0.5);
    model.update({ position: r.position, velocity: scratchVelocity.set(vx, 0, vz), facing, grounded: true, jumpsUsed: 0 }, dt);
    if (r.swing > 0) {
      r.swing -= dt;
      model.arms.right.rotation.x = -2.4 * Math.sin(Math.PI * (1 - Math.max(0, r.swing) / SWING_SECONDS));
    }
  }
}
