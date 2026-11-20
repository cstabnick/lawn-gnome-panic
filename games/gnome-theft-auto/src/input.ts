// Keyboard, mouse (pointer lock, right-drag) and touch (stick, camera drag, on-screen buttons) folded into one InputState per frame.
import { createGamepad } from './gamepad';
import type { CameraMode, Input, InputState } from './types';

const MOUSE_SENS = 0.0025;
const LOOK_SENS = 0.005;
const STICK_MAX = 50;
const LEFT_ZONE = 0.45;

const clamp = (v: number): number => Math.max(-1, Math.min(1, v));

export function createInput(canvas: HTMLCanvasElement, ui: HTMLElement, opts: { handbrake?: boolean } = {}): Input {
  const s: InputState = { moveX: 0, moveY: 0, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false, reload: false, camYaw: 0, camPitch: 0 };

  // ---- Keyboard ----------------------------------------------------------------------------------------------------
  const held = new Set<string>();
  const has = (...codes: string[]): boolean => codes.some((c) => held.has(c));

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    held.add(e.code);
    if (e.repeat) return;
    if (e.code === 'Space') s.jump = true;
    else if (e.code === 'KeyE') s.enterExit = true;
    else if (e.code === 'KeyQ') s.switchGun = true;
    else if (e.code === 'KeyR') s.reload = true;
  });
  window.addEventListener('keyup', (e) => { held.delete(e.code); });

  // ---- Mouse -------------------------------------------------------------------------------------------------------
  let mouseFire = false;
  let dragging = false;
  let touchOn = false;

  const locked = (): boolean => document.pointerLockElement === canvas;

  canvas.style.touchAction = 'none';
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('click', () => {
    if (touchOn || locked()) return;
    void Promise.resolve(canvas.requestPointerLock()).catch(() => {});
  });
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0 && locked()) mouseFire = true;
    if (e.button === 2 && !locked()) dragging = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouseFire = false;
    if (e.button === 2) dragging = false;
  });
  window.addEventListener('mousemove', (e) => {
    if (locked() || dragging) {
      s.camYaw += -e.movementX * MOUSE_SENS;
      s.camPitch += e.movementY * MOUSE_SENS;
    }
  });
  document.addEventListener('pointerlockchange', () => {
    if (!locked()) mouseFire = false;
  });
  window.addEventListener('blur', () => {
    held.clear();
    mouseFire = false;
    dragging = false;
  });

  // ---- Touch: DOM ---------------------------------------------------------------------------------------------------
  const root = document.createElement('div');
  root.id = 'gta-touch';
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;display:none;touch-action:none;z-index:20;';

  const base = document.createElement('div');
  base.style.cssText = 'position:fixed;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:50%;background:rgba(255,255,255,0.18);border:2px solid rgba(255,255,255,0.4);display:none;pointer-events:none;';
  const knob = document.createElement('div');
  knob.style.cssText = 'position:absolute;left:50%;top:50%;width:50px;height:50px;margin:-25px 0 0 -25px;border-radius:50%;background:rgba(255,255,255,0.45);pointer-events:none;';
  base.appendChild(knob);
  root.appendChild(base);

  const cluster = document.createElement('div');
  cluster.style.cssText = 'position:fixed;right:calc(env(safe-area-inset-right) + max(24px, 9vw));bottom:calc(env(safe-area-inset-bottom) + max(24px, 7vh));display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:none;';
  root.appendChild(cluster);

  const fireIds = new Set<number>();
  const upIds = new Set<number>();
  const downIds = new Set<number>();

  function button(text: string, size: number, down: (id: number) => void, up: (id: number) => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;border:2px solid rgba(255,255,255,0.7);background:rgba(20,20,20,0.5);color:#fff;font:700 15px system-ui,sans-serif;padding:0;touch-action:none;pointer-events:auto;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;display:none;`;
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      down(e.pointerId);
    });
    const release = (e: PointerEvent): void => {
      e.stopPropagation();
      up(e.pointerId);
    };
    b.addEventListener('pointerup', release);
    b.addEventListener('pointercancel', release);
    return b;
  }

  const row = (): HTMLDivElement => {
    const r = document.createElement('div');
    r.style.cssText = 'display:flex;gap:10px;align-items:flex-end;';
    return r;
  };

  const enterBtn = button('Enter', 64, () => { s.enterExit = true; }, () => {});
  const jumpBtn = button('Jump', 72,
    (id) => { if (shownMode === 'fly' || (shownMode === 'drive' && opts.handbrake)) upIds.add(id); else s.jump = true; },
    (id) => { upIds.delete(id); });
  const downBtn = button('Down', 64, (id) => { downIds.add(id); }, (id) => { downIds.delete(id); });
  const swapBtn = button('Swap', 64, () => { s.switchGun = true; }, () => {});
  const reloadBtn = button('Reload', 64, () => { s.reload = true; }, () => {});
  const fireBtn = button('Fire', 84, (id) => { fireIds.add(id); }, (id) => { fireIds.delete(id); });
  // Holding Fire and dragging the same thumb still aims (the button captures that pointer, so it feeds the camera too).
  let fireLast: { id: number; x: number; y: number } | null = null;
  fireBtn.addEventListener('pointerdown', (e) => { fireLast = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
  fireBtn.addEventListener('pointermove', (e) => {
    if (!fireLast || e.pointerId !== fireLast.id) return;
    s.camYaw += -(e.clientX - fireLast.x) * LOOK_SENS;
    s.camPitch += (e.clientY - fireLast.y) * LOOK_SENS;
    fireLast.x = e.clientX;
    fireLast.y = e.clientY;
  });
  const fireDone = (e: PointerEvent): void => { if (fireLast && e.pointerId === fireLast.id) fireLast = null; };
  fireBtn.addEventListener('pointerup', fireDone);
  fireBtn.addEventListener('pointercancel', fireDone);

  const topRow = row();
  topRow.append(enterBtn, jumpBtn, downBtn);
  const bottomRow = row();
  bottomRow.append(swapBtn, reloadBtn, fireBtn);
  cluster.append(topRow, bottomRow);

  ui.appendChild(root);

  // ---- Touch: mode and label (DOM only on change) -----------------------------------------------------------------
  let shownMode: CameraMode | null = null;
  let enterLabel: string | null = null;

  function applyMode(mode: CameraMode): void {
    shownMode = mode;
    upIds.clear();
    downIds.clear();
    jumpBtn.textContent = mode === 'fly' ? 'Up' : mode === 'drive' ? 'Handbrake' : 'Jump';
    jumpBtn.style.fontSize = mode === 'drive' ? '11px' : '';
    jumpBtn.style.display = (mode === 'drive' && !opts.handbrake) || mode === 'chute' ? 'none' : '';
    downBtn.style.display = mode === 'fly' ? '' : 'none';
    swapBtn.style.display = mode === 'foot' || mode === 'chute' ? '' : 'none';
    reloadBtn.style.display = mode === 'foot' || mode === 'drive' || mode === 'chute' ? '' : 'none';
    fireBtn.style.display = '';
  }
  applyMode('foot');

  function showTouch(): void {
    if (touchOn) return;
    touchOn = true;
    root.style.display = '';
  }
  if (window.matchMedia('(pointer: coarse)').matches) showTouch();
  window.addEventListener('touchstart', showTouch, { capture: true, passive: true });
  window.addEventListener('touchmove', (e) => { if (touchOn) e.preventDefault(); }, { passive: false });

  // ---- Touch: stick and camera drag (window-level, tracked by pointer id) -----------------------------------------
  let stick: { id: number; cx: number; cy: number } | null = null;
  let stickX = 0;
  let stickY = 0;
  const looks = new Map<number, { x: number; y: number }>();

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    showTouch();
    if (e.clientX < window.innerWidth * LEFT_ZONE) {
      if (stick) return;
      stick = { id: e.pointerId, cx: e.clientX, cy: e.clientY };
      base.style.left = `${e.clientX}px`;
      base.style.top = `${e.clientY}px`;
      base.style.display = 'block';
      knob.style.transform = 'translate(0px, 0px)';
    } else {
      looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'touch') return;
    if (stick && e.pointerId === stick.id) {
      const dx = e.clientX - stick.cx;
      const dy = e.clientY - stick.cy;
      const len = Math.hypot(dx, dy);
      const k = len > STICK_MAX ? STICK_MAX / len : 1;
      knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      stickX = clamp(dx / STICK_MAX);
      stickY = clamp(-dy / STICK_MAX);
    }
    const l = looks.get(e.pointerId);
    if (l) {
      s.camYaw += -(e.clientX - l.x) * LOOK_SENS;
      s.camPitch += (e.clientY - l.y) * LOOK_SENS;
      l.x = e.clientX;
      l.y = e.clientY;
    }
  });

  const endTouch = (e: PointerEvent): void => {
    if (e.pointerType !== 'touch') return;
    if (stick && e.pointerId === stick.id) {
      stick = null;
      stickX = 0;
      stickY = 0;
      base.style.display = 'none';
    }
    looks.delete(e.pointerId);
  };
  window.addEventListener('pointerup', endTouch);
  window.addEventListener('pointercancel', endTouch);

  // ---- Gamepad: the first connected pad adds to keyboard and touch (it wins a stick axis only by being larger). ----------
  const pad = createGamepad();
  let lastRead = performance.now();

  // ---- Public API --------------------------------------------------------------------------------------------------
  return {
    read(): InputState {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastRead) / 1000);
      lastRead = now;
      const p = pad.read(shownMode ?? 'foot', dt, document.body.dataset.simMenu === 'open');
      const big = (a: number, b: number): number => (Math.abs(b) > Math.abs(a) ? b : a);
      const kbX = (has('KeyD', 'ArrowRight') ? 1 : 0) - (has('KeyA', 'ArrowLeft') ? 1 : 0);
      const kbY = (has('KeyW', 'ArrowUp') ? 1 : 0) - (has('KeyS', 'ArrowDown') ? 1 : 0);
      const kbLift = (has('Space') ? 1 : 0) - (has('ShiftLeft', 'ShiftRight', 'KeyC') ? 1 : 0);
      const out: InputState = {
        moveX: big(clamp(kbX + stickX), p?.moveX ?? 0),
        moveY: big(clamp(kbY + stickY), p?.moveY ?? 0),
        lift: big(clamp(kbLift + (upIds.size > 0 ? 1 : 0) - (downIds.size > 0 ? 1 : 0)), p?.lift ?? 0),
        jump: s.jump || !!p?.jump,
        fire: has('KeyF') || mouseFire || fireIds.size > 0 || !!p?.fire,
        enterExit: s.enterExit || !!p?.enterExit,
        switchGun: s.switchGun || !!p?.switchGun,
        reload: s.reload || !!p?.reload,
        camYaw: s.camYaw + (p?.camYaw ?? 0),
        camPitch: s.camPitch + (p?.camPitch ?? 0),
        pad: !!p?.active,
      };
      s.jump = false;
      s.enterExit = false;
      s.switchGun = false;
      s.reload = false;
      s.camYaw = 0;
      s.camPitch = 0;
      return out;
    },

    setMode(mode: CameraMode): void {
      if (mode === shownMode) return;
      applyMode(mode);
    },

    setEnterLabel(label: string | null): void {
      if (label === enterLabel) return;
      enterLabel = label;
      if (label === null) {
        enterBtn.style.display = 'none';
      } else {
        enterBtn.textContent = label;
        enterBtn.style.display = '';
      }
    },
  };
}
