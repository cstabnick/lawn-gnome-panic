Epic: 1 Modules
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn. Game: games/gnome-theft-auto (TypeScript, DOM UI, vitest).
In Git Bash, if node is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
Other workers edit OTHER files of this game at the same time. Do not commit, push, stash or switch branches. Do not run
`vite build` or a dev server. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files that are not yours:
ignore those, fix only errors in your files.
Repo rules: UI modules append their own container to the shared `ui` element and never restyle or hide `ui` itself.
Mobile: every button at least 44 x 44 px, no hover-only UI, fits a 390 x 844 portrait and a landscape phone with
safe-area insets. Gamepad: while open, D-pad / left stick up/down moves a focus ring, A presses, B closes.

## Goal
Fill `games/gnome-theft-auto/src/lockup/ui.ts`: the Lock-Up sheet, a modal listing the owned vehicles of one storage
kind (5 slots for 'ground'), with per-vehicle actions. Phone mode: "Deliver" (calls the Sling-Lift). Site mode (at the
garage): "Take out" and "Scrap". DOM only; every action goes through deps.

## Read first
- games/gnome-theft-auto/src/lockup/ui.ts: the stub. `LockupUiDeps`, `LockupUi`, `LockupUiMode` are the contract (keep them).
- games/gnome-theft-auto/src/lockup/types.ts: `StoredVehicle` (name, hp, uid), `StorageKind`.
- games/gnome-theft-auto/src/garages.ts lines 47-127 and 156-186: the existing garage modal CSS look (dark sheet
  #181c20, yellow #ffd23f titles, 44 px buttons, safe-area padding, `pointerdown` stopPropagation on the root so touches
  do not drive the camera, `touchmove` stopPropagation for scrolling) and `if (document.pointerLockElement) document.exitPointerLock()` on open.
- games/gnome-theft-auto/src/options.ts lines 297-340: the gamepad polling pattern while a panel is open
  (`firstPad()` from '@lawn/gamepad', requestAnimationFrame loop, edges against the previous frame,
  `document.body.dataset.options = open ? 'open' : ''` makes the game's own pad reader stand down).
- games/gnome-theft-auto/src/keys.ts: `KEYS.close` ('Escape'), `isTyping`.

## Change
- games/gnome-theft-auto/src/lockup/ui.ts: implement `createLockupUi(ui, deps)`.
  - One `<style>` (ids/classes prefixed `gta-lockup`) and a root `div#gta-lockup` appended to `ui`
    (position fixed, inset 0, z-index 36, pointer-events none; the backdrop inside has pointer-events auto and is
    display none until open).
  - `open(kind, mode, title)`: remember them, render, show, exitPointerLock, `deps.onOpenChange?.(true)`, set
    `document.body.dataset.options = 'open'`, start pad polling (seed the previous-buttons array with the buttons
    held at open time so the press that opened it does not count).
  - Render: header with `title` and a sub line: phone mode `Sling-Lift: ${deps.fee()} Acorns a drop` plus
    ` · ready in ${Math.ceil(deps.cooldownLeft())} s` when cooldownLeft() > 0; site mode 'Drive a vehicle in and press
    T to store it.' A close button (✕, aria-label 'Close'). Then exactly `deps.store.capacity(kind)` slot rows. A filled
    row shows the vehicle name, a health bar / percent (`Math.round(hp * 100)%`), and a status: 'Out' when
    `deps.isOut(uid)`, else 'In the Lock-Up'. Buttons per filled row:
    - phone mode: 'Deliver' (label 'Fetch it' when out). Disabled-looking (but still clickable, it reports why) when
      cooldownLeft() > 0. Click: `const err = deps.deliver(uid)`; err ? show err in a message line in the sheet : close().
    - site mode: 'Take out' (hidden when out) -> `deps.takeOut(uid)`; err ? message : close().
      'Scrap (+N)' with N = deps.scrapValue(rec): first click changes the label to 'Really scrap?' for 3 s, a second
      click within 3 s calls `deps.scrap(uid)`; err ? message : re-render.
    Empty rows say 'Empty slot'.
  - `refresh()`: re-render if open (keep the focus index in range).
  - `close()`: hide, stop polling, `document.body.dataset.options = ''`, `deps.onOpenChange?.(false)`.
  - Escape (window keydown, `e.code === KEYS.close`, not when `isTyping(e)`) closes it when open and calls
    `e.stopImmediatePropagation()`. Clicking the backdrop outside the sheet closes it.
  - Gamepad focus: a flat list of the sheet's visible buttons in DOM order; outline `3px solid #7cf0ff` on the focused
    one only when `firstPad()` is non-null.
  - Layout: sheet `width:min(100%,520px); max-height:85vh; overflow-y:auto`; rows flex-wrap so buttons drop under the
    name on a narrow screen.
- games/gnome-theft-auto/src/lockup/ui.test.ts (new, optional but preferred): vitest with
  `// @vitest-environment happy-dom` ONLY if `happy-dom` or `jsdom` is already in node_modules (check
  `ls node_modules | grep -E "happy-dom|jsdom"` at the repo root); if neither exists, skip the test file.
  Test: open in phone mode with a fake store of 2 records (capacity 5) renders 5 rows and 2 Deliver buttons; clicking
  Deliver with deps.deliver returning null closes it; returning 'Too poor.' shows that text.

## Contract
The stub's exports unchanged: `LockupUiMode`, `LockupUiDeps`, `LockupUi`, `createLockupUi(ui: HTMLElement, deps: LockupUiDeps): LockupUi`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/lockup/ui.ts (and its test if written).
- If you wrote the test: `cd games/gnome-theft-auto && npx vitest run src/lockup/ui.test.ts` passes.

## Out of scope
Every other file. Do not import from lockup/runtime.ts or phone/.
