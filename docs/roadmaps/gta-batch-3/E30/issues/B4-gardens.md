Epic: E30-B (Pardonlin content, all parallel)
Depends on: none (foundation in place)

## Environment and rules
Read `docs/roadmaps/gta-batch-3/E30/_district-common.md` first: it is part of this issue (types, helpers, prefab ids,
rules, checks). You own `games/gnome-theft-auto/src/pardonlin/districts/gardens.ts` (and optionally a new
`gardens.data.ts` beside it). Nothing else.

## Goal
`planGardens()` returns the Jardin and the Basin: Pardonlin's formal garden in the north, the Little Gardens
allotments and Basin Quay in the south. Fewer buildings, more gardening as a competitive sport.

## Your ground (world coordinates)
District rects (id `gardens`): Jardin x -1795..-1400, z -890..-540; Little Gardens x -1495..-1405, z 515..885;
Basin Quay x -1548..-1405, z 1005..1095.
- **The Jardin** (site `pl-jardin`, natural ground, gently uneven): the Thymes rises at its source (-1620,-880) and runs
  south through it: (-1620,-880) (-1610,-700) (-1625,-520) (nothing solid within 12.5 m of its centre line).
  Footpaths: `trail/jardin-est` (-1595,-860) (-1490,-830) (-1430,-720) (-1470,-580) (-1590,-540) and
  `trail/jardin-ouest` (-1645,-860) (-1740,-810) (-1775,-690) (-1730,-570) (-1645,-540) (two loops, 4 m wide).
  The garden gate anchor is at (-1415,-520) (the North Wicket road comes in at (-1400,-500)). E28 scatter put some trees
  and box balls here: that is fine. Build a **parterre** east of the river inside the jardin-est loop (centre about
  (-1510,-720)): a symmetric pattern of `euro-box-hedge` lines (1.96 m long, laid end to end with 2.0 m spacing) in
  squares and diagonals, `euro-topiary-spiral` / `-lollipop` / `topiary-cone` at the corners, `lavender-row`,
  `euro-geranium-bed`s, a `stone-fountain` at its centre, gravel walks (`euro-paving-tile` only on the main axis, at
  most 300 tiles), benches, `euro-plane-tree` avenues along the loop paths, a `euro-rose-arch` at the gate end.
  West of the river inside the jardin-ouest loop: a wilder "English corner" (meadow, a ruined `bandstand`? no: a
  `bench`, a `duck-house`, `hedgerow`, a folly made of a `euro-post-booth`).
- **The Little Gardens** (site `pl-allotments`, x -1490..-1412, z 520..880, flat): `pl-route-sud` runs west of it
  ((-1500,464) (-1520,650) (-1540,850)). Allotment plots in a grid (`allotment-bed`s, `euro-water-butt`s, sheds:
  `euro-post-booth` or `crate` stacks, `wheelbarrow`s, `pl-marrow`s, bean poles, scarecrow-free), a central path, a
  noticeboard full of passive-aggressive notices.
- **Basin Quay** (site `pl-harbour`, x -1548..-1405, z 1005..1095, flat): `pl-harbour-in` runs along its north edge
  ((-1400,1000) (-1480,995) (-1560,980)). The basin (still water) is west of x -1555. A `euro-canal-boathouse` facing
  the water (yaw -Math.PI/2) near (-1540,1040) if it fits with keepClear, mooring bollards (`euro-bollard`), crates
  (`cargo-crate`), a harbourmaster's kiosk (`euro-tabac-kiosk`), `pl-swan-pedalo` pulled up on the quay for repairs,
  railings, benches, lamp posts.
- Screenshot spots (keep them looking good): (-1600,-620) facing north into the Jardin; (-1451,640) facing north along
  the Little Gardens; (-1510,1020) facing north at Basin Quay.

## Design
- **Vignettes** (at least 4; make them your own): the topiary that went wrong (a hedge clipped into a lopsided
  croissant: a `topiary-cone` lying on its side `rot`, clippings, nail scissors = a `crate` and a sign); the marrow
  war (two plots side by side, a giant `pl-marrow` in each, a measuring post between them, an anonymous note on a
  board); the swan pedalo's retirement (pedalo on the quay, upside-down crate, toolbox, a "FOR SALE: one swan, slightly
  used, does not honk" poster); the escaped boules ball rolling into the parterre (a `pl-boule` mid-hedge, a rake);
  the angler who never catches (a stool on the basin edge, a rod, an empty bucket, a sign "Fish: 0. Patience: 12.").
- **Signs** (12+): Jardin rules ("Keep off the grass. Keep off the gravel. Keep calm."), allotment notices ("Whoever is
  measuring my marrow at night: I know."), harbour notices ("Moorings: by appointment. Appointments: by mooring."),
  street signs at the Jardin gate and the quay.
- **Residents** (3-4, ids fixed): `pl-gardener` Aurèle Clippe ('rake' or 'water' in the parterre: "One leaf. One. Out
  of line."), `pl-marrow` Wilhelmina Marrow ('measure' at her plot), `pl-harbourmaster` Captain Anchois ('check-watch'
  or 'take-notes' on Basin Quay); optionally an angler (`pl-gd-angler`, 'fish').

## Done when
See `_district-common.md` "Done when". Report your vignettes and residents with coordinates.
