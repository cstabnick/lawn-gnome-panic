Epic: E30-B (Pardonlin content, all parallel)
Depends on: none (foundation in place)

## Environment and rules
Read `docs/roadmaps/gta-batch-3/E30/_district-common.md` first: it is part of this issue (types, helpers, prefab ids,
rules, checks). You own `games/gnome-theft-auto/src/pardonlin/districts/oldTown.ts` (and optionally a new
`oldTown.data.ts` beside it). Nothing else.

## Goal
`planOldTown()` returns the Old Town: Pardonlin's postcard. Dense terraces, the Bean Tower landmark with its tourist
queue, and the Grand Platz, all told through props, signs and people.

## Your ground (world coordinates)
District rect: x -1595..-1400, z -460..-52 (id `old-town`).
- `pl-rue-haute` (High Street, 7 m): (-1460,-440) (-1455,-300) (-1465,-170) (-1462,-30). Traffic warden podium at
  (-1462,-30) (leave the crossing clear).
- `pl-quai-nord` (the quay road, west edge): (-1555,-50) (-1572,-110) (-1580,-170) (-1578,-300) (-1585,-420).
- `pl-rue-nord` (-1585,-420) (-1520,-430) (-1460,-440); `pl-rue-a` (-1578,-300) (-1520,-310) (-1455,-300);
  `pl-rue-b` (-1580,-170) (-1515,-160) (-1465,-170); `pl-avenue-ne` (-1540.86,-44.14) (-1528,-100) (-1515,-160)
  (diagonal from the Hatwheel roundabout, centre (-1555,-30) ring radius 20; the district stops at z -52).
- `pl-north-gate` (-1400,-500) (-1430,-480) (-1460,-440) (to the North Wicket).
- Footpath `trail/thymes-walk` (4 m): (-1597,-420) (-1587,-300) (-1592,-170) (-1597,-30); the river beyond it.
- Sites: **the Bean Tower** block x -1568..-1472, z -411..-321 (between rue-nord and rue-a); **the Grand Platz** block
  x -1566..-1476, z -283..-187 (between rue-a and rue-b). Between rue-b and z -52: an ordinary block split by avenue-ne.
  East of the Rue Haute: a strip x -1452..-1402 the whole length (the Wickets fence is at x -1397: keep 4 m off it).
- Screenshot spots (keep them looking good): (-1520,-392) facing north at the Bean Tower; (-1500,-260) facing north
  across the Grand Platz; (-1462,-200) facing north up the Rue Haute.

## Fixed points (another worker codes activities on them right now; keep them exactly)
- **The Grand Platz queue** ("Queued for Nothing"): a line of `pl-queue-post`s at x -1486.8 from z -232 to z -196, one
  every 1.5 m, each with yaw Math.PI / 2 (its rope runs along local +x = world -z to the next post), and a poster sign
  at (-1486, -194) facing south: "QUEUE HERE. For what: see the front of the queue." Keep the strip x -1489..-1487.3,
  z -233..-195 clear of props (the player queues there). Nothing at the front: that is the joke.
- **Odile's portrait spot** ("Portrait of a Croissant"): Odile (`pl-painter`) at (-1540,-262) with yaw Math.PI (facing
  north... she faces the sitter: the sitter stands at (-1540,-270), north of her, so her yaw is Math.PI), her
  `pl-easel` at (-1540,-263.2) yaw Math.PI, a stool (`crate`) for the sitter is NOT placed (the sitter stands). Keep a
  1.5 m circle round (-1540,-270) clear. Her other canvases (the rejected croissants vignette) can lean nearby.

## Design
- **Terraces**: both sides of the Rue Haute, the north side of rue-a / south side of rue-nord around the tower block,
  the rue-b frontages, and the avenue-ne block. Packed, uneven fronts (setback 0.35..0.6), shopfronts and bistros on the
  Rue Haute (`mix`), apartment blocks and townhouses on the side streets; a corner café at the Platz corners.
  Use `frontage()` + `planStreetRow` + `keepClear` with one `taken` array for the whole district.
- **The Bean Tower** (`pl-bean-tower`, centre about (-1520,-366), facing south, solid `{ r: 7, h: 30 }`): its own
  little garden square of paving and gravel (paving tiles), box hedges, a ticket kiosk (`euro-tabac-kiosk` with a banner
  sign), the queue: `pl-queue-post`s snaking in switchbacks (posts 1.5 m apart along each line, yaw so each post's +x
  points at the next) from the kiosk round the tower, with tourists' suitcases, a folding stool, a dropped croissant.
  Fifi Haricot the guide (`pl-tour-flag` beside her) at the head of the queue.
- **The Grand Platz**: a paved square (paving tiles over most of the block, cobbles round its edge), the `euro-fountain`
  (or `stone-fountain`) in the middle, the `bandstand` centred exactly at (-1500,-235) facing south (a town speaker
  plays Radio Adagio from there: put a `pl-gramophone` on its floor, y 0.6, and two `pl-music-stand`s), café terraces
  (tables, chairs, `pl-cafe-parasol`s, cups, newspapers) spilling from the corner cafés onto the square, plane trees,
  bollards and lamp posts, `euro-boules-court` with Gaston and the other Gaston, `pl-pigeon-statue` (the Unknown
  Pigeon) with real `bird-pigeon`s round it, Marcel the mime near the fountain, Odile's `pl-easel` facing the tower.
- **Vignettes** (at least 5; ideas, make them your own): the queue for the queue (a second, shorter queue of posts
  leading to the back of the first one, with a sign); the painter's rejected canvases (easel + a stack of leaned
  canvases + a croissant on a stool: she paints the tower as a croissant every time); the boules measurement dispute
  (court, a boule far off, a boule touching the jack, two hats thrown on the ground, a folded tape measure); the mime's
  pitch (upturned beret with one acorn, a folding chair nobody may sit in, a sign); the strike about the strike (a
  stack of placards, two chairs, a thermos, a `poster` sign: "ON STRIKE until lunch. Lunch is also on strike.");
  the pigeons' committee meeting on the statue plinth (6 pigeons in a ring, one on a breadcrumb box).
- **Signs** (15+): street signs at the corners (renamed streets in their voice, e.g. the Rue Haute's sign reads
  "Rue Haute (High Street) (Main Street) (Please Choose One)"), posters on boards, chalkboard menus at the cafés and
  the bakery, banners over shops ("CHEESE. ONLY CHEESE. DO NOT ASK FOR BUTTER."), the Bean Tower ticket board ("Bean
  Tower — Admission: one acorn. Exit: two acorns."), "Do not feed the statue".
- **Residents** (4-5, from the cast, ids fixed): `pl-mime` Marcel Muet (idle 'emote', bubble a stage direction in
  brackets, he never speaks), `pl-painter` Odile Easelby ('paint-wall' at the easel), `pl-boules-a` Gaston Plonque and
  `pl-boules-b` the other Gaston ('argue' / 'measure', facing each other across the court), `pl-tower-guide` Fifi
  Haricot ('idle-pompous' or 'point'). Looks: berets (hat colours), striped shirts, smocks; vary skin and beards.

## Done when
See `_district-common.md` "Done when". Report your vignettes and residents with coordinates.
