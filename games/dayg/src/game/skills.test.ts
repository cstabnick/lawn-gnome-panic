// Skill levels, time and failure effects, level-up events, and the player-record load (roadmap 8.13).
import { describe, it, expect } from 'vitest';
import { createBus } from './bus';
import { createSkills } from './skills';
import { createSimHost } from '../net/simHost';
import { createWorld } from '../sim/world';
import type { PlayerRecord, SkillId } from '../sim/types';

const PLAYER = 'local';

function solo(skills: Partial<Record<SkillId, number>> = {}) {
  const { world, streams } = createWorld(7);
  const p: PlayerRecord = {
    key: PLAYER, name: 'Test', look: '', userId: null, region: null, online: false, joinedTick: 0, lastTick: 0,
    acorns: 0, faction: null, notoriety: 0, quests: [], done: 0, failed: 0, deaths: 0, skills, bed: null,
  };
  world.players[PLAYER] = p;
  return createSimHost({ world, streams, worker: false, me: PLAYER });
}

describe('skill levels', () => {
  it('reaches level 3 at 475 XP and not at 474', () => {
    const bus = createBus();
    const s = createSkills(bus);
    s.load({ foraging: 474 });
    expect(s.level('foraging')).toBe(2);
    s.load({ foraging: 475 });
    expect(s.level('foraging')).toBe(3);
  });

  it('caps at level 10 and starts at 0', () => {
    const s = createSkills(createBus());
    expect(s.level('melee')).toBe(0);
    s.load({ melee: 1e9 });
    expect(s.level('melee')).toBe(10);
  });

  it('timeMul and failChance follow the config', () => {
    const s = createSkills(createBus());
    s.load({ masonry: 475 });
    expect(s.timeMul('masonry')).toBeCloseTo(1 - 0.08 * 3);
    expect(s.failChance('masonry', 5)).toBeCloseTo(0.1 * 2);
    expect(s.failChance('masonry', 1)).toBe(0);
  });

  it('gain adds easy, hard and failure XP and emits skill-up once per new level', () => {
    const bus = createBus();
    const s = createSkills(bus);
    const ups: number[] = [];
    bus.on('skill-up', (e) => { if (e.skill === 'carpentry') ups.push(e.level); });
    const seen: number[] = [];
    s.onLevel((sk, l) => { if (sk === 'carpentry') seen.push(l); });
    s.gain('carpentry', 'hard');
    expect(s.xp.carpentry).toBe(10);
    s.gain('carpentry', 'fail');
    expect(s.xp.carpentry).toBe(15);
    s.load({ carpentry: 474 });
    s.gain('carpentry', 'easy');
    expect(ups).toEqual([3]);
    expect(seen).toEqual([3]);
    s.gain('carpentry', 'easy');
    expect(ups).toEqual([3]);
  });

  it('load replaces all XP, missing skills become 0', () => {
    const s = createSkills(createBus());
    s.load({ fishing: 50 });
    s.load({ tracking: 20 });
    expect(s.xp.fishing).toBe(0);
    expect(s.xp.tracking).toBe(20);
  });
});

describe('solo host', () => {
  it('loads XP from the player record on start', () => {
    const host = solo({ climbing: 475, stealth: 100 });
    const s = createSkills(createBus(), host);
    expect(s.level('climbing')).toBe(3);
    expect(s.xp.stealth).toBe(100);
    expect(s.xp.ranged).toBe(0);
  });
});
