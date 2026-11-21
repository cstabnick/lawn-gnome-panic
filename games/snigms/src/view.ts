// The 3D side: renderer, camera, lot geometry (floors, walls, doors, windows), furniture prefabs, the gnome's body, ghosts and picking.
// Only this file may import three-side gnome/prefab building.
import * as THREE from 'three';
import { createGnome, createGnomeModel, DEFAULT_LOOK, getMyGnome, toModelLook, TUNING, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import { FLOOR_COLOR, FLOORS, FURNITURE, LOT_H, LOT_W, WALL_HEIGHT, WALL_THICK } from './config';
import type { EdgeKey, EdgeKind, FloorKind, GnomePuppet, Lot, PlacedItem, Pose, Rot, WallsMode } from './types';
import { carpoolTile, facingYaw, itemCenter, itemSize, parseEdge, type Tile, type Vertex } from './world';
import type { PersonLook } from './people';
import { townGate } from './town';

export type Ghost =
  | { type: 'edges'; keys: EdgeKey[]; kind: EdgeKind | 'erase'; valid: boolean }
  | { type: 'item'; kind: string; tx: number; ty: number; rot: Rot; valid: boolean }
  | { type: 'tiles'; tiles: Tile[]; valid: boolean };

export interface View {
  /** Rebuild floors, walls, items from the lot (diffing is optional; keep it fast for a 24 x 18 lot). */
  /** `home`: the home lot (carpool stop and mailbox at its corner). False for the town, where the gate is drawn instead. */
  setLot(lot: Lot, home?: boolean): void;
  /** A neighbour's gnome: a puppet the caller moves (see npcs.ts). Built from the look in people.ts. */
  addNeighbour(look: PersonLook): GnomePuppet;
  /** 'up' every wall full height; 'cut' walls on the camera's near sides drop to a low sill; 'down' all low. */
  setWalls(mode: WallsMode): void;
  /** Sun colour/intensity and sky from the minute of day (0..1439). Dark at night, warm at dusk. */
  setDaylight(minuteOfDay: number): void;
  setGhost(g: Ghost | null): void;
  /** Highlight a placed item (ring or tint); null clears. */
  setSelected(id: number | null): void;
  /** Screen position (client pixels) to the tile under it on the ground plane, or null if off the lot. */
  pickTile(clientX: number, clientY: number): Tile | null;
  /** Screen position to the ground point (world x, z) under it, or null if the ray misses the ground plane. Not limited to the lot. */
  pickGround(clientX: number, clientY: number): { x: number; z: number } | null;
  /** Nearest grid vertex to the ground point under the pointer, or null if off the lot (a half-tile outside still snaps to the border). */
  pickVertex(clientX: number, clientY: number): Vertex | null;
  /** Id of the placed item under the pointer (raycast its prefab), or null. */
  pickItem(clientX: number, clientY: number): number | null;
  /** Drag the camera: screen pixel deltas become ground movement (so the lot follows the finger). */
  pan(dxPx: number, dyPx: number): void;
  /** Multiply the camera distance (factor < 1 zooms in); clamped to a sane range. */
  zoom(factor: number): void;
  /** Turn the camera around its target by dYaw radians. */
  orbit(dYaw: number): void;
  resize(): void;
  render(dt: number): void;
  gnome: GnomePuppet;
}

// ---- constants (view only) ----
const PITCH = (52 * Math.PI) / 180;
const CAM_FOV = 40;
const DIST_DEFAULT = 24;
const DIST_MIN = 8;
const DIST_MAX = 45;
const LOW_WALL = 0.25;
const LOW_RATIO = LOW_WALL / WALL_HEIGHT;
const SKY_DAY = new THREE.Color(0x9fd8f0);
const SKY_WARM = new THREE.Color(0xf2a070);
const SKY_NIGHT = new THREE.Color(0x1b2440);
const SUN_WHITE = new THREE.Color(0xfff4e0);
const SUN_WARM = new THREE.Color(0xffb070);
const SUN_MOON = new THREE.Color(0x6080c0);
const WALL_COLOR = 0xefe2c0;
const TRIM_COLOR = 0x8b5a2b;
const SILL_COLOR = 0xd9ccaa;
const PANE_COLOR = 0xcfeeff;
const EDGE_KIND_COLOR: Record<EdgeKind, number> = { wall: 0xf1e3c4, door: 0x8b5a2b, window: 0xbfe8ff };
const ERASE_COLOR = 0xff7a7a;
const BAD_COLOR = 0xff4d4d;
const GOOD_TILE = 0x4caf50;
const BAD_TILE = 0xe53935;

/** Unit box with its base on y = 0 and centred on x and z. Shared by every wall, ghost and plate. */
const BOX = new THREE.BoxGeometry(1, 1, 1);
BOX.translate(0, 0.5, 0);

type WallRec = { g: THREE.Group; mx: number; mz: number; ratio: number };

export function createView(canvas: HTMLCanvasElement): View {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const sky = new THREE.Color(0x9fd8f0);
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, 60, 140);
  const camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 300);

  // ---- lights ----
  const hemi = new THREE.HemisphereLight(0xdff3ff, 0x4a6b33, 0.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0008;
  const shadowCam = sun.shadow.camera as THREE.OrthographicCamera;
  shadowCam.left = -22;
  shadowCam.right = 22;
  shadowCam.top = 22;
  shadowCam.bottom = -22;
  shadowCam.near = 1;
  shadowCam.far = 120;
  shadowCam.updateProjectionMatrix();
  sun.target.position.set(LOT_W / 2, 0, LOT_H / 2);
  scene.add(sun, sun.target);

  // ---- shared materials and geometry ----
  const lawnMat = new THREE.MeshStandardMaterial({ color: FLOOR_COLOR.lawn, roughness: 1 });
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), lawnMat);
  lawn.receiveShadow = true;
  scene.add(lawn);

  const floorGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const floorMat: Record<FloorKind, THREE.MeshStandardMaterial> = {
    lawn: lawnMat,
    wood: new THREE.MeshStandardMaterial({ color: FLOOR_COLOR.wood, roughness: 0.9 }),
    tile: new THREE.MeshStandardMaterial({ color: FLOOR_COLOR.tile, roughness: 0.6 }),
    carpet: new THREE.MeshStandardMaterial({ color: FLOOR_COLOR.carpet, roughness: 1 }),
    stone: new THREE.MeshStandardMaterial({ color: FLOOR_COLOR.stone, roughness: 0.8 }),
  };
  const wallMat = new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.85 });
  const trimMat = new THREE.MeshStandardMaterial({ color: TRIM_COLOR, roughness: 0.8 });
  const sillMat = new THREE.MeshStandardMaterial({ color: SILL_COLOR, roughness: 0.85 });
  const paneMat = new THREE.MeshBasicMaterial({ color: PANE_COLOR, transparent: true, opacity: 0.35, depthWrite: false });
  const gridMat = new THREE.LineBasicMaterial({ color: 0x3f7a2a, transparent: true, opacity: 0.35 });
  const carpoolMat = new THREE.MeshStandardMaterial({ color: 0xd9c27a, roughness: 0.9 });
  const outlineMat = new THREE.LineBasicMaterial({ color: 0xffe14d });
  const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 0.02, 1));
  const ghostPlateMats = { ok: ghostMat(GOOD_TILE, 0.4), bad: ghostMat(BAD_TILE, 0.4) };
  const ghostEdgeMats = new Map<string, THREE.MeshBasicMaterial>();

  function ghostMat(color: number, opacity: number): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  }

  // ---- groups ----
  const lotGroup = new THREE.Group();
  const itemsGroup = new THREE.Group();
  const ghostRoot = new THREE.Group();
  const selOutline = new THREE.LineSegments(outlineGeo, outlineMat);
  selOutline.visible = false;
  scene.add(lotGroup, itemsGroup, ghostRoot, selOutline);

  let lotW = LOT_W;
  let lotH = LOT_H;
  let curLot: Lot | null = null;
  let selectedId: number | null = null;
  let wallsMode: WallsMode = 'up';
  let walls: WallRec[] = [];

  // ---- camera state ----
  const target = new THREE.Vector3(LOT_W / 2, 0, LOT_H / 2);
  let yaw = 0;
  let dist = DIST_DEFAULT;

  function updateCamera(): void {
    const cp = Math.cos(PITCH);
    const sp = Math.sin(PITCH);
    camera.position.set(target.x + Math.sin(yaw) * cp * dist, sp * dist, target.z + Math.cos(yaw) * cp * dist);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    applyWalls();
  }

  // ---- walls ----
  function applyWalls(): void {
    let dirX = 0;
    let dirZ = 0;
    if (wallsMode === 'cut') {
      const cx = camera.position.x - target.x;
      const cz = camera.position.z - target.z;
      const len = Math.hypot(cx, cz);
      if (len > 0) {
        dirX = cx / len;
        dirZ = cz / len;
      }
    }
    for (const w of walls) {
      let r = 1;
      if (wallsMode === 'down') r = LOW_RATIO;
      else if (wallsMode === 'cut' && (w.mx - target.x) * dirX + (w.mz - target.z) * dirZ > 0.5) r = LOW_RATIO;
      if (w.ratio !== r) {
        w.g.scale.y = r;
        w.ratio = r;
      }
    }
  }

  /** Adds one box whose base sits at y0, offset `off` along the edge's axis from its centre. */
  function addPart(g: THREE.Group, axis: 'h' | 'v', cx: number, cz: number, off: number, len: number, y0: number, h: number, mat: THREE.Material, thick = WALL_THICK): void {
    const m = new THREE.Mesh(BOX, mat);
    const horiz = axis === 'h';
    m.position.set(horiz ? cx + off : cx, y0, horiz ? cz : cz + off);
    m.scale.set(horiz ? len : thick, h, horiz ? thick : len);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }

  function buildEdge(key: EdgeKey, kind: EdgeKind): WallRec {
    const { axis, x, y } = parseEdge(key);
    const horiz = axis === 'h';
    const cx = horiz ? x + 0.5 : x;
    const cz = horiz ? y : y + 0.5;
    const g = new THREE.Group();
    const full = 1 + WALL_THICK;
    if (kind === 'wall') {
      addPart(g, axis, cx, cz, 0, full, 0, WALL_HEIGHT, wallMat);
    } else if (kind === 'door') {
      // Opening 0.8 wide, 1.3 high.
      addPart(g, axis, cx, cz, -0.45, 0.1, 0, WALL_HEIGHT, trimMat);
      addPart(g, axis, cx, cz, 0.45, 0.1, 0, WALL_HEIGHT, trimMat);
      addPart(g, axis, cx, cz, 0, 1, 1.3, WALL_HEIGHT - 1.3, trimMat);
    } else {
      // Window: sill, pane (see-through) and lintel.
      addPart(g, axis, cx, cz, 0, 1, 0, 0.8, sillMat);
      addPart(g, axis, cx, cz, 0, 1, 0.8, 0.7, paneMat, WALL_THICK * 0.4);
      addPart(g, axis, cx, cz, 0, 1, 1.5, WALL_HEIGHT - 1.5, sillMat);
    }
    return { g, mx: cx, mz: cz, ratio: 1 };
  }

  // ---- lot ----
  function disposeChild(c: THREE.Object3D): void {
    const im = c as THREE.InstancedMesh;
    if (im.isInstancedMesh) im.dispose();
    const ls = c as THREE.LineSegments;
    if (ls.isLineSegments) ls.geometry.dispose();
  }

  function buildGrid(w: number, h: number): void {
    const pts: number[] = [];
    const y = 0.02;
    for (let i = 0; i <= w; i++) pts.push(i, y, 0, i, y, h);
    for (let j = 0; j <= h; j++) pts.push(0, y, j, w, y, j);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    lotGroup.add(new THREE.LineSegments(geo, gridMat));
  }

  function buildFloors(lot: Lot): void {
    const byKind = new Map<FloorKind, Tile[]>();
    for (const [key, kind] of Object.entries(lot.floors)) {
      const [tx, ty] = key.split(',').map(Number);
      const list = byKind.get(kind) ?? [];
      list.push({ tx, ty });
      byKind.set(kind, list);
    }
    const m4 = new THREE.Matrix4();
    for (const kind of FLOORS) {
      const tiles = byKind.get(kind);
      if (!tiles || tiles.length === 0) continue;
      const im = new THREE.InstancedMesh(floorGeo, floorMat[kind], tiles.length);
      tiles.forEach((t, i) => {
        m4.makeTranslation(t.tx + 0.5, 0.01, t.ty + 0.5);
        im.setMatrixAt(i, m4);
      });
      im.instanceMatrix.needsUpdate = true;
      im.receiveShadow = true;
      lotGroup.add(im);
    }
  }

  function buildItem(item: PlacedItem): void {
    const def = FURNITURE[item.kind];
    if (!def) return;
    const obj = buildPrefab(def.prefab, { tint: def.tint, lights: false });
    const c = itemCenter(item);
    obj.position.set(c.x, 0, c.z);
    obj.rotation.y = facingYaw(item.rot);
    obj.userData.itemId = item.id;
    obj.traverse((o) => {
      o.userData.itemId = item.id;
      o.castShadow = true;
      o.receiveShadow = true;
    });
    itemsGroup.add(obj);
  }

  function refreshSelection(): void {
    const item = selectedId === null || !curLot ? undefined : curLot.items.find((i) => i.id === selectedId);
    if (!item) {
      selOutline.visible = false;
      return;
    }
    const def = FURNITURE[item.kind];
    const size = def ? itemSize(def, item.rot) : { w: 1, d: 1 };
    const c = itemCenter(item);
    selOutline.position.set(c.x, 0.03, c.z);
    selOutline.scale.set(size.w + 0.04, 1, size.d + 0.04);
    selOutline.visible = true;
  }

  const gnomeMine = getMyGnome();
  const model: GnomeModel = gnomeMine ? createGnomeModel(gnomeMine.look) : createGnome();

  // Ghost pool and picking state (declared before the view object so nothing is used before it is set).
  const ghostPool: THREE.Mesh[] = [];
  let ghostItem: THREE.Group | null = null;
  let ghostItemKey = '';
  const ghostPlate = new THREE.Mesh(BOX, ghostPlateMats.ok);
  ghostPlate.visible = false;
  ghostRoot.add(ghostPlate);

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPoint = new THREE.Vector3();

  const view: View = {
    setLot(lot: Lot, home = true): void {
      curLot = lot;
      lotW = lot.w;
      lotH = lot.h;
      for (const c of [...lotGroup.children]) {
        disposeChild(c);
        lotGroup.remove(c);
      }
      for (const c of [...itemsGroup.children]) itemsGroup.remove(c);
      walls = [];

      buildGrid(lot.w, lot.h);
      buildFloors(lot);
      for (const [key, kind] of Object.entries(lot.edges)) {
        const rec = buildEdge(key, kind);
        walls.push(rec);
        lotGroup.add(rec.g);
      }
      const stop = home ? carpoolTile(lot) : townGate();
      const plate = new THREE.Mesh(BOX, carpoolMat);
      plate.position.set(stop.tx + 0.5, 0.02, stop.ty + 0.5);
      plate.scale.set(0.9, 0.02, 0.9);
      plate.receiveShadow = true;
      lotGroup.add(plate);
      if (home) {
        const mailbox = buildPrefab('mailbox', { lights: false });
        mailbox.position.set(stop.tx + 0.5, 0.02, stop.ty + 0.5);
        mailbox.traverse((o) => {
          o.castShadow = true;
          o.receiveShadow = true;
        });
        lotGroup.add(mailbox);
      }

      for (const item of lot.items) buildItem(item);
      target.x = clampNum(target.x, -4, lot.w + 4);
      target.z = clampNum(target.z, -4, lot.h + 4);
      refreshSelection();
      applyWalls();
    },

    setWalls(mode: WallsMode): void {
      wallsMode = mode;
      applyWalls();
    },

    setDaylight(minuteOfDay: number): void {
      const m = ((minuteOfDay % 1440) + 1440) % 1440;
      const day = m >= 360 && m <= 1200;
      const f = day ? (m - 360) / 840 : 0.5;
      const a = Math.PI * f;
      const sunUp = day ? Math.sin(a) : 0;
      // nightness: 1 at night, eased across the hours either side of dawn and dusk.
      let night = 0;
      if (m < 360) night = 1;
      else if (m < 420) night = (420 - m) / 60;
      else if (m > 1200) night = 1;
      else if (m > 1140) night = (m - 1140) / 60;
      const w = 1 - night;
      const warm = day ? Math.max(0, 1 - sunUp * 1.4) : 0;

      sky.copy(SKY_DAY).lerp(SKY_WARM, warm * 0.8 * w).lerp(SKY_NIGHT, night);
      if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(sky);
      const sunCol = new THREE.Color().copy(SUN_WHITE).lerp(SUN_WARM, warm);
      sun.color.copy(sunCol).lerp(SUN_MOON, night);
      sun.intensity = 0.12 + (0.4 + sunUp * 1.0 - 0.12) * w;
      hemi.intensity = 0.3 + 0.3 * w + 0.1 * sunUp * w;
      hemi.color.set(0xdff3ff).lerp(SUN_MOON, night * 0.7);
      sun.position.set(LOT_W / 2 - Math.cos(a) * 40, Math.max(6, Math.sin(a) * 40), LOT_H / 2 + 15);
      sun.target.position.set(lotW / 2, 0, lotH / 2);
      sun.target.updateMatrixWorld();
    },

    setGhost(g: Ghost | null): void {
      for (const c of ghostRoot.children) c.visible = false;
      if (!g) return;
      if (g.type === 'edges') {
        g.keys.forEach((key, i) => {
          const m = ghostMesh(i);
          const { axis, x, y } = parseEdge(key);
          const horiz = axis === 'h';
          m.position.set(horiz ? x + 0.5 : x, 0, horiz ? y : y + 0.5);
          m.scale.set(horiz ? 1 + WALL_THICK : WALL_THICK * 2, WALL_HEIGHT, horiz ? WALL_THICK * 2 : 1 + WALL_THICK);
          m.material = ghostEdgeMat(g.kind, g.valid);
        });
      } else if (g.type === 'tiles') {
        g.tiles.forEach((t, i) => {
          const m = ghostMesh(i);
          m.position.set(t.tx + 0.5, 0.02, t.ty + 0.5);
          m.scale.set(1, 0.03, 1);
          m.material = g.valid ? ghostPlateMats.ok : ghostPlateMats.bad;
        });
      } else {
        const def = FURNITURE[g.kind];
        if (!def) return;
        const key = `${g.kind}:${g.rot}`;
        if (ghostItemKey !== key) {
          if (ghostItem) ghostRoot.remove(ghostItem);
          ghostItem = buildPrefab(def.prefab, { tint: def.tint, lights: false });
          ghostRoot.add(ghostItem);
          ghostItemKey = key;
        }
        const size = itemSize(def, g.rot);
        const c = itemCenter({ id: 0, kind: g.kind, tx: g.tx, ty: g.ty, rot: g.rot });
        ghostItem!.visible = true;
        ghostItem!.position.set(c.x, 0, c.z);
        ghostItem!.rotation.y = facingYaw(g.rot);
        ghostPlate.visible = true;
        ghostPlate.position.set(g.tx + size.w / 2, 0.02, g.ty + size.d / 2);
        ghostPlate.scale.set(size.w, 0.03, size.d);
        ghostPlate.material = g.valid ? ghostPlateMats.ok : ghostPlateMats.bad;
      }
    },

    setSelected(id: number | null): void {
      selectedId = id;
      refreshSelection();
    },

    pickTile(clientX: number, clientY: number): Tile | null {
      const g = view.pickGround(clientX, clientY);
      if (!g) return null;
      const tx = Math.floor(g.x);
      const ty = Math.floor(g.z);
      if (tx < 0 || ty < 0 || tx >= lotW || ty >= lotH) return null;
      return { tx, ty };
    },

    pickGround(clientX: number, clientY: number): { x: number; z: number } | null {
      setRay(clientX, clientY);
      const hit = ray.ray.intersectPlane(groundPlane, hitPoint);
      return hit ? { x: hit.x, z: hit.z } : null;
    },

    pickVertex(clientX: number, clientY: number): Vertex | null {
      const g = view.pickGround(clientX, clientY);
      if (!g) return null;
      const outX = Math.max(-g.x, g.x - lotW);
      const outZ = Math.max(-g.z, g.z - lotH);
      if (Math.max(outX, outZ) > 1) return null;
      return {
        vx: clampNum(Math.round(g.x), 0, lotW),
        vy: clampNum(Math.round(g.z), 0, lotH),
      };
    },

    pickItem(clientX: number, clientY: number): number | null {
      setRay(clientX, clientY);
      const hits = ray.intersectObject(itemsGroup, true);
      if (hits.length === 0) return null;
      let o: THREE.Object3D | null = hits[0].object;
      while (o) {
        if (o.userData.itemId !== undefined) return o.userData.itemId as number;
        o = o.parent;
      }
      return null;
    },

    pan(dxPx: number, dyPx: number): void {
      const k = (2 * dist * Math.tan((camera.fov * Math.PI) / 360)) / Math.max(1, canvas.clientHeight);
      const fx = -Math.sin(yaw);
      const fz = -Math.cos(yaw);
      const rx = Math.cos(yaw);
      const rz = -Math.sin(yaw);
      target.x += -dxPx * k * rx + (dyPx * k) / Math.sin(PITCH) * fx;
      target.z += -dxPx * k * rz + (dyPx * k) / Math.sin(PITCH) * fz;
      target.x = clampNum(target.x, -4, lotW + 4);
      target.z = clampNum(target.z, -4, lotH + 4);
      updateCamera();
    },

    zoom(factor: number): void {
      dist = clampNum(dist * factor, DIST_MIN, DIST_MAX);
      updateCamera();
    },

    orbit(dYaw: number): void {
      yaw += dYaw;
      updateCamera();
    },

    resize(): void {
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Portrait phones: widen the vertical FOV so the lot still fits the narrow width.
      camera.fov = camera.aspect < 1 ? CAM_FOV + Math.min(30, (1 / camera.aspect - 1) * 25) : CAM_FOV;
      camera.updateProjectionMatrix();
      updateCamera();
    },

    render(_dt: number): void {
      updateCamera();
      renderer.render(scene, camera);
    },

    addNeighbour(look: PersonLook): GnomePuppet {
      const m = createGnomeModel(
        toModelLook({
          ...DEFAULT_LOOK,
          hatRgb: look.hat,
          coatRgb: look.coat,
          pantsRgb: look.pants,
          bootsRgb: look.boots,
          skinRgb: look.skin,
          beardRgb: look.beard,
          glasses: look.glasses ?? false,
        }),
      );
      return makePuppet(m);
    },

    gnome: makePuppet(model),
  };
  return view;

  // ---- picking helpers (closures over the renderer's camera) ----
  function setRay(clientX: number, clientY: number): void {
    const r = canvas.getBoundingClientRect();
    const w = r.width || 1;
    const h = r.height || 1;
    ndc.set(((clientX - r.left) / w) * 2 - 1, -((clientY - r.top) / h) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  }

  // ---- ghost pools ----
  function ghostEdgeMat(kind: EdgeKind | 'erase', valid: boolean): THREE.MeshBasicMaterial {
    const k = `${kind}|${valid}`;
    let m = ghostEdgeMats.get(k);
    if (!m) {
      const color = !valid ? BAD_COLOR : kind === 'erase' ? ERASE_COLOR : EDGE_KIND_COLOR[kind];
      m = ghostMat(color, 0.55);
      ghostEdgeMats.set(k, m);
    }
    return m;
  }

  function ghostMesh(i: number): THREE.Mesh {
    let m = ghostPool[i];
    if (!m) {
      m = new THREE.Mesh(BOX, ghostPlateMats.ok);
      ghostPool[i] = m;
      ghostRoot.add(m);
    }
    m.visible = true;
    return m;
  }

  function makePuppet(model: GnomeModel): GnomePuppet {
    const root = new THREE.Group();
    const holder = new THREE.Group();
    holder.add(model.object);
    root.add(holder);
    const bubbles = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 18).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    bubbles.position.y = 0.42;
    bubbles.visible = false;
    root.add(bubbles);
    scene.add(root);
    model.object.traverse((o) => {
      o.castShadow = true;
    });

    const ps: PlayerState = {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      facing: 0,
      grounded: true,
      jumpsUsed: 0,
    };
    let pose: Pose = 'stand';
    let t = 0;

    const applyPose = (): void => {
      holder.rotation.x = pose === 'lie' ? -Math.PI / 2 : 0;
      holder.position.y = pose === 'lie' ? 0.45 : pose === 'bathe' ? -0.4 : 0;
      bubbles.visible = pose === 'bathe';
    };

    return {
      setPosition(x: number, z: number, y = 0): void {
        root.position.set(x, y, z);
      },
      setFacing(yaw: number): void {
        root.rotation.y = yaw;
      },
      setPose(p: Pose): void {
        pose = p;
        applyPose();
      },
      setVisible(v: boolean): void {
        root.visible = v;
      },
      update(dt: number): void {
        t += dt;
        // The model reads only the velocity and the sitting flag; its own position and facing stay at zero (the root carries them).
        ps.velocity.set(0, 0, pose === 'walk' ? TUNING.moveSpeed : 0);
        ps.sitting = pose === 'sit' || pose === 'bathe';
        model.update(ps, dt);
        if (pose === 'cook') {
          model.arms.left.rotation.x = -0.9 + Math.sin(t * 1.6) * 0.25;
          model.arms.right.rotation.x = -0.9 - Math.sin(t * 1.6) * 0.25;
        }
      },
    };
  }
}

function clampNum(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
