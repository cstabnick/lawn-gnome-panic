import { describe, expect, it } from 'vitest';
import { BRANDS } from '../brands';
import { SKY } from './config';
import { READABLE_AD_COUNT, SKY_ADS, nextAd } from './ads';

describe('sky ads', () => {
  it('has 34 ads with unique ids', () => {
    expect(SKY_ADS).toHaveLength(34);
    const ids = new Set(SKY_ADS.map((a) => a.id));
    expect(ids.size).toBe(SKY_ADS.length);
  });

  it('has 32 non-egg ads, matching READABLE_AD_COUNT', () => {
    const readable = SKY_ADS.filter((a) => !a.egg);
    expect(readable).toHaveLength(32);
    expect(READABLE_AD_COUNT).toBe(32);
  });

  it('has exactly two readable ads per brand, with ids <brandId>-1 and <brandId>-2', () => {
    for (const brandId of Object.keys(BRANDS)) {
      const ads = SKY_ADS.filter((a) => !a.egg && a.brand === brandId);
      expect(ads.map((a) => a.id).sort(), brandId).toEqual([`${brandId}-1`, `${brandId}-2`]);
    }
  });

  it('uses only known brands', () => {
    for (const a of SKY_ADS) expect(BRANDS[a.brand], a.id).toBeDefined();
  });

  it('has two eggs with ids starting egg-', () => {
    const eggs = SKY_ADS.filter((a) => a.egg);
    expect(eggs).toHaveLength(2);
    for (const e of eggs) expect(e.id.startsWith('egg-')).toBe(true);
  });

  it('keeps headlines upper case and at most 28 characters, taglines at most 48', () => {
    for (const a of SKY_ADS) {
      expect(a.headline, a.id).toBe(a.headline.toUpperCase());
      expect(a.headline.length, a.id).toBeLessThanOrEqual(28);
      expect(a.tagline.length, a.id).toBeLessThanOrEqual(48);
      expect(a.tagline.length, a.id).toBeGreaterThan(0);
    }
  });

  it('nextAd never returns prevId over 500 calls with Math.random', () => {
    for (const prev of ['buck-iron-1', 'egg-wally-stall', null]) {
      for (let n = 0; n < 500; n++) {
        const ad = nextAd(prev, Math.random);
        expect(ad.id).not.toBe(prev);
      }
    }
  });

  it('nextAd returns an egg when rng is 0 (below eggChance)', () => {
    expect(0).toBeLessThan(SKY.eggChance);
    const ad = nextAd(null, () => 0);
    expect(ad.egg).toBe(true);
  });

  it('nextAd returns a readable ad when rng is just above eggChance', () => {
    const ad = nextAd(null, () => SKY.eggChance + 0.01);
    expect(ad.egg).toBeFalsy();
  });
});
