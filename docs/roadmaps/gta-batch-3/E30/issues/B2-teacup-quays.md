Epic: E30-B (Pardonlin content, all parallel)
Depends on: none (foundation in place)

## Environment and rules
Read `docs/roadmaps/gta-batch-3/E30/_district-common.md` first: it is part of this issue (types, helpers, prefab ids,
rules, checks). You own `games/gnome-theft-auto/src/pardonlin/districts/teacupQuays.ts` (and optionally a new
`teacupQuays.data.ts` beside it). Nothing else.

## Goal
`planTeacupQuays()` returns Teacup Row and the Quays: the café quarter south of the Hatwheel, the east quay along the
river and Place du Pot. This is where Pardonlin sits down.

## Your ground (world coordinates)
District rect: x -1595..-1400, z -8..500 (id `teacup-quays`).
- `pl-rue-haute` (7 m): (-1462,-30) (-1458,110) (-1466,250) (-1490,420) (-1500,436) (ends at Place du Pot).
- `pl-quai-sud` (the quay road): (-1555,-10) (-1575,50) (-1582,110) (-1580,250) (-1585,380) (-1560,440) (-1514,450).
- `pl-avenue-se` (-1540.86,-15.86) (-1528,40) (-1518,105) (diagonal from the Hatwheel, centre (-1555,-30) r 20).
- `pl-rue-c` (-1582,110) (-1518,105) (-1458,110); `pl-rue-d` (-1580,250) (-1525,262) (-1466,250).
- `roundabout/place-du-pot`: centre (-1500,450), ring radius 14 (E28 built its island; keep 6 m off the ring).
  `pl-route-sud` leaves it south from (-1500,464).
- `pl-grand-route` along z -30 is just north of you (the Grand Wicket at x -1400).
- Footpath `trail/thymes-walk` (4 m): (-1597,-30) (-1587,110) (-1592,250) (-1602,380) (-1592,520). The Thymes is west
  of it (centre about x -1605..-1620; nothing solid within 12.5 m of its centre line). The quay between the walk and
  the quay road is narrow (5-12 m): small props only, check `roadClearance`.
- Sites: **Teacup Row** block x -1568..-1476, z 125..235 (between rue-c and rue-d). Make Teacup Row a pedestrian café
  lane: a paved lane about 8 m wide running north-south through the middle of the block (x about -1522), lined both
  sides by narrow terraces facing the lane (cafés, bistros, the bakery, shopfronts), café tables spilling into it.
  Other blocks: between avenue-se and the quay (z 0..105), between avenue-se and the Rue Haute, east of the Rue Haute
  (x -1452..-1402, keep 4 m off the Wickets fence at x -1397), between rue-d and Place du Pot (z 262..440).
- **Café Pardon** (a walk-in interior another worker is defining right now; fixed): a `euro-corner-cafe` at body
  centre (-1532,140), yaw Math.PI/2 (front faces east onto the lane, front wall at x -1529), on the lane's west side.
  Place it first (hand-placed, through keepClear) and build the lane rows round it. Keep the ground x -1529..-1526,
  z 138..140 clear (the "Enter Café Pardon" spot is at (-1527.8,139)). A banner "CAFÉ PARDON" over its door
  (plaque/banner at `local(-1532, 140, Math.PI/2, 0, 3.05)`, y 4). A town speaker plays Radio Adagio from its terrace:
  a `euro-cafe-table` at (-1525.5,143.5) with a `pl-gramophone` on it (y = the table top height).
- **The bakery** (fixed: the Baguette Round activity starts at Brigitte, coded by another worker right now): a
  `euro-bakery` at body centre (-1515.2,130), yaw -Math.PI/2 (front faces west onto the lane, front wall x -1518.2), on
  the lane's east side. `pl-baker` Brigitte Levain stands at (-1520,131.5) facing west... facing the lane (yaw
  -Math.PI/2). Keep (-1520.5,128.5) clear in a 1 m circle (her "Talk to Brigitte" spot). Her bread queue (5
  `pl-queue-post`s) runs south from the door along x -1520.5, z 133..139.
- Screenshot spots (keep them looking good): (-1522,120) facing north... (it looks down Teacup Row from its north
  end: make the lane's north mouth inviting); (-1584,200) facing north along the quay; (-1500,420) facing north at
  Place du Pot.

## Design
- **Terraces** along every street frontage you own, packed and uneven; shopfronts on the Rue Haute; the quay road's
  east side faces the river with tall townhouses and a corner café at each cross street.
- **Teacup Row**: the densest café street in town: 6+ cafés/bistros, a bakery with a queue of 5 posts (`pl-queue-post`)
  and a `pl-bread-basket` outside, `pl-cafe-parasol`s, tables with `pl-espresso-cup`, `pl-croissant`, `pl-newspaper`
  (lift each above the table top: y = top + 0.02), flower troughs, geranium pots, a bike rack full of nothing.
- **The quay**: `euro-iron-railing` along the walk's river side where there is room, `pl-book-stall`s (bookstalls on
  the walk's road side), benches facing the river, an angler's stool and rod, `pl-accordion` with Anatole on a crate.
- **Place du Pot**: plane trees, a kiosk (`news-kiosk` or `euro-tabac-kiosk`), benches, a post booth.
- **Vignettes** (at least 5; make them your own): the espresso that has lasted since Tuesday (two chairs, one cup, a
  stack of 12 saucers, a chessboard mid-game: use `crate` or a table); the bakery queue at dawn (posts, a sleeping
  bag-ish bench, a thermos, a baguette basket, a numbered ticket sign); the book that fell in (an open bookstall, a
  gap in the books, a fishing rod hooked on the railing, an angler pointing at the water); the waiter's revenge (a table
  set for one, the bill already on it, a chair turned to the wall); the bicycle that is a planter (bike rack, geranium
  pots where the bikes go, a "BICYCLES ONLY" sign); the accordionist's empty pitch (accordion on a crate, a hat with
  three acorns, a sandwich).
- **Signs** (15+): menus ("Croissant: one per customer, per life"), posters ("Café closed for lunch."), street signs
  (renamed in their voice: "Teacup Row (No Mugs)"), banners on the bakery and cafés, a notice on the quay ("The river
  is decorative. Please do not use it as a river.").
- **Residents** (5-6, ids fixed): `pl-baker` Brigitte Levain ('vendor-call' at her door), `pl-cafe-a` Jean-Pot and
  `pl-cafe-b` Sabine Sip ('sip-drink' / 'think', seated at their table: put them right beside the chairs, they stand),
  `pl-waiter` Hector Disdain ('idle-pompous', looking away from the tables), `pl-accordion` Anatole Bellows
  ('busk-guitar' on the quay), `pl-bouquiniste` Prudence Spine ('read' at her bookstall).

## Done when
See `_district-common.md` "Done when". Report your vignettes and residents with coordinates.
