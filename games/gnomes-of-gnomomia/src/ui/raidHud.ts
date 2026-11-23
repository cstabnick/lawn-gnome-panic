// Raid HUD: timer, boss HP, seats, Leave.
import { UI } from '../config';
import { abandonRaid, raidStatus, type RaidStatus } from '../raids';
import { raidHelperViews, type RaidHelperView } from '../raidHelpers';
import { maxHp, state } from '../state';
import type { RaidSeat } from '../raidTypes';

interface Bar { wrap: HTMLDivElement; fill: HTMLDivElement }

interface SeatRow {
  el: HTMLDivElement;
  nameEl: HTMLDivElement;
  rightEl: HTMLDivElement;
  bar: Bar;
  seat: RaidSeat;
}

let box: HTMLDivElement | null = null;
let titleEl: HTMLDivElement | null = null;
let statusEl: HTMLDivElement | null = null;
let bossLabelEl: HTMLDivElement | null = null;
let bossBar: Bar | null = null;
let seatsEl: HTMLDivElement | null = null;
let leaveBtn: HTMLButtonElement | null = null;
let rows: SeatRow[] = [];
let rowsKey = '';

/** Builds the hidden raid box and appends it to the UI root. */
export function createRaidHud(root: HTMLElement): void {
  box = document.createElement('div');
  Object.assign(box.style, {
    position: 'absolute',
    left: '8px',
    top: 'calc(env(safe-area-inset-top, 0px) + 36px)',
    width: 'min(240px, 46vw)',
    boxSizing: 'border-box',
    padding: '8px',
    background: UI.panelBg,
    border: `2px solid ${UI.border}`,
    color: UI.text,
    fontFamily: UI.font,
    fontSize: '12px',
    pointerEvents: 'none',
    display: 'none',
  });

  titleEl = document.createElement('div');
  Object.assign(titleEl.style, {
    color: UI.gold, fontSize: '13px', fontWeight: 'bold',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  });

  statusEl = document.createElement('div');
  Object.assign(statusEl.style, { marginTop: '2px', color: UI.textWhite });

  bossLabelEl = document.createElement('div');
  Object.assign(bossLabelEl.style, { marginTop: '6px', color: UI.textDim });

  bossBar = makeBar(UI.bad);

  seatsEl = document.createElement('div');
  Object.assign(seatsEl.style, { marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' });

  leaveBtn = document.createElement('button');
  leaveBtn.type = 'button';
  leaveBtn.textContent = 'Leave';
  Object.assign(leaveBtn.style, {
    display: 'none',
    width: '100%',
    minHeight: '44px',
    marginTop: '6px',
    boxSizing: 'border-box',
    background: UI.panelBgDark,
    border: `1px solid ${UI.borderLight}`,
    color: UI.text,
    fontFamily: UI.font,
    fontSize: '14px',
    cursor: 'pointer',
    pointerEvents: 'auto',
  });
  leaveBtn.addEventListener('click', () => abandonRaid());

  box.append(titleEl, statusEl, bossLabelEl, bossBar.wrap, seatsEl, leaveBtn);
  root.appendChild(box);
}

/** Updates the box from raidStatus(). Seat rows are rebuilt only when the seat list changes. */
export function updateRaidHud(_dt: number): void {
  if (!box || !titleEl || !statusEl || !bossLabelEl || !bossBar || !leaveBtn) return;
  const st = raidStatus();
  if (!st) {
    box.style.display = 'none';
    return;
  }
  box.style.display = 'block';
  // On a narrow screen the boss bar of hud.ts fills the top-centre, so the box sits lower.
  box.style.top = window.innerWidth < 700
    ? 'calc(env(safe-area-inset-top, 0px) + 70px)'
    : 'calc(env(safe-area-inset-top, 0px) + 36px)';

  titleEl.textContent = st.raid.name;
  statusEl.textContent = statusText(st);
  bossLabelEl.textContent = `Boss ${Math.ceil(st.bossHp)} / ${st.bossHpMax}`;
  bossBar.fill.style.width = `${pct(st.bossHp, st.bossHpMax)}%`;

  leaveBtn.style.display = st.phase === 'countdown' || st.phase === 'fight' ? 'block' : 'none';

  const key = st.seats.map((s) => `${s.kind}:${s.id}`).join('|');
  if (key !== rowsKey) rebuildRows(st.seats, key);

  const views = new Map<string, RaidHelperView>();
  for (const v of raidHelperViews()) views.set(v.seatId, v);
  for (const row of rows) updateRow(row, views);
}

function statusText(st: RaidStatus): string {
  switch (st.phase) {
    case 'countdown': return `Pull in ${Math.ceil(st.countdown)}`;
    case 'fight': return formatTime(st.elapsed);
    case 'won': return `Won in ${formatTime(st.elapsed)}`;
    case 'lost': return 'Lost';
  }
}

function rebuildRows(seats: readonly RaidSeat[], key: string): void {
  if (!seatsEl) return;
  rowsKey = key;
  seatsEl.replaceChildren();
  rows = seats.map((seat) => {
    const el = document.createElement('div');
    Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: '2px' });
    const head = document.createElement('div');
    Object.assign(head.style, { display: 'flex', justifyContent: 'space-between', gap: '6px' });
    const nameEl = document.createElement('div');
    Object.assign(nameEl.style, { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' });
    const rightEl = document.createElement('div');
    Object.assign(rightEl.style, { color: UI.textDim, whiteSpace: 'nowrap' });
    head.append(nameEl, rightEl);
    const bar = makeBar(UI.good);
    el.append(head, bar.wrap);
    seatsEl!.appendChild(el);
    return { el, nameEl, rightEl, bar, seat };
  });
}

function updateRow(row: SeatRow, views: Map<string, RaidHelperView>): void {
  const { seat, bar } = row;
  bar.wrap.style.display = 'block';
  row.el.style.opacity = '1';
  if (seat.kind === 'player') {
    const max = maxHp();
    row.nameEl.textContent = 'You';
    row.rightEl.textContent = `${Math.ceil(state.hp)} / ${max}`;
    bar.fill.style.width = `${pct(state.hp, max)}%`;
  } else if (seat.kind === 'party') {
    row.nameEl.textContent = seat.name;
    row.rightEl.textContent = '(party)';
    bar.wrap.style.display = 'none';
  } else {
    const v = views.get(seat.id);
    row.nameEl.textContent = seat.name;
    if (v?.down) {
      row.rightEl.textContent = 'down';
      row.el.style.opacity = '0.5';
      bar.fill.style.width = '0%';
    } else {
      row.rightEl.textContent = '';
      bar.fill.style.width = `${v ? pct(v.hp, v.hpMax) : 100}%`;
    }
  }
}

/** A 10 px bar (44 px touch targets are for buttons; bars are read-only). */
function makeBar(color: string): Bar {
  const wrap = document.createElement('div');
  Object.assign(wrap.style, {
    height: '10px', background: '#3a1010', border: `1px solid ${UI.borderLight}`, boxSizing: 'border-box',
  });
  const fill = document.createElement('div');
  Object.assign(fill.style, { height: '100%', width: '100%', background: color });
  wrap.appendChild(fill);
  return { wrap, fill };
}

function pct(v: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, v / max)) * 100;
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
