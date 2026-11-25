// E23 L103: how much Hat Watch a quest step allows. Shoot-outs where the player is meant to fight someone else (a convoy's
// escorts, the boss's guards, a derby) would otherwise also be a fight with three hats at once, which the player cannot
// win; there the Watch may notice (1 hat) but sends no pursuits. Every other step is free: story heat that is the point
// of a step (a `heatOnEnter: 4` getaway) stays. A quest overrides with QuestDef.hoa / hoaSteps.
import type { HoaPolicy, ObjectiveDef, QuestDef } from './types';

/** Objective kinds that are mostly shooting: capped at one hat unless the quest says otherwise. */
export const SHOOTOUT_KINDS: ReadonlySet<ObjectiveDef['kind']> = new Set(['convoy-ambush', 'boss-combine', 'survive-derby']);

/** The cap shoot-out kinds get by default. */
export const SHOOTOUT_CAP = 1;

/** The policy for step `step` of `q`: hoaSteps[step], else hoa, else the kind's default. */
export function hoaPolicyFor(q: QuestDef, step: number): HoaPolicy {
  const own = q.hoaSteps?.[step] ?? q.hoa;
  if (own !== undefined) return own;
  const kind = q.objectives[step]?.kind;
  return kind && SHOOTOUT_KINDS.has(kind) ? { cap: SHOOTOUT_CAP } : 'free';
}

/** The heat cap a policy means for Watch.setCap: null = no cap. */
export function hoaCap(p: HoaPolicy): number | null {
  if (p === 'free') return null;
  if (p === 'off') return 0;
  return Math.max(0, p.cap);
}
