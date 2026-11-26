// The side-quest scenes (Strangers & Freaks and Tessie): intros, mid-quest beats and payoffs staged in the real world at
// each giver's stage spot. One file per quest; the quests name them by id (sideQuests.ts, tessieQuest.ts).
import type { SceneScript } from '../../script';
import { BIG_LOU_SCENES } from './bigLou';
import { BISCUIT_HOTDOG_SCENES } from './biscuitHotdog';
import { CASTAWAY_SCENES } from './castaway';
import { FESCUE_FUGITIVE_SCENES } from './fescueFugitive';
import { GRID_TRUTHERS_SCENES } from './gridTruthers';
import { HOA_AUDIT_SCENES } from './hoaAudit';
import { HOSE_REVOLT_SCENES } from './hoseRevolt';
import { MULCH_PYRAMID_SCENES } from './mulchPyramid';
import { ON_THE_HOUSE_SCENES } from './onTheHouse';
import { PORCELAIN_BLUES_SCENES } from './porcelainBlues';
import { PORCELAIN_SUPPORT_SCENES } from './porcelainSupport';
import { SNAIL_RIGGING_SCENES } from './snailRigging';
import { TESSIE_SCENES } from './tessie';

export const SIDE_SCENES: Record<string, SceneScript> = Object.fromEntries(
  [
    GRID_TRUTHERS_SCENES, HOA_AUDIT_SCENES, SNAIL_RIGGING_SCENES, MULCH_PYRAMID_SCENES, BIG_LOU_SCENES, HOSE_REVOLT_SCENES,
    BISCUIT_HOTDOG_SCENES, CASTAWAY_SCENES, PORCELAIN_BLUES_SCENES, PORCELAIN_SUPPORT_SCENES, FESCUE_FUGITIVE_SCENES,
    TESSIE_SCENES, ON_THE_HOUSE_SCENES,
  ].flat().map((s) => [s.id, s]),
);
