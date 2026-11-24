---
id: ring-blocks
name: The Ring Blocks
kind: place
tier: apocrypha
setting: apocrypha
era: now
status: draft
games: [gnome-theft-auto]
aliases: [Ring Blocks]
sources: [docs/lore/rulings.md, games/gnome-theft-auto/src/districts.ts]
related: [turfton, pay-n-glaze, ammu-gnation, turfton-gazetteer]
---

Every grid block in Turfton that is not in one of the six named districts. No sign, no border, no name: just pot-street housing, the corner shops that are not famous, and the blocks where most gnomes actually live.

## Character

Ordinary. Ring-block gnomes do not mind being called ordinary, and they will tell you so before you ask. This is where a gnome's house is, the one with the pot on the step and the washing line that nobody has ever won.

## Landmarks

- Pay 'n' Glaze, (90, 150): the paint and respray shop on the south-east edge. See `pay-n-glaze`.
- The hose main, (10, -112), north of City Hall: the big rubber line that feeds the north blocks. Everybody knows where it is and nobody lets their kids near it.
- Ammu-Gnation, on the east edge: the gun shop at the edge of the grid. See `ammu-gnation`.

## Factions

None of their own. Ring-block gnomes belong to their neighbours, their hat colour, and whichever corner crew is closest.

## What gnomes say

"Pot-street is where you go home to. Downtown is where you go to be seen going home."

"We're not from anywhere. We're from here."

## Local slang

- "pot-street": an ordinary home, the sort with a pot on the step.
- "a ring-blocker": someone from no district in particular. Said kindly, most of the time.

## In the games

The Ring Blocks are the grid around the six districts. Pay 'n' Glaze's shop is here, south of the Greenhouse Strip (see `greenhouse-strip`), and the hose main north of City Hall is a landmark on the Downtown road. They have no district sign in `src/districts.ts`: `districtAt` returns nothing for them, and that is the point.

## Loose threads

Whether the hose main is still pumping. Nobody has turned it off, and nobody has ever seen it run.
