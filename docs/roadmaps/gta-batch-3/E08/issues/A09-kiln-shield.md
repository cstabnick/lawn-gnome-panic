# E08 issue A09-kiln-shield

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
`createInsurance` in `src/lockup/insurance.ts` gives the player Kiln-Shield vehicle cover: a phone app listing their
vehicles (Insure) and insured write-offs (Reclaim); a reclaimed vehicle goes back into its garage at full health.
(`src/app.ts` already calls `createInsurance(...)`, `update(dt)` and `isOpen()`.)

## Read first
- `src/lockup/insurance.ts`: the stub (`InsuranceDeps`, `Insurance`; keep them).
- `src/ownership.ts`: `Ownership` (`insured`, `insure`, `feeFor`, `deductibleFor`, `policy`, `policyUids`,
  `fileWreck`, `wrecks`, `reclaimWait`, `reclaim`, `rekey`, `forget`) and `INSURANCE`. Another worker implements it;
  code against the interface.
- `src/lockup/runtime.ts`: `Lockup.list`, `addSnapshot`, `free`, `onWrittenOff`.
- `src/lockup/types.ts`: `StoredVehicle`, `VehicleSnapshot`, `StorageKind`.
- `src/lockup/ui.ts`: the garage sheet: copy its structure and CSS family.

## Change
- `src/lockup/insurance.ts`: implement `createInsurance(deps)`.
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
  
  - Root id `gta-kiln-shield`, classes `gta-ks-`. Title "Kiln-Shield"; sub "Vehicle cover. We pay out. Mostly.".
  - Storage kind of a record: `VEHICLES[rec.kind].flies ? 'air' : VEHICLES[rec.kind].boat ? 'water' : 'ground'`
    (`VEHICLES` from `../config`); place names: ground "the Lock-Up", air "Hangar Two", water "the Mossbank Boathouse".
  - Section "Claims" (only when `ownership.wrecks()` is not empty): per wreck: name, `value ${v} · deductible ${d} 🌰`
    (v = `ownership.policy(uid)?.value ?? deps.valueOf(rec)`, d = `ownership.deductibleFor(v)`), and a 44 px
    "Reclaim" button; disabled with a reason line when `ownership.reclaimWait(uid) > 0` (`Ready in ${s} s`), when
    `lockup.free(kind) === 0` (`${place} is full`), or when acorns < d (`Not enough Acorns`).
  - Section "Your vehicles": per `lockup.list()` record: name and place; `Covered` (green) when
    `ownership.insured(uid)`, else a 44 px button `Insure · ${ownership.feeFor(deps.valueOf(rec))} 🌰` ->
    `ownership.insure(uid, deps.valueOf(rec))`; error -> message line; ok -> `play('door')`, toast
    `` `Kiln-Shield: your ${rec.name} is covered.` ``, re-render. Empty list: "Nothing in your garages to cover yet."
  - `reclaim(uid)`: find the wreck; kind; `lockup.free(kind) === 0` -> `` `${place} is full. Make room first.` `` (check
    BEFORE charging); `r = ownership.reclaim(uid)`; `!r.ok` -> r.error; else
    `const { uid: _u, storedAt: _s, ...snap } = r.rec; rec2 = lockup.addSnapshot({ ...snap, hp: 1 })`; null -> return
    `'No room.'`; `ownership.rekey(uid, rec2.uid)`; `achievements.unlock(ECON_ACH.reclaim)` (`../econAchievements`);
    `play('door')`; toast `` `Kiln-Shield: claim APPROVED (for once). Your ${rec.name} is back in ${place}.` ``; null.
    The sheet's Reclaim button calls it and shows the error.
  - Write-offs: `deps.lockup.onWrittenOff(rec => { if (deps.ownership.fileWreck(rec)) { const v =
    deps.ownership.policy(rec.uid)?.value ?? deps.valueOf(rec); deps.hud.toast(`Kiln-Shield: your ${rec.name} is
    covered. Reclaim it on the phone for ${deps.ownership.deductibleFor(v)} Acorns.`, 5000); } })`.
  - Phone app: `deps.phone.addApp({ id: 'kiln-shield', label: 'Kiln-Shield', icon: '🛡', detail: () =>
    `${insured} covered · ${claims} claims`, run() { blocked ? toast : open } })`.
  - `update(dt)`: every 1 s re-render when open; every 5 s prune: for each `ownership.policyUids()` uid that is neither
    in `lockup.list()` nor in `ownership.wrecks()`, call `ownership.forget(uid)` (it was scrapped).
  - `isOpen()`.

## Contract
`createInsurance(deps: InsuranceDeps): Insurance` as in the stub.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/lockup/insurance.ts`.

## Out of scope
`src/ownership.ts`, `src/lockup/runtime.ts`, `src/lockup/ui.ts`, `src/app.ts`, every other file.
