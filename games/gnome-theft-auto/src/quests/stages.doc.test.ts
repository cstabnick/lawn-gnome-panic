// Writes the generated part of docs/design/gnome-theft-auto/environments.md from the stage data (CAST and STAGES), so
// the document never drifts from the coordinates. Skipped unless WRITE_STAGE_DOC=1:
//   WRITE_STAGE_DOC=1 npx vitest run src/quests/stages.doc.test.ts      (from games/gnome-theft-auto)
// Everything above the "<!-- GENERATED -->" line in the document is hand-written and kept.
import { it } from 'vitest';
import { REGIONS, type RegionId } from '../levels';
import { QUESTS } from './defs';
import { CAST, STAGES, type Stage, vehicleMark } from './stages';

const NODE_FS = 'node:fs';
type Fs = { readFileSync(p: URL, enc: 'utf8'): string; writeFileSync(p: URL, text: string): void };
const ENV = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const DOC = new URL('../../../../docs/design/gnome-theft-auto/environments.md', import.meta.url);
const MARKER = '<!-- GENERATED -->';

const xz = (p: readonly [number, number]): string => `(${Math.round(p[0])}, ${Math.round(p[1])})`;
const deg = (yaw: number): string => {
  const d = ((Math.round((yaw * 180) / Math.PI) % 360) + 360) % 360;
  const names = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'];
  return names[Math.round(d / 45) % 8];
};
const ownerName = (id: string | undefined): string => (id ? CAST.find((c) => c.id === id)?.name ?? id : '');

function stageSection(s: Stage): string {
  const out: string[] = [];
  out.push(`### ${s.name} \`${s.id}\``);
  out.push('');
  const facts = [
    `**Where:** ${REGIONS[s.region].name}, centre ${xz(s.center)}, radius ${s.radius} m, facing ${deg(s.facing)}${s.water ? ', boat scene' : ''}.`,
    `**Default time:** ${s.time}. **Built:** ${s.built === 'existing' ? 'already in the world' : s.built === 'dressed' ? 'in the world, plus stage set dressing' : 'new: exists through its stage set dressing'}.`,
  ];
  if (s.room) facts.push(`**Inside:** the off-map cutscene room \`${s.room}\`.`);
  if (s.givers?.length) facts.push(`**Quest giver marker:** ${s.givers.map((g) => `\`${g}\``).join(', ')}.`);
  facts.push(`**Used by:** ${s.usedBy.map((q) => `\`${q}\``).join(', ')}.`);
  out.push(facts.join(' '));
  out.push('');
  out.push(`**Looks:** ${s.look}`);
  out.push('');
  out.push(`**Sounds:** ${s.sounds}`);
  out.push('');
  if (s.marks.length) {
    out.push('**Who is there (marks):**');
    for (const m of s.marks) out.push(`- \`${m.who}\` at ${xz(m.at)} facing ${deg(m.yaw)}, ${m.pose}${m.lift ? ` (${m.lift} m up)` : ''}${m.note ? `: ${m.note}` : ''}`);
    out.push('');
  }
  if (s.walks.length) {
    out.push('**What they do while idle (walks):**');
    for (const w of s.walks) out.push(`- \`${w.who}\` (${w.loop ? 'loop' : 'back and forth'}, ${w.points.length} points, ${w.speed} m/s, ${w.pauseS} s stops): ${w.activity}`);
    out.push('');
  }
  if (s.vehicles.length) {
    out.push('**Vehicles:**');
    for (const v of s.vehicles) {
      const own = ownerName(v.owner);
      out.push(`- \`${v.id}\`: ${v.role} ${v.kind} at ${xz(v.at)} facing ${deg(v.yaw)}${own ? `, ${own}'s` : ''}${v.note ? `: ${v.note}` : ''}`);
    }
    out.push('');
  }
  if (s.paths.length) {
    out.push('**Drive paths:**');
    for (const p of s.paths) out.push(`- \`${p.id}\`: ${p.role}, ${p.kind}, ${xz(p.points[0])} to ${xz(p.points[p.points.length - 1])} (${p.points.length} points${p.offRoad ? ', off-road' : ''})${p.note ? `: ${p.note}` : ''}`);
    out.push('');
  }
  if (s.cameras.length) {
    out.push(`**Cameras:** ${s.cameras.map((c) => `\`${c.id}\` (${c.note})`).join('; ')}.`);
    out.push('');
  }
  if (s.set.length) {
    const counts = new Map<string, number>();
    for (const p of s.set) counts.set(p.prefab, (counts.get(p.prefab) ?? 0) + 1);
    out.push(`**Set dressing (prefabs):** ${[...counts].map(([id, n]) => `${n > 1 ? `${n} x ` : ''}\`${id}\``).join(', ')}.`);
    out.push('');
  }
  return out.join('\n');
}

function generate(): string {
  const out: string[] = [MARKER, '', '<!-- Everything below is generated from src/quests/stages.ts by src/quests/stages.doc.test.ts. Do not edit by hand. -->', ''];
  out.push('## Story and side-quest beats: where each one happens', '');
  out.push('| Quest | Chapter | Stages |', '|---|---|---|');
  for (const q of QUESTS) {
    const at = STAGES.filter((s) => s.usedBy.includes(q.id)).map((s) => `\`${s.id}\``).join(', ');
    out.push(`| ${q.title} \`${q.id}\` | ${q.chapter ?? 'side'} | ${at} |`);
  }
  out.push('');
  out.push('## The cast: where they live, what they drive', '');
  out.push('| Character | Home | Also found at | Vehicle (parked at) | Daily routine |');
  out.push('|---|---|---|---|---|');
  for (const c of CAST) {
    const v = c.vehicle;
    const at = v ? vehicleMark(v.parkedAt) : undefined;
    const ride = v ? `${v.kind}: ${v.note} (\`${v.parkedAt}\`${at ? ` at ${xz(at.mark.at)}` : ''})` : 'walks';
    out.push(`| **${c.name}** \`${c.id}\` | \`${c.home}\` | ${c.haunts.map((h) => `\`${h}\``).join(', ') || '-'} | ${ride} | ${c.routine} |`);
  }
  out.push('', 'Glaze looks (Pay \'n\' Glaze loadouts, `Partial<Loadout>`) are in `CAST[].vehicle.glaze`.', '');
  out.push('## Stages by region', '');
  const order: RegionId[] = ['turfton', 'cloverfield-farms', 'mossy-wood', 'frostbite-fells', 'dust-flats', 'loch-moss', 'tallgrass-commons'];
  for (const r of order) {
    const list = STAGES.filter((s) => s.region === r);
    if (!list.length) continue;
    out.push(`## ${REGIONS[r].name}`, '');
    for (const s of list) out.push(stageSection(s));
  }
  out.push('## Built for these stages (prefab parts lists)', '');
  out.push('The stages marked new were built in the world from `@lawn/prefabs` set dressing (`src/stageSets.ts` builds every stage\'s `set`; solid props get colliders):', '');
  for (const s of STAGES.filter((x) => x.built === 'new')) {
    out.push(`- **${s.name}** \`${s.id}\` at ${xz(s.center)}: ${s.set.map((p) => `\`${p.prefab}\`${p.scale && p.scale !== 1 ? ` x${p.scale}` : ''}`).join(', ')}`);
  }
  out.push('');
  return out.join('\n');
}

it.skipIf(ENV.WRITE_STAGE_DOC !== '1')('write environments.md', async () => {
  const fs = (await import(/* @vite-ignore */ NODE_FS)) as Fs;
  const doc = fs.readFileSync(DOC, 'utf8');
  const head = doc.includes(MARKER) ? doc.slice(0, doc.indexOf(MARKER)) : `${doc.trimEnd()}\n\n`;
  fs.writeFileSync(DOC, `${head}${generate()}`);
});
