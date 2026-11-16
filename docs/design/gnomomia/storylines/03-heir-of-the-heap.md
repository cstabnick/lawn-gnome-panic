# Heir of the Heap

**Zone:** Thatchford Downs · **Levels:** 9-11 · **Quests:** 5 (quests 4 and 5 each have a truce and a war version) · **Leans toward:** Tend it
**Unlocks after:** Chapter 2, "The Heap" (kill Rotgut) · **Ties to main story:** Rotgut's throne is empty, and the fight for it spills into the Thatchford cellars, the "carts" trouble the Reeve refuses to hear in "Word to the Reeve."

## Pitch
Rotgut is dead, and the Compost Heap's rats have two claimants for his peel-throne: old Dock Crumbtin, who wants a kingdom that feeds itself, and Gristle, who wants the warm cellars under Thatchford. Their quarrel is already leaking up through the drains. The player feeds the rats, hears both heirs out, and backs one. Dock buys a truce, with the town's bins going to the Heap and the cellars kept shut. Gristle buys a war, and the player has to hold the cellar hatch against it.

## Roots in the three layers
- **Planting (3,000 years):** A harvest song says the Gardeners built a pile to feed the lawn and left a dish of peel beside it, and the rats got there first. Half the verses say they were thanked, and half say they were chased off.
- **Charters (300 years):** Thatchford's market law, made when the town was founded 290 years ago, sends all peel and waste to the Heap, which turns it to soil for the Downs. The town made the Heap its bin, and the rats became its tenants without anyone signing for them.
- **Rumbling (30 years):** The spring after the Backflow, the Spinning Fountains' wild pressure filled the Heap's low tunnels. Dock's litter drowned in them. Every spring since, the floods have pushed rats up into the cellars.

## People
| Name | New or existing | Role | Want | Secret / wound |
|---|---|---|---|---|
| **Dock Crumbtin** | New | Old rat, Rotgut's aunt, the Heap's dowager and the sensible heir | A heap that feeds itself and doesn't drown | Her litter drowned in the spring flood after the Backflow. She keeps a scratch-count of the nests the floods have taken. Nobody has asked to see it. |
| **Gristle** | New | Rotgut's nephew, the rival heir, leader of the cellar raiders | A dry cellar with a lock on the door | Rotgut kept him at the foot of the peel-throne for eleven years and called him "the spare." |
| **Reeve Yarrow Burlap** | Existing | Town leader | The rats gone, cheaply | Burning the Heap is cheaper than bins, so he wants it burned. Owes the Chancellor money (existing). |
| **Dill Puddleby** | Existing | Innkeeper of the Tipsy Toadstool | Rats out of his cellar | Has been paying cheese rent to Gristle's raiders for a month and hasn't told the Reeve. |

## Quest chain
| # | Quest | Giver | Objectives (typed, in order) | Reward (XP tier, gold, items) |
|---|---|---|---|---|
| 1 | **Cellar Dwellers** | Dill Puddleby | talk Dill → reach Thatchford cellars → kill 4 cellar rats → talk Dill | side; 40 g, 2 red potions |
| 2 | **Heir Apparent** | Dock Crumbtin (her note appears on the Board once Rotgut is dead) | reach the Compost Heap → talk Dock → collect 6 fresh peelings (from the Thatchford bins) → talk Dock | side; 60 g, Bin Lid |
| 3 | **The Peel Throne** (choice) | Gristle and Dock, at the throne | reach the Peel Throne → talk Gristle → talk Dock → choice: *Back Dock Crumbtin* or *Back Gristle* | main; 150 g. Truce: Dock's Peel-Cloak. War: Gristle's Cheese-Chain. |
| 4a | **Bins for the Heap** (truce) | Reeve Burlap | talk Burlap → interact 4 Thatchford bins → talk Dock | main; 80 g |
| 4b | **Hold the Cellar Hatch** (war) | Reeve Burlap | defend the Tipsy Toadstool cellar hatch, 60 s, 3 waves of cellar rats → talk Burlap | main; 80 g |
| 5a | **The Last Heir** (truce) | Dock Crumbtin | reach the Peel Throne → kill Gristle, Rat Heir → talk Dock | finale; 200 g, Crumbtin's Ladle |
| 5b | **Dock Goes South** (war) | Dock Crumbtin | escort Dock from the Peel Throne to the Heap sluice (cellar rats on the route) → talk Dock | finale; 200 g, Crumbtin's Ladle |

**Side quests**
- **Cheese Rent**: Dill's ledger lists every cheese the raiders took. Interact it and bring the list to the Reeve for a 25 g fee. Burlap pays it in complaints.
- **Dock's Count**: interact the nest-scratches in the Heap's back cave. No reward. It is the point.

## Key scenes and dialogue
1. **The cellar (Dill).** "They've been in my cellar a month, and now they're charging me rent."
2. **The Heap (Dock).** "We're not a kingdom. We're a compost heap that got ideas. Gristle wants a cellar. I want a pile that feeds the lawn and doesn't drown."
3. **The throne (Gristle).** "Rotgut had a throne. I had a bin, and he kept the lid on."
4. **The Reeve (Burlap).** "Rats in the cellars? Burn the Heap. Cheapest bin I ever sold."
5. **The sluice (Dock, war route).** "Keep the bins open, Gnome. Somebody has to eat what you don't."

## Choices and flags
- **Quest 3 choice** sets flag `heap`:
  - `heap=truce` (*Back Dock Crumbtin*): the Heap keeps the Thatchford bins in return for the cellars staying shut. Gristle's raiders stay hostile until quest 5a. Burlap grumbles and pays the bin shares. At the Battle of the Verge, Dock's diggers join (see New content).
  - `heap=war` (*Back Gristle*): Gristle takes the throne and sends his raiders up the drains into the cellars. Thatchford holds the hatch (quest 4b), and Dock is driven out of the Heap (quest 5b). At the Battle, no Heap rats come. Thatchford's bins get a lid, and the Heap smokes thinner.
- No other choices in this storyline.

## New content
### Enemies
| Name | Lvl | Rank | Family | Wants | Notes |
|---|---|---|---|---|---|
| Cellar rat | 10 | N | Furred | Warm cellars and cheese larders | Packs of 3, come up the Heap's drains. Rat tail (bounty). |
| Gristle, Rat Heir | 11 | MB | Furred | A dry cellar with a lock on the door | **Rat Pack** (summons 2 cellar rats), **Cheese Snare** (sticky pool, Slow), **Shove** (knockback). Death line: *"Warm cellar. Shame."* Quest 5a only. |

### Items
| Name | ilvl | Slot | Type | Rarity | Effect / flavour |
|---|---|---|---|---|---|
| Fresh peelings | 1 | quest | quest | Plain | Kitchen waste, still fresh. Dock's litter eats it first. |
| Bin Lid | 10 | offhand | shield | Sprouted | A Thatchford dustbin lid, scrubbed. Blocks well and smells of it. |
| Dock's Peel-Cloak | 10 | body | leather | Blooming | Sacking stitched by rats and stink-proofed. +Endurance, +Ward vs Rain %. "Keeps the damp out. That's all it's for." |
| Gristle's Cheese-Chain | 11 | trinket | – | Blooming | A string of cheese rinds, still good. +move speed %, +Strength. "He hoards it. He'll sell you a bit." |
| Crumbtin's Ladle | 11 | weapon, 1-hand | Crush | Blooming | Dock's soup ladle, dented. Cracks shells as well as soup. |

### Places
- **Thatchford cellars** (levels 9-10): under the Tipsy Toadstool and the General's back rooms, reached by the Tipsy Toadstool's cellar hatch in town. Quests 1 and 4b.
- **Thatchford bins** (interactables): four waste bins behind the General, the Tipsy Toadstool, the mill and the guildhall. Quests 2 and 4a.
- **The Peel Throne** (level 11): the top of the Compost Heap, a mound of peelings with Rotgut's old seat on it. Quests 3, 5a and 5b.
- **The Heap sluice** (level 11): a wooden gate on the Hose side of the Heap rim. Escort end for quest 5b.
- **Dock's back cave** (level 10): the nest-cave behind the Peel Throne, with the scratch-count on its wall.

## The sad note
Dock's litter drowned in the spring flood, and she keeps a count of the nests the floods have taken, one scratch per nest, with a gap where her own litter goes. It is the same kind of tally as Rye Grindwell's tremors, and nobody in Thatchford has asked to read hers. Neither ending mends it. She says so once, flatly, and then goes back to counting.

## New canon
- Thatchford's market law, made 290 years ago, sends all peel and waste to the Compost Heap.
- The Heap's low tunnels flood every spring since the Backflow, pushing rats up into the cellars.
- Dock Crumbtin is Rotgut's aunt and the Heap's dowager. Her litter drowned the spring after the Backflow. She keeps a scratch-count of lost nests.
- Gristle is Rotgut's nephew, called "the spare" by Rotgut. He leads the cellar raiders.
- Thatchford cellars lie under the Tipsy Toadstool and the General. Dill Puddleby has paid cheese rent to Gristle's raiders for a month.
- The Peel Throne, the Heap sluice and Dock's back cave are sub-areas of the Compost Heap.
- Battle of the Verge (new ally row, Ch 8): **Heap diggers** (Dock Crumbtin), joins if `heap=truce`. They clear the debris ramp in phase 2 ten seconds sooner. Not in the war route.
- Epilogue beat: truce, the Thatchford bins feed the Heap again. War, Dock lives in the Hose banks and the Heap stays under a lid.

## Lore checklist
1. Garden object at gnome scale: yes. The Compost Heap is a real compost heap, and gnomes named it right. The "throne" is a pile of peel.
2. Two or more layers: yes, Planting (the song), Charters (the market law) and Rumbling (the Backflow flood).
3. Naming: Dock Crumbtin (plant first name, household surname). Gristle is a grubby beast name. Places are plain: Peel Throne, Heap sluice, bins. No puns.
4. What it wants: the rats want food and a home. Gristle wants a dry cellar, and Dock wants a heap that doesn't drown.
5. Lean: Tend it. The truce keeps the waste cycle and the balance. The war route is the cut-it-all answer (burn it, lid it, clear it).
6. Loose threads: none answered. The Heap's history is only hinted at.
