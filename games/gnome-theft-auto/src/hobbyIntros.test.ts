import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./cutscene/introCard', () => ({ showCharacterIntro: vi.fn(() => Promise.resolve()) }));
import { showCharacterIntro } from './cutscene/introCard';
import { CAST_INTROS } from './cutscene/castIntros';
import { SHOP } from './fishing/types';
import { installHobbyIntros, type HobbyIntrosDeps } from './hobbyIntros';
import type { QuestSave } from './quests/types';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
  };
}

const done = (): QuestSave => ({ state: 'done', step: 0, cracked: [] });

describe('hobby intro cards', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    vi.mocked(showCharacterIntro).mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function rig(saves: Record<string, QuestSave> = {}) {
    const unlock = vi.fn();
    const deps: HobbyIntrosDeps = {
      player: { x: SHOP.x, z: SHOP.z },
      onFoot: () => true,
      saves: () => saves,
      unlock,
    };
    return { deps, unlock, intros: installHobbyIntros(deps) };
  }

  it('shows Wenna once when the player stands at the Bent Pin', () => {
    const { intros } = rig();
    intros.update(0.25);
    expect(showCharacterIntro).toHaveBeenCalledTimes(1);
    expect(vi.mocked(showCharacterIntro).mock.calls[0][0]).toBe(CAST_INTROS.wenna);

    intros.update(0.25);
    intros.update(0.25);
    expect(showCharacterIntro).toHaveBeenCalledTimes(1);
  });

  it('remembers shown cards across a reload', () => {
    rig().intros.update(0.25);
    expect(showCharacterIntro).toHaveBeenCalledTimes(1);

    const again = rig();
    again.intros.update(0.25);
    expect(showCharacterIntro).toHaveBeenCalledTimes(1);
  });

  it('does not show cards off foot', () => {
    const unlock = vi.fn();
    const intros = installHobbyIntros({
      player: { x: SHOP.x, z: SHOP.z },
      onFoot: () => false,
      saves: () => ({}),
      unlock,
    });
    intros.update(0.25);
    expect(showCharacterIntro).not.toHaveBeenCalled();
  });

  it('unlocks Rod, Comb and Notebook once, when all three hobby intros are done', () => {
    const { intros, unlock } = rig({ 'nc-bent-pin': done(), 'nc-tuft-and-tally': done() });
    intros.update(2);
    expect(unlock).not.toHaveBeenCalled();

    const all = rig({ 'nc-bent-pin': done(), 'nc-tuft-and-tally': done(), 'nc-reedwatch': done() });
    all.intros.update(2);
    all.intros.update(2);
    expect(all.unlock).toHaveBeenCalledTimes(1);
    expect(all.unlock).toHaveBeenCalledWith('gta-rod-comb-notebook');
  });
});
