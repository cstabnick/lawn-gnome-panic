// Quest sim CLI: plays the selected quests headless and writes report.json and report.md. Runs only through
// tools/quest-sim.mjs --headless (QUESTSIM_CLI=1). Never fails on quest failures: the report is the product.
//
// Env: QUESTSIM_QUEST (comma ids), QUESTSIM_CHAPTER (story chapter n), QUESTSIM_SUITE (story|side|city|newcomers|races);
// none = every plan. QUESTSIM_CHEATS: all (default) | none | comma list of cheat ids. QUESTSIM_OUT: output dir.
// QUESTSIM_PARALLEL (tools/quest-sim.mjs --parallel) is accepted and ignored here: headless runs one quest at a time in
// this process, so the sim-player cap (config.ts MAX_SIM_PLAYERS) holds without it.
import './globals';
import { it } from 'vitest';
import { questById } from '../quests/defs';
import { buildSimWorld, headlessHost } from './harness';
import { QUEST_PLANS } from './plans';
import { toMarkdown } from './report';
import { runQuest } from './runner';
import { ALL_CHEATS, CHEAT_IDS, type Cheats, NO_CHEATS, type QuestResult, type SimSuite } from './types';

interface NodeFs {
  mkdirSync(dir: string, opts: { recursive: boolean }): void;
  writeFileSync(file: string, data: string): void;
}
interface NodeOs { tmpdir(): string }
interface NodePath { join(...parts: string[]): string }

/** Node builtins, loaded at run time so no static node: import needs Node types in this file (tsc stays clean). */
async function loadNode(): Promise<{ fs: NodeFs; os: NodeOs; path: NodePath }> {
  const spec = (m: string): string => `node:${m}`;
  const fs = (await import(/* @vite-ignore */ spec('fs'))) as NodeFs;
  const os = (await import(/* @vite-ignore */ spec('os'))) as NodeOs;
  const path = (await import(/* @vite-ignore */ spec('path'))) as NodePath;
  return { fs, os, path };
}

const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;

/** Turn a cheats setting into a Cheats object: all (default), none, or a comma list of ids. */
function parseCheats(spec: string | undefined): Cheats {
  if (!spec || spec === 'all') return ALL_CHEATS;
  if (spec === 'none') return NO_CHEATS;
  const wanted = new Set(spec.split(',').map((s) => s.trim()).filter(Boolean));
  const out: Cheats = { ...NO_CHEATS };
  for (const id of CHEAT_IDS) out[id] = wanted.has(id);
  return out;
}

/** The (quest, variant) runs the env selects, in plan order. */
function selectRuns(): { questId: string; variant?: 'A' | 'B'; budget?: number }[] {
  const quests = env.QUESTSIM_QUEST?.split(',').map((s) => s.trim()).filter(Boolean);
  const chapter = env.QUESTSIM_CHAPTER ? Number(env.QUESTSIM_CHAPTER) : undefined;
  const suite = env.QUESTSIM_SUITE as SimSuite | undefined;
  const skip = new Set((env.QUESTSIM_SKIP ?? '').split(',').map((x) => x.trim()).filter(Boolean));
  let ids = quests ?? Object.keys(QUEST_PLANS);
  // --quick: one quest per objective kind (the first in plan order that uses it), for a smoke run in well under 30 s.
  if (env.QUESTSIM_QUICK && !quests) {
    const seen = new Set<string>();
    ids = ids.filter((id) => {
      const fresh = (questById(id)?.objectives ?? []).map((o) => o.kind).filter((k) => !seen.has(k));
      for (const k of fresh) seen.add(k);
      return fresh.length > 0;
    });
  }
  ids = ids.filter((id) => !skip.has(id));
  const out: { questId: string; variant?: 'A' | 'B'; budget?: number }[] = [];
  for (const questId of ids) {
    const plan = QUEST_PLANS[questId];
    if (!plan) {
      if (quests) out.push({ questId });
      continue;
    }
    if (suite && plan.suite !== suite) continue;
    if (chapter !== undefined && questById(questId)?.chapter !== chapter) continue;
    if (plan.variants) for (const variant of plan.variants) out.push({ questId, variant, budget: plan.budget });
    else out.push({ questId, budget: plan.budget });
  }
  return out;
}

function stamp(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

it.skipIf(!env.QUESTSIM_CLI)('quest sim cli', async () => {
  const { fs, os, path } = await loadNode();
  const runs = selectRuns();
  const cheats = parseCheats(env.QUESTSIM_CHEATS);
  const outDir = env.QUESTSIM_OUT ?? path.join(os.tmpdir(), 'gta-quest-sim', stamp(new Date()));
  fs.mkdirSync(outDir, { recursive: true });

  const host = headlessHost(buildSimWorld());
  const results: QuestResult[] = [];
  console.log(`quest sim: ${runs.length} runs, cheats ${env.QUESTSIM_CHEATS ?? 'all'}, out ${outDir}`);
  for (const run of runs) {
    const r = await runQuest(host, run.questId, { cheats, variant: run.variant, budget: run.budget });
    results.push(r);
    const tag = run.variant ? ` (${run.variant})` : '';
    const line = r.status === 'pass' ? `PASS ${run.questId}${tag} ${(r.simSeconds).toFixed(1)}s` : `FAIL ${run.questId}${tag}: ${r.reason}`;
    console.log(line);
  }

  const md = toMarkdown(results, 'Quest sim (headless)');
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(outDir, 'report.md'), md);
  console.log(md);
  console.log(`report written to ${outDir}`);
}, 30 * 60_000);
