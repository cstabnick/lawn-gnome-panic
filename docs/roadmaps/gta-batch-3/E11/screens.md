# E11 screenshot pass (environmental storytelling AC (e))

Headless Edge (SwiftShader), 960 x 600, `node tools/gta-shots.mjs http://localhost:5311/ <dir> name=x,z,yaw`
(`?offline&no-intro&at=x,z,yaw`, on foot; `at` always stands the gnome on the ground or sea bed, so deck-level shots
were taken from the shore instead).

| shot | where | what it shows |
|---|---|---|
| [bw-1-entrance.png](screens/bw-1-entrance.png) | (0, 1072) facing south | the coast spur arriving at the boardwalk entrance sign |
| [bw-2-stalls.png](screens/bw-2-stalls.png) | (-60, 1122) facing north | the plank deck, lamps and the Tin Shy stall with its painted name |
| [bw-3-wheel.png](screens/bw-3-wheel.png) | (-215, 1118) | the Spokewheel turning, teacup gondolas, stand and its signs |
| [pier-1-spur.png](screens/pier-1-spur.png) | (225, 1125) facing east | the spur up onto Long Spoon Pier |
| [pier-2-bowl.png](screens/pier-2-bowl.png) | (300, 1215) under the handle | pier posts, the bowl with Marram's hut, the Bathtub Queen moored beyond |
| [ship-1-from-beach.png](screens/ship-1-from-beach.png) | (345, 1182) | the Bathtub Queen alongside the pier: masts, sails, duck figurehead, stern cabin |
| [beach-1-huts.png](screens/beach-1-huts.png) | (-150, 1150) facing west | beach huts, umbrellas, deck chairs |
| [beach-2-lastTube.png](screens/beach-2-lastTube.png) | (150, 1140) facing south | the Last Tube hut and sign, Driftwood beside it, the Saltwater |
| [beach-3-lifeguard.png](screens/beach-3-lifeguard.png) | (40, 1160) | the lifeguard chair, sandcastles, the sea |

Storytelling per district (AC a-d): vignettes (`src/coast/life.ts` `COAST_VIGNETTES`, 3 per district: boardwalk,
pier, beach, ship), joke signs (`boardwalk.ts`, `pirateShip.ts`, `spokewheel.ts`, the Last Tube sign), residents
(`COAST_RESIDENTS`: Marram, Driftwood, the lifeguard, Sal, sunbathers, an angler, Captain Bilge), ambient surf, buoy bell
and gulls near the player, and the existing `coast` region ambience bed.
