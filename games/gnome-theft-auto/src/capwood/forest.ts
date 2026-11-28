// Capwood, the toadstool forest (E14, site `toadstool-forest`): giant toadstools, glowing caps at night, spores,
// the Great Ring, Warden Chanterelle Stook's stalk hut, signs, story vignettes and the forest's sounds.
// The placements are plain data in forestPlan.ts; this file turns them into merged cells, colliders, glow and life.
import * as THREE from 'three';
import type { StaticPrefabPlacement } from '@lawn/prefabs';
import { flatLayer } from '@lawn/depth';
import { createAmbientGnomes } from '../ambientGnomes';
import { roundBox } from '../collide';
import { buildStaticCells } from '../cull';
import type { Area, AreaDeps } from '../dirtCountry/types';
import { homeOf, registerHome } from '../homes/data';
import { buildSignText } from '../pardonlin/town';
import { playAt } from '../sound';
import { heightAt } from '../terrain';
import type { Blip, World } from '../types';
import { CAPWOOD_PLAN, FOREST_CENTRE, FOREST_RECT, HUT_COLLIDER, WARDEN_DOOR } from './forestPlan';
import { GREAT_RING, WARDEN_HUT } from './spots';

/** The player is "in the forest" inside the site rectangle grown by this much (m). */
const SPORE_MARGIN = 30;
/** Nothing heavy runs when the player is farther than this from the site centre (m). */
const FAR = 400;
const SPORE_COUNT = 240;
const SPORE_BOX = 60;
const SPORE_HEIGHT = 10;
/** Sounds play only when the player is within this of a spot (m). */
const SOUND_RANGE = 60;
const GLOW_PALE = new THREE.Color(0xffe9a0);
const RING_LAMPS = 16;

/** Cap geometry per prefab, for the glow shells: height of the cap's centre above the ground, its radius and half height. */
const CAP_SHELL: Record<string, { y: number; r: number; ry: number }> = {
  'capwood-toadstool-tall': { y: 9, r: 4.5, ry: 1.89 },
  'capwood-toadstool-squat': { y: 2.6, r: 3.2, ry: 0.64 },
};

interface SoundSpot { id: string; x: number; z: number; sound: string; when: 'day' | 'night' | 'any'; every: [number, number]; gain: number }

const SOUND_SPOTS: readonly SoundSpot[] = [
  { id: 'wind-high', x: 200, z: -1170, sound: 'wind-gust', when: 'any', every: [14, 26], gain: 0.5 },
  { id: 'drip', x: 215, z: -1105, sound: 'icicle-tink', when: 'any', every: [5, 11], gain: 0.5 },
  { id: 'birds-east', x: 320, z: -1215, sound: 'bird-song', when: 'day', every: [9, 18], gain: 0.7 },
  { id: 'birds-west', x: 140, z: -1230, sound: 'bird-chirp', when: 'day', every: [6, 13], gain: 0.7 },
  { id: 'crickets', x: 260, z: -1170, sound: 'cricket', when: 'night', every: [4, 9], gain: 0.7 },
  { id: 'owl-ring', x: 140, z: -1135, sound: 'owl', when: 'night', every: [14, 28], gain: 0.8 },
];

function mod(a: number, m: number): number { return ((a % m) + m) % m; }

/** A dark ring of grass round the Great Ring's clearing: follows the ground, on the decal draw layer. */
function fairyRing(): THREE.Mesh {
  const rIn = 10.8, rOut = 13.4, seg = 72, rad = 4;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= rad; j++) {
    const r = rIn + ((rOut - rIn) * j) / rad;
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const x = GREAT_RING.x + Math.cos(a) * r, z = GREAT_RING.z + Math.sin(a) * r;
      pos.push(x, heightAt(x, z) + 0.08, z);
    }
  }
  for (let j = 0; j < rad; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * seg + i, b = j * seg + ((i + 1) % seg), c = a + seg, d = b + seg;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, flatLayer(new THREE.MeshStandardMaterial({ color: 0x24491d, roughness: 1, side: THREE.DoubleSide }), 'decal'));
  m.name = 'capwood-fairy-ring';
  m.receiveShadow = true;
  return m;
}

export function createCapwoodForest(scene: THREE.Scene, world: World, deps: AreaDeps): Area {
  const root = new THREE.Group();
  root.name = 'capwood-forest';
  scene.add(root);

  // ---- Static prefabs, signs and colliders ----
  const placements: StaticPrefabPlacement[] = [];
  for (const p of CAPWOOD_PLAN.props) {
    const gy = heightAt(p.x, p.z);
    placements.push({ id: p.id, x: p.x, y: gy + (p.y ?? 0), z: p.z, yaw: p.yaw ?? 0, rot: p.rot, scale: p.scale, tint: p.tint, trim: p.trim });
    if (p.solid) {
      world.boxes.push('r' in p.solid
        ? roundBox(p.x, p.z, p.solid.r, gy + p.solid.h)
        : { minX: p.x - p.solid.w / 2, maxX: p.x + p.solid.w / 2, minZ: p.z - p.solid.d / 2, maxZ: p.z + p.solid.d / 2, h: gy + p.solid.h });
    }
  }
  placements.push({ id: 'toadstool-cottage', x: WARDEN_HUT.x, y: heightAt(WARDEN_HUT.x, WARDEN_HUT.z), z: WARDEN_HUT.z, yaw: WARDEN_HUT.yaw });
  world.boxes.push(roundBox(HUT_COLLIDER.x, HUT_COLLIDER.z, HUT_COLLIDER.r, heightAt(HUT_COLLIDER.x, HUT_COLLIDER.z) + HUT_COLLIDER.h));
  root.add(buildStaticCells(placements, { lights: false, name: 'capwood' }));
  if (CAPWOOD_PLAN.signs.length) root.add(buildSignText(CAPWOOD_PLAN.signs));

  const home = homeOf('chanterelle');
  if (home) registerHome({ ...home, door: [WARDEN_DOOR.x, WARDEN_DOOR.z, WARDEN_DOOR.yaw] });

  // ---- Night glow: one additive shell round every tall and squat cap ----
  const caps = CAPWOOD_PLAN.props.filter((p) => CAP_SHELL[p.id]);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 10), glowMat, caps.length);
  glow.name = 'capwood-cap-glow';
  glow.frustumCulled = false;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
  caps.forEach((p, i) => {
    const c = CAP_SHELL[p.id];
    const s = p.scale ?? 1;
    pos.set(p.x, heightAt(p.x, p.z) + c.y * s, p.z);
    sc.set(c.r * s * 1.04, c.ry * s * 1.2, c.r * s * 1.04);
    glow.setMatrixAt(i, m4.compose(pos, q, sc));
    glow.setColorAt(i, col.set(p.tint ?? 0xc8382e).lerp(GLOW_PALE, 0.45));
  });
  glow.instanceMatrix.needsUpdate = true;
  if (glow.instanceColor) glow.instanceColor.needsUpdate = true;
  root.add(glow);

  // ---- The Great Ring: halos on its sixteen toadstools and a dark fairy ring of grass ----
  root.add(fairyRing());
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xb8ffc8, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
  const halos = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), haloMat, RING_LAMPS);
  halos.name = 'capwood-ring-halos';
  halos.frustumCulled = false;
  for (let k = 0; k < RING_LAMPS; k++) {
    const a = (k / RING_LAMPS) * Math.PI * 2;
    const x = GREAT_RING.x + Math.cos(a) * 12, z = GREAT_RING.z + Math.sin(a) * 12;
    halos.setMatrixAt(k, m4.compose(pos.set(x, heightAt(x, z) + 2.2, z), q, sc.set(1.6, 1.4, 1.6)));
  }
  halos.instanceMatrix.needsUpdate = true;
  root.add(halos);

  // ---- Spores ----
  const sporePos = new Float32Array(SPORE_COUNT * 3);
  const base = new Float32Array(SPORE_COUNT * 3);
  const vel = new Float32Array(SPORE_COUNT * 3);
  for (let i = 0; i < SPORE_COUNT; i++) {
    // Deterministic scatter (golden-ratio steps), no Math.random: the same forest every run.
    const f = (k: number): number => mod(i * k + k * 0.37, 1);
    base[i * 3] = f(0.6180339) * SPORE_BOX;
    base[i * 3 + 1] = f(0.7548776) * SPORE_HEIGHT;
    base[i * 3 + 2] = f(0.5698402) * SPORE_BOX;
    vel[i * 3] = (f(0.3247179) - 0.5) * 0.6;
    vel[i * 3 + 1] = 0.25 + f(0.4655712) * 0.45;
    vel[i * 3 + 2] = (f(0.8191725) - 0.5) * 0.6;
  }
  const sporeGeo = new THREE.BufferGeometry();
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));
  const sporeMat = new THREE.PointsMaterial({ color: 0xf3e6a0, size: 0.12, sizeAttenuation: true, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
  const spores = new THREE.Points(sporeGeo, sporeMat);
  spores.name = 'capwood-spores';
  spores.frustumCulled = false;
  spores.visible = false;
  root.add(spores);

  // ---- People ----
  const residents = createAmbientGnomes(scene, CAPWOOD_PLAN.residents);

  // ---- Sound timers (seeded gaps) ----
  let seed = 0x5f3a91;
  const rnd = (): number => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const next = SOUND_SPOTS.map((s) => rnd() * s.every[1]);

  let clock = 0;
  let ringSeen = false;

  const blipList: Blip[] = [{ x: 250, z: -1180, color: '#c8382e', kind: 'park', label: 'Capwood' }];

  return {
    update(dt, px, pz, night) {
      if (Math.hypot(px - FOREST_CENTRE.x, pz - FOREST_CENTRE.z) > FAR) {
        spores.visible = false;
        glow.visible = false;
        halos.visible = false;
        return;
      }
      clock += dt;
      residents.update(dt, px, pz);

      glowMat.opacity = 0.6 * night;
      glow.visible = night > 0.05;
      haloMat.opacity = 0.8 * night;
      halos.visible = night > 0.05;

      const inForest = px > FOREST_RECT.minX - SPORE_MARGIN && px < FOREST_RECT.maxX + SPORE_MARGIN
        && pz > FOREST_RECT.minZ - SPORE_MARGIN && pz < FOREST_RECT.maxZ + SPORE_MARGIN;
      spores.visible = inForest;
      if (inForest) {
        const gy = heightAt(px, pz);
        const half = SPORE_BOX / 2;
        for (let i = 0; i < SPORE_COUNT; i++) {
          sporePos[i * 3] = px - half + mod(base[i * 3] + clock * vel[i * 3] - px + half, SPORE_BOX);
          sporePos[i * 3 + 1] = gy + mod(base[i * 3 + 1] + clock * vel[i * 3 + 1], SPORE_HEIGHT);
          sporePos[i * 3 + 2] = pz - half + mod(base[i * 3 + 2] + clock * vel[i * 3 + 2] - pz + half, SPORE_BOX);
        }
        sporeGeo.attributes.position.needsUpdate = true;
        sporeMat.opacity = 0.2 + 0.5 * night;
        sporeMat.size = 0.12 + 0.1 * night;
      }

      for (let i = 0; i < SOUND_SPOTS.length; i++) {
        const s = SOUND_SPOTS[i];
        next[i] -= dt;
        if (next[i] > 0) continue;
        next[i] = s.every[0] + rnd() * (s.every[1] - s.every[0]);
        if (Math.hypot(px - s.x, pz - s.z) > SOUND_RANGE) continue;
        if (s.when === 'day' && night > 0.4) continue;
        if (s.when === 'night' && night < 0.6) continue;
        playAt(s.sound, { x: s.x, z: s.z }, { maxDist: SOUND_RANGE, gain: s.gain, bus: 'ambience' });
      }

      if (!ringSeen && night > 0.5 && Math.hypot(px - GREAT_RING.x, pz - GREAT_RING.z) <= GREAT_RING.r) {
        ringSeen = true;
        deps.unlock('gta-toadstool-trail');
        deps.toast('The Great Ring glows. Section Nine does not apply to looking.');
      }
    },
    blips: () => blipList,
  };
}
