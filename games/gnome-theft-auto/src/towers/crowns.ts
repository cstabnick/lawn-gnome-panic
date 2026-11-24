// Tower crowns: what stands on the roof. Architecture (spire, sail, pyramid, fins, drums) is kit geometry merged into
// the tower meshes; roof gear (tanks, masts, dishes, the helipad, planters, the clock, the gnome hat) is prefabs from
// packages/prefabs/src/catalog/gta-towers.ts, baked into one static batch by index.ts.
import * as THREE from 'three';
import type { StaticPrefabPlacement } from '@lawn/prefabs';
import { ball, box, capTop, colored, cyl } from './kit';
import type { Crown, Mass, TowerGeoms, TowerSpec, TowerStyle } from './types';

const RED_LIGHT = 0xff3030;
const WARM_LIGHT = 0xfff2c0;
/** Crowns that rise more than 2 m: a capped tower (under the intro flyover) gets 'flat' instead. */
const TALL: readonly Crown[] = ['spire', 'sail', 'pyramid', 'antenna-farm', 'gnome-hat', 'clock', 'water-tank', 'crown-ring'];

/** Adds the crown of one tower to `out` (kit geometry) and `gear` (roof prefabs). */
export function buildCrown(
  spec: TowerSpec, style: TowerStyle, masses: readonly Mass[], out: TowerGeoms, gear: StaticPrefabPlacement[], rnd: () => number,
): void {
  let top = masses[0];
  for (const m of masses) if (m.y1 > top.y1 + 1e-6) top = m;
  const roofY = capTop(top);
  const rw = top.w, rd = top.shape === 'cyl' ? top.w : top.d;
  const cx = top.x, cz = top.z;
  const m = Math.min(rw, rd);
  const L = Math.max(rw, rd);
  const alongX = rw >= rd;
  let crown = style.crown;
  if (spec.capped && TALL.includes(crown)) crown = 'flat';

  /** Inside the roof, `margin` metres from its edge (a round roof counts as its square). */
  const inRoof = (x: number, z: number, margin = 1): boolean =>
    Math.abs(x - cx) <= rw / 2 - margin && Math.abs(z - cz) <= rd / 2 - margin;
  const put = (id: string, x: number, z: number, scale: number, extra: Partial<StaticPrefabPlacement> = {}, y = roofY): void => {
    gear.push({ id, x, y, z, scale, ...extra });
  };
  /** A random spot on the roof `margin` from the edges and `clear` from the centre (null after 12 misses). */
  const spot = (margin: number, clear: number, taken: [number, number][] = [], apart = 0): [number, number] | null => {
    for (let i = 0; i < 12; i++) {
      const x = cx + (rnd() - 0.5) * (rw - 2 * margin), z = cz + (rnd() - 0.5) * (rd - 2 * margin);
      if (!inRoof(x, z, margin) || Math.hypot(x - cx, z - cz) < clear) continue;
      if (taken.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < apart)) continue;
      return [x, z];
    }
    return null;
  };

  // Clutter: air-conditioning units on most roofs.
  if (crown !== 'garden' && crown !== 'helipad' && crown !== 'billboard' && m > 6) {
    const n = m < 8 ? 1 : 1 + Math.floor(rnd() * 3);
    const taken: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const p = spot(1.5, Math.min(2 + 0.2 * m, m / 2 - 1.6), taken, 2.5);
      if (!p) break;
      taken.push(p);
      put('tower-hvac', p[0], p[1], 1.6, { yaw: Math.floor(rnd() * 4) * (Math.PI / 2) });
    }
  }

  switch (crown) {
    case 'flat':
    case 'billboard':
      break;
    case 'spire': {
      out.trim.push(cyl(0.18 * m, 0.22 * m, 2, 8, cx, roofY, cz, style.trim));
      const nh = Math.min(16, 0.25 * spec.h);
      out.metal.push(cyl(0.12, 0.5, nh, 8, cx, roofY + 2, cz, style.accent));
      out.glow.push(ball(0.35, cx, roofY + 2 + nh, cz, RED_LIGHT));
      break;
    }
    case 'sail': {
      // Seven thin plates stacked up and shifted toward one end: a fin that sweeps back like a sail.
      let tipA = 0, tipY = roofY;
      for (let k = 0; k < 7; k++) {
        const len = 0.7 * L * (1 - k / 7.5);
        let a = 0.6 * k - 0.15 * L;
        a = Math.max(-L / 2 + len / 2 + 0.3, Math.min(L / 2 - len / 2 - 0.3, a));
        const y = roofY + 2.1 * k;
        out.metal.push(alongX ? box(len, 2.2, 0.4, cx + a, y, cz, style.accent) : box(0.4, 2.2, len, cx, y, cz + a, style.accent));
        tipA = a + len / 2;
        tipY = y + 2.2;
      }
      out.glow.push(ball(0.3, alongX ? cx + tipA : cx, tipY + 0.2, alongX ? cz : cz + tipA, RED_LIGHT));
      break;
    }
    case 'pyramid': {
      const ph = 0.45 * m;
      const g = new THREE.ConeGeometry(0.62 * m, ph, 4).rotateY(Math.PI / 4).translate(cx, roofY + ph / 2, cz);
      out.metal.push(colored(g, style.accent));
      out.glow.push(ball(0.4, cx, roofY + ph, cz, WARM_LIGHT));
      break;
    }
    case 'crown-ring': {
      const r = 0.36 * m;
      out.trim.push(cyl(0.3 * m, 0.3 * m, 3, 12, cx, roofY, cz, style.trim));
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        out.metal.push(box(0.35, 5 + 3 * (k % 2), 1.2, cx + Math.sin(a) * r, roofY, cz + Math.cos(a) * r, style.accent, a));
      }
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        out.glow.push(ball(0.25, cx + Math.sin(a) * r * 0.82, roofY + 3.2, cz + Math.cos(a) * r * 0.82, WARM_LIGHT));
      }
      break;
    }
    case 'clock':
      out.trim.push(box(0.5 * m, 1.2, 0.5 * m, cx, roofY, cz, style.trim));
      put('tower-clock', cx, cz, (0.42 * m) / 1.2, { tint: style.accent }, roofY + 1.2);
      break;
    case 'water-tank': {
      const corners: [number, number, number][] = [[1, 1, 2.6], [-1, -1, 2.2]];
      for (const [sx, sz, sc] of corners.slice(0, m > 20 ? 2 : 1)) {
        const px = cx + sx * 0.2 * m, pz = cz + sz * 0.2 * m;
        out.trim.push(box(0.3 * m, 0.5, 0.3 * m, px, roofY, pz, 0x6b6b70));
        put('tower-water-tank', px, pz, sc, { tint: style.accent }, roofY + 0.5);
      }
      break;
    }
    case 'helipad':
      put('tower-helipad', cx, cz, Math.min(4, (0.8 * m) / 3), { tint: style.accent });
      break;
    case 'garden': {
      let n = 0;
      // Planters run round the edge, 1.2 m in, turned along it.
      for (const side of [-1, 1]) {
        for (let a = -rw / 2 + 2.5; a <= rw / 2 - 2.5 && n < 16; a += 4, n++) put('tower-planter', cx + a, cz + side * (rd / 2 - 1.2), 2, { yaw: 0 });
        for (let a = -rd / 2 + 4; a <= rd / 2 - 4 && n < 16; a += 4, n++) put('tower-planter', cx + side * (rw / 2 - 1.2), cz + a, 2, { yaw: Math.PI / 2 });
      }
      if (!spec.capped) {
        const trees = 2 + Math.floor(rnd() * 3);
        const taken: [number, number][] = [];
        for (let i = 0; i < trees; i++) {
          const p = spot(3, 3, taken, 2.5);
          if (!p) break;
          taken.push(p);
          put('tower-roof-tree', p[0], p[1], 2);
        }
        put('tower-pergola', cx, cz, 2.2, { yaw: alongX ? 0 : Math.PI / 2 });
      }
      break;
    }
    case 'antenna-farm': {
      const masts = 3 + Math.floor(rnd() * 3);
      const taken: [number, number][] = [];
      for (let i = 0; i < masts; i++) {
        const p = spot(1.5, 0, taken, 3);
        if (!p) break;
        taken.push(p);
        put('tower-mast', p[0], p[1], 2.5 + rnd() * 1.5);
      }
      for (let i = 0; i < 2; i++) {
        const p = spot(1.5, 0, taken, 2.5);
        if (!p) break;
        taken.push(p);
        put('tower-dish', p[0], p[1], 2.2, { yaw: rnd() * Math.PI * 2 });
      }
      break;
    }
    case 'gnome-hat':
      out.trim.push(cyl(0.3 * m, 0.32 * m, 1.5, 12, cx, roofY, cz, style.trim));
      put('tower-gnome-hat', cx, cz, (0.55 * m) / 1.2, { tint: style.accent, trim: 0xd4af37 }, roofY + 1.5);
      break;
  }

  // An aircraft warning light on tall towers whose crown has none of its own.
  if (spec.h > 50 && crown !== 'spire' && crown !== 'sail' && crown !== 'pyramid' && top.shape === 'box') {
    const px = cx + rw / 2 - 1, pz = cz + rd / 2 - 1;
    out.metal.push(cyl(0.08, 0.08, 2.5, 6, px, roofY, pz, 0x55585e));
    out.glow.push(ball(0.3, px, roofY + 2.8, pz, RED_LIGHT));
  }
}
