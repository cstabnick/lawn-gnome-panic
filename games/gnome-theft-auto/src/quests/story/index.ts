// The E20 story rows (acts I and II), flattened for defs.ts (QUESTS) and comms.ts (COMMS). Layout: kit.ts.
import type { CommsCall } from '../comms';
import type { GiverDef, QuestDef } from '../types';
import type { QuestPlan } from '../../questSim/types';
import { ACT_I } from './actI';
import { ACT_II } from './actII';

const FILES = [...ACT_I, ...ACT_II];

export const STORY_QUESTS: readonly QuestDef[] = FILES.flatMap((f) => f.quests);

export const STORY_GIVERS: Readonly<Record<string, GiverDef>> = Object.assign({}, ...FILES.map((f) => f.givers ?? {}));

export const STORY_BULLETINS: Readonly<Record<string, readonly string[]>> = Object.assign({}, ...FILES.map((f) => f.bulletins ?? {}));

export const STORY_PLANS: Readonly<Record<string, QuestPlan>> = Object.assign({}, ...FILES.map((f) => f.plans ?? {}));

export const STORY_COMMS: Readonly<Record<string, Readonly<Record<number, CommsCall>>>> = Object.assign({}, ...FILES.map((f) => f.comms));
