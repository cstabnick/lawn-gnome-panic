// Story row 38 stages: Pail Pond. STUB from the E21 setup: the row's writer fills it (keep the exports).
import type { Stage } from '../kit';

export const STAGES: readonly Stage[] = [];

/** Existing stage id -> this row's quest ids (stub: the Frozen Birdbath Basin, where the stub objectives point). */
export const USES: Record<string, string[]> = { 'birdbath-basin': ['m38-pail-pond'] };
