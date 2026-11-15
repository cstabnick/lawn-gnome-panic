import { describe, it, expect } from 'vitest';
import { MINIGAMES, minigamePool, pickMinigame } from './minigames';

const ids = MINIGAMES.map((m) => m.meta.id);

describe('mini-game pool', () => {
  it('is every slice when nothing is chosen', () => {
    expect(minigamePool().length).toBe(MINIGAMES.length);
    expect(minigamePool([]).length).toBe(MINIGAMES.length);
    expect(minigamePool(['no-such-slice']).length).toBe(MINIGAMES.length);
  });

  it('only picks chosen slices', () => {
    const chosen = ids.slice(0, 2);
    for (let i = 0; i < 50; i++) {
      const r = i / 50;
      expect(chosen).toContain(pickMinigame(() => r, [], chosen).meta.id);
    }
  });

  it('repeats the only chosen slice even when it was just played', () => {
    expect(pickMinigame(() => 0.5, [ids[0], ids[0]], [ids[0]]).meta.id).toBe(ids[0]);
  });
});
