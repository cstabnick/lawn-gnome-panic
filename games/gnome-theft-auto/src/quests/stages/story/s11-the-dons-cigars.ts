// Story row 11: the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// Row 11 (m11-the-dons-cigars) needs no new stage: the Mulch Club's side door ('mulch-club-door', the intro and the outro)
// and Brenda's throne on the canal bank ('brenda-throne', the toll).
import type { Stage } from '../kit';

export const STAGES: readonly Stage[] = [];
/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'mulch-club-door': ['m11-the-dons-cigars'],
  'brenda-throne': ['m11-the-dons-cigars'],
};
