/// <reference types="vite/client" />
// Gnomes of Gnomomia: renderer and the main loop. Systems live one per file; this file only wires them.
import * as THREE from 'three';
import { loadMyGnome } from '@lawn/gnome';
import { prewarmPrefabs } from '@lawn/prefabs';
import { whileHidden } from '@lawn/mp/background';
import { SPAWN, TUNING, UI, WORLD, type FurnitureKind, type ZoneId } from './config';
import { OBJECTS, RAIDS, ZONES } from './content';
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
import { createTradeUi } from './ui/trade';
import { createBookReader } from './ui/book';
import { initInteriors, updateInteriorCutaway } from './interiors';
import { initQuests, updateQuests } from './quests';
import { initZones, loadZone, updateZones } from './zones';
import { initWorld, updateWorld, FOG_FAR } from './world';
import { initProgression } from './progression';
import { initBossMoves, updateBossMoves } from './bossmoves';
import { initMower, updateMower } from './mower';
import { debugRaid, initRaids, updateRaids } from './raids';
import { initRaidHelpers } from './raidHelpers';
import { createRaidHud, updateRaidHud } from './ui/raidHud';
import { createCraftUi } from './ui/craft';
import { initRaidAchievements } from './raidAchievements';
import { updateAbilities } from './abilities';
import { startTownTour, updateTownTour } from './townTour';
import { townById } from './towns';
import { initAudio } from './audio';
import { initMusic, startTitleMusic, startZoneMusic } from './music';
import { deleteSave, loadGame, saveGame } from './save';
import { onCloudStatus, resolveConflict, syncAtStartup } from './cloudSave';
import { chooseSave } from './ui/cloud';
import { showTitle } from './ui/title';
import { startTutorial } from './ui/tutorial';
import { newGameState, state } from './state';
import { goOnline, initMmo, updateMmo } from './net/mmo';
import { createOnlineUi, updateOnlineUi } from './ui/online';
import { createMinimap, updateMinimap } from './ui/minimap';
import { createSettings } from './ui/settings';
import { createDockVolumeButton } from './ui/volumeButton';
import { onSettingsChange, settings } from './settings';
import { runSimVisualizer } from './sim/visualizer';
import { initGnomomiaWasm } from './wasm/terrainWasm';
import { beginFrame, endFrame, initProfiler, timed } from '@lawn/profiler';

// Opt-in hitch profiler (?profile, see packages/profiler); off, it costs one boolean check per system.
initProfiler('gnomes-of-gnomomia', { context: () => ({ zone: state.zone }) });

// The custom gnome (Gnome Creator) and the Wasm terrain/pathfinding kernel load before the world is built.
await Promise.all([loadMyGnome(), initGnomomiaWasm()]);

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

// Phones (coarse pointer) render at a lower pixel ratio to keep the frame rate up.
const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

// Prefabs drawn mid-game (player visuals and every furniture kind). Pre-compiling them at startup stops the
// first hitch when they appear. Kept short on purpose: passing nothing would bake the whole catalog.
const FURNITURE_KINDS: readonly FurnitureKind[] = [
  'altar', 'anvil', 'barrel', 'bed', 'bedroll', 'bench', 'bookshelf', 'cauldron', 'chair', 'counter', 'crate', 'cupboard',
  'hearth', 'lamp', 'lectern', 'loom', 'millstone', 'painting', 'pew', 'plant', 'pot', 'rug', 'sack', 'stool', 'table',
  'wardrobe', 'workbench',
];
const MIDGAME_PREFABS: readonly string[] = ['clover-cig', 'stout-tankard', ...FURNITURE_KINDS];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: !COARSE });
if (COARSE) renderer.shadowMap.autoUpdate = false;
function applyRendererSettings(): void {
  renderer.setPixelRatio(settings.highDpi ? Math.min(window.devicePixelRatio, COARSE ? 1.5 : 2) : 1);
  renderer.shadowMap.enabled = settings.shadows;
  if (COARSE && settings.shadows) renderer.shadowMap.needsUpdate = true;
}
applyRendererSettings();
onSettingsChange(applyRendererSettings);
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, Math.min(WORLD.cameraFar, FOG_FAR + WORLD.chunk));

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const searchParams = new URLSearchParams(location.search);
if (searchParams.has('sim')) {
  runSimVisualizer({ canvas, ui, renderer, scene, camera, params: searchParams });
} else {
  initWorld(scene);
prewarmPrefabs(MIDGAME_PREFABS, { renderer, camera, scene });
initZones(scene);
initInteriors(scene);
initProgression();
initBossMoves(scene);
initMower(scene);
initRaidHelpers(scene);
initRaids(scene);
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
createDockVolumeButton(ui);
// Dialogue subscribes to 'talk' before quests do, so it picks its greeting from the state before a turn-in.
createDialogue(ui);
createShop(ui);
createTradeUi(ui);
createBookReader(ui);
createRaidHud(ui);
createCraftUi(ui);
initQuests();
initAudio();
initMusic();
initMmo(scene);
initRaidAchievements(ui);

let running = false;
/** Dev only: ?townwalk=<town> is touring (src/townTour.ts). */
let townTourOn = false;
let saveTimer = 0;
let shadowTick = 0;
let last = performance.now();

function frame(now: number): void {
  beginFrame();
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (running) {
    timed('updatePlayer', () => updatePlayer(dt));
    timed('updateCompanions', () => updateCompanions(dt));
    timed('updateEntities', () => updateEntities(dt));
    timed('updateCombat', () => updateCombat(dt));
    timed('updateInput', () => updateInput(dt));
    timed('updateZones', () => updateZones(dt));
    timed('updateAbilities', () => updateAbilities(dt));
    timed('updateBossMoves', () => updateBossMoves(dt));
    timed('updateMower', () => updateMower(dt));
    timed('updateRaids', () => updateRaids(dt));
    timed('updateRaidHud', () => updateRaidHud(dt));
    timed('updateQuests', () => updateQuests(dt));
    timed('updateMmo', () => updateMmo(dt));
    if (townTourOn) updateTownTour(dt);
    saveTimer += dt;
    if (saveTimer >= TUNING.autosaveSeconds) {
      saveTimer = 0;
      timed('saveGame', saveGame);
    }
  } else {
    // Behind the title: a slow turn round the village.
    player.facing += dt * 0.15;
  }
  timed('updateWorld', () => updateWorld(dt, player.position));
  timed('updateCamera', () => updateCamera(dt, player.position));
  timed('updateInteriorCutaway', () => updateInteriorCutaway(camera));
  timed('updateHud', () => updateHud(dt, camera));
  timed('updateMinimap', () => updateMinimap());
  if (running) timed('updateOnlineUi', () => updateOnlineUi(camera));
  if (COARSE && settings.shadows && (shadowTick++ & 1) === 0) renderer.shadowMap.needsUpdate = true;
  timed('render', () => renderer.render(scene, camera));
  endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// requestAnimationFrame stops in a hidden tab. Keep net presence alive there (no combat, entities or zones).
whileHidden((dt) => {
  last = performance.now();
  if (running) updateMmo(dt);
});

// Dev only: ?zone=<id> skips the title and drops a fresh character into that zone without touching the save
// (used by tools/smoke.sh to check every zone builds). Autosave stays off in this mode.
// ?townwalk=<town> does the same in that town's zone, then walks the player round the town (src/townTour.ts).
const debugZone = import.meta.env.DEV ? new URLSearchParams(location.search).get('zone') : null;
const debugTownWalk = import.meta.env.DEV ? new URLSearchParams(location.search).get('townwalk') : null;
const tourTown = debugTownWalk ? townById(debugTownWalk) : undefined;
// Dev only: ?raid=<raid id> drops a fresh character at that raid's horn and blows it (src/raids.ts debugRaid).
const debugRaidId = import.meta.env.DEV ? new URLSearchParams(location.search).get('raid') : null;
const debugRaidDef = debugRaidId ? RAIDS[debugRaidId] : undefined;
if ((debugZone && debugZone in ZONES) || tourTown || debugRaidDef) {
  Object.assign(state, newGameState());
  if (tourTown) {
    loadZone(tourTown.zone, tourTown.x, tourTown.z);
    townTourOn = startTownTour(tourTown.id);
  } else if (debugRaidDef) {
    const h = OBJECTS[debugRaidDef.horn];
    loadZone(debugRaidDef.zone, h?.x ?? debugRaidDef.x, h?.z ?? debugRaidDef.z);
  } else {
    loadZone(debugZone as ZoneId);
  }
  startZoneMusic(state.zone);
  saveTimer = -Infinity;
  running = true;
  if (debugRaidDef) debugRaid(debugRaidDef.id);
  startOnline();
} else {
  const sync = await syncAtStartup();
  if (sync.kind === 'conflict') await resolveConflict(await chooseSave(ui, sync.local, sync.remote));
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
    startTutorial(ui);
  } else {
    say('Welcome back to Gnomomia.', UI.quest);
  }
  startZoneMusic(state.zone);
  player.position.y = heightAt(player.position.x, player.position.z);
  running = true;
  onCloudStatus((s) => {
    if (s === 'stopped') {
      say('Your save changed on another device. This session now saves on this browser only. Reload to choose which save to keep.', UI.quest);
    }
  });
  window.addEventListener('beforeunload', () => saveGame());
  startOnline();
}

/** After the title (which uses Enter): the online UI, then join the shared world. ?offline skips joining. */
function startOnline(): void {
  createOnlineUi(ui);
  if (!new URLSearchParams(location.search).has('offline')) goOnline();
}
}
