# E08 issue A03-repair-tab

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
Pay 'n' Glaze (and the Wingwright's Slipway for boats and aircraft) get a working **Repair** tab: a price from the
missing hit points and the damage level, and one button that fixes the vehicle on the stage.

## Read first
- `src/glazePanelRepair.ts`: the stub (`REPAIR`, `repairQuote`, `setRepairHook`/`repairHook`, `repairPanel`). Keep
  every export name and signature.
- `src/glazeUi.ts`: `Panel` and `PanelCtx` (note the optional `vehicle()`, `spend()`, `toast()`), and the widgets
  (`sectionLabel` and the `gz-*` CSS classes in `GLAZE_CSS`).
- `src/glazePanelBody.ts`: a finished panel (module-level ctx ref, `build`, `refresh`).
- `src/glazePanels.ts`: the registry.
- `src/dealers/config.ts`: `dealerPrice(kind, variant)` and `UNLISTED_VALUE`.

## Change
- `src/glazePanelRepair.ts`:
  - `repairQuote(hp, damage, kind)`: `hp` clamped to 0..1; if `hp >= 0.999 && damage <= 0` return 0. Else
    `value = dealerPrice(kind, null) ?? UNLISTED_VALUE`; `tier = Math.min(2.5, Math.max(0.5, value / 1000))`;
    return `Math.round(REPAIR.base + REPAIR.perHp * (1 - hp) * tier + REPAIR.perLevel * Math.max(0, damage))`.
  - `repairPanel.build(ctx)`: keep the ctx in a module-level variable (like the other panels). Show a section label
    "Repair", the vehicle's name (`ctx.vehicle?.()?.spec.name`), a health bar (a 100% wide 10 px track with a fill of
    `Math.round(v.hp * 100)` %, green `#7bd67b` above 60 %, amber `#ffb347` above 30 %, else `#ff5a3c`), a line
    `Health 73 % · damage level 2` (omit the damage part at level 0), and one 44 px button.
    Button text: `Repair · ${q} 🌰` when the quote q > 0, else `Nothing to fix`; disabled when q is 0 or
    `ctx.acorns() < q`. When `ctx.vehicle` or `ctx.spend` is missing, show only "Repairs are not available here."
  - On click: `v = ctx.vehicle!()`, `q = repairQuote(v.hp, v.damage, v.kind)`; if q <= 0 return; if
    `!ctx.spend!(q, "Pay 'n' Glaze repair")` then `ctx.toast?.('Not enough Acorns.')` and return; else
    `repairVehicle(v)` (import from `./vehicles`), `ctx.toast?.('Dents out, cracks filled. Good as new.')`,
    `repairHook()?.(v.kind, q)`, then refresh.
  - `refresh()`: recompute everything from the vehicle (it is also called after other tabs' purchases).
- `src/glazePanels.ts`: import `repairPanel` from `./glazePanelRepair` and add `registerGlazePanel(repairPanel, 60);`
  after the built-ins.
- `src/glazePanelRepair.test.ts` (new, vitest): `repairQuote` is 0 for a new vehicle; grows with missing hp; adds
  `REPAIR.perLevel` per damage level; a combine (dealer price 3500) costs more than a push-bike at the same damage;
  a kind not sold anywhere (e.g. `'hoa-van'`) uses `UNLISTED_VALUE`; hp outside 0..1 is clamped.

## Contract
`repairQuote(hp: number, damage: number, kind: VehicleKind): number`; `repairPanel: Panel` with id `'repair'`
(the Slipway's `CRAFT_PANEL_IDS` already lists `'repair'`, so the same panel shows there too).

## Done when
- `npx vitest run src/glazePanelRepair.test.ts src/glazeStore.test.ts` passes (from `games/gnome-theft-auto`).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.

## Out of scope
`src/glazeShop.ts`, `src/craft/*`, `src/garages.ts` (already wired), `src/dealers/config.ts` (another worker may edit prices).
