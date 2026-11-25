// Hedgeworth's golf HUD (A4): the hole strip, the swing meter, touch buttons for every golf action, the banner and the
// scorecard. DOM only, no game logic: the runtime calls set(view) every frame and listens to onAction.
import { SWING } from '@lawn/golf';
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

  // Hole strip, top centre below the safe area and the top button row.
  const strip = div(
    ABS + 'left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 56px);max-width:92vw;box-sizing:border-box;'
      + 'padding:6px 12px;text-align:center;pointer-events:none;white-space:nowrap;' + PANEL,
  );
  const stripHole = div('font-weight:700;font-size:15px;');
  const stripStroke = div('font-size:13px;');
  const stripShot = div('font-size:13px;');
  const stripWind = div('display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;');
  const windArrow = div('display:inline-block;font-size:12px;line-height:1;');
  windArrow.textContent = '▲';
  const windText = div('');
  stripWind.appendChild(windArrow);
  stripWind.appendChild(windText);
  strip.appendChild(stripHole);
  strip.appendChild(stripStroke);
  strip.appendChild(stripShot);
  strip.appendChild(stripWind);

  // Banner, below the strip (upper third), fades when there is none.
  const banner = div(
    ABS + 'left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 180px);max-width:90vw;box-sizing:border-box;'
      + 'padding:6px 14px;text-align:center;font:800 26px/1.15 system-ui,sans-serif;color:#fff8d6;' + SHADOW
      + 'opacity:0;transition:opacity 0.3s;pointer-events:none;',
  );

  // Swing meter. Portrait: above the buttons, centred. Landscape: above the SWING button's left edge.
  const meter = div(
    ABS + 'display:none;flex-direction:column;align-items:stretch;gap:4px;box-sizing:border-box;pointer-events:none;' + FONT,
  );
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
  const SAFE_B = 'bottom:calc(env(safe-area-inset-bottom) + 16px);';
  const SAFE_L = 'left:calc(env(safe-area-inset-left) + 16px);';
  const SAFE_R = 'right:calc(env(safe-area-inset-right) + 16px);';

  const swingBtn = button('SWING', ABS + SAFE_R + SAFE_B
    + 'width:96px;height:96px;min-width:96px;min-height:96px;border-radius:50%;font-size:17px;'
    + 'background:radial-gradient(circle at 35% 30%, #ffe27a, #e0a526);color:#2a1c00;border:3px solid rgba(255,255,255,0.85);', 'Swing');
  const aimLeft = button('◀ Aim', ABS + SAFE_L + SAFE_B, 'Aim left');
  const aimRight = button('Aim ▶', ABS + SAFE_L + SAFE_B, 'Aim right');
  const clubPrev = button('Club −', ABS + SAFE_L + SAFE_B, 'Previous club');
  const clubNext = button('Club +', ABS + SAFE_L + SAFE_B, 'Next club');
  const toBallBtn = button('To my ball', ABS + SAFE_L + SAFE_B, 'Walk to my ball');
  const nextHoleBtn = button('Next hole', ABS + SAFE_L + SAFE_B, 'Next hole');
  const cardBtn = button('Card', ABS + 'top:calc(env(safe-area-inset-top) + 8px);right:calc(env(safe-area-inset-right) + 60px);', 'Scorecard');
  const quitBtn = button('Quit', ABS + 'top:calc(env(safe-area-inset-top) + 8px);right:calc(env(safe-area-inset-right) + 8px);', 'Quit golf');
  const leftRow = [aimLeft, aimRight, clubPrev, clubNext, toBallBtn, nextHoleBtn];
  // The buttons shown this phase sit side by side from the left edge.
  const placeRow = (shown: HTMLButtonElement[]): void => {
    shown.forEach((b, i) => {
      b.style.left = `calc(env(safe-area-inset-left) + ${16 + i * 62}px)`;
    });
  };

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
  for (const b of leftRow) box.appendChild(b);
  box.appendChild(cardBtn);
  box.appendChild(quitBtn);
  box.appendChild(cardPanel);
  ui.appendChild(box);

  // Landscape puts the meter beside the SWING button, portrait above the buttons.
  const isLandscape = (): boolean => {
    try { return typeof matchMedia === 'function' && matchMedia('(orientation: landscape)').matches; } catch { return false; }
  };
  const placeMeter = (): void => {
    const s = meter.style;
    if (isLandscape()) {
      s.left = 'auto';
      s.right = 'calc(env(safe-area-inset-right) + 128px)';
      s.transform = 'none';
      s.bottom = 'calc(env(safe-area-inset-bottom) + 126px)';
      s.width = 'min(40vw, 320px)';
    } else {
      s.left = '50%';
      s.right = 'auto';
      s.transform = 'translateX(-50%)';
      s.bottom = 'calc(env(safe-area-inset-bottom) + 130px)';
      s.width = 'min(78vw, 360px)';
    }
  };
  // A narrow (phone portrait) screen: the game's own top HUD (money, minimap, Gnomlet buttons) fills the top 250 px,
  // so the hole strip and Card / Quit move down below it.
  const placeTop = (): void => {
    let narrow = false;
    try { narrow = typeof innerWidth === 'number' && innerWidth < 600 && !isLandscape(); } catch { /* no window */ }
    strip.style.top = narrow ? 'calc(env(safe-area-inset-top) + 250px)' : 'calc(env(safe-area-inset-top) + 56px)';
    const btnTop = narrow ? 'calc(env(safe-area-inset-top) + 352px)' : 'calc(env(safe-area-inset-top) + 8px)';
    cardBtn.style.top = btnTop;
    quitBtn.style.top = btnTop;
    banner.style.top = narrow ? 'calc(env(safe-area-inset-top) + 420px)' : 'calc(env(safe-area-inset-top) + 180px)';
  };
  const onResize = (): void => { placeMeter(); placeTop(); };
  placeTop();
  try { window.addEventListener('resize', onResize); } catch { /* no window: no relayout */ }
  placeMeter();

  return {
    show(on: boolean): void {
      box.style.display = on ? 'block' : 'none';
    },

    set(view: HudView): void {
      // Hole strip.
      stripHole.textContent = `Hole ${view.holeNumber} · ${view.holeName} · Par ${view.par}`;
      stripStroke.textContent = `Stroke ${view.strokes} · ${toParText(view.toPar)}`;
      stripShot.textContent = `${view.clubName} ${Math.round(view.clubYards)} yd · ${view.lieName} · ${Math.round(view.pinYards)} yd to pin`;
      windArrow.style.transform = `rotate(${(view.windRel * 180) / Math.PI}deg)`;
      windText.textContent = `${Math.round(view.windMph)} mph`;

      // Banner.
      banner.textContent = view.banner ?? '';
      banner.style.opacity = view.banner ? '1' : '0';

      // Meter: shown while swinging, and empty in 'aim' as the hint for the three taps.
      const aiming = view.phase === 'aim';
      const showMeter = view.meter !== null || aiming;
      meter.style.display = showMeter ? 'flex' : 'none';
      placeMeter();
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
      const aimRow: HTMLButtonElement[] = phase === 'aim' ? [aimLeft, aimRight, clubPrev, clubNext] : [];
      for (const b of [aimLeft, aimRight, clubPrev, clubNext]) b.style.display = aimRow.includes(b) ? 'flex' : 'none';
      const toBall = phase === 'walk' && !view.atBall;
      toBallBtn.style.display = toBall ? 'flex' : 'none';
      nextHoleBtn.style.display = phase === 'holed' ? 'flex' : 'none';
      placeRow(phase === 'aim' ? aimRow : toBall ? [toBallBtn] : phase === 'holed' ? [nextHoleBtn] : []);
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

      const table = document.createElement('table');
      table.style.cssText = 'width:100%;border-collapse:collapse;font-size:14px;';
      const addRow = (cells: string[], css: string): void => {
        const tr = document.createElement('tr');
        tr.style.cssText = css;
        for (const text of cells) {
          const td = document.createElement('td');
          td.style.cssText = 'padding:4px 6px;text-align:left;';
          td.textContent = text;
          tr.appendChild(td);
        }
        table.appendChild(tr);
      };
      addRow(['No.', 'Hole', 'Par', 'Score', 'Best'], 'font-weight:700;border-bottom:1px solid rgba(243,233,210,0.4);');
      for (const h of view.holes) {
        addRow(
          [String(h.number), h.name, String(h.par), h.strokes === null ? '–' : String(h.strokes), h.best === null ? '–' : String(h.best)],
          'border-bottom:1px solid rgba(243,233,210,0.15);',
        );
      }
      const total = document.createElement('tr');
      const totalCell = document.createElement('td');
      totalCell.style.cssText = 'padding:6px;font-weight:700;';
      totalCell.textContent = `Total ${view.total} (${toParText(view.toPar)})`;
      totalCell.colSpan = 5;
      total.appendChild(totalCell);
      table.appendChild(total);
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
      try { window.removeEventListener('resize', onResize); } catch { /* none */ }
      listeners.length = 0;
      box.remove?.();
    },
  };
}
