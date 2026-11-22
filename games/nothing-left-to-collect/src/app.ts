// Nothing Left to Collect: wiring only. Renderer, camera, which floor is built, and the frame loop.
// Gameplay is director.ts (the chapters' API) and chapters/*.ts (the script).
import * as THREE from 'three';
import { createAchievementTracker } from '@lawn/achievements';
import { createFollowCamera } from './camera';
import { clearItems, createCollectState } from './collect';
import { CHAPTER_ORDER } from './config';
import { createDirector } from './director';
import { createHud } from './hud';
import { createInput } from './input';
import { createItemView } from './items';
import { createMusic } from './music';
import { buildFloor } from './office';
import { createPlayer } from './player';
import { loadSave } from './save';
import { createSfx } from './sfx';
import type { ChapterId, Floor, FloorId } from './types';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
const follow = createFollowCamera(camera);

const params = new URLSearchParams(location.search);
const fast = params.has('fast');
const chapterParam = params.get('chapter');
const forced = chapterParam !== null && (CHAPTER_ORDER as readonly string[]).includes(chapterParam);
const start: ChapterId = forced ? (chapterParam as ChapterId) : 'prologue';

const hud = createHud(ui, { fast });
const input = createInput(ui);
const sfx = createSfx();
const music = createMusic();
const save = loadSave();
const achievements = createAchievementTracker({ ui: hud.achievementSlot });
const collect = createCollectState(0x5eed);
const items = createItemView(scene);
const player = createPlayer(scene);

let floor: Floor = buildFloor(scene, 'lobby');
function setFloor(id: FloorId): Floor {
  floor.dispose();
  clearItems(collect);
  items.clear();
  floor = buildFloor(scene, id);
  return floor;
}

const director = createDirector({
  scene, player, hud, input, items, collect, save, achievements, music, sfx, fast,
  getFloor: () => floor,
  setFloor,
});

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const unlockAudio = (): void => sfx.unlock();
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);

const sp = floor.layout.spawn;
player.teleport(sp.x, 0, sp.z, sp.facing);
follow.snap(player.pos, 'follow');

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 1 / 20);
  director.tick(dt);
  floor.update(dt);
  follow.update(dt, player.pos, director.cameraMode());
  renderer.render(scene, camera);
});

// Debug handle for agents and demos: window.fc.director.ctx, window.fc.collect, ...
(window as unknown as { fc: unknown }).fc = { director, player, collect, hud, music, get floor() { return floor; } };

void director.run(start, forced);
