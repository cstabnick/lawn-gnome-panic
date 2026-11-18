# Gnome Sweet Gnome

A gnome match-3 with a house makeover. Swap mushrooms, gems, acorns, daisies, clovers and berries to beat levels, then spend the stars you earn on Gnorbert's yard, Granny Gnoma's mushroom cottage, Gnick's living room and Chef Gnocchi's kitchen. Each item comes in three styles.

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
