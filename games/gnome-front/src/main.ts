// src/main.ts: builds the match and runs the frame loop.
// ?autoplay=1 starts the match without the Play click (for headless checks).
import * as THREE from 'three';
import { initAudio } from './audio';
import { updateBots } from './bots';
import { updateCombat } from './combat';
import { CLASS_ORDER, PLAYER_TEAM, SKY_COLOR, TEAM_COLORS, TUNING, type Game, type GameEvent, type Soldier, type Team } from './config';
import { createFlags, updateConquest } from './conquest';
import { createInput } from './input';
import { CHARACTERS } from './models/config';
import { createPlayerController } from './player';
import { createSoldier, respawnSoldier, updateSoldiers } from './soldiers';
import { createHud } from './ui/hud';
import { createTouchControls } from './ui/touch';
import { createVehicles, updateVehicles } from './vehicles';
import { buildWorld } from './world';

const BOT_NAMES = [
  'Gnorbert', 'Gnadine', 'Gnigel', 'Gnelly', 'Gnathan', 'Gnora', 'Gnoel', 'Gnaomi', 'Gnick', 'Gnina',
  'Gnapoleon', 'Gnicole', 'Gnewton', 'Gnoreen', 'Gnorris', 'Gnancy Jr', 'Gnevil', 'Gnatalie', 'Gnils', 'Gnell',
  'Gnolan', 'Gnyla', 'Gnoble', 'Gnixie',
];
const SHIRTS = [0x2f64c9, 0x2e8b57, 0x8d6e63, 0xf2c230, 0x6d4c41, 0x00897b];

const canvas = document.getElementById('game') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY_COLOR);
scene.fog = new THREE.Fog(SKY_COLOR, 90, 260);

const camera = new THREE.PerspectiveCamera(TUNING.hipFov, window.innerWidth / window.innerHeight, 0.05, 600);
camera.rotation.order = 'YXZ';
scene.add(camera);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const obstacles = buildWorld(scene);
const flags = createFlags(scene);
const vehicles = createVehicles(scene);

const soldiers: Soldier[] = [];
let nextId = 0;
for (const team of [0, 1] as Team[]) {
  for (let i = 0; i < TUNING.botsPerTeam; i++) {
    const isPlayer = team === PLAYER_TEAM && i === 0;
    const build = isPlayer ? CHARACTERS.gnorman.look : i % 3 === 2 ? CHARACTERS.gnancy.look : CHARACTERS.gnorman.look;
    const look = { ...build, hat: TEAM_COLORS[team], shirt: isPlayer ? build.shirt : SHIRTS[(i + team * 3) % SHIRTS.length] };
    const name = isPlayer ? 'YOU' : BOT_NAMES[(nextId * 7) % BOT_NAMES.length];
    // The player starts as a Rifleman (changeable in the HUD); bots get a spread of classes.
    const classId = isPlayer ? 'rifleman' : CLASS_ORDER[(i + team) % CLASS_ORDER.length];
    soldiers.push(createSoldier(scene, { id: nextId++, team, name, isPlayer, look, classId }));
  }
}

const listeners: ((e: GameEvent) => void)[] = [];
const game: Game = {
  scene,
  camera,
  soldiers,
  vehicles,
  flags,
  obstacles,
  player: soldiers.find((s) => s.isPlayer)!,
  tickets: [TUNING.tickets, TUNING.tickets],
  time: 0,
  over: false,
  winner: null,
  emit(e) {
    for (const fn of listeners) fn(e);
  },
  on(fn) {
    listeners.push(fn);
  },
};

for (const s of soldiers) respawnSoldier(game, s);

const input = createInput(canvas);
const touch = createTouchControls(uiRoot, input);
const player = createPlayerController(game);
const audio = initAudio(game);

let running = false;
const autoplay = new URLSearchParams(location.search).get('autoplay') === '1';

function start(): void {
  running = true;
  hud.setOverlay('none');
  audio.start();
  touch.setVisible(true);
  // Phones and tablets have no pointer lock: the touch controls drive the look instead.
  if (!autoplay && !touch.active) {
    try {
      const req = canvas.requestPointerLock() as unknown;
      if (req instanceof Promise) req.catch(() => {});
    } catch {
      /* no pointer lock */
    }
  }
}

const hud = createHud(uiRoot, game, start);
hud.setOverlay('title');

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && running && !game.over && !autoplay) {
    running = false;
    touch.setVisible(false);
    hud.setOverlay('paused');
  }
});

if (autoplay) start();

const clock = new THREE.Clock();
function frame(): void {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (running && !game.over) {
    game.time += dt;
    touch.update();
    player.update(input.state, dt);
    updateBots(game, dt);
    updateVehicles(game, dt);
    updateSoldiers(game, dt);
    updateCombat(game, dt);
    updateConquest(game, dt);
  }
  if (game.over) touch.setVisible(false); // uncovers the PLAY AGAIN button
  hud.update(dt, input.state);
  audio.update(dt);
  renderer.render(scene, camera);
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Exposed for headless playtests.
(window as unknown as { game: Game }).game = game;
