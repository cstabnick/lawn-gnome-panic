import { beforeEach, describe, expect, it } from 'vitest';
import { bus } from '../events';
import { player } from '../player';
import { newGameState, state } from '../state';
import type { GnoMsg } from '../net/protocol';
import {
  handlePartyMessage,
  handlePartyOffline,
  handlePartyPeerLeft,
  acceptInvite,
  invitePlayer,
  inParty,
  isPartyLeader,
  isPartyPeer,
  partyMembers,
  pendingInvite,
  setPartyNet,
  type PartyNetBridge,
  type PartyPeer,
} from './party';

const ME = 1;

function makePeer(id: number, name: string): PartyPeer {
  return {
    id,
    name,
    color: 0xffffff,
    zone: 'mossbottom',
    x: 4,
    z: 4,
    dead: false,
    level: 3,
    classId: null,
    hp: 10,
    hpMax: 10,
  };
}

function makeBridge(): { bridge: PartyNetBridge; sent: { to: number; msg: GnoMsg }[]; bubbles: [number, string][] } {
  const sent: { to: number; msg: GnoMsg }[] = [];
  const bubbles: [number, string][] = [];
  const peers = new Map<number, PartyPeer>([
    [2, makePeer(2, 'Barnaby')],
    [3, makePeer(3, 'Clover')],
  ]);
  const bridge: PartyNetBridge = {
    isOnline: () => true,
    myId: () => ME,
    getPeer: (id) => peers.get(id) ?? null,
    send: (to, msg) => sent.push({ to, msg }),
    bubble: (id, text) => bubbles.push([id, text]),
  };
  return { bridge, sent, bubbles };
}

function sentOf<K extends GnoMsg['k']>(sent: { to: number; msg: GnoMsg }[], k: K): { to: number; msg: Extract<GnoMsg, { k: K }> }[] {
  return sent.filter((s) => s.msg.k === k) as { to: number; msg: Extract<GnoMsg, { k: K }> }[];
}

describe('party', () => {
  let ctx: ReturnType<typeof makeBridge>;

  beforeEach(() => {
    Object.assign(state, newGameState());
    state.zone = 'mossbottom';
    player.position.set(3, 0, 3);
    player.dead = false;
    handlePartyOffline();
    ctx = makeBridge();
    setPartyNet(ctx.bridge);
  });

  it('invitePlayer sends pinv, and a yes answer makes me the leader with a roster to the new member', () => {
    expect(invitePlayer(2)).toBe(true);
    const [pinv] = sentOf(ctx.sent, 'pinv');
    expect(pinv.to).toBe(2);

    handlePartyMessage(2, { k: 'pans', pid: pinv.msg.pid, ok: true });

    expect(inParty()).toBe(true);
    expect(isPartyLeader()).toBe(true);
    const [prost] = sentOf(ctx.sent, 'prost');
    expect(prost.to).toBe(2);
    expect(prost.msg.m).toEqual([1, 2]);
  });

  it('an incoming invite is accepted with pans ok, and the leader roster makes me a member', () => {
    const pid = '2:1';
    handlePartyMessage(2, { k: 'pinv', pid });
    expect(pendingInvite()?.fromId).toBe(2);

    acceptInvite();
    const [pans] = sentOf(ctx.sent, 'pans');
    expect(pans.to).toBe(2);
    expect(pans.msg).toMatchObject({ pid, ok: true });

    handlePartyMessage(2, { k: 'prost', pid, lead: 2, m: [1, 2], h: [] });
    expect(isPartyPeer(2)).toBe(true);
    expect(isPartyLeader()).toBe(false);

    // A roster from someone who is not the leader is ignored.
    handlePartyMessage(3, { k: 'prost', pid, lead: 2, m: [1, 3], h: [] });
    expect(partyMembers().map((m) => m.id)).not.toContain(3);
    expect(isPartyPeer(2)).toBe(true);
  });

  it('when the leader leaves, the lowest remaining id leads and sends the roster on', () => {
    const pid = '2:7';
    handlePartyMessage(2, { k: 'pinv', pid });
    acceptInvite();
    handlePartyMessage(2, { k: 'prost', pid, lead: 2, m: [1, 2, 3], h: [] });
    ctx.sent.length = 0;

    handlePartyPeerLeft(2);

    expect(isPartyLeader()).toBe(true);
    const [prost] = sentOf(ctx.sent, 'prost');
    expect(prost.to).toBe(3);
  });

  it('party chat from a member is shown, from a non-member is ignored', () => {
    const pid = '2:9';
    handlePartyMessage(2, { k: 'pinv', pid });
    acceptInvite();
    handlePartyMessage(2, { k: 'prost', pid, lead: 2, m: [1, 2, 3], h: [] });

    const lines: string[] = [];
    bus.on('message', ({ text }) => lines.push(text));

    handlePartyMessage(2, { k: 'pchat', pid, t: 'hello party' });
    expect(lines.some((t) => t.includes('[Party] Barnaby: hello party'))).toBe(true);

    const before = lines.length;
    handlePartyMessage(9, { k: 'pchat', pid, t: 'intruder' });
    expect(lines.length).toBe(before);
  });

  it('handlePartyOffline empties partyMembers()', () => {
    const pid = '2:11';
    handlePartyMessage(2, { k: 'pinv', pid });
    acceptInvite();
    handlePartyMessage(2, { k: 'prost', pid, lead: 2, m: [1, 2], h: [] });
    expect(partyMembers().length).toBeGreaterThan(0);

    handlePartyOffline();
    expect(partyMembers()).toEqual([]);
  });
});
