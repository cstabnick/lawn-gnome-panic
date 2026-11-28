Epic: FX09-1 (Pardonlin's ground, content)
Depends on: none (the lead's foundation commit 06b326a8 is in place)
Findings: G2#7 (should), G2#26 (must, D9 item 1), the Left Bank part of G2#10 (tile props)

(Read `docs/roadmaps/gta-batch-3/review/fix/FX09/common.md` first: the shared environment, plan and ground contracts.)

## Goal
The Beetle Market stops being "61 bare stall frames in a uniform grid on a lawn" and becomes a crowded flea market on
cobbles; Radio Adagio's Opera Hall stops being "a paved forecourt marooned in lawn" and is paved to the kerb and dressed.

## Owned files
- `src/pardonlin/districts/leftBank.ts` (the whole file).
- `packages/prefabs/src/catalog/gta-pardonlin-market.ts` (empty `GTA_PARDONLIN_MARKET`, already registered).
- `docs/lore/entries/apocrypha/beetle-market.md` ("In the games" only, if it stops being true).

## Facts
- `leftBank.ts` has a `pave(x0, x1, z0, z1, id)` helper that places `euro-paving-tile` / `euro-cobble-tile` props on a
  2 m grid. Tile props are retired: replace the helper so it pushes ground patches (`plan.ground.push({ kind: 'setts' |
  'cobble' | 'flags', rect: { x, z, w, d } })`) and replace every call (the forecourt, the artists' terrace, the market
  aisles). Patches on the same layer must not overlap. Town roads already get flag pavements to 9.6 m from their centre
  line (automatic; they draw over patches), so a patch may run under a pavement but needs no kerb of its own.
- The Beetle Market: "Main market: two pairs of back-to-back stall rows around two tiled aisles (hall at z 215)",
  around x -1760..-1705, z 50..220 (the editor's spots: `lb2` (-1733,124) facing south, `marketin`, `stall`
  (-1733,124..160)). The opera hall `euro-opera-hall` at (-1668,-100), its block reserved x -1698..-1636, z -152..-48;
  the Boulevard's centre line is `BOULEVARD` / `bx(z)` at the top of the file (x about -1700). Editor spots: `lb1`
  (-1712,-100) facing east, `adagiofront`, `operabanner`.
- Do not move or remove the race meet's crowd or anything `src/streetRace/` places on the forecourt (another epic owns
  it); keep the forecourt walkable. Keep the Rue Ouest's spilling antiques (`rueouest`) and Radio Adagio's existing
  signs and texts (keep-list).
- Another worker is cutting walk-only lanes (`trail/pl-*` footpaths) through the Left Bank's blocks; they avoid the
  market (x -1760..-1705, z 50..220) and the Radio Adagio block. Keep your patches inside those areas plus the
  forecourt strip to the Boulevard.

## Design
- **Beetle Market (G2#7)**: cobble the whole market square (one `cobble` rect, setts accents for aisles if you like
  without overlap). Break the uniform grid into crooked rows (vary yaw ±0.15, stagger, a dog-leg aisle), fewer but
  fuller stalls (40-50 is fine). Give the stalls **striped canopies tinted per stall** (new `pl-stall-canopy`, a
  striped fabric roof with a scalloped valance on four poles, `tint` for the stripe colour; or a canopied variant of
  `market-stall`) and **goods by trade**, readable from the street: cheese wheels, bric-a-brac (lamps, clocks, chairs),
  books, **beetles** (jars and boxes of beetles: it is the Beetle Market), records, prints, old hats. New small prefabs
  as needed (`pl-cheese-wheel`, `pl-beetle-jar`, `pl-bric-a-brac-pile`, ...): keep each under ~40 parts. 4-6
  **stallholders and shoppers** (`AmbientGnomeDef` residents, ids `pl-...`, read `src/ambientGnomes.ts` for fields and
  idles, copy the style of the existing residents in the file), with a **haggling vignette** every few stalls (two
  residents facing across a stall, a price sign: "BEETLE, slightly used. Price: negotiable. Beetle: not."), a hand
  cart, crates, a stall sign per trade.
- **Opera forecourt (G2#26)**: pave from the Boulevard's kerb to the hall's steps (one `flags` or `setts` rect, no gap
  of grass), then dress it: a **ticket kiosk** (`euro-tabac-kiosk` is a building; or a small new `pl-ticket-kiosk`
  prop) with the queue of one ("QUEUE HERE. The queue is one cellist. Please wait behind him."), posters for "the
  Fifth, Act 1 of 3, of 3" (poster signs), a **stage door** at the hall's side with a cellist resident waiting by it,
  and **the Maestro's parked scooter** (new `pl-scooter`, a Vespa-like scooter, tinted). Keep the existing horn speaker,
  chalkboard and benches.
- Search the lore first (`npm run lore -- find beetle`, `find adagio`, `find maestro`).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto`, `npx vitest run src/pardonlin src/streetRace` (from the game folder),
  `npm test -w packages/prefabs` (repo root) pass; `npm run lore` if you edited lore.
- Shots: `lb2:-1733,124,0`, `marketin:-1740,150,1.2`, `stall:-1733,160,3.1416`, `lb1:-1712,-100,1.5708`,
  `adagiofront:-1690,-100,1.5708`, and `lb2` at 390x844: a dense, colourful, cobbled flea market; a paved, dressed
  opera forecourt with no grass strip. Iterate until it looks hand crafted. Report shot paths and any proposed ruling.

## Out of scope
Every other district file, `lanes.ts`, `thymes.ts`, `groundPlan.ts`, `ground.ts`, `layout.ts`, `plans.ts`, `life.ts`,
`src/streetRace/**`, `rulings.md`, the golden fixture.
