import { afterEach, describe, expect, it } from 'vitest';
import { CRAFT_TUNE_KEY, craftTuneStorageForTest, getCraftTune, onCraftTuneChange, saveCraftTune, type TuneStorage } from './craftTuneStore';
import { NO_TUNE } from './tuning';

function memoryStorage(initial: Record<string, string> = {}): TuneStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
  };
}

const throwingStorage: TuneStorage = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
};

afterEach(() => craftTuneStorageForTest(null));

describe('craft tune store', () => {
  it('save then reload from the same storage returns the tune', () => {
    const s = memoryStorage();
    craftTuneStorageForTest(s);
    saveCraftTune('hedge-hopper', { engine: 2, topSpeed: 0, handling: 1, lift: 3 });
    expect(JSON.parse(s.data[CRAFT_TUNE_KEY])).toEqual({ 'hedge-hopper': { engine: 2, topSpeed: 0, handling: 1, lift: 3 } });
    craftTuneStorageForTest(s);
    expect(getCraftTune('hedge-hopper')).toEqual({ engine: 2, topSpeed: 0, handling: 1, lift: 3 });
  });

  it('garbage JSON gives stock', () => {
    craftTuneStorageForTest(memoryStorage({ [CRAFT_TUNE_KEY]: '{not json' }));
    expect(getCraftTune('hedge-hopper')).toEqual(NO_TUNE);
    craftTuneStorageForTest(memoryStorage({ [CRAFT_TUNE_KEY]: '[1,2]' }));
    expect(getCraftTune('hedge-hopper')).toEqual(NO_TUNE);
  });

  it('drops unknown kinds and clamps saved values', () => {
    craftTuneStorageForTest(memoryStorage({
      [CRAFT_TUNE_KEY]: JSON.stringify({ 'no-such-kind': { engine: 3 }, 'hedge-hopper': { engine: 9 } }),
    }));
    expect(getCraftTune('hedge-hopper').engine).toBe(3);
    expect(getCraftTune('no-such-kind' as never)).toEqual(NO_TUNE);
  });

  it('a throwing storage never throws out of save or get', () => {
    craftTuneStorageForTest(throwingStorage);
    expect(() => saveCraftTune('hedge-hopper', { ...NO_TUNE, engine: 1 })).not.toThrow();
    expect(() => getCraftTune('hedge-hopper')).not.toThrow();
    expect(getCraftTune('hedge-hopper').engine).toBe(1);
  });

  it('a listener is called with the kind', () => {
    craftTuneStorageForTest(memoryStorage());
    const seen: string[] = [];
    const off = onCraftTuneChange((k) => seen.push(k));
    saveCraftTune('sycamore-copter', { ...NO_TUNE, lift: 1 });
    off();
    saveCraftTune('sycamore-copter', { ...NO_TUNE, lift: 2 });
    expect(seen).toEqual(['sycamore-copter']);
  });

  it('getCraftTune returns a copy', () => {
    craftTuneStorageForTest(memoryStorage());
    saveCraftTune('hedge-hopper', { ...NO_TUNE, engine: 1 });
    const t = getCraftTune('hedge-hopper');
    t.engine = 3;
    expect(getCraftTune('hedge-hopper').engine).toBe(1);
  });

  it('all stock deletes the entry', () => {
    const s = memoryStorage();
    craftTuneStorageForTest(s);
    saveCraftTune('hedge-hopper', { ...NO_TUNE, engine: 1 });
    saveCraftTune('hedge-hopper', NO_TUNE);
    expect(JSON.parse(s.data[CRAFT_TUNE_KEY])).toEqual({});
  });
});
