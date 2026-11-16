# What Outside Smells Like

**Zone:** Birdbath Keep, with a day trip to Sodbury (Cloverfield) · **Levels:** 12-16 · **Quests:** 7 · **Leans toward:** Tend it
**Unlocks after:** Chapter 3 finale, "What the Ledger Says" · **Ties to main story:** Marigold has seen the carts and hands the Ledger means before she arrives at the Verge in Chapter 7.

## Pitch
Queen Marigold has never left the Keep since her father died, and every visitor hears the same question: what does outside smell like? The player and Robin-Master Wren Tumble take her out for one day, by robin to Sodbury, through a ranch road where Keep pikemen are sent after them, and to a dusk choice about whether she goes home on time. It is worth doing because it is the first time the Queen meets the people her charters feed, and the player watches her decide what kind of queen to be.

## Roots in the three layers
- **Planting (3,000 years):** Gnorwin's Charge, *"Keep the lawn,"* is the line Marigold reads at night in the legends. The Last Mowing flattened the plains, so Cloverfield is the only flat land in Fescue, and its horizon is the first thing she has ever seen that goes on for a long way.
- **Charters (300 years):** The Charter of Root and Seed made Cloverfield the Crown's breadbasket under the Fieldwardens, with a tithe to the Keep. Marigold has only ever seen the tithe arrive as a column of numbers.
- **Rumbling (30 years):** The Quiet Years emptied Sodbury's farms. Potsworth sends the pikemen because farmers talk about the Rumble, and he does not want the Queen to hear it from them.

## People
| Name | New or existing | Role | Want | Secret / wound |
|---|---|---|---|---|
| **Queen Marigold Clayfoot** | existing | Monarch, 38 | To see her kingdom and be a queen who knows it | Crowned at eight. Reads Gnorwin's legends and believes every word. The Keep has been her whole life. |
| **Robin-Master Wren Tumble** | existing | Keeper of the Royal Robins | Her birds not used for war | Née Haybale. Left Sodbury for the Keep and has never written home. Says nothing about it on the flight. |
| **Ma Honeydew Haybale** | existing | Honeydew Ranch, Fieldwarden elder | Her children back | Does not know where Wren is. Hears a whistle from the sky that she half-recognises. |
| **Lord Chancellor Wendel Potsworth** | existing | Regent in all but name | The Queen kept inside the Keep | Sends the pikemen. Fears what the Queen will hear on the farms. |
| **Sergeant Bugle Hobnail** | new | Keep pikeman sergeant, leads the chase | Get the Queen home without a cracked gnome | Grew up in Sodbury and left in the Quiet Years. Sends money home every quarter with no note. |
| **Samphire Hobnail** | new | Bugle's father, east lane, Sodbury | His son to write | Still lives in the old cottage, the one whose garden grows nothing. |
| **Teacher Sage Rakehandle** | new | Sodbury schoolmistress | More pupils | Taught Bugle to read. He never wrote back, same as the others. |

## Quest chain
| # | Quest | Giver | Objectives (typed, in order) | Reward (XP tier, gold, items) |
|---|---|---|---|---|
| 1 | **Does It Smell of Honey?** (side) | Queen Marigold (Basin rim) | talk Marigold → reach Robin Roost → talk Wren | side, 40 g |
| 2 | **A Robin Is Not a Horse** (main) | Wren Tumble | talk Wren → interact Robin Roost (one-time flight) → reach the Sodbury Granary Tower | main, 80 g |
| 3 | **Pikemen on the Snail Pens Road** (main) | Marigold (Sodbury) | reach Honeydew Ranch → kill 6 Keep pikemen → escort Marigold to the Full Trough (fail if she cracks) | main, 150 g, 2 Honeydew flasks |
| 4 | **Home by Dusk** (main, **choice**) | Sergeant Hobnail | talk Hobnail → choice: *Take her home by dusk* (`queen_outside=home`) or *Let her stay one night* (`queen_outside=stayed`) | main, 100 g |
| 5 | **Dusk Bell** (side) | Teacher Rakehandle | reach the Sodbury schoolhouse → interact the bell → talk Rakehandle | side, 30 g |
| 6 | **The Quarterly** (side) | Bugle Hobnail | talk Bugle → reach the Hobnail cottage (east lane) → talk Samphire | side, 30 g |
| 7 | **What Outside Smells Like** (finale) | Queen Marigold (Basin) | talk Marigold → talk Wren | finale, 200 g, +1 skill point |

Quest 6 is optional and does not affect the choice. Quest 7 is the finale. Its +1 skill point is the standard finale reward from quests.md.

## Key scenes and dialogue
1. **The Basin rim.** Marigold, on the rim, watching robins: *"Tell me: does Cloverfield really smell of honey?"* Wren, flat: *"A robin is not a horse. A robin is a robin."* Marigold: *"I'm ordering it."*
2. **The granary tower, Sodbury.** Ma Haybale, sizing up the Queen: *"An aphid ain't smart, but it's loyal. More than I can say for some."* Then, to the sky, as Wren's robin circles: *"That whistle. My girl used to whistle like that."* Wren does not land.
3. **The Snail Pens road.** Sergeant Hobnail, pike lowered and not quite aimed: *"Your Majesty, you're not supposed to be out here."* Marigold: *"I know. That's why I came."*
4. **The schoolhouse, dusk.** Teacher Rakehandle, to an empty bench: *"One pupil today. I rang it anyway."* Marigold takes the rope and rings the bell herself, twice, and is slightly out of breath.
5. **The east lane.** Samphire Hobnail, at the gate: *"He sends money. No note. Every quarter, the same amount."* Bugle's name is never said aloud in this scene.
6. **Dusk.** Hobnail: *"The Chancellor will want you in the Basin, Majesty."* Marigold: *"Then tell him I saw the horizon."*

## Choices and flags
One `choice` objective (quest 4), flag `queen_outside`:

| Value | Set by | What it changes |
|---|---|---|
| `home` | *Take her home by dusk* | In the Keep, Potsworth summons Marigold to the counting room and asks what she saw. She says "carts." She is watched more closely, but Wren keeps flying. Chapter 7 arrival line adds: *"I smelled honey once, from the Basin rim. Now it's stubble and fear."* |
| `stayed` | *Let her stay one night* | She sees the flat fields go dark from the Full Trough porch: the horizon the Last Mowing made. Potsworth closes the Robin Roost to flights until the player finishes their next main-story quest, and Wren stays grounded until Marigold orders her up again. Chapter 7 arrival line adds: *"I slept in a hayloft. Stubble and fear, and I'd sleep there again."* |

Neither value changes `potsworth`, `ants`, `hedge`, `gleaner`, `sedge`, `mudtooth` or any Chapter 5-6 flag. The Queen's Judgement in Chapter 7 still depends only on `potsworth`. Finale line (quest 7) reads the Ledger's *"carts and hands enough"* as people, for either value.

## New content
### Enemies
| Name | Lvl | Rank | Family | Wants | Notes |
|---|---|---|---|---|---|
| Keep pikeman | 12-13 | N | Fired clay | To bring Her Majesty home by dusk, and not to be blamed for losing her. Orders come from the Chancellor. | Pike thrust (reach 2 m), Brace (halves damage for 2 s). Crush ×1.25. Appears only on the Snail Pens road during quest 3. |

### Items
None. Rewards use existing consumables (Honeydew flask).

### Places
- **Sodbury Granary Tower, robin perch** (new interactable): top of the stacked flowerpot tower on the north side of the wide street. Where the one-time flight lands. It is not a fast-travel stop.
- **Snail Pens road** (Cloverfield, level 12): the road between the Snail Pens and Honeydew Ranch, where the pikemen catch up.
- **Hobnail cottage** (new house, Sodbury east lane): the cottage with the empty garden. Interact the gate to talk to Samphire.
- **Sodbury schoolhouse bell** (existing sad-note location, new interactable): the rope by the door.

## The sad note
Bugle Hobnail grew up in Sodbury and left when the farms emptied. He sends money home every quarter, the same amount each time, and never writes. His father keeps the gate of the old cottage open in the afternoons and does not say what for. Bugle is the pikeman who has to bring the Queen back, and he knows the way home because he was born on it.

## New canon
- Queen Marigold leaves the Keep once, on a single day, by robin. The flight is a one-time story flight. It does not add a Sodbury fast-travel stop or change the Keep-to-Last-Tuft robin flight in Chapter 7.
- Potsworth sent Keep pikemen after the Queen. They are Keep soldiers, Fired clay, levels 12-13.
- Wren Tumble is née Haybale. Ma Haybale has not recognised her, and Wren has not told her. The Haybale Letters quest (Chapter 4) is not resolved here; this storyline only hints.
- Sergeant Bugle Hobnail, Samphire Hobnail (his father) and Teacher Sage Rakehandle are new Sodbury people. The Hobnail cottage is in Sodbury's east lane.
- Robin Roost is closed to flights after the `stayed` choice until the player finishes their next main-story quest, until Marigold orders Wren to fly again.
- Marigold has seen Cloverfield's horizon and Sodbury's farms before the Verge. Her Chapter 7 arrival adds one line based on `queen_outside`.

## Lore checklist
1. **Garden object at gnome scale?** Yes. The Robin Roost, the granary tower, the schoolhouse bell and the Snail Pens are all yard objects at gnome height, and the robin is a robin.
2. **Two time layers?** Yes. Planting (the Last Mowing's flat horizon, Gnorwin's Charge) and Charters (the Charter of Root and Seed, the tithe), with the Rumbling (the Quiet Years, Potsworth's fear) on top.
3. **Naming rule?** Yes. Hobnail, Rakehandle and Samphire are household, tool and plant names. Sodbury and Honeydew are existing.
4. **Does every creature want something?** Yes. The Keep pikemen want the Queen home by dusk and no blame.
5. **Which idea does it lean toward?** Tend it. Marigold chooses to know the cost of the tithe and the farms before she decides how to tend them, not to cut or let grow.
6. **Does it give away a loose thread?** No. It hints at Wren's past and at Potsworth's fear, and it does not say who the player is or where the Tall Ones went.
