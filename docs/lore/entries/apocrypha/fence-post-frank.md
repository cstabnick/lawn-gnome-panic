---
id: fence-post-frank
name: Fence-Post Frank
kind: person
tier: apocrypha
setting: apocrypha
era: now
status: draft
games: [gnome-theft-auto]
aliases: [Frank]
sources: [docs/design/gnome-theft-auto/world-lore.md, docs/roadmaps/gta-environments.md, games/gnome-theft-auto/src/quests/stages.ts, docs/design/gnome-theft-auto/characters.md, docs/design/gnome-theft-auto/story-outline.md, games/gnome-theft-auto/src/cutscene/cast.ts, games/gnome-theft-auto/src/cutscene/castIntros.ts]
related: [franks-shack, cloverfield-farms, buck-iron, razor-back, sage-ladle, granny-gnertrude-cloverfield, gate-guard-gary, rooster-weatherby, peony-gravelrake]
---

Cloverfield Farms highway watcher leaning permanently against the `south` welcome sign at `x: 0, z: 260`, chewing timothy grass and identifying stolen rigs by ear.

## Story: The Ear for Iron

Frank doesn't own a mower anymore, and he doesn't want one. He prefers the shade of the welcome sign, where he can listen to traffic rolling south out of Turfton. He can tell a Buck-Iron Ride-On with a slipping belt from a Razor-Back with a hotwired ignition half a mile before it crests the hill.

As you tear past him in a freshly boosted tractor, Frank never reaches for a phone. He just shifts his grass blade to the other side of his mouth and mutters, *"That's a stolen rig,"* with pure, quiet appreciation.

## What gnomes say

"Frank's never snitched once, mostly because he respects a clean hotwire."

## The truth
Frank is an informal neutral who knows every engine by ear. He wants a quiet road and a clean hotwire, and fears a silence that lasts all day. Secret: the sign says more than he does. Home: a shack behind the south welcome sign; work: watching the highway and the diner counter. He eats every meal at the diner and Sage cooks it silently; Granny is the one he would never name a rig of; Gary is his idea of a bad road. Voice: a slow drawl, long vowels, a grass blade between his teeth; he reviews the engine before the person and gives an appreciative grunt after naming a model ("Buck-Iron. Slipping belt. ...Nice." / "Granny Gnertrude. Only one Vesper cannot buy.").

Arc: names Granny at the diner (#13); sends the player to the Kicked Board after hearing golf balls over the fence (#29); side quests only after.

## In the games

Frank eats every meal at the counter of the Route South Acorn Diner, and his hand-painted sign stands across the road (stage `south-highway-diner`, see `route-south-acorn-diner`).

- Cast look (`src/cutscene/cast.ts`, preset `frank`): brown hat, brown shirt, scale 1.44. Intro card (`src/cutscene/castIntros.ts`): "Shack behind the sign." / "Slow drawl, grass blade. Reads your engine before he meets you."
- Story rows: #13 m13-diner-on-route-south, #29 m29-the-kicked-board. Home in the game: `home-07`, the shack behind the sign.

## Loose threads

Which legendary Combine heist Frank allegedly pulled before retiring to the welcome sign.
