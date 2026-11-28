# E30 screenshot pass and storytelling AC (Pardonlin)

Headless Edge (SwiftShader-free GPU path), 960 x 600, `node tools/gta-shots.mjs <url> <dir> name:x,z,yaw`
(`?offline&no-intro&debug&at=x,z,yaw`, on foot). Spots are `DISTRICTS[].shots` in
`games/gnome-theft-auto/src/pardonlin/layout.ts`. `layout.test.ts` enforces the counts per district (≥3 vignettes with
≥3 props each, ≥6 signs, ≥3 residents) and the clearances.

| district | buildings | props (tiles) | signs | vignettes | residents |
|---|---|---|---|---|---|
| the Old Town | 435 | 1925 (1230) | 83 | 9 | 5 |
| Teacup Row and the Quays | 424 | 1985 (738) | 161 | 8 | 6 |
| the Left Bank | 848 | 1768 (876) | 112 | 7 | 5 |
| the Jardin and the Basin | 2 | 1828 (346) | 47 | 9 | 6 |

## The Old Town

| shot | where | what it shows |
|---|---|---|
| [ot-1-bean-tower.png](screens/ot-1-bean-tower.png) | (-1520,-318) facing north | the Bean Tower (canes, runner beans, platform) over its garden and the switchback queue |
| [ot-2-grand-platz.png](screens/ot-2-grand-platz.png) | (-1500,-200) facing north | the Grand Platz: plane avenues, lamps, café terraces, the bandstand, the tower beyond |
| [ot-3-rue-haute.png](screens/ot-3-rue-haute.png) | (-1462,-200) facing north | the Rue Haute: packed uneven terraces, bistros spilling out, awnings, shop banners |

Vignettes: the queue for the queue (-1496,-191); Odile's rejected croissants (-1544,-261); the boules measurement
dispute (-1553,-222); Marcel's invisible box (-1523,-228); the strike about the strike (-1482,-260); the pigeons'
committee on the Unknown Pigeon (-1515,-207); the head of the Bean Tower queue (-1514,-345); the Tuesday crossword
quarrel (-1546,-282); the shared washing line (-1484,-115).
Signs (a few): "Bean Tower - Admission: one acorn. Exit: two acorns."; "CLOSED FOR LUNCH. Open after lunch. Lunch ends
when the tower says."; "QUEUE HERE. For what: see the front of the queue."; "DO NOT FEED THE STATUE".
Residents: Marcel Muet the mime, Odile Easelby at her easel, Gaston Plonque and the other Gaston at boules, Fifi
Haricot at the tower. Life and sound: pigeon flocks on the Platz and the tower garden that flush and circle; the
steeple bell, café clinks and murmur, coos, boules clacks; Radio Adagio from the bandstand gramophone.

## Teacup Row and the Quays

| shot | where | what it shows |
|---|---|---|
| [tq-1-teacup-row.png](screens/tq-1-teacup-row.png) | (-1522,116) facing south | the café lane: paving, rose arch, café terraces and parasols, bike rack, poster boards |
| [tq-2-quay.png](screens/tq-2-quay.png) | (-1584,200) facing north | the east quay: railings, the Thymes Walk, Anatole Bellows at his accordion, river-front terraces |
| [tq-3-place-du-pot.png](screens/tq-3-place-du-pot.png) | (-1500,420) facing north | Place du Pot's square, the Church of the Second Helping, the market fountain, plane trees |

Vignettes: the espresso since Tuesday (-1524,152); the bakery queue at dawn (-1521,137); the waiter's revenge
(-1526,169); the bicycle that is a planter (-1526,251); the book that fell in (-1588,87); the accordionist's empty
pitch (-1594,332); the audience of chairs (-1525,289); the post booth that is at lunch (-1521,402).
Signs: "Café Pardon: you may admire the menu. You may not order from it."; "NOW SERVING NO. 4 / TICKETS ISSUED:
4,311"; "THE BAKERY QUEUE FORMS HERE".
Residents: Brigitte Levain (the Baguette Round), Jean-Pot and Sabine Sip, Hector Disdain, Anatole Bellows, Prudence
Spine. Life and sound: Teacup Row pigeons, strollers and cyclists on the Thymes Walk, swans on the river; café
murmur, the bakery door bell, the accordion; Radio Adagio from Café Pardon's terrace gramophone. Interior: Café Pardon.

## The Left Bank

| shot | where | what it shows |
|---|---|---|
| [lb-1-radio-adagio.png](screens/lb-1-radio-adagio.png) | (-1712,-100) facing east | the Opera Hall (Radio Adagio) with its banner, forecourt and horn speaker across the Boulevard |
| [lb-2-beetle-market.png](screens/lb-2-beetle-market.png) | (-1733,124) facing south | the Beetle Market's stall rows and aisles toward the market hall |
| [lb-3-backyards.png](screens/lb-3-backyards.png) | (-1740,600) facing north | the backyards lane: walled gardens, ivy walls, plane orchards, notices |

Vignettes: the composer's crisis (-1709,-249); the queue for nothing at the post booth (-1735,-222); the existential
picnic (-1735,-119); the Opera stage door (-1667,-112); the abandoned easel (-1641,-92); the cheese standoff
(-1747,101); the laundry dispute (-1722,680).
Signs: "RADIO ADAGIO 96.1 — Now broadcasting: silence (scheduled)"; "Garden closed for lunch (since March)"; "Beware of
the boules. The boules are fine. Beware of the owner."
Residents: Maestro Ottavio Lento, Roquette Fromage, Sartorius Gloom, Greta Clothespeg, Pascal Waite. Life and sound:
market pigeons, river walkers and cyclists on the Rive Gauche; Radio Adagio from the horn speaker and the market's
stall radio. Interior: the Radio Adagio foyer and studio.

## The Jardin and the Basin

| shot | where | what it shows |
|---|---|---|
| [gd-1-jardin.png](screens/gd-1-jardin.png) | (-1510,-684) facing north | the parterre: box-hedge squares and diagonals, topiary, the fountain |
| [gd-2-little-gardens.png](screens/gd-2-little-gardens.png) | (-1451,640) facing north | the Little Gardens: the central path, plots, bean frames, the passive-aggressive noticeboard |
| [gd-3-basin-quay.png](screens/gd-3-basin-quay.png) | (-1495,1045) facing west | Basin Quay: promenade, railings, the boathouse and the Basin |

Vignettes: the topiary that went wrong (-1566,-688); the escaped boule (-1499,-718); the reserved bench (-1592,-644);
the picnic with standing (-1676,-668); the folly (-1718,-698); the marrow war (-1470,680); the compost summit
(-1442,868); the swan pedalo's retirement (-1511,1054); the angler who never catches (-1545,1076).
Signs: "JARDIN RULES Keep off the grass. Keep off the gravel. Keep calm."; "Please do not feed the topiary. It has
opinions."; "Fish: 0. Patience: 12."
Residents: Aurèle Clippe, Sylvain Rimeless, Wilhelmina Marrow, Gaspard Rosette, Fulbert Nibble, Captain Anchois.
Life and sound: Basin Quay pigeons, swans; the `continental` ambience bed (town hum, water, leaves) everywhere in town.

## Checks recorded

- Frame time (`?perf`, desktop GPU, quality high): Grand Platz 7.4 ms (p95 8.0), 884 draws, 1.99 M tris; downtown
  Turfton (0,40) for comparison 7.5 ms (p95 8.1), 987 draws, 1.18 M tris.
- `npm run zfight` at the Platz, Teacup Row, Radio Adagio and the Jardin: no Pardonlin pairs (sign text planes were
  pushed 0.06-0.07 m proud of their faces after the first run flagged them).

Extra: [int-cafe-pardon.png](screens/int-cafe-pardon.png) (inside Café Pardon: the umbrella barrels, the habit queue, Hector) and
[perf-grand-platz.png](screens/perf-grand-platz.png) (the `?perf` overlay at the Platz).
