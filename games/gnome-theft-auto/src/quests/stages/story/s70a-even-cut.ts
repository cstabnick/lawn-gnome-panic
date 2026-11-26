// Story row 70 stages: The Even Cut (parts 1-2) (it already stands on stages in quests/stages/east.ts and turfton*.ts).
import type { Stage } from '../kit';

export const STAGES: readonly Stage[] = [];

/** The finale's parts stand where the old single finale did (the overlook safehouse and the meridian). */
export const USES: Record<string, string[]> = { 'dust-safehouse': ['ch5-even-cut-p1', 'ch5-even-cut-p2'] };
