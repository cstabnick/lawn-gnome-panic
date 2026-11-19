// The top bar: name, room code, join / leave and the connection status. Plain DOM; class names prefixed mr-.
import type { NetState } from './config';
import { getMyGnome } from '@lawn/gnome';
import { NAME_KEY } from './config';
import { checkName } from '@lawn/mp/textFilter';
import { ROOM_CODE_RE } from '@lawn/mp/protocol';

export interface Lobby {
  /** Redraw from the net state. available = false hides the join controls (offline-only build). */
  update(state: NetState, available: boolean): void;
  /** Join was pressed: code null = public room, else an upper-cased room code (4-8 of A-Z, 0-9). */
  onJoin(fn: (code: string | null, name: string) => void): void;
  onLeave(fn: () => void): void;
}

const STYLE_ID = 'mr-lobby-style';
const RED = '#ff8a8a';
const GREEN = '#9be08a';

const CSS = `
#mr-lobby {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px;
  padding: 12px 16px; background: #2a2030; color: #f4ecdf;
  font: 15px/1.3 system-ui, sans-serif; box-sizing: border-box;
}
#mr-lobby .mr-lobby-title { font-weight: 700; font-size: 18px; margin-right: 4px; }
#mr-lobby input {
  font: inherit; padding: 6px 8px; border-radius: 6px; min-width: 0;
  border: 1px solid #4a3d56; background: #1b1420; color: #f4ecdf;
}
#mr-lobby input:disabled { opacity: 0.6; }
#mr-lobby input.mr-name { width: 140px; }
#mr-lobby input.mr-room { width: 190px; text-transform: uppercase; }
#mr-lobby button {
  font: inherit; font-weight: 600; padding: 6px 14px; border: 0; border-radius: 6px;
  background: #ffd54f; color: #1b1420; cursor: pointer;
}
#mr-lobby button:disabled { opacity: 0.5; cursor: default; }
#mr-lobby button.mr-leave { background: #4a3d56; color: #f4ecdf; }
#mr-lobby .mr-status { flex: 1 1 160px; min-width: 0; overflow-wrap: anywhere; }
#mr-lobby .mr-help { flex-basis: 100%; font-size: 13px; opacity: 0.75; }
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function make<K extends 'div' | 'span' | 'input' | 'button'>(tag: K, cls: string, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function show(e: HTMLElement, on: boolean): void {
  e.style.display = on ? '' : 'none';
}

function readSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // storage unavailable (private window): the name simply is not remembered
  }
}

export function createLobby(parent: HTMLElement): Lobby {
  ensureStyle();

  const root = document.createElement('div');
  root.id = 'mr-lobby';

  const title = make('span', 'mr-lobby-title', '🎵 Music Room');

  const nameIn = make('input', 'mr-name');
  nameIn.type = 'text';
  nameIn.maxLength = 16;
  nameIn.placeholder = 'Your name';
  nameIn.autocomplete = 'off';
  nameIn.value = readSavedName() || getMyGnome()?.name || '';

  const roomIn = make('input', 'mr-room');
  roomIn.type = 'text';
  roomIn.maxLength = 8;
  roomIn.placeholder = 'Room code (optional)';
  roomIn.autocomplete = 'off';
  roomIn.spellcheck = false;
  roomIn.addEventListener('input', () => {
    roomIn.value = roomIn.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  const joinBtn = make('button', 'mr-join', 'Join');
  joinBtn.type = 'button';
  const leaveBtn = make('button', 'mr-leave', 'Leave');
  leaveBtn.type = 'button';

  const status = make('span', 'mr-status');
  const help = make(
    'div',
    'mr-help',
    'Pick an instrument with 1 2 3 (or click it). Drums: A S D F J K L, Space. ' +
      'Keyboard: A W S E D F T G Y H U J K, Z / X octave. Cowbell: Space F J B.',
  );

  root.append(title, nameIn, roomIn, joinBtn, leaveBtn, status, help);
  parent.appendChild(root);

  const joinFns: Array<(code: string | null, name: string) => void> = [];
  const leaveFns: Array<() => void> = [];
  let canJoin = false;

  function setStatus(text: string, color = ''): void {
    status.textContent = text;
    status.style.color = color;
  }

  function join(): void {
    if (!canJoin) return;
    const c = checkName(nameIn.value.trim());
    if (!c.ok) {
      setStatus(c.reason, RED);
      return;
    }
    const code = roomIn.value;
    if (code !== '' && !ROOM_CODE_RE.test(code)) {
      setStatus('Room codes are 4-8 letters or digits.', RED);
      return;
    }
    saveName(c.name);
    for (const fn of joinFns) fn(code === '' ? null : code, c.name);
    if (document.activeElement instanceof HTMLInputElement) document.activeElement.blur();
  }

  joinBtn.addEventListener('click', join);
  for (const inp of [nameIn, roomIn]) {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') join();
    });
  }
  leaveBtn.addEventListener('click', () => {
    for (const fn of leaveFns) fn();
  });

  return {
    update(state, available) {
      const offline = state.status === 'offline' || state.status === 'error';
      const connecting = state.status === 'connecting';
      const inRoom = state.status === 'in-room';

      canJoin = available && offline;

      if (inRoom || connecting) roomIn.value = state.code ?? '';

      show(nameIn, available);
      show(roomIn, available);
      show(joinBtn, available && !inRoom);
      show(leaveBtn, available && !offline);

      nameIn.disabled = inRoom || connecting;
      roomIn.disabled = inRoom || connecting;
      joinBtn.disabled = connecting;

      if (inRoom) setStatus(`${state.message} · ${state.players.length} playing`, GREEN);
      else setStatus(state.message, state.status === 'error' ? RED : '');
    },
    onJoin(fn) {
      joinFns.push(fn);
    },
    onLeave(fn) {
      leaveFns.push(fn);
    },
  };
}
