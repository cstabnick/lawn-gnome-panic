// The floor builder: turns a FloorLayout into a lit, walkable office floor.
// Walls, floor, lift, front doors, windows and the planet are architecture (built here from boxes);
// furniture and props come from @lawn/prefabs, NPC gnomes from @lawn/gnome.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { createGnomeModel, GNORMAN_LOOK, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import { flatLayer, LAYER } from '@lawn/depth';
import { LAYOUTS } from './floors';
import { buildSkyFloor } from './sky';
import { TUNING } from './config';
import type { Box, Floor, FloorId, FloorLayout } from './types';

const PARTITION_H = 1.6;
const CUTAWAY_H = 0.5;
const LIFT_W = 2.0;
/** Clear width between the lift's steel posts. */
const LIFT_INNER = 1.8;
const LIFT_H = 2.4;
const LIFT_WALK_IN = 0.6;
const DOOR_SPEED = 2.5;
const FRONT_W = 2.4;
const FRONT_H = 2.6;
const STEEL = 0xb8c0c8;
const LIFT_DOOR = 0x9aa4ae;

function box(min: [number, number, number], max: [number, number, number]): Box {
  return { min, max };
}

/** A canvas texture with centred text lines. */
function textTexture(
  w: number, h: number, lines: { text: string; size: number; color: string; font?: string }[], bg: string | null,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const total = lines.reduce((s, l) => s + l.size * 1.25, 0);
  let y = (h - total) / 2;
  for (const l of lines) {
    let size = l.size;
    const font = (s: number) => `${l.font ?? 'bold'} ${s}px Georgia, 'Times New Roman', serif`;
    g.font = font(size);
    while (size > 8 && g.measureText(l.text).width > w * 0.92) { size -= 2; g.font = font(size); }
    g.fillStyle = l.color;
    g.fillText(l.text, w / 2, y + l.size * 0.625);
    y += l.size * 1.25;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildFloor(scene: THREE.Scene, id: FloorId): Floor {
  if (id === 'sky') return buildSkyFloor(scene);
  return buildOfficeFloor(scene, LAYOUTS[id]);
}

function buildOfficeFloor(scene: THREE.Scene, layout: FloorLayout): Floor {
  const { w, d } = layout;
  const H = TUNING.wallHeight;
  const T = TUNING.wallThickness;
  const ex = layout.elevatorX;
  const group = new THREE.Group();
  group.name = `floor-${layout.id}`;

  // Everything this builder creates (and must dispose). Prefabs and gnome models are never listed here.
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const texs: THREE.Texture[] = [];
  const geo = <G extends THREE.BufferGeometry>(g: G): G => { geos.push(g); return g; };
  const mat = <M extends THREE.Material>(m: M): M => { mats.push(m); return m; };
  const tex = <X extends THREE.Texture>(t: X): X => { texs.push(t); return t; };

  const colliders: Box[] = [];
  const addCollider = (b: Box): Box => { colliders.push(b); return b; };
  const dropCollider = (b: Box | null): void => {
    if (!b) return;
    const i = colliders.indexOf(b);
    if (i >= 0) colliders.splice(i, 1);
  };

  /** A box mesh spanning [min, max] in floor coordinates. */
  const boxMesh = (min: [number, number, number], max: [number, number, number], m: THREE.Material, shadows = true): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo(new THREE.BoxGeometry(max[0] - min[0], max[1] - min[1], max[2] - min[2])), m);
    mesh.position.set((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    group.add(mesh);
    return mesh;
  };

  // ---------- scene look and lights ----------
  scene.background = new THREE.Color(0xdfe7ef);
  scene.fog = null;
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9a8f7a, 1.6);
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.8);
  sun.position.set(6, 14, 8);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  const ext = Math.max(w, d) / 2 + 2;
  sun.shadow.camera.left = -ext;
  sun.shadow.camera.right = ext;
  sun.shadow.camera.top = ext;
  sun.shadow.camera.bottom = -ext;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 60;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  group.add(hemi, sun, sun.target);

  // ---------- floor ----------
  const floorMat = mat(new THREE.MeshStandardMaterial({ color: layout.floorColor, roughness: 0.9 }));
  const floorMesh = boxMesh([-w / 2, -0.2, -d / 2], [w / 2, 0, d / 2], floorMat);
  floorMesh.castShadow = false;
  // A slightly darker carpet border, laid on the floor as a tint layer.
  const border = new THREE.Color(layout.floorColor).multiplyScalar(0.88);
  const borderMat = mat(flatLayer(new THREE.MeshStandardMaterial({ color: border, roughness: 0.95 }), LAYER.tint));
  const bw = 0.35;
  const borderGeo = (gw: number, gd: number) => geo(new THREE.PlaneGeometry(gw, gd).rotateX(-Math.PI / 2));
  for (const [x, z, gw, gd] of [
    [0, -d / 2 + bw / 2, w, bw], [0, d / 2 - bw / 2, w, bw],
    [-w / 2 + bw / 2, 0, bw, d - 2 * bw], [w / 2 - bw / 2, 0, bw, d - 2 * bw],
  ] as const) {
    const strip = new THREE.Mesh(borderGeo(gw, gd), borderMat);
    strip.position.set(x, 0, z);
    strip.receiveShadow = true;
    group.add(strip);
  }

  // ---------- outer walls ----------
  const wallMat = mat(new THREE.MeshStandardMaterial({ color: layout.wallColor, roughness: 0.85 }));
  // Side walls run the full depth plus both corners and stand 1 cm taller, so corner overlaps never share a face.
  const sideH = H + 0.01;
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -w / 2 - T : w / 2;
    const b = box([x0, 0, -d / 2 - T], [x0 + T, sideH, d / 2 + T]);
    boxMesh(b.min, b.max, wallMat);
    addCollider(b);
  }
  // North wall: left and right of the lift, plus a lintel over the opening. Ends sink 1 cm into the side walls.
  // The wall stops in the middle of the lift's steel posts, so its end faces stay hidden inside them.
  const nz0 = -d / 2 - T, nz1 = -d / 2;
  const liftL = ex - LIFT_W / 2, liftR = ex + LIFT_W / 2;
  const POST_IN = LIFT_INNER / 2, POST_OUT = LIFT_W / 2 + 0.15, WALL_END = LIFT_W / 2 + 0.065;
  for (const [a, b] of [[-w / 2 - 0.01, ex - WALL_END], [ex + WALL_END, w / 2 + 0.01]] as const) {
    if (b - a <= 0.01) continue;
    const c = box([a, 0, nz0], [b, H, nz1]);
    boxMesh(c.min, c.max, wallMat);
    addCollider(c);
  }
  // Lintel: same wall, between the two wall ends (back-to-back faces inside the wall, never seen).
  boxMesh([ex - WALL_END, LIFT_H + 0.1, nz0], [ex + WALL_END, H, nz1], wallMat);
  addCollider(box([liftL, LIFT_H, nz0], [liftR, H, nz1]));

  // South wall: the low cutaway (the camera looks in from +z), with a gap for the front doors.
  const sz0 = d / 2, sz1 = d / 2 + T;
  const fx = layout.frontDoorX;
  const southSpans: [number, number][] = fx === undefined
    ? [[-w / 2 - 0.01, w / 2 + 0.01]]
    : [[-w / 2 - 0.01, fx - FRONT_W / 2 - 0.125], [fx + FRONT_W / 2 + 0.125, w / 2 + 0.01]];
  // (A 5 mm gap to the door posts: no shared or near-parallel faces.)
  for (const [a, b] of southSpans) {
    if (b - a <= 0.01) continue;
    const c = box([a, 0, sz0], [b, CUTAWAY_H, sz1]);
    boxMesh(c.min, c.max, wallMat);
    addCollider(c);
  }

  // ---------- lift ----------
  const steelMat = mat(new THREE.MeshStandardMaterial({ color: STEEL, metalness: 0.6, roughness: 0.35 }));
  const liftDoorMat = mat(new THREE.MeshStandardMaterial({ color: LIFT_DOOR, metalness: 0.5, roughness: 0.4 }));
  // Frame: two posts through the full wall depth (proud of both faces by 6-8 cm) and a head bar.
  // Every parallel face pair with the wall, lintel, car and doors is at least 6 cm apart (no z-fighting).
  for (const sx of [-1, 1]) {
    const a = ex + sx * POST_IN, b = ex + sx * POST_OUT;
    const c = box([Math.min(a, b), 0, nz0 - 0.06], [Math.max(a, b), H - 0.06, nz1 + 0.08]);
    boxMesh(c.min, c.max, steelMat);
  }
  boxMesh([ex - POST_IN - 0.13, LIFT_H - 0.07, nz0 + 0.06], [ex + POST_IN + 0.13, LIFT_H + 0.15, nz1 + 0.14], steelMat);
  // The car: a dark room behind the opening, seen from inside (BackSide), so its front face is invisible.
  const carMat = mat(new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.7, side: THREE.BackSide }));
  const carDepth = 1.6;
  const carW = LIFT_INNER - 0.02, carH = LIFT_H - 0.03;
  const car = new THREE.Mesh(geo(new THREE.BoxGeometry(carW, carH, carDepth)), carMat);
  car.position.set(ex, carH / 2, nz1 - 0.005 - carDepth / 2);
  car.receiveShadow = true;
  group.add(car);
  const carLight = new THREE.PointLight(0xfff0d0, 0.8, 3);
  carLight.position.set(ex, LIFT_H - 0.3, nz1 - carDepth / 2);
  group.add(carLight);
  // The walk-in stop: the opening is walkable 0.6 m deep.
  addCollider(box([liftL, 0, nz1 - LIFT_WALK_IN - 0.5], [liftR, LIFT_H, nz1 - LIFT_WALK_IN]));
  // And the car's side walls, so nobody slips behind the north wall.
  addCollider(box([ex - POST_OUT - 0.3, 0, nz1 - LIFT_WALK_IN - 0.5], [ex - POST_IN, LIFT_H, nz0]));
  addCollider(box([ex + POST_IN, 0, nz1 - LIFT_WALK_IN - 0.5], [ex + POST_OUT + 0.3, LIFT_H, nz0]));
  addCollider(box([ex - POST_OUT, 0, nz0], [ex - POST_IN, LIFT_H, nz1 + 0.08]));
  addCollider(box([ex + POST_IN, 0, nz0], [ex + POST_OUT, LIFT_H, nz1 + 0.08]));
  // Two door slabs in the middle of the wall, sliding sideways into it (their outer ends tuck inside the posts).
  const leafW = LIFT_W / 2 - 0.01, leafH = LIFT_H - 0.11;
  const leafGeo = geo(new THREE.BoxGeometry(leafW, leafH, 0.06));
  const leaves = [-1, 1].map((sx) => {
    const m = new THREE.Mesh(leafGeo, liftDoorMat);
    m.position.set(ex + sx * (LIFT_W / 4), leafH / 2 + 0.01, (nz0 + nz1) / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return { mesh: m, side: sx };
  });
  const liftSlide = 1.0;
  const liftDoorBox = box([liftL, 0, nz0], [liftR, LIFT_H, nz1]);
  let liftOpen = 0, liftTarget = 0;
  let liftBlocked: Box | null = addCollider(liftDoorBox);
  // The lit call panel beside the lift: up and down arrows.
  const panelTex = tex(textTexture(64, 128, [
    { text: '▲', size: 40, color: '#ffd25a', font: '' }, { text: '▼', size: 40, color: '#ffd25a', font: '' },
  ], '#24303c'));
  const panelMat = mat(new THREE.MeshBasicMaterial({ map: panelTex }));
  const panel = new THREE.Mesh(geo(new THREE.BoxGeometry(0.22, 0.4, 0.11)), panelMat);
  panel.position.set(ex + POST_OUT + 0.3, 1.25, nz1 + 0.005);
  group.add(panel);

  // ---------- front door (lobby) ----------
  let frontOpen = 0, frontTarget = 0;
  let frontBlocked: Box | null = null;
  const glassLeaves: { mesh: THREE.Mesh; side: number }[] = [];
  let lightOutside: THREE.Mesh | null = null;
  let frontDoorBox: Box | null = null;
  if (fx !== undefined) {
    // The camera looks in from +z over the low cutaway, so it usually stands outside the south wall. The full-height
    // door frame and glass would then sit between it and the room (a tinted screen with a clear seam down the middle),
    // so they are only drawn while the camera is inside. Shadows are unaffected.
    const cutaway = (m: THREE.Mesh): void => {
      const material = m.material as THREE.Material;
      const depthWrite = material.depthWrite;
      m.onBeforeRender = (_r, _s, cam) => {
        const show = cam.position.z < sz0;
        material.colorWrite = show;
        material.depthWrite = show && depthWrite;
      };
    };
    const headMat = mat(new THREE.MeshStandardMaterial({ color: STEEL, metalness: 0.6, roughness: 0.35 }));
    // Frame: two posts, full height, and a head bar.
    for (const sx of [-1, 1]) {
      const inner = fx + sx * FRONT_W / 2;
      const outer = fx + sx * (FRONT_W / 2 + 0.12);
      const c = box([Math.min(inner, outer), 0, sz0 - 0.03], [Math.max(inner, outer), FRONT_H - 0.02, sz1 + 0.03]);
      cutaway(boxMesh(c.min, c.max, headMat));
      addCollider(c);
    }
    cutaway(boxMesh([fx - FRONT_W / 2 - 0.13, FRONT_H - 0.16, sz0 - 0.04], [fx + FRONT_W / 2 + 0.13, FRONT_H, sz1 + 0.04], headMat));
    const glassMat = mat(new THREE.MeshStandardMaterial({ color: 0xbfe6ef, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.1 }));
    const glassGeo = geo(new THREE.BoxGeometry(FRONT_W / 2 - 0.02, FRONT_H - 0.2, 0.04));
    for (const sx of [-1, 1]) {
      const m = new THREE.Mesh(glassGeo, glassMat);
      cutaway(m);
      m.position.set(fx + sx * FRONT_W / 4, (FRONT_H - 0.2) / 2 + 0.02, (sz0 + sz1) / 2);
      m.renderOrder = 1;
      group.add(m);
      glassLeaves.push({ mesh: m, side: sx });
    }
    frontDoorBox = box([fx - FRONT_W / 2, 0, sz0], [fx + FRONT_W / 2, FRONT_H, sz1]);
    frontBlocked = addCollider(frontDoorBox);
    // A walkable slab outside the doors, and a stop at its far end.
    const slabMat = mat(new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.9 }));
    const slab = boxMesh([fx - 1.5, -0.2, sz1 + 0.005], [fx + 1.5, 0, sz1 + 3.005], slabMat);
    slab.castShadow = false;
    // Threshold under the door gap (between the cutaway spans).
    boxMesh([fx - FRONT_W / 2 + 0.01, -0.2, sz0 + 0.005], [fx + FRONT_W / 2 - 0.01, 0, sz1], slabMat).castShadow = false;
    addCollider(box([fx - 2, 0, d / 2 + 1.5 + 0.3], [fx + 2, 3, d / 2 + 2.5]));
    addCollider(box([fx - 2, 0, sz1], [fx - 1.5, 3, d / 2 + 2.5]));
    addCollider(box([fx + 1.5, 0, sz1], [fx + 2, 3, d / 2 + 2.5]));
    // The light outside: a bright white plane facing back in (-z), shown only while the doors are open.
    lightOutside = new THREE.Mesh(geo(new THREE.PlaneGeometry(3, 3)), mat(new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })));
    lightOutside.rotation.y = Math.PI;
    lightOutside.position.set(fx, 1.5, sz1 + 3.0);
    lightOutside.visible = false;
    group.add(lightOutside);
  }

  // ---------- windows and Shellshore ----------
  if (layout.windows) {
    const paneMat = mat(flatLayer(new THREE.MeshBasicMaterial({ color: 0xbfe3ff }), LAYER.decal));
    const paneGeo = geo(new THREE.PlaneGeometry(2, 1.4));
    const frameMat = mat(new THREE.MeshStandardMaterial({ color: 0xf6f3ec, roughness: 0.6 }));
    const barH = geo(new THREE.BoxGeometry(2.18, 0.08, 0.1));
    const barV = geo(new THREE.BoxGeometry(0.08, 1.42, 0.09));
    const sill = geo(new THREE.BoxGeometry(2.3, 0.05, 0.16));
    const addWindow = (x: number, z: number, rotY: number) => {
      const win = new THREE.Group();
      win.position.set(x, 0, z);
      win.rotation.y = rotY;
      const pane = new THREE.Mesh(paneGeo, paneMat);
      pane.position.set(0, 1.7, 0);
      win.add(pane);
      for (const y of [1.0 - 0.04, 2.4 + 0.04]) {
        const m = new THREE.Mesh(barH, frameMat);
        m.position.set(0, y, 0.04);
        win.add(m);
      }
      for (const sx of [-1, 1]) {
        const m = new THREE.Mesh(barV, frameMat);
        m.position.set(sx * 1.04, 1.7, 0.035);
        win.add(m);
      }
      const s = new THREE.Mesh(sill, frameMat);
      s.position.set(0, 0.9, 0.07);
      s.castShadow = true;
      win.add(s);
      group.add(win);
    };
    const centers = (len: number): number[] => {
      const n = Math.max(0, Math.floor(len / 4));
      const out: number[] = [];
      for (let k = 0; k < n; k++) out.push(-(n - 1) * 2 + k * 4);
      return out.filter((c) => Math.abs(c) + 1.1 <= len / 2 - 0.3);
    };
    for (const c of centers(w)) if (Math.abs(c - ex) >= 2.6) addWindow(c, -d / 2, 0);
    for (const c of centers(d)) {
      addWindow(-w / 2, c, Math.PI / 2);
      addWindow(w / 2, c, -Math.PI / 2);
    }
    // Shellshore, the beach planet, far beyond the north wall.
    const planet = new THREE.Group();
    planet.position.set(0, 40, -120);
    planet.add(new THREE.Mesh(geo(new THREE.SphereGeometry(18, 48, 32)), mat(new THREE.MeshBasicMaterial({ color: 0xe8d6a0 }))));
    const band = new THREE.Mesh(geo(new THREE.SphereGeometry(18.3, 48, 16)), mat(new THREE.MeshBasicMaterial({ color: 0x4aa8e8 })));
    band.scale.set(1, 0.22, 1);
    band.rotation.z = 0.18;
    planet.add(band);
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 128;
    const gg = glowCanvas.getContext('2d')!;
    const grad = gg.createRadialGradient(64, 64, 20, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,240,200,0.55)');
    grad.addColorStop(1, 'rgba(255,240,200,0)');
    gg.fillStyle = grad;
    gg.fillRect(0, 0, 128, 128);
    const glowTex = tex(new THREE.CanvasTexture(glowCanvas));
    const glow = new THREE.Sprite(mat(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
    glow.scale.set(60, 60, 1);
    glow.position.z = -2;
    planet.add(glow);
    planet.name = 'shellshore';
    group.add(planet);
  }

  // ---------- lobby sign ----------
  if (layout.id === 'lobby') {
    const signTex = tex(textTexture(1280, 256, [
      { text: 'BUCKETWORTH & SONS', size: 120, color: '#3b2a1a' },
      { text: 'Collectors, since before there was anything to collect', size: 52, color: '#6b4a2e', font: 'italic' },
    ], null));
    const signMat = mat(flatLayer(new THREE.MeshBasicMaterial({ map: signTex, transparent: true }), LAYER.decal));
    const sign = new THREE.Mesh(geo(new THREE.PlaneGeometry(6, 1.2)), signMat);
    // Beside the lift (the wall over the lift is too short for it), above the reception area.
    const signX = ex - LIFT_W / 2 - 0.3 - 3 >= -w / 2 + 0.3 ? ex - LIFT_W / 2 - 0.3 - 3 : ex + LIFT_W / 2 + 0.8 + 3;
    sign.position.set(signX, 2.2, nz1);
    group.add(sign);
  }

  // ---------- interior walls (cubicle partitions) ----------
  for (const s of layout.walls) {
    const alongX = Math.abs(s.x1 - s.x0) >= Math.abs(s.z1 - s.z0);
    // Ends extend by just under half a thickness and the two directions differ by 1 cm in height,
    // so corners and T-junctions overlap without sharing a face.
    const extX = T / 2 - 0.01, extZ = T / 2 - 0.005;
    let b: Box;
    if (alongX) {
      const a = Math.min(s.x0, s.x1) - extX, c = Math.max(s.x0, s.x1) + extX;
      const z = (s.z0 + s.z1) / 2;
      b = box([a, 0, z - T / 2], [c, PARTITION_H, z + T / 2]);
    } else {
      const a = Math.min(s.z0, s.z1) - extZ, c = Math.max(s.z0, s.z1) + extZ;
      const x = (s.x0 + s.x1) / 2;
      b = box([x - T / 2, 0, a], [x + T / 2, PARTITION_H + 0.01, c]);
    }
    boxMesh(b.min, b.max, wallMat);
    addCollider(b);
  }

  // ---------- props ----------
  const props: THREE.Object3D[] = [];
  const propColliders: (Box | null)[] = [];
  for (const p of layout.props) {
    let obj: THREE.Object3D;
    try {
      obj = buildPrefab(p.prefab, { tint: p.tint, scale: p.scale });
    } catch (err) {
      console.warn(`[nothing-left-to-collect] unknown prefab "${p.prefab}"`, err);
      obj = new THREE.Group();
    }
    obj.position.set(p.x, p.y ?? 0, p.z);
    obj.rotation.y = ((p.rot ?? 0) * Math.PI) / 180;
    obj.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    group.add(obj);
    props.push(obj);
    let col: Box | null = null;
    if (p.solid) {
      obj.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(obj);
      if (!bb.isEmpty()) {
        const sx = Math.min(0.05, (bb.max.x - bb.min.x) / 4);
        const sz = Math.min(0.05, (bb.max.z - bb.min.z) / 4);
        col = addCollider(box([bb.min.x + sx, bb.min.y, bb.min.z + sz], [bb.max.x - sx, bb.max.y, bb.max.z - sz]));
      }
    }
    propColliders.push(col);
  }

  // ---------- NPCs ----------
  const npcs: Record<string, GnomeModel> = {};
  const zzzTex = layout.npcs.some((n) => n.asleep)
    ? tex(textTexture(256, 128, [{ text: 'z z z', size: 72, color: '#ffffff', font: 'bold italic' }], null))
    : null;
  const npcState: {
    model: GnomeModel; pos: THREE.Vector3; facing: number; phase: number;
    asleep: boolean; zzz: THREE.Sprite | null;
  }[] = [];
  const zero = new THREE.Vector3();
  for (const n of layout.npcs) {
    const look = { ...GNORMAN_LOOK, ...n.look } as GnomeLook;
    const model = createGnomeModel(look);
    model.object.position.set(n.x, 0, n.z);
    model.object.rotation.y = n.facing;
    model.object.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    group.add(model.object);
    npcs[n.id] = model;
    let zzz: THREE.Sprite | null = null;
    if (n.asleep && zzzTex) {
      zzz = new THREE.Sprite(mat(new THREE.SpriteMaterial({ map: zzzTex, transparent: true, depthWrite: false, color: 0x5a6a90 })));
      zzz.scale.set(0.7, 0.35, 1);
      zzz.position.set(n.x, 1.5, n.z);
      group.add(zzz);
    }
    npcState.push({ model, pos: new THREE.Vector3(n.x, 0, n.z), facing: n.facing, phase: npcState.length * 0.7, asleep: !!n.asleep, zzz });
    addCollider(box([n.x - 0.3, 0, n.z - 0.3], [n.x + 0.3, 1.1, n.z + 0.3]));
  }

  scene.add(group);

  let t = 0;
  const approach = (cur: number, target: number, step: number) =>
    cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step);

  const floor: Floor = {
    id: layout.id,
    layout,
    group,
    colliders,
    props,
    npcs,
    groundAt: () => 0,
    update(dt: number) {
      t += dt;
      // Lift doors.
      liftOpen = approach(liftOpen, liftTarget, (DOOR_SPEED * dt) / liftSlide);
      for (const l of leaves) l.mesh.position.x = ex + l.side * (LIFT_W / 4 + liftOpen * liftSlide);
      // Front doors.
      if (fx !== undefined) {
        // Each glass leaf ends 6 cm past the post's inner face when open (no near-parallel faces).
        const slide = FRONT_W / 2 + 0.05;
        frontOpen = approach(frontOpen, frontTarget, (DOOR_SPEED * dt) / slide);
        for (const g of glassLeaves) g.mesh.position.x = fx + g.side * (FRONT_W / 4 + frontOpen * slide);
      }
      // NPCs: idle bob, sleepers slump and snore.
      for (const s of npcState) {
        s.model.update({ position: s.pos, velocity: zero, facing: s.facing, grounded: true, jumpsUsed: 0, sitting: false }, dt);
        s.model.object.position.y = 0.01 * Math.sin((t + s.phase) * Math.PI);
        if (s.asleep) {
          s.model.rig.rotation.x = 0.35;
          if (s.zzz) {
            const k = ((t + s.phase) % 2) / 2;
            s.zzz.position.y = 1.35 + k * 0.5;
            (s.zzz.material as THREE.SpriteMaterial).opacity = Math.min(1, k * 4) * (1 - k);
          }
        }
      }
    },
    setElevatorOpen(open: boolean) {
      liftTarget = open ? 1 : 0;
      if (open) { dropCollider(liftBlocked); liftBlocked = null; }
      else if (!liftBlocked) liftBlocked = addCollider(liftDoorBox);
    },
    setFrontDoorOpen(open: boolean) {
      if (!frontDoorBox) return;
      frontTarget = open ? 1 : 0;
      if (lightOutside) lightOutside.visible = open;
      if (open) { dropCollider(frontBlocked); frontBlocked = null; }
      else if (!frontBlocked) frontBlocked = addCollider(frontDoorBox);
    },
    removeProp(index: number) {
      const obj = props[index];
      if (!obj) return;
      obj.visible = false;
      dropCollider(propColliders[index] ?? null);
      propColliders[index] = null;
    },
    dispose() {
      scene.remove(group);
      sun.dispose();
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
      for (const x of texs) x.dispose();
      geos.length = 0; mats.length = 0; texs.length = 0;
    },
  };
  return floor;
}
