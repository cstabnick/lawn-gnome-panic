import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { Weapon, WeaponContext, SlingshotLevel } from '../config';
import { SLINGSHOT_LEVELS } from '../config';

const PEBBLE_RADIUS = 0.12;

/** A pebble from the sling prefab, lifted so its centre sits at the position the game sets. */
function makePebble(): THREE.Object3D {
  const holder = new THREE.Group();
  const pebble = buildPrefab('sling-pebble');
  pebble.position.y = -PEBBLE_RADIUS;
  holder.add(pebble);
  return holder;
}

interface Pebble {
  mesh: THREE.Object3D;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  life: number;
  pierceLeft: number;
  hit: Set<number>;
}

function dist2D(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}

export function createSlingshot(scene: THREE.Scene): Weapon {
  let level = 1;
  let timer = 0;
  const pebbles: Pebble[] = [];
  const cur = (): SlingshotLevel => SLINGSHOT_LEVELS[level - 1];

  function removePebble(index: number): void {
    scene.remove(pebbles[index].mesh);
    pebbles.splice(index, 1);
  }

  function fire(ctx: WeaponContext, L: SlingshotLevel): boolean {
    const px = ctx.player.x;
    const pz = ctx.player.z;
    const candidates = ctx.enemies
      .map((e) => ({ e, d: dist2D(px, pz, e.pos.x, e.pos.z) }))
      .filter((c) => c.d < L.range)
      .sort((a, b) => a.d - b.d)
      .map((c) => c.e);
    if (candidates.length === 0) return false;

    for (let i = 0; i < L.projectiles; i++) {
      const target = candidates[i % candidates.length];
      let dx = target.pos.x - px;
      let dz = target.pos.z - pz;
      const len = Math.hypot(dx, dz);
      if (len < 1e-6) {
        dx = Math.sin(ctx.facing);
        dz = Math.cos(ctx.facing);
      } else {
        dx /= len;
        dz /= len;
      }
      const mesh = makePebble();
      scene.add(mesh);
      pebbles.push({
        mesh,
        x: px,
        y: ctx.player.y + 0.6,
        z: pz,
        vx: dx * L.speed,
        vz: dz * L.speed,
        life: L.range / L.speed + 0.2,
        pierceLeft: L.pierce,
        hit: new Set<number>(),
      });
    }
    ctx.playSfx('shoot');
    return true;
  }

  return {
    id: 'slingshot',
    setLevel(lv: number) {
      level = lv;
    },
    update(ctx: WeaponContext) {
      const L = cur();
      timer -= ctx.dt;
      if (timer <= 0) {
        timer = fire(ctx, L) ? L.cooldownS * ctx.stats.cooldownMult : 0.1;
      }

      const damage = L.damage * ctx.stats.damageMult;
      for (let i = pebbles.length - 1; i >= 0; i--) {
        const p = pebbles[i];
        p.x += p.vx * ctx.dt;
        p.z += p.vz * ctx.dt;
        p.life -= ctx.dt;

        let removed = false;
        for (const e of ctx.enemies) {
          if (p.hit.has(e.id)) continue;
          if (dist2D(p.x, p.z, e.pos.x, e.pos.z) < e.radius + 0.2) {
            ctx.damage(e.id, damage);
            p.hit.add(e.id);
            if (p.pierceLeft === 0) {
              removed = true;
              break;
            }
            p.pierceLeft -= 1;
          }
        }

        if (removed || p.life <= 0) {
          removePebble(i);
        } else {
          p.mesh.position.set(p.x, p.y, p.z);
        }
      }
    },
    dispose() {
      for (const p of pebbles) scene.remove(p.mesh);
      pebbles.length = 0;
    },
  };
}
