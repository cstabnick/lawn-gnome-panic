// DayG: the only integration point. Constructs every system in a fixed order and runs the frame loop (roadmap 3.13).
import * as THREE from 'three';
import { loadMyGnome } from '@lawn/gnome';
import { CLIMB_KIT, FEED, FISTS, MOVE, NOISE, STAMINA, START_KIT, SUN } from './config';
import { getItem } from './items/defs';
import { createRng, hashString } from './sim/rng';
import { TUNING } from './sim/tuning';
import type { WeatherKind } from './sim/types';
import { createWorld, hourOf, runDays, stepWorld } from './sim/world';
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

await loadMyGnome();

// ------------------------------------------------------------------ params
const params = new URLSearchParams(location.search);
let seed = Number(params.get('seed'));
if (!params.has('seed') || !Number.isFinite(seed)) {
  seed = 1 + Math.floor(Math.random() * 1e6);
  params.set('seed', String(seed));
  history.replaceState(null, '', `${location.pathname}?${params.toString()}${location.hash}`);
}
const timeScale = Number(params.get('timescale') ?? 1) || 1;
const simDays = Math.max(0, Math.floor(Number(params.get('simdays') ?? FEED.prerunDays) || 0));
const startAtNight = params.get('night') === '1';
const climbKit = params.get('kit') === 'climb';
if (params.get('touch') === '1') document.documentElement.dataset.touch = '1'; // force touch controls (read by ui/touch.ts)
const spawnParam = params.get('spawn')?.split(',').map(Number);

// ------------------------------------------------------------------ renderer, scene, camera
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;
const coarse = matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.3, 900);
function resize(): void {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------ sim and clock
const bus = createBus();
const { world, streams } = createWorld(seed);
runDays(world, streams, simDays);
const startHour = startAtNight ? 21.5 : SUN.startHour;
const tpd = TUNING.clock.ticksPerDay;
for (let guard = 0; Math.floor(hourOf(world.tick, TUNING)) !== Math.floor(startHour) && guard < tpd; guard++) stepWorld(world, streams);
const clock = createClock(bus, {
  startSunHours: (world.tick * 24) / tpd + (startHour - Math.floor(startHour)),
  timeScale, tuning: TUNING,
});

// ------------------------------------------------------------------ world, input, player
const collider = createCollider(MAP);
const worldView = buildWorld(scene, MAP);
const sky = createSky(scene);
const touch = createTouchControls(ui);
const input = createInput(canvas, touch);
const rig = createCameraRig(camera, collider);
const spawn = spawnParam && spawnParam.length === 2 && spawnParam.every(Number.isFinite)
  ? { x: spawnParam[0], y: collider.groundAt(spawnParam[0], spawnParam[1], 1e6), z: spawnParam[1] }
  : MAP.playerSpawn;
const player = createPlayerState(spawn);
const getPlayer = (): PlayerState => player;
const controller = createPlayerController({ bus, collider });
const playerView = createPlayerView(scene);

// ------------------------------------------------------------------ survival, items, UI
const gameRng = createRng(hashString(`${seed}:player`));
const rng = (): number => gameRng.next();
const interact = createInteract();
const inv = createInventory(climbKit ? [...START_KIT, ...CLIMB_KIT] : START_KIT);
const needs = createNeedsSystem(bus, TUNING);
const body = createBodySystem(bus, rng, TUNING);
const camp = createCampSystem({ scene, map: MAP, interact, bus, inv, needs, clock, getPlayer, collider });
const use = createUseApi({ inv, needs, body, camp, bus, rng, getPlayer, getWeather: () => world.weather });
const panel = createInventoryPanel(ui, { inv, use });
const hud = createHud(ui);

// ------------------------------------------------------------------ Hatless, NPCs, sim feed, containers
const sim = { world, streams };
const hatless = createHatlessSystem({ scene, collider, bus, getPlayer, coarse });
const npcs = createNpcActors({ scene, collider, getPlayer });
const feed = createSimFeed({ sim, map: MAP, bus, clock, hatless, npcs, getPlayer });
createContainerSystem({ map: MAP, worldView, interact, sim, bus, panel, inv, getPlayer });

// ------------------------------------------------------------------ achievements, recap
createDaygAchievements({ bus, ui, getPlayer, clock });
const log = createEventLog(bus, clock, getPlayer);
const recap = createRecap(ui, log);

const regionName = (): string | null => (player.region ? world.graph.byId[player.region].name : null);
bus.on('route-placed', (e) => worldView.addRoute(e.route, e.fromY, e.topY));
bus.on('hint', (e) => hud.toast(e.text));
bus.on('player-shattered', (e) => {
  player.alive = false;
  recap.show(e.cause, regionName(), clock.day, clock.hourOfDay);
});

declare global { interface Window { __dayg?: unknown } }
window.__dayg = { player, needs, body, inv, sim, clock, bus, hatless, feed, camp, use, panel };

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
  touch.setVisible(!panel.isOpen() && player.alive);
  if (panel.isOpen() || use.busy() !== null || !player.alive) {
    inp.moveX = 0; inp.moveZ = 0;
    inp.sprint = false; inp.climb = false; inp.attack = false; inp.action = false;
  }

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
  const hint = controller.climbHint(player, mods);
  touch.setClimbHint(hint !== null);

  if (inp.attack && player.stamina >= STAMINA.attackCost) {
    const held = inv.held();
    const props = held ? getItem(held.def).props : undefined;
    hatless.strike(player.pos, player.facing, (props?.reach ?? FISTS.reach) + 0.6, props?.damage ?? FISTS.damage);
    player.stamina -= STAMINA.attackCost;
    bus.emit('noise', { x: player.pos.x, z: player.pos.z, radius: NOISE.attack, source: 'attack' });
  }
  if (inp.action) interact.trigger();

  rig.update(player.pos, inp, dt, player.stance === 'crouch');
  feed.update(dt, hours);
  hatless.update(dt, { night: clock.night, fog: world.weather.kind === 'fog' });
  npcs.update(dt);
  camp.update(dt, hours, world.weather);
  use.update(dt);

  const wet = RAIN.includes(world.weather.kind) ? (player.haven ? 0.5 : 1) : 0;
  needs.update(hours, {
    night: clock.night, weather: world.weather.kind, tempC: world.weather.tempC,
    nearFire: camp.nearFire(player.pos), inHaven: player.haven !== null,
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
  sky.update(clock, world.weather, player.pos, dt);

  const cur = interact.update(player.pos);
  hud.prompt(cur?.label() ?? climbHintText(hint) ?? null);
  hud.update({
    needs: needs.state, stamina: player.stamina, body: body.state,
    hourOfDay: clock.hourOfDay, day: clock.day, night: clock.night, season: clock.season,
    weather: world.weather.kind, regionName: regionName(), haven: player.haven, stance: player.stance,
    busy: use.busy(), carry: { weight: inv.weight(), capacity: inv.carryCapacity() },
  });
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
