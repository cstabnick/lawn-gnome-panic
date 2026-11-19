import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { LobbyStage } from './config';
import { PEDESTAL_HEIGHT } from './config';

const GLOW = 0x9c6bff;
const SPARKLE_COUNT = 30;
const SPARKLE_RISE = 0.3;
const SPARKLE_LOW = 0.3;
const SPARKLE_HIGH = 2.2;

interface Sparkle {
  mesh: THREE.Mesh;
  angle: number;
  radius: number;
  y: number;
}

/** Pedestal and spotlights at the origin for the lobby screen. */
export function createLobbyStage(scene: THREE.Scene): LobbyStage {
  const group = new THREE.Group();

  // Pedestal: prefab 'lobby-pedestal' (built at lobby scale, so scale 1; its height is PEDESTAL_HEIGHT).
  group.add(buildPrefab('lobby-pedestal'));

  // Glow rings
  const glowMat = new THREE.MeshStandardMaterial({
    color: GLOW,
    emissive: GLOW,
    emissiveIntensity: 2,
  });
  const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.04, 12, 64), glowMat);
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = PEDESTAL_HEIGHT;
  group.add(topRing);

  const groundRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.025, 8, 64), glowMat);
  groundRing.rotation.x = Math.PI / 2;
  groundRing.position.y = 0.03;
  group.add(groundRing);

  // Lights
  const key = new THREE.SpotLight(0xffffff, 60, 14, 0.45, 0.5);
  key.position.set(2, 5, 4);
  key.target.position.set(0, 0.8, 0);
  key.castShadow = true;
  group.add(key, key.target);

  const purple = new THREE.PointLight(GLOW, 6, 6);
  purple.position.set(-1.5, 1.5, -1);
  const cyan = new THREE.PointLight(0x4dd0e1, 6, 6);
  cyan.position.set(1.5, 1.2, -1);
  group.add(purple, cyan);

  // Sparkles
  const sparkGeo = new THREE.OctahedronGeometry(0.03);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sparkles: Sparkle[] = [];
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const mesh = new THREE.Mesh(sparkGeo, sparkMat);
    const s: Sparkle = {
      mesh,
      angle: Math.random() * Math.PI * 2,
      radius: 1.2 + Math.random() * 1.0,
      y: SPARKLE_LOW + Math.random() * (SPARKLE_HIGH - SPARKLE_LOW),
    };
    placeSparkle(s);
    sparkles.push(s);
    // Sparkles disabled: next to the lobby camera they read as big white diamonds. Re-enable with group.add(mesh).
    void mesh;
  }

  scene.add(group);

  return {
    setVisible(visible: boolean) {
      group.visible = visible;
    },
    update(dt: number) {
      groundRing.rotation.z += dt * 0.3;
      for (const s of sparkles) {
        s.y += SPARKLE_RISE * dt;
        if (s.y > SPARKLE_HIGH) s.y = SPARKLE_LOW;
        placeSparkle(s);
      }
    },
  };
}

function placeSparkle(s: Sparkle): void {
  s.mesh.position.set(Math.cos(s.angle) * s.radius, s.y, Math.sin(s.angle) * s.radius);
}
