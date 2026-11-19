// Gnome Theft Auto: wiring only. Renderer, the frame loop and the glue between the modules (see types.ts for contracts).
import * as THREE from 'three';
import { getMyGnome, loadMyGnome } from '@lawn/gnome';
import { createAchievementTracker } from '@lawn/achievements';
import { play, setEngine, unlockAudio } from './audio';
import { createChaseCamera } from './camera';
import { DEFAULT_LOOK, HEAT, MOWER_TINTS, PLAYER, SOAK_LINES, STEAL_LINES, WASHED_OUT_TEXT } from './config';
import { createFx } from './fx';
import { createHud } from './hud';
import { createInput } from './input';
import { createNet, VEHICLE_CODES, type NetStatus } from './net';
import { createNpcs } from './npcs';
import { createPlayer } from './player';
import { createWatch } from './police';
import { createRemotes } from './remotes';
import { createTraffic } from './traffic';
import type { Blip, CameraMode, Vehicle, VehicleKind } from './types';
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
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const world = buildWorld(scene, renderer);
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
const hud = createHud(ui);
const achievements = createAchievementTracker({ ui });

const pickTint = (): number => MOWER_TINTS[Math.floor(Math.random() * MOWER_TINTS.length)];
const vehicles: Vehicle[] = world.parked.map((s) => createVehicle(scene, s.kind, s.x, s.z, s.yaw, pickTint()));
const whirligig = createVehicle(scene, 'whirligig', world.base.padX, world.base.padZ, Math.PI);
vehicles.push(whirligig);

// ---- Online free roam: other players' gnomes and mowers; our water soaks them, theirs soaks us. ----
const remotes = createRemotes(scene);
let onlineText: string | null = null;
let soakedTimer = 0;
const net = createNet({
  onStatus(status: NetStatus, players: number) {
    onlineText = status === 'online' ? `Online: ${players} in Turfton` : status === 'unavailable' ? null : 'Connecting...';
  },
  onPeerJoin(p) { remotes.join(p); hud.toast(`${p.name} rolled into Turfton.`); },
  onPeerLeave(id) { remotes.leave(id); },
  onPeerPose(id, pose, t) { remotes.pose(id, pose, t); },
  onHit() {
    player.soak(0.03);
    if (soakedTimer <= 0) play('splash');
    soakedTimer = 1.5;
  },
  onReset() { remotes.clear(); },
});
const roomParam = new URLSearchParams(location.search).get('room');
net.start(me?.name ?? 'Gnome', me?.code ?? 'gnorman', roomParam ? roomParam.toUpperCase() : null);

const stats = { soaked: 0, driven: new Set<VehicleKind>(), whirligigStolen: false, trespassed: false };

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
  if (v.spec.flies && v.y > 1.5) {
    hud.toast('Land first. Gnomes do not bounce.');
    return;
  }
  v.driver = 'none';
  v.speed = 0;
  player.exit();
  weapons.setVisible(true);
  play('door');
}

/** A droplet at (x, y, z): soak whoever it hits. */
function hitTest(x: number, y: number, z: number): boolean {
  const n = npcs.hitTest(x, y, z);
  if (n) {
    if (npcs.soak(n, player.x, player.z)) {
      stats.soaked++;
      watch.addHeat(HEAT.soakPedestrian);
      void achievements.increment('gta-rainmaker');
      if (Math.random() < 0.5) hud.toast(`${n.name}: "${pickLine(SOAK_LINES)}"`);
      play('splash');
    }
    return true;
  }
  const o = watch.hitTest(x, y, z);
  if (o) {
    if (watch.soak(o, player.x, player.z)) {
      stats.soaked++;
      void achievements.increment('gta-rainmaker');
      hud.toast(`${o.name}: "Hands up! I am off duty!"`);
    }
    watch.addHeat(HEAT.soakOfficer / 10);
    return true;
  }
  const r = remotes.hitTest(x, y, z);
  if (r) {
    net.hit(r.id);
    return true;
  }
  return false;
}

function washedOut(): void {
  if (player.vehicle) {
    player.vehicle.driver = 'none';
    player.vehicle.speed = 0;
  }
  hud.banner(WASHED_OUT_TEXT, 2500);
  hud.toast('The Glaze Clinic wrung you out and sent you home.');
  play('washed');
  void achievements.unlock('gta-washed-out');
  player.respawn(world.spawn.x, world.spawn.z, world.spawn.yaw);
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

  // Enter / exit.
  const near = player.vehicle ? null : nearestVehicle();
  if (inp.enterExit) {
    if (player.vehicle) getOut();
    else if (near) getIn(near);
  }
  if (inp.switchGun && !player.vehicle) {
    weapons.switchGun();
    hud.toast(weapons.gun === 'super-soaker' ? 'Pump Soaker' : 'Squirt Pistol');
  }

  // Move the player.
  const v = player.vehicle;
  if (v) {
    stepVehicle(v, { throttle: inp.moveY, steer: inp.moveX, lift: inp.lift }, dt, world);
    player.updateRiding(dt);
    setEngine(true, Math.abs(v.speed) / v.spec.maxSpeed, v.spec.flies);
  } else {
    player.updateFoot(inp, chase.yaw, dt, world);
    setEngine(false, 0, false);
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

  const soak = watch.update(dt, { playerX: player.x, playerY: player.y, playerZ: player.z, playerVehicle: v }, world);
  if (soak > 0) player.soak(soak);
  const level = Math.floor(watch.heat);
  if (level > lastHeatLevel) {
    play('whistle');
    hud.toast(level === 1 ? 'The Hat Watch has noticed you.' : `Hat Watch level ${level}!`);
    if (level >= 3) void achievements.unlock('gta-three-hats');
  }
  lastHeatLevel = level;

  // Water guns: on foot, aim where the camera looks; while driving, squirt straight ahead.
  if (v) aim.set(Math.sin(v.yaw), 0.05, Math.cos(v.yaw)).normalize();
  else chase.aimDir(aim);
  player.muzzle(muzzle);
  const firing = inp.fire;
  if (firing && weapons.tank > 0.01 && Math.random() < dt * 8) play('squirt');
  weapons.update(dt, firing, muzzle, aim, hitTest, world);
  fx.update(dt);
  world.update(dt);
  remotes.update(dt);
  soakedTimer = Math.max(0, soakedTimer - dt);
  net.setPose({
    x: player.x, y: player.y, z: player.z, yaw: v ? v.yaw : player.yaw,
    veh: v ? VEHICLE_CODES.indexOf(v.kind) : -1, tint: v ? v.tint : 0,
    moving: Math.abs(inp.moveX) + Math.abs(inp.moveY) > 0.1, aiming: firing && !v, soaked: soakedTimer > 0,
  });

  if (player.dryness <= 0) washedOut();

  // Camera.
  const mode: CameraMode = v ? (v.spec.flies ? 'fly' : 'drive') : 'foot';
  input.setMode(mode);
  const enterLabel = v ? 'Exit' : near ? (near.driver === 'npc' ? 'Steal' : 'Drive') : null;
  input.setEnterLabel(enterLabel);
  if (v) target.set(v.x, v.y, v.z);
  else target.set(player.x, player.y, player.z);
  chase.update(dt, target, v ? v.yaw : player.yaw, mode, inp, world);

  // HUD.
  const blips: Blip[] = [{ x: whirligig.x, z: whirligig.z, color: '#ff4fd8' }];
  for (const veh of vehicles) if (veh.driver === 'none' && veh !== whirligig) blips.push({ x: veh.x, z: veh.z, color: '#ffd23f' });
  for (const r of remotes.blips()) blips.push({ x: r.x, z: r.z, color: '#7cf0ff' });
  hud.set({
    heat: level,
    dryness: player.dryness,
    tank: weapons.tank,
    gun: weapons.gun === 'super-soaker' ? 'Pump Soaker' : 'Squirt Pistol',
    vehicle: v ? v.spec.name : null,
    soaked: stats.soaked,
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
