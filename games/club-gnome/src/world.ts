// The three.js side of the town: renderer, camera that follows my gnome, and the meshes of the current map
// (ground, walls or hedges, buildings, signs, prefab props). Avatars add their own models to `scene`.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { CAMERA, type BuildingDef, type MapDef, type PropDef, type SignDef } from './config';

/** What a tap or click on the canvas landed on. */
export type Pick =
  /** A building with a `link`: main.ts walks to that portal or spot and uses it. */
  | { kind: 'building'; id: string; link: string | null }
  /** A point on the ground (also returned for props and other meshes: the ground point under the ray). */
  | { kind: 'ground'; x: number; z: number };

export interface World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  /** Removes the previous map's meshes (never disposing prefab geometry) and builds this one. */
  load(map: MapDef): void;
  /** Canvas client coordinates (event.clientX / clientY) to what is under them, or null (sky). */
  pick(clientX: number, clientY: number): Pick | null;
  /** Eases the camera toward looking at (x, 0, z), clamped so it stays over the map. snap = jump there at once. */
  follow(x: number, z: number, dt: number, snap?: boolean): void;
  /** World point to CSS pixels relative to the viewport; visible false when behind the camera or off screen. */
  project(x: number, y: number, z: number): { x: number; y: number; visible: boolean };
  render(): void;
}

interface BulbMats {
  lit: THREE.MeshBasicMaterial;
  dim: THREE.MeshBasicMaterial;
}

interface Bulb {
  mesh: THREE.Mesh;
  index: number;
}

const warnedProps = new Set<string>();

/** The palette names buildPrefab accepts for a 'tint' part (config says "a @lawn/prefabs colour name"). */
type PrefabTint = NonNullable<NonNullable<Parameters<typeof buildPrefab>[1]>['tint']>;

function hex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}

/** A painted board (canvas texture on a plane). glow = emissive, for neon signs. */
function makeTextBoard(text: string, bg: number, fg: number, w: number, h: number, glow = false): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const family = 'system-ui, sans-serif';
    ctx.fillStyle = hex(bg);
    ctx.fillRect(0, 0, 512, 160);
    let size = 96;
    ctx.font = `bold ${size}px ${family}`;
    while (size > 16 && ctx.measureText(text).width > 480) {
      size -= 4;
      ctx.font = `bold ${size}px ${family}`;
    }
    ctx.fillStyle = hex(fg);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 80);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = glow
    ? new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex })
    : new THREE.MeshLambertMaterial({ map: tex });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

/** A flat coloured rectangle lying on the ground at height y. */
function flat(w: number, d: number, color: THREE.ColorRepresentation, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ color }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}

/** Disposes the geometries and materials under o, never descending into a prefab root (shared geometry). */
function disposeTree(o: THREE.Object3D): void {
  for (const c of [...o.children]) {
    if (c.userData.prefab) continue;
    if (c instanceof THREE.Mesh) {
      c.geometry.dispose();
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      for (const mat of mats) {
        for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
        mat.dispose();
      }
    }
    disposeTree(c);
  }
}

function addBuilding(
  g: THREE.Group,
  b: BuildingDef,
  indoor: boolean,
  parts: THREE.Object3D[],
  bulbs: Bulb[],
  mats: BulbMats,
): void {
  const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), new THREE.MeshLambertMaterial({ color: b.color }));
  body.position.set(b.x, b.h / 2, b.z);
  g.add(body);
  parts.push(body);

  if (!indoor) {
    const mx = Math.max(b.w, b.d);
    const roofH = b.h * 0.45;
    // A 4-sided cone turned 45 degrees has axis-aligned square faces; the radius overhangs the box by 10%.
    const geo = new THREE.ConeGeometry((mx / 2) * 1.1 * Math.SQRT2, roofH, 4, 1);
    geo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: b.roof }));
    roof.scale.set(b.w / mx, 1, b.d / mx);
    roof.position.set(b.x, b.h + roofH / 2, b.z);
    g.add(roof);
    parts.push(roof);
  }

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.1), new THREE.MeshLambertMaterial({ color: 0x2a1a10 }));
  door.position.set(b.x, 1.1, b.z + b.d / 2 + 0.05);
  g.add(door);
  parts.push(door);

  const sign = makeTextBoard(
    b.label,
    b.neon ? 0x0a0a0c : 0x2b2620,
    b.neon ? 0xff4fd8 : 0xfff4e0,
    2.6,
    0.8,
    !!b.neon,
  );
  sign.position.set(b.x, 2.75, b.z + b.d / 2 + 0.06);
  g.add(sign);
  parts.push(sign);

  if (b.neon) {
    const n = Math.max(3, Math.floor(b.w / 0.3));
    const geo = new THREE.SphereGeometry(0.08, 6, 4);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const bulb = new THREE.Mesh(geo, i % 2 === 0 ? mats.lit : mats.dim);
      bulb.position.set(b.x - b.w / 2 + 0.15 + t * (b.w - 0.3), b.h, b.z + b.d / 2 + 0.05);
      g.add(bulb);
      parts.push(bulb);
      bulbs.push({ mesh: bulb, index: i });
    }
  }

  for (const p of parts) p.userData.building = { id: b.id, link: b.link ?? null };
}

function addSign(g: THREE.Group, s: SignDef): void {
  const grp = new THREE.Group();
  grp.position.set(s.x, 0, s.z);
  grp.rotation.y = s.rot ?? 0;
  const board = makeTextBoard(s.text, s.color ?? 0x6b4a2e, 0xfff8ec, 2.6, 0.8);
  if (s.y === undefined) {
    board.position.set(0, 1.4, 0);
    grp.add(board);
    const postMat = new THREE.MeshLambertMaterial({ color: 0x5a3b22 });
    for (const dx of [-0.9, 0.9]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.08), postMat);
      post.position.set(dx, 0.5, 0);
      grp.add(post);
    }
  } else {
    board.position.set(0, s.y, 0);
    grp.add(board);
  }
  g.add(grp);
}

function addProp(g: THREE.Group, p: PropDef, pickables: THREE.Object3D[]): void {
  let root: THREE.Group;
  try {
    root = buildPrefab(p.prefab, p.tint ? { tint: p.tint as PrefabTint } : {});
  } catch (err) {
    if (!warnedProps.has(p.prefab)) {
      warnedProps.add(p.prefab);
      console.warn(`club-gnome: prefab "${p.prefab}" not found, skipped`, err);
    }
    return;
  }
  root.position.set(p.x, 0, p.z);
  root.rotation.y = p.rot ?? 0;
  root.scale.setScalar(p.scale ?? 1);
  root.userData.townProp = { x: p.x, z: p.z };
  g.add(root);
  pickables.push(root);
}

export function createWorld(canvas: HTMLCanvasElement): World {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fd3ff);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x557744, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(8, 20, 10);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(CAMERA.fov, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 15, 15);
  camera.lookAt(0, 0, 0);

  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  let mapGroup: THREE.Group | null = null;
  let current: MapDef | null = null;
  let pickables: THREE.Object3D[] = [];
  let bulbs: Bulb[] = [];
  let bulbMats: BulbMats | null = null;
  let lookX = 0;
  let lookZ = 0;

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    renderer, scene, camera,
    load(map) {
      if (mapGroup) {
        scene.remove(mapGroup);
        disposeTree(mapGroup);
      }
      const g = new THREE.Group();
      current = map;
      pickables = [];
      bulbs = [];
      bulbMats = { lit: new THREE.MeshBasicMaterial({ color: 0xff4fd8 }), dim: new THREE.MeshBasicMaterial({ color: 0x5a2448 }) };
      const hw = map.w / 2;
      const hd = map.d / 2;

      g.add(flat(map.w, map.d, map.ground, 0, 0, 0));
      (map.patches ?? []).forEach((p, i) => {
        g.add(flat(p.w, p.d, p.color, p.x, 0.01 + i * 0.002, p.z));
      });

      if (!map.indoor) {
        scene.background = new THREE.Color(0x9fd3ff);
        scene.fog = new THREE.Fog(0x9fd3ff, 40, 90);
        const grass = new THREE.Color(map.ground).multiplyScalar(0.9);
        g.add(flat(map.w * 3, map.d * 3, grass, 0, -0.02, 0));
        const hedge = new THREE.MeshLambertMaterial({ color: 0x3f7a35 });
        const hedges: [number, number, number, number][] = [
          [map.w + 2, 1, 0, -(hd + 0.5)],
          [map.w + 2, 1, 0, hd + 0.5],
          [1, map.d, -(hw + 0.5), 0],
          [1, map.d, hw + 0.5, 0],
        ];
        for (const [w, d, x, z] of hedges) {
          const h = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), hedge);
          h.position.set(x, 0.5, z);
          g.add(h);
        }
      } else {
        scene.background = new THREE.Color(0x0b0b12);
        scene.fog = null;
        const wall = new THREE.MeshLambertMaterial({ color: map.wallColor ?? 0x553344 });
        const walls: [number, number, number, number, number, number][] = [
          // [width, height, depth, x, y, z]
          [map.w + 0.6, 4, 0.3, 0, 2, -(hd + 0.15)],
          [0.3, 4, map.d, -(hw + 0.15), 2, 0],
          [0.3, 4, map.d, hw + 0.15, 2, 0],
          [map.w + 0.6, 0.5, 0.3, 0, 0.25, hd + 0.15],
        ];
        for (const [w, h, d, x, y, z] of walls) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wall);
          m.position.set(x, y, z);
          g.add(m);
        }
        for (const ix of [-0.25, 0.25]) {
          for (const iz of [-0.25, 0.25]) {
            const lamp = new THREE.PointLight(0xffd9a0, 8, 14);
            lamp.position.set(ix * map.w, 3.5, iz * map.d);
            g.add(lamp);
          }
        }
      }

      for (const b of map.buildings) {
        const parts: THREE.Object3D[] = [];
        addBuilding(g, b, map.indoor, parts, bulbs, bulbMats);
        pickables.push(...parts);
      }
      for (const s of map.signs) addSign(g, s);
      for (const p of map.props) addProp(g, p, pickables);

      scene.add(g);
      mapGroup = g;
    },
    pick(clientX, clientY) {
      const r = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      for (const hit of ray.intersectObjects(pickables, true)) {
        let o: THREE.Object3D | null = hit.object;
        while (o) {
          const bd = o.userData.building as { id: string; link: string | null } | undefined;
          if (bd) return { kind: 'building', id: bd.id, link: bd.link };
          const tp = o.userData.townProp as { x: number; z: number } | undefined;
          if (tp) return { kind: 'ground', x: tp.x, z: tp.z };
          o = o.parent;
        }
      }
      const p = new THREE.Vector3();
      if (!ray.ray.intersectPlane(plane, p)) return null;
      const hw = (current ? current.w / 2 : 0) + 1;
      const hd = (current ? current.d / 2 : 0) + 1;
      if (Math.abs(p.x) > hw || Math.abs(p.z) > hd) return null;
      return { kind: 'ground', x: p.x, z: p.z };
    },
    follow(x, z, dt, snap) {
      const k = snap ? 1 : 1 - Math.exp(-CAMERA.follow * dt);
      lookX += (x - lookX) * k;
      // Look a little ahead (toward -z), so my gnome sits low on screen and the buildings or back wall stay in view.
      lookZ += (z - CAMERA.lookAhead - lookZ) * k;
      const mx = Math.max(0, (current ? current.w / 2 : 0) - 7);
      const halfD = current ? current.d / 2 : 0;
      lookX = Math.min(mx, Math.max(-mx, lookX));
      lookZ = Math.min(Math.max(0, halfD - 5), Math.max(Math.min(0, -halfD + 3), lookZ));
      const portrait = window.innerHeight > window.innerWidth;
      const off = portrait ? CAMERA.portraitOffset : CAMERA.offset;
      camera.position.set(lookX + off.x, off.y, lookZ + off.z);
      camera.lookAt(lookX, 0, lookZ);
      camera.updateMatrixWorld();
    },
    project(x, y, z) {
      const r = renderer.domElement.getBoundingClientRect();
      const v = new THREE.Vector3(x, y, z).project(camera);
      const px = r.left + ((v.x + 1) / 2) * r.width;
      const py = r.top + ((1 - v.y) / 2) * r.height;
      const visible =
        v.z <= 1 && px >= -40 && px <= window.innerWidth + 40 && py >= -40 && py <= window.innerHeight + 40;
      return { x: px, y: py, visible };
    },
    render() {
      if (bulbMats && bulbs.length) {
        const phase = Math.floor(performance.now() / 500) % 2;
        for (const b of bulbs) b.mesh.material = (b.index + phase) % 2 === 0 ? bulbMats!.lit : bulbMats!.dim;
      }
      renderer.render(scene, camera);
    },
  };
}
