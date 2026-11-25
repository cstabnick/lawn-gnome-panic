Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): airfield layout and storytelling

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
`src/campus/field.ts` builds Rootwell Field, the second runway, as a place: the painted runway with its numbers, edge
lights that glow at night, the apron and taxiway, the access drive from the road, the hangar, the very small control
tower, the windsock, a fuel cart, at least three vignettes and signs; at run time the aeronautics students are seen at
work on a plane and the runway lights come on at night.

## Background (confirmed)
- Places (`src/campus/types.ts` `ROOTWELL_FIELD`): `runway` (1300, 600), yaw 0 (runs along z from z 390 to 810), length
  420, width 24 (x 1288..1312); `apron` x 1215..1262, z 520..680; `taxiway` x 1262..1288, z 588..612; `access` from
  (1180, 580) (the end of the `runway-spur` road) to (1215, 590), 8 wide; `hangar` (1232, 668) yaw PI/2 (doors face
  east, toward the runway); `tower` (1228, 508) yaw PI/2; `windsock` (1330, 450); `pad` (1245, 640) r 7 (copter pad).
  The ground in the site (x 1200..1380, z 370..830) is flat. The aircraft that stand here are spawned by the game
  (`config.ts ROOTWELL_AIRFIELD.planeSpots`): Crop Dusters at (1238, 570) and (1238, 614), a Hedge-Hopper at
  (1238, 592), a Sycamore Copter at (1245, 640), all facing east: **keep 7 m round each spot and the whole runway and
  taxiway free of props and colliders.** NPC sky traffic parks a Hedge-Hopper at (1250, 545): keep 5 m round it clear.
  The aircraft dealership is another epic's site at x 1115..1185, z 610..670 (do not build there).
- How the desert airfield is drawn (copy the look, not the code): `src/biomes.ts` around lines 420-470 (runway strip,
  centre line, threshold bars, apron) and its hangar/windsock placement. The runway surface is already asphalt for
  driving (another worker, `surfaces.ts`).
- Prefabs: existing `hangar` (life-size, footprint r 12; front +z), `windsock-scarf` is a neck item (not a windsock);
  new E13 ones being added now (a missing id is skipped with a warning): `rootwell-control-tower`, `windsock-mast`,
  `runway-edge-light`, `runway-number-board`, `fuel-cart`, `paper-plane`, `essay-page`; existing `crate`, `cargo-crate`,
  `toolbox` (check: `glaze-extra-toolbox`), `ladder`, `bench`, `picnic-table`, `site-cone`, `signpost`, `portacabin`,
  `garden-lamp-post`.
- Helpers: `src/homes/pieces.ts` `buildPieces`, `textPlate`, `prefabBox`; flat strips: `PlaneGeometry` laid flat,
  `MeshLambertMaterial`, `flatLayer(mat, LAYER.road)` for the runway, `LAYER.area` for the apron/taxiway/access,
  `LAYER.marking` for paint (each its own material), 0.02-0.08 above `heightAt`; merge geometries per material.
  Residents: `makeGnome(group, look)` from `../gnomes` (see `src/winter/hill.ts` for a resident and its animation).
  Night: `deps.timeLabel()` ('Dusk' | 'Neon Night' | 'Dawn' = dark).

## Read first
- `games/gnome-theft-auto/src/campus/types.ts`; `src/campus/field.ts` (stub: keep both signatures).
- `games/gnome-theft-auto/src/biomes.ts` lines ~420-480 (the desert runway's look).
- `games/gnome-theft-auto/src/winter/hill.ts` (a finished scenery builder with a resident).
- `games/gnome-theft-auto/src/homes/pieces.ts`.

## Change
`src/campus/field.ts`:
- `buildRootwellField(scene, boxes)`:
  - Runway: dark asphalt strip 24 x 420 (LAYER.road), white edge lines, a dashed centre line, threshold piano-key bars
    at both ends and big painted numbers ("18" at the south end read from the south, "36" at the north end: build the
    digits from thin white boxes/planes, LAYER.marking), touchdown-zone bars 60 m in. Two `runway-number-board`s beside
    the thresholds with `textPlate`s "18" / "36".
  - Edge lights: `runway-edge-light`s every 30 m along both edges (1.5 m outside), solid false.
  - Apron, taxiway and access drive (LAYER.area, a lighter concrete grey), with yellow taxi lines (LAYER.marking) from
    each parking spot to the taxiway and a painted 'H' circle on the pad.
  - Buildings: `hangar` at `hangar` (yaw PI/2, solid), `rootwell-control-tower` at `tower` (solid), `windsock-mast` at
    `windsock` (solid), a `portacabin` labelled "AERONAUTICS DEPT.\nOFFICE HOURS: WHEN AIRBORNE" on the apron's west edge
    (x ~1218, z ~600), a `fuel-cart` by the hangar.
  - Signs (`signpost` + textPlate): at the access drive "ROOTWELL FIELD\nFLATTER THAN THE FLATS"; by the tower "TOWER\nIF
    NOBODY ANSWERS, YOU ARE CLEARED"; on the apron "STUDENTS: ONE PLANE.\nFOUR OF YOU.\nTAKE TURNS."; at the north
    threshold "MIND THE ANTHILL" with an arrow plate pointing north-west.
  - Vignettes (at least three, on the apron's west half and around the hangar, never on the parking circles):
    (1) a wing on trestles in front of the hangar (a long thin tilted box and two `crate`s; or a spare crop-duster
    wing if a prefab fits) with paint pots and a half-painted roundel; (2) the "very small tower" with a deck chair and a
    lunch box on its roof... (only if the tower prefab's roof height is known via `prefabBox`; else a picnic set at its
    foot) and a paper-plane collection pinned on a board ("FLIGHT RECORDS"); (3) a scorched skid of tyre marks running off
    the north end of the runway into the grass, ending at a hay bale or `crate` pile with a plate "OVERRUN\n(PROFESSOR'S
    PARKING)"; (4, optional) a queue of four `bench`es under a sign "WAITING FOR A TURN".
  - Keep everything inside the site x 1200..1380, z 370..830 and off the runway, taxiway and the plane/copter circles.
- `installFieldLife(deps)`: returns a `RootwellPart`:
  - Two aeronautics students (bright jumpsuits, leather helmets if a head piece fits) at the wing vignette: one sanding,
    one holding a clipboard, swaying/turning every few seconds; skip when the player is > 250 m away.
  - Runway edge lights: keep the glowing parts of the edge lights dim by day and bright at night: simplest is a second
    set of small `glow` meshes (one merged `InstancedMesh` or merged geometry of tiny spheres at the light heads) whose
    material colour you lerp between a dim and a bright yellow from `deps.timeLabel()` every ~1 s.
- New `src/campus/field.test.ts` (vitest, `installFakeDom`): after `buildRootwellField(new THREE.Scene(), boxes)`: no
  collider overlaps the runway rectangle (x 1288..1312, z 390..810) grown by 1.5 m, the taxiway, the access drive, or a
  7 m circle round each plane spot and the pad, or 5 m round (1250, 545); every collider is inside the site;
  `installFieldLife(fakeDeps).update(0.1, 1)` does not throw (a minimal deps object cast `as never` with
  `player: { x: 1240, z: 600 }`, `scene`, `timeLabel: () => 'Neon Night'`).

## Contract
`buildRootwellField(scene, boxes): void`, `installFieldLife(deps): RootwellPart` (stub signatures).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus/field.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/campus/field*.ts`.

## Out of scope
Every other file (aircraft spawns, sky traffic, surfaces and the map are other workers' or the lead's).
