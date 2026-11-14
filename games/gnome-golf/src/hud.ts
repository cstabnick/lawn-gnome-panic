// HUD: title screen, hole and shot info, shot banners and the scorecard, solo and online.
// The online panel and lobby are in lobby.ts. All DOM lives under #gh-root, appended to the shared #ui element.
// Only changed values touch the DOM.
import { startAudio } from './audio';
import { holeLength } from './course';
import { HOLES, LIES, type Ctx, type Golfer, type OnlineApi, type OnlineView, type System } from './config';
import { distanceToPin, fmtDistance, newRound, nextHole, roundTotals, toggleRide } from './round';

const CSS = `
#gh-root { position:absolute; inset:0; font-family:system-ui, sans-serif; color:#fff; pointer-events:none; -webkit-user-select:none; user-select:none; }
#gh-root * { box-sizing:border-box; }

#gh-title { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; text-align:center; padding:24px 16px calc(env(safe-area-inset-bottom,0px) + 22px); background:linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.38) 30%, rgba(0,0,0,0) 62%); }
#gh-title h1 { margin:0; font-size:clamp(36px, 11vw, 80px); font-weight:900; letter-spacing:0.08em; line-height:1; text-shadow:0 3px 0 #1b3d22, 0 4px 10px rgba(0,0,0,0.5); }
#gh-title .gh-o { position:relative; display:inline-block; }
#gh-title .gh-hat { position:absolute; left:50%; bottom:88%; transform:translateX(-50%); color:#e53935; font-size:0.42em; line-height:1; text-shadow:none; }
#gh-title .gh-sub { margin:10px 0 18px; font-size:clamp(13px, 3.6vw, 18px); opacity:0.9; text-shadow:0 1px 2px #000; }
#gh-title .gh-ride { min-height:18px; margin-top:10px; font-size:14px; font-weight:800; letter-spacing:0.1em; color:#ffd54a; text-shadow:0 1px 2px #000; }
#gh-title .gh-how { margin-top:14px; font-size:13px; opacity:0.85; text-shadow:0 1px 2px #000; }

#gh-title .gh-modes { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; }
#gh-title .gh-modes button { margin:0; min-width:180px; }
#gh-start, #gh-next, #gh-again, #gh-disc, #gh-online { font:inherit; pointer-events:auto; display:block; margin:0 auto; min-width:220px; min-height:56px; padding:0 28px; font-weight:800; font-size:20px; letter-spacing:0.12em; color:#1b3d22; background:#ffd54a; border:0; border-radius:10px; box-shadow:0 4px 0 #b08c12, 0 6px 14px rgba(0,0,0,0.35); cursor:pointer; touch-action:manipulation; }
#gh-start:active, #gh-next:active, #gh-again:active, #gh-disc:active, #gh-online:active { transform:translateY(2px); }
#gh-disc { background:#ff8a3d; box-shadow:0 4px 0 #b4501a, 0 6px 14px rgba(0,0,0,0.35); }
#gh-online { background:#2ec4b6; box-shadow:0 4px 0 #14766d, 0 6px 14px rgba(0,0,0,0.35); }

#gh-left { position:absolute; left:calc(env(safe-area-inset-left,0px) + 8px); top:calc(env(safe-area-inset-top,0px) + 8px); display:flex; flex-direction:column; align-items:flex-start; gap:6px; }
#gh-info, #gh-shot, #gh-banner, #gh-board { background:rgba(10,30,20,0.55); border-radius:10px; text-shadow:0 1px 2px #000; }
#gh-info { padding:8px 12px; min-width:128px; }
#gh-info .gh-hole { font-size:26px; font-weight:800; line-height:1.1; }
#gh-info .gh-par, #gh-info .gh-stroke, #gh-info .gh-round { font-size:13px; line-height:1.4; }
#gh-shot { padding:8px 12px; font-size:13px; line-height:1.4; }
#gh-shot .gh-lie { font-weight:700; }
#gh-shot .gh-wind { display:flex; align-items:center; gap:6px; margin-top:4px; }
#gh-shot .gh-arrow { display:inline-block; width:22px; height:22px; }
#gh-shot .gh-arrow svg { display:block; width:22px; height:22px; }
#gh-board { padding:6px 10px; font-size:12px; line-height:1.5; min-width:128px; }
#gh-board .gh-brow { display:flex; align-items:center; gap:8px; white-space:nowrap; }
#gh-board .gh-bname { flex:1 1 auto; max-width:96px; overflow:hidden; text-overflow:ellipsis; font-weight:700; }
#gh-board .gh-bhole, #gh-board .gh-bstr { opacity:0.9; font-variant-numeric:tabular-nums; }
#gh-board .gh-bdone { color:#7ddc6a; font-weight:800; min-width:10px; }

#gh-banner { position:absolute; left:50%; top:calc(env(safe-area-inset-top,0px) + 8px); transform:translateX(-50%); width:max-content; max-width:62vw; padding:10px 18px; text-align:center; opacity:0; transition:opacity 0.25s ease; }
#gh-banner.gh-on { opacity:1; }
#gh-banner .gh-big { font-size:26px; font-weight:800; line-height:1.15; }
#gh-banner .gh-mid { font-size:16px; margin-top:2px; }
#gh-banner .gh-tiny { font-size:12px; opacity:0.8; margin-top:4px; }
#gh-banner .gh-xl { font-size:40px; font-weight:900; letter-spacing:0.04em; }
#gh-banner.gh-gold .gh-xl { color:#ffd54a; }
@media (orientation:portrait) { #gh-banner { top:calc(env(safe-area-inset-top,0px) + 200px); } }

#gh-turn { position:absolute; left:50%; top:calc(env(safe-area-inset-top,0px) + 64px); transform:translateX(-50%); max-width:60vw; padding:6px 14px; border-radius:999px; background:rgba(10,30,20,0.6); font-size:15px; font-weight:700; line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-shadow:0 1px 2px #000; }
#gh-turn.gh-mine { color:#ffd54a; }
@media (orientation:portrait) { #gh-turn { top:calc(env(safe-area-inset-top,0px) + 262px); } }

#gh-card { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:calc(env(safe-area-inset-top,0px) + 12px) 12px calc(env(safe-area-inset-bottom,0px) + 12px); background:rgba(0,0,0,0.5); pointer-events:auto; }
#gh-card .gh-panel { width:100%; max-width:560px; max-height:100%; overflow-y:auto; padding:16px 14px; background:rgba(10,30,20,0.88); border-radius:12px; text-align:center; }
#gh-card .gh-h { margin:0 0 12px; font-size:clamp(18px, 5.2vw, 24px); font-weight:800; }
#gh-card .gh-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
#gh-card table { margin:0 auto; border-spacing:3px; font-size:clamp(12px, 3.4vw, 15px); }
#gh-card th, #gh-card td { min-width:26px; height:30px; padding:0 3px; text-align:center; white-space:nowrap; font-weight:600; }
#gh-card th { font-weight:700; opacity:0.9; }
#gh-card tr > th:first-child { text-align:left; padding-right:6px; }
#gh-card .gh-tot { font-weight:800; padding:0 8px; }
#gh-card td.gh-under span, #gh-card td.gh-over span { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; }
#gh-card td.gh-under span { border:2px solid #7ddc6a; border-radius:50%; }
#gh-card td.gh-over span { border:2px solid #ff6b6b; border-radius:4px; }
#gh-card .gh-pname { display:inline-block; max-width:112px; overflow:hidden; text-overflow:ellipsis; vertical-align:bottom; font-weight:800; }
#gh-card .gh-tag { display:inline-block; margin-left:4px; padding:0 5px; border-radius:6px; background:rgba(255,255,255,0.16); font-size:0.78em; font-weight:700; vertical-align:bottom; }
#gh-card .gh-note { margin-left:4px; font-size:0.8em; font-weight:600; opacity:0.75; }
#gh-card tr.gh-gone { opacity:0.5; }
#gh-card td.gh-time { font-variant-numeric:tabular-nums; }
#gh-card .gh-foot { margin-top:10px; font-size:14px; opacity:0.9; min-height:1em; }
#gh-card #gh-next, #gh-card #gh-again { margin-top:16px; }
#gh-card #gh-next:disabled, #gh-card #gh-again:disabled { opacity:0.5; cursor:default; }
`;

const ARROW_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L21 15 L12 11.5 L3 15 Z" fill="currentColor"/></svg>';

interface Slot { text?: string; html?: string; cls?: string; show?: string; tf?: string; key?: string }
const cache = new WeakMap<Element, Slot>();
function slot(el: Element): Slot {
  let c = cache.get(el);
  if (!c) { c = {}; cache.set(el, c); }
  return c;
}
function setText(el: HTMLElement, v: string): void {
  const c = slot(el);
  if (c.text !== v) { c.text = v; el.textContent = v; }
}
function setHtml(el: HTMLElement, v: string): void {
  const c = slot(el);
  if (c.html !== v) { c.html = v; el.innerHTML = v; }
}
function setClass(el: HTMLElement, v: string): void {
  const c = slot(el);
  if (c.cls !== v) { c.cls = v; el.className = v; }
}
function setShown(el: HTMLElement, on: boolean): void {
  const v = on ? '' : 'none';
  const c = slot(el);
  if (c.show !== v) { c.show = v; el.style.display = v; }
}
function setTransform(el: HTMLElement, v: string): void {
  const c = slot(el);
  if (c.tf !== v) { c.tf = v; el.style.transform = v; }
}
/** Rebuilds an element's children with fill() only when its key changed (names go in as text nodes, never HTML). */
function rebuild(el: HTMLElement, key: string, fill: (el: HTMLElement) => void): void {
  const c = slot(el);
  if (c.key === key) return;
  c.key = key;
  el.replaceChildren();
  fill(el);
}
function make<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Score to par as shown on the HUD: "E", "+2", "-1". */
function toParLabel(n: number): string {
  return n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`;
}
/** 0xRRGGBB as a CSS colour. */
function hex(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}
/** m:ss for a race finish time in seconds, '' when not finished. */
function timeLabel(s: number | null): string {
  if (s === null) return '';
  const secs = Math.round(s);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

interface Tally { strokes: number; toPar: number; played: number }
/** Strokes and to-par over the holes with a score. */
function tally(scores: readonly (number | null)[]): Tally {
  let strokes = 0;
  let par = 0;
  let played = 0;
  scores.forEach((s, i) => {
    if (s === null) return;
    strokes += s;
    par += HOLES[i].par;
    played++;
  });
  return { strokes, toPar: strokes - par, played };
}

interface Row { g: Golfer; scores: (number | null)[]; t: Tally }
/** Race order: finished first by finish time, then the rest by holes played and to-par. */
function raceCompare(a: Row, b: Row): number {
  const fa = a.g.race?.finishedS ?? null;
  const fb = b.g.race?.finishedS ?? null;
  if (fa !== null || fb !== null) {
    if (fa === null) return 1;
    if (fb === null) return -1;
    return fa - fb;
  }
  return b.t.played - a.t.played || a.t.toPar - b.t.toPar;
}

export function createHud(ctx: Ctx, online: OnlineApi): System {
  const root = document.createElement('div');
  root.id = 'gh-root';
  root.innerHTML = `
<style>${CSS}</style>
<div id="gh-title">
  <h1>GN<span class="gh-o">O<span class="gh-hat">&#9650;</span></span>ME GOLF</h1>
  <div class="gh-sub">Gnome Island Links &middot; 9 holes</div>
  <div class="gh-modes">
    <button id="gh-start" type="button">TEE OFF</button>
    <button id="gh-disc" type="button">GNOME DISC</button>
    <button id="gh-online" type="button">ONLINE</button>
  </div>
  <div class="gh-ride"></div>
  <div class="gh-how">Golf: drag to aim &middot; &#9664; &#9654; clubs &middot; tap SWING three times: start, power, accuracy</div>
  <div class="gh-how">Gnome Disc: Disco the living frisbee hurls your gnome at a chain basket. Hold to whirl, let go on the green line, tap to flail mid-air.</div>
</div>
<div id="gh-left">
  <div id="gh-info">
    <div class="gh-hole"></div>
    <div class="gh-par"></div>
    <div class="gh-stroke"></div>
    <div class="gh-round"></div>
  </div>
  <div id="gh-shot">
    <div class="gh-lie"></div>
    <div class="gh-pin"></div>
    <div class="gh-wind"><span class="gh-arrow">${ARROW_SVG}</span><span class="gh-mph"></span></div>
  </div>
  <div id="gh-board"></div>
</div>
<div id="gh-banner"></div>
<div id="gh-turn"></div>
<div id="gh-card">
  <div class="gh-panel">
    <h2 class="gh-h"></h2>
    <div class="gh-scroll"><table></table></div>
    <div class="gh-foot"></div>
    <button id="gh-next" type="button">NEXT HOLE</button>
  </div>
</div>`;
  ctx.ui.appendChild(root);

  const q = <T extends HTMLElement>(sel: string): T => root.querySelector(sel) as T;
  const title = q<HTMLElement>('#gh-title');
  const startBtn = q<HTMLButtonElement>('#gh-start');
  const rideEl = q<HTMLElement>('.gh-ride');
  const onlineBtn = q<HTMLButtonElement>('#gh-online');
  const left = q<HTMLElement>('#gh-left');
  const holeEl = q<HTMLElement>('.gh-hole');
  const parEl = q<HTMLElement>('.gh-par');
  const strokeEl = q<HTMLElement>('.gh-stroke');
  const roundEl = q<HTMLElement>('.gh-round');
  const shot = q<HTMLElement>('#gh-shot');
  const boardEl = q<HTMLElement>('#gh-board');
  const lieEl = q<HTMLElement>('.gh-lie');
  const pinEl = q<HTMLElement>('.gh-pin');
  const arrowEl = q<HTMLElement>('.gh-arrow');
  const mphEl = q<HTMLElement>('.gh-mph');
  const banner = q<HTMLElement>('#gh-banner');
  const turnEl = q<HTMLElement>('#gh-turn');
  const card = q<HTMLElement>('#gh-card');
  const cardHead = q<HTMLElement>('.gh-h');
  const table = q<HTMLElement>('table');
  const foot = q<HTMLElement>('.gh-foot');
  const cardBtn = q<HTMLButtonElement>('#gh-next');

  const state = ctx.state;

  /** One action for the title button, the scorecard button and Enter. Online, the scorecard button asks the controller. */
  function act(mode?: 'golf' | 'disc'): void {
    if (state.online) {
      if ((state.phase === 'card' || state.phase === 'final') && online.canNext()) online.next();
      return;
    }
    const p = state.phase;
    if (p === 'title') {
      startAudio();
      newRound(state, mode ?? 'golf');
    } else if (p === 'card') {
      nextHole(state);
    } else if (p === 'final') {
      newRound(state);
    }
  }
  startBtn.addEventListener('pointerdown', () => act('golf'));
  const discBtn = q<HTMLButtonElement>('#gh-disc');
  discBtn.addEventListener('pointerdown', () => act('disc'));
  onlineBtn.addEventListener('pointerdown', () => {
    startAudio();
    window.dispatchEvent(new CustomEvent('golf:online-panel'));
  });
  cardBtn.addEventListener('pointerdown', () => act());
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.repeat) act();
  });

  // Title-screen cheat: typing 350z swaps the mower cart for a 2008 Nissan 350Z (and back again).
  const CHEAT = '350z';
  let typed = '';
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (state.phase !== 'title' || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-CHEAT.length);
    if (typed !== CHEAT) return;
    typed = '';
    toggleRide(state);
  });

  let cardKey = '';
  /** Which scorecard is in the table right now, so each one rebuilds when the other was shown. */
  let tableMode: 'solo' | 'online' = 'solo';

  function rowsFor(o: OnlineView, isFinal: boolean): Row[] {
    const rows: Row[] = o.golfers.map((g) => {
      const scores = g.id === o.me ? state.scores : g.scores;
      return { g, scores, t: tally(scores) };
    });
    if (isFinal) rows.sort(o.format === 'race' ? raceCompare : (a, b) => a.t.toPar - b.t.toPar);
    return rows;
  }

  function renderOnlineTable(o: OnlineView, isFinal: boolean): void {
    const race = o.format === 'race';
    const rows = rowsFor(o, isFinal);
    const key = JSON.stringify([isFinal, o.format, o.me, rows.map((r) => [r.g.id, r.g.name, r.g.color, r.g.joinedHole, r.g.left, r.g.race?.finishedS ?? null, r.scores])]);
    rebuild(table, key, (el) => {
      const body = make('tbody');
      const head = make('tr');
      head.append(make('th', '', 'Hole'));
      HOLES.forEach((_, i) => head.append(make('th', '', String(i + 1))));
      head.append(make('th', 'gh-tot', 'TOT'));
      if (race) head.append(make('th', 'gh-time', 'Time'));
      body.append(head);

      const par = make('tr');
      par.append(make('th', '', 'Par'));
      let parTot = 0;
      HOLES.forEach((h) => {
        parTot += h.par;
        par.append(make('td', '', String(h.par)));
      });
      par.append(make('td', 'gh-tot', String(parTot)));
      if (race) par.append(make('td', 'gh-time'));
      body.append(par);

      for (const r of rows) {
        const tr = make('tr', r.g.left ? 'gh-gone' : '');
        const th = make('th');
        const name = make('span', 'gh-pname', r.g.name);
        name.style.color = hex(r.g.color);
        th.append(name);
        if (r.g.id === o.me) th.append(make('span', 'gh-note', '(you)'));
        if (r.g.joinedHole > 0) th.append(make('span', 'gh-tag', `joined hole ${r.g.joinedHole + 1}`));
        if (r.g.left) th.append(make('span', 'gh-note', '(left)'));
        tr.append(th);
        HOLES.forEach((h, i) => {
          if (i < r.g.joinedHole) {
            tr.append(make('td', '', '–'));
            return;
          }
          const sc = r.scores[i];
          if (sc === null) {
            tr.append(make('td'));
            return;
          }
          const d = sc - h.par;
          const td = make('td', d < 0 ? 'gh-under' : d > 0 ? 'gh-over' : '');
          td.append(make('span', '', String(sc)));
          tr.append(td);
        });
        tr.append(make('td', 'gh-tot', r.t.played > 0 ? String(r.t.strokes) : ''));
        if (race) tr.append(make('td', 'gh-time', timeLabel(r.g.race?.finishedS ?? null)));
        body.append(tr);
      }
      el.append(body);
    });
  }

  function updateOnlineCard(o: OnlineView, isFinal: boolean): void {
    cardKey = '';
    if (tableMode !== 'online') {
      tableMode = 'online';
      slot(table).html = undefined;
      slot(table).key = undefined;
    }
    renderOnlineTable(o, isFinal);
    const t = roundTotals(state);
    setText(cardHead, isFinal ? 'Final scores' : 'Scorecard');
    setText(foot, isFinal ? '' : `Round so far: ${toParLabel(t.toPar)}`);
    const id = isFinal ? 'gh-again' : 'gh-next';
    if (cardBtn.id !== id) cardBtn.id = id;
    const can = online.canNext();
    setText(cardBtn, !can ? 'WAITING FOR HOST' : isFinal ? 'BACK TO LOBBY' : 'NEXT HOLE');
    if (cardBtn.disabled !== !can) cardBtn.disabled = !can;
  }

  function updateCard(isFinal: boolean): void {
    const o = state.online;
    if (o !== null && o.started) {
      updateOnlineCard(o, isFinal);
      return;
    }
    if (tableMode !== 'solo') {
      tableMode = 'solo';
      slot(table).html = undefined;
      slot(table).key = undefined;
      cardKey = '';
    }
    if (cardBtn.disabled) cardBtn.disabled = false;
    const t = roundTotals(state);
    const key = `${state.phase}|${state.scores.join(',')}`;
    if (key === cardKey) return;
    cardKey = key;

    let head = '<tr><th>Hole</th>';
    let parRow = '<tr><th>Par</th>';
    let scRow = '<tr><th>Score</th>';
    let parTot = 0;
    HOLES.forEach((h, i) => {
      head += `<th>${i + 1}</th>`;
      parRow += `<td>${h.par}</td>`;
      parTot += h.par;
      const sc = state.scores[i];
      if (sc === null) {
        scRow += '<td></td>';
        return;
      }
      const d = sc - h.par;
      const cls = d < 0 ? 'gh-under' : d > 0 ? 'gh-over' : '';
      scRow += `<td class="${cls}"><span>${sc}</span></td>`;
    });
    head += '<th class="gh-tot">TOT</th></tr>';
    parRow += `<td class="gh-tot">${parTot}</td></tr>`;
    scRow += `<td class="gh-tot">${t.played > 0 ? t.strokes : ''}</td></tr>`;
    setHtml(table, `<tbody>${head}${parRow}${scRow}</tbody>`);

    setText(cardHead, isFinal ? `Round complete: ${t.strokes} (${toParLabel(t.toPar)})` : 'Scorecard');
    setText(foot, isFinal ? '' : `Round so far: ${toParLabel(t.toPar)}`);
    const id = isFinal ? 'gh-again' : 'gh-next';
    if (cardBtn.id !== id) cardBtn.id = id;
    setText(cardBtn, isFinal ? 'PLAY AGAIN' : 'NEXT HOLE');
  }

  function updateBanner(): void {
    const p = state.phase;
    const hole = HOLES[state.holeIndex];
    let html = '';
    let cls = '';
    if (p === 'intro') {
      html = `<div class="gh-big">Hole ${state.holeIndex + 1}</div>`
        + `<div class="gh-mid">Par ${hole.par} &middot; ${Math.round(holeLength(hole))} yd</div>`
        + '<div class="gh-tiny">Tap to skip</div>';
      cls = 'gh-on';
    } else if (p === 'result') {
      html = `<div class="gh-big">${state.banner}</div>`;
      cls = 'gh-on';
    } else if (p === 'holed') {
      const gold = state.strokes - hole.par <= -1;
      html = `<div class="gh-xl">${state.banner}</div>`;
      cls = gold ? 'gh-on gh-gold' : 'gh-on';
    }
    // Keep the last text while fading out, so the pill does not empty before it hides.
    if (cls !== '') setHtml(banner, html);
    setClass(banner, cls);
  }

  /** Online during play: whose turn it is (together), or the race leaderboard. Hidden in solo and on the cards. */
  function updateOnline(inCard: boolean): void {
    const o = state.online;
    const playing = o !== null && o.started && !inCard && state.phase !== 'title';
    if (o === null || !playing) {
      setShown(turnEl, false);
      setShown(boardEl, false);
      return;
    }
    if (o.format === 'together') {
      setShown(boardEl, false);
      const turn = o.turn;
      const golfer = turn === null ? undefined : o.golfers.find((g) => g.id === turn);
      if (turn === null || golfer === undefined) {
        setShown(turnEl, false);
      } else if (turn === o.me) {
        setShown(turnEl, true);
        setClass(turnEl, 'gh-mine');
        rebuild(turnEl, 'me', (el) => { el.textContent = 'Your turn!'; });
      } else {
        setShown(turnEl, true);
        setClass(turnEl, '');
        rebuild(turnEl, `${golfer.id}|${golfer.name}|${golfer.color}`, (el) => {
          el.append('▶ ');
          const n = make('span', '', golfer.name);
          n.style.color = hex(golfer.color);
          el.append(n, ' is up');
        });
      }
      return;
    }
    setShown(turnEl, false);
    setShown(boardEl, true);
    const entries = rowsFor(o, true)
      .filter((r) => !r.g.left)
      .slice(0, 6)
      .map((r) => ({
        name: r.g.name,
        color: r.g.color,
        hole: r.g.id === o.me ? state.holeIndex : (r.g.race?.hole ?? 0),
        strokes: r.t.strokes,
        done: r.g.race?.finishedS != null,
      }));
    rebuild(boardEl, JSON.stringify(entries), (el) => {
      for (const e of entries) {
        const line = make('div', 'gh-brow');
        const n = make('span', 'gh-bname', e.name);
        n.style.color = hex(e.color);
        line.append(n, make('span', 'gh-bhole', `H${e.hole + 1}`), make('span', 'gh-bstr', String(e.strokes)), make('span', 'gh-bdone', e.done ? '✓' : ''));
        el.append(line);
      }
    });
  }

  return {
    update() {
      const p = state.phase;
      const inTitle = p === 'title';
      const inCard = p === 'card' || p === 'final';
      // lobby.ts adds gl-open to the body while its online panel or lobby is up.
      const panelOpen = document.body.classList.contains('gl-open');
      const hideTitle = state.online !== null || online.status === 'connecting' || panelOpen;

      setShown(title, inTitle && !hideTitle);
      setShown(startBtn, inTitle);
      setShown(discBtn, inTitle);
      setText(rideEl, state.ride === '350z' ? '2008 NISSAN 350Z UNLOCKED' : '');
      setShown(onlineBtn, inTitle && online.available);
      setShown(left, !inTitle);
      setShown(shot, !inTitle && !inCard);
      setShown(card, inCard);

      const hole = HOLES[state.holeIndex];
      // While the next stroke is being set up, show the stroke about to be played.
      const upcoming = p === 'intro' || p === 'aim' || p === 'swing' || p === 'drive';
      const totals = roundTotals(state);
      setText(holeEl, `Hole ${state.holeIndex + 1}`);
      setText(parEl, `Par ${hole.par} · ${Math.round(holeLength(hole))} yd`);
      setText(strokeEl, `${state.mode === 'disc' ? 'Throw' : 'Stroke'} ${upcoming ? state.strokes + 1 : state.strokes}`);
      setText(roundEl, `Round ${toParLabel(totals.toPar)} · ${totals.strokes} strokes`);

      setText(lieEl, LIES[state.lie].name);
      setText(pinEl, `To pin: ${fmtDistance(distanceToPin(state), state.lie)}`);
      setText(mphEl, `${Math.round(state.wind.mph)} mph`);
      // Arrow is 0 deg (up) when the wind blows toward the target. Right of the aim is clockwise on screen,
      // so the angle is aim minus wind.
      const deg = Math.round(((state.aimYaw - state.wind.yaw) * 180) / Math.PI);
      setTransform(arrowEl, `rotate(${deg}deg)`);

      updateOnline(inCard);
      updateBanner();
      if (inCard) updateCard(p === 'final');
    },
  };
}
