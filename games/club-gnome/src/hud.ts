// The town's DOM interface, inside its own container appended to #ui. Top: room name and online status (left),
// map, account and creator buttons (right). Bottom: the action pill (centre), a read-only chat log, the emote row
// and chat input (both only while open), and a bottom row with the GitHub and PRIVACY links (left) and the emote
// and chat buttons (right). Everything at the bottom is pointer-transparent except those small controls, so the
// ground under the gnome stays tappable. Phone-first: 44 px targets, safe-area insets, no hover-only UI.
import { CHAT, EMOTE_IDS, EMOTES, MAP_BLURBS, MAP_IDS, MAP_NAMES } from './config';
import type { EmoteId, MapId, NetStatus } from './config';

export interface HudHandlers {
  /** The player sent a chat line (already trimmed, not empty). */
  onChat(text: string): void;
  onEmote(e: EmoteId): void;
  /** An animated emote button was pressed. */
  onAnim(id: string): void;
  /** The emote row was just opened (main.ts refreshes the animated emotes). */
  onEmoteMenu(): void;
  /** The action button was pressed. */
  onAction(): void;
  /** The account button was pressed. */
  onAccount(): void;
  /** The "Gnome" button was pressed: open the character creator. */
  onCreator(): void;
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
  /** True while the chat input is open and has focus (main.ts then ignores movement keys). */
  readonly typing: boolean;
  /** Opens the chat input and focuses it (Enter key on desktop). */
  focusChat(): void;
  /** Hides the whole HUD while a game is open over the town, shows it again after. */
  setVisible(visible: boolean): void;
  /** Adds an element under the map name, top left, below the ones added before (volume, wallet, help). It hides with the HUD. */
  addTopControl(el: HTMLElement): void;
  /** The animated emotes shown first in the emote row (the player's equipped ones, max 4). */
  setAnimEmotes(list: readonly { id: string; label: string; icon: string }[]): void;
}

const STYLE_ID = 'th-style';
const COLLAPSED_KEY = 'club-gnome.log-collapsed';
/** Log line height and the log's vertical padding (px), used to size the visible line count. */
const LINE_PX = 20;
const PAD_PX = 12;

/** GitHub mark, the same one Lawn Gnome Panic's lobby uses. */
const GH_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

const CSS = `
.th-root{position:fixed;inset:0;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;padding:calc(env(safe-area-inset-top) + 8px) calc(env(safe-area-inset-right) + 8px) calc(env(safe-area-inset-bottom) + 8px) calc(env(safe-area-inset-left) + 8px);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff;}
.th-hide{display:none !important;}
.th-top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:8px;}
.th-pill{background:rgba(20,20,28,0.72);border-radius:14px;padding:6px 12px;max-width:60vw;box-sizing:border-box;}
.th-map{font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.th-status{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.th-vol{position:absolute;left:calc(env(safe-area-inset-left) + 8px);top:calc(env(safe-area-inset-top) + 64px);pointer-events:none;display:flex;flex-direction:column;align-items:flex-start;gap:8px;}
.th-vol > *{pointer-events:auto;}
.th-top-right{display:flex;gap:8px;margin-left:auto;}
.th-btn{pointer-events:auto;min-width:44px;min-height:44px;padding:0 12px;border:none;border-radius:12px;background:rgba(20,20,28,0.78);color:#fff;font-family:inherit;font-size:16px;font-weight:600;white-space:nowrap;cursor:pointer;box-sizing:border-box;}
.th-acct{max-width:40vw;overflow:hidden;text-overflow:ellipsis;}
.th-bottom{width:100%;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;pointer-events:none;}
.th-action{pointer-events:auto;align-self:center;min-height:44px;min-width:44px;padding:0 18px;border:none;border-radius:22px;background:#ffcc33;color:#1a1200;font-family:inherit;font-weight:700;font-size:16px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,0.35);box-sizing:border-box;}
.th-pop{animation:th-bounce 0.5s ease-out 1;}
@keyframes th-bounce{0%{transform:scale(0.6);}60%{transform:scale(1.08);}100%{transform:scale(1);}}
.th-logwrap{position:relative;width:100%;max-width:640px;margin:0 auto;pointer-events:none;}
.th-log{pointer-events:none;background:rgba(20,20,28,0.72);border-radius:12px;padding:6px 48px 6px 10px;box-sizing:border-box;overflow:hidden;font-size:14px;line-height:20px;width:100%;}
.th-line{word-break:break-word;}
.th-name{font-weight:700;}
.th-sys{color:#b5b5bd;font-style:italic;}
.th-toggle{position:absolute;top:0;right:0;pointer-events:auto;width:44px;height:44px;border:none;background:transparent;color:#fff;font-family:inherit;font-size:14px;cursor:pointer;}
.th-emotes{pointer-events:auto;max-width:640px;width:100%;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;background:rgba(20,20,28,0.72);border-radius:12px;padding:6px;box-sizing:border-box;}
.th-emote{min-width:44px;min-height:44px;border:none;border-radius:10px;background:rgba(255,255,255,0.12);font-size:22px;cursor:pointer;}
.th-anims{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;width:100%;}
.th-anim{min-width:64px;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:20px;line-height:1.1;color:#fff;}
.th-anim-lbl{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;line-height:1.2;}
.th-chat{pointer-events:auto;max-width:640px;width:100%;margin:0 auto;display:flex;gap:6px;align-items:center;box-sizing:border-box;}
.th-input{flex:1;min-width:0;min-height:44px;border:none;border-radius:12px;padding:0 12px;background:rgba(255,255,255,0.94);color:#111;font-family:inherit;font-size:16px;box-sizing:border-box;}
.th-send{min-width:64px;}
.th-x{pointer-events:auto;min-width:44px;min-height:44px;border:none;border-radius:12px;background:rgba(20,20,28,0.78);color:#fff;font-family:inherit;font-size:16px;cursor:pointer;box-sizing:border-box;}
.th-foot{width:100%;display:flex;justify-content:space-between;align-items:flex-end;gap:8px;box-sizing:border-box;pointer-events:none;}
.th-links{display:flex;align-items:center;gap:2px;pointer-events:none;}
.th-gh{pointer-events:auto;display:flex;align-items:center;justify-content:center;width:44px;height:44px;color:#e6dcff;opacity:0.85;}
.th-gh:hover{color:#fff;opacity:1;}
.th-gh svg{width:24px;height:24px;fill:currentColor;filter:drop-shadow(0 2px 0 #000);}
.th-privacy{pointer-events:auto;display:inline-flex;align-items:center;min-height:44px;padding:0 8px;color:#e6dcff;opacity:0.8;font-size:11px;letter-spacing:1px;text-decoration:none;white-space:nowrap;text-shadow:0 1px 2px #000;}
.th-privacy:hover{opacity:1;text-decoration:underline;}
.th-controls{display:flex;gap:8px;pointer-events:none;}
.th-round{pointer-events:auto;width:44px;height:44px;min-width:44px;min-height:44px;padding:0;border:none;border-radius:50%;background:rgba(20,20,28,0.78);color:#fff;font-family:inherit;font-size:20px;line-height:1;cursor:pointer;box-sizing:border-box;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.35);}
.th-panel-wrap{position:fixed;inset:0;z-index:20;pointer-events:auto;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);box-sizing:border-box;padding:calc(env(safe-area-inset-top) + 16px) calc(env(safe-area-inset-right) + 16px) calc(env(safe-area-inset-bottom) + 16px) calc(env(safe-area-inset-left) + 16px);}
.th-panel{width:100%;max-width:360px;max-height:80vh;overflow-y:auto;overscroll-behavior:contain;background:#1b1d2a;border-radius:16px;padding:14px;box-sizing:border-box;box-shadow:0 10px 30px rgba(0,0,0,0.5);}
.th-panel-head{display:flex;justify-content:space-between;align-items:center;}
.th-panel h2{margin:0;font-size:18px;}
.th-close{min-width:44px;min-height:44px;border:none;background:transparent;color:#fff;font-family:inherit;font-size:18px;cursor:pointer;}
.th-travel{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;min-height:56px;margin-top:8px;padding:10px 14px;border:none;border-radius:12px;background:#2b2e42;color:#fff;text-align:left;font-family:inherit;cursor:pointer;box-sizing:border-box;}
.th-travel:disabled{opacity:0.6;cursor:default;}
.th-travel-name{font-weight:700;font-size:16px;}
.th-travel-blurb{font-size:13px;opacity:0.85;}
.th-here-tag{font-size:12px;color:#ffcc33;}
@media (max-width:420px){
  .th-btn{padding:0 8px;font-size:14px;}
  .th-map{font-size:14px;}
}
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

  const shortMq = window.matchMedia('(max-height: 499px)');
  let collapsed = readCollapsed();
  let currentAction: string | null = null;
  let chatOpen = false;

  // ---- root and top bar
  const root = el('div', 'th-root');

  const top = el('div', 'th-top');
  const pill = el('div', 'th-pill');
  const mapLabel = el('div', 'th-map');
  const statusLine = el('div', 'th-status', '🟡 Connecting…');
  pill.append(mapLabel, statusLine);

  const topRight = el('div', 'th-top-right');
  /** The column under the map name that addTopControl fills (volume, wallet, help), top to bottom. */
  const topStack = el('div', 'th-vol');
  const mapBtn = button('th-btn', '🗺️ Map');
  const accountBtn = button('th-btn th-acct', '👤 Guest');
  const creatorBtn = button('th-btn', '🎨 Gnome');
  topRight.append(mapBtn, accountBtn, creatorBtn);
  top.append(pill, topRight);

  // ---- bottom stack: action pill, log, emote row, chat row, foot (links and buttons)
  const bottom = el('div', 'th-bottom');

  const actionBtn = button('th-action th-hide', '');

  const logWrap = el('div', 'th-logwrap');
  const log = el('div', 'th-log');
  log.setAttribute('role', 'log');
  const toggle = button('th-toggle', '▾');
  logWrap.append(log, toggle);

  const emoteRow = el('div', 'th-emotes th-hide');
  const animWrap = el('div', 'th-anims');
  emoteRow.append(animWrap);
  for (const id of EMOTE_IDS) {
    const b = button('th-emote', EMOTES[id]);
    b.setAttribute('aria-label', id);
    b.addEventListener('click', () => {
      emoteRow.classList.add('th-hide');
      h.onEmote(id);
    });
    emoteRow.append(b);
  }

  const chatRow = el('div', 'th-chat th-hide');
  const input = el('input', 'th-input');
  input.type = 'text';
  input.maxLength = 120;
  input.placeholder = 'Say something…';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Chat message');
  const sendBtn = button('th-btn th-send', 'Send');
  const closeChatBtn = button('th-x', '✕');
  closeChatBtn.setAttribute('aria-label', 'Close chat');
  chatRow.append(input, sendBtn, closeChatBtn);

  const foot = el('div', 'th-foot');
  const links = el('div', 'th-links');
  const gh = el('a', 'th-gh');
  gh.href = 'https://github.com/cstabnick/lawn-gnome-panic';
  gh.target = '_blank';
  gh.rel = 'noopener';
  gh.title = 'Source code on GitHub';
  gh.setAttribute('aria-label', 'Source code on GitHub');
  gh.innerHTML = GH_SVG;
  gh.addEventListener('pointerdown', (e) => e.stopPropagation());
  const privacy = el('a', 'th-privacy', 'PRIVACY');
  privacy.href = 'https://github.com/cstabnick/lawn-gnome-panic/blob/main/PRIVACY.md';
  privacy.target = '_blank';
  privacy.rel = 'noopener';
  privacy.title = 'What the game collects (anonymous reports, no names or chat)';
  privacy.addEventListener('pointerdown', (e) => e.stopPropagation());
  links.append(gh, privacy);

  const controls = el('div', 'th-controls');
  const emoteBtn = button('th-round', '😀');
  emoteBtn.setAttribute('aria-label', 'Emotes');
  const chatBtn = button('th-round', '💬');
  chatBtn.setAttribute('aria-label', 'Open chat');
  controls.append(emoteBtn, chatBtn);
  foot.append(links, controls);

  bottom.append(actionBtn, logWrap, emoteRow, chatRow, foot);

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

  function openChat(): void {
    if (chatOpen) return;
    chatOpen = true;
    chatRow.classList.remove('th-hide');
    chatBtn.classList.add('th-hide');
  }

  function closeChat(): void {
    if (!chatOpen) return;
    chatOpen = false; // set first: the blur this may cause then returns at once
    chatRow.classList.add('th-hide');
    chatBtn.classList.remove('th-hide');
    if (doc.activeElement === input) input.blur();
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
    if (text) {
      input.value = '';
      h.onChat(text);
    }
    closeChat();
  }

  mapBtn.addEventListener('click', openMap);
  closeBtn.addEventListener('click', closeMap);
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) closeMap();
  });
  accountBtn.addEventListener('click', () => h.onAccount());
  creatorBtn.addEventListener('click', () => h.onCreator());

  actionBtn.addEventListener('click', () => h.onAction());

  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    writeCollapsed(collapsed);
    applyLines();
  });

  emoteBtn.addEventListener('click', () => {
    const open = emoteRow.classList.toggle('th-hide') === false;
    if (open) h.onEmoteMenu();
  });

  chatBtn.addEventListener('click', () => {
    openChat();
    input.focus(); // inside the click, so mobile browsers raise the keyboard
  });

  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      if (e.isComposing) return;
      e.preventDefault();
      send();
    } else if (e.key === 'Escape') {
      closeChat();
    }
  });
  input.addEventListener('keyup', (e) => e.stopPropagation());
  input.addEventListener('keypress', (e) => e.stopPropagation());
  // Leaving the input (tap elsewhere, Tab away) closes the chat row.
  input.addEventListener('blur', () => closeChat());

  // Keep focus in the input when Send or ✕ is pressed; the click then handles the action.
  for (const b of [sendBtn, closeChatBtn]) {
    b.addEventListener('mousedown', (e) => e.preventDefault());
  }
  sendBtn.addEventListener('click', () => send());
  closeChatBtn.addEventListener('click', () => closeChat());

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
      return chatOpen && doc.activeElement === input;
    },
    focusChat() {
      openChat();
      input.focus();
    },
    addTopControl(el: HTMLElement) {
      if (!topStack.isConnected) root.append(topStack);
      topStack.append(el);
    },
    setAnimEmotes(list) {
      const items: HTMLButtonElement[] = list.map((e) => {
        const b = button('th-emote th-anim', '');
        b.setAttribute('aria-label', e.label);
        b.append(doc.createTextNode(e.icon), el('span', 'th-anim-lbl', e.label));
        b.addEventListener('click', () => {
          emoteRow.classList.add('th-hide');
          h.onAnim(e.id);
        });
        return b;
      });
      const edit = button('th-emote th-anim', '');
      edit.setAttribute('aria-label', 'Edit');
      edit.append(doc.createTextNode('🎨'), el('span', 'th-anim-lbl', 'Edit'));
      edit.addEventListener('click', () => {
        emoteRow.classList.add('th-hide');
        h.onCreator();
      });
      items.push(edit);
      animWrap.replaceChildren(...items);
    },
    setVisible(visible: boolean) {
      root.classList.toggle('th-hide', !visible);
      if (!visible) closeMap();
    },
  };
}
