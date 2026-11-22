// Quest gates on gear and talents (ItemDef.gate, TalentDef.gate): the shop will not sell, and the talent tree will not
// teach, until the gate's condition holds. While closed, `why` is the in-world reason shown to the player.
import type { Gate } from './config';
import { checkCondition } from './quests';

/** True when there is no gate or its condition holds. */
export function gateOpen(g: Gate | undefined): boolean {
  return !g || checkCondition(g.when);
}

/** The reason a gate is closed, or null when it is open (or there is none). */
export function gateLabel(g: Gate | undefined): string | null {
  return gateOpen(g) ? null : g!.why;
}
