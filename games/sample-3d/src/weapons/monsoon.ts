import * as THREE from 'three';
import { MONSOON_LEVELS } from '../config';
import type { EnemyView, MonsoonLevel, Weapon, WeaponContext } from '../config';
import { heightAt } from '../terrain';

const RETRY_S = 0.25;       // no critter in range: check again this soon
const BOLT_TOP = 25;        // a bolt starts this far above its ground point
const BOLT_POINTS = 9;
const BOLT_JITTER = 0.6;    // random x/z offset of the zig-zag points
const CHAIN_Y = 0.6;        // chain jumps are drawn at this height
const CHAIN_MULT = 0.6;     // chained hits deal this share of the bolt damage
const FADE_S = 0.25;        // every visual fades out over this long, then goes
const FLASH_LIFT = 0.05;    // the ground flash sits just above the terrain (no z-fighting)
const COLOR = 0xfff6a8;

/** One bolt line, chain line or ground flash. Removed and disposed once it has faded. */
interface Visual {
  obj: THREE.Object3D;
  geometry: THREE.BufferGeometry;
  material: THREE.LineBasicMaterial | THREE.MeshBasicMaterial;
  age: number;
}

function dist2D(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function removeVisual(scene: THREE.Scene, v: Visual): void {
  scene.remove(v.obj);
  v.geometry.dispose();
  v.material.dispose();
}

export function createMonsoon(scene: THREE.Scene): Weapon {
  let level = 1;
  let timer = 1;
  const visuals: Visual[] = [];
  const levelStats = (): MonsoonLevel => MONSOON_LEVELS[level - 1];

  function addLine(points: THREE.Vector3[]): void {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: COLOR, transparent: true, opacity: 1 });
    const obj = new THREE.Line(geometry, material);
    scene.add(obj);
    visuals.push({ obj, geometry, material, age: 0 });
  }

  /** A jagged line from above the ground point down to it. */
  function addBolt(x: number, z: number, groundY: number): void {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < BOLT_POINTS; i++) {
      const t = i / (BOLT_POINTS - 1);
      const last = i === BOLT_POINTS - 1;
      const jx = last ? 0 : (Math.random() * 2 - 1) * BOLT_JITTER;
      const jz = last ? 0 : (Math.random() * 2 - 1) * BOLT_JITTER;
      points.push(new THREE.Vector3(x + jx, groundY + BOLT_TOP * (1 - t), z + jz));
    }
    addLine(points);
  }

  function addFlash(x: number, z: number, groundY: number, radius: number): void {
    const geometry = new THREE.CircleGeometry(radius, 16);
    const material = new THREE.MeshBasicMaterial({
      color: COLOR,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const obj = new THREE.Mesh(geometry, material);
    obj.rotation.x = -Math.PI / 2;
    obj.position.set(x, groundY + FLASH_LIFT, z);
    scene.add(obj);
    visuals.push({ obj, geometry, material, age: 0 });
  }

  return {
    id: 'monsoon',
    setLevel(l: number) {
      level = Math.min(MONSOON_LEVELS.length, Math.max(1, Math.round(l)));
    },
    update(ctx: WeaponContext) {
      // Visuals fade, then go
      for (let i = visuals.length - 1; i >= 0; i--) {
        const v = visuals[i];
        v.age += ctx.dt;
        if (v.age >= FADE_S) {
          removeVisual(scene, v);
          visuals.splice(i, 1);
          continue;
        }
        v.material.opacity = 1 - v.age / FADE_S;
      }

      timer -= ctx.dt;
      if (timer > 0) return;

      const L = levelStats();
      // Every critter damaged this volley. Primaries and chain jumps only pick critters not in here.
      const hit = new Set<number>();
      let struck = false;

      for (let s = 0; s < L.strikes; s++) {
        const candidates = ctx.enemies.filter((e) => !hit.has(e.id) && dist2D(ctx.player, e.pos) < L.range);
        if (candidates.length === 0) break;
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        struck = true;

        const gx = target.pos.x;
        const gz = target.pos.z;
        const groundY = heightAt(gx, gz);
        addBolt(gx, gz, groundY);
        addFlash(gx, gz, groundY, L.splashRadius);

        // Direct hit, then splash on every other critter within splashRadius of the bolt.
        hit.add(target.id);
        ctx.damage(target.id, L.damage * ctx.stats.damageMult);
        for (const e of ctx.enemies) {
          if (e.id !== target.id && dist2D({ x: gx, z: gz }, e.pos) < L.splashRadius) {
            hit.add(e.id);
            ctx.damage(e.id, L.damage * ctx.stats.damageMult);
          }
        }

        // Chain: jump to the nearest critter not yet hit, within chainRange of the last one.
        let last: EnemyView = target;
        for (let c = 0; c < L.chains; c++) {
          let next: EnemyView | null = null;
          let best = Infinity;
          for (const e of ctx.enemies) {
            if (hit.has(e.id)) continue;
            const d = dist2D(last.pos, e.pos);
            if (d <= L.chainRange && d < best) {
              best = d;
              next = e;
            }
          }
          if (!next) break;
          addLine([
            new THREE.Vector3(last.pos.x, CHAIN_Y, last.pos.z),
            new THREE.Vector3(next.pos.x, CHAIN_Y, next.pos.z),
          ]);
          hit.add(next.id);
          ctx.damage(next.id, L.damage * CHAIN_MULT * ctx.stats.damageMult);
          last = next;
        }
      }

      if (struck) {
        ctx.playSfx('boom');
        timer = L.cooldownS * ctx.stats.cooldownMult;
      } else {
        timer = RETRY_S;
      }
    },
    dispose() {
      for (const v of visuals) removeVisual(scene, v);
      visuals.length = 0;
    },
  };
}
