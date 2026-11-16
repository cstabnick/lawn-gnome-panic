# The Damp

**Zone:** The Rockery · **Levels:** 20-24 · **Quests:** 5 · **Leans toward:** Let it grow
**Unlocks after:** Honest Words (Ch 6, needs flag `mudtooth=trust`) · **Ties to main story:** The Mudtooth deep way leads to an old Tall One pipe that feeds the same pressure the Keep uses, so the moles' water and the Verge's Valve are the same kind of problem.

## Pitch
The moles of the Mudtooth Deeps have been dry for 300 years, and the Pipewrights who dried them still draw water from under the Rockery. The player helps Dowager Mudtooth reopen a sealed branch of the Tall Ones' pipe and brokers the deal that decides who gets the water: the moles, or the Keep. Sharing it pays off at the Battle of the Verge, where the moles can dig under the Mower's wheels.

## Roots in the three layers
- **Planting (3,000 years):** The Tall Ones laid pipe under the Rockery as well as under the Hose. A verse of "The Long Lawn" that moles sing says *"the wet came up from under, and the little ones knew first."* The branch the player opens is one of those old pipes.
- **Charters (300 years):** In the Dry Summer, Pipewright survey crews came up the Hose and sank shafts through the Soakway, the moles' damp tunnels, looking for hidden water. They found the old branch, sealed it with Shard iron and left the moles on the dry side. The mole clans' grudge starts here.
- **Rumbling (30 years):** The mole clans have been fleeing the Mower's shudder since Grubthorn's time. The ground has been shaking every few nights, and the dry tunnels have been caving in. The Deeps under the Keep have leaked pressure since the Backflow, so the Pipewrights know exactly how much water they waste.

## People
| Name | New or existing | Role | Want | Secret / wound |
|---|---|---|---|---|
| **Dowager Mudtooth** | existing (Mudtooth Deeps) | Mole matriarch, Grubthorn's great-grandmother | The Soakway wet again, and the clan out of the shaking | Her mother walked her through the wet tunnels when she was a pup. She has spent three centuries trying to get back there, and she will not say so. |
| **Ida Gromwell** | existing (Keep) | Master Pipewright | No water goes anywhere she cannot see | Her father stayed at the Great Valve and never came back. She will not let the Pipewrights' water leave her sight again. |
| **Nettle** | existing (Thatchford) | Pipewright apprentice | Fix the Spinning Fountains | Ida has kept her off the Great Valve since she was glazed. Nettle is sure Ida is right, and it stings. |
| **Tunk** | new (Mudtooth Deeps) | Mole foreman, digs the clan's collapse-shoring | The clan safe | Dug the shoring for the last dry collapse, which buried two moles. He has not stopped apologising for it. |

## Quest chain
| # | Quest | Giver | Objectives (typed, in order) | Reward (XP tier, gold, items) |
|---|---|---|---|---|
| 1 | **Wet Ground** (Lv 20) | Dowager Mudtooth | talk Mudtooth → reach the Soakway → interact 3 dig-scars → talk Mudtooth | side, 50 g |
| 2 | **Nettle's Survey** (Lv 21) | Nettle (Thatchford; she meets you at the Flintdelve cart stop) | talk Nettle → escort Nettle to the Dry Hall → interact the branch-valve → talk Nettle | side, 80 g |
| 3 | **The Larder** (Lv 21) | Mudtooth | kill 6 Dry-root weevils → talk Mudtooth | side, 60 g, Mudtooth gloves (Sprouted) |
| 4 | **The Fifth** (Lv 22) | Mudtooth, with Nettle present | talk Mudtooth in the Dry Hall → choice: `damp` | side, 100 g |
| 5 | **Open the Branch** (Lv 23, only if `damp=shared`) | Nettle | defend the branch-valve, 60 s, 3 waves of Dry-root weevils (fail if the valve breaks) → interact the branch-valve → talk Mudtooth | side, 120 g, Soakway Ring (Sprouted) |

Quest 2's escort runs through the Shard Mine's lower gallery. If Nettle cracks, she is glued at the Shrine and the escort restarts from Flintdelve.

## Key scenes and dialogue
1. **The Dry Hall (quest 1).** Mudtooth to the player: *"The wet was here when my mother was a pup. Then your people came up the Hose with poles and sank shafts through it. Look at the scars and tell me they were looking for anything you'd call a friend."*
2. **The Cart stop (quest 2).** Nettle: *"Ida says the seal's Shard iron, both ways, and not one drop goes down it till the moles have seen the valve. Her words, not mine."*
3. **The escort (quest 2).** Tunk, at the Shard Mine's edge: *"Feel that? The floor's been doing that since the Mower woke. Don't ask me to stop digging."*
4. **The Fifth (quest 4).** Nettle: *"A fifth of what the Deeps lose anyway. The Keep won't miss it."* Mudtooth: *"A fifth. Your Keep has never once given us a fifth."*
5. **The valve opens (quest 5).** Tunk: *"It's wet, Dowager."* Mudtooth: *"I can hear it. Leave me the hearing."*

## Choices and flags
Quest 4 is a `choice` objective. Flag name: **`damp`**.

| Value | Option text | What it changes |
|---|---|---|
| `shared` | *"Share a fifth with the moles."* | Quest 5 is offered. The Soakway fills with water. In Thatchford, the Spinning Fountains burst about a third less often. At the Battle of the Verge, the Mole tunnellers ally joins (see below). |
| `kept` | *"The Keep keeps its water."* | Quest 5 is not offered, and the branch-valve stays shut. Mudtooth refuses further help from the Keep. Nettle says only *"Dry it is."* The Verge is unchanged. |

Deep moles stay neutral either way, because `mudtooth=trust` already set that.

**Proposed new ally row for the Battle of the Verge (quests.md, chapter 8 table, for the editor to check):**

| Ally | Joins if | In the battle |
|---|---|---|
| Mole tunnellers (Mudtooth) | `damp=shared` | Phase 2: the moles dig under the Mower's four wheels, so each wheel starts the phase at 50% HP. |

**Optional Verge payoff (proposed, Verge band):** a level 25 side quest, *Under the Wheels*, given at Last Tuft by Mudtooth (talk Mudtooth → interact the Mower's wheel-pits in phase 2 prep → talk Mudtooth). Only offered with `damp=shared`. Not counted in the 5 quests above.

## New content
### Enemies
| Name | Lvl | Rank | Family | Wants | Notes |
|---|---|---|---|---|---|
| Dry-root weevil | 21 | N | Shelled | The damp roots the moles store, which the dry ground has killed off | Packs of 3. Gnaws roots, Chipped bite. Crush works as for all Shelled. |

### Items
| Name | ilvl | Slot | Type | Rarity | Effect / flavour |
|---|---|---|---|---|---|
| Mudtooth gloves | 21 | hands | Leather | Sprouted | "Mole-hide, warm in wet ground. They still smell of the Soakway." +1 Agility line. |
| Soakway Ring | 22 | trinket | Ring | Sprouted | "Cut from an old Tall One pipe joint, and warm to the touch." +Ward vs Rain 5%. |

### Places
- **The Soakway:** the old damp tunnels, in the Mudtooth Deeps past the Honest Words chamber. Enemies here are level 20-22.
- **Dig-scars (3):** collapsed survey shafts along the Soakway's roof. Interactable, quest 1.
- **The Dry Hall:** the chamber where the Soakway meets the old pipe. Cracked mud floor, the clan's meeting place. The deal happens here.
- **Branch-valve:** a Tall One pipe-tap in the Dry Hall wall, sealed with Shard iron. Interactable in quest 2, defended in quest 5.

## The sad note
Dowager Mudtooth remembers the wet tunnels her mother walked her through. Nobody alive in the clan has seen them wet. When the Soakway finally runs, she does not go to look. She sits in the Dry Hall with her eyes shut and says she can hear it. Nobody asks her to come and see.

## New canon
- In the Dry Summer, Pipewright survey crews sank shafts through the Soakway, looking for hidden water in the Rockery.
- A sealed Tall One branch-pipe runs under the Rockery from the Dry Hall. The Pipewrights sealed it in the Dry Summer with a Shard-iron seal. This is not the Great Valve and not the Spigot.
- The Planting verse: *"the wet came up from under, and the little ones knew first."*
- Mole clans live for centuries. Dowager Mudtooth was a pup in the Dry Summer.
- The moles call the damp tunnels the **Soakway**, and the chamber on the old pipe the **Dry Hall**.
- Ida insists on Shard-iron seals for the branch, with no reason given.
- With `damp=shared`, the Spinning Fountains in Thatchford burst less often.
- The Mole tunnellers ally and the optional *Under the Wheels* quest, both proposals for the editor.

## Lore checklist
1. **Garden object at gnome scale?** Yes. A pipe-tap, a shaft in the mud, a collapsed tunnel. The gnome names are plain (Soakway, Dry Hall, branch-valve).
2. **Two time layers?** Yes: the Charters (the Dry Summer shafts) and the Planting (the old pipe and the verse). The Rumbling adds the shaking.
3. **Naming rule?** Yes. Tunk is a grubby mole name, Soakway and Dry Hall are plain, and there are no puns.
4. **What does the creature want?** The Dry-root weevil wants the moles' stored roots. The moles want the damp back.
5. **Which idea?** Let it grow. The moles want the wet ground back for the wild, and the Keep's choice is Tend it.
6. **Loose thread given away?** No. The branch is not the Spigot, and it does not say who turned the Dry Summer tap.
