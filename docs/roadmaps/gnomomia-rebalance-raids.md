# Gnomomia: re-simulate, re-balance, and raids (horn calls) with reforging

Game: `games/gnomes-of-gnomomia`. One of four parallel roadmaps from the same request; the others cover (1) specialization quests, the quest framework and the respawn bug, (2) adventurer (AI gnome) idle/travel and level/gear fit, (4) partying. This plan does not touch `src/companions.ts`, `src/companionLogic.ts`, `src/quests.ts`, `src/net/*` or the quest packs.

## Goal

1. **Re-simulate and fix fast levelling.** Report: "level 8, killing water beetles, levelling a lot, nearly max level". Diagnosis from the code:
   - The economy sim does not model it. Solo, a water beetle (L6) is worth 15 XP to a level-8 player (`killXpAt`, level difference -2 = x0.6). Level 8 to 9 costs 2,829 XP: 189 kills, about 1.8 h at the sim's 35 s per kill.
   - **Every enemy that dies near the player pays the player in full**, whoever killed it. `killEntity` (src/entities.ts) always emits `enemy-killed`, and `progression.ts` grants kill XP on every such event. The six AI gnomes (`src/companions.ts`) deal real damage to enemies within 35 m of the player (`dealDamage(..., { attacker: targetId(c) })`), and their hits skip armour. Three AI gnomes on a water-beetle quest kill about 3 beetles a minute next to you, so they roughly double or triple your XP rate. The kills also drop loot and coins for the player. The sim never sees this, so the sim passes while play is fast.
   - The fix is **kill credit (tagging)**: an enemy pays XP, loot and gold only if the player hit it since it spawned or reset (or the zone authority says the player killed it). Raid spawns never pay (`EnemyDef.noReward`); the raid's clear pays instead. Kill-quest counts are unchanged (quests.ts belongs to roadmap 1).
   - A farm report (`npm run sim:economy -- --farm=water-beetle@8,assist=3`) shows minutes per level and skill-ups per hour, solo and with assisted kills, so the human can check the before and after. "Nearly max level" may also mean the use-based skill near its cap (cap 37 at L8; a use counts double below 0.8 x cap). The farm report prints both, and the economy doc records the numbers.
2. **Raids ("horn calls" in-world)**, open after the second town: Chapter 2's finale `c2-letter-for-the-queen` (Thatchford) unlocks every horn post. There are five, one per later zone. Each is a boss plus waves of adds in an open arena, targeting a 2-3 minute clear (`RAID_TUNING.targetSeconds = [120, 180]`), with 3 **spawned helpers** (Wayfarers answering the horn: a tank, a healer, a damage dealer).
3. **Raid gear, always worth getting:** each raid has 5 drops (warden weapon, slinger weapon, mage weapon, cloth hood, trinket), each rolling **1 in 5** (`RAID_TUNING.dropChance = 0.2`) on a win. Every drop is good gear at once (heirloom, ilvl = raid level + 1), and it is the input of a **reforging** recipe at the next zone's reforging anvil, which turns it (plus coins) into the next tier's piece. The chain runs Keep -> Sodbury -> Clippings -> Flintdelve -> Last Tuft. Raid and reforged gear sells for almost nothing (the horn mark), so raids are not a coin farm.
4. **Party-ready:** helpers fill seats through `seatRaid()` in `src/raidRoster.ts`. The party roadmap plugs real members in with `setPartySource()`; party members then take seats, and helpers fill only the rest. The `raid-started` / `raid-ended` events carry the seats.
5. **Re-balance with the sims:** the economy sim models raid clears (XP, coins, time) and gets a `RAID_FARM` flag, so raids never out-level questing. A new `sim:raid` runs every raid x class in the combat arena with helpers, and the raid numbers are tuned into the 2-3 minute band.

**Mobile:** raids start from a world object (tap), the raid HUD is passive with one 44 px Leave button, and the reforging panel follows the shop's 44 px cells. **Online:** raids run on the client that blows the horn. Raid enemies are dynamic spawns (already relayed); helpers are local and not relayed. When another client is the zone's enemy authority, helper damage is forwarded but enemies there do not target helpers. Real party members replace helpers once the party roadmap lands. **Party slice:** none; the backlog row `gnomomia-skirmish` stays "later". **Achievements:** four, in `packages/achievements`. **Player gnome:** unchanged (helpers are other gnomes, built with `createGnomeModel`).

### The five raids

Arena spots were found by script: 15 m circles fully open on the terrain (`terrain.staticSolidAt`), clear of towns (+8 m), ambient spawn circles (+6 m) and NPCs. Coordinates are zone-local.

| Raid id | Zone | Level / min | Arena (x, z, r) | Horn post (x, z) | Boss | Adds | Drops (ilvl) | Reforged at |
|---|---|---|---|---|---|---|---|---|
| `raid-keep` | keep | 12 / 10 | (-40, -30, 14), west lawn below the Archive | (-40, -16) | Murmur, the Starling Mother (winged) | starlings | 13 heirloom | Sodbury (ilvl 17) |
| `raid-clover` | cloverfield | 16 / 14 | (-80, -20, 14), Honeydew Ranch silos | (-80, -6) | Grainsack, the Field-Mouse King (furred) | harvest mice | 17 heirloom | Clippings (ilvl 21) |
| `raid-hedge` | hedgewood | 20 / 18 | (-65, -40, 14), under the Elder Privet | (-65, -26) | Ironhorn, the Old Stag (shelled) | young stags | 21 heirloom | Flintdelve (ilvl 25) |
| `raid-rock` | rockery | 24 / 22 | (65, -45, 14), below the Shard Mine | (65, -31) | Clinkerback, the Seam Centipede (shelled) | rock-lice | 25 heirloom | Last Tuft (ilvl 30) |
| `raid-verge` | verge | 29 / 27 | (-70, 55, 14), the western Shorn | (-70, 69) | Old Sump, Rust-Rat of the Oil Drum (metal) | sump rats | 30 kilnfired | (top tier) |

Reforging anvils (pack `raid-stations`, zone-local, 2.5 m east of the town smith): `raid-anvil-sodbury` cloverfield (10.5, 6), `raid-anvil-clippings` hedgewood (36.5, 44), `raid-anvil-flintdelve` rockery (8.5, 24), `raid-anvil-last-tuft` verge (-3.5, 91).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation: kill credit, raid types and registry, stubs, farm report, lore | `npm run build` + `npm test` + `lint:content` pass; `npm run lore -- check` passes; the game plays as before except untagged kills pay nothing | 4 (1A, 1B, 1C, 1D) |
| 2. Systems: roster and helper logic, raid runtime, helpers, reforging, UIs, achievements, arena helpers, raid sim | build + tests pass; `?zone=keep` plays; nothing visible yet (no raid content) | 8 (2A-2H) |
| 3. Content: the five raids, the reforging chain, boss lore, design doc | `raidContent.test.ts` passes for all five; `?raid=raid-keep` playable; lint, lore check, zfight | 6 (3A-3F) |
| 4. Re-simulate and tune | `sim:economy -- --check` and `sim:raid -- --check` pass; golden regenerated; docs record before/after | 2 (4A, 4B) |

1B is almost entirely verbatim code. The planner may apply it directly instead of sending it to a worker.

### Files each epic changes (for sequencing against the other three roadmaps)

All paths under `games/gnomes-of-gnomomia/` unless they start with `docs/`, `packages/` or `AGENT_INDEX.md`.

- **Epic 1**
  - 1A: `src/config.ts`, `src/events.ts`, `src/entities.ts`, `src/progression.ts`, `src/objectModels.ts`, new `src/killCredit.test.ts`
  - 1B: new `src/raidTypes.ts`, new `src/data/raidTuning.ts`, `src/data/economy.ts`, `src/economy.ts`, `src/content.ts`, `src/main.ts`, `package.json`, `src/sim/types.ts`; new stubs `src/raids.ts`, `src/raidHelpers.ts`, `src/raidRoster.ts`, `src/raidHelperLogic.ts`, `src/crafting.ts`, `src/ui/raidHud.ts`, `src/ui/craft.ts`, `src/raidAchievements.ts`, `src/sim/raidScenarios.ts`, `scripts/sim-raid.mjs`, `src/data/packs/raid-stations.ts`, `src/data/packs/raid-{keep,clover,hedge,rock,verge}.ts`
  - 1C: new `src/sim/farm.ts`, new `src/sim/farm.test.ts`, `scripts/sim-economy.mjs`
  - 1D: new `docs/lore/entries/fescue/horn-calls.md`, new `docs/lore/entries/fescue/horn-marked-gear.md`, `docs/lore/rulings.md`, `docs/lore/entries/fescue/wayfarers.md` (planner then runs `npm run lore`, which rewrites `docs/lore/INDEX.md`)
- **Epic 2**
  - 2A: `src/raidRoster.ts`, `src/raidHelperLogic.ts`, new `src/raidLogic.test.ts`, new `src/raidContent.test.ts`
  - 2B: `src/raids.ts`
  - 2C: `src/raidHelpers.ts`
  - 2D: `src/crafting.ts`, new `src/crafting.test.ts`, `src/data/packs/raid-stations.ts`
  - 2E: `src/ui/raidHud.ts`, `src/ui/craft.ts`
  - 2F: `src/raidAchievements.ts`, `packages/achievements/src/catalog.ts` (+ possibly a `packages/prefabs/src/catalog/cosmetics-*.ts` file)
  - 2G: `src/sim/arena.ts`, `src/sim/loadout.ts`
  - 2H: `src/sim/raidScenarios.ts`, `scripts/sim-raid.mjs`
- **Epic 3**
  - 3A-3E: `src/data/packs/raid-<keep|clover|hedge|rock|verge>.ts` plus one new lore entry each in `docs/lore/entries/fescue/`
  - 3F: new `docs/design/gnomomia/raids.md`, `docs/design/gnomomia/README.md`, `AGENT_INDEX.md`
- **Epic 4**
  - 4A: `src/sim/economy.ts`, `scripts/sim-economy.mjs`, `src/sim/economy.golden.json`, `src/data/economy.ts` (ECONOMY.raid values), `docs/design/gnomomia/economy.md`
  - 4B: `src/data/raidTuning.ts`, new `src/sim/raid.test.ts`, `src/data/packs/raid-*.ts` (waves and move timings only), `docs/design/gnomomia/raids.md`

**Shared with the other roadmaps (sequence or rebase these):**
- `src/entities.ts`, `src/progression.ts`, `src/events.ts`, `src/config.ts` (1A): likely touched by roadmap 1 (respawn bug, quest framework), roadmap 2 (AI gnomes) and roadmap 4 (party events).
- `src/content.ts`, `src/main.ts`, `package.json` (1B): roadmap 1 (pack merging), roadmaps 2 and 4 (init and update loop).
- `src/sim/economy.ts`, `src/sim/economy.golden.json`, `src/data/economy.ts`, `docs/design/gnomomia/economy.md` (4A): roadmap 1's quest rebalance almost certainly re-runs the economy sim and regenerates the golden. Whichever lands second re-runs `UPDATE_GOLDEN=1`.
- `docs/lore/rulings.md`, `docs/lore/entries/fescue/wayfarers.md` (1D): the others may add rulings or edit Wayfarers. Use the next free R- number at edit time.
- `AGENT_INDEX.md` (3F), `packages/achievements/src/catalog.ts` (2F).
- Party hook for roadmap 4: `setPartySource(src)` in `src/raidRoster.ts` and the `RaidPartyMember` / `PartySource` types in `src/raidTypes.ts`. Its party members take raid seats; helpers fill the rest.

### End-of-epic checks (planner)

From the repo root, with `export PATH="/c/Program Files/nodejs:$PATH"` if needed:

```
npm run build -w games/gnomes-of-gnomomia
npm test -w games/gnomes-of-gnomomia
npm run lint:content -w games/gnomes-of-gnomomia
npm run lore            # after any docs/lore change (rewrites INDEX.md)
npm run dev -w games/gnomes-of-gnomomia    # port 5291, then:
bash tools/smoke.sh "http://localhost:5291/?zone=keep" "#ui"
```

After Epic 3, also run `bash tools/smoke.sh "http://localhost:5291/?raid=raid-keep" "#ui"`, `npm run zfight -- "http://localhost:5291/?raid=raid-keep"` and `npm test -w packages/achievements`. After Epic 4: `npm run sim:economy -w games/gnomes-of-gnomomia -- --check` and `npm run sim:raid -w games/gnomes-of-gnomomia -- --check`.

---

## Epic 1: Foundation

### 1A: Kill credit, raid-ready target sources, new events and types

~~~~text
Epic: 1 Foundation
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (a git worktree; work only here). Git Bash: if `node`
is not found, run `export PATH="/c/Program Files/nodejs:$PATH"`. If node_modules is missing, run `npm install` at the
repo root. Game: games/gnomes-of-gnomomia (three.js + TypeScript). Other workers are editing other files in this game
at the same time: change only the files listed under Change. Do not commit. Do not run `npm run build` (writes dist/).

## Goal
Enemies pay kill XP, loot and gold only when the local player hit them (kill credit). Today every enemy that dies near
the player pays the player in full, even when an AI gnome (src/companions.ts) killed it, which makes levelling much
faster than designed. Also: enemies can fight more than one set of local AI targets (so raid helpers can be targets
later), and the types and events the raid feature needs exist.

## Read first
- games/gnomes-of-gnomomia/src/entities.ts: `Slot` interface (~line 66), `setCompanionTargets` and `companionTargets`
  (lines ~48-62, used again at ~405, ~436, ~546), `resolveTarget`, `findAggroTarget`, the respawn block in the enemy
  update (`if (slot.deadFor >= def.respawnSeconds)`, ~486), the leash give-up block that emits 'enemy-reset' (~525),
  `snapHome`, `addSlot` (where Slot literals are built), `killEntity` (~728), `applyRemoteEnemyKill` (~940).
- games/gnomes-of-gnomomia/src/progression.ts: `initProgression` ('enemy-killed' handler).
- games/gnomes-of-gnomomia/src/events.ts: `GameEvents`.
- games/gnomes-of-gnomomia/src/config.ts: `ItemDef`, `EnemyDef`, `WorldObjectDef`.
- games/gnomes-of-gnomomia/src/objectModels.ts: `MODEL_SPECS` (a Record over every WorldObjectDef model).

## Change
- src/config.ts:
  - `ItemDef`: add `source?: 'raid' | 'craft';   // raid drop or reforged item (src/raids.ts, src/crafting.ts): no shop sells it, and the sim's gear tiers skip it`
  - `EnemyDef`: add `noReward?: boolean;   // raid spawns: no kill XP, loot or gold (the raid's clear pays instead)`
  - `WorldObjectDef['model']`: add `| 'horn' | 'anvil'` to the union.
- src/objectModels.ts: add two MODEL_SPECS entries, built only from existing prefabs:
  - `horn: { color: 0x6b4a2b, prefab: 'wooden-post', build: (g, c) => { const post = buildPrefab('wooden-post', { tint: c });
    const horn = buildPrefab('signal-horn', { scale: 1.6 }); horn.position.y = new THREE.Box3().setFromObject(post).max.y;
    g.add(post, horn); } }` (import THREE from 'three' if the file does not already; it may only import three,
    @lawn/prefabs and types).
  - `anvil: { color: 0x4a4a52, prefab: 'anvil', build: (g, c) => { g.add(buildPrefab('anvil', { tint: c, scale: 1.3 })); } }`
- src/events.ts, in GameEvents:
  - change `'enemy-killed'` to `{ defId: string; entityId: number; credited?: boolean }` with the doc comment
    "credited: the local player hit it since it spawned or reset (or the zone authority said this player killed it),
    and its EnemyDef is not noReward. Only credited kills pay kill XP, loot and gold. Absent = true (old emitters)."
  - add `'raid-started': { raidId: string; seats: readonly { kind: 'player' | 'party' | 'helper'; id: string; name: string }[] };`
  - add `'raid-ended': { raidId: string; won: boolean; seconds: number; drops: readonly string[] };`
  - add `'item-crafted': { recipeId: string; item: string };`
  (Inline types only: events.ts must not import from raid files.)
- src/entities.ts:
  - Target sources. Replace the single `companionTargets` with a map, keeping `setCompanionTargets` working:
    ```ts
    /** Target ids at or below this are this client's raid helpers (raidHelpers.ts): helper n is RAID_HELPER_TARGET_BASE - n.
     * They are also <= COMPANION_TARGET_BASE, so every local-AI check treats them alike. */
    export const RAID_HELPER_TARGET_BASE = -1000;
    const targetSources = new Map<string, CompanionTargets>();
    /** Registers (null removes) a set of local AI targets enemies may fight: 'companions' (companions.ts), 'raid-helpers' (raidHelpers.ts). */
    export function setTargetSource(key: string, src: CompanionTargets | null): void {
      if (src) targetSources.set(key, src); else targetSources.delete(key);
    }
    export function setCompanionTargets(src: CompanionTargets | null): void { setTargetSource('companions', src); }
    function* localTargets(): Iterable<RemoteTarget> { for (const s of targetSources.values()) yield* s.targets(); }
    function localTargetOwner(id: number): CompanionTargets | null {
      for (const s of targetSources.values()) for (const t of s.targets()) if (t.id === id) return s;
      return null;
    }
    ```
    In resolveTarget use `localTargets()` where it used `companionTargets?.targets()`; in findAggroTarget replace
    `if (companionTargets) for (const ct of companionTargets.targets()) consider(ct);` with
    `for (const ct of localTargets()) consider(ct);`; where an enemy swings at a companion target use
    `localTargetOwner(tgt.id)?.attack(tgt.id, e);`. Delete `let companionTargets`.
  - Kill credit. PREREQUISITE, ALREADY DONE by the quest-rebalance roadmap (merged earlier on this branch): `enemy-killed`
    carries `byPlayer: boolean` (true only when the local player hit the enemy; AI-gnome-only kills are false), and
    src/killCredit.test.ts already exists. Do NOT add a `tagged`/`credited` mechanism and do NOT edit that test file
    except to append cases. Your change: in killEntity in src/entities.ts, loot, gold and spawnLoot are rolled only when
    `byPlayer && !def.noReward` (read the local `byPlayer` that killEntity already computes); the "You defeated" line
    follows `byPlayer` as before. In src/progression.ts the 'enemy-killed' handler additionally returns early when
    `defId` resolves to an EnemyDef with `noReward`. Append one case to src/killCredit.test.ts: a temporary def
    `ENEMIES['test-raid-slug'] = { ...ENEMIES.slug, id: 'test-raid-slug', noReward: true }` hit by the player then
    killed: state.xp unchanged and no loot entity (delete the def afterwards).

## Contract
- `RAID_HELPER_TARGET_BASE = -1000`, `setTargetSource(key, src)`, `CompanionTargets` (unchanged shape:
  `targets(): Iterable<RemoteTarget>; attack(id: number, enemy: Entity): void`).
- 'enemy-killed' payload is `{ defId, entityId, byPlayer }` (owned by quest-rebalance); new events 'raid-started', 'raid-ended',
  'item-crafted' exactly as above.
- `ItemDef.source?: 'raid' | 'craft'`, `EnemyDef.noReward?: boolean`, models 'horn' and 'anvil'.
- Kill-quest counting in src/quests.ts is NOT changed (other roadmap). Scripted kills in src/mower.ts now pay only if
  the player hit the part; that is intended.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` (repo root) passes.
- `npx vitest run src/killCredit.test.ts src/net/enemySync.test.ts src/companionLogic.test.ts` passes (run inside
  games/gnomes-of-gnomomia).

## Out of scope
src/companions.ts, src/quests.ts, src/net/*, src/content.ts, src/main.ts, src/data/*: other workers and roadmaps own them.
~~~~

### 1B: Raid types, tuning, economy formulas, registry, stubs and wiring (verbatim)

~~~~text
Epic: 1 Foundation
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Other workers are changing
src/config.ts, src/events.ts, src/entities.ts, src/progression.ts, src/objectModels.ts and src/sim/farm.ts right now:
do not touch them. Do not commit. Do not run `npm run build`.

## Goal
Every raid and reforging file exists with its final exported signature (stubs), the content registry merges raid packs
into RAIDS and RECIPES, the economy has the raid formulas, and main.ts calls the raid systems. Behaviour is unchanged.

## Read first
- games/gnomes-of-gnomomia/src/content.ts: PACKS list (line ~51), the pass-3 world shift (`shiftX`/`shiftZ`, the loops
  after them) and the LOAD_ERRORS throw at the end.
- games/gnomes-of-gnomomia/src/main.ts: imports, init calls (lines ~95-121), the frame loop, the `debugZone` branch.
- games/gnomes-of-gnomomia/src/economy.ts and src/data/economy.ts.
- games/gnomes-of-gnomomia/src/sim/types.ts: `LoadoutSpec`, `ScenarioSpec`.

## Change (paste the code as given)
1. New src/raidTypes.ts:
```ts
// Raid ("horn call") and reforging types. Design: docs/design/gnomomia/raids.md. Types only.
import type { ClassId, Condition, OutdoorZoneId } from './config';

/** Who sits in a raid seat: the local player, a real party member (the party system), or a spawned helper. */
export type RaidSeatKind = 'player' | 'party' | 'helper';
/** What a seat does in the fight: Warden = tank, Hedge-Mage = healer, Slinger = damage. */
export type HelperRole = 'tank' | 'healer' | 'damage';

export interface RaidSeat {
  kind: RaidSeatKind;
  /** 'me' for the player, the member id for a party seat, 'helper-<n>' (n = 0, 1, 2 ...) for helpers. */
  id: string;
  name: string;
  classId: ClassId;
  level: number;
  role: HelperRole;
  /** Helpers only: gnome colours for createGnomeModel(look(hat, shirt, beard)). */
  colors?: { hat: number; shirt: number; beard: number };
}

/** A real party member, as the party system reports them through raidRoster.setPartySource(). */
export interface RaidPartyMember { id: string; name: string; classId: ClassId | null; level: number; zone: string; x: number; z: number }
/** Plugged in by the party system. Until then there is none, and every free seat is a helper. */
export interface PartySource { members(): readonly RaidPartyMember[] }

export interface RaidWave {
  /** ENEMIES id. */
  enemy: string;
  count: number;
  /** Seconds after the pull (the boss comes at 0). */
  at: number;
}

export interface RaidDef {
  id: string;
  /** Shown in the HUD and chat. */
  name: string;
  zone: OutdoorZoneId;
  /** Raid level: its enemies, its clear XP, its drops (ilvl = level + 1). */
  level: number;
  /** The horn refuses players below this level. */
  minLevel: number;
  /** Arena centre and radius. Zone-local in the pack; content.ts moves x and z to world coordinates. */
  x: number; z: number; r: number;
  /** ENEMIES id of the boss: spawned at the arena centre at the pull; the raid is won when it dies. */
  boss: string;
  /** Adds, spawned on the arena edge at their time. */
  waves: readonly RaidWave[];
  /** OBJECTS id of the horn post that starts it. */
  horn: string;
  /** ITEMS ids; on a win each drops with chance RAID_TUNING.dropChance. */
  drops: readonly string[];
  /** Chat lines at the horn and on the win. */
  intro: string;
  victory: string;
}

/** Reforging: raid gear (plus coins) becomes a new piece at a reforging anvil. */
export interface RecipeDef {
  id: string;
  /** OBJECTS id of the reforging anvil (model 'anvil') that offers it. */
  station: string;
  /** ITEMS id made. */
  makes: string;
  needs: readonly { item: string; count: number }[];
  /** Coins taken: packs use craftGold(ilvl of `makes`) from src/economy.ts. */
  gold: number;
  when?: Condition;
}

/** What a raid pack exports beside its ContentPack. */
export interface RaidPack { raids?: readonly RaidDef[]; recipes?: readonly RecipeDef[] }
```
2. New src/data/raidTuning.ts:
```ts
// Raid tuning: every number behind raid fights and helpers. Tune against `npm run sim:raid -w games/gnomes-of-gnomomia`
// (target: a clear inside targetSeconds). XP, coins and item value are in src/data/economy.ts (ECONOMY.raid).
import type { Condition } from '../config';
import { avgHit } from '../rules';
import type { HelperRole } from '../raidTypes';

/** Raids open once Chapter 2 is done (A Letter for the Queen, Thatchford): after the second town. */
export const RAID_UNLOCK: Condition = { quest: { id: 'c2-letter-for-the-queen', status: 'done' } };

export const RAID_TUNING = {
  /** Seats including the player; helpers fill those no party member takes. */
  seats: 4,
  /** Chance of each listed drop on a win. */
  dropChance: 0.2,
  /** Wanted clear time from the pull (sim:raid --check). */
  targetSeconds: [120, 180] as const,
  /** Seconds from the horn to the pull. */
  pullDelaySeconds: 5,
  /** A raid still going after this is lost. */
  maxSeconds: 360,
  /** Leaving the arena by more than leaveMargin metres for leaveGraceSeconds loses the raid. */
  leaveMargin: 10,
  leaveGraceSeconds: 8,
  /** Party members this close to the horn take seats. */
  partyRange: 30,
  /** Helpers stay this long after a win, then go. */
  helperLingerSeconds: 6,
  /** Boss and add HP, in normal enemies of the same level (raidBossHp / raidAddHp). */
  bossHpNormals: 40,
  addHpNormals: 1.5,
  helper: {
    /** Damage per swing, in avgHit(level). */
    hitNormals: { tank: 0.6, healer: 0.5, damage: 1.0 } satisfies Record<HelperRole, number>,
    attackSeconds: 2.0,
    /** Max HP, in avgHit(level). */
    hpNormals: { tank: 12, healer: 7, damage: 7 } satisfies Record<HelperRole, number>,
    /** How close a helper stands to its target (m). */
    range: { tank: 1.6, healer: 9, damage: 9 } satisfies Record<HelperRole, number>,
    /** Healer: heals healNormals x avgHit(level) every healSeconds to whoever is lowest, when below healBelow of max. */
    healNormals: 1.2,
    healSeconds: 3,
    healBelow: 0.75,
    /** A downed helper gets up after reviveSeconds with reviveHpFrac of max HP. */
    reviveSeconds: 20,
    reviveHpFrac: 0.5,
    damageTakenMult: 1,
  },
  /** Combat-arena only (the game's enemies pick targets themselves). */
  sim: { addsOnPlayerShare: 0.5 },
} as const;

/** HP of one normal enemy of this level (the formula in rules.enemyStats): the unit raid HP counts in. */
export function normalHp(level: number): number {
  return avgHit(level) * Math.min(5, 3 + level / 5);
}
export function raidBossHp(level: number): number {
  return Math.round(normalHp(level) * RAID_TUNING.bossHpNormals);
}
export function raidAddHp(level: number): number {
  return Math.round(normalHp(level) * RAID_TUNING.addHpNormals);
}
```
3. src/data/economy.ts, inside ECONOMY after `skill: {...},` add:
```ts
  /** Raids (src/raids.ts): a win pays the XP of clearXpKills normal kills of the raid's level and clearGold x coinMult;
   * raid kills pay nothing themselves (EnemyDef.noReward). Raid and reforged gear sells for itemValuePerIlvl x ilvl
   * (the horn mark: shops pay little for it). Reforging costs craftGoldPerIlvlSq x ilvl^2 coins. */
  raid: { clearXpKills: 8, clearGold: 30, itemValuePerIlvl: 2, craftGoldPerIlvlSq: 2 },
```
4. src/economy.ts, append:
```ts
/** XP for winning a raid of `raidLevel` (ECONOMY.raid.clearXpKills normal kills; level difference applies). */
export function raidClearXp(raidLevel: number, playerLevel: number): number {
  return Math.round(killXpAt(raidLevel, 'normal', playerLevel) * ECONOMY.raid.clearXpKills);
}
/** Coins for winning a raid of `raidLevel`. */
export function raidClearGold(raidLevel: number): number {
  return Math.round(ECONOMY.raid.clearGold * coinMult(raidLevel));
}
/** Sale value of raid and reforged gear (low on purpose). */
export function raidItemValue(ilvl: number): number {
  return Math.max(1, Math.round(ECONOMY.raid.itemValuePerIlvl * ilvl));
}
/** Coins a reforging recipe takes for an item of this ilvl. */
export function craftGold(ilvl: number): number {
  return Math.round(ECONOMY.raid.craftGoldPerIlvlSq * ilvl * ilvl);
}
```
5. Six new pack stubs in src/data/packs/. raid-stations.ts:
```ts
// Pack raid-stations: the reforging anvils beside the smiths of Sodbury, Clippings, Flintdelve and Last Tuft (src/crafting.ts).
import type { ContentPack } from '../../config';
export const PACK: ContentPack = { id: 'raid-stations' };
```
and for each of keep, clover, hedge, rock, verge, a file raid-<name>.ts:
```ts
// Raid pack raid-<name> (see docs/roadmaps/gnomomia-rebalance-raids.md). Prefix for new ids: raid-<name>-.
import type { ContentPack } from '../../config';
import type { RaidPack } from '../../raidTypes';
export const PACK: ContentPack = { id: 'raid-<name>' };
export const RAID_PACK: RaidPack = { raids: [], recipes: [] };
```
6. src/content.ts:
   - imports: `import type { RaidDef, RaidPack, RecipeDef } from './raidTypes';`, `import { PACK as raidStations } from './data/packs/raid-stations';`
     and for each raid `import { PACK as raidKeep, RAID_PACK as raidKeepR } from './data/packs/raid-keep';` (raidClover/raidCloverR,
     raidHedge/raidHedgeR, raidRock/raidRockR, raidVerge/raidVergeR).
   - PACKS: append `raidStations, raidKeep, raidClover, raidHedge, raidRock, raidVerge` after `loreRock`.
   - next to the other tables: `export const RAID_PACKS: readonly RaidPack[] = [raidKeepR, raidCloverR, raidHedgeR, raidRockR, raidVergeR];`
     `export const RAIDS: Record<string, RaidDef> = {};` `export const RECIPES: Record<string, RecipeDef> = {};`
   - after the QUESTS world-shift loop and BEFORE the LOAD_ERRORS throw:
```ts
// Raids and reforging recipes (src/raidTypes.ts). Arena centres are written zone-local, like everything else.
for (const rp of RAID_PACKS) {
  for (const r of rp.raids ?? []) {
    if (r.id in RAIDS) { loadError(`duplicate raid id: ${r.id}`); continue; }
    RAIDS[r.id] = { ...r, x: shiftX(r.zone, r.x), z: shiftZ(r.zone, r.z) };
  }
  for (const c of rp.recipes ?? []) {
    if (c.id in RECIPES) { loadError(`duplicate recipe id: ${c.id}`); continue; }
    RECIPES[c.id] = c;
  }
}
```
7. Stubs with final signatures (bodies trivial; keep the header comment):
   - src/raidRoster.ts:
```ts
// Raid seats: the player, party members (when a party system plugs in) and helpers for the rest. Pure.
import type { ClassId } from './config';
import type { PartySource, RaidPartyMember, RaidSeat } from './raidTypes';
export function setPartySource(_src: PartySource | null): void {}
export function partyMembersNear(_zone: string, _x: number, _z: number, _range?: number): RaidPartyMember[] { return []; }
export function seatRaid(_size: number, _me: { name: string; classId: ClassId | null; level: number }, _party: readonly RaidPartyMember[], _rng: () => number): RaidSeat[] { return []; }
```
   - src/raidHelperLogic.ts:
```ts
// Raid helper numbers and decisions, shared by the game (raidHelpers.ts) and the combat arena (sim/arena.ts). Pure.
import type { ClassId, DamageType, Rank } from './config';
import type { HelperRole, RaidSeat } from './raidTypes';
export interface HelperStats { hpMax: number; hit: number; attackSeconds: number; range: number; damageType: DamageType; heal: number; healSeconds: number }
export interface HelperState { index: number; seatId: string; role: HelperRole; level: number; hp: number; hpMax: number; downFor: number; attackTimer: number; healTimer: number }
export function roleForClass(_classId: ClassId): HelperRole { return 'damage'; }
export function helperStats(_role: HelperRole, _level: number): HelperStats { return { hpMax: 1, hit: 0, attackSeconds: 2, range: 2, damageType: 'crush', heal: 0, healSeconds: 3 }; }
export function createHelperState(index: number, seat: RaidSeat): HelperState { return { index, seatId: seat.id, role: seat.role, level: seat.level, hp: 1, hpMax: 1, downFor: 0, attackTimer: 2, healTimer: 3 }; }
export function isUp(h: HelperState): boolean { return h.downFor <= 0; }
export function damageHelper(_h: HelperState, _amount: number): void {}
export function tickHelper(_h: HelperState, _dt: number): { attack: boolean; heal: boolean } { return { attack: false, heal: false }; }
export function pickHealTarget(_playerHpFrac: number, _helpers: readonly HelperState[]): 'player' | number | null { return null; }
export function assignSwing(_rank: Rank, _rng: () => number, _helpers: readonly HelperState[]): 'player' | number { return 'player'; }
```
   - src/raids.ts:
```ts
// Raids ("horn calls"): from the horn to the loot. docs/design/gnomomia/raids.md.
import type * as THREE from 'three';
import type { RaidDef, RaidSeat } from './raidTypes';
export type RaidPhase = 'countdown' | 'fight' | 'won' | 'lost';
export interface RaidStatus { raid: RaidDef; phase: RaidPhase; elapsed: number; countdown: number; bossHp: number; bossHpMax: number; seats: readonly RaidSeat[] }
export function initRaids(_scene: THREE.Scene): void {}
export function updateRaids(_dt: number): void {}
export function raidStatus(): RaidStatus | null { return null; }
export function startRaid(_raidId: string): boolean { return false; }
export function abandonRaid(): void {}
export function debugRaid(_raidId: string): void {}
```
   - src/raidHelpers.ts:
```ts
// Raid helpers in the world: Wayfarers who answer a horn call (models, movement, swings, heals, enemy targets).
import type * as THREE from 'three';
import type { ClassId } from './config';
import type { HelperRole, RaidDef, RaidSeat } from './raidTypes';
export interface RaidHelperView { seatId: string; name: string; classId: ClassId; role: HelperRole; hp: number; hpMax: number; down: boolean }
export function initRaidHelpers(_scene: THREE.Scene): void {}
export function spawnRaidHelpers(_seats: readonly RaidSeat[], _raid: RaidDef): void {}
export function updateRaidHelpers(_dt: number, _bossId: number | null): void {}
export function despawnRaidHelpers(): void {}
export function raidHelperViews(): readonly RaidHelperView[] { return []; }
export function tankTargetId(): number | null { return null; }
export function upHelperTargetIds(): number[] { return []; }
```
   - src/crafting.ts:
```ts
// Reforging: recipes at reforging anvils turn raid gear (plus coins) into a new piece. docs/design/gnomomia/raids.md.
import type { RecipeDef } from './raidTypes';
export interface CraftCheck { ok: boolean; why: string | null }
export function isCraftStation(_objectId: string): boolean { return false; }
export function recipesAt(_stationId: string): RecipeDef[] { return []; }
export function craftCheck(_recipe: RecipeDef): CraftCheck { return { ok: false, why: null }; }
export function craft(_recipeId: string): boolean { return false; }
```
   - src/ui/raidHud.ts: `export function createRaidHud(_root: HTMLElement): void {}` and `export function updateRaidHud(_dt: number): void {}` (header comment: "Raid HUD: timer, boss HP, seats, Leave.").
   - src/ui/craft.ts: `export function createCraftUi(_root: HTMLElement): void {}`, `export function openCraft(_stationId: string): void {}`, `export function closeCraft(): void {}` (header: "Reforging panel at a reforging anvil.").
   - src/raidAchievements.ts: `export function initRaidAchievements(_ui: HTMLElement): void {}` (header: "Raid and reforging achievements (@lawn/achievements).").
   - src/sim/raidScenarios.ts:
```ts
// Raid scenarios for the combat arena: one per raid and class, with helpers (scripts/sim-raid.mjs).
import type { ClassId } from '../config';
import type { RaidDef } from '../raidTypes';
import type { LoadoutSpec, ScenarioSpec } from './types';
export interface RaidSimRow { raidId: string; classId: ClassId; runs: number; winRate: number; medianSeconds: number; inBand: boolean }
export function raidScenario(raid: RaidDef, classId: ClassId): ScenarioSpec { return { id: `${raid.id}-${classId}`, name: raid.name, kind: 'boss', waves: [] }; }
export function raidLoadout(raid: RaidDef, classId: ClassId): LoadoutSpec { return { level: raid.level, classId }; }
export function runRaidSims(_seeds: number, _raidIds?: readonly string[], _classes?: readonly ClassId[]): RaidSimRow[] { return []; }
```
   - scripts/sim-raid.mjs: `console.log('sim:raid: not built yet');`
8. src/sim/types.ts: import `type { RaidSeat } from '../raidTypes'`; add to LoadoutSpec
   `/** Allow raid and reforged gear (ItemDef.source) in the gear tiers. Default false. */ raidGear?: boolean;`
   and to ScenarioSpec `/** Raid helpers fighting beside the player (sim/arena.ts). */ helpers?: readonly RaidSeat[];`
   and `/** ENEMIES id: the scenario is won when this enemy has spawned and died. */ raidBoss?: string;`
9. package.json (games/gnomes-of-gnomomia): add `"sim:raid": "node scripts/sim-raid.mjs"` to scripts and
   `"@lawn/achievements": "*"` to dependencies (alphabetical). Then run `npm install` at the repo root.
10. src/main.ts:
   - imports: `import { debugRaid, initRaids, updateRaids } from './raids';`, `import { initRaidHelpers } from './raidHelpers';`,
     `import { createRaidHud, updateRaidHud } from './ui/raidHud';`, `import { createCraftUi } from './ui/craft';`,
     `import { initRaidAchievements } from './raidAchievements';`; change `import { ZONES } from './content';` to
     `import { OBJECTS, RAIDS, ZONES } from './content';`.
   - after `initMower(scene);`: `initRaidHelpers(scene);` and `initRaids(scene);`
   - after `createBookReader(ui);`: `createRaidHud(ui);` and `createCraftUi(ui);`
   - after `initMmo(scene);`: `initRaidAchievements(ui);`
   - in frame(), inside `if (running)`, after the updateMower line: `timed('updateRaids', () => updateRaids(dt));` and
     `timed('updateRaidHud', () => updateRaidHud(dt));`
   - debug: after the `tourTown` const add
     ```ts
     // Dev only: ?raid=<raid id> drops a fresh character at that raid's horn and blows it (src/raids.ts debugRaid).
     const debugRaidId = import.meta.env.DEV ? new URLSearchParams(location.search).get('raid') : null;
     const debugRaidDef = debugRaidId ? RAIDS[debugRaidId] : undefined;
     ```
     change the condition to `if ((debugZone && debugZone in ZONES) || tourTown || debugRaidDef) {`; inside, after the
     tourTown branch add `} else if (debugRaidDef) { const h = OBJECTS[debugRaidDef.horn]; loadZone(debugRaidDef.zone, h?.x ?? debugRaidDef.x, h?.z ?? debugRaidDef.z);`
     before the plain `loadZone(debugZone as ZoneId)` else; and after `running = true;` in that branch add
     `if (debugRaidDef) debugRaid(debugRaidDef.id);`

## Contract
Every signature above is final: Epic 2 fills the bodies without changing them.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (if it fails only on 'horn'/'anvil'/`source`/`noReward`, those
  come from worker 1A; this issue does not use them).
- `npm run lint:content -w games/gnomes-of-gnomomia` reports no errors.
- `npx vitest run src/sim/economy.test.ts` (in the game folder) passes: nothing in the economy changed.

## Out of scope
src/config.ts, src/events.ts, src/entities.ts, src/progression.ts, src/objectModels.ts (worker 1A), scripts/sim-economy.mjs and src/sim/farm.ts (worker 1C).
~~~~

### 1C: Farm report in the economy sim

~~~~text
Epic: 1 Foundation
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Other workers are editing other files in
this game (content.ts, entities.ts, main.ts and more): change only the files listed. Do not commit.

## Goal
A pure "farm" model and a CLI flag that answer: a player of level L killing enemy E over and over, how long is a level,
how fast do skills rise, and how much faster with kills credited that the player did not make (AI gnomes nearby, the
bug Epic 1 fixes). Run as `npm run sim:economy -w games/gnomes-of-gnomomia -- --farm=water-beetle@8,assist=3`.

## Read first
- games/gnomes-of-gnomomia/src/economy.ts: killXpAt, xpToNextLevel, skillCapAt, skillUsesToNext, skillUseValue.
- games/gnomes-of-gnomomia/src/data/economy.ts: ECONOMY.levelCap.
- games/gnomes-of-gnomomia/src/sim/economy.ts lines 31-80: EconomyPlayerModel, DEFAULT_PLAYER (killSeconds by rank,
  hitsPerNormalKill by class).
- games/gnomes-of-gnomomia/scripts/sim-economy.mjs: how it bundles src with esbuild and parses `--flags`.

## Change
- New src/sim/farm.ts (pure, no DOM):
```ts
export interface FarmSpec {
  enemy: string;            // ENEMIES id
  level: number;            // player level at the start
  hours?: number;           // default 1
  killSeconds?: number;     // per own kill; default DEFAULT_PLAYER.killSeconds[enemy rank]
  assistKillsPerMinute?: number; // extra kills credited to the player without their hits; default 0
  classId?: ClassId;        // hits per kill: DEFAULT_PLAYER.hitsPerNormalKill[classId]; default 'warden'
  skillStart?: number;      // weapon skill at the start; default Math.floor(0.8 * skillCapAt(level))
}
export interface FarmReport {
  enemy: string; enemyLevel: number; levelStart: number; levelEnd: number; hours: number; kills: number;
  xpPerKillStart: number; killsToNextStart: number; minutesToNextStart: number; xpPerHourStart: number;
  skillStart: number; skillEnd: number; skillCapEnd: number; skillUpsPerHour: number;
}
export function runFarm(spec: FarmSpec): FarmReport;
```
  Model: time advances kill by kill. Own kills come every killSeconds; assisted kills come at assistKillsPerMinute
  (interleave by time). Every kill grants killXpAt(enemyLevel, rank, currentLevel); level up while xp >= xpToNextLevel(level),
  capped at ECONOMY.levelCap (carry the remainder). Only own kills train the skill: hitsPerNormalKill uses, each worth
  skillUseValue(skill, skillCapAt(level)), rising while uses >= skillUsesToNext(skill) and skill < skillCapAt(level).
  minutesToNextStart = killsToNextStart x (time per kill at the start, own and assisted together) / 60.
  xpPerKillStart, killsToNextStart (ceil) and xpPerHourStart describe the first level.
- New src/sim/farm.test.ts:
  - water-beetle @ 8: xpPerKillStart === 15 and killsToNextStart === 189 (2829 XP to level 9).
  - the same with assistKillsPerMinute 3 over 2 hours ends at a higher levelEnd than without, and skillUpsPerHour is the same or lower (assists train nothing).
  - water-beetle @ 11 (5 levels above it): xpPerKillStart === 0.
- scripts/sim-economy.mjs: add `--farm=<enemy>@<level>[,hours=N][,assist=K][,class=C][,kill=S]`. When given, run runFarm
  (export it through the esbuild entry the script already builds) and print one block, then exit 0 without the normal
  report. The format (numbers here are illustrative, print what runFarm returns):
  ```
  Farm: Water beetle (L6) as level 8 warden, 1 h, own kill 35 s, assisted 3/min
    XP/kill 15, kills to level 9: 189 (~40 min), XP/h 4,240
    level 8 -> 9.5 in 1 h, kills 283
    weapon skill 29 -> 33 (cap 37), skill-ups/h 4.0
  ```
  Add the flag to the usage comment at the top.

## Contract
`runFarm(spec: FarmSpec): FarmReport` exactly as above (Epic 4 quotes its output in docs/design/gnomomia/economy.md).

## Done when
- `npx vitest run src/sim/farm.test.ts` (in games/gnomes-of-gnomomia) passes.
- `npm run sim:economy -w games/gnomes-of-gnomomia -- --farm=water-beetle@8` and `... --farm=water-beetle@8,assist=3,hours=2` print the block.
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (other workers' stubs may be mid-edit; re-run if a file you do not own fails).

## Out of scope
src/sim/economy.ts (do not change the economy model), src/economy.ts, src/data/*.
~~~~

### 1D: Lore foundation: horn calls and horn-marked gear

~~~~text
Epic: 1 Foundation
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Only docs/lore files. Run `npm run lore -- check` (check only); never
plain `npm run lore` (it rewrites docs/lore/INDEX.md, which the planner regenerates once). Do not commit.

## Goal
The setting knows what a raid is: a "horn call", answered by Wayfarers, paid in horn-marked gear that shops barely buy
and smiths reforge. Gnomes of Gnomomia is adding five horn calls and reforging anvils.

## Read first
- docs/lore/README.md: entry schema and fields.
- docs/lore/canon.md: house style (plain names, every pest wants something, no gore, dry jokes, loose threads).
- docs/lore/entries/fescue/wayfarers.md: the AI gnome travellers.
- docs/lore/rulings.md: the last two rulings, for the format.

## Change
- New docs/lore/entries/fescue/horn-calls.md: `id: horn-calls`, `name: Horn calls`, `kind: concept`, `tier: setting`,
  `setting: fescue`, `era: now`, `status: canon`, `games: [gnomes-of-gnomomia]`,
  `aliases: [horn call, raid, raids, horn post, Reeve's horn]`,
  `sources: [docs/lore/rulings.md, docs/roadmaps/gnomomia-rebalance-raids.md]`,
  `related: [wayfarers, horn-marked-gear, the-bounds]`. Body:
  - summary: A horn call is a fight too big for one gnome. A Reeve hangs a horn on a post where a pest has grown too
    big or too many; whoever blows it gets every Wayfarer in earshot.
  - What gnomes say: two or three short quotes in house style, e.g. a Keep sergeant: "One blast and they come running.
    Two blasts and they go home." Someone grumbling that Wayfarers come for the horn-marked gear, not the town.
  - In the games: raids in Gnomes of Gnomomia (src/raids.ts), open after Chapter 2 (A Letter for the Queen). Five horn
    posts: Birdbath Keep (below the Archive), Cloverfield (Honeydew Ranch), the Hedgewood (the Elder Privet), the
    Rockery (below the Shard Mine), the Verge (the western Shorn). Up to three Wayfarers answer: a Warden holds the
    beast, a Hedge-Mage mends, a Slinger shoots (src/raidHelpers.ts). A gnome's own party takes their places once
    parties exist. Each piece of horn-marked gear falls one time in five.
  - Loose threads: who carved the first horn; why the beasts come back to the same lawns.
- New docs/lore/entries/fescue/horn-marked-gear.md: `id: horn-marked-gear`, `name: Horn-marked gear`, `kind: object`,
  same tier/setting/era/status/games, `aliases: [horn mark, reforging, reforged gear, reforging anvil]`,
  `sources: [docs/lore/rulings.md, docs/roadmaps/gnomomia-rebalance-raids.md]`, `related: [horn-calls, bramble-the-smith, flintdelve]`.
  Body: gear won in a horn call carries the horn mark, a notch burnt into a strap or haft. Shops pay almost nothing for
  it ("won, not made: no merchant will sell another gnome's luck"). A smith with a reforging anvil can reforge it into
  a better piece for the next stretch of road: Sodbury, Clippings, Flintdelve and Last Tuft each have one beside the smith.
  In the games: src/crafting.ts, ItemDef.source 'raid' / 'craft'. Loose thread: what the notch means to the smiths.
- docs/lore/rulings.md: append two rulings in the file's format, numbered after the highest existing R- number (do not
  reuse a skipped number). Applies to: gnomes-of-gnomomia (fescue). Date: today.
  1. Question: Gnomomia has raids. What is a raid in Fescue, and who are the helpers? Ruling: a raid is a horn call (see
     horn-calls); the helpers are Wayfarers answering the horn; a gnome's party, when there is one, takes the seats first;
     the beasts still want something, like every pest. Why: raids need an in-world reason that fits the Bound-Peace and the Wayfarers.
  2. Question: why does raid gear sell for almost nothing, and what is reforging? Ruling: horn-marked gear; shops will not
     trade in it; smiths reforge it at reforging anvils in the next town. Why: raid gear must be worth chasing for its
     use, never as a coin farm.
- docs/lore/entries/fescue/wayfarers.md: add `horn-calls` to `related`, and under "In the games" one bullet: they answer
  horn calls (raids): up to three come to a blown horn post and fight beside the player as a tank (Warden), a healer
  (Hedge-Mage) or a damage dealer (Slinger), in src/raidHelpers.ts. See horn-calls.

## Done when
- `npm run lore -- check` passes (repo root).
- `npm run lore -- find horn` lists both new entries.

## Out of scope
docs/lore/INDEX.md (generated), every game source file, other lore entries.
~~~~

---

## Epic 2: Systems

### 2A: Raid seats, helper logic and the raid content test

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Seven other workers are filling other
raid files right now (raids.ts, raidHelpers.ts, crafting.ts, ui/raidHud.ts, ui/craft.ts, raidAchievements.ts, sim/*).
Change only your files and keep every exported signature exactly as the stubs have it. Do not commit.

## Goal
Pure raid logic: who sits in a raid (player, party members, helpers for the rest), helper numbers, helper damage, downs
and revives, heal targets, and which seat an enemy swing lands on in the sim. Plus a content test that checks every
raid and recipe the content packs will add (it passes trivially until raid content exists).

## Read first
- games/gnomes-of-gnomomia/src/raidTypes.ts: RaidSeat, HelperRole, RaidPartyMember, PartySource, RaidDef, RecipeDef.
- games/gnomes-of-gnomomia/src/data/raidTuning.ts: RAID_TUNING (helper numbers), RAID_UNLOCK.
- games/gnomes-of-gnomomia/src/raidRoster.ts and src/raidHelperLogic.ts: the stubs you fill.
- games/gnomes-of-gnomomia/src/rules.ts: `avgHit(level)`, `mulberry32(seed)`.
- games/gnomes-of-gnomomia/src/townPeace.test.ts: how tests import content and towns.

## Change
- src/raidHelperLogic.ts (keep imports and exported names):
  - `roleForClass`: warden -> 'tank', mage -> 'healer', slinger -> 'damage'.
  - `helperStats(role, level)`: `hit = Math.round(avgHit(level) * RAID_TUNING.helper.hitNormals[role])`,
    `hpMax = Math.round(avgHit(level) * RAID_TUNING.helper.hpNormals[role])`, `attackSeconds = RAID_TUNING.helper.attackSeconds`,
    `range = RAID_TUNING.helper.range[role]`, damageType tank 'crush', damage 'pierce', healer 'sun';
    `heal = role === 'healer' ? Math.round(avgHit(level) * RAID_TUNING.helper.healNormals) : 0`, `healSeconds = RAID_TUNING.helper.healSeconds`.
  - `createHelperState(index, seat)`: hp = hpMax = helperStats(seat.role, seat.level).hpMax; downFor 0;
    attackTimer = attackSeconds * (0.3 + 0.2 * index); healTimer = healSeconds.
  - `damageHelper(h, amount)`: ignored while down; hp -= amount * RAID_TUNING.helper.damageTakenMult; at hp <= 0: hp = 0,
    downFor = RAID_TUNING.helper.reviveSeconds.
  - `tickHelper(h, dt)`: while down, downFor -= dt; when it reaches 0, hp = Math.round(hpMax * reviveHpFrac), downFor = 0;
    return both false while down. When up: attackTimer -= dt, and when <= 0 add attackSeconds and attack = true; healers
    also run healTimer the same way with healSeconds (heal = true).
  - `pickHealTarget(playerHpFrac, helpers)`: the lowest HP fraction among the player and the up helpers; return it
    ('player' or the helper's `index`) only if it is below RAID_TUNING.helper.healBelow, else null.
  - `assignSwing(rank, rng, helpers)` (the combat arena uses it; the game's enemies choose for themselves):
    for rank 'boss' | 'worldboss' | 'miniboss' | 'elite' | 'final': the index of the first up tank, else 'player'.
    Others: `rng() < RAID_TUNING.sim.addsOnPlayerShare` -> 'player'; else a random up helper's index (rng), else 'player'.
- src/raidRoster.ts:
  - module state `let partySource: PartySource | null = null;` and `setPartySource` sets it.
  - `partyMembersNear(zone, x, z, range = RAID_TUNING.partyRange)`: the source's members in that zone within range.
  - `export const HELPER_NAMES: readonly string[] = ['Madder Tumblepot', 'Woad Brickwell', 'Borage Haftsby', 'Burnet Pegwhistle', 'Chervil Barrowby', 'Hyssop Kettleclod', 'Lupin Sackwell', 'Teasel Ladlefoot', 'Vetch Spadesworth'];`
  - `export const HELPER_COLORS: Record<HelperRole, { hat: number; shirt: number; beard: number }> = { tank: { hat: 0x5a6a7a, shirt: 0x4a4a52, beard: 0xd8d0c0 }, healer: { hat: 0x2f6fb0, shirt: 0xe8e0c8, beard: 0xb08a5a }, damage: { hat: 0xb0302a, shirt: 0x6a4a2a, beard: 0x3a2a1a } };`
  - `seatRaid(size, me, party, rng)`: seat 0 = `{ kind: 'player', id: 'me', name: me.name, classId: me.classId ?? 'slinger', level: me.level, role: roleForClass(...) }`;
    then party members in order (kind 'party', classId ?? 'slinger', role from class) until `size` seats; then helpers
    for the free seats, choosing roles so the seats hold a tank first, then a healer, then damage for the rest
    (classForRole: tank 'warden', healer 'mage', damage 'slinger'). Helpers: id `helper-<n>` (n from 0), a name from
    HELPER_NAMES not used yet (pick with rng), level me.level, colors HELPER_COLORS[role]. Never more than `size` seats.
- New src/raidLogic.test.ts:
  - no party: slinger player -> 4 seats, roles {damage, tank, healer, damage}; warden player -> helpers healer, damage, damage;
    mage player -> helpers tank, damage, damage. Helper ids helper-0.., names unique.
  - one party mage: seats = player, party, then a tank helper and a damage helper.
  - setPartySource with two members, one 100 m away: partyMembersNear(range 30) returns one.
  - damageHelper to 0 sets downFor; tickHelper over reviveSeconds brings it back at half HP.
  - assignSwing('boss', ...) returns the tank's index while the tank is up and 'player' when it is down.
  - pickHealTarget(0.5, [helper at 90%]) === 'player'; pickHealTarget(0.95, [helper at 30%]) === that index; all high -> null.
- New src/raidContent.test.ts: `describe.each(Object.values(RAIDS))('raid $id', (raid) => ...)` so a worker can run one raid
  with `-t raid-keep`. For each raid:
  - boss and every wave enemy exist in ENEMIES, and every one has noReward true and respawnSeconds 0;
  - every boss `moves` summon enemy exists and has noReward true;
  - drops: 5 ids, each in ITEMS with source 'raid', ilvl === raid.level + 1;
  - OBJECTS[raid.horn] exists, model 'horn', zone === raid.zone, within raid.r + 4 of the centre;
  - the arena is clear of towns: `spawnCircleClearOfTowns(raid.x, raid.z, raid.r)` (src/towns.ts);
  - the arena keeps 6 m from every SPAWNS circle of its zone: distance >= spread + raid.r + 6;
  - the arena is open: sample 24 angles x radii [0, 4, 8, 12, raid.r]; at least 97% have `terrain.staticSolidAt(x, z) === false`
    (`import { terrain } from './terrain'`);
  - every wave `at` < RAID_TUNING.maxSeconds; minLevel <= level.
  And for recipes (skip with `it.skip` style guards when RECIPES is empty): every station is in OBJECTS with model 'anvil';
  makes and needs exist in ITEMS; makes has source 'craft'; gold > 0. Finally: every drop of every raid except the
  highest-level raid is a `needs` item of at least one recipe (raid gear always reforges later).
  With no raids yet, the file must still pass (describe.each over an empty list: add one plain `it` that checks RAIDS is an object).

## Contract
Signatures are the stubs' (src/raidRoster.ts, src/raidHelperLogic.ts); additionally export HELPER_NAMES, HELPER_COLORS
and `classForRole(role: HelperRole): ClassId` from raidRoster.ts. Pure: no DOM, no three, no game state.

## Done when
- `npx vitest run src/raidLogic.test.ts src/raidContent.test.ts` (in games/gnomes-of-gnomomia) passes.
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes for your files.

## Out of scope
src/raids.ts, src/raidHelpers.ts, src/sim/*, src/data/packs/* (other workers).
~~~~

### 2B: Raid runtime (src/raids.ts)

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia (three.js, TypeScript). Other workers are
filling src/raidRoster.ts, src/raidHelperLogic.ts, src/raidHelpers.ts, the UIs and the sim right now; they keep their
stub signatures, so call them as declared. Change only src/raids.ts. Do not commit.

## Goal
A horn post starts a raid: helpers arrive, a 5 s countdown, the boss and its waves, a timer, a win (drops at 1 in 5,
coins, XP, a clear count) or a loss (death, leaving, time out, or Leave), and the events the HUD, achievements and the
future party system listen to.

## Read first
- games/gnomes-of-gnomomia/src/raids.ts (stub: keep every export and its signature).
- games/gnomes-of-gnomomia/src/raidTypes.ts (RaidDef, RaidSeat), src/data/raidTuning.ts (RAID_TUNING).
- games/gnomes-of-gnomomia/src/raidHelpers.ts and src/raidRoster.ts (stubs: spawnRaidHelpers, updateRaidHelpers,
  despawnRaidHelpers, tankTargetId, upHelperTargetIds; seatRaid, partyMembersNear).
- games/gnomes-of-gnomomia/src/entities.ts: spawnEnemyAt(defId, x, z, opts?), provokeEnemy(id, attackerId), getEntity,
  allEntities, removeEntity, spawnLoot(x, z, items, gold). src/events.ts: 'interacted', 'player-died', 'enemy-killed',
  'raid-started', 'raid-ended'.

## Change
src/raids.ts. Imports you need: RAIDS, OBJECTS, ENEMIES, ITEMS from './content'; bus, say from './events'; UI from './config';
state, setFlag from './state'; player from './player'; teleportPlayer from './player'; grantXp from './progression';
raidClearXp, raidClearGold from './economy'; RAID_TUNING from './data/raidTuning'; seatRaid, partyMembersNear from
'./raidRoster'; the raidHelpers functions; entity functions above.
- Module state: one active raid or null: `{ raid, phase: RaidPhase, countdown, elapsed, seats, bossId: number | null,
  spawnedWaves: Set<number>, enemyIds: number[], outside: number, lingerLeft: number, bossPos: {x, z} | null }`.
- `initRaids(scene)`: subscribe once:
  - 'interacted' ({ objectId }): if a RAIDS entry has `horn === objectId`, `startRaid(thatRaid.id)`.
  - 'player-died': if active and phase is countdown or fight: lose('You fall. The horn call breaks up.').
  - 'enemy-killed' ({ entityId }): if active, fighting and entityId === bossId: win().
- `startRaid(raidId)`: refuse with a chat line (UI.bad) and return false when: a raid is already active ("A horn call is
  already under way."), unknown id, player.dead, or `state.level < raid.minLevel` ("The horn is too heavy for you yet.
  Come back at level N."). Otherwise: seats = seatRaid(RAID_TUNING.seats, { name: 'You', classId: state.classId, level: state.level },
  partyMembersNear(state.zone, player.position.x, player.position.z), Math.random); spawnRaidHelpers(seats, raid);
  phase 'countdown', countdown = RAID_TUNING.pullDelaySeconds; say(raid.intro, UI.quest);
  bus.emit('raid-started', { raidId, seats: seats.map(({ kind, id, name }) => ({ kind, id, name })) }); return true.
- `updateRaids(dt)`: nothing when idle. Always call `updateRaidHelpers(dt, bossId)` while active.
  - countdown: count down; at 0 spawn the boss with `spawnEnemyAt(raid.boss, raid.x, raid.z)`; if `tankTargetId()` is not
    null `provokeEnemy(boss.id, tankTargetId)` else `boss.inCombat = true`; phase 'fight', elapsed 0.
  - fight: elapsed += dt. Each wave not yet spawned whose `at <= elapsed`: spawn `count` enemies on the edge
    (random angle, radius raid.r - 1); push their ids; every second one is provoked onto a random id from
    upHelperTargetIds() (if any), the rest get `inCombat = true` (they go for the player).
    Remember the boss position every frame (getEntity(bossId)?.position) for the loot pile.
    Leaving: if the player is more than raid.r + RAID_TUNING.leaveMargin from the centre, outside += dt, else 0; past
    leaveGraceSeconds: lose('You left the horn call.'). elapsed > RAID_TUNING.maxSeconds: lose('The horn call runs out of breath.').
  - won: lingerLeft -= dt; at 0 despawnRaidHelpers() and clear the active raid.
- win(): phase 'won'. items = raid.drops filtered by `Math.random() < RAID_TUNING.dropChance`, as `{ item, count: 1 }`;
  gold = raidClearGold(raid.level); spawnLoot(bossPos.x, bossPos.z, items, gold); grantXp(raidClearXp(raid.level, state.level));
  flag `raid:<id>:clears` = String(previous + 1) via setFlag; say(raid.victory, UI.gold); say either
  "Horn-marked gear: <names>" (ITEMS names) or "No horn-marked gear this time." (UI.quest); cleanUp(); emit
  'raid-ended' { raidId, won: true, seconds: elapsed, drops: item ids }; lingerLeft = RAID_TUNING.helperLingerSeconds.
- lose(reason): say(reason, UI.bad); cleanUp(); despawnRaidHelpers(); emit 'raid-ended' { won: false, seconds: elapsed, drops: [] }; clear.
- cleanUp(): removeEntity every live raid enemy: the ids you spawned, plus any live enemy within raid.r + 20 of the
  centre whose defId is the boss, a wave enemy, or a `summon.enemy` of the boss's `moves` (summons come from bossmoves.ts).
- `raidStatus()`: null when idle, else `{ raid, phase, elapsed, countdown, bossHp, bossHpMax, seats }` (boss HP from
  getEntity(bossId); 0/0 before the pull).
- `abandonRaid()`: if active and not won: lose('You blow the horn twice: the call is off.').
- `debugRaid(raidId)` (dev ?raid=): state.level = max(state.level, raid.level); state.classId ??= 'warden';
  state.hp = maxHp() (import from './state'); teleport to the horn (OBJECTS[raid.horn]); startRaid(raidId).

## Contract
Exports exactly as the stub: initRaids, updateRaids, raidStatus, startRaid, abandonRaid, debugRaid, RaidPhase, RaidStatus.
Raid enemies pay nothing themselves (their EnemyDefs set noReward); the clear pays through grantXp and the loot pile.
Saved progress is only the `raid:<id>:clears` flag (state.flags is saved already).

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes.
- `npx vitest run src/killCredit.test.ts src/net/enemySync.test.ts` still passes.

## Out of scope
Every other file. No new UI here (ui/raidHud.ts reads raidStatus()).
~~~~

### 2C: Raid helpers in the world (src/raidHelpers.ts)

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia (three.js r0.187, TypeScript). Other workers
are filling src/raidHelperLogic.ts (pure helper numbers), src/raids.ts and more; they keep the stub signatures. Change
only src/raidHelpers.ts. Do not commit.

## Goal
The Wayfarers who answer a horn call appear as gnomes, walk to their places, fight (the tank on the boss, damage on
adds first, the healer mending whoever is lowest), can be targeted and downed by enemies, and get back up.

## Read first
- games/gnomes-of-gnomomia/src/raidHelpers.ts (stub; keep every export and signature).
- games/gnomes-of-gnomomia/src/raidHelperLogic.ts (stub signatures: helperStats, createHelperState, isUp, damageHelper,
  tickHelper, pickHealTarget) and src/raidTypes.ts (RaidSeat with `colors`, RaidDef).
- games/gnomes-of-gnomomia/src/companions.ts lines 740-800 and 700-725: how an AI gnome model is built
  (`createGnomeModel(look(hat, shirt, beard))` from '@lawn/gnome' and './config', castShadow traverse, `scene.add`),
  moved (`model.update({ position, velocity, facing, grounded: true, jumpsUsed: 0 }, dt)`), swung
  (`model.arms.right.rotation.x = -2.4 * Math.sin(...)`) and downed (`model.setDead(bool)`). Read only; do not edit it.
- games/gnomes-of-gnomomia/src/entities.ts: `RAID_HELPER_TARGET_BASE`, `setTargetSource(key, src)`,
  `CompanionTargets` { targets(): Iterable<RemoteTarget>; attack(id, enemy) }, `RemoteTarget` { id, x, z, zone, dead },
  `allEntities()`, `getEntity(id)`.
- games/gnomes-of-gnomomia/src/combat.ts: `dealDamage(targetId, base, type, { attacker, noRoll })`, `healPlayer(amount)`.

## Change
src/raidHelpers.ts:
- State: scene; current raid; helpers: `{ seat: RaidSeat; st: HelperState; stats: HelperStats; model: GnomeModel;
  position: THREE.Vector3; facing: number; swing: number; target: number | null }[]`.
- `initRaidHelpers(scene)`: keep the scene; register `setTargetSource('raid-helpers', { targets, attack })` once:
  targets yields, per helper i, `{ id: RAID_HELPER_TARGET_BASE - i, x, z, zone: raid.zone, dead: !isUp(st) }` (nothing when
  no helpers); attack(id, enemy): helper i = RAID_HELPER_TARGET_BASE - id; damage = average of
  `enemyStats(ENEMIES[enemy.defId]).damage` (src/rules.ts) -> damageHelper(st, damage).
- `spawnRaidHelpers(seats, raid)`: despawn any old ones; for each seat with kind 'helper' (helper index i = order among
  helpers): build the model from seat.colors, place it 2.5 m from the player on a ring (angle i x 2.1 rad), y = heightAt(x, z)
  (src/terrain.ts), st = createHelperState(i, seat), stats = helperStats(seat.role, seat.level).
- `updateRaidHelpers(dt, bossId)`: per helper: `const t = tickHelper(st, dt)`. Down: setDead(true), model update, skip.
  Up: setDead(false). Target: tank -> bossId if alive; damage -> the live raid-area enemy (kind 'enemy', not dead, within
  raid.r + 6 of the centre) with the lowest hp that is not the boss, else the boss; healer -> the boss. No target
  (countdown): walk to a spot 2.5 m behind the player. With a target: walk straight toward it until within stats.range
  (speed TUNING.walkSpeed x 0.95; skip a step if `isBlocked(nx, nz)` from src/terrain.ts), face it. When t.attack and the
  target is within stats.range + 0.5: `dealDamage(target.id, stats.hit, stats.damageType, { attacker: RAID_HELPER_TARGET_BASE - i, noRoll: true })`,
  start the swing animation (0.35 s). When t.heal: `pickHealTarget(state.hp / maxHp(), allStates)`: 'player' ->
  healPlayer(stats.heal); a helper index -> raise that helper's st.hp by stats.heal (max hpMax). Keep y on the ground and
  call model.update every frame.
- `despawnRaidHelpers()`: remove the models from the scene, clear the list (the target source then yields nothing).
- `raidHelperViews()`: `{ seatId, name, classId, role, hp, hpMax, down }` per helper.
- `tankTargetId()`: RAID_HELPER_TARGET_BASE - i of the first up tank, else null. `upHelperTargetIds()`: ids of all up helpers.

## Contract
Exports exactly as the stub. Helper i's enemy-target id is `RAID_HELPER_TARGET_BASE - i` (entities.ts). Helper hits use
`attacker` = that id, so they never give the player kill credit. Helpers are local only (not sent online).

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes.
- `npx vitest run src/companionLogic.test.ts src/killCredit.test.ts` passes (companions and entities are untouched).

## Out of scope
src/companions.ts and src/companionLogic.ts (another roadmap owns them), src/raids.ts, src/raidHelperLogic.ts.
~~~~

### 2D: Reforging logic and the anvils

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Other workers are filling other raid
files at the same time. Change only the files listed. Do not commit.

## Goal
Reforging works: recipes at an anvil (RECIPES from content.ts), a check that says what is missing, and a craft that
takes the raid piece and coins and gives the new piece. Four reforging anvils stand beside the smiths of Sodbury,
Clippings, Flintdelve and Last Tuft.

## Read first
- games/gnomes-of-gnomomia/src/crafting.ts (stub: keep exports and signatures), src/raidTypes.ts (RecipeDef).
- games/gnomes-of-gnomomia/src/inventory.ts: addItem(item, count), removeItem(item, count), countItem(item).
- games/gnomes-of-gnomomia/src/quests.ts: checkCondition(c). src/state.ts: state.gold, state.equipment, newGameState.
- games/gnomes-of-gnomomia/src/data/packs/raid-stations.ts (stub) and src/data/packs/ch4-cloverfield.ts (an `objects` example).

## Change
- src/crafting.ts:
  - `isCraftStation(objectId)`: `OBJECTS[objectId]?.model === 'anvil'`.
  - `recipesAt(stationId)`: Object.values(RECIPES) with that station, sorted by the made item's ilvl then name.
  - `craftCheck(recipe)` -> `{ ok, why }`, first failure wins: when `recipe.when` fails -> 'Not yet.'; a needed item
    short in the inventory but worn (state.equipment holds it) -> 'Take off <name> first.'; short -> 'Needs <name>.';
    `state.gold < recipe.gold` -> 'Needs <gold> coins.'; else `{ ok: true, why: null }`.
  - `craft(recipeId)`: unknown or not ok -> say(why, UI.bad), false. Else removeItem every need, state.gold -= gold,
    addItem(makes, 1), say(`You reforge the ${name}.`, UI.good), bus.emit('item-crafted', { recipeId, item: makes }),
    bus.emit('changed', {}), true.
- src/data/packs/raid-stations.ts: keep `id: 'raid-stations'` and add `objects` (zone-local coordinates, 2.5 m east of
  each smith): `raid-anvil-sodbury` cloverfield (10.5, 6); `raid-anvil-clippings` hedgewood (36.5, 44);
  `raid-anvil-flintdelve` rockery (8.5, 24); `raid-anvil-last-tuft` verge (-3.5, 91). Each: `name: 'Reforging anvil'`,
  `model: 'anvil'`, `verb: 'Reforge'`, an `examine` in plain dry house style (e.g. "A smith's second anvil, kept for
  horn-marked gear. The notch in its horn matches the one on the straps."), yaw 0. If `npm run lint:content` says one is
  unreachable (inside a house etc.), move it in 1 m steps until it is clear.
- New src/crafting.test.ts: reset state (Object.assign(state, newGameState())); add a temporary recipe
  `RECIPES['test-recipe'] = { id: 'test-recipe', station: 'raid-anvil-sodbury', makes: 'c4-ribbon-wand', needs: [{ item: 'beetle-shell', count: 1 }], gold: 50 }`
  (delete in afterEach). Check: no shell -> why 'Needs ...'; shell but 10 coins -> 'Needs 50 coins.'; shell and 60 coins ->
  craft true, gold 10, the wand in the inventory, no shell, and an 'item-crafted' event; recipesAt('raid-anvil-sodbury')
  includes it; isCraftStation('raid-anvil-sodbury') is true and false for an unknown id.

## Contract
crafting.ts exports exactly as the stub. Station ids as listed above (the raid packs' recipes use them).

## Done when
- `npx vitest run src/crafting.test.ts` passes; `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes.
- `npm run lint:content -w games/gnomes-of-gnomomia` reports no errors for pack raid-stations.

## Out of scope
src/ui/craft.ts (another worker builds the panel), src/content.ts, other packs.
~~~~

### 2E: Raid HUD and reforging panel

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Other workers are filling src/raids.ts,
src/raidHelpers.ts and src/crafting.ts right now; their stubs already have the final signatures, so code against them.
Change only the two files listed. Repo rules: UI modules append their own container to the `#ui` root they get, never
restyle or hide it; every button at least 44 px tall; no hover-only UI; fit a 390x844 phone. Do not commit.

## Goal
During a raid: a small panel with the raid name, the pull countdown or the elapsed time, the boss HP bar, each seat
(you, party, helpers) with an HP bar, and a Leave button. At a reforging anvil: a panel listing its recipes with what
each needs and a Reforge button.

## Read first
- games/gnomes-of-gnomomia/src/ui/shop.ts: the window style (UI palette, centred, `min(440px, 94vw)`), RARITY_COLOR,
  `cell()` with minHeight 44px, `itemIcon(def, px)` from '../itemArt', and how it opens and closes.
- games/gnomes-of-gnomomia/src/ui/hud.ts lines 197-260: what already sits at the top of the screen (zone name top-left at
  8px, the top-centre frame 360px wide at top 8px, the right column).
- games/gnomes-of-gnomomia/src/raids.ts (stub: raidStatus(), abandonRaid(), RaidStatus), src/raidHelpers.ts (stub:
  raidHelperViews(), RaidHelperView), src/crafting.ts (stub: isCraftStation, recipesAt, craftCheck, craft).

## Change
- src/ui/raidHud.ts: `createRaidHud(root)` builds a hidden box appended to root: position absolute, left 8px,
  top `calc(env(safe-area-inset-top, 0px) + 36px)`, width `min(240px, 46vw)`, UI.panelBg, UI.border, UI.font, 12-13px text,
  pointerEvents auto only on the button. `updateRaidHud(dt)`: hide when raidStatus() is null; else show the raid name
  (UI.gold); "Pull in N" during countdown, "m:ss" while fighting, "Won in m:ss" / "Lost" after; a boss HP bar (UI.bad fill);
  one row per seat: "You" for the player (state.hp / maxHp()), party seats by name with "(party)" and no bar, helpers by
  name with their HP bar from raidHelperViews() (greyed with "down" while down); a "Leave" button (44 px tall) calling
  abandonRaid(), hidden after a win. Rebuild the seat rows only when the seat list changes; update text and bar widths each frame.
- src/ui/craft.ts: `createCraftUi(root)`: a hidden window styled like the shop; subscribe to bus 'interacted' and call
  openCraft(objectId) when isCraftStation(objectId). `openCraft(stationId)`: title = OBJECTS[stationId].name; one row per
  recipesAt(stationId): the made item's icon (itemIcon) and name in its rarity colour, a line "Needs: <item names> + N coins",
  and a "Reforge" button (44 px tall) calling craft(recipe.id) then re-rendering; when craftCheck(recipe) is not ok, the
  button is dimmed and the row shows `why`. No recipes: "Nothing to reforge here. Bring horn-marked gear from a horn call."
  Re-render on bus 'changed' while open. Close with the ✕ (44 px touch target), on 'zone-changed', and when the player is
  more than 6 m from the anvil (check every 500 ms with setInterval while open; clear it on close). `closeCraft()` hides it.

## Contract
Exports exactly as the stubs: createRaidHud(root), updateRaidHud(dt), createCraftUi(root), openCraft(stationId), closeCraft().

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes.
- Read your code against a 390 px wide portrait screen: the raid box must not cover the top-centre frame (360 px at
  left 50%) on desktop. Say in your report what you checked; the planner checks it in a browser at the end of the epic.

## Out of scope
src/ui/hud.ts, src/ui/shop.ts, src/main.ts (already calls createRaidHud, updateRaidHud and createCraftUi).
~~~~

### 2F: Achievements for raids and reforging

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing other Gnomomia files. Change only the files
listed. Do not commit.

## Goal
Gnomes of Gnomomia gets its first achievements: four for horn calls (raids) and reforging, each with a cosmetic reward
the player's gnome wears in every game.

## Read first
- packages/achievements/README.md (how a game adds achievements; rewards must be unique prefabs with the right `wear-*` tag).
- packages/achievements/src/types.ts (AchievementDef) and the first entries of packages/achievements/src/catalog.ts.
- docs/cosmetics.md (the reward inventory) and packages/prefabs/src/catalog/cosmetics-head-a.ts / cosmetics-neck.ts /
  cosmetics-back.ts (find unused prefabs; `grep -n "prefabId" packages/achievements/src/catalog.ts` lists the used ones).
- games/gnomes-of-gnomomia/src/raidAchievements.ts (stub) and src/events.ts ('raid-ended', 'item-crafted').

## Change
- packages/achievements/src/catalog.ts: a `// ---- Gnomes of Gnomomia ----` block, `game: 'gnomes-of-gnomomia'`,
  `gameTitle: 'Gnomes of Gnomomia'`:
  - `gnomomia-first-horn` "Answer the Horn": win a horn call. Reward: a head or back item.
  - `gnomomia-lucky-horn` "Two Notches": get two or more pieces of horn-marked gear from one horn call. Reward: neck.
  - `gnomomia-reforged` "Reforged": reforge a piece at a reforging anvil. Reward: hand or back.
  - `gnomomia-every-horn` "Every Horn in Fescue": win all five horn calls. Reward: head, `exclusive: true`.
  Pick prefabs no other achievement uses, with the matching wear tag (horn, bugle, notch, anvil or smith themes if any
  exist). If none fits, add one PrefabDef to the right packages/prefabs/src/catalog/cosmetics-*.ts file following that
  file's patterns, and make `npm test -w packages/prefabs` pass.
- games/gnomes-of-gnomomia/src/raidAchievements.ts: `initRaidAchievements(ui)`: `const tracker = createAchievementTracker({ game: 'gnomes-of-gnomomia', ui });`
  (import from '@lawn/achievements'; package.json already lists it). On 'raid-ended' with won: unlock first-horn; if
  drops.length >= 2 unlock lucky-horn; if every RAIDS id has flag `raid:<id>:clears` >= 1 (state.flags) unlock
  every-horn. On 'item-crafted': unlock reforged. Use `void tracker.unlock(...)` (promises are fire-and-forget).

## Done when
- `npm test -w packages/achievements` passes (and `npm test -w packages/prefabs` if you added a prefab).
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes.

## Out of scope
Other games' achievement entries; every Gnomomia file except src/raidAchievements.ts.
~~~~

### 2G: Helpers in the combat arena, and raid gear out of the gear tiers

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Another worker is filling
src/raidHelperLogic.ts right now (its stub signatures are final) and another src/sim/raidScenarios.ts. Change only the
two files listed. Do not commit.

## Goal
The headless combat arena (src/sim/arena.ts) can run a raid: helpers from `scenario.helpers` deal damage, heal and soak
swings using the same pure helper logic as the game, and the scenario is won when `scenario.raidBoss` dies. The sim's
gear tiers stop picking raid and reforged gear (ItemDef.source) unless asked, so existing balance results do not shift
when raid items are added.

## Read first
- games/gnomes-of-gnomomia/src/sim/arena.ts: createArena, spawnSpec, the step() enemy loop (the `enemyAttack(e)` swing
  near line 635), the onHit/damage-by-source bookkeeping (~line 220-270), and the win/timeout checks (~680-770).
- games/gnomes-of-gnomomia/src/sim/types.ts: ScenarioSpec.helpers, ScenarioSpec.raidBoss, LoadoutSpec.raidGear.
- games/gnomes-of-gnomomia/src/raidHelperLogic.ts (stub signatures: helperStats, createHelperState, isUp, damageHelper,
  tickHelper, pickHealTarget, assignSwing). src/entities.ts: RAID_HELPER_TARGET_BASE. src/combat.ts: dealDamage, healPlayer.
- games/gnomes-of-gnomomia/src/sim/loadout.ts lines 80-175 (gear tier item filters).

## Change
- src/sim/arena.ts:
  - In createArena: `const helpers = (scenario.helpers ?? []).filter((s) => s.kind === 'helper').map((s, i) => createHelperState(i, s));`
    and their stats (`helperStats(role, level)`).
  - Each step, after the player's action and before the enemy loop: per helper, `tickHelper(h, dt)`; on attack, pick a
    live target (tank: the raidBoss enemy if alive, else nearest; damage: the lowest-HP live enemy that is not the boss,
    else the boss; healer: the boss) and `dealDamage(target.id, stats.hit, stats.damageType, { attacker: RAID_HELPER_TARGET_BASE - h.index, noRoll: true })`;
    on heal, `pickHealTarget(state.hp / maxHp(), helpers)` -> healPlayer(stats.heal) or raise that helper's hp (max hpMax).
    Record helper damage under `damageDealtBySource['helper:' + role]` (make sure the onHit handler does not count it as
    the player's own damage or hits landed).
  - Enemy swings: when helpers exist, `const to = assignSwing(def.rank, rng, helpers)`. If `to` is a helper index, swing
    when the attack timer is ready regardless of distance to the player, and `damageHelper(helpers[to], (lo + hi) / 2)`
    with lo, hi from `enemyStats(def).damage`; else keep the current player swing exactly as it is.
  - Win: when `scenario.raidBoss` is set, the run is won once an enemy with that defId has spawned and none is alive;
    then remove the remaining enemies. Without raidBoss nothing changes.
- src/sim/loadout.ts: in the weapon and armour pickers, skip items with `it.source` set unless `spec.raidGear` is true.

## Contract
No change to SimArena or runner signatures. Without `helpers`/`raidBoss` every existing scenario behaves exactly as before.

## Done when
- `npx vitest run src/sim/balance.test.ts` (in games/gnomes-of-gnomomia) passes unchanged.
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes.
- A quick check in a scratch test or node run (do not commit it): an existing boss scenario such as SCENARIOS['boss-sedgewick']
  with three helper seats (`{ kind: 'helper', id: 'helper-0', name: 'A', classId: 'warden', level: 28, role: 'tank' }`, ...)
  and `raidBoss: 'high-edger'` finishes faster than without helpers over 10 seeds (runMonteCarlo). Report the two medians.

## Out of scope
src/sim/raidScenarios.ts, scripts/*, src/raidHelperLogic.ts.
~~~~

### 2H: Raid scenarios and `npm run sim:raid`

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Other workers are adding helper support
to src/sim/arena.ts and filling src/raidRoster.ts right now (final signatures in their stubs). There are no raids in
content yet (RAIDS is empty until the next epic). Change only the two files listed. Do not commit.

## Goal
`npm run sim:raid -w games/gnomes-of-gnomomia -- [--raid=<id>] [--class=<id>] [--seeds=30] [--check]` runs every raid x
class in the combat arena with its helpers and prints win rate and median clear time against the 2-3 minute target.

## Read first
- games/gnomes-of-gnomomia/src/sim/raidScenarios.ts (stub: keep exports and signatures).
- games/gnomes-of-gnomomia/scripts/sim-balance.mjs (esbuild bundling into a temp dir, flag parsing, table printing).
- games/gnomes-of-gnomomia/src/sim/runner.ts: runMonteCarlo(scenario, loadout, policy, { seeds }) -> SimSummary
  (winRate, medianTtkSeconds). src/sim/agents.ts: TacticalPlayer. src/sim/types.ts: ScenarioSpec (helpers, raidBoss), LoadoutSpec.
- games/gnomes-of-gnomomia/src/raidRoster.ts (seatRaid), src/data/raidTuning.ts (RAID_TUNING.seats, targetSeconds, maxSeconds).

## Change
- src/sim/raidScenarios.ts:
  - `raidScenario(raid, classId)`: seats = seatRaid(RAID_TUNING.seats, { name: 'Sim', classId, level: raid.level }, [], mulberry32(1))
    (mulberry32 from '../rules'); return `{ id: `${raid.id}-${classId}`, name: `Raid: ${raid.name} (L${raid.level}, ${classId})`,
    kind: 'boss', zone: raid.zone, waves: [{ enemyId: raid.boss, count: 1, distance: 8, spawnAtSeconds: 0 },
    ...raid.waves.map((w) => ({ enemyId: w.enemy, count: w.count, distance: 10, angleSpread: Math.PI * 1.2, spawnAtSeconds: w.at }))],
    maxSeconds: RAID_TUNING.maxSeconds, helpers: seats.filter((s) => s.kind === 'helper'), raidBoss: raid.boss }`.
  - `raidLoadout(raid, classId)`: `{ level: raid.level, classId, build: { warden: 'shieldwall', slinger: 'deadeye', mage: 'sunburst' }[classId], gearTier: 'zone-sprouted' }`.
  - `runRaidSims(seeds, raidIds?, classes = ['warden', 'slinger', 'mage'])`: for each raid in RAIDS (filtered) and class,
    runMonteCarlo(raidScenario, raidLoadout, TacticalPlayer, { seeds }) -> RaidSimRow { raidId, classId, runs: seeds,
    winRate, medianSeconds: summary.medianTtkSeconds, inBand: winRate >= 0.8 && median within RAID_TUNING.targetSeconds }.
- scripts/sim-raid.mjs: bundle `export * from './src/sim/raidScenarios.ts'; export { RAIDS } from './src/content.ts'; export { RAID_TUNING } from './src/data/raidTuning.ts';`
  the same way sim-balance.mjs does; flags --raid, --class, --seeds (default 30), --json, --check. Print a header with the
  target band, then one row per raid x class: raid, level, class, win %, median s, OK / OUT. With --check exit 1 when any
  row is OUT. With no raids: print "No raids in content yet." and exit 0.

## Contract
raidScenarios.ts exports exactly as the stub. RaidSimRow as declared there.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes.
- `npm run sim:raid -w games/gnomes-of-gnomomia` prints "No raids in content yet." and exits 0.

## Out of scope
src/sim/arena.ts, src/sim/loadout.ts, src/raidRoster.ts, package.json (the script entry exists).
~~~~

---

## Epic 3: Content

Issues 3A-3E share one shape: one raid pack file plus one lore entry. Each is written out in full below because a worker sees only its own issue.

### 3A: Raid `raid-keep`: Murmur, the Starling Mother (Birdbath Keep, level 12)

~~~~text
Epic: 3 Content
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Four other workers are writing the other
raid packs right now: change only src/data/packs/raid-keep.ts and the one lore entry. Use `npm run lore -- check`, never
plain `npm run lore`. Lore house style: plain names, every pest wants something, no gore (things crack, scatter, flee),
dry jokes, no pop culture. Do not commit.

## Goal
The first horn call: on the west lawn below the Archive at Birdbath Keep, a starling mother and her flock. Win it to
roll five pieces of horn-marked gear (1 in 5 each, ilvl 13) that the reforging anvil in Sodbury turns into ilvl 17 pieces.

## Read first
- games/gnomes-of-gnomomia/src/data/packs/raid-keep.ts (stub: keep `PACK` id 'raid-keep' and `RAID_PACK`).
- games/gnomes-of-gnomomia/src/raidTypes.ts (RaidDef, RecipeDef), src/data/raidTuning.ts (RAID_UNLOCK, raidBossHp, raidAddHp).
- games/gnomes-of-gnomomia/src/economy.ts: raidItemValue(ilvl), craftGold(ilvl).
- games/gnomes-of-gnomomia/src/data/packs/ch4-cloverfield.ts lines 40-60 (blooming weapon, smock and charm item shapes) and
  src/data/packs/ch3-keep.ts lines 50-70 (a boss EnemyDef with `moves`).
- docs/lore/entries/fescue/old-gleaner.md (a creature entry) and docs/lore/entries/fescue/horn-calls.md.

## Change
- src/data/packs/raid-keep.ts. Imports: `type ContentPack, type EnemyDef, type ItemDef` from '../../config', `type RaidPack`
  from '../../raidTypes', `RAID_UNLOCK, raidAddHp, raidBossHp` from '../raidTuning', `craftGold, raidItemValue` from '../../economy'.
  - enemies (all `noReward: true`, `respawnSeconds: 0`, `loot: []`, `gold: [0, 0]`, `aggressive: true`, plus `examine` and `wants`):
    - `raid-keep-murmur`: name 'Murmur, the Starling Mother', level 12, rank 'boss', family 'winged', damageType 'pierce',
      model 'crow', color 0x2b2f4a, scale 1.6, hpOverride raidBossHp(12), wants: "Seed for her flock's winter. The Keep's
      west lawn is where the seed-carts spill." lastWords 'Chrrrk.' moves:
      `{ id: 'swoop', name: 'Swoop', kind: 'lane', every: 11, telegraph: 1.5, length: 14, width: 2.5, damage: 1.4 }`,
      `{ id: 'gust', name: 'Gust', kind: 'cone', every: 14, telegraph: 1.2, radius: 7, damage: 0.9, status: 'staggered', statusSeconds: 1.5 }`,
      `{ id: 'murmuration', name: 'Murmuration', kind: 'summon', every: 30, telegraph: 1, summon: { enemy: 'raid-keep-starling', count: 3 } }`.
    - `raid-keep-starling`: name 'Starling', level 11, rank 'normal', family 'winged', damageType 'pierce', model 'crow',
      color 0x3a3f5a, scale 0.7, hpOverride raidAddHp(11), wants: "Whatever Murmur wants. Mostly seed."
  - items: five drops, ilvl 13, rarity 'heirloom', source 'raid', value raidItemValue(13), stat amount 2, each with a short
    dry `examine` that mentions the horn mark:
    - `raid-keep-beak-pick` 'Starling-beak pick' 🗡️ weapon, slot weapon, damageType 'pierce', hands 1, weaponClass 'melee', stats { strength: 2, endurance: 2 }
    - `raid-keep-sling` 'Murmur-feather sling' 🪶 weapon, damageType 'crush', hands 1, weaponClass 'sling', stats { agility: 2, accuracy: 2 }
    - `raid-keep-wand` 'Seed-store wand' 🪄 weapon, damageType 'sun', hands 1, weaponClass 'wand', stats { intelligence: 2, endurance: 2 }
    - `raid-keep-hood` 'Starling-down hood' 🧢 armor, slot head, armorType 'cloth', stats { endurance: 2, defense: 2 }
    - `raid-keep-charm` 'Speckled egg charm' 🥚 trinket, slot trinket, stats { endurance: 2, agility: 2 }
    and five reforged pieces, id `<drop id>-reforged`, name 'Reforged ' + the drop's name in lower case after the first
    word as usual (e.g. 'Reforged starling-beak pick'), same kind/slot/class fields, ilvl 17, rarity 'heirloom',
    source 'craft', value raidItemValue(17), stat amount 3.
  - objects: `raid-keep-horn`: zone 'keep', x -40, z -16, name 'Horn post', model 'horn', verb 'Sound the horn',
    examine "A Reeve's horn on a post. Blow it, and any Wayfarer in earshot comes running.", when RAID_UNLOCK.
  - RAID_PACK.raids: one RaidDef `{ id: 'raid-keep', name: 'The Archive Lawn Murmuration', zone: 'keep', level: 12, minLevel: 10,
    x: -40, z: -30, r: 14, boss: 'raid-keep-murmur', waves: [{ enemy: 'raid-keep-starling', count: 3, at: 20 }, { enemy: 'raid-keep-starling', count: 3, at: 60 }, { enemy: 'raid-keep-starling', count: 4, at: 100 }],
    horn: 'raid-keep-horn', drops: [the five drop ids], intro: <one line: the horn sounds, the lawn goes dark with starlings>,
    victory: <one line: the flock lifts and scatters over the Basin> }`.
  - RAID_PACK.recipes: one per drop: `{ id: 'raid-keep-<role>-reforge', station: 'raid-anvil-sodbury', makes: '<drop>-reforged', needs: [{ item: '<drop>', count: 1 }], gold: craftGold(17) }`.
- New docs/lore/entries/fescue/murmur.md: id murmur, name 'Murmur', kind creature, tier setting, setting fescue, era now,
  status canon, games [gnomes-of-gnomomia], aliases [Murmur the Starling Mother, the Starling Mother],
  sources [games/gnomes-of-gnomomia/src/data/packs/raid-keep.ts, docs/lore/rulings.md], related [horn-calls, birdbath-keep, royal-archive].
  Summary, "What it wants", "In the games" (horn call at level 12 below the Archive; moves; what it drops), one loose thread.

## Contract
Ids and numbers exactly as above (other files reference raid-anvil-sodbury and the reforged ids). Coordinates are
zone-local; content.ts moves them.

## Done when
- In games/gnomes-of-gnomomia: `npx vitest run src/raidContent.test.ts -t raid-keep` passes, and `npx tsc --noEmit -p .` passes.
- `npm run lint:content -w games/gnomes-of-gnomomia -- raid-keep` reports no errors for pack raid-keep.
- `npm run lore -- check` passes.

## Out of scope
Every other pack and file. Do not tune numbers beyond what is given (Epic 4 tunes them).
~~~~

### 3B: Raid `raid-clover`: Grainsack, the Field-Mouse King (Cloverfield, level 16)

~~~~text
Epic: 3 Content
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Four other workers are writing the other
raid packs right now: change only src/data/packs/raid-clover.ts and the one lore entry. Use `npm run lore -- check`, never
plain `npm run lore`. Lore house style: plain names, every pest wants something, no gore, dry jokes, no pop culture. Do not commit.

## Goal
The second horn call: by the Honeydew Ranch silos in Cloverfield, the field-mouse king and his harvest mice. Five drops
(1 in 5 each, ilvl 17) that the reforging anvil at Clippings turns into ilvl 21 pieces. The Keep raid's ilvl 13 drops are
reforged here in Sodbury (that pack does it, not this one).

## Read first
- games/gnomes-of-gnomomia/src/data/packs/raid-clover.ts (stub: keep `PACK` id 'raid-clover' and `RAID_PACK`).
- games/gnomes-of-gnomomia/src/raidTypes.ts (RaidDef, RecipeDef), src/data/raidTuning.ts (RAID_UNLOCK, raidBossHp, raidAddHp).
- games/gnomes-of-gnomomia/src/economy.ts: raidItemValue(ilvl), craftGold(ilvl).
- games/gnomes-of-gnomomia/src/data/packs/ch4-cloverfield.ts lines 40-60 (item shapes) and 80-95 (an enemy), and the
  `field-mouse` enemy (model 'rat').
- docs/lore/entries/fescue/old-gleaner.md and docs/lore/entries/fescue/horn-calls.md.

## Change
- src/data/packs/raid-clover.ts. Imports: `type ContentPack, type EnemyDef, type ItemDef` from '../../config', `type RaidPack`
  from '../../raidTypes', `RAID_UNLOCK, raidAddHp, raidBossHp` from '../raidTuning', `craftGold, raidItemValue` from '../../economy'.
  - enemies (all `noReward: true`, `respawnSeconds: 0`, `loot: []`, `gold: [0, 0]`, `aggressive: true`, with `examine`, `wants`):
    - `raid-clover-grainsack`: 'Grainsack, the Field-Mouse King', level 16, rank 'boss', family 'furred', damageType 'crush',
      model 'rat', color 0x8a6a4a, scale 2.0, hpOverride raidBossHp(16), wants: "Winter stores. The farms are bare, and the
      ranch silos are the last full grain in Cloverfield." lastWords 'Squeak. (A very small squeak, for him.)' moves:
      `{ id: 'belly-flop', name: 'Belly Flop', kind: 'ring', every: 12, telegraph: 1.5, radius: 5, damage: 1.3, status: 'staggered', statusSeconds: 1.5 }`,
      `{ id: 'chaff-cloud', name: 'Chaff Cloud', kind: 'pool', every: 15, telegraph: 1.2, radius: 3.5, damage: 0.5, status: 'slowed', statusSeconds: 3 }`,
      `{ id: 'call-the-granary', name: 'Call the Granary', kind: 'summon', every: 30, telegraph: 1, summon: { enemy: 'raid-clover-harvest-mouse', count: 3 } }`.
    - `raid-clover-harvest-mouse`: 'Harvest mouse', level 15, rank 'normal', family 'furred', damageType 'slash', model 'rat',
      color 0xb08a5a, scale 0.9, hpOverride raidAddHp(15), wants: "A share of the silo, carried home one cheekful at a time."
  - items: five drops, ilvl 17, rarity 'heirloom', source 'raid', value raidItemValue(17), stat amount 3, short dry `examine`
    mentioning the horn mark:
    - `raid-clover-flail` 'Grain flail' weapon, damageType 'crush', hands 1, weaponClass 'melee', stats { strength: 3, endurance: 3 }
    - `raid-clover-sling` 'Silo-rope sling' weapon, damageType 'crush', hands 1, weaponClass 'sling', stats { agility: 3, accuracy: 3 }
    - `raid-clover-wand` 'Ear-of-wheat wand' weapon, damageType 'sun', hands 1, weaponClass 'wand', stats { intelligence: 3, endurance: 3 }
    - `raid-clover-hood` 'Chaff-sack hood' armor, slot head, armorType 'cloth', stats { endurance: 3, defense: 3 }
    - `raid-clover-charm` "Mouse-king's thimble" trinket, stats { endurance: 3, agility: 3 }
    (pick fitting emoji icons) and five reforged pieces `<drop id>-reforged` ('Reforged grain flail', ...), same fields,
    ilvl 21, rarity 'heirloom', source 'craft', value raidItemValue(21), stat amount 3.
  - objects: `raid-clover-horn`: zone 'cloverfield', x -80, z -6, name 'Horn post', model 'horn', verb 'Sound the horn',
    examine "A Reeve's horn on a post. Blow it, and any Wayfarer in earshot comes running.", when RAID_UNLOCK.
  - RAID_PACK.raids: `{ id: 'raid-clover', name: 'The Honeydew Silo Raid', zone: 'cloverfield', level: 16, minLevel: 14,
    x: -80, z: -20, r: 14, boss: 'raid-clover-grainsack', waves: [{ enemy: 'raid-clover-harvest-mouse', count: 3, at: 20 }, { ..., count: 3, at: 60 }, { ..., count: 4, at: 100 }],
    horn: 'raid-clover-horn', drops: [the five drop ids], intro: <one line>, victory: <one line> }`.
  - RAID_PACK.recipes: one per drop: `{ id: 'raid-clover-<role>-reforge', station: 'raid-anvil-clippings', makes: '<drop>-reforged', needs: [{ item: '<drop>', count: 1 }], gold: craftGold(21) }`.
- New docs/lore/entries/fescue/grainsack.md: id grainsack, name 'Grainsack', kind creature, tier setting, setting fescue,
  era now, status canon, games [gnomes-of-gnomomia], aliases [Grainsack the Field-Mouse King, the Field-Mouse King],
  sources [games/gnomes-of-gnomomia/src/data/packs/raid-clover.ts, docs/lore/rulings.md], related [horn-calls, cloverfield, old-gleaner].
  Summary, "What it wants", "In the games", one loose thread.

## Contract
Ids and numbers exactly as above (raid-anvil-clippings exists in pack raid-stations). Zone-local coordinates.

## Done when
- In games/gnomes-of-gnomomia: `npx vitest run src/raidContent.test.ts -t raid-clover` passes, and `npx tsc --noEmit -p .` passes.
- `npm run lint:content -w games/gnomes-of-gnomomia -- raid-clover` reports no errors for pack raid-clover.
- `npm run lore -- check` passes.

## Out of scope
Every other pack and file. Do not tune numbers (Epic 4 does).
~~~~

### 3C: Raid `raid-hedge`: Ironhorn, the Old Stag (Hedgewood, level 20)

~~~~text
Epic: 3 Content
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Four other workers are writing the other
raid packs right now: change only src/data/packs/raid-hedge.ts and the one lore entry. Use `npm run lore -- check`, never
plain `npm run lore`. Lore house style: plain names, every pest wants something, no gore, dry jokes, no pop culture. Do not commit.

## Goal
The third horn call: under the Elder Privet in the Hedgewood, an old stag beetle defending his rutting ground. Five drops
(1 in 5 each, ilvl 21) that the reforging anvil at Flintdelve turns into ilvl 25 pieces.

## Read first
- games/gnomes-of-gnomomia/src/data/packs/raid-hedge.ts (stub: keep `PACK` id 'raid-hedge' and `RAID_PACK`).
- games/gnomes-of-gnomomia/src/raidTypes.ts, src/data/raidTuning.ts (RAID_UNLOCK, raidBossHp, raidAddHp), src/economy.ts
  (raidItemValue, craftGold).
- games/gnomes-of-gnomomia/src/data/packs/ch5-hedgewood.ts lines 1-40 (item shapes; the tamed stag beetle quest uses a
  young stag beetle, so keep this one clearly a different, older beetle).
- docs/lore/entries/fescue/hedgewood.md, hedgewrights.md and horn-calls.md.

## Change
- src/data/packs/raid-hedge.ts. Imports as in the other raid packs: `type ContentPack, type EnemyDef, type ItemDef` from
  '../../config', `type RaidPack` from '../../raidTypes', `RAID_UNLOCK, raidAddHp, raidBossHp` from '../raidTuning',
  `craftGold, raidItemValue` from '../../economy'.
  - enemies (all `noReward: true`, `respawnSeconds: 0`, `loot: []`, `gold: [0, 0]`, `aggressive: true`, with `examine`, `wants`):
    - `raid-hedge-ironhorn`: 'Ironhorn, the Old Stag', level 20, rank 'boss', family 'shelled', damageType 'crush', model 'beetle',
      color 0x3a2a1a, scale 2.4, hpOverride raidBossHp(20), wants: "His rutting ground under the Elder Privet, which the
      Hedgewrights keep clearing for timber." lastWords 'Click.' moves:
      `{ id: 'antler-sweep', name: 'Antler Sweep', kind: 'cone', every: 10, telegraph: 1.3, radius: 6, damage: 1.3 }`,
      `{ id: 'charge', name: 'Charge', kind: 'lane', every: 14, telegraph: 1.6, length: 16, width: 3, damage: 1.5, status: 'staggered', statusSeconds: 2 }`,
      `{ id: 'rut-call', name: 'Rut Call', kind: 'summon', every: 32, telegraph: 1, summon: { enemy: 'raid-hedge-young-stag', count: 2 } }`.
    - `raid-hedge-young-stag`: 'Young stag', level 19, rank 'normal', family 'shelled', damageType 'crush', model 'beetle',
      color 0x5a3a1a, scale 1.2, hpOverride raidAddHp(19), wants: "To prove himself to the old one."
  - items: five drops, ilvl 21, rarity 'heirloom', source 'raid', value raidItemValue(21), stat amount 3, dry `examine`
    mentioning the horn mark:
    - `raid-hedge-antler-axe` 'Antler axe' weapon, damageType 'slash', hands 1, weaponClass 'melee', stats { strength: 3, endurance: 3 }
    - `raid-hedge-sling` 'Rut-cord sling' weapon, damageType 'crush', hands 1, weaponClass 'sling', stats { agility: 3, accuracy: 3 }
    - `raid-hedge-wand` 'Privet-heart wand' weapon, damageType 'sun', hands 1, weaponClass 'wand', stats { intelligence: 3, endurance: 3 }
    - `raid-hedge-hood` 'Bark-felt hood' armor, slot head, armorType 'cloth', stats { endurance: 3, defense: 3 }
    - `raid-hedge-charm` 'Shed-antler charm' trinket, stats { endurance: 3, agility: 3 }
    and five reforged pieces `<drop id>-reforged`, ilvl 25, rarity 'heirloom', source 'craft', value raidItemValue(25), stat amount 4.
  - objects: `raid-hedge-horn`: zone 'hedgewood', x -65, z -26, name 'Horn post', model 'horn', verb 'Sound the horn',
    examine "A Reeve's horn on a post. Blow it, and any Wayfarer in earshot comes running.", when RAID_UNLOCK.
  - RAID_PACK.raids: `{ id: 'raid-hedge', name: 'The Rut Under the Elder Privet', zone: 'hedgewood', level: 20, minLevel: 18,
    x: -65, z: -40, r: 14, boss: 'raid-hedge-ironhorn', waves: [{ enemy: 'raid-hedge-young-stag', count: 2, at: 20 }, { ..., count: 3, at: 60 }, { ..., count: 3, at: 100 }],
    horn: 'raid-hedge-horn', drops: [five ids], intro, victory }`.
  - RAID_PACK.recipes: one per drop at station 'raid-anvil-flintdelve', makes '<drop>-reforged', needs the drop x1, gold craftGold(25).
- New docs/lore/entries/fescue/ironhorn.md: id ironhorn, name 'Ironhorn', kind creature, tier setting, setting fescue, era now,
  status canon, games [gnomes-of-gnomomia], aliases [Ironhorn the Old Stag, the Old Stag],
  sources [games/gnomes-of-gnomomia/src/data/packs/raid-hedge.ts, docs/lore/rulings.md], related [horn-calls, hedgewood, hedgewrights].

## Contract
Ids and numbers exactly as above (raid-anvil-flintdelve exists in pack raid-stations). Zone-local coordinates.

## Done when
- In games/gnomes-of-gnomomia: `npx vitest run src/raidContent.test.ts -t raid-hedge` passes; `npx tsc --noEmit -p .` passes.
- `npm run lint:content -w games/gnomes-of-gnomomia -- raid-hedge` reports no errors for pack raid-hedge.
- `npm run lore -- check` passes.

## Out of scope
Every other pack and file. Do not tune numbers (Epic 4 does).
~~~~

### 3D: Raid `raid-rock`: Clinkerback, the Seam Centipede (the Rockery, level 24)

~~~~text
Epic: 3 Content
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Four other workers are writing the other
raid packs right now: change only src/data/packs/raid-rock.ts and the one lore entry. Use `npm run lore -- check`, never
plain `npm run lore`. Lore house style: plain names, every pest wants something, no gore, dry jokes, no pop culture. Do not commit.

## Goal
The fourth horn call: below the Shard Mine in the Rockery, a great centipede that wants the deep seam's warmth back.
Five drops (1 in 5 each, ilvl 25) that the reforging anvil at Last Tuft turns into ilvl 30 pieces.

## Read first
- games/gnomes-of-gnomomia/src/data/packs/raid-rock.ts (stub: keep `PACK` id 'raid-rock' and `RAID_PACK`).
- games/gnomes-of-gnomomia/src/raidTypes.ts, src/data/raidTuning.ts (RAID_UNLOCK, raidBossHp, raidAddHp), src/economy.ts
  (raidItemValue, craftGold).
- games/gnomes-of-gnomomia/src/data/packs/ch6-rockery.ts: the `rock-louse` and `rockery-centipede` enemies (copy their
  `model` for the adds and boss) and lines 1-40 for item shapes.
- docs/lore/entries/fescue/shard-mine.md, delvers.md and horn-calls.md.

## Change
- src/data/packs/raid-rock.ts. Imports as in the other raid packs.
  - enemies (all `noReward: true`, `respawnSeconds: 0`, `loot: []`, `gold: [0, 0]`, `aggressive: true`, with `examine`, `wants`):
    - `raid-rock-clinkerback`: 'Clinkerback, the Seam Centipede', level 24, rank 'boss', family 'shelled', damageType 'pierce',
      model: the model `rockery-centipede` uses, color 0x5a3a2a, scale 2.6, hpOverride raidBossHp(24), wants: "The warm
      deep seam. Every new Delver cut in the Shard Mine lets the warmth out." lastWords 'Tik. Tik. Tik.' moves:
      `{ id: 'coil', name: 'Coil', kind: 'ring', every: 12, telegraph: 1.5, radius: 5, damage: 1.2, status: 'staggered', statusSeconds: 1.5 }`,
      `{ id: 'grit-spray', name: 'Grit Spray', kind: 'cone', every: 9, telegraph: 1.1, radius: 7, damage: 0.9, status: 'chipped', statusSeconds: 6 }`,
      `{ id: 'brood', name: 'Brood', kind: 'summon', every: 28, telegraph: 1, summon: { enemy: 'raid-rock-louse', count: 4 } }`.
    - `raid-rock-louse`: 'Seam louse', level 23, rank 'trivial', family 'shelled', damageType 'pierce', model and color as
      `rock-louse`, scale 1.0, hpOverride raidAddHp(23), wants: "Warmth, from anything warm. You will do."
  - items: five drops, ilvl 25, rarity 'heirloom', source 'raid', value raidItemValue(25), stat amount 4, dry `examine`
    mentioning the horn mark:
    - `raid-rock-pick` 'Seam pick' weapon, damageType 'pierce', hands 1, weaponClass 'melee', stats { strength: 4, endurance: 4 }
    - `raid-rock-sling` 'Clinker sling' weapon, damageType 'crush', hands 1, weaponClass 'sling', stats { agility: 4, accuracy: 4 }
    - `raid-rock-wand` 'Warm-seam wand' weapon, damageType 'sun', hands 1, weaponClass 'wand', stats { intelligence: 4, endurance: 4 }
    - `raid-rock-hood` 'Grit-felt hood' armor, slot head, armorType 'cloth', stats { endurance: 4, defense: 4 }
    - `raid-rock-charm` 'Centipede-leg charm' trinket, stats { endurance: 4, agility: 4 }
    and five reforged pieces `<drop id>-reforged`, ilvl 30, rarity 'heirloom', source 'craft', value raidItemValue(30), stat amount 5.
  - objects: `raid-rock-horn`: zone 'rockery', x 65, z -31, name 'Horn post', model 'horn', verb 'Sound the horn',
    examine "A Reeve's horn on a post. Blow it, and any Wayfarer in earshot comes running.", when RAID_UNLOCK.
  - RAID_PACK.raids: `{ id: 'raid-rock', name: 'The Warm Seam', zone: 'rockery', level: 24, minLevel: 22, x: 65, z: -45, r: 14,
    boss: 'raid-rock-clinkerback', waves: [{ enemy: 'raid-rock-louse', count: 4, at: 20 }, { ..., count: 4, at: 60 }, { ..., count: 5, at: 100 }],
    horn: 'raid-rock-horn', drops: [five ids], intro, victory }`.
  - RAID_PACK.recipes: one per drop at station 'raid-anvil-last-tuft', makes '<drop>-reforged', needs the drop x1, gold craftGold(30).
- New docs/lore/entries/fescue/clinkerback.md: id clinkerback, name 'Clinkerback', kind creature, tier setting, setting fescue,
  era now, status canon, games [gnomes-of-gnomomia], aliases [Clinkerback the Seam Centipede, the Seam Centipede],
  sources [games/gnomes-of-gnomomia/src/data/packs/raid-rock.ts, docs/lore/rulings.md], related [horn-calls, shard-mine, delvers].

## Contract
Ids and numbers exactly as above (raid-anvil-last-tuft exists in pack raid-stations). Zone-local coordinates.

## Done when
- In games/gnomes-of-gnomomia: `npx vitest run src/raidContent.test.ts -t raid-rock` passes; `npx tsc --noEmit -p .` passes.
- `npm run lint:content -w games/gnomes-of-gnomomia -- raid-rock` reports no errors for pack raid-rock.
- `npm run lore -- check` passes.

## Out of scope
Every other pack and file. Do not tune numbers (Epic 4 does).
~~~~

### 3E: Raid `raid-verge`: Old Sump, Rust-Rat of the Oil Drum (the Verge, level 29)

~~~~text
Epic: 3 Content
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Four other workers are writing the other
raid packs right now: change only src/data/packs/raid-verge.ts and the one lore entry. Use `npm run lore -- check`, never
plain `npm run lore`. Lore house style: plain names, every pest wants something, no gore, dry jokes, no pop culture. Do not commit.

## Goal
The last horn call: on the western Shorn of the Verge, a huge rust-rat guarding an oil drum he dragged out of the Shed.
Five top-tier drops (1 in 5 each, ilvl 30, kiln-fired). There is no recipe for them: they are the end of the chain
(Rockery drops are reforged into ilvl 30 pieces at Last Tuft by another pack).

## Read first
- games/gnomes-of-gnomomia/src/data/packs/raid-verge.ts (stub: keep `PACK` id 'raid-verge' and `RAID_PACK`).
- games/gnomes-of-gnomomia/src/raidTypes.ts, src/data/raidTuning.ts (RAID_UNLOCK, raidBossHp, raidAddHp), src/economy.ts (raidItemValue).
- games/gnomes-of-gnomomia/src/data/packs/ch7-verge.ts: the `rust-rat` enemy and lines 1-70 for item shapes (kiln-fired
  items, if any, for the rarity spelling 'kilnfired').
- docs/lore/entries/fescue/the-shorn.md, the-shed.md, last-tuft.md and horn-calls.md.

## Change
- src/data/packs/raid-verge.ts. Imports as in the other raid packs (craftGold not needed).
  - enemies (all `noReward: true`, `respawnSeconds: 0`, `loot: []`, `gold: [0, 0]`, `aggressive: true`, with `examine`, `wants`):
    - `raid-verge-old-sump`: 'Old Sump, Rust-Rat of the Oil Drum', level 29, rank 'boss', family 'metal', damageType 'crush',
      model 'rat', color 0x6a4a2a, scale 2.4, hpOverride raidBossHp(29), wants: "The oil drum he dragged out of the Shed. He
      thinks Last Tuft has come to take it back." lastWords 'Mine. Was mine.' moves:
      `{ id: 'black-dew-slick', name: 'Black Dew Slick', kind: 'pool', every: 13, telegraph: 1.2, radius: 3.5, damage: 0.6, status: 'slowed', statusSeconds: 4 }`,
      `{ id: 'drum-roll', name: 'Drum Roll', kind: 'lane', every: 15, telegraph: 1.6, length: 18, width: 3, damage: 1.5, status: 'staggered', statusSeconds: 2 }`,
      `{ id: 'pack-call', name: 'Pack Call', kind: 'summon', every: 30, telegraph: 1, summon: { enemy: 'raid-verge-sump-rat', count: 3 } }`,
      `{ id: 'oil-rage', name: 'Oil Rage', kind: 'buff', every: 40, telegraph: 1, belowHpPct: 0.4 }`.
    - `raid-verge-sump-rat`: 'Sump rat', level 28, rank 'normal', family 'metal', damageType 'slash', model 'rat', color 0x7a5a3a,
      scale 1.1, hpOverride raidAddHp(28), wants: "A lick of the drum, when Old Sump is not looking."
  - items: five drops, ilvl 30, rarity 'kilnfired', source 'raid', value raidItemValue(30), stat amount 5, dry `examine`
    mentioning the horn mark:
    - `raid-verge-wrench` 'Drum wrench' weapon, damageType 'crush', hands 1, weaponClass 'melee', stats { strength: 5, endurance: 5 }
    - `raid-verge-sling` 'Oil-drum sling' weapon, damageType 'crush', hands 1, weaponClass 'sling', stats { agility: 5, accuracy: 5 }
    - `raid-verge-wand` 'Drum-lid wand' weapon, damageType 'sun', hands 1, weaponClass 'wand', stats { intelligence: 5, endurance: 5 }
    - `raid-verge-hood` 'Rust-rat hood' armor, slot head, armorType 'cloth', stats { endurance: 5, defense: 5 }
    - `raid-verge-charm` 'Drum-bung charm' trinket, stats { endurance: 5, agility: 5 }
  - objects: `raid-verge-horn`: zone 'verge', x -70, z 69, name 'Horn post', model 'horn', verb 'Sound the horn',
    examine "A Reeve's horn on a post. Blow it, and any Wayfarer in earshot comes running.", when RAID_UNLOCK.
  - RAID_PACK.raids: `{ id: 'raid-verge', name: 'The Oil Drum', zone: 'verge', level: 29, minLevel: 27, x: -70, z: 55, r: 14,
    boss: 'raid-verge-old-sump', waves: [{ enemy: 'raid-verge-sump-rat', count: 3, at: 20 }, { ..., count: 3, at: 60 }, { ..., count: 4, at: 100 }],
    horn: 'raid-verge-horn', drops: [five ids], intro, victory }`. RAID_PACK.recipes: [].
- New docs/lore/entries/fescue/old-sump.md: id old-sump, name 'Old Sump', kind creature, tier setting, setting fescue, era now,
  status canon, games [gnomes-of-gnomomia], aliases [Old Sump Rust-Rat of the Oil Drum],
  sources [games/gnomes-of-gnomomia/src/data/packs/raid-verge.ts, docs/lore/rulings.md], related [horn-calls, the-shorn, the-shed].

## Contract
Ids and numbers exactly as above. Zone-local coordinates. raid-verge is the highest-level raid, so its drops need no recipe.

## Done when
- In games/gnomes-of-gnomomia: `npx vitest run src/raidContent.test.ts -t raid-verge` passes; `npx tsc --noEmit -p .` passes.
- `npm run lint:content -w games/gnomes-of-gnomomia -- raid-verge` reports no errors for pack raid-verge.
- `npm run lore -- check` passes.

## Out of scope
Every other pack and file. Do not tune numbers (Epic 4 does).
~~~~

### 3F: Design doc and index

~~~~text
Epic: 3 Content
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Docs only. Five other workers are
writing the raid packs right now. Do not commit.

## Goal
A design note for raids and reforging that the next agent can work from (including the party hook), plus index entries.

## Read first
- docs/roadmaps/gnomomia-rebalance-raids.md: "Goal" and "The five raids" (copy the facts, not the plan).
- docs/design/gnomomia/README.md (the index of design notes) and docs/design/gnomomia/economy.md (style).
- games/gnomes-of-gnomomia/src/raidTypes.ts, src/data/raidTuning.ts, src/raidRoster.ts (setPartySource, seatRaid).
- AGENT_INDEX.md: the "Tasks" table rows for Gnomomia (sim:economy) and the gnomes-of-gnomomia game row, and the docs table.

## Change
- New docs/design/gnomomia/raids.md, plain and short: what a horn call is (link docs/lore/entries/fescue/horn-calls.md);
  unlock (c2-letter-for-the-queen); the five raids table (id, zone, level/min, arena, boss, adds, drops ilvl, reforged
  where); the flow (horn -> seats -> 5 s countdown -> boss and waves at 20/60/100 s -> win: each drop 1 in 5, coins,
  XP = 8 normal kills -> loss: death, leaving the arena 8 s, 6 min, Leave); helpers (roles by class; numbers in
  RAID_TUNING.helper; enemy-target ids RAID_HELPER_TARGET_BASE - n; local only); **party hook** (`setPartySource({ members() })`
  in src/raidRoster.ts; members within RAID_TUNING.partyRange of the horn take seats; helpers fill the rest; the
  'raid-started' / 'raid-ended' events carry the seats; online notes: raids run on the horn-blower's client, helpers are
  not relayed); reforging (anvils, recipe shape, chain Keep -> Sodbury -> Clippings -> Flintdelve -> Last Tuft, gold =
  craftGold(ilvl)); why raid gear sells for 2 x ilvl (no coin farm); kill credit (only enemies the player hit pay XP, loot
  and gold; raid spawns pay nothing, the clear pays); tuning commands (`npm run sim:raid -w games/gnomes-of-gnomomia -- --check`,
  `npm run sim:economy ... -- --check`, dev URL `?raid=raid-keep`); an empty "Tuning results" section for Epic 4 to fill.
- docs/design/gnomomia/README.md: one line linking raids.md.
- AGENT_INDEX.md: a Tasks row "Check Gnomomia raid clear times (2-3 min) after changing raid packs or RAID_TUNING" ->
  `npm run sim:raid -w games/gnomes-of-gnomomia -- --check`; in the gnomes-of-gnomomia game row add `sim:raid` to the
  scripts and `docs/roadmaps/gnomomia-rebalance-raids.md` to Plans; a docs-table row for docs/design/gnomomia/raids.md.

## Done when
- Every path you link exists (`ls` them). Markdown tables render (same column count per row).

## Out of scope
Game source files and lore entries.
~~~~

---

## Epic 4: Re-simulate and tune

### 4A: Raids in the economy sim, the farm numbers, re-balance and golden

~~~~text
Epic: 4 Re-simulate and tune
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Another worker is tuning raid fights
(src/data/raidTuning.ts and the raid packs' waves) at the same time: do not touch those. Do not commit.

## Goal
The economy sim plays raid clears, so the XP, coin and time curve includes them, and a new flag makes sure raids never
beat questing for XP per hour. Re-run every check, retune ECONOMY.raid if needed, regenerate the golden, and write the
before/after (including the water-beetle farm numbers) into the economy doc.

## Read first
- games/gnomes-of-gnomomia/src/sim/economy.ts: EconomyPlayerModel / DEFAULT_PLAYER / PLAYER_VARIANTS (31-92),
  ECONOMY_TARGETS and EconomyFlagCode (97-142), EconomyPhaseReport (162-202), runEconomy's per-phase loop (from 513), and
  checkEconomy / MARGIN_FLAGS (909-1000).
- games/gnomes-of-gnomomia/src/sim/economyPhases.ts: phaseIndexFor(zone, level).
- games/gnomes-of-gnomomia/src/economy.ts: raidClearXp, raidClearGold; src/data/economy.ts: ECONOMY.raid;
  src/data/raidTuning.ts: RAID_TUNING.dropChance, RAID_UNLOCK. src/content.ts: RAIDS, ITEMS.
- docs/design/gnomomia/economy.md (structure; add a section, do not rewrite the rest).

## Change
- src/sim/economy.ts:
  - EconomyPlayerModel: `raidClears: number` ("clears of each open raid per phase", default 4) and `raidMinutes: number`
    ("minutes per clear including the walk to the horn and regrouping", default 4).
  - PLAYER_VARIANTS: `'no-raids': { raidClears: 0 }` and `'raid-heavy': { raidClears: 12 }`.
  - In each phase, after its quests and kills and before the end-of-phase grind: every raid whose
    `phaseIndexFor(raid.zone, raid.level)` is this phase, once the player's level >= raid.minLevel and the raid's unlock
    quest is done in the sim's progress (evalCondition(RAID_UNLOCK, ...) as the sim does for other conditions), is cleared
    raidClears times. Each clear: raidMinutes/60 hours (a new `raidHours` bucket that counts in the phase's hours), XP
    raidClearXp(raid.level, current level) through the same XP grant the sim uses for kills (so levels rise), coins
    raidClearGold(raid.level) plus the expected sale of drops (sum of ITEMS[drop].value / 2 x RAID_TUNING.dropChance).
    No skill uses, no gear from raids (the sim's kit stays shop-based).
  - EconomyPhaseReport: `raidHours`, `raidXp`, `raidXpPerHour`, `contentXpPerHour` (quest + kill XP over quest + kill hours).
  - New flag `RAID_FARM`: raidXpPerHour > ECONOMY_TARGETS.raidXpPerHourMax (new, 1.25) x contentXpPerHour. Add it to
    EconomyFlagCode and to the failing set and MARGIN_FLAGS.
- scripts/sim-economy.mjs: two columns in the per-phase table: `raid h` and `raid xp/h vs content`.
- Run, from the repo root: `npm run sim:economy -w games/gnomes-of-gnomomia -- --check` and
  `npm run sim:economy -w games/gnomes-of-gnomomia -- --check --cap=70`. If any flag fires, change ONLY ECONOMY.raid in
  src/data/economy.ts (clearXpKills, clearGold) and re-run until none does. Do not change other ECONOMY numbers.
- Regenerate the golden: `UPDATE_GOLDEN=1 npm test -w games/gnomes-of-gnomomia -- src/sim/economy.test.ts`, review the diff
  (only raid-driven changes: hours, levels per phase, coins), then run the test again without UPDATE_GOLDEN.
- Farm numbers: run `npm run sim:economy -w games/gnomes-of-gnomomia -- --farm=water-beetle@8` and
  `-- --farm=water-beetle@8,assist=3,hours=2` and copy both blocks into the doc.
- docs/design/gnomomia/economy.md: a new section "Raids and kill credit (round 3)": the kill-credit fix (AI gnomes' kills
  used to pay the player in full; now only enemies the player hit pay), the two farm blocks (before = assist 3, after =
  solo), the raid model (raidClears, raidMinutes, the clear formulas, ECONOMY.raid values), the RAID_FARM flag, and a
  per-phase table for the warden: hours, levels, raid hours, raid XP/h vs content XP/h. Note what is not modelled (drops
  as gear, deaths in raids).

## Contract
No change to runEconomy's signature or to other flags' meaning. ECONOMY.raid keeps its four keys.

## Done when
- `npm run sim:economy -w games/gnomes-of-gnomomia -- --check` exits 0.
- `npx vitest run src/sim/economy.test.ts src/sim/farm.test.ts` (in the game folder) passes.

## Out of scope
src/data/raidTuning.ts, src/data/packs/*, src/sim/arena.ts, quest rewards and every other economy number.
~~~~

### 4B: Raid clear times into the 2-3 minute band

~~~~text
Epic: 4 Re-simulate and tune
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (git worktree). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Game: games/gnomes-of-gnomomia. Another worker is changing the economy sim
(src/sim/economy.ts, src/data/economy.ts) at the same time: do not touch those. Do not commit.

## Goal
Every raid, for every class, clears in 2-3 minutes with its three helpers (median, TacticalPlayer, sprouted zone gear)
and is won at least 80% of the time, with numbers in tuning files only. A test keeps it there.

## Read first
- games/gnomes-of-gnomomia/src/data/raidTuning.ts (RAID_TUNING: bossHpNormals, addHpNormals, helper.*, targetSeconds).
- games/gnomes-of-gnomomia/src/sim/raidScenarios.ts (runRaidSims, RaidSimRow) and scripts/sim-raid.mjs (flags).
- One raid pack, e.g. games/gnomes-of-gnomomia/src/data/packs/raid-keep.ts (waves, boss moves).
- docs/design/gnomomia/raids.md ("Tuning results" section to fill).

## Change
- Run `npm run sim:raid -w games/gnomes-of-gnomomia -- --seeds=30` and record the table.
- Tune in this order, re-running after each change:
  1. Global, in src/data/raidTuning.ts: bossHpNormals and addHpNormals for the clear time; helper.hitNormals,
     helper.hpNormals, helper.healNormals for the win rate.
  2. Per raid, only if one raid is out of band when the others are in: in its pack, the wave `count`/`at` values and
     boss move `every` values. Never change ids, level, minLevel, drops, coordinates or recipes.
  Aim for medians near 150 s for all three classes; a class far off the others is worth reporting, not hiding.
- New src/sim/raid.test.ts: for each RAIDS id and each class, `runRaidSims(8, [id], [classId])` -> winRate >= 0.75 and
  medianSeconds within [110, 190] (looser than the CLI's band, for 8 seeds). Give it a generous timeout (e.g. 120 s).
- docs/design/gnomomia/raids.md: fill "Tuning results" with the final table (raid, class, win %, median s) and the final
  RAID_TUNING values that changed (before -> after).

## Done when
- `npm run sim:raid -w games/gnomes-of-gnomomia -- --check --seeds=30` exits 0.
- `npx vitest run src/sim/raid.test.ts src/raidContent.test.ts src/sim/balance.test.ts` (in the game folder) passes.

## Out of scope
src/sim/economy.ts, src/data/economy.ts, src/sim/arena.ts (report an arena bug instead of working around it), item stats.
~~~~
