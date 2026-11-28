// Ambient world encounters: highway speed-trap cameras, rogue sprinkler geysers, and roadside micro-encounters.
import * as THREE from 'three';
import type { Economy } from './economy';
import type { Blip, Fx, Hud, Player, Sfx, Vehicle, Watch, World } from './types';
import { buildPrefab } from '@lawn/prefabs';
import { heightAt } from './terrain';

const SPEED_TRAP_TRIGGER_DIST = 14;
const SPEED_TRAP_MIN_SPEED = 24;
const SPEED_TRAP_COOLDOWN = 30;
const SPEED_TRAP_REWARD = 50;
const SPEED_TRAP_HEAT = 0.5;

const SPRINKLER_CYCLE = 9;
const SPRINKLER_ACTIVE_DURATION = 3.5;
const SPRINKLER_TELEGRAPH = 0.8; // the head wobbles this long before each spray
const SPRINKLER_RADIUS = 2.6;
const SPRINKLER_LAUNCH_VY = 4.5;
const SPRINKLER_HEAD_SCALE = 2.2;
const SPRINKLER_LIFT = 0.02; // the head's base sits just above the ground plane, never inside it

// Spray droplets: a short low fan. The peak height above the nozzle is SPRAY_PEAK (about 1.5 m off the ground in total).
export const SPRAY_DROPLETS = 24;
const SPRAY_GRAVITY = 9.8;
export const SPRAY_PEAK = 1.4;
const SPRAY_VY_MAX = Math.sqrt(2 * SPRAY_GRAVITY * SPRAY_PEAK);
const SPRAY_NOZZLE_Y = 0.1;
const SPRAY_SPEED = 2.4;
const SPRAY_SPIN_RATE = 1.6;
const SPRAY_RADIUS = 0.06;

const MICRO_ENCOUNTER_RADIUS = 9;
const MICRO_ENCOUNTER_COOLDOWN = 25;

interface SpeedCamera {
  x: number;
  z: number;
  cooldown: number;
}

interface SprinklerGeyser {
  x: number;
  z: number;
  phaseOffset: number;
  head: THREE.Group;
  spray: THREE.InstancedMesh;
  pos: Float32Array; // droplet positions, local to the nozzle: x y z per droplet
  vel: Float32Array; // droplet velocities: x y z per droplet
  spin: number;
  live: boolean; // true while a spray is running
  toastCooldown: number;
}

interface MicroEncounter {
  x: number;
  z: number;
  toast: string;
  smokes?: boolean;
  cooldown: number;
  smokeTimer: number;
}

// Placed >= 7m off road centerlines so they sit safely on the verge while remaining within 14m of passing traffic.
const CAMERA_SPOTS: readonly { x: number; z: number; yaw: number }[] = [
  { x: 8, z: -90, yaw: Math.PI },
  { x: -90, z: 8, yaw: Math.PI / 2 },
  { x: 225, z: -8, yaw: -Math.PI / 2 },
  { x: -215, z: -18.5, yaw: Math.PI / 2 },
  { x: -8, z: -225, yaw: 0 },
  { x: 8, z: 225, yaw: Math.PI },
];

// 2 in Patio Heights ([125..210, -210..-125], clear of 180/-180 roads) and 2 in Turfton Park ([-60..0, 0..60]).
const SPRINKLER_SPOTS: readonly { x: number; z: number; phaseOffset: number }[] = [
  { x: 150, z: -150, phaseOffset: 0 },
  { x: 165, z: -165, phaseOffset: 4.5 },
  { x: -25, z: 25, phaseOffset: 1.5 },
  { x: -42, z: 42, phaseOffset: 6.0 },
];

const MICRO_SPOTS: readonly { x: number; z: number; kind: 'mower' | 'caps' | 'crate'; toast: string; smokes?: boolean }[] = [
  {
    x: 10,
    z: -75,
    kind: 'mower',
    smokes: true,
    toast: "Roadside Breakdown: 'I swear I topped off the Acorn-Oil before leaving Turfton!'",
  },
  {
    x: -10,
    z: 75,
    kind: 'caps',
    toast: "Lawn Dispute: 'That was MY dandelion!' — 'Read the HOA easement, buddy!'",
  },
  {
    x: 215,
    z: 9,
    kind: 'crate',
    toast: "Stranded Courier: 'GPS said turn left at the terracotta pot. They're ALL terracotta pots!'",
  },
];

function buildSpeedCamera(scene: THREE.Scene, x: number, z: number, yaw: number): SpeedCamera {
  const group = new THREE.Group();
  group.position.set(x, heightAt(x, z), z);
  group.rotation.y = yaw;

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.14, 3.6, 8),
    new THREE.MeshLambertMaterial({ color: 0x6b7278 }),
  );
  pole.position.y = 1.8;
  group.add(pole);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.45, 0.85),
    new THREE.MeshLambertMaterial({ color: 0xf2c230 }),
  );
  box.position.set(0, 3.5, 0);
  group.add(box);

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.14, 10),
    new THREE.MeshLambertMaterial({ color: 0x20242a }),
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 3.5, 0.44);
  group.add(lens);

  scene.add(group);
  return { x, z, cooldown: 0 };
}

const sprayDummy = new THREE.Object3D();

/** Put droplet i back at the nozzle, flung out along the fan's current angle with a varied rise (never above SPRAY_PEAK). */
function launchDroplet(sp: SprinklerGeyser, i: number): void {
  const angle = sp.spin + (i / SPRAY_DROPLETS) * Math.PI * 2;
  const rise = 0.6 + 0.4 * ((i * 0.37) % 1);
  const speed = SPRAY_SPEED * (0.8 + 0.2 * ((i * 0.61) % 1));
  const o = i * 3;
  sp.pos[o] = 0;
  sp.pos[o + 1] = SPRAY_NOZZLE_Y;
  sp.pos[o + 2] = 0;
  sp.vel[o] = Math.cos(angle) * speed;
  sp.vel[o + 1] = SPRAY_VY_MAX * rise;
  sp.vel[o + 2] = Math.sin(angle) * speed;
}

function buildSprinkler(scene: THREE.Scene, x: number, z: number, phaseOffset: number): SprinklerGeyser {
  const ground = heightAt(x, z);
  const group = new THREE.Group();
  group.position.set(x, ground, z);
  scene.add(group);

  const head = buildPrefab('lawn-sprinkler', { scale: SPRINKLER_HEAD_SCALE });
  head.position.y = SPRINKLER_LIFT;
  group.add(head);

  // One instanced mesh for the whole fan. It sits at the nozzle in world space, so it does not wobble with the head.
  const spray = new THREE.InstancedMesh(
    new THREE.SphereGeometry(SPRAY_RADIUS, 6, 4),
    new THREE.MeshLambertMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.8 }),
    SPRAY_DROPLETS,
  );
  spray.position.set(x, ground, z);
  spray.frustumCulled = false;
  spray.visible = false;
  scene.add(spray);

  const sp: SprinklerGeyser = {
    x,
    z,
    phaseOffset,
    head,
    spray,
    pos: new Float32Array(SPRAY_DROPLETS * 3),
    vel: new Float32Array(SPRAY_DROPLETS * 3),
    spin: 0,
    live: false,
    toastCooldown: 0,
  };
  for (let i = 0; i < SPRAY_DROPLETS; i++) launchDroplet(sp, i);
  return sp;
}

/** Step the fan's droplets (allocation-free): gravity, landing respawns at the nozzle, then write the instance matrices. */
function updateSpray(sp: SprinklerGeyser, dt: number): void {
  for (let i = 0; i < SPRAY_DROPLETS; i++) {
    const o = i * 3;
    sp.vel[o + 1] -= SPRAY_GRAVITY * dt;
    sp.pos[o] += sp.vel[o] * dt;
    sp.pos[o + 1] += sp.vel[o + 1] * dt;
    sp.pos[o + 2] += sp.vel[o + 2] * dt;
    if (sp.pos[o + 1] <= 0) launchDroplet(sp, i);
    sprayDummy.position.set(sp.pos[o], sp.pos[o + 1], sp.pos[o + 2]);
    sprayDummy.updateMatrix();
    sp.spray.setMatrixAt(i, sprayDummy.matrix);
  }
  sp.spray.instanceMatrix.needsUpdate = true;
}

function buildMicroProp(scene: THREE.Scene, spot: (typeof MICRO_SPOTS)[number]): MicroEncounter {
  const group = new THREE.Group();
  group.position.set(spot.x, heightAt(spot.x, spot.z), spot.z);

  if (spot.kind === 'mower') {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.7, 2.0),
      new THREE.MeshLambertMaterial({ color: 0xc0392b }),
    );
    body.position.y = 0.45;
    body.rotation.z = 0.22;
    group.add(body);
  } else if (spot.kind === 'caps') {
    const redHat = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.85, 8),
      new THREE.MeshLambertMaterial({ color: 0xd93636 }),
    );
    redHat.position.set(-0.7, 0.9, 0);
    const blueHat = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.85, 8),
      new THREE.MeshLambertMaterial({ color: 0x2f64c9 }),
    );
    blueHat.position.set(0.7, 0.9, 0);
    group.add(redHat, blueHat);
  } else {
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      new THREE.MeshLambertMaterial({ color: 0xb5834a }),
    );
    crate.position.y = 0.55;
    crate.rotation.set(0.3, 0.5, 0.2);
    group.add(crate);
  }

  scene.add(group);
  return {
    x: spot.x,
    z: spot.z,
    toast: spot.toast,
    smokes: spot.smokes,
    cooldown: 0,
    smokeTimer: 0,
  };
}

export function createEncounters(
  scene: THREE.Scene,
  _world: World,
  hud: Hud,
  economy: Economy,
  watch: Watch,
  fx: Fx,
  play: (sfx: Sfx) => void,
): { update(dt: number, player: Player, vehicles: Vehicle[]): void; blips(): Blip[] } {
  const cameras = CAMERA_SPOTS.map((c) => buildSpeedCamera(scene, c.x, c.z, c.yaw));
  const sprinklers = SPRINKLER_SPOTS.map((s) => buildSprinkler(scene, s.x, s.z, s.phaseOffset));
  const micros = MICRO_SPOTS.map((m) => buildMicroProp(scene, m));

  let elapsed = 0;

  return {
    update(dt: number, player: Player, vehicles: Vehicle[]): void {
      elapsed += dt;

      // 1. Speed-Trap Cameras
      const pv = player.vehicle;
      for (const cam of cameras) {
        if (cam.cooldown > 0) cam.cooldown = Math.max(0, cam.cooldown - dt);
        if (!pv || cam.cooldown > 0) continue;
        const speed = Math.abs(pv.speed);
        if (speed < SPEED_TRAP_MIN_SPEED) continue;
        const dx = pv.x - cam.x;
        const dz = pv.z - cam.z;
        if (dx * dx + dz * dz <= SPEED_TRAP_TRIGGER_DIST * SPEED_TRAP_TRIGGER_DIST) {
          cam.cooldown = SPEED_TRAP_COOLDOWN;
          (hud as { flash?: () => void }).flash?.();
          fx.flash(cam.x, heightAt(cam.x, cam.z) + 3.3, cam.z);
          play('whistle');
          hud.toast(`SPEED TRAP: ${Math.round(speed)} u/s! Daredevil +${SPEED_TRAP_REWARD} Acorns!`, 4000);
          economy.earn(SPEED_TRAP_REWARD, 'Speed Trap Daredevil');
          watch.addHeat(SPEED_TRAP_HEAT);
        }
      }

      // 2. Rogue Sprinkler Geysers
      for (const sp of sprinklers) {
        if (sp.toastCooldown > 0) sp.toastCooldown = Math.max(0, sp.toastCooldown - dt);
        const phase = (elapsed + sp.phaseOffset) % SPRINKLER_CYCLE;
        const active = phase < SPRINKLER_ACTIVE_DURATION;
        const warning = !active && phase >= SPRINKLER_CYCLE - SPRINKLER_TELEGRAPH;
        // Telegraph: the head shudders for the last SPRINKLER_TELEGRAPH seconds before it fires.
        sp.head.rotation.z = warning ? Math.sin(elapsed * 40 + sp.phaseOffset) * 0.1 : 0;
        sp.spray.visible = active;
        if (!active) {
          sp.live = false;
          sp.head.rotation.y = 0;
          continue;
        }
        if (!sp.live) {
          // Each spray starts fresh from the nozzle.
          sp.live = true;
          for (let i = 0; i < SPRAY_DROPLETS; i++) launchDroplet(sp, i);
        }
        sp.spin += dt * SPRAY_SPIN_RATE;
        sp.head.rotation.y = sp.spin;
        updateSpray(sp, dt);

        for (const v of vehicles) {
          if (v.spec.flies || v.exploded) continue;
          const dx = v.x - sp.x;
          const dz = v.z - sp.z;
          const reach = SPRINKLER_RADIUS + v.spec.radius * 0.5;
          if (dx * dx + dz * dz <= reach * reach) {
            v.vy = Math.max(v.vy, SPRINKLER_LAUNCH_VY);
            if (v === pv && sp.toastCooldown <= 0) {
              sp.toastCooldown = 2.0;
              play('squirt');
              hud.toast('SPLASH! Rogue sprinkler geyser!', 2500);
            }
          }
        }
      }

      // 3. Roadside Micro-Encounters
      const px = pv ? pv.x : player.x;
      const pz = pv ? pv.z : player.z;
      for (const m of micros) {
        if (m.cooldown > 0) m.cooldown = Math.max(0, m.cooldown - dt);
        if (m.smokes) {
          m.smokeTimer -= dt;
          if (m.smokeTimer <= 0) {
            m.smokeTimer = 0.25;
            fx.fire(m.x, heightAt(m.x, m.z) + 0.7, m.z, 0.3);
          }
        }
        if (m.cooldown > 0) continue;
        const dx = px - m.x;
        const dz = pz - m.z;
        if (dx * dx + dz * dz <= MICRO_ENCOUNTER_RADIUS * MICRO_ENCOUNTER_RADIUS) {
          m.cooldown = MICRO_ENCOUNTER_COOLDOWN;
          hud.toast(m.toast, 4500);
        }
      }
    },

    blips(): Blip[] {
      const out: Blip[] = [];
      for (const cam of cameras) {
        out.push({ x: cam.x, z: cam.z, color: '#f2c230' });
      }
      for (const sp of sprinklers) {
        out.push({ x: sp.x, z: sp.z, color: '#55d6ff' });
      }
      return out;
    },
  };
}
