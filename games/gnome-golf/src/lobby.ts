// Online UI: the ONLINE panel (name, public lobby, room code), the lobby (roster, the host's game and format
// pickers, START) and a LEAVE button on the online scorecard. Own root under the shared #ui element; CSS class prefix gl-.
import type { Ctx, Format, GameMode, OnlineApi, OnlineView, System } from './config';

const CSS = `
#gl-root { position:absolute; inset:0; font-family:system-ui, sans-serif; color:#fff; pointer-events:none; -webkit-user-select:none; user-select:none; }
#gl-root * { box-sizing:border-box; }
#gl-root button, #gl-root input { font:inherit; touch-action:manipulation; }

#gl-root .gl-sheet { display:none; position:absolute; inset:0; flex-direction:column; overflow-y:auto; pointer-events:auto; padding:calc(env(safe-area-inset-top,0px) + 12px) 14px calc(env(safe-area-inset-bottom,0px) + 14px); background:rgba(6,20,12,0.82); }
#gl-root .gl-sheet.gl-show { display:flex; }
#gl-root .gl-panel { width:100%; max-width:520px; margin:auto; padding:16px 14px; background:rgba(10,30,20,0.94); border-radius:12px; }
#gl-root .gl-h { margin:0 0 4px; font-size:clamp(20px, 6vw, 28px); font-weight:900; letter-spacing:0.06em; text-align:center; }
#gl-root .gl-sub { margin:0 0 10px; font-size:14px; line-height:1.35; opacity:0.85; text-align:center; overflow-wrap:anywhere; }
#gl-root .gl-label { display:block; margin:12px 0 4px; font-size:13px; font-weight:700; opacity:0.85; }
#gl-root input { width:100%; min-width:0; min-height:48px; padding:0 12px; font-size:18px; color:#1b3d22; background:#fff; border:0; border-radius:8px; outline:none; }
#gl-root .gl-row { display:flex; gap:8px; align-items:stretch; }
#gl-root .gl-row input { flex:1 1 auto; }
#gl-root .gl-btn { min-height:48px; padding:0 16px; font-size:16px; font-weight:800; letter-spacing:0.08em; color:#1b3d22; background:#ffd54a; border:0; border-radius:10px; box-shadow:0 4px 0 #b08c12; cursor:pointer; pointer-events:auto; white-space:nowrap; }
#gl-root .gl-btn:active { transform:translateY(2px); }
#gl-root .gl-btn:disabled { opacity:0.5; cursor:default; }
#gl-root .gl-teal { background:#2ec4b6; box-shadow:0 4px 0 #14766d; }
#gl-root .gl-ghost { color:#fff; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.3); box-shadow:none; }
#gl-root .gl-block { display:block; width:100%; margin-top:10px; }
#gl-root .gl-err { min-height:1.3em; margin-top:8px; font-size:14px; line-height:1.3; color:#ff6b6b; text-align:center; overflow-wrap:anywhere; }
#gl-root .gl-stat { min-height:1.3em; font-size:14px; text-align:center; opacity:0.9; }
#gl-root .gl-foot { display:flex; gap:8px; margin-top:12px; }
#gl-root .gl-foot .gl-btn { flex:1 1 auto; }

#gl-root .gl-lobby { display:none; position:absolute; left:50%; top:calc(env(safe-area-inset-top,0px) + 10px); transform:translateX(-50%); width:min(460px, calc(100% - 16px)); max-height:calc(100% - 20px); overflow-y:auto; pointer-events:auto; padding:12px; background:rgba(10,30,20,0.9); border-radius:12px; }
#gl-root .gl-lobby.gl-show { display:block; }
#gl-root .gl-cap { margin:12px 0 6px; font-size:13px; font-weight:700; opacity:0.85; }
#gl-root .gl-roster { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
#gl-root .gl-player { display:flex; align-items:center; gap:6px; min-width:0; min-height:36px; padding:4px 8px; background:rgba(255,255,255,0.08); border-radius:8px; font-weight:800; }
#gl-root .gl-pn { flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
#gl-root .gl-tag { flex:none; padding:1px 6px; border-radius:6px; background:#ffd54a; color:#1b3d22; font-size:11px; font-weight:800; }
#gl-root .gl-you { flex:none; font-size:12px; font-weight:600; opacity:0.75; }
#gl-root .gl-picks { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
#gl-root .gl-pick { min-height:48px; padding:8px 10px; color:#fff; background:rgba(255,255,255,0.1); border:2px solid rgba(255,255,255,0.2); border-radius:10px; font-weight:800; text-align:center; cursor:pointer; pointer-events:auto; }
#gl-root .gl-pick.gl-on { color:#1b3d22; background:#ffd54a; border-color:#ffd54a; }
#gl-root .gl-pick.gl-ro { cursor:default; }
#gl-root .gl-pick small { display:block; margin-top:4px; font-size:12px; font-weight:600; line-height:1.3; }
#gl-root .gl-lobby .gl-stat { margin-top:10px; }

#gl-leave { display:none; position:absolute; left:calc(env(safe-area-inset-left,0px) + 8px); bottom:calc(env(safe-area-inset-bottom,0px) + 8px); min-height:44px; padding:0 14px; font-size:14px; }
#gl-leave.gl-show { display:block; }
`;

/** Room codes: A-Z without I and O, plus the digits 2-9. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const FORMATS: { id: Format; title: string; desc: string }[] = [
  { id: 'together', title: 'TOGETHER', desc: 'One group, farthest from the hole plays next, everyone rides along' },
  { id: 'race', title: 'GNOME W FRIENDS', desc: 'Everyone plays their own ball at once in their own cart. First to finish wins.' },
];
const GAMES: { id: GameMode; title: string }[] = [
  { id: 'golf', title: 'GOLF' },
  { id: 'disc', title: 'GNOME DISC' },
];

function make<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function hex(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}
function randomCode(): string {
  let s = '';
  for (let i = 0; i < 5; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}

export function createLobby(ctx: Ctx, online: OnlineApi): System {
  const root = document.createElement('div');
  root.id = 'gl-root';
  root.innerHTML = `
<style>${CSS}</style>
<div class="gl-sheet" id="gl-online">
  <div class="gl-panel">
    <h2 class="gl-h">ONLINE</h2>
    <p class="gl-sub">Play Gnome Golf or Gnome Disc with up to 11 friends.</p>
    <label class="gl-label" for="gl-name">Your name</label>
    <input id="gl-name" maxlength="18" autocomplete="off" autocapitalize="words" spellcheck="false">
    <button class="gl-btn gl-teal gl-block" id="gl-public" type="button">PLAY PUBLIC</button>
    <label class="gl-label" for="gl-code">Room code</label>
    <div class="gl-row">
      <input id="gl-code" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD">
      <button class="gl-btn" id="gl-join" type="button">JOIN ROOM</button>
    </div>
    <button class="gl-btn gl-ghost gl-block" id="gl-create" type="button">CREATE ROOM</button>
    <div class="gl-err" id="gl-err"></div>
    <div class="gl-stat" id="gl-stat"></div>
    <div class="gl-foot"><button class="gl-btn gl-ghost" id="gl-back" type="button">BACK</button></div>
  </div>
</div>
<div class="gl-lobby" id="gl-lobby"></div>
<button class="gl-btn gl-ghost" id="gl-leave" type="button">LEAVE</button>`;
  ctx.ui.appendChild(root);

  const q = <T extends HTMLElement>(sel: string): T => root.querySelector(sel) as T;
  const sheet = q<HTMLElement>('#gl-online');
  const nameIn = q<HTMLInputElement>('#gl-name');
  const codeIn = q<HTMLInputElement>('#gl-code');
  const publicBtn = q<HTMLButtonElement>('#gl-public');
  const joinBtn = q<HTMLButtonElement>('#gl-join');
  const createBtn = q<HTMLButtonElement>('#gl-create');
  const errEl = q<HTMLElement>('#gl-err');
  const statEl = q<HTMLElement>('#gl-stat');
  const backBtn = q<HTMLButtonElement>('#gl-back');
  const lobby = q<HTMLElement>('#gl-lobby');
  const leaveBtn = q<HTMLButtonElement>('#gl-leave');
  const state = ctx.state;

  // Keys typed in the panels must not reach the game's own key handlers (space swings, arrows steer, Enter acts).
  const stopKeys = (e: Event): void => e.stopPropagation();
  root.addEventListener('keydown', stopKeys);
  root.addEventListener('keyup', stopKeys);

  let panelOpen = false;
  /** A problem found here (bad name or code); online.message shows the controller's own problems. */
  let localErr = '';
  let lobbyShown = '';

  function openPanel(): void {
    panelOpen = true;
    localErr = '';
    nameIn.value = online.name;
  }
  function closePanel(): void {
    panelOpen = false;
    localErr = '';
  }
  window.addEventListener('golf:online-panel', openPanel);

  /** The typed name if the shared filter accepts it, else null (and the reason is shown). */
  function checkedName(): string | null {
    const name = nameIn.value.trim();
    const bad = online.checkName(name);
    if (bad !== null) {
      localErr = bad;
      return null;
    }
    localErr = '';
    return name;
  }
  nameIn.addEventListener('change', () => { checkedName(); });
  nameIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkedName(); });

  codeIn.addEventListener('input', () => {
    codeIn.value = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  });
  codeIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinBtn.dispatchEvent(new PointerEvent('pointerdown')); });

  publicBtn.addEventListener('pointerdown', () => {
    const name = checkedName();
    if (name !== null) online.join(null, name);
  });
  joinBtn.addEventListener('pointerdown', () => {
    const name = checkedName();
    if (name === null) return;
    const code = codeIn.value;
    if (!/^[A-Z0-9]{4,8}$/.test(code)) {
      localErr = 'Room codes are 4 to 8 letters or numbers.';
      return;
    }
    online.join(code, name);
  });
  createBtn.addEventListener('pointerdown', () => {
    const name = checkedName();
    if (name !== null) online.join(randomCode(), name);
  });
  backBtn.addEventListener('pointerdown', () => {
    if (online.status === 'connecting') online.leave();
    closePanel();
  });
  leaveBtn.addEventListener('pointerdown', () => online.leave());

  /** The lobby card: roster, the host's pickers and START (or the wait). Rebuilt only when something it shows changes. */
  function renderLobby(v: OnlineView): void {
    const key = JSON.stringify([v.code, v.hostId, v.me, online.game, online.format, online.isHost, online.message, v.golfers.map((g) => [g.id, g.name, g.color, g.left])]);
    if (key === lobbyShown) return;
    lobbyShown = key;
    lobby.replaceChildren();

    lobby.append(make('h2', 'gl-h', 'LOBBY'));
    lobby.append(make('p', 'gl-sub', v.code !== null ? `Room ${v.code} · share it with friends` : 'Public lobby'));

    lobby.append(make('div', 'gl-cap', 'Players'));
    const roster = make('div', 'gl-roster');
    for (const g of v.golfers) {
      if (g.left) continue;
      const p = make('div', 'gl-player');
      const n = make('span', 'gl-pn', g.name);
      n.style.color = hex(g.color);
      p.append(n);
      if (g.id === v.hostId) p.append(make('span', 'gl-tag', 'HOST'));
      if (g.id === v.me) p.append(make('span', 'gl-you', '(you)'));
      roster.append(p);
    }
    lobby.append(roster);

    const host = online.isHost;
    lobby.append(make('div', 'gl-cap', 'Game'));
    const games = make('div', 'gl-picks');
    for (const g of GAMES) {
      const b = make('button', `gl-pick${online.game === g.id ? ' gl-on' : ''}${host ? '' : ' gl-ro'}`, g.title);
      b.type = 'button';
      b.addEventListener('pointerdown', () => { if (online.isHost) online.configure(g.id, online.format); });
      games.append(b);
    }
    lobby.append(games);

    lobby.append(make('div', 'gl-cap', 'Format'));
    const formats = make('div', 'gl-picks');
    for (const f of FORMATS) {
      const b = make('button', `gl-pick${online.format === f.id ? ' gl-on' : ''}${host ? '' : ' gl-ro'}`);
      b.type = 'button';
      b.append(f.title, make('small', '', f.desc));
      b.addEventListener('pointerdown', () => { if (online.isHost) online.configure(online.game, f.id); });
      formats.append(b);
    }
    lobby.append(formats);

    if (host) {
      const start = make('button', 'gl-btn gl-block', 'START ROUND');
      start.type = 'button';
      start.addEventListener('pointerdown', () => online.start());
      lobby.append(start);
    } else {
      lobby.append(make('div', 'gl-stat', 'Waiting for the host to start'));
    }

    const foot = make('div', 'gl-foot');
    const leave = make('button', 'gl-btn gl-ghost', 'LEAVE');
    leave.type = 'button';
    leave.addEventListener('pointerdown', () => online.leave());
    foot.append(leave);
    lobby.append(foot);
    if (online.message !== '') lobby.append(make('div', 'gl-err', online.message));
  }

  return {
    update(): void {
      const st = online.status;
      // The panel closes itself once the match starts or the lobby opens.
      if (panelOpen && (st === 'lobby' || st === 'playing')) closePanel();

      const v = state.online;
      const lobbyOn = st === 'lobby' && v !== null;
      if (lobbyOn) renderLobby(v);
      lobby.classList.toggle('gl-show', lobbyOn);

      sheet.classList.toggle('gl-show', panelOpen);
      if (panelOpen) {
        const connecting = st === 'connecting';
        for (const b of [publicBtn, joinBtn, createBtn]) if (b.disabled !== connecting) b.disabled = connecting;
        if (nameIn.disabled !== connecting) nameIn.disabled = connecting;
        if (codeIn.disabled !== connecting) codeIn.disabled = connecting;
        const stat = connecting ? 'Connecting…' : '';
        if (statEl.textContent !== stat) statEl.textContent = stat;
        const msg = localErr !== '' ? localErr : online.message;
        if (errEl.textContent !== msg) errEl.textContent = msg;
      }

      const card = v !== null && v.started && (state.phase === 'card' || state.phase === 'final');
      leaveBtn.classList.toggle('gl-show', card);

      document.body.classList.toggle('gl-open', panelOpen || lobbyOn);
    },
  };
}
