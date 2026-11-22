---
id: wayfarers
name: Wayfarers
kind: faction
tier: setting
setting: fescue
era: now
status: canon
games: [gnomes-of-gnomomia]
aliases: [AI gnomes, companions, town strollers]
sources: [games/gnomes-of-gnomomia/src/companions.ts, games/gnomes-of-gnomomia/src/companionLogic.ts, games/gnomes-of-gnomomia/src/towns.ts, docs/lore/rulings.md]
related: [the-bounds, thatchford, mossbottom, fieldwardens, the-rumbling]
---

Wayfarers are the other gnomes on Fescue's roads: travellers doing odd jobs for the same Reeves the player works for. In town they stroll the lanes between doors and stalls, and like everyone else they keep the Bound-Peace.

## What gnomes say

- Reeve Yarrow Burlap says: "There's always a Wayfarer on the Board before you. Usually standing in front of it, reading slowly."
- Some Wayfarers will race you to the next errand. Some read every plaque in town. Some pick up anything that isn't nailed down, and some only come to help.
- Clementine Wick the postmistress says: "They never get letters. Nobody knows where to send them."

## The truth

Wayfarers take the same errands the player takes, so the road never feels empty, even when few real players are online. They are not a guild and have no charter.

## In the games

- These are the AI gnome players (`src/companions.ts`, with the pure logic in `src/companionLogic.ts`). Each has a personality (`tryhard`, `lorehound`, `lootgoblin`, `wanderer`, `helper`), a name to match, a class, and quests drawn from the player's active and recent ones.
- When the player is in a town (`src/towns.ts`), some Wayfarers stroll its lanes between doors and stalls. Every gnome in that town sees them, because they are relayed online with their player's pose.
- They keep the Bound-Peace (R-041): no fighting inside a town's bounds. See R-043.

## Loose threads

- Where Wayfarers come from, and where they go between errands.
- Why the Reeves pay strangers instead of their own townsfolk.
