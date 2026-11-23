import { describe, expect, it } from 'vitest';
import { PAY_N_GLAZE } from './config';
import { SPEEDWAY_GLAZE } from './raceTrack/track';
import { GLAZE_BAYS, glazeBayNear } from './glazeBay';

describe('glazeBayNear', () => {
  it("finds Turfton's bay at PAY_N_GLAZE.bay", () => {
    expect(glazeBayNear(PAY_N_GLAZE.bay.x, PAY_N_GLAZE.bay.z)?.id).toBe('turfton');
  });

  it("finds the Speedway's bay at SPEEDWAY_GLAZE.bay", () => {
    expect(glazeBayNear(SPEEDWAY_GLAZE.bay.x, SPEEDWAY_GLAZE.bay.z)?.id).toBe('speedway');
  });

  it('lists both bays', () => {
    expect(GLAZE_BAYS.map((b) => b.id)).toEqual(['turfton', 'speedway']);
  });

  it('returns null far from both bays', () => {
    expect(glazeBayNear(0, 0)).toBeNull();
  });

  it('extra widens the reach', () => {
    const r = PAY_N_GLAZE.bay.radius;
    const x = PAY_N_GLAZE.bay.x + r + 2;
    const z = PAY_N_GLAZE.bay.z;
    expect(glazeBayNear(x, z)).toBeNull();
    expect(glazeBayNear(x, z, 4)?.id).toBe('turfton');
  });
});
