# E08 issue A07-bag-runtime

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
`createBag` in `src/bag/runtime.ts` makes the bag playable: a phone app and More-menu entry open the sheet, a
quick-use dock button and key `1` eat the best snack, every item's effect works, and Crumbs & Co. sells into the bag.
(`src/app.ts` already calls `createBag(...)`, `bag.update(dt)`, `bag.buff()` and `bag.isOpen()`.)

## Read first
- `src/bag/runtime.ts`: the stub, `BagDeps`, `BagBuff`, `Bag` (keep them exactly).
- `src/inventory.ts`: `Inventory`, `ItemDef`, `ITEM_TUNING`, `STACK_MAX`, `itemDef`.
- `src/bag/bagUi.ts`: `createBagUi(ui, { inventory, acorns, useItem, buy })` (another worker implements it).
- `src/lockup/runtime.ts` lines ~395-440: the pattern for a phone app (`deps.phone.addApp`), a dock button
  (`dockButton(button, actionId)` from `../ui/dock`), `registerAction(id, { run, available })` from
  `../ui/actions`, and a key listener using `KEYS` and `isTyping` from `../keys`.
- `src/econAchievements.ts`: `ECON_ACH.firstSnack`.

## Change
- `src/bag/runtime.ts`: implement `createBag(deps)`:
  - `ui = createBagUi(deps.ui, { inventory, acorns: () => deps.economy.state().acorns, useItem: tryUse, buy })`.
  - Phone app: `deps.phone.addApp({ id: 'bag', label: 'Bag', icon: '🎒', detail: () => `${n} items` + (quick item ?
    ` · quick: ${name}` : ''), run() { const why = deps.blocked(); if (why) deps.hud.toast(why); else ui.open('bag'); } })`.
  - `registerAction('bag', { run: same as the app })` (the More menu shows it).
  - Quick-use button: a `<button type="button">` with class `gta-bag-fab` (inject a small `<style>`: inline-flex,
    gap 6px, border `2px solid rgba(255,210,63,0.9)`, background `rgba(22,26,30,0.88)`, colour `#ffd23f`, bold,
    `pointer-events:auto`), `pointerdown` stops propagation, click -> `quickUse()`; `dockButton(btn, 'snack')`;
    `registerAction('snack', { run: quickUse, available: () => btn.style.display !== 'none' })`. Each `update`, show it
    (`display:inline-flex`) only when `deps.blocked() === null` and `inventory.pickQuick(1 - deps.health())` gives an
    id; text `🍎 ${def.name} ×${count}` (set textContent only when it changed); else `display:none`.
  - Key: `window.addEventListener('keydown', e => { if (e.code !== KEYS.snack || e.repeat || isTyping(e)) return; quickUse(); })`.
  - `quickUse()`: blocked -> toast the reason; `id = inventory.pickQuick(1 - deps.health())`; none -> toast
    `'Nothing to eat in the bag.'`; else `err = tryUse(id)`; toast err if any.
  - `tryUse(id): string | null`: blocked -> reason; `def = itemDef(id)`; none -> `'Unknown item.'`; count 0 ->
    `` `No ${def.name} left.` ``; snack and `deps.health() >= 0.999` -> `'You are not cracked.'`; effect `'patch'` with
    no `deps.vehicle()` -> `'Sit in a vehicle first.'`; patch and vehicle `hp >= 0.999` -> `'It is not damaged.'`;
    else `inventory.use(id)` and return null.
  - `inventory.onItemUse(def => ...)` applies effects: heal (`def.heal`) -> `deps.heal(def.heal)`, `play('drink')`,
    toast `` `${def.name}. Cracks mended.` `` (heal >= 1: `` `${def.name}. Good as new.` ``), unlock
    `ECON_ACH.firstSnack` when `def.kind === 'snack'`; `'fizz'` -> fizz timer = `ITEM_TUNING.fizzS`, `play('drink')`,
    toast "Fizz! Faster for a while."; `'float'` -> float timer = `ITEM_TUNING.floatS`, toast "Your hat feels light.";
    `'confetti'` -> `deps.confetti()`, `play('stunt')`; `'whoopee'` -> `play('bump')`, toast "Pfffrrrt. Somebody
    nearby is pretending not to laugh."; `'patch'` -> `v = deps.vehicle()`, if v `deps.patchVehicle(v,
    ITEM_TUNING.patchHp)`, `play('door')`, toast "Rust Oil: some of the damage is gone.".
  - `buy(id): string | null`: blocked -> reason; no def or no price -> `'Not sold here.'`; count >= STACK_MAX ->
    `'Your bag is full of those.'`; `!deps.economy.spend(price, 'Crumbs & Co.')` -> `` `Not enough Acorns (${price}).` ``;
    `inventory.add(id, 1)`; `play('door')`; toast `` `Crumbs & Co. dropped off a ${def.name}.` ``; null.
  - `update(dt)`: count timers down; refresh the button; while the sheet is open, `ui.refresh()` every 0.5 s.
  - `buff()`: `speedMult = fizz > 0 ? ITEM_TUNING.fizzSpeed : 1`; `jumpMult = max(fizz > 0 ? fizzJump : 1,
    float > 0 ? floatJump : 1)`; `label` = `` `Fizz ${Math.ceil(fizz)}s` `` or `` `Float ${Math.ceil(float)}s` `` (the
    longer one), or null.
  - `isOpen()`: `ui.isOpen()`.

## Contract
`createBag(deps: BagDeps): Bag` as in the stub. Sfx names used must be members of the `Sfx` union in `src/types.ts`
('drink', 'stunt', 'bump', 'door' are).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/bag/runtime.ts`.
- `npx vitest run src/keys.test.ts src/ui/actions.test.ts` passes (from `games/gnome-theft-auto`).

## Out of scope
`src/bag/bagUi.ts`, `src/bag/pickups.ts`, `src/inventory.ts`, `src/keys.ts`, `src/ui/actions.ts` (the `snack` key and
the `bag` / `snack` actions already exist), `src/app.ts`.
