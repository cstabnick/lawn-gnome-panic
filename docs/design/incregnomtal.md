# Incregnomtal: design

An incremental game about a gnome crew growing a lawn on a bare patch of the Yard. It runs about **one hour** to the
ending. A weekly **Mowing Day** reset feeds a **skill tree**, and a steady run of **new problems** keeps the player
fixing things and then rethinking them.

Status: design only. No game folder exists yet. The future folder is `games/incregnomtal`; build it with the decompose
skill from this doc.

## The one question

Is an incremental fun when each upgrade solves a problem and creates the next one, rather than only making a number
go up? If players keep saying "oh no, now the robins…", it works. If they stop reading and buy the cheapest thing, it
doesn't.

## Pillars

1. **Every fix makes the next problem.** No upgrade is purely good. Watering brings puddles, birds bring seed thieves,
   the dog brings dog spots. The player is always improving something and then rethinking it.
2. **Every pest wants something.** This is the lore house style. Each problem creature becomes a friend once you give
   it what it wants, and then it helps. Problems turn into resources.
3. **Clicking is optional but worth it.** An idle player reaches the ending. A player who taps gets there in about
   two-thirds of the time (see [Active vs idle](#active-vs-idle)).
4. **Several resources pulling against each other, and they change.** Water, Loam and Acorns each start out as the
   bottleneck and later stop being one. The thing you optimised in week 2 doesn't matter by week 5.
5. **One hour, then done.** It has a real ending at about 60 minutes. Endless play after that is optional.

## Lore and setting

Based on the gnome lore knowledge base (`docs/lore/`, PR #186). The game belongs to **`the-yard`**: silly and
dry-humoured, with mowers that gnomes can ride, and the other arcade games happening next door.

Core facts it uses:

| Core fact | How the game uses it |
|---|---|
| The world is a garden at gnome height | The lawn is 8x10 tiles, and each tile is a gnome-sized field. Decor is ordinary yard stuff at giant scale. |
| Gnomes are fired clay | Crew gnomes chip when the dog sits on them (a joke, not a mechanic). Nothing bleeds. |
| Nobody sees the Tall Ones | The house, the tap and the dog's food bowl are theirs. No hand ever shows. The paper turns up on the step anyway. |
| Mowers are the great machine | **Old Saturday**, the runaway riding mower, comes every Mowing Day. That is the prestige reset. Taming it is the capstone. |
| Acorns are treasure | Acorns are the hard currency. Acorn caps are what gnome hats are made from, so every hire costs an acorn. |
| A gnome's hat is who they are | No hat, no gnome: crew size is limited by hats. A hatless gnome sometimes shows up at night (easter egg). |

House style: plant first names, household surnames, dry jokes, no pop culture, loose threads left loose.

### New lore this game adds (entries to write when the game is built)

All `tier: game`, `setting: the-yard`, `status: draft` until the game ships:

- **The Bare Patch** (place): the dirt lot behind the Panic Yard fence. Its sign changes as the lawn improves: "The
  Bare Patch", then "The Patch", "The Lawn", "The Good Lawn", and finally "Yard of the Year".
- **Foreman Yarrow Teacup** (person): the crew boss. All tutorial and problem lines are his: short, dry, a little tired.
- **Old Saturday** (creature/object): the runaway riding mower that rounds the Yard every week. Nobody is on it. Who
  starts it is a loose thread.
- **Biscuit** (creature): the Tall Ones' giant dog. The gnomes call him "the Great Biscuit". He is good. He is not
  careful.
- **Mulch** (term): what a lawn becomes after Old Saturday passes. The crew rakes it into the compost and starts again.

**Proposed ruling (R-009, to add to `docs/lore/rulings.md` when the game is built):** Is Biscuit Gnome Company's Giant
Fetch Dog? No. The Fetch Dog is apocrypha and never feeds back (R-005). Biscuit is the Yard's own dog. Dogs are pets of
the Tall Ones, so seeing one doesn't break the "never seen" rule (as with the Tall House's pet-door). The game also
needs a settings row: add `incregnomtal` to `the-yard`'s games list, because the lore checker requires every game folder
to be listed.

## Core loop

```
 tiles grow (needs Water + Loam)
        │
        ▼
 trim tiles ──► Clippings ──► buy: gnomes, tools, grass, decor
   ▲  (tap or Trimmer gnome)       │
   │                               ▼
   └──── new problem appears ◄── upgrade changes the lawn
                                   │
                    end of week:   ▼
                Old Saturday mows everything ──► Mulch ──► skill tree
```

- **Tiles.** Each lawn tile has a grass type and a height (0-100%). Height grows at
  `growth(grass) × waterFactor × loamFactor × multipliers`, and a tile stops growing at 100%. Trimming a tile pays
  `height × value(grass) × charmMult` Clippings and drops it back to 10%.
- **Overgrown tiles** (100% for 20 s or more) go to seed: they stop paying more, and they start spreading weeds. This
  is the first "neglect" pressure.
- **A week** is one run. The week clock shows Monday to Sunday. Old Saturday arrives on Sunday at the latest. From
  Wednesday on, the player can ring the shed bell to call him early.
- **Mowing Day** resets the lawn heights, the Clippings, Water, Loam, the gnomes' jobs and the decor. It keeps
  Discoveries (grass types, befriended critters, lawn plots) and Mulch.

## Resources

| Resource | Kind | Comes from | Spent on / drained by | Bottleneck in |
|---|---|---|---|---|
| **Clippings** | soft currency | trimming tiles | gnomes, tools, seed, decor, compost | always (the main number) |
| **Water** | flow + store | taps (thimble), Waterer gnomes, hose, sprinklers, rain, rain barrels | every growing tile drinks it | weeks 1-3, then a crisis in week 4, then barely matters |
| **Loam** | pool | compost bin (Clippings → Loam), worms, clover | thirsty, high-value grasses drink it | weeks 2-3, then turns into a surplus |
| **Acorns** | hard currency | the oak (slow drip), golden acorn taps, squirrel trades, easter eggs | gnome hats (1 per hire), decor, befriending, lawn plots | all game; the hats-vs-decor choice |
| **Charm** | derived stat | decor, grass quality, friendly critters, lawn stripes | not spent. Multiplies Clippings and sets the sign's title | from week 2 |
| **Wishes** | temporary | pulled dandelions (a weed turned resource) | tap to blow: a random 30 s boost | from week 1, optional |
| **Mulch** | prestige | Mowing Day | skill tree | between weeks |

### How the resources change over the hour

This is the "balance, then change" pillar. Each resource has a shape that flips once:

- **Water: scarce, then managed, then irrelevant.** At first you tap a thimble, then a Waterer carries a bucket. The
  hose fixes it, but the tap only turns so far (flow cap). In week 4 the **Dry Summer** cuts the flow to a trickle. The
  fix is drought grass (Zoysia) and clover, which barely drink, so after week 4 Water stops being the constraint and
  **shade and heat** become the new one.
- **Loam: a drain, then a trade-off, then a surplus.** High-value grass eats Loam. The compost bin turns Clippings into
  Loam, so you feed your currency into your soil, which is the first real balancing slider. Worms soften it. Clover
  makes Loam instead of eating it. From week 4, extra Loam goes into flower beds, which give Charm.
- **Acorns: hats, or everything else.** Every gnome needs an acorn-cap hat, and every decor piece and critter favour
  also costs acorns. Early on this is the hardest choice in the game. Squirrels (week 3) turn acorns into oak saplings,
  which give shade and so feed the shade problem. Golden Acorns at the end pay for the capstone.
- **Labour: gnomes, then gnomes with tools, then the dog.** Gnomes are generic, and the player assigns them to jobs
  (Trim, Water, Weed, Compost, later Dog-handler and Beekeeper). That assignment is the main balancing screen. From
  week 3 Biscuit does big jobs a crew can't, but only the ones he's been taught.

## The problem chain

The heart of the game. Each row is introduced by Foreman Teacup with one line and a visible tell on the lawn. Each fix
is satisfying (something visibly clears up), and each fix causes the next row.

**Problem rules:**

- A problem never takes more than **40% of income**. There are no fail states, and an idle player is slowed, never
  stuck.
- Every problem has at least one **idle fix** (buy or assign) and usually a **click fix** (tap to clear) that is faster
  but costs attention.
- Every problem is shown before it bites: a tell, a line, and 10-20 s before the damage starts.
- Problems scale with the lawn (they cost a share of tiles, not a flat amount), so they stay relevant at any income.

| # | Week | Problem (tell) | Fix | What the fix causes next |
|---|---|---|---|---|
| 1 | 1 | **Bare dirt.** Nothing grows. | Tap to sow crabgrass. | It grows, then dries out. |
| 2 | 1 | **Thirst.** Tiles go yellow. | Tap the thimble, then hire a Waterer. Buckets. | Waterers can't keep up with a bigger lawn. |
| 3 | 1 | **Overgrowth.** Tiles hit 100% and go to seed. | Tap to trim, then hire a Trimmer. | Seeded tiles start dandelions. |
| 4 | 1 | **Dandelions** spread from neglected corners. | Tap to pull (they pop), then a Weeder. | Pulled dandelions give **Wishes**: the problem becomes a resource. |
| 5 | 1 | **The tap only turns so far.** Water flow hits its cap. | Buy the hose and lay it to the far tiles. | Hose overflow leaves **puddles** (tiles drown and stop growing). |
| 6 | 1-2 | **Crabgrass is worthless.** Income stalls. | Ryegrass, then Fescue seed (×3, ×6 value). | Better grass is thirsty and **eats Loam**. |
| 7 | 2 | **Tired soil.** Loam runs low and tiles grow slowly. | Compost bin: feed it Clippings. Assign a Composter. | Composting competes with spending. Worms come to the compost. |
| 8 | 2 | **Grubs** (they love Bluegrass) chew roots, and brown rings spread. | Build a birdbath. The **Robin** comes and eats grubs. | Robins also eat freshly sown seed. |
| 9 | 2-3 | **Seed thieves.** Resown tiles get picked clean. | Choose: a scarecrow (it also scares the robin, so grubs come back), or a bird feeder to keep the robin busy. | The feeder brings **squirrels**. |
| 10 | 3 | **Squirrels** raid the feeder and steal acorns. | Befriend them: trade acorns. They plant oak saplings and bring acorns back at a profit. | Saplings grow into trees. **Shade** slows sun grasses under them. |
| 11 | 3 | **Moles** (they follow the grubs and worms) heave tiles into hills. | Befriend **Biscuit** (play fetch: tap the ball). He digs the moles out. | Biscuit digs his own holes and leaves **dog spots** (brown patches). |
| 12 | 3-4 | **Dog spots and holes.** | Teach tricks: "Stay off", then "Dig here" (he digs irrigation trenches), then "Fetch the paper". Plant clover, which dog spots don't harm. | Clover flowers bring **bees**. Trenches make water spread, until… |
| 13 | 4 | **Dry Summer.** The tap drops to a trickle. All that water infrastructure is now useless. | Rain barrels (store water from rain events), Zoysia (drinks 0.3 water), clover. The bees pollinate for Charm. | With water solved, full sun at midday **scorches** Zoysia's neighbours. |
| 14 | 5 | **Heat and shade.** Sun tiles scorch, shaded tiles crawl. | Balance it: put trees (squirrels) where the scorch is, and plant moss in deep shade (it pays in Charm, needs no trim). | Charm is high, and shiny decor draws **crows**. |
| 15 | 5 | **Crows** steal the gazing ball and the flamingo. | Choose: a scarecrow again (and lose the robin again), Biscuit chasing them (taught trick), or befriend them with bottle caps, after which they bring trinkets. | The lawn is nearly perfect, and Old Saturday is now the only problem left. |
| 16 | 6 | **Old Saturday** cuts it all down every week. | Capstone: **Tame the Mower**. On the last Mowing Day the crew rides him. Steer to mow stripes and a hat pattern into the lawn. | The ending. |

### Rethink moments

Each week overturns something the player learned. These are the beats to protect in playtesting:

| Week | What the player believed | What breaks it |
|---|---|---|
| 1 | More water is always better | Puddles drown tiles |
| 2 | Birds are good | The robin eats your seed |
| 3 | Clippings are for spending | Composting them is what keeps you growing |
| 4 | Water is everything | The Dry Summer makes it irrelevant; switch grasses |
| 5 | Full sun is good | It scorches; trees and moss become the play |
| 6 | The mower is the enemy | You ride him |

## Grass types

Grass is how value scales: each tier is worth about **×2.5** the last, with a new demand attached. They are permanent
Discoveries, and the player resows tiles by tapping (or with a Sower via the tree).

| Grass | Unlocked by | Growth | Value | Water | Loam | Quirk |
|---|---|---|---|---|---|---|
| Crabgrass | start | 1.0 | 1 | 0.5 | 0 | Seeds weeds itself. Almost worthless. |
| Ryegrass | filling the lawn in week 1 | 1.2 | 3 | 1.5 | 0.5 | Thirsty. |
| Fescue | 25 trims in a week | 0.8 | 6 | 1.0 | 0.5 | Tolerates shade. Tooltip: *"Some gnomes say a whole kingdom lives in a patch of this."* |
| Bluegrass | first squirrel trade (week 2-3) | 1.0 | 15 | 2.0 | 2.0 | Grubs love it. |
| Clover | the first dog spot (week 3-4) | 0.9 | 8 (+flowers) | 0.5 | **−1** (makes Loam) | Dog spots don't harm it. Flowers feed bees. |
| Zoysia | the Dry Summer (week 4) | 0.6 | 40 | 0.3 | 1.0 | Heat-proof. Hates shade. |
| Moss | first fully shaded tile (week 5) | 0.3 | 25, paid as Charm | 0.8 | 0 | Shade only. Never needs trimming. |
| Golden Grass | Tame the Mower | 1.0 | 200 | 0.5 | 0.5 | Ending and post-game only. |

## Critters (befriend)

Every critter wants something. Giving it is the befriend action; after that it helps, and it usually brings a side
effect. Befriended critters stay friends across Mowing Days (they are Discoveries).

| Critter | Wants | Helps | Side effect |
|---|---|---|---|
| Robin | a birdbath | eats grubs | eats seed |
| Earthworms | a compost bin, damp soil | +Loam, aerates (growth +10%) | draw moles |
| Squirrels | acorns (a trade) | plant oaks, return acorns ×1.5 | trees cast shade |
| **Biscuit** (giant dog) | fetch (tap the ball; idle: a Dog-handler gnome throws) | digs out moles; with tricks: trenches, crow chasing, fetching the paper, pulling the lawn roller (a big growth multiplier) | dog spots, holes, the occasional chipped gnome |
| Bees | clover flowers | pollinate: +Charm, golden tiles more likely | none. Bees are just good (a breather) |
| Frog | a puddle you leave on purpose | eats gnats (a week 5 night event) | that tile doesn't grow |
| Crows | bottle caps | bring trinkets (acorns, easter eggs) | steal shiny decor if not befriended |

**Biscuit is the headline friend.** He arrives in week 3 and grows across the rest of the game through tricks (taught
with fetch taps, or slowly with a handler gnome):

1. **Fetch**: the befriend action. Digs out moles on his own.
2. **Stay off**: no more dog spots on the tiles you mark.
3. **Dig here**: irrigation trenches (water spreads to adjacent tiles), and sometimes buried treasure.
4. **Fetch the paper**: the newspaper easter eggs (below), plus a daily acorn.
5. **Chase**: scares off crows and squirrels when told to.
6. **Pull the roller**: rolls the lawn flat, giving a growth bonus that lasts the week.

## Decor

Decor takes up lawn tiles (so it costs income) and gives Charm, plus usually a function. That trade-off is the reason
to think about placement.

| Decor | Cost | Charm | Function |
|---|---|---|---|
| Stepping stones | Clippings | 1 | Gnomes cross the lawn faster |
| Birdbath | Acorns | 3 | Robin |
| Compost bin | Clippings | 0 | Loam converter, worms |
| Hose and sprinkler | Clippings | 0 | Water reach and flow |
| Bird feeder | Acorns | 2 | Distracts the robin; brings squirrels |
| Scarecrow | Clippings | -1 (ugly) | Stops robins and crows; scares both |
| Pink flamingo | Acorns | 5 | Crows want it |
| Gazing ball | Acorns | 8 | Crows want it more |
| Rain barrel | Clippings | 1 | Stores rain for the Dry Summer |
| Flower bed | Loam | 4 | Loam surplus becomes Charm |
| Sundial | Acorns | 3 | Shows the week clock; tap it 7 times for an easter egg |
| Statue of a gnome | Golden Acorns | 20 | It has no hat. The crew won't discuss it. |

## Skill tree (Mulch)

Mulch comes from Mowing Day: **Mulch = floor( sqrt( clippings earned this week / 1000 ) )**.

- **Free respec on every Mowing Day.** Since each week brings different problems, the tree is meant to be re-planned,
  which is a rethink moment of its own. Discoveries (grass, critters, plots) are permanent; tree nodes are not.
- **Lifetime Mulch bonus.** Every Mulch ever earned gives +2% to all production, whether spent or not. Respec never
  costs you this.

Five branches and a capstone. Costs rise about ×3.3 per tier, to match Mulch income rising about ×3.9 per week.

| Tier | Green Thumb (grass) | Crew (automation) | Critters | Weather Lore (water and soil) | Elbow Grease / Long Nap (play style) |
|---|---|---|---|---|---|
| Root | **Rake and Trowel** (1): opens the tree | | | | |
| 1 (2-3) | Deep Roots: growth +25% | Spare Hat: start each week with 2 gnomes | Birdseed in Pocket: the robin comes on day 1 | Big Thimble: tap water ×3 | Firm Grip: taps ×2 |
| 2 (5-10) | Seed Sense: resowing is free | Whistle: gnomes +20% speed | Worm Whisperer: worms ×2 | Rain Dance: an active ability, rain for 20 s | Combo Keeper: combo decays slower. **Or** Long Nap: offline 50% → 100% |
| 3 (15-35) | Overseeding: tiles start the week at 50% | Foreman: auto-hires and auto-assigns jobs (the idle player's key node) | Good Boy: Biscuit keeps his tricks across weeks | Barrel Keeper: rain barrels keep half across weeks | Golden Eye: golden acorns ×2 as often. **Or** Late Riser: the week is 1 day longer |
| 4 (60-90) | Golden Blades: 1% of trims are golden (×10) | Tea Break: gnomes work at night too | Squirrel Treaty: squirrel trades ×2 | Compost Alchemy: compost at 2:1 | — |
| 5 (200-300) | Lawn Stripes: Charm ×2 | Union of the Cap: +1% all per gnome | Bee Line: bees +Charm and +golden tiles | Dry Summer Prep: Dry Summer flow 25% → 60% | — |
| Capstone (500) | **Tame the Mower.** Needs any two tier-4 nodes. Old Saturday becomes rideable on the next Mowing Day, which triggers the ending. | | | | |

The total cost of the whole tree is about 2,000 Mulch. A tapping player has about 1,500 by the start of week 6: enough
for the capstone and a route to it, but not everything. The left-over choices are the replay value.

## Active vs idle

The target is **clicking about 1.7x as fast as idle**, with idle still reaching the ending.

| | Tapping player | Idle player |
|---|---|---|
| Time to the ending | 55-65 min (6 weeks) | 85-100 min (about 8 weeks) |
| Share of income from taps and actives | 40-45% | 0% |

What clicking gives:

- **Tap a tile:** trims it instantly. Pays `max(tile value, 3% of current income per second)`, so taps keep up with
  automation late in the game.
- **Combo:** taps less than 1 s apart build +5% per step, up to +100% (20 taps). It decays after 1 s idle.
  Counted taps are capped at **8 per second**, so mashing and auto-clickers gain nothing, and phone thumbs are as good
  as mice.
- **Golden acorns** drop on the lawn every 60-120 s and last 8 s. A tap gives acorns plus a 30 s boost.
- **Wishes:** blow a dandelion puff for a random 30 s boost (×2 growth, ×3 tap, free water, or "Biscuit is very
  awake").
- **Fetch:** tapping the ball teaches tricks much faster than a handler gnome.
- **Problem clears:** pull weeds, pop puddles, shoo crows by hand, faster than the gnome job.

Idle protection:

- Every tap action has an automation by week 2 at the latest (Trimmer, Waterer, Weeder, then Foreman for jobs).
  Nothing in the ending path needs a tap.
- **Offline:** the week clock stops when the tab is closed, so Old Saturday never comes while you're away. On return,
  the player gets a "while you were away" lump at 50% of auto income (100% with Long Nap), capped at one in-game day.

## Scaling

The numbers that make the hour work. Every value goes in one data file (`src/balance.ts`). The balance sim (below)
checks them, so a tuning change that breaks the hour fails a test instead of a playtest.

### Run pacing (tapping player)

| Week | Length | New problems | Peak income (Clippings/s) | Clippings earned | Mulch (this week) | Lifetime Mulch |
|---|---|---|---|---|---|---|
| 1 | 12 min | 1-5 | ~60 | ~25K | 5 | 5 |
| 2 | 10 min | 6-9 | ~1.2K | ~400K | 20 | 25 |
| 3 | 9 min | 10-12 | ~20K | ~6M | 77 | 102 |
| 4 | 9 min | 13 (+Dry Summer) | ~300K | ~90M | 300 | ~400 |
| 5 | 8 min | 14-15 | ~4M | ~1.2B | 1,095 | ~1,500 |
| 6 | 8 min + ending | 16 | ~50M | (ending) | | |

That is about 56 minutes of weeks plus about 4 minutes of intro, Mowing Day scenes and the ending: **about 60
minutes.**

- **Income grows about ×15 per week.** Roughly: lifetime Mulch bonus ×2-3, a new grass tier ×2.5, tree nodes and new
  critters ×2.
- **Clippings earned ≈ peak income × length × 0.5**, because income ramps up during each week. Use this to sanity-check
  any row.
- **Mulch grows about ×3.9 per week** (it's a square root of ×15). Tree costs rise ×3.3 per tier, so each week buys
  about one new tier.
- **Largest number on screen is about 10^11.** Suffixes are K, M, B, T. No scientific notation in the one-hour game.

### Within a week

Every week should have the same shape:

1. **Fast start (0-2 min).** Carried-over tree nodes and Discoveries make the first purchases instant. It should feel
   like a reward for the last Mowing Day.
2. **Build (2-6 min).** Something to buy or decide about every **45-90 s**. The sim's stall detector fails if the
   player can't afford anything new for more than 90 s.
3. **The wall (about 2/3 of the way in).** The week's new problem lands and income flattens. Solving it is the week's
   big moment.
4. **Payoff (last 2-3 min).** The fix kicks in, income jumps, and the player rings the bell or Old Saturday arrives.

### Purchase curves

| Thing | Price formula | Notes |
|---|---|---|
| Gnome hire | `10 × 1.15^n` Clippings + 1 Acorn | The hat cost keeps the crew small (about 6 gnomes in week 1, about 25 by week 6) |
| Tool tiers (shears, then clippers, then edger; thimble, then bucket, then hose, then sprinkler) | ×10 per tier | Each tier doubles that job's output |
| Same-decor repeats | `base × 1.5^n` | Stops one decor from being spammed for Charm |
| Grass resow (per tile) | `5 × value(grass)` Clippings | Free with Seed Sense |
| Lawn plots (permanent) | Acorns: 4x4 start, then 6x6 (10), 6x9 (40), 8x10 (150) | 80 tiles maximum. Fits a phone at 44 px a tile |
| Job output milestones | ×2 at 5, 10 and 20 gnomes on one job | The classic incremental milestone kick. Hats keep the crew to about 25, so these are reachable |

- **Charm multiplier:** `charmMult = 1 + charm / 50`. In week 2 that is about ×1.2; with stripes, moss and bees in
  week 5, about ×4.
- **Water balance:** each tile drinks `water(grass) × growth` per second. Hose flow is capped at `20 + 10 × tier` per
  second, and the Dry Summer multiplies it by 0.25. `waterFactor` falls off linearly from 1 at full supply to 0.2 at no
  supply, never 0, so no tile dies.
- **Loam balance:** the same shape, with a floor of 0.3. The default compost rate is 10 Clippings to 1 Loam (2:1 with
  Compost Alchemy).

### Post-game (optional)

After the ending the player can keep playing with Old Saturday tamed: Golden Grass, an endless week, and
`Mulch = sqrt` continuing. Nothing new is designed past the ending. It is a sandbox, so the hour stays the product.

## Easter eggs

Small, cheap, mostly from the Yard next door. Each is a line or a sprite, never a system.

- **The paper** (Biscuit's "Fetch the paper" trick). There is one headline a day, from the other games: "Grand
  Zero-Turn still unbeaten", "Combine sighted near the Front", "Local gnome wins Gnomylpics Mower Toss", "Castaway seen
  waving from a lawn at sea".
- **A stray acorn** comes over the fence from the Front: "A Blue Cap's stray shot. Finders keepers." (+1 Acorn)
- **A golf ball** rolls in from Island Links. Biscuit brings it to you, very proud.
- **Lawn Prix karts** buzz past on the road behind the fence, now and then.
- **"A COMBINE APPROACHES."** (week 5, a fake-out banner). It rolls past on the road. "It is not here for you. This
  time."
- **A message in a bottle** in the birdbath, from the castaway (Gnaft).
- **A hatless gnome** appears on the lawn at night. Tap him and he leaves. Teacup: "We don't talk about him."
- **A footprint.** After the third Mowing Day, one tile shows a giant boot print for a day. Nobody mentions it.
- **The pet-door** on the house. Biscuit goes in at dusk. Some nights he won't go near it (Paragnormal).
- **The sundial**, tapped 7 times: the week clock reads "Gnomeday".
- **Biscuit**, petted 100 times: he rolls over, and three gnomes chip.
- **The mowing pattern.** On the final ride, mow a hat shape into the lawn for a secret ending card.

## The ending

The week 6 Mowing Day, with Tame the Mower bought: Old Saturday rolls in, and the crew climbs on. The player steers for
about 60 s, mowing stripes across the whole lawn (tap or drag to steer). The sign changes to **Yard of the Year**, the
camera pulls up to show the whole Yard (the Panic Yard, the road and the Front in the distance), and Biscuit falls
asleep in the shade. A short credits card follows, then the post-game sandbox.

Loose threads left open on purpose: who starts Old Saturday, who gives the award, whose boot print that was.

## Screens and controls (mobile first)

```
 portrait 390x844                       landscape
┌──────────────────────┐   ┌──────────────────────────────────────┐
│ ☀ Tue  ▓▓▓░░░  🔔    │   │ ☀ Tue ▓▓▓░░ 🔔 │ Crew  Lawn  Critters │
│ ✂ 12.4K  💧 82  🟤 40 │   │ ✂12.4K 💧82 🟤40│ ──────────────────── │
│ 🌰 7   ✨ Charm 18    │   │ 🌰7 ✨18        │ Trim     ●●●○  [+][-] │
├──────────────────────┤   ├────────────────┤ Water    ●●○○  [+][-] │
│                      │   │                │ Weed     ●○○○  [+][-] │
│   lawn grid 8x10     │   │  lawn grid     │ Compost  ●○○○  [+][-] │
│   44px tiles         │   │                │                      │
│   (tap = trim/clear) │   │                │ [Hire gnome  58 ✂ 1🌰]│
│                      │   │                │                      │
├──────────────────────┤   └────────────────┴──────────────────────┘
│ Teacup: "Grubs. In   │
│ the Bluegrass. Lovely"│
├──────────────────────┤
│Crew Lawn Critter Decor Tree│
└──────────────────────┘
```

- The lawn grid sits in a Phaser canvas. The panels are DOM, appended to the shared `#ui` container (never restyle
  `#ui`).
- Every action is a tap target of at least 44 px. There is no hover-only information: tooltips open on tap and hold.
- Safe-area insets on the top bar and the tab bar. Portrait puts the panels below the lawn; landscape puts them beside.
- Keyboard shortcuts are optional extras (1-5 for tabs, space to blow a wish); everything has a touch equivalent.
- Decor placement: tap the decor, then tap a tile. No dragging required.

## Tech plan

- **Folder:** `games/incregnomtal`, made with `npm run new -- incregnomtal`. It uses Vite, TypeScript and Phaser (the
  repo default). Phaser handles the lawn, the critters and the particles; DOM handles the panels.
- **A pure sim:** `src/sim/` is plain TypeScript with no Phaser and no DOM. It has `tick(state, dt)`, `act(state,
  action)` and `mowingDay(state)`. The game renders the sim state; the balance sim runs the same code headless. This is
  the module that must not get tangled in `main.ts`.
- **Data:** `src/balance.ts` holds every number in this doc (grasses, curves, problems, tree nodes). Problems are data
  rows `{ id, week, trigger, tell, effect, fixes[] }`, so adding a problem means adding a row, not new code.
- **Tick:** the sim runs at 10 Hz. Rendering is interpolated. Offline catch-up runs the sim in 1 s steps, capped.
- **Save:** `localStorage` key `incregnomtal.save.v1`, autosaved every 10 s and on `visibilitychange`, with a version
  field and a migration hook, and an export/import string in settings. Every read and write is in try/catch, and the
  game runs without saving if storage is blocked.
- **Balance sim:** `npm run sim -w games/incregnomtal` runs two bots over the real sim:
  - a **clicker** (8 taps/s on the best tile, takes golden acorns, buys the best value per price)
  - an **idle** player (no taps, buys the best value per price every 30 s, takes Foreman as soon as possible)
  It prints the run pacing table above. `npm test` asserts the guard rails:
  - the clicker reaches the ending in 50-65 min
  - the idle player reaches it in 80-110 min
  - no stall longer than 90 s
  - no problem takes more than 40% of income
  - every problem is fixable with what the player owns when it triggers (no soft-locks)
  - the largest number stays under 10^12

## Party slice and online

- **Party slice: `lawn-clip`.** Four gnomes on one shared 8x8 lawn for 30 s: tap to trim tiles as they grow, pull
  dandelions, and the most Clippings wins. It reuses the sim's tile growth and trim code. It fits the size rules (a
  round of 20-60 s, four players at once, one verb), but build it after the main game proves fun. Add a backlog row in
  `packages/party/README.md` when the game folder is created.
- **Online: not in the first build.** An incremental is a solo, long-session game, and real-time play through
  `@lawn/mp` doesn't fit one hour of solo pacing. It would roughly double the size. A later, cheap fit is **visiting**:
  a friend's lawn shows up as a read-only page, and you can leave one gift (an acorn, or a wish). Revisit it once the
  solo game is fun.

## Assets

Everything is generated in code at first: flat-shaded tiles (each grass type a different green and texture pattern),
simple shape sprites for gnomes, critters and decor, and procedural particles for clippings, water and dandelion
fluff. Sounds come from a tiny WebAudio synth (snip, splash, pop, bark). Any CC0 pack added later gets a line in
`games/incregnomtal/CREDITS.md`.

## Build order (for decompose)

A suggested epic split. Each epic ends playable.

1. **Bare lawn.** The sim core (tiles, growth, water, trim), Clippings, the grid rendering, taps, and the save. Is
   tapping grass to grow it satisfying for 2 minutes?
2. **Crew and week 1.** Gnomes and hats, jobs, tools, dandelions and wishes, the hose and puddles, the week clock,
   Mowing Day, Mulch.
3. **Skill tree, balance sim and week 2.** The tree with respec, Loam and compost, grubs and the robin, Ryegrass,
   Fescue and Bluegrass, the sim bots and the guard-rail tests.
4. **Critters and week 3.** Squirrels, trees and shade, moles, Biscuit and his tricks, decor placement.
5. **Weeks 4-6.** The Dry Summer, clover, Zoysia, moss, bees, crows, the capstone, the mower ride and the ending.
6. **Easter eggs, the lore entries and ruling, and the polish pass.** Mobile checks at 390x844 and in landscape.

Playtest after epics 2 and 3 before going on. If week 1 isn't fun, the rest won't save it.

## Open questions

- Is a 12-minute first week too long for a first impression? The alternative is a 5-minute "tutorial week" that ends
  in a forced Mowing Day.
- Should the shed bell (calling the mower early) be allowed from day 1? That suits experienced replays, but it risks
  early-prestige spam that breaks the pacing.
- Is free respec too generous? Watch whether players actually rethink, or just rebuy the same path.
- Should Biscuit's name be chosen by the player? The hat colour already is.
