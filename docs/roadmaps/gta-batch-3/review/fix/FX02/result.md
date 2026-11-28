# FX02 result: interiors and their cameras

Branch `fix/FX02`. Shots (local, git-ignored) under `docs/roadmaps/gta-batch-3/review/shots/FX02/`; the pre-fix
shots taken at the start of the round are in `.../FX02/before/`. All shots at 960x600 unless noted.

| Finding | Status | What landed | Evidence |
|---|---|---|---|
| G1#3 (must) camera inside the lift kiosk | fixed | New prefab `even-lift-kiosk` (beige lift housing, steel double door, call button, THORNE plate, floor light; `packages/prefabs/src/catalog/gta-towers.ts`) replaces the scaled taxi booth. It stands against the south parapet (`DOUBLE_POT_ROOF_KIOSK`), door facing the pad. The arrival moved to (120, 9, -77.5) facing north, 5.5 m in front of the door, so the follow camera sits in the open. `?roof=1` now uses `DOUBLE_POT_ROOF_ARRIVAL`. | `i-roof.png` (helipad ahead, no yellow screen), `i-roof-kiosk.png` (camera turned: the kiosk behind the arrival); `interiors/entryView.test.ts` "keeps the follow camera clear of the Double Pot lift kiosk", "sends every Double Pot lift ride to the clear arrival pose" |
| G1#4 (must, D58) wall decor floats | fixed | `createKit` now sorts hung pieces (signs, paintings, shelves off the floor within 0.45 m of a wall) by wall; the runtime hides each wall's decor while the camera is outside that wall. Signs got a darker backing board so they read as mounted. The worst case was Diggs' map painting, a box prefab on the cut-away door wall seen from behind (the "wardrobe back" of G1#14). | `i-diggs.png`, `i-flat.png`, `i-dpot.png`, `i-workshop.png`, `i-townhouse.png`; `kit.test.ts` "sorts hung decor by wall" |
| G1#11 (must, D58) sky or void above the room | fixed | The ceiling overhangs the walls by 6 m (the top of the frame is ceiling, not sky) and glows a little of its own colour (a dark ceiling no longer reads as a black void). While inside, the scene background and fog are a dark warm neutral from the theme's ceiling colour; atmosphere restores them on the first frame outside. | `i-flat.png`, `i-townhouse.png`, `i-mulch.png`, `i-diggs.png` |
| G1#13 (could) street barks inside | fixed | Ambient traffic driver barks are not toasted while `currentInterior()` is set (app.ts, the traffic toast callback). Quest comms are untouched. | code; `i-flat.png` (no bark) |
| G1#14 (must, D58) Diggs spawn faces a wardrobe | fixed | The "cabinet back" was the map painting's back (see G1#4); it now hides with the door wall. The DO NOT DIG INDOORS sign moved from beside the door (at the frame edge, over the HUD) to over the camp bed. Entry-view assert for every registered interior. | `i-diggs.png`; `entryView.test.ts` (21 interiors) |
| G1#24 (should) Decorate panel on a phone | fixed | Portrait phones: sheet about 46% high, plan 24vh with the room letterboxed at 6:5 (taps mapped the same way), storage collapsed into one sideways row, and while the panel is open the camera looks down on the whole flat above the sheet (`DecorDeps.view` hook, a fixed showroom view). Plan labels use short names (`shortName`: Plant, Lamp, Shelf, Drawers, ...), are drawn beside a piece narrower than the label with a dark halo, and are clamped inside the canvas. | `i-flat-decor-phone.png` (390x844 touch), `i-flat-decor-landscape.png` (844x390); `decorUi.test.ts` shortName |
| G6#18 (must, D58) ranger station sky, black ceilings | fixed | Shared fix: `interiors/ceiling.ts` holds the room's ceiling height, and the foot camera stays 0.3 m under it inside interiors (contract for FX16: Loamdeep, clubhouse). Plus the ceiling overhang, ceiling glow and dark warm background above. | `int-unmown-ranger-station.png` |

## Contracts provided
- `currentInterior()`-aware background and fog (`interiors/runtime.ts update`), restored on exit by atmosphere.
- `interiors/entryView.test.ts`: nothing taller than 1.2 m within 3 m in front of every registered interior's spawn
  (resident gnomes and the room shell excluded via `userData.interiorNpc` / `userData.shell`), and camera clearance
  of the Double Pot roof arrival against the kiosk.
- `camera.ts`: foot camera clamped to `interiorCeiling() - 0.3` inside interiors (`interiors/ceiling.ts`).
- `createKit()` returns `walls()` (`WallDecor[]`); sign groups carry `userData.wallSign`.

## Known gaps (carried over, not FX02's files)
- `uni-lecture` is exempt in the entry-view test: `campus/interiors.ts` scales the `lecture-bench-row` prefab to 18 m
  wide, so each row stands about 4 m tall right in front of the spawn. Owner: whichever epic holds the campus.
- The Hedgeworth clubhouse and the Unmown ranger station are defined at world build (`defineClubhouseInterior`,
  `buildRangerStation`), not at import, so the entry-view test does not cover them; both were checked by screenshot
  (the ranger station above).
- Camera clearance is asserted for the Double Pot roof only; other `stairsTo` world arrivals (campus roofs) have no
  obstacle data in a unit test. They were not reported as findings.
- Flat 3B's own signs (`interiors/showcase/flat3b.ts`, not owned) still sit near the frame edges on entry; they now
  carry backing boards and are on their walls.

## Checks
- `npm run build -w games/gnome-theft-auto`: pass. `npm test -w games/gnome-theft-auto`: pass (517 files, 5349 tests).
- `npm test -w packages/prefabs`: pass (even-lift-kiosk).
- `bash tools/smoke.sh http://localhost:5502/?interior=flat-3b gta-gnomlet`: SMOKE OK.
- `npm run zfight` at `?interior=diggs-bungalow` and `?interior=double-pot-sales` (the kiosk is in the world scene):
  no findings on interior meshes, signs or the kiosk (the 42-44 pairs reported are pre-existing world pairs).
- No density change (GR9 perf not applicable). No lore change.
