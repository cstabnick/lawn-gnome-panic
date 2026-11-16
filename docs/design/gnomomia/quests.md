# Quests

The main story, **"The Turning Blade"**, runs in 8 chapters, one per zone, and ends at the Battle of the Verge. Each zone also has side quests. People are in [places-and-people.md](places-and-people.md), enemies in [bestiary.md](bestiary.md), items in [items.md](items.md).

## Objective types

The current game has `kill`, `collect` and `talk`. The world needs five more:

| Type | Shape | Example |
|---|---|---|
| `kill` | `{ enemy, count }` | existing |
| `collect` | `{ item, count }` | existing |
| `talk` | `{ npc }` | existing |
| **`reach`** | `{ region }` or `{ x, z, r }` | "Go to the Spinning Fountains" |
| **`interact`** | `{ object, count }` (clickable world object: valve, statue, book, cart) | "Close 4 fountain valves" |
| **`escort`** | `{ npc, to }`; fail if the NPC cracks | "Bring the snail-cart to the Keep" |
| **`defend`** | `{ x, z, r, seconds, waves }`; fail if the target breaks | "Hold the ford" |
| **`choice`** | `{ options: [{ text, flag }] }`: sets a story flag | "Fell the Heartwood / Be given it" |

**Story flags** (set by `choice`, read by dialogue `when` and by the finale) are a new `state.flags: Record<string, string>`.

**XP tiers** from [combat.md](combat.md): side = 10 × kill XP at quest level, main = 20 ×, chapter finale = 40 × and **+1 skill point**.

---

## Chapter 1: The Running Ground (Mossbottom Vale, 1-6)

The current intro, kept as it is, with a new last beat that turns it into the opening of something bigger.

| Quest | Giver | Objectives | Reward | Purpose |
|---|---|---|---|---|
| Slime Time *(existing)* | Fernwick | collect 5 slug slime → talk Fernwick | 30 g, 3 red potions | Tutorial: gather |
| Feral Trouble *(existing)* | Pip | kill 5 feral gnomes → talk Pip | 80 g, oak shield | Tutorial: fight |
| Shells for Tansy *(existing)* | Tansy | collect 4 beetle shells → talk Tansy | 60 g, thimble helm, 2 blue | Tutorial: tougher fight |
| **A Trowel Like Yours** *(new, side)* | the well statue | interact Moss Kiln-Daughter statue → talk Fernwick | Sprouted acorn cap | First loose thread. Fernwick: "Moss was one of the seven, so they say. You've the same trowel. Odd, that." |
| **The Mole King** *(existing, main, finale)* | Fernwick | kill Grubthorn → talk Fernwick | 300 g, beetle plate, **+1 skill point** | Grubthorn's new last words: *"We weren't attacking. We were running."* |
| **What Moles Know** *(new, main)* | Fernwick (after the Mole King) | talk Fernwick → reach Grubthorn's Burrow (now open to the north) → reach Thatchford | 50 g | Fernwick: "Moles feel the ground before we do. If they're running, something is coming. Tell the Reeve in Thatchford." The burrow collapse opens the north road. |

**Side quests**
- **Puddlemere's Chest**: interact with the drowned cart in Puddlemere. Gives a Sprouted ring and a soggy letter addressed "to the Keep, from a Pipewright, 31 years ago". (Planted for Ch 3.)
- **The Feral Totem**: collect the totem from a feral brute, then talk to Pip. Pip: "Dandelions. The Wildlings carve those, but Wildlings don't steal." First mention of Wildlings.

---

## Chapter 2: It's Always Carts (Thatchford Downs, 6-11)

Nobody believes the warning. The player picks a class and finds proof.

| Quest | Giver | Objectives | Reward |
|---|---|---|---|
| **Word to the Reeve** (main) | Reeve Burlap | talk Burlap | Brushed off: "Carts. It's always carts." |
| **The Calling** (main) | any trainer | talk a trainer → that trainer's trial (below) → talk trainer | **Class chosen**, class weapon (Sprouted) |
| ↳ Warden trial: *Hold the Ford* | Sgt Stoutpot | defend the ford, 60 s, 3 waves of water beetles, without leaving the circle | |
| ↳ Slinger trial: *Shiny Thieves* | Hazel Twitchett | kill 4 magpie thieves on Crowfoot Hill (they fly off at 20%, so hit them at range) | |
| ↳ Hedge-Mage trial: *Dry Them Out* | Magister Dimm | kill 6 muck sprites with Sun spells only | |
| **The Tremor Tally** (main) | Rye Grindwell | collect 3 Hose reeds, kill 5 water beetles nesting in the wheel → interact the mill wheel → talk Rye | **Rye's Tremor Tally**. 31 years of marks, closer together each year. |
| **Pressure's Wrong** (main) | Nettle | reach the Spinning Fountains → interact 4 valves (muck sprites spawn) → talk Nettle | Nettle: "The pressure's coming from *under the Keep*. From the Deeps." |
| **The Heap** (main) | Board / Reeve | reach the Compost Heap → kill Rotgut, Rat of the Heap | Rotgut's Fork chance |
| **A Letter for the Queen** (main, **finale**) | Reeve Burlap | talk Burlap with Tally and Nettle's report | Burlap gives in: "Fine. *Fine.* Take it to the Keep. Don't say I sent you." Letter of passage, **+1 skill point** |

**Side quests**
- **The Empty Table**: sit at the laid table in the Tipsy Toadstool. Dill tells the Backflow story and gives you the list of the forty lost. One name is **Primrose Thistle**. (This opens "The Path Home" for Old Thistle.)
- **Postage Due**: Clementine holds Tansy's 52 unsent letters. Pay 104 g or do three deliveries around town. Carry them to Archivist Inkcap in the Keep (Ch 3). Inkcap writes back, and Tansy's shop gains Glaze pots.
- **Brother Sedge's Pamphlets** (choice): Sedge asks you to hand out 5 pamphlets ("The Even Lawn"). *Hand them out* (flag `sedge=trusted`; he talks more freely later) or *burn them* (flag `sedge=wary`). First contact with the Even Cut. Don't cut grass at the Neat Chapel (a funny warning).
- **Cracked Pots**: collect 6 clay chunks from Hose banks for the kilnwright, which unlocks Glaze pots in shops. A short lore lesson in how gnomes are made.

---

## Chapter 3: The Keep and the Ledger (Birdbath Keep + Drainpipe Gutters, 10-12)

The court is hostile. The Queen is an ally. The first plan appears.

| Quest | Giver | Objectives | Reward |
|---|---|---|---|
| **An Audience** (main) | Chancellor Potsworth | talk Potsworth | Turned away: "Her Majesty doesn't see *letters*." Robin-Master Wren whispers: "Try the Archive at night." |
| **Three Accounts** (main) | Archivist Inkcap | interact 3 records in the Archive (*The Long Lawn*, *Bartholomew's Charter*, *Gromwell's Pressure Notes*) → talk Inkcap | Inkcap: Gnorwin's own ledger was moved to the old vault, which flooded in the Backflow. "It's in the Gutters now. Under everything." |
| **The Queen in the Archive** (main) | Queen Marigold (in the Archive) | talk Marigold | She has read your letter. She asks you to find the Ledger, since nobody else will. |
| **Into the Gutters** (main) | Marigold | reach the Drainpipe Gutters → kill Clogmaw → collect **Gnorwin's Ledger** | Clog-Gloves chance |
| **What the Ledger Says** (main, **finale**) | Marigold | talk Marigold | The Ledger's key line, which sets up the rest of the game: *"Water to bog its feet. Stone to stop its mouth. Wood to still its heart. And carts and hands enough to bring them."* Royal Warrant, **+1 skill point** |

**Side quests**
- **Ida's Father**: Master Pipewright Ida asks you to look for Gromwell's toolbox in the Gutters. You find it with his notes: *"The seals are clay. I said Shard iron. Someone said cheaper."* Ida doesn't see the notes. You keep them (item: Gromwell's Notes, used in Ch 6).
- **Potsworth's Errand**: the Chancellor sends you to collect overdue tax from Cloverfield, which shows where his mind is. Completing it in Ch 4 lets you *pay it yourself* or *forgive it* (flag).
- **The Letter from Puddlemere**: hand the soggy Pipewright letter to Ida. It's from one of the forty, written the day before the Backflow, worrying about the seals. Ida goes quiet.
- **Fifty-Two Letters**: deliver Tansy's letters to Inkcap (from Ch 2).

---

## Chapter 4: Root and Seed (Cloverfield, 11-16)

*Carts and hands.* The Fieldwardens have neither until you fix Cloverfield.

| Quest | Giver | Objectives | Reward |
|---|---|---|---|
| **The Royal Warrant** (main) | Fieldwarden Muckle | talk Muckle | "Haul for the Crown? With what? The young left and the ants have the Pettigrew ranch." Three things to fix: |
| **Rustlers** (main) | Sheriff Fallow | reach the Pettigrew ranch → kill 8 red ant soldiers, or (if `ants=peace` later) skip → escort 6 aphids back | Ranch reclaimed |
| **Runaway Snails** (main) | Mabel Snailwright | interact (lasso) 5 runaway snails | **Riding snail mount** (+30% walk speed) |
| **The Granary** (main) | Muckle | kill 10 field mice in the granary | |
| **Antenna-Sister** (main, **choice**) | Antenna-Sister Kree | talk Kree → choice: *Make peace* (collect 10 clover seed + 5 honeydew for the Queen, talk Formica) sets `ants=peace`, or *Drive them out* (kill Ant Queen Formica) sets `ants=war` | Peace: the ants share pasture and the Thousand join the finale. War: Formica's Mandible. |
| **Old Gleaner** (main, world boss, **choice**) | Sheriff Fallow | reach Crow's Perch → *Fight* (kill Old Gleaner) or *Feed* (collect 10 grain sacks from Muckle's hidden store, interact the perch); flag `gleaner=fed/killed` | Fed: Gleaner leaves, drops Gleaner's Pinion, and the Sheriff finds his deputy's hat in the nest. Killed: Pinion plus a gold hoard. |
| **The Great Haul** (main, **finale**) | Mabel | escort Mabel's snail-cart from Sodbury to Birdbath Keep (straw-wight and mouse ambushes) | **Snail-cart Writ**, fast-travel carts unlocked, **+1 skill point** |

**Side quests**
- **The Straw King**: interact with the inscription at Scarecrow Rise and clear the straw-wights. The Archive version says it was "a Gardener who forgot to leave". (A Tall One's trace; never confirmed.)
- **The Last Pupil**: bring 3 books from the Keep's Archive to Sodbury's one pupil. The teacher rings the bell and *two* children come the next day: Ma Haybale's grandkids, sent back from the Keep. (A small happy ending to the sad note.)
- **Haybale Letters**: find Ma Haybale's three children in the Keep. One is **Robin-Master Wren Tumble** (née Haybale). Reward: Haybale Family Hoe.
- **Muckle's Skimming** (choice, only if you found the hidden grain store): tell the Sheriff or keep the secret. The old folk it feeds are mentioned either way.
- **Potsworth's Tax** (from Ch 3): pay it, forgive it, or collect it. Collecting makes Ma Haybale cold to you.

---

## Chapter 5: Bough (Hedgewood, 15-20, + Drainpipe Cistern, 18-20)

*Wood to still its heart.* The Heartwood is in the Elder Privet, at the centre of a 300-year war.

| Quest | Giver | Objectives | Reward |
|---|---|---|---|
| **The Elder Privet** (main) | Boss Splitwell | talk Splitwell | "Heartwood? Easy. Fell the Privet and take it." The Wildlings live in the Privet. |
| **Neutral Ground** (main) | Juniper Quickstring | reach Barkhollow → talk Juniper | Juniper brokers a meeting with Mother Burdock |
| **The Mill Raid** (main) | Splitwell | defend the Sawdust Mill, 90 s, from *bareheaded* raiders. Talk to one survivor: they're **Ferals**, not Wildlings. | First proof the Wildlings get blamed for others' work |
| **The Weaver Below** (main) | Juniper | reach Webhollow → kill the Weaver Below → rescue 3 cocooned gnomes (one Hedgewright, one Wildling, one hunter) | Both sides owe you |
| **Fen's Two Families** (main) | Fen Splitwell | talk Fen → talk Alder → talk Burdock | Fen asks you to get them to one table |
| **The Paper Spire** (main) | Burdock (and Splitwell) | reach the Paper Spire → kill Queen Vespa | Both sides wanted her gone |
| **The Heartwood** (main, **choice**, **finale**) | Burdock / Splitwell | choice: *Be given it* (talk Burdock with Vespa's stinger: she cuts one branch in ceremony) sets `hedge=peace`, or *Fell it* (defend the Hedgewrights while they fell the Privet; Wildlings attack) sets `hedge=felled` | **Heartwood Stake**, **+1 skill point**. Peace: Wildling archers *and* Hedgewright axes at the finale. Felled: Hedgewrights only, and the Wildlings will never trust the Crown. |
| **The Valve Maps** (main) | Ida Gromwell (Keep) | reach the Drainpipe Cistern → kill Mother Vesh → collect the Valve Maps | Ida: "The Great Valve can bog the whole Shorn in mud. If anyone can open it. My father had the only key." |

**Side quests**
- **A Beetle of Your Own**: Juniper teaches taming. Collect 5 cricket legs as bait, then interact a young stag beetle. Slingers get their Beetle Companion. Other classes get a cosmetic beetle that follows them around.
- **Old Lichen's Guest**: Lichen hid one of the forty Pipewrights after the Backflow. Find his grave in the hedge. He wrote one more page of Gromwell's notes before he shattered. (Evidence for Ch 6.)
- **Twitchett and Quickstring**: carry Hazel's letter to Juniper. Two old hunters, one long-overdue reply. (Kept small.)

---

## Chapter 6: Stone (The Rockery, 19-24, + Drainpipe Backflow, 24-25)

*Stone to stop its mouth.* The deepest, oldest part of Fescue, and where the player's mystery gets its strongest hint.

| Quest | Giver | Objectives | Reward |
|---|---|---|---|
| **A New Stopping Stone** (main) | Kilnkeeper Sedum | talk Sedum | "Fire a new Stone? In the Kiln? The Kiln hasn't burned in my lifetime... except four nights before you came." The front gate collapsed in the First Rumble. The only other way in is the moles' deep way. |
| **The Humming Seam** (main) | Forewoman Hammerclod | reach the Shard Mine deep seam → kill 8 Rockery centipedes → interact the mirror-bright Shard wall | You see your reflection in a piece of the Mower. Grout: "Thump. Turn. It's closer." |
| **Honest Words** (main) | Dowager Mudtooth | talk Mudtooth with the Mole crown → choice: *Tell the truth* (you killed Grubthorn, and he was running) sets `mudtooth=trust`, or *Lie* (Mudtooth fights you, and you dig your own way in) | Trust: she shows you the deep way, and deep moles turn neutral |
| **The Unfired** (main) | Sedum | reach the Kiln's back chambers → defeat 8 Unfired (Sun spells *finish* them: they harden and sigh, which counts double) | Sedum, quietly: "I visit them every evening. Somebody should." |
| **The Kiln Warden** (main) | – | kill the Kiln Warden. At 10% it kneels: *"Clayfoot."* | Kiln Warden's Heart. Sedum tells you she saw a shape walk out of the lit Kiln toward the Spigot, four nights before you washed up. **(Loose thread, unanswered.)** |
| **Firing the Stone** (main) | Sedum | defend the Kiln, 120 s, waves of Unfired, while Sedum fires the Stone | **The New Stopping Stone** |
| **Down the Drains** (main) | Ida Gromwell | reach the Drainpipe Backflow → interact 3 old valve seals (they're *clay*) | Evidence |
| **Clay Seals** (main, **choice**) | – | choice: *Tell Ida* (sets `potsworth=exposed`: Ida demands he be shattered, and the Queen will judge in Ch 7) or *Confront Potsworth* (talk Potsworth with Gromwell's Notes; he confesses to the Queen himself; sets `potsworth=confessed`) | Confessed: Potsworth, ashamed, frees the Queen to ride to war and funds the army. |
| **Who Holds the Valve** (main, **finale**) | Ida | kill Gromwell, Who Holds the Valve (or, with Ida in your party, choose "Let Ida speak" at 30%) | **Gromwell's Valve-Key**, Gromwell's Last Seal. His last line: *"Is it dry up there? Good. Good."* **+1 skill point** |

**Side quests**
- **Bramble's Old Master**: get Smith Cobalt Anvilroot to forgive Bramble (bring Cobalt a letter and a bottle of Bramble's sobriety tonic from Tansy). Bramble's Mossbottom shop starts selling Shard-iron gear.
- **Gnorwin's Trowel**: once the Kiln Warden has knelt, Cobalt sees the Clayfoot mark under the rust and reforges your trowel in Kiln fire. Gives **Gnorwin's Trowel** (Kiln-fired).
- **Raft Down the Hose**: ride the leaf raft from Flintdelve to Thatchford. You pass the brook where you first washed up. Fernwick, if you visit: "Same way you came. Funny."
- **The Path Home**: tell Old Thistle you found Primrose's name on the Pipewright roll in the Backflow (interact the roll). He finishes sweeping the path, puts the broom down and sits on the bench at the end of it. No reward. That's the point.

---

## Chapter 7: The Verge (25-29)

Gather the allies, unmask the traitor, and wake the Mower.

| Quest | Giver | Objectives | Reward |
|---|---|---|---|
| **Wings to the Front** (main) | Wren Tumble | talk Wren → (flight) reach Last Tuft | Robin flight unlocked |
| **The Muster** (main) | Knight-Commander Ironsod | interact the War Table → hand in War Supplies from each region (timber, Shard iron, grain/honeydew) | Each completed supply line strengthens an ally (see the finale table) |
| **No Hats** (main) | Ironsod | reach the King's cart on the Shorn → interact the cart (collect **the King's Signet**) → find level-cut hat brims around it → talk Brother Sedge (at the Level gate) → choice: *Spare him* (sets `sedge=defected`, he gives you the Level's layout) or *Arrest him* | Proof: the King's Fall was the Even Cut, led by Sedgewick. Ironsod: "I knew. I hid under the cart, and I *knew*." |
| **The Same Table** (main) | Queen Marigold (arrives) | talk Marigold with the Signet → (if `hedge=peace`) talk Mother Burdock at Last Tuft | Peace route: the Crown formally apologises to the Wildlings. 300 years closed. |
| **The Queen's Judgement** (main, only if `potsworth=exposed`) | Marigold | choice: *Shatter him* (Ida's justice, the Keep's treasury goes cold) / *Exile him to the front* (he fights at the finale) | |
| **The Level** (main) | Ironsod | reach the Level → kill 3 Edger-Knights → kill **High Edger Sedgewick** | Sedgewick's Edging Blade. Dying: "You can't stop it. You can only be cut sooner or later." The ground shakes, and the Shed door splits open. **The Mower is awake.** **+1 skill point** (chapter finale) |

**Side quests**
- **Rust Oil**: collect 10 rust-rat tails, then talk to the Last Tuft herbalist. Unlocks Rust oil throwables.
- **Moths to Flame**: kill 12 grass-bag moths. Something glittered in one's wings: a Tall-eye, with a scratch that looks like writing. (Hook.)
- **Fernwick Comes North**: Fernwick arrives at Last Tuft by snail-cart, on his knees' advice. He has nothing to give. He just wanted to see it.

---

## Chapter 8: The Turning Blade (level 30), the Battle of the Verge

One long quest in three phases. Every earlier choice changes who stands with you.

### Allies

| Ally | Joins if | In the battle |
|---|---|---|
| Keep soldiers (Ironsod) | always | Hold the barricades; draw some attacks |
| Pipewrights (Ida) | always (needs the Valve-Key) | Open the Great Valve in phase 1 |
| Fieldwardens (Mabel's carts) | always (needs the Writ) | Bring the Stopping Stone in phase 2. Faster carts if the grain supply line was filled. |
| Delver sappers (Hammerclod) | Shard-iron supply line filled | Rebuild barricades between phases |
| Wildling archers (Burdock) | `hedge=peace` | Shoot down Belly moths automatically |
| Hedgewright axes (Splitwell) | always unless the Mill fell | Extra barricade HP |
| The Ant Thousand (Kree) | `ants=peace` | Carry fallen allies back up: one free revive for the player |
| Old Gleaner | `gleaner=fed` | **Phase 3: she drops out of the sky and pins the Waking Rope**, which gives +15 s on the Rope timer |
| Potsworth | `potsworth=confessed` or exiled | Funds the army: everyone starts with +2 potions. Stands on the line, terrified. |
| Brother Sedge | `sedge=defected` | Tells you each Rolling Charge lane 1 s early |

### Phase 1: Mud

The Mower rolls out of the Shed. Ida's crew must open the Great Valve (a `defend` objective: the pipe-head for 90 s). Meanwhile the Mower Chute-Blasts debris at the line and makes Rolling Charges at the Hedgewood barricades, and moths and rust-rats press in. When the valve opens, water bursts across the Shorn. **The Mower bogs in mud: −50% speed for the rest of the fight.**

### Phase 2: Jam

Fight the Mower's body. Destroying wheels slows it further. **At 50% deck HP**, Mabel's snail-cart rolls in with the new Stopping Stone. Escort it along the lane (Rolling Charges come at it) for 30 s, then **interact** with the Stone as the blade slows. The Stone jams the blade: **Blade Sweep stops for the rest of the fight**, and the Mower shudders. A ramp of debris forms up to its deck.

### Phase 3: Heartspark

Climb the ramp onto the deck. Strike the **Heartspark** (Rain ×2, Gnorwin's Trowel +50%). A special button, **Drive the Stake**, appears every 20 s: a huge hit with the Heartwood Stake. Partway through, the Mower starts to **Pull the Rope** by itself, the creepiest moment in the game. Cut the Rope within 30 s (+15 s if the Gleaner pins it) or it restarts and heals. When the Heartspark breaks, the Mower **falls silent**.

### Ending

- The Mower stops. It doesn't explode. It just sits there, quiet, for the first time in 3,000 years.
- **Epilogue beats**, one per region, chosen by flags: the Wildlings and Hedgewrights replant around the Privet (or a stump); the Ant Thousand graze beside aphids; Sodbury's bell rings for a full class; Ida opens the Valve every spring "to keep it rusty"; Potsworth sweeps the Pedestal steps; Thistle sits on his bench.
- **Fernwick:** "My knees have stopped hurting. First time in a month. Thought you should know."
- **Title:** *Bladebreaker*. Kiln-fired class item. +1 skill point (to 35).
- **Hook:** the Mower's Belly tore in the fight. Among the grass inside is something that isn't grass: a key the size of a gnome, with a tag in Tall One script nobody can read. And beyond the Fence, someone has just started a second mower. *(Next world: Bluegrass.)*

---

## Repeatables (Bounty Boards)

Each town's board has 3 rotating kill bounties for that zone's enemies (side-tier XP, gold, and a small chance of a Sprouted item). They give co-op groups something to do, with no story attached.
