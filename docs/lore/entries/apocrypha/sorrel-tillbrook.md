---
id: sorrel-tillbrook
name: Sorrel Tillbrook
kind: person
tier: apocrypha
setting: apocrypha
status: canon
games: [gnome-theft-auto]
aliases: [Sorrel]
sources: [docs/design/gnome-theft-auto/story.md, games/gnome-theft-auto/src/radio/content.ts, docs/roadmaps/gta-environments.md, games/gnome-theft-auto/src/quests/stages.ts, docs/design/gnome-theft-auto/characters.md, docs/design/gnome-theft-auto/story-outline.md, games/gnome-theft-auto/src/cutscene/cast.ts, games/gnome-theft-auto/src/cutscene/castIntros.ts]
related: [sorrels-cottage, turfton-fm, dock-hoewright, cress-caliper, shelldon-mucilage, ferals, gnorwins-ledger, stopping-stone, hat-watch, the-unmowed, elder-bracken-gta, nubbin, pip-potsworth, clara-porcelain]
---

The host of 88.7 Fescue Public Radio, the only station in Turfton that tells its listeners to be careful. A Fescue
gnome, and one of the few who came out of the Fence on purpose.

## What gnomes say

"The lawn keeps you, so keep the lawn." The Fescue gardeners' saying, which Sorrel recites at the start of each
programme, and which the rest of Turfton finds either beautiful or very old.

## History

Sorrel read the lessons in the schoolhouse at Fescue for twenty years, teaching the children to recite the Charters of
Gnorwin and the names of the Planting's gardens. She left through a knot-hole in the Fence, following a snail-cart
that carried a copy of one page of Gnorwin's ledger to a reader in the Wood. The page never arrived. Sorrel did. She settled in Mossy Wood among the Unmowed, and then, when the Blade's engineers offered her a
slot with a studio and a tape machine, she took Turfton's airwaves for a public service, which she still considers
the most useful thing she has ever done.

She has never said the word "mower" on air. She says "the one in the Shed", or "the Blade" (which is a joke that
only Fescue gnomes get), and she believes a station that names a machine is a station that will one day have to
answer for it.

## Quirks

- Her "rain on terracotta" recordings were made at the Fence, on damp nights, at the gap she left by.
- Her listeners write to her about the creak on the tapes. She has never explained the creak.
- She answers letters on the air, often with a single word.

## The truth
In the story Sorrel keeps the Fence-gap rain tapes and is the Unmowed's voice outside the wood. She wants to keep the peace and the broadcast going, and fears the station going silent. Home: a cottage behind her radio booth in Mossy Wood. Voice: a radio host's calm, measured warmth, dry asides about the schedule ("That was the weather. This is the part where I do not panic."). She never says "mower": it is "the one in the Shed". Pip is her unexpected friend; Nubbin is her small neighbour; Moleman's thumping set fills her speakers.

Arc: heard on the radio only in act I; asks the player to recover her confiscated tapes (#22), sits at the Elder's side (#23), sends Nubbin's chase to the Burrow Door (#24) and records the rain with Pip at the knot-hole (#26); a warm voice in the cold of act III; in act IV she broadcasts the coalition's call to the overlook.

## In the games

- Fescue Public Radio's banter and calls (`radio/content.ts`). Her "Kiln & Culture" hour is where the Fescue lore
  turns up: Gnorwin's ledger, the Stopping Stone, the Fescue Exiles.

Her 88.7 booth is a stack of crates, a tape bank and a dish beside Unmowed Hollow (stage `sorrel-radio-booth`, see `sorrel-radio-booth`). She rides nothing with an engine.

- Cast look (`src/cutscene/cast.ts`, preset `sorrel`): sage-green hat, taupe shirt, no beard, auburn pigtails, scale 1.4 (headphones as a prop in the booth). Intro card (`src/cutscene/castIntros.ts`): "Radio host, 88.7 Fescue." / "The calm voice of the Unmowed on the radio. Keeps the rain tapes."
- Story rows: #22 m22-off-air, #23 ch2-unmowed-tablet, #24 the burrow door, #26 m26-the-knot-hole, then radio calls through acts III-IV. Home in the game: `home-05`, the cottage behind the booth (`src/homes/data.ts`).

## Loose threads

What is the knock on her tape? She says: "Yes, I heard the knock too. No, I am not going to open it. Not while the
rain is on." Does the Fescue schoolhouse still have a copy of the ledger? And what is it that the Unmowed know about
the Stopping Stone that Sorrel is careful not to say on air?
