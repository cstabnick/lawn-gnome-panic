// The island world: terrain with a painted lie texture, the sea, trees and palms, each hole's cup, flag and
// tee markers, a clubhouse, distant islands and drifting clouds. Built once in createWorld; update() animates
// the sea, the flags and the clouds.
import * as THREE from 'three';
import type { Ctx, System } from './config';
import { CLUBHOUSE, HOLES, ISLAND, LOOK } from './config';
import { distToCoast, distToPath, heightAt, lieAt } from './course';
import type { Plant } from './trees';
import { PINE_TIER_H, PINE_TIER_R, PINE_TIER_Y, TREES, lobeCentres, mulberry32 } from './trees';

/** Lie texture: the island is 1400 x 1120 yards. It is built at 1 px per yard at load, then at HI_RES px per yard
 * in the background (a slice of rows per frame) and swapped in when done. Pixel (i, j) at p px/yd is world
 * (x = (i + 0.5) / p - 700, z = (j + 0.5) / p - 560). */
const ISLAND_W = 1400;
const ISLAND_H = 1120;
const HI_RES = 2;
/** Milliseconds of background texture work per frame. */
const HI_RES_BUDGET_MS = 8;
/** Sea vertices farther than this from the origin swell; nearer ones stay flat so the shore and ponds stay put. */
const SWELL_FROM = 700;

interface FlagRig { group: THREE.Group; geo: THREE.PlaneGeometry; bx: Float32Array; bz: Float32Array }

/** Cheap per-pixel noise in [0, 1). */
function hash2(i: number, j: number): number {
  const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function rgbOf(hex: number): [number, number, number] {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function shade(v: number, k: number): number {
  return Math.max(0, Math.min(255, Math.round(v * k)));
}

interface LiePainter {
  canvas: HTMLCanvasElement;
  /** Paints up to the given time budget (ms); returns true when every row is done. */
  paint(budgetMs: number): boolean;
}

function lieColors() {
  return {
    fairway: rgbOf(LOOK.fairway), rough: rgbOf(LOOK.rough), green: rgbOf(LOOK.green),
    fringe: rgbOf(LOOK.fringe), tee: rgbOf(LOOK.tee), sand: rgbOf(LOOK.sand),
    beach: rgbOf(LOOK.beach), pond: rgbOf(LOOK.pond), waterDeep: rgbOf(LOOK.waterDeep),
  };
}

/** A canvas of the course's lies at `ppy` pixels per yard, painted a slice of rows at a time. */
function liePainter(ppy: number): LiePainter {
  const W = ISLAND_W * ppy;
  const H = ISLAND_H * ppy;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g2 = canvas.getContext('2d');
  if (!g2) throw new Error('2D canvas is not available');
  const C = lieColors();
  let j = 0;
  const ROWS = 16;
  return {
    canvas,
    paint(budgetMs: number): boolean {
      const t0 = performance.now();
      while (j < H) {
        const rows = Math.min(ROWS, H - j);
        const img = g2.createImageData(W, rows);
        const px = img.data;
        for (let r = 0; r < rows; r++) {
          const jj = j + r;
          const z = (jj + 0.5) / ppy - ISLAND_H / 2;
          for (let i = 0; i < W; i++) {
            const x = (i + 0.5) / ppy - ISLAND_W / 2;
            const lie = lieAt(x, z);
            let c: [number, number, number];
            let k = 1;
            if (lie === 'water') {
              c = distToCoast(x, z) > 0 ? C.pond : C.waterDeep;
            } else if (lie === 'sand') {
              c = distToCoast(x, z) < ISLAND.beach + 2 ? C.beach : C.sand;
            } else if (lie === 'rough') {
              c = C.rough;
              k = 1 + (hash2(Math.floor(x * 2), Math.floor(z * 2)) - 0.5) * 0.16;
            } else if (lie === 'fairway') {
              c = C.fairway;
              let best = Infinity;
              let along = 0;
              for (const hole of HOLES) {
                const p = distToPath(hole, x, z);
                if (p.dist < best) { best = p.dist; along = p.along; }
              }
              k = Math.floor(along / 12) % 2 === 0 ? 1.06 : 0.94;
            } else if (lie === 'green') {
              c = C.green;
              k = ((Math.floor(x / 3) + Math.floor(z / 3)) & 1) === 0 ? 1.03 : 0.97;
            } else {
              c = lie === 'fringe' ? C.fringe : C.tee;
              k = 1 + (hash2(Math.floor(x * 2), Math.floor(z * 2)) - 0.5) * 0.04;
            }
            const o = (r * W + i) * 4;
            px[o] = shade(c[0], k);
            px[o + 1] = shade(c[1], k);
            px[o + 2] = shade(c[2], k);
            px[o + 3] = 255;
          }
        }
        g2.putImageData(img, 0, j);
        j += rows;
        if (performance.now() - t0 > budgetMs) break;
      }
      return j >= H;
    },
  };
}

function lieTexture(canvas: HTMLCanvasElement, maxAniso: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  // Plane UVs after rotateX(-PI/2): v = 1 at z = -560. With flipY (the default) canvas row 0 is sampled at v = 1,
  // so row 0 (z = -560) lands on the north edge.
  tex.flipY = true;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeInstances(geo: THREE.BufferGeometry, mat: THREE.Material, items: Plant[]): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geo, mat, items.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  items.forEach((it, i) => {
    p.set(it.x, it.y, it.z);
    e.set(0, it.yaw, 0);
    q.setFromEuler(e);
    sc.set(it.s, it.s, it.s);
    m.compose(p, q, sc);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  return mesh;
}

/** A placed instance with a per-axis scale (the big trees stretch their canopies). */
interface Xf { x: number; y: number; z: number; yaw: number; sx: number; sy: number; sz: number }

function makeXfInstances(geo: THREE.BufferGeometry, mat: THREE.Material, items: Xf[]): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geo, mat, items.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  items.forEach((it, i) => {
    p.set(it.x, it.y, it.z);
    e.set(0, it.yaw, 0);
    q.setFromEuler(e);
    sc.set(it.sx, it.sy, it.sz);
    m.compose(p, q, sc);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  return mesh;
}

export function createWorld(ctx: Ctx): System {
  const { scene, state } = ctx;
  // Islands and clouds draw from their own seed; canopy colours from another (trees.ts owns the placement).
  const rand = mulberry32(9);
  const colourRand = mulberry32(8);

  // ---- Terrain ------------------------------------------------------------
  // One vertex every 2 yards.
  const terrainGeo = new THREE.PlaneGeometry(ISLAND_W, ISLAND_H, ISLAND_W / 2, ISLAND_H / 2);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position;
  for (let i = 0; i < tPos.count; i++) tPos.setY(i, heightAt(tPos.getX(i), tPos.getZ(i)));
  tPos.needsUpdate = true;
  terrainGeo.computeVertexNormals();
  const maxAniso = ctx.renderer.capabilities.getMaxAnisotropy();
  const lowRes = liePainter(1);
  lowRes.paint(Infinity);
  const terrainMat = new THREE.MeshStandardMaterial({ map: lieTexture(lowRes.canvas, maxAniso), roughness: 0.95 });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  // The sharper texture is painted in the background and swapped in when done (if the GPU can hold it).
  let hiRes: LiePainter | null = ISLAND_W * HI_RES <= ctx.renderer.capabilities.maxTextureSize ? liePainter(HI_RES) : null;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // ---- Sea ----------------------------------------------------------------
  const seaGeo = new THREE.PlaneGeometry(6000, 6000, 120, 120);
  seaGeo.rotateX(-Math.PI / 2);
  const seaPos = seaGeo.attributes.position;
  const seaCount = seaPos.count;
  const seaBaseX = new Float32Array(seaCount);
  const seaBaseZ = new Float32Array(seaCount);
  for (let i = 0; i < seaCount; i++) {
    seaBaseX[i] = seaPos.getX(i);
    seaBaseZ[i] = seaPos.getZ(i);
  }
  const sea = new THREE.Mesh(
    seaGeo,
    new THREE.MeshStandardMaterial({ color: LOOK.water, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.92 }),
  );
  scene.add(sea);

  // ---- Trees and palms ----------------------------------------------------
  // Placement lives in trees.ts so the collisions see the same trees.
  const { broadleaf, palms } = TREES;

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }); // instance colours carry the greens
  const palmBarkMat = new THREE.MeshStandardMaterial({ color: 0x8d6e4b, roughness: 0.9 });
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x2d6e2b, roughness: 0.8, side: THREE.DoubleSide });

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.2, 4, 6);
  const canopyGeo = new THREE.SphereGeometry(3, 8, 6);
  const trunks = makeInstances(trunkGeo, barkMat, broadleaf.map((p) => ({ ...p, y: p.y + 2 * p.s })));
  const canopies = makeInstances(canopyGeo, leafMat, broadleaf.map((p) => ({ ...p, y: p.y + 4.5 * p.s })));
  const leafColours = [0x2f7d32, 0x3b8f3a, 0x2a6e2f, 0x4a9a3c];
  for (let i = 0; i < broadleaf.length; i++) {
    canopies.setColorAt(i, new THREE.Color(leafColours[Math.floor(colourRand() * leafColours.length)]));
  }
  scene.add(trunks, canopies);

  const palmTrunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 7, 6);
  const frondGeo = new THREE.ConeGeometry(3.6, 2.4, 7);
  frondGeo.rotateX(Math.PI);
  frondGeo.scale(1, 0.35, 1);
  const palmTrunks = makeInstances(palmTrunkGeo, palmBarkMat, palms.map((p) => ({ ...p, y: p.y + 3.5 * p.s })));
  const fronds = makeInstances(frondGeo, frondMat, palms.map((p) => ({ ...p, y: p.y + 7 * p.s })));
  scene.add(palmTrunks, fronds);

  // ---- Big trees: giant oaks and tall pines -------------------------------
  // Big trees are placed in trees.ts (same seeds and budgets as before).
  const { oaks, pines } = TREES;

  // Oaks: trunk, main crown, and two side lobes (2 instances per oak, same colour as their oak).
  const oakTrunks: Xf[] = [];
  const oakCrowns: Xf[] = [];
  const oakLobes: Xf[] = [];
  const oakCol: THREE.Color[] = [];
  const oakColA = new THREE.Color(0x2f6b2a);
  const oakColB = new THREE.Color(0x3f8a35);
  for (const t of oaks) {
    const gy = heightAt(t.x, t.z);
    const s = t.s;
    oakTrunks.push({ x: t.x, y: gy + 6 * s, z: t.z, yaw: t.yaw, sx: s, sy: s, sz: s });
    oakCrowns.push({ x: t.x, y: gy + 15 * s, z: t.z, yaw: t.yaw, sx: 11 * s, sy: 8 * s, sz: 11 * s });
    for (const l of lobeCentres(t)) {
      oakLobes.push({ x: l.x, y: l.y, z: l.z, yaw: t.yaw, sx: 7 * s, sy: 5.5 * s, sz: 7 * s });
    }
    oakCol.push(oakColA.clone().lerp(oakColB, colourRand()));
  }
  const oakCanopyGeo = new THREE.IcosahedronGeometry(1, 1);
  const oakTrunkMesh = makeXfInstances(
    new THREE.CylinderGeometry(0.9, 1.6, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x5b3a22, roughness: 0.9 }),
    oakTrunks,
  );
  const oakLeafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true }); // instance colours carry the greens
  const oakCrownMesh = makeXfInstances(oakCanopyGeo, oakLeafMat, oakCrowns);
  const oakLobeMesh = makeXfInstances(oakCanopyGeo, oakLeafMat, oakLobes);
  oaks.forEach((_, i) => {
    oakCrownMesh.setColorAt(i, oakCol[i]);
    oakLobeMesh.setColorAt(2 * i, oakCol[i]);
    oakLobeMesh.setColorAt(2 * i + 1, oakCol[i]);
  });
  scene.add(oakTrunkMesh, oakCrownMesh, oakLobeMesh);

  // Pines: one trunk and three stacked dark-green cones.
  const pineTrunks: Xf[] = [];
  const pineTiers: Xf[][] = PINE_TIER_Y.map(() => []);
  for (const t of pines) {
    const gy = heightAt(t.x, t.z);
    const s = t.s;
    pineTrunks.push({ x: t.x, y: gy + 9 * s, z: t.z, yaw: t.yaw, sx: s, sy: s, sz: s });
    PINE_TIER_Y.forEach((ty, k) => {
      pineTiers[k].push({ x: t.x, y: gy + ty * s, z: t.z, yaw: t.yaw, sx: s, sy: s, sz: s });
    });
  }
  const pineBarkMat = new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 });
  const pineLeafMat = new THREE.MeshStandardMaterial({ color: 0x1f4d2b, roughness: 0.8 });
  scene.add(makeXfInstances(new THREE.CylinderGeometry(0.5, 0.9, 18, 6), pineBarkMat, pineTrunks));
  PINE_TIER_Y.forEach((_, k) => {
    scene.add(makeXfInstances(new THREE.ConeGeometry(PINE_TIER_R[k], PINE_TIER_H[k], 8), pineLeafMat, pineTiers[k]));
  });

  // ---- Holes: cup, flagstick, flag and tee markers -------------------------
  const cupMat = new THREE.MeshStandardMaterial({ color: 0x101410, roughness: 1 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.6 });
  const flagMat = new THREE.MeshStandardMaterial({ color: 0xd93636, roughness: 0.8, side: THREE.DoubleSide });
  const markerMat = new THREE.MeshStandardMaterial({ color: 0x2a6fd6, roughness: 0.5 });
  const cupGeo = new THREE.CircleGeometry(0.12, 20);
  cupGeo.rotateX(-Math.PI / 2);
  const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6);
  const markerGeo = new THREE.SphereGeometry(0.25, 12, 8);

  const flags: FlagRig[] = [];
  for (const hole of HOLES) {
    const gy = heightAt(hole.pin.x, hole.pin.z);

    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.set(hole.pin.x, gy + 0.01, hole.pin.z);
    scene.add(cup);

    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(hole.pin.x, gy + 1.3, hole.pin.z);
    pole.castShadow = true;
    scene.add(pole);

    // Flag: left edge on the pole, top edge at the top of the flagstick. Its group sits on the pole.
    const fgeo = new THREE.PlaneGeometry(0.9, 0.55, 6, 1);
    fgeo.translate(0.45, 0, 0);
    const fpos = fgeo.attributes.position;
    const bx = new Float32Array(fpos.count);
    const bz = new Float32Array(fpos.count);
    for (let i = 0; i < fpos.count; i++) {
      bx[i] = fpos.getX(i);
      bz[i] = fpos.getZ(i);
    }
    const flagGroup = new THREE.Group();
    flagGroup.position.set(hole.pin.x, gy + 2.325, hole.pin.z);
    flagGroup.add(new THREE.Mesh(fgeo, flagMat));
    scene.add(flagGroup);
    flags.push({ group: flagGroup, geo: fgeo, bx, bz });

    // Two blue tee markers, 4 yd apart across the tee centre, perpendicular to the first leg.
    const dx = hole.path[1].x - hole.tee.x;
    const dz = hole.path[1].z - hole.tee.z;
    const len = Math.hypot(dx, dz);
    const perpX = -dz / len;
    const perpZ = dx / len;
    for (const sgn of [-1, 1]) {
      const mx = hole.tee.x + perpX * 2 * sgn;
      const mz = hole.tee.z + perpZ * 2 * sgn;
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(mx, heightAt(mx, mz) + 0.25, mz);
      marker.castShadow = true;
      scene.add(marker);
    }
  }

  // ---- Clubhouse ----------------------------------------------------------
  const cx = CLUBHOUSE.x;
  const cz = CLUBHOUSE.z;
  const cy = heightAt(cx, cz);
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xf6ecd2, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(24, 10, 14), creamMat);
  body.position.set(cx, cy + 5, cz);
  body.castShadow = true;
  body.receiveShadow = true;
  scene.add(body);

  // Four-sided pitched roof: a unit cone turned so its sides face the box sides, then scaled to the footprint.
  const roofGeo = new THREE.ConeGeometry(1, 1, 4);
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.scale(12 * Math.SQRT2, 4, 7 * Math.SQRT2);
  const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.7 }));
  roof.position.set(cx, cy + 12, cz);
  roof.castShadow = true;
  scene.add(roof);

  const glassMat = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.3 });
  const windowGeo = new THREE.BoxGeometry(2.4, 2.2, 0.3);
  const planterGeo = new THREE.BoxGeometry(2.8, 0.5, 0.7);
  for (const wx of [-8, -3, 3, 8]) {
    const w = new THREE.Mesh(windowGeo, glassMat);
    w.position.set(cx + wx, cy + 5.5, cz + 7.15);
    scene.add(w);
    const planter = new THREE.Mesh(planterGeo, barkMat);
    planter.position.set(cx + wx, cy + 4.3, cz + 7.5);
    planter.castShadow = true;
    scene.add(planter);
  }

  const clubPole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8, 6), poleMat);
  clubPole.position.set(cx, cy + 18, cz);
  clubPole.castShadow = true;
  scene.add(clubPole);

  // ---- Distant islands ----------------------------------------------------
  const islandGeo = new THREE.SphereGeometry(1, 16, 10);
  const islandSandMat = new THREE.MeshStandardMaterial({ color: LOOK.sand, roughness: 1 });
  const islandGrassMat = new THREE.MeshStandardMaterial({ color: 0x5cae4b, roughness: 1 });
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + rand() * 0.6;
    const dist = 1400 + rand() * 800;
    const r = 80 + rand() * 120;
    const ix = Math.cos(a) * dist;
    const iz = Math.sin(a) * dist;
    const beach = new THREE.Mesh(islandGeo, islandSandMat);
    beach.scale.set(r * 1.05, r * 0.12, r * 1.05);
    beach.position.set(ix, 0, iz);
    scene.add(beach);
    const grass = new THREE.Mesh(islandGeo, islandGrassMat);
    grass.scale.set(r * 0.8, r * 0.12, r * 0.8);
    grass.position.set(ix, 0, iz);
    scene.add(grass);
  }

  // ---- Clouds -------------------------------------------------------------
  const puffGeo = new THREE.SphereGeometry(1, 7, 5);
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 });
  const clouds: THREE.Group[] = [];
  for (let c = 0; c < 14; c++) {
    const g = new THREE.Group();
    g.position.set(-1500 + rand() * 3000, 160 + rand() * 100, -1500 + rand() * 3000);
    const n = 3 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k++) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.scale.setScalar(10 + rand() * 12);
      puff.position.set((rand() - 0.5) * 50, (rand() - 0.5) * 8, (rand() - 0.5) * 20);
      g.add(puff);
    }
    scene.add(g);
    clouds.push(g);
  }

  let frame = 0;
  return {
    update(dt: number): void {
      if (hiRes && hiRes.paint(HI_RES_BUDGET_MS)) {
        const old = terrainMat.map;
        terrainMat.map = lieTexture(hiRes.canvas, maxAniso);
        terrainMat.needsUpdate = true;
        old?.dispose();
        hiRes = null;
      }
      const t = state.time;

      // Swell: every third frame only.
      if (frame++ % 3 === 0) {
        for (let i = 0; i < seaCount; i++) {
          const x = seaBaseX[i];
          const z = seaBaseZ[i];
          const y = Math.hypot(x, z) > SWELL_FROM
            ? 0.25 * Math.sin(x / 40 + t * 0.8) + 0.2 * Math.cos(z / 55 + t * 0.6)
            : 0;
          seaPos.setY(i, y);
        }
        seaPos.needsUpdate = true;
      }

      // Flags flutter and point downwind.
      for (const f of flags) {
        const pos = f.geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const bx = f.bx[i];
          pos.setZ(i, f.bz[i] + Math.sin(t * 6 + bx * 4) * 0.08 * bx);
        }
        pos.needsUpdate = true;
        f.group.rotation.y = state.wind.yaw - Math.PI / 2;
      }

      // Clouds drift east and wrap.
      for (const c of clouds) {
        c.position.x += 3 * dt;
        if (c.position.x > 1600) c.position.x = -1600;
      }
    },
  };
}
