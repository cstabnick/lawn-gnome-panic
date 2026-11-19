// Draws Gnome Front's arena by running the GAME'S OWN builders (landmarks, headquarters, scattered cover) on the editor's live
// data, so what you see is what the game builds, including how the cover rearranges when a flag or base moves. Flags and
// vehicles are simple stand-ins; collision circles are translucent cylinders so you can see what blocks soldiers and bullets.
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { buildArenaObjects } from '@front/world';
import type { EditorContext } from '../context';
import { arenaOf, type FrontLevel } from './frontLevel';

const VEHICLE_COLOUR: Record<string, number> = { green: 0x4caf50, yellow: 0xffd600, red: 0xe53935, combine: 0xff8f00 };
const REBUILD_MS = 120;

export function createFrontObjectView(ctx: EditorContext): { dispose(): void } {
  const scene = ctx.viewport.scene;
  const root = new THREE.Group();
  root.name = 'object-view';
  const structures = new THREE.Group();
  const flora = new THREE.Group(); // the View tool's layer toggles expect a second group
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
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra }));
    m.position.set(x, y, z);
    structures.add(m);
    return m;
  }

  function build(): void {
    clear();
    const level = ctx.zones[ctx.zone] as unknown as FrontLevel;
    const arena = arenaOf(level);
    // A prefab id that does not exist would stop the game's builders: leave those entries out of the picture. (No status message:
    // it would overwrite a Save error; the prefab field already turns red and Save refuses with the reason.)
    arena.data = {
      landmarks: arena.data.landmarks.filter((l) => getPrefab(l.prefab)),
      cover: { ...arena.data.cover, layers: arena.data.cover.layers.filter((l) => getPrefab(l.prefab)) },
    };
    const group = new THREE.Group();
    group.traverse((o) => { o.userData.shared = true; });
    const obstacles = buildArenaObjects(group, arena);
    group.traverse((o) => { o.userData.shared = true; }); // prefab geometry may be shared: never dispose it
    structures.add(group);
    for (const o of obstacles) {
      const c = new THREE.Mesh(
        new THREE.CylinderGeometry(o.r, o.r, o.h, 14),
        new THREE.MeshBasicMaterial({ color: 0xff5a5a, transparent: true, opacity: 0.16, depthWrite: false }),
      );
      c.position.set(o.x, arena.heightAt(o.x, o.z) + o.h / 2, o.z);
      structures.add(c);
    }
    for (const f of level.flags) {
      const y = arena.heightAt(f.x, f.z);
      box(0.15, 5, 0.15, 0xcccccc, f.x, y + 2.5, f.z);
      box(1.6, 1, 0.1, 0xdddddd, f.x + 0.9, y + 4.4, f.z);
    }
    for (const v of level.vehicles) {
      const big = v.vehicle === 'combine';
      const m = box(big ? 3.2 : 1.6, big ? 2.4 : 1, big ? 5 : 2.6, VEHICLE_COLOUR[v.vehicle] ?? 0xaaaaaa, v.x, arena.heightAt(v.x, v.z) + (big ? 1.2 : 0.5), v.z);
      m.rotation.y = v.yaw;
    }
  }

  build();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let alive = true;
  // The cover is regenerated from scratch (that is what the game does), so rebuild at most every REBUILD_MS while dragging.
  const rebuild = (): void => {
    if (timer !== undefined) return;
    timer = setTimeout(() => { timer = undefined; if (alive) build(); }, REBUILD_MS);
  };
  const off = ctx.events.changed.on(rebuild);
  return { dispose() { alive = false; clearTimeout(timer); off(); clear(); scene.remove(root); } };
}
