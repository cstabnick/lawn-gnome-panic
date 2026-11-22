# Gnomes of Gnomomia: economy scaling

Goal: money, XP and skill growth should not be earned almost entirely in Mossbottom. Build an economy simulation whose job is balancing, then tune the real data against it: XP per kill and per quest scales steeply with zone level, coin rewards and sinks scale with it, some gear and talents are gated behind quests, and use-based skills take real time to grow at high levels. The sim's pass/fail checks become tests so later data edits cannot re-front-load the economy.

Reading of the request: "maxing out on money and skills after level 1" means after zone 1 (Mossbottom, levels 1-6): Mossbottom pays 1,160 quest coins against a shop whose dearest item costs 140, and use-based skills sit at their level cap almost all the time (uses per skill level are flat: 2 + level/2). "Skills" covers both the use-based skills and talent points; talents get quest gates, use-skills get a steeper curve.

Foundation (written by the planner before epic 1, not an issue):

- `games/gnomes-of-gnomomia/src/data/economy.ts`: the `ECONOMY` tuning table (level XP, kill XP, rank XP, quest tier XP, level difference, quest coins, enemy coins, skill cap and skill uses), defaults equal to the current rules.
- `games/gnomes-of-gnomomia/src/economy.ts`: pure formulas `xpToNextLevel`, `xpToReachLevel`, `levelDiffMult`, `killXpAt`, `questXpAt`, `questGold`, `enemyGoldRange`, `skillCapAt`, `skillUsesToNext`.
- `games/gnomes-of-gnomomia/src/config.ts`: `interface Gate { when: Condition; why: string }`, `ItemDef.gate?: Gate`, `TalentDef.gate?: Gate`.

| Epic | Done when | Issues |
|---|---|---|
| 1. Plumbing and sim | build passes, `npm test` passes, game numbers unchanged, `npm run sim:economy` prints the "before" report | 2 (1A gameplay wiring + gates, 1B economy sim) |
| 2. Tuning against the sim | `npm run sim:economy -- --check` exits 0, build and tests pass | 1 (one owner for all pack and tuning data) |
| 3. Tests, lore, docs | tests pin the curve, `npm run lore` passes, docs and AGENT_INDEX updated | 3 (3A tests, 3B lore, 3C docs) |

Sub-agents: the user asked for Opus sub-agents for this task (not haiku-worker), so issues may point at files instead of pasting them.

## Epic 1

~~~~text
Epic: 1 Plumbing and sim
Depends on: none
Issue 1A: wire the economy formulas and quest gates into gameplay

## Environment
Worktree root: the repo root you are in. Git Bash; `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing.
Another agent is writing src/sim/economy*.ts and scripts/sim-economy.mjs at the same time; do not touch them.
Do not commit. Do not edit other games.

## Goal
Gameplay reads XP, level, coin and skill numbers only through src/economy.ts (already written), and gear and talents
can carry a quest gate (`gate?: Gate` on ItemDef / TalentDef, already in src/config.ts) that the shop and talent
tree enforce and show. With the default ECONOMY table the game's numbers are exactly what they are today.

## Read first
- games/gnomes-of-gnomomia/src/economy.ts and src/data/economy.ts (the formulas and the table)
- src/progression.ts (killXp, questXp, xpToNext, skillCap, useSkill, LEVEL_CAP)
- src/rules.ts skillXpToNext; src/quests.ts complete() and checkCondition(); src/entities.ts ~line 722 (gold roll)
- src/talents.ts canLearn(); src/ui/talents.ts (talent cells); src/ui/shop.ts (render/buy)

## Change
- src/progression.ts: keep every export and signature. xpToNext(level) = xpToNextLevel(level); killXp(L, rank) =
  killXpAt(L, rank, state.level); questXp(q) = questXpAt(q, state.level); skillCap(level = state.level) = skillCapAt(level);
  LEVEL_CAP = ECONOMY.levelCap; delete the local RANK_MULT/levelDiffMult (now in economy.ts).
- src/rules.ts: skillXpToNext(level) returns skillUsesToNext(level) (import from ./economy; rules stays free of state/events).
- src/quests.ts complete(): pay questGold(def) instead of def.reward.gold, and say that number in the reward line.
- src/entities.ts: the kill gold roll uses enemyGoldRange(def) instead of def.gold.
- New src/gates.ts: `export function gateOpen(g: Gate | undefined): boolean` (true when no gate, else checkCondition(g.when))
  and `export function gateLabel(g: Gate | undefined): string | null` (null when open, else g.why).
- src/talents.ts canLearn(): false when !gateOpen(t.gate). src/ui/talents.ts: a gated, locked talent shows a lock (🔒)
  and its `why` in its tooltip/title text and in the details line; keep cells >= 44 px tall on touch.
- src/ui/shop.ts: an item with a closed gate is still listed but drawn dimmed with "🔒 <short>" instead of the price,
  where the full `why` is shown in a `title` and in the chat line when clicked ("<why>"); buy() refuses it. Cells stay
  >= 44 px tall. When open, show the price as today.
- If any HUD/panel shows the quest reward gold, use questGold().

## Contract
Signatures in src/economy.ts and the Gate type are fixed; do not change them. Keep all existing progression.ts exports.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes
- `npm test -w games/gnomes-of-gnomomia` passes (no number changed: the default table equals today's rules)
- `npm run lint:content -w games/gnomes-of-gnomomia` passes

## Out of scope
src/sim/**, scripts/**, src/data/** (no gates are authored yet), package.json.
~~~~

~~~~text
Epic: 1 Plumbing and sim
Depends on: none
Issue 1B: the economy simulation

## Environment
As 1A. Another agent edits src/progression.ts, rules.ts, quests.ts, entities.ts, talents.ts, src/gates.ts and ui/*;
you only import from src/economy.ts, src/content.ts, src/data/*, src/config.ts.

## Goal
A pure, deterministic model of one player of each class progressing through the story zones in order, using the
real content (QUESTS, SPAWNS, ENEMIES, ITEMS, NPCS shops, TALENTS) and src/economy.ts formulas, that reports per phase
and flags front-loaded curves; plus a CLI `npm run sim:economy -w games/gnomes-of-gnomomia [-- --class=warden --json --check]`.

## Change
- src/sim/economyPhases.ts: `ECONOMY_PHASES`, eight phases in story/level order (cloverfield's band 11-16 comes before
  hedgewood's 15-20): mossbottom 1-6; thatchford 6-11; keep (keep + deeps upper wing) 10-14; cloverfield 11-16;
  hedgewood (+ deeps/keep 15-20) 15-20; rockery 19-24; deeps (lower wing + keep chapter-6 quests) 24-25; verge 25-30.
  Assign each quest and spawn group (zone = outdoor parent of an interior id) to the first phase that lists its zone and
  whose band holds its level, else the nearest band among phases listing the zone. Every quest must land somewhere.
- src/sim/economy.ts (pure; no DOM, no state.ts mutation): `runEconomy(opts?: Partial<EconomyPlayerModel>): EconomyReport`
  and `ECONOMY_TARGETS`, `checkEconomy(report): EconomyFlag[]`.
  Player model (defaults in `DEFAULT_PLAYER`, all tunable): classId; minutes per quest by tier (side 6, main 10, finale 15);
  seconds per kill by rank incl. walking and resting (trivial 15, normal 35, elite 90, miniboss 150, boss 240,
  worldboss 300, final 400); clears of each respawning spawn group per phase (2; respawnSeconds 0 = once);
  after the phase's activities grind the phase's best normal mob until level >= band max (verge: 30), capped at 20 h;
  weapon-skill uses per combat minute 25, toughness 15 (combat minutes = kill time); potions per combat hour 6 at the
  best heal potion price among reached shops.
  Order activities in a phase by level, apply XP with killXpAt/questXpAt at the current level, coins from questGold and
  the mean of enemyGoldRange, loot sold at floor(value/2) * chance * count (questItem loot not sold), quest reward items
  equipped if better for the class else sold. After each activity shop: for each slot, buy the best affordable item
  for the class (CLASSES[classId].armor; warden melee weapons, slinger sling/blowpipe, mage staff/wand) with ilvl <= level
  from shops of phases reached (NpcDef.shop + pack shopAdds) whose gate is open. Evaluate gates/conditions with the
  sim's own quest-done set: support quest, questAtLeast, minLevel, classId, not, flagSet/flag (a flag counts as set when
  any done quest's reward or a dialogue setFlag sets it; if unknown treat as closed). Item score = ilvl * (1 + rarity bonus
  0/0.08/0.16/0.25/0.35). Talent points = level - 1 + finales done; spendable = ranks of the class whose gate is open
  (tier 6: at most 2 capstones).
  Per phase report: id, name, levelIn, levelOut, hours (quest/kill/grind), xpPerHour, xpPerNormalKill (median),
  coinsEarned, coinsPerHour, spentGear, spentConsumables, carriedOut, nextKitCost (cost of the full best class kit sold
  in the next phase's shops, gates ignored), carryRatio = carriedOut / nextKitCost, kitShare (share of this phase's kit
  bought by phase end), skillUps, skillUpsPerHour, weaponSkill/cap at end, capTimeShare (share of the phase's combat
  minutes spent at the skill cap), talentPoints, talentSpendable, flags. Plus `levelHours[level]` (cumulative hours to
  reach each level), cumulative coins earned vs cumulative useful spend, and totals.
  ECONOMY_TARGETS and flags (one place, documented):
    TOO_RICH carryRatio > 1.0 (you can buy the whole next kit on arrival);
    TOO_POOR kitShare < 0.5;
    GRIND_WALL grind hours > 1.5 x (quest + kill hours) in a phase;
    FLAT_XP_SCALING median normal-kill XP in verge < 8 x mossbottom's;
    FRONT_LOADED_COINS coins earned in mossbottom+thatchford > 25% of the game total;
    SKILL_CAPPED_EARLY capTimeShare > 0.5 in any phase from keep on;
    UNSPENT_TALENTS talentPoints - talentSpendable > 2 at a phase end;
    SLOW_PHASE / FAST_PHASE phase hours outside [0.4, 2.5] x the median phase hours.
- scripts/sim-economy.mjs: bundle like scripts/sim-balance.mjs (esbuild stdin -> temp dir), run each class (or --class),
  print a fixed-width table per class, the level-hours line, the flags, and with --check exit 1 if any class has a flag;
  --json prints the reports.
- games/gnomes-of-gnomomia/package.json: add "sim:economy": "node scripts/sim-economy.mjs".

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes
- `npm run sim:economy -w games/gnomes-of-gnomomia` prints all 8 phases for 3 classes in under 5 s
- the report shows today's front-loading (TOO_RICH and/or FRONT_LOADED_COINS, SKILL_CAPPED_EARLY expected)
- save the full output to the scratchpad path the planner gives you as the "before" table

## Out of scope
Any gameplay file, src/data/**, tests (epic 3).
~~~~

## Epic 2

~~~~text
Epic: 2 Tuning against the sim
Issue 2A: tune XP, coins, sinks, skill growth and quest gates

## Goal
`npm run sim:economy -w games/gnomes-of-gnomomia -- --check` exits 0 for all three classes by changing data:
src/data/economy.ts values (add fields with matching formula changes in src/economy.ts only if a curve cannot be
expressed), item values, new quest-gated premium stock and consumables in pack files, quest gates on shop gear
(ItemDef.gate) and talents (TalentDef.gate in src/data/classes.ts).

## Rules
- XP per kill and per quest must scale steeply with level (killXp.growth > 1) with levelXp scaled to match, so later
  zones are worth far more XP per kill but take at least as long per phase as early ones.
- Quest and enemy coins: cut early, raise late (growth > 1, scale < 1). Add real sinks in later shops: quest-gated
  sprouted/blooming gear (value 2x / 4x ilvl^2, matching the existing convention), better potions. New items reuse
  existing prefabs (`prefab:` id of a matching catalog prefab) and existing icons; no new meshes.
- Gates (decided): every tier-5 talent needs Chapter 3's finale `c3-ledger` done; every tier-6 capstone needs Chapter
  5's finale `c5-heartwood` done. Gate 6-10 shop items, each behind a main quest of its own chapter at mid-band, with a
  one-line in-world `why`. Record the final list (item/talent, quest id, why) in your report.
- Use-skill growth: steepen skillUsesToNext (usesPerLevelSq) so capTimeShare <= 0.5 from the Keep on but early zones still
  reach the cap.
- Keep `npm test -w games/gnomes-of-gnomomia` (combat balance sims) and `npm run lint:content` passing; new gear changes
  what sim/loadout.ts auto-equips, so check.
~~~~

## Epic 3

~~~~text
Issue 3A (tests): src/sim/economy.test.ts: checkEconomy(runEconomy({classId})) has no flags for each class; a golden
of the curve shape (per phase: levelOut, rounded coinsPerHour/xpPerNormalKill ratios to mossbottom, kitShare band)
in src/sim/economy.golden.json with a tolerance, plus targeted asserts: verge kill XP >= 8x mossbottom, late coins share,
tier-5/6 talents gated, gated shop items refused by gateOpen with no quests done.
Issue 3B (lore): every gate's reason checked against docs/lore (npm run lore -- find <word>), canon.md, settings.md;
rulings in docs/lore/rulings.md; entries where a gated item or teaching is a named thing; fix `why` strings; npm run lore.
Issue 3C (docs): docs/design/gnomomia/economy.md (model, targets, reasoning, how to run, before/after table),
links from docs/design/gnomomia/README.md and the game README, AGENT_INDEX.md rows for the script and doc.
~~~~
