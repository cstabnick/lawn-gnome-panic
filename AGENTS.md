# Working in this repo

Read [SOUL.md](SOUL.md) first. It sets the priorities: playable over polished, code over clicking, free assets only.

[AGENT_INDEX.md](AGENT_INDEX.md) maps every game, package, tool, doc, port and command. Use it to find things before searching, and update it when you add or remove one.

## Layout

- `games/<name>/`: one prototype per folder, each its own npm workspace (Vite + TypeScript + Phaser by default). `games/sample-dodge` is the reference example.
- `packages/`: shared code, only once two games need it. `packages/party` (`@lawn/party`) is the party-slice interface: its README holds the size rules and the slice backlog.
- `games/<name>/src/minigames/`: that game's party slices (`export const minigames`), if it has any. `games/gnome-party` finds them by itself. Plan: `docs/roadmaps/gnome-party.md`.
- Party-only games (`"lawn": { "partyOnly": true }` in package.json, e.g. `games/gnomylpics`) exist only to surface slices: not on the landing page, played inside Gnome Party. Make one with `npm run new -- <name> --party-only`.
- `tools/`: repo scripts, for example `tools/new-game.mjs`.
- `docs/stack.md`: which engine or library to reach for. `docs/assets.md`: where free assets come from and the license rules.
- `docs/roadmaps/`: plans written by the decompose skill.
- `docs/demos.md`: recording scripted MP4/GIF demos of a game, and embedding them in a PR description (`npm run demo -- <demo.json> --pr <n>`).
- `unity/`: Unity projects, if any. Driven from code and the command line, never by hand in the editor (see docs/stack.md).

## Toolchain (Windows)

- Node.js LTS is at `C:\Program Files\nodejs`. In Git Bash, if `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Install once from the repo root: `npm install` (workspaces share one `node_modules`).
- Run a game: `npm run dev -w games/<name>`. Type-check and build: `npm run build -w games/<name>`.
- New game from the sample: `npm run new -- <name>`.

## Rules

- `npm run build -w games/<name>` must pass before a change to that game is done.
- tsc does not catch runtime breakage (a module that hides the whole UI passed every type-check). With the dev server running, `bash tools/smoke.sh <url> <dom-marker>...` loads the page in headless Edge and reports console errors and missing elements. Run it at the end of every epic.
- UI modules get the shared `#ui` element as a parent: append your own container to it, never restyle or hide `#ui` itself.
- Do not edit a game other than the one you were asked to work on. Gnome Party is no exception: it never edits a game; games surface their own slices.
- Party slices, decided without asking:
  - Making a new game: if a party-sized round of it makes sense (see the size rules in `packages/party/README.md`), plan its slice as part of the game and build it with `npm run new-mini -- <game> <id>`. If it does not make sense yet, add a backlog row there saying why (or "later"). Do not force one.
  - Working on a game with no slice: if your change makes a slice easy and the backlog row says it fits, add it in the same plan. Do not go back and retrofit games you were not asked to touch.
  - A slice is built from the game's own modules. Where they are tangled in the game's `Ctx` or `main.ts`, refactor that once so the game and the slice call the same function. Never copy game code into a slice.
  - A game with `src/minigames/` must keep it working: `npm test -w games/<name>` (the slice contract test) passes along with the build, and `#minigame` still plays.
- Assets: CC0 or self-generated only. Every external file gets a line in that game's `CREDITS.md` (source URL, author, license).
- New objects go through the prefab library (`@lawn/prefabs`, see `packages/prefabs/README.md`). Whenever a change introduces a new thing to see, hold, pick up or examine (item, weapon, prop, furniture, container, pickup, scenery piece):
  - Use an existing prefab if one fits (browse with `npm run dev -w games/prefab-gallery`, or `resolvePrefab()` for emoji items). Build it with `buildPrefab` / `buildHeld` / `createDrop`, and use `prefabIcon` / `prefabIconElement` for its UI icon, including in 2D games.
  - If none fits, add a `PrefabDef` to the right file in `packages/prefabs/src/catalog/` (rules in `docs/roadmaps/prefab-library/_common.md`) and make `npm test -w packages/prefabs` pass. Adding a prefab is allowed alongside work on any game; it is shared code, not another game.
  - Do not hand-build one-off meshes or sprites for such objects inside a game. Characters, terrain and effects that a prefab cannot express stay in the game, and the PR says why.
- Player gnome by default: every game that shows a player character shows the player's own gnome from `@lawn/gnome` (made in `games/gnome-creator`; API and rules in `packages/gnome/README.md`). `await loadMyGnome()` at the top of `main.ts`, wear `getMyGnome()?.look` through `createGnomeModel` (3D) or its colours (hat, coat, skin, beard; 2D), send `getMyGnome()?.code` as the online `character`, and render other players with `resolveLook`. Fall back to the game's own look only when the player has no custom gnome. If the game gives the gnome its own gear, override that slot (`overrideEquipment` / `setEquipmentOverride`), never rebuild a separate gnome model. A game with no player character (match-3, viewers, tools) is exempt; say so in the PR. Do not hand-build a one-off gnome.
- Achievements in new games: when you make a new game (or add a feature to one), plan achievements for it as part of the work. Add `AchievementDef`s to `packages/achievements/src/catalog.ts`, each ideally with a cosmetic `reward` (a `@lawn/prefabs` gear item for the gnome's `head`, `back`, `neck` or `hand` slot, reusing a prefab if one fits, otherwise adding one per the prefab rule), call `createAchievementTracker({ game, ui })` and `unlock` / `increment` from the game's own events, and make `npm test -w packages/achievements` pass. Rewards show up on the gnome in every game and in the creator without more code. How: `packages/achievements/README.md`.
- Mobile by default: every game (new, or one you change) plays on a phone. Touch controls for every action (on-screen buttons or gestures, at least 44 px targets, no hover-only UI), a layout that fits a portrait and a landscape phone screen with safe-area insets, and no desktop-only keys without a touch equivalent. Check it at a phone viewport (e.g. 390x844) as well as desktop.
- Online by default, where it fits: plan multiplayer through `@lawn/mp` (see `packages/mp/README.md`: add the game to `GAMES`, one browser hosts, the server only relays). If online play doesn't fit the game yet, or would double its size, keep it single-player and say why in the PR description. Don't force it.

## Finishing work

Every task ends in a pull request; no need to ask.

1. Work on a branch, never the default branch.
2. When the build, tests and smoke check pass, commit (one commit per task or epic is fine), push the branch and open a pull request against the default branch.
3. The PR description says what changed, how to run it, what was tested (and what wasn't, e.g. no real device or browser to try), and whether the game supports mobile and online, or why not. For a visual change, embed a demo (`docs/demos.md`).
4. Workers (`haiku-worker`) never commit or open PRs: the planner does it once the epic's checks pass.

## Delegating work

This user's plan is small, so default to delegation: plan with the decompose skill, then run each issue with the `haiku-worker` agent, issues of one epic in parallel. Do small fixes yourself only when writing the issue would cost more than the fix.
