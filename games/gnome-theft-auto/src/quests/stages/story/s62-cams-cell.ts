// Story row 62 stages: Cam's Cell. STUB from the E22 setup: the row's writer fills it (keep the exports).
import type { Stage } from '../kit';

export const STAGES: readonly Stage[] = [];

/** Existing stage id -> this row's quest ids (stub: the Dust Flats safehouse, where the stub objectives point). */
export const USES: Record<string, string[]> = { 'dust-safehouse': ['m62-cams-cell'] };
