// The whole-scene line-of-sight and collision check: compile a script, sample it every 0.1 s and check each frame
// (los.ts checkFrame), then every walk and drive path (checkPath). Used by cutscenes.test.ts (npm test), the in-game
// `?cutscenecheck` report and the intro test. Run it on a scene before shipping it.
import type { Box } from '../types';
import { heightAt, waterAt } from '../terrain';
import { checkFrame, checkPath, type LosIssue, type LosOptions, type LosWorld } from './los';
import { roomColliders } from './rooms';
import { vehicleGroundFor } from './sceneVehicles';
import type { SceneScript, StageEnv, Timeline } from './script';
import { lineTiming } from './textSpeed';
import { compile, sampleFrame, scenePaths } from './timeline';

/** The ground the timeline stands actors and vehicles on, for a script's stage. */
export function envFor(script: SceneScript): StageEnv {
  if (script.stage.kind === 'room') return { ground: () => 0, vehicleGround: () => 0 };
  return { ground: heightAt, vehicleGround: vehicleGroundFor };
}

/** What a script's shots are checked against: the room's set pieces, or the world's colliders and terrain. */
export function losFor(script: SceneScript, worldBoxes: readonly Box[]): LosWorld {
  if (script.stage.kind === 'room') return { boxes: roomColliders(script.stage.room), ground: () => 0 };
  return { boxes: worldBoxes, ground: heightAt, water: (x, z) => waterAt(x, z)?.surface ?? null };
}

export interface CheckOptions extends LosOptions {
  /** Sample spacing, seconds. Default 0.1. */
  dt?: number;
}

/** Every problem in a compiled timeline. Consecutive frames with the same problem (kind, who, step) count once. */
export function checkTimeline(tl: Timeline, env: StageEnv, w: LosWorld, opts: CheckOptions = {}): LosIssue[] {
  const dt = opts.dt ?? 0.1;
  const out: LosIssue[] = [];
  let prev = new Set<string>();
  const end = Math.max(tl.duration, dt);
  for (let t = 0; t <= end + 1e-6; t += dt) {
    const now = new Set<string>();
    for (const issue of checkFrame(sampleFrame(tl, t, env), w, opts)) {
      const key = `${issue.kind}|${issue.who ?? ''}|${issue.step}`;
      now.add(key);
      if (!prev.has(key)) out.push(issue);
    }
    prev = now;
  }
  for (const p of scenePaths(tl, env)) out.push(...checkPath(p, w, opts));
  return out;
}

/** Check a script at normal text speed against `worldBoxes` (world stages) or its room set. */
export function checkScript(script: SceneScript, worldBoxes: readonly Box[], opts: CheckOptions = {}): LosIssue[] {
  const env = envFor(script);
  return checkTimeline(compile(script, lineTiming('normal')), env, losFor(script, worldBoxes), opts);
}

/** One line per issue, for test failures and the console. */
export function formatIssues(id: string, issues: readonly LosIssue[]): string {
  if (issues.length === 0) return `${id}: all shots pass`;
  return [`${id}: ${issues.length} problem(s)`, ...issues.map((i) =>
    `  ${i.t >= 0 ? `t=${i.t.toFixed(1)}s` : 'path'} step ${i.step} ${i.kind}${i.who ? ` (${i.who})` : ''}: ${i.detail}`)].join('\n');
}
