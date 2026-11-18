import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { Noise2D, clamp, lerp, mulberry32, smoothstep } from './math';

export interface RockVolume {
  id: number;
  cx: number;
  cy: number;
  cz: number;
  hx: number; // half-extents
  hy: number;
  hz: number;
  kind: 'ledge' | 'plateau' | 'boulder' | 'summit';
}

export interface Checkpoint {
  index: number;
  x: number;
  y: number;
  z: number;
  radius: number;
}

export interface RaycastHit {
  hit: boolean;
  dist: number;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  isWalkable: boolean;
}

export interface SphereCollisionResult {
  grounded: boolean;
  groundNormal: THREE.Vector3;
  wallHit: boolean;
  wallNormal: THREE.Vector3;
}

const WALKABLE_NORMAL_Y = 0.68; // ~47 degrees

export class Mountain {
  readonly seed: number;
  readonly group = new THREE.Group();

  // Cliff grid dimensions
  readonly minX = -44;
  readonly maxX = 44;
  readonly minY = 0;
  readonly maxY = 146;
  readonly cols = 110; // 0.8m cell width
  readonly rows = 182; // 0.8m cell height
  readonly dx: number;
  readonly dy: number;

  // Z values at grid vertices: index = iy * (cols + 1) + ix
  private readonly zGrid: Float32Array;
  readonly volumes: RockVolume[] = [];
  readonly checkpoints: Checkpoint[] = [];
  readonly summitPos = new THREE.Vector3(0, 145, -72);

  // Reusable scratch vectors to avoid GC in physics loop
  private readonly _v0 = new THREE.Vector3();
  private readonly _v1 = new THREE.Vector3();
  private readonly _v2 = new THREE.Vector3();
  private readonly _closest = new THREE.Vector3();
  private readonly _diff = new THREE.Vector3();
  private readonly _normal = new THREE.Vector3();

  constructor(seed: number) {
    this.seed = seed;
    this.dx = (this.maxX - this.minX) / this.cols;
    this.dy = (this.maxY - this.minY) / this.rows;
    this.zGrid = new Float32Array((this.cols + 1) * (this.rows + 1));

    this.generateTerrain();
    this.buildVisuals();
  }

  private generateTerrain(): void {
    const noiseMacro = new Noise2D(this.seed);
    const noiseDetail = new Noise2D(this.seed + 101);
    const noiseStrata = new Noise2D(this.seed + 202);
    const rng = mulberry32(this.seed + 303);

    // 3 main route channels (left, center, right) that weave up the face
    const routePhase1 = rng() * Math.PI * 2;
    const routePhase2 = rng() * Math.PI * 2;

    for (let iy = 0; iy <= this.rows; iy++) {
      const y = this.minY + iy * this.dy;
      const baseBlend = smoothstep(0, 3.2, y);

      for (let ix = 0; ix <= this.cols; ix++) {
        const x = this.minX + ix * this.dx;

        // Average cliff slope receding into -Z
        let z = -y * 0.44;

        // Broad ridges & gullies
        const macro = noiseMacro.fbm(x * 0.045, y * 0.032, 3) * 8.5;
        // Medium rock crags
        const detail = noiseDetail.fbm(x * 0.14, y * 0.14, 3) * 2.4;
        // Horizontal rock strata / natural ledges every ~10m
        const strataWave = Math.sin(y * 0.58 + noiseStrata.sample(x * 0.08, y * 0.05) * 2.5);
        const strata = Math.tanh(strataWave * 2.2) * 1.15;

        // Carve 2 subtle climbable gullies/ridges so there are readable routes
        const gullyX = Math.sin(y * 0.045 + routePhase1) * 16;
        const distGully = Math.abs(x - gullyX);
        const gullyCarve = Math.exp(-(distGully * distGully) / 48) * 2.2;

        const ridgeX = Math.cos(y * 0.04 + routePhase2) * 20;
        const distRidge = Math.abs(x - ridgeX);
        const ridgeBulge = Math.exp(-(distRidge * distRidge) / 55) * 2.4;

        // Side walls flare forward slightly at edges to frame the mountain
        const edgeFrac = smoothstep(32, 44, Math.abs(x));
        const sideWall = edgeFrac * 6.5;

        z += (macro + detail + strata - gullyCarve + ridgeBulge + sideWall) * baseBlend;

        // Flatten smoothly at y = 0
        z *= baseBlend;

        this.zGrid[iy * (this.cols + 1) + ix] = z;
      }
    }

    // Base Camp checkpoint (index 0)
    this.checkpoints.push({ index: 0, x: 0, y: 0, z: 12, radius: 4.5 });

    // 3 Major Campfire Rest Plateaus up the cliff
    const plateauHeights = [36, 74, 112];
    for (let i = 0; i < plateauHeights.length; i++) {
      const py = plateauHeights[i];
      const px = clamp((rng() - 0.5) * 38, -22, 22);
      const surf = this.sampleGridZ(px, py);
      const pz = surf + 2.4;
      this.volumes.push({
        id: this.volumes.length,
        cx: px,
        cy: py - 0.6,
        cz: pz,
        hx: 4.2,
        hy: 0.7,
        hz: 3.6,
        kind: 'plateau',
      });
      this.checkpoints.push({
        index: i + 1,
        x: px,
        y: py + 0.1,
        z: pz + 0.4,
        radius: 4.2,
      });
    }

    // Procedural rock ledges & boulders up the cliff face
    const numLedges = 42;
    for (let i = 0; i < numLedges; i++) {
      const ly = lerp(5, 141, (i + rng() * 0.7) / numLedges);
      const lx = lerp(-34, 34, rng());
      const lz = this.sampleGridZ(lx, ly);

      const isBoulder = rng() < 0.35;
      const hx = isBoulder ? lerp(1.4, 2.8, rng()) : lerp(2.2, 4.6, rng());
      const hy = isBoulder ? lerp(1.2, 2.5, rng()) : lerp(0.45, 0.9, rng());
      const hz = isBoulder ? lerp(1.4, 2.6, rng()) : lerp(1.6, 3.0, rng());

      this.volumes.push({
        id: this.volumes.length,
        cx: lx,
        cy: ly,
        cz: lz + hz * 0.45,
        hx,
        hy,
        hz,
        kind: isBoulder ? 'boulder' : 'ledge',
      });
    }

    // Summit Plateau volume at y = 145
    const summitEdgeZ = this.sampleGridZ(0, 145);
    const summitCenterZ = summitEdgeZ - 14;
    this.summitPos.set(0, 145, summitEdgeZ - 8);
    this.volumes.push({
      id: this.volumes.length,
      cx: 0,
      cy: 144.2,
      cz: summitCenterZ,
      hx: 44,
      hy: 0.8,
      hz: 18,
      kind: 'summit',
    });
  }

  private sampleGridZ(x: number, y: number): number {
    const fx = clamp((x - this.minX) / this.dx, 0, this.cols - 0.0001);
    const fy = clamp((y - this.minY) / this.dy, 0, this.rows - 0.0001);
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    const stride = this.cols + 1;
    const z00 = this.zGrid[iy * stride + ix];
    const z10 = this.zGrid[iy * stride + ix + 1];
    const z01 = this.zGrid[(iy + 1) * stride + ix];
    const z11 = this.zGrid[(iy + 1) * stride + ix + 1];
    return lerp(lerp(z00, z10, tx), lerp(z01, z11, tx), ty);
  }

  private buildVisuals(): void {
    // 1. Base Camp ground
    const groundGeo = new THREE.PlaneGeometry(140, 80, 24, 16);
    groundGeo.rotateX(-Math.PI / 2);
    const gPos = groundGeo.attributes.position;
    const gColors = new Float32Array(gPos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < gPos.count; i++) {
      const gx = gPos.getX(i);
      const gz = gPos.getZ(i) + 34;
      gPos.setZ(i, gz);
      const dist = Math.hypot(gx, gz - 12);
      if (dist < 8) {
        c.set('#8f9b63');
      } else {
        c.set('#5e8c54').lerp(new THREE.Color('#4a7244'), clamp((dist - 8) / 35, 0, 1));
      }
      gColors[i * 3] = c.r;
      gColors[i * 3 + 1] = c.g;
      gColors[i * 3 + 2] = c.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(gColors, 3));
    groundGeo.computeVertexNormals();
    const groundMesh = new THREE.Mesh(
      groundGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, flatShading: true })
    );
    groundMesh.receiveShadow = true;
    this.group.add(groundMesh);

    // 2. Main Procedural Cliff Mesh (exact match to zGrid)
    const vertCount = (this.cols + 1) * (this.rows + 1);
    const positions = new Float32Array(vertCount * 3);
    const colors = new Float32Array(vertCount * 3);
    const indices: number[] = [];

    for (let iy = 0; iy <= this.rows; iy++) {
      const y = this.minY + iy * this.dy;
      for (let ix = 0; ix <= this.cols; ix++) {
        const x = this.minX + ix * this.dx;
        const idx = iy * (this.cols + 1) + ix;
        const z = this.zGrid[idx];
        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;

        // Estimate slope for coloring (moss/snow on flat spots, granite on sheer faces)
        const zUp = iy < this.rows ? this.zGrid[(iy + 1) * (this.cols + 1) + ix] : z;
        const dzdy = (zUp - z) / this.dy;
        const flatness = clamp(-dzdy * 0.5, 0, 1);

        if (y < 4) {
          c.set('#687d56').lerp(new THREE.Color('#7b7064'), y / 4);
        } else if (y > 116) {
          // Alpine rock & snow
          c.set('#6b7280').lerp(new THREE.Color('#eef4fa'), clamp((y - 116) / 22 + flatness * 0.45, 0, 0.92));
        } else {
          // Warm granite / sandstone with mossy ledges
          const heightT = y / 116;
          c.set('#8c7a6b').lerp(new THREE.Color('#6f6866'), heightT);
          if (flatness > 0.35) {
            c.lerp(new THREE.Color('#5f804e'), (flatness - 0.35) * 1.1);
          }
        }
        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;
      }
    }

    for (let iy = 0; iy < this.rows; iy++) {
      for (let ix = 0; ix < this.cols; ix++) {
        const a = iy * (this.cols + 1) + ix;
        const b = a + 1;
        const cIdx = a + (this.cols + 1);
        const d = cIdx + 1;
        // Two triangles per cell (CCW facing +Z)
        indices.push(a, b, d);
        indices.push(a, d, cIdx);
      }
    }

    const cliffGeo = new THREE.BufferGeometry();
    cliffGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    cliffGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    cliffGeo.setIndex(indices);
    cliffGeo.computeVertexNormals();

    const cliffMesh = new THREE.Mesh(
      cliffGeo,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        metalness: 0.04,
        flatShading: true,
      })
    );
    cliffMesh.castShadow = true;
    cliffMesh.receiveShadow = true;
    this.group.add(cliffMesh);

    // 3. Rock Volumes (Ledges, Plateaus, Boulders, Summit)
    const ledgeMat = new THREE.MeshStandardMaterial({ color: '#7d736b', roughness: 0.88, flatShading: true });
    const plateauMat = new THREE.MeshStandardMaterial({ color: '#6b7d5b', roughness: 0.9, flatShading: true });
    const boulderMat = new THREE.MeshStandardMaterial({ color: '#635d59', roughness: 0.92, flatShading: true });
    const summitMat = new THREE.MeshStandardMaterial({ color: '#e9f2f9', roughness: 0.85, flatShading: true });

    for (const v of this.volumes) {
      const geo = new THREE.BoxGeometry(v.hx * 2, v.hy * 2, v.hz * 2);
      const mat =
        v.kind === 'plateau'
          ? plateauMat
          : v.kind === 'boulder'
            ? boulderMat
            : v.kind === 'summit'
              ? summitMat
              : ledgeMat;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(v.cx, v.cy, v.cz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }

    // 4. Campfire Checkpoints
    for (const cp of this.checkpoints) {
      const fireGroup = new THREE.Group();
      fireGroup.position.set(cp.x, cp.y, cp.z);

      const fire = buildPrefab('campfire', { scale: 2.5, lights: false });
      fireGroup.add(fire);

      const light = new THREE.PointLight('#ff8a33', 6, 14);
      light.position.y = 1.0;
      fireGroup.add(light);

      this.group.add(fireGroup);
    }

    // 5. Summit Flag & Beacon
    const flagGroup = new THREE.Group();
    flagGroup.position.copy(this.summitPos);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 4.5, 8),
      new THREE.MeshStandardMaterial({ color: '#d8dee9', metalness: 0.6, roughness: 0.3 })
    );
    pole.position.y = 2.25;
    flagGroup.add(pole);

    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.0, 0.08),
      new THREE.MeshBasicMaterial({ color: '#ffd166' })
    );
    banner.position.set(0.9, 3.8, 0);
    flagGroup.add(banner);

    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 45, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.2, side: THREE.DoubleSide })
    );
    beacon.position.y = 22.5;
    flagGroup.add(beacon);

    this.group.add(flagGroup);

    // 6. Decorative Pine Trees at Base Camp (outside immediate spawn)
    const rng = mulberry32(this.seed + 999);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#5c4033', roughness: 0.95 });
    const leafMat = new THREE.MeshStandardMaterial({ color: '#2d5a36', roughness: 0.9, flatShading: true });
    for (let i = 0; i < 28; i++) {
      const tx = lerp(-42, 42, rng());
      const tz = lerp(18, 44, rng());
      if (Math.abs(tx) < 6 && tz < 24) continue;
      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);
      const scale = lerp(0.8, 1.5, rng());
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.32 * scale, 2.2 * scale, 6), trunkMat);
      trunk.position.y = 1.1 * scale;
      const crown = new THREE.Mesh(new THREE.ConeGeometry(1.6 * scale, 4.2 * scale, 7), leafMat);
      crown.position.y = 3.8 * scale;
      tree.add(trunk, crown);
      this.group.add(tree);
    }
  }

  private getGridVertex(ix: number, iy: number, out: THREE.Vector3): THREE.Vector3 {
    const cx = clamp(ix, 0, this.cols);
    const cy = clamp(iy, 0, this.rows);
    const z = this.zGrid[cy * (this.cols + 1) + cx];
    return out.set(this.minX + cx * this.dx, this.minY + cy * this.dy, z);
  }

  /**
   * Closest point on triangle (a, b, c) to point p.
   */
  private closestPointOnTriangle(
    p: THREE.Vector3,
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    out: THREE.Vector3
  ): void {
    const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
    const acx = c.x - a.x, acy = c.y - a.y, acz = c.z - a.z;
    const apx = p.x - a.x, apy = p.y - a.y, apz = p.z - a.z;

    const d1 = abx * apx + aby * apy + abz * apz;
    const d2 = acx * apx + acy * apy + acz * apz;
    if (d1 <= 0 && d2 <= 0) {
      out.copy(a);
      return;
    }

    const bpx = p.x - b.x, bpy = p.y - b.y, bpz = p.z - b.z;
    const d3 = abx * bpx + aby * bpy + abz * bpz;
    const d4 = acx * bpx + acy * bpy + acz * bpz;
    if (d3 >= 0 && d4 <= d3) {
      out.copy(b);
      return;
    }

    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const v = d1 / (d1 - d3);
      out.set(a.x + v * abx, a.y + v * aby, a.z + v * abz);
      return;
    }

    const cpx = p.x - c.x, cpy = p.y - c.y, cpz = p.z - c.z;
    const d5 = abx * cpx + aby * cpy + abz * cpz;
    const d6 = acx * cpx + acy * cpy + acz * cpz;
    if (d6 >= 0 && d5 <= d6) {
      out.copy(c);
      return;
    }

    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const w = d2 / (d2 - d6);
      out.set(a.x + w * acx, a.y + w * acy, a.z + w * acz);
      return;
    }

    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const w = (d4 - d3) / (d4 - d3 + (d5 - d6));
      out.set(b.x + w * (c.x - b.x), b.y + w * (c.y - b.y), b.z + w * (c.z - b.z));
      return;
    }

    const denom = 1 / (va + vb + vc);
    const v = vb * denom;
    const w = vc * denom;
    out.set(a.x + abx * v + acx * w, a.y + aby * v + acy * w, a.z + abz * v + acz * w);
  }

  /**
   * Resolves a sphere (player collider) against Base Ground, Cliff Mesh triangles, and RockVolumes.
   */
  collideSphere(pos: THREE.Vector3, radius: number): SphereCollisionResult {
    let grounded = false;
    const groundNormal = new THREE.Vector3(0, 1, 0);
    let wallHit = false;
    const wallNormal = new THREE.Vector3(0, 0, 1);

    // 1. Base Camp flat ground (y = 0)
    if (pos.y < radius) {
      pos.y = radius;
      grounded = true;
      groundNormal.set(0, 1, 0);
    }

    // Keep within world X/Z bounds
    pos.x = clamp(pos.x, this.minX + 1, this.maxX - 1);
    pos.z = clamp(pos.z, -95, 42);

    // 2. Cliff Mesh Triangles in local 3x3 cell neighborhood
    const cx = Math.floor((pos.x - this.minX) / this.dx);
    const cy = Math.floor((pos.y - this.minY) / this.dy);
    const ixMin = clamp(cx - 2, 0, this.cols - 1);
    const ixMax = clamp(cx + 2, 0, this.cols - 1);
    const iyMin = clamp(cy - 2, 0, this.rows - 1);
    const iyMax = clamp(cy + 2, 0, this.rows - 1);

    const a = this._v0;
    const b = this._v1;
    const c = this._v2;
    const d = new THREE.Vector3();

    for (let iy = iyMin; iy <= iyMax; iy++) {
      for (let ix = ixMin; ix <= ixMax; ix++) {
        this.getGridVertex(ix, iy, a);
        this.getGridVertex(ix + 1, iy, b);
        this.getGridVertex(ix, iy + 1, c);
        this.getGridVertex(ix + 1, iy + 1, d);

        // Check both triangles: (a, b, d) and (a, d, c)
        for (let t = 0; t < 2; t++) {
          const p0 = a;
          const p1 = t === 0 ? b : d;
          const p2 = t === 0 ? d : c;

          this.closestPointOnTriangle(pos, p0, p1, p2, this._closest);
          this._diff.subVectors(pos, this._closest);
          const distSq = this._diff.lengthSq();

          if (distSq < radius * radius && distSq > 1e-10) {
            const dist = Math.sqrt(distSq);
            this._normal.copy(this._diff).divideScalar(dist);

            // Ensure normal faces +Z side of the cliff (prevent popping behind cliff)
            if (this._normal.z < -0.25 && pos.z > this._closest.z - 0.5) {
              continue;
            }

            const push = radius - dist;
            pos.addScaledVector(this._normal, push);

            if (this._normal.y >= WALKABLE_NORMAL_Y) {
              grounded = true;
              groundNormal.copy(this._normal);
            } else {
              wallHit = true;
              wallNormal.copy(this._normal);
            }
          }
        }
      }
    }

    // 3. Explicit RockVolumes (AABB sphere resolution)
    for (const v of this.volumes) {
      const minX = v.cx - v.hx, maxX = v.cx + v.hx;
      const minY = v.cy - v.hy, maxY = v.cy + v.hy;
      const minZ = v.cz - v.hz, maxZ = v.cz + v.hz;

      const qx = clamp(pos.x, minX, maxX);
      const qy = clamp(pos.y, minY, maxY);
      const qz = clamp(pos.z, minZ, maxZ);

      const dx = pos.x - qx;
      const dy = pos.y - qy;
      const dz = pos.z - qz;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < radius * radius) {
        if (distSq > 1e-8) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;
          const push = radius - dist;
          pos.x += nx * push;
          pos.y += ny * push;
          pos.z += nz * push;

          if (ny >= WALKABLE_NORMAL_Y) {
            grounded = true;
            groundNormal.set(nx, ny, nz);
          } else {
            wallHit = true;
            wallNormal.set(nx, ny, nz);
          }
        } else {
          // Center inside AABB: push out along shallowest axis
          const penTop = maxY - pos.y;
          const penFront = maxZ - pos.z;
          if (penTop <= penFront) {
            pos.y = maxY + radius;
            grounded = true;
            groundNormal.set(0, 1, 0);
          } else {
            pos.z = maxZ + radius;
            wallHit = true;
            wallNormal.set(0, 0, 1);
          }
        }
      }
    }

    return { grounded, groundNormal, wallHit, wallNormal };
  }

  /**
   * Exact raycast against Base Ground, Cliff Mesh, and RockVolumes.
   */
  raycast(origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number): RaycastHit {
    let bestDist = maxDist;
    const bestPoint = new THREE.Vector3();
    const bestNormal = new THREE.Vector3();
    let hit = false;

    // 1. Base ground plane y = 0
    if (dir.y < -1e-5 && origin.y > 0) {
      const t = -origin.y / dir.y;
      if (t > 0 && t < bestDist) {
        bestDist = t;
        bestPoint.copy(origin).addScaledVector(dir, t);
        bestNormal.set(0, 1, 0);
        hit = true;
      }
    }

    // 2. RockVolumes (slab AABB intersection)
    for (const v of this.volumes) {
      const minX = v.cx - v.hx, maxX = v.cx + v.hx;
      const minY = v.cy - v.hy, maxY = v.cy + v.hy;
      const minZ = v.cz - v.hz, maxZ = v.cz + v.hz;

      let tMin = 0;
      let tMax = bestDist;
      let hitAxis = -1;
      let hitSign = 1;

      const axes = [
        [origin.x, dir.x, minX, maxX],
        [origin.y, dir.y, minY, maxY],
        [origin.z, dir.z, minZ, maxZ],
      ];

      let miss = false;
      for (let i = 0; i < 3; i++) {
        const [o, d, bMin, bMax] = axes[i];
        if (Math.abs(d) < 1e-8) {
          if (o < bMin || o > bMax) {
            miss = true;
            break;
          }
        } else {
          let t1 = (bMin - o) / d;
          let t2 = (bMax - o) / d;
          let sign = -1;
          if (t1 > t2) {
            const tmp = t1;
            t1 = t2;
            t2 = tmp;
            sign = 1;
          }
          if (t1 > tMin) {
            tMin = t1;
            hitAxis = i;
            hitSign = sign;
          }
          if (t2 < tMax) tMax = t2;
          if (tMin > tMax) {
            miss = true;
            break;
          }
        }
      }

      if (!miss && hitAxis !== -1 && tMin > 0 && tMin < bestDist) {
        bestDist = tMin;
        bestPoint.copy(origin).addScaledVector(dir, tMin);
        bestNormal.set(
          hitAxis === 0 ? hitSign : 0,
          hitAxis === 1 ? hitSign : 0,
          hitAxis === 2 ? hitSign : 0
        );
        hit = true;
      }
    }

    // 3. Cliff Mesh triangles along ray bounding box
    const endX = origin.x + dir.x * bestDist;
    const endY = origin.y + dir.y * bestDist;
    const ixMin = clamp(Math.floor((Math.min(origin.x, endX) - this.minX) / this.dx) - 1, 0, this.cols - 1);
    const ixMax = clamp(Math.ceil((Math.max(origin.x, endX) - this.minX) / this.dx) + 1, 0, this.cols - 1);
    const iyMin = clamp(Math.floor((Math.min(origin.y, endY) - this.minY) / this.dy) - 1, 0, this.rows - 1);
    const iyMax = clamp(Math.ceil((Math.max(origin.y, endY) - this.minY) / this.dy) + 1, 0, this.rows - 1);

    const a = this._v0;
    const b = this._v1;
    const c = this._v2;
    const d = new THREE.Vector3();
    const e1 = new THREE.Vector3();
    const e2 = new THREE.Vector3();
    const h = new THREE.Vector3();
    const s = new THREE.Vector3();
    const q = new THREE.Vector3();

    for (let iy = iyMin; iy <= iyMax; iy++) {
      for (let ix = ixMin; ix <= ixMax; ix++) {
        this.getGridVertex(ix, iy, a);
        this.getGridVertex(ix + 1, iy, b);
        this.getGridVertex(ix, iy + 1, c);
        this.getGridVertex(ix + 1, iy + 1, d);

        for (let t = 0; t < 2; t++) {
          const p0 = a;
          const p1 = t === 0 ? b : d;
          const p2 = t === 0 ? d : c;

          e1.subVectors(p1, p0);
          e2.subVectors(p2, p0);
          h.crossVectors(dir, e2);
          const det = e1.dot(h);
          if (Math.abs(det) < 1e-7) continue;

          const invDet = 1 / det;
          s.subVectors(origin, p0);
          const u = invDet * s.dot(h);
          if (u < 0 || u > 1) continue;

          q.crossVectors(s, e1);
          const v = invDet * dir.dot(q);
          if (v < 0 || u + v > 1) continue;

          const dist = invDet * e2.dot(q);
          if (dist > 0.01 && dist < bestDist) {
            bestDist = dist;
            bestPoint.copy(origin).addScaledVector(dir, dist);
            bestNormal.crossVectors(e1, e2).normalize();
            if (bestNormal.z < 0) bestNormal.negate();
            hit = true;
          }
        }
      }
    }

    return {
      hit,
      dist: bestDist,
      point: bestPoint,
      normal: bestNormal,
      isWalkable: hit && bestNormal.y >= WALKABLE_NORMAL_Y,
    };
  }
}
