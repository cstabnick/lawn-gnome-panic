// Permanent 24/7 "Vibe / Background Characters" across Turfton and the four biomes,
// plus the Red Cap vs. Blue Cap picnic-table standoff.
import * as THREE from 'three';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import { BODEGA, CULVERT_PORTALS, GNOMECINO, GREENHOUSE_STRIP, PATIO_HEIGHTS } from './config';
import { gnomeState, makeGnome } from './gnomes';
import { heightAt } from './terrain';
import { animStride, newAnimClock, stepAnimClock, type AnimClock } from './animStride';
import type { Blip, Hud, Vehicle, World } from './types';
import { clearProp } from './propSpots';

const TALK_RADIUS = 7;
const TALK_COOLDOWN = 25;
const BLIP_COLOR = '#a8e6cf';

export interface VibeWorld {
  update(dt: number, playerX: number, playerZ: number, playerVehicle: Vehicle | null): string | null;
  blips(): Blip[];
}

interface VibeEntry {
  x: number;
  y: number;
  z: number;
  yaw: number;
  sitting: boolean;
  phase: number;
  cooldown: number;
  model: GnomeModel;
  line: (playerVehicle: Vehicle | null) => string;
  /** Pose level of detail (animStride.ts). */
  clock: AnimClock;
}

interface StandoffGnome {
  x: number;
  z: number;
  yaw: number;
  phase: number;
  throwTimer: number;
  model: GnomeModel;
  /** Pose level of detail (animStride.ts). */
  clock: AnimClock;
}

interface AcornLob {
  mesh: THREE.Group;
  fromRed: boolean;
  pairIndex: number;
  timer: number;
  period: number;
  flight: number;
  fired: boolean;
}

function makeLook(overrides: Partial<GnomeLook>): GnomeLook {
  return {
    hat: 0xd93636,
    shirt: 0x2f8a4a,
    pants: 0x4b3a2a,
    skin: 0xf1c27d,
    boots: 0x222222,
    beard: 0xdddddd,
    hair: null,
    freckles: false,
    dress: false,
    glasses: false,
    bowlCut: null,
    ...overrides,
  };
}

function buildCrateWithAsphalt(scene: THREE.Scene, x: number, z: number): { tail: THREE.Object3D; head: THREE.Object3D } {
  const g = new THREE.Group();
  g.position.set(x, heightAt(x, z), z);

  const crateMat = new THREE.MeshStandardMaterial({ color: 0x8b6239, roughness: 0.9 });
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.52, 0.75), crateMat);
  crate.position.y = 0.26;
  crate.castShadow = true;
  crate.receiveShadow = true;
  g.add(crate);

  // Asphalt: small clay-dust tabby cat sitting on the crate.
  const cat = new THREE.Group();
  cat.position.set(0, 0.52, 0);
  cat.rotation.y = -0.4;

  const furMat = new THREE.MeshStandardMaterial({ color: 0xb8a38c, roughness: 0.85 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x756454, roughness: 0.85 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x9be066, emissive: 0x234010 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.34), furMat);
  body.position.set(0, 0.12, 0);
  body.castShadow = true;
  cat.add(body);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.05, 0.08), stripeMat);
  stripe.position.set(0, 0.16, -0.04);
  cat.add(stripe);

  const head = new THREE.Group();
  head.position.set(0, 0.28, 0.13);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), furMat);
  head.add(skull);

  const earGeo = new THREE.ConeGeometry(0.04, 0.09, 4);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, stripeMat);
    ear.position.set(side * 0.065, 0.1, 0);
    ear.rotation.z = -side * 0.2;
    head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), eyeMat);
    eye.position.set(side * 0.042, 0.02, 0.095);
    head.add(eye);
  }
  cat.add(head);

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.08, -0.16);
  const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.28, 6), stripeMat);
  tailMesh.position.set(0, 0.12, -0.05);
  tailMesh.rotation.x = -0.45;
  tailPivot.add(tailMesh);
  cat.add(tailPivot);

  g.add(cat);
  scene.add(g);
  return { tail: tailPivot, head };
}

function buildLawnChairAndWindsock(scene: THREE.Scene, x: number, z: number, yaw: number): THREE.Object3D {
  const chair = new THREE.Group();
  chair.position.set(x, heightAt(x, z), z);
  chair.rotation.y = yaw;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0xcfd6dc, metalness: 0.4, roughness: 0.5 });
  const fabricMat = new THREE.MeshStandardMaterial({ color: 0x3f88c5, roughness: 0.85 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 0.5), fabricMat);
  seat.position.set(0, 0.24, 0.02);
  seat.castShadow = true;
  chair.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.55, 0.05), fabricMat);
  back.position.set(0, 0.52, -0.22);
  back.rotation.x = -0.18;
  back.castShadow = true;
  chair.add(back);

  const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.26, 6);
  for (const lx of [-0.25, 0.25]) {
    for (const lz of [-0.2, 0.22]) {
      const leg = new THREE.Mesh(legGeo, frameMat);
      leg.position.set(lx, 0.13, lz);
      chair.add(leg);
    }
  }

  // Binoculars resting on his lap / chair arm.
  const binoMat = new THREE.MeshStandardMaterial({ color: 0x222629, roughness: 0.5 });
  const bino = new THREE.Group();
  bino.position.set(0.29, 0.34, 0.08);
  for (const side of [-0.035, 0.035]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.14, 8), binoMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.x = side;
    bino.add(barrel);
  }
  chair.add(bino);
  scene.add(chair);

  // Small windsock pole beside him.
  const poleGroup = new THREE.Group();
  poleGroup.position.set(x + 1.4, heightAt(x + 1.4, z + 1.6), z + 1.6);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.4, 6), frameMat);
  pole.position.y = 1.2;
  pole.castShadow = true;
  poleGroup.add(pole);

  const sockPivot = new THREE.Group();
  sockPivot.position.set(0, 2.35, 0);
  const sock = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.75, 8, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xf46036, side: THREE.DoubleSide, roughness: 0.7 }),
  );
  sock.rotation.z = -Math.PI / 2;
  sock.position.x = 0.4;
  sockPivot.add(sock);
  poleGroup.add(sockPivot);
  scene.add(poleGroup);

  return sockPivot;
}

function buildTreeRoot(scene: THREE.Scene, x: number, z: number): void {
  const g = new THREE.Group();
  g.position.set(x, heightAt(x, z), z);
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x543924, roughness: 0.95 });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x4ca64c, roughness: 0.9 });

  const mainRoot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 1.5, 8), barkMat);
  mainRoot.rotation.z = Math.PI / 2;
  mainRoot.position.y = 0.2;
  mainRoot.castShadow = true;
  g.add(mainRoot);

  const spur = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.0, 7), barkMat);
  spur.rotation.set(0.3, 0.5, Math.PI / 2 - 0.15);
  spur.position.set(0.3, 0.14, 0.35);
  g.add(spur);

  for (const [mx, my, mz, r] of [
    [-0.25, 0.42, 0.08, 0.16],
    [0.35, 0.38, -0.1, 0.18],
    [0.0, 0.34, 0.22, 0.14],
  ] as const) {
    const patch = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), mossMat);
    patch.scale.y = 0.45;
    patch.position.set(mx, my, mz);
    g.add(patch);
  }
  scene.add(g);
}

function buildPineConeBarrel(scene: THREE.Scene, x: number, z: number): THREE.Object3D {
  const g = new THREE.Group();
  g.position.set(x, heightAt(x, z), z);

  const drumMat = new THREE.MeshStandardMaterial({ color: 0x3b3532, roughness: 0.8, metalness: 0.35 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.95, 12), drumMat);
  barrel.position.y = 0.475;
  barrel.castShadow = true;
  g.add(barrel);

  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xff6b1a,
    emissive: 0xff4500,
    emissiveIntensity: 1.4,
    roughness: 0.5,
  });
  const embers = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), emberMat);
  embers.scale.y = 0.45;
  embers.position.y = 0.92;
  g.add(embers);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.45, 7),
    new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xff8800, emissiveIntensity: 1.6, roughness: 0.4 }),
  );
  flame.position.y = 1.15;
  g.add(flame);

  // Tiny tin thermos beside the barrel.
  const thermos = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8),
    new THREE.MeshStandardMaterial({ color: 0xc0392b, metalness: 0.3, roughness: 0.4 }),
  );
  thermos.position.set(-0.65, 0.15, 0.3);
  g.add(thermos);

  scene.add(g);
  return flame;
}

function buildFencePostSign(scene: THREE.Scene, x: number, z: number): void {
  const g = new THREE.Group();
  g.position.set(x, heightAt(x, z), z);
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7d5a38, roughness: 0.9 });
  const signMat = new THREE.MeshStandardMaterial({ color: 0xe6d6ad, roughness: 0.8 });

  const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.4, 0.16), woodMat);
  post.position.y = 0.7;
  post.castShadow = true;
  g.add(post);

  const board = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.4, 0.06), signMat);
  board.position.set(0, 1.15, 0.08);
  board.castShadow = true;
  g.add(board);

  scene.add(g);
}

function buildSalBucket(scene: THREE.Scene, x: number, z: number): void {
  const g = new THREE.Group();
  g.position.set(x, heightAt(x, z), z);
  const bucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.18, 0.36, 10),
    new THREE.MeshStandardMaterial({ color: 0x6c7a89, metalness: 0.4, roughness: 0.6 }),
  );
  bucket.position.y = 0.18;
  bucket.castShadow = true;
  g.add(bucket);
  scene.add(g);
}

function buildSentryPodium(scene: THREE.Scene, x: number, z: number): void {
  const g = new THREE.Group();
  g.position.set(x, heightAt(x, z), z);

  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.85, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xd8d2c5, roughness: 0.7 }),
  );
  stand.position.y = 0.425;
  stand.castShadow = true;
  g.add(stand);

  // Thick 900-page HOA binder on top.
  const binder = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.14, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.6 }),
  );
  binder.position.y = 0.92;
  g.add(binder);
  scene.add(g);
}

function buildMulchFurnace(scene: THREE.Scene, x: number, z: number): THREE.Object3D {
  const g = new THREE.Group();
  g.position.set(x, heightAt(x, z), z);

  const ironMat = new THREE.MeshStandardMaterial({ color: 0x433d3a, metalness: 0.45, roughness: 0.75 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 1.0), ironMat);
  body.position.y = 0.5;
  body.castShadow = true;
  g.add(body);

  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.85, 8), ironMat);
  chimney.position.set(-0.2, 1.4, -0.2);
  chimney.castShadow = true;
  g.add(chimney);

  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.35, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xff7b29, emissive: 0xff4500, emissiveIntensity: 1.5, roughness: 0.4 }),
  );
  glow.position.set(0, 0.35, 0.5);
  g.add(glow);

  // Shovel leaning against the furnace.
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b6239, roughness: 0.85 }),
  );
  handle.position.set(0.65, 0.48, 0.25);
  handle.rotation.z = 0.22;
  g.add(handle);

  scene.add(g);
  return glow;
}

function buildNeonBoothAndMoth(scene: THREE.Scene, x: number, z: number): THREE.Object3D {
  const g = new THREE.Group();
  g.position.set(x, heightAt(x, z), z);

  // Flowerpot stoop crate.
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.35, 0.45, 10),
    new THREE.MeshStandardMaterial({ color: 0xc26a44, roughness: 0.85 }),
  );
  pot.position.y = 0.225;
  pot.castShadow = true;
  g.add(pot);

  // Glowing glow-stick rods.
  const neonCols = [0x39ff14, 0xff2bd6, 0x00f0ff];
  for (let i = 0; i < neonCols.length; i++) {
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.32, 6),
      new THREE.MeshStandardMaterial({
        color: neonCols[i],
        emissive: neonCols[i],
        emissiveIntensity: 1.4,
        roughness: 0.3,
      }),
    );
    rod.position.set(-0.14 + i * 0.14, 0.55, 0.1);
    rod.rotation.z = (i - 1) * 0.25;
    g.add(rod);
  }

  // Fluttering moth orbiting above the glow-sticks.
  const mothPivot = new THREE.Group();
  mothPivot.position.set(0, 1.45, 0);
  const moth = new THREE.Group();
  moth.position.set(0.45, 0, 0);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xede6d1, side: THREE.DoubleSide, roughness: 0.7 });
  const wingGeo = new THREE.PlaneGeometry(0.16, 0.1);
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.x = side * 0.08;
    wing.rotation.x = Math.PI / 2 - 0.35;
    wing.rotation.y = side * 0.3;
    moth.add(wing);
  }
  mothPivot.add(moth);
  g.add(mothPivot);

  scene.add(g);
  return mothPivot;
}

function buildThimbleSeat(scene: THREE.Scene, x: number, z: number): void {
  const thimble = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.34, 0.32, 12),
    new THREE.MeshStandardMaterial({ color: 0xb8c0c8, metalness: 0.65, roughness: 0.35 }),
  );
  thimble.position.set(x, heightAt(x, z) + 0.16, z);
  thimble.castShadow = true;
  scene.add(thimble);
}

function buildVelvetRopes(scene: THREE.Scene, x: number, z: number): void {
  const g = new THREE.Group();
  g.position.set(x, heightAt(x, z), z);
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xb02030, roughness: 0.8 });

  for (const rz of [-1.2, 1.2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.85, 8), brassMat);
    post.position.set(0.9, 0.425, rz);
    post.castShadow = true;
    g.add(post);
  }

  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 8), ropeMat);
  rope.rotation.x = Math.PI / 2;
  rope.position.set(0.9, 0.72, 0);
  g.add(rope);
  scene.add(g);
}

function buildPicnicTable(scene: THREE.Scene, x: number, z: number): void {
  const g = new THREE.Group();
  g.position.set(x, heightAt(x, z), z);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8f6239, roughness: 0.88 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 3.0), woodMat);
  top.position.y = 0.72;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  for (const side of [-1, 1]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 3.0), woodMat);
    bench.position.set(side * 1.05, 0.38, 0);
    bench.castShadow = true;
    g.add(bench);
  }

  for (const lz of [-1.05, 1.05]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 0.12), woodMat);
    leg.position.set(0, 0.35, lz);
    leg.castShadow = true;
    g.add(leg);
  }

  scene.add(g);
}

function makeAcornMesh(): THREE.Group {
  const g = new THREE.Group();
  const nut = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x8c5523, roughness: 0.75 }),
  );
  nut.scale.y = 1.2;
  g.add(nut);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.095, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({ color: 0x4f3118, roughness: 0.9 }),
  );
  cap.position.y = 0.03;
  g.add(cap);
  return g;
}

/**
 * Anchor centres of the set pieces that stand on the ground at a fixed spot, moved off the road (clearProp). The parts
 * built around an anchor are offset from it. propsOffRoad.test.ts checks these.
 */
export function vibeSetPieceSpots(world: World): {
  wally: { x: number; z: number };
  merle: { x: number; z: number };
  thermos: { x: number; z: number };
  frank: { x: number; z: number };
  gary: { x: number; z: number };
  picnic: { x: number; z: number };
} {
  return {
    wally: clearProp(world, 565, -110),
    merle: clearProp(world, -260, -10),
    thermos: clearProp(world, 40, -330),
    frank: clearProp(world, 0, 260),
    gary: clearProp(world, PATIO_HEIGHTS.minX - 2, PATIO_HEIGHTS.maxZ - 8),
    picnic: clearProp(world, 76, -76),
  };
}

export function createVibeNpcs(scene: THREE.Scene, world: World, hud: Hud): VibeWorld {
  const entries: VibeEntry[] = [];
  let elapsed = 0;
  const at = vibeSetPieceSpots(world);

  const addVibe = (
    x: number,
    y: number,
    z: number,
    yaw: number,
    sitting: boolean,
    look: GnomeLook,
    line: (playerVehicle: Vehicle | null) => string,
  ): void => {
    // y is the lift above the ground under (x, z); the stored y is absolute.
    const gy = heightAt(x, z) + y;
    const model = makeGnome(scene, look);
    model.update(gnomeState(x, gy, z, yaw, 0, sitting), 1);
    entries.push({
      x,
      y: gy,
      z,
      yaw,
      sitting,
      phase: entries.length * 0.9,
      cooldown: 0,
      model,
      line,
      clock: newAnimClock(entries.length),
    });
  };

  // 1. John Bodega + Asphalt (tabby cat on a crate)
  let bodegaIdx = 0;
  const bodegaLines = [
    'John Bodega: "Acorn-Cola is lukewarm. Take it or leave it."',
    'John Bodega: "Asphalt only bats bottlecaps for paying customers."',
    'John Bodega: "No Sons, Just John. Sign\'s been wrong since \'98."',
  ];
  addVibe(
    BODEGA.x + 6,
    0,
    BODEGA.z,
    Math.PI / 2,
    false,
    makeLook({ hat: 0xf4efe6, shirt: 0x3b7a57, beard: 0x8b5a2b }),
    () => bodegaLines[bodegaIdx++ % bodegaLines.length],
  );
  const asphalt = buildCrateWithAsphalt(scene, BODEGA.x + 6.9, BODEGA.z + 0.9);

  // 2. Wind-Sock Wally (lawn chair + binoculars + windsock)
  let wallyIdx = 0;
  const wallyLines = [
    'Wind-Sock Wally: "Stall speed\'s 22, kid, don\'t embarrass yourself."',
    'Wind-Sock Wally: "Wind\'s out of the east. Good day to stay on the ground."',
  ];
  addVibe(
    at.wally.x,
    0.22,
    at.wally.z,
    -Math.PI / 2,
    true,
    makeLook({ hat: 0x6b4a2e, shirt: 0xc2a878, skin: 0xd99b66, beard: 0xd9d9d9, glasses: true }),
    () => wallyLines[wallyIdx++ % wallyLines.length],
  );
  const windsock = buildLawnChairAndWindsock(scene, at.wally.x, at.wally.z, -Math.PI / 2);

  // 3. Moss-Watcher Merle (sitting on a tree root)
  buildTreeRoot(scene, at.merle.x, at.merle.z);
  addVibe(
    at.merle.x,
    0.28,
    at.merle.z,
    Math.PI / 2,
    true,
    makeLook({ hat: 0x2e6b3e, shirt: 0x5c4a32, pants: 0x3e3429, beard: 0xf0f0f0, skin: 0xe0ac69 }),
    () => 'Moss-Watcher Merle: "You\'re in a hurry. The moss isn\'t."',
  );

  // 4. Thermos Theo (beside warm glowing pine-cone barrel)
  addVibe(
    at.thermos.x,
    0,
    at.thermos.z,
    -Math.PI / 4,
    false,
    makeLook({ hat: 0xc94a2f, shirt: 0x284366, pants: 0x2c3e50, beard: 0x9e7450 }),
    () => 'Thermos Theo: "Roads are slick, friend. Clay\'s brittle in the cold."',
  );
  const barrelFlame = buildPineConeBarrel(scene, at.thermos.x + 1.2, at.thermos.z - 0.7);

  // 5. Fence-Post Frank
  buildFencePostSign(scene, at.frank.x - 1.0, at.frank.z + 0.4);
  addVibe(
    at.frank.x,
    0,
    at.frank.z,
    -Math.PI / 3,
    false,
    makeLook({ hat: 0xc4a462, shirt: 0x3d6b99, pants: 0x34495e, beard: 0xbbbbbb, skin: 0xe0ac69 }),
    (playerVehicle) =>
      playerVehicle
        ? 'Fence-Post Frank: "That\'s a stolen rig."'
        : 'Fence-Post Frank: "Quiet day on Route South."',
  );

  // 6. Silt-Diver Sal
  addVibe(
    CULVERT_PORTALS.downtown.x + 3,
    0,
    CULVERT_PORTALS.downtown.z,
    -Math.PI / 2,
    false,
    makeLook({ hat: 0x8d99ae, shirt: 0x5c6b57, pants: 0x3b4a3f, beard: 0x6e4c2e, skin: 0xc68642 }),
    () => 'Silt-Diver Sal: "Found three bottlecaps and a porcelain ear down here."',
  );
  buildSalBucket(scene, CULVERT_PORTALS.downtown.x + 2.1, CULVERT_PORTALS.downtown.z + 0.7);

  // 7. Gate-Guard Gary
  addVibe(
    at.gary.x,
    0,
    at.gary.z,
    -Math.PI / 2,
    false,
    makeLook({ hat: 0xd6c7a9, shirt: 0xc8b896, pants: 0x2c3e50, beard: 0x7a5c3e, glasses: true }),
    (playerVehicle) => {
      if (playerVehicle?.kind === 'zero-turn') return 'Gate-Guard Gary: "Nice Zero-Turn. Right through, sir."';
      if (playerVehicle?.kind === 'push-bike') return 'Gate-Guard Gary: "A Push-Bike? That\'s a citation."';
      if (playerVehicle?.kind === 'dirt-bike') return 'Gate-Guard Gary: "Mud on the bylaw, sir. Mud on the bylaw."';
      return 'Gate-Guard Gary: "HOA binder says no loitering."';
    },
  );
  buildSentryPodium(scene, at.gary.x + 0.7, at.gary.z + 0.9);

  // 8. Ash-Shovel Ernie (mulch furnace glow)
  addVibe(
    -250,
    0,
    -55,
    Math.PI * 0.75,
    false,
    makeLook({ hat: 0x4a4540, shirt: 0x8c4a27, pants: 0x2b2927, beard: 0x9e9e9e, skin: 0xc68642 }),
    () => 'Ash-Shovel Ernie: "Chestnuts are done when the compost stops steaming."',
  );
  const furnaceGlow = buildMulchFurnace(scene, -251.4, -55.9);

  // 9. Neon-Moth Nina
  addVibe(
    GREENHOUSE_STRIP.minX + 6,
    0,
    GREENHOUSE_STRIP.minZ + 12,
    Math.PI / 2,
    false,
    makeLook({
      hat: 0xff38b8,
      shirt: 0x222034,
      pants: 0x1abc9c,
      beard: null,
      hair: { color: 0x33ffd6, style: 'pigtails' },
      glasses: true,
    }),
    () => 'Neon-Moth Nina: "Glow-sticks, two acorns. Shoo, moth!"',
  );
  const mothPivot = buildNeonBoothAndMoth(scene, GREENHOUSE_STRIP.minX + 6.9, GREENHOUSE_STRIP.minZ + 12.8);

  // 10. Knot-Hole Nora
  buildThimbleSeat(scene, -588, -120);
  addVibe(
    -588,
    0.26,
    -120,
    -Math.PI / 2,
    true,
    makeLook({
      hat: 0x5c7344,
      shirt: 0x6b3f5e,
      pants: 0x3e3429,
      beard: null,
      hair: { color: 0xdddddd, style: 'pigtails' },
    }),
    () => 'Knot-Hole Nora: "They\'ve got pink flamingos over there. Huge ones. Don\'t tell Turfton."',
  );

  // 11. Big Lou
  addVibe(
    GNOMECINO.x - 14,
    0,
    GNOMECINO.z,
    -Math.PI / 2,
    false,
    makeLook({ hat: 0x1e1e26, shirt: 0x1b1b22, pants: 0x141418, beard: 0x262220, skin: 0xd99b66, glasses: true }),
    () => 'Big Lou: "Bone-dry felt hats only inside The Gnomecino. Dry-Hat Embargo."',
  );
  buildVelvetRopes(scene, GNOMECINO.x - 14, GNOMECINO.z);

  // 12. Porcelain Gnome at Tall House Porch
  addVibe(
    -558,
    0,
    40,
    Math.PI / 2,
    false,
    makeLook({ hat: 0xf4f4f8, shirt: 0xe6e8f0, skin: 0xfafafa, beard: null, dress: true }),
    () => 'Porcelain Gnome: "Don\'t look at the lantern. One chip and we don\'t glue back."',
  );

  // 13. Castaway by Driftwood's turf-raft
  addVibe(
    53,
    0,
    230,
    -Math.PI / 2,
    false,
    makeLook({ hat: 0x4f9d92, shirt: 0xd9c79e, beard: 0xe5e0d4 }),
    () => 'Castaway: "Watch the canal for lawn sharks. Two fins, both forged."',
  );

  // 14. Squeaky-Clean Midge outside Glaze Clinic Hospital
  addVibe(
    9,
    0,
    32,
    -Math.PI / 2,
    false,
    makeLook({ hat: 0xf4f4f8, shirt: 0x3ec9b6, beard: null, glasses: true }),
    () => 'Squeaky-Clean Midge: "Claim denied before you even tripped. Sign here."',
  );

  // ---- Red Cap vs. Blue Cap picnic-table standoff at (76, -76) ---------------------------------------------------
  const TABLE_X = at.picnic.x;
  const TABLE_Z = at.picnic.z;
  buildPicnicTable(scene, TABLE_X, TABLE_Z);

  const redCaps: StandoffGnome[] = [];
  const blueCaps: StandoffGnome[] = [];
  const zOffsets = [-1.0, 0, 1.0];

  for (let i = 0; i < 3; i++) {
    const rz = TABLE_Z + zOffsets[i];
    const rx = TABLE_X - 1.55;
    const redModel = makeGnome(scene, makeLook({ hat: 0xd93636, shirt: 0xb52b2b, beard: 0xf4f4f4 }));
    redModel.update(gnomeState(rx, heightAt(rx, rz), rz, Math.PI / 2, 0), 1);
    redCaps.push({
      x: rx, z: rz, yaw: Math.PI / 2, phase: i * 1.1, throwTimer: 0, model: redModel, clock: newAnimClock(i * 2),
    });

    const bx = TABLE_X + 1.55;
    const blueModel = makeGnome(scene, makeLook({ hat: 0x2f64c9, shirt: 0x244f9e, beard: 0xdddddd }));
    blueModel.update(gnomeState(bx, heightAt(bx, rz), rz, -Math.PI / 2, 0), 1);
    blueCaps.push({
      x: bx, z: rz, yaw: -Math.PI / 2, phase: i * 1.1 + 0.5, throwTimer: 0, model: blueModel, clock: newAnimClock(i * 2 + 1),
    });
  }

  const acorns: AcornLob[] = [];
  for (let i = 0; i < 3; i++) {
    const mesh = makeAcornMesh();
    mesh.visible = false;
    scene.add(mesh);
    acorns.push({
      mesh,
      fromRed: i % 2 === 0,
      pairIndex: i,
      timer: i * 0.8,
      period: 2.4,
      flight: 0.85,
      fired: false,
    });
  }

  return {
    update(dt: number, playerX: number, playerZ: number, playerVehicle: Vehicle | null): string | null {
      elapsed += dt;

      // Animate ambient props.
      asphalt.tail.rotation.z = Math.sin(elapsed * 3.2) * 0.35;
      asphalt.head.rotation.y = Math.sin(elapsed * 1.1) * 0.22;
      windsock.rotation.y = Math.sin(elapsed * 2.6) * 0.2;
      const fireScale = 0.88 + Math.sin(elapsed * 11) * 0.14;
      barrelFlame.scale.set(fireScale, 0.85 + Math.cos(elapsed * 14) * 0.2, fireScale);
      (furnaceGlow as THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>).material.emissiveIntensity =
        1.25 + Math.sin(elapsed * 6.5) * 0.35;
      mothPivot.rotation.y = elapsed * 2.4;
      mothPivot.position.y = 1.45 + Math.sin(elapsed * 5.2) * 0.1;

      // Subtle idle sway on vibe characters.
      // Far characters are posed every few frames (animStride.ts); a cutscene's far-away player (1e5+) poses everyone.
      const everyFrame = playerX >= 1e5;
      for (const e of entries) {
        const step = stepAnimClock(e.clock, dt, everyFrame ? 1 : animStride(Math.hypot(e.x - playerX, e.z - playerZ)));
        if (step > 0) {
          e.model.update(gnomeState(e.x, e.y, e.z, e.yaw, 0, e.sitting), step);
          e.model.rig.rotation.z = Math.sin(elapsed * 1.6 + e.phase) * 0.025;
        }
        if (e.cooldown > 0) e.cooldown = Math.max(0, e.cooldown - dt);
      }

      // Red Cap vs. Blue Cap idle + acorn lobs. The throw arm is set after the pose step, so it holds on skipped frames too.
      for (const g of [...redCaps, ...blueCaps]) {
        const step = stepAnimClock(g.clock, dt, everyFrame ? 1 : animStride(Math.hypot(g.x - playerX, g.z - playerZ)));
        if (step > 0) {
          g.model.update(gnomeState(g.x, heightAt(g.x, g.z), g.z, g.yaw, 0), step);
          g.model.rig.rotation.z = Math.sin(elapsed * 2.2 + g.phase) * 0.03;
        }
        if (g.throwTimer > 0) {
          g.throwTimer = Math.max(0, g.throwTimer - dt);
          g.model.arms.right.rotation.x = -1.6 * (g.throwTimer / 0.35);
        }
      }

      for (const a of acorns) {
        a.timer += dt;
        if (a.timer >= a.period) {
          a.timer -= a.period;
          a.fromRed = !a.fromRed;
          a.fired = false;
        }
        if (a.timer <= a.flight) {
          const thrower = a.fromRed ? redCaps[a.pairIndex] : blueCaps[a.pairIndex];
          const target = a.fromRed ? blueCaps[a.pairIndex] : redCaps[a.pairIndex];
          if (!a.fired) {
            thrower.throwTimer = 0.35;
            a.fired = true;
          }
          const u = a.timer / a.flight;
          const arcY = 0.85 + 4 * 1.15 * u * (1 - u);
          a.mesh.visible = true;
          const ax = thrower.x + (target.x - thrower.x) * u;
          const az = thrower.z + (target.z - thrower.z) * u;
          a.mesh.position.set(ax, heightAt(ax, az) + arcY, az);
          a.mesh.rotation.x += dt * 7;
          a.mesh.rotation.z += dt * 5;
        } else {
          a.mesh.visible = false;
        }
      }

      // Check player proximity for vibe dialogue toasts.
      for (const e of entries) {
        if (e.cooldown > 0) continue;
        if (Math.hypot(playerX - e.x, playerZ - e.z) <= TALK_RADIUS) {
          e.cooldown = TALK_COOLDOWN;
          const line = e.line(playerVehicle);
          hud.toast(line);
          return line;
        }
      }

      return null;
    },

    blips(): Blip[] {
      return entries.map((e) => ({ x: e.x, z: e.z, color: BLIP_COLOR }));
    },
  };
}
