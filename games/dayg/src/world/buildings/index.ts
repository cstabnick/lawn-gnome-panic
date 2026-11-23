import type { BuildingDef, BuildingParts } from '../buildingTypes';
import { expandBuilding } from '../buildingExpand';
import { POTTING_SHED } from './pottingShed';
import { BIER_HOUSE } from './bierHouse';
import { ROWKEEPERS_HOUSE } from './rowkeepersHouse';
import { MAUSOLEUM } from './mausoleum';
import { ANGEL_VAULT } from './angelVault';
export const BUILDINGS: readonly BuildingDef[] = [POTTING_SHED, BIER_HOUSE, ROWKEEPERS_HOUSE, MAUSOLEUM, ANGEL_VAULT];
export const BUILDING_PARTS: readonly BuildingParts[] = BUILDINGS.map(expandBuilding);
