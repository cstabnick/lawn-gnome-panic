Epic: 4 Demo and check
Depends on: none (Epics 1-3 are done: the whole game is playable)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, push or open a PR, and do not use `--pr` with the demo tool (the planner uploads demos another way).
- You are the only worker in this epic. Start the game's dev server once: `npm run dev -w games/final-collectathon` (port 5205; read the real port from its output) and stop it at the end.

## Goal

Add scripted demo clips, a landing-page thumbnail, and do one full fast run-through of the game, fixing only small
breakage you find (a wrong area name, a missing `await`, a typo), and reporting anything bigger.

## Read first

- `docs/demos.md`: the demo JSON format (`setup` → query string, `url`, `warmup`, `duration`, `size`, `steps` with `press`/`hold`/`click`/`drag`; actions `jump`, `forward`, `back`, `left`, `right` or any `KeyboardEvent.code`).
- `games/final-collectathon/README.md`: URL flags `?chapter=<id>` and `?fast`; `window.fc` (debug handle: `fc.director.ctx`, `fc.collect`, `fc.hud`).
- `tools/thumbnails.cjs` (top comment and how it picks a game): `node tools/thumbnails.cjs final-collectathon` writes `games/final-collectathon/thumbnail.jpg`.

## Change

- `games/final-collectathon/demos/hello.json`: `url` `http://localhost:5205/`, `setup: { "chapter": "prologue" }`, about 6 s: the fade-in on reception and Primrose's "Hello." (press `Enter` to advance once, `Digit1` to choose "Hello."). `title`: "Hello."
- `games/final-collectathon/demos/collecting.json`: `setup: { "chapter": "ch2", "fast": true }`, warmup 4, about 5 s of walking (`hold` `forward`/`left`/`right`) through Clips on Floor 2 with the counters ticking. `title`: "Onboarding: Clips".
- `games/final-collectathon/demos/pointlessness.json`: `setup: { "chapter": "ch4", "fast": true }`, a warmup long enough to reach the overflowing HUD (try 8-12 s), about 5 s. `title`: "Everything".
- `games/final-collectathon/demos/phone.json`: like `collecting.json` with `"size": [390, 844]` (portrait phone): the touch layout.
- Record each once with `npm run demo -- games/final-collectathon/demos/<name>.json --gif` and look at the frames (`demos/out/` is gitignored). Adjust timings until each shows what its title says.
- `thumbnail.jpg`: run `node tools/thumbnails.cjs final-collectathon` with the dev server up. If the tool needs a per-game setup (see how it handles other games near its top), add one small entry that loads `?chapter=ch2&fast` and waits ~4 s, so the thumbnail shows a floor full of Clips; only add your game's entry, do not change other games' entries.
- Full run-through with `?fast` (from `http://localhost:5205/?chapter=prologue&fast`): drive it with the keyboard, or from the browser console through `window.fc` (e.g. `fc.collect.counts.clip = 1000` to skip a wait). Note each chapter's real (non-fast) length from the script waits as a sanity check against ~19 minutes in total (prologue 1, ch1 3, ch2 4.5, ch3 5, ch4 4, ending 2).
- Smoke checks: `bash tools/smoke.sh http://localhost:5205/ fc-hud fc-touch fc-dialog` and `bash tools/smoke.sh "http://localhost:5205/?chapter=ch3&fast" fc-hud fc-counters` must report no console errors; `bash tools/smoke.sh "http://localhost:5205/#minigame=hoard-rush"` must report no console errors.
- `npm run zfight -- "http://localhost:5205/?chapter=ch2&fast"` and `... ?chapter=ch4&fast`: report findings; fix only those inside `games/final-collectathon/src/floors/*.ts` (move a prop by a few cm so two faces no longer share a plane).

## Done when

- The four demo JSONs exist and each records a GIF that shows its title.
- `games/final-collectathon/thumbnail.jpg` exists (480x270).
- `npm run build -w games/final-collectathon` and `npm test -w games/final-collectathon` pass.
- The smoke checks above pass. Your report lists: the run-through result per chapter, any fix you made (file and line), and anything left broken.

## Out of scope

`packages/**`, other games, `docs/**` except adding a line to `games/final-collectathon/README.md` listing the demos.
