// Draws a Club Gnome map's things as they look in the game: buildings with roofs and doors, props through the prefab library,
// floor patches, signs, and the blockers (translucent) so you can see where you cannot walk.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { EditorContext } from '../context';

type Rect = { x: number; z: number; w: number; d: number };
interface ClubMap {
  indoor: boolean;
  buildings: (Rect & { h: number; color: number; roof: number })[];
  blockers: Rect[];
  props: { prefab: string; x: number; z: number; rot?: number; scale?: number; tint?: string }[];
  patches?: (Rect & { color: number })[];
  signs: { text: string; x: number; z: number; y?: number; rot?: number; color?: number }[];
}

const mat = (color: number, extra: Partial<THREE.MeshLambertMaterialParameters> = {}): THREE.MeshLambertMaterial =>
  new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });

export function createClubObjectView(ctx: EditorContext): { dispose(): void } {
  const scene = ctx.viewport.scene;
  const root = new THREE.Group();
  root.name = 'object-view';
  const structures = new THREE.Group();
  const flora = new THREE.Group(); // none on a flat map; the View tool's layer toggles expect the second group
  root.add(structures, flora);
  scene.add(root);

  function clear(): void {
    for (const c of [...structures.children]) {
      structures.remove(c);
      c.traverse((o) => {
        if (o instanceof THREE.Mesh && !o.userData.shared) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
    }
  }

  function box(w: number, h: number, d: number, color: number, x: number, y: number, z: number, extra: Partial<THREE.MeshLambertMaterialParameters> = {}): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));
    m.position.set(x, y, z);
    structures.add(m);
    return m;
  }

  function build(): void {
    clear();
    const map = ctx.zones[ctx.zone] as unknown as ClubMap;
    for (const p of map.patches ?? []) box(p.w, 0.04, p.d, p.color, p.x, 0.02, p.z);
    for (const b of map.buildings) {
      box(b.w, b.h, b.d, b.color, b.x, b.h / 2, b.z);
      if (!map.indoor) {
        const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(b.w, b.d) / 2, 1.6, 4), mat(b.roof));
        roof.rotation.y = Math.PI / 4;
        roof.position.set(b.x, b.h + 0.8, b.z);
        structures.add(roof);
      }
      box(1.2, 1.8, 0.2, 0x3a2412, b.x, 0.9, b.z + b.d / 2); // the door, in the middle of the front (+z) face
    }
    for (const p of map.props) {
      try {
        const g = buildPrefab(p.prefab, { scale: p.scale ?? 1, ...(p.tint ? { tint: p.tint as never } : {}) });
        g.position.set(p.x, 0, p.z);
        g.rotation.y = p.rot ?? 0;
        g.traverse((o) => { o.userData.shared = true; });
        structures.add(g);
      } catch {
        box(0.8, 0.8, 0.8, 0xff00ff, p.x, 0.4, p.z); // an unknown prefab id stays visible and pickable
      }
    }
    for (const s of map.signs) {
      const y = s.y ?? 1.5;
      const board = box(1.6, 0.7, 0.1, s.color ?? 0xf0e68c, s.x, y, s.z);
      board.rotation.y = s.rot ?? 0;
      if (s.y === undefined) { box(0.1, y, 0.1, 0x6b4a2e, s.x - 0.6, y / 2, s.z); box(0.1, y, 0.1, 0x6b4a2e, s.x + 0.6, y / 2, s.z); }
    }
    for (const r of map.blockers) box(r.w, 0.8, r.d, 0xff5a5a, r.x, 0.4, r.z, { transparent: true, opacity: 0.22, depthWrite: false });
  }

  build();
  let pending = false;
  let alive = true;
  const rebuild = (): void => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; if (alive) build(); });
  };
  const off = ctx.events.changed.on(rebuild);
  const offZone = ctx.events.zone.on(rebuild);
  return { dispose() { alive = false; off(); offZone(); clear(); scene.remove(root); } };
}
