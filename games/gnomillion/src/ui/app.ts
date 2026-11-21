// Once in a Gnomillion UI: one container appended to #ui, re-rendered on session changes.
// Screen = home | connecting | round | results | final | lobby, picked from the session's room (see screenBody).
import { KEY_ME, KEY_PENDING, MAX_ANSWER_LEN, DEFAULT_WINDOW_MS } from '../config';
import type { PendingAnswer, PublicRoom } from '../net/protocol';
import { hostRoom, joinRoom, resumeLastRoom, type Session } from '../net/session';
import { connectingHtml, finalHtml, fmtCountdown, homeHtml, lobbyHtml, resultsHtml, roundHtml } from './screens';
import { injectStyle } from './style';
import { onAnswered, onGameWon, onRoundClosed } from '../achievements';

interface State {
  session: Session | null;
  /** A saved room found on load (resumeLastRoom); joined only when the player presses Resume. */
  resumable: Session | null;
  /** Text-field values by data-field name. Kept here so re-renders do not lose what was typed. */
  fields: Record<string, string>;
  windowMs: number;
  busy: boolean;
  error: string;
  notice: string;
  /** My submitted answers this session, keyed `CODE:round`. */
  answers: Record<string, string>;
}

const state: State = {
  session: null, resumable: null, fields: {}, windowMs: DEFAULT_WINDOW_MS, busy: false, error: '', notice: '', answers: {},
};
let root: HTMLElement;

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function savedName(): string {
  try {
    const me = JSON.parse(localStorage.getItem(KEY_ME) ?? 'null') as { name?: unknown } | null;
    return typeof me?.name === 'string' ? me.name : '';
  } catch { return ''; }
}

/** My answer for a round: what I submitted here, else a pending answer still queued on this device. */
function myAnswerFor(code: string, pid: string, n: number): string | null {
  const local = state.answers[`${code}:${n}`];
  if (local !== undefined) return local;
  try {
    const list = JSON.parse(localStorage.getItem(KEY_PENDING) ?? '[]') as PendingAnswer[];
    const p = list.find((x) => x.code === code && x.pid === pid && x.round === n);
    return p ? p.text : null;
  } catch { return null; }
}

function inviteLink(code: string): string {
  return `${location.origin}${location.pathname}?room=${code}`;
}

function screenBody(): string {
  const s = state.session;
  if (!s) {
    return homeHtml({
      name: state.fields.name ?? '', code: state.fields.code ?? '', windowMs: state.windowMs, busy: state.busy, error: state.error,
      resumeCode: state.resumable ? state.resumable.code : null,
    });
  }
  const room: PublicRoom | undefined = s.room;
  if (!room) return connectingHtml();
  if (room.current) {
    const n = room.current.n;
    if (state.fields.__round !== String(n)) {
      delete state.fields.answer;   // a new round starts with an empty draft
      state.fields.__round = String(n);
    }
    const myAnswer = myAnswerFor(s.code, s.me.pid, n);
    return roundHtml(s, room, { draft: state.fields.answer ?? myAnswer ?? '', myAnswer });
  }
  if (room.history.length >= room.totalRounds) return finalHtml(s, room);
  if (room.history.length > 0) return resultsHtml(s, room);
  return lobbyHtml(s, room, inviteLink(room.code), state.notice);
}

function render(): void {
  const active = document.activeElement as HTMLInputElement | null;
  const field = active && root.contains(active) ? active.dataset.field ?? null : null;
  const caret = field ? active?.selectionStart ?? null : null;
  root.innerHTML = screenBody();
  if (field) {
    const el = root.querySelector<HTMLInputElement>(`[data-field="${field}"]`);
    if (el) {
      el.focus();
      if (caret !== null) el.setSelectionRange(caret, caret);
    }
  }
  tickClocks();
}

/** Updates the countdowns in place once a second, without rebuilding the screen. */
function tickClocks(): void {
  root?.querySelectorAll<HTMLElement>('[data-closes]').forEach((el) => {
    const left = Number(el.dataset.closes) - Date.now();
    el.textContent = left <= 0 ? "time's up" : fmtCountdown(left);
  });
}

function attach(s: Session): void {
  dropResumable();
  state.session = s;
  state.error = '';
  state.notice = '';
  let seen = s.room?.history.length ?? 0;
  s.onChange(() => {
    const room = s.room;
    if (room && room.history.length > seen) {
      const last = room.history[room.history.length - 1];
      const mine = last.buckets.find((b) => b.pids.includes(s.me.pid));
      void onRoundClosed(mine ? mine.tier : null);
      if (room.history.length >= room.totalRounds) void onGameWon();
    }
    seen = room?.history.length ?? seen;
    render();
  });
}

function dropResumable(): void {
  if (state.resumable) state.resumable.leave();
  state.resumable = null;
}

async function run(job: () => Promise<void>): Promise<void> {
  state.busy = true;
  state.error = '';
  render();
  try {
    await job();
  } catch (e) {
    state.error = errMsg(e);
  } finally {
    state.busy = false;
    render();
  }
}

function nameFromFields(): string {
  return (state.fields.name ?? '').trim().slice(0, 20) || 'Gnome';
}

const actions: Record<string, (el: HTMLElement) => void> = {
  pick(el) {
    state.windowMs = Number(el.dataset.ms);
    render();
  },
  host() {
    void run(async () => { const s = await hostRoom(nameFromFields(), state.windowMs); attach(s); });
  },
  join() {
    const code = (state.fields.code ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9]{5}$/.test(code)) { state.error = 'Room codes are 5 letters or digits.'; render(); return; }
    void run(async () => { const s = await joinRoom(code, nameFromFields()); attach(s); });
  },
  resume() {
    const s = state.resumable;
    if (!s) return;
    state.resumable = null;
    attach(s);
    render();
  },
  copy() {
    const s = state.session;
    if (!s) return;
    const link = inviteLink(s.code);
    const done = () => { state.notice = 'Invite link copied.'; render(); };
    const fail = () => { state.notice = `Copy this link: ${link}`; render(); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link).then(done, fail);
    else fail();
  },
  start() { state.session?.nextRound(); },
  next() { state.session?.nextRound(); },
  leave() {
    state.session?.leave();
    state.session = null;
    state.error = '';
    state.notice = '';
    render();
  },
};

function submitAnswer(): void {
  const s = state.session;
  if (!s || !s.room?.current) return;
  const text = (state.fields.answer ?? '').trim().slice(0, MAX_ANSWER_LEN);
  if (!text) { state.error = 'Write an answer first.'; render(); return; }
  s.answer(text);
  void onAnswered();
  state.answers[`${s.code}:${s.room.current.n}`] = text;
  state.fields.answer = text;
  state.error = '';
  render();
}

/** Mounts the app into #ui. Call once from main.ts. */
export function mountApp(ui: HTMLElement): void {
  injectStyle();
  root = document.createElement('div');
  root.className = 'gm';
  ui.appendChild(root);

  state.fields.name = savedName();
  const fromLink = new URLSearchParams(location.search).get('room');
  if (fromLink) state.fields.code = fromLink.toUpperCase().slice(0, 5);

  root.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el || el.hasAttribute('disabled')) return;
    actions[el.dataset.act ?? '']?.(el);
  });
  root.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.field) state.fields[el.dataset.field] = el.value;
  });
  root.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement;
    if (form.dataset.form !== 'answer') return;
    e.preventDefault();
    submitAnswer();
  });
  setInterval(tickClocks, 1000);

  render();
  resumeLastRoom().then((s) => {
    if (!s) return;
    if (state.session) { s.leave(); return; }   // the player already entered a room
    state.resumable = s;
    render();
  }, () => { /* nothing to resume */ });
}
