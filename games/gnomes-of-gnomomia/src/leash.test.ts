import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TUNING } from './config';
import { SPAWNS } from './content';
import { ORIGINS } from './data/layout';
import { isBossRank, isWithinLeash, RETURN_STALL_SECONDS, trackReturn } from './leash';
import { resetBossMovesState, updateBossMoves } from './bossmoves';
import { removeEntity, spawnEnemyAt } from './entities';
import { bus } from './events';
import { player } from './player';
import { state } from './state';

describe('isBossRank & isWithinLeash', () => {
  it('identifies boss-tier ranks', () => {
    expect(isBossRank('miniboss')).toBe(true);
    expect(isBossRank('boss')).toBe(true);
    expect(isBossRank('worldboss')).toBe(true);
    expect(isBossRank('final')).toBe(true);
    expect(isBossRank('normal')).toBe(false);
    expect(isBossRank('elite')).toBe(false);
  });

  it('uses authored leash when present, otherwise TUNING.leashRange around home', () => {
    const withLeash = { home: { x: 0, z: 0 }, leash: { x: 10, z: 10, r: 5 } };
    expect(isWithinLeash(withLeash, 14, 10)).toBe(true);
    expect(isWithinLeash(withLeash, 16, 10)).toBe(false);
    expect(isWithinLeash(withLeash, 0, 0)).toBe(false);

    const noLeash = { home: { x: 0, z: 0 } };
    expect(isWithinLeash(noLeash, TUNING.leashRange, 0)).toBe(true);
    expect(isWithinLeash(noLeash, TUNING.leashRange + 0.1, 0)).toBe(false);
  });
});

describe('authored boss leash zones in SPAWNS', () => {
  const expected: { spawnId: string; zone: keyof typeof ORIGINS; x: number; z: number; r: number }[] = [
    { spawnId: 'mb-spawn-8', zone: 'mossbottom', x: 10, z: -88, r: 16 },
    { spawnId: 'c2-spawn-10', zone: 'thatchford', x: 65, z: 45, r: 18 },
    { spawnId: 's03-spawn-5', zone: 'thatchford', x: 65, z: 45, r: 18 },
    { spawnId: 'c4-spawn-10', zone: 'cloverfield', x: 50, z: 60, r: 22 },
    { spawnId: 'c4-spawn-11', zone: 'cloverfield', x: 80, z: -70, r: 18 },
    { spawnId: 'c5-spawn-9', zone: 'hedgewood', x: -74, z: 38, r: 18 },
    { spawnId: 'c6-spawn-6', zone: 'rockery', x: 60, z: 56, r: 18 },
    { spawnId: 'c6-spawn-9', zone: 'rockery', x: 0, z: -80, r: 18 },
    { spawnId: 'c7-spawn-9', zone: 'verge', x: 60, z: 0, r: 22 },
    { spawnId: 'c3-spawn-3', zone: 'deeps', x: 0, z: 42, r: 14 },
    { spawnId: 'c5-spawn-13', zone: 'deeps', x: 0, z: -14, r: 14 },
    { spawnId: 'c6-spawn-12', zone: 'deeps', x: 0, z: -86, r: 16 },
  ];

  for (const exp of expected) {
    it(`${exp.spawnId} (${exp.zone}) has world-shifted leash r=${exp.r}`, () => {
      const sp = SPAWNS.find((s) => s.id === exp.spawnId);
      expect(sp?.leash).toBeDefined();
      const o = ORIGINS[exp.zone];
      expect(sp!.leash!.x).toBeCloseTo(exp.x + o.x, 5);
      expect(sp!.leash!.z).toBeCloseTo(exp.z + o.z, 5);
      expect(sp!.leash!.r).toBe(exp.r);
    });
  }
});

describe('bossmoves leash & reset guards', () => {
  const spawned: number[] = [];

  beforeEach(() => {
    resetBossMovesState();
    player.dead = false;
    state.hp = 100;
  });

  afterEach(() => {
    resetBossMovesState();
    for (const id of spawned.splice(0)) removeEntity(id);
  });

  it('cancels vanish (Burrow) on enemy-reset without teleporting or damaging the player', () => {
    const o = ORIGINS.mossbottom;
    const bx = o.x + 10;
    const bz = o.z - 88;
    const boss = spawnEnemyAt('mole-king', bx, bz)!;
    spawned.push(boss.id);
    boss.leash = { x: bx, z: bz, r: 16 };
    boss.inCombat = true;

    player.position.set(bx + 2, 0, bz);
    // Advance enough for Burrow (every=14, initial=0.6*14=8.4s) + telegraph (1.5s) to trigger hideBoss.
    for (let i = 0; i < 110; i++) updateBossMoves(0.1);
    expect(boss.object.visible).toBe(false);

    // Player runs far away and boss leashes/resets.
    player.position.set(bx + 80, 0, bz);
    boss.inCombat = false;
    bus.emit('enemy-reset', { entityId: boss.id });

    expect(boss.object.visible).toBe(true);
    expect(boss.position.x).toBeCloseTo(bx, 3);
    expect(boss.position.z).toBeCloseTo(bz, 3);

    // Advance past vanish duration (3s) + ring delay (0.5s): boss must NOT teleport or hit player.
    const hpBefore = state.hp;
    for (let i = 0; i < 45; i++) updateBossMoves(0.1);
    expect(boss.position.x).toBeCloseTo(bx, 3);
    expect(boss.position.z).toBeCloseTo(bz, 3);
    expect(state.hp).toBe(hpBefore);
  });

  it('does not teleport vanish boss outside its leash even if still flagged inCombat', () => {
    const o = ORIGINS.mossbottom;
    const bx = o.x + 10;
    const bz = o.z - 88;
    const boss = spawnEnemyAt('mole-king', bx, bz)!;
    spawned.push(boss.id);
    boss.leash = { x: bx, z: bz, r: 16 };
    boss.inCombat = true;

    player.position.set(bx + 2, 0, bz);
    for (let i = 0; i < 110; i++) updateBossMoves(0.1);
    expect(boss.object.visible).toBe(false);

    // Player sprints outside leash while vanish timer is still ticking.
    player.position.set(bx + 40, 0, bz);
    const hpBefore = state.hp;
    for (let i = 0; i < 45; i++) updateBossMoves(0.1);

    expect(boss.object.visible).toBe(true);
    expect(isWithinLeash(boss, boss.position.x, boss.position.z)).toBe(true);
    expect(state.hp).toBe(hpBefore);
  });

  it('does not pull a player who moved outside pull radius or leash zone', () => {
    const o = ORIGINS.deeps;
    const bx = o.x;
    const bz = o.z + 42;
    const boss = spawnEnemyAt('clogmaw', bx, bz)!;
    spawned.push(boss.id);
    boss.leash = { x: bx, z: bz, r: 14 };
    boss.inCombat = true;

    player.position.set(bx + 3, 0, bz);
    // Suction has every=12 (initial=7.2s), telegraph=1.5s. Advance 7.5s to start telegraph, then move player outside leash.
    for (let i = 0; i < 75; i++) updateBossMoves(0.1);
    player.position.set(bx + 20, 0, bz);
    for (let i = 0; i < 20; i++) updateBossMoves(0.1);

    expect(player.position.x).toBeCloseTo(bx + 20, 3);
  });
});

describe('trackReturn (walk-home stall detection)', () => {
  it('never reports stuck while the enemy keeps getting closer to home', () => {
    let t = { best: Infinity, stall: 0 };
    let dist = 30;
    for (let i = 0; i < 200; i++) {
      dist -= 0.1; // 1 unit/s at dt 0.1
      const r = trackReturn(t, dist, 0.1);
      expect(r.stuck).toBe(false);
      t = r;
    }
  });

  it('reports stuck after RETURN_STALL_SECONDS without progress, and progress resets the timer', () => {
    let t = trackReturn({ best: Infinity, stall: 0 }, 10, 0.1);
    let stuck = false;
    for (let i = 0; i < Math.ceil(RETURN_STALL_SECONDS / 0.1) + 1; i++) {
      const r = trackReturn(t, 10, 0.1);
      t = r;
      if (r.stuck) stuck = true;
    }
    expect(stuck).toBe(true);
    const moved = trackReturn(t, 9.5, 0.1);
    expect(moved.stuck).toBe(false);
    expect(moved.stall).toBe(0);
    expect(moved.best).toBe(9.5);
  });
});
