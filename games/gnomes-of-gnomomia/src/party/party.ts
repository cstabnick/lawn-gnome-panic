// Parties: up to PARTY.max gnomes (me included) who share kills. Wayfarer helpers (src/companions.ts) are hired
// locally; online players join through relay messages (src/net/protocol.ts: pinv, pans, prost, pleave, pchat).
import { PLAYER_ID, UI, type ClassId, type ZoneId } from '../config';
import { ENEMIES } from '../content';
import { companionSay, localCompanions, setCompanionPartyMember, type CompanionView } from '../companions';
import { entityIdBySyncKey, getEntity, spawnLoot } from '../entities';
import { bus, say } from '../events';
import { player } from '../player';
import { setKillShare } from '../progression';
import { maxHp, state } from '../state';
import { censorText, CHAT_MAX, tidyText } from '@lawn/mp/textFilter';
import {
  readPartyChat,
  readPartyId,
  readPartyRoster,
  type GnoMsg,
  type PartyHelperWire,
} from '../net/protocol';
import {
  PARTY,
  PARTY_CHAT_COLOR,
  PARTY_LINES,
  helperReplyKind,
  helpersToDismiss,
  killShare,
  nextLeader,
  rollPersonalLoot,
  wouldJoin,
} from './partyLogic';
import { partyAchievement } from './partyAchievements';

export interface PartyMember {
  /** self: me. npc: my hired Wayfarer. player: an online player. peer-npc: a Wayfarer the online leader hired. */
  kind: 'self' | 'npc' | 'player' | 'peer-npc';
  /** self: 0. npc: the companion id (localCompanions()). player: the online player id. peer-npc: -1. */
  id: number;
  name: string;
  level: number;
  classId: ClassId | null;
  hp: number;
  /** 0 when unknown (peer-npc): the party frame hides the HP bar. */
  hpMax: number;
  dead: boolean;
  zone: ZoneId | null;
  x: number;
  z: number;
  leader: boolean;
}

/** What the net layer tells the party about another online player. */
export interface PartyPeer {
  id: number;
  name: string;
  color: number;
  zone: ZoneId | null;
  x: number;
  z: number;
  dead: boolean;
  level: number | null;
  classId: ClassId | null;
  hp: number | null;
  hpMax: number | null;
}

export interface PartyNetBridge {
  isOnline(): boolean;
  myId(): number;
  getPeer(id: number): PartyPeer | null;
  send(to: number, msg: GnoMsg): void;
  /** Shows a speech bubble over player `id` (my own id for me). */
  bubble(id: number, text: string): void;
}

export interface PartyInvite {
  pid: string;
  fromId: number;
  fromName: string;
  /** performance.now() ms. */
  expiresAt: number;
}

let net: PartyNetBridge | null = null;
/** The online party, null when not in one. members includes me, sorted ascending. */
let roster: { pid: string; lead: number; members: number[] } | null = null;
/** The leader's helpers while I am a member (from 'prost'). */
let peerHelpers: [string, number][] = [];
/** My hired companion ids, in hire order. */
const helpers: number[] = [];
let incoming: PartyInvite | null = null;
/** Invites I sent: peer id -> { pid, expiresAt }. */
const outgoing = new Map<number, { pid: string; expiresAt: number }>();
/** The pid I said yes to and wait a 'prost' for. */
let joining: string | null = null;
let seq = 1;
let lastChatAt = -Infinity;
const listeners: (() => void)[] = [];

function notify(): void {
  for (const fn of listeners) fn();
}
function me(): number {
  return net?.myId() ?? -1;
}
function online(): boolean {
  return net !== null && net.isOnline() && me() >= 0;
}
function peerName(id: number): string {
  return net?.getPeer(id)?.name ?? 'A gnome';
}
function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}
function companionById(id: number): CompanionView | undefined {
  return localCompanions().find((c) => c.id === id);
}
function send(to: number, msg: GnoMsg): void {
  net?.send(to, msg);
}
function dist(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}
function nowMs(): number {
  return performance.now();
}

export function initParty(): void {
  setKillShare(partyKillShare);
}
export function setPartyNet(bridge: PartyNetBridge | null): void {
  net = bridge;
  notify();
}
export function onPartyChange(fn: () => void): void {
  listeners.push(fn);
}

/** Empty when not in a party; otherwise me first, then online players, my helpers, the leader's helpers. */
export function partyMembers(): readonly PartyMember[] {
  if (!inParty()) return [];
  const out: PartyMember[] = [
    {
      kind: 'self', id: PLAYER_ID, name: 'You', level: state.level, classId: state.classId, hp: state.hp,
      hpMax: maxHp(), dead: player.dead, zone: state.zone, x: player.position.x, z: player.position.z,
      leader: isPartyLeader(),
    },
  ];
  if (roster) {
    for (const id of roster.members) {
      if (id === me()) continue;
      const p = net?.getPeer(id);
      if (!p) continue;
      out.push({
        kind: 'player', id, name: p.name, level: p.level ?? 1, classId: p.classId, hp: p.hp ?? 0,
        hpMax: p.hpMax ?? 0, dead: p.dead, zone: p.zone, x: p.x, z: p.z, leader: id === roster.lead,
      });
    }
  }
  for (const id of helpers) {
    const c = companionById(id);
    if (!c) continue;
    out.push({
      kind: 'npc', id, name: c.name, level: c.level, classId: c.classId, hp: c.hp, hpMax: c.hpMax,
      dead: c.dead, zone: state.zone, x: c.position.x, z: c.position.z, leader: false,
    });
  }
  for (const [name, level] of peerHelpers) {
    out.push({
      kind: 'peer-npc', id: -1, name, level, classId: null, hp: 0, hpMax: 0, dead: false, zone: null,
      x: 0, z: 0, leader: false,
    });
  }
  return out;
}

export function inParty(): boolean {
  return helpers.length > 0 || (roster !== null && roster.members.length > 1);
}

/** True when solo or leading. */
export function isPartyLeader(): boolean {
  return roster === null || roster.lead === me();
}

export function isPartyPeer(peerId: number): boolean {
  return roster !== null && peerId !== me() && roster.members.includes(peerId);
}

export function partyHelperIds(): readonly number[] {
  return helpers;
}

export function hireHelper(companionId: number): boolean {
  const c = companionById(companionId);
  if (!c || c.dead) {
    say('That Wayfarer is not here.', UI.textDim);
    return false;
  }
  if (helpers.includes(companionId)) return false;
  if (dist(player.position.x, player.position.z, c.position.x, c.position.z) > PARTY.inviteRange) {
    say(`${c.name} is too far away to ask along.`, UI.textDim);
    return false;
  }
  if (roster && roster.members.length > 1 && roster.lead !== me()) {
    say('Only the party leader can ask Wayfarers along.', UI.textDim);
    return false;
  }
  if ((roster?.members.length ?? 1) + helpers.length >= PARTY.max) {
    say('Your party is full.', UI.textDim);
    return false;
  }
  if (!wouldJoin(c.personality, c.level, state.level, Math.random)) {
    companionSay(companionId, pick(PARTY_LINES[c.personality].decline));
    say(`${c.name} would rather not.`, UI.textDim);
    return false;
  }
  if (!setCompanionPartyMember(companionId, true)) return false;
  helpers.push(companionId);
  companionSay(companionId, pick(PARTY_LINES[c.personality].join));
  say(`${c.name} joins your party.`, UI.good);
  partyAchievement('formed');
  broadcastRoster();
  notify();
  return true;
}

export function dismissHelper(companionId: number): void {
  if (!helpers.includes(companionId)) return;
  removeHelper(companionId, 'leaves your party.');
  broadcastRoster();
  notify();
}

/** Takes a hired helper out of the party: it goes back to questing and says its leave line. No notify. */
function removeHelper(id: number, verb: string): void {
  const idx = helpers.indexOf(id);
  if (idx < 0) return;
  helpers.splice(idx, 1);
  const c = companionById(id);
  setCompanionPartyMember(id, false);
  if (c) {
    companionSay(id, pick(PARTY_LINES[c.personality].leave));
    say(`${c.name} ${verb}`, UI.textDim);
  }
}

function broadcastRoster(): void {
  if (!online() || !roster || roster.lead !== me()) return;
  const h: PartyHelperWire[] = [];
  for (const id of helpers) {
    const c = companionById(id);
    if (c) h.push([c.name, c.level]);
  }
  for (const id of roster.members) {
    if (id !== me()) send(id, { k: 'prost', pid: roster.pid, lead: me(), m: [...roster.members], h });
  }
}

function dropHelpersFor(onlineCount: number, isLeader: boolean): void {
  for (const id of helpersToDismiss(onlineCount, helpers, isLeader)) removeHelper(id, 'steps aside for the party.');
}

export function invitePlayer(peerId: number): boolean {
  if (!online()) {
    say('You are not online.', UI.textDim);
    return false;
  }
  const peer = net?.getPeer(peerId);
  if (!peer) {
    say('That gnome is not nearby.', UI.textDim);
    return false;
  }
  if (isPartyPeer(peerId)) {
    say(`${peer.name} is already in your party.`, UI.textDim);
    return false;
  }
  if (roster && roster.lead !== me()) {
    say('Only the party leader can invite.', UI.textDim);
    return false;
  }
  if ((roster?.members.length ?? 1) >= PARTY.max) {
    say('Your party is full.', UI.textDim);
    return false;
  }
  if (outgoing.has(peerId)) {
    say(`You already invited ${peer.name}.`, UI.textDim);
    return false;
  }
  const pid = roster?.pid ?? Array.from(outgoing.values())[0]?.pid ?? `${me()}:${seq++}`;
  send(peerId, { k: 'pinv', pid });
  outgoing.set(peerId, { pid, expiresAt: nowMs() + PARTY.inviteTtlS * 1000 });
  say(`You invited ${peer.name} to your party.`, UI.textDim);
  notify();
  return true;
}

export function pendingInvite(): PartyInvite | null {
  return incoming;
}

export function acceptInvite(): void {
  if (!incoming) return;
  if (roster && roster.members.length > 1) leaveParty();
  send(incoming.fromId, { k: 'pans', pid: incoming.pid, ok: true });
  joining = incoming.pid;
  incoming = null;
  notify();
}

export function declineInvite(): void {
  if (!incoming) return;
  send(incoming.fromId, { k: 'pans', pid: incoming.pid, ok: false });
  incoming = null;
  notify();
}

export function kickPlayer(peerId: number): void {
  if (!roster || roster.lead !== me() || peerId === me() || !roster.members.includes(peerId)) return;
  const name = peerName(peerId);
  send(peerId, { k: 'pleave', pid: roster.pid });
  const members = roster.members.filter((m) => m !== peerId);
  if (members.length < 2) roster = null;
  else {
    roster = { pid: roster.pid, lead: roster.lead, members };
    broadcastRoster();
  }
  say(`${name} was removed from the party.`, UI.textDim);
  notify();
}

export function leaveParty(): void {
  if (roster) {
    const { pid, lead, members } = roster;
    if (lead === me()) {
      const remaining = members.filter((m) => m !== me());
      if (remaining.length >= 2) {
        const newLead = Math.min(...remaining);
        for (const id of remaining) send(id, { k: 'prost', pid, lead: newLead, m: remaining, h: [] });
      } else if (remaining.length === 1) {
        send(remaining[0], { k: 'pleave', pid });
      }
    } else {
      send(lead, { k: 'pleave', pid });
    }
  }
  roster = null;
  peerHelpers = [];
  joining = null;
  for (const id of [...helpers]) removeHelper(id, 'leaves your party.');
  say('You left the party.', UI.textDim);
  notify();
}

export function sayToParty(text: string): void {
  const t = tidyText(text).slice(0, CHAT_MAX);
  if (!t) return;
  if (!inParty()) {
    say('You are not in a party. Tap 👥 to find one.', UI.textDim);
    return;
  }
  if (nowMs() - lastChatAt < PARTY.chatGapMs) {
    say('Slow down a little.', UI.textDim);
    return;
  }
  lastChatAt = nowMs();
  if (online() && roster && roster.members.length > 1) {
    const pid = roster.pid;
    for (const id of roster.members) {
      if (id !== me()) send(id, { k: 'pchat', pid, t });
    }
    net?.bubble(me(), censorText(t));
  }
  say(`[Party] You: ${censorText(t)}`, PARTY_CHAT_COLOR);
  const kind = helperReplyKind(t);
  if (kind) {
    const alive = helpers
      .map((id) => companionById(id))
      .filter((c): c is CompanionView => c !== undefined && !c.dead);
    if (alive.length > 0) {
      const c = pick(alive);
      companionSay(c.id, pick(PARTY_LINES[c.personality][kind]));
    }
  }
}

/** XP multiplier for a kill on this client: how many party gnomes (and Wayfarers) share it. */
export function partyKillShare(entityId: number): number {
  const e = getEntity(entityId);
  if (!e) return 1;
  const ex = e.position.x;
  const ez = e.position.z;
  let players = 1;
  if (roster) {
    for (const id of roster.members) {
      if (id === me()) continue;
      const p = net?.getPeer(id);
      if (p && !p.dead && p.zone === state.zone && dist(p.x, p.z, ex, ez) <= PARTY.shareRadius) players++;
    }
  }
  let helpersNear = 0;
  for (const id of helpers) {
    const c = companionById(id);
    if (c && !c.dead && dist(c.position.x, c.position.z, ex, ez) <= PARTY.shareRadius) helpersNear++;
  }
  if (roster && roster.lead !== me()) {
    const leader = net?.getPeer(roster.lead);
    if (leader && dist(leader.x, leader.z, ex, ez) <= PARTY.shareRadius) helpersNear += peerHelpers.length;
  }
  if (players + helpersNear > 1) partyAchievement('shared-kill');
  return killShare(players, helpersNear);
}

/** An online party member killed an enemy near me: I get the shared XP, kill credit and a personal loot roll. */
export function partyOnRemoteKill(killerId: number, syncKey: string): void {
  if (!isPartyPeer(killerId) || player.dead) return;
  const id = entityIdBySyncKey(syncKey);
  const e = id !== undefined ? getEntity(id) : undefined;
  const def = e && e.kind === 'enemy' ? ENEMIES[e.defId] : undefined;
  if (!e || !def) return;
  if (dist(player.position.x, player.position.z, e.position.x, e.position.z) > PARTY.shareRadius) return;
  const share = partyKillShare(e.id);
  bus.emit('enemy-killed', { defId: def.id, entityId: e.id, byPlayer: true, share });
  const loot = rollPersonalLoot(def, share, Math.random);
  if (loot.items.length > 0 || loot.gold > 0) spawnLoot(e.position.x + 0.6, e.position.z, loot.items, loot.gold);
  say(`Your party defeated the ${def.name}.`, UI.good);
}

export function handlePartyMessage(from: number, msg: GnoMsg): void {
  if (!online()) return;
  switch (msg.k) {
    case 'pinv': {
      const pid = readPartyId(msg.pid);
      if (!pid) return;
      if ((roster && roster.members.length > 1) || incoming || joining) {
        send(from, { k: 'pans', pid, ok: false });
        return;
      }
      incoming = { pid, fromId: from, fromName: peerName(from), expiresAt: nowMs() + PARTY.inviteTtlS * 1000 };
      say(`${peerName(from)} invites you to their party. Tap 👥 to answer.`, UI.quest);
      notify();
      return;
    }
    case 'pans': {
      const out = outgoing.get(from);
      const pid = readPartyId(msg.pid);
      if (!out || !pid || out.pid !== pid) return;
      outgoing.delete(from);
      if (!msg.ok) {
        say(`${peerName(from)} said no to your invite.`, UI.textDim);
        notify();
        return;
      }
      if (roster && (roster.pid !== out.pid || roster.lead !== me())) {
        send(from, { k: 'pleave', pid: out.pid });
        notify();
        return;
      }
      if (!roster) roster = { pid: out.pid, lead: me(), members: [me()] };
      if (roster.members.length >= PARTY.max) {
        send(from, { k: 'pleave', pid: out.pid });
        say('Your party is full.', UI.textDim);
        notify();
        return;
      }
      const members = roster.members.includes(from) ? roster.members : [...roster.members, from].sort((a, b) => a - b);
      roster = { pid: roster.pid, lead: roster.lead, members };
      dropHelpersFor(members.length, true);
      broadcastRoster();
      say(`${peerName(from)} joined your party.`, UI.good);
      partyAchievement('formed');
      partyAchievement('online');
      notify();
      return;
    }
    case 'prost': {
      const pid = readPartyId(msg.pid);
      const r = readPartyRoster(msg.lead, msg.m, msg.h);
      if (!pid || !r) return;
      const accepted =
        (joining === pid && from === r.lead) ||
        (roster !== null && roster.pid === pid && (from === roster.lead || from === r.lead));
      if (!accepted) return;
      joining = null;
      if (!r.m.includes(me())) {
        roster = null;
        peerHelpers = [];
        say('You are no longer in the party.', UI.textDim);
        notify();
        return;
      }
      const first = roster === null;
      roster = { pid, lead: r.lead, members: r.m };
      peerHelpers = r.lead === me() ? [] : r.h;
      if (r.lead !== me()) {
        dropHelpersFor(r.m.length, false);
      } else if (from !== me()) {
        broadcastRoster();
        say('You lead the party now.', UI.quest);
      }
      if (first) {
        say(`You joined ${peerName(r.lead)}'s party.`, UI.good);
        partyAchievement('formed');
        partyAchievement('online');
      }
      notify();
      return;
    }
    case 'pleave': {
      const pid = readPartyId(msg.pid);
      if (!pid) return;
      if (!roster || roster.pid !== pid) {
        if (joining === pid) {
          joining = null;
          say('That party is full.', UI.textDim);
          notify();
        }
        return;
      }
      if (roster.lead === me() && from !== me() && roster.members.includes(from)) {
        const name = peerName(from);
        const members = roster.members.filter((m) => m !== from);
        if (members.length < 2) roster = null;
        else {
          roster = { pid: roster.pid, lead: roster.lead, members };
          broadcastRoster();
        }
        say(`${name} left the party.`, UI.textDim);
      } else if (from === roster.lead) {
        roster = null;
        peerHelpers = [];
        say('The party has broken up.', UI.textDim);
      }
      notify();
      return;
    }
    case 'pchat': {
      const pid = readPartyId(msg.pid);
      if (!roster || !pid || pid !== roster.pid || !roster.members.includes(from)) return;
      const text = readPartyChat(msg.t);
      if (!text) return;
      say(`[Party] ${peerName(from)}: ${text}`, PARTY_CHAT_COLOR);
      net?.bubble(from, text);
      return;
    }
    default:
      return;
  }
}

export function handlePartyPeerLeft(peerId: number): void {
  outgoing.delete(peerId);
  if (incoming?.fromId === peerId) incoming = null;
  if (roster && roster.members.includes(peerId)) {
    if (peerId === roster.lead) {
      const nl = nextLeader(roster.members, peerId);
      if (nl === null) {
        roster = null;
        peerHelpers = [];
      } else {
        roster = { pid: roster.pid, lead: nl, members: roster.members.filter((m) => m !== peerId) };
        peerHelpers = [];
        if (nl === me()) {
          broadcastRoster();
          say('You lead the party now.', UI.quest);
        }
      }
    } else {
      const members = roster.members.filter((m) => m !== peerId);
      if (members.length < 2) roster = null;
      else {
        roster = { pid: roster.pid, lead: roster.lead, members };
        if (roster.lead === me()) broadcastRoster();
      }
    }
  }
  notify();
}

export function handlePartyOffline(): void {
  roster = null;
  peerHelpers = [];
  incoming = null;
  outgoing.clear();
  joining = null;
  notify();
}

export function updateParty(_dt: number): void {
  const now = nowMs();
  let changed = false;
  if (incoming && now >= incoming.expiresAt) {
    send(incoming.fromId, { k: 'pans', pid: incoming.pid, ok: false });
    say(`The invite from ${incoming.fromName} ran out.`, UI.textDim);
    incoming = null;
    changed = true;
  }
  for (const [id, o] of Array.from(outgoing.entries())) {
    if (now < o.expiresAt) continue;
    outgoing.delete(id);
    say(`${peerName(id)} did not answer.`, UI.textDim);
    if (roster && roster.members.length < 2) roster = null;
    changed = true;
  }
  for (const id of [...helpers]) {
    if (companionById(id)) continue;
    helpers.splice(helpers.indexOf(id), 1);
    changed = true;
  }
  if (changed) notify();
}
