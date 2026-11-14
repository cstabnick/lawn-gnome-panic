// HUD: the scoreboard, the pin diagram, the turn banner, the ball speed and the final standings.
// Everything lives in #bh-root inside the shared #ui element. Title and lobby screens belong to menu.ts.
import { ROUND, type Ctx, type Player, type System } from './config';
import { makePlayer, newGame, toTitle } from './game';
import { cursor, frameMarks, frameScores, totalScore } from './scoring';
import { sfx, startAudio } from './audio';

const PANEL = 'rgba(20,10,40,0.7)';
const BOARD_PHASES: ReadonlySet<string> = new Set(['intro', 'aim', 'approach', 'roll', 'result']);
const NAME_MAX = 10;
/** Seconds the turn banner takes to slide in, and to slide out again. */
const BANNER_EDGE = 0.35;
/** Pin rows of the diagram, bottom (head pin) first, each listed left to right on the screen. */
const PIN_ROWS: readonly (readonly number[])[] = [[0], [1, 2], [3, 4, 5], [6, 7, 8, 9]];
const DOT_PITCH = 20;
const DOT_ROW = 22;
const DOT = 14;

const CSS = `
#bh-root { position:absolute; inset:0; pointer-events:none; font-family:system-ui; color:#fff; text-shadow:0 2px 4px #000; }
#bh-root * { box-sizing:border-box; }
#bh-root .bh-dot { width:10px; height:10px; border-radius:50%; background:var(--c); flex:none; }
#bh-board { position:absolute; left:0; right:0; top:0; max-height:25vh; overflow:hidden; padding:max(6px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 6px max(8px, env(safe-area-inset-left)); background:${PANEL}; border-radius:0 0 12px 12px; }
#bh-root .bh-row { display:grid; grid-template-columns:84px repeat(10, minmax(0,1fr)) 40px; gap:2px; align-items:center; padding:2px 4px; margin-bottom:2px; border:2px solid transparent; border-radius:8px; min-height:26px; }
#bh-root .bh-row.cur { border-color:var(--c); background:rgba(255,255,255,0.16); }
#bh-root .bh-row.gone { opacity:0.4; }
#bh-root .bh-name { font-size:12px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:4px; min-width:0; }
#bh-root .bh-name small { font-weight:400; opacity:0.8; }
#bh-root .bh-f { min-width:0; border-radius:4px; background:rgba(255,255,255,0.06); text-align:center; padding:1px 0; }
#bh-root .bh-f.now { outline:2px solid #fff; outline-offset:-2px; }
#bh-root .bh-m { display:flex; gap:1px; height:12px; }
#bh-root .bh-m i { flex:1 1 0; min-width:0; font-style:normal; font-size:9px; font-weight:700; line-height:12px; background:rgba(0,0,0,0.35); border-radius:2px; }
#bh-root .bh-m i.x { color:#ffd54f; }
#bh-root .bh-m i.s { color:#3ff0ff; }
#bh-root .bh-m i.z { color:#9a9aa8; }
#bh-root .bh-t { font-size:11px; font-weight:700; height:13px; line-height:13px; }
#bh-root .bh-tot { font-size:15px; font-weight:900; text-align:right; }
#bh-board .bh-compact { display:none; }
#bh-board .bh-chips { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; }
#bh-board .bh-chip2 { font-size:12px; font-weight:700; padding:2px 8px; background:rgba(255,255,255,0.08); border-radius:8px; border-left:4px solid var(--c); }
#bh-board .bh-chip2.gone { opacity:0.4; }
@media (max-height:480px) and (orientation:landscape) {
  #bh-board { max-height:32vh; padding-top:max(3px, env(safe-area-inset-top)); padding-bottom:3px; }
  #bh-root .bh-row { min-height:0; padding:1px 4px; margin-bottom:1px; }
  #bh-root .bh-t { display:none; }
}
@media (max-width:699px) and (orientation:portrait) {
  #bh-board .bh-full { display:none; }
  #bh-board .bh-compact { display:block; }
  #bh-root .bh-row { grid-template-columns:64px repeat(10, minmax(0,1fr)) 34px; }
}
#bh-pins { position:absolute; right:max(8px, env(safe-area-inset-right)); top:8px; width:90px; height:90px; background:${PANEL}; border-radius:12px; }
#bh-pins .bh-pin { position:absolute; width:${DOT}px; height:${DOT}px; border-radius:50%; background:#fff; border:2px solid #fff; }
#bh-pins .bh-pin.down { background:transparent; border-color:rgba(255,255,255,0.5); }
#bh-speed { position:absolute; left:max(8px, env(safe-area-inset-left)); top:8px; padding:4px 10px; background:${PANEL}; border-radius:12px; font-weight:800; font-size:14px; }
#bh-banner { position:absolute; left:0; right:0; top:40%; text-align:center; overflow:hidden; }
#bh-banner .bh-bin { display:inline-block; will-change:transform, opacity; }
#bh-banner .bh-bn { font-size:clamp(40px, 12vw, 96px); font-weight:900; font-style:italic; line-height:1; }
#bh-banner .bh-bs { font-size:clamp(18px, 4vw, 28px); font-weight:900; font-style:italic; margin-top:6px; }
#bh-banner .bh-by { font-size:16px; opacity:0.85; margin-top:2px; }
#bh-wait { position:absolute; left:0; right:0; bottom:max(12px, env(safe-area-inset-bottom)); text-align:center; font-weight:800; font-size:18px; }
#bh-final { position:absolute; inset:0; overflow-y:auto; pointer-events:auto; background:rgba(20,10,40,0.85); padding:max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); }
#bh-final h1 { margin:0 0 12px; text-align:center; font-size:clamp(32px, 8vw, 56px); font-weight:900; font-style:italic; color:#ffd54f; }
#bh-final .bh-card { background:${PANEL}; border-radius:12px; padding:10px 12px; margin:0 auto 10px; max-width:820px; }
#bh-final .bh-head { display:flex; align-items:center; gap:10px; font-weight:900; font-size:18px; }
#bh-final .bh-place { min-width:70px; font-size:14px; font-weight:800; opacity:0.9; }
#bh-final .bh-fname { flex:1; min-width:0; color:var(--c); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
#bh-final .bh-ftot { font-size:26px; font-weight:900; }
#bh-final .bh-verdict { text-align:center; font-size:20px; font-weight:900; font-style:italic; color:#ff3fb4; margin:8px 0 4px; }
#bh-final .bh-btns { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:12px; }
#bh-final button { pointer-events:auto; min-height:48px; min-width:150px; padding:0 20px; border:none; border-radius:12px; font-family:system-ui; font-weight:900; font-style:italic; font-size:18px; color:#1a1030; background:#3ff0ff; cursor:pointer; touch-action:manipulation; }
#bh-final button.bh-alt { background:#ff3fb4; color:#fff; }
`;

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');

const show = (el: HTMLElement, on: boolean): void => {
  const d = on ? '' : 'none';
  if (el.style.display !== d) el.style.display = d;
};

const ordinal = (n: number): string => (['1st', '2nd', '3rd'][n - 1] ?? `${n}th`);

export function createHud(ctx: Ctx): System {
  const { state, ui } = ctx;

  const root = document.createElement('div');
  root.id = 'bh-root';
  root.innerHTML =
    `<style>${CSS}</style>` +
    `<div id="bh-board"></div>` +
    `<div id="bh-pins"></div>` +
    `<div id="bh-speed"></div>` +
    `<div id="bh-banner"><div class="bh-bin"></div></div>` +
    `<div id="bh-wait"></div>` +
    `<div id="bh-final">` +
    `<h1>FINAL SCORES</h1>` +
    `<div id="bh-cards"></div>` +
    `<div class="bh-btns"><button id="bh-again" type="button">PLAY AGAIN</button>` +
    `<button id="bh-menu" type="button" class="bh-alt">MENU</button></div>` +
    `</div>`;
  ui.append(root);

  const board = root.querySelector('#bh-board') as HTMLElement;
  const pins = root.querySelector('#bh-pins') as HTMLElement;
  const speed = root.querySelector('#bh-speed') as HTMLElement;
  const banner = root.querySelector('#bh-banner') as HTMLElement;
  const bannerInner = banner.querySelector('.bh-bin') as HTMLElement;
  const wait = root.querySelector('#bh-wait') as HTMLElement;
  const final = root.querySelector('#bh-final') as HTMLElement;
  const cards = root.querySelector('#bh-cards') as HTMLElement;
  const again = root.querySelector('#bh-again') as HTMLButtonElement;
  const menu = root.querySelector('#bh-menu') as HTMLButtonElement;

  // Pin diagram: ten dots, positioned once.
  const dots: HTMLElement[] = new Array(10);
  PIN_ROWS.forEach((row, r) => {
    const n = r + 1;
    row.forEach((pin, j) => {
      const cx = 45 + (j - (n - 1) / 2) * DOT_PITCH;
      const cy = 80 - r * DOT_ROW;
      const d = document.createElement('div');
      d.className = 'bh-pin';
      d.style.left = `${cx - DOT / 2}px`;
      d.style.top = `${cy - DOT / 2}px`;
      pins.append(d);
      dots[pin] = d;
    });
  });

  // Final-screen buttons. Acted on at pointerdown so a tap never waits for a release.
  const press = (fn: () => void) => (e: PointerEvent) => {
    e.preventDefault();
    startAudio();
    sfx('click');
    fn();
  };
  again.addEventListener('pointerdown', press(() => {
    if (state.mode !== 'local') return;
    newGame(state, state.players.map((p) => makePlayer(p.name, p.look, p.color)), 'local');
  }));
  menu.addEventListener('pointerdown', press(() => toTitle(state)));

  function rowHtml(i: number, live: boolean): string {
    const p = state.players[i];
    const c = cursor(p.rolls);
    const isCur = live && i === state.current;
    const nowFrame = live ? (i === state.current ? state.frame : c.done ? -1 : c.frame) : -1;
    const marks = frameMarks(p.rolls);
    const scores = frameScores(p.rolls);
    let cells = '';
    for (let f = 0; f < 10; f++) {
      const m = marks[f] ?? [];
      let slots = '';
      for (let s = 0; s < (f === 9 ? 3 : 2); s++) {
        const ch = m[s] ?? '';
        const cls = ch === 'X' ? 'x' : ch === '/' ? 's' : ch === '-' ? 'z' : '';
        slots += `<i class="${cls}">${esc(ch)}</i>`;
      }
      const sc = scores[f];
      cells += `<div class="bh-f${f === nowFrame ? ' now' : ''}"><div class="bh-m">${slots}</div>` +
        `<div class="bh-t">${sc === null ? '' : sc}</div></div>`;
    }
    return `<div class="bh-row${isCur ? ' cur' : ''}${p.gone ? ' gone' : ''}" style="--c:${hex(p.color)}">` +
      `<div class="bh-name"><span class="bh-dot"></span>${esc(p.name.slice(0, NAME_MAX))}${p.gone ? ' <small>left</small>' : ''}</div>` +
      `${cells}<div class="bh-tot">${totalScore(p.rolls)}</div></div>`;
  }

  let boardKey = '';
  const boardKeyOf = (): string =>
    `${state.mode}|${state.current}|${state.frame}|` +
    state.players.map((p) => `${p.name}~${p.color}~${p.gone ? 1 : 0}~${p.rolls.join(',')}`).join(';');

  function rebuildBoard(): void {
    const cur = state.current;
    const full = state.players.map((_, i) => rowHtml(i, true)).join('');
    const others = state.players
      .map((p, i) => (i === cur ? '' :
        `<span class="bh-chip2${p.gone ? ' gone' : ''}" style="--c:${hex(p.color)}">${esc(p.name.slice(0, NAME_MAX))} ` +
        `${p.gone ? 'left' : totalScore(p.rolls)}</span>`))
      .join('');
    board.innerHTML =
      `<div class="bh-full">${full}</div>` +
      `<div class="bh-compact">${state.players[cur] ? rowHtml(cur, true) : ''}<div class="bh-chips">${others}</div></div>`;
  }

  /** Pin diagram and speed readout sit just under the scoreboard (whatever its height is). */
  function layoutOverlays(): void {
    const top = `${board.offsetHeight + 8}px`;
    if (pins.style.top !== top) pins.style.top = top;
    if (speed.style.top !== top) speed.style.top = top;
  }
  window.addEventListener('resize', layoutOverlays);

  function buildFinal(): void {
    const order = state.players
      .map((p, i) => ({ i, t: totalScore(p.rolls), p }))
      .sort((a, b) => b.t - a.t);
    const top = order[0]?.t ?? 0;
    const verdict =
      top >= 300 ? 'PERFECT GAME!!!' :
      top >= 200 ? 'Gnome Legend' :
      top >= 150 ? 'Lane Gnome' :
      top >= 100 ? 'Weekend Gnome' : 'Gutter Gnome';
    cards.innerHTML = order.map(({ i, t, p }) => {
      const place = 1 + order.filter((o) => o.t > t).length;
      return `<div class="bh-card" style="--c:${hex(p.color)}">` +
        `<div class="bh-head"><span class="bh-place">${ordinal(place)}${place === 1 ? ' 👑' : ''}</span>` +
        `<span class="bh-fname">${esc(p.name.slice(0, NAME_MAX))}</span><span class="bh-ftot">${t}</span></div>` +
        `${rowHtml(i, false)}` +
        (place === 1 ? `<div class="bh-verdict">${verdict}</div>` : '') +
        `</div>`;
    }).join('');
    show(again, state.mode === 'local');
  }

  let wasInGame = false;
  let wasFinal = false;
  let pinKey = '';
  let speedText = '';
  let bannerKey = '';
  let waitText = '';

  return {
    update(): void {
      const ph = state.phase;
      const inGame = BOARD_PHASES.has(ph);
      const cur: Player | undefined = state.players[state.current];

      // Scoreboard.
      show(board, inGame);
      if (inGame) {
        const key = boardKeyOf();
        let rebuilt = false;
        if (key !== boardKey) {
          boardKey = key;
          rebuildBoard();
          rebuilt = true;
        }
        if (rebuilt || inGame !== wasInGame) layoutOverlays();
      }
      wasInGame = inGame;

      // Pin diagram: the standing set before the throw during 'roll', updated in 'result'.
      show(pins, inGame);
      const pk = state.standing.map((b) => (b ? '1' : '0')).join('');
      if (pk !== pinKey) {
        pinKey = pk;
        for (let i = 0; i < 10; i++) dots[i].classList.toggle('down', !state.standing[i]);
      }

      // Ball speed.
      const live = ph === 'roll' || ph === 'result';
      show(speed, live && state.input !== null);
      if (live && state.input) {
        const t = `${(state.input.speed * 3.6).toFixed(1)} km/h`;
        if (t !== speedText) {
          speedText = t;
          speed.textContent = t;
        }
      }

      // Turn banner, slides in from the left and out to the right during the intro.
      const intro = ph === 'intro' && cur !== undefined;
      show(banner, intro);
      if (intro && cur) {
        const key = `${state.mode}|${cur.name}|${cur.color}|${cur.local}|${state.frame}`;
        if (key !== bannerKey) {
          bannerKey = key;
          bannerInner.innerHTML =
            `<div class="bh-bn" style="color:${hex(cur.color)}">${esc(cur.name.toUpperCase())}</div>` +
            `<div class="bh-bs">Frame ${state.frame + 1}</div>` +
            (state.frame === 9 ? '<div class="bh-bs">FINAL FRAME</div>' : '') +
            (state.mode === 'online' && cur.local ? '<div class="bh-by">(you)</div>' : '');
        }
        const t = state.phaseTime;
        const T = ROUND.introSeconds;
        const W = ui.clientWidth || window.innerWidth;
        let x = 0;
        let op = 1;
        if (t < BANNER_EDGE) {
          const k = Math.max(0, t / BANNER_EDGE);
          x = (1 - k) * -0.6 * W;
          op = k;
        } else if (t > T - BANNER_EDGE) {
          const k = Math.min(1, (t - (T - BANNER_EDGE)) / BANNER_EDGE);
          x = k * 0.6 * W;
          op = 1 - k;
        }
        bannerInner.style.transform = `translateX(${x.toFixed(1)}px)`;
        bannerInner.style.opacity = op.toFixed(3);
      }

      // Waiting for a remote bowler.
      const waiting = state.mode === 'online' && ph === 'aim' && cur !== undefined && !cur.local && !cur.gone;
      show(wait, waiting);
      if (waiting && cur) {
        const t = `Waiting for ${cur.name}…`;
        if (t !== waitText) {
          waitText = t;
          wait.textContent = t;
        }
      }

      // Final standings.
      const fin = ph === 'final';
      show(final, fin);
      if (fin && !wasFinal) buildFinal();
      wasFinal = fin;
    },
  };
}
