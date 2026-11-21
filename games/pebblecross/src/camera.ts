import * as THREE from 'three';

export interface CameraRig {
  camera: THREE.PerspectiveCamera;
  follow(x: number, z: number, dt: number): void;   // eases the look-at point to x, z
  resize(width: number, height: number): void;
  zoom(delta: number): void;                        // clamped
}

const OFFSET = { x: 0, y: 22, z: 16 };   // camera offset from the look-at point at zoom 1
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 1.8;
const FOLLOW_RATE = 6;                   // exponential smoothing, per second

export function createCameraRig(town: { w: number; d: number }): CameraRig {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 400);
  const look = new THREE.Vector3(0, 0, 0);   // the town centre is (0, 0) in world space
  let zoomLevel = 1;

  const place = () => {
    camera.position.set(
      look.x + OFFSET.x * zoomLevel,
      look.y + OFFSET.y * zoomLevel,
      look.z + OFFSET.z * zoomLevel,
    );
    camera.lookAt(look);
    camera.updateMatrixWorld();
  };
  place();

  return {
    camera,
    follow(x: number, z: number, dt: number) {
      const k = 1 - Math.exp(-FOLLOW_RATE * Math.max(0, dt));
      look.x += (x - look.x) * k;
      look.z += (z - look.z) * k;
      place();
    },
    resize(width: number, height: number) {
      camera.aspect = height > 0 ? width / height : 1;
      camera.updateProjectionMatrix();
    },
    zoom(delta: number) {
      zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomLevel + delta));
      place();
    },
  };
}
