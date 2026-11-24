// Keyboard, mouse (pointer lock, right-drag, right-button aim) and touch (stick, camera drag, on-screen buttons, Aim toggle) folded into one InputState per frame.
import { createGamepad } from './gamepad';
import { KEYS, MOVE_KEYS } from './keys';
import { notePad } from './ui/inputSource';
import { ensureButtonStyle, getTouchLayout } from './ui/style';
import type { CameraMode, Input, InputState } from './types';

const MOUSE_SENS = 0.0025;
const LOOK_SENS = 0.005;
const STICK_MAX = 50;
const LEFT_ZONE = 0.45;

const clamp = (v: number): number => Math.max(-1, Math.min(1, v));

/** Cluster placement: portrait keeps the corner stack, phone landscape (short screens) lays the two rows side by side. */
function ensureTouchStyle(): void {
  if (document.getElementById('gta-touch-style')) return;
  const s = document.createElement('style');
  s.id = 'gta-touch-style';
  s.textContent = `
#gta-touch .gta-cluster{position:fixed;right:calc(env(safe-area-inset-right) + max(24px, 9vw));bottom:calc(env(safe-area-inset-bottom) + max(24px, 7vh));display:flex;flex-direction:column;align-items:flex-end;}
@media (max-height:500px){#gta-touch .gta-cluster{flex-direction:row;align-items:flex-end;bottom:calc(env(safe-area-inset-bottom) + max(16px,4vh));} #gta-touch .gta-cluster > div{flex-direction:row;}}
body[data-touch-layout="left-handed"] #gta-touch .gta-cluster{left:calc(env(safe-area-inset-left) + max(24px,9vw));right:auto;align-items:flex-start;}
body[data-touch-layout="minimal"] #gta-touch .gta-btn{transform:scale(.9);}`;
  document.head.appendChild(s);
}

/** `handbrake` says whether the driving model uses one (the Arcade mode does not); it is asked again on `refresh()`. */
export function createInput(canvas: HTMLCanvasElement, ui: HTMLElement, opts: { handbrake?: () => boolean; hop?: () => boolean; canLock?: () => boolean } = {}): Input {
  const s: InputState = { moveX: 0, moveY: 0, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false, reload: false, radio: false, banger: false, camYaw: 0, camPitch: 0, boost: false, horn: false };

  // ---- Keyboard ----------------------------------------------------------------------------------------------------
  const held = new Set<string>();
  const has = (...codes: string[]): boolean => codes.some((c) => held.has(c));

  window.addEventListener('keydown', (e) => {
    if (e.code === KEYS.jump || e.code.startsWith('Arrow')) e.preventDefault();
    held.add(e.code);
    if (e.repeat) return;
    switch (e.code) {
      case KEYS.jump: s.jump = true; break;
      case KEYS.enterExit: s.enterExit = true; break;
      // KEYS.switchGun (Q) is read by the weapon wheel itself (weaponWheel.ts): tap = next gun, hold = wheel.
      case KEYS.reload: s.reload = true; break;
      case KEYS.radio: s.radio = true; break;
      case KEYS.banger: s.banger = true; break;
      case KEYS.horn: s.horn = true; break;
    }
  });
  window.addEventListener('keyup', (e) => { held.delete(e.code); });

  // ---- Mouse -------------------------------------------------------------------------------------------------------
  let mouseFire = false;
  let mouseAim = false;
  let dragging = false;
  let aimToggle = false;
  let touchOn = false;
  let touchHidden = false;

  const locked = (): boolean => document.pointerLockElement === canvas;

  canvas.style.touchAction = 'none';
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('click', () => {
    if (touchOn || locked() || (opts.canLock && !opts.canLock())) return;
    void Promise.resolve(canvas.requestPointerLock()).catch(() => {});
  });
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0 && locked()) mouseFire = true;
    if (e.button === 2) mouseAim = true;
    if (e.button === 2 && !locked()) dragging = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouseFire = false;
    if (e.button === 2) {
      mouseAim = false;
      dragging = false;
    }
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
    mouseAim = false;
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

  ensureButtonStyle();
  ensureTouchStyle();
  const cluster = document.createElement('div');
  cluster.className = 'gta-cluster';
  cluster.style.cssText = 'gap:10px;pointer-events:none;';
  root.appendChild(cluster);
  // Left-handed flips the stick zone (see pointerdown); the layout is re-read when Options changes it.
  let leftHanded = getTouchLayout() === 'left-handed';
  let minimal = getTouchLayout() === 'minimal';
  window.addEventListener('gta:touch-layout', () => {
    const layout = getTouchLayout();
    leftHanded = layout === 'left-handed';
    minimal = layout === 'minimal';
    if (shownMode) showButtons(shownMode);
  });

  const fireIds = new Set<number>();
  const upIds = new Set<number>();
  const downIds = new Set<number>();
  const boostIds = new Set<number>();

  function button(text: string, size: number, down: (id: number) => void, up: (id: number) => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.className = 'gta-btn' + (size >= 84 ? ' gta-btn--xl' : size >= 56 ? (size >= 58 ? ' gta-btn--lg' : ' gta-btn--md') : '');
    b.style.cssText = 'touch-action:none;display:none;';
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
  const jumpBtn = button('Jump', 64,
    (id) => {
      if (shownMode === 'fly') upIds.add(id);
      else if (shownMode === 'drive') {
        s.jump = true;
        if (opts.handbrake?.()) upIds.add(id);
      } else {
        s.jump = true;
      }
    },
    (id) => { upIds.delete(id); });
  const downBtn = button('Down', 64, (id) => { downIds.add(id); }, (id) => { downIds.delete(id); });
  // Opens the weapon wheel (weaponWheel.ts) in tap mode.
  const swapBtn = button('Guns', 64, () => { s.switchGun = true; }, () => {});
  swapBtn.setAttribute('aria-label', 'Weapon wheel');
  const reloadBtn = button('Reload', 64, () => { s.reload = true; }, () => {});
  // Radio shares the Swap slot: Swap is hidden while driving or flying, and Radio is only shown then.
  const radioBtn = button('Radio', 64, () => { s.radio = true; }, () => {});
  const bangerBtn = button('🔥', 56, () => { s.banger = true; }, () => {});
  bangerBtn.style.borderColor = '#ff7a33';
  const hornBtn = button('Horn', 58, () => { s.horn = true; }, () => {});
  const boostBtn = button('Boost', 64, (id) => { boostIds.add(id); }, (id) => { boostIds.delete(id); });
  boostBtn.style.borderColor = 'rgba(255, 168, 46, 0.85)';
  // Aim is a toggle (tap to aim, tap to stop), shown on foot only; see applyMode.
  const aimBtn = button('Aim', 64, () => { aimToggle = !aimToggle; paintAim(); }, () => {});
  function paintAim(): void {
    aimBtn.setAttribute('aria-pressed', String(aimToggle));
    aimBtn.classList.toggle('on', aimToggle);
  }
  paintAim();
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
  topRow.append(enterBtn, hornBtn, boostBtn, jumpBtn, downBtn);
  const bottomRow = row();
  bottomRow.append(bangerBtn, radioBtn, swapBtn, reloadBtn, aimBtn, fireBtn);
  cluster.append(topRow, bottomRow);

  ui.appendChild(root);

  // ---- Touch: mode and label (DOM only on change) -----------------------------------------------------------------
  let shownMode: CameraMode | null = null;
  let enterLabel: string | null = null;

  function applyMode(mode: CameraMode): void {
    shownMode = mode;
    upIds.clear();
    downIds.clear();
    boostIds.clear();
    aimToggle = false;
    paintAim();
    document.body.dataset.mode = mode;
    showButtons(mode);
    window.dispatchEvent(new Event('gta:mode'));
  }

  /** Which buttons the cluster shows for a mode. The minimal layout drops Reload on foot (guns reload when empty). */
  function showButtons(mode: CameraMode): void {
    const hasHandbrake = !!opts.handbrake?.();
    const hasHop = mode === 'drive' && !!opts.hop?.();
    jumpBtn.textContent = mode === 'fly' ? 'Up' : mode === 'drive' ? (hasHandbrake ? 'Handbrake' : 'Hop') : 'Jump';
    jumpBtn.style.fontSize = mode === 'drive' && hasHandbrake ? '11px' : '';
    jumpBtn.style.display = (mode === 'drive' && !hasHandbrake && !hasHop) || mode === 'chute' ? 'none' : '';
    downBtn.style.display = mode === 'fly' ? '' : 'none';
    hornBtn.style.display = mode === 'drive' ? '' : 'none';
    boostBtn.style.display = mode === 'drive' ? '' : 'none';
    swapBtn.style.display = mode === 'foot' || mode === 'chute' ? '' : 'none';
    radioBtn.style.display = mode === 'drive' || mode === 'fly' ? '' : 'none';
    bangerBtn.style.display = mode === 'drive' || mode === 'fly' ? '' : 'none';
    reloadBtn.style.display = (mode === 'foot' && !minimal) || mode === 'drive' || mode === 'chute' ? '' : 'none';
    aimBtn.style.display = mode === 'foot' ? '' : 'none';
    fireBtn.style.display = '';
  }
  applyMode('foot');

  function showTouch(): void {
    if (touchOn) return;
    touchOn = true;
    root.style.display = touchHidden ? 'none' : '';
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
    const inStickZone = leftHanded ? e.clientX > window.innerWidth * (1 - LEFT_ZONE) : e.clientX < window.innerWidth * LEFT_ZONE;
    if (inStickZone) {
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
      const p = pad.read(shownMode ?? 'foot', dt, document.body.dataset.options === 'open' || document.body.dataset.emotes === 'open' || document.body.dataset.more === 'open');
      if (p?.active) notePad(p.id);
      const big = (a: number, b: number): number => (Math.abs(b) > Math.abs(a) ? b : a);
      // While the More menu is open the arrows / WASD move its focus, not the player.
      const menu = document.body.dataset.more === 'open';
      const kbX = menu ? 0 : (has(...MOVE_KEYS.right) ? 1 : 0) - (has(...MOVE_KEYS.left) ? 1 : 0);
      const kbY = menu ? 0 : (has(...MOVE_KEYS.forward) ? 1 : 0) - (has(...MOVE_KEYS.back) ? 1 : 0);
      const kbLift = (has(KEYS.jump) ? 1 : 0) - (has(...MOVE_KEYS.boost, ...MOVE_KEYS.descend) ? 1 : 0);
      const out: InputState = {
        moveX: big(clamp(kbX + stickX), p?.moveX ?? 0),
        moveY: big(clamp(kbY + stickY), p?.moveY ?? 0),
        lift: big(clamp(kbLift + (upIds.size > 0 ? 1 : 0) - (downIds.size > 0 ? 1 : 0)), p?.lift ?? 0),
        jump: s.jump || !!p?.jump,
        fire: has(...MOVE_KEYS.fire) || mouseFire || fireIds.size > 0 || !!p?.fire,
        enterExit: s.enterExit || !!p?.enterExit,
        switchGun: s.switchGun || !!p?.switchGun,
        reload: s.reload || !!p?.reload,
        radio: s.radio || !!p?.radio,
        banger: s.banger || !!p?.banger,
        boost: shownMode === 'drive' && (has(...MOVE_KEYS.boost) || boostIds.size > 0 || !!p?.boost),
        horn: s.horn || !!p?.horn,
        aim: mouseAim || aimToggle || !!p?.aim,
        camYaw: s.camYaw + (p?.camYaw ?? 0),
        camPitch: s.camPitch + (p?.camPitch ?? 0),
        pad: !!p?.active,
      };
      s.jump = false;
      s.enterExit = false;
      s.switchGun = false;
      s.reload = false;
      s.radio = false;
      s.banger = false;
      s.horn = false;
      s.camYaw = 0;
      s.camPitch = 0;
      return out;
    },

    setVisible(visible: boolean): void {
      touchHidden = !visible;
      root.style.display = visible && touchOn ? '' : 'none';
    },

    setMode(mode: CameraMode): void {
      if (mode === shownMode) return;
      applyMode(mode);
    },

    /** Re-read what the touch buttons show (the driving mode changed under a held mode). */
    refresh(): void {
      if (shownMode) applyMode(shownMode);
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
