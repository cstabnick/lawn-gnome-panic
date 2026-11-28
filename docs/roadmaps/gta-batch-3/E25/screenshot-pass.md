# E25 screenshot pass

Taken 2026-11-25 with headless Edge against the dev server (`tools/gta-shots.mjs`, `?offline&no-intro`, 960x600,
phone shots 390x844). Files in [screens/](screens/). `tools/smoke.sh ... gta-gnomlet` OK with `?binround`,
`?firecall`, `?gnomazonshift` and `?interior=gnomazon-floor`. `npm run zfight` at the three places: no pair involves
E25 objects (the pairs it lists are older fringe, street and boardwalk ones).

| Workplace | Spots (files) | What it shows | Storytelling (a vignettes / b signs / c residents / d ambience) |
|---|---|---|---|
| Turfton Bin Depot (bin crew) | `depot-gate` (-205, -89), `depot-yard` (-232, -97), `depot-heap` (-250, -72), `bin-lift` (the lift minigame at the first bin, `?binround=lift`) | the yard by the steaming Compost Heap, the green depot shed, office cabin, bin rows; the Bin Lorry at a kerb with the lift gauge and Grab button | (a) the overflowing bin with its lid jammed and a broom abandoned mid-attempt, the lost-property bin with a trophy and "CLAIM BY FRIDAY", Mags' tea break (deckchair facing the heap, flask, mug, newspaper); (b) "TURFTON BIN DEPOT - WE TAKE IT AWAY", "BIN DAY IS EVERY DAY", "DAYS WITHOUT A SPILL: 0", "THE HEAP IS NOT A SLIDE", "LIDS DOWN, CHINS UP"; (c) Mags Wheelie at the office, a crew gnome hosing bins; (d) forest bed, hydraulic arm, clank, tip and spill sounds |
| Fire Station No. 1 (firefighter) | `station-apron` (-205, 135), `station-bell` (-235, 115), `station-yard` (-262, 152), `fire-hose` (390x844, `?firecall=hose`) | the red engine house with its bays open east onto the apron; the practice yard; the Pumper at a bin-and-planter fire with the stream, tank gauge, aim pad and Spray | (a) the scorched practice shed with a bucket chain and one bucket knocked over, the chili pot and a chair pulled out in a hurry, the cat's corner (saucer, blanket, "MISSING: ASPHALT (AGAIN)"); (b) "WET IS BEST", "DAYS SINCE LAST BARBECUE: 0", "KEEP CLEAR - ENGINE EXITS (SOMETIMES IN A HURRY)", "NO SMOKING. NOT EVEN A LITTLE."; (c) Chief Hydra Pumpwell by the bell, a firefighter on the boot-rack bench; callers on every call; (d) fire bell, crackle, hose, steam, siren loop |
| Gnomazon FC-1 (associate) | `fc-front` (300, 97), `fc-docks` (296, 70), `fc-pack` (390x844, the packing screen, `?gnomazonshift`) | the pale ribbed shed with its orange band and docks behind the beltway ramp; the docks corner; the packing station (order, shelf tiles, quota, Kippy) | (a) the delivery drone stuck in the hedge, the "BREAK AREA (PILOT)" bench with one cold cup, the returns pile with a hat on a cone; inside: the box-in-a-box tower, a birthday at station 4, the over-taped suggestion box; (b) "EVERYTHING, EVENTUALLY", "NOW HIRING (ALWAYS)", "SAFETY IS OUR #2 PRIORITY", "SMILE: YOU ARE ON KPI", "BREAK ROOM: COMING SOON"; (c) three associates at the stations, KPI-9 on the floor; (d) tape screech, scanner, Kippy chime, quota fanfare |

Not done: no real phone; no full round / call / shift played to the end by hand (each started by its dev hook; a bin
call was put out in a browser by the runtime worker; the pure parts are unit-tested). The interior floor was only
looked at from its doorway.
