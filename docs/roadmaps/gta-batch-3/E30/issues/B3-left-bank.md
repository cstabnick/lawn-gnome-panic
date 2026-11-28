Epic: E30-B (Pardonlin content, all parallel)
Depends on: none (foundation in place)

## Environment and rules
Read `docs/roadmaps/gta-batch-3/E30/_district-common.md` first: it is part of this issue (types, helpers, prefab ids,
rules, checks). You own `games/gnome-theft-auto/src/pardonlin/districts/leftBank.ts` (and optionally a new
`leftBank.data.ts` beside it). Nothing else.

## Goal
`planLeftBank()` returns the Left Bank: the arty, poorer, louder west bank. Radio Adagio in the Opera Hall, the Beetle
Market, artists' terraces along the Boulevard and the backyards strip with European backyard styling.

## Your ground (world coordinates)
District rects (id `left-bank`): A x -1795..-1626, z -460..400; B x -1795..-1700, z 400..900.
- `pl-boulevard` (7 m): (-1690,-420) (-1700,-300) (-1695,-170) (-1705,-30) (-1700,110) (-1695,250) (-1705,380).
- `pl-rue-ouest` (a loop): (-1690,-420) (-1745,-390) (-1760,-300) (-1770,-170) (-1765,-30) (-1772,110) (-1765,250)
  (-1735,370) (-1705,380).
- Bridge roads from the east bank: `pl-pont-nord` z -300 (x -1578..-1760), `pl-pont-neuf` z -30 (x -1575..-1765),
  `pl-pont-sud` z 250 (x -1580..-1765). Cross streets `pl-rue-e` z -170 (x -1695..-1770), `pl-rue-f` z 110
  (x -1700..-1772).
- `pl-route-sud-ouest`: (-1705,380) (-1690,600) (-1660,850) (-1650,978) (rect B lies west of it).
- Footpath `trail/rive-gauche` (4 m): (-1633,-420) (-1623,-300) (-1628,-170) (-1633,-30) (-1623,110) (-1628,250)
  (-1638,380). The Thymes is east of it (nothing solid within 12.5 m of its centre line, about x -1605..-1625).
- The world fence is at x -1795: keep buildings 3 m off it.
- Sites: **Radio Adagio** block x -1686..-1638, z -150..-50: the `euro-opera-hall` (16 x 14 x 13, apron 3) centred at
  (-1668,-100) with yaw -Math.PI/2 (its front faces west onto the Boulevard; front wall at x -1675). Keep the ground
  x -1684..-1676, z -104..-96 clear (the interior door spot is at (-1680,-100)). Put `pl-horn-speaker` (a horn on a
  4 m post, solid `{ r: 0.3, h: 4 }`) exactly at (-1684,-106): Radio Adagio plays from it. A forecourt of paving
  tiles, two `pl-cello`s and a `pl-music-stand` (the orchestra's smoking break without the smoking: they just stand
  about), a banner "RADIO ADAGIO 96.1 — Now broadcasting: silence (scheduled)".
  **The Beetle Market** block x -1755..-1711, z 125..235: `euro-market-hall` plus rows of `market-stall`s, crates of
  produce (`pl-produce-crate`, tints), `pl-cheese-wheel` stacks, `cheese-wedge`, `bread-loaf`, the crêpe-van parking
  spot (a painted bay is not needed: two bollards). Put a `pl-gramophone` at (-1733,170) on a stall counter (y about
  0.9): the market's crackling stall radio, a Radio Adagio speaker. **The backyards** (rect B): a terrace row along the
  rect's east side facing east to the road (`frontage('pl-route-sud-ouest', ...)` with an offset that keeps the row
  inside x < -1700), and behind each house (west) a walled back garden down to the fence: `euro-ivy-wall` sections
  between gardens, `euro-washing-line`, `euro-vine-pergola` + `euro-bistro-set`, `euro-espalier-pear` on walls,
  `euro-water-butt`, `euro-geranium-bed`, `euro-boules-court`, `euro-rose-arch`, `allotment-bed`, gnome-scale chaos.
- Screenshot spots (keep them looking good): (-1712,-100) facing east at Radio Adagio; (-1733,120) facing north into
  the Beetle Market; (-1740,600) facing north along the backyards.

## Design
- **Terraces** along the Boulevard (both sides where the rect allows), rue-ouest's inner side, the bridgeheads and the
  cross streets: half-timbered houses, tall townhouses, antiques and chemist shopfronts, a studio-attic look.
- **Vignettes** (at least 5; make them your own): the composer's crisis (a `gsr-upright-piano` on the pavement outside
  a house, crumpled sheet music, a music stand knocked over: `rot`); the existential picnic (a blanket-less picnic:
  two chairs facing a blank wall, a bread loaf, one cheese, a book); the laundry dispute over the garden wall (two
  washing lines tangled across an ivy wall, a ladder, a peg basket); the market's cheese standoff (two cheese wheels on
  one stall, a "WHICH IS OLDER?" poster, a magnifying-glass-free stool); the Opera stage door (`pl-cello` case leaned
  on the wall, a music stand, a sign "Stage door. Please queue in the other direction."); the abandoned easel by the
  river (easel, a fallen chair, a croissant).
- **Signs** (15+): street signs (renamed: "Boulevard of Forms (Triplicate)"), gallery banners ("GALLERY. Today's show:
  a chair."), poster boards along the Boulevard (concerts at the Opera Hall, a lost beret, "Do not feed the poet."),
  market menus and prices ("Cheese, aged: 12 acorns. Cheese, ageing: 9. Cheese, young and hopeful: 4."), backyard
  notices ("Garden closed for reflection.").
- **Residents** (4-5, ids fixed): `pl-maestro` Maestro Ottavio Lento (Radio Adagio's pompous host, by the Opera Hall
  door, 'idle-pompous'; bubble in his voice, e.g. "You may approach. Slowly. Adagio."), `pl-cheesemonger` Roquette
  Fromage ('vendor-call' at her stall), `pl-poet` Sartorius Gloom ('think' or 'read', in black, on the Boulevard or the
  river path), `pl-laundry` Greta Clothespeg ('hands-on-hips' at a washing line in the backyards). Add one more
  unnamed-cast resident if you like (id `pl-lb-<word>`).

## Done when
See `_district-common.md` "Done when". Report your vignettes and residents with coordinates.
