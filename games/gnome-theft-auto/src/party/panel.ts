// The Party button and its panel (DOM only, no game state). It shows the view it is given and calls the actions.

export interface PartyPanelView {
  /** My party code, or null when not in a party. */
  code: string | null;
  /** My party, me included. dist = metres from me, null for me. */
  members: { id: number; name: string; leader: boolean; me: boolean; dist: number | null }[];
  /** Online players not in my party (invite targets). */
  others: { id: number; name: string }[];
  /** Open invites to me. */
  invites: { from: number; name: string; code: string }[];
  /** Party chat, oldest first (the last 30 lines). */
  chat: { name: string; text: string; mine: boolean }[];
}

export interface PartyPanelActions {
  create(): void;
  join(code: string): void;
  leave(): void;
  invite(id: number): void;
  accept(from: number): void;
  decline(from: number): void;
  say(text: string): void;
  ping(): void;
  warp(id: number): void;
}

export interface PartyPanel {
  /** Show this state. Cheap to call often: redraws only when the view changed. */
  render(v: PartyPanelView): void;
  /** Number on the button (open invites + unread chat); 0 hides it. */
  setBadge(n: number): void;
  readonly isOpen: boolean;
  /** Open, close, or (no argument) flip the panel. */
  toggle(open?: boolean): void;
  /** Show or hide the button and the panel (hidden offline and in cutscenes). */
  setVisible(v: boolean): void;
}

const STYLE_ID = 'gta-party-style';

const CSS = `
#gta-party{pointer-events:none;}
#gta-party .gta-party-btn{position:fixed;right:calc(env(safe-area-inset-right) + max(18px,4vw));top:calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 146px);z-index:30;width:44px;height:44px;min-width:44px;min-height:44px;box-sizing:border-box;border-radius:50%;border:2px solid rgba(255,255,255,.7);background:rgba(20,20,20,.55);color:#fff;font-size:20px;line-height:1;padding:0;cursor:pointer;pointer-events:auto;touch-action:manipulation;}
#gta-party .gta-party-btn.on{border-color:#f2c230;box-shadow:0 0 0 2px rgba(242,194,48,.55);}
#gta-party .gta-party-badge{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 5px;box-sizing:border-box;border-radius:9px;background:#e53935;color:#fff;font:700 11px/14px system-ui,sans-serif;text-align:center;}
#gta-party .gta-party-panel{position:fixed;z-index:31;right:calc(env(safe-area-inset-right) + 70px);top:calc(env(safe-area-inset-top) + 18px);width:320px;max-height:calc(100vh - 36px);overflow-y:auto;box-sizing:border-box;padding:12px;border-radius:12px;background:rgba(16,18,22,.94);color:#fff;font:14px system-ui,sans-serif;pointer-events:auto;display:none;}
#gta-party .gta-party-panel.open{display:block;}
#gta-party .gta-party-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
#gta-party .gta-party-title{font-weight:800;font-size:16px;}
#gta-party .gta-party-sec{margin-top:12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#bbb;}
#gta-party .gta-party-row{display:flex;align-items:center;gap:8px;margin-top:6px;min-width:0;}
#gta-party .gta-party-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#gta-party .gta-party-muted{color:#aaa;}
#gta-party .gta-party-code{font-weight:800;font-size:22px;letter-spacing:.25em;color:#ffd23f;}
#gta-party .gta-party-log{max-height:140px;overflow-y:auto;margin-top:6px;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.3);}
#gta-party .gta-party-line{word-break:break-word;margin:2px 0;}
#gta-party .gta-party-me{color:#ffd23f;font-weight:700;}
#gta-party .gta-party-them{color:#cfe6ff;font-weight:700;}
#gta-party button{min-height:44px;min-width:44px;box-sizing:border-box;padding:0 12px;border-radius:22px;border:2px solid rgba(255,255,255,.7);background:rgba(40,40,40,.8);color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;flex:none;}
#gta-party button.gta-party-x{width:44px;padding:0;border-radius:50%;font-size:16px;}
#gta-party button.gta-party-btn{width:44px;height:44px;border-radius:50%;padding:0;font-size:20px;}
#gta-party button.gta-party-wide{width:100%;margin-top:8px;}
#gta-party .gta-party-input{flex:1;min-width:0;height:44px;min-height:44px;box-sizing:border-box;padding:0 12px;border-radius:22px;border:2px solid rgba(255,255,255,.4);background:rgba(0,0,0,.4);color:#fff;font-size:16px;font-family:system-ui,sans-serif;}
@media (max-width:600px){
  #gta-party .gta-party-panel{left:calc(env(safe-area-inset-left) + 16px);right:calc(env(safe-area-inset-right) + 16px);width:auto;top:calc(env(safe-area-inset-top) + 16px);max-height:70vh;}
}
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label: string, onClick: () => void, cls?: string): HTMLButtonElement {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

export function createPartyPanel(ui: HTMLElement, actions: PartyPanelActions): PartyPanel {
  ensureStyle();

  const root = el('div');
  root.id = 'gta-party';

  const btn = el('button', 'gta-party-btn', '👥');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Party');
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('pointerdown', (e) => e.stopPropagation());

  const badge = el('span', 'gta-party-badge');
  badge.style.display = 'none';
  btn.appendChild(badge);

  const panel = el('div', 'gta-party-panel');
  panel.addEventListener('pointerdown', (e) => e.stopPropagation());

  root.append(btn, panel);
  ui.appendChild(root);

  // Inputs are created once and re-appended on every rebuild, so typed text and focus survive.
  const joinInput = el('input', 'gta-party-input');
  joinInput.type = 'text';
  joinInput.maxLength = 4;
  joinInput.placeholder = 'CODE';
  joinInput.setAttribute('autocapitalize', 'characters');
  joinInput.setAttribute('autocomplete', 'off');

  const chatInput = el('input', 'gta-party-input');
  chatInput.type = 'text';
  chatInput.maxLength = 120;
  chatInput.placeholder = 'Say something';
  chatInput.setAttribute('autocomplete', 'off');

  const doJoin = (): void => actions.join(joinInput.value);
  const doSay = (): void => {
    const text = chatInput.value;
    if (text.trim() === '') return;
    actions.say(text);
    chatInput.value = '';
  };

  joinInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); doJoin(); }
  });
  joinInput.addEventListener('keyup', (e) => e.stopPropagation());
  chatInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); doSay(); }
  });
  chatInput.addEventListener('keyup', (e) => e.stopPropagation());

  let open = false;
  let lastKey: string | null = null;
  let chatLog: HTMLDivElement | null = null;

  function scrollChatToBottom(): void {
    if (chatLog) chatLog.scrollTop = chatLog.scrollHeight;
  }

  function build(v: PartyPanelView): void {
    const hadFocus = document.activeElement as HTMLElement | null;
    const parts: HTMLElement[] = [];
    chatLog = null;

    // 1. Header
    const head = el('div', 'gta-party-head');
    head.append(
      el('div', 'gta-party-title', 'Party'),
      button('✕', () => toggle(false), 'gta-party-x'),
    );
    parts.push(head);

    // 2. Invites
    if (v.invites.length > 0) {
      parts.push(el('div', 'gta-party-sec', 'Invites'));
      for (const inv of v.invites) {
        const row = el('div', 'gta-party-row');
        row.append(
          el('span', 'gta-party-name', `${inv.name} · ${inv.code}`),
          button('Join', () => actions.accept(inv.from)),
          button('No', () => actions.decline(inv.from)),
        );
        parts.push(row);
      }
    }

    if (v.code === null) {
      // 3a. Not in a party
      parts.push(button('Start a party', () => actions.create(), 'gta-party-wide'));
      const joinRow = el('div', 'gta-party-row');
      joinRow.append(joinInput, button('Join', doJoin));
      parts.push(joinRow);
    } else {
      // 3b. In a party
      const codeRow = el('div', 'gta-party-row');
      codeRow.append(
        el('span', 'gta-party-muted', 'Party code:'),
        el('span', 'gta-party-code', v.code),
      );
      parts.push(codeRow);

      const actRow = el('div', 'gta-party-row');
      actRow.append(
        button('📍 Ping', () => actions.ping()),
        button('Leave', () => actions.leave()),
      );
      parts.push(actRow);

      parts.push(el('div', 'gta-party-sec', 'Members'));
      for (const m of v.members) {
        const row = el('div', 'gta-party-row');
        const label = `${m.leader ? '★ ' : ''}${m.name}${m.me ? ' (you)' : ''}`;
        row.appendChild(el('span', 'gta-party-name', label));
        if (m.dist !== null) row.appendChild(el('span', 'gta-party-muted', `${Math.round(m.dist)} m`));
        if (!m.me) row.appendChild(button('Go', () => actions.warp(m.id)));
        parts.push(row);
      }
    }

    // 4. Online
    parts.push(el('div', 'gta-party-sec', 'Online'));
    if (v.others.length === 0) {
      parts.push(el('div', 'gta-party-row gta-party-muted', 'No other gnomes online.'));
    } else {
      for (const o of v.others) {
        const row = el('div', 'gta-party-row');
        row.append(
          el('span', 'gta-party-name', o.name),
          button('Invite', () => actions.invite(o.id)),
        );
        parts.push(row);
      }
    }

    // 5. Party chat
    if (v.code !== null) {
      parts.push(el('div', 'gta-party-sec', 'Chat'));
      const log = el('div', 'gta-party-log');
      for (const line of v.chat) {
        const p = el('div', 'gta-party-line');
        p.append(
          el('span', line.mine ? 'gta-party-me' : 'gta-party-them', `${line.name}: `),
          document.createTextNode(line.text),
        );
        log.appendChild(p);
      }
      chatLog = log;
      parts.push(log);

      const sayRow = el('div', 'gta-party-row');
      sayRow.append(chatInput, button('Send', doSay));
      parts.push(sayRow);
    }

    panel.replaceChildren(...parts);

    if (hadFocus === joinInput || hadFocus === chatInput) hadFocus.focus();
    scrollChatToBottom();
  }

  function toggle(next?: boolean): void {
    open = next === undefined ? !open : next;
    panel.classList.toggle('open', open);
    btn.classList.toggle('on', open);
    btn.setAttribute('aria-expanded', String(open));
    if (open) scrollChatToBottom();
  }

  btn.addEventListener('click', () => toggle());

  return {
    render(v: PartyPanelView): void {
      const key = JSON.stringify(v);
      if (key === lastKey) return;
      lastKey = key;
      build(v);
    },
    setBadge(n: number): void {
      badge.textContent = String(n);
      badge.style.display = n > 0 ? '' : 'none';
    },
    get isOpen(): boolean {
      return open;
    },
    toggle,
    setVisible(v: boolean): void {
      root.style.display = v ? '' : 'none';
    },
  };
}
