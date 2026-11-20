import { createAchievementTracker } from '@lawn/achievements';
import { COLS, ROWS, dayNumber, isWin, scoreGuess, shareText, verdict, type Mark } from './logic';

const ui = document.getElementById('ui') as HTMLElement;
const tracker = createAchievementTracker({ ui });
const KEY = 'wordle-gnome.v1';
interface Save { day: number; rows: string[]; stats: { played: number; won: number; streak: number } }
const today = dayNumber(new Date());
function load(): Save {
  const fresh: Save = { day: today, rows: [], stats: { played: 0, won: 0, streak: 0 } };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Save | null;
    if (!s) return fresh;
    return s.day === today ? s : { ...fresh, stats: s.stats };
  } catch { return fresh; }
}
let save = load();
let draft = '';
let toast = '';
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* private mode */ } };

const marksOf = () => save.rows.map((r) => scoreGuess(r));
const won = () => save.rows.some((r) => isWin(scoreGuess(r)));
const over = () => won() || save.rows.length >= ROWS;

const css = document.createElement('style');
css.textContent = `
#ui{position:fixed;inset:0;background:#fff;color:#1a1a1b;font-family:"Helvetica Neue",Arial,sans-serif;display:flex;flex-direction:column;align-items:center;
 padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);box-sizing:border-box;user-select:none}
.w h1{margin:10px 0;font:800 28px/1 Georgia,serif;letter-spacing:.04em;text-align:center}
.w{width:100%;max-width:500px;height:100%;display:flex;flex-direction:column;align-items:center;padding:0 8px;box-sizing:border-box}
.hd{width:100%;border-bottom:1px solid #d3d6da;margin-bottom:8px}
.board{flex:1;display:flex;align-items:center;justify-content:center;min-height:0}
.grid{display:grid;grid-template-columns:repeat(${COLS},62px);gap:5px}
.t{width:62px;height:62px;border:2px solid #d3d6da;display:flex;align-items:center;justify-content:center;font:700 2rem/1 sans-serif;text-transform:uppercase}
.t.f{border-color:#878a8c}.t.correct{background:#6aaa64;border-color:#6aaa64;color:#fff}.t.present{background:#c9b458;border-color:#c9b458;color:#fff}.t.absent{background:#787c7e;border-color:#787c7e;color:#fff}
.msg{min-height:44px;text-align:center;font-weight:700;padding:6px}
.kb{width:100%;padding-bottom:8px}.kr{display:flex;justify-content:center;gap:6px;margin-bottom:8px}
.k{flex:1;max-width:43px;height:58px;border:0;border-radius:4px;background:#d3d6da;font:700 .85rem sans-serif;text-transform:uppercase;cursor:pointer;color:inherit;padding:0;touch-action:manipulation}
.k.wide{flex:1.5;max-width:65px}.k.correct{background:#6aaa64;color:#fff}.k.present{background:#c9b458;color:#fff}.k.absent{background:#787c7e;color:#fff}
.share{min-height:48px;padding:0 24px;font:700 1rem sans-serif;border:0;border-radius:24px;background:#6aaa64;color:#fff;cursor:pointer;margin-bottom:8px}
@media (max-height:520px){.t{width:36px;height:36px;font-size:1.2rem}.grid{grid-template-columns:repeat(${COLS},36px);gap:3px}.k{height:40px}}`;
document.head.appendChild(css);
const root = document.createElement('div');
root.className = 'w';
ui.appendChild(root);

function keyStates(): Record<string, Mark> {
  const rank: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };
  const out: Record<string, Mark> = {};
  save.rows.forEach((r) => scoreGuess(r).forEach((m, i) => {
    const c = r[i].toUpperCase();
    if (!out[c] || rank[m] > rank[out[c]]) out[c] = m;
  }));
  return out;
}

function render(): void {
  const marks = marksOf();
  let tiles = '';
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const done = r < save.rows.length;
    const letter = done ? save.rows[r][c] : r === save.rows.length ? draft[c] ?? '' : '';
    tiles += `<div class="t ${done ? marks[r][c] : letter ? 'f' : ''}">${letter}</div>`;
  }
  const ks = keyStates();
  const key = (c: string, cls = '') => `<button class="k ${cls} ${ks[c] ?? ''}" data-k="${c}">${c === 'ENTER' ? 'Enter' : c === 'DEL' ? '⌫' : c}</button>`;
  const rows = ['QWERTYUIOP', 'ASDFGHJKL'].map((r) => `<div class="kr">${[...r].map((c) => key(c)).join('')}</div>`).join('')
    + `<div class="kr">${key('ENTER', 'wide')}${[...'ZXCVBNM'].map((c) => key(c)).join('')}${key('DEL', 'wide')}</div>`;
  const msg = over() ? verdict(save.rows.length, won()) : toast;
  root.innerHTML = `<div class="hd"><h1>Wordle</h1></div>
  <div class="board"><div class="grid" role="grid" aria-label="Guesses">${tiles}</div></div>
  <div class="msg" role="status">${msg}</div>
  ${over() ? `<button class="share" data-k="SHARE">Share</button>` : ''}
  <div class="kb">${rows}</div>`;
}

function flash(t: string): void { toast = t; render(); setTimeout(() => { if (toast === t) { toast = ''; render(); } }, 1500); }

function press(k: string): void {
  if (over() && k !== 'SHARE') return;
  if (k === 'SHARE') {
    const text = shareText(save.day, marksOf(), won());
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => flash('Copied results to clipboard'), () => flash(text));
    else flash(text);
    return;
  }
  if (k === 'DEL') draft = draft.slice(0, -1);
  else if (k === 'ENTER') {
    if (draft.length < COLS) return void flash('Not enough letters');
    save.rows.push(draft); draft = '';
    if (over()) {
      save.stats.played++;
      if (won()) { save.stats.won++; save.stats.streak++; void tracker.unlock('wordle-gnome-solve'); void tracker.increment('wordle-gnome-regular'); if (save.rows.length === 1) void tracker.unlock('wordle-gnome-genius'); }
      else save.stats.streak = 0;
    }
    persist();
  } else if (/^[A-Z]$/.test(k) && draft.length < COLS) draft += k;
  render();
}

root.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-k]');
  if (b) press(b.dataset.k as string);
});
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Enter') press('ENTER');
  else if (e.key === 'Backspace') press('DEL');
  else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toUpperCase());
});
render();
