// Regression: "stuff spawns in the road". Static props (HOA signs, vibe set pieces, acorn pickups) must not stand on asphalt.
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { installFakeDom } from './testing/fakeDom';
import { BODEGA, CULVERT_PORTALS, GNOMECINO, GREENHOUSE_STRIP, PATIO_HEIGHTS } from './config';
import { GOLDEN_ACORN_SPOTS, HOA_SIGN_SPOTS } from './easterEggs';
import { surfaceAt } from './surfaces';
import { vibeSetPieceSpots } from './vibeNpcs';
import type { World } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));

describe('props stay off the road', () => {
  it('no HOA sign, vibe set piece or acorn pickup centre is on asphalt on the real map', async () => {
    installFakeDom();
    const { buildWorld } = await import('./world');
    const world: World = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
    const onRoad = (x: number, z: number) => surfaceAt(x, z, world).kind === 'asphalt';

    // Set pieces anchored by vibeSetPieceSpots (moved by clearProp), then the other vibe anchors already clear of the road.
    const vibe = vibeSetPieceSpots(world);
    const anchors: Array<[string, number, number]> = [
      ...Object.entries(vibe).map(([id, p]): [string, number, number] => [id, p.x, p.z]),
      ['bodega', BODEGA.x + 6, BODEGA.z],
      ['sal', CULVERT_PORTALS.downtown.x + 3, CULVERT_PORTALS.downtown.z],
      ['ernie', -250, -55],
      ['nina', GREENHOUSE_STRIP.minX + 6, GREENHOUSE_STRIP.minZ + 12],
      ['thimble', -588, -120],
      ['gnomecino', GNOMECINO.x - 14, GNOMECINO.z],
      ['vibe-558-40', -558, 40],
      ['vibe-9-32', 9, 32],
      ['vibe-53-230', 53, 230],
      ['thermos-barrel', vibe.thermos.x + 1.2, vibe.thermos.z - 0.7],
      ['gate-guard-podium', vibe.gary.x + 0.7, vibe.gary.z + 0.9],
    ];
    const hits: string[] = [];
    for (const [id, x, z] of anchors) if (onRoad(x, z)) hits.push(`vibe ${id}`);
    for (const s of HOA_SIGN_SPOTS) if (onRoad(s.x, s.z)) hits.push(s.id);
    for (const s of GOLDEN_ACORN_SPOTS) if (onRoad(s.x, s.z)) hits.push(s.id);
    expect(hits).toEqual([]);
  }, 60_000);
});
