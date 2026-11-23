import { describe, expect, it } from 'vitest';
import { INVITE_TTL_MS, createPartyBook } from './state';
import { PARTY_CODE_RE, PARTY_MAX } from './protocol';

describe('party book', () => {
  it('create gives a valid code and is idempotent', () => {
    const b = createPartyBook();
    const c = b.create(() => 0.5);
    expect(c).toMatch(PARTY_CODE_RE);
    expect(b.code).toBe(c);
    expect(b.create(() => 0.1)).toBe(c);
  });

  it('members are peers with my code; the lowest id leads', () => {
    const b = createPartyBook();
    b.setMe(5, 'me');
    const c = b.create(() => 0.5);
    b.peerJoin(3, 'a');
    b.peerJoin(9, 'b');
    b.peerCode(3, c);
    b.peerCode(9, c);
    expect(b.isMember(3)).toBe(true);
    expect(b.members().map((m) => [m.id, m.leader, m.me])).toEqual([
      [3, true, false],
      [5, false, true],
      [9, false, false],
    ]);
    expect(b.leaderId()).toBe(3);
    // Me as the lowest id leads.
    b.setMe(1, 'me');
    expect(b.leaderId()).toBe(1);
    expect(b.members()[0]).toMatchObject({ id: 1, leader: true, me: true });
  });

  it('a peer with another code is in others(), not members()', () => {
    const b = createPartyBook();
    b.setMe(1, 'me');
    b.create(() => 0.5);
    b.peerJoin(2, 'x');
    b.peerCode(2, 'ZZZZ');
    b.peerJoin(4, 'y');
    expect(b.isMember(2)).toBe(false);
    expect(b.members().map((m) => m.id)).toEqual([1]);
    expect(b.others()).toEqual([
      { id: 2, name: 'x' },
      { id: 4, name: 'y' },
    ]);
  });

  it('join succeeds while there is room, up to PARTY_MAX counting me', () => {
    const b = createPartyBook();
    b.setMe(1, 'me');
    const target = 'BCDF';
    expect(b.join(target)).toBe(true);
    for (let i = 2; i <= PARTY_MAX; i++) {
      b.peerJoin(i, `p${i}`);
      b.peerCode(i, target);
    }
    expect(b.sizeOf(target)).toBe(PARTY_MAX);
    expect(b.join(target)).toBe(true);
    expect(b.code).toBe(target);
  });

  it('join refuses a full party and leaves the code unchanged', () => {
    const b = createPartyBook();
    b.setMe(1, 'me');
    b.create(() => 0.5);
    const mine = b.code;
    const full = 'BCDF';
    // I am not in this party, so it takes PARTY_MAX peers to fill it.
    for (let i = 2; i < 2 + PARTY_MAX; i++) {
      b.peerJoin(i, `p${i}`);
      b.peerCode(i, full);
    }
    expect(b.sizeOf(full)).toBe(PARTY_MAX);
    expect(b.join(full)).toBe(false);
    expect(b.code).toBe(mine);
  });

  it('invites ignore unknown senders and my own code', () => {
    const b = createPartyBook();
    b.setMe(1, 'me');
    const mine = b.create(() => 0.5);
    b.addInvite(7, 'BCDF', 0);
    expect(b.invites(0)).toEqual([]);
    b.peerJoin(2, 'x');
    b.addInvite(2, mine, 0);
    expect(b.invites(0)).toEqual([]);
    b.addInvite(2, 'BCDF', 0);
    expect(b.invites(0)).toEqual([{ from: 2, name: 'x', code: 'BCDF', at: 0 }]);
  });

  it('invites expire after INVITE_TTL_MS and are removed by takeInvite', () => {
    const b = createPartyBook();
    b.setMe(1, 'me');
    b.peerJoin(2, 'x');
    b.peerJoin(3, 'y');
    b.addInvite(2, 'BCDF', 1000);
    b.addInvite(3, 'GHJK', 2000);
    expect(b.invites(1000 + INVITE_TTL_MS).map((i) => i.from)).toEqual([2, 3]);
    expect(b.invites(1000 + INVITE_TTL_MS + 1).map((i) => i.from)).toEqual([3]);
    expect(b.takeInvite(3)).toMatchObject({ from: 3, code: 'GHJK' });
    expect(b.takeInvite(3)).toBeNull();
    expect(b.invites(2000)).toEqual([]);
  });

  it('join(c) removes an invite for c', () => {
    const b = createPartyBook();
    b.setMe(1, 'me');
    b.peerJoin(2, 'x');
    b.addInvite(2, 'BCDF', 0);
    expect(b.join('BCDF')).toBe(true);
    expect(b.invites(0)).toEqual([]);
  });

  it('peerLeave removes membership and the invite from that peer', () => {
    const b = createPartyBook();
    b.setMe(5, 'me');
    const c = b.create(() => 0.5);
    b.peerJoin(3, 'a');
    b.peerCode(3, c);
    b.peerJoin(4, 'b');
    b.addInvite(4, 'BCDF', 0);
    b.peerLeave(3);
    b.peerLeave(4);
    expect(b.isMember(3)).toBe(false);
    expect(b.nameOf(3)).toBeNull();
    expect(b.members().map((m) => m.id)).toEqual([5]);
    expect(b.invites(0)).toEqual([]);
  });

  it('peerCode is ignored for unknown ids', () => {
    const b = createPartyBook();
    b.setMe(1, 'me');
    b.create(() => 0.5);
    b.peerCode(9, b.code ?? '');
    expect(b.isMember(9)).toBe(false);
  });

  it('reset keeps my code but forgets peers', () => {
    const b = createPartyBook();
    b.setMe(1, 'me');
    const c = b.create(() => 0.5);
    b.peerJoin(2, 'x');
    b.peerCode(2, c);
    b.addInvite(2, 'BCDF', 0);
    b.reset();
    expect(b.code).toBe(c);
    expect(b.members().map((m) => m.id)).toEqual([1]);
    expect(b.nameOf(2)).toBeNull();
    expect(b.invites(0)).toEqual([]);
  });

  it('leave empties members() and leaderId()', () => {
    const b = createPartyBook();
    b.setMe(1, 'me');
    const c = b.create(() => 0.5);
    b.peerJoin(2, 'x');
    b.peerCode(2, c);
    b.leave();
    expect(b.code).toBeNull();
    expect(b.members()).toEqual([]);
    expect(b.leaderId()).toBeNull();
    expect(b.isMember(2)).toBe(false);
  });

  it('a null id (offline) has no leader and no me entry', () => {
    const b = createPartyBook();
    b.setMe(null, 'me');
    b.create(() => 0.5);
    expect(b.leaderId()).toBeNull();
    expect(b.members()).toEqual([]);
  });
});
