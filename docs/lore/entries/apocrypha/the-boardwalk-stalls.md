---
id: the-boardwalk-stalls
name: The Boardwalk Stalls
kind: place
tier: apocrypha
setting: apocrypha
era: now
status: draft
games: [gnome-theft-auto]
aliases: [the six stalls, Marram's Row]
sources: [games/gnome-theft-auto/src/coast/config.ts, games/gnome-theft-auto/src/coast/boardwalk.ts, docs/lore/rulings.md#r-158]
related: [gil-brinewater, tam-tinsley, dot-scoopwell, madame-limpet, penny-stubbs, saltbucket-boardwalk, marram-teaspoon, spun-sugar-sal, the-spokewheel, the-last-tube]
---

The six stalls along the north edge of Saltbucket Boardwalk, west to east: Spun Sugar Sal's, Plank & Pickle, Tin Shy, Scoop & Spade, The Lucky Limpet and Marram's Office. Each has a house rule, a short menu and a regular who has never been seen to buy anything.

## What gnomes say

"Six stalls, six prices, one change-counter, and she counts it twice."

"Everything on the boardwalk is sticky. That is how you know it is honest."

## Everyday

- **Spun Sugar Sal's** (x -150): candyfloss, pink or "the other pink", 2 Acorns a cloud; a toffee apple 3; a paper cone of burnt sugar 1. Sign: "Candyfloss is a vegetable (Sal says so)". House rule: "No dipping hats."
- **Plank & Pickle** (x -95): pickled things in paper cups: gherkin, clover, dune-onion, "the red one" (2 Acorns a cup, 3 with a fork). Sign over the barrel: "Ask about the brine. Do not ask what is in the brine."
- **Tin Shy** (x -40): three chipped acorns for 1 Acorn, a pyramid of tins to knock down. Prizes: a rubber seagull, a hat that is "nearly" a hat, nothing. Tin Shy's keeper sulks when somebody wins, and has pinned his three cola cans in a row on the boards for the purpose.
- **Scoop & Spade** (x 40): cones served in a small tin bucket, 3 Acorns a scoop, a spade to eat it with. Flavours: vanilla, sand-coloured, "whichever is left".
- **The Lucky Limpet** (x 95): fortunes at 1 Acorn, on a strip of paper from a shell. The strip always reads "Something will turn up." Customers nod and say it has already.
- **Marram's Office** (x 150): not a stall. The boardwalk's books, its lost property (hats, mostly), and a shelf of stubs: every fare, fine and fee since the bucket sank. Opens when Marram has counted the change.
- Habit: the stallholders swap places for ten minutes at noon, "to see how it feels", and swap back.
- Saying: "Stall-sticky" for a deal that cannot be unstuck.

## In the games

Positions and names are in `coast/config.ts` (`COAST.boardwalk.stalls`): the stalls stand along the north edge of the deck at z 1105.5 (R-240), fronts to the promenade; `coast/stalls.ts` draws them, with a name board, counter dressing, a lore sign beside each, Tin Shy's tin pyramid and Sal's candyfloss cart. Each stall has a keeper standing behind the counter at z 1109.5 (R-243):

- Spun Sugar Sal at x -152: [spun-sugar-sal](spun-sugar-sal.md).
- [gil-brinewater](gil-brinewater.md), Plank & Pickle: "Two acorns a cup. Three with a fork. The fork is the expensive part."
- [tam-tinsley](tam-tinsley.md), Tin Shy: "Nobody has won today. I am in a very good mood."
- [dot-scoopwell](dot-scoopwell.md), Scoop & Spade: "Vanilla, sand-coloured, or whichever is left. It is usually whichever."
- [madame-limpet](madame-limpet.md), The Lucky Limpet: "Something will turn up. That will be one acorn."
- [penny-stubbs](penny-stubbs.md), Marram's Office: "Every fare since the bucket sank. I have read them all twice."

The signs: "Ask about the brine. Do not ask what is in the brine."; "NO DIPPING HATS"; "3 CHIPPED ACORNS: 1 ACORN / Prizes: a seagull, a hat (nearly), nothing"; "Vanilla. Sand-coloured. Whichever is left."; "FORTUNES 1 ACORN / Something will turn up."; and on the office counter front, "LOST PROPERTY / Hats, mostly".

## Loose threads

Who the regular is at the Lucky Limpet, and what he was told the first time.
