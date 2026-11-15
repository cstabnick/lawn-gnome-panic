// Scoreboard, ROLL button, intro/results/final cards. DOM only: reads PartyState, never changes it.
// Everything lives in one "gp-hud" div appended to the given parent (#ui). Hidden during 'mini'.
import type { PartyState, Phase, Seat } from '../config';
import { REPORT_KIND, bestSeats, formatStat, winnerLine, type MinigameReport, type SeatIndex } from '@lawn/party';
import { isDeployedGame, minigameById } from '../minigames';

export interface Hud {
  /** A new PartyState arrived (or the same one again). */
  show(s: Readonly<PartyState>, mySeat: SeatIndex | null): void;
  /** Every frame: counts the phase's `left` down locally (from the last show) for the timers shown. */
  update(dt: number): void;
  /** Hides the whole HUD (leaving the party). The next show() makes it visible again and rebuilds. */
  hide(): void;
}

const ORDINALS = ['1st', '2nd', '3rd', '4th'];
const ordinal = (place: number): string => ORDINALS[place] ?? `${place + 1}th`;
const hex = (c: number): string => '#' + (c & 0xffffff).toString(16).padStart(6, '0');

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (text !== undefined) e.textContent = text;
  return e;
}

function setText(e: HTMLElement, t: string): void {
  if (e.textContent !== t) e.textContent = t;
}

function seatName(s: Readonly<PartyState>, seat: number): string {
  return s.seats.find((x) => x.seat === seat)?.name ?? `Seat ${seat + 1}`;
}

const TEXT = 'font-family:system-ui,sans-serif;color:#fff;text-shadow:0 1px 3px #000';
const CARD_CSS =
  `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:min(420px,90vw);` +
  `box-sizing:border-box;padding:20px 24px;border-radius:16px;background:rgba(18,22,18,.9);` +
  `text-align:center;display:none;${TEXT}`;
const ROW_CSS = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0;font-size:20px';

/** One seat as a row: colour swatch, name, optional YOU / CPU tags. */
function nameSpan(info: Seat | undefined, fallback: string, mySeat: SeatIndex | null): HTMLElement {
  const wrap = el('span', 'display:inline-flex;align-items:center;gap:8px;font-weight:700');
  const swatch = el('span', `display:inline-block;width:14px;height:14px;border-radius:3px;background:${info ? hex(info.color) : '#888'}`);
  wrap.appendChild(swatch);
  wrap.appendChild(el('span', '', info?.name ?? fallback));
  if (info && mySeat !== null && info.seat === mySeat) wrap.appendChild(el('span', 'font-size:12px;color:#ffd54f', 'YOU'));
  if (info?.cpu) wrap.appendChild(el('span', 'font-size:12px;opacity:.7', 'CPU'));
  return wrap;
}

export function createHud(parent: HTMLElement, h: { onRoll(): void; onBackToMenu(): void }): Hud {
  const root = el('div', `position:absolute;inset:0;pointer-events:none;${TEXT};font-weight:600;font-size:16px;user-select:none`);
  root.id = 'gp-hud';
  parent.appendChild(root);

  // Top block: round label above the scoreboard strip.
  const top = el('div', 'position:absolute;left:8px;right:8px;top:8px;text-align:center');
  const roundLabel = el('div', 'font-size:16px;opacity:.9;margin-bottom:4px;text-align:left');
  const strip = el('div', 'display:flex;flex-wrap:wrap;justify-content:center;gap:6px');
  top.append(roundLabel, strip);
  root.appendChild(top);

  // Roll area, bottom centre.
  const rollWrap = el('div', 'position:absolute;left:0;right:0;bottom:24px;text-align:center;display:none');
  const rollBtn = el(
    'button',
    'pointer-events:auto;min-height:72px;min-width:220px;padding:0 32px;font:800 32px system-ui,sans-serif;' +
      'border:0;border-radius:14px;background:#ffd54f;color:#222;cursor:pointer;touch-action:manipulation',
    'ROLL!',
  );
  rollBtn.id = 'gp-roll';
  rollBtn.type = 'button';
  rollBtn.tabIndex = -1;
  const autoEl = el('div', 'font-size:16px;margin-top:6px;min-height:1em');
  const waitEl = el('div', 'font-size:20px');
  rollWrap.append(rollBtn, autoEl, waitEl);
  root.appendChild(rollWrap);

  const intro = el('div', CARD_CSS);
  intro.id = 'gp-intro';
  const results = el('div', CARD_CSS);
  results.id = 'gp-results';
  const finalCard = el('div', CARD_CSS);
  finalCard.id = 'gp-final';
  root.append(intro, results, finalCard);

  let cur: Readonly<PartyState> | null = null;
  let me: SeatIndex | null = null;
  let left = 0;
  let lastKey = '';
  let rollSent = false;
  let startsEl: HTMLElement | null = null;

  const fire = (): void => {
    if (rollSent) return; // a click and a key press for the same roll send once
    rollSent = true;
    h.onRoll();
  };
  rollBtn.addEventListener('click', fire);

  const onKey = (e: KeyboardEvent): void => {
    if (!root.isConnected) {
      window.removeEventListener('keydown', onKey);
      return;
    }
    if ((e.key !== ' ' && e.key !== 'Enter') || e.repeat) return;
    if (!cur || cur.phase.p !== 'roll' || me === null || cur.phase.seat !== me) return;
    e.preventDefault();
    fire();
  };
  window.addEventListener('keydown', onKey);

  function renderScore(s: Readonly<PartyState>): void {
    roundLabel.textContent = `Round ${s.board.round} / ${s.board.rounds}`;
    const ordered = [...s.seats].sort((a, b) => a.seat - b.seat);
    const active = s.phase.p === 'roll' || s.phase.p === 'move' ? s.phase.seat : null;
    strip.replaceChildren(
      ...ordered.map((info) => {
        const pb = s.board.players[info.seat];
        const isActive = active === info.seat;
        const card = el(
          'div',
          `min-width:104px;box-sizing:border-box;padding:6px 10px;border-radius:10px;background:rgba(0,0,0,.6);` +
            `border:3px solid ${hex(info.color)};box-shadow:${isActive ? '0 0 0 3px #ffd54f' : 'none'}`,
        );
        const name = el('div', 'font-size:15px');
        name.appendChild(nameSpan(info, `Seat ${info.seat + 1}`, me));
        card.append(
          name,
          el('div', 'font-size:16px', `● ${pb?.coins ?? 0}`),
          el('div', 'font-size:16px', `★ ${pb?.stars ?? 0}`),
        );
        return card;
      }),
    );
  }

  function renderPhase(s: Readonly<PartyState>): void {
    const ph: Phase = s.phase;
    top.style.display = ph.p === 'mini' ? 'none' : '';
    rollWrap.style.display = ph.p === 'roll' ? '' : 'none';
    intro.style.display = ph.p === 'intro' ? '' : 'none';
    results.style.display = ph.p === 'results' ? '' : 'none';
    finalCard.style.display = ph.p === 'final' ? '' : 'none';
    startsEl = null;

    if (ph.p === 'roll') {
      const mine = me !== null && ph.seat === me;
      rollBtn.style.display = mine ? '' : 'none';
      waitEl.style.display = mine ? 'none' : '';
      waitEl.textContent = mine ? '' : `${seatName(s, ph.seat)} is rolling…`;
      autoEl.textContent = '';
    } else if (ph.p === 'intro') {
      buildIntro(ph.mini);
    } else if (ph.p === 'results') {
      buildResults(s, ph.mini, ph.places, ph.coins, ph.report);
    } else if (ph.p === 'final') {
      buildFinal(s, ph.order);
    }
  }

  function buildIntro(id: string): void {
    const m = minigameById(id);
    const kids: HTMLElement[] = [
      el('div', 'font-size:22px;letter-spacing:2px;color:#ffd54f;font-weight:800', 'MINIGAME!'),
      el('div', 'font-size:40px;font-weight:800;margin:6px 0', m?.meta.title ?? id),
    ];
    if (m) {
      kids.push(el('div', 'font-size:20px;margin-bottom:8px', m.meta.goal));
      kids.push(el('div', 'font-size:17px;opacity:.85', `Controls: ${m.meta.controls}`));
    }
    startsEl = el('div', 'font-size:20px;margin-top:12px;color:#ffd54f', `Starts in ${Math.max(0, Math.ceil(left))}`);
    kids.push(startsEl);
    intro.replaceChildren(...kids);
  }

  function buildResults(s: Readonly<PartyState>, mini: string, places: number[], coins: number[], report?: MinigameReport): void {
    if (report?.kind === REPORT_KIND) {
      buildReportCard(s, report, coins);
      return;
    }
    const placeOf = (seat: number): number => places[seat] ?? 99;
    const sorted = [...s.seats].sort((a, b) => placeOf(a.seat) - placeOf(b.seat) || a.seat - b.seat);
    const rows = sorted.map((info) => {
      const c = coins[info.seat] ?? 0;
      const row = el('div', ROW_CSS);
      row.append(
        el('span', 'width:56px;text-align:left;font-weight:800', ordinal(placeOf(info.seat))),
        nameSpan(info, `Seat ${info.seat + 1}`, me),
        el('span', 'font-weight:800;color:#ffd54f', `${c >= 0 ? '+' : ''}${c} ●`),
      );
      return row;
    });
    results.replaceChildren(
      el('div', 'font-size:22px;letter-spacing:2px;color:#ffd54f;font-weight:800', 'RESULTS'),
      el('div', 'font-size:18px;opacity:.85;margin:4px 0 10px', minigameById(mini)?.meta.title ?? mini),
      ...rows,
    );
  }

  /** The results card from a MinigameReport: who won big, the slice's headline, then a row per seat with its
   *  place, name (and note), every stat the report describes (best value highlighted) and the coins won. */
  function buildReportCard(s: Readonly<PartyState>, r: MinigameReport, coins: number[]): void {
    const winnerInfo = r.winners.length === 1 ? s.seats.find((x) => x.seat === r.winners[0]) : undefined;
    const big = winnerLine(r);
    const kids: HTMLElement[] = [
      el('div', 'font-size:22px;letter-spacing:2px;color:#ffd54f;font-weight:800', 'RESULTS'),
      el('div', 'font-size:18px;opacity:.85;margin-top:4px', r.minigame.title + (r.timeUp ? ' · time up' : '')),
      el(
        'div',
        `font-size:min(9vw,34px);font-weight:800;margin:6px 0 2px;color:${winnerInfo ? hex(winnerInfo.color) : '#fff'}`,
        `🏆 ${big.toUpperCase()}`,
      ),
    ];
    if (r.headline && r.headline !== big) kids.push(el('div', 'font-size:18px;margin-bottom:6px', r.headline));

    // At most 3 stat columns keep the card readable on a phone; the first stat is the main score.
    const stats = r.stats.slice(0, 3);
    const best = new Map(stats.map((st) => [st.key, new Set(bestSeats(r, st))]));
    const table = el('table', 'width:100%;border-collapse:collapse;margin-top:8px;font-size:17px');
    if (stats.length > 0) {
      const head = el('tr', 'font-size:13px;opacity:.75;text-transform:uppercase;letter-spacing:1px');
      head.append(el('th', ''), el('th', ''), ...stats.map((st) => el('th', 'padding:0 6px;text-align:right', st.label)), el('th', ''));
      table.appendChild(head);
    }
    for (const row of r.rows) {
      const info = s.seats.find((x) => x.seat === row.seat);
      const c = coins[row.seat] ?? 0;
      const tr = el('tr', r.winners.includes(row.seat) ? 'background:rgba(255,213,79,.12)' : '');
      const who = el('td', 'text-align:left;padding:4px 6px');
      who.appendChild(nameSpan(info, row.name, me));
      if (row.note) who.appendChild(el('div', 'font-size:13px;font-style:italic;opacity:.8;font-weight:400', row.note));
      tr.append(
        el('td', 'width:44px;text-align:left;font-weight:800;padding:4px 0', ordinal(row.place)),
        who,
        ...stats.map((st) =>
          el(
            'td',
            `text-align:right;padding:4px 6px;white-space:nowrap;${best.get(st.key)?.has(row.seat) ? 'color:#ffd54f;font-weight:800' : ''}`,
            formatStat(st, row.values[st.key]),
          ),
        ),
        el('td', 'text-align:right;font-weight:800;color:#ffd54f;white-space:nowrap', `${c >= 0 ? '+' : ''}${c} ●`),
      );
      table.appendChild(tr);
    }
    kids.push(table);

    // Hypermedia: the report says where a player can go from here; skip games the site does not deploy.
    const links = r.links.filter((l) => !l.game || isDeployedGame(l.game));
    if (links.length > 0) {
      const bar = el('div', 'margin-top:10px;font-size:14px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap');
      for (const l of links) {
        const a = el('a', 'pointer-events:auto;color:#9fd8ff', l.title);
        a.href = l.href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.dataset.rel = l.rel;
        bar.appendChild(a);
      }
      kids.push(bar);
    }
    results.replaceChildren(...kids);
  }

  function buildFinal(s: Readonly<PartyState>, order: SeatIndex[]): void {
    const winner = order[0];
    const winnerInfo = s.seats.find((x) => x.seat === winner);
    const big = el(
      'div',
      `font-size:36px;font-weight:800;margin:8px 0 12px;color:${winnerInfo ? hex(winnerInfo.color) : '#fff'}`,
      winner === undefined ? 'NO WINNER' : `${seatName(s, winner)} WINS!`,
    );
    const rows = order.map((seat, i) => {
      const pb = s.board.players[seat];
      const row = el('div', ROW_CSS);
      row.append(
        el('span', 'width:56px;text-align:left;font-weight:800', ordinal(i)),
        nameSpan(s.seats.find((x) => x.seat === seat), `Seat ${seat + 1}`, me),
        el('span', 'font-size:18px', `★ ${pb?.stars ?? 0}   ● ${pb?.coins ?? 0}`),
      );
      return row;
    });
    const back = el(
      'button',
      'pointer-events:auto;margin-top:16px;min-height:56px;padding:0 28px;font:800 22px system-ui,sans-serif;' +
        'border:0;border-radius:12px;background:#ffd54f;color:#222;cursor:pointer;touch-action:manipulation',
      'BACK TO MENU',
    );
    back.id = 'gp-back-menu';
    back.type = 'button';
    back.addEventListener('click', () => h.onBackToMenu());
    finalCard.replaceChildren(
      el('div', 'font-size:22px;letter-spacing:2px;color:#ffd54f;font-weight:800', 'FINAL'),
      big,
      ...rows,
      back,
    );
  }

  return {
    show(s, mySeat) {
      root.style.display = '';
      // seed is in the key so a new party (v starts again at 1) is not mistaken for the old one.
      const key = `${s.seed}|${s.v}|${s.phase.p}|${mySeat ?? 'x'}`;
      if (key === lastKey) return; // same state again: no DOM work, no countdown reset
      lastKey = key;
      cur = s;
      me = mySeat;
      left = 'left' in s.phase ? s.phase.left : 0;
      rollSent = false;
      renderScore(s);
      renderPhase(s);
    },
    hide() {
      root.style.display = 'none';
      lastKey = ''; // the next show() rebuilds, even if it is the same state
    },
    update(dt) {
      if (!cur) return;
      left = Math.max(0, left - dt);
      const ph = cur.phase;
      if (ph.p === 'roll') setText(autoEl, left < 5 ? `auto in ${Math.ceil(left)}s` : '');
      if (ph.p === 'intro' && startsEl) setText(startsEl, `Starts in ${Math.ceil(left)}`);
    },
  };
}
