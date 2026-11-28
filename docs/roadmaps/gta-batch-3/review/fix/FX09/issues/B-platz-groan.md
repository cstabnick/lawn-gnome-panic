Epic: FX09-1 (Pardonlin's ground, content)
Depends on: none (the lead's foundation commit 06b326a8 is in place)
Findings: G2#3 (blocker, must, D9 item 3), G2#15 (should), and the Old Town part of G2#10 (seams, timber-look tiles)

(Read `docs/roadmaps/gta-batch-3/review/fix/FX09/common.md` first: the shared environment, plan and ground contracts.)

## Goal
The Grand Platz becomes the densest, most lived-in place in the game instead of "100 x 120 m of identical tiles that
reads as a car park", and Le Petit Groan's entrance moves from a grey stair well in the open square to a building edge.

## Owned files
- `src/pardonlin/districts/oldTown.ts` (the whole file; section 3 "The Grand Platz" and "The Platz, lived in" are the
  work; keep the Bean Tower, the Rue Haute and the courtyards as they are).
- `src/workplaces/comedy/club.ts`: `CLUB_DOOR` and `buildClubStreet` (the street entrance only; leave the interior).
- `packages/prefabs/src/catalog/gta-pardonlin-platz.ts` (empty `GTA_PARDONLIN_PLATZ`, already registered): new prefabs.
- `docs/lore/entries/apocrypha/le-petit-groan.md` (its "In the games" section).

## Decision D9 item 3 (final, do not reopen)
"Keep the footprint. Give the outer ring to a plane-tree quincunx on gravel with benches. Make a paved core of about
45 m that is dense: a carousel, a flower market, newspaper kiosks, café terraces spilling 10 m out, a crowd round the
mime, toy boats in the fountain. Move Le Petit Groan's entrance to a building edge."

## Fixed points (other code leans on them: do not move)
- The Grand Platz queue: posts at x -1486.8, z -232..-196 (one every 1.5 m, yaw PI/2) and its poster at (-1486,-194).
- Odile's portrait spot: Odile (-1540,-262), easel (-1540,-263.2), sitter (-1540,-270).
- The bandstand at (-1500,-235) with the gramophone on its floor. The Bean Tower at (-1520,-366).
- The screenshot spot (-1500,-200) facing north stays clear (3.5 m).
- Keep (the editor's keep-list): Marcel's invisible-box poster and pitch (mime at (-1522.5,-229)), the Gastons' boules
  quarrel (court at (-1553,-222)), the queue for the queue, the strike about the strike, the crossword quarrel. You may
  move a vignette a few metres if the new layout needs it; keep its text, props and id.

## Design
- Ground (the foundation already turned the old tile `pave()` into one setts rectangle per call, plus cobble accent
  rings): replace the Platz's single `pave(-1562, -283, 28, 32, ...)` with (a) a **paved core** of about 45-50 m (setts,
  e.g. centred near the fountain and bandstand, x about -1545..-1497, z about -260..-212) with cobble accent rings
  round the fountain, the bandstand and the Unknown Pigeon, and (b) an **outer ring of gravel** laid as four
  non-overlapping `rect` patches round the core (the Platz is x -1562..-1478, z -283..-187). Same-layer patches must
  not overlap; accents must stay off the pavement bands (9.6 m from a road's centre line).
- Outer ring: a **quincunx** of `euro-plane-tree`s (staggered grid, ~6-7 m spacing, solid r 0.45) on the gravel with
  benches (`bench`, `park-bench`) between them, a `euro-lamp-post` here and there, the boules court stays in it. Replace
  the two straight "pleached avenues" of the current lived-in block with this.
- Core, dense and readable at gnome scale from (-1500,-200) facing north and from inside the square:
  - a **carousel** (new prefab `pl-carousel`: a round striped canopy on a central pole, 6-8 horses or teacups/gnome-hat
    seats on poles, a round platform ~5 m across, solid r ~2.8; tintable canopy) with a ticket booth or a sign ("ONE
    RIDE: one acorn. TWO RIDES: you will be dizzy.") and a short queue of posts (queues are Pardonlin's joke);
  - a **flower market** corner: 4-6 stalls with buckets of flowers (new `pl-flower-stall` or `pl-flower-bucket`, or
    `market-stall` + existing pots/troughs), bunches leaning, a sign;
  - **newspaper kiosks** (`news-kiosk`, `euro-tabac-kiosk` is a building) and `newspaper-box`es;
  - **café terraces spilling 10 m out** from the café fronts on the square's edges (the existing `cafeSet` helper:
    table, chairs, parasol, cup, paper), in rows, with menu boards;
  - a **crowd round the mime**: 4-6 residents (`AmbientGnomeDef`, ids `pl-...`) standing in a loose ring 2.5-4 m from
    Marcel, facing him, with idles such as 'idle-pompous', 'lean-back', 'argue' (copy the style of the existing
    residents in `oldTown.ts` section 6; read `src/ambientGnomes.ts` for the `idle` values that exist and the look
    fields). Give two of them short bubbles in the town's voice;
  - **toy boats in the fountain**: 3-4 small sailboats (new `pl-toy-sailboat`, ~0.4 m, tintable sail) floating at the
    basin's water height (read the `euro-fountain` prefab in `packages/prefabs/src/catalog/` for its basin height), a
    child-sized resident with a stick, a sign;
  - more pigeons in groups, bike racks, lamp posts, litter bins, a crêpe or ice-cream cart if one exists.
  Keep a walkable route from each street into the square (no walls of props), and keep props solid only when they
  are big (trees, kiosks, the carousel, stalls).
- **Le Petit Groan (G2#15)**: move `CLUB_DOOR` to a building edge facing the square: a cellar doorway or a hatch at the
  foot of one of the buildings on the Platz's edge (find one in the plan: the rows along `pl-rue-a`'s south side and
  `pl-rue-b`'s north side, or the corner cafés at (-1558.5,-183.6) and (-1485,-288); a building's footprint comes from
  `buildingFootprint` in `pardonlin/plan.ts`). `CLUB_DOOR.yaw` faces out of the doorway. The door must be reachable on
  foot (no collider in front of it within 2.5 m: `EXIT_POSE` is 2.5 m out) and off the queue's line. In
  `buildClubStreet`, make the entrance read as a cellar door in a wall (reuse `groan-cellar-entrance` if it fits against
  a wall; else add a `pl-cellar-door` prefab: a stone surround with steps going down and a red door), hang a sign over
  it (a new hanging sign prefab, or a 'banner'/'plaque' text in `oldTown.ts` signs: "LE PETIT GROAN\nLaughter by
  appointment."), and put tonight's bill on the chalkboard: if `groan-chalkboard-sign` shows no text, put a `menu` sign
  in `oldTown.ts` at the door instead ("TONIGHT: a gnome. Then another gnome.\nLaughter by appointment."). Remove the
  old free-standing stair well. Check every other use of `CLUB_DOOR` (`grep -rn "CLUB_DOOR\|COMEDY_CLUB_ID" src`) and
  that `npx vitest run src/workplaces` passes.
- Update `le-petit-groan.md`'s "In the games" section (it still says "Planned (E24)") to describe the cellar door off
  the Grand Platz. Put a proposed ruling (one or two sentences) in your report; do not edit `rulings.md`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto`, `npx vitest run src/pardonlin src/workplaces` (from the game folder),
  `npm test -w packages/prefabs` and `npm run lore` (repo root) pass.
- Shots: `platz:-1500,-200,3.1416`, `platzc:-1520,-250,3.1416`, `groan:<your door x>,<z + 6>,3.1416` (turn the yaw so
  it faces the door), `odile:-1500,-200,3.1416` at a higher spot if useful, and `phone-platz` at 390x844. The core
  reads dense and lived-in, the ring reads as a gravel quincunx, the door reads as a cellar door in a building with its
  name over it. Iterate until it does. Report shot paths.

## Out of scope
Other district files, `lanes.ts`, `thymes.ts`, `groundPlan.ts`, `ground.ts`, `layout.ts`, `plans.ts`, `life.ts` (the
moving pigeons and strollers), the queues' people (another epic fills them), `rulings.md`, the golden fixture.
