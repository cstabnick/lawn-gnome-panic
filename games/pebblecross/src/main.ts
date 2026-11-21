// Pebblecross: a town of gnomes with schedules and friends. This file only wires the modules together; each module
// owns one job (see docs/roadmaps/pebblecross.md, the Contracts section).
import * as THREE from 'three';
import { fromModelLook, getMyGnome, loadMyGnome } from '@lawn/gnome';
import { createAchievementTracker } from '@lawn/achievements';
import {
  FORAGE_RESPAWN_MINUTES, FORAGE_SECONDS, GIFTS, GIFT_IDS, INTERACT_RANGE, SAVE_KEY,
  type GiftId, type Resident, type ResidentId, type Save,
} from './config';
import { clockLabel, dayIndex, gameMinutesPerRealSecond, hourOf, startClock } from './clock';
import { activityAt } from './schedule';
import {
  addToBag, bagCount, canGive, canTalk, emptySave, give, isFriend, levelOf, readSave, talk, writeSave,
} from './friendship';
import { giftLine, talkLine } from './dialogue';
import { RESIDENT_BY_ID, RESIDENTS } from './residents';
import { TOWN_DOC, loadTown } from './town';
import { makeNav, type Pt } from './nav';
import { buildWorld } from './world';
import { createPlayerWalker, createResidentActor, updateResidentActors, type ResidentActor } from './actors';
import { createCameraRig } from './camera';
import { createInput, type TapHit } from './input';
import { createHud } from './hud';
import { createPanels, type FriendRow } from './panels';

// ---- Boot ----

await loadMyGnome();

const SKY = 0xbfe3ff;
/** Watch the clock at four times the speed (for testing). */
const FAST_SPEED = 4;
/** Seconds between automatic saves. */
const SAVE_EVERY_S = 5;
/** Seconds between HUD clock updates. */
const HUD_EVERY_S = 0.5;
/** How close the player must be to a named place to see its name, metres. */
const PLACE_NAME_RANGE = 3;

const params = new URLSearchParams(location.search);
const speedMul = params.has('fast') ? FAST_SPEED : 1;
if (params.has('reset')) {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage is blocked: the game simply starts from a new save.
  }
}

const save: Save = readSave() ?? emptySave();
let total = save.clock ?? startClock();

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const town = loadTown(TOWN_DOC);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 60, 180);

scene.add(new THREE.HemisphereLight(0xffffff, 0x556644, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(20, 40, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 120;
scene.add(sun);
scene.add(sun.target);

const world = buildWorld(scene, town);
const ground = scene.getObjectByName('ground');
if (!ground) throw new Error('pebblecross: the ground mesh is missing from the world');

const nav = makeNav(town.navWorld);

const actors: ResidentActor[] = RESIDENTS.map((r) => {
  const actor = createResidentActor(scene, town, r, total);
  actor.walker.object.userData.residentId = r.id;
  return actor;
});

const myGnome = getMyGnome();
const player = createPlayerWalker(scene, town, myGnome ? fromModelLook(myGnome.look) : null);

const rig = createCameraRig(town);
const input = createInput(canvas, rig, ground);

const achievements = createAchievementTracker({ ui });

// Forage meshes by patch id, so a picked patch can hide and come back.
const forageMeshes = new Map<string, THREE.Object3D>();
for (const o of world.pickables) {
  if (o.userData.forage === true) forageMeshes.set(String(o.userData.placeId), o);
}

// ---- State that lives only in this file ----

/** Forage patch id -> the game minute at which it has something on it again. */
const respawnAt = new Map<string, number>();
/** The resident the player is walking to, to open their card on arrival. */
let pendingResident: ResidentId | null = null;
/** A forage patch being picked: seconds of standing still so far. */
let picking: { id: string; t: number } | null = null;
/** What the use button does right now. */
let useTarget: { kind: 'talk'; id: ResidentId } | { kind: 'forage'; id: string } | null = null;

// ---- Helpers ----

const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.z - b.z);
const dayNow = (): number => dayIndex(total);
const residentOf = (id: ResidentId): Resident => RESIDENT_BY_ID[id];
const firstName = (r: Resident): string => r.name.split(' ')[0];
const actorFor = (id: ResidentId): ResidentActor | undefined => actors.find((a) => a.resident.id === id);
const pickIndex = (): number => Math.floor(Math.random() * 1000);
const unlock = (id: string): void => {
  void achievements.unlock(id);
};

function persist(): void {
  save.clock = total;
  writeSave(save);
}

function forageReady(id: string): boolean {
  const back = respawnAt.get(id);
  return back === undefined || total >= back;
}

function refreshForage(): void {
  for (const f of town.forage) {
    const mesh = forageMeshes.get(f.id);
    if (mesh) mesh.visible = forageReady(f.id);
  }
}

function friendRow(r: Resident): FriendRow {
  const points = save.points[r.id] ?? 0;
  const act = activityAt(r, total);
  const placeLabel = town.places[act.at]?.label ?? act.at;
  return { resident: r, points, level: levelOf(points).name, where: `${act.doing} at ${placeLabel}` };
}

/** Walk the player to a free spot near `target`. Returns false when there is no route. */
function walkTo(target: Pt): boolean {
  const spot = nav.nearestFree(target.x, target.z, 2);
  if (!spot) {
    hud.toast("Can't get there");
    return false;
  }
  const path = nav.findPath(player.pos, spot);
  if (path === null) {
    hud.toast("Can't get there");
    return false;
  }
  player.setPath(path);
  return true;
}

// ---- Actions ----

/** Achievements for a resident crossing into Friend level. Call with whether they were a friend before the change. */
function noteFriendship(id: ResidentId, wasFriend: boolean): void {
  if (wasFriend || !isFriend(save, id)) return;
  unlock('pc-pal');
  void achievements.increment('pc-everybody');
}

function doTalk(id: ResidentId): void {
  const r = residentOf(id);
  const day = dayNow();
  const wasFriend = isFriend(save, id);
  const gained = talk(save, id, day);
  const points = save.points[id] ?? 0;
  unlock('pc-first-hello');
  if (gained > 0) {
    if (hourOf(total) < 8) unlock('pc-early-bird');
    noteFriendship(id, wasFriend);
  }
  persist();
  panels.close();
  hud.dialog(r.name, talkLine(r, total, points, pickIndex()));
  if (gained > 0) hud.toast(`+${gained} friendship with ${firstName(r)}`);
}

function doGive(id: ResidentId, item: GiftId): void {
  const r = residentOf(id);
  const day = dayNow();
  if (!canGive(save, id, item, day)) {
    hud.toast(bagCount(save, item) === 0
      ? `No ${GIFTS[item].label.toLowerCase()} in the bag`
      : `Already gave ${firstName(r)} a gift today`);
    return;
  }
  const favourite = item === r.favourite;
  const wasFriend = isFriend(save, id);
  const gained = give(save, id, item, day, favourite);
  void achievements.increment('pc-gift-giver');
  noteFriendship(id, wasFriend);
  persist();
  panels.close();
  hud.toast(`+${gained} friendship with ${firstName(r)}`);
  hud.dialog(r.name, giftLine(r, favourite, pickIndex()));
}

function openResidentCard(id: ResidentId): void {
  const r = residentOf(id);
  const day = dayNow();
  const bagHasGift = GIFT_IDS.some((item) => bagCount(save, item) > 0);
  panels.openResident(r, friendRow(r), {
    talk: () => doTalk(id),
    give: () => panels.openBag(save, (item) => doGive(id, item)),
    canGive: bagHasGift && (save.giftedDay[id] ?? -1) !== day,
    canTalk: canTalk(save, id, day),
  });
}

function openFriendsPanel(): void {
  panels.openFriends(RESIDENTS.map(friendRow), (id) => openResidentCard(id));
}

function pickForage(id: string): void {
  const patch = town.forage.find((f) => f.id === id);
  picking = null;
  if (!patch || !patch.item) return;
  addToBag(save, patch.item);
  respawnAt.set(id, total + FORAGE_RESPAWN_MINUTES);
  refreshForage();
  persist();
  hud.toast(`+1 ${GIFTS[patch.item].label}`);
}

/** The use button (or the E key): talk to the resident in range, or start picking the forage patch in range. */
function useAction(): void {
  if (!useTarget) return;
  if (useTarget.kind === 'talk') {
    openResidentCard(useTarget.id);
  } else {
    picking = { id: useTarget.id, t: 0 };
  }
}

// ---- HUD, panels and input ----

const hud = createHud(ui, {
  onUse: () => useAction(),
  onBag: () => panels.openBag(save),
  onFriends: () => openFriendsPanel(),
});
const panels = createPanels(ui);

input.onTap((hit: TapHit) => {
  if (hit.kind === 'resident') {
    const actor = actorFor(hit.id as ResidentId);
    if (!actor) return;
    // Stand a little short of them, on the player's side.
    const rp = actor.walker.pos;
    const dx = player.pos.x - rp.x;
    const dz = player.pos.z - rp.z;
    const len = Math.hypot(dx, dz) || 1;
    const want = { x: rp.x + (dx / len) * INTERACT_RANGE * 0.6, z: rp.z + (dz / len) * INTERACT_RANGE * 0.6 };
    picking = null;
    if (walkTo(want)) pendingResident = actor.resident.id;
    return;
  }
  pendingResident = null;
  picking = null;
  if (hit.kind === 'ground') {
    walkTo({ x: hit.x, z: hit.z });
  } else if (hit.kind === 'place') {
    const place = town.places[hit.id];
    if (place) walkTo(place);
  } else {
    const patch = town.forage.find((f) => f.id === hit.id);
    if (patch) walkTo(patch);
  }
});

input.onKey((key) => {
  if (key === 'use') useAction();
  else if (key === 'bag') panels.openBag(save);
  else if (key === 'friends') openFriendsPanel();
  else if (key === 'escape') {
    if (panels.isOpen()) panels.close();
    else if (hud.isDialogOpen()) hud.closeDialog();
  }
});

// Per frame: the use button for whatever is in range, and the place name under the player.
function updateUse(): void {
  let target: typeof useTarget = null;
  let label: string | null = null;
  for (const actor of actors) {
    if (!actor.walker.object.visible) continue;
    if (dist(player.pos, actor.walker.pos) <= INTERACT_RANGE) {
      target = { kind: 'talk', id: actor.resident.id };
      label = `Talk to ${firstName(actor.resident)}`;
      break;
    }
  }
  if (!target) {
    for (const patch of town.forage) {
      if (!patch.item || !forageReady(patch.id)) continue;
      if (dist(player.pos, patch) > INTERACT_RANGE) continue;
      target = { kind: 'forage', id: patch.id };
      label = picking?.id === patch.id ? `Picking ${GIFTS[patch.item].label}...` : `Pick ${GIFTS[patch.item].label}`;
      break;
    }
  }
  useTarget = target;
  hud.setUse(label, label !== null);
}

function nearestPlaceName(): string {
  let best: { label: string; d: number } | null = null;
  for (const place of Object.values(town.places)) {
    const d = dist(player.pos, place);
    if (d <= PLACE_NAME_RANGE && (best === null || d < best.d)) best = { label: place.label, d };
  }
  return best ? `At ${best.label}` : 'On the green';
}

// ---- Renderer, camera and the loop ----

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  rig.resize(window.innerWidth, window.innerHeight);
}
resize();
window.addEventListener('resize', resize);
window.addEventListener('pagehide', persist);

let last = performance.now();
let saveTimer = 0;
let hudTimer = 0;

function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  // The clock.
  total += dt * gameMinutesPerRealSecond() * speedMul;

  // Residents and the player.
  updateResidentActors(actors, town, nav, total, Math.random);
  player.update(dt);
  for (const actor of actors) actor.walker.update(dt);
  world.update(dt);
  refreshForage();

  // Arriving at a resident opens their card.
  if (pendingResident) {
    const actor = actorFor(pendingResident);
    if (!actor) {
      pendingResident = null;
    } else if (!player.moving && dist(player.pos, actor.walker.pos) <= INTERACT_RANGE) {
      const id = pendingResident;
      pendingResident = null;
      openResidentCard(id);
    }
  }

  // Picking a forage patch: stand still in range for FORAGE_SECONDS.
  if (picking) {
    const patch = town.forage.find((f) => f.id === picking?.id);
    const ok = patch !== undefined && !player.moving && dist(player.pos, patch) <= INTERACT_RANGE && forageReady(picking.id);
    if (!ok) {
      picking = null;
    } else {
      picking.t += dt;
      if (picking.t >= FORAGE_SECONDS) pickForage(picking.id);
    }
  }

  // Input and HUD.
  input.setPickables([
    ...world.pickables.filter((o) => o.visible),
    ...actors.map((a) => a.walker.object).filter((o) => o.visible),
  ]);
  updateUse();

  hudTimer += dt;
  if (hudTimer >= HUD_EVERY_S) {
    hudTimer = 0;
    hud.setClock(clockLabel(total), hourOf(total));
    hud.setPlace(nearestPlaceName());
  }

  saveTimer += dt;
  if (saveTimer >= SAVE_EVERY_S) {
    saveTimer = 0;
    persist();
  }

  rig.follow(player.pos.x, player.pos.z, dt);
  renderer.render(scene, rig.camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
