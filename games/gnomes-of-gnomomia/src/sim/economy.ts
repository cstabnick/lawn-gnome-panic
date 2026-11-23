// The economy sim: one player of a class plays the story phases in order (src/sim/economyPhases.ts) using the real
// content (QUESTS, SPAWNS, ENEMIES, ITEMS, NPC shops, TALENTS) and the real formulas in src/economy.ts, and the report
// says, per phase, how long it took, what it paid, what it cost and how fast skills and talents grew.
// checkEconomy() turns the report into flags against ECONOMY_TARGETS: the curves the tuning in src/data/economy.ts
// must hit. PLAYER_VARIANTS are the other players the targets must also hold for (the margin check).
// Run it with `npm run sim:economy -w games/gnomes-of-gnomomia [-- --class=warden --json --check --cap=70]`.
//
// `cap` above ECONOMY.levelCap appends the PROJECTION bands of src/data/economyProjection.ts after the Verge:
// synthetic quests, mobs and shops built like the Verge. They exist only inside this sim, never in the game.
//
// Pure and deterministic: no DOM, no randomness (every roll is its expected value), never touches state.ts.
// Quest, flag and gate conditions are evaluated against the sim's own quest-done set (see evalCondition below).
import type {
  ClassId, Condition, EnemyDef, EquipSlot, ItemDef, QuestDef, Rank, Rarity, SkillId, SpawnGroup,
} from '../config';
import { START_GOLD, START_SKILL } from '../config';
import { ENEMIES, ITEMS, NPCS, OBJECTS, QUESTS, RAIDS, SPAWNS, TOPICS, npcGreetings } from '../content';
import { CLASSES, TALENTS, TIER_GATE } from '../data/classes';
import { START_EQUIPMENT, START_INVENTORY } from '../data/core';
import { ECONOMY } from '../data/economy';
import { PROJECTED_BANDS, PROJECTION_KIT, PROJECTION_TEMPLATE, bandContent } from '../data/economyProjection';
import { RAID_TUNING, RAID_UNLOCK } from '../data/raidTuning';
import {
  enemyGoldRange, killXpAt, questGold, questXpAt, raidClearGold, raidClearXp, skillCapAt, skillUseValue, skillUsesToNext,
  xpToNextLevel,
} from '../economy';
import { avgHit, enemyStats, weaponSkillFor } from '../rules';
import type { RaidDef } from '../raidTypes';
import {
  ECONOMY_PHASES, type EconomyPhase, type PhaseId, phaseIndexFor, questPhaseIndex, shopPhaseIndex, spawnPhaseIndex,
} from './economyPhases';

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
  /** Clears of each open raid per phase (a raid of a phase is open once the player's level and horn unlock allow). */
  raidClears: number;
  /** Minutes per raid clear, including the walk to the horn and regrouping. */
  raidMinutes: number;
  /** Most hours spent grinding at the end of one phase to reach the phase's top level. */
  grindHoursCap: number;
  /** Skill uses (landed hits, or casts for the mage) per kill of a normal enemy of the player's level. Measured in the
   * combat arena (src/sim/arena.ts, TacticalPlayer, zone-plain gear, L4-L28: warden 3-5, slinger 2-7, mage 2-5);
   * economy.test.ts re-measures it. Other ranks scale by enemy HP (rules.enemyStats). */
  hitsPerNormalKill: Record<ClassId, number>;
  /** Hits taken (Toughness uses) per normal kill; scales with enemy HP like the above. An estimate: a 4-6 s fight
   * against a 2.4 s attacker that hits about half the time. */
  hitsTakenPerNormalKill: number;
  /** How a mage's casts split over the three schools (Flare is Sun, Mend is Bloom, Rain from talents). */
  schoolSplit: Record<'sun' | 'rain' | 'bloom', number>;
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
  raidClears: 4,
  raidMinutes: 4,
  grindHoursCap: 20,
  hitsPerNormalKill: { warden: 4, slinger: 5, mage: 3.5 },
  hitsTakenPerNormalKill: 1.5,
  schoolSplit: { sun: 0.55, rain: 0.25, bloom: 0.2 },
  potionsPerCombatHour: 6,
  grindShopEvery: 20,
  choices: {},
  classChosenAfter: 'c2-calling',
  slotOrder: ['weapon', 'body', 'offhand', 'head', 'legs', 'feet', 'hands', 'trinket'],
};

/** Other players the targets must also hold for: the margin check. --check and economy.test.ts run every class with
 * each of these. A variant only changes the player, never the content. */
export const PLAYER_VARIANTS: Record<string, Partial<EconomyPlayerModel>> = {
  /** Drinks three times the potions (a player who takes more hits or dies more). */
  'potions-x3': { potionsPerCombatHour: DEFAULT_PLAYER.potionsPerCombatHour * 3 },
  /** Kills take 1.5x as long (walks more, rests longer). Hits per kill stay the same: enemy HP did not change. */
  'slow-kills': { killSeconds: Object.fromEntries(Object.entries(DEFAULT_PLAYER.killSeconds).map(([k, v]) => [k, v * 1.5])) as Record<Rank, number> },
  /** Clears each respawning group once per phase instead of twice: quests carry the levels. */
  'one-clear': { clearsPerPhase: 1 },
  /** Lands a third fewer hits per kill's worth of skill (misses more, or swaps weapons often). */
  'few-hits': { hitsPerNormalKill: { warden: 4 * 0.67, slinger: 5 * 0.67, mage: 3.5 * 0.67 } },
  /** Never clears a raid: the questing-only curve. */
  'no-raids': { raidClears: 0 },
  /** Clears every open raid three times as often as the default (12 per phase): the raid-farm margin. */
  'raid-heavy': { raidClears: 12 },
};

/** Item score for gear choices: ilvl * (1 + rarity bonus). */
export const RARITY_BONUS: Record<Rarity, number> = { plain: 0, sprouted: 0.08, blooming: 0.16, heirloom: 0.25, kilnfired: 0.35 };

// ---------------------------------------------------------------- targets (one place; checkEconomy reads only these)

export type EconomyFlagCode =
  | 'TOO_RICH' | 'TOO_POOR' | 'GRIND_WALL' | 'FLAT_XP_SCALING' | 'FRONT_LOADED_COINS'
  | 'SKILL_CAPPED_EARLY' | 'UNSPENT_TALENTS' | 'SLOW_PHASE' | 'FAST_PHASE'
  | 'SHRINKING_PHASE' | 'SLOW_SKILL' | 'GEAR_INSTANT' | 'GEAR_LATE' | 'FALLING_KILLS_PER_LEVEL' | 'RAID_FARM';

export const ECONOMY_TARGETS = {
  /** TOO_RICH: coins carried out of a phase / cost of the next phase's full class kit above this = the whole next kit
   * is bought on arrival. Skipped when the next phase has no shop of its own (nothing new to buy). */
  maxCarryRatio: 1.0,
  /** TOO_POOR: share (by value) of this phase's own class kit owned by the phase's end below this. Skipped for phases
   * without a shop of their own. */
  minKitShare: 0.5,
  /** GRIND_WALL: grind hours above this times (quest + kill hours) in a phase. */
  maxGrindRatio: 1.5,
  /** FLAT_XP_SCALING: median normal-kill XP in the last shipped phase (the Verge) below this times the first phase's. */
  minXpPerKillGrowth: 8,
  /** FRONT_LOADED_COINS: coins earned in these phases above this share of the game's total (shipped phases only). */
  frontPhases: ['mossbottom', 'thatchford'] as readonly PhaseId[],
  maxFrontCoinShare: 0.25,
  /** SKILL_CAPPED_EARLY: share of a phase's weapon-skill uses spent at the cap, from this phase on. */
  skillCapFromPhase: 'keep' as PhaseId,
  maxCapTimeShare: 0.5,
  /** UNSPENT_TALENTS: talent points minus spendable ranks at a phase end above this. */
  maxUnspentTalents: 2,
  /** SLOW_PHASE / FAST_PHASE: phase hours outside [min, max] times the median phase hours (the roadmap's band). */
  phaseHoursBand: [0.4, 2.5] as readonly [number, number],
  /** SHRINKING_PHASE: "later zones take at least as long": from the third phase on, a phase's hours below this times
   * the median hours of all phases before it. (A strict "each phase >= the last" cannot hold for hand-made zones of
   * different sizes: the Keep is a castle, Thatchford a county.) */
  minHoursVsEarlier: 0.75,
  /** SLOW_SKILL: skill-ups per hour (all trained skills) below this in a phase: skills must keep visibly growing.
   * 3.5, not the critique's 5: a skill on its cap rises 4 per character level, and Cloverfield and the Hedgewood give
   * 3 levels in about 4.9 h, so even two skills sitting on the cap make 4.9 an hour; the slinger trains only two
   * (Marksmanship, Toughness). 5 an hour everywhere needs faster mid-game levels or a steeper cap, both bigger
   * changes to combat. The old sim's 20 an hour came from counting 25 uses per minute (3.5x the arena's hits). */
  minSkillUpsPerHour: 3.5,
  /** GEAR_INSTANT / GEAR_LATE: mean hours between a kit item opening (its ilvl reached, gate open, shop reached) and
   * owning it, over the phase's kit slots: below minGearLagHours = never a goal; above maxGearLagShare x phase hours =
   * out of reach for most of the zone. */
  minGearLagHours: 0.1,
  maxGearLagShare: 0.5,
  /** FALLING_KILLS_PER_LEVEL: normal kills per level (xpToNext / own-level normal kill XP) in a phase below this times
   * the previous phase's: levels must not get cheaper in kills. */
  minKillsPerLevelGrowth: 0.97,
  /** RAID_FARM: a phase's raid XP per raid hour above this times its quest and kill XP per hour: raids must not
   * out-level questing. */
  raidXpPerHourMax: 1.25,
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

export interface GearLag {
  slot: EquipSlot; item: string;
  /** Hours from the item opening to owning it (or the run's end if never owned); null if it never opened, or was
   * beaten by other gear before it opened (no purchase needed). */
  hours: number | null;
  owned: boolean;
}

export interface EconomyPhaseReport {
  id: PhaseId; name: string; band: readonly [number, number];
  /** True for PROJECTION phases (levels past the shipped cap, synthetic content). */
  projected: boolean;
  levelIn: number; levelOut: number;
  /** Total, quest, kill, grind and raid hours. */
  hours: number; questHours: number; killHours: number; grindHours: number; raidHours: number;
  /** Raid clears: XP from them, their XP per raid hour, and quest + kill XP per quest + kill hour (the RAID_FARM base). */
  raidXp: number; raidXpPerHour: number; contentXpPerHour: number;
  quests: number; kills: number; grindKills: number;
  xp: number; xpPerHour: number;
  /** Median XP of the phase's normal-rank kills (not counting grind kills unless there were no others). */
  xpPerNormalKill: number;
  /** Median over the phase's levels of xpToNextLevel(L) / killXpAt(L, normal, L). */
  killsPerLevel: number;
  /** Coins from content: quest gold, enemy gold, loot and reward items sold. Gear resold is in gearResold. */
  coinsEarned: number; coinsPerHour: number;
  /** Share of coinsEarned from selling loot. */
  lootShare: number;
  spentGear: number; spentConsumables: number; gearResold: number;
  /** Heal potions the player needed but could not afford. */
  potionShortfall: number;
  carriedOut: number;
  /** Cost of the best class kit (one item per slot) in the next phase's own shops; 0 when it has none. */
  nextKitCost: number;
  carryRatio: number | null;
  /** Cost of this phase's own best class kit, and the share of it (by value) owned or beaten by the phase end. */
  kitCost: number; kitShare: number | null;
  /** Per kit slot: hours from opening to owning. gearLagMean is over slots with a lag (null if none). */
  gearLag: GearLag[]; gearLagMean: number | null; gearLagMax: number | null;
  /** All skill-ups (weapon, school and Toughness skills). */
  skillUps: number; skillUpsPerHour: number;
  /** Every tracked skill's level at the phase end. */
  skills: Partial<Record<SkillId, number>>;
  /** The weapon or school skills used this phase, and the lowest of them (weaponSkill = its level). */
  activeSkills: SkillId[]; lowSkill: SkillId; weaponSkill: number; skillCap: number;
  /** Share of the phase's weapon-skill uses that landed at the cap (and Toughness's). */
  capTimeShare: number; toughnessCapShare: number;
  talentPoints: number; talentSpendable: number;
  cumCoinsEarned: number; cumUsefulSpend: number;
  flags: EconomyFlagCode[];
}

export interface EconomyReport {
  classId: ClassId;
  model: EconomyPlayerModel;
  /** Highest level the run allows (ECONOMY.levelCap, or the projection cap). */
  cap: number;
  /** The value each choice flag took in this playthrough. */
  choices: Record<string, string>;
  phases: EconomyPhaseReport[];
  /** levelHours[L] = cumulative hours when level L was reached (index 0 unused, levelHours[1] = 0). */
  levelHours: (number | null)[];
  /** skillsAtLevel[L] = every tracked skill's level when character level L was reached (feeds the combat loadouts). */
  skillsAtLevel: (Partial<Record<SkillId, number>> | null)[];
  /** Content the run never got to (an exclusive branch not taken, or never unlocked). */
  skipped: { quests: string[]; spawns: string[] };
  /** Quests done (ids), for the gate checks. */
  done: string[];
  totals: {
    hours: number; level: number; xp: number; coinsEarned: number; spentGear: number; spentConsumables: number;
    gearResold: number; coinsLeft: number; quests: number; kills: number; skillUps: number;
  };
}

// ---------------------------------------------------------------- content indexes (built once)

interface FlagInfo { values: string[]; boundQuest?: string }

/** Every flag the content can set, the values it can take (in pack order), and the quest whose choice sets it. */
export function buildFlagIndex(): Map<string, FlagInfo> {
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

/** Enemy HP relative to a normal enemy of its level: scales hits dealt and taken per kill. */
function hpRatio(e: EnemyDef): number {
  const normal = Math.max(1, Math.round(avgHit(e.level) * Math.min(5, 3 + e.level / 5)));
  return enemyStats(e).hp / normal;
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

// ---------------------------------------------------------------- projection content (PROJECTION, sim only)

/** A sim quest: the parts of QuestDef the run reads. Projected quests have no zone (no zone XP bonus). */
type SimQuest = Pick<QuestDef, 'id' | 'level' | 'tier' | 'stages' | 'reward'> & { zone?: QuestDef['zone'] };

interface SimShop { phase: number; hidden?: Condition; stock: readonly string[] }

interface ProjectedContent {
  phases: (EconomyPhase & { projected: true; talentRanks: number })[];
  activities: Activity[][];
  items: Record<string, ItemDef>;
  shops: SimShop[];
}

/** Synthetic quests, mobs and shops for the PROJECTION bands (src/data/economyProjection.ts). */
function buildProjection(cap: number, firstIndex: number): ProjectedContent {
  const out: ProjectedContent = { phases: [], activities: [], items: {}, shops: [] };
  const T = PROJECTION_TEMPLATE;
  for (const b of PROJECTED_BANDS) {
    if (b.band[0] >= cap) break;
    const pi = firstIndex + out.phases.length;
    const hi = Math.min(cap, b.band[1]);
    out.phases.push({ id: b.id, name: `PROJECTION ${b.band[0]}-${hi}`, zones: [], band: [b.band[0], hi], projected: true, talentRanks: b.talentRanks });
    const c = bandContent(b);
    const acts: Activity[] = [];
    const span = hi - b.band[0];
    const levelAt = (k: number, n: number): number => b.band[0] + Math.min(span, Math.round(((k + 0.5) / n) * span));
    for (const tier of ['side', 'main', 'finale'] as const) {
      const n = c.quests[tier];
      for (let k = 0; k < n; k++) {
        const level = tier === 'finale' ? b.band[0] + Math.round(((k + 1) / n) * span) : levelAt(k, n);
        const q: SimQuest = { id: `${b.id}-${tier}-${k}`, level, tier, stages: [], reward: { gold: Math.round(T.rawQuestGold[tier] * b.goldTier), items: [] } };
        acts.push({ kind: 'quest', level, q });
      }
    }
    const enemy = (id: string, level: number, rank: Rank, respawn: number): EnemyDef => ({
      id, name: id, level, rank, family: 'soft', damageType: 'crush', aggressive: true, loot: [], gold: [Math.round(T.rawEnemyGold[0] * b.goldTier), Math.round(T.rawEnemyGold[1] * b.goldTier)],
      model: 'gnome', color: 0, scale: 1, respawnSeconds: respawn, examine: '', wants: '',
    });
    const group = (e: EnemyDef, count: number, index: number): Activity => ({
      kind: 'spawn', level: e.level, e, index: -1, g: { id: `${e.id}-g${index}`, zone: 'verge', enemy: e.id, x: 0, z: 0, count, spread: 0 },
    });
    for (let k = 0; k < c.groups; k++) {
      const e = enemy(`${b.id}-mob-${k}`, levelAt(k, c.groups), 'normal', 60);
      acts.push(group(e, T.groupSize, k));
    }
    for (let k = 0; k < c.elites; k++) acts.push(group(enemy(`${b.id}-elite-${k}`, levelAt(k, c.elites), 'elite', 300), 1, k));
    for (let k = 0; k < c.bosses; k++) acts.push(group(enemy(`${b.id}-boss-${k}`, hi, 'boss', 0), 1, k));
    out.activities.push(acts);
    // Shop: one blooming item per slot per class at the band's ilvl, plus a heal potion tier.
    const stock: string[] = [];
    for (const [cls, kit] of Object.entries(PROJECTION_KIT) as [ClassId, (typeof PROJECTION_KIT)[ClassId]][]) {
      for (const slot of kit.slots) {
        const id = `${b.id}-${cls}-${slot}`;
        const rarity = T.bloomingSlots.includes(slot) ? 'blooming' : 'sprouted';
        const def: ItemDef = {
          id, name: id, icon: '', kind: slot === 'weapon' ? 'weapon' : slot === 'trinket' ? 'trinket' : slot === 'offhand' ? 'offhand' : 'armor',
          slot, ilvl: b.shopIlvl, rarity, value: T.valuePerIlvlSq[rarity] * b.shopIlvl * b.shopIlvl, examine: '',
          ...(slot === 'weapon' ? { weaponClass: kit.weaponClass, damageType: kit.damageType } : {}),
          ...(slot === 'offhand' ? { armorType: 'shield' as const } : slot !== 'trinket' && slot !== 'weapon' ? { armorType: kit.armorType } : {}),
        };
        out.items[id] = def;
        stock.push(id);
      }
    }
    const potId = `${b.id}-potion`;
    const pf = b.shopIlvl / T.potion.ilvl;   // heal and price grow with level, like HP (0.75 coins per hp, as shipped)
    out.items[potId] = { id: potId, name: potId, icon: '', kind: 'potion', heal: Math.round(T.potion.heal * pf), value: Math.round(T.potion.value * pf), examine: '' };
    stock.push(potId);
    out.shops.push({ phase: pi, stock });
  }
  return out;
}

// ---------------------------------------------------------------- the run

type Activity =
  | { kind: 'quest'; level: number; q: SimQuest }
  | { kind: 'spawn'; level: number; g: SpawnGroup; e: EnemyDef; index: number };

interface SkillTrack { level: number; xp: number }

function median(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const round = (x: number, d = 2): number => Math.round(x * 10 ** d) / 10 ** d;

/** Normal kills per level at level L, against a normal enemy of the same level. */
export function killsPerLevelAt(level: number): number {
  return xpToNextLevel(level) / Math.max(1, killXpAt(level, 'normal', level));
}

export interface EconomyRunOptions extends Partial<EconomyPlayerModel> {
  /** Highest level. Above ECONOMY.levelCap the PROJECTION bands are played after the Verge. Default levelCap. */
  cap?: number;
}

/** Runs one class through every phase. Deterministic: the same content and model give the same report. */
export function runEconomy(opts: EconomyRunOptions = {}): EconomyReport {
  const { cap: capOpt, ...modelOpts } = opts;
  const model: EconomyPlayerModel = { ...DEFAULT_PLAYER, ...modelOpts };
  const classId = model.classId;
  const cap = Math.max(1, capOpt ?? ECONOMY.levelCap);

  // Content indexes.
  const flagIndex = buildFlagIndex();
  const dialogueStarted = questsStartedByDialogue();
  const choices: Record<string, string> = {};
  for (const [name, f] of flagIndex) {
    const pick = (name === 'c2-trial' ? model.choices[name] ?? classId : model.choices[name]) ?? f.values[0];
    if (pick !== undefined) choices[name] = pick;
  }
  const tiedSpawns = new Map<string, number[]>();   // quest id -> SPAWNS indexes cleared once after it
  const proj = cap > ECONOMY.levelCap ? buildProjection(cap, ECONOMY_PHASES.length) : null;
  const allPhases: (EconomyPhase & { projected?: boolean; talentRanks?: number })[] = [...ECONOMY_PHASES, ...(proj?.phases ?? [])];
  const phaseActivities: Activity[][] = ECONOMY_PHASES.map(() => []);
  const phaseRaids: RaidDef[][] = ECONOMY_PHASES.map(() => []);
  for (const r of Object.values(RAIDS)) phaseRaids[phaseIndexFor(r.zone, r.level)].push(r);
  for (const q of Object.values(QUESTS)) phaseActivities[questPhaseIndex(q)].push({ kind: 'quest', level: q.level, q });
  SPAWNS.forEach((g, index) => {
    const e = ENEMIES[g.enemy];
    if (!e) return;
    const tied = tiedQuest(g.when);
    if (tied && QUESTS[tied]) { (tiedSpawns.get(tied) ?? tiedSpawns.set(tied, []).get(tied)!).push(index); return; }
    phaseActivities[spawnPhaseIndex(g, e.level)].push({ kind: 'spawn', level: e.level, g, e, index });
  });
  if (proj) phaseActivities.push(...proj.activities);
  const item = (id: string | undefined): ItemDef | undefined => (id ? ITEMS[id] ?? proj?.items[id] : undefined);
  const shops: SimShop[] = Object.values(NPCS).filter((n) => n.shop && n.shop.length > 0)
    .map((n) => ({ phase: shopPhaseIndex(n.zone), hidden: n.hidden, stock: n.shop! }));
  if (proj) shops.push(...proj.shops);

  // Player state.
  const done = new Set<string>();
  const flags = new Map<string, string>();
  for (const [name, f] of flagIndex) if (!f.boundQuest && choices[name] !== undefined) flags.set(name, choices[name]);
  let level = 1, xp = 0, coins: number = START_GOLD, classChosen = false, finales = 0, projRanks = 0;
  const equipped: Partial<Record<EquipSlot, string>> = {};
  for (const [slot, it] of Object.entries(START_EQUIPMENT)) if (it) equipped[slot as EquipSlot] = it;
  let potions = 0, potionNeed = 0;   // heal potions carried; potions drunk since the last shop
  for (const s of START_INVENTORY) if (ITEMS[s.item]?.heal) potions += s.count;
  const skills = new Map<SkillId, SkillTrack>();
  const track = (id: SkillId): SkillTrack => skills.get(id) ?? skills.set(id, { level: START_SKILL, xp: 0 }).get(id)!;
  track('toughness');
  let clock = 0;   // hours
  const levelHours: (number | null)[] = new Array(cap + 1).fill(null);
  levelHours[1] = 0;
  const skillsAtLevel: (Partial<Record<SkillId, number>> | null)[] = new Array(cap + 1).fill(null);
  const snapshot = (): Partial<Record<SkillId, number>> => Object.fromEntries([...skills].map(([k, v]) => [k, v.level]));
  skillsAtLevel[1] = snapshot();
  const skippedSpawns: string[] = [];

  const ctx = (): CondCtx => ({ done, level, classId, classChosen, flags });

  // Gear-lag tracking: each phase's own kit items, from opening to owning.
  interface Tracked { phase: number; def: ItemDef; openAt: number | null; ownedAt: number | null; beaten: boolean }
  const tracked: Tracked[] = [];

  // Per-phase accumulators (reset at each phase start).
  let acc = newAcc();
  function newAcc() {
    return {
      questH: 0, killH: 0, grindH: 0, quests: 0, kills: 0, grindKills: 0, xp: 0, coins: 0, loot: 0, gear: 0, cons: 0, resold: 0,
      shortfall: 0, normalXp: [] as number[], grindNormalXp: [] as number[], skillUps: 0,
      raidH: 0, raidXp: 0, contentXp: 0,
      weaponUses: 0, cappedUses: 0, toughUses: 0, toughCapped: 0, active: new Set<SkillId>(),
    };
  }

  function gainXp(amount: number): void {
    xp += amount;
    acc.xp += amount;
    while (level < cap && xp >= xpToNextLevel(level)) {
      xp -= xpToNextLevel(level);
      level++;
      levelHours[level] = round(clock, 3);
      skillsAtLevel[level] = snapshot();
    }
  }

  /** Trains a skill with `uses` uses (catch-up rule included); returns the uses that landed at the cap. */
  function train(s: SkillTrack, uses: number): number {
    const skCap = skillCapAt(level);
    let left = uses;
    while (left > 1e-9 && s.level < skCap) {
      const v = skillUseValue(s.level, skCap);
      const needUses = (skillUsesToNext(s.level) - s.xp) / v;
      if (left >= needUses) {
        left -= needUses;
        s.level++;
        s.xp = 0;
        acc.skillUps++;
      } else {
        s.xp += left * v;
        left = 0;
      }
    }
    if (s.level >= skCap) s.xp = 0;
    return left;
  }

  /** The weapon or school skills one kill trains, with their share of the uses. */
  function usedSkills(): [SkillId, number][] {
    if (classId === 'mage') return Object.entries(model.schoolSplit) as [SkillId, number][];
    return [[weaponSkillFor(item(equipped.weapon)), 1]];
  }

  function kill(e: EnemyDef, grind: boolean): void {
    const sec = model.killSeconds[e.rank];
    clock += sec / 3600;
    if (grind) { acc.grindH += sec / 3600; acc.grindKills++; } else { acc.killH += sec / 3600; acc.kills++; }
    const r = hpRatio(e);
    const hits = model.hitsPerNormalKill[classId] * r;
    for (const [sk, w] of usedSkills()) {
      acc.active.add(sk);
      acc.weaponUses += hits * w;
      acc.cappedUses += train(track(sk), hits * w);
    }
    const taken = model.hitsTakenPerNormalKill * r;
    acc.toughUses += taken;
    acc.toughCapped += train(track('toughness'), taken);
    potionNeed += model.potionsPerCombatHour * (sec / 3600);
    const x = killXpAt(e.level, e.rank, level);
    if (e.rank === 'normal') (grind ? acc.grindNormalXp : acc.normalXp).push(x);
    if (!grind) acc.contentXp += x;
    gainXp(x);
    const loot = lootValue(e);
    const c = meanGold(e) + loot;
    coins += c;
    acc.coins += c;
    acc.loot += loot;
  }

  function equipOrSell(itemId: string, count: number): void {
    const def = item(itemId);
    if (!def) return;
    if (def.kind === 'potion' && def.heal) { potions += count; return; }
    for (let i = 0; i < count; i++) {
      if (def.slot && usableBy(def, classId) && itemScore(def) > itemScore(item(equipped[def.slot]))) {
        replace(def.slot, itemId);
        continue;
      }
      if (def.questItem) continue;
      coins += sellPrice(def);
      acc.coins += sellPrice(def);
    }
  }

  function replace(slot: EquipSlot, itemId: string): void {
    const old = item(equipped[slot]);
    if (old && !old.questItem) { coins += sellPrice(old); acc.resold += sellPrice(old); }
    equipped[slot] = itemId;
  }

  function openShops(c: CondCtx, upToPhase: number): ItemDef[] {
    const seen = new Set<string>();
    const items: ItemDef[] = [];
    for (const s of shops) {
      if (s.phase > upToPhase) continue;
      if (s.hidden && evalCondition(s.hidden, c, 'content')) continue;
      for (const id of s.stock) {
        const def = item(id);
        if (!def || seen.has(id)) continue;
        seen.add(id);
        items.push(def);
      }
    }
    return items;
  }

  /** Marks tracked kit items as opened (ilvl reached, gate open) and owned (the slot's gear scores at least as high). */
  function updateGear(): void {
    const c = ctx();
    for (const t of tracked) {
      const score = itemScore(item(equipped[t.def.slot!]));
      if (t.openAt === null && (t.def.ilvl ?? 0) <= level && (!t.def.gate || evalCondition(t.def.gate.when, c, 'gate'))) {
        t.openAt = clock;
        if (score >= itemScore(t.def)) { t.beaten = true; t.ownedAt = clock; }
      }
      if (t.openAt !== null && t.ownedAt === null && score >= itemScore(t.def)) t.ownedAt = clock;
    }
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
    updateGear();
    // Gear: per slot, the best affordable upgrade for the class at or below the player's level, gate open.
    for (const slot of model.slotOrder) {
      const cur = itemScore(item(equipped[slot]));
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
    updateGear();
  }

  /** Best class kit (one item per slot, gates ignored) in the shops that belong to exactly this phase. */
  function phaseKit(phaseIdx: number): ItemDef[] {
    if (phaseIdx >= allPhases.length) return [];
    const c = ctx();
    const bySlot = new Map<EquipSlot, ItemDef>();
    for (const s of shops) {
      if (s.phase !== phaseIdx) continue;
      if (s.hidden && evalCondition(s.hidden, c, 'content')) continue;
      for (const id of s.stock) {
        const d = item(id);
        if (!d?.slot || !usableBy(d, classId)) continue;
        const cur = bySlot.get(d.slot);
        if (!cur || itemScore(d) > itemScore(cur)) bySlot.set(d.slot, d);
      }
    }
    return [...bySlot.values()];
  }

  /** One clear of a raid (src/raids.ts): its hours, XP, and coins (the clear gold plus the expected sale of its drops).
   * Raid kills pay nothing themselves, so no kill XP, loot or gold here; no skill uses; no gear from raids. */
  function clearRaid(raid: RaidDef): void {
    const h = model.raidMinutes / 60;
    clock += h;
    acc.raidH += h;
    const x = raidClearXp(raid.level, level);
    acc.raidXp += x;
    gainXp(x);
    const drops = raid.drops.reduce((s, id) => s + (ITEMS[id] ? ITEMS[id].value / 2 : 0), 0) * RAID_TUNING.dropChance;
    const g = raidClearGold(raid.level) + drops;
    coins += g;
    acc.coins += g;
  }

  function doQuest(q: SimQuest): void {
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
    const qx = questXpAt(q, level);
    acc.contentXp += qx;
    gainXp(qx);
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

  allPhases.forEach((phase, pi) => {
    acc = newAcc();
    const levelIn = level;
    if (phase.talentRanks) projRanks += phase.talentRanks;
    const kitNow = phaseKit(pi);
    for (const def of kitNow) tracked.push({ phase: pi, def, openAt: null, ownedAt: null, beaten: false });
    updateGear();
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
        if (!phase.projected) startable = startableQuests(ctx());
      } else {
        const clears = a.e.respawnSeconds > 0 ? model.clearsPerPhase : 1;
        const n = Math.round(clears * a.g.count);
        for (let k = 0; k < n; k++) kill(a.e, false);
        if (!phase.projected) startable = startableQuests(ctx());
      }
      shop(pi);
    }
    carry = pending;   // not ready yet: try again in the next phase

    // Raid clears: each raid of this phase, once the player is high enough and the horn is unlocked. Before the grind.
    if (model.raidClears > 0) {
      for (const raid of phaseRaids[pi] ?? []) {
        if (level < raid.minLevel || !evalCondition(RAID_UNLOCK, ctx(), 'content')) continue;
        for (let k = 0; k < model.raidClears; k++) clearRaid(raid);
        shop(pi);
      }
    }

    // Grind the phase's best normal mob up to the phase's top level.
    const target = Math.min(cap, phase.grindTo ?? phase.band[1]);
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

    const hours = acc.questH + acc.killH + acc.grindH + acc.raidH;
    const contentHours = acc.questH + acc.killH;
    const kit = phaseKit(pi);
    const kitCost = kit.reduce((s, d) => s + d.value, 0);
    const owned = kit.filter((d) => itemScore(item(equipped[d.slot!])) >= itemScore(d)).reduce((s, d) => s + d.value, 0);
    const nextKitCost = phaseKit(pi + 1).reduce((s, d) => s + d.value, 0);
    cumEarned += acc.coins;
    cumSpend += acc.gear + acc.cons;
    const talentPoints = level - 1 + finales;
    const kpl: number[] = [];
    for (let L = levelIn; L <= Math.max(levelIn, Math.min(level, cap - 1)); L++) kpl.push(killsPerLevelAt(L));
    const active = [...acc.active];
    const low = active.length
      ? active.reduce((a, b) => (track(b).level < track(a).level ? b : a))
      : usedSkills()[0][0];
    phases.push({
      id: phase.id, name: phase.name, band: phase.band, projected: !!phase.projected, levelIn, levelOut: level,
      hours: round(hours), questHours: round(acc.questH), killHours: round(acc.killH), grindHours: round(acc.grindH),
      raidHours: round(acc.raidH),
      raidXp: Math.round(acc.raidXp), raidXpPerHour: acc.raidH > 0 ? Math.round(acc.raidXp / acc.raidH) : 0,
      contentXpPerHour: contentHours > 0 ? Math.round(acc.contentXp / contentHours) : 0,
      quests: acc.quests, kills: acc.kills, grindKills: acc.grindKills,
      xp: Math.round(acc.xp), xpPerHour: hours > 0 ? Math.round(acc.xp / hours) : 0,
      xpPerNormalKill: median(acc.normalXp.length ? acc.normalXp : acc.grindNormalXp),
      killsPerLevel: Math.round(median(kpl)),
      coinsEarned: Math.round(acc.coins), coinsPerHour: hours > 0 ? Math.round(acc.coins / hours) : 0,
      lootShare: acc.coins > 0 ? round(acc.loot / acc.coins) : 0,
      spentGear: Math.round(acc.gear), spentConsumables: Math.round(acc.cons), gearResold: Math.round(acc.resold),
      potionShortfall: round(acc.shortfall, 1),
      carriedOut: Math.round(coins), nextKitCost,
      carryRatio: nextKitCost > 0 ? round(coins / nextKitCost) : null,
      kitCost, kitShare: kitCost > 0 ? round(owned / kitCost) : null,
      gearLag: [], gearLagMean: null, gearLagMax: null,   // filled after the run (an item may be bought later)
      skillUps: acc.skillUps, skillUpsPerHour: hours > 0 ? round(acc.skillUps / hours, 1) : 0,
      skills: snapshot(), activeSkills: active, lowSkill: low, weaponSkill: track(low).level, skillCap: skillCapAt(level),
      capTimeShare: acc.weaponUses > 0 ? round(acc.cappedUses / acc.weaponUses) : 0,
      toughnessCapShare: acc.toughUses > 0 ? round(acc.toughCapped / acc.toughUses) : 0,
      talentPoints, talentSpendable: classChosen ? spendableRanks(classId, ctx()) + projRanks : 0,
      cumCoinsEarned: Math.round(cumEarned), cumUsefulSpend: Math.round(cumSpend),
      flags: [],
    });
  });

  // Gear lag per phase kit slot.
  phases.forEach((p, pi) => {
    const lags: GearLag[] = tracked.filter((t) => t.phase === pi).map((t) => ({
      slot: t.def.slot!, item: t.def.id, owned: t.ownedAt !== null,
      hours: t.openAt === null || t.beaten ? null : round((t.ownedAt ?? clock) - t.openAt),
    }));
    const hs = lags.map((l) => l.hours).filter((h): h is number => h !== null);
    p.gearLag = lags;
    p.gearLagMean = hs.length ? round(hs.reduce((a, b) => a + b, 0) / hs.length) : null;
    p.gearLagMax = hs.length ? Math.max(...hs) : null;
  });

  for (const a of carry) if (a.kind === 'spawn') skippedSpawns.push(a.g.id ?? a.g.enemy);
  const skippedQuests = Object.keys(QUESTS).filter((id) => !done.has(id));
  for (const [qid, idxs] of tiedSpawns) if (!done.has(qid)) for (const i of idxs) skippedSpawns.push(SPAWNS[i].id ?? SPAWNS[i].enemy);

  const report: EconomyReport = {
    classId, model, cap, choices, phases, levelHours, skillsAtLevel, skipped: { quests: skippedQuests, spawns: skippedSpawns },
    done: [...done].filter((id) => QUESTS[id]),
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

/** Every target in ECONOMY_TARGETS the report misses. An empty list means the curve is in shape.
 * Whole-game flags (FLAT_XP_SCALING, FRONT_LOADED_COINS) and the phase-length band look at shipped phases only; the
 * phase-hour band and SHRINKING_PHASE are judged among phases of the same kind (shipped, or projected).
 * `scope: 'margin'` (the PLAYER_VARIANTS) keeps only MARGIN_FLAGS. */
export function checkEconomy(report: EconomyReport, scope: 'all' | 'margin' = 'all'): EconomyFlag[] {
  const all = checkAll(report).filter((f) => !WATCH_FLAGS.includes(f.code));
  return scope === 'all' ? all : all.filter((f) => MARGIN_FLAGS.includes(f.code));
}

/** Flags that are measured and printed but do not fail --check yet, each with the reason:
 * GEAR_INSTANT: in most phases every kit item is owned the moment it opens (coins carried in pay for it), so the shop
 * is not a goal. Cutting late coins does not change that (tried: coin growth 1.08-1.09, lag still ~0 from Hedgewood
 * on) and cutting early coins breaks the potions-x3 margin. What would: a pricier late sink tier (see economy.md,
 * "Gear as a goal"). Kept visible so that change can be measured; GEAR_LATE (the other side) does fail. */
export const WATCH_FLAGS: readonly EconomyFlagCode[] = ['GEAR_INSTANT'];

/** The WATCH_FLAGS a report raises (printed by the CLI as "watch"). */
export function watchEconomy(report: EconomyReport): EconomyFlag[] {
  return checkAll(report).filter((f) => WATCH_FLAGS.includes(f.code));
}

/** The flags a PLAYER_VARIANT must not raise: money, grind, skill cap, talents and level cost. The pacing flags
 * (phase length, skill-ups per hour, gear lag) describe the reference player's clock: a player who walks 1.5x slower
 * has fewer skill-ups per hour and longer phases by definition, so those are checked for the default player only. */
export const MARGIN_FLAGS: readonly EconomyFlagCode[] = [
  'TOO_RICH', 'TOO_POOR', 'GRIND_WALL', 'SKILL_CAPPED_EARLY', 'UNSPENT_TALENTS', 'FLAT_XP_SCALING', 'FRONT_LOADED_COINS',
  'FALLING_KILLS_PER_LEVEL', 'RAID_FARM',
];

function checkAll(report: EconomyReport): EconomyFlag[] {
  const T = ECONOMY_TARGETS;
  const out: EconomyFlag[] = [];
  const ps = report.phases;
  const capFrom = ps.findIndex((p) => p.id === T.skillCapFromPhase);
  const shipped = ps.filter((p) => !p.projected);
  const medOf = (list: readonly EconomyPhaseReport[]) => median(list.map((p) => p.hours));
  ps.forEach((p, i) => {
    const peers = p.projected ? ps.filter((q) => q.projected) : shipped;
    const med = medOf(peers);
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
      out.push({ code: 'SKILL_CAPPED_EARLY', phase: p.id, value: p.capTimeShare, limit: T.maxCapTimeShare, message: `${p.id}: weapon skill at its cap for ${Math.round(p.capTimeShare * 100)}% of its uses` });
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
    const earlier = ps.slice(0, i).filter((q) => q.projected === p.projected);
    if (earlier.length >= 2) {
      const em = medOf(earlier);
      if (p.hours < T.minHoursVsEarlier * em) {
        out.push({ code: 'SHRINKING_PHASE', phase: p.id, value: round(p.hours / em), limit: T.minHoursVsEarlier, message: `${p.id}: ${p.hours} h vs median ${round(em)} h of the phases before it` });
      }
    }
    if (p.hours > 0 && p.skillUpsPerHour < T.minSkillUpsPerHour) {
      out.push({ code: 'SLOW_SKILL', phase: p.id, value: p.skillUpsPerHour, limit: T.minSkillUpsPerHour, message: `${p.id}: ${p.skillUpsPerHour} skill-ups per hour` });
    }
    if (p.raidHours > 0 && p.contentXpPerHour > 0 && p.raidXpPerHour > T.raidXpPerHourMax * p.contentXpPerHour) {
      out.push({ code: 'RAID_FARM', phase: p.id, value: round(p.raidXpPerHour / p.contentXpPerHour), limit: T.raidXpPerHourMax, message: `${p.id}: raids pay ${p.raidXpPerHour} XP/h vs ${p.contentXpPerHour} XP/h from quests and kills` });
    }
    if (p.gearLagMean !== null && p.kitShare !== null) {
      if (p.gearLagMean < T.minGearLagHours) {
        out.push({ code: 'GEAR_INSTANT', phase: p.id, value: p.gearLagMean, limit: T.minGearLagHours, message: `${p.id}: kit items owned ${p.gearLagMean} h after they open, on average` });
      }
      if (p.gearLagMean > T.maxGearLagShare * p.hours) {
        out.push({ code: 'GEAR_LATE', phase: p.id, value: round(p.gearLagMean / p.hours), limit: T.maxGearLagShare, message: `${p.id}: kit items owned ${p.gearLagMean} h after they open (phase ${p.hours} h)` });
      }
    }
    const prev = ps[i - 1];
    if (prev && p.projected && prev.killsPerLevel > 0 && p.killsPerLevel < T.minKillsPerLevelGrowth * prev.killsPerLevel) {
      out.push({ code: 'FALLING_KILLS_PER_LEVEL', phase: p.id, value: round(p.killsPerLevel / prev.killsPerLevel), limit: T.minKillsPerLevelGrowth, message: `${p.id}: ${p.killsPerLevel} kills per level vs ${prev.killsPerLevel} before` });
    }
  });
  const first = shipped[0], last = shipped[shipped.length - 1];
  if (first && last && first.xpPerNormalKill > 0) {
    const g = last.xpPerNormalKill / first.xpPerNormalKill;
    if (g < T.minXpPerKillGrowth) {
      out.push({ code: 'FLAT_XP_SCALING', value: round(g), limit: T.minXpPerKillGrowth, message: `normal-kill XP ${first.id} ${first.xpPerNormalKill} -> ${last.id} ${last.xpPerNormalKill} (x${round(g)})` });
    }
  }
  const total = shipped.reduce((s, p) => s + p.coinsEarned, 0);
  const front = shipped.filter((p) => T.frontPhases.includes(p.id)).reduce((s, p) => s + p.coinsEarned, 0);
  if (total > 0 && front / total > T.maxFrontCoinShare) {
    out.push({ code: 'FRONT_LOADED_COINS', value: round(front / total), limit: T.maxFrontCoinShare, message: `${T.frontPhases.join('+')} earn ${front} of ${total} coins (${Math.round((front / total) * 100)}%)` });
  }
  return out;
}

/** Flags the PROJECTION (phases past the shipped cap) is known to raise, each with its reason. --check and the test
 * accept exactly these on projected phases (by code, any projected phase) and nothing else; a shipped phase never
 * gets an exemption. Empty = the projection must be flag-free. */
export const EXPECTED_PROJECTION_FLAGS: Partial<Record<EconomyFlagCode, string>> = {
  SLOW_SKILL: 'From about level 50 a projected band takes 6.6-7.3 h for 5 levels (kills per level keep rising, as they '
    + 'must), so a skill gains about 3 levels an hour (warden, slinger; the mage trains four skills and passes). '
    + 'Fixing it needs more hits per kill (enemy HP past 50 is not designed yet) or a flatter post-knee uses curve; '
    + 'decide with the level-50 content, not before.',
};

export function isExpectedProjectionFlag(report: EconomyReport, f: EconomyFlag): boolean {
  if (!f.phase || !(f.code in EXPECTED_PROJECTION_FLAGS)) return false;
  return report.phases.find((p) => p.id === f.phase)?.projected === true;
}

/** Runs every class with the default player (all flags) and every PLAYER_VARIANT (MARGIN_FLAGS); the --check set. */
export function checkAllVariants(classes: readonly ClassId[], cap?: number): { classId: ClassId; variant: string; report: EconomyReport; flags: EconomyFlag[] }[] {
  const out: { classId: ClassId; variant: string; report: EconomyReport; flags: EconomyFlag[] }[] = [];
  for (const classId of classes) {
    for (const [variant, o] of [['default', {}] as const, ...Object.entries(PLAYER_VARIANTS)]) {
      const report = runEconomy({ classId, cap, ...o });
      out.push({ classId, variant, report, flags: checkEconomy(report, variant === 'default' ? 'all' : 'margin') });
    }
  }
  return out;
}
