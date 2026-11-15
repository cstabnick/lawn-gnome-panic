Epic: 1 (shared modules and the party-only capability)
Depends on: none

## Goal
A game can be **party-only**: its `package.json` has `"lawn": { "partyOnly": true }`. Such a game only surfaces Gnome Party slices: the landing page (`npm run site`) neither builds nor lists it, `tools/thumbnails.cjs` skips it, and `npm run new -- <name> --party-only` makes one. The docs say how it works. (Gnome Party already finds every game's `src/minigames/index.ts` by itself, so nothing changes there.)

## Read first
- `tools/build-site.mjs`: the `for (const name of readdirSync(gamesDir).sort())` loop that reads each `package.json`, builds the game and pushes a card.
- `tools/thumbnails.cjs`: line ~39, the `games` filter.
- `tools/new-game.mjs`: argument parsing (`--from`) and where it writes the new game's `package.json`.
- `packages/party/README.md`: the headings `## How a game surfaces a slice` and `## Backlog` (rows for `oly-*` at the end of the table).
- `games/gnomylpics/package.json`: the first party-only game (do not edit it).

## Change
- `tools/build-site.mjs`: right after `const pkg = readJson(pkgPath);`, if `pkg.lawn?.partyOnly === true`, `console.log(\`Skipping games/${name}: party-only (its slices play inside gnome-party)\`)` and `continue` (no build, no copy, no card). Add one line to the header comment: party-only games (`"lawn": { "partyOnly": true }` in package.json) are not built or listed; their slices ship inside gnome-party.
- `tools/thumbnails.cjs`: in the `games` filter also drop a game whose `package.json` has `lawn.partyOnly === true` (read it with `JSON.parse(fs.readFileSync(..., 'utf8'))`; a game without package.json is dropped as before by the vite.config check).
- `tools/new-game.mjs`: a `--party-only` flag (any position, like `--from`). After the copy, set `pkg.lawn = { ...(pkg.lawn ?? {}), partyOnly: true }` in the new game's `package.json` (write it with `JSON.stringify(pkg, null, 2) + '\n'`), and print: `Party-only: not on the landing page. Add events with npm run new-mini -- <name> <id>; play one alone at #minigame=<id>.` Update the usage line and comment to `node tools/new-game.mjs <name> [--from <existing-game>] [--party-only]`.
- `packages/party/README.md`: a new section `## Party-only games` directly before `## Backlog`, saying in plain short sentences:
  - A game whose only purpose is to surface slices (a set of events that make no sense as a stand-alone game) sets `"lawn": { "partyOnly": true }` in its `package.json`. Make one with `npm run new -- <name> --party-only`.
  - It is a normal workspace (build, test, the `#minigame=<id>` dev page), but `npm run site` neither builds nor lists it, and `tools/thumbnails.cjs` skips it. Its slices reach players through Gnome Party, which finds `games/*/src/minigames/index.ts` like any other game's.
  - Its own page (`npm run dev -w games/<name>`) lists its slices and plays one against 3 CPUs.
  - Example: `games/gnomylpics`, the Gnome Olympics.
  And replace the six backlog rows that say `TODO one-line idea` with exactly:
  ```
  | oly-sprint | gnomylpics | Gnome Sprint: 100 m, alternate A and D, same key twice is a stumble | building |
  | oly-triple-jump | gnomylpics | Triple Gnome Jump: run up, take off before the line, tap on each landing; best of 2 | building |
  | oly-mower-toss | gnomylpics | Mower Toss: alternate to spin the mower, release near 45°; best of 2 | building |
  | oly-lawn-dart | gnomylpics | Lawn Dart Javelin: run up, hold to aim, release before the foul line; best of 2 | building |
  | oly-grass-mow | gnomylpics | Grass Mowing: steer a mower on a shared lawn, mow the most cells in 40 s | building |
  | oly-gnome-hero | gnomylpics | Gnome Hero: a random beat-driven 4-lane jam, hit the notes on the beat, most points | building |
  ```
- `CLAUDE.md`: in `## Layout`, after the line about `games/<name>/src/minigames/`, add the bullet:
  `- Party-only games (`"lawn": { "partyOnly": true }` in package.json, e.g. `games/gnomylpics`) exist only to surface slices: not on the landing page, played inside Gnome Party. Make one with `npm run new -- <name> --party-only`.`

## Contract
- The flag is exactly `pkg.lawn.partyOnly === true` in `games/<name>/package.json`.

## Done when
- `node -e "const p=require('./games/gnomylpics/package.json'); if(p.lawn.partyOnly!==true) process.exit(1)"` exits 0 (sanity).
- `node --check tools/build-site.mjs && node --check tools/new-game.mjs && node --check tools/thumbnails.cjs` succeed.
- `node tools/new-game.mjs zz-party-check --from gnome-creator --party-only` creates `games/zz-party-check` whose package.json has `"lawn": { "partyOnly": true }`; then delete it with `rm -rf games/zz-party-check` (do not run npm install; leave nothing behind, and check `git status --short` shows no `zz-party-check` path; if `package-lock.json` changed, `git checkout package-lock.json`).
- Do NOT run `npm run site` (it builds every game and would collide with other workers).

## Out of scope
Everything under `games/` (other workers own `games/gnomylpics/src/**`), `packages/party/src/**`, `games/gnome-party/**`.
