import type { ContainerType, ItemStack } from './sim/types';
export const GNOME_HEIGHT = 1.7;   // gm; every gnome model is scaled to this height
export const PREFAB_SCALE = 1.7;   // @lawn/prefabs: 1 unit = one gnome height
export const PLAYER_RADIUS = 0.45;
export const PLAYER_HEIGHT = 1.7;
export const STEP_UP = 0.5;        // walk up onto anything this much higher
export const VAULT_MAX = 1.6;      // grave kerbs: vault with the climb input
export const HATLESS_STEP = 1.6;   // the Hatless get over kerbs and nothing higher
export const LADDER_MAX = 10;
export const ROPE_MAX = 15;
export const MOVE = { walk: 2, jog: 4, sprint: 6, crouchMul: 0.5, accel: 12, gravity: 30, jogAt: 0.6 } as const;
export const CLIMB = { routeSpeed: 1.0, ropeSpeed: 0.8, ladderSpeed: 1.5, staminaPerSec: 6, vaultSeconds: 0.6, reach: 1.0, alongTolerance: 2 } as const;
export const STAMINA = { max: 100, sprintPerSec: 12, regenPerSec: 10, regenDelay: 1, attackCost: 8 } as const;
export const NOISE = { walk: 6, jog: 12, sprint: 25, crouchMul: 0.5, climb: 8, attack: 10, fire: 30, weightMul: 0.5, everySec: 0.25 } as const;
export const FALL = { chip: 6, crack: 12, shatter: 25 } as const;
export const CARRY = { capacityKg: 8, pocketsBulk: 4, overloadWalkOnly: 1.2 } as const;
export const HATLESS = {
  shamble: 1.2, lunge: 4, lungeSeconds: 1.5, lungeRange: 4, grabRange: 1.0, scratchEvery: 1.2,
  sightRange: 25, sightHalfAngle: 0.5, coreHp: 3, giveUpSeconds: 20, pileReach: 3, radius: 0.45,
  maxL0Desktop: 40, maxL0Phone: 24, staggerSeconds: 0.6,
} as const;
export const CAMERA = { distance: 4.2, height: 1.4, pitchMin: -0.35, pitchMax: 1.1, pitchDefault: 0.25, lookSensitivity: 0.0025, keyTurn: 2.2, crouchDrop: 0.5 } as const;
export const SUN = { realSecondsPerSunHour: 300, startHour: 8, nightStart: 22, nightEnd: 6 } as const;
export const FEED = { hysteresisSeconds: 60, npcMaxShown: 8, prerunDays: 2 } as const;
export const FIRE = { warmRadius: 4, noiseEverySec: 3, burnHoursPerFuel: 2, waystationStartHours: 6 } as const;
export const RAIN_CATCHER = { litresPerHour: 0.5, capLitres: 3 } as const;
export const FISTS = { damage: 0.5, reach: 0.8 } as const;
export const START_KIT: readonly ItemStack[] = [
  { def: 'loot-sack', count: 1, condition: 1 }, { def: 'old-trowel', count: 1, condition: 1 },
  { def: 'bread-loaf', count: 1, condition: 1 }, { def: 'spigot-water', count: 1, condition: 1 },
  { def: 'flint-striker', count: 1, condition: 1 }, { def: 'twig-bundle', count: 2, condition: 1 },
];
export const CLIMB_KIT: readonly ItemStack[] = [{ def: 'rope-coil', count: 1, condition: 1 }, { def: 'ladder', count: 1, condition: 1 }];
export const CONTAINER_PREFAB: Record<ContainerType, string> = {
  vase: 'flower-pot', bin: 'compost-bin', 'grave-goods': 'wicker-basket', crate: 'crate', sack: 'sack',
  chest: 'wooden-chest', 'camp-cache': 'loot-sack', body: 'loot-sack',
};
export const CONTAINER_NAME: Record<ContainerType, string> = {
  vase: 'vase', bin: 'bin', 'grave-goods': 'grave goods', crate: 'crate', sack: 'sack', chest: 'chest',
  'camp-cache': 'old camp cache', body: 'remains',
};
export const DOM = { hud: 'dayg-hud', inv: 'dayg-inv', touch: 'dayg-touch', recap: 'dayg-recap' } as const;
export const COLORS = {
  sky: 0x9fb4c0, nightSky: 0x141a26, fog: 0xa9b6b9, ground: 0x5f7d45, gravel: 0x9a9286, stone: 0x8d8a83,
  mossStone: 0x6f7a5e, hedge: 0x2f4a2a, wood: 0x6b4a2e, moss: 0x7d8b6a, mossDark: 0x56614a, pit: 0x3b3326,
} as const;
/** Screen zones every UI module respects (CSS px, inside the safe-area insets). */
export const LAYOUT = {
  topBar: 64,            // HUD needs and clock live in the top 64 px
  buttonsW: 200, buttonsH: 270, // touch buttons: bottom-right block
  stickZone: 0.45,       // left 45% of the width, bottom half: floating stick
  promptBottom: 120,     // context prompt sits 120 px above the bottom, centred
} as const;

/** Building interiors (roadmap 10). */
export const BUILDING_PREFIX = 'bld-';   // every building block id starts with this
export const STAIR_RISE = 0.4;            // max step height (STEP_UP is 0.5)
export const DOOR = { minWidth: 2.4, minHeight: 2.8, approach: 1.5 } as const;
export const INTERIOR = {
  enterInset: 0.3,   // gm inside the interior rect before the player counts as inside
  exitPad: 0.6,      // gm outside the footprint before the player counts as outside again
  fadeSeconds: 0.25, // roof and upper floors fade out / in
  distance: 3.2,     // third-person distance indoors (CAMERA.distance outdoors)
  pitchMin: 0.1, pitchMax: 1.2, pitchEnter: 0.45, pitchEaseSeconds: 0.4,
  solidPad: 0.35,    // the camera keeps this far from every block (camera.near is 0.3)
  ceilPad: 0.3,      // gm below the ceiling of a lower storey
  closeAt: 1.1, closeExitAt: 1.5, closeHold: 0.3, // close-follow when pulled in under 1.1 gm; leave after 0.3 s over 1.5
  muffle: 0.6,       // noise from inside a building reaches other spaces at this share of its radius
  doorSight: 8,      // a Hatless in or at a doorway sees through it this far
} as const;
export const DOM_MORE = { talk: 'dayg-talk', ledger: 'dayg-ledger', board: 'dayg-board', room: 'dayg-room', build: 'dayg-build', net: 'dayg-net' } as const;
export const NET = {
  game: 'dayg', poseHz: 10, hatlessHz: 10, sunEverySec: 5, newsEverySec: 5, saveEverySec: 300, chunkChars: 40000,
  resendSec: 2, maxPlayers: 16, phoneHostCap: 4, interpDelayMs: 150,
} as const;
export const STREAMING = { chunk: 256, radius: 3, maxBuildPerFrame: 2 } as const;  // chunks of 256 gm; keep |dx|,|dz| <= radius chunks
export const TALK = { radius: 2.5, linesShown: 6 } as const;
export const BOARD = { radius: 2.5 } as const;
export const SKILL = { base: 100, growth: 1.5, maxLevel: 10, timePerLevel: 0.08, failPerLevel: 0.1, xpEasy: 2, xpHard: 10, bookMul: 2, teacherMul: 3, lineageShare: 0.5 } as const;
export const BUILD = { grid: 4, half: 2, reach: 6, ghostOpacity: 0.45 } as const;
export const RESPAWN_KIT: readonly ItemStack[] = [
  { def: 'rag', count: 1, condition: 1 }, { def: 'candle', count: 1, condition: 1 }, { def: 'bread-loaf', count: 1, condition: 1 },
];
