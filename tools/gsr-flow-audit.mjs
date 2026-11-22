#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const levelsDir = join(process.cwd(), 'games/gnome-set-radio/src/data/levels');
const files = readdirSync(levelsDir).filter((f) => f.endsWith('.level.json'));

let failed = false;
for (const file of files) {
  const doc = JSON.parse(readFileSync(join(levelsDir, file), 'utf8'));
  const spawn = doc.markers.find((m) => m.kind === 'spawn') ?? { x: 0, z: 36 };
  let lead = Infinity;
  for (const r of doc.data.rails) {
    for (const p of r.points) lead = Math.min(lead, Math.hypot(p[0] - spawn.x, p[2] - spawn.z));
  }
  for (const r of doc.data.ramps) {
    lead = Math.min(lead, Math.hypot(r.x - spawn.x, r.z - spawn.z));
  }
  const ok = lead <= 28;
  if (!ok) failed = true;
  console.log(`${doc.id}: spawnLeadIn=${lead.toFixed(1)}m, rails=${doc.data.rails.length}, ramps=${doc.data.ramps.length} ${ok ? 'OK' : 'TOO FAR'}`);
}
if (failed) process.exit(1);
