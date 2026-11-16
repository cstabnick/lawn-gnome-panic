~~~~text
Epic: 2 Systems and the golf and bowling slices
Depends on: none

## Goal
`npm run new-mini -- <game> <id>` scaffolds a party slice inside an existing game, and prints the size rules plus the one manual step. `npm run new` reminds the author to name a new game's party slice.

## Read first
- tools/new-game.mjs: the style to copy (argument parsing, fail(), NAME_RE, ROOT)
- package.json (repo root): the "scripts" block
- packages/party/template/minigame.ts: the template; placeholders __ID__, __TITLE__, __GAME__
- packages/party/README.md: size rules between `<!-- size-rules -->` and `<!-- /size-rules -->`; the backlog table under "Backlog"

## Change
- tools/new-minigame.mjs (new). Usage: node tools/new-minigame.mjs <game> <id>
  - <game> must be a folder in games/ whose package.json lists "three" in dependencies (else fail: "<game> is not a Three.js game:
    reuse its simulation with a Three.js view; see packages/party/README.md"). <id> must match /^[a-z][a-z0-9-]*$/.
  - Fails if games/<game>/src/minigames/<id>.ts exists, or any games/*/src/minigames/<id>.ts exists (ids are unique across games).
  - Writes games/<game>/src/minigames/<id>.ts from the template (replace __ID__ → id, __TITLE__ → Title Case of id, __GAME__ → game).
  - If games/<game>/src/minigames/index.ts is missing, writes it:
      import type { AnyMinigame } from '@lawn/party';
      import m0 from './<id>';
      export const minigames: AnyMinigame[] = [m0];
    If it exists, inserts `import mN from './<id>';` after the last import line and adds mN to the array (N = next free number);
    if it cannot find `export const minigames: AnyMinigame[] = [` it prints the two lines to add by hand instead.
  - If missing, writes minigames.test.ts (`import { testMinigame } from '@lawn/party/testkit'; import { minigames } from '.'; for (const m of minigames) testMinigame(m);`)
    and play.ts (export function playOwnSlice(): void that picks `#minigame=<id>` or the first slice and calls
    playMinigame(def, { canvas: document.getElementById('game') as HTMLCanvasElement, ui: document.getElementById('ui') as HTMLElement })).
  - games/<game>/package.json: add "@lawn/party": "*" to dependencies, "vitest": "5.1.0" to devDependencies and "test": "vitest run"
    to scripts when missing; keep key order otherwise; 2-space JSON plus newline.
  - packages/party/README.md backlog: a row whose first cell is <id> gets its last cell set to `building`; else append
    `| <id> | <game> | TODO one-line idea | building |` after the table's last row.
  - If games/<game>/src/main.ts does not contain 'minigames/play', print the one manual step: "Split the entry: git mv src/main.ts src/app.ts,
    remove loadMyGnome from app.ts, and write the 5-line main.ts from packages/party/README.md (How a game surfaces a slice)."
  - Prints the size rules (text between the markers) and "Try it: npm run dev -w games/<game>, open the page with #minigame=<id>.
    Check it: npm test -w games/<game>."
- package.json (repo root): add "new-mini": "node tools/new-minigame.mjs" to "scripts". Nothing else.
- tools/new-game.mjs: at the very end print one more line:
  `Name its Gnome Party slice: add a backlog row in packages/party/README.md (see the size rules there).`

## Done when
- `npm run new -- zz-tool-check --from gnome-creator` then `npm run new-mini -- zz-tool-check zz-mash` succeeds; the slice file has
  id 'zz-mash', title 'Zz Mash', game 'zz-tool-check'; index.ts, play.ts and minigames.test.ts exist; and
  `npx tsc --noEmit -p games/zz-tool-check` passes.
- Running new-mini again fails with the "exists" message; `npm run new-mini -- zz-tool-check Bad` fails; `npm run new-mini -- sample-dodge x` fails
  with the Three.js message.
- Then delete games/zz-tool-check entirely and remove the zz-mash backlog row, leaving the repo as before (git status shows only your 3 files).

## Out of scope
Every games/* folder other than the temporary zz-tool-check (golf and bowling are being edited by other workers); packages/party except the
README backlog row you add and remove.
~~~~
