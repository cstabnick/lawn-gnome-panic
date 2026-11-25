// The water courses (rivers, the canal, the loch, the sea) are kept clear of biome scenery: no tree, rock or other
// collider centre sits on a course. The only colliders allowed on water are the driftwood raft's (it floats there),
// and the canal setpiece adds none.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from './testing/fakeDom';
import { onWaterCourse } from './water';

installFakeDom();
const { buildBiomes } = await import('./biomes');
const b = buildBiomes(new THREE.Scene());

// The raft's collider is 5.2 x 3.0 (the deck; see the 'driftwood-raft' setpiece, E03 L24); nothing else is that size on water.
const RAFT = { w: 5.2, d: 3.0 };

describe('biome scenery keeps off the water courses', () => {
  it('no collider centre sits on a course, except the driftwood raft', () => {
    const onCourse = b.boxes.filter((box) => {
      const cx = (box.minX + box.maxX) / 2;
      const cz = (box.minZ + box.maxZ) / 2;
      return onWaterCourse(cx, cz, 0);
    });
    const offenders = onCourse.filter((box) => {
      const w = box.maxX - box.minX;
      const d = box.maxZ - box.minZ;
      const isRaft = Math.abs(w - RAFT.w) < 1e-6 && Math.abs(d - RAFT.d) < 1e-6;
      return !isRaft;
    });
    expect(offenders.map((o) => ({ cx: (o.minX + o.maxX) / 2, cz: (o.minZ + o.maxZ) / 2 }))).toEqual([]);
  });
});
