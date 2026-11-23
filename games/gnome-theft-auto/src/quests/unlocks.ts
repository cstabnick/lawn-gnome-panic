// When each side quest unlocks: the one table of story beats (roadmap docs/roadmaps/gta-quest-flow-taxi.md). Pure data and
// pure functions, no DOM, so cutscene and story writers can read it.
//
// A side quest listed here is offered only once its `after` story quest is done. Anything a save has already started or
// finished stays as it is (old saves keep their progress). The Tessie quest also keeps an older save's unlock: its
// TESSIE.unlockKey pseudo-entry (tessieUnlock.ts) turned 'done' means unlocked, whatever the table says.
//
// Story order, for pacing: prologue-fresh-kiln, ch1-mowers-keepers, ch1-two-coat-tail, ch1-tax-break-in,
// ch1-founders-boot, ch2-dew-run, ch2-sprinkler-gauntlet, ch2-vespers-offer, ch2-unmowed-tablet, ch3-salvage-raid,
// ch3-kiln-resin-ice, ch3-tundra-drift-run, ch4-runway-flares, ch4-sandpit-drop, ch4-spade-truce, ch5-even-cut.
import { TESSIE } from '../config';
import type { QuestSave } from './types';

export interface SideUnlock {
  /** The side quest (QuestDef.id). */
  questId: string;
  /** The story quest that must be 'done' first. */
  after: string;
  /** Why here, for writers (not shown in game). */
  why: string;
}

export const SIDE_UNLOCKS: readonly SideUnlock[] = [
  { questId: 'sq-grid-truthers', after: 'prologue-fresh-kiln', why: 'Downtown visits only: a gentle first side job right after Pip.' },
  { questId: 'sq-snail-rigging', after: 'ch1-mowers-keepers', why: 'Downtown alley; the player now knows Side-Valve and the Watch.' },
  { questId: 'sq-big-lou-embargo', after: 'ch1-two-coat-tail', why: 'Downtown crack job; the player has tailed and fought by now.' },
  { questId: 'sq-mulch-pyramid', after: 'ch1-founders-boot', why: 'Patio Heights to Side-Valve haul; end of chapter 1.' },
  { questId: 'sq-biscuit-hotdog', after: 'ch2-dew-run', why: 'Granny Gnertrude\'s barn opens in chapter 2; first combine haul.' },
  { questId: 'sq-castaway-drydock', after: 'ch2-sprinkler-gauntlet', why: 'Meets Driftwood in Cloverfield before the Loch Moss hunt.' },
  { questId: 'sq-porcelain-blues', after: 'ch2-vespers-offer', why: 'Porcelain theme after Vesper\'s porcelain guards.' },
  { questId: 'sq-fescue-fugitive', after: 'ch2-unmowed-tablet', why: 'Elder Bracken\'s Hollow opens with the Cracked Tablet.' },
  { questId: TESSIE.questId, after: 'ch3-salvage-raid', why: 'Driftwood (met in Cloverfield) calls the player to Loch Moss.' },
  { questId: 'sq-hose-revolt', after: 'ch3-kiln-resin-ice', why: 'Heavy HOA heat side job once the player has the tundra run.' },
  { questId: 'sq-hoa-audit', after: 'ch3-tundra-drift-run', why: 'Spans all five biomes: only once the Fells and Dust Flats are open.' },
  { questId: 'sq-porcelain-support', after: 'ch4-sandpit-drop', why: 'Clara\'s follow-up, late game, gentle driving between battles.' },
];

const BY_ID = new Map(SIDE_UNLOCKS.map((u) => [u.questId, u]));

/** The table row for a quest, or undefined (story quests and anything unlisted are never locked by this table). */
export function unlockRule(questId: string): SideUnlock | undefined {
  return BY_ID.get(questId);
}

/** Is this quest unlocked by the table? True for unlisted quests, for quests already started or done, and when the beat is done. */
export function unlockMet(questId: string, saves: Record<string, QuestSave>): boolean {
  const rule = BY_ID.get(questId);
  if (!rule) return true;
  if (saves[questId]) return true;
  if (questId === TESSIE.questId && saves[TESSIE.unlockKey]?.state === 'done') return true;
  return saves[rule.after]?.state === 'done';
}

/** The table's quests that are unlocked in this save, in table order. */
export function unlockedSideIds(saves: Record<string, QuestSave>): string[] {
  return SIDE_UNLOCKS.filter((u) => unlockMet(u.questId, saves)).map((u) => u.questId);
}

/** Story quests' marker colour (maps, 3D beam and badge). */
export const MAIN_COLOR = '#ffd23f';
/** The active objective's marker colour. */
export const OBJECTIVE_COLOR = '#ff7a00';

/** Each giver's side-quest marker colour (maps, 3D beam and "?" badge) while it offers a side quest. */
export const SIDE_COLORS: Readonly<Record<string, string>> = {
  'cloverfield-barn': '#ff9f9f',
  'unmowed-hollow': '#6fd06a',
  strangers: '#3ad1c4',
  'strangers-gnomecino': '#b07cff',
  'strangers-canal': '#4a8cff',
  'strangers-porch': '#ff8fc8',
  'loch-driftwood': '#c9f25a',
};

/** A giver's side-quest colour, '#3ad1c4' for one not in SIDE_COLORS. */
export function sideColor(giverId: string): string {
  return SIDE_COLORS[giverId] ?? '#3ad1c4';
}
