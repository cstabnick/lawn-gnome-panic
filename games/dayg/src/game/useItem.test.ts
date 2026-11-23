import { describe, it, expect, vi } from 'vitest';
import { createInventory } from './inventory';
import { createUseApi } from './useItem';
import { createBus } from './bus';
import { createNeedsSystem } from './needs';
import { createBodySystem } from './body';
import { TUNING } from '../sim/tuning';
import type { ItemStack, WeatherState } from '../sim/types';
import type { CampSystem, PlayerState, StackRef, UseAction } from './types';

const stack = (def: string, count = 1, condition = 1): ItemStack => ({ def, count, condition });

interface Rig {
  inv: ReturnType<typeof createInventory>;
  needs: ReturnType<typeof createNeedsSystem>;
  body: ReturnType<typeof createBodySystem>;
  use: ReturnType<typeof createUseApi>;
  placeFire: ReturnType<typeof vi.fn>;
  nearFire: { value: boolean };
}

// A real inventory, needs, body and recipes. Only the camp (3D fire) and the player/weather are stubbed.
function rig(start: ItemStack[], opts: { fireNear?: boolean; placeOk?: boolean } = {}): Rig {
  const bus = createBus();
  const inv = createInventory(start);
  const needs = createNeedsSystem(bus, TUNING);
  const body = createBodySystem(bus, () => 0, TUNING);
  const nearFire = { value: opts.fireNear ?? true };
  const placeFire = vi.fn(() => opts.placeOk ?? true);
  const camp = {
    nearFire: () => nearFire.value,
    placeFire,
  } as unknown as CampSystem;
  const player = { pos: { x: 0, y: 0, z: 0 }, facing: 0, haven: null } as unknown as PlayerState;
  const weather = { kind: 'clear' } as unknown as WeatherState;
  const use = createUseApi({ inv, needs, body, camp, bus, rng: () => 0, getPlayer: () => player, getWeather: () => weather });
  return { inv, needs, body, use, placeFire, nearFire };
}

// Finds the action with a given id for the stack at `ref`, failing the test if it is not offered.
function actionFor(r: Rig, ref: StackRef, id: string): UseAction {
  const a = r.use.actionsFor(ref).find((x) => x.id === id);
  if (!a) throw new Error(`action ${id} not offered for ${JSON.stringify(ref)}`);
  return a;
}

// Runs a timed action to completion through the same start/update path the panel uses.
function runToEnd(r: Rig, action: UseAction): void {
  expect(r.use.start(action)).toBe(true);
  r.use.update(action.seconds + 0.01);
  expect(r.use.busy()).toBeNull();
}

const packRef = (index: number): StackRef => ({ where: 'pack', index });

describe('useItem: eat and drink', () => {
  it('eats one food item from the pack and raises food', () => {
    const r = rig([stack('bread-loaf', 2)]);
    r.needs.state.food = 10;
    runToEnd(r, actionFor(r, packRef(0), 'eat'));
    expect(r.inv.state.pack[0].count).toBe(1);
    expect(r.needs.state.food).toBeGreaterThan(10);
  });

  it('removes the last food item from the pack', () => {
    const r = rig([stack('bread-loaf', 1)]);
    runToEnd(r, actionFor(r, packRef(0), 'eat'));
    expect(r.inv.state.pack).toHaveLength(0);
  });

  it('drinks a whole DRINK item (bottle) and removes it', () => {
    const r = rig([stack('spigot-water', 1)]);
    r.needs.state.water = 10;
    runToEnd(r, actionFor(r, packRef(0), 'drink'));
    expect(r.inv.state.pack).toHaveLength(0);
    expect(r.needs.state.water).toBeGreaterThan(10);
  });

  it('sips a HOLD_LIQUID container: litres drop, the stack stays, and the sip is reflected on the live stack', () => {
    const r = rig([{ ...stack('clay-jar', 1), liquid: { kind: 'clean', litres: 0.6 } }]);
    const drink = actionFor(r, packRef(0), 'drink');
    runToEnd(r, drink);
    const after = r.inv.state.pack[0];
    expect(after).toBeDefined();
    expect(after.count).toBe(1);
    expect(after.liquid?.litres).toBeCloseTo(0.35, 6);
    // The live object the panel reads is the one that changed.
    expect(r.inv.get(packRef(0))?.liquid?.litres).toBeCloseTo(0.35, 6);
  });

  it('empties a HOLD_LIQUID container down to no liquid and drops the liquid field', () => {
    const r = rig([{ ...stack('clay-jar', 1), liquid: { kind: 'clean', litres: 0.25 } }]);
    runToEnd(r, actionFor(r, packRef(0), 'drink'));
    expect(r.inv.get(packRef(0))?.liquid).toBeUndefined();
    expect(r.inv.state.pack).toHaveLength(1);
    expect(r.use.actionsFor(packRef(0)).some((a) => a.id === 'drink')).toBe(false);
  });

  it('does not offer Drink on an empty HOLD_LIQUID container', () => {
    const r = rig([stack('clay-jar', 1)]);
    expect(r.use.actionsFor(packRef(0)).some((a) => a.id === 'drink')).toBe(false);
  });

  it('does not consume the container when a drink starts on an emptied HOLD_LIQUID stack', () => {
    const r = rig([{ ...stack('clay-jar', 1), liquid: { kind: 'clean', litres: 0.25 } }]);
    const drink = actionFor(r, packRef(0), 'drink');
    r.inv.get(packRef(0))!.liquid = undefined;
    r.use.start(drink);
    r.use.update(10);
    expect(r.inv.state.pack).toHaveLength(1);
  });
});

describe('useItem: wear, take off, hold, put away, drop', () => {
  it('wears gear into its worn slot and takes it off into the pack', () => {
    const r = rig([]);
    r.inv.add(stack('bucket-helm', 1));
    expect(r.use.actionsFor(packRef(0)).some((a) => a.id === 'wear')).toBe(true);
    runToEnd(r, actionFor(r, packRef(0), 'wear'));
    expect(r.inv.state.worn.head?.def).toBe('bucket-helm');
    expect(r.inv.state.pack).toHaveLength(0);

    const worn = { where: 'worn', slot: 'head' } as StackRef;
    runToEnd(r, actionFor(r, worn, 'unwear'));
    expect(r.inv.state.worn.head).toBeUndefined();
    expect(r.inv.state.pack.map((s) => s.def)).toEqual(['bucket-helm']);
  });

  it('does not offer Eat or Drink on worn gear', () => {
    const r = rig([]);
    r.inv.add(stack('bucket-helm', 1));
    runToEnd(r, actionFor(r, packRef(0), 'wear'));
    const ids = r.use.actionsFor({ where: 'worn', slot: 'head' }).map((a) => a.id);
    expect(ids).toEqual(['unwear', 'drop']);
  });

  it('take off appends to the pack when the index equals the pack length', () => {
    const r = rig([stack('bread-loaf', 1)]);
    r.inv.add(stack('bucket-helm', 1));
    runToEnd(r, actionFor(r, packRef(1), 'wear'));
    expect(r.inv.state.pack.map((s) => s.def)).toEqual(['bread-loaf']);
    r.inv.move({ where: 'worn', slot: 'head' }, { where: 'pack', index: r.inv.state.pack.length });
    expect(r.inv.state.pack.map((s) => s.def)).toEqual(['bread-loaf', 'bucket-helm']);
  });

  it('holds a pack item in hand 0 and swaps the old hand item into the pack', () => {
    const r = rig([stack('old-trowel', 1), stack('bread-loaf', 1)]);
    // Start: the trowel is in hand 0. Hold the bread: the trowel goes back to the pack.
    expect(r.inv.held()?.def).toBe('old-trowel');
    const hold = actionFor(r, packRef(r.inv.state.pack.findIndex((s) => s.def === 'bread-loaf')), 'hold');
    expect(r.use.start(hold)).toBe(true);
    expect(r.inv.held()?.def).toBe('bread-loaf');
    expect(r.inv.state.pack.map((s) => s.def)).toContain('old-trowel');
  });

  it('puts a hand item away into the pack (append)', () => {
    const r = rig([stack('thorn-dagger', 1), stack('bread-loaf', 1)]);
    const stow = actionFor(r, { where: 'hand', index: 0 }, 'stow');
    expect(r.use.start(stow)).toBe(true);
    expect(r.inv.state.hands[0]).toBeNull();
    expect(r.inv.state.pack[r.inv.state.pack.length - 1].def).toBe('thorn-dagger');
  });

  it('drops the whole stack', () => {
    const r = rig([stack('bread-loaf', 3)]);
    expect(r.use.start(actionFor(r, packRef(0), 'drop'))).toBe(true);
    expect(r.inv.state.pack).toHaveLength(0);
  });
});

describe('useItem: timed actions', () => {
  it('reports progress while a timed action runs and cancels cleanly', () => {
    const r = rig([stack('bread-loaf', 1)]);
    const eat = actionFor(r, packRef(0), 'eat');
    expect(r.use.start(eat)).toBe(true);
    r.use.update(1);
    expect(r.use.busy()?.progress).toBeCloseTo(0.5, 6);
    // A second action cannot start while one runs.
    expect(r.use.start(actionFor(r, packRef(0), 'drop'))).toBe(false);
    r.use.cancel();
    expect(r.use.busy()).toBeNull();
    expect(r.inv.state.pack[0].count).toBe(1);
  });
});

describe('useItem: recipes', () => {
  it('lays a fire with tinder and fuel, using the firestarter as the tool', () => {
    const r = rig([stack('twig-bundle', 2), stack('flint-striker', 1)]);
    expect(r.use.recipes().find((x) => x.def.id === 'campfire')?.ok).toBe(true);
    runToEnd(r, { id: 'recipe-campfire', label: 'Fire', seconds: 20, kind: 'recipe', recipe: 'campfire' });
    expect(r.placeFire).toHaveBeenCalledTimes(1);
    expect(r.inv.countTag('TINDER')).toBe(0);
    expect(r.inv.countTag('FUEL')).toBe(0);
  });

  it('keeps the tinder and fuel when the fire cannot be placed', () => {
    const r = rig([stack('twig-bundle', 2), stack('flint-striker', 1)], { placeOk: false });
    runToEnd(r, { id: 'recipe-campfire', label: 'Fire', seconds: 20, kind: 'recipe', recipe: 'campfire' });
    expect(r.placeFire).toHaveBeenCalledTimes(1);
    expect(r.inv.countTag('TINDER')).toBe(2);
  });

  it('refuses a fire without a firestarter', () => {
    const r = rig([stack('twig-bundle', 2)]);
    const campfire = r.use.recipes().find((x) => x.def.id === 'campfire');
    expect(campfire?.ok).toBe(false);
    expect(campfire?.why).toBe('Needs FIRESTARTER');
    expect(r.use.start({ id: 'x', label: 'Fire', seconds: 20, kind: 'recipe', recipe: 'campfire' })).toBe(false);
  });

  it('boils dirty water in a cooking vessel at a fire and makes it clean', () => {
    const r = rig([{ ...stack('tin-pail', 1), liquid: { kind: 'dirty', litres: 1 } }]);
    expect(r.use.recipes().find((x) => x.def.id === 'boil-water')?.ok).toBe(true);
    runToEnd(r, { id: 'recipe-boil-water', label: 'Boil', seconds: 35, kind: 'recipe', recipe: 'boil-water' });
    expect(r.inv.get(packRef(0))?.liquid?.kind).toBe('clean');
  });

  it('will not boil without a fire nearby', () => {
    const r = rig([{ ...stack('tin-pail', 1), liquid: { kind: 'dirty', litres: 1 } }], { fireNear: false });
    expect(r.use.recipes().find((x) => x.def.id === 'boil-water')?.ok).toBe(false);
  });

  it('will not offer a boil when the vessel has no dirty water', () => {
    const r = rig([stack('tin-pail', 1)]);
    expect(r.use.recipes().find((x) => x.def.id === 'boil-water')?.ok).toBe(false);
  });

  it('salt-washes an infected crack and cures the infection', () => {
    const r = rig([stack('salt-pinch', 1), { ...stack('spigot-water', 1) }]);
    // Salt wash needs 0.2 L clean water on top of the salt.
    r.body.state.infection = { part: 'head', hours: 0, stage: 0 };
    expect(r.use.recipes().find((x) => x.def.id === 'salt-wash')?.ok).toBe(true);
    runToEnd(r, { id: 'recipe-salt-wash', label: 'Salt', seconds: 10, kind: 'recipe', recipe: 'salt-wash' });
    expect(r.body.state.infection).toBeNull();
    expect(r.inv.countTag('SALT')).toBe(0);
  });

  it('refuses an infection treatment when there is no infection', () => {
    const r = rig([stack('salt-pinch', 1), stack('spigot-water', 1)]);
    const salt = r.use.recipes().find((x) => x.def.id === 'salt-wash');
    expect(salt?.ok).toBe(false);
    expect(salt?.why).toBe('No infection to treat');
  });

  it('glazes a crack', () => {
    const r = rig([stack('glaze-pot', 1)]);
    r.body.state.cracks.head = 2;
    runToEnd(r, { id: 'recipe-mend-glaze', label: 'Glaze', seconds: 25, kind: 'recipe', recipe: 'mend-glaze' });
    expect(r.body.state.cracks.head).toBe(1);
    expect(r.inv.countTag('GLAZE')).toBe(0);
  });
});
