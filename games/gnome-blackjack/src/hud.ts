// DOM UI: seat plates, speech bubbles, bet and action buttons, the 15 s timer, chat, online status.
import { DEALER_CHAR } from './characters';
import { BET_S, BET_STEPS, BUBBLE_S, CASHIER_ACORNS, DEALER, MAX_BET, MIN_BET, SEAT_COUNT, TIME_LOW_S, TURN_S, type Card, type Hand, type NetStatus, type TableInput, type TableState } from './config';
import { canDouble, canSplit, handTotal, stakedChips } from './cards';

export interface HudApi {
  input(i: TableInput): void;
  chat(text: string): void;
  joinRoom(code: string): void;
  quickMatch(): void;
  playOffline(): void;
  standUpToSlots(): void;
  /** Trades CASHIER_ACORNS Oakcount acorns for chips. */
  buyChips(): void;
  /** Free chips (no acorns), never above the Oakcount's free cap of 100. */
  freeChips(): void;
}
export interface HudFrame {
  st: TableState;
  mySeat: number;
  net: NetStatus;
  headScreen(seat: number): { x: number; y: number } | null;
  hidden?: boolean;
  /** My Oakcount acorns (for the cashier button). */
  acorns: number;
  /** Chips the cashier button gives. */
  cashierChips: number;
  /** Chips the free top-up gives now (0 at or above the free cap). */
  freeChips: number;
}
export interface Hud { update(f: HudFrame): void }

const CSS = `
#bj-hud { position: fixed; inset: 0; pointer-events: none; font-family: system-ui, sans-serif; color: #f4ead8; }
#bj-hud .bj-plate { position: absolute; transform: translate(-50%, -100%); white-space: nowrap; text-align: center;
  background: rgba(18, 12, 8, 0.82); border: 1px solid #5b4530; border-radius: 10px; padding: 4px 8px; min-width: 72px;
  font: 600 13px/1.25 system-ui, sans-serif; }
#bj-hud .bj-plate.me { outline: 2px solid #ffd54f; outline-offset: 1px; }
#bj-hud .bj-ph { min-height: 1em; }
#bj-hud .bj-badge { font-weight: 800; margin-top: 2px; }
#bj-hud .bj-badge.win { color: #7ddc6a; }
#bj-hud .bj-badge.bj { color: #ffd54f; }
#bj-hud .bj-badge.push { color: #b8b8b8; }
#bj-hud .bj-badge.lose { color: #ff7a6a; }
#bj-hud .bj-timer { display: flex; align-items: center; gap: 6px; justify-content: center; margin-top: 3px; }
#bj-hud .bj-track { height: 6px; width: 64px; background: #000a; border-radius: 3px; overflow: hidden; }
#bj-hud .bj-fill { height: 100%; width: 100%; background: #7ddc6a; }
#bj-hud .bj-timer.low .bj-fill { background: #ff5a4a; }
#bj-hud .bj-secs { font-weight: 800; min-width: 22px; text-align: left; }
#bj-hud .bj-bub { position: absolute; transform: translate(-50%, -100%); pointer-events: none; width: max-content; max-width: 220px;
  background: #fff; color: #2a1d12; border-radius: 12px; padding: 6px 10px 7px; font: 15px/1.3 system-ui, sans-serif;
  box-shadow: 0 2px 6px #0007; }
#bj-hud .bj-bub::after { content: ''; position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%);
  border: 7px solid transparent; border-top-color: #fff; border-bottom: 0; }
#bj-hud .bj-bw { font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.6; }
#bj-hud .bj-banner { position: absolute; left: 50%; top: calc(10px + env(safe-area-inset-top)); transform: translateX(-50%); background: rgba(18, 12, 8, 0.85);
  padding: 8px 14px; border-radius: 10px; font: 700 16px system-ui, sans-serif; display: flex; flex-direction: column;
  align-items: center; gap: 4px; min-width: 200px; }
#bj-hud .bj-banner .bj-track { width: 100%; }
#bj-hud .bj-ctl { position: absolute; left: 50%; bottom: calc(14px + env(safe-area-inset-bottom)); transform: translateX(-50%); pointer-events: auto;
  display: flex; flex-direction: column; align-items: center; gap: 8px; background: rgba(18, 12, 8, 0.85);
  padding: 10px 12px; border-radius: 14px; border: 1px solid #5b4530; max-width: calc(100vw - 32px); box-sizing: border-box; }
#bj-hud .bj-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }
#bj-hud .bj-btn { min-height: 48px; min-width: 64px; padding: 0 14px; font: 700 17px system-ui, sans-serif; border-radius: 10px;
  border: 0; background: #c9a24a; color: #1b1209; cursor: pointer; pointer-events: auto; }
#bj-hud .bj-btn.alt { background: #4a3a2a; color: #f4ead8; }
#bj-hud .bj-btn.go { background: #7ddc6a; }
#bj-hud .bj-btn:disabled { opacity: 0.4; cursor: default; }
#bj-hud .bj-msg { font: 600 16px system-ui, sans-serif; padding: 12px 4px; }
#bj-hud .bj-betlabel { font: 800 20px system-ui, sans-serif; color: #ffd54f; }
#bj-hud .bj-bigsecs { font: 800 26px system-ui, sans-serif; color: #ffd54f; min-width: 52px; text-align: center; }
#bj-hud .bj-status { position: absolute; left: calc(10px + env(safe-area-inset-left)); top: calc(10px + env(safe-area-inset-top)); pointer-events: auto; max-width: calc(100vw - 130px); font: 13px system-ui, sans-serif;
  background: rgba(18, 12, 8, 0.8); border: 1px solid #5b4530; padding: 5px 8px; border-radius: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; z-index: 6; }
#bj-hud .bj-small { min-height: 30px; padding: 0 10px; font: 600 13px system-ui, sans-serif; border-radius: 8px; border: 1px solid #5b4530;
  background: #3a2c1e; color: #f4ead8; cursor: pointer; pointer-events: auto; }
#bj-hud .bj-small:hover:not(:disabled) { background: #4d3b29; }
#bj-hud .bj-menu { position: absolute; left: 0; top: calc(100% + 6px); min-width: 240px; max-width: calc(100vw - 24px);
  background: rgba(18, 12, 8, 0.96); border: 1px solid #5b4530; border-radius: 12px; padding: 10px;
  display: flex; flex-direction: column; gap: 8px; box-shadow: 0 8px 24px #000a; z-index: 7; }
#bj-hud .bj-menu-title { font: 700 12px system-ui, sans-serif; color: #c9b595; text-transform: uppercase; letter-spacing: 0.05em; }
#bj-hud .bj-menu-btn { min-height: 36px; padding: 0 12px; font: 600 14px system-ui, sans-serif; border-radius: 8px; border: 0;
  background: #4a3a2a; color: #f4ead8; cursor: pointer; text-align: left; }
#bj-hud .bj-menu-btn:hover:not(:disabled) { background: #5e4a36; }
#bj-hud .bj-menu-btn:disabled { opacity: 0.55; cursor: default; }
#bj-hud .bj-roomrow { display: flex; gap: 6px; align-items: center; }
#bj-hud .bj-roomin { flex: 1; min-width: 0; height: 36px; border-radius: 8px; border: 1px solid #5b4530; padding: 0 10px;
  font: 600 14px system-ui, sans-serif; background: #1c130b; color: #f4ead8; text-transform: uppercase; }
#bj-hud .bj-roomerr { font: 12px system-ui, sans-serif; color: #ff7a6a; }
#bj-hud .bj-chat { position: absolute; left: calc(12px + env(safe-area-inset-left)); bottom: calc(14px + env(safe-area-inset-bottom)); display: flex; gap: 8px; align-items: center; pointer-events: auto; z-index: 8; touch-action: manipulation; }
#bj-hud .bj-chatin { height: 48px; width: min(260px, 55vw); border-radius: 10px; border: 1px solid #5b4530; padding: 0 12px;
  font: 16px system-ui, sans-serif; background: #fff; color: #2a1d12; }
/* Phones: compact plates and bubbles, status on one short row, banner under it, controls clear of the chat button. */
@media (max-width: 640px), (max-height: 500px) {
  #bj-hud .bj-plate { font-size: 11px; padding: 2px 5px; min-width: 0; border-radius: 7px; }
  #bj-hud .bj-track { width: 44px; height: 5px; }
  #bj-hud .bj-bub { max-width: 150px; font-size: 13px; padding: 4px 8px 5px; }
  #bj-hud .bj-bw { font-size: 9px; }
  #bj-hud .bj-status { font-size: 11px; padding: 4px 6px; gap: 4px; max-width: calc(100vw - 110px); }
  #bj-hud .bj-small { min-height: 30px; padding: 0 8px; font-size: 12px; }
  #bj-hud .bj-banner { top: calc(52px + env(safe-area-inset-top)); font-size: 14px; padding: 6px 10px; min-width: 170px; }
  #bj-hud .bj-ctl { left: auto; right: calc(8px + env(safe-area-inset-right)); transform: none; padding: 8px;
    max-width: calc(100vw - 84px); }
  #bj-hud .bj-btn { font-size: 16px; padding: 0 10px; min-width: 56px; }
  #bj-hud .bj-bigsecs { font-size: 22px; min-width: 40px; }
  #bj-hud .bj-chat { left: calc(8px + env(safe-area-inset-left)); }
  #bj-hud.chatting .bj-ctl { display: none !important; }
  #bj-hud .bj-chatin { width: calc(100vw - 90px); }
}
`;

const SPEAK_CPS = 28;
const FADE_S = 0.5;
const PLATE_GAP = 8;
const MINUS = '−';

const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;

function cardLabel(c: Card): string {
  return c.r === 1 ? 'A' : c.r === 11 ? 'J' : c.r === 12 ? 'Q' : c.r === 13 ? 'K' : String(c.r);
}

function handLabel(cards: Card[]): string {
  const { total, soft } = handTotal(cards);
  if (cards.length === 2 && total === 21) return 'BJ';
  return (soft ? 'soft ' : '') + total;
}

/** One hand's payout badge: text and colour class. */
function resultBadge(h: Hand): { text: string; cls: string } {
  const d = h.delta;
  if (h.result === 'blackjack') return { text: `BLACKJACK +${d}`, cls: 'bj' };
  if (h.result === 'win') return { text: `+${d}`, cls: 'win' };
  if (h.result === 'push') return { text: 'PUSH', cls: 'push' };
  if (h.result === 'bust') return { text: 'BUST', cls: 'lose' };
  return { text: `${MINUS}${Math.abs(d)}`, cls: 'lose' };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  parent?.appendChild(e);
  return e;
}

function button(parent: HTMLElement, label: string, cls: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', cls, parent);
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

// Write only when the value changed (update runs every frame).
function text(e: HTMLElement, s: string): void {
  if (e.textContent !== s) e.textContent = s;
}
function show(e: HTMLElement, on: boolean): void {
  const d = on ? '' : 'none';
  if (e.style.display !== d) e.style.display = d;
}
/** Centre x for an element of width w so it stays fully on screen (narrow phones, edge seats). */
function keepOnScreen(x: number, w: number): number {
  const half = w / 2 + 4;
  return Math.round(Math.min(Math.max(x, half), Math.max(half, window.innerWidth - half)));
}

function css(e: HTMLElement, key: 'left' | 'top' | 'color' | 'opacity' | 'width', v: string): void {
  if (e.style[key] !== v) e.style[key] = v;
}
function fraction(n: number, of: number): number {
  return Math.max(0, Math.min(1, n / of));
}

interface Plate {
  root: HTMLElement;
  name: HTMLElement;
  chips: HTMLElement;
  hand: HTMLElement;
  badge: HTMLElement;
  timer: HTMLElement;
  fill: HTMLElement;
  secs: HTMLElement;
  /** Last measured height in px (bubbles sit above it). */
  h: number;
}

interface Bub {
  root: HTMLElement;
  who: HTMLElement;
  body: HTMLElement;
  /** performance.now() when first seen: typing starts here. */
  seen: number;
  full: string;
}

export function createHud(ui: HTMLElement, api: HudApi): Hud {
  if (!document.getElementById('bj-hud-style')) {
    const style = document.createElement('style');
    style.id = 'bj-hud-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const root = document.createElement('div');
  root.id = 'bj-hud';
  ui.appendChild(root);

  // ---- plates: one per seat, plus the dealer (last)
  const plates: Plate[] = [];
  for (let i = 0; i <= SEAT_COUNT; i++) {
    const r = el('div', 'bj-plate', root);
    const name = el('div', 'bj-pn', r);
    const chips = el('div', 'bj-pc', r);
    const hand = el('div', 'bj-ph', r);
    const badge = el('div', 'bj-badge', r);
    const timer = el('div', 'bj-timer', r);
    const track = el('div', 'bj-track', timer);
    const fill = el('div', 'bj-fill', track);
    const secs = el('span', 'bj-secs', timer);
    plates.push({ root: r, name, chips, hand, badge, timer, fill, secs, h: 0 });
  }

  // ---- speech bubbles
  const bubs = new Map<number, Bub>();

  // ---- betting banner
  const banner = el('div', 'bj-banner', root);
  const bannerText = el('span', 'bj-bt', banner);
  const bannerTrack = el('div', 'bj-track', banner);
  const bannerFill = el('div', 'bj-fill', bannerTrack);

  // ---- my controls
  const ctl = el('div', 'bj-ctl', root);
  const betRow = el('div', 'bj-row', ctl);
  const betLabel = el('span', 'bj-betlabel', betRow);
  BET_STEPS.forEach((s) => button(betRow, `+${s}`, 'bj-btn', () => {
    const seat = cur ? cur.st.seats[cur.mySeat] ?? null : null;
    if (seat) api.input({ k: 'bet', amount: Math.min(MAX_BET, (seat.bet || 0) + s) });
  }));
  button(betRow, 'Clear', 'bj-btn alt', () => api.input({ k: 'bet', amount: MIN_BET }));
  button(betRow, 'Deal me in', 'bj-btn go', () => api.input({ k: 'ready' }));

  // Out of chips: the cashier (Oakcount acorns -> chips) instead of the bet buttons.
  const brokeRow = el('div', 'bj-row', ctl);
  const brokeMsg = el('span', 'bj-betlabel', brokeRow);
  const freeBtn = button(brokeRow, '', 'bj-btn go', () => api.freeChips());
  const cashBtn = button(brokeRow, '', 'bj-btn', () => api.buyChips());

  const waitMsg = el('div', 'bj-msg', ctl);
  waitMsg.textContent = 'Waiting for the others…';
  const thinkMsg = el('div', 'bj-msg', ctl);
  const outMsg = el('div', 'bj-msg', ctl);
  outMsg.textContent = 'Sitting this hand out · next bet soon';
  const phaseMsg = el('div', 'bj-msg', ctl);

  const actRow = el('div', 'bj-row', ctl);
  button(actRow, 'Hit', 'bj-btn', () => api.input({ k: 'act', a: 'hit' }));
  button(actRow, 'Stand', 'bj-btn', () => api.input({ k: 'act', a: 'stand' }));
  const dblBtn = button(actRow, 'Double', 'bj-btn alt', () => api.input({ k: 'act', a: 'double' }));
  const splitBtn = button(actRow, 'Split', 'bj-btn alt', () => api.input({ k: 'act', a: 'split' }));
  const actSecs = el('span', 'bj-bigsecs', actRow);

  // ---- status & table menu (top-left)
  const status = el('div', 'bj-status', root);
  const statusMsg = el('span', 'bj-smsg', status);
  let menuOpen = false;
  const menuBtn = button(status, 'Table ▾', 'bj-small', () => setMenu(!menuOpen));
  menuBtn.setAttribute('aria-expanded', 'false');
  button(status, '🎰 Stand up · Slots', 'bj-small', () => {
    setMenu(false);
    api.standUpToSlots();
  });

  const menu = el('div', 'bj-menu', status);
  menu.style.display = 'none';
  const menuInfo = el('div', 'bj-menu-title', menu);
  const pubBtn = button(menu, 'Public table', 'bj-menu-btn', () => {
    setMenu(false);
    api.quickMatch();
  });
  const roomRow = el('div', 'bj-roomrow', menu);
  const roomIn = el('input', 'bj-roomin', roomRow);
  roomIn.type = 'text';
  roomIn.maxLength = 8;
  roomIn.placeholder = 'Room code';
  const joinBtn = button(roomRow, 'Join', 'bj-menu-btn', () => submitRoom());
  joinBtn.style.textAlign = 'center';
  const roomErr = el('div', 'bj-roomerr', menu);
  roomErr.style.display = 'none';
  const offBtn = button(menu, 'Play offline (CPUs)', 'bj-menu-btn', () => {
    setMenu(false);
    api.playOffline();
  });

  function setMenu(open: boolean): void {
    menuOpen = open;
    menu.style.display = open ? '' : 'none';
    menuBtn.setAttribute('aria-expanded', String(open));
    roomErr.style.display = 'none';
    if (open) roomIn.value = '';
  }

  function submitRoom(): void {
    const code = roomIn.value.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(code)) {
      roomErr.textContent = 'Enter 4–8 letters or numbers';
      roomErr.style.display = '';
      return;
    }
    setMenu(false);
    api.joinRoom(code);
  }

  roomIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitRoom();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMenu(false);
    }
  });

  window.addEventListener('pointerdown', (e) => {
    if (menuOpen && !status.contains(e.target as Node)) setMenu(false);
  });

  // ---- chat (bottom-left)
  const chatRow = el('div', 'bj-chat', root);
  // Phones: act on the first touch (a click can be lost when the keyboard moves the layout); the click that follows is ignored.
  let tapped = false;
  const toggleChat = (): void => (chatOpen ? closeChat() : openChat());
  const chatBtn = button(chatRow, '\u{1F4AC}', 'bj-btn alt', () => {
    if (tapped) tapped = false;
    else toggleChat();
  });
  chatBtn.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();
    tapped = true;
    toggleChat();
  });
  const chatIn = el('input', 'bj-chatin', chatRow);
  chatIn.type = 'text';
  chatIn.maxLength = 80;
  chatIn.placeholder = 'Say something…';
  chatIn.enterKeyHint = 'send';
  chatIn.style.display = 'none';
  let chatOpen = false;
  function openChat(): void {
    chatOpen = true;
    root.classList.add('chatting');
    chatIn.style.display = '';
    chatIn.value = '';
    chatIn.focus();
  }
  function closeChat(): void {
    chatOpen = false;
    root.classList.remove('chatting');
    chatIn.style.display = 'none';
    chatIn.blur();
  }
  chatIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const t = chatIn.value.trim();
      if (t) api.chat(t);
      closeChat();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      closeChat();
      e.preventDefault();
    }
  });

  // ---- state shared with the click and key handlers
  let cur: HudFrame | null = null;
  let lastMode: 'none' | 'bet' | 'wait' | 'act' | 'think' | 'out' | 'phase' = 'none';
  let hudHidden = false;

  // ---- keyboard (off while chat is open or slots HUD is active)
  window.addEventListener('keydown', (e) => {
    if (hudHidden) return;
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target instanceof HTMLInputElement) return;
    if (chatOpen) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      openChat();
      return;
    }
    const k = e.key.toLowerCase();
    if (lastMode === 'bet' && (k === ' ' || k === 'r')) {
      e.preventDefault();
      api.input({ k: 'ready' });
    } else if (lastMode === 'act') {
      if (k === 'h') api.input({ k: 'act', a: 'hit' });
      else if (k === 's') api.input({ k: 'act', a: 'stand' });
      else if (k === 'd' && !dblBtn.disabled) api.input({ k: 'act', a: 'double' });
      else if (k === 'p' && !splitBtn.disabled) api.input({ k: 'act', a: 'split' });
      else return;
      e.preventDefault();
    }
  });

  function updatePlates(f: HudFrame): void {
    const st = f.st;
    for (let i = 0; i <= SEAT_COUNT; i++) {
      const isDealer = i === SEAT_COUNT;
      const p = plates[i];
      const seat = isDealer ? null : st.seats[i] ?? null;
      const pos = isDealer || seat ? f.headScreen(isDealer ? DEALER : i) : null;
      if (!pos || (!isDealer && !seat)) {
        show(p.root, false);
        continue;
      }
      show(p.root, true);
      p.root.classList.toggle('me', !isDealer && i === f.mySeat);
      css(p.root, 'left', `${keepOnScreen(pos.x, p.root.offsetWidth)}px`);
      css(p.root, 'top', `${pos.y}px`);

      if (isDealer) {
        text(p.name, DEALER_CHAR.name);
        css(p.name, 'color', '#f4ead8');
        show(p.chips, false);
        const d = st.dealer;
        text(p.hand, d.length === 0 ? '' : st.holeHidden ? `${cardLabel(d[0])} + ?` : handLabel(d));
        show(p.timer, false);
      } else if (seat) {
        text(p.name, seat.name + (i === f.mySeat ? ' (you)' : ''));
        css(p.name, 'color', hex(seat.color));
        show(p.chips, true);
        text(p.chips, `\u{1FA99} ${seat.chips}`);
        const hands = seat.hands;
        // Split hands: "12 | ▸soft 18 · bet 20", the arrow on the hand being played.
        const playing = st.phase === 'playing' && st.turn === i && hands.length > 1;
        const labels = hands.map((h, j) => (playing && j === seat.active ? '▸' : '') + handLabel(h.cards));
        text(p.hand, hands.length > 0 ? `${labels.join(' | ')} · bet ${stakedChips(seat)}` : '');

        // result badge in payout (one per hand; the colour follows the round's total)
        let badge = '';
        let cls = 'bj-badge';
        if (st.phase === 'payout' && hands.length > 0 && hands.every((h) => h.result)) {
          const bs = hands.map(resultBadge);
          badge = bs.map((b) => b.text).join(' / ');
          const total = hands.reduce((n, h) => n + h.delta, 0);
          cls += ' ' + (hands.length === 1 ? bs[0].cls : total > 0 ? 'win' : total < 0 ? 'lose' : 'push');
        }
        text(p.badge, badge);
        if (p.badge.className !== cls) p.badge.className = cls;
        show(p.badge, badge !== '');

        // turn timer
        const onTurn = st.phase === 'playing' && st.turn === i;
        show(p.timer, onTurn);
        if (onTurn) {
          const low = st.timer <= TIME_LOW_S;
          const tc = low ? 'bj-timer low' : 'bj-timer';
          if (p.timer.className !== tc) p.timer.className = tc;
          css(p.fill, 'width', `${(fraction(st.timer, TURN_S) * 100).toFixed(1)}%`);
          text(p.secs, `${Math.ceil(st.timer)}`);
        }
      }
    }
  }

  function updateBubbles(f: HudFrame, now: number): void {
    const live = new Set<number>();
    for (const b of f.st.bubbles) {
      live.add(b.id);
      let v = bubs.get(b.id);
      if (!v) {
        const r = el('div', 'bj-bub', root);
        const who = el('div', 'bj-bw', r);
        const body = el('div', 'bj-bt', r);
        v = { root: r, who, body, seen: now, full: b.text };
        bubs.set(b.id, v);
      }
      const pi = b.seat === DEALER ? SEAT_COUNT : b.seat;
      const pos = pi >= 0 && pi <= SEAT_COUNT ? f.headScreen(b.seat) : null;
      const age = f.st.t - b.at;
      const alpha = age < BUBBLE_S - FADE_S ? 1 : Math.max(0, (BUBBLE_S - age) / FADE_S);
      if (!pos || alpha <= 0) {
        show(v.root, false);
        continue;
      }
      show(v.root, true);
      const speaker = b.seat === DEALER ? DEALER_CHAR.name : f.st.seats[b.seat]?.name ?? '';
      text(v.who, speaker);
      const n = Math.min(v.full.length, Math.floor(((now - v.seen) / 1000) * SPEAK_CPS));
      text(v.body, v.full.slice(0, n));
      css(v.root, 'left', `${keepOnScreen(pos.x, v.root.offsetWidth)}px`);
      css(v.root, 'top', `${pos.y - plates[pi].h - PLATE_GAP}px`);
      css(v.root, 'opacity', alpha.toFixed(2));
    }
    for (const [id, v] of bubs) {
      if (!live.has(id)) {
        v.root.remove();
        bubs.delete(id);
      }
    }
  }

  function updateControls(f: HudFrame): void {
    const st = f.st;
    const seat = f.mySeat >= 0 ? st.seats[f.mySeat] ?? null : null;
    const sittingOut = !seat || seat.hands.length === 0;
    let mode: typeof lastMode = 'none';
    if (!seat) mode = 'phase';
    else if (st.phase === 'betting') mode = seat.ready ? 'wait' : 'bet';
    else if (st.phase === 'playing') {
      if (st.turn >= 0 && st.turn === f.mySeat) mode = 'act';
      else if (sittingOut) mode = 'out';
      else if (st.turn >= 0) mode = 'think';
    } else {
      mode = 'phase';
    }
    lastMode = mode;
    const broke = mode === 'bet' && !!seat && seat.chips < MIN_BET;

    show(ctl, mode !== 'none');
    show(betRow, mode === 'bet' && !broke);
    show(brokeRow, broke);
    if (broke) {
      const can = f.acorns >= CASHIER_ACORNS;
      text(brokeMsg, 'Out of chips');
      show(freeBtn, f.freeChips > 0);
      text(freeBtn, `Free 🪙 +${f.freeChips}`);
      text(cashBtn, `\u{1F330} ${CASHIER_ACORNS} → \u{1FA99} ${f.cashierChips}`);
      cashBtn.disabled = !can;
    }
    show(waitMsg, mode === 'wait');
    show(thinkMsg, mode === 'think');
    show(outMsg, mode === 'out');
    show(phaseMsg, mode === 'phase');
    show(actRow, mode === 'act');
    if (mode === 'bet' && seat) text(betLabel, `Bet ${seat.bet}`);
    if (mode === 'think') text(thinkMsg, `${st.seats[st.turn]?.name ?? 'Someone'} is thinking…`);
    if (mode === 'phase') {
      const msg = !seat
        ? 'Joining table…'
        : st.phase === 'dealing'
          ? 'Dealing cards…'
          : st.phase === 'dealer'
            ? "Dealer's turn…"
            : 'Round complete · next bet soon';
      text(phaseMsg, msg);
    }
    if (mode === 'act' && seat) {
      text(actSecs, `${Math.ceil(st.timer)}s`);
      dblBtn.disabled = !canDouble(seat);
      const split = canSplit(seat);
      splitBtn.disabled = !split;
      show(splitBtn, split);
    }
  }

  return {
    update(f: HudFrame): void {
      cur = f;
      hudHidden = Boolean(f.hidden);
      show(root, !hudHidden);
      if (hudHidden) return;
      const now = performance.now();
      const st = f.st;

      // Measure plates first (one layout), then write.
      for (const p of plates) p.h = p.root.offsetHeight || p.h;

      text(statusMsg, buildStatus(f.net, f.mySeat));
      const onPublic = f.net.status === 'online' && !f.net.code;
      const isOff = f.net.status === 'off' || f.net.status === 'error';
      text(menuInfo, f.mySeat >= 0 ? `Seated at Seat ${f.mySeat + 1}` : 'Joining table…');
      text(pubBtn, onPublic ? 'Public table (current)' : 'Switch to public table');
      pubBtn.disabled = onPublic;
      text(offBtn, isOff ? 'Offline table (current)' : 'Play offline (CPUs)');
      offBtn.disabled = isOff;

      show(banner, st.phase === 'betting');
      if (st.phase === 'betting') {
        text(bannerText, `Place your bets · ${Math.ceil(st.timer)}s`);
        css(bannerFill, 'width', `${(fraction(st.timer, BET_S) * 100).toFixed(1)}%`);
      }

      updatePlates(f);
      updateBubbles(f, now);
      updateControls(f);
    },
  };
}

function buildStatus(net: NetStatus, mySeat: number): string {
  let s = net.message;
  if (net.status === 'online' && net.humans > 1) s += ` · ${net.humans} gnomes`;
  if (net.code) s += ` · Room ${net.code}`;
  if (mySeat >= 0) s += ` · Seat ${mySeat + 1}`;
  return s;
}
