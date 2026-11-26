// Story row 60 stages: The Moles Dig. STUB from the E22 setup: the row's writer fills it (keep the exports).
import type { Stage } from '../kit';

export const STAGES: readonly Stage[] = [];

/** Existing stage id -> this row's quest ids (stub: the Dust Flats safehouse, where the stub objectives point). */
export const USES: Record<string, string[]> = { 'dust-safehouse': ['m60-the-moles-dig'] };
