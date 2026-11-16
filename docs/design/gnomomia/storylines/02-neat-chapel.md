# The Even Lawn

**Zone:** Thatchford Downs · **Levels:** 7-11 · **Quests:** 5 · **Leans toward:** Cut it all
**Unlocks after:** Chapter 2, "The Calling" (class chosen), and "Brother Sedge's Pamphlets" (either flag) · **Ties to main story:** Plants the level-cut hat brims and the bareheaded walk that Chapter 7's "No Hats" pays off, without answering who ambushed the King.

## Pitch
The Neat Chapel is the only patch of Thatchford where the grass is perfect, and the only place where the gnomes are kind about it. The player walks its stone path, reads the wall of lost names and gets close to Brother Sedge, who has started counting blades at night. It is worth doing because it shows the "cut it all" belief from the inside: warm, reasonable and tidy, with the cracks visible to anyone who looks at the hat hooks.

## Roots in the three layers
- **Planting (3,000 years):** The Order sings the last verse of "The Long Lawn", the one about the Mowing, and calls the Turning Blade "the Level Hand". They take the cut lawn as a holy thing that saved gnomes from the wild. Other villages sing the same verse and think it's about hiding underground.
- **Charters (300 years):** The Order began as Groundskeepers who blamed the Dry Summer on uneven grass (the Dandelion Schism, about 305 years ago). The Crown tolerates them as cranks. The Neat Chapel is their oldest building in Thatchford.
- **Rumbling (30 years):** The Order doubled after the First Rumble. The forty Pipewrights lost in the Backflow are listed on the chapel wall and read aloud every night. The Order also keeps the day of the Sorrow, the King's Fall, as a bareheaded walk on the Shorn, and does not explain it to outsiders.

## People
| Name | New or existing | Role | Want | Secret / wound |
|---|---|---|---|---|
| **Brother Sedge** | Existing | Even Cut preacher at the Neat Chapel | Converts, and a lawn he can trust | Reports every visitor to High Edger Sedgewick. Has started counting blades at night, and doesn't like the number. He has been told the Sorrow was a Wildling raid and has never asked who walked bareheaded. |
| **High Edger Sedgewick** | Existing (offstage) | Even Cut leader | The Mower freed | Only his pamphlet signature appears here. |
| **Verger Plantain Pail** | New | Chapel verger: keeps the door, the hooks and the wall | Rules kept exactly | Was told once why hats are banned, and told never to ask again. He is the strictest gnome in the chapel for that reason. |
| **Chickweed Mattock** | New | Former mill laundress; Order member for nine years | To hear her husband's name said properly | Hob Mattock was one of the forty lost in the Backflow. She has his tag and no grave. |
| **Sprig Lintel** | New | Youngest apprentice at the chapel | A hat of her own | Has been sneaking a cap from the hooks to play Edger on the path. |

## Quest chain
| # | Quest | Giver | Objectives (typed, in order) | Reward (XP tier, gold, items) |
|---|---|---|---|---|
| 1 | Keep Off the Grass (lvl 7) | Brother Sedge | reach the Neat Chapel → interact 4 path-stones → talk Brother Sedge | side, 40 g, Verger's Hand Shears |
| 2 | The Names at Evening (lvl 8) | Verger Pail | interact 3 name-plates on the Wall of the Forty → talk Verger Pail | side, 40 g |
| 3 | Hob's Tag (lvl 9) | Chickweed Mattock | kill 4 magpie thieves on Crowfoot Hill → collect 2 Pipewright Name-Tags → talk Chickweed | side, 60 g, Hob's Pipe-Key |
| 4 | Flat Brims (lvl 10) | Sprig Lintel | reach the Neat Chapel hooks → interact 3 hat-hooks → choice (`brims`) → talk Sprig | side, 40 g (asked) or Level Brim (kept) |
| 5 | The Long Bank (lvl 11) | Brother Sedge | escort Brother Sedge to the Long Bank → reach the Long Bank → choice (`sedge_doubt`) → talk Brother Sedge | side, 80 g, Reed Charm |

## Key scenes and dialogue
1. **The gate.** Verger Pail stops the player at the path. "Path only, friend. The lawn is for looking at. Cut one blade and you'll learn what *trimmed* means. Ha. Mind the stones."
2. **The wall.** Chickweed reads the names with her finger. "The Order reads them every night, so nobody's forgotten. Even the ones nobody found."
3. **The hooks.** Sprig is holding a cap with a brim trimmed flat as a tabletop. "Nobody here wears a hat. Brother says a hat is a little roof on something that ought to be level." Sedge, later: "We come bare-headed to the Level, as the sky does. On the day of the Sorrow we walk the Shorn that way. We don't explain it to the Crown."
4. **The Long Bank.** Sedge stands in the reeds, which are taller than he is. "I have never seen it unmown. Nothing has come to cut it. We were told the Level would not hate us."
5. **Hob's tag.** Chickweed turns the brass over. "They said the Pipewrights stayed below. I have his tag. I have his name, read out every night. That's all I've got."

## Choices and flags
| Flag | Set by | Values | What it changes |
|---|---|---|---|
| `sedge` (existing) | "Brother Sedge's Pamphlets" | `trusted` / `wary` | Read only. Wary Sedge gives shorter answers in quests 1 and 5 and asks what the player has read. Both values finish every quest. |
| `brims` | Quest 4 choice: *Ask Sedge why the brims are flat* / *Take one brim from the hook* | `asked` / `kept` | `asked`: Sedge explains the bareheaded rule and the player gets 40 g. `kept`: Sprig covers for the player and the player gets a Level Brim. At the Verge (Chapter 7), a kept brim lets Ironsod say "cut like the ones on the Shorn." This is a flavour line only. The steps of "No Hats" do not change. |
| `sedge_doubt` | Quest 5 choice: *Tell him the reeds are alive* / *Tell him the Order is right* | `told` / `kept` | `told`: Sedge admits he counts the blades, and the player gets the Reed Charm. If Sedge defects in Chapter 7, he adds one line: "You were the one who said the reeds were alive." `kept`: Sedge goes back to the pulpit and nothing else changes. |

## New content
### Enemies
| Name | Lvl | Rank | Family | Wants | Notes |
|---|---|---|---|---|---|
| Lawn Warden | 9 | N | Fired clay | Every blade the same height | Spawns only when a blade inside the Neat Chapel lawn is cut. Chases the cutter back to the path and stops there. It is the joke made dangerous. |

### Items
| Name | ilvl | Slot | Type | Rarity | Effect / flavour |
|---|---|---|---|---|---|
| Verger's Hand Shears | 9 | weapon (1-hand) | Slash | Sprouted | Kept sharp and never used on grass. +5% crit vs Plant. |
| Hob's Pipe-Key | 10 | trinket | Trinket | Sprouted | Brass, bright, and still fits a Deeps valve. +1 Rain ward. |
| Level Brim | 10 | head | Helm | Sprouted | An Edger's cap brim trimmed flat enough to stand a cup on. +1 Bloom ward. |
| Reed Charm | 11 | trinket | Trinket | Sprouted | A Long Bank reed bound with string. +2 Rain ward near water. |
| Pipewright Name-Tag | 8 | none (quest item) | Quest | Plain | A brass tag stamped with a lost Pipewright's name. Used only for "Hob's Tag". |

### Places
- **Neat Chapel** (east bank, past the mill, reached by a path off the Compost Heap side road). A brick-edged lawn with a glass-lidded cold frame at its head, which gnomes call the Sky Window. Interactables: 9 path-stones (4 are needed for quest 1), the Wall of the Forty (3 plates for quest 2), three hat-hooks by the door (quest 4), a collection box (flavour), and the lawn itself (cutting it calls a Lawn Warden).
- **The Long Bank** (north of the chapel, along the Hose). Uncut reeds taller than a gnome, with water beetles and leeches. The only wild ground in the zone. Reached by the Hose path. Reed clumps can be interacted for the Reed Charm.

## The sad note
Chickweed Mattock has spent nine years in a room where her husband's name is said every night, and she has never been told where his body lies. The Pipewrights stayed below when the water came up through the Deeps, and nobody has brought their tools up. She does not blame the Order for this. She joined it because it is the one place that says his name out loud, and she says so plainly, without asking the player to fix it.

## New canon
- The Neat Chapel is a cold frame on Thatchford's east bank, with a glass lid called the Sky Window and a brick-edged lawn.
- The chapel forbids hats inside. Members enter bare-headed.
- Edger-Knights wear level-brimmed caps on patrol. Their spare caps hang on the chapel hooks.
- Once a year, on the day of the Sorrow, the Order walks the Shorn bareheaded. The Order does not explain this to outsiders.
- The Wall of the Forty in the chapel lists the forty lost Pipewrights of the Backflow. The Order reads the names every night.
- Hob Mattock was one of the forty. His Pipewright Name-Tag and Hob's Pipe-Key are the only known pieces of him above ground.
- Verger Plantain Pail, Chickweed Mattock and Sprig Lintel are new Thatchford residents of the Order.
- The Long Bank: uncut reeds north of the chapel, along the Hose.
- Lawn Warden: a Thatchford-level Even Cut guardian that appears only if the chapel lawn is cut.

## Lore checklist
1. **Garden object at gnome scale?** Yes. The chapel is a cold frame, and "Sky Window" is what a gnome would call its glass lid. "Neat Chapel" is a name a gnome would give it.
2. **Two time layers?** Yes: the Charters (the Dandelion Schism) and the Rumbling (the Sorrow, the Backflow names).
3. **Naming rule?** Yes. Plantain (plant) with Pail, Mattock and Lintel (household and tool surnames). No pun.
4. **What do the pests want?** The Lawn Warden wants every blade the same height. The magpie thieves want shiny things, as before.
5. **Which idea?** Cut it all.
6. **Loose thread given away?** No. The hats and the bareheaded walk are hints. Who ambushed the King is not answered here, and Sedge has not been told.
