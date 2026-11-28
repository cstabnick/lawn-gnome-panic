Epic: FX11 B (placement, parallel) · Issue B5: two kilometres of beach with stories on it; the X; the Saltcut's banks and mouth (G3#13, G3#14 X, G3#26 dressing)
Depends on: epic A · Agent: Sonnet · Dev port 5545

(The Environment section the lead gave you applies.)

## Goal
- G3#13: "All the dressing sits between x -300 and 300. The west strand and the east end are bare sand and sea. The treasure X at (-520, 1170) has nothing on it, and neither does the Saltcut mouth (770, 1185), stop 3 of the Pirate Tours quest." Fix: "Add 6-10 small hand-placed beach scenes along the strand: groynes, a rowing boat pulled up, rock pools with a crab, windbreaks round a picnic, a shipwreck rib, lifebuoy posts every 150 m, a fisherman's winch, and Dunelow's stretch of beach (its deckchair hire). Dress the X and the Saltcut mouth: a marker post, and a tiny lighthouse or daymark ('where the Puddle Sea learned to run downhill')."
- G3#14: "Step 1 says 'Dig on the western beach'. Nothing marks the spot. The toast 'Only a boot.' appears, but there is no boot." Fix: an X, a dug hole and a boot at `CHART_X` (-520, 1170).
- G3#26: "A straight 14 m channel with hard, uniform pale banks, no reeds, posts or moorings, and nothing to mark where it meets the sea." The channel was bent in epic A; you dress it: reeds and mooring posts on the banks, a daymark at the mouth with a sign.
You fill `src/coast/beachScenes.ts` (a stub: `buildBeachScenes(scene, boxes)` is already called by `buildCoast`; `BEACH_FOLK` is added to the residents by life.ts).

## Read first
- `games/gnome-theft-auto/src/coast/beachScenes.ts` (stub), `src/coast/config.ts` (`COAST.shoreZ` 1190; the town's dressing is x -310..240 (boardwalk.ts beach dressing, the Last Tube at x 132..168): stay outside x -320..320 except for lifebuoy posts), `src/quests/coastQuests.ts` (`CHART_X` (-520, 1170), `SALTCUT_MOUTH` (746, 1186)).
- `src/water.ts` (`courseProfile('saltcut')`: the channel's centre-line samples `{ x: number[], z: number[], ... }` (read its type), `waterDepthAt(x, z)`), `src/terrain.ts` (`heightAt`), `src/data/levels/south-shore.level.json` (the `saltcut` path; the beach is z 1140..1190; the sea starts at about z 1190; dunes at z 1058..1092).
- `src/living/hamletDunelow.ts` (Dunelow at (-560, 950): its beach is the strand below it, about x -620..-480, z 1145..1185; its notice says deckchair hire is 1 Acorn).
- New prefabs in `packages/prefabs/src/catalog/gta-coast-beach.ts` (read each `about:`): `groyne`, `rowing-boat`, `rock-pool`, `windbreak`, `wreck-rib`, `lifebuoy-post`, `fishing-winch`, `saltcut-daymark`, `x-marker-post`, `driftwood-pile`, `oar-pair`, `hung-net`, `towel-line`; `gta-coast-town.ts`: `wellies`, `marram-grass`. Existing: `critter-crab`, `reed-clump`, `reed-bed`, `wooden-post`, `pier-post`, `rope-coil`, `walnut-dinghy`, `deck-chair`, `beach-umbrella`, `picnic-blanket-spread`, `bird-gull`, `garden-rock`, `bucket-and-spade`.
- `packages/prefabs/src/batch.ts` `buildStaticPrefabs(placements)` (merge each scene's props into 1-3 draw calls) and `src/cull.ts` `registerCull(obj, 'prop')`; `@lawn/depth` `flatLayer(mat, LAYER.decal)` for anything flat on the sand.
- `src/coast/sign.ts` `coastSign(text, opts)` (prints both faces).

## Change: `src/coast/beachScenes.ts` (+ `src/coast/beachScenes.test.ts`)
1. 8-10 scenes, each hand-placed (a small table of props with x, z, yaw, scale), spread along x -1000..-330 and 330..1000 (and a couple further if the beach continues), each telling a tiny story without words, e.g.: a fisherman's winch hauling up a rowing boat, with a net drying and a gull on the bow; a rock pool with two crabs and a child's bucket; windbreaks round a picnic blanket with a gull walking off with a sandwich (a small prop); a wreck rib half in the sand with marram grass; a run of 3-4 groynes running down into the sea every 60-80 m on one stretch; a lone deckchair facing the sea with a towel line; driftwood and a beached dinghy. Vary everything; no two scenes alike.
2. Lifebuoy posts every about 150 m along the top of the beach (z about 1150, both sides of town, including in town where there is room: check each spot is clear of existing dressing and on dry sand).
3. Dunelow's stretch (x about -620..-480): a deckchair hire: a row of 6-8 deck chairs (striped, uneven), a stack, an attendant (a `BEACH_FOLK` resident) and a sign `"DECKCHAIRS\nHIRE 1 ACORN\n(Chairs not responsible for gulls)"`.
4. The X (G3#14) at `CHART_X` (-520, 1170): a big X (two crossed red-brown strips, about 3 m long, 0.4 wide, flat on the sand on `flatLayer(..., LAYER.decal)`, 2 cm above the ground following its height), a dug hole beside it (a dark sand disc decal plus a small heap of sand: a squashed sand-coloured `garden-rock` or a prefab mound), the `x-marker-post`, and one `wellies` boot lying in the hole ("Only a boot."). Keep it 6 m clear of Dunelow's chairs.
5. The Saltcut (G3#26): read the channel's samples with `courseProfile('saltcut')`; along both banks (offset about 8-9 m from the centre line, on dry ground: check `waterDepthAt === 0`), clumps of `reed-clump` / `reed-bed` in irregular groups and 4-6 mooring posts (`wooden-post` or `pier-post`, some with a `rope-coil`), a moored `walnut-dinghy` prop at one post if it fits. At the mouth's east bank, at or near (746, 1186) (check it is dry; if not, the nearest dry bank point), a `saltcut-daymark` at scale 4 with a sign `"THE SALTCUT\nWhere the Puddle Sea learned to run downhill."` facing the beach.
6. `BEACH_FOLK`: 2-4 residents (ids `coast-beach-*`): the deckchair attendant, a fisherman at the winch, maybe a rock-pool child. Names and one dry line each (they get lore entries from the lore worker).
7. Performance: merge each scene with `buildStaticPrefabs` where the props are static, and `registerCull` each scene group, so a far scene costs nothing.
8. Test: every prop of every scene stands on dry ground (`waterDepthAt(x, z) === 0`) except things meant for the water's edge (groyne ends, which may be in < 1 m of water); the X props are within 6 m of `CHART_X`; the daymark is within 25 m of the Saltcut's last sample.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/coast` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean.
- Shots (port 5545): `beachW:-700,1150,0.4` and `beachW2:-850,1160,-0.3` (compare the editors' `a10-beachW.png`), `headlandE:800,1160,-0.3` and `beachE:500,1150,0.4` (compare `a11-headlandE.png`, `a08-beachE.png`), `xmark:-520,1158,0`, `dunelowB:-560,1140,0.2`, `saltcut:760,1120,0.2` and `mouth:735,1170,0.4` (compare `a12-saltcut.png`). Iterate until each scene reads as placed by hand.
- Perf: `node tools/gta-perf.mjs http://localhost:5545/ --cpu 4 --legs '[["strand",[[-1000,1160],[1000,1160]]]]'`; report.

## Out of scope
Every other file. Do not move the quest constants (tell the lead if `SALTCUT_MOUTH` should move).
