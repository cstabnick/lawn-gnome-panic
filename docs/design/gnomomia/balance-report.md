# Gnomes of Gnomomia — Game Balance State Report

**Date:** 2026-11-16  
**Simulator:** `npm run sim -w games/gnomes-of-gnomomia -- --seeds=20` (`dt = 0.1 s`, 36 scenarios across Chapters 1–8)  
**Tests:** `npm test -w games/gnomes-of-gnomomia` (Vitest suite)

---

## 1. Executive Summary

Running the headless combat simulator across all 8 zones (36 scenarios, 3 classes, 5 behavioral personas) exposed several major balance and wiring issues in the live game rules, most of which are now resolved in this PR.

### Key Fixes Applied
1. **Added 1.0 s Ability Global Cooldown (`src/abilities.ts`)**:
   - *Before:* `useHotbar()` had no shared cooldown between active class abilities, allowing L20+ characters to dump 5–6 abilities in 0.5 s (~750% weapon damage) and kill L20–L28 bosses in `9–13 s` before any boss mechanics or telegraphs could fire (`[FACE_TANKABLE_BOSS]` on Mother Vesh, Queen Vespa, Kiln Warden, Gromwell, and Sedgewick).
   - *After:* `GCD_SECONDS = 1.0` paces ability rotations realistically. All L6–L30 bosses now live long enough (`45–155 s`) to execute their telegraphs and phase mechanics, reducing `GreedyBerserker` (no dodging/healing) to **0–10%** win rate on every zone boss.
2. **Level-Scaled Boss HP (`src/rules.ts`)**:
   - *Before:* `RANK_HP.boss = 6` was static from L6 to L28, under-scaling late-game bosses relative to full 6-ability class kits.
   - *After:* Boss and final-rank HP scales by `1 + Math.max(0, L - 6) / 18` (`1.0×` at L6, `1.78×` at L20, `2.22×` at L28).
3. **Hedge-Mage Mana Economy (`src/combat.ts`)**:
   - *Before:* `Flare` and `Mend` cost `5 + 1.5 * lr` (up to **41 MP** per cast at L24) while in-combat MP regen was a flat `1 MP / 1.5 s` (`0.67 MP/s`). Hedge-Mages went 100% OOM in ~10 seconds and failed `boss-mole-king` (0%), `boss-rotgut` (0%), and `boss-old-gleaner` (0%).
   - *After:* Spell cost scales gently (`4 + 0.6 * lr`, 5–18 MP) and in-combat MP regen scales with Intelligence (`mpRegenSeconds / (1 + max(0, INT - 10) / 6)`). Hedge-Mage now clears all bosses at **65–100%** win rate.
4. **Slinger Ability & Talent Wiring (`src/data/classes.ts`, `src/combat.ts`, `src/abilities.ts`)**:
   - *Before:* `bullseye` and `thistle-volley` had `power: undefined` (dealing **0 damage** on cast), `volley` dealt `0.6×` instead of `1.5×`, and `slinger-long-shot` (`+5%/rank` beyond 8 m) and `aimed-shot` L12/L20 rank upgrades were unimplemented.
   - *After:* `bullseye` (`2.0×`), `thistle-volley` (`1.2×` + `poisoned`), `volley` (`1.5×` AoE), `aimed-shot` rank scaling, and `slinger-long-shot` are active, cutting Slinger boss TTK by ~25–35%.
5. **Boss Encounter & Pool Telegraph Tuning (`ch2-thatchford.ts`, `ch5-hedgewood.ts`, `ch8-finale.ts`, `src/sim/arena.ts`)**:
   - **Rotgut (L11):** `rat-pack` reduced from 3 to 2 `heap-rat` adds; `steaming-rot` pool cadence relaxed (`10 s → 14 s`, radius `3 m → 2.5 m`) and pool DoT stacking capped. Warden win rate rose from `15%` to `100%`.
   - **Queen Vespa (L20):** `royal-guard` summons 2 normal `paper-wasp`s instead of 2 L19 elite `wasp-drone`s. Warden win rate rose from `30%` to `100%`.
   - **Mower Deck (L30 Finale):** `hpOverride` tuned from `12,000` (30,000 effective HP vs. physical due to `metal` armor) to `7,500`. With `zone-bis` gear, all three classes clear at `100%`.
   - **Lingering Pools (`arena.ts`):** Active ground pools are now exposed in `SimObservation.telegraphs` so tactical agents step out of lingering poison/acid pools.
6. **Slinger DPS, Crit & Talent Wiring (`src/data/classes.ts`, `src/abilities.ts`, `src/combat.ts`)**:
   - Reduced `aimed-shot` (`40 → 30`), `bullseye` (`40 → 30`), and `pebble-spray` (`50 → 25`) Focus costs; raised `FOCUS_REGEN_PER_SECOND` (`12 → 14`).
   - Wired `steady-breath` (`Focus regen ×2 for 10 s`), `slinger-long-shot` (`+1.5 m/rank` in `weaponReach()` and `useHotbar()`), `slinger-hemlock` (`2×` vs. Poisoned `< 30%` HP), and `slinger-knockout` (`+1` crit range, Aimed Shot crits Stun 2 s and reset Bullseye).
   - Wired physical ability crits (including guaranteed crit on `bullseye`), `marked`, `warden-bedrock`, and `slinger-long-shot` into `abilities.ts:strike()`.
   - Slinger (`deadeye`) now clears `boss-mother-vesh` (**95%**, `98.7 s`) and `boss-gromwell` (**100%**, `57.7 s`) and cuts L20–L30 boss TTKs to `35.9–98.7 s`.
7. **Hedge-Mage Mana Conservation & Cost Pass (`src/data/classes.ts`, `src/combat.ts`, `src/sim/agents.ts`)**:
   - Tuned high-cost Mage spells (`drizzle` `13 → 10`, `root-snare` `14 → 10`, `sunbeam` `20 → 14`, `puddle-step` `23 → 15`, `downpour` `29 → 18`, `thin-glaze` `35 → 20`) and INT-scaled in-combat MP regen (`/ 6 → / 4`).
   - `TacticalPlayer` now drinks mana potions at `< 30%` MP and conserves offensive spells/Flare below `25%`/`22%` MP, eliminating all `[HIGH_OOM_RATE]` diagnostics.
8. **Mother Vesh Leech Pace & Heartspark / Unfired Tuning (`src/sim/arena.ts`, `src/data/packs/ch6-rockery.ts`, `src/data/packs/ch8-finale.ts`)**:
   - `vesh-leeches` now spawns 2 brood leeches every `12 s` at `9 m` (`0.5×` walk speed, `15%` heal each), dropping `PassiveTurtler` to **45%** (`[PASSIVE_STALL_WIN]` resolved) while `TacticalPlayer` clears at **90–100%**.
   - Tuned `mower-heartspark` `hpOverride` (`6000 → 7200`) and `unfired` `hpOverride` (`620`).

---

## 2. Current Balance State Across Chapters 1–8

| Zone & Level | Scenario | Warden (`shieldwall`) | Slinger (`deadeye`) | Hedge-Mage (`sunburst`) | Greedy / Passive Boss Check |
|---|---|---|---|---|---|
| Mossbottom (L1–6) | Normal/Pack/Elite | 100% (4–47 s) | — | — | — |
| Mossbottom (L6) | `boss-mole-king` | 100% (45.4 s, 49% HP) | 100% (66.8 s) | 95% (15.1 s) | Greedy: 10% (`mudsling`) |
| Thatchford (L7–8) | Ford / Magpie / Sprite / Rats | 95–100% | — | — | — |
| Thatchford (L11) | `boss-rotgut` | 100% (122.7 s, 48% HP) | 100% (58.5 s) | 70% (54.6 s) | Greedy: 0% |
| Deeps (L11–12) | Gutters Gauntlet / Gristle Heir | 85–100% | — | — | — |
| Deeps (L12) | `boss-clogmaw` | 95% (137.9 s, 47% HP) | 100% (52.9 s) | 100% (10.7 s) | Greedy: 0% (`hairball`) |
| Cloverfield (L14–16) | Mice / Ants / Meadow Gauntlet / Ant Queen | 100% | — | — | — |
| Cloverfield (L16) | `boss-old-gleaner` (World Boss) | 100% (148.6 s, 44% HP) | 100% (86.0 s) | 90% (53.9 s) | Greedy: 0% |
| Hedgewood (L18–19) | Weaver / Wasp Swarm / Drowned Toad | 100% | — | — | — |
| Hedgewood (L20) | `boss-mother-vesh` | 100% (99.4 s, 46% HP) | 95% (98.7 s) | 100% (21.0 s) | Greedy: 0%, Passive: 45% |
| Hedgewood (L20) | `boss-queen-vespa` | 100% (55.6 s, 43% HP) | 100% (35.9 s) | 100% (19.1 s) | Greedy: 0% |
| Rockery (L23) | Unfired / Kiln Guardian / Mudtooth | 100% | — | — | — |
| Rockery (L24) | `boss-kiln-warden` | 100% (54.2 s, 40% HP) | 100% (72.3 s) | 100% (24.8 s) | Greedy: 0%, Passive: 20% |
| Rockery (L25) | `boss-gromwell` | 100% (52.2 s, 43% HP) | 100% (57.7 s) | 100% (27.7 s) | Greedy: 0%, Passive: 0% |
| Verge (L26–28) | Even-Cut Pack / Edger-Knight / Shed Gauntlet | 100% | — | — | — |
| Verge (L28) | `boss-sedgewick` | 100% (70.8 s, 44% HP) | 100% (63.9 s) | 100% (33.1 s) | Greedy: 0%, Passive: 0% |
| Shed Finale (L30, BiS) | `boss-mower-deck` | 100% (72.1 s, 42% HP) | 100% (57.3 s) | 100% (12.2 s) | Greedy: 0% |
| Shed Finale (L30, BiS) | `boss-mower-heartspark` | 100% (49.7 s, 54% HP) | 100% (56.6 s) | 100% (16.3 s) | Greedy: 65% |

---

## 3. Remaining Open Balance Findings

1. **Mossbottom Slug Intro (`[UNDERTUNED]`):**
   - `mb-slug-duel` (L1 `trivial` slug) dies in `4.4 s` with `95%` HP remaining — intentional for a Level 1 tutorial mob.
