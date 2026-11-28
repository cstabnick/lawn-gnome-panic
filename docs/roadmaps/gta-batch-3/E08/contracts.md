# E08 contracts: economy, ownership and inventory

What later epics (E10 homes, E16 farm, E18 activities, E07 Gnomlet) call. All paths under `games/gnome-theft-auto/src/`.
The game creates and installs one instance of each at start-up (`app.ts`), so content code can call the module-level
functions without a handle.

## Loans (`economy.ts`)

- `EconomyState.loans: Loan[]` with `Loan { id, name, principal, remaining }`. Older saves load with `loans: []`.
- `economy.borrow(id, name, amount): boolean` books (or adds to) a loan. No Acorns change hands.
- `economy.payLoan(id, amount): number` pays from the wallet; a loan paid to 0 is dropped.
- `economy.totalOwed()` = Kiln-Debt + every open loan.
- Kiln-Debt (`debtRemaining`, `debtPaidOff`, `payDebt`) is unchanged: loans are never part of it, so the debt quests
  and the "paid off" achievement behave as before. E10's "the apartment raises the debt" is shown as a loan line
  beside Kiln-Debt in the Ledger app (decision taken in the E08 brief).

## Properties (`ownership.ts`)

```ts
interface PropertyDef { id: string; name: string; price: number; down: number; interest?: number; blurb?: string }
registerProperty(def: PropertyDef): void          // at import time is fine; replaces the same id
listProperties(): readonly PropertyDef[]
buyProperty(id): { ok: true } | { ok: false; error: string }
  // spends def.down, books (price - down) * (1 + interest) as loan id = def.id, marks owned, persists
ownsProperty(id): boolean
onPropertyChange(cb: (id: string) => void): () => void   // install-time only: call after the game started
```

Owned properties save under `gta-ownership-v1`. The Ledger phone app (`ledger.ts`) lists every registered property
with a Buy button and every loan with Pay buttons, so E10/E16 only register defs and react to `onPropertyChange`.
A quest can call `buyProperty(id)` directly (E10's apartment quest).

## Inventory (`inventory.ts`)

```ts
type ItemKind = 'snack' | 'tool' | 'fun'
interface ItemDef { id; name; prefab; kind: ItemKind; heal?: number; effect?: ItemEffect; price?: number; blurb: string }
ITEMS: ItemDef[]; registerItem(def): void; itemDef(id)
addItem(id, n = 1): number   // how many fitted (STACK_MAX 9 per item)
useItem(id): boolean
count(id): number
onItemUse(cb: (def: ItemDef) => void): () => void
```

- Snacks heal `heal` (0..1 of full health) when used from the bag or the quick-use button (`bag/runtime.ts`).
- An item with `price` is sold by Crumbs & Co. (the bag's shop tab). E18 dishes and E16 produce: `registerItem` a def
  (prefab from `@lawn/prefabs`, `kind: 'snack'` with `heal` for food), then `addItem` when cooked / harvested.
- Effects (`ItemEffect`): `fizz`, `float`, `confetti`, `whoopee`, `patch`. A new effect needs a case in `bag/runtime.ts`.
- Saves under `gta-inventory-v1`.

## Owned vehicles (`lockup/runtime.ts`, `lockup/insurance.ts`, `dealers/config.ts`)

- `lockup.ownedUidOf(v): string | null`: the player's own vehicle (one world instance per uid). Owned vehicles keep
  their own Pay 'n' Glaze look; stock vehicles of the same model wear the per-model loadout as before (L25).
- `lockup.outVehicles()`, `lockup.addSnapshot(snap)`, `lockup.free(kind)`, `lockup.onWrittenOff(cb)`.
- `ownership.insured(uid)`, `ownership.insure(uid, value)`, `insurance.reclaim(uid)` (Kiln-Shield app on the phone).
  Fee 10 % of value, deductible 25 %, one reclaim per vehicle per 10 minutes, uninsured write-offs stay lost.
- `DealerDef { id, name, keeper, storageKind, stock: DealerStock[], radius, sign }` in `DEALERS`; a story epic pushes
  `DealerStock { id, kind, price, blurb }` rows to add stock. `dealerPrice(kind, variant)` prices any model.
- `DEALER_SITES` is the single constant holding the three dealership positions. E01: move them onto your reserved
  dealership sites there; `dealers/runtime.ts` searches outward from each point for clear dry ground.

## Pay 'n' Glaze Repair tab

`glazePanelRepair.ts` `repairPanel`, registered with `registerGlazePanel(repairPanel, 60)`; it also shows in the
Wingwright's Slipway (`CRAFT_PANEL_IDS` includes `'repair'`). `PanelCtx` gained optional `vehicle()`, `spend()` and
`toast()` so any panel can sell a service on the vehicle on the stage. Price: `repairQuote(hp, damage, kind)`.

## Save keys

`gta-inventory-v1`, `gta-ownership-v1` (both in `GTA_SAVE_KEYS` and `cloudSave.ts` MERGES as "newer side wins").

## Phone apps (for E07's Gnomlet migration)

Added through `phone.addApp`: `bag` (Bag, 🎒), `kiln-shield` (Kiln-Shield, 🛡), `ledger` (Ledger, 📒). The dealership
showroom opens on foot at the site, not from the phone.
