# E08 issue A06-bag-sheet

Epic: E08-A (economy foundation, all issues parallel)
Depends on: none

## Environment
- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-ae1f1ea613541daa4` (a git worktree: stay
  inside it, use absolute paths). The game is `games/gnome-theft-auto` (Vite + TypeScript + three.js); below, `src/`
  means `games/gnome-theft-auto/src/`. Git Bash: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"`.
  Dependencies are installed: do not run `npm install`.
- About 15 other workers edit OTHER files of this game at the same time. Change only the files under "Change".
  Do not run `npm run build` (vite writes `dist/`); type-check with
  `npx tsc --noEmit -p games/gnome-theft-auto` from the repo root. Errors in files you do not own may show up
  mid-epic: ignore them, but your files must have none. Run only the test files named in "Done when"
  (`npx vitest run <file>` from `games/gnome-theft-auto`). Do not commit. Do not start a dev server.
- Repo rules that apply: mobile by default (every button at least 44 px, no hover-only UI, fits a 390x844 portrait
  phone, `env(safe-area-inset-*)` padding); a UI module appends its own container to the shared `#ui` element it is
  given and never restyles or hides `#ui`; item and vehicle icons come from `@lawn/prefabs`
  (`prefabIconElement(id, emojiFallback, px)` returns an element); plain, short English in UI text; no emoji
  variation selectors needed.

## Goal
`createBagUi` in `src/bag/bagUi.ts` draws the bag sheet: a Bag tab (items held, Use, quick-slot star) and a
Crumbs & Co. tab (buy snacks and fun items into the bag).

## Read first
- `src/bag/bagUi.ts`: the stub and its types (keep them exactly).
- `src/inventory.ts`: `Inventory` (`list`, `count`, `quick`, `setQuick`, `onChange`), `ITEMS`, `ItemDef`, `STACK_MAX`.
- `src/lockup/ui.ts`: the garage sheet: copy its structure and CSS family.
- `src/keys.ts`: `KEYS.close`.

## Change
- `src/bag/bagUi.ts`: implement `createBagUi(ui, deps)`.
  Sheet look (copy the approach of `src/lockup/ui.ts`, which you should read for structure and CSS): a `<style>`
  element appended to `document.head` once; a root `div` with its own id appended to the `ui` element; a backdrop
  `position:fixed;inset:0` (pointer-events:auto only while open) holding a bottom-anchored modal
  (`width:min(100%,560px);max-height:85vh;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y`), dark
  background `#181c20`, accent `#ffd23f`, rounded 14px, padding with safe-area insets. Header: title, one sub line, a
  44x44 close button (✕). Stop `pointerdown` and `touchmove` from reaching the game
  (`modal.addEventListener('pointerdown', e => e.stopPropagation())`, same for `touchmove` with `{ passive: true }`).
  Escape closes: a `window` `keydown` listener that checks `e.code === KEYS.close` (import `KEYS` from `src/keys.ts`;
  never write a key code string literal, a test forbids it) and only acts while open. Every button: `min-height:44px`,
  `touch-action:manipulation`. Call `deps.onOpenChange?.(true/false)` on open/close if the deps have it.
  
  - Root id `gta-bag`, classes prefixed `gta-bag-`. Title "Bag"; sub line `${total items} items · ${acorns} 🌰`.
  - Two 44 px tab buttons under the header: "🎒 Bag" and "🍪 Crumbs & Co." (`aria-pressed`). `open(tab = 'bag')`.
  - A message line (`role="status"`) for errors.
  - Bag tab: one row per `deps.inventory.list()` entry: icon `prefabIconElement(def.prefab, emoji, 40)` with emoji
    `'🍎'` (snack) / `'🎉'` (fun) / `'🔧'` (tool); name and `×count`; the blurb (12 px); a heal hint for snacks
    (`+${Math.round(heal * 100)} %`); a "Use" button and a star button (`★` when `inventory.quick() === def.id`, else
    `☆`, `aria-label="Quick-use slot"`) that sets or clears the quick slot. Empty bag: "Your bag is empty. Crumbs & Co.
    delivers, and snacks turn up in the parks."
  - Use click: `err = deps.useItem(id)`; show err if any; re-render.
  - Shop tab: one row per `ITEMS` def with a `price`: icon, name, `${price} 🌰`, `held ${count}`, blurb, a "Buy"
    button disabled with text "Bag full" when count >= STACK_MAX, or "Not enough" when `deps.acorns() < price`.
    Click: `err = deps.buy(id)`; show err; re-render.
  - Subscribe `deps.inventory.onChange(() => { if (open) render(); })`.

## Contract
The types in `src/bag/bagUi.ts`, unchanged. `src/bag/runtime.ts` (another worker) creates it.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/bag/bagUi.ts`.
- Reading your code: every button >= 44 px, Escape and ✕ close, nothing needs hover.

## Out of scope
`src/bag/runtime.ts`, `src/bag/pickups.ts`, `src/inventory.ts`, every other file.
