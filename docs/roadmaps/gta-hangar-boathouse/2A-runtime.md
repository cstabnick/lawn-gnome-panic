Epic: 2 Runtime (Hangar Two and the Mossbank Boathouse, Gnome Theft Auto)
Depends on: Epic 1 (done: deeds.ts, waterSpot.ts, stripSpot.ts, estates.ts, ui.ts tabs exist)

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash; use absolute paths). Game:
games/gnome-theft-auto (Vite + TypeScript + three.js). If node/npx is not found: export PATH="/c/Program Files/nodejs:$PATH".
Other planners' workers edit other files of this game at the same time: touch ONLY the files listed under Change. Do
not commit, push, stash, switch branches, run vite build / npm run build, or start a dev server. Do not edit
AGENT_INDEX.md. tsc over the whole game may show errors in files other workers are editing; only errors in YOUR files
matter.

## Goal
The Lock-Up runtime (lockup/runtime.ts) runs all three garages: the Side-Valve Lock-Up (ground, always owned), Hangar
Two (air) and the Mossbank Boathouse (water). The player buys the hangar / boathouse on foot at its site, stores
aircraft / boats there, takes them out there, and calls any of them in from the phone's Sling-Lift app, with a drop rule
per kind. Achievements, and debug functions for the trainer.

## Read first
- games/gnome-theft-auto/src/lockup/runtime.ts (all; this is the file you change).
- games/gnome-theft-auto/src/lockup/config.ts: `LOCKUP` (sites now has 'hangar-two' (air) and 'mossbank-boathouse'
  (water); `delivery.air`, `delivery.water`) and `ESTATES` (hangar / boathouse: kind, siteId, name, price;
  achievements: both, hangarFull, boathouseFull).
- games/gnome-theft-auto/src/lockup/types.ts: `DeedStore`, `EstateKind`, `WaterSpotOpts`, `StripOpts`.
- games/gnome-theft-auto/src/lockup/deeds.ts (`createDeedStore`), waterSpot.ts (`findWaterSpot`), stripSpot.ts
  (`findStripSpot`), ui.ts (`LockupUiDeps`: `fee(kind)`, optional `tabs()`, `placeName(kind)`).
- games/gnome-theft-auto/src/config.ts: `AIRFIELD` (x, z: the runway centre), `VEHICLES[kind].fixedWing`,
  `VEHICLES[kind].air?.regime` ('fixed-wing' | 'rotor' | 'buoyant').

## Change
games/gnome-theft-auto/src/lockup/runtime.ts:
1. Imports: `ESTATES` (with LOCKUP) from './config'; `createDeedStore` from './deeds'; `findWaterSpot` from
   './waterSpot'; `findStripSpot` from './stripSpot'; `AIRFIELD` (with MOWER_TINTS, VEHICLES) from '../config'; types
   `DeedStore`, `EstateKind` from './types'.
2. `LockupDeps`: add `/** The deeds to use (tests); default createDeedStore(localStorage). */ deeds?: DeedStore;`
3. `Lockup` interface, debug section, add:
   ```ts
   /** Whether the player owns the garage for kind ('ground' always). */
   owns(kind: StorageKind): boolean;
   /** Buy Hangar Two ('air') or the Mossbank Boathouse ('water') (free: no Acorns). Error sentence or null. */
   buy(kind: EstateKind, free?: boolean): string | null;
   /** Debug: give a garage back (its stored vehicles stay saved). False when it was not owned. */
   sell(kind: EstateKind): boolean;
   ```
4. Helpers inside createLockup:
   - `const deeds = deps.deeds ?? createDeedStore();`
   - `estateOf(kind: StorageKind)`: ESTATES.hangar for 'air', ESTATES.boathouse for 'water', null for 'ground'.
   - `placeName(kind)`: 'the Lock-Up' | 'Hangar Two' | 'the Mossbank Boathouse'. `tabLabel(kind)`: 'Lock-Up' |
     'Hangar Two' | 'Boathouse'.
   - `feeFor(kind)`: ground `LOCKUP.delivery.fee`, air `LOCKUP.delivery.air.fee`, water `LOCKUP.delivery.water.fee`.
   - `ownedKinds()`: `STORAGE_KINDS.filter((k) => deeds.owns(k))` (import STORAGE_KINDS from './types').
   - `fullAchievement(kind)`: ground 'gta-lockup-full', air ESTATES.achievements.hangarFull, water
     ESTATES.achievements.boathouseFull.
   - `checkLanded()`: if deeds.owns('air') && deeds.owns('water') unlock ESTATES.achievements.both. Call it once right
     after creating the deeds (a save that already owns both) and after every purchase.
   - `isFixedWing(kind: VehicleKind)`: `!!VEHICLES[kind].fixedWing || VEHICLES[kind].air?.regime === 'fixed-wing'`.
5. `storeVehicle(v)`: after `cannotStore`, if `!deeds.owns(kind)` return
   `You do not own ${estateOf(kind)!.name} yet.`. The full message becomes
   `${cap(placeName(kind))} is full (n/n). Scrap one first.` (cap = first letter upper case). The toast becomes
   `${name} stored in ${placeName(kind)} (a/b).`. On full, unlock `fullAchievement(kind)` (NOT always 'gta-lockup-full').
6. `takeOut(uid)`: the drop spot depends on the kind, searched around the site (maxDist 30):
   - ground: as now.
   - air: `findSafeSpot(site.x, site.z, deps.probe, { radius: A.clearRadius, minDist: 4, maxDist: 30, maxSlope:
     A.maxSlope, maxWater: LOCKUP.delivery.maxWater })` with A = LOCKUP.delivery.air.
   - water: `findWaterSpot(site.x, site.z, deps.probe, { radius: W.clearRadius, minDist: 4, maxDist: 30, minDepth:
     W.minDepth })` with W = LOCKUP.delivery.water (its y is the water surface).
   - Messages: `No room outside ${placeName(kind)} right now.` and toast `${rec.name} is out of ${placeName(kind)}.`
7. `callDelivery(uid, free)`: remove the "only carries ground vehicles" refusal. `const kind = store.kindOf(uid)!;`
   if `!deeds.owns(kind)` return `You do not own ${estateOf(kind)!.name}.`. fee = feeFor(kind) (the fee check and
   `economy.spend` use it). Replace the spot search with a helper
   `deliverySpot(kind: StorageKind, vk: VehicleKind, x: number, z: number): { spot: DropSpot; note: string } | string`
   (string = the refusal):
   - ground: as now (findSafeSpot with spotOpts(D.maxDist) then spotOpts(D.searchMax)); refusal
     'Nowhere dry and flat to set it down near you.'
   - water: `findWaterSpot(x, z, probe, { radius: W.clearRadius, minDist: W.minDist, maxDist: W.maxDist, minDepth:
     W.minDepth })` then the same with maxDist W.searchMax; refusal
     'No open water near you deep enough for a boat. Get closer to a shore.'
   - air and isFixedWing(vk): S = LOCKUP.delivery.air.strip; opts `{ radius: S.radius, length: S.length, minDist:
     S.minDist, maxDist: S.maxDist, maxSlope: S.maxSlope, maxWater: S.maxWater }`: findStripSpot near (x, z), then with
     maxDist S.searchMax; if still none, `findStripSpot(AIRFIELD.x, AIRFIELD.z, probe, { ...opts, minDist: 0,
     maxDist: 60 })` with note 'No room for a take-off run near you: it is going to the Desert Airfield.'; refusal
     'Nowhere clear to set it down.'
   - air otherwise (rotor craft, the balloon): findSafeSpot with `{ radius: A.clearRadius, minDist: D.minDist,
     maxDist: D.maxDist, maxSlope: A.maxSlope, maxWater: D.maxWater }`, then maxDist D.searchMax; refusal
     'Nowhere clear and flat for an aircraft near you.'
   The on-its-way toast appends the note when there is one. Everything else in callDelivery stays (the flight, the
   rig, register, the one-instance rule).
8. Buying: `buy(kind, free = false)`: e = estateOf(kind) (null -> 'Nothing to buy.'); owned ->
   `You already own ${e.name}.`; if !free: acorns < e.price or `!deps.economy.spend(e.price, e.name)` ->
   `${e.name} costs ${e.price} Acorns. You have ${acorns}.`. Then `deeds.grant(kind)`, `deps.hud.banner(`${e.name} is yours`)`,
   toast `Three ${kind === 'air' ? 'bays for your aircraft' : 'slips for your boats'}. Call them in from the phone's Sling-Lift.`,
   `deps.play('door')`, `checkLanded()`, return null. `sell(kind)` = `deeds.revoke(kind)` (also close the sheet if
   open on that kind: just `ui.close()` when ui.isOpen()).
9. `prompt()`: on foot at a site: not owned -> `Buy ${site.name} · ${price} Acorns`; owned -> `Open ${site.name}` (as now).
   `interact()`: not owned -> `const err = buy(site.storageKind as EstateKind); if (err) { toast(err); play('alarm'); }`;
   owned -> open the sheet as now.
10. Store button / T key: the button shows only when the site's kind is owned (and matches the vehicle as now); its
    text is `🔒 Store in ${site.name}` (set textContent only when it changed). T at an unowned site whose kind matches
    the vehicle: toast `You do not own ${site.name} yet: buy it on foot (${price} Acorns).`
11. The sheet (createLockupUi deps): `fee: (k) => feeFor(k)`, `tabs: () => ownedKinds().map((k) => ({ kind: k, label:
    tabLabel(k) }))`, `placeName`. The Sling-Lift phone app: detail = the owned kinds joined with ' · ', each
    `${tabLabel(k)} ${store.list(k).length}/${store.capacity(k)}`, plus ` · from ${LOCKUP.delivery.fee} Acorns`; run
    opens `ui.open(lastKind, 'phone', 'Sling-Lift')` where lastKind starts 'ground' (keep it simple: always 'ground' is
    fine, the tabs switch).
12. The 2 s sync write-off toast: `Your ${v.spec.name} was written off. Its slot in ${placeName(kind)} is free.` (read
    the kind with store.kindOf(uid) before removing).
13. Update the header comment (3 lines) to mention Hangar Two and the Mossbank Boathouse.

games/gnome-theft-auto/src/lockup/runtime.test.ts (new, vitest). Start with
`vi.mock('../audio', () => ({ play: () => undefined }));` and `installFakeDom()` from '../testing/fakeDom', then
dynamic-import createLockup, createLockupStore, createDeedStore. Fake deps: `scene: new THREE.Scene()`,
`ui: document.createElement('div')`, hud `{ toast: vi.fn(), banner: vi.fn() }`, an economy with `state()` returning
`{ acorns }` and `spend(n)` that subtracts and returns true when it can, `earn`, `play: vi.fn()`, `vehicles: []`,
`player: () => ({ x, y: 0, z, vehicle: null })` with x / z you set per test, `stepOut: vi.fn()`, `blocked: () => null`,
a probe object you can swap, `achievements: { unlock: vi.fn() }`, `phone: { addApp: vi.fn() } as never`, a memory
storage for `store: createLockupStore(mem, { ground: 5, air: 3, water: 3 })` and `deeds: createDeedStore(mem2)`. Tests:
- player on foot at the hangar site (480, -70): prompt() is 'Buy Hangar Two · 1200 Acorns'; with 100 Acorns interact()
  does not buy (owns('air') false); with 2000 Acorns interact() buys (owns('air') true, Acorns 800) and prompt() is
  'Open Hangar Two'.
- buy both with free=true unlocks 'gta-landed-gnome'.
- `addRecord('clog-cruiser')` makes a water record; callDelivery on it before buying the boathouse returns a sentence
  containing 'do not own'; after `buy('water', true)`, with a probe that is dry everywhere it returns the open-water
  refusal; with a probe that is 3 m deep everywhere and never blocked (ground -3, water 3, slope 0) it returns null and
  60 Acorns were spent.
- `addRecord('hedge-hopper')` with the hangar bought and a flat dry open probe: callDelivery returns null.
Keep the tests to these; if building a vehicle in a test fails for a reason outside runtime.ts, say so.

## Contract
Everything already in `Lockup` stays with the same signatures; `owns`, `buy`, `sell` are added. app.ts (planner) calls
`createLockup({...})` without `deeds` and exposes the object as `window.__gta.lockup`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/lockup/` passes (all lockup tests).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in lockup/runtime.ts / runtime.test.ts.

## Out of scope
Every other file (lockup/ui.ts, deeds.ts, spot finders, estates.ts, config.ts, app.ts, craft/, phone/).
