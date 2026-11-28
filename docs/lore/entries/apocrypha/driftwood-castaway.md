---
id: driftwood-castaway
name: Driftwood
kind: person
tier: apocrypha
setting: apocrypha
era: now
status: draft
games: [gnome-theft-auto]
aliases: [The Castaway]
sources: [docs/design/gnome-theft-auto/story.md, docs/design/gnome-theft-auto/world-lore.md, games/gnome-theft-auto/src/quests/tessieQuest.ts, docs/roadmaps/gta-environments.md, games/gnome-theft-auto/src/quests/stages.ts, docs/design/gnome-theft-auto/characters.md, docs/design/gnome-theft-auto/story-outline.md, games/gnome-theft-auto/src/cutscene/cast.ts, games/gnome-theft-auto/src/cutscene/castIntros.ts]
related: [southern-drainage-canal, cloverfield-farms, combine-harvester, loch-moss, tessie, saltbucket-boardwalk, marram-teaspoon, baroness-brenda]
---

Sun-bleached castaway gnome who washed ashore in Cloverfield's Southern Drainage Canal on a popsicle-stick raft, raving about lawn sharks and open seas.

Also sells dinghies to steamers from [Driftwood's Boat Yard](driftwoods-boat-yard.md) on the Loch Moss shore.

## Story: Dry-Dock Dreams

Nobody knows which puddle or distant lawn-ocean Driftwood sailed from, only that his tattered captain's hat is held together with twine and duct tape. He camps beside a makeshift boat trailer, begging anyone with a Combine Harvester hitch to tow his raft toward "the Big Puddle" before dry season hits.

He insists the canal frogs are actually juvenile lawn sharks in disguise.

## What gnomes say

"Give Driftwood a tow if you've got a Combine—he pays in sea-foam paint and weird stories."

## The truth
Driftwood is the castaway turned boatman: he follows the water, starting alone and ending with a hut and a following. He wants to reach the open sea, and fears he is making it up. Secret: nothing, only a chart nobody has checked. Home: his trailer by the canal, then a beach hut on Saltbucket Boardwalk from #43; work: his tube hut there. Brenda tolls his raft and likes him; Captain Bilge and Marram Teaspoon become his neighbours; Tessie of Loch Moss is his old, shy friend. Voice: dreamy, rambling, sun-baked, sea-words for land things ("land's a bit damp, mate"; "Tide's a bell, friend, and you can hear it.").

Arc: a face at the Sprinkler Gauntlet (#18); asks for his raft back from the Flock (#25) and a tow to the dunes (#32); runs his tube hut on Saltbucket Boardwalk (#43) and vouches for Captain Bilge (#44); side quests only in act IV, lending the coalition a boat in #64 part 1.

## In the games

Cloverfield's canal raft (`sq-castaway-drydock`). Later he turns up on the Loch Moss shore by the dock, where he gives the Tessie side quest: he has heard something singing under the loch and wants proof, and he sends the player out by boat at dusk. See [loch-moss](loch-moss.md) and [tessie](tessie.md).

He waited six months beside a walnut dinghy on a cart in the southern fields (stage `driftwood-trailer`, see `driftwood-trailer`).

- Cast look (`src/cutscene/cast.ts`, preset `driftwood`): teal hat, sand shirt, pale beard, scale 1.44. Intro card (`src/cutscene/castIntros.ts`): "Castaway and boatman." / "Follows the water, tells long stories, and runs a tube hut by the sea."
- Story rows: #18 ch2-sprinkler-gauntlet, #25 m25-one-leg-to-stand-on, #32 m32-driftwoods-chart, #43 m43-saltbucket-boardwalk, #44 m44-the-bathtub-queen, #64 all-hats (By Water).

## Side quest: Castaway's Dry-Dock

On his trailer Driftwood rings a brass bell that nobody answers, and says the tide is coming in. After the player hauls his turf-raft to the canal, a walnut dinghy takes him out onto the water for the first time in six months. He stops talking, then hears something deep singing through the hull, far north. He salutes and says the captain's hat is in the trailer, if you want it.

## Loose threads

What sea chart is tattooed in faded blue ink on the bottom of his popsicle-stick raft.
