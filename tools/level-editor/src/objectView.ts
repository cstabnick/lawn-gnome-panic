// Draws the things standing in the world: houses, decks and their ramps, walls, shrines, authored props (the real prefab
// library) and the flora the game scatters (trees, rocks, hedges...), all on the editor's live terrain so they follow
// brush edits. The shapes of the houses mirror games/gnomes-of-gnomomia/src/dressing.ts (`buildHouse`), which is not
// exported and reads the game's own terrain instance; flora is a simple stand-in for world.ts' meshes. The rings and
// outlines used for picking are entityView.ts; this is only what you would see in the game.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { WORLD, type ZoneDef } from '@gnomomia/config';
import type { Flora, FloraKind } from '@gnomomia/terrainCore';
import type { EditorContext } from './context';

const FLORA_WARM_PER_FRAME = 10;

function mat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

function addMesh(parent: THREE.Object3D, geo: THREE.BufferGeometry, color: number, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/** One house, the same shapes as the game's. */
function houseGroup(h: ZoneDef['houses'][number], groundY: number): THREE.Group {
  const r = h.r;
  const g = new THREE.Group();
  g.position.set(h.x, groundY, h.z);
  switch (h.style) {
    case 'mushroom': {
      addMesh(g, new THREE.CylinderGeometry(r * 0.7, r * 0.85, 3, 10), 0xf2e6c8, 0, 1.5, 0);
      const cap = addMesh(g, new THREE.SphereGeometry(r * 1.35, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xc8352e, 0, 2.8, 0);
      cap.scale.y = 0.8;
      break;
    }
    case 'thatch':
      addMesh(g, new THREE.CylinderGeometry(r * 0.85, r * 0.95, 2.6, 10), 0xd9b56a, 0, 1.3, 0);
      addMesh(g, new THREE.ConeGeometry(r * 1.15, 2.4, 10), 0xb8862e, 0, 3.8, 0);
      break;
    case 'stone':
      addMesh(g, new THREE.CylinderGeometry(r * 0.9, r * 0.95, 2.8, 8), 0x9a9a92, 0, 1.4, 0);
      addMesh(g, new THREE.ConeGeometry(r * 1.1, 1.4, 8), 0x6e6e68, 0, 3.5, 0);
      break;
    case 'log': {
      addMesh(g, new THREE.BoxGeometry(r * 1.6, 2.4, r * 1.6), 0x8b5a2b, 0, 1.2, 0);
      const roof = addMesh(g, new THREE.ConeGeometry(r * 1.2, 1.6, 4), 0x5a3a1e, 0, 3.2, 0);
      roof.rotation.y = Math.PI / 4;
      break;
    }
    case 'tent':
      addMesh(g, new THREE.ConeGeometry(r * 1.2, 3.2, 6), 0xc8b07a, 0, 1.6, 0);
      break;
    case 'pot':
      addMesh(g, new THREE.CylinderGeometry(r * 0.55, r * 0.8, 2.4, 12), 0xb5562f, 0, 1.2, 0);
      addMesh(g, new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.35, 12), 0xc96a3c, 0, 2.5, 0);
      break;
  }
  // The door faces the house's yaw.
  const door = addMesh(g, new THREE.BoxGeometry(1, 1.6, 0.2), 0x5a3a1e, Math.sin(h.yaw) * r * 0.86, 0.8, Math.cos(h.yaw) * r * 0.86);
  door.rotation.y = h.yaw;
  return g;
}

interface FloraPart {
  geo: THREE.BufferGeometry;
  color: number;
  /** Height of the part's origin above the ground, at scale 1. */
  lift: number;
}

const FLORA_PARTS: Record<FloraKind, FloraPart[]> = {
  pine: [
    { geo: new THREE.CylinderGeometry(0.18, 0.25, 1.6, 6), color: 0x6b4a2e, lift: 0.8 },
    { geo: new THREE.ConeGeometry(1.1, 3.4, 7), color: 0x2f6b34, lift: 3.0 },
  ],
  broad: [
    { geo: new THREE.CylinderGeometry(0.2, 0.28, 1.8, 6), color: 0x7a5535, lift: 0.9 },
    { geo: new THREE.SphereGeometry(1.4, 8, 6), color: 0x4a8f3a, lift: 2.7 },
  ],
  grass: [{ geo: new THREE.ConeGeometry(0.25, 0.7, 5), color: 0x7cc050, lift: 0.35 }],
  clover: [{ geo: new THREE.SphereGeometry(0.45, 6, 4), color: 0x8fd06a, lift: 0.2 }],
  hedge: [{ geo: new THREE.BoxGeometry(2.4, 1.3, 1.1), color: 0x2f7a3a, lift: 0.65 }],
  boulder: [{ geo: new THREE.DodecahedronGeometry(1.0, 0), color: 0x8a8a84, lift: 0.5 }],
  rock: [{ geo: new THREE.DodecahedronGeometry(0.5, 0), color: 0x9a9a92, lift: 0.25 }],
  pipe: [{ geo: new THREE.CylinderGeometry(0.45, 0.45, 1.5, 8), color: 0x8a5a3a, lift: 0.75 }],
  stubble: [{ geo: new THREE.ConeGeometry(0.2, 0.5, 4), color: 0xd8c070, lift: 0.25 }],
};

export function createObjectView(ctx: EditorContext): { dispose(): void } {
  const scene = ctx.viewport.scene;
  const root = new THREE.Group();
  root.name = 'object-view';
  scene.add(root);
  const structures = new THREE.Group(); // houses, decks, walls, shrines, props: rebuilt whole on every edit (a few hundred objects)
  const floraGroup = new THREE.Group();
  root.add(structures, floraGroup);

  const outdoor = ctx.outdoorZones.map((id) => ctx.zones[id]);
  const chunks: { ci: number; cj: number }[] = [];
  const seen = new Set<string>();
  const C = WORLD.chunk;
  for (const def of outdoor) {
    const o = def.origin ?? { x: 0, z: 0 };
    const h = def.half;
    for (let ci = Math.floor((o.x - h) / C); ci <= Math.floor((o.x + h) / C); ci++) {
      for (let cj = Math.floor((o.z - h) / C); cj <= Math.floor((o.z + h) / C); cj++) {
        const k = `${ci},${cj}`;
        if (!seen.has(k)) { seen.add(k); chunks.push({ ci, cj }); }
      }
    }
  }

  function disposeChildren(g: THREE.Object3D): void {
    for (const c of [...g.children]) {
      g.remove(c);
      c.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          // Prefab and flora geometries are shared module-level objects for flora; houses and decks own theirs.
          if (!o.userData.sharedGeo) o.geometry.dispose();
          const m = o.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else if (!o.userData.sharedMat) m.dispose();
        }
      });
    }
  }

  function buildStructures(): void {
    disposeChildren(structures);
    const t = ctx.terrain;
    for (const def of outdoor) {
      for (const h of def.houses) structures.add(houseGroup(h, t.heightAt(h.x, h.z)));
      // Shrine: a small stone well.
      const sh = new THREE.Group();
      sh.position.set(def.shrine.x, t.heightAt(def.shrine.x, def.shrine.z), def.shrine.z);
      addMesh(sh, new THREE.CylinderGeometry(1.0, 1.1, 0.9, 10), 0x8f8f88, 0, 0.45, 0);
      addMesh(sh, new THREE.CylinderGeometry(0.75, 0.75, 0.3, 10), 0x2f6fa8, 0, 0.8, 0);
      structures.add(sh);
      for (const w of def.walls ?? []) {
        const dx = w.x2 - w.x1, dz = w.z2 - w.z1;
        const len = Math.hypot(dx, dz);
        if (len < 0.1) continue;
        const mx = (w.x1 + w.x2) / 2, mz = (w.z1 + w.z2) / 2;
        const wall = addMesh(structures, new THREE.BoxGeometry(1.5, 3, len), 0x8a8a82, mx, t.heightAt(mx, mz) + 1.5, mz);
        wall.rotation.y = Math.atan2(dx, dz);
      }
      for (const p of def.props ?? []) {
        try {
          const g = buildPrefab(p.prefab, { scale: p.scale ?? 1 });
          g.position.set(p.x, t.heightAt(p.x, p.z), p.z);
          g.rotation.y = p.rot ?? 0;
          // The prefab library may share geometry and materials between instances: never dispose them.
          g.traverse((o) => { o.userData.sharedGeo = true; o.userData.sharedMat = true; });
          structures.add(g);
        } catch {
          // An unknown prefab id: a magenta cube so it is still visible and pickable.
          addMesh(structures, new THREE.BoxGeometry(1, 1, 1), 0xff00ff, p.x, t.heightAt(p.x, p.z) + 0.5, p.z);
        }
      }
    }
    for (const d of t.deckLayout()) {
      const { deck } = d;
      const slab = addMesh(structures, new THREE.BoxGeometry(deck.w, 0.35, deck.d), deck.style === 'stone' ? 0x8f8f88 : 0xb98a54, deck.x, d.top - 0.17, deck.z);
      slab.userData.deck = true;
      for (const px of [deck.x - deck.w / 2 + 0.3, deck.x + deck.w / 2 - 0.3]) {
        for (const pz of [deck.z - deck.d / 2 + 0.3, deck.z + deck.d / 2 - 0.3]) {
          const g = t.heightAt(px, pz);
          const h = Math.max(0.2, d.top - g);
          addMesh(structures, new THREE.CylinderGeometry(0.2, 0.2, h, 6), 0x6b4a2e, px, g + h / 2, pz);
        }
      }
      // The ramp: a slanted board from the deck's edge down to the ground.
      const r = d.ramp;
      const cx = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;
      const along = deck.stair === 'n' || deck.stair === 's' ? 'z' : 'x';
      const len = along === 'z' ? r.maxZ - r.minZ : r.maxX - r.minX;
      const gEnd = t.heightAt(cx, cz);
      const rise = d.top - gEnd;
      const slope = Math.hypot(len, rise);
      const geo = along === 'z' ? new THREE.BoxGeometry(r.maxX - r.minX, 0.2, slope) : new THREE.BoxGeometry(slope, 0.2, r.maxZ - r.minZ);
      const board = addMesh(structures, geo, 0xa07a48, cx, (d.top + gEnd) / 2, cz);
      const tilt = Math.atan2(rise, len);
      // Rise toward the deck: the deck is on the opposite side from where the ramp reaches the ground.
      if (along === 'z') board.rotation.x = deck.stair === 's' ? tilt : -tilt;
      else board.rotation.z = deck.stair === 'e' ? -tilt : tilt;
    }
  }

  // ---- flora: one instanced mesh per (kind, part), rebuilt from the terrain's cached chunks
  let floraMeshes: THREE.InstancedMesh[] = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const sc = new THREE.Vector3();
  const pos = new THREE.Vector3();

  function buildFlora(): void {
    for (const m of floraMeshes) { floraGroup.remove(m); m.dispose(); }
    floraMeshes = [];
    const byKind = new Map<FloraKind, Flora[]>();
    for (const { ci, cj } of chunks) {
      for (const f of ctx.terrain.chunkFlora(ci, cj)) {
        let l = byKind.get(f.kind);
        if (!l) { l = []; byKind.set(f.kind, l); }
        l.push(f);
      }
    }
    for (const [kind, list] of byKind) {
      for (const part of FLORA_PARTS[kind]) {
        const mesh = new THREE.InstancedMesh(part.geo, mat(part.color), list.length);
        list.forEach((f, i) => {
          q.setFromAxisAngle(up, f.rot);
          sc.setScalar(f.s);
          pos.set(f.x, f.y + part.lift * f.s, f.z);
          m4.compose(pos, q, sc);
          mesh.setMatrixAt(i, m4);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.frustumCulled = false;
        floraGroup.add(mesh);
        floraMeshes.push(mesh);
      }
    }
  }

  // Warm the terrain's flora cache a few chunks a frame at start-up so the page stays responsive, then build once.
  let warmed = 0;
  let disposed = false;
  let raf = 0;
  function warm(): void {
    if (disposed) return;
    for (let i = 0; i < FLORA_WARM_PER_FRAME && warmed < chunks.length; i++, warmed++) ctx.terrain.chunkFlora(chunks[warmed].ci, chunks[warmed].cj);
    if (warmed < chunks.length) { raf = requestAnimationFrame(warm); return; }
    buildFlora();
  }

  buildStructures();
  raf = requestAnimationFrame(warm);

  // Rebuild after edits, at most once per frame.
  let pending = false;
  const off = ctx.events.changed.on(() => {
    if (pending || warmed < chunks.length) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      if (disposed) return;
      buildStructures();
      buildFlora();
    });
  });

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      off();
      disposeChildren(structures);
      for (const m of floraMeshes) m.dispose();
      scene.remove(root);
    },
  };
}
