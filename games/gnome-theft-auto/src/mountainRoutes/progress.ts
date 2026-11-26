// E33: end-to-end route tracking and the E33 achievements (issue A1).
// A run starts when the player is on a route, in a way the route allows, near one end. It completes when they reach
// the other end having covered most of the route. Pure logic lives in RouteRun; createRouteProgress wires it to the
// game (toast, achievements) and draws the route-end blips on the big map.
import type * as THREE from 'three';
import type { World, Blip, VehicleKind } from '../types';
import { VEHICLES } from '../config';
import type { Track } from '../raceTrack/trackDef';
import type { Area, MountainDeps } from './deps';
import { ROUTE_DEFS, ROUTE_IDS, ROUTES, routeKind, type RouteId } from './routes';
import type { RouteKind } from './types';

export const ROUTE_ACHIEVEMENTS: Readonly<Record<RouteId, string>> = {
  'brim-gap-road': 'gta-brim-gap-road',
  'spine-cut': 'gta-spine-cut',
  hatband: 'gta-hatband',
  'brim-walk': 'gta-brim-walk',
};

/** Whether the player's vehicle (null on foot) may ride this kind of route. */
export function modeOk(kind: RouteKind, vehicle: VehicleKind | null): boolean {
  if (kind === 'trail') return vehicle === null;
  if (vehicle === null) return false;
  const spec = VEHICLES[vehicle];
  if (spec.flies || spec.boat) return false;
  if (kind === 'track') return spec.radius <= 1.2;
  return true;
}

const END_ZONE = 25;
const OFF_ROUTE_LIMIT = 8;
const NOT_OK_LIMIT = 3;
const COVER_FRACTION = 0.8;
const BUCKET = 25;

/** One route's end-to-end tracker. Pure: feed it positions; update() returns true once when a run completes. */
export class RouteRun {
  private hint: number | undefined = undefined;
  private offTime = 0;
  private notOkTime = 0;
  private running = false;
  private startEnd: 'start' | 'end' = 'start';
  private buckets = new Set<number>();

  constructor(private readonly track: Track) {}

  update(dt: number, x: number, z: number, ok: boolean): boolean {
    const L = this.track.length();
    const reach = this.track.def.width / 2 + 4;
    const spot = this.track.locate(x, z, reach, this.hint, 60);
    if (spot) this.hint = spot.i;

    this.offTime = spot ? 0 : this.offTime + dt;
    this.notOkTime = ok ? 0 : this.notOkTime + dt;
    if (this.running && (this.offTime > OFF_ROUTE_LIMIT || this.notOkTime > NOT_OK_LIMIT)) this.reset();
    if (!spot) return false;

    const s = spot.s;
    if (!this.running) {
      if (ok && (s < END_ZONE || s > L - END_ZONE)) {
        this.running = true;
        this.startEnd = s < END_ZONE ? 'start' : 'end';
        this.buckets = new Set<number>();
        this.buckets.add(Math.floor(s / BUCKET));
      }
      return false;
    }

    this.buckets.add(Math.floor(s / BUCKET));
    const nearOther = this.startEnd === 'start' ? s > L - END_ZONE : s < END_ZONE;
    if (nearOther && this.buckets.size * BUCKET >= COVER_FRACTION * L) {
      this.reset();
      return true;
    }
    return false;
  }

  private reset(): void {
    this.running = false;
    this.buckets = new Set<number>();
    this.offTime = 0;
    this.notOkTime = 0;
  }
}

function routeLabel(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function createRouteProgress(scene: THREE.Scene, world: World, deps: MountainDeps): Area {
  void scene; void world;
  const runs = ROUTE_IDS.map((id) => ({ id, run: new RouteRun(ROUTES[id]) }));
  let blipList: Blip[] | null = null;

  function buildBlips(): Blip[] {
    const out: Blip[] = [];
    for (const id of ROUTE_IDS) {
      const def = ROUTE_DEFS[id];
      const track: Track = ROUTES[id];
      const samples = track.samples();
      const color = routeKind(id) === 'road' ? '#c9a227' : routeKind(id) === 'track' ? '#9a7a52' : '#7a5a3a';
      const label = routeLabel(def.name);
      const first = samples[0];
      const last = samples[samples.length - 1];
      out.push({ x: first.x, z: first.z, color, label });
      out.push({ x: last.x, z: last.z, color, label });
    }
    return out;
  }

  return {
    update(dt, px, pz) {
      const vehicle = deps.vehicleKind();
      for (const { id, run } of runs) {
        if (run.update(dt, px, pz, modeOk(routeKind(id), vehicle))) {
          deps.toast(`${ROUTE_DEFS[id].name}: end to end!`, 4000);
          deps.unlock(ROUTE_ACHIEVEMENTS[id]);
        }
      }
    },
    blips() {
      if (!blipList) blipList = buildBlips();
      return blipList;
    },
  };
}
