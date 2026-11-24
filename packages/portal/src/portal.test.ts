import { describe, expect, it } from 'vitest';
import { addEntries, emptyBook, parseBook, serializeBook, settle, summarize, type LedgerAdapter } from './ledger';
import { PORTAL_MSG, hostUrl, parsePortalMsg, readVisit, visitQuery } from './protocol';
import { doorsFor, getPortal, registerPortal } from './registry';
import { MAX_DEPTH, PortalStack, newVisitId } from './stack';
import { GNOMECINO } from './portals';
import type { LedgerEntry, PortalFrame } from './types';

const frame = (visit: string, from = 'gnome-theft-auto', depth = 0): PortalFrame => ({
  visit, portal: 'gnomecino', from, to: 'club-gnome', depth, enteredAt: 1, ret: { x: 73, y: 0, z: -30, yaw: 1.5 }, room: null,
});
const entry = (id: string, kind: LedgerEntry['kind'], more: Partial<LedgerEntry> = {}, store = 'http://localhost:5444'): LedgerEntry => ({
  id, visit: id.split(':')[0], portal: 'gnomecino', kind, at: 1, store, ...more,
});

describe('registry', () => {
  it('has the Gnomecino with a native Club Gnome door and a GTA visit door', () => {
    expect(getPortal('gnomecino')).toBe(GNOMECINO);
    expect(doorsFor('gnome-theft-auto').map((d) => d.door.mode)).toEqual(['visit']);
    expect(doorsFor('club-gnome').map((d) => d.door.mode)).toEqual(['native']);
  });
  it('rejects bad ids and a native door outside the host game', () => {
    expect(() => registerPortal({ ...GNOMECINO, id: 'Bad Id' })).toThrow();
    expect(() => registerPortal({ ...GNOMECINO, id: 'x', doors: [{ game: 'gnaft', mode: 'native', label: 'x' }] })).toThrow();
  });
});

describe('stack', () => {
  it('pushes and pops in order (nested visits)', () => {
    const s = new PortalStack();
    s.push(frame('a'));
    s.push(frame('b', 'club-gnome', 1));
    expect(s.depth).toBe(2);
    expect(s.pop()?.visit).toBe('b');
    expect(s.peek()?.visit).toBe('a');
  });
  it('refuses the same visit twice and more than MAX_DEPTH', () => {
    const s = new PortalStack();
    s.push(frame('a'));
    expect(() => s.push(frame('a'))).toThrow();
    for (let i = 1; i < MAX_DEPTH; i++) s.push(frame(`v${i}`));
    expect(() => s.push(frame('z'))).toThrow();
  });
  it('survives a round trip and drops junk', () => {
    const s = new PortalStack([frame('a')]);
    expect(PortalStack.parse(s.toJSON()).peek()).toEqual(frame('a'));
    expect(PortalStack.parse('{"frames":[{"visit":3}]}').depth).toBe(0);
    expect(PortalStack.parse('not json').depth).toBe(0);
    expect(PortalStack.parse(null).depth).toBe(0);
  });
  it('makes url-safe visit ids', () => {
    expect(newVisitId('gnomecino', 1000, () => 0.5)).toMatch(/^gnomecino-[a-z0-9]+-[a-z0-9]+$/);
  });
});

describe('ledger', () => {
  const calls: string[] = [];
  const adapter: LedgerAdapter = {
    chips: (n) => calls.push(`chips ${n}`),
    item: (id) => calls.push(`item ${id}`),
    achievement: (id) => calls.push(`ach ${id}`),
    note: (t) => calls.push(`note ${t}`),
  };

  it('applies each entry exactly once', () => {
    calls.length = 0;
    let b = addEntries(emptyBook(), [entry('v1:1', 'chips', { amount: 50 }), entry('v1:2', 'item', { ref: 'card-fan' })]);
    b = addEntries(b, [entry('v1:1', 'chips', { amount: 50 })]); // a resend
    expect(b.pending).toHaveLength(2);
    const r1 = settle(b, adapter, 'http://localhost:5443');
    expect(calls).toEqual(['chips 50', 'item card-fan']);
    const r2 = settle(addEntries(r1.book, [entry('v1:1', 'chips', { amount: 50 })]), adapter, 'http://localhost:5443');
    expect(r2.settled).toHaveLength(0);
    expect(calls).toHaveLength(2);
  });
  it('only records effects already in this origin\'s storage (same origin), but shows notes', () => {
    calls.length = 0;
    const b = addEntries(emptyBook(), [entry('v2:1', 'chips', { amount: 9 }, 'https://site'), entry('v2:2', 'note', { text: 'hi' }, 'https://site')]);
    const r = settle(b, adapter, 'https://site');
    expect(calls).toEqual(['note hi']);
    expect(r.settled).toHaveLength(2);
    expect(r.book.applied).toEqual(['v2:1', 'v2:2']);
  });
  it('settles one visit and keeps the others pending', () => {
    const b = addEntries(emptyBook(), [entry('v3:1', 'chips', { amount: 1 }), entry('v4:1', 'chips', { amount: 2 })]);
    const r = settle(b, {}, 'x', 'v3');
    expect(r.book.pending.map((e) => e.id)).toEqual(['v4:1']);
  });
  it('a throwing handler still marks the entry applied', () => {
    const b = addEntries(emptyBook(), [entry('v5:1', 'chips', { amount: 1 })]);
    const r = settle(b, { chips: () => { throw new Error('boom'); } }, 'x');
    expect(r.book.applied).toEqual(['v5:1']);
  });
  it('rejects malformed entries and survives a round trip', () => {
    const b = addEntries(emptyBook(), [{ id: 'x' }, entry('v6:1', 'chips', { amount: 1.5 }), entry('v6:2', 'acorns', { amount: -3 })]);
    expect(b.pending.map((e) => e.id)).toEqual(['v6:2']);
    expect(parseBook(serializeBook(b))).toEqual(b);
    expect(parseBook('{bad').pending).toEqual([]);
  });
  it('summarizes net chips and the rest', () => {
    const lines = summarize([
      entry('v:1', 'chips', { amount: 100 }), entry('v:2', 'chips', { amount: -30 }),
      entry('v:3', 'item', { ref: 'card-fan' }), entry('v:4', 'achievement', { ref: 'club-buy-fan' }),
    ], (id) => id.toUpperCase());
    expect(lines).toEqual(['+70 chips', 'New: card-fan', 'Achievement: CLUB-BUY-FAN']);
  });
});

describe('protocol', () => {
  it('round-trips a visit through the query string with the pass-through params', () => {
    const q = visitQuery(GNOMECINO, { ...frame('gnomecino-abc-1'), room: 'FRIEND' }, { name: 'Pip', look: 'g1abc' }, '?mp=ws%3A%2F%2Fx&foo=1&debug');
    const v = readVisit(`?${q}`);
    expect(v).toEqual({ portal: 'gnomecino', visit: 'gnomecino-abc-1', from: 'gnome-theft-auto', depth: 0, name: 'Pip', look: 'g1abc', room: 'FRIEND' });
    const p = new URLSearchParams(q);
    expect(p.get('mp')).toBe('ws://x');
    expect(p.get('shell')).toBe('0');
    expect(p.has('debug')).toBe(true);
    expect(p.has('foo')).toBe(false);
  });
  it('reads no visit from an ordinary URL', () => {
    expect(readVisit('?room=ABCD')).toBeNull();
    expect(readVisit('?portal=BAD!&visit=a&from=b')).toBeNull();
  });
  it('builds the host url for dev, the built site, and an override', () => {
    expect(hostUrl(GNOMECINO, 'a=1', { dev: true, protocol: 'http:', hostname: 'localhost' })).toBe('http://localhost:5197/?a=1');
    expect(hostUrl(GNOMECINO, 'a=1', { dev: false, protocol: 'https:', hostname: 'x' })).toBe('../club-gnome/?a=1');
    expect(hostUrl(GNOMECINO, 'a=1', { dev: true, protocol: 'http:', hostname: 'localhost', base: 'http://localhost:5444' })).toBe('http://localhost:5444/?a=1');
  });
  it('parses only well-formed messages', () => {
    expect(parsePortalMsg({ t: PORTAL_MSG, kind: 'ready', visit: 'v' })).toEqual({ t: PORTAL_MSG, kind: 'ready', visit: 'v' });
    expect(parsePortalMsg({ t: 'other', kind: 'ready', visit: 'v' })).toBeNull();
    expect(parsePortalMsg({ t: PORTAL_MSG, kind: 'presence', visit: 'v', inside: -1 })).toBeNull();
    const m = parsePortalMsg({ t: PORTAL_MSG, kind: 'ledger', visit: 'v', entries: [entry('v:1', 'chips', { amount: 2 }), entry('w:1', 'chips', { amount: 2 }), 7] });
    expect(m?.kind === 'ledger' && m.entries.map((e) => e.id)).toEqual(['v:1']);
  });
});
