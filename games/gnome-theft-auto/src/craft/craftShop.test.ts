import { describe, expect, it } from 'vitest';
import { VEHICLES } from '../config';
import type { Vehicle, VehicleKind } from '../types';
import { canOpenCraftShop } from './craftShop';

/** A plain stand-in for a Vehicle: only the fields canOpenCraftShop reads, set to a stopped, player-driven boat by default. */
function craft(kind: VehicleKind, over: Partial<Record<string, unknown>> = {}): Vehicle {
  const spec = VEHICLES[kind];
  const base = {
    id: 1,
    kind,
    spec,
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    speed: 0,
    vy: 0,
    driver: 'player',
    tint: 0xc8342c,
    hp: 1,
    exploded: false,
    sunk: false,
  };
  return { ...base, ...over } as unknown as Vehicle;
}

const BOAT: VehicleKind = 'walnut-dinghy';
const FLYER: VehicleKind = 'hedge-hopper';
const MOWER: VehicleKind = 'ride-on';

describe('canOpenCraftShop', () => {
  it('opens on a stopped boat the player drives', () => {
    expect(VEHICLES[BOAT].boat).toBe(true);
    expect(canOpenCraftShop(craft(BOAT))).toBe(true);
  });

  it('does not open on a moving boat', () => {
    expect(canOpenCraftShop(craft(BOAT, { speed: 3 }))).toBe(false);
  });

  it('does not open on an airborne aircraft', () => {
    expect(VEHICLES[FLYER].air).toBeTruthy();
    expect(canOpenCraftShop(craft(FLYER, { air: { airborne: true } }))).toBe(false);
  });

  it('does not open on a ground mower', () => {
    expect(canOpenCraftShop(craft(MOWER))).toBe(false);
  });

  it('does not open on a boat an NPC drives', () => {
    expect(canOpenCraftShop(craft(BOAT, { driver: 'npc' }))).toBe(false);
  });

  it('does not open on nothing, or on a wrecked boat', () => {
    expect(canOpenCraftShop(null)).toBe(false);
    expect(canOpenCraftShop(craft(BOAT, { sunk: true }))).toBe(false);
    expect(canOpenCraftShop(craft(BOAT, { exploded: true }))).toBe(false);
  });
});
