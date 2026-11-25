// E25 garbage: the lift-arm minigame's on-screen controls (one big hold button, a side-view gauge of the swing and the
// tip zone). Owns a LiftState and steps it (lift.ts).
import { firstPad } from '@lawn/gamepad';
import { isTyping, KEYS } from '../../keys';
import { createLift, liftResult, stepLift } from './lift';
import { ARM, LIFT } from './types';
import type { LiftEvent, LiftResult, LiftState } from './types';

export interface LiftUiOpts {
  heavy: boolean;
  /** Every event as it happens (sounds, toasts). */
  onEvent(e: LiftEvent): void;
  /** The bin is set down: the result. The UI has closed itself. */
  onDone(r: LiftResult): void;
  /** The player left without finishing (the "Leave it" button / Escape). The UI has closed itself. */
  onCancel(): void;
}

export interface LiftUi {
  /** Every frame while open: reads the button and steps the lift. */
  update(dt: number): void;
  /** The live state (bins.ts poses the arm and bin from it). */
  state(): LiftState;
  isOpen(): boolean;
  /** Close at once (no callbacks). */
  close(): void;
}

const ID = 'gta-lift-ui';
const CSS_ID = 'gta-lift-ui-css';
const CSS = `
#gta-lift-ui{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 128px);
  z-index:30;box-sizing:border-box;width:min(300px,calc(100vw - 24px));padding:8px 10px 10px;border-radius:16px;
  background:rgba(30,36,28,.88);border:2px solid #8bc34a;color:#f3f7e8;font-family:system-ui,sans-serif;
  display:flex;flex-direction:column;align-items:center;gap:6px;user-select:none;-webkit-user-select:none;
  touch-action:none;pointer-events:auto}
#gta-lift-ui .gl-gauge{width:260px;max-width:100%;height:auto;aspect-ratio:260/140;display:block;border-radius:10px;
  background:#cfe8f5}
#gta-lift-ui .gl-gauge.shake{animation:gl-shake .28s}
#gta-lift-ui .gl-gauge.flash{animation:gl-flash .4s}
@keyframes gl-shake{0%,100%{translate:0}20%{translate:-6px 2px}50%{translate:6px -2px}80%{translate:-3px 0}}
@keyframes gl-flash{0%{filter:brightness(1.9) saturate(1.6)}100%{filter:none}}
#gta-lift-ui .gl-main{display:flex;flex-direction:column;align-items:center;gap:4px}
#gta-lift-ui .gl-btn{width:96px;height:96px;border-radius:50%;border:4px solid #fff;background:#43a047;color:#fff;
  font:800 20px system-ui,sans-serif;touch-action:none;cursor:pointer;box-shadow:0 4px 0 #1b5e20;padding:0}
#gta-lift-ui .gl-btn.down{transform:translateY(3px);box-shadow:0 1px 0 #1b5e20;background:#2e7d32}
#gta-lift-ui .gl-btn.zone{animation:gl-pulse .35s infinite alternate;background:#7cb342}
@keyframes gl-pulse{from{box-shadow:0 4px 0 #1b5e20,0 0 0 0 rgba(255,235,59,.9)}to{box-shadow:0 4px 0 #1b5e20,0 0 0 12px rgba(255,235,59,0)}}
#gta-lift-ui .gl-hint{min-height:18px;font-size:14px;font-weight:700;text-align:center;color:#dcedc8}
#gta-lift-ui .gl-leave{min-width:96px;height:44px;border-radius:12px;border:2px solid #bbb;background:rgba(0,0,0,.35);
  color:#eee;font:700 14px system-ui,sans-serif;cursor:pointer;touch-action:none}
@media (max-height:520px) and (orientation:landscape){
  #gta-lift-ui{bottom:calc(env(safe-area-inset-bottom,0px) + 6px);width:auto;max-width:calc(100vw - 24px);
    flex-direction:row;align-items:center;gap:10px;padding:6px 10px}
  #gta-lift-ui .gl-gauge{width:200px}
  #gta-lift-ui .gl-btn{width:88px;height:88px;font-size:18px}
}
/* Wide screens: the panel moves to the right edge so the lorry and the bin stay visible in the middle. */
@media (min-width:900px) and (min-height:521px){
  #gta-lift-ui{left:auto;right:calc(env(safe-area-inset-right,0px) + 16px);transform:none;bottom:calc(env(safe-area-inset-bottom,0px) + 24px)}
}
`;

const SVGNS = 'http://www.w3.org/2000/svg';
// Gauge geometry (viewBox 260 x 140): arm pivot on the kerb side of the lorry, ground at y 126.
const PX = 138;
const PY = 50;
const ARM_LEN = 52;
const GROUND = 126;

function ensureCss(): void {
  if (document.getElementById(CSS_ID)) return;
  const s = document.createElement('style');
  s.id = CSS_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent?.appendChild(e);
  return e;
}

function bump(e: Element, cls: string): void {
  e.classList.remove(cls);
  void (e as HTMLElement).offsetWidth;
  e.classList.add(cls);
}

/** A point on the arm's circle at tilt `t` and radius r from the pivot (arm hangs down at 0, swings toward +x). */
function armPoint(t: number, r: number): [number, number] {
  const a = ARM.max * t;
  return [PX + r * Math.sin(a), PY + r * Math.cos(a)];
}

function wedge(t0: number, t1: number, r0: number, r1: number): string {
  const p = (t: number, r: number): string => armPoint(t, r).map((n) => n.toFixed(1)).join(' ');
  return `M${p(t0, r0)} L${p(t0, r1)} L${p(t1, r1)} L${p(t1, r0)}Z`;
}

export function openLiftUi(ui: HTMLElement, opts: LiftUiOpts): LiftUi {
  ensureCss();
  const s = createLift(opts.heavy);
  let open = true;

  const root = document.createElement('div');
  root.id = ID;
  root.dataset.gnlTouch = 'none';

  // Gauge.
  const gauge = svg('svg', { class: 'gl-gauge', viewBox: '0 0 260 140', role: 'img', 'aria-label': 'Lift arm gauge' });
  svg('rect', { x: 0, y: GROUND, width: 260, height: 14, fill: '#7a8f5a' }, gauge);
  // Lorry side in silhouette.
  svg('rect', { x: 150, y: 58, width: 100, height: 60, rx: 6, fill: '#37474f' }, gauge);
  svg('rect', { x: 150, y: 44, width: 54, height: 16, rx: 3, fill: '#455a64' }, gauge);
  svg('rect', { x: 206, y: 70, width: 40, height: 22, rx: 3, fill: '#90caf9' }, gauge);
  svg('circle', { cx: 176, cy: 120, r: 9, fill: '#212121' }, gauge);
  svg('circle', { cx: 232, cy: 120, r: 9, fill: '#212121' }, gauge);
  // Marks: kerb mark (lower), centre tick (grab), tip zone and spill mark (lift).
  const kerb = svg('rect', { x: PX - 22, y: GROUND - 2, width: 44, height: 4, rx: 2, fill: '#ffeb3b' }, gauge);
  const tick = svg('path', { d: `M${PX} ${GROUND - 36} v36`, stroke: '#ffeb3b', 'stroke-width': 3, 'stroke-dasharray': '4 3' }, gauge);
  const zone = svg('path', { d: wedge(LIFT.tipMin, LIFT.tipMax, ARM_LEN - 6, ARM_LEN + 16), fill: '#43a047', opacity: 0.95 }, gauge);
  const spill = svg('path', { d: wedge(LIFT.spillAt - 0.02, LIFT.spillAt + 0.02, ARM_LEN - 8, ARM_LEN + 20), fill: '#e53935' }, gauge);
  // The arm, then the bin on the claw.
  const arm = svg('line', { x1: PX, y1: PY, x2: PX, y2: PY + ARM_LEN, stroke: '#ff8f00', 'stroke-width': 7, 'stroke-linecap': 'round' }, gauge);
  svg('circle', { cx: PX, cy: PY, r: 7, fill: '#ffb300', stroke: '#6d4c00', 'stroke-width': 2 }, gauge);
  const bin = svg('g', {}, gauge);
  svg('rect', { x: -10, y: 0, width: 20, height: 26, rx: 3, fill: opts.heavy ? '#7a5230' : '#3f8f3a', stroke: '#1b1b1b', 'stroke-width': 2 }, bin);
  svg('rect', { x: -12, y: -3, width: 24, height: 5, rx: 2, fill: '#2b2b2b' }, bin);
  const claw = svg('circle', { r: 4, fill: '#ffb300', stroke: '#6d4c00', 'stroke-width': 2 }, gauge);
  root.appendChild(gauge);

  // Button, hint, leave.
  const main = document.createElement('div');
  main.className = 'gl-main';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'gl-btn';
  btn.dataset.gnlTouch = 'none';
  const hint = document.createElement('div');
  hint.className = 'gl-hint';
  const leave = document.createElement('button');
  leave.type = 'button';
  leave.className = 'gl-leave';
  leave.textContent = 'Leave it';
  leave.dataset.gnlTouch = 'none';
  main.append(btn, hint, leave);
  root.appendChild(main);
  ui.appendChild(root);

  // Input.
  let pointerHeld = false;
  let keyHeld = false;
  let prevHeld = false;
  const down = (e: PointerEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    pointerHeld = true;
    try { btn.setPointerCapture(e.pointerId); } catch { /* the window listeners still release it */ }
  };
  const up = (): void => { pointerHeld = false; };
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointercancel', up);
  btn.addEventListener('pointerleave', up);
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  const isHoldKey = (e: KeyboardEvent): boolean => e.code === 'Space' || e.code === KEYS.jobAction;
  const onKeyDown = (e: KeyboardEvent): void => {
    if (isTyping(e)) return;
    if (e.code === 'Escape') {
      e.preventDefault();
      cancel();
      return;
    }
    if (!isHoldKey(e)) return;
    e.preventDefault();
    if (e.repeat) return;
    keyHeld = true;
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    if (isHoldKey(e)) keyHeld = false;
  };
  const onBlur = (): void => { pointerHeld = false; keyHeld = false; };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  function teardown(): void {
    open = false;
    btn.removeEventListener('pointerdown', down);
    btn.removeEventListener('pointerup', up);
    btn.removeEventListener('pointercancel', up);
    btn.removeEventListener('pointerleave', up);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    root.remove();
  }
  function cancel(): void {
    if (!open) return;
    teardown();
    opts.onCancel();
  }
  leave.addEventListener('click', cancel);

  function padHeld(): boolean {
    const p = firstPad();
    if (!p) return false;
    return !!p.buttons[0]?.pressed || (p.buttons[7]?.value ?? 0) > 0.5;
  }

  let lastLabel = '';
  function render(held: boolean): void {
    const phase = s.phase;
    const label = phase === 'grab' ? 'Grab' : phase === 'lift' ? 'Lift' : 'Lower';
    if (label !== lastLabel) {
      lastLabel = label;
      btn.textContent = label;
      hint.textContent = phase === 'grab' ? 'Tap as the claw passes the middle'
        : phase === 'lift' ? 'Let go in the green'
        : 'Stop when it swings to the middle';
    }
    zone.style.display = spill.style.display = phase === 'lift' ? '' : 'none';
    tick.style.display = phase === 'grab' ? '' : 'none';
    kerb.style.display = phase === 'lower' ? '' : 'none';
    btn.classList.toggle('down', held);
    btn.classList.toggle('zone', phase === 'lift' && held && s.tilt >= LIFT.tipMin && s.tilt <= LIFT.tipMax);
    // Arm and bin: the claw hangs at the arm's tip, swinging sideways near the ground.
    const a = ARM.max * s.tilt;
    const [cx0, cy] = armPoint(s.tilt, ARM_LEN);
    const cx = cx0 + s.swing * 26 * (1 - s.tilt);
    arm.setAttribute('x2', cx.toFixed(1));
    arm.setAttribute('y2', cy.toFixed(1));
    claw.setAttribute('cx', cx.toFixed(1));
    claw.setAttribute('cy', cy.toFixed(1));
    const deg = (-a * 180) / Math.PI;
    bin.setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${deg.toFixed(1)})`);
  }
  render(false);

  return {
    update(dt) {
      if (!open) return;
      const held = pointerHeld || keyHeld || padHeld();
      const e = stepLift(s, dt, { press: held && !prevHeld, hold: held });
      prevHeld = held;
      if (e) {
        if (e === 'grab-miss' || e === 'spill') bump(gauge, 'shake');
        else if (e === 'tipped') bump(gauge, 'flash');
        opts.onEvent(e);
      }
      render(held);
      if (s.phase === 'done') {
        const r = liftResult(s);
        teardown();
        opts.onDone(r);
      }
    },
    state: () => s,
    isOpen: () => open,
    close() { if (open) teardown(); },
  };
}

