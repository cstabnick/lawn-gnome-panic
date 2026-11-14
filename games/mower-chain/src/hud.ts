// DOM heads-up display. Appends its own container to #ui (never restyles #ui itself).
import type { MowerSnap, Snapshot, WorldEvent } from './config';
import type { Session, SessionStatus } from './online';

const FEED_LINES = 5;
const FEED_MS = 5000;
const LEADER_ROWS = 8;

const SKELETON = `
<style>
.mc-hud { position:absolute; inset:0; pointer-events:none; font-family:system-ui,sans-serif; color:#fff;
  font-size:16px; text-shadow:0 2px 3px rgba(0,0,0,.85); }
.mc-hud .mc-panel { position:absolute; background:rgba(0,0,0,.45); border-radius:10px; padding:8px 12px;
  box-sizing:border-box; pointer-events:none; }
.mc-tl { left:10px; top:10px; }
.mc-tl .mc-line { font-weight:800; font-size:18px; line-height:1.35; white-space:nowrap; }
.mc-tr { right:10px; top:10px; min-width:150px; max-width:44vw; }
.mc-board { list-style:none; margin:0; padding:0; }
.mc-row { display:flex; justify-content:space-between; gap:12px; font-size:15px; font-weight:700;
  line-height:1.5; white-space:nowrap; }
.mc-row span:first-child { overflow:hidden; text-overflow:ellipsis; }
.mc-row.mc-me { color:#fff; background:rgba(255,255,255,.22); border-radius:6px; padding:0 6px; margin:0 -6px; }
.mc-row.mc-me span { color:#ffe07a; }
.mc-tc { left:50%; top:10px; transform:translateX(-50%); max-width:46vw; text-align:center;
  font-weight:800; font-size:15px; letter-spacing:.5px; border-radius:999px; padding:6px 14px; }
.mc-bl { left:10px; bottom:10px; max-width:70vw; }
.mc-feed { display:flex; flex-direction:column; align-items:flex-start; gap:2px; }
.mc-line-fx { font-size:15px; font-weight:700; background:rgba(0,0,0,.45); border-radius:6px;
  padding:3px 8px; }
.mc-dead { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  pointer-events:none; padding:16px; box-sizing:border-box; }
.mc-dead[hidden] { display:none; }
.mc-card { position:relative; text-align:center; padding:22px 26px; min-width:min(86vw,320px);
  pointer-events:auto; background:rgba(20,40,20,.8); }
.mc-card h2 { margin:0 0 8px; font-size:30px; font-weight:900; }
.mc-final { font-size:20px; font-weight:700; margin-bottom:16px; }
.mc-play { font:900 24px system-ui,sans-serif; padding:14px 28px; min-height:52px; border-radius:12px;
  border:0; background:#f2c230; color:#1a1a1a; cursor:pointer; pointer-events:auto; }
</style>
<div class="mc-panel mc-tl"><div class="mc-line mc-score">SCORE 0</div><div class="mc-line mc-length">LENGTH 0</div></div>
<div class="mc-panel mc-tr"><ol class="mc-board"></ol></div>
<div class="mc-panel mc-tc mc-chip"></div>
<div class="mc-panel mc-bl"><div class="mc-feed"></div></div>
<div class="mc-dead" hidden><div class="mc-panel mc-card">
  <h2>You got mowed</h2>
  <div class="mc-final"></div>
  <button class="mc-play" type="button">PLAY AGAIN</button>
</div></div>
`;

interface FeedLine {
  el: HTMLDivElement;
  until: number;
}

/** DOM heads-up display: appends its own container to #ui (never restyle #ui itself). */
export class Hud {
  private readonly root: HTMLDivElement;
  private readonly scoreEl: HTMLElement;
  private readonly lengthEl: HTMLElement;
  private readonly boardEl: HTMLOListElement;
  private readonly chipEl: HTMLElement;
  private readonly feedEl: HTMLElement;
  private readonly deadEl: HTMLElement;
  private readonly finalEl: HTMLElement;
  private readonly playBtn: HTMLButtonElement;
  private readonly feed: FeedLine[] = [];
  private readonly onKey = (e: KeyboardEvent): void => {
    if (!this.overlayShown) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.playAgain();
    }
  };
  private readonly onPlayClick = (): void => this.playAgain();

  private seenAlive = false;   // we have been in a snapshot at least once
  private dismissed = false;   // respawn was requested; wait until we are seen alive again
  private overlayShown = false;
  private lastScore = 0;
  private boardKey = '';
  private scoreText = '';
  private lengthText = '';
  private chipText = '';

  constructor(private readonly onRespawn: () => void) {
    const ui = document.getElementById('ui') ?? document.body;
    this.root = document.createElement('div');
    this.root.className = 'mc-hud';
    this.root.innerHTML = SKELETON;
    ui.appendChild(this.root);

    const q = <T extends Element>(sel: string): T => {
      const el = this.root.querySelector<T>(sel);
      if (!el) throw new Error(`Hud: missing ${sel}`);
      return el;
    };
    this.scoreEl = q('.mc-score');
    this.lengthEl = q('.mc-length');
    this.boardEl = q<HTMLOListElement>('.mc-board');
    this.chipEl = q('.mc-chip');
    this.feedEl = q('.mc-feed');
    this.deadEl = q('.mc-dead');
    this.finalEl = q('.mc-final');
    this.playBtn = q<HTMLButtonElement>('.mc-play');

    this.playBtn.addEventListener('click', this.onPlayClick);
    window.addEventListener('keydown', this.onKey);
  }

  /** Call every frame. */
  update(snap: Snapshot | null, meId: number | null, session: Session): void {
    this.updateChip(session.status, session.humans);
    this.expireFeed();

    if (snap === null) return;

    const me: MowerSnap | undefined =
      meId === null ? undefined : snap.mowers.find((m) => m.id === meId);

    if (me) {
      this.seenAlive = true;
      this.dismissed = false;
      this.lastScore = me.score;
    }

    this.setText('scoreText', this.scoreEl, `SCORE ${Math.round(this.lastScore)}`);
    const length = me ? Math.floor(me.segs.length / 2) : 0;
    this.setText('lengthText', this.lengthEl, `LENGTH ${length}`);

    this.updateBoard(snap.mowers, meId);

    const dead = meId !== null && !me && this.seenAlive && !this.dismissed;
    this.setOverlay(dead);
  }

  /** Kill and wall events for the feed. Spawns are ignored. */
  addEvents(events: readonly WorldEvent[]): void {
    if (events.length === 0) return;
    const now = performance.now();
    for (const ev of events) {
      let text: string;
      if (ev.kind === 'kill') text = `${ev.byName ?? 'Someone'} mowed ${ev.name}`;
      else if (ev.kind === 'wall') text = `${ev.name} hit the fence`;
      else continue;
      const el = document.createElement('div');
      el.className = 'mc-line-fx';
      el.textContent = text;
      this.feedEl.appendChild(el);
      this.feed.push({ el, until: now + FEED_MS });
    }
    while (this.feed.length > FEED_LINES) this.removeFeedLine();
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKey);
    this.playBtn.removeEventListener('click', this.onPlayClick);
    this.feed.length = 0;
    this.root.remove();
  }

  private playAgain(): void {
    if (!this.overlayShown) return;
    this.onRespawn();
    this.dismissed = true;
    this.setOverlay(false);
  }

  private setOverlay(show: boolean): void {
    if (show === this.overlayShown) return;
    this.overlayShown = show;
    if (show) this.finalEl.textContent = `Final score ${Math.round(this.lastScore)}`;
    this.deadEl.hidden = !show;
    if (show) this.playBtn.focus({ preventScroll: true });
  }

  private updateChip(status: SessionStatus, humans: number): void {
    const text =
      status === 'connecting' ? 'Connecting...'
      : status === 'online' ? `ONLINE · ${humans} players`
      : 'OFFLINE · playing with bots';
    if (text !== this.chipText) {
      this.chipText = text;
      this.chipEl.textContent = text;
    }
  }

  private updateBoard(mowers: readonly MowerSnap[], meId: number | null): void {
    const top = [...mowers].sort((a, b) => b.score - a.score).slice(0, LEADER_ROWS);
    const key = `${meId}#` + top.map((m) => `${m.id}|${m.name}|${Math.round(m.score)}`).join(';');
    if (key === this.boardKey) return;
    this.boardKey = key;

    this.boardEl.textContent = '';
    top.forEach((m, i) => {
      const li = document.createElement('li');
      li.className = m.id === meId ? 'mc-row mc-me' : 'mc-row';
      const name = document.createElement('span');
      name.textContent = `${i + 1}. ${m.name}`;
      const score = document.createElement('span');
      score.textContent = String(Math.round(m.score));
      li.append(name, score);
      this.boardEl.appendChild(li);
    });
  }

  private setText(key: 'scoreText' | 'lengthText', el: HTMLElement, text: string): void {
    if (this[key] === text) return;
    this[key] = text;
    el.textContent = text;
  }

  private expireFeed(): void {
    if (this.feed.length === 0) return;
    const now = performance.now();
    while (this.feed.length > 0 && this.feed[0].until <= now) this.removeFeedLine();
  }

  private removeFeedLine(): void {
    const line = this.feed.shift();
    line?.el.remove();
  }
}
