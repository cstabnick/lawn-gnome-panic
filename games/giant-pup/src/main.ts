// Giant Pup: care for Gnome Company's Giant Goofy Fetch Dog.
// Wiring only: renderer, camera, pointer input, and the glue between brain (behaviour), sim (needs), dog (rig), yard, fx, ui, audio.
import * as THREE from 'three';
import { loadMyGnome } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import { play, setMuted, unlockAudio } from './audio';
import { BATH_SPOT, Dog } from './brain';
import { BALL_MAX_SPEED, BALL_RADIUS, DOG_SCALE, GNOME_POS, TRICK_LABEL } from './config';
import { animateDog, createDogRig } from './dog';
import { createFx } from './fx';
import { loadPet, savePet } from './save';
import { createYard } from './scene';
import * as sim from './sim';
import { createUi, type Mode } from './ui';

await loadMyGnome();

const canvas = document.getElementById('game') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const yard = createYard();
const scene = yard.scene;
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
const fx = createFx(scene);

const [pet, isNew] = loadPet();
const dog = new Dog(pet);

const rig = createDogRig();
rig.root.scale.setScalar(DOG_SCALE);
rig.root.traverse((o) => {
  if ((o as THREE.Mesh).isMesh) o.castShadow = true;
});
scene.add(rig.root);

// The toy ball is the tennis-ball prefab (radius 0.07) scaled to BALL_RADIUS. The prefab stands on the ground,
// so its centre is lifted by BALL_RADIUS to put the game's ball origin at its middle.
const ball = new THREE.Group();
const ballModel = buildPrefab('tennis-ball', { scale: BALL_RADIUS / 0.07 });
ballModel.position.y = -BALL_RADIUS;
ball.add(ballModel);
ball.traverse((o) => {
  if ((o as THREE.Mesh).isMesh) o.castShadow = true;
});
scene.add(ball);

let mode: Mode = 'pet';

const ui = createUi(uiRoot, {
  onFeed() {
    if (dog.fillFood()) play('crunch');
    else ui.toast('The bowl is already full.');
  },
  onWater() {
    if (dog.fillWater()) play('splash');
    else ui.toast('The bowl is already full.');
  },
  onMode(m) {
    setMode(m);
  },
  onTrick(t) {
    if (dog.bathing) return ui.toast('Not in the bath!');
    if (dog.busy) return ui.toast(`${pet.name} is busy.`);
    const far = Math.hypot(dog.x - GNOME_POS.x, dog.z - GNOME_POS.z) > 9;
    if (far || dog.asleep) {
      dog.comeHere();
      return ui.toast(`Here, ${pet.name}!`);
    }
    play('click');
    ui.toast(`${TRICK_LABEL[t]}!`);
    dog.trick(t);
  },
  onRename(name) {
    pet.name = name;
    savePet(pet);
    ui.toast(`Hello, ${name}!`);
  },
  onMute(m) {
    setMuted(m);
  },
});

function setMode(m: Mode): void {
  if (m === mode) return;
  if (mode === 'bath') dog.endBath();
  if (mode === 'ball') dog.hideBall();
  mode = m;
  if (m === 'bath') dog.startBath();
  if (m === 'ball') {
    dog.readyBall();
    dog.comeHere();
  }
}

if (isNew) ui.askName(pet.name);

// ---- input ----

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
interface Stroke { id: number; x0: number; y0: number; t0: number; x: number; y: number; onDog: boolean; samples: { x: number; y: number; t: number }[] }
let stroke: Stroke | null = null;
let fxCooldown = 0;

function pick(clientX: number, clientY: number, targets: THREE.Object3D[]): THREE.Intersection | null {
  const r = canvas.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObjects(targets, true)[0] ?? null;
}

canvas.addEventListener('pointerdown', (e) => {
  unlockAudio();
  if (stroke) return;
  canvas.setPointerCapture(e.pointerId);
  const onDog = mode !== 'ball' && pick(e.clientX, e.clientY, rig.hit) !== null;
  stroke = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), x: e.clientX, y: e.clientY, onDog, samples: [] };
});

canvas.addEventListener('pointermove', (e) => {
  if (!stroke || e.pointerId !== stroke.id) return;
  const px = Math.hypot(e.clientX - stroke.x, e.clientY - stroke.y);
  stroke.x = e.clientX;
  stroke.y = e.clientY;
  const now = performance.now();
  stroke.samples.push({ x: e.clientX, y: e.clientY, t: now });
  while (stroke.samples.length > 2 && now - stroke.samples[0].t > 120) stroke.samples.shift();
  if (mode === 'ball' || px <= 0) return;
  const hit = pick(e.clientX, e.clientY, rig.hit);
  if (!hit) return;
  stroke.onDog = true;
  // Scale by screen size so a stroke across the dog counts the same on a phone and a monitor.
  const norm = (px * 800) / Math.max(400, Math.min(window.innerWidth, window.innerHeight));
  if (mode === 'bath') {
    dog.scrubbing(norm);
    if (fxCooldown <= 0) {
      fx.spawn('bubble', hit.point, 3);
      play('scrub');
      fxCooldown = 0.12;
    }
  } else {
    dog.petting(norm);
    if (fxCooldown <= 0) {
      fx.spawn('heart', hit.point.clone().add(new THREE.Vector3(0, 0.6, 0)), 1);
      fxCooldown = 0.25;
    }
  }
});

function endStroke(e: PointerEvent): void {
  if (!stroke || e.pointerId !== stroke.id) return;
  const st = stroke;
  stroke = null;
  const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
  const dist = Math.hypot(dx, dy);
  const dur = performance.now() - st.t0;
  if (mode === 'ball') {
    // Swipe up to throw: speed from the last ~120 ms of the swipe, direction from the whole swipe.
    if (dy < -30 && dist > 40) {
      const first = st.samples[0] ?? { x: st.x0, y: st.y0, t: st.t0 };
      const dtS = Math.max(0.03, (performance.now() - first.t) / 1000);
      const h = Math.max(300, window.innerHeight);
      const flick = Math.hypot(e.clientX - first.x, e.clientY - first.y) / dtS / h; // screen heights per second
      const power = THREE.MathUtils.clamp(0.35 + flick * 0.22, 0.35, 1);
      const side = THREE.MathUtils.clamp(dx / dist, -0.8, 0.8);
      const fwd = BALL_MAX_SPEED * power;
      const vel = new THREE.Vector3(side * fwd * 0.6, 6 + power * 8, -fwd * Math.sqrt(1 - side * side * 0.36));
      if (dog.throwBall(vel)) {
        play('throw');
        throwAnim = 0.35;
      }
    }
    return;
  }
  if (!st.onDog && dist < 12 && dur < 400 && mode === 'pet') {
    const hit = pick(e.clientX, e.clientY, [yard.ground]);
    if (hit) {
      dog.call(hit.point.x, hit.point.z);
      fx.spawn('dust', hit.point, 4);
      play('click');
    }
  }
}
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);

// ---- events from the dog ----

function handle(ev: ReturnType<Dog['update']>[number]): void {
  const head = new THREE.Vector3(dog.x + Math.sin(dog.yaw) * 2.2, 3.4, dog.z + Math.cos(dog.yaw) * 2.2);
  switch (ev.kind) {
    case 'ate':
      play('happy');
      fx.spawn('crumb', head.clone().setY(0.6), 6);
      ui.toast('Yum!');
      break;
    case 'drank':
      play('slurp');
      fx.spawn('splash', head.clone().setY(0.6), 6);
      break;
    case 'pickedUp':
      play('squeak');
      break;
    case 'fetched':
      play('bark');
      fx.spawn('sparkle', head, 6);
      if (pet.fetches % 5 === 0) ui.toast(`${pet.fetches} fetches!`);
      break;
    case 'trick':
      if (ev.ok) {
        play('woof');
        fx.spawn('sparkle', head, 8);
        ui.toast(pet.tricks[ev.trick] >= 1 ? `${pet.name} knows ${TRICK_LABEL[ev.trick]}! Pet to praise.` : 'Pet to praise!');
      } else {
        play('fail');
        ui.toast(`${pet.name} tilts their head...`);
      }
      break;
    case 'praised':
      play('happy');
      fx.spawn('heart', head, 6);
      ui.toast('Good dog!');
      break;
    case 'fellAsleep':
      ui.toast(`${pet.name} is napping.`);
      break;
    case 'wokeUp':
      play('woof');
      break;
    case 'bark':
      play('bark');
      fx.spawn('note', head, 1);
      break;
    case 'shookOff':
      play('splash');
      fx.spawn('splash', new THREE.Vector3(dog.x, 2.2, dog.z), 18);
      break;
    case 'ballLanded':
      if (ev.speed > 6) play('pop');
      break;
  }
}

// ---- camera ----

const camPos = new THREE.Vector3(0, 6, GNOME_POS.z + 7);
const camLook = new THREE.Vector3(0, 2, 0);
function resize(): void {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Portrait phones need a wider vertical view so the dog fits across.
  camera.fov = camera.aspect < 0.8 ? 72 : camera.aspect < 1.2 ? 60 : 50;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function updateCamera(dt: number): void {
  const k = Math.min(1, dt * 2.5);
  let fx_ = dog.x, fz = dog.z;
  if (mode === 'ball' && (dog.ballState === 'flying' || dog.ballState === 'ground')) {
    fx_ = (dog.x + dog.ball.x) / 2;
    fz = (dog.z + dog.ball.z) / 2;
  }
  // Stay behind the gnome; pull back when the dog wanders far.
  const far = Math.max(0, GNOME_POS.z - fz - 4);
  const wantPos = new THREE.Vector3(fx_ * 0.45 + 2.5, 6.2 + far * 0.25, GNOME_POS.z + 6.5 + far * 0.15);
  const wantLook = new THREE.Vector3(fx_ * 0.9, 2.2, Math.min(fz, GNOME_POS.z - 3));
  camPos.lerp(wantPos, k);
  camLook.lerp(wantLook, k);
  camera.position.copy(camPos);
  camera.lookAt(camLook);
}

// ---- main loop ----

let throwAnim = 0;
let saveTimer = 0;
const clock = new THREE.Clock();
let t = 0;

function hintFor(): string {
  if (mode === 'ball') return dog.ballState === 'hand' ? 'Swipe up to throw!' : dog.ballState === 'carried' ? 'Here it comes!' : 'Fetch!';
  if (mode === 'bath') return dog.act.kind === 'bath' ? 'Rub the dog to scrub!' : 'Bath time...';
  if (dog.asleep) return 'Shh... pet to wake.';
  return 'Stroke the dog to pet. Tap the grass to call.';
}

function frame(): void {
  const dt = Math.min(0.05, clock.getDelta());
  t += dt;
  fxCooldown -= dt;

  if (!dog.asleep) sim.decay(pet, dt);
  for (const ev of dog.update(dt)) handle(ev);

  // Dog rig
  rig.root.position.set(dog.x, 0, dog.z);
  rig.root.rotation.y = dog.yaw;
  animateDog(rig, dog.pose, t, dt, dog.speed, sim.happiness(pet));
  rig.setDirt(1 - pet.clean / 100);
  if (dog.asleep && Math.floor(t * 0.8) !== Math.floor((t - dt) * 0.8)) {
    fx.spawn('zzz', new THREE.Vector3(dog.x, 2.8, dog.z + 1.5), 1);
    play('snore');
  }

  // Ball
  ball.visible = dog.ballState !== 'away';
  if (dog.ballState === 'carried') {
    rig.root.updateMatrixWorld(true);
    rig.mouth.getWorldPosition(ball.position);
  } else if (dog.ballState === 'hand') {
    yard.gnome.arms.right.getWorldPosition(ball.position);
    ball.position.y -= 0.35;
    ball.position.z -= 0.15;
  } else {
    ball.position.copy(dog.ball);
  }
  if (dog.ballState === 'flying') ball.rotation.x -= dt * 12;

  // Gnome faces the dog (or the ball in flight) and swings its arm when throwing.
  const lookX = dog.ballState === 'flying' ? dog.ball.x : dog.x;
  const lookZ = dog.ballState === 'flying' ? dog.ball.z : dog.z;
  yard.gnomeState.facing = Math.atan2(lookX - GNOME_POS.x, lookZ - GNOME_POS.z);
  yard.update(t, dt);
  throwAnim = Math.max(0, throwAnim - dt);
  yard.gnome.arms.right.rotation.x = throwAnim > 0 ? -Math.PI * (0.6 + throwAnim * 2) : mode === 'ball' && dog.ballState === 'hand' ? -0.6 : yard.gnome.arms.right.rotation.x;

  yard.setBowls(dog.foodInBowl, dog.waterInBowl);
  if (mode === 'bath' && dog.act.kind === 'bath' && Math.random() < dt * 2) {
    fx.spawn('bubble', new THREE.Vector3(BATH_SPOT.x + (Math.random() - 0.5) * 2, 1, BATH_SPOT.z), 1);
  }
  fx.update(dt);

  ui.update(pet, { mode, mood: sim.mood(pet), busy: dog.busy || dog.bathing, hint: hintFor() });

  saveTimer += dt;
  if (saveTimer > 5) {
    saveTimer = 0;
    savePet(pet);
  }

  updateCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) savePet(pet);
  else {
    // Coming back: apply the time away, then keep going.
    sim.catchUp(pet, Date.now());
    clock.getDelta();
  }
});
window.addEventListener('pagehide', () => savePet(pet));

requestAnimationFrame(frame);
