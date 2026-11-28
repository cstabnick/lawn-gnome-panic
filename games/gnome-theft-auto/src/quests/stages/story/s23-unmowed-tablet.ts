// Story row 23: no new stages. The Cracked Tablet's scenes stand on stages that already list it in usedBy
// (unmowed-hollow, the Compost Heap forge; quests/stages/wilds.ts), so there is nothing to add here.
import type { Stage } from '../kit';

export const STAGES: readonly Stage[] = [];
/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {};
