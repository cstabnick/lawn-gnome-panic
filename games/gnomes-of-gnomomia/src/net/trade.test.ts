import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INVENTORY_SIZE } from '../config';
import { ITEMS } from '../content';
import { addItem, countItem } from '../inventory';
import { player } from '../player';
import { newGameState, state } from '../state';
import { readTradeItems, type GnoMsg } from './protocol';
import {
  acceptTradeRequest,
  cancelTrade,
  canAcceptCurrentTrade,
  canFitTrade,
  getTradeState,
  handleTradeMessage,
  handleTradePeerLeft,
  offerItem,
  requestTrade,
  setOfferGold,
  setTradeNet,
  toggleAcceptTrade,
  type TradeNetBridge,
  type TradePeerInfo,
} from './trade';

function makePeer(overrides: Partial<TradePeerInfo> = {}): TradePeerInfo {
  return {
    id: 2,
    name: 'Barnaby',
    color: 0x5cff7a,
    zone: 'mossbottom',
    x: 4,
    z: 4,
    dead: false,
    ...overrides,
  };
}

function makeBridge(myId: number, peer: TradePeerInfo | null = makePeer()): {
  bridge: TradeNetBridge;
  sent: { to: number; msg: GnoMsg }[];
} {
  const sent: { to: number; msg: GnoMsg }[] = [];
  const bridge: TradeNetBridge = {
    isOnline: () => true,
    myId: () => myId,
    getPeer: (id) => (peer && peer.id === id ? peer : null),
    send: (to, msg) => sent.push({ to, msg }),
  };
  return { bridge, sent };
}

describe('trade protocol & capacity helpers', () => {
  it('rejects quest items in readTradeItems', () => {
    const questItem = Object.values(ITEMS).find((i) => i.questItem);
    expect(readTradeItems([['beer', 2]])).toEqual([['beer', 2]]);
    if (questItem) {
      expect(readTradeItems([[questItem.id, 1]])).toBeNull();
    }
  });

  it('canFitTrade accounts for freed slots and stackables', () => {
    const nonStackable = Object.values(ITEMS).find((i) => !i.stackable && !i.questItem)!;
    const fullInv = Array.from({ length: INVENTORY_SIZE }, () => ({ item: nonStackable.id, count: 1 }));
    // Full bag cannot receive an extra non-stackable item without giving one up.
    expect(canFitTrade(fullInv, [], [[nonStackable.id, 1]])).toBe(false);
    // Giving one up frees a slot for the incoming item.
    expect(canFitTrade(fullInv, [[nonStackable.id, 1]], [[nonStackable.id, 1]])).toBe(true);
    // Two incoming items for one outgoing still fails.
    expect(canFitTrade(fullInv, [[nonStackable.id, 1]], [[nonStackable.id, 2]])).toBe(false);
  });
});

describe('player-to-player trade state machine', () => {
  beforeEach(() => {
    Object.assign(state, newGameState());
    state.zone = 'mossbottom';
    state.gold = 50;
    player.position.set(3, 0, 3);
    player.dead = false;
  });

  afterEach(() => {
    setTradeNet(null);
  });

  it('completes a trade cleanly when lower-id player commits and sends tdone', () => {
    const peer = makePeer({ id: 2, name: 'Barnaby' });
    const { bridge, sent } = makeBridge(1, peer);
    setTradeNet(bridge);

    addItem('beer', 3);
    expect(requestTrade(2)).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0].msg.k).toBe('treq');
    const tid = (sent[0].msg as { k: 'treq'; tid: string }).tid;

    // Peer accepts request.
    handleTradeMessage(2, { k: 'tacc', tid });
    expect(getTradeState().session?.peerId).toBe(2);

    // Local offers 2 beer and 15 gold.
    offerItem('beer', 2);
    setOfferGold(15);
    const s = getTradeState().session!;
    expect(s.myRev).toBe(2);
    expect(s.myItems.get('beer')).toBe(2);
    expect(s.myGold).toBe(15);

    // Peer offers 1 cigs and 5 gold.
    handleTradeMessage(2, { k: 'toff', tid, items: [['cigs', 1]], gold: 5, rev: 1 });
    expect(s.peerItems.get('cigs')).toBe(1);
    expect(s.peerGold).toBe(5);
    expect(s.myReady).toBe(false);

    // Local accepts first.
    toggleAcceptTrade();
    expect(s.myReady).toBe(true);

    // Stale tok with wrong rev is ignored.
    handleTradeMessage(2, { k: 'tok', tid, myRev: 1, peerRev: 1, ok: true });
    expect(getTradeState().session).not.toBeNull();

    // Matching tok arrives -> lower-id (1 < 2) commits immediately and sends tdone!
    handleTradeMessage(2, { k: 'tok', tid, myRev: 1, peerRev: 2, ok: true });
    expect(getTradeState().session).toBeNull();
    expect(sent[sent.length - 1].msg).toEqual({ k: 'tdone', tid, myRev: 2, peerRev: 1 });

    // Local inventory & gold updated accurately: 3 - 2 = 1 beer, +1 cigs, 50 - 15 + 5 = 40 gp.
    expect(countItem('beer')).toBe(1);
    expect(countItem('cigs')).toBe(1);
    expect(state.gold).toBe(40);
  });

  it('higher-id player waits for tdone before swapping items', () => {
    const peer = makePeer({ id: 1, name: 'Alder' });
    const { bridge, sent } = makeBridge(4, peer);
    setTradeNet(bridge);

    addItem('cigs', 2);

    // Incoming request from player 1.
    handleTradeMessage(1, { k: 'treq', tid: 't:1:1' });
    expect(getTradeState().incoming?.peerId).toBe(1);
    acceptTradeRequest();
    expect(getTradeState().session?.tid).toBe('t:1:1');

    offerItem('cigs', 1);
    handleTradeMessage(1, { k: 'toff', tid: 't:1:1', items: [['beer', 2]], gold: 10, rev: 1 });

    // Peer accepts first, then local accepts.
    handleTradeMessage(1, { k: 'tok', tid: 't:1:1', myRev: 1, peerRev: 1, ok: true });
    toggleAcceptTrade();

    // Higher-id (4 > 1) enters committing state and does NOT swap until tdone arrives.
    expect(getTradeState().session?.committing).toBe(true);
    expect(countItem('cigs')).toBe(2);
    expect(sent.some((x) => x.msg.k === 'tdone')).toBe(false);

    handleTradeMessage(1, { k: 'tdone', tid: 't:1:1', myRev: 1, peerRev: 1 });
    expect(getTradeState().session).toBeNull();
    expect(countItem('cigs')).toBe(1);
    expect(countItem('beer')).toBe(2);
    expect(state.gold).toBe(60);
  });

  it('resets both ready flags when peer edits offer and cleans up on cancel/disconnect', () => {
    const peer = makePeer({ id: 2, name: 'Barnaby' });
    const { bridge } = makeBridge(1, peer);
    setTradeNet(bridge);

    handleTradeMessage(2, { k: 'treq', tid: 't:2:1' });
    acceptTradeRequest();
    toggleAcceptTrade();
    expect(getTradeState().session?.myReady).toBe(true);

    // Peer edits offer -> resets myReady!
    handleTradeMessage(2, { k: 'toff', tid: 't:2:1', items: [['beer', 1]], gold: 0, rev: 1 });
    expect(getTradeState().session?.myReady).toBe(false);

    // Peer leaves -> session cancelled cleanly.
    handleTradePeerLeft(2);
    expect(getTradeState().session).toBeNull();
  });

  it('blocks accepting when inventory is full and rejects quest items', () => {
    const peer = makePeer({ id: 2, name: 'Barnaby' });
    const { bridge } = makeBridge(1, peer);
    setTradeNet(bridge);

    const nonStackable = Object.values(ITEMS).find((i) => !i.stackable && !i.questItem)!;
    const questItem = Object.values(ITEMS).find((i) => i.questItem);
    state.inventory = Array.from({ length: INVENTORY_SIZE }, () => ({ item: nonStackable.id, count: 1 }));

    handleTradeMessage(2, { k: 'treq', tid: 't:2:2' });
    acceptTradeRequest();

    if (questItem) {
      offerItem(questItem.id, 1);
      expect(getTradeState().session?.myItems.size).toBe(0);
    }

    handleTradeMessage(2, { k: 'toff', tid: 't:2:2', items: [[nonStackable.id, 1]], gold: 0, rev: 1 });
    expect(canAcceptCurrentTrade().ok).toBe(false);

    toggleAcceptTrade();
    expect(getTradeState().session?.myReady).toBe(false);

    cancelTrade();
    expect(getTradeState().session).toBeNull();
  });
});
