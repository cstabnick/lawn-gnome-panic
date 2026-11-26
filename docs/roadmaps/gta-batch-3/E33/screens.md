# E33 screenshot pass (AC (e))

`node tools/gta-shots.mjs http://localhost:5333/ docs/roadmaps/gta-batch-3/E33/screens <name>:<x>,<z>,<yaw> ... --size 800x500 --wait 25`
(the first load after the dev server starts can sit on the loading screen; use `--wait 25` or more).

| Route | Shots |
|---|---|
| The Brim Gap Road | `pass-1-hairpins` (the climb and Old Pate from the band road), `pass-2-tophat` (the Top Hat café, terrace and the Bobble), `pass-3-tarn` (the tarn lay-by) |
| The Hatband | `hatband-1-gate`, `hatband-2-worldsedge` (the shelf by the north fence), `hatband-3-shelf` |
| The Brim Walk | `walk-1-stile`, `walk-2-summit`, `walk-3-ridge` |
| The Spine Cut | `spine-1-keyhole` (the gorge and the arch, traffic driving it), `spine-2-pullin`, `spine-3-moor` |

Smoke (`bash tools/smoke.sh "<url>?offline&no-intro&at=700,-1560,3.1" gta-gnomlet`): OK. Z-fight scans at Brim Gap,
the Keyhole and the Hatband gate: no flickering E33 pair after moving the verges under the road and cutting the path
and shelf where they cross a road (the verge is buried under the band roads and the tarn lay-by pad, which is intended).
