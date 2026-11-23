// Helpers for one district's blockout (roadmap 4.8). Same helpers as blockout.ts, collecting into one district with every id prefixed.
import type { ContainerType, DistrictId, RegionId, Rect, ContainerDef } from '../sim/types';
import type { DistrictMap, HavenDef, RouteKind, Side, SpotKind, PathDef, PitDef, PropDef, WaterDef, BlockKind, BlockDef, ClimbRouteDef, SpotDef } from './types';
import { DISTRICT_PREFIX } from '../sim/regionsFull';

export interface RowOpts { width: number; depth: number; gaps: number[]; heights: number[]; skipX0?: number; skipX1?: number; xEnd: number; row: number }
export interface Stamper {
  block(id: string, kind: BlockKind, x0: number, x1: number, z0: number, z1: number, h: number, y?: number): BlockDef;
  top(b: BlockDef): number;
  route(b: { id: string }, side: Side, kind: RouteKind, at: number): void;
  spot(id: string, kind: SpotKind, region: RegionId, x: number, y: number, z: number): void;
  spotOnTop(id: string, kind: SpotKind, region: RegionId, b: BlockDef, dx?: number, dz?: number): void;
  container(id: string, type: ContainerType, region: RegionId, x: number, y: number, z: number, guaranteed?: string[]): void;
  containerOnTop(id: string, type: ContainerType, region: RegionId, b: BlockDef, dx?: number, dz?: number): void;
  prop(prefab: string, x: number, y: number, z: number, rotY?: number): void;
  hatless(region: RegionId, pts: [number, number, number][]): void;   // spots h-<region>-1..n
  pit(id: string, rect: Rect, depth: number): void;
  haven(def: HavenDef): void;
  water(def: WaterDef): void;
  path(def: PathDef): void;
  kerbPlot(stone: BlockDef, length: number, inset: number): void;
  headstoneRow(prefix: string, x0: number, z: number, o: RowOpts): BlockDef[];
  gate(id: string, x0: number, x1: number, z0: number, z1: number, h: number): void; // an inner gate wall (kind 'gate')
  done(): DistrictMap;
}

export function createStamper(district: DistrictId): Stamper {
  const pre = `${DISTRICT_PREFIX[district]}-`;
  const blocks: BlockDef[] = [];
  const routes: ClimbRouteDef[] = [];
  const routeSeen = new Map<string, number>();
  const pits: PitDef[] = [];
  const spots: SpotDef[] = [];
  const havens: HavenDef[] = [];
  const water: WaterDef[] = [];
  const paths: PathDef[] = [];
  const props: PropDef[] = [];
  const containers: ContainerDef[] = [];
  const innerGates: BlockDef[] = [];
  // Raw adders take ids that already carry the prefix; the public helpers add it.
  const addBlock = (id: string, kind: BlockKind, x0: number, x1: number, z0: number, z1: number, h: number, y = 0): BlockDef => {
    const b: BlockDef = { id, kind, x0, x1, z0, z1, y, h };
    blocks.push(b);
    return b;
  };
  const top = (b: BlockDef): number => Math.round((b.y + b.h) * 1000) / 1000;
  const spot = (id: string, kind: SpotKind, region: RegionId, x: number, y: number, z: number): void => {
    spots.push({ id: pre + id, kind, region, x, y, z });
  };
  const s: Stamper = {
    block: (id, kind, x0, x1, z0, z1, h, y = 0) => addBlock(pre + id, kind, x0, x1, z0, z1, h, y),
    top,
    route: (b, side: Side, kind: RouteKind, at) => {
      // Block ids already carry the district prefix. A counter per base id keeps two routes with the same block, side, kind and position unique.
      const base = `${b.id}-${side}-${kind}-${at}`;
      const n = routeSeen.get(base) ?? 0;
      routeSeen.set(base, n + 1);
      routes.push({ id: n === 0 ? base : `${base}-${n}`, block: b.id, side, kind, at });
    },
    spot,
    spotOnTop: (id, kind, region, b, dx = 0, dz = 0) => spot(id, kind, region, (b.x0 + b.x1) / 2 + dx, top(b), (b.z0 + b.z1) / 2 + dz),
    container: (id, type: ContainerType, region, x, y, z, guaranteed) => {
      containers.push(guaranteed ? { id: pre + id, type, region, x, y, z, guaranteed } : { id: pre + id, type, region, x, y, z });
    },
    containerOnTop: (id, type: ContainerType, region, b, dx = 0, dz = 0) =>
      s.container(id, type, region, (b.x0 + b.x1) / 2 + dx, top(b), (b.z0 + b.z1) / 2 + dz),
    prop: (prefab, x, y, z, rotY) => { props.push(rotY === undefined ? { prefab, x, y, z } : { prefab, x, y, z, rotY }); },
    hatless: (region, pts) => { pts.forEach(([x, y, z], i) => spot(`h-${region}-${i + 1}`, 'hatless', region, x, y, z)); },
    pit: (id, rect: Rect, depth) => { pits.push({ id: pre + id, rect, depth }); },
    haven: (def) => { havens.push(def); },
    water: (def) => { water.push({ ...def, id: pre + def.id }); },
    path: (def) => { paths.push({ ...def, id: pre + def.id }); },
    kerbPlot: (stone, length, inset) => {
      const t = 0.6, h = 1.6;
      const zs = stone.z1 - 0.1, ze = stone.z1 + length;
      const lx0 = stone.x0 + inset, rx1 = stone.x1 - inset;
      addBlock(`${stone.id}-kw`, 'kerb', lx0, lx0 + t, zs, ze - 0.1, h);
      addBlock(`${stone.id}-ke`, 'kerb', rx1 - t, rx1, zs, ze - 0.1, h);
      addBlock(`${stone.id}-kf`, 'kerb', lx0 - 0.1, rx1 + 0.1, ze - t, ze, h + 0.1);
    },
    headstoneRow: (prefix, x0, z, o) => {
      const out: BlockDef[] = [];
      let x = x0;
      for (let i = 0; x + o.width <= o.xEnd; i++) {
        const skip = o.skipX0 !== undefined && o.skipX1 !== undefined && x < o.skipX1 && x + o.width > o.skipX0;
        if (!skip) {
          const h = o.heights[(i * 3 + o.row * 2) % o.heights.length];
          out.push(addBlock(`${pre}${prefix}-r${o.row}-s${i}`, 'headstone', x, x + o.width, z, z + o.depth, h));
        }
        x += o.width + o.gaps[(i + o.row) % o.gaps.length];
      }
      return out;
    },
    gate: (id, x0, x1, z0, z1, h) => { innerGates.push({ id: pre + id, kind: 'gate', x0, x1, z0, z1, y: 0, h }); },
    done: (): DistrictMap => ({ district, blocks, routes, pits, spots, havens, water, paths, props, containers, innerGates }),
  };
  return s;
}
