// Hedgeworth Links' places stay inside the E01 site and out of each other's way.
import { describe, expect, it } from 'vitest';
import { siteRect } from '../sites';
import {
  CART_PATHS, CART_SPOTS, CLUBHOUSE, HEDGE_ARCHES, HEDGES, HOLES, KICKED_BOARD, LOST_BALLS, MEMBERS_GATE, MOLEHILLS,
  MAZE_HEDGES, PRO_COTTAGE, SHED, TERRACE, TURN_GATE, YARD, distToLine, inPlay, inYard,
} from './types';

const site = siteRect('golf-yard');

describe('Hedgeworth Links places', () => {
  it('YARD is the golf-yard site', () => {
    expect(YARD).toEqual({ minX: site.minX, maxX: site.maxX, minZ: site.minZ, maxZ: site.maxZ });
  });

  it('every hole feature is inside the fence', () => {
    for (const h of HOLES) {
      for (const p of [h.tee, h.pin, ...h.path]) expect(inYard(p.x, p.z, 4), `${h.name} ${p.x},${p.z}`).toBe(true);
      expect(inYard(h.green.x - h.green.r, h.green.z - h.green.r, 2) && inYard(h.green.x + h.green.r, h.green.z + h.green.r, 2), h.name).toBe(true);
      for (const c of [...h.bunkers, ...h.ponds]) expect(inYard(c.x, c.z, c.r + 1), `${h.name} hazard`).toBe(true);
      expect(Math.hypot(h.pin.x - h.green.x, h.pin.z - h.green.z)).toBeLessThan(h.green.r - 2);
    }
  });

  it('buildings, gate, board and quest spots are in the yard and off the course', () => {
    for (const b of [CLUBHOUSE, PRO_COTTAGE]) {
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const x = b.x + (dx * b.w) / 2, z = b.z + (dz * b.d) / 2;
        expect(inYard(x, z, 1), `${x},${z}`).toBe(true);
        expect(inPlay(x, z, 1), `${x},${z}`).toBe(false);
      }
    }
    // The shed faces west (yaw -PI/2): its width runs along z.
    expect(inPlay(SHED.x, SHED.z, Math.max(SHED.w, SHED.d) / 2 + 1)).toBe(false);
    expect(inYard(SHED.x, SHED.z, 6)).toBe(true);
    for (const s of [...LOST_BALLS, ...CART_SPOTS]) {
      expect(inYard(s.x, s.z, 2), `${s.x},${s.z}`).toBe(true);
    }
    for (const s of LOST_BALLS) expect(inPlay(s.x, s.z), s.id).toBe(false);
    for (const m of MOLEHILLS) {
      const g = HOLES[3].green;
      expect(Math.hypot(m.x - g.x, m.z - g.z), m.id).toBeLessThan(g.r + 8);
    }
    expect(KICKED_BOARD.x).toBe(YARD.maxX - 1);
    expect(MEMBERS_GATE.x).toBe(YARD.maxX - 1);
    expect(TERRACE.minZ).toBeGreaterThanOrEqual(CLUBHOUSE.z + CLUBHOUSE.d / 2);
  });

  it('hedge walls keep off the holes, and arches stand on a hedge line', () => {
    for (const hd of HEDGES) {
      for (let t = 0; t <= 1; t += 0.05) {
        const x = hd.a[0] + (hd.b[0] - hd.a[0]) * t, z = hd.a[1] + (hd.b[1] - hd.a[1]) * t;
        expect(inPlay(x, z, 3), `hedge ${x},${z}`).toBe(false);
        expect(inYard(x, z, 3)).toBe(true);
      }
    }
    for (const a of HEDGE_ARCHES) {
      const on = HEDGES.some((hd) => distToLine([{ x: hd.a[0], z: hd.a[1] }, { x: hd.b[0], z: hd.b[1] }], a.x, a.z).dist < 0.5);
      expect(on, `${a.x},${a.z}`).toBe(true);
    }
  });

  it('cart paths stay inside the fence apart from the gate end, and off the greens', () => {
    for (const p of CART_PATHS) {
      for (const [x, z] of p) {
        expect(x <= YARD.maxX && x >= YARD.minX && z >= YARD.minZ && z <= YARD.maxZ).toBe(true);
        for (const h of HOLES) expect(Math.hypot(x - h.green.x, z - h.green.z)).toBeGreaterThan(h.green.r + 5);
      }
    }
  });

  it('maze hedges keep off every hole but 5', () => {
    for (const m of MAZE_HEDGES) {
      for (let t = 0; t <= 1; t += 0.1) {
        const x = m.a[0] + (m.b[0] - m.a[0]) * t, z = m.a[1] + (m.b[1] - m.a[1]) * t;
        for (const h of HOLES) {
          if (h.index === 5) continue;
          expect(distToLine(h.path, x, z).dist, `maze ${x},${z} vs hole ${h.number} fairway`).toBeGreaterThan(h.fairwayWidth / 2 + 1);   // +1: the east wall is 1.2 m clear of hole 6's tee fairway
          expect(Math.hypot(x - h.green.x, z - h.green.z), `maze ${x},${z} vs hole ${h.number} green`).toBeGreaterThan(h.green.r + 3);
          expect(Math.max(Math.abs(x - h.tee.x), Math.abs(z - h.tee.z)), `maze ${x},${z} vs hole ${h.number} tee`).toBeGreaterThan(2.5 + 2);
        }
      }
    }
  });

  it('the Turn Gate opening is on the cart path', () => {
    // The Bottom Garden path runs (-1140, 822) -> (-1140, 840): it crosses z 829 inside the opening.
    const p = CART_PATHS.find((q) => q.some(([x, z]) => x === -1140 && z === 822));
    expect(p).toBeTruthy();
    const i = p!.findIndex(([x, z]) => x === -1140 && z === 822);
    const [ax, az] = p![i], [bx, bz] = p![i + 1];
    expect(Math.min(az, bz)).toBeLessThan(TURN_GATE.z);
    expect(Math.max(az, bz)).toBeGreaterThan(TURN_GATE.z);
    const x = ax + ((bx - ax) * (TURN_GATE.z - az)) / (bz - az);
    expect(Math.abs(x - TURN_GATE.x)).toBeLessThan(TURN_GATE.half);
  });
});
