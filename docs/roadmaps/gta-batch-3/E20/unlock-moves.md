# E20 unlock and world-change moves

E18's hand-off (`docs/roadmaps/gta-batch-3/E18/contracts.md`) lists side quests and world changes waiting for E20's
rows. When a row is built, its unlocks' `after` moves onto it and `planned` is dropped (`unlocks.test.ts`,
`worldChanges.test.ts` enforce it). Status below is filled at integration.

| side quest / change | was after | moves to | status |
|---|---|---|---|
| `sq-levelright-night-shift` | ch1-tax-break-in | m07-even-estates | done |
| `W02`, `W18` | ch1-tax-break-in | m07-even-estates | done |
| `sq-big-lou-embargo` | ch1-two-coat-tail | m09-where-asphalt-sleeps | done |
| `sq-dewdrop-1`, `sq-underspan-verticality` | ch1-founders-boot | m10-under-the-span | done |
| `nc-bent-pin` | ch1-tax-break-in | m11-the-dons-cigars | done |
| `sq-court-regulars` | ch1-founders-boot | m14-drainpipe-court | done |
| `nc-lockup` | ch2-dew-run | m17-the-dew-buyer | done |
| `sq-castaway-drydock` | ch2-sprinkler-gauntlet | m19-squall-box-forecast | done |
| `sq-porcelain-blues` | ch2-vespers-offer | m21-penthouse-viewing | done |
| `W05` | ch2-unmowed-tablet | m21-penthouse-viewing | done |
| `city-penthouse-exclusive` | ch2-vespers-offer | m22-off-air | done |
| `sq-fescue-fugitive` | ch2-unmowed-tablet | m24-the-burrow-door | done |
| `W06` | ch2-unmowed-tablet | m24-the-burrow-door | done |
| `nc-reedwatch`, `sq-burrow-post` | ch2-vespers-offer / ch2-unmowed-tablet | m25-one-leg-to-stand-on | done |
| `sq-flock-errands` | ch2-unmowed-tablet | m27-heap-of-trouble | done |
| `sq-dewdrop-2` | ch3-salvage-raid | m28-sibling-rivalry | done |
| `sq-hedgeworth-lost-balls` | ch3-salvage-raid | m29-the-kicked-board | done |
| `race-rookie-mowdown` | ch3-salvage-raid | m30-cams-big-night | done |
| `sq-windfall-croft-deed` | ch2-sprinkler-gauntlet | m31-granny-cracks | done |
| `nc-hangar-and-boathouse` | ch2-unmowed-tablet | m32-driftwoods-chart | done |
| `sq-dewdrop-3` | ch3-salvage-raid | m33-the-bench-lock | done |
| `nc-party` | ch2-unmowed-tablet | m34-forty-seven-wrenches | done |
| `W07` (builder) | m34-forty-seven-wrenches | built with m34 | done |

All moves above are done (`after` moved, `planned` dropped); `worldChanges.test.ts` turns W18 on from `m07-even-estates`.
Added: `sq-on-the-house` (L106) after `first-contract`. Not built (no quest yet): `sq-hyssop-stairwell` (#5),
`sq-chef-first-shift` (#13).
