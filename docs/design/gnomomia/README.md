# Gnomes of Gnomomia: world design (Fescue)

Design bible for growing `games/gnomes-of-gnomomia` from a five-quest intro into a full first world. This is design, not code. A later pass (planner plus workers) turns it into roadmap issues.

Fescue is one setting in the cross-game lore knowledge base, [docs/lore/](../../lore/README.md). These files stay the source of truth for Fescue; `docs/lore/entries/fescue/` holds searchable fact-sheets that point back here. When you add a named place, person or event here, add or update its fact-sheet too.

## Read in this order

| File | What's in it |
|---|---|
| [lore-rules.md](lore-rules.md) | **The rulebook.** 11 rules every place, name, item and quest must follow, plus a checklist. Read first. |
| [history.md](history.md) | The three layers: the Planting (3,000 years ago), the Charters (300), the Rumbling (30). Why everything is the way it is now, plus designer's truths and loose threads. |
| [world-map.md](world-map.md) and [fescue-map.svg](fescue-map.svg) | Zone layout, level bands, travel, sub-areas, implementation notes for zones |
| [places-and-people.md](places-and-people.md) | Every zone and town: reasons, services, sub-areas, ~45 named NPCs with wants and secrets, and each region's sad note |
| [classes.md](classes.md) | Warden (melee), Slinger (ranged), Hedge-Mage (magic): base kits and 3-branch talent trees |
| [combat.md](combat.md) | **Damage and progression redesign**: why the current system maxes out, the new formulas, enemy and gear tables, and conversion of the existing intro |
| [bestiary.md](bestiary.md) | Every enemy by zone: level, rank, family, what it wants; boss mechanics; the Mower's boss sheet |
| [items.md](items.md) | Rarity, slots, gear per zone per class, named drops, legendaries, consumables, trades, quest items |
| [quests.md](quests.md) | 8-chapter main story to the Battle of the Verge, side quests, choices and flags, new objective types |
| [storylines/](storylines/README.md) | 14 side storylines (75 quests) written within these rules, plus their hooks into the finale |
| [balance-sim.md](balance-sim.md) | **Gameplay and balance simulation framework**: strategy agents, abstracted combat scenarios, quantitative tests and CLI diagnostics |

## The pitch in one page

**Fescue** is the first world (lawn) of Gnomomia: a back garden seen from gnome height, walled in by the Fence. The gnomes are fired clay, made 3,000 years ago by the vanished **Tall Ones** in the **Kiln**, and charged to "keep the lawn".

The Tall Ones' great servant-beast, **the Mower**, ran wild after they left. The first gnome king, **Gnorwin Clayfoot**, jammed it with the **Stopping Stone** and shut it in **the Shed**. For 3,000 years it has been grinding that stone down. Thirty years ago it slipped for the first time (the **First Rumble**). Now it slips every few nights, the moles are fleeing south (that's why **Grubthorn** was tunnelling under Mossbottom), and nobody at court believes it.

The player washed up in Mossbottom's brook holding an old trowel with a Clayfoot mark under the rust. They follow Grubthorn's warning north:

| # | Zone | Lv | Story beat |
|---|---|---|---|
| 1 | **Mossbottom Vale** (mushroom village; the current game) | 1-6 | The moles were running, not attacking |
| 2 | **Thatchford Downs** (market town) | 6-11 | Choose your class; prove the tremors are real |
| 3 | **Birdbath Keep** (castle) + **Drainpipe Deeps** (dungeon) | 10-12 | Find Gnorwin's Ledger: *"Water to bog its feet. Stone to stop its mouth. Wood to still its heart. And carts and hands to bring them."* |
| 4 | **Cloverfield** (farming, ranching) | 11-16 | Carts and hands: the Fieldwardens' snail-carts |
| 5 | **Hedgewood** (lumber, hunting) | 15-20 | Wood: the Heartwood, at the centre of a 300-year war with the Wildlings |
| 6 | **The Rockery** (mining) | 19-24 | Stone: fire a new Stopping Stone in the Kiln. Water: the Great Valve's key, down in the Backflow. |
| 7 | **The Verge** | 25-29 | Unmask the Even Cut, who killed the King and want the Mower free |
| 8 | **The Shed** | 30 | **The Battle of the Verge** against the giant lawnmower: Mud → Jam → Heartspark |

Under it all runs one question with three answers: **tend the lawn** (the Crown), **let it grow** (the Wildlings), or **cut it all** (the Even Cut). The final battle is where Fescue answers it.

## Decisions taken (change them here if you disagree)

- **Gnomomia** is the setting as a whole. **Fescue** is world 1. Future worlds are other grasses beyond the Fence (Bluegrass next).
- The current game becomes **Mossbottom Vale** with almost no changes, plus a road north after Grubthorn.
- **One map per zone** with exits, instead of one huge map.
- **Level cap 30**, levelling from **XP** (quests and kills). Use-based skills stay, but as proficiencies capped by level.
- **The player is classless until Thatchford** (level 5+), so the intro stays as it is.
- Respawn has a reason in the lore: you are glued back together at the nearest Glaze Shrine.

## Suggested build order (for the planner)

Each step is playable on its own, per SOUL.md.

1. **Combat and progression rewrite** ([combat.md](combat.md) §12), re-tuning Mossbottom only. Check: the intro still feels the same with bigger numbers, and nothing maxes out by Grubthorn.
2. **Zones and travel**: a zone loader, exits, Glaze Shrines, story flags, new objective types. Mossbottom gets its north exit.
3. **Thatchford Downs plus classes**: three trainers, the Calling, the talent panel, one branch per class first.
4. **Birdbath Keep plus the Gutters**: the first dungeon wing.
5. Then one zone per epic: Cloverfield, Hedgewood (plus the Cistern), Rockery (plus the Backflow), Verge.
6. **The Battle of the Verge**, as its own epic.

Each zone epic follows the same template: zone map, enemies, NPCs and dialogue, quests, items, and a boss. The workers can run those in parallel.
