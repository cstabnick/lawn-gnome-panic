# Roadmap: Gnome Sweet Gnome

Goal: a gnome-themed match-3 in the style of a "makeover" puzzle game. Swap mushrooms, gems, acorns, daisies, clovers and berries; four in a row makes a lawnmower that mows its row or column, an L/T makes a seed bomb, a 2x2 makes a bumblebee, five makes a rainbow gem, and two specials swapped together combo. Goals: collect a kind, clear weeds, break stones, bring lost gnomes down. Leftover moves become a Gnome Rush of mowers, then fireworks, confetti and stars. Stars pay for a four-area gnome house makeover (three styles per item). Bots (random, greedy, smart) play every level many times so a deliberate sawtooth difficulty curve is measured and tested, like the Gnomomia balance sim.

Mobile: Phaser `Scale.RESIZE`, `levelLayout` puts the HUD above the board in portrait and beside it in landscape, safe-area insets, swipe or tap-tap to swap, every button >= 44 px.
Online: not planned. A match-3 with a house meta is a solo game; a head-to-head race would be its own mode and roughly double the size. Party slice: backlog row `gsg-swap-race`, later (Phaser game, needs a small Three view; the CPU would be the smart bot).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (planner) | config, engine types, rng, layout, save, house data, stubs for every module; `npm run build` passes | 0 (planner) |
| 2. Engine, art, house, levels | board + level rules with tests, all textures + title, fx + audio, house art, hub scene, 30 levels; build and `npm test` pass | 8, parallel |
| 3. Play screen and level assessment | board view, level scene, bots + `npm run assess` + curve test; build passes | 3, parallel |
| 4. Tune and ship (planner) | levels tuned with `npm run assess -- --tune` until `curve.test.ts` passes; phone + desktop check; demo; PR | 0 (planner) |

## File ownership

| Epic | Issue -> files |
|---|---|
| 2 | 2.1 `engine/board.ts`, `board.test.ts` · 2.2 `engine/game.ts`, `game.test.ts` · 2.3 `scenes/BootScene.ts`, `TitleScene.ts` · 2.4 `fx.ts`, `audio.ts` · 2.5 `house/houseArtOutdoor.ts` · 2.6 `house/houseArtIndoor.ts` · 2.7 `levels.ts`, `levels.test.ts` · 2.8 `scenes/HouseScene.ts`, `houseUi.ts` |
| 3 | 3.1 `view/BoardView.ts` (+ `pieceSprite.ts`) · 3.2 `scenes/LevelScene.ts` · 3.3 `sim/bots.ts`, `sim/assess.ts`, `scripts/assess.mjs`, `sim/*.test.ts` |

Dev-server ports per worker: 5280-5286.

---

### 2.1-board

~~~~text
Epic: 2 Engine, art, house, levels
Depends on: none

## Environment
Repo root `/home/user/lawn-gnome-panic` (Linux; node and npm on PATH; dependencies installed). Game: `games/gnome-sweet-gnome`, a gnome-themed match-3 (Vite + TypeScript strict + Phaser 4). Other workers are editing other files of this game at the same time: change only the files under Change. Do not commit. This issue is pure TypeScript: no Phaser, no DOM, no `Math.random` (use the `rng` passed in).

## Goal
`src/engine/board.ts` implements the match-3 board rules (matching, swaps, specials and their combos, stones, weeds, lost gnomes, gravity, refill, shuffle) as pure functions that return a list of `BoardEvent`s, with vitest tests.

## Read first
- `games/gnome-sweet-gnome/src/engine/types.ts`: `Board`, `Cell`, `Piece`, `Pos`, `LevelDef` (layout characters), `BoardEvent` (every event shape). Do not change this file.
- `games/gnome-sweet-gnome/src/engine/board.ts`: the stub. Keep every exported name and signature exactly.
- `games/gnome-sweet-gnome/src/engine/rng.ts`: `makeRng(seed)`, `randInt(rng, n)`, `pick(rng, items)`.

## Change
- `games/gnome-sweet-gnome/src/engine/board.ts`: implement every export. You may add exports; add these two:
  - `export function findGroups(b: Board): Group[]` and `export interface Group { cells: Pos[]; kind: TileKind; maxLine: number; hasH: boolean; hasV: boolean; square: boolean; lineDir: 'h' | 'v' | null }` (lineDir = direction of the longest run, null if the group is only a 2x2 square).
  - `export function hasValidSwap(b: Board): boolean`.
- `games/gnome-sweet-gnome/src/engine/board.test.ts` (new): vitest tests, listed under Done when.

## Rules (implement exactly)

Terms: a **plain tile** is a piece whose kind is a TileKind (`TILE_KINDS.includes(kind)`), with or without a special. A **power piece** has `special !== null` or `kind === 'prism'`. **Matchable** = plain tile (specials still match by their colour). Prism and gnome never match. A cell **holds a piece** only if `live && stone === 0 && piece`.

**createBoard(level, rng)**: layout = `level.layout ?? 8 rows of '........'`; rows = layout.length, cols = layout[0].length; kinds = `TILE_KINDS.slice(0, level.kinds)`. Per char: `#` live=false; `w`/`W` weeds 1/2; `s`/`S` stone 1/2 (no piece); `g` gnome piece (`kind: 'gnome'`); `.` normal. Every other live, non-stone, non-gnome cell gets a plain tile (special null) whose kind is re-rolled while it would complete a 3-run with the two cells to its left or the two above. Piece ids start at 1 and count up; `nextId` is the next free id. If the result has no valid swap, re-roll all plain tiles (up to 100 tries).

**findGroups(b)**: horizontal and vertical runs of >= 3 matchable pieces of the same kind, plus every 2x2 square of 4 matchable pieces of the same kind. Merge runs/squares that share a cell (union-find on cell index) into groups. Per group: `maxLine` = longest run (0 if none), `hasH` / `hasV` = contains a horizontal / vertical run of >= 3, `square` = contains a 2x2, `lineDir` = direction of the longest run.

**Special made by a group** (first that applies):
1. maxLine >= 5 -> `prism` (the piece becomes `{ kind: 'prism', special: null }`)
2. hasH && hasV -> `bomb`
3. maxLine === 4 -> `mowerH` if lineDir is 'h', `mowerV` if 'v'
4. square -> `bee`
5. otherwise none (a plain 3-match).
Where it appears: during cascade 0 of a swap, if the group contains the swap's destination `p` use `p`, else if it contains `a` use `a`; otherwise the group cell with the largest r, then the smallest c. Emit `clear` for the old piece there, then `specialCreated` with a NEW piece (new id; kind = group kind or 'prism'). A special or prism keeps its kind when created (bomb on a gem is `{ kind: 'gem', special: 'bomb' }`).

**isValidSwap(b, a, p)**: both inside, 4-neighbours (|dr|+|dc| === 1), both cells hold a piece. True if either is a power piece. Otherwise swap temporarily and return true if `findGroups` has a group containing a or p; swap back. Gnomes can be swapped like plain tiles (they just never match).

**resolveSwap(b, a, p, rng)**: if not valid return `[{type:'swap',a,b:p},{type:'swapBack',a,b:p}]` and leave b untouched. Else swap the pieces, emit `swap`, then let X = piece now at p, Y = piece now at a:
- both power pieces -> **combo** at p (below). Both are cleared (`clear` by 'special').
- one power piece -> fire it at its new position. A prism swapped with a plain tile of kind K clears the prism and every piece of kind K. A prism swapped with a gnome fires as "hit" (most common kind).
- none -> just run the cascade loop.
Then run the **cascade loop**, then the **shuffle check**.

**Firing a special at q** (emit `activate` `{at:q, special, cells, target?, cascade}`, then hit every cell in `cells`):
- `mowerH`: every cell of row q.r. `mowerV`: every cell of column q.c.
- `bomb`: the 3x3 square around q (clipped to the board).
- `bee`: q and its 4 neighbours, then a **target**: a random cell with stone > 0; if none, a random cell with weeds > 0 that holds a piece; if none, a random plain tile; never a cell already in the area. `cells` includes the target; `target` is set.
- `prism` hit by something (not swapped): kind = the most common TileKind on the board (ties: first in `b.kinds`); cells = the prism's cell + every cell holding that kind.
**Hitting a cell** (by 'special'): if stone > 0 and this stone was not hit yet this cascade step -> stone -= 1, emit `stone` {at, left}. Else if it holds a non-gnome piece -> emit `clear` (by 'special'), remove the piece, and if weeds > 0: weeds -= 1, emit `weeds` {at, left}. If the removed piece was a power piece other than the one firing, queue it to fire after the current area (chain reactions). Gnomes are never cleared.

**Combos** (swap of two power pieces, centred on p; emit `combo` {at:p, a: X's type, b: Y's type, cells, cascade} then hit the cells; a "type" is the special or 'prism'):
- prism + prism: every cell on the board.
- prism + special S of kind K: every plain tile of kind K without a special gets special S (mowers pick 'mowerH'/'mowerV' at random); emit `specialCreated` for each (same id, updated piece); clear the prism; then fire each of them and the original S.
- mower + mower: row p.r and column p.c.
- mower + bomb: rows p.r-1..p.r+1 and columns p.c-1..p.c+1 (whole rows and columns).
- bomb + bomb: the 5x5 square around p.
- bee + bee: fire three bees from p (each picks its own target).
- bee + mower or bee + bomb: the bee's plus around p, then the other special fires centred on the bee's target.

**Cascade loop** (cascade starts at 0; all events carry the current cascade):
1. Fire anything queued (the swap's power pieces at cascade 0).
2. `findGroups`; for each group emit `match` {cells, kind, cascade}, then for each cell: emit `clear` (by 'match'), remove the piece, weeds -1 with a `weeds` event, damage every 4-neighbour stone (once per stone per step, `stone` event), queue power pieces it held. Then create the group's special (see above). Fire the queue.
3. If nothing was cleared in steps 1-2, stop.
4. **Gravity**: per column, split into segments of consecutive live, non-stone cells. In each segment move pieces down to fill gaps (order kept), then fill the empty top cells with new random plain tiles (new ids, kind from `b.kinds`); `dropRows` of each new piece = number of empty cells that segment had. Emit one `fall` {cascade, moves (only pieces whose row changed), spawns}.
5. **Lost gnomes**: a gnome on a cell with no live cell below it in its column is saved: emit `gnomeSaved` {at, pieceId}, remove it, and run gravity again (another `fall`). Repeat until none.
6. Emit `cascadeEnd` {cascade}, cascade += 1, go to 1.

**Shuffle check** (after the loop): if `!hasValidSwap(b)`, shuffle the positions of all non-gnome pieces among their cells (Fisher-Yates with rng) until there are no groups and a valid swap exists (up to 100 tries; then give every plain tile a fresh random kind and try again). Emit `shuffle` {pieces: every piece's id and new position}.

**triggerAt(b, p, rng)**: if p holds a power piece: fire it at cascade 0 (clear it first), then the cascade loop and shuffle check; return the events. Otherwise `[]`.

**placeSpecial(b, p, s)**: p holds a plain tile with special null -> set `special = s` (or `kind = 'prism'` for 'prism'), keep the id, return the piece. Else null.

**listValidSwaps(b)**: every [a, right neighbour] and [a, lower neighbour] pair with `isValidSwap` true.

Keep it fast: the assessment bots call `resolveSwap` on cloned boards thousands of times. Use the flat `cells` array, avoid allocating per cell where easy. Target: one `resolveSwap` on an 8x8 board well under 0.2 ms.

## Contract
Exported signatures in the stub stay exactly as they are (`createBoard`, `cloneBoard`, `cellAt`, `isValidSwap`, `listValidSwaps`, `resolveSwap`, `triggerAt`, `placeSpecial`), plus `findGroups`, `Group`, `hasValidSwap`. Other workers import them now.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/gnome-sweet-gnome` passes (errors only in files you did not touch may come from other workers mid-edit; yours must be clean).
- `cd /home/user/lawn-gnome-panic/games/gnome-sweet-gnome && npx vitest run src/engine/board.test.ts` passes, with tests for:
  - createBoard: no groups at rest, a valid swap exists, layout chars applied (hole, weeds 2, stone 2, gnome), 50 seeds.
  - a swap making 3 in a row clears 3 and emits match, clear x3, fall, cascadeEnd; invalid swap returns exactly [swap, swapBack] and leaves the board deep-equal.
  - each special: 4 in a row -> mowerH, 4 in a column -> mowerV, L shape -> bomb, 2x2 -> bee, 5 in a row -> prism (build boards by hand; write a small helper in the test that makes a Board from strings like `'mgad...'`, m=mushroom g=gem a=acorn d=daisy c=clover b=berry).
  - mowerH fired clears its whole row; bomb clears 3x3; stone next to a match loses 1; weeds under a cleared tile lose 1; a gnome on the bottom row after a fall is saved.
  - fuzz: 300 random valid swaps across 10 seeds never throw, and after each one the board has no groups, every live non-stone cell holds a piece, all ids are unique, and a valid swap exists.

## Out of scope
Everything except `src/engine/board.ts` and `src/engine/board.test.ts`. In particular `src/engine/types.ts`, `src/engine/game.ts` (another worker), `package.json`.
~~~~

### 2.2-game

~~~~text
Epic: 2 Engine, art, house, levels
Depends on: none

## Environment
Repo root `/home/user/lawn-gnome-panic` (Linux; node and npm on PATH; dependencies installed). Game: `games/gnome-sweet-gnome`, a gnome-themed match-3 (Vite + TypeScript strict + Phaser 4). Other workers are editing other files of this game at the same time: change only the files under Change. Do not commit. Pure TypeScript: no Phaser, no DOM, no `Math.random` (use the `rng` passed in).

Another worker is implementing `src/engine/board.ts` right now; until they finish its functions are stubs (`resolveSwap` returns only swap events, `placeSpecial` returns null, `triggerAt` returns []). Write your code against the signatures, and write tests that do not depend on board.ts behaviour (feed hand-made events to `applyEvents`, build `LevelState` objects by hand).

## Goal
`src/engine/game.ts` implements one level's rules: start a level (goals, boosters), play a move (moves, score, goals, win/lose), star rating, the end-of-level Gnome Rush, and state cloning for the bots.

## Read first
- `games/gnome-sweet-gnome/src/engine/types.ts`: `LevelDef`, `GoalDef`, `GoalState`, `LevelState`, `BoardEvent`, `BoosterKind`, `TILE_KINDS`. Do not change it.
- `games/gnome-sweet-gnome/src/engine/game.ts`: the stub. Keep every exported name and signature.
- `games/gnome-sweet-gnome/src/engine/board.ts`: signatures of `createBoard`, `cloneBoard`, `resolveSwap`, `triggerAt`, `placeSpecial`, `cellAt` (read the doc comments; bodies are stubs).
- `games/gnome-sweet-gnome/src/config.ts`: `TUNING.scorePerTile`, `scoreSpecialMade`, `scoreGnomeSaved`, `scoreRushPerMove`. Importing config.ts is fine (it has no Phaser import).

## Change
- `games/gnome-sweet-gnome/src/engine/game.ts`:
  - `startLevel(level, rng, boosters = [])`: board = `createBoard(level, rng)`. Goals: one `GoalState` per `level.goals` entry: `collect` -> total = left = goal.count; `weeds` -> total = sum of `cell.weeds` over the board; `stones` -> sum of `cell.stone`; `gnomes` -> number of pieces with kind 'gnome'. movesLeft = level.moves, movesUsed 0, score 0, status 'playing', made all 0. Then each booster: pick a random cell holding a plain tile without a special (kind in TILE_KINDS, special null) and `placeSpecial` it: 'mower' -> 'mowerH' or 'mowerV' at random, 'bomb' -> 'bomb', 'prism' -> 'prism'.
  - `playSwap(s, a, b, rng)`: if status !== 'playing' return []. events = `resolveSwap(s.board, a, b, rng)`. If any event has type 'swapBack', return events unchanged (no move used). Else movesLeft -= 1, movesUsed += 1, `applyEvents(s, events)`, then status = 'won' if every goal has left === 0, else 'lost' if movesLeft <= 0. Return events.
  - `applyEvents(s, events)`: for every event: `clear` -> score += scorePerTile * (cascade + 1), and each `collect` goal with goal.kind === event.kind gets left -= 1 (not below 0); `specialCreated` -> score += scoreSpecialMade and `s.made[piece.special ?? 'prism'] += 1` (prism pieces have special null and kind 'prism'); `weeds` -> each 'weeds' goal left -= 1; `stone` -> each 'stones' goal left -= 1; `gnomeSaved` -> score += scoreGnomeSaved and each 'gnomes' goal left -= 1. Never below 0.
  - `starsFor(level, score, won)`: 0 if not won; else max(1, number of thresholds in level.stars that score >= ).
  - `gnomeRush(s, rng)`: only when status === 'won' (else []). For each move left (at most 15): pick a random plain tile cell without a special, `placeSpecial` it as 'mowerH' or 'mowerV' (random), and push `{ type: 'specialCreated', at, piece, cascade: 0 }`; add `TUNING.scoreRushPerMove` to the score per move. Set movesLeft = 0. Then repeat up to 60 times: find the first cell (row-major) holding a power piece (special !== null or kind 'prism'); if none stop; push `...triggerAt(s.board, pos, rng)`. If `triggerAt` returns [] for a power piece (stub) stop, to avoid an endless loop. Finally `applyEvents(s, rushEventsExcludingTheSpecialCreatedYouPushedYourself)` so rush clears add score (do not count the rush's own specialCreated as made/score). Return all rush events.
  - `addMoves`: keep as is.
  - `cloneState(s)`: deep copy: `board: cloneBoard(s.board)`, goals copied (each `{...g}`), made copied, level shared (read-only).
  - Add `export function goalsDone(s: Readonly<LevelState>): boolean` and `export function progress(s: Readonly<LevelState>): number` (sum over goals of (total - left) / sum of totals; 1 when totals sum to 0).
- `games/gnome-sweet-gnome/src/engine/game.test.ts` (new): vitest tests.

## Contract
Exports used by other workers now: `startLevel`, `playSwap`, `applyEvents`, `starsFor`, `gnomeRush`, `addMoves`, `cloneState`, `goalsDone`, `progress`. Signatures exactly as in the stub plus the two new ones above.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/gnome-sweet-gnome` passes for your files.
- `cd /home/user/lawn-gnome-panic/games/gnome-sweet-gnome && npx vitest run src/engine/game.test.ts` passes, testing: applyEvents (collect counts only its kind, never below 0, cascade score multiplier, gnomeSaved, weeds, stones, specialCreated counts `made` incl. prism); starsFor (0 when lost, 1 minimum on a win, 3 at the top threshold); playSwap ignores a swapBack result (moves unchanged) and does nothing when status is 'won'; addMoves turns 'lost' into 'playing'; cloneState returns a copy whose goals and made can change without touching the original; progress.
  For goal totals from a layout, build a LevelDef with `layout: ['wWs.', 'g...', '....', '....']`-style rows and check `startLevel` totals by reading `s.board` after creation only if `createBoard` is no longer the stub; otherwise skip that test with `it.skip` and say so in your report.

## Out of scope
`src/engine/board.ts` (another worker), `src/engine/types.ts`, every scene and view file, `package.json`.
~~~~

### 2.3-art-title

~~~~text
Epic: 2 Engine, art, house, levels
Depends on: none

## Environment
Repo root `/home/user/lawn-gnome-panic` (Linux; node and npm on PATH; dependencies installed). Game: `games/gnome-sweet-gnome`, a gnome-themed match-3 (Vite + TypeScript strict + Phaser 4.2.1, `Phaser.Scale.RESIZE`, so the canvas is the window size). Other workers are editing other files of this game at the same time: change only the files under Change. Do not commit. All art is generated in code (no image files). Phaser 4 differs from Phaser 3 in places: when unsure of a signature, grep `node_modules/phaser/types/phaser.d.ts`. Graphics calls that exist: `fillStyle(color, alpha)`, `fillRect`, `fillRoundedRect(x,y,w,h,radius)`, `fillCircle`, `fillEllipse(x,y,w,h)`, `fillTriangle`, `lineStyle(width,color,alpha)`, `strokeCircle`, `strokeRoundedRect`, `lineBetween`, `beginPath/moveTo/lineTo/closePath/fillPath/strokePath`, `fillPoints(points, closePath)`, `slice(x,y,r,start,end,anticlockwise)`, `generateTexture(key, w, h)`.

## Goal
BootScene draws every texture in `TEX` (bright, chunky, readable at 40 px on a phone, everything gnome/garden themed) and starts the Title scene; TitleScene is a flashy title screen ("Gnome Sweet Gnome") that goes to the House scene on tap.

## Read first
- `games/gnome-sweet-gnome/src/config.ts`: `TEX` (every key, its size and what it shows, in the comments), `COLORS.kind` (each tile kind's colour), `SCENES`, `FONT`, `COLORS`.
- `games/gnome-sweet-gnome/src/scenes/BootScene.ts`, `TitleScene.ts`: stubs to replace (keep the class names and `super(SCENES.boot)` / `super(SCENES.title)`).
- `games/gnome-sweet-gnome/src/audio.ts`: `playSfx('click')` (a stub right now; call it anyway).

## Change
- `games/gnome-sweet-gnome/src/scenes/BootScene.ts`: in `create()`, one `this.add.graphics()` reused (`g.clear()` between textures), draw and `generateTexture` every key in TEX at its listed size, then `g.destroy()` and `this.scene.start(SCENES.title)`. Art direction (each 64x64 tile fills ~56 px, a dark 2-3 px outline in a darker shade of its colour, a white highlight blob top-left so it looks glossy):
  - `tile.mushroom`: red toadstool cap (half-ellipse dome) with 3-4 white spots, cream stem.
  - `tile.gem`: blue faceted gem (hexagon/diamond with lighter top facets and a white sparkle). Gems are a tile; make it the shiniest.
  - `tile.acorn`: brown nut with a darker crosshatched cap and a stalk.
  - `tile.daisy`: 8 yellow petals around an orange centre.
  - `tile.clover`: four green heart-shaped leaves and a stem.
  - `tile.berry`: cluster of 3-4 purple berries with a small leaf.
  - `back.<kind>` (6 keys): a soft disc in `COLORS.kind[kind]`: concentric circles from alpha 0.15 at r=31 to 0.6 at r=18.
  - `mowerH`: a red push lawnmower seen from the side facing right (body, two black wheels, handle up-left, a grey blade guard). `mowerV`: the same mower seen from above facing up (body, 4 wheels, handle down). These are the funny tiles; make them read clearly.
  - `bomb`: a round dark-brown seed bomb with a green sprout and a lit fuse (orange/yellow spark).
  - `bee`: a round yellow/black striped bumblebee with white wings.
  - `prism`: a large rainbow gem (facets in red, orange, yellow, green, blue, purple) with white sparkles.
  - `gnome`: a lost gnome's head: peach face, white beard, big red pointy hat, two dot eyes.
  - `cellLight` / `cellDark`: 64x64 grass squares (0x8fd16a / 0x7cc45a) with a few darker blades, 6 px rounded corners.
  - `weeds1` / `weeds2`: tufts of dark green weeds with a brown patch, covering the cell edges; weeds2 thicker and with a second colour.
  - `stone1` / `stone2`: a grey garden stone filling the cell; stone2 whole with moss, stone1 with dark crack lines.
  - `mower`: 96x64 bigger version of the side-view mower facing right with motion lines behind it.
  - `spark` 8x8 white soft dot; `confetti` 10x6 white rect; `leaf` 10x6 green blade; `star` 48x48 yellow 5-point star with an orange outline; `starEmpty` 48x48 star outline in 0x6b5a7a; `coin` 32x32 gold coin with a darker rim and a "G" shape or shine; `rays` 256x256: 12 white wedge rays from the centre on transparent (use `slice` + `fillPath`, alpha 0.5).
  Put the drawing of each texture in its own small function in BootScene.ts (e.g. `drawMushroom(g)`) so the file stays readable.
- `games/gnome-sweet-gnome/src/scenes/TitleScene.ts`: background `COLORS.background`; tiles (random TEX.tile keys, the mower and the gem included) fall slowly and spin in the background, respawning at the top; the title "Gnome Sweet Gnome" in big text (`FONT`, `COLORS.accent` fill, thick dark stroke via `stroke` and `strokeThickness` style fields) with a looping scale "breathe" tween; a subtitle "Match mushrooms. Make over a gnome home."; a pulsing "Tap to play" line. Any `pointerdown` (or Space/Enter key) -> `playSfx('click')` and `this.scene.start(SCENES.house)`. Lay out from `this.scale.width/height` and re-layout on `this.scale.on('resize', fn)`; remove that listener on `this.events.once('shutdown', ...)`. Text size scales with `Math.min(width, height)` so it fits a 390x844 portrait phone and an 844x390 landscape phone.

## Contract
Texture keys and sizes exactly as in `TEX` in config.ts; other workers' scenes use them. Scene keys from `SCENES`.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/gnome-sweet-gnome` passes for your files.
- With `npm run dev -w games/gnome-sweet-gnome -- --port 5280` running, a Playwright screenshot at 390x844 and at 1280x800 (`node -e` script with `require('playwright').chromium.launch()`, wait 1500 ms, save to your scratch folder, not the repo) shows the title with falling tiles and no page errors (`page.on('pageerror')`). Also look at every texture once: the Phaser game is on `window.__game`, so `page.evaluate` can add an image per TEX key to the running Title scene (`__game.scene.getScene('Title').add.image(x, y, key)`) in a grid, then screenshot; delete any temp files afterwards. Stop the dev server when done.

## Out of scope
Every other file, especially `src/config.ts` (do not add keys), `src/main.ts`, `src/scenes/HouseScene.ts`, `src/scenes/LevelScene.ts`, `src/fx.ts`, `src/audio.ts`.
~~~~

### 2.4-fx-audio

~~~~text
Epic: 2 Engine, art, house, levels
Depends on: none

## Environment
Repo root `/home/user/lawn-gnome-panic` (Linux; node and npm on PATH; dependencies installed). Game: `games/gnome-sweet-gnome`, a gnome-themed match-3 (Vite + TypeScript strict + Phaser 4.2.1, `Phaser.Scale.RESIZE`). Other workers are editing other files of this game at the same time (one of them is drawing the textures in BootScene right now): change only the files under Change. Do not commit. No asset files: sound is WebAudio oscillators and noise, visuals use the generated textures named in `TEX`. Phaser 4 differs from Phaser 3 in places: when unsure, grep `node_modules/phaser/types/phaser.d.ts`. Known-good Phaser 4 calls: `scene.add.particles(x, y, textureKey, config)` returns a `ParticleEmitter` (config fields include `speed`, `angle`, `lifespan`, `scale: {start, end}`, `alpha: {start, end}`, `gravityY`, `tint`, `rotate`, `quantity`, `frequency`, `emitting: false`, `blendMode: 'ADD'`); `emitter.explode(count, x, y)`; `scene.tweens.add({ targets, x, y, scale, alpha, angle, duration, ease, yoyo, repeat, onComplete })`; `scene.cameras.main.shake(durationMs, intensity)`; `scene.cameras.main.flash(durationMs, r, g, b)`; `scene.time.delayedCall(ms, fn)`; `scene.add.text(x, y, str, { fontFamily, fontSize: '48px', color, stroke, strokeThickness, align })`; `obj.setDepth(n)`, `obj.setScrollFactor(0)`; `image.setTint(color)`; `image.setBlendMode(Phaser.BlendModes.ADD)`.

## Goal
`src/fx.ts` gives the game its juice (particles, confetti, fireworks, bouncy combo text, shakes, mower sweeps, prism beams, fly-to arcs, win rays) and `src/audio.ts` gives it bright, satisfying sound effects, both safe to call any number of times.

## Read first
- `games/gnome-sweet-gnome/src/fx.ts`: the stub; every exported signature and doc comment. Keep them exactly.
- `games/gnome-sweet-gnome/src/audio.ts`: the stub; keep its exports exactly.
- `games/gnome-sweet-gnome/src/config.ts`: `TEX` (spark, confetti, star, leaf, coin, rays, mower), `COLORS`, `FONT`, `SfxName`.
- `games/sample-dodge/src/audio.ts`: the repo's oscillator `tone()` pattern (AudioContext created lazily, resumed on use, every call wrapped in try/catch).

## Change
- `games/gnome-sweet-gnome/src/fx.ts`: implement every function. Requirements:
  - Everything is added at depth >= 1000 and cleans itself up (destroy particles and images when done; `scene.time.delayedCall` to destroy an emitter after its last particle's lifespan). Calling `burst` 50 times in one frame must not leak.
  - `burst`: one-shot emitter of `TEX.spark` tinted `color`, blendMode ADD, speed 120-320, lifespan 450 ms, scale 1.4 -> 0, plus 3-4 `TEX.star` at scale 0.3 for count >= 12.
  - `confetti`: emits `TEX.confetti` from above the top edge across the full width (`scene.scale.width`) for `durationMs`, random tints from `Object.values(COLORS.kind)`, gravityY 300, rotate 0-360, lifespan 3000.
  - `fireworks`: `count` rockets (small spark images tweening up from the bottom at staggered times over ~2 s), each exploding with `burst` of 40 in a random kind colour and a `flash` of alpha 0.12; call `playSfx('bomb', 1.5)` per explosion.
  - `floatText`: text with `FONT`, default size 48 (scaled by `Math.min(scene.scale.width, scene.scale.height) / 700`, at least 0.6), default colour `COLORS.accent`, dark stroke (strokeThickness size/8), centred origin; starts at scale 0, tweens to 1.15 with `Back.easeOut` then settles to 1, floats up 60 px and fades over `durationMs` (default 900); destroys itself.
  - `shake`: `cameras.main.shake`. `flash`: a full-screen rectangle (`scene.add.rectangle`, scroll factor 0) fading out.
  - `mowerSweep`: `TEX.mower` image from `from` to `to` (rotate it to face the direction of travel: `Math.atan2`), linear tween over `durationMs`, emitting `TEX.leaf` clippings behind it (an emitter that follows: `emitter.startFollow(image)`), `playSfx('mower')`; resolve and destroy at the end.
  - `beam`: a Graphics line from `from` to `to`, 10 px wide, drawn as 6 thin parallel lines in rainbow colours (or `color` if given and not white), fading over 250 ms.
  - `flyTo`: image of `texture` that travels along a quadratic arc (control point above the midpoint) from `from` to `to` (use a tween on a `{t: 0..1}` counter object and set x/y in `onUpdate`), scaling from `scale` to `scale * 0.6`; resolves on arrival.
  - `rays`: `TEX.rays` image tinted `color`, blendMode ADD, alpha 0.6, scale `scale`, rotating forever (`angle: 360, repeat: -1, duration 6000`). The caller destroys it.
  - `wait`: keep.
- `games/gnome-sweet-gnome/src/audio.ts`: implement `playSfx(name, pitch)`, `playMatch(cascade)`, `setMuted`, `isMuted` (persist muted in localStorage key `gnome-sweet-gnome.muted`, guarded by try/catch). One lazily created AudioContext and a master gain (0.5). Sounds (multiply all frequencies by `pitch`): swap = short soft blip; bad = low buzzy double "nuh-uh"; match = bright bell (sine + triangle an octave up); playMatch(c) = match at pitch `2 ** (Math.min(c, 8) * 2 / 12)` (rising whole tones per cascade); special = rising arpeggio of 3 notes; mower = a 0.35 s sawtooth "brrrm" with fast vibrato (an LFO on frequency); bomb = noise burst (AudioBuffer of random samples) through a lowpass sweeping down, plus a low sine thump; prism = shimmering fast arpeggio up two octaves; bee = buzzing square with vibrato; stone = short noise click with a highpass; weeds = soft noise swish; gnome = cheerful "yoo-hoo" two notes up; win = a fanfare (major arpeggio then a held chord, ~1.2 s); lose = descending sad trombone (3 notes, sawtooth, gliding down); star = high ding; coin = two quick high notes; build = a "ta-da" (two notes + sparkle noise); click = tiny tick. Never throw; do nothing when muted. Limit to about 24 sounds starting per second (drop extras) so a big cascade does not clip.

## Contract
Exported names and signatures exactly as in the two stubs. Other workers call them now.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/gnome-sweet-gnome` passes for your files.
- Run `npm run dev -w games/gnome-sweet-gnome -- --port 5281` and use Playwright (`require('playwright').chromium.launch()`, viewport 390x844) to open the page; the game is on `window.__game`. Wait 1500 ms, then in `page.evaluate` get a running scene (`__game.scene.getScenes(true)[0]`) and call your effects through it. Your module is not on window: load it with `await page.addScriptTag({ type: 'module', content: "import * as fx from '/src/fx.ts'; window.__fx = fx;" })` (Vite serves `/src/fx.ts`), then `__fx.confetti(scene)`, `__fx.fireworks(scene)`, `__fx.floatText(scene, 195, 400, 'Gnometastic!')`, `__fx.mowerSweep(scene, {x:0,y:400}, {x:390,y:400})`, `__fx.burst(scene, 195, 300, 0xff3b3b, 30)` and screenshot after 400 ms to your scratch folder. No `pageerror`. (The textures may still be stubs from another worker: if they do not exist yet Phaser shows a missing-texture box; that is fine.) Stop the server.

## Out of scope
Every other file, especially `src/config.ts` (do not add keys), `src/scenes/*`, `src/view/*`.
~~~~

### 2.5-house-art-outdoor

~~~~text
Epic: 2 Engine, art, house, levels
Depends on: none

## Environment
Repo root `/home/user/lawn-gnome-panic` (Linux; node and npm on PATH; dependencies installed). Game: `games/gnome-sweet-gnome`, a gnome-themed match-3 whose meta game is making over a gnome house with the stars you earn (Vite + TypeScript strict + Phaser 4.2.1). Other workers are editing other files of this game at the same time (one draws the other house areas in a sibling file): change only the files under Change. Do not commit. All art is code-drawn with Phaser Graphics (no image files). Graphics calls that exist in Phaser 4: `fillStyle(color, alpha)`, `fillRect`, `fillRoundedRect(x,y,w,h,radius)`, `fillCircle`, `fillEllipse(x,y,w,h)`, `fillTriangle`, `lineStyle(width,color,alpha)`, `strokeRect`, `strokeCircle`, `strokeRoundedRect`, `strokeEllipse`, `lineBetween`, `beginPath/moveTo/lineTo/closePath/fillPath/strokePath`, `arc`, `slice`, `fillPoints(points, closePath)`, `fillGradientStyle(tl, tr, bl, br, alpha)` + `fillRect`. When unsure, grep `node_modules/phaser/types/phaser.d.ts`.

## Goal
`src/house/houseArtOutdoor.ts` draws every item and backdrop of the house areas 'yard' (Front Yard) and 'cottage' (Mushroom Cottage): cartoon style, bright, chunky shapes with a darker outline, readable when the 1000x700 area is shown on a phone (about 0.37x scale).

## Read first
- `games/gnome-sweet-gnome/src/house/houseData.ts`: `AREAS`, the slots of your two areas: each slot's `art` key, centre `x, y`, size `w, h`, and its 3 `variants` (name + palette `[main, second, accent]`). Design space is `AREA_W x AREA_H` = 1000 x 700, origin top-left. Do not change this file.
- `games/gnome-sweet-gnome/src/house/artTypes.ts`: `DrawFn` and `BackdropFn`.
- `games/gnome-sweet-gnome/src/house/houseArt.ts`: how your `DRAW_OUTDOOR` and `BACKDROP_OUTDOOR` are merged and used (do not change it).
- `games/gnome-sweet-gnome/src/house/houseArtOutdoor.ts`: your stub.

## Change
- `games/gnome-sweet-gnome/src/house/houseArtOutdoor.ts`: fill `DRAW_OUTDOOR` with one `DrawFn` per art key: path, fence, flowerbed, mailbox, tree, roof, door, windows, chimney, lanterns; and `BACKDROP_OUTDOOR` with: yard, cottage. Each `DrawFn(g, x, y, w, h, colors)` draws the item centred on (x, y) filling about w x h, and must scale with w and h (the house screen also calls it at small sizes for the 3 variant preview cards), so compute every coordinate from x, y, w, h. Use `colors[0]` for the main surfaces, `colors[1]` for the second, `colors[2]` for accents, and darken a colour for outlines with a helper such as `darken(c, 0.6)` (multiply each RGB channel). Each `BackdropFn(g, done)` fills the whole 1000 x 700 design space.
  - `yard` backdrop: sky gradient (bands of blue), distant hills, a lawn from y=380 down, a few clouds; when done: a sun with rays and brighter grass.
  - `cottage` backdrop: sky + lawn as above and the cottage's body: a big cream mushroom-stem wall (rounded rectangle about x 300..700, y 300..620) on which the roof, door, windows and lanterns sit; when done: warm light and a few sparkles.
  - Slot hints: path = a winding path from the bottom edge up toward the centre made of stones/bricks (colors[0] main stones, colors[1] gaps, colors[2] details); fence = pickets across the whole width with pointy tops; flowerbed = soil mound with 5-7 flowers; mailbox = post + box + a little flag in colors[2]; tree = trunk (colors[1]) + 3-4 overlapping canopy circles (colors[0]) with a few fruit/blossom dots (colors[2]); roof = a huge mushroom cap (half-ellipse) in colors[0] with spots in colors[1]; door = round-top door with planks and a knob; windows = two round windows with frames and panes; chimney = a short stack with a puff of smoke; lanterns = two hanging lanterns on hooks either side of the door, glowing (an alpha 0.25 halo).
  Also export `export const ART_KEYS_OUTDOOR = [...]` listing your draw keys.

## Contract
`DRAW_OUTDOOR: Record<string, DrawFn>` and `BACKDROP_OUTDOOR: Record<string, BackdropFn>`, keys exactly as listed (they match `HouseSlot.art` / `HouseArea.backdrop` in houseData.ts).

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/gnome-sweet-gnome` passes for your file.
- Every `art` key of your two areas in houseData.ts is in `DRAW_OUTDOOR` and both backdrops are in `BACKDROP_OUTDOOR` (check with a quick script or by reading).
- Visual check: start `npm run dev -w games/gnome-sweet-gnome -- --port 5282`, open it with Playwright (`require('playwright').chromium.launch()`, viewport 1000x700), wait 1500 ms, then load your module with `await page.addScriptTag({ type: 'module', content: "import * as a from '/src/house/houseArtOutdoor.ts'; import { AREAS } from '/src/house/houseData.ts'; window.__art = a; window.__areas = AREAS;" })`, wait 500 ms, and in `page.evaluate` take the running scene (`window.__game.scene.getScenes(true)[0]`), add a Graphics at depth 5000, draw one of your backdrops with done=false and every slot of that area with variant 0 at its x, y, w, h; screenshot to your scratch folder; repeat for the other area and for variant 2 and done=true. Look at the screenshots and fix anything unreadable. Stop the server. Leave no files in the repo.

## Out of scope
Every other file, especially `houseData.ts`, `houseArt.ts`, `artTypes.ts`, the sibling `houseArtIndoor.ts` (another worker) and `src/scenes/HouseScene.ts` (another worker).
~~~~

### 2.6-house-art-indoor

~~~~text
Epic: 2 Engine, art, house, levels
Depends on: none

## Environment
Repo root `/home/user/lawn-gnome-panic` (Linux; node and npm on PATH; dependencies installed). Game: `games/gnome-sweet-gnome`, a gnome-themed match-3 whose meta game is making over a gnome house with the stars you earn (Vite + TypeScript strict + Phaser 4.2.1). Other workers are editing other files of this game at the same time (one draws the other house areas in a sibling file): change only the files under Change. Do not commit. All art is code-drawn with Phaser Graphics (no image files). Graphics calls that exist in Phaser 4: `fillStyle(color, alpha)`, `fillRect`, `fillRoundedRect(x,y,w,h,radius)`, `fillCircle`, `fillEllipse(x,y,w,h)`, `fillTriangle`, `lineStyle(width,color,alpha)`, `strokeRect`, `strokeCircle`, `strokeRoundedRect`, `strokeEllipse`, `lineBetween`, `beginPath/moveTo/lineTo/closePath/fillPath/strokePath`, `arc`, `slice`, `fillPoints(points, closePath)`, `fillGradientStyle(tl, tr, bl, br, alpha)` + `fillRect`. When unsure, grep `node_modules/phaser/types/phaser.d.ts`.

## Goal
`src/house/houseArtIndoor.ts` draws every item and backdrop of the house areas 'living' (Cozy Living Room) and 'kitchen' (Kitchen): cartoon style, bright, chunky shapes with a darker outline, readable when the 1000x700 area is shown on a phone (about 0.37x scale).

## Read first
- `games/gnome-sweet-gnome/src/house/houseData.ts`: `AREAS`, the slots of your two areas: each slot's `art` key, centre `x, y`, size `w, h`, and its 3 `variants` (name + palette `[main, second, accent]`). Design space is `AREA_W x AREA_H` = 1000 x 700, origin top-left. Do not change this file.
- `games/gnome-sweet-gnome/src/house/artTypes.ts`: `DrawFn` and `BackdropFn`.
- `games/gnome-sweet-gnome/src/house/houseArt.ts`: how your `DRAW_INDOOR` and `BACKDROP_INDOOR` are merged and used (do not change it).
- `games/gnome-sweet-gnome/src/house/houseArtIndoor.ts`: your stub.

## Change
- `games/gnome-sweet-gnome/src/house/houseArtIndoor.ts`: fill `DRAW_INDOOR` with one `DrawFn` per art key: rug, armchair, fireplace, bookshelf, lamp, table, stove, cupboard, curtains, pot; and `BACKDROP_INDOOR` with: living, kitchen. Each `DrawFn(g, x, y, w, h, colors)` draws the item centred on (x, y) filling about w x h, and must scale with w and h (the house screen also calls it at small sizes for the 3 variant preview cards), so compute every coordinate from x, y, w, h. Use `colors[0]` for the main surfaces, `colors[1]` for the second, `colors[2]` for accents, and darken a colour for outlines with a helper such as `darken(c, 0.6)` (multiply each RGB channel). Each `BackdropFn(g, done)` fills the whole 1000 x 700 design space.
  - `living` backdrop: a wallpapered back wall (stripes) down to y=520, a wooden floor below with plank lines, a skirting board, a round window high on the wall; when done: warm lamplight glow and a hanging picture.
  - `kitchen` backdrop: a tiled back wall (grid of squares) down to y=500, a checkered floor below; when done: brighter, with a garland of herbs.
  - Slot hints: rug = an oval rug with a border pattern; armchair = back, seat, two arms, little legs; fireplace = mantel + firebox with a fire (orange/yellow flames) + hearth; bookshelf = frame with 3 shelves of coloured books (vary heights; use colors[1] and colors[2] and darker shades); lamp = pole + base + a flower/mushroom-shaped shade with a glow halo; table = top + legs + a tablecloth in colors[1]; stove = body + oven door + 2 burners + a small flame; cupboard = 2 doors with knobs, plates visible on an open top shelf; curtains = a window (sky in colors[2]) with two curtains tied back; pot = a pot on top of the stove with bubbling stew and steam puffs.
  Also export `export const ART_KEYS_INDOOR = [...]` listing your draw keys.

## Contract
`DRAW_INDOOR: Record<string, DrawFn>` and `BACKDROP_INDOOR: Record<string, BackdropFn>`, keys exactly as listed (they match `HouseSlot.art` / `HouseArea.backdrop` in houseData.ts).

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/gnome-sweet-gnome` passes for your file.
- Every `art` key of your two areas in houseData.ts is in `DRAW_INDOOR` and both backdrops are in `BACKDROP_INDOOR` (check with a quick script or by reading).
- Visual check: start `npm run dev -w games/gnome-sweet-gnome -- --port 5283`, open it with Playwright (`require('playwright').chromium.launch()`, viewport 1000x700), wait 1500 ms, then load your module with `await page.addScriptTag({ type: 'module', content: "import * as a from '/src/house/houseArtIndoor.ts'; import { AREAS } from '/src/house/houseData.ts'; window.__art = a; window.__areas = AREAS;" })`, wait 500 ms, and in `page.evaluate` take the running scene (`window.__game.scene.getScenes(true)[0]`), add a Graphics at depth 5000, draw one of your backdrops with done=false and every slot of that area with variant 0 at its x, y, w, h; screenshot to your scratch folder; repeat for the other area and for variant 2 and done=true. Look at the screenshots and fix anything unreadable. Stop the server. Leave no files in the repo.

## Out of scope
Every other file, especially `houseData.ts`, `houseArt.ts`, `artTypes.ts`, the sibling `houseArtOutdoor.ts` (another worker) and `src/scenes/HouseScene.ts` (another worker).
~~~~

### 2.7-levels

~~~~text
Epic: 2 Engine, art, house, levels
Depends on: none

## Environment
Repo root `/home/user/lawn-gnome-panic` (Linux; node and npm on PATH; dependencies installed). Game: `games/gnome-sweet-gnome`, a gnome-themed match-3 (TypeScript strict). Other workers are editing other files of this game at the same time: change only the files under Change. Do not commit. This is data only: no Phaser, no DOM.

## Goal
`src/levels.ts` holds 30 hand-designed levels that introduce one mechanic at a time and follow a sawtooth difficulty curve, plus `targetFor(id)`, the intended win rate per level. (Move counts and star scores are first guesses: a later step tunes them with a simulation.)

## Read first
- `games/gnome-sweet-gnome/src/engine/types.ts`: `LevelDef` (every field; the layout characters `.` `#` `w` `W` `s` `S` `g`), `GoalDef`, `TILE_KINDS` (order: mushroom, gem, acorn, daisy, clover, berry; `kinds: n` uses the first n).
- `games/gnome-sweet-gnome/src/levels.ts`: the stub. Keep `LEVELS` and `targetFor` names and types.

## Change
- `games/gnome-sweet-gnome/src/levels.ts`:
  - `targetFor(id)`: `if (id <= 3) return 0.97; if (id % 10 === 0) return 0.4; if (id % 5 === 0) return 0.5; const base = 0.93 - 0.011 * (id - 3); if (id % 5 === 1) return Math.min(0.95, base + 0.08); return Math.round(base * 100) / 100;` (hard every 5th, super hard every 10th, a breather right after each hard one).
  - `LEVELS`: 30 `LevelDef`s, ids 1..30, `target: targetFor(id)` on each, garden-themed names ("Front Path", "Toadstool Lane", "Weedy Patch", "The Rockery", "Lost Gnome Hollow", ...). All layouts are 8 rows of 8 characters (or omit `layout` for a plain 8x8). Schedule:
    - 1-3: plain boards, `kinds: 4`, one `collect` goal (15-25 of one kind), moves 18-22. Level 1 collect 15 mushrooms in 20 moves.
    - 4-6: introduce weeds (`w`, a few `W` from 6) with a `weeds` goal; level 4 has a small 4x2 weeds patch in the middle. From 6, `kinds: 5`.
    - 7-9: introduce stones (`s`, `S` from 9) with a `stones` goal; stones sit in the lower half in small clusters, never so many that a column is cut off at the top.
    - 10: first super hard: weeds and a collect goal together, kinds 5.
    - 11-14: introduce lost gnomes (`g`, 1 to 3 gnomes in the top two rows) with a `gnomes` goal; no stones or holes below a gnome's column (a gnome is saved when no live cell is below it). Level 11 one gnome.
    - 15: hard: gnomes + weeds.
    - 16-19: introduce holes (`#`) for board shapes (heart, hourglass with a 2-wide waist, plus-shape, a ring); keep every live cell reachable by gravity from above within its column segment; mix with one other goal each.
    - 20: super hard: stones + collect, shaped board.
    - 21-29: mixes of two goals (collect + weeds, stones + gnomes, ...), `W` and `S` more common, `kinds: 6` on exactly 2 levels in 21-29, never on a hard one (6 kinds is much harder).
    - 30: super hard finale: three goals (weeds + stones + gnomes), shaped board, kinds 5.
  - Moves: start from about 20 + 2 per goal, +3 for each `S` cluster and gnome, and make hard levels (5/10/...) 3-5 moves tighter than their neighbours. Stars: `[moves * 60, moves * 120, moves * 190]` rounded to 50 (placeholder until tuning).
  - At the bottom, a self-check function `export function validateLevels(levels = LEVELS): string[]` that returns readable problems: ids not 1..n in order, layout not 8 strings of length 8 or with unknown characters, a `weeds` goal with no `w`/`W` in the layout (same for stones/`s` `S` and gnomes/`g`), a gnome with a hole or stone anywhere below it in its column, `kinds` outside 3..6, a `collect` kind beyond the level's kinds (`TILE_KINDS.indexOf(kind) >= kinds`), stars not increasing, target not equal to `targetFor(id)`.
- `games/gnome-sweet-gnome/src/levels.test.ts` (new): vitest: `expect(validateLevels()).toEqual([])` and `LEVELS.length === 30`, and `targetFor` values for ids 1, 5, 6, 10, 11 (expect 0.97, 0.5, 0.95, 0.4, and about 0.922 for id 11: use toBeCloseTo).

## Contract
`export const LEVELS: LevelDef[]`, `export function targetFor(id: number): number`, `export function validateLevels(levels?: LevelDef[]): string[]`.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/gnome-sweet-gnome` passes for your files.
- `cd /home/user/lawn-gnome-panic/games/gnome-sweet-gnome && npx vitest run src/levels.test.ts` passes.

## Out of scope
Every other file (the engine, `types.ts`, scenes).
~~~~

### 2.8-house-scene

~~~~text
Epic: 2 Engine, art, house, levels
Depends on: none

## Environment
Repo root `/home/user/lawn-gnome-panic` (Linux; node and npm on PATH; dependencies installed). Game: `games/gnome-sweet-gnome`, a gnome-themed match-3 (Vite + TypeScript strict + Phaser 4.2.1, `Phaser.Scale.RESIZE`: the canvas is the window size and changes on rotate). Other workers are editing other files of this game at the same time: the house art functions (`DRAW`, `BACKDROP` are empty stubs until they finish), the textures in BootScene, `fx.ts` and `audio.ts` (stubs that do nothing until they finish), and `levels.ts` (one level until it is filled). Code against the signatures; change only the files under Change. Do not commit. Phaser 4 differs from Phaser 3 in places: when unsure, grep `node_modules/phaser/types/phaser.d.ts`. Mobile first: every action is a tap on a target at least 44 px, nothing depends on hover or keys, and the layout fits a 390x844 portrait phone, an 844x390 landscape phone and a desktop, inside `safeRect` (safe-area insets).

## Goal
`src/scenes/HouseScene.ts` is the game's hub, in the style of a "makeover" match-3: it shows the current house area (messy where unbuilt), lets the player spend stars to build each item by picking one of three styles, celebrates finished areas, and has a big pulsing "Play Level N" button that opens a pre-level popup (goals, boosters) and starts the level.

## Read first
- `games/gnome-sweet-gnome/src/house/houseData.ts`: `AREAS`, `HouseArea`, `HouseSlot`, `AREA_W`/`AREA_H` (1000x700 design space), `currentArea`, `areaDone`.
- `games/gnome-sweet-gnome/src/house/houseArt.ts`: `DRAW[slot.art](g, x, y, w, h, variant.colors)`, `BACKDROP[area.backdrop](g, done)`, `drawJunk(g, x, y, w, h)`. Guard: if a key is missing (stubs), draw a coloured rounded rect instead.
- `games/gnome-sweet-gnome/src/save.ts`: `loadSave`, `updateSave`, `SaveData` (level, stars, coins, house, boosters, best).
- `games/gnome-sweet-gnome/src/config.ts`: `SCENES`, `TEX` (star, coin, tile.*, mowerH, bomb, prism), `COLORS`, `FONT`, `TUNING.boosterCost`, `LevelSceneData`, `HouseSceneData`.
- `games/gnome-sweet-gnome/src/layout.ts`: `safeRect(w, h)`, `fitBox(rect, dw, dh)`.
- `games/gnome-sweet-gnome/src/fx.ts` and `src/audio.ts`: the function signatures (`burst`, `confetti`, `fireworks`, `floatText`, `flyTo`, `rays`, `playSfx`).
- `games/gnome-sweet-gnome/src/levels.ts`: `LEVELS` (id, name, moves, goals).

## Change
- `games/gnome-sweet-gnome/src/scenes/HouseScene.ts` (keep the class name and `super(SCENES.house)`). You may split helpers into `src/scenes/houseUi.ts` (new) if the file grows past ~400 lines.
  - `init(data: HouseSceneData)`: remember it. `create()`: build everything from `this.scale.width/height`; on `this.scale.on('resize', ...)` destroy and rebuild the layout (keep state in fields); remove the listener on `this.events.once('shutdown', ...)`.
  - **Top bar** (inside `safeRect`): star counter (TEX.star + number) and coin counter (TEX.coin + number) as pills, the area name and progress ("Front Yard 2/5"), and a mute toggle (44 px; `setMuted(!isMuted())`, label "♪" / "×").
  - **Area view**: a Container positioned and scaled with `fitBox(areaRect, AREA_W, AREA_H)` where areaRect is the space between the top bar and the bottom button (portrait), or the left ~68 % (landscape, the button and client panel on the right). Inside: one Graphics for the backdrop, one Graphics per slot. Built slot (`save.house[slot.id]` is a variant index): `DRAW[slot.art]` with that variant's colors. Unbuilt: `drawJunk`, plus a pulsing dashed/glow outline of the slot rect and a badge at the slot centre showing "★ cost" (a star image and the number, kept readable: badges are drawn outside the scaled container or counter-scaled so they stay >= 44 px).
  - **Taps** on the area: convert the pointer to design space (`(pointer.x - box.x) / box.scale`), find the topmost slot whose rect (x±w/2, y±h/2) contains it. Unbuilt and `stars >= cost` -> open the **style picker**; unbuilt and not enough -> `floatText` "Need N more ★ - play a level!" and wiggle the Play button. Built -> open the style picker for a free restyle.
  - **Style picker**: a modal panel (dim the rest; tap outside closes) with the slot name and 3 cards, each a mini preview (`DRAW[slot.art]` drawn into a small Graphics at card size) and the variant name; tapping a card: if building, `updateSave(s => { s.stars -= cost; s.house[id] = i; })`; if restyling, just set the variant. Then close, redraw that slot, `burst` dust + sparkles at the slot, `playSfx('build')`, a short scale "pop" tween on the slot Graphics. If that completed the area: `confetti`, `fireworks(this, 5)`, `playSfx('win')`, a banner "<Area> complete!" with `rays` behind it, the client's `after` line, `+reward` coins (`updateSave` coins += reward, coins `flyTo` the counter); tap the banner to continue to the next area (rebuild the view). When `currentArea(save.house)` is null: show the last area finished and a "Whole house made over! More levels soon." banner.
  - **Client panel**: the area's `client` name and a speech bubble with `before` (or `after` once done), next to a small gnome drawn with Graphics (red hat triangle, peach face, white beard).
  - **Play button**: big rounded button (min 64 px tall, `COLORS.button`, pulsing scale tween) "Play Level N" with N = `min(save.level, LEVELS.length)`. Tap -> **pre-level popup**: level name, its goals as icons with counts (collect: `TEX.tile[kind]` + count; weeds: `TEX.weeds2`; stones: `TEX.stone2`; gnomes: `TEX.gnome`), moves, and 3 booster toggles (mower: `TEX.mowerH`, bomb: `TEX.bomb`, prism: `TEX.prism`), each showing the owned count, or the coin price `TUNING.boosterCost` when none are owned; a toggle is selectable only if owned > 0 or coins >= price. "Play!" -> spend (owned -1, else coins -price) with `updateSave`, then `this.scene.start(SCENES.level, { levelId, boosters } satisfies LevelSceneData)`. A close "×" button.
  - **Coming back from a win** (`data.wonLevel`): after building the view, `floatText` "+N ★" and fly `starsEarned` star images (`flyTo`, staggered 120 ms) from the screen centre to the star counter, `playSfx('star')` each, then update the counter; same for coins. The stars are already in the save (the Level scene adds them); only animate.
- Everything that draws text uses `FONT`, with sizes scaled by `Math.min(width, height)` and never below 14 px.

## Contract
Scene key `SCENES.house`; starts the level with `this.scene.start(SCENES.level, { levelId: number, boosters: BoosterKind[] })`; reads `HouseSceneData` from `init`. Uses the save fields exactly as in `save.ts`.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/gnome-sweet-gnome` passes for your files.
- With `npm run dev -w games/gnome-sweet-gnome -- --port 5284`, a Playwright script (`require('playwright').chromium.launch()`) opens `http://localhost:5284/#reset`, waits 1500 ms, starts your scene directly with `page.evaluate(() => { const g = window.__game; g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key)); g.scene.start('House'); })`, waits 800 ms and screenshots at 390x844, 844x390 and 1280x800 (to your scratch folder). No `pageerror`. Then sets `localStorage['gnome-sweet-gnome.save.v1'] = JSON.stringify({ level: 3, stars: 5, coins: 300, house: {}, boosters: { mower: 1, bomb: 0, prism: 0 }, best: {} })`, restarts the scene, taps the first slot's badge (`page.mouse.click`) and screenshots the style picker, taps a card and screenshots the built item, taps Play and screenshots the popup. Look at every screenshot: nothing overlaps or runs off screen at any size. Stop the server; leave no files in the repo.

## Out of scope
Every other file: `houseData.ts`, `houseArt*.ts` (other workers), `save.ts`, `config.ts` (do not add keys), `fx.ts`, `audio.ts`, `LevelScene.ts`, `main.ts`.
~~~~

### 3.1-board-view

~~~~text
Epic: 3 Play screen and level assessment
Depends on: none

## Environment
Repo root `/home/user/lawn-gnome-panic` (Linux; node and npm on PATH; dependencies installed). Game: `games/gnome-sweet-gnome`, a gnome-themed match-3 (Vite + TypeScript strict + Phaser 4.2.1, `Phaser.Scale.RESIZE`). The engine (`src/engine/board.ts`, `game.ts`), textures (BootScene), `fx.ts` and `audio.ts` are done. Another worker is writing `src/scenes/LevelScene.ts` right now against this file's public API; a third is writing `src/sim/*`. Change only the files under Change. Do not commit. Phaser 4 differs from Phaser 3 in places: when unsure, grep `node_modules/phaser/types/phaser.d.ts`. Mobile first: swipe and tap both work, targets are board cells (>= 40 px on a 390 px wide phone).

## Goal
`src/view/BoardView.ts` draws a `Board`, turns swipes and taps into swap requests, and animates every `BoardEvent` with a lot of juice (pops, particles, mowers driving across rows, bomb shockwaves, rainbow beams, a buzzing bee, cascading combo callouts, screen shake), then resyncs exactly to the board.

## Read first
- `games/gnome-sweet-gnome/src/view/BoardView.ts`: the stub; keep the class name, constructor, and every public member's signature exactly.
- `games/gnome-sweet-gnome/src/engine/types.ts`: `Board`, `Cell`, `Piece`, `Pos`, `BoardEvent` (all event shapes and what they mean).
- `games/gnome-sweet-gnome/src/engine/board.ts`: `cellAt`, `listValidSwaps` (for the idle hint).
- `games/gnome-sweet-gnome/src/fx.ts`: `burst`, `floatText`, `shake`, `flash`, `mowerSweep`, `beam`, `flyTo`, `wait`.
- `games/gnome-sweet-gnome/src/config.ts`: `TEX` (tile, back, mowerH, mowerV, bomb, bee, prism, gnome, cellLight, cellDark, weeds1, weeds2, stone1, stone2), `COLORS.kind`, `TUNING.swapMs`, `clearMs`, `fallMsPerRow`, `hintAfterMs`, `COMBO_WORDS`.
- `games/gnome-sweet-gnome/src/audio.ts`: `playSfx(name, pitch)`, `playMatch(cascade)`.

## Change
- `games/gnome-sweet-gnome/src/view/BoardView.ts`:
  - **Layers** (one Container each, in this order, all positioned at `rect.x, rect.y`): cells (alternating `cellLight`/`cellDark` checker, nothing for `live === false`), weeds (`weeds1`/`weeds2` by `cell.weeds`), stones (`stone1`/`stone2`), pieces, fx. Every image is sized with `setDisplaySize(cell, cell)` (pieces at 0.9 cell). Cell (r, c) centre is `(c + 0.5) * cell, (r + 0.5) * cell` inside the containers; `cellCenter(p)` returns screen coordinates (add rect.x/y).
  - **Pieces**: `Map<number, Phaser.GameObjects.Container>` keyed by `Piece.id`. A piece container holds: for a plain tile without special, `TEX.tile[kind]`; for a special, `TEX.back[kind]` + the special's texture (`mowerH`, `mowerV`, `bomb`, `bee`) + a small `TEX.tile[kind]` badge in the corner at 0.35 scale, with a gentle looping glow/scale pulse; prism: `TEX.prism` slowly rotating hue (cycle `setTint` through `Object.values(COLORS.kind)` every 200 ms or a rotating angle wobble); gnome: `TEX.gnome` with a small idle bob.
  - **Resync** (`private resync(board)`, also called at the end of `play` and from the constructor and `layout`): rebuild cells/weeds/stones layers; for pieces, destroy sprites whose id is gone, create missing ones, and rebuild any whose kind/special changed (keep a `{kind, special}` record per id), then snap all to their cell positions.
  - **Input**: pointer down on a cell holding a piece selects it (scale 1.12 + a white glow ring); drag past 0.35 cell in a mostly-horizontal or vertical direction -> `this.onSwap(a, neighbour)` once; or tap a selected piece's 4-neighbour -> `onSwap`; tapping elsewhere changes the selection. Out-of-board neighbours are ignored. Ignore all input while `setInputEnabled(false)` or while `play` runs. Use one scene-level `pointerdown`/`pointermove`/`pointerup` set, removed in `destroy()`.
  - **Idle hint**: after `TUNING.hintAfterMs` with input enabled and no touch, wiggle the two pieces of `listValidSwaps(board)[0]` (small rotate yoyo) until the next touch.
  - **play(events, board, speed = 1)**: returns a Promise. All durations are divided by `speed` (the Gnome Rush plays at 2.5). Walk the events in order, awaiting tweens via a helper `tweenP(config): Promise<void>` (resolves in `onComplete`). Per event:
    - `swap`: tween both piece sprites to each other's cells over `swapMs` (`Sine.easeInOut`), `playSfx('swap')`. `swapBack`: tween back, `playSfx('bad')`, a small horizontal shake of the two.
    - `match`: `playMatch(cascade)`; brief white flash of the matched sprites (scale up 1.2).
    - `clear`: pop the sprite (scale 1.3 then 0, alpha 0, over `clearMs`, `Back.easeIn`), `burst(cellCenter, COLORS.kind[kind] ?? 0xffffff, 14)`, remove it from the map. Do not await each clear: start all clears of one group together and await the last (collect promises until the next non-clear event).
    - `specialCreated`: create the new sprite at `at` with a pop-in (scale 0 -> 1.25 -> 1), `playSfx('special')`, `burst` gold sparks, `floatText` small label at the cell ("Mower!", "Seed Bomb!", "Bee!", "Rainbow Gem!").
    - `activate`: mowerH/mowerV: `mowerSweep` from just outside one end of the row/column to the other (screen coords from `cellCenter`), `playSfx` is inside mowerSweep; `shake(0.004)`. bomb: `playSfx('bomb')`, `shake(0.012, 220)`, `flash(0xffd23f, 0.25)`, an expanding ring Graphics (circle stroke growing to 2 cells and fading) at `at`. bee: `playSfx('bee')`, `flyTo(TEX.bee, at, target)` along an arc. prism: `playSfx('prism')`, `beam` from `at` to each cell in `cells` (at most 20), `flash(0xffffff, 0.3)`. Await the sweep / flight so clears follow it.
    - `combo`: `floatText` "COMBO!" big, `shake(0.016, 300)`, `flash(0xffffff, 0.4)`, then the visual of the stronger one (prism > bomb > mower > bee) as above, scaled up (ring to 3.5 cells).
    - `weeds`: set the weeds image for that cell (or remove it at 0) with a puff of `TEX.leaf` (`burst` green 0x4fd65a), `playSfx('weeds')`.
    - `stone`: crack/pop: swap to `stone1` or remove at 0, grey `burst` 18, `shake(0.003)`, `playSfx('stone')`.
    - `gnomeSaved`: the gnome sprite jumps up 1.5 cells and spins away to the top of the screen while fading, `playSfx('gnome')`, `floatText` "Saved!" green.
    - `fall`: tween every moved sprite from `from` to `to`; create each spawn sprite at `dropRows` cells above `to` and tween it down; duration per piece `fallMsPerRow * rowsFallen` (min 1 row), `Bounce.easeOut`; await all.
    - `shuffle`: `floatText` "Shuffle!"; tween every listed sprite to its new cell over 350 ms.
    - `cascadeEnd`: if `cascade >= 1` show `COMBO_WORDS[min(cascade, COMBO_WORDS.length - 1)]` with `floatText` at the board centre, bigger for bigger cascades (size 40 + 10 * cascade), colour cycling through `COLORS.kind`; for cascade >= 3 also `shake(0.006)` and a confetti-like `burst` of 40 at the centre.
    - At the end: `resync(board)` so the sprites match the board exactly even if an animation was skipped.
  - `layout(rect, cell)`: store, move the layer containers, `resync`.
  - `destroy()`: remove listeners, destroy containers and timers.
- If the file grows past ~500 lines, move piece-sprite building into `src/view/pieceSprite.ts` (new; `export function makePieceSprite(scene, piece, cell): Phaser.GameObjects.Container`).

## Contract
Public API exactly as in the stub: `constructor(scene, board, rect, cell)`, `onSwap: (a: Pos, b: Pos) => void`, `layout(rect, cell)`, `setInputEnabled(on)`, `play(events, board, speed = 1): Promise<void>`, `cellCenter(p): {x, y}`, `destroy()`. The Level scene calls these.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/gnome-sweet-gnome` passes for your files.
- Visual check with a throwaway driver (not in the repo): run `npm run dev -w games/gnome-sweet-gnome -- --port 5285`, open with Playwright (run the script with `NODE_PATH=/opt/node-tools/node_modules node script.js` so `require("playwright")` resolves; `chromium.launch()`, viewport 390x844), wait 1500 ms, then `page.addScriptTag({ type: 'module', content: "import { BoardView } from '/src/view/BoardView.ts'; import * as B from '/src/engine/board.ts'; import { makeRng } from '/src/engine/rng.ts'; import { LEVELS } from '/src/levels.ts'; window.__bv = { BoardView, B, makeRng, LEVELS };" })`. In `page.evaluate`: take the running scene (`window.__game.scene.getScenes(true)[0]`), create a board for `LEVELS[3]` (has weeds) with `makeRng(1)`, a `BoardView` at rect `{x: 11, y: 250, w: 368, h: 368}`, cell 46, `onSwap = async (a, b) => { const ev = B.resolveSwap(board, a, b, rng); await view.play(ev, board); }`. Call `view.onSwap(...B.listValidSwaps(board)[0])`, screenshot mid-animation (after 150 ms) and after 2 s; also put a `mowerH` on a tile with `B.placeSpecial`, call `B.triggerAt` and play it, screenshot mid-sweep. Use `page.mouse` to drag a piece one cell and check `onSwap` fires. No `pageerror`. Stop the server; leave no files in the repo.

## Out of scope
Every other file: `src/scenes/LevelScene.ts` (another worker), the engine, `fx.ts`, `audio.ts`, `config.ts` (do not add keys), `src/sim/*`.
~~~~

### 3.2-level-scene

~~~~text
Epic: 3 Play screen and level assessment
Depends on: none

## Environment
Repo root `/home/user/lawn-gnome-panic` (Linux; node and npm on PATH; dependencies installed). Game: `games/gnome-sweet-gnome`, a gnome-themed match-3 with a house-makeover hub (Vite + TypeScript strict + Phaser 4.2.1, `Phaser.Scale.RESIZE`: the canvas is the window size and changes on rotate). The engine, textures, `fx.ts`, `audio.ts`, the levels and the House hub are done. Another worker is writing `src/view/BoardView.ts` right now (until they finish it is a stub that draws nothing and whose `play()` resolves at once); code against its public API. A third worker is writing `src/sim/*`. Change only the files under Change. Do not commit. Phaser 4 differs from Phaser 3 in places: when unsure, grep `node_modules/phaser/types/phaser.d.ts`. Mobile first: every button >= 44 px, no hover, no key needed; layout fits 390x844 portrait, 844x390 landscape and desktop inside the safe area.

## Goal
`src/scenes/LevelScene.ts` plays one level: HUD (moves, goals, score bar with 3 stars), the board, the move loop, the flashy win sequence (Gnome Rush, fireworks, confetti, stars, "GNOMETASTIC!"), the lose popup (+5 moves for coins, or give up), and saving progress.

## Read first
- `games/gnome-sweet-gnome/src/scenes/LevelScene.ts`: the stub (keep class name and `super(SCENES.level)`).
- `games/gnome-sweet-gnome/src/view/BoardView.ts`: public API: `new BoardView(scene, board, rect, cell)`, `onSwap`, `layout(rect, cell)`, `setInputEnabled(on)`, `play(events, board, speed)`, `cellCenter(p)`, `destroy()`.
- `games/gnome-sweet-gnome/src/engine/game.ts`: `startLevel(level, rng, boosters)`, `playSwap(s, a, b, rng)`, `gnomeRush(s, rng)`, `starsFor(level, score, won)`, `addMoves(s, n)`, `goalsDone`.
- `games/gnome-sweet-gnome/src/engine/types.ts`: `LevelState`, `GoalState`, `GoalDef`, `BoardEvent`.
- `games/gnome-sweet-gnome/src/layout.ts`: `levelLayout(w, h, rows, cols)` -> `{ portrait, hud, board, cell }`, `safeRect`.
- `games/gnome-sweet-gnome/src/config.ts`: `SCENES`, `TEX`, `COLORS`, `FONT`, `TUNING` (coinsPerWin, coinsPerStar, extraMovesCost, extraMoves), `LevelSceneData`, `HouseSceneData`.
- `games/gnome-sweet-gnome/src/save.ts`: `loadSave`, `updateSave`.
- `games/gnome-sweet-gnome/src/fx.ts`, `src/audio.ts`: function names (`confetti`, `fireworks`, `floatText`, `flyTo`, `rays`, `burst`, `shake`, `flash`, `wait`; `playSfx`).
- `games/gnome-sweet-gnome/src/levels.ts`: `LEVELS`.

## Change
- `games/gnome-sweet-gnome/src/scenes/LevelScene.ts`:
  - `init(data: LevelSceneData)`; `create()`: `level = LEVELS[data.levelId - 1] ?? LEVELS[0]`, `rng = makeRng(Date.now() >>> 0)` (from `src/engine/rng.ts`), `state = startLevel(level, rng, data.boosters)`. Layout from `levelLayout(this.scale.width, this.scale.height, state.board.rows, state.board.cols)`; `this.scale.on('resize', ...)` re-lays out the HUD and calls `boardView.layout`; remove the listener and `boardView.destroy()` on `this.events.once('shutdown', ...)`.
  - A soft background: `COLORS.background` plus a few large slow-drifting translucent circles in kind colours (cheap, behind everything).
  - **HUD** (in `layout.hud`; stacked in portrait, a column in landscape): back button "‹" (44 px, top-left; asks "Give up this level?" with Yes/No; Yes -> house scene, no penalty); level name; a big moves counter in a circle (turns red and pulses at <= 5); a goals row: per goal an icon (`collect`: `TEX.tile[kind]`; `weeds`: `TEX.weeds2`; `stones`: `TEX.stone2`; `gnomes`: `TEX.gnome`) with `left` beneath, which pops (scale tween) and shows a green check when it hits 0; a score bar that fills toward `level.stars[2]` with 3 `TEX.starEmpty` markers at the thresholds that turn into `TEX.star` with a `burst` and `playSfx('star')` when passed.
  - **Move loop**: `boardView.onSwap = (a, b) => this.trySwap(a, b)`. `trySwap`: if busy or status !== 'playing' return; busy = true; `setInputEnabled(false)`; events = `playSwap(state, a, b, rng)`; for each `clear` event whose kind is a collect goal's kind, fly a small copy of `TEX.tile[kind]` from `boardView.cellCenter(at)` to that goal icon (`flyTo`, do not await; at most 8 per move); likewise `weeds`/`stone`/`gnomeSaved` events fly their icon. `await boardView.play(events, state.board)`; update the HUD; then: status 'won' -> `win()`; 'lost' -> `lose()`; else re-enable input, busy = false.
  - **win()**: `playSfx('win')`; a banner "Level Complete!" slams in; if moves are left: `floatText` "GNOME RUSH!" and `await boardView.play(gnomeRush(state, rng), state.board, 2.5)` while the score counts up; then the **win screen**: dim overlay, `rays` behind 3 star slots, stars = `starsFor(level, state.score, true)`; each earned star flies in one after the other (scale 0 -> 1.4 -> 1, `playSfx('star')`, `burst`), `fireworks(this, 8)`, `confetti(this, 3000)`, a big rotating-in word from ["GNOMETASTIC!", "GNOMENAL!", "GNOME RUN!", "GNOMEWORK DONE!"], the score, and "+N ★" / "+M coins" where coins = `TUNING.coinsPerWin + stars * TUNING.coinsPerStar`. Save before showing the button: `updateSave(s => { const prev = s.best[level.id] ?? 0; s.stars += Math.max(0, stars - prev); s.best[level.id] = Math.max(prev, stars); s.coins += coins; if (s.level === level.id) s.level = level.id + 1; })` (replaying a level only gives the stars you did not have yet). "Continue" button -> `this.scene.start(SCENES.house, { wonLevel: level.id, starsEarned, coinsEarned } satisfies HouseSceneData)`.
  - **lose()**: `playSfx('lose')`; popup "Out of moves!" showing the goals still left, a "+5 moves (90 coins)" button (`TUNING.extraMoves`, `TUNING.extraMovesCost`; disabled look when coins are short) -> `updateSave` coins -= cost, `addMoves(state, TUNING.extraMoves)`, close, re-enable input; and a "Give up" button -> house scene.
  - Pressing Escape opens the same give-up question (desktop nicety only).
- Text sizes from `Math.min(width, height)`, never below 14 px; nothing overlaps at 390x844, 844x390 or 1280x800.

## Contract
Scene key `SCENES.level`, data `LevelSceneData` in, `HouseSceneData` out. Save fields as in `save.ts`. BoardView API as above.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/gnome-sweet-gnome` passes for your files.
- With `npm run dev -w games/gnome-sweet-gnome -- --port 5286`, a Playwright script (run the script with `NODE_PATH=/opt/node-tools/node_modules node script.js` so `require("playwright")` resolves; `chromium.launch()`) opens `http://localhost:5286/#reset`, waits 1500 ms, starts the scene directly: `page.evaluate(() => { const g = window.__game; g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key)); g.scene.start('Level', { levelId: 4, boosters: ['bomb'] }); })`, waits 1000 ms and screenshots at 390x844, 844x390 and 1280x800 (scratch folder). No `pageerror`. To see the win and lose screens, call your scene's `win()` / `lose()` through `page.evaluate(() => window.__game.scene.getScene('Level').win())` (make both methods public) and screenshot after 2500 ms. The board itself may be empty if BoardView is still a stub; the HUD and popups must look right. Stop the server; leave no files in the repo.

## Out of scope
`src/view/BoardView.ts` (another worker), `src/sim/*`, the engine, `HouseScene.ts`, `config.ts` (do not add keys), `save.ts`, `main.ts`.
~~~~

### 3.3-assess

~~~~text
Epic: 3 Play screen and level assessment
Depends on: none

## Environment
Repo root `/home/user/lawn-gnome-panic` (Linux; node and npm on PATH; dependencies installed, including `esbuild` and `vitest` at the root). Game: `games/gnome-sweet-gnome`, a gnome-themed match-3. The pure engine (`src/engine/*`) and the 30 levels (`src/levels.ts`) are done. Other workers are writing `src/view/BoardView.ts` and `src/scenes/LevelScene.ts` right now; change only the files under Change. Do not commit. Pure TypeScript in `src/sim/`: no Phaser, no DOM; all randomness from `makeRng` (deterministic for a seed).

## Goal
Simulated players (bots) play every level many times so we can measure each level's difficulty and keep a deliberate difficulty curve: `src/sim/bots.ts` (three player models), `src/sim/assess.ts` (play, measure, tune move counts and star scores, check the curve), a CLI `npm run assess -w games/gnome-sweet-gnome`, and tests.

## Read first
- `games/gnome-sweet-gnome/src/sim/bots.ts`, `src/sim/assess.ts`: stubs with the exact types and signatures. Keep every exported name; you may add fields to `LevelReport` and add exports.
- `games/gnome-sweet-gnome/src/engine/game.ts`: `startLevel`, `playSwap`, `gnomeRush`, `starsFor`, `cloneState`, `goalsDone`, `progress`.
- `games/gnome-sweet-gnome/src/engine/board.ts`: `listValidSwaps`, `cellAt`.
- `games/gnome-sweet-gnome/src/engine/types.ts`: `LevelState`, `BoardEvent`, `LevelDef`.
- `games/gnome-sweet-gnome/src/levels.ts`: `LEVELS`, `targetFor`.
- `games/gnomes-of-gnomomia/scripts/sim-balance.mjs` lines 1-40: how this repo bundles TS sim code with esbuild and imports it in Node (copy that pattern).

## Change
- `games/gnome-sweet-gnome/src/sim/bots.ts`:
  - `random`: a uniformly random swap from `listValidSwaps(s.board)`; null if none.
  - `greedy`: for each valid swap, `cloneState(s)`, `playSwap(clone, a, b, makeRng(seed))` with `seed = Math.floor(rng() * 2 ** 32)`, count `clear` events; pick the max (ties: random). Models a player who just goes for big matches.
  - `smart`: same try-each-swap loop, score = 1000 * (goal units gained: sum over goals of `before.left - after.left`) + 10000 if the clone is won + special bonuses per `specialCreated` (bee 35, mower 45, bomb 70, prism 120) + 30 per `combo` + 2 per `clear` + 15 per row each gnome moved down (compare gnome positions before/after by piece id) - 300 if the clone is lost. Pick the max (ties: random). Models a decent human who plays for the goals.
  - Keep them fast: an 8x8 move should take under ~10 ms for `smart`.
- `games/gnome-sweet-gnome/src/sim/assess.ts`:
  - `playLevel(level, bot, seed)`: `rng = makeRng(seed)`, `state = startLevel(level, rng)`, `botRng = makeRng(seed * 7919 + botIndex + 1)`; loop while status 'playing' (cap 200 iterations): `move = BOTS[bot](state, botRng)`; null -> stop (counts as a loss); else `playSwap(state, move[0], move[1], rng)`. If won: `gnomeRush(state, rng)`. Fill `RunResult` (`stars = starsFor(level, state.score, won)`, `progress` from game.ts, `made` copied).
  - `assessLevel(level, seeds, bots = BOT_NAMES)`: seeds 1..seeds per bot. Add to `LevelReport`: `suggestedStars: [number, number, number]` = from the smart bot's winning scores (the Gnome Rush included): [10th percentile, 50th, 85th], each rounded down to 50 and strictly increasing (+50 if needed); `[level.stars]` if it never won. Verdict: smart win within `target ± TOLERANCE` -> 'ok', above -> 'too easy', below -> 'too hard'.
  - `suggestMoves(level, seeds)`: binary search moves in 5..60 on the smart bot's win rate (monotone enough), return the move count whose win rate is closest to `level.target` (prefer the larger count on ties).
  - `curveProblems(reports)`: sentences for: any of levels 1-3 with smart win < 0.9; any level with smart win < 0.2; a hard level (id % 5 === 0) that is not harder (lower smart win) than the level before it; a breather (id % 5 === 1, id > 1) that is not easier than the hard level before it; every report whose verdict is not 'ok' ("Level 7 'The Rockery': too hard, smart wins 31% vs target 85% (try 27 moves)" when a suggestion is known, i.e. add an optional `suggestedMoves?: number` to LevelReport, set by the CLI's tune mode).
  - Export `export function difficultyLabel(winRate: number): string` ('easy' >= 0.85, 'medium' >= 0.6, 'hard' >= 0.4, 'super hard' below).
- `games/gnome-sweet-gnome/scripts/assess.mjs` (new): bundle `src/sim/assess.ts`, `src/sim/bots.ts` and `src/levels.ts` with esbuild (stdin with `export * from './src/sim/assess.ts'; export * from './src/sim/bots.ts'; export * from './src/levels.ts';`, `resolveDir` the game folder, bundle, esm, platform node, outfile in a `mkdtempSync(join(tmpdir(), 'gsg-assess-'))` folder, deleted after import). Flags: `--levels=1-10` or `--levels=4,7` (default all), `--seeds=40`, `--bots=smart,greedy,random` (default all three), `--tune` (also run `suggestMoves` with the same seeds and print the suggested moves and stars per level), `--json` (print the reports as JSON only), `--strict` (exit 1 if `curveProblems` is non-empty). Default output: a table with columns `#  name  moves  target  smart  greedy  random  difficulty  movesLeft  stars  verdict` (+ `try moves` and `try stars` with --tune), percentages as whole numbers, then "Curve problems:" and the sentences (or "Curve OK"), and the total time. Print progress per level to stderr.
- `games/gnome-sweet-gnome/src/sim/assess.test.ts` (new, vitest): `playLevel` is deterministic (same level/bot/seed -> deep-equal result); the random bot plays every level with seeds 1-2 without throwing and ends each game; on levels 1-10 with 6 seeds the smart bot's average `progress` is higher than the random bot's; over levels 1-12 x 4 seeds the smart bot creates at least one mower (H or V), bomb, bee and prism in total; `difficultyLabel` thresholds; `curveProblems` on hand-made reports flags a hard level that is easier than its neighbour.
- `games/gnome-sweet-gnome/src/sim/curve.test.ts` (new, vitest, `{ timeout: 300_000 }`): runs `assessLevel(level, 16, ['smart'])` for every level and expects `curveProblems(reports)` to equal `[]`, logging the table first. This test is expected to FAIL until the levels are tuned (a later step does that): run it once, and put its output (the per-level smart win rates and problems) in your report. Do not change `levels.ts` to make it pass.

## Contract
`BOTS`, `BOT_NAMES`, `Bot`, `BotName` (bots.ts); `playLevel`, `assessLevel`, `suggestMoves`, `curveProblems`, `difficultyLabel`, `RunResult`, `LevelReport` (with `suggestedStars`, optional `suggestedMoves`), `TOLERANCE` (assess.ts). The `assess` npm script already exists in `package.json` (`node scripts/assess.mjs`); do not edit package.json.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/gnome-sweet-gnome` passes for your files.
- `cd /home/user/lawn-gnome-panic/games/gnome-sweet-gnome && npx vitest run src/sim/assess.test.ts` passes.
- `npm run assess -w games/gnome-sweet-gnome -- --levels=1-5 --seeds=10` prints the table and exits 0; `--json` prints parseable JSON; `--tune --levels=1-3 --seeds=8` prints suggestions. Report the times.
- `npx vitest run src/sim/curve.test.ts` was run once; its output is in your report (pass or fail).

## Out of scope
`src/levels.ts`, the engine (`src/engine/*`), `package.json`, every scene and view file. If you find an engine bug (a crash, a board left with matches, a game that never ends), do not fix it: describe it with a seed and level in your report.
~~~~
