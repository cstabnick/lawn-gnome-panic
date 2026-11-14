// src/net/state.ts: online play's shared state, and the hooks the core game modules call.
// Written in the foundation; session.ts, host.ts, guest.ts and ui/online.ts read and write it.
//
// Roles: 'solo' runs everything locally (the default; the game is unchanged).
// 'host' runs the whole match (bots, conquest, damage, respawns) and sends snapshots.
// 'guest' moves, aims and fires its own soldier locally, sends damage claims to the host,
// and shows everything else from the host's snapshots.
import type { PlayerInfo } from '@lawn/mp/protocol';
import { Interp } from '@lawn/mp/interp';
import { isBot, type DamageCause, type Game, type Soldier, type WeaponId } from '../config';
import type { FrontMsg } from './protocol';

export type NetRole = 'solo' | 'host' | 'guest';

/** One soldier slot controlled by a human. The host decides these; guests copy them from snapshots. */
export interface HumanSlot {
  soldierId: number;
  playerId: number; // the matchmaking server's player id
  name: string;
}

export const netState: {
  role: NetRole;
  /** Human-controlled slots, me included. Empty in solo. */
  humans: HumanSlot[];
  /**
   * Life number per soldier id: how many times it has spawned this match. The host counts up on each 'spawn'
   * event (host.ts); guests copy it from 'spawn' net events (guest.ts). Kept across a host change, so a new host
   * agrees with its guests. Missing = 0.
   */
  lives: Map<number, number>;
} = { role: 'solo', humans: [], lives: new Map() };

/** The live match as session.ts sees it. send() does nothing while not in a match. */
export interface NetLink {
  me: number;            // my player id, -1 when not in a match
  hostId: number;        // -1 when not in a match
  roster: PlayerInfo[];  // everyone in the match, me included, in join order
  send(to: number | null, d: FrontMsg): void;
}

export const netLink: NetLink = { me: -1, hostId: -1, roster: [], send: () => {} };

/** A guest's claim that its own soldier damaged a soldier. The attacker is the sender's soldier. */
export interface DamageClaim {
  victim: Soldier;
  amount: number;
  cause: DamageCause;
  headshot: boolean;
  weapon: WeaponId | null;
}

/**
 * Set by the net modules, called by the core modules.
 * - sendDamage / sendVehicleDamage: guest.ts sets them. On a guest, damageSoldier and damageVehicle call these
 *   instead of applying damage, and only when the attacker is game.player (everything else is the host's job).
 * - startMatch: main.ts sets it. session.ts calls it when this browser becomes host of a new match,
 *   guest.ts when the first snapshot has placed this guest's soldier. Starts the frame loop like PLAY does.
 */
export const netHooks: {
  sendDamage: ((c: DamageClaim) => void) | null;
  sendVehicleDamage: ((vehicleId: number, amount: number) => void) | null;
  startMatch: (() => void) | null;
} = { sendDamage: null, sendVehicleDamage: null, startMatch: null };

/** The title screen's online panel (ui/online.ts) and session.ts talk through this. */
export interface Lobby {
  /** off: not online. connecting: opening the socket. queued: waiting for players. joining: matched, waiting for the
   *  first snapshot (guests only). in: playing online. error: see message. */
  status: 'off' | 'connecting' | 'queued' | 'joining' | 'in' | 'error';
  message: string;
  /** While queued: players waiting, seconds until the match starts, and the room code (null = public). */
  players: number;
  startsInS: number;
  code: string | null;
  /** Set by ui/online.ts: join a public match (code null) or a room code as `name`, or 'leave'. session.ts sets it back to null. */
  request: { name: string; code: string | null } | 'leave' | null;
}

export const lobby: Lobby = { status: 'off', message: '', players: 0, startsInS: 0, code: null, request: null };

/**
 * Applies netState.humans to the soldiers: the slot whose playerId is `me` becomes game.player (isPlayer, named 'YOU'),
 * other human slots become remote (named after the player), every other slot is a bot again (botName).
 * If no slot is mine, game.player stays where it is. Call after every change to netState.humans.
 */
export function applyHumans(game: Game, me: number): void {
  const bySoldier = new Map<number, HumanSlot>();
  for (const h of netState.humans) bySoldier.set(h.soldierId, h);
  let mine: Soldier | null = null;
  for (const s of game.soldiers) {
    const h = bySoldier.get(s.id);
    if (h && h.playerId === me) mine = s;
  }
  for (const s of game.soldiers) {
    const h = bySoldier.get(s.id);
    if (!h) {
      s.isPlayer = mine === null && s === game.player;
      s.remote = false;
      s.name = s.isPlayer ? 'YOU' : s.botName;
    } else if (h.playerId === me) {
      s.isPlayer = true;
      s.remote = false;
      s.name = 'YOU';
    } else {
      s.isPlayer = false;
      s.remote = true;
      s.name = h.name;
    }
  }
  if (mine) game.player = mine;
}

/** Slots a host can give a new human: bots, lowest id first, on the team with fewer humans (team 0 on a tie). */
export function freeSlot(game: Game): Soldier | null {
  const humans: [number, number] = [0, 0];
  for (const s of game.soldiers) if (!isBot(s)) humans[s.team]++;
  const order = humans[1] < humans[0] ? [1, 0] : [0, 1];
  for (const team of order) {
    const s = game.soldiers.find((x) => x.team === team && isBot(x));
    if (s) return s;
  }
  return null;
}

/** Rounds to 2 decimals for the wire. */
export function r2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Shortest signed angle from a to b, in [-PI, PI]. */
export function angleDelta(a: number, b: number): number {
  return Math.atan2(Math.sin(b - a), Math.cos(b - a));
}

/** A buffer for another player's soldier: [x, y, z, yaw, pitch]. Shown a little in the past, blended between snapshots. */
export function soldierInterp(): Interp {
  return new Interp({ pos: [0, 1, 2], angles: [3], snapDist: SNAP_DIST });
}

/** A buffer for a vehicle someone else drives: [x, z, yaw, speed]. */
export function vehicleInterp(): Interp {
  return new Interp({ pos: [0, 1], angles: [2], snapDist: SNAP_DIST });
}
/** Farther than this from its target, a soldier or vehicle snaps instead of sliding (teleports, respawns). */
export const SNAP_DIST = 6;

/** The relay message union is in protocol.ts; this re-export keeps the import list short for net modules. */
export type { FrontMsg };
export type { PlayerInfo };
