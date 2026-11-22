---
id: the-bounds
name: The Bounds
kind: concept
tier: setting
setting: fescue
era: charters
status: canon
games: [gnomes-of-gnomomia]
aliases: [the Bound-Peace, Beating the Bounds, town peace, town bounds]
sources: [games/gnomes-of-gnomomia/src/towns.ts, games/gnomes-of-gnomomia/src/data/packs/lore-mossbottom-thatchford.ts, docs/lore/rulings.md, docs/design/gnomomia/lore-rules.md, docs/design/gnomomia/places-and-people.md]
related: [thatchford, mossbottom, sodbury, clippings, barkhollow, flintdelve, last-tuft, birdbath-keep, the-charters, three-charters, wayfarers]
---

The Bounds are the swept edge of every town in Fescue. Once a year the town walks its edge with brooms, kiln-ash and salt ("beating the bounds"), and on market days it sweeps it again. Inside that line holds the Bound-Peace: no pest or beast starts a fight with a gnome, and a beast that follows one in loses its nerve and goes home. The town's lanes are kept a cart's width clear, as the Thatchford ford charter asks.

## What gnomes say

- The Charter of the Ford at Thatchford keeps the Square "swept by the town", and "no gnome shall build within a cart's width" of the ford. Most towns took both lines as their own, whether they had a charter or not.
- Reeve Yarrow Burlap of Thatchford says: "We sweep the bounds, then we sweep the Square, then somebody asks what the brooms are for. Every year."
- Captain Pip of Mossbottom says: "We're not a town. We beat the bounds anyway. Nobody remembers when we started, so nobody can stop."
- A Last Tuft quartermaster says: "The muster sweeps the camp edge every morning. The beetles respect it. The new recruits don't."
- Garden pests are hungry or scared, never evil. They keep off ground that smells of kiln smoke, salt and a great many gnomes.
- Some say the ash does it. Some say the Charters do. Some say the Mower taught the pests, long ago, to fear swept ground.

## The truth

The peace holds because the pests choose to keep it, not because anything stops them. A called fight is one the town allows: something is already inside (up from the cellars or out of the well), or a Reeve or a sergeant calls one for a trial. Mossbottom was never chartered (it is a village) and the Last Tuft is a war camp, but both sweep their edges: Mossbottom out of habit, the Last Tuft because the muster sweeps its banner camp every morning.

## In the games

- **Rule (R-041):** no enemy starts a fight with, chases or strikes a gnome inside a town's bounds. An enemy whose quarry steps inside gives up and goes home, idle beasts don't wander in, and no ambient enemy spawns within the bounds (spawn circles are kept 2 m clear, `TOWN_SPAWN_MARGIN`). The rule is pure code in `src/towns.ts`.
- **Called fights**, which a quest starts inside a town on purpose. `src/townPeace.test.ts` lists them, so a new one has to be argued for:
  - Stoutpot's Warden trial at the ford in Thatchford (`c2-trial-warden`).
  - The Clock-let-in defence at the Mossbottom well (`s01-clock-let-in`).
  - Holding the cellar hatch in Thatchford (`s03-hold-the-cellar-hatch`).
  - The Keep pikemen marching into Sodbury (`s04-spawn-1`).
  - Bramble's muck sprites in the Thatchford square (`s14-spawn-1`).
- **Towns** (`TOWN_DEFS`; each town's bounds are its region circle in the zone data): Mossbottom (`village`), Thatchford (`thatchford-town`, the square at the ford), Pedestal Ward (`pedestal-ward`, Birdbath Keep), Sodbury (`sodbury`, Cloverfield), Clippings and Barkhollow (`clippings`, `barkhollow`, the Hedgewood), Flintdelve (`flintdelve`, the Rockery) and the Last Tuft (`last-tuft`, the Verge).
- **Lanes (R-042):** town lanes stay a cart's width clear. Only a building, fence, wall or water that is meant to stand there closes one, and each closure is recorded with a reason (`src/townBlocks.ts`, `TOWN_BLOCKS` and `TOWN_ROAD_BLOCKS`). Clutter that blocks a lane by accident is a bug, and it gets moved.
- The balance sim's town walks (`npm run sim:town`, or `?townwalk=<town>` in the game) send test walkers down the same lanes, which is how the game checks them.
- Wayfarers stroll the lanes of the town the player is in, and keep the peace too (R-043).

## Loose threads

- Why the swept line works at all. The ash, the Charters and the Mower all have their believers.
- Who first beat the bounds, and whether the Planting-age gnomes did it before there were towns to sweep.
- The margin of the ford charter: "Towns grow where people stop, and we were told to keep moving." Who told them is not written.
