// E24 mechanic: client briefs and how a finished car is scored against one (STUB: filled by its E24 issue). Pure.
import type { Loadout } from '@lawn/glaze';
import type { Brief, BriefScore, HueFamily, Want } from './types';

export const BRIEFS: readonly Brief[] = [];

/** The colour family of 0xRRGGBB. */
export function hueFamily(hex: number): HueFamily { void hex; return 'grey'; }

/** Whether `final` meets `want` (start = the car as it arrived). */
export function wantMet(want: Want, start: Loadout, final: Loadout): boolean { void want; void start; void final; return false; }

/** Score a finished car. */
export function scoreBrief(brief: Brief, start: Loadout, final: Loadout, partsCost: number): BriefScore {
  void brief; void start; void final; void partsCost; return { score: 0, stars: 1, overBudget: 0, lines: [] };
}

/** Briefs open at a mechanic level. */
export function briefsForLevel(level: number): Brief[] { return BRIEFS.filter((b) => b.minLevel <= level); }

/** A seeded pick from briefsForLevel(level), never `lastId` when another is open. */
export function pickBrief(level: number, seed: number, lastId: string | null): Brief | null {
  const open = briefsForLevel(level).filter((b) => b.id !== lastId);
  const list = open.length ? open : briefsForLevel(level);
  return list.length ? list[Math.abs(Math.floor(seed)) % list.length] : null;
}
