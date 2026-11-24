import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import type { PlayerInfo } from '@lawn/mp';
import { buildRosterSlots } from './net/protocol';
import { MOVEMENT } from './sim/config';
import { HERO_LIST, HEROES } from './sim/heroes';
import { computeHeroStats, ITEMS } from './sim/items';
import { groundHeightAt } from './sim/map';
import { createMoveState, stepHeroMovement } from './sim/movement';
import { createMatchState, stepWorld, type HeroActionInput } from './sim/world';

describe('Gnomelock movement mechanics', () => {
  it('supports jump, double jump (costs 1 stamina), and wall jump (0 stamina + resets double jump)', () => {
    const m = createMoveState(0, 0, 0, 3);
    // Ground jump
    const e1 = stepHeroMovement(m, { forward: 0, right: 0, yaw: 0, jumpPressed: true, dashPressed: false, slideHeld: false }, 1 / 60);
    expect(e1.jumped).toBe(true);
    expect(m.stamina).toBeCloseTo(3, 1);

    // Double jump in midair (away from walls)
    const e2 = stepHeroMovement(m, { forward: 0, right: 0, yaw: 0, jumpPressed: true, dashPressed: false, slideHeld: false }, 1 / 60);
    expect(e2.doubleJumped).toBe(true);
    expect(m.doubleJumpAvailable).toBe(false);
    expect(m.stamina).toBeLessThan(2.1);

    // Move right next to flank wall (x = -17.5, half-width 0.9 -> edge at -16.6)
    m.pos.x = -16.1;
    m.pos.y = 1.5;
    m.pos.z = -22;
    const staminaBeforeWall = m.stamina;
    const e3 = stepHeroMovement(m, { forward: 0, right: 0, yaw: 0, jumpPressed: true, dashPressed: false, slideHeld: false }, 1 / 60);
    expect(e3.wallJumped).toBe(true);
    expect(m.doubleJumpAvailable).toBe(true);
    expect(m.stamina).toBeGreaterThanOrEqual(staminaBeforeWall);
  });

  it('rewards Dash-Jump with speed preservation and stamina refund, and accelerates downhill slides', () => {
    const m = createMoveState(0, groundHeightAt(0, -75), -75, 3);
    const dEv = stepHeroMovement(m, { forward: 1, right: 0, yaw: Math.PI, jumpPressed: false, dashPressed: true, slideHeld: false }, 1 / 60);
    expect(dEv.dashed).toBe(true);
    const stamAfterDash = m.stamina;

    // Advance into dash-jump window (~0.1s)
    for (let i = 0; i < 6; i++) {
      stepHeroMovement(m, { forward: 1, right: 0, yaw: Math.PI, jumpPressed: false, dashPressed: false, slideHeld: false }, 1 / 60);
    }
    const djEv = stepHeroMovement(m, { forward: 1, right: 0, yaw: Math.PI, jumpPressed: true, dashPressed: false, slideHeld: false }, 1 / 60);
    expect(djEv.dashJumped).toBe(true);
    expect(m.stamina).toBeGreaterThan(stamAfterDash + MOVEMENT.dashJumpStaminaRefund - 0.05);

    // Downhill slide on slope (z = -70 going toward 0)
    const s = createMoveState(0, groundHeightAt(0, -70), -70, 3);
    s.vel.z = 11;
    for (let i = 0; i < 20; i++) {
      stepHeroMovement(s, { forward: 1, right: 0, yaw: Math.PI, jumpPressed: false, dashPressed: false, slideHeld: true }, 1 / 60);
    }
    expect(s.sliding).toBe(true);
    expect(Math.hypot(s.vel.x, s.vel.z)).toBeGreaterThan(11);
  });

  it('reaches Flow Tier 3 when chaining movement tech', () => {
    const m = createMoveState(0, 0, 0, 3);
    stepHeroMovement(m, { forward: 1, right: 0, yaw: 0, jumpPressed: false, dashPressed: true, slideHeld: false }, 1 / 60);
    for (let i = 0; i < 6; i++) {
      stepHeroMovement(m, { forward: 1, right: 0, yaw: 0, jumpPressed: false, dashPressed: false, slideHeld: false }, 1 / 60);
    }
    stepHeroMovement(m, { forward: 1, right: 0, yaw: 0, jumpPressed: true, dashPressed: false, slideHeld: false }, 1 / 60);
    m.pos.x = -16.1;
    m.pos.y = 1.5;
    m.pos.z = -22;
    stepHeroMovement(m, { forward: 0, right: 0, yaw: 0, jumpPressed: true, dashPressed: false, slideHeld: false }, 1 / 60);
    // Wait past wallJumpCooldown (0.25s) and wall-jump again
    for (let i = 0; i < 16; i++) {
      stepHeroMovement(m, { forward: 0, right: 0, yaw: 0, jumpPressed: false, dashPressed: false, slideHeld: false }, 1 / 60);
    }
    m.pos.x = -16.1;
    m.pos.y = 1.5;
    m.pos.z = -22;
    stepHeroMovement(m, { forward: 0, right: 0, yaw: 0, jumpPressed: true, dashPressed: false, slideHeld: false }, 1 / 60);
    expect(m.flowTier).toBe(3);
  });
});

describe('Gnomelock last-hitting, Soul Acorn Orbs, and tower progression', () => {
  it('spawns a Soul Acorn Orb on creep last-hit and awards deny bonus when shot by enemy', () => {
    const state = createMatchState([
      { heroId: 'potsworth', name: 'A0', isBot: false },
      { heroId: 'bramble', name: 'A1', isBot: true },
      { heroId: 'tansy', name: 'S0', isBot: false },
      { heroId: 'fernwick', name: 'S1', isBot: true },
    ]);

    // Place a low-HP Sapphire creep right in front of Amber Potsworth (slot 0)
    state.creeps.push({
      id: 999,
      team: 1,
      kind: 'melee',
      x: 0,
      y: groundHeightAt(0, -10),
      z: -10,
      hp: 10,
      maxHp: 200,
      damage: 10,
      range: 2,
      fireCooldown: 1,
      bounty: 100,
      lastDamagedBySlot: -1,
    });
    state.heroes[0].move.pos = { x: 0, y: groundHeightAt(0, -16), z: -16 };
    const idle: HeroActionInput = {
      move: { forward: 0, right: 0, yaw: Math.PI, jumpPressed: false, dashPressed: false, slideHeld: false },
      pitch: 0,
      fireHeld: false,
      reloadPressed: false,
      abilityPressed: null,
    };
    const fire0: HeroActionInput = { ...idle, fireHeld: true };
    stepWorld(state, [fire0, idle, idle, idle], 1 / 30);

    expect(state.heroes[0].lastHits).toBe(1);
    expect(state.orbs.length).toBe(1);
    expect(state.orbs[0].team).toBe(0);

    // Now Sapphire Tansy (slot 2) shoots and denies the Amber orb!
    const orb = state.orbs[0];
    state.heroes[2].move.pos = { x: 0, y: orb.y - 0.9, z: orb.z + 5 };
    const fire2: HeroActionInput = {
      move: { forward: 0, right: 0, yaw: 0, jumpPressed: false, dashPressed: false, slideHeld: false },
      pitch: 0,
      fireHeld: true,
      reloadPressed: false,
      abilityPressed: null,
    };
    stepWorld(state, [idle, idle, fire2, idle], 1 / 30);
    expect(state.heroes[2].orbsDenied).toBe(1);
    expect(state.orbs.length).toBe(0);
  });

  it('enforces T1 -> T2 -> T3 -> Ancient invulnerability progression', () => {
    const state = createMatchState([
      { heroId: 'bramble', name: 'A0', isBot: false },
      { heroId: 'tansy', name: 'A1', isBot: true },
      { heroId: 'fernwick', name: 'S0', isBot: true },
      { heroId: 'potsworth', name: 'S1', isBot: true },
    ]);
    const t1 = state.structures.find((s) => s.id === 'sapphire-t1')!;
    const t2 = state.structures.find((s) => s.id === 'sapphire-t2')!;
    const t3 = state.structures.find((s) => s.id === 'sapphire-t3')!;
    const anc = state.structures.find((s) => s.id === 'sapphire-ancient')!;

    expect(t1.invulnerable).toBe(false);
    expect(t2.invulnerable).toBe(true);
    expect(t3.invulnerable).toBe(true);
    expect(anc.invulnerable).toBe(true);
  });
});

describe('Gnomelock items, prefabs, and gear sync', () => {
  it('verifies all 12 items and 8 hero weapons reference valid @lawn/prefabs IDs', () => {
    expect(ITEMS.length).toBe(12);
    expect(HERO_LIST.length).toBe(8);
    for (const it of ITEMS) {
      expect(getPrefab(it.prefabId), `Missing prefab ${it.prefabId}`).toBeDefined();
    }
    for (const h of HERO_LIST) {
      expect(getPrefab(h.weapon.prefabId), `Missing weapon prefab ${h.weapon.prefabId}`).toBeDefined();
    }
    const stats = computeHeroStats(HEROES.bramble, ['heavy-trowel', 'clover-boots'], 3, 2, false);
    expect(stats.maxHp).toBeGreaterThan(HEROES.bramble.baseHp);
    expect(stats.maxStamina).toBe(4);
  });

  it('supports Hookwort Q hook, Buckshot X infinite ammo, Thistle F/X spam, and Loam X black hole pull', () => {
    const state = createMatchState([
      { heroId: 'hookwort', name: 'Hook', isBot: false },
      { heroId: 'buckshot', name: 'Buck', isBot: false },
      { heroId: 'thistle', name: 'This', isBot: false },
      { heroId: 'loam', name: 'Loam', isBot: false },
    ]);
    const idle: HeroActionInput = {
      move: { forward: 0, right: 0, yaw: Math.PI, jumpPressed: false, dashPressed: false, slideHeld: false },
      pitch: 0,
      fireHeld: false,
      reloadPressed: false,
      abilityPressed: null,
    };

    // 1. Hookwort Q pulls enemy Thistle (slot 2) toward Hookwort (slot 0)
    state.heroes[0].move.pos = { x: 0, y: 0, z: -15 };
    state.heroes[2].move.pos = { x: 0, y: 0, z: 0 };
    stepWorld(state, [{ ...idle, abilityPressed: 'Q' }, idle, idle, idle], 1 / 30);
    expect(state.heroes[2].move.pos.z).toBeLessThan(-10);

    // 2. Buckshot X grants infinite ammo and fires without spending ammo
    state.heroes[1].ammo = 5;
    stepWorld(state, [idle, { ...idle, abilityPressed: 'X', fireHeld: true }, idle, idle], 1 / 30);
    expect(state.heroes[1].infiniteAmmoTimer).toBeGreaterThan(5);
    expect(state.heroes[1].ammo).toBe(state.heroes[1].stats.magSize);

    // 3. Thistle Q -> F reduces Q cooldown, X accelerates cooldown tick
    stepWorld(state, [idle, idle, { ...idle, abilityPressed: 'Q' }, idle], 1 / 30);
    const qCdBeforeF = state.heroes[2].cooldowns.Q;
    stepWorld(state, [idle, idle, { ...idle, abilityPressed: 'F' }, idle], 1 / 30);
    expect(state.heroes[2].cooldowns.Q).toBeLessThan(qCdBeforeF - 1.5);

    // 4. Loam X (slot 3, team 1) spawns a Black Hole that pulls Hookwort (slot 0, team 0) inward
    state.heroes[3].move.pos = { x: 0, y: 0, z: 0 };
    state.heroes[0].move.pos = { x: 0, y: 0, z: -13 }; // within 10.5m of black hole at z = -7.5 (yaw=0 -> +fwd=-Z)
    stepWorld(
      state,
      [
        idle,
        idle,
        idle,
        {
          ...idle,
          move: { ...idle.move, yaw: 0 },
          abilityPressed: 'X',
        },
      ],
      1 / 30,
    );
    const distBefore = Math.abs(state.heroes[0].move.pos.z - (-7.5));
    for (let i = 0; i < 10; i++) {
      stepWorld(state, [idle, idle, idle, idle], 1 / 30);
    }
    const distAfter = Math.abs(state.heroes[0].move.pos.z - (-7.5));
    expect(distAfter).toBeLessThan(distBefore);
  });

  it('preserves PlayerInfo.userId when building online roster slots (gear sync)', () => {
    const players: PlayerInfo[] = [
      { id: 10, name: 'Fern', character: 'g1.abcdefgh', color: 0xff5a5a, userId: 'u_fern123' },
      { id: 20, name: 'Moss', character: 'g1.ijklmnop', color: 0x4fd8ff, userId: 'u_moss456' },
    ];
    const { slots, slotForPlayerId } = buildRosterSlots(players, new Map(), 'tansy', 10);
    expect(slots[0].userId).toBe('u_fern123');
    expect(slots[0].heroId).toBe('tansy');
    expect(slots[1].userId).toBe('u_moss456');
    expect(slots[2].isBot).toBe(true);
    expect(slotForPlayerId.get(20)).toBe(1);
  });
});
