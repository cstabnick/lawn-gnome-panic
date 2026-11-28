import { firstPad } from '@lawn/gamepad';
import type { SkaterInput } from './sim/skater';

export interface InputController {
  poll(cameraYaw: number): {
    skater: SkaterInput;
    sprayEdge: boolean;
    orbitDeltaX: number;
    toggleExplorer: boolean;
    tagSelect: number | null;
    cycleTag: boolean;
    helperEdge: boolean;
    toggleFlow: boolean;
    pauseEdge: boolean;
    isTouch: boolean;
  };
  mountTouch(container: HTMLElement): void;
  setTouchVisible(v: boolean): void;
  dispose(): void;
}

export function createInputController(canvas: HTMLElement): InputController {
  const keys = new Set<string>();
  let explorerEdge = false;
  let tagSelect: number | null = null;
  let cycleTag = false;
  let helperEdge = false;
  let toggleFlow = false;
  let pauseEdge = false;
  let sprayDown = false;
  let prevSpray = false;
  let orbitDeltaX = 0;
  let dragging = false;
  let orbitPointerId: number | null = null;
  let lastPointerX = 0;

  // Touch state
  let touchRoot: HTMLElement | null = null;
  let touchMoveX = 0;
  let touchMoveY = 0;
  let touchJump = false;
  let touchGrind = false;
  let touchSpray = false;
  let touchBoost = false;
  let touchBrake = false;
  let touchDance = false;
  let touchSpeedMode = false;

  const onKeyDown = (e: KeyboardEvent) => {
    const code = e.code;
    if (code === 'KeyM' && !keys.has(code)) explorerEdge = true;
    if (code === 'KeyC' && !keys.has(code)) cycleTag = true;
    if (code === 'KeyH' && !keys.has(code)) helperEdge = true;
    if (code === 'KeyV' && !keys.has(code)) toggleFlow = true;
    if (code === 'Escape' && !keys.has(code)) pauseEdge = true;
    if (code === 'Digit1' && !keys.has(code)) tagSelect = 0;
    if (code === 'Digit2' && !keys.has(code)) tagSelect = 1;
    if (code === 'Digit3' && !keys.has(code)) tagSelect = 2;
    keys.add(code);
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button === 0) {
      dragging = true;
      lastPointerX = e.clientX;
    } else if (e.pointerType === 'touch' && orbitPointerId === null) {
      orbitPointerId = e.pointerId;
      lastPointerX = e.clientX;
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    if (dragging && e.pointerType === 'mouse') {
      orbitDeltaX += (e.clientX - lastPointerX) * 0.006;
      lastPointerX = e.clientX;
    } else if (e.pointerType === 'touch' && e.pointerId === orbitPointerId) {
      orbitDeltaX += (e.clientX - lastPointerX) * 0.008;
      lastPointerX = e.clientX;
    }
  };
  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') {
      dragging = false;
    } else if (e.pointerId === orbitPointerId) {
      orbitPointerId = null;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  function mountTouch(container: HTMLElement): void {
    touchRoot = document.createElement('div');
    touchRoot.id = 'gsr-touch';
    touchRoot.style.cssText = `
      position:fixed; inset:0; pointer-events:none; z-index:20;
      display:none;
      padding: env(safe-area-inset-top, 10px) env(safe-area-inset-right, 10px) env(safe-area-inset-bottom, 12px) env(safe-area-inset-left, 10px);
    `;

    // Left virtual joystick
    const joy = document.createElement('div');
    joy.style.cssText = `
      position:absolute; left:18px; bottom:24px; width:112px; height:112px;
      border-radius:50%; background:rgba(20,8,36,0.45); border:2px solid rgba(0,229,255,0.65);
      pointer-events:auto; touch-action:none;
    `;
    const knob = document.createElement('div');
    knob.style.cssText = `
      position:absolute; left:50%; top:50%; width:46px; height:46px;
      margin:-23px 0 0 -23px; border-radius:50%;
      background:rgba(0,229,255,0.85); box-shadow:0 0 12px rgba(0,229,255,0.8);
    `;
    joy.appendChild(knob);

    let joyId: number | null = null;
    const updateJoy = (clientX: number, clientY: number) => {
      const rect = joy.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxR = rect.width * 0.4;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > maxR) {
        dx = (dx / d) * maxR;
        dy = (dy / d) * maxR;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      touchMoveX = dx / maxR;
      touchMoveY = dy / maxR;
    };
    joy.addEventListener('pointerdown', (e) => {
      joyId = e.pointerId;
      joy.setPointerCapture(e.pointerId);
      updateJoy(e.clientX, e.clientY);
    });
    joy.addEventListener('pointermove', (e) => {
      if (e.pointerId === joyId) updateJoy(e.clientX, e.clientY);
    });
    const resetJoy = (e: PointerEvent) => {
      if (e.pointerId !== joyId) return;
      joyId = null;
      touchMoveX = 0;
      touchMoveY = 0;
      knob.style.transform = 'translate(0,0)';
    };
    joy.addEventListener('pointerup', resetJoy);
    joy.addEventListener('pointercancel', resetJoy);
    touchRoot.appendChild(joy);

    // Right action buttons (>= 44px targets)
    const pad = document.createElement('div');
    pad.style.cssText = `
      position:absolute; right:16px; bottom:22px;
      display:grid; grid-template-columns:repeat(3, 54px); gap:8px;
      pointer-events:auto;
    `;
    const makeBtn = (label: string, color: string, onSet: (v: boolean) => void) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = `
        width:54px; height:54px; min-width:44px; min-height:44px; border-radius:50%;
        border:2px solid ${color}; background:rgba(20,8,36,0.72); color:#fff;
        font-weight:800; font-size:10px; touch-action:none;
      `;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        onSet(true);
      });
      b.addEventListener('pointerup', () => onSet(false));
      b.addEventListener('pointercancel', () => onSet(false));
      return b;
    };
    pad.appendChild(makeBtn('DANCE', '#ff9100', (v) => (touchDance = v)));
    pad.appendChild(makeBtn('TRICK', '#ffd740', (v) => (touchGrind = v)));
    pad.appendChild(makeBtn('SPRAY', '#ff4ecd', (v) => (touchSpray = v)));
    pad.appendChild(makeBtn('BRAKE', '#ff5252', (v) => (touchBrake = v)));
    pad.appendChild(makeBtn('TUCK', '#b388ff', (v) => (touchSpeedMode = v)));
    pad.appendChild(makeBtn('BOOST', '#00e5ff', (v) => (touchBoost = v)));
    pad.appendChild(makeBtn('JUMP', '#69f0ae', (v) => (touchJump = v)));
    touchRoot.appendChild(pad);

    container.appendChild(touchRoot);

    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasTouch) touchRoot.style.display = 'block';
  }

  function setTouchVisible(v: boolean): void {
    if (!touchRoot) return;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    touchRoot.style.display = v && hasTouch ? 'block' : 'none';
  }

  function poll(cameraYaw: number) {
    let lx = 0;
    let ly = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) ly -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) ly += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) lx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) lx += 1;

    lx += touchMoveX;
    ly += touchMoveY;

    const gp = firstPad();
    let gpJump = false;
    let gpGrind = false;
    let gpSpray = false;
    let gpBoost = false;
    let gpBrake = false;
    let gpDance = false;
    let gpSpeedMode = false;
    let gpOrbit = 0;
    if (gp) {
      if (Math.abs(gp.axes[0] ?? 0) > 0.15) lx += gp.axes[0];
      if (Math.abs(gp.axes[1] ?? 0) > 0.15) ly += gp.axes[1];
      if (Math.abs(gp.axes[2] ?? 0) > 0.2) gpOrbit = gp.axes[2] * 0.04;
      gpJump = gp.buttons[0]?.pressed ?? false;
      gpSpray = gp.buttons[1]?.pressed ?? false;
      gpGrind = (gp.buttons[2]?.pressed || gp.buttons[3]?.pressed) ?? false;
      gpSpeedMode = gp.buttons[4]?.pressed ?? false;
      gpBrake = gp.buttons[6]?.pressed ?? false;
      gpBoost = (gp.buttons[5]?.pressed || gp.buttons[7]?.pressed) ?? false;
      gpDance = (gp.buttons[8]?.pressed || gp.buttons[13]?.pressed) ?? false;
    }

    // Convert camera-space (lx = right, ly = down/back) to world XZ
    // Camera faces along (sin(yaw), cos(yaw))
    const fwdX = Math.sin(cameraYaw);
    const fwdZ = Math.cos(cameraYaw);
    const rightX = -Math.cos(cameraYaw);
    const rightZ = Math.sin(cameraYaw);
    const moveX = rightX * lx + fwdX * -ly;
    const moveZ = rightZ * lx + fwdZ * -ly;

    const jump = keys.has('Space') || touchJump || gpJump;
    const grind = keys.has('KeyE') || keys.has('KeyQ') || keys.has('KeyR') || touchGrind || gpGrind;
    const boost = keys.has('ShiftLeft') || keys.has('ShiftRight') || touchBoost || gpBoost;
    const brake = keys.has('KeyX') || keys.has('ControlLeft') || keys.has('ControlRight') || touchBrake || gpBrake;
    const dance = keys.has('KeyB') || touchDance || gpDance;
    const speedMode = keys.has('AltLeft') || keys.has('AltRight') || keys.has('KeyZ') || touchSpeedMode || gpSpeedMode;
    sprayDown = keys.has('KeyF') || keys.has('Enter') || touchSpray || gpSpray;
    const sprayEdge = sprayDown && !prevSpray;
    prevSpray = sprayDown;

    const deltaOrbit = orbitDeltaX + gpOrbit;
    orbitDeltaX = 0;
    const toggleExplorer = explorerEdge;
    explorerEdge = false;
    const outTag = tagSelect;
    tagSelect = null;
    const outCycle = cycleTag;
    cycleTag = false;
    const outHelper = helperEdge;
    helperEdge = false;
    const outFlow = toggleFlow;
    toggleFlow = false;
    const outPause = pauseEdge;
    pauseEdge = false;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      skater: { moveX, moveZ, jump, grind, trick: grind, boost, brake, dance, speedMode },
      sprayEdge,
      orbitDeltaX: deltaOrbit,
      toggleExplorer,
      tagSelect: outTag,
      cycleTag: outCycle,
      helperEdge: outHelper,
      toggleFlow: outFlow,
      pauseEdge: outPause,
      isTouch,
    };
  }

  return {
    poll,
    mountTouch,
    setTouchVisible,
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
