// Tower facade dressing: the signature colour band, vertical ribs, balcony slabs, and scaffolding on the one tower
// that is under repair. Everything stands proud of the walls (no shared faces) and nothing below 3 m leaves the footprint.
import type { StaticPrefabPlacement } from '@lawn/prefabs';
import { LOBBY_H, TILE_H, TILE_W, box, cyl } from './kit';
import type { Mass, TowerGeoms, TowerSpec, TowerStyle } from './types';

const FLOOR = TILE_H / 2;
const MAX_BOXES = 120;

/** Adds one tower's band, ribs, balconies (to `out`) and scaffolding (to `gear`). */
export function dressFacade(
  _spec: TowerSpec, style: TowerStyle, masses: readonly Mass[], out: TowerGeoms, gear: StaticPrefabPlacement[], _rnd: () => number,
): void {
  const body = masses.slice(1);
  let boxes = 0;
  const add = (g: ReturnType<typeof box>): void => { if (boxes < MAX_BOXES) { out.trim.push(g); boxes++; } };
  const tall = (m: Mass): number => m.y1 - m.y0;
  const tallest = (pred: (m: Mass) => boolean): Mass | undefined =>
    body.filter(pred).reduce<Mass | undefined>((a, m) => (!a || tall(m) > tall(a) ? m : a), undefined);

  // Band: one coloured ring round the tallest mass, on a floor line.
  if (style.band) {
    const m = tallest((x) => tall(x) > 12);
    if (m) {
      const y = Math.floor((m.y0 + 0.62 * tall(m)) / FLOOR) * FLOOR;
      if (m.shape === 'cyl') add(cyl(m.w / 2 + 0.25, m.w / 2 + 0.25, 1.2, 16, m.x, y, m.z, style.band));
      else add(box(m.w + 0.5, 1.2, m.d + 0.5, m.x, y, m.z, style.band));
    }
  }

  // Balconies: slabs every two floors on the two long faces (before ribs: ribs are dropped first when over budget).
  if (style.balconies) {
    for (const m of body) {
      if (m.shape !== 'box' || tall(m) < 10) continue;
      const alongX = m.w >= m.d;
      const F = alongX ? m.w : m.d;
      const half = (alongX ? m.d : m.w) / 2;
      let n = 0;
      for (let y = m.y0 + TILE_H; y <= m.y1 - 3 && n < 10; y += TILE_H, n++) {
        for (const s of [-1, 1]) {
          const off = s * (half + 1.1 / 2 - 0.05);
          const rail = s * (half + 1.1 - 0.05 - 0.04);
          if (alongX) {
            add(box(0.6 * F, 0.18, 1.1, m.x, y, m.z + off, 0xe8e4dc));
            add(box(0.6 * F, 0.9, 0.08, m.x, y + 0.18, m.z + rail, style.trim));
          } else {
            add(box(1.1, 0.18, 0.6 * F, m.x + off, y, m.z, 0xe8e4dc));
            add(box(0.08, 0.9, 0.6 * F, m.x + rail, y + 0.18, m.z, style.trim));
          }
        }
      }
    }
  }

  // Ribs: fins on the window-bay lines (every TILE_W from the face centre), 0.4 proud.
  if (style.ribs) {
    for (const m of body) {
      if (tall(m) < 10) continue;
      const y0 = m.y0 + 0.2, h = tall(m) - 0.6;
      if (m.shape === 'cyl') {
        const r = m.w / 2 + 0.2;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          add(box(0.35, h, 0.4, m.x + Math.sin(a) * r, y0, m.z + Math.cos(a) * r, style.trim, a));
        }
        continue;
      }
      const fins = (F: number): number[] => {
        const list: number[] = [];
        for (let k = -5; k <= 5; k++) if (Math.abs(k * TILE_W) <= F / 2 - 1) list.push(k * TILE_W);
        while (list.length > 5) { list.shift(); list.pop(); }
        return list;
      };
      for (const a of fins(m.w)) {
        add(box(0.35, h, 0.4, m.x + a, y0, m.z + m.d / 2 + 0.2, style.trim));
        add(box(0.35, h, 0.4, m.x + a, y0, m.z - m.d / 2 - 0.2, style.trim));
      }
      for (const a of fins(m.d)) {
        add(box(0.4, h, 0.35, m.x + m.w / 2 + 0.2, y0, m.z + a, style.trim));
        add(box(0.4, h, 0.35, m.x - m.w / 2 - 0.2, y0, m.z + a, style.trim));
      }
    }
  }

  // Scaffolding: a grid of bays up one long face of the tallest box mass, 0.3 m off the wall.
  if (style.weathering === 'scaffold') {
    const m = tallest((x) => x.shape === 'box');
    if (m) {
      const alongX = m.w >= m.d;
      const F = alongX ? m.w : m.d;
      const bay = 3.2, depth = 0.96;
      const cols = Math.max(1, Math.floor((F - 2) / bay));
      const top = m.y0 + 0.55 * tall(m);
      let n = 0;
      for (let y = LOBBY_H; y + bay <= Math.max(top, LOBBY_H + bay) && n < 40; y += bay) {
        for (let c = 0; c < cols && n < 40; c++, n++) {
          const a = (c - (cols - 1) / 2) * bay;
          const out0 = 0.3 + depth / 2;
          if (alongX) gear.push({ id: 'tower-scaffold', x: m.x + a, y, z: m.z + m.d / 2 + out0, yaw: 0, scale: 1.6 });
          else gear.push({ id: 'tower-scaffold', x: m.x + m.w / 2 + out0, y, z: m.z + a, yaw: Math.PI / 2, scale: 1.6 });
        }
      }
    }
  }
}
