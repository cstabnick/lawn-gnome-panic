import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createTubingView, MAX_NPC_TUBES, type TubeView } from './view';

const lines = (scene: THREE.Scene) => scene.children.filter((c) => (c as THREE.Line).isLine);
const tubes = (scene: THREE.Scene) => scene.children.filter((c) => c.name === 'npc-tube' && c.visible);

describe('tubing view: ropes', () => {
  it('draws one visible rope that sags below its ends when slack', () => {
    const scene = new THREE.Scene();
    const view = createTubingView(scene);
    view.ropes([{ ax: 0, ay: 0, az: 0, bx: 10, by: 0, bz: 0, rope: 12 }]);
    const visible = lines(scene).filter((l) => l.visible);
    expect(visible.length).toBe(1);
    const pos = (visible[0] as THREE.Line).geometry.getAttribute('position') as THREE.BufferAttribute;
    const mid = pos.getY(5);
    expect(mid).toBeLessThan(pos.getY(0));
    expect(mid).toBeLessThan(pos.getY(9));
    expect(pos.getY(0)).toBeCloseTo(0);
    expect(pos.getY(9)).toBeCloseTo(0);
  });
});

describe('tubing view: NPC tubes', () => {
  it('keeps at most MAX_NPC_TUBES visible from 8 keys', () => {
    const scene = new THREE.Scene();
    const view = createTubingView(scene);
    const v: TubeView = { x: 0, y: 0, z: 0, yaw: 0, lean: 0, riderUp: true, seed: 3 };
    for (let i = 0; i < 8; i++) view.npcTube(`k${i}`, { ...v, x: i });
    expect(tubes(scene).length).toBeLessThanOrEqual(MAX_NPC_TUBES);
    expect(tubes(scene).length).toBe(MAX_NPC_TUBES);
  });

  it('hides a tube when it is removed with null', () => {
    const scene = new THREE.Scene();
    const view = createTubingView(scene);
    const v: TubeView = { x: 0, y: 0, z: 0, yaw: 0, lean: 0, riderUp: true, seed: 3 };
    view.npcTube('me:0', v);
    expect(tubes(scene).length).toBe(1);
    view.npcTube('me:0', null);
    expect(tubes(scene).length).toBe(0);
  });
});
