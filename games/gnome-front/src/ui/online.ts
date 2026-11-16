// src/ui/online.ts: the online panel on the title screen. Talks to the network code only through `lobby`:
// it writes `lobby.request` and reads `lobby.status`, `lobby.message`, `lobby.players`, `lobby.startsInS`, `lobby.code`.
import { DOM_IDS } from '../config';
import { lobby } from '../net/state';

export interface OnlinePanel {
  /** Shown on the title screen, hidden once a match (solo or online) is running. */
  setVisible(v: boolean): void;
  /** Every frame: redraw the status from `lobby`. */
  update(): void;
}

const NAME_KEY = 'gnome-front-name';
const ERR_COLOR = '#ff8a80';
const ROOM_CODE_RE = /^[A-Z0-9]{4,8}$/;

function css(): string {
  const id = `#${DOM_IDS.online}`;
  return `
${id}{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);width:min(560px,calc(100vw - 32px));z-index:30;pointer-events:auto;box-sizing:border-box;background:rgba(10,20,10,.88);border:2px solid #ffd23f;border-radius:12px;padding:10px 14px;color:#fff;font-family:"Trebuchet MS","Segoe UI",system-ui,sans-serif;font-weight:800;text-align:center;text-shadow:0 2px 0 #000}
${id} .gf-on-h{font-size:18px;letter-spacing:2px;color:#ffd23f;margin:0}
${id} .gf-on-hint{font-size:13px;margin:2px 0 8px;opacity:.9}
${id} .gf-on-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:8px}
${id} input{box-sizing:border-box;font:inherit;font-size:16px;font-weight:600;padding:6px 8px;border-radius:6px;border:2px solid #000;background:#fff;color:#111;min-width:0}
${id} input.gf-on-name{flex:1 1 180px}
${id} input.gf-on-code{flex:1 1 160px}
${id} input:disabled{opacity:.5}
${id} .gf-on-btn{font:inherit;font-size:16px;letter-spacing:1px;color:#111;background:#ffd23f;border:3px solid #000;border-radius:10px;padding:6px 14px;box-shadow:0 3px 0 #000;cursor:pointer;text-shadow:none}
${id} .gf-on-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #000}
${id} .gf-on-status{font-size:14px;min-height:1.4em;margin-top:2px;color:#fff}
@media (max-width:600px){${id}{padding:8px 10px}${id} .gf-on-hint{display:none}${id} input.gf-on-name,${id} input.gf-on-code{flex:1 1 120px}${id} .gf-on-btn{flex:1 1 auto;padding:6px 8px}}
@media (max-height:500px){${id}{bottom:8px;padding:6px 10px}${id} .gf-on-hint{display:none}${id} .gf-on-h{font-size:15px}${id} .gf-on-row{margin-bottom:4px}${id} .gf-on-btn{font-size:14px;padding:4px 10px}${id} input{padding:4px 6px}}
`;
}

function injectStyle(): void {
  if (document.getElementById('gf-online-style')) return;
  const style = document.createElement('style');
  style.id = 'gf-online-style';
  style.textContent = css();
  document.head.appendChild(style);
}

function readName(): string {
  try {
    const saved = localStorage.getItem(NAME_KEY);
    if (saved && saved.trim()) return saved.trim().slice(0, 16);
  } catch {
    // Storage blocked (private window): fall through to a random name.
  }
  return 'Gnome' + (100 + Math.floor(Math.random() * 900));
}

function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // Storage blocked: the name just is not remembered.
  }
}

function makeButton(label: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'gf-on-btn';
  b.textContent = label;
  return b;
}

function makeInput(placeholder: string, maxLength: number, className: string): HTMLInputElement {
  const i = document.createElement('input');
  i.type = 'text';
  i.placeholder = placeholder;
  i.maxLength = maxLength;
  i.className = className;
  i.autocomplete = 'off';
  i.spellcheck = false;
  return i;
}

export function createOnlinePanel(root: HTMLElement): OnlinePanel {
  injectStyle();

  const panel = document.createElement('div');
  panel.id = DOM_IDS.online;

  const heading = document.createElement('div');
  heading.className = 'gf-on-h';
  heading.textContent = 'PLAY ONLINE';

  const hint = document.createElement('div');
  hint.className = 'gf-on-hint';
  hint.textContent = 'Up to 24 gnomes. Bots fill the empty spots.';

  const name = makeInput('Your name', 16, 'gf-on-name');
  name.value = readName();

  const code = makeInput('Room code (optional)', 8, 'gf-on-code');
  code.setAttribute('autocapitalize', 'characters');

  const inputRow = document.createElement('div');
  inputRow.className = 'gf-on-row';
  inputRow.append(name, code);

  const quick = makeButton('QUICK MATCH');
  const join = makeButton('JOIN ROOM');
  const leave = makeButton('LEAVE');

  const btnRow = document.createElement('div');
  btnRow.className = 'gf-on-row gf-on-btns';
  btnRow.append(quick, join, leave);

  const status = document.createElement('div');
  status.className = 'gf-on-status';

  panel.append(heading, hint, inputRow, btnRow, status);
  root.appendChild(panel);

  // The title screen reserves this much room at its bottom (hud.ts reads --gf-online-h) so the panel never
  // covers PLAY on small screens. A hidden panel measures 0.
  const publishHeight = (): void => {
    const h = panel.offsetHeight ? panel.offsetHeight + 16 : 0;
    document.documentElement.style.setProperty('--gf-online-h', `${h}px`);
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(publishHeight).observe(panel);
  publishHeight();

  // Game keys (Space, Tab, WASD...) must not reach the window listener while typing here.
  for (const input of [name, code]) {
    input.addEventListener('keydown', (e) => e.stopPropagation());
  }
  code.addEventListener('input', () => {
    code.value = code.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  let visible = true;
  let localMsg = '';
  let lastStatus: string | null = null;
  const last: Record<string, string> = {};

  // Applies a value to the DOM only when it differs from what the panel last showed.
  function changed(key: string, value: string): boolean {
    if (last[key] === value) return false;
    last[key] = value;
    return true;
  }

  function nameOf(): string {
    return name.value.trim() || 'Gnome';
  }

  quick.addEventListener('click', () => {
    const n = nameOf();
    saveName(n);
    localMsg = '';
    lobby.request = { name: n, code: null };
  });

  join.addEventListener('click', () => {
    const c = code.value;
    if (!ROOM_CODE_RE.test(c)) {
      localMsg = 'Room codes are 4 to 8 letters or digits.';
      render();
      return;
    }
    const n = nameOf();
    saveName(n);
    localMsg = '';
    lobby.request = { name: n, code: c };
  });

  leave.addEventListener('click', () => {
    localMsg = '';
    lobby.request = 'leave';
  });

  function statusText(): { text: string; color: string } {
    switch (lobby.status) {
      case 'off':
        return { text: lobby.message, color: '#fff' };
      case 'error':
        return { text: lobby.message, color: ERR_COLOR };
      case 'connecting':
        return { text: 'Connecting...', color: '#fff' };
      case 'queued': {
        const room = lobby.code ? ` (room ${lobby.code})` : '';
        return {
          text: `Waiting for players: ${lobby.players} here, starting in ${lobby.startsInS}s${room}`,
          color: '#fff',
        };
      }
      case 'joining':
        return { text: 'Joining the match...', color: '#fff' };
      default:
        return { text: '', color: '#fff' };
    }
  }

  function render(): void {
    const st = lobby.status;
    const editable = st === 'off' || st === 'error';
    const s = statusText();
    const text = localMsg || s.text;
    const color = localMsg ? ERR_COLOR : s.color;

    if (changed('display', visible && st !== 'in' ? '' : 'none')) {
      panel.style.display = last.display;
    }
    if (changed('text', text)) status.textContent = text;
    if (changed('color', color)) status.style.color = color;
    if (changed('quick', editable ? '' : 'none')) quick.style.display = last.quick;
    if (changed('join', editable ? '' : 'none')) join.style.display = last.join;
    if (changed('leave', editable ? 'none' : '')) leave.style.display = last.leave;
    if (changed('inputs', editable ? 'on' : 'off')) {
      name.disabled = !editable;
      code.disabled = !editable;
    }
  }

  return {
    setVisible(v: boolean): void {
      visible = v;
      render();
    },
    update(): void {
      if (lobby.status !== lastStatus) {
        lastStatus = lobby.status;
        localMsg = '';
      }
      render();
    },
  };
}
