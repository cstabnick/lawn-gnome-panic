// E25 fire system: how fires look. Instanced flame cones that flicker, fx.fire puffs, black smoke, a pool of 2 point
// lights on the nearest fires, steam when doused, a scorch disc (on a draw layer) where a fire was. Reads a FireField
// (fire/types.ts) every frame; owns no simulation.
//
// Use from another epic:
//   const view = createFireView(scene, fx);                 // once
//   each frame: stepFires(field, dt, fuel); view.update(dt, field, camX, camZ);
//   hose: douse(field, x, z, r, litres) and view.steam(x, y, z) for the hiss;
//   view.dispose() when the scene goes. Fires are lit with ignite() (fire/sim.ts).
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import type { Fx } from '../types';
import { FIRE, type Fire, type FireField } from './types';

export interface FireView {
  /** Draw `field` this frame. Fires farther than 220 m from (camX, camZ) are skipped. */
  update(dt: number, field: FireField, camX: number, camZ: number): void;
  /** A puff of white steam (water hitting a fire). */
  steam(x: number, y: number, z: number): void;
  /** Remove every mesh and light it added. */
  dispose(): void;
}

const FLAME_CAP = 160;
const SMOKE_CAP = 40;
const SMOKE_LIFE = 3;
const STEAM_LIFE = 1;
const SEE_DIST = 220;

interface Puff {
  sprite: THREE.Sprite;
  life: number;
  max: number;
  vy: number;
  size: number;
  peak: number;
}

function softTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function createFireView(scene: THREE.Scene, fx: Fx): FireView {
  let clock = 0;
  let frame = 0;

  // Flames: one instanced low cone, base at the origin, additive.
  const coneGeo = new THREE.ConeGeometry(0.5, 1.2, 7, 1, true);
  coneGeo.translate(0, 0.6, 0);
  // Hot at the base, dark red at the tip: additive, so the tip fades into the scene.
  const cp = coneGeo.getAttribute('position');
  const cc = new Float32Array(cp.count * 3);
  for (let i = 0; i < cp.count; i++) {
    const t = Math.min(1, Math.max(0, cp.getY(i) / 1.2));
    cc[i * 3] = 1 - 0.55 * t;
    cc[i * 3 + 1] = 0.75 - 0.7 * t;
    cc[i * 3 + 2] = 0.2 - 0.2 * t;
  }
  coneGeo.setAttribute('color', new THREE.BufferAttribute(cc, 3));
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, vertexColors: true, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const flames = new THREE.InstancedMesh(coneGeo, coneMat, FLAME_CAP);
  flames.frustumCulled = false;
  flames.count = 0;
  flames.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  flames.setColorAt(0, new THREE.Color(1, 1, 1));
  scene.add(flames);

  // Smoke and steam sprites.
  const tex = softTexture();
  const puffs: Puff[] = [];
  for (let i = 0; i < SMOKE_CAP; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
    sprite.visible = false;
    scene.add(sprite);
    puffs.push({ sprite, life: 0, max: 1, vy: 1, size: 1, peak: 0.5 });
  }
  let puffNext = 0;
  function emit(x: number, y: number, z: number, color: number, life: number, vy: number, size: number, peak: number) {
    const p = puffs[puffNext];
    puffNext = (puffNext + 1) % SMOKE_CAP;
    p.sprite.position.set(x, y, z);
    (p.sprite.material as THREE.SpriteMaterial).color.setHex(color);
    p.life = p.max = life;
    p.vy = vy;
    p.size = size;
    p.peak = peak;
    p.sprite.visible = true;
  }

  // Lights.
  const lights = [0, 1].map(() => {
    const l = new THREE.PointLight(0xff8a2a, 0, 14, 2);
    scene.add(l);
    return l;
  });

  // Scorch discs by fire id.
  const scorchGeo = new THREE.CircleGeometry(1, 20);
  scorchGeo.rotateX(-Math.PI / 2);
  const scorchMat = flatLayer(new THREE.MeshBasicMaterial({ color: 0x151210, transparent: true, opacity: 0.75 }), LAYER.marking);
  const scorches = new Map<number, THREE.Mesh>();

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const pos = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const col = new THREE.Color();
  const lightFor: Array<Fire | null> = [null, null];

  function hash(a: number): number {
    const s = Math.sin(a * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  return {
    update(dt, field, camX, camZ) {
      clock += dt;
      frame++;
      let n = 0;
      const seen = new Set<number>();
      lightFor[0] = lightFor[1] = null;
      const dists = [Infinity, Infinity];

      for (const f of field.fires) {
        seen.add(f.id);
        const dx = f.x - camX;
        const dz = f.z - camZ;
        const d2 = dx * dx + dz * dz;
        const near = d2 <= SEE_DIST * SEE_DIST;

        if (f.state !== 'burning') {
          // Scorch disc, then smoke fading over smokeS.
          let s = scorches.get(f.id);
          if (!s) {
            s = new THREE.Mesh(scorchGeo, scorchMat);
            s.position.set(f.x, f.y + 0.015, f.z);
            s.scale.set(f.r * 1.3, 1, f.r * 1.3);
            scene.add(s);
            scorches.set(f.id, s);
          }
          s.visible = near;
          if (near) {
            const fade = 1 - Math.min(1, f.since / FIRE.smokeS);
            if (fade > 0 && Math.random() < dt * 3 * fade) {
              emit(f.x + (Math.random() - 0.5) * f.r, f.y + 0.3, f.z + (Math.random() - 0.5) * f.r, 0x555555, SMOKE_LIFE, 1.1, 1.2 + f.r, 0.35 * fade);
            }
          }
          continue;
        }
        if (!near) continue;

        // Flames.
        const per = Math.min(5, 3 + Math.floor(f.r * 1.2));
        for (let k = 0; k < per && n < FLAME_CAP; k++) {
          const seed = f.id * 17 + k;
          const ph = hash(seed) * 6.28;
          const ang = hash(seed + 3) * 6.28;
          const rad = Math.sqrt(hash(seed + 5)) * f.r * 0.7;
          const fl = 0.8 + 0.25 * Math.sin(clock * (9 + hash(seed + 7) * 6) + ph) + 0.1 * Math.sin(clock * 23 + ph * 2);
          const h = (0.6 + f.r * 1.1) * (0.35 + 0.65 * f.heat) * fl * (k === 0 ? 1.25 : 1);
          const w = (0.5 + f.r * 0.9) * (0.45 + 0.55 * f.heat) * (0.9 + 0.2 * fl);
          pos.set(f.x + Math.cos(ang) * rad, f.y, f.z + Math.sin(ang) * rad);
          e.set(0.12 * Math.sin(clock * 5 + ph), clock * 2 + ph, 0.12 * Math.cos(clock * 4.3 + ph));
          q.setFromEuler(e);
          sc.set(w, h, w);
          m.compose(pos, q, sc);
          flames.setMatrixAt(n, m);
          const t = 0.35 + 0.4 * fl * f.heat;
          col.setRGB(1, 0.35 + 0.5 * t, 0.1 + 0.25 * t * t);
          flames.setColorAt(n, col);
          n++;
        }

        // Puffs: every other frame, fewer when weak.
        if ((frame + f.id) % 2 === 0 && (f.heat >= 0.4 || (frame + f.id) % 4 === 0)) fx.fire(f.x, f.y + 0.2, f.z, f.r);

        // Nearest two for the lights.
        for (let i = 0; i < 2; i++) {
          if (d2 < dists[i]) {
            if (i === 0) { dists[1] = dists[0]; lightFor[1] = lightFor[0]; }
            dists[i] = d2;
            lightFor[i] = f;
            break;
          }
        }
      }

      flames.count = n;
      flames.instanceMatrix.needsUpdate = true;
      if (flames.instanceColor) flames.instanceColor.needsUpdate = true;

      for (let i = 0; i < 2; i++) {
        const f = lightFor[i];
        const l = lights[i];
        if (!f) { l.intensity = 0; continue; }
        const fl = 0.85 + 0.15 * Math.sin(clock * 13 + i * 2) + 0.1 * Math.sin(clock * 31 + i);
        l.position.set(f.x, f.y + 0.4 + f.r * 0.8, f.z);
        l.intensity = (6 + f.r * 8) * f.heat * fl;
      }

      for (const [id, s] of scorches) {
        if (seen.has(id)) continue;
        scene.remove(s);
        scorches.delete(id);
      }

      for (const p of puffs) {
        if (!p.sprite.visible) continue;
        p.life -= dt;
        if (p.life <= 0) { p.sprite.visible = false; continue; }
        const a = p.life / p.max;
        p.sprite.position.y += p.vy * dt;
        p.sprite.scale.setScalar(p.size * (1.6 - a * 0.8));
        (p.sprite.material as THREE.SpriteMaterial).opacity = p.peak * Math.min(1, a * 2.5) * a;
      }
    },

    steam(x, y, z) {
      for (let i = 0; i < 4; i++) {
        emit(x + (Math.random() - 0.5) * 0.6, y + Math.random() * 0.3, z + (Math.random() - 0.5) * 0.6, 0xffffff, STEAM_LIFE, 3 + Math.random() * 1.5, 0.9 + Math.random() * 0.5, 0.6);
      }
    },

    dispose() {
      scene.remove(flames);
      flames.dispose();
      coneGeo.dispose();
      coneMat.dispose();
      for (const p of puffs) {
        scene.remove(p.sprite);
        p.sprite.material.dispose();
      }
      tex.dispose();
      for (const l of lights) scene.remove(l);
      for (const s of scorches.values()) scene.remove(s);
      scorches.clear();
      scorchGeo.dispose();
      scorchMat.dispose();
    },
  };
}
