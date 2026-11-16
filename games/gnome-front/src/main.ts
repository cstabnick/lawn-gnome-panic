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
import { getMyGnome, loadMyGnome } from '@lawn/gnome';
import { applyClassNow, createSoldier, respawnSoldier, updateSoldiers } from './soldiers';
import { createHud } from './ui/hud';
import { createTouchControls } from './ui/touch';
import { createVehicles, updateVehicles } from './vehicles';
import { createGuestSync } from './net/guest';
import { createHostSync } from './net/host';
import { createSession } from './net/session';
import { lobby, netHooks, netState } from './net/state';
import { createOnlinePanel } from './ui/online';
import { buildWorld } from './world';

// The saved gnome must be known before the soldiers are built, so wait for it (or the timeout).
await loadMyGnome();

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
    const build = isPlayer ? (getMyGnome()?.look ?? CHARACTERS.gnorman.look) : i % 3 === 2 ? CHARACTERS.gnancy.look : CHARACTERS.gnorman.look;
    const look = { ...build, hat: TEAM_COLORS[team], shirt: isPlayer ? build.shirt : SHIRTS[(i + team * 3) % SHIRTS.length] };
    const botName = BOT_NAMES[(nextId * 7) % BOT_NAMES.length];
    const name = isPlayer ? 'YOU' : botName;
    // The player starts as a Rifleman (changeable in the HUD); bots get a spread of classes.
    const classId = isPlayer ? 'rifleman' : CLASS_ORDER[(i + team) % CLASS_ORDER.length];
    soldiers.push(createSoldier(scene, { id: nextId++, team, name, botName, isPlayer, look, classId }));
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

/** Locks the mouse to the canvas for aiming. Phones and tablets have no pointer lock: the touch controls drive the look. */
function lockPointer(): void {
  if (autoplay || touch.active || document.pointerLockElement === canvas) return;
  try {
    const req = canvas.requestPointerLock() as unknown;
    if (req instanceof Promise) req.catch(() => {});
  } catch {
    /* no pointer lock */
  }
}

function start(): void {
  // Solo PLAY while waiting in the online queue: leave the queue.
  if (netState.role === 'solo' && (lobby.status === 'connecting' || lobby.status === 'queued')) lobby.request = 'leave';
  // Before the match starts, the class picked on the title screen applies straight away (solo PLAY and an online
  // host; a guest's pick is applied in guest.ts when the host places it).
  const p = game.player;
  if (netState.role !== 'guest' && game.time === 0 && p.nextClassId !== p.classId) applyClassNow(p, p.nextClassId);
  running = true;
  onlinePanel.setVisible(false);
  hud.setOverlay('none');
  audio.start();
  touch.setVisible(true);
  // An online match starts from a server message, not a click, so the browser refuses this lock; the HUD then
  // shows CLICK TO AIM and the click on the canvas below takes the lock.
  lockPointer();
}

// Clicking the game while playing without the mouse locked (an online start, or a refused lock) locks it.
canvas.addEventListener('mousedown', () => {
  if (running && !game.over) lockPointer();
});

const hud = createHud(uiRoot, game, start);
hud.setOverlay('title');

// Online play: the session runs the connection; host.ts or guest.ts keeps the world in sync.
const onlinePanel = createOnlinePanel(uiRoot);
onlinePanel.setVisible(true);
const session = createSession(game, createHostSync(game), createGuestSync(game));
netHooks.startMatch = () => {
  if (!running) start();
};

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && running && !game.over && !autoplay) {
    running = false; // online, the match keeps going (see frame); only this player's controls stop
    touch.setVisible(false);
    hud.setOverlay('paused');
  }
});

if (autoplay) start();

// No page zoom on phones: iOS Safari ignores user-scalable=no, so block pinch gestures and
// double-tap zoom on the game itself (buttons and cards on the overlays still get their clicks).
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = performance.now();
  const onControl = (e.target as Element | null)?.closest?.('button, [id^="gf-"] [class*="card"], a') != null;
  if (now - lastTouchEnd < 350 && !onControl && e.cancelable) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

const clock = new THREE.Clock();
function frame(): void {
  const dt = Math.min(clock.getDelta(), 0.05);
  // Online, the match runs on while this player is paused (others are still playing); solo pauses everything.
  const online = netState.role !== 'solo' && lobby.status === 'in';
  if ((running || online) && !game.over) {
    game.time += dt;
    if (running) {
      touch.update();
      player.update(input.state, dt);
    }
    if (netState.role !== 'guest') updateBots(game, dt);
    updateVehicles(game, dt);
    updateSoldiers(game, dt);
    updateCombat(game, dt);
    updateConquest(game, dt);
  }
  session.update(dt);
  onlinePanel.update();
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
