// The Capwood Run's dressing (E14, site `rally-route`): the road surface, start paddock and pavilion, finish arch,
// stage flags, the Cap-water ford pools and their signs, story vignettes and the rally marshal. Route geometry:
// raceTrack/defs/capwoodRun.ts; the plan (props, signs, vignettes, residents): capwood/runPlan.ts.
import * as THREE from 'three';
import { flatLayer } from '@lawn/depth';
import type { StaticPrefabPlacement } from '@lawn/prefabs';
import { createAmbientGnomes } from '../ambientGnomes';
import { buildStaticCells } from '../cull';
import type { Area, AreaDeps } from '../dirtCountry/types';
import { buildSignText } from '../pardonlin/town';
import { propFootprint } from '../pardonlin/plan';
import { boundsOf } from '../pardonlin/layout';
import { buildDirtTrackSurface } from '../raceTrack/trackMesh';
import type { Track, TrackFord } from '../raceTrack/trackDef';
import { TRACKS } from '../raceTrack/tracks';
import { playAt } from '../sound';
import { heightAt, waterAt } from '../terrain';
import type { Blip, Box, World } from '../types';
import { runPlan } from './runPlan';

/** The start paddock's centre, for the blip and the crowd murmur. */
const PADDOCK = { x: 90, z: -760 } as const;
const MURMUR_RANGE = 60;
const BURBLE_RANGE = 40;
const CELL = 1.5;
const CAP_WATER = 0x5f6a2c;

/** A small tileable texture of slow lighter streaks, for the Cap-water's drift. */
function rippleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = 'rgba(120,130,70,0.45)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const x = (i * 29) % 64, y = (i * 17) % 64;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14, y + 3); ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** One ford's water surface: a grid of quads along the road (len + 4 m) and across +-reach, only where water stands. */
function buildFordPool(track: Track, ford: TrackFord, map: THREE.Texture): THREE.Mesh | null {
  const reach = ford.reach ?? track.def.barrierOffset + 4;
  const s0 = ford.s - ford.len / 2 - 2, s1 = ford.s + ford.len / 2 + 2;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let s = s0; s < s1; s += CELL) {
    for (let lat = -reach; lat < reach; lat += CELL) {
      const c = track.frame(s + CELL / 2, lat + CELL / 2);
      const w = waterAt(c.x, c.z);
      if (!w?.ford) continue;
      const base = pos.length / 3;
      for (const [ds, dl] of [[0, 0], [CELL, 0], [CELL, CELL], [0, CELL]]) {
        const p = track.frame(s + ds, lat + dl);
        pos.push(p.x, w.surface, p.z);
        uv.push(p.x * 0.25, p.z * 0.25);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  if (!idx.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({
    color: CAP_WATER, map, transparent: true, opacity: 0.75, roughness: 0.3, metalness: 0.05, depthWrite: false, side: THREE.DoubleSide,
  });
  flatLayer(m, 'decal');
  const mesh = new THREE.Mesh(g, m);
  mesh.name = `capwood-run-ford-${ford.id}`;
  mesh.frustumCulled = true;
  return mesh;
}

export function createCapwoodRunDressing(scene: THREE.Scene, world: World, deps: AreaDeps): Area {
  void deps;
  const track = TRACKS['capwood-run'];
  buildDirtTrackSurface(scene, track, { prefix: 'capwood-run' });

  const plan = runPlan(track);
  const placements: StaticPrefabPlacement[] = [];
  const boxes: Box[] = world.boxes;
  for (const p of plan.props) {
    const ground = heightAt(p.x, p.z);
    placements.push({ id: p.id, x: p.x, y: ground + (p.y ?? 0), z: p.z, yaw: p.yaw ?? 0, rot: p.rot, scale: p.scale, tint: p.tint, trim: p.trim });
    const f = propFootprint(p);
    if (f && p.solid) {
      const r = boundsOf(f);
      boxes.push('r' in p.solid ? { ...r, h: ground + p.solid.h, shape: 'round' } : { ...r, h: ground + p.solid.h });
    }
  }
  for (const s of plan.solids) {
    const ground = heightAt(s.x, s.z);
    if ('r' in s) boxes.push({ minX: s.x - s.r, maxX: s.x + s.r, minZ: s.z - s.r, maxZ: s.z + s.r, h: ground + s.h, shape: 'round' });
    else {
      const r = boundsOf({ x: s.x, z: s.z, w: s.w, d: s.d, yaw: s.yaw });
      boxes.push({ ...r, h: ground + s.h });
    }
  }
  const SIGN_PREFAB = { menu: 'euro-chalkboard-sign', poster: 'euro-poster-board', street: 'euro-street-sign' } as const;
  for (const s of plan.signs) {
    if (s.kind !== 'menu' && s.kind !== 'poster' && s.kind !== 'street') continue;
    const ground = heightAt(s.x, s.z);
    placements.push({ id: SIGN_PREFAB[s.kind], x: s.x, y: ground, z: s.z, yaw: s.yaw });
    boxes.push({ minX: s.x - 0.15, maxX: s.x + 0.15, minZ: s.z - 0.15, maxZ: s.z + 0.15, h: ground + 2, shape: 'round' });
  }
  scene.add(buildStaticCells(placements, { lights: false, name: 'capwood-run' }));
  if (plan.signs.length) {
    const text = buildSignText(plan.signs);
    text.name = 'capwood-run-sign-text';
    scene.add(text);
  }

  // Cap-water pools: thick, slow, mossy.
  const ripple = rippleTexture();
  const fords = track.def.fords ?? [];
  const pools: THREE.Mesh[] = [];
  for (const f of fords) {
    const mesh = buildFordPool(track, f, ripple);
    if (mesh) { scene.add(mesh); pools.push(mesh); }
  }
  const fordCentres = fords.map((f) => track.frame(f.s, 0));

  const people = createAmbientGnomes(scene, plan.residents);
  let murmur = 0;
  let burble = 0;
  let clock = 0;
  const blip: Blip = { x: PADDOCK.x, z: PADDOCK.z, color: '#ff7a00', label: 'the Capwood Run', kind: 'speedway' };

  return {
    update(dt, px, pz) {
      clock += dt;
      ripple.offset.set((clock * 0.02) % 1, (clock * 0.012) % 1);
      people.update(dt, px, pz);
      murmur -= dt;
      if (murmur <= 0 && Math.hypot(px - PADDOCK.x, pz - PADDOCK.z) < MURMUR_RANGE) {
        playAt('crowd-murmur', PADDOCK);
        murmur = 3;
      }
      burble -= dt;
      if (burble <= 0) {
        for (const c of fordCentres) {
          if (Math.hypot(px - c.x, pz - c.z) < BURBLE_RANGE) { playAt('water-lap', c); burble = 2.5; break; }
        }
      }
    },
    blips: () => [blip],
  };
}
