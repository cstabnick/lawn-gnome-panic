// Tower silhouettes: a spec and a style in, the solid masses out (pure data, no three.js, no randomness).
// Every mass stays inside the footprint and under spec.h (the collider); see Mass in types.ts for the stacking rules.
import { FACADE } from './facadeAtlas';
import { LOBBY_H } from './kit';
import type { Mass, TowerSpec, TowerStyle } from './types';

/** The masses of one tower, ground floor first. */
export function massesFor(spec: TowerSpec, style: TowerStyle): Mass[] {
  const { x, z, w, d, h } = spec;
  const out: Mass[] = [
    { shape: 'box', x, z, w, d, y0: 0, y1: LOBBY_H, facade: style.lobby === 'shops' ? FACADE.SHOPS : FACADE.LOBBY },
  ];
  const b = LOBBY_H - 0.1;
  const alongX = w >= d;
  const L = Math.max(w, d), S = Math.min(w, d);
  /** A box offset `a` along L and `c` across it, `la` long along L and `sa` across. */
  const ls = (a: number, c: number, la: number, sa: number, y0: number, y1: number): Mass => alongX
    ? { shape: 'box', x: x + a, z: z + c, w: la, d: sa, y0, y1 }
    : { shape: 'box', x: x + c, z: z + a, w: sa, d: la, y0, y1 };
  const centred = (fw: number, fd: number, y0: number, y1: number): Mass => ({ shape: 'box', x, z, w: fw, d: fd, y0, y1 });
  /** Stacked tiers: [fraction of w/d, top y] from the bottom; each starts 0.1 below the previous top. */
  const stack = (tiers: [number, number][]): void => {
    let y0 = b;
    for (const [f, y1] of tiers) {
      out.push(centred(w * f, d * f, y0, y1));
      y0 = y1 - 0.1;
    }
  };

  switch (style.silhouette) {
    case 'box':
      out.push(centred(w, d, b, h));
      break;
    case 'setback':
      if (h >= 40) stack([[1, 0.6 * h], [0.72, 0.82 * h], [0.46, h]]);
      else stack([[1, 0.65 * h], [0.6, h]]);
      break;
    case 'taper': {
      const tiers: [number, number][] = [[1, 0.7 * h]];
      for (let k = 1; k <= 3; k++) tiers.push([1 - 2 * k * 0.08, 0.7 * h + (0.3 * h * k) / 3]);
      tiers[3][1] = h;
      stack(tiers);
      break;
    }
    case 'twin': {
      const P = Math.min(14, 0.25 * h);
      out.push(centred(w, d, b, P));
      const off = L / 2 - 0.19 * L;
      out.push(ls(-off, 0, 0.38 * L, 0.8 * S, P - 0.1, h));
      out.push(ls(off, 0, 0.38 * L, 0.8 * S, P - 0.1, 0.88 * h));
      break;
    }
    case 'lean': {
      const step = (h - b) / 6;
      let y0 = b;
      for (let k = 0; k < 6; k++) {
        const y1 = k === 5 ? h : b + step * (k + 1);
        out.push(ls(-0.09 * L + (k * 0.18 * L) / 5, 0, 0.82 * L, 0.82 * S, y0, y1));
        y0 = y1 - 0.1;
      }
      break;
    }
    case 'ziggurat': {
      const step = (h - b) / 5;
      const tiers: [number, number][] = [];
      for (let i = 0; i < 5; i++) tiers.push([1 - 0.16 * i, i === 4 ? h : b + step * (i + 1)]);
      stack(tiers);
      break;
    }
    case 'drum': {
      const P = Math.min(12, 0.2 * h);
      out.push(centred(w, d, b, P));
      out.push({ shape: 'cyl', x, z, w: 0.82 * S, d: 0.82 * S, y0: P - 0.1, y1: h });
      break;
    }
    case 'hblock': {
      const wing = 0.34 * L;
      const off = L / 2 - wing / 2;
      out.push(ls(-off, 0, wing, S, b, h));
      out.push(ls(off, 0, wing, S, b, h));
      out.push(ls(0, 0, L - 2 * wing + 0.6, 0.5 * S, b, 0.75 * h));
      break;
    }
    case 'slab': {
      out.push(ls(0, -(S / 2 - 0.31 * S), L, 0.62 * S, b, h));
      const coreS = 0.38 * S + 0.3;
      out.push(ls(0, S / 2 - coreS / 2, 0.35 * L, coreS, b, Math.min(h - 3, 0.92 * h)));
      break;
    }
  }
  return out;
}
