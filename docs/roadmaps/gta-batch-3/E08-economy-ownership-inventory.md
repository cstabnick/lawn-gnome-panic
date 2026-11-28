# E08 Economy, ownership and inventory
Wave: 2 · Depends on: none (E01 only for new shop sites; use fixed slots and move later) · Kind: Engine
Source items:
- L15 add insurance, so that I can reclaim my vehicle for a price
- L25 garage and persoanl vehicle - personal vehicle shouldn't be very car of same type. allow storage of multiple cars of same type. also mark it on map where to store
- L29 give a shop where i can buy new cars. new shop for boats too. new shop for aircraft
- L32 rebalance money a little. equipment should be a bit more expensive. make sure we have soem gridn but don't have to endlessly grind
- L33 introduce an inventory for snacks that heal and maybe some other fun things
- L90 add repair option to pay and glaze

## Goal
One purchase and ownership framework that later epics call instead of each inventing a shop: buy vehicles (cars, boats,
aircraft) at three dealerships, own several of one type, insure and reclaim a lost vehicle, repair at Pay 'n' Glaze, carry
consumable snacks that heal, buy property with a loan on top of Kiln-Debt (E10 home, E16 farm), and a rebalanced price table.

## Scope
In:
- An `ownership` module: a typed catalogue of purchasable things (vehicle, property, consumable), a `purchase()` that debits
  Acorns or books a loan, and an owned-vehicle registry that tells "my vehicle" apart from a stock one of the same kind (L25).
- Three dealerships (cars/ground, boats, aircraft) as world sites with a showroom UI built on the Pay 'n' Glaze stage; a bought vehicle is delivered through the existing Sling-Lift.
- Insurance: a policy fee, then "Reclaim" in the phone for a lost, destroyed or sunk owned vehicle for a deductible.
- Garage upgrade: many stored vehicles of one type (the lockup store already keys by `uid`; the gap is the "personal vehicle is every car of the type" assumption in loadouts), and map markers for store spots.
- Pay 'n' Glaze **Repair** tab (price from missing hp and damage level), also in the craft shop for boats and aircraft.
- Inventory: consumable items (snacks heal), a small bag UI, a quick-use slot, a mobile button, pickups and shop sales.
- Property API with debt: `buyProperty(def)` books a loan; the home and farm epics only add defs.
- Money rebalance pass over equipment prices and job pay, with the grind curve pinned in a test.

Out: building the home (E10) or the farm (E16); chef recipes (E18; they only call `addItem`); new vehicle models (use existing `VehicleKind`s and `FLEET` variants); interiors (E05); new breakable parts (E02, L53).

## Code pointers (confirmed)
All under `games/gnome-theft-auto/src/`.
- `economy.ts`: `createEconomy()` returns `Economy { state(), earn, spend, payDebt, chargeHospital, inFraudZone, onPlayerRagdollImpact }`; `STARTING_ACORNS = 50`, `STARTING_DEBT = 5000`, `HOSPITAL_FEE = 25`; key `gta-economy-v1`; `EconomyState { acorns, debtRemaining, debtPaidOff }`. Loans extend this state; keep parsing backwards compatible.
- `lockup/types.ts`: `StoredVehicle` (unique `uid`, `kind`, `variant`, `tint`, `look`, `hp`, `storedAt`), `StorageKind` ground|air|water, `LockupSite`. `lockup/config.ts`: `LOCKUP.sites`, `LOCKUP.capacity {ground 5, air 3, water 3}`, `scrapValue`, `delivery.fee/air.fee/water.fee`, `sling`; `ESTATES` (Hangar Two 1200, Mossbank Boathouse 800). `lockup/runtime.ts`: `createLockup`, `buy(kind)` (~l.197, spends via `deps.economy.spend`), `storeVehicle` (~l.209), phone app (~l.396). `lockup/deeds.ts` `createDeedStore` (key `gta-estates-v1`), `lockup/store.ts` `createLockupStore`, `lockup/marking.ts`, `lockup/sling.ts` (`planSling`, `stepSling`), `lockup/ui.ts` `createLockupUi` (modes 'phone' | 'site').
- Phone: `phone/phone.ts` `Phone.addApp(PhoneApp { id, label, icon, detail?, run })`. Existing callers: `app.ts:680`, `city/exchangeApp.ts:212`, `jobs/runtime.ts:610`, `tubing/runtime.ts:640`, `lockup/runtime.ts:396`.
- Pay 'n' Glaze: `glazeShop.ts` `createGlazeShop`; `glazePanels.ts` (`registerGlazePanel(panel, order)`, built-ins at 10..50, `glazePanelsFor(kind)`, `Panel.appliesTo`); `glazeUi.ts` (`Panel`, `PanelCtx`); `glazeStore.ts` (`ownedLoadout(kind)`, `saveOwnedLoadout`, `GLAZE_SAVE_KEY 'gta-glaze-v1'`, per-**kind** loadouts); `garages.ts` (`GarageDeps.repairVehicle`, `RESPRAY_COST = 50`, `onPurchase`). `craft/craftShop.ts` (Wingwright's Slipway) also uses `glazePanelsFor`, with `craft/craftPanels.ts` (`CRAFT_PANEL_IDS`, `registerCraftPanels`) and `craft/tuning.ts` (`tuneCost`).
- Damage model: `vehicles.ts` `damageVehicle` (~l.134), `explodeVehicle` (~l.144), `repairVehicle` (~l.174), `damageLevelFor(hp, stages)`; `debris.ts` (`DEBRIS`, `createDebris`, `hiddenBetween`, `stripLooseParts`); `fleet.ts` (`FLEET`, `FleetEntry`, `applyVariant`, `spawnFleet`); prefab stages in `packages/prefabs/src/catalog/damage-stages.ts`. Repair price must read the damage level and `hp`, not a fixed part list, because E02 adds parts.
- Prices to rebalance (confirmed): `gunMods.ts` (`price` 60..400), `gunShop.ts` (order fee), `fishing/tackle.ts` (`RODS` 20..1200, `BAITS`), `hunting/species.ts` (`LODGE`, sell values), `craft/tuning.ts`, `glazePanel*.ts`, `jobs/defs.ts` (`licence`, 0..150) and `jobs/career.ts`, `config.ts` (`PAY_N_GLAZE`, `SIDE_VALVE`), `outskirts/shopItems.ts`, `vending.ts`.
- Player health: `types.ts` `Player.health` (0..1, ~l.382); hospital flow `app.ts:1304` (`chargeHospital`). Snacks heal through the same field.
- Saves: `saveIO.ts` `GTA_SAVE_KEYS` (add keys here), `cloudSave.ts` `MERGES: Record<GtaSaveKey, ...>` (a missing entry fails to compile), `saveIO.test.ts` (asserts the exact key set and builds a sample bundle).
- Prefabs to reuse: `packages/prefabs/src/catalog/consumables.ts` (`red-mushroom`, `honeydew-flask`, potions), `gta-lockup.ts`, `gta-fleet.ts`, `gta-hangar-boathouse.ts`, `damage-stages.ts`.

## Contracts this epic provides
- Economy: a loan line beside Kiln-Debt (`borrow`, `payLoan`, `state().loans`); Kiln-Debt stays the headline number and its "paid off" logic is unchanged.
- `ownership.ts`: `registerProperty(def)`, `buyProperty(id)`, `ownsProperty(id)`, `onPropertyChange(cb)`, with `PropertyDef { id, name, price, down, interest? }`. E10 registers the home and apartment; E16 registers the farm.
- `inventory.ts`: `ITEMS` registry (`ItemDef { id, name, prefab, kind: 'snack' | 'tool' | 'fun', heal?, effect? }`), `addItem`, `useItem`, `count`, `onItemUse`. E18 dishes and E16 produce add defs and call `addItem`.
- Owned vehicles: `ownedUidOf(v)`, `reclaim(uid)`, `insured(uid)`; `DealerDef { id, storageKind, stock }` as data so a story epic can add stock.
- `registerGlazePanel(repairPanel, 60)`.
- Save keys: `gta-inventory-v1`, `gta-ownership-v1` (properties, insurance).

## Contracts this epic consumes
None required. Optional from E01: site-registry slots for the three dealerships. Until then use free spots near Side-Valve (`SIDE_VALVE.bay`), Wally's desk (500, -80) and the Loch Moss dock (`jobs/defs.ts` boat depot), and list them for E01 to adopt.

## Online / mobile / achievements / prefabs / lore notes
- Online (`docs/roadmaps/gta-online-sync.md`): economy and inventory are per player; a bought vehicle spawns through the existing vehicle share (`shareVehicle` in `app.ts`), so others see only the vehicle. No new net messages.
- Mobile: dealership, repair and bag UIs are bottom sheets with 44 px targets; quick-use is a `dockButton` (`ui/dock.ts`) registered with `registerAction` (`ui/actions.ts`) plus a `KEYS` entry (`keys.ts`).
- Achievements: add to `packages/achievements/src/catalog.ts` (first purchase, three of one type, first reclaim, first snack); cosmetic rewards for head/back/neck/hand slots; `npm test -w packages/achievements`.
- Prefabs: snacks reuse `consumables.ts`; any new snack or dealership prop goes into the right `packages/prefabs/src/catalog/` file; `npm test -w packages/prefabs`.
- Lore: `npm run lore -- find` for Kiln-Debt, Side-Valve, Wally, Driftwood, Wingwright; add an entry per dealership and the insurer; `npm run lore` must pass.

## Risks and open questions (decisions taken)
- "Personal vehicle is every car of the type": loadouts are keyed by `VehicleKind`. Decision: keep the per-kind loadout as the default look, add per-uid look only for owned vehicles; no save migration.
- Vehicle-shop stock: existing `VehicleKind`s and `FLEET` variants only, priced by spec tier.
- Rebalance can break quest-sim and Acorn-dependent tests (`questSim/`, `economy.test.ts`). Decision: raise equipment prices about x1.5 to x2, raise job and quest pay about x1.2, keep story rewards, add `economyCurve.test.ts` pinning hours-to-afford from job pay.
- Insurance abuse: deductible 25 percent of purchase price, one reclaim per vehicle per 10 minutes; uninsured losses stay lost. Not to be re-asked.
- Property loans: a second balance on `EconomyState`, shown beside Kiln-Debt, so the debt quests and "paid off" achievement keep working.
- Size: if decompose exceeds about 30 issues, defer the rebalance sweep and the boat/aircraft dealerships to a follow-up and report.

## Done when
- `npm run build -w games/gnome-theft-auto`
- `npm test -w games/gnome-theft-auto` (existing `economy.test.ts`, `saveIO.test.ts`, `cloudSave.test.ts` plus new `ownership.test.ts`, `inventory.test.ts`, `economyCurve.test.ts`)
- `npm test -w packages/prefabs` and `npm test -w packages/achievements`
- `npm run lore`
- Dev server up: `bash tools/smoke.sh <url> <dom-marker>...` clean; phone viewport 390x844 walkthrough: buy a car, store two of one type, wreck and reclaim one, repair at Pay 'n' Glaze, eat a snack, buy a test property.
