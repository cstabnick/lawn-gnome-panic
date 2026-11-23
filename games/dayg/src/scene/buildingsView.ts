// Building meshes (roadmap 10, issue 2.1). Each building is its own group: shell, fittings, one mesh per cut layer
// (floors and roof), each mesh with its own material so the roof and upper floors can fade while the player is inside.
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import { INTERIOR } from '../config';
import type { BuildingParts, BuildingStyle } from '../world/buildingTypes';
import type { BlockDef } from '../world/types';
import type { InteriorState } from '../game/interior';

export interface BuildingsView { root: THREE.Group; update(state: InteriorState, dt: number): void }

const SINK = 0.05;   // every block's bottom goes this far below its y (as worldBuilder)

const STYLE: Record<BuildingStyle, { shell: number; roof: number; fit: number }> = {
  plank: { shell: 0x7a5a3a, roof: 0x4e3b2a, fit: 0x9a7b55 },
  brick: { shell: 0x8a4b3a, roof: 0x4a4a4a, fit: 0x6b4a2e },
  marble: { shell: 0xd8d6d0, roof: 0x9c9a94, fit: 0xbdbab2 },
  stone: { shell: 0x8d8a83, roof: 0x5d5a55, fit: 0x77746d },
  cottage: { shell: 0xc9b48a, roof: 0x7a4a2a, fit: 0x6b4a2e },
};

interface CutLayer { mesh: THREE.InstancedMesh; mat: THREE.MeshLambertMaterial; building: string; layer: number; opacity: number }

/** One InstancedMesh of boxes, placed as worldBuilder places blocks (height + SINK, bottom at y - SINK). */
function boxesMesh(name: string, geo: THREE.BufferGeometry, blocks: readonly BlockDef[], mat: THREE.Material): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geo, mat, blocks.length);
  mesh.name = name;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  blocks.forEach((b, i) => {
    const h = b.h + SINK;
    p.set((b.x0 + b.x1) / 2, b.y - SINK + h / 2, (b.z0 + b.z1) / 2);
    s.set(b.x1 - b.x0, h, b.z1 - b.z0);
    mesh.setMatrixAt(i, m.compose(p, q, s));
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildBuildings(scene: THREE.Scene, parts: readonly BuildingParts[]): BuildingsView {
  const root = new THREE.Group();
  root.name = 'buildings';
  scene.add(root);

  const geo = new THREE.BoxGeometry(1, 1, 1);
  const cutLayers: CutLayer[] = [];

  for (const p of parts) {
    if (p.def.draft) continue;
    const id = p.def.id;
    const colours = STYLE[p.def.style];
    const group = new THREE.Group();
    group.name = `building-${id}`;
    root.add(group);

    const shell: BlockDef[] = [], fittings: BlockDef[] = [];
    const floors = new Map<number, BlockDef[]>(), roofs = new Map<number, BlockDef[]>();
    for (const b of p.blocks) {
      const role = p.role[b.id];
      if (role === 'wall' || role === 'inner' || role === 'lintel') shell.push(b);
      else if (role === 'stair' || role === 'shelf' || role === 'furniture') fittings.push(b);
      else if (role === 'floor' || role === 'roof') {
        const L = p.layer[b.id];
        const bucket = role === 'roof' ? roofs : floors;
        const list = bucket.get(L);
        if (list) list.push(b); else bucket.set(L, [b]);
      }
    }

    if (shell.length > 0) {
      const mat = new THREE.MeshLambertMaterial({ color: colours.shell });
      group.add(boxesMesh(`${id}-shell`, geo, shell, mat));
    }
    if (fittings.length > 0) {
      const mat = new THREE.MeshLambertMaterial({ color: colours.fit });
      group.add(boxesMesh(`${id}-fittings`, geo, fittings, mat));
    }

    const addLayers = (bucket: Map<number, BlockDef[]>, color: number): void => {
      for (const [L, list] of bucket) {
        const mat = new THREE.MeshLambertMaterial({ color });
        const mesh = boxesMesh(`${id}-layer-${L}`, geo, list, mat);
        group.add(mesh);
        cutLayers.push({ mesh, mat, building: id, layer: L, opacity: 1 });
      }
    };
    addLayers(floors, colours.fit);
    addLayers(roofs, colours.roof);

    // Ground floor: a flat quad over the interior, unless the ground floor is a pit.
    if (p.def.sunk === undefined) {
      const r = p.interior;
      const plane = new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0);
      plane.rotateX(-Math.PI / 2);
      plane.translate((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2);
      const floorColour = new THREE.Color(colours.fit).multiplyScalar(0.7);
      const floor = new THREE.Mesh(plane, flatLayer(new THREE.MeshLambertMaterial({ color: floorColour }), LAYER.area));
      floor.name = `${id}-floor`;
      floor.receiveShadow = true;
      group.add(floor);
    }
  }

  return {
    root,
    update(state: InteriorState, dt: number): void {
      const step = dt / INTERIOR.fadeSeconds;
      for (const L of cutLayers) {
        const target = state.building === L.building && L.layer > state.storey ? 0 : 1;
        if (L.opacity < target) L.opacity = Math.min(target, L.opacity + step);
        else if (L.opacity > target) L.opacity = Math.max(target, L.opacity - step);
        const fading = L.opacity < 1;
        L.mat.opacity = L.opacity;
        if (L.mat.transparent !== fading) {
          L.mat.transparent = fading;
          L.mat.needsUpdate = true;
        }
        L.mat.depthWrite = !fading;
        L.mesh.visible = L.opacity > 0;
      }
    },
  };
}
