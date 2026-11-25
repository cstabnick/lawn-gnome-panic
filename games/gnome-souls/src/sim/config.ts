// Pure tuning, layout, moveset, and enemy constants for Gnome Souls.

export const WORLD = {
  shrinePos: { x: 0, z: 40 },
  corridorHalfW: 5.5,
  corridorMinZ: -6,
  corridorMaxZ: 44,
  fogGateZ: -6,
  basinCenter: { x: 0, z: -28 },
  basinRadius: 18,
  spigotAnchor: { x: 0, y: 2.2, z: -45.5 },
  playerRadius: 0.42,
} as const;

export interface CircleCollider {
  readonly x: number;
  readonly z: number;
  readonly r: number;
  readonly h: number;
}

/** Six perimeter drainage pillars in the Sunken Spigot Basin + 4 culvert alcove pillars. */
export const PILLARS: readonly CircleCollider[] = [
  // Basin perimeter pillars (radius 15.2m around (0, -28) so they frame the arena without trapping)
  ...[35, 90, 145, 215, 270, 325].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: Math.cos(rad) * 15.2,
      z: -28 + Math.sin(rad) * 15.2,
      r: 0.72,
      h: 4.5,
    };
  }),
  // Damp Walk alcove pillars
  { x: -4.2, z: 26, r: 0.55, h: 4.0 },
  { x: 4.2, z: 26, r: 0.55, h: 4.0 },
  { x: -4.2, z: 8, r: 0.55, h: 4.0 },
  { x: 4.2, z: 8, r: 0.55, h: 4.0 },
];

export const PLAYER = {
  maxHp: 120,
  maxStamina: 100,
  staminaRegen: 34,
  staminaRegenGuard: 12,
  staminaDelay: 0.55,
  minStaminaDebt: -20,
  walkSpeed: 4.4,
  sprintSpeed: 6.9,
  sprintStaminaPerS: 18,
  turnRate: 11,
  rollStamina: 22,
  rollDuration: 0.54,
  rollIframeEnd: 0.32,
  rollCancelAt: 0.44,
  rollDistance: 4.4,
  guardReduction: 0.70,
  guardStaminaMult: 0.85,
  guardBreakStagger: 0.75,
  hitStaggerDuration: 0.34,
  flaskCharges: 3,
  flaskHeal: 58,
  flaskDuration: 0.95,
  flaskHealAt: 0.48,
  flaskMoveMult: 0.35,
  bufferWindow: 0.28,
  respawnDelay: 4.0,
} as const;

export type AttackId = 'r1_1' | 'r1_2' | 'r1_3' | 'roll_r1' | 'r2';

export interface AttackSpec {
  readonly id: AttackId;
  readonly startup: number;
  readonly active: number;
  readonly recovery: number;
  readonly cancelAt: number;
  readonly stamina: number;
  readonly damage: number;
  readonly poise: number;
  readonly reach: number;
  readonly arcDeg: number;
  readonly lunge: number;
  readonly nextR1?: AttackId;
}

export const GREATSWORD_MOVES: Record<AttackId, AttackSpec> = {
  r1_1: {
    id: 'r1_1',
    startup: 0.34,
    active: 0.14,
    recovery: 0.38,
    cancelAt: 0.72,
    stamina: 26,
    damage: 38,
    poise: 25,
    reach: 2.9,
    arcDeg: 135,
    lunge: 1.1,
    nextR1: 'r1_2',
  },
  r1_2: {
    id: 'r1_2',
    startup: 0.30,
    active: 0.14,
    recovery: 0.40,
    cancelAt: 0.70,
    stamina: 26,
    damage: 42,
    poise: 28,
    reach: 2.9,
    arcDeg: 140,
    lunge: 1.0,
    nextR1: 'r1_3',
  },
  r1_3: {
    id: 'r1_3',
    startup: 0.44,
    active: 0.14,
    recovery: 0.52,
    cancelAt: 0.96,
    stamina: 32,
    damage: 58,
    poise: 45,
    reach: 3.1,
    arcDeg: 95,
    lunge: 1.4,
  },
  roll_r1: {
    id: 'roll_r1',
    startup: 0.24,
    active: 0.13,
    recovery: 0.34,
    cancelAt: 0.62,
    stamina: 22,
    damage: 36,
    poise: 22,
    reach: 2.8,
    arcDeg: 110,
    lunge: 1.3,
    nextR1: 'r1_2',
  },
  r2: {
    id: 'r2',
    startup: 0.60,
    active: 0.16,
    recovery: 0.58,
    cancelAt: 1.16,
    stamina: 42,
    damage: 84,
    poise: 68,
    reach: 3.4,
    arcDeg: 115,
    lunge: 2.0,
  },
};

export type EnemyKind = 'hollow-trowel' | 'shovel-warden';

export interface EnemySpec {
  readonly kind: EnemyKind;
  readonly name: string;
  readonly maxHp: number;
  readonly maxPoise: number;
  readonly radius: number;
  readonly speed: number;
  readonly aggroDist: number;
  readonly attackRange: number;
  readonly windup: number;
  readonly active: number;
  readonly recovery: number;
  readonly damage: number;
  readonly reach: number;
  readonly arcDeg: number;
}

export const ENEMY_SPECS: Record<EnemyKind, EnemySpec> = {
  'hollow-trowel': {
    kind: 'hollow-trowel',
    name: 'Hollow Trowel-Bearer',
    maxHp: 140,
    maxPoise: 45,
    radius: 0.42,
    speed: 3.1,
    aggroDist: 10.5,
    attackRange: 2.1,
    windup: 0.58,
    active: 0.16,
    recovery: 0.78,
    damage: 28,
    reach: 2.2,
    arcDeg: 105,
  },
  'shovel-warden': {
    kind: 'shovel-warden',
    name: 'Shovel Warden',
    maxHp: 260,
    maxPoise: 85,
    radius: 0.52,
    speed: 2.5,
    aggroDist: 9.5,
    attackRange: 2.5,
    windup: 0.72,
    active: 0.18,
    recovery: 0.98,
    damage: 42,
    reach: 2.7,
    arcDeg: 130,
  },
};

export interface EnemySpawn {
  readonly id: number;
  readonly kind: EnemyKind;
  readonly x: number;
  readonly z: number;
  readonly facing: number;
}

export const ENEMY_SPAWNS: readonly EnemySpawn[] = [
  { id: 1, kind: 'hollow-trowel', x: -1.8, z: 24, facing: 0 },
  { id: 2, kind: 'hollow-trowel', x: 2.1, z: 14, facing: Math.PI * 0.15 },
  { id: 3, kind: 'shovel-warden', x: 0, z: 2, facing: 0 },
];

export const BOSS = {
  name: 'SLINK, THE UNCOILED HOSE',
  baseHp: 1100,
  coopHpScale: 0.35,
  maxPoise: 170,
  poiseDecayPerS: 12,
  phase2Threshold: 0.50,
  staggerDuration: 2.2,
  counterMult: 1.35,
  segmentCount: 18,
  segmentRadius: 0.48,
  nozzleRadius: 0.68,
  nozzleDamageMult: 1.15,
} as const;
