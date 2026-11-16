# The Cart That Came Back Empty

**Zone:** The Verge (with Mabel from Cloverfield) · **Levels:** 25-28 · **Quests:** 4 · **Leans toward:** Tend it (against Cut it all)
**Unlocks after:** Main quest "No Hats" (Chapter 7) · **Ties to main story:** Ironsod stops hiding from the King's Fall, and Queen Marigold gets her father's letters before the Battle of the Verge.

## Pitch
The King's cart still stands on the Shorn, mown into a perfect ring by the Even Cut. Mabel Snailwright built it, and she wants it home. You help her free its axle, then escort it across the Shorn while clippers try to trim you both, and you open the locker the Crown's clerk never found. What comes out is the King's own kit: his hat, his pin and three letters to his daughter. It is worth doing because it is the only part of the King's Fall the player can hold in their hands.

## Roots in the three layers
- **Planting (3,000 years):** The Mower cut everything to one height during a Mowing. The Even Cut cut a ring to the same height around the King's cart and call it holy. The Shorn is the strip where the Mower came from, and nothing on it has been allowed to grow since the Quiet Years.
- **Charters (300 years):** The Charter of Root and Seed made the Fieldwardens the haulers of the realm, and their snail-carts still carry the Crown's grain. Mabel is one of them. The Crown's watch-line on the Verge was kept by the Keep until it was abandoned.
- **Rumbling (30 years):** The King's escort was ambushed on the Shorn. The recovery party wrote "cart: empty" in the Crown's ledger, and nobody opened the locker. Rowan hid under this cart while it happened.

## People
| Name | New or existing | Role | Want | Secret / wound |
|---|---|---|---|---|
| **Mabel Snailwright** | existing (Cloverfield) | Snail-cart builder, Fieldwarden | Her cart home, under its own wheels | She built a false bottom into the locker at the King's request and has never told anyone what it holds. Her snails came home alone that year. |
| **Knight-Commander Rowan Ironsod** | existing | Commands the front | To stop hiding | He hid under the axle while the escort died. He has not been near a cart since. |
| **Queen Marigold Clayfoot** | existing (arrives ch. 7) | Monarch | Her father's words | His last letter to her was never finished. |
| **Bindweed Hobnail** | **new** | Keep bearer, lead of the King's litter | To be asked what he saw | He told the clerk there was a box under the seat. The clerk wrote "cart: empty" and went home. Hobnail did not push. |
| **Dumpling and Lugworth** | **new** (draft snails) | The cart's team | Their harness back | They bolted and came home to Sodbury alone, traces cut. |

## Quest chain
| # | Quest | Giver | Objectives (typed, in order) | Reward (XP tier, gold, items) |
|---|---|---|---|---|
| 1 | **The Team Came Home** | Mabel (Last Tuft) | talk Mabel → reach the Trophy Ring → interact the cart's seat (opens the locker) → collect Gnorbert's Letters ×3 → talk Mabel | side, 60 g, **King's Good Hat** |
| 2 | **Rowan Under the Cart** | Ironsod (Last Tuft) | talk Ironsod → reach the Trophy Ring → kill 4 Even Cut Sweepers → interact the axle box (the pin) → choice (see below) | main, 80 g, **Marigold's Button** (found in the axle box) |
| 3 | **Bring Her Home** | Mabel | talk Mabel → escort the cart from the Trophy Ring to Last Tuft (Even Cut clippers and acolytes charge the lane; fail if the cart cracks) → talk Mabel | main, 120 g, **Gnorbert's Snail Goad** |
| 4 | **The King Comes Home** | Queen Marigold (Last Tuft) | talk Marigold with the Letters → interact the cart ×3 (new hubs, new seat, paint) → choice (see below) → talk Marigold | main, 150 g, the Queen's ribbon (cosmetic for the cart) |

Quest 1 can be taken from Mabel at any time after No Hats. Quests 2-4 are in order. If the cart is lost in quest 3, Mabel restarts it from the Trophy Ring; the Sweepers do not respawn in the ring.

XP tiers follow [quests.md](../quests.md): side = 10× kill XP, main = 20×.

## Key scenes and dialogue
1. **The team.** Mabel, at Last Tuft: *"Four snails came home that year, still in their harness, with nothing on the end of it. The Crown's clerk wrote 'cart: empty' in the book. I built that cart. Empty."*
2. **The locker.** Hobnail, at his bench: *"I said there's a box under the seat. He said the cart's empty, Hobnail, write what's there. I wrote what he said."*
3. **The axle.** Ironsod, at the Trophy Ring: *"This time I don't get under the cart."* He gets under it anyway. From the box, muffled: *"Hold the lamp. It's the pin. It's always the pin."*
4. **The clippers.** An Even Cut clipper, during the escort: *"Lean, friend. The Saint sees leaning."* Mabel: *"It's a snail-cart, not a sermon. Keep your shears on the left."*
5. **The letters.** Marigold, reading the third letter: *"He says the Shorn smells of vinegar and clean. Does it? Tell me the truth. I have never been allowed to check."*

## Choices and flags
| Choice | Flag and values | What each value changes |
|---|---|---|
| **Quest 2, Rowan under the axle.** Option A: let Ironsod go under himself. Option B: send a Keep sapper under instead. | `ironsod = faced` / `ironsod = sent` | **Battle of the Verge:** `faced` gives Keep soldiers the Hold-the-Line buff at the start of the barricades (they begin at full barricade HP). `sent` has no mechanical effect; Ironsod stands at the back and says little. |
| **Quest 4, the cart's use.** Option A: haul war supplies again. Option B: keep it as a memorial at Last Tuft. | `cart = haul` / `cart = memorial` | **Battle of the Verge, phase 2:** `haul` shortens the Stopping Stone's escort lane by 5 s. `memorial` puts a lamp at the Last Tuft shrine and gives Mabel's carts a black stripe. No combat effect. |

## New content
### Enemies
| Name | Lvl | Rank | Family | Wants | Notes |
|---|---|---|---|---|---|
| Even Cut Sweeper | 25 | N | Fired clay | To keep the King's ruts swept level, so nothing leans | Broom sweep (knockback). Throws Shorn grit (Chipped). Crush ×1.25. Found in the Trophy Ring. |

The clippers and acolytes already in [bestiary.md](../bestiary.md) make up the escort harassment.

### Items
| Name | ilvl | Slot | Type | Rarity | Effect / flavour |
|---|---|---|---|---|---|
| **King's Good Hat** | 25 | head | Leather | Blooming | A tall brown felt hat with a Tall-eye pin. Wear it, and the Even Cut will know you for a Crown gnome. (+Endurance, +Defense 1) |
| **Marigold's Button** | 25 | trinket | Charm | Sprouted | A clay button Gnorbert carried for his daughter, with an M scratched in the back. (+1 attribute line) |
| **Gnorbert's Snail Goad** | 25 | weapon | Pierce, 1-hand | Sprouted | A long stick with a brass point, worn smooth by the King's hand. Good for snails and nothing else. |

**Gnorbert's Letters** (quest item, no slot): three letters to Marigold in the King's hand. The third is unfinished.

### Places
- **The Trophy Ring**: a circle of cut stubble about twelve gnomes across, mown to one height around the King's cart. Sits in the middle of the Shorn, on the road from Last Tuft to the Level's gate. Sweepers patrol its edge.
- **The King's cart**: the locker under the seat has a false bottom Mabel built. The axle box, where Rowan hid, holds the pin.
- **Last Tuft restoration yard**: where the cart is rebuilt beside the War Table, with Hobnail's bench at the gate.

## The sad note
The King wrote to his daughter from the Verge three times. The first two are about the cold and the snails. The third ends in the middle of a line: *"When the Shorn is quiet I will bring you back a view of it, so you can say whether it's as green as they tell you, which I think is a lie you'll enjoy."* Marigold has never seen the Verge. She reads the letter aloud to nobody in particular, and she does not finish it either.

## New canon
- Mabel built a false bottom into the King's cart. The locker held the King's Good Hat, Marigold's Button and Gnorbert's Letters.
- The Crown's recovery ledger reads "cart: empty". The locker was never opened. "The cart that came back empty" is this ledger entry and the snails' empty harness.
- The snails Dumpling and Lugworth bolted and came home to Sodbury alone, traces cut.
- Bindweed Hobnail (uncle of Sergeant Bugle Hobnail, see storyline 04) was lead bearer on the King's litter. He carried the King home; he did not open the locker.
- The Even Cut keep a ring of cut stubble around the King's cart. Sweepers keep its ruts level.
- Gnorbert wrote three letters from the Verge to Marigold. The third is unfinished.
- The new enemy (Even Cut Sweeper) and the three items above.

## Lore checklist
1. **Garden object at gnome scale?** Yes. A snail-cart, a mown ring, a tool locker, an axle pin. The names are gnome-made: "Trophy Ring", "Snail Goad".
2. **Two time layers?** Yes: Charters (Fieldwardens, the watch-line) and Rumbling (the King's Fall, the ledger).
3. **Naming rule?** Yes. Hobnail is a household surname. Dumpling and Lugworth are plant names. No puns.
4. **What does the creature want?** The Sweepers want the ruts level so nothing leans. The snails wanted their harness back.
5. **Which idea?** Tend it. The cart goes back to work or it is kept, and both are tending. The Even Cut's ring is the thing the story argues against.
6. **Loose threads?** None answered. The Kiln, the Spigot, the Tall Ones and the player's origin are not touched.
