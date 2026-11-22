import { describe, expect, it } from 'vitest';
import type { PlayerInfo } from '@lawn/mp/protocol';
import { parseGsrNetMsg, toGsrPeer } from './protocol';

describe('Gnom Set Radio net protocol', () => {
  it('toGsrPeer preserves PlayerInfo.userId for gear sync', () => {
    const info: PlayerInfo = {
      id: 7,
      name: 'TagAce',
      character: 'g1.00000000',
      color: 0xff4ecd,
      userId: 'u_abc123',
    };
    const peer = toGsrPeer(info);
    expect(peer).toEqual({
      id: 7,
      name: 'TagAce',
      character: 'g1.00000000',
      color: 0xff4ecd,
      userId: 'u_abc123',
    });

    const anon = toGsrPeer({ id: 8, name: 'Guest', character: 'g1.00000000', color: 0x00e5ff });
    expect(anon.userId).toBeUndefined();
  });

  it('parses valid pos, trick, and spray messages across all 9 areas', () => {
    expect(
      parseGsrNetMsg({
        k: 'pos',
        area: 'mulch-alley',
        p: [1.5, 4.2, -12, 0.5, 6, 0, -2, 3],
        t: 12345,
      }),
    ).toEqual({
      k: 'pos',
      area: 'mulch-alley',
      p: [1.5, 4.2, -12, 0.5, 6, 0, -2, 3],
      t: 12345,
    });

    expect(
      parseGsrNetMsg({
        k: 'trick',
        area: 'zero-hz-zenith',
        kind: 'cork',
        name: 'Aether Cork',
      }),
    ).toEqual({
      k: 'trick',
      area: 'zero-hz-zenith',
      kind: 'cork',
      name: 'Aether Cork',
    });

    expect(
      parseGsrNetMsg({
        k: 'spray',
        area: 'tupperware-mall',
        x: 10,
        y: 5.2,
        z: -8,
        tagId: 'tm-cart',
        bbId: 'tm-bb-1',
      }),
    ).toEqual({
      k: 'spray',
      area: 'tupperware-mall',
      x: 10,
      y: 5.2,
      z: -8,
      tagId: 'tm-cart',
      bbId: 'tm-bb-1',
    });
  });

  it('rejects malformed, out-of-bounds, or unknown-area messages', () => {
    expect(parseGsrNetMsg(null)).toBeNull();
    expect(parseGsrNetMsg({ k: 'pos', area: 'unknown-area', p: [0, 0, 0, 0, 0, 0, 0, 0], t: 1 })).toBeNull();
    expect(parseGsrNetMsg({ k: 'pos', area: 'velvet-keys', p: [999, 0, 0, 0, 0, 0, 0, 0], t: 1 })).toBeNull();
    expect(parseGsrNetMsg({ k: 'trick', area: 'velvet-keys', kind: 'invalid', name: 'Flip' })).toBeNull();
    expect(parseGsrNetMsg({ k: 'spray', area: 'velvet-keys', x: NaN, y: 0, z: 0, tagId: 'vk-keys' })).toBeNull();
  });
});
