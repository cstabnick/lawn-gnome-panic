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
sources: [docs/lore/rulings.md, games/gnome-theft-auto/src/taxi.ts, games/gnome-theft-auto/src/config.ts]
related: [turfton-taxi, turfton-bus-stop, snail-coach, newcomers-card, kerbside-exchange]
---

The driver of the Turfton Taxi. She calls everyone "dear", and she has never once been short of change.

## What gnomes say

"Suit yourself, dear." (Her line when a gnome sends her away.)

## In the games

Mabel is the voice of the Turfton Taxi (`TAXI.driver` in `config.ts`). Her lines, in game:

- "Turfton Taxi, on my way!" when called.
- "Hop in, dear. Meter's already running." when she pulls up.
- "Central Bus Stop. Sit tight." when the gnome is in.
- "Central Bus Stop. Mind the NO LOITERING stencil." when she drops the gnome off.
- "Suit yourself, dear." when the gnome sends her away.
- "Short? This one's on the meter." when the gnome cannot pay the fare.

She will not wait for a gnome with the Hat Watch after them or one in the middle of a job; she says so and drives off.

## In the city cast

Part of the recurring city cast (R-151). She drops every fare at the Central Bus Stop, next to the Kerbside Exchange,
where Dot Pennywort's board is.

Between fares she keeps the Newcomers' Card (R-156): giver `newcomers-club` by the Central Bus Stop in
`games/gnome-theft-auto/src/quests/newcomerQuests.ts`. She also dispatches Kerbstone Cabs, the taxi job of the sim jobs
(`games/gnome-theft-auto/src/jobs/defs.ts`).

## Loose threads

Why the taxi only ever drives to the Central Bus Stop, and what Mabel does between fares. Whether she has ever been to the other side of the Fence.
