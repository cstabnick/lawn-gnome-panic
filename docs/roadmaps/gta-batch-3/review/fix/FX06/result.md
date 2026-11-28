# FX06 result (R1 fix round)

Branch `fix/FX06`. The plan is in `roadmap.md` and the issues are in `issues/`. The lead wrote a foundation (the ambient
`y`/`surface` field and route clearance), then five Sonnet issues ran in parallel. Shots were re-taken on port 5506
and saved under `review/shots/FX06/` (git-ignored).

| Finding | Status | What changed | Evidence |
|---|---|---|---|
| G2#20 bubbles off screen | fixed | `bubbleClamp.ts` (pure) caps a bubble at 340 px wide (0.6 of the view on a phone) and clamps it inside the safe area, below the HUD corners. `makeBubbleSprite` applies this in `onBeforeRender`, so the camps and the Trellis bubbles get it too. | `bubbleClamp.test.ts`; worker shots `fx06-A/d/res.png`, `p/coast.png` |
| G6#3 bubbles fill the screen in the Flock ring | fixed | A bubble hides when the camera is within 3 m. At most the two nearest show, and an overlapping second bubble is dropped. | `shots/FX06/waders-circle.png`, worker `fx06-A/p3/ring.png` (390x844) |
| G3#1 boots inside the boardwalk planks | fixed | The promenade is registered as the walkable rooftop `saltbucket-boardwalk` at the deck top. Sal has `surface: 'rooftop'`. | `shots/FX06/b09-sal.png`, `a02-bwmid.png`, `p01-phone-bw.png`; `boardwalk.test.ts` (groundAt = deck top) |
| G3#2 Ruth buried under the spur | fixed | Ruth fishes from the pier handle's west rail at (297.4, 1176). The Queen's deck has two new crew, Mopsy Brine (mop) and Pennant Pru (lookout). All three use `surface: 'rooftop'`. | `life.test.ts` (feet at the deck y); worker `fx06-E/ruth3.png`, `queen3.png` |
| G3#3 one look per character | fixed | Quest lines, residents and the cabin NPC read `CAST.driftwood`, `CAST.marram` and `CAST.samphire`. Ruth was recoloured to a mustard sou'wester and navy jumper. | `coast/castLooks.test.ts` (the cabin NPC builds lazily, so it is checked by code, not by test); ruling R-239 |
| G4#16 pines on the Capwood Run | fixed | `placeSolid` skips anything within 2 m of any `GROUND_TRACKS` barrier (`nearTrack`). The golden was regenerated. | `scenery.test.ts` "stands no tree ... on a race road"; `shots/FX06/summit.png` |
| G5#1 Anthill grey cliff crown | partly | The grey rock is gone (rock rule): the crown is now earth. The shape is unchanged. Widening the flatten blend (outer 42 to 46-58) broke the Anthill road grade tests (16 deg and 0.3) and hid the m46 outro's shot target, so I reverted it. The stepped tier is carried over to FX14, which owns the road and the scene. | `terrainPaint.test.ts` (no rock on the ring or flank); `shots/FX06/x-mound-n.png` |
| G5#2 Rutbottom rock walls | fixed | No rock paint at `dirt-track`. `fade` went from 8 to 10, giving banks of about 0.55 rise/run. A fade of 12 or more strands the lowrider bot at Gravel Hat in `sq-rutbottom-heats`; 10 passes. The hay-bale battlements belong to FX18 (trackDressing), not here. | `rutbottom.test.ts` (bank < 0.55); `shots/FX06/b-stands.png` |
| G5#3 blocky dirt and gravel edges | fixed (should) | A feather pass in `terrainPaint.finishPaint` wobbles every paint border by up to one cell using smooth noise and jitter. Trail cells are never shrunk. | `terrainPaint.test.ts` (deterministic, interior untouched); `shots/FX06/b-gate.png` |
| G6#11 stair-stepped Unmown trails | fixed | Soft-edged dirt ribbons (`unmown-trail-ribbon`, `LAYER.road`, per-vertex alpha, wobbling edge) run over `trail/unmown-loop` and `trail/reedmere-boardwalk`. | `unmown/trails.test.ts`; worker `fx06-D/reedmere.png` |
| D58 rock rule (G4#27/28/17 part) | done | `ROCK_SITES` and `inRockSite` (Hatbrim ridge r+15, Highland Spine r+10, from `LANDSCAPE`). Rock cells outside them are re-painted by the region rule. The Wasm kernel is unchanged: the parity test compares `paintRawBytes()`. FX13 can read `inRockSite`. | `terrainPaint.test.ts`, `wasm/gtaWasm.test.ts` |

## Contracts provided
- `AmbientGnomeDef.y?: number`, `surface?: 'rooftop'` and `ambientFeetY(def)` (in `ambientGnomes.ts`).
- Bubble rules in `bubbleClamp.ts` (`BUBBLE`, `clampBubble`, `hudCorners`, `pickShown`).
- `terrainPaint.ts`: `ROCK_SITES`, `inRockSite`, `paintRawBytes`.
- Scenery: no `planScenery` solid within any ground track's barriers (test).
- Cast presets (`CAST`) are the single source for the coast's three characters.

## Not done or carried over
- G5#1 shape (the Anthill's stepped summit tier): goes to FX14. It needs the Anthill road and the m46 outro camera to move along with a wider blend.
- G6#3 "move Spoonbill off the south entry line": `societies/flock/life.ts` is not FX06's file, so this goes to FX15. The bubble rules already keep the ring readable.
- Boardwalk west end (x -210 to -200): the ground there rises above the deck top, so the planks sink. This predates FX06 (site heights) and goes to FX11.
- Parked or spawned cars on the boardwalk were not checked by eye. They use `groundAt`, so they should stand on the rooftop.
- The `a06-spur` re-shot spawns the player at ground height under the spur deck. That is a quirk of the shot tool (it spawns at `heightAt`), not a game bug.

## Checks
- `npm run build -w games/gnome-theft-auto`: OK.
- `npm test -w games/gnome-theft-auto`: on the full run, after the mound revert, only three heavy tests timed out (`roads.test.ts` hook, `deck.test.ts`, `quests.test.ts` "trapped inside a building"). Re-run alone, all three pass (28/28). The questSim race suite passes with `fade: 10`.
- `npm run lore`: OK (run by worker E).
- `bash tools/smoke.sh http://localhost:5506/ gta-gnomlet` and `... "#ui" canvas`: SMOKE OK.
- `npm run zfight -- <url>?at=...` at the boardwalk, Sal, the Reedmere trail and the Rutbottom stands did not finish. Each run timed out inside the scan (puppeteer `Runtime.callFunctionOn timed out`, `protocolTimeout`) before reporting, so it is unchecked. The tool's scan of the whole world takes longer than the protocol timeout in headless Edge. The only new flat geometry is the trail ribbons on `LAYER.road` (polygon offset). The boardwalk planks are unchanged. Worker D's earlier zfight run printed no findings but may have been cut off.
- perf: not a density pass (two ribbon meshes, two residents), so it was not measured.
