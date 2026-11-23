// Parties: players in the same online town group up. A party is a shared code (protocol.ts) every member broadcasts;
// the lowest player id among the members leads. Members show green on the map with their names, can chat and ping
// each other, and can hop to a member's side on foot. No host and no server state: it all rides net.ts's relay.
import type { GtaNet } from '../net';
import type { Blip } from '../types';
import { createPartyPanel } from './panel';
import { cleanChat, normaliseCode, PARTY_MAX, type PartyMsg } from './protocol';
import { createPartyBook } from './state';

export { type PartyMsg } from './protocol';

/** Map colours: party members and their pings. */
export const PARTY_COLOR = '#7dff8a';
export const PING_COLOR = '#ff9f1c';
/** How long a ping stays on the map, s. */
const PING_S = 25;
const CHAT_KEEP = 30;
const SAVE_KEY = 'gta-party-code';

export interface PartyDeps {
  ui: HTMLElement;
  net: GtaNet;
  myName(): string;
  toast(text: string, ms?: number): void;
  /** Where I am (world x/z). */
  myPos(): { x: number; z: number };
  /** Put me next to (x, z) on foot. Returns null when done, else why not now (driving, wanted, in a scene...). */
  warp(x: number, z: number): string | null;
  /** Called once per session, the first time my party has another gnome in it. */
  onGrouped?(): void;
}

export interface Party {
  peerJoin(id: number, name: string): void;
  peerLeave(id: number): void;
  peerPose(id: number, x: number, z: number): void;
  onMsg(from: number, d: PartyMsg): void;
  /** The link dropped. */
  reset(): void;
  /** Call every frame. online = the town link is up; hidden = UI hidden (cutscene). */
  update(dt: number, online: boolean, hidden: boolean): void;
  /** Party members and live pings for the map. */
  blips(): Blip[];
  isMember(id: number): boolean;
}

export function createParty(deps: PartyDeps): Party {
  const book = createPartyBook();
  const pos = new Map<number, { x: number; z: number }>();
  const chat: { name: string; text: string; mine: boolean }[] = [];
  const pings: { name: string; x: number; z: number; t: number }[] = [];
  let unread = 0;
  let lastSay = -Infinity;
  let lastPing = -Infinity;
  let renderT = 0;
  let wasOnline = false;
  let grouped = false;

  function save(): void {
    try {
      if (book.code) sessionStorage.setItem(SAVE_KEY, book.code);
      else sessionStorage.removeItem(SAVE_KEY);
    } catch { /* storage blocked: the party is not kept over a reload */ }
  }
  function announce(): void {
    deps.net.sendParty(null, { o: 'code', c: book.code ?? '' });
    save();
  }
  function toMembers(d: PartyMsg): void {
    for (const m of book.members()) if (!m.me) deps.net.sendParty(m.id, d);
  }
  function addChat(name: string, text: string, mine: boolean): void {
    chat.push({ name, text, mine });
    if (chat.length > CHAT_KEEP) chat.splice(0, chat.length - CHAT_KEEP);
  }
  function joinCode(code: string): void {
    if (code === book.code) return;
    if (!book.join(code)) { deps.toast(`Party ${code} is full (${PARTY_MAX} gnomes).`); return; }
    chat.length = 0;
    announce();
    const n = book.members().length;
    deps.toast(n > 1 ? `Joined party ${code}.` : `Party ${code}: waiting for gnomes to join.`);
    renderT = 0;
  }

  try {
    const saved = normaliseCode(sessionStorage.getItem(SAVE_KEY) ?? '');
    if (saved) book.join(saved);
  } catch { /* storage blocked */ }

  const panel = createPartyPanel(deps.ui, {
    create() { book.create(); announce(); renderT = 0; },
    join(raw) {
      const code = normaliseCode(raw);
      if (!code) { deps.toast('A party code is 4 letters.'); return; }
      joinCode(code);
    },
    leave() {
      if (!book.code) return;
      book.leave();
      chat.length = 0;
      announce();
      deps.toast('You left the party.');
      renderT = 0;
    },
    invite(id) {
      const code = book.create();
      announce();
      deps.net.sendParty(id, { o: 'inv', c: code });
      deps.toast(`Invited ${book.nameOf(id) ?? 'them'} to party ${code}.`);
      renderT = 0;
    },
    accept(from) {
      const inv = book.takeInvite(from);
      if (inv) joinCode(inv.code);
      renderT = 0;
    },
    decline(from) { book.takeInvite(from); renderT = 0; },
    say(raw) {
      const text = cleanChat(raw);
      const now = performance.now();
      if (!text || !book.code || now - lastSay < 700) return;
      lastSay = now;
      toMembers({ o: 'say', m: text });
      addChat(deps.myName(), text, true);
      renderT = 0;
    },
    ping() {
      const now = performance.now();
      if (!book.code || now - lastPing < 2000) return;
      lastPing = now;
      const p = deps.myPos();
      const x = Math.round(p.x * 10) / 10;
      const z = Math.round(p.z * 10) / 10;
      toMembers({ o: 'ping', x, z });
      pings.push({ name: deps.myName(), x, z, t: PING_S });
      deps.toast('📍 Pinged your spot to the party.');
    },
    warp(id) {
      const p = pos.get(id);
      if (!p || !book.isMember(id)) return;
      const why = deps.warp(p.x, p.z);
      if (why) { deps.toast(why); return; }
      panel.toggle(false);
      deps.toast(`Hopped over to ${book.nameOf(id) ?? 'them'}.`);
    },
  });

  return {
    peerJoin(id, name) {
      book.peerJoin(id, name);
      if (book.code) deps.net.sendParty(id, { o: 'code', c: book.code });
    },
    peerLeave(id) {
      const was = book.isMember(id);
      const name = book.nameOf(id);
      book.peerLeave(id);
      pos.delete(id);
      if (was && name) deps.toast(`${name} left the party.`);
    },
    peerPose(id, x, z) { pos.set(id, { x, z }); },
    onMsg(from, d) {
      const name = book.nameOf(from);
      if (name === null) return;
      if (d.o === 'code') {
        const was = book.isMember(from);
        book.peerCode(from, d.c);
        const is = book.isMember(from);
        if (is && !was) deps.toast(`👥 ${name} joined your party.`);
        else if (was && !is) deps.toast(`${name} left the party.`);
      } else if (d.o === 'inv') {
        if (d.c === book.code) return;
        book.addInvite(from, d.c, performance.now());
        deps.toast(`👥 ${name} invites you to a party. Tap Party to join.`, 6000);
      } else if (d.o === 'say') {
        if (!book.isMember(from)) return;
        addChat(name, d.m, false);
        if (!panel.isOpen) { unread++; deps.toast(`💬 ${name}: ${d.m}`, 5000); }
      } else if (d.o === 'ping') {
        if (!book.isMember(from)) return;
        for (let i = pings.length - 1; i >= 0; i--) if (pings[i].name === name) pings.splice(i, 1);
        pings.push({ name, x: d.x, z: d.z, t: PING_S });
        deps.toast(`📍 ${name} pinged a spot on the map.`);
      }
      renderT = 0;
    },
    reset() {
      book.reset();
      pos.clear();
    },
    update(dt, online, hidden) {
      book.setMe(deps.net.myId, deps.myName());
      // Back online after a drop (or the first link): tell everyone which party I am in.
      if (online && !wasOnline && book.code) announce();
      wasOnline = online;
      for (let i = pings.length - 1; i >= 0; i--) if ((pings[i].t -= dt) <= 0) pings.splice(i, 1);
      panel.setVisible(online && !hidden);
      if (panel.isOpen) unread = 0;
      renderT -= dt;
      if (renderT > 0) return;
      renderT = 0.25;
      const now = performance.now();
      const invites = book.invites(now);
      panel.setBadge(invites.length + unread);
      if (!grouped && book.members().length > 1) { grouped = true; deps.onGrouped?.(); }
      // A render rebuilds the rows, so only while open, and distances move in 10 m steps (a tap is not lost to a rebuild).
      if (!panel.isOpen) return;
      const me = deps.myPos();
      panel.render({
        code: book.code,
        members: book.members().map((m) => {
          const p = pos.get(m.id);
          return { ...m, dist: m.me || !p ? null : Math.round(Math.hypot(p.x - me.x, p.z - me.z) / 10) * 10 };
        }),
        others: book.others(),
        invites: invites.map((i) => ({ from: i.from, name: i.name, code: i.code })),
        chat,
      });
    },
    blips() {
      const out: Blip[] = [];
      const leader = book.leaderId();
      for (const m of book.members()) {
        if (m.me) continue;
        const p = pos.get(m.id);
        if (p) out.push({ x: p.x, z: p.z, color: PARTY_COLOR, player: true, label: `${m.id === leader ? '★ ' : ''}${m.name}` });
      }
      for (const p of pings) out.push({ x: p.x, z: p.z, color: PING_COLOR, label: `📍 ${p.name}` });
      return out;
    },
    isMember: (id) => book.isMember(id),
  };
}
