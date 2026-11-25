// Drainpipe Court HUD (E19 A5): the chalk scoreboard strip, the shot charge and turbo bars, touch buttons for every
// basketball action, the shootaround strip and the result card. DOM only, no game logic: the runtime calls the setters
// every frame and reads touch(). courtControl() is the pure mapping from input and touch to the player's control.
import type { InputState } from '../types';
import type { CourtControl, CourtTouch, PickupView } from './types';

export interface CourtHud {
  show(mode: 'none' | 'game' | 'shootaround'): void;
  /** During a game, every frame. names: [home team, away team], e.g. ['You & Pansy', 'Swish & Lintel']. */
  setGame(v: PickupView, names: [string, string]): void;
  /** During a shootaround, every frame. */
  setShoot(s: { charge: number; makes: number; shots: number; three: boolean }): void;
  /** The end card ('You win 11-7. Swish gives the stake back.'), or null to hide. Has a Close button (44 px). */
  result(text: string | null): void;
  /** Touch buttons this frame; pressed flags are cleared by the read. */
  touch(): CourtTouch;
  dispose(): void;
}

// Chalk-on-blackboard look: dark green panel, off-white text, a wooden frame.
const FONT = 'font-family:system-ui,sans-serif;';
const SHADOW = 'text-shadow:0 1px 2px #000;';
const CHALK = 'background:rgba(16,46,30,0.92);color:#f4f1e6;' + SHADOW + 'border-radius:8px;border:3px solid #7a5a3a;'
  + 'box-sizing:border-box;';
const BTN = 'pointer-events:auto;touch-action:none;box-sizing:border-box;min-width:44px;min-height:44px;padding:0 12px;'
  + 'border-radius:22px;border:2px solid rgba(244,241,230,0.75);background:rgba(16,46,30,0.7);color:#f4f1e6;' + SHADOW
  + 'font:700 15px/1 system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;'
  + 'cursor:pointer;';
const ABS = 'position:absolute;';
const SAFE_R = 'right:calc(env(safe-area-inset-right) + 12px);';

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

/** Stops propagation only (so the HUD's own panels still get their touches). */
function stop(e: Event): void {
  e.stopPropagation?.();
}

/** mm:ss of a game clock in seconds. */
function clock(t: number): string {
  const s = Math.max(0, Math.floor(t));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function frac(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Labelled bar; the optional band marks the sweet spot 0.72..0.88 of the fill. */
function bar(caption: string, band: boolean): { wrap: HTMLDivElement; fill: HTMLDivElement } {
  const wrap = div(ABS + 'left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 16px);'
    + 'display:flex;flex-direction:column;align-items:stretch;gap:4px;width:min(60vw,320px);box-sizing:border-box;'
    + 'pointer-events:none;' + FONT);
  wrap.appendChild(div('font-size:12px;text-align:center;' + SHADOW + 'color:#f4f1e6;', caption));
  const track = div('position:relative;height:16px;border-radius:8px;overflow:hidden;background:rgba(0,0,0,0.45);'
    + 'border:2px solid #f4f1e6;box-sizing:border-box;');
  const fill = div(ABS + 'left:0;top:0;bottom:0;width:0%;background:#f4f1e6;');
  if (band) track.appendChild(div(ABS + 'top:0;bottom:0;left:72%;width:16%;background:rgba(120,220,120,0.6);'));
  track.appendChild(fill);
  wrap.appendChild(track);
  return { wrap, fill };
}

export function createCourtHud(ui: HTMLElement): CourtHud {
  let mode: 'none' | 'game' | 'shootaround' = 'none';
  const pressed = { shootHeld: false, turboHeld: false, passPressed: false, fakePressed: false, quitPressed: false };

  const box = div(
    'position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:40;display:none;' + FONT,
  );
  box.id = 'court-hud';
  box.addEventListener('pointerdown', stop);
  box.addEventListener('mousedown', stop);
  box.addEventListener('touchstart', stop);

  // Top strip: the game scoreboard, or the shootaround line. Below the game's own top HUD.
  const topCss = ABS + 'left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 64px);'
    + 'max-width:min(92vw,520px);box-sizing:border-box;padding:6px 12px;text-align:center;pointer-events:none;'
    + 'white-space:normal;' + CHALK;
  const gameStrip = div(topCss);
  const stripScore = div('font-weight:700;font-size:17px;line-height:1.25;');
  const stripSub = div('font-size:13px;line-height:1.3;');
  gameStrip.appendChild(stripScore);
  gameStrip.appendChild(stripSub);
  const shootStrip = div(topCss + 'font-weight:700;font-size:16px;line-height:1.25;');

  // Bars: the shot charge (both modes) and the turbo (game only), bottom centre.
  const charge = bar('Shot', true);
  const turbo = bar('Turbo', false);
  turbo.wrap.style.bottom = 'calc(env(safe-area-inset-bottom) + 58px)';

  // Touch buttons, right side, stacked above the game's own bottom-right buttons (landscape: lower, see placeStack).
  const stack = div(ABS + SAFE_R + 'bottom:calc(env(safe-area-inset-bottom) + 170px);display:flex;flex-direction:column;'
    + 'align-items:flex-end;gap:8px;pointer-events:none;' + FONT);
  const button = (label: string, hint: string, css: string, aria: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.style.cssText = BTN + css;
    b.textContent = label;
    b.setAttribute?.('aria-label', aria);
    b.appendChild(div('font-size:10px;font-weight:400;opacity:0.85;margin-top:2px;', hint));
    return b;
  };
  const btnShoot = button('SHOOT', 'F / click', 'width:72px;height:72px;min-width:72px;min-height:72px;border-radius:50%;'
    + 'font-size:15px;background:radial-gradient(circle at 35% 30%, #f9f3d8, #b9b08f);color:#1b2a1f;', 'Shoot (hold)');
  const btnTurbo = button('TURBO', 'Shift', '', 'Turbo (hold)');
  const btnPass = button('PASS', 'Space', '', 'Pass');
  const btnFake = button('FAKE', 'Q', '', 'Fake');
  stack.appendChild(btnShoot);
  stack.appendChild(btnTurbo);
  stack.appendChild(btnPass);
  stack.appendChild(btnFake);

  // Hold buttons: down = held, up / cancel / leave = released. Taps: pressed once, read once.
  for (const [b, key] of [[btnShoot, 'shootHeld'], [btnTurbo, 'turboHeld']] as const) {
    b.addEventListener('pointerdown', (e) => { swallow(e); pressed[key] = true; });
    for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
      b.addEventListener(type, (e) => { swallow(e); pressed[key] = false; });
    }
  }
  for (const [b, key] of [[btnPass, 'passPressed'], [btnFake, 'fakePressed']] as const) {
    b.addEventListener('pointerdown', (e) => { swallow(e); pressed[key] = true; });
  }

  // QUIT, top right, below the strip.
  const quitBtn = button('QUIT', 'E', ABS + 'top:calc(env(safe-area-inset-top) + 132px);'
    + 'right:calc(env(safe-area-inset-right) + 12px);', 'Quit court');
  quitBtn.addEventListener('pointerdown', (e) => { swallow(e); pressed.quitPressed = true; });

  // Result card: centred, with a Close button.
  const card = div(ABS + 'left:50%;top:50%;transform:translate(-50%,-50%);width:min(360px,92vw);box-sizing:border-box;'
    + 'padding:16px;text-align:center;pointer-events:auto;display:none;' + CHALK + 'box-shadow:0 6px 18px rgba(0,0,0,0.5);');
  const cardText = div('font-weight:700;font-size:18px;line-height:1.35;margin-bottom:12px;');
  const closeBtn = button('Close', '', 'margin:0 auto;', 'Close result');
  closeBtn.addEventListener('pointerdown', (e) => {
    swallow(e);
    card.style.display = 'none';
  });
  card.appendChild(cardText);
  card.appendChild(closeBtn);
  card.addEventListener('pointerdown', stop);

  box.appendChild(gameStrip);
  box.appendChild(shootStrip);
  box.appendChild(charge.wrap);
  box.appendChild(turbo.wrap);
  box.appendChild(stack);
  box.appendChild(quitBtn);
  box.appendChild(card);
  ui.appendChild(box);

  // Landscape phones are short: the stack drops to the corner so it fits above the edge.
  const isLandscape = (): boolean => {
    try { return typeof matchMedia === 'function' && matchMedia('(orientation: landscape)').matches; } catch { return false; }
  };
  const placeStack = (): void => {
    stack.style.bottom = isLandscape()
      ? 'calc(env(safe-area-inset-bottom) + 12px)'
      : 'calc(env(safe-area-inset-bottom) + 170px)';
  };
  const onResize = (): void => placeStack();
  placeStack();
  try { window.addEventListener('resize', onResize); } catch { /* no window: no relayout */ }

  const applyMode = (): void => {
    const on = mode !== 'none';
    const game = mode === 'game';
    box.style.display = on ? 'block' : 'none';
    gameStrip.style.display = game ? 'block' : 'none';
    shootStrip.style.display = mode === 'shootaround' ? 'block' : 'none';
    turbo.wrap.style.display = game ? 'flex' : 'none';
    for (const b of [btnTurbo, btnPass, btnFake]) b.style.display = game ? 'flex' : 'none';
    btnShoot.style.display = on ? 'flex' : 'none';
    quitBtn.style.display = on ? 'flex' : 'none';
    stack.style.display = on ? 'flex' : 'none';
  };
  applyMode();

  const setFill = (f: HTMLDivElement, v: number): void => {
    f.style.width = frac(v) * 100 + '%';
  };

  return {
    show(next: 'none' | 'game' | 'shootaround'): void {
      mode = next;
      applyMode();
    },

    setGame(v: PickupView, names: [string, string]): void {
      stripScore.textContent = `${names[0]} ${v.score[0]} : ${v.score[1]} ${names[1]}`;
      const phase = { tipoff: ' · Tip-off', scored: ' · Basket!', finished: ' · Final', live: '' }[v.phase];
      stripSub.textContent = `to ${v.target} · ${clock(v.t)}${phase}`;
      setFill(charge.fill, v.charge);
      setFill(turbo.fill, v.turbo / 100);
    },

    setShoot(s: { charge: number; makes: number; shots: number; three: boolean }): void {
      shootStrip.textContent = `Shootaround ${s.makes}/${s.shots}${s.three ? ' - three!' : ''}`;
      setFill(charge.fill, s.charge);
    },

    result(text: string | null): void {
      if (text === null) {
        card.style.display = 'none';
        cardText.textContent = '';
        return;
      }
      cardText.textContent = text;
      card.style.display = 'block';
    },

    touch(): CourtTouch {
      const out: CourtTouch = {
        shootHeld: pressed.shootHeld,
        turboHeld: pressed.turboHeld,
        passPressed: pressed.passPressed,
        fakePressed: pressed.fakePressed,
        quitPressed: pressed.quitPressed,
      };
      pressed.passPressed = false;
      pressed.fakePressed = false;
      pressed.quitPressed = false;
      return out;
    },

    dispose(): void {
      try { window.removeEventListener('resize', onResize); } catch { /* none */ }
      box.remove?.();
    },
  };
}

/** The player's basketball control. The broadcast camera looks north (screen right = +x, screen up = -z), so
 *  moveZ = -moveY. prevShootDown: whether shoot was down last frame (for the pressed/released edges). */
export function courtControl(inp: InputState, touch: CourtTouch, prevShootDown: boolean): CourtControl {
  const shootDown = !!inp.fire || touch.shootHeld;
  return {
    moveX: inp.moveX,
    // `|| 0` turns -0 into 0 when the stick is centred.
    moveZ: -inp.moveY || 0,
    turbo: !!inp.boost || touch.turboHeld,
    shootDown,
    shootPressed: shootDown && !prevShootDown,
    shootReleased: !shootDown && prevShootDown,
    passPressed: !!inp.jump || touch.passPressed,
    fakePressed: !!inp.switchGun || touch.fakePressed,
  };
}
