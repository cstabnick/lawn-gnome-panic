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
sources: [games/gnomes-of-gnomomia/src/companions.ts, games/gnomes-of-gnomomia/src/companionLogic.ts, games/gnomes-of-gnomomia/src/companionLife.ts, games/gnomes-of-gnomomia/src/companionGear.ts, games/gnomes-of-gnomomia/src/towns.ts, docs/lore/rulings.md]
related: [the-bounds, thatchford, mossbottom, fieldwardens, the-rumbling, horn-calls]
---

Wayfarers are the other gnomes on Fescue's roads: travellers doing odd jobs for the same Reeves the player works for. In town they stroll the lanes between doors and stalls, and like everyone else they keep the Bound-Peace. Between errands they rest at shrines and town squares, and run on to the next town that suits them.

## What gnomes say

- Reeve Yarrow Burlap says: "There's always a Wayfarer on the Board before you. Usually standing in front of it, reading slowly."
- Some Wayfarers will race you to the next errand. Some read every plaque in town. Some pick up anything that isn't nailed down, and some only come to help.
- Clementine Wick the postmistress says: "They never get letters. Nobody knows where to send them."
- Gnomes in Thatchford say: "Half of them are asleep on the fountain steps. Let them be. The grass owes them a nap."
- Reeve Yarrow Burlap says: "Walk with a Wayfarer if you must. Ask them properly, and keep them away from the brooms."

## The truth

Wayfarers take the same errands the player takes, so the road never feels empty, even when few real players are online. They are not a guild and have no charter. A Wayfarer walks with a gnome who asks them, up to three at a time, and a band like that is called a party (see the parties ruling, R-136).

## In the games

- These are the AI gnome players (`src/companions.ts`, with the pure logic in `src/companionLogic.ts`). Each has a personality (`tryhard`, `lorehound`, `lootgoblin`, `wanderer`, `helper`), a name to match, a class, and quests drawn from the player's active and recent ones.
- When the player is in a town (`src/towns.ts`), some Wayfarers stroll its lanes between doors and stalls. Every gnome in that town sees them, because they are relayed online with their player's pose.
- Between errands Wayfarers quest in stints, then take a break: they stand about (and wave at a gnome who comes close),
  sit on the ground at the nearest shrine or town square, or run to a town or shrine one zone away whose level suits
  them (`src/companionLife.ts`). Their level follows their errand, or the zone when they have none, and town strollers
  are always of a level that suits the town.
- Each wears class gear of its level, picked the same way on every player's screen (`src/companionGear.ts`).
- They keep the Bound-Peace (R-041): no fighting inside a town's bounds. See R-043.
- Parties (`src/party/`): the player can ask up to three Wayfarers along, or party with online players; party Wayfarers follow, fight beside the player and get up beside them. Kills near the party are shared.
- They answer horn calls (raids): up to three come to a blown horn post and fight beside the player as a tank (Warden), a healer (Hedge-Mage) or a damage dealer (Slinger), in `src/raidHelpers.ts`. See `horn-calls`.

## Loose threads

- Where Wayfarers come from.
- Why the Reeves pay strangers instead of their own townsfolk.
