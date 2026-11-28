// Hedgeworth's golf HUD (A4): the hole strip, the swing meter, touch buttons for every golf action, the banner and the
// scorecard. DOM only, no game logic: the runtime calls set(view) every frame and listens to onAction.
import { SWING } from '@lawn/golf';
import { registerActivityPanel, setActivityOn, setTouchActivity } from '../activityMode';
import type { CardView, GolfHud, HudAction, HudView } from './types';

// Meter layout, in percent of the bar width (the same numbers as Gnome Golf's meter).
const LINE = 12;
const FULL = 88;
const ZONE_HALF = SWING.accuracyWindow * (FULL - LINE);
const BAR_BG = 'linear-gradient(90deg, #4f8f43 0%, #4f8f43 12%, #a6d86a 12%, #a6d86a 88%, #d24b3c 88%, #d24b3c 100%)';

const FONT = 'font-family:system-ui,sans-serif;';
const SHADOW = 'text-shadow:0 1px 2px #000;';
const PANEL = 'background:rgba(10,30,20,0.72);color:#f3e9d2;' + SHADOW + 'border-radius:10px;';
const BTN = 'pointer-events:auto;touch-action:none;box-sizing:border-box;min-width:44px;min-height:44px;padding:0 12px;'
  + 'border-radius:22px;border:2px solid rgba(255,255,255,0.7);background:rgba(10,30,20,0.6);color:#fff;' + SHADOW
  + 'font:700 15px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;cursor:pointer;';
const ABS = 'position:absolute;';

function div(css: string, text = ''): HTMLDivElement {
  const d = document.createElement('div');
  d.style.cssText = css;
  d.textContent = text;
  return d;
}

/** Keeps a touch on a HUD control from reaching the game's own pointer handlers. */
function swallow(e: Event): void {
  e.preventDefault?.();
  e.stopPropagation?.();
}

/** Stops propagation only (so scrolling the scorecard still works). */
function stop(e: Event): void {
  e.stopPropagation?.();
}

function toParText(n: number): string {
  if (n === 0) return 'E';
  return n > 0 ? '+' + n : String(n);
}

/** Short club names for the strip: Pitching Wedge -> PW, 7 Iron -> 7I, 3 Wood -> 3W, 4 Hybrid -> 4H. Others stay whole. */
export function shortClub(name: string): string {
  const wedge = /^(Pitching|Sand|Gap|Lob) Wedge$/.exec(name);
  if (wedge) return wedge[1][0] + 'W';
  const num = /^(\d+) (Iron|Wood|Hybrid)$/.exec(name);
  if (num) return num[1] + num[2][0];
  return name;
}

// Responsive layout lives in one stylesheet (media queries beat re-measuring on resize). Bottom right is the game's own
// context button (64 px at right max(24px,9vw), bottom max(24px,7vh)): SWING sits to its left, never on it.
const CSS = `
#golf-hud .gh-left{position:absolute;left:calc(env(safe-area-inset-left) + 16px);bottom:calc(env(safe-area-inset-bottom) + 16px);display:flex;gap:8px;pointer-events:none;}
#golf-hud .gh-swing{position:absolute;right:calc(env(safe-area-inset-right) + max(24px,9vw) + 76px);bottom:calc(env(safe-area-inset-bottom) + max(24px,7vh));}
#golf-hud .gh-meter{position:absolute;left:50%;right:auto;transform:translateX(-50%);width:min(78vw,360px);bottom:calc(env(safe-area-inset-bottom) + max(24px,7vh) + 110px);}
#golf-hud .gh-banner{position:absolute;left:50%;transform:translateX(-50%);top:36vh;}
#golf-hud .gh-strip{display:flex;align-items:center;gap:8px;padding:6px 8px 6px 12px;}
#golf-hud .gh-info{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px;text-align:left;}
#golf-hud .gh-l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#golf-hud .gh-sw{display:none;}
#golf-hud .gh-sw + span::before{content:' · ';}
#golf-hud .gh-acts{flex:0 0 auto;display:flex;gap:8px;}
#golf-hud .gh-acts button{min-width:48px;padding:0 8px;font-size:14px;}
@media (orientation:landscape){
  #golf-hud .gh-meter{left:auto;transform:none;right:calc(env(safe-area-inset-right) + max(24px,9vw) + 76px);width:min(40vw,320px);}
}
@media (min-width:601px){
  #golf-hud .gh-strip{min-width:min(480px,calc(100vw - 440px));}
  #golf-hud .gh-sw{display:inline;}
  #golf-hud .gh-sw + span::before{content:' ';}
}
@media (max-height:500px){
  #golf-hud .gh-l{font-size:12px!important;}
}
@media (max-width:600px){
  #golf-hud .gh-left{flex-wrap:wrap;width:152px;}
  #golf-hud .gh-sq{width:72px;min-width:72px;padding:0!important;white-space:nowrap;font-size:14px!important;}
  #golf-hud .gh-l{font-size:12px!important;}
  #golf-hud .gh-banner{font-size:22px!important;}
}
`;
let cssDone = false;
function ensureCss(): void {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head?.appendChild(st);
}

function xOf(marker: number): number {
  let x: number;
  if (marker <= 1) x = LINE + Math.max(-0.3, marker) * (FULL - LINE);
  else x = FULL + ((marker - 1) / (SWING.maxPower - 1)) * (100 - FULL);
  return Math.max(0, Math.min(100, x));
}

export function createGolfHud(ui: HTMLElement): GolfHud {
  const listeners: ((a: HudAction) => void)[] = [];
  const emit = (a: HudAction): void => {
    for (const cb of listeners) cb(a);
  };

  const box = div(
    'position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:40;display:none;' + FONT,
  );
  box.id = 'golf-hud';
  box.addEventListener('pointerdown', stop);
  box.addEventListener('mousedown', stop);
  box.addEventListener('touchstart', stop);

  // Hole strip: a panel in the shared activity slot (top centre, full width under the top button row on a phone), two
  // lines of text and Card / Quit on its right. The slot places it; this only styles it.
  ensureCss();
  const strip = div('pointer-events:none;' + PANEL);
  strip.className = 'gh-strip';
  const stripInfo = div('');
  stripInfo.className = 'gh-info';
  const stripHole = div('font-weight:700;font-size:14px;');
  stripHole.className = 'gh-l';
  const holeText = document.createElement('span');
  const strokeWord = document.createElement('span');
  strokeWord.className = 'gh-sw';
  const strokeText = document.createElement('span');
  stripHole.appendChild(holeText);
  stripHole.appendChild(strokeWord);
  stripHole.appendChild(strokeText);
  const stripShot = div('display:flex;align-items:center;gap:6px;font-size:13px;');
  stripShot.className = 'gh-l';
  const shotText = document.createElement('span');
  const windArrow = document.createElement('span');
  windArrow.style.cssText = 'display:inline-block;font-size:11px;line-height:1;';
  windArrow.textContent = '▲';
  const windText = document.createElement('span');
  stripShot.appendChild(shotText);
  stripShot.appendChild(windArrow);
  stripShot.appendChild(windText);
  stripInfo.appendChild(stripHole);
  stripInfo.appendChild(stripShot);
  strip.appendChild(stripInfo);
  const stripActs = div('');
  stripActs.className = 'gh-acts';
  strip.appendChild(stripActs);
  const unregisterStrip = registerActivityPanel(strip);

  // Banner, mid-screen (the strip and the toasts own the top), fades when there is none.
  const banner = div(
    'box-sizing:border-box;max-width:90vw;padding:6px 14px;text-align:center;font:800 26px/1.15 system-ui,sans-serif;color:#fff8d6;'
      + SHADOW + 'opacity:0;transition:opacity 0.3s;pointer-events:none;',
  );
  banner.className = 'gh-banner';

  // Swing meter. Portrait: above the buttons, centred. Landscape: above the SWING button.
  const meter = div(
    'display:none;flex-direction:column;align-items:stretch;gap:4px;box-sizing:border-box;pointer-events:none;' + FONT,
  );
  meter.className = 'gh-meter';
  const meterHint = div('height:18px;text-align:center;font-size:13px;' + SHADOW + 'color:#f3e9d2;white-space:nowrap;');
  const bar = div('position:relative;height:26px;border-radius:13px;overflow:hidden;background:' + BAR_BG
    + ';box-shadow:0 0 0 2px rgba(0,0,0,0.35);');
  const zone = div(ABS + 'top:0;bottom:0;left:' + (LINE - ZONE_HALF) + '%;width:' + ZONE_HALF * 2
    + '%;background:rgba(255,255,255,0.45);');
  const lineMark = div(ABS + 'top:0;bottom:0;left:' + LINE + '%;width:2px;margin-left:-1px;background:rgba(0,0,0,0.5);');
  const lockMark = div(ABS + 'top:0;bottom:0;width:4px;margin-left:-2px;background:#ffc83d;box-shadow:0 0 3px #000;display:none;');
  const marker = div(ABS + 'top:0;bottom:0;width:4px;margin-left:-2px;background:#fff;box-shadow:0 0 3px #000;display:none;');
  bar.appendChild(zone);
  bar.appendChild(lineMark);
  bar.appendChild(lockMark);
  bar.appendChild(marker);
  meter.appendChild(meterHint);
  meter.appendChild(bar);

  // Buttons.
  const button = (label: string, css: string, label2: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.style.cssText = BTN + css;
    b.textContent = label;
    b.setAttribute?.('aria-label', label2);
    return b;
  };
  const swingBtn = button('SWING', 'width:96px;height:96px;min-width:96px;min-height:96px;border-radius:50%;font-size:17px;'
    + 'background:radial-gradient(circle at 35% 30%, #ffe27a, #e0a526);color:#2a1c00;border:3px solid rgba(255,255,255,0.85);', 'Swing');
  swingBtn.className = 'gh-swing';
  const aimLeft = button('◀ Aim', '', 'Aim left');
  const aimRight = button('Aim ▶', '', 'Aim right');
  const clubPrev = button('Club −', '', 'Previous club');
  const clubNext = button('Club +', '', 'Next club');
  for (const b of [aimLeft, aimRight, clubPrev, clubNext]) b.className = 'gh-sq';
  const toBallBtn = button('To my ball', '', 'Walk to my ball');
  const nextHoleBtn = button('Next hole', '', 'Next hole');
  const cardBtn = button('Card', '', 'Scorecard');
  const quitBtn = button('Quit', '', 'Quit golf');
  // The buttons shown this phase sit side by side from the left edge (a 2x2 block on a phone).
  const leftRow = div('');
  leftRow.className = 'gh-left';
  for (const b of [aimLeft, aimRight, clubPrev, clubNext, toBallBtn, nextHoleBtn]) leftRow.appendChild(b);
  stripActs.appendChild(cardBtn);
  stripActs.appendChild(quitBtn);

  swingBtn.addEventListener('pointerdown', (e) => { swallow(e); emit('swing'); });
  for (const [b, a] of [[aimLeft, 'aim-left'], [aimRight, 'aim-right']] as const) {
    b.addEventListener('pointerdown', (e) => { swallow(e); emit(a); });
    b.addEventListener('pointerup', (e) => { swallow(e); emit('aim-stop'); });
    b.addEventListener('pointercancel', (e) => { swallow(e); emit('aim-stop'); });
    b.addEventListener('pointerleave', (e) => { swallow(e); emit('aim-stop'); });
  }
  clubPrev.addEventListener('pointerdown', (e) => { swallow(e); emit('club-prev'); });
  clubNext.addEventListener('pointerdown', (e) => { swallow(e); emit('club-next'); });
  toBallBtn.addEventListener('pointerdown', (e) => { swallow(e); emit('to-ball'); });
  nextHoleBtn.addEventListener('pointerdown', (e) => { swallow(e); emit('next-hole'); });
  cardBtn.addEventListener('pointerdown', (e) => { swallow(e); emit('card'); });
  quitBtn.addEventListener('pointerdown', (e) => { swallow(e); emit('quit'); });

  // Scorecard panel.
  const cardPanel = div(
    ABS + 'left:50%;top:50%;transform:translate(-50%,-50%);width:max-content;max-width:min(420px,94vw);max-height:92%;'
      + 'overflow-y:auto;box-sizing:border-box;padding:14px 16px;pointer-events:auto;touch-action:pan-y;display:none;'
      + 'background:rgba(10,30,20,0.95);color:#f3e9d2;' + SHADOW + 'border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,0.5);' + FONT,
  );
  cardPanel.addEventListener('pointerdown', stop);

  box.appendChild(strip);
  box.appendChild(banner);
  box.appendChild(meter);
  box.appendChild(swingBtn);
  box.appendChild(leftRow);
  box.appendChild(cardPanel);
  ui.appendChild(box);

  return {
    show(on: boolean): void {
      box.style.display = on ? 'block' : 'none';
      // Activity mode: the gun is holstered and the touch cluster keeps only its context button (Swing / Use near the ball).
      setActivityOn('golf', on);
      setTouchActivity('golf', on ? { stick: true, buttons: ['enter'] } : null);
    },

    set(view: HudView): void {
      // Hole strip: line 1 the hole and the score, line 2 the club, the distance and the wind.
      holeText.textContent = `Hole ${view.holeNumber} · ${view.holeName} · Par ${view.par}`;
      strokeWord.textContent = ' Stroke';
      strokeText.textContent = `${view.strokes} · ${toParText(view.toPar)}`;
      const lie = view.lieName === 'Fairway' || view.lieName === 'Tee' ? '' : ` · ${view.lieName}`;
      shotText.textContent = `${shortClub(view.clubName)} ${Math.round(view.clubYards)}${lie} · ${Math.round(view.pinYards)} to pin ·`;
      windArrow.style.transform = `rotate(${(view.windRel * 180) / Math.PI}deg)`;
      windText.textContent = `${Math.round(view.windMph)} mph`;

      // Banner.
      banner.textContent = view.banner ?? '';
      banner.style.opacity = view.banner ? '1' : '0';

      // Meter: shown while swinging, and empty in 'aim' as the hint for the three taps.
      const aiming = view.phase === 'aim';
      const showMeter = view.meter !== null || aiming;
      meter.style.display = showMeter ? 'flex' : 'none';
      if (showMeter) {
        meterHint.textContent = view.meter ? (view.meter.stage === 'accuracy' ? 'Tap for accuracy' : '') : 'Tap SWING three times: start, power, accuracy';
        const m = view.meter;
        marker.style.display = m ? 'block' : 'none';
        if (m) marker.style.left = xOf(m.marker) + '%';
        const locked = !!m && m.stage === 'accuracy';
        lockMark.style.display = locked ? 'block' : 'none';
        if (locked) lockMark.style.left = xOf(m!.power) + '%';
      }

      // Buttons by phase.
      const phase = view.phase;
      const swinging = phase === 'aim' || phase === 'swing';
      swingBtn.style.display = swinging ? 'flex' : 'none';
      for (const b of [aimLeft, aimRight, clubPrev, clubNext]) b.style.display = phase === 'aim' ? 'flex' : 'none';
      const toBall = phase === 'walk' && !view.atBall;
      toBallBtn.style.display = toBall ? 'flex' : 'none';
      nextHoleBtn.style.display = phase === 'holed' ? 'flex' : 'none';
    },

    card(view: CardView | null): void {
      if (!view) {
        cardPanel.style.display = 'none';
        cardPanel.textContent = '';
        return;
      }
      cardPanel.style.display = 'block';
      cardPanel.textContent = '';

      const title = div('font-weight:800;font-size:17px;text-align:center;margin-bottom:8px;', "Hedgeworth Links · Members' card");
      cardPanel.appendChild(title);

      // Nine rows must fit a phone: compact cells, and a long hole name ellipsises in its column.
      const table = document.createElement('table');
      table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';
      const addRow = (cells: string[], css: string): void => {
        const tr = document.createElement('tr');
        tr.style.cssText = css;
        cells.forEach((text, i) => {
          const td = document.createElement('td');
          td.style.cssText = 'padding:3px 5px;text-align:left;';
          if (i === 1) {
            td.style.cssText += 'max-width:34vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
          }
          td.textContent = text;
          tr.appendChild(td);
        });
        table.appendChild(tr);
      };
      addRow(['No.', 'Hole', 'Par', 'Score', 'Best'], 'font-weight:700;border-bottom:1px solid rgba(243,233,210,0.4);');
      for (const h of view.holes) {
        addRow(
          [String(h.number), h.name, String(h.par), h.strokes === null ? '–' : String(h.strokes), h.best === null ? '–' : String(h.best)],
          'border-bottom:1px solid rgba(243,233,210,0.15);',
        );
      }
      // Total row: par and strokes summed over the holes shown (strokes only from the holes played), best is not summed.
      const parSum = view.holes.reduce((s, h) => s + h.par, 0);
      const played = view.holes.filter((h) => h.strokes !== null);
      const strokesSum = played.length === 0 ? '–' : String(played.reduce((s, h) => s + (h.strokes ?? 0), 0));
      addRow(['', 'Total', String(parSum), strokesSum, '–'], 'font-weight:700;border-top:1px solid rgba(243,233,210,0.4);');
      cardPanel.appendChild(table);

      if (view.final) {
        cardPanel.appendChild(div('font-weight:800;text-align:center;margin-top:10px;font-size:16px;', 'Round complete'));
        cardPanel.appendChild(div(
          'font-style:italic;text-align:center;margin-top:4px;font-size:14px;',
          '"One does not concede a hole, my dear. One merely finishes it."',
        ));
      }

      const close = button('Close', 'margin:10px auto 0;', 'Close scorecard');
      close.style.display = 'flex';
      close.addEventListener('pointerdown', (e) => {
        swallow(e);
        cardPanel.style.display = 'none';
        emit('card-close');
      });
      cardPanel.appendChild(close);
    },

    onAction(cb: (a: HudAction) => void): void {
      listeners.push(cb);
    },

    destroy(): void {
      unregisterStrip();
      setActivityOn('golf', false);
      setTouchActivity('golf', null);
      listeners.length = 0;
      box.remove?.();
    },
  };
}
