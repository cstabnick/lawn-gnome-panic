// The three.js side of the town: renderer, camera that follows my gnome, and the meshes of the current map
// (ground, walls or hedges, buildings, signs, prefab props). Avatars add their own models to `scene`.
// STUB: replaced by the world issue; keep the export names and signatures.
import * as THREE from 'three';
import type { MapDef } from './config';

/** What a tap or click on the canvas landed on. */
export type Pick =
  /** A building with a `link`: main.ts walks to that portal or spot and uses it. */
  | { kind: 'building'; id: string; link: string | null }
  /** A point on the ground (also returned for props and other meshes: the ground point under the ray). */
  | { kind: 'ground'; x: number; z: number };

export interface World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  /** Removes the previous map's meshes (never disposing prefab geometry) and builds this one. */
  load(map: MapDef): void;
  /** Canvas client coordinates (event.clientX / clientY) to what is under them, or null (sky). */
  pick(clientX: number, clientY: number): Pick | null;
  /** Eases the camera toward looking at (x, 0, z), clamped so it stays over the map. snap = jump there at once. */
  follow(x: number, z: number, dt: number, snap?: boolean): void;
  /** World point to CSS pixels relative to the viewport; visible false when behind the camera or off screen. */
  project(x: number, y: number, z: number): { x: number; y: number; visible: boolean };
  render(): void;
}

export function createWorld(canvas: HTMLCanvasElement): World {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fd3ff);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x557744, 2));
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 15, 15);
  camera.lookAt(0, 0, 0);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshLambertMaterial({ color: 0x7fb45a }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  return {
    renderer, scene, camera,
    load(map) {
      ground.geometry.dispose();
      ground.geometry = new THREE.PlaneGeometry(map.w, map.d);
      (ground.material as THREE.MeshLambertMaterial).color.setHex(map.ground);
    },
    pick(clientX, clientY) {
      const ndc = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.ray.intersectPlane(plane, new THREE.Vector3());
      return hit ? { kind: 'ground', x: hit.x, z: hit.z } : null;
    },
    follow(x, z) {
      camera.position.set(x, 15, z + 15);
      camera.lookAt(x, 0, z);
    },
    project(x, y, z) {
      const v = new THREE.Vector3(x, y, z).project(camera);
      return { x: (v.x + 1) / 2 * window.innerWidth, y: (1 - v.y) / 2 * window.innerHeight, visible: v.z < 1 };
    },
    render() {
      renderer.render(scene, camera);
    },
  };
}
