// The economy sim: one player of a class plays the story phases in order (src/sim/economyPhases.ts) using the real
// content (QUESTS, SPAWNS, ENEMIES, ITEMS, NPC shops, TALENTS) and the real formulas in src/economy.ts, and the report
// says, per phase, how long it took, what it paid, what it cost and how fast skills and talents grew.
// checkEconomy() turns the report into flags against ECONOMY_TARGETS: the curves the tuning in src/data/economy.ts
// must hit. Run it with `npm run sim:economy -w games/gnomes-of-gnomomia [-- --class=warden --json --check]`.
//
// Pure and deterministic: no DOM, no randomness (every roll is its expected value), never touches state.ts.
// Quest, flag and gate conditions are evaluated against the sim's own quest-done set (see evalCondition below).
import type {
  ClassId, Condition, EnemyDef, EquipSlot, ItemDef, QuestDef, Rank, Rarity, SpawnGroup,
} from '../config';
import { START_GOLD, START_SKILL } from '../config';
import { ENEMIES, ITEMS, NPCS, OBJECTS, QUESTS, SPAWNS, TOPICS, npcGreetings } from '../content';
import { CLASSES, TALENTS, TIER_GATE } from '../data/classes';
import { START_EQUIPMENT, START_INVENTORY } from '../data/core';
import { ECONOMY } from '../data/economy';
import { enemyGoldRange, killXpAt, questGold, questXpAt, skillCapAt, skillUsesToNext, xpToNextLevel } from '../economy';
import { ECONOMY_PHASES, type PhaseId, questPhaseIndex, shopPhaseIndex, spawnPhaseIndex } from './economyPhases';

// ---------------------------------------------------------------- the player model (tune here)

/** How the simulated player spends their time and money. Every field can be overridden per run. */
export interface EconomyPlayerModel {
  classId: ClassId;
  /** Minutes to do one quest of each tier: talking, walking, the objective itself (its kills are counted separately). */
  questMinutes: Record<QuestDef['tier'], number>;
  /** Seconds per kill by rank, including walking to it and resting afterwards. Counts as combat time. */
  killSeconds: Record<Rank, number>;
  /** How many times each respawning spawn group is cleared per phase (respawnSeconds 0 = once). */
  clearsPerPhase: number;
  /** Most hours spent grinding at the end of one phase to reach the phase's top level. */
  grindHoursCap: number;
  /** Uses of the class weapon skill per combat minute. */
  weaponUsesPerMinute: number;
  /** Uses of Toughness per combat minute. */
  toughnessUsesPerMinute: number;
  /** Heal potions drunk per combat hour, bought at the best heal potion sold in the shops reached so far. */
  potionsPerCombatHour: number;
  /** Shopping after grind kills: shop every this many kills. */
  grindShopEvery: number;
  /** Flag name -> the value this playthrough picks at a choice. Flags not listed take the first value the content
   * can set them to (in pack order). `c2-trial` defaults to the class. */
  choices: Record<string, string>;
  /** The class counts as chosen (classId conditions, talents) once this quest is done. */
  classChosenAfter: string;
  /** Slot order for shopping: earlier slots get the coins first. */
  slotOrder: readonly EquipSlot[];
}

export const DEFAULT_PLAYER: EconomyPlayerModel = {
  classId: 'warden',
  questMinutes: { side: 6, main: 10, finale: 15 },
  killSeconds: { trivial: 15, normal: 35, elite: 90, miniboss: 150, boss: 240, worldboss: 300, final: 400 },
  clearsPerPhase: 2,
  grindHoursCap: 20,
  weaponUsesPerMinute: 25,
  toughnessUsesPerMinute: 15,
  potionsPerCombatHour: 6,
  grindShopEvery: 20,
  choices: {},
  classChosenAfter: 'c2-calling',
  slotOrder: ['weapon', 'body', 'offhand', 'head', 'legs', 'feet', 'hands', 'trinket'],
};

/** Item score for gear choices: ilvl * (1 + rarity bonus). */
export const RARITY_BONUS: Record<Rarity, number> = { plain: 0, sprouted: 0.08, blooming: 0.16, heirloom: 0.25, kilnfired: 0.35 };

// ---------------------------------------------------------------- targets (one place; checkEconomy reads only these)

export type EconomyFlagCode =
  | 'TOO_RICH' | 'TOO_POOR' | 'GRIND_WALL' | 'FLAT_XP_SCALING' | 'FRONT_LOADED_COINS'
  | 'SKILL_CAPPED_EARLY' | 'UNSPENT_TALENTS' | 'SLOW_PHASE' | 'FAST_PHASE';

export const ECONOMY_TARGETS = {
  /** TOO_RICH: coins carried out of a phase / cost of the next phase's full class kit above this = the whole next kit
   * is bought on arrival. Skipped when the next phase has no shop of its own (nothing new to buy). */
  maxCarryRatio: 1.0,
  /** TOO_POOR: share (by value) of this phase's own class kit owned by the phase's end below this. Skipped for phases
   * without a shop of their own. */
  minKitShare: 0.5,
  /** GRIND_WALL: grind hours above this times (quest + kill hours) in a phase. */
  maxGrindRatio: 1.5,
  /** FLAT_XP_SCALING: median normal-kill XP in the last phase below this times the first phase's. */
  minXpPerKillGrowth: 8,
  /** FRONT_LOADED_COINS: coins earned in these phases above this share of the game's total. */
  frontPhases: ['mossbottom', 'thatchford'] as readonly PhaseId[],
  maxFrontCoinShare: 0.25,
  /** SKILL_CAPPED_EARLY: share of a phase's combat minutes the weapon skill spends at its cap, from this phase on. */
  skillCapFromPhase: 'keep' as PhaseId,
  maxCapTimeShare: 0.5,
  /** UNSPENT_TALENTS: talent points minus spendable ranks at a phase end above this. */
  maxUnspentTalents: 2,
  /** SLOW_PHASE / FAST_PHASE: phase hours outside [min, max] times the median phase hours. The floor is 0.3, not 0.4:
   * the lower Deeps phase (7 quests, 3 spawn groups, a one-level band) is 1.4 h of content, and with no grind
   * anywhere the median is already 3.55 h (0.4 would need 1.42 h), so only a forced grind could pass 0.4. */
  phaseHoursBand: [0.3, 2.5] as readonly [number, number],
};

export interface EconomyFlag {
  code: EconomyFlagCode;
  /** The phase it fired in; absent for whole-game flags. */
  phase?: PhaseId;
  value: number;
  limit: number;
  message: string;
}

// ---------------------------------------------------------------- the report

export interface EconomyPhaseReport {
  id: PhaseId; name: string; band: readonly [number, number];
  levelIn: number; levelOut: number;
  /** Total, quest, kill and grind hours. */
  hours: number; questHours: number; killHours: number; grindHours: number;
  quests: number; kills: number; grindKills: number;
  xp: number; xpPerHour: number;
  /** Median XP of the phase's normal-rank kills (not counting grind kills unless there were no others). */
  xpPerNormalKill: number;
  /** Coins from content: quest gold, enemy gold, loot and reward items sold. Gear resold is in gearResold. */
  coinsEarned: number; coinsPerHour: number;
  spentGear: number; spentConsumables: number; gearResold: number;
  /** Heal potions the player needed but could not afford. */
  potionShortfall: number;
  carriedOut: number;
  /** Cost of the best class kit (one item per slot) in the next phase's own shops; 0 when it has none. */
  nextKitCost: number;
  carryRatio: number | null;
  /** Cost of this phase's own best class kit, and the share of it (by value) owned or beaten by the phase end. */
  kitCost: number; kitShare: number | null;
  skillUps: number; skillUpsPerHour: number;
  weaponSkill: number; skillCap: number;
  /** Share of the phase's combat minutes the weapon skill (and Toughness) spent at the cap. */
  capTimeShare: number; toughnessCapShare: number;
  talentPoints: number; talentSpendable: number;
  cumCoinsEarned: number; cumUsefulSpend: number;
  flags: EconomyFlagCode[];
}

export interface EconomyReport {
  classId: ClassId;
  model: EconomyPlayerModel;
  /** The value each choice flag took in this playthrough. */
  choices: Record<string, string>;
  phases: EconomyPhaseReport[];
  /** levelHours[L] = cumulative hours when level L was reached (index 0 unused, levelHours[1] = 0). */
  levelHours: (number | null)[];
  /** Content the run never got to (an exclusive branch not taken, or never unlocked). */
  skipped: { quests: string[]; spawns: string[] };
  totals: {
    hours: number; level: number; xp: number; coinsEarned: number; spentGear: number; spentConsumables: number;
    gearResold: number; coinsLeft: number; quests: number; kills: number; skillUps: number;
  };
}

// ---------------------------------------------------------------- content indexes (built once)

interface FlagInfo { values: string[]; boundQuest?: string }

/** Every flag the content can set, the values it can take (in pack order), and the quest whose choice sets it. */
function buildFlagIndex(): Map<string, FlagInfo> {
  const flags = new Map<string, FlagInfo>();
  const add = (name: string, value?: string): void => {
    let f = flags.get(name);
    if (!f) flags.set(name, (f = { values: [] }));
    if (value !== undefined && !f.values.includes(value)) f.values.push(value);
  };
  for (const npc of Object.values(NPCS)) {
    for (const node of Object.values(npc.nodes)) {
      for (const o of node.options) if (o.action?.type === 'setFlag') add(o.action.flag, o.action.value);
    }
  }
  for (const opts of Object.values(TOPICS)) for (const o of opts) if (o.action?.type === 'setFlag') add(o.action.flag, o.action.value);
  for (const o of Object.values(OBJECTS)) if (o.setFlag) add(o.setFlag.flag, o.setFlag.value);
  for (const e of Object.values(ENEMIES)) if (e.onDeathFlag) add(e.onDeathFlag.flag, e.onDeathFlag.value);
  for (const q of Object.values(QUESTS)) {
    for (const st of q.stages) {
      if (st.objective.type !== 'choice') continue;
      add(st.objective.flag);
      const f = flags.get(st.objective.flag)!;
      f.boundQuest ??= q.id;
    }
  }
  return flags;
}

/** Quests some dialogue option starts. A quest no dialogue starts can be done whenever its phase comes. */
function questsStartedByDialogue(): Set<string> {
  const s = new Set<string>();
  for (const npc of Object.values(NPCS)) {
    for (const node of Object.values(npc.nodes)) for (const o of node.options) if (o.action?.type === 'startQuest') s.add(o.action.quest);
  }
  for (const opts of Object.values(TOPICS)) for (const o of opts) if (o.action?.type === 'startQuest') s.add(o.action.quest);
  return s;
}

/** The quest a spawn group belongs to when its `when` names a quest that is active / on a stage / at least on a stage:
 * those enemies appear for that quest, so they are cleared once, right after it. */
function tiedQuest(c: Condition | undefined): string | undefined {
  if (!c) return undefined;
  if (c.questStage) return c.questStage.id;
  if (c.questAtLeast) return c.questAtLeast.id;
  if (c.quest && c.quest.status === 'active') return c.quest.id;
  return undefined;
}

// ---------------------------------------------------------------- conditions

interface CondCtx {
  done: ReadonlySet<string>;
  level: number;
  classId: ClassId;
  classChosen: boolean;
  flags: ReadonlyMap<string, string>;
}

/**
 * The sim's condition evaluator. Quests are atomic here (not started, or done), so:
 * - quest status none = not done; active or done = done; questAtLeast = done.
 * - questStage, hasItem, flagUnset: in 'content' mode (dialogue, spawns) questStage = done and hasItem / flagUnset hold
 *   (the player is assumed to be at that point when it matters); in 'gate' mode (item and talent gates) they are closed.
 * - flag / flagSet: a flag is set once the quest whose choice sets it is done (or from the start when only dialogue,
 *   an object or a kill sets it), to the playthrough's choice. A flag nothing sets is never set.
 */
export function evalCondition(c: Condition | undefined, ctx: CondCtx, mode: 'content' | 'gate'): boolean {
  if (!c) return true;
  const gate = mode === 'gate';
  if (c.quest) {
    const d = ctx.done.has(c.quest.id);
    if (c.quest.status === 'none' ? d : !d) return false;
  }
  if (c.questAtLeast && !ctx.done.has(c.questAtLeast.id)) return false;
  if (c.questStage && (gate || !ctx.done.has(c.questStage.id))) return false;
  if (c.hasItem && gate) return false;
  if (c.flag && ctx.flags.get(c.flag.name) !== c.flag.value) return false;
  if (c.flagSet !== undefined && !ctx.flags.has(c.flagSet)) return false;
  if (c.flagUnset !== undefined && gate && ctx.flags.has(c.flagUnset)) return false;
  if (c.minLevel !== undefined && ctx.level < c.minLevel) return false;
  if (c.classId !== undefined) {
    if (c.classId === 'none' ? ctx.classChosen : !ctx.classChosen || ctx.classId !== c.classId) return false;
  }
  if (c.not && evalCondition(c.not, ctx, mode)) return false;
  return true;
}

/** Quests the player could start now: options holding `startQuest` on dialogue nodes reachable from a greeting whose
 * condition holds (any greeting, not only the first match), through options whose conditions hold. */
function startableQuests(ctx: CondCtx): Set<string> {
  const out = new Set<string>();
  for (const [id, npc] of Object.entries(NPCS)) {
    if (npc.hidden && evalCondition(npc.hidden, ctx, 'content')) continue;
    const seen = new Set<string>();
    const queue: string[] = [];
    for (const g of npcGreetings(id)) if (evalCondition(g.when, ctx, 'content') && !seen.has(g.node)) { seen.add(g.node); queue.push(g.node); }
    while (queue.length) {
      const node = npc.nodes[queue.shift()!];
      if (!node) continue;
      const opts = node.hub ? [...node.options, ...(TOPICS[id] ?? [])] : node.options;
      for (const o of opts) {
        if (!evalCondition(o.when, ctx, 'content')) continue;
        if (o.action?.type === 'startQuest') out.add(o.action.quest);
        if (o.next && !seen.has(o.next)) { seen.add(o.next); queue.push(o.next); }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- gear

const WEAPON_CLASSES: Record<ClassId, readonly string[]> = {
  warden: ['melee'], slinger: ['sling', 'blowpipe'], mage: ['staff', 'wand'],
};

export function itemScore(def: ItemDef | undefined): number {
  if (!def || def.ilvl === undefined) return 0;
  return def.ilvl * (1 + RARITY_BONUS[def.rarity ?? 'plain']);
}

/** Whether a class can wear or wield this item. */
export function usableBy(def: ItemDef, classId: ClassId): boolean {
  if (!def.slot) return false;
  if (def.slot === 'weapon') return WEAPON_CLASSES[classId].includes(def.weaponClass ?? 'melee');
  if (def.armorType) return CLASSES[classId].armor.includes(def.armorType);
  return true;
}

function sellPrice(def: ItemDef): number {
  return Math.max(1, Math.floor(def.value / 2));
}

/** Expected coins from selling one kill's loot: floor(value/2) * chance * count; quest items are not sold. */
function lootValue(e: EnemyDef): number {
  let v = 0;
  for (const d of e.loot) {
    const def = ITEMS[d.item];
    if (!def || def.questItem) continue;
    v += sellPrice(def) * d.chance * (d.count ?? 1);
  }
  return v;
}

function meanGold(e: EnemyDef): number {
  const [lo, hi] = enemyGoldRange(e);
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------- talents

/** Ranks of the class's talents the player could have learned: gates open, tier gates met from lower tiers of the
 * same branch, and at most 2 capstones (tier 6). */
function spendableRanks(classId: ClassId, ctx: CondCtx): number {
  const byBranch = new Map<string, { tier: number; ranks: number }[]>();
  for (const t of Object.values(TALENTS)) {
    if (t.classId !== classId) continue;
    if (t.gate && !evalCondition(t.gate.when, ctx, 'gate')) continue;
    const list = byBranch.get(t.branch) ?? [];
    list.push({ tier: t.tier, ranks: t.maxRank });
    byBranch.set(t.branch, list);
  }
  let total = 0, capstones = 0;
  for (const list of byBranch.values()) {
    list.sort((a, b) => a.tier - b.tier);
    let below = 0, tierRanks = 0, tier = 0;
    for (const t of list) {
      if (t.tier !== tier) { below += tierRanks; tierRanks = 0; tier = t.tier; }
      if (below < TIER_GATE[t.tier]) continue;
      if (t.tier === 6) { if (capstones >= 2) continue; capstones++; }
      tierRanks += t.ranks;
      total += t.ranks;
    }
  }
  return total;
}

// ---------------------------------------------------------------- the run

type Activity =
  | { kind: 'quest'; level: number; q: QuestDef }
  | { kind: 'spawn'; level: number; g: SpawnGroup; e: EnemyDef; index: number };

interface SkillTrack { level: number; xp: number }

function median(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const round = (x: number, d = 2): number => Math.round(x * 10 ** d) / 10 ** d;

/** Runs one class through every phase. Deterministic: the same content and model give the same report. */
export function runEconomy(opts: Partial<EconomyPlayerModel> = {}): EconomyReport {
  const model: EconomyPlayerModel = { ...DEFAULT_PLAYER, ...opts };
  const classId = model.classId;

  // Content indexes.
  const flagIndex = buildFlagIndex();
  const dialogueStarted = questsStartedByDialogue();
  const choices: Record<string, string> = {};
  for (const [name, f] of flagIndex) {
    const pick = (name === 'c2-trial' ? model.choices[name] ?? classId : model.choices[name]) ?? f.values[0];
    if (pick !== undefined) choices[name] = pick;
  }
  const tiedSpawns = new Map<string, number[]>();   // quest id -> SPAWNS indexes cleared once after it
  const phaseActivities: Activity[][] = ECONOMY_PHASES.map(() => []);
  for (const q of Object.values(QUESTS)) phaseActivities[questPhaseIndex(q)].push({ kind: 'quest', level: q.level, q });
  SPAWNS.forEach((g, index) => {
    const e = ENEMIES[g.enemy];
    if (!e) return;
    const tied = tiedQuest(g.when);
    if (tied && QUESTS[tied]) { (tiedSpawns.get(tied) ?? tiedSpawns.set(tied, []).get(tied)!).push(index); return; }
    phaseActivities[spawnPhaseIndex(g, e.level)].push({ kind: 'spawn', level: e.level, g, e, index });
  });
  const shops = Object.values(NPCS).filter((n) => n.shop && n.shop.length > 0).map((n) => ({ npc: n, phase: shopPhaseIndex(n.zone) }));

  // Player state.
  const done = new Set<string>();
  const flags = new Map<string, string>();
  for (const [name, f] of flagIndex) if (!f.boundQuest && choices[name] !== undefined) flags.set(name, choices[name]);
  let level = 1, xp = 0, coins: number = START_GOLD, classChosen = false, finales = 0;
  const equipped: Partial<Record<EquipSlot, string>> = {};
  for (const [slot, item] of Object.entries(START_EQUIPMENT)) if (item) equipped[slot as EquipSlot] = item;
  let potions = 0, potionNeed = 0;   // heal potions carried; potions drunk since the last shop
  for (const s of START_INVENTORY) if (ITEMS[s.item]?.heal) potions += s.count;
  const weapon: SkillTrack = { level: START_SKILL, xp: 0 };
  const tough: SkillTrack = { level: START_SKILL, xp: 0 };
  let clock = 0;   // hours
  const levelHours: (number | null)[] = new Array(ECONOMY.levelCap + 1).fill(null);
  levelHours[1] = 0;
  const skippedSpawns: string[] = [];

  const ctx = (): CondCtx => ({ done, level, classId, classChosen, flags });

  // Per-phase accumulators (reset at each phase start).
  let acc = newAcc();
  function newAcc() {
    return {
      questH: 0, killH: 0, grindH: 0, quests: 0, kills: 0, grindKills: 0, xp: 0, coins: 0, gear: 0, cons: 0, resold: 0,
      shortfall: 0, normalXp: [] as number[], grindNormalXp: [] as number[], skillUps: 0, combatMin: 0, capMin: 0, toughCapMin: 0,
    };
  }

  function gainXp(amount: number): void {
    xp += amount;
    acc.xp += amount;
    while (level < ECONOMY.levelCap && xp >= xpToNextLevel(level)) {
      xp -= xpToNextLevel(level);
      level++;
      levelHours[level] = round(clock, 3);
    }
  }

  /** Trains a skill with `uses` over `minutes` of combat; returns the minutes spent at the cap. */
  function train(s: SkillTrack, uses: number, minutes: number): number {
    const cap = skillCapAt(level);
    if (s.level >= cap) return minutes;
    let left = uses;
    let need = skillUsesToNext(s.level) - s.xp;
    while (s.level < cap && left >= need) {
      left -= need;
      s.level++;
      s.xp = 0;
      acc.skillUps++;
      need = skillUsesToNext(s.level);
    }
    if (s.level >= cap) { s.xp = 0; return uses > 0 ? minutes * (left / uses) : 0; }
    s.xp += left;
    return 0;
  }

  function kill(e: EnemyDef, grind: boolean): void {
    const sec = model.killSeconds[e.rank];
    const min = sec / 60;
    clock += sec / 3600;
    if (grind) { acc.grindH += sec / 3600; acc.grindKills++; } else { acc.killH += sec / 3600; acc.kills++; }
    acc.combatMin += min;
    acc.capMin += train(weapon, model.weaponUsesPerMinute * min, min);
    acc.toughCapMin += train(tough, model.toughnessUsesPerMinute * min, min);
    potionNeed += model.potionsPerCombatHour * (min / 60);
    const x = killXpAt(e.level, e.rank, level);
    if (e.rank === 'normal') (grind ? acc.grindNormalXp : acc.normalXp).push(x);
    gainXp(x);
    const c = meanGold(e) + lootValue(e);
    coins += c;
    acc.coins += c;
  }

  function equipOrSell(itemId: string, count: number): void {
    const def = ITEMS[itemId];
    if (!def) return;
    if (def.kind === 'potion' && def.heal) { potions += count; return; }
    for (let i = 0; i < count; i++) {
      if (def.slot && usableBy(def, classId) && itemScore(def) > itemScore(ITEMS[equipped[def.slot] ?? ''])) {
        replace(def.slot, itemId);
        continue;
      }
      if (def.questItem) continue;
      coins += sellPrice(def);
      acc.coins += sellPrice(def);
    }
  }

  function replace(slot: EquipSlot, itemId: string): void {
    const old = ITEMS[equipped[slot] ?? ''];
    if (old && !old.questItem) { coins += sellPrice(old); acc.resold += sellPrice(old); }
    equipped[slot] = itemId;
  }

  function openShops(c: CondCtx, upToPhase: number): ItemDef[] {
    const seen = new Set<string>();
    const items: ItemDef[] = [];
    for (const s of shops) {
      if (s.phase > upToPhase) continue;
      if (s.npc.hidden && evalCondition(s.npc.hidden, c, 'content')) continue;
      for (const id of s.npc.shop ?? []) {
        const def = ITEMS[id];
        if (!def || seen.has(id)) continue;
        seen.add(id);
        items.push(def);
      }
    }
    return items;
  }

  function shop(phaseIdx: number): void {
    const c = ctx();
    const stock = openShops(c, phaseIdx);
    // Potions first: drink from the stock, buy the rest at the best heal potion on sale.
    const fromStock = Math.min(potions, Math.floor(potionNeed));
    potions -= fromStock;
    potionNeed -= fromStock;
    const best = stock.filter((d) => d.kind === 'potion' && d.heal).sort((a, b) => (b.heal ?? 0) - (a.heal ?? 0) || a.value - b.value)[0];
    if (best && potionNeed > 0) {
      const want = potionNeed * best.value;
      const pay = Math.min(want, Math.max(0, coins));
      coins -= pay;
      acc.cons += pay;
      acc.shortfall += (want - pay) / best.value;
      potionNeed = 0;
    }
    // Gear: per slot, the best affordable upgrade for the class at or below the player's level, gate open.
    for (const slot of model.slotOrder) {
      const cur = itemScore(ITEMS[equipped[slot] ?? '']);
      let pick: ItemDef | undefined;
      for (const d of stock) {
        if (d.slot !== slot || !usableBy(d, classId) || (d.ilvl ?? 0) > level || d.value > coins) continue;
        if (itemScore(d) <= cur) continue;
        if (d.gate && !evalCondition(d.gate.when, c, 'gate')) continue;
        if (!pick || itemScore(d) > itemScore(pick) || (itemScore(d) === itemScore(pick) && d.value < pick.value)) pick = d;
      }
      if (!pick) continue;
      coins -= pick.value;
      acc.gear += pick.value;
      replace(slot, pick.id);
    }
  }

  /** Best class kit (one item per slot, gates ignored) in the shops that belong to exactly this phase. */
  function phaseKit(phaseIdx: number): ItemDef[] {
    if (phaseIdx >= ECONOMY_PHASES.length) return [];
    const c = ctx();
    const bySlot = new Map<EquipSlot, ItemDef>();
    for (const s of shops) {
      if (s.phase !== phaseIdx) continue;
      if (s.npc.hidden && evalCondition(s.npc.hidden, c, 'content')) continue;
      for (const id of s.npc.shop ?? []) {
        const d = ITEMS[id];
        if (!d?.slot || !usableBy(d, classId)) continue;
        const cur = bySlot.get(d.slot);
        if (!cur || itemScore(d) > itemScore(cur)) bySlot.set(d.slot, d);
      }
    }
    return [...bySlot.values()];
  }

  function doQuest(q: QuestDef): void {
    const min = model.questMinutes[q.tier];
    clock += min / 60;
    acc.questH += min / 60;
    acc.quests++;
    // Kills the quest brings that no spawn group covers: defend waves, and kill objectives of enemies with no spawn.
    for (const st of q.stages) {
      const o = st.objective;
      if (o.type === 'defend') for (const w of o.waves) { const e = ENEMIES[w.enemy]; if (e) for (let i = 0; i < w.count; i++) kill(e, false); }
      if (o.type === 'kill' && !SPAWNS.some((g) => g.enemy === o.enemy)) { const e = ENEMIES[o.enemy]; if (e) for (let i = 0; i < o.count; i++) kill(e, false); }
    }
    gainXp(questXpAt(q, level));
    const g = questGold(q);
    coins += g;
    acc.coins += g;
    for (const r of q.reward.items) equipOrSell(r.item, r.count);
    done.add(q.id);
    if (q.tier === 'finale') finales++;
    if (q.id === model.classChosenAfter) classChosen = true;
    for (const [name, f] of flagIndex) if (f.boundQuest === q.id && choices[name] !== undefined) flags.set(name, choices[name]);
    // Enemies that appear for this quest: cleared once now.
    for (const idx of tiedSpawns.get(q.id) ?? []) {
      const sg = SPAWNS[idx];
      const e = ENEMIES[sg.enemy];
      for (let i = 0; i < sg.count; i++) kill(e, false);
    }
  }

  function activityReady(a: Activity, c: CondCtx, startable: Set<string>): boolean {
    if (a.kind === 'spawn') return evalCondition(a.g.when, c, 'content');
    if (done.has(a.q.id)) return false;
    return dialogueStarted.has(a.q.id) ? startable.has(a.q.id) : true;
  }

  const phases: EconomyPhaseReport[] = [];
  let carry: Activity[] = [];
  let cumEarned = 0, cumSpend = 0;

  ECONOMY_PHASES.forEach((phase, pi) => {
    acc = newAcc();
    const levelIn = level;
    const pending = [...carry, ...phaseActivities[pi]].sort((a, b) =>
      a.level - b.level || (a.kind === b.kind ? 0 : a.kind === 'quest' ? -1 : 1));
    // Do the lowest-level activity that is ready; doing it can unlock earlier ones, so rescan from the start.
    let startable = startableQuests(ctx());
    for (;;) {
      const c = ctx();
      const i = pending.findIndex((a) => activityReady(a, c, startable));
      if (i < 0) break;
      const a = pending.splice(i, 1)[0];
      if (a.kind === 'quest') {
        doQuest(a.q);
        startable = startableQuests(ctx());
      } else {
        const clears = a.e.respawnSeconds > 0 ? model.clearsPerPhase : 1;
        for (let k = 0; k < clears * a.g.count; k++) kill(a.e, false);
        startable = startableQuests(ctx());
      }
      shop(pi);
    }
    carry = pending;   // not ready yet: try again in the next phase

    // Grind the phase's best normal mob up to the phase's top level.
    const target = Math.min(ECONOMY.levelCap, phase.grindTo ?? phase.band[1]);
    const c = ctx();
    const mobs = phaseActivities[pi].filter((a): a is Extract<Activity, { kind: 'spawn' }> => a.kind === 'spawn');
    const pickFrom = (list: typeof mobs) => list.filter((a) => a.e.rank === 'normal').sort((a, b) => b.e.level - a.e.level)[0]?.e;
    const mob = pickFrom(mobs.filter((a) => evalCondition(a.g.when, c, 'content'))) ?? pickFrom(mobs)
      ?? mobs.sort((a, b) => b.e.level - a.e.level)[0]?.e;
    if (mob) {
      let n = 0;
      while (level < target && acc.grindH < model.grindHoursCap) {
        kill(mob, true);
        if (++n % model.grindShopEvery === 0) shop(pi);
      }
      if (n % model.grindShopEvery !== 0) shop(pi);
    }

    const hours = acc.questH + acc.killH + acc.grindH;
    const kit = phaseKit(pi);
    const kitCost = kit.reduce((s, d) => s + d.value, 0);
    const owned = kit.filter((d) => itemScore(ITEMS[equipped[d.slot!] ?? '']) >= itemScore(d)).reduce((s, d) => s + d.value, 0);
    const nextKitCost = phaseKit(pi + 1).reduce((s, d) => s + d.value, 0);
    cumEarned += acc.coins;
    cumSpend += acc.gear + acc.cons;
    const talentPoints = level - 1 + finales;
    phases.push({
      id: phase.id, name: phase.name, band: phase.band, levelIn, levelOut: level,
      hours: round(hours), questHours: round(acc.questH), killHours: round(acc.killH), grindHours: round(acc.grindH),
      quests: acc.quests, kills: acc.kills, grindKills: acc.grindKills,
      xp: Math.round(acc.xp), xpPerHour: hours > 0 ? Math.round(acc.xp / hours) : 0,
      xpPerNormalKill: median(acc.normalXp.length ? acc.normalXp : acc.grindNormalXp),
      coinsEarned: Math.round(acc.coins), coinsPerHour: hours > 0 ? Math.round(acc.coins / hours) : 0,
      spentGear: Math.round(acc.gear), spentConsumables: Math.round(acc.cons), gearResold: Math.round(acc.resold),
      potionShortfall: round(acc.shortfall, 1),
      carriedOut: Math.round(coins), nextKitCost,
      carryRatio: nextKitCost > 0 ? round(coins / nextKitCost) : null,
      kitCost, kitShare: kitCost > 0 ? round(owned / kitCost) : null,
      skillUps: acc.skillUps, skillUpsPerHour: hours > 0 ? round(acc.skillUps / hours, 1) : 0,
      weaponSkill: weapon.level, skillCap: skillCapAt(level),
      capTimeShare: acc.combatMin > 0 ? round(acc.capMin / acc.combatMin) : 0,
      toughnessCapShare: acc.combatMin > 0 ? round(acc.toughCapMin / acc.combatMin) : 0,
      talentPoints, talentSpendable: classChosen ? spendableRanks(classId, ctx()) : 0,
      cumCoinsEarned: Math.round(cumEarned), cumUsefulSpend: Math.round(cumSpend),
      flags: [],
    });
  });

  for (const a of carry) if (a.kind === 'spawn') skippedSpawns.push(a.g.id ?? a.g.enemy);
  const skippedQuests = Object.keys(QUESTS).filter((id) => !done.has(id));
  for (const [qid, idxs] of tiedSpawns) if (!done.has(qid)) for (const i of idxs) skippedSpawns.push(SPAWNS[i].id ?? SPAWNS[i].enemy);

  const report: EconomyReport = {
    classId, model, choices, phases, levelHours, skipped: { quests: skippedQuests, spawns: skippedSpawns },
    totals: {
      hours: round(clock), level, xp: phases.reduce((s, p) => s + p.xp, 0),
      coinsEarned: phases.reduce((s, p) => s + p.coinsEarned, 0),
      spentGear: phases.reduce((s, p) => s + p.spentGear, 0),
      spentConsumables: phases.reduce((s, p) => s + p.spentConsumables, 0),
      gearResold: phases.reduce((s, p) => s + p.gearResold, 0),
      coinsLeft: Math.round(coins),
      quests: done.size, kills: phases.reduce((s, p) => s + p.kills + p.grindKills, 0),
      skillUps: phases.reduce((s, p) => s + p.skillUps, 0),
    },
  };
  for (const f of checkEconomy(report)) if (f.phase) report.phases.find((p) => p.id === f.phase)?.flags.push(f.code);
  return report;
}

// ---------------------------------------------------------------- checks

/** Every target in ECONOMY_TARGETS the report misses. An empty list means the curve is in shape. */
export function checkEconomy(report: EconomyReport): EconomyFlag[] {
  const T = ECONOMY_TARGETS;
  const out: EconomyFlag[] = [];
  const ps = report.phases;
  const capFrom = ps.findIndex((p) => p.id === T.skillCapFromPhase);
  const med = median(ps.map((p) => p.hours));
  ps.forEach((p, i) => {
    if (p.carryRatio !== null && p.carryRatio > T.maxCarryRatio) {
      out.push({ code: 'TOO_RICH', phase: p.id, value: p.carryRatio, limit: T.maxCarryRatio, message: `${p.id}: carries ${p.carriedOut} out, the next kit costs ${p.nextKitCost} (x${p.carryRatio})` });
    }
    if (p.kitShare !== null && p.kitShare < T.minKitShare) {
      out.push({ code: 'TOO_POOR', phase: p.id, value: p.kitShare, limit: T.minKitShare, message: `${p.id}: owns ${Math.round(p.kitShare * 100)}% of its ${p.kitCost}-coin kit at the end` });
    }
    const work = p.questHours + p.killHours;
    if (p.grindHours > T.maxGrindRatio * work) {
      out.push({ code: 'GRIND_WALL', phase: p.id, value: round(work > 0 ? p.grindHours / work : Infinity), limit: T.maxGrindRatio, message: `${p.id}: ${p.grindHours} h grinding vs ${round(work)} h of quests and kills` });
    }
    if (capFrom >= 0 && i >= capFrom && p.capTimeShare > T.maxCapTimeShare) {
      out.push({ code: 'SKILL_CAPPED_EARLY', phase: p.id, value: p.capTimeShare, limit: T.maxCapTimeShare, message: `${p.id}: weapon skill at its cap ${Math.round(p.capTimeShare * 100)}% of combat time` });
    }
    // Before the class is chosen nothing is spendable by design (points bank until then), so that phase is not flagged.
    const unspent = p.talentPoints - p.talentSpendable;
    if (p.talentSpendable > 0 && unspent > T.maxUnspentTalents) {
      out.push({ code: 'UNSPENT_TALENTS', phase: p.id, value: unspent, limit: T.maxUnspentTalents, message: `${p.id}: ${p.talentPoints} talent points, only ${p.talentSpendable} ranks open` });
    }
    if (med > 0 && p.hours < T.phaseHoursBand[0] * med) {
      out.push({ code: 'FAST_PHASE', phase: p.id, value: round(p.hours / med), limit: T.phaseHoursBand[0], message: `${p.id}: ${p.hours} h vs median ${round(med)} h` });
    }
    if (med > 0 && p.hours > T.phaseHoursBand[1] * med) {
      out.push({ code: 'SLOW_PHASE', phase: p.id, value: round(p.hours / med), limit: T.phaseHoursBand[1], message: `${p.id}: ${p.hours} h vs median ${round(med)} h` });
    }
  });
  const first = ps[0], last = ps[ps.length - 1];
  if (first && last && first.xpPerNormalKill > 0) {
    const g = last.xpPerNormalKill / first.xpPerNormalKill;
    if (g < T.minXpPerKillGrowth) {
      out.push({ code: 'FLAT_XP_SCALING', value: round(g), limit: T.minXpPerKillGrowth, message: `normal-kill XP ${first.id} ${first.xpPerNormalKill} -> ${last.id} ${last.xpPerNormalKill} (x${round(g)})` });
    }
  }
  const total = ps.reduce((s, p) => s + p.coinsEarned, 0);
  const front = ps.filter((p) => T.frontPhases.includes(p.id)).reduce((s, p) => s + p.coinsEarned, 0);
  if (total > 0 && front / total > T.maxFrontCoinShare) {
    out.push({ code: 'FRONT_LOADED_COINS', value: round(front / total), limit: T.maxFrontCoinShare, message: `${T.frontPhases.join('+')} earn ${front} of ${total} coins (${Math.round((front / total) * 100)}%)` });
  }
  return out;
}
