---
id: burt-hoa
name: Burt
kind: person
tier: apocrypha
setting: apocrypha
era: now
status: draft
games: [gnome-theft-auto]
aliases: [Inspector Burt]
sources: [docs/design/gnome-theft-auto/story.md, docs/roadmaps/gta-environments.md, games/gnome-theft-auto/src/quests/stages.ts, docs/design/gnome-theft-auto/characters.md, docs/design/gnome-theft-auto/story-outline.md, games/gnome-theft-auto/src/cutscene/cast.ts, games/gnome-theft-auto/src/cutscene/castIntros.ts]
related: [hoa, reginald-vance, thorne-lawn-and-order, bodega-and-sons, big-wrench-grout, clay-mart, mossley-inkcap]
---

Nervous former HOA junior inspector who grew a conscience—or just got stiffed on overtime—and started leaking enforcement van routes to street crews.

## Journal: Resignation Draft (Unsent)

> *Today Reginald ordered me to issue a citation to a cactus in the Dust Flats for "unruly needles" and a snowman in Frostbite Fells for "exceeding seasonal height." I didn't get paid time-and-a-half for driving through a blizzard to measure Frosty's nose. The Tall Ones aren't even behind this—it's just middle management in beige vests!*

Burt now hides behind dumpsters downtown, paying drivers to repossess HOA citation drones across all four biomes.

## What gnomes say

"Burt still wears his beige vest out of habit, just with the HOA logo scratched off with a house key."

## The truth
Burt is an ex-HOA citation writer who leaks van routes to street crews. He wants to be paid time-and-a-half, once, and fears the Hat Watch finding the scratched badge. Secret: the old citations he rereads are all addressed to Vesper's own flat. Home: a rented room above Clay-Mart; work: the Clay-Mart lot. He owes Grout a lot of favours, once worked under Reginald and says nothing about him, and drinks coffee outside Bodega & Sons beside Cedric while pretending not to know him. Voice: an apologetic mutter, quick, nervous, ending on an "uh"; he cites a citation number when anxious ("Citation four-oh-nine. Sorry. Habit." / "Don't use my name. Uh. Use any name.").

Arc: side quests only in acts I, II and IV; in act III his van routes appear on a Hat Watch map seized off-screen.

## In the games

Burt drives a decommissioned primer HOA van (see `cast-rides`) and works the Clay-Mart returns yard (stage `clay-mart-lot`).

The HOA Audit side quest (`sq-hoa-audit-intro`, `sq-hoa-audit-outro`) starts at Bodega & Sons: Burt rejects a grievance form (FORM 404-B) and sends the player to crack five petty HOA citation officers, then bring their clipboards back. The clipboards turn out to be forged Tall-One mandates on Thorne Lawn & Order letterhead. Reginald Vance drives in to the Clay-Mart returns yard for a stand-off and says he will be back with a laser level. Burt's reward is his old badge, which he calls "still shiny".

- Cast look (`src/cutscene/cast.ts`, preset `burt`): grey hat, tan shirt, grey beard, glasses, scale 1.44. Intro card (`src/cutscene/castIntros.ts`): "Ex-HOA citation writer." / "Leaks van routes to the street crews, and jumps at every sound."
- No main-quest row; side quest: the HOA Audit (above).

## Loose threads

Where Burt stashed the master spreadsheet of every fake Tall-One mandate.
