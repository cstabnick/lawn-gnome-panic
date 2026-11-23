// expandBuilding: turns a BuildingDef into blockout parts. Step 0 stub: returns empty parts (roadmap 10, issue 1.1 fills it).
import type { BuildingDef, BuildingParts } from './buildingTypes';

export function expandBuilding(def: BuildingDef): BuildingParts {
  const t = def.shell.thick;
  const f = def.footprint;
  return {
    def,
    blocks: [],
    role: {},
    layer: {},
    routes: [],
    pits: [],
    containers: [],
    spots: [],
    props: [],
    interior: { x0: f.x0 + t, x1: f.x1 - t, z0: f.z0 + t, z1: f.z1 - t },
    roofY: def.shell.height - 0.2,
    doors: [],
    stairs: [],
    cut: def.storeys.map(() => []),
  };
}
