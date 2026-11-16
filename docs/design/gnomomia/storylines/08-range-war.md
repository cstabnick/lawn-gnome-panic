# A Brand for Every Herd

**Zone:** Cloverfield · **Levels:** 12-16 · **Quests:** 6 · **Leans toward:** Tend it
**Unlocks after:** Antenna-Sister (main, Ch 4) · **Ties to main story:** Kree's Thousand and Ma Haybale's honeydew are the two supply lines the Ch 4 finale and the Battle of the Verge both lean on.

## Pitch
Aphids are vanishing from the Honeydew Ranch a few at a time, and the trail runs toward the Red Ants. The player follows the clues to the Pettigrew hayloft, where field mice are rustling herds, wearing stolen brand-chips, and planting ant mandibles to make the ants look guilty. Then the player has to decide whether the ranchers and the ants can drive the herd home together, or whether they hold the fence and keep glaring at each other while the thieves keep eating.

## Roots in the three layers
- **Planting (3,000 years):** The Long Lawn has a verse about the first aphids carried onto the grass "in a Tall One's cupped hand, to be milked", with the ants walking behind. Another version gives the herding to the gnomes. Every herder's grace starts "Keep the lawn, keep the herd", and both sides claim the words.
- **Charters (300 years):** The Charter of Root and Seed gave the Fieldwardens Cloverfield's honeydew and a tithe of a tenth to the Keep. The Pettigrew ranch was the first grant, and its barn still has the Charter's grain-mark carved over the door.
- **Rumbling (30 years):** The Quiet Years emptied the ranches. The Thousand moved onto Pettigrew pasture, and the Crown's tithe-carts took the field mice's granary. Last winter a litter of mice starved. The surviving mice took honeydew in return.

## People
| Name | New or existing | Role | Want | Secret / wound |
|---|---|---|---|---|
| Sheriff Timothy Fallow | existing | Law in Cloverfield | Aphids home, ants off the Pettigrew ranch | Half believes the ants did it. He would rather be wrong than face another winter with the ranch half empty. |
| Ma Honeydew Haybale | existing | Head of the biggest aphid ranch | Her herd back, her brand respected | Her ledger is 60 aphids short. She blames the ants first, because it is easier than blaming her own pickets. |
| Antenna-Sister Kree | existing | Voice of the Thousand | Shared pasture, her queen's last word kept | Under peace she is trusted and tired. Under war she is the last speaker left after Formica falls, and she can't look at a gnome without seeing the Anthill fight. |
| Darnel Pegg | new | Brand-carver, Sodbury | Brands that don't wash off in rain | Carved the old Haybale stamp, and sold a copy to whoever asked. The mice used it. |
| Gnawjaw, Hob of the Hayloft | new (enemy) | Mouse rustler, mini-boss | Food for his litter | His litter starved. He steals honeydew, and he wears a brand-chip on his collar like a medal. |

## Quest chain
| # | Quest | Giver | Objectives (typed, in order) | Reward (XP tier, gold, items) |
|---|---|---|---|---|
| 1 | **Gaps in the Pickets** | Sheriff Fallow | `talk` Fallow · `reach` Honeydew Ranch north pasture · `interact` 3 pulled pickets | side, 40 gold |
| 2 | **Clay Brands** | Ma Haybale | `talk` Haybale · `collect` 4 Haybale brand-chips (dropped by field mice, Honeydew Ranch) · `talk` Haybale | side, 60 gold, Darnel Pegg's name |
| 3 | **Mandibles in the Hay** | Kree (peace) / Fallow (war) | Peace: `talk` Kree · `reach` Pettigrew hayloft · `collect` 3 soldier mandibles · `talk` Kree. War: `talk` Fallow · `reach` Pettigrew hayloft · `collect` 3 soldier mandibles · `talk` Fallow. | side, 60 gold |
| 4 | **Gnawjaw's Hayloft** | Sheriff Fallow | `reach` Pettigrew hayloft · `kill` 6 hayloft mice · `kill` Gnawjaw (mini-boss; he flees at 25% through the floor, and the quest moves on either way) | side, 90 gold |
| 5 | **The Roundup** | Sheriff Fallow | `talk` Fallow · `choice` (`range`, see below) · `defend` the herd pen at Honeydew Ranch `{seconds: 90, waves: 3}`; fails if the pen breaks | side, 120 gold |
| 6 | **A Brand for Every Herd** | Ma Haybale | `interact` Gnawjaw's den (under the hayloft) · `talk` Gnawjaw (he comes out and surrenders, no fight) · `choice` (`mice`, see below) · `talk` Haybale | main, 200 gold, **Drover's Crook** |

## Key scenes and dialogue
1. **Fallow's office, Sodbury.** "Forty aphids since the thaw. I've seen plenty of ants at the pickets. I haven't seen one lift a herd."
2. **The north pasture.** Ma Haybale, on the brands: "I can't tell my aphids from the Thousand's by looking. The brand is how I know which ones are mine when it comes to the ledger."
3. **The Anthill edge (peace, with Kree).** Kree explains the farm: "We stroke them with our antennae until the honey comes. We walk them to fresh clover before frost. We keep the ladybirds off the herd. Your herd is not ours. Our herd is not yours. The clover is for both."
4. **The Pettigrew hayloft.** A cold stove and one small cloth under the floor. Gnawjaw, when he surrenders: "I took the ones with a mark. A mark means someone is counting."
5. **The ridge (war, Kree speaking across it).** "Formica is in the mound, and her soldiers are in the hay. You will not come up the ridge, gnome. We will not come down it."
6. **Sodbury, the brand-shed.** Darnel Pegg, to the player: "I made the stamp that they copied. It's my fault they could. I'll make a new one, and this one won't wash off."

## Choices and flags
| Flag | Values | Set in | What it changes |
|---|---|---|---|
| `range` | `roundup` / `standoff` | Quest 5 | `roundup`: the herd goes home past the pen gate, with the ants at the ridge (peace: with Kree's soldiers in the drive). `standoff`: the herd stays inside the gnomes' fence until the ants pull back. Dialogue only in later zones: Haybale and Fallow both reference it, and the Thousand's Verge lines name the drive. No mechanical change. |
| `mice` | `jailed` / `debt` | Quest 6 | `jailed`: Gnawjaw goes to the Sodbury cell; Haybale stops speaking kindly to the player. `debt`: Gnawjaw works the Honeydew Ranch to pay off his litter's share; Haybale's cold line is replaced by a warm one. Dialogue only. |

Choice options in quest 5 text, by `ants` flag:
- Peace: "Drive the herd home with Kree's soldiers" (`roundup`) or "Hold the herd inside our fence" (`standoff`).
- War: "Drive the herd home past the ridge, while the ants watch" (`roundup`) or "Hold the herd inside our fence" (`standoff`).

Quest 3 is the only other branch. Under peace, Kree is the speaker and says the mandibles are from the Pettigrew field fight. Under war, the mandibles are real dead soldiers' jaws picked up from the same field. The frame works better under war, because the frame is built from real ants.

## New content
### Enemies
| Name | Lvl | Rank | Family | Wants | Notes |
|---|---|---|---|---|---|
| Hayloft mouse | 13 | N | Furred | Gnawjaw's honeydew hoard | Packs of 3-4. Carries aphids into the hay. |
| Gnawjaw, Hob of the Hayloft | 15 | MB | Furred | Food for his litter | **Gnaw** (heavy bite, Chipped), **Hoard Call** (summons 2 hayloft mice), **Floor Dive** at 25% (escapes, not killed). Brand-chip on his collar. |

Existing enemies used: aphid (no-kill, rep with Haybale), field mouse, red ant worker (neutral under peace), red ant soldier.

### Items
| Name | ilvl | Slot | Type | Rarity | Effect / flavour |
|---|---|---|---|---|---|
| Haybale brand-chip | 12 | quest | quest | Plain | A dab of ochre-green clay with a stamped leaf. The mice wear them like medals. |
| Soldier mandible | 13 | quest | quest | Plain | A red ant's jaw. Ants do not leave these lying about. |
| Drover's Crook | 14 | weapon | 1-hand (Crush) | Sprouted | A shepherd's hook with a soft end. "For herding, not hooking." Quest 6 reward. |

### Places
- **Pettigrew hayloft:** the barn on the Anthill edge of the Pettigrew ranch, with the Charter's grain-mark over the door. Mice get in through the hay chute.
- **Hob's den:** under the hayloft floor. Interactable: the cold stove (quest 6).
- **Honeydew Ranch north pasture:** the picket line (quest 1). Existing sub-area.
- **Darnel's brand-shed:** a lean-to behind Sodbury's smithy. Talk only.

## The sad note
Gnawjaw's litter starved last winter, after the tithe-carts emptied the field mice's granary. He took honeydew to keep the rest alive, and he kept taking it after the first pups were gone. That is not an excuse, and the stolen brand-chips are real. Ma Haybale's ledger is real too. The player can understand him and still send him to the Sodbury cell, and the game does not pretend that is clean. Nothing in the den is shown in detail. The stove is cold, and the cloth is small.

## New canon
- **Brands:** each spring, aphid ranchers dab each herd with a coloured clay mark (the brand). A brand is the only way a rancher can prove a herd on paper.
- **Haybale brand:** ochre-green clay with a stamped leaf, carved by Darnel Pegg in Sodbury.
- **Ant husbandry:** red ants stroke aphids with their antennae to draw honeydew, walk herds to fresh clover before frost, and keep ladybirds off the herd. Ants bring their dead soldiers' mandibles back from fights.
- **Gnawjaw, Hob of the Hayloft:** a mouse rustler, mini-boss, Lvl 15, with a litter that starved last winter. He survives the quest in both branches.
- **Pettigrew hayloft:** the Charter's grain-mark is carved over its door. Field mice den under its floor.
- **Tithe-carts:** the Crown's tithe-carts emptied the field mice's granary before last winter.
- **Darnel Pegg:** brand-carver in Sodbury, who sold a copy of the Haybale stamp.
- **Flags:** `range` (`roundup`/`standoff`, quest 5) and `mice` (`jailed`/`debt`, quest 6). Both are dialogue-only.

## Lore checklist
1. **Garden object at gnome scale?** Yes: brand-chips, pickets, a hay chute, a cold stove.
2. **Two time layers?** Yes: Planting (the verse), Charters (the Charter's grain-mark and tithe), Rumbling (the Quiet Years and the starved litter).
3. **Naming rule?** Yes: Gnawjaw is a grubby pest name, Darnel Pegg is a plant first name with a household surname. No puns.
4. **What does each pest want?** Hayloft mice want honeydew for their litter. Gnawjaw wants food for his pups. The ants want the pasture they farm.
5. **Which idea?** Tend it: fair shares, the herd kept in balance, the ranchers and the ants both keeping the clover.
6. **Loose thread given away?** No. The storyline does not explain the Tall Ones, and the verse is left contradictory.
