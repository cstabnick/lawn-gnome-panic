// Draws what the course holds, at the heights the game puts it: the props (prefabs), the creatures (the game's own models), the
// pools (water, or lava), the islands and platforms, the cover, and the walls. The rail is drawn by the Rail tool.
//
// The View tool's layer toggles read two groups under `object-view`: the first one is "Buildings, decks and props", the second
// "Trees, rocks and hedges". The water is its own group named `water`, which the editor hides by default.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { buildGnomeokemon } from '@gnomeokemon/prefabs/registry';
import type { EditorContext } from '../context';
import type { GnomeLevel } from './gnomeokemonLevel';

const REBUILD_MS = 300;
const PROP_SCALE = 1.6; // the game's default for a placed prefab (games/gnomeokemon/src/snap/world.ts)

const lambert = (colour: number, opts: { transparent?: boolean; opacity?: number } = {}): THREE.MeshLambertMaterial =>
  new THREE.MeshLambertMaterial({ color: colour, transparent: opts.transparent ?? false, opacity: opts.opacity ?? 1, flatShading: true });

/** A creature as the game draws it: its own model, at its height above the ground, turned as in the file. */
function creatureModel(species: string, scale: number): THREE.Object3D {
  try {
    const g = buildGnomeokemon(species, { lights: false });
    g.scale.setScalar(scale);
    return g;
  } catch {
    // An unknown species still shows: a small pink ball, so it can be found and fixed.
    return new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), lambert(0xff77aa));
  }
}

function prefabOrPlaceholder(id: string): THREE.Object3D {
  try {
    return buildPrefab(id, { lights: false });
  } catch {
    return new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), lambert(0xff77aa));
  }
}

export function createGnomeObjectView(ctx: EditorContext): { dispose(): void } {
  const scene = ctx.viewport.scene;
  const root = new THREE.Group();
  root.name = 'object-view';
  const structures = new THREE.Group(); // "Buildings, decks and props": props, creatures, platforms, islands, lava
  const flora = new THREE.Group(); // "Trees, rocks and hedges": cover, walls
  root.add(structures, flora);
  scene.add(root);
  const water = new THREE.Group();
  water.name = 'water';
  scene.add(water);

  function disposeTree(o: THREE.Object3D): void {
    o.traverse((x) => {
      const m = x as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((k) => {
        (k as THREE.SpriteMaterial).map?.dispose();
        k.dispose();
      });
    });
  }

  function clearGroup(g: THREE.Group): void {
    for (const c of [...g.children]) {
      g.remove(c);
      disposeTree(c);
    }
  }

  function build(): void {
    clearGroup(structures);
    clearGroup(flora);
    clearGroup(water);
    const level = ctx.zones[ctx.zone] as unknown as GnomeLevel;
    const ground = (x: number, z: number): number => ctx.terrain.heightAt(x, z);

    for (const p of level.props) {
      const model = prefabOrPlaceholder(p.prefab);
      model.position.set(p.x, ground(p.x, p.z), p.z);
      model.rotation.y = p.rot ?? 0;
      model.scale.setScalar(p.scale ?? PROP_SCALE);
      structures.add(model);
    }

    for (const c of level.creatures) {
      const model = creatureModel(c.species, c.scale ?? 1);
      model.position.set(c.x, ground(c.x, c.z) + c.lift, c.z);
      model.rotation.y = c.rotY;
      structures.add(model);
    }

    for (const p of level.platforms) {
      const height = p.h + 0.6;
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 0.95, p.r * 1.05, height, 12), lambert(0x9c8b6e));
      plinth.position.set(p.x, (p.h - 0.6) / 2, p.z);
      structures.add(plinth);
    }

    for (const i of level.islands) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(i.r * 0.95, i.r * 1.05, 0.12, 14), lambert(0x7a9a4a));
      cap.position.set(i.x, i.h - 0.06, i.z);
      structures.add(cap);
    }

    for (const p of level.ponds) {
      if (p.lava) {
        const lava = new THREE.Mesh(new THREE.CircleGeometry(p.r * 0.95, 28), new THREE.MeshBasicMaterial({ color: 0xff6a1a }));
        lava.rotation.x = -Math.PI / 2;
        lava.position.set(p.x, p.level + 0.03, p.z);
        structures.add(lava);
      } else {
        const surface = new THREE.Mesh(
          new THREE.CircleGeometry(p.r * 0.95, 28),
          new THREE.MeshLambertMaterial({ color: p.color, transparent: true, opacity: 0.82 }),
        );
        surface.rotation.x = -Math.PI / 2;
        surface.position.set(p.x, p.level + 0.03, p.z);
        water.add(surface);
      }
    }

    for (const c of level.cover) {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), lambert(0x3f7a2c));
      bush.position.set(c.x, ground(c.x, c.z) + 0.5, c.z);
      flora.add(bush);
    }

    for (const path of level.paths) {
      if (path.kind !== 'wall') continue;
      const style = level.data.wallStyles?.[path.id] ?? 'stone';
      const colour = style === 'brick' ? 0xa4553a : style === 'glass' ? 0x9fd8e6 : style === 'ice' ? 0xbfe7f5 : style === 'rock' ? 0x4a4038 : 0x8c877f;
      const height = style === 'glass' ? 2.4 : style === 'pillar' ? 2.4 : 1.6;
      const pts = path.points;
      for (let k = 0; k + 1 < pts.length; k++) {
        const [ax, az] = pts[k];
        const [bx, bz] = pts[k + 1];
        const len = Math.hypot(bx - ax, bz - az);
        if (len < 1e-6) continue;
        const wall = new THREE.Mesh(new THREE.BoxGeometry(0.35, height, len), lambert(colour, { transparent: style === 'glass' || style === 'ice', opacity: style === 'glass' || style === 'ice' ? 0.45 : 1 }));
        wall.position.set((ax + bx) / 2, ground((ax + bx) / 2, (az + bz) / 2) + height / 2, (az + bz) / 2);
        wall.rotation.y = Math.atan2(bx - ax, bz - az);
        flora.add(wall);
      }
    }
  }

  build();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let alive = true;
  const rebuild = (): void => {
    if (timer !== undefined) return;
    timer = setTimeout(() => { timer = undefined; if (alive) build(); }, REBUILD_MS);
  };
  const off = ctx.events.changed.on(rebuild);
  return {
    dispose() {
      alive = false;
      clearTimeout(timer);
      off();
      clearGroup(structures);
      clearGroup(flora);
      clearGroup(water);
      scene.remove(root);
      scene.remove(water);
    },
  };
}
