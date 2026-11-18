import * as THREE from 'three';
import type { Swatch } from '@lawn/prefabs';
import { buildGnomeokemon, type GnomeokemonEntry } from './prefabs/registry';

export interface ViewerOptions {
  tint?: Swatch | number;
  trim?: Swatch | number;
}

export interface GnomeokemonViewer {
  readonly element: HTMLElement;
  show(entry: GnomeokemonEntry, opts?: ViewerOptions): void;
  setGnomeScale(on: boolean): void;
  setAutoRotate(on: boolean): void;
  setAnimate(on: boolean): void;
  zoomBy(factor: number): void;
  resetView(): void;
}

function referenceGnome(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0x9aa895, transparent: true, opacity: 0.55, flatShading: true });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.21, 0.44, 10), mat);
  body.position.y = 0.22;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat);
  head.position.y = 0.54;
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.145, 0.38, 10), mat);
  hat.position.y = 0.86;
  g.add(body, head, hat);
  g.position.set(-0.62, 0, 0);
  return g;
}

function animateModel(root: THREE.Object3D, t: number): void {
  const head = root.getObjectByName('head');
  if (head) {
    head.rotation.y = Math.sin(t * 1.4) * 0.14;
    head.rotation.x = Math.sin(t * 2.1) * 0.05;
  }
  const sprout = root.getObjectByName('sprout');
  if (sprout) sprout.rotation.z = Math.sin(t * 2.4) * 0.12;

  const cap = root.getObjectByName('cap');
  if (cap) cap.rotation.z = Math.sin(t * 1.8) * 0.06;

  const tail = root.getObjectByName('tail');
  if (tail) tail.rotation.y = Math.sin(t * 5.2) * 0.35;

  const wings = root.getObjectByName('wings');
  if (wings) wings.rotation.x = Math.sin(t * 28) * 0.25;

  const blade = root.getObjectByName('blade');
  if (blade) blade.rotation.y = t * 14;

  const rope = root.getObjectByName('rope');
  if (rope) rope.position.z = -0.18 + Math.sin(t * 4) * 0.015;

  const arms = root.getObjectByName('arms');
  if (arms) arms.rotation.z = Math.sin(t * 1.6) * 0.06;

  const arm = root.getObjectByName('arm');
  if (arm) arm.rotation.x = Math.sin(t * 2.6) * 0.16;

  const claws = root.getObjectByName('claws');
  if (claws) claws.position.y = 0.22 + Math.abs(Math.sin(t * 2.5)) * 0.03;

  const core = root.getObjectByName('core');
  if (core) {
    const s = 1 + Math.sin(t * 4) * 0.12;
    core.scale.setScalar(s);
  }
}

export function createViewer(): GnomeokemonViewer {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    width: '100%',
    height: '340px',
    display: 'block',
    borderRadius: '10px',
    background: '#243528',
    cursor: 'grab',
    touchAction: 'none',
  });

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x243528);

  scene.add(new THREE.HemisphereLight(0xf6faee, 0x3b4d34, 1.85));
  const sun = new THREE.DirectionalLight(0xfff5de, 2.3);
  sun.position.set(2.4, 5.2, 3.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0x8bc7ff, 0.75);
  rim.position.set(-2.5, 2.0, -3.0);
  scene.add(rim);

  // Garden pedestal
  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.25, 0.08, 32),
    new THREE.MeshLambertMaterial({ color: 0x4f783b, flatShading: true }),
  );
  ground.position.y = -0.04;
  ground.receiveShadow = true;
  scene.add(ground);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.16, 0.02, 6, 36),
    new THREE.MeshLambertMaterial({ color: 0x7c786e, flatShading: true }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0;
  scene.add(ring);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 50);
  const turntable = new THREE.Group();
  scene.add(turntable);

  const gnome = referenceGnome();
  gnome.visible = false;
  scene.add(gnome);

  let model: THREE.Group | null = null;
  let yaw = 0.55;
  let pitch = 0.34;
  let dist = 2.0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let autoRotate = true;
  let animateIdle = true;
  const target = new THREE.Vector3(0, 0.3, 0);
  const clock = new THREE.Clock();

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
    canvas.setPointerCapture(e.pointerId);
  });
  const stopDrag = (): void => {
    dragging = false;
    canvas.style.cursor = 'grab';
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    yaw -= dx * 0.01;
    pitch = Math.min(1.35, Math.max(-0.15, pitch + dy * 0.01));
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      dist = Math.min(7, Math.max(0.45, dist * (1 + Math.sign(e.deltaY) * 0.1)));
    },
    { passive: false },
  );

  function frameView(): void {
    const box = new THREE.Box3();
    if (model) box.expandByObject(model);
    if (gnome.visible) box.expandByObject(gnome);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    target.copy(sphere.center);
    dist = (sphere.radius / Math.sin((camera.fov / 2) * (Math.PI / 180))) * 1.25;
  }

  function renderLoop(): void {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w > 0 && h > 0) {
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) {
        renderer.setPixelRatio(pr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    }

    const t = clock.getElapsedTime();
    if (autoRotate && !dragging) yaw += 0.006;
    if (model && animateIdle) {
      model.position.y = Math.sin(t * 2.2) * 0.012;
      animateModel(model, t);
    } else if (model) {
      model.position.y = 0;
    }

    camera.position.set(
      target.x + dist * Math.cos(pitch) * Math.sin(yaw),
      target.y + dist * Math.sin(pitch),
      target.z + dist * Math.cos(pitch) * Math.cos(yaw),
    );
    camera.lookAt(target);
    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);

  return {
    element: canvas,
    show(entry, opts = {}) {
      if (model) turntable.remove(model);
      model = buildGnomeokemon(entry, { tint: opts.tint, trim: opts.trim });
      turntable.add(model);
      frameView();
    },
    setGnomeScale(on) {
      gnome.visible = on;
      frameView();
    },
    setAutoRotate(on) {
      autoRotate = on;
    },
    setAnimate(on) {
      animateIdle = on;
    },
    zoomBy(factor) {
      dist = Math.min(7, Math.max(0.45, dist * factor));
    },
    resetView() {
      yaw = 0.55;
      pitch = 0.34;
      frameView();
    },
  };
}
