// The sun's shadow box: sized by the quality tier, centred a little ahead of the camera (the area behind it is mostly
// off screen), and snapped to whole shadow-map texels so shadow edges do not crawl as the player moves.
// Runs after the atmosphere and world.update have placed the sun: it keeps their light direction and only moves the box.
import * as THREE from 'three';

const f = new THREE.Vector3();
const r = new THREE.Vector3();
const u = new THREE.Vector3();
const c = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const look = new THREE.Vector3();

/** Sets the shadow map size and the box's half side (m). */
export function sizeSunShadow(sun: THREE.DirectionalLight, mapSize: number, extent: number): void {
  const sh = sun.shadow;
  if (sh.mapSize.x !== mapSize) {
    sh.mapSize.set(mapSize, mapSize);
    sh.map?.dispose();
    (sh as { map: THREE.WebGLRenderTarget | null }).map = null;
  }
  const cam = sh.camera;
  cam.left = -extent;
  cam.right = extent;
  cam.top = extent;
  cam.bottom = -extent;
  cam.updateProjectionMatrix();
}

/** Re-centres the shadow box on the focus, pushed `ahead` of it along the camera's view, snapped to texels. */
export function followSunShadow(sun: THREE.DirectionalLight, camera: THREE.Camera, focusX: number, focusZ: number): void {
  const cam = sun.shadow.camera;
  const extent = cam.right;
  f.subVectors(sun.target.position, sun.position);
  const dist = f.length();
  if (dist < 1e-3) return;
  f.divideScalar(dist);
  camera.getWorldDirection(look);
  look.y = 0;
  const ahead = extent * 0.45;
  if (look.lengthSq() > 1e-6) look.normalize().multiplyScalar(ahead);
  c.set(focusX + look.x, sun.target.position.y, focusZ + look.z);
  // Snap the centre to the shadow map's texel grid in the light's frame.
  r.crossVectors(f, UP);
  if (r.lengthSq() < 1e-6) r.set(1, 0, 0);
  r.normalize();
  u.crossVectors(r, f);
  const texel = (2 * extent) / sun.shadow.mapSize.x;
  const cr = Math.round(c.dot(r) / texel) * texel;
  const cu = Math.round(c.dot(u) / texel) * texel;
  const cf = c.dot(f);
  c.copy(r).multiplyScalar(cr).addScaledVector(u, cu).addScaledVector(f, cf);
  sun.target.position.copy(c);
  sun.position.copy(c).addScaledVector(f, -dist);
  sun.target.updateMatrixWorld();
}
