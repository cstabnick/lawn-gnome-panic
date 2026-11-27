# R1 round 1: fix plan

The fix round for the editorial review of Gnome Theft Auto batch 3. Every finding of `G1`–`G12` (round 1) is assigned to exactly one fix epic, or marked won't fix with its reason. The rulings in `decisions.md` are final; each brief quotes the ones it applies. Briefs: [`fix/`](fix/). Process: [big-batch-orchestration.md](../../../process/big-batch-orchestration.md), "Editorial review" step 4.

**24 fix epics in 8 waves. 375 findings: 374 assigned, 1 won't fix, 0 unplaced.**

## How the cut works

- **Shared fixes first, done once (GR8, D58).** Waves 1–2 fix what several groups found: signs and plates, particles, water, undersides (FX01); interior cutaways and cameras (FX02); the touch activity mode and holstering (FX03); the vehicle capsule and the drive camera (FX04); quest-scoped stage sets and story-scene light and weather (FX05, GR3/GR6); terrain rock paint, route clearance, residents on decks and speech bubbles (FX06). Region epics then only place content on top.
- **Then the regions** (waves 3–6), **then vehicles, activities and UI** (waves 6–8), **then the story per act** (waves 7–8) with the shared story kit (FX21: the `previously` field and the reward chip, GR4/GR5) landed early in wave 3, and **the lore** with act IV (FX24).
- **File ownership.** Each brief lists the files it may edit. No two epics in one wave own the same file. Hot files (`config.ts`, `app.ts`, `hud.ts`, the prefab catalog index, `rulings.md`, `AGENT_INDEX.md`) take only small additive edits, resolved at merge. `hud.ts` has one real owner (FX19); `assembly/kernel.ts` (the Wasm paint mirror) is edited by at most one epic per wave (FX06, FX12, FX15).
- **Load.** Each epic is sized for one Opus lead and at most ~30 haiku-worker issues (nits bundled). Musts first; if a lead runs out of room, the should and could items carry to round 2.
- **GR9** applies to all: no new systems beyond the listed exceptions, no new online modes, density passes within +15% phone frame time (`node tools/gta-perf.mjs --cpu 4`).

## Fix epics

| Epic | Name | Wave | Depends on | Owns (main file areas) | Findings | Decisions |
|---|---|---|---|---|---|---|
| [FX01](fix/FX01-signs-particles-undersides.md) | Signs, plates, particles, water and undersides (shared render) | 1 | — | homes/pieces.ts `textPlate` + `signBoard`; weather/render.ts, weather/config.ts, atmosphere.ts; waterMesh.ts, `WATER`; megaBlock/deck underside material | 14 | D58 |
| [FX02](fix/FX02-interiors-and-cameras.md) | Interiors: cutaway walls, backgrounds and entry cameras | 1 | — | interiors/kit.ts, runtime.ts, rooftops.ts; doublePot.ts roof arrival; homes/interiors.ts; camera.ts (interior branch); home/decorUi.ts | 7 | D58 |
| [FX03](fix/FX03-activity-mode-and-holster.md) | Touch activity mode, holstering and activity HUD layout | 1 | — | input.ts; new activityMode.ts; app.ts hideGun block; court/skate/golf HUDs, golf/runtime.ts swing; workplaces shift HUD, firefighter station/hose | 14 | D30, D58 |
| [FX04](fix/FX04-vehicle-collision-camera-feel.md) | Vehicle capsule collision, drive camera, handling feel and stunt ramps | 2 | FX02 | collide.ts; vehicles.ts collision + roll; simdrive.ts; camera.ts drive `VIEW`; handling.ts, suspension.ts; ramps.ts, stunts.ts | 11 | D21, D31, D36 |
| [FX05](fix/FX05-stage-sets-and-scene-light.md) | Quest-scoped stage sets, scene weather and key-frame light (GR3, GR6) | 2 | FX02 | stageSets.ts; quests/stages/story/**; cutscene/director.ts, script.ts, timeline.ts, pacing.test.ts; key-frame scene staging | 9 | D3, D5, D49 |
| [FX06](fix/FX06-ground-placement-residents.md) | Ground paint, route clearance, residents on decks and speech bubbles | 2 | FX01 | terrainPaint.ts (+ Wasm mirror); scenery.ts; ambientGnomes.ts; coast deck height; cutscene/cast.ts looks; campus flatten, rutbottom batter, unmown trails paint | 10 | D58 |
| [FX07](fix/FX07-turfton-landmarks-green-estates.md) | Turfton landmarks, Founders' Green before and after, the Even-Estates | 3 | FX01, FX04, FX05 | City Hall block, mapPois.ts; city/megaBlock.ts, world.ts Thorne Tower; parks/blocks.ts, worldChanges greenAndBarn/estates; country/estates*.ts; #9/#14 hints | 10 | D1, D2, D4, D8 |
| [FX08](fix/FX08-turfton-homes-streets.md) | Turfton homes, Flat 3B, the Bodega, the Underspan and street life | 4 | FX01, FX02, FX03, FX07 | homes/townHomes.ts, saucerCourt.ts; interiors/showcase/flat3b.ts, bodega.ts; worldChanges/rows/saucerCourt.ts; skate/build.ts; societies/underspan; towers/facadeAtlas.ts | 10 | D6, D8, D5 |
| [FX09](fix/FX09-pardonlin-ground.md) | Pardonlin's ground: pavements, lanes, the Grand Platz, the Thymes | 3 | FX01, FX06 | pardonlin/districts/**, plan, layout, town.ts ground; pardonlin.level.json; the Thymes, the Basin, the Jardin; comedy/club.ts door | 11 | D9 |
| [FX10](fix/FX10-pardonlin-life.md) | Pardonlin's life: queues, people, shops, roundabouts, the Wickets, sound and night | 4 | FX06, FX09 | pardonlin/life.ts, activities.ts, sound.ts, wickets.ts; shop mixes; roundaboutIslands.ts (Pardonlin); trafficDirectorsView.ts; night lights; Pardonlin lore | 14 | D10, D11 |
| [FX11](fix/FX11-the-coast.md) | The coast: the bucket, dunes and sand, the boardwalk, pier, wheel, Queen and beach | 4 | FX01, FX06 | coast/**; quests/coastQuests.ts, stages/coast.ts; tubing/**; boatTraffic.ts; prefabs gta-coast.ts; coast lore | 24 | D14, D58 |
| [FX12](fix/FX12-snowcap-snow-slope-pond.md) | Snowcap Rise snow, Snowdrop Slope, the Wool Run and Pail Pond | 5 | FX01, FX03, FX06 | landforms/northHighlands.ts + Wasm mirror; north-highlands.level.json; winter/**; critters/snowcap.ts, fells.ts; snowcap lore | 14 | D12, D24, D26 |
| [FX13](fix/FX13-capwood-and-hatbrim.md) | Capwood forest and run, the Hatbrim, Mittenholt and the High Tarn | 6 | FX06, FX12 | capwood/**; raceTrack capwoodRun, ribbons, hatbrimPads; ford visual; mountainRoutes/**; hamletMittenholt.ts, highTarn.ts; keyhole-arch prefab | 15 | D13, D25, D58 |
| [FX14](fix/FX14-the-east.md) | The east: Rootwell campus, the Anthill, Rootwell Field, Pinwheel Ridge, Rutbottom | 5 | FX01, FX04, FX06 | campus/**; rutbottom/**, raceTrack/defs/rutbottom.ts; quests/rootwellQuests.ts; parking.ts (campus); sites.ts (field station); east prefabs and lore | 31 | D17, D22, D23 |
| [FX15](fix/FX15-unmown-and-west-country.md) | The Unmown's tall grass and the west country | 6 | FX01, FX06, FX16 | landforms/theUnmown.ts (+ Wasm mirror); unmown/**; living/config.ts hides; flock/build.ts; hamletEspalier.ts; country manor, vineyard, croft, camps; new west dressing | 10 | D16, D18 |
| [FX16](fix/FX16-hedgeworth-and-west-interiors.md) | Hedgeworth Links, Loamdeep, the Flock's tent and the manor hall | 5 | FX01, FX02, FX03 | golf/** (not hud.ts or the swing); societies/loamdeep/**; societies/flock/tent.ts; country/manorInterior.ts | 10 | D19, D58 |
| [FX17](fix/FX17-vehicles-content.md) | Vehicles content: parts, glaze, dealers, cabs, police chassis, horns | 6 | FX04 | glaze*.ts, garages.ts; debris.ts; npcChassis.ts, police.ts; dealers/**; lockup/**; driveGrips.ts; skim.ts; roundabouts.ts; audio.ts horns; vehicle prefabs | 14 | D32, D33, D34, D35 |
| [FX18](fix/FX18-jobs-activities-racing.md) | Jobs, activities and racing: workstations, pay, feedback, meets | 7 | FX03, FX11 | workplaces/** (not FX03's HUD text); jobs/**; dewdrop/**; streetRace/**, streets.ts Dash; objectivesRace.ts; app.ts dev hooks; party README | 23 | D10, D15, D27, D28, D29 |
| [FX19](fix/FX19-hud-map-phone-layout.md) | HUD, map and phone layout | 7 | FX03, FX12, FX11 | hud.ts; new ui/layers.ts; ui/dock.ts; mapIcons.ts, bigMapView.ts; briefing.ts CSS; birding pill | 20 | D12, D14, D38, D39, D58 |
| [FX20](fix/FX20-gnomlet-options-loading-sound.md) | Gnomlet tablet, options, loading screen and UI sound | 8 | FX19, FX21 | gnomlet/**; mounted panels (bag, ledger, exchange, journal, journals, app kits); options.ts, viewPrefs.ts; loading/**; sound/**, radio/player.ts | 20 | D37, D40, D41, D42, D43 |
| [FX21](fix/FX21-story-kit-previously-reward-chip.md) | Story kit: the `previously` field, the reward chip, act IV for veteran saves | 3 | — | quests/types.ts `previously`; new quests/story/previously.ts; quests/journal.ts; briefing.ts reward chip; comms tests; questSave/chain queue (D7) | 1 | D7, D45, D46 |
| [FX22](fix/FX22-story-acts-1-2.md) | Story acts I-II: order, continuity, briefings, voices and variety | 7 | FX05, FX07, FX21 | quests/story/01-35; act I-II scenes (ch1-ch3, m02-m35, dialogue); quests/unlocks.ts (act I-II rows); cutscene/cast.ts (Cam) | 27 | D25, D45, D46, D50, D51, D52, D57, D59 |
| [FX23](fix/FX23-story-act-3.md) | Story act III: the crew, the turn, voices, stakes and set pieces | 8 | FX05, FX21, FX14, FX15, FX16 | quests/story/36-53; act III scenes (ch3b, ch3c, m36-m53, dialogue); unlocks.ts (act III rows); worldChanges W11/W13/W14, mownScar.ts; tessie.ts | 29 | D25, D45, D46, D47, D50, D53, D54, D57 |
| [FX24](fix/FX24-story-act-4-and-lore.md) | Story act IV and the lore base | 8 | FX05, FX07, FX21 | quests/story/54-70; act IV scenes (ch4*, ch5, m54-m70a); `continues` part hook; worldChanges W16/W19; storyMarks.ts; docs/lore/** | 26 | D45, D48, D50, D55, D56, D46 |

## Waves

At most three epics per wave, chosen so their owned files do not overlap. A wave starts when the previous one has merged and the batch branch builds and tests green.

| Wave | Epics | Why these run together |
|---|---|---|
| 1 | FX01 Signs, plates, particles, water and undersides (shared render), FX02 Interiors, FX03 Touch activity mode, holstering and activity HUD layout | Shared render, interiors and touch input: disjoint modules (plates/weather/water; interiors/*; input.ts and the activity HUDs). |
| 2 | FX04 Vehicle capsule collision, drive camera, handling feel and stunt ramps, FX05 Quest-scoped stage sets, scene weather and key-frame light (GR3, GR6), FX06 Ground paint, route clearance, residents on decks and speech bubbles | Vehicles (collide/camera/handling), the scene runner and stage sets, and terrain paint/scenery/ambient gnomes: disjoint, and each needs wave 1 only lightly. |
| 3 | FX07 Turfton landmarks, Founders' Green before and after, the Even-Estates, FX09 Pardonlin's ground, FX21 Story kit | Turfton landmarks and the Green, Pardonlin's ground, and the story kit (types/journal/briefing, no row files). |
| 4 | FX08 Turfton homes, Flat 3B, the Bodega, the Underspan and street life, FX10 Pardonlin's life, FX11 The coast | Turfton homes, Pardonlin life (after its ground), and the coast. |
| 5 | FX12 Snowcap Rise snow, Snowdrop Slope, the Wool Run and Pail Pond, FX14 The east, FX16 Hedgeworth Links, Loamdeep, the Flock's tent and the manor hall | Snowcap snow and Snowdrop (owns the Wasm paint mirror this wave), the east, and Hedgeworth and the west interiors. |
| 6 | FX13 Capwood forest and run, the Hatbrim, Mittenholt and the High Tarn, FX15 The Unmown's tall grass and the west country, FX17 Vehicles content | Capwood and the Hatbrim (after the snow), the Unmown and the west country (owns the Wasm mirror this wave), and vehicles content. |
| 7 | FX18 Jobs, activities and racing, FX19 HUD, map and phone layout, FX22 Story acts I-II | Jobs and racing, the HUD and map (sole owner of hud.ts), and story acts I–II. |
| 8 | FX20 Gnomlet tablet, options, loading screen and UI sound, FX23 Story act III, FX24 Story act IV and the lore base | The Gnomlet and options (after layers.ts), story act III, and story act IV with the lore. |

## Shared fixes and their single owner (GR8, D58)

| Shared defect | Owner | Consumers |
|---|---|---|
| Long signs, plates on boards, two-faced boards, "Read the notices" | FX01 | FX07–FX16 place boards with `signBoard` |
| Weather particles, rain overcast, sea colour and foam, far-skyline fog | FX01 | all regions |
| Elevated undersides as voids (emissive underside material) | FX01 | FX07 (Double Pot), FX16 (Loamdeep) |
| Interior cutaway: floating signs, sky band, camera in walls, entry-view test | FX02 | FX08, FX16 |
| Touch activity mode, holstering in activities and peaceful interiors (D30) | FX03 | FX12 (sleds/skis), FX16, FX18 |
| Vehicle capsule collision (D36), drive camera by vehicle size, ramp skins (D21) | FX04 | FX14, FX17 |
| Stage sets quest-scoped and off roads (GR3) + test; scene weather and key light (GR6) | FX05 | FX22–FX24 |
| Rock paint only where the lore says rock; feathered paint edges; scenery off routes + test | FX06 | FX13, FX14, FX15 |
| Ambient gnomes on decks (`y` / `surface`); speech bubble clamp; one look per character | FX06 | FX10, FX11, FX14 |
| Minimap inside interiors; minimap follows painted ground; z-order scale | FX19 | FX20 |
| `previously` field, reward chip, Previously/fee tests (GR4/GR5), veteran-save framing (D7) | FX21 | FX22–FX24 |
| GR2 before-beat name test (Founders' Green) | FX07 | FX22–FX24 keep it green |

## Every finding

Priority: the decision's priority where one applies, otherwise blocker → must, polish → should, nit → could. "Split" means another epic does one named part (see the owning brief).

| Finding | Sev / type | Title | Epic | Priority | Decision |
|---|---|---|---|---|---|
| G1#1 | blocker / craft | The HOA cell and a café table stand in the Double Pot Tunnel's traffic lanes, solid, from … | FX05 | must | D3 |
| G1#2 | blocker / craft | City Hall does not exist: the civic forecourt sits in front of a Buck-Iron store | FX07 | must | D8 |
| G1#3 | blocker / craft | Taking the lift up to the Thorne Helipad puts the camera inside the lift kiosk | FX02 | must | — |
| G1#4 | polish / craft | Interior wall signs float in the air when their wall is cut away | FX02 | must | D58 |
| G1#5 | polish / craft | Elevated undersides render as a flat black-green ceiling | FX01 | must | D58 |
| G1#6 | polish / spirit | Turfton's homes and towers read as a human European city, not a gnome garden town (spirit) | FX08 | should | D8 |
| G1#7 | polish / spirit | Founders' Green is named, mapped and playable before it "opens" in #15 | FX07 | must | D1 |
| G1#8 | polish / craft | The Even-Estates sites are always up: before #7 and after the finale | FX07 | must | D2 |
| G1#9 | polish / craft | Estates: the boulder still blocks construction-1's gate; the show-homes read as … | FX07 | must | D2 |
| G1#10 | polish / craft | The Double Pot has no presence at street level | FX07 | must | D8 |
| G1#11 | nit / craft | Every walk-in shows the sky or void above the cut-away ceiling, and it is inconsistent | FX02 | must | D58 |
| G1#12 | polish / spirit | Weapons and combat buttons inside the player's own flat | FX03 | must | D30 |
| G1#13 | nit / craft | Street barks and quest toasts play inside the flat | FX02 | could | — |
| G1#14 | polish / craft | Diggs' bungalow: the spawn faces the back of a wardrobe | FX02 | must | D58 |
| G1#15 | polish / craft | The Gutter Bowls show the street a blank 3 m concrete wall | FX08 | should | — |
| G1#16 | polish / craft | The park-fountain stunt ramp is an undressed black wedge with neon-cyan edges in Gnorwin … | FX04 | should | D21 |
| G1#17 | polish / craft | The Underspan's manifesto jokes cannot be read | FX01 | must | D58 |
| G1#18 | polish / craft | Saucer Court W09: Pip's hammock floats on the façade | FX08 | should | — |
| G1#19 | polish / spirit | Flat 3B does not change when Pip moves in (W09) | FX08 | should | D6 |
| G1#20 | polish / craft | The Bodega reads as a living room, not a shop | FX08 | should | — |
| G1#21 | polish / craft | A stage set is coplanar with the Double Pot façade (large flicker in the tunnel) | FX05 | must | D3 |
| G1#22 | polish / craft | The Underspan is a raw building site under a void; the ground is desert sand | FX08 | should | — |
| G1#23 | polish / spirit | The W03 opening crowd stands forever after #15 | FX07 | should | D4 |
| G1#24 | polish / craft | Decorate panel on a phone: the room is hidden and the plan's labels are clipped | FX02 | should | — |
| G1#25 | nit / craft | Thorne Tower's base and the Mulch Club are lightless black blocks at street level | FX07 | could | — |
| G1#26 | nit / craft | Building-site nights are dark and the night watchman is not visible; firefly sprites read … | FX07 (split: part in FX01) | could | — |
| G1#27 | nit / craft | Ground-floor glazing glows flat cyan at night | FX08 | could | — |
| G1#28 | nit / craft | Flat 3B's dressing is oversized | FX08 | could | — |
| G1#29 | nit / craft | Lore drift in Turfton entries | FX07 | must | D1 |
| G1#30 | nit / spirit | Kerb Row and Patio Heights are quiet: one resident each, no street life | FX08 | should | D8 |
| G2#1 | blocker / spirit | The streets have lawn verges, not pavements | FX09 | must | D9 |
| G2#2 | blocker / spirit | No ambling paths: big grid blocks with lawn inside | FX09 | must | D9 |
| G2#3 | blocker / spirit | The Grand Platz is huge and bare | FX09 | must | D9 |
| G2#4 | blocker / craft | The Thymes reads as a painted road | FX09 | must | D9 |
| G2#5 | blocker / spirit | Nobody is in the queues | FX10 | must | D10 |
| G2#6 | polish / spirit | A thin population, and no cyclists in the streets | FX10 | should | D10 |
| G2#7 | polish / craft | The Beetle Market is bare stall frames on a lawn | FX09 | should | — |
| G2#8 | polish / craft | Basin Quay and the Basin are empty | FX09 | should | — |
| G2#9 | polish / craft | The Jardin stops being a garden past the parterre | FX09 | should | — |
| G2#10 | polish / craft | Paving: grass in the seams, tiles that look like wood, raised slab edges | FX09 | must | D9 |
| G2#11 | polish / craft | Poster boards are blank from behind | FX01 | must | D58 |
| G2#12 | polish / craft | Long sign texts are unreadable; Radio Adagio's own banner can't be read | FX01 | must | D58 |
| G2#13 | polish / craft | Shop names repeat street after street | FX10 | should | — |
| G2#14 | polish / spirit | Too many shops of too few types, in the wrong places | FX10 | should | D11 |
| G2#15 | polish / craft | Le Petit Groan is a grey hole in the middle of the Platz | FX09 | should | — |
| G2#16 | polish / craft | The race meet's crowd always stands on the Opera forecourt, using Turfton's lines | FX18 | should | D10 |
| G2#17 | polish / craft | The steeple bell is in the wrong place and rings every 90 seconds | FX10 | should | — |
| G2#18 | polish / craft | Whole districts have no sound | FX10 | should | — |
| G2#19 | polish / craft | The town is flat and unlit at night | FX10 | should | — |
| G2#20 | polish / craft | Speech bubbles run off screen and swamp the phone view | FX06 | must | D58 |
| G2#21 | polish / spirit | Roundabout islands are generic and look unfinished | FX10 | should | D11 |
| G2#22 | polish / spirit | The Wickets: an empty customs hut and an entrance with no joke | FX10 | should | D11 |
| G2#23 | polish / craft | The lore disagrees with the game about places | FX10 | should | — |
| G2#24 | polish / craft | Allotment sheds are post booths, and the Folly is a post booth | FX10 | should | — |
| G2#25 | polish / craft | Low-end phone performance was never checked on the densest districts | FX09 | must | D9 |
| G2#26 | polish / craft | A wide strip of lawn around the Opera Hall | FX09 | must | D9 |
| G2#27 | nit / craft | Wilhelmina Marrow stands inside an allotment bed | FX10 | could | — |
| G2#28 | nit / craft | Brigitte's reward line promises a joke and doesn't deliver it | FX10 | could | — |
| G2#29 | nit / spirit | The Pardonlin warden wears HOA green in a town that is "not an HOA town" | FX10 | should | D11 |
| G2#30 | nit / craft | Untextured white squares drift across the sky in "Blustery" weather | FX01 | must | D58 |
| G3#1 | blocker / craft | Everyone on the boardwalk walks 22 cm inside the planks | FX06 | must | D58 |
| G3#2 | blocker / craft | Reel Ruth is buried under the pier spur; deck residents cannot stand on decks | FX06 | must | D58 |
| G3#3 | polish / craft | Driftwood, Marram and Bilge each wear 2–3 different outfits; the angler wears Driftwood's | FX06 | must | D58 |
| G3#4 | polish / craft | Captain Bilge loiters on the dunes, 100 m from her ship, and is also in her cabin | FX11 | should | — |
| G3#5 | polish / spirit | Saltbucket has no bucket, no dunes and no marram grass; the boardwalk sits on mown lawn | FX11 | must | D14 |
| G3#6 | polish / craft | The promenade is a 420 x 46 m empty plank field | FX11 | must | D14 |
| G3#7 | polish / craft | The six stalls are one empty booth in six tints | FX11 | should | — |
| G3#8 | polish / craft | Long Spoon Pier does not read as a spoon | FX11 | should | — |
| G3#9 | polish / craft | The Bathtub Queen reads as a red box barge, and is dark at night | FX11 | should | — |
| G3#10 | polish / craft | The sea looks like the loch, with streaks that read as sandbars | FX01 | should | — |
| G3#11 | polish / craft | The shore foam strip glows at night and is a constant-width ribbon | FX01 | should | — |
| G3#12 | polish / craft | The seaside is dead at night | FX11 | should | — |
| G3#13 | polish / craft | Two kilometres of empty beach; the quest and tour spots are bare | FX11 | should | — |
| G3#14 | polish / craft | The Queen's Treasure contradicts itself | FX11 | should | — |
| G3#15 | polish / craft | Plank & Pickle is Sal's in quest text; Marram's free-ride reward does not exist | FX11 | should | — |
| G3#16 | nit / craft | "Tubing the Long Spoon" is nowhere near the Long Spoon | FX11 | could | — |
| G3#17 | polish / craft | The Spokewheel has no bell, ejects the rider, and has no leg colliders | FX11 | should | — |
| G3#18 | polish / craft | The player water-skis sitting down | FX11 | should | — |
| G3#19 | polish / craft | The Last Tube turns a blank wall and a blank board to the sea | FX11 (split: part in FX01) | must | D58 |
| G3#20 | nit / craft | Speech bubbles repeat the sign next to the speaker | FX11 | could | — |
| G3#21 | polish / craft | Several vignettes use the wrong props, so their story does not read | FX11 | should | — |
| G3#22 | nit / craft | The lost-property sign and the pile of hats are 20 m apart | FX11 | could | — |
| G3#23 | nit / craft | Notices from the lore are missing on the pier, the wheel and the beach | FX11 | could | — |
| G3#24 | polish / craft | The ambient sound is thin and patchy | FX11 | should | — |
| G3#25 | nit / craft | The minimap paints the south band as sand, but the ground is lawn | FX19 | must | D14 |
| G3#26 | polish / craft | The Saltcut is a ruler-straight ditch with nothing at its mouth | FX11 | should | — |
| G3#27 | polish / spirit | The Saltbucket Lay-By is neither at Saltbucket nor a lay-by | FX18 | should | D15 |
| G3#28 | nit / craft | Dunelow prices in pence, and its notice board is unreadable | FX01 | must | D58 |
| G3#29 | nit / craft | The beach dressing looks stamped | FX11 | could | — |
| G3#30 | polish / craft | Sea traffic is inland boats, and the Saltcut cruiser runs at the moored Queen | FX11 | should | — |
| G3#31 | nit / craft | The pier tour step's text and spot disagree; no patrol appears | FX11 | could | — |
| G3#32 | nit / craft | Stale placeholder constant | FX11 | could | — |
| G4#1 | blocker / craft | Snowcap Rise is green: Pail Pond is ice in a daisy meadow | FX12 | must | D12 |
| G4#2 | polish / spirit | How white should the Rise be? (decide once) | FX12 | must | D12 |
| G4#3 | polish / craft | Snow particles render as hard white squares | FX01 | must | D58 |
| G4#4 | nit / spirit | Falling snow never settles and does not change the ground | FX12 | could | D12 |
| G4#5 | nit / craft | The minimap shows the snowfield and Pail Pond as green | FX19 | must | D12 |
| G4#6 | polish / craft | The Woolly Sock Lodge sinks into the slope | FX12 | should | — |
| G4#7 | polish / craft | Snowdrop Slope is an empty white plane, and the snow-to-grass edge is ruler-straight | FX12 | should | — |
| G4#8 | polish / spirit | The Wool Run is about 18 s long; the brief asked for 60-80 s | FX12 | should | D26 |
| G4#9 | polish / craft | No run-out: you finish and slide onto the band road | FX12 | should | — |
| G4#10 | nit / craft | The lodge looks like a plain shed, and it is dark at night | FX12 | could | — |
| G4#11 | polish / craft | Phone: starting a ride drops a desktop key card over the rider, with three more toasts … | FX03 | should | — |
| G4#12 | polish / craft | Pail Pond is a vast, empty ice plain, and the pail does not read as a pail | FX12 | should | — |
| G4#13 | polish / spirit | The napping bear lies on its back with its legs out and looks dead | FX12 | must | D24 |
| G4#14 | polish / craft | The Bear Deck has no deck, and its sign hides the middle bear | FX12 | should | — |
| G4#15 | nit / craft | The mug bear's cocoa mug is too small to see | FX12 | could | — |
| G4#16 | blocker / craft | Pines and boulders stand on the Capwood Run's road (including the summit) | FX06 | must | — |
| G4#17 | polish / spirit | The Capwood Run climbs as a trombone of parallel straights that leave stair-step scars | FX13 (split: part in FX06) | should (rock part: must, FX06) | D13, D58 |
| G4#18 | polish / spirit | Capwood reads as a lawn with toadstools, not a forest | FX13 | should | D13 |
| G4#19 | polish / craft | The night glow is opaque mint balls, not a faint glow | FX13 | should | — |
| G4#20 | polish / craft | The Great Ring is a flat dark-green blob | FX13 | should | — |
| G4#21 | polish / craft | The Gill Ford is a dark rectangle, not water | FX13 | should | — |
| G4#22 | nit / craft | The run's road-edge seam and the meadow trenches | FX13 | could | — |
| G4#23 | nit / craft | Paddock clutter on the Fells snow | FX13 | could | — |
| G4#24 | nit / craft | Lore: Capwood's caps are "grey on top", but the game has red, orange and brown caps | FX13 | could | — |
| G4#25 | polish / craft | The Keyhole looks like a concrete footbridge, not a rock arch | FX13 | should | — |
| G4#26 | polish / craft | The High Tarn is a rectangle | FX13 | should | — |
| G4#27 | polish / craft | Ribbon cut-and-fill leaves raw, faceted grey walls along the Brim Gap Road | FX13 (split: part in FX06) | must | D58 |
| G4#28 | polish / craft | The Brim Walk and the summit pads look bulldozed | FX13 (split: part in FX06) | must | D58 |
| G4#29 | nit / craft | The Top Hat lookout looks like a car park | FX13 | could | — |
| G4#30 | nit / spirit | Two photographers waiting for the same shot, 1 km apart | FX13 | should | D25 |
| G4#31 | nit / spirit | Running gags are too dense in the Hatbrim and Mittenholt: "41", "two hats", "since … | FX13 | should | D25 |
| G4#32 | nit / craft | Lore: "no shops on the Rise", but the Top Hat café sells tea and buns | FX12 | could | — |
| G4#33 | nit / craft | Map blip labels mix "the" and "The" | FX19 | could | — |
| G5#1 | blocker / craft | The Anthill wears a grey rock cliff crown. | FX06 | must | D58 |
| G5#2 | polish / craft | Rutbottom's raised corners stand on grey rock walls with sawtooth edges. | FX06 | must | D58 |
| G5#3 | polish / craft | Dirt and gravel patches have blocky stair-step edges. | FX06 | should | — |
| G5#4 | polish / craft | The Anthill's flanks are a featureless dirt cone. | FX14 | should | — |
| G5#5 | polish / craft | The Dust Flats end at the east-band road in a ruler-straight seam. | FX14 | should | — |
| G5#6 | polish / spirit | Rootwell Field Station and the east edge are empty. | FX14 | should | D17 |
| G5#7 | polish / craft | The quad is too big and too empty for gnome scale. | FX14 | should | — |
| G5#8 | polish / craft | The Clod shows a 50 m blank black wall to the campus. | FX14 | should | — |
| G5#9 | polish / craft | Building backs and campus edges are blank. | FX14 | should | — |
| G5#10 | polish / craft | The main gate is two plain pillars with taped-on paper notices. | FX14 | should | — |
| G5#11 | polish / craft | The Tilth Hall interior is unreadable from the door. | FX14 | should | — |
| G5#12 | polish / spirit | The bell doesn't stop anyone. | FX14 | should | D23 |
| G5#13 | polish / craft | Night on campus is dark and lifeless. | FX14 | should | — |
| G5#14 | polish / craft | The Bedstraw House door looks broken. | FX14 | should | — |
| G5#15 | nit / craft | The sugar store vignette is hard to find. | FX14 | could | — |
| G5#16 | nit / craft | The car park is empty. | FX14 | could | — |
| G5#17 | nit / craft | The lodge's name plate is redundant, and the giant cheque isn't giant. | FX14 | could | — |
| G5#18 | nit / craft | The founder's sundial is a giant witch's hat. | FX14 | could | — |
| G5#19 | polish / craft | The observatory dome is a dull grey drum. | FX14 | should | — |
| G5#20 | polish / spirit | Dean's Leap looks like a generic stunt ramp. | FX04 | should | D21 |
| G5#21 | polish / craft | Paying the rent changes nothing in the world. | FX14 | should | — |
| G5#22 | nit / craft | Lore details on the mound are missing or mismatched. | FX14 | could | — |
| G5#23 | polish / craft | Plates float above signposts across E13 and E14. | FX14 | should | — |
| G5#24 | polish / craft | The apron is a bare concrete plain. | FX14 | should | — |
| G5#25 | polish / craft | The tower and runway at night are too dim. | FX14 | should | — |
| G5#26 | blocker / craft | The pinwheel rotors look like loose boxes. | FX14 | must | — |
| G5#27 | polish / craft | The ridge is grey scree and the masts are bare grey poles. | FX14 | should | — |
| G5#28 | polish / craft | Ridge signs disagree with the lore, and Ragwort is "he" in prefab text. | FX14 | should | — |
| G5#29 | nit / spirit | The pinwheel names clash with the lore and with their own colours. | FX14 | could | D22 |
| G5#30 | polish / craft | The jumps don't throw you, and you can't see them. | FX14 | should | — |
| G5#31 | polish / craft | The track surface is a smooth brown ribbon. | FX14 | should | — |
| G5#32 | polish / craft | Corner names aren't in the world. | FX14 | should | — |
| G5#33 | polish / craft | The Impound has no tape and no taped rides. | FX14 | should | — |
| G5#34 | polish / craft | The gate is just a lane, and the infield is an empty field. | FX14 | should | — |
| G5#35 | nit / craft | The bike-wash bucket is full of pink paint. | FX14 | could | — |
| G6#1 | blocker / craft | The Unmown is a mown lawn. | FX15 | must | D16 |
| G6#2 | blocker / craft | Long single-line signs are unreadable: the jokes don't reach the player. | FX01 | must | D58 |
| G6#3 | blocker / craft | Speech bubbles fill the whole screen when the camera is inside the Flock's ring. | FX06 | must | D58 |
| G6#4 | blocker / craft | "Round the back" leads to a blank wall: Brassknock Manor has no back door, and no back at … | FX15 | must | — |
| G6#5 | polish / craft | Hedgeworth's rough is covered in identical mud mounds with bulrushes. | FX16 | should | — |
| G6#6 | polish / craft | Tee boxes and tee markers look placeholder. | FX16 | should | — |
| G6#7 | polish / craft | The course is flat and the giant plants are thin. | FX16 | should | — |
| G6#8 | polish / craft | Wader's Rest is not reedy, and the gate stands in an open field. | FX15 | should | D16 |
| G6#9 | polish / craft | Oldroot Wood is not a wood, and the Wood Hide looks at nothing. | FX15 | should | D16 |
| G6#10 | polish / craft | Reedmere Hide is 55 m from the water. | FX15 | should | — |
| G6#11 | polish / craft | The Unmown's trails have stair-stepped edges. | FX06 | must | D58 |
| G6#12 | polish / craft | The vineyard gate opens onto 50 m of empty lawn, along a 12 m dirt slab. | FX15 | should | — |
| G6#13 | polish / craft | Text plates float off their boards and posts. | FX01 | must | D58 |
| G6#14 | polish / spirit | DJ Moleman's burrow is a big, empty square, and the star mole is hard to see. | FX16 | should | D19 |
| G6#15 | polish / craft | Loamdeep's entry tunnel is a flat-walled corridor under a black void. | FX16 (split: part in FX01) | must | D58 |
| G6#16 | polish / craft | The Flock's "Big Tent" is a plain rectangular room. | FX16 | should | — |
| G6#17 | polish / craft | Brassknock's tasting hall is sparse and murky. | FX16 | should | — |
| G6#18 | polish / craft | Interiors show the sky or a black void above (camera clears low ceilings). | FX02 | must | D58 |
| G6#19 | polish / craft | The clubhouse's "golf umbrella drying by the door" is a huge red-and-white café parasol. | FX16 | should | — |
| G6#20 | polish / spirit | Espalier End falls short of its lore and reads as a ring of tombstones. | FX15 | should | D18 |
| G6#21 | polish / craft | The Burrow Door's porch is a box stuck on a blob. | FX16 | should | — |
| G6#22 | polish / spirit | The open country between the west set pieces is empty, flat, mown lawn. | FX15 | should | D16 |
| G6#23 | polish / craft | Windfall Croft is not run-down. | FX15 | should | — |
| G6#24 | polish / craft | Hole 6's water carry ("The Drip") can't be seen from its tee. | FX16 | should | — |
| G6#25 | polish / craft | On a phone, the golf strip and the Card/Quit buttons sit across the line of play. | FX03 | should | — |
| G6#26 | nit / craft | Turfton's skyline shows as ghostly see-through towers from Windfall Croft. | FX01 | could | — |
| G6#27 | nit / craft | Names are reused across the region. | FX15 | could | — |
| G6#28 | nit / spirit | Deer are gnome-sized. | won't fix (D20: no change. The deer stay gnome-world scale (R-212: herd and quarry are one animal); bigger deer go to the next batch backlog.) | no change | D20 |
| G6#29 | nit / craft | Blustery weather particles are flat untextured squares. | FX01 | must | D58 |
| G6#30 | nit / craft | The interior minimap still shows the surface. | FX19 | must | D58 |
| G7#1 | blocker / craft | Every vehicle still collides as one circle as wide as it is long (L01 not really fixed) | FX04 | must | D36 |
| G7#2 | blocker / craft | The drive camera ignores vehicle size: the Combine and Boot Float hide the road | FX04 | must | — |
| G7#3 | blocker / craft | Pay 'n' Glaze sells parts to vehicles that cannot show them, and forgets them on reload | FX17 | must | — |
| G7#4 | polish / craft | The oldest, most-driven vehicles lose no parts (L53 only reached the new ones) | FX17 | should | — |
| G7#5 | polish / craft | Police chases still drive the old arcade model (L93 half done) | FX17 | should | — |
| G7#6 | polish / craft | Simcade takes three times as long to get going, and keyboard full lock spins the bikes … | FX04 | should | — |
| G7#7 | polish / spirit | Two-wheelers and soft cars never lean, so their profile notes do not show | FX04 | should | D31 |
| G7#8 | polish / craft | Cone Van, golf cart and Taxi have no handling profile | FX04 | should | — |
| G7#9 | polish / spirit | The Cone Van has a chime speaker and no chime; three E31 rides use the default horn | FX17 | should | D32 |
| G7#10 | polish / craft | The E31 rides are not for sale; dealer list out of order and without stats | FX17 | should | — |
| G7#11 | polish / spirit | The Petit Pois's driver pokes through the roof | FX17 | must | D33 |
| G7#12 | polish / craft | Closed cabs have no steering wheel; the Petit Pois was meant to have one | FX17 | should | — |
| G7#13 | polish / craft | Quick Respray undercuts the new Repair tab | FX17 | should | — |
| G7#14 | nit / craft | Arcade and sim airtime use different gravity | FX04 | could | — |
| G7#15 | polish / craft | Bump damage and vehicle-vehicle contact also use the length circle | FX04 | must | D36 |
| G7#16 | nit / spirit | Lock-Up holds five ground vehicles, the Forecourt sells 23 | FX17 | could | D34 |
| G7#17 | nit / spirit | Pot Rod: "hot engine", 13 m/s, 1,800 Acorns | FX17 | could | D35 |
| G7#18 | nit / craft | Only the Zero-Turn can earn Skipping Stone | FX17 | could | — |
| G7#19 | nit / craft | Stale comments: "Garage (no UI yet)" | FX04 | could | — |
| G7#20 | polish / craft | Two whole-world vehicle tests time out under the full suite | FX04 | should | — |
| G7#21 | nit / craft | Two Repair-ish tabs with the same icon | FX17 | could | — |
| G7#22 | nit / craft | The vehicle name pill sits on top of small vehicles | FX19 | could | — |
| G7#23 | nit / craft | "NEAR MISS!" collides with the top button row on a phone | FX19 | could | — |
| G7#24 | nit / craft | Roundabout tarmac is a faceted polygon with no kerb | FX17 | could | — |
| G7#25 | nit / craft | Lock-Up map label is the odd one out | FX19 | could | — |
| G7#26 | nit / spirit | Region traffic mixes: the Pardonlin feel is good; the coast could carry it further | FX17 | could | D32 |
| G8#1 | blocker / craft | On a phone, activity buttons sit on top of the game's own touch cluster | FX03 | must | — |
| G8#2 | blocker / craft | The gnome holds the pistol through golf and stand-up, and golf has no club or swing | FX03 | must | D30 |
| G8#3 | blocker / craft | The bin and fire shift panel covers the toasts, the region banner and (on a phone) the … | FX03 | must | — |
| G8#4 | polish / craft | Sage never speaks where the player can see it | FX18 | should | — |
| G8#5 | polish / spirit | The kitchen, the packing station and the bin lift are 2D forms that hide the 3D place | FX18 | should | D27 |
| G8#6 | polish / craft | The comedy camera shows the stage and an empty floor, not the crowd | FX18 | should | — |
| G8#7 | polish / craft | The new jobs pay about half of the old ones, and nothing pins it | FX18 | should | — |
| G8#8 | polish / craft | A street-race wager pays far more than any job | FX18 | should | — |
| G8#9 | polish / craft | The first chef shift can be a 12-ticket rush | FX18 | should | — |
| G8#10 | polish / craft | Buying a replacement Dewdrop is pointless | FX18 | should | — |
| G8#11 | polish / craft | The Pumper is handed over inside the station, with the camera in the walls | FX03 | must | D58 |
| G8#12 | polish / craft | The lorry's arm and the bin do not line up in 3D | FX18 | should | — |
| G8#13 | polish / craft | Time trials show "POS 1/1" and no target | FX18 | should | — |
| G8#14 | polish / craft | The skateboard HUD is keyboard-first and collides with the top HUD | FX03 | should | — |
| G8#15 | polish / craft | Golf's buttons crowd each other and the corner buttons | FX03 | should | — |
| G8#16 | polish / craft | The hose has no keyboard hints on desktop | FX03 | should | — |
| G8#17 | polish / craft | Gnomazon's shelf icons are tiny and the emoji fallbacks are wrong | FX18 | should | — |
| G8#18 | nit / craft | The shift card's copy does not match what happened | FX18 | could | — |
| G8#19 | nit / craft | Achievement toasts cover the workplace panels' buttons | FX03 | could | — |
| G8#20 | nit / craft | The comedy level curve runs four times faster than the mechanic's | FX18 | could | — |
| G8#21 | nit / craft | Dev hooks for golf, the court, skate lines and comedy do nothing on their own | FX18 | could | — |
| G8#22 | polish / spirit | Ski and sled runs are 15-20 seconds | FX12 | should | D26 |
| G8#23 | polish / craft | The mechanic's client vanishes | FX18 | should | — |
| G8#24 | polish / spirit | None of the new activities can be shared online | FX18 | must (documentation only) | D28 |
| G8#25 | nit / craft | The bin round starts in "Mossy Wood" | FX08 | could | — |
| G8#26 | polish / craft | Sled and ski riders are vehicles with Fire, Reload, Boost and Horn | FX03 | should | — |
| G8#27 | nit / spirit | The bin lift's diagram duplicates the 3D arm on desktop | FX18 | could | D27 |
| G8#28 | polish / spirit | The chef rail and pass have no sense of a diner | FX18 | could | D27 |
| G8#29 | nit / spirit | Gnomazon's shift has no conveyor, no clock pressure in the room | FX18 | could | D27 |
| G8#30 | nit / spirit | Comedy pays per set but the set length grows with level | FX18 | could | D29 |
| G8#31 | nit / craft | Party slices: three activities are natural fits and none is in the backlog | FX18 | could | — |
| G8#32 | polish / craft | Old and new jobs end differently | FX18 | should | — |
| G8#33 | polish / craft | The court's phone scoreboard and controls also hide the play | FX03 | should | — |
| G8#34 | nit / craft | Some activity HUD text reads as debug | FX03 | could | — |
| G9#1 | blocker / craft | Landscape phone: the 🔭 binoculars button covers the Drive / Steal button | FX19 | must | — |
| G9#2 | blocker / craft | Big map: landmark names skip the label layout and print on top of each other | FX19 | must | — |
| G9#3 | blocker / craft | Portrait phone: the objective text runs under the pinned shortcut buttons | FX19 | must | — |
| G9#4 | blocker / craft | Kerbside Exchange: the contract rows squash and their text overlaps | FX20 | must | — |
| G9#5 | blocker / spirit | The Gnomlet is mostly a launcher: 15 of 24 apps close it and open an older panel in … | FX20 | must | D37 |
| G9#6 | polish / craft | Apps inside the tablet share no visual kit; four use bare browser buttons | FX20 | must | D37 |
| G9#7 | polish / craft | Empty states are bare | FX20 | should | — |
| G9#8 | polish / craft | Options names the wrong key for first person | FX20 | should | — |
| G9#9 | nit / craft | Journal empty state points at a tab that does not exist | FX20 | could | — |
| G9#10 | polish / craft | Ledger: "buy it in the Ledger app" is a dead end, and owned/for-sale state is unclear | FX20 | should | — |
| G9#11 | polish / craft | The birding pill ("0/36 · Blustery") draws over the big map and over every panel | FX19 | should | D39 |
| G9#12 | polish / craft | There is no z-order scale, so layers fight | FX19 | should | — |
| G9#13 | polish / craft | On phones the big map uses a third of the screen | FX19 | should | — |
| G9#14 | polish / craft | Desktop legend: one long column that clips and runs off the screen | FX19 | should | — |
| G9#15 | polish / craft | The minimap is a wall of icons downtown | FX19 | should | — |
| G9#16 | polish / craft | Heat and health meters look like buttons, and the heat level is unreadable | FX19 | should | — |
| G9#17 | polish / spirit | The top-left stats card is always on and growing | FX19 | should | D38 |
| G9#18 | polish / craft | Phone HUD overlaps around the gun block | FX19 | should | — |
| G9#19 | polish / craft | The portrait comms card covers the ammo and the objective | FX19 | should | — |
| G9#20 | polish / craft | Acorn amounts are written four different ways | FX20 | should | — |
| G9#21 | nit / craft | Option labels and section styling are inconsistent | FX20 | could | — |
| G9#22 | polish / craft | No music or radio volume | FX20 | should | — |
| G9#23 | polish / craft | The radio is not ducked under mission calls | FX20 | should | — |
| G9#24 | polish / craft | Footsteps ignore what you are standing on | FX20 | should | — |
| G9#25 | polish / spirit | The UI makes no sound at all | FX20 | should | D40 |
| G9#26 | polish / craft | Rain falls from a blue sky | FX01 | should | — |
| G9#27 | nit / craft | The Gnomlet clock shows real time | FX20 | could | — |
| G9#28 | polish / spirit | The Gnomlet's groups and names don't hang together | FX20 | should | D37 |
| G9#29 | polish / spirit | Options shows the profiler to players, and "Cheats" holds the default handling | FX20 | should | D41 |
| G9#30 | polish / spirit | The loading screen stops at the old world | FX20 | should | D42 |
| G9#31 | nit / craft | The arrival title card is spent behind the loading fade | FX19 | could | — |
| G9#32 | nit / craft | The Field journal's "?" badge looks like a help button | FX20 | could | — |
| G9#33 | nit / spirit | Kerbside Exchange lists every locked contract and the mission that unlocks it | FX20 | should | D43 |
| G9#34 | nit / craft | Small text inconsistencies across the apps | FX20 | could | — |
| G10#1 | blocker / craft | #15 Founder's Boot is told in the wrong order | FX22 | must | D59 |
| G10#2 | blocker / craft | Founders' Green is on the map, in hints and bulletins before #15 creates it | FX07 | must | D1 |
| G10#3 | blocker / craft | #14's sincere beat is hidden behind the player's hat, in near darkness | FX05 | must | D49 |
| G10#4 | blocker / craft | #35 spends the betrayal twice and contradicts #33 about the code | FX22 | must | D59 |
| G10#5 | polish / craft | Vesper "does not negotiate twice", then invites the player to a viewing the next quest | FX22 | should | — |
| G10#6 | polish / spirit | "Penthouse Viewing" never shows a penthouse, and the key choice promises a prop that does … | FX05 (split: part in FX08) | must (key), should (set) | D5 |
| G10#7 | polish / craft | "Okay, hear me out" is used seven times in acts I–II | FX22 | should | D57 |
| G10#8 | polish / craft | "Previously:" is spoken aloud, the journal has none, and two recaps point at scenes the … | FX22 (split: part in FX21) | must | D45 |
| G10#9 | polish / spirit | Every briefing ends with its fee, including the sad ones | FX22 (split: part in FX21) | must | D46 |
| G10#10 | polish / craft | Pip's radio jammer is never paid off | FX22 | should | — |
| G10#11 | polish / craft | Cam wears the HOA's colours from the prologue | FX22 | should | — |
| G10#12 | polish / craft | Nobody remarks that Cam works for the HOA after #21 | FX22 | should | — |
| G10#13 | polish / craft | #12 contradicts #6, and the photograph contradicts itself | FX22 | should | — |
| G10#14 | polish / craft | #28's "Eleven permits, ten signatures" does not match #7, and the missing signature goes … | FX22 | should | — |
| G10#15 | polish / craft | Granny's secret silo is a silo the player has already towed | FX22 | should | — |
| G10#16 | polish / craft | #34's party is for something that happened 19 quests ago | FX22 | should | — |
| G10#17 | polish / spirit | Act II turns into a taxi service | FX22 | should | D50 |
| G10#18 | polish / spirit | The Buck-Iron combine is every job's vehicle | FX22 | should | D51 |
| G10#19 | polish / spirit | After the Grand Combine reveal, six quests pass without anyone mentioning it | FX22 | should | D52 |
| G10#20 | polish / craft | #5: why can't Cam deliver the part himself? | FX22 | should | — |
| G10#21 | polish / craft | #30's relay: who loses? | FX22 | should | — |
| G10#22 | polish / craft | #4: three bikes in the scene, two in the quest | FX22 | should | — |
| G10#23 | polish / craft | Chapter cards do not match the acts | FX22 | should | — |
| G10#24 | polish / craft | Side quests unlock before their giver is met, or after the line that promises them | FX22 | should | — |
| G10#25 | polish / spirit | The act I "last bright image" is four gnomes in the rain | FX05 | must | D49 |
| G10#26 | polish / craft | Pip never says "Fescue" on the bench | FX22 | should | — |
| G10#27 | nit / craft | Generic names clash with the cast | FX22 | could | — |
| G10#28 | nit / craft | Units and scale | FX22 | could | — |
| G10#29 | nit / craft | Small context slips | FX22 | could | — |
| G10#30 | nit / craft | Formatting of banter and money | FX22 | could | — |
| G10#31 | nit / craft | "Tuesday" as a throwaway joke dilutes the betrayal's code word | FX22 | should | D25 |
| G11#1 | blocker / spirit | The crew vanishes for twelve quests; "we split the four parts" is never paid off | FX23 | must | D47, D57 |
| G11#2 | polish / craft | "Vesper sees the player's face for the first time" contradicts acts I-II | FX23 | should | — |
| G11#3 | polish / craft | Nubbin's history does not fit together (#24 vs #48/#49) | FX23 | should | — |
| G11#4 | nit / craft | The mole family is moved to Thrift's shed in #48, then evacuated from the ninth green in … | FX23 | could | — |
| G11#5 | polish / craft | The four-parts logic has holes at the turn | FX23 | should | — |
| G11#6 | polish / craft | Four disguises in one act, and none of them is worn in play | FX23 | should | — |
| G11#7 | polish / craft | Text promises things the game does not do | FX23 | should | — |
| G11#8 | polish / spirit | Characters say the word "Previously:" out loud | FX23 (split: part in FX21) | must | D45 |
| G11#9 | polish / spirit | Every briefing ends on a price, in the speaker's voice | FX23 (split: part in FX21) | must | D46 |
| G11#10 | polish / craft | Everyone speaks in one register; Pip has drifted off his bible | FX23 | should | — |
| G11#11 | polish / craft | Bible sample lines reused word for word, until they become catchphrases | FX23 | should | D25 |
| G11#12 | nit / craft | "Eleven" everywhere | FX23 | should | D25 |
| G11#13 | polish / craft | Betony is both barred from Rootwell and its faculty | FX23 | should | — |
| G11#14 | polish / spirit | #46, the act's extended set piece, ends on foot | FX23 | should | D53 |
| G11#15 | polish / spirit | The #50 heist has no stakes | FX23 | should | D54 |
| G11#16 | blocker / craft | Night scenes are too dark to read, including #50's key frame | FX05 | must | D49 |
| G11#17 | blocker / craft | The Test Cut's turn plays over empty frames, and the deck has no scale | FX05 | must | — |
| G11#18 | polish / craft | Key close-ups show the back of the speaker's head | FX05 | must | D49 |
| G11#19 | polish / spirit | Objective variety thins out in the ally run | FX23 | should | D50 |
| G11#20 | polish / craft | #53, the act's closer, is thin | FX23 | should | — |
| G11#21 | polish / craft | Side quests contradict where people are, and two outline unlocks are missing | FX23 | should | — |
| G11#22 | polish / craft | World changes are one beat late or missing their half | FX23 | should | — |
| G11#23 | nit / craft | Gentian speaks on comms before she is introduced | FX23 | could | — |
| G11#24 | nit / craft | Lines that assume context the player doesn't have | FX23 | could | — |
| G11#25 | nit / craft | Driftwood contradicts himself between briefing and scene | FX23 | could | — |
| G11#26 | nit / craft | Pinwheel Ridge numbering and counts disagree | FX23 | could | — |
| G11#27 | nit / craft | Juniper's call: who called whom? | FX23 | could | — |
| G11#28 | nit / craft | Time-of-day continuity in #37-#38 | FX23 | could | — |
| G11#29 | nit / craft | The player's lines break the "straight man" rule in sincere beats | FX23 | could | — |
| G11#30 | nit / craft | The Flock's "so it is stood" swamps Saxifrage | FX23 | should | D25 |
| G11#31 | nit / craft | Pip's whereabouts between #39 and #53 are never explained | FX23 | could | — |
| G11#32 | polish / spirit | Act III has no on-screen reckoning with the Salvage Raid losses | FX23 | should | D47 |
| G12#1 | blocker / craft | The finale's parts each start at the overlook: the player has to drive away from the … | FX24 | must | — |
| G12#2 | blocker / craft | Cam's PA code, the whole point of #62, is never used | FX24 | must | — |
| G12#3 | polish / craft | Choice B (leave Cam) is contradicted, and Juniper's "I will notice" never comes | FX24 | must | D45, D48 |
| G12#4 | polish / spirit | Veteran saves play act IV after the finale, with nothing saying so | FX21 | should | D7 |
| G12#5 | polish / spirit | Both endings get the same epilogue | FX24 | must | D48 |
| G12#6 | polish / craft | The Combine turns north at the crossing in #69, then comes south back to it in the finale | FX24 | should | — |
| G12#7 | polish / craft | "Across the deck" is played on the road | FX24 | should | — |
| G12#8 | polish / craft | Row 59's kept outro gathers the coalition and spends the pie line before All Hats | FX24 | should | — |
| G12#9 | polish / spirit | "All hats" leaves out the Don, Samphire, Brenda and Wally | FX24 | should | D55 |
| G12#10 | polish / craft | The All Hats count is played in the dark, sometimes in the rain | FX05 | must | D49 |
| G12#11 | polish / craft | Downtown carries on as normal around the jammed god-machine | FX24 | should | — |
| G12#12 | polish / craft | Chicory rides in the barrow buggy and also walked | FX24 | should | — |
| G12#13 | polish / craft | "By Road" has no convoy | FX24 | should | — |
| G12#14 | polish / spirit | Four passenger runs back to back | FX24 | should | D50 |
| G12#15 | polish / craft | The lore still sinks the Combine in a canal | FX24 | should | — |
| G12#16 | polish / craft | Lore status markers are stale | FX24 | should | — |
| G12#17 | polish / craft | Older lore voices still contradict the act IV bible | FX24 | should | — |
| G12#18 | polish / craft | Fort Sandpit's gate is in the north wall in the lore and in the south wall in the game | FX24 | should | — |
| G12#19 | nit / craft | R-235 puts Yarrow's barn in the south of Pebblewick | FX24 | could | — |
| G12#20 | nit / craft | Coordinates and map talk inside "What gnomes say" | FX24 | could | — |
| G12#21 | nit / craft | The finale's doneText and ending lines are in the old style | FX24 | could | — |
| G12#22 | nit / craft | Hogweed "now sells" parachute parts that no shop sells | FX24 | could | — |
| G12#23 | nit / craft | The design docs still describe the pre-R-234 rows | FX24 | could | — |
| G12#24 | nit / craft | "Tonight, it cracks" at noon | FX24 | could | — |
| G12#25 | nit / craft | The Countess's "Previously" puts her at the overlook | FX24 (split: part in FX21) | must | D45 |
| G12#26 | nit / spirit | Tansy's "Go." is undone two quests later | FX24 | could | D56 |
| G12#27 | nit / craft | Small line and name nits | FX24 | could | — |
| G12#28 | nit / craft | The two "the war arrives" intros are the act's shortest | FX24 | could | — |

## Counts

| Epic | Findings |
|---|---|
| FX01 | 14 |
| FX02 | 7 |
| FX03 | 14 |
| FX04 | 11 |
| FX05 | 9 |
| FX06 | 10 |
| FX07 | 10 |
| FX08 | 10 |
| FX09 | 11 |
| FX10 | 14 |
| FX11 | 24 |
| FX12 | 14 |
| FX13 | 15 |
| FX14 | 31 |
| FX15 | 10 |
| FX16 | 10 |
| FX17 | 14 |
| FX18 | 23 |
| FX19 | 20 |
| FX20 | 20 |
| FX21 | 1 |
| FX22 | 27 |
| FX23 | 29 |
| FX24 | 26 |
| won't fix | 1 |
| **total** | **375** |

Assigned by severity: 38 blockers, 238 polish, 98 nits. Spirit findings are all covered by a decision (decisions.md, "Count").
