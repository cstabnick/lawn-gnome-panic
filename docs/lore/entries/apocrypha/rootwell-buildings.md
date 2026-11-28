---
id: rootwell-buildings
name: The Rootwell Halls
kind: place
tier: apocrypha
setting: apocrypha
era: now
status: draft
games: [gnome-theft-auto]
aliases: [Rootwell Campus, Rootwell Quad, The Long Shelf, Tilth Hall, Plumbob Hall, Bedstraw House, The Crucible Block, The Trencher, The Cold Frame Club, The Cloche, The Heap Barn, Bodger's Shed, Wicket Lodge, The Clod, The Dean's Lodge]
sources: [games/gnome-theft-auto/src/campus/types.ts, games/gnome-theft-auto/src/campus/buildings.ts, docs/lore/rulings.md#r-199]
related: [rootwell-university, lovage-inkwell, the-anthill, anthill-observatory, rootwell-field]
---

The thirteen buildings of Rootwell University, each with a name plate beside its front door giving its name and its job: a library called a shelf, a refectory called a trencher, a stadium called a clod. They stand round a quad lawn in the campus site (x 980 to 1300, z -350 to -50).

## What gnomes say

"Nobody has read the whole Long Shelf. Several people have been asked to leave it."
"The Trencher is where Rootwell keeps its sugar. The Cold Frame Club is where it keeps its opinions."

## The truth

Positions, in world metres, from the code. North: **The Long Shelf** (library, 1110, -290, 36 x 22 m) and **Plumbob Hall** (gnome-physics hall, 1180, -292, with a helipad roof). South: **Tilth Hall** (lecture hall, 1110, -112, 36 x 24 m, a walkable roof) and **the Crucible Block** (lab block, 1180, -110). East: **the Trencher** (refectory, 1245, -215), **the Cold Frame Club** (faculty club, 1250, -160) and **the Cloche** (glasshouse, 1285, -215). Further out: **Bedstraw House** (dorm, 1030, -315), **Bodger's Shed** (engineering shed, 1262, -318), **the Heap Barn** (mulch-science barn, 1265, -85), **Wicket Lodge** (gate lodge, 1000, -214), **the Clod** (stadium, 1040, -95: two grandstands face a pitch of 54 x 18 m, with a signpost plate reading THE CLOD) and **the Dean's lodge** (1055, -245), where Dean Lovage Inkwell lives and the front door is his home door. The plates read the building's name over its role in capitals.

## In the games

Built by `campus/buildings.ts` from the prefabs on the footprints in `campus/types.ts`, with exact colliders. The Long Shelf, the Crucible Block and Tilth Hall can be entered (`campus/interiors.ts`). The University's own entry has the overall layout and the quest rows.

## Loose threads

Which building is the thirteenth, if the University says twelve. Who named the Clod.
