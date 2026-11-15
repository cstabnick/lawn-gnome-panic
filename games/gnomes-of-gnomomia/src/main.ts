// Gnomes of Gnomomia: renderer and the main loop. Systems live one per file; this file only wires them.
import * as THREE from 'three';
import { loadMyGnome } from '@lawn/gnome';
import { SPAWN, TUNING, UI } from './config';
import { say } from './events';
import { buildWorld, heightAt } from './world';
import { createPlayer, player, teleportPlayer, updatePlayer } from './player';
import { spawnWorldEntities, updateEntities } from './entities';
import { initCombat, updateCombat } from './combat';
import { initCamera, updateCamera } from './camera';
import { initInput, updateInput } from './input';
import { createHud, updateHud } from './ui/hud';
import { createPanels } from './ui/panels';
import { createDialogue } from './ui/dialogue';
import { createShop } from './ui/shop';
import { initQuests } from './quests';
import { initAudio } from './audio';
import { deleteSave, loadGame, saveGame } from './save';
import { showTitle } from './ui/title';
import { newGameState, state } from './state';

// The custom gnome (Gnome Creator) must be loaded before the player model is built.
await loadMyGnome();

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

buildWorld(scene);
spawnWorldEntities(scene);
createPlayer(scene);
initCombat(scene);
initCamera(camera, canvas);
initInput(canvas, camera, scene);

createHud(ui);
createPanels(ui);
// Dialogue subscribes to 'talk' before quests do, so it picks its greeting from the state before a turn-in.
createDialogue(ui);
createShop(ui);
initQuests();
initAudio();

let running = false;
let saveTimer = 0;
let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (running) {
    updatePlayer(dt);
    updateEntities(dt);
    updateCombat(dt);
    updateInput(dt);
    saveTimer += dt;
    if (saveTimer >= TUNING.autosaveSeconds) {
      saveTimer = 0;
      saveGame();
    }
  } else {
    // Behind the title: a slow turn round the village.
    player.facing += dt * 0.15;
  }
  updateCamera(dt, player.position);
  updateHud(dt, camera);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

const hasSave = loadGame();
const choice = await showTitle(ui, hasSave);
if (choice === 'new') {
  deleteSave();
  Object.assign(state, newGameState());
  teleportPlayer(SPAWN.x, SPAWN.z);
  say('Welcome to Gnomomia. Talk to Elder Fernwick, by the well.', UI.quest);
} else {
  say('Welcome back to Gnomomia.', UI.quest);
}
player.position.y = heightAt(player.position.x, player.position.z);
running = true;
window.addEventListener('beforeunload', () => saveGame());
