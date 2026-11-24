// DayG: the only integration point. Constructs every system in a fixed order and runs the frame loop (roadmap 3.13).
import * as THREE from 'three';
import { getMyGnome, loadMyGnome } from '@lawn/gnome';
import { CLIMB_KIT, FEED, FISTS, MOVE, NOISE, STAMINA, START_KIT, SUN } from './config';
import { getItem } from './items/defs';
import { createRng, hashString } from './sim/rng';
import { TUNING } from './sim/tuning';
import type { ItemStack, MapKind, RegionId, WeatherKind } from './sim/types';
import { LOCAL_PLAYER, createWorld, hashWorld, hourOf, runDays, stepWorld } from './sim/world';
import { regionsFor } from './sim/regionsFull';
import { questTitle } from './sim/quests';
import { MAP } from './world/blockout';
import { createCollider } from './world/collide';
import { createBus } from './game/bus';
import { createInteract } from './game/interact';
import { createClock } from './game/clock';
import { createInput } from './game/input';
import { createCameraRig } from './game/camera';
import { createPlayerController, createPlayerState } from './game/player';
import { createInventory } from './game/inventory';
import { createNeedsSystem } from './game/needs';
import { createBody, createBodySystem } from './game/body';
import { pickZoneSpawn } from './game/spawn';
import { createCampSystem } from './game/camp';
import { createUseApi } from './game/useItem';
import { createSimFeed } from './game/simFeed';
import { createDaygAchievements } from './game/achievements';
import { createEventLog } from './game/eventLog';
import type { ClimbHint, PlayerState } from './game/types';
import { buildWorld } from './scene/worldBuilder';
import { createSky } from './scene/sky';
import { createPlayerView } from './scene/playerView';
import { createHatlessSystem } from './scene/hatless';
import { createNpcActors } from './scene/npcActors';
import { createContainerSystem } from './scene/containers';
import { createTouchControls } from './ui/touch';
import { createInventoryPanel } from './ui/inventoryPanel';
import { createHud } from './ui/hud';
import { installDaygTheme } from './ui/theme';
import { createRecap } from './ui/recap';
import { createBaseSystem } from './base/system';
import { createBaseView } from './base/view';
import { createBuildController } from './base/build';
import { createPieceActions } from './base/actions';
import { createChestUi } from './base/chestUi';
import { createBaseAchievements } from './base/achievements';
import { demoBase } from './base/demo';
import { BUILD_KIT, CHEST_BULK } from './base/config';
import { lastBaseSeed } from './base/save';
import { BUILDING_PARTS } from './world/buildings/index';
import { createBuildingIndex } from './world/spaces';
import { createInteriorTracker } from './game/interior';
import { buildBuildings } from './scene/buildingsView';
import { assembleFullMap } from './world/fullMap';
import { createSimHost } from './net/simHost';
import { createNetSession } from './net/session';
import { createBubbleSync } from './net/bubbleSync';
import { createRoomSaver, loadRoom } from './net/roomSave';
import { listOwnedWorlds, loadLocalWorldSnapshot, saveLocalWorldSnapshot, upsertOwnedWorld } from './net/worldStore';
import type { Pose } from './net/protocol';
import { createTalkPanel } from './ui/talkPanel';
import { createLedgerPanel } from './ui/ledgerPanel';
import { createMapPanel } from './ui/mapPanel';
import { createAudio } from './audio';
import { createAudioPanel } from './ui/audioPanel';
import { createBoards } from './scene/boards';
import { createBoardPanel } from './ui/boardPanel';
import { createQuestRunner } from './game/questRunner';
import { createRoomPanel } from './ui/roomPanel';
import { createRemotePlayers } from './scene/remotePlayers';
import { createSkills } from './game/skills';
import { createRespawner } from './game/respawn';
import { createBuildSystem } from './game/building';
import { createPiecesView } from './scene/pieces';
import { createBuildPanel } from './ui/buildPanel';
import { createTrainerPanel } from './ui/trainerPanel';
import { createFarmSystem } from './game/farming';
import { createTrapSystem } from './game/traps';
import { createLanterns } from './scene/lanterns';
import { createMowingFx } from './scene/mowingFx';
import { createSettlementsView } from './scene/settlementsView';
import { createRadioSystem } from './scene/radios';
import { createVignetteSystem } from './scene/vignettes';
import { createCollectiblesView } from './scene/collectiblesView';
import { createCampView } from './scene/campView';
import { createCampPanel } from './ui/campPanel';
import { createVehicleSystem, type VehicleSystem } from './scene/vehiclesView';
import { createVehiclePanel, type VehiclePanel } from './ui/vehiclePanel';
import { createNamedSurvivorsView } from './scene/namedSurvivorsView';
import { createCookingPanel } from './ui/cookingPanel';
import { createWorldAtmosphere } from './scene/worldAtmosphere';
import { createTelemetry } from './live/telemetry';

await loadMyGnome();

// ------------------------------------------------------------------ params
const params = new URLSearchParams(location.search);
let seed = Number(params.get('seed'));
if (!params.has('seed') || !Number.isFinite(seed)) {
  seed = lastBaseSeed() ?? 1 + Math.floor(Math.random() * 1e6);
  params.set('seed', String(seed));
  history.replaceState(null, '', `${location.pathname}?${params.toString()}${location.hash}`);
}
const timeScale = Number(params.get('timescale') ?? 1) || 1;
const simDays = Math.max(0, Math.floor(Number(params.get('simdays') ?? FEED.prerunDays) || 0));
const startAtNight = params.get('night') === '1';
const climbKit = params.get('kit') === 'climb';
const buildKit = params.get('kit') === 'build';
if (params.get('touch') === '1') document.documentElement.dataset.touch = '1'; // force touch controls (read by ui/touch.ts)
const spawnParam = params.get('spawn')?.split(',').map(Number);
const map: MapKind = params.get('map') === 'full' ? 'full' : 'slice';
const worker = params.get('worker') !== '0';   // the sim runs in a worker unless worker=0 (roadmap 8.5)
const roomCode = params.get('room');          // a room code to join (roadmap 8.7)
const openPanel = params.get('open');         // a panel to open at start, for screenshots

// ------------------------------------------------------------------ renderer, scene, camera
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;
const coarse = matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.3, map === 'full' ? 2500 : 900);
function resize(): void {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------ sim and clock
const bus = createBus();
const audio = createAudio({ bus, seed: Number.isFinite(seed) ? seed : 1 });
const mapData = map === 'full' ? assembleFullMap() : MAP;
const { world, streams } = createWorld(seed, TUNING, mapData.containers, { map });
runDays(world, streams, simDays);
const startHour = startAtNight ? 21.5 : SUN.startHour;
const tpd = TUNING.clock.ticksPerDay;
for (let guard = 0; Math.floor(hourOf(world.tick, TUNING)) !== Math.floor(startHour) && guard < tpd; guard++) stepWorld(world, streams);
const clock = createClock(bus, {
  startSunHours: (world.tick * 24) / tpd + (startHour - Math.floor(startHour)),
  timeScale, tuning: TUNING,
});

// ------------------------------------------------------------------ world, input, player
const collider = createCollider(mapData, { regions: regionsFor(map) });
const worldView = buildWorld(scene, mapData);
const buildingIndex = createBuildingIndex(BUILDING_PARTS);
const buildingsView = buildBuildings(scene, BUILDING_PARTS);
const interior = createInteriorTracker({ index: buildingIndex, bus });
const sky = createSky(scene);
if (map === 'full' && scene.fog instanceof THREE.Fog) { scene.fog.near = 600; scene.fog.far = 2500; }
const touch = createTouchControls(ui);
const input = createInput(canvas, touch);
const rig = createCameraRig(camera, collider, interior);
if (params.has('yaw') && Number.isFinite(Number(params.get('yaw')))) rig.yaw = Number(params.get('yaw'));
const gameRng = createRng(hashString(`${seed}:player`));
const rng = (): number => gameRng.next();
const zoneSpawn = spawnParam && (spawnParam.length === 2 || spawnParam.length === 3) && spawnParam.every(Number.isFinite)
  ? { pos: { x: spawnParam[0], y: collider.groundAt(spawnParam[0], spawnParam[1], spawnParam[2] ?? 1e6), z: spawnParam[1] }, region: null as RegionId | null }
  : pickZoneSpawn(mapData, regionsFor(map), collider, rng);
const player = createPlayerState(zoneSpawn.pos);
const getPlayer = (): PlayerState => player;
const controller = createPlayerController({ bus, collider });
const playerView = createPlayerView(scene);

// ------------------------------------------------------------------ survival, items, UI
const interact = createInteract();
installDaygTheme();
const inv = createInventory([...START_KIT, ...(climbKit ? CLIMB_KIT : []), ...(buildKit ? BUILD_KIT : [])]);
const needs = createNeedsSystem(bus, TUNING);
const body = createBodySystem(bus, rng, TUNING);
const camp = createCampSystem({ scene, map: mapData, interact, bus, inv, needs, clock, getPlayer, collider });
const use = createUseApi({ inv, needs, body, camp, bus, rng, getPlayer, getWeather: () => world.weather });
const panel = createInventoryPanel(ui, { inv, use, onSound: (kind) => audio.ui(kind) });
const hud = createHud(ui, { onToast: () => audio.ui('toast') });

// ------------------------------------------------------------------ Hatless, NPCs, sim feed, containers
const host = createSimHost({ world, streams, worker, me: LOCAL_PLAYER }); // the one world owner: solo, host or guest
host.apply({ kind: 'player-join', name: 'You', look: '', userId: null, region: player.region });
const sim = { world, streams };
const hatless = createHatlessSystem({ scene, collider, bus, getPlayer, coarse });
const npcs = createNpcActors({ scene, collider, getPlayer });
npcs.setHatless?.(hatless);
npcs.onFallen?.((_id, name) => { hud.toast(`${name} was overwhelmed by the Hatless!`); });
hatless.setNpcTargets?.(() => npcs.combatTargets?.() ?? []);
hatless.onNpcScratch?.((key, strength, from) => { npcs.receiveHit?.(key, strength, from); });
const settlementsView = createSettlementsView({ scene, map: mapData, regions: regionsFor(map), collider });
const worldAtmosphere = createWorldAtmosphere({ scene, regions: regionsFor(map), collider });
const radios = createRadioSystem({ scene, map: mapData, interact, collider, getPlayer, onToast: (t) => hud.toast(t) });
const vignettes = createVignetteSystem({ scene, ui, regions: regionsFor(map), interact, collider, onToast: (t) => hud.toast(t) });
const collectiblesView = createCollectiblesView({ scene, regions: regionsFor(map), interact, collider, onToast: (t) => hud.toast(t) });
const namedSurvivorsView = createNamedSurvivorsView({ scene, ui, regions: regionsFor(map), interact, collider, world: host.world, onToast: (t) => hud.toast(t) });
const cookingPanel = createCookingPanel(ui, { inv, needs, camp, getPlayer, bus, onToast: (t) => hud.toast(t) });
const campView = createCampView({ scene, hatless, onToast: (t) => hud.toast(t) });
let vehiclePanel!: VehiclePanel;
const vehicles: VehicleSystem = createVehicleSystem({
  scene,
  collider,
  interact,
  bus,
  hatless,
  getPlayer,
  onInspect: (v) => vehiclePanel.open(v),
  onToast: (t) => hud.toast(t),
});
vehiclePanel = createVehiclePanel(ui, {
  store: vehicles.store,
  onRebuild: (id) => vehicles.rebuild(id),
  onDrive: (id) => vehicles.enterVehicle(id),
});
const feed = createSimFeed({ sim, map: mapData, bus, clock, hatless, npcs, getPlayer, host });
createContainerSystem({ map: mapData, worldView, interact, sim, bus, panel, inv, getPlayer, host });

// ------------------------------------------------------------------ phases 4-8 systems (Step 0: stubs until their rounds land)
const getPose = (): Pose => ({ x: player.pos.x, y: player.pos.y, z: player.pos.z, f: player.facing, a: 0, r: player.region, held: null });
const session = createNetSession({ host, bus, clock, getPose });
const myGnome = (): { name: string; character: string } => ({ name: getMyGnome()?.name ?? 'You', character: getMyGnome()?.code ?? '' });
const bubbleSync = createBubbleSync({ host, session, hatless, getPlayer, bus });
const roomSaver = createRoomSaver({ host, session, bus });
const remote = createRemotePlayers({ scene, host, session });
const talkPanel = createTalkPanel(ui, { host, npcs, interact, inv, bus, getPlayer });
const skills = createSkills(bus, host);
const quests = createQuestRunner({ host, bus, inv, getPlayer });
const ledgerPanel = createLedgerPanel(ui, { host, quests, skills, bus });
// The world map: real top-down world render + regions + markers; the player's arrow shows while carrying a gnomeps (GPS).
const mapPanel = createMapPanel(ui, {
  regions: regionsFor(map),
  hasFix: () => inv.countTag('GPS') > 0,
  playerPos: () => ({ x: player.pos.x, z: player.pos.z }),
  playerFacing: () => rig.yaw,
  scene,
  renderer,
  map: mapData,
  getMarkers: () => {
    const out: { x: number; z: number; label: string; color: string }[] = [];
    if (campPanel.state.established && campPanel.state.center) {
      out.push({ x: campPanel.state.center.x, z: campPanel.state.center.z, label: `⛺ ${campPanel.state.name}`, color: '#7bd389' });
    }
    for (const vp of vehicles.getPositions()) out.push({ x: vp.x, z: vp.z, label: vp.label, color: '#8fd3ff' });
    return out;
  },
});
const audioPanel = createAudioPanel(ui, audio);
const boardPanel = createBoardPanel(ui, { host, inv, bus, getPlayer });
createBoards({ scene, map: mapData, interact, host, panel: boardPanel, bus });
const roomPanel = createRoomPanel(ui);
const respawner = createRespawner({ host, player, inv, needs, body, skills, bus, map: mapData, collider });
const dBuild = createBuildSystem({ scene, host, inv, collider, interact, bus, skills, getPlayer, getYaw: () => rig.yaw });
const piecesView = createPiecesView({ scene, host, collider, bus });
const dBuildPanel = createBuildPanel(ui, { build: dBuild, inv });
const farm = createFarmSystem({ host, inv, interact, bus, skills });
const traps = createTrapSystem({ host, hatless, bus, getPlayer });
const lanterns = createLanterns({ scene, map: mapData, interact, host, inv, bus, getPlayer });
const mowingFx = createMowingFx({ scene, host, bus, getPlayer, camera });
createTelemetry({ host, bus, clock, getRole: () => host.role, wsUrl: '' });
let desyncs = 0;
bus.on('desync', () => { desyncs++; });

// ------------------------------------------------------------------ base building (roadmap 9)
const base = createBaseSystem({ seed, world, collider, bus, hatless, camp, getPlayer });
const baseView = createBaseView(scene);
const demo = params.get('basedemo') === '1';
baseView.sync(demo ? demoBase(seed) : base.state());
if (!demo) base.onChange(() => baseView.sync(base.state()));
const chestUi = createChestUi(ui, { inv, capacityBulk: CHEST_BULK });
const build = createBuildController({ base, view: baseView, ui, inv, collider, bus, getPlayer, getAim: () => rig.yaw });
const pieceActions = createPieceActions({ base, view: baseView, interact, inv, bus, clock, camp, hatless, getPlayer, chest: chestUi });
createBaseAchievements({ bus, ui });
if (params.get('build') === '1') requestAnimationFrame(() => build.open());
if (params.get('chestui') === '1') { const demoItems: ItemStack[] = [{ def: 'plank', count: 4, condition: 1 }]; chestUi.open('Storage chest', () => demoItems, () => {}); }

// ------------------------------------------------------------------ achievements, recap
createDaygAchievements({ bus, ui, getPlayer, clock, host, session });
const log = createEventLog(bus, clock, getPlayer);
const recap = createRecap(ui, log, () => host.world.players[host.me]?.bed ?? null);
recap.onRise((at) => respawner.respawn(at));

const regionName = (): string | null => (player.region ? world.graph.byId[player.region].name : null);
bus.on('route-placed', (e) => worldView.addRoute(e.route, e.fromY, e.topY));
bus.on('hint', (e) => hud.toast(e.text));
const toastedBuildings = new Set<string>();
bus.on('entered-building', (e) => {
  if (toastedBuildings.has(e.building)) return;
  toastedBuildings.add(e.building);
  hud.toast(buildingIndex.byId(e.building)?.def.name ?? e.building);
});
bus.on('player-shattered', (e) => {
  if (trainerPanel.state.godMode) {
    Object.assign(body.state, createBody());
    player.alive = true;
    return;
  }
  player.alive = false;
  recap.show(e.cause, regionName(), clock.day, clock.hourOfDay);
});

declare global { interface Window { __dayg?: unknown } }
window.__dayg = {
  player, needs, body, inv, sim, clock, bus, hatless, feed, camp, use, panel, base, build, chestUi, interior, buildingIndex,
  host, session, quests, skills, talkPanel, boardPanel, respawner, hash: () => hashWorld(host.world), get desyncs() { return desyncs; },
};

// ------------------------------------------------------------------ frame loop
const RAIN: readonly WeatherKind[] = ['drizzle', 'rain', 'storm'];
function climbHintText(h: ClimbHint | null): string | null {
  if (!h) return null;
  switch (h.kind) {
    case 'vault': return 'Vault';
    case 'route': return 'Climb';
    case 'rope': return 'Climb with the rope';
    case 'ladder': return 'Climb with the ladder';
    case 'down': return 'Climb down';
    case 'too-high': return 'Too high to climb';
  }
}

const WEATHERS: readonly WeatherKind[] = ['clear', 'fog', 'drizzle', 'rain', 'storm'];
const trainerPanel = createTrainerPanel(ui, {
  regions: regionsFor(map),
  onTeleport(region) {
    const r = regionsFor(map).find((x) => x.id === region);
    if (!r) return;
    const cx = (r.rect.x0 + r.rect.x1) / 2, cz = (r.rect.z0 + r.rect.z1) / 2;
    const cy = collider.groundAt(cx, cz, 1e6);
    player.pos.set(cx, cy, cz);
    player.vel.set(0, 0, 0);
    player.grounded = true;
    player.fallFromY = null;
    player.region = region;
    hud.toast(`Teleported to ${r.name}`);
  },
  onGiveKit(kit) {
    if (kit === 'heal') {
      Object.assign(body.state, createBody());
      needs.state.warmth = needs.state.water = needs.state.food = needs.state.calm = 100;
      player.stamina = STAMINA.max;
      hud.toast('Healed all cracks, infection & needs');
    } else if (kit === 'acorns') {
      const rec = host.world.players[LOCAL_PLAYER];
      if (rec) rec.acorns += 50;
      hud.toast('+50 acorns');
    } else if (kit === 'combat') {
      for (const s of [{ def: 'thorn-dagger', count: 1, condition: 1 }, { def: 'acorn-club', count: 1, condition: 1 }, { def: 'glaze-pot', count: 2, condition: 1 }, { def: 'salt-pinch', count: 2, condition: 1 }]) inv.add(s);
      hud.toast('Added Combat Kit');
    } else {
      const list = kit === 'build' ? BUILD_KIT : kit === 'climb' ? CLIMB_KIT : START_KIT;
      for (const s of list) inv.add({ ...s });
      hud.toast(`Added ${kit} kit`);
    }
  },
  onHatless(action) {
    if (action === 'spawn5') {
      const r = player.region ?? regionsFor(map)[0]?.id ?? 'forecourt';
      hatless.spawn(r, 5, []);
      hud.toast('Spawned 5 Hatless');
    } else {
      const n = hatless.despawnAll();
      hud.toast(`Cleared ${n} Hatless`);
    }
  },
  onSetTime(hour) {
    const dayBase = Math.floor(clock.sunHours / 24) * 24;
    clock.sunHours = dayBase + hour;
    hud.toast(`Time set to ${String(Math.floor(hour)).padStart(2, '0')}:00`);
  },
  onCycleWeather() {
    const idx = WEATHERS.indexOf(world.weather.kind);
    const next = WEATHERS[(idx + 1) % WEATHERS.length];
    world.weather.kind = next;
    return next;
  },
  onSetTimeScale(scale) {
    clock.setRate(scale);
    hud.toast(`Sim speed ${scale}x`);
  },
  onToggleLootRespawn() {
    host.world.lootRespawn = !host.world.lootRespawn;
    hud.toast(`Loot respawn: ${host.world.lootRespawn ? 'ON' : 'OFF'}`);
    return !!host.world.lootRespawn;
  },
  onGiveVehicleParts() {
    vehicles.giveAllParts();
  },
});
if (params.get('trainer') === '1') trainerPanel.open();
const campPanel = createCampPanel(ui, {
  world: host.world,
  getPlayer,
  isGodMode: () => trainerPanel.state.godMode,
  onSync: (c) => campView.sync(c),
  onToast: (t) => hud.toast(t),
});
if (zoneSpawn.region) {
  const rName = world.graph.byId[zoneSpawn.region]?.name;
  if (rName) hud.toast(`Woke up in ${rName}`);
}

let last = performance.now();
let wasOpen = false;   // any panel open last frame: plays the open and close sounds
let lastLockAllowed = true;
let attackCd = 0;
function frame(now: number): void {
  // The first rAF timestamp can precede the performance.now() taken at module load; never step backwards.
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (attackCd > 0) attackCd = Math.max(0, attackCd - dt);
  const hours = clock.update(dt);
  const inp = input.read(dt);
  if (inp.inventory) panel.toggle();
  if (inp.map && !panel.isOpen()) mapPanel.toggle();
  if (inp.trainer) trainerPanel.toggle();
  if (inp.radio) radios.togglePortable();
  mapPanel.tick();
  const openNow = panel.isOpen() || mapPanel.isOpen() || audioPanel.isOpen() || ledgerPanel.isOpen();
  if (openNow !== wasOpen) { audio.ui(openNow ? 'open' : 'close'); wasOpen = openNow; }
  const anyPanelOpen = panel.isOpen() || chestUi.isOpen() || talkPanel.isOpen() || boardPanel.isOpen()
    || ledgerPanel.isOpen() || mapPanel.isOpen() || audioPanel.isOpen() || roomPanel.isOpen()
    || dBuildPanel.isOpen() || trainerPanel.isOpen() || vignettes.isOpen() || campPanel.isOpen() || vehiclePanel.isOpen()
    || namedSurvivorsView.isOpen() || cookingPanel.isOpen() || !player.alive;
  if (!anyPanelOpen !== lastLockAllowed) {
    lastLockAllowed = !anyPanelOpen;
    input.setPointerLockAllowed(lastLockAllowed);
  }
  const here = player.region ? regionsFor(map).find((r) => r.id === player.region) : undefined;
  audio.tick(dt, {
    district: here?.district ?? null, traits: here?.traits ?? [], weather: world.weather.kind,
    night: hours < SUN.nightEnd || hours >= SUN.nightStart,
    hatlessNear: hatless.nearCount(player.pos, 15), calm: needs.state.calm, inHaven: player.haven !== null,
    panelOpen: talkPanel.isOpen() || boardPanel.isOpen() || ledgerPanel.isOpen(),
    menu: roomPanel.isOpen(),
  });
  touch.setVisible(!panel.isOpen() && !mapPanel.isOpen() && !audioPanel.isOpen() && !chestUi.isOpen() && !trainerPanel.isOpen() && player.alive);
  if (anyPanelOpen || use.busy() !== null || base.busy() !== null) {
    inp.moveX = 0; inp.moveZ = 0;
    inp.sprint = false; inp.climb = false; inp.attack = false; inp.action = false;
  }

  if (trainerPanel.state.godMode || (trainerPanel.state as { infiniteStamina?: boolean }).infiniteStamina) {
    player.stamina = STAMINA.max;
  }
  if (trainerPanel.state.godMode) {
    needs.state.warmth = 100; needs.state.water = 100; needs.state.food = 100; needs.state.calm = 100;
    body.state.infection = null;
    body.state.cracks = { head: 0, chest: 0, armL: 0, armR: 0, legL: 0, legR: 0 };
  }
  if (trainerPanel.isOpen()) {
    (trainerPanel as { updateInfo?: (t: string) => void }).updateInfo?.(
      `Pos: (${player.pos.x.toFixed(1)}, ${player.pos.y.toFixed(1)}, ${player.pos.z.toFixed(1)}) · Region: ${regionName() ?? 'none'}`,
    );
  }

  if (build.active()) inp.attack = false;
  const needFx = needs.effects();
  const bodyFx = body.effects();
  const mods = {
    speedMul: needFx.speedMul * (1 - 0.5 * bodyFx.limp),
    staminaRegenMul: needFx.staminaRegenMul,
    canSprint: inv.weight() <= inv.carryCapacity(),
    carryRatio: inv.weight() / inv.carryCapacity(),
    hasRope: inv.countTag('ROPE') > 0,
    hasLadder: inv.countTag('LADDER') > 0,
  };
  if (vehicles.isDriving()) {
    vehicles.update(dt, inp);
  } else if (trainerPanel.state.flyMode && !anyPanelOpen) {
    const fx = Math.sin(rig.yaw), fz = Math.cos(rig.yaw);
    const rx = -Math.cos(rig.yaw), rz = Math.sin(rig.yaw);
    const spd = trainerPanel.state.flySpeed * dt;
    player.pos.x += (rx * inp.moveX + fx * inp.moveZ) * spd;
    player.pos.z += (rz * inp.moveX + fz * inp.moveZ) * spd;
    if (inp.climb) player.pos.y += spd * 1.5;
    if (inp.crouch || inp.sprint) player.pos.y -= spd * 0.7;
    player.grounded = false;
    player.fallFromY = null;
    player.vel.set(0, 0, 0);
    player.speed = trainerPanel.state.flySpeed;
    player.region = collider.regionAt(player.pos.x, player.pos.z);
  } else {
    controller.update(player, inp, rig.yaw, dt, mods);
  }
  interior.update(player.pos, dt);
  const hint = trainerPanel.state.flyMode ? null : controller.climbHint(player, mods);
  touch.setClimbHint(hint !== null);

  if (inp.attack && attackCd <= 0 && (trainerPanel.state.godMode || player.stamina >= STAMINA.attackCost)) {
    attackCd = 0.35;
    const held = inv.held();
    const props = held ? getItem(held.def).props : undefined;
    const reach = (props?.reach ?? FISTS.reach) + 0.6;
    const damage = props?.damage ?? FISTS.damage;
    const hits = hatless.strike(player.pos, player.facing, reach, damage);
    if (hits === 0) base.strike(player.pos, player.facing, reach, damage);
    playerView.triggerAttack(hits > 0);
    audio.attack(hits > 0);
    if (!trainerPanel.state.godMode) player.stamina -= STAMINA.attackCost;
    bus.emit('noise', { x: player.pos.x, z: player.pos.z, radius: NOISE.attack, source: 'attack' });
  }
  if (inp.action) interact.trigger();

  rig.update(player.pos, inp, dt, player.stance === 'crouch');
  buildingsView.update(interior.state, dt);
  host.update(clock.sunHours); // the shared host ticks the world (solo/host only; a guest's host is a no-op)
  feed.update(dt, hours);
  hatless.update(dt, { night: clock.night, fog: world.weather.kind === 'fog' });
  npcs.update(dt);
  settlementsView.update(dt);
  worldAtmosphere.update(dt, clock.night);
  radios.update(dt);
  collectiblesView.update(dt);
  namedSurvivorsView.update(dt);
  campView.update(dt);
  camp.update(dt, hours, world.weather);
  base.update(dt, hours);
  build.update(dt);
  pieceActions.update(dt);
  baseView.update(dt);
  use.update(dt);
  dBuild.update(dt);
  piecesView.update(dt);
  farm.update(dt);
  traps.update(dt);
  lanterns.update(dt);
  mowingFx.update(dt);
  quests.update(dt);
  session.update(dt);
  bubbleSync.update(dt);
  roomSaver.update(dt);
  remote.update(dt);
  worldView.update(player.pos);

  const wet = RAIN.includes(world.weather.kind) ? (player.haven ? 0.5 : 1) : 0;
  needs.update(hours, {
    night: clock.night, weather: world.weather.kind, tempC: world.weather.tempC,
    nearFire: camp.nearFire(player.pos), inHaven: player.haven !== null || base.sealedAt(player.pos),
    hatlessNear: hatless.nearCount(player.pos, 15),
    exertion: player.sprinting ? 1 : player.speed > MOVE.walk + 0.5 ? 0.5 : 0,
    wet, altitude: player.pos.y, infectionStage: body.state.infection?.stage ?? null,
  });
  body.update(hours, { damage: needs.effects().damage, season: clock.season, wet });

  playerView.update(player, dt, {
    held: inv.state.hands[0]?.def ?? null,
    back: inv.state.worn.back?.def ?? null,
    head: inv.state.worn.head?.def ?? null,
    hatSlips: body.effects().hatSlips,
    dead: !player.alive,
  });
  playerView.model.object.visible = !rig.close;
  sky.update(clock, world.weather, player.pos, dt);

  const cur = interact.update(player.pos);
  const tracked = quests.tracked();
  hud.prompt(cur?.label() ?? climbHintText(hint) ?? null);
  hud.update({
    needs: needs.state, stamina: player.stamina, body: body.state,
    hourOfDay: clock.hourOfDay, day: clock.day, night: clock.night, season: clock.season,
    weather: world.weather.kind, regionName: regionName(), haven: player.haven, stance: player.stance,
    busy: use.busy() ?? base.busy(), carry: { weight: inv.weight(), capacity: inv.carryCapacity() },
    acorns: host.world.players[LOCAL_PLAYER]?.acorns ?? 0,
    quest: tracked ? questTitle(host.world, tracked) : null,
    net: session.status === 'offline' ? null : session.status,
    facing: rig.yaw,
    hands: [inv.state.hands[0]?.def ?? null, inv.state.hands[1]?.def ?? null],
  } as Parameters<typeof hud.update>[0]);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Persistent owned worlds: local auto-save + cloud room save + seamless @lawn/mp join.
let currentWorldCode = roomCode ?? `LOCAL-${seed}`;
let currentWorldTitle = 'Mossgrave';
async function saveOwnedWorld(): Promise<void> {
  const code = session.code ?? currentWorldCode;
  const meta = {
    code,
    title: host.world.worldMeta?.title ?? currentWorldTitle,
    owner: host.world.worldMeta?.owner ?? myGnome().name,
    seed: host.world.seed,
    day: clock.day,
    lootRespawn: !!host.world.lootRespawn,
    updatedAt: new Date().toISOString(),
  };
  upsertOwnedWorld(meta);
  await saveLocalWorldSnapshot(code, host.snapshot());
  if (session.code) void roomSaver.saveNow('timer');
}
function refreshRoomList(): void {
  roomPanel.setWorlds(listOwnedWorlds().map((w) => ({
    code: w.code,
    title: w.title,
    summary: `Owner: ${w.owner} · Day ${w.day} · Loot respawn: ${w.lootRespawn ? 'On' : 'Off'}`,
    updatedAt: w.updatedAt,
  })));
}
roomPanel.onOpen(refreshRoomList);
roomPanel.onSaveNow?.(() => { void saveOwnedWorld(); });
session.onStatus((s) => {
  if (s === 'host' && session.code) {
    currentWorldCode = session.code;
    roomPanel.setStatus(`Hosting "${currentWorldTitle}" · code: ${session.code}`);
    void saveOwnedWorld();
  } else if (s === 'guest' && session.code) {
    roomPanel.setStatus(`Joined world · code: ${session.code}`);
  } else if (s === 'connecting') {
    roomPanel.setStatus('Connecting to world…');
  } else if (s === 'lost') {
    roomPanel.setStatus('Connection lost. Local save is safe.');
  }
});
setInterval(() => { void saveOwnedWorld(); }, 60000);
window.addEventListener('pagehide', () => { void saveOwnedWorld(); });

roomPanel.onChoose((c) => {
  currentWorldTitle = c.title || 'Mossgrave';
  host.world.lootRespawn = !!c.lootRespawn;
  host.world.worldMeta = { title: currentWorldTitle, owner: myGnome().name, lootRespawn: !!c.lootRespawn };
  if (c.mode === 'solo') {
    currentWorldCode = `LOCAL-${host.world.seed}`;
    void saveOwnedWorld();
    hud.toast(`Playing solo world "${currentWorldTitle}"`);
    return;
  }
  if (c.mode === 'reopen' && c.code) {
    currentWorldCode = c.code;
    void (async () => {
      const snap = (await loadLocalWorldSnapshot(c.code!)) ?? (await loadRoom(c.code!));
      if (snap) {
        host.load(snap);
        bus.emit('world-loaded', { tick: snap.tick });
      }
      if (!c.code!.startsWith('LOCAL-')) {
        session.start(c, myGnome()).catch(() => { hud.toast('Loaded local copy (offline)'); });
      } else {
        hud.toast(`Reopened "${currentWorldTitle}"`);
      }
    })();
    return;
  }
  session.start(c, myGnome()).catch(() => { hud.toast('Could not reach the room'); });
});
if (roomCode) session.start({ mode: 'join', code: roomCode, title: '', pace: 'standard', roomMode: 'co-op' }, myGnome()).catch(() => { hud.toast('Could not reach the room'); });

// Panels opened at start for screenshots and browser checks.
if (openPanel === 'ledger') ledgerPanel.open();
else if (openPanel === 'room') roomPanel.open();
else if (openPanel === 'build') dBuildPanel.open();
else if (openPanel === 'talk') {
  const npc = host.world.npcs.find((n) => n.alive);
  if (npc) talkPanel.open(npc.id);
}
else if (openPanel === 'board') {
  const spot = mapData.spots.find((s) => s.kind === 'board');
  if (spot) boardPanel.open(`board:${spot.region}`);
}
