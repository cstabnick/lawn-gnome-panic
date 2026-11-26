// Story row 42 stages: Rutbottom Impound. STUB from the E21 setup: the row's writer fills it (keep the exports).
import type { Stage } from '../kit';

export const STAGES: readonly Stage[] = [];

/** Existing stage id -> this row's quest ids (stub: the Frozen Birdbath Basin, where the stub objectives point). */
export const USES: Record<string, string[]> = { 'birdbath-basin': ['m42-rutbottom-impound'] };
