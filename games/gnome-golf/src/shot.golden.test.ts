/// <reference types="node" />
// Golden test for Gnome Golf's ball physics: a fixed table of shots on the real course, run through simulateShot / previewShot.
// Captured BEFORE the physics moved into @lawn/golf. Regenerate only for a deliberate change:
//   GOLDEN_CAPTURE=1 npx vitest run --root games/gnome-golf src/shot.golden.test.ts
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { HOLES, type ClubId, type Lie, type ShotResult } from './config';
import { heightAt } from './course';
import { previewShot, simulateShot } from './physics';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'shot.golden.json');

const sha = (s: string): string => createHash('sha1').update(s).digest('hex').slice(0, 16);
const r9 = (n: number): number => Math.round(n * 1e9) / 1e9;
const f = (n: number): string => n.toFixed(9);

interface Spec { id: string; hole: number; at: 'tee' | 'green' | 'bunker' | 'path'; frac?: number; club: ClubId; lie: Lie; power: number; accuracy: number; yawOff: number; wind: number; preview?: boolean }

const SPECS: Spec[] = [
  { id: 'dr-tee-perfect', hole: 0, at: 'tee', club: 'DR', lie: 'tee', power: 1, accuracy: 0, yawOff: 0, wind: 0 },
  { id: 'dr-tee-wind', hole: 1, at: 'tee', club: 'DR', lie: 'tee', power: 1, accuracy: 0, yawOff: 0, wind: 9 },
  { id: 'dr-tee-slice', hole: 2, at: 'tee', club: 'DR', lie: 'tee', power: 1, accuracy: 1, yawOff: 0, wind: 4 },
  { id: 'dr-tee-over', hole: 3, at: 'tee', club: 'DR', lie: 'tee', power: 1.1, accuracy: -0.3, yawOff: 0.05, wind: 0 },
  { id: '3w-tee-hook', hole: 4, at: 'tee', club: '3W', lie: 'tee', power: 1, accuracy: -1, yawOff: 0, wind: 6 },
  { id: '4h-fw', hole: 5, at: 'path', frac: 0.4, club: '4H', lie: 'fairway', power: 1, accuracy: 0.5, yawOff: 0, wind: 3 },
  { id: '5i-fw-soft', hole: 6, at: 'path', frac: 0.5, club: '5I', lie: 'fairway', power: 0.4, accuracy: 0, yawOff: 0.1, wind: 0 },
  { id: '6i-rough', hole: 7, at: 'path', frac: 0.3, club: '6I', lie: 'rough', power: 1, accuracy: -0.3, yawOff: -0.1, wind: 8 },
  { id: '7i-fw', hole: 8, at: 'path', frac: 0.6, club: '7I', lie: 'fairway', power: 1, accuracy: 0, yawOff: 0, wind: 0 },
  { id: '8i-rough-wind', hole: 0, at: 'path', frac: 0.5, club: '8I', lie: 'rough', power: 1, accuracy: 0.5, yawOff: 0.02, wind: 11 },
  { id: '9i-fw', hole: 1, at: 'path', frac: 0.7, club: '9I', lie: 'fairway', power: 1, accuracy: -0.3, yawOff: 0, wind: 5 },
  { id: 'pw-fw-over', hole: 2, at: 'path', frac: 0.8, club: 'PW', lie: 'fairway', power: 1.1, accuracy: 0, yawOff: 0, wind: 0 },
  { id: 'gw-fringe', hole: 3, at: 'path', frac: 0.9, club: 'GW', lie: 'fringe', power: 0.4, accuracy: 0.5, yawOff: 0, wind: 2 },
  { id: 'sw-sand', hole: 4, at: 'bunker', club: 'SW', lie: 'sand', power: 1, accuracy: 0, yawOff: 0, wind: 0 },
  { id: 'sw-sand-hook', hole: 5, at: 'bunker', club: 'SW', lie: 'sand', power: 1.1, accuracy: -1, yawOff: 0.2, wind: 7 },
  { id: 'pw-sand', hole: 6, at: 'bunker', club: 'PW', lie: 'sand', power: 1, accuracy: 0.5, yawOff: 0, wind: 0 },
  { id: 'pt-green-1', hole: 0, at: 'green', club: 'PT', lie: 'green', power: 0.4, accuracy: 0, yawOff: 0, wind: 0 },
  { id: 'pt-green-2', hole: 1, at: 'green', club: 'PT', lie: 'green', power: 1, accuracy: 0.5, yawOff: 0.1, wind: 0 },
  { id: 'pt-green-3', hole: 2, at: 'green', club: 'PT', lie: 'green', power: 1.1, accuracy: -1, yawOff: 0, wind: 9 },
  { id: 'pt-green-4', hole: 7, at: 'green', club: 'PT', lie: 'green', power: 0.4, accuracy: -0.3, yawOff: -0.05, wind: 0 },
  { id: 'pt-fringe', hole: 8, at: 'path', frac: 0.97, club: 'PT', lie: 'fringe', power: 1, accuracy: 0, yawOff: 0, wind: 0 },
  { id: 'dr-water', hole: 3, at: 'tee', club: 'DR', lie: 'tee', power: 1, accuracy: 1, yawOff: 0.7, wind: 12 },
  { id: 'preview-dr', hole: 4, at: 'tee', club: 'DR', lie: 'tee', power: 1, accuracy: 0, yawOff: 0, wind: 0, preview: true },
  { id: 'preview-pt', hole: 5, at: 'green', club: 'PT', lie: 'green', power: 1, accuracy: 0, yawOff: 0.05, wind: 0, preview: true },
  { id: 'preview-7i', hole: 6, at: 'path', frac: 0.5, club: '7I', lie: 'fairway', power: 1, accuracy: 0, yawOff: 0, wind: 0, preview: true },
];

function startOf(s: Spec): { x: number; z: number } {
  const h = HOLES[s.hole];
  if (s.at === 'tee') return { x: h.tee.x, z: h.tee.z };
  if (s.at === 'green') return { x: h.green.x + 2.5, z: h.green.z - 3 };
  if (s.at === 'bunker') {
    const b = h.bunkers[0] ?? h.green;
    return { x: b.x, z: b.z };
  }
  const a = h.path[0];
  const b = h.path[h.path.length - 1];
  const fr = s.frac ?? 0.5;
  return { x: a.x + (b.x - a.x) * fr, z: a.z + (b.z - a.z) * fr };
}

function capture(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const s of SPECS) {
    const h = HOLES[s.hole];
    const p = startOf(s);
    const start = new THREE.Vector3(p.x, heightAt(p.x, p.z), p.z);
    const yaw = Math.atan2(h.pin.x - p.x, h.pin.z - p.z) + s.yawOff;
    const wind = { yaw: 0.6 + s.hole * 0.5, mph: s.wind };
    const r: ShotResult = s.preview
      ? previewShot(start, s.club, s.lie, yaw, h.pin)
      : simulateShot(start, { club: s.club, power: s.power, accuracy: s.accuracy, yaw }, s.lie, wind, h.pin, { noWind: s.wind === 0 });
    out[s.id] = {
      end: [f(r.end.x), f(r.end.y), f(r.end.z)],
      endLie: r.endLie,
      holed: r.holed,
      carry: f(r.carry),
      apex: f(r.apex),
      total: f(r.total),
      duration: f(r.duration),
      points: r.points.length,
      events: r.events.map((e) => e.kind).join(','),
      pointsHash: sha(r.points.map((q) => `${r9(q.x)},${r9(q.y)},${r9(q.z)}`).join(';')),
      drop: r.dropPoint ? [f(r.dropPoint.x), f(r.dropPoint.y), f(r.dropPoint.z)] : null,
    };
  }
  return out;
}

describe('gnome golf shot golden', () => {
  it('matches the captured fixture', () => {
    const got = capture();
    if (process.env.GOLDEN_CAPTURE) { writeFileSync(FIXTURE, JSON.stringify(got, null, 1) + '\n'); return; }
    expect(existsSync(FIXTURE)).toBe(true);
    const want = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, unknown>;
    expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort());
    for (const k of Object.keys(want)) expect([k, got[k]]).toEqual([k, want[k]]);
  });
});
