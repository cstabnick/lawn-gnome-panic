import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import type { PlayerInfo } from '@lawn/mp';
import { BOT_DIFFICULTY_SKILL, buildRosterSlots } from './net/protocol';
import { botReactionDelayS, computeBotInput } from './sim/bot';
import { ECONOMY, MOVEMENT } from './sim/config';
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

  it('preserves PlayerInfo.userId and supports versus (1H+1B vs 1H+1B), coop (2H vs 2B), and custom slot modes', () => {
    const players: PlayerInfo[] = [
      { id: 10, name: 'Fern', character: 'g1.abcdefgh', color: 0xff5a5a, userId: 'u_fern123' },
      { id: 20, name: 'Moss', character: 'g1.ijklmnop', color: 0x4fd8ff, userId: 'u_moss456' },
    ];

    // 1. Versus: 1 Human + 1 Bot (Amber 0,1) vs 1 Human + 1 Bot (Sapphire 2,3)
    const versus = buildRosterSlots(players, {
      mode: 'versus',
      localHeroId: 'tansy',
      localId: 10,
      botHeroes: ['bramble', 'loam', 'fernwick', 'hookwort'],
    });
    expect(versus.slots[0].userId).toBe('u_fern123');
    expect(versus.slots[0].isBot).toBe(false);
    expect(versus.slots[0].heroId).toBe('tansy');
    expect(versus.slots[1].isBot).toBe(true);
    expect(versus.slots[1].heroId).toBe('loam');
    expect(versus.slots[2].userId).toBe('u_moss456');
    expect(versus.slots[2].isBot).toBe(false);
    expect(versus.slots[3].isBot).toBe(true);
    expect(versus.slots[3].heroId).toBe('hookwort');
    expect(versus.slotForPlayerId.get(20)).toBe(2);

    // 2. Co-op: 2 Humans (Amber 0,1) vs 2 Bots (Sapphire 2,3)
    const coop = buildRosterSlots(players, {
      mode: 'coop',
      localHeroId: 'buckshot',
      localId: 10,
      botHeroes: ['bramble', 'tansy', 'thistle', 'loam'],
    });
    expect(coop.slots[0].isBot).toBe(false);
    expect(coop.slots[1].isBot).toBe(false);
    expect(coop.slots[1].userId).toBe('u_moss456');
    expect(coop.slots[2].isBot).toBe(true);
    expect(coop.slots[2].heroId).toBe('thistle');
    expect(coop.slots[3].isBot).toBe(true);
    expect(coop.slots[3].heroId).toBe('loam');
    expect(coop.slotForPlayerId.get(20)).toBe(1);

    // 3. Custom: explicit slotPrefs places Moss in Sapphire slot 3 and preserves custom botSkills
    const custom = buildRosterSlots(players, {
      mode: 'custom',
      slotPrefs: new Map([
        [10, 0],
        [20, 3],
      ]),
      botSkills: [1.0, 0.82, 1.15, 1.0],
      localHeroId: 'loam',
      localId: 10,
    });
    expect(custom.slotForPlayerId.get(10)).toBe(0);
    expect(custom.slotForPlayerId.get(20)).toBe(3);
    expect(custom.slots[3].userId).toBe('u_moss456');
    expect(custom.botSkills).toEqual([1.0, 0.82, 1.15, 1.0]);
  });

  it('spawns jungle camps at 40s, aggros when shot, and awards Acorns + orb on kill', () => {
    const state = createMatchState([
      { heroId: 'potsworth', name: 'P0', isBot: false },
      { heroId: 'bramble', name: 'B1', isBot: true },
      { heroId: 'tansy', name: 'T2', isBot: true },
      { heroId: 'fernwick', name: 'F3', isBot: true },
    ]);
    const idle: HeroActionInput = {
      move: { forward: 0, right: 0, yaw: 0, jumpPressed: false, dashPressed: false, slideHeld: false },
      pitch: 0,
      fireHeld: false,
      reloadPressed: false,
      abilityPressed: null,
    };

    expect(state.neutrals.length).toBe(0);
    for (let i = 0; i < 41; i++) {
      stepWorld(state, [idle, idle, idle, idle], 1.0);
    }
    // 2 small camps (2 beetles each) + 2 medium camps (1 golem each) = 6 neutrals
    expect(state.neutrals.length).toBe(6);

    const golem = state.neutrals.find((n) => n.kind === 'golem')!;
    golem.hp = 10;
    state.heroes[0].move.pos = { x: golem.x, y: golem.y, z: golem.z + 5 };
    const acornsBefore = state.heroes[0].acorns;
    stepWorld(state, [{ ...idle, fireHeld: true }, idle, idle, idle], 1 / 30);

    expect(state.heroes[0].acorns).toBeGreaterThan(acornsBefore + 100);
    expect(state.orbs.length).toBeGreaterThanOrEqual(1);
    expect(state.campTimers[golem.campId]).toBeCloseTo(70, 0);
  });
});

describe('Gnomelock AOE last-hits, solo-lane 100% XP, bot reaction delay, and air strafing', () => {
  it('grants AOE last-hit credit when nearby creep dies, with 100% solo share and duo split', () => {
    const slots = [
      { heroId: 'potsworth' as const, name: 'A0', isBot: false },
      { heroId: 'bramble' as const, name: 'A1', isBot: true },
      { heroId: 'tansy' as const, name: 'S0', isBot: true },
      { heroId: 'fernwick' as const, name: 'S1', isBot: true },
    ];
    const idle: HeroActionInput = {
      move: { forward: 0, right: 0, yaw: 0, jumpPressed: false, dashPressed: false, slideHeld: false },
      pitch: 0,
      fireHeld: false,
      reloadPressed: false,
      abilityPressed: null,
    };

    // Solo in lane: A1 is jungling at (-28, -26), out of creepCreditRadius (22m)
    const soloState = createMatchState(slots);
    soloState.heroes[0].move.pos = { x: 0, y: 0, z: -4 };
    soloState.heroes[1].move.pos = { x: -28, y: 0, z: -26 };
    soloState.creeps.push(
      { id: 1001, team: 0, kind: 'melee', x: 0, y: 0, z: -1, hp: 200, maxHp: 200, damage: 20, range: 2.5, fireCooldown: 0, bounty: 125, lastDamagedBySlot: -1 },
      { id: 1002, team: 1, kind: 'melee', x: 0, y: 0, z: 0, hp: 10, maxHp: 200, damage: 10, range: 2.5, fireCooldown: 99, bounty: 125, lastDamagedBySlot: -1 },
    );
    const soloBefore = soloState.heroes[0].acorns;
    stepWorld(soloState, [idle, idle, idle, idle], 1 / 30);
    const soloGain = Math.round(soloState.heroes[0].acorns - soloBefore);
    expect(soloState.heroes[0].lastHits).toBe(1);
    expect(soloState.heroes[1].lastHits).toBe(0);
    expect(soloState.orbs.length).toBe(1);
    expect(soloGain).toBe(Math.round(125 * ECONOMY.creepLastHitShare));

    // Duo in lane: both A0 and A1 within creepCreditRadius
    const duoState = createMatchState(slots);
    duoState.heroes[0].move.pos = { x: -2, y: 0, z: -4 };
    duoState.heroes[1].move.pos = { x: 2, y: 0, z: -4 };
    duoState.creeps.push(
      { id: 1001, team: 0, kind: 'melee', x: 0, y: 0, z: -1, hp: 200, maxHp: 200, damage: 20, range: 2.5, fireCooldown: 0, bounty: 125, lastDamagedBySlot: -1 },
      { id: 1002, team: 1, kind: 'melee', x: 0, y: 0, z: 0, hp: 10, maxHp: 200, damage: 10, range: 2.5, fireCooldown: 99, bounty: 125, lastDamagedBySlot: -1 },
    );
    const duoBefore0 = duoState.heroes[0].acorns;
    const duoBefore1 = duoState.heroes[1].acorns;
    stepWorld(duoState, [idle, idle, idle, idle], 1 / 30);
    expect(duoState.heroes[0].lastHits).toBe(1);
    expect(duoState.heroes[1].lastHits).toBe(1);
    const expectedDuo = Math.round(125 * ECONOMY.creepLastHitShare * ECONOMY.duoLaneShareMult);
    expect(Math.round(duoState.heroes[0].acorns - duoBefore0)).toBe(expectedDuo);
    expect(Math.round(duoState.heroes[1].acorns - duoBefore1)).toBe(expectedDuo);
    expect(expectedDuo).toBeLessThan(soloGain);
  });

  it('enforces 250ms bot reaction delay on Easy down to 150ms on Pro', () => {
    expect(botReactionDelayS(BOT_DIFFICULTY_SKILL.easy)).toBeCloseTo(0.25, 4);
    expect(botReactionDelayS(BOT_DIFFICULTY_SKILL.pro)).toBeCloseTo(0.15, 4);

    const state = createMatchState([
      { heroId: 'potsworth', name: 'A0', isBot: false },
      { heroId: 'bramble', name: 'A1', isBot: true },
      { heroId: 'tansy', name: 'S0', isBot: true },
      { heroId: 'fernwick', name: 'S1', isBot: true },
    ]);
    state.heroes[2].move.pos = { x: 0, y: 0, z: 10 };
    state.orbs.push({ id: 500, team: 0, x: 0, y: 1, z: 0, acorns: 50, ttl: 2.0, ageS: 0.05 });

    // Fresh orb (0.05s) is ignored on both Easy and Pro
    const inpEasyFresh = computeBotInput(state, 2, { skill: BOT_DIFFICULTY_SKILL.easy });
    const inpProFresh = computeBotInput(state, 2, { skill: BOT_DIFFICULTY_SKILL.pro });
    expect(inpEasyFresh.fireHeld).toBe(false);
    expect(inpProFresh.fireHeld).toBe(false);

    // At 0.16s, Pro reacts while Easy still waits
    state.orbs[0].ageS = 0.16;
    const inpEasyMid = computeBotInput(state, 2, { skill: BOT_DIFFICULTY_SKILL.easy });
    expect(inpEasyMid.fireHeld).toBe(false);

    // At 0.26s, Easy can also react and fire
    state.orbs[0].ageS = 0.26;
    state.rng = () => 0.1; // ensure orbChance & fireHeld rng rolls pass deterministically
    const inpEasyReady = computeBotInput(state, 2, { skill: BOT_DIFFICULTY_SKILL.easy });
    expect(inpEasyReady.fireHeld).toBe(true);
  });

  it('supports Source-style air strafing while preserving horizontal speed', () => {
    const m = createMoveState(0, 5, 0, 3);
    m.grounded = false;
    m.vel.x = 0;
    m.vel.y = 6;
    m.vel.z = -11; // moving toward -Z at 11 m/s

    let yaw = 0;
    for (let i = 0; i < 25; i++) {
      yaw -= 0.035; // smoothly turn right while holding right strafe
      stepHeroMovement(m, { forward: 0, right: 1, yaw, jumpPressed: false, dashPressed: false, slideHeld: false }, 1 / 60);
    }

    const hSpeed = Math.hypot(m.vel.x, m.vel.z);
    expect(m.vel.x).toBeGreaterThan(2.5); // curved significantly to the right (+X)
    expect(hSpeed).toBeGreaterThanOrEqual(10.8); // momentum preserved / gained
  });
});
