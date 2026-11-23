// The full map (phases 4-8): the slice blockout plus every district's blockout, with the slice hedges that the new regions replace left out.
import { DISTRICT_STAGE, type MapStage, type Rect } from '../sim/types';
import type { BlockDef } from './types';
import { FULL_BOUNDS, FULL_REGIONS, NEW_REGIONS } from '../sim/regionsFull';
import { MAP, checkMap } from './blockout';
import type { BlockoutMap, DistrictMap } from './types';
import { COLUMBARIUM_MAP } from './districts/columbarium';
import { BELL_CHAPEL_MAP } from './districts/bellChapel';
import { MAUSOLEUM_HILL_MAP } from './districts/mausoleumHill';
import { LAWN_SECTION_MAP } from './districts/lawnSection';
import { DROWNED_CORNER_MAP } from './districts/drownedCorner';
import { SHED_MAP } from './districts/shed';
import { YEW_WALK_MAP } from './districts/yewWalk';
import { GNOME_GARDEN_MAP } from './districts/gnomeGarden';
import { WREATHWOOD_MAP } from './districts/wreathwood';
import { COMPOST_MAP } from './districts/compost';

export const DISTRICT_MAPS: readonly DistrictMap[] = [
  YEW_WALK_MAP, GNOME_GARDEN_MAP, WREATHWOOD_MAP, COMPOST_MAP, COLUMBARIUM_MAP,
  BELL_CHAPEL_MAP, MAUSOLEUM_HILL_MAP, LAWN_SECTION_MAP, DROWNED_CORNER_MAP, SHED_MAP,
];

const ALL_STAGES: readonly MapStage[] = ['south-west', 'north', 'east'];
const overlaps = (b: BlockDef, r: Rect): boolean => b.x0 < r.x1 && b.x1 > r.x0 && b.z0 < r.z1 && b.z1 > r.z0;

/** The full blockout. Inner gates of a district whose stage is not in `open` are placed (default: every stage open, so none). */
export function assembleFullMap(opts: { open?: readonly MapStage[] } = {}): BlockoutMap {
  const open = opts.open ?? ALL_STAGES;
  const sliceBlocks = MAP.blocks.filter((b) => !(/^hedge-\d+$/.test(b.id) && NEW_REGIONS.some((r) => overlaps(b, r.rect))));
  const map: BlockoutMap = {
    bounds: FULL_BOUNDS,
    blocks: [...sliceBlocks], routes: [...MAP.routes], pits: [...MAP.pits], spots: [...MAP.spots],
    havens: [...MAP.havens], water: [...MAP.water], paths: [...MAP.paths], props: [...MAP.props], containers: [...MAP.containers],
    playerSpawn: MAP.playerSpawn,
  };
  for (const d of DISTRICT_MAPS) {
    map.blocks.push(...d.blocks);
    map.routes.push(...d.routes);
    map.pits.push(...d.pits);
    map.spots.push(...d.spots);
    // Havens merge by id: the slice's haven wins, and a district's haven is kept only when no earlier haven has its id.
    for (const h of d.havens) if (!map.havens.some((x) => x.id === h.id)) map.havens.push(h);
    map.water.push(...d.water);
    map.paths.push(...d.paths);
    map.props.push(...d.props);
    map.containers.push(...d.containers);
    if (!open.includes(DISTRICT_STAGE[d.district])) map.blocks.push(...d.innerGates);
  }
  return map;
}

/** Problems with the full blockout (empty = fine): the slice checks against every region, plus duplicate ids. */
export function checkFullMap(map: BlockoutMap): string[] {
  const problems = checkMap(map, FULL_REGIONS);
  const seen = new Set<string>();
  const ids = [
    ...map.blocks.map((b) => b.id), ...map.routes.map((r) => r.id), ...map.pits.map((p) => p.id),
    ...map.spots.map((s) => s.id), ...map.water.map((w) => w.id), ...map.paths.map((p) => p.id), ...map.containers.map((c) => c.id),
  ];
  for (const id of ids) {
    if (seen.has(id)) problems.push(`duplicate id ${id}`);
    seen.add(id);
  }
  return problems;
}
