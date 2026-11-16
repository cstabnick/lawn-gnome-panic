// Content linter: bundles src/content.ts with esbuild, loads it in Node, and checks every pack for
// dangling references (ids that no pack defines) and for things placed where nobody can reach them
// (inside a house, the shrine, a lake or off the map).
// Usage (from the repo root): node games/gnomes-of-gnomomia/scripts/lint-content.mjs [packId ...]
// With pack ids, only problems from those packs are printed. Exit code 1 when any error is found.
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'gnomomia-lint-'));
const out = join(dir, 'content.mjs');
await build({
  entryPoints: [join(here, '../src/content.ts')], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
  // config.ts imports only types from three and @lawn/gnome; anything else is a bug in a pack.
  external: ['three', '@lawn/gnome'],
});
let C;
try {
  globalThis.__GNOMOMIA_LINT__ = true;   // content.ts collects load errors instead of throwing
  C = await import(pathToFileURL(out).href);
} catch (e) {
  console.log(`LOAD ERROR: ${e.message}`);
  process.exit(1);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const only = new Set(process.argv.slice(2));
const problems = [];
const report = (pack, level, msg) => {
  if (only.size && !only.has(pack)) return;
  problems.push({ pack, level, msg });
};

for (const msg of C.LOAD_ERRORS ?? []) {
  const pack = /in pack (\S+)/.exec(msg)?.[1] ?? '?';
  report(pack, 'error', `load: ${msg}`);
}

// Which pack defined each id (for attributing problems).
const owner = { item: {}, enemy: {}, npc: {}, quest: {}, object: {} };
for (const p of C.PACKS) {
  for (const id of Object.keys(p.items ?? {})) owner.item[id] = p.id;
  for (const id of Object.keys(p.enemies ?? {})) owner.enemy[id] = p.id;
  for (const id of Object.keys(p.npcs ?? {})) owner.npc[id] = p.id;
  for (const id of Object.keys(p.quests ?? {})) owner.quest[id] = p.id;
  for (const id of Object.keys(p.objects ?? {})) owner.object[id] = p.id;
}

const need = (pack, kind, id, where) => {
  const table = { item: C.ITEMS, enemy: C.ENEMIES, npc: C.NPCS, quest: C.QUESTS, object: C.OBJECTS }[kind];
  if (!(id in table)) report(pack, 'error', `${where}: unknown ${kind} '${id}'`);
};
const zoneOk = (pack, z, where) => { if (!(z in C.ZONES)) report(pack, 'error', `${where}: unknown zone '${z}'`); };

function checkCond(pack, c, where) {
  if (!c) return;
  if (c.quest) need(pack, 'quest', c.quest.id, where);
  if (c.questStage) {
    need(pack, 'quest', c.questStage.id, where);
    const q = C.QUESTS[c.questStage.id];
    if (q && c.questStage.stage >= q.stages.length) report(pack, 'error', `${where}: questStage ${c.questStage.id} stage ${c.questStage.stage} >= ${q.stages.length} stages (never true)`);
  }
  if (c.questAtLeast) need(pack, 'quest', c.questAtLeast.id, where);
  if (c.hasItem) need(pack, 'item', c.hasItem.item, where);
  if (c.not) checkCond(pack, c.not, where);
}
function checkAction(pack, a, where) {
  if (!a) return;
  if (a.type === 'startQuest') need(pack, 'quest', a.quest, where);
  if (a.type === 'giveItem' || a.type === 'takeItem') need(pack, 'item', a.item, where);
  if (a.type === 'travel') zoneOk(pack, a.zone, where);
}
function checkOptions(pack, npcId, opts, where) {
  const npc = C.NPCS[npcId];
  for (const o of opts) {
    checkCond(pack, o.when, `${where} option "${o.text}"`);
    checkAction(pack, o.action, `${where} option "${o.text}"`);
    if (o.next && npc && !(o.next in npc.nodes)) report(pack, 'error', `${where} option "${o.text}": next node '${o.next}' missing on ${npcId}`);
  }
}

/** Why a point is unreachable in its zone, or null. */
function blockedReason(zoneId, x, z) {
  const zone = C.ZONES[zoneId];
  if (!zone) return null;
  if (Math.abs(x) > zone.half - 3 || Math.abs(z) > zone.half - 3) return `off the map (half ${zone.half})`;
  if (Math.hypot(x - zone.shrine.x, z - zone.shrine.z) < 1.6) return 'on the shrine';
  for (const h of zone.houses) if (Math.hypot(x - h.x, z - h.z) < h.r + 0.6) return `inside a ${h.style} house at (${h.x}, ${h.z}) r ${h.r}`;
  for (const l of zone.lakes) if (Math.hypot(x - l.x, z - l.z) < l.r * 0.85) return `in the lake at (${l.x}, ${l.z}) r ${l.r}`;
  return null;
}
const place = (pack, zone, x, z, where) => {
  zoneOk(pack, zone, where);
  const why = blockedReason(zone, x, z);
  if (why) report(pack, 'error', `${where} at (${x}, ${z}) in ${zone} is ${why}`);
};

for (const p of C.PACKS) {
  for (const it of Object.values(p.items ?? {})) {
    if (it.kind !== 'potion' && it.kind !== 'misc' && it.ilvl === undefined) report(p.id, 'warn', `item ${it.id}: equippable without ilvl`);
    if ((it.kind === 'weapon' || it.kind === 'armor' || it.kind === 'offhand' || it.kind === 'trinket') && !it.slot) report(p.id, 'error', `item ${it.id}: ${it.kind} without slot`);
  }
  for (const e of Object.values(p.enemies ?? {})) {
    for (const d of e.loot) need(p.id, 'item', d.item, `enemy ${e.id} loot`);
    for (const m of e.moves ?? []) if (m.summon) need(p.id, 'enemy', m.summon.enemy, `enemy ${e.id} move ${m.id}`);
    if (!e.wants) report(p.id, 'warn', `enemy ${e.id}: no wants`);
  }
  for (const n of Object.values(p.npcs ?? {})) {
    place(p.id, n.zone, n.x, n.z, `npc ${n.id}`);
    for (const pl of n.placements ?? []) { place(p.id, pl.zone, pl.x, pl.z, `npc ${n.id} placement`); checkCond(p.id, pl.when, `npc ${n.id} placement`); }
    checkCond(p.id, n.hidden, `npc ${n.id} hidden`);
    for (const g of n.greetings) { checkCond(p.id, g.when, `npc ${n.id} greeting`); if (!(g.node in C.NPCS[n.id].nodes)) report(p.id, 'error', `npc ${n.id} greeting: node '${g.node}' missing`); }
    for (const [nid, node] of Object.entries(n.nodes)) checkOptions(p.id, n.id, node.options, `npc ${n.id} node ${nid}`);
    for (const s of n.shop ?? []) need(p.id, 'item', s, `npc ${n.id} shop`);
  }
  for (const q of Object.values(p.quests ?? {})) {
    need(p.id, 'npc', q.giver, `quest ${q.id} giver`);
    zoneOk(p.id, q.zone, `quest ${q.id}`);
    q.stages.forEach((s, i) => {
      const o = s.objective; const w = `quest ${q.id} stage ${i}`;
      if (o.type === 'kill') need(p.id, 'enemy', o.enemy, w);
      if (o.type === 'collect') need(p.id, 'item', o.item, w);
      if (o.type === 'talk') need(p.id, 'npc', o.npc, w);
      if (o.type === 'interact') need(p.id, 'object', o.object, w);
      if (o.type === 'escort') { need(p.id, 'npc', o.npc, w); zoneOk(p.id, o.zone, w); }
      if (o.type === 'reach' || o.type === 'defend') zoneOk(p.id, o.zone, w);
      if (o.type === 'defend') for (const wv of o.waves) need(p.id, 'enemy', wv.enemy, w);
      for (const t of s.takeItems ?? []) need(p.id, 'item', t.item, `${w} takeItems`);
    });
    for (const r of q.reward.items) need(p.id, 'item', r.item, `quest ${q.id} reward`);
    // Every quest must be startable from some dialogue option somewhere.
  }
  for (const s of p.spawns ?? []) {
    need(p.id, 'enemy', s.enemy, `spawn ${s.enemy}`);
    place(p.id, s.zone, s.x, s.z, `spawn ${s.enemy}`);
    checkCond(p.id, s.when, `spawn ${s.enemy}`);
  }
  for (const o of Object.values(p.objects ?? {})) {
    place(p.id, o.zone, o.x, o.z, `object ${o.id}`);
    checkCond(p.id, o.when, `object ${o.id}`);
    if (o.giveItem) need(p.id, 'item', o.giveItem.item, `object ${o.id} giveItem`);
  }
  for (const [npcId, opts] of Object.entries(p.topics ?? {})) {
    need(p.id, 'npc', npcId, `topics`);
    checkOptions(p.id, npcId, opts, `topic on ${npcId}`);
  }
  for (const [npcId, greets] of Object.entries(p.greetingsFirst ?? {})) {
    need(p.id, 'npc', npcId, `greetingsFirst`);
    for (const g of greets) {
      checkCond(p.id, g.when, `greetingsFirst on ${npcId}`);
      if (!g.when) report(p.id, 'error', `greetingsFirst on ${npcId} node ${g.node}: no 'when' (would hide the NPC's own greetings forever)`);
      if (C.NPCS[npcId] && !(g.node in C.NPCS[npcId].nodes)) report(p.id, 'error', `greetingsFirst on ${npcId}: node '${g.node}' missing`);
    }
  }
  for (const [npcId, nodes] of Object.entries(p.extraNodes ?? {})) for (const [nid, node] of Object.entries(nodes)) checkOptions(p.id, npcId, node.options, `npc ${npcId} node ${nid}`);
  for (const a of p.allies ?? []) checkCond(p.id, a.when, `ally ${a.id}`);
}

// Quests nobody can start.
const startable = new Set();
const scan = (opts) => { for (const o of opts) if (o.action?.type === 'startQuest') startable.add(o.action.quest); };
for (const n of Object.values(C.NPCS)) for (const node of Object.values(n.nodes)) scan(node.options);
for (const opts of Object.values(C.TOPICS)) scan(opts);
for (const q of Object.values(C.QUESTS)) if (!startable.has(q.id)) report(owner.quest[q.id], 'error', `quest ${q.id}: no dialogue option starts it`);

// Zone exits.
for (const z of Object.values(C.ZONES)) for (const ex of z.exits) {
  zoneOk(`zone:${z.id}`, ex.to, `zone ${z.id} exit`);
  checkCond(`zone:${z.id}`, ex.when, `zone ${z.id} exit to ${ex.to}`);
  const why = blockedReason(ex.to, ex.arriveX, ex.arriveZ);
  if (why) report(`zone:${z.id}`, 'error', `zone ${z.id} exit to ${ex.to}: arrival (${ex.arriveX}, ${ex.arriveZ}) is ${why}`);
  // Arriving inside another exit's trigger bounces the player straight on (ping-pong).
  for (const other of C.ZONES[ex.to]?.exits ?? []) {
    if (Math.hypot(ex.arriveX - other.x, ex.arriveZ - other.z) < other.r + 0.5) {
      report(`zone:${z.id}`, 'error', `zone ${z.id} exit to ${ex.to}: arrival (${ex.arriveX}, ${ex.arriveZ}) is inside ${ex.to}'s exit to ${other.to} at (${other.x}, ${other.z}) r ${other.r}`);
    }
  }
}

const errors = problems.filter((p) => p.level === 'error');
for (const p of problems) console.log(`${p.level.toUpperCase()} [${p.pack}] ${p.msg}`);
console.log(`${errors.length} error(s), ${problems.length - errors.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
