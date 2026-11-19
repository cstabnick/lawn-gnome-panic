// Draws the active zone's layers (border, items, roads, walls, spawn, shrine, exits) over the terrain.
// Drawing only: picking and editing live in the tools.
import * as THREE from 'three';
import { COLLECTIONS } from './profile';
import type { CollectionDef, EditorContext, Item, MutableZone } from './context';
import { clipSegmentToRect, polylinePoints, rectPoints, ringPoints, zoneBorderRect, type Height, type Pt3 } from './overlayGeom';

const POLE_HEIGHT = 6;
const LIFT = 0.4;
const WHITE = 0xffffff;
const ROAD = 0xb5834a;
const DERIVED_ROAD = 0x8a7a3a;
const WALL = 0x9a9a9a;

/** Draws the zone's layers into ctx.viewport.overlay and keeps them current. Returns a disposer. */
export function createEntityView(ctx: EditorContext): { dispose(): void } {
  const group = new THREE.Group();
  group.name = 'entity-view';
  ctx.viewport.overlay.add(group);

  const h: Height = (x, z) => ctx.terrain.heightAt(x, z);

  function line(pts: Pt3[], color: number, opacity = 1): void {
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const mat = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity, depthTest: false });
    const obj = new THREE.Line(geo, mat);
    obj.renderOrder = 10;
    group.add(obj);
  }

  function pole(x: number, z: number, color: number): void {
    const base = h(x, z) + LIFT;
    line([[x, base, z], [x, base + POLE_HEIGHT, z]], color);
  }

  function itemOutline(c: CollectionDef, it: Item, grow: number): Pt3[] {
    if (c.shape === 'circle') return ringPoints(it.x, it.z, c.radius(it) + grow, h);
    return rectPoints(it.x, it.z, Number(it.w) + 2 * grow, Number(it.d) + 2 * grow, h);
  }

  function rebuild(): void {
    clearGroup(group);
    const zone = ctx.zones[ctx.zone];
    const def = zone as unknown as MutableZone;

    const border = zoneBorderRect(zone);
    line(rectPoints(border.cx, border.cz, border.w, border.d, h), WHITE, 0.5);

    const sel = ctx.selection;
    for (const c of COLLECTIONS) {
      c.items(def).forEach((it, index) => {
        if (c.accepts && !c.accepts(it)) return;
        line(itemOutline(c, it, 0), c.color);
        pole(it.x, it.z, c.color);
        if (sel && sel.collection === c.id && sel.index === index) {
          line(itemOutline(c, it, 0), WHITE);
          line(itemOutline(c, it, 0.6), WHITE);
        }
      });
    }

    for (const p of def.paths ?? []) {
      if (p.kind === 'road') line(polylinePoints(p.points, h), ROAD);
    }
    for (const w of zone.walls ?? []) {
      line(polylinePoints([[w.x1, w.z1], [w.x2, w.z2]], h), WALL);
    }

    const rect = { minX: border.cx - border.w / 2, maxX: border.cx + border.w / 2, minZ: border.cz - border.d / 2, maxZ: border.cz + border.d / 2 };
    for (const s of ctx.terrain.roadSegments()) {
      const clipped = clipSegmentToRect(s.ax, s.az, s.bx, s.bz, rect);
      if (clipped) {
        const [ax, az, bx, bz] = clipped;
        line(polylinePoints([[ax, az], [bx, bz]], h), DERIVED_ROAD, 0.8);
      }
    }

  }

  let frame = 0;
  const schedule = (): void => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      rebuild();
    });
  };

  const unsubs = [ctx.events.changed.on(schedule), ctx.events.selection.on(schedule), ctx.events.zone.on(schedule)];
  schedule();

  return {
    dispose() {
      for (const u of unsubs) u();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      clearGroup(group);
      group.removeFromParent();
    },
  };
}

function clearGroup(group: THREE.Group): void {
  for (const child of group.children) {
    const obj = child as THREE.Line;
    obj.geometry.dispose();
    (obj.material as THREE.Material).dispose();
  }
  group.clear();
}
