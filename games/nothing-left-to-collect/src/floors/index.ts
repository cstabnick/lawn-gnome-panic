import type { FloorId, FloorLayout } from '../types';
import { LOBBY } from './lobby';
import { F1 } from './f1';
import { F2 } from './f2';
import { F3 } from './f3';
import { F4 } from './f4';

export const LAYOUTS: Record<Exclude<FloorId, 'sky'>, FloorLayout> = { lobby: LOBBY, f1: F1, f2: F2, f3: F3, f4: F4 };
