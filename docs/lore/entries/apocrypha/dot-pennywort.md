---
id: dot-pennywort
name: Dot Pennywort
kind: person
tier: apocrypha
setting: apocrypha
era: now
status: draft
games: [gnome-theft-auto]
aliases: [Dorrit Pennywort, Dot]
sources: [docs/lore/rulings.md, games/gnome-theft-auto/src/city/cityCast.ts, games/gnome-theft-auto/src/quests/cityQuests.ts, docs/design/gnome-theft-auto/characters.md, docs/design/gnome-theft-auto/story-outline.md, games/gnome-theft-auto/src/cutscene/cast.ts, games/gnome-theft-auto/src/cutscene/castIntros.ts]
related: [kerbside-exchange, turfton-bus-stop, snail-coach, turfton-gazetteer, neon-moth-nina, hedda-galley, big-wrench-grout, pip-potsworth, mabel-kerbstone, burt-hoa]
---

A retired Snail-Coach conductor who runs the Kerbside Exchange: a cork notice-board and a folding desk on the pavement
just south of the Central Bus Stop.

## What gnomes say

"Next!" "Fares, please." She calls every stop, and she punches a ticket for every job she hands out. "The city pays me in gossip."

## The truth

She takes no cut from anyone. Every open side contract in and around Turfton is pinned to her board, whoever offers it.
Her own clients (Neon-Moth Nina, Hedda Galley, Big Wrench Grout, Pip) hand out their jobs at her desk. The other givers
still give their own jobs where they live.

Dot runs the Kerbside Exchange job board, neutral to all, and pins everyone's jobs. She wants the board never empty, and fears a stop she cannot call. Secret: who pays her in gossip. Home: a room over the Exchange. She hands out Nina's, Hedda's, Grout's and Pip's jobs, lunches on the bus-stop bench beside Mabel's taxi, and keeps Burt's name off the board. Voice: crisp, brisk, a conductor's call where every sentence is a stop; "Next!" and a punched ticket ("Next! Fares, please. Job nine, Hedda's.").

Arc: pins the player's first city contracts (I); side quests only in act II; the board stays up while the crew is away (III); pins the coalition's public notices (IV).

## In the games

- Giver `kerb-exchange`: the Exchange desk, where the errands report back.
- Her own quest is `city-kerbside-rounds`. The rest of the city contracts in `src/quests/cityQuests.ts` are pinned to
  her board, and the Kerbside Exchange app reads them from the phone.

- Cast look (`src/cutscene/cast.ts`, preset `dot`): blue hat, red shirt, no beard, glasses, grey pigtails, holds a ticket stub, scale 1.4. Intro card (`src/cutscene/castIntros.ts`): "Kerbside Exchange job board." / "Pins everyone's jobs to the board and punches the tickets. "Next!""
- No main-quest row.

## Loose threads

Who pays her the gossip, and what she does with it.
