// Draws the active zone's layers (border, items, roads, walls, spawn, shrine, exits) over the terrain.
// Drawing only: picking and editing live in the tools.
import * as THREE from 'three';
import type { CollectionDef, EditorContext, Item, MutableZone } from './context';
import { clipSegmentToRect, polylinePoints, rectPoints, ringPoints, zoneBorderRect, type Height, type Pt3 } from './overlayGeom';
import { contextDoorLinks, linksIn } from './doorLinks';

const POLE_HEIGHT = 6;
const SHORT_POLE = 2;
const LIFT = 0.4;
const WHITE = 0xffffff;
const ROAD = 0xb5834a;
const DERIVED_ROAD = 0x8a7a3a;
const WALL = 0x9a9a9a;
const EXIT_LINK = 0x44ddff;
const INDOOR_LINK = 0xffaa33;
const UNKNOWN_LINK = 0xff4444;

/** Draws the zone's layers into ctx.viewport.overlay and keeps them current. Returns a disposer. */
export function createEntityView(ctx: EditorContext): { dispose(): void } {
  const group = new THREE.Group();
  group.name = 'entity-view';
  ctx.viewport.overlay.add(group);

  const h: Height = (x, z) => ctx.terrain.heightAt(x, z);

  function line(pts: Pt3[], color: number, opacity = 1, into: THREE.Object3D = group): void {
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const mat = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity, depthTest: false });
    const obj = new THREE.Line(geo, mat);
    obj.renderOrder = 10;
    into.add(obj);
  }

  function pole(x: number, z: number, color: number, into: THREE.Object3D = group, height = POLE_HEIGHT): void {
    const base = h(x, z) + LIFT;
    line([[x, base, z], [x, base + height, z]], color, 1, into);
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
    for (const c of ctx.adapter.collections) {
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

    // Where each exit of this zone arrives. House doors are skipped: they already show as houses.
    const doors = new THREE.Group();
    doors.name = 'door-links';
    group.add(doors);
    const inEditor = (id: string): boolean => Object.prototype.hasOwnProperty.call(ctx.zones, id);
    for (const l of linksIn(contextDoorLinks(ctx), ctx.zone)) {
      if (l.kind !== 'exit') continue;
      if (l.destKnown && !l.destIndoor && inEditor(l.to)) {
        const a: Pt3 = [l.from.x, h(l.from.x, l.from.z) + LIFT, l.from.z];
        const b: Pt3 = [l.arrive.x, h(l.arrive.x, l.arrive.z) + LIFT, l.arrive.z];
        line([a, b], EXIT_LINK, 1, doors);
        pole(l.arrive.x, l.arrive.z, EXIT_LINK, doors);
      } else {
        pole(l.from.x, l.from.z, l.destKnown ? INDOOR_LINK : UNKNOWN_LINK, doors, SHORT_POLE);
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
  group.traverse((obj) => {
    if (obj instanceof THREE.Line) {
      obj.geometry.dispose();
      (obj.material as THREE.Material).dispose();
    }
  });
  group.clear();
}
