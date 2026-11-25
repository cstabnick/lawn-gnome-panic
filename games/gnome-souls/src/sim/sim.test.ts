import { describe, expect, it } from 'vitest';
import { BOSS, GREATSWORD_MOVES, PLAYER } from './config';
import { EMPTY_INPUT, type PlayerActionInput } from './types';
import { createWorldState, stepWorld } from './world';

const SEED = [{ id: 1, name: 'Ashen Gnome', character: 'gnorman', color: 0xd93636 }];

function stepN(state: ReturnType<typeof createWorldState>, inp: PlayerActionInput, seconds: number, dt = 1 / 60): void {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    stepWorld(state, [i === 0 ? inp : { ...EMPTY_INPUT, moveX: inp.moveX, moveZ: inp.moveZ, guard: inp.guard, sprint: inp.sprint }], dt);
  }
}

describe('Gnome Souls simulation', () => {
  it('dodge roll grants i-frames and drains stamina', () => {
    const state = createWorldState(SEED, { startInBoss: true });
    const p = state.players[0];
    stepWorld(state, [{ ...EMPTY_INPUT, rollPressed: true, moveZ: -1 }], 1 / 60);
    expect(p.action).toBe('roll');
    expect(p.stamina).toBeCloseTo(PLAYER.maxStamina - PLAYER.rollStamina, 1);

    // Even if boss slams right on top of player during i-frames, HP stays full
    state.boss.attack = 'nozzle_slam';
    state.boss.slamX = p.x;
    state.boss.slamZ = p.z;
    state.boss.timer = 1.07;
    stepWorld(state, [EMPTY_INPUT], 0.03);
    expect(p.hp).toBe(PLAYER.maxHp);
  });

  it('input buffering chains R1 -> R1_2 -> R1_3 greatsword combo', () => {
    const state = createWorldState(SEED);
    const p = state.players[0];
    stepWorld(state, [{ ...EMPTY_INPUT, r1Pressed: true }], 1 / 60);
    expect(p.attackId).toBe('r1_1');

    // Buffer second R1 just before cancelAt
    const cancel = GREATSWORD_MOVES.r1_1.cancelAt;
    stepN(state, EMPTY_INPUT, cancel - 0.08);
    stepWorld(state, [{ ...EMPTY_INPUT, r1Pressed: true }], 1 / 60);
    stepN(state, EMPTY_INPUT, 0.12);
    expect(p.attackId).toBe('r1_2');

    // Buffer third R1
    stepN(state, EMPTY_INPUT, GREATSWORD_MOVES.r1_2.cancelAt - 0.18);
    stepWorld(state, [{ ...EMPTY_INPUT, r1Pressed: true }], 1 / 60);
    stepN(state, EMPTY_INPUT, 0.14);
    expect(p.attackId).toBe('r1_3');
  });

  it('Kiln-Ember Shrine restores HP, flasks, and respawns enemies', () => {
    const state = createWorldState(SEED);
    const p = state.players[0];
    p.hp = 40;
    p.flasks = 0;
    state.enemies[0].state = 'dead';
    p.x = 0;
    p.z = 40;
    stepWorld(state, [{ ...EMPTY_INPUT, interactPressed: true }], 1 / 60);
    expect(p.hp).toBe(PLAYER.maxHp);
    expect(p.flasks).toBe(PLAYER.flaskCharges);
    expect(p.shrineRested).toBe(true);
    expect(state.enemies[0].state).toBe('idle');
  });

  it('Slink transitions to Phase 2 at 50% HP and scales HP in co-op', () => {
    const coop = createWorldState(
      [
        { id: 1, name: 'G1', character: 'gnorman', color: 0xff5a5a },
        { id: 2, name: 'G2', character: 'gnorman', color: 0x4fd8ff },
      ],
      { startInBoss: true },
    );
    expect(coop.boss.maxHp).toBe(Math.round(BOSS.baseHp * (1 + BOSS.coopHpScale)));

    coop.boss.hp = Math.floor(coop.boss.maxHp * 0.45);
    stepWorld(coop, [EMPTY_INPUT, EMPTY_INPUT], 1 / 60);
    expect(coop.boss.phase).toBe(2);
    expect(coop.boss.attack).toBe('phase_transition');
  });
});
