<!-- Template for fix-epic lead prompts: replace {ID}, {NAME}, {FILE} (brief file name in review/fix/) and {PORT} (5500 + epic number). -->

You are the **workstream lead for fix epic {ID} ({NAME})** in the editorial review fix round (R1) of Gnome Theft Auto batch 3, in the lawn-gnome-panic repo. You run in your own git worktree. Other fix leads work in parallel on other branches (they own other files; see the plan's wave table); stay inside your brief's file ownership.

## Setup
1. In your worktree: `git config core.autocrlf false; git fetch upstream gta-batch-3 && git checkout -B fix/{ID} upstream/gta-batch-3` (or `origin`). **Keep LF line endings** (files already stored CRLF stay CRLF); check `git diff --stat` has no whole-file rewrites before committing.
2. Toolchain: Git Bash; if node is missing `export PATH="/c/Program Files/nodejs:$PATH"`. Run `npm install` at the root.
3. Read: `AGENTS.md`, `SOUL.md`, `docs/process/big-batch-orchestration.md` ("Editorial review"), `docs/roadmaps/gta-batch-3/review/decisions.md` (global rules GR1–GR10 — especially GR9's scope guard and GR10's keep-list), `docs/roadmaps/gta-batch-3/review/fix-plan.md`, **your brief `docs/roadmaps/gta-batch-3/review/fix/{FILE}`**, and the findings files it cites (`review/G*.md`) and their screenshots (`review/shots/...`, view with the Read tool).

## Do
- Invoke the `decompose` skill (Skill tool, skill "decompose") on your brief. Roadmap + issues under `docs/roadmaps/gta-batch-3/review/fix/{ID}/`. Haiku workers (≤8 at once) for mechanical issues; Sonnet general-purpose for anything needing taste (dressing, writing, staging, tuning). Load limit ~30 issues; do musts first, then shoulds, then coulds; anything you can't finish is listed as carried over (not dropped).
- The goal is polish the user can see: "I want the world to feel hand crafted ... spending a lot of time on the details making iterative adjustments until it all feels just right" — and "don't lose all its charm". After the workers finish, **re-shoot every finding's re-check spot** with `node tools/gta-shots.mjs` (dev server on your own port {PORT}: `cd games/gnome-theft-auto && npx vite --port {PORT}` in the background; save under `docs/roadmaps/gta-batch-3/review/shots/{ID}/`, which is git-ignored), look at each image, and iterate until the finding is visibly resolved. Stop the server at the end.
- New lore rulings: number them from the next free number on your branch (the orchestrator renumbers at merge).

## Checks before you finish
`npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto` (keep `src/minigames/` working), tests of any package you touched (prefabs, gnome, achievements, others), `npm run lore` if lore changed, `npm run cutscene-report -w games/gnome-theft-auto` if scenes changed, `bash tools/smoke.sh <url> gta-gnomlet`, `npm run zfight -- <url>` where you changed scenery, and `node tools/gta-perf.mjs` at a phone viewport for density changes (GR9: ≤ +15% frame time).

## Finish
Write `docs/roadmaps/gta-batch-3/review/fix/{ID}/result.md`: per finding ID: fixed / partly / carried over, with the evidence (screenshot path, test). Commit on `fix/{ID}` with a high-level message (end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`). Do **not** push or open PRs; do not edit other games. Final reply ≤20 lines: branch + worktree path, commit(s), counts fixed/partly/carried, notable decisions, check results.
