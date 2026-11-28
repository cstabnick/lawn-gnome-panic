import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEconomy } from '../economy';
import type { JobsDeps } from '../jobs/types';
import { createInventory, installInventory, type InventoryStorage, count } from '../inventory';
import { clearProperties, createOwnership, installOwnership } from '../ownership';
import { BEDS, CROFT, FARM } from './types';

vi.mock('../sound/bus', () => ({ playAt: vi.fn(() => true) }));

import { installFarm } from './runtime';

function memoryStorage(): InventoryStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
}

/** The For Sale board's prompt point: 1.5 m west of the board. */
const BOARD = { x: CROFT.forSale.x - 1.5, z: CROFT.forSale.z };
const RACK = { x: CROFT.seedRack.x - 1.5, z: CROFT.seedRack.z };
const STALL = { x: CROFT.stall.x - 1.5, z: CROFT.stall.z };
const bedPoint = (i: number) => ({ x: BEDS[i].x, z: BEDS[i].z });

let toasts: string[];

function setup(acorns = 500) {
  const economy = createEconomy(memoryStorage() as never);
  economy.earn(acorns);
  installInventory(createInventory(memoryStorage()));
  installOwnership(createOwnership({ economy, storage: memoryStorage() }));
  toasts = [];
  const deps = {
    scene: new THREE.Scene(),
    economy,
    hud: { toast: (t: string) => void toasts.push(t) },
    player: { x: BOARD.x, z: BOARD.z },
  } as unknown as JobsDeps;
  return { economy, deps, farm: installFarm(deps) };
}

beforeEach(() => {
  clearProperties();
});

afterEach(() => {
  installInventory(null);
  installOwnership(null);
});

describe('Windfall Croft runtime', () => {
  it('offers to buy the croft, and bed prompts are null until it is owned', () => {
    const { farm } = setup();
    expect(farm.owned()).toBe(false);
    expect(farm.prompt(BOARD.x, BOARD.z)).toBe('Buy Windfall Croft (300 down)');
    expect(farm.prompt(bedPoint(0).x, bedPoint(0).z)).toBeNull();
    expect(farm.prompt(RACK.x, RACK.z)).toBeNull();
    expect(farm.prompt(STALL.x, STALL.z)).toBeNull();
  });

  it('buys the croft, then plants, waters, grows, harvests, and sells', () => {
    const { farm, economy } = setup(500);
    const start = economy.state().acorns;
    expect(farm.interact(BOARD.x, BOARD.z)).toBe(true);
    expect(farm.owned()).toBe(true);
    expect(toasts).toContain('Windfall Croft is yours. So is the loan. And the weeds.');
    const afterBuy = economy.state().acorns;
    expect(afterBuy).toBe(start - FARM.down);

    const p = bedPoint(0);
    expect(farm.prompt(p.x, p.z)).toBe('Plant Radishes (5)');
    expect(farm.interact(p.x, p.z)).toBe(true);
    expect(economy.state().acorns).toBe(afterBuy - 5);

    expect(farm.prompt(p.x, p.z)).toBe('Water the Radishes');
    farm.interact(p.x, p.z);
    farm.update(45);
    expect(farm.state().beds[0].stage).toBe(1);
    expect(farm.state().beds[0].wet).toBe(false);
    expect(farm.prompt(p.x, p.z)).toBe('Water the Radishes');

    farm.interact(p.x, p.z);
    farm.update(45);
    expect(farm.state().beds[0].stage).toBe(2);
    expect(farm.prompt(p.x, p.z)).toBe('Harvest the Radishes');

    farm.interact(p.x, p.z);
    expect(count('produce-radish')).toBe(4);
    expect(farm.state().beds[0].crop).toBeNull();

    const before = economy.state().acorns;
    expect(farm.sellAll()).toBe(16);
    expect(economy.state().acorns).toBe(before + 16);
  });

  it('plants the oak and reports its time', () => {
    const { farm, economy } = setup(500);
    const start = economy.state().acorns;
    farm.interact(BOARD.x, BOARD.z);
    const oak = { x: CROFT.oak.x + 1, z: CROFT.oak.z };
    expect(farm.prompt(oak.x, oak.z)).toBe('Plant an oak (50)');
    expect(farm.interact(oak.x, oak.z)).toBe(true);
    expect(farm.state().oak.planted).toBe(true);
    expect(economy.state().acorns).toBe(start - FARM.down - 50);

    expect(farm.prompt(oak.x, oak.z)).toBe('Check the oak');
    farm.interact(oak.x, oak.z);
    expect(toasts.at(-1)).toBe('The oak: about 20:00 to the next stage.');
  });

  it('cycles the seed on the rack', () => {
    const { farm } = setup();
    farm.interact(BOARD.x, BOARD.z);
    expect(farm.prompt(RACK.x, RACK.z)).toBe('Pick seeds: Radishes');
    farm.interact(RACK.x, RACK.z);
    expect(farm.state().seed).toBe('carrot');
  });
});
