// The town's DOM interface, inside its own container appended to #ui: room name and online status (top left),
// account and map buttons (top right), the action button ("Enter the Gnomecino", "Play Blackjack"; bottom centre),
// chat log, chat input and emote picker (bottom). Phone-first: 44 px targets, safe-area insets, no hover.
import { CHAT, EMOTE_IDS, EMOTES, MAP_BLURBS, MAP_IDS, MAP_NAMES } from './config';
import type { EmoteId, MapId, NetStatus } from './config';

export interface HudHandlers {
  /** The player sent a chat line (already trimmed, not empty). */
  onChat(text: string): void;
  onEmote(e: EmoteId): void;
  /** The action button was pressed. */
  onAction(): void;
  /** The account button was pressed. */
  onAccount(): void;
  /** A map was picked in the map panel. */
  onTravel(map: MapId): void;
}

export interface Hud {
  setMapName(name: string): void;
  /** inRoom: players on my map, me included; inTown: players in the whole town. */
  setStatus(status: NetStatus, inRoom: number, inTown: number): void;
  /** Shows the action button with this label, or hides it (null). */
  setAction(label: string | null): void;
  /** Appends a chat line to the log. */
  log(name: string, color: number, text: string): void;
  /** Appends a grey system line to the log ("You entered the Gnomecino."). */
  system(text: string): void;
  /** The account button's label, e.g. "👤 Guest" or "👤 Pip". */
  setAccount(label: string): void;
  /** True while the chat input has focus (main.ts then ignores movement keys). */
  readonly typing: boolean;
  /** Focuses the chat input (Enter key on desktop). */
  focusChat(): void;
  /** Hides the whole HUD while a game is open over the town, shows it again after. */
  setVisible(visible: boolean): void;
}

const STYLE_ID = 'th-style';
const COLLAPSED_KEY = 'club-gnome.log-collapsed';
/** Log line height and the log's vertical padding (px), used to size the visible line count. */
const LINE_PX = 20;
const PAD_PX = 12;

const CSS = `
.th-root{position:fixed;inset:0;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;padding:calc(env(safe-area-inset-top) + 8px) calc(env(safe-area-inset-right) + 8px) calc(env(safe-area-inset-bottom) + 8px) calc(env(safe-area-inset-left) + 8px);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff;}
.th-hide{display:none !important;}
.th-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;}
.th-pill{background:rgba(20,20,28,0.72);border-radius:14px;padding:6px 12px;max-width:60vw;box-sizing:border-box;}
.th-map{font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.th-status{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.th-top-right{display:flex;gap:8px;}
.th-btn{pointer-events:auto;min-width:44px;min-height:44px;padding:0 12px;border:none;border-radius:12px;background:rgba(20,20,28,0.78);color:#fff;font-family:inherit;font-size:16px;font-weight:600;cursor:pointer;box-sizing:border-box;}
.th-bottom{width:100%;max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;}
.th-action{pointer-events:auto;align-self:center;min-height:52px;min-width:44px;padding:0 24px;border:none;border-radius:16px;background:#ffcc33;color:#1a1200;font-family:inherit;font-weight:700;font-size:18px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,0.35);box-sizing:border-box;}
.th-pop{animation:th-bounce 0.5s ease-out 1;}
@keyframes th-bounce{0%{transform:scale(0.6);}60%{transform:scale(1.08);}100%{transform:scale(1);}}
.th-logwrap{position:relative;width:100%;}
.th-log{pointer-events:auto;background:rgba(20,20,28,0.72);border-radius:12px;padding:6px 48px 6px 10px;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;font-size:14px;line-height:20px;width:100%;}
.th-line{word-break:break-word;}
.th-name{font-weight:700;}
.th-sys{color:#b5b5bd;font-style:italic;}
.th-toggle{position:absolute;top:0;right:0;pointer-events:auto;width:44px;height:44px;border:none;background:transparent;color:#fff;font-family:inherit;font-size:16px;cursor:pointer;}
.th-emotes{pointer-events:auto;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;background:rgba(20,20,28,0.72);border-radius:12px;padding:6px;box-sizing:border-box;}
.th-emote{min-width:44px;min-height:44px;border:none;border-radius:10px;background:rgba(255,255,255,0.12);font-size:22px;cursor:pointer;}
.th-chat{pointer-events:auto;display:flex;gap:6px;align-items:center;width:100%;}
.th-input{flex:1;min-width:0;min-height:44px;border:none;border-radius:12px;padding:0 12px;background:rgba(255,255,255,0.94);color:#111;font-family:inherit;font-size:16px;box-sizing:border-box;}
.th-send{min-width:64px;}
.th-panel-wrap{position:fixed;inset:0;pointer-events:auto;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);box-sizing:border-box;padding:calc(env(safe-area-inset-top) + 16px) calc(env(safe-area-inset-right) + 16px) calc(env(safe-area-inset-bottom) + 16px) calc(env(safe-area-inset-left) + 16px);}
.th-panel{width:100%;max-width:360px;max-height:80vh;overflow-y:auto;overscroll-behavior:contain;background:#1b1d2a;border-radius:16px;padding:14px;box-sizing:border-box;box-shadow:0 10px 30px rgba(0,0,0,0.5);}
.th-panel-head{display:flex;justify-content:space-between;align-items:center;}
.th-panel h2{margin:0;font-size:18px;}
.th-close{min-width:44px;min-height:44px;border:none;background:transparent;color:#fff;font-family:inherit;font-size:18px;cursor:pointer;}
.th-travel{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;min-height:56px;margin-top:8px;padding:10px 14px;border:none;border-radius:12px;background:#2b2e42;color:#fff;text-align:left;font-family:inherit;cursor:pointer;box-sizing:border-box;}
.th-travel:disabled{opacity:0.6;cursor:default;}
.th-travel-name{font-weight:700;font-size:16px;}
.th-travel-blurb{font-size:13px;opacity:0.85;}
.th-here-tag{font-size:12px;color:#ffcc33;}
@media (max-height:499px){
  .th-pill{padding:3px 10px;}
  .th-map{font-size:14px;}
  .th-status{font-size:12px;}
}
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
}

function button(cls: string, text: string): HTMLButtonElement {
  const b = el('button', cls, text);
  b.type = 'button';
  return b;
}

function statusText(status: NetStatus, inRoom: number, inTown: number): string {
  switch (status) {
    case 'online':
      return `🟢 ${inRoom} here · ${inTown} in the club`;
    case 'connecting':
      return '🟡 Connecting…';
    case 'retrying':
      return '🟠 Reconnecting…';
    case 'unavailable':
    default:
      return '⚪ Offline: just you';
  }
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(v: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, v ? '1' : '0');
  } catch {
    // Storage blocked: the choice simply is not remembered.
  }
}

export function createHud(ui: HTMLElement, h: HudHandlers): Hud {
  const doc = ui.ownerDocument;
  if (!doc.getElementById(STYLE_ID)) {
    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    doc.head.appendChild(style);
  }

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const shortMq = window.matchMedia('(max-height: 499px)');
  let collapsed = readCollapsed();
  let currentAction: string | null = null;

  // ---- root and top bar
  const root = el('div', 'th-root');

  const top = el('div', 'th-top');
  const pill = el('div', 'th-pill');
  const mapLabel = el('div', 'th-map');
  const statusLine = el('div', 'th-status', '🟡 Connecting…');
  pill.append(mapLabel, statusLine);

  const topRight = el('div', 'th-top-right');
  const mapBtn = button('th-btn', '🗺️ Map');
  const accountBtn = button('th-btn', '👤 Guest');
  topRight.append(mapBtn, accountBtn);
  top.append(pill, topRight);

  // ---- bottom stack: action button, log, emote row, chat bar
  const bottom = el('div', 'th-bottom');

  const actionBtn = button('th-action th-hide', '');

  const logWrap = el('div', 'th-logwrap');
  const log = el('div', 'th-log');
  log.setAttribute('role', 'log');
  const toggle = button('th-toggle', '▾');
  logWrap.append(log, toggle);

  const emoteRow = el('div', 'th-emotes th-hide');
  for (const id of EMOTE_IDS) {
    const b = button('th-emote', EMOTES[id]);
    b.setAttribute('aria-label', id);
    b.addEventListener('click', () => {
      emoteRow.classList.add('th-hide');
      h.onEmote(id);
    });
    emoteRow.append(b);
  }

  const chat = el('div', 'th-chat');
  const emoteBtn = button('th-btn', '😀');
  emoteBtn.setAttribute('aria-label', 'Emotes');
  const input = el('input', 'th-input');
  input.type = 'text';
  input.maxLength = 120;
  input.placeholder = 'Say something…';
  input.autocomplete = 'off';
  const sendBtn = button('th-btn th-send', 'Send');
  chat.append(emoteBtn, input, sendBtn);

  bottom.append(actionBtn, logWrap, emoteRow, chat);

  // ---- map panel
  const wrap = el('div', 'th-panel-wrap th-hide');
  const panel = el('div', 'th-panel');
  const head = el('div', 'th-panel-head');
  const title = el('h2', '', 'Where to?');
  const closeBtn = button('th-close', '✕');
  closeBtn.setAttribute('aria-label', 'Close');
  head.append(title, closeBtn);
  panel.append(head);

  const travelBtns: { id: MapId; btn: HTMLButtonElement; tag: HTMLElement }[] = [];
  for (const id of MAP_IDS) {
    const btn = button('th-travel', '');
    const name = el('span', 'th-travel-name', MAP_NAMES[id]);
    const blurb = el('span', 'th-travel-blurb', MAP_BLURBS[id]);
    const tag = el('span', 'th-here-tag th-hide', 'you are here');
    btn.append(name, blurb, tag);
    btn.addEventListener('click', () => {
      closeMap();
      h.onTravel(id);
    });
    panel.append(btn);
    travelBtns.push({ id, btn, tag });
  }
  wrap.append(panel);

  root.append(top, bottom, wrap);
  ui.appendChild(root);

  // ---- behaviour
  function openMap(): void {
    wrap.classList.remove('th-hide');
  }
  function closeMap(): void {
    wrap.classList.add('th-hide');
  }

  function applyLines(): void {
    const n = collapsed ? 2 : shortMq.matches ? 3 : 5;
    log.style.maxHeight = `${n * LINE_PX + PAD_PX}px`;
    toggle.textContent = collapsed ? '▴' : '▾';
    toggle.setAttribute('aria-label', collapsed ? 'Expand chat' : 'Collapse chat');
  }
  shortMq.addEventListener('change', applyLines);
  applyLines();

  function appendLine(node: HTMLElement): void {
    const atBottom = log.scrollTop + log.clientHeight >= log.scrollHeight - 4;
    log.append(node);
    while (log.childElementCount > CHAT.logLines) log.firstElementChild?.remove();
    if (atBottom) log.scrollTop = log.scrollHeight;
  }

  function send(): void {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    h.onChat(text);
    if (coarse) input.blur();
    else input.focus();
  }

  mapBtn.addEventListener('click', openMap);
  closeBtn.addEventListener('click', closeMap);
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) closeMap();
  });
  accountBtn.addEventListener('click', () => h.onAccount());

  actionBtn.addEventListener('click', () => h.onAction());

  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    writeCollapsed(collapsed);
    applyLines();
  });

  emoteBtn.addEventListener('click', () => emoteRow.classList.toggle('th-hide'));

  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      if (e.isComposing) return;
      e.preventDefault();
      send();
    } else if (e.key === 'Escape') {
      input.blur();
    }
  });
  input.addEventListener('keyup', (e) => e.stopPropagation());
  input.addEventListener('keypress', (e) => e.stopPropagation());

  // On desktop, keep focus in the input when Send is clicked.
  sendBtn.addEventListener('mousedown', (e) => {
    if (!coarse) e.preventDefault();
  });
  sendBtn.addEventListener('click', () => send());

  return {
    setMapName(name: string) {
      mapLabel.textContent = name;
      for (const t of travelBtns) {
        const here = MAP_NAMES[t.id] === name;
        t.btn.disabled = here;
        t.tag.classList.toggle('th-hide', !here);
      }
    },
    setStatus(status: NetStatus, inRoom: number, inTown: number) {
      const text = statusText(status, inRoom, inTown);
      if (statusLine.textContent !== text) statusLine.textContent = text;
    },
    setAction(label: string | null) {
      if (label === currentAction) return;
      const wasHidden = currentAction === null;
      currentAction = label;
      if (label === null) {
        actionBtn.classList.add('th-hide');
        return;
      }
      actionBtn.textContent = label;
      actionBtn.classList.remove('th-hide');
      if (wasHidden) {
        actionBtn.classList.remove('th-pop');
        void actionBtn.offsetWidth; // restart the bounce
        actionBtn.classList.add('th-pop');
      }
    },
    log(name: string, color: number, text: string) {
      const line = el('div', 'th-line');
      const who = el('span', 'th-name', name);
      who.style.color = `#${(color & 0xffffff).toString(16).padStart(6, '0')}`;
      line.append(who, doc.createTextNode(`: ${text}`));
      appendLine(line);
    },
    system(text: string) {
      appendLine(el('div', 'th-line th-sys', text));
    },
    setAccount(label: string) {
      accountBtn.textContent = label;
    },
    get typing(): boolean {
      return doc.activeElement === input;
    },
    focusChat() {
      input.focus();
    },
    setVisible(visible: boolean) {
      root.classList.toggle('th-hide', !visible);
      if (!visible) closeMap();
    },
  };
}
