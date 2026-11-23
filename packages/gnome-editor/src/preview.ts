// The 3D preview: one gnome on a turntable, drawn on the page's #game canvas.
import * as THREE from 'three';
import { createGnomeModel, GNORMAN_LOOK, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { createEmotePlayer, getEmote } from '@lawn/emotes';

export interface Preview {
  /** Replaces the gnome on the turntable. */
  setLook(look: GnomeLook): void;
  /** Plays an emote on the turntable gnome (a looping one runs 2 cycles then stops). */
  playEmote(id: string): void;
  dispose(): void;
}

/** The editor panel covers 340 px on the right in landscape and the bottom 50% in portrait. */
const PANEL_PX = 340;

/** Starts rendering to the given canvas (it fills the window; resize with it). */
export function createPreview(canvas: HTMLCanvasElement): Preview {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fd3f4);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 1.15, 3.4);
  camera.lookAt(0, 0.85, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x6a8f4a, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(3, 5, 4);
  sun.castShadow = true;
  scene.add(sun);

  // The ground disc the gnome stands on.
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(3, 48),
    new THREE.MeshStandardMaterial({ color: 0x5fae4e }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // The pose the turntable spins; the gnome itself is rebuilt on look changes, the pose is kept.
  const state: PlayerState = {
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    facing: 0,
    grounded: true,
    jumpsUsed: 0,
    stamina: 1,
    staminaDelay: 0,
    sprinting: false,
    exhausted: false,
  };

  let model: GnomeModel = createGnomeModel(GNORMAN_LOOK);
  scene.add(model.object);
  const emote = createEmotePlayer(model);
  /** Seconds left before a looping emote stops (set by playEmote). */
  let loopLeft = 0;

  const onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Shift the view so the gnome sits in the free part of the screen, not behind the editor panel.
    const landscape = w > h;
    const x = landscape ? PANEL_PX / 2 : 0;
    const y = landscape ? 0 : Math.round(h * 0.2);
    camera.setViewOffset(w, h, x, y, w, h);
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  onResize();

  let frame = 0;
  let last = performance.now();
  const loop = (now: number): void => {
    frame = requestAnimationFrame(loop);
    // Cap dt so a background tab does not jump the turntable when it comes back.
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (emote.current) {
      // Turn to face the camera while an emote plays, instead of spinning.
      state.facing = Math.atan2(Math.sin(state.facing), Math.cos(state.facing));
      state.facing += (0 - state.facing) * Math.min(1, dt * 6);
    } else {
      state.facing += dt * 0.6;
    }
    model.update(state, dt);
    emote.update(dt);
    if (loopLeft > 0) {
      loopLeft -= dt;
      if (loopLeft <= 0) emote.stop();
    }
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(loop);

  return {
    setLook(look: GnomeLook): void {
      scene.remove(model.object);
      const disposeNonPrefab = (obj: THREE.Object3D): void => {
        if (obj.userData.prefab) return; // @lawn/prefabs shares cached geometries/materials
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) m?.dispose();
        }
        for (const child of obj.children) disposeNonPrefab(child);
      };
      disposeNonPrefab(model.object);
      model = createGnomeModel(look);
      scene.add(model.object);
      emote.setModel(model);
    },
    playEmote(id: string): void {
      if (!emote.play(id)) return;
      const def = getEmote(id);
      loopLeft = def?.loop ? 2 * def.duration : 0;
    },
    dispose(): void {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    },
  };
}
