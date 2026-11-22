// Every problem the editor knows about a level, as one list (types.ts Problem). Feeds the Problems panel and le.problems().
import type { ZoneDef } from '@gnomomia/config';
import { computeReachability, type ReachReport } from '@gnomomia/reach';
import type { EditorContext, MutableZone } from '../context';
import { contextDoorLinks, linksIn } from '../doorLinks';
import { doorProblems } from '../tools/doorReport';
import type { Problem } from './types';

export interface ProblemOptions {
  /** Also run reachability and door checks (a flood fill per zone: slow on Gnomomia). Default false. */
  reach?: boolean;
}

/** Door problems of the zone's exits, as analyze.ts's doorIssuesFor computes them. */
function doorIssuesFor(c: EditorContext): string[] {
  const floods = new Map<string, ReachReport | null>();
  const reachableIn = (to: string) => (x: number, z: number): boolean => {
    if (!floods.has(to)) {
      const def = (c.zones as Record<string, ZoneDef | undefined>)[to];
      floods.set(to, def ? computeReachability(c.terrain, def) : null);
    }
    const r = floods.get(to);
    return r ? r.reached(x, z) : true;
  };
  return linksIn(contextDoorLinks(c), c.zone).flatMap((l) => doorProblems([l], c.zone, reachableIn(l.to)));
}

/** The problems of the current zone (ctx.zone). Never throws: a check that crashes becomes one 'check-failed' error. */
export function collectProblems(ctx: EditorContext, opts?: ProblemOptions): Problem[] {
  const zone: string = ctx.zone;
  const out: Problem[] = [];
  const run = (name: string, fn: () => void): void => {
    try {
      fn();
    } catch (e) {
      out.push({ severity: 'error', code: 'check-failed', msg: `${name}: ${e instanceof Error ? e.message : String(e)}`, zone });
    }
  };
  const zoneDef: ZoneDef = ctx.zones[ctx.zone];
  const def = zoneDef as unknown as MutableZone;
  const hasAnalyze = ctx.adapter.tools.includes('analyze');

  // 1. The adapter's own checks, or its save check (which asks nothing and reports the first refusal it would throw).
  run('adapter', () => {
    if (ctx.adapter.checks) {
      out.push(...ctx.adapter.checks(ctx, zone));
      return;
    }
    try {
      ctx.adapter.beforeSave?.(ctx, [zone]);
    } catch (e) {
      out.push({ severity: 'error', code: 'save-check', msg: e instanceof Error ? e.message : String(e), zone });
    }
  });

  // 2. Items placed outside the level's box.
  run('outside-zone', () => {
    const rect = ctx.adapter.zoneRect(zoneDef);
    for (const c of ctx.adapter.collections) {
      c.items(def).forEach((it, index) => {
        if (c.accepts && !c.accepts(it)) return;
        if (it.x >= rect.minX && it.x <= rect.maxX && it.z >= rect.minZ && it.z <= rect.maxZ) return;
        out.push({ severity: 'warning', code: 'outside-zone', msg: `${c.label} is outside the level`, zone, ref: { collection: c.id, index }, x: it.x, z: it.z });
      });
    }
  });

  // 3. Props whose solid footprints overlap.
  run('prop-overlap', () => {
    const props = ctx.adapter.collections.find((c) => c.id === 'props');
    if (!props) return;
    const list = props.items(def);
    const radius = (p: (typeof list)[number]) => Number(p.solidR ?? 0);
    for (let j = 0; j < list.length; j++) {
      const pj = list[j];
      const rj = radius(pj);
      if (rj <= 0) continue;
      for (let i = 0; i < j; i++) {
        const pi = list[i];
        const ri = radius(pi);
        if (ri <= 0) continue;
        if (Math.hypot(pj.x - pi.x, pj.z - pi.z) >= ri + rj - 0.05) continue;
        out.push({
          severity: 'warning',
          code: 'prop-overlap',
          msg: `Prop ${j} (${String(pj.prefab)}) overlaps prop ${i} (${String(pi.prefab)})`,
          zone,
          ref: { collection: 'props', index: j },
          x: pj.x,
          z: pj.z,
        });
      }
    }
  });

  // 4. Props standing in a lake.
  run('prop-in-lake', () => {
    const lakes = Array.isArray(def.lakes) ? def.lakes : null;
    if (!lakes) return;
    (def.props ?? []).forEach((p, index) => {
      if (!lakes.some((l) => Math.hypot(p.x - l.x, p.z - l.z) < l.r)) return;
      out.push({ severity: 'warning', code: 'prop-in-lake', msg: `Prop ${index} (${p.prefab}) stands in a lake`, zone, ref: { collection: 'props', index }, x: p.x, z: p.z });
    });
  });

  // 5. Edited ground whose walk tiles were not re-baked.
  run('stale-bake', () => {
    if (hasAnalyze && ctx.dirty.walkRects.length > 0) {
      out.push({ severity: 'warning', code: 'stale-bake', msg: 'The walkability bake is out of date: Analyze > Re-bake', zone });
    }
  });

  // 6. Reachability and door checks: flood fills, so only when asked.
  if (opts?.reach && hasAnalyze) {
    run('reachability', () => {
      for (const r of computeReachability(ctx.terrain, zoneDef).results) {
        if (r.reachable) continue;
        out.push({ severity: 'warning', code: 'unreachable', msg: `${r.label} cannot be reached from the spawn`, zone, x: r.x, z: r.z });
      }
    });
    run('doors', () => {
      for (const line of doorIssuesFor(ctx)) out.push({ severity: 'warning', code: 'door', msg: line, zone });
    });
  }

  // Errors first, then by code; the order within a code is kept (sort is stable).
  const rank = (p: Problem): number => (p.severity === 'error' ? 0 : 1);
  out.sort((a, b) => rank(a) - rank(b) || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
  return out;
}
