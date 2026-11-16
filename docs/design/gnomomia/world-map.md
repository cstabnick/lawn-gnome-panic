# World map: Fescue

Fescue is the first world of Gnomomia: one walled lawn with the Fence around its edge. Seven zones, levels 1 to 30. The picture version is [fescue-map.svg](fescue-map.svg) (open it in a browser).

## Overview map

North is up. The Hose runs from the Spigot (north-west) down past the Keep to Thatchford and Mossbottom.

```
                                         N
 +=========================================================================+
 | |#|#|#|#|#|#|#|#|#|#|#|  T H E   F E N C E  |#|#|#|#|#| [ THE SHED ] |#|  |
 |                                                         Mower  L30     |
 |   THE SHORN  ' ' ' ' ' ' ' ' ' ' ' '  [The Level] (Even Cut fort)      |
 |  ...................  T H E   V E R G E   25-30  ...................... |
 |                          * Last Tuft (forward camp)                     |
 |  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^   |   &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& |
 |  ^  THE ROCKERY  19-24       ^   |   &  HEDGEWOOD  15-20             & |
 |  ^  (O) The Spigot           ^   |   &   * Clippings    * Barkhollow & |
 |  ^   |   * Flintdelve        ^   |   &   Burdock's Tangle            & |
 |  ^   |  The Kiln  Shard Mine ^   |   &   (Elder Privet)  Paper Spire & |
 |  ^   |  Marble Pits  Mudtooth^   |   &   Webhollow     Sawdust Mill  & |
 |  ^^^^|^^^^^^^^^^^^^^^^^^^^^^^^   |   &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& |
 |      |        _______________    |                                     |
 |       \      /  BIRDBATH KEEP \--+                                     |
 |        \----(   ~ the Basin ~  )   (capital, hub, no combat)           |
 |             \_______________/     Drainpipe Deeps below: 10 / 19 / 24  |
 |   ,,,,,,,,,,,,,,,,,,,,,,,,,,  \  * Pedestal Ward                        |
 |   , CLOVERFIELD  11-16     ,   \                                       |
 |   ,  * Sodbury             ,    ~~~~~ The Hose ~~~~~                   |
 |   ,  Honeydew Ranch        ,   . . THATCHFORD DOWNS  6-11 . . .        |
 |   ,  Red Anthills          ,        * Thatchford (the ford)            |
 |   ,  Crow's Perch          ,      Spinning Fountains   Compost Heap    |
 |   ,  Scarecrow Rise        ,      Crowfoot Hill        Neat Chapel     |
 |   ,,,,,,,,,,,,,,,,,,,,,,,,,,              ~~~ \                        |
 |                                     MOSSBOTTOM VALE  1-6   ~ brook ~   |
 |                                       * Mossbottom (START)             |
 |                                      Dewdrop Meadow  Feral Camp        |
 |                                      Beetle Barrows  Grubthorn's Burrow|
 +=========================================================================+

  Legend:  *  town      ^ rocks/mountains   & hedge forest   , clover/plains
           ~  water     |#| the Fence (edge of the world, impassable)
```

## Zones in play order

| # | Zone | Levels | Kind | Hub | Industry / role | Leans toward |
|---|---|---|---|---|---|---|
| 1 | **Mossbottom Vale** | 1-6 | Starter vale | Mossbottom | Mushroom village; the game's current intro | Tend it |
| 2 | **Thatchford Downs** | 6-11 | Rolling downs with a river | Thatchford | Market town; **class trainers (your Calling)** | Tend it (trade) |
| 3 | **Birdbath Keep** | hub | Capital castle, town at its base | Pedestal Ward | Court, Archive, bank, flight-robins | Tend it (law) |
| 3a | **Drainpipe Deeps** | 10-12, 18-20, 24-25 | Dungeon under the Keep, 3 wings | – | The Pipewrights' waterworks | – |
| 4 | **Cloverfield** | 11-16 | Flat plains | Sodbury | **Farming and ranching** (Charter of Root and Seed) | Tend it (old ways) |
| 5 | **Hedgewood** | 15-20 | Hedge forest | Clippings / Barkhollow | **Lumber and hunting** (Charter of Bough) | Let it grow (Wildlings) |
| 6 | **The Rockery** | 19-24 | Rock garden mountains | Flintdelve | **Mining** (Charter of Stone) and the Kiln | – (old, deep) |
| 7 | **The Verge** | 25-30 | Mowed waste by the Fence | Last Tuft | War front; the Shed; **the Mower** | Cut it all (Even Cut) |

Cloverfield and the Hedgewood overlap in level (15-16), so the player can do them in either order. The main story asks for Cloverfield first, because its carts are what haul the other two charters' goods. The Rockery comes last because it is the deepest and oldest, and that is where the main twist happens.

## Connections and travel

```
Mossbottom Vale --(north road)--> Thatchford Downs --(the ford, north)--> Birdbath Keep
                                                                            |  |  |   \
                                                   (west road) Cloverfield <-+  |  |    +--> Drainpipe Deeps (stairs under the Keep)
                                              (north-east road) Hedgewood <-----+  |
                                       (north-west, up the Hose) The Rockery <-----+
                                       Hedgewood --(north gate)--> The Verge <--(Rockery pass)-- The Rockery
```

- **On foot:** each road is a zone exit (see implementation notes below).
- **Snail-carts** (unlocked in Cloverfield): fast travel between towns you have visited, for a few gold. Slow, comic and safe.
- **Flight-robins** (unlocked after the Keep chapter): Birdbath Keep ⇄ Last Tuft only. Gnomes ride the Royal Robins for the war.
- **The Hose** can be ridden downstream on a leaf-raft from Flintdelve to Thatchford, as a one-way shortcut. It also happens to be how the player first arrived.

## Zone sheets

Each zone gets a sheet in [places-and-people.md](places-and-people.md). The sub-areas, at a glance:

| Zone | Sub-areas (enemy level) |
|---|---|
| Mossbottom Vale | Mossbottom (safe), Dewdrop Meadow (1-2), Puddlemere shore (2), Feral Camp (3-4), Beetle Barrows (4-5), Grubthorn's Burrow (6 elite boss) |
| Thatchford Downs | Thatchford (safe), the Hose banks (6-7), Spinning Fountains (7-8), Crowfoot Hill (8-9), the Compost Heap (9-11, mini-dungeon), the Neat Chapel (Even Cut, neutral) |
| Birdbath Keep | The Pedestal (castle), the Basin (royal lake), Pedestal Ward (town), the Archive, Robin Roost |
| Drainpipe Deeps | Wing 1 **the Gutters** (10-12), Wing 2 **the Cistern** (18-20), Wing 3 **the Backflow** (24-25) |
| Cloverfield | Sodbury (safe), Honeydew Ranch (11-12), Snail Pens (12), the Red Anthills (13-15), Crow's Perch (15-16 world boss), Scarecrow Rise (14-16) |
| Hedgewood | Clippings (safe), Barkhollow (safe), Sawdust Mill (15-16), Webhollow (16-18), Burdock's Tangle (Wildlings, neutral or hostile), the Paper Spire (18-20, wasp mini-dungeon), the Elder Privet (sacred) |
| The Rockery | Flintdelve (safe), the Spigot (19-20), Marble Pits (20-21), Shard Mine (21-22), Mudtooth Deeps (22-23), the Kiln (23-24, dungeon) |
| The Verge | Last Tuft (safe), the Shorn (25-27), The Level (Even Cut fort, 27-28), the Fence line (28-29), the Shed (30, final battle) |

## Implementation notes (for whoever builds it)

> Superseded by the open world: the zones below are now placed side by side in one continuous world, and road exits
> are real roads through passes. See [open-world.md](open-world.md). The notes are kept for history.

- The current game is one square map of ±120 units with Mossbottom at the centre. **Recommendation: one map per zone**, each a square of about ±120 (the Keep's map smaller, around ±80). Zone exits are glowing road-ends that load the next zone, the way the existing `REGIONS` table already names places. The current map *is* Mossbottom Vale; keep its layout.
- The existing `REGIONS` (Mossbottom, Dewdrop Meadow, Feral Camp, Beetle Barrows, Grubthorn's Burrow) and the unnamed `LAKE` become Mossbottom Vale's sub-areas. Name the lake **Puddlemere**.
- Add one road exit from Mossbottom Vale: north past Grubthorn's Burrow to Thatchford Downs. Grubthorn's tunnels collapsing behind him after the fight is a good excuse to open the road (the burrow was blocking it).
- Each zone keeps the existing data-table shape: `REGIONS`, `SPAWN_GROUPS`, `NPCS`, `QUESTS` per zone, plus a new `exits` list `{ to: zoneId, x, z, arriveX, arriveZ }`.
- Respawn after death is at the zone's **Glaze Shrine** (Mossbottom's is the well).
