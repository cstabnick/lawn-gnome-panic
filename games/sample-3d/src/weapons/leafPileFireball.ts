import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { LEAF_PILE_FIREBALL_LEVELS } from '../config';
import type { EnemyView, LeafPileFireballLevel, Weapon, WeaponContext } from '../config';
import { heightAt } from '../terrain';

const RETRY_S = 0.2;
const FLIGHT_S = 0.35;
const FLIGHT_PEAK = 2.0;
const BAG_START_Y = 1.0;
const BAG_IMPACT_Y = 0.35;
const IMPACT_FX_S = 0.5;
const PUFF_COUNT = 8;
const PUFF_Y = 0.3;

/** The bag in the air. Only the visual travels; the blast point is fixed at the throw. */
interface Flight {
  startX: number;
  startZ: number;
  impactX: number;
  impactZ: number;
  startY: number;    // terrain height under the throw
  impactY: number;   // terrain height under the impact point
  age: number;
  stats: LeafPileFireballLevel;
}

/** Scorch disc and puffs left behind by one impact. */
interface ImpactFx {
  group: THREE.Group;
  disc: THREE.Mesh;
  discGeometry: THREE.CircleGeometry;
  discMaterial: THREE.MeshBasicMaterial;
  puffs: { mesh: THREE.Mesh; angle: number }[];
  puffGeometry: THREE.SphereGeometry;
  puffMaterial: THREE.MeshBasicMaterial;
  reach: number;
  age: number;
}

function dist2D(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function makeImpact(scene: THREE.Scene, x: number, z: number, groundY: number, blastRadius: number): ImpactFx {
  const group = new THREE.Group();
  group.position.set(x, groundY, z);

  const discGeometry = new THREE.CircleGeometry(blastRadius, 24);
  const discMaterial = new THREE.MeshBasicMaterial({
    color: 0x3b2a14,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const disc = new THREE.Mesh(discGeometry, discMaterial);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.03;
  group.add(disc);

  const puffGeometry = new THREE.SphereGeometry(0.15, 8, 6);
  const puffMaterial = new THREE.MeshBasicMaterial({
    color: 0xd9822b,
    transparent: true,
    opacity: 1,
    depthWrite: false,
  });
  const puffs: { mesh: THREE.Mesh; angle: number }[] = [];
  for (let i = 0; i < PUFF_COUNT; i++) {
    const mesh = new THREE.Mesh(puffGeometry, puffMaterial);
    mesh.position.set(0, PUFF_Y, 0);
    group.add(mesh);
    puffs.push({ mesh, angle: (i / PUFF_COUNT) * Math.PI * 2 });
  }

  scene.add(group);
  return {
    group,
    disc,
    discGeometry,
    discMaterial,
    puffs,
    puffGeometry,
    puffMaterial,
    reach: blastRadius * 0.7,
    age: 0,
  };
}

/** Advances an impact visual. Returns true once it has finished. */
function stepImpact(fx: ImpactFx, dt: number): boolean {
  fx.age += dt;
  const k = Math.min(fx.age / IMPACT_FX_S, 1);
  for (const p of fx.puffs) {
    p.mesh.position.set(Math.cos(p.angle) * fx.reach * k, PUFF_Y, Math.sin(p.angle) * fx.reach * k);
    p.mesh.scale.setScalar(1 + k);
  }
  fx.puffMaterial.opacity = 1 - k;
  return fx.age >= IMPACT_FX_S;
}

/** The thrown bag: the loot-sack prefab, scaled so its body is the old 0.35-radius ball, centred on the game's point. */
const SACK_SCALE = 1.75;
const SACK_BODY_Y = 0.17;      // the sack's body centre in prefab units
function makeBag(): THREE.Object3D {
  const holder = new THREE.Group();
  const sack = buildPrefab('loot-sack', { scale: SACK_SCALE });
  sack.position.y = -SACK_BODY_Y * SACK_SCALE;
  holder.add(sack);
  return holder;
}

function removeImpact(scene: THREE.Scene, fx: ImpactFx): void {
  scene.remove(fx.group);
  fx.discGeometry.dispose();
  fx.discMaterial.dispose();
  fx.puffGeometry.dispose();
  fx.puffMaterial.dispose();
}

export function createLeafPileFireball(scene: THREE.Scene): Weapon {
  let level = 1;
  let timer = 1;
  let flight: Flight | null = null;
  const impacts: ImpactFx[] = [];
  const levelStats = () => LEAF_PILE_FIREBALL_LEVELS[level - 1];

  const bag = makeBag();
  bag.visible = false;
  scene.add(bag);

  function land(ctx: WeaponContext, f: Flight): void {
    const L = f.stats;
    for (const e of ctx.enemies) {
      if (dist2D({ x: f.impactX, z: f.impactZ }, e.pos) < L.blastRadius + e.radius) {
        ctx.damage(e.id, L.damage * ctx.stats.damageMult);
        if (L.slowS > 0) ctx.slow(e.id, L.slowFactor, L.slowS);
      }
    }
    ctx.playSfx('boom');
    impacts.push(makeImpact(scene, f.impactX, f.impactZ, f.impactY, L.blastRadius));
  }

  return {
    id: 'leafPileFireball',
    setLevel(l: number) {
      level = Math.min(LEAF_PILE_FIREBALL_LEVELS.length, Math.max(1, Math.round(l)));
    },
    update(ctx: WeaponContext) {
      // Bag flight
      if (flight) {
        flight.age += ctx.dt;
        const k = Math.min(flight.age / FLIGHT_S, 1);
        const startH = flight.startY + BAG_START_Y;
        const endH = flight.impactY + BAG_IMPACT_Y;
        bag.position.set(
          flight.startX + (flight.impactX - flight.startX) * k,
          startH + (endH - startH) * k + FLIGHT_PEAK * Math.sin(Math.PI * k),
          flight.startZ + (flight.impactZ - flight.startZ) * k,
        );
        if (k >= 1) {
          land(ctx, flight);
          flight = null;
          bag.visible = false;
        }
      }

      // Impact visuals
      for (let i = impacts.length - 1; i >= 0; i--) {
        if (stepImpact(impacts[i], ctx.dt)) {
          removeImpact(scene, impacts[i]);
          impacts.splice(i, 1);
        }
      }

      timer -= ctx.dt;
      if (timer > 0) return;
      // One bag at a time: wait for the current one to land.
      if (flight) return;

      const L = levelStats();
      let target: EnemyView | null = null;
      let best = Infinity;
      for (const e of ctx.enemies) {
        const d = dist2D(ctx.player, e.pos);
        if (d < L.range && d < best) {
          best = d;
          target = e;
        }
      }
      if (!target) {
        timer = RETRY_S;
        return;
      }

      flight = {
        startX: ctx.player.x,
        startZ: ctx.player.z,
        impactX: target.pos.x,
        impactZ: target.pos.z,
        startY: ctx.player.y,
        impactY: heightAt(target.pos.x, target.pos.z),
        age: 0,
        stats: L,
      };
      bag.position.set(ctx.player.x, ctx.player.y + BAG_START_Y, ctx.player.z);
      bag.visible = true;
      timer = L.cooldownS * ctx.stats.cooldownMult;
    },
    dispose() {
      scene.remove(bag);
      for (const fx of impacts) removeImpact(scene, fx);
      impacts.length = 0;
      flight = null;
    },
  };
}
