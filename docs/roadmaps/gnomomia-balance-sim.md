# Roadmap: Gnomes of Gnomomia — Gameplay & Balance Simulation Agents

Goal: Build the headless combat simulation framework, behavioral strategy agents, quantitative balance test suite (`npm test -w games/gnomes-of-gnomomia`), and development-time CLI balance reporter (`npm run sim -w games/gnomes-of-gnomomia`) described in [docs/design/gnomomia/balance-sim.md](../design/gnomomia/balance-sim.md), while fixing the seven existing combat/talent/stat wiring gaps so the live game and the simulator run the exact same rules.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written by planner) | `package.json` adds `vitest`, `"test": "vitest run"`, `"sim": "node scripts/sim-balance.mjs"`; `src/sim/types.ts` defines all contracts; stubs exist for `src/sim/{loadout,arena,agents,scenarios,runner}.ts`; `npm run build -w games/gnomes-of-gnomomia` passes | 0 (planner) |
| 2. Combat Wiring & Sim Engine | Live combat rules (`state.ts`, `rules.ts`, `combat.ts`, `abilities.ts`, `bossmoves.ts`) wire passive talents, item stats, weapon swing times, DoT power, boss mitigation, and injectable `rng`; all 5 `src/sim/*.ts` modules implemented; `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes | 5, parallel |
| 3. Quantitative Tests & Agent CLI | `npm test -w games/gnomes-of-gnomomia` passes all subsystem liveness, curve invariant, strategy counter-example, and class parity tests; `npm run sim -w games/gnomes-of-gnomomia` prints the zone/class/boss report and exits 0 | 2, parallel |

## File ownership (collision check)

| Epic | Issue → files owned |
|---|---|
| 1 (planner) | `games/gnomes-of-gnomomia/package.json` · `src/sim/types.ts` · stubs for `src/sim/{loadout,arena,agents,scenarios,runner}.ts` |
| 2 | **2.1** `src/state.ts` `src/rules.ts` `src/combat.ts` `src/abilities.ts` `src/bossmoves.ts` · **2.2** `src/sim/loadout.ts` · **2.3** `src/sim/arena.ts` · **2.4** `src/sim/agents.ts` · **2.5** `src/sim/scenarios.ts` `src/sim/runner.ts` |
| 3 | **3.1** `src/sim/balance.test.ts` · **3.2** `scripts/sim-balance.mjs` |

No file is touched by more than one issue inside an epic. Every worker check in Epic 2 is `npx tsc --noEmit -p games/gnomes-of-gnomomia` (no output folder, no server port).

---

## Epic 1: Foundation (written directly by the planner before launching Epic 2)

1. **`games/gnomes-of-gnomomia/package.json`**:
   - Add `"test": "vitest run"` and `"sim": "node scripts/sim-balance.mjs"` to `"scripts"`.
   - Add `"vitest": "5.1.0"` to `"devDependencies"` (already hoisted in root `node_modules`).
2. **`games/gnomes-of-gnomomia/src/sim/types.ts`**:
   Write the shared contract verbatim:

```ts
import type {
  AbilityDef, ClassId, DamageType, EnemyDef, EquipSlot, OutdoorZoneId, StatusId,
} from '../config';
import type { GameState } from '../state';

export const SIM_STEP_S = 0.1;

export type GearTier = 'naked' | 'undergeared' | 'zone-plain' | 'zone-sprouted' | 'zone-bis';
export type BuildPreset =
  | 'classless'
  | 'shieldwall' | 'lawnwrecker'
  | 'deadeye'    | 'beastwarden'
  | 'sunburst'   | 'groundskeeper';

export type AmmoKind = 'pebbles' | 'thorns' | 'burr' | 'ember' | 'rust';

export interface LoadoutSpec {
  level: number;
  classId?: ClassId | null;
  build?: BuildPreset | Record<string, number>;
  gearTier?: GearTier;
  equipmentOverrides?: Partial<Record<EquipSlot, string | null>>;
  skillFill?: number;
  ammo?: AmmoKind;
  potions?: { heal?: string; healCount?: number; mana?: string; manaCount?: number };
  allies?: readonly string[];
}

export type ScenarioKind = 'duel' | 'pack' | 'gauntlet' | 'defend' | 'boss';

export interface EnemySpawnSpec {
  enemyId: string;
  count?: number;
  distance?: number;
  angleSpread?: number;
  spawnAtSeconds?: number;
}

export interface ScenarioSpec {
  id: string;
  name: string;
  kind: ScenarioKind;
  zone?: OutdoorZoneId;
  waves: readonly EnemySpawnSpec[];
  restBetweenWavesSeconds?: number;
  defendRadius?: number;
  defendSeconds?: number;
  maxSeconds?: number;
  mechanic?: 'vesh-leeches' | 'gromwell-flood' | 'kiln-kneel' | 'magpie-flee' | 'sun-only';
}

export interface SimTelegraph {
  id: number;
  moveId: string;
  moveName: string;
  kind: 'ring' | 'cone' | 'lane' | 'pool' | 'vanish';
  cx: number;
  cz: number;
  dir: number;
  radius: number;
  length: number;
  width: number;
  age: number;
  duration: number;
  damageMult: number;
  status?: StatusId;
  statusSeconds?: number;
  enemyDef: EnemyDef;
}

export interface SimEnemyView {
  readonly id: number;
  readonly defId: string;
  readonly def: EnemyDef;
  readonly x: number;
  readonly z: number;
  readonly dist: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly statuses: ReadonlySet<StatusId>;
}

export interface SimObservation {
  readonly time: number;
  readonly state: Readonly<GameState>;
  readonly hp: number;
  readonly maxHp: number;
  readonly mp: number;
  readonly maxMp: number;
  readonly resource: { kind: 'grit' | 'focus' | 'mana'; value: number; max: number };
  readonly x: number;
  readonly z: number;
  readonly statuses: ReadonlySet<StatusId>;
  readonly weaponReach: number;
  readonly isRanged: boolean;
  readonly swingReady: boolean;
  readonly spellReady: boolean;
  readonly readyAbilities: readonly AbilityDef[];
  readonly enemies: readonly SimEnemyView[];
  readonly telegraphs: readonly SimTelegraph[];
  readonly defendRadius?: number;
}

export type SimAction =
  | { type: 'attack'; targetId: number; move?: { x: number; z: number } }
  | { type: 'cast'; spell: 'flare' | 'mend'; targetId?: number; move?: { x: number; z: number } }
  | { type: 'ability'; abilityId: string; targetId?: number; move?: { x: number; z: number } }
  | { type: 'potion'; kind: 'heal' | 'mana'; move?: { x: number; z: number } }
  | { type: 'move'; x: number; z: number }
  | { type: 'wait' };

export interface PolicyTraits {
  id: string;
  name: string;
  posture: 'melee' | 'stand' | 'kite' | 'cautious';
  telegraphDodge: number;
  reactionSeconds: number;
  healThreshold: number;
  potionThreshold: number;
  rotation: 'auto-only' | 'greedy-dps' | 'tactical' | 'defensive-first';
  targetPriority: 'boss-first' | 'adds-first' | 'lowest-hp' | 'nearest';
  respectObjectives: boolean;
}

export interface AgentPolicy {
  readonly id: string;
  readonly name: string;
  readonly traits: PolicyTraits;
  decide(obs: SimObservation, rng: () => number): SimAction;
}

export type DeathCause =
  | 'none'
  | 'auto-attack'
  | `telegraph:${string}`
  | `adds:${string}`
  | `dot:${StatusId}`
  | 'timeout'
  | 'defend-ringout'
  | 'mechanic';

export interface SimRunResult {
  seed: number;
  won: boolean;
  durationSeconds: number;
  hpRemainingPct: number;
  mpRemainingPct: number;
  playerHitsLanded: number;
  playerMisses: number;
  playerCrits: number;
  potionsUsed: number;
  wentOom: boolean;
  telegraphsSpawned: number;
  telegraphsDodged: number;
  telegraphsHit: number;
  damageDealtBySource: Record<string, number>;
  damageTakenBySource: Record<string, number>;
  deathCause: DeathCause;
}

export type DiagnosticTag =
  | 'OVERTUNED'
  | 'UNDERTUNED'
  | 'FACE_TANKABLE_BOSS'
  | 'PASSIVE_STALL_WIN'
  | 'NO_KITE_BENEFIT'
  | 'HIGH_OOM_RATE';

export interface BalanceDiagnostic {
  tag: DiagnosticTag;
  message: string;
}

export interface SimSummary {
  scenarioId: string;
  loadoutLabel: string;
  policyId: string;
  runs: number;
  winRate: number;
  medianTtkSeconds: number;
  hpRemainingPct: { p10: number; p50: number; p90: number };
  playerHitsLanded: { p50: number };
  potionsUsedAvg: number;
  oomRate: number;
  telegraphDodgeRate: number;
  damageDealtShare: Record<string, number>;
  damageTakenShare: Record<string, number>;
  deathCauses: Record<string, number>;
  diagnostics: readonly BalanceDiagnostic[];
}
```

3. **Stubs**: Create `src/sim/loadout.ts`, `src/sim/arena.ts`, `src/sim/agents.ts`, `src/sim/scenarios.ts`, and `src/sim/runner.ts` exporting their final function signatures (documented in Epic 2 issues below).

---

## Epic 2: Combat Wiring & Simulation Engine (5 Parallel Issues)

### 2.1 Wire passive talents, item stats, weapon swing speeds, ability scaling, DoTs, and injectable RNG

~~~~text
Epic: 2 (Combat Wiring & Sim Engine), issue 2.1: Wire combat formulas, talents, item stats, and RNG
Depends on: none

## Environment
Work only in the git worktree for Gnomes of Gnomomia.
If node is not found in Git Bash: export PATH="/c/Program Files/nodejs:$PATH".
Game: games/gnomes-of-gnomomia (Vite + TypeScript + three.js 0.187).
Four other workers are editing files under src/sim/ at the same time. Change ONLY:
- games/gnomes-of-gnomomia/src/state.ts
- games/gnomes-of-gnomomia/src/rules.ts
- games/gnomes-of-gnomomia/src/combat.ts
- games/gnomes-of-gnomomia/src/abilities.ts
- games/gnomes-of-gnomomia/src/bossmoves.ts
Do not touch any other file. Do not run vite build or start servers, do not git commit.

## Goal
Close the 7 drift gaps between docs/design/gnomomia/combat.md + classes.md and the live code so that item stats,
passive talents, weapon swing speeds, active ability scaling, damage-over-time statuses, and boss move mitigation all
work in both the live game and deterministic simulations.

## Read first
- docs/design/gnomomia/combat.md (§2-10) and docs/design/gnomomia/classes.md
- games/gnomes-of-gnomomia/src/state.ts
- games/gnomes-of-gnomomia/src/rules.ts
- games/gnomes-of-gnomomia/src/combat.ts
- games/gnomes-of-gnomomia/src/abilities.ts
- games/gnomes-of-gnomomia/src/bossmoves.ts

## Change
1. `src/rules.ts`:
   - Add `export function mulberry32(seed: number): () => number` (standard 32-bit seeded PRNG returning 0..1).
   - Add `export function weaponSwingSeconds(item: ItemDef | null): number`:
     - If `!item`: `2.0`.
     - If `item.weaponClass === 'blowpipe'`: `1.6`.
     - If `item.weaponClass === 'sling'`: `2.2`.
     - If `item.hands === 2`: `2.8`.
     - Otherwise: `2.0`.

2. `src/state.ts`:
   - Add `export function equippedStat(key: StatKey, s: GameState = state): number` that sums `ITEMS[id]?.stats?.[key] ?? 0` across all equipped slots in `s.equipment`.
   - Add `export function effectiveAttribute(attr: Attribute, s: GameState = state): number` returning `s.attributes[attr] + equippedStat(attr, s)`.
   - Update `maxHp(s: GameState = state)`:
     - Use `effectiveAttribute('endurance', s)` instead of `s.attributes.endurance`.
     - Apply Warden `Thick Clay` talent (`s.talents['warden-thick-clay'] ?? 0`, `+4%` max HP per rank): multiply by `1 + 0.04 * (s.talents['warden-thick-clay'] ?? 0)`.
   - Update `maxMp(s: GameState = state)`:
     - Use `effectiveAttribute('intelligence', s)` instead of `s.attributes.intelligence`.

3. `src/abilities.ts`:
   - Update `PassiveCtx` to `{ type?: DamageType; twoHanded?: boolean; shield?: boolean; ranged?: boolean; weaponClass?: ItemDef['weaponClass'] }`.
   - Update `PASSIVES`:
     - `'slinger-hard-acorns'`: add `when: (c) => c.ranged === true`.
     - `'slinger-quick-breath'`: add `when: (c) => c.weaponClass === 'blowpipe'`.
   - Update `strike(ab: AbilityDef, target: Entity)`:
     - When `ab.power !== undefined`:
       - If `ab.kind === 'spell'` or `state.classId === 'mage'`: base damage is scaled from `Flare` at the player's current Flare rank `lr` (`1.5 * (3 + 2 * lr) * ab.power * power(effectiveAttribute('intelligence')) * (1 + damageFromSkill(state.skills[school].level)) * (1 + ( talentBonus('damagePct', { type }) + equippedStat(type === 'sun' ? 'sunDamage' : 'rainDamage') ) / 100)`), multiplied by `typeMultiplier(type, def.family)` and `1 - wardOf(def, school)`.
       - Otherwise (physical attack ability): base is `w.avg * ab.power * power(effectiveAttribute(primaryAttr)) * (1 + damageFromSkill(skillLevel)) * (1 + talentBonus('damagePct', ctx) / 100) * typeMultiplier(type, def.family) * (1 - enemyMitigation(def, v.id))`.
   - When applying a DoT status (`chipped`, `poisoned`, `burning`) in `strike()` or traps:
     - Pass a non-zero `power` (damage per second) to `applyStatus(v.id, ab.status, duration, dotPower)`:
       - For `trim` / `chipped`: `(w.avg * 0.8 * power(effectiveAttribute('strength')) * (1 + 0.15 * talentRank('warden-deep-cuts'))) / 6`.
       - For `poisoned`: `(w.avg * 0.4 * power(effectiveAttribute('agility')) * (1 + 0.15 * talentRank('slinger-creeping-rot'))) / 6`.
       - For `burning`: `(flareBase * 0.4) / 4`.
   - Export `export function resetAbilitiesState(): void` (clears `grit = 0`, `focus = 0`, `sinceCombat = Infinity`, `cooldowns`, `traps.length = 0`) so headless simulations start clean.

4. `src/combat.ts`:
   - Add `let combatRng: () => number = Math.random; export function setCombatRng(rng: () => number): void { combatRng = rng; }` and use `combatRng()` instead of `Math.random()` throughout `combat.ts`.
   - Export `export function resetCombatState(): void` (clears `statuses`, `effects`, `deadTimer = 0`, `hpAcc = 0`, `mpAcc = 0`, `oocAcc`, `quietFor = 999`, `swingTimer = 0`, `cooldown = 0`).
   - In `swing(e)`:
     - Set `swingTimer = weaponSwingSeconds(weapon) * (1 + talentBonus('swingPct', { twoHanded: weapon?.hands === 2, weaponClass: weapon?.weaponClass }) / 100)`.
     - Include `equippedStat('accuracy')` in `accuracy`.
     - Include `effectiveAttribute(primaryAttribute(ranged))` in `power(...)`.
     - Include `1 + talentBonus('damagePct', { type, twoHanded: weapon?.hands === 2, ranged }) / 100`.
     - If `hasStatus(e.id, 'marked')`, multiply damage by `1.10`.
     - If `talentRank('warden-bedrock') > 0 && (hasStatus(e.id, 'staggered') || hasStatus(e.id, 'stunned') || hasStatus(e.id, 'slowed'))`, multiply damage by `1 + 0.08 * talentRank('warden-bedrock')`.
     - Crit multiplier: `2 + (talentBonus('critDamagePct') + equippedStat('critDamage')) / 100`.
     - If `ranged && talentRank('slinger-nettle-darts') > 0 && combatRng() < 0.08 * talentRank('slinger-nettle-darts')`, apply `'poisoned'` for 6 s with DoT power.
   - In `playerDefense()`:
     - Include `equippedStat('defense')` and `talentBonus('defense', { shield: shieldEquipped() })`, still capped at `DEFENSE_CAP` (6).
   - In `playerMitigation(attackerLevel)`:
     - Include `talentBonus('reductionPct') / 100`, capped at `MITIGATION_CAP` (0.6).
   - In `enemyAttack(e)`:
     - On a miss while `shieldEquipped() && talentRank('warden-spiked-lid') > 0`, deal `weaponAverage().avg * 0.15 * talentRank('warden-spiked-lid')` crush damage back to `e.id`.
   - In `castSpell(spell)`:
     - Apply `talentBonus('damagePct', { type: sp.school })` and `equippedStat('sunDamage' | 'rainDamage')` to `flare`.
     - Apply `1 + (talentBonus('healingPct') + equippedStat('bloomHealing')) / 100` to `mend`.
     - Apply `warden-quick-snips` / `mage-long-day` (`-0.2 * talentRank('mage-long-day')` to Flare cooldown, `1 - 0.05 * talentRank('mage-dry-spell')` to Sun mana cost).

5. `src/bossmoves.ts`:
   - In `hitPlayer(def, move)`: apply physical mitigation (`1 - playerMitigation(def.level)`) when `def.damageType` is physical (`slash`, `crush`, `pierce`), or ward mitigation for magic types, before calling `dealDamage`. If `move.status` is a DoT (`poisoned`, `burning`, `chipped`), pass `power = Math.max(1, avg * 0.25)` to `applyStatus`.

## Contract
Keep all existing exports of `state.ts`, `rules.ts`, `combat.ts`, `abilities.ts`, `bossmoves.ts`.
Add the new exports:
- `src/rules.ts`: `mulberry32(seed: number): () => number`, `weaponSwingSeconds(item: ItemDef | null): number`
- `src/state.ts`: `equippedStat(key: StatKey, s?: GameState): number`, `effectiveAttribute(attr: Attribute, s?: GameState): number`
- `src/combat.ts`: `setCombatRng(rng: () => number): void`, `resetCombatState(): void`, `playerMitigation(attackerLevel: number): number`
- `src/abilities.ts`: `resetAbilitiesState(): void`

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes with 0 errors in your 5 files.

## Out of scope
All files under `src/sim/`, `src/data/`, `src/ui/`, and `scripts/`.
~~~~

### 2.2 Loadout & Progression Snapshot Builder (`src/sim/loadout.ts`)

~~~~text
Epic: 2 (Combat Wiring & Sim Engine), issue 2.2: Loadout & progression snapshot builder
Depends on: none

## Environment
Work only in the git worktree for Gnomes of Gnomomia.
If node is not found in Git Bash: export PATH="/c/Program Files/nodejs:$PATH".
Game: games/gnomes-of-gnomomia.
Four other workers are editing other files at the same time. Change ONLY:
- games/gnomes-of-gnomomia/src/sim/loadout.ts
Do not run vite build or start servers, do not git commit.

## Goal
Implement `src/sim/loadout.ts` so `buildLoadout(spec)` deterministically creates a level-appropriate `GameState` for any
character level (1..30), class, talent preset (`shieldwall`, `lawnwrecker`, `deadeye`, `beastwarden`, `sunburst`,
`groundskeeper`), gear tier (`naked`, `undergeared`, `zone-plain`, `zone-sprouted`, `zone-bis`), skill proficiency fill,
and potion stock, and `applyLoadoutToLiveState(spec)` loads it into the global `state`.

## Read first
- games/gnomes-of-gnomomia/src/sim/types.ts: `LoadoutSpec`, `GearTier`, `BuildPreset`
- games/gnomes-of-gnomomia/src/state.ts: `GameState`, `newGameState`, `state`, `maxHp`, `maxMp`
- games/gnomes-of-gnomomia/src/progression.ts: `skillCap`
- games/gnomes-of-gnomomia/src/talents.ts: `canLearn`, `learnTalent`, `chooseClass`
- games/gnomes-of-gnomomia/src/data/classes.ts: `CLASSES`, `TALENTS`, `BRANCHES`
- games/gnomes-of-gnomomia/src/content.ts: `ITEMS`
- docs/design/gnomomia/classes.md: sample builds (`shieldwall`, `lawnwrecker`, `deadeye`, `beastwarden`, `sunburst`, `groundskeeper`)

## Change
- `games/gnomes-of-gnomomia/src/sim/loadout.ts`:
  - `export function totalSkillPointsForLevel(level: number): number`:
    - `Math.max(0, level - 1)` plus chapter finale bonus points by level milestone (`level >= 6` +1, `>= 11` +1, `>= 12` +1, `>= 16` +1, `>= 20` +1, `>= 25` +1, max 35 at L30).
  - `export function buildLoadout(spec: LoadoutSpec): GameState`:
    - Start from `newGameState()`.
    - Set `s.level = spec.level`, `s.classId = spec.classId ?? (spec.level >= 5 ? 'warden' : null)`.
    - Attributes: start at 10 each, add `spec.level - 1` to every attribute, and add an extra `spec.level - 1` to the class primary attribute (`strength` if classless).
    - Skills: set every skill's level to `Math.max(5, Math.round(skillCap(spec.level) * (spec.skillFill ?? 0.85)))`.
    - Talents: if `s.classId` is set:
      - If `typeof spec.build === 'object'`, copy those ranks into `s.talents`.
      - Else resolve the branch order for the preset (`shieldwall`: `['bulwark', 'hedgecutter', 'groundbreaker']`; `lawnwrecker`: `['groundbreaker', 'hedgecutter', 'bulwark']`; `deadeye`: `['acorneer', 'thornshot', 'trapper']`; `beastwarden`: `['trapper', 'acorneer', 'thornshot']`; `sunburst`: `['sun', 'rain', 'bloom']`; `groundskeeper`: `['bloom', 'rain', 'sun']`) and spend `totalSkillPointsForLevel(spec.level)` points tier-by-tier in branch order, respecting `TIER_GATE` and at most 2 tier-6 capstones.
    - Equipment (`selectEquipment(s.classId, spec.level, spec.gearTier ?? 'zone-plain')`):
      - `'naked'`: all slots `null`.
      - Otherwise target max `ilvl = spec.gearTier === 'undergeared' ? Math.max(1, spec.level - 4) : spec.level`.
      - Allowed rarities: `'zone-plain'` -> `['plain']`; `'undergeared'` -> `['plain']`; `'zone-sprouted'` -> `['plain', 'sprouted', 'blooming']`; `'zone-bis'` -> `['plain', 'sprouted', 'blooming', 'heirloom', 'kilnfired']`.
      - Pick the best-scoring valid item in `ITEMS` for each `EquipSlot` matching class weapon/armor rules (`warden`: melee/shield/plate/leather; `slinger`: sling/blowpipe/leather; `mage`: staff/wand/cloth; `lawnwrecker` prefers `hands === 2`, `shieldwall` prefers `hands === 1` + `shield` offhand). If a two-handed weapon is equipped, set `offhand: null`.
      - Apply `spec.equipmentOverrides` on top.
    - Hotbar: slots 0-1 are `['flare', 'mend']`, slots 2..7 filled with learned non-passive abilities of `s.classId`.
    - Potions: add `spec.potions` to `s.inventory` (or default for level if omitted: 2 healing potions of the tier matching `spec.level`: `'red-potion'` L1-9, `'c3-rose-draught'` or fallback `'red-potion'` L10-19, `'ruby-draught'` or fallback `'red-potion'` L20+).
    - Set `s.hp = maxHp(s)` and `s.mp = maxMp(s)`.
  - `export function applyLoadout(spec: LoadoutSpec): GameState`: builds the loadout and copies it into the live `state` (`Object.assign(state, built)`).
  - `export function formatLoadoutLabel(spec: LoadoutSpec): string`: concise human-readable label, e.g. `"L6 warden/shieldwall (zone-plain)"`.

## Contract
```ts
export function totalSkillPointsForLevel(level: number): number;
export function buildLoadout(spec: LoadoutSpec): GameState;
export function applyLoadout(spec: LoadoutSpec): GameState;
export function formatLoadoutLabel(spec: LoadoutSpec): string;
```

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes with 0 errors in `src/sim/loadout.ts`.

## Out of scope
All files outside `src/sim/loadout.ts`.
~~~~

### 2.3 Headless Combat Arena (`src/sim/arena.ts`)

~~~~text
Epic: 2 (Combat Wiring & Sim Engine), issue 2.3: Headless 2D combat arena
Depends on: none

## Environment
Work only in the git worktree for Gnomes of Gnomomia.
If node is not found in Git Bash: export PATH="/c/Program Files/nodejs:$PATH".
Game: games/gnomes-of-gnomomia.
Four other workers are editing other files at the same time. Change ONLY:
- games/gnomes-of-gnomomia/src/sim/arena.ts
Do not run vite build or start servers, do not git commit.

## Goal
Implement `src/sim/arena.ts`: a deterministic, zero-WebGL 2D encounter arena that steps the player, enemies, boss
telegraphs, lingering pools, and scenario mechanics at `SIM_STEP_S = 0.1 s` using the real game rules (`combat.ts`,
`abilities.ts`, `rules.ts`, `state.ts`) and collects full combat telemetry for `SimRunResult`.

## Read first
- games/gnomes-of-gnomomia/src/sim/types.ts
- games/gnomes-of-gnomomia/src/combat.ts: `updateCombat`, `enemyAttack`, `dealDamage`, `applyStatus`, `hasStatus`, `canAct`, `speedFactor`, `spellCooldown`, `castSpell`, `setCombatRng`, `resetCombatState`, `playerMitigation`
- games/gnomes-of-gnomomia/src/abilities.ts: `updateAbilities`, `useHotbar`, `knownAbilities`, `abilityCooldown`, `resource`, `resetAbilitiesState`
- games/gnomes-of-gnomomia/src/entities.ts: `spawnEnemyAt`, `allEntities`, `getEntity`, `removeEntity`
- games/gnomes-of-gnomomia/src/player.ts: `player`
- games/gnomes-of-gnomomia/src/events.ts: `bus`

## Change
- `games/gnomes-of-gnomomia/src/sim/arena.ts`:
  - Manage a headless encounter session (`SimArena`):
    - Resets player position to `(0, 0, 0)`, clears existing live entities via `removeEntity`, calls `resetCombatState()`, `resetAbilitiesState()`, `setCombatRng(rng)`, and applies the loadout to `state`.
    - Spawns initial wave enemies (`spawnAtSeconds === 0` or undefined) at their configured distance and angle using `spawnEnemyAt` (note: `sceneRef` is `null` in headless mode, which `entities.ts` and `combat.ts` already support safely without WebGL!).
    - Subscribes a listener on `bus` (`'hit'`, `'miss'`, `'cast'`, `'player-died'`) during the run to record:
      - `playerHitsLanded`, `playerMisses`, `playerCrits`
      - `damageDealtBySource` (auto attack, spell id, ability id, or DoT status)
      - `damageTakenBySource` (`${enemyDefId}:auto`, `telegraph:${moveId}`, `adds:${enemyDefId}`, `dot:${status}`)
      - `lastDamageSource` so if the player dies, `deathCause` is accurately attributed.
    - Tracks boss move timers (`def.moves`) and active `SimTelegraph` entries (`ring`, `cone`, `lane`, `pool`, `vanish`, `summon`, `pull`, `buff`), exposing them in `observeArena()` so `AgentPolicy` can see and dodge telegraphs, and resolving them when `age >= duration` using the exact geometry tests from `bossmoves.ts` (`inDisc`, `inCone`, `inLane`).
    - Implements scenario mechanics when `scenario.mechanic` is set:
      - `'vesh-leeches'`: every 20 s spawns a brood leech 10 m from Mother Vesh that walks toward her; if it reaches within 1.5 m of her, heals her 12% max HP and despawns.
      - `'gromwell-flood'`: once Gromwell drops below 30% HP, a 25 s room-flood timer starts; if he is still alive after 25 s, the player dies with `deathCause = 'mechanic'`.
      - `'kiln-kneel'`: when the Kiln Warden reaches `<= 10%` HP, the fight ends in victory immediately.
      - `'magpie-flee'`: if a magpie-thief is below 20% HP for more than 4 s without dying, it flees (`deathCause = 'mechanic'`).
    - Gauntlet wave progression: when all enemies of the current wave die and more waves remain, steps `restBetweenWavesSeconds` of quiet out-of-combat time (`updateCombat`, `updateAbilities`) before spawning the next wave.
    - Defend circle check: if `scenario.defendRadius` is set and `Math.hypot(player.position.x, player.position.z) > scenario.defendRadius + 6` for `> 5 s`, the run ends with `won = false, deathCause = 'defend-ringout'`.

## Contract
```ts
export interface SimArena {
  readonly scenario: ScenarioSpec;
  observe(): SimObservation;
  step(action: SimAction, dt?: number): void;
  isDone(): boolean;
  result(seed: number): SimRunResult;
  dispose(): void;
}

export function createArena(scenario: ScenarioSpec, loadout: LoadoutSpec, seed: number): SimArena;
```

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes with 0 errors in `src/sim/arena.ts`.

## Out of scope
All files outside `src/sim/arena.ts`.
~~~~

### 2.4 Behavioral Strategy Agents (`src/sim/agents.ts`)

~~~~text
Epic: 2 (Combat Wiring & Sim Engine), issue 2.4: Behavioral strategy agents and personas
Depends on: none

## Environment
Work only in the git worktree for Gnomes of Gnomomia.
If node is not found in Git Bash: export PATH="/c/Program Files/nodejs:$PATH".
Game: games/gnomes-of-gnomomia.
Four other workers are editing other files at the same time. Change ONLY:
- games/gnomes-of-gnomomia/src/sim/agents.ts
Do not run vite build or start servers, do not git commit.

## Goal
Implement `src/sim/agents.ts`: the `makePolicy(traits)` strategy engine and the 5 canonical player personas
(`TacticalPlayer`, `GreedyBerserker`, `PassiveTurtler`, `FaceTanker`, `KitingRanger`) so balance tests can declaratively
simulate how passive, aggressive, casual, tactical, and kiting players perform in any scenario.

## Read first
- games/gnomes-of-gnomomia/src/sim/types.ts: `PolicyTraits`, `AgentPolicy`, `SimObservation`, `SimAction`, `SimTelegraph`
- docs/design/gnomomia/balance-sim.md: §3.3 (PolicyTraits and the 5 canonical personas)
- docs/design/gnomomia/classes.md: class abilities and combos (Soak + Sun, Stagger/Slow + Bedrock, Sunder/Crack, Aimed Shot, Scramble, Puddle Step, Root Snare, Burr Trap)

## Change
- `games/gnomes-of-gnomomia/src/sim/agents.ts`:
  - `export function makePolicy(overrides: Partial<PolicyTraits> & { id: string; name: string }): AgentPolicy`:
    Builds an `AgentPolicy` whose `decide(obs, rng)` evaluates in priority order:
    1. **Telegraph Evasion**: If an active telegraph in `obs.telegraphs` has `age >= traits.reactionSeconds` and currently covers `(obs.x, obs.z)`, and a deterministic per-telegraph roll (`((telegraph.id * 2654435761) >>> 0) / 4294967296 < traits.telegraphDodge`) succeeds, compute the shortest safe point outside the telegraph (while staying inside `obs.defendRadius` if `traits.respectObjectives` is true) and attach `move: { x, z }` (or return `{ type: 'move', x, z }` if rooted/casting is not possible).
    2. **Emergency Potion**: If `obs.hp / obs.maxHp < traits.potionThreshold`, return `{ type: 'potion', kind: 'heal', move }`. If `obs.resource.kind === 'mana' && obs.mp / obs.maxMp < traits.potionThreshold`, return `{ type: 'potion', kind: 'mana', move }`.
    3. **Self-Heal / Mitigation**: If `obs.hp / obs.maxHp < traits.healThreshold`:
       - Use ready heal/absorb abilities (`second-wind`, `last-stand`, `thick-glaze`, `thin-glaze`, `fairy-ring`) or cast `'mend'` if mana suffices.
    4. **Target Selection**: Pick `target` from `obs.enemies` according to `traits.targetPriority`:
       - `'adds-first'`: non-boss enemies (`def.rank !== 'boss' && def.rank !== 'final' && def.rank !== 'worldboss'`) first, lowest HP tie-breaker.
       - `'boss-first'`: boss rank first, else nearest.
       - `'lowest-hp'`: minimum `e.hp`.
       - `'nearest'`: minimum `e.dist`.
    5. **Positioning (`move`)**:
       - `'kite'` (or `'TacticalPlayer'` when `obs.isRanged || obs.state.classId === 'mage'`): if nearest enemy is within `3.2 m` (and especially `< 2.0 m` for Slinger), use mobility/root abilities (`scramble`, `puddle-step`, `pinning-shot`, `root-snare`, `burr-trap`) or step away along the vector from the nearest enemy toward `desiredRange = Math.min(obs.weaponReach - 1, 10)` (clamped to `obs.defendRadius` when `respectObjectives` is true).
       - `'cautious'`: if `obs.hp / obs.maxHp < traits.healThreshold`, kite away while healing; otherwise approach to weapon reach.
       - `'melee'` / `'stand'`: step within `obs.weaponReach - 0.2`.
    6. **Rotation (`rotation`)**:
       - `'auto-only'`: for mage, cast `'flare'` when ready, else `{ type: 'attack', targetId: target.id, move }`.
       - `'defensive-first'`: keep defensive/control abilities (`shield-slam`, `challenge`, `sod-buster`, `hailstone`, `root-snare`, `thin-glaze`, `thick-glaze`) on priority; only spend offensive resources when resource `> 70%`.
       - `'greedy-dps'`: fire highest `power` offensive ability on cooldown (`gnome-smash`, `topiary`, `bash`, `trim`, `bullseye`, `aimed-shot`, `pebble-spray`, `volley`, `heatwave`, `sunbeam`, `flare`), ignoring status setups or defensive buffs.
       - `'tactical'`:
         - Apply debuffs/setups first (`sunder` / `mark-quarry` if target lacks `'cracked'` / `'marked'`; `drizzle` / `downpour` if target lacks `'soaked'` before `sunbeam` / `heatwave` / `flare`; `bash` / `shield-slam` / `sod-buster` to trigger Stagger/Stun/Slow before heavy hits).
         - Use AoE abilities (`topiary`, `sod-buster`, `pebble-spray`, `volley`, `thistle-volley`, `downpour`, `heatwave`) when `>= 2` enemies are within `5 m`.
         - Otherwise fire highest-value ready class ability or `flare` (for mage) or `{ type: 'attack', targetId: target.id, move }`.
  - Export the 5 canonical policies in `POLICIES`:
    - `TacticalPlayer`
    - `GreedyBerserker`
    - `PassiveTurtler`
    - `FaceTanker`
    - `KitingRanger`

## Contract
```ts
export function makePolicy(overrides: Partial<PolicyTraits> & { id: string; name: string }): AgentPolicy;
export const TacticalPlayer: AgentPolicy;
export const GreedyBerserker: AgentPolicy;
export const PassiveTurtler: AgentPolicy;
export const FaceTanker: AgentPolicy;
export const KitingRanger: AgentPolicy;
export const POLICIES: Record<string, AgentPolicy>;
```

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes with 0 errors in `src/sim/agents.ts`.

## Out of scope
All files outside `src/sim/agents.ts`.
~~~~

### 2.5 Scenario Catalog & Monte Carlo Runner (`src/sim/scenarios.ts`, `src/sim/runner.ts`)

~~~~text
Epic: 2 (Combat Wiring & Sim Engine), issue 2.5: Scenario catalog, Monte Carlo runner, and diagnostics
Depends on: none

## Environment
Work only in the git worktree for Gnomes of Gnomomia.
If node is not found in Git Bash: export PATH="/c/Program Files/nodejs:$PATH".
Game: games/gnomes-of-gnomomia.
Four other workers are editing other files at the same time. Change ONLY:
- games/gnomes-of-gnomomia/src/sim/scenarios.ts
- games/gnomes-of-gnomomia/src/sim/runner.ts
Do not run vite build or start servers, do not git commit.

## Goal
1. Populate `src/sim/scenarios.ts` with the benchmark encounter catalog spanning Chapters 1-8 (normal duels, pack pulls,
   dungeon gauntlets, hold-the-circle defences, and all major bosses).
2. Implement `src/sim/runner.ts` (`runScenario`, `runMonteCarlo`, `diagnoseSummary`, `formatSummaryTable`) to execute
   seeded simulations and compute statistical summaries and diagnostic flags.

## Read first
- games/gnomes-of-gnomomia/src/sim/types.ts
- games/gnomes-of-gnomomia/src/sim/arena.ts (signature from Contract)
- games/gnomes-of-gnomomia/src/sim/loadout.ts (signature from Contract)
- games/gnomes-of-gnomomia/src/content.ts (`ENEMIES` ids across packs)
- docs/design/gnomomia/bestiary.md and docs/design/gnomomia/balance-sim.md

## Change
1. `games/gnomes-of-gnomomia/src/sim/scenarios.ts`:
   - Define `SCENARIOS: Record<string, ScenarioSpec>` and `SCENARIO_LIST: readonly ScenarioSpec[]` covering every zone:
     - **Mossbottom (L1-6)**: `mb-slug-duel` (L1 slug), `mb-feral-duel` (L3 feral-gnome), `mb-feral-pack` (2x feral-gnome), `mb-brute-elite` (L4 feral-brute), `mb-beetle-duel` (L4 beetle), `boss-mole-king` (L6 `mole-king`).
     - **Thatchford (L6-11)**: `tf-ford-defend` (`defend`, 3 waves of `water-beetle`, 60 s, radius 6), `tf-magpie-trial` (L8 `magpie-thief`, `mechanic: 'magpie-flee'`), `tf-sprite-trial` (L7 `muck-sprite`), `boss-rotgut` (L11 `c2-rotgut`).
     - **Keep & Gutters (L10-12)**: `deeps-gutters-gauntlet` (3 waves of gutter rats + pipe leeches with 8 s rest), `boss-clogmaw` (L12 `c3-clogmaw`).
     - **Cloverfield (L11-16)**: `cf-mouse-pack` (3x field mouse), `cf-ant-elite` (red ant soldiers), `boss-old-gleaner` (L16 world boss).
     - **Hedgewood & Cistern (L15-20)**: `hw-weaver-elite` (L18 Weaver Below), `boss-mother-vesh` (L20 Mother Vesh, `mechanic: 'vesh-leeches'`), `boss-queen-vespa` (L20 Queen Vespa).
     - **Rockery & Backflow (L19-25)**: `rk-unfired-duel` (L23 Unfired), `boss-kiln-warden` (L24 Kiln Warden, `mechanic: 'kiln-kneel'`), `boss-gromwell` (L25 Gromwell, `mechanic: 'gromwell-flood'`).
     - **Verge & Shed (L25-30)**: `vg-edger-elite` (L27 Edger-Knight), `boss-sedgewick` (L28 High Edger Sedgewick), `boss-mower-heartspark` (L30 finale phase 3: `mower-heartspark` + `mower-rope` spawn at 70% and 35%).
   - Verify enemy ids at import time or lookup helper against `ENEMIES` from `../content`.

2. `games/gnomes-of-gnomomia/src/sim/runner.ts`:
   - `export function runScenario(scenario: ScenarioSpec, loadout: LoadoutSpec, policy: AgentPolicy, seed = 1): SimRunResult`:
     Creates the arena via `createArena(scenario, loadout, seed)`, steps `SIM_STEP_S` up to `scenario.maxSeconds ?? (scenario.kind === 'boss' ? 240 : 120)` calling `policy.decide(arena.observe(), rng)`, disposes the arena, and returns `arena.result(seed)`.
   - `export function runMonteCarlo(scenario: ScenarioSpec, loadout: LoadoutSpec, policy: AgentPolicy, opts?: { seeds?: number | readonly number[] }): SimSummary`:
     Runs `N` seeds (default `50` for tests, configurable), computes `winRate`, `medianTtkSeconds`, `hpRemainingPct` percentiles (`p10, p50, p90`), `playerHitsLanded.p50`, `potionsUsedAvg`, `oomRate`, `telegraphDodgeRate`, normalized `damageDealtShare`, `damageTakenShare`, `deathCauses`, and attaches `diagnoseSummary(...)`.
   - `export function diagnoseSummary(scenario: ScenarioSpec, loadout: LoadoutSpec, policy: AgentPolicy, summary: Omit<SimSummary, 'diagnostics'>): BalanceDiagnostic[]`:
     Evaluates the diagnostic thresholds from `docs/design/gnomomia/balance-sim.md` §3.4 (`OVERTUNED`, `UNDERTUNED`, `FACE_TANKABLE_BOSS`, `PASSIVE_STALL_WIN`, `HIGH_OOM_RATE`).
   - `export function formatSummaryTable(summaries: readonly SimSummary[]): string`:
     Formats an aligned ASCII/Markdown table for CLI output.

## Contract
```ts
// src/sim/scenarios.ts
export const SCENARIOS: Record<string, ScenarioSpec>;
export const SCENARIO_LIST: readonly ScenarioSpec[];

// src/sim/runner.ts
export function runScenario(scenario: ScenarioSpec, loadout: LoadoutSpec, policy: AgentPolicy, seed?: number): SimRunResult;
export function runMonteCarlo(
  scenario: ScenarioSpec,
  loadout: LoadoutSpec,
  policy: AgentPolicy,
  opts?: { seeds?: number | readonly number[] },
): SimSummary;
export function formatSummaryTable(summaries: readonly SimSummary[]): string;
```

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes with 0 errors in `src/sim/scenarios.ts` and `src/sim/runner.ts`.

## Out of scope
All files outside `src/sim/scenarios.ts` and `src/sim/runner.ts`.
~~~~

---

## Epic 3: Quantitative Balance Test Suite & CLI Reporter (2 Parallel Issues)

### 3.1 Quantitative Gameplay & Balance Test Suite (`src/sim/balance.test.ts`)

~~~~text
Epic: 3 (Tests & CLI), issue 3.1: Vitest gameplay & balance assertion suite
Depends on: Epic 2

## Environment
Work only in the git worktree for Gnomes of Gnomomia.
If node is not found in Git Bash: export PATH="/c/Program Files/nodejs:$PATH".
Game: games/gnomes-of-gnomomia.
One other worker is editing scripts/sim-balance.mjs at the same time. Change ONLY:
- games/gnomes-of-gnomomia/src/sim/balance.test.ts
Do not run vite build or start servers, do not git commit.

## Goal
Write `src/sim/balance.test.ts` (run by `npm test -w games/gnomes-of-gnomomia`) to verify subsystem liveness, combat.md
curve invariants, behavioral strategy counter-examples (why passive/aggressive/face-tank strategies fail specific
encounters while tactical/kiting strategies succeed), and class/build parity across levels 1-30.

## Read first
- docs/design/gnomomia/balance-sim.md (§1, §4.1)
- docs/design/gnomomia/combat.md (§4-9)
- games/gnomes-of-gnomomia/src/sim/types.ts
- games/gnomes-of-gnomomia/src/sim/loadout.ts
- games/gnomes-of-gnomomia/src/sim/agents.ts
- games/gnomes-of-gnomomia/src/sim/scenarios.ts
- games/gnomes-of-gnomomia/src/sim/runner.ts

## Change
- Create `games/gnomes-of-gnomomia/src/sim/balance.test.ts` with `describe` blocks:
  1. `describe('subsystem liveness (no-vibes wiring)')`:
     - Passive talents: learning `warden-thick-clay` r3 raises `maxHp` by 12%; `warden-keen-edge` r3 increases Slash damage dealt; `mage-kindling` r3 increases Sun spell damage; `warden-quick-snips` r3 increases swing frequency.
     - Equipped item `stats`: equipping an item with `stats: { strength: 6 }` or `{ endurance: 3 }` increases `effectiveAttribute`, `maxHp`, and melee damage dealt.
     - Weapon swing intervals: a 2-handed weapon swings slower (`2.8 s`) than a 1-handed weapon (`2.0 s`), and a blowpipe swings faster (`1.6 s`).
     - DoTs: `trim` (`chipped`) and `slinger-nettle-darts` (`poisoned`) record positive damage in `damageDealtBySource`.
     - Boss move mitigation: a plate Warden takes significantly less damage from a physical boss telegraph than a naked character of the same level.
  2. `describe('combat.md baseline curve invariants')`:
     - Across levels 1, 4, 8, 12, 16, 20, 24, 28, an on-level `TacticalPlayer` with `zone-plain` gear and `healThreshold: 0, potionThreshold: 0` defeats a same-level normal enemy with `winRate >= 0.90`, `playerHitsLanded.p50` between `3` and `8`, and `hpRemainingPct.p50` between `0.35` and `0.85`.
  3. `describe('behavioral strategy counter-examples')`:
     - **Aggressive vs Tactical on Bosses**: Against `boss-mole-king` (L6) and `boss-sedgewick` (L28), `GreedyBerserker` (`telegraphDodge: 0, healThreshold: 0, targetPriority: 'boss-first'`) has a strictly lower win rate (by `>= 0.40`) than `TacticalPlayer`, with top `deathCauses` attributed to telegraphs or adds.
     - **Passive vs Tactical on Sustain / Soft-Enrage Bosses**: Against `boss-mother-vesh` (L20, brood leech heals) and `boss-gromwell` (L25, rising water), `PassiveTurtler` fails (`winRate <= 0.35`, with `timeout`, `mechanic`, or `oom` as primary causes) while `TacticalPlayer` achieves `winRate >= 0.70`.
     - **Kiting vs Face-Tanking for Ranged**: A L4 Slinger (`KitingRanger`) vs `mb-brute-elite` (or L8 Slinger vs `brown-rat` pack) finishes with `>= 0.20` higher `hpRemainingPct.p50` than `FaceTanker`.
  4. `describe('class & build parity')`:
     - At L10 and L20, Warden (`shieldwall`, `lawnwrecker`), Slinger (`deadeye`, `beastwarden`), and Hedge-Mage (`sunburst`, `groundskeeper`) played by `TacticalPlayer` all achieve `winRate >= 0.80` on their zone's normal and elite benchmarks, and their `medianTtkSeconds` are within `2.2x` of the fastest build.

## Done when
- `npm test -w games/gnomes-of-gnomomia` passes in `< 5 s`.
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes.

## Out of scope
All files outside `src/sim/balance.test.ts` (if a test reveals a genuine numeric bug in `src/sim/*`, report it clearly).
~~~~

### 3.2 Agent-Facing CLI Balance Reporter (`scripts/sim-balance.mjs`)

~~~~text
Epic: 3 (Tests & CLI), issue 3.2: Agent-facing CLI balance reporter
Depends on: Epic 2

## Environment
Work only in the git worktree for Gnomes of Gnomomia.
If node is not found in Git Bash: export PATH="/c/Program Files/nodejs:$PATH".
Game: games/gnomes-of-gnomomia.
One other worker is editing src/sim/balance.test.ts at the same time. Change ONLY:
- games/gnomes-of-gnomomia/scripts/sim-balance.mjs
Do not run vite build or start servers, do not git commit.

## Goal
Create `games/gnomes-of-gnomomia/scripts/sim-balance.mjs` (invoked via `npm run sim -w games/gnomes-of-gnomomia`) so
coding agents and developers can run a fast (< 2 s) balance sweep from the command line with optional `--zone`,
`--class`, `--scenario`, `--policy`, `--seeds`, and `--json` flags.

## Read first
- games/gnomes-of-gnomomia/scripts/lint-content.mjs (see how it bundles TypeScript with `esbuild` into `mkdtempSync(join(tmpdir(), ...))`, imports it in Node, and cleans up `finally { rmSync(...) }`)
- games/gnomes-of-gnomomia/src/sim/types.ts
- games/gnomes-of-gnomomia/src/sim/runner.ts
- games/gnomes-of-gnomomia/src/sim/scenarios.ts
- games/gnomes-of-gnomomia/src/sim/agents.ts
- games/gnomes-of-gnomomia/src/sim/loadout.ts

## Change
- Create `games/gnomes-of-gnomomia/scripts/sim-balance.mjs`:
  - Bundle `src/sim/runner.ts`, `src/sim/scenarios.ts`, `src/sim/agents.ts`, and `src/sim/loadout.ts` via `esbuild` into a temp `.mjs` file in `os.tmpdir()` (marking `@lawn/gnome`, `@lawn/mp`, `@lawn/music`, `@lawn/prefabs`, `@arcade/volume` external if unused, or letting `three` resolve from `node_modules`).
  - Parse CLI flags:
    - `--zone=<zoneId>`: filter scenarios to that zone
    - `--scenario=<id>`: run only matching scenario id(s)
    - `--class=<warden|slinger|mage|classless>`: filter loadouts
    - `--policy=<id>`: filter policies (default runs `TacticalPlayer` on all scenarios, plus `GreedyBerserker` and `PassiveTurtler` on bosses)
    - `--seeds=<n>`: number of Monte Carlo seeds per cell (default `50`)
    - `--json`: emit machine-readable JSON array of `SimSummary` objects
  - Print the formatted summary table (`formatSummaryTable`) followed by a `=== DIAGNOSTICS ===` section listing any `BalanceDiagnostic` warnings/errors and the top damage-taken / death-cause breakdown for each flagged row.

## Done when
- `node games/gnomes-of-gnomomia/scripts/sim-balance.mjs --seeds=20` completes in `< 3 s` and prints the balance table and diagnostics cleanly.
- `node games/gnomes-of-gnomomia/scripts/sim-balance.mjs --scenario=boss-mole-king --seeds=30` prints the comparison of `TacticalPlayer`, `GreedyBerserker`, and `PassiveTurtler` against Grubthorn.

## Out of scope
All files outside `games/gnomes-of-gnomomia/scripts/sim-balance.mjs`.
~~~~
