import type { Chapter, ChapterId } from '../types';
import { PROLOGUE } from './prologue';
import { CH1 } from './ch1';
import { CH2 } from './ch2';
import { CH3 } from './ch3';
import { CH4 } from './ch4';
import { ENDING } from './ending';

export const CHAPTERS: Record<ChapterId, Chapter> = { prologue: PROLOGUE, ch1: CH1, ch2: CH2, ch3: CH3, ch4: CH4, ending: ENDING };
