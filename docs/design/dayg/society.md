# Society: NPCs as organisms

The goal: gnomes who look after themselves first, and whose choices **add up** into lone wolves, packs, settlements
and factions that have power, without us scripting any of it.

## The NPC

```ts
interface Npc {
  id: NpcId; look: GnomeLookCode;  // shown through @lawn/gnome resolveLook
  traits: Traits;                  // fixed at birth, inherited loosely by gnomes they teach
  needs: Needs;                    // same needs as the player (survival.md)
  body: BodyState; skills: Skills; inventory: ItemState[];
  memory: Memory;                  // relationships, places, events
  groupId?: GroupId; role?: Role;
  plan: Plan;                      // what they are doing now and why
}

interface Traits {                 // each 0..1, drawn from seeded distributions
  sociability: number;   // how much belonging matters; the main lone-wolf ↔ joiner axis
  boldness: number;      // risk taking
  greed: number;         // hoarding and taking vs sharing
  loyalty: number;       // how slowly trust breaks
  empathy: number;       // helps strangers, takes in the bitten
  paranoia: number;      // how fast trust is lost, how many watches they want
  ambition: number;      // wants status, wants to lead
  industry: number;      // builds and farms vs scavenges and raids
}
```

### Memory and trust

Each NPC keeps a small ledger (capped, the weakest entries forgotten) of other gnomes and groups:

- `trust` (−1..1), `debt` (what they owe or are owed), `grudge` (a named wrong), `lastSeen`, `knownSkills`.
- Trust moves with what they **see or hear**: shared food (+), a watch kept (+), a broken deal (−−), theft seen (−−),
  being left behind in a fight (−−−). Rumours pass ledger entries along between gnomes with a discount, so a
  reputation travels faster than its owner.
- Places: known caches, loot that has been taken, safe spots, where a herd was last seen. This is how NPCs make maps
  (and how a player can buy one).

### Deciding: utility with self-preservation on top

Every L1 tick (every L0 second near players) an NPC scores the actions available to it. **Self-preservation is a hard
filter, not a weight**: an action whose expected chance of shattering is above the NPC's boldness-scaled limit is
dropped before scoring. Inside that, score = Σ need relief × urgency + trait bonuses − risk × (1 − boldness).

Action families: forage, scavenge (a known loot site), drink, eat, rest, build, farm, trade, travel, hide, flee,
fight, raid, steal, recruit, join, leave, betray, follow an order, teach, take a watch.

**Getting there is not the goal; staying alive is.** Most NPC deaths should come from bad luck, bad information and
bad company, not from NPCs walking into obvious danger. [evaluation.md](evaluation.md) measures "stupid deaths".

## Why gnomes group up

Being in a group has **gains** and **costs** that every NPC weighs against being alone:

| Gain | Cost |
|---|---|
| watches at night (rest without fear) | sharing food and loot (greed hates it) |
| more fighters against Hatless and raiders | a bigger signature: more noise, smoke, scent |
| splitting work (forager, builder, guard) | more mouths: food need grows with size |
| teaching skills | orders from a leader (ambition hates it) |
| belonging (sociable gnomes need it) | risk of betrayal (paranoia hates it) |

An NPC joins when the expected value of the group beats being alone by a margin, and leaves when it stops. Because
the gains grow slower than the costs past a point, **group size has a natural ceiling** that depends on the environment
(rich land and safe walls support bigger groups). That ceiling is what makes the three modes all happen at once:

| Mode | Size | Who | How it holds together |
|---|---|---|---|
| **Lone wolf** | 1 | low sociability, high paranoia, or cast out | nothing; they trade at the edges and hide |
| **Pack** | 2–8 | most gnomes in hard country | trust between each pair (everyone knows everyone) |
| **Band** | 9–25 | a pack that grew around a good site | a leader whose status holds it; one rule (share food or not) |
| **Settlement** | 25–120 | a band that holds a defensible place with a food source | roles and **norms**: a few rules that punish breakers |
| **Polity** | several settlements | one settlement that dominates others | tribute, an envoy, shared enemies |

A group past its ceiling gets strained: trust between members who barely know each other is low, and a faction forms
inside it. It either splits (**fission**), throws someone out, or turns into the next mode by growing institutions.
That is the main source of new factions.

### Norms and institutions

A group of 9+ starts picking up **norms**, each one a rule plus what happens if you break it. Norms are chosen by the
leader's traits and by what went wrong recently (after a theft they adopt "thieves are cast out"):

- Sharing: everything shared / a tithe to the store / each keeps their own.
- Strangers: welcomed / questioned at the gate / turned away / robbed.
- The bitten: nursed and watched / cast out / shattered at once.
- Leadership: the strongest / chosen by the council / the founder's line.
- Violence: never first / against raiders only / anyone outside.

Norms set the faction's **ideology** on a few axes, which decides its friends and enemies:

| Axis | One end | Other end |
|---|---|---|
| Openness | open gate | closed walls |
| Property | commune | hoard |
| Order | council | strongest rules |
| Means | farm and build | raid and scavenge |
| The moss | it is a sickness, cure it | it is the garden's will, live with it (the **Greybearded**, who let moss grow in their beards) |

## Factions and power

```
power = members^0.8 × arms × walls × (1 + ln(1 + stockpileDays / 30)) × morale × rep
rep   = 0.5 + 0.5 × (meanStanding / 100)        // 0..1; standing is −100..+100 (quests.md)
```

The stockpile term **saturates** (a huge cache helps less and less), and every term has a cost that grows with it:
members eat, walls need mending, arms need ammo, and a big faction's signature pulls herds. **Upkeep** is
`0.05 × power^1.2` meals-equivalent per world-day, so power past a point costs more than it earns. Territory is
capped by patrol reach: a faction can only hold regions within one world-day's walk of a settlement it holds.

Power is not a number we set; it is computed from things in the world the player can change (kill a member, steal the
stockpile, break a wall, spread a rumour). It decides **territory** (regions where the faction's patrols go, its claim
on containers and gardens, and where it collects tolls).

What factions do with it, each a plan run by the faction's leaders on the L2 tick:

- **Expand**: send a party to claim a new region, plant gardens, build an outpost.
- **Trade**: set up a caravan route ([economy.md](economy.md)).
- **Ally**: with factions of close ideology against a shared enemy or a coming Drift.
- **Demand tribute**: from weaker neighbours, under threat.
- **Raid**: take a rival's caravan or stockpile when the expected loot beats the expected losses.
- **War**: repeated raids aimed at breaking a rival. Ends in a truce, a merger, absorption, or a Fall.
- **Schism**: an ambitious member with enough trust inside takes a share of the members away.
- **Collapse**: when morale and food fall too far, the faction dissolves into packs and lone wolves.

### Dynamics we want (and will measure)

- Factions are born and die. A few last the whole run, most don't.
- No faction stays on top for good: a big faction gets a big signature (Hatless come), big costs, and more internal
  strain. The leader position changes hands.
- Weak factions band together against a strong one (balancing).
- Some seeds end with one big polity, some stay many small factions, some become a wasteland of packs. All three
  happen at sensible rates across seeds ([evaluation.md](evaluation.md)).

## At L2: the aggregate rules

The headless sweeps run far from players at L2, where there is no per-NPC tick. Society there runs on these rules
(each one fitted from L1 runs, and checked against them by the LOD equivalence test in [evaluation.md](evaluation.md)).
NPCs keep their full state at L2: these rules decide what happens to them each sun-hour tick, in a batch.

- **Group value.** For a group of size `n` in zone `z`:
  `V(n) = safety(n, z) + work(n) + belonging(n) − share(n) − signature(n, z) − strain(n)`, with
  `safety = S_z × (1 − e^(−n/4))` (watches and fighters, saturating), `work = w × min(n, roles) `,
  `share = f × n` (food split), `signature = σ_z × n^0.7` (pulls Hatless), `strain = k × max(0, n − D)^2` where `D` is
  the leader's trust reach (about 8 + 2 × Leadership, the gnome Dunbar).
- **Joining and leaving.** Each tick, an NPC alone in a zone joins a group within reach with probability
  `p_join = sigmoid(a × (V_i(n+1) − V_alone) + b × sociability − c × paranoia)`. A member leaves with
  `p_leave = sigmoid(a × (V_alone − V_i(n)) − d × trust_in_group)`. `V_i` weights the terms by the NPC's traits
  (greed weights `share`, paranoia weights `strain`).
- **Equilibrium size.** `V` rises then falls with `n`, so its peak `n*(z)` is the size groups drift toward: small in
  open, poor zones (packs), large in rich, defensible zones (settlements). Five modes come out of the spread of
  `n*` over zones and of traits over NPCs; the metrics count all five (alone, pack, band, settlement, polity).
- **Fission.** Each world-day, a group with `n > D` splits with probability `q × (n − D) / n`, the splinter taking
  the members who trust the ambitious member most.
- **Packs below three** (Allee effect): a pair has no proper watch rota, so its safety term is halved. Pairs either
  grow or break, which keeps "lone wolf or pack" a real choice.
- **Faction plans** run on rates: each world-day a faction picks one plan by softmax over plan scores (expected gain
  in power minus expected losses, from the same `V` and `power` terms). Raids, wars and alliances are resolved with
  the fitted L1 outcome tables.
- **Rumours** at L2 spread along the region graph: each world-day a ledger fact spreads to a neighbouring settlement
  with probability `r × contact`, where contact is trade and caravan traffic between them.

## Raiding has costs

So that raiding can't simply win the Squeeze:

- **Retaliation**: a raided faction remembers the raiders (a grudge on the whole faction) and its raid and war plans
  against them get a bonus.
- **Lost trade**: traders and caravans route around raider territory, so raiders' own markets dry up; outside traders
  **blacklist** a faction that robbed them (no trade with it for a season).
- **No food of their own**: raiders don't farm, so once there is little left to take, a raider faction starves,
  turns settler or breaks up. The evaluation tracks the raid-to-trade income ratio by faction type.

## Where the player fits

The player is just another gnome to the simulation: they have a ledger entry in every NPC who has met them, a
reputation that travels by rumour, and they can join, lead or wreck a group by the same rules NPCs follow. See
[quests.md](quests.md) for how that is presented.

## Named founders (seed starting points)

Names follow the core house style (plant first names, soil-and-tool surnames). A seed picks 2–4 of these as founders,
with their traits pushed to the extremes; the rest of the population is generated.

| Founder | Leans | Their faction usually becomes |
|---|---|---|
| Sexton Yarrow Gravelpot | ordered, open, builder | the **Lantern Keepers**, a council settlement in the Columbarium |
| Nettle Rustspade | strongest-rules, raider | the **Rusted Spades**, raiders working the Yew Walk |
| Old Mother Comfrey Kilnworth | commune, empathy, cure the moss | the **Kiln Sisters**, healers and glazers |
| Thistle Stonewort | closed walls, hoard | the **Crypt Holders** of Mausoleum Hill |
| Lichen Ashbucket | live with the moss | the **Greybearded**, who walk among the Hatless (they rarely get bitten; why is a loose thread) |
