Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Pure logic and writing, no three.js, no DOM.

## Goal
`gnomazon/orders.ts`: the warehouse stock, orders (items, address, label choices, right box), parcel scoring, the
quota, and the lines of KPI-9 ("Kippy"), the relentlessly upbeat manager-bot.

## Read first
- `games/gnome-theft-auto/src/workplaces/gnomazon/types.ts`: `BoxSize`, `BOX_CAP`, `StockItem`, `Order`,
  `PackedParcel`, `ParcelScore`, `GNOMAZON`.
- `games/gnome-theft-auto/src/workplaces/gnomazon/orders.ts`: the stub (signatures to keep).
- `games/gnome-theft-auto/src/jobs/workDefs.ts`: `starsForScore`.

## Change
- `games/gnome-theft-auto/src/workplaces/gnomazon/orders.ts`:
  - `STOCK`: 12 items, each with a real prefab id. Use these (all exist): `old-trowel` (Trowel, 1), `watering-can`
    (Watering Can, 4), `flower-pot` (Flower Pot, 2), `rubber-duck` (Rubber Duck, 1), `bucket-and-spade` (Bucket and
    Spade, 3), `work-gloves` (Work Gloves, 1), `candle` (Candle, 1), `acorn-flour-sack` (Acorn Flour, 3),
    `rolled-doormat-pack` (Doormat, 4), `hose-reel` (Hose Reel, 5), `bin-bag` (Bin Bags (roll), 2), `ladder` (Step
    Ladder, 5). Before using each, confirm with `grep -rn "id: '<id>'" packages/prefabs/src/catalog`; replace any
    missing one with an existing prefab of a similar size. Ids: short lowercase words ('trowel', 'can', 'pot', ...).
    Emoji fallbacks.
  - `rightBox(items)`: the smallest of S, M, L whose `BOX_CAP` >= the sum of sizes (L if none fits... cap orders so
    that never happens).
  - `makeOrder(level, seed, id)`: seeded; 1 item at level 1, up to 2 at level 2-3, up to 3 at 4+; total size <= 10;
    `dest` from 16 lore-friendly Turfton/outskirts addresses ("12 Fern Row, Turfton", "The Mayor's Residence",
    "Flat 3B, Saucer Court", "Pebblewick Post Office", "Fort Sandpit (Gate 2)", "A tent, Mossy Wood", ...);
    `labels` = dest + 2 decoys that look alike (same street, another number, or a near-miss name), shuffled;
    `box = rightBox(items)`.
  - `scoreParcel(p)`: rightItems (picked equals order items as a multiset), rightBox (box === order.box), rightLabel,
    taped. score = 40*items + 25*box + 25*label + 10*taped, minus 1 per second over `GNOMAZON.fastS` (max -20);
    stars from `starsForScore`. `line` from `KIPPY_LINES.good` for 4-5 stars else a specific `bad` line about what
    went wrong (too-big box: "That box has room for feelings. We do not ship feelings.").
  - `quotaFor(level)`: `GNOMAZON.quotaBase + GNOMAZON.quotaPerLevel * (level - 1)`.
  - `KIPPY_LINES`: 8+ lines each for start, good, bad, idle, quota, end. Voice: a cheerful manager-bot who speaks in
    metrics and means well. Never cruel, never swears. ("Great job! You are 4% faster than yesterday's you.",
    "Hydration is a KPI. Please drink water at your earliest efficiency.", "Your smile has been logged.", "Break room:
    coming soon. Morale: coming sooner.", idle: "I see you are standing still. I respect it. I am timing it.").
- `games/gnome-theft-auto/src/workplaces/gnomazon/orders.test.ts` (new): every STOCK item has size 1..5 and a prefab;
  rightBox picks the smallest fitting box; orders are deterministic, fit in L, have 3 distinct labels including dest;
  scoreParcel gives 5 stars for a perfect fast parcel and fewer for each mistake; quotaFor rises with level.

## Contract
`STOCK`, `KIPPY_LINES`, `stockItem`, `rightBox`, `makeOrder`, `scoreParcel`, `quotaFor` with the stub signatures.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/workplaces/gnomazon/orders.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.

## Out of scope
`gnomazon/types.ts`, every other file.
