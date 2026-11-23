# Gnomomia: rebalance the specialization quests, and a quest framework that stops floods

Goal: the three Calling trials in Thatchford (the class "specialization" quests: Warden *Hold the Ford*, Slinger
*Shiny Thieves*, Hedge-Mage *Dry Them Out*) are fair and about equally hard for the classless level-6 gnome who takes
them, and the flood of water beetles is gone. The fix is general, not just the ford: quest-spawned enemies
belong to an *encounter* that is capped and cleaned up, a defend stage only starts when the player is in its circle,
only the player's own kills give XP and quest credit, and the AI gnome adventurers (companions) stay out of
player-only quests. The balance sim and the content linter check all of this so new content can't drift back.

Reading of the request (decided without asking):

- "Specialization quests" are the Calling trials (`c2-trial-warden`, `c2-trial-slinger`, `c2-trial-mage` in
  `src/data/packs/ch2-thatchford.ts`). Talent branches have no quests.
- "Randomly generated NPC adventurers" are the companions (`src/companions.ts`, `src/companionLogic.ts`): six AI
  gnomes that pick quests from the player's own quest log.
- "A better quest framework" means: shared rules in code (encounters, kill credit, companion eligibility) plus
  checks (linter, sim test, unit tests), not a rewrite of `quests.ts`.

Sibling plans running at the same time (do not duplicate): adventurer idle/travel and level/gear (sibling 2),
full re-simulation/rebalance and raids after the second town (sibling 3), partying/social (sibling 4).
Shared files are listed at the end.

## Findings: where the water beetles come from

All paths below are under `games/gnomes-of-gnomomia/src/`.

1. **Defend runs re-arm every ~5 s anywhere in the zone (main cause).** `quests.ts` `tickDefend` creates a run as
   soon as the quest is active and `state.zone === o.zone`, wherever the player stands in Thatchford, and the wave
   at `at: 0` fires on the same tick. The player is "outside" (more than `r + DEFEND_LEEWAY` = 12 m from the ford),
   so after `DEFEND_OUTSIDE_SECONDS` (5 s) `resetDefend` deletes the run, and 0.25 s later a new run fires wave 0
   again. Standing at Sergeant Stoutpot (7, -12 local, 13.9 m from the ford) after taking the trial spawns 3 water
   beetles every ~5.25 s, about 34 a minute, for as long as the player stays in Thatchford. Dying
   (`player-died` -> `resetDefend`) re-arms it too.
2. **Wave enemies never go away.** `spawnEnemyAt` (entities.ts) marks them `noRespawn`, which only removes a *dead*
   one. A reset, a zone change or even success leaves every living wave beetle where it is. They are `townFight`, the
   ford (0, 0) is the centre of Thatchford town (region `thatchford-town`, r 28), so they wander and fight inside the
   town forever, including the guildhall where the trainers stand.
3. **The trial was too big even without the bug.** The quest spawns 3/3/4 = 10 level-6 beetles in 60 s; the sim
   scenario `tf-ford-defend` (src/sim/scenarios.ts) had drifted to 2/2/2. The trial is taken *before* a class is
   chosen (the class is granted at the turn-in), so the honest loadout is classless, level 6, zone-plain gear.
   Measured with the balance sim (TacticalPlayer, 20 seeds):

   | Trial (as fought) | classless L6 win rate |
   |---|---|
   | Ford 3/3/4 (shipped) | 0.00 (L7: 0.00; even a level-6 *Warden* 0.25) |
   | Ford 2/2/2 (old sim) | 0.00 (L7: 0.65) |
   | Ford 1/2/2 | 0.25 |
   | **Ford 1/1/2 (new)** | **1.00** |
   | Magpie thief x1 / x2 / x3 at once | 1.00 / 0.90 / 0.05 |
   | Muck sprite x1 / x2 / x3 at once | 1.00 / 0.95 / 0.65 |
   | Water beetle x1 / x2 / x3 at once | 1.00 / 1.00 / 0.70 |

   The magpie group (`c2-spawn-6`, 4 within 10 m, aggro range 7 m) and sprite group (`c2-spawn-4`, 6 within 14 m)
   come in pairs at worst. The sim's own `tf-magpie-trial` uses a `magpie-flee` mechanic the game never had (0.30 at
   L6); the new pair scenarios replace it as the slinger/mage check.
4. **Companions take the player's credit, and feed the flood.**
   - `killEntity` (entities.ts) emits `enemy-killed` and says "You defeated the ..." for *every* kill, so a companion
     kill (companions.ts `swingAtEnemy` -> `dealDamage(..., { attacker: COMPANION_TARGET_BASE - n })`) gives the player
     XP (`progression.ts`) and quest kill counts (`quests.ts`). Online, a companion's hit on an enemy another client
     owns is forwarded as the player's own hit, so the kill comes back credited to the player as well.
   - `selectQuestPools` (companionLogic.ts) hands companions the player's active quests *and* the other two class
     trials (the "prior" supplement takes any quest at or below the player's level in the zone). A companion "doing"
     Hold the Ford walks to the ford and stands in the circle, where townFight wave beetles go for the nearest target.
     Companions have 46-ish HP, die, respawn at the shrine 6 s later and walk back. Every time the companion dies the
     beetles give up and heal to full (the give-up branch in `updateEnemy`), so the player's damage is wasted.
   - Two companions also stroll in town while the player is there; the stray wave beetles attack them too.
5. **Elsewhere (same bug class, fixed by the same framework).** Every defend quest has bugs 1 and 2:
   `s01-clock-let-in` (Mossbottom well, in town), `s03-hold-the-cellar-hatch` (Thatchford square), `c5-mill-raid`,
   `c6-firing-the-stone`, `s07-dressing-the-king`, `s08-the-roundup`, `s12-open-the-branch`. A scan of the content
   for the new lint rules (warnings, see issue 1D) found, for sibling 3's rebalance:
   - static spawn groups of a wave enemy inside a defend circle's reach (they join the waves): `c5-mill-raid`
     (`c5-spawn-10`), `c6-firing-the-stone` (`c6-spawn-8`), `s07-dressing-the-king` (`c4-spawn-9`),
     `s08-the-roundup` (`s08-spawn-3`);
   - kill stages asking for more than ever spawn at once: `c4-granary` (10 field mice, 6 spawn), `c6-humming-seam`
     (8/7), `c7-supply-timber` (8/3), `c7-supply-iron` (8/7), `c7-supply-grain` (8/3), `s09-quiet-chorus` (6/4).

Static water beetles are not the cause: `c2-spawn-1` (5, Hose banks, -40, 20) and `c2-spawn-2` (3, by the mill wheel,
-21, -28) are both outside town, and The Tremor Tally needs 5 of those 8.

## The framework (what changes)

- **Kill credit** (entities.ts, combat.ts, events.ts): `enemy-killed` carries `byPlayer`. True when the local player
  landed the blow, or hit that enemy since it last reset; false for a kill an AI gnome made alone. XP, kill stages and
  the "You defeated" line only follow `byPlayer`.
- **Encounters** (entities.ts): `spawnEnemyAt(..., { encounter })` tags enemies a quest spawns. `clearEncounter(key)`
  removes the living ones without loot or credit; `encounterOf(id)` reads the tag. Encounter enemies never pick AI
  gnomes as targets, so the fight is the player's and matches the sim.
- **Defend runs** (quests.ts): a run arms only when the player stands inside the circle; reset, success, death and
  zone change all end the run and clear its encounter. At most one run's waves are ever alive.
- **Quest rules** (new `questRules.ts`): `companionMayTake(def, npcs)` (not `solo`, giver not a trainer, no defend or
  escort stage), `encounterKey(questId, stage)`, `defendWaveTotal(o)`. `QuestDef.solo?: boolean` marks future
  player-only quests.
- **Companions** take only `companionMayTake` quests, ignore encounter enemies, and only hit for real an enemy this
  client owns.
- **Checks**: the linter warns on static spawns inside a defend circle's reach and on kill stages larger than the
  spawn; errors on waves that never fire. The sim's ford scenario is built from the quest data, and a balance test
  pins all three trials at >= 0.8 for a classless level-6 gnome. Unit tests cover kill credit, encounters, defend
  arming/cleanup and companion eligibility.

Not in this plan: the magpie "fly off at 20%" mechanic (sim-only, never in the game; the trial text stops promising
it), the Sun-only rule of the mage trial (not enforced, unchanged), online despawn of encounter enemies on a client
that is not the zone authority (they are removed locally only; see issue 1A), rebalancing the other defend quests
(sibling 3).

## Before Epic 1 (planner)

- This worktree has no `node_modules`: run `npm install` once at the repo root before launching workers.
- No party slice change (Gnomomia has no `src/minigames/`), no achievements (a fix and rebalance, no new feature or
  player verb), no UI change (mobile unaffected). Online: kill credit and encounter clearing are covered in 1A/2B; say
  so in the PR.
- No new names or story: the trial dialogue only changes numbers and one hint, so no lore entry is needed.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Framework core and content | `npm run build`, `npm test`, `npm run lint:content` (all `-w games/gnomes-of-gnomomia`) pass | 4 (1A-1D), parallel |
| 2. Wire it in | the same, plus `bash tools/smoke.sh http://localhost:5291 game ui` with the dev server up, plus the manual ford check below | 3 (2A-2C), parallel |

Files per issue (no file is under two issues of one epic):

| Issue | Changes |
|---|---|
| 1A | `src/entities.ts`, `src/events.ts`, `src/combat.ts`, new `src/killCredit.test.ts` |
| 1B | new `src/questRules.ts`, new `src/questRules.test.ts`, `src/config.ts` |
| 1C | `src/data/packs/ch2-thatchford.ts`, `docs/design/gnomomia/quests.md` |
| 1D | `scripts/lint-content.mjs`, `src/data/README.md` |
| 2A | `src/quests.ts`, `src/progression.ts`, new `src/questDefend.test.ts` |
| 2B | `src/companionLogic.ts`, `src/companions.ts`, `src/companionLogic.test.ts` |
| 2C | `src/sim/scenarios.ts`, `src/sim/balance.test.ts` |

Checks per issue: only `npx tsc --noEmit -p games/gnomes-of-gnomomia` and `npm test -w games/gnomes-of-gnomomia --
<one test file>` (vitest, no output folder, no port); 1D runs `npm run lint:content` (temp dir in the OS temp, unique
per run). No issue starts a server or runs `vite build`.

End of Epic 2, manual (planner, dev server on 5291): take the Warden trial at Stoutpot, stand by her 30 s: no beetles.
Step into the ford circle: 1 beetle, "hold the circle" line. Walk away 6 s: "You fell back", the beetle is gone. Come
back and hold 60 s: 1, 1, then 2 beetles, quest advances, leftovers scatter. A companion's kill near you gives no XP
line. Also `npm run sim:economy -w games/gnomes-of-gnomomia -- --check` exits 0.

After Epic 2 (planner): add a row for `docs/roadmaps/gnomomia-quest-rebalance.md` to the roadmaps table in
`AGENT_INDEX.md`.

---

## Epic 1: Framework core and content

~~~~text
Epic: 1. Framework core and content
Issue: 1A. Kill credit and quest encounters in the entity layer
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (repo root, a git worktree). Game:
games/gnomes-of-gnomomia (Vite + TypeScript + three.js). In Git Bash, if node is not found:
export PATH="/c/Program Files/nodejs:$PATH". node_modules is already installed; do not run npm install.
Other workers are editing other files of this game at the same time: change only the files under "Change".
Do not commit. Do not run `vite build` or start a dev server.

## Goal
`enemy-killed` says whether the local player earned the kill (`byPlayer`), and enemies a quest spawns can be tagged
with an encounter key, looked up, and cleared in one call. AI gnomes (companions) no longer earn the player XP or
quest kills by themselves, and encounter enemies never target AI gnomes.

## Read first
- games/gnomes-of-gnomomia/src/entities.ts: `COMPANION_TARGET_BASE` (line ~49, value -100; ids <= it are AI
  gnomes), `interface Slot` (~67-104), `addSlot` slot literal (~190-209), `spawnEnemyInternal` (~321-334),
  `spawnEnemyAt` (~338-346), `findAggroTarget` (~414-438, the line `if (companionTargets) for (const ct of
  companionTargets.targets()) consider(ct);`), `snapHome` (~441-452), `updateEnemy` respawn block
  (`if (slot.deadFor >= def.respawnSeconds) {` ~486) and give-up block (`if (tgt.dead || outOfLeash || targetInPeace) {`
  ~525), `markSlotDead` (~704), `killEntity` (~728-751), `removeEntity` (~793), `applyZoneEnemySync` revive block
  (`if (dead < 0.5 && e.dead) {` ~872).
- games/gnomes-of-gnomomia/src/combat.ts: imports (line 7), `finishIfDead` (~303-308), `dealDamage` (~395-431).
- games/gnomes-of-gnomomia/src/events.ts: line 16, `'enemy-killed': { defId: string; entityId: number };`
- games/gnomes-of-gnomomia/src/net/enemySync.test.ts: lines 1-32 and 53-84, the test pattern (spawnEnemyAt +
  dealDamage in Node, bus spy, cleanup with removeEntity).

## Change
- src/events.ts: replace the `'enemy-killed'` entry with
  `'enemy-killed': { defId: string; entityId: number; byPlayer: boolean };` and extend its doc comment: "byPlayer: the
  local player gets the credit (XP, kill stages, the 'You defeated' line): they landed the killing blow, or hit this
  enemy since it last reset. False for a kill an AI gnome (companions.ts) made alone."
- src/entities.ts:
  - `Slot`: add `playerTagged: boolean;` (doc: "Enemy: the local player hit it since it last spawned, respawned or
    reset; the kill then counts for them even if an AI gnome lands the last blow.") and `encounter?: string;` (doc:
    "Enemy: the quest encounter that spawned it (questRules.encounterKey); clearEncounter removes it.").
  - `addSlot`: initialise `playerTagged: false` in the slot literal.
  - Set `slot.playerTagged = false` wherever an enemy comes back fresh: the respawn block in `updateEnemy`, the
    give-up block in `updateEnemy` (next to `e.hp = e.maxHp;`), `snapHome`, and the revive block in
    `applyZoneEnemySync`.
  - New export, next to `provokeEnemy`:
    `/** The local player hit enemy \`id\`: its kill will count for them. */
    export function notePlayerHit(id: number): void` -> `const slot = slots.get(id); if (slot?.enemy) slot.playerTagged = true;`
  - `spawnEnemyInternal(defId, x, z, syncKey, zone, townFight = false, encounter?: string)`: after
    `slot.townFight = townFight;` add `if (encounter) slot.encounter = encounter;`.
  - `spawnEnemyAt(defId: string, x: number, z: number, opts?: { townFight?: boolean; encounter?: string }): Entity | null`:
    pass `opts?.encounter` through to spawnEnemyInternal. Update its doc: "`encounter`: tags it as part of a quest
    encounter (clearEncounter)." Keep `spawnRemoteEnemy` as it is (remote copies carry no tag).
  - New exports (after spawnEnemyAt):
    ```ts
    /** The encounter key enemy `id` was spawned with, or undefined. */
    export function encounterOf(id: number): string | undefined {
      return slots.get(id)?.encounter;
    }

    /** Removes every living enemy of encounter `key` without loot, XP, quest credit or an 'enemy-killed' event.
     * Returns how many living ones it removed. Online, on the zone authority, a synced one is marked dead instead
     * (markSlotDead(slot)), so the enemy sync tells the other clients and the noRespawn branch of updateEnemy removes
     * it 1.5 s later; anywhere else it is removed at once (a client that is not the authority only removes its own copy). */
    export function clearEncounter(key: string): number
    ```
    Loop `Array.from(slots.values())`; skip slots without `enemy`, with `encounter !== key`, or with `entity.dead`
    (dead ones are already on their way out; do not count them). For each: if `net?.isOnline() && slot.syncKey &&
    isSlotAuthority(slot)` call `markSlotDead(slot)`, else `if (player.action?.target === slot.entity.id) player.action = null;`
    then `removeEntity(slot.entity.id)`. Count and return.
  - `findAggroTarget`: encounter enemies ignore AI gnomes. Change the companions line to
    `if (companionTargets && !slot.encounter) for (const ct of companionTargets.targets()) consider(ct);`
    and add to the comment above it: "Encounter enemies (quest waves) are the player's fight: they skip AI gnomes."
  - `killEntity(id: number, killerId: number = PLAYER_ID): void`: compute
    `const byPlayer = killerId > COMPANION_TARGET_BASE || slot.playerTagged;` before `markSlotDead(slot)`.
    Emit `bus.emit('enemy-killed', { defId: def.id, entityId: id, byPlayer });`. Only `say(\`You defeated the ...\`)`
    when `byPlayer`. Loot, lastWords, onDeathFlag and the net sendEnemyKill stay as they are. Update the doc comment:
    "`killerId`: who landed the blow (PLAYER_ID by default; an AI gnome's id is <= COMPANION_TARGET_BASE)."
    The existing call in applyRemoteEnemyKill (`killEntity(slot.entity.id)`) stays unchanged (the default is right:
    the server says this client got the kill).
- src/combat.ts:
  - import `COMPANION_TARGET_BASE` and `notePlayerHit` from './entities' (add to the existing import on line 7).
  - `finishIfDead(e: Entity, killerId: number)`: call `killEntity(e.id, killerId)`.
  - `dealDamage`: in the enemy part (after the `if (isPlayer) { ... }` block, before `if (!isEntityAuthority(e!.id))`),
    add `if (attacker > COMPANION_TARGET_BASE) notePlayerHit(e!.id);` (the player, their spells, pets and remote
    players all have ids above it; only AI gnomes are at or below). Change the last call to
    `finishIfDead(e!, attacker);`.
- src/killCredit.test.ts (new), vitest, pattern from net/enemySync.test.ts (beforeEach `resetCombatState()`, afterEach
  `for (const e of allEntities()) removeEntity(e.id)`, spy with `bus.on('enemy-killed', spy)` / `bus.off`). Use enemy
  'slug'. Cases:
  1. `dealDamage(e.id, 9999, 'crush')` -> spy called once with `byPlayer: true`.
  2. `dealDamage(e.id, 9999, 'crush', { attacker: COMPANION_TARGET_BASE })` -> `byPlayer: false`.
  3. `dealDamage(e.id, 1, 'crush')` then `dealDamage(e.id, 9999, 'crush', { attacker: COMPANION_TARGET_BASE - 2 })`
     -> `byPlayer: true`.
  4. Two `spawnEnemyAt('slug', 20, 20, { encounter: 'q#0' })` and one plain `spawnEnemyAt('slug', 22, 22)`:
     `encounterOf` returns 'q#0' / undefined; `clearEncounter('q#0')` returns 2; one entity of kind 'enemy' is left;
     the spy was not called; `clearEncounter('q#0')` again returns 0.

## Contract
- `'enemy-killed': { defId: string; entityId: number; byPlayer: boolean }` (events.ts)
- `export function killEntity(id: number, killerId?: number): void` (default PLAYER_ID)
- `export function notePlayerHit(id: number): void`
- `export function spawnEnemyAt(defId: string, x: number, z: number, opts?: { townFight?: boolean; encounter?: string }): Entity | null`
- `export function encounterOf(id: number): string | undefined`
- `export function clearEncounter(key: string): number`
Epic 2 imports `clearEncounter`, `encounterOf` and the `byPlayer` field by these exact names. Existing callers
(quests.ts, mower.ts, enemySync.test.ts) must compile unchanged.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes
- `npm test -w games/gnomes-of-gnomomia -- src/killCredit.test.ts src/net/enemySync.test.ts` passes

## Out of scope
src/quests.ts and src/progression.ts (they start reading `byPlayer` in a later issue), src/companions.ts,
src/companionLogic.ts, src/config.ts, src/questRules.ts, every file under src/data and src/sim, scripts/.
~~~~

~~~~text
Epic: 1. Framework core and content
Issue: 1B. Shared quest rules module
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (repo root, a git worktree). Game:
games/gnomes-of-gnomomia (Vite + TypeScript + three.js). In Git Bash, if node is not found:
export PATH="/c/Program Files/nodejs:$PATH". node_modules is already installed; do not run npm install.
Other workers are editing other files of this game at the same time: change only the files under "Change".
Do not commit. Do not run `vite build` or start a dev server.

## Goal
A small pure module, `src/questRules.ts`, holds the rules other systems share about quests: which quests the AI gnome
adventurers may run, the key that tags enemies a quest stage spawns, and a defend stage's wave total. Quests can be
marked player-only with `solo: true`.

## Read first
- games/gnomes-of-gnomomia/src/config.ts: `type Objective` (~line 394-402), `interface QuestDef` (~405-411),
  `interface NpcDef` (~384; it has `trainer?: ClassId`).
- games/gnomes-of-gnomomia/src/data/packs/ch2-thatchford.ts: the three trainers (`stoutpot`, `twitchett`, `dimm`
  have `trainer:`), the quests `c2-calling`, `c2-trial-warden` (a defend stage), `c2-trial-slinger`,
  `c2-trial-mage`, `c2-tremor-tally`; NPC `burlap` (not a trainer).
- games/gnomes-of-gnomomia/src/companionLogic.test.ts: lines 1-31 for the vitest style with live content.

## Change
- src/config.ts: in `interface QuestDef`, after `chain?: string;`, add
  `solo?: boolean;               // player-only: AI gnomes never take it (src/questRules.ts companionMayTake)`.
  Nothing else in config.ts.
- src/questRules.ts (new). Imports types only (`import type { NpcDef, Objective, QuestDef } from './config';`), no
  runtime imports, so it stays pure:
  ```ts
  // Shared quest rules: which quests the AI gnome adventurers (src/companions.ts) may run, and how quest-spawned
  // enemies are tagged. Pure: no DOM, no three, no game state.
  import type { NpcDef, Objective, QuestDef } from './config';

  export type DefendObjective = Extract<Objective, { type: 'defend' }>;

  /** True when an AI gnome may pretend to run quest `def`: it is not `solo`, its giver is not a class trainer (the
   * Calling trials are personal), and no stage is a defend or an escort (those spawn or move things around the real
   * player). */
  export function companionMayTake(def: QuestDef, npcs: Readonly<Record<string, NpcDef>>): boolean {
    if (def.solo) return false;
    if (npcs[def.giver]?.trainer) return false;
    return !def.stages.some((s) => s.objective.type === 'defend' || s.objective.type === 'escort');
  }

  /** The key that tags the enemies stage `stage` of quest `questId` spawns (entities.ts spawnEnemyAt/clearEncounter). */
  export function encounterKey(questId: string, stage: number): string {
    return `${questId}#${stage}`;
  }

  /** How many enemies one run of a defend stage spawns, all waves together. */
  export function defendWaveTotal(o: DefendObjective): number {
    return o.waves.reduce((n, w) => n + w.count, 0);
  }
  ```
- src/questRules.test.ts (new), vitest, `import { NPCS, QUESTS } from './content';`:
  - `companionMayTake` is false for 'c2-trial-warden', 'c2-trial-slinger', 'c2-trial-mage' and 'c2-calling'; true for
    'c2-tremor-tally'.
  - A synthetic quest (giver 'burlap', zone 'thatchford', level 1, tier 'side', reward `{ gold: 0, items: [] }`) with
    one kill stage (`{ type: 'kill', enemy: 'water-beetle', count: 1 }`) is true; the same with `solo: true` is false;
    the same with an escort stage (`{ type: 'escort', npc: 'burlap', zone: 'thatchford', x: 0, z: 0, r: 3 }`) is false.
  - `encounterKey('c2-trial-warden', 0)` is 'c2-trial-warden#0'.
  - `defendWaveTotal` of the first stage objective of 'c2-trial-warden' equals the sum of its waves' counts (compute
    the expected sum in the test from the data; do not hard-code a number, another worker is changing the waves).

## Contract
```ts
export type DefendObjective = Extract<Objective, { type: 'defend' }>;
export function companionMayTake(def: QuestDef, npcs: Readonly<Record<string, NpcDef>>): boolean;
export function encounterKey(questId: string, stage: number): string;   // `${questId}#${stage}`
export function defendWaveTotal(o: DefendObjective): number;
// config.ts QuestDef: solo?: boolean
```
Epic 2 imports these by these exact names.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes
- `npm test -w games/gnomes-of-gnomomia -- src/questRules.test.ts` passes

## Out of scope
Every other file. Do not set `solo` on any quest yet; do not touch src/companions.ts, src/companionLogic.ts,
src/quests.ts, src/entities.ts or src/data/.
~~~~

~~~~text
Epic: 1. Framework core and content
Issue: 1C. Rebalance the three Calling trials
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (repo root, a git worktree). Game:
games/gnomes-of-gnomomia (Vite + TypeScript + three.js). In Git Bash, if node is not found:
export PATH="/c/Program Files/nodejs:$PATH". node_modules is already installed; do not run npm install.
Other workers are editing other files of this game at the same time: change only the files under "Change".
Do not commit. Do not run `vite build` or start a dev server. Repo rule: no new names, places or story here; only
numbers and one hint change, so no lore entry is needed.

## Goal
The three class trials are about equally hard for the classless level-6 gnome who takes them (the class is granted at
the turn-in, so the trial is fought without one). Balance-sim measurements (classless L6, zone-plain gear, careful
player, 20 seeds): ford waves 3/3/4 win 0%, 1/1/2 win 100%; two magpies at once 90%, three 5%; two muck sprites at
once 95%, three 65%. New sizes: ford 1/1/2 beetles, 3 magpies, 4 muck sprites.

## Read first
- games/gnomes-of-gnomomia/src/data/packs/ch2-thatchford.ts: `const WARDEN`, `SLINGER`, `MAGE` (lines ~62-96, the
  dialogue text), quests `c2-trial-warden`, `c2-trial-slinger`, `c2-trial-mage` (~447-470).
- docs/design/gnomomia/quests.md: lines 52-55, the Calling rows of the chapter 2 table.

## Change
- src/data/packs/ch2-thatchford.ts:
  - `c2-trial-warden` stage 0 objective waves become exactly
    `waves: [{ enemy: 'water-beetle', count: 1, at: 0 }, { enemy: 'water-beetle', count: 1, at: 20 }, { enemy: 'water-beetle', count: 2, at: 40 }]`.
    Keep zone, x, z, r, seconds and the stage text.
  - `WARDEN.waiting` becomes:
    'Sixty seconds at the ford, Recruit. Step into the circle and the water beetles come, in three waves. Stay in it.'
    (A defend stage will only start once the player stands in the circle; this line tells them.)
  - `c2-trial-slinger` stage 0: text 'Kill 3 magpie thieves on Crowfoot Hill.', `count: 3`.
  - `SLINGER.trialPitch`: 'Shiny Thieves. Three magpie thieves on Crowfoot Hill. They roost close together, so pull them one at a time.'
    (The old "they fly off at a fifth of their health" never existed in the game.)
  - `SLINGER.waiting`: 'Three magpies on Crowfoot Hill. They have your shiny things. Go and get them back.'
  - `SLINGER.turnIn`: 'Three magpies, and only one of them tried to steal my hat. Good shooting. Are you a Slinger, then?'
  - `c2-trial-mage` stage 0: text 'Kill 4 muck sprites by the Spinning Fountains.', `count: 4`.
  - `MAGE.trialPitch`: 'Dry Them Out. Four muck sprites, with Sun spells only. Flare, not your trowel. I will know if you cheat.'
  - `MAGE.waiting`: 'Four muck sprites by the fountains. Sun spells only. I will know.'
  - `MAGE.turnIn`: 'Four sprites, all dry. Flare, Flare, Flare. You may be a Hedge-Mage after all.'
  - Nothing else in the file: rewards, levels, spawns and the other quests stay as they are.
- docs/design/gnomomia/quests.md, the three trial rows:
  - Warden: 'defend the ford, 60 s, 3 waves of water beetles (1, 1, 2), starting when you step into the circle, without leaving it'
  - Slinger: 'kill 3 magpie thieves on Crowfoot Hill (they roost close; pull one at a time)'
  - Hedge-Mage: 'kill 4 muck sprites with Sun spells only'

## Contract
Quest ids, stage order, objective types and every other field stay the same. The sim (another issue, later) builds
its ford scenario from `QUESTS['c2-trial-warden'].stages[0].objective.waves`, so the waves above are the contract.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes
- `npm run lint:content -w games/gnomes-of-gnomomia` exits 0
- `npm test -w games/gnomes-of-gnomomia -- src/townPeace.test.ts src/sim/economy.test.ts` passes. If the economy
  golden test fails, do NOT regenerate the golden (no UPDATE_GOLDEN); report the failing lines.

## Out of scope
Every other pack, the level JSON (spawn positions and group sizes stay), src/sim/*, src/quests.ts, docs/lore/.
~~~~

~~~~text
Epic: 1. Framework core and content
Issue: 1D. Content linter: quest encounter checks, and the authoring note
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (repo root, a git worktree). Game:
games/gnomes-of-gnomomia. In Git Bash, if node is not found: export PATH="/c/Program Files/nodejs:$PATH".
node_modules is already installed; do not run npm install. Other workers are editing other files of this game at the
same time (one of them changes the Calling trial numbers in src/data/packs/ch2-thatchford.ts): change only the files
under "Change". Do not commit.

## Goal
`npm run lint:content` catches the quest data that floods or starves the player: a defend wave that can never fire
(error), a static spawn of a wave enemy close enough to join a defend fight (warning), and a kill stage that asks for
more enemies than ever spawn at once (warning). The content README tells authors how quest encounters work.

## Read first
- games/gnomes-of-gnomomia/scripts/lint-content.mjs: `report(pack, level, msg)`, `need`, and the quest loop
  (`for (const q of Object.values(p.quests ?? {}))`, `q.stages.forEach((s, i) => { const o = s.objective; const w = ...`).
  `p.quests` holds zone-local coordinates; `C.QUESTS` and `C.SPAWNS` hold world coordinates (content.ts pass 3), so
  compare positions using `C.QUESTS[q.id].stages[i].objective` with `C.SPAWNS`.
- games/gnomes-of-gnomomia/src/data/README.md: the top bullet list (lines 1-10).

## Change
- scripts/lint-content.mjs, inside the existing `q.stages.forEach((s, i) => { ... })`, after the existing lines:
  ```js
  if (o.type === 'defend') {
    if (o.r < 3) report(p.id, 'error', `${w}: defend radius ${o.r} is under 3 m`);
    for (const wv of o.waves) {
      if (wv.count < 1) report(p.id, 'error', `${w}: a ${wv.enemy} wave has count ${wv.count}`);
      if (wv.at >= o.seconds) report(p.id, 'error', `${w}: the ${wv.enemy} wave at ${wv.at} s never comes (the stage ends at ${o.seconds} s)`);
    }
    const wo = C.QUESTS[q.id]?.stages[i]?.objective;   // world coordinates
    if (wo?.type === 'defend') {
      for (const g of C.SPAWNS) {
        if (g.zone !== wo.zone || !wo.waves.some((wv) => wv.enemy === g.enemy)) continue;
        if (Math.hypot(g.x - wo.x, g.z - wo.z) < g.spread + wo.r + 12) {
          report(p.id, 'warn', `${w}: spawn ${g.id ?? g.enemy} (${g.count} x ${g.enemy}) is within reach of the defend circle, so it joins the waves`);
        }
      }
    }
  }
  if (o.type === 'kill') {
    const groups = C.SPAWNS.filter((g) => g.enemy === o.enemy);
    const total = groups.reduce((n, g) => n + g.count, 0);
    const inWaves = Object.values(C.QUESTS).some((qq) => qq.stages.some((ss) => ss.objective.type === 'defend' && ss.objective.waves.some((wv) => wv.enemy === o.enemy)));
    const summoned = Object.values(C.ENEMIES).some((e) => (e.moves ?? []).some((m) => m.summon?.enemy === o.enemy));
    if (groups.length > 0 && !inWaves && !summoned && o.count > total) {
      report(p.id, 'warn', `${w}: kill ${o.count} x ${o.enemy}, but only ${total} spawn (the player waits on respawns)`);
    }
  }
  ```
  Keep every existing rule. Do not change the exit-code logic (warnings do not fail).
- src/data/README.md: add one bullet at the end of the top list:
  "- Quest encounters: enemies a quest spawns (defend waves) are tagged with `encounterKey(questId, stage)`
  (`src/questRules.ts`) and cleared together (`clearEncounter` in `src/entities.ts`) when the defend stage resets,
  ends, or the player leaves the zone or dies. A defend stage starts only when the player stands in its circle. Only
  the player's own kills (or kills of enemies they hit) count for XP and kill stages; the AI gnome adventurers never
  run `solo` quests, quests given by a class trainer, or defend and escort quests (`companionMayTake`). The linter
  warns when a static spawn of a wave enemy sits within reach of a defend circle (spread + r + 12 m) and when a kill
  stage asks for more enemies than ever spawn."

## Contract
None for other issues; the linter reads `C.QUESTS`, `C.SPAWNS`, `C.ENEMIES` as they are today.

## Done when
- `npm run lint:content -w games/gnomes-of-gnomomia` exits 0 (0 errors).
- Its output includes warnings for these (found by a scan of the current data): defend overlaps in c5-mill-raid
  (c5-spawn-10), c6-firing-the-stone (c6-spawn-8), s07-dressing-the-king (c4-spawn-9), s08-the-roundup (s08-spawn-3);
  kill counts in c4-granary, c6-humming-seam, c7-supply-timber, c7-supply-iron, c7-supply-grain, s09-quiet-chorus.
  Report the full warning list in your final message. Do not fix those quests (another plan rebalances them).

## Out of scope
All .ts game code and every pack under src/data/packs. Do not turn the new warnings into errors.
~~~~

## Epic 2: Wire it in

Before launching: re-read 1A's and 1B's final exports and correct the names below if a worker changed them.

~~~~text
Epic: 2. Wire it in
Issue: 2A. Defend stages arm in the circle and clean up their waves; kill credit for quests and XP
Depends on: none (Epic 1 is merged)

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (repo root, a git worktree). Game:
games/gnomes-of-gnomomia (Vite + TypeScript + three.js). In Git Bash, if node is not found:
export PATH="/c/Program Files/nodejs:$PATH". node_modules is already installed; do not run npm install.
Other workers are editing other files of this game at the same time: change only the files under "Change".
Do not commit. Do not run `vite build` or start a dev server.

## Goal
A defend stage no longer floods the zone: its run starts only when the player stands in the circle, and every way a
run ends (falling back, death, leaving the zone, success) removes the enemies it spawned. Only kills that count for the
player (`byPlayer`) advance kill stages and give XP.

Background: today `tickDefend` starts a run whenever the player is anywhere in the quest's zone, fires the first wave
at once, resets after 5 s "outside", and starts again 0.25 s later, so the Warden trial spawned 3 water beetles every
~5 s for as long as the player stayed in Thatchford; the spawned beetles never despawned.

## Read first
- games/gnomes-of-gnomomia/src/quests.ts: whole file (291 lines): `DefendRun`, `defendRuns`, `advance` (the line
  `defendRuns.delete(id);`), `resetDefend`, `tickDefend`, `updateQuests`, `initQuests` (the `enemy-killed`,
  `zone-changed` and `player-died` handlers).
- games/gnomes-of-gnomomia/src/progression.ts: `initProgression` (lines ~54-69), the `enemy-killed` handler.
- games/gnomes-of-gnomomia/src/entities.ts: `spawnEnemyAt(defId, x, z, opts?: { townFight?: boolean; encounter?: string })`,
  `clearEncounter(key: string): number`, `encounterOf(id: number): string | undefined` (added by Epic 1).
- games/gnomes-of-gnomomia/src/questRules.ts: `encounterKey(questId: string, stage: number): string`,
  `defendWaveTotal(o)`, `DefendObjective`.
- games/gnomes-of-gnomomia/src/events.ts: `'enemy-killed': { defId: string; entityId: number; byPlayer: boolean }`.

## Change
- src/quests.ts:
  - imports: add `clearEncounter` to the './entities' import; `import { encounterKey } from './questRules';`.
  - New helper above `resetDefend`:
    ```ts
    /** Ends quest `id`'s defend run, if any, and removes the enemies it spawned. Returns how many living ones went. */
    function endDefend(id: string): number {
      const run = defendRuns.get(id);
      if (!run) return 0;
      defendRuns.delete(id);
      return clearEncounter(encounterKey(id, run.stage));
    }
    ```
  - `resetDefend(id, tell)`: keep the early return when there is no run; replace `defendRuns.delete(id)` with
    `endDefend(id)`.
  - `advance(id)`: replace `defendRuns.delete(id);` with
    `if (endDefend(id) > 0) say('The rest of them scatter.', UI.quest);`.
  - `tickDefend(id, step)`:
    - the "stage is not a defend" branch: `endDefend(id)` instead of `defendRuns.delete(id)`.
    - run creation: when there is no run (or `run.stage !== q.stage`, then first `endDefend(id)`), only start one if
      `!player.dead && playerDistance(o.x, o.z) <= o.r`; otherwise `return` (nothing spawns while the player is
      elsewhere in the zone). On start, after `defendRuns.set`, say
      `` say(`${def.name}: hold the circle for ${o.seconds} seconds.`, UI.quest); ``
    - wave spawn: `spawnEnemyAt(w.enemy, o.x + Math.cos(a) * d, o.z + Math.sin(a) * d, { townFight: true, encounter: encounterKey(id, run.stage) });`
    - Keep the leeway/outside timer, `DEFEND_OUTSIDE_SECONDS` reset and the success check as they are.
  - `initQuests`: the `zone-changed` handler calls `endDefend(id)` (not `defendRuns.delete(id)`) for runs whose zone is
    not `state.zone`. The `enemy-killed` handler becomes `bus.on('enemy-killed', ({ defId, byPlayer }) => {` and
    returns at once when `!byPlayer`. The `player-died` handler stays (resetDefend now clears the waves).
  - Update the `DefendRun` doc: "Runtime progress of a 'defend' stage. Not saved: a reload starts the stage again.
    It starts when the player steps into the circle; its waves are tagged encounterKey(questId, stage)."
- src/progression.ts: the `enemy-killed` handler becomes
  `bus.on('enemy-killed', ({ defId, byPlayer }) => { if (!byPlayer) return; ... })`. Nothing else.
- src/questDefend.test.ts (new), vitest. Imports: `QUESTS` from './content'; `allEntities, encounterOf, removeEntity`
  from './entities'; `player` from './player'; `startQuest, updateQuests` from './quests'; `state` from './state';
  `encounterKey, type DefendObjective` from './questRules'. Setup per test: `state.zone = 'thatchford'`,
  `delete state.quests['c2-trial-warden']`, `player.dead = false`; afterEach the same delete plus
  `for (const e of allEntities()) removeEntity(e.id)`. Helpers:
  `const o = QUESTS['c2-trial-warden'].stages[0].objective as DefendObjective;`
  `const tick = (s: number) => { for (let t = 0; t < s; t += 0.25) updateQuests(0.25); };`
  `const waves = () => allEntities().filter((e) => encounterOf(e.id) === encounterKey('c2-trial-warden', 0) && !e.dead);`
  `const firstWave = o.waves.filter((w) => w.at === 0).reduce((n, w) => n + w.count, 0);`
  One test, in order (`o.x`, `o.z` are world coordinates, like `player.position`):
  1. `player.position.set(o.x + 30, 0, o.z)`, `startQuest('c2-trial-warden')`, `tick(20)` -> `waves()` is empty.
  2. `player.position.set(o.x, 0, o.z)`, `tick(0.5)` -> `waves().length === firstWave`.
  3. `player.position.set(o.x + 30, 0, o.z)`, `tick(6)` -> `waves()` is empty (the run reset and cleared them).
  4. back to `(o.x, 0, o.z)`, `tick(0.5)` -> `waves().length === firstWave` (not doubled).
  5. `tick(o.seconds + 1)` -> `state.quests['c2-trial-warden'].stage === 1` and `waves()` is empty.
  (updateEntities is never called, so the spawned enemies stand still and never attack.)

## Contract
No new exports. Uses Epic 1's `clearEncounter`, `encounterOf`, `spawnEnemyAt(..., { encounter })`, `encounterKey`,
`DefendObjective` and the `byPlayer` event field by those names. `startQuest`, `updateQuests`, `initQuests`,
`questStatus`, `checkCondition` keep their signatures.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes
- `npm test -w games/gnomes-of-gnomomia -- src/questDefend.test.ts src/townPeace.test.ts` passes

## Out of scope
src/entities.ts, src/combat.ts, src/questRules.ts (Epic 1, done), src/companions.ts, src/companionLogic.ts,
src/sim/*, every pack.
~~~~

~~~~text
Epic: 2. Wire it in
Issue: 2B. AI gnome adventurers stay out of player-only quests and quest fights
Depends on: none (Epic 1 is merged)

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (repo root, a git worktree). Game:
games/gnomes-of-gnomomia (Vite + TypeScript + three.js). In Git Bash, if node is not found:
export PATH="/c/Program Files/nodejs:$PATH". node_modules is already installed; do not run npm install.
Other workers are editing other files of this game at the same time: change only the files under "Change".
Do not commit. Do not run `vite build` or start a dev server.

## Goal
The six AI gnome adventurers (companions) never pick the class trials, other trainer quests, `solo` quests, or defend
and escort quests; they ignore enemies a quest encounter spawned; and they only deal real damage to enemies this client
owns (otherwise their fight is simulated), so online their hits can't come back as the player's kill.

Background: companions used to take the player's active Calling trial and the other two trials, stand in the
Hold the Ford circle, draw the wave beetles, die, respawn at the shrine and walk back; every death made the beetles
give up and heal to full.

## Read first
- games/gnomes-of-gnomomia/src/companionLogic.ts: `selectQuestPools` (lines ~213-272): the `active` loop,
  `completedEntries`, the `fallback` and `anyUndone` filters, the `extra` filter.
- games/gnomes-of-gnomomia/src/companions.ts: imports (lines 4-21), `assignQuest` (~171, calls `selectQuestPools`),
  `findLiveEnemyForStage` (~249-267), `swingAtEnemy` (~400-427, the branch `} else if (distToPlayer <= 35) {`),
  `refreshQuestAssignments` (~727-741, calls `selectQuestPools` and computes `stale`).
- games/gnomes-of-gnomomia/src/questRules.ts: `companionMayTake(def: QuestDef, npcs): boolean` (Epic 1).
- games/gnomes-of-gnomomia/src/entities.ts: `encounterOf(id: number): string | undefined`, `isEntityAuthority(id)`
  (already imported by companions.ts).
- games/gnomes-of-gnomomia/src/companionLogic.test.ts: lines 1-59.

## Change
- src/companionLogic.ts: `selectQuestPools(quests, playerQuests, playerZone, playerLevel, priorLimit = 4, mayTake?: (def: QuestDef) => boolean)`.
  When `mayTake` is given, a quest for which it returns false is never added anywhere: skip it in the `active` /
  `completedEntries` loop, and add `&& (!mayTake || mayTake(q))` to the `fallback`, `anyUndone` and `extra` filters.
  Skipping happens before the `active.length === 0` check, so a player whose only active quest is a trial gets the
  zone fallback for the "current" pool. Document the new parameter in the JSDoc. Without `mayTake` the result is
  exactly as before (existing tests must pass unchanged).
- src/companions.ts:
  - imports: `import { companionMayTake } from './questRules';`, add `encounterOf` to the './entities' import, add
    `type QuestDef` to the './config' import.
  - module-level `const mayTake = (q: QuestDef): boolean => companionMayTake(q, NPCS);` and pass `mayTake` as the 6th
    argument to both `selectQuestPools(QUESTS, state.quests, state.zone, state.level, 4, mayTake)` calls.
  - `refreshQuestAssignments`: a companion whose current quest fails `mayTake` is stale too:
    `const banned = !!c.questId && !!QUESTS[c.questId] && !mayTake(QUESTS[c.questId]);` and
    `const stale = banned || !c.questId || (!valid.has(c.questId) && Math.abs(qLevel - state.level) > 3);`
  - `findLiveEnemyForStage`: skip `encounterOf(e.id) !== undefined` (next to the `e.dead` check).
  - `swingAtEnemy`: the real-damage branch becomes `} else if (distToPlayer <= 35 && isEntityAuthority(e.id)) {`;
    a hit on an enemy another client owns falls through to the existing simulated branch (`c.simSwings += 1 ...`).
  - Nothing else: movement, strolling, levels, respawn and bubbles stay as they are.
- src/companionLogic.test.ts: one new `it('keeps AI gnomes out of the Calling trials and other player-only quests', ...)`:
  import `companionMayTake` from './questRules'; `const mayTake = (q) => companionMayTake(q, NPCS);`;
  `const pools = selectQuestPools(QUESTS, { 'c2-calling': { stage: 1, count: 0, done: false }, 'c2-trial-warden': { stage: 0, count: 0, done: false } }, 'thatchford', 6, 4, mayTake);`
  then for each of 'c2-calling', 'c2-trial-warden', 'c2-trial-slinger', 'c2-trial-mage': not in `pools.current` and
  not in `pools.prior`; `pools.current.length > 0` (the fallback filled it).

## Contract
`selectQuestPools(quests, playerQuests, playerZone, playerLevel, priorLimit?, mayTake?)`: the 6th parameter is new and
optional. companions.ts keeps every export (`initCompanions`, `updateCompanions`, `localCompanions`,
`companionPoses`, `CompanionView`, `CompanionBubble`) unchanged.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes
- `npm test -w games/gnomes-of-gnomomia -- src/companionLogic.test.ts` passes

## Out of scope
src/entities.ts, src/questRules.ts, src/quests.ts, src/progression.ts, src/sim/*, every pack. Do not change companion
movement, travel, idle, level or gear logic (another plan owns that).
~~~~

~~~~text
Epic: 2. Wire it in
Issue: 2C. The balance sim fights the trials the game spawns
Depends on: none (Epic 1 is merged)

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (repo root, a git worktree). Game:
games/gnomes-of-gnomomia. In Git Bash, if node is not found: export PATH="/c/Program Files/nodejs:$PATH".
node_modules is already installed; do not run npm install. Other workers are editing other files of this game at the
same time: change only the files under "Change". Do not commit.

## Goal
The sim's Hold the Ford scenario is built from the quest data (it had drifted: the sim ran 2/2/2 beetles while the
game spawned 3/3/4), and a balance test pins all three Calling trials as winnable by the classless level-6 gnome who
takes them. Measured before this plan with ford waves 1/1/2: ford 1.00, two magpies at once 0.90, two muck sprites at
once 0.95 (TacticalPlayer, 20 seeds, classless L6, zone-plain).

## Read first
- games/gnomes-of-gnomomia/src/sim/scenarios.ts: whole file; the `tf-ford-defend`, `tf-magpie-trial`,
  `tf-sprite-trial` entries (lines ~72-100); `import { ENEMIES } from '../content';`.
- games/gnomes-of-gnomomia/src/sim/types.ts: `ScenarioSpec` (lines 40-51; `zone?: OutdoorZoneId`), `EnemySpawnSpec`.
- games/gnomes-of-gnomomia/src/sim/balance.test.ts: imports (lines 1-9) and the `describe('combat.md baseline curve
  invariants'` block (~205-229) for the runMonteCarlo style.
- games/gnomes-of-gnomomia/src/data/packs/ch2-thatchford.ts: quest `c2-trial-warden` (its stage 0 is the defend:
  waves 1/1/2 water beetles at 0/20/40 s, r 6, 60 s).

## Change
- src/sim/scenarios.ts:
  - import `QUESTS` beside `ENEMIES` from '../content', and `type OutdoorZoneId` from '../config'.
  - new export above `RAW_SCENARIOS`:
    ```ts
    /** A defend scenario built from quest `questId`'s defend stage, so the sim always fights the waves the game spawns. */
    export function scenarioFromDefend(questId: string, id: string, name: string): ScenarioSpec {
      const stage = QUESTS[questId]?.stages.find((s) => s.objective.type === 'defend');
      if (!stage || stage.objective.type !== 'defend') throw new Error(`Quest '${questId}' has no defend stage`);
      const o = stage.objective;
      return {
        id, name, kind: 'defend', zone: o.zone as OutdoorZoneId, defendRadius: o.r, defendSeconds: o.seconds,
        waves: o.waves.map((w) => ({ enemyId: w.enemy, count: w.count, distance: 10, spawnAtSeconds: w.at })),
      };
    }
    ```
  - replace the literal `tf-ford-defend` entry with
    `scenarioFromDefend('c2-trial-warden', 'tf-ford-defend', 'Thatchford: Hold the Ford (Defend 60s)'),`.
  - after `tf-sprite-trial`, add:
    `{ id: 'tf-magpie-pair', name: 'Thatchford: Shiny Thieves pull (2x L8 magpie)', kind: 'pack', zone: 'thatchford', waves: [{ enemyId: 'magpie-thief', count: 2, distance: 7, angleSpread: 1.2 }] },`
    `{ id: 'tf-sprite-pair', name: 'Thatchford: Dry Them Out pull (2x L7 sprite)', kind: 'pack', zone: 'thatchford', waves: [{ enemyId: 'muck-sprite', count: 2, distance: 7, angleSpread: 1.2 }] },`
  - leave `tf-magpie-trial` and `tf-sprite-trial` as they are (other tests use them).
- src/sim/balance.test.ts: import `QUESTS` beside `ITEMS` from '../content'. New block at the end:
  ```ts
  describe('the Calling trials (taken classless, before a class is chosen)', () => {
    const classless: LoadoutSpec = { level: 6, classId: null, gearTier: 'zone-plain' };
    it('the sim fights the same ford waves the quest spawns', () => {
      const o = QUESTS['c2-trial-warden'].stages[0].objective;
      if (o.type !== 'defend') throw new Error('c2-trial-warden stage 0 is not a defend');
      expect(SCENARIOS['tf-ford-defend'].waves.map((w) => [w.enemyId, w.count, w.spawnAtSeconds]))
        .toEqual(o.waves.map((w) => [w.enemy, w.count, w.at]));
    });
    it('every trial is winnable by a careful classless level-6 gnome', () => {
      for (const id of ['tf-ford-defend', 'tf-magpie-pair', 'tf-sprite-pair']) {
        const s = runMonteCarlo(SCENARIOS[id], classless, TacticalPlayer, { seeds: 20 });
        expect(s.winRate, id).toBeGreaterThanOrEqual(0.8);
      }
    }, 120000);
  });
  ```

## Contract
`export function scenarioFromDefend(questId: string, id: string, name: string): ScenarioSpec` (scenarios.ts).
`SCENARIOS` / `SCENARIO_LIST` keep every existing id; two ids are added.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes
- `npm test -w games/gnomes-of-gnomomia -- src/sim/balance.test.ts` passes (all blocks, old and new). If the new
  win-rate test fails, report each scenario's winRate; do not change quest data or lower the 0.8 bar.

## Out of scope
src/sim/arena.ts, runner.ts, agents.ts, economy*.ts, the economy golden, every pack, src/quests.ts.
~~~~

## Shared files with the sibling plans

| File | This plan | Likely sibling |
|---|---|---|
| `src/companions.ts` | 2B: `mayTake` filter, `refreshQuestAssignments` stale rule, `findLiveEnemyForStage` encounter skip, `swingAtEnemy` authority check | 2 (idle/travel, level/gear), 4 (partying) |
| `src/companionLogic.ts` (+ test) | 2B: optional 6th param of `selectQuestPools` | 2 (quest pick / level appropriateness), 4 |
| `src/entities.ts` | 1A: kill credit, encounters, aggro skip | 3 (raids may spawn waves: should use `encounter`), 4 (party kill credit may extend `byPlayer`) |
| `src/combat.ts`, `src/events.ts`, `src/progression.ts` | 1A, 2A: `byPlayer` | 3 (XP retune), 4 (party XP share) |
| `src/quests.ts` | 2A: defend runs | 3 (raid quests), 4 (shared quest credit) |
| `src/data/packs/ch2-thatchford.ts` | 1C: trial numbers and text | 3 (Thatchford retune) |
| `src/sim/scenarios.ts`, `src/sim/balance.test.ts` | 2C | 3 (full re-simulation) |
| `scripts/lint-content.mjs` | 1D | 3 (may add rules) |
