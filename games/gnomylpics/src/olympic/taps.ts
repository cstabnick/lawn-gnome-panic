// View-side input for the tap events: A / D (or arrows) alternate taps, an action button, and touch buttons.
// Use only inside createView (it touches the DOM). The exported names and types are final.
import type { PadState } from '@lawn/party';
import type { TapInput } from './run';

export interface TapperOpts {
  /** Label of the on-screen action button (e.g. 'JUMP'). No label: no action button (Space / Enter still count). */
  actLabel?: string;
  /** 'press' (default): acts counts when the action goes down. 'release': it counts when it comes back up, and
   *  holdS is how long it was held. */
  actOn?: 'press' | 'release';
  /** Show the on-screen left / right tap buttons (default true). */
  tapButtons?: boolean;
}

export interface Tapper {
  /** Call from view.input every frame. Returns the cumulative counters to send. */
  sample(pad: Readonly<PadState>): TapInput;
  /** Side of the last tap: -1 left, 1 right, 0 none yet. */
  readonly lastSide: -1 | 0 | 1;
  /** performance.now() of the last slip, or -Infinity. For a local "STUMBLE!" flash. */
  readonly lastSlipAt: number;
  /** True while the action is held (as of the last sample). */
  readonly actDown: boolean;
  /** Seconds the action is being held now (actDown) or was held the last time (after release). */
  readonly holdS: number;
  dispose(): void;
}

/** Applies one press on `side` to the tap state. Same side as the last tap is a slip (lastSide unchanged);
 *  otherwise it is a tap and lastSide becomes `side`. The very first press (lastSide 0) is a tap. */
export function applyTap(st: { taps: number; slips: number; lastSide: -1 | 0 | 1 }, side: -1 | 1): 'tap' | 'slip' {
  if (st.lastSide === side) {
    st.slips += 1;
    return 'slip';
  }
  st.taps += 1;
  st.lastSide = side;
  return 'tap';
}

const LEFT_CODES = ['KeyA', 'ArrowLeft'];
const RIGHT_CODES = ['KeyD', 'ArrowRight'];

export function createTapper(ui: HTMLElement, opts: TapperOpts = {}): Tapper {
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const showTapButtons = opts.tapButtons !== false && coarse;
  const showAction = opts.actLabel !== undefined;
  const onRelease = opts.actOn === 'release';

  const st = { taps: 0, slips: 0, lastSide: 0 as -1 | 0 | 1 };
  let acts = 0;
  let lastSlipAt = -Infinity;
  let buttonHeld = false;
  let actDown = false;
  let downSince = 0;
  let holdS = 0;

  function tap(side: -1 | 1): void {
    if (applyTap(st, side) === 'slip') lastSlipAt = performance.now();
  }

  const onKey = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    let side: -1 | 1 | null = null;
    if (LEFT_CODES.includes(e.code)) side = -1;
    else if (RIGHT_CODES.includes(e.code)) side = 1;
    if (side === null) return;
    e.preventDefault();
    tap(side);
  };
  window.addEventListener('keydown', onKey);

  let container: HTMLDivElement | null = null;
  if (showTapButtons || showAction) {
    container = document.createElement('div');
    container.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    ui.appendChild(container);
  }

  if (container && showTapButtons) {
    const size = 'min(26vw,150px)';
    const makeTapButton = (side: -1 | 1): void => {
      const b = document.createElement('button');
      b.textContent = side < 0 ? '◀' : '▶';
      const horiz = side < 0 ? 'left:4vw' : 'right:4vw';
      b.style.cssText =
        `position:absolute;${horiz};bottom:6vh;width:${size};height:${size};border-radius:50%;` +
        'background:rgba(255,255,255,0.18);border:3px solid rgba(255,255,255,0.6);color:#fff;' +
        'font-size:48px;padding:0;cursor:pointer;pointer-events:auto;touch-action:none';
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        tap(side);
      });
      container!.appendChild(b);
    };
    makeTapButton(-1);
    makeTapButton(1);
  }

  if (container && showAction) {
    const b = document.createElement('button');
    b.textContent = opts.actLabel! + (coarse ? '' : ' (Space)');
    b.style.cssText =
      'position:absolute;left:50%;transform:translateX(-50%);bottom:6vh;padding:18px 34px;' +
      'font:800 26px system-ui;background:#ffd54f;color:#222;border:none;border-radius:40px;' +
      'cursor:pointer;pointer-events:auto;touch-action:none';
    b.addEventListener('pointerdown', (e) => {
      buttonHeld = true;
      e.preventDefault();
    });
    const release = (): void => {
      buttonHeld = false;
    };
    b.addEventListener('pointerup', release);
    b.addEventListener('pointercancel', release);
    b.addEventListener('pointerleave', release);
    container.appendChild(b);
  }

  return {
    sample(pad) {
      const down = pad.a || buttonHeld;
      const now = performance.now();
      if (down && !actDown) {
        downSince = now;
        if (!onRelease) acts += 1;
      }
      if (down) {
        if (onRelease) holdS = (now - downSince) / 1000;
      } else if (actDown) {
        if (onRelease) {
          holdS = (now - downSince) / 1000;
          acts += 1;
        }
      }
      actDown = down;
      return { taps: st.taps, slips: st.slips, acts };
    },
    get lastSide() {
      return st.lastSide;
    },
    get lastSlipAt() {
      return lastSlipAt;
    },
    get actDown() {
      return actDown;
    },
    get holdS() {
      return holdS;
    },
    dispose() {
      window.removeEventListener('keydown', onKey);
      container?.remove();
      container = null;
    },
  };
}
