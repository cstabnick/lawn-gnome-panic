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
const owner = { item: {}, enemy: {}, npc: {}, quest: {}, object: {}, book: {} };
for (const p of C.PACKS) {
  for (const id of Object.keys(p.items ?? {})) owner.item[id] = p.id;
  for (const id of Object.keys(p.enemies ?? {})) owner.enemy[id] = p.id;
  for (const id of Object.keys(p.npcs ?? {})) owner.npc[id] = p.id;
  for (const id of Object.keys(p.quests ?? {})) owner.quest[id] = p.id;
  for (const id of Object.keys(p.objects ?? {})) owner.object[id] = p.id;
  for (const id of Object.keys(p.books ?? {})) owner.book[id] = p.id;
}

const need = (pack, kind, id, where) => {
  const table = { item: C.ITEMS, enemy: C.ENEMIES, npc: C.NPCS, quest: C.QUESTS, object: C.OBJECTS, book: C.BOOKS }[kind];
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

/** Why a point is unreachable in its zone, or null. Positions are world coordinates; the map is centred on the zone's origin. */
function blockedReason(zoneId, x, z) {
  const zone = C.ZONES[zoneId];
  if (!zone) return null;
  const o = zone.origin ?? { x: 0, z: 0 };
  const inf = zone.interior;
  if (inf) {
    // A building interior: inside the room, and not in its furniture (layout is room-local).
    const lx = x - o.x, lz = z - o.z;
    if (Math.abs(lx) > inf.hw - 0.6 || Math.abs(lz) > inf.hd - 0.6) return `outside the room (half-width ${inf.hw}, half-depth ${inf.hd}) at room (${lx.toFixed(1)}, ${lz.toFixed(1)})`;
    for (const f of inf.layout) {
      const r = (C.FURNITURE_RADIUS[f.kind] ?? 0) * (f.scale ?? 1);
      if (r > 0 && Math.hypot(lx - f.x, lz - f.z) < r + 0.3) return `inside the ${f.kind} at room (${f.x.toFixed(1)}, ${f.z.toFixed(1)})`;
    }
    return null;
  }
  if (Math.abs(x - o.x) > zone.half - 3 || Math.abs(z - o.z) > zone.half - 3) return `off the map (half ${zone.half})`;
  if (Math.hypot(x - zone.shrine.x, z - zone.shrine.z) < 1.6) return 'on the shrine';
  for (const h of zone.houses) if (Math.hypot(x - h.x, z - h.z) < h.r + 0.6) return `inside a ${h.style} house at (${h.x}, ${h.z}) r ${h.r}`;
  for (const l of zone.lakes) if (Math.hypot(x - l.x, z - l.z) < l.r * 0.85) return `in the lake at (${l.x}, ${l.z}) r ${l.r}`;
  return null;
}
const place = (pack, zone, x, z, where) => {
  zoneOk(pack, zone, where);
  // Pack positions are zone-local (C.PACKS is the raw data); ZONES holds world positions, so shift by the origin.
  const o = C.ZONES[zone]?.origin ?? { x: 0, z: 0 };
  const why = blockedReason(zone, x + o.x, z + o.z);
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
      if (o.type === 'defend') {
        if (o.r < 3) report(p.id, 'error', `${w}: defend radius ${o.r} is under 3 m`);
        for (const wv of o.waves) {
          if (wv.count < 1) report(p.id, 'error', `${w}: a ${wv.enemy} wave has count ${wv.count}`);
          if (wv.at >= o.seconds) report(p.id, 'error', `${w}: the ${wv.enemy} wave at ${wv.at} s never comes (the stage ends at ${o.seconds} s)`);
        }
        const wo = C.QUESTS[q.id]?.stages[i]?.objective;   // world coordinates
        if (wo?.type === 'defend') {
          for (const g of C.SPAWNS) {
            if (g.zone !== wo.zone || !wo.waves.some((wv) => wv.enemy === g.enemy)) continue;
            if (Math.hypot(g.x - wo.x, g.z - wo.z) < g.spread + wo.r + 12) {
              report(p.id, 'warn', `${w}: spawn ${g.id ?? g.enemy} (${g.count} x ${g.enemy}) is within reach of the defend circle, so it joins the waves`);
            }
          }
        }
      }
      if (o.type === 'kill') {
        const groups = C.SPAWNS.filter((g) => g.enemy === o.enemy);
        const total = groups.reduce((n, g) => n + g.count, 0);
        const inWaves = Object.values(C.QUESTS).some((qq) => qq.stages.some((ss) => ss.objective.type === 'defend' && ss.objective.waves.some((wv) => wv.enemy === o.enemy)));
        const summoned = Object.values(C.ENEMIES).some((e) => (e.moves ?? []).some((m) => m.summon?.enemy === o.enemy));
        if (groups.length > 0 && !inWaves && !summoned && o.count > total) {
          report(p.id, 'warn', `${w}: kill ${o.count} x ${o.enemy}, but only ${total} spawn (the player waits on respawns)`);
        }
      }
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
    // Resolved position (pack or object marker), zone-local: C.OBJECTS is world, so take the origin back off.
    const r = C.OBJECTS[o.id] ?? o;
    const oo = C.ZONES[o.zone]?.origin ?? { x: 0, z: 0 };
    place(p.id, o.zone, r.x - oo.x, r.z - oo.z, `object ${o.id}`);
    checkCond(p.id, o.when, `object ${o.id}`);
    if (o.giveItem) need(p.id, 'item', o.giveItem.item, `object ${o.id} giveItem`);
    if (o.book) need(p.id, 'book', o.book, `object ${o.id} book`);
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
  for (const [id, b] of Object.entries(p.books ?? {})) {
    if (b.id !== id) report(p.id, 'error', `book ${id}: id field is '${b.id}'`);
    if (!b.pages?.length || b.pages.some((pg) => !pg.trim())) report(p.id, 'error', `book ${id}: empty page`);
    for (const pg of b.pages ?? []) if (pg.length > 900) report(p.id, 'warn', `book ${id}: a page has ${pg.length} characters (keep under ~600)`);
  }
}

// Quests nobody can start.
const startable = new Set();
const scan = (opts) => { for (const o of opts) if (o.action?.type === 'startQuest') startable.add(o.action.quest); };
for (const n of Object.values(C.NPCS)) for (const node of Object.values(n.nodes)) scan(node.options);
for (const opts of Object.values(C.TOPICS)) scan(opts);
for (const q of Object.values(C.QUESTS)) if (!startable.has(q.id)) report(owner.quest[q.id], 'error', `quest ${q.id}: no dialogue option starts it`);

// Zone exits. Only teleport exits (same zone, or either side indoors) put the player at a fixed arrival spot;
// an exit between two outdoor zones is a road end, so it needs a road back instead.
for (const z of Object.values(C.ZONES)) for (const ex of z.exits) {
  zoneOk(`zone:${z.id}`, ex.to, `zone ${z.id} exit`);
  checkCond(`zone:${z.id}`, ex.when, `zone ${z.id} exit to ${ex.to}`);
  const target = C.ZONES[ex.to];
  const teleport = ex.to === z.id || !!C.ZONES[z.id].indoor || !!target?.indoor;
  if (teleport) {
    const why = blockedReason(ex.to, ex.arriveX, ex.arriveZ);
    if (why) report(`zone:${z.id}`, 'error', `zone ${z.id} exit to ${ex.to}: arrival (${ex.arriveX}, ${ex.arriveZ}) is ${why}`);
    // Arriving inside another exit's trigger bounces the player straight on (ping-pong).
    for (const other of target?.exits ?? []) {
      if (Math.hypot(ex.arriveX - other.x, ex.arriveZ - other.z) < other.r + 0.5) {
        report(`zone:${z.id}`, 'error', `zone ${z.id} exit to ${ex.to}: arrival (${ex.arriveX}, ${ex.arriveZ}) is inside ${ex.to}'s exit to ${other.to} at (${other.x}, ${other.z}) r ${other.r}`);
      }
    }
  } else if (target && !target.exits.some((e) => e.to === z.id)) {
    report(`zone:${z.id}`, 'error', `zone ${z.id} exit to ${ex.to}: ${ex.to} has no exit back to ${z.id} (road end)`);
  }
}

// Decks: raised outdoor floors with a ramp. Positions are world coordinates (content.ts moved them).
// Ramp: 2.4 m wide, 2*y long, from the middle of the `stair` side. Footprint and ramp box, grown by 1 m,
// must not touch any house, the shrine, a lake or an exit ring; the ramp's foot must not be inside one either.
const DECK_RAMP_HALF_WIDTH = 1.2;
function deckParts(dk) {
  const hw = dk.w / 2, hd = dk.d / 2, L = 2 * dk.y, H = DECK_RAMP_HALF_WIDTH;
  const foot = { x0: dk.x - hw, x1: dk.x + hw, z0: dk.z - hd, z1: dk.z + hd };
  switch (dk.stair) {
    case 's': return { foot, ramp: { x0: dk.x - H, x1: dk.x + H, z0: dk.z + hd, z1: dk.z + hd + L }, far: { x: dk.x, z: dk.z + hd + L } };
    case 'n': return { foot, ramp: { x0: dk.x - H, x1: dk.x + H, z0: dk.z - hd - L, z1: dk.z - hd }, far: { x: dk.x, z: dk.z - hd - L } };
    case 'e': return { foot, ramp: { x0: dk.x + hw, x1: dk.x + hw + L, z0: dk.z - H, z1: dk.z + H }, far: { x: dk.x + hw + L, z: dk.z } };
    case 'w': return { foot, ramp: { x0: dk.x - hw - L, x1: dk.x - hw, z0: dk.z - H, z1: dk.z + H }, far: { x: dk.x - hw - L, z: dk.z } };
    default: return null;
  }
}
/** Distance from a circle centre to a box grown by `grow`, compared with the radius. */
const boxNear = (b, grow, cx, cz, r) => {
  const nx = Math.max(b.x0 - grow, Math.min(cx, b.x1 + grow));
  const nz = Math.max(b.z0 - grow, Math.min(cz, b.z1 + grow));
  return Math.hypot(cx - nx, cz - nz) < r;
};
for (const z of Object.values(C.ZONES)) {
  const o = z.origin ?? { x: 0, z: 0 };
  const pack = `zone:${z.id}`;
  const obstacles = [
    ...z.houses.map((h) => ({ what: `a ${h.style} house at (${h.x}, ${h.z})`, x: h.x, z: h.z, r: h.r })),
    { what: `the shrine at (${z.shrine.x}, ${z.shrine.z})`, x: z.shrine.x, z: z.shrine.z, r: 1.5 },
    ...z.lakes.map((l) => ({ what: `the lake at (${l.x}, ${l.z})`, x: l.x, z: l.z, r: l.r * 1.4 })),
    ...z.exits.map((e) => ({ what: `the exit to ${e.to} at (${e.x}, ${e.z})`, x: e.x, z: e.z, r: e.r })),
  ];
  (z.decks ?? []).forEach((dk, i) => {
    const where = `zone ${z.id} deck ${i} at (${dk.x}, ${dk.z})`;
    const parts = deckParts(dk);
    if (!parts) { report(pack, 'error', `${where}: stair '${dk.stair}' is not n, s, e or w`); return; }
    if (dk.y < 3 || dk.y > 12) report(pack, 'error', `${where}: y ${dk.y} is outside 3..12`);
    if (dk.w < 3 || dk.w > 40) report(pack, 'error', `${where}: w ${dk.w} is outside 3..40`);
    if (dk.d < 3 || dk.d > 40) report(pack, 'error', `${where}: d ${dk.d} is outside 3..40`);
    const lim = z.half - 3;
    for (const b of [parts.foot, parts.ramp]) {
      if (b.x0 < o.x - lim || b.x1 > o.x + lim || b.z0 < o.z - lim || b.z1 > o.z + lim) {
        report(pack, 'error', `${where} is off the map (half ${z.half}) with its ramp`);
        break;
      }
    }
    for (const ob of obstacles) {
      if (boxNear(parts.foot, 1, ob.x, ob.z, ob.r) || boxNear(parts.ramp, 1, ob.x, ob.z, ob.r)) {
        report(pack, 'error', `${where} is within 1 m of ${ob.what} r ${ob.r}`);
      }
      if (Math.hypot(parts.far.x - ob.x, parts.far.z - ob.z) < ob.r) {
        report(pack, 'error', `${where}: ramp foot (${parts.far.x}, ${parts.far.z}) is inside ${ob.what} r ${ob.r}`);
      }
    }
  });
}

// Building interiors: every house's own books exist, and its outside doormat is on clear ground (world coordinates).
function distSeg(px, pz, w) {
  const dx = w.x2 - w.x1, dz = w.z2 - w.z1;
  const t = Math.max(0, Math.min(1, ((px - w.x1) * dx + (pz - w.z1) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - (w.x1 + t * dx), pz - (w.z1 + t * dz));
}
for (const z of Object.values(C.ZONES)) {
  if (z.interior) continue;
  const o = z.origin ?? { x: 0, z: 0 };
  z.houses.forEach((h, i) => {
    const hid = h.id ?? 'h' + i;
    const where = `zone ${z.id} house ${hid}`;
    if (h.interior === false) return;
    for (const b of h.interior?.books ?? []) if (!(b in C.BOOKS)) report(`zone:${z.id}`, 'error', `${where}: unknown book '${b}'`);
    for (const ex of z.exits) {
      if (!ex.door || ex.to !== `${z.id}/${hid}`) continue;
      let why = null;
      if (Math.abs(ex.x - o.x) > z.half - 3 || Math.abs(ex.z - o.z) > z.half - 3) why = 'off the map';
      z.houses.forEach((other, j) => { if (j !== i && Math.hypot(ex.x - other.x, ex.z - other.z) < other.r + 0.3) why = `against the ${other.style} house at (${other.x}, ${other.z})`; });
      for (const l of z.lakes) if (Math.hypot(ex.x - l.x, ex.z - l.z) < l.r * 0.85) why = `in the lake at (${l.x}, ${l.z})`;
      for (const w of z.walls ?? []) if (distSeg(ex.x, ex.z, w) < 1.3) why = 'against a wall';
      if (why) report(`zone:${z.id}`, 'error', `${where}: its doormat (${ex.x.toFixed(1)}, ${ex.z.toFixed(1)}) is ${why} (turn the house's yaw, or set interior: false)`);
    }
  });
}

const errors = problems.filter((p) => p.level === 'error');
for (const p of problems) console.log(`${p.level.toUpperCase()} [${p.pack}] ${p.msg}`);
console.log(`${errors.length} error(s), ${problems.length - errors.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
