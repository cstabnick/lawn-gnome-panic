// Player-to-player trading state machine on top of Gnomomia's MMO relay.
// Uses revision-tagged offers and lower-id commit coordination so simultaneous edits never race or duplicate items.
import { INVENTORY_SIZE, UI, type InvSlot, type ZoneId } from '../config';
import { ITEMS } from '../content';
import { spawnLoot } from '../entities';
import { bus, say } from '../events';
import { addItem, countItem, removeItem } from '../inventory';
import { player } from '../player';
import { state } from '../state';
import { readTradeId, readTradeItems, type GnoMsg, type TradeItem } from './protocol';

/** Maximum distance (m) to start a trade. */
export const TRADE_RANGE = 15;
/** Maximum distance (m) before an open trade automatically cancels. */
export const TRADE_BREAK_RANGE = 22;
/** How long an unanswered trade request stays open (ms). */
const REQUEST_TTL_MS = 30_000;

export interface TradePeerInfo {
  id: number;
  name: string;
  color: number;
  zone: ZoneId | null;
  x: number;
  z: number;
  dead: boolean;
}

export interface TradeNetBridge {
  isOnline(): boolean;
  myId(): number;
  getPeer(id: number): TradePeerInfo | null;
  send(to: number, msg: GnoMsg): void;
}

export interface IncomingTradeRequest {
  tid: string;
  peerId: number;
  peerName: string;
  peerColor: number;
  expiresAt: number;
}

export interface OutgoingTradeRequest {
  tid: string;
  peerId: number;
  peerName: string;
  expiresAt: number;
}

export interface TradeSession {
  tid: string;
  peerId: number;
  peerName: string;
  peerColor: number;
  myItems: Map<string, number>;
  myGold: number;
  myRev: number;
  myReady: boolean;
  peerItems: Map<string, number>;
  peerGold: number;
  peerRev: number;
  peerReady: boolean;
  committing: boolean;
}

export interface TradeSnapshot {
  incoming: IncomingTradeRequest | null;
  outgoing: OutgoingTradeRequest | null;
  session: TradeSession | null;
}

let net: TradeNetBridge | null = null;
let incoming: IncomingTradeRequest | null = null;
let outgoing: OutgoingTradeRequest | null = null;
let session: TradeSession | null = null;
let nextTradeSeq = 1;
const listeners: (() => void)[] = [];

function notify(): void {
  for (const fn of listeners) fn();
}

export function onTradeChange(fn: () => void): void {
  listeners.push(fn);
}

export function setTradeNet(bridge: TradeNetBridge | null): void {
  net = bridge;
  if (bridge === null) {
    incoming = null;
    outgoing = null;
    session = null;
    notify();
  }
}

export function getTradeState(): TradeSnapshot {
  return { incoming, outgoing, session };
}

export function isTradeOpen(): boolean {
  return session !== null;
}

/** Pure inventory capacity check: can `inv` hold `adding` after removing `removing`? */
export function canFitTrade(
  inv: readonly (InvSlot | null)[],
  removing: Iterable<[string, number]>,
  adding: Iterable<[string, number]>,
): boolean {
  const copy: (InvSlot | null)[] = inv.map((s) => (s ? { item: s.item, count: s.count } : null));
  while (copy.length < INVENTORY_SIZE) copy.push(null);

  for (const [item, count] of removing) {
    let left = count;
    for (let i = 0; i < copy.length && left > 0; i++) {
      const s = copy[i];
      if (!s || s.item !== item) continue;
      const take = Math.min(s.count, left);
      s.count -= take;
      left -= take;
      if (s.count <= 0) copy[i] = null;
    }
    if (left > 0) return false;
  }

  for (const [item, count] of adding) {
    const def = ITEMS[item];
    if (!def) return false;
    let left = count;
    if (def.stackable) {
      const stack = copy.find((s) => s?.item === item);
      if (stack) {
        stack.count += left;
        left = 0;
      }
    }
    for (let i = 0; i < INVENTORY_SIZE && left > 0; i++) {
      if (copy[i] !== null) continue;
      if (def.stackable) {
        copy[i] = { item, count: left };
        left = 0;
      } else {
        copy[i] = { item, count: 1 };
        left -= 1;
      }
    }
    if (left > 0) return false;
  }
  return true;
}

/** How many of `itemId` the player still has in their pack and has not yet put into the trade offer. */
export function availableTradeCount(itemId: string): number {
  const def = ITEMS[itemId];
  if (!def || def.questItem) return 0;
  const offered = session?.myItems.get(itemId) ?? 0;
  return Math.max(0, countItem(itemId) - offered);
}

/** Whether the local player currently has enough inventory space and gold for the active trade session. */
export function canAcceptCurrentTrade(): { ok: boolean; reason?: string } {
  if (!session) return { ok: false, reason: 'No active trade.' };
  if (session.myGold > state.gold) return { ok: false, reason: 'Not enough gold.' };
  for (const [item, count] of session.myItems) {
    if (countItem(item) < count) return { ok: false, reason: 'Offered items are no longer in your pack.' };
  }
  if (!canFitTrade(state.inventory, session.myItems.entries(), session.peerItems.entries())) {
    return { ok: false, reason: 'Not enough inventory space.' };
  }
  return { ok: true };
}

function peerInRange(peer: TradePeerInfo, maxDist: number): boolean {
  if (peer.zone !== null && peer.zone !== state.zone) return false;
  return Math.hypot(peer.x - player.position.x, peer.z - player.position.z) <= maxDist;
}

function openSession(tid: string, peer: TradePeerInfo): void {
  incoming = null;
  outgoing = null;
  session = {
    tid,
    peerId: peer.id,
    peerName: peer.name,
    peerColor: peer.color,
    myItems: new Map(),
    myGold: 0,
    myRev: 0,
    myReady: false,
    peerItems: new Map(),
    peerGold: 0,
    peerRev: 0,
    peerReady: false,
    committing: false,
  };
  say(`Trading with ${peer.name}.`, UI.quest);
  notify();
}

function sendMyOffer(): void {
  if (!session || !net?.isOnline()) return;
  session.myRev += 1;
  session.myReady = false;
  session.peerReady = false;
  session.committing = false;
  const items: TradeItem[] = [];
  for (const [item, count] of session.myItems) {
    if (count > 0) items.push([item, count]);
  }
  net.send(session.peerId, {
    k: 'toff',
    tid: session.tid,
    items,
    gold: session.myGold,
    rev: session.myRev,
  });
  notify();
}

function executeLocalSwap(s: TradeSession): void {
  const receivedNames: string[] = [];
  for (const [item, count] of s.myItems) {
    removeItem(item, count);
  }
  state.gold = Math.max(0, state.gold - s.myGold) + s.peerGold;
  for (const [item, count] of s.peerItems) {
    const before = countItem(item);
    addItem(item, count);
    const got = countItem(item) - before;
    const name = ITEMS[item]?.name ?? item;
    if (got > 0) receivedNames.push(got > 1 ? `${got} × ${name}` : name);
    if (got < count) {
      // Safety fallback: drop overflow at player's feet so items are never lost.
      spawnLoot(player.position.x, player.position.z, [{ item, count: count - got }], 0, { sync: true });
    }
  }
  if (s.peerGold > 0) receivedNames.push(`${s.peerGold} gp`);
  const summary = receivedNames.length > 0 ? ` Received: ${receivedNames.join(', ')}.` : '';
  say(`Trade with ${s.peerName} complete!${summary}`, UI.good);
  bus.emit('changed', {});
}

function maybeCommit(): void {
  if (!session || !net?.isOnline()) return;
  if (!session.myReady || !session.peerReady) return;
  // Lower player id commits first and notifies peer via 'tdone' so both sides finalize atomically.
  if (net.myId() >= session.peerId) {
    session.committing = true;
    notify();
    return;
  }
  const check = canAcceptCurrentTrade();
  if (!check.ok) {
    say(check.reason ?? 'Cannot complete trade.', UI.bad);
    cancelTrade('space');
    return;
  }
  const doneSession = session;
  net.send(doneSession.peerId, {
    k: 'tdone',
    tid: doneSession.tid,
    myRev: doneSession.myRev,
    peerRev: doneSession.peerRev,
  });
  session = null;
  executeLocalSwap(doneSession);
  notify();
}

// ---------------------------------------------------------------- public actions

export function requestTrade(peerId: number): boolean {
  if (!net?.isOnline()) {
    say('You must be online to trade with other players.', UI.bad);
    return false;
  }
  if (player.dead) {
    say('You cannot trade while defeated.', UI.bad);
    return false;
  }
  if (session) {
    say(`Finish your trade with ${session.peerName} first.`, UI.bad);
    return false;
  }
  const peer = net.getPeer(peerId);
  if (!peer) {
    say('That gnome is no longer online.', UI.bad);
    return false;
  }
  if (peer.dead) {
    say(`${peer.name} is defeated and cannot trade right now.`, UI.bad);
    return false;
  }
  if (!peerInRange(peer, TRADE_RANGE)) {
    say(`Move closer to ${peer.name} to trade.`, UI.bad);
    return false;
  }
  // If they already requested a trade with us, accept it right away.
  if (incoming && incoming.peerId === peerId) {
    acceptTradeRequest();
    return true;
  }
  if (outgoing && outgoing.peerId === peerId) {
    say(`Waiting for ${peer.name} to respond to your trade request.`, UI.textDim);
    return true;
  }
  if (outgoing) {
    net.send(outgoing.peerId, { k: 'tdec', tid: outgoing.tid, r: 'cancelled' });
    outgoing = null;
  }
  const tid = `t:${net.myId()}:${nextTradeSeq++}`;
  outgoing = { tid, peerId: peer.id, peerName: peer.name, expiresAt: performance.now() + REQUEST_TTL_MS };
  net.send(peer.id, { k: 'treq', tid });
  say(`Trade request sent to ${peer.name}.`, UI.quest);
  notify();
  return true;
}

export function acceptTradeRequest(): void {
  if (!incoming || !net?.isOnline()) return;
  const req = incoming;
  const peer = net.getPeer(req.peerId);
  if (!peer || peer.dead || player.dead || !peerInRange(peer, TRADE_BREAK_RANGE)) {
    net.send(req.peerId, { k: 'tdec', tid: req.tid, r: 'far' });
    incoming = null;
    say(peer ? `${peer.name} is too far away to trade.` : 'That gnome is no longer online.', UI.bad);
    notify();
    return;
  }
  net.send(req.peerId, { k: 'tacc', tid: req.tid });
  openSession(req.tid, peer);
}

export function declineTradeRequest(): void {
  if (!incoming) return;
  const req = incoming;
  incoming = null;
  if (net?.isOnline()) net.send(req.peerId, { k: 'tdec', tid: req.tid, r: 'declined' });
  say(`Declined trade request from ${req.peerName}.`, UI.textDim);
  notify();
}

export function cancelOutgoingRequest(): void {
  if (!outgoing) return;
  const req = outgoing;
  outgoing = null;
  if (net?.isOnline()) net.send(req.peerId, { k: 'tdec', tid: req.tid, r: 'cancelled' });
  say(`Cancelled trade request to ${req.peerName}.`, UI.textDim);
  notify();
}

export function offerItem(itemId: string, delta: number): void {
  if (!session || delta === 0) return;
  const def = ITEMS[itemId];
  if (!def || def.questItem) {
    say('Quest items cannot be traded.', UI.bad);
    return;
  }
  const curr = session.myItems.get(itemId) ?? 0;
  const max = countItem(itemId);
  const next = Math.max(0, Math.min(max, curr + delta));
  if (next === curr) return;
  if (next === 0) session.myItems.delete(itemId);
  else session.myItems.set(itemId, next);
  sendMyOffer();
}

export function setOfferGold(amount: number): void {
  if (!session) return;
  const clamped = Math.max(0, Math.min(state.gold, Math.floor(Number.isFinite(amount) ? amount : 0)));
  if (clamped === session.myGold) return;
  session.myGold = clamped;
  sendMyOffer();
}

export function toggleAcceptTrade(): void {
  if (!session || !net?.isOnline()) return;
  if (!session.myReady) {
    const check = canAcceptCurrentTrade();
    if (!check.ok) {
      say(check.reason ?? 'Cannot accept trade.', UI.bad);
      return;
    }
    session.myReady = true;
  } else {
    session.myReady = false;
    session.committing = false;
  }
  net.send(session.peerId, {
    k: 'tok',
    tid: session.tid,
    myRev: session.myRev,
    peerRev: session.peerRev,
    ok: session.myReady,
  });
  notify();
  if (session.myReady && session.peerReady) maybeCommit();
}

export function cancelTrade(reason = 'cancelled'): void {
  if (session) {
    const s = session;
    session = null;
    if (net?.isOnline()) net.send(s.peerId, { k: 'tdec', tid: s.tid, r: reason });
    if (reason === 'far') say(`Trade with ${s.peerName} cancelled (moved too far apart).`, UI.textDim);
    else if (reason === 'cancelled') say(`Trade with ${s.peerName} cancelled.`, UI.textDim);
    notify();
    return;
  }
  if (outgoing) cancelOutgoingRequest();
}

// ---------------------------------------------------------------- network handlers

function declineReasonText(peerName: string, reason?: string): string {
  if (reason === 'busy') return `${peerName} is busy right now.`;
  if (reason === 'declined') return `${peerName} declined your trade request.`;
  if (reason === 'far') return `${peerName} is too far away to trade.`;
  if (reason === 'space') return `${peerName} did not have enough inventory space.`;
  return `${peerName} cancelled the trade.`;
}

export function handleTradeMessage(fromId: number, msg: GnoMsg): void {
  if (!net?.isOnline()) return;
  const peer = net.getPeer(fromId);

  if (msg.k === 'treq') {
    const tid = readTradeId(msg.tid);
    if (!tid || !peer) return;
    if (session || player.dead || (incoming && incoming.peerId !== fromId)) {
      net.send(fromId, { k: 'tdec', tid, r: 'busy' });
      return;
    }
    if (!peerInRange(peer, TRADE_BREAK_RANGE)) {
      net.send(fromId, { k: 'tdec', tid, r: 'far' });
      return;
    }
    if (outgoing && outgoing.peerId === fromId) {
      net.send(fromId, { k: 'tacc', tid });
      openSession(tid, peer);
      return;
    }
    incoming = { tid, peerId: peer.id, peerName: peer.name, peerColor: peer.color, expiresAt: performance.now() + REQUEST_TTL_MS };
    say(`${peer.name} wants to trade with you.`, UI.quest);
    notify();
    return;
  }

  if (msg.k === 'tacc') {
    const tid = readTradeId(msg.tid);
    if (!tid || !peer || !outgoing || outgoing.tid !== tid || outgoing.peerId !== fromId) return;
    openSession(tid, peer);
    return;
  }

  if (msg.k === 'tdec') {
    const tid = readTradeId(msg.tid);
    if (!tid) return;
    const reason = typeof msg.r === 'string' ? msg.r.slice(0, 24) : undefined;
    if (outgoing && outgoing.tid === tid && outgoing.peerId === fromId) {
      const name = outgoing.peerName;
      outgoing = null;
      say(declineReasonText(name, reason), UI.textDim);
      notify();
      return;
    }
    if (incoming && incoming.tid === tid && incoming.peerId === fromId) {
      const name = incoming.peerName;
      incoming = null;
      say(`${name} cancelled the trade request.`, UI.textDim);
      notify();
      return;
    }
    if (session && session.tid === tid && session.peerId === fromId) {
      const name = session.peerName;
      session = null;
      say(declineReasonText(name, reason), UI.textDim);
      notify();
    }
    return;
  }

  if (msg.k === 'toff') {
    const tid = readTradeId(msg.tid);
    if (!tid || !session || session.tid !== tid || session.peerId !== fromId) return;
    const items = readTradeItems(msg.items);
    const gold = typeof msg.gold === 'number' && Number.isFinite(msg.gold) && msg.gold >= 0 && msg.gold <= 1e9 ? Math.floor(msg.gold) : null;
    const rev = typeof msg.rev === 'number' && Number.isFinite(msg.rev) && msg.rev > session.peerRev ? Math.floor(msg.rev) : null;
    if (items === null || gold === null || rev === null) return;
    const map = new Map<string, number>();
    for (const [id, count] of items) map.set(id, (map.get(id) ?? 0) + count);
    session.peerItems = map;
    session.peerGold = gold;
    session.peerRev = rev;
    session.myReady = false;
    session.peerReady = false;
    session.committing = false;
    notify();
    return;
  }

  if (msg.k === 'tok') {
    const tid = readTradeId(msg.tid);
    if (!tid || !session || session.tid !== tid || session.peerId !== fromId) return;
    // Peer's myRev is our peerRev; peer's peerRev is our myRev.
    if (msg.myRev !== session.peerRev || msg.peerRev !== session.myRev) return;
    session.peerReady = Boolean(msg.ok);
    if (!session.peerReady) session.committing = false;
    notify();
    if (session.myReady && session.peerReady) maybeCommit();
    return;
  }

  if (msg.k === 'tdone') {
    const tid = readTradeId(msg.tid);
    if (!tid || !session || session.tid !== tid || session.peerId !== fromId) return;
    if (msg.myRev !== session.peerRev || msg.peerRev !== session.myRev) return;
    if (!session.myReady) return;
    const doneSession = session;
    session = null;
    executeLocalSwap(doneSession);
    notify();
  }
}

export function handleTradePeerLeft(peerId: number): void {
  let dirty = false;
  if (incoming && incoming.peerId === peerId) {
    incoming = null;
    dirty = true;
  }
  if (outgoing && outgoing.peerId === peerId) {
    say(`${outgoing.peerName} left Gnomomia.`, UI.textDim);
    outgoing = null;
    dirty = true;
  }
  if (session && session.peerId === peerId) {
    say(`Trade cancelled because ${session.peerName} left Gnomomia.`, UI.textDim);
    session = null;
    dirty = true;
  }
  if (dirty) notify();
}

export function handleTradeOffline(): void {
  if (!incoming && !outgoing && !session) return;
  incoming = null;
  outgoing = null;
  session = null;
  notify();
}

/** Per frame: expire old requests, cancel if players walk apart or die, clamp offers if inventory changed. */
export function updateTrade(): void {
  const now = performance.now();
  if (incoming && now >= incoming.expiresAt) {
    incoming = null;
    notify();
  }
  if (outgoing && now >= outgoing.expiresAt) {
    say(`Trade request to ${outgoing.peerName} timed out.`, UI.textDim);
    outgoing = null;
    notify();
  }
  if (!session || !net?.isOnline()) return;

  if (player.dead) {
    cancelTrade('cancelled');
    return;
  }
  const peer = net.getPeer(session.peerId);
  if (!peer || peer.dead || !peerInRange(peer, TRADE_BREAK_RANGE)) {
    cancelTrade('far');
    return;
  }

  // Clamp local offer if the player drank a potion or spent gold while the trade window was open.
  let offerChanged = false;
  if (session.myGold > state.gold) {
    session.myGold = state.gold;
    offerChanged = true;
  }
  for (const [item, count] of [...session.myItems.entries()]) {
    const have = countItem(item);
    if (have < count) {
      if (have <= 0) session.myItems.delete(item);
      else session.myItems.set(item, have);
      offerChanged = true;
    }
  }
  if (offerChanged) sendMyOffer();
}
