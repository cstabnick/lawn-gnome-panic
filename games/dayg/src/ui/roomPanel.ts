// The room panel: solo, create, join or reopen (roadmap 8.7). The Online button opens it, and so does main.ts for `?open=room`.
import { DOM_MORE } from '../config';
import type { RoomChoice, RoomListItem, RoomPanel } from '../game/types';

// Same pattern as ROOM_CODE_RE in @lawn/mp. Copied rather than imported: the package index loads background.ts, which installs a worker onmessage handler.
const ROOM_CODE = /^[A-Z0-9]{4,8}$/;
const TITLE_MAX = 60;
const DEFAULT_TITLE = 'Mossgrave';

type Pace = RoomChoice['pace'];
type RoomMode = RoomChoice['roomMode'];

const PACES: readonly { value: Pace; label: string; enabled: boolean }[] = [
  { value: 'brisk', label: 'Brisk', enabled: true },
  { value: 'standard', label: 'Standard', enabled: true },
  { value: 'slow', label: 'Slow', enabled: true },
];
const MODES: readonly { value: RoomMode; label: string; enabled: boolean }[] = [
  { value: 'co-op', label: 'Co-op', enabled: true },
  { value: 'haven-peace', label: 'Haven peace (later)', enabled: false },
  { value: 'full', label: 'Full (later)', enabled: false },
];

const SURFACE = 'min-height:44px;min-width:44px;padding:8px 14px;border-radius:8px;border:1px solid #56614a;' +
  'background:#2d3a25;color:#eee;font:14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;box-sizing:border-box';
const INPUT = 'box-sizing:border-box;width:100%;min-height:44px;padding:8px 10px;border-radius:8px;border:1px solid #56614a;' +
  'background:#1d241a;color:#eee;font:15px system-ui,sans-serif';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (css) node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

function btn(text: string, onClick: () => void, css = ''): HTMLButtonElement {
  const b = el('button', SURFACE + ';' + css, text);
  b.type = 'button';
  b.addEventListener('click', () => { if (!b.disabled) onClick(); });
  return b;
}

function heading(text: string): HTMLElement {
  return el('h3', 'margin:18px 0 8px;font:600 16px system-ui,sans-serif;color:#e8c35a', text);
}

function formatSaved(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? iso : new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// A row of toggle buttons where one value is picked. Disabled options are shown dimmed and cannot be tapped.
function segment<T extends string>(options: readonly { value: T; label: string; enabled: boolean }[], initial: T):
  { node: HTMLElement; get(): T } {
  let value = initial;
  const row = el('div', 'display:flex;flex-wrap:wrap;gap:6px');
  const buttons = options.map((o) => {
    const b = btn(o.label, () => { value = o.value; paint(); });
    b.disabled = !o.enabled;
    if (!o.enabled) b.style.opacity = '0.45';
    row.append(b);
    return { b, o };
  });
  function paint(): void {
    for (const { b, o } of buttons) {
      const on = o.value === value;
      b.setAttribute('aria-pressed', String(on));
      b.style.borderColor = on ? '#e8c35a' : '#56614a';
      b.style.background = on ? '#4a5a36' : '#2d3a25';
    }
  }
  paint();
  return { node: row, get: () => value };
}

export function createRoomPanel(ui: HTMLElement): RoomPanel {
  const openListeners: (() => void)[] = [];
  const choiceListeners: ((c: RoomChoice) => void)[] = [];
  let worlds: readonly RoomListItem[] = [];

  const root = el('div');
  root.id = DOM_MORE.room;
  root.hidden = true;
  root.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;box-sizing:border-box;z-index:55;' +
    'background:rgba(18,22,16,0.97);color:#eee;font:14px system-ui,sans-serif;overflow-y:auto;overflow-x:hidden;' +
    '-webkit-overflow-scrolling:touch;touch-action:pan-y;pointer-events:auto;' +
    'padding:max(env(safe-area-inset-top),12px) max(env(safe-area-inset-right),12px) ' +
    'max(env(safe-area-inset-bottom),12px) max(env(safe-area-inset-left),12px)';
  const inner = el('div', 'max-width:480px;margin:0 auto;padding-bottom:24px');
  root.append(inner);

  function open(): void {
    if (!root.hidden) return;
    root.hidden = false;
    for (const fn of openListeners) fn();
  }
  function close(): void { root.hidden = true; }
  function choose(c: RoomChoice): void {
    close();
    for (const fn of choiceListeners) fn(c);
  }
  const formTitle = (): string => titleInput.value.trim() || DEFAULT_TITLE;

  // Header and status line.
  const head = el('div', 'display:flex;align-items:center;justify-content:space-between;gap:8px');
  head.append(el('h2', 'margin:0;font:700 20px system-ui,sans-serif', 'Online worlds'));
  const closeBtn = btn('✕', close, 'width:48px;height:48px;padding:0;font-size:22px');
  closeBtn.setAttribute('aria-label', 'Close online worlds');
  head.append(closeBtn);

  const statusRow = el('div', 'margin:12px 0 0;padding:10px;border-radius:8px;background:#1d241a;border:1px solid #3c4a32');
  const statusText = el('div', 'font:14px system-ui,sans-serif');
  const codeRow = el('div', 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px');
  const codeBig = el('span', 'font:700 28px ui-monospace,Consolas,monospace;letter-spacing:4px;color:#e8c35a;user-select:all');
  const copyBtn = btn('Copy code', () => {
    const code = codeBig.textContent ?? '';
    if (!code) return;
    navigator.clipboard.writeText(code)
      .then(() => { copyBtn.textContent = 'Copied'; })
      .catch(() => { copyBtn.textContent = 'Copy failed'; })
      .finally(() => setTimeout(() => { copyBtn.textContent = 'Copy code'; }, 1500));
  });
  codeRow.append(codeBig, copyBtn);
  codeRow.hidden = true;
  statusRow.append(statusText, codeRow);
  statusRow.hidden = true;

  // New world.
  const titleInput = el('input', INPUT);
  titleInput.value = DEFAULT_TITLE;
  titleInput.maxLength = TITLE_MAX;
  titleInput.setAttribute('aria-label', 'World title');
  const pace = segment(PACES, 'standard');
  const mode = segment(MODES, 'co-op');
  const createBtn = btn('Create world', () => choose({ mode: 'create', code: null, title: formTitle(), pace: pace.get(), roomMode: mode.get() }),
    'width:100%;margin-top:10px;background:#4a5a36');
  const newSection = el('section');
  newSection.append(heading('New world'), titleInput, el('div', 'margin:10px 0 4px;opacity:0.85', 'Pace'), pace.node,
    el('div', 'margin:10px 0 4px;opacity:0.85', 'Mode'), mode.node, createBtn);

  // Join.
  const codeInput = el('input', INPUT + ';text-transform:uppercase;width:auto;flex:1;min-width:0');
  codeInput.maxLength = 8;
  codeInput.placeholder = 'ROOM CODE';
  codeInput.setAttribute('aria-label', 'Room code');
  codeInput.setAttribute('autocomplete', 'off');
  codeInput.setAttribute('autocapitalize', 'characters');
  codeInput.spellcheck = false;
  const submitJoin = (): void => {
    const code = codeInput.value;
    if (!ROOM_CODE.test(code)) return;
    choose({ mode: 'join', code, title: formTitle(), pace: pace.get(), roomMode: mode.get() });
  };
  const joinBtn = btn('Join', submitJoin, 'min-width:96px');
  joinBtn.disabled = true;
  joinBtn.style.opacity = '0.45';
  codeInput.addEventListener('input', () => {
    const clean = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    if (codeInput.value !== clean) codeInput.value = clean;
    const ok = ROOM_CODE.test(clean);
    joinBtn.disabled = !ok;
    joinBtn.style.opacity = ok ? '1' : '0.45';
  });
  codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submitJoin(); } });
  const joinRow = el('div', 'display:flex;gap:8px;align-items:stretch');
  joinRow.append(codeInput, joinBtn);
  const joinSection = el('section');
  joinSection.append(heading('Join a friend'), joinRow,
    el('div', 'margin-top:4px;font:12px system-ui,sans-serif;opacity:0.8', 'Codes are 4 to 8 letters or numbers.'));

  // My worlds.
  const worldsBox = el('div');
  function renderWorlds(): void {
    worldsBox.replaceChildren();
    if (worlds.length === 0) {
      worldsBox.append(el('div', 'opacity:0.85', 'Sign in to keep worlds in the cloud.'));
      return;
    }
    for (const w of worlds) {
      const row = el('div', 'display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:8px;border:1px solid #3c4a32;' +
        'border-radius:8px;background:#1d241a');
      const text = el('div', 'flex:1;min-width:0');
      text.append(
        el('div', 'font:600 15px system-ui,sans-serif;overflow-wrap:anywhere', w.title),
        el('div', 'font:13px system-ui,sans-serif;opacity:0.85;overflow-wrap:anywhere', w.summary),
        el('div', 'font:12px system-ui,sans-serif;opacity:0.7', `Last saved ${formatSaved(w.updatedAt)}`),
      );
      row.append(text, btn('Reopen', () => choose({ mode: 'reopen', code: w.code, title: w.title, pace: pace.get(), roomMode: mode.get() })));
      worldsBox.append(row);
    }
  }
  const worldsSection = el('section');
  worldsSection.append(heading('My worlds'), worldsBox);
  renderWorlds();

  const soloBtn = btn('Play alone', () => choose({ mode: 'solo', code: null, title: formTitle(), pace: pace.get(), roomMode: mode.get() }),
    'width:100%;margin-top:18px');

  inner.append(head, statusRow, newSection, joinSection, worldsSection, soloBtn);

  // Taps and keys inside the panel must not reach the game underneath; Escape closes it.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('keydown', (e) => e.stopPropagation());
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !root.hidden) close(); }, true);

  // The Online button, bottom of the HUD zone, right side.
  const openBtn = btn('Online', open,
    'position:absolute;z-index:50;pointer-events:auto;top:calc(72px + env(safe-area-inset-top));right:calc(60px + env(safe-area-inset-right))');
  openBtn.id = 'dayg-room-open';
  ui.appendChild(openBtn);
  ui.appendChild(root);

  return {
    root,
    open,
    close,
    isOpen: (): boolean => !root.hidden,
    onChoose: (fn: (c: RoomChoice) => void): void => { choiceListeners.push(fn); },
    onOpen: (fn: () => void): void => { openListeners.push(fn); },
    setWorlds: (list: readonly RoomListItem[]): void => { worlds = list.slice(); renderWorlds(); },
    setStatus: (text: string): void => {
      statusText.textContent = text;
      statusRow.hidden = text === '';
      // A room code shows large with a Copy button: the status text carries it as "code ABCD" or "code: ABCD".
      const m = /\bcode[: ]+([A-Z0-9]{4,8})\b/.exec(text);
      codeBig.textContent = m ? m[1] : '';
      codeRow.hidden = !m;
    },
  };
}
