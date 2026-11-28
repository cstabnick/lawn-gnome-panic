---
id: mabel-kerbstone
name: Mabel Kerbstone
kind: person
tier: apocrypha
setting: apocrypha
era: now
status: draft
games: [gnome-theft-auto]
aliases: [Mabel]
sources: [docs/lore/rulings.md, games/gnome-theft-auto/src/taxi.ts, games/gnome-theft-auto/src/config.ts, docs/design/gnome-theft-auto/characters.md, docs/design/gnome-theft-auto/story-outline.md, games/gnome-theft-auto/src/cutscene/cast.ts, games/gnome-theft-auto/src/cutscene/castIntros.ts]
related: [kerbstone-cabs, turfton-taxi, turfton-bus-stop, snail-coach, newcomers-card, kerbside-exchange, juniper-vance, reginald-vance, dot-pennywort]
---

The driver of the Turfton Taxi. She calls everyone "dear", and she has never once been short of change.

## What gnomes say

"Suit yourself, dear." (Her line when a gnome sends her away.)

## The truth
Mabel is city-neutral: she knows every fare's business and sells none of it. She wants every fare to end well and be paid in cash, and fears a flat tyre on a long night. Secret: she has never been short of change, and nobody has seen her count it. Home: a flat over the Kerbstone Cabs garage; work: Kerbstone Cabs and the Central Bus Stop kiosk. Voice: warm, brisk, motherly; "dear" at the end of every line and the meter mentioned in passing. She is aunt to everyone in town and cousin to nobody; she keeps Dot's lunch bench clear.

Arc: drives the player to the bank (#2) and joins the Mayor tail (#6); after that, side quests only (the Central Bus Stop is always there). She turns the crew down on every job ("Not on a job, dear.") and gives the player one free ride, in the epilogue (R-071).

## In the games

Mabel is the voice of the Turfton Taxi (`TAXI.driver` in `config.ts`). Her lines, in game:

- "Turfton Taxi, on my way!" when called.
- "Hop in, dear. Meter's already running." when she pulls up.
- "Central Bus Stop. Sit tight." when the gnome is in.
- "Central Bus Stop. Mind the NO LOITERING stencil." when she drops the gnome off.
- "Suit yourself, dear." when the gnome sends her away.
- "Short? This one's on the meter." when the gnome cannot pay the fare.

She will not wait for a gnome with the Hat Watch after them or one in the middle of a job; she says so and drives off.

- Cast look (`src/cutscene/cast.ts`, preset `mabel`): yellow hat, black shirt, no beard, glasses, grey pigtails, scale 1.4. Intro card (`src/cutscene/castIntros.ts`): "Turfton Taxi driver." / "Hop in, dear. Knows every fare's business and sells none of it."
- Story rows: #2 m02-roof-on-credit (the first ride, fare on the bank), #6 ch1-two-coat-tail, then side quests and the epilogue ride.

## In the city cast

Part of the recurring city cast (R-151). She drops every fare at the Central Bus Stop, next to the Kerbside Exchange,
where Dot Pennywort's board is.

Between fares she keeps the Newcomers' Card (R-156): giver `newcomers-club` by the Central Bus Stop in
`games/gnome-theft-auto/src/quests/newcomerQuests.ts`. She also dispatches Kerbstone Cabs, the taxi job of the sim jobs
(`games/gnome-theft-auto/src/jobs/defs.ts`).

## Loose threads

Why the taxi only ever drives to the Central Bus Stop, and what Mabel does between fares. Whether she has ever been to the other side of the Fence.
