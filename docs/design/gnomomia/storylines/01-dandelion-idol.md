# The Dandelion Idol

**Zone:** Mossbottom Vale · **Levels:** 3-6 · **Quests:** 4 · **Leans toward:** Let it grow
**Unlocks after:** Chapter 1, after the side quest *The Feral Totem* · **Ties to main story:** Shows the Ferals from the inside and plants the bareheaded raiders of Chapter 5's *The Mill Raid*.

## Pitch
The Feral Totem stops being a loot drop. Its owner is Chicory Dibble, a feral gnome who wants back into the garden, and he asks Mossbottom to let him up to the well. The player carries the Idol between the camp and the village, and decides whether the Ferals get a door or a fence. It is worth doing because the Ferals get a face before they become the raiders the player fights in Chapter 5.

## Roots in the three layers
- **Planting (3,000 years):** The songs say that when the Hand let go of the Rope, the clocks went to seed. A dandelion clock is the only Tall One sowing that came back on its own, and every harvest song counts its seeds. Feral gnomes sing the same verse with the last line changed.
- **Charters (300 years):** After the Dandelion Schism (305 years ago), the Crown's tending laws made dandelions a tithe offence on Charter land. The exiled Wildlings carved the first dandelion idols in the Hedgewood, and the Feral Totem is one of them.
- **Rumbling (30 years ago):** After the King's Fall, Mother Burdock threw out the Wildlings who had started raiding Hedgewright camps. In the first hungry winter the Ferals sold their hats for bread. Nine years ago Chicory's son Burr was shattered when a felled trunk came down on a raid.

## People
| Name | New or existing | Role | Want | Secret / wound |
|---|---|---|---|---|
| **Chicory Dibble** | New | Unofficial elder of the Feral Camp, ex-Wildling | A place at the well, and to be called a neighbour | Led the raids after Burr was shattered, and still has the pot Burr made. |
| **Captain Pip** | Existing | Mossbottom guard | To be taken seriously by the Keep | Wrote the Keep about the camp in spring and got no reply. A feral clubbed him in *Feral Trouble*, and he has never forgiven the camp for it. |
| **Elder Fernwick** | Existing | Village elder | Mossbottom to stay small and quiet | Thinks the camp is a warning. His knees think otherwise. |
| **Mother Burdock** | Existing (lines only) | Wildling chieftain | Exiles stay out of the Hedge | Her exile took the Ferals' hedge and left them the clock. |

## Quest chain
| # | Quest | Giver | Objectives (typed, in order) | Reward (XP tier, gold, items) |
|---|---|---|---|---|
| 1 | **Not Ours to Steal** (extends *The Feral Totem*) | Pip | talk Pip → reach Feral Camp → talk Chicory Dibble | side. 40 g, 2 red potions |
| 2 | **Stamped Logs** | Chicory | reach Beetle Barrows → interact 3 stamped logs → talk Chicory | side. 60 g, Bark vest |
| 3 | **Who Comes Up the Path** | Pip | talk Pip → escort Chicory from Feral Camp to the well (fail if he cracks) → choice at the well (Fernwick present) → talk Chicory | main. 150 g, **Dandelion Clock** |
| 4a | **The Clock Runs Down** (if `feral=let_in`) | Fernwick | defend the well 60 s, 2 waves (camp ferals and one brute come for the Idol) → talk Pip | main. 200 g |
| 4b | **The Clock Runs Down** (if `feral=turned_away`) | Chicory (at camp) | reach Feral Camp → interact the dandelion stake → talk Chicory (he takes the Idol back) | main. 120 g |

Quest 1 leaves *The Feral Totem* as it is. The totem stays with Pip as evidence after that quest. Quest 3 is the only place the player can choose. Quest 4 is the same story after a different choice, so it counts as one quest.

## Key scenes and dialogue
1. **The hut, after *The Feral Totem*.** Pip: "Whose totem? Don't say the Wildlings. Wildlings don't steal, so somebody's lying, and it's the camp's job to say who."
2. **The camp, at the stake.** Chicory: "We didn't steal it. She kept the hedge and sent us out with the clock. We're still telling the time."
3. **Beetle Barrows, at the logs.** Chicory: "Every log in these mounds has the Clippings sawpit stamp. Cut in the hedge, milled at the Sawdust Mill, and the rot comes back here for the beetles. Mind the mill, friend."
4. **The well, at the choice.** Fernwick: "My knees say let him up. My knees have said a lot this month." Pip: "He's a feral, Elder." Chicory: "Burr was my son. I'd like to be somebody's neighbour when I say so."
5. **The well, after Quest 4a (or the camp, after 4b).** Chicory: "Ferals don't wear hats. We sold ours for bread. Bareheaded is what hungry looks like, not what a Wildling looks like. Keep that in mind at the mill."

## Choices and flags
| Choice (Quest 3) | Flag | What it changes |
|---|---|---|
| **Let him up to the well** | `feral=let_in` | Chicory stays at the well as a resident (no new services). Pip's greeting moves from "Halt" to "Morning, Chicory". Camp ferals spawn passive except brutes. Quest 4 becomes 4a. In Chapter 5, the *Mill Raid* survivor names Chicory and points to his camp. |
| **Send him back to the camp** | `feral=turned_away` | Chicory walks back. Pip keeps the Idol. Quest 4 becomes 4b. In Chapter 5, *The Mill Raid* has one extra wave, and the survivor says the raiders came because "the gate shut on us". Burdock's lines in *Neutral Ground* mention a Mossbottom gate that shut. |

## New content
### Enemies
None new. Quest 4a uses the existing Feral gnome (L3) and Feral brute (L4, elite).

### Items
| Name | ilvl | Slot | Type | Rarity | Effect / flavour |
|---|---|---|---|---|---|
| Dandelion Clock | 4 | trinket | charm | Sprouted (+1 attribute line) | A dandelion seed-head in privet wire. "Blow it and count the seeds. The count was never wrong, Chicory says, only late." |

### Places
- **Dandelion stake** (Feral Camp, east side, interact ×1): the camp's marker for the Idol. Quest 4b uses it.
- **Stamped logs** (Beetle Barrows, three mounds, interact ×3): the Clippings sawpit stamp on rotten wood. Quest 2 uses them.
- **The well** (Mossbottom, existing Glaze Shrine): the choice in Quest 3 and the defence in Quest 4a happen here.

## The sad note
Chicory's son Burr was shattered nine years ago, when a felled trunk came down on a raid on a Hedgewright camp. Chicory led the raids afterwards, and he doesn't pretend he didn't. Burr's pot hangs on a hook by the camp fire. It has three glue lines, and Chicory has not glazed over the last one. He is not asking for forgiveness. He wants a well where he can say Burr's name without the camp hearing it as a battle cry.

## New canon
- Chicory Dibble is an ex-Wildling gnome, exiled by Mother Burdock after the King's Fall, and the unofficial elder of the Feral Camp.
- Burr Dibble, Chicory's son, was shattered nine years ago on a raid on a Hedgewright camp.
- The Feral Totem is a dandelion idol of clay and privet wire, carved by the Wildlings after the Dandelion Schism and taken into exile by the Ferals.
- Planting song: "When the Hand let go of the Rope, the clocks went to seed."
- The Crown's tending laws make dandelions a tithe offence on Charter land (from the Schism onward).
- Ferals sold their hats for bread in the first hungry winter after exile. Bareheaded gnomes are not proof of Wildling blood.
- Logs in Beetle Barrows carry the Clippings sawpit stamp. They are cut in the Hedgewood and milled at the Sawdust Mill.
- With `feral=turned_away`, the Mill Raid in Chapter 5 gains one wave, and a Mossbottom gate is cited as a grievance.

## Lore checklist
1. **Garden object, gnome name?** Yes. A dandelion clock, a stake, a stamped log. Chicory Dibble: a plant name and a tool surname.
2. **Two time layers?** Yes, all three: Planting (the clock song), Charters (the Schism and the tithe), Rumbling (the exile and Burr).
3. **Naming rule, one pun at most?** Yes, with zero puns.
4. **Every creature wants something?** The camp ferals want the Idol back, because it is the last Wildling thing they have. Chicory wants a neighbour's welcome.
5. **Which idea does it lean toward?** Let it grow: Chicory's answer, and the player's choice to open the well.
6. **Did it give away a loose thread?** No. The stamped logs point at the Sawdust Mill and the Feral raids, not at who started them.
