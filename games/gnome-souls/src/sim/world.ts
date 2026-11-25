// Pure deterministic Souls simulation: movement, stamina, roll i-frames, input buffering, greatsword, enemies, boss.
import { BOSS, GREATSWORD_MOVES, PILLARS, PLAYER, WORLD, type AttackId } from './config';
import { createBoss, solveHosePose, stepBoss } from './boss';
import { createEnemies, stepEnemies } from './enemies';
import type {
  BufferedAction,
  PlayerActionInput,
  PlayerEntity,
  SimEvent,
  WorldState,
} from './types';

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export interface PlayerSeed {
  id: number;
  name: string;
  character: string;
  color: number;
  userId?: string;
}

export function createPlayer(seed: PlayerSeed, index: number, startInBoss: boolean): PlayerEntity {
  const offsetX = (index - 0.5) * 1.1;
  return {
    id: seed.id,
    name: seed.name,
    character: seed.character,
    color: seed.color,
    userId: seed.userId,
    x: startInBoss ? offsetX : offsetX,
    y: 0,
    z: startInBoss ? -11 : 41.5,
    vx: 0,
    vz: 0,
    facing: Math.PI, // face -z toward the culvert / boss
    hp: PLAYER.maxHp,
    maxHp: PLAYER.maxHp,
    stamina: PLAYER.maxStamina,
    maxStamina: PLAYER.maxStamina,
    staminaDelay: 0,
    flasks: PLAYER.flaskCharges,
    flasksUsed: 0,
    action: 'idle',
    actionTimer: 0,
    attackId: null,
    hitIds: [],
    rollDirX: 0,
    rollDirZ: -1,
    sprinting: false,
    guarding: false,
    buffered: null,
    bufferTimer: 0,
    respawnTimer: 0,
    deaths: 0,
    shrineRested: false,
  };
}

export function createWorldState(
  seeds: PlayerSeed[],
  opts?: { startInBoss?: boolean },
): WorldState {
  const startInBoss = Boolean(opts?.startInBoss);
  const players = seeds.map((s, i) => createPlayer(s, i, startInBoss));
  const boss = createBoss(players.length);
  if (startInBoss) {
    boss.active = true;
  }
  return {
    tick: 0,
    time: 0,
    fogOpen: startInBoss,
    bossStarted: startInBoss,
    victory: false,
    players,
    enemies: createEnemies(),
    boss,
    events: [],
  };
}

function clampArenaBounds(p: PlayerEntity, fogOpen: boolean): void {
  const r = WORLD.playerRadius;

  // Corridor vs Sunken Spigot Basin
  if (p.z > WORLD.fogGateZ) {
    p.x = clamp(p.x, -WORLD.corridorHalfW + r, WORLD.corridorHalfW - r);
    p.z = Math.min(p.z, WORLD.corridorMaxZ - r);
    if (!fogOpen) {
      p.z = Math.max(p.z, WORLD.fogGateZ + r);
    }
  } else {
    // Inside basin (radius 18 around (0, -28)) or doorway transition near z = -6..-10
    const dx = p.x - WORLD.basinCenter.x;
    const dz = p.z - WORLD.basinCenter.z;
    const d = Math.hypot(dx, dz);
    const maxR = WORLD.basinRadius - r;
    if (p.z > -10.5 && Math.abs(p.x) <= WORLD.corridorHalfW - r) {
      // Allow smooth doorway passage between z=-6 and z=-10.5
      p.x = clamp(p.x, -WORLD.corridorHalfW + r, WORLD.corridorHalfW - r);
    } else if (d > maxR && d > 1e-4) {
      p.x = WORLD.basinCenter.x + (dx / d) * maxR;
      p.z = WORLD.basinCenter.z + (dz / d) * maxR;
    }
  }

  // Circle pillar collisions
  for (const pil of PILLARS) {
    const dx = p.x - pil.x;
    const dz = p.z - pil.z;
    const minD = pil.r + r;
    const d = Math.hypot(dx, dz);
    if (d < minD && d > 1e-5) {
      p.x = pil.x + (dx / d) * minD;
      p.z = pil.z + (dz / d) * minD;
    }
  }
}

function spendStamina(p: PlayerEntity, cost: number): void {
  p.stamina = Math.max(PLAYER.minStaminaDebt, p.stamina - cost);
  p.staminaDelay = PLAYER.staminaDelay;
}

function startRoll(p: PlayerEntity, inp: PlayerActionInput): boolean {
  if (p.stamina <= 0) return false;
  spendStamina(p, PLAYER.rollStamina);
  p.action = 'roll';
  p.actionTimer = 0;
  p.attackId = null;
  p.guarding = false;
  p.sprinting = false;
  const len = Math.hypot(inp.moveX, inp.moveZ);
  if (len > 0.15) {
    p.rollDirX = inp.moveX / len;
    p.rollDirZ = inp.moveZ / len;
    p.facing = Math.atan2(p.rollDirX, p.rollDirZ);
  } else {
    p.rollDirX = Math.sin(p.facing);
    p.rollDirZ = Math.cos(p.facing);
  }
  return true;
}

function startAttack(p: PlayerEntity, id: AttackId, inp: PlayerActionInput): boolean {
  if (p.stamina <= 0) return false;
  const spec = GREATSWORD_MOVES[id];
  spendStamina(p, spec.stamina);
  p.action = 'attack';
  p.actionTimer = 0;
  p.attackId = id;
  p.hitIds = [];
  p.guarding = false;
  p.sprinting = false;
  const len = Math.hypot(inp.moveX, inp.moveZ);
  if (len > 0.2) {
    p.facing = Math.atan2(inp.moveX, inp.moveZ);
  }
  return true;
}

function startFlask(p: PlayerEntity): boolean {
  if (p.flasks <= 0) return false;
  p.flasks -= 1;
  p.flasksUsed += 1;
  p.action = 'flask';
  p.actionTimer = 0;
  p.attackId = null;
  p.guarding = false;
  p.sprinting = false;
  return true;
}

function canCancelCurrentAction(p: PlayerEntity): boolean {
  if (p.action === 'idle' || p.action === 'guard') return true;
  if (p.action === 'roll') return p.actionTimer >= PLAYER.rollCancelAt;
  if (p.action === 'attack' && p.attackId) {
    return p.actionTimer >= GREATSWORD_MOVES[p.attackId].cancelAt;
  }
  return false;
}

function tryConsumeBuffer(p: PlayerEntity, inp: PlayerActionInput, events: SimEvent[]): void {
  if (!p.buffered || !canCancelCurrentAction(p)) return;
  const b = p.buffered;
  if (b === 'roll' && startRoll(p, inp)) {
    p.buffered = null;
    events.push({ kind: 'roll', x: p.x, y: 0, z: p.z, playerId: p.id });
  } else if (b === 'r1') {
    const nextId: AttackId =
      p.action === 'roll'
        ? 'roll_r1'
        : p.action === 'attack' && p.attackId && GREATSWORD_MOVES[p.attackId].nextR1
          ? GREATSWORD_MOVES[p.attackId].nextR1!
          : 'r1_1';
    if (startAttack(p, nextId, inp)) {
      p.buffered = null;
      events.push({ kind: 'swing', x: p.x, y: 0.6, z: p.z, playerId: p.id });
    }
  } else if (b === 'r2' && startAttack(p, 'r2', inp)) {
    p.buffered = null;
    events.push({ kind: 'swing', x: p.x, y: 0.7, z: p.z, playerId: p.id });
  } else if (b === 'flask' && startFlask(p)) {
    p.buffered = null;
    events.push({ kind: 'flask', x: p.x, y: 0.5, z: p.z, playerId: p.id });
  }
}

function applyDamageToPlayer(p: PlayerEntity, rawDmg: number, angleFrom: number, events: SimEvent[]): void {
  if (p.action === 'dead') return;
  if (p.action === 'roll' && p.actionTimer <= PLAYER.rollIframeEnd) {
    // Clean i-frame dodge!
    return;
  }

  // Guarding blocks hits coming from roughly in front of the player
  const facingToAttacker = Math.abs(angleDiff(p.facing, angleFrom + Math.PI));
  if (p.guarding && p.action === 'guard' && facingToAttacker <= Math.PI * 0.65) {
    const stamCost = rawDmg * PLAYER.guardStaminaMult;
    p.stamina -= stamCost;
    p.staminaDelay = PLAYER.staminaDelay;
    const chip = Math.round(rawDmg * (1 - PLAYER.guardReduction));
    p.hp = Math.max(0, p.hp - chip);
    if (p.stamina < 0) {
      p.stamina = PLAYER.minStaminaDebt;
      p.action = 'stagger';
      p.actionTimer = 0;
      p.guarding = false;
      events.push({ kind: 'guard_break', x: p.x, y: 0.7, z: p.z, playerId: p.id });
    } else {
      events.push({ kind: 'guard', x: p.x, y: 0.7, z: p.z, playerId: p.id, value: chip });
    }
    if (p.hp <= 0) {
      p.action = 'dead';
      p.respawnTimer = PLAYER.respawnDelay;
      p.deaths += 1;
      events.push({ kind: 'player_death', x: p.x, y: 0.5, z: p.z, playerId: p.id });
    }
    return;
  }

  p.hp = Math.max(0, p.hp - rawDmg);
  p.guarding = false;
  p.sprinting = false;
  p.buffered = null;
  events.push({ kind: 'player_hit', x: p.x, y: 0.6, z: p.z, playerId: p.id, value: rawDmg });

  if (p.hp <= 0) {
    p.action = 'dead';
    p.actionTimer = 0;
    p.respawnTimer = PLAYER.respawnDelay;
    p.deaths += 1;
    events.push({ kind: 'player_death', x: p.x, y: 0.5, z: p.z, playerId: p.id });
  } else {
    p.action = 'stagger';
    p.actionTimer = 0;
  }
}

export function stepWorld(state: WorldState, inputs: PlayerActionInput[], dt: number): void {
  state.tick += 1;
  state.time += dt;
  state.events = [];

  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    const inp = inputs[i] ?? {
      moveX: 0, moveZ: 0, sprint: false, guard: false,
      rollPressed: false, r1Pressed: false, r2Pressed: false, flaskPressed: false, interactPressed: false,
    };

    if (p.action === 'dead') {
      p.vx = 0;
      p.vz = 0;
      p.respawnTimer -= dt;
      if (p.respawnTimer <= 0 && !state.victory) {
        // Respawn at Kiln-Ember Shrine (or reset boss if solo / all dead)
        const anyAlive = state.players.some((o) => o.action !== 'dead');
        p.hp = p.maxHp;
        p.stamina = p.maxStamina;
        p.flasks = PLAYER.flaskCharges;
        p.action = 'idle';
        p.actionTimer = 0;
        p.buffered = null;
        if (!anyAlive && state.bossStarted) {
          state.fogOpen = false;
          state.bossStarted = false;
          state.boss = createBoss(state.players.length);
          state.enemies = createEnemies();
        }
        p.x = (i - 0.5) * 1.1;
        p.z = 41.5;
        p.facing = Math.PI;
      }
      continue;
    }

    // Input buffering
    let newBuf: BufferedAction = null;
    if (inp.rollPressed) newBuf = 'roll';
    else if (inp.r2Pressed) newBuf = 'r2';
    else if (inp.r1Pressed) newBuf = 'r1';
    else if (inp.flaskPressed) newBuf = 'flask';
    if (newBuf) {
      p.buffered = newBuf;
      p.bufferTimer = PLAYER.bufferWindow;
    } else if (p.buffered) {
      p.bufferTimer -= dt;
      if (p.bufferTimer <= 0) p.buffered = null;
    }

    // Interact: Shrine or Mist Curtain
    if (inp.interactPressed && (p.action === 'idle' || p.action === 'guard')) {
      const distShrine = Math.hypot(p.x - WORLD.shrinePos.x, p.z - WORLD.shrinePos.z);
      if (distShrine <= 2.7) {
        p.hp = p.maxHp;
        p.stamina = p.maxStamina;
        p.flasks = PLAYER.flaskCharges;
        p.shrineRested = true;
        state.enemies = createEnemies();
        state.events.push({ kind: 'shrine_rest', x: WORLD.shrinePos.x, y: 0.6, z: WORLD.shrinePos.z, playerId: p.id });
      } else if (!state.fogOpen && Math.abs(p.x) <= 2.6 && Math.abs(p.z - WORLD.fogGateZ) <= 2.2) {
        state.fogOpen = true;
        state.bossStarted = true;
        state.boss.active = true;
        for (const pl of state.players) {
          if (pl.z > WORLD.fogGateZ - 1.5 && pl.action !== 'dead') {
            pl.z = WORLD.fogGateZ - 3.5;
          }
        }
        state.events.push({ kind: 'fog_gate', x: 0, y: 1.5, z: WORLD.fogGateZ, playerId: p.id });
      }
    }

    // Try buffered action on cancelable frames
    tryConsumeBuffer(p, inp, state.events);

    // Stamina regen
    if (p.staminaDelay > 0) {
      p.staminaDelay = Math.max(0, p.staminaDelay - dt);
    } else if (p.action === 'idle' || p.action === 'guard') {
      const rate = p.guarding ? PLAYER.staminaRegenGuard : PLAYER.staminaRegen;
      p.stamina = Math.min(p.maxStamina, p.stamina + rate * dt);
    }

    // Step current action
    p.vx = 0;
    p.vz = 0;

    if (p.action === 'roll') {
      p.actionTimer += dt;
      const speed = PLAYER.rollDistance / PLAYER.rollDuration;
      p.vx = p.rollDirX * speed;
      p.vz = p.rollDirZ * speed;
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      if (p.actionTimer >= PLAYER.rollDuration) {
        p.action = 'idle';
        p.actionTimer = 0;
      }
    } else if (p.action === 'attack' && p.attackId) {
      const prevT = p.actionTimer;
      p.actionTimer += dt;
      const spec = GREATSWORD_MOVES[p.attackId];
      // Forward lunge during startup -> active
      if (p.actionTimer <= spec.startup + spec.active) {
        const lungeSpeed = spec.lunge / (spec.startup + spec.active);
        p.vx = Math.sin(p.facing) * lungeSpeed;
        p.vz = Math.cos(p.facing) * lungeSpeed;
        p.x += p.vx * dt;
        p.z += p.vz * dt;
      }
      // Active hitbox window
      if (p.actionTimer >= spec.startup && p.actionTimer <= spec.startup + spec.active) {
        const halfArc = ((spec.arcDeg * 0.5) * Math.PI) / 180;
        // Hit enemies
        for (const e of state.enemies) {
          if (e.state === 'dead' || p.hitIds.includes(e.id)) continue;
          const d = Math.hypot(e.x - p.x, e.z - p.z);
          if (d <= spec.reach + 0.5) {
            const ang = Math.atan2(e.x - p.x, e.z - p.z);
            if (Math.abs(angleDiff(p.facing, ang)) <= halfArc) {
              p.hitIds.push(e.id);
              const mult = e.state === 'stagger' ? 1.3 : 1.0;
              const dmg = Math.round(spec.damage * mult);
              e.hp = Math.max(0, e.hp - dmg);
              e.poise -= spec.poise;
              state.events.push({ kind: 'hit_enemy', x: e.x, y: 0.7, z: e.z, playerId: p.id, value: dmg });
              if (e.hp <= 0) {
                e.state = 'dead';
              } else if (e.poise <= 0 && e.state !== 'stagger') {
                e.state = 'stagger';
                e.timer = 0;
                state.events.push({ kind: 'poise_break', x: e.x, y: 0.9, z: e.z });
              } else if (e.state === 'idle') {
                e.state = 'chase';
                e.targetId = p.id;
              }
            }
          }
        }
        // Hit boss (id = 999 in hitIds)
        if (state.boss.active && state.boss.alive && state.boss.attack !== 'phase_transition' && !p.hitIds.includes(999)) {
          let hitSeg = -1;
          for (let s = state.boss.segments.length - 1; s >= 8; s--) {
            const seg = state.boss.segments[s];
            const rad = s === state.boss.segments.length - 1 ? BOSS.nozzleRadius : BOSS.segmentRadius;
            const d = Math.hypot(seg.x - p.x, seg.z - p.z);
            if (d <= spec.reach + rad && seg.y <= 3.0) {
              const ang = Math.atan2(seg.x - p.x, seg.z - p.z);
              if (Math.abs(angleDiff(p.facing, ang)) <= halfArc) {
                hitSeg = s;
                break;
              }
            }
          }
          if (hitSeg >= 0) {
            p.hitIds.push(999);
            const isNozzle = hitSeg === state.boss.segments.length - 1;
            const counter =
              state.boss.attack === 'stagger' ? BOSS.counterMult : isNozzle ? BOSS.nozzleDamageMult : 1.0;
            const dmg = Math.round(spec.damage * counter);
            state.boss.hp = Math.max(0, state.boss.hp - dmg);
            state.boss.poise -= spec.poise;
            const hitPt = state.boss.segments[hitSeg];
            state.events.push({ kind: 'hit_boss', x: hitPt.x, y: hitPt.y, z: hitPt.z, playerId: p.id, value: dmg });
            if (state.boss.hp <= 0) {
              state.boss.alive = false;
              state.victory = true;
              state.boss.telegraph = null;
              state.events.push({ kind: 'boss_death', x: hitPt.x, y: 1.5, z: hitPt.z });
            } else if (state.boss.poise <= 0 && state.boss.attack !== 'stagger') {
              state.boss.attack = 'stagger';
              state.boss.timer = 0;
              state.boss.telegraph = null;
              state.events.push({ kind: 'poise_break', x: hitPt.x, y: 1.2, z: hitPt.z });
            }
          }
        }
      }
      if (prevT < spec.startup + spec.active + spec.recovery && p.actionTimer >= spec.startup + spec.active + spec.recovery) {
        p.action = 'idle';
        p.actionTimer = 0;
        p.attackId = null;
      }
    } else if (p.action === 'flask') {
      const prevT = p.actionTimer;
      p.actionTimer += dt;
      if (prevT < PLAYER.flaskHealAt && p.actionTimer >= PLAYER.flaskHealAt) {
        p.hp = Math.min(p.maxHp, p.hp + PLAYER.flaskHeal);
      }
      const len = Math.hypot(inp.moveX, inp.moveZ);
      if (len > 0.1) {
        p.vx = (inp.moveX / len) * PLAYER.walkSpeed * PLAYER.flaskMoveMult;
        p.vz = (inp.moveZ / len) * PLAYER.walkSpeed * PLAYER.flaskMoveMult;
        p.x += p.vx * dt;
        p.z += p.vz * dt;
      }
      if (p.actionTimer >= PLAYER.flaskDuration) {
        p.action = 'idle';
        p.actionTimer = 0;
      }
    } else if (p.action === 'stagger') {
      p.actionTimer += dt;
      if (p.actionTimer >= PLAYER.hitStaggerDuration) {
        p.action = 'idle';
        p.actionTimer = 0;
      }
    } else {
      // Idle or Guard locomotion
      p.guarding = inp.guard;
      p.action = p.guarding ? 'guard' : 'idle';
      const len = Math.hypot(inp.moveX, inp.moveZ);
      const wantSprint = inp.sprint && !p.guarding && len > 0.2 && p.stamina > 1;
      p.sprinting = wantSprint;
      if (wantSprint) {
        p.stamina = Math.max(0, p.stamina - PLAYER.sprintStaminaPerS * dt);
        p.staminaDelay = PLAYER.staminaDelay;
      }
      if (len > 0.08) {
        const nx = inp.moveX / len;
        const nz = inp.moveZ / len;
        const speed = wantSprint ? PLAYER.sprintSpeed : p.guarding ? PLAYER.walkSpeed * 0.65 : PLAYER.walkSpeed;
        p.vx = nx * speed;
        p.vz = nz * speed;
        p.x += p.vx * dt;
        p.z += p.vz * dt;
        const targetAng = Math.atan2(nx, nz);
        p.facing += angleDiff(p.facing, targetAng) * Math.min(1, dt * PLAYER.turnRate);
      }
    }

    clampArenaBounds(p, state.fogOpen);
  }

  // Step enemies & boss
  stepEnemies(state.enemies, state.players, dt, state.events, (p, dmg, ang) =>
    applyDamageToPlayer(p, dmg, ang, state.events),
  );
  stepBoss(state.boss, state.players, dt, state.time, state.events, (p, dmg, ang) =>
    applyDamageToPlayer(p, dmg, ang, state.events),
  );
  if (!state.boss.active) {
    solveHosePose(state.boss, state.time);
  }
}
