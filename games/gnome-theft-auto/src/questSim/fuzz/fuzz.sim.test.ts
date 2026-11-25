// Quest fuzzer CLI: plays quests with one injected disruption each and writes fuzz.json and fuzz.md. Runs only through
// tools/quest-fuzz.mjs (QUESTFUZZ_CLI=1). Never fails on quest failures: the report is the product.
//
// Env: QUESTFUZZ_SEED (default 1), QUESTFUZZ_QUEST (comma ids; default every plan), QUESTFUZZ_PER_QUEST (default 2),
// QUESTFUZZ_ALL (every disruption once per quest), QUESTFUZZ_OUT (output dir).
import '../globals';
import { expect, it } from 'vitest';
import { buildSimWorld, headlessHost } from '../harness';
import { QUEST_PLANS } from '../plans';
import { ALL_CHEATS } from '../types';
import { fuzzRun, planFuzz, type FuzzResult } from './fuzz';
import { fuzzMarkdown } from './report';
import { mulberry32 } from './rng';

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

/** nc-party needs a relay server: the headless sim cannot play it. */
const SKIP = new Set(['nc-party']);

function selectQuests(): string[] {
  const wanted = env.QUESTFUZZ_QUEST?.split(',').map((s) => s.trim()).filter(Boolean);
  return (wanted ?? Object.keys(QUEST_PLANS)).filter((id) => !SKIP.has(id));
}

function stamp(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

it('planFuzz is deterministic for a seed', () => {
  const ids = ['first-contract', 'sq-grid-truthers', 'ch5-even-cut'];
  const a = planFuzz(mulberry32(7), ids, 3, false);
  const b = planFuzz(mulberry32(7), ids, 3, false);
  expect(a.length).toBeGreaterThan(0);
  expect(b).toEqual(a);
  expect(planFuzz(mulberry32(8), ids, 3, false)).not.toEqual(a);
  const all = planFuzz(mulberry32(7), ['first-contract'], 1, true);
  expect(new Set(all.map((p) => p.disruption)).size).toBe(all.length);
});

it.skipIf(!env.QUESTFUZZ_CLI)('quest fuzz cli', async () => {
  const { fs, os, path } = await loadNode();
  const seed = Number(env.QUESTFUZZ_SEED ?? 1);
  const perQuest = Number(env.QUESTFUZZ_PER_QUEST ?? 2);
  const plans = planFuzz(mulberry32(seed), selectQuests(), perQuest, !!env.QUESTFUZZ_ALL);
  const outDir = env.QUESTFUZZ_OUT ?? path.join(os.tmpdir(), 'gta-quest-fuzz', stamp(new Date()));
  fs.mkdirSync(outDir, { recursive: true });

  const host = headlessHost(buildSimWorld());
  const results: FuzzResult[] = [];
  console.log(`quest fuzz: ${plans.length} runs, seed ${seed}, out ${outDir}`);
  for (const plan of plans) {
    const r = await fuzzRun(host, plan, { cheats: ALL_CHEATS, budget: QUEST_PLANS[plan.questId]?.budget });
    results.push(r);
    const tag = plan.variant ? `/${plan.variant}` : '';
    console.log(`${r.outcome.toUpperCase()} ${plan.questId}${tag} ${plan.disruption} step ${plan.step} +${plan.at}f: ${r.outcome === 'recovered' || r.outcome === 'not-applied' ? r.note : r.reason}`);
  }

  const md = fuzzMarkdown(results, seed);
  fs.writeFileSync(path.join(outDir, 'fuzz.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(outDir, 'fuzz.md'), md);
  console.log(md);
  console.log(`report written to ${outDir}`);
}, 60 * 60_000);
