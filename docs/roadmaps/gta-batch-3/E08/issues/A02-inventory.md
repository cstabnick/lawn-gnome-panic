# E08 issue A02-inventory

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
`createInventory` in `src/inventory.ts` works (counts, quick slot, listeners, save), with tests.

## Read first
- `src/inventory.ts`: every type, constant and doc comment is the spec. Only `createInventory` is a stub (it throws).
- `src/economy.ts`: how a store loads defensively, saves, and calls `notifySaveChanged()` from `./saveHook`.

## Change
- `src/inventory.ts`: implement `createInventory(storage?)`. Do not change `ITEMS`, `ITEM_TUNING`, `STACK_MAX` or
  any exported signature (other workers code against them). Rules:
  - Storage: `storage ?? (try { globalThis.localStorage } catch { undefined })`. Load `INVENTORY_KEY` JSON defensively:
    default `{ v: 1, items: {}, quick: null }`; keep item counts that are finite numbers, rounded, clamped to
    1..STACK_MAX (drop <= 0); `quick` is a string or null. Save after every change, then `notifySaveChanged()`.
    Storage errors are swallowed.
  - `add(id, n = 1)`: n rounded; n <= 0 -> 0; fits = `Math.min(n, STACK_MAX - count(id))`; 0 -> 0 (no save);
    else add, save, call onChange listeners, return fits.
  - `use(id)`: `itemDef(id)` undefined or count 0 -> false. Else decrement (delete the key at 0; if it was the quick
    item and its count is now 0, keep `quick` as is: the player chose it), save, call onItemUse listeners with the def,
    then onChange listeners, return true.
  - `remove(id, n = 1)`: removes up to n, returns how many; save + onChange when > 0.
  - `list()`: for each def in `ITEMS` order with count > 0: `{ def, count }`.
  - `quick()`, `setQuick(id | null)`: save + onChange.
  - `pickQuick(missing)`: if `quick` is set and its count > 0 -> quick. Else if `missing <= 0` -> null. Else among held
    items with `kind === 'snack'` and `heal > 0`: the one with the smallest heal >= missing; if none covers it, the one
    with the largest heal; none held -> null.
  - `onItemUse(cb)`, `onChange(cb)` return unsubscribe functions.
- `src/inventory.test.ts` (new, vitest, in-memory `Map` storage): add caps at STACK_MAX and returns what fitted;
  unknown ids can be added and saved; use decrements, calls onItemUse with the def, refuses at 0 and for unregistered
  ids; remove; list order follows ITEMS; quick slot persistence; pickQuick cases (quick wins; full health null;
  smallest covering heal; biggest when none covers; ignores fun items); reload from storage on a second instance;
  malformed JSON loads empty; `registerItem` adds and replaces a def; the module-level `addItem/useItem/count` work
  after `installInventory(inv)` and are harmless (0/false) after `installInventory(null)`.

## Contract
Exactly the exports already in `src/inventory.ts`.

## Done when
- `npx vitest run src/inventory.test.ts` passes (from `games/gnome-theft-auto`).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/inventory.ts` or your test.

## Out of scope
Every other file (the bag UI and runtime are other issues).
