// Keyboard + touch input: a floating virtual joystick (left 55% of the screen), a Jump button and a
// context Interact button, all read through one InputState.
import type { Input, InputState } from './types';

const STICK_RADIUS = 50;
const DEAD_ZONE = 0.12;

const CSS = `
#fc-touch { position: fixed; inset: 0; pointer-events: none; z-index: 10; }
#fc-touch.fc-off { display: none; }
#fc-touch .fc-stick-zone {
  position: absolute; left: 0; top: 0; bottom: 0; width: 55%;
  pointer-events: auto; touch-action: none; background: transparent;
  user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
}
#fc-touch .fc-stick-ring {
  position: absolute; width: 110px; height: 110px; margin: -55px 0 0 -55px;
  border-radius: 50%; border: 2px solid rgba(255,255,255,0.7); background: rgba(255,255,255,0.18);
  box-shadow: 0 0 0 2px rgba(30,30,40,0.25); pointer-events: none; display: none;
}
#fc-touch .fc-stick-knob {
  position: absolute; left: 50%; top: 50%; width: 48px; height: 48px; margin: -24px 0 0 -24px;
  border-radius: 50%; background: rgba(255,255,255,0.8); border: 2px solid #222;
}
#fc-touch .fc-btn {
  position: absolute; width: 72px; height: 72px; border-radius: 50%;
  bottom: calc(24px + env(safe-area-inset-bottom));
  display: none; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
  background: rgba(255,255,255,0.8); color: #1c1c22; border: 2px solid #1c1c22;
  font: bold 14px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; line-height: 1.05;
  pointer-events: auto; touch-action: none; padding: 0; text-align: center;
  user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
  box-shadow: 0 3px 8px rgba(0,0,0,0.25);
}
#fc-touch .fc-btn:active, #fc-touch .fc-btn.fc-down { transform: scale(0.93); background: rgba(255,255,255,0.95); }
#fc-touch .fc-btn .fc-btn-arrow { font-size: 18px; }
#fc-touch .fc-jump { right: calc(20px + env(safe-area-inset-right)); }
#fc-touch .fc-interact { right: calc(108px + env(safe-area-inset-right)); overflow: hidden; word-break: break-word; }
#fc-touch.fc-is-touch .fc-jump { display: flex; }
#fc-touch.fc-is-touch .fc-interact.fc-show { display: flex; animation: fc-pulse 1.2s ease-in-out infinite; }
@keyframes fc-pulse {
  0%, 100% { box-shadow: 0 3px 8px rgba(0,0,0,0.25), 0 0 0 0 rgba(255,236,140,0.7); }
  50% { box-shadow: 0 3px 8px rgba(0,0,0,0.25), 0 0 0 10px rgba(255,236,140,0); }
}
#fc-touch .fc-hint {
  position: absolute; left: 50%; transform: translateX(-50%);
  bottom: calc(24px + env(safe-area-inset-bottom));
  padding: 6px 12px; border-radius: 14px; display: none;
  background: rgba(255,255,255,0.8); color: #1c1c22; border: 2px solid #1c1c22;
  font: bold 14px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  pointer-events: none; user-select: none; white-space: nowrap;
}
#fc-touch:not(.fc-is-touch) .fc-hint.fc-show { display: block; }
`;

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable;
}

export function createInput(ui: HTMLElement): Input {
  if (!document.getElementById('fc-touch-style')) {
    const style = document.createElement('style');
    style.id = 'fc-touch-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const root = document.createElement('div');
  root.id = 'fc-touch';
  ui.appendChild(root);

  const zone = document.createElement('div');
  zone.className = 'fc-stick-zone';
  root.appendChild(zone);

  const ring = document.createElement('div');
  ring.className = 'fc-stick-ring';
  const knob = document.createElement('div');
  knob.className = 'fc-stick-knob';
  ring.appendChild(knob);
  root.appendChild(ring);

  const interactBtn = document.createElement('button');
  interactBtn.type = 'button';
  interactBtn.className = 'fc-btn fc-interact';
  root.appendChild(interactBtn);

  const jumpBtn = document.createElement('button');
  jumpBtn.type = 'button';
  jumpBtn.className = 'fc-btn fc-jump';
  jumpBtn.innerHTML = '<span class="fc-btn-arrow">⤒</span><span>Jump</span>';
  root.appendChild(jumpBtn);

  const hint = document.createElement('div');
  hint.className = 'fc-hint';
  root.appendChild(hint);

  let enabled = true;
  let touchMode = false;
  const setTouchMode = () => {
    if (touchMode) return;
    touchMode = true;
    root.classList.add('fc-is-touch');
  };
  try {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) setTouchMode();
  } catch { /* no matchMedia */ }

  // ---- queued one-shots ----
  let jumpQueued = false;
  let interactQueued = false;

  // ---- touch stick ----
  let stickId: number | null = null;
  let stickOX = 0, stickOY = 0;
  let stickX = 0, stickZ = 0;

  const resetStick = () => {
    stickId = null;
    stickX = 0; stickZ = 0;
    ring.style.display = 'none';
    knob.style.transform = '';
  };

  const onZoneDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') setTouchMode();
    if (!enabled || stickId !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    stickId = e.pointerId;
    stickOX = e.clientX; stickOY = e.clientY;
    stickX = 0; stickZ = 0;
    try { zone.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    ring.style.left = `${stickOX}px`;
    ring.style.top = `${stickOY}px`;
    ring.style.display = 'block';
    knob.style.transform = '';
  };
  const onZoneMove = (e: PointerEvent) => {
    if (e.pointerId !== stickId) return;
    let dx = e.clientX - stickOX;
    let dy = e.clientY - stickOY;
    const len = Math.hypot(dx, dy);
    if (len > STICK_RADIUS) { dx *= STICK_RADIUS / len; dy *= STICK_RADIUS / len; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    let x = dx / STICK_RADIUS, z = dy / STICK_RADIUS;
    const m = Math.hypot(x, z);
    if (m > 1) { x /= m; z /= m; }
    if (m < DEAD_ZONE) { x = 0; z = 0; }
    stickX = x; stickZ = z;
  };
  const onZoneUp = (e: PointerEvent) => {
    if (e.pointerId !== stickId) return;
    try { zone.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    resetStick();
  };
  zone.addEventListener('pointerdown', onZoneDown);
  zone.addEventListener('pointermove', onZoneMove);
  zone.addEventListener('pointerup', onZoneUp);
  zone.addEventListener('pointercancel', onZoneUp);
  zone.addEventListener('lostpointercapture', onZoneUp);

  // ---- buttons ----
  let jumpHeld = false;
  const onJumpDown = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.pointerType === 'touch') setTouchMode();
    if (!enabled) return;
    jumpHeld = true;
    jumpQueued = true;
    jumpBtn.classList.add('fc-down');
  };
  const onJumpUp = () => {
    jumpHeld = false;
    jumpBtn.classList.remove('fc-down');
  };
  jumpBtn.addEventListener('pointerdown', onJumpDown);
  jumpBtn.addEventListener('pointerup', onJumpUp);
  jumpBtn.addEventListener('pointercancel', onJumpUp);
  jumpBtn.addEventListener('pointerleave', onJumpUp);

  const onInteractDown = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.pointerType === 'touch') setTouchMode();
    if (!enabled) return;
    interactQueued = true;
  };
  interactBtn.addEventListener('pointerdown', onInteractDown);

  const noMenu = (e: Event) => e.preventDefault();
  root.addEventListener('contextmenu', noMenu);

  // Any touch anywhere switches to touch mode (e.g. the first tap lands on the canvas or HUD).
  const onAnyPointer = (e: PointerEvent) => { if (e.pointerType === 'touch') setTouchMode(); };
  window.addEventListener('pointerdown', onAnyPointer, true);

  // ---- keyboard ----
  const keys = new Set<string>();
  const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
  const onKeyDown = (e: KeyboardEvent) => {
    if (isTypingTarget(e.target)) return;
    const c = e.code;
    if (c.startsWith('Arrow') || c === 'Space') e.preventDefault();
    if (!enabled) return;
    if (MOVE_KEYS.has(c) || c === 'Space') keys.add(c);
    if (e.repeat) return;
    if (c === 'Space') jumpQueued = true;
    else if (c === 'KeyE' || c === 'Enter' || c === 'NumpadEnter') interactQueued = true;
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.code);
  };
  const onBlur = () => { keys.clear(); jumpHeld = false; resetStick(); };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  const down = (...codes: string[]) => codes.some((c) => keys.has(c));

  return {
    read(): InputState {
      if (!enabled) {
        jumpQueued = false; interactQueued = false;
        return { moveX: 0, moveZ: 0, jump: false, jumpPressed: false, interactPressed: false };
      }
      let moveX: number, moveZ: number;
      if (stickId !== null) {
        moveX = stickX; moveZ = stickZ;
      } else {
        moveX = (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0);
        moveZ = (down('KeyS', 'ArrowDown') ? 1 : 0) - (down('KeyW', 'ArrowUp') ? 1 : 0);
        const m = Math.hypot(moveX, moveZ);
        if (m > 1) { moveX /= m; moveZ /= m; }
      }
      const state: InputState = {
        moveX,
        moveZ,
        jump: jumpHeld || keys.has('Space'),
        jumpPressed: jumpQueued,
        interactPressed: interactQueued,
      };
      jumpQueued = false;
      interactQueued = false;
      return state;
    },
    setInteract(label: string | null) {
      if (label) {
        if (interactBtn.textContent !== label) interactBtn.textContent = label;
        interactBtn.classList.add('fc-show');
        hint.textContent = `[E] ${label}`;
        hint.classList.add('fc-show');
      } else {
        interactBtn.classList.remove('fc-show');
        hint.classList.remove('fc-show');
      }
    },
    setEnabled(on: boolean) {
      if (on === enabled) return;
      enabled = on;
      root.classList.toggle('fc-off', !on);
      if (!on) {
        resetStick();
        jumpHeld = false;
        jumpBtn.classList.remove('fc-down');
        keys.clear();
        jumpQueued = false;
        interactQueued = false;
      }
    },
    dispose() {
      zone.removeEventListener('pointerdown', onZoneDown);
      zone.removeEventListener('pointermove', onZoneMove);
      zone.removeEventListener('pointerup', onZoneUp);
      zone.removeEventListener('pointercancel', onZoneUp);
      zone.removeEventListener('lostpointercapture', onZoneUp);
      jumpBtn.removeEventListener('pointerdown', onJumpDown);
      jumpBtn.removeEventListener('pointerup', onJumpUp);
      jumpBtn.removeEventListener('pointercancel', onJumpUp);
      jumpBtn.removeEventListener('pointerleave', onJumpUp);
      interactBtn.removeEventListener('pointerdown', onInteractDown);
      root.removeEventListener('contextmenu', noMenu);
      window.removeEventListener('pointerdown', onAnyPointer, true);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      root.remove();
      document.getElementById('fc-touch-style')?.remove();
    },
  };
}
