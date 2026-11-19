# Gnome Sweet Gnome

A gnome match-3 with a house makeover. Swap mushrooms, gems, acorns, daisies, clovers and berries to beat 60 levels, then spend the stars you earn making over three gnome homes, one room at a time (the Project Makeover loop):

| Home | Rooms | Levels it is paced for |
|---|---|---|
| Mossy Lane | Gnorbert's yard, Granny Gnoma's mushroom cottage, Gnick's living room, Chef Gnocchi's kitchen | 1-30 |
| Oakwood Treehouse | Twiggs's rope deck, Hazel's treetop bedroom, Old Burl's acorn workshop | 31-45 |
| Shell Cove | Captain Gnemo's boat dock, Pearl's seashell bathroom, Shelly's rock pool garden | 46-60 |

Each item comes in three styles. A home opens when the one before it is finished. ⌂ opens the Homes map (visit any open home); ‹ › step between the rooms of a home you have reached.

Saves: progress is in localStorage. Signed-in players also sync it to their account (`src/cloud.ts`, `@lawn/cloudsave` in merge mode). This browser's save and the account's are merged, never one thrown away (`src/saveMerge.ts`): the higher level, the best stars per level and every built item survive, stars are recounted from those, and the newer save wins only what cannot be merged (a restyled item). Other tabs work the same way: every write re-reads the save first, and the house redraws with a notice when another tab or device changed it (`@lawn/sync`). The title screen says whether the save syncs, or links to sign in. Every save text goes through `normalizeSave` in `src/save.ts`.

Run it: `npm run dev -w games/gnome-sweet-gnome`. Build it: `npm run build -w games/gnome-sweet-gnome`. Open with `#reset` to wipe progress.

## Tiles and specials

| Make | Get | Does |
|---|---|---|
| 4 in a row | Lawnmower (row or column) | Mows the whole row or column |
| L or T shape | Seed Bomb | Blows up a 3x3 square |
| 2x2 square | Bumblebee | Clears a plus, then flies to a stone, weeds or a random tile |
| 5 in a row | Rainbow Gem | Clears every tile of the colour you swap it with |

Swap two specials together for a combo (mower + mower = cross, bomb + bomb = 5x5, rainbow + anything = every tile of that colour becomes that special, rainbow + rainbow = the whole board).

Goals: collect a tile kind, clear the weeds, break the garden stones, bring the lost gnomes down to the bottom. Moves you have left at the end turn into mowers (the Gnome Rush).

## Level assessment

Bots play every level many times, so difficulty is measured instead of guessed:

```
npm run assess -w games/gnome-sweet-gnome                       # all levels, 40 seeds, 3 bots
npm run assess -w games/gnome-sweet-gnome -- --levels=1-10 --seeds=80 --bots=smart
npm run assess -w games/gnome-sweet-gnome -- --tune             # suggested moves and star scores per level
```

- `random` plays any valid swap, `greedy` takes the biggest match, `smart` plays for the goals (our stand-in for a decent human).
- Each level has a `target` smart-bot win rate from `targetFor(id)` in `src/levels.ts`: a sawtooth that gets harder, with a hard level every 5th, a super hard one every 10th, and a breather after each.
- `npm test -w games/gnome-sweet-gnome` includes `src/sim/curve.test.ts`, which fails when a level drifts off its target or the curve breaks (for example, a hard level easier than the one before it).

Tuning lives in `src/config.ts` (`TUNING`), levels in `src/levels.ts`, the house in `src/house/houseData.ts`.

## Music

A soft generated loop (`buildGardenLullaby` from `@lawn/music`) starts on the title tap. The music button on the house screen mutes music and sound effects together. No assets, nothing to credit.
