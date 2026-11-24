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
