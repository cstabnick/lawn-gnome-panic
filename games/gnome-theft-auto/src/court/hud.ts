// Drainpipe Court HUD (E19 A5): the chalk scoreboard strip, the shot charge and turbo bars, touch buttons for every
// basketball action, the shootaround strip and the result card. DOM only, no game logic: the runtime calls the setters
// every frame and reads touch(). courtControl() is the pure mapping from input and touch to the player's control.
import type { InputState } from '../types';
import { registerActivityPanel, setActivityOn, setTouchActivity } from '../activityMode';
import { currentGlyphSet, onInputSourceChange } from '../ui/inputSource';
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

/** The activity mode for the court: holster the gun and keep only the stick (the court's own buttons replace the cluster). */
function setActivity(on: boolean): void {
  setActivityOn('court', on);
  try { setTouchActivity('court', on ? { stick: true, buttons: [] } : null); } catch { /* no real DOM (tests) */ }
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

  // Scoreboard: one chalk panel in the shared activity slot (top centre, under the top button row on a phone). It holds
  // the game score (two lines) or the shootaround line, and the QUIT button at its right end.
  const board = div('display:none;align-items:center;gap:8px;padding:5px 6px 5px 12px;pointer-events:auto;' + FONT + CHALK);
  board.id = 'court-board';
  const texts = div('flex:1 1 auto;min-width:0;text-align:center;');
  const stripScore = div('font-weight:700;font-size:16px;line-height:1.25;white-space:normal;');
  const stripSub = div('font-size:12px;line-height:1.3;opacity:0.9;');
  const shootLine = div('font-weight:700;font-size:16px;line-height:1.25;display:none;');
  texts.appendChild(stripScore);
  texts.appendChild(stripSub);
  texts.appendChild(shootLine);
  board.appendChild(texts);
  let unregisterBoard = (): void => {};
  try { unregisterBoard = registerActivityPanel(board); } catch { /* no real DOM: the board keeps no slot */ }

  // Bars: the shot charge (both modes) and the turbo (game only), bottom centre.
  const charge = bar('Shot', true);
  const turbo = bar('Turbo', false);
  turbo.wrap.style.bottom = 'calc(env(safe-area-inset-bottom) + 58px)';

  // Touch buttons: a bottom-right arc around SHOOT (the biggest). Key sub-labels show only for keyboard and pad players.
  const hints: HTMLElement[] = [];
  const button = (label: string, hint: string, css: string, aria: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.style.cssText = BTN + css;
    b.textContent = label;
    b.setAttribute?.('aria-label', aria);
    if (hint) {
      const h = div('font-size:10px;font-weight:400;opacity:0.85;margin-top:2px;', hint);
      hints.push(h);
      b.appendChild(h);
    }
    return b;
  };
  // The arc's slots: right/bottom of each button from the corner (SHOOT is 76 px at 12/16).
  const slot = (right: number, bottom: number, w: number, h: number): string => ABS
    + `right:calc(env(safe-area-inset-right) + ${right}px);bottom:calc(env(safe-area-inset-bottom) + ${bottom}px);`
    + `width:${w}px;height:${h}px;min-width:${w}px;min-height:${h}px;padding:0;`;
  const btnShoot = button('SHOOT', 'F / click', 'border-radius:50%;'
    + 'font-size:15px;background:radial-gradient(circle at 35% 30%, #f9f3d8, #b9b08f);color:#1b2a1f;', 'Shoot (hold)');
  const btnTurbo = button('TURBO', 'Shift', '', 'Turbo (hold)');
  const btnPass = button('PASS', 'Space', '', 'Pass');
  const btnFake = button('FAKE', 'Q', '', 'Fake');
  // Portrait / desktop: SHOOT in the corner, TURBO beside it, PASS and FAKE curving up. Landscape phones are short and keep
  // the minimap column free: the three small buttons form a tight cluster to the left of SHOOT instead.
  const compact = (): boolean => {
    try { return window.innerWidth < 700 || window.innerHeight < 500; } catch { return false; }
  };
  const placeArc = (): void => {
    const low = (() => { try { return window.innerHeight < 500; } catch { return false; } })();
    // The dock (🔭 and friends) hides in activity mode (activityMode.ts), so the arc keeps the corner on every screen.
    const dx = 0;
    const at = (b: HTMLElement, r: number, bt: number, w: number, h = 48): void => {
      b.style.position = 'absolute';
      b.style.right = `calc(env(safe-area-inset-right) + ${r + dx}px)`;
      b.style.bottom = `calc(env(safe-area-inset-bottom) + ${bt}px)`;
      b.style.width = b.style.minWidth = `${w}px`;
      b.style.height = b.style.minHeight = `${h}px`;
      b.style.padding = '0';
    };
    at(btnShoot, 12, 16, 76, 76);
    at(btnTurbo, 98, low ? 16 : 36, 68);
    at(btnPass, low ? 98 : 92, low ? 72 : 100, 68);
    at(btnFake, low ? 174 : 20, low ? 44 : 110, 60);
  };
  placeArc();
  const stack = div(ABS + 'left:0;top:0;right:0;bottom:0;pointer-events:none;' + FONT);
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

  // QUIT lives inside the scoreboard, right end.
  const quitBtn = button('QUIT', 'E', 'position:static;flex:0 0 auto;width:56px;height:46px;padding:0;border-radius:10px;', 'Quit court');
  quitBtn.addEventListener('pointerdown', (e) => { swallow(e); pressed.quitPressed = true; });
  board.appendChild(quitBtn);

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

  box.appendChild(board);
  box.appendChild(charge.wrap);
  box.appendChild(turbo.wrap);
  box.appendChild(stack);
  box.appendChild(card);
  ui.appendChild(box);

  // The meters sit bottom centre on a wide screen; on a phone they move up and left so the arc and the stick stay clear.
  const placeBars = (): void => {
    for (const [bw, lift] of [[charge.wrap, 16], [turbo.wrap, 52]] as const) {
      if (compact()) {
        bw.style.left = 'calc(env(safe-area-inset-left) + 16px)';
        bw.style.transform = 'none';
        bw.style.width = 'min(200px,calc(100vw - 260px))';
        bw.style.bottom = `calc(env(safe-area-inset-bottom) + ${lift + 190}px)`;
      } else {
        bw.style.left = '50%';
        bw.style.transform = 'translateX(-50%)';
        bw.style.width = 'min(60vw,320px)';
        bw.style.bottom = `calc(env(safe-area-inset-bottom) + ${lift}px)`;
      }
    }
  };
  const showHints = (): void => {
    const on = currentGlyphSet() !== 'touch';
    for (const h of hints) h.style.display = on ? 'block' : 'none';
  };
  const onResize = (): void => { placeBars(); placeArc(); };
  placeBars();
  showHints();
  const offSource = onInputSourceChange(showHints);
  try { window.addEventListener('resize', onResize); } catch { /* no window: no relayout */ }

  const applyMode = (): void => {
    const on = mode !== 'none';
    const game = mode === 'game';
    box.style.display = on ? 'block' : 'none';
    board.style.display = on ? 'flex' : 'none';
    stripScore.style.display = game ? 'block' : 'none';
    stripSub.style.display = game ? 'block' : 'none';
    shootLine.style.display = on && !game ? 'block' : 'none';
    turbo.wrap.style.display = game ? 'flex' : 'none';
    for (const b of [btnTurbo, btnPass, btnFake]) b.style.display = game ? 'flex' : 'none';
    btnShoot.style.display = on ? 'flex' : 'none';
    quitBtn.style.display = on ? 'flex' : 'none';
    stack.style.display = on ? 'block' : 'none';
  };
  applyMode();

  const setFill = (f: HTMLDivElement, v: number): void => {
    f.style.width = frac(v) * 100 + '%';
  };

  return {
    show(next: 'none' | 'game' | 'shootaround'): void {
      mode = next;
      applyMode();
      setActivity(next !== 'none');
    },

    setGame(v: PickupView, names: [string, string]): void {
      stripScore.textContent = `${names[0]} ${v.score[0]} : ${v.score[1]} ${names[1]}`;
      const phase = { tipoff: ' · Tip-off', scored: ' · Basket!', finished: ' · Final', live: '' }[v.phase];
      stripSub.textContent = `to ${v.target} · ${clock(v.t)}${phase}`;
      setFill(charge.fill, v.charge);
      setFill(turbo.fill, v.turbo / 100);
    },

    setShoot(s: { charge: number; makes: number; shots: number; three: boolean }): void {
      shootLine.textContent = `Shootaround ${s.makes}/${s.shots}${s.three ? ' - three!' : ''}`;
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
      offSource();
      unregisterBoard();
      setActivity(false);
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
