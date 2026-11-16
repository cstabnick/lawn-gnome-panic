Epic: 6, The Verge and the Battle of the Verge
Depends on: none

## Goal
All the data for the Battle of the Verge: the Mower's parts as enemies, the battle quest, the phase objects, the Kiln-fired rewards and the epilogue lines.

## Read first
- `docs/design/gnomomia/quests.md`, Chapter 8 (all)
- `docs/design/gnomomia/bestiary.md`, "The Mower (boss sheet)"; `items.md`, Kiln-fired items
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; verge layout: `battlefield` 0,-60,35, `the-shed` 0,-125)

## Change
`src/data/packs/ch8-finale.ts`, prefix `c8-`, zone `verge`.

### Enemies (canonical; all `rank: 'final'`, family `metal`, `respawnSeconds: 0`, `aggressive: true`, level 32)
| Enemy | HP override | Model | Notes |
|---|---|---|---|
| `mower-wheel` | 1500 | `metal`, black, scale 2 | |
| `mower-deck` | 12000 | `mower`, red `0xb32a20`, scale 12 | Moves below |
| `mower-heartspark` | 6000 | `metal`, white, scale 1.5 | Its `examine` says rain hurts it most. mower.ts doubles rain damage on it. |
| `mower-rope` | 1000 | `straw`, scale 1 | family `plant` |

`mower-deck` moves:
- Blade Sweep (ring, radius 9, damage 2.2, telegraph 2)
- Chute Blast (cone, radius 12, damage 1.1, telegraph 1.5)
- Belly Spill (summon 4 `grass-bag-moth`, every 25)
- Black Dew Cloud (pool, damage 0.3, poisoned)
- Rolling Charge (lane, length 40, width 6, damage 3.7, telegraph 3)

There are no spawn groups: mower.ts spawns everything.

### Objects (shown by flag `c8-phase`, which mower.ts sets)
- `c8-valve-head` (valve at (-20,-45), verb Open, when `c8-phase=mud-open`).
- `c8-stone-socket` (stone at (0,-68), verb Jam the Stone, when `c8-phase=jam`).
- `c8-stake-point` (post at (0,-64), verb Drive the Stake, when `c8-phase=heart`).
- The `c8-phase` values mower.ts uses are `ready`, `mud`, `mud-open`, `jam-wait`, `jam`, `heart`, `heart-wait` and `done`.
- Barricades: 3 `post` objects with verb Brace at (-15,-20), (0,-22) and (15,-20), with no `when`. They're scenery that mower.ts damages.

### Quest `c8-turning-blade` (finale, level 30, giver `c7-marigold`)
Unlocks after `c7-the-level` is done. Stages:
1. reach verge (0,-40, r 20).
2. `interact c8-valve-head`.
3. `interact c8-stone-socket`.
4. `kill mower-heartspark`.
5. `talk c7-marigold`.

Stage texts come from quests.md phases 1-3. Reward: one Kiln-fired item by class. Give all three items (`c8-blade-breaker`, `c8-heartspark-sling`, `c8-spigot-staff`) to every class, since rewards can't be class-gated; the journal text says "take the one that fits your hand". Also give 500 gold.

### After the battle
- Add `extraNodes` and `greetingsFirst` for `fernwick` ("My knees have stopped hurting. First time in a month. Thought you should know.").
- Keep the stub's `export const EPILOGUE: readonly { when?: Condition; text: string }[]` (fill it) with one line per region beat from quests.md "Ending" and the storylines README effects table. ui/epilogue.ts reads it by importing this file directly.

## Done when
- The content-pack done-when in the common section.

## Out of scope
mower.ts, ui/epilogue.ts.
