// Story row 22: the stages its scenes play on (none new: the Side-Valve bay and Sorrel's booth already exist), and the
// quest id added to their usedBy.
import type { Stage } from '../kit';

export const STAGES: readonly Stage[] = [];
/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'side-valve-bay': ['m22-off-air'],
  'sorrel-radio-booth': ['m22-off-air'],
};
