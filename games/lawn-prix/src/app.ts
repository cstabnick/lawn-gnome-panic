// The full game: garage menu -> 3-2-1-GO -> 3-lap race vs 3 CPUs -> results -> again / garage.
import * as THREE from 'three';
import { GNORMAN_LOOK, getMyGnome } from '@lawn/gnome';
import type { GnomeLook } from '@lawn/gnome';
import { createAchievementTracker } from '@lawn/achievements';
import { CAMERA, CHOICE_KEY, DRIFT, MOWER_COLORS, RACE, VEHICLES, VEHICLE_ORDER } from './config';
import type { CourseId, GameMode, KartInput, RacerChoice, RaceState, VehicleId } from './config';
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
import { fmtTime } from './ui/hud';
import type { Hud, ResultRow } from './ui/hud';
import { createRecorder, isBetter, splitTimes } from './ghost';
import type { GhostRecorder, GhostRun } from './ghost';
import { createBrowserGhostStore } from './ghostStore';
import { recordCpuGhost } from './ghostSeed';
import { createGhostView } from './scene/ghostView';
import type { GhostView } from './scene/ghostView';
import { createAudio } from './audio';
import { createControls } from './input';

const STEP = 1 / 60;
const MAX_STEPS_PER_FRAME = 5;
/** Results show this many race seconds after the player finishes (or sooner when the race is over). */
const RESULT_DELAY_S = 4;
const GO_HOLD_S = 0.6;
/** A time trial shows its results this long after the line (nobody else is racing). */
const TRIAL_RESULT_DELAY_S = 1.5;
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
const ghostStore = createBrowserGhostStore();
const achievements = createAchievementTracker({ ui });
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

// Time trial state: the best run being raced (or null), this run's recorder, its lap line crossings, the ghost on screen.
let ghostRun: GhostRun | null = null;
let ghostSplits: number[] = [];
let recorder: GhostRecorder | null = null;
let lapTimes: number[] = [];
let ghostView: GhostView | null = null;
/** Bumped by every start: a slow ghost load for an abandoned start is dropped. */
let startToken = 0;

const isTrial = (): boolean => choice.mode === 'trial';

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
      const mode: GameMode = c.mode === 'trial' ? 'trial' : 'race';
      return { vehicle: c.vehicle as VehicleId, color: c.color as number, course, mode };
    }
  } catch { /* unreadable: use the default */ }
  return fallback;
}

/** The saved choice, with the debug hash '#course=<id>' overriding its course. */
function loadChoice(): RacerChoice {
  const saved = loadSavedChoice();
  const hashCourse = /[#&]course=(\w+)/.exec(location.hash)?.[1];
  const withCourse: RacerChoice = hashCourse && hashCourse in COURSES ? { ...saved, course: hashCourse as CourseId } : saved;
  const hashMode = /[#&]mode=(race|trial)\b/.exec(location.hash)?.[1] as GameMode | undefined;
  return hashMode ? { ...withCourse, mode: hashMode } : withCourse;
}

function saveChoice(c: RacerChoice): void {
  try { localStorage.setItem(CHOICE_KEY, JSON.stringify(c)); } catch { /* private window: not saved */ }
}

/** A fresh HUD. A time trial gets Retry and Garage buttons in it. */
function resetHud(trial = false): void {
  hud.dispose();
  hud = createHud(ui, trial ? { onRetry: again, onGarage: toMenu } : undefined);
}

function disposeRacers(): void {
  for (const r of racers) r.dispose();
  racers = [];
  ghostView?.dispose();
  ghostView = null;
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
  const token = ++startToken;
  if (c.mode === 'trial') {
    // '#seedghost' (demos, smoke tests): a CPU-driven ghost, kept only if faster than the saved one.
    if (/[#&]seedghost\b/.test(location.hash)) {
      const seeded = recordCpuGhost(c.course, c.vehicle, c.color);
      if (seeded) void ghostStore.save(seeded);
    }
    // The ghost to race comes first: the countdown only starts once it is loaded (the store may become a server).
    void ghostStore.load(c.course, c.vehicle).then((run) => {
      if (token === startToken) launch(c, run);
    });
  } else {
    launch(c, null);
  }
}

/** Builds the race (or the time trial against ghost) and starts its countdown. */
function launch(c: RacerChoice, ghost: GhostRun | null): void {
  const trial = c.mode === 'trial';
  resetHud(trial);
  disposeRacers();
  ensureCourse(c.course);

  const me = getMyGnome();
  const playerLook: GnomeLook = me?.look ?? GNORMAN_LOOK;
  const playerName = me?.name ?? 'Gnorman';

  const cpuCount = trial ? 0 : RACE.cpuCount;
  const cpuNames = ['Gnorbert', 'Gnadine', 'Gnigel'];
  const cpuShirts = [0x2f64c9, 0x8a4fd0, 0xd07a2f];
  const otherColors = MOWER_COLORS.map((m) => m.hex).filter((hex) => hex !== c.color);

  const entries: { vehicle: VehicleId; skill: number }[] = [{ vehicle: c.vehicle, skill: 1 }];
  const looks: GnomeLook[] = [playerLook];
  roster = [{ name: playerName, color: c.color }];
  for (let i = 1; i <= cpuCount; i++) {
    const vehicle = VEHICLE_ORDER[i % VEHICLE_ORDER.length];
    const color = otherColors[(i - 1) % otherColors.length];
    entries.push({ vehicle, skill: RACE.cpuSkill[i] });
    looks.push({ ...GNORMAN_LOOK, hat: color, shirt: cpuShirts[(i - 1) % cpuShirts.length] });
    roster.push({ name: cpuNames[(i - 1) % cpuNames.length], color });
  }

  const r = createRace(entries, c.course, RACE.laps);
  if (trial) {
    // Alone on the front of the grid, and no item boxes (they stay "taken"): a fair, repeatable run.
    r.boxes = r.boxes.map(() => Infinity);
  } else {
    // The player starts at the back of the grid: swap kart 0 with the last kart's place.
    const p = r.karts[0];
    const b = r.karts[r.karts.length - 1];
    [p.x, b.x] = [b.x, p.x];
    [p.z, b.z] = [b.z, p.z];
    [p.h, b.h] = [b.h, p.h];
    [p.s, b.s] = [b.s, p.s];
    [p.dist, b.dist] = [b.dist, p.dist];
  }
  race = r;
  ghostRun = trial ? ghost : null;
  ghostSplits = ghost ? splitTimes(ghost) : [];
  lapTimes = [];
  recorder = trial ? createRecorder() : null;
  recorder?.push(r.karts[0], 0);

  racers = r.karts.map((k, i) => createRacer(scene, looks[i], k.vehicle, roster[i].color));
  if (trial && ghost) ghostView = createGhostView(scene, ghost, r.karts[0]);
  updateChaseCamera(camera, r.karts[0], 0, true);

  (window as unknown as Record<string, unknown>).prix = { race, choice, ghost: ghostRun };

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
  startToken++; // a ghost still loading for an abandoned start must not launch
  resetHud();
  ensureCourse(choice.course);
  if (camera.fov !== CAMERA.fov) {
    camera.fov = CAMERA.fov;
    camera.updateProjectionMatrix();
  }
  showMenu(ui, choice, start, ghostStore);
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
  recorder?.push(k0, r.t);

  if (k0.lap > before.lap) {
    lapTimes.push(r.t);
    if (k0.lap < r.laps) {
      let text = k0.lap === r.laps - 1 ? 'FINAL LAP' : `LAP ${k0.lap + 1}`;
      // Against the ghost: the lead (-) or the deficit (+) at this line.
      const split = ghostSplits[k0.lap - 1];
      if (isTrial() && split !== undefined) {
        const d = r.t - split;
        text += ` ${d <= 0 ? '-' : '+'}${Math.abs(d).toFixed(2)}s`;
      }
      hud.flash(text);
      audio.lap();
    }
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
  if (isTrial()) return fin !== null && r.t - fin >= TRIAL_RESULT_DELAY_S;
  return r.over || (fin !== null && r.t - fin >= RESULT_DELAY_S);
}

/** Time trial results: keep the run when it is the new best, then show you against the ghost you raced. */
function finishTrial(r: RaceState): void {
  const k0 = r.karts[0];
  const prev = ghostRun;
  const run = recorder?.finish({
    course: r.course, vehicle: k0.vehicle, laps: r.laps, lapTimes, fin: k0.fin, color: choice.color,
    gnome: getMyGnome()?.code ?? null, name: roster[0].name, at: new Date().toISOString(),
  }) ?? null;
  const newBest = run !== null && isBetter(run, prev);
  const saving = run && newBest ? ghostStore.save(run) : Promise.resolve(false);
  void saving.then((saved) => {
    if (phase !== 'results') return; // left for the garage while saving
    const time = run ? run.totalMs / 1000 : null;
    const rows: ResultRow[] = [{ place: 0, name: roster[0].name, vehicle: k0.vehicle, color: choice.color, time, me: true }];
    if (prev) rows.push({ place: 1, name: `${prev.name} (ghost)`, vehicle: prev.vehicle, color: prev.color, time: prev.totalMs / 1000, me: false });
    if (time !== null && prev && !newBest) { rows[0].place = 1; rows[1].place = 0; }
    let note: string;
    if (time === null) note = 'No time set.';
    else if (!prev) note = saved ? 'Ghost saved. Race it next run!' : 'Nice run! (This browser would not save the ghost.)';
    else if (newBest) note = `${(prev.totalMs / 1000 - time).toFixed(2)}s faster than your ghost.${saved ? ' New ghost saved.' : ''}`;
    else note = `${(time - prev.totalMs / 1000).toFixed(2)}s off your best of ${fmtTime(prev.totalMs / 1000)}.`;
    hud.showResults(rows, again, toMenu, { title: newBest && prev ? 'NEW BEST!' : 'TIME TRIAL', note, againLabel: 'Try again' });
  });
  if (run) void achievements.unlock('prix-trial-first');
  if (run && prev && newBest) void achievements.unlock('prix-ghost-buster');
}

function finishRace(r: RaceState): void {
  phase = 'results';
  audio.stopEngine();
  if (isTrial()) {
    finishTrial(r);
    return;
  }
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
  ghostView?.update(race.t, dt);
  updateChaseCamera(camera, k0, dt);
  if (phase === 'results') return;
  const speed = Math.hypot(k0.vx, k0.vz);
  hud.update({
    lap: Math.min(race.laps, k0.lap + 1),
    laps: race.laps,
    place: racePlaces(race)[0],
    count: race.karts.length,
    best: isTrial() ? (ghostRun ? ghostRun.totalMs / 1000 : null) : undefined,
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
  controls.setVisible(phase === 'countdown' || phase === 'race');
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

// Escape leaves a time trial for the garage (the HUD has a Garage button for touch).
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isTrial() && (phase === 'countdown' || phase === 'race')) toMenu();
});

ensureCourse(choice.course);
if (/[#&]go\b/.test(location.hash)) {
  start(choice);
} else {
  showMenu(ui, choice, start, ghostStore);
}
