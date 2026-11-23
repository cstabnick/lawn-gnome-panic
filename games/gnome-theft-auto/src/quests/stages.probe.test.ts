// Dev tool, skipped unless PROBE is set: prints an ASCII map of the built world around points, for placing stage spots.
//   PROBE="-10,18;0,-72" PROBE_R=24 PROBE_S=2 npx vitest run src/quests/stages.probe.test.ts   (from games/gnome-theft-auto)
// Legend: '#' building collider, 's' a stage set prop's collider, '=' road, '~' water, '@' the point itself.
// Rows run from north (-z, top) to south (+z); columns from west (-x, left) to east. The header gives region and height.
import { it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';

const env = (globalThis as unknown as { process: { env: Record<string, string | undefined>; stdout: { write(s: string): void } } }).process;

it.skipIf(!env.env.PROBE)('probe', async () => {
  installFakeDom();
  const { buildWorld } = await import('../world');
  const { heightAt, waterAt } = await import('../terrain');
  const { regionAt, highways } = await import('../levels');
  const { ROAD_LINES, CITY_HALF } = await import('../config');
  const { stageSetBoxes } = await import('./stages');
  const world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
  const sets = stageSetBoxes();
  const HW = highways();
  const onRoad = (x: number, z: number): boolean => {
    if (Math.abs(x) <= CITY_HALF && Math.abs(z) <= CITY_HALF) for (const r of ROAD_LINES) if (Math.abs(x - r) < 5 || Math.abs(z - r) < 5) return true;
    for (const h of HW) for (let i = 0; i < h.points.length - 1; i++) {
      const [ax, az] = h.points[i];
      const [bx, bz] = h.points[i + 1];
      const dx = bx - ax, dz = bz - az;
      const l = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (l || 1)));
      if (Math.hypot(x - (ax + t * dx), z - (az + t * dz)) < h.width / 2) return true;
    }
    return false;
  };
  const inside = (boxes: readonly { minX: number; maxX: number; minZ: number; maxZ: number }[], x: number, z: number): boolean =>
    boxes.some((b) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ);
  const pts = (env.env.PROBE ?? '0,0').split(';').map((s) => s.split(',').map(Number));
  const R = Number(env.env.PROBE_R ?? 24), S = Number(env.env.PROBE_S ?? 2);
  const out: string[] = [];
  for (const [px, pz] of pts) {
    out.push(`### ${px},${pz} region=${regionAt(px, pz)} h=${heightAt(px, pz).toFixed(2)} water=${waterAt(px, pz) ? 'Y' : 'n'}  (rows z ${pz - R}..${pz + R}, cols x ${px - R}..${px + R}, step ${S})`);
    for (let z = pz - R; z <= pz + R; z += S) {
      let row = `${String(z).padStart(5)} `;
      for (let x = px - R; x <= px + R; x += S) {
        row += x === px && z === pz ? '@' : inside(world.boxes, x, z) ? '#' : inside(sets, x, z) ? 's' : waterAt(x, z) ? '~' : onRoad(x, z) ? '=' : '.';
      }
      out.push(row);
    }
  }
  env.stdout.write(`${out.join('\n')}\n`);
}, 120_000);
