// Gnome Theft Auto: wiring only. Renderer, the frame loop and the glue between the modules (see types.ts for contracts).
import * as THREE from 'three';
import { getMyGnome, loadMyGnome } from '@lawn/gnome';
import { createAchievementTracker } from '@lawn/achievements';
import { play, setEngine, setSkid, unlockAudio } from './audio';
import { createChaseCamera } from './camera';
import {
  BAIL_MIN_ALTITUDE, BIOME_NAMES, DEFAULT_LOOK, GUNS, HEAT, HOSPITAL, MOWER_TINTS, VEHICLE_SHOT_DAMAGE, PLAYER, CRACK_LINES, RUNOVER_LINES, STEAL_LINES, VIEW, CRACKED_TEXT,
} from './config';
import { createFx } from './fx';
import { clearHandsUp } from './gnomes';
import { createHud } from './hud';
import { createCutscene } from './quests/cutscene';
import { createQuests } from './quests/quests';
import { createInput } from './input';
import { createSimDrive, getSetup, getTune, resetSetup, setSetup, setTune, simActive, stepSimDrive, updateRiderLean } from './simdrive';
import { createOptions } from './options';
import { createNet, VEHICLE_CODES, type NetStatus } from './net';
import { createNpcs } from './npcs';
import { createPlayer, setChuteHook } from './player';
import { createAmbulances } from './ambulance';
import { createWatch } from './police';
import { createRemotes } from './remotes';
import { createTraffic } from './traffic';
import type { BiomeId, Blip, CameraMode, Vehicle, VehicleKind } from './types';
import { collideVehicles, createVehicle, damageVehicle, explodeVehicle, repairVehicle, setDamageHook, stepVehicle, syncVehicleMesh } from './vehicles';
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
const input = createInput(canvas, ui, { handbrake: simActive });
const chase = createChaseCamera(camera);
const player = createPlayer(scene, myLook);
player.respawn(world.spawn.x, world.spawn.z, world.spawn.yaw);
chase.yaw = world.spawn.yaw;
const weapons = createWeapons(scene, fx);
weapons.attachTo(player.hand());
const npcs = createNpcs(scene, world, fx);
const traffic = createTraffic(scene, world);
const watch = createWatch(scene, world, fx);
const ambulances = createAmbulances(scene, world, fx);
const achievements = createAchievementTracker({ ui });
// Quests: data in quests/defs.ts; the cutscene plays when the player enters a giver's building.
const cutscene = createCutscene(scene, ui, { setUiVisible(v) { hud.setVisible(v); input.setVisible(v); } });
const quests = createQuests({
  scene, world, npcs, hud, cutscene,
  placePlayer(x, z, yaw) {
    player.respawn(x, z, yaw);
    chase.yaw = yaw;
    weapons.setVisible(true);
  },
  unlock(id) { void achievements.unlock(id); },
  play(sfx) { play(sfx); },
});
setChuteHook(() => play('chute'));

const pickTint = (): number => MOWER_TINTS[Math.floor(Math.random() * MOWER_TINTS.length)];
// Crashes dent and wreck mowers (the model swaps through the prefab's damage stages); say so when it is the player's.
setDamageHook((v, level, name) => {
  if (v === player.vehicle) {
    hud.toast(`${v.spec.name}: ${name}!`);
    play(level > 1 ? 'alarm' : 'bump');
  }
});
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
  if (simActive() && !v.spec.flies) v.sim = createSimDrive(v);
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
  v.sim = undefined;
  player.exit();
  weapons.setVisible(true);
  play('door');
}

/** A vehicle shot to pieces: fireball, its driver cracks, and the wreck stays behind charred and burning. */
function blowUp(v: Vehicle): void {
  fx.explode(v.x, v.y + 0.5, v.z);
  play('boom');
  const out = traffic.ejectDriver(v);
  if (out) {
    fx.crack(out.x, 0.8, out.z, out.look.shirt);
    ambulances.dispatch(out.x, out.z, out.look.shirt);
    stats.cracked++;
  }
  explodeVehicle(v);
  watch.addHeat(0.5);
  hud.toast(`${v.spec.name} goes up in flames!`);
  void achievements.unlock('gta-kaboom');
}

/** A bullet at (x, y, z): crack whoever it hits. */
function hitTest(x: number, y: number, z: number): boolean {
  const n = npcs.hitTest(x, y, z);
  if (n) {
    const name = n.name;
    ambulances.dispatch(n.x, n.z, n.look.shirt);
    quests.onCracked(n);
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
      damageVehicle(v, VEHICLE_SHOT_DAMAGE[weapons.gun]);
      if (v.hp <= 0) blowUp(v);
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
  return false;
}

// Death: the gnome cracks apart, the screen goes black and white, the camera pans over the body while the ambulance
// comes, then the player wakes at the hospital.
const DEATH_SECONDS = 5.5;
let deathT = 0;
let deathTarget = { x: 0, y: 0, z: 0 };

function crackedUp(): void {
  deathT = DEATH_SECONDS;
  if (player.vehicle) {
    const dv = player.vehicle;
    player.exit();
    dv.driver = 'none';
    dv.speed = 0;
    dv.sim = undefined;
  }
  deathTarget = { x: player.x, y: player.y, z: player.z };
  fx.crack(player.x, player.y + 0.8, player.z);
  ambulances.dispatch(player.x, player.z, myLook.shirt, true);
  player.model.object.visible = false;
  weapons.setVisible(false);
  watch.clear();
  canvas.style.transition = 'filter 0.8s';
  canvas.style.filter = 'grayscale(1) contrast(1.15) brightness(0.9)';
  hud.banner(CRACKED_TEXT, 4200);
  play('washed');
  void achievements.unlock('gta-washed-out');
}

function wakeAtHospital(): void {
  deathT = 0;
  canvas.style.filter = '';
  hud.toast('The Glaze Clinic glued you back together. Welcome to the hospital.');
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
let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const rawInp = input.read();
  // A cutscene owns the screen: any key or tap skips it, and the game stands still.
  cutscene.update(dt, camera);
  if (cutscene.active) {
    if (rawInp.jump || rawInp.enterExit || rawInp.fire) cutscene.skip();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
    return;
  }
  // Dead: no controls; the camera pans slowly round the body instead.
  const inp = deathT > 0
    ? { ...rawInp, moveX: 0, moveY: 0, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false, reload: false,
        camYaw: dt * 0.5, camPitch: (0.75 - chase.pitch) * dt * 0.9 }
    : rawInp;
  if (deathT > 0) {
    deathT -= dt;
    if (deathT <= 0) wakeAtHospital();
  }

  // Enter / exit (no getting in or out while falling).
  const near = player.vehicle || player.airborne ? null : nearestVehicle();
  const giverPrompt = player.vehicle || player.airborne || deathT > 0 ? null : quests.prompt(player.x, player.z);
  if (inp.enterExit && !player.airborne) {
    if (player.vehicle) getOut();
    else if (giverPrompt) quests.interact(player.x, player.z);
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
    if (v.sim) {
      if (stepSimDrive(v, v.sim, inp, dt, world)) hud.toast(`${v.spec.name}: back on its wheels.`);
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
    player.updateRiding(dt, updateRiderLean(v, dt));
    setEngine(true, Math.abs(v.speed) / v.spec.maxSpeed, v.spec.flies, v.spec.kind === 'plane');
  } else {
    player.updateFoot(inp, chase.yaw, dt, world);
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
  for (const w of vehicles) {
    if (!w.exploded || Math.hypot(w.x - player.x, w.z - player.z) > 160) continue;
    fx.fire(w.x, w.y + 0.5, w.z, w.spec.radius);
    fx.fire(w.x, w.y + 0.8, w.z, w.spec.radius * 0.6);
  }
  quests.update(dt, player.x, player.z);
  fx.update(dt);
  ambulances.update(dt, player.x, player.z);
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

  if (player.health <= 0 && deathT <= 0) crackedUp();

  // Camera.
  const mode: CameraMode = player.airborne ? 'chute' : v ? (v.spec.flies ? 'fly' : 'drive') : 'foot';
  input.setMode(mode);
  const enterLabel = v ? 'Exit' : giverPrompt ? 'Enter' : near ? (near.driver === 'npc' ? 'Steal' : 'Drive') : null;
  input.setEnterLabel(enterLabel);
  if (v) target.set(v.x, v.y, v.z);
  else if (deathT > 0) target.set(deathTarget.x, deathTarget.y, deathTarget.z);
  else target.set(player.x, player.y, player.z);
  chase.update(dt, target, v ? v.yaw : player.yaw, mode, inp, world);

  // HUD.
  const blips: Blip[] = [{ x: whirligig.x, z: whirligig.z, color: '#ff4fd8' }, { x: HOSPITAL.x, z: HOSPITAL.z, color: '#ff3b3b' }];
  for (const veh of vehicles) {
    if (veh.driver !== 'none' || veh === whirligig) continue;
    blips.push({ x: veh.x, z: veh.z, color: veh.kind === 'plane' ? '#ffffff' : '#ffd23f' });
  }
  blips.push(...quests.blips());
  if (!questHinted && performance.now() > 4000) {
    questHinted = true;
    const hint = quests.hint();
    if (hint) hud.toast(hint, 8000);
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
    prompt: giverPrompt ?? (near ? `${near.driver === 'npc' ? 'Steal' : 'Drive'} ${near.spec.name}` : null),
    player: { x: player.x, z: player.z, yaw: v ? v.yaw : player.yaw },
    blips,
    online: onlineText,
  });

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// Options > Cheats > Driving realism. Picking a mode rebuilds the chassis of the vehicle being driven, keeping its place, heading and speed.
function refreshDriving(): void {
  const pv = player.vehicle;
  if (pv && !pv.spec.flies) pv.sim = simActive() ? createSimDrive(pv) : undefined;
  input.refresh();
}
createOptions(ui, (t) => {
  setTune(t.id);
  refreshDriving();
  hud.toast(`Driving realism: ${t.name}`);
});

// ?mount (or ?mount=push-bike|zero-turn|combine): start already driving that parked vehicle, a ride-on by default, at the south end of the x = 0 road (for demos and scripted checks).
// ?herd: stand a crowd of townsgnomes ahead of the player (on the road ahead of the mower with ?mount), for the ragdoll demo.
const startParams = new URLSearchParams(location.search);
if (startParams.has('mount')) {
  const m = vehicles.find((x) => x.kind === (startParams.get('mount') || 'ride-on')) ?? vehicles.find((x) => x.kind === 'ride-on');
  if (m) {
    m.x = 0; m.z = startParams.has('herd') ? -100 : -115; m.yaw = 0;
    player.respawn(m.x + 2, m.z, 0);
    getIn(m);
    chase.yaw = 0;
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

hud.toast('Welcome to Turfton. Mowers are for borrowing.', 4000);
requestAnimationFrame(frame);

// Test hook for scripted checks and demos: ?debug exposes the live objects.
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as Record<string, unknown>).__gta = {
    // Garage (no UI yet): read or change a vehicle model's setup knobs, then the driven chassis is rebuilt to feel it. Mode: setMode('arcade' | 'casual' | ...).
    garage: { get: getSetup, set: (k: VehicleKind, patch: Record<string, number>) => { const r = setSetup(k, patch); refreshDriving(); return r; }, reset: (k: VehicleKind) => { const r = resetSetup(k); refreshDriving(); return r; } },
    setMode: (id: string) => { setTune(id); refreshDriving(); return getTune().id; },
    damageVehicle, repairVehicle, spawn: (k: VehicleKind, x: number, z: number, yaw: number) => { const nv = createVehicle(scene, k, x, z, yaw, 0xd8342c); vehicles.push(nv); return nv; }, player, vehicles, npcs, watch, world, chase, hud, weapons, aim, muzzle };
}
