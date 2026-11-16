// Renders the grass raft from state.tiles: one group per tile, grass that grows taller,
// a small burst of green bits when a tile is cut, mowing stripes on fresh cuts, daisies on
// fully grown tiles, and white foam where raft edges meet the water. Read-only on state.
import * as THREE from 'three';
import { COLORS, RAFT_TOP, TILE_SIZE, type Ctx, type System, type Tile } from './config';
import { tileKey } from './rules';

const BLADES_PER_TILE = 28;
const BLADE_REBUILD_EPS = 0.02;
const CUT_DROP = 0.2;
const CUT_PARTICLES = 10;
const PARTICLE_LIFE = 0.6;
const GRAVITY = 9;
const PARTICLE_SIZE = 0.08;
const DAISIES_PER_TILE = 3;
const DAISY_STEM = 0.25;
const STRIPE_LIFT = 0.005;
const FOAM_Y = 0.03;
const FOAM_OUT = 0.06;

/** Tile sides as [di, dj] offsets to the neighbour across that side. */
const NEIGHBOURS: readonly [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

interface BladeDef { x: number; z: number; q: THREE.Quaternion }

interface TileView {
  i: number;
  j: number;
  group: THREE.Group;
  turfMat: THREE.MeshStandardMaterial;
  blades: THREE.InstancedMesh;
  bladeDefs: BladeDef[];
  builtGrowth: number;
  lastGrowth: number;
  stripe: THREE.Mesh;
  stripeMat: THREE.MeshStandardMaterial;
  daisies: THREE.Group[];
  foam: THREE.Mesh[];
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

/** Tiny seeded LCG so a tile's blades land in the same places every time. */
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/** 64 x 64 canvas with 4 alternating horizontal bands of light and dark green. */
function makeStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const g2d = canvas.getContext('2d');
  if (g2d) {
    for (let band = 0; band < 4; band++) {
      g2d.fillStyle = band % 2 === 0 ? '#8bd06a' : '#4f9a3a';
      g2d.fillRect(0, band * 16, 64, 16);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRaft(ctx: Ctx): System {
  const scene = ctx.scene;
  const tiles = ctx.state.tiles;

  // Shared geometry and materials, created once.
  const dirtGeo = new THREE.BoxGeometry(TILE_SIZE, 0.7, TILE_SIZE);
  const turfGeo = new THREE.BoxGeometry(TILE_SIZE * 0.98, 0.06, TILE_SIZE * 0.98);
  const bladeGeo = new THREE.ConeGeometry(0.06, 1, 4);
  bladeGeo.translate(0, 0.5, 0);
  const particleGeo = new THREE.BoxGeometry(PARTICLE_SIZE, PARTICLE_SIZE, PARTICLE_SIZE);
  const dirtMat = new THREE.MeshStandardMaterial({ color: COLORS.dirt });
  const bladeMat = new THREE.MeshStandardMaterial({ color: COLORS.grass });
  const particleMat = new THREE.MeshStandardMaterial({ color: COLORS.grass });

  // Mowing stripes: one flat plane per tile, lying just above the turf.
  const stripeTex = makeStripeTexture();
  const stripeGeo = new THREE.PlaneGeometry(TILE_SIZE * 0.98, TILE_SIZE * 0.98);
  stripeGeo.rotateX(-Math.PI / 2);

  // Edge foam: one strip shape for east/west edges, one for north/south edges.
  const foamGeoX = new THREE.BoxGeometry(0.12, 0.04, TILE_SIZE);
  const foamGeoZ = new THREE.BoxGeometry(TILE_SIZE, 0.04, 0.12);
  const foamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });

  // Daisy: a prototype group cloned for each flower (clones share geometry and materials).
  const daisyStemGeo = new THREE.CylinderGeometry(0.01, 0.01, DAISY_STEM, 5);
  daisyStemGeo.translate(0, DAISY_STEM / 2, 0);
  const petalGeo = new THREE.SphereGeometry(0.07, 8, 6);
  petalGeo.scale(1, 0.3, 1);
  petalGeo.translate(0, DAISY_STEM, 0);
  const centreGeo = new THREE.SphereGeometry(0.03, 6, 4);
  centreGeo.translate(0, DAISY_STEM + 0.01, 0);
  const daisyStemMat = new THREE.MeshStandardMaterial({ color: COLORS.grass });
  const daisyPetalMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const daisyCentreMat = new THREE.MeshStandardMaterial({ color: 0xf7d23a });
  const daisyProto = new THREE.Group();
  const daisyStem = new THREE.Mesh(daisyStemGeo, daisyStemMat);
  const daisyPetals = new THREE.Mesh(petalGeo, daisyPetalMat);
  const daisyCentre = new THREE.Mesh(centreGeo, daisyCentreMat);
  daisyStem.castShadow = true;
  daisyPetals.castShadow = true;
  daisyProto.add(daisyStem, daisyPetals, daisyCentre);

  const tallColor = new THREE.Color(COLORS.grassTall);
  const UP = new THREE.Vector3(0, 1, 0);
  const tmpPos = new THREE.Vector3();
  const tmpScale = new THREE.Vector3();
  const tmpMatrix = new THREE.Matrix4();

  const views = new Map<string, TileView>();
  const particles: Particle[] = [];
  let time = 0;

  function createTileView(tile: Tile): TileView {
    const group = new THREE.Group();
    group.position.set(tile.i * TILE_SIZE, 0, tile.j * TILE_SIZE);

    const dirt = new THREE.Mesh(dirtGeo, dirtMat);
    dirt.position.y = RAFT_TOP - 0.38;
    dirt.castShadow = true;

    const turfMat = new THREE.MeshStandardMaterial({ color: COLORS.grass });
    const turf = new THREE.Mesh(turfGeo, turfMat);
    turf.position.y = RAFT_TOP - 0.03;
    turf.castShadow = true;

    const rnd = seededRandom((tile.i * 73856093) ^ (tile.j * 19349663));
    const bladeDefs: BladeDef[] = [];
    for (let k = 0; k < BLADES_PER_TILE; k++) {
      const x = (rnd() - 0.5) * TILE_SIZE * 0.9;
      const z = (rnd() - 0.5) * TILE_SIZE * 0.9;
      const q = new THREE.Quaternion().setFromAxisAngle(UP, rnd() * Math.PI * 2);
      bladeDefs.push({ x, z, q });
    }
    const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, BLADES_PER_TILE);
    blades.castShadow = true;
    blades.frustumCulled = false;

    // Stripes: alternate direction on checkerboard tiles, like a real lawn.
    const stripeMat = new THREE.MeshStandardMaterial({ map: stripeTex, transparent: true });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = RAFT_TOP + STRIPE_LIFT;
    stripe.rotation.y = Math.abs(tile.i + tile.j) % 2 === 1 ? Math.PI / 2 : 0;

    // Daisies: seeded spots, continuing the same LCG after the blade draws.
    const daisies: THREE.Group[] = [];
    for (let k = 0; k < DAISIES_PER_TILE; k++) {
      const daisy = daisyProto.clone();
      daisy.position.set((rnd() - 0.5) * TILE_SIZE * 0.8, RAFT_TOP, (rnd() - 0.5) * TILE_SIZE * 0.8);
      daisy.scale.setScalar(0);
      daisy.visible = false;
      group.add(daisy);
      daisies.push(daisy);
    }

    group.add(dirt, turf, blades, stripe);
    scene.add(group);

    return {
      i: tile.i,
      j: tile.j,
      group,
      turfMat,
      blades,
      bladeDefs,
      builtGrowth: -Infinity,
      lastGrowth: tile.growth,
      stripe,
      stripeMat,
      daisies,
      foam: [],
    };
  }

  function rebuildBlades(view: TileView, growth: number): void {
    const h = 0.08 + growth * 0.55;
    tmpScale.set(1, h, 1);
    view.bladeDefs.forEach((b, k) => {
      tmpPos.set(b.x, RAFT_TOP, b.z);
      tmpMatrix.compose(tmpPos, b.q, tmpScale);
      view.blades.setMatrixAt(k, tmpMatrix);
    });
    view.blades.instanceMatrix.needsUpdate = true;
    view.builtGrowth = growth;
  }

  /** Foam strips on every side of this tile that has no neighbour tile. */
  function rebuildFoam(view: TileView): void {
    for (const m of view.foam) view.group.remove(m);
    view.foam = [];
    for (const [di, dj] of NEIGHBOURS) {
      if (tiles.has(tileKey(view.i + di, view.j + dj))) continue;
      const alongX = di !== 0; // east/west edge: the strip runs along z
      const mesh = new THREE.Mesh(alongX ? foamGeoX : foamGeoZ, foamMat);
      const off = TILE_SIZE / 2 + FOAM_OUT;
      mesh.position.set(di * off, FOAM_Y, dj * off);
      view.group.add(mesh);
      view.foam.push(mesh);
    }
  }

  /** Per-frame decoration: stripes fade as grass regrows, daisies bloom, blades sway. */
  function updateDecor(view: TileView, growth: number): void {
    const stripeOpacity = clamp((0.5 - growth) * 2.5, 0, 0.85);
    view.stripeMat.opacity = stripeOpacity;
    view.stripe.visible = stripeOpacity > 0;

    const daisyScale = clamp((growth - 0.9) / 0.1, 0, 1);
    for (const d of view.daisies) {
      d.scale.setScalar(daisyScale);
      d.visible = daisyScale > 0;
    }

    view.blades.rotation.z = Math.sin(time * 1.3 + view.i * 0.7 + view.j * 0.4) * 0.03;
    view.blades.rotation.x = Math.sin(time * 1.1 + view.i * 0.5 + view.j * 0.9 + 1.7) * 0.03;
  }

  function removeTileView(key: string, view: TileView): void {
    scene.remove(view.group);
    view.turfMat.dispose();
    view.stripeMat.dispose();
    view.blades.dispose();
    views.delete(key);
  }

  function spawnCut(i: number, j: number): void {
    for (let k = 0; k < CUT_PARTICLES; k++) {
      const mesh = new THREE.Mesh(particleGeo, particleMat);
      mesh.position.set(
        i * TILE_SIZE + (Math.random() - 0.5) * TILE_SIZE * 0.8,
        RAFT_TOP,
        j * TILE_SIZE + (Math.random() - 0.5) * TILE_SIZE * 0.8,
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        2 + Math.random() * 2.5,
        (Math.random() - 0.5) * 3,
      );
      scene.add(mesh);
      particles.push({ mesh, vel, life: 0 });
    }
  }

  function updateParticles(dt: number): void {
    for (let n = particles.length - 1; n >= 0; n--) {
      const p = particles[n];
      if (!p) continue;
      p.life += dt;
      if (p.life >= PARTICLE_LIFE) {
        scene.remove(p.mesh);
        particles.splice(n, 1);
        continue;
      }
      p.vel.y -= GRAVITY * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.scale.setScalar(Math.max(0, 1 - p.life / PARTICLE_LIFE));
    }
  }

  return {
    update(dt: number) {
      time += dt;
      let tilesChanged = false;

      // Remove groups whose tile is gone.
      for (const [key, view] of views) {
        if (!tiles.has(key)) {
          removeTileView(key, view);
          tilesChanged = true;
        }
      }

      // Create groups for new tiles, and sync growth.
      for (const [key, tile] of tiles) {
        let view = views.get(key);
        if (!view) {
          view = createTileView(tile);
          views.set(key, view);
          tilesChanged = true;
        }

        const growth = tile.growth;
        if (view.lastGrowth - growth > CUT_DROP) spawnCut(tile.i, tile.j);
        view.lastGrowth = growth;

        view.turfMat.color.setHex(COLORS.grass).lerp(tallColor, growth);
        if (Math.abs(growth - view.builtGrowth) > BLADE_REBUILD_EPS) rebuildBlades(view, growth);
        updateDecor(view, growth);
      }

      // Neighbours may have appeared or vanished: rebuild every tile's edge foam.
      if (tilesChanged) {
        for (const view of views.values()) rebuildFoam(view);
      }

      // Shared foam pulses between 0.45 and 0.8 opacity.
      foamMat.opacity = 0.625 + 0.175 * Math.sin(time * 2.5);

      updateParticles(dt);
    },
  };
}
