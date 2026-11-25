Epic: E31 wave 2 (building the places)
Depends on: wave 1 (prefabs exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
Driving the outer band roads passes small signs of life: lay-bys with picnic tables, fingerposts at junctions,
milestones counting down to places, bus shelters with timetable jokes, wayside shrines, a lone phone box, gates and
drystone walls along fields. NOT hunter shacks or tents, NOT construction sites (another epic owns those).

## Read first
- `games/gnome-theft-auto/src/living/roadside.ts` (your stub: keep `buildRoadside(scene, boxes): void`)
- `games/gnome-theft-auto/src/living/place.ts` (`Piece`, `placePieces`, `roadDist`, `seeded`, `pieceBox`, `clearOfBoxes`)
- `games/gnome-theft-auto/src/living/config.ts` (`HAMLETS`, `HIGH_TARN`, `STATION`: keep 90 m away from hamlet centres
  and the High Tarn; the hamlets dress their own roads)
- `games/gnome-theft-auto/src/sites.ts` (`reservedRects()`: never place inside a reserved rect grown by 10 m)
- `packages/prefabs/src/catalog/gta-hamlet-kit.ts` (milestone face (0, 0.55, 0.13); wayside-shrine; hamlet-picnic-table;
  hamlet-phone-box; drystone-wall 3.0 m sections spaced 3.06) and `gta-preserve-trail.ts` (trail-fingerpost)

## The band roads (world metres; road width 10)
- `north-band` (-950,-950) … (10,-960) … (20,-870) and `north-band-east` (10,-960) (40,-1060) (60,-1320) (400,-1330)
  (700,-1295) (1060,-1300) (1060,-1100) — Snowcap Rise.
- `west-band-north` (-950,-46)→(-950,-950) and `west-band-south` (-950,-14)→(-950,990) — Trellisdown;
  `wicket-north-approach` (-950,-500)→(-1400,-500); `vineyard-lane` (-966,-30)→(-1400,-30).
- `south-band` (0,870) (0,960) (-300,1000) (-700,1010) (-950,990) and `south-band-east` (0,960) (400,1000) (800,1000)
  (950,960) — the Saltbucket hinterland; `harbour-road` (-950,990)→(-1400,1000).
- `unmown-road` (-950,-950) (-1150,-980) (-1400,-1020).
(Import `HIGHWAYS` from '../config' and look them up by these ids rather than hard-coding the points.)

## Change
- `games/gnome-theft-auto/src/living/roadside.ts` (+ exported pure `planRoadside(): { pieces: Piece[]; texts: { text: string; x: number; y: number; z: number; yaw: number; w: number; h: number }[] }`):
  - Along each listed road, every ~220-300 m (seeded), alternate sides, 9-12 m from the centre line, one "stop":
    a lay-by (2 `hamlet-picnic-table` + `litter-bin` + a `bench`), a bus shelter (`bus-shelter` + timetable text plate,
    e.g. "BUS: Tuesdays / (some Tuesdays)"), a `wayside-shrine` with a bunch of flowers, a `hamlet-phone-box` alone in a
    field ("for emergencies and for gnomes who like phone boxes"), or a field gate with 4-8 `drystone-wall` sections
    running away from the road. Mix them so no two neighbouring stops are the same kind.
  - A `milestone` every ~400 m with a textPlate on its face naming the next place and a distance in a gnome unit
    (e.g. "MITTENHOLT 3 FURLONGS", "DUNELOW 2 WHISTLES", "THE UNMOWN 1 STROLL", "PARDONLIN 4 BAGUETTES").
  - A `trail-fingerpost` at each band-road junction (Trellis Cross side roads, the Unmown road turn at (-950,-950), the
    harbour road turn at (-950,990), the south-band/south-band-east fork at (0,960)), 8 m off the junction.
  - Skip any spot within 90 m of a hamlet centre or the High Tarn, inside a reserved rect grown by 10 m, in water
    (`waterAt`), on another road (`roadDist` < 8), or overlapping `boxes` (placePieces handles solid overlaps).
  - Budget: at most ~60 stops and ~400 pieces in total (phones). One `placePieces` call named 'roadside'; text plates as
    separate meshes (few: milestones + shelters).
- NEW `games/gnome-theft-auto/src/living/roadside.test.ts`: the plan is deterministic (two calls equal); >= 25 stops'
  worth of pieces and >= 10 milestones with text; nothing within 8 m of any road centre line; nothing within 90 m of a
  hamlet or the tarn; no 'tent', 'shack' or 'construction' id in the plan.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/living/roadside.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
Other `living/*` files, `settlements.ts`, prefabs.
