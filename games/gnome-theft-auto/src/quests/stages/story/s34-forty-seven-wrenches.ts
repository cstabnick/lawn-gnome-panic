// Story row 34 (Forty-Seven Wrenches): all three scenes play on the existing Side-Valve Salvage bay (day for the intro, dusk
// for the party, night for Cam's call); no new stage, only the quest id on the bay's usedBy.
import type { Stage } from '../kit';

export const STAGES: readonly Stage[] = [];
/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'side-valve-bay': ['m34-forty-seven-wrenches'],
};
