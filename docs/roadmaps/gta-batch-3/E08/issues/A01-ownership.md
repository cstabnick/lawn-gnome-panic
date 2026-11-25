# E08 issue A01-ownership

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
`createOwnership` in `src/ownership.ts` works (properties bought on a loan, Kiln-Shield policies and wrecks, bought
prices, saved), with tests; `src/economy.test.ts` passes again with the new loan fields and covers loans.

## Read first
- `src/ownership.ts`: every type, constant and doc comment is the spec. Only `createOwnership` is a stub (it throws).
- `src/economy.ts`: `createEconomy(storage)`, `Economy` (`spend`, `borrow`, `payLoan`, `totalOwed`, `state().loans`), and
  how it loads/saves defensively and calls `notifySaveChanged()` from `./saveHook` after each write.
- `src/economy.test.ts`: 3 tests fail now because `state()` gained `loans: []`.
- `src/lockup/types.ts`: `StoredVehicle`.

## Change
- `src/ownership.ts`: implement `createOwnership(deps)`. Keep every exported name and signature exactly as they are
  (other workers code against them). Rules:
  - Storage: `deps.storage ?? (try { globalThis.localStorage } catch { undefined })`. Load `OWNERSHIP_KEY` JSON
    defensively: anything malformed gives the default `{ v: 1, properties: [], policies: {}, wrecks: [], bought: {} }`;
    keep only string property ids, policies whose `value`, `since`, `lastReclaim` are finite numbers, wrecks that are
    objects with a string `uid`, bought entries that are finite numbers >= 0. Save after every change, then call
    `notifySaveChanged()` (import from `./saveHook`). Storage errors are swallowed.
  - `now = deps.now ?? Date.now`.
  - `buyProperty(id)`: `propertyDef(id)` missing -> `{ ok: false, error: 'No such property.' }`; owned ->
    `` `You already own ${def.name}.` ``; down = `Math.max(0, Math.round(def.down))`; if `economy.state().acorns < down`
    or `!economy.spend(down, def.name)` (skip spend when down is 0) -> `` `${def.name} needs ${down} Acorns down. You have ${acorns}.` ``;
    loan = `Math.round(Math.max(0, def.price - down) * (1 + (def.interest ?? 0)))`; if loan > 0
    `economy.borrow(def.id, `${def.name} loan`, loan)`; push id to properties, save, call every onPropertyChange
    listener with id, return `{ ok: true }`.
  - `feeFor(value) = Math.max(INSURANCE.minFee, Math.round(value * INSURANCE.feeRate))`;
    `deductibleFor(value) = Math.max(INSURANCE.minDeductible, Math.round(value * INSURANCE.deductibleRate))`.
  - `insure(uid, value)`: already insured -> `'That one is already covered.'`; fee = feeFor(value); not enough
    Acorns or `spend(fee, 'Kiln-Shield')` false -> `` `Kiln-Shield cover costs ${fee} Acorns.` ``; else
    `policies[uid] = { value: Math.round(value), since: now(), lastReclaim: 0 }`, save, ok.
  - `policy(uid)` returns a copy or null; `policyUids()` the keys; `insured(uid)` = has a policy.
  - `fileWreck(rec)`: insured -> replace any wreck with the same uid, push a copy of rec, save, true. Else delete
    `bought[rec.uid]`, save, false.
  - `wrecks()` copies, in filing order. `reclaimWait(uid)`: no policy or lastReclaim 0 -> 0; else
    `Math.max(0, Math.ceil((lastReclaim + INSURANCE.reclaimCooldownMs - now()) / 1000))`.
  - `reclaim(uid)`: no wreck -> `'No claim for that one.'`; wait > 0 -> `` `Kiln-Shield needs ${wait} s more to process that claim.` ``;
    d = deductibleFor(policy.value); acorns < d or spend(d, 'Kiln-Shield') false -> `` `The deductible is ${d} Acorns.` ``;
    else remove the wreck, set `policy.lastReclaim = now()`, save, return `{ ok: true, rec, paid: d }`.
  - `rekey(old, nu)`: move `policies[old]` and `bought[old]` to `nu` (if present), save. `forget(uid)`: delete policy,
    bought, and wreck with that uid, save.
  - `setBought(uid, price)`: `bought[uid] = Math.max(0, Math.round(price))`, save. `boughtFor(uid)`: number or null.
  - `properties()`: copy. `ownsProperty(id)`. `onPropertyChange(cb)` returns an unsubscribe.
- `src/ownership.test.ts` (new, vitest): in-memory storage (`Map`-backed `getItem`/`setItem`) and a real economy
  `createEconomy(fakeStorage)` from `./economy` (start: 50 Acorns; call `economy.earn(n)` to fund). Call
  `clearProperties()` in `beforeEach`. Cover: buyProperty (down paid, loan booked with `id`/`principal`, interest
  rounding, already owned, unknown id, not enough Acorns leaves state unchanged, listener called once, persisted and
  reloaded by a second `createOwnership` on the same storage); insure fee + min fee + refusal; fileWreck insured vs
  uninsured; reclaim: deductible spent, cooldown message with a fake clock (`now: () => t`), works again after
  10 minutes; rekey; forget; malformed JSON in storage loads defaults.
- `src/economy.test.ts`: add `loans: []` to the three expected objects that now fail; add tests: `borrow` books and
  adds to the same id, rejects amount <= 0; `payLoan` clamps to wallet and remaining, removes a loan paid to 0, returns
  0 for an unknown id; `totalOwed()` = debt + loans; a stored save without `loans` loads `loans: []`; loans persist
  across a second `createEconomy` on the same storage; `payDebt` never touches loans.

## Contract
Exactly the exported types and functions already in `src/ownership.ts` (do not rename or change any signature).

## Done when
- `npx vitest run src/ownership.test.ts src/economy.test.ts` passes (from `games/gnome-theft-auto`).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/ownership.ts` or your tests.

## Out of scope
`src/economy.ts` (already done), every other file.
