// The minigame report: a self-describing, hypermedia-style account of how a slice ended. Any screen (the party's
// results card, a game's #minigame page, a log) renders it without knowing the slice: every column says what it
// is and how to show it, and `links` says where a viewer can go from here.
//
// A slice fills only the part it knows (SliceReport, from def.report). buildReport adds the places, the winners,
// a default headline and the links, so a slice without report() still produces a useful MinigameReport.
import type { MinigameMeta, SeatIndex, SeatInfo } from './types';

/** How a stat's number is shown. 'int' 12, '1dp' 12.3, '2dp' 12.34, 'time' 1:02.3 (seconds), 'text' as is. */
export type StatFormat = 'int' | '1dp' | '2dp' | 'time' | 'text';

/** One column of the report: what a value means and how to show it. */
export interface ReportStat {
  /** Key into ReportRow.values. */
  key: string;
  /** Column header: 'Strokes', 'Pins', 'Distance'. */
  label: string;
  /** Suffix after the value: 'm', 'pts', 'yd'. */
  unit?: string;
  /** Default 'int' for numbers, 'text' for strings. */
  format?: StatFormat;
  /** Which way is better, so a screen can mark the best value. Omit for stats that are not ranked. */
  better?: 'higher' | 'lower';
}

/** A value: a number formatted by its stat, a string shown as is, or null for "none" (shown as a dash). */
export type StatValue = number | string | null;

/** What a slice reports from its final state (def.report). Plain JSON. */
export interface SliceReport {
  /** One line about the round: 'Gnelly holed out in 2!'. Default: '<winner> wins!'. */
  headline?: string;
  /** The columns, in display order. The first one is the main score. */
  stats: ReportStat[];
  /** values[seat][stat.key]. */
  values: Record<string, StatValue>[];
  /** notes[seat]: a short flavour line ('Fell in the pond', 'Strike!'), or null. */
  notes?: (string | null)[];
}

export interface ReportRow {
  seat: SeatIndex;
  name: string;
  color: number;
  /** 0 = 1st, ties share. */
  place: number;
  values: Record<string, StatValue>;
  note: string | null;
}

/** A hypermedia control: rel says what it is, href where it goes. Relative hrefs resolve against the site root's
 *  game folders (gnome-party is served at ../gnome-party/, a game at ../<game>/). */
export interface ReportLink {
  /** 'game' (the full game this slice comes from), 'practice' (play this slice alone vs 3 CPUs). */
  rel: 'game' | 'practice' | (string & {});
  href: string;
  title: string;
  /** The game folder the link leads to, so a screen can drop links to games that are not deployed. */
  game?: string;
}

/** Who won and how: the winner, the stat that decided it and the margin over the runner-up. */
export interface WinInfo {
  /** The winning seats (two or more = a tie for 1st) and their names. */
  seats: SeatIndex[];
  names: string[];
  /** The ranked stat that separates the winner from the runner-up (the first one that does), or null. */
  decidedBy: { key: string; label: string; value: StatValue; text: string } | null;
  /** The best seat behind the winner(s), with its value on decidedBy and how far behind it was. */
  runnerUp: { seat: SeatIndex; name: string; value: StatValue; text: string } | null;
  /** The gap on decidedBy ('2.4s', '3 pins'), or null when the runner-up has no value or it is a tie. */
  margin: string | null;
  /** One sentence: 'Time 11.1s, 2.4s ahead of Gnorbert (13.5s).' Empty when the slice reports no ranked stats. */
  how: string;
}

export interface MinigameReport {
  /** Media type of this object, for anyone reading it cold. */
  kind: 'lawn.minigame-report/v1';
  minigame: { id: string; title: string; game: string; goal: string };
  /** The seats in place 0. Two or more means a tie for 1st. */
  winners: SeatIndex[];
  headline: string;
  /** Who won and how, worked out from the places and the ranked stats. */
  win: WinInfo;
  /** Ended at the time cap rather than by play. */
  timeUp: boolean;
  stats: ReportStat[];
  /** Sorted by place (then seat). */
  rows: ReportRow[];
  links: ReportLink[];
}

export const REPORT_KIND = 'lawn.minigame-report/v1' as const;

/** The single winning seat from places, or null on a tie for 1st: for a slice's headline. */
export function soleWinner(places: readonly number[]): SeatIndex | null {
  const firsts = places.map((p, k) => (p === 0 ? k : -1)).filter((k) => k >= 0);
  return firsts.length === 1 ? (firsts[0] as SeatIndex) : null;
}

/** Who won and how. The deciding stat is the first ranked stat on which the winner has a number that differs from
 *  the runner-up's (so golf with nobody holed is decided by distance to the pin, a race nobody finished by laps). */
function winInfo(rows: readonly ReportRow[], stats: readonly ReportStat[], winners: SeatIndex[]): WinInfo {
  const top = rows.filter((r) => winners.includes(r.seat));
  const names = top.map((r) => r.name);
  const lead = top[0];
  const second = rows.find((r) => !winners.includes(r.seat)) ?? null;
  const none: WinInfo = { seats: winners, names, decidedBy: null, runnerUp: null, margin: null, how: '' };
  if (!lead) return none;
  const ranked = stats.filter((st) => st.better);
  const num = (v: StatValue | undefined): v is number => typeof v === 'number' && Number.isFinite(v);

  // A tie for 1st: say what they tied on.
  if (top.length > 1) {
    const st = ranked.find((x) => num(lead.values[x.key]));
    if (!st) return none;
    const text = formatStat(st, lead.values[st.key]);
    return { ...none, decidedBy: { key: st.key, label: st.label, value: lead.values[st.key], text }, how: `Tied on ${st.label.toLowerCase()}: ${text}.` };
  }

  const st =
    ranked.find((x) => num(lead.values[x.key]) && (!second || second.values[x.key] !== lead.values[x.key])) ??
    ranked.find((x) => num(lead.values[x.key]));
  if (!st) return none;
  const wv = lead.values[st.key] as number;
  const wText = formatStat(st, wv);
  const decidedBy = { key: st.key, label: st.label, value: wv, text: wText };
  if (!second) return { ...none, decidedBy, how: `${st.label} ${wText}.` };
  const rv = second.values[st.key] ?? null;
  const rText = formatStat(st, rv);
  const runnerUp = { seat: second.seat, name: second.name, value: rv, text: rText };
  if (!num(rv)) {
    return { ...none, decidedBy, runnerUp, how: `${st.label} ${wText}; nobody else posted one.` };
  }
  if (rv === wv) {
    return { ...none, decidedBy, runnerUp, how: `${st.label} ${wText}, level with ${second.name} but ahead on the tiebreak.` };
  }
  // The gap, shown like the stat itself ('2.4s', '3 pins', '1.25 m').
  const gap = Math.abs(wv - rv);
  const margin = st.format === 'time' ? `${gap.toFixed(1)}s` : formatStat(st, gap);
  const word = st.better === 'lower' ? (st.format === 'time' ? 'ahead of' : 'better than') : 'more than';
  return { ...none, decidedBy, runnerUp, margin, how: `${st.label} ${wText}, ${margin} ${word} ${second.name} (${rText}).` };
}

/** Joins winner names: 'Pip', 'Pip and Gnash', 'Pip, Gnash and Gnina'. */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** The full report from the places and (if the slice has one) its SliceReport. Pure; never throws on odd input. */
export function buildReport(
  meta: MinigameMeta,
  seats: readonly SeatInfo[],
  places: readonly number[],
  timeUp: boolean,
  slice?: SliceReport | null,
): MinigameReport {
  const placeOf = (seat: number): number => places[seat] ?? seats.length;
  const rows: ReportRow[] = seats
    .map((s) => ({
      seat: s.seat,
      name: s.name,
      color: s.color,
      place: placeOf(s.seat),
      values: { ...(slice?.values?.[s.seat] ?? {}) },
      note: slice?.notes?.[s.seat] ?? null,
    }))
    .sort((a, b) => a.place - b.place || a.seat - b.seat);
  const best = rows.length > 0 ? rows[0].place : 0;
  const winners = rows.filter((r) => r.place === best).map((r) => r.seat);
  const stats = slice?.stats ? slice.stats.map((x) => ({ ...x })) : [];
  return {
    kind: REPORT_KIND,
    minigame: { id: meta.id, title: meta.title, game: meta.game, goal: meta.goal },
    winners,
    headline: slice?.headline || winnerLine({ winners, rows }),
    win: winInfo(rows, stats, winners),
    timeUp,
    stats,
    rows,
    links: [
      { rel: 'game', href: `../${meta.game}/`, title: `Play the full ${meta.game}`, game: meta.game },
      { rel: 'practice', href: `../${meta.game}/#minigame=${meta.id}`, title: `Practise ${meta.title}`, game: meta.game },
    ],
  };
}

/** 'Pip wins!', 'Pip and Gnash tie for 1st!' or 'No winner': the line every screen shows big. */
export function winnerLine(report: Pick<MinigameReport, 'winners' | 'rows'>): string {
  const names = report.rows.filter((r) => report.winners.includes(r.seat)).map((r) => r.name);
  if (names.length === 0) return 'No winner';
  return names.length === 1 ? `${names[0]} wins!` : `${joinNames(names)} tie for 1st!`;
}

/** A value as text, by its stat: '12 pts', '1:02.3', '—'. */
export function formatStat(stat: ReportStat, v: StatValue | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'string') return stat.unit ? `${v} ${stat.unit}` : v;
  if (!Number.isFinite(v)) return '—';
  let t: string;
  switch (stat.format) {
    case '1dp':
      t = v.toFixed(1);
      break;
    case '2dp':
      t = v.toFixed(2);
      break;
    case 'time': {
      const m = Math.floor(v / 60);
      const sec = v - m * 60;
      t = m > 0 ? `${m}:${sec.toFixed(1).padStart(4, '0')}` : `${sec.toFixed(1)}s`;
      break;
    }
    case 'text':
      t = String(v);
      break;
    default:
      t = String(Math.round(v));
  }
  return stat.unit && stat.format !== 'time' ? `${t} ${stat.unit}` : t;
}

/** The seats holding the best value of a ranked stat (for a highlight), or [] when it is not ranked or all equal. */
export function bestSeats(report: Pick<MinigameReport, 'rows'>, stat: ReportStat): SeatIndex[] {
  if (!stat.better) return [];
  const nums = report.rows
    .map((r) => ({ seat: r.seat, v: r.values[stat.key] }))
    .filter((x): x is { seat: SeatIndex; v: number } => typeof x.v === 'number' && Number.isFinite(x.v));
  if (nums.length < 2) return [];
  const pick = stat.better === 'higher' ? Math.max(...nums.map((x) => x.v)) : Math.min(...nums.map((x) => x.v));
  const best = nums.filter((x) => x.v === pick);
  return best.length === nums.length ? [] : best.map((x) => x.seat);
}

/** Problems with a slice's report (empty = fine): for the testkit. */
export function checkSliceReport(r: SliceReport, seatCount: number): string[] {
  const errs: string[] = [];
  const keys = new Set<string>();
  for (const st of r.stats) {
    if (!st.key || !st.label) errs.push(`stat needs key and label: ${JSON.stringify(st)}`);
    if (keys.has(st.key)) errs.push(`duplicate stat key ${st.key}`);
    keys.add(st.key);
  }
  if (r.values.length !== seatCount) errs.push(`values has ${r.values.length} rows, expected ${seatCount}`);
  r.values.forEach((row, seat) => {
    for (const k of Object.keys(row)) if (!keys.has(k)) errs.push(`seat ${seat}: value ${k} has no stat`);
  });
  if (r.notes && r.notes.length !== seatCount) errs.push(`notes has ${r.notes.length} rows, expected ${seatCount}`);
  if (r.headline !== undefined && (typeof r.headline !== 'string' || r.headline.length > 60)) errs.push(`headline must be a string of at most 60 chars: ${r.headline}`);
  if (JSON.stringify(r).length > 2048) errs.push('report is over 2 KB');
  return errs;
}
