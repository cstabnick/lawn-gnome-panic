# Big-batch orchestration: from a laundry list to one feature PR

How to turn a long, mixed list of feature requests for one game into a single large feature PR, across several
sessions, without overloading any one agent. First used for the Gnome Theft Auto batch 3
(`docs/roadmaps/gta-batch-3.md`). Reuse this process for the next big list.

## Roles and model tiers

| Role | Model | Does | Never does |
|---|---|---|---|
| Orchestrator (main session) | Opus | groups the list into epics, writes the master plan and tracking doc, starts workstreams, merges their branches, runs the cross-epic checks, keeps the tracking doc current, opens and updates the PR | write feature code (only small merge fixes) |
| Brief writers | Sonnet | read the code for 2–4 epics and write each epic's brief: scope, confirmed code pointers, contracts, risks | plan issues, write code |
| Workstream lead | Opus, one per epic | runs the `decompose` skill on its epic brief, writes issue files, runs `haiku-worker` agents, does the end-of-epic checks, commits on its own branch | push, open PRs, edit outside its epic's scope, edit other games except as the brief allows |
| Worker | Haiku (`haiku-worker`) | implements and verifies one issue | commit |
| Explore / survey | Sonnet or Haiku `Explore` | read-only sweeps when the orchestrator needs a fact | edits |

## Steps

1. **Ingest.** Copy the user's list word for word into the master plan (`docs/roadmaps/<batch>.md`, section "Source list"),
   with a numbered ID per item (`L01`…). Nothing gets lost or paraphrased away.
2. **Group.** Cluster the items into epics by *shared code and shared place*, not just by theme: two items that edit the
   same module belong together. Target an epic size one Opus lead can decompose into at most about 3 internal
   sub-epics of at most 10 issues each. Split anything bigger (e.g. "70 main quests" becomes a writing epic plus several
   build epics).
3. **Find the engine work.** Anything several content epics need (world growth, interiors, weather, inventory, purchase
   framework) becomes its own foundation epic and is ordered first. Call these out as **Engine** in the plan.
4. **Order.** Write the dependency graph (epic → epics it needs) and cut it into **waves** of at most 3 epics that can
   run at once. Prefer putting epics that touch different modules in the same wave; hot files (`config.ts`, save keys,
   `online/protocol.ts`, `main.ts`/`app.ts`) are resolved at merge time, see "Merging" below.
5. **Briefs.** Sonnet brief writers produce one file per epic in `docs/roadmaps/<batch>/<epic>.md` (template below).
   The orchestrator reviews them for overlap: every source item is owned by exactly one epic.
6. **Plan PR.** Commit the process doc, the master plan (with the tracking table) and the briefs on the batch branch,
   push it to the upstream remote and open the PR against `main`. This PR stays open and becomes the feature PR: every
   epic merges into this branch, and the branch merges into `main` once at the end.
7. **Run waves.** For each wave, start up to 3 workstream leads in parallel, each with `isolation: "worktree"` (its own
   branch off the current batch branch). Each lead:
   - reads its brief, `AGENTS.md`, `SOUL.md` and the game's rows in `AGENT_INDEX.md`;
   - runs `decompose` and writes its roadmap to `docs/roadmaps/<batch>/<epic>/` (issue files + a short roadmap);
   - runs its issues on `haiku-worker` agents, re-checks, fixes;
   - passes: `npm run build -w games/<game>`, `npm test -w games/<game>`, any package tests it touched, `npm run lore`
     if lore changed, `bash tools/smoke.sh`, `npm run zfight` for 3D scenery;
   - commits on its branch with a message that explains the change at a high level (one commit per epic, or a few),
     and reports: branch name, what landed, what was deferred, known issues.
8. **Merge.** The orchestrator merges each finished lead branch into the batch branch (`git merge --no-ff`, message
   `Epic Exx: <name>` + the high-level summary). Hot-file conflicts are almost always additive (two new config blocks,
   two new save keys): keep both. Then run the game's build and tests on the merged result before starting the next
   wave. Push the batch branch.
9. **Track.** After every merge, update the tracking table in the master plan: status, branch, merge commit, deferred
   items, notes. Commit it with the merge. The "Next session starts here" section always names the next wave.
10. **Finish.** When the last wave merges: full checks, demos (recorded with `npm run demo -- <demo.json> --gif`,
    uploaded through the media-upload MCP, linked in the PR description), PR description rewritten to describe the
    whole batch.

## Editorial review (after the last epic, before the PR merges)

The goal is a world that feels hand-crafted: details, consistency, tone, feel. Content that "works" is not done.

1. **Group the content** into review groups that one editor can hold in mind, e.g. per region (Turfton downtown,
   Pardonlin, the coast, Snowcap Rise, Rootwell, Capwood and Rutbottom, Hedgeworth, the Unmown, countryside), per
   system (vehicles and driving, jobs, activities and minigames, UI/Gnomlet/map/options, audio), and the story (per act).
2. **Editors** (Opus, one per group, run in parallel up to the agent limit, read-only on code): play/inspect through the
   dev server, screenshots (`tools/gta-shots.mjs`), headless checks, the lore and the design docs; write a findings file
   `docs/roadmaps/<batch>/review/<group>.md` with numbered findings, each: what, where (file / coordinates / quest step),
   why it matters, a proposed fix, severity (blocker / polish / nit), and whether it is a *spirit* question (taste,
   tone, design direction) or a *craft* issue (bug, inconsistency, rough edge).
3. **Decider** (Opus): every *spirit* finding, and any finding two editors disagree on, goes to a decider agent with
   the finding, the current state, the lore (`docs/lore/canon.md`, rulings), the standing decisions (incl. "keep the
   charm") and the user's own words. It writes pros/cons of each option and a decision with a one-line reason into
   `review/decisions.md`. Its decision is final for the batch.
4. **Fix rounds**: craft findings and decided spirit findings are grouped into fix epics and run like any epic (Opus
   lead, decompose, workers), merged, checked.
5. **Iterate**: editors re-review their group against the previous findings file; repeat until a round finds no
   blockers and only nits. Record each round's counts in the tracking doc.

## Load rules (so no agent drowns)

- A lead owns one epic. If decompose finds more than ~30 issues, the lead stops after the first ~30, commits a working
  state, and reports the rest as deferred; the orchestrator schedules a follow-up epic.
- A worker issue reads at most 5 files and changes at most 3 (decompose rules).
- Brief writers handle at most 4 epics each.
- The orchestrator never reads whole lead transcripts: leads report in ≤ 30 lines.

## Resuming in a new session

1. `git fetch upstream && git checkout <batch branch> && git pull`.
2. Read the master plan's tracking table and "Next session starts here".
3. `git worktree list` / `git branch --list 'worktree-*'`: any lead branch that finished but never merged gets merged
   first; any half-finished one gets a new lead told to continue from its branch and issue files.
4. Start the next wave.

## Epic brief template

```
# Exx <name>
Wave: n · Depends on: Eyy, Ezz · Kind: Engine | Content | Fix | Story | Polish
Source items: L03, L17, ... (verbatim text of each)

## Goal
## Scope (what is in, what is explicitly out)
## Code pointers (confirmed paths, functions, config blocks)
## Contracts this epic provides for later epics
## Contracts this epic consumes from earlier epics
## Online / mobile / achievements / prefabs / lore notes
## Risks and open questions (with the decision taken)
## Done when
```

## Merge traps seen

- Lead worktrees on Windows can commit CRLF line endings, which turns a small change into a whole-file diff and
  conflicts. After `git merge --no-ff`, for every changed file that has CRs where the batch branch's version had none,
  strip them (`sed -i 's/\r$//'`), `git add` it, then commit the merge. Tell leads to keep LF.
- `tools/batch-merge.sh <branch> <msg-file>` does the merge, the CRLF clean-up and lists conflicts. The usual
  conflicts are the long GTA row in `AGENT_INDEX.md` (splice the incoming insertion into the current row), `layout.golden.json`
  (take either side, then regenerate with `UPDATE_GOLDEN=1 npx vitest run src/layout.golden.test.ts`) and import
  lists (keep both).
- Timing-sensitive tests (e.g. GTA's `traffic.test.ts` "keep moving") can fail under a loaded full-suite run; rerun the
  single file before treating it as a regression.
