Epic: FX09-1 (Pardonlin's ground, content)
Depends on: none (the lead's foundation commit 06b326a8 is in place)
Findings: G2#4 (blocker, must, D9 item 4), the river-edge part of G2#9

(Read `docs/roadmaps/gta-batch-3/review/fix/FX09/common.md` first: the shared environment, plan and ground contracts.)

## Goal
The Thymes stops reading as "a flat teal strip, level with the lawn ... exactly like a road": it becomes a town river
between stone quay walls, with railings and stair cuts, moored boats, bouquinistes on the Thymes Walk, visible swans,
and bridges with parapets, lamps and a padlock railing.

## Owned files
- `src/pardonlin/districts/thymes.ts` (stub `export function planThymes(): Omit<DistrictPlan, 'id'>`: keep the
  signature). `pardonlin/plans.ts` hands each building, prop, sign, vignette and resident to the district whose rects
  contain it (`districtAt`); the river corridor x -1626..-1595, z -540..1005 belongs to Teacup Row and the Quays, the
  Jardin stretch (z < -540) to the gardens, so pieces anywhere along the river are kept. Pieces outside every district
  are dropped. Its `ground` patches are drawn town-wide. Add `thymes.test.ts` next to it.
- `src/config.ts`: only the `thymes` entry of `WATER.courses` (currently `thymes: { depth: 1.4, bank: 4 }`).
- `packages/prefabs/src/catalog/gta-pardonlin-river.ts` (empty `GTA_PARDONLIN_RIVER`, already registered).
- `docs/lore/entries/apocrypha/the-thymes.md` ("In the games" section only, if what it says is no longer true).

## Decision D9 item 4 (final, do not reopen)
"Stone quay walls with railings and stair cuts, 6-10 moored boats, bouquinistes on the Thymes Walk, visible swans, and
bridge parapets with lamps and a padlock-railing vignette. Sink the channel 1.5-2 m only if the water body takes a
per-body level offset without kernel changes. Otherwise fake the depth with a wall face down to the water line."
The per-course offset exists: `WATER.courses[id].freeboard` (src/water.ts `carveWater`: the surface is the lowest bank
minus the course's freeboard, default `WATER.freeboard` = 1.0). So: set the Thymes' `freeboard` to about 1.8 and a
steeper `bank` (about 2) so the water sits ~1.8 m below the quays. Then run `npx vitest run src/water.test.ts
src/boatTraffic.test.ts src/boats.test.ts src/swim.test.ts src/pardonlin src/terrain.test.ts` and fix or report any
failure; if sinking breaks something you cannot fix in your files, fall back to freeboard 1.0 and fake the depth with
the wall faces (record which you chose and why).

## Facts
- The Thymes is the `thymes` water path in `src/data/levels/pardonlin.level.json`, 16 m wide; world points with
  `pathPoints('thymes')` (`pardonlin/layout.ts`). Its centre runs x -1620..-1600 from z -880 to 1020. The two river
  walks are footpaths `trail/thymes-walk` (east, ~13-18 m from the centre) and `trail/rive-gauche` (west), 4 m wide:
  they are **no longer laid automatically**; you lay the quay surface.
- `pardonlin/layout.ts` `RIVER_KEEP = 12.5`: no *solid* prop within 12.5 m of the centre line (the layout test). So
  quay walls, railings, stairs and boats are non-solid props; the water and the swim code handle falling in.
- Heights: `heightAt(x, z)` (src/terrain.ts) is the ground, or the deck on a bridge; `waterAt(x, z)` returns
  `{ surface, depth, ... } | null`. A plan prop's final y is `heightAt(x, z) + (p.y ?? 0)`, so a floating boat gets
  `y = waterAt(x, z)!.surface - heightAt(x, z)` and a wall piece standing on the bank gets a y that puts its top flush
  with the quay. The plans are pure TS and run in vitest (terrain builds lazily in node), so you can sample heights in
  `thymes.ts` and print profiles from a scratch test while you design (delete scratch tests afterwards).
- Bridges: the roads `pl-pont-nord`, `pl-pont-neuf`, `pl-pont-sud` (and others crossing the river: find each road in
  `HIGHWAYS` (src/config.ts) whose points cross the thymes line) have raised decks (`WATER.bridgeClearance.thymes`,
  `bridgeMargin` 1 m past the 7 m road). Pavements stop 13.5 m from the river centre, so the bridges are bare now.
- A boat runs up and down the river (`src/boatTraffic.ts`, 'walnut-dinghy' on `waterwayRoute(['thymes'])`, z -600..900):
  moored boats stay within 3 m of a wall, never mid-channel, and never under a bridge.
- Swans: four moving `bird-swan`s in `pardonlin/life.ts` (not your file) are lost over a kilometre of river. Make swans
  visible with static ones: a pair by a stair landing, a nest with cygnets (scale ~0.5) on a quay step, a pair under the
  Pont Neuf, a swan pedalo (`pl-swan-pedalo` exists) moored.
- Existing prefabs to reuse: `euro-iron-railing`, `euro-lamp-post`, `euro-bollard`, `pl-book-stall`, `bird-swan`,
  `pl-swan-pedalo`, `euro-flower-trough`, `crate`, `wicker-basket`; look in `packages/prefabs/src/catalog/gta-boats.ts`
  and `gta-euro-street.ts` for boats and street pieces first.

## Design
- **Quay walls**: new prefab `pl-quay-wall` (a 4 m stone wall segment: dressed stone face ~2.5 m tall down to below the
  water line, a coping slab on top; local +z faces the water), placed along both banks for the town stretch (z about
  -540..760) at the waterline edge, yawed to the river, ends overlapping a little so no gaps show, top flush with the
  quay ground. In the Jardin stretch (z < -540) a lower, mossier stone bank (same prefab tinted, or `pl-quay-wall-low`).
- **Railings** (`euro-iron-railing` or a new `pl-quay-railing`) along the coping, broken at the stairs and bridge heads.
- **Stair cuts** (new `pl-quay-stairs`: steps along the wall face down to a landing at the water) every ~150 m,
  alternating banks, at least 4.
- **Quay surface**: `ground` `band` patches (kind 'quay', not accent) along the thymes line from the wall's edge out to
  about 19 m on each side (covering each river walk), cut into runs that stop ~11 m from each bridge road's centre
  line (`pathPoints(road)`), so they never cross a road. They must not overlap each other or other plans' patches.
- **Moored boats (6-10)**: new prefabs `pl-houseboat` (a cabin barge with window boxes and a chimney), `pl-peniche` (a
  long black-hulled barge with washing on a line and potted geraniums), `pl-rowboat-sunk` (a rowing boat sunk to the
  gunwales with a "FOR SALE" sign, i.e. a 'menu'/'poster' sign beside it: "FOR SALE. Slightly used. Mostly river."),
  plus small skiffs/dinghies from the catalog, tinted. Each moored against a wall with bollards and a rope (thin box).
- **Bouquinistes**: new `pl-bouquiniste` (the green box on the parapet: a box ~2 m long on legs/brackets with the lid
  propped open, books in rows, prints pinned in the lid), in a run along the Thymes Walk (both banks, z about
  -300..150), some open, some shut (a padlocked variant or tint), 2-3 bouquiniste residents (`AmbientGnomeDef`, ids
  `pl-...`, see `ambientGnomes.ts` for the fields and idles) with short bubbles in the town's voice, and signs
  ("BOOKS. Read once, by careful owner.").
- **Bridges**: new `pl-bridge-parapet` (a 3-4 m stone balustrade segment) along both edges of each town bridge deck
  (4.5 m from the road centre, the deck's edge), `euro-lamp-post` pairs at the bridge ends, and on one bridge a
  **padlock railing vignette** (new `pl-padlock-railing`: a railing hung with dozens of small coloured padlocks) with a
  poster ("LOVE LOCKS. Please do not lock your love to the bridge. The bridge is spoken for.") and a vignette entry.
- Vignettes (3+ with props within 8 m each): the sunk rowboat for sale, the padlock railing, the swans' nest, the
  péniche's washing day.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto`, the vitest list above, `npm test -w packages/prefabs` and `npm run lore`
  (if you edited lore) pass. `thymes.test.ts` checks: at least 6 moored boats, each over water (`waterAt` non-null) and
  within 4 m of a quay wall; at least 4 stairs; quay walls on both banks along the town stretch with no gap over 1 m;
  no quay band patch within 10 m of a road centre line.
- Shots: `thymes:-1590,-100,-1.2`, `thymesn:-1585,-300,-1.6`, `pontneuf:-1640,-40,-1.2` (adjust to look at a bridge),
  `tq2:-1584,200,3.1416`, `jardinfountain:-1600,-690,3.1416` and one at 390x844: the river sits in a stone channel,
  boats are moored, bookstalls line the walk, swans are visible, bridges have parapets and lamps. Iterate until it
  looks hand crafted. Report shot paths, which freeboard you chose, and any proposed ruling text.

## Out of scope
`life.ts`, `boatTraffic.ts`, `water.ts`, every district plan file, `lanes.ts`, `groundPlan.ts`, `ground.ts`,
`layout.ts`, `plans.ts`, `rulings.md`, the golden fixture, and every other `config.ts` entry.
