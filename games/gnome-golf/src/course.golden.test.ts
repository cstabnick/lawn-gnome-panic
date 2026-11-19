/// <reference types="node" />
// Golden test for Gnome Golf's course: the island and every hole as data, and the ground height and lie sampled on a grid.
// Captured from config.ts / course.ts BEFORE the course moved into a level document.
// Regenerate only for a deliberate change:  GOLDEN_CAPTURE=1 npx vitest run --root games/gnome-golf src/course.golden.test.ts
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { HOLES, ISLAND } from './config';
import { gradientAt, heightAt, holeLength, lieAt } from './course';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'course.golden.json');

function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, canon(o[k])]));
  }
  return typeof v === 'number' ? Math.round(v * 1e9) / 1e9 : v;
}
const sha = (s: string): string => createHash('sha1').update(s).digest('hex').slice(0, 16);
const hash = (v: unknown): string => sha(JSON.stringify(canon(v)));
const f = (n: number): string => n.toFixed(9);

function capture(): Record<string, string | number> {
  const g: Record<string, string | number> = { holes: HOLES.length, island: hash(ISLAND), holesData: hash(HOLES) };
  HOLES.forEach((h, i) => { g[`hole${i + 1}`] = hash(h); g[`hole${i + 1}|length`] = f(holeLength(h)); });
  const xs: number[] = [], zs: number[] = [];
  for (let x = -700; x <= 700; x += 20) xs.push(x);
  for (let z = -560; z <= 560; z += 20) zs.push(z);
  const heights: string[] = [], lies: string[] = [], grads: string[] = [];
  for (const x of xs) for (const z of zs) {
    heights.push(f(heightAt(x, z)));
    lies.push(lieAt(x, z));
  }
  // The gradient (ball roll) near every green and tee, where the ground is shaped by hand.
  for (const h of HOLES) for (const p of [h.green, h.tee, h.pin]) for (const [dx, dz] of [[0, 0], [3, 0], [0, 3], [-4, 2]]) {
    const gr = gradientAt(p.x + dx, p.z + dz);
    grads.push(`${f(gr.gx)}/${f(gr.gz)}`);
  }
  g.heights = sha(heights.join(','));
  g.lies = sha(lies.join(','));
  g.gradients = sha(grads.join(','));
  return g;
}

describe('gnome golf course golden', () => {
  it('matches the captured fixture', () => {
    const got = capture();
    if (process.env.GOLDEN_CAPTURE) { writeFileSync(FIXTURE, JSON.stringify(got, null, 1) + '\n'); return; }
    expect(existsSync(FIXTURE)).toBe(true);
    const want = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, string | number>;
    expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort());
    for (const k of Object.keys(want)) expect([k, got[k]]).toEqual([k, want[k]]);
  });
});
