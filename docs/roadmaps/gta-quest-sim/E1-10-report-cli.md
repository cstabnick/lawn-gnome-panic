Epic: 1 (solvers and tools, all parallel)
Depends on: none (the browser API it drives is a fixed contract; another worker builds it at the same time)

(Read `docs/roadmaps/gta-quest-sim/_env.md` first: environment and style.)

## Goal
`npm run quest-sim -w games/gnome-theft-auto` (headless) and `npm run quest-sim:e2e -w games/gnome-theft-auto` (in
headless Edge against a running dev server) play the selected quests with the bot and write a JSON and a markdown report.

## Read first
- `games/gnome-theft-auto/package.json`: the scripts already exist: `"quest-sim": "node ../../tools/quest-sim.mjs --headless"`,
  `"quest-sim:e2e": "node ../../tools/quest-sim.mjs"` (npm passes extra args after `--`).
- `src/questSim/types.ts` (`QuestResult`, `Cheats`, `CHEAT_IDS`, `ALL_CHEATS`, `NO_CHEATS`), `src/questSim/plans.ts`
  (`QUEST_PLANS`: suite, variants), `src/questSim/suite.ts` (`suiteRuns`, how a suite runs quests),
  `src/questSim/runner.ts` (`runQuest(host, id, { cheats, variant })`), `src/questSim/harness.ts`
  (`buildSimWorld`, `headlessHost`), `src/quests/defs.ts` (`questById(id).chapter`).
- `tools/gta-perf.mjs` (how a headless Edge/Chrome is found and launched with `puppeteer-core`, console errors caught).
- `src/questSim/browser.ts`: the page API `window.__questSim` (`QuestSimApi`: `list()`, `run()`, `status()`, `stop()`,
  `queue()`, `results()`). URL parameters the page understands (fixed contract):
  `?debug&questsim=<questId>&questsimVariant=A|B&questsimCheats=all|none|<comma list of cheat ids>&questsimRun=<token>`
  (a fresh token per run, e.g. `Date.now()`): the page prepares
  the save (it may reload itself once), plays that quest and appends the result to `__questSim.results()`.

## Change
- `src/questSim/report.ts` (new, pure):
  - `export function toMarkdown(results: QuestResult[], title: string): string`: a heading, a summary line
    (`N pass, N fail, N blocked of N runs`), and a table: `| Quest | Ending | Result | Steps | Cheats | Sim s | Wall ms | Reason |`
    (Steps = `passed/total`, Cheats = comma list of ids, Reason = `reason` with `|` escaped), then a "Findings" list
    (`- questId step: class check: detail`).
  - `export function summarize(results: QuestResult[]): { pass: number; fail: number; blocked: number; total: number }`.
- `src/questSim/report.test.ts` (new): `toMarkdown` on two hand-made results (one pass, one fail with a finding)
  contains both ids, the summary line and the finding.
- `src/questSim/cli.test.ts` (new): `it.skipIf(!process.env.QUESTSIM_CLI)('quest sim cli', ...)` with a 30-minute
  timeout. Reads env: `QUESTSIM_QUEST` (comma ids), `QUESTSIM_CHAPTER` (story chapter n), `QUESTSIM_SUITE`; none of
  them = every plan. `QUESTSIM_CHEATS`: 'all' (default) | 'none' | comma list of cheat ids to turn on. `QUESTSIM_OUT`:
  output dir (default `<os.tmpdir()>/gta-quest-sim/<yyyymmdd-hhmmss>`). Builds the world once, runs every selected
  (quest, variant) with `runQuest`, prints one line per run as it finishes (`PASS id (A) 12.3s` / `FAIL id: reason`),
  writes `report.json` (the results array) and `report.md` (`toMarkdown`) into the out dir, prints the out dir and
  the markdown. Never fails the test on quest failures (the report is the product). Use `node:fs`, `node:os`,
  `node:path` (types come from @types/node via vitest; if tsc complains about `process`, read env through
  `(globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env`).
- `tools/quest-sim.mjs` (new, Node ESM, no TypeScript):
  - Usage comment at the top (both modes, every flag, examples).
  - Flags: `--quest id[,id]`, `--chapter n`, `--suite story|side|city|newcomers|races`, `--all` (default),
    `--cheats all|none|a,b`, `--out dir`.
  - `--headless`: spawn `npx vitest run src/questSim/cli.test.ts` with `cwd` = `games/gnome-theft-auto` (resolve from
    the script's own path), `shell: true`, `stdio: 'inherit'`, env `QUESTSIM_CLI=1` plus the selection vars; exit with
    its code.
  - otherwise (E2E): `--url` (default `http://localhost:5445/`), `--timeout` seconds per run (default 600), `--stuck`
    seconds (default 60), `--headful`. Launch Edge/Chrome like gta-perf.mjs (viewport 1280x720). The run list: the
    selected ids (for `--all`, read `await page.evaluate(() => window.__questSim.list())` after one load of
    `${url}?debug&questsim`); choice quests (ids `ch5-even-cut`, `sq-fescue-fugitive`, `sq-tessie`) run with variants A
    and B. For each run: `page.goto(url + '?debug&questsim=' + id + '&questsimVariant=' + v + '&questsimCheats=' + cheats + '&questsimRun=' + Date.now())`,
    then poll every 2 s: `window.__questSim?.results()` for a result with that questId/variant (done), and
    `window.__questSim?.status()` plus `window.__gta?.player` x/z: when neither the status line nor the position
    changed for `--stuck` s, dump `{ status, player: {x,y,z}, vehicle kind, journal activeLines (window.__gta.quests.getJournal()) }`,
    take a screenshot, record a result `{ questId, variant, status: 'fail', reason: 'bot: stuck: <line>' }` and move
    on. A timeout or a failed result also gets a screenshot (`<out>/<id>-<v>.png`). Collect page errors.
    Write `report.json` and `report.md` (same table columns as report.ts; re-implement the few lines in JS) into the
    out dir (default `<os.tmpdir()>/gta-quest-sim/e2e-<stamp>`), print the table. ALWAYS close the browser in a
    `finally`.

## Contract
`toMarkdown(results: QuestResult[], title: string): string`, `summarize(results)`. The env vars and flags above.

## Done when
- `npx vitest run src/questSim/report.test.ts src/questSim/cli.test.ts` passes (cli skipped without QUESTSIM_CLI).
- `node ../../tools/quest-sim.mjs --headless --quest sq-grid-truthers` (from games/gnome-theft-auto) runs, prints a
  table and writes both files (the quest may FAIL while other solvers are still stubs; that is fine).
- `npx tsc --noEmit -p .` shows no error in `src/questSim/report*.ts` / `cli.test.ts`.
- Do NOT run the E2E mode (no dev server in this issue); check it with `node --check tools/quest-sim.mjs`.

## Out of scope
Every other file (package.json already has the scripts).
