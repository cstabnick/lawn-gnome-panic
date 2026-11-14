// Co-op lobby panel: "Play together" on the title screen, and a roster of the shared raft in play.
// See docs/roadmaps/gnaft/epic5-02-coop-ui.md. net.ts owns state.coop; this file only writes `request`.
import { COOP, type Ctx, type System } from './config';

const TEXT = 'color:#fff;text-shadow:0 1px 3px #000;font-family:system-ui,sans-serif;';
const PANEL = 'background:rgba(10,40,70,0.88);border-radius:12px;box-sizing:border-box;';
const BLUE = 'border:2px solid #fff;border-radius:10px;background:rgba(47,143,196,0.9);';
const FIELD =
  'display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:6px 8px;' +
  'font:16px system-ui,sans-serif;color:#000;border:2px solid #fff;border-radius:8px;background:#e8f2f8;pointer-events:auto;';
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
const NAME_MIN = 2;
const NAME_MAX = 18;
const CODE_MAX = 8;
const CODE_LEN = 5;
const CODE_RE = /^[A-Z0-9]{4,8}$/;

function make<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.style.cssText = css;
  if (text) node.textContent = text;
  return node;
}

function randomName(): string {
  return 'Gnome' + (10 + Math.floor(Math.random() * 90));
}

function randomCode(): string {
  let s = '';
  for (let k = 0; k < CODE_LEN; k++) s += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  return s;
}

function readSavedName(): string | null {
  try {
    return localStorage.getItem(COOP.nameKey);
  } catch {
    return null;
  }
}

function saveName(name: string): void {
  try {
    localStorage.setItem(COOP.nameKey, name);
  } catch {
    // Storage blocked or full: the name just is not remembered.
  }
}

function setShown(node: HTMLElement, shown: boolean): void {
  const want = shown ? '' : 'none';
  if (node.style.display !== want) node.style.display = want;
}

export function createCoopUi(ctx: Ctx): System {
  const { state, ui } = ctx;

  // ---------------------------------------------------------------- title panel
  const panel = make(
    'div',
    `position:absolute;left:16px;bottom:16px;z-index:5;width:280px;padding:14px;pointer-events:auto;${PANEL}${TEXT}`,
  );
  panel.id = 'rg-coop';

  const heading = make('h2', 'margin:0 0 4px;font-size:20px;', 'Play together');
  const blurb = make('p', 'margin:0 0 10px;font-size:13px;opacity:0.9;', 'Same room code = same raft. The first one in hosts.');

  const nameInput = make('input', FIELD);
  nameInput.type = 'text';
  nameInput.maxLength = NAME_MAX;
  nameInput.placeholder = 'Your name';
  nameInput.value = readSavedName() || randomName();

  const codeInput = make('input', FIELD);
  codeInput.type = 'text';
  codeInput.maxLength = CODE_MAX;
  codeInput.placeholder = 'Room code';
  codeInput.value = randomCode();

  const startBtn = make('button', `${BLUE}color:#fff;font:bold 16px system-ui,sans-serif;padding:8px;width:100%;margin-top:10px;cursor:pointer;pointer-events:auto;`, 'Start / join raft');
  startBtn.type = 'button';

  const msgEl = make('div', 'min-height:16px;margin-top:6px;font-size:13px;color:#ff8080;');
  const statusEl = make('div', 'min-height:16px;margin-top:4px;font-size:13px;color:#fff;');

  // Keys typed in the inputs must not reach the game controls.
  for (const field of [nameInput, codeInput]) {
    field.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') startBtn.click();
    });
    field.addEventListener('keyup', (e) => e.stopPropagation());
  }

  codeInput.addEventListener('input', () => {
    const cleaned = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_MAX);
    if (cleaned !== codeInput.value) codeInput.value = cleaned;
  });

  startBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const code = codeInput.value;
    if (name.length < NAME_MIN || name.length > NAME_MAX) {
      msgEl.textContent = `Name must be ${NAME_MIN}-${NAME_MAX} characters.`;
      return;
    }
    if (!CODE_RE.test(code)) {
      msgEl.textContent = 'Room code must be 4-8 letters or digits.';
      return;
    }
    msgEl.textContent = '';
    saveName(name);
    state.coop.request = { name, code };
  });

  panel.append(heading, blurb, nameInput, codeInput, startBtn, msgEl, statusEl);

  // ---------------------------------------------------------------- in-game roster
  const list = make(
    'div',
    `position:absolute;right:16px;bottom:16px;z-index:5;min-width:160px;padding:8px 12px;pointer-events:none;font-size:14px;${PANEL}${TEXT}`,
  );
  list.id = 'rg-coop-list';
  const listHeader = make('div', 'font-weight:bold;margin-bottom:4px;');
  const listRows = make('div', '');
  list.append(listHeader, listRows);

  let listKey = '';
  function rebuildList(): void {
    const { code, players } = state.coop;
    const key = code + '|' + players.map((p) => `${p.id}:${p.name}:${p.color}:${p.host ? 1 : 0}:${p.me ? 1 : 0}`).join(';');
    if (key === listKey) return;
    listKey = key;
    listHeader.textContent = `Raft ${code}`;
    listRows.textContent = '';
    for (const p of players) {
      const row = make('div', 'display:flex;align-items:center;gap:6px;margin-top:2px;');
      const hex = '#' + (p.color & 0xffffff).toString(16).padStart(6, '0');
      const dot = make('span', `display:inline-block;flex:0 0 10px;width:10px;height:10px;border-radius:50%;background:${hex};`);
      const label = make('span', '', p.name + (p.host ? ' (host)' : '') + (p.me ? ' (you)' : ''));
      row.append(dot, label);
      listRows.append(row);
    }
  }

  ui.append(panel, list);

  return {
    update() {
      const title = state.mode === 'title';
      setShown(panel, title);
      if (title) {
        const c = state.coop;
        startBtn.disabled = c.status === 'connecting';
        if (c.status === 'connecting') {
          statusEl.textContent = 'Connecting…';
          statusEl.style.color = '#fff';
        } else if (c.status === 'error') {
          statusEl.textContent = c.message;
          statusEl.style.color = '#ff8080';
        } else {
          statusEl.textContent = '';
          statusEl.style.color = '#fff';
        }
      }

      const inRaft = !title && state.coop.status === 'in';
      setShown(list, inRaft);
      if (inRaft) rebuildList();
    },
  };
}
