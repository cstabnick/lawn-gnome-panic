// Pure deterministic pull-tab ticket engine (no DOM, no THREE, no Math.random).
import { getPullTabSpec } from './catalog';
import type { PullTabRow, PullTabSpec, PullTabState, PullTabThemeId } from './types';

function nextRand(st: PullTabState): number {
  st.seed = (st.seed + 0x6d2b79f5) >>> 0;
  let t = Math.imul(st.seed ^ (st.seed >>> 15), 1 | st.seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pickSymbol(st: PullTabState, spec: PullTabSpec): string {
  const total = spec.symbols.reduce((sum, s) => sum + s.weight, 0);
  let r = nextRand(st) * total;
  for (const sym of spec.symbols) {
    r -= sym.weight;
    if (r <= 0) return sym.id;
  }
  return spec.symbols[spec.symbols.length - 1].id;
}

function makeRow(st: PullTabState, spec: PullTabSpec): PullTabRow {
  const symbols: [string, string, string] = [
    pickSymbol(st, spec),
    pickSymbol(st, spec),
    pickSymbol(st, spec),
  ];
  const allMatch = symbols[0] === symbols[1] && symbols[1] === symbols[2];
  const rule = allMatch ? spec.payouts.find((p) => p.symbolId === symbols[0]) : undefined;
  return {
    symbols,
    pulled: false,
    win: rule ? rule.payout : 0,
    winLabel: rule ? rule.label : '',
    jackpot: Boolean(rule?.jackpot),
  };
}

export function newPullTabState(seed: number, themeId: PullTabThemeId = 'trollin-gnomes'): PullTabState {
  return {
    themeId,
    seed: seed >>> 0,
    ticketId: 1000,
    rows: null,
    totalWin: 0,
    ticketsBought: 0,
    totalWon: 0,
  };
}

export function ticketFinished(st: PullTabState): boolean {
  return st.rows === null || st.rows.every((r) => r.pulled);
}

export function setPullTabTheme(st: PullTabState, themeId: PullTabThemeId): boolean {
  if (!ticketFinished(st)) return false;
  st.themeId = themeId;
  st.rows = null;
  st.totalWin = 0;
  return true;
}

export function buyTicket(st: PullTabState, chips: number): { ok: boolean; cost: number } {
  if (!ticketFinished(st)) return { ok: false, cost: 0 };
  const spec = getPullTabSpec(st.themeId);
  if (chips < spec.cost) return { ok: false, cost: 0 };

  st.ticketId += 1;
  st.ticketsBought += 1;
  st.totalWin = 0;
  st.rows = [makeRow(st, spec), makeRow(st, spec), makeRow(st, spec)];
  return { ok: true, cost: spec.cost };
}

export function pullTab(
  st: PullTabState,
  index: 0 | 1 | 2,
): { ok: boolean; win: number; label: string; jackpot: boolean; allPulled: boolean } {
  if (!st.rows) return { ok: false, win: 0, label: '', jackpot: false, allPulled: false };
  const row = st.rows[index];
  if (row.pulled) return { ok: false, win: 0, label: '', jackpot: false, allPulled: ticketFinished(st) };

  row.pulled = true;
  if (row.win > 0) {
    st.totalWin += row.win;
    st.totalWon += row.win;
  }
  return {
    ok: true,
    win: row.win,
    label: row.winLabel,
    jackpot: row.jackpot,
    allPulled: ticketFinished(st),
  };
}

export function pullAllTabs(st: PullTabState): { totalNewWin: number; anyJackpot: boolean } {
  if (!st.rows) return { totalNewWin: 0, anyJackpot: false };
  let totalNewWin = 0;
  let anyJackpot = false;
  for (const idx of [0, 1, 2] as const) {
    const res = pullTab(st, idx);
    if (res.ok) {
      totalNewWin += res.win;
      if (res.jackpot) anyJackpot = true;
    }
  }
  return { totalNewWin, anyJackpot };
}
