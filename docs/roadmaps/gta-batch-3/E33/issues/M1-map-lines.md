Epic: E33 mountain routes, wave 1. Worker: Haiku.
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` first. Another worker is redesigning the route lines at the same time:
read everything from the Tracks, never hard-code coordinates.

## Goal
The big map and minimap show the Hatband (a gravel track) and the Brim Walk (a footpath). The two mountain roads already
appear: they join the road graph, which the map draws as roads.

## Read first
- `games/gnome-theft-auto/src/hud.ts` lines 690-830: `paintWorld` (the X/Y mirror, `e(w)` thin-line helper, the roads,
  then the Speedway and "The dirt tracks (E14)" loop over `ALL_TRACKS`, then the skyways)
- `games/gnome-theft-auto/src/mountainRoutes/routes.ts` (`ALL_ROUTES`, `ROUTE_DEFS`, `routesOfKind`)

## Change
- `src/hud.ts` in `paintWorld`, right after the "The dirt tracks (E14)" loop and before the skyways: a new block
  "// E33: the mountain routes that are not roads (the roads are in the road graph)":
  - for each id in `routesOfKind('track')`: the route's samples as an open polyline (every 3rd sample, like the dirt
    tracks), stroked twice: `'#5b4630'` at `def.width + e(2)`, then `'#b8a27a'` at `def.width`; `lineCap = 'round'`.
  - for each id in `routesOfKind('trail')`: a dashed line, `g.setLineDash([e(6), e(4)])`, `'#7a5a3a'`, width
    `Math.max(e(2.2), 2.2)`, then `g.setLineDash([])` to reset.
  - Respect the culling like the roads do: skip a route whose `bounds()` (mirrored with X/Y) is not `near(...)` the
    culling window.
  Import `ROUTES, routesOfKind` from `./mountainRoutes/routes`.
- No other change in hud.ts.

## Done when
- `npx tsc --noEmit -p .` clean in hud.ts.
- `npx vitest run src/bigMapView.test.ts src/mapIcons.test.ts` pass.

## Out of scope
Everything else; especially `app.ts`, `mountainRoutes/*` (read only).
