# FX02 roadmap: interiors, their cut-away walls and their cameras

Brief: `docs/roadmaps/gta-batch-3/review/fix/FX02-interiors-and-cameras.md` (G1#3, G1#4, G1#11, G1#13, G1#14, G1#24,
G6#18; D58).

## Foundation (lead, before the epic)

- `interiors/ceiling.ts` (new, pure): `setInteriorCeiling(y | null)`, `interiorCeiling()`, `CEILING_CLEARANCE = 0.3`.
- `camera.ts`: on foot inside interior space, the camera stays under `interiorCeiling() - 0.3` (G6#18 contract for FX16).
- `app.ts` (small additive edits): `camera` passed to `createInteriors`; `?roof=1` uses `DOUBLE_POT_ROOF_ARRIVAL`;
  traffic driver barks dropped while `currentInterior()` (G1#13); the Decorate panel gets a `view(on)` hook that puts
  the chase camera in a fixed top-down showroom view of Flat 3B.
- `interiors/runtime.ts`: `InteriorDeps.camera?`. `home/decorUi.ts`: `DecorDeps.view?`.
- `interiors/showcase/doublePot.ts`: new arrival (120, 9, -77.5, north), `DOUBLE_POT_ROOF_KIOSK` footprint, lift spot.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Fixes | tsc, `npm test -w games/gnome-theft-auto`, `npm test -w packages/prefabs` | 3 (parallel, no shared files) |
| Lead pass | entry-view test (`interiors/entryView.test.ts`), Diggs dressing, re-shoots, iterate | lead |

Online: not applicable (single-player presentation fixes). Mobile: I3 is the phone layout.

## Epic 1

~~~~text
FX02-I1: kit.ts + runtime.ts  (see the worker prompt; pasted in full when launched)
FX02-I2: even-lift-kiosk prefab + Double Pot roof kiosk
FX02-I3: Decorate panel phone layout and plan labels
~~~~

The full issue texts are in `I1.md`, `I2.md`, `I3.md` next to this file.
