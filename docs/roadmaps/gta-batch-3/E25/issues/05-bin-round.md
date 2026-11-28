Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Pure logic, no three.js, no DOM.

## Goal
`makeRound` plans a bin round: 6-14 kerbside wheelie bins along connected Turfton streets, from the road graph, in
driving order, each on the kerb on the right-hand side of the direction the lorry drives.

## Read first
- `games/gnome-theft-auto/src/workplaces/garbage/types.ts`: `GARBAGE` (binsMin/Max, binGap, kerbOffset, cityHalf),
  `BinStop`, `BinRound`, `BIN_TINTS`.
- `games/gnome-theft-auto/src/workplaces/garbage/round.ts`: the stub (`RoundOpts`, `makeRound`).
- `games/gnome-theft-auto/src/types.ts`: `RoadNode` (`id, x, z, links`, `deck?` = on a Skyway deck: skip, `ring?` =
  on a roundabout: skip, `noDrive?`) and `RoadGraph` (`nodes`, `laneOffset`). Node ids index `nodes` (check:
  `nodes[i].id === i`; if not, build a Map).
- `games/gnome-theft-auto/src/jobs/gen.ts`: how the jobs code walks the road graph and seeds randomness (reuse its
  seeded RNG helper if it exports one, else write a tiny mulberry32).

## Change
- `games/gnome-theft-auto/src/workplaces/garbage/round.ts`: implement `makeRound(roads, opts)`:
  - Candidate nodes: no `deck`, no `ring`, |x| and |z| <= `GARBAGE.cityHalf`, at least one link to another candidate.
  - Start at the candidate nearest `opts.from`. Walk the graph: from the current node take a link to a candidate
    neighbour that is not the node you came from (prefer going straight: the smallest turn angle, with a seeded 30%
    chance of taking a turn instead), never revisiting a segment; stop when you have enough bins or after 80 nodes.
  - Along each walked segment (a -> b, direction d = normalized (b - a) as (x, z)), the right-hand side is
    r = (-d.z, d.x) (check: driving north d = (0, -1) gives r = (1, 0), east; driving east d = (1, 0) gives r = (0, 1),
    south).
    Place bins every `GARBAGE.binGap` metres (skip the first and last 6 m of a segment, near crossings), at
    `p + r * GARBAGE.kerbOffset`. Skip a spot when `opts.clear(x, z, 0.5)` is false or it is within 10 m of an
    earlier bin.
  - Count: `clamp(GARBAGE.binsMin + level + rng(0..2), binsMin, binsMax)` (level 1 -> 7..9). If the walk runs out
    early, keep what you have (at least 1 if any spot was found).
  - Each stop: `id` 0.., `yaw` = facing the road centre (from the bin toward the road: atan2(-r.x, -r.z)), `street`
    from a small seeded list of Turfton street names (Kerb Row, Fern Row, Trowel Lane, Moss Street, Saucer Court Road,
    Pebble Walk, Lid Lane, Hosepipe Close, Bulb Street, Clay Street: one name per walked straight run), `tint` from
    `BIN_TINTS` (seeded), `heavy` with probability 0.15 + 0.05 * level, `state: 'full'`.
  - `title`: "Bin round: <first street> and <last street>" (or "Bin round: <street>" when one street).
  - Same inputs give the same round (deterministic).
- `games/gnome-theft-auto/src/workplaces/garbage/round.test.ts` (new): a small hand-made grid graph (a 3x3 grid of
  nodes 60 m apart around the origin, plus one deck node that must never be used): count within limits for levels 1
  and 6; bins >= 10 m apart; every bin is `kerbOffset` from its segment line and on the RIGHT of travel (test a north-
  bound segment: bin x > road x); `clear` returning false for a region keeps bins out of it; deterministic for a seed.

## Contract
`makeRound(roads: RoadGraph, opts: RoundOpts): BinRound` and `RoundOpts` exactly as in the stub.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/workplaces/garbage/round.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.

## Out of scope
`types.ts` (garbage), every other file.
