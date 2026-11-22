# Loot: tables, interiors, and a world that runs out

**The game is balanced around loot that does not come back.** Every unopened container is rolled once, from the seed,
and once it is empty, it stays empty. What tops the world up is small and controlled: foraging and farming (need
labour and safety), the Visitation trickle, and the **outside traders** who bring goods in from the Verge
([economy.md](economy.md#outside-traders)).

## Procedural interiors

The outside of the map is hand-made. Inside a building **shell** (its walls, doors and floors are in the level), the
rooms are generated from the seed when a chunk first loads, so a crypt you know from the outside is new inside on
every server.

| Shell | Room templates | Vertical | What varies |
|---|---|---|---|
| Family crypt | antechamber, coffin shelves (2–4 tiers), a side altar, a collapsed corner | shelves are climbable floors | which shelves hold what, a cave-in, a sealed inner door |
| The Great Crypt | 3 floors, a dome gallery, the ossuary stair | full | the route through, where the relic room is |
| Catacombs | passages, ossuary niches, flooded sumps, junction halls | 2–3 levels, ladder wells | the maze (graph from a seeded template set), the flooded parts |
| Chapel rooms | vestry, bell stair, organ loft, crypt under the altar | stairs and ladders | furniture layout, which cupboards are locked |
| Shed | shelf bays, sack piles, the paint corner, the fuel store | shelves 1–4 | which bays hold tools, seeds or salt |
| Columbarium niche | 1–3 niche rooms behind a broken plaque | niche rows | urns, past squatters' camps |
| Wheelie bin, vase, urn, bench box | single-container interiors | none | contents only |

Rules: generated rooms keep the shell's doors and routes, always connect, have at least one way out for a gnome and
never trap the player behind a door they can't open from inside. A test runs every shell × 500 seeds and checks this.

## Containers

Every container is a prefab ([items.md](items.md#prefab-mapping)) with a **container type** that picks its table:

`vase` · `urn` · `bin` · `grave-goods` (left on a grave) · `crate` · `sack` · `cupboard` · `chest` · `coffin-shelf` ·
`tool-bay` · `seed-tray` · `fuel-shelf` · `camp-cache` (an old gnome camp from the Scatter) · `body` (a shattered gnome
or Hatless) · `relic-box` (sealed crypts only).

## Loot tiers

| Tier | Name | What | Share of all items | Where |
|---|---|---|---|---|
| T0 | Scraps | twigs, pebbles, petals past their best, button | 35% | everywhere outdoors |
| T1 | Common | candles, plain food, rags, `tin-pail`, `old-trowel`, string | 40% | outdoors, bins, vases |
| T2 | Good | tools, seeds, salt, `glaze-pot`, armour, slingshots, maps | 18% | interiors, camp caches |
| T3 | Rare | iron tools, Black Dew, medicine, good armour, books | 6% | the Shed, crypts, the Vestry, old caches |
| T4 | Relic | Tall One things: a watch, a ring, a key, coins; `tall-eye-shard`; the `double-shotgun` | 1% | sealed crypts, the Great Crypt, the catacombs |

T4 relics are mostly useless to survive with. **Their value is that outside traders want them**, so they are how the
world pays for imports.

## Tables

A table is a list of weighted entries; each entry is a **tag query** or a specific item, with a count range and a
condition range. Tables stack: a container rolls its type's table, its zone's modifiers and the district's bias.

```ts
interface LootTable {
  id: string;                       // 'crypt.coffin-shelf'
  rolls: [min: number, max: number];
  entries: { pick: ItemId | TagQuery; weight: number; count: [number, number];
             condition: [number, number]; tier: 0 | 1 | 2 | 3 | 4 }[];
  empty: number;                    // chance the container is already empty (looted during the Scatter)
}
```

Example tables (first draft numbers; the sweeps in [evaluation.md](evaluation.md) set the real ones):

| Table | Rolls | Main entries (weight) | Empty |
|---|---|---|---|
| `vase` | 0–2 | petals (40), candle stub (20), water (20), wreath wire (10), a coin (2) | 30% |
| `bin` | 1–4 | food scraps (50), wrapper (as cloth) (20), string (10), a can (as `tin-pail`) (10), lighter (2) | 15% |
| `grave-goods` | 0–3 | candle (25), toy (15), flowers (25), a note (10), a trinket (5) | 40% |
| `crypt.coffin-shelf` | 1–3 | cloth (25), iron nail (20), candle (15), `brass-key` (5), relic (3) | 50% |
| `crypt.relic-box` | 2–4 | relic (60), `tall-eye-shard` (20), `gold-coins` (20) | 0% (sealed) |
| `shed.tool-bay` | 1–3 | DIG / PRY / CUT / HAMMER tool (60), string (20), glue (10), iron bar (10) | 35% |
| `shed.seed-tray` | 2–5 | `clover-seed` (40), grain (25), flower seed (25), acorn (10) | 25% |
| `shed.fuel-shelf` | 1–2 | Black Dew (60), `rust-oil` (30), rag (10) | 45% |
| `camp-cache` | 2–6 | preserved food (30), ammo (20), medicine (15), a map (10), a weapon (15), a note (10) | 20% |
| `vestry.cupboard` | 1–4 | candle (40), cloth (30), `glaze-pot` (10), book (10), key ring (5) | 30% |

Zone modifiers: `MOSSY` adds `moss-clump` and spoils food; `FLOODS` makes contents wet; `SACRED` zones cost standing to
loot; `NEST` zones roll one tier higher (nobody has dared to loot them).

## The loot budget

The authored map holds a fixed **budget** of each resource. These are the numbers we tune; the sim reports how fast
they're used.

| Resource (in units) | World budget at start | Population need | Lasts (no other source) |
|---|---|---|---|
| Food (meals; 1 meal = one gnome for one world-day) | ~45,500 (of 70,000 authored) | ~1,200 / day at the start | ~38 days flat; ~80 days with the expected decline and renewables ([economy.md](economy.md#1-set-the-budget-from-the-population-with-decline-built-in)) |
| Clean water (litres) | rain and the Tap: renewable | | (water is short in place, not in total) |
| Medicine (doses) | ~3,500 | ~60 / day (cracks, Grit, moss) | ~58 days |
| Ammo (shots) | ~25,000 | depends on fighting | ~40 days at Squeeze levels |
| Fuel (fire-nights) | ~9,000 + twigs (renewable, about half of need) | ~400 / day in winter, ~80 otherwise | through the third winter; the fourth is a planned crisis |
| Tools (DIG/PRY/CUT/HAMMER, condition) | ~2,400 tools | wear | ~90 days |
| Relics (T4) | ~600 | traders only | the trade budget for the whole world |

Renewable sources, at a full population, are kept **well under** need on purpose:

| Source | Target share of food at day 60 |
|---|---|
| Foraging (regrows per zone per season, over-foraging cuts it) | 15–25% |
| Gardens and farms | 20–40%, growing with safety |
| Fishing and trapping | 5–10% |
| Outside traders | 5–15% (more if the gates are safe) |
| Visitation | under 2% |

So the world can't feed everyone it starts with. The population has to shrink, farm, trade or take: the pressure that
drives the society simulation.

## Visitation

A few graves (seeded per night, weighted to the Child Graves, the Plaques and Angel Square) get fresh flowers, a
candle and sometimes a small toy or a coin overnight. NPCs believe stealing a Visitation is bad luck; only raiders
and the desperate do it. It is a tiny, lore-driven trickle (under 2% of food) and a reason to go out at dawn.

## Death and loot

- A shattered gnome drops everything in a `body` container, which lasts until looted. If it rises as a Hatless, it
  takes its worn gear with it (so the rich Hatless walking around are loot, and a lure).
- Caches survive their owner. The sim tracks "orphaned caches", a slowly growing hidden stock that trackers and lucky
  players find.
