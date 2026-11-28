# E10 Homes and downtown life: roadmap

Brief: [../E10-homes-and-downtown-life.md](../E10-homes-and-downtown-life.md) (L21, L22, L58), adjusted to the merged
contracts: E01 sites (`saucer-court`, `home-01`..`home-07`), E05 `defineInterior` + Flat 3B shell, **E08: the flat's
loan sits beside Kiln-Debt (R-169), not inside it**, E06 `advanceWorldTime` for sleeping, E07 Gnomlet apps.
Contracts this epic gives later epics: [contracts.md](contracts.md).

## Decisions

- Quest #2 `m02-roof-on-credit` (story-outline row 2) is built here as a chapter-1 story quest after the prologue
  (giver Side-Valve; the giver offers it before Mower's Keepers). `first-contract`'s prereq is left for E20.
- The loan is signed when the quest's bank step is done (the quest runtime's objective-start hook), not by a separate
  button, so the quest sim needs no new probe; saves past that step are caught up at load.
- Customisation is free placement on a 0.25 m grid with quarter-turn yaw (pure model `home/layout.ts`), edited in a
  top-down plan panel (touch drag, nudge, rotate, store) that moves the live room and rebuilds it (E05 runtime gained
  `refreshInterior()`; colliders are now replaced per build). The layout has a `kind` ('flat' now, 'cabin' reserved for
  homes "out in the field").
- Saucer Court: the downtown tower on block (30, 90) is removed (its random draws kept); E10 builds three low wings
  round the saucer courtyard; Flat 3B's door moves to the stairwell in the courtyard.
- Homes: every bible character has a home and workplace row (`homes/data.ts`); E10 builds home-01..07 (+ Saucer
  Court); `existing:` homes reuse their stages (data only); `site:` homes are the area epics'; hidden homes are data only.
  Two walk-in homes: townhouse 404 (Reginald) and Diggs' bungalow.
- Online: homes are per player and local (save `gta-home-v1`); nobody visits another player's flat; character homes are
  static world identical for all. No net messages.
- Map: a home shows on the map only after the player stood at its door (House Call achievement); the own flat always.

## Shape

| Epic | Issues | Done when |
|---|---|---|
| E10-0 foundation (lead) | home/types.ts, home/layout.ts, homes/types.ts, homes/pieces.ts, homes/data.ts stub, interiors runtime refresh, save keys, PropertyDef.buyHint, Saucer Court tower removed | tsc + interiors/save tests |
| E10-A parallel | 13 issues in [issues/](issues/) (A1-A3 flat, B1-B5 homes, C1-C2 quests, D1-D3 prefabs/achievements, map, lore) | build, tests, lore |
| E10-B integration (lead) | app.ts wiring, contracts, screenshots, smoke, zfight | all checks |

Issue files (each is the full text a worker got): A1-flat-room, A2-decorate-panel, A3-home-runtime, B1-homes-table,
B2-saucer-court, B3-town-homes, B4-outer-homes, B5-home-interiors, C1-roof-on-credit, C2-home-stops,
D1-prefabs-achievements, D2-home-visits-map, D3-lore. Shared environment: issues/_env.md.
