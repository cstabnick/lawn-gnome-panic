// Gnome Theft Auto: wiring only. Renderer, the frame loop and the glue between the modules (see types.ts for contracts).
import * as THREE from 'three';
import { createGnomeModel, getMyGnome } from '@lawn/gnome';
import { createAchievementTracker } from '@lawn/achievements';
import { play, playHorn, setEngine, setSkid, unlockAudio } from './audio';
import { createWorldSound, playAt, soundStats } from './sound';
import { createAtmosphere } from './atmosphere';
import { createChaseCamera } from './camera';
import {
  BAIL_MIN_ALTITUDE, BIOME_NAMES, CULVERT_PORTALS, DEFAULT_LOOK, GUNS, GUN_ORDER, HEAT, MOWER_TINTS, PAY_N_GLAZE, VEHICLE_SHOT_DAMAGE, PLAYER, CRACK_LINES, RUNOVER_LINES, SIDE_VALVE, STEAL_LINES, VIEW, CRACKED_TEXT, TESSIE, TAXI,
} from './config';
import { createDestructibles } from './destructibles';
import { bailVelocity, shouldBail, startCoast, stepCoasting } from './bail';
import { createVending } from './vending';
import { DISTRICT_NAMES, districtAt } from './districts';
import { createEasterEggs } from './easterEggs';
import { createEconomy } from './economy';
import { createEncounters } from './encounters';
import { createFx } from './fx';
import { createGarages } from './garages';
import { clearHandsUp } from './gnomes';
import { createHud } from './hud';
import { placeBlips } from './mapPois';
import { createInteractables } from './interactables';
import { createIntroTour } from './introTour';
import { createCutscene } from './quests/cutscene';
import { SCENES } from './cutscene/scenes';
import { runCutsceneCheck } from './cutscene/checkStage';
import type { LiveWorld } from './cutscene/liveArea';
import { createQuestJournal } from './quests/journal';
import { createRadio } from './radio/player';
import { EVENT_BULLETINS, STATIONS } from './radio/content';
import { SPEAKER_MAX_DIST } from './radio/spatial';
import { createQuests } from './quests/quests';
import { roadRoute } from './route';
import { createTaxi } from './taxi';
import { createInput } from './input';
import { createSimDrive, getSetup, getTune, resetSetup, setSetup, setTune, simActive, stepSimDrive, updateRiderLean } from './simdrive';
import { createOptions } from './options';
import { createNet, VEHICLE_CODES, type NetStatus, type Ride } from './net';
import { getMapPlayers } from './mapPrefs';
import { passengerCount, SeatBook } from './seats';
import { createNpcs } from './npcs';
import { createPlayer, setChuteHook } from './player';
import { createAmbientGnomes } from './ambientGnomes';
import { createCritters } from './critters';
import { REGION_LIFE } from './critters/index';
import { createAmbulances } from './ambulance';
import { createWatch } from './police';
import { createRemotes } from './remotes';
import { createStunts } from './stunts';
import { createRaceTrack } from './raceTrack';
import { autopilotInput } from './raceTrack/autopilot';
import { RACE_IDS } from './quests/races';
import { SAVE_KEY as QUEST_SAVE_KEY } from './quests/quests';
import { surfaceAt } from './surfaces';
import * as terrain from './terrain';
import { aboveGround, heightAt } from './terrain';
import { createTraffic } from './traffic';
import type { BiomeId, Blip, CameraMode, Driver, HudRoute, Vehicle, VehicleKind } from './types';
import { beginMount, doorsOf, stepMount, type MountSeq } from './mount';
import {
  collideVehicles, createVehicle, damageVehicle, dropMulchSlick, explodeVehicle, hopLowrider, repaintVehicle,
  repairVehicle, setDamageHook, setDoorOpen, setVehicleHeadlights, stepKnock, stepVehicle, syncVehicleMesh, updateMulchSlicks,
  setVehicleLook,
} from './vehicles';
import { stepIdleBoats } from './boats';
import { createBoatTraffic } from './boatTraffic';
import { checkSink, stepSunk } from './swim';
import { createWakes } from './wake';
import { createVibeNpcs } from './vibeNpcs';
import { createWeapons } from './weapons';
import { createGunStore } from './gunStore';
import { createAimHud } from './aimHud';
import { playGunShot } from './gunSounds';
import { aimZoom, decodeGunWire, encodeGunWire, loadoutIds, stepAim } from './gunMods';
import { buyMods, fitLoadout, fittedLoadout, onGunModsChange } from './gunModStore';
import { crackAchievements, modFitAchievements, shotAchievements } from './gunAchievements';
import { buildWorld } from './world';
import { createWorldDetails } from './worldDetails';
import { buildStageMarks, buildStageSets } from './stageSets';
import { createWorldEvents } from './worldEvents';
import { createTessieWorld } from './tessie';
import { CAPTAIN_CLAY, CRITTER_ACHIEVEMENTS, recordHelm, type HelmStorage } from './wildAchievements';
import { SUNDAY_DRIVER, recordOddRide } from './oddRides';
import { mountSteamConnect } from '@lawn/gamepad';
import { defaultLoadout, encodeLoadout, isStockLoadout, normalizeLoadout, type Loadout } from '@lawn/glaze';
import { ownedLoadout } from './glazeStore';
import { glazeAchievements } from './glazeAchievements';
import { createGlazeStage, type GlazeStage } from './glazeStage';

// Phones: a lighter render keeps the frame rate up (fewer pixels, a smaller shadow map).
const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

const me = getMyGnome();
const myLook = me?.look ?? DEFAULT_LOOK;

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, COARSE ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, VIEW.cameraFar);

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const hud = createHud(ui);
const world = buildWorld(scene, renderer);
hud.setWorld(world);
// Stage set dressing for story and side-quest scenes (src/quests/stages.ts); ?stagesets=0 leaves it out, ?stagemarks shows the stage marks.
const stageParams = new URLSearchParams(location.search);
if (stageParams.get('stagesets') !== '0') buildStageSets(scene, world.boxes);
if (stageParams.has('stagemarks')) scene.add(buildStageMarks(scene));
const fx = createFx(scene);
const chase = createChaseCamera(camera);
const player = createPlayer(scene, myLook);
player.respawn(world.spawn.x, world.spawn.z, world.spawn.yaw);
chase.yaw = world.spawn.yaw;
// After the player: createInput renders the touch buttons at once, and its hop hook reads player.vehicle.
const input = createInput(canvas, ui, {
  handbrake: simActive,
  hop: () => player.vehicle?.kind === 'lowrider',
  canLock: () => !cutscene.active && !introTour.active && !journal.isOpen() && !garages.isOpen() && !gunStore.isOpen(),
});
const weapons = createWeapons(scene, fx);
weapons.attachTo(player.hand());
// Ammu-Gnation: every gun is free; the mods the player fitted are saved per gun (gunModStore.ts).
for (const k of GUN_ORDER) weapons.setLoadout(k, fittedLoadout(k));
onGunModsChange((k) => weapons.setLoadout(k, fittedLoadout(k)));
const aimHud = createAimHud(ui);
// While a cutscene plays (body.gta-in-scene, set by the cutscene's setUiVisible) the crosshair and the corner buttons
// that live outside the HUD stay off the letterboxed frame.
{
  const css = document.createElement('style');
  css.textContent = 'body.gta-in-scene #gta-aim,body.gta-in-scene #gta-journal-btn,body.gta-in-scene #gta-taxi-btn,'
    + 'body.gta-in-scene #gta-options,body.gta-in-scene #gta-radio,body.gta-in-scene #gta-radio-banger{display:none!important}';
  document.head.appendChild(css);
}
// Aim-down-sights blend, 0..1 (gunMods.ts AIM).
let aimT = 0;
const npcs = createNpcs(scene, world, fx);
const vehicles: Vehicle[] = [];
const traffic = createTraffic(scene, world, (t) => hud.toast(t, 3500));
/** The camera on the ground plane, for traffic: new cars only appear where it cannot see them. */
const trafficView = { x: 0, z: 0, dirX: 0, dirZ: 0 };
const trafficLook = new THREE.Vector3();
function viewForTraffic(): typeof trafficView {
  camera.getWorldDirection(trafficLook);
  const l = Math.hypot(trafficLook.x, trafficLook.z);
  trafficView.x = camera.position.x;
  trafficView.z = camera.position.z;
  trafficView.dirX = l > 1e-4 ? trafficLook.x / l : 0;
  trafficView.dirZ = l > 1e-4 ? trafficLook.z / l : 0;
  return trafficView;
}
const watch = createWatch(
  scene,
  world,
  fx,
  vehicles,
  (t) => hud.toast(t, 4500),
  (x, z) => playAt('gun-hoa', { x, z }),
);
const ambulances = createAmbulances(scene, world, fx);
const tracker = createAchievementTracker({ ui });
// Turfton FM: news about what the player does goes out on the air (EVENT_BULLETINS in radio/content.ts). Each one repeats at most every 2 minutes.
const lastNews = new Map<string, number>();
const reportNews = (id: string): void => {
  const now = performance.now();
  if (now - (lastNews.get(id) ?? -Infinity) < 120_000) return;
  lastNews.set(id, now);
  radio.news(id);
};
const achievements = {
  unlock(id: string) { reportNews(id); return tracker.unlock(id); },
  increment(id: string, by?: number) { reportNews(id); return tracker.increment(id, by); },
};
const radio = createRadio(ui, {
  onFullDial: () => void tracker.unlock('gta-drive-time'),
  onEventBulletin: () => void tracker.unlock('gta-on-air'),
});
const economy = createEconomy();
const atmosphere = world.sun && world.hemi ? createAtmosphere(scene, world.sun, world.hemi) : null;
// ?time=noon|golden|night: start in that part of the day (demos and scripted checks).
{
  const t = new URLSearchParams(location.search).get('time');
  if (atmosphere && (t === 'noon' || t === 'golden' || t === 'night')) atmosphere.setMode(t);
}
const stunts = createStunts(scene, hud, economy, fx, play);
const destructibles = createDestructibles(scene, world, fx, play, (amt, reason) => economy.earn(amt, reason));
const vending = createVending(scene, world.vending ?? [], fx, play, (_brand, by) => {
  if (by.driver === 'player') void achievements.unlock('gta-cola-jackpot');
});
const interactables = createInteractables(hud, economy, fx, play);
const encounters = createEncounters(scene, world, hud, economy, watch, fx, play);
const vibeNpcs = createVibeNpcs(scene, world, hud);
const easterEggs = createEasterEggs(scene, world, hud, (amt, reason) => economy.earn(amt, reason));
const worldDetails = createWorldDetails(scene, hud, world.boxes);
const ambientGnomes = createAmbientGnomes(scene);
// The Lost & Found Speedway (raceTrack/): circuit, grandstands, crowd, free-roam lap timer. Its races are quests (quests/races.ts).
const raceTrack = createRaceTrack(scene, world, ui, { hud, unlock: (id) => void achievements.unlock(id), play });
// Wildlife (critters.ts, src/critters/*): local to this browser. Events go out on Turfton FM when a bulletin exists for them.
const critters = createCritters(scene, world, {
  fx,
  play,
  toast: (t) => hud.toast(t, 3500),
  callout: (title, sub) => hud.callout?.(title, sub),
  earn: (amount, reason) => economy.earn(amount, reason),
  steal(amount, reason) {
    const take = Math.min(Math.max(0, Math.floor(amount)), economy.state().acorns);
    return take > 0 && economy.spend(take, reason) ? take : 0;
  },
  hurtPlayer: (amount) => { if (!player.vehicle && deathT <= 0) player.hurt(amount); },
  event: (id) => { if (id in EVENT_BULLETINS) reportNews(id); const a = CRITTER_ACHIEVEMENTS[id]; if (a) void tracker.unlock(a); },
}, REGION_LIFE);
let critterTime = 0;
const worldSound = createWorldSound();
let lastFootX = 0;
let lastFootZ = 0;
// The vehicle the Pay 'n' Glaze shop is open on (null when closed): it stays parked while the shop is open.
let showroomVehicle: Vehicle | null = null;
let showcaseLeft = Number(new URLSearchParams(location.search).get('showcase')) || 0;
let showcaseSeen = false;
// Pay 'n' Glaze showroom stage: the shop warps the vehicle (and the player on it) to a set far off the map and back (glazeStage.ts).
let stage: GlazeStage | null = null;
let stageHome: { x: number; y: number; z: number; yaw: number } | null = null;
function enterStage(v: Vehicle): void {
  if (stageHome) return;
  stage ??= createGlazeStage(scene);
  stageHome = { x: v.x, y: v.y, z: v.z, yaw: v.yaw };
  v.x = stage.spot.x; v.y = stage.spot.y; v.z = stage.spot.z; v.yaw = stage.spot.yaw;
  v.speed = 0;
  v.knock = undefined;
  if (v.sim) v.sim = createSimDrive(v);
  stage.setVisible(true);
  syncVehicleMesh(v, 0);
}
function leaveStage(v: Vehicle): void {
  if (!stageHome) return;
  v.x = stageHome.x; v.y = stageHome.y; v.z = stageHome.z; v.yaw = stageHome.yaw;
  v.speed = 0;
  v.knock = undefined;
  stageHome = null;
  stage?.setVisible(false);
  if (v.sim) v.sim = createSimDrive(v);
  syncVehicleMesh(v, 0);
}
// The shop's Lights tab can switch the beams on in daylight to show them off (window event 'gta-glaze-lights', see glazePanelLights.ts).
let lightsPreview = false;
window.addEventListener('gta-glaze-lights', (e) => { lightsPreview = !!(e as CustomEvent<{ on?: boolean }>).detail?.on; });
const garages = createGarages(ui, hud, economy, {
  repaintVehicle,
  repairVehicle,
  onTuningChange: refreshDriving,
  play,
  setLook: setVehicleLook,
  showroom: (v) => {
    const prev = showroomVehicle;
    showroomVehicle = v;
    if (!v) lightsPreview = false;
    if (v) enterStage(v);
    else if (prev) leaveStage(prev);
    hud.setVisible(!v); // the shop shows the wallet itself; the game HUD would only clutter the showroom
    radio.setShopOpen(!!v);
    // Frame the vehicle by its real model (a long snail-coach is wider than its collision radius), never tighter than the spec.
    let frame: { x: number; y: number; z: number; radius: number } | null = null;
    if (v) {
      const bb = new THREE.Box3().setFromObject(v.object);
      const side = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
      frame = { x: v.x, y: v.y, z: v.z, radius: Math.max(v.spec.radius, side / 2) };
    }
    chase.showroom(frame);
  },
  onPurchase: (info) => {
    refreshDriving();
    glazeAchievements(info, achievements);
  },
});
// Ammu-Gnation, the gun-mod store on Turfton's east edge (gunStore.ts): its walls join the world's collision boxes.
const gunStore = createGunStore({
  scene, ui, hud, economy, play,
  currentGun: () => weapons.gun,
  heat: () => watch.heat,
  // Opens side-on to the display gun (its barrel points +x on the stage).
  showroom: (t) => { hud.setVisible(!t); if (t) { chase.yaw = 0; chase.pitch = 0.15; } chase.showroom(t); },
  onFit: (info) => modFitAchievements(info, achievements),
});
world.boxes.push(...gunStore.boxes);
// Quests: data in quests/defs.ts; the cutscene plays when the player enters a giver's building.
const cutscene = createCutscene(scene, ui, {
  setUiVisible(v) { hud.setVisible(v); input.setVisible(v); document.body.classList.toggle('gta-in-scene', !v); },
  setPlayerVisible(v) { player.model.object.visible = v; weapons.setVisible(v); },
  playerVehicle: () => player.vehicle,
  adoptVehicle(v) { vehicles.push(v); },
  playerLook: () => myLook,
  resetVehicle: () => refreshDriving(),
  placePlayer(x, z, yaw) {
    if (!player.vehicle) { player.respawn(x, z, yaw); chase.yaw = yaw; }
  },
  // A scene's `sky`: hold that time of day (settled under the fade-in), and put the old mode back afterwards.
  setSky(mode) {
    if (!atmosphere) return;
    if (mode) {
      sceneSkyBefore ??= atmosphere.getMode();
      atmosphere.setMode(mode);
      for (let i = 0; i < 6; i++) atmosphere.update(0.25, camera.position.x, camera.position.z, biome);
    } else if (sceneSkyBefore) {
      atmosphere.setMode(sceneSkyBefore);
      sceneSkyBefore = null;
    }
  },
});
let sceneSkyBefore: ReturnType<NonNullable<typeof atmosphere>['getMode']> | null = null;
// ?race=1..4 (demos, scripted checks): that Fizz Cup race is the active quest from the start (written into this browser's quest save).
{
  const raceId = RACE_IDS[Number(new URLSearchParams(location.search).get('race')) - 1];
  if (raceId) {
    try {
      const saves = JSON.parse(localStorage.getItem(QUEST_SAVE_KEY) ?? '{}') as Record<string, { state: string }>;
      for (const id of Object.keys(saves)) if (saves[id].state === 'active') delete saves[id];
      saves[raceId] = { state: 'active', step: 0, cracked: [] } as never;
      localStorage.setItem(QUEST_SAVE_KEY, JSON.stringify(saves));
    } catch { /* storage blocked: no race */ }
  }
}
const quests = createQuests({
  scene, world, npcs, hud, cutscene,
  placePlayer(x, z, yaw) {
    player.respawn(x, z, yaw);
    chase.yaw = yaw;
    weapons.setVisible(true);
  },
  unlock(id) { void achievements.unlock(id); },
  play(sfx) { play(sfx); },
  player,
  vehicles,
  watch,
  traffic,
  fx,
  economy,
  onRadioBulletin: (id) => reportNews(id),
  atmosphere: atmosphere ?? undefined,
  tessieNow: new URLSearchParams(location.search).get(TESSIE.devParam) === 'now',
  onSideUnlock(q, g) {
    hud.banner('NEW SIDE QUEST', 3200);
    hud.toast(`New side quest: {{${q.title}}} from ${g?.name ?? q.giver}. Look for the "?" on the map, or open the Quest Journal (J).`, 8000);
    play('whistle');
  },
  onTessieUnlock() { void achievements.unlock(TESSIE.achievements.rumour); hud.banner('BREAKING NEWS', 3500); hud.toast('Turfton FM: something big in Loch Moss. Driftwood is waiting for you on the loch shore.', 9000); play('whistle'); },
});
const worldEvents = createWorldEvents({ scene, world, hud, vehicles, economy, play });
// The Tessie side quest's open world (tessie.ts): Driftwood at the loch once unlocked, Tessie surfacing after the quest.
const tessieWorld = createTessieWorld({
  scene, world, hud, vehicles, play, report: reportNews,
  unlocked: () => quests.getJournal().saves[TESSIE.unlockKey]?.state === 'done',
  questDone: () => quests.getJournal().saves[TESSIE.questId]?.state === 'done',
  questActive: () => quests.getJournal().activeId === TESSIE.questId,
});
const journal = createQuestJournal(ui, quests, hud);
// The Turfton Taxi (taxi.ts): 🚕 button, Y key or D-pad left; it drives up, the gnome gets in (mount.ts), and it takes
// them back to the Central Bus Stop. Not while wanted, on a contract, driving, swimming, falling or cracked.
const taxi = createTaxi({
  scene, ui, world, vehicles, hud, economy, play,
  player: () => ({ x: player.x, z: player.z }),
  blocked() {
    if (cutscene.active || introTour.active || garages.isOpen() || stageHome) return 'Not now.';
    if (deathT > 0) return 'You are in no state to hail a cab.';
    if (Math.floor(watch.heat) >= 1) return `${TAXI.driver} won't pull up for a gnome with the Hat Watch on its tail. Lose them first.`;
    if (quests.getJournal().activeId) return `${TAXI.driver} doesn't take fares mid-job. Finish or abandon your contract (J) first.`;
    if (player.airborne) return 'Land first, then call a taxi.';
    if (player.swimming) return 'Get out of the water first.';
    if (player.vehicle && player.vehicle !== taxi.vehicle()) return 'Step out of your ride to hail a taxi.';
    return null;
  },
  onDropOff() { void achievements.increment(TAXI.achievement); },
});
/** The verb for getting into a nearby vehicle: the waiting taxi is boarded, an NPC's mower stolen, anything else driven. */
const enterVerb = (n: Vehicle): string => (n === taxi.boardable() ? 'Board' : n.driver === 'npc' ? 'Steal' : 'Drive');
const introTour = createIntroTour(ui, {
  setUiVisible(vis) { hud.setVisible(vis); input.setVisible(vis); },
  onDone() {
    chase.yaw = player.yaw;
    hud.toast('Welcome to Turfton. Mowers are for borrowing.', 4000);
  },
});
setChuteHook(() => play('chute'));

const pickTint = (): number => MOWER_TINTS[Math.floor(Math.random() * MOWER_TINTS.length)];
// Crashes dent and wreck mowers (the model swaps through the prefab's damage stages); say so when it is the player's.
setDamageHook((v, level, name) => {
  if (v === player.vehicle) {
    hud.toast(`${v.spec.name}: ${name}!`);
    play(level > 1 ? 'alarm' : 'bump');
    chase.shake?.(level > 1 ? 0.35 : 0.16);
  }
});
for (const s of world.parked) {
  const pv = createVehicle(scene, s.kind, s.x, s.z, s.yaw, pickTint());
  // Moored boats stay at their docks: traffic.ts never recycles them.
  if (pv.spec.boat) pv.questOwned = true;
  vehicles.push(pv);
}
for (const s of world.airfield.planeSpots) vehicles.push(createVehicle(scene, 'plane', s.x, s.z, s.yaw));
const whirligig = createVehicle(scene, 'whirligig', world.base.padX, world.base.padZ, Math.PI);
vehicles.push(whirligig);
// Water (Epic 4): NPC boats and the HOA patrol boat, and wakes behind every boat.
const boatTraffic = createBoatTraffic(scene, vehicles, world);
const wakes = createWakes(scene);

// ---- Online free roam: other players' gnomes and mowers; our bullets hurt them, theirs hurt us. ----
// Seats: the mower I drive has passenger seats, and its seat book hands them out to players who ask (seats.ts). I can
// also ride in someone else's mower; `riding` is that seat, and `askingRide` a request still waiting on the driver.
const seats = new SeatBook();
let seatsFor: Vehicle | null = null;
let riding: Ride | null = null;
let askingRide: { host: number; name: string } | null = null;
/** The mower I am driving on the ground or in the air, or null (a passenger is not driving). */
const drivenVehicle = (): Vehicle | null => (player.vehicle && player.vehicle.driver === 'player' && !player.airborne ? player.vehicle : null);
/** The seat book belongs to the mower I drive: a new mower starts a new list (and an old one's riders are dropped). */
function syncSeats(): void {
  const d = drivenVehicle();
  if (d === seatsFor) return;
  seatsFor = d;
  seats.reset(d ? passengerCount(d.spec) : 0);
}

const remotes = createRemotes(scene, { myVehicle: drivenVehicle, myId: () => net.myId });
let speakerVehicle: Vehicle | null = null;
let onlineText: string | null = null;
let hurtTimer = 0;
const net = createNet({
  onStatus(status: NetStatus, players: number) {
    onlineText = status === 'online' ? `Online: ${players} in Turfton` : status === 'unavailable' ? null : 'Connecting...';
  },
  onPeerJoin(p) { remotes.join(p); hud.toast(`${p.name} rolled into Turfton.`); },
  onPeerLeave(id) { remotes.leave(id); seats.free(id); },
  onPeerPose(id, pose, t) { remotes.pose(id, pose, t); },
  onPeerLook(id, code) { remotes.setLook(id, code); },
  onPeerGun(id, code) { remotes.setGun(id, code); },
  onHit() {
    player.hurt(0.03);
    if (hurtTimer <= 0) play('crack');
    hurtTimer = 1.5;
  },
  onBoard(from) {
    syncSeats();
    return drivenVehicle() ? seats.take(from) : -1;
  },
  onSeat(host, seat) {
    if (askingRide?.host !== host) return;
    const { name } = askingRide;
    askingRide = null;
    if (seat < 1) hud.toast(`No room in ${name}'s ride.`);
    else boardRide(host, seat, name);
  },
  onLeave(from) { seats.free(from); },
  onPeerRadio(id, station) {
    remotes.setRadio(id, station);
    if (riding?.host === id) radio.tune(station, { save: false, showDial: true });
  },
  onPeerBanger(id, station, songIndex) {
    const who = remotes.nameOf(id) ?? 'A gnome';
    const st = STATIONS.find((s) => s.id === station) ?? STATIONS[0];
    const song = st.songs[songIndex] ?? st.songs[0];
    hud.toast(`🔥 ${who}: "Yeah, this is a banger!" — "${song.title}" on ${st.freq} ${st.label}`, 6000);
    radio.showBangerInvite(who, station, song.title, () => {
      if (player.vehicle) {
        radio.tune(station, { save: true, showDial: true });
        if (player.vehicle.driver === 'player') net.setRadio(station);
      }
    });
  },
  onReset() {
    remotes.clear();
    askingRide = null;
    seatsFor = null;
    seats.reset(0);
  },
});
const roomParam = new URLSearchParams(location.search).get('room');
// Sim-driven mowers go online too: the driver's own pose (v.x, v.z, v.yaw) is what gets broadcast, and remote players only render it.
// ?offline (demos, scripted checks) stays local.
if (!new URLSearchParams(location.search).has('offline')) net.start(me?.name ?? 'Gnome', me?.code ?? 'gnorman', roomParam ? roomParam.toUpperCase() : null);

const stats = { cracked: 0, driven: new Set<VehicleKind>(), whirligigStolen: false, trespassed: false };

// Flight and biome state. A gnome that bails with an open canopy and lands on its feet earns the skydiver achievement.
let wasAirborne = false;
let hadChute = false;
let piloted = false;
let biome: BiomeId = world.biomeAt(player.x, player.z);
const visitedBiomes = new Set<BiomeId>([biome]);
void achievements.increment('gta-explorer');

// ---- Input that needs a user gesture -----------------------------------------------------------------------------
const unlock = (): void => unlockAudio();
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });

npcs.onRunOver = (n, v) => {
  if (v.driver !== 'player') return;
  watch.addHeat(HEAT.crackPedestrian * 1.5);
  void achievements.increment('gta-ragdoll');
  hud.toast(`${n.name}: "${pickLine(RUNOVER_LINES)}"`);
  play('bump');
};

// ---- Helpers -----------------------------------------------------------------------------------------------------
const pickLine = (lines: readonly string[]): string => lines[Math.floor(Math.random() * lines.length)];

function nearestVehicle(): Vehicle | null {
  let best: Vehicle | null = null;
  let bestD: number = PLAYER.enterRange;
  for (const v of vehicles) {
    if (v.driver === 'player' || v.driver === 'remote' || v.sunk) continue;
    if (v === taxi.vehicle() && taxi.boardable() !== v) continue;
    if (Math.abs(v.y - player.y) > 2) continue;
    const d = Math.hypot(v.x - player.x, v.z - player.z) - (v.spec.radius - 1);
    if (d < bestD) { bestD = d; best = v; }
  }
  return best;
}

// ---- Getting in and out --------------------------------------------------------------------------------------------
// Every mount is an animated sequence (mount.ts): the gnome walks round to the nearest side or door, climbs in or out,
// and the vehicle answers to the controls only once the gnome is seated. A driver who is already there is yanked out first.
interface ActiveMount {
  seq: MountSeq;
  /** The vehicle's driver before the sequence reserved it: 'none' when empty, 'npc' or 'police' for a yank. */
  prev: Driver;
  /** A yanked driver has come out, so the seat is empty. */
  pulled: boolean;
}
let mount: ActiveMount | null = null;

/** Starts getting in: the gnome walks to the vehicle and climbs in, or yanks the driver out first. The vehicle is reserved meanwhile. */
function getIn(v: Vehicle): void {
  const yank = v.driver === 'npc' || v.driver === 'police';
  mount = { seq: beginMount(yank ? 'yank' : 'enter', v, { x: player.x, y: player.y, z: player.z }), prev: v.driver, pulled: false };
  v.driver = 'player';
  play('door');
}

/** A driver pulled out of the seat: an NPC or police driver is removed and runs off, as a theft always did. */
function onYankedOut(v: Vehicle, prev: Driver): void {
  v.driver = prev;
  if (prev === 'npc') {
    const out = traffic.ejectDriver(v);
    if (out) {
      // Spawn a stride from the gnome, on the side away from the vehicle, and run from the vehicle.
      const dx = player.x - v.x, dz = player.z - v.z;
      const len = Math.hypot(dx, dz) || 1;
      const n = npcs.spawnFleeing(player.x + (dx / len) * 1.2, player.z + (dz / len) * 1.2, v.x, v.z, out.look);
      // Half the time they say where they were headed (the driver's errand), otherwise a stock line.
      const line = out.reason && Math.random() < 0.5 ? `I was on my way ${out.reason}!` : pickLine(STEAL_LINES);
      hud.toast(`${n.name}: "${line}"`);
      watch.addHeat(HEAT.stealOccupied);
      void achievements.unlock('gta-borrowed');
    }
  } else if (prev === 'police') {
    watch.ejectPursuitDriver?.(v);
    watch.addHeat(HEAT.stealOccupied);
  }
  v.driver = 'player';
  play('steal');
}

/** localStorage for the Captain Clay record, or null when the browser refuses it. */
function helmStorage(): HelmStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** The gnome is seated: the vehicle is the player's to drive. */
function takeWheel(v: Vehicle): void {
  v.driver = 'player';
  // The player's own Pay 'n' Glaze work shows on any vehicle of that model they drive (before the sim reads the ride height).
  const own = ownedLoadout(v.kind);
  if (own && v.rig) setVehicleLook(v, own);
  if (simActive() && !v.spec.flies && !v.spec.boat) v.sim = createSimDrive(v);
  player.enter(v);
  input.refresh();
  weapons.setVisible(false);
  if (!stats.driven.has(v.kind)) {
    stats.driven.add(v.kind);
    void achievements.increment('gta-collector');
  }
  if (v.spec.boat && recordHelm(v.kind, helmStorage())) void achievements.increment(CAPTAIN_CLAY);
  if (recordOddRide(v.kind, helmStorage())) void achievements.increment(SUNDAY_DRIVER);
  if (v === whirligig && !stats.whirligigStolen) {
    stats.whirligigStolen = true;
    watch.addHeat(HEAT.stealWhirligig);
    hud.banner('WHIRLIGIG STOLEN');
    play('alarm');
    void achievements.unlock('gta-whirligig');
  } else {
    hud.toast(v.spec.name);
  }
  speakerVehicle = v;
  radio.start();
  net.setRadio(radio.station);
}

/** Seated in the Turfton Taxi: it drives itself (taxi.ts) and the controls are held until the Bus Stop. */
function boardTaxi(v: Vehicle): void {
  v.driver = 'player';
  v.sim = undefined;
  player.enter(v);
  input.refresh();
  weapons.setVisible(false);
  play('door');
}

/** Ask the driver of a remote player's mower for a seat. Their answer comes back through onSeat. */
function askRide(t: { host: number; name: string; vehicle: Vehicle }): void {
  if (askingRide) return;
  askingRide = { host: t.host, name: t.name };
  net.requestSeat(t.host);
  hud.toast(`Asking ${t.name} for a seat...`);
}

/** Sit in seat `seat` of remote player `host`'s mower (they said yes). */
function boardRide(host: number, seat: number, name: string): void {
  const v = remotes.vehicleOf(host);
  if (!v || player.vehicle || player.airborne) {
    // The mower went or I got in something else: give the seat back.
    net.leaveSeat(host);
    return;
  }
  riding = { host, seat };
  speakerVehicle = v;
  player.enter(v, seat);
  input.refresh();
  weapons.setVisible(false);
  const hostStation = remotes.stationOf(host);
  if (hostStation !== null) radio.tune(hostStation, { save: false, showDial: true });
  radio.start();
  play('door');
  hud.toast(`Riding with ${name} in ${v.spec.name}`);
  void achievements.unlock('gta-carpool');
}

/** Get off a mower a remote player drives. A flyer only lets you out low down; higher up you ride it down. */
function getOffRide(v: Vehicle): void {
  if (v.spec.flies && v.y > 1.5) {
    hud.toast('Too high to jump out. Ask them to land.');
    return;
  }
  leaveRide();
  play('door');
}

/** Let go of the seat I hold: tell its driver, and step out where I sit (a flyer that is still up leaves me falling). */
function leaveRide(): void {
  if (riding) net.leaveSeat(riding.host);
  riding = null;
  const v = player.vehicle;
  if (v && !v.exploded) speakerVehicle = v;
  if (v && v.spec.flies && aboveGround(v.x, v.y, v.z) > BAIL_MIN_ALTITUDE) player.bail(v);
  else player.exit();
  input.refresh();
  radio.stop({ keepPlaying: !!v && !v.exploded });
  weapons.setVisible(true);
}

/** The gnome has got out and stands on the ground: the vehicle is empty and parked. */
function onStood(v: Vehicle): void {
  v.driver = 'none';
  v.speed = 0;
  v.sim = undefined;
  input.refresh();
  weapons.setVisible(true);
}

/** Getting out of a flyer in the air bails out (instant; the chute opens by itself). On the ground the gnome climbs out, or leaves through a door. */
function getOut(): void {
  const v = player.vehicle;
  if (!v) return;
  if (v.driver === 'remote') {
    getOffRide(v);
    return;
  }
  if (v.spec.flies && aboveGround(v.x, v.y, v.z) > BAIL_MIN_ALTITUDE) {
    // Bail out in mid-air: the parachute opens by itself (see player.updateAir).
    v.driver = 'none';
    speakerVehicle = v;
    player.bail(v);
    radio.stop({ keepPlaying: true });
    hadChute = false;
    weapons.setVisible(false);
    hud.toast('Bailing out!');
    return;
  }
  if (v.spec.flies && v.y > 1.5) {
    hud.toast('Too low to jump. Land first.');
    return;
  }
  if (v.spec.fixedWing && v.y <= 1.5 && Math.abs(v.speed) > 6) {
    hud.toast('Slow down first.');
    return;
  }
  if (shouldBail(v)) {
    // Moving too fast for the climb-out: the gnome is thrown clear and the vehicle rolls on without a driver (bail.ts).
    const vel = bailVelocity(v);
    speakerVehicle = v;
    radio.stop({ keepPlaying: true });
    player.throwFrom(v, vel.vx, vel.vy, vel.vz);
    startCoast(v);
    input.refresh();
    weapons.setVisible(false);
    play('bump');
    hud.toast('Bailed out!');
    void achievements.unlock('gta-bail-out');
    return;
  }
  v.speed = 0;
  v.sim = undefined;
  speakerVehicle = v;
  radio.stop({ keepPlaying: true });
  player.vehicle = null;
  mount = { seq: beginMount('exit', v, { x: player.x, y: player.y, z: player.z }), prev: 'player', pulled: false };
  play('door');
}

/** One frame of the mount sequence: the gnome, its door, a yanked driver, and the vehicle coasting to a stop meanwhile. */
function stepMountFrame(dt: number): void {
  if (!mount) return;
  const { seq, prev } = mount;
  const v = seq.vehicle;
  stepVehicle(v, { throttle: 0, steer: 0, lift: 0 }, dt, world);
  const f = stepMount(seq, dt);
  player.drawMount(f.pose, dt);
  if (f.door) setDoorOpen(v, f.door.pivot, f.door.open);
  if (f.rider && v.rider) {
    v.rider.object.position.set(f.rider.x, f.rider.y, f.rider.z);
    v.rider.object.rotation.z = f.rider.roll;
  }
  if (f.event === 'pulled') {
    mount.pulled = true;
    onYankedOut(v, prev);
  }
  if (f.done) {
    mount = null;
    if (seq.mode === 'exit') {
      onStood(v);
      taxi.onStood(v);
    } else if (taxi.onSeated(v)) boardTaxi(v);
    else takeWheel(v);
  }
}

/** A sequence cut short (the gnome died, or the vehicle blew up): the vehicle goes back to whoever had it. */
function cancelMount(): void {
  if (!mount) return;
  const { seq, prev, pulled } = mount;
  mount = null;
  const v = seq.vehicle;
  if (seq.door !== null) {
    const pivot = doorsOf(v)[seq.door]?.pivot;
    if (pivot) setDoorOpen(v, pivot, 0);
  }
  v.driver = (prev === 'npc' || prev === 'police') && !pulled ? prev : 'none';
}

/** A vehicle shot to pieces: fireball, its driver cracks, and the wreck stays behind charred and burning. */
function blowUp(v: Vehicle): void {
  if (mount?.seq.vehicle === v) cancelMount();
  fx.explode(v.x, v.y + 0.5, v.z);
  // Close by it's the full-screen boom; farther off, world sound (src/sound/watchVehicles.ts) places it in 3D.
  if (v === player.vehicle || Math.hypot(v.x - player.x, v.z - player.z) < 30) play('boom');
  if (Math.hypot(v.x - player.x, v.z - player.z) < 40) chase.shake?.(0.45);
  const out = traffic.ejectDriver(v);
  if (out) {
    fx.crack(out.x, 0.8, out.z, out.look.shirt);
    ambulances.dispatch(out.x, out.z, out.look.shirt);
    stats.cracked++;
  }
  explodeVehicle(v);
  const wasSpeaker = v === speakerVehicle;
  if (wasSpeaker) speakerVehicle = null;
  if (v === player.vehicle || wasSpeaker) radio.stop({ keepPlaying: false });
  watch.addHeat(0.5);
  hud.toast(`${v.spec.name} goes up in flames!`);
  void achievements.unlock('gta-kaboom');
  if (v.kind === 'hoa-van') void achievements.unlock('gta-turf-violator');
}

/** A bullet at (x, y, z): crack whoever it hits. */
function hitTest(x: number, y: number, z: number): boolean {
  const n = npcs.hitTest(x, y, z);
  if (n) {
    const name = n.name;
    ambulances.dispatch(n.x, n.z, n.look.shirt);
    quests.onCracked(n);
    npcs.crack(n, player.x, player.z);
    crackAchievements({ distance: Math.hypot(n.x - player.x, n.z - player.z), zoom: aimZoom(weapons.spec(), aimT) }, achievements);
    stats.cracked++;
    watch.addHeat(HEAT.crackPedestrian);
    void achievements.increment('gta-rainmaker');
    if (Math.random() < 0.5) hud.toast(`${name}: "${pickLine(CRACK_LINES)}"`);
    play('crack');
    return true;
  }
  const o = watch.hitTest(x, y, z);
  if (o) {
    const name = o.name;
    const ox = o.x;
    const oz = o.z;
    if (watch.crack(o)) {
      ambulances.dispatch(ox, oz, o.look.shirt);
      stats.cracked++;
      void achievements.increment('gta-rainmaker');
      hud.toast(`${name}: "Off duty! Permanently!"`);
      play('crack');
    }
    watch.addHeat(HEAT.crackOfficer / 10);
    return true;
  }
  for (const v of vehicles) {
    if (v.driver === 'player' || Math.abs(x - v.x) > v.spec.radius || Math.abs(z - v.z) > v.spec.radius) continue;
    if (Math.hypot(x - v.x, z - v.z) > v.spec.radius * 0.9 || y < v.y || y > v.y + 1 + v.spec.radius * 0.6) continue;
    fx.spark(x, y, z);
    if (!v.exploded) {
      damageVehicle(v, VEHICLE_SHOT_DAMAGE[weapons.gun] * weapons.spec().damage);
      if (v.hp <= 0) blowUp(v);
    }
    return true;
  }
  for (const b of world.dewBarrels ?? []) {
    if (b.blown || Math.hypot(x - b.x, z - b.z) > 1.1 || y > 1.8) continue;
    b.blown = true;
    if (b.mesh) b.mesh.visible = false;
    fx.explode(b.x, b.y, b.z);
    play('boom');
    watch.addHeat(0.35);
    hud.toast('Black Dew barrel detonated!');
    for (const n of npcs.list) {
      const d = Math.hypot(n.x - b.x, n.z - b.z);
      if (d < 8) npcs.knock(n, (n.x - b.x) * 2, 7, (n.z - b.z) * 2, 8, b.x, b.z);
    }
    watch.knockArea?.(b.x, b.z, 8, 12, 7, b.x, b.z);
    for (const v of vehicles) {
      if (!v.exploded && Math.hypot(v.x - b.x, v.z - b.z) < 7) {
        damageVehicle(v, 0.7);
        if (v.hp <= 0) blowUp(v);
      }
    }
    return true;
  }
  const r = remotes.hitTest(x, y, z);
  if (r) {
    net.hit(r.id);
    fx.crack(x, y, z, 0xc9824a);
    play('crack');
    return true;
  }
  if (critters.hitTest(x, y, z)) return true;
  if (destructibles.hitTest(x, y, z)) return true;
  if (world.hitLamp?.(x, y, z, fx, play)) return true;
  return false;
}

// Death: the gnome cracks apart, the screen goes black and white, the camera pans over the body while the ambulance
// comes, then the player wakes at the hospital.
const DEATH_SECONDS = 5.5;
let deathT = 0;
let deathTarget = { x: 0, y: 0, z: 0 };

function crackedUp(): void {
  deathT = DEATH_SECONDS;
  speakerVehicle = null;
  radio.stop({ keepPlaying: false });
  cancelMount();
  if (player.vehicle) {
    const dv = player.vehicle;
    player.exit();
    // A mower I only ride in belongs to its driver: leave it be (the frame drops my seat).
    if (dv.driver === 'player') {
      dv.driver = 'none';
      dv.speed = 0;
      dv.sim = undefined;
    }
  }
  taxi.cancel();
  deathTarget = { x: player.x, y: player.y, z: player.z };
  fx.crack(player.x, player.y + 0.8, player.z);
  ambulances.dispatch(player.x, player.z, myLook.shirt, true);
  player.model.object.visible = false;
  weapons.setVisible(false);
  watch.clear();
  canvas.style.transition = 'filter 0.8s';
  canvas.style.filter = 'grayscale(1) contrast(1.15) brightness(0.9)';
  hud.banner(CRACKED_TEXT, 4200);
  play('player-crack');
  chase.shake?.(0.5);
  void achievements.unlock('gta-washed-out');
}

function wakeAtHospital(): void {
  deathT = 0;
  canvas.style.filter = '';
  const { receipt } = economy.chargeHospital();
  hud.toast(receipt, 6000);
  player.respawn(world.hospital.x, world.hospital.z, world.hospital.yaw);
  player.model.object.visible = true;
  chase.yaw = world.hospital.yaw;
  wasAirborne = false;
  hadChute = false;
  weapons.setVisible(true);
  watch.clear();
}

// ---- Frame loop --------------------------------------------------------------------------------------------------
const aim = new THREE.Vector3();
const muzzle = new THREE.Vector3();
const target = new THREE.Vector3();
let lastHeatLevel = 0;
let questHinted = false;
let handbrakeOn = false;
let driftT = 0;
let fraudCooldown = 0;
let culvertCooldown = 0;
let steamCooldown = 0;
let trailCooldown = 0;
let nearMissStreak = 0;
let routeT = 0;
let route: HudRoute | null = null;
let nearMissResetT = 0;
const nearMissCooldowns = new Map<number, number>();
let last = performance.now();
// The look last sent to the other players (identity: a vehicle's look object changes on every change).
let sentLook: Loadout | null | undefined;

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyT' && !cutscene.active && deathT <= 0 && !player.airborne) {
    if (Math.hypot(player.x - SIDE_VALVE.bay.x, player.z - SIDE_VALVE.bay.z) <= 10) {
      if (garages.isOpen()) garages.closeTuningModal();
      else garages.openTuningModal();
    }
  }
});

/** The clear zones handed to traffic and pedestrians (the playing live scene's), so they are set and cleared once. */
let liveZones: LiveWorld | null = null;
/** Parked vehicles hidden because they stood in a live scene's clear zones; shown again when it ends. */
let liveHidden: Vehicle[] = [];
function syncLiveZones(live: LiveWorld | null): void {
  if (live === liveZones) return;
  liveZones = live;
  traffic.setKeepOut?.(live ? live.zones : null);
  npcs.setKeepOut?.(live ? live.zones : null);
  for (const veh of liveHidden) veh.object.visible = true;
  liveHidden = [];
  if (live) {
    for (const veh of vehicles) {
      if (veh.driver !== 'none' || veh.questOwned || !veh.object.visible) continue;
      if (!live.zones.some((k) => Math.hypot(veh.x - k.x, veh.z - k.z) < k.r + veh.spec.radius)) continue;
      veh.object.visible = false;
      liveHidden.push(veh);
    }
  }
}

/**
 * A live-world cutscene (SceneScript.world, cutscene/liveArea.ts): the ambient world keeps running round the scene,
 * centred on it, while the player stays safe. No Hat Watch, no damage, no guns, no quests, no player physics: only
 * traffic, pedestrians, critters, the sky, world sounds and effects. The player's own vehicle, when the scene drives
 * it, is owned by the scene (questOwned) so traffic leaves it alone.
 */
function liveWorldFrame(dt: number, live: LiveWorld): void {
  // Centred on the camera, so a scene that cuts across town has traffic wherever it looks.
  const cx = camera.position.x;
  const cz = camera.position.z;
  traffic.update(dt, vehicles, world, cx, cz, viewForTraffic());
  npcs.update(dt, world, cx, cz, vehicles);
  // Far away as the "player": no chatter bubbles pop up in a scene's frame.
  ambientGnomes.update(dt, 1e6, 1e6);
  const liveBiome = world.biomeAt(cx, cz);
  atmosphere?.update(dt, cx, cz, liveBiome, false);
  const nightF = atmosphere?.nightFactor() ?? 0;
  critterTime += dt;
  critters.update({
    dt, time: critterTime, playerX: live.x, playerY: heightAt(live.x, live.z), playerZ: live.z, playerVehicle: null,
    playerSpeed: 0, vehicles, world, night: nightF,
  });
  const ambient = vehicles.filter((veh) => !veh.questOwned);
  worldSound.update({
    dt, time: critterTime,
    listener: { x: camera.position.x, z: camera.position.z, yaw: Math.atan2(-camera.matrixWorld.elements[8], -camera.matrixWorld.elements[10]) },
    player: { x: player.x, y: player.y, z: player.z, onFoot: false, grounded: true, airborne: false },
    playerVehicle: null, vehicles: ambient, heat: 0, ambulances: ambulances.sirens(), world,
    critters: critters.list, npcs: npcs.list, biome: liveBiome, night: nightF, timeLabel: atmosphere?.timeLabel() ?? 'Noon',
    district: districtAt(cx, cz), eventKind: null, cutscene: true, shopOpen: false,
  });
  setVehicleHeadlights(ambient, nightF > 0.35, null);
  world.update(dt, cx, cz, nightF);
  fx.update(dt);
  remotes.update(dt);
}

function frame(now: number): void {
  // Never negative: the first rAF timestamp can be older than the performance.now() `last` was seeded with.
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
  last = now;
  if (introTour.active) {
    input.read();
    introTour.update(dt, camera, player);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
    return;
  }
  const rawInp = input.read();
  // A cutscene owns the screen: any key or tap skips it, and the game stands still.
  cutscene.update(dt, camera);
  syncLiveZones(cutscene.active ? (cutscene.live ?? null) : null);
  quests.setMarkersHidden?.(cutscene.active);
  if (cutscene.active) {
    if (cutscene.mode === 'contract' && (rawInp.jump || rawInp.enterExit || rawInp.fire)) cutscene.skip();
    if (liveZones) liveWorldFrame(dt, liveZones);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
    return;
  }
  // Dead: no controls; the camera pans slowly round the body instead.
  const inpBase = deathT > 0
    ? { ...rawInp, moveX: 0, moveY: 0, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false, reload: false,
        camYaw: dt * 0.5, camPitch: (0.75 - chase.pitch) * dt * 0.9 }
    // Mid-sequence the gnome is busy getting in or out: no driving, no walking, no second enter.
    : mount
      ? { ...rawInp, moveX: 0, moveY: 0, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false, reload: false }
    // In the Turfton Taxi: Mabel drives, the gnome sits (the camera still orbits).
    : taxi.riding()
      ? { ...rawInp, moveX: 0, moveY: 0, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false, reload: false, boost: false, horn: false, radio: false, banger: false }
    // The Pay 'n' Glaze shop or the tuning garage is open: the controls are held (the camera still orbits by drag).
    : garages.isOpen() || gunStore.isOpen()
      ? { ...rawInp, moveX: 0, moveY: 0, lift: 0, jump: false, fire: false, enterExit: false, boost: false }
      : rawInp;
  // ?autopilot (demos, scripted checks): a racing driver takes the wheel at the Speedway (raceTrack/autopilot.ts).
  const inp = deathT > 0 || mount || garages.isOpen() ? inpBase : autopilotInput(inpBase, player.vehicle);
  if (deathT > 0) {
    deathT -= dt;
    if (deathT <= 0) wakeAtHospital();
  }
  const hpBefore = player.health;

  // Mid-sequence: the gnome walks, climbs or is pulled out (mount.ts) and nothing else runs for it.
  stepMountFrame(dt);

  // A ride ends when its mower goes (the driver got out or left): step out where I sit.
  syncSeats();
  if (riding && !(player.vehicle && player.vehicle.driver === 'remote' && remotes.isRemoteDriven(player.vehicle))) leaveRide();

  // Enter / exit (no getting in or out while falling). Vehicles take priority when closer than a quest giver.
  const near = mount || player.vehicle || (player.airborne || player.ragdolling) ? null : nearestVehicle();
  // A remote player's mower with a free seat, when nothing of mine is closer: E asks to ride.
  const rideTarget = near || mount || player.vehicle || (player.airborne || player.ragdolling) || deathT > 0 ? null : remotes.nearestRide(player.x, player.z, PLAYER.enterRange);
  const nearDist = near ? Math.hypot(near.x - player.x, near.z - player.z) - (near.spec.radius - 1) : Infinity;
  const giverPrompt = mount || player.vehicle || (player.airborne || player.ragdolling) || deathT > 0 ? null : quests.prompt(player.x, player.z);
  const giverDist = giverPrompt ? (quests.giverDist?.(player.x, player.z) ?? 0) : Infinity;
  const preferVehicle = !!near && nearDist <= giverDist;
  const garagePrompt = mount || player.vehicle || (player.airborne || player.ragdolling) || deathT > 0 ? null : garages.prompt(player);
  const buff = interactables.update(dt, player);
  const interPrompt = mount || player.vehicle || (player.airborne || player.ragdolling) || deathT > 0 ? null : interactables.prompt(player);
  const gunPrompt = mount || player.vehicle || (player.airborne || player.ragdolling) || deathT > 0 ? null : gunStore.prompt(player);
  if (inp.enterExit && !(player.airborne || player.ragdolling)) {
    if (player.vehicle) getOut();
    else if (preferVehicle && near) getIn(near);
    else if (giverPrompt) quests.interact(player.x, player.z);
    else if (garagePrompt?.startsWith('Tune')) garages.openTuningModal();
    else if (gunPrompt) gunStore.interact(player);
    else if (interPrompt) interactables.interact(player);
    else if (near) getIn(near);
    else if (rideTarget) askRide(rideTarget);
  }
  if (inp.radio && player.vehicle) {
    radio.cycle();
    if (player.vehicle.driver === 'player') net.setRadio(radio.station);
  }
  if (inp.banger && player.vehicle) {
    const info = radio.currentSong();
    if (info && net.sendBanger(info.station, info.songIndex)) {
      hud.toast(`🔥 "Yeah, this is a banger!" — "${info.title}"`, 4500);
    }
  }
  if (inp.switchGun && !player.vehicle && !(player.airborne || player.ragdolling)) {
    weapons.switchGun();
    hud.toast(GUNS[weapons.gun].name);
  }

  // Move the player: on foot, in a vehicle, or falling / under a parachute.
  const v = player.airborne ? null : player.vehicle;
  // Shop open: the car it is shown on stays parked.
  if (garages.isOpen()) {
    if (v) v.speed = 0;
    if (showroomVehicle) showroomVehicle.speed = 0;
  }
  if (mount) {
    // Drawn by stepMountFrame above.
  } else if (player.ragdolling) {
    // Thrown from a moving vehicle or hit by one (bail.ts): tumble, then get up.
    player.updateRagdoll(dt, world);
    if (!player.ragdolling) weapons.setVisible(true);
    setEngine(false, 0, false);
    setSkid(0);
  } else if (player.airborne) {
    player.updateAir(inp, chase.yaw, dt, world);
    if (player.chute > 0.5) hadChute = true;
    setEngine(false, 0, false);
  } else if (v) {
    // A passenger does not drive: the mower belongs to its remote driver and moves with their pose.
    // Boost and horn are the driver's; a passenger's presses do nothing to the mower.
    const wantBoost = v.driver === 'player' && !!inp.boost && !v.spec.flies && !v.exploded && (v.boost ?? 100) > 8;
    if (wantBoost) {
      if (!v.boostActive) play('boost');
      v.boostActive = true;
      v.boost = Math.max(0, (v.boost ?? 100) - 38 * dt);
      fx.boostFlame?.(v.x, v.y, v.z, v.yaw);
    } else {
      v.boostActive = false;
      v.boost = Math.min(100, (v.boost ?? 100) + 6 * dt);
    }
    if (v.driver === 'player' && inp.horn && (v.hornCooldown ?? 0) <= 0) {
      v.hornCooldown = 0.55;
      playHorn(v.kind, v.look?.horn);
      const yell = npcs.reactToHorn?.(v.x, v.z);
      if (yell) hud.toast(yell, 3000);
    }
    if (v.driver === 'remote') { /* nothing to step here */ }
    else if (v === taxi.vehicle() && taxi.riding()) { /* the taxi drives itself (taxi.ts) */ }
    else if (stageHome) { /* parked on the Pay 'n' Glaze stage: no driving, and no world edge to clamp it back */ }
    else if (v.sim) {
      if (stepSimDrive(v, v.sim, inp, dt, world)) hud.toast(`${v.spec.name}: back on its wheels.`);
      checkSink(v);
      // Handbrake sounds on the edge; the squeal follows rear-tyre slip (angle, or a locked wheel).
      const pulled = inp.lift > 0;
      if (pulled !== handbrakeOn) play(pulled ? 'handbrake' : 'handbrake-release');
      handbrakeOn = pulled;
      const t = v.sim.ctrl.telemetry;
      const rear = [t.wheels[2], t.wheels[3]];
      const slip = Math.max(...rear.map((w) => Math.max(Math.abs(w.slipAngleRad) / 0.25, Math.abs(w.slipRatio) / 0.5)));
      setSkid(t.speed > 2 ? Math.min(1, Math.max(0, slip - 0.5) * 1.5) : 0);
      // Tail out (rear tyres well past grip) and the body angled to its travel, for a full second at speed: a proper slide.
      // Reachable in Casual with the Zero-Turn and the handbrake; easier in the looser modes.
      driftT = t.speed > 6 && Math.abs(t.sideslip) > 0.2 && slip > 1.2 ? driftT + dt : 0;
      if (driftT > 1) { driftT = -1e9; void achievements.unlock('gta-drifter'); }
    }
    else stepVehicle(v, { throttle: inp.moveY, steer: inp.moveX, lift: inp.lift }, dt, world);
    if (v.sunk && v.driver === 'player') {
      // Drove into deep water: the mower conks out and sinks (swim.ts); the gnome bobs up beside it.
      hud.toast(`${v.spec.name} conked out and sank. It will turn up again later.`);
      play('bump');
      v.driver = 'none';
      v.speed = 0;
      v.sim = undefined;
      speakerVehicle = v;
      radio.stop({ keepPlaying: false });
      player.exit();
      input.refresh();
      weapons.setVisible(true);
    }
    if (!v.spec.flies && aboveGround(v.x, v.y, v.z) <= 0.15 && Math.abs(v.speed) > 7) {
      trailCooldown -= dt;
      if (trailCooldown <= 0) {
        trailCooldown = 0.09;
        const surf = surfaceAt(v.x, v.z, world, v.kind);
        if (surf.trailKind !== 'none') fx.trail?.(v.x, heightAt(v.x, v.z) + 0.12, v.z, surf.trailKind);
      }
    }
    if (v.driver === 'player' && v.kind === 'lowrider' && inp.jump && hopLowrider(v)) {
      play('bump');
      npcs.cheerAt?.(v.x, v.z);
    }
    if (v.driver === 'player' && v.kind === 'boot-float' && inp.fire && (v.hornCooldown ?? 0) <= 0) {
      v.hornCooldown = 1.2;
      fx.confetti(v.x, v.y + 1.4, v.z);
      play('whistle');
      for (const n of npcs.list) {
        if (Math.hypot(n.x - v.x, n.z - v.z) < 12) npcs.scare(n, v.x, v.z);
      }
    }
    if (v.driver === 'player' && v.kind === 'mulch-spreader' && inp.fire) dropMulchSlick(scene, v);
    player.updateRiding(dt, updateRiderLean(v, dt));
    setEngine(true, Math.abs(v.speed) / v.spec.maxSpeed, v.spec.flies, v.spec.kind === 'plane', { throttle: v.driver === 'player' ? inp.moveY : 0, spec: v.spec });
  } else {
    player.updateFoot(inp, chase.yaw, dt, world);
    if (buff.speedMult > 1 && Math.hypot(inp.moveX, inp.moveY) > 0.1) {
      player.updateFoot(inp, chase.yaw, dt * (buff.speedMult - 1), world);
    }
    setEngine(false, 0, false);
    setSkid(0);
    handbrakeOn = false;
    driftT = 0;
  }

  if (wasAirborne && !player.airborne) {
    // Landed: the gun comes back, and a canopy-borne landing is a soft one.
    weapons.setVisible(true);
    if (hadChute) void achievements.unlock('gta-skydiver');
    hadChute = false;
  }
  wasAirborne = player.airborne;

  if (v && v.kind === 'plane' && v.y > 5 && !piloted) {
    piloted = true;
    void achievements.unlock('gta-pilot');
  }

  // While the Pay 'n' Glaze shop is open the vehicle is parked on the showroom stage, far off the map: the world simulation
  // (traffic, gnomes, quests, weather, the Hat Watch) keeps running around the place the player actually left.
  const simX = stageHome ? stageHome.x : player.x;
  const simY = stageHome ? stageHome.y : player.y;
  const simZ = stageHome ? stageHome.z : player.z;

  // Biomes: a toast and an explorer count the first time each one is entered.
  const nowBiome = world.biomeAt(simX, simZ);
  if (nowBiome !== biome) {
    biome = nowBiome;
    hud.toast('Entering ' + BIOME_NAMES[biome]);
    if (!visitedBiomes.has(biome)) {
      visitedBiomes.add(biome);
      void achievements.increment('gta-explorer');
    }
  }

  // Everyone else.
  traffic.update(dt, vehicles, world, simX, simZ, viewForTraffic());
  updateMulchSlicks(dt, vehicles);
  stepCoasting(vehicles, dt, world);
  collideVehicles(vehicles, dt);
  stepKnock(vehicles, dt, world);
  for (const veh of vehicles) syncVehicleMesh(veh, dt);
  npcs.update(dt, world, simX, simZ, vehicles);

  const b = world.base;
  const inBase = simX > b.minX && simX < b.maxX && simZ > b.minZ && simZ < b.maxZ;
  if (inBase && !stats.trespassed) {
    stats.trespassed = true;
    watch.addHeat(HEAT.trespass);
    hud.banner('FORT SANDPIT: TRESPASSER');
    play('alarm');
  }
  if (!inBase) stats.trespassed = false;

  const damage = watch.update(dt, { playerX: simX, playerY: simY, playerZ: simZ, playerVehicle: v }, world);
  if (damage > 0) player.hurt(damage);
  const level = Math.floor(watch.heat);
  if (level > lastHeatLevel) {
    play('whistle');
    if (level >= 1) radio.news(`heat-${Math.min(4, level)}`);
    if (level === 4) {
      hud.banner('HOA ENFORCEMENT', 3000);
      hud.toast('4-Hat HOA Enforcement! Watch out for the HOA Van!', 4500);
    } else {
      hud.toast(level === 1 ? 'The Hat Watch has noticed you.' : `Hat Watch level ${level}!`);
    }
    if (level >= 3) void achievements.unlock('gta-three-hats');
  }
  lastHeatLevel = level;

  // Guns: on foot or driving, bullets fly from the crosshair along the camera's aim. No firing while falling.
  chase.aimDir(aim);
  // The gun pose (gunHold.ts): lowered at the ready on foot, along the camera's aim while aiming or firing.
  const gunOnFoot = !v && !mount && !player.swimming && deathT <= 0;
  if (gunOnFoot) weapons.poseArms(player.model, aimT > 0.05 || !!inp.fire, Math.asin(THREE.MathUtils.clamp(aim.y, -1, 1)));
  else weapons.relaxArms(player.model);
  player.muzzle(muzzle);
  if (gunOnFoot) weapons.muzzleWorld(muzzle);
  const firing = inp.fire;
  const reloadWasOn = weapons.reloading;
  if (inp.reload) weapons.reload();
  const ammoBefore = weapons.ammo;
  // Aim down sights on foot only: the camera pulls in, the spread tightens, scopes zoom further (gunMods.ts AIM).
  const canAim = !v && !player.airborne && !player.ragdolling && !player.swimming && deathT <= 0 && !mount && !garages.isOpen() && !gunStore.isOpen();
  aimT = stepAim(aimT, (!!inp.aim || aimHold) && canAim, dt);
  const gunSpec = weapons.spec();
  weapons.setAim(aimT);
  chase.setAim(aimT, aimZoom(gunSpec, 1));
  aimHud.update(aimT, aimZoom(gunSpec, 1), !!gunSpec.loadout.optic);
  const canFire = firing && !player.airborne && !player.ragdolling && !player.swimming && v?.kind !== 'boot-float' && v?.kind !== 'mulch-spreader';
  weapons.update(dt, canFire, muzzle, camera.position, aim, hitTest, world, {
    npcs, vehicles, traffic, watch, onBlowUp: blowUp, onToast: (t) => hud.toast(t), onPlay: play,
  });
  if (weapons.ammo < ammoBefore) {
    const shot = weapons.spec();
    playGunShot(weapons.gun, shot.sound);
    shotAchievements(shot.sound, achievements);
    chase.kick(shot.recoil);
  }
  if (weapons.reloading && !reloadWasOn) play('reload');
  for (const w of vehicles) {
    if (!w.exploded || Math.hypot(w.x - player.x, w.z - player.z) > 160) continue;
    fx.fire(w.x, w.y + 0.5, w.z, w.spec.radius);
    fx.fire(w.x, w.y + 0.8, w.z, w.spec.radius * 0.6);
  }
  quests.update(dt, simX, simZ);
  const taxiEvent = taxi.update(dt);
  if (taxiEvent === 'jump' && player.vehicle) chase.yaw = player.vehicle.yaw;
  else if (taxiEvent === 'dropoff' && player.vehicle && player.vehicle === taxi.vehicle()) getOut();
  // The route to the waypoint (an objective, or a giver pinned in the journal), along the roads, re-planned twice a second.
  routeT -= dt;
  if (routeT <= 0) {
    routeT = 0.5;
    const wp = quests.waypoint();
    route = wp ? { points: roadRoute(world.roads, { x: simX, z: simZ }, wp), color: wp.color } : null;
  }
  if (route) route.points[0] = { x: simX, z: simZ };
  vibeNpcs.update(dt, simX, simZ, v);
  easterEggs.update(dt, player, vehicles);
  worldDetails.update(dt, simX, simZ);
  ambientGnomes.update(dt, simX, simZ);
  garages.update(dt, player, watch);
  gunStore.update(dt);
  culvertCooldown = Math.max(0, culvertCooldown - dt);
  steamCooldown = Math.max(0, steamCooldown - dt);
  if (!player.airborne && deathT <= 0 && culvertCooldown <= 0 && (!v || !v.spec.flies)) {
    const dtDist = Math.hypot(player.x - CULVERT_PORTALS.downtown.x, player.z - CULVERT_PORTALS.downtown.z);
    const cnDist = Math.hypot(player.x - CULVERT_PORTALS.canal.x, player.z - CULVERT_PORTALS.canal.z);
    if (dtDist <= 4.5 || cnDist <= 4.5) {
      culvertCooldown = 4;
      const dest = dtDist <= 4.5 ? CULVERT_PORTALS.canal : CULVERT_PORTALS.downtown;
      const nx = dest.x + 6;
      const nz = dest.z + 6;
      if (v) {
        v.x = nx; v.z = nz; v.speed *= 0.4;
        syncVehicleMesh(v, 0);
        player.updateRiding(0, 0);
      } else {
        player.respawn(nx, nz, player.yaw);
      }
      play('door');
      hud.toast('Under-Deck Culvert: shortcut through the storm drain!');
    }
  }
  if (v && !v.spec.flies && steamCooldown <= 0 && Math.hypot(v.x - (-255), v.z - (-60)) <= 7) {
    steamCooldown = 2.5;
    if (!hopLowrider(v)) v.vy = Math.max(v.vy, 9);
    fx.airBlast(-255, 0.5, -60, 0, 0);
    play('bump');
    hud.toast('Compost Steam Vent!');
  }
  fraudCooldown = Math.max(0, fraudCooldown - dt);
  if (!v && !player.airborne && !player.ragdolling && deathT <= 0 && fraudCooldown <= 0) {
    for (const veh of vehicles) {
      if (veh.driver !== 'npc' || Math.abs(veh.speed) <= 4) continue;
      const dx = player.x - veh.x;
      const dz = player.z - veh.z;
      const dist = Math.hypot(dx, dz);
      if (dist <= veh.spec.radius + PLAYER.radius + 0.3) {
        fraudCooldown = 2;
        const nx = dist > 0.01 ? dx / dist : 1;
        const nz = dist > 0.01 ? dz / dist : 0;
        player.x += nx * 0.8;
        player.z += nz * 0.8;
        player.hurt(0.12);
        // A proper hit (not a nudge) knocks the gnome flat: thrown along the vehicle's travel and up, then it gets up.
        const hitSpeed = Math.abs(veh.speed);
        if (hitSpeed > 8) {
          const dir = Math.sign(veh.speed) || 1;
          const f = Math.min(hitSpeed, 25);
          player.ragdoll(Math.sin(veh.yaw) * dir * f * 0.8 + nx * 2, 3 + f * 0.3, Math.cos(veh.yaw) * dir * f * 0.8 + nz * 2);
          weapons.setVisible(false);
        }
        play('bump');
        const payout = economy.onPlayerRagdollImpact(Math.abs(veh.speed), player.x, player.z);
        if (payout > 0) hud.toast(`KILN-SHIELD FRAUD: +${payout} Acorns!`, 4000);
        break;
      }
    }
  }
  fx.update(dt);
  ambulances.update(dt, simX, simZ);
  const stuntRes = stunts.update(dt, player, vehicles);
  if (stuntRes.jumpJustLanded) {
    chase.shake?.(0.28);
    npcs.cheerAt?.(player.x, player.z);
    if (v) v.boost = Math.min(100, (v.boost ?? 100) + 35);
  }
  destructibles.update(dt, player, vehicles);
  vending.update(dt, vehicles);
  world.updateLamps?.(dt, vehicles, simX, simZ, fx, play);
  encounters.update(dt, player, vehicles);

  // Near-miss detector: threading past moving NPC traffic at high speed awards Acorns & boost.
  if (nearMissResetT > 0) {
    nearMissResetT -= dt;
    if (nearMissResetT <= 0) nearMissStreak = 0;
  }
  for (const [id, cd] of nearMissCooldowns) {
    if (cd - dt <= 0) nearMissCooldowns.delete(id);
    else nearMissCooldowns.set(id, cd - dt);
  }
  if (v && !v.spec.flies && aboveGround(v.x, v.y, v.z) <= 0.5 && Math.abs(v.speed) >= 18) {
    for (const ov of vehicles) {
      if (ov === v || ov.driver !== 'npc' || ov.exploded || nearMissCooldowns.has(ov.id)) continue;
      const d = Math.hypot(v.x - ov.x, v.z - ov.z);
      const minGap = v.spec.radius + ov.spec.radius;
      if (d > minGap && d < minGap + 2.4) {
        nearMissCooldowns.set(ov.id, 4);
        nearMissStreak++;
        nearMissResetT = 4.5;
        const bonus = 15 * Math.min(4, nearMissStreak);
        economy.earn(bonus, 'Near Miss');
        v.boost = Math.min(100, (v.boost ?? 100) + 12);
        hud.callout?.('NEAR MISS!', nearMissStreak > 1 ? `x${nearMissStreak} (+${bonus} Acorns)` : `+${bonus} Acorns`);
        break;
      }
    }
  }

  atmosphere?.update(dt, simX, simZ, biome, player.airborne || !!v?.spec.flies);
  const nightF = atmosphere?.nightFactor() ?? 0;
  raceTrack.update(dt, v && !stageHome ? v : null, simX, simZ, nightF);
  critterTime += dt;
  const footSpeed = v || dt <= 0 ? 0 : Math.hypot(player.x - lastFootX, player.z - lastFootZ) / dt;
  lastFootX = player.x;
  lastFootZ = player.z;
  critters.update({
    dt, time: critterTime, playerX: player.x, playerY: player.y, playerZ: player.z, playerVehicle: player.vehicle,
    playerSpeed: Math.min(30, footSpeed), vehicles, world, night: nightF,
  });
  worldSound.update({
    dt, time: critterTime, listener: { x: simX, z: simZ, yaw: chase.yaw },
    player: { x: player.x, y: player.y, z: player.z, onFoot: !player.vehicle && !mount, grounded: player.grounded, airborne: player.airborne },
    playerVehicle: player.vehicle, vehicles, heat: Math.floor(watch.heat), ambulances: ambulances.sirens(), world,
    critters: critters.list, npcs: npcs.list, biome, night: nightF, timeLabel: atmosphere?.timeLabel() ?? 'Noon',
    district: districtAt(simX, simZ), eventKind: worldEvents.activeEvent()?.kind ?? null, cutscene: cutscene.active,
    shopOpen: garages.isOpen(),
  });
  setVehicleHeadlights(vehicles, nightF > 0.35, lightsPreview ? showroomVehicle : null);
  world.update(dt, simX, simZ, nightF);
  stepIdleBoats(vehicles, dt, world);
  boatTraffic.update(dt, player, Math.floor(watch.heat));
  wakes.update(dt, vehicles);
  stepSunk(vehicles, dt, simX, simZ, repairVehicle);
  remotes.update(dt);
  hurtTimer = Math.max(0, hurtTimer - dt);
  const chuteOpen = player.airborne && player.chute > 0.5;
  net.setPose({
    x: simX, y: v ? simY : player.y, z: simZ, yaw: v ? v.yaw : player.yaw,
    veh: v ? VEHICLE_CODES.indexOf(v.kind) : -1, tint: v ? v.tint : 0,
    moving: Math.abs(inp.moveX) + Math.abs(inp.moveY) > 0.1, aiming: firing && !v, hurt: hurtTimer > 0,
    chute: chuteOpen, ride: riding,
  });
  // The look the player drives in goes out to the other players (a stock look sends nothing).
  const look = v && v.driver === 'player' && v.look && !isStockLoadout(v.look) ? v.look : null;
  if (look !== sentLook) {
    net.setLook(look ? encodeLoadout(look) : null);
    sentLook = look;
  }
  // The gun I hold and its Ammu-Gnation mods (net.ts sends it only when it changes).
  net.setGun(encodeGunWire(weapons.gun, weapons.loadoutOf(weapons.gun)));

  if (player.health < hpBefore && player.health > 0) {
    play('gnome-hit');
    chase.shake?.(0.14);
  }
  if (player.health <= 0 && deathT <= 0) crackedUp();

  // Camera.
  const mode: CameraMode = player.airborne ? 'chute' : v ? (v.spec.flies ? 'fly' : 'drive') : 'foot';
  input.setMode(mode);
  const enterLabel = mount ? null : v ? 'Exit' : preferVehicle && near ? enterVerb(near) : giverPrompt ? 'Enter' : garagePrompt?.startsWith('Tune') ? 'Tune' : gunPrompt ? 'Shop' : near ? enterVerb(near) : rideTarget ? 'Ride' : null;
  input.setEnterLabel(enterLabel);
  if (v) target.set(v.x, v.y, v.z);
  else if (deathT > 0) target.set(deathTarget.x, deathTarget.y, deathTarget.z);
  else target.set(player.x, player.y, player.z);
  // ?showcase=<seconds> (demos): after the shop closes, keep a close orbit on the driven vehicle for that long while it drives.
  if (garages.isOpen()) showcaseSeen = true;
  if (showcaseLeft > 0 && showcaseSeen && !garages.isOpen() && v && !v.spec.flies) {
    showcaseLeft -= dt;
    chase.showroom(showcaseLeft > 0 ? { x: v.x, y: v.y, z: v.z, radius: v.spec.radius, centered: true, distance: 3.6 } : null);
  }
  chase.update(dt, target, v ? v.yaw : player.yaw, mode, inp, world, { boost: !!v?.boostActive, airborne: stuntRes.airborne });

  worldEvents.update(dt, player, cutscene.active);
  tessieWorld.update(dt, player, cutscene.active);
  if (!player.vehicle) {
    if (speakerVehicle && (speakerVehicle.exploded || (!vehicles.includes(speakerVehicle) && !remotes.isRemoteDriven(speakerVehicle)))) {
      speakerVehicle = null;
    }
    let bestSpeaker: { x: number; y: number; z: number; station: (typeof STATIONS)[number]['id'] } | null = null;
    let bestDist = SPEAKER_MAX_DIST;
    if (speakerVehicle && radio.station) {
      const d = Math.hypot(speakerVehicle.x - player.x, speakerVehicle.y - player.y, speakerVehicle.z - player.z);
      if (d < bestDist) {
        bestDist = d;
        bestSpeaker = { x: speakerVehicle.x, y: speakerVehicle.y, z: speakerVehicle.z, station: radio.station };
      }
    }
    const remoteSpeaker = remotes.nearestRadioVehicle(player.x, player.y, player.z, bestDist);
    if (remoteSpeaker) {
      bestSpeaker = { x: remoteSpeaker.x, y: remoteSpeaker.y, z: remoteSpeaker.z, station: remoteSpeaker.station };
    }
    radio.setListener({ x: player.x, y: player.y, z: player.z, yaw: chase.yaw }, bestSpeaker);
  }
  radio.update(dt);
  // HUD.
  const blips: Blip[] = [
    { x: whirligig.x, z: whirligig.z, color: '#ff4fd8', kind: 'whirligig', label: 'The Whirligig' },
    ...placeBlips(),
    { x: PAY_N_GLAZE.bay.x, z: PAY_N_GLAZE.bay.z, color: '#ff3b9a', kind: 'glaze', label: "Pay 'n' Glaze" },
    ...raceTrack.blips(),
    gunStore.blip,
  ];
  for (const veh of vehicles) {
    if (veh.driver !== 'none' || veh === whirligig) continue;
    blips.push({ x: veh.x, z: veh.z, color: veh.kind === 'plane' ? '#ffffff' : '#ffd23f' });
  }
  blips.push(...quests.blips(), ...vibeNpcs.blips(), ...easterEggs.blips(), ...worldEvents.blips(), ...tessieWorld.blips(), ...stunts.blips(), ...encounters.blips(), ...taxi.blips());
  if (!questHinted && performance.now() > 4000) {
    questHinted = true;
    const hint = quests.hint();
    if (hint) hud.toast(hint, 8000);
  }
  // Other online players: dots on the minimap (pinned to its rim when far off) and names on the big map. Off in Options.
  if (getMapPlayers()) for (const r of remotes.blips()) blips.push({ x: r.x, z: r.z, color: '#7cf0ff', player: true, label: r.name });
  const econ = economy.state();
  const distId = districtAt(simX, simZ);
  hud.set({
    heat: level,
    health: player.health,
    ammo: weapons.ammo, mag: weapons.mag, reloading: weapons.reloading,
    gun: GUNS[weapons.gun].name,
    altitude: player.airborne ? player.y : v && v.spec.flies ? v.y : null,
    speed: v ? Math.round(Math.abs(v.speed)) : null,
    chute: chuteOpen,
    biome: BIOME_NAMES[biome],
    district: distId ? DISTRICT_NAMES[distId] : null,
    timeLabel: atmosphere?.timeLabel(),
    boost: v && !v.spec.flies ? (v.boost ?? 100) : null,
    buff: buff.buffLabel,
    stunts: { done: stunts.completedCount(), total: stunts.totalCount() },
    vehicle: v ? v.spec.name : null,
    cracked: stats.cracked,
    acorns: econ.acorns,
    debt: econ.debtRemaining,
    prompt: preferVehicle && near ? `${enterVerb(near)} ${near.spec.name}` : giverPrompt ?? garagePrompt ?? gunPrompt ?? interPrompt ?? (near ? `${enterVerb(near)} ${near.spec.name}` : rideTarget ? `Ride ${rideTarget.name}'s ${rideTarget.vehicle.spec.name}` : null),
    player: { x: simX, z: simZ, yaw: v ? (stageHome ? stageHome.yaw : v.yaw) : player.yaw },
    blips,
    route,
    online: onlineText,
  });

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// Options > Cheats > Driving realism. Picking a mode rebuilds the chassis of the vehicle being driven, keeping its place, heading and speed.
function refreshDriving(): void {
  const pv = player.vehicle;
  if (pv && !pv.spec.flies && !pv.spec.boat) pv.sim = simActive() ? createSimDrive(pv) : undefined;
  input.refresh();
}
// The Steam Controller button lives in the settings menu, under Controls (it only shows when a Steam Controller is in use).
const optionsSlot = createOptions(
  ui,
  (t) => {
    setTune(t.id);
    refreshDriving();
    hud.toast(`Driving realism: ${t.name}`);
  },
  (mode) => {
    atmosphere?.setMode(mode);
    hud.toast(`Time of day: ${mode}`);
  },
);
mountSteamConnect(optionsSlot, { inline: true });

// ?mount (or ?mount=push-bike|zero-turn|combine): start already driving that parked vehicle, a ride-on by default, at the south end of the x = 0 road (for demos and scripted checks).
// ?mountat=x,z[,yaw] (with ?mount): the same, at that spot instead (a boat on the river, say), creating the vehicle there if none is parked.
// ?herd: stand a crowd of townsgnomes ahead of the player (on the road ahead of the mower with ?mount), for the ragdoll demo.
// ?glaze=<json> (with ?mount): a URL-encoded Loadout patch applied to the mounted vehicle once at start, e.g. ?glaze=%7B%22spoiler%22%3A%22picket%22%7D (Pay 'n' Glaze demos). Bad JSON is ignored.
// ?shop (with ?mount): open the Pay 'n' Glaze shop on the mounted vehicle right after start (for the demo recording).
const startParams = new URLSearchParams(location.search);
// Demos (Ammu-Gnation): ?gunfit=<encodeGunWire code> owns, fits and holds that modded gun; ?gunshop stands the gnome at the
// counter and opens the shop; ?aimhold keeps aiming down sights on.
const aimHold = startParams.has('aimhold');
{
  const fit = decodeGunWire(startParams.get('gunfit') ?? '');
  if (fit) {
    buyMods(fit.gun, loadoutIds(fit.loadout));
    fitLoadout(fit.gun, fit.loadout);
    weapons.selectGun(fit.gun);
  }
}
if (startParams.has('mount')) {
  const kind = startParams.get('mount') || 'ride-on';
  const at = startParams.get('mountat')?.split(',').map(Number).filter(Number.isFinite);
  const spot = at && at.length >= 2 ? { x: at[0], z: at[1], yaw: at[2] ?? 0 } : null;
  let m: Vehicle | undefined = spot
    ? vehicles.find((x) => x.kind === kind && x.driver === 'none')
    : vehicles.find((x) => x.kind === kind) ?? vehicles.find((x) => x.kind === 'ride-on');
  if (spot && !m) {
    m = createVehicle(scene, kind as VehicleKind, spot.x, spot.z, spot.yaw);
    vehicles.push(m);
  }
  if (spot && m) {
    m.x = spot.x; m.z = spot.z; m.yaw = spot.yaw;
    syncVehicleMesh(m, 0);
  } else if (m) {
    m.x = 0; m.z = startParams.has('herd') ? -100 : -115; m.yaw = 0;
  }
  if (m) {
    player.respawn(m.x + 2, m.z, m.yaw);
    // Debug start: seated at once, no sequence.
    m.driver = 'player';
    takeWheel(m);
    chase.yaw = m.yaw;
    const glazeParam = startParams.get('glaze');
    if (glazeParam && m.rig) {
      try {
        const patch = JSON.parse(glazeParam) as Partial<Loadout>;
        setVehicleLook(m, normalizeLoadout({ ...defaultLoadout(m.tint), ...patch }));
        refreshDriving(); // the chassis was built before the look: rebuild it so the ride height reaches the sim
      } catch {
        // Not JSON: the mower keeps its look.
      }
    }
    // ?acorns=<n> (with ?mount): the wallet starts with n more Acorns, so a demo can buy things.
    const gift = Number(startParams.get('acorns'));
    if (Number.isFinite(gift) && gift > 0) economy.earn(gift, 'demo');
    if (startParams.has('shop')) garages.openGlaze(m);
  }
}
// ?pileup (with ?mount): park a push-bike, a ride-on and a zero-turn in a loose group on the road ahead, to shove around (bump demo).
if (startParams.has('pileup')) {
  const spots: [VehicleKind, number, number][] = [['push-bike', 0.6, -78], ['ride-on', 3.2, -66], ['push-bike', -2.2, -62], ['zero-turn', 0.8, -50]];
  const used = new Set<Vehicle>();
  for (const [kind, x, z] of spots) {
    const pv = vehicles.find((q) => q.kind === kind && q.driver === 'none' && !used.has(q));
    if (!pv) continue;
    used.add(pv);
    pv.x = x; pv.z = z; pv.yaw = (x * 7 + z) % 3;
    syncVehicleMesh(pv, 0);
  }
}
// ?mountdemo[=ride-on|van|yank] (demo stage, docs/demos.md): the player stands on open ground facing a parked mower
// (ride-on, the default), a van with doors (van), or a mower whose driver is yanked out (yank).
const mountDemo = startParams.get('mountdemo');
if (mountDemo !== null) {
  player.respawn(0, -2.2, 0);
  if (mountDemo === 'yank') {
    const zt = createVehicle(scene, 'zero-turn', 0, 0, 0, MOWER_TINTS[2]);
    vehicles.push(zt);
    // A police driver: the police only drive their cars during a pursuit, so this one waits where it was put.
    zt.driver = 'police';
    zt.rider = createGnomeModel(DEFAULT_LOOK);
    zt.riderLook = DEFAULT_LOOK;
    zt.object.add(zt.rider.object);
  } else {
    vehicles.push(createVehicle(scene, mountDemo === 'van' ? 'hoa-van' : 'ride-on', 0, 0, 0, MOWER_TINTS[1]));
  }
}
if (startParams.has('herd')) {
  // A crowd across the road ahead of the player (the camera's heading, or the mower's with ?mount).
  const s = Math.sin(chase.yaw), c = Math.cos(chase.yaw);
  for (let i = 0; i < 15; i++) {
    const fwd = 14 + Math.floor(i / 5) * 5, side = (i % 5) * 1.5 - 3 + (Math.floor(i / 5) % 2) * 0.7;
    const g = npcs.spawnFleeing(player.x + s * fwd + c * side, player.z + c * fwd - s * side, player.x, player.z, null);
    g.state = 'idle';
    g.fleeTime = 0;
    g.calm = true;
    clearHandsUp(g.model);
  }
}

// Dev: ?at=x,z[,yaw] starts the player there, on the ground (e.g. ?terrain=hill&at=500,30,1.57 at the test hill).
const at = startParams.get('at')?.split(',').map(Number);
if (at && at.length >= 2 && at.every(Number.isFinite)) {
  player.respawn(at[0], at[1], at[2] ?? 0);
  chase.yaw = at[2] ?? 0;
}
// Demo: ?tessie=surface surfaces Tessie in the loch near the player, quest or not (the quest only reacts to ?tessie=now).
if (startParams.has('gunshop')) {
  player.respawn(199, -30, Math.PI / 2);
  chase.yaw = Math.PI / 2;
  setTimeout(() => gunStore.interact(player), 1200);
}
if (startParams.get(TESSIE.devParam) === 'surface') setTimeout(() => tessieWorld.demoSurface(player.x, player.z), 2500);

// Scripted scenes: ?cutscene=<id> plays one (cutscene/scenes/index.ts). ?cutscenecheck runs the line-of-sight and collision check.
const sceneId = startParams.get('cutscene');
if (sceneId) {
  const script = SCENES[sceneId];
  if (script) {
    setTimeout(() => cutscene.play({ kind: 'script', script }, () => hud.toast(`Scene "${sceneId}" done`, 3000), {
      onTrigger: (n, a) => { console.log('[cutscene] trigger', n, a); window.dispatchEvent(new CustomEvent('gta:cutscene-trigger', { detail: { name: n, arg: a, quest: null } })); },
    }), 1500);
  } else {
    hud.toast(`No scene "${sceneId}". Scenes: ${Object.keys(SCENES).join(', ') || 'none yet'}`, 8000);
  }
}
if (startParams.has('cutscenecheck')) {
  setTimeout(() => runCutsceneCheck({ scene, camera, boxes: world.boxes, ui, spawn: world.spawn }), 1000);
}

introTour.startIfFirstTime(startParams);
if (!introTour.active) hud.toast('Welcome to Turfton. Mowers are for borrowing.', 4000);
requestAnimationFrame(frame);

// Test hook for scripted checks and demos: ?debug exposes the live objects.
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as Record<string, unknown>).__gta = {
    // Garage (no UI yet): read or change a vehicle model's setup knobs, then the driven chassis is rebuilt to feel it. Mode: setMode('arcade' | 'casual' | ...).
    garage: { get: getSetup, set: (k: VehicleKind, patch: Record<string, number>) => { const r = setSetup(k, patch); refreshDriving(); return r; }, reset: (k: VehicleKind) => { const r = resetSetup(k); refreshDriving(); return r; } },
    setMode: (id: string) => { setTune(id); refreshDriving(); return getTune().id; },
    damageVehicle, repairVehicle, repaintVehicle, spawn: (k: VehicleKind, x: number, z: number, yaw: number) => { const nv = createVehicle(scene, k, x, z, yaw, 0xd8342c); vehicles.push(nv); return nv; }, player, vehicles, traffic, npcs, watch, world, chase, hud, weapons, aim, muzzle, radio, economy, easterEggs, garages, vibeNpcs, quests, worldEvents, tessie: tessieWorld, taxi, route: () => route, cutscene, scenes: SCENES,
    // World sound (src/sound/): live voice counts, and playAt for scripted checks.
    sound: { stats: soundStats, playAt },
    // Pay 'n' Glaze: the owned look of a model; patch the driven vehicle's look (demos: glaze.look({ spoiler: 'picket' })); open the shop on the driven vehicle.
    glaze: {
      owned: ownedLoadout,
      look: (patch: Partial<Loadout>) => {
        const pv = player.vehicle;
        if (!pv) return null;
        const next = normalizeLoadout({ ...(pv.look ?? defaultLoadout(pv.tint)), ...patch });
        setVehicleLook(pv, next);
        refreshDriving(); // the sim reads the ride height when the chassis is built
        return next;
      },
      open: () => { if (player.vehicle) garages.openGlaze(player.vehicle); },
    },
    // Terrain (terrain.ts): heightAt, normalAt, options. Try the test hill with ?terrain=hill (Dust Flats, x 545, z 30).
    terrain,
    // Online riders: who holds a seat in my mower (seat book), the seat I hold in someone else's, and the other players.
    seats: () => seats.riders(), riding: () => riding, remotes, net };
}
