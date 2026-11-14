// Title menu and online waiting panel, as DOM over the canvas. Appends one container (#gp-menu) to the parent.
import { getMyGnome } from '@lawn/gnome';
import { BOARD } from '../config';
import type { NetStatus } from '../net';

export interface MenuHandlers {
  onSolo(rounds: number): void;
  onQuickMatch(name: string): void;
  onRoom(code: string, name: string): void;
  /** Cancel the queue (while waiting) or leave the party (the small corner button). */
  onLeave(): void;
}
export interface Menu {
  /** 'title' = the full menu; 'waiting' = status panel with a Cancel button; 'hidden' = only the corner Leave button. */
  show(mode: 'title' | 'waiting' | 'hidden'): void;
  setStatus(s: NetStatus): void;
  /** Hide the online buttons (net unavailable). */
  setOnlineAvailable(ok: boolean): void;
}

const NAME_KEY = 'gnome-party.name';
const NAME_MAX = 16;
const ROOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ROOM_MIN = 4;
const ROOM_MAX = 8;
const MAKE_LEN = 5;
const PINK = '#ff3fb4';
const CYAN = '#3ff0ff';
const GOLD = '#ffd54f';
const GREY = '#c9c2dd';
const BAD = '#ff8a8a';

const ROOT_CSS = 'position:absolute;inset:0;display:flex;flex-direction:column;overflow-y:auto;-webkit-overflow-scrolling:touch;'
  + 'touch-action:pan-y;pointer-events:none;color:#fff;font-family:system-ui,sans-serif;text-shadow:0 2px 4px #000;';
const PANEL_CSS = 'box-sizing:border-box;width:calc(100% - 32px);max-width:420px;margin:auto;padding:16px;border-radius:14px;'
  + 'background:rgba(20,10,40,0.78);flex-direction:column;gap:12px;pointer-events:auto;';
const BTN_CSS = 'box-sizing:border-box;min-height:48px;min-width:48px;padding:0 18px;border:0;border-radius:12px;'
  + 'font:900 18px system-ui,sans-serif;color:#fff;cursor:pointer;touch-action:manipulation;text-shadow:none;';
const INPUT_CSS = 'box-sizing:border-box;width:100%;min-height:48px;padding:10px 12px;border-radius:10px;'
  + 'border:2px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.35);color:#fff;font:700 16px system-ui,sans-serif;';
const LABEL_CSS = 'margin:0 0 4px;color:' + GREY + ';font-size:14px;';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, id?: string, css?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (id) e.id = id;
  if (css) e.style.cssText = css;
  if (text !== undefined) e.textContent = text;
  return e;
}

function button(id: string, label: string, bg: string, fg = '#fff', full = false): HTMLButtonElement {
  const b = el('button', id, BTN_CSS + 'background:' + bg + ';color:' + fg + ';' + (full ? 'width:100%;' : ''), label);
  b.type = 'button';
  return b;
}

/** Keeps a text input usable on phones: the canvas and the global touch handling must not see its taps. */
function typeable(input: HTMLInputElement): HTMLInputElement {
  input.addEventListener('pointerdown', (e) => e.stopPropagation());
  input.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  return input;
}

function vis(node: HTMLElement, on: boolean, display = 'flex'): void {
  node.style.display = on ? display : 'none';
}

function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveName(v: string): void {
  try {
    localStorage.setItem(NAME_KEY, v);
  } catch {
    // storage unavailable (private window or blocked): the name just is not remembered
  }
}

function cleanCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_MAX);
}

function randomCode(n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) s += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  return s;
}

export function createMenu(parent: HTMLElement, h: MenuHandlers): Menu {
  const root = el('div', 'gp-menu', ROOT_CSS);
  root.setAttribute('data-scroll', '');

  // ---- title panel ----
  const title = el('div', 'gp-title', PANEL_CSS);
  const heading = el('h1', undefined,
    'margin:0;font:900 italic 40px system-ui,sans-serif;text-align:center;color:' + PINK + ';'
    + 'text-shadow:0 0 8px ' + PINK + ',0 2px 4px #000;', 'GNOME PARTY');

  const name = typeable(el('input', 'gp-name', INPUT_CSS) as HTMLInputElement);
  name.type = 'text';
  name.maxLength = NAME_MAX;
  name.placeholder = 'Your gnome name';
  name.autocomplete = 'off';
  name.value = getMyGnome()?.name || loadName();
  name.addEventListener('change', () => saveName(name.value.trim()));
  const nameLabel = el('label', undefined, LABEL_CSS, 'Name');
  nameLabel.appendChild(name);

  let rounds: number = BOARD.defaultRounds;
  const roundRow = el('div', 'gp-rounds', 'display:flex;gap:8px;');
  const roundBtns = BOARD.roundChoices.map((n) => {
    const b = button('gp-rounds-' + n, String(n), 'rgba(255,255,255,0.12)', '#fff');
    b.style.flex = '1 1 0';
    b.onclick = () => {
      rounds = n;
      paintRounds();
    };
    roundRow.appendChild(b);
    return { n, b };
  });
  const paintRounds = (): void => {
    for (const { n, b } of roundBtns) {
      b.style.background = n === rounds ? CYAN : 'rgba(255,255,255,0.12)';
      b.style.color = n === rounds ? '#14082a' : '#fff';
    }
  };
  paintRounds();
  const roundLabel = el('div', undefined, LABEL_CSS, 'Rounds (vs CPUs)');
  roundLabel.appendChild(roundRow);

  const solo = button('gp-solo', 'PLAY VS CPUs', PINK, '#fff', true);
  solo.style.fontSize = '22px';
  solo.onclick = () => h.onSolo(rounds);

  const divider = el('div', undefined, 'height:2px;background:rgba(255,255,255,0.15);margin:2px 0;');

  // ---- online section (hidden when the net is unavailable) ----
  const online = el('div', 'gp-online', 'flex-direction:column;gap:12px;');
  const quick = button('gp-quick', 'QUICK MATCH', CYAN, '#14082a', true);
  quick.onclick = () => h.onQuickMatch(readName());

  const codeRow = el('div', undefined, 'display:flex;gap:8px;');
  const code = typeable(el('input', 'gp-code', INPUT_CSS + 'flex:1 1 0;min-width:0;text-transform:uppercase;letter-spacing:0.1em;') as HTMLInputElement);
  code.type = 'text';
  code.maxLength = ROOM_MAX;
  code.placeholder = 'Room code';
  code.autocomplete = 'off';
  code.setAttribute('autocapitalize', 'characters');
  code.spellcheck = false;
  const join = button('gp-room', 'JOIN ROOM', PINK, '#fff');
  join.disabled = true;
  join.style.opacity = '0.4';
  codeRow.append(code, join);

  const make = button('gp-make', 'MAKE ROOM', 'rgba(255,255,255,0.14)', '#fff', true);

  const refreshJoin = (): void => {
    const valid = code.value.length >= ROOM_MIN && code.value.length <= ROOM_MAX;
    join.disabled = !valid;
    join.style.opacity = valid ? '1' : '0.4';
  };
  code.addEventListener('input', () => {
    const cleaned = cleanCode(code.value);
    if (code.value !== cleaned) code.value = cleaned;
    refreshJoin();
  });
  join.onclick = () => {
    const c = cleanCode(code.value);
    if (c.length >= ROOM_MIN) h.onRoom(c, readName());
  };
  make.onclick = () => {
    const c = randomCode(MAKE_LEN);
    code.value = c;
    refreshJoin();
    h.onRoom(c, readName());
  };
  online.append(quick, codeRow, make);

  title.append(heading, nameLabel, roundLabel, solo, divider, online);

  // ---- waiting panel ----
  const wait = el('div', 'gp-wait', PANEL_CSS + 'text-align:center;');
  const status = el('p', 'gp-status', 'margin:8px 0;font-size:18px;font-weight:700;min-height:1.4em;');
  const roomBox = el('div', 'gp-roombox', 'margin:8px 0;padding:12px;border-radius:12px;background:rgba(0,0,0,0.3);');
  const roomLine = el('div', undefined, 'font-size:18px;font-weight:700;');
  roomLine.append('Room ');
  const roomCode = el('span', 'gp-roomcode',
    'font:900 44px ui-monospace,Menlo,Consolas,monospace;letter-spacing:0.12em;color:' + GOLD + ';'
    + 'text-shadow:0 0 12px ' + GOLD + ',0 2px 4px #000;');
  roomLine.append(roomCode, ': tell your friends');
  roomBox.appendChild(roomLine);
  const cancel = button('gp-cancel', 'CANCEL', 'rgba(255,255,255,0.14)', '#fff', true);
  cancel.onclick = () => h.onLeave();
  const back = button('gp-back', 'BACK', 'rgba(255,255,255,0.14)', '#fff', true);
  back.onclick = () => show('title');
  wait.append(status, roomBox, cancel, back);

  // ---- corner leave button (hidden mode) ----
  const leave = button('gp-leave', '✕', 'rgba(20,10,40,0.78)', '#fff');
  leave.setAttribute('aria-label', 'Leave the party');
  leave.style.cssText += 'position:absolute;top:calc(8px + env(safe-area-inset-top));right:calc(8px + env(safe-area-inset-right));'
    + 'width:48px;padding:0;pointer-events:auto;';
  leave.onclick = () => {
    if (confirm('Leave the party?')) h.onLeave();
  };

  root.append(title, wait, leave);
  parent.appendChild(root);

  let lastError = false;

  function readName(): string {
    const v = name.value.trim().slice(0, NAME_MAX) || 'Gnome';
    saveName(name.value.trim());
    return v;
  }

  function show(m: 'title' | 'waiting' | 'hidden'): void {
    vis(title, m === 'title', 'flex');
    vis(wait, m === 'waiting', 'flex');
    vis(leave, m === 'hidden', 'block');
  }

  function setStatus(s: NetStatus): void {
    lastError = s.status === 'error';
    status.textContent = s.message;
    status.style.color = lastError ? BAD : '';
    vis(roomBox, !!s.code, 'block');
    if (s.code) roomCode.textContent = s.code;
    vis(cancel, !lastError, 'flex');
    vis(back, lastError, 'flex');
  }

  function setOnlineAvailable(ok: boolean): void {
    vis(online, ok, 'flex');
  }

  // initial state
  show('title');
  setStatus({ status: 'off', message: '', code: null });

  return { show, setStatus, setOnlineAvailable };
}
