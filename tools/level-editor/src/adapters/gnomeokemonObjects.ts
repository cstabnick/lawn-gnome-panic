// Draws what the Select tool does not: the rail (the track the dog rides) and the walls, as lines over the ground at the height
// the game puts them. Everything else (pools, islands, platforms, creatures, zones, props) is a collection the Select tool draws.
import * as THREE from 'three';
import type { EditorContext } from '../context';
import { derivedStamps, heightAt, type GnomeLevel } from './gnomeokemonLevel';

const REBUILD_MS = 100;

export function createGnomeObjectView(ctx: EditorContext): { dispose(): void } {
  const scene = ctx.viewport.scene;
  const root = new THREE.Group();
  root.name = 'object-view';
  scene.add(root);

  function clear(): void {
    for (const c of [...root.children]) {
      root.remove(c);
      c.traverse((o) => {
        if (o instanceof THREE.Line) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    }
  }

  function line(points: [number, number][], lift: number, colour: number, stamps: ReturnType<typeof derivedStamps>): void {
    const pts = points.map(([x, z]) => new THREE.Vector3(x, heightAt(stamps, x, z) + lift, z));
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: colour, depthTest: false }));
    l.renderOrder = 8;
    root.add(l);
  }

  function build(): void {
    clear();
    const level = ctx.zones[ctx.zone] as unknown as GnomeLevel;
    const stamps = [...level.stamps, ...derivedStamps(level)];
    for (const p of level.paths) {
      if (p.kind === 'road') line(p.points, 0.6, 0xffd24a, stamps);
      else if (p.kind === 'wall') line(p.points, 1.6, 0xd8cbb8, stamps);
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
  return { dispose() { alive = false; clearTimeout(timer); off(); clear(); scene.remove(root); } };
}
