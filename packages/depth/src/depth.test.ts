import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { auditCoplanar, flatLayer, LAYER } from './index';

const plane = (size: number, y: number, color: number, layer?: number): THREE.Mesh => {
  const mat = new THREE.MeshBasicMaterial({ color });
  if (layer !== undefined) flatLayer(mat, layer);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), mat);
  m.position.y = y;
  return m;
};
const scene = (...meshes: THREE.Object3D[]): THREE.Scene => {
  const s = new THREE.Scene();
  s.add(...meshes);
  return s;
};
const CAM = { near: 0.1, far: 700, fovDeg: 60, viewportHeight: 800 };

describe('flatLayer', () => {
  it('gives each layer one more depth step of offset, toward the camera', () => {
    const m = flatLayer(new THREE.MeshBasicMaterial(), 'road');
    expect(m.polygonOffset).toBe(true);
    expect(m.polygonOffsetUnits).toBe(-LAYER.road);
    expect(m.polygonOffsetFactor).toBe(-LAYER.road);
    expect(flatLayer(new THREE.MeshBasicMaterial(), 0).polygonOffset).toBe(false);
  });
  it('keeps the ladder in order', () => {
    const order = Object.values(LAYER);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

describe('auditCoplanar', () => {
  it('flags two different surfaces in the same plane at every distance', () => {
    const r = auditCoplanar(scene(plane(10, 0, 0xff0000), plane(4, 0, 0x00ff00)), CAM);
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].fightsBeyond).toBe(0);
    expect(r.findings[0].kind).toBe('flicker');
  });

  it('flags a small y-lift as flickering beyond some distance', () => {
    const [f] = auditCoplanar(scene(plane(10, 0, 0xff0000), plane(4, 0.005, 0x00ff00)), CAM).findings;
    expect(f.fightsBeyond).toBeGreaterThan(50);
    expect(f.fightsBeyond).toBeLessThan(150);
  });

  it('passes layers set with flatLayer, even with no lift', () => {
    expect(auditCoplanar(scene(plane(10, 0, 0xff0000, LAYER.ground), plane(4, 0, 0x00ff00, LAYER.decal)), CAM).findings).toEqual([]);
  });

  it('catches a lifted decal whose ground has a stronger offset (it gets buried at range)', () => {
    const [f] = auditCoplanar(scene(plane(10, 0, 0xff0000, LAYER.road), plane(4, 0.015, 0x00ff00)), CAM).findings;
    expect(f.kind).toBe('buried');
    expect(f.fightsBeyond).toBeLessThan(CAM.far);
  });

  it('ignores same-looking surfaces, hidden ones, separated ones and opted-out ones', () => {
    const hidden = plane(4, 0, 0x00ff00);
    hidden.visible = false;
    const optOut = plane(4, 0, 0x0000ff);
    optOut.userData.zfightOk = true;
    const r = auditCoplanar(scene(plane(10, 0, 0xff0000), plane(4, 0, 0xff0000), hidden, optOut, plane(4, 0.5, 0x00ffff)), CAM);
    expect(r.findings).toEqual([]);
  });

  it('finds the side faces of a bar running through a post of the same depth', () => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), new THREE.MeshBasicMaterial({ color: 0x5a3a1e }));
    const bar = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0x8b6a3e }));
    post.position.set(3.2, 1.1, 0);
    bar.position.set(0, 1.6, 0);
    const r = auditCoplanar(scene(post, bar), CAM);
    expect(r.findings.length).toBeGreaterThan(0);
    expect(r.findings.every((f) => f.fightsBeyond === 0)).toBe(true);
  });

  it('does not flag flicker too small to see where it starts', () => {
    const tiny = (y: number, c: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: c }));
      m.position.y = y;
      return m;
    };
    expect(auditCoplanar(scene(tiny(0, 0xff0000), tiny(0.005, 0x00ff00)), CAM).findings).toEqual([]);
  });

  it('does not mistake a slightly tilted plane far away for a level one at another height', () => {
    // A 1-degree slope through (0, 0, 0): 230 m out its plane constant matches a level roof 4 m up.
    const slope = plane(600, 0, 0xff0000);
    slope.rotation.z = (Math.PI / 180) * 1;
    const roof = plane(3, 0, 0x00ff00);
    roof.position.set(230, 230 * Math.tan(Math.PI / 180) + 4, 0);
    expect(auditCoplanar(scene(slope, roof), CAM).findings).toEqual([]);
  });

  it('checks every instance of an instanced mesh', () => {
    const inst = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x00ff00 }), 2);
    inst.setMatrixAt(0, new THREE.Matrix4().makeTranslation(100, 5, 0));
    inst.setMatrixAt(1, new THREE.Matrix4().makeTranslation(0, 0, 0));
    expect(auditCoplanar(scene(plane(10, 0, 0xff0000), inst), CAM).findings).toHaveLength(1);
  });

  it('is self-contained, so tools/zfight.mjs can send its source into a page', () => {
    // Rebuild the function from its own text, with nothing in scope, and run it.
    const rebuilt = new Function(`return (${auditCoplanar.toString()})`)() as typeof auditCoplanar;
    expect(rebuilt(scene(plane(10, 0, 0xff0000), plane(4, 0, 0x00ff00)), CAM).findings).toHaveLength(1);
  });
});
