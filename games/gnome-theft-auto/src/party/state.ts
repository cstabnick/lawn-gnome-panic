// The party book, pure data. Who is in which party, who leads, and pending invites.
import { PARTY_MAX, newPartyCode } from './protocol';

/** How long an invite stays open, ms. */
export const INVITE_TTL_MS = 60_000;

export interface PartyMember { id: number; name: string; leader: boolean; me: boolean }
export interface PartyInvite { from: number; name: string; code: string; at: number }

export interface PartyBook {
  /** My party code, or null when I am not in a party. */
  readonly code: string | null;
  /** My player id (null while offline) and name. */
  setMe(id: number | null, name: string): void;
  peerJoin(id: number, name: string): void;
  /** A player left: forget them, their party code and their invites. */
  peerLeave(id: number): void;
  /** A player announced their party code ('' = none). Ignored for unknown ids. */
  peerCode(id: number, code: string): void;
  /** The link dropped: forget every peer and invite. My own code is kept. */
  reset(): void;
  /** Start a party with a fresh code when I have none. Returns my code. */
  create(rand?: () => number): string;
  /** Join the party with this code (a valid code). False (and no change) when it already has PARTY_MAX players. */
  join(code: string): boolean;
  /** Leave my party (code becomes null). */
  leave(): void;
  /** Store an invite. Ignored when `from` is not a known peer or the code is already mine. Replaces an older one from the same sender. */
  addInvite(from: number, code: string, now: number): void;
  /** Remove and return the invite from `from`, or null. */
  takeInvite(from: number): PartyInvite | null;
  /** Open invites, oldest first; drops (and forgets) ones older than INVITE_TTL_MS. */
  invites(now: number): PartyInvite[];
  /** My party: me plus every peer showing my code, sorted by id (me included only once my id is known). Empty when I have no code. */
  members(): PartyMember[];
  /** True when peer `id` shows my code (never true for me, never true when I have no code). */
  isMember(id: number): boolean;
  /** The lowest id among my party's members (me included), or null when I have no code or no id. */
  leaderId(): number | null;
  /** How many players show this code, counting me when it is mine. */
  sizeOf(code: string): number;
  /** Peers not in my party: invite targets, sorted by id. */
  others(): { id: number; name: string }[];
  /** A peer's name, or null. */
  nameOf(id: number): string | null;
}

export function createPartyBook(): PartyBook {
  let code: string | null = null;
  let myId: number | null = null;
  let myName = '';
  const peers = new Map<number, { name: string; code: string }>();
  const invites = new Map<number, PartyInvite>();

  const countOf = (c: string): number => {
    let n = 0;
    for (const p of peers.values()) if (p.code === c) n++;
    if (code !== null && c === code) n++;
    return n;
  };

  const leaderOf = (): number | null => {
    if (code === null || myId === null) return null;
    let lead = myId;
    for (const [id, p] of peers) if (p.code === code && id < lead) lead = id;
    return lead;
  };

  return {
    get code() { return code; },
    setMe(id, name) {
      myId = id;
      myName = name;
    },
    peerJoin(id, name) {
      if (id === myId) return;
      const p = peers.get(id);
      if (p) p.name = name;
      else peers.set(id, { name, code: '' });
    },
    peerLeave(id) {
      peers.delete(id);
      invites.delete(id);
    },
    peerCode(id, c) {
      const p = peers.get(id);
      if (p) p.code = c;
    },
    reset() {
      peers.clear();
      invites.clear();
    },
    create(rand) {
      if (code === null) code = newPartyCode(rand);
      return code;
    },
    join(c) {
      if (c === code) return true;
      if (countOf(c) >= PARTY_MAX) return false;
      code = c;
      for (const [from, inv] of invites) if (inv.code === c) invites.delete(from);
      return true;
    },
    leave() {
      code = null;
    },
    addInvite(from, c, now) {
      const p = peers.get(from);
      if (!p || c === code) return;
      invites.set(from, { from, name: p.name, code: c, at: now });
    },
    takeInvite(from) {
      const inv = invites.get(from);
      if (!inv) return null;
      invites.delete(from);
      return inv;
    },
    invites(now) {
      for (const [from, inv] of invites) if (now - inv.at > INVITE_TTL_MS) invites.delete(from);
      return [...invites.values()].sort((a, b) => a.at - b.at);
    },
    members() {
      if (code === null) return [];
      const leader = leaderOf();
      const out: PartyMember[] = [];
      for (const [id, p] of peers) {
        if (p.code === code) out.push({ id, name: p.name, leader: id === leader, me: false });
      }
      if (myId !== null) out.push({ id: myId, name: myName, leader: myId === leader, me: true });
      return out.sort((a, b) => a.id - b.id);
    },
    isMember(id) {
      return code !== null && id !== myId && peers.get(id)?.code === code;
    },
    leaderId() {
      return leaderOf();
    },
    sizeOf(c) {
      return countOf(c);
    },
    others() {
      const out: { id: number; name: string }[] = [];
      for (const [id, p] of peers) if (p.code !== code) out.push({ id, name: p.name });
      return out.sort((a, b) => a.id - b.id);
    },
    nameOf(id) {
      return peers.get(id)?.name ?? null;
    },
  };
}
