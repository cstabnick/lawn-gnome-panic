// Screen markup for Once in a Gnomillion. Each function returns an HTML string; app.ts owns state and events.
// Every value from another player goes through esc(). Buttons carry data-act, inputs carry data-field.
import { DEFAULT_WINDOW_MS, MAX_ANSWER_LEN, MAX_PLAYERS, WINDOW_CHOICES_MS } from '../config';
import { TIERS, type TierId } from '../engine';
import type { PublicRoom } from '../net/protocol';
import type { Session } from '../net/session';

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

const WINDOW_LABELS: Record<number, string> = { 600000: '10 min', 3600000: '1 hour', 28800000: '8 hours', 86400000: '1 day' };
export function windowLabel(ms: number): string {
  return WINDOW_LABELS[ms] ?? `${Math.round(ms / 60000)} min`;
}

/** One distinct colour per tier. */
export const TIER_COLOR: Record<TierId, string> = {
  plankton: '#7d8ca3', krill: '#4fc3a1', shrimp: '#f4a261', squid: '#e76f51', whale: '#5b8def', krillion: '#f5d142',
};
const TIER_ORDER = Object.keys(TIERS) as TierId[];

export interface Standing { pid: string; name: string; total: number; best: TierId | null }
/** Leaderboard over the closed rounds of a PublicRoom, best first (same rules as the engine's standings). */
export function standingsOf(room: PublicRoom): Standing[] {
  return room.players.map((p) => {
    let total = 0; let best: TierId | null = null;
    for (const h of room.history) for (const b of h.buckets) if (b.pids.includes(p.pid)) {
      total += b.points;
      if (best === null || TIER_ORDER.indexOf(b.tier) > TIER_ORDER.indexOf(best)) best = b.tier;
    }
    return { pid: p.pid, name: p.name, total, best };
  }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

export function fmtCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
}

export interface HomeView { name: string; code: string; windowMs: number; busy: boolean; error: string; resumeCode: string | null }
export function homeHtml(v: HomeView): string {
  const choices = WINDOW_CHOICES_MS.map((ms) =>
    `<button type="button" data-act="pick" data-ms="${ms}" aria-pressed="${ms === (v.windowMs || DEFAULT_WINDOW_MS)}">${windowLabel(ms)}</button>`).join('');
  return `<section class="card">
  <h1>Once in a Gnomillion</h1>
  <p class="sub">Everyone answers the same prompt. The rarer your answer, the more it scores. Rounds last minutes or a whole day.</p>
  <label><span>Your name</span><input data-field="name" maxlength="20" autocomplete="nickname" value="${esc(v.name)}"></label>
  ${v.resumeCode ? `<button type="button" class="wide alt" data-act="resume">Resume last game (${esc(v.resumeCode)})</button>` : ''}
  <h2>Host a game</h2>
  <p class="sub">Round length</p>
  <div class="choices">${choices}</div>
  <button type="button" class="wide" data-act="host" ${v.busy ? 'disabled' : ''}>Host a game</button>
  <h2>Join a game</h2>
  <label><span>Room code</span><input data-field="code" maxlength="5" autocapitalize="characters" autocomplete="off" spellcheck="false" value="${esc(v.code)}"></label>
  <button type="button" class="wide" data-act="join" ${v.busy ? 'disabled' : ''}>Join</button>
  ${v.error ? `<p class="error" role="alert">${esc(v.error)}</p>` : ''}
</section>`;
}

export function connectingHtml(): string {
  return `<section class="card"><h1>Connecting...</h1><p class="sub">Reaching the room.</p>
  <button type="button" class="alt" data-act="leave">Leave</button></section>`;
}

function offlineBanner(s: Session): string {
  return s.online ? '' : `<p class="banner">Offline: answers are saved and sent when the host is back.</p>`;
}

function playerList(room: PublicRoom, me: string, marks?: Set<string>): string {
  return room.players.map((p) => {
    const tags: string[] = [];
    if (p.pid === room.hostPid) tags.push('host');
    if (p.pid === me) tags.push('you');
    const mark = marks ? (marks.has(p.pid) ? '&#10003; ' : '&hellip; ') : '';
    return `<li><span>${mark}${esc(p.name)}</span><span class="tag">${tags.join(', ')}</span></li>`;
  }).join('');
}

export function lobbyHtml(s: Session, room: PublicRoom, inviteLink: string, notice: string): string {
  return `<section class="card">
  <p class="sub">Room code</p>
  <div class="code">${esc(room.code)}</div>
  <button type="button" class="wide" data-act="copy">Copy invite link</button>
  ${notice ? `<p class="notice" role="status">${esc(notice)}</p>` : ''}
  <p class="hint">Invite link: <span class="link">${esc(inviteLink)}</span></p>
  <h2>Players (${room.players.length}/${MAX_PLAYERS})</h2>
  <ul>${playerList(room, s.me.pid)}</ul>
  <p class="sub">Round length: ${esc(windowLabel(room.windowMs))}. ${room.totalRounds} rounds.</p>
  ${s.isHost
    ? `<button type="button" class="wide" data-act="start">Start the first round</button>`
    : `<p class="sub">Waiting for the host to start.</p>`}
  ${offlineBanner(s)}
  <button type="button" class="alt" data-act="leave">Leave</button>
</section>`;
}

export interface RoundCtx { draft: string; myAnswer: string | null }
export function roundHtml(s: Session, room: PublicRoom, ctx: RoundCtx): string {
  const r = room.current;
  if (!r) return '';
  const answered = new Set(r.answered);
  const mine = ctx.myAnswer !== null && ctx.myAnswer !== ''
    ? `Your answer: <b>${esc(ctx.myAnswer)}</b> (you can change it until time's up)`
    : `You haven't answered yet.`;
  return `${offlineBanner(s)}<section class="card">
  <p class="sub">Round ${r.n} of ${room.totalRounds}</p>
  <h1 class="prompt">${esc(r.prompt)}</h1>
  <form class="answer" data-form="answer">
    <input data-field="answer" maxlength="${MAX_ANSWER_LEN}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer" value="${esc(ctx.draft)}">
    <button type="submit">Submit</button>
  </form>
  <p>${mine}</p>
  <p class="sub">Closes in <span class="clock" data-closes="${r.closesAt}">${fmtCountdown(r.closesAt - Date.now())}</span></p>
  <h2>Answered (${answered.size}/${room.players.length})</h2>
  <ul>${playerList(room, s.me.pid, answered)}</ul>
</section>${recapHtml(s, room)}`;
}

/** The buckets and the 'no answer' line of the most recent closed round. */
function lastRoundBlocks(s: Session, room: PublicRoom): { buckets: string; missed: string } {
  const last = room.history[room.history.length - 1];
  if (!last) return { buckets: '', missed: '' };
  const names = new Map(room.players.map((p) => [p.pid, p.name]));
  const nameOf = (pid: string) => esc(names.get(pid) ?? '?');
  const buckets = last.buckets.length
    ? last.buckets.map((b) => {
      const mineRow = b.pids.includes(s.me.pid);
      return `<div class="bucket${mineRow ? ' mine' : ''}" style="border-left-color:${TIER_COLOR[b.tier]}">
        <div class="tier"><span style="color:${TIER_COLOR[b.tier]}">${esc(TIERS[b.tier].label)}</span><span>+${b.points}</span></div>
        <div class="ans">${esc(b.display)}</div>
        <div class="who">${b.pids.map(nameOf).join(', ')}${mineRow ? ' (you)' : ''}</div>
      </div>`;
    }).join('')
    : `<p class="sub">Nobody answered this one.</p>`;
  const missed = last.unanswered.length
    ? `<p class="sub">No answer: ${last.unanswered.map(nameOf).join(', ')}</p>` : '';
  return { buckets, missed };
}

/** Under an open round: how the previous round went (the next round opens right after one closes). */
function recapHtml(s: Session, room: PublicRoom): string {
  const last = room.history[room.history.length - 1];
  if (!last) return '';
  const { buckets, missed } = lastRoundBlocks(s, room);
  return `<section class="card"><p class="sub">Last round (${last.n}) results</p><h2 class="prompt">${esc(last.prompt)}</h2>${buckets}${missed}</section>`;
}

export function resultsHtml(s: Session, room: PublicRoom): string {
  const last = room.history[room.history.length - 1];
  if (!last) return '';
  const { buckets, missed } = lastRoundBlocks(s, room);
  const board = standingsOf(room).map((x, i) =>
    `<li><span>${i + 1}. ${esc(x.name)}${x.pid === s.me.pid ? ' (you)' : ''}</span><b>${x.total}</b></li>`).join('');
  const next = s.isHost
    ? `<button type="button" class="wide" data-act="next">Next round</button>`
    : `<p class="sub">Waiting for the host to start the next round.</p>`;
  return `${offlineBanner(s)}<section class="card">
  <p class="sub">Round ${last.n} of ${room.totalRounds} results</p>
  <h1 class="prompt">${esc(last.prompt)}</h1>
  ${buckets}
  ${missed}
  <h2>Leaderboard</h2>
  <ul>${board}</ul>
  ${next}
  <button type="button" class="alt" data-act="leave">Leave</button>
</section>`;
}

export function finalHtml(s: Session, room: PublicRoom): string {
  const board = standingsOf(room);
  const top = board[0];
  const tied = board.length > 1 && board[1].total === top?.total;
  const winner = !top ? '' : tied
    ? `<p class="prompt">A tie at ${top.total} points.</p>`
    : `<p class="prompt">${esc(top.name)} wins with ${top.total} points!</p>`;
  const rows = board.map((x, i) =>
    `<li><span>${i + 1}. ${esc(x.name)}${x.pid === s.me.pid ? ' (you)' : ''}</span><b>${x.total}</b></li>`).join('');
  return `${offlineBanner(s)}<section class="card">
  <p class="sub">Game over after ${room.totalRounds} rounds</p>
  <h1>Final standings</h1>
  ${winner}
  <ul>${rows}</ul>
  <button type="button" class="wide alt" data-act="leave">Back to start</button>
</section>`;
}
