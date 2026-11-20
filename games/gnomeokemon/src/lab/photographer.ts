import { GNORMAN_LOOK, createGnomeModel, getMyGnome, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import { PALETTE } from '@lawn/prefabs';
import * as THREE from 'three';
import { loadSettings, type Settings } from '../settings';

/**
 * The player: a gnome (their own, from the Gnome Creator) standing on the shoulders of a carrier gnome and holding a
 * camera. The camera in the lab *is* this pair; you only see them in the Dressing Room mirror.
 */
export interface Photographer {
  readonly object: THREE.Group;
  /** Rebuild from the current settings and the player's gnome. */
  rebuild(): void;
  /** Idle animation; the camera is raised and flashes now and then. */
  update(t: number): void;
}

const hex = (s: Settings['carrierCoat']): number => PALETTE[s];

/** Scale a gnome so it is `height` tall with its feet on y = 0. */
function normalise(obj: THREE.Object3D, height: number): void {
  const bb = new THREE.Box3().setFromObject(obj);
  const k = height / Math.max(0.001, bb.max.y - bb.min.y);
  obj.scale.multiplyScalar(k);
  const bb2 = new THREE.Box3().setFromObject(obj);
  obj.position.y -= bb2.min.y;
}

function buildCamera(color: number): { group: THREE.Group; flash: THREE.Mesh } {
  const g = new THREE.Group();
  const body = new THREE.MeshLambertMaterial({ color, flatShading: true });
  const dark = new THREE.MeshLambertMaterial({ color: 0x222831, flatShading: true });
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.13), body);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.12, 12), dark);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, -0.005, 0.12);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.055, 12), new THREE.MeshBasicMaterial({ color: 0x6aa8ff }));
  glass.position.set(0, -0.005, 0.182);
  const bump = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.07), dark);
  bump.position.set(-0.09, 0.135, 0);
  const flash = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.03), new THREE.MeshBasicMaterial({ color: 0xfff6c8 }));
  flash.position.set(0.1, 0.09, 0.075);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 6, 16, Math.PI), dark);
  strap.rotation.z = Math.PI;
  strap.position.set(0, 0.04, 0);
  g.add(b, lens, glass, bump, flash, strap);
  return { group: g, flash };
}

export function createPhotographer(): Photographer {
  const object = new THREE.Group();
  let carrier: GnomeModel | null = null;
  let rider: GnomeModel | null = null;
  let cameraGroup: THREE.Group | null = null;
  let flash: THREE.Mesh | null = null;
  let flashLight: THREE.PointLight | null = null;
  let carrierRoot = new THREE.Group();
  let riderRoot = new THREE.Group();

  function rebuild(): void {
    object.clear();
    const s = loadSettings();

    // The carrier: a plain NPC gnome in the chosen coat and hat, arms up to hold the rider's ankles.
    const carrierLook: GnomeLook = { ...GNORMAN_LOOK, hat: hex(s.carrierHat), shirt: hex(s.carrierCoat), beard: 0xb9a07a };
    carrier = createGnomeModel(carrierLook);
    if (carrier.hat) carrier.hat.visible = false; // the rider stands where the hat would be
    carrier.arms.left.rotation.x = -2.7;
    carrier.arms.right.rotation.x = -2.7;
    carrierRoot = new THREE.Group();
    carrierRoot.add(carrier.object);
    normalise(carrier.object, 1.0);
    object.add(carrierRoot);

    // The rider: the player's own gnome (or the default Gnorman), standing on the carrier's shoulders.
    const mine = getMyGnome();
    rider = createGnomeModel(mine?.look ?? { ...GNORMAN_LOOK, hat: 0x2f64c9, shirt: 0xf2b630 });
    rider.arms.left.rotation.x = -1.0;
    rider.arms.right.rotation.x = -1.0;
    riderRoot = new THREE.Group();
    riderRoot.add(rider.object);
    normalise(rider.object, 0.95);
    riderRoot.position.y = 0.94;
    object.add(riderRoot);

    const cam = buildCamera(hex(s.cameraColor));
    cameraGroup = cam.group;
    flash = cam.flash;
    cameraGroup.position.set(0, 0.52, 0.26);
    riderRoot.add(cameraGroup);
    flashLight = new THREE.PointLight(0xfff4d0, 0, 7, 1.6);
    flashLight.position.set(0.1, 0.6, 0.5);
    riderRoot.add(flashLight);
  }
  rebuild();

  return {
    object,
    rebuild,
    update(t) {
      carrierRoot.rotation.z = Math.sin(t * 1.3) * 0.025;
      carrierRoot.position.y = Math.abs(Math.sin(t * 2.2)) * 0.012;
      riderRoot.rotation.y = Math.sin(t * 0.9) * 0.12;
      if (cameraGroup) {
        // Raise the camera to the eye now and then and fire the flash.
        const cycle = t % 5.5;
        const raise = cycle > 3.2 && cycle < 4.6 ? Math.sin(((cycle - 3.2) / 1.4) * Math.PI) : 0;
        cameraGroup.position.y = 0.52 + raise * 0.2;
        cameraGroup.position.z = 0.26 + raise * 0.05;
        const fire = cycle > 3.85 && cycle < 4.0;
        if (flash) (flash.material as THREE.MeshBasicMaterial).color.setHex(fire ? 0xffffff : 0xfff6c8);
        if (flashLight) flashLight.intensity = fire ? 14 : 0;
      }
    },
  };
}

/**
 * The mirror's reflection, cheated: the photographer is drawn from the front in a tiny hidden scene and that picture is
 * pasted onto the mirror in the Dressing Room.
 */
export interface Mirror {
  readonly texture: THREE.Texture;
  readonly aspect: number;
  /** Rebuild the pair after the settings or the player's gnome changed. */
  refresh(): void;
  /** Draw a fresh reflection. */
  render(renderer: THREE.WebGLRenderer, t: number): void;
  dispose(): void;
}

export function createMirror(): Mirror {
  const W = 320;
  const H = 480;
  const target = new THREE.WebGLRenderTarget(W, H);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x6a4a5a);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x4a3a44, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 4, 5);
  scene.add(key);

  // A bit of the room behind the reflection: wall, floor and a rug.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshLambertMaterial({ color: 0x5a3a2c }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshLambertMaterial({ color: 0x8a6a8a }));
  wall.position.set(0, 3, -2.2);
  scene.add(wall);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshLambertMaterial({ color: 0x7a3a5a }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.01;
  scene.add(rug);

  const duo = createPhotographer();
  scene.add(duo.object);

  const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 30);
  camera.position.set(0, 1.3, 4.6);
  camera.lookAt(0, 1.0, 0);

  return {
    texture: target.texture,
    aspect: W / H,
    refresh: () => duo.rebuild(),
    render(renderer, t) {
      duo.update(t);
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(prev);
    },
    dispose() {
      target.dispose();
    },
  };
}
