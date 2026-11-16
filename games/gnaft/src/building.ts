// Build mode: aim at the water beside the raft (turf, seeded), a tile (props) or a cell / edge (shed pieces), click to place.
// Right click removes a shed piece or a prop. Also draws every prop in state.props and every shed piece, in every mode.
import * as THREE from 'three';
import {
  BUILD_COSTS, BUILD_ORDER, KEYS, RAFT_TOP, SHED, SPRINKLER, TILE_SIZE,
  type BuildKind, type BuildPlace, type Ctx, type Mode, type Prop, type Structure, type System,
} from './config';
import { canBuild, canPlace, cellAt, ceilingAt, costText, deconstruct, hasItems, notify, placeTile, tileKey, wallCentre } from './rules';
import { sfx } from './audio';

/** Max distance (xz, metres) from the player to the aimed point. */
const REACH = 14;
const NEIGHBOURS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const GHOST_OK = 0x66ff66;
const GHOST_NO = 0xff5555;

// ---------------------------------------------------------------- shared prop assets

const METAL = new THREE.MeshStandardMaterial({ color: 0x8a9399, metalness: 0.6, roughness: 0.4 });
const SPRAY_MAT = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.6, depthWrite: false });
const REACH_MAT = new THREE.MeshBasicMaterial({ color: 0x4fb3ff, transparent: true, opacity: 0.08, depthWrite: false });
const PINK = new THREE.MeshStandardMaterial({ color: 0xff6fae, roughness: 0.6 });
const DARK_PINK = new THREE.MeshStandardMaterial({ color: 0xc2185b, roughness: 0.6 });
const BLACK = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });

const BASE_GEO = new THREE.CylinderGeometry(0.4, 0.45, 0.1, 14);
const PIPE_GEO = new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8);
const HUB_GEO = new THREE.CylinderGeometry(0.1, 0.1, 0.12, 8);
const ARM_GEO = new THREE.BoxGeometry(0.7, 0.04, 0.06);
const SPRAY_GEO = new THREE.SphereGeometry(0.06, 6, 5);
const REACH_GEO = new THREE.CircleGeometry(SPRINKLER.radius, 32);
REACH_GEO.rotateX(-Math.PI / 2);

const BODY_GEO = new THREE.SphereGeometry(0.16, 12, 10);
const NECK_GEO = new THREE.CylinderGeometry(0.035, 0.04, 0.2, 6);
const HEAD_GEO = new THREE.SphereGeometry(0.065, 10, 8);
const BEAK_GEO = new THREE.ConeGeometry(0.04, 0.14, 6);
const BEAK_TIP_GEO = new THREE.ConeGeometry(0.04, 0.05, 6);
const LEG_GEO = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 5);

// Rubber duck (about 0.5 m tall).
const DUCK_YELLOW = new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.5 });
const DUCK_ORANGE = new THREE.MeshStandardMaterial({ color: 0xff8c1a, roughness: 0.6 });
const DUCK_BODY_GEO = new THREE.SphereGeometry(0.2, 14, 10);
const DUCK_HEAD_GEO = new THREE.SphereGeometry(0.12, 12, 9);
const DUCK_BEAK_GEO = new THREE.ConeGeometry(0.05, 0.1, 8);
const EYE_GEO = new THREE.SphereGeometry(0.02, 6, 5);

// Garden gnome statue (about 0.7 m tall).
const GNOME_BLUE = new THREE.MeshStandardMaterial({ color: 0x2f6fd0, roughness: 0.7 });
const GNOME_BOOT = new THREE.MeshStandardMaterial({ color: 0x5a3a1e, roughness: 0.8 });
const GNOME_SKIN = new THREE.MeshStandardMaterial({ color: 0xf2c49b, roughness: 0.6 });
const GNOME_BEARD = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
const GNOME_RED = new THREE.MeshStandardMaterial({ color: 0xd21f1f, roughness: 0.6 });
const STATUE_BODY_GEO = new THREE.CylinderGeometry(0.13, 0.15, 0.32, 12);
const STATUE_BOOT_GEO = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8);
const STATUE_FACE_GEO = new THREE.SphereGeometry(0.1, 12, 9);
const STATUE_BEARD_GEO = new THREE.ConeGeometry(0.1, 0.18, 10);
const STATUE_HAT_GEO = new THREE.ConeGeometry(0.12, 0.2, 12);

// Shed planks. Floors and walls share these; roofs get their own instances per system (for the fade).
const BOARD_COLOURS = [0xb07a45, 0xa06a38, 0xc08a55];
const BOARD_GAP = 0.03;
const SPAN = TILE_SIZE / 4;
interface ShedMats { boards: THREE.MeshStandardMaterial[]; gap: THREE.MeshStandardMaterial; post: THREE.MeshStandardMaterial }
const PLANK: ShedMats = {
  boards: BOARD_COLOURS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 })),
  gap: new THREE.MeshStandardMaterial({ color: 0x2a1a0d, roughness: 1 }),
  post: new THREE.MeshStandardMaterial({ color: 0x6b4424, roughness: 0.8 }),
};
const FLOOR_BOARD_GEO = new THREE.BoxGeometry(SPAN - BOARD_GAP, SHED.FLOOR_THICK, TILE_SIZE);
const FLOOR_BACK_GEO = new THREE.BoxGeometry(TILE_SIZE, SHED.FLOOR_THICK * 0.9, TILE_SIZE);
const ROOF_BOARD_GEO = new THREE.BoxGeometry(SPAN - BOARD_GAP, SHED.ROOF_THICK, TILE_SIZE);
const ROOF_BACK_GEO = new THREE.BoxGeometry(TILE_SIZE, SHED.ROOF_THICK * 0.9, TILE_SIZE);
const WALL_BOARD_GEO = new THREE.BoxGeometry(SHED.WALL_THICK, SHED.WALL_HEIGHT / 4 - BOARD_GAP, TILE_SIZE);
const WALL_BACK_GEO = new THREE.BoxGeometry(SHED.WALL_THICK * 0.6, SHED.WALL_HEIGHT - BOARD_GAP, TILE_SIZE);
const POST_GEO = new THREE.BoxGeometry(SHED.WALL_THICK * 1.3, SHED.WALL_HEIGHT, SHED.WALL_THICK * 1.3);

/** One rendered prop: its object, and a per-frame hook. */
interface PropView {
  obj: THREE.Object3D;
  animate(dt: number, mode: Mode): void;
}

/** Target of a build click: a cell, or for walls the edge (dir 'x' = +x edge of cell (i, j), 'z' = +z edge). */
interface Target { i: number; j: number; dir: 'x' | 'z' }

function part(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, cast = true): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  return m;
}

function shedPart(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = part(geo, mat, x, y, z);
  m.receiveShadow = true;
  return m;
}

/** Deterministic yaw from the cell, in 8 steps. */
function yawFor(p: Prop): number {
  return ((((p.i * 7 + p.j * 13) % 8) + 8) % 8) * Math.PI / 4;
}

function makeSprinkler(p: Prop): PropView {
  const obj = new THREE.Group();
  obj.position.set(p.i * TILE_SIZE, RAFT_TOP, p.j * TILE_SIZE);

  const head = new THREE.Group();
  head.position.y = 0.55;
  const arm1 = part(ARM_GEO, METAL, 0, 0.03, 0);
  const arm2 = part(ARM_GEO, METAL, 0, 0.03, 0);
  arm2.rotation.y = Math.PI / 2;
  head.add(part(HUB_GEO, METAL, 0, 0, 0), arm1, arm2);

  const spray = new THREE.Group();
  const drops: THREE.Mesh[] = [];
  for (let k = 0; k < 16; k++) {
    const d = part(SPRAY_GEO, SPRAY_MAT, 0, 0.6, 0, false);
    spray.add(d);
    drops.push(d);
  }

  const reach = new THREE.Mesh(REACH_GEO, REACH_MAT);
  reach.position.y = 0.03;
  reach.visible = false;

  obj.add(
    part(BASE_GEO, METAL, 0, 0.05, 0),
    part(PIPE_GEO, METAL, 0, 0.325, 0),
    head,
    spray,
    reach,
  );

  let t = 0;
  return {
    obj,
    animate(dt: number, mode: Mode) {
      t += dt;
      head.rotation.y += 6 * dt;
      reach.visible = mode === 'build';
      spray.visible = mode !== 'title';
      if (!spray.visible) return;
      drops.forEach((d, k) => {
        const ph = (t / 1.2 + k / 16) % 1;
        const a = (k / 16) * Math.PI * 2;
        const r = SPRINKLER.radius * ph;
        d.position.set(Math.cos(a) * r, 0.6 + 0.9 * 4 * ph * (1 - ph) - 0.5 * ph, Math.sin(a) * r);
      });
    },
  };
}

function makeFlamingo(p: Prop): PropView {
  const obj = new THREE.Group();
  obj.position.set(p.i * TILE_SIZE, RAFT_TOP, p.j * TILE_SIZE);
  obj.rotation.y = yawFor(p);

  const body = part(BODY_GEO, PINK, 0, 0.5, 0);
  body.scale.set(1, 0.75, 1.5);
  const neck1 = part(NECK_GEO, PINK, 0, 0.6, 0.1);
  neck1.rotation.x = -0.4;
  const neck2 = part(NECK_GEO, PINK, 0, 0.74, 0.16);
  neck2.rotation.x = 0.3;
  const neck3 = part(NECK_GEO, PINK, 0, 0.86, 0.13);
  neck3.rotation.x = -0.3;
  const head = part(HEAD_GEO, PINK, 0, 0.92, 0.14);
  const beak = part(BEAK_GEO, PINK, 0, 0.9, 0.24);
  beak.rotation.x = Math.PI / 2 + 0.25;
  const tip = part(BEAK_TIP_GEO, BLACK, 0, 0.885, 0.285);
  tip.rotation.x = Math.PI / 2 + 0.25;
  const legA = part(LEG_GEO, DARK_PINK, -0.05, 0.175, 0);
  const legB = part(LEG_GEO, DARK_PINK, 0.05, 0.175, 0);

  obj.add(body, neck1, neck2, neck3, head, beak, tip, legA, legB);
  return { obj, animate: () => {} };
}

function makeDuck(p: Prop): PropView {
  const obj = new THREE.Group();
  obj.position.set(p.i * TILE_SIZE, RAFT_TOP, p.j * TILE_SIZE);
  obj.rotation.y = yawFor(p);

  // The bob group moves; the root stays on the tile.
  const bob = new THREE.Group();
  const body = part(DUCK_BODY_GEO, DUCK_YELLOW, 0, 0.2, 0);
  body.scale.set(1, 0.7, 1);
  const head = part(DUCK_HEAD_GEO, DUCK_YELLOW, 0, 0.42, 0.04);
  const beak = part(DUCK_BEAK_GEO, DUCK_ORANGE, 0, 0.4, 0.17);
  beak.rotation.x = Math.PI / 2;
  const eyeA = part(EYE_GEO, BLACK, -0.05, 0.46, 0.12, false);
  const eyeB = part(EYE_GEO, BLACK, 0.05, 0.46, 0.12, false);
  bob.add(body, head, beak, eyeA, eyeB);
  obj.add(bob);

  let t = 0;
  return {
    obj,
    animate(dt: number) {
      t += dt;
      bob.position.y = Math.sin(t * 2.2) * 0.03;
      bob.rotation.z = Math.sin(t * 1.6) * 0.05;
    },
  };
}

function makeStatue(p: Prop): PropView {
  const obj = new THREE.Group();
  obj.position.set(p.i * TILE_SIZE, RAFT_TOP, p.j * TILE_SIZE);
  obj.rotation.y = yawFor(p);

  const beard = part(STATUE_BEARD_GEO, GNOME_BEARD, 0, 0.42, 0.07);
  beard.rotation.x = Math.PI; // point down over the face
  obj.add(
    part(STATUE_BODY_GEO, GNOME_BLUE, 0, 0.2, 0),
    part(STATUE_BOOT_GEO, GNOME_BOOT, -0.06, 0.04, 0.02),
    part(STATUE_BOOT_GEO, GNOME_BOOT, 0.06, 0.04, 0.02),
    part(STATUE_FACE_GEO, GNOME_SKIN, 0, 0.46, 0.02),
    beard,
    part(STATUE_HAT_GEO, GNOME_RED, 0, 0.62, 0),
  );
  return { obj, animate: () => {} };
}

function makeProp(p: Prop): PropView {
  const v = p.kind === 'sprinkler' ? makeSprinkler(p)
    : p.kind === 'flamingo' ? makeFlamingo(p)
      : p.kind === 'duck' ? makeDuck(p)
        : makeStatue(p);
  v.obj.userData.piece = p;
  return v;
}

// ---------------------------------------------------------------- shed pieces

/** Board colour for board k of a piece, varied per piece and per board. */
function plankMat(mats: ShedMats, seed: number, k: number): THREE.MeshStandardMaterial {
  const n = mats.boards.length;
  return mats.boards[(((seed + k) % n) + n) % n];
}

/** A floor or roof: 4 boards across the cell over a dark backing that shows through the gaps. */
function makeSlab(s: Structure, baseY: number, boardGeo: THREE.BufferGeometry, backGeo: THREE.BufferGeometry, mats: ShedMats, thick: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(s.i * TILE_SIZE, baseY, s.j * TILE_SIZE);
  g.add(shedPart(backGeo, mats.gap, 0, thick * 0.45, 0));
  const seed = s.i * 5 + s.j * 3;
  for (let k = 0; k < 4; k++) {
    g.add(shedPart(boardGeo, plankMat(mats, seed, k), -TILE_SIZE * 3 / 8 + k * SPAN, thick / 2, 0));
  }
  return g;
}

/** A wall: 4 boards stacked to WALL_HEIGHT, built along z and turned for dir 'z', with a post at each end. */
function makeWall(s: Structure): THREE.Group {
  const dir = s.dir ?? 'x';
  const g = new THREE.Group();
  const c = wallCentre(s.i, s.j, dir);
  g.position.set(c.x, RAFT_TOP, c.z);
  if (dir === 'z') g.rotation.y = Math.PI / 2;

  const h = SHED.WALL_HEIGHT / 4;
  const seed = s.i * 5 + s.j * 3 + (dir === 'z' ? 1 : 0);
  g.add(shedPart(WALL_BACK_GEO, PLANK.gap, 0, SHED.WALL_HEIGHT / 2, 0));
  for (let k = 0; k < 4; k++) {
    g.add(shedPart(WALL_BOARD_GEO, plankMat(PLANK, seed, k), 0, (k + 0.5) * h, 0));
  }
  g.add(
    shedPart(POST_GEO, PLANK.post, 0, SHED.WALL_HEIGHT / 2, TILE_SIZE / 2),
    shedPart(POST_GEO, PLANK.post, 0, SHED.WALL_HEIGHT / 2, -TILE_SIZE / 2),
  );
  return g;
}

function makeStructure(s: Structure, roof: ShedMats): THREE.Group {
  let g: THREE.Group;
  if (s.kind === 'floor') g = makeSlab(s, RAFT_TOP, FLOOR_BOARD_GEO, FLOOR_BACK_GEO, PLANK, SHED.FLOOR_THICK);
  else if (s.kind === 'ceiling') g = makeSlab(s, RAFT_TOP + SHED.WALL_HEIGHT, ROOF_BOARD_GEO, ROOF_BACK_GEO, roof, SHED.ROOF_THICK);
  else g = makeWall(s);
  g.userData.piece = s;
  return g;
}

// ---------------------------------------------------------------- system

function isShown(o: THREE.Object3D | null): boolean {
  for (let c = o; c; c = c.parent) if (!c.visible) return false;
  return true;
}

export function createBuilding(ctx: Ctx): System {
  const { scene, camera, state, input } = ctx;

  const raycaster = new THREE.Raycaster();
  const centre = new THREE.Vector2(0, 0);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -RAFT_TOP);
  const hit = new THREE.Vector3();
  let time = 0;

  // Roof materials: their own instances, so the fade over the gnome does not touch floors and walls.
  const roofMats: ShedMats = {
    boards: BOARD_COLOURS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, transparent: true })),
    gap: new THREE.MeshStandardMaterial({ color: 0x2a1a0d, roughness: 1, transparent: true }),
    post: PLANK.post,
  };

  // Tile ghost: translucent box on the water cell that would be placed.
  const tileGhostMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.45, depthWrite: false });
  const tileGhost = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE * 0.98, 0.35, TILE_SIZE * 0.98), tileGhostMat);
  tileGhost.visible = false;
  scene.add(tileGhost);

  // Prop ghost: translucent cylinder standing on the tile that would get the prop.
  const propGhostMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.45, depthWrite: false });
  const propGhost = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12), propGhostMat);
  propGhost.visible = false;
  scene.add(propGhost);

  // Shed ghosts: floor, wall and roof boxes.
  const shedGhostMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.45, depthWrite: false });
  const shedGhost = (geo: THREE.BufferGeometry): THREE.Mesh => {
    const m = new THREE.Mesh(geo, shedGhostMat);
    m.visible = false;
    scene.add(m);
    return m;
  };
  const floorGhost = shedGhost(new THREE.BoxGeometry(TILE_SIZE, SHED.FLOOR_THICK, TILE_SIZE));
  const wallGhost = shedGhost(new THREE.BoxGeometry(SHED.WALL_THICK, SHED.WALL_HEIGHT, TILE_SIZE));
  const roofGhost = shedGhost(new THREE.BoxGeometry(TILE_SIZE, SHED.ROOF_THICK, TILE_SIZE));
  const allGhosts = [tileGhost, propGhost, floorGhost, wallGhost, roofGhost];

  // Edge hints: faint flat squares on every cell that can take a water tile.
  const hintGeo = new THREE.PlaneGeometry(TILE_SIZE * 0.98, TILE_SIZE * 0.98);
  hintGeo.rotateX(-Math.PI / 2);
  const hintMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, depthWrite: false });
  const hints = new THREE.Group();
  hints.visible = false;
  scene.add(hints);
  let hintsSize = -1;

  function rebuildHints(): void {
    hints.clear();
    const seen = new Set<string>();
    for (const t of state.tiles.values()) {
      for (const [di, dj] of NEIGHBOURS) {
        const i = t.i + di;
        const j = t.j + dj;
        const key = tileKey(i, j);
        if (seen.has(key)) continue;
        seen.add(key);
        if (!canPlace(state, i, j)) continue;
        const m = new THREE.Mesh(hintGeo, hintMat);
        m.position.set(i * TILE_SIZE, RAFT_TOP + 0.02, j * TILE_SIZE);
        hints.add(m);
      }
    }
    hintsSize = state.tiles.size;
  }

  function hideGhosts(): void {
    for (const g of allGhosts) g.visible = false;
  }

  /**
   * Target the player is aiming at, or null. The ray goes from the screen centre to the raft plane.
   * - water: the aimed empty cell, else a forgiving neighbour
   * - tile, floor, ceiling: the aimed cell itself
   * - edge: the edge of the aimed cell nearest the hit point
   */
  function findTarget(kind: BuildKind): Target | null {
    raycaster.setFromCamera(centre, camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return null;
    const p = state.player.position;
    if (Math.hypot(hit.x - p.x, hit.z - p.z) > REACH) return null;
    const c = cellAt(hit.x, hit.z);
    switch (BUILD_COSTS[kind].on) {
      case 'tile':
      case 'floor':
      case 'ceiling':
        return canBuild(state, c.i, c.j, kind) ? { i: c.i, j: c.j, dir: 'x' } : null;
      case 'edge': {
        const fx = hit.x / TILE_SIZE - c.i;
        const fz = hit.z / TILE_SIZE - c.j;
        let t: Target;
        if (Math.abs(fx) >= Math.abs(fz)) t = fx > 0 ? { i: c.i, j: c.j, dir: 'x' } : { i: c.i - 1, j: c.j, dir: 'x' };
        else t = fz > 0 ? { i: c.i, j: c.j, dir: 'z' } : { i: c.i, j: c.j - 1, dir: 'z' };
        return canBuild(state, t.i, t.j, kind, t.dir) ? t : null;
      }
      case 'water': {
        if (canBuild(state, c.i, c.j, kind)) return { i: c.i, j: c.j, dir: 'x' };
        let best: Target | null = null;
        let bestD = Infinity;
        for (const [di, dj] of NEIGHBOURS) {
          const i = c.i + di;
          const j = c.j + dj;
          if (!canBuild(state, i, j, kind)) continue;
          const d = Math.hypot(hit.x - i * TILE_SIZE, hit.z - j * TILE_SIZE);
          if (d < bestD) {
            bestD = d;
            best = { i, j, dir: 'x' };
          }
        }
        return best;
      }
    }
  }

  /** Shows the ghost for `place` at target t, green if affordable, red if not. */
  function showGhost(place: BuildPlace, t: Target, kind: BuildKind): void {
    const x = t.i * TILE_SIZE;
    const z = t.j * TILE_SIZE;
    let mesh: THREE.Mesh = tileGhost;
    let mat: THREE.MeshStandardMaterial = tileGhostMat;
    switch (place) {
      case 'water':
        mesh = tileGhost; mat = tileGhostMat;
        mesh.position.set(x, RAFT_TOP - 0.15, z);
        break;
      case 'tile':
        mesh = propGhost; mat = propGhostMat;
        mesh.position.set(x, RAFT_TOP + 0.4, z);
        break;
      case 'floor':
        mesh = floorGhost; mat = shedGhostMat;
        mesh.position.set(x, RAFT_TOP + SHED.FLOOR_THICK / 2, z);
        break;
      case 'ceiling':
        mesh = roofGhost; mat = shedGhostMat;
        mesh.position.set(x, RAFT_TOP + SHED.WALL_HEIGHT + SHED.ROOF_THICK / 2, z);
        break;
      case 'edge': {
        const c = wallCentre(t.i, t.j, t.dir);
        mesh = wallGhost; mat = shedGhostMat;
        mesh.position.set(c.x, RAFT_TOP + SHED.WALL_HEIGHT / 2, c.z);
        mesh.rotation.y = t.dir === 'z' ? Math.PI / 2 : 0;
        break;
      }
    }
    mesh.visible = true;
    mat.color.setHex(hasItems(state, BUILD_COSTS[kind].cost) ? GHOST_OK : GHOST_NO);
    mat.opacity = 0.45 + 0.1 * Math.sin(time * 5);
  }

  // Rendered props, keyed `${kind}:${i},${j}`.
  const views = new Map<string, PropView>();
  // Rendered shed pieces, keyed `${kind}:${i},${j},${dir}`.
  const shedViews = new Map<string, THREE.Group>();

  function syncProps(dt: number): void {
    const live = new Set<string>();
    for (const p of state.props) {
      const key = `${p.kind}:${p.i},${p.j}`;
      live.add(key);
      let v = views.get(key);
      // A prop removed and placed again on the same cell in one frame is a new object: rebuild the view.
      if (v && v.obj.userData.piece !== p) {
        scene.remove(v.obj);
        views.delete(key);
        v = undefined;
      }
      if (!v) {
        v = makeProp(p);
        views.set(key, v);
        scene.add(v.obj);
      }
      v.animate(dt, state.mode);
    }
    for (const [key, v] of views) {
      if (live.has(key)) continue;
      scene.remove(v.obj);
      views.delete(key);
    }
  }

  function syncStructures(): void {
    const live = new Set<string>();
    for (const s of state.structures) {
      const key = `${s.kind}:${s.i},${s.j},${s.dir ?? ''}`;
      live.add(key);
      let g = shedViews.get(key);
      if (g && g.userData.piece !== s) {
        scene.remove(g);
        shedViews.delete(key);
        g = undefined;
      }
      if (!g) {
        g = makeStructure(s, roofMats);
        shedViews.set(key, g);
        scene.add(g);
      }
    }
    for (const [key, g] of shedViews) {
      if (live.has(key)) continue;
      scene.remove(g);
      shedViews.delete(key);
    }

    // Roofs fade while the gnome stands under one.
    const pc = cellAt(state.player.position.x, state.player.position.z);
    const op = ceilingAt(state, pc.i, pc.j) ? 0.2 : 1;
    for (const m of roofMats.boards) m.opacity = op;
    roofMats.gap.opacity = op;
  }

  /** Right click: removes the nearest shed piece or prop the player is aiming at, within REACH. */
  function removeAimed(): void {
    raycaster.setFromCamera(centre, camera);
    const roots: THREE.Object3D[] = [];
    for (const v of views.values()) roots.push(v.obj);
    for (const g of shedViews.values()) roots.push(g);
    const p = state.player.position;
    for (const h of raycaster.intersectObjects(roots, true)) {
      if (Math.hypot(h.point.x - p.x, h.point.z - p.z) > REACH) continue;
      if (!isShown(h.object)) continue;
      let o: THREE.Object3D | null = h.object;
      while (o && o.userData.piece === undefined) o = o.parent;
      if (!o) continue;
      const piece = o.userData.piece as Structure | Prop;
      if (deconstruct(state, piece)) {
        sfx('place');
        notify(state, 'Removed ' + BUILD_COSTS[piece.kind].name);
      } else {
        sfx('error');
      }
      return;
    }
  }

  return {
    update(dt: number) {
      syncProps(dt);
      syncStructures();

      // Toggle build mode.
      if (input.pressed(KEYS.build)) {
        if (state.mode === 'play') {
          state.mode = 'build';
          notify(state, 'Build mode: click to place, right click to remove, R to switch, B to exit');
        } else if (state.mode === 'build') {
          state.mode = 'play';
        }
      }
      if (state.mode !== 'build') {
        hideGhosts();
        hints.visible = false;
        return;
      }

      // Cycle build kind through BUILD_ORDER.
      if (input.pressed(KEYS.buildKind)) {
        const next = (BUILD_ORDER.indexOf(state.buildKind) + 1) % BUILD_ORDER.length;
        state.buildKind = BUILD_ORDER[next];
        const def = BUILD_COSTS[state.buildKind];
        notify(state, def.name + ': ' + costText(def.cost));
        sfx('click');
      }

      // Aim, ghost and placement.
      const kind = state.buildKind;
      time += dt;
      hideGhosts();
      const target = findTarget(kind);
      if (target) {
        showGhost(BUILD_COSTS[kind].on, target, kind);
        if (input.mousePressed(0) && input.locked()) {
          if (placeTile(state, target.i, target.j, kind, target.dir)) sfx('place');
          else sfx('error');
        }
      }
      if (input.mousePressed(2) && input.locked()) removeAimed();

      // Edge hints only while a water kind is selected; rebuilt only when the tile count changes.
      hints.visible = BUILD_COSTS[kind].on === 'water';
      if (state.tiles.size !== hintsSize) rebuildHints();
    },
  };
}
