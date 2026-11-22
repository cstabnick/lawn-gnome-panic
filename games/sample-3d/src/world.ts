import type { DayNightState } from './config';
// src/world.ts
import * as THREE from 'three';
import { ARENA_HALF, COLORS, type World } from './config';
import { heightAt, normalAt } from './terrain';

const LAWN_SIZE = ARENA_HALF * 2;
const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const TILE_PX = 256;
const TILE_WORLD = 8; // one grass tile covers 8 world units
const STRIPE_WIDTH = 10;
const MOW_CAPACITY = 12000;
const MOW_CELL = 0.45;
const PICKET_SPACING = 2.2;
const PICKET_BODY_Y = 2.8; // 5.6 tall, base on the ground
const PICKET_TIP_Y = 6.0; // 0.8 tall cone sitting on top of the body
const RAIL_HEIGHTS = [1.4, 4.2];
const BRICK_Z = -ARENA_HALF - 0.6;
const SUN_DISTANCE = 85;
// Direction from the focus toward the sun (or moon at night). Starts as the old fixed offset.
const lightDirStore = new THREE.Vector3(40, 70, 25).normalize();

const hex = (c: number): string => '#' + c.toString(16).padStart(6, '0');
const clampByte = (v: number): number => Math.min(255, Math.round(v));
const shade = (c: number, f: number): string =>
  `rgb(${clampByte(((c >> 16) & 255) * f)},${clampByte(((c >> 8) & 255) * f)},${clampByte((c & 255) * f)})`;

function shadowed<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Displaces a PlaneGeometry (before it is rotated flat) to the terrain; `lift` is added on top. */
function displacePlane(geo: THREE.PlaneGeometry, lift: number): void {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    // Local (x, y) maps to world (x, -y) after the -PI/2 rotation about X.
    pos.setZ(i, heightAt(pos.getX(i), -pos.getY(i)) + lift);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

function make2d(w: number, h: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return ctx;
}

export function buildWorld(scene: THREE.Scene): World {
  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x446644, 1.2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d6, 2.8);
  sun.castShadow = true;
  const shadowSize = COARSE ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  const sc = sun.shadow.camera;
  sc.left = -35;
  sc.bottom = -35;
  sc.right = 35;
  sc.top = 35;
  sc.near = 1;
  sc.far = 160;
  sc.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03; // avoids shadow acne when the frustum is stretched for top-down
  let shadowRange = 35;
  scene.add(sun, sun.target);

  // Lawn base: a tiled grass texture with speckles.
  const grassCtx = make2d(TILE_PX, TILE_PX);
  grassCtx.fillStyle = hex(COLORS.grass);
  grassCtx.fillRect(0, 0, TILE_PX, TILE_PX);
  const dark = shade(COLORS.grass, 0.9);
  const light = shade(COLORS.grass, 1.1);
  for (let i = 0; i < 3000; i++) {
    grassCtx.fillStyle = Math.random() < 0.5 ? dark : light;
    grassCtx.fillRect(Math.floor(Math.random() * (TILE_PX - 2)), Math.floor(Math.random() * (TILE_PX - 2)), 2, 2);
  }
  const grassTex = new THREE.CanvasTexture(grassCtx.canvas);
  grassTex.wrapS = THREE.RepeatWrapping;
  grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(LAWN_SIZE / TILE_WORLD, LAWN_SIZE / TILE_WORLD);
  grassTex.colorSpace = THREE.SRGBColorSpace;
  grassTex.anisotropy = 8;

  // Sand (the ihategrass cheat): same tiling, warm beige with darker and lighter grains.
  const SAND = 0xd9c18c;
  const sandCtx = make2d(TILE_PX, TILE_PX);
  sandCtx.fillStyle = hex(SAND);
  sandCtx.fillRect(0, 0, TILE_PX, TILE_PX);
  for (let i = 0; i < 5000; i++) {
    sandCtx.fillStyle = shade(SAND, 0.85 + Math.random() * 0.3);
    sandCtx.fillRect(Math.floor(Math.random() * (TILE_PX - 2)), Math.floor(Math.random() * (TILE_PX - 2)), 1 + Math.round(Math.random()), 1);
  }
  const sandTex = new THREE.CanvasTexture(sandCtx.canvas);
  sandTex.wrapS = THREE.RepeatWrapping;
  sandTex.wrapT = THREE.RepeatWrapping;
  sandTex.repeat.copy(grassTex.repeat);
  sandTex.colorSpace = THREE.SRGBColorSpace;
  sandTex.anisotropy = 8;

  const lawnGeo = new THREE.PlaneGeometry(LAWN_SIZE, LAWN_SIZE, 200, 200);
  displacePlane(lawnGeo, 0);
  const lawnMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 });
  const lawn = new THREE.Mesh(lawnGeo, lawnMat);
  lawn.rotation.x = -Math.PI / 2;
  lawn.receiveShadow = true;
  scene.add(lawn);

  // Classic lawn stripes: 1x64 texture, one transparent band and one white band per repeat.
  // Each band is 10 world units, so one repeat is 20 units.
  const stripeCtx = make2d(1, 64);
  stripeCtx.fillStyle = 'rgba(255,255,255,0.05)';
  stripeCtx.fillRect(0, 32, 1, 32);
  const stripeTex = new THREE.CanvasTexture(stripeCtx.canvas);
  stripeTex.wrapS = THREE.RepeatWrapping;
  stripeTex.wrapT = THREE.RepeatWrapping;
  stripeTex.repeat.set(1, LAWN_SIZE / (STRIPE_WIDTH * 2));
  const stripeGeo = new THREE.PlaneGeometry(LAWN_SIZE, LAWN_SIZE, 200, 200);
  displacePlane(stripeGeo, 0.02); // 0.02 above the lawn surface, baked into the vertices
  const stripes = new THREE.Mesh(
    stripeGeo,
    new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 1, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
  );
  stripes.rotation.x = -Math.PI / 2;
  stripes.renderOrder = 1;
  stripes.receiveShadow = true; // overlays must darken in shadow like the lawn under them
  scene.add(stripes);

  // Mowed decals: a ring buffer of instanced circles, one per 0.8-unit grid cell.
  const mowGeo = new THREE.CircleGeometry(1, 12);
  mowGeo.rotateX(-Math.PI / 2);
  const mowMat = new THREE.MeshStandardMaterial({
    color: COLORS.grassMowed,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mowed = new THREE.InstancedMesh(mowGeo, mowMat, MOW_CAPACITY);
  mowed.receiveShadow = true;
  mowed.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // Each decal's own y (terrain height + 0.04) is written in markMowed; the mesh itself sits at 0.
  mowed.renderOrder = 2;
  mowed.frustumCulled = false; // the count changes at runtime; a cached bounding sphere would go stale
  mowed.count = 0;
  scene.add(mowed);

  const mowedCells = new Set<string>();
  const cellAt: (string | undefined)[] = new Array<string | undefined>(MOW_CAPACITY).fill(undefined);
  let nextSlot = 0;
  let written = 0;
  const tmpMatrix = new THREE.Matrix4();
  const tmpPos = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpScale = new THREE.Vector3(0.32, 0.32, 0.32);
  const yAxis = new THREE.Vector3(0, 1, 0);
  const tmpNormal = new THREE.Vector3();
  const tmpSpin = new THREE.Quaternion();

  const markMowed = (x: number, z: number): void => {
    const cx = Math.round(x / MOW_CELL);
    const cz = Math.round(z / MOW_CELL);
    const key = `${cx},${cz}`;
    if (mowedCells.has(key)) return;

    const slot = nextSlot;
    nextSlot = (nextSlot + 1) % MOW_CAPACITY;
    const old = cellAt[slot];
    if (old !== undefined) mowedCells.delete(old);
    cellAt[slot] = key;
    mowedCells.add(key);

    const wx = cx * MOW_CELL;
    const wz = cz * MOW_CELL;
    tmpPos.set(wx, heightAt(wx, wz) + 0.04, wz);
    // Lay the flat decal on the slope, then spin it randomly about its own normal (Y).
    tmpQuat.setFromUnitVectors(yAxis, normalAt(wx, wz, tmpNormal));
    tmpSpin.setFromAxisAngle(yAxis, (Math.random() - 0.5) * 0.6);
    tmpQuat.multiply(tmpSpin);
    tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
    mowed.setMatrixAt(slot, tmpMatrix);
    mowed.instanceMatrix.needsUpdate = true;
    written++;
    mowed.count = Math.min(written, MOW_CAPACITY);
  };

  // Fences: pickets on the west, east and south sides, plus two rails per side.
  const fenceMat = new THREE.MeshStandardMaterial({ color: COLORS.fence });
  const picketCount = Math.floor(LAWN_SIZE / PICKET_SPACING) + 1;
  const picketBodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 5.6, 0.25), fenceMat, picketCount * 3);
  const coneGeo = new THREE.ConeGeometry(0.78, 0.8, 4);
  coneGeo.rotateY(Math.PI / 4); // puts a flat face on the outward axis
  const picketTips = new THREE.InstancedMesh(coneGeo, fenceMat, picketCount * 3);
  const fenceSides = [
    { alongX: false, v: -ARENA_HALF - 0.5 }, // west
    { alongX: false, v: ARENA_HALF + 0.5 }, // east
    { alongX: true, v: ARENA_HALF + 0.5 }, // south
  ];
  // Rails are cut into one short piece per picket gap so each piece can sit on the ground.
  // The south side runs along X; the west and east sides run along Z.
  const gapCount = picketCount - 1;
  const railsX = shadowed(new THREE.InstancedMesh(new THREE.BoxGeometry(PICKET_SPACING, 0.35, 0.3), fenceMat, RAIL_HEIGHTS.length * gapCount));
  const railsZ = shadowed(new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.35, PICKET_SPACING), fenceMat, RAIL_HEIGHTS.length * 2 * gapCount));
  let railIndexX = 0;
  let railIndexZ = 0;
  let picketIndex = 0;
  for (const side of fenceSides) {
    const rotY = side.alongX ? 0 : Math.PI / 2;
    const groundY: number[] = [];
    for (let i = 0; i < picketCount; i++) {
      const t = -ARENA_HALF + i * PICKET_SPACING;
      const x = side.alongX ? t : side.v;
      const z = side.alongX ? side.v : t;
      const gy = heightAt(x, z);
      groundY.push(gy);
      tmpQuat.setFromAxisAngle(yAxis, rotY);
      tmpPos.set(x, gy + PICKET_BODY_Y, z);
      tmpMatrix.compose(tmpPos, tmpQuat, new THREE.Vector3(1, 1, 1));
      picketBodies.setMatrixAt(picketIndex, tmpMatrix);
      tmpPos.set(x, gy + PICKET_TIP_Y, z);
      tmpMatrix.compose(tmpPos, tmpQuat, new THREE.Vector3(1, 1, 1));
      picketTips.setMatrixAt(picketIndex, tmpMatrix);
      picketIndex++;
    }
    for (let i = 0; i < gapCount; i++) {
      const t = -ARENA_HALF + (i + 0.5) * PICKET_SPACING;
      const x = side.alongX ? t : side.v;
      const z = side.alongX ? side.v : t;
      const gapGround = (groundY[i] + groundY[i + 1]) / 2;
      for (const y of RAIL_HEIGHTS) {
        tmpQuat.identity();
        tmpPos.set(x, gapGround + y, z);
        tmpMatrix.compose(tmpPos, tmpQuat, new THREE.Vector3(1, 1, 1));
        if (side.alongX) railsX.setMatrixAt(railIndexX++, tmpMatrix);
        else railsZ.setMatrixAt(railIndexZ++, tmpMatrix);
      }
    }
  }
  picketBodies.instanceMatrix.needsUpdate = true;
  picketTips.instanceMatrix.needsUpdate = true;
  railsX.instanceMatrix.needsUpdate = true;
  railsZ.instanceMatrix.needsUpdate = true;
  shadowed(picketBodies);
  shadowed(picketTips);
  scene.add(picketBodies, picketTips, railsX, railsZ);

  // North edging: a row of bricks along the full width, every third one darker.
  const brickCount = Math.floor(LAWN_SIZE / PICKET_SPACING) + 1;
  const bricks = shadowed(
    new THREE.InstancedMesh(
      new THREE.BoxGeometry(2.2, 1.1, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
      brickCount,
    ),
  );
  const brickLight = new THREE.Color(0xa0522d);
  const brickDark = new THREE.Color(0x8b4513);
  for (let i = 0; i < brickCount; i++) {
    tmpQuat.identity();
    const bx = -ARENA_HALF + i * 2.2;
    tmpPos.set(bx, heightAt(bx, BRICK_Z) + 0.55, BRICK_Z);
    tmpMatrix.compose(tmpPos, tmpQuat, new THREE.Vector3(1, 1, 1));
    bricks.setMatrixAt(i, tmpMatrix);
    bricks.setColorAt(i, i % 3 === 0 ? brickDark : brickLight);
  }
  bricks.instanceMatrix.needsUpdate = true;
  if (bricks.instanceColor) bricks.instanceColor.needsUpdate = true;
  scene.add(bricks);

  // Ground beyond the lawn: four strips around it, NOT one big sheet under it. A sheet under the
  // lawn pokes up through every terrain dip below y = 0 and looks like a flat green pond.
  const outerMat = new THREE.MeshStandardMaterial({ color: 0x3f7f2b });
  const FAR = 3000;
  const H = ARENA_HALF;
  const strip = (w: number, d: number, x: number, z: number): void => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), outerMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, -0.02, z);
    m.receiveShadow = true;
    scene.add(m);
  };
  strip(2 * FAR, FAR - H, 0, (H + FAR) / 2);   // south
  strip(2 * FAR, FAR - H, 0, -(H + FAR) / 2);  // north
  strip(FAR - H, 2 * H, (H + FAR) / 2, 0);     // east
  strip(FAR - H, 2 * H, -(H + FAR) / 2, 0);    // west

  const update = (_dt: number, focus: THREE.Vector3): void => {
    sun.target.position.set(focus.x, 0, focus.z);
    sun.position.copy(focus).addScaledVector(lightDirStore, SUN_DISTANCE);
  };

  const setLighting = (s: DayNightState): void => {
    sun.color.copy(s.lightColor);
    sun.intensity = s.lightIntensity;
    hemi.color.copy(s.hemiSky);
    hemi.groundColor.copy(s.hemiGround);
    hemi.intensity = s.hemiIntensity;
    lightDirStore.copy(s.lightDir);
  };

  const reset = (): void => {
    mowedCells.clear();
    cellAt.fill(undefined);
    nextSlot = 0;
    written = 0;
    mowed.count = 0;
  };

  /** Half-size of the area around the player that gets shadows (wider in top-down). */
  const setShadowRange = (halfExtent: number): void => {
    if (halfExtent === shadowRange) return;
    shadowRange = halfExtent;
    sc.left = -halfExtent;
    sc.bottom = -halfExtent;
    sc.right = halfExtent;
    sc.top = halfExtent;
    sc.far = 160 + halfExtent;
    sc.updateProjectionMatrix();
  };

  const setSand = (on: boolean): void => {
    lawnMat.map = on ? sandTex : grassTex;
    lawnMat.needsUpdate = true;
    stripes.visible = !on;
    mowed.visible = !on;
    outerMat.color.setHex(on ? 0xc8ad74 : 0x3f7f2b);
  };

  return { markMowed, update, reset, setShadowRange, setLighting, setSand };
}
