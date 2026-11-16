/// <reference types="vite/client" />
// Gnomes of Gnomomia: renderer and the main loop. Systems live one per file; this file only wires them.
import * as THREE from 'three';
import { loadMyGnome } from '@lawn/gnome';
import { SPAWN, TUNING, UI, WORLD, type ZoneId } from './config';
import { ZONES } from './content';
import { say } from './events';
import { heightAt } from './terrain';
import { createPlayer, player, teleportPlayer, updatePlayer } from './player';
import { initCompanions, updateCompanions } from './companions';
import { updateEntities } from './entities';
import { initCombat, updateCombat } from './combat';
import { initCamera, updateCamera } from './camera';
import { initInput, updateInput } from './input';
import { createHud, updateHud } from './ui/hud';
import { createHotbar } from './ui/hotbar';
import { createPanels } from './ui/panels';
import { createDialogue } from './ui/dialogue';
import { createShop } from './ui/shop';
import { createBookReader } from './ui/book';
import { initInteriors, updateInteriorCutaway } from './interiors';
import { initQuests, updateQuests } from './quests';
import { initZones, loadZone, updateZones } from './zones';
import { initWorld, updateWorld } from './world';
import { initProgression } from './progression';
import { initBossMoves, updateBossMoves } from './bossmoves';
import { initMower, updateMower } from './mower';
import { updateAbilities } from './abilities';
import { initAudio } from './audio';
import { initMusic, startTitleMusic, startZoneMusic } from './music';
import { deleteSave, loadGame, saveGame } from './save';
import { showTitle } from './ui/title';
import { newGameState, state } from './state';
import { goOnline, initMmo, updateMmo } from './net/mmo';
import { createOnlineUi, updateOnlineUi } from './ui/online';
import { createMinimap, updateMinimap } from './ui/minimap';
import { createSettings } from './ui/settings';
import { onSettingsChange, settings } from './settings';

// The custom gnome (Gnome Creator) must be loaded before the player model is built.
await loadMyGnome();

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
function applyRendererSettings(): void {
  renderer.setPixelRatio(settings.highDpi ? Math.min(window.devicePixelRatio, 2) : 1);
  renderer.shadowMap.enabled = settings.shadows;
}
applyRendererSettings();
onSettingsChange(applyRendererSettings);
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, WORLD.cameraFar);

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

initWorld(scene);
initZones(scene);
initInteriors(scene);
initProgression();
initBossMoves(scene);
initMower(scene);
createPlayer(scene);
initCompanions(scene);
initCombat(scene);
initCamera(camera, canvas);
initInput(canvas, camera, scene);

createHud(ui);
createMinimap(ui);
createHotbar(ui);
createPanels(ui);
createSettings(ui);
// Dialogue subscribes to 'talk' before quests do, so it picks its greeting from the state before a turn-in.
createDialogue(ui);
createShop(ui);
createBookReader(ui);
initQuests();
initAudio();
initMusic();
initMmo(scene);

let running = false;
let saveTimer = 0;
let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (running) {
    updatePlayer(dt);
    updateCompanions(dt);
    updateEntities(dt);
    updateCombat(dt);
    updateInput(dt);
    updateZones(dt);
    updateAbilities(dt);
    updateBossMoves(dt);
    updateMower(dt);
    updateQuests(dt);
    updateMmo(dt);
    saveTimer += dt;
    if (saveTimer >= TUNING.autosaveSeconds) {
      saveTimer = 0;
      saveGame();
    }
  } else {
    // Behind the title: a slow turn round the village.
    player.facing += dt * 0.15;
  }
  updateWorld(dt, player.position);
  updateCamera(dt, player.position);
  updateInteriorCutaway(camera);
  updateHud(dt, camera);
  updateMinimap();
  if (running) updateOnlineUi(camera);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Dev only: ?zone=<id> skips the title and drops a fresh character into that zone without touching the save
// (used by tools/smoke.sh to check every zone builds). Autosave stays off in this mode.
const debugZone = import.meta.env.DEV ? new URLSearchParams(location.search).get('zone') : null;
if (debugZone && debugZone in ZONES) {
  Object.assign(state, newGameState());
  loadZone(debugZone as ZoneId);
  startZoneMusic(state.zone);
  saveTimer = -Infinity;
  running = true;
  startOnline();
} else {
  const hasSave = loadGame();
  startTitleMusic();
  const choice = await showTitle(ui, hasSave);
  if (choice === 'new') {
    deleteSave();
    Object.assign(state, newGameState());
    // A loaded save may have built another zone: rebuild Mossbottom for the new character.
    loadZone('mossbottom', SPAWN.x, SPAWN.z);
    teleportPlayer(SPAWN.x, SPAWN.z);
    say('Welcome to Gnomomia. Talk to Elder Fernwick, by the well.', UI.quest);
  } else {
    say('Welcome back to Gnomomia.', UI.quest);
  }
  startZoneMusic(state.zone);
  player.position.y = heightAt(player.position.x, player.position.z);
  running = true;
  window.addEventListener('beforeunload', () => saveGame());
  startOnline();
}

/** After the title (which uses Enter): the online UI, then join the shared world. ?offline skips joining. */
function startOnline(): void {
  createOnlineUi(ui);
  if (!new URLSearchParams(location.search).has('offline')) goOnline();
}
