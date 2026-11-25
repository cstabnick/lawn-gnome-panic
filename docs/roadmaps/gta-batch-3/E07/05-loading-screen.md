Epic: E07 step 1 · Issue 05 loading screen with fun facts and concept-art pages (L87)
Depends on: none

Read `docs/roadmaps/gta-batch-3/E07/_env.md` first (environment, rules).

## Goal
From the first paint until the first game frame, the player sees a loading screen instead of a blank sky-blue page:
the game title, a coarse stage line ("Fetching your gnome...", "Building Turfton...", ...) with a progress bar by
stage, a fun fact about the world that changes every ~4 s, and a few "concept-art" pages (drawn in code, inline SVG)
the player can flip with tap / arrow keys / pad while waiting. It disappears once the first frame is drawn (already
wired: `app.ts` calls `hideLoading()` from `src/loading/loader.ts` one frame after its first `frame()`).

## Read first
- `games/gnome-theft-auto/index.html`: `<canvas id="game">`, `<div id="ui">`, an inline anti-zoom script, then
  `<script type="module" src="/src/main.ts">`. `#ui *` has `touch-action:none`; `body` has `touch-action:none` and
  `user-select:none`. The inline script blocks `touchmove`, `dblclick` and fast double taps on the document.
- `games/gnome-theft-auto/src/main.ts` (11 lines): `await Promise.all([loadMyGnome(), initGtaWasm()])`, then for
  `#minigame` the party slice, else `await (await import('./cloudSave')).startCloudSave(); await import('./app');`.
  `app.ts` builds the whole world at module top level, so most of the wait is inside `import('./app')` (the browser
  is busy: no timers run during that synchronous build, so the fact rotation pauses; that is fine).
- `games/gnome-theft-auto/src/loading/loader.ts`: the stub (keep the three exported signatures).
- Lore: `docs/lore/canon.md` and the setting rows for Gnome Theft Auto in `docs/lore/settings.md`; search with
  `npm run lore -- find <word>` from the repo root (e.g. `Turfton`, `Kiln`, `Fescue`, `Acorn`, `Loch Moss`,
  `Frostbite`, `Pebblewick`, `Pardonlin`, `Unmown`). Every fact must come from the lore docs or the game's own text
  (names and jokes already in `src/`); do not invent new canon. If you add a lore entry, `npm run lore` must pass.

## Change
- `games/gnome-theft-auto/index.html`: add, before the module script, a `<div id="gta-loader">` with inline CSS in the
  existing `<style>`: full-screen (`position:fixed; inset:0; z-index:100`), safe-area padding, a warm garden-dusk
  gradient, the title "Gnome Theft Auto" in a chunky style, a stage line `#gta-loader-stage`, a bar
  `#gta-loader-bar` (width by stage), a fact box `#gta-loader-fact`, and a page area `#gta-loader-page` with prev/next
  44 px buttons and dots. Seed it with 3 facts inline so something shows before any module loads. Pointer events on,
  `touch-action: manipulation` on its buttons. Must fit 390x844, 844x390 (landscape: title smaller, page beside the
  fact) and desktop. Keep the existing inline anti-zoom script as is.
- `games/gnome-theft-auto/src/loading/facts.ts`: `export const LOADING_FACTS: readonly string[]` (20-30 short facts,
  each <= 140 chars, from lore; later epics append). Plain data.
- `games/gnome-theft-auto/src/loading/pages.ts`: `export interface LoadingPage { title: string; caption: string; svg: string }`
  and `export const LOADING_PAGES: readonly LoadingPage[]` (4-6 pages, e.g. "Turfton at golden hour", "The Fescue
  Kiln", "A ride-on mower, exploded view", "Know your gnome: hat, beard, coat"): each `svg` a small hand-written inline
  SVG string (viewBox 0 0 320 200, flat shapes, sketchy pencil feel: a paper background, a few strokes, labels in a
  handwriting-ish system font), self-generated, no external files.
- `games/gnome-theft-auto/src/loading/loader.ts`: implement `showLoading(steps)`, `loadingProgress(n, label)`,
  `hideLoading()` against the `#gta-loader` DOM (no-ops if it is missing, e.g. in tests): fill the stage list, set the
  bar to `(n + 1) / steps.length`, rotate `LOADING_FACTS` every 4 s (random start), render `LOADING_PAGES` with
  prev / next buttons, ArrowLeft / ArrowRight keys and swipe, `hideLoading()` fades out over 300 ms then removes the
  node, clears timers and listeners. Import nothing heavy (no three, no app modules).
- `games/gnome-theft-auto/src/main.ts`: import `{ showLoading, loadingProgress }` from `./loading/loader` and report
  stages: `showLoading(['Fetching your gnome', 'Syncing your save', 'Building Turfton', 'Planting the gnomes'])`,
  then `loadingProgress(0, ...)` before the first await, `(1, ...)` before `startCloudSave`, `(2, ...)` before
  `import('./app')`. (Stage 3 shows while app.ts runs; hideLoading ends it.) For `#minigame` call `hideLoading()`
  after the slice starts.

## Done when
- From games/gnome-theft-auto: `npx tsc --noEmit -p .` passes; add `src/loading/loader.test.ts` checking that the three
  functions are safe without a DOM (call them with `document` undefined or a minimal stub) and that every fact is
  <= 140 chars and every page has a non-empty `svg` starting with `<svg`.
- `npm run lore` from the repo root passes if you touched `docs/lore/`.
- Browser check on your own port: the loader shows at once, stage text advances, facts change, pages flip by tap and
  arrows, and it is gone once the game draws (`document.getElementById('gta-loader') === null` after load); check
  390x844 and 844x390 (screenshots with puppeteer-core, Edge at
  `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`, are fine). Report what you saw.

## Out of scope
`src/app.ts`, `src/hud.ts`, every file not listed.
