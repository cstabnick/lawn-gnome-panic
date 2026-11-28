---
id: shelldon-mucilage
name: Shelldon "No-Trail" Mucilage
kind: person
tier: apocrypha
setting: apocrypha
status: canon
games: [gnome-theft-auto]
aliases: [Shelldon, No-Trail]
sources: [docs/design/gnome-theft-auto/story.md, docs/design/gnome-theft-auto/brands.md, games/gnome-theft-auto/src/radio/content.ts, docs/roadmaps/gta-environments.md, games/gnome-theft-auto/src/quests/stages.ts, games/gnome-theft-auto/src/quests/races.ts, docs/design/gnome-theft-auto/characters.md, docs/design/gnome-theft-auto/story-outline.md, games/gnome-theft-auto/src/cutscene/cast.ts, games/gnome-theft-auto/src/cutscene/castIntros.ts]
related: [turfton-fm, sorrel-tillbrook, turfton, hoa, fizz-cup, fizz-cup-field, lost-and-found-speedway, snail-mail-express, thermos-theo, tansy-clayfoot, mossley-inkcap]
---

A snail-courier of Snail-Mail Express who will not step on a paved road, and who calls the Fescue Public programme to
say so.

## What gnomes say

"THE GRID IS A TALL-ONE CIRCUIT BOARD, MAN!" Shelldon says this with great calm, and then goes back to his snail.

## History

Shelldon runs the only encrypted messaging network in Turfton, and runs it by taping micro-scrolls to racing snails.
He is part of the Snail-Mail union, which is slow, reliable and eventually on time. He has never once been late. He
has been asked to explain this and has said that the snails do not believe in time, and that it makes his job
easier.

He refuses to walk on the Turfton grid. He goes round it through the verges, which is why he calls Fescue Public
Radio: Sorrel is the only host who has ever said that the verges are interesting.

## Quirks

- His mossy trench coat has a pocket for every snail he owns, and he knows each of them by a letter.
- He believes the grid is a circuit. He has never explained what it is a circuit for.
- He leaves a message on every snail he passes, which means the snails are very well informed.

## The truth
Shelldon is a Snail-Mail Express courier, union in his own slow way. He wants every scroll delivered with the snails' blessing, and fears the paved road. Secret: the snails do not believe in time, and he is quietly their employee. Home: a den behind the dumpsters in his alley (the retired snail-coach); work: snail-post courier. Theo holds his scrolls, Tansy trusts only his network, Sorrel quotes him on air, and the snails come first. Voice: CAPS-LOCK calm, slow, monotone, treating nonsense as settled fact; he ends with "man" or "..." and goes back to his snail ("THE SNAIL KNOWS. I JUST CARRY.").

Arc: side quests only in acts I-II; in act III the snail carrying Tansy's scroll reaches the crew in the Fells (#36); absent in act IV.

## In the games

- Fescue Public's call-in segments (`radio/content.ts`).
- The Snail-Racing Rigging side quest (`sq-snail-rigging`): he briefs the player in the dumpster alley at dawn, asks
  for a decaf lettuce swap in the downtown slug paddock, and pays out in a Tinfoil Conspiracy Brim after a stop-motion
  alley photo finish. He says the brim blocks satellites that are not watching you.

- Races the whole Snail-Coach Endurance on the gravel run-off at the Lost & Found Speedway, and refuses the podium
  because it is paved (`quests/races.ts`).

He lives in a retired snail-coach parked in Shelldon's Dumpster Alley behind Bodega & Sons (stage `shelldon-alley`), and haunts the Downtown Slug Paddock (stage `snail-paddock`).

- Cast look (`src/cutscene/cast.ts`, preset `shelldon`): grey-green hat, dark green shirt, no beard, glasses, scale 1.4. Intro card (`src/cutscene/castIntros.ts`): "Snail-Mail Express courier." / "Carries scrolls by snail, in capitals, and never on a paved road."
- Story rows: #36 ch3-kiln-resin-ice (the scroll from Tansy). Home in the game: `shelldon-alley`.

## Loose threads

What does the grid run? Who is the snail that carries the last message? And did the snail with the letter Q get
where it was going?
