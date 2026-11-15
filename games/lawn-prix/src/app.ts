// The full game: garage menu -> 3-2-1-GO -> 3-lap race vs 3 CPUs -> results -> again / garage.
import * as THREE from 'three';
import { GNORMAN_LOOK, getMyGnome } from '@lawn/gnome';
import type { GnomeLook } from '@lawn/gnome';
import { CAMERA, CHOICE_KEY, DRIFT, MOWER_COLORS, RACE, VEHICLES, VEHICLE_ORDER } from './config';
import type { CourseId, KartInput, RacerChoice, RaceState, VehicleId } from './config';
import { COURSES } from './courses';
import { cpuInput, createRace, racePlaces, stepRace } from './sim';
import type { RaceEvents } from './sim';
import { getTrack, pointAt } from './track';
import { buildTrack } from './scene/trackView';
import type { CourseView } from './scene/trackView';
import { createItemView } from './scene/itemView';
import type { ItemView } from './scene/itemView';
import { createRacer } from './scene/racer';
import type { Racer } from './scene/racer';
import { updateChaseCamera } from './scene/camera';
import { showMenu } from './ui/menu';
import { createHud } from './ui/hud';
import type { Hud, ResultRow } from './ui/hud';
import { createAudio } from './audio';
import { createControls } from './input';

const STEP = 1 / 60;
const MAX_STEPS_PER_FRAME = 5;
/** Results show this many race seconds after the player finishes (or sooner when the race is over). */
const RESULT_DELAY_S = 4;
const GO_HOLD_S = 0.6;
const BUMP_MIN_GAP_S = 0.3;

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CAMERA.fov, innerWidth / innerHeight, 0.1, 400);

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

const controls = createControls(canvas, ui);
const audio = createAudio();
let hud: Hud = createHud(ui);

type Phase = 'menu' | 'countdown' | 'race' | 'results';
let phase: Phase = 'menu';
let choice: RacerChoice = loadChoice();
let race: RaceState | null = null;
let racers: Racer[] = [];
/** Display name and paint per kart index (0 = player). */
let roster: { name: string; color: number }[] = [];
let menuT = 0;
let countdownT = 0;
let countdownShown = -1;
let acc = 0;
let lastBumpT = -Infinity;
let last = performance.now();

// The course in the scene: rebuilt only when the chosen course changes.
let builtCourse: CourseId | null = null;
let courseView: CourseView | null = null;
let itemView: ItemView | null = null;

function loadSavedChoice(): RacerChoice {
  const fallback: RacerChoice = { vehicle: 'cart', color: MOWER_COLORS[0].hex, course: 'garden' };
  try {
    const c = JSON.parse(localStorage.getItem(CHOICE_KEY) ?? 'null') as Partial<RacerChoice> | null;
    if (c && typeof c.vehicle === 'string' && c.vehicle in VEHICLES && MOWER_COLORS.some((m) => m.hex === c.color)) {
      const course: CourseId = typeof c.course === 'string' && c.course in COURSES ? c.course : 'garden';
      return { vehicle: c.vehicle as VehicleId, color: c.color as number, course };
    }
  } catch { /* unreadable: use the default */ }
  return fallback;
}

/** The saved choice, with the debug hash '#course=<id>' overriding its course. */
function loadChoice(): RacerChoice {
  const saved = loadSavedChoice();
  const hashCourse = /[#&]course=(\w+)/.exec(location.hash)?.[1];
  return hashCourse && hashCourse in COURSES ? { ...saved, course: hashCourse as CourseId } : saved;
}

function saveChoice(c: RacerChoice): void {
  try { localStorage.setItem(CHOICE_KEY, JSON.stringify(c)); } catch { /* private window: not saved */ }
}

function resetHud(): void {
  hud.dispose();
  hud = createHud(ui);
}

function disposeRacers(): void {
  for (const r of racers) r.dispose();
  racers = [];
}

function disposeMaterial(mat: THREE.Material): void {
  for (const v of Object.values(mat)) {
    if (v instanceof THREE.Texture) v.dispose();
  }
  mat.dispose();
}

/** Frees the GPU resources of every object under obj (geometry, materials, their textures). */
function disposeObject(obj: THREE.Object3D): void {
  const drawable = obj as THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
  drawable.geometry?.dispose();
  const mats = drawable.material === undefined ? [] : Array.isArray(drawable.material) ? drawable.material : [drawable.material];
  for (const mat of mats) disposeMaterial(mat);
}

/** Makes the scene show course id (rebuilds it only when the course differs from the built one). */
function ensureCourse(id: CourseId): void {
  if (id === builtCourse) return;
  itemView?.dispose();
  itemView = null;
  scene.traverse(disposeObject);
  scene.clear();
  courseView = buildTrack(scene, id);
  itemView = createItemView(scene, getTrack(id));
  builtCourse = id;
}

function start(c: RacerChoice): void {
  choice = c;
  saveChoice(c);
  audio.start();
  resetHud();
  disposeRacers();
  ensureCourse(c.course);

  const me = getMyGnome();
  const playerLook: GnomeLook = me?.look ?? GNORMAN_LOOK;
  const playerName = me?.name ?? 'Gnorman';

  const cpuNames = ['Gnorbert', 'Gnadine', 'Gnigel'];
  const cpuShirts = [0x2f64c9, 0x8a4fd0, 0xd07a2f];
  const otherColors = MOWER_COLORS.map((m) => m.hex).filter((hex) => hex !== c.color);

  const entries: { vehicle: VehicleId; skill: number }[] = [{ vehicle: c.vehicle, skill: 1 }];
  const looks: GnomeLook[] = [playerLook];
  roster = [{ name: playerName, color: c.color }];
  for (let i = 1; i <= RACE.cpuCount; i++) {
    const vehicle = VEHICLE_ORDER[i % VEHICLE_ORDER.length];
    const color = otherColors[(i - 1) % otherColors.length];
    entries.push({ vehicle, skill: RACE.cpuSkill[i] });
    looks.push({ ...GNORMAN_LOOK, hat: color, shirt: cpuShirts[(i - 1) % cpuShirts.length] });
    roster.push({ name: cpuNames[(i - 1) % cpuNames.length], color });
  }

  const r = createRace(entries, c.course, RACE.laps);
  // The player starts at the back of the grid: swap kart 0 with the last kart's place.
  const p = r.karts[0];
  const b = r.karts[r.karts.length - 1];
  [p.x, b.x] = [b.x, p.x];
  [p.z, b.z] = [b.z, p.z];
  [p.h, b.h] = [b.h, p.h];
  [p.s, b.s] = [b.s, p.s];
  [p.dist, b.dist] = [b.dist, p.dist];
  race = r;

  racers = r.karts.map((k, i) => createRacer(scene, looks[i], k.vehicle, roster[i].color));
  updateChaseCamera(camera, r.karts[0], 0, true);

  (window as unknown as Record<string, unknown>).prix = { race, choice };

  phase = 'countdown';
  countdownT = 0;
  countdownShown = -1;
  acc = 0;
  lastBumpT = -Infinity;
}

function toMenu(): void {
  phase = 'menu';
  race = null;
  menuT = 0;
  disposeRacers();
  audio.stopEngine();
  resetHud();
  ensureCourse(choice.course);
  if (camera.fov !== CAMERA.fov) {
    camera.fov = CAMERA.fov;
    camera.updateProjectionMatrix();
  }
  showMenu(ui, choice, start);
}

function again(): void {
  start(choice);
}

function tickCountdown(dt: number): void {
  countdownT += dt;
  if (countdownT < RACE.countdownS) {
    const n = RACE.countdownS - Math.floor(countdownT);
    if (n !== countdownShown) {
      countdownShown = n;
      hud.countdown(n);
      audio.beep(false);
    }
  } else if (countdownT < RACE.countdownS + GO_HOLD_S) {
    if (countdownShown !== 0) {
      countdownShown = 0;
      hud.countdown('GO');
      audio.beep(true);
    }
  } else {
    hud.countdown(null);
    phase = 'race';
  }
}

function stepOnce(r: RaceState): void {
  const k0 = r.karts[0];
  const before = { lap: k0.lap, boost: k0.boost, fin: k0.fin, hop: k0.hop, item: k0.item };
  const inputs: (KartInput | null)[] = r.karts.map((_, i) => {
    if (i === 0) return k0.fin === null ? controls.read() : null;
    return cpuInput(r, i);
  });
  const ev: RaceEvents = stepRace(r, inputs, STEP);

  if (k0.lap > before.lap && k0.lap < r.laps) {
    hud.flash(k0.lap === r.laps - 1 ? 'FINAL LAP' : `LAP ${k0.lap + 1}`);
    audio.lap();
  }
  if (ev.picked.includes(0)) audio.pickup();
  if (ev.used.includes(0)) {
    if (before.item === 'acorn') audio.throwAcorn();
    else audio.boost();
  } else if (before.boost <= 0 && k0.boost > 0) {
    audio.boost(); // a drift release
  }
  if (before.hop <= 0 && k0.hop > 0) audio.hop();
  if (ev.hits.includes(0)) {
    audio.hit(false);
    hud.flash('BONK!');
  }
  if (ev.hazard.includes(0)) {
    audio.hit(true);
    hud.flash('WATCH THE ROAD!');
  }
  if (ev.bumped.includes(0) && r.t - lastBumpT >= BUMP_MIN_GAP_S) {
    lastBumpT = r.t;
    audio.bump();
  }
  if (before.fin === null && k0.fin !== null) {
    hud.flash('FINISH!');
    audio.finish();
  }
}

function raceEnded(r: RaceState): boolean {
  const fin = r.karts[0].fin;
  return r.over || (fin !== null && r.t - fin >= RESULT_DELAY_S);
}

function finishRace(r: RaceState): void {
  phase = 'results';
  audio.stopEngine();
  const places = racePlaces(r);
  const rows: ResultRow[] = r.karts.map((k, i) => ({
    place: places[i],
    name: roster[i].name,
    vehicle: k.vehicle,
    color: roster[i].color,
    time: k.fin,
    me: i === 0,
  }));
  rows.sort((a, b) => a.place - b.place);
  hud.showResults(rows, again, toMenu);
}

function tickRace(dt: number): void {
  if (!race) return;
  acc = Math.min(acc + dt, STEP * MAX_STEPS_PER_FRAME);
  while (acc >= STEP) {
    acc -= STEP;
    stepOnce(race);
    if (raceEnded(race)) {
      finishRace(race);
      return;
    }
  }
}

/** Racers, camera and HUD follow the karts every frame (also during the countdown). */
function updateView(dt: number): void {
  if (!race) return;
  const k0 = race.karts[0];
  race.karts.forEach((k, i) => racers[i]?.update(k, dt));
  updateChaseCamera(camera, k0, dt);
  if (phase === 'results') return;
  const speed = Math.hypot(k0.vx, k0.vz);
  hud.update({
    lap: Math.min(race.laps, k0.lap + 1),
    laps: race.laps,
    place: racePlaces(race)[0],
    count: race.karts.length,
    time: race.t,
    speed,
    charge01: Math.min(1, k0.charge / DRIFT.chargeForBoost),
    boosting: k0.boost > 0,
    item: k0.item,
    spinning: k0.spin > 0,
  });
  audio.engine(Math.min(1, speed / VEHICLES[k0.vehicle].maxSpeed), k0.off);
}

function orbitMenu(dt: number): void {
  menuT += dt;
  const track = getTrack(choice.course);
  const c = pointAt(track, track.course.startS);
  const a = menuT * 0.15;
  camera.position.set(c.x + Math.sin(a) * 14, 6, c.z + Math.cos(a) * 14);
  camera.lookAt(c.x, 1, c.z);
}

renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (phase === 'menu') {
    orbitMenu(dt);
  } else {
    if (phase === 'countdown') tickCountdown(dt);
    else if (phase === 'race') tickRace(dt);
    updateView(dt);
  }
  courseView?.update(race ? race.t : menuT, dt);
  if (race) itemView?.update(race, dt);
  renderer.render(scene, camera);
});

ensureCourse(choice.course);
if (/[#&]go\b/.test(location.hash)) {
  start(choice);
} else {
  showMenu(ui, choice, start);
}
