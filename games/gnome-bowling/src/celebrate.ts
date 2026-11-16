// Full-screen result cards (STRIKE!, SPARE!, GUTTER BALL, SPLIT! and friends), shown during the 'result' phase.
// Or, when the result carries a cartoon (cartoons/index.ts), a vintage alley score monitor playing that cartoon.
// DOM, CSS and one canvas: every selector starts with #bx-. Sounds and voices are audio.ts's job.
import { ROUND, type BallResult, type Ctx, type Player, type ResultKind, type System } from './config';
import { frameMarks } from './scoring';
import { getCartoon } from './cartoons/index';
import { CRT_H, CRT_W, type Cartoon, type CartoonInfo } from './cartoons/types';

const FADE_S = 0.25;
const CONFETTI_GOLD = ['#ffd54f', '#ff3fb4', '#3ff0ff', '#ffffff', '#7cff6b', '#ff8a3d'];
const CONFETTI_AUTUMN = ['#d2691e', '#b5651d', '#ffb347', '#8b4513', '#c0392b', '#f1c40f'];
const GUTTER_SUBS = ['The gutter gnomes thank you', 'Into the drain!', 'Nice try, pal'];

const CSS = `
#bx-root .bx-card { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: env(safe-area-inset-top, 0px) 16px env(safe-area-inset-bottom, 0px);
  box-sizing: border-box; overflow: hidden; text-align: center; transition: opacity 0.25s ease-in; }
#bx-root .bx-card.bx-out { opacity: 0; }
#bx-root .bx-card.bx-shake { animation: bx-shake 0.5s linear 0.3s; }
#bx-root .bx-vig { position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 60% 50% at 50% 45%, rgba(20,10,40,0.7), rgba(20,10,40,0) 100%); }
#bx-root .bx-head { position: relative; z-index: 2; margin: 0; white-space: nowrap; line-height: 1;
  font-size: min(14vw, 22vh, 110px); font-weight: 900; font-style: italic; text-transform: uppercase;
  color: #fff; -webkit-text-stroke: 2px #2a0a4a; paint-order: stroke fill;
  text-shadow: 0 4px 0 #2a0a4a, 0 8px 0 #1a0630, 0 0 24px rgba(255,63,180,0.8);
  animation: bx-slam 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.2) both; }
#bx-root .bx-head.bx-sweep { animation: bx-sweep 0.45s ease-out both; }
#bx-root .bx-head.bx-drop { animation: bx-drop 0.95s cubic-bezier(0.3, 0.6, 0.4, 1) both; }
#bx-root .bx-head.bx-pop { animation: bx-popout 1.6s ease-out both; }
#bx-root .bx-head.bx-splitwrap { display: inline-block; }
#bx-root .bx-k-strike .bx-head { font-size: min(18vw, 30vh, 140px); color: #ffd54f; -webkit-text-stroke: 4px #2a0a4a; }
#bx-root .bx-k-double .bx-head { color: #3ff0ff; }
#bx-root .bx-k-turkey .bx-head { color: #ffb347; }
#bx-root .bx-k-spare .bx-head { color: #3ff0ff; }
#bx-root .bx-k-gutter .bx-head { font-size: min(11vw, 22vh, 96px); white-space: normal; color: #9fb3c8;
  -webkit-text-stroke-color: #1d2a3a; filter: saturate(0.35); }
#bx-root .bx-k-split .bx-head { color: #ffffff; }
#bx-root .bx-k-nine .bx-head { font-size: min(12vw, 22vh, 96px); color: #ffd54f; }
#bx-root .bx-k-pins .bx-head { font-size: min(12vw, 20vh, 90px); color: #fff; }
#bx-root .bx-k-miss .bx-head { color: #e8e0ff; }
#bx-root .bx-txt { display: inline-block; }
#bx-root .bx-wob { animation: bx-gobble 0.5s ease-in-out 0.6s infinite alternate; }
#bx-root .bx-hue { animation: bx-hue 1.6s linear infinite; }
#bx-root .bx-wig { animation: bx-wiggle 0.5s ease-in-out 0.5s 4 alternate; }
#bx-root .bx-ghost { visibility: hidden; }
#bx-root .bx-half { display: block; position: absolute; left: 0; top: 0; width: 100%; }
#bx-root .bx-l { clip-path: inset(0 50% 0 0); animation: bx-splitl 0.8s ease-out 0.25s both; }
#bx-root .bx-r { clip-path: inset(0 0 0 50%); animation: bx-splitr 0.8s ease-out 0.25s both; }
#bx-root .bx-crack { position: absolute; left: 50%; top: -8%; bottom: -8%; width: 4px; margin-left: -2px;
  background: #fff; box-shadow: 0 0 8px #3ff0ff; transform: scaleY(0); transform-origin: 50% 0;
  animation: bx-crack 0.35s ease-out 0.2s forwards; }
#bx-root .bx-name { position: relative; z-index: 2; margin-top: 8px; font-size: min(4.2vw, 20px); font-weight: 800;
  letter-spacing: 0.04em; text-shadow: 0 2px 4px #000; }
#bx-root .bx-sub { position: relative; z-index: 2; margin-top: 8px; font-size: min(4.6vw, 22px); font-weight: 700;
  color: #fff; text-shadow: 0 2px 4px #000; }
#bx-root .bx-badges { position: relative; z-index: 2; display: flex; gap: 14px; margin-top: 10px; }
#bx-root .bx-badge { width: 64px; height: 64px; border-radius: 50%; background: #3ff0ff; color: #1a0630;
  font-weight: 900; font-size: 36px; line-height: 64px; box-shadow: 0 0 18px #3ff0ff, 0 4px 0 #2a0a4a;
  animation: bx-badgepop 0.45s cubic-bezier(0.3, 1.5, 0.5, 1) both; }
#bx-root .bx-badge + .bx-badge { background: #ffd54f; box-shadow: 0 0 18px #ffd54f, 0 4px 0 #2a0a4a;
  animation-delay: 0.3s; }
#bx-root .bx-wobpin { position: relative; z-index: 2; display: inline-block; margin-top: 10px;
  font-size: min(20vw, 96px); animation: bx-refuse 1s ease-in-out infinite alternate; }
#bx-root .bx-rays { position: absolute; left: 50%; top: 50%; width: 150vmin; height: 150vmin;
  margin: -75vmin 0 0 -75vmin; border-radius: 50%; pointer-events: none;
  background: repeating-conic-gradient(from 0deg, rgba(255,63,180,0.38) 0deg 9deg, rgba(255,213,79,0.22) 9deg 18deg);
  -webkit-mask-image: radial-gradient(circle, #000 8%, transparent 62%);
  mask-image: radial-gradient(circle, #000 8%, transparent 62%);
  animation: bx-spin 14s linear infinite; }
#bx-root .bx-conf { position: absolute; left: 50%; top: 42%; border-radius: 1px; background: var(--c);
  animation: bx-burst 1.7s cubic-bezier(0.15, 0.7, 0.35, 1) both; }
#bx-root .bx-rain { position: absolute; top: 0; line-height: 1; margin-left: -0.5em;
  animation-name: bx-fall; animation-timing-function: linear; animation-iteration-count: infinite; }
#bx-root .bx-strut { position: absolute; left: 0; bottom: 4vh; font-size: min(14vw, 96px); line-height: 1;
  animation: bx-strut 3.2s linear both; }
#bx-root .bx-bob { display: inline-block; animation: bx-bobk 0.35s ease-in-out infinite alternate; }
#bx-root .bx-face { position: absolute; left: 50%; bottom: 2vh; font-size: min(22vw, 120px); line-height: 1;
  animation: bx-up 0.7s ease-out 0.6s both; }
#bx-root .bx-slash { position: absolute; left: 50%; top: 50%; height: 14px; width: 0; margin-top: -7px;
  transform: translateX(-50%) rotate(-28deg); border-radius: 7px; background: #3ff0ff;
  box-shadow: 0 0 16px #3ff0ff, 0 0 4px #fff; animation: bx-draw 0.5s ease-out 0.35s both; }
#bx-root .bx-speed { position: absolute; left: 0; height: 3px; transform-origin: left center;
  background: linear-gradient(90deg, transparent, #3ff0ff); animation: bx-streak 0.5s ease-out both; }

@keyframes bx-slam { 0% { transform: scale(3); opacity: 0; } 35% { transform: scale(0.92); opacity: 1; }
  60% { transform: scale(1.08); } 80% { transform: scale(0.97); } 100% { transform: scale(1); } }
@keyframes bx-shake { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-6px, 4px); }
  20% { transform: translate(7px, -5px); } 30% { transform: translate(-8px, 3px); }
  40% { transform: translate(6px, -4px); } 50% { transform: translate(-4px, 4px); }
  60% { transform: translate(3px, -2px); } 70% { transform: translate(-2px, 1px); } 80% { transform: translate(0, 0); } }
@keyframes bx-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes bx-burst {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  40% { transform: translate(var(--x), var(--y)) rotate(calc(var(--r) * 0.5)); opacity: 1; }
  100% { transform: translate(calc(var(--x) * 1.15), calc(var(--y) + var(--f))) rotate(var(--r)); opacity: 0; }
}
@keyframes bx-badgepop { from { transform: scale(0) rotate(-60deg); } to { transform: scale(1) rotate(0deg); } }
@keyframes bx-gobble { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
@keyframes bx-hue { from { filter: hue-rotate(0deg); } to { filter: hue-rotate(360deg); } }
@keyframes bx-wiggle { from { transform: translateX(-14px) rotate(-3deg); } to { transform: translateX(14px) rotate(3deg); } }
@keyframes bx-fall { from { transform: translateY(-10vh) rotate(0deg); }
  to { transform: translateY(115vh) rotate(220deg); } }
@keyframes bx-sweep { from { transform: translateX(-110vw) skewX(-12deg); } to { transform: translateX(0) skewX(0); } }
@keyframes bx-streak { 0% { transform: scaleX(0); opacity: 0; } 30% { opacity: 1; }
  100% { transform: scaleX(1); opacity: 0; } }
@keyframes bx-draw { from { width: 0; } to { width: min(70vw, 60vh); } }
@keyframes bx-drop { 0% { transform: translateY(-60vh) rotate(-4deg); opacity: 0; } 30% { opacity: 1; }
  55% { transform: translateY(0) rotate(0deg); } 75% { transform: translateY(6px) rotate(8deg); }
  100% { transform: translateY(14px) rotate(8deg); } }
@keyframes bx-up { from { transform: translate(-50%, 60vh); } to { transform: translate(-50%, 0); } }
@keyframes bx-strut { from { transform: translateX(-25vw); } to { transform: translateX(120vw); } }
@keyframes bx-bobk { from { transform: translateY(0) rotate(-4deg); } to { transform: translateY(-8px) rotate(4deg); } }
@keyframes bx-splitl { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(-7vw, 0) rotate(-6deg); } }
@keyframes bx-splitr { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(7vw, 0) rotate(6deg); } }
@keyframes bx-crack { to { transform: scaleY(1); } }
@keyframes bx-refuse { from { transform: rotate(-16deg); } to { transform: rotate(16deg); } }
@keyframes bx-popout {
  0% { transform: scale(0.4); opacity: 0; } 18% { transform: scale(1.12); opacity: 1; }
  30% { transform: scale(1); } 70% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.9); opacity: 0; }
}

#bx-root .bx-crt { background: rgba(10,4,24,0.55); }
#bx-root .bx-cab { position: relative; z-index: 2; box-sizing: border-box; width: min(92vw, 104vh, 760px);
  padding: min(3vw, 22px) min(3vw, 22px) min(2vw, 14px); border-radius: 22px;
  background: repeating-linear-gradient(92deg, #6b3f1d 0 6px, #7a4a24 6px 9px, #5e3618 9px 15px);
  box-shadow: inset 0 0 0 3px #3a200c, inset 0 0 18px rgba(0,0,0,0.6), 0 10px 0 #2a1608, 0 0 40px rgba(255,63,180,0.35);
  animation: bx-cabin 0.3s ease-out both; }
#bx-root .bx-screen { position: relative; overflow: hidden; aspect-ratio: 4 / 3; border-radius: 18px / 14px;
  background: #000; box-shadow: 0 0 0 4px #1a1a1a, 0 0 0 7px #888, inset 0 0 30px #000;
  animation: bx-poweron 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) both; }
#bx-root .bx-screen canvas { display: block; width: 100%; height: 100%; image-rendering: pixelated;
  filter: saturate(1.25) contrast(1.1); animation: bx-flicker 0.12s steps(2) infinite; }
#bx-root .bx-lines { position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(180deg, rgba(0,0,0,0.28) 0 2px, transparent 2px 4px),
    radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%); }
#bx-root .bx-glare { position: absolute; left: 6%; top: 4%; width: 40%; height: 22%; border-radius: 50%; pointer-events: none;
  background: radial-gradient(ellipse, rgba(255,255,255,0.12), transparent 70%); }
#bx-root .bx-plate { margin-top: min(1.6vw, 10px); font: 900 italic min(3.2vw, 15px) system-ui, sans-serif; letter-spacing: 0.25em;
  color: #ffd54f; text-shadow: 0 1px 0 #3a200c; text-transform: uppercase; }
@keyframes bx-cabin { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes bx-poweron { 0% { filter: brightness(4); transform: scaleY(0.02) scaleX(0.6); }
  50% { filter: brightness(2); transform: scaleY(0.04) scaleX(1); } 100% { filter: brightness(1); transform: scale(1); } }
@keyframes bx-flicker { from { opacity: 1; } to { opacity: 0.94; } }

@media (prefers-reduced-motion: reduce) {
  #bx-root .bx-screen canvas { animation: none; }
  #bx-root .bx-card.bx-shake { animation: none; }
  #bx-root .bx-conf { display: none; }
}
`;

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    if (c === '&') return '&amp;';
    if (c === '<') return '&lt;';
    if (c === '>') return '&gt;';
    if (c === '"') return '&quot;';
    return '&#39;';
  });
}

function rnd(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

function pick<T>(xs: readonly T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

/** Coloured rectangles flying outward from the centre, then falling (CSS vars per piece). */
function burst(n: number, colours: readonly string[]): string {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2);
    const d = rnd(110, 330);
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d * 0.8 - 40;
    out += `<i class="bx-conf" style="--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;--r:${rnd(-540, 540).toFixed(0)}deg;` +
      `--f:${rnd(40, 90).toFixed(0)}vh;--c:${pick(colours)};width:${rnd(6, 11).toFixed(0)}px;` +
      `height:${rnd(4, 7).toFixed(0)}px;animation-delay:${rnd(0, 0.12).toFixed(2)}s"></i>`;
  }
  return out;
}

/** Emoji falling from the top of the card. */
function rain(n: number, glyph: string, minPx: number, maxPx: number): string {
  let out = '';
  for (let i = 0; i < n; i++) {
    out += `<i class="bx-rain" style="left:${rnd(0, 100).toFixed(1)}%;font-size:${rnd(minPx, maxPx).toFixed(0)}px;` +
      `animation-duration:${rnd(1.6, 2.8).toFixed(2)}s;animation-delay:${rnd(0, 1.5).toFixed(2)}s">${glyph}</i>`;
  }
  return out;
}

function trailingStrikes(rolls: readonly number[]): number {
  const marks = frameMarks(rolls).flat();
  let n = 0;
  for (let i = marks.length - 1; i >= 0 && marks[i] === 'X'; i--) n++;
  return n;
}

/** Builds one card's markup. `kind` is already normalised (a zero-count 'pins' is a miss). */
function cardHTML(kind: ResultKind, count: number, player: Player | undefined, rolls: readonly number[]): string {
  const name = player ? player.name : '';
  const color = player ? '#' + player.color.toString(16).padStart(6, '0') : '#ffffff';

  // Each entry: card class, optional decoration (behind the text), headline head class and inner markup,
  // extra markup under the headline, sub-line, and whether it is a big card (vignette, shake allowed).
  let cls = `bx-k-${kind}`;
  let decor = '';
  let headClass = '';
  let inner = '';
  let extra = '';
  let sub = '';
  let big = true;
  let shake = false;

  switch (kind) {
    case 'strike':
      decor = '<div class="bx-rays"></div>' + burst(60, CONFETTI_GOLD);
      inner = '<span class="bx-txt">STRIKE!</span>';
      sub = 'ALL TEN GNOMES DOWN';
      shake = true;
      break;
    case 'double':
      inner = '<span class="bx-txt">DOUBLE!</span>';
      extra = '<div class="bx-badges"><span class="bx-badge">X</span><span class="bx-badge">X</span></div>';
      sub = 'Two in a row!';
      break;
    case 'turkey':
      decor = '<div class="bx-strut"><span class="bx-bob">\u{1F983}</span></div>' + burst(50, CONFETTI_AUTUMN);
      inner = '<span class="bx-txt bx-wob">TURKEY!</span>';
      sub = 'Three strikes! Gobble gobble!';
      shake = true;
      break;
    case 'hambone': {
      const n = trailingStrikes(rolls);
      decor = rain(20, '\u{1F356}', 28, 56);
      inner = '<span class="bx-txt bx-hue">HAMBONE!!</span>';
      sub = `${n} strikes in a row`;
      break;
    }
    case 'spare':
      decor =
        '<i class="bx-speed" style="top:36%;width:40vw;animation-delay:0s"></i>' +
        '<i class="bx-speed" style="top:44%;width:52vw;animation-delay:0.04s"></i>' +
        '<i class="bx-speed" style="top:52%;width:34vw;animation-delay:0.08s"></i>' +
        '<i class="bx-speed" style="top:60%;width:46vw;animation-delay:0.12s"></i>' +
        '<i class="bx-slash"></i>';
      headClass = 'bx-sweep';
      inner = '<span class="bx-txt">SPARE!</span>';
      sub = 'Cleaned up!';
      break;
    case 'gutter':
      decor = rain(14, '\u{1F4A7}', 22, 40) + '<div class="bx-face">\u{1F648}</div>';
      headClass = 'bx-drop';
      inner = '<span class="bx-txt">GUTTER BALL</span>';
      sub = pick(GUTTER_SUBS);
      break;
    case 'miss':
      inner = '<span class="bx-txt bx-wig">MISS!</span>';
      sub = 'Not a single gnome flinched';
      break;
    case 'split':
      headClass = 'bx-splitwrap';
      inner =
        '<span class="bx-ghost">SPLIT!</span>' +
        '<span class="bx-half bx-l">SPLIT!</span>' +
        '<span class="bx-half bx-r">SPLIT!</span>' +
        '<i class="bx-crack"></i>';
      sub = 'Good luck with that…';
      break;
    case 'nine':
      inner = '<span class="bx-txt">9 PINS!</span>';
      extra = '<div class="bx-wobpin">\u{1F3B3}</div>';
      sub = 'So close!';
      big = false;
      break;
    default:
      // 'pins': a small pop, no overlay.
      inner = `<span class="bx-txt">${count === 1 ? '1 PIN' : `${count} PINS`}</span>`;
      headClass = 'bx-pop';
      big = false;
      break;
  }

  const head = `<div class="bx-head ${headClass}">${inner}</div>`;
  const nameHTML = `<div class="bx-name" style="color:${color}">${esc(name)}</div>`;
  const subHTML = sub ? `<div class="bx-sub">${esc(sub)}</div>` : '';
  const vig = big ? '<div class="bx-vig"></div>' : '';
  if (shake) cls += ' bx-shake';
  return `<div class="bx-card ${cls}">${vig}${decor}${head}${extra}${nameHTML}${subHTML}</div>`;
}

export function createCelebrate(ctx: Ctx): System {
  const style = document.createElement('style');
  style.textContent = CSS;
  const root = document.createElement('div');
  root.id = 'bx-root';
  root.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5;';
  root.appendChild(style);
  ctx.ui.appendChild(root);

  let shownSerial = -1;
  let card: HTMLElement | null = null;
  /** The cartoon playing on the monitor, if the current card is one. */
  let playing: { cartoon: Cartoon; info: CartoonInfo; g: CanvasRenderingContext2D; t: number } | null = null;
  /** Seconds since the card started fading out; -1 while it is not fading. */
  let fadeT = -1;

  function clear(): void {
    if (card) card.remove();
    card = null;
    playing = null;
    fadeT = -1;
  }

  /** The score monitor: wood cabinet, rounded CRT glass, scanlines. Returns false if the canvas is unavailable. */
  function showCartoon(cartoon: Cartoon, res: BallResult, player: Player | undefined): boolean {
    root.insertAdjacentHTML('beforeend',
      `<div class="bx-card bx-crt"><div class="bx-cab"><div class="bx-screen"><canvas width="${CRT_W}" height="${CRT_H}"></canvas>` +
      `<i class="bx-lines"></i><i class="bx-glare"></i></div><div class="bx-plate">★ Gnome-O-Matic Auto Score ★</div></div></div>`);
    card = root.lastElementChild as HTMLElement;
    const canvas = card.querySelector('canvas') as HTMLCanvasElement;
    const g = canvas.getContext('2d');
    if (!g) return false;
    g.imageSmoothingEnabled = false;
    const info: CartoonInfo = {
      kind: res.kind,
      name: player?.name ?? '',
      color: player ? '#' + player.color.toString(16).padStart(6, '0') : '#ffffff',
      streak: res.streak,
      count: res.count,
      duration: ROUND.cartoonSeconds - FADE_S,
      seed: res.serial * 9973 + res.count * 101 + res.streak,
    };
    playing = { cartoon, info, g, t: 0 };
    drawCartoon();
    return true;
  }

  function drawCartoon(): void {
    if (!playing) return;
    const { cartoon, info, g, t } = playing;
    g.save();
    try {
      cartoon.draw(g, Math.min(t, info.duration), info);
    } catch (err) {
      // A broken cartoon must not stop the game: log once and freeze it.
      console.error(`cartoon ${cartoon.id} failed`, err);
      playing = null;
    }
    g.restore();
  }

  function show(res: BallResult): void {
    clear();
    const player = ctx.state.players[res.player] as Player | undefined;
    const rolls = player ? player.rolls : [];
    const kind: ResultKind = res.kind === 'pins' && res.count === 0 ? 'miss' : res.kind;
    const cartoon = res.cartoon ? getCartoon(res.cartoon) : null;
    if (cartoon && showCartoon(cartoon, res, player)) return;
    clear();
    root.insertAdjacentHTML('beforeend', cardHTML(kind, res.count, player, rolls));
    card = root.lastElementChild as HTMLElement;
  }

  // Debug: #preview=<cartoon id> shows that cartoon over everything on a loop, as a strike by 'Gnorman';
  // add &at=<seconds> to freeze it at that moment (for screenshots).
  const pv = /preview=([a-z0-9-]+)/.exec(location.hash);
  const pvAt = /[&#]at=(\d+(?:\.\d+)?)/.exec(location.hash);
  const preview = pv ? getCartoon(pv[1]) : null;
  if (pv && !preview) console.warn(`no cartoon with id ${pv[1]}`);

  return {
    update(dt: number): void {
      const s = ctx.state;
      if (preview) {
        if (!playing) {
          root.style.zIndex = '50';
          const kind = preview.kinds[0];
          showCartoon(preview, { kind, count: kind === 'gutter' || kind === 'miss' ? 0 : 10, player: 0, serial: 1, cartoon: preview.id, streak: kind === 'hambone' ? 5 : kind === 'turkey' ? 3 : kind === 'double' ? 2 : kind === 'strike' ? 1 : 0 },
            { name: 'Gnorman', look: 'gnorman', color: 0xff5a5a, rolls: [], local: true, netId: -1, gone: false, npc: null });
        }
        if (playing) {
          const d = playing.info.duration;
          playing.t = pvAt ? Number(pvAt[1]) : (playing.t + dt) % (d + 0.8);
          drawCartoon();
        }
        return;
      }
      if (s.phase === 'result' && s.result && s.result.serial !== shownSerial) {
        shownSerial = s.result.serial;
        show(s.result);
      }
      if (playing && fadeT < 0) {
        playing.t += dt;
        drawCartoon();
      }
      if (s.phase !== 'result' && card && fadeT < 0) {
        fadeT = 0;
        card.classList.add('bx-out');
      }
      if (fadeT >= 0) {
        fadeT += dt;
        if (fadeT >= FADE_S) clear();
      }
    },
  };
}
