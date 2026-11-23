import type {
  AbilityDef, ClassId, EnemyDef, EquipSlot, OutdoorZoneId, StatusId,
} from '../config';
import type { GameState } from '../state';
import type { RaidSeat } from '../raidTypes';

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
  /** Every skill at this share of its cap. Omitted: the economy sim's skills for the class and level (src/sim/skillFill.ts). */
  skillFill?: number;
  ammo?: AmmoKind;
  potions?: { heal?: string; healCount?: number; mana?: string; manaCount?: number };
  allies?: readonly string[];
  /** Allow raid and reforged gear (ItemDef.source) in the gear tiers. Default false. */
  raidGear?: boolean;
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
  /** Raid helpers fighting beside the player (sim/arena.ts). */
  helpers?: readonly RaidSeat[];
  /** ENEMIES id: the scenario is won when this enemy has spawned and died. */
  raidBoss?: string;
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
