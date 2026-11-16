---
name: decompose
description: Plan a game prototype or feature as epics of parallel issues and run them on Haiku workers. Use before building anything bigger than a one-file fix, e.g. "prototype a game where...", "add enemies and a score to games/x".
---

# Decomposing a problem for Haiku workers

Ported from the coding-platform-for-agents `prompts/decompose.md`, adapted to this repository: there is no issue tracker, issues are markdown, and each issue is one run of the `haiku-worker` agent, which implements and verifies it.

You are planning work that smaller models will carry out. The quality of the result is mostly decided here, by how you cut the problem and how you write each piece. Planning is the expensive part of the plan's budget; typing is the cheap part. Spend your effort on exact contracts and leave the code to the workers.

## Who does the work

Each issue is worked by Claude Haiku in one run that starts with an empty context. The worker has not seen this conversation, the roadmap or any other issue. It knows what the issue says and what it reads from the repository, and nothing else. It does careful work on a well-bounded change. It will not reliably infer intent, find its own way around a large codebase, notice that a neighbouring issue is changing the same file, or know a library's newest API. Phaser 4 and other recent versions differ from what a small model remembers, so name the exact API calls you want used.

## The structure

A **roadmap** is an ordered list of epics. An **epic** is a set of issues. An **issue** is one change, small enough for one worker in one run.

- Every issue in an epic can be in progress at the same moment, with none waiting on or colliding with another.
- When all of an epic's issues are done, the game builds (`npm run build -w games/<name>`), so the next epic starts from a working state.

Elapsed time is roughly the number of epics, so prefer few, wide epics.

## Finding the parallelism

Two issues can run in parallel when neither needs the other's result and they do not edit the same file. Most work that looks sequential is sequential only because of a shared interface. Decide that interface now and write it into both issues.

In order of preference:

1. **Fix the contract in the plan.** Write the exact signature, type, texture key, scene key, event name or data shape into every issue that touches it.
2. **Move the shared foundation to an earlier epic.** The project scaffold, a shared `config.ts` of constants, and **stub files** for every module the later epic fills in. A stub exports the final signature with a trivial body, so the build passes and every later worker owns exactly one file.
   If that foundation is almost entirely verbatim code you have already decided (types, tables, the main loop, stubs), write it yourself instead of putting it in an issue: pasting it into an issue costs you the same tokens, and a worker copying it adds cost and risk for nothing.
3. **Give every shared file one owner.** `main.ts` (the scene list), `package.json`, `index.html` and asset manifests are where parallel workers collide. Give each to one issue, or to the foundation epic.
4. **Merge.** Two issues that cannot be separated are one issue.

A dependency inside an epic is a last resort, since it turns parallel work back into a queue. If you need one, say in one sentence why none of the above worked.

### Games specifically

- A Phaser game cuts naturally by **scene** (Boot/Preload, Title, Game, GameOver/HUD) and by **system** (audio, input, spawning, save data). Each gets its own file.
- Scenes talk through **scene keys** and **data objects** passed to `this.scene.start(key, data)`; systems talk through **exported functions** or **events** on `this.events` / `this.game.events`. Put the exact key strings and payload types in `src/config.ts` in the foundation epic.
- Assets are a contract too: texture keys, frame sizes, animation keys. Either generate them in code (Graphics → `generateTexture`) or download them in the foundation epic, so no parallel worker waits on art.
- Tuning numbers (speeds, spawn rates) go in `config.ts` so the human can tweak them without reading gameplay code.
- Write the simulation as pure functions of plain data (no `Ctx`, no DOM at import time) and keep mesh building in functions that take a `scene`, not a whole `Ctx`. That keeps a party slice a small issue later instead of a refactor.
- A party slice issue owns `games/<name>/src/minigames/` plus the few modules it refactors once (name them). It pastes the size rules, the `MinigameDef` contract from `packages/party/src/types.ts`, and a Design section like `docs/roadmaps/gnome-party/2H-golf-slice.md`. Done when: `npm test -w games/<name>` (includes `testMinigame`), the game's build, and the base game unchanged.

## Sizing an issue

The worker's reading is the budget. Aim for at most five files to read and three to change. Put in everything the worker needs and nothing else:

- **Include** what you learned that the worker would otherwise rediscover: the exact API calls, existing helpers, the command that checks the work, a repo rule that applies.
- **Leave out** why the project exists, the roadmap, and what other epics do.
- **Paste, never point.** "See the epic", "as discussed" and "like the other issue" refer to things the worker cannot see. Copy the content in.

## Issue format

```
Epic: <number and name>
Depends on: none

## Environment
Working directory, toolchain notes (`export PATH="/c/Program Files/nodejs:$PATH"` if
node is not found), which repo rules apply, and that other workers are editing
other files in the same game at the same time.

## Goal
One or two sentences: what exists after this issue that did not before.

## Read first
- <path>: what to look for in it

## Change
- <path>: what to add or modify, with exact names, signatures and field names

## Contract
The interfaces this issue provides or must match, verbatim.

## Done when
- <command> succeeds
- <observable behaviour>

## Out of scope
Nearby files the worker must not touch, especially files another issue owns.
```

"Done when" needs at least one command the worker can run, that can pass before the rest of the epic lands and that leaves nothing behind. For a game: `npx tsc --noEmit -p games/<name>` is safe to run in parallel; `vite build` writes `dist/`, so leave full builds to the end-of-epic check. Two parallel issues must never start servers on the same port.

## Before you decompose

Read the code first. Every path and signature in an issue should be one you confirmed. Read `CLAUDE.md` and `SOUL.md`. If the goal is ambiguous in a way that would change how you cut it, ask before planning.

Party slice check (no need to ask the user):

- **New game:** decide whether a party-sized round of it fits the size rules in `packages/party/README.md` (20-60 s, one verb, four at once, small JSON state). If it fits, add a slice issue to the last epic. If not, add a backlog row saying why or "later".
- **Feature for a game that has `src/minigames/`:** every issue that changes a module the slice imports puts `npm test -w games/<name>` under "Done when".
- **Feature for a game without a slice:** add a slice issue only when the backlog row says it fits and the feature already makes the needed modules callable on their own. Never retrofit other games.

## Check the plan

For each epic:

- List the files each issue changes. A file under two issues is a collision; resolve it.
- List what each "Done when" command compiles. With stubs in place, `tsc --noEmit` sees other workers' files mid-edit. That is acceptable only if each worker's file keeps its stub's exported signature; say so in each issue's Contract.
- List ports, temp paths and output folders each check uses. No two parallel issues may share one.
- Read each issue as though you knew nothing else. Anything you had to fill in from memory is missing.

## Record and run the plan

1. Write the roadmap to `docs/roadmaps/<short-name>.md`: the goal, a shape table (epic, done when, issue count), then every issue in full inside `~~~~text` fences.
2. For each epic in order, launch one `haiku-worker` Agent call per issue **in a single message** so they run in parallel. Paste the full issue text into the prompt; the worker cannot see the roadmap file unless you name it.
3. When an epic's workers report, run the end-of-epic check yourself (`npm run build -w games/<name>`). Fix small breakage directly; for larger breakage write a fix issue.
4. Before the next epic, re-check its issues against the code as it now stands and correct their text.
5. Report the shape: how many epics, issues per epic, any dependency with its reason, and what failed.
