---
id: turfton-transit
name: Getting around Turfton
kind: concept
tier: apocrypha
setting: apocrypha
era: now
status: draft
games: [gnome-theft-auto]
aliases: [Turfton transport]
sources: [docs/lore/rulings.md, docs/design/gnome-theft-auto/world-lore.md, games/gnome-theft-auto/src/taxi.ts]
related: [snail-coach, turfton-taxi, turfton-skyway, turfton-ring-road, snail-mail-express, pigeon-drop-couriers, side-valve-lock-up, turfton-gazetteer, turfton-council]
---

How a gnome gets from one part of Turfton to another, and what carries the post.

## What gnomes say

"Take the Snail-Coach in, take the cab out." Everyone's first trip is on the Snail-Coach, and their last is in Mabel's cab.

## The truth

- **The Snail-Coach** line ends at the Central Bus Stop, where every newcomer gets off.
- **Mabel's Turfton Taxi** always drives back to the Central Bus Stop, whatever the fare. Nobody knows why.
- **Local 404's roads** are the grid's own streets. They are paved, patched and kept by the union.
- **The Ring Road** runs round the outside of the city. **The Skyway** goes over the east side. The HOA will not drive
  the Skyway, because Local 404 built it (R-152).
- **Snail-Mail Express** carries parcels by snail, slowly and reliably.
- **Pigeon-Drop** couriers take the urgent post, from roof to roof.
- **The Sling-Lift** at Tansy's Lock-Up carries a mower up to the Lock-Up, when called from the phone.

## In the games

The taxi (`src/taxi.ts`) is the one part of this that a player calls directly. The rest is background and quest
scenery.

## Loose threads

What the Snail-Coach does when it is not carrying newcomers in.
