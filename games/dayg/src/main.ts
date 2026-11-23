// DayG: the only integration point. Constructs every system in a fixed order and runs the frame loop (roadmap 3.13).
import * as THREE from 'three';
import { loadMyGnome } from '@lawn/gnome';
import { CLIMB_KIT, FEED, FISTS, MOVE, NOISE, STAMINA, START_KIT, SUN } from './config';
import { getItem } from './items/defs';
import { createRng, hashString } from './sim/rng';
import { TUNING } from './sim/tuning';
import type { ItemStack, MapKind, WeatherKind } from './sim/types';
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
import { createBodySystem } from './game/body';
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
import { createRoomSaver } from './net/roomSave';
import type { Pose } from './net/protocol';
import { createTalkPanel } from './ui/talkPanel';
import { createLedgerPanel } from './ui/ledgerPanel';
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
import { createFarmSystem } from './game/farming';
import { createTrapSystem } from './game/traps';
import { createLanterns } from './scene/lanterns';
import { createMowingFx } from './scene/mowingFx';
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
const spawn = spawnParam && (spawnParam.length === 2 || spawnParam.length === 3) && spawnParam.every(Number.isFinite)
  ? { x: spawnParam[0], y: collider.groundAt(spawnParam[0], spawnParam[1], spawnParam[2] ?? 1e6), z: spawnParam[1] }
  : mapData.playerSpawn;
const player = createPlayerState(spawn);
const getPlayer = (): PlayerState => player;
const controller = createPlayerController({ bus, collider });
const playerView = createPlayerView(scene);

// ------------------------------------------------------------------ survival, items, UI
const gameRng = createRng(hashString(`${seed}:player`));
const rng = (): number => gameRng.next();
const interact = createInteract();
const inv = createInventory([...START_KIT, ...(climbKit ? CLIMB_KIT : []), ...(buildKit ? BUILD_KIT : [])]);
const needs = createNeedsSystem(bus, TUNING);
const body = createBodySystem(bus, rng, TUNING);
const camp = createCampSystem({ scene, map: mapData, interact, bus, inv, needs, clock, getPlayer, collider });
const use = createUseApi({ inv, needs, body, camp, bus, rng, getPlayer, getWeather: () => world.weather });
const panel = createInventoryPanel(ui, { inv, use });
const hud = createHud(ui);

// ------------------------------------------------------------------ Hatless, NPCs, sim feed, containers
const sim = { world, streams };
const hatless = createHatlessSystem({ scene, collider, bus, getPlayer, coarse });
const npcs = createNpcActors({ scene, collider, getPlayer });
const feed = createSimFeed({ sim, map: mapData, bus, clock, hatless, npcs, getPlayer });
createContainerSystem({ map: mapData, worldView, interact, sim, bus, panel, inv, getPlayer });

// ------------------------------------------------------------------ phases 4-8 systems (Step 0: stubs until their rounds land)
const host = createSimHost({ world, streams, worker, me: LOCAL_PLAYER });
host.apply({ kind: 'player-join', name: 'You', look: '', userId: null, region: player.region });
const getPose = (): Pose => ({ x: player.pos.x, y: player.pos.y, z: player.pos.z, f: player.facing, a: 0, r: player.region, held: null });
const session = createNetSession({ host, bus, clock, getPose });
const bubbleSync = createBubbleSync({ host, session, hatless, getPlayer, bus });
const roomSaver = createRoomSaver({ host, session });
const remote = createRemotePlayers({ scene, host, session });
const talkPanel = createTalkPanel(ui, { host, npcs, interact, inv, bus, getPlayer });
const skills = createSkills(bus);
const quests = createQuestRunner({ host, bus, inv, getPlayer });
const ledgerPanel = createLedgerPanel(ui, { host, quests, skills, bus });
const boardPanel = createBoardPanel(ui, { host, inv, bus, getPlayer });
createBoards({ scene, map: mapData, interact, host, panel: boardPanel, bus });
const roomPanel = createRoomPanel(ui);
createRespawner({ host, player, inv, needs, body, skills, bus, map: mapData, collider });
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
createDaygAchievements({ bus, ui, getPlayer, clock });
const log = createEventLog(bus, clock, getPlayer);
const recap = createRecap(ui, log);

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
  player.alive = false;
  recap.show(e.cause, regionName(), clock.day, clock.hourOfDay);
});

declare global { interface Window { __dayg?: unknown } }
window.__dayg = {
  player, needs, body, inv, sim, clock, bus, hatless, feed, camp, use, panel, base, build, chestUi, interior, buildingIndex,
  host, session, quests, skills, hash: () => hashWorld(host.world), get desyncs() { return desyncs; },
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

let last = performance.now();
function frame(now: number): void {
  // The first rAF timestamp can precede the performance.now() taken at module load; never step backwards.
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  const hours = clock.update(dt);
  const inp = input.read(dt);
  if (inp.inventory) panel.toggle();
  touch.setVisible(!panel.isOpen() && !chestUi.isOpen() && player.alive);
  if (panel.isOpen() || chestUi.isOpen() || talkPanel.isOpen() || boardPanel.isOpen() || ledgerPanel.isOpen() || roomPanel.isOpen() || dBuildPanel.isOpen()
    || use.busy() !== null || base.busy() !== null || !player.alive) {
    inp.moveX = 0; inp.moveZ = 0;
    inp.sprint = false; inp.climb = false; inp.attack = false; inp.action = false;
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
  controller.update(player, inp, rig.yaw, dt, mods);
  interior.update(player.pos, dt);
  const hint = controller.climbHint(player, mods);
  touch.setClimbHint(hint !== null);

  if (inp.attack && player.stamina >= STAMINA.attackCost) {
    const held = inv.held();
    const props = held ? getItem(held.def).props : undefined;
    const reach = (props?.reach ?? FISTS.reach) + 0.6;
    const damage = props?.damage ?? FISTS.damage;
    const hits = hatless.strike(player.pos, player.facing, reach, damage);
    if (hits === 0) base.strike(player.pos, player.facing, reach, damage);
    player.stamina -= STAMINA.attackCost;
    bus.emit('noise', { x: player.pos.x, z: player.pos.z, radius: NOISE.attack, source: 'attack' });
  }
  if (inp.action) interact.trigger();

  rig.update(player.pos, inp, dt, player.stance === 'crouch');
  buildingsView.update(interior.state, dt);
  feed.update(dt, hours);
  hatless.update(dt, { night: clock.night, fog: world.weather.kind === 'fog' });
  npcs.update(dt);
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
  });
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (openPanel === 'ledger') ledgerPanel.open();
else if (openPanel === 'room') roomPanel.open();
else if (openPanel === 'build') dBuildPanel.open();
// 'talk' and 'board' need an NPC or a board to open; they are not opened here.
void roomCode;
