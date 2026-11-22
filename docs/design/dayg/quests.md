# Quests: the world asks for help

There is no hand-written main quest. **A quest is a need in the simulation that a gnome is willing to pay someone else
to meet.** That keeps every quest tied to the world: finishing it changes something the simulator tracks.

## Where quests come from

Every L2 tick, each faction and some individual NPCs check their state against a list of **quest templates**. A template
fires when its condition holds, and posts an offer to the place where people would hear of it (a settlement's notice
board, a `wanted-poster`, a rumour at a campfire, a dying gnome).

| Template | Fires when | Player does | Changes in the world |
|---|---|---|---|
| **Supply run** | a market's stock of a tag group < 30% of target | bring N of a tag (any item that matches) | market stock, price, faction morale |
| **Escort** | a caravan's route risk is above its owner's tolerance | guard it | trade happens or doesn't; the raiders' take |
| **Clear the ground** | Hatless density next to a settlement's gardens is high | thin the herd or steer it off | food output, the settlement's safety |
| **Missing gnome** | a member hasn't come back and someone trusts them | find them (alive, Hatless, or deserted) | that gnome's fate, the group's trust |
| **Open the crypt** | a faction wants a sealed crypt's relics | pry and clear it | big loot, the faction's power |
| **Bounty** | a gnome has a big enough grudge against someone | find and deal with the target (or warn them) | the target's group, your reputation everywhere |
| **Sabotage** | a faction at war wants a rival weaker | break walls, poison stores, steal maps | the rival's power |
| **Steer the Drift** | a big herd is on its way | lead it elsewhere with noise | which settlement takes the hit |
| **Envoy** | two factions could ally but don't trust each other enough | carry gifts and letters (`sealed-letter`) | the alliance, or a war if you read the letter |
| **Teach** | a group lacks a skill you have | stay and teach | the group's skill (lineage) |
| **The bitten** | a member is infected, the norm is undecided | find medicine in time, or carry out the norm | the faction's norms shift |

- **Reward** comes from what the poster actually has: acorns, food, a tool from the store, a place in the group, a
  map, or a favour (trust). A poor faction offers less, and its quests are often more urgent.
- **Deadline** comes from the simulation (the herd will arrive, the food runs out). Quests can expire; the world
  goes on without you.
- **Several sides.** The same event usually makes quests for more than one faction: the Rusted Spades post a bounty on
  a caravan that the Lantern Keepers posted an escort for. Taking both is possible, and the betrayal is remembered.

## Reputation and standing

- With each faction: **standing** from −100 (shoot on sight) to +100 (inner circle), from the average trust of its
  members who know you, pulled toward what its leader thinks.
- Ranks inside a faction you joined: Stray → Hand → Sworn → Warden → Voice (a seat at the council or next to the
  leader). Higher ranks let you **post quests yourself**, set a norm, or start a schism.
- **Notoriety**: how far your name has spread, by rumour. Wanted posters with your name come from the simulation, not
  a script.

## Talking to NPCs

Talk is a menu of **verbs**, not dialogue trees: Greet, Ask about (place, gnome, price, herd), Trade, Offer help,
Ask for help, Recruit, Join, Threaten, Rob, Share food, Warn. Each verb moves the ledger. The NPC's answer is
generated from their traits and memory with lines from a phrase bank (written to the lore house style: dry, plain).

## Long goals

What a player (or a group) can work toward over a whole Chronicle. Each is a chain of simulated quests plus world
changes the sim tracks, and each changes the world for everyone.

| Goal | What it takes | What changes |
|---|---|---|
| **A homestead** | walls, a roof route you can pull up, 4+ garden beds, a rain catcher, dependants | you become a "settlement" to the sim: NPCs come to trade, ask to join, or raid |
| **Found a faction** | 9+ members (NPCs or players), a norm set, a haven site | a new faction on the map with your name and rules |
| **Cleanse the Pile** | fuel, many hands, the Kiln Sisters' blessing, a season of fighting | the Gnome Garden's `NEST` is gone; the horde field loses its biggest source |
| **The cure** | work with the Kiln Sisters: samples from each infection stage, glaze recipes, books from the Vestry | stage 2 infection becomes curable more often for everyone (a world rule changes) |
| **Open the Great Crypt** | keys, the catacomb route, a crew | the richest relic room; whoever holds it now holds the trade |
| **Clear the Compost** | the best soil on the map, held by the Greybearded and the warmest nest | a farming district for the Settle era |
| **Relight Lantern Night** | the grave lanterns of the Old Rows, the Sexton's line, a peace between 3+ factions | a yearly truce event that the chronicle remembers |
| **The Lantern Peace** | one polity ruling 40%+ of the havens (by force or by treaty) | a named era; quests turn from survival to holding it together |

## Hand-written storylets (sparse)

A few hand-written storylets give the world a voice. They only fire when the world state fits, and they never
override the simulation. Examples:

- **The Last Sexton** (needs: the Lantern Keepers exist and their founder is alive). Sexton Yarrow Gravelpot asks you
  to relight the grave lanterns along the Old Rows, because "the Hatless don't like a lit path". Do they? The quest
  lets the player find out, and the Keepers' belief changes their norms either way.
- **Seeds for the Spring** (needs: winter, a settlement with gardens and low seed stock). A farmer has heard that the
  Crypt Holders hoard clover seed. Buy it, steal it, or talk the Holders into trading.
- **The Greybearded Walk** (needs: the Greybearded exist, the player's standing with them ≥ 20). They take you through
  a herd unharmed, once. What they do differently is a loose thread.
- **Who Rang the Horn?** (needs: a herd was steered into a settlement in the last 3 days). Survivors want the gnome who
  did it. The simulation knows who it was. It might have been you.
- **The Mower Rumbles** (needs: the Mowing is about to come). Strange rumbling; every faction in that district has a
  plan; whoever learns it first can sell the warning.
