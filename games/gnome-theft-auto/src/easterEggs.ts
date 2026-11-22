// Interactive Gnomiverse Easter eggs and map collectibles (Golden Acorns, Stopping-Stone Shards, HOA Foreclosure Signs).
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { GNOMA_TRUCK, VIEW } from './config';
import { aboveGround, heightAt } from './terrain';
import { placeOnGround } from './terrainMesh';
import type { Blip, Hud, Player, Vehicle, World } from './types';

export const COLLECTIBLES_KEY = 'gta-collectibles-v1';

export interface CollectibleSpot {
  id: string;
  x: number;
  z: number;
}

export interface CollectedSave {
  acorns: string[];
  shards: string[];
  signs: string[];
}

export interface EasterEggs {
  update(dt: number, player: Player, vehicles: Vehicle[]): void;
  counts(): { acorns: number; shards: number; signs: number };
  blips(): Blip[];
}

// Landmark coordinates from world.ts / biomes.ts / story.md §7.
const AETHER_RAMP = { x: 40, z: -540, radius: 8 } as const;
const BISCUITS_NAP = { x: 80, z: 380, radius: 24 } as const;
const TALL_HOUSE_PORCH = { x: -560, z: 40, radius: 22 } as const;
const CLAYFOOT_STATUE = { x: -30, z: 24.8, triggerX: -30, triggerZ: 30, radius: 6 } as const;
const OLD_COMBINE = { minX: 320, maxX: 520, z: -180, radius: 15 } as const;

const ACORN_REWARD = 100;
const BISCUIT_ACORN_REWARD = 200;
const SHARD_REWARD = 150;
const SIGN_REWARD = 50;

export const GOLDEN_ACORN_SPOTS: readonly CollectibleSpot[] = [
  // Turfton (city)
  { id: 'acorn-city-1', x: -30, z: 16 },
  { id: 'acorn-city-2', x: 18, z: 42 },
  { id: 'acorn-city-3', x: -150, z: 72 },
  { id: 'acorn-city-4', x: 90, z: 134 },
  { id: 'acorn-city-5', x: -190, z: 190 },
  // The Dust Flats (desert)
  { id: 'acorn-desert-1', x: 270, z: 20 },
  { id: 'acorn-desert-2', x: 374, z: 48 },
  { id: 'acorn-desert-3', x: 430, z: -80 },
  { id: 'acorn-desert-4', x: 520, z: 90 },
  { id: 'acorn-desert-5', x: 410, z: -180 },
  // Mossy Wood (forest)
  { id: 'acorn-forest-1', x: -255, z: -50 },
  { id: 'acorn-forest-2', x: -296, z: -22 },
  { id: 'acorn-forest-3', x: -360, z: 33 },
  { id: 'acorn-forest-4', x: -548, z: 40 },
  { id: 'acorn-forest-5', x: -578, z: -120 },
  // Frostbite Fells (tundra)
  { id: 'acorn-tundra-1', x: 0, z: -338 },
  { id: 'acorn-tundra-2', x: -47, z: -520 },
  { id: 'acorn-tundra-3', x: 40, z: -528 },
  { id: 'acorn-tundra-4', x: -180, z: -370 },
  { id: 'acorn-tundra-5', x: 180, z: -320 },
  // Cloverfield Farms (farmland) — first two lie inside Biscuit's Nap crater (80, 380) r=24
  { id: 'acorn-farm-1', x: 68, z: 376 },
  { id: 'acorn-farm-2', x: 92, z: 386 },
  { id: 'acorn-farm-3', x: -80, z: 332 },
  { id: 'acorn-farm-4', x: 55, z: 223 },
  { id: 'acorn-farm-5', x: 30, z: 520 },
];

export const STOPPING_SHARD_SPOTS: readonly CollectibleSpot[] = [
  { id: 'shard-1', x: -24, z: 34 },
  { id: 'shard-2', x: 165, z: -165 },
  { id: 'shard-3', x: -365, z: 48 },
  { id: 'shard-4', x: -546, z: 52 },
  { id: 'shard-5', x: -55, z: -525 },
  { id: 'shard-6', x: 120, z: -440 },
  { id: 'shard-7', x: 295, z: -140 },
  { id: 'shard-8', x: 540, z: 180 },
  { id: 'shard-9', x: -120, z: 440 },
  { id: 'shard-10', x: 110, z: 490 },
];

export const HOA_SIGN_SPOTS: readonly CollectibleSpot[] = [
  { id: 'sign-1', x: 7, z: 65 },
  { id: 'sign-2', x: -67, z: 15 },
  { id: 'sign-3', x: 67, z: -75 },
  { id: 'sign-4', x: -127, z: -45 },
  { id: 'sign-5', x: 127, z: 105 },
  { id: 'sign-6', x: -15, z: 187 },
  { id: 'sign-7', x: 15, z: -187 },
  { id: 'sign-8', x: 245, z: 7 },
  { id: 'sign-9', x: 320, z: 52 },
  { id: 'sign-10', x: -245, z: -13 },
  { id: 'sign-11', x: -395, z: 7 },
  { id: 'sign-12', x: 7, z: -265 },
  { id: 'sign-13', x: -35, z: -460 },
  { id: 'sign-14', x: -32, z: 315 },
  { id: 'sign-15', x: 54, z: 445 },
];

const emptySave = (): CollectedSave => ({ acorns: [], shards: [], signs: [] });

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === 'string' && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

function defaultReadStorage(): Pick<Storage, 'getItem'> | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

function defaultWriteStorage(): Pick<Storage, 'setItem'> | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function loadCollected(storage?: Pick<Storage, 'getItem'>): CollectedSave {
  const store = storage ?? defaultReadStorage();
  if (!store) return emptySave();
  try {
    const raw = store.getItem(COLLECTIBLES_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as Partial<CollectedSave> | null;
    if (!parsed || typeof parsed !== 'object') return emptySave();
    return {
      acorns: toStringArray(parsed.acorns),
      shards: toStringArray(parsed.shards),
      signs: toStringArray(parsed.signs),
    };
  } catch {
    return emptySave();
  }
}

export function saveCollected(save: CollectedSave, storage?: Pick<Storage, 'setItem'>): void {
  const store = storage ?? defaultWriteStorage();
  if (!store) return;
  try {
    store.setItem(COLLECTIBLES_KEY, JSON.stringify({
      acorns: toStringArray(save.acorns),
      shards: toStringArray(save.shards),
      signs: toStringArray(save.signs),
    }));
  } catch {
    /* storage may be full or disabled */
  }
}

function dist2d(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}

/** Build a spinning Golden Acorn pickup mesh. */
function buildGoldenAcornMesh(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd23f,
    emissive: 0x8a5a00,
    emissiveIntensity: 0.45,
    metalness: 0.55,
    roughness: 0.25,
  });
  if (getPrefab('acorn')) {
    const model = buildPrefab('acorn', { scale: 4.8, tint: 0xffd23f, lights: false, shadows: false });
    model.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.material = mat;
    });
    group.add(model);
  } else {
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mat);
    nut.scale.set(1, 1.25, 1);
    nut.position.y = 0.35;
    group.add(nut);
  }
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.58, 18).rotateX(-Math.PI / 2),
    flatLayer(new THREE.MeshBasicMaterial({ color: 0xffe478, side: THREE.DoubleSide }), LAYER.marker),
  );
  ring.position.y = 0.04;
  group.add(ring);
  return group;
}

/** Build a glowing Stopping-Stone Shard pickup mesh. */
function buildStoppingShardMesh(): THREE.Group {
  const group = new THREE.Group();
  if (getPrefab('stopping-stone')) {
    const model = buildPrefab('stopping-stone', { scale: 0.45, lights: false, shadows: false });
    // Lift slightly above ground so the 0.45-scale relic is readable and spins cleanly.
    model.position.y = 0.45;
    group.add(model);
  } else {
    const stone = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 0),
      new THREE.MeshStandardMaterial({ color: 0x62706b, emissive: 0x1a9e68, emissiveIntensity: 0.7 }),
    );
    stone.position.y = 0.55;
    group.add(stone);
  }
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.4, 0.56, 18).rotateX(-Math.PI / 2),
    flatLayer(new THREE.MeshBasicMaterial({ color: 0x38e89e, side: THREE.DoubleSide }), LAYER.marker),
  );
  halo.position.y = 0.04;
  group.add(halo);
  return group;
}

/** Build a smashable HOA Foreclosure Sign (post + red/cream placard). */
function buildHoaSignMesh(): THREE.Group {
  const group = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x5d432c, roughness: 0.9 });
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.8 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xc92a2a, roughness: 0.65 });

  const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.8, 0.14), postMat);
  post.position.y = 0.9;
  group.add(post);

  const board = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 0.06), boardMat);
  board.position.y = 1.65;
  group.add(board);

  // Every face stands at least 3 cm clear of its neighbour's (board 6 cm deep, post 14, trims 20; header top
  // 4.5 cm over the board's): a 1 cm step z-fights at range.
  const header = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.24, 0.2), redMat);
  header.position.y = 2.05;
  group.add(header);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.2), redMat);
  stripe.position.y = 1.5;
  stripe.rotation.z = -0.18;
  group.add(stripe);

  return group;
}

/** Build the weathered Gnorwin Clayfoot Statue wearing an orange traffic cone on its head. */
function buildClayfootStatue(): THREE.Group {
  const group = new THREE.Group();
  const weatheredMat = new THREE.MeshStandardMaterial({ color: 0x8d918b, roughness: 0.92 });
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x5c605b, roughness: 0.95 });
  const coneOrange = new THREE.MeshStandardMaterial({ color: 0xff6b1a, roughness: 0.55 });
  const coneStripe = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.45 });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.75, 1.7), plinthMat);
  plinth.position.y = 0.375;
  group.add(plinth);

  const graffiti = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.28, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x222624, roughness: 0.85 }),
  );
  graffiti.position.set(0, 0.4, 0.86);
  group.add(graffiti);

  if (getPrefab('gnome-statue')) {
    const statue = buildPrefab('gnome-statue', { scale: 2.6, tint: 0x8d918b, lights: false, shadows: true });
    statue.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.material = weatheredMat;
    });
    statue.position.y = 0.75;
    group.add(statue);
  } else {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.2, 8), weatheredMat);
    body.position.y = 1.35;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), weatheredMat);
    head.position.y = 2.15;
    group.add(head);
  }

  // Orange traffic cone perched crookedly on top of Gnorwin's hat.
  const coneGroup = new THREE.Group();
  coneGroup.position.set(0.06, 2.82, 0.04);
  coneGroup.rotation.set(0.14, 0.2, -0.18);
  const coneBase = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.56), coneOrange);
  coneGroup.add(coneBase);
  const coneBody = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.68, 10), coneOrange);
  coneBody.position.y = 0.37;
  coneGroup.add(coneBody);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.14, 10), coneStripe);
  collar.position.y = 0.36;
  coneGroup.add(collar);
  group.add(coneGroup);

  placeOnGround(group, CLAYFOOT_STATUE.x, CLAYFOOT_STATUE.z);
  return group;
}

/** Build the unmanned chrome-tinted Old Combine patrolling the eastern Dust Flats dunes. */
function buildOldCombine(): THREE.Group {
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd0d8e0,
    metalness: 0.85,
    roughness: 0.2,
  });
  if (getPrefab('combine-harvester')) {
    const model = buildPrefab('combine-harvester', { scale: 3, tint: 0xd0d8e0, lights: false, shadows: true });
    model.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const prev = obj.material as THREE.Material | undefined;
        if (prev && prev.transparent) return;
        obj.material = chromeMat;
      }
    });
    return model;
  }
  const fallback = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.6, 5.2), chromeMat);
  hull.position.y = 1.5;
  fallback.add(hull);
  return fallback;
}

export function createEasterEggs(
  scene: THREE.Scene,
  _world: World,
  hud: Hud,
  onAcornReward: (amount: number, reason?: string) => void,
): EasterEggs {
  const save = loadCollected();
  const acornsCollected = new Set<string>(save.acorns);
  const shardsCollected = new Set<string>(save.shards);
  const signsCollected = new Set<string>(save.signs);

  const persist = (): void => {
    saveCollected({
      acorns: [...acornsCollected],
      shards: [...shardsCollected],
      signs: [...signsCollected],
    });
  };

  // Spawn uncollected pickups.
  const acornMeshes = new Map<string, THREE.Group>();
  for (const spot of GOLDEN_ACORN_SPOTS) {
    if (acornsCollected.has(spot.id)) continue;
    const m = buildGoldenAcornMesh();
    placeOnGround(m, spot.x, spot.z);
    scene.add(m);
    acornMeshes.set(spot.id, m);
  }

  const shardMeshes = new Map<string, THREE.Group>();
  for (const spot of STOPPING_SHARD_SPOTS) {
    if (shardsCollected.has(spot.id)) continue;
    const m = buildStoppingShardMesh();
    placeOnGround(m, spot.x, spot.z);
    scene.add(m);
    shardMeshes.set(spot.id, m);
  }

  const signMeshes = new Map<string, THREE.Group>();
  for (const spot of HOA_SIGN_SPOTS) {
    if (signsCollected.has(spot.id)) continue;
    const m = buildHoaSignMesh();
    placeOnGround(m, spot.x, spot.z);
    m.rotation.y = (spot.x + spot.z) * 0.05;
    scene.add(m);
    signMeshes.set(spot.id, m);
  }

  // Spawn static & roaming Easter-egg landmarks.
  scene.add(buildClayfootStatue());
  const oldCombine = buildOldCombine();
  const combineCenterX = (OLD_COMBINE.minX + OLD_COMBINE.maxX) / 2;
  const combineHalfX = (OLD_COMBINE.maxX - OLD_COMBINE.minX) / 2;
  let combinePhase = 0;
  placeOnGround(oldCombine, combineCenterX + combineHalfX, OLD_COMBINE.z);
  scene.add(oldCombine);
  const combineReel = oldCombine.getObjectByName('reel') ?? null;

  // 7. Gnome Company Cursed Truffle in Mossy Wood (-330, -30)
  const truffle = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.45, 0),
    new THREE.MeshStandardMaterial({ color: 0x3b2416, emissive: 0x4a1d5e, emissiveIntensity: 0.45, roughness: 0.8 }),
  );
  placeOnGround(truffle, -330, -30, 0.5);
  scene.add(truffle);
  let truffleCollected = false;

  // 8. Faster Than Lawn charred crop-circle scorch mark in the Dust Flats (390, 140)
  const scorch = new THREE.Mesh(
    new THREE.CircleGeometry(7, 28).rotateX(-Math.PI / 2),
    flatLayer(new THREE.MeshStandardMaterial({ color: 0x1e1a16, roughness: 1 }), LAYER.area),
  );
  placeOnGround(scorch, 390, 140, 0.03, true);
  scene.add(scorch);
  let scorchCd = 0;

  // Cooldown timers (seconds remaining).
  let gnomaFootCd = 0;
  let gnomaBumpCd = 0;
  let rampCd = 0;
  let combineCd = 0;
  let porchCd = 0;
  let statueCd = 0;
  let animTime = 0;

  const flyingSigns: {
    mesh: THREE.Group;
    vx: number;
    vy: number;
    vz: number;
    spinX: number;
    spinY: number;
    spinZ: number;
    life: number;
  }[] = [];

  return {
    update(dt: number, player: Player, vehicles: Vehicle[]) {
      animTime += dt;

      for (let i = flyingSigns.length - 1; i >= 0; i--) {
        const f = flyingSigns[i];
        f.life -= dt;
        f.vy -= 20 * dt;
        f.mesh.position.x += f.vx * dt;
        f.mesh.position.y += f.vy * dt;
        f.mesh.position.z += f.vz * dt;
        f.mesh.rotation.x += f.spinX * dt;
        f.mesh.rotation.y += f.spinY * dt;
        f.mesh.rotation.z += f.spinZ * dt;
        const floorY = heightAt(f.mesh.position.x, f.mesh.position.z) + 0.22;
        if (f.mesh.position.y < floorY) {
          f.mesh.position.y = floorY;
          f.vy = Math.abs(f.vy) * 0.42;
          f.vx *= 0.78;
          f.vz *= 0.78;
          f.spinX *= 0.7;
          f.spinY *= 0.7;
          f.spinZ *= 0.7;
        }
        if (f.life <= 0) {
          scene.remove(f.mesh);
          flyingSigns.splice(i, 1);
        }
      }
      gnomaFootCd = Math.max(0, gnomaFootCd - dt);
      gnomaBumpCd = Math.max(0, gnomaBumpCd - dt);
      rampCd = Math.max(0, rampCd - dt);
      combineCd = Math.max(0, combineCd - dt);
      porchCd = Math.max(0, porchCd - dt);
      statueCd = Math.max(0, statueCd - dt);

      // Animate pickups.
      for (const m of acornMeshes.values()) {
        m.rotation.y = animTime * 2.2;
        if (m.children[0]) m.children[0].position.y = 0.25 + Math.sin(animTime * 3.2) * 0.12;
      }
      for (const m of shardMeshes.values()) {
        m.rotation.y = -animTime * 1.6;
        if (m.children[0]) m.children[0].position.y = 0.45 + Math.sin(animTime * 2.6) * 0.1;
      }

      // Roaming Old Combine loop across x: 320..520 around z: -180.
      combinePhase += dt * 0.08;
      const cx = combineCenterX + combineHalfX * Math.cos(combinePhase);
      const cz = OLD_COMBINE.z + 10 * Math.sin(combinePhase * 2);
      const vx = -combineHalfX * Math.sin(combinePhase);
      const vz = 20 * Math.cos(combinePhase * 2);
      placeOnGround(oldCombine, cx, cz);
      oldCombine.rotation.y = Math.atan2(vx, vz);
      if (combineReel) combineReel.rotation.x += dt * 2.5;

      const pv = player.vehicle ?? vehicles.find((v) => v.driver === 'player') ?? null;
      const px = pv ? pv.x : player.x;
      const py = pv ? pv.y : player.y;
      const pz = pv ? pv.z : player.z;

      // 1. Gnoma's Food Truck.
      if (!pv && gnomaFootCd <= 0 && dist2d(player.x, player.z, GNOMA_TRUCK.x, GNOMA_TRUCK.z) <= 5) {
        player.health = 1;
        hud.toast('Gnoma: "Acorn-Flour Cake! Clay restored!"');
        gnomaFootCd = 10;
      }
      if (pv && gnomaBumpCd <= 0 && Math.abs(pv.speed) > 3 && dist2d(pv.x, pv.z, GNOMA_TRUCK.x, GNOMA_TRUCK.z) <= 4.5) {
        hud.toast('Gnoma: "Oops, a little wobbly! We learn from it!"');
        gnomaBumpCd = 8;
      }

      // 2. Aether Board Ley-Line Ramp.
      if (pv && rampCd <= 0 && Math.abs(pv.speed) > 12 && dist2d(pv.x, pv.z, AETHER_RAMP.x, AETHER_RAMP.z) <= AETHER_RAMP.radius) {
        pv.vy = Math.max(pv.vy, 11);
        if (pv.sim) pv.sim.ctrl.body.vel.y = Math.max(pv.sim.ctrl.body.vel.y, 11);
        hud.toast('Aether Ley-Line! +Zero-G Trick!');
        rampCd = 4;
      }

      // 3. Old Combine approach.
      if (combineCd <= 0 && dist2d(px, pz, cx, cz) <= OLD_COMBINE.radius) {
        hud.toast('Old Combine: "...hum..."');
        combineCd = 30;
      }

      // 4. Tall House Porch fog & whisper.
      const nearPorch = dist2d(px, pz, TALL_HOUSE_PORCH.x, TALL_HOUSE_PORCH.z) <= TALL_HOUSE_PORCH.radius;
      if (scene.fog && 'far' in scene.fog) {
        const targetFar = nearPorch ? 180 : VIEW.fogFar;
        scene.fog.far += (targetFar - scene.fog.far) * Math.min(1, dt * 3.5);
      }
      if (nearPorch && porchCd <= 0) {
        hud.toast('"Don\'t look at the lantern."');
        porchCd = 30;
      }

      // 5. Gnorwin Clayfoot Statue.
      if (statueCd <= 0 && (
        dist2d(px, pz, CLAYFOOT_STATUE.triggerX, CLAYFOOT_STATUE.triggerZ) <= CLAYFOOT_STATUE.radius
        || dist2d(px, pz, CLAYFOOT_STATUE.x, CLAYFOOT_STATUE.z) <= CLAYFOOT_STATUE.radius
      )) {
        hud.toast('Gnorwin Clayfoot Statue — Graffiti: "EVEN CUT WAS HERE"');
        statueCd = 25;
      }

      // 5b. Cursed Truffle pickup (Gnome Company nod).
      if (!truffleCollected) {
        truffle.rotation.y = animTime * 1.8;
        if (dist2d(px, pz, -330, -30) <= 2.8) {
          truffleCollected = true;
          scene.remove(truffle);
          onAcornReward(200, 'Cursed Truffle');
          hud.toast('Cursed Truffle: "...the chapel smells of mulch..." (+200 Acorns)');
        }
      }

      // 5c. Faster Than Lawn charred crop-circle scorch mark.
      scorchCd = Math.max(0, scorchCd - dt);
      if (scorchCd <= 0 && dist2d(px, pz, 390, 140) <= 8) {
        scorchCd = 25;
        hud.toast('Tinfoil Gnome: "FTL mower crew dropped out of orbit right here!"');
      }

      // 6. Collectibles (only when near ground level so overhead flyers don't vacuum them).
      if (aboveGround(px, py, pz) <= 4) {
        let dirty = false;

        for (const spot of GOLDEN_ACORN_SPOTS) {
          if (acornsCollected.has(spot.id)) continue;
          if (dist2d(px, pz, spot.x, spot.z) > 2.5) continue;
          acornsCollected.add(spot.id);
          dirty = true;
          const mesh = acornMeshes.get(spot.id);
          if (mesh) {
            scene.remove(mesh);
            acornMeshes.delete(spot.id);
          }
          const inBiscuitNap = dist2d(spot.x, spot.z, BISCUITS_NAP.x, BISCUITS_NAP.z) <= BISCUITS_NAP.radius;
          const reward = inBiscuitNap ? BISCUIT_ACORN_REWARD : ACORN_REWARD;
          const label = inBiscuitNap ? "Biscuit's Nap Golden Acorn" : 'Golden Acorn';
          onAcornReward(reward, label);
          hud.toast(`${label}! +${reward} Acorns (${acornsCollected.size}/${GOLDEN_ACORN_SPOTS.length})`);
        }

        for (const spot of STOPPING_SHARD_SPOTS) {
          if (shardsCollected.has(spot.id)) continue;
          if (dist2d(px, pz, spot.x, spot.z) > 2.5) continue;
          shardsCollected.add(spot.id);
          dirty = true;
          const mesh = shardMeshes.get(spot.id);
          if (mesh) {
            scene.remove(mesh);
            shardMeshes.delete(spot.id);
          }
          onAcornReward(SHARD_REWARD, 'Stopping-Stone Shard');
          hud.toast(`Stopping-Stone Shard! +${SHARD_REWARD} Acorns (${shardsCollected.size}/${STOPPING_SHARD_SPOTS.length})`);
        }

        if (pv && Math.abs(pv.speed) > 4) {
          for (const spot of HOA_SIGN_SPOTS) {
            if (signsCollected.has(spot.id)) continue;
            if (dist2d(pv.x, pv.z, spot.x, spot.z) > 3.2) continue;
            signsCollected.add(spot.id);
            dirty = true;
            const mesh = signMeshes.get(spot.id);
            if (mesh) {
              signMeshes.delete(spot.id);
              const dx = spot.x - pv.x;
              const dz = spot.z - pv.z;
              const d = Math.hypot(dx, dz) || 1;
              const nx = dx / d;
              const nz = dz / d;
              const fwdX = Math.sin(pv.yaw) * pv.speed;
              const fwdZ = Math.cos(pv.yaw) * pv.speed;
              const spd = Math.abs(pv.speed);
              flyingSigns.push({
                mesh,
                vx: nx * Math.max(5, spd * 0.65) + fwdX * 0.55 + (Math.random() - 0.5) * 3,
                vy: 5.5 + Math.min(8, spd * 0.25),
                vz: nz * Math.max(5, spd * 0.65) + fwdZ * 0.55 + (Math.random() - 0.5) * 3,
                spinX: (Math.random() - 0.5) * 18,
                spinY: (Math.random() - 0.5) * 18,
                spinZ: (Math.random() - 0.5) * 18,
                life: 6.5,
              });
            }
            onAcornReward(SIGN_REWARD, 'HOA Foreclosure Sign');
            hud.toast(`HOA Foreclosure Sign smashed! +${SIGN_REWARD} Acorns (${signsCollected.size}/${HOA_SIGN_SPOTS.length})`);
          }
        }

        if (dirty) persist();
      }
    },

    counts() {
      return {
        acorns: acornsCollected.size,
        shards: shardsCollected.size,
        signs: signsCollected.size,
      };
    },

    blips(): Blip[] {
      const out: Blip[] = [];
      for (const spot of GOLDEN_ACORN_SPOTS) {
        if (!acornsCollected.has(spot.id)) out.push({ x: spot.x, z: spot.z, color: '#f7c927' });
      }
      for (const spot of STOPPING_SHARD_SPOTS) {
        if (!shardsCollected.has(spot.id)) out.push({ x: spot.x, z: spot.z, color: '#38e89e' });
      }
      for (const spot of HOA_SIGN_SPOTS) {
        if (!signsCollected.has(spot.id)) out.push({ x: spot.x, z: spot.z, color: '#ff6b4a' });
      }
      return out;
    },
  };
}
