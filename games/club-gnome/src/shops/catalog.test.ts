// Every shop cosmetic is granted by its own achievement, whose reward is that exact item in that slot.
import { describe, expect, it } from 'vitest';
import { getAchievement } from '@lawn/achievements';
import { getPrefab } from '@lawn/prefabs';
import { HAIR_STYLES } from '@lawn/gnome';
import { HAIR_PRICES, MARKET_ITEMS, PRIZE_COMING_SOON, PRIZE_ITEMS } from './catalog';

describe('shop catalog', () => {
  for (const item of [...PRIZE_ITEMS, ...MARKET_ITEMS]) {
    it(`${item.id} is granted by ${item.achievementId}`, () => {
      expect(getPrefab(item.prefabId), item.prefabId).toBeDefined();
      const a = getAchievement(item.achievementId);
      expect(a?.game).toBe('club-gnome');
      expect(a?.reward).toMatchObject({ slot: item.slot, prefabId: item.prefabId });
      expect(a?.description).toContain(item.price.toLocaleString('en-US'));
    });
  }

  it('has six modelled prizes, six coming soon and six market items', () => {
    expect(PRIZE_ITEMS.length).toBe(6);
    expect(PRIZE_COMING_SOON.length).toBe(6);
    expect(MARKET_ITEMS.length).toBe(6);
  });

  it('prices every hair style but the free pigtails', () => {
    for (const h of HAIR_STYLES) {
      if (h.id === 'pigtails') expect(HAIR_PRICES[h.id]).toBeUndefined();
      else expect(HAIR_PRICES[h.id]).toBeGreaterThan(0);
    }
  });
});
