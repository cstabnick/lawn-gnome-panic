// Mobile touch controls: virtual thumbstick (outer ring sprints), right-half camera drag, >=48px action buttons.
import type { MobileInputState } from './input';

export interface MobileControlsHandle {
  setVisible: (v: boolean) => void;
  setInteractVisible: (v: boolean, label?: string) => void;
}

export function mountMobileControls(uiParent: HTMLElement, mobile: MobileInputState): MobileControlsHandle {
  const isTouch = matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).get('touch') === '1';

  const root = document.createElement('div');
  root.id = 'gs-mobile';
  root.style.cssText = `
    position:fixed;inset:0;pointer-events:none;z-index:20;
    display:${isTouch ? 'block' : 'none'};
    padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  `;
  uiParent.appendChild(root);

  // Left virtual thumbstick zone
  const stickZone = document.createElement('div');
  stickZone.style.cssText = 'position:absolute;left:16px;bottom:22px;width:128px;height:128px;border-radius:50%;background:rgba(15,18,28,0.45);border:2px solid rgba(212,184,122,0.35);pointer-events:auto;touch-action:none;';
  const knob = document.createElement('div');
  knob.style.cssText = 'position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:rgba(212,184,122,0.65);border:2px solid #f4e6c2;pointer-events:none;';
  stickZone.appendChild(knob);
  root.appendChild(stickZone);

  let stickId: number | null = null;
  let stickCx = 0;
  let stickCy = 0;

  stickZone.addEventListener('pointerdown', (e) => {
    stickId = e.pointerId;
    stickZone.setPointerCapture(e.pointerId);
    const rect = stickZone.getBoundingClientRect();
    stickCx = rect.left + rect.width / 2;
    stickCy = rect.top + rect.height / 2;
    updateStick(e.clientX, e.clientY);
  });
  stickZone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== stickId) return;
    updateStick(e.clientX, e.clientY);
  });
  const endStick = (e: PointerEvent) => {
    if (e.pointerId !== stickId) return;
    stickId = null;
    mobile.moveX = 0;
    mobile.moveZ = 0;
    mobile.sprint = false;
    knob.style.transform = 'translate(0px,0px)';
  };
  stickZone.addEventListener('pointerup', endStick);
  stickZone.addEventListener('pointercancel', endStick);

  function updateStick(x: number, y: number): void {
    const dx = x - stickCx;
    const dy = y - stickCy;
    const maxR = 44;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(maxR, dist);
    const ang = Math.atan2(dy, dx);
    const kx = Math.cos(ang) * clamped;
    const ky = Math.sin(ang) * clamped;
    knob.style.transform = `translate(${kx}px, ${ky}px)`;
    mobile.moveX = kx / maxR;
    mobile.moveZ = ky / maxR;
    mobile.sprint = dist > maxR * 0.92;
  }

  // Right-half camera look drag zone
  const lookZone = document.createElement('div');
  lookZone.style.cssText = 'position:absolute;right:0;top:0;width:52%;height:60%;pointer-events:auto;touch-action:none;';
  root.appendChild(lookZone);
  let lookId: number | null = null;
  let lastLx = 0;
  let lastLy = 0;
  lookZone.addEventListener('pointerdown', (e) => {
    lookId = e.pointerId;
    lastLx = e.clientX;
    lastLy = e.clientY;
  });
  lookZone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lookId) return;
    mobile.lookDeltaX += e.clientX - lastLx;
    mobile.lookDeltaY += e.clientY - lastLy;
    lastLx = e.clientX;
    lastLy = e.clientY;
  });
  const endLook = (e: PointerEvent) => {
    if (e.pointerId === lookId) lookId = null;
  };
  lookZone.addEventListener('pointerup', endLook);
  lookZone.addEventListener('pointercancel', endLook);

  // Action buttons (>=48px targets)
  function mkBtn(label: string, right: number, bottom: number, size: number, bg: string, onDown: () => void, onUp?: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = `
      position:absolute;right:${right}px;bottom:${bottom}px;width:${size}px;height:${size}px;
      border-radius:50%;border:2px solid rgba(232,220,192,0.5);background:${bg};color:#f5edd6;
      font:700 12px/1 Georgia,serif;pointer-events:auto;touch-action:none;
      box-shadow:0 4px 12px rgba(0,0,0,0.65);
    `;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onDown();
    });
    if (onUp) {
      b.addEventListener('pointerup', onUp);
      b.addEventListener('pointercancel', onUp);
    }
    root.appendChild(b);
    return b;
  }

  mkBtn('R1', 20, 92, 62, 'rgba(138,34,34,0.82)', () => { mobile.r1Queued = true; });
  mkBtn('R2', 92, 134, 54, 'rgba(110,24,24,0.82)', () => { mobile.r2Queued = true; });
  mkBtn('ROLL', 86, 24, 58, 'rgba(38,52,78,0.82)', () => { mobile.rollQueued = true; });
  mkBtn('GUARD', 152, 82, 50, 'rgba(42,46,56,0.82)', () => { mobile.guard = true; }, () => { mobile.guard = false; });
  mkBtn('FLASK', 20, 22, 54, 'rgba(168,104,24,0.84)', () => { mobile.flaskQueued = true; });
  mkBtn('LOCK', 150, 146, 48, 'rgba(35,38,48,0.8)', () => { mobile.lockQueued = true; });

  const interactBtn = mkBtn('USE', 150, 206, 52, 'rgba(190,120,30,0.9)', () => { mobile.interactQueued = true; });
  interactBtn.style.display = 'none';

  return {
    setVisible(v: boolean) {
      root.style.display = v ? 'block' : 'none';
    },
    setInteractVisible(v: boolean, label = 'USE') {
      interactBtn.style.display = v ? 'block' : 'none';
      interactBtn.textContent = label;
    },
  };
}
