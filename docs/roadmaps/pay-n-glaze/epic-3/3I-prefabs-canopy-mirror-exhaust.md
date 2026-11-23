Epic: 3 (more parts, nested pivots, suspension, showroom stage)
Depends on: 3A (ids and catalogue entries exist)

## Environment
Read `docs/roadmaps/pay-n-glaze/epic-3/_prefabs3.md` first. You own only `packages/prefabs/src/catalog/gta-glaze-canopy.ts` (`GTA_GLAZE_CANOPY`), `gta-glaze-mirror.ts` (`GTA_GLAZE_MIRROR`) and `gta-glaze-exhaust.ts` (`GTA_GLAZE_EXHAUST`); all exist as empty arrays.

## Goal
Five canopies, four mirrors and four exhausts.

## Change
- Canopies (origin at the base of the pole(s), the roof's underside about 0.7 above the origin, about 1.0 wide and deep, at most 1.1 tall in all, no tint):
  - `glaze-canopy-umbrella`: a garden umbrella: a pole and a striped red-and-white cone canopy with a ball tip.
  - `glaze-canopy-awning`: a striped yellow-and-white flat awning on four thin poles with a scalloped front edge.
  - `glaze-canopy-bubble`: a see-through glass dome (`alpha: 0.35`) on a ring base with four struts.
  - `glaze-canopy-leaf`: a big green leaf on a bent stem, tilted over the seat.
  - `glaze-canopy-toadstool`: a red spotted mushroom-cap roof on a stout cream stem.
- Mirrors (ONE mirror on the +x side, base on y = 0, up to 0.3 tall, glass facing +z and a little -x):
  - `glaze-mirror-wing`: a black stalk and a rectangular chrome mirror.
  - `glaze-mirror-spoon`: a silver spoon bowl as the mirror on a handle stalk.
  - `glaze-mirror-stalks`: a snail-eye stalk: a thin stalk with a ball eye and a shiny glass ball.
  - `glaze-mirror-periscope`: a little periscope tube with two angled mirror blocks.
- Exhausts (origin at the rear bumper line, pipes point rearward (-z) and a little up from y = 0, at most 0.5 long; `twin` is two pipes at x = +-0.12, the others one pipe at x = 0):
  - `glaze-exhaust-stack`: a tall smoke stack with a flared lip and a black soot top.
  - `glaze-exhaust-twin`: two chrome tailpipes side by side with slanted cut ends.
  - `glaze-exhaust-chimney`: a little tin chimney with a rain cap and a bracket.
  - `glaze-exhaust-trumpet`: a brass trumpet bell flaring rearward with a coiled tube.

## Contract
Ids exactly as listed; exports `GTA_GLAZE_CANOPY`, `GTA_GLAZE_MIRROR`, `GTA_GLAZE_EXHAUST`.

## Done when
As in `_prefabs3.md`, for your 13 ids.

## Out of scope
Every other file.
