// Styles for the towers that are not landmarks: seeded by position (the same tower always looks the same), and never
// the same facade, silhouette, crown or awning as a tower already styled within 75 m.
import { BILLBOARD_SPOTS } from '../brands';
import { FACADE } from './facadeAtlas';
import { SIGN } from './signAtlas';
import { hash2, seeded } from './kit';
import type { Crown, Silhouette, TowerSpec, TowerStyle } from './types';

const SILHOUETTES: Silhouette[] = ['box', 'setback', 'taper', 'slab', 'twin'];
const FACADES: number[] = [
  FACADE.BRICK, FACADE.BLUE_GLASS, FACADE.CONCRETE_BANDS, FACADE.SANDSTONE, FACADE.GREEN_GLASS, FACADE.WHITE_GRID,
  FACADE.DECO_CREAM, FACADE.COPPER, FACADE.PASTEL_BALCONY, FACADE.TERRACOTTA, FACADE.BRICK_WEATHERED,
];
const TINTS = [0xffffff, 0xf4f0e8, 0xeef3f7, 0xf7efe6, 0xe9f2ea];
const TRIMS = [0x6e6e74, 0x3a3d42, 0xd8cbb0, 0x5b3a29, 0x2f4858, 0xe8e4dc];
const BANDS = [0xc0392b, 0x2e86de, 0xf1c40f, 0x16a085, 0x8e44ad, 0xe67e22];
const CROWNS: Crown[] = ['flat', 'water-tank', 'antenna-farm', 'garden', 'helipad'];
const AWNINGS = [0x2e7d32, 0xc62828, 0x1565c0, 0xf9a825, 0x6a1b9a, 0x00838f];
const MURALS: number[] = [SIGN.MURAL_FLOWERS, SIGN.MURAL_HAT];

/** `list` without the values `used`, or the whole list when that leaves nothing. */
function fresh<T>(list: readonly T[], used: readonly T[]): T[] {
  const left = list.filter((v) => !used.includes(v));
  return left.length ? left : [...list];
}

/** A style for a minor tower. `near` are the styles already given to towers within 75 m (landmarks included). */
export function minorStyle(spec: TowerSpec, near: readonly TowerStyle[]): TowerStyle {
  const rnd = seeded(hash2(spec.x, spec.z) ^ 0x51ab);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rnd() * list.length) % list.length];

  const silList = SILHOUETTES.filter((s) => s !== 'twin' || (spec.w >= 14 && spec.d >= 14));
  const silhouette = pick(fresh(silList, near.map((n) => n.silhouette)));
  let facade = pick(fresh(FACADES, near.map((n) => n.facade)));
  const facadeTint = pick(TINTS);
  const trim = pick(TRIMS);
  const band = rnd() < 0.5 ? 0 : pick(BANDS);
  const accent = pick(BANDS);
  let ribs = rnd() < 0.4;
  const balconies = rnd() < 0.3;
  if (ribs && balconies) ribs = false;
  let crown: Crown = spec.capped
    ? pick(['flat', 'helipad'] as Crown[])
    : pick(fresh(CROWNS, near.map((n) => n.crown)));
  const billboard = BILLBOARD_SPOTS.some((b) => b.rooftop
    && Math.abs(b.x - spec.x) <= spec.w / 2 + 12 && Math.abs(b.z - spec.z) <= spec.d / 2 + 12);
  if (billboard) crown = 'billboard';
  const lobby = rnd() < 0.7 ? 'shops' : 'lobby';
  const awning = pick(fresh(AWNINGS, near.map((n) => n.awning)));
  const weathering = rnd() < 0.2 ? 'stains' : 'none';
  if (weathering === 'stains' && facade === FACADE.BRICK) facade = FACADE.BRICK_WEATHERED;
  let mural = -1;
  if (rnd() < 0.25) {
    const left = MURALS.filter((m) => !near.some((n) => n.mural === m));
    mural = left.length ? pick(left) : -1;
  }
  return {
    silhouette, facade, facadeTint, trim, band, ribs, balconies, crown, accent, lobby, awning, weathering, sign: -1, mural,
  };
}
