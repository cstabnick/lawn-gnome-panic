# E08 issue A04-dealer-sheet

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
`createDealerUi` in `src/dealers/ui.ts` draws a working showroom sheet: vehicle cards with a thumbnail, price, blurb
and a Buy button, plus a Kiln-Shield cover toggle.

## Read first
- `src/dealers/ui.ts`: the stub and its types (`DealerCard`, `DealerUiDeps`, `DealerUi`). Keep them exactly.
- `src/dealers/config.ts`: `DealerDef` (name, keeper).
- `src/lockup/ui.ts`: the garage sheet: copy its structure and CSS family.
- `src/keys.ts`: `KEYS.close`.

## Change
- `src/dealers/ui.ts`: implement `createDealerUi(ui, deps)`.
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
  
  - Root id `gta-dealer`, CSS classes prefixed `gta-dealer-`.
  - Header: title = dealer.name; sub = `${dealer.keeper} · You have ${deps.acorns()} 🌰`.
  - Under the header a toggle button (44 px, `aria-pressed`): "🛡 Kiln-Shield cover: on" / "off". Default off each
    time the sheet opens. One line under it: "Cover lets you reclaim a written-off vehicle for 25 % of its price."
  - A message line (`role="status"`, red-ish `#ffb3a0`) for errors from `buy`.
  - Cards in a responsive grid (`grid-template-columns:repeat(auto-fill,minmax(150px,1fr))`): thumbnail
    `prefabIconElement(card.prefab, '🚜', 56)` from `@lawn/prefabs`; name (bold); price `${price} 🌰` and, when cover
    is on, `+ ${deps.insuranceFee(price)} cover`; blurb (12 px, 0.8 opacity); if `card.note` a note line and the
    button disabled showing the note; else button `Buy`. Disabled buttons are greyed (opacity .5).
  - Buy click: `err = deps.buy(dealer, card.id, coverOn)`; err -> show it in the message line and re-render; null ->
    close.
  - `refresh()` re-renders the cards from `deps.cards(dealer)` (and the sub line) when open. `open(dealer)` renders and
    shows; `close()` hides; `isOpen()`.
  - In landscape phones (`@media (max-height:500px)`) use `max-height:92vh`.

## Contract
The types in `src/dealers/ui.ts`, unchanged. `src/dealers/runtime.ts` (another worker) calls
`createDealerUi(deps.ui, { cards, acorns, insuranceFee, buy, onOpenChange })`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/dealers/ui.ts`.
- Reading your code: every button is >= 44 px, Escape and ✕ close, nothing needs hover.

## Out of scope
`src/dealers/runtime.ts`, `src/dealers/config.ts`, every other file.
