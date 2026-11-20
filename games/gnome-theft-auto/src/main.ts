// Gnome Theft Auto: wiring only. Renderer, the frame loop and the glue between the modules (see types.ts for contracts).
import * as THREE from 'three';
import { getMyGnome, loadMyGnome } from '@lawn/gnome';
import { createAchievementTracker } from '@lawn/achievements';
import { play, setEngine, unlockAudio } from './audio';
import { createChaseCamera } from './camera';
import {
  BAIL_MIN_ALTITUDE, BIOME_NAMES, DEFAULT_LOOK, GUNS, HEAT, MOWER_TINTS, PLAYER, CRACK_LINES, STEAL_LINES, VIEW, CRACKED_TEXT,
} from './config';
import { createFx } from './fx';
import { createHud } from './hud';
import { createInput } from './input';
import { createNet, VEHICLE_CODES, type NetStatus } from './net';
import { createNpcs } from './npcs';
import { createPlayer, setChuteHook } from './player';
import { createWatch } from './police';
import { createRemotes } from './remotes';
import { createTraffic } from './traffic';
import type { BiomeId, Blip, CameraMode, Vehicle, VehicleKind } from './types';
import { collideVehicles, createVehicle, stepVehicle, syncVehicleMesh } from './vehicles';
import { createWeapons } from './weapons';
import { buildWorld } from './world';

await loadMyGnome();
const me = getMyGnome();
const myLook = me?.look ?? DEFAULT_LOOK;

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
const fx = createFx(scene);
const input = createInput(canvas, ui);
const chase = createChaseCamera(camera);
const player = createPlayer(scene, myLook);
player.respawn(world.spawn.x, world.spawn.z, world.spawn.yaw);
chase.yaw = world.spawn.yaw;
const weapons = createWeapons(scene, fx);
weapons.attachTo(player.hand());
const npcs = createNpcs(scene, world, fx);
const traffic = createTraffic(scene, world);
const watch = createWatch(scene, world, fx);
const achievements = createAchievementTracker({ ui });
setChuteHook(() => play('chute'));

const pickTint = (): number => MOWER_TINTS[Math.floor(Math.random() * MOWER_TINTS.length)];
const vehicles: Vehicle[] = world.parked.map((s) => createVehicle(scene, s.kind, s.x, s.z, s.yaw, pickTint()));
for (const s of world.airfield.planeSpots) vehicles.push(createVehicle(scene, 'plane', s.x, s.z, s.yaw));
const whirligig = createVehicle(scene, 'whirligig', world.base.padX, world.base.padZ, Math.PI);
vehicles.push(whirligig);

// ---- Online free roam: other players' gnomes and mowers; our bullets hurt them, theirs hurt us. ----
const remotes = createRemotes(scene);
let onlineText: string | null = null;
let hurtTimer = 0;
const net = createNet({
  onStatus(status: NetStatus, players: number) {
    onlineText = status === 'online' ? `Online: ${players} in Turfton` : status === 'unavailable' ? null : 'Connecting...';
  },
  onPeerJoin(p) { remotes.join(p); hud.toast(`${p.name} rolled into Turfton.`); },
  onPeerLeave(id) { remotes.leave(id); },
  onPeerPose(id, pose, t) { remotes.pose(id, pose, t); },
  onHit() {
    player.hurt(0.03);
    if (hurtTimer <= 0) play('crack');
    hurtTimer = 1.5;
  },
  onReset() { remotes.clear(); },
});
const roomParam = new URLSearchParams(location.search).get('room');
net.start(me?.name ?? 'Gnome', me?.code ?? 'gnorman', roomParam ? roomParam.toUpperCase() : null);

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

// ---- Helpers -----------------------------------------------------------------------------------------------------
const pickLine = (lines: readonly string[]): string => lines[Math.floor(Math.random() * lines.length)];

function nearestVehicle(): Vehicle | null {
  let best: Vehicle | null = null;
  let bestD: number = PLAYER.enterRange;
  for (const v of vehicles) {
    if (v.driver === 'player' || v.driver === 'remote') continue;
    if (Math.abs(v.y - player.y) > 2) continue;
    const d = Math.hypot(v.x - player.x, v.z - player.z) - (v.spec.radius - 1);
    if (d < bestD) { bestD = d; best = v; }
  }
  return best;
}

function getIn(v: Vehicle): void {
  if (v.driver === 'npc') {
    const out = traffic.ejectDriver(v);
    if (out) {
      const n = npcs.spawnFleeing(out.x, out.z, player.x, player.z, out.look);
      hud.toast(`${n.name}: "${pickLine(STEAL_LINES)}"`);
      watch.addHeat(HEAT.stealOccupied);
      void achievements.unlock('gta-borrowed');
    }
    play('steal');
  } else {
    play('door');
  }
  v.driver = 'player';
  player.enter(v);
  weapons.setVisible(false);
  if (!stats.driven.has(v.kind)) {
    stats.driven.add(v.kind);
    void achievements.increment('gta-collector');
  }
  if (v === whirligig && !stats.whirligigStolen) {
    stats.whirligigStolen = true;
    watch.addHeat(HEAT.stealWhirligig);
    hud.banner('WHIRLIGIG STOLEN');
    play('alarm');
    void achievements.unlock('gta-whirligig');
  } else {
    hud.toast(v.spec.name);
  }
}

function getOut(): void {
  const v = player.vehicle;
  if (!v) return;
  if (v.spec.flies && v.y > BAIL_MIN_ALTITUDE) {
    // Bail out in mid-air: the parachute opens by itself (see player.updateAir).
    v.driver = 'none';
    player.bail(v);
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
  v.driver = 'none';
  v.speed = 0;
  player.exit();
  weapons.setVisible(true);
  play('door');
}

/** A bullet at (x, y, z): crack whoever it hits. */
function hitTest(x: number, y: number, z: number): boolean {
  const n = npcs.hitTest(x, y, z);
  if (n) {
    const name = n.name;
    npcs.crack(n, player.x, player.z);
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
    if (watch.crack(o)) {
      stats.cracked++;
      void achievements.increment('gta-rainmaker');
      hud.toast(`${name}: "Off duty! Permanently!"`);
      play('crack');
    }
    watch.addHeat(HEAT.crackOfficer / 10);
    return true;
  }
  const r = remotes.hitTest(x, y, z);
  if (r) {
    net.hit(r.id);
    fx.crack(x, y, z, 0xc9824a);
    play('crack');
    return true;
  }
  return false;
}

function crackedUp(): void {
  fx.crack(player.x, player.y + 0.8, player.z);
  if (player.vehicle) {
    player.vehicle.driver = 'none';
    player.vehicle.speed = 0;
  }
  hud.banner(CRACKED_TEXT, 2500);
  hud.toast('The Glaze Clinic glued you back together and sent you home.');
  play('washed');
  void achievements.unlock('gta-washed-out');
  player.respawn(world.spawn.x, world.spawn.z, world.spawn.yaw);
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
let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const inp = input.read();

  // Enter / exit (no getting in or out while falling).
  const near = player.vehicle || player.airborne ? null : nearestVehicle();
  if (inp.enterExit && !player.airborne) {
    if (player.vehicle) getOut();
    else if (near) getIn(near);
  }
  if (inp.switchGun && !player.vehicle && !player.airborne) {
    weapons.switchGun();
    hud.toast(GUNS[weapons.gun].name);
  }

  // Move the player: on foot, in a vehicle, or falling / under a parachute.
  const v = player.airborne ? null : player.vehicle;
  if (player.airborne) {
    player.updateAir(inp, chase.yaw, dt, world);
    if (player.chute > 0.5) hadChute = true;
    setEngine(false, 0, false);
  } else if (v) {
    stepVehicle(v, { throttle: inp.moveY, steer: inp.moveX, lift: inp.lift }, dt, world);
    player.updateRiding(dt);
    setEngine(true, Math.abs(v.speed) / v.spec.maxSpeed, v.spec.flies, v.spec.kind === 'plane');
  } else {
    player.updateFoot(inp, chase.yaw, dt, world);
    setEngine(false, 0, false);
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

  // Biomes: a toast and an explorer count the first time each one is entered.
  const nowBiome = world.biomeAt(player.x, player.z);
  if (nowBiome !== biome) {
    biome = nowBiome;
    hud.toast('Entering ' + BIOME_NAMES[biome]);
    if (!visitedBiomes.has(biome)) {
      visitedBiomes.add(biome);
      void achievements.increment('gta-explorer');
    }
  }

  // Everyone else.
  traffic.update(dt, vehicles, world, player.x, player.z);
  collideVehicles(vehicles);
  for (const veh of vehicles) syncVehicleMesh(veh, dt);
  npcs.update(dt, world, player.x, player.z, vehicles);

  const b = world.base;
  const inBase = player.x > b.minX && player.x < b.maxX && player.z > b.minZ && player.z < b.maxZ;
  if (inBase && !stats.trespassed) {
    stats.trespassed = true;
    watch.addHeat(HEAT.trespass);
    hud.banner('FORT SANDPIT: TRESPASSER');
    play('alarm');
  }
  if (!inBase) stats.trespassed = false;

  const damage = watch.update(dt, { playerX: player.x, playerY: player.y, playerZ: player.z, playerVehicle: v }, world);
  if (damage > 0) player.hurt(damage);
  const level = Math.floor(watch.heat);
  if (level > lastHeatLevel) {
    play('whistle');
    hud.toast(level === 1 ? 'The Hat Watch has noticed you.' : `Hat Watch level ${level}!`);
    if (level >= 3) void achievements.unlock('gta-three-hats');
  }
  lastHeatLevel = level;

  // Guns: on foot or driving, bullets fly from the crosshair along the camera's aim. No firing while falling.
  chase.aimDir(aim);
  player.muzzle(muzzle);
  const firing = inp.fire;
  const reloadWasOn = weapons.reloading;
  if (inp.reload) weapons.reload();
  const ammoBefore = weapons.ammo;
  weapons.update(dt, firing && !player.airborne, muzzle, camera.position, aim, hitTest, world);
  if (weapons.ammo < ammoBefore) {
    play(weapons.gun === 'shotgun' ? 'shotgun' : 'gunshot');
    chase.kick(GUNS[weapons.gun].recoil);
  }
  if (weapons.reloading && !reloadWasOn) play('reload');
  fx.update(dt);
  world.update(dt, player.x, player.z);
  remotes.update(dt);
  hurtTimer = Math.max(0, hurtTimer - dt);
  const chuteOpen = player.airborne && player.chute > 0.5;
  net.setPose({
    x: player.x, y: v ? v.y : player.y, z: player.z, yaw: v ? v.yaw : player.yaw,
    veh: v ? VEHICLE_CODES.indexOf(v.kind) : -1, tint: v ? v.tint : 0,
    moving: Math.abs(inp.moveX) + Math.abs(inp.moveY) > 0.1, aiming: firing && !v, hurt: hurtTimer > 0,
    chute: chuteOpen,
  });

  if (player.health <= 0) crackedUp();

  // Camera.
  const mode: CameraMode = player.airborne ? 'chute' : v ? (v.spec.flies ? 'fly' : 'drive') : 'foot';
  input.setMode(mode);
  const enterLabel = v ? 'Exit' : near ? (near.driver === 'npc' ? 'Steal' : 'Drive') : null;
  input.setEnterLabel(enterLabel);
  if (v) target.set(v.x, v.y, v.z);
  else target.set(player.x, player.y, player.z);
  chase.update(dt, target, v ? v.yaw : player.yaw, mode, inp, world);

  // HUD.
  const blips: Blip[] = [{ x: whirligig.x, z: whirligig.z, color: '#ff4fd8' }];
  for (const veh of vehicles) {
    if (veh.driver !== 'none' || veh === whirligig) continue;
    blips.push({ x: veh.x, z: veh.z, color: veh.kind === 'plane' ? '#ffffff' : '#ffd23f' });
  }
  for (const r of remotes.blips()) blips.push({ x: r.x, z: r.z, color: '#7cf0ff' });
  hud.set({
    heat: level,
    health: player.health,
    ammo: weapons.ammo, mag: weapons.mag, reloading: weapons.reloading,
    gun: GUNS[weapons.gun].name,
    altitude: player.airborne ? player.y : v && v.spec.flies ? v.y : null,
    speed: v ? Math.round(Math.abs(v.speed)) : null,
    chute: chuteOpen,
    biome: BIOME_NAMES[biome],
    vehicle: v ? v.spec.name : null,
    cracked: stats.cracked,
    prompt: near ? `${near.driver === 'npc' ? 'Steal' : 'Drive'} ${near.spec.name}` : null,
    player: { x: player.x, z: player.z, yaw: v ? v.yaw : player.yaw },
    blips,
    online: onlineText,
  });

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

hud.toast('Welcome to Turfton. Mowers are for borrowing.', 4000);
requestAnimationFrame(frame);

// Test hook for scripted checks and demos: ?debug exposes the live objects.
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as Record<string, unknown>).__gta = { player, vehicles, npcs, watch, world, chase, hud, weapons, aim, muzzle };
}
