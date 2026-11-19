// Flood Run view: the water surfaces, cannons and geysers, drawn with three.js. Reads the pure sim and obstacles;
// owns no simulation state. Built once; per frame it only rewrites vertex heights and colours.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { World } from '../world';
import { cannonState, geyserState } from './obstacles';
import { FLOOD, type Cannon, type Flood, type Geyser, type Obstacles, type RunGrid } from './types';

export interface FloodView {
  /** dt real seconds; t the sim clock for cannonState / geyserState; camPos for culling runs far from the camera. */
  update(dt: number, t: number, camPos: THREE.Vector3): void;
  dispose(): void;
}

const WATER_NEAR = 700;
const OBJECT_NEAR = 600;
const SPRAY_N = 40;
const UP = new THREE.Vector3(0, 1, 0);

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

interface WaterRun {
  mesh: THREE.Mesh;
  geo: THREE.BufferGeometry;
  pos: Float32Array;
  /** Per-vertex (depth, speed) for the water shader. */
  info: Float32Array;
  mat: THREE.ShaderMaterial;
  /** Rows below the band that were written last frame (they go dry once, then are left alone). */
  prevLo: number;
  cx: number;
  cz: number;
}

interface CannonView {
  c: Cannon;
  group: THREE.Group;
  sphere: THREE.Mesh;
  jet: THREE.Mesh;
  jetMat: THREE.MeshBasicMaterial;
  spray: THREE.Points;
  sprayPos: Float32Array;
  sprayLat: Float32Array;
  sprayUp: Float32Array;
  sinY: number;
  cosY: number;
}

interface GeyserView {
  g: Geyser;
  group: THREE.Group;
  ring: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  column: THREE.Mesh;
  colMat: THREE.MeshBasicMaterial;
}

export function createFloodView(scene: THREE.Scene, _world: World, flood: Flood, obstacles: Obstacles): FloodView {
  const root = new THREE.Group();
  root.name = 'flood-view';
  scene.add(root);

  // ---- shared materials and geometries
  // Water shader: all cheats, no extra simulation. Scrolling layered noise stretched along the flow gives ripples and a
  // normal, which lights it (banded, to match the toon look) with a sun glint and a fresnel rim; foam streaks come from
  // flow speed and thin edges; the edge fades out by depth instead of cutting off; glitter on top.
  const WATER_VERT = `
    attribute vec2 aInfo;
    varying vec2 vInfo;
    varying vec3 vWorld;
    void main() {
      vInfo = aInfo;
      vec4 w = modelMatrix * vec4(position, 1.0);
      vWorld = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`;
  const WATER_FRAG = `
    uniform float uTime;
    uniform vec2 uFlow;
    varying vec2 vInfo;
    varying vec3 vWorld;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float height(vec2 p, float spd) {
      vec2 side = vec2(-uFlow.y, uFlow.x);
      float t = uTime * (2.0 + spd * 0.9);
      vec2 q = vec2(dot(p, uFlow) - t, dot(p, side));
      return vnoise(q * vec2(0.30, 0.80)) * 0.55 + vnoise(q * vec2(0.85, 2.0) + 7.0) * 0.30 + vnoise(q * vec2(2.1, 4.2) + 3.0) * 0.15;
    }
    void main() {
      float depth = vInfo.x;
      float spd = vInfo.y;
      float alpha = smoothstep(0.012, 0.24, depth);
      if (alpha < 0.01) discard;
      vec2 p = vWorld.xz;
      float e = 0.3;
      float h = height(p, spd);
      float amp = 1.4 + spd * 0.22;
      vec3 n = normalize(vec3(-(height(p + vec2(e, 0.0), spd) - h) / e * amp, 1.0, -(height(p + vec2(0.0, e), spd) - h) / e * amp));
      vec3 L = normalize(vec3(0.42, 0.8, 0.43));
      vec3 V = normalize(cameraPosition - vWorld);
      float diff = max(dot(n, L), 0.0);
      float cel = mix(diff, floor(diff * 3.0 + 0.5) / 3.0, 0.55);
      float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
      float spec = smoothstep(0.5, 0.62, pow(max(dot(n, normalize(L + V)), 0.0), 70.0));
      vec3 shallow = vec3(0.34, 0.80, 0.98);
      vec3 deep = vec3(0.01, 0.34, 0.74);
      vec3 col = mix(shallow, deep, clamp(depth / 2.2, 0.0, 1.0)) * (0.62 + 0.5 * cel);
      col += fres * vec3(0.55, 0.85, 1.0) * 0.35 + spec * vec3(1.0);
      // foam: fast water and thin edges, in streaks along the flow
      float foamAmt = max(smoothstep(4.5, 11.0, spd) * 0.8, 1.0 - smoothstep(0.02, 0.2, depth));
      vec2 side = vec2(-uFlow.y, uFlow.x);
      float fn = vnoise(vec2(dot(p, uFlow) * 0.45 - uTime * (3.0 + spd), dot(p, side) * 2.6));
      float foam = clamp(foamAmt * smoothstep(0.3, 0.65, fn + foamAmt * 0.45), 0.0, 1.0);
      col = mix(col, vec3(1.0), foam);
      // glitter
      col += step(0.992, hash(floor(p * 14.0) + floor(uTime * 7.0))) * (1.0 - foam) * 0.5;
      gl_FragColor = vec4(col, alpha * 0.92);
    }`;
  const waterMat = new THREE.ShaderMaterial({
    vertexShader: WATER_VERT,
    fragmentShader: WATER_FRAG,
    uniforms: { uTime: { value: 0 }, uFlow: { value: new THREE.Vector2(0, 1) } },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const sphereGeo = new THREE.SphereGeometry(0.3, 10, 8);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.9, depthWrite: false });
  const jetGeo = new THREE.CylinderGeometry(FLOOD.cannonRadius, 0.3, FLOOD.cannonRange, 14, 1, true);
  jetGeo.translate(0, FLOOD.cannonRange / 2, 0); // base at the muzzle, far end at +range
  const sprayMat = new THREE.PointsMaterial({
    color: 0xe0f7ff, size: 0.4, transparent: true, opacity: 0.85, depthWrite: false,
  });
  const ringGeo = new THREE.RingGeometry(FLOOD.geyserRadius * 0.8, FLOOD.geyserRadius, 40);
  ringGeo.rotateX(-Math.PI / 2);
  const columnGeo = new THREE.CylinderGeometry(FLOOD.geyserRadius * 0.5, FLOOD.geyserRadius * 0.5, 14, 16, 1, true);
  columnGeo.translate(0, 7, 0); // base at the vent, top 14 m up

  // ---- water: one mesh per run, built lazily
  const waters: (WaterRun | null)[] = flood.runs.map(() => null);

  function buildWater(r: RunGrid): WaterRun {
    const n = r.nu * r.nv;
    const pos = new Float32Array(n * 3);
    const info = new Float32Array(n * 2);
    for (let j = 0; j < r.nv; j++) {
      for (let k = 0; k < r.nu; k++) {
        const i = j * r.nu + k;
        pos[i * 3] = r.ox + r.fx * k * r.cell + r.sx * j * r.cell;
        pos[i * 3 + 1] = r.bed[i] - 0.25;
        pos[i * 3 + 2] = r.oz + r.fz * k * r.cell + r.sz * j * r.cell;
      }
    }
    // Index buffer: built once over every quad whose four corners are all ground.
    const idx = new Uint32Array(Math.max(0, (r.nu - 1) * (r.nv - 1) * 6));
    let m = 0;
    for (let j = 0; j < r.nv - 1; j++) {
      for (let k = 0; k < r.nu - 1; k++) {
        const a = j * r.nu + k;
        const b = a + 1;
        const c = a + r.nu;
        const d = c + 1;
        if (r.hole[a] || r.hole[b] || r.hole[c] || r.hole[d]) continue;
        idx[m++] = a; idx[m++] = c; idx[m++] = b;
        idx[m++] = c; idx[m++] = d; idx[m++] = b;
      }
    }
    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(pos, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    const infoAttr = new THREE.BufferAttribute(info, 2);
    infoAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);
    geo.setAttribute('aInfo', infoAttr);
    geo.setIndex(new THREE.BufferAttribute(idx.subarray(0, m), 1));
    const mat = waterMat.clone();
    mat.uniforms.uFlow.value.set(r.fx, r.fz);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 2;
    mesh.frustumCulled = false;
    mesh.visible = false;
    root.add(mesh);
    return {
      mesh, geo, pos, info, mat, prevLo: r.lo,
      cx: r.ox + (r.fx * (r.nu - 1) * r.cell + r.sx * (r.nv - 1) * r.cell) / 2,
      cz: r.oz + (r.fz * (r.nu - 1) * r.cell + r.sz * (r.nv - 1) * r.cell) / 2,
    };
  }

  function refreshWater(w: WaterRun, r: RunGrid): void {
    // Only the simulated band changes (plus the rows it just left, once, so they dry out).
    const k1 = Math.max(0, Math.min(w.prevLo, r.lo) - 1);
    const k2 = Math.min(r.nu - 1, r.hi + 1);
    for (let j = 0; j < r.nv; j++) {
      for (let k = k1; k <= k2; k++) {
        const i = j * r.nu + k;
        const d = r.depth[i];
        // Dry cells sink under the ground so they vanish.
        w.pos[i * 3 + 1] = d >= 0.02 ? r.bed[i] + d : r.bed[i] - 0.25;
        w.info[i * 2] = d;
        w.info[i * 2 + 1] = r.speed[i];
      }
    }
    w.prevLo = r.lo;
    w.geo.attributes.position.needsUpdate = true;
    w.geo.attributes.aInfo.needsUpdate = true;
  }

  // ---- cannons
  const cannonViews: CannonView[] = obstacles.cannons.map((c) => {
    const group = new THREE.Group();
    group.name = `flood-cannon-${c.id}`;
    const base = buildPrefab('flood-cannon', { scale: 2.5 });
    base.position.set(c.x, c.y - 1.4 + 0.2, c.z);
    base.rotation.y = c.yaw;
    group.add(base);

    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(c.x, c.y, c.z);
    sphere.visible = false;
    group.add(sphere);

    const jetMat = new THREE.MeshBasicMaterial({
      color: 0xe0f7ff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const sinY = Math.sin(c.yaw);
    const cosY = Math.cos(c.yaw);
    const jet = new THREE.Mesh(jetGeo, jetMat);
    jet.name = 'flood-jet';
    jet.position.set(c.x, c.y, c.z);
    jet.quaternion.setFromUnitVectors(UP, new THREE.Vector3(sinY, 0, cosY));
    jet.visible = false;
    group.add(jet);

    const sprayPos = new Float32Array(SPRAY_N * 3);
    const sprayLat = new Float32Array(SPRAY_N);
    const sprayUp = new Float32Array(SPRAY_N);
    for (let i = 0; i < SPRAY_N; i++) {
      sprayLat[i] = Math.sin(i * 2.399 + c.id * 1.3) * 1.2;
      sprayUp[i] = Math.cos(i * 1.7 + c.id * 0.7) * 0.5 + 0.5;
    }
    const sprayGeo = new THREE.BufferGeometry();
    const sprayAttr = new THREE.BufferAttribute(sprayPos, 3);
    sprayAttr.setUsage(THREE.DynamicDrawUsage);
    sprayGeo.setAttribute('position', sprayAttr);
    const spray = new THREE.Points(sprayGeo, sprayMat);
    spray.frustumCulled = false;
    spray.visible = false;
    group.add(spray);

    root.add(group);
    return { c, group, sphere, jet, jetMat, spray, sprayPos, sprayLat, sprayUp, sinY, cosY };
  });

  // ---- geysers
  const geyserViews: GeyserView[] = obstacles.geysers.map((g) => {
    const group = new THREE.Group();
    group.name = `flood-geyser-${g.id}`;
    const vent = buildPrefab('flood-geyser-vent', { scale: (FLOOD.geyserRadius * 1.6) / 1.2 });
    vent.position.set(g.x, g.y + 0.05, g.z);
    group.add(vent);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(g.x, g.y + 0.08, g.z);
    ring.visible = false;
    group.add(ring);

    const colMat = new THREE.MeshBasicMaterial({
      color: 0xeaf6ff, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const column = new THREE.Mesh(columnGeo, colMat);
    column.name = 'flood-column';
    column.position.set(g.x, g.y + 0.05, g.z);
    column.visible = false;
    group.add(column);

    root.add(group);
    return { g, group, ring, ringMat, column, colMat };
  });

  return {
    update(_dt, t, camPos) {
      for (const w of waters) if (w) w.mat.uniforms.uTime.value = t;
      // Water: only the active runs near the camera.
      for (let ri = 0; ri < flood.runs.length; ri++) {
        const r = flood.runs[ri];
        let w = waters[ri];
        if (!r.active || !nearWater(r, camPos)) {
          if (w) w.mesh.visible = false;
          continue;
        }
        if (!w) {
          w = buildWater(r);
          waters[ri] = w;
        }
        w.mesh.visible = true;
        refreshWater(w, r);
      }

      // Cannons.
      for (const cv of cannonViews) {
        const c = cv.c;
        const dx = c.x - camPos.x;
        const dz = c.z - camPos.z;
        const near = dx * dx + dz * dz <= OBJECT_NEAR * OBJECT_NEAR;
        cv.group.visible = near;
        if (!near) continue;
        const st = cannonState(c, t);
        const k = st.k;
        cv.sphere.visible = st.phase === 'windup';
        if (st.phase === 'windup') cv.sphere.scale.setScalar(1 + 2 * k);
        const firing = st.phase === 'fire';
        cv.jet.visible = firing;
        cv.spray.visible = firing;
        if (!firing) continue;
        cv.jetMat.opacity = 0.55 * (k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1);
        for (let i = 0; i < SPRAY_N; i++) {
          const f = (k * 2 + i / SPRAY_N) % 1;
          const d = f * FLOOD.cannonRange;
          const lat = cv.sprayLat[i];
          const p = i * 3;
          cv.sprayPos[p] = c.x + cv.sinY * d + cv.cosY * lat;
          cv.sprayPos[p + 1] = c.y + cv.sprayUp[i] * 0.6 - f * f * 2.5;
          cv.sprayPos[p + 2] = c.z + cv.cosY * d - cv.sinY * lat;
        }
        (cv.spray.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }

      // Geysers.
      for (const gv of geyserViews) {
        const g = gv.g;
        const dx = g.x - camPos.x;
        const dz = g.z - camPos.z;
        const near = dx * dx + dz * dz <= OBJECT_NEAR * OBJECT_NEAR;
        gv.group.visible = near;
        if (!near) continue;
        const st = geyserState(g, t);
        const k = st.k;
        const windup = st.phase === 'windup';
        const firing = st.phase === 'fire';
        gv.ring.visible = windup;
        if (windup) {
          gv.ring.scale.setScalar(0.7 + 0.3 * k);
          gv.ringMat.opacity = 0.35 + 0.5 * k;
        }
        gv.column.visible = firing;
        if (firing) {
          const rise = 1 - Math.pow(1 - k, 3);
          gv.column.scale.set(1, Math.max(0.02, rise), 1);
          gv.colMat.opacity = k > 0.7 ? 0.7 * (1 - (k - 0.7) / 0.3) : 0.7;
        }
      }
    },

    dispose() {
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          for (const mat of mats) mat.dispose();
        }
      });
      root.clear();
      scene.remove(root);
      waters.fill(null);
      cannonViews.length = 0;
      geyserViews.length = 0;
      sphereGeo.dispose();
      sphereMat.dispose();
      jetGeo.dispose();
      sprayMat.dispose();
      ringGeo.dispose();
      columnGeo.dispose();
      waterMat.dispose();
      for (const w of waters) w?.mat.dispose();
    },
  };
}

function nearWater(r: RunGrid, camPos: THREE.Vector3): boolean {
  const cx = r.ox + (r.fx * (r.nu - 1) * r.cell + r.sx * (r.nv - 1) * r.cell) / 2;
  const cz = r.oz + (r.fz * (r.nu - 1) * r.cell + r.sz * (r.nv - 1) * r.cell) / 2;
  const dx = cx - camPos.x;
  const dz = cz - camPos.z;
  return dx * dx + dz * dz <= WATER_NEAR * WATER_NEAR;
}
