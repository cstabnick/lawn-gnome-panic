// Gnome Disc: Disco (a living frisbee with googly eyes and noodle arms) grabs the gnome by his boots, whirls him
// round hammer-throw style and lets go. The gnome flies flat and spinning like a disc toward a chain basket.
// This system owns Disco, the flying gnome, the basket, the aim preview path and the whirl/tilt/flail UI.
// Rules (strokes, flight, flails) go through round.ts; physics lives in discPhysics.ts.
import * as THREE from 'three';
import { DISC, GOLFER_LOOK, type Ctx, type GameState, type System } from './config';
import { heightAt } from './course';
import { bankOf, previewThrow, type DiscFlight } from './discPhysics';
import { createGnomeModel } from './models/gnome';
import type { PlayerState } from './models/config';
import { canAct, currentHole, flailThrow, fmtDistance, meterSpeedScale, skipIntro, takeThrow } from './round';
import { sfx, startAudio } from './audio';

const DISCO_R = 0.8;          // Disco's radius, yards
const DISCO_CENTER_Y = 1.15;  // his middle above the ground when standing
const HAND_X = -0.95;         // right hand, in Disco's frame (right is -x)
const STAND_LEFT = 1.2;       // Disco stands this far left of the throw line, so he does not block the view
const SPIN_VISUAL = 22;       // rad/s of visible gnome spin at full disc spin
const PREVIEW_DOTS = 48;
const FLASH_SECONDS = 1.4;
const TILT_NAMES = ['FLAT', 'HYZER', 'ANHYZER'];

const CSS = `
#gd-root { position:absolute; inset:0; z-index:3; pointer-events:none; color:#fff; font-family:system-ui, sans-serif; text-shadow:0 1px 2px #000; -webkit-user-select:none; user-select:none; }
#gd-root.gd-hidden, #gd-root .gd-hidden { display:none !important; }
#gd-tilt { position:absolute; left:max(8px, env(safe-area-inset-left)); bottom:max(10px, env(safe-area-inset-bottom)); width:230px; }
#gd-trow { display:flex; align-items:center; background:rgba(60,20,0,0.55); border-radius:10px; padding:2px; }
#gd-tl, #gd-tr { pointer-events:auto; touch-action:manipulation; width:48px; height:48px; flex:0 0 48px; display:flex; align-items:center; justify-content:center; font-size:22px; border-radius:10px; cursor:pointer; }
#gd-tl:active, #gd-tr:active { background:rgba(255,255,255,0.2); }
#gd-tlabel { flex:1; text-align:center; line-height:1.15; }
#gd-tname { font-weight:800; font-size:15px; }
#gd-tsub { font-size:12px; opacity:0.9; white-space:nowrap; }
#gd-throw { pointer-events:auto; touch-action:none; position:absolute; right:max(12px, env(safe-area-inset-right)); bottom:calc(max(12px, env(safe-area-inset-bottom)) + 66px); width:96px; height:96px; border-radius:50%; background:radial-gradient(circle at 35% 30%, #ffb36b, #e2541c); border:3px solid rgba(255,255,255,0.9); box-shadow:0 3px 8px rgba(0,0,0,0.45); color:#2a0e00; text-shadow:none; display:flex; flex-direction:column; align-items:center; justify-content:center; font-weight:900; font-size:15px; line-height:1.05; text-align:center; cursor:pointer; }
#gd-throw small { font-size:11px; font-weight:700; }
#gd-throw.gd-flail { background:radial-gradient(circle at 35% 30%, #a8f07a, #3a9a2a); }
#gd-throw.gd-off { opacity:0.45; }
#gd-dial { position:absolute; left:50%; transform:translateX(-50%); bottom:calc(env(safe-area-inset-bottom) + 12px); width:170px; text-align:center; }
@media (orientation: portrait) { #gd-dial { bottom:calc(env(safe-area-inset-bottom) + 176px); } }
#gd-dial svg { display:block; width:150px; height:150px; margin:0 auto; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
#gd-dtext { font-weight:800; font-size:16px; margin-top:2px; }
#gd-flash { position:absolute; left:50%; top:38%; transform:translate(-50%,-50%); font-size:clamp(26px, 8vw, 46px); font-weight:900; letter-spacing:0.04em; opacity:0; transition:opacity 0.2s; white-space:nowrap; }
#gd-flash.gd-on { opacity:1; }
#gd-help { position:absolute; left:50%; transform:translateX(-50%); bottom:calc(env(safe-area-inset-bottom) + 14px); max-width:min(92vw, 520px); padding:6px 12px; border-radius:14px; background:rgba(60,20,0,0.55); font-size:13px; text-align:center; }
@media (orientation: portrait) { #gd-help { bottom:calc(env(safe-area-inset-bottom) + 176px); } }
`;

function wrap(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function mat(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
}

/** A unit cylinder (height 1 along y, base at 0) stretched from a to b. */
function stretch(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3): void {
  const d = new THREE.Vector3().subVectors(b, a);
  const len = d.length();
  mesh.position.copy(a);
  mesh.scale.set(1, Math.max(0.001, len), 1);
  if (len > 1e-5) mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.divideScalar(len));
}

interface Disco {
  group: THREE.Group;
  /** Rotates about the disc's own axis (rolling). */
  wheel: THREE.Group;
  armR: THREE.Mesh;
  armL: THREE.Mesh;
  handR: THREE.Mesh;
  handL: THREE.Mesh;
  legs: THREE.Group;
  pupils: THREE.Mesh[];
  /** The gnome hangs from this (in Disco's frame, at the right hand). */
  grip: THREE.Group;
}

/** Disco: a big orange disc standing on its rim, face toward -z (toward the camera behind the throw). */
function buildDisco(): Disco {
  const group = new THREE.Group();
  const wheel = new THREE.Group();
  wheel.position.y = DISCO_CENTER_Y;
  group.add(wheel);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(DISCO_R, DISCO_R, 0.14, 40), mat(0xff7a1a));
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(DISCO_R, 0.08, 10, 40), mat(0xd4500a));
  rim.castShadow = true;
  const plate = new THREE.Mesh(new THREE.TorusGeometry(DISCO_R * 0.55, 0.025, 6, 32), mat(0xffd27a));
  plate.position.z = -0.075;
  const plateBack = plate.clone();
  plateBack.position.z = 0.075;
  wheel.add(body, rim, plate, plateBack);

  // Googly eyes and a big grin on the face side (-z).
  const white = mat(0xffffff, { roughness: 0.3 });
  const black = mat(0x111111, { roughness: 0.3 });
  const pupils: THREE.Mesh[] = [];
  for (const x of [-0.26, 0.26]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), white);
    eye.scale.z = 0.45;
    eye.position.set(x, 0.2, -0.08);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), black);
    pupil.position.set(x, 0.2, -0.16);
    wheel.add(eye, pupil);
    pupils.push(pupil);
  }
  const grin = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.035, 8, 24, Math.PI), black);
  grin.rotation.z = Math.PI;
  grin.position.set(0, -0.08, -0.085);
  wheel.add(grin);

  // Noodle arms (stretched each frame) and white glove hands.
  const armGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 8);
  armGeo.translate(0, 0.5, 0);
  const armMat = mat(0xd4500a);
  const glove = mat(0xffffff, { roughness: 0.5 });
  const armR = new THREE.Mesh(armGeo, armMat);
  const armL = new THREE.Mesh(armGeo, armMat);
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), glove);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), glove);
  for (const m of [armR, armL, handR, handL]) m.castShadow = true;
  group.add(armR, armL, handR, handL);

  // Stubby legs and red sneakers.
  const legs = new THREE.Group();
  const legMat = mat(0xd4500a);
  const shoe = mat(0xe53935);
  for (const x of [-0.22, 0.22]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, DISCO_CENTER_Y - DISCO_R + 0.05, 8), legMat);
    leg.position.set(x, (DISCO_CENTER_Y - DISCO_R) / 2 + 0.03, 0);
    const sneaker = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.28), shoe);
    sneaker.position.set(x, 0.045, -0.05);
    sneaker.castShadow = true;
    legs.add(leg, sneaker);
  }
  group.add(legs);

  const grip = new THREE.Group();
  group.add(grip);
  return { group, wheel, armR, armL, handR, handL, legs, pupils, grip };
}

/** A disc golf basket: pole, tray, yellow top band and a skirt of chains. */
function buildBasket(): { group: THREE.Group; chains: THREE.Group } {
  const group = new THREE.Group();
  const metal = mat(0xb8bec4, { metalness: 0.7, roughness: 0.35 });
  const yellow = mat(0xffd23f, { metalness: 0.3, roughness: 0.4 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.75, 10), metal);
  pole.position.y = 0.875;
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.62, 0.3, 24, 1, true), metal);
  tray.position.y = 0.55;
  const trayBottom = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), metal);
  trayBottom.rotation.x = -Math.PI / 2;
  trayBottom.position.y = 0.41;
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 28), yellow);
  band.rotation.x = Math.PI / 2;
  band.position.y = 1.65;
  for (const m of [pole, tray, trayBottom, band]) m.castShadow = true;
  (tray.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  group.add(pole, tray, trayBottom, band);
  const chains = new THREE.Group();
  const chainMat = mat(0xd9dde2, { metalness: 0.8, roughness: 0.3 });
  const chainGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 4);
  chainGeo.translate(0, 0.5, 0);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const r = i % 2 === 0 ? 0.58 : 0.4;
    const c = new THREE.Mesh(chainGeo, chainMat);
    stretch(c, new THREE.Vector3(Math.cos(a) * 0.06, 0.78, Math.sin(a) * 0.06), new THREE.Vector3(Math.cos(a) * r, 1.64, Math.sin(a) * r));
    chains.add(c);
  }
  group.add(chains);
  return { group, chains };
}

function playerState(): PlayerState {
  return {
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    facing: 0,
    grounded: true,
    jumpsUsed: 0,
    stamina: 1,
    staminaDelay: 0,
    sprinting: false,
    exhausted: false,
  };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, id: string, parent: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.id = id;
  parent.appendChild(e);
  return e;
}

function setText(e: HTMLElement, t: string): void {
  if (e.textContent !== t) e.textContent = t;
}

function tiltLabel(tilt: number): { name: string; sub: string } {
  if (tilt === 0) return { name: TILT_NAMES[0], sub: 'fades left' };
  const n = Math.abs(tilt);
  return tilt > 0 ? { name: `${TILT_NAMES[1]} ${n}`, sub: 'bends left' } : { name: `${TILT_NAMES[2]} ${n}`, sub: 'bends right' };
}

export function createDisc(ctx: Ctx): System {
  const { scene, state, ui } = ctx;

  // ---- 3D -------------------------------------------------------------------
  const disco = buildDisco();
  scene.add(disco.group);

  const gnome = createGnomeModel(GOLFER_LOOK);
  const gps = playerState();
  // flyer (world position + yaw) > bank > spinner > gnome lying face down, belly on the spin axis.
  const flyer = new THREE.Group();
  const bankG = new THREE.Group();
  const spinner = new THREE.Group();
  const lay = new THREE.Group();
  flyer.add(bankG);
  bankG.add(spinner);
  spinner.add(lay);
  scene.add(flyer);

  const basket = buildBasket();
  scene.add(basket.group);

  // Aim preview: dots along the predicted path, and a ring where it lands.
  const dotGeo = new THREE.SphereGeometry(0.11, 8, 6);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffb36b, transparent: true, opacity: 0.85 });
  const dots = new THREE.InstancedMesh(dotGeo, dotMat, PREVIEW_DOTS);
  dots.frustumCulled = false;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1, 40),
    new THREE.MeshBasicMaterial({ color: 0xffb36b, transparent: true, opacity: 0.85, depthTest: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.renderOrder = 5;
  const preview = new THREE.Group();
  preview.add(dots, ring);
  scene.add(preview);
  let previewKey = '';
  let previewYards = 0;
  let ringBase = 1;
  const m4 = new THREE.Matrix4();

  function updatePreview(power: number): void {
    const b = state.ball;
    const key = `${b.x.toFixed(2)},${b.z.toFixed(2)},${state.aimYaw.toFixed(3)},${state.disc.tilt},${power.toFixed(2)},${state.holeIndex}`;
    if (key === previewKey) return;
    previewKey = key;
    const pts = previewThrow(b, state.aimYaw, power, state.disc.tilt, state.lie, currentHole(state).pin);
    const last = pts[pts.length - 1];
    for (let i = 0; i < PREVIEW_DOTS; i++) {
      const p = pts[Math.min(pts.length - 1, Math.floor(((i + 1) / (PREVIEW_DOTS + 1)) * pts.length))];
      m4.makeTranslation(p.x, p.y, p.z);
      dots.setMatrixAt(i, m4);
    }
    dots.instanceMatrix.needsUpdate = true;
    previewYards = Math.hypot(last.x - b.x, last.z - b.z);
    ring.position.set(last.x, heightAt(last.x, last.z) + 0.08, last.z);
    ringBase = Math.max(0.6, previewYards * 0.03);
  }

  // ---- UI -------------------------------------------------------------------
  const root = el('div', 'gd-root', ui);
  const style = document.createElement('style');
  style.textContent = CSS;
  root.appendChild(style);
  const tiltBox = el('div', 'gd-tilt', root);
  const trow = el('div', 'gd-trow', tiltBox);
  const tl = el('div', 'gd-tl', trow);
  tl.textContent = '↶';
  tl.title = 'Hyzer: bend left (Q / ↑)';
  const tlabel = el('div', 'gd-tlabel', trow);
  const tname = el('div', 'gd-tname', tlabel);
  const tsub = el('div', 'gd-tsub', tlabel);
  const tr = el('div', 'gd-tr', trow);
  tr.textContent = '↷';
  tr.title = 'Anhyzer: bend right (E / ↓)';
  const throwBtn = el('div', 'gd-throw', root);
  const dial = el('div', 'gd-dial', root);
  dial.innerHTML = `<svg viewBox="-60 -60 120 120" aria-hidden="true">
  <circle r="44" fill="rgba(60,20,0,0.55)" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
  <path id="gd-win" fill="rgba(120,230,90,0.85)"/>
  <circle r="52" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="7"/>
  <path id="gd-pow" fill="none" stroke="#ffd84d" stroke-width="7" stroke-linecap="round"/>
  <path d="M0 -40 L6 -30 L-6 -30 Z" fill="#fff"/>
  <circle r="13" fill="#ff7a1a" stroke="#d4500a" stroke-width="3"/>
  <g id="gd-dot"><circle r="8" fill="#f4f4f4" stroke="#222" stroke-width="1.5"/><path d="M-5 -4 L0 -15 L5 -4 Z" fill="#d93636"/></g>
</svg><div id="gd-dtext"></div>`;
  const winPath = dial.querySelector('#gd-win') as SVGPathElement;
  const powPath = dial.querySelector('#gd-pow') as SVGPathElement;
  const dotG = dial.querySelector('#gd-dot') as SVGGElement;
  const dtext = dial.querySelector('#gd-dtext') as HTMLElement;
  const flash = el('div', 'gd-flash', root);
  const help = el('div', 'gd-help', root);
  help.textContent = 'Hold WHIRL (or Space) · let go when the gnome hits the green wedge · tap FLAIL mid-air';

  // The release wedge: the gnome is on Disco's right (3 o'clock on the dial) when its velocity points along the aim.
  {
    const a = DISC.perfectWindow;
    const p = (ang: number, r: number): string => `${(Math.cos(ang) * r).toFixed(2)} ${(-Math.sin(ang) * r).toFixed(2)}`;
    winPath.setAttribute('d', `M0 0 L${p(-a, 44)} A44 44 0 0 0 ${p(a, 44)} Z`);
  }

  let flashT = 0;
  function showFlash(text: string, color = '#ffd84d'): void {
    flash.textContent = text;
    flash.style.color = color;
    flashT = FLASH_SECONDS;
  }

  // ---- Input ----------------------------------------------------------------
  const active = (): boolean => state.mode === 'disc';
  let lastWhoosh = 0;

  function startWhirl(): void {
    if (!active() || state.phase !== 'aim' || !canAct(state)) return;
    startAudio();
    state.phase = 'swing';
    state.phaseTime = 0;
    state.disc.held = 0;
    state.disc.orbit = state.aimYaw - 0.6;
    lastWhoosh = state.disc.orbit;
    sfx('tick');
  }

  function release(dizzy = false): void {
    if (!active() || state.phase !== 'swing' || !canAct(state)) return;
    const d = state.disc;
    const power = Math.min(DISC.maxPower, d.held / DISC.windupSeconds);
    let err = wrap(d.orbit - state.aimYaw);
    if (dizzy) err = (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 1.6);
    takeThrow(state, Math.max(0.03, dizzy ? 0.85 : power), err, dizzy);
    sfx('swing');
    sfx('wheee');
    if (dizzy) showFlash('DISCO GOT DIZZY!', '#ff8a7a');
    else if (Math.abs(err) < DISC.perfectWindow) showFlash('PERFECT RELEASE');
    else if (err < 0) showFlash('EARLY ↷', '#ff8a7a');
    else showFlash('LATE ↶', '#ff8a7a');
  }

  function flail(): void {
    if (!active() || !canAct(state)) return;
    if (flailThrow(state)) {
      sfx('flail');
      showFlash(state.disc.flails > 0 ? 'FLAIL!' : 'LAST FLAIL!', '#a8f07a');
    }
  }

  function changeTilt(delta: number): void {
    if (!active() || state.phase !== 'aim' || !canAct(state)) return;
    const t = Math.max(-DISC.maxTilt, Math.min(DISC.maxTilt, state.disc.tilt + delta));
    if (t !== state.disc.tilt) {
      state.disc.tilt = t;
      sfx('tick');
    }
  }

  throwBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (state.phase === 'intro') {
      skipIntro(state);
      return;
    }
    if (state.phase === 'flight') {
      flail();
      return;
    }
    startWhirl();
    try {
      throwBtn.setPointerCapture(e.pointerId);
    } catch {
      // Capture is best effort.
    }
  });
  const letGo = (e: PointerEvent): void => {
    e.preventDefault();
    release();
  };
  throwBtn.addEventListener('pointerup', letGo);
  throwBtn.addEventListener('pointercancel', letGo);
  tl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startAudio();
    changeTilt(1);
  });
  tr.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startAudio();
    changeTilt(-1);
  });

  window.addEventListener('keydown', (e) => {
    if (!active()) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === 'ArrowUp' || k === 'ArrowDown') e.preventDefault();
    if (e.repeat) return;
    if (k === ' ') {
      if (state.phase === 'aim') startWhirl();
      else if (state.phase === 'flight') flail();
    } else if (k === 'f') {
      flail();
    } else if (k === 'q' || k === 'ArrowUp' || k === 'w') {
      changeTilt(1);
    } else if (k === 'e' || k === 'ArrowDown' || k === 's') {
      changeTilt(-1);
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === ' ') release();
  });
  window.addEventListener('blur', () => release());

  // ---- Per-frame posing ------------------------------------------------------
  const discoSpot = new THREE.Vector3();
  let discoYaw = 0;
  let rollAngle = 0;
  const driveFrom = new THREE.Vector3();
  let prevPhase: GameState['phase'] = 'title';
  let spinAngle = 0;
  let chainJiggle = 0;
  let lastFlight: DiscFlight | null = null;
  let eventIdx = 0;
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const tmpC = new THREE.Vector3();

  /** Where Disco stands for the next throw: just left of the ball, square to the aim. */
  function standSpot(out: THREE.Vector3): THREE.Vector3 {
    const a = state.aimYaw;
    const x = state.ball.x + Math.cos(a) * STAND_LEFT;
    const z = state.ball.z - Math.sin(a) * STAND_LEFT;
    return out.set(x, Math.max(0, heightAt(x, z)), z);
  }
  const driveTo = new THREE.Vector3();

  /** Gnome arms: hands out like a flying squirrel, or flapping for a flail. */
  function gnomeArms(flapping: boolean, t: number): void {
    if (flapping) {
      const f = Math.sin(t * 40) * 0.9;
      gnome.arms.left.rotation.set(-1.6 + f, 0, 1.2);
      gnome.arms.right.rotation.set(-1.6 - f, 0, -1.2);
    } else {
      gnome.arms.left.rotation.set(-0.3, 0, 1.4);
      gnome.arms.right.rotation.set(-0.3, 0, -1.4);
    }
  }

  function flightSample(f: DiscFlight, t: number, out: THREE.Vector3): number {
    const idx = Math.min(f.points.length - 1, Math.max(0, t / f.sampleDt));
    const i = Math.floor(idx);
    const j = Math.min(i + 1, f.points.length - 1);
    out.lerpVectors(f.points[i], f.points[j], idx - i);
    return i;
  }

  /** Puts the gnome model in Disco's grip (hanging upside down, or flung out sideways during the whirl). */
  function gnomeInGrip(whirling: boolean, dt: number): void {
    if (gnome.object.parent !== disco.grip) disco.grip.add(gnome.object);
    gps.grounded = !whirling;
    gps.velocity.set(0, 0, 0);
    gnome.update(gps, dt);
    gnome.object.position.set(0, 0, 0);
    gnome.object.rotation.set(0, 0, 0);
    if (whirling) {
      // Boots in the glove, body straight out along -x (Disco's right).
      disco.grip.position.set(HAND_X, DISCO_CENTER_Y - 0.05, 0);
      disco.grip.rotation.set(0, 0, Math.PI / 2);
      gnomeArms(true, state.time);
    } else {
      // Hanging upside down by the boots from the raised right glove, swaying a little.
      disco.grip.position.set(HAND_X - 0.05, DISCO_CENTER_Y + 0.55, 0);
      disco.grip.rotation.set(0.12 * Math.sin(state.time * 2.2), 0, Math.PI + 0.1 * Math.sin(state.time * 1.7));
      gnome.arms.left.rotation.set(0, 0, 0.35 + 0.15 * Math.sin(state.time * 3));
      gnome.arms.right.rotation.set(0, 0, -0.35 - 0.15 * Math.sin(state.time * 3));
    }
  }

  /** Puts the gnome model in the world-space flyer (flying, skidding, lying, or hanging in the chains). */
  function gnomeInFlyer(): void {
    if (gnome.object.parent !== lay) {
      lay.add(gnome.object);
    }
    // Lying along lay's +y; lay is turned so that is forward and the face is down. Belly on the spin axis.
    gnome.object.position.set(0, -0.5, 0);
    gnome.object.rotation.set(0, 0, 0);
  }

  function poseDisco(dt: number): void {
    const s = state;
    const d = s.disc;
    const g = disco.group;
    const whirling = s.phase === 'swing';
    const throwing = s.phase === 'flight' || s.phase === 'result';
    let legsOn = true;

    if (s.phase === 'drive' && s.drive) {
      // Disco rolls on his rim to the next lie beside the mower.
      const u = Math.min(1, s.phaseTime / s.drive.duration);
      const e = u * u * (3 - 2 * u);
      standSpot(driveTo);
      tmpA.lerpVectors(driveFrom, driveTo, e);
      const travel = Math.atan2(driveTo.x - driveFrom.x, driveTo.z - driveFrom.z);
      const dist = driveFrom.distanceTo(driveTo);
      g.position.set(tmpA.x, Math.max(0, heightAt(tmpA.x, tmpA.z)) - (DISCO_CENTER_Y - DISCO_R), tmpA.z);
      g.rotation.set(0, travel - Math.PI / 2, 0);
      rollAngle = -(e * dist) / DISCO_R;
      disco.wheel.rotation.set(0, 0, rollAngle);
      legsOn = false;
    } else {
      g.position.set(discoSpot.x, discoSpot.y, discoSpot.z);
      disco.wheel.rotation.set(0, 0, 0);
      if (whirling) {
        discoYaw = d.orbit;
      } else if (throwing) {
        // Follow-through: keeps spinning, slowing to a stop facing the throw.
        const target = s.aimYaw;
        discoYaw = discoYaw + wrap(target - discoYaw) * Math.min(1, dt * 2.5);
        if (s.phase === 'flight' && s.phaseTime < 0.8) discoYaw += (1 - s.phaseTime / 0.8) * 12 * dt;
      } else {
        discoYaw = s.aimYaw + 0.05 * Math.sin(s.time * 1.3);
      }
      g.rotation.set(0, discoYaw, 0);
      // Jump for joy when the gnome hits the chains, bob while idle.
      let bob = 0.03 * Math.sin(s.time * 3);
      if (s.phase === 'holed') bob = Math.abs(Math.sin(s.time * 7)) * 0.5;
      g.position.y += bob;
    }
    disco.legs.visible = legsOn;

    // Googly pupils rattle about.
    const rattle = whirling || s.phase === 'flight' ? 0.05 : 0.015;
    disco.pupils.forEach((p, i) => {
      p.position.x = (i === 0 ? -0.26 : 0.26) + Math.sin(s.time * (11 + i * 3)) * rattle;
      p.position.y = 0.2 + Math.cos(s.time * (13 + i * 2)) * rattle;
    });

    // Arms: from the rim to the hands. The right glove holds the gnome (or reaches out after the throw).
    g.updateMatrixWorld(true);
    const shoulderR = tmpA.set(-DISCO_R + 0.05, DISCO_CENTER_Y, 0);
    const shoulderL = tmpB.set(DISCO_R - 0.05, DISCO_CENTER_Y, 0);
    const handR = tmpC;
    if (s.phase === 'drive') {
      handR.set(-DISCO_R - 0.2, DISCO_CENTER_Y + 0.4 * Math.sin(s.time * 9), 0);
    } else if (whirling) {
      handR.set(HAND_X, DISCO_CENTER_Y - 0.05, 0);
    } else if (throwing || s.phase === 'holed') {
      handR.set(HAND_X - 0.1, DISCO_CENTER_Y + 0.7, 0.2);
    } else {
      handR.set(HAND_X, DISCO_CENTER_Y + 0.55, 0);
    }
    const toWorld = (v: THREE.Vector3): THREE.Vector3 => {
      if (s.phase === 'drive') {
        // While rolling the arms go round with the wheel.
        const c = Math.cos(rollAngle);
        const sn = Math.sin(rollAngle);
        const x = v.x;
        const y = v.y - DISCO_CENTER_Y;
        v.set(x * c - y * sn, DISCO_CENTER_Y + x * sn + y * c, v.z);
      }
      return v;
    };
    toWorld(shoulderR);
    toWorld(shoulderL);
    toWorld(handR);
    const handL = new THREE.Vector3(DISCO_R + 0.35, DISCO_CENTER_Y + (whirling ? 0.1 : 0.3 + 0.25 * Math.sin(s.time * 4)), whirling ? 0 : -0.15);
    if (s.phase === 'holed') handL.y = DISCO_CENTER_Y + 0.8;
    toWorld(handL);
    stretch(disco.armR, shoulderR, handR);
    stretch(disco.armL, shoulderL, handL);
    disco.handR.position.copy(handR);
    disco.handL.position.copy(handL);
  }

  function poseGnome(dt: number): void {
    const s = state;
    const f = s.flight as DiscFlight | null;
    const isDisc = f !== null && 'vels' in f;
    flyer.visible = false;
    gnome.object.visible = true;

    if (s.phase === 'intro' || s.phase === 'aim' || s.phase === 'swing') {
      gnomeInGrip(s.phase === 'swing', dt);
      return;
    }
    if (s.phase === 'drive' || s.phase === 'card' || s.phase === 'final' || s.phase === 'title') {
      gnome.object.visible = false;
      return;
    }
    if (!f || !isDisc) {
      gnome.object.visible = false;
      return;
    }
    gps.grounded = false;
    gps.velocity.set(0, 0, 0);
    gnome.update(gps, dt); // resets the model's transform, so it goes first
    gnomeInFlyer();
    flyer.visible = true;
    const t = s.phase === 'flight' ? s.phaseTime : f.duration;
    const i = flightSample(f, t, tmpA);
    flyer.position.copy(tmpA);
    const v = f.vels[Math.min(i, f.vels.length - 1)];
    const vh = Math.hypot(v.x, v.z);
    if (vh > 0.3) flyer.rotation.set(0, Math.atan2(v.x, v.z), 0);
    const airborne = t < f.airborneUntil && !(f.holed && t >= f.duration - 0.05);

    if (f.holed && t >= f.duration - 0.05) {
      // Tangled in the chains, upright-ish, waving.
      flyer.position.y -= 0.55;
      bankG.rotation.set(0, 0, 0.35 * Math.sin(s.time * 3));
      spinner.rotation.set(0, s.time * 0.8, 0);
      lay.rotation.set(0.5, 0, 0);
      lay.position.set(0, 0, 0);
      gnome.object.position.set(0, 0, 0);
      gnome.arms.left.rotation.set(-2.7 + 0.4 * Math.sin(s.time * 9), 0, 0.3);
      gnome.arms.right.rotation.set(-2.7 - 0.4 * Math.sin(s.time * 9), 0, -0.3);
      return;
    }
    if (f.endLie === 'water' && t >= f.duration - 0.05) {
      gnome.object.visible = false;
      return;
    }
    if (airborne) {
      const spin = f.spins[Math.min(i, f.spins.length - 1)];
      spinAngle += dt * SPIN_VISUAL * Math.max(0.15, spin);
      bankG.rotation.set(0, 0, -bankOf(s.disc.tilt) * 0.8 + 0.08 * Math.sin(s.time * 7));
      spinner.rotation.set(0, spinAngle, 0);
      lay.rotation.set(Math.PI / 2, 0, 0);
      lay.position.set(0, 0, 0);
      const flapping = s.disc.lastFlail >= 0 && s.time - s.disc.lastFlail < 0.5;
      gnomeArms(flapping, s.time);
    } else {
      // Skidding on his face, then lying there. In 'result' he pushes himself up at the end.
      bankG.rotation.set(0, 0, 0);
      const resting = s.phase === 'result';
      const up = resting ? Math.max(0, Math.min(1, (s.phaseTime - 0.7) / 0.5)) : 0;
      spinner.rotation.set(0, resting ? 0 : Math.sin(s.time * 20) * 0.1, 0);
      lay.rotation.set((Math.PI / 2) * (1 - up), 0, 0);
      lay.position.set(0, 0.12 * (1 - up), 0);
      gnome.object.position.set(0, -0.5 * (1 - up), 0);
      flyer.position.y = Math.max(0, heightAt(flyer.position.x, flyer.position.z));
      if (up > 0) {
        gnome.arms.left.rotation.set(-2.6 * up, 0, 0.2);
        gnome.arms.right.rotation.set(-2.6 * up, 0, -0.2);
      } else {
        gnome.arms.left.rotation.set(-2.9, 0, 0.5);
        gnome.arms.right.rotation.set(-2.9, 0, -0.5);
      }
    }
  }

  function renderUi(): void {
    const s = state;
    const on = active() && s.phase !== 'title' && s.phase !== 'card' && s.phase !== 'final' && canAct(s);
    root.classList.toggle('gd-hidden', !on);
    if (!on) return;
    const aim = s.phase === 'aim';
    const whirling = s.phase === 'swing';
    const flying = s.phase === 'flight';

    // Tilt panel.
    tiltBox.classList.toggle('gd-hidden', !(aim || whirling));
    const tlab = tiltLabel(s.disc.tilt);
    setText(tname, tlab.name);
    setText(tsub, `${tlab.sub} · ≈${fmtDistance(previewYards, s.lie)}`);
    tl.style.opacity = aim && s.disc.tilt < DISC.maxTilt ? '1' : '0.4';
    tr.style.opacity = aim && s.disc.tilt > -DISC.maxTilt ? '1' : '0.4';

    // Big button: WHIRL (hold), FLAIL (in flight).
    const f = s.flight as DiscFlight | null;
    const canFl = flying && f !== null && 'vels' in f && s.disc.flails > 0 && s.phaseTime < f.airborneUntil;
    throwBtn.classList.toggle('gd-hidden', !(aim || whirling || flying || s.phase === 'intro'));
    throwBtn.classList.toggle('gd-flail', flying);
    throwBtn.classList.toggle('gd-off', flying && !canFl);
    const html = flying ? `FLAIL<small>${s.disc.flails} left</small>` : whirling ? 'LET<br>GO!' : 'HOLD TO<br>WHIRL';
    if (throwBtn.innerHTML !== html) throwBtn.innerHTML = html;

    // Dial during the whirl.
    dial.classList.toggle('gd-hidden', !whirling);
    help.classList.toggle('gd-hidden', !aim);
    if (whirling) {
      const power = Math.min(DISC.dizzyPower, s.disc.held / DISC.windupSeconds);
      // Dot: the gnome's position round Disco, aim up. Release wedge at 3 o'clock.
      const r = wrap(s.disc.orbit - s.aimYaw); // 0 = perfect release
      dotG.setAttribute('transform', `translate(${(Math.cos(r) * 32).toFixed(1)} ${(-Math.sin(r) * 32).toFixed(1)})`);
      const pw = Math.min(1, power / DISC.maxPower);
      const a0 = -Math.PI / 2;
      const a1 = a0 + pw * Math.PI * 2 * 0.999;
      const large = pw > 0.5 ? 1 : 0;
      powPath.setAttribute('d', `M${(Math.cos(a0) * 52).toFixed(2)} ${(Math.sin(a0) * 52).toFixed(2)} A52 52 0 ${large} 1 ${(Math.cos(a1) * 52).toFixed(2)} ${(Math.sin(a1) * 52).toFixed(2)}`);
      powPath.setAttribute('stroke', power > 1 ? '#ff5a4a' : '#ffd84d');
      setText(dtext, power > DISC.maxPower ? 'TOO DIZZY!' : `${fmtDistance(previewYards, s.lie)}`);
      dtext.style.color = power > DISC.maxPower ? '#ff8a7a' : '#fff';
    }
    flash.classList.toggle('gd-on', flashT > 0);
  }

  return {
    update(dt: number): void {
      const s = state;
      const on = active() && s.phase !== 'title';
      disco.group.visible = on && s.phase !== 'card' && s.phase !== 'final';
      basket.group.visible = active();
      flyer.visible = false;
      preview.visible = false;
      if (flashT > 0) flashT -= dt;

      if (on) {
        // Disco stands where the gnome lies; he keeps his spot until the drive to the next lie.
        if (s.phase === 'intro' || s.phase === 'aim' || s.phase === 'swing') standSpot(discoSpot);
        if (s.phase === 'drive' && prevPhase !== 'drive') driveFrom.copy(discoSpot);
        if (prevPhase === 'drive' && s.phase !== 'drive') standSpot(discoSpot);

        // Whirl: power builds while held; the gnome orbits faster and faster. Too long and Disco gets dizzy.
        if (s.phase === 'swing') {
          const d = s.disc;
          d.held += dt;
          const power = Math.min(DISC.maxPower, d.held / DISC.windupSeconds);
          const w = (DISC.orbitMin + (DISC.orbitMax - DISC.orbitMin) * Math.min(1, power)) * meterSpeedScale(s);
          d.orbit += w * dt;
          if (d.orbit - lastWhoosh > Math.PI * 2) {
            lastWhoosh = d.orbit;
            sfx('whirl', 0.5 + 0.5 * power);
          }
          if (d.held / DISC.windupSeconds >= DISC.dizzyPower && canAct(s)) release(true);
        }

        // Basket at this hole's pin.
        const pin = currentHole(s).pin;
        basket.group.position.set(pin.x, Math.max(0, heightAt(pin.x, pin.z)), pin.z);

        // Chains jiggle on chain events.
        const f = s.flight as DiscFlight | null;
        if (f !== lastFlight) {
          lastFlight = f;
          eventIdx = 0;
        }
        if (f && s.phase === 'flight') {
          while (eventIdx < f.events.length && f.events[eventIdx].t <= s.phaseTime) {
            const ev = f.events[eventIdx];
            if (ev.kind === 'chains') {
              chainJiggle = 1;
              showFlash('CHAIN OUT!', '#ff8a7a');
            } else if (ev.kind === 'cup') {
              chainJiggle = 1.4;
            }
            eventIdx++;
          }
        }
        if (chainJiggle > 0) chainJiggle = Math.max(0, chainJiggle - dt * 0.9);
        basket.chains.rotation.set(Math.sin(s.time * 31) * 0.06 * chainJiggle, Math.sin(s.time * 17) * 0.25 * chainJiggle, Math.cos(s.time * 27) * 0.06 * chainJiggle);

        poseDisco(dt);
        poseGnome(dt);

        if (s.phase === 'aim' || s.phase === 'swing') {
          const power = s.phase === 'swing' ? Math.min(DISC.maxPower, s.disc.held / DISC.windupSeconds) : 1;
          updatePreview(Math.max(0.03, power));
          preview.visible = true;
          ring.scale.setScalar(ringBase * (1 + 0.04 * Math.sin(4 * s.time)));
        }
      } else {
        gnome.object.visible = false;
      }
      renderUi();
      prevPhase = s.phase;
    },
  };
}
