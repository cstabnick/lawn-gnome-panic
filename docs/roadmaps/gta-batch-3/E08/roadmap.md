# E08 roadmap: economy, ownership and inventory

Brief: `../E08-economy-ownership-inventory.md`. Contracts for later epics: `contracts.md`. Issues: `issues/`.

## Goal

One purchase and ownership framework: three dealerships (cars, boats, aircraft) that sell into the player's garages
and deliver by Sling-Lift, many owned vehicles of one model each with their own look, Kiln-Shield cover with a reclaim,
a Repair tab at Pay 'n' Glaze and the Slipway, a bag of snacks and fun items, properties bought on a loan beside
Kiln-Debt, and a price rebalance with the grind curve pinned in a test.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| E08-0 foundation (lead) | `tsc` clean; save keys, loans, contracts, stubs, app wiring in place | written by the lead |
| E08-A build (all parallel) | game build, `npm test -w games/gnome-theft-auto`, prefabs + achievements tests, `npm run lore`, smoke | 15 |

One wide epic: every A issue owns its own file(s) against stubs that already export the final signatures, so all 15
ran at once. Hot files (`app.ts`, `saveIO.ts`, `cloudSave.ts`, `keys.ts`, `ui/actions.ts`, `types.ts`, `mapIcons.ts`
kinds, `lockup/runtime.ts`, `glazeShop.ts`, `glazeUi.ts`, the prefab catalog index) were edited once by the lead.

## Foundation (lead)

- `economy.ts`: `Loan`, `EconomyState.loans`, `borrow`, `payLoan`, `totalOwed` (old saves load with no loans).
- `ownership.ts`, `inventory.ts`: types, constants, registries, install helpers; `createOwnership` / `createInventory` stubs.
- `dealers/config.ts`: `DEALERS`, `DEALER_SITES` (one constant for E01 to move), `dealerPrice`.
- `lockup/runtime.ts`: `ownedUidOf`, `outVehicles`, `addSnapshot`, `onWrittenOff`, `free`.
- Per-uid look (L25): `glazeShop` `ownLook` / `keepOwnLook`, `takeWheel` skips the per-model loadout for owned vehicles.
- `PanelCtx.vehicle/spend/toast`, `CRAFT_PANEL_IDS += 'repair'`, `vehicles.ts mendVehicle`, `Player.jumpMult`.
- Save keys `gta-inventory-v1`, `gta-ownership-v1`; `KEYS.snack` (`1`); actions `bag` (More menu) and `snack` (dock).
- Map kinds `dealer-car`, `dealer-boat`, `dealer-air`; an orange "Your <vehicle>" blip for owned vehicles out.
- `app.ts`: creates and installs everything, prompts, frame updates, open-state checks, buff combination, blips.

## Issues (E08-A)

| Issue | Source | Files |
|---|---|---|
| A01 ownership | L15, contract | `ownership.ts`, `ownership.test.ts`, `economy.test.ts` |
| A02 inventory | L33 | `inventory.ts`, `inventory.test.ts` |
| A03 repair tab | L90 | `glazePanelRepair.ts` (+test), `glazePanels.ts` |
| A04 dealer sheet | L29 | `dealers/ui.ts` |
| A05 dealer runtime | L29, L25 | `dealers/runtime.ts` |
| A06 bag sheet | L33 | `bag/bagUi.ts` |
| A07 bag runtime | L33 | `bag/runtime.ts` |
| A08 snack pickups | L33 | `bag/pickups.ts` (+test) |
| A09 Kiln-Shield app | L15 | `lockup/insurance.ts` |
| A10 Ledger app | contract | `ledger.ts` |
| A11 dealer map icons | L25, L29 | `mapIcons.ts` |
| A12 prefabs | L29, L33 | `packages/prefabs/src/catalog/gta-economy.ts` |
| A13 achievements | all | `packages/achievements/src/catalog.ts`, `packages/prefabs/src/catalog/gta-economy-gear.ts` |
| A14 lore | all | `docs/lore/entries/apocrypha/*`, `docs/lore/rulings.md` |
| A15 money rebalance (Sonnet) | L32 | price tables across the game, `economyCurve.test.ts` |

The full text of each issue is in `issues/<id>.md`.

## Online and mobile

Economy, bag and ownership are per player (`docs/roadmaps/gta-online-sync.md`): no new net messages; a bought or
reclaimed vehicle reaches other players through the Sling-Lift's existing `shareVehicle`. Every sheet is a bottom sheet
with 44 px targets; the quick snack is a dock button; the bag is in the More menu and on the phone.

## Party slice

No change: the existing `gta-getaway` slice does not import any module this epic changes beyond `economy.ts` types.
