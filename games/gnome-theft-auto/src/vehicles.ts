// Mower models and driving / flying physics for Gnome Theft Auto.
import * as THREE from 'three';
import { buildPrefab, colorOf, getPrefab, prefabDamageLevels, setPrefabDamage } from '@lawn/prefabs';
import { FLY, GROUND_DRAG, MOUNT, MOWER_TINTS, VEHICLES } from './config';
import { play } from './audio';
import { clampToWorld, sweepCircleBoxes, wallBounce } from './collide';
import { seatPos } from './seats';
import { coverLift } from './seatCover';
import { surfaceAt } from './surfaces';
import { aboveGround, groundAt, heightAt, normalAt } from './terrain';
import { floatHeight, initBoat, stepBoat } from './boats';
import { checkSink } from './swim';
import { hopVelocity, SKIM, skimSurfaceAt, stepSkim } from './skim';
import { GLAZE_KINDS, isCraftKind } from './glazeStore';
import { initAir, PLANE_REVERSE_FRAC } from './craft/flight';
import { stepAircraft } from './craft/aircraft';
import { createSuspension, stepSuspension, type SuspensionBody } from './suspension';
import { poseControl, registerDriveControls } from './driveGrips';
import { clearWaterlog, waterlogSpeedMult } from './waterlog';
import { forgetLostParts, hideLostParts, restoreLostParts, stripLooseParts } from './debris';
import {
  attachLoadout, buildGlazeBody, defaultLoadout, normalizeLoadout, resolveBodyPrefab, setWheelPose, type GlazeRig, type Loadout,
} from '@lawn/glaze';
import type { DriveControls, Vehicle, VehicleKind, World } from './types';

// The Pay 'n' Glaze mounts and every vehicle's driving control (driveGrips.ts): body variants must exist before the first build.
registerDriveControls();

let nextId = 1;

/** Named pivots of one vehicle's body (any may be missing for a given prefab). */
interface Pivots {
  /** wheel-0 .. wheel-3 (index 2 and 3 are the front wheels). */
  wheels: (THREE.Object3D | undefined)[];
  blade?: THREE.Object3D;
  handle?: THREE.Object3D;
  steer?: THREE.Object3D;
  reel?: THREE.Object3D;
  rotor?: THREE.Object3D;
  tailRotor?: THREE.Object3D;
  /** A fixed-wing plane's propeller (spins about its local z axis). */
  prop?: THREE.Object3D;
  /** Closed vehicles' door hinges, by pivot name (door-left, door-right). */
  doors: Partial<Record<string, THREE.Object3D>>;
  /** Main rotor spin, rad/s; eases to 0 after the pilot leaves and the flyer lands. */
  rotorSpin: number;
  /** Propeller spin, rad/s. */
  propSpin: number;
}

const pivotsById = new Map<number, Pivots>();

const ROTOR_SPIN = 30;
/** Rotor slows from ROTOR_SPIN to 0 over 2 s. */
const ROTOR_SPIN_DOWN = ROTOR_SPIN / 2;
/** Propeller spins up to PROP_SPIN and winds down to 0 over 2 s. */
const PROP_SPIN = 40;
const PROP_SPIN_DOWN = PROP_SPIN / 2;
const WHEEL_RADIUS = 0.3;
/** A wall hit below this speed (units/s) does no damage; above it, each unit of speed over costs 1/CRASH_SCALE of the hit points. */
export const CRASH_MIN = 5;
export const CRASH_SCALE = 45;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** A named pivot group (a prefab pivot is a Group; a plain part that shares the name, like the teacup's 'handle' ring, is a Mesh and must not turn). */
function pivotNamed(body: THREE.Object3D, name: string): THREE.Object3D | undefined {
  const o = body.getObjectByName(name);
  return o && !(o as THREE.Mesh).isMesh ? o : undefined;
}

function capturePivots(body: THREE.Object3D, rotorSpin: number, propSpin: number): Pivots {
  const handle = pivotNamed(body, 'handle');
  const steer = pivotNamed(body, 'steer');
  // driverHands.ts reads the pivot the driver's control turns on from here (picked up again after every rebuild).
  body.userData.controlPivot = steer ?? handle;
  // A damage stage may have bent the control (a morph): poseControl turns it on top of that rest pose.
  for (const o of [steer, handle]) if (o && !o.userData.restQ) o.userData.restQ = o.quaternion.clone();
  return {
    wheels: ['wheel-0', 'wheel-1', 'wheel-2', 'wheel-3'].map((n) => body.getObjectByName(n)),
    blade: body.getObjectByName('blade'),
    handle,
    steer,
    reel: body.getObjectByName('reel'),
    rotor: body.getObjectByName('rotor'),
    tailRotor: body.getObjectByName('tail-rotor'),
    prop: body.getObjectByName('prop'),
    doors: { 'door-left': body.getObjectByName('door-left'), 'door-right': body.getObjectByName('door-right') },
    rotorSpin,
    propSpin,
  };
}

// ---- Damage: hit points drive the prefab's damage level (see PrefabDef.damage in @lawn/prefabs). ---------------------
type DamageHook = (v: Vehicle, level: number, stageName: string) => void;
let damageHook: DamageHook | null = null;
/** Called when a vehicle reaches a new damage level (the game toasts it for the player's own mower). */
export function setDamageHook(h: DamageHook | null): void { damageHook = h; }

/** Parts coming off (fleetRuntime.ts wires these to debris.ts, so a broken-off wheel is a real object that falls and rests on the ground). */
export interface PartsHooks {
  /** A damage level is about to RISE from `fromLevel` to `toLevel`: `body` (the prefab root) still has every part of `fromLevel`. */
  beforeDamage(v: Vehicle, body: THREE.Group, fromLevel: number, toLevel: number): void;
  /** v was just blown up (explodeVehicle), before its materials are charred. */
  exploded(v: Vehicle): void;
  /** A hard hit on v's side (nx, nz), a unit direction from the vehicle centre toward the hit, at `impact` m/s. */
  knock?(v: Vehicle, nx: number, nz: number, impact: number): void;
}
let partsHooks: PartsHooks | null = null;
export function setPartsHooks(h: PartsHooks | null): void { partsHooks = h; }

/** A hard hit on v's side (nx, nz) toward the hit: a loose part may come off there (the hooks decide). Exploded wrecks skip it. */
export function knockParts(v: Vehicle, nx: number, nz: number, impact: number): void {
  if (v.exploded) return;
  partsHooks?.knock?.(v, nx, nz, impact);
}

/** Damage level for a hit-point fraction: with n stages, hp 1 is level 0 and the levels split the rest evenly (0 hp = wrecked). */
export function damageLevelFor(hp: number, stages: number): number {
  if (hp <= 0) return stages;
  return Math.min(stages, Math.floor((1 - hp) * (stages + 1)));
}

function applyDamageLevel(v: Vehicle, level: number): void {
  const body = v.object.children[0] as THREE.Group | undefined;
  if (!body || body.userData.damage === undefined) return;
  const old = pivotsById.get(v.id);
  if (level > v.damage) partsHooks?.beforeDamage(v, body, v.damage, level);
  setPrefabDamage(body, level);
  // Parts a stage only lays beside the model (a fallen tyre) would ride along with it: debris.ts throws real ones instead.
  stripLooseParts(body);
  // setPrefabDamage rebuilt the body's children: dress them again.
  v.rig?.apply();
  // Parts knocked off earlier stay off through the rebuild.
  hideLostParts(v);
  v.damage = level;
  // The rebuilt model has new pivot objects: pick them up again (keeping the rotor and propeller spin).
  pivotsById.set(v.id, capturePivots(body, old?.rotorSpin ?? 0, old?.propSpin ?? 0));
  body.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  const name = getPrefab(v.spec.prefab)?.damage?.[level - 1]?.name;
  if (level > 0 && name) damageHook?.(v, level, name);
}

/** Take hit points off (0..1 scale: 1 = a whole new mower). Swaps the model when a damage level is crossed. */
export function damageVehicle(v: Vehicle, amount: number): void {
  if (amount <= 0) return;
  const stages = prefabDamageLevels(getPrefab(v.spec.prefab)!);
  if (stages === 0) return;
  v.hp = Math.max(0, v.hp - amount);
  const level = damageLevelFor(v.hp, stages);
  if (level !== v.damage) applyDamageLevel(v, level);
}

/** Shot to pieces: every material goes charcoal black, the driver is gone and the wreck stays put (the game adds the fire). */
export function explodeVehicle(v: Vehicle): void {
  if (v.exploded) return;
  v.exploded = true;
  partsHooks?.exploded(v);
  v.hp = 0;
  v.speed = 0;
  v.driver = 'none';
  if (v.rider) {
    v.object.remove(v.rider.object);
    v.rider = null;
    v.riderLook = null;
  }
  v.object.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    const charred = mats.map((mat) => {
      const c = mat.clone() as THREE.MeshStandardMaterial;
      if (c.color) c.color.setHex(0x151515);
      if (c.emissive) c.emissive.setHex(0x000000);
      if ('map' in c) c.map = null;
      c.transparent = false;
      c.opacity = 1;
      return c;
    });
    m.material = Array.isArray(m.material) ? charred : charred[0];
  });
}

/** Mend some hit points (0..1 scale), capped at 1; the model steps back down the damage levels it no longer has (E08 Rust Oil). */
export function mendVehicle(v: Vehicle, amount: number): void {
  if (amount <= 0 || v.exploded) return;
  v.hp = Math.min(1, v.hp + amount);
  const stages = prefabDamageLevels(getPrefab(v.spec.prefab)!);
  if (stages === 0) return;
  const level = damageLevelFor(v.hp, stages);
  if (level !== v.damage) applyDamageLevel(v, level);
}

/** Back to new: full hit points and the undamaged model. */
export function repairVehicle(v: Vehicle): void {
  v.hp = 1;
  clearWaterlog(v);
  // Knocked-off parts come back on repair: show them (a repair at damage 0 does not rebuild), then forget them.
  restoreLostParts(v);
  forgetLostParts(v);
  if (v.damage !== 0) applyDamageLevel(v, 0);
}

/** Repaint a vehicle: rebuilds the prefab body with the new tint, preserving damage stage and pivots. */
export function repaintVehicle(v: Vehicle, tint: number): void {
  if (v.exploded) return;
  if (v.rig && v.look) {
    setVehicleLook(v, { ...v.look, paint: tint });
    return;
  }
  v.tint = tint;
  const oldBody = v.object.children[0] as THREE.Group | undefined;
  const old = pivotsById.get(v.id);
  if (oldBody) v.object.remove(oldBody);
  const body = buildPrefab(resolveBodyPrefab(v.spec.prefab), { scale: v.spec.scale, tint });
  if (v.damage > 0 && body.userData.damage !== undefined) {
    setPrefabDamage(body, v.damage);
    stripLooseParts(body);
  }
  body.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  v.object.add(body);
  // Keep the body the first child (code reads v.object.children[0]).
  v.object.children.splice(v.object.children.indexOf(body), 1);
  v.object.children.unshift(body);
  pivotsById.set(v.id, capturePivots(body, old?.rotorSpin ?? 0, old?.propSpin ?? 0));
}

const HEADLIGHT_BULB_GEO = new THREE.SphereGeometry(0.11, 6, 4);
const HEADLIGHT_BULB_MAT = new THREE.MeshBasicMaterial({ color: 0xfff3b8 });
const HEADLIGHT_BEAM_GEO = new THREE.ConeGeometry(0.9, 5.5, 10, 1, true);
const HEADLIGHT_BEAM_MAT = new THREE.MeshBasicMaterial({
  color: 0xfff1b0,
  transparent: true,
  opacity: 0.14,
  depthWrite: false,
  side: THREE.DoubleSide,
});

function buildHeadlights(radius: number): THREE.Group {
  const g = new THREE.Group();
  const fz = Math.max(0.65, radius * 0.65);
  for (const sx of [-0.32, 0.32]) {
    const bulb = new THREE.Mesh(HEADLIGHT_BULB_GEO, HEADLIGHT_BULB_MAT);
    bulb.position.set(sx, 0.52, fz);
    g.add(bulb);
    const beam = new THREE.Mesh(HEADLIGHT_BEAM_GEO, HEADLIGHT_BEAM_MAT);
    beam.rotation.x = -Math.PI / 2 + 0.08;
    beam.position.set(sx, 0.56, fz + 2.75);
    g.add(beam);
  }
  g.visible = false;
  return g;
}

/** Switch every vehicle's headlights to `on` (dusk and night); `forceOn` is one vehicle shown lit regardless (the Pay 'n' Glaze showroom's beam preview). */
export function setVehicleHeadlights(vehicles: Vehicle[], on: boolean, forceOn: Vehicle | null = null): void {
  for (const v of vehicles) {
    if (v.headlights) v.headlights.visible = (on || v === forceOn) && !v.exploded;
  }
}

/** Swings a closed vehicle's door (its named pivot) open, 0 shut .. 1 open. Left doors swing one way, right doors the other. */
export function setDoorOpen(v: Vehicle, pivot: string, open: number): void {
  const hinge = pivotsById.get(v.id)?.doors[pivot];
  if (!hinge) return;
  const side = pivot.endsWith('left') ? -1 : 1;
  hinge.rotation.y = side * Math.max(0, Math.min(1, open)) * MOUNT.doorAngle;
}

/** Ground vehicles Pay 'n' Glaze dresses (GLAZE_KINDS). Flyers and boats keep the old build path. */
const dressed = (spec: Vehicle['spec']): boolean => GLAZE_KINDS.includes(spec.kind);

/** The four kinds the game always tinted with the caller's colour; the other dressed kinds keep their prefab's own colours, whatever tint a caller passes (it was never drawn for them). */
const TINTED_KINDS: readonly string[] = ['push-bike', 'ride-on', 'zero-turn', 'lowrider', 'golf-cart'];

/** The paint a dressed vehicle starts in: the tinted kinds wear the caller's tint (else the first mower tint); the rest wear their prefab's own tint, so they look exactly as before. */
function stockPaint(spec: Vehicle['spec'], tint?: number): number {
  if (TINTED_KINDS.includes(spec.kind)) return tint ?? MOWER_TINTS[0];
  const t = getPrefab(spec.prefab)?.tint;
  return typeof t === 'number' ? t : t === undefined ? 0xffffff : colorOf(t);
}

export function createVehicle(scene: THREE.Scene, kind: VehicleKind, x: number, z: number, yaw: number, tint?: number): Vehicle {
  const spec = VEHICLES[kind];
  const object = new THREE.Group();
  const isDressed = dressed(spec);
  let colour: number;
  let look: Loadout | undefined;
  let body: THREE.Group;
  if (isDressed) {
    // v.tint keeps its old meaning (the caller's colour, or the first mower tint); the look starts in what the model really wears.
    colour = tint ?? MOWER_TINTS[0];
    look = defaultLoadout(stockPaint(spec, tint));
    body = buildGlazeBody(spec.prefab, { scale: spec.scale });
  } else {
    colour = tint ?? MOWER_TINTS[0];
    // resolveBodyPrefab: the body variant with the driver's control (driveGrips.ts), when the kind has one.
    const id = resolveBodyPrefab(spec.prefab);
    body = TINTED_KINDS.includes(spec.kind)
      ? buildPrefab(id, { scale: spec.scale, tint: colour })
      : buildPrefab(id, { scale: spec.scale });
  }
  body.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  let rig: GlazeRig | undefined;
  if (look) {
    rig = attachLoadout(body, spec.prefab, look);
    // The rig's own meshes cast shadows too.
    body.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = true;
    });
  }
  object.add(body);
  // A dressed vehicle's lamps live in its rig (inside the body shell); the others get the stock headlight group.
  const headlights = rig ? rig.lights : spec.flies ? undefined : buildHeadlights(spec.radius);
  if (!rig && headlights) object.add(headlights);
  scene.add(object);

  const id = nextId++;
  pivotsById.set(id, capturePivots(body, 0, 0));

  const v: Vehicle = {
    id, kind, spec, x, y: heightAt(x, z), z, yaw, speed: 0, vy: 0, driver: 'none', tint: colour, object,
    rider: null, riderLook: null, wheelSpin: 0, steerVis: 0, hp: 1, damage: 0, lastHit: 0,
    boost: 100, slideX: 0, slideZ: 0, headlights, home: { x, z, yaw },
  };
  if (look && rig) {
    v.look = look;
    v.rig = rig;
  }
  // Every ground mower's engine has its own note, a few percent either way (fleet.ts variants set a wider one).
  if (!spec.flies && !spec.boat) v.enginePitch = 0.93 + Math.random() * 0.14;
  if (spec.boat) {
    // Boats float on the water (boats.ts), not on the bed.
    v.boat = initBoat(v);
    v.y = floatHeight(v) ?? v.y;
  }
  if (spec.air) v.air = initAir();
  syncVehicleMesh(v, 0);
  return v;
}

export function stepVehicle(v: Vehicle, c: DriveControls, dt: number, world: World): void {
  if (v.exploded) {
    // A wreck sits where it blew up (a flyer drops to the ground).
    v.speed = 0;
    v.vy = 0;
    v.boostActive = false;
    if (v.headlights) v.headlights.visible = false;
    const g = groundAt(v.x, v.z, v.y);
    if (v.y > g) v.y = Math.max(g, v.y - 18 * dt);
    return;
  }
  // Conked out in deep water (swim.ts stepSunk brings it back later).
  if (v.sunk) { v.speed = 0; v.vy = 0; v.boostActive = false; return; }
  if (v.hopT && v.hopT > 0) v.hopT = Math.max(0, v.hopT - dt);
  if (v.slickCooldown && v.slickCooldown > 0) v.slickCooldown = Math.max(0, v.slickCooldown - dt);
  if (v.hornCooldown && v.hornCooldown > 0) v.hornCooldown = Math.max(0, v.hornCooldown - dt);
  if (v.spec.boat) {
    // Boats (boats.ts) move, float and collide themselves.
    stepBoat(v, c, dt, world);
    v.steerVis += (c.steer - v.steerVis) * Math.min(1, 8 * dt);
    return;
  }
  if (v.spec.air) {
    // Aircraft fly on craft/flight.ts (through craft/aircraft.ts).
    stepAircraft(v, c, dt, world, damageVehicle);
    v.steerVis += (c.steer - v.steerVis) * Math.min(1, 8 * dt);
    return;
  }
  if (v.spec.fixedWing && v.driver === 'player') stepPilotedPlane(v, c, dt);
  else stepOther(v, c, dt, world);
  moveVehicle(v, dt, world);
  checkSink(v);
  v.steerVis += (c.steer - v.steerVis) * Math.min(1, 8 * dt);
}

/** A piloted Crop Duster: it needs airspeed to lift off and to stay up, and stalls and sinks when too slow. */
function stepPilotedPlane(v: Vehicle, c: DriveControls, dt: number): void {
  const spec = v.spec;
  // VEHICLES.plane.stallSpeed; a fixed-wing spec always sets it.
  const stall = spec.stallSpeed ?? 22;
  const ceiling = spec.ceiling ?? FLY.ceiling;
  const g = groundAt(v.x, v.z, v.y);
  const air = v.y - g > 0.05;

  // Throttle. In the air planes never reverse; on the ground, nearly stopped, the brake backs them up slowly.
  const backMax = PLANE_REVERSE_FRAC * spec.maxSpeed;
  if (c.throttle > 0) v.speed = Math.min(spec.maxSpeed, v.speed + spec.accel * c.throttle * dt);
  else if (c.throttle < 0) {
    if (!air && v.speed <= 1) v.speed = Math.max(-backMax, v.speed - 0.15 * spec.accel * -c.throttle * dt);
    else v.speed = Math.max(0, v.speed - 1.5 * spec.accel * dt);
  } else v.speed *= Math.pow(air ? 0.93 : 0.5, dt);

  // Vertical. Lift authority grows from 0 at 0.7 stall to full at stall.
  const auth = clamp((v.speed - 0.7 * stall) / (0.3 * stall), 0, 1);
  let target = 0;
  if (c.lift > 0) target = c.lift * FLY.planeClimb * auth;
  else if (c.lift < 0 && air) target = c.lift * FLY.planeClimb;
  // On the ground a plane only lifts off once it is at stall speed.
  if (!air && v.speed < stall) target = 0;
  // Below stall in the air the nose drops and the plane sinks.
  if (air && v.speed < stall) target = Math.min(target, -FLY.stallSink * (1 - v.speed / stall));
  v.vy += (target - v.vy) * Math.min(1, 2.5 * dt);

  v.y += v.vy * dt;
  if (v.y <= g) {
    // Hard landing: lose most of the speed and bump.
    if (air && Math.abs(v.vy) > 9) {
      v.speed *= 0.4;
      play('bump');
    }
    v.y = g;
    v.vy = 0;
  } else if (v.y >= Math.max(ceiling, g + 5)) {
    v.y = Math.max(ceiling, g + 5);
    v.vy = 0;
  }

  // Steering: no turning while nearly stopped, and none on the ground below speed 3.
  const aSpeed = Math.abs(v.speed);
  const gate = !air ? (aSpeed >= 3 ? clamp(aSpeed / stall, 0, 1) : aSpeed > 0.3 ? 0.35 : 0) : clamp(v.speed / stall, 0, 1);
  v.yaw -= c.steer * spec.turnRate * dt * gate * (v.speed < 0 ? -1 : 1);
}

/** Arcade ground vehicles in the air (ramp jumps, hops): downward pull in m/s^2. Landing snaps to the ground, no bounce. */
export const ARCADE_AIR = { gravity: 30 };

/** Every vehicle that is not a piloted plane: ground vehicles, the Whirligig, and unpiloted flyers. */
function stepOther(v: Vehicle, c: DriveControls, dt: number, world: World): void {
  const spec = v.spec;
  const flying = spec.flies;
  const onGround = !flying && aboveGround(v.x, v.y, v.z) <= 0.15;
  const surf = onGround ? surfaceAt(v.x, v.z, world, v.kind) : null;
  const boostOn = !!v.boostActive && !flying && v.driver === 'player';
  const maxSpd = spec.maxSpeed * (surf?.speedMult ?? 1) * (boostOn ? 1.32 : 1) * waterlogSpeedMult(v);
  const acc = spec.accel * (surf?.accelMult ?? 1) * (boostOn ? 1.6 : 1);
  const turnRate = spec.turnRate * (surf?.turnMult ?? 1);
  let g = groundAt(v.x, v.z, v.y);

  // Skimming across deep water at speed (skim.ts): the water surface is the floor, no engine drive, speed bleeds, hops.
  let skimming = false;
  if (!flying && !v.sunk && !v.exploded) {
    skimming = stepSkim(v, Math.abs(v.speed), v.y, Math.abs(v.speed) * dt, dt);
    if (skimming) {
      g = Math.max(g, skimSurfaceAt(v.x, v.z) ?? g);
      if (v.skim?.event === 'bounce') { v.vy = hopVelocity(v.speed); v.speed *= SKIM.hopKeep; }
      v.speed *= SKIM.dragPerS ** dt;
    }
  }

  // Vertical (flyers only).
  if (flying) {
    if (v.driver === 'player') v.vy += (c.lift * FLY.climb - v.vy) * Math.min(1, 3 * dt);
    else v.vy -= FLY.gravity * dt;
    v.y += v.vy * dt;
    const ceiling = Math.max(spec.ceiling ?? FLY.ceiling, g + 5);
    if (v.y <= g) { v.y = g; v.vy = 0; }
    else if (v.y >= ceiling) { v.y = ceiling; v.vy = 0; }
  } else if (v.y > g || v.vy > 0) {
    // Lowrider hydraulic hop / trip-mine fling arc on ground vehicles.
    v.vy -= ARCADE_AIR.gravity * dt;
    v.y += v.vy * dt;
    if (v.y <= g) {
      v.y = g;
      v.vy = 0;
    }
  } else {
    v.y = g;
    v.vy = 0;
  }

  // Gentle gravity down a slope for a driven ground vehicle on the ground (exactly 0 on level ground).
  if (onGround && v.driver !== 'none') {
    const n = normalAt(v.x, v.z);
    v.speed += 9.8 * 0.5 * (n.x * Math.sin(v.yaw) + n.z * Math.cos(v.yaw)) * dt;
  }

  // Forward / reverse / coasting. A flyer only gets its throttle above the pad (it can lift off from the pad, nothing more).
  const drag = flying ? FLY.drag : GROUND_DRAG;
  const canDrive = !flying || aboveGround(v.x, v.y, v.z) > 0.3;
  if (skimming && c.throttle >= 0) {
    // No engine drive and no coasting drag on the water: only the skim drag above slows it.
  } else if (c.throttle > 0 || boostOn) {
    const th = boostOn ? Math.max(0.85, c.throttle) : c.throttle;
    if (canDrive) v.speed = Math.min(maxSpd, v.speed + acc * th * dt);
  } else if (c.throttle < 0) {
    if (v.speed > 0.5) v.speed = Math.max(0, v.speed - 2 * acc * dt);
    else if (canDrive) v.speed = Math.max(-0.4 * maxSpd, v.speed - acc * -c.throttle * dt);
  } else {
    v.speed *= Math.pow(drag, dt);
    if (v.speed > maxSpd) v.speed += (maxSpd - v.speed) * Math.min(1, 3 * dt);
  }
  // An unpiloted plane falls and bleeds its speed.
  if (spec.fixedWing) v.speed *= Math.pow(0.5, dt);

  // Steering: the yaw rate needs grip from rolling speed, except the zero-turn and flyers, which always have it.
  const grip = spec.kind === 'zero-turn' || flying ? 1 : Math.min(1, Math.abs(v.speed) / 4);
  v.yaw -= c.steer * turnRate * dt * grip * (skimming ? SKIM.steer : 1) * Math.sign(v.speed || 1);

  // Lateral surface slide on ice, snow, or loose sand when turning at speed.
  if (surf && surf.lateralGrip < 0.95 && Math.abs(v.speed) > 4 && Math.abs(c.steer) > 0.1) {
    const slidePush = c.steer * v.speed * (1 - surf.lateralGrip) * 0.55 * dt;
    v.slideX = (v.slideX ?? 0) + Math.cos(v.yaw) * slidePush;
    v.slideZ = (v.slideZ ?? 0) - Math.sin(v.yaw) * slidePush;
  }
  const latDecay = Math.exp(-(surf?.lateralGrip ?? 1) * 7 * dt);
  v.slideX = (v.slideX ?? 0) * latDecay;
  v.slideZ = (v.slideZ ?? 0) * latDecay;
}

/** Move along forward, collide with boxes (flyers above a box pass over it), then keep inside the world. */
function moveVehicle(v: Vehicle, dt: number, world: World): void {
  // A ground vehicle that is not airborne (before the move) follows the hill after it.
  const grounded = !v.spec.flies && !v.skim?.active && v.vy <= 0 && aboveGround(v.x, v.y, v.z) <= 0.15;
  const x0 = v.x, z0 = v.z;
  // Move along forward + any lateral surface slide. y stays where the vertical step left it.
  v.x += (Math.sin(v.yaw) * v.speed + (v.slideX ?? 0)) * dt;
  v.z += (Math.cos(v.yaw) * v.speed + (v.slideZ ?? 0)) * dt;

  // Collide with boxes along the whole move (flyers above a box pass over it), then keep inside the world.
  const sw = sweepCircleBoxes(x0, z0, v.x, v.z, v.spec.radius, world.boxes, v.y);
  v.x = sw.x;
  v.z = sw.z;
  if (sw.hit) {
    const vel = { x: Math.sin(v.yaw) * v.speed + (v.slideX ?? 0), z: Math.cos(v.yaw) * v.speed + (v.slideZ ?? 0) };
    const b = wallBounce(vel.x, vel.z, sw.nx, sw.nz);
    v.speed = b.vx * Math.sin(v.yaw) + b.vz * Math.cos(v.yaw);
    v.slideX = 0;
    v.slideZ = 0;
    if (v.driver === 'player' && b.impact > 6) play('bump');
    if (b.impact > CRASH_MIN) damageVehicle(v, (b.impact - CRASH_MIN) / CRASH_SCALE);
    knockParts(v, -sw.nx, -sw.nz, b.impact);
  }
  const kept = clampToWorld(v.x, v.z, world.half, v.spec.radius);
  v.x = kept.x;
  v.z = kept.z;
  if (kept.hit) v.speed *= 0.5;
  if (grounded) v.y = groundAt(v.x, v.z, v.y);
}

/** Each dressed vehicle's body springs (suspension.ts), keyed by vehicle. */
const suspensionBodies = new WeakMap<Vehicle, SuspensionBody>();
const suspensionOut = { heave: 0, pitch: 0, roll: 0 };
const SUSPENSION_REST = { heave: 0, pitch: 0, roll: 0 };

/** Frame number from beginVehicleFrame (0 until app.ts calls it: then every sync steps, as in tests). */
let meshFrame = 0;
const syncedAt = new WeakMap<Vehicle, number>();
/** An online driver's yaw at their last timed sync (to read their steering off their turn rate). */
const remoteYaw = new WeakMap<Vehicle, number>();
/** Called once at the top of each game frame: the first timed syncVehicleMesh of a vehicle in it steps wheels and springs. */
export function beginVehicleFrame(): void {
  meshFrame++;
}

export function syncVehicleMesh(v: Vehicle, dt: number): void {
  const spec = v.spec;
  let pitch = 0;
  let roll = 0;
  if (v.air) {
    pitch = -v.air.pitch;
    roll = v.air.roll;
  } else if (spec.fixedWing) {
    roll = v.steerVis * 0.5;
    pitch = -clamp(v.vy / FLY.planeClimb, -1, 1) * 0.3;
  } else if (spec.flies) {
    roll = v.steerVis * 0.35;
    pitch = clamp(v.speed / spec.maxSpeed, -1, 1) * 0.15;
  }
  if (v.sim) {
    const s = v.sim;
    v.object.position.set(s.px, s.py, s.pz);
    v.object.quaternion.set(s.qx, s.qy, s.qz, s.qw);
  } else {
    v.object.position.set(v.x, v.y, v.z);
    // A boat pitches and rolls on the water (boats.ts); a ground vehicle on a slope tilts onto the ground normal.
    if (v.boat) {
      pitch = -v.boat.pitch;
      roll = v.boat.roll;
    } else if (!spec.flies && aboveGround(v.x, v.y, v.z) <= 0.15) {
      const n = normalAt(v.x, v.z);
      if (n.x !== 0 || n.z !== 0) {
        const s = Math.sin(v.yaw);
        const c = Math.cos(v.yaw);
        pitch = Math.atan2(n.x * s + n.z * c, n.y);
        roll = Math.atan2(-(n.x * c - n.z * s), n.y);
      }
    }
    v.object.rotation.set(pitch, v.yaw, roll, 'YXZ');
  }

  // A second timed sync of the same vehicle in one frame (traffic.ts or police.ts syncs its cars, then app.ts syncs every
  // vehicle) only places the mesh: wheels, rig and springs were already stepped, and stepping them twice spun wheels at
  // double speed.
  if (dt > 0 && meshFrame > 0) {
    if (syncedAt.get(v) === meshFrame) return;
    syncedAt.set(v, meshFrame);
  }

  // An online driver's steering is not sent: read it off their turn rate (yaw -= steer * turnRate * dt), so their wheel turns and
  // their gnome's hands turn with it.
  if (v.driver === 'remote' && dt > 0) {
    const last = remoteYaw.get(v);
    remoteYaw.set(v, v.yaw);
    if (last !== undefined) {
      const dYaw = Math.atan2(Math.sin(v.yaw - last), Math.cos(v.yaw - last));
      const want = Math.abs(v.speed) > 0.3 ? clamp(-dYaw / (spec.turnRate * dt), -1, 1) : 0;
      v.steerVis += (want - v.steerVis) * Math.min(1, 8 * dt);
    }
  }
  // A plane's wheels only turn on the ground.
  if (v.air ? !v.air.airborne : (!spec.fixedWing || aboveGround(v.x, v.y, v.z) < 0.05)) v.wheelSpin += (v.speed * dt) / WHEEL_RADIUS;
  v.rig?.update(dt);
  // Body suspension (glaze rig only). dt <= 0 is a parked demo call: nothing moves.
  if (v.rig && dt > 0) {
    let body = suspensionBodies.get(v);
    if (!body) {
      body = createSuspension();
      suspensionBodies.set(v, body);
    }
    if (v.driver === 'none' && v.speed === 0) {
      // Parked and unmanned: the body goes back to rest and the next moving frame starts from fresh inputs.
      Object.assign(body, createSuspension());
      v.rig.setSuspension(SUSPENSION_REST);
    } else {
      // hopLowrider sets hopT to 0.65 s and counts it down; map it to a 0..1 sine bump over the hop.
      const hopT = v.hopT ?? 0;
      const hop = hopT > 0 ? Math.sin(Math.PI * clamp(1 - hopT / 0.65, 0, 1)) : 0;
      stepSuspension(body, {
        dt, speed: v.speed, yaw: v.yaw, groundY: v.y,
        grounded: !spec.flies && aboveGround(v.x, v.y, v.z) <= 0.15, hop,
      }, suspensionOut);
      v.rig.setSuspension(suspensionOut);
    }
  }
  const p = pivotsById.get(v.id);
  if (!p) return;

  const steer = -v.steerVis * 0.45;
  const rig = v.rig;
  p.wheels.forEach((w, i) => {
    if (!w) return;
    if (rig) {
      setWheelPose(w, v.wheelSpin, i >= 2 ? steer : 0, rig.camberOf(i));
    } else if (i >= 2) {
      w.rotation.set(v.wheelSpin, steer, 0, 'YXZ');
    } else {
      w.rotation.x = v.wheelSpin;
    }
  });
  // The driver's control (wheel, bars, yoke...) turns about its own axis by its own lock (driveGrips.ts); the hands follow it.
  if (p.handle) poseControl(p.handle, v.kind, v.steerVis);
  if (p.steer) poseControl(p.steer, v.kind, v.steerVis);
  if (p.blade) p.blade.rotation.y = v.wheelSpin;
  if (p.reel) {
    if (v.kind === 'mulch-spreader') p.reel.rotation.y += dt * (Math.abs(v.speed) > 0.5 ? 8 : 1.5);
    else p.reel.rotation.x = v.wheelSpin;
  }

  const active = v.driver !== 'none' || aboveGround(v.x, v.y, v.z) > 0.05;
  if (active) p.rotorSpin = ROTOR_SPIN;
  else p.rotorSpin = Math.max(0, p.rotorSpin - ROTOR_SPIN_DOWN * dt);
  if (p.rotor) p.rotor.rotation.y += dt * p.rotorSpin;
  if (p.tailRotor) p.tailRotor.rotation.x += dt * p.rotorSpin * 1.5;

  if (active) p.propSpin += (PROP_SPIN - p.propSpin) * Math.min(1, 3 * dt);
  else p.propSpin = Math.max(0, p.propSpin - PROP_SPIN_DOWN * dt);
  if (p.prop) p.prop.rotation.z += dt * p.propSpin;
}

// ---- Vehicle-vehicle collisions: weight decides who gets thrown ---------------------------------------------------------
/** How bouncy a bump is (0 = stick, 1 = perfect bounce). */
const BUMP_RESTITUTION = 0.4;
/** Sideways slide from a bump dies off at this rate per second (tyres grip). */
const KNOCK_GRIP = 4.5;
const SPIN_GRIP = 3;
const SPIN_MAX = 4;
/** A bump never throws a vehicle backwards faster than this. */
const REBOUND_MAX = 10;

/** A vehicle's ground velocity: the sim chassis's own, or heading * speed plus any bump slide (a parked one only slides). */
function groundVel(v: Vehicle): { x: number; z: number } {
  if (v.sim) return { x: v.sim.ctrl.body.vel.x, z: v.sim.ctrl.body.vel.z };
  const k = v.knock;
  // Nobody is driving it, so it only moves when something shoves it.
  if (v.driver === 'none') return { x: k ? k.x : 0, z: k ? k.z : 0 };
  return { x: Math.sin(v.yaw) * v.speed + (k ? k.x : 0), z: Math.cos(v.yaw) * v.speed + (k ? k.z : 0) };
}

/** Change a vehicle's velocity by (dx, dz) and kick its spin: the part along its heading changes its speed, the rest slides it. */
function kick(v: Vehicle, dx: number, dz: number, spinKick: number): void {
  if (v.driver === 'remote') return;
  if (v.sim) {
    const b = v.sim.ctrl.body;
    b.vel.x += dx;
    b.vel.z += dz;
    b.angVel.y = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, b.angVel.y + spinKick));
    return;
  }
  const fx = Math.sin(v.yaw);
  const fz = Math.cos(v.yaw);
  const k = v.knock ?? (v.knock = { x: 0, z: 0, spin: 0 });
  if (v.driver === 'none') {
    // A parked vehicle has no engine to change its speed: the whole shove is a slide that the tyres soon stop.
    k.x += dx;
    k.z += dz;
    k.spin = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, k.spin + spinKick));
    return;
  }
  const along = dx * fx + dz * fz;
  v.speed = Math.max(-REBOUND_MAX, Math.min(v.spec.maxSpeed, v.speed + along));
  k.x += dx - along * fx;
  k.z += dz - along * fz;
  k.spin = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, k.spin + spinKick));
}

/** Game-time clock (ms) for the crash-damage debounce (Vehicle.lastHit). Starts high so a fresh lastHit of 0 never blocks. */
let bumpClockMs = 1e6;

/**
 * Push overlapping vehicles apart (heavier moves less), then trade momentum along the contact normal: a combine barely
 * notices a push-bike, which gets thrown back, slid sideways and spun; two equals bounce off each other. A hit off-centre
 * (the contact is nearer a vehicle's front than its middle) also turns it. Ground distance and height both matter.
 */
export function collideVehicles(list: Vehicle[], dt = 1 / 60): void {
  // The crash-damage debounce runs on game time (E27): it used performance.now(), so a slow or loaded machine (fewer
  // frames per wall second) took more damage per simulated minute, and headless sims gave different answers per run.
  if (Number.isFinite(dt) && dt > 0) bumpClockMs += dt * 1000;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      const rr = a.spec.radius + b.spec.radius;
      if (Math.abs(a.y - b.y) >= 1.5) continue;

      // Relative position of b from a now (p1) and at the start of the frame (p0), from the frame's velocities.
      const va = groundVel(a);
      const vb = groundVel(b);
      const p1x = b.x - a.x, p1z = b.z - a.z;
      const sgx = (vb.x - va.x) * dt, sgz = (vb.z - va.z) * dt; // p1 - p0
      const p0x = p1x - sgx, p0z = p1z - sgz;
      // Closest distance from the origin (a's centre) to the segment p0 -> p1: they may have passed through each other this frame.
      const seg2 = sgx * sgx + sgz * sgz;
      const t = seg2 > 1e-12 ? Math.max(0, Math.min(1, -(p0x * sgx + p0z * sgz) / seg2)) : 0;
      const cxp = p0x + sgx * t, czp = p0z + sgz * t;
      const d = Math.hypot(p1x, p1z);
      if (d >= rr && Math.hypot(cxp, czp) >= rr) continue;

      // Contact normal (from a to b): from p0 when the centres crossed this frame, otherwise from p1.
      let nx = 1;
      let nz = 0;
      const p0l = Math.hypot(p0x, p0z);
      if ((p0x * p1x + p0z * p1z < 0 || d < 1e-6) && p0l > 1e-6) { nx = p0x / p0l; nz = p0z / p0l; }
      else if (d > 1e-6) { nx = p1x / d; nz = p1z / d; }

      const sep = p1x * nx + p1z * nz;
      const overlap = rr - sep;

      const ma = a.spec.mass;
      const mb = b.spec.mass;
      const total = ma + mb;
      // Each vehicle moves by its share m_other / (ma + mb) of the overlap, directly away from the other.
      if (overlap > 0) {
        const sa = (overlap * mb) / total;
        const sb = (overlap * ma) / total;
        a.x -= nx * sa;
        a.z -= nz * sa;
        b.x += nx * sb;
        b.z += nz * sb;
      }

      // Closing speed along the contact normal, before the bump.
      const closingN = (va.x - vb.x) * nx + (va.z - vb.z) * nz;
      if (closingN > 0) {
        // Impulse magnitude for an inelastic-ish bump between two masses; each takes its share of the velocity change.
        const jImp = ((1 + BUMP_RESTITUTION) * closingN) / (1 / ma + 1 / mb);
        // Torque from the contact sitting toward each vehicle's front: lever arm r = 0.6 r_a along its heading (towards the hit) + 0.4 r_a along the normal.
        const spinOf = (v: Vehicle, sx: number, sz: number, jx: number, jz: number): number => {
          const fx = Math.sin(v.yaw);
          const fz = Math.cos(v.yaw);
          const front = fx * sx + fz * sz >= 0 ? 1 : -1;
          const r = v.spec.radius;
          const rx = fx * r * 0.6 * front + sx * r * 0.4;
          const rz = fz * r * 0.6 * front + sz * r * 0.4;
          // y component of r x J (positive = yaw increases), over the moment of inertia m r^2 / 2.
          return (0.25 * (rz * jx - rx * jz)) / (0.5 * v.spec.mass * r * r);
        };
        // a is hit from the b side (+n) and pushed along -n; b the other way.
        kick(a, (-jImp * nx) / ma, (-jImp * nz) / ma, spinOf(a, nx, nz, -jImp * nx, -jImp * nz));
        kick(b, (jImp * nx) / mb, (jImp * nz) / mb, spinOf(b, -nx, -nz, jImp * nx, jImp * nz));
      }

      // Damage follows the closing speed along the contact normal (before the bump), so grazing a car going the same way
      // costs nothing. The heavier vehicle hurts the lighter one more.
      const closing = Math.max(0, closingN);
      const now = bumpClockMs;
      if (closing > CRASH_MIN && now - Math.max(a.lastHit, b.lastHit) > 400) {
        const dmg = (closing - CRASH_MIN) / (CRASH_SCALE * 1.4);
        damageVehicle(a, dmg * (2 * mb) / total);
        damageVehicle(b, dmg * (2 * ma) / total);
        a.lastHit = now;
        b.lastHit = now;
        // The normal points from a to b: a is hit on its b side (+n), b on its a side (-n).
        knockParts(a, nx, nz, closing);
        knockParts(b, -nx, -nz, closing);
        if (a.driver === 'player' || b.driver === 'player') play('bump');
      }
    }
  }
}

/** Let bumped vehicles slide and spin for a moment (sideways motion and a turn the tyres soon kill), stopped by buildings. */
export function stepKnock(list: Vehicle[], dt: number, world: World): void {
  for (const v of list) {
    const k = v.knock;
    if (!k) continue;
    if (v.driver === 'remote' || v.exploded) { v.knock = undefined; continue; }
    if (Math.abs(k.x) + Math.abs(k.z) + Math.abs(k.spin) < 0.05) { v.knock = undefined; continue; }
    const x0 = v.x, z0 = v.z;
    v.x += k.x * dt;
    v.z += k.z * dt;
    v.yaw += k.spin * dt;
    const sw = sweepCircleBoxes(x0, z0, v.x, v.z, v.spec.radius, world.boxes, v.y);
    v.x = sw.x;
    v.z = sw.z;
    if (sw.hit) {
      const b = wallBounce(k.x, k.z, sw.nx, sw.nz);
      k.x = b.vx;
      k.z = b.vz;
      knockParts(v, -sw.nx, -sw.nz, b.impact);
    }
    const kept = clampToWorld(v.x, v.z, world.half, v.spec.radius);
    v.x = kept.x;
    v.z = kept.z;
    const fk = Math.exp(-KNOCK_GRIP * dt);
    const fs = Math.exp(-SPIN_GRIP * dt);
    k.x *= fk;
    k.z *= fk;
    k.spin *= fs;
  }
}

export function removeVehicle(scene: THREE.Scene, v: Vehicle): void {
  v.rig?.dispose();
  scene.remove(v.object);
  pivotsById.delete(v.id);
}

/** World position of a seat (rider feet): 0 = the driver's, 1.. = a passenger seat. A lifted or slammed body moves the seat with it. */
export function seatWorld(v: Vehicle, out: THREE.Vector3, seat = 0): THREE.Vector3 {
  v.object.updateMatrixWorld();
  const [x, y, z] = seatPos(v.spec, seat);
  return v.object.localToWorld(out.set(x, y + (v.rig?.seatLift ?? 0) + coverLift(v, seat), z));
}

/** Where a gnome stands after getting off: beside the driver's left side, on the ground. */
export function exitPoint(v: Vehicle): { x: number; z: number } {
  const d = v.spec.radius + 0.8;
  return { x: v.x + Math.cos(v.yaw) * d, z: v.z - Math.sin(v.yaw) * d };
}

// ---- Special vehicle gimmicks (Issue 3B) ---------------------------------------------------------------------------
/** Trigger a smooth hydraulic hop on the Ride-On Lowrider. Returns true if it hopped. */
export function hopLowrider(v: Vehicle): boolean {
  if (v.kind !== 'lowrider' || aboveGround(v.x, v.y, v.z) > 0.08 || (v.hopT ?? 0) > 0) return false;
  v.hopT = 0.65;
  v.shockAbsorb = true;
  v.vy = 7.5;
  if (v.sim) v.sim.ctrl.body.vel.y += 5.5;
  return true;
}

interface MulchSlick {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  ownerId: number;
  life: number;
}

const slicks: MulchSlick[] = [];
const SLICK_GEO = new THREE.CylinderGeometry(1.7, 1.85, 0.08, 12);
const SLICK_MAT = new THREE.MeshLambertMaterial({ color: 0x4a3319 });

/** Drop a 6-second compost slick behind a Mulch-Spreader Mower. */
export function dropMulchSlick(scene: THREE.Scene, v: Vehicle): boolean {
  if (v.kind !== 'mulch-spreader' || (v.slickCooldown ?? 0) > 0) return false;
  v.slickCooldown = 1.0;
  const x = v.x - Math.sin(v.yaw) * (v.spec.radius + 0.8);
  const z = v.z - Math.cos(v.yaw) * (v.spec.radius + 0.8);
  const mesh = new THREE.Mesh(SLICK_GEO, SLICK_MAT);
  mesh.position.set(x, heightAt(x, z) + 0.04, z);
  scene.add(mesh);
  slicks.push({ mesh, x, z, ownerId: v.id, life: 6 });
  return true;
}

/** Tick active compost slicks and spin out any non-owner ground vehicle crossing them. */
export function updateMulchSlicks(dt: number, vehicles: Vehicle[]): void {
  for (let i = slicks.length - 1; i >= 0; i--) {
    const s = slicks[i];
    s.life -= dt;
    if (s.life <= 0) {
      s.mesh.removeFromParent();
      slicks.splice(i, 1);
      continue;
    }
    if (s.life < 1) s.mesh.scale.setScalar(Math.max(0.05, s.life));
    for (const v of vehicles) {
      if (v.id === s.ownerId || v.spec.flies || aboveGround(v.x, v.y, v.z) > 0.5 || v.exploded) continue;
      if (Math.hypot(v.x - s.x, v.z - s.z) <= 2.2) {
        const sign = (v.id % 2 === 0 ? 1 : -1) * 3.5;
        if (v.sim) {
          v.sim.ctrl.body.angVel.y = Math.max(-4, Math.min(4, v.sim.ctrl.body.angVel.y + sign * dt * 8));
        } else {
          const k = v.knock ?? (v.knock = { x: 0, z: 0, spin: 0 });
          k.spin = sign;
          k.x += -Math.cos(v.yaw) * 2.5;
          k.z += Math.sin(v.yaw) * 2.5;
        }
      }
    }
  }
}

/** Dress a vehicle in `look` (paint, wheels, lamps, ride height...). Ground vehicles drive their @lawn/glaze rig; flyers and boats only record it. Keeps `v.tint === look.paint`. */
export function setVehicleLook(v: Vehicle, look: Loadout): void {
  const before = v.tint;
  const next = normalizeLoadout(look, v.tint);
  if (v.exploded) return;
  v.look = next;
  v.tint = next.paint;
  if (!v.rig) {
    // Boats and aircraft have no glaze rig: a new paint re-tints the prefab body.
    if (isCraftKind(v.kind) && next.paint !== before) repaintVehicle(v, next.paint);
    hideLostParts(v);
    return;
  }
  v.rig.set(next);
  // The rig keeps the wheel groups but moves the shell, so pick the pivots up again.
  const body = v.object.children[0] as THREE.Group | undefined;
  if (body) {
    const old = pivotsById.get(v.id);
    pivotsById.set(v.id, capturePivots(body, old?.rotorSpin ?? 0, old?.propSpin ?? 0));
  }
  // A re-dress must not bring back parts knocked off.
  hideLostParts(v);
}
