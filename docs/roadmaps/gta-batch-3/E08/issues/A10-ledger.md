# E08 issue A10-ledger

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
`createLedger` in `src/ledger.ts` adds the Ledger phone app: Acorns, Kiln-Debt and every loan beside it (pay a loan
down), properties owned and for sale (buy on a loan). (`src/app.ts` already calls it.)

## Read first
- `src/ledger.ts`: the stub (`LedgerDeps`, `Ledger`; keep them).
- `src/economy.ts`: `EconomyState` (`acorns`, `debtRemaining`, `debtPaidOff`, `loans`), `payLoan`, `totalOwed`.
- `src/ownership.ts`: `listProperties()`, `PropertyDef`, `Ownership.buyProperty`, `ownsProperty`.
- `src/lockup/ui.ts`: the garage sheet: copy its structure and CSS family.
- `src/econAchievements.ts`: `ECON_ACH.property`.

## Change
- `src/ledger.ts`: implement `createLedger(deps)`.
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
  
  - Root id `gta-ledger`, classes `gta-ledger-`. Title "Ledger"; sub `${acorns} 🌰 in the wallet`.
  - Section "Owed": a Kiln-Debt row (`Clay-Mart Kiln-Debt`, `${debtRemaining} 🌰`, or "Paid off" in green). No pay
    button here (the story pays it). Then one row per loan: name, `${remaining} of ${principal} 🌰`, buttons
    "Pay 50" and "Pay all" (44 px): `paid = economy.payLoan(id, 50 or remaining)`; paid 0 -> message "Not enough
    Acorns."; else `play('door')` and toast `` `Paid ${paid} Acorns off the ${name}.` `` (and when that loan is gone:
    `` `${name} paid off.` `` as a banner). A total line: `Total owed ${economy.totalOwed()} 🌰`.
  - Section "Property": one row per `listProperties()` def: name, blurb, `price ${price} · ${down} down · rest on a
    loan` and, owned -> "Yours" badge; else a "Buy" button -> `r = deps.ownership.buyProperty(def.id)`; ok ->
    `hud.banner(`${def.name} is yours`)`, `play('door')`, `achievements.unlock(ECON_ACH.property)`; error -> message line.
    No defs: "Nothing for sale yet."
  - Phone app: `deps.phone.addApp({ id: 'ledger', label: 'Ledger', icon: '📒', detail: () =>
    `${acorns} 🌰 · owe ${totalOwed}`, run() { blocked ? toast : open } })`.
  - Re-render after every action; `isOpen()`.

## Contract
`createLedger(deps: LedgerDeps): Ledger` as in the stub.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/ledger.ts`.

## Out of scope
`src/economy.ts`, `src/ownership.ts`, `src/app.ts`, every other file.
