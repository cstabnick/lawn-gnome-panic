# The Hatless: zombies as a large system

A cracked gnome that grey moss gets into stands up again. Its hat falls off first (core fact 6: a gnome without a hat
is hiding something); the moss grows over the face and down the coat. The Hatless are slow, they don't think, and they
come in numbers. They are not evil (house style: every pest wants something). The moss wants **warm, wet clay to
grow in**, and it walks its hosts toward warmth, noise and other gnomes.

## One Hatless, up close (L0)

| Stat | Value | Note |
|---|---|---|
| Speed | shamble 1.2 gm/s, lunge 4 gm/s for 1.5 s | spring Hatless are faster, frost Hatless slower |
| Senses | hearing (main), sight 25 gm in a narrow cone, scent along trails | half sight in fog and at night |
| Attack | grab and scratch; a scratch may put moss in a crack | being grabbed by two or more stops you moving |
| Toughness | must have its **core** cracked (head or chest), limbs can be knocked off | a legless Hatless crawls |
| States | idle (swaying), drawn (moving to a stimulus), hunting (has a target), feeding (on a shattered gnome), dormant (frost) | |

Variants come from the gnome they were, not from a monster list: a Hatless that was a raider still wears armour, one
that was a farmer has a rake. A shattered player rises with all of their gear.

## Height

- **They can't climb.** A Hatless gets over a grave kerb (1.6 gm) and nothing higher, so every Low or High place is
  safe from a single Hatless.
- **They pile.** Against a wall with a target above, Hatless climb on each other: each extra body adds about 0.6 gm, up
  to 3 gm (5 bodies deep). A pile is noisy and slow, and it falls apart in a few seconds once the target is gone. Piles
  are how a herd reaches row 1 of the Columbarium, and why havens start at 15 gm.
- **They fall.** Hatless walk off edges and into holes. `PIT` zones (the Sinks, the New Hill graves, the drain) collect
  them; a pit fills up over weeks and, when it is full, the top layer can walk out over the others. Pits are the map's
  natural horde sinks and a tool for anyone who can steer a herd.
- **They flow down.** On slopes, the horde field moves faster downhill. Chapel Rise and the Hill shed their herds
  toward the Yew Walk and the New Hill.
- **Up is safer, not safe.** So high ground doesn't become a bunker for the whole mid-game:
  - **Ivybound**: Hatless that rose in ivy (the Old Rows, Wreathwood) have ivy grown through them and **can climb ivy
    and ropes**, slowly (0.3 gm/s), and only those routes. About 1 in 20 in those districts, more each season.
    Burning or cutting the ivy routes is a real defence choice.
  - **Moss creeps up.** Each season, moss climbs walls and stone that nobody scrapes (5 gm a season). Mossy high places
    get the `MOSSY` trait, and a mossy route can be climbed by Ivybound.
  - **Exposure**: high places are windy (Warmth −15 above 15 gm, −30 above 80), and lightning in storms strikes the
    highest point in a region (the Spire, obelisks, tall stones).
  - **Magpies**: real garden birds, hungry and nesting (house style: every pest wants something). They raid high places
    for shiny things (keys, coins, relics, glass), knock gnomes off edges, and nest in the yews and on the Spire.
  - **Other gnomes** use height too: raiders hold roofs, snipers sit on obelisks.
- **Underground**, the Hatless sleep in large numbers (the Catacombs), wake to noise, and move along the passages. A
  fight in the Catacombs echoes (`ECHO`) and can wake a whole level.

## The horde as a field (L1 and L2)

Far from players, the Hatless are not agents. They are a **density field** on the region graph.

- Each region holds `H[r]`, the number of Hatless in it, plus a small set of **herd tokens** (groups of 20–500 that
  move as one).
- Every L2 tick the field moves by **advection + diffusion**:
  - **Attractors** set a potential `P[r]`: noise heard in the region (gunfire, fights, sprinting, building, a mower
    rumble), warmth (compost, fires, settlements), gnome scent density, and the moss's home ground (the Potter's Field).
  - Hatless flow down the potential gradient across edges, scaled by the edge's travel cost.
  - Diffusion keeps them spreading even when nothing is pulling them.
  - Noise decays fast, scent slowly, warmth not at all, so herds drift toward settlements over days and surge toward
    gunfire over minutes.
- **Herds** form where density is high: when `H[r]` passes a threshold, a herd token splits off and follows the
  strongest attractor along the graph. Herds merge when they meet. Herd sizes come out heavy-tailed: many small groups,
  a few enormous ones. The enormous ones are world events.
- **Growth and decline.** The Hatless count rises when gnomes shatter in moss (NPCs, players). It falls when Hatless
  are destroyed (cores cracked, fire) and by **crumbling**: the moss eats the clay it lives in. Each world-day a
  Hatless loses condition (faster in dry summers, slower in wet springs) and crumbles to `moss-clump` and shards after
  about 2–4 seasons (seeded per Hatless). Each region also has a **carrying capacity** (warm, wet zones hold more); past
  it, crumbling speeds up. So the horde is not a ratchet: without new victims it slowly shrinks. Frost puts some to
  sleep (dormant, not destroyed). There is no spawning out of nothing. The total is a world stock that
  [evaluation.md](evaluation.md) tracks.
- **Moss spread.** Separately, the moss itself spreads over regions as a slow field (wetness and warmth help it, salt,
  fire and `weed-killer` push it back). Gnomes in mossy regions get infected more easily from cracks. Settlements
  clear the moss around them, which is visible on the map as a pale ring.

## Moving between levels

- When a region turns L1, its `H[r]` becomes groups of 3–15 placed in the region's high-scent and noisy spots.
- When a chunk turns L0, groups become individual Hatless with full bodies. There is a per-device budget
  (desktop 300, phone 120 visible at once); past it, more distant ones are drawn as a cheap instanced crowd without
  their own AI, and the count stays right.
- Moving down adds them back. A test checks that the sum over the world never changes because of LOD.

## Big events the system makes by itself

- **The Drift**: a herd of 500+ slowly crossing several districts, pulled by a big settlement's warmth. It may take
  days. Factions see it coming and react (fortify, flee, ask for help, or steer it into a rival with noise).
- **Bloom season**: in spring, moss growth and lunge speed peak. Outbreaks inside settlements are most likely.
- **The Fall of a settlement**: when the Hatless pushing on its walls beat its defence, it falls. Its gnomes run
  (becoming lone wolves and packs) or shatter (more Hatless). Its stockpiles are left lying there: a loot rush.
- **Steering**: noise is a tool. A player (or a clever faction) can ring a `signal-horn` or light a smoky fire to pull
  a herd somewhere. Steering a herd into a rival's walls is the most powerful and most dangerous thing in the game.
