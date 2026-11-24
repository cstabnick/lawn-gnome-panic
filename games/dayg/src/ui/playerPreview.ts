// Live 3D rotating player gnome preview for the inventory screen, showing currently worn and held gear.
import * as THREE from 'three';
import { buildGear } from '@lawn/gnome';
import type { ItemId } from '../sim/types';
import { getItem } from '../items/defs';
import { makeGnome, playerLook } from '../scene/gnomes';

export interface PlayerPreview {
  sync(gear: { held: ItemId | null; back: ItemId | null; head: ItemId | null }): void;
  setActive(on: boolean): void;
  dispose(): void;
}

export function createPlayerPreview(container: HTMLElement): PlayerPreview {
  let active = false;
  let raf = 0;
  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let model: ReturnType<typeof makeGnome> | null = null;
  let yaw = 0.35;
  let dragging = false;
  let lastX = 0;
  let lastT = 0;
  let failed = false;

  let heldId: ItemId | null = null;
  let heldObj: THREE.Object3D | null = null;
  let backId: ItemId | null = null;
  let backObj: THREE.Object3D | null = null;
  let headId: ItemId | null = null;
  let headObj: THREE.Object3D | null = null;
  let latestGear: { held: ItemId | null; back: ItemId | null; head: ItemId | null } = { held: null, back: null, head: null };

  const hint = document.createElement('div');
  hint.textContent = 'Drag to rotate';
  hint.style.cssText = 'position:absolute;bottom:6px;left:0;right:0;text-align:center;font-size:11px;color:var(--dg-muted);pointer-events:none';
  container.appendChild(hint);

  function init(): void {
    if (renderer || failed) return;
    try {
      const w = Math.max(180, container.clientWidth || 220);
      const h = Math.max(160, container.clientHeight || 200);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab';
      container.prepend(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 20);
      camera.position.set(0, 1.15, 3.35);
      camera.lookAt(0, 0.85, 0);

      const hemi = new THREE.HemisphereLight(0xdce8d5, 0x2c3528, 1.15);
      const key = new THREE.DirectionalLight(0xffe7b8, 1.6);
      key.position.set(2, 3, 2.5);
      const rim = new THREE.DirectionalLight(0x88b4c8, 0.7);
      rim.position.set(-2, 1.5, -2);
      scene.add(hemi, key, rim);

      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.7, 0.12, 24),
        new THREE.MeshStandardMaterial({ color: 0x3b4735, roughness: 0.9 }),
      );
      plinth.position.y = -0.06;
      scene.add(plinth);

      model = makeGnome(playerLook());
      scene.add(model.object);
      applyGear(latestGear);

      renderer.domElement.addEventListener('pointerdown', (e) => {
        dragging = true;
        lastX = e.clientX;
        renderer?.domElement.setPointerCapture?.(e.pointerId);
      });
      window.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        yaw += (e.clientX - lastX) * 0.014;
        lastX = e.clientX;
      });
      window.addEventListener('pointerup', () => { dragging = false; });
    } catch {
      failed = true;
      hint.textContent = 'Gnome Preview';
    }
  }

  function applyGear(gear: { held: ItemId | null; back: ItemId | null; head: ItemId | null }): void {
    if (!model) return;
    if (gear.held !== heldId) {
      heldId = gear.held;
      if (heldObj) heldObj.removeFromParent();
      heldObj = null;
      if (heldId) {
        heldObj = buildGear('hand', getItem(heldId).prefab);
        model.arms.right.add(heldObj);
      }
      model.setEquipmentOverride?.('hand', heldId !== null);
    }
    if (gear.back !== backId) {
      backId = gear.back;
      if (backObj) backObj.removeFromParent();
      backObj = null;
      if (backId) {
        backObj = buildGear('back', getItem(backId).prefab);
        model.rig.add(backObj);
      }
      model.setEquipmentOverride?.('back', backId !== null);
    }
    if (gear.head !== headId) {
      headId = gear.head;
      if (headObj) headObj.removeFromParent();
      headObj = null;
      if (headId) {
        headObj = buildGear('head', getItem(headId).prefab);
        model.rig.add(headObj);
      }
      model.setEquipmentOverride?.('head', headId !== null);
      if (headId && model.hat) model.hat.visible = false;
      else if (!headId && model.hat) model.hat.visible = true;
    }
  }

  const zeroVel = new THREE.Vector3();
  const origin = new THREE.Vector3();
  function loop(now: number): void {
    if (!active) return;
    raf = requestAnimationFrame(loop);
    if (!renderer || !scene || !camera || !model) return;
    const dt = lastT ? Math.min(0.05, Math.max(0, (now - lastT) / 1000)) : 0.016;
    lastT = now;
    if (!dragging) yaw += dt * 0.45;

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0 && (renderer.domElement.width !== Math.round(w * renderer.getPixelRatio()) || renderer.domElement.height !== Math.round(h * renderer.getPixelRatio()))) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    model.update({ position: origin, velocity: zeroVel, facing: yaw, grounded: true, jumpsUsed: 0 }, dt);
    renderer.render(scene, camera);
  }

  return {
    sync(gear) {
      latestGear = gear;
      applyGear(gear);
    },
    setActive(on) {
      if (active === on) return;
      active = on;
      if (on) {
        init();
        lastT = 0;
        if (!failed) raf = requestAnimationFrame(loop);
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    dispose() {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      renderer?.dispose();
      renderer = null;
    },
  };
}
