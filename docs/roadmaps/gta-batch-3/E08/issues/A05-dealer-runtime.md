# E08 issue A05-dealer-runtime

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
`createDealers` in `src/dealers/runtime.ts` places the three dealerships in the world, opens the showroom on foot,
sells vehicles into the player's garages and has the Sling-Lift deliver them, unlocks the purchase achievements, and
returns map blips. (`src/app.ts` already calls it and wires `prompt`/`interact`/`update`/`isOpen`/`blips`.)

## Read first
- `src/dealers/runtime.ts`: the stub, `DealersDeps` and `Dealers` (keep them exactly).
- `src/dealers/config.ts`: `DEALERS`, `DEALER_IDS`, `DEALER_SITES`, `DealerDef`, `DealerStock`.
- `src/dealers/ui.ts`: `createDealerUi(ui, deps)` and `DealerCard` (another worker implements it; code against the types).
- `src/lockup/runtime.ts`: the `Lockup` interface (`owns`, `free`, `list`, `addSnapshot`, `callDelivery(uid, free)`).
- `src/lockup/safeSpot.ts`: `findSafeSpot(x, z, probe, opts)` returns a `DropSpot { x, y, z, yaw }` or null.

## Change
- `src/dealers/runtime.ts`: implement `createDealers(deps)`:
  - Sites: for each id in `DEALER_IDS`, start at `DEALER_SITES[id]`; `spot = findSafeSpot(x, z, deps.probe,
    { radius: 2.5, minDist: 0, maxDist: 30, maxSlope: 0.3, maxWater: 0.05 })`; use the spot (x, y, z) or the nominal
    point with `y = deps.probe.ground(x, z)`. If `getPrefab(def.sign)` (from `@lawn/prefabs`) exists, add
    `buildPrefab(def.sign)` to `deps.scene` there, rotated `rotation.y = spot?.yaw ?? 0`. (The sign prefabs are made by
    another worker; skip silently when missing.)
  - `prompt()`: player on foot (`deps.player().vehicle === null`) within `def.radius` metres (x/z distance) of a
    site -> `` `Browse ${def.name}` ``, else null. `interact()`: open that site's sheet.
  - The sheet: `ui = createDealerUi(deps.ui, { cards, acorns: () => deps.economy.state().acorns,
    insuranceFee: (p) => deps.ownership.feeFor(p), buy })`.
  - `cards(dealer)`: each stock row -> `{ id: s.id, name: fleetEntry(s.id)?.name ?? VEHICLES[s.kind].name,
    prefab: VEHICLES[s.kind].prefab, price: s.price, blurb: s.blurb, note }` (import `fleetEntry` from `../fleet`,
    `VEHICLES` and `MOWER_TINTS` from `../config`). `note`: garage not owned (`!lockup.owns(dealer.storageKind)`) ->
    `'Buy Hangar Two first'` (air) / `'Buy the Mossbank Boathouse first'` (water); `lockup.free(kind) === 0` ->
    `'Your Lock-Up is full'` / `'Hangar Two is full'` / `'The Boathouse is full'`; acorns < price ->
    `'Not enough Acorns'`; else null.
  - `buy(dealer, stockId, insure)`: find the row (unknown -> `'Not for sale.'`); recheck the same conditions as
    `note` (return a full sentence, e.g. `'You need Hangar Two at the Desert Airfield first.'`,
    `'Your Lock-Up is full. Scrap or sell one first.'`); total = price + (insure ? `ownership.feeFor(price)` : 0);
    acorns < total -> `` `That comes to ${total} Acorns. You have ${acorns}.` ``;
    snapshot `{ kind: s.kind, variant: fleetEntry(s.id) ? s.id : null, name, tint: fleetEntry(s.id)?.tints?.[0] ??
    MOWER_TINTS[Math.floor(Math.random() * MOWER_TINTS.length)], look: null, hp: 1, enginePitch: null }`;
    `rec = lockup.addSnapshot(snap)` (null -> return `'No room.'`); only then `economy.spend(price, dealer.name)`
    (the Acorn check above makes it succeed); `ownership.setBought(rec.uid, price)`; if insure
    `ownership.insure(rec.uid, price)`; `err = lockup.callDelivery(rec.uid, true)`; `hud.banner(`${name} is yours`)`;
    `hud.toast(err ? `It is waiting in your garage: ${err}` : `${dealer.keeper}: the Sling-Lift is bringing it round.`)`;
    `play('door')`; achievements (ids from `../econAchievements` `ECON_ACH`): `firstPurchase` always;
    `threeOfAKind` when `lockup.list().filter(r => r.kind === s.kind).length >= 3`; `allDealers` when for each
    storage kind `'ground'`, `'water'`, `'air'` some `lockup.list(kind)` record has `ownership.boughtFor(r.uid) !== null`.
    Return null.
  - `update(dt)`: while the sheet is open, every 1 s `ui.refresh()`; close it when the player is in a vehicle or more
    than `def.radius + 4` m from the open site.
  - `isOpen()`: `ui.isOpen()`.
  - `blips()`: one per site `{ x, z, color: PLACE_STYLE[k].color, kind: k, label: def.name }` with
    `k = 'dealer-car' | 'dealer-boat' | 'dealer-air'` for forecourt / boatyard / winglot (`PLACE_STYLE` from `../mapIcons`).
    Build the array once.

## Contract
`Dealers` and `DealersDeps` exactly as in the stub. Uses `Ownership.feeFor/setBought/insure/boughtFor`
(`src/ownership.ts`, implemented by another worker) and `createDealerUi` (another worker).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/dealers/runtime.ts`.

## Out of scope
`src/dealers/ui.ts`, `src/dealers/config.ts`, `src/app.ts` (already wired), `src/lockup/*`.
