# Gnomes of Gnomomia: raids (horn calls) and reforging

Design note for raids and reforging in `games/gnomes-of-gnomomia`. Plan: [docs/roadmaps/gnomomia-rebalance-raids.md](../../roadmaps/gnomomia-rebalance-raids.md). Lore: [horn calls](../../lore/entries/fescue/horn-calls.md) and [horn-marked gear](../../lore/entries/fescue/horn-marked-gear.md).

## What a horn call is

A horn call is a fight too big for one gnome. A Reeve hangs a horn on a post where a pest has grown too big or too many. Whoever blows it gets every Wayfarer in earshot: up to three helpers, a tank, a healer and a damage dealer. Each raid is a boss plus waves of adds in an open arena, aimed at a 2-3 minute clear.

## Unlock

Raids open when Chapter 2's finale, **A Letter for the Queen** (`c2-letter-for-the-queen`, Thatchford), is done. That unlocks every horn post (`RAID_UNLOCK` in `src/data/raidTuning.ts`). Each horn refuses players below the raid's minimum level.

## The five raids

Arena spots are 15 m circles, fully open on the terrain and clear of towns, ambient spawns and NPCs. Coordinates are zone-local.

| Raid id | Zone | Level / min | Arena (x, z, r) | Boss | Adds | Drops (ilvl) | Reforged at |
|---|---|---|---|---|---|---|---|
| `raid-keep` | Birdbath Keep | 12 / 10 | (-40, -30, 14), west lawn below the Archive | Murmur, the Starling Mother (winged) | starlings | 13 heirloom | Sodbury (ilvl 17) |
| `raid-clover` | Cloverfield | 16 / 14 | (-80, -20, 14), Honeydew Ranch silos | Grainsack, the Field-Mouse King (furred) | harvest mice | 17 heirloom | Clippings (ilvl 21) |
| `raid-hedge` | Hedgewood | 20 / 18 | (-65, -40, 14), under the Elder Privet | Ironhorn, the Old Stag (shelled) | young stags | 21 heirloom | Flintdelve (ilvl 25) |
| `raid-rock` | The Rockery | 24 / 22 | (65, -45, 14), below the Shard Mine | Clinkerback, the Seam Centipede (shelled) | rock-lice | 25 heirloom | Last Tuft (ilvl 30) |
| `raid-verge` | The Verge | 29 / 27 | (-70, 55, 14), the western Shorn | Old Sump, Rust-Rat of the Oil Drum (metal) | sump rats | 30 kilnfired | top tier |

Horn posts (zone-local): Keep (-40, -16), Cloverfield (-80, -6), Hedgewood (-65, -26), Rockery (65, -31), Verge (-70, 69).

## The flow

1. **Horn.** The player blows the post's horn. The raid's seats are filled (see the party hook below). The intro line plays in chat.
2. **Countdown.** 5 s (`pullDelaySeconds`).
3. **Pull.** The boss spawns at the arena centre at 0 s. Adds spawn on the arena edge at 20, 60 and 100 s (the waves in each raid's pack).
4. **Fight.** The raid is won when the boss dies. The HUD shows the timer, boss HP, the seats and one 44 px Leave button.
5. **Win.** Each listed drop rolls `dropChance` = 1 in 5 (`RAID_TUNING.dropChance`). The player is paid coins (`ECONOMY.raid.clearGold` x coin multiplier) and XP worth 8 normal kills of the raid's level (`ECONOMY.raid.clearXpKills`). Helpers linger 6 s, then go.
6. **Loss.** The player dies, leaves the arena by more than 10 m (`leaveMargin`) for 8 s (`leaveGraceSeconds`), runs past 6 min (`maxSeconds`), or presses Leave.

Target clear time from the pull: 120-180 s (`RAID_TUNING.targetSeconds`), checked by `sim:raid`.

## Helpers

Helpers are Wayfarers who answer the horn. Built with `createGnomeModel`, they are local to the client that blew the horn and are not relayed online.

| Role | Classes | Job |
|---|---|---|
| Tank (Warden) | warden | holds the beast, stands on it |
| Healer (Hedge-Mage) | hedge-mage | heals the lowest ally below 75% HP |
| Damage (Slinger) | slinger | shoots the boss or the adds |

Numbers live in `RAID_TUNING.helper` (`src/data/raidTuning.ts`): damage per swing in units of `avgHit(level)`, max HP, range, heal size and timing, and revive after 20 s at half HP. Pure decisions (swings, heals, downs) are in `src/raidHelperLogic.ts`, which the combat arena (`src/sim/arena.ts`) shares.

Enemies can fight helpers. Their target ids are `RAID_HELPER_TARGET_BASE - n` (`-1000 - n`, n = helper index), which are also below `COMPANION_TARGET_BASE`, so every local-AI check treats helpers like companions. Targets are registered with `setTargetSource('raid-helpers', ...)` in `src/entities.ts`.

## Party hook

Seats are decided by `seatRaid()` in `src/raidRoster.ts`:

- The player always takes a seat.
- A real party member within `RAID_TUNING.partyRange` (30 m) of the horn takes a seat, when a party system is plugged in.
- Helpers fill every seat that no party member takes, up to `RAID_TUNING.seats` (4, including the player).

The party system plugs in with `setPartySource({ members() })` in `src/raidRoster.ts`, where `members()` returns `RaidPartyMember[]` (`src/raidTypes.ts`). Until it does, every free seat is a helper. Seats are reported by the `raid-started` event (`{ raidId, seats }`), and the outcome by `raid-ended` (`{ raidId, won, seconds, drops }`).

## Online

- Raids run on the client that blows the horn. Raid enemies are dynamic spawns and are already relayed.
- Helpers are local and not relayed. When another client is the zone's enemy authority, helper damage is forwarded, but enemies there do not target helpers.
- Real party members replace helpers once the party system lands.

## Reforging

Each raid drops good gear at once (heirloom, ilvl = raid level + 1). That gear is also the input of a reforging recipe at the next zone's reforging anvil, which turns it, plus coins, into the next tier's piece.

- Anvils: `raid-anvil-sodbury` (Cloverfield), `raid-anvil-clippings` (Hedgewood), `raid-anvil-flintdelve` (Rockery), `raid-anvil-last-tuft` (Verge). Each sits 2.5 m east of the town smith.
- Recipe shape (`RecipeDef` in `src/raidTypes.ts`): `station` (anvil), `makes` (item), `needs` (raid items with counts), `gold`, optional `when` condition. Packs set `gold` with `craftGold(ilvl of makes)`.
- Gold cost: `craftGoldPerIlvlSq` x ilvl^2 (`ECONOMY.raid.craftGoldPerIlvlSq` = 2).
- Chain: Keep -> Sodbury -> Clippings -> Flintdelve -> Last Tuft.
- The panel follows the shop's 44 px cells (`src/ui/craft.ts`).

## Why raid gear sells for almost nothing

Raid and reforged gear (`ItemDef.source` = `'raid'` or `'craft'`) sells for `itemValuePerIlvl` x ilvl (2 x ilvl), the horn mark. Shops pay little for it, so raids are not a coin farm. The gear's value is in the gear and the reforging chain. The economy sim skips these items when it picks gear tiers, unless `LoadoutSpec.raidGear` is set.

## Kill credit

Only enemies the player hit pay kill XP, loot and gold (`byPlayer` in `enemy-killed`). Enemies killed by AI gnomes or helpers pay nothing to the player. Raid spawns (`EnemyDef.noReward`) pay nothing themselves; the raid's clear pays instead. Kill quest counts are unchanged.

This matters for levelling. Before kill credit, every enemy that died within reach paid the player in full, so three AI gnomes on a water-beetle quest roughly doubled or tripled the XP rate. The economy sim never modelled this, so it passed while play was fast. `npm run sim:economy -- --farm=water-beetle@8,assist=3` now shows the assisted rate beside the solo one.

## Tuning

- Raid clear times (2-3 min): `npm run sim:raid -w games/gnomes-of-gnomomia -- --check`. Run it after changing a raid pack or `RAID_TUNING`.
- Economy (XP, coins, raid pay, reforging cost): `npm run sim:economy -w games/gnomes-of-gnomomia -- --check`.
- Dev: `http://localhost:5291/?raid=raid-keep` drops a fresh character at that raid's horn and blows it.

### Tuning results

Clear times after tuning (issue 4B), from `npm run sim:raid -w games/gnomes-of-gnomomia -- --check --seeds=30`. Every row is inside 120-180 s with a 100% win rate. Raid packs are unchanged: the tuning is global, in `RAID_TUNING`.

| Raid | Level | Class | Win % | Median s |
|---|---|---|---|---|
| raid-keep | 12 | warden | 100 | 143 |
| raid-keep | 12 | slinger | 100 | 155 |
| raid-keep | 12 | mage | 100 | 151 |
| raid-clover | 16 | warden | 100 | 137 |
| raid-clover | 16 | slinger | 100 | 147 |
| raid-clover | 16 | mage | 100 | 149 |
| raid-hedge | 20 | warden | 100 | 131 |
| raid-hedge | 20 | slinger | 100 | 153 |
| raid-hedge | 20 | mage | 100 | 130 |
| raid-rock | 24 | warden | 100 | 149 |
| raid-rock | 24 | slinger | 100 | 169 |
| raid-rock | 24 | mage | 100 | 137 |
| raid-verge | 29 | warden | 100 | 147 |
| raid-verge | 29 | slinger | 100 | 163 |
| raid-verge | 29 | mage | 100 | 133 |

`RAID_TUNING` values that changed (before -> after):

- `bossHpNormals`: 40 -> 180
- `helper.hitNormals`: `{ tank: 0.6, healer: 0.5, damage: 1.0 }` -> `{ tank: 3.0, healer: 4.0, damage: 5.0 }`

Unchanged: `addHpNormals`, `helper.hpNormals`, `helper.healNormals`, `helper.attackSeconds`, every wave and move timing.

Why helpers were raised: at the old values the player's class decided the clear time. Mage bursts cleared raids in 43-97 s while warden and slinger took 130-220 s, and no single boss HP could bring all three into the band. Helpers now do most of the damage, so the three classes sit close together. The player's own damage still matters but is a smaller share. A class far outside the band would now point at a class-specific problem (kit or sim policy), not the tuning.

Before (10 seeds, old values): keep 191/139/143 s (warden/slinger/mage), clover 165/150/97, hedge 133/163/59, rock 202/203/89, verge 189/223/75, with mage win rates of 50-90% on keep and clover.

XP per hour and skill-ups per hour are not measured by this tuning pass (economy numbers belong to the economy sim, issue 4A).
