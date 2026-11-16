// The content registry: merges every pack and zone under src/data/ into the game's tables, once at import time.
// A duplicate id throws, so two packs can never silently overwrite each other.
import type {
  AllyDef, ContentPack, DialogueOption, EnemyDef, Greeting, ItemDef, NpcDef, QuestDef, SpawnGroup, WorldObjectDef, ZoneDef, ZoneId,
} from './config';

import { PACK as mossbottom } from './data/packs/mossbottom';
import { PACK as ch2 } from './data/packs/ch2-thatchford';
import { PACK as ch3 } from './data/packs/ch3-keep';
import { PACK as ch4 } from './data/packs/ch4-cloverfield';
import { PACK as ch5 } from './data/packs/ch5-hedgewood';
import { PACK as ch6 } from './data/packs/ch6-rockery';
import { PACK as ch7 } from './data/packs/ch7-verge';
import { PACK as ch8 } from './data/packs/ch8-finale';
import { PACK as s01 } from './data/packs/s01-dandelion-idol';
import { PACK as s02 } from './data/packs/s02-neat-chapel';
import { PACK as s03 } from './data/packs/s03-heir-of-the-heap';
import { PACK as s04 } from './data/packs/s04-queen-outside';
import { PACK as s05 } from './data/packs/s05-seven-kiln-born';
import { PACK as s06 } from './data/packs/s06-the-forty';
import { PACK as s07 } from './data/packs/s07-straw-king';
import { PACK as s08 } from './data/packs/s08-range-war';
import { PACK as s09 } from './data/packs/s09-white-cricket';
import { PACK as s10 } from './data/packs/s10-hedgewrights';
import { PACK as s11 } from './data/packs/s11-finishing-the-unfired';
import { PACK as s12 } from './data/packs/s12-the-damp';
import { PACK as s13 } from './data/packs/s13-the-kings-cart';
import { PACK as s14 } from './data/packs/s14-the-smiths-road';

import { ZONE as zMossbottom } from './data/zones/mossbottom';
import { ZONE as zThatchford } from './data/zones/thatchford';
import { ZONE as zKeep } from './data/zones/keep';
import { ZONE as zDeeps } from './data/zones/deeps';
import { ZONE as zCloverfield } from './data/zones/cloverfield';
import { ZONE as zHedgewood } from './data/zones/hedgewood';
import { ZONE as zRockery } from './data/zones/rockery';
import { ZONE as zVerge } from './data/zones/verge';

/** Every pack, in load order (canon packs first so later packs can extend their NPCs). */
export const PACKS: readonly ContentPack[] = [
  mossbottom, ch2, ch3, ch4, ch5, ch6, ch7, ch8,
  s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14,
];

export const ZONES: Record<ZoneId, ZoneDef> = {
  mossbottom: zMossbottom, thatchford: zThatchford, keep: zKeep, deeps: zDeeps,
  cloverfield: zCloverfield, hedgewood: zHedgewood, rockery: zRockery, verge: zVerge,
};

export const ITEMS: Record<string, ItemDef> = {};
export const ENEMIES: Record<string, EnemyDef> = {};
export const NPCS: Record<string, NpcDef> = {};
export const QUESTS: Record<string, QuestDef> = {};
export const OBJECTS: Record<string, WorldObjectDef> = {};
export const SPAWNS: SpawnGroup[] = [];
export const TOPICS: Record<string, DialogueOption[]> = {};
export const GREETINGS_FIRST: Record<string, Greeting[]> = {};
export const ALLIES: AllyDef[] = [];

/** Problems found while merging packs. The game throws them all at once below; the content linter (which sets
 * globalThis.__GNOMOMIA_LINT__) reads them instead, so one broken pack does not hide the others. */
export const LOAD_ERRORS: string[] = [];
function loadError(msg: string): void {
  LOAD_ERRORS.push(msg);
}

function mergeTable<T>(kind: string, pack: string, into: Record<string, T>, from: Record<string, T> | undefined): void {
  if (!from) return;
  for (const [id, def] of Object.entries(from)) {
    if (id in into) { loadError(`duplicate ${kind} id: ${id} in pack ${pack}`); continue; }
    into[id] = def;
  }
}

// Pass 1: the id-keyed tables (NPCs are copied so pass 2 can extend their nodes and shop).
for (const p of PACKS) {
  mergeTable('item', p.id, ITEMS, p.items);
  mergeTable('enemy', p.id, ENEMIES, p.enemies);
  mergeTable('quest', p.id, QUESTS, p.quests);
  mergeTable('object', p.id, OBJECTS, p.objects);
  if (p.npcs) {
    const copies: Record<string, NpcDef> = {};
    for (const [id, n] of Object.entries(p.npcs)) copies[id] = { ...n, nodes: { ...n.nodes }, shop: n.shop ? [...n.shop] : undefined };
    mergeTable('npc', p.id, NPCS, copies);
  }
  if (p.spawns) SPAWNS.push(...p.spawns);
  if (p.allies) {
    for (const a of p.allies) {
      if (ALLIES.some((x) => x.id === a.id)) { loadError(`duplicate ally id: ${a.id} in pack ${p.id}`); continue; }
      ALLIES.push(a);
    }
  }
}

// Pass 2: extensions to NPCs that may live in another pack.
const nodeOwner: Record<string, string> = {};
for (const p of PACKS) {
  for (const [npcId, nodes] of Object.entries(p.extraNodes ?? {})) {
    const npc = NPCS[npcId];
    if (!npc) { loadError(`extraNodes for unknown npc: ${npcId} in pack ${p.id}`); continue; }
    for (const [nodeId, node] of Object.entries(nodes)) {
      if (nodeId in npc.nodes) { loadError(`duplicate dialogue node id: ${npcId}.${nodeId} in pack ${p.id}${nodeOwner[`${npcId}.${nodeId}`] ? ` (also in ${nodeOwner[`${npcId}.${nodeId}`]})` : ''}`); continue; }
      npc.nodes[nodeId] = node;
      nodeOwner[`${npcId}.${nodeId}`] = p.id;
    }
  }
  for (const [npcId, stock] of Object.entries(p.shopAdds ?? {})) {
    const npc = NPCS[npcId];
    if (!npc) { loadError(`shopAdds for unknown npc: ${npcId} in pack ${p.id}`); continue; }
    npc.shop = [...(npc.shop ?? []), ...stock];
  }
  for (const [npcId, opts] of Object.entries(p.topics ?? {})) (TOPICS[npcId] ??= []).push(...opts);
  for (const [npcId, greets] of Object.entries(p.greetingsFirst ?? {})) (GREETINGS_FIRST[npcId] ??= []).push(...greets);
}

if (LOAD_ERRORS.length > 0 && !(globalThis as { __GNOMOMIA_LINT__?: boolean }).__GNOMOMIA_LINT__) {
  throw new Error(`content packs failed to load:\n${LOAD_ERRORS.join('\n')}`);
}

/** An NPC's greetings in check order: pack greetings first, then its own. */
export function npcGreetings(id: string): Greeting[] {
  return [...(GREETINGS_FIRST[id] ?? []), ...(NPCS[id]?.greetings ?? [])];
}
