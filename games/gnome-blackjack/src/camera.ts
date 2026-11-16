// Two views of the table, toggled with the button under the volume control (or V), remembered per browser:
// - 'table': the whole table from above the players' side, with a slow cinematic drift. Phones look down from higher up.
// - 'first': through my gnome's eyes. Drag (mouse or finger) to look around; double-click/double-tap to look back at the dealer.
// Switching eases between the two.
import * as THREE from 'three';
import type { TableView } from './scene';

export type CamMode = 'table' | 'first';

export interface CameraRig {
  readonly mode: CamMode;
  toggle(): void;
  /** Call on window resize. */
  resize(): void;
  /** mySeat -1 (not seated yet) shows the table view whatever the mode. t = seconds, for the drift. */
  update(dt: number, mySeat: number, t: number): void;
  /** In first person my own head is behind the camera: where my plate and bubbles go instead (CSS px), else null. */
  selfScreen(): { x: number; y: number } | null;
}

const KEY = 'gnome-blackjack-camera';
/** First person looks at this point by default (across the felt, toward the dealer's hands). */
const LOOK_AT = new THREE.Vector3(0, 0.45, -0.75);
const YAW_MAX = 1.9;
const PITCH_MIN = -1.25;
const PITCH_MAX = 0.55;
const DRAG_RAD_PER_PX = 0.0055;
const EASE = 6;

export function createCameraRig(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement, ui: HTMLElement, view: TableView): CameraRig {
  let mode: CamMode = 'table';
  try {
    if (localStorage.getItem(KEY) === 'first') mode = 'first';
  } catch {
    // storage blocked: default view
  }

  // Look offsets in first person (radians from the default direction).
  let yawOff = 0;
  let pitchOff = 0;
  let snap = true; // jump straight to the first target (no ease from the origin)

  const targetPos = new THREE.Vector3();
  const targetQuat = new THREE.Quaternion();
  const tmp = new THREE.Vector3();
  const helper = new THREE.PerspectiveCamera(); // a camera, so lookAt points its -z (view direction) at the target
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  let fpActive = false;

  // ---- toggle button (own container; never restyle #ui)
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;top:calc(58px + env(safe-area-inset-top));right:calc(8px + env(safe-area-inset-right));pointer-events:auto;z-index:5';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.style.cssText =
    'min-height:40px;padding:0 12px;border-radius:10px;border:1px solid #5b4530;background:rgba(18,12,8,0.85);color:#f4ead8;' +
    'font:600 14px system-ui,sans-serif;cursor:pointer';
  box.appendChild(btn);
  ui.appendChild(box);
  const hint = document.createElement('div');
  hint.style.cssText =
    'position:fixed;left:50%;top:calc(110px + env(safe-area-inset-top));transform:translateX(-50%);pointer-events:none;' +
    'background:rgba(18,12,8,0.8);color:#f4ead8;padding:6px 12px;border-radius:10px;font:13px system-ui,sans-serif;' +
    'transition:opacity 0.6s;opacity:0;text-align:center;width:max-content;max-width:calc(100vw - 32px)';
  ui.appendChild(hint);
  let hintTimer: ReturnType<typeof setTimeout> | null = null;

  function label(): void {
    btn.textContent = mode === 'table' ? '👁 First person' : '🎲 Table view';
  }
  label();

  function setMode(m: CamMode): void {
    mode = m;
    yawOff = 0;
    pitchOff = 0;
    label();
    try {
      localStorage.setItem(KEY, m);
    } catch {
      // ignore
    }
    if (m === 'first') {
      hint.textContent = matchMedia('(pointer: coarse)').matches ? 'Drag to look around · double-tap to recentre' : 'Drag to look around · double-click to recentre';
      hint.style.opacity = '1';
      if (hintTimer) clearTimeout(hintTimer);
      hintTimer = setTimeout(() => (hint.style.opacity = '0'), 3500);
    } else hint.style.opacity = '0';
  }
  btn.addEventListener('click', () => setMode(mode === 'table' ? 'first' : 'table'));
  window.addEventListener('keydown', (e) => {
    if (e.repeat || (e.target as Element | null)?.closest?.('input, textarea')) return;
    if (e.key === 'v' || e.key === 'V') setMode(mode === 'table' ? 'first' : 'table');
  });

  // ---- drag to look (first person only). Pointer events cover mouse, pen and touch.
  let dragId: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let lastTap = 0;
  canvas.addEventListener('pointerdown', (e) => {
    if (!fpActive) return;
    const now = performance.now();
    if (now - lastTap < 300) {
      yawOff = 0;
      pitchOff = 0;
    }
    lastTap = now;
    dragId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== dragId) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    // Drag right turns right; drag up looks up.
    yawOff = THREE.MathUtils.clamp(yawOff - dx * DRAG_RAD_PER_PX, -YAW_MAX, YAW_MAX);
    pitchOff = THREE.MathUtils.clamp(pitchOff - dy * DRAG_RAD_PER_PX, -1, 1);
  });
  const endDrag = (e: PointerEvent): void => {
    if (e.pointerId === dragId) dragId = null;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // ---- targets
  function tableTarget(t: number): number {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    // Phones (portrait or short landscape) look down from higher up, so the seats spread over the screen.
    const phone = aspect < 1 || h < 500;
    const dir = phone ? tmp.set(0, 6.4, 2.4) : tmp.set(0, 2.9, 4.4);
    const look = phone ? new THREE.Vector3(0, 0.3, 0.45) : new THREE.Vector3(0, 0.45, -0.1);
    const fov = 50;
    const halfH = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    // Back off until the table (about 5.5 wide at the gnomes) fits the width.
    const dist = Math.max(dir.length(), 3.0 / (halfH * aspect) + 0.6);
    dir.normalize();
    // Slow drift: a few degrees of orbit and a little rise and fall.
    const drift = phone ? 0.025 : 0.07;
    dir.applyAxisAngle(THREE.Object3D.DEFAULT_UP, drift * Math.sin(t * 0.13));
    targetPos.copy(look).addScaledVector(dir, dist);
    targetPos.y += (phone ? 0.05 : 0.12) * Math.sin(t * 0.21);
    helper.position.copy(targetPos);
    helper.lookAt(look);
    targetQuat.copy(helper.quaternion);
    return fov;
  }

  function firstTarget(seat: number): number {
    view.eyePos(seat, targetPos);
    const d = tmp.copy(LOOK_AT).sub(targetPos);
    const baseYaw = Math.atan2(-d.x, -d.z); // camera looks down -z at yaw 0
    const basePitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
    euler.set(THREE.MathUtils.clamp(basePitch + pitchOff, PITCH_MIN, PITCH_MAX), baseYaw + yawOff, 0);
    targetQuat.setFromEuler(euler);
    // Wide enough sideways to see both neighbours, even on a portrait phone.
    const aspect = window.innerWidth / window.innerHeight;
    const vfov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(50)) / aspect));
    return THREE.MathUtils.clamp(vfov, 62, 100);
  }

  return {
    get mode() {
      return mode;
    },
    toggle() {
      setMode(mode === 'table' ? 'first' : 'table');
    },
    resize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    },
    update(dt, mySeat, t) {
      fpActive = mode === 'first' && mySeat >= 0;
      canvas.style.cursor = fpActive ? (dragId !== null ? 'grabbing' : 'grab') : '';
      const fov = fpActive ? firstTarget(mySeat) : tableTarget(t);
      const k = snap ? 1 : 1 - Math.exp(-EASE * dt);
      snap = false;
      camera.position.lerp(targetPos, k);
      camera.quaternion.slerp(targetQuat, k);
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov += (fov - camera.fov) * k;
        camera.updateProjectionMatrix();
      }
    },
    selfScreen() {
      if (!fpActive) return null;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const phone = w < 640 || h < 500;
      return { x: phone ? 70 : w / 2, y: h - (phone ? 84 : 112) };
    },
  };
}
