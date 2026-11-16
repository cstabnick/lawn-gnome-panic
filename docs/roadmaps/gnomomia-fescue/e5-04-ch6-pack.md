Epic: 5, Hedgewood and the Rockery
Depends on: none

## Goal
Chapter 6, "Stone", is playable: Flintdelve, the humming Shard seam, Dowager Mudtooth, the Unfired, the Kiln Warden who kneels, firing the new Stopping Stone, Gnorwin's Trowel, the clay seals, and Gromwell in the Backflow.

## Read first
- `docs/design/gnomomia/quests.md`, Chapter 6 (all)
- `docs/design/gnomomia/places-and-people.md` §6 and §3a (the Backflow row)
- `docs/design/gnomomia/bestiary.md`: the Rockery table and the Backflow rows. `items.md`: the Rockery row, the named drops (Kiln Warden's Heart, Gromwell's Valve-Key, Gromwell's Last Seal, Hammerclod's Pick) and Gnorwin's Trowel.
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; rockery and deeps layouts)

## Change
`src/data/packs/ch6-rockery.ts`, prefix `c6-`.

### NPCs (zone `rockery` unless noted)
- Canonical: `hammerclod sedum grout cobalt mudtooth`.
  - Cobalt is the Flintdelve smith (Shard-iron gear, ilvl 20-23).
  - `mudtooth` is a mole (`model: 'mole'`, scale 2) in `mudtooth-deeps`, hidden while `flag mudtooth=lie`.
  - Add a Warden `trainer` (`c6-delver-trainer`) in Flintdelve.
- Leaf raft: a dock NPC `c6-raftwright` at `raft-dock` with a `travel` option to thatchford (-30, 20).

### Enemies
- Rockery (canonical): `earwig gem-beetle rock-louse rockery-centipede deep-mole dowager-mudtooth kiln-guardian unfired kiln-warden`.
  - `deep-mole` spawns only while `not: { flag: { name: 'mudtooth', value: 'trust' } }`.
  - `dowager-mudtooth` (miniboss) spawns only while `flag mudtooth=lie`.
  - `unfired`: family `unfired`, model `clay`, `lastWords` a sigh ("Oh.").
  - `kiln-warden`: boss with moves Kiln Heat (ring, burning) and Reshape (summon 2 `unfired`). Its `lastWords: "Clayfoot."` Make it `fired` family, scale 3.
- Backflow (canonical, zone `deeps`): `rust-crab drowned-pipewright gromwell`.
  - `gromwell`: boss, `fired`, moves Valve Wrench (cone), Pressure Burst (cone, soaked) and Seal the Room (pool, below 0.3). `lastWords: "Is it dry up there? Good. Good."`
  - Drops `valve-key` and `c6-gromwells-last-seal`.

### Main quests
`c6-new-stopping-stone`, `c6-humming-seam` (interact a `c6-shard-wall` object), `c6-honest-words` (choice flag `mudtooth` = `trust` | `lie`; needs `mole-crown` in inventory to choose truth), `c6-the-unfired`, `c6-kiln-warden`, `c6-firing-the-stone` (defend at `kiln`, 120 s, waves of `unfired`; gives `stopping-stone`), `c6-down-the-drains` (zone deeps; interact 3 `c6-clay-seal-*` objects in `backflow`), `c6-clay-seals` (choice flag `potsworth` = `exposed` | `confessed`; *confessed* needs `gromwell-notes`), and `c6-who-holds-the-valve` (finale; kill `gromwell`, turn in to `ida`). `c6-new-stopping-stone` unlocks after `c5-heartwood` is done.
- **`c6-who-holds-the-valve` stages:**
  1. `choice` on flag `c6-ida-speaks` (`yes` | `no`), asked by Ida (owned by ch3; use `topics`/`greetingsFirst`): "Let me come down with you. Let me talk to him." / "Stay up here, Ida."
  2. `kill gromwell`. If `c6-ida-speaks=yes`, a `c6-ida-below` NPC (Ida's look) stands at `great-valve` (`hidden: { not: { flag: { name: 'c6-ida-speaks', value: 'yes' } } }`), and Gromwell's `examine` text and the stage text say she is talking to him while you fight.
  3. `talk ida` (turn-in). Her lines differ by `c6-ida-speaks`: yes = "He heard me. At the end, he heard me."; no = "You should have let me come."

  It is one quest, tier `finale`, so the canonical id stays the gate for the Verge exits.

### Side quests
`c6-brambles-old-master` (canon; storyline 14 extends it), `c6-gnorwins-trowel` (after `c6-kiln-warden` done: talk Cobalt with `rusty-trowel` in inventory, `takeItem` it, give `gnorwins-trowel`: Kiln-fired, Slash, ilvl 24, `effect: '+50% damage against the Mower'`), `c6-raft-down-the-hose` (reach the thatchford brook after using the raft), and `c6-path-home` (needs `c2-forty-list` set; interact the `c6-pipewright-roll` object in `backflow`, then talk `thistle`).

## Done when
- The content-pack done-when in the common section.

## Out of scope
Zone files, storyline packs s05, s06, s11, s12, s14.
