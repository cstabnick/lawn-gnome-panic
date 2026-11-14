// Aiming and the swipe-to-bowl gesture (touch, mouse and keyboard) for the local bowler.
// Every way of bowling ends in throwBall; everything here only reads state and calls setAim / throwBall.
// Only active while canBowlHere(state): otherwise the whole panel is hidden.
import * as THREE from 'three';
import { THROW, type Ctx, type System, type ThrowInput } from './config';
import { canBowlHere, setAim, throwBall } from './game';
import { sfx, startAudio } from './audio';

const MOVE_SPEED = 0.5; // m/s the aim slides while a move control is held
const TURN_SPEED = 0.08; // rad/s the aim turns while a turn control is held
const TICK_EVERY = 0.05; // m of sliding between tick sounds
const SPIN_KEY_STEP = 0.25;
const SPIN_DEFAULT = 0.35; // a gentle hook toward +x (the bowler's left)
const WINDOW_MS = 120; // the swipe is judged over its last 120 ms
const MIN_TRAVEL = 0.12; // upward travel needed, as a share of the screen height
const CHARGE_PERIOD = 1.6; // s for the keyboard meter to go 0 -> 1 -> 0
const ENTER_POWER = 0.8; // Enter throws at this meter value
const GUIDE_DOTS = 12;
const SWIPE_KEEP_MS = 2000;

const CSS = `
#bc-root * { box-sizing: border-box; }
#bc-pad, #bc-spin {
  position: absolute;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
  pointer-events: auto;
  background: rgba(20,10,40,0.7);
  border-radius: 12px;
  padding: 6px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
#bc-pad { left: calc(env(safe-area-inset-left, 0px) + 12px); display: grid; grid-template-columns: 56px 56px; gap: 8px; }
#bc-pad button {
  width: 56px; height: 56px; padding: 0; border-radius: 50%;
  border: 2px solid #3ff0ff; background: rgba(20,10,40,0.85); color: #fff;
  font: inherit; font-size: 22px; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  touch-action: none; user-select: none; -webkit-user-select: none; cursor: pointer;
}
#bc-pad button.on { background: #ff3fb4; border-color: #ff3fb4; }
#bc-spin { right: calc(env(safe-area-inset-right, 0px) + 12px); text-align: center; }
#bc-spin-label { font-size: 12px; font-weight: 900; font-style: italic; letter-spacing: 2px; color: #ffd54f; text-shadow: 0 2px 4px #000; margin: 0 0 4px; }
#bc-strip {
  position: relative; width: 160px; height: 48px; border-radius: 10px;
  background: rgba(0,0,0,0.35); touch-action: none; cursor: ew-resize;
}
#bc-strip span { position: absolute; top: 5px; font-size: 10px; font-weight: 800; white-space: nowrap; color: #fff; text-shadow: 0 2px 4px #000; }
#bc-strip span:first-child { left: 8px; }
#bc-strip span:last-child { right: 8px; }
#bc-track { position: absolute; left: 8px; right: 8px; bottom: 8px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.25); }
#bc-thumb { position: absolute; top: 14px; width: 14px; height: 26px; margin-left: -7px; border-radius: 7px; background: #ffd54f; box-shadow: 0 0 6px #ffd54f; }
#bc-center {
  position: absolute; left: 50%; transform: translateX(-50%); width: max-content;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 160px);
  display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none;
}
@media (orientation: landscape) {
  #bc-center { bottom: calc(env(safe-area-inset-bottom, 0px) + 18px); }
}
#bc-power { width: 220px; height: 14px; border-radius: 7px; background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.4); overflow: hidden; display: none; }
#bc-power-fill { height: 100%; width: 0; background: linear-gradient(90deg, #3ff0ff, #ffd54f, #ff3fb4); }
#bc-hint { font-size: 16px; font-weight: 900; font-style: italic; letter-spacing: 1px; color: #fff; text-shadow: 0 2px 4px #000; white-space: nowrap; animation: bc-pulse 1.4s ease-in-out infinite; }
@keyframes bc-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
`;

interface Sample {
  x: number;
  y: number; // screen px, y grows downward
  t: number; // performance.now() ms
}

interface Swipe {
  id: number;
  samples: Sample[];
}

interface SwipeRead {
  /** Upward travel from the swipe's lowest point to its end, as a share of the screen height. */
  travel: number;
  /** The last 120 ms moved upward. */
  movingUp: boolean;
  speed: number;
  spin: number;
  aim: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

const speedFor = (power: number): number => THROW.speedMin + (THROW.speedMax - THROW.speedMin) * clamp(power, 0, 1);
const powerOf = (speed: number): number => (speed - THROW.speedMin) / (THROW.speedMax - THROW.speedMin);

/** Keyboard meter: 0 -> 1 -> 0 over CHARGE_PERIOD seconds. */
function meterAt(t: number): number {
  const ph = (t % CHARGE_PERIOD) / CHARGE_PERIOD;
  return ph < 0.5 ? ph * 2 : (1 - ph) * 2;
}

/** Reads a swipe (screen px samples) into speed, hook and wobble. Null if there are not enough samples. */
function readSwipe(samples: readonly Sample[], spinBias: number, aimYaw: number): SwipeRead | null {
  if (samples.length < 2) return null;
  const W = Math.max(1, window.innerWidth);
  const H = Math.max(1, window.innerHeight);
  const end = samples[samples.length - 1];
  // The backswing (a downward drag first) does not count: travel is measured from the lowest point.
  let low = end.y;
  for (const s of samples) if (s.y > low) low = s.y;
  const travel = (low - end.y) / H;
  // The first sample inside the last WINDOW_MS (the end itself if it is the only one).
  let a = samples[0];
  for (const s of samples) {
    if (end.t - s.t <= WINDOW_MS) {
      a = s;
      break;
    }
  }
  if (a === end) a = samples[samples.length - 2];
  const dt = Math.max((end.t - a.t) / 1000, 0.02);
  const upPx = a.y - end.y;
  const upSpeed = upPx / dt / H; // screen heights per second
  const curl = (end.x - a.x) / dt / W; // screen widths per second; screen-right is -x (the bowler's right)
  const angle = Math.atan2(end.x - a.x, upPx); // away from vertical; screen-right is positive
  return {
    travel,
    movingUp: upPx > 0,
    speed: speedFor((upSpeed - 0.8) / 4.0),
    spin: clamp(spinBias - curl * 0.6, -1, 1),
    aim: aimYaw - clamp(angle * 0.08, -0.04, 0.04),
  };
}

export function createControls(ctx: Ctx): System {
  const state = ctx.state;
  let spinBias = SPIN_DEFAULT;
  let wasCan = false;
  let charging = false;
  let chargeT = 0;
  let swipe: Swipe | null = null;
  let shift = false;
  let anchor = 0; // aimX at the last tick sound
  const keys = new Set<string>();
  const held = new Set<string>(); // 'L' 'R' 'CCW' 'CW': pressed on-screen buttons

  // ---------- DOM ----------
  const root = document.createElement('div');
  root.id = 'bc-root';
  root.style.display = 'none';
  const touch = window.matchMedia('(pointer: coarse)').matches;
  root.innerHTML = `
<style>${CSS}</style>
<div id="bc-pad">
  <button id="bc-b-l" aria-label="Step left">&#9664;</button>
  <button id="bc-b-r" aria-label="Step right">&#9654;</button>
  <button id="bc-b-ccw" aria-label="Turn left">&#8634;</button>
  <button id="bc-b-cw" aria-label="Turn right">&#8635;</button>
</div>
<div id="bc-spin">
  <div id="bc-spin-label">SPIN</div>
  <div id="bc-strip"><span>&#10227; HOOK L</span><span>HOOK R &#10228;</span><div id="bc-track"></div><div id="bc-thumb"></div></div>
</div>
<div id="bc-center">
  <div id="bc-power"><div id="bc-power-fill"></div></div>
  <div id="bc-hint">${touch ? 'SWIPE UP TO BOWL' : 'DRAG UP or hold SPACE'}</div>
</div>`;
  ctx.ui.appendChild(root);

  const el = <T extends HTMLElement>(id: string): T => {
    const e = root.querySelector<T>(`#${id}`);
    if (!e) throw new Error(`controls: missing #${id}`);
    return e;
  };
  const buttons: [HTMLButtonElement, string][] = [
    [el<HTMLButtonElement>('bc-b-l'), 'L'],
    [el<HTMLButtonElement>('bc-b-r'), 'R'],
    [el<HTMLButtonElement>('bc-b-ccw'), 'CCW'],
    [el<HTMLButtonElement>('bc-b-cw'), 'CW'],
  ];
  const power = el<HTMLDivElement>('bc-power');
  const powerFill = el<HTMLDivElement>('bc-power-fill');
  const strip = el<HTMLDivElement>('bc-strip');
  const thumb = el<HTMLDivElement>('bc-thumb');

  for (const [b, name] of buttons) {
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      startAudio();
      held.add(name);
    });
    const stop = (): void => {
      held.delete(name);
    };
    b.addEventListener('pointerup', stop);
    b.addEventListener('pointercancel', stop);
    b.addEventListener('pointerleave', stop);
  }

  // ---------- spin strip: left end = hook left (+spin), right end = hook right (-spin) ----------
  const setSpin = (v: number): void => {
    spinBias = clamp(v, -1, 1);
    thumb.style.left = `${((1 - spinBias) / 2) * 100}%`;
  };
  setSpin(spinBias);
  let spinDrag = false;
  const spinFrom = (clientX: number): void => {
    const r = strip.getBoundingClientRect();
    const f = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
    setSpin(1 - 2 * f);
  };
  strip.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startAudio();
    spinDrag = true;
    strip.setPointerCapture(e.pointerId);
    spinFrom(e.clientX);
  });
  strip.addEventListener('pointermove', (e) => {
    if (spinDrag) spinFrom(e.clientX);
  });
  const endSpin = (): void => {
    spinDrag = false;
  };
  strip.addEventListener('pointerup', endSpin);
  strip.addEventListener('pointercancel', endSpin);

  // ---------- 3D aim guide ----------
  const guide = new THREE.Group();
  guide.visible = false;
  ctx.scene.add(guide);
  const dotGeo = new THREE.CircleGeometry(0.03, 10);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x3ff0ff, transparent: true, opacity: 0.55, depthWrite: false });
  const dots: THREE.Mesh[] = [];
  for (let i = 0; i < GUIDE_DOTS; i++) {
    const m = new THREE.Mesh(dotGeo, dotMat);
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 2;
    guide.add(m);
    dots.push(m);
  }

  // ---------- throwing ----------
  const release = (input: ThrowInput): void => {
    startAudio();
    sfx('swoosh');
    throwBall(state, input);
  };

  const finishSwipe = (samples: readonly Sample[]): void => {
    if (!canBowlHere(state)) return;
    const r = readSwipe(samples, spinBias, state.aimYaw);
    if (!r || !r.movingUp || r.travel < MIN_TRAVEL) return;
    release({ x: state.aimX, aim: r.aim, speed: r.speed, spin: r.spin });
  };

  const sampleOf = (e: PointerEvent): Sample => ({ x: e.clientX, y: e.clientY, t: performance.now() });

  ctx.canvas.addEventListener('pointerdown', (e) => {
    if (swipe || !canBowlHere(state)) return;
    startAudio();
    swipe = { id: e.pointerId, samples: [sampleOf(e)] };
  });
  window.addEventListener('pointermove', (e) => {
    if (!swipe || e.pointerId !== swipe.id) return;
    const s = swipe.samples;
    s.push(sampleOf(e));
    const t = performance.now();
    while (s.length > 2 && t - s[0].t > SWIPE_KEEP_MS) s.shift();
  });
  window.addEventListener('pointerup', (e) => {
    if (!swipe || e.pointerId !== swipe.id) return;
    const samples = swipe.samples;
    samples.push(sampleOf(e));
    swipe = null;
    finishSwipe(samples);
  });
  window.addEventListener('pointercancel', (e) => {
    if (swipe && e.pointerId === swipe.id) swipe = null;
  });

  // ---------- keyboard ----------
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'shift') {
      shift = true;
      return;
    }
    keys.add(k);
    if (!canBowlHere(state)) return;
    if (k === 'arrowleft' || k === 'arrowright' || k === ' ') e.preventDefault();
    if (k === 'q') setSpin(spinBias + SPIN_KEY_STEP);
    else if (k === 'e') setSpin(spinBias - SPIN_KEY_STEP);
    else if (k === ' ' && !e.repeat && !charging) {
      startAudio();
      charging = true;
      chargeT = 0;
    } else if (k === 'enter' && !e.repeat) {
      release({ x: state.aimX, aim: state.aimYaw, speed: speedFor(ENTER_POWER), spin: spinBias });
    }
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'shift') {
      shift = false;
      return;
    }
    keys.delete(k);
    if (k === ' ' && charging) {
      charging = false;
      if (canBowlHere(state)) release({ x: state.aimX, aim: state.aimYaw, speed: speedFor(meterAt(chargeT)), spin: spinBias });
    }
  });
  window.addEventListener('blur', () => {
    keys.clear();
    held.clear();
    shift = false;
    charging = false;
    swipe = null;
  });

  // ---------- per-frame ----------
  const showPower = (frac: number | null): void => {
    if (frac === null) {
      power.style.display = 'none';
      return;
    }
    power.style.display = 'block';
    powerFill.style.width = `${clamp(frac, 0, 1) * 100}%`;
  };

  return {
    update(dt: number): void {
      const can = canBowlHere(state);
      if (!can) {
        if (wasCan) {
          wasCan = false;
          charging = false;
          swipe = null;
          held.clear();
          showPower(null);
        }
        root.style.display = 'none';
        guide.visible = false;
        return;
      }
      if (!wasCan) {
        wasCan = true;
        root.style.display = 'block';
        guide.visible = true;
        anchor = state.aimX;
      }

      for (const [b, name] of buttons) b.classList.toggle('on', held.has(name));

      // Move (+x is the bowler's left) and turn (+yaw is toward +x). Buttons, arrows, Shift+arrows and A/D.
      const left = keys.has('arrowleft');
      const right = keys.has('arrowright');
      const moveIn =
        (held.has('L') ? 1 : 0) - (held.has('R') ? 1 : 0) + (shift ? 0 : (left ? 1 : 0) - (right ? 1 : 0));
      const turnIn =
        (held.has('CCW') ? 1 : 0) - (held.has('CW') ? 1 : 0) +
        (shift && left ? 1 : 0) - (shift && right ? 1 : 0) +
        (keys.has('a') ? 1 : 0) - (keys.has('d') ? 1 : 0);
      const move = clamp(moveIn, -1, 1);
      const turn = clamp(turnIn, -1, 1);
      if (move !== 0) {
        setAim(state, state.aimX + move * MOVE_SPEED * dt, state.aimYaw);
        if (Math.abs(state.aimX - anchor) >= TICK_EVERY) {
          sfx('tick', 0.3);
          anchor = state.aimX;
        }
      } else {
        anchor = state.aimX;
      }
      if (turn !== 0) setAim(state, state.aimX, state.aimYaw + turn * TURN_SPEED * dt);

      if (charging) {
        chargeT += dt;
        showPower(meterAt(chargeT));
      } else if (swipe) {
        const r = readSwipe(swipe.samples, spinBias, state.aimYaw);
        showPower(r && r.movingUp ? powerOf(r.speed) : 0);
      } else {
        showPower(null);
      }

      // Dashed aim line from the release point, with a faint hook tail past z = 11.
      const tanA = Math.tan(state.aimYaw);
      for (let i = 0; i < GUIDE_DOTS; i++) {
        const z = 1 + i;
        const bend = Math.max(0, z - 11) / 6;
        const x = state.aimX + tanA * (z - 0.3) + spinBias * 0.25 * bend * bend;
        dots[i].position.set(x, 0.008, z);
      }
    },
  };
}
