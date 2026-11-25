// 3D camp radios at havens & roadside spots + portable pocket radio (KeyR).
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { PREFAB_SCALE } from '../config';
import type { Interact } from '../game/interact';
import type { PlayerState, Vec3 } from '../game/types';
import type { BlockoutMap } from '../world/types';
import type { Collider } from '../world/collide';
import { createRadioAudio } from '../audio/radio';

function makeRadioMesh(): THREE.Object3D {
  try {
    const obj = buildPrefab('gsr-boombox');
    obj.scale.setScalar(PREFAB_SCALE * 0.8);
    return obj;
  } catch {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.34, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x3b4238, roughness: 0.7 }),
    );
    body.position.y = 0.17;
    const ant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6),
      new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.6 }),
    );
    ant.position.set(0.2, 0.5, 0);
    g.add(body, ant);
    return g;
  }
}

export interface RadioSystem {
  update(dt: number): void;
  togglePortable(): void;
}

export function createRadioSystem(deps: {
  scene: THREE.Scene;
  map: BlockoutMap;
  interact: Interact;
  collider: Collider;
  getPlayer: () => PlayerState;
  onToast: (text: string) => void;
}): RadioSystem {
  const { scene, map, interact, collider, getPlayer, onToast } = deps;
  const radioAudio = createRadioAudio();
  const positions: Vec3[] = [];
  let portableOn = false;

  // Compact "Now Playing" mini-pill at bottom-left when a radio is audible.
  const pill = document.createElement('div');
  pill.id = 'dayg-radio-now-playing';
  pill.style.cssText = 'position:fixed;z-index:42;pointer-events:none;display:none;align-items:center;gap:6px;' +
    'left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));' +
    'max-width:min(300px,78vw);padding:6px 11px;border-radius:999px;' +
    'background:rgba(16,22,16,0.82);border:1px solid rgba(232,195,90,0.45);' +
    'color:#f2efe2;font:600 12px/1.3 system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.35);' +
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
  const uiParent = document.getElementById('ui') ?? document.body;
  uiParent.appendChild(pill);

  const spots = map.spots.filter((s) => s.kind === 'fire').slice(0, 4);
  spots.forEach((s, i) => {
    const rx = s.x + 1.4;
    const rz = s.z - 0.8;
    const ry = collider.groundAt(rx, rz, s.y + 1);
    const mesh = makeRadioMesh();
    mesh.position.set(rx, ry, rz);
    mesh.rotation.y = i * 0.9;
    scene.add(mesh);
    positions.push({ x: rx, y: ry, z: rz });

    interact.add({
      id: `radio:${s.id}`,
      x: rx, y: ry, z: rz,
      radius: 2.2,
      label: () => `Tune radio (${radioAudio.current().name})`,
      act: () => {
        const st = radioAudio.cycleStation();
        onToast(`📻 ${st.name} — ${st.tagline}`);
      },
    });
  });

  function togglePortable(): void {
    const st = radioAudio.cycleStation();
    portableOn = st.id !== 0;
    radioAudio.setPortable(portableOn);
    onToast(portableOn ? `📻 Pocket Radio: ${st.name}` : '📻 Pocket Radio: Off');
  }

  return {
    togglePortable,
    update(dt: number) {
      const p = getPlayer().pos;
      let minD = Infinity;
      for (const pos of positions) {
        const d = Math.hypot(pos.x - p.x, pos.z - p.z);
        if (d < minD) minD = d;
      }
      const prox = minD < 24 ? Math.max(0, 1 - minD / 24) : 0;
      radioAudio.setProximity(prox);
      radioAudio.tick(dt, (line) => onToast(line));

      const st = radioAudio.current();
      const audible = st.id !== 0 && (portableOn || prox > 0.05);
      if (audible) {
        pill.textContent = `📻 ${st.name}`;
        pill.style.display = 'inline-flex';
      } else {
        pill.style.display = 'none';
      }
    },
  };
}
