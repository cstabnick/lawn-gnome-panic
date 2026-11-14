// Title menu: local players, online quick match and room codes, and the online lobby.
// Visible only in phases 'title' and 'lobby'. All DOM lives in #bm-root inside ctx.ui; styles are scoped to #bm-.
import { getMyGnome } from '@lawn/gnome';
import { checkName } from '@lawn/mp/textFilter';
import { sfx, startAudio } from './audio';
import {
  LOOKS, LOOK_ORDER, MAX_LOCAL_PLAYERS, MAX_ONLINE_PLAYERS, SEAT_COLORS,
  type Ctx, type LookId, type NpcId, type System,
} from './config';
import { makeNpcPlayer, makePlayer, newGame, toTitle } from './game';
import { NPCS, NPC_ORDER, isNpcId } from './npc';
import { announcerOn, setAnnouncerOn, speak } from './speech';

const STORE_KEY = 'gnome-bowling-players';
const NAME_INPUT_MAX = 12;
const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0, O, 1 or I
const ROOM_LEN = 5;
const CODE_MIN = 4;
const CODE_MAX = 8;
const GREY = '#c9c2dd';
const BAD = '#ff8a8a';

const CSS = `
#bm-root { position: absolute; inset: 0; pointer-events: auto; color: #fff;
  font-family: system-ui, sans-serif; text-shadow: 0 2px 4px #000;
  background: linear-gradient(160deg, rgba(20,10,40,0.82), rgba(60,16,70,0.55) 55%, rgba(10,20,40,0.82)); }
#bm-root[hidden], #bm-root [hidden] { display: none !important; }
#bm-root .bm-screen { position: absolute; inset: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y;
  box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 14px;
  padding: calc(16px + env(safe-area-inset-top)) calc(16px + env(safe-area-inset-right)) calc(20px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left)); }
#bm-root .bm-logo { margin: 8px 0 0; font-weight: 900; font-style: italic; line-height: 0.9; text-align: center;
  font-size: clamp(36px, min(14vw, 16vh), 120px); letter-spacing: 0.02em; max-width: 100%; }
#bm-root .bm-pink { color: #ff3fb4; text-shadow: 0 0 8px #ff3fb4, 0 0 18px #ff3fb4, 0 2px 4px #000; }
#bm-root .bm-cyan { color: #3ff0ff; text-shadow: 0 0 8px #3ff0ff, 0 0 18px #3ff0ff, 0 2px 4px #000; }
#bm-root .bm-emoji { font-style: normal; text-shadow: none; }
#bm-root .bm-tag { margin: 0; font-weight: 700; color: ${GREY}; text-align: center; font-size: 16px; }
#bm-root .bm-cols { display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 1040px; }
#bm-root .bm-panel { background: rgba(20,10,40,0.7); border-radius: 12px; padding: 14px; box-sizing: border-box;
  width: 100%; max-width: 520px; }
#bm-root .bm-cols > .bm-panel { max-width: none; }
#bm-root .bm-h { margin: 0 0 10px; font-weight: 900; font-style: italic; font-size: 20px; text-transform: uppercase; letter-spacing: 0.04em; }
#bm-root .bm-note { margin: 0 0 10px; color: ${GREY}; font-size: 14px; line-height: 1.4; }
#bm-root .bm-err { color: ${BAD}; font-size: 14px; font-weight: 700; margin-top: 6px; }
#bm-root .bm-bad { color: ${BAD}; }
#bm-root .bm-card { display: flex; gap: 10px; align-items: stretch; padding: 10px; border-radius: 12px;
  background: rgba(255,255,255,0.06); margin-bottom: 10px; }
#bm-root .bm-chip { width: 12px; border-radius: 6px; flex: none; }
#bm-root .bm-col { flex: 1; min-width: 0; }
#bm-root .bm-input { width: 100%; min-height: 48px; box-sizing: border-box; font-size: 16px; font-weight: 700; color: #fff;
  padding: 10px 12px; border-radius: 10px; border: 2px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.35);
  text-transform: none; }
#bm-root .bm-input:focus { outline: none; border-color: #3ff0ff; }
#bm-root .bm-look { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
#bm-root .bm-lookinfo { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 0; }
#bm-root .bm-lookname { font-weight: 900; font-style: italic; font-size: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#bm-root .bm-swatch { position: relative; width: 36px; height: 40px; flex: none; }
#bm-root .bm-shirt { position: absolute; left: 4px; bottom: 0; width: 28px; height: 22px; border-radius: 6px 6px 3px 3px;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.4); }
#bm-root .bm-bowl { position: absolute; left: 6px; top: 0; width: 24px; height: 22px; border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.4); }
#bm-root .bm-btn { min-height: 48px; min-width: 48px; box-sizing: border-box; padding: 0 18px; border: 0; border-radius: 12px;
  font: 900 italic 18px system-ui, sans-serif; color: #fff; background: #ff3fb4; cursor: pointer;
  box-shadow: 0 0 12px rgba(255,63,180,0.6); touch-action: manipulation; text-shadow: none; }
#bm-root .bm-btn.cyan { background: #3ff0ff; color: #14082a; box-shadow: 0 0 12px rgba(63,240,255,0.6); }
#bm-root .bm-btn.ghost { background: rgba(255,255,255,0.12); box-shadow: none; }
#bm-root .bm-btn.big { min-height: 60px; font-size: 24px; width: 100%; }
#bm-root .bm-wide { width: 100%; margin-top: 4px; }
#bm-root .bm-addrow { display: flex; gap: 8px; margin-top: 4px; }
#bm-root .bm-addrow .bm-btn { flex: 1 1 0; min-width: 0; padding: 0 8px; }
#bm-root .bm-cpuname { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 18px; font-weight: 700; line-height: 1.2; }
#bm-root .bm-cpuname > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
#bm-root .bm-cputitle { margin-top: 2px; color: ${GREY}; font-size: 13px; }
#bm-root .bm-cpubadge { flex: none; font-size: 11px; font-weight: 900; padding: 2px 6px; border-radius: 6px;
  background: #3ff0ff; color: #14082a; text-shadow: none; }
#bm-root .bm-arrow { width: 48px; height: 48px; flex: none; border: 0; border-radius: 10px; background: rgba(255,255,255,0.14);
  color: #fff; font-size: 20px; cursor: pointer; touch-action: manipulation; }
#bm-root .bm-remove { width: 48px; flex: none; border: 0; border-radius: 10px; background: rgba(255,255,255,0.12);
  color: #fff; font-size: 18px; cursor: pointer; touch-action: manipulation; }
#bm-root .bm-row { display: flex; gap: 8px; margin-top: 8px; }
#bm-root .bm-row .bm-input { text-transform: uppercase; letter-spacing: 0.1em; min-width: 0; flex: 1; }
#bm-root .bm-row .bm-btn { flex: none; }
#bm-root .bm-stack { display: flex; flex-direction: column; gap: 10px; }
#bm-root .bm-howto { margin: 0; padding: 0; list-style: none; font-size: 15px; line-height: 1.5; width: 100%; max-width: 520px; }
#bm-root .bm-howto li { margin: 2px 0; }
#bm-root .bm-lobby { text-align: center; margin-top: 12px; }
#bm-root .bm-lbmsg { font-size: 18px; font-weight: 700; margin: 8px 0; min-height: 1.4em; }
#bm-root .bm-codebox { margin: 14px 0; padding: 12px; border-radius: 12px; background: rgba(0,0,0,0.3); }
#bm-root .bm-codelabel { margin: 0; color: ${GREY}; font-size: 14px; }
#bm-root .bm-code { font-family: ui-monospace, Menlo, Consolas, monospace; font-weight: 900; letter-spacing: 0.12em;
  font-size: clamp(40px, 12vw, 72px); color: #ffd54f; text-shadow: 0 0 12px #ffd54f, 0 2px 4px #000; line-height: 1.1; }
#bm-root .bm-lbline { margin: 6px 0; font-size: 18px; font-weight: 700; }
#bm-root .bm-spin { width: 48px; height: 48px; margin: 12px auto; box-sizing: border-box; border-radius: 50%;
  border: 5px solid rgba(255,255,255,0.2); border-top-color: #3ff0ff; animation: bm-spin 0.9s linear infinite; }
@keyframes bm-spin { to { transform: rotate(360deg); } }
@media (orientation: landscape) and (min-width: 600px) {
  #bm-root .bm-cols { flex-direction: row; align-items: flex-start; }
  #bm-root .bm-cols > .bm-panel { flex: 1 1 0; min-width: 0; }
}
@media (max-height: 500px) {
  #bm-root .bm-screen { gap: 10px; }
  #bm-root .bm-logo { font-size: clamp(32px, 15vh, 80px); }
}
`;

interface Seat {
  name: string;
  look: LookId;
  /** Set for a CPU bowler (name and look come from NPCS). */
  npc?: NpcId;
}

const hex = (c: number): string => '#' + c.toString(16).padStart(6, '0');

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Pointer taps (touch first). */
function tap(el: HTMLElement, fn: () => void): void {
  el.addEventListener('pointerup', (e) => {
    e.preventDefault();
    startAudio();
    fn();
  });
}

function setHidden(el: HTMLElement, hidden: boolean): void {
  if (el.hidden !== hidden) el.hidden = hidden;
}

function setText(el: HTMLElement, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

const isLook = (v: unknown): v is LookId => typeof v === 'string' && (LOOK_ORDER as readonly string[]).includes(v);

function defaultSeat(i: number): Seat {
  const look = LOOK_ORDER[i % LOOK_ORDER.length];
  return { name: LOOKS[look].name, look };
}

function loadSeats(): Seat[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const data: unknown = JSON.parse(raw);
      if (Array.isArray(data)) {
        const seats: Seat[] = [];
        for (const s of data.slice(0, MAX_LOCAL_PLAYERS)) {
          const o = (s ?? {}) as Partial<Seat>;
          if (isNpcId(o.npc)) {
            const n = NPCS[o.npc];
            seats.push({ name: n.name, look: n.look, npc: o.npc });
          } else if (typeof o.name === 'string' && isLook(o.look)) {
            seats.push({ name: o.name.slice(0, NAME_INPUT_MAX), look: o.look });
          }
        }
        if (seats.length > 0) return seats;
      }
    }
  } catch {
    // Storage blocked or corrupt: start fresh.
  }
  return [defaultSeat(0)];
}

function saveSeats(seats: Seat[]): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(seats));
  } catch {
    // Storage blocked: the menu works without it.
  }
}

function randomCode(): string {
  let s = '';
  for (let i = 0; i < ROOM_LEN; i++) s += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  return s;
}

const cleanCode = (raw: string): string => raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_MAX);

function swatch(look: LookId): HTMLElement {
  const sw = h('div', 'bm-swatch');
  const shirt = h('div', 'bm-shirt');
  shirt.style.background = hex(LOOKS[look].look.shirt);
  const bowl = h('div', 'bm-bowl');
  bowl.style.background = hex(LOOKS[look].look.bowlCut ?? 0x1c1c1c);
  sw.append(shirt, bowl);
  return sw;
}

export function createMenu(ctx: Ctx): System {
  const root = h('div');
  root.id = 'bm-root';
  const style = h('style');
  style.textContent = CSS;
  root.append(style);

  let seats = loadSeats();
  let errors: (string | null)[] = [];

  // ---------------------------------------------------------------- title screen
  const titleScreen = h('div', 'bm-screen');
  titleScreen.dataset.scroll = '';
  titleScreen.innerHTML =
    '<h1 class="bm-logo"><span class="bm-pink">GNOME</span><br><span class="bm-cyan">BOWLING</span> ' +
    '<span class="bm-emoji" aria-hidden="true">🎳</span></h1>' +
    '<p class="bm-tag">Bowl-cut gnomes. Ten pins. Zero dignity.</p>';

  const cols = h('div', 'bm-cols');

  // Players panel
  const playersPanel = h('section', 'bm-panel');
  playersPanel.append(h('h2', 'bm-h', 'Players'));
  const playersBox = h('div');
  playersPanel.append(playersBox);

  function persist(): void {
    saveSeats(seats);
  }

  function cycleLook(i: number, dir: number): void {
    const seat = seats[i];
    if (!seat) return;
    const idx = LOOK_ORDER.indexOf(seat.look);
    const nextLook = LOOK_ORDER[(idx + dir + LOOK_ORDER.length) % LOOK_ORDER.length];
    // Keep the default name in step with the look, unless the player typed their own.
    if (seat.name === LOOKS[seat.look].name) seat.name = LOOKS[nextLook].name;
    seat.look = nextLook;
    sfx('tick');
    persist();
    renderPlayers();
  }

  function addSeat(): void {
    if (seats.length >= MAX_LOCAL_PLAYERS) return;
    seats.push(defaultSeat(seats.length));
    errors = [];
    persist();
    renderPlayers();
  }

  /** The first CPU bowler no seat is using yet (the first one if all are taken). */
  function freeNpc(): NpcId {
    const used = new Set(seats.map((s) => s.npc));
    return NPC_ORDER.find((id) => !used.has(id)) ?? NPC_ORDER[0];
  }

  function addCpuSeat(): void {
    if (seats.length >= MAX_LOCAL_PLAYERS) return;
    const id = freeNpc();
    seats.push({ name: NPCS[id].name, look: NPCS[id].look, npc: id });
    errors = [];
    persist();
    renderPlayers();
  }

  /** Steps a CPU seat to the next bowler in NPC_ORDER, skipping bowlers other seats use when possible. */
  function cycleNpc(i: number, dir: number): void {
    const seat = seats[i];
    if (!seat?.npc) return;
    const taken = new Set(seats.filter((_, j) => j !== i).map((s) => s.npc));
    const len = NPC_ORDER.length;
    const idx = NPC_ORDER.indexOf(seat.npc);
    let next = NPC_ORDER[(idx + dir + len) % len];
    for (let k = 1; k < len; k++) {
      const cand = NPC_ORDER[(idx + dir * k + len * len) % len];
      if (!taken.has(cand)) {
        next = cand;
        break;
      }
    }
    seat.npc = next;
    seat.name = NPCS[next].name;
    seat.look = NPCS[next].look;
    sfx('tick');
    persist();
    renderPlayers();
  }

  function removeSeat(i: number): void {
    if (seats.length <= 1) return;
    seats.splice(i, 1);
    errors = [];
    persist();
    renderPlayers();
  }

  function renderPlayers(): void {
    playersBox.replaceChildren();
    seats.forEach((seat, i) => {
      const card = h('div', 'bm-card');
      const cpu = seat.npc ? NPCS[seat.npc] : null;
      const chip = h('div', 'bm-chip');
      chip.style.background = hex(cpu ? cpu.color : SEAT_COLORS[i]);

      const col = h('div', 'bm-col');
      if (cpu) {
        const nameLine = h('div', 'bm-cpuname');
        nameLine.append(h('span', undefined, cpu.name), h('span', 'bm-cpubadge', 'CPU'));
        col.append(nameLine, h('div', 'bm-cputitle', cpu.title));
      } else {
        const name = h('input', 'bm-input');
        name.maxLength = NAME_INPUT_MAX;
        name.value = seat.name;
        name.placeholder = 'Name';
        name.autocomplete = 'off';
        name.spellcheck = false;
        name.setAttribute('aria-label', `Player ${i + 1} name`);
        name.addEventListener('input', () => {
          seat.name = name.value;
          persist();
        });
        col.append(name);
      }

      const err = errors[i];
      if (err) col.append(h('div', 'bm-err', err));

      const look = h('div', 'bm-look');
      const prev = h('button', 'bm-arrow', '◀');
      prev.setAttribute('aria-label', cpu ? 'Previous CPU' : 'Previous look');
      tap(prev, () => (cpu ? cycleNpc(i, -1) : cycleLook(i, -1)));
      const info = h('div', 'bm-lookinfo');
      info.append(swatch(cpu ? cpu.look : seat.look), h('span', 'bm-lookname', cpu ? cpu.name : LOOKS[seat.look].name));
      const next = h('button', 'bm-arrow', '▶');
      next.setAttribute('aria-label', cpu ? 'Next CPU' : 'Next look');
      tap(next, () => (cpu ? cycleNpc(i, 1) : cycleLook(i, 1)));
      look.append(prev, info, next);
      col.append(look);

      card.append(chip, col);
      if (seats.length > 1) {
        const rm = h('button', 'bm-remove', '✕');
        rm.setAttribute('aria-label', `Remove player ${i + 1}`);
        tap(rm, () => removeSeat(i));
        card.append(rm);
      }
      playersBox.append(card);
    });
    if (seats.length < MAX_LOCAL_PLAYERS) {
      const addRow = h('div', 'bm-addrow');
      const add = h('button', 'bm-btn ghost', '+ ADD PLAYER');
      tap(add, addSeat);
      const addCpu = h('button', 'bm-btn ghost', '+ ADD CPU');
      tap(addCpu, addCpuSeat);
      addRow.append(add, addCpu);
      playersBox.append(addRow);
    }
    refreshWho();
  }

  // BOWL! starts a local game. CPU seats are not name-checked.
  const bowlBtn = h('button', 'bm-btn big', 'BOWL!');
  tap(bowlBtn, () => {
    const results = seats.map((s) => (s.npc ? null : checkName(s.name)));
    errors = results.map((r) => (r && !r.ok ? r.reason : null));
    if (errors.some((e) => e !== null)) {
      renderPlayers();
      return;
    }
    const players = seats.map((s, i) => {
      if (s.npc) return makeNpcPlayer(s.npc);
      const r = results[i];
      // Seat 1 bowls as the player's saved gnome, if they made one in the Gnome Creator.
      const custom = i === 0 ? getMyGnome()?.look : undefined;
      return makePlayer(r && r.ok ? r.name : s.name, s.look, SEAT_COLORS[i], true, -1, null, custom);
    });
    errors = [];
    persist();
    sfx('click');
    newGame(ctx.state, players, 'local');
  });

  // Announcer on/off, under BOWL!.
  const announcerLabel = (): string => `📣 ANNOUNCER: ${announcerOn() ? 'ON' : 'OFF'}`;
  const announcerBtn = h('button', 'bm-btn ghost bm-wide', announcerLabel());
  tap(announcerBtn, () => {
    const on = !announcerOn();
    setAnnouncerOn(on);
    setText(announcerBtn, announcerLabel());
    sfx('click');
    if (on) speak([{ text: 'Announcer, on!', voice: 'announcer', pitch: 0.4, rate: 0.85 }], true);
  });

  // Online panel
  const onlinePanel = h('section', 'bm-panel');
  onlinePanel.append(h('h2', 'bm-h', 'Online'));
  const whoLine = h('p', 'bm-note');
  const onlineMsg = h('p', 'bm-note');

  /** The first human seat is the online player; CPU seats never go online. */
  function onlineSeat(): Seat {
    return seats.find((s) => !s.npc) ?? defaultSeat(0);
  }

  function refreshWho(): void {
    const s0 = onlineSeat();
    setText(whoLine, `Online as ${s0.name} (${LOOKS[s0.look].name}).`);
  }

  function setOnlineMsg(text: string, bad: boolean): void {
    setText(onlineMsg, text);
    onlineMsg.style.color = bad ? BAD : GREY;
  }

  /** Player 1's name and look for online play, or null (and a message) if the name is not allowed. */
  function onlineIdentity(): { name: string; look: LookId } | null {
    const s0 = onlineSeat();
    const r = checkName(s0.name);
    if (!r.ok) {
      setOnlineMsg(r.reason, true);
      return null;
    }
    return { name: r.name, look: s0.look };
  }

  function joinCode(code: string): void {
    const id = onlineIdentity();
    if (!id) return;
    if (code.length < CODE_MIN) {
      setOnlineMsg(`Room codes are ${CODE_MIN} to ${CODE_MAX} letters or numbers.`, true);
      return;
    }
    setOnlineMsg('', false);
    persist();
    ctx.net.joinRoom(code, id.name, id.look);
  }

  if (ctx.net.available()) {
    const quick = h('button', 'bm-btn cyan big', 'QUICK MATCH');
    tap(quick, () => {
      const id = onlineIdentity();
      if (!id) return;
      setOnlineMsg('', false);
      persist();
      ctx.net.quickMatch(id.name, id.look);
    });

    const row = h('div', 'bm-row');
    const input = h('input', 'bm-input');
    input.maxLength = CODE_MAX;
    input.placeholder = 'ROOM CODE';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-label', 'Room code');
    input.addEventListener('input', () => {
      input.value = cleanCode(input.value);
    });
    const join = h('button', 'bm-btn', 'JOIN ROOM');
    tap(join, () => joinCode(cleanCode(input.value)));
    row.append(input, join);

    const newRoom = h('button', 'bm-btn ghost bm-wide', 'NEW ROOM');
    tap(newRoom, () => {
      const code = randomCode();
      input.value = code;
      joinCode(code);
    });

    // Optional ?room=CODE in the URL prefills the room code.
    try {
      const fromUrl = cleanCode(new URLSearchParams(location.search).get('room') ?? '');
      if (fromUrl) input.value = fromUrl;
    } catch {
      // No URL to read: nothing to prefill.
    }

    onlinePanel.append(whoLine, quick, row, newRoom, onlineMsg);
  } else {
    onlinePanel.append(h('p', 'bm-note', 'Online play needs the game server.'));
  }

  cols.append(playersPanel, onlinePanel);

  // How to play
  const howto = h('ul', 'bm-howto');
  for (const line of ['◀ ▶ step, ↺ ↻ aim', 'Swipe up to bowl — faster swipe, faster ball', 'Curl your swipe or set SPIN to hook into the pocket']) {
    howto.append(h('li', undefined, line));
  }

  titleScreen.append(cols, bowlBtn, announcerBtn, howto);

  // ---------------------------------------------------------------- lobby screen
  const lobby = h('div', 'bm-screen');
  lobby.dataset.scroll = '';
  const lobbyPanel = h('section', 'bm-panel bm-lobby');
  lobbyPanel.append(h('h2', 'bm-h', 'Online lobby'));
  const spin = h('div', 'bm-spin');
  const lbMsg = h('p', 'bm-lbmsg');
  const codeBox = h('div', 'bm-codebox');
  codeBox.append(h('p', 'bm-codelabel', 'Tell your friends this code'));
  const lbCode = h('div', 'bm-code');
  codeBox.append(lbCode);
  const lbWait = h('p', 'bm-lbline');
  const lbStarts = h('p', 'bm-lbline');
  const leave = (): void => {
    ctx.net.leave();
    toTitle(ctx.state);
  };
  const cancelBtn = h('button', 'bm-btn ghost big', 'CANCEL');
  tap(cancelBtn, leave);
  const backBtn = h('button', 'bm-btn big', 'BACK');
  tap(backBtn, leave);
  lobbyPanel.append(spin, lbMsg, codeBox, lbWait, lbStarts, cancelBtn, backBtn);
  lobby.append(lobbyPanel);

  const FALLBACK: Record<string, string> = {
    connecting: 'Connecting to the server...',
    queued: 'Looking for gnomes...',
    playing: 'Match starting...',
    error: 'Could not connect.',
    off: '',
  };

  function renderLobby(): void {
    const net = ctx.state.net;
    const err = net.status === 'error';
    setHidden(spin, net.status !== 'connecting');
    setText(lbMsg, net.message || FALLBACK[net.status] || '');
    lbMsg.classList.toggle('bm-bad', err);
    setHidden(codeBox, !net.code);
    if (net.code) setText(lbCode, net.code);
    setHidden(lbWait, net.status !== 'queued');
    setText(lbWait, `${net.waiting} / ${MAX_ONLINE_PLAYERS} players waiting`);
    setHidden(lbStarts, net.status !== 'queued');
    setText(lbStarts, `Starting in ${Math.max(0, Math.ceil(net.startsInS))}s`);
    setHidden(backBtn, !err);
    setHidden(cancelBtn, err);
  }

  // ---------------------------------------------------------------- mount
  root.append(titleScreen, lobby);
  ctx.ui.append(root);
  renderPlayers();

  return {
    update() {
      const ph = ctx.state.phase;
      const showTitle = ph === 'title';
      const showLobby = ph === 'lobby';
      setHidden(root, !(showTitle || showLobby));
      setHidden(titleScreen, !showTitle);
      setHidden(lobby, !showLobby);
      if (showLobby) renderLobby();
    },
  };
}
