// The street-event director: every so often it picks an eligible event from the catalog (catalog/index.ts), finds a
// spot on a road or sidewalk a little way from the player, and lets the event's script run. Pure picking helpers are
// exported for tests. Local to this browser (like critters): online guests each see their own street life.
import type { Blip, Npcs, Player, World } from '../types';
import { districtAt } from '../districts';
import { perkActive } from '../perks';
import { STREET_EVENTS } from './catalog';
import { createKit, type KitDeps, type RunKit } from './kit';
import { offRoad, pickAnchor } from './spots';

export { pickAnchor };
import type { EventAnchor, EventDef, EventScript, EventStatus, SpawnContext } from './types';

/** Tuning (seconds and world units). */
export const DIRECTOR = {
  /** Seconds before the first random event. */
  firstDelay: 25,
  /** Seconds between random spawns: a random value in [gapMin, gapMax]. */
  gapMin: 30,
  gapMax: 60,
  /** At most this many events at once. */
  maxActive: 2,
  /** Random events spawn this far from the player. */
  spawnMin: 55,
  spawnMax: 120,
  /** Forced (trainer) events spawn this close. */
  forceMin: 22,
  forceMax: 55,
  /** A running event the player is farther than this from (all its pieces) ends. */
  despawn: 240,
  /** After it ends, an event's leftovers are removed when the player is this far, or after lingerMax seconds. */
  lingerFar: 90,
  lingerMax: 25,
  /** The callout (title + hint) shows when the player first comes this close. */
  calloutRadius: 45,
  /** Map dots show within this range (Datum Map perk: any range). */
  blipRange: 150,
} as const;

export const CATEGORY_COLORS: Record<EventDef['category'], string> = {
  police: '#4a7dff',
  crime: '#ff4a4a',
  scene: '#7be07b',
  traffic: '#ffb43a',
  wild: '#c08aff',
};

/** Can `def` spawn now (cooldown over, its `when` filter passes)? */
export function eligible(def: EventDef, ctx: SpawnContext, now: number, readyAt: ReadonlyMap<string, number>): boolean {
  if ((readyAt.get(def.id) ?? -Infinity) > now) return false;
  return def.when ? def.when(ctx) : true;
}

/** Weighted random pick among eligible events, skipping `exclude` (ids already running). Null when none. */
export function pickEvent(
  defs: readonly EventDef[],
  ctx: SpawnContext,
  now: number,
  readyAt: ReadonlyMap<string, number>,
  rand: () => number,
  exclude: ReadonlySet<string> = new Set(),
): EventDef | null {
  const ok = defs.filter((d) => d.weight > 0 && !exclude.has(d.id) && eligible(d, ctx, now, readyAt));
  const total = ok.reduce((s, d) => s + d.weight, 0);
  if (total <= 0) return null;
  let r = rand() * total;
  for (const d of ok) {
    r -= d.weight;
    if (r < 0) return d;
  }
  return ok[ok.length - 1];
}

export interface DirectorDeps extends KitDeps {
  npcs: Npcs;
  /** Called when an event ends (achievements, news). */
  onEnd?(def: EventDef, status: Exclude<EventStatus, 'running'>): void;
}

export interface DirectorFrame {
  cutscene: boolean;
  night: number;
  onQuest: boolean;
}

export interface EventDirector {
  update(dt: number, player: Player, frame: DirectorFrame): void;
  blips(): Blip[];
  /** Every street event in the catalog. */
  list(): { id: string; title: string; category: EventDef['category'] }[];
  /** Start an event by id near the player now (ignores cooldowns and filters; ends the oldest if full). False for an unknown id. */
  trigger(id: string): boolean;
  /** Running events (not lingering ones). */
  active(): { id: string; title: string; t: number }[];
  /** End every event now and remove their pieces. */
  clear(): void;
  /** Random spawns on/off (forced triggers still work). */
  setEnabled(on: boolean): void;
}

interface Running {
  def: EventDef;
  kit: RunKit;
  script: EventScript;
  anchor: EventAnchor;
  status: EventStatus;
  lingerT: number;
  calledOut: boolean;
}

export function createEventDirector(deps: DirectorDeps, defs: readonly EventDef[] = STREET_EVENTS, rand: () => number = Math.random): EventDirector {
  const running: Running[] = [];
  const readyAt = new Map<string, number>();
  let clock = 0;
  let nextSpawn: number = DIRECTOR.firstDelay;
  let enabled = true;
  let lastPlayer: Player | null = null;

  function ctxFor(p: Player, frame: DirectorFrame): SpawnContext {
    const x = p.vehicle ? p.vehicle.x : p.x;
    const z = p.vehicle ? p.vehicle.z : p.z;
    return {
      px: x, pz: z, biome: deps.world.biomeAt(x, z), district: districtAt(x, z), night: frame.night,
      heat: deps.watch.heat, inVehicle: !!p.vehicle, onQuest: frame.onQuest,
    };
  }

  function start(def: EventDef, player: Player, at: EventAnchor): void {
    // A scene that is not about the road is built on the verge, well clear of the lanes (the kit also keeps each gnome
    // and prop off the road); a road scene (chase, stop, crash) stays on its road node.
    const anchor = def.roadScene ? at : { ...offRoad(deps.world.roads, at.x, at.z, 4), yaw: at.yaw };
    const kit = createKit(deps, player, anchor, rand, !!def.roadScene);
    let script: EventScript;
    try {
      script = def.start(kit, anchor);
    } catch (err) {
      console.warn(`[street events] ${def.id} failed to start`, err);
      kit.dispose();
      return;
    }
    running.push({ def, kit, script, anchor, status: 'running', lingerT: 0, calledOut: false });
    readyAt.set(def.id, clock + def.cooldown);
  }

  function end(r: Running, status: Exclude<EventStatus, 'running'>): void {
    r.status = status;
    r.kit.release();
    deps.onEnd?.(r.def, status);
  }

  function liveCount(): number {
    return running.filter((r) => r.status === 'running').length;
  }

  return {
    update(dt, player, frame) {
      lastPlayer = player;
      clock += dt;
      for (let i = running.length - 1; i >= 0; i--) {
        const r = running[i];
        r.kit.step(dt, player);
        if (r.status === 'running') {
          let st: EventStatus = 'running';
          if (!frame.cutscene) {
            try {
              st = r.script.update(dt, r.kit);
            } catch (err) {
              console.warn(`[street events] ${r.def.id} script error`, err);
              st = 'gone';
            }
          }
          if (st === 'running' && (r.kit.t > r.def.duration || r.kit.nearest() > DIRECTOR.despawn)) st = 'gone';
          if (st !== 'running') { end(r, st); continue; }
          if (!r.calledOut && r.kit.dist(r.anchor.x, r.anchor.z) <= DIRECTOR.calloutRadius) {
            r.calledOut = true;
            deps.hud.callout?.(r.def.title, r.def.hint);
          }
        } else {
          r.lingerT += dt;
          if (r.lingerT > DIRECTOR.lingerMax || r.kit.nearest() > DIRECTOR.lingerFar) {
            r.kit.dispose();
            running.splice(i, 1);
          }
        }
      }
      if (!enabled || frame.cutscene || clock < nextSpawn) return;
      nextSpawn = clock + DIRECTOR.gapMin + rand() * (DIRECTOR.gapMax - DIRECTOR.gapMin);
      if (liveCount() >= DIRECTOR.maxActive) return;
      const ctx = ctxFor(player, frame);
      const def = pickEvent(defs, ctx, clock, readyAt, rand, new Set(running.map((r) => r.def.id)));
      if (!def) return;
      const anchor = pickAnchor(deps.world, def.anchor, ctx.px, ctx.pz, rand, DIRECTOR.spawnMin, DIRECTOR.spawnMax);
      if (anchor) start(def, player, anchor);
    },

    blips() {
      const out: Blip[] = [];
      const all = perkActive('datum-map');
      for (const r of running) {
        if (r.status !== 'running') continue;
        const at = r.script.blip?.() ?? { x: r.anchor.x, z: r.anchor.z };
        if (!at) continue;
        const d = r.kit.dist(at.x, at.z);
        if (!all && d > DIRECTOR.blipRange) continue;
        out.push({ x: at.x, z: at.z, color: CATEGORY_COLORS[r.def.category], ...(all || d <= DIRECTOR.calloutRadius * 2 ? { quest: r.def.title } : {}) });
      }
      return out;
    },

    list() {
      return defs.map((d) => ({ id: d.id, title: d.title, category: d.category }));
    },

    trigger(id) {
      const def = defs.find((d) => d.id === id);
      if (!def || !lastPlayer) return false;
      const p = lastPlayer;
      while (liveCount() >= DIRECTOR.maxActive) {
        const oldest = running.find((r) => r.status === 'running');
        if (!oldest) break;
        end(oldest, 'gone');
      }
      const x = p.vehicle ? p.vehicle.x : p.x;
      const z = p.vehicle ? p.vehicle.z : p.z;
      const anchor = pickAnchor(deps.world, def.anchor, x, z, rand, DIRECTOR.forceMin, DIRECTOR.forceMax)
        ?? { x: x + 20, z: z + 20, yaw: 0 };
      start(def, p, anchor);
      return true;
    },

    active() {
      return running.filter((r) => r.status === 'running').map((r) => ({ id: r.def.id, title: r.def.title, t: r.kit.t }));
    },

    clear() {
      for (const r of running) {
        if (r.status === 'running') end(r, 'gone');
        r.kit.dispose();
      }
      running.length = 0;
    },

    setEnabled(on) {
      enabled = on;
    },
  };
}
